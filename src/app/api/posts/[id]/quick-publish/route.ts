import { NextRequest, NextResponse } from "next/server";
import { getPostById, transitionPostStatus } from "@/lib/db/posts";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { createNotification } from "@/lib/db/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session || (session.authRole !== "admin" && session.authRole !== "superadmin")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const postId = Number(id);
  const post = await getPostById(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.status === "published") {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  // Admin-privileged direct publish — bypasses intermediate design workflow
  const updated = await transitionPostStatus(
    postId,
    "published",
    session.userId,
    "Reviewed and published by admin"
  );

  // Notify author (non-fatal)
  if (post.author_id !== session.userId) {
    await createNotification({
      user_id: post.author_id,
      type: "published",
      post_id: postId,
      message: `Your content "${post.title}" has been reviewed and published!`,
      created_by: session.userId,
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}
