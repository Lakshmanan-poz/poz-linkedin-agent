import { getDb } from "./index";
import { Post, PostRevision, PostStatusHistory, PostStatus, PostType } from "../types";

const POST_SELECT_COLS =
  "id, title, content, post_type, status, platform, author_id, assigned_designer_id, scheduled_date, published_url, ai_prompt, ai_model, carousel_slides, hashtags, notes, created_at, updated_at";
const REVISION_SELECT_COLS = "id, post_id, content, revised_by, revision_type, created_at";
const STATUS_HISTORY_SELECT_COLS = "id, post_id, from_status, to_status, changed_by, note, created_at";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function getMemberNameMap(ids: number[]): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();

  const db = getDb();
  const { data, error } = await db.from("team_members").select("id, name").in("id", ids);

  if (error) throw new Error(`Failed to fetch member names: ${error.message}`);
  return new Map((data || []).map((member) => [member.id, member.name]));
}

async function enrichPostsWithNames(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;

  const memberIds = Array.from(
    new Set(
      posts
        .flatMap((post) => [post.author_id, post.assigned_designer_id])
        .filter((id): id is number => typeof id === "number")
    )
  );

  const nameMap = await getMemberNameMap(memberIds);

  return posts.map((post) => ({
    ...post,
    author_name: nameMap.get(post.author_id),
    designer_name:
      typeof post.assigned_designer_id === "number"
        ? nameMap.get(post.assigned_designer_id)
        : undefined,
  }));
}

export async function getAllPosts(filters?: {
  status?: PostStatus;
  post_type?: PostType;
  author_id?: number;
  search?: string;
}): Promise<Post[]> {
  const db = getDb();
  let query = db.from("posts").select(POST_SELECT_COLS).order("updated_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.post_type) query = query.eq("post_type", filters.post_type);
  if (filters?.author_id) query = query.eq("author_id", filters.author_id);
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch posts: ${error.message}`);

  return enrichPostsWithNames((data || []) as Post[]);
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const db = getDb();
  const { data, error } = await db.from("posts").select(POST_SELECT_COLS).eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to fetch post: ${error.message}`);
  if (!data) return undefined;

  const [post] = await enrichPostsWithNames([data as Post]);
  return post;
}

export async function createPost(data: {
  title: string;
  content: string;
  post_type: PostType;
  author_id: number;
  platform?: string;
  ai_prompt?: string;
  ai_model?: string;
  carousel_slides?: string;
  hashtags?: string;
  scheduled_date?: string;
}): Promise<Post> {
  const db = getDb();
  const { data: created, error } = await db
    .from("posts")
    .insert({
      title: data.title,
      content: data.content,
      post_type: data.post_type,
      author_id: data.author_id,
      platform: data.platform || "linkedin",
      ai_prompt: data.ai_prompt || null,
      ai_model: data.ai_model || null,
      carousel_slides: data.carousel_slides || null,
      hashtags: data.hashtags || null,
      scheduled_date: data.scheduled_date || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create post: ${error.message}`);

  const postId = created.id;

  const { error: historyError } = await db.from("post_status_history").insert({
    post_id: postId,
    from_status: null,
    to_status: "draft",
    changed_by: data.author_id,
  });
  if (historyError) throw new Error(`Failed to create status history: ${historyError.message}`);

  const { error: revisionError } = await db.from("post_revisions").insert({
    post_id: postId,
    content: data.content,
    revised_by: data.author_id,
    revision_type: "ai_generated",
  });
  if (revisionError) throw new Error(`Failed to create initial revision: ${revisionError.message}`);

  const post = await getPostById(postId);
  if (!post) throw new Error("Created post was not found");
  return post;
}

export async function updatePost(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    scheduled_date: string | null;
    assigned_designer_id: number | null;
    hashtags: string | null;
    notes: string | null;
    published_url: string | null;
    carousel_slides: string | null;
  }>
): Promise<Post | undefined> {
  const db = getDb();
  const payload = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

  if (Object.keys(payload).length === 0) return getPostById(id);

  const { error } = await db
    .from("posts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Failed to update post: ${error.message}`);
  return getPostById(id);
}

export async function deletePost(id: number): Promise<boolean> {
  const db = getDb();
  const { data, error } = await db.from("posts").delete().eq("id", id).select("id");

  if (error) throw new Error(`Failed to delete post: ${error.message}`);
  return (data?.length || 0) > 0;
}

export async function transitionPostStatus(
  id: number,
  newStatus: PostStatus,
  changedBy: number,
  note?: string
): Promise<Post | undefined> {
  const db = getDb();
  const post = await getPostById(id);
  if (!post) return undefined;

  const { error: updateError } = await db
    .from("posts")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) throw new Error(`Failed to update post status: ${updateError.message}`);

  const { error: historyError } = await db.from("post_status_history").insert({
    post_id: id,
    from_status: post.status,
    to_status: newStatus,
    changed_by: changedBy,
    note: note || null,
  });
  if (historyError) throw new Error(`Failed to add status history: ${historyError.message}`);

  return getPostById(id);
}

export async function addRevision(
  postId: number,
  content: string,
  revisedBy: number,
  type: string
): Promise<PostRevision> {
  const db = getDb();
  const { data, error } = await db
    .from("post_revisions")
    .insert({
      post_id: postId,
      content,
      revised_by: revisedBy,
      revision_type: type,
    })
    .select(REVISION_SELECT_COLS)
    .single();

  if (error) throw new Error(`Failed to add revision: ${error.message}`);
  return data as PostRevision;
}

export async function getRevisions(postId: number): Promise<PostRevision[]> {
  const db = getDb();
  const { data, error } = await db
    .from("post_revisions")
    .select(REVISION_SELECT_COLS)
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch revisions: ${error.message}`);

  const rows = (data || []) as PostRevision[];
  const revisedByIds = Array.from(new Set(rows.map((row) => row.revised_by)));
  const nameMap = await getMemberNameMap(revisedByIds);

  return rows.map((row) => ({
    ...row,
    revised_by_name: nameMap.get(row.revised_by),
  }));
}

export async function getStatusHistory(postId: number): Promise<PostStatusHistory[]> {
  const db = getDb();
  const { data, error } = await db
    .from("post_status_history")
    .select(STATUS_HISTORY_SELECT_COLS)
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch status history: ${error.message}`);

  const rows = (data || []) as PostStatusHistory[];
  const changedByIds = Array.from(new Set(rows.map((row) => row.changed_by)));
  const nameMap = await getMemberNameMap(changedByIds);

  return rows.map((row) => ({
    ...row,
    changed_by_name: nameMap.get(row.changed_by),
  }));
}

export async function getPostsByWeek(weekStart: string, authorId?: number): Promise<Post[]> {
  const db = getDb();

  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const weekEnd = toIsoDate(end);

  let query = db
    .from("posts")
    .select(POST_SELECT_COLS)
    .gte("scheduled_date", weekStart)
    .lt("scheduled_date", weekEnd)
    .order("scheduled_date", { ascending: true });

  if (authorId) {
    query = query.eq("author_id", authorId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch weekly posts: ${error.message}`);

  return enrichPostsWithNames((data || []) as Post[]);
}

export async function getDashboardStats() {
  const db = getDb();

  const { count: totalPostsCount, error: totalError } = await db
    .from("posts")
    .select("id", { count: "exact", head: true });
  if (totalError) throw new Error(`Failed to fetch total posts count: ${totalError.message}`);

  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = toIsoDate(weekStart);

  const { count: postsThisWeekCount, error: weekError } = await db
    .from("posts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", weekStartStr);
  if (weekError) throw new Error(`Failed to fetch posts this week: ${weekError.message}`);

  const { count: inPipelineCount, error: pipelineError } = await db
    .from("posts")
    .select("id", { count: "exact", head: true })
    .not("status", "in", '("draft","published")');
  if (pipelineError) throw new Error(`Failed to fetch pipeline count: ${pipelineError.message}`);

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { count: publishedThisMonthCount, error: publishedError } = await db
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("updated_at", monthStart);
  if (publishedError) throw new Error(`Failed to fetch published count: ${publishedError.message}`);

  const { data: statusRows, error: statusError } = await db.from("posts").select("status");
  if (statusError) throw new Error(`Failed to fetch status breakdown: ${statusError.message}`);

  const { data: typeRows, error: typeError } = await db.from("posts").select("post_type");
  if (typeError) throw new Error(`Failed to fetch type breakdown: ${typeError.message}`);

  const { data: teamRows, error: teamError } = await db
    .from("team_members")
    .select("id, name")
    .order("name");
  if (teamError) throw new Error(`Failed to fetch team members: ${teamError.message}`);

  const { data: contributionRows, error: contributionError } = await db
    .from("posts")
    .select("author_id, status");
  if (contributionError) throw new Error(`Failed to fetch contribution rows: ${contributionError.message}`);

  const { data: activityRows, error: activityError } = await db
    .from("post_status_history")
    .select(STATUS_HISTORY_SELECT_COLS)
    .order("created_at", { ascending: false })
    .limit(10);
  if (activityError) throw new Error(`Failed to fetch recent activity: ${activityError.message}`);

  const postsByStatus = (statusRows || []).reduce<Record<string, number>>((acc, row) => {
    const key = row.status || "draft";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const postsByType = (typeRows || []).reduce<Record<string, number>>((acc, row) => {
    const key = row.post_type || "educational";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const contributionMap = new Map<number, { name: string; posts_created: number; posts_published: number }>();
  for (const member of teamRows || []) {
    contributionMap.set(member.id, {
      name: member.name,
      posts_created: 0,
      posts_published: 0,
    });
  }

  for (const row of contributionRows || []) {
    const item = contributionMap.get(row.author_id);
    if (!item) continue;
    item.posts_created += 1;
    if (row.status === "published") item.posts_published += 1;
  }

  const recentActivity = (activityRows || []) as PostStatusHistory[];
  const changedByIds = Array.from(new Set(recentActivity.map((item) => item.changed_by)));
  const changedByMap = await getMemberNameMap(changedByIds);

  return {
    totalPosts: toNumber(totalPostsCount),
    postsThisWeek: toNumber(postsThisWeekCount),
    inPipeline: toNumber(inPipelineCount),
    publishedThisMonth: toNumber(publishedThisMonthCount),
    postsByStatus,
    postsByType,
    teamContributions: Array.from(contributionMap.values()).sort(
      (a, b) => b.posts_created - a.posts_created
    ),
    recentActivity: recentActivity.map((item) => ({
      ...item,
      changed_by_name: changedByMap.get(item.changed_by),
    })),
  };
}