import { getDb } from "./index";
import { PostComment } from "../types";

export async function getCommentsByPostId(postId: number): Promise<PostComment[]> {
  const db = getDb();
  const { data, error } = await db
    .from("post_comments")
    .select("id, post_id, author_id, content, created_at, team_members(name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((c: Record<string, unknown>) => ({
    id: c.id as number,
    post_id: c.post_id as number,
    author_id: c.author_id as number,
    content: c.content as string,
    created_at: c.created_at as string,
    author_name: (c.team_members as { name: string } | null)?.name || "Unknown",
  }));
}

export async function createComment(data: {
  post_id: number;
  author_id: number;
  content: string;
}): Promise<PostComment> {
  const db = getDb();
  const { data: comment, error } = await db
    .from("post_comments")
    .insert(data)
    .select("id, post_id, author_id, content, created_at")
    .single();

  if (error) throw new Error(error.message);
  return comment as PostComment;
}

export async function deleteComment(id: number): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from("post_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}
