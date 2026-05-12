"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { POST_STATUS_LABELS } from "@/lib/constants";
import { Post, PostStatus } from "@/lib/types";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Carousel helpers ────────────────────────────────────────────────────────── */
type ReviewSlide = { position?: number; type?: string; title?: string; body?: string; status?: string; note?: string };

function parseSlides(raw: string | null): ReviewSlide[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return (parsed.slides ?? parsed) as ReviewSlide[];
  } catch { return []; }
}

function parseCaption(raw: string | null): string {
  if (!raw) return "";
  try { return (JSON.parse(raw) as { caption?: string }).caption ?? ""; }
  catch { return ""; }
}

function parseHashtags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p as string[];
    if (Array.isArray((p as { hashtags?: string[] }).hashtags)) return (p as { hashtags: string[] }).hashtags;
    return [];
  } catch { return []; }
}

/* ── Section config ──────────────────────────────────────────────────────────── */
type Section = {
  label: string;
  statuses: PostStatus[];
  emptyText: string;
};

const SECTIONS: Section[] = [
  { label: "Pending Reviews",    statuses: ["submitted", "under_review"], emptyText: "No posts awaiting review." },
  { label: "Ready to Publish",   statuses: ["ready_to_publish"],          emptyText: "No posts ready to publish." },
  { label: "Changes Requested",  statuses: ["changes_requested"],         emptyText: "No posts awaiting changes." },
];

export default function ReviewPage() {
  const { authRole, currentUser, loading } = useUser();
  const router = useRouter();
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [fetching,     setFetching]     = useState(true);
  const [transitioning,setTransitioning]= useState<number | null>(null);
  const [expandedId,   setExpandedId]   = useState<number | null>(null);

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
      if (newStatus === "approved_for_design") {
        toast.success("Designer has been notified!", { duration: 3000 });
      }
      fetchPosts();
      setExpandedId(null);
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
      setExpandedId(null);
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

  const pendingCount = getPostsByStatuses(["submitted", "under_review"]).length;
  const readyCount   = getPostsByStatuses(["ready_to_publish"]).length;
  const changesCount = getPostsByStatuses(["changes_requested"]).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Queue</h2>
          <p className="text-muted-foreground">
            {pendingCount === 0 && readyCount === 0 && changesCount === 0
              ? "All caught up!"
              : [
                  pendingCount  > 0 && `${pendingCount} pending`,
                  readyCount    > 0 && `${readyCount} ready to publish`,
                  changesCount  > 0 && `${changesCount} changes requested`,
                ].filter(Boolean).join(" · ")
            }
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
                  {sectionPosts.map((post) => {
                    const slides   = parseSlides(post.carousel_slides);
                    const caption  = parseCaption(post.carousel_slides);
                    const hashtags = parseHashtags(post.hashtags ?? post.carousel_slides);
                    const isOpen   = expandedId === post.id;

                    return (
                      <div key={post.id} className="rounded-lg border bg-card overflow-hidden">
                        {/* ── Row header ── */}
                        <button
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
                          onClick={() => setExpandedId(isOpen ? null : post.id)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <PostTypeBadge type={post.post_type} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{post.title}</p>
                              <p className="text-xs text-muted-foreground">
                                by {post.author_name} · {new Date(post.updated_at).toLocaleDateString()}
                                {slides.length > 0 && <span className="ml-2 font-medium text-foreground/60">· {slides.length} slides</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <PostStatusBadge status={post.status as PostStatus} />
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform shrink-0", isOpen && "rotate-180")}><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </button>

                        {/* ── Expanded content ── */}
                        {isOpen && (
                          <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3 space-y-4">

                            {/* LinkedIn Post Body */}
                            {post.content && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Post Body</p>
                                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                                  {post.content.split("--- Carousel Content")[0].trim()}
                                </div>
                              </div>
                            )}

                            {/* Carousel Slides */}
                            {slides.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Carousel Content · {slides.length} Slides
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {slides.map((s, i) => (
                                    <div key={i} className="rounded-xl border border-border bg-background p-3 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                          {String(s.position ?? i + 1).padStart(2, "0")} · {s.type ?? "Slide"}
                                        </span>
                                        {s.status === "Fixed" && (
                                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Fixed</span>
                                        )}
                                      </div>
                                      <p className="text-sm font-semibold leading-snug">{s.title}</p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Caption */}
                            {caption && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Caption</p>
                                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                                  {caption}
                                </div>
                              </div>
                            )}

                            {/* Hashtags */}
                            {hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {hashtags.map((tag, i) => (
                                  <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                                    {tag.startsWith("#") ? tag : `#${tag}`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-1 border-t border-border">
                              {(post.status === "submitted" || post.status === "under_review") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={transitioning === post.id}
                                    onClick={() => handleRequestChanges(post.id)}
                                  >
                                    Request Changes
                                  </Button>
                                  {post.status === "submitted" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={transitioning === post.id}
                                      onClick={() => handleTransition(post.id, post.status, "under_review")}
                                    >
                                      Start Review
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    disabled={transitioning === post.id}
                                    className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                                    onClick={() => handleTransition(post.id, post.status, "approved_for_design")}
                                  >
                                    {transitioning === post.id ? "Approving…" : "✓ Approve — Send to Designer"}
                                  </Button>
                                </>
                              )}
                              {post.status === "ready_to_publish" && (
                                <Button
                                  size="sm"
                                  disabled={transitioning === post.id}
                                  className="ml-auto"
                                  onClick={() => handleTransition(post.id, post.status, "published")}
                                >
                                  Publish
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
