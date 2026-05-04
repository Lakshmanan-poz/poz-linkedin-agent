"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { POST_STATUS_LABELS } from "@/lib/constants";
import { Post, PostStatus } from "@/lib/types";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

type Section = {
  label: string;
  statuses: PostStatus[];
  emptyText: string;
  actionLabel?: string;
  actionStatus?: PostStatus;
};

const SECTIONS: Section[] = [
  {
    label: "Pending Reviews",
    statuses: ["submitted"],
    emptyText: "No posts awaiting review.",
    actionLabel: "Start Review",
    actionStatus: "under_review",
  },
  {
    label: "Posts Under Review",
    statuses: ["under_review"],
    emptyText: "No posts currently being reviewed.",
  },
  {
    label: "Ready to Publish",
    statuses: ["ready_to_publish"],
    emptyText: "No posts ready to publish.",
    actionLabel: "Publish",
    actionStatus: "published",
  },
  {
    label: "Changes Requested",
    statuses: ["changes_requested"],
    emptyText: "No posts awaiting changes.",
  },
  {
    label: "Published Posts",
    statuses: ["published"],
    emptyText: "No posts published yet.",
  },
];

export default function ReviewPage() {
  const { authRole, currentUser, loading } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [transitioning, setTransitioning] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && authRole !== "admin" && authRole !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [authRole, loading, router]);

  const fetchPosts = () => {
    setFetching(true);
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => { setPosts(data); setFetching(false); })
      .catch(() => setFetching(false));
  };

  useEffect(() => {
    if (authRole === "admin" || authRole === "superadmin") fetchPosts();
  }, [authRole]);

  const handleTransition = async (postId: number, fromStatus: string, newStatus: PostStatus) => {
    if (!currentUser) return;
    setTransitioning(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changed_by: currentUser.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`Post moved to ${POST_STATUS_LABELS[newStatus]}`);
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTransitioning(null);
    }
  };

  const handleRequestChanges = async (postId: number) => {
    if (!currentUser) return;
    const note = window.prompt("Describe the changes needed (this will be sent to the employee):");
    if (note === null) return;
    setTransitioning(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "changes_requested", changed_by: currentUser.id, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Changes requested — employee has been notified");
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request changes");
    } finally {
      setTransitioning(null);
    }
  };

  if (loading || fetching) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Review Queue</h2>
        {[1, 2].map((i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-24 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const getPostsByStatuses = (statuses: PostStatus[]) =>
    posts.filter((p) => statuses.includes(p.status as PostStatus));

  const pendingCount = getPostsByStatuses(["submitted"]).length;
  const readyCount = getPostsByStatuses(["ready_to_publish"]).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Queue</h2>
          <p className="text-muted-foreground">
            {pendingCount > 0 && `${pendingCount} post${pendingCount > 1 ? "s" : ""} awaiting review`}
            {pendingCount > 0 && readyCount > 0 && " · "}
            {readyCount > 0 && `${readyCount} ready to publish`}
            {pendingCount === 0 && readyCount === 0 && "All caught up!"}
          </p>
        </div>
      </div>

      {SECTIONS.map((section) => {
        const sectionPosts = getPostsByStatuses(section.statuses);
        return (
          <Card key={section.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {section.label}
                {sectionPosts.length > 0 && (
                  <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {sectionPosts.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sectionPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{section.emptyText}</p>
              ) : (
                <div className="space-y-3">
                  {sectionPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <PostTypeBadge type={post.post_type} />
                        <div className="min-w-0">
                          <Link href={`/posts/${post.id}`} className="text-sm font-medium hover:underline truncate block">
                            {post.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">by {post.author_name} · {new Date(post.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <PostStatusBadge status={post.status as PostStatus} />

                        {/* Inline quick actions */}
                        {post.status === "submitted" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={transitioning === post.id}
                              onClick={() => handleTransition(post.id, post.status, "under_review")}
                            >
                              Start Review
                            </Button>
                            <Button
                              size="sm"
                              disabled={transitioning === post.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleTransition(post.id, post.status, "approved_for_design")}
                            >
                              {transitioning === post.id ? "Approving…" : "Approve & Ready to Post"}
                            </Button>
                          </>
                        )}
                        {post.status === "under_review" && (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={transitioning === post.id}
                              onClick={() => handleRequestChanges(post.id)}
                            >
                              Request Changes
                            </Button>
                            <Button
                              size="sm"
                              disabled={transitioning === post.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleTransition(post.id, post.status, "approved_for_design")}
                            >
                              {transitioning === post.id ? "Approving…" : "Approve & Ready to Post"}
                            </Button>
                          </>
                        )}
                        {post.status === "ready_to_publish" && (
                          <Button
                            size="sm"
                            disabled={transitioning === post.id}
                            onClick={() => handleTransition(post.id, post.status, "published")}
                          >
                            Publish
                          </Button>
                        )}

                        <Link href={`/posts/${post.id}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
