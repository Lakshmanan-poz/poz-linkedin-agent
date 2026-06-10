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
// x.ai x_search takes 13-23s per call. Caching means only the first call per
// Lambda lifetime is slow; all subsequent calls return instantly from memory.
type CacheEntry = { trends: TrendItem[]; day: string; contentType: string; fetchedAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

// Lambda + API Gateway hard limit is 29s
export const maxDuration = 30;

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

  // "more" requests pass already-seen topic titles so x.ai finds different ones
  const excludeParam = url.searchParams.get("exclude") ?? "";
  const excludeTopics = excludeParam
    ? excludeParam.split("|||").map((t) => t.trim()).filter(Boolean)
    : [];

  // Separate cache key for "more" batches so they don't collide with batch 1
  const batchKey = excludeTopics.length > 0 ? `-more${excludeTopics.length}` : "";
  const cacheKey = `${day.day}-${today}${batchKey}`;

  // Return cached result if fresh (avoids re-running 24s x.ai call every request)
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
${excludeLine}
Return ONLY JSON, no markdown:
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

  try {
    const controller = new AbortController();
    // x.ai x_search takes 13-23s regardless of model. Set 24s timeout so
    // the route always returns a JSON response (not a hung connection) before
    // the 26s client abort or the 29s API Gateway hard limit fires.
    const timeoutId = setTimeout(() => controller.abort(), 24_000);

    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: process.env.XAI_MODEL ?? "grok-4-fast-reasoning",
        input: [{ role: "user", content: prompt }],
        tools: [
          {
            type:      "x_search",
            from_date: since,
            to_date:   today,
          },
        ],
        text:              { format: { type: "json_object" } },
        temperature:       0.1,
        max_output_tokens: 1500,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `X.ai error ${res.status}: ${errBody}`, trends: [] },
        { status: 502 }
      );
    }

    const raw = await res.json();

    // /v1/responses returns output array; find the assistant message content
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

    // Normalise citations from annotations inside the message content
    const postCitations: string[] = [];
    if (Array.isArray(raw.output)) {
      for (const item of raw.output) {
        if (Array.isArray(item?.content)) {
          for (const c of item.content) {
            if (Array.isArray(c?.annotations)) {
              for (const a of c.annotations) {
                const u = typeof a?.url === "string" ? a.url : "";
                if (/x\.com\/\w+\/status\/\d+/.test(u)) postCitations.push(u);
              }
            }
          }
        }
      }
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No trending data returned. Try again.", trends: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      trends: {
        handle?: string; authority?: string; whatTheySaid?: string;
        topic: string; post_url?: string; posted_at?: string;
      }[];
    };

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

    // Populate cache so subsequent requests within this Lambda container are instant
    cache.set(cacheKey, { trends, day: day.day, contentType: day.type, fetchedAt: Date.now() });

    return NextResponse.json({ trends, day: day.day, contentType: day.type, source: "live" });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("abort") || msg.includes("timeout") || msg.includes("signal");
    return NextResponse.json({
      error: isTimeout
        ? "X search timed out (x.ai x_search takes 13-23s). Please try again — second attempt is usually faster."
        : `Failed: ${msg}`,
      trends: [],
    });
  }
}
