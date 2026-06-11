import { getAdminDb, getDb } from "./index";

// Matches TrendItem in /api/agents/trending/route.ts (same structure, avoids circular import)
type TrendDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export interface TrendDbItem {
  day: TrendDay;
  type: string;
  topic: string;
  summary: string;
  handle?: string;
  authority?: string;
  whatTheySaid?: string;
  post_url?: string;
  posted_at?: string;
}

function db() {
  return getAdminDb() ?? getDb();
}

export async function saveTrendingBatch(
  trends: TrendDbItem[],
  day: string,
  contentType: string
): Promise<void> {
  if (!trends.length) return;
  const client = getAdminDb(); // needs admin (write) — skip silently if not configured
  if (!client) return;
  const batchId = `${day}-${new Date().toISOString().slice(0, 13)}`; // e.g. Thursday-2026-06-11T14
  const rows = trends.map((t) => ({
    day,
    content_type: contentType,
    topic: t.topic,
    handle: t.handle ?? null,
    authority: t.authority ?? null,
    what_they_said: t.whatTheySaid ?? null,
    post_url: t.post_url ?? null,
    posted_at: t.posted_at ?? null,
    batch_id: batchId,
  }));
  const { error } = await client.from("trending_cache").insert(rows);
  if (error) console.error("[trending_cache] save error:", error.message);
}

export async function getFallbackTrends(
  day: string,
  excludeTopics: string[],
  limit: number
): Promise<TrendDbItem[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db()
    .from("trending_cache")
    .select("*")
    .eq("day", day)
    .gt("stored_at", since)
    .order("stored_at", { ascending: false })
    .limit(60); // fetch plenty, filter in JS

  if (error || !data?.length) return [];

  const excludeSet = new Set(excludeTopics.map((t) => t.toLowerCase().trim()));
  const filtered = data.filter(
    (row: { topic: string }) => !excludeSet.has(row.topic.toLowerCase().trim())
  );

  // Shuffle for variety so fallback topics differ each time
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return shuffled.slice(0, limit).map((row: any) => ({
    day: row.day as TrendDay,
    type: row.content_type as string,
    topic: row.topic as string,
    summary: "",
    handle: row.handle ?? undefined,
    authority: row.authority ?? undefined,
    whatTheySaid: row.what_they_said ?? undefined,
    post_url: row.post_url ?? undefined,
    posted_at: row.posted_at ?? undefined,
  }));
}

export async function cleanupOldTrends(): Promise<void> {
  const client = getAdminDb();
  if (!client) return;
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  await client.from("trending_cache").delete().lt("stored_at", cutoff);
}
