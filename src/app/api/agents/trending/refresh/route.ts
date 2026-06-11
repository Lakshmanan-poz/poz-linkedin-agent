import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { saveTrendingBatch, cleanupOldTrends } from "@/lib/db/trending-cache";
import { fetchOnce, getDayConfig, DAY_TYPES } from "../route";
import type { TrendItem } from "../route";

// Cron job endpoint — call this every 20 minutes to keep the DB stocked with
// fresh topics so the fallback always has variety.
// Auth: session cookie OR x-cron-secret header (set CRON_SECRET env var).
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const cronSecret    = process.env.CRON_SECRET;
  const headerSecret  = request.headers.get("x-cron-secret");
  const cookieToken   = request.cookies.get(COOKIE_NAME)?.value;
  const authedByCron  = cronSecret && headerSecret === cronSecret;
  const authedByUser  = cookieToken && (await verifyToken(cookieToken));

  if (!authedByCron && !authedByUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url    = new URL(request.url);
  // Optional ?day=Monday param — defaults to today's day
  const day    = getDayConfig(url.searchParams.get("day"));
  const xaiKey = process.env.XAI_API_KEY;

  if (!xaiKey) {
    return NextResponse.json({ error: "XAI_API_KEY not set" }, { status: 500 });
  }

  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Search X/Twitter for the 3 most liked and most replied posts from the last 2 days (${since} to ${today}) about: ${day.hint}

Rules:
- Last 2 days only (after ${since})
- Highest likes + replies first
- Real accounts: founders, executives, researchers, investors
- Must include direct post URL with status ID
Return ONLY valid JSON, no markdown:
{
  "trends": [
    {
      "handle": "@username",
      "authority": "Role at Company",
      "whatTheySaid": "Exact post text",
      "topic": "LinkedIn headline 10-12 words",
      "post_url": "https://x.com/username/status/POST_ID",
      "posted_at": "${today}T14:32:00Z"
    }
  ]
}`;

  let text = "";
  try {
    text = await fetchOnce(prompt, since, today, xaiKey, 27_000);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Fetch failed: ${msg}`, saved: 0 });
  }

  if (!text) {
    return NextResponse.json({ error: "Empty response from xAI", saved: 0 });
  }

  const urlMatches   = text.match(/https?:\/\/x\.com\/\w+\/status\/\d+/g) ?? [];
  const postCitations = [...urlMatches];
  const jsonMatch    = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "No JSON in response", saved: 0 });
  }

  let parsed: { trends: { handle?: string; authority?: string; whatTheySaid?: string; topic: string; post_url?: string; posted_at?: string }[] } | null = null;
  try { parsed = JSON.parse(jsonMatch[0]); } catch {
    return NextResponse.json({ error: "JSON parse failed", saved: 0 });
  }

  const items = parsed?.trends?.filter((t) => t.topic) ?? [];
  if (!items.length) {
    return NextResponse.json({ error: "No topics in response", saved: 0 });
  }

  const trends: TrendItem[] = items.slice(0, 3).map((t, i) => {
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

  await saveTrendingBatch(trends, day.day, day.type);

  // Clean up topics older than 72 hours in the background
  cleanupOldTrends().catch(() => {});

  return NextResponse.json({
    saved: trends.length,
    day:   day.day,
    contentType: day.type,
    topics: trends.map((t) => t.topic),
  });
}

// Bulk seed endpoint — POST with { days?: string[] } to fill all 5 day types.
// Fires all 5 in parallel. Use once to pre-populate the DB before a demo.
export async function POST(request: NextRequest) {
  const cronSecret   = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("x-cron-secret");
  const cookieToken  = request.cookies.get(COOKIE_NAME)?.value;
  const authedByCron = cronSecret && headerSecret === cronSecret;
  const authedByUser = cookieToken && (await verifyToken(cookieToken));

  if (!authedByCron && !authedByUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const xaiKey = process.env.XAI_API_KEY;
  if (!xaiKey) return NextResponse.json({ error: "XAI_API_KEY not set" }, { status: 500 });

  const body  = await request.json().catch(() => ({})) as { days?: string[] };
  const days  = body.days ?? DAY_TYPES.map((d) => d.day);
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  // Fire all requested days in parallel — each gets 3 topics
  const results = await Promise.allSettled(
    days.map(async (dayName) => {
      const dayConfig = getDayConfig(dayName);
      const prompt = `Search X/Twitter for the 3 most liked and most replied posts from the last 2 days (${since} to ${today}) about: ${dayConfig.hint}

Rules:
- Last 2 days only (after ${since})
- Highest likes + replies first
- Real accounts: founders, executives, researchers, investors
- Must include direct post URL with status ID
Return ONLY valid JSON, no markdown:
{"trends":[{"handle":"@username","authority":"Role at Company","whatTheySaid":"post text","topic":"headline 10-12 words","post_url":"https://x.com/u/status/ID","posted_at":"${today}T12:00:00Z"}]}`;

      const text = await fetchOnce(prompt, since, today, xaiKey, 27_000);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { day: dayName, saved: 0 };
      const parsed = JSON.parse(jsonMatch[0]);
      const items = parsed?.trends?.filter((t: { topic?: string }) => t.topic) ?? [];
      if (!items.length) return { day: dayName, saved: 0 };

      const trends: TrendItem[] = items.slice(0, 3).map((t: { handle?: string; authority?: string; whatTheySaid?: string; topic: string; post_url?: string; posted_at?: string }, i: number) => {
        const handle = (t.handle ?? "").replace("@", "").toLowerCase();
        let post_url = t.post_url ?? "";
        if (!/x\.com\/\w+\/status\/\d+/.test(post_url)) {
          const urlMatches = text.match(/https?:\/\/x\.com\/\w+\/status\/\d+/g) ?? [];
          post_url = urlMatches[i] ?? (handle ? `https://x.com/${handle}` : "");
        }
        return { day: dayConfig.day as TrendItem["day"], type: dayConfig.type, topic: t.topic, summary: "", handle: t.handle, authority: t.authority, whatTheySaid: t.whatTheySaid, post_url: post_url || undefined, posted_at: t.posted_at };
      });

      await saveTrendingBatch(trends, dayConfig.day, dayConfig.type);
      return { day: dayName, saved: trends.length, topics: trends.map((t) => t.topic) };
    })
  );

  cleanupOldTrends().catch(() => {});

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : { day: "unknown", saved: 0, error: String(r.reason) }
  );
  const totalSaved = summary.reduce((acc, r) => acc + ((r as { saved?: number }).saved ?? 0), 0);
  return NextResponse.json({ totalSaved, results: summary });
}
