import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const DAY_TYPES = [
  { day: "Monday",    type: "Thought Leadership", hint: "AI trends, business outcomes, leadership decisions, executive mindset" },
  { day: "Tuesday",   type: "Engagement Post",    hint: "industry challenges, provocative questions, hot debates, controversial takes" },
  { day: "Wednesday", type: "Tool Spotlight",     hint: "new AI tools, software releases, product launches, tech comparisons" },
  { day: "Thursday",  type: "Industry Insight",   hint: "market news, sector updates, business intelligence, analyst reports" },
  { day: "Friday",    type: "Forward-Looking",    hint: "predictions, lessons learned, future of work, strategic shifts" },
];

export type TrendItem = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  type: string;
  topic: string;
  summary: string;
  handle?: string;
  authority?: string;
  whatTheySaid?: string;
  post_url?: string;
  posted_at?: string;
};

function getDayConfig(dayParam?: string | null) {
  if (dayParam) {
    const found = DAY_TYPES.find((d) => d.day.toLowerCase() === dayParam.toLowerCase());
    if (found) return found;
  }
  const idx = new Date().getDay();
  return DAY_TYPES[idx >= 1 && idx <= 5 ? idx - 1 : 0];
}

type CacheEntry = { trends: TrendItem[]; day: string; contentType: string; fetchedAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000;

// Lambda + API Gateway hard limit is 29s. x_search takes 13-23s.
// We use grok-3 (no reasoning step = faster) and a 26s abort so the route
// always returns a JSON response before API Gateway kills the connection.
export const maxDuration = 30;

async function fetchOnce(
  prompt: string,
  since: string,
  today: string,
  xaiKey: string,
  timeoutMs: number
): Promise<string> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Agent Tools API — x_search tool via /v1/responses (chat/completions
    // search_parameters was deprecated with HTTP 410).
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: process.env.XAI_MODEL ?? "grok-4-fast-reasoning",
        input: [{ role: "user", content: prompt }],
        tools: [{ type: "x_search", from_date: since, to_date: today }],
        text: { format: { type: "json_object" } },
        temperature: 0.1,
        max_output_tokens: 1500,
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${body}`);
    }

    const raw = await res.json();

    // /v1/responses wraps text in output array
    let text: string = typeof raw.output_text === "string" ? raw.output_text : "";
    if (!text && Array.isArray(raw.output)) {
      const parts: string[] = [];
      for (const item of raw.output) {
        if (Array.isArray(item?.content)) {
          for (const c of item.content) {
            if (typeof c?.text === "string") parts.push(c.text);
          }
        }
      }
      text = parts.join("");
    }
    return text;
  } finally {
    clearTimeout(tid);
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url    = new URL(request.url);
  const day    = getDayConfig(url.searchParams.get("day"));
  const xaiKey = process.env.XAI_API_KEY;

  if (!xaiKey) {
    return NextResponse.json({ error: "XAI_API_KEY not set", trends: [] }, { status: 500 });
  }

  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const excludeParam  = url.searchParams.get("exclude") ?? "";
  const excludeTopics = excludeParam
    ? excludeParam.split("|||").map((t) => t.trim()).filter(Boolean)
    : [];

  const batchKey = excludeTopics.length > 0 ? `-more${excludeTopics.length}` : "";
  const cacheKey = `${day.day}-${today}${batchKey}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      trends: cached.trends,
      day: cached.day,
      contentType: cached.contentType,
      source: "cache",
    });
  }

  const count = 3;

  const excludeLine = excludeTopics.length > 0
    ? `- Do NOT return topics similar to these already shown: ${excludeTopics.map((t) => `"${t}"`).join(", ")}\n`
    : "";

  const prompt = `Search X/Twitter for the ${count} most liked and most replied posts from the last 2 days (${since} to ${today}) about: ${day.hint}

Rules:
- Last 2 days only (after ${since})
- Highest likes + replies first
- Real accounts: founders, executives, researchers, investors
- Must include direct post URL with status ID
${excludeLine}Return ONLY valid JSON, no markdown:
{
  "trends": [
    {
      "handle": "@username",
      "authority": "Role at Company",
      "whatTheySaid": "Exact post text",
      "topic": "LinkedIn headline 10-12 words",
      "post_url": "https://x.com/username/status/POST_ID",
      "posted_at": "2026-06-11T14:32:00Z"
    }
  ]
}`;

  // Try up to 2 times. x_search typically takes 13-23s; grok-3 (no reasoning)
  // shaves off the reasoning overhead. First attempt timeout: 25s. If it aborts,
  // the second attempt (Lambda has already warmed) usually finishes in 13-17s.
  // Total worst-case: 25s + 17s = 42s theoretical — but the outer Lambda hard
  // limit at 29s means only one full attempt runs per Lambda invocation.
  // In practice, one attempt is enough; the retry is a safety net for edge cases.
  let text = "";
  let lastErr = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      text = await fetchOnce(prompt, since, today, xaiKey, 25_000);
      if (text) break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }

  if (!text) {
    return NextResponse.json({ error: `Unable to fetch trending data. Please try again.`, trends: [] });
  }

  // Extract citation URLs from the full response text as fallback for post_url
  const urlMatches = text.match(/https?:\/\/x\.com\/\w+\/status\/\d+/g) ?? [];

  // Collect annotation citations from raw output
  const postCitations: string[] = [...urlMatches];

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "No trending data returned. Try again.", trends: [] });
  }

  let parsed: { trends: { handle?: string; authority?: string; whatTheySaid?: string; topic: string; post_url?: string; posted_at?: string }[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "Malformed response from API. Try again.", trends: [] });
  }

  const items = parsed.trends?.filter((t) => t.topic) ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No trending topics found. Try again in a moment.", trends: [] });
  }

  const trends: TrendItem[] = items.slice(0, count).map((t, i) => {
    const handle = (t.handle ?? "").replace("@", "").toLowerCase();
    let post_url = t.post_url ?? "";
    if (!/x\.com\/\w+\/status\/\d+/.test(post_url)) {
      const matched = postCitations.find((u) => u.toLowerCase().includes(`/${handle}/status/`));
      post_url = matched ?? postCitations[i] ?? (handle ? `https://x.com/${handle}` : "");
    }
    return {
      day:          day.day as TrendItem["day"],
      type:         day.type,
      topic:        t.topic,
      summary:      "",
      handle:       t.handle,
      authority:    t.authority,
      whatTheySaid: t.whatTheySaid,
      post_url:     post_url || undefined,
      posted_at:    t.posted_at,
    };
  });

  cache.set(cacheKey, { trends, day: day.day, contentType: day.type, fetchedAt: Date.now() });
  return NextResponse.json({ trends, day: day.day, contentType: day.type, source: "live" });
}
