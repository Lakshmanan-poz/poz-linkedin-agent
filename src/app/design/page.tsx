"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const [htmlSlides,   setHtmlSlides]   = useState<{ slideHtml: string; position: number; type?: string; title?: string }[] | null>(null);
  const [htmlLoading,  setHtmlLoading]  = useState(false);
  const [htmlError,    setHtmlError]    = useState("");
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "approved_for_design" | "design_in_progress" | "ready_to_publish">("all");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

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

  /* synchronously restore persisted design on post selection */
  const handleSelectPost = useCallback((post: Post) => {
    setSelected(post);
    setHtmlError("");
    setHtmlLoading(false);
    try {
      const stored = localStorage.getItem(`carousel-design-${post.id}`);
      setHtmlSlides(stored ? JSON.parse(stored) : null);
    } catch {
      setHtmlSlides(null);
    }
  }, []);

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

  const handleDeletePost = async (post: Post) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      try { localStorage.removeItem(`carousel-design-${post.id}`); } catch { /* ignore */ }
      if (selected?.id === post.id) { setSelected(null); setHtmlSlides(null); }
      toast.success("Post deleted");
      setDeletingId(null);
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setDeletingId(null);
    }
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

  const generateDesign = async (post: Post, force = false) => {
    const rawSlides = parseSlides(post.carousel_slides);
    if (rawSlides.length === 0) return;
    if (force) setHtmlSlides(null);
    setHtmlLoading(true);
    setHtmlError("");
    try {
      const normalizedSlides = rawSlides.map((s, i) => ({
        position: s.position ?? i + 1,
        type: s.type ?? "Insight",
        title: slideTitle(s),
        body: slideBody(s),
      }));
      const res = await fetch("/api/agents/carousel-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: normalizedSlides, topic: post.title }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Design generation failed");
      const slides = json.slides ?? [];
      setHtmlSlides(slides);
      try { localStorage.setItem(`carousel-design-${post.id}`, JSON.stringify(slides)); } catch { /* ignore quota */ }
    } catch (e) {
      setHtmlError(e instanceof Error ? e.message : "Failed to generate design");
    } finally {
      setHtmlLoading(false);
    }
  };

  const downloadDesignPdf = async (post: Post) => {
    if (!htmlSlides || htmlSlides.length === 0) {
      toast.error("Generate the design first before downloading");
      return;
    }
    setPdfLoading(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [1024, 1280], hotfixes: ["px_scaling"] });

      /* wrapper is in-viewport at opacity 0.001 — browser paints its iframe children */
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:fixed;top:0;left:0;width:1024px;height:1280px;overflow:hidden;opacity:0.001;pointer-events:none;z-index:99999;";
      document.body.appendChild(wrapper);

      for (let i = 0; i < htmlSlides.length; i++) {
        wrapper.innerHTML = "";

        /* iframe renders the full HTML (including <link> font tags) correctly */
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "width:1024px;height:1280px;border:none;display:block;";
        iframe.setAttribute("scrolling", "no");
        wrapper.appendChild(iframe);

        await new Promise<void>((resolve) => {
          iframe.addEventListener("load", () => resolve(), { once: true });
          iframe.srcdoc = htmlSlides[i].slideHtml ?? "";
          setTimeout(resolve, 4000);
        });

        /* wait for fonts inside the iframe to finish loading */
        try { await iframe.contentDocument?.fonts?.ready; } catch { /* ignore */ }
        await new Promise(r => setTimeout(r, 600));

        /* capture from INSIDE the iframe — unaffected by wrapper's opacity:0.001 */
        const slideEl = iframe.contentDocument?.body?.firstElementChild as HTMLElement | null;
        if (!slideEl) throw new Error(`Slide ${i + 1}: element not found`);

        const dataUrl = await toPng(slideEl, {
          width: 1024,
          height: 1280,
          pixelRatio: 2,
          skipFonts: true,
        });

        if (i > 0) pdf.addPage([1024, 1280]);
        pdf.addImage(dataUrl, "PNG", 0, 0, 1024, 1280);
      }

      document.body.removeChild(wrapper);
      pdf.save(`${post.title.slice(0, 40)}.pdf`);
      toast.success("PDF downloaded!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const queue      = posts.filter((p) => p.status === "approved_for_design");
  const inProgress = posts.filter((p) => p.status === "design_in_progress");
  const ready      = posts.filter((p) => p.status === "ready_to_publish");

  /* ── Post row ───────────────────────────────────────────────────────────── */
  const PostRow = ({
    post,
    section,
  }: {
    post: Post;
    section: "approved_for_design" | "design_in_progress" | "ready_to_publish";
  }) => {
    const isActive = selected?.id === post.id;
    const isMine   = post.assigned_designer_id === currentUser?.id;
    const isPendingDelete = deletingId === post.id;
    const hasDesign = !!(() => { try { return localStorage.getItem(`carousel-design-${post.id}`); } catch { return null; } })();

    const dotColor =
      section === "approved_for_design" ? "bg-blue-400"
      : section === "design_in_progress" ? "bg-violet-500"
      : "bg-emerald-500";

    const ownerLabel =
      section === "approved_for_design" ? "NEW"
      : section === "design_in_progress" && isMine ? "MINE"
      : section === "ready_to_publish" ? "DONE"
      : null;

    const ownerColor =
      section === "approved_for_design" ? "text-blue-600 dark:text-blue-400"
      : section === "design_in_progress" ? "text-violet-600 dark:text-violet-400"
      : "text-emerald-600 dark:text-emerald-400";

    if (isPendingDelete) {
      return (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <span className="flex-1 text-[12px] font-medium text-red-700 dark:text-red-400 truncate">Delete "{post.title.slice(0, 30)}…"?</span>
          <button onClick={() => handleDeletePost(post)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0">Yes</button>
          <button onClick={() => setDeletingId(null)} className="text-[11px] font-semibold px-2 py-1 rounded-md text-muted-foreground hover:bg-muted/60 transition-colors shrink-0">No</button>
        </div>
      );
    }

    return (
      <div className={cn(
        "group flex items-center gap-0 rounded-lg transition-colors duration-100 cursor-pointer",
        isActive ? "bg-accent" : "hover:bg-muted/50"
      )}>
        {/* Main row — clickable */}
        <button
          onClick={() => handleSelectPost(post)}
          className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 text-left"
        >
          {/* Status dot */}
          <span className={cn("w-2 h-2 rounded-full shrink-0 mt-px", dotColor)} />

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-[12.5px] leading-snug truncate",
              isActive ? "font-semibold text-foreground" : "font-medium text-foreground/85"
            )}>
              {post.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10.5px] text-muted-foreground/70 truncate">{post.author_name}</span>
              {hasDesign && post.post_type === "carousel" && (
                <span className="text-[9px] font-bold text-[#009FF0] tracking-wide">· DESIGNED</span>
              )}
            </div>
          </div>

          {/* Owner label */}
          {ownerLabel && (
            <span className={cn("shrink-0 text-[10px] font-bold tracking-wider", ownerColor)}>
              {ownerLabel}
            </span>
          )}
        </button>

        {/* Delete icon — always occupies space, only visible on hover */}
        <button
          onClick={e => { e.stopPropagation(); setDeletingId(post.id); }}
          className="shrink-0 w-7 h-7 mr-1 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all duration-100"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
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
      <div>
        {/* Section label row */}
        <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 z-10" style={{ backdropFilter: "blur(8px)" }}>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", meta.dot)} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-1">{meta.label}</span>
          <span className="text-[10px] font-bold text-muted-foreground/50">{list.length}</span>
        </div>

        {list.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 px-3 py-1.5 pb-2">
            {status === "approved_for_design" && "No posts waiting."}
            {status === "design_in_progress"  && "Nothing in progress."}
            {status === "ready_to_publish"    && "None ready yet."}
          </p>
        ) : (
          <div className="pb-1">
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

  const STAT_TABS = [
    { key: "approved_for_design" as const,  label: "Waiting",     count: queue.length,      color: "blue",    dot: "#3b82f6" },
    { key: "design_in_progress"  as const,  label: "In Progress", count: inProgress.length, color: "purple",  dot: "#a855f7" },
    { key: "ready_to_publish"    as const,  label: "Ready",       count: ready.length,      color: "emerald", dot: "#10b981" },
  ] as const;

  const allFiltered = posts.filter(p => {
    const matchesFilter = activeFilter === "all" || p.status === activeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || (p.author_name ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0 border-r min-h-0"
        style={{ width: 288, background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 shrink-0 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-foreground/80 tracking-tight">Design Queue</h2>
          <button
            onClick={fetchPosts}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </button>
        </div>

        {/* Stat filter tabs — horizontal pills */}
        <div className="px-3 pb-3 shrink-0">
          <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/40">
            {STAT_TABS.map(tab => {
              const isActive = activeFilter === tab.key;
              const dotCls =
                tab.color === "blue"    ? "bg-blue-500" :
                tab.color === "purple"  ? "bg-violet-500" :
                                          "bg-emerald-500";
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(isActive ? "all" : tab.key)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-center transition-all duration-150",
                    isActive
                      ? "bg-background shadow-sm border border-border/60"
                      : "hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className={cn("w-1.5 h-1.5 rounded-full", dotCls)} />
                    <span className={cn("text-[17px] font-bold tabular-nums leading-none", isActive ? "text-foreground" : "text-foreground/60")}>
                      {tab.count}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-medium text-muted-foreground leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/40 px-2.5 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Search posts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground/60 hover:text-foreground text-[13px] leading-none px-0.5">×</button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-3 bg-border/30 shrink-0" />

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2 px-2">
          {allFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                {searchQuery ? `No results for "${searchQuery}"` : "No posts in this queue."}
              </p>
            </div>
          ) : activeFilter !== "all" ? (
            <div className="space-y-1">
              {allFiltered.map(p => (
                <PostRow key={p.id} post={p} section={p.status as "approved_for_design" | "design_in_progress" | "ready_to_publish"} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <Section status="approved_for_design" list={queue.filter(p => {
                const q = searchQuery.trim().toLowerCase();
                return !q || p.title.toLowerCase().includes(q) || (p.author_name ?? "").toLowerCase().includes(q);
              })} />
              <Section status="design_in_progress" list={inProgress.filter(p => {
                const q = searchQuery.trim().toLowerCase();
                return !q || p.title.toLowerCase().includes(q) || (p.author_name ?? "").toLowerCase().includes(q);
              })} />
              <Section status="ready_to_publish" list={ready.filter(p => {
                const q = searchQuery.trim().toLowerCase();
                return !q || p.title.toLowerCase().includes(q) || (p.author_name ?? "").toLowerCase().includes(q);
              })} />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
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
          <>
            {/* ── Sticky header bar ───────────────────────────────────────────── */}
            <div className="shrink-0 border-b px-5 py-3 z-20 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate leading-tight">{selected.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <PostTypeBadge type={selected.post_type} />
                    <PostStatusBadge status={selected.status as PostStatus} />
                    <span className="text-[11px] text-muted-foreground">· {selected.author_name}</span>
                    {selected.designer_name && (
                      <span className="text-[11px] text-purple-600 font-medium">· {selected.designer_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                    onClick={() => copyText(buildCopyAll(selected), "all")}>
                    <IcoCopy copied={copiedField === "all"} />
                    {copiedField === "all" ? "Copied!" : "Copy All"}
                  </Button>
                  {selected.status === "approved_for_design" && (
                    <Button size="sm" className="h-7 text-xs" disabled={acting} onClick={() => takePost(selected)}>
                      {acting ? "Taking…" : "Take Post"}
                    </Button>
                  )}
                  {selected.status === "design_in_progress" && (
                    <>
                      {selected.post_type === "carousel" && parseSlides(selected.carousel_slides).length > 0 && (
                        <Button size="sm" disabled={htmlLoading} className="h-7 gap-1 text-xs text-white"
                          style={{ background: htmlLoading ? "#009FF099" : "linear-gradient(135deg,#0080d0,#009FF0)" }}
                          onClick={() => generateDesign(selected, !!htmlSlides)}>
                          {htmlLoading ? (
                            <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Designing…</>
                          ) : htmlSlides ? <>↺ Redesign</> : (
                            <><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Generate Design</>
                          )}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={acting}
                        onClick={() => transition(selected, "approved_for_design")}>Back to Queue</Button>
                      <Button size="sm" className="h-7 text-xs" disabled={acting}
                        onClick={() => transition(selected, "ready_to_publish")}>
                        {acting ? "Updating…" : "Mark Ready"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Scrollable body ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0">

              {/* Carousel Design Output */}
              {(htmlLoading || htmlSlides || htmlError) && selected.post_type === "carousel" && (
                <div className="border-b" style={{ background: "linear-gradient(160deg,rgba(0,159,240,0.07),rgba(0,159,240,0.02))" }}>
                  <div className="px-5 pt-4 pb-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(0,159,240,0.15)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#009FF0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#009FF0]">Carousel Slide Designer</span>
                        {htmlSlides && <span className="text-[10px] text-muted-foreground">{htmlSlides.length} slides</span>}
                      </div>
                      {htmlSlides && !htmlLoading && (
                        <Button size="sm" disabled={pdfLoading} className="h-7 gap-1.5 text-xs text-white"
                          style={{ background: pdfLoading ? "#009FF099" : "linear-gradient(135deg,#0080d0,#009FF0)" }}
                          onClick={() => downloadDesignPdf(selected)}>
                          {pdfLoading ? (
                            <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Generating…</>
                          ) : (
                            <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>Download PDF</>
                          )}
                        </Button>
                      )}
                    </div>

                    {htmlLoading && (
                      <div className="flex items-center gap-3 py-10 justify-center">
                        <svg className="animate-spin w-5 h-5 text-[#009FF0]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <p className="text-sm text-muted-foreground">Claude is designing slides using the POZ brand system…</p>
                      </div>
                    )}

                    {htmlError && !htmlLoading && (
                      <div className="flex items-center gap-3 py-4">
                        <p className="text-xs text-red-500 flex-1">{htmlError}</p>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => generateDesign(selected, true)}>Retry</Button>
                      </div>
                    )}

                    {htmlSlides && !htmlLoading && (
                      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
                        {htmlSlides.map((s, i) => (
                          <div key={i} style={{ flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: "#009FF0", fontVariantNumeric: "tabular-nums" }}>
                                {String(s.position ?? i + 1).padStart(2, "0")}
                              </span>
                              <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                · {s.type ?? "Slide"}
                              </span>
                            </div>
                            <div style={{ width: 220, height: 275, borderRadius: 10, overflow: "hidden", border: "1.5px solid rgba(0,159,240,0.25)", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
                              <iframe
                                srcDoc={s.slideHtml ?? ""}
                                style={{ width: 1024, height: 1280, border: "none", pointerEvents: "none", transformOrigin: "top left", transform: "scale(0.215)" }}
                                title={`Slide ${s.position ?? i + 1}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Post sections */}
              <div className="px-5 py-5 space-y-6 max-w-2xl">

                {/* LinkedIn Post */}
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Post</p>
                    <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
                      onClick={() => copyText(selected.content, "content")}>
                      <IcoCopy copied={copiedField === "content"} />
                      {copiedField === "content" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
                    {selected.content}
                  </div>
                </section>

                {/* Hashtags */}
                {parseHashtags(selected.hashtags).length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hashtags</p>
                      <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
                        onClick={() => copyText(parseHashtags(selected.hashtags).map(t => t.startsWith("#") ? t : `#${t}`).join(" "), "hashtags")}>
                        <IcoCopy copied={copiedField === "hashtags"} />
                        {copiedField === "hashtags" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parseHashtags(selected.hashtags).map(tag => (
                        <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Carousel slides */}
                {selected.post_type === "carousel" && (() => {
                  const slides = parseSlides(selected.carousel_slides);
                  if (slides.length === 0) return null;
                  const carouselType = parseCarouselType(selected.carousel_slides);
                  return (
                    <section>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Carousel Slides · {slides.length}
                          </p>
                          {(carouselType === "refined" || carouselType === "manual") && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                              carouselType === "refined"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-violet-50 text-violet-700 border-violet-200"
                            )}>
                              {carouselType === "refined" ? "AI Refined" : "Manual"}
                            </span>
                          )}
                        </div>
                        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
                          onClick={() => {
                            const text = slides.map((s, i) => {
                              const pos  = s.position ?? i + 1;
                              const type = s.type ? ` · ${s.type}` : "";
                              return `${String(pos).padStart(2, "0")}${type}\n${slideTitle(s)}\n${slideBody(s)}${s.note ? `\n↳ ${s.note}` : ""}`;
                            }).join("\n\n");
                            copyText(text, "slides");
                          }}>
                          <IcoCopy copied={copiedField === "slides"} />
                          {copiedField === "slides" ? "Copied!" : "Copy All"}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {slides.map((slide, i) => (
                          <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-muted/30 border border-border/60 group hover:border-border transition-colors">
                            <div className="shrink-0 w-7 pt-0.5 text-center">
                              <span className="text-[12px] font-black text-[#009FF0] tabular-nums">
                                {String(slide.position ?? i + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {slide.type && (
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{slide.type}</p>
                              )}
                              <p className="text-sm font-semibold leading-snug">{slideTitle(slide)}</p>
                              {slideBody(slide) && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{slideBody(slide)}</p>
                              )}
                              {slide.note && (
                                <p className="text-[11px] italic text-muted-foreground/60 mt-1.5 pt-1.5 border-t border-border/50">{slide.note}</p>
                              )}
                            </div>
                            <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-background"
                              onClick={() => copyText(`${slideTitle(slide)}\n${slideBody(slide)}`, `slide-${i}`)}>
                              <IcoCopy copied={copiedField === `slide-${i}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })()}

                {/* Admin notes */}
                {selected.notes && (
                  <section>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Admin Notes</p>
                    <div className="text-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800">
                      {selected.notes}
                    </div>
                  </section>
                )}

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pb-8 pt-2 border-t border-border/40">
                  {selected.scheduled_date && <span>Scheduled: {selected.scheduled_date}</span>}
                  <span>Updated: {new Date(selected.updated_at).toLocaleDateString()}</span>
                  {selected.platform && <span>Platform: {selected.platform}</span>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
