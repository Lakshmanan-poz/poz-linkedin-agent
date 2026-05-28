import { NextResponse } from "next/server";

const CATEGORIES = [
  "Finance / PE / VC",
  "SaaS / Tech",
  "Healthcare / MedTech",
  "AI / LLM",
  "Macro / Economy",
];

export async function GET() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "XAI_API_KEY not set" }, { status: 500 });

  const now        = new Date();
  const cutoff     = new Date(now.getTime() - 48 * 60 * 60 * 1000); // exactly 48 hours ago
  const fromDate   = cutoff.toISOString().split("T")[0];
  const toDate     = now.toISOString().split("T")[0];
  const fromISO    = cutoff.toISOString();   // used for strict post-filter

  const prompt = `Search X (Twitter) for posts that are ACTIVELY TRENDING right now in the last 2 days (${fromDate} to ${toDate}).

STRICT RULE: Only include posts published AFTER ${fromISO}. Reject anything older than 48 hours.

Only include posts that are:
- Trending or going viral on X (high engagement: replies, reposts, likes, or quotes)
- From credible voices (founders, investors, executives, researchers, journalists)
- Discussing a significant shift, announcement, or debate in one of these categories: ${CATEGORIES.join(", ")}

Find at least 12 real trending X posts (2-3 per category). For each post return:
- username: the @handle of the author
- user_title: their role/title (e.g. "CEO at OpenAI")
- quote: the exact post text (keep under 200 chars if long)
- topic: a short punchy topic headline that captures the trending discussion (under 12 words)
- category: one of the 5 categories above
- post_url: the direct URL to the X post (format: https://x.com/username/status/tweet_id)
- posted_at: the ISO 8601 timestamp of when the post was published (e.g. "2026-05-27T14:32:00Z")

Return ONLY a raw JSON array like:
[
  {
    "id": 1,
    "username": "@handle",
    "user_title": "Role at Company",
    "quote": "exact post text",
    "topic": "Short trending topic headline",
    "category": "Finance / PE / VC",
    "post_url": "https://x.com/handle/status/1234567890",
    "posted_at": "2026-05-27T14:32:00Z"
  }
]

No markdown, no explanation, only the JSON array.`;

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          {
            role: "system",
            content: "You are a real-time X (Twitter) trend analyst. Your job is to identify posts that are TRENDING or GOING VIRAL on X right now — high engagement, credible authors, significant topics. Only surface genuinely trending content from the last 2 days. Return structured JSON only.",
          },
          { role: "user", content: prompt },
        ],
        search_parameters: {
          mode: "on",
          sources: [{ type: "x" }],
          from_date: fromDate,
          to_date: toDate,
          max_search_results: 15,
        },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content ?? "[]";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const topics  = JSON.parse(cleaned);

    // Enrich with any citation URLs from Grok's live search response
    const citations: string[] = data.citations ?? [];
    topics.forEach((t: Record<string, unknown>, i: number) => {
      if (!t.post_url && citations[i]) t.post_url = citations[i];
      if (!t.post_url) {
        const handle = String(t.username ?? "").replace("@", "");
        t.post_url = handle ? `https://x.com/${handle}` : null;
      }
    });

    // Strict server-side filter: drop any post older than 48 hours
    const cutoffMs = cutoff.getTime();
    const filtered = topics.filter((t: Record<string, unknown>) => {
      if (!t.posted_at) return true; // keep if no timestamp (can't verify)
      const ts = new Date(String(t.posted_at)).getTime();
      return isNaN(ts) || ts >= cutoffMs;
    });

    // Re-index ids after filter
    filtered.forEach((t: Record<string, unknown>, i: number) => { t.id = i + 1; });

    return NextResponse.json({ topics: filtered, from_date: fromDate, to_date: toDate });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
