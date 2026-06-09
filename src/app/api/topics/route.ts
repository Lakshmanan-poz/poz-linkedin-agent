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

  const now      = new Date();
  const cutoff   = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const fromDate = cutoff.toISOString().split("T")[0];
  const toDate   = now.toISOString().split("T")[0];
  const fromISO  = cutoff.toISOString();

  const prompt = `Search X (Twitter) for posts that are TRENDING in the last 2 days (${fromDate} to ${toDate}).

STRICT RULES:
- Only include posts published AFTER ${fromISO} (within last 48 hours)
- Prioritize posts with the HIGHEST number of likes AND replies/comments — most engaged posts first
- Include posts that are trending this week: celebrated, widely discussed, or going viral
- Only credible voices: founders, investors, executives, researchers, journalists
- Categories: ${CATEGORIES.join(", ")}

CRITICAL — DO NOT MODIFY TOPIC TEXT:
- The "topic" field must be the EXACT trending topic, hashtag, or headline as it appears on X
- Do NOT summarize, rephrase, or shorten the topic
- Copy the topic verbatim from the post or trending section

Find at least 15 real trending X posts (2-3 per category), ranked by engagement (likes + comments).

For each post return:
- username: the @handle of the author
- user_title: their role/title (e.g. "CEO at OpenAI")
- quote: the exact post text (keep under 200 chars if long)
- topic: EXACT topic headline as it appears on X — do NOT change any words
- category: one of the 5 categories above
- post_url: direct URL to the X post (format: https://x.com/username/status/tweet_id)
- posted_at: ISO 8601 timestamp of when the post was published (e.g. "2026-05-27T14:32:00Z")
- like_count: number of likes on the post (integer)
- reply_count: number of replies/comments on the post (integer)

Sort the results by engagement (like_count + reply_count) descending — highest first.

Return ONLY a raw JSON array:
[
  {
    "id": 1,
    "username": "@handle",
    "user_title": "Role at Company",
    "quote": "exact post text",
    "topic": "Exact Topic Text From X — no changes",
    "category": "Finance / PE / VC",
    "post_url": "https://x.com/handle/status/1234567890",
    "posted_at": "2026-05-27T14:32:00Z",
    "like_count": 4200,
    "reply_count": 380
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
            content: "You are a real-time X (Twitter) trend analyst. Identify posts TRENDING or GOING VIRAL on X right now — prioritize by highest likes and comments. Return the EXACT topic text as it appears on X without any modification. Return structured JSON only.",
          },
          { role: "user", content: prompt },
        ],
        search_parameters: {
          mode: "on",
          sources: [{ type: "x" }],
          from_date: fromDate,
          to_date: toDate,
          max_search_results: 20,
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

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const topics  = JSON.parse(cleaned);

    const citations: string[] = data.citations ?? [];
    const postCitations = citations.filter((u: string) =>
      /x\.com\/\w+\/status\/\d+/.test(u)
    );

    topics.forEach((t: Record<string, unknown>, i: number) => {
      const handle = String(t.username ?? "").replace("@", "").toLowerCase();

      const grokUrl = String(t.post_url ?? "");
      if (/x\.com\/\w+\/status\/\d+/.test(grokUrl)) {
        t.post_url = grokUrl;
        return;
      }

      const matched = postCitations.find((u: string) =>
        u.toLowerCase().includes(`/${handle}/status/`)
      );
      if (matched) { t.post_url = matched; return; }

      if (postCitations[i]) { t.post_url = postCitations[i]; return; }

      const query = encodeURIComponent(`from:${handle} ${String(t.quote ?? "").slice(0, 60)}`);
      t.post_url = `https://x.com/search?q=${query}&f=live`;
    });

    const cutoffMs = cutoff.getTime();
    const filtered = topics.filter((t: Record<string, unknown>) => {
      if (!t.posted_at) return true;
      const ts = new Date(String(t.posted_at)).getTime();
      return isNaN(ts) || ts >= cutoffMs;
    });

    // Sort by engagement (like_count + reply_count) descending
    filtered.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const engA = (Number(a.like_count) || 0) + (Number(a.reply_count) || 0);
      const engB = (Number(b.like_count) || 0) + (Number(b.reply_count) || 0);
      return engB - engA;
    });

    filtered.forEach((t: Record<string, unknown>, i: number) => { t.id = i + 1; });

    return NextResponse.json({ topics: filtered, from_date: fromDate, to_date: toDate });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
