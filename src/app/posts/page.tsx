"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import { PostTypeBadge } from "@/components/posts/post-type-badge";
import { ALL_STATUSES, ALL_POST_TYPES, POST_STATUS_LABELS, POST_TYPE_LABELS } from "@/lib/constants";
import { Post, PostStatus, PostType } from "@/lib/types";

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
const IconTable = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>
  </svg>
);
const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
    <rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>
  </svg>
);
const IconKanban = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="6" height="14" x="2" y="5" rx="2"/><rect width="6" height="10" x="9" y="9" rx="2"/>
    <rect width="6" height="7" x="16" y="12" rx="2"/>
  </svg>
);

/* ─── Avatar ─────────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#06b6d4","#ef4444","#84cc16"];
function Avatar({ name, size = 28 }: { name?: string; size?: number }) {
  const initials = (name ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const color    = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: color }}
    >
      {initials}
    </div>
  );
}

/* ─── Type config ────────────────────────────────────────────────────────────── */
const TYPE_GRADIENT: Record<string, string> = {
  problem_solution: "linear-gradient(135deg,#009FF0,#0070c8)",
  educational:      "linear-gradient(135deg,#00b4ff,#009FF0)",
  execution:        "linear-gradient(135deg,#0070c8,#004fa0)",
  carousel:         "linear-gradient(135deg,#009FF0,#00c4f4)",
};

/* ─── Kanban columns ─────────────────────────────────────────────────────────── */
const KANBAN_COLS = [
  { id:"draft",   label:"Draft",       color:"#6b7280", statuses:["draft"] as PostStatus[] },
  { id:"review",  label:"In Review",   color:"#f59e0b", statuses:["submitted","under_review","changes_requested"] as PostStatus[] },
  { id:"design",  label:"In Design",   color:"#3b82f6", statuses:["approved_for_design","design_in_progress"] as PostStatus[] },
  { id:"publish", label:"Published",  color:"#10b981", statuses:["ready_to_publish","published"] as PostStatus[] },
];

/* ─── Skeleton card ──────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <Skeleton className="h-[72px] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Post card ──────────────────────────────────────────────────────────────── */
function PostCard({ post }: { post: Post }) {
  const gradient = TYPE_GRADIENT[post.post_type] ?? "linear-gradient(135deg,#009FF0,#0070c8)";
  return (
    <Link href={`/posts/${post.id}`} className="block group">
      <div className="rounded-xl border border-border overflow-hidden bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full">
        {/* Gradient header */}
        <div className="h-[72px] relative" style={{ background: gradient }}>
          <div className="absolute top-2.5 right-2.5">
            <PostStatusBadge status={post.status as PostStatus} />
          </div>
        </div>
        {/* Body */}
        <div className="p-4">
          <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
            {post.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {POST_TYPE_LABELS[post.post_type as PostType] ?? post.post_type}
            {post.scheduled_date && <span> · {post.scheduled_date}</span>}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={post.author_name} size={22} />
              <span className="text-xs text-muted-foreground truncate">{post.author_name ?? "—"}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Kanban card ────────────────────────────────────────────────────────────── */
function KanbanCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.id}`} className="block">
      <div className="rounded-lg border border-border bg-card p-3 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
        <p className="text-xs font-semibold line-clamp-2 leading-snug mb-2.5">{post.title}</p>
        <PostStatusBadge status={post.status as PostStatus} />
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground">
            {TYPE_ICON[post.post_type]} {POST_TYPE_LABELS[post.post_type as PostType]}
          </span>
          <Avatar name={post.author_name} size={18} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-5xl">📝</div>
      <p className="text-lg font-semibold">No posts found</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Create your first post or adjust the filters to find existing content.
      </p>
      <Link href="/posts/new"><Button size="sm">Create New Post</Button></Link>
    </div>
  );
}

/* ─── View toggle button ─────────────────────────────────────────────────────── */
function ViewBtn({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-all duration-150"
      style={active
        ? { background: "#00AAEC", color: "#fff" }
        : { color: "var(--muted-foreground)" }
      }
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--muted)"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {icon}
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function PostsPage() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [view,    setView]    = useState<"table"|"cards"|"kanban">("cards");

  useEffect(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    setLoading(true);
    fetch(`/api/posts?${p}`)
      .then(r => r.json())
      .then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Posts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/posts/new">
          <Button className="gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Create New Post
          </Button>
        </Link>
      </div>

      {/* ── Filters + view toggle ────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2.5 flex-wrap">
          <Input
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-52"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl border border-border bg-card shadow-sm">
          <ViewBtn active={view==="table"}  onClick={() => setView("table")}  icon={<IconTable />}  title="Table view" />
          <ViewBtn active={view==="cards"}  onClick={() => setView("cards")}  icon={<IconGrid />}   title="Card view" />
          <ViewBtn active={view==="kanban"} onClick={() => setView("kanban")} icon={<IconKanban />} title="Kanban view" />
        </div>
      </div>

      {/* ══ TABLE VIEW ══════════════════════════════════════════════════════════ */}
      {view === "table" && (
        <div className="border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Author</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Scheduled</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-0">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : posts.map(post => (
                <TableRow key={post.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Link href={`/posts/${post.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell><PostTypeBadge type={post.post_type as PostType} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={post.author_name} size={24} />
                      <span className="text-sm">{post.author_name ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell><PostStatusBadge status={post.status as PostStatus} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.scheduled_date ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ══ CARDS VIEW ══════════════════════════════════════════════════════════ */}
      {view === "cards" && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )
      )}

      {/* ══ KANBAN VIEW ═════════════════════════════════════════════════════════ */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => {
            const colPosts = posts.filter(p => (col.statuses as string[]).includes(p.status));
            return (
              <div key={col.id} className="flex flex-col min-w-[220px]">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="ml-auto text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full tabular-nums">
                    {loading ? "–" : colPosts.length}
                  </span>
                </div>

                {/* Cards area */}
                <div className="flex-1 space-y-2.5 min-h-[180px] rounded-xl bg-muted/30 border border-border p-2.5">
                  {loading ? (
                    [1,2].map(i => <Skeleton key={i} className="h-[88px] rounded-lg" />)
                  ) : colPosts.length === 0 ? (
                    <div className="flex items-center justify-center h-[140px]">
                      <p className="text-xs text-muted-foreground">No posts here</p>
                    </div>
                  ) : (
                    colPosts.map(post => <KanbanCard key={post.id} post={post} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
