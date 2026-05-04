import { NextRequest, NextResponse } from "next/server";
import { getCommentsByPostId, createComment } from "@/lib/db/comments";
import { getPostById } from "@/lib/db/posts";
import { createNotification } from "@/lib/db/notifications";
import { getDb } from "@/lib/db/index";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await getCommentsByPostId(Number(id));
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { author_id, content } = body;

  if (!author_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing required fields: author_id, content" }, { status: 400 });
  }

  const comment = await createComment({ post_id: Number(id), author_id: Number(author_id), content: content.trim() });

  // Notify post author about the new comment (if commenter is not the author)
  const post = await getPostById(Number(id));
  if (post && post.author_id !== Number(author_id)) {
    // Look up commenter name
    const db = getDb();
    const { data: commenter } = await db.from("team_members").select("name").eq("id", author_id).maybeSingle();
    const commenterName = commenter?.name || "Someone";

    await createNotification({
      user_id: post.author_id,
      type: "comment",
      post_id: Number(id),
      message: `${commenterName} commented on your post "${post.title}"`,
      created_by: Number(author_id),
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
