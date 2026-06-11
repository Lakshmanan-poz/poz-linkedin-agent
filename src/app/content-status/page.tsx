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

  const STAGES = [
    {
      label: "Draft",
      color: "bg-gray-100 dark:bg-gray-800",
      textColor: "text-gray-700 dark:text-gray-300",
      statuses: ["draft"] as PostStatus[],
    },
    {
      label: "In Review",
      color: "bg-yellow-50 dark:bg-yellow-900/20",
      textColor: "text-yellow-700 dark:text-yellow-400",
      statuses: ["submitted", "under_review", "changes_requested"] as PostStatus[],
    },
    {
      label: "In Design",
      color: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-400",
      statuses: ["approved_for_design", "design_in_progress"] as PostStatus[],
    },
    {
      label: "Published",
      color: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-400",
      statuses: ["ready_to_publish", "published"] as PostStatus[],
    },
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
        {STAGES.map((stage) => {
          const count = posts.filter((p) => (stage.statuses as string[]).includes(p.status)).length;
          return (
            <div key={stage.label} className="border rounded-lg p-4">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground">{stage.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pipeline columns */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading posts…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {STAGES.map((stage) => {
            const stagePosts = posts.filter((p) => (stage.statuses as string[]).includes(p.status));
            return (
              <div key={stage.label} className="border rounded-lg overflow-hidden">
                <div className={`px-4 py-2 flex items-center justify-between ${stage.color}`}>
                  <span className={`font-semibold text-sm ${stage.textColor}`}>{stage.label}</span>
                  <span className={`text-sm font-bold ${stage.textColor}`}>{stagePosts.length}</span>
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
