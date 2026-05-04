import { NextRequest, NextResponse } from "next/server";
import { getPostById, transitionPostStatus } from "@/lib/db/posts";
import { canTransition } from "@/lib/workflow";
import { PostStatus } from "@/lib/types";
import { createNotification } from "@/lib/db/notifications";
import { getDb } from "@/lib/db/index";

async function getDesignerIds(): Promise<number[]> {
  const db = getDb();
  const { data } = await db.from("team_members").select("id").eq("auth_role", "designer");
  return (data || []).map((m: { id: number }) => m.id);
}

async function getReviewerIds(): Promise<number[]> {
  const db = getDb();
  const { data } = await db
    .from("team_members")
    .select("id")
    .in("auth_role", ["admin", "superadmin"]);
  return (data || []).map((m: { id: number }) => m.id);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { status: newStatus, changed_by, note } = body;

  if (!newStatus || !changed_by) {
    return NextResponse.json({ error: "Missing required fields: status, changed_by" }, { status: 400 });
  }

  const post = await getPostById(Number(id));
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (!canTransition(post.status, newStatus as PostStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${post.status}' to '${newStatus}'` },
      { status: 400 }
    );
  }

  const updated = await transitionPostStatus(Number(id), newStatus as PostStatus, changed_by, note);

  // Fire notifications based on the transition
  try {
    const postTitle = post.title;
    const postId = Number(id);
    const actorId = Number(changed_by);

    if (newStatus === "submitted") {
      // Notify all reviewers that a post was submitted for review
      const reviewerIds = await getReviewerIds();
      await Promise.all(
        reviewerIds
          .filter((rid) => rid !== actorId)
          .map((rid) =>
            createNotification({
              user_id: rid,
              type: "post_submitted",
              post_id: postId,
              message: `A post "${postTitle}" has been submitted for review`,
              created_by: actorId,
            })
          )
      );
    } else if (newStatus === "changes_requested") {
      // Notify the post author that changes are requested
      if (post.author_id !== actorId) {
        await createNotification({
          user_id: post.author_id,
          type: "changes_requested",
          post_id: postId,
          message: `Changes have been requested on your post "${postTitle}"${note ? `: ${note}` : ""}`,
          created_by: actorId,
        });
      }
    } else if (newStatus === "approved_for_design") {
      // Notify all designers that a post is ready for design
      const designerIds = await getDesignerIds();
      await Promise.all(
        designerIds.map((did) =>
          createNotification({
            user_id: did,
            type: "approved_for_design",
            post_id: postId,
            message: `Post "${postTitle}" has been approved and is ready for design`,
            created_by: actorId,
          })
        )
      );
      // Also notify the post author
      if (post.author_id !== actorId) {
        await createNotification({
          user_id: post.author_id,
          type: "approved_for_design",
          post_id: postId,
          message: `Your post "${postTitle}" has been approved for design`,
          created_by: actorId,
        });
      }
    } else if (newStatus === "ready_to_publish") {
      // Designer marked design complete — notify reviewers
      const reviewerIds = await getReviewerIds();
      await Promise.all(
        reviewerIds.map((rid) =>
          createNotification({
            user_id: rid,
            type: "ready_to_publish",
            post_id: postId,
            message: `Design complete — post "${postTitle}" is ready to publish`,
            created_by: actorId,
          })
        )
      );
    } else if (newStatus === "published") {
      // Notify the post author that their post was published
      if (post.author_id !== actorId) {
        await createNotification({
          user_id: post.author_id,
          type: "published",
          post_id: postId,
          message: `Your post "${postTitle}" has been published!`,
          created_by: actorId,
        });
      }
    }
  } catch {
    // Notification failures should not break the transition
  }

  return NextResponse.json(updated);
}
