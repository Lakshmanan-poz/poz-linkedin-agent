"use client";

import { useEffect, useState, useCallback } from "react";
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

function IcoCopy({ copied }: { copied: boolean }) {
  return copied ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}

/* ── Section header pill ────────────────────────────────────────────────────── */
const SECTION_META: Record<string, { label: string; dot: string; pill: string }> = {
  approved_for_design: {
    label: "Approved for Design",
    dot:  "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  design_in_progress: {
    label: "In Progress",
    dot:  "bg-purple-500",
    pill: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  ready_to_publish: {
    label: "Ready to Publish",
    dot:  "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
};

export default function DesignerDashboard() {
  const { authRole, currentUser, loading } = useUser();
  const router = useRouter();

  const [posts, setPosts]             = useState<Post[]>([]);
  const [fetching, setFetching]       = useState(true);
  const [selected, setSelected]       = useState<Post | null>(null);
  const [acting, setActing]           = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && authRole !== "designer" && authRole !== "admin" && authRole !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [authRole, loading, router]);

  const fetchPosts = useCallback(() => {
    setFetching(true);
    const statuses: PostStatus[] = ["approved_for_design", "design_in_progress", "ready_to_publish"];
    Promise.all(statuses.map((s) => fetch(`/api/posts?status=${s}`).then((r) => r.json())))
      .then(([approved, inProgress, ready]) => {
        const all: Post[] = [...approved, ...inProgress, ...ready];
        setPosts(all);
        setSelected((prev) => (prev ? (all.find((p) => p.id === prev.id) ?? null) : null));
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (authRole === "designer" || authRole === "admin" || authRole === "superadmin") fetchPosts();
  }, [authRole, fetchPosts]);

  /* ── Actions ──────────────────────────────────────────────────────────────── */
  const transition = async (post: Post, newStatus: PostStatus) => {
    if (!currentUser) return;
    setActing(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changed_by: currentUser.id }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(`Moved to ${POST_STATUS_LABELS[newStatus]}`);
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActing(false);
    }
  };

  const takePost = async (post: Post) => {
    if (!currentUser) return;
    setActing(true);
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: post.title, content: post.content, assigned_designer_id: currentUser.id }),
      });
      const res = await fetch(`/api/posts/${post.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "design_in_progress", changed_by: currentUser.id }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success("Post taken — now in Design In Progress");
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActing(false);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success("Copied to clipboard");
    });
  };

  type DesignSlide = {
    position?: number; type?: string;
    title?: string; body?: string;
    headline?: string; bodyText?: string;
    status?: string; note?: string;
  };

  const parseSlides = (raw: string | null): DesignSlide[] => {
    if (!raw) return [];
    try { return (JSON.parse(raw).slides ?? []) as DesignSlide[]; }
    catch { return []; }
  };

  const parseCaption = (raw: string | null): string => {
    if (!raw) return "";
    try { return (JSON.parse(raw) as { caption?: string }).caption ?? ""; }
    catch { return ""; }
  };

  const parseCarouselType = (raw: string | null): string => {
    if (!raw) return "";
    try { return (JSON.parse(raw) as { type?: string }).type ?? ""; }
    catch { return ""; }
  };

  const slideTitle = (s: DesignSlide) => s.title ?? s.headline ?? "";
  const slideBody  = (s: DesignSlide) => s.body  ?? s.bodyText  ?? "";

  const parseHashtags = (raw: string | null): string[] => {
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; }
    catch { return []; }
  };

  const buildCopyAll = (post: Post): string => {
    const slides   = parseSlides(post.carousel_slides);
    const tags     = parseHashtags(post.hashtags);
    const caption  = parseCaption(post.carousel_slides) || post.content || "";
    const parts: string[] = [post.title, ""];

    if (slides.length > 0) {
      slides.forEach((s, i) => {
        const pos  = s.position ?? i + 1;
        const type = s.type ? ` · ${s.type}` : "";
        parts.push(`${String(pos).padStart(2, "0")}${type}`);
        parts.push(slideTitle(s));
        if (slideBody(s)) parts.push(slideBody(s));
        if (s.note) parts.push(`↳ ${s.note}`);
        parts.push("");
      });
    }

    if (caption) { parts.push("Caption:"); parts.push(caption); parts.push(""); }
    if (tags.length > 0) { parts.push(tags.map((t) => t.startsWith("#") ? t : `#${t}`).join(" ")); }

    return parts.join("\n").trim();
  };

  const queue      = posts.filter((p) => p.status === "approved_for_design");
  const inProgress = posts.filter((p) => p.status === "design_in_progress");
  const ready      = posts.filter((p) => p.status === "ready_to_publish");

  /* ── Post row in left panel ─────────────────────────────────────────────── */
  const PostRow = ({
    post,
    section,
  }: {
    post: Post;
    section: "approved_for_design" | "design_in_progress" | "ready_to_publish";
  }) => {
    const isActive = selected?.id === post.id;
    const isMine   = post.assigned_designer_id === currentUser?.id;

    return (
      <button
        onClick={() => setSelected(post)}
        className={cn(
          "w-full text-left px-3 py-3 rounded-xl border transition-all duration-150 group",
          isActive
            ? "border-primary/40 bg-primary/5 shadow-sm"
            : "border-border/60 bg-card hover:border-border hover:shadow-sm hover:bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={cn("text-sm leading-snug line-clamp-2 flex-1", isActive ? "font-semibold" : "font-medium")}>
            {post.title}
          </p>
          {section === "approved_for_design" && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 tracking-wide">
              NEW
            </span>
          )}
          {section === "design_in_progress" && isMine && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 tracking-wide">
              MINE
            </span>
          )}
          {section === "ready_to_publish" && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 tracking-wide">
              DONE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <PostTypeBadge type={post.post_type} />
          <span className="text-[11px] text-muted-foreground truncate">{post.author_name}</span>
        </div>
      </button>
    );
  };

  /* ── Section block ──────────────────────────────────────────────────────── */
  const Section = ({
    status,
    list,
  }: {
    status: "approved_for_design" | "design_in_progress" | "ready_to_publish";
    list: Post[];
  }) => {
    const meta = SECTION_META[status];
    return (
      <div className="space-y-1">
        {/* sticky section header */}
        <div className={cn(
          "sticky top-0 z-10 flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-bold mx-0.5",
          meta.pill
        )}
        style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </div>
          <span className="font-semibold opacity-70">{list.length}</span>
        </div>

        {list.length === 0 ? (
          <p className="text-xs text-muted-foreground px-3 py-2.5 italic">
            {status === "approved_for_design" && "No posts waiting."}
            {status === "design_in_progress"  && "Nothing in progress."}
            {status === "ready_to_publish"    && "None yet."}
          </p>
        ) : (
          <div className="space-y-1 px-0.5">
            {list.map((p) => <PostRow key={p.id} post={p} section={status} />)}
          </div>
        )}
      </div>
    );
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading designer dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0 border-r min-h-0"
        style={{ width: 292, background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
      >
        {/* Fixed header */}
        <div className="px-4 pt-5 pb-3 border-b shrink-0" style={{ borderColor: "var(--sidebar-border)" }}>
          <h2 className="text-[15px] font-bold tracking-tight">Design Queue</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              {queue.length} waiting
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
              {inProgress.length} in progress
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {ready.length} ready
            </span>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3 px-2 space-y-4">
          <Section status="approved_for_design" list={queue} />
          <Section status="design_in_progress"  list={inProgress} />
          <Section status="ready_to_publish"     list={ready} />
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-8">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Select a post</p>
              <p className="text-xs text-muted-foreground mt-1">Click any post on the left to view its full content</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-8 py-6 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <h1 className="text-xl font-bold leading-snug">{selected.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <PostTypeBadge type={selected.post_type} />
                  <PostStatusBadge status={selected.status as PostStatus} />
                  <span className="text-xs text-muted-foreground">by {selected.author_name}</span>
                  {selected.designer_name && (
                    <span className="text-xs text-purple-600 font-medium">· {selected.designer_name}</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {/* Copy All — always visible */}
                <Button
                  size="sm" variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold"
                  onClick={() => copyText(buildCopyAll(selected), "all")}
                >
                  <IcoCopy copied={copiedField === "all"} />
                  {copiedField === "all" ? "Copied!" : "Copy All"}
                </Button>

                {selected.status === "approved_for_design" && (
                  <Button size="sm" disabled={acting} onClick={() => takePost(selected)}>
                    {acting ? "Taking…" : "Take Post"}
                  </Button>
                )}
                {selected.status === "design_in_progress" && (
                  <>
                    <Button size="sm" variant="outline" disabled={acting} onClick={() => transition(selected, "approved_for_design")}>
                      Back to Queue
                    </Button>
                    <Button size="sm" disabled={acting} onClick={() => transition(selected, "ready_to_publish")}>
                      {acting ? "Updating…" : "Mark Ready"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Post Content
                </CardTitle>
                <Button
                  size="sm" variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => copyText(selected.content, "content")}
                >
                  <IcoCopy copied={copiedField === "content"} />
                  {copiedField === "content" ? "Copied!" : "Copy"}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {selected.content}
                </pre>
              </CardContent>
            </Card>

            {/* Hashtags */}
            {parseHashtags(selected.hashtags).length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Hashtags
                  </CardTitle>
                  <Button
                    size="sm" variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => copyText(
                      parseHashtags(selected.hashtags).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" "),
                      "hashtags"
                    )}
                  >
                    <IcoCopy copied={copiedField === "hashtags"} />
                    {copiedField === "hashtags" ? "Copied!" : "Copy"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {parseHashtags(selected.hashtags).map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium">
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Carousel slides */}
            {selected.post_type === "carousel" && parseSlides(selected.carousel_slides).length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Carousel Slides ({parseSlides(selected.carousel_slides).length})
                    </CardTitle>
                    {(parseCarouselType(selected.carousel_slides) === "refined" || parseCarouselType(selected.carousel_slides) === "manual") && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        parseCarouselType(selected.carousel_slides) === "refined"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                          : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800"
                      )}>
                        {parseCarouselType(selected.carousel_slides) === "refined" ? "AI Refined" : "Manual"}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm" variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => {
                      const slides = parseSlides(selected.carousel_slides);
                      const text = slides
                        .map((s, i) => {
                          const pos  = s.position ?? i + 1;
                          const type = s.type ? ` · ${s.type}` : "";
                          return `${String(pos).padStart(2, "0")}${type}\n${slideTitle(s)}\n${slideBody(s)}${s.note ? `\n↳ ${s.note}` : ""}`;
                        })
                        .join("\n\n");
                      copyText(text, "slides");
                    }}
                  >
                    <IcoCopy copied={copiedField === "slides"} />
                    {copiedField === "slides" ? "Copied!" : "Copy All"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parseSlides(selected.carousel_slides).map((slide, i) => (
                      <div key={i} className="relative border rounded-xl p-3 bg-muted/30 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Position + type + status row */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-muted-foreground tabular-nums">
                                {String(slide.position ?? i + 1).padStart(2, "0")}
                              </span>
                              {slide.type && (
                                <span className="text-[10px] font-bold text-muted-foreground">· {slide.type}</span>
                              )}
                              {slide.status && slide.status !== "Manual" && (
                                <span className={cn(
                                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-auto",
                                  slide.status === "Fixed"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-muted text-muted-foreground border-border"
                                )}>
                                  {slide.status}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-sm">{slideTitle(slide)}</p>
                            {slideBody(slide) && (
                              <p className="text-xs text-muted-foreground leading-relaxed">{slideBody(slide)}</p>
                            )}
                            {slide.note && (
                              <p className="text-[11px] italic text-muted-foreground/70 border-t border-border/50 pt-1 mt-1">
                                {slide.note}
                              </p>
                            )}
                          </div>
                          <button
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-background"
                            onClick={() => copyText(`${slideTitle(slide)}\n${slideBody(slide)}`, `slide-${i}`)}
                          >
                            <IcoCopy copied={copiedField === `slide-${i}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Refined caption shown under slides */}
                  {parseCaption(selected.carousel_slides) && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Caption</p>
                        <button
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                          onClick={() => copyText(parseCaption(selected.carousel_slides), "caption")}
                        >
                          <IcoCopy copied={copiedField === "caption"} />
                          {copiedField === "caption" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap">
                        {parseCaption(selected.carousel_slides)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin notes */}
            {selected.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Admin Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selected.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pb-8">
              {selected.scheduled_date && <span>Scheduled: {selected.scheduled_date}</span>}
              <span>Updated: {new Date(selected.updated_at).toLocaleDateString()}</span>
              {selected.platform && <span>Platform: {selected.platform}</span>}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
