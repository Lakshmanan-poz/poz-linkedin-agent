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

// Lambda + API Gateway hard limit is 29s — keep well under it
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

  // Cap at 5 per call — x_search + 20 topics = 30s+ timeout
  // 5 topics = ~12-15s, safely under API Gateway 29s hard limit
  const count = 5;

  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  // Focused short prompt — less tokens = faster response
  const prompt = `Search X/Twitter for the ${count} most liked and most replied posts from the last 2 days (${since} to ${today}) about: ${day.hint}

Rules:
- Last 2 days only (after ${since})
- Highest likes + replies first
- Real accounts: founders, executives, researchers, investors
- Must include direct post URL with status ID

Return ONLY JSON, no markdown:
{
  "trends": [
    {
      "handle": "@username",
      "authority": "Role at Company",
      "whatTheySaid": "Exact post text",
      "topic": "LinkedIn headline 10-12 words",
      "post_url": "https://x.com/username/status/POST_ID",
      "posted_at": "2026-06-08T14:32:00Z"
    }
  ]
}`;

  try {
    const controller = new AbortController();
    // x.ai budget: 12s. Lambda cold start (Docker) can take up to 10s.
    // 10s cold start + 12s x.ai + 1s overhead = 23s — safely under the 25s
    // client AbortController and the 29s API Gateway hard limit.
    // Do NOT raise this — going over 25s sends the user the generic catch-block
    // "Sorry, couldn't fetch trends" message instead of a meaningful error.
    const timeoutId = setTimeout(() => controller.abort(), 12_000);

    // xAI Responses API with x_search tool (Live Search).
    // /v1/chat/completions search_parameters was retired (HTTP 410).
    // x_search requires grok-4 family on /v1/responses.
    // Use grok-4 (base, non-reasoning) — grok-4-fast-reasoning does chain-of-thought
    // which adds 10-20s of latency and blows the Lambda/API-Gateway budget.
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: process.env.XAI_MODEL ?? "grok-4.20-multi-agent",
        input: [{ role: "user", content: prompt }],
        tools: [
          {
            type:      "x_search",
            from_date: since,
            to_date:   today,
          },
        ],
        // text.format is the JSON-mode flag on /v1/responses;
        // response_format is chat/completions-only and 400s here.
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

    // /v1/responses returns either a convenience `output_text` string, or an
    // `output` array of message items whose `content[].text` holds the text.
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
      text = parts.join("\n");
    }

    // Real post URLs from x_search citations — entries may be plain URL strings
    // or objects carrying a `url` field. Normalise both to strings.
    const rawCitations: unknown[] = Array.isArray(raw.citations) ? raw.citations : [];
    const citations: string[] = rawCitations
      .map((c) =>
        typeof c === "string"
          ? c
          : c && typeof (c as { url?: unknown }).url === "string"
            ? (c as { url: string }).url
            : ""
      )
      .filter(Boolean);
    const postCitations = citations.filter((u: string) =>
      /x\.com\/\w+\/status\/\d+/.test(u)
    );

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

      // Priority: real /status/ URL from Grok → citation match by handle → citation by index → profile
      let post_url = t.post_url ?? "";
      if (!/x\.com\/\w+\/status\/\d+/.test(post_url)) {
        const matched = postCitations.find((u: string) =>
          u.toLowerCase().includes(`/${handle}/status/`)
        );
        post_url = matched
          ?? postCitations[i]
          ?? (handle ? `https://x.com/${handle}` : "");
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

    return NextResponse.json({ trends, day: day.day, contentType: day.type, source: "live" });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("abort") || msg.includes("timeout") || msg.includes("signal");
    return NextResponse.json({
      error: isTimeout
        ? "X search timed out. Try again — usually faster on retry."
        : `Failed: ${msg}`,
      trends: [],
    });
  }
}
