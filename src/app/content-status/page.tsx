"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { ALL_STATUSES, POST_STATUS_LABELS, POST_STATUS_COLORS } from "@/lib/constants";
import { Post, PostStatus } from "@/lib/types";

export default function ContentStatusPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const byStatus = ALL_STATUSES.reduce<Record<PostStatus, Post[]>>((acc, s) => {
    acc[s] = posts.filter((p) => p.status === s);
    return acc;
  }, {} as Record<PostStatus, Post[]>);

  const PIPELINE_STAGES: PostStatus[] = [
    "draft",
    "submitted",
    "under_review",
    "changes_requested",
    "approved_for_design",
    "design_in_progress",
    "ready_to_publish",
    "published",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Status</h2>
        <p className="text-muted-foreground">
          {loading ? "Loading…" : `${posts.length} total posts across all stages`}
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "In Pipeline", count: posts.filter((p) => p.status !== "published" && p.status !== "draft").length },
          { label: "Needs Attention", count: byStatus.changes_requested.length },
          { label: "Ready to Publish", count: byStatus.ready_to_publish.length },
          { label: "Published", count: byStatus.published.length },
        ].map((s) => (
          <div key={s.label} className="border rounded-lg p-4">
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline columns */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading posts…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {PIPELINE_STAGES.map((status) => {
            const stagePosts = byStatus[status];
            return (
              <div key={status} className="border rounded-lg overflow-hidden">
                <div className={`px-4 py-2 flex items-center justify-between ${POST_STATUS_COLORS[status]}`}>
                  <span className="font-semibold text-sm">{POST_STATUS_LABELS[status]}</span>
                  <span className="text-sm font-bold">{stagePosts.length}</span>
                </div>

                {stagePosts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No posts in this stage</p>
                ) : (
                  <div className="divide-y">
                    {stagePosts.map((post) => (
                      <div key={post.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/40">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/posts/${post.id}`}
                            className="font-medium text-sm hover:underline truncate block"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{post.author_name}</span>
                            <PostTypeBadge type={post.post_type} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          {post.scheduled_date && (
                            <span className="text-xs text-muted-foreground">{post.scheduled_date}</span>
                          )}
                          <PostStatusBadge status={post.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
