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

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url    = new URL(request.url);
  const day    = getDayConfig(url.searchParams.get("day"));
  const count  = Math.min(Math.max(parseInt(url.searchParams.get("count") ?? "10", 10), 1), 20);
  const xaiKey = process.env.XAI_API_KEY;

  if (!xaiKey) {
    return NextResponse.json({ error: "XAI_API_KEY not set", trends: [] }, { status: 500 });
  }

  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Search X/Twitter RIGHT NOW for the most liked and most replied posts from the last 2 days (${since} to ${today}).

Find ${count} REAL trending X posts from B2B thought leaders, founders, CTOs, and executives about: ${day.hint}

REQUIREMENTS:
- Only posts from the last 2 days (after ${since})
- Prioritize posts with the MOST likes and replies — highest engagement first
- Real accounts only: verified executives, researchers, investors, analysts
- Each post must have a real direct URL (x.com/username/status/POST_ID)

Return ONLY valid JSON — no markdown, no explanation:
{
  "trends": [
    {
      "handle": "@username",
      "authority": "Title at Company",
      "whatTheySaid": "Their exact post text (1-2 sentences)",
      "topic": "compelling LinkedIn topic headline (10-15 words)",
      "summary": "1-2 sentences on why it matters to B2B leaders",
      "post_url": "https://x.com/username/status/REAL_POST_ID",
      "posted_at": "2026-06-08T14:32:00Z"
    }
  ]
}`;

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 25_000);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "x_search" }],
        temperature: 0.1,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json({ error: `X.ai error: ${res.status} — ${errBody}`, trends: [] }, { status: 502 });
    }

    const raw  = await res.json();
    const text: string = raw.choices?.[0]?.message?.content ?? "";

    // Extract real post citations (x.com/.../status/...) from response
    const citations: string[] = raw.citations ?? [];
    const postCitations = citations.filter((u: string) => /x\.com\/\w+\/status\/\d+/.test(u));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No trending data returned", trends: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      trends: {
        handle?: string; authority?: string; whatTheySaid?: string;
        topic: string; summary: string; post_url?: string; posted_at?: string;
      }[];
    };

    const items = parsed.trends?.filter((t) => t.topic) ?? [];
    if (items.length === 0) {
      return NextResponse.json({ error: "No trending topics found right now, try again shortly.", trends: [] });
    }

    const trends: TrendItem[] = items.slice(0, count).map((t, i) => {
      const handle = (t.handle ?? "").replace("@", "").toLowerCase();

      // 1. Use Grok's post_url if it's a real post link
      let post_url = t.post_url ?? "";
      if (/x\.com\/\w+\/status\/\d+/.test(post_url)) {
        // valid direct post URL — use as-is
      } else {
        // 2. Find matching citation by handle
        const matched = postCitations.find((u: string) =>
          u.toLowerCase().includes(`/${handle}/status/`)
        );
        // 3. Use any citation by index, or fall back to profile
        post_url = matched ?? postCitations[i] ?? (handle ? `https://x.com/${handle}` : "");
      }

      return {
        day:          day.day as TrendItem["day"],
        type:         day.type,
        topic:        t.topic,
        summary:      t.summary,
        handle:       t.handle,
        authority:    t.authority,
        whatTheySaid: t.whatTheySaid,
        post_url:     post_url || undefined,
        posted_at:    t.posted_at,
      };
    });

    return NextResponse.json({ trends, day: day.day, contentType: day.type, source: "live" });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("abort") || msg.includes("timeout");
    return NextResponse.json({
      error: isTimeout
        ? "X live search took too long. Please try again."
        : `Failed to fetch trending topics: ${msg}`,
      trends: [],
    });
  }
}
