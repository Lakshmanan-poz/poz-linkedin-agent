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

// In-memory cache — survives across requests within the same Lambda container.
type CacheEntry = { trends: TrendItem[]; day: string; contentType: string; fetchedAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000;

// Lambda hard limit is 29s. chat/completions + search_parameters finishes in 3-8s.
export const maxDuration = 30;

// Single attempt using chat/completions + search_parameters (3-8s, not 13-23s like x_search tool)
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
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        search_parameters: {
          mode: "on",
          sources: [{ type: "x" }],
          max_search_results: 10,
          from_date: since,
          to_date: today,
        },
        stream: false,
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    const raw = await res.json();
    return (raw.choices?.[0]?.message?.content as string) ?? "";
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

  // Return cached result if fresh
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
${excludeLine}Return ONLY valid JSON, no markdown fences:
{
  "trends": [
    {
      "handle": "@username",
      "authority": "Role at Company",
      "whatTheySaid": "Exact post text",
      "topic": "LinkedIn headline 10-12 words",
      "post_url": "https://x.com/username/status/POST_ID",
      "posted_at": "2026-06-09T14:32:00Z"
    }
  ]
}`;

  // Auto-retry: try twice with 12s each (total ≤ 24s, well within 30s Lambda limit).
  // chat/completions + search_parameters typically finishes in 3-8s so the second
  // attempt is almost never needed — but it means the user never sees a timeout error.
  let text = "";
  let lastErr = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      text = await fetchOnce(prompt, since, today, xaiKey, 12_000);
      if (text) break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }

  if (!text) {
    return NextResponse.json({
      error: `Could not fetch trending data. Please try again. (${lastErr})`,
      trends: [],
    });
  }

  // Extract any x.com URLs from the response text as citation backup
  const urlMatches = text.match(/https?:\/\/x\.com\/\w+\/status\/\d+/g) ?? [];

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "No trending data returned. Try again.", trends: [] });
  }

  let parsed: { trends: { handle?: string; authority?: string; whatTheySaid?: string; topic: string; post_url?: string; posted_at?: string }[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "Malformed response. Try again.", trends: [] });
  }

  const items = parsed.trends?.filter((t) => t.topic) ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No trending topics found. Try again in a moment.", trends: [] });
  }

  const trends: TrendItem[] = items.slice(0, count).map((t, i) => {
    const handle = (t.handle ?? "").replace("@", "").toLowerCase();
    let post_url = t.post_url ?? "";
    if (!/x\.com\/\w+\/status\/\d+/.test(post_url)) {
      const matched = urlMatches.find((u) => u.toLowerCase().includes(`/${handle}/status/`));
      post_url = matched ?? urlMatches[i] ?? (handle ? `https://x.com/${handle}` : "");
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
