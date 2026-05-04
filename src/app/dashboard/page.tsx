"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import {
  POST_STATUS_LABELS,
  POST_STATUS_COLORS,
  POST_TYPE_LABELS,
  ALL_STATUSES,
  ALL_POST_TYPES,
} from "@/lib/constants";
import {
  DashboardStats,
  PostStatus,
  PostType,
  Post,
  Notification,
} from "@/lib/types";
import { useUser } from "@/providers/user-provider";
import { AgentOutput } from "@/lib/agents/types";
import { AGENTS } from "@/lib/agents/constants";

/* ─── Confetti overlay (published celebration) ───────────────────────────────── */
function ConfettiOverlay({ onDone }: { onDone: () => void }) {
  const [pieces] = useState(() => {
    const colors = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#f43f5e","#84cc16"];
    return Array.from({ length: 55 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${(i * 7.3 + 2.1) % 100}%`,
      size: 7 + (i * 3) % 10,
      duration: `${2.2 + (i * 0.35) % 2.2}s`,
      delay: `${(i * 0.12) % 1.4}s`,
      isCircle: i % 5 === 0,
    }));
  });

  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      <style>{`
        @keyframes poz-fall {
          0%   { transform: translateY(-24px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(600deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: p.left,
            width: `${p.size}px`,
            height: p.isCircle ? `${p.size}px` : `${Math.round(p.size * 0.55)}px`,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
            animation: `poz-fall ${p.duration} ${p.delay} ease-in both`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Shared: My Agent Activity card ────────────────────────────────────────── */
function MyAgentActivity() {
  const [outputs, setOutputs]   = useState<AgentOutput[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/agents/outputs")
      .then((r) => r.json())
      .then((data) => { setOutputs(Array.isArray(data) ? data.slice(0, 8) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function getSkillLabel(agentId: string, skillId: string) {
    const agent = AGENTS.find((a) => a.id === agentId);
    return agent?.skills.find((s) => s.id === skillId)?.name ?? skillId;
  }

  const statusColor = (s: string) =>
    s === "finalized" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
    : s === "archived" ? "bg-muted text-muted-foreground"
    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">My Agent Activity</CardTitle>
        <Link href="/agent-catalog">
          <Button variant="outline" size="sm">Open Catalog</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse bg-muted rounded" />)}
          </div>
        ) : outputs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">No agent outputs yet.</p>
            <Link href="/agent-catalog">
              <Button size="sm" variant="outline">Start Using Agents</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {outputs.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{o.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getSkillLabel(o.agent_id, o.skill_id)} · {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Admin Review Queue card ────────────────────────────────────────────────── */
function AdminReviewQueue() {
  const { currentUser } = useUser();
  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [feedbackId, setFeedbackId]   = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [actionId, setActionId]       = useState<number | null>(null);

  const REVIEW_STATUSES = ["submitted", "under_review"];

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(Array.isArray(data) ? data.filter((p) => REVIEW_STATUSES.includes(p.status)) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApproveForDesign(postId: number) {
    if (!currentUser) return;
    setActionId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved_for_design", changed_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Approval failed");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Approval failed");
    }
    setActionId(null);
  }

  async function handleSendFeedback(postId: number) {
    if (!feedbackNote.trim() || !currentUser) return;
    setActionId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "changes_requested", changed_by: currentUser.id, note: feedbackNote.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to send feedback");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFeedbackId(null);
      setFeedbackNote("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Feedback failed");
    }
    setActionId(null);
  }

  const statusCls = (s: string) =>
    `text-xs px-2 py-0.5 rounded-full font-medium ${POST_STATUS_COLORS[s as PostStatus] ?? "bg-muted text-muted-foreground"}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Review Queue</CardTitle>
          {posts.length > 0 && (
            <span className="text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 px-2 py-0.5 rounded-full">
              {posts.length}
            </span>
          )}
        </div>
        <Link href="/review">
          <Button variant="outline" size="sm">Full Queue</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No content waiting for review.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                {/* Row 1: meta */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {post.author_name ?? `Author #${post.author_id}`}
                      {" · "}
                      {POST_TYPE_LABELS[post.post_type as PostType] ?? post.post_type}
                      {" · "}
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={statusCls(post.status)}>
                    {POST_STATUS_LABELS[post.status as PostStatus] ?? post.status}
                  </span>
                </div>

                {/* Row 2: actions */}
                {feedbackId === post.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      rows={2}
                      placeholder="Type your feedback or changes needed…"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendFeedback(post.id)}
                        disabled={actionId === post.id || !feedbackNote.trim()}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                      >
                        {actionId === post.id ? "Sending…" : "Send Feedback"}
                      </button>
                      <button
                        onClick={() => { setFeedbackId(null); setFeedbackNote(""); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveForDesign(post.id)}
                      disabled={actionId === post.id}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {actionId === post.id ? "Approving…" : "Approve & Ready to Post"}
                    </button>
                    <button
                      onClick={() => { setFeedbackId(post.id); setFeedbackNote(""); }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                    >
                      Send Feedback
                    </button>
                    <Link href={`/posts/${post.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors">
                      View
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Admin / Super-admin Dashboard ───────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const KPI_CARDS = [
    { label: "Total Posts",          value: stats?.totalPosts,         dot: "bg-primary",     num: "text-primary" },
    { label: "This Week",            value: stats?.postsThisWeek,      dot: "bg-violet-500",  num: "text-violet-600 dark:text-violet-400" },
    { label: "In Pipeline",          value: stats?.inPipeline,         dot: "bg-amber-500",   num: "text-amber-600 dark:text-amber-400" },
    { label: "Published This Month", value: stats?.publishedThisMonth, dot: "bg-emerald-500", num: "text-emerald-600 dark:text-emerald-400" },
  ];

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 animate-pulse bg-muted rounded-lg" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your content pipeline</p>
        </div>
        <Link href="/review">
          <Button size="sm">Review Queue</Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map((k) => (
          <Card key={k.label} className="gap-0">
            <CardContent className="px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${k.dot}`} />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
              </div>
              <p className={`text-3xl font-bold tabular-nums ${k.num}`}>{k.value ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline + by-type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {ALL_STATUSES.map((status) => {
                const count = (stats.postsByStatus as Record<string, number>)[status] || 0;
                const max = Math.max(...Object.values(stats.postsByStatus as Record<string, number>), 1);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-36 shrink-0"><PostStatusBadge status={status as PostStatus} /></div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Posts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {ALL_POST_TYPES.map((type) => {
                const count = (stats.postsByType as Record<string, number>)[type] || 0;
                const max = Math.max(...Object.values(stats.postsByType as Record<string, number>), 1);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 text-xs font-medium text-muted-foreground truncate">{POST_TYPE_LABELS[type as PostType]}</div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-violet-500 dark:bg-violet-400 rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review queue */}
      <AdminReviewQueue />

      {/* My agent activity */}
      <MyAgentActivity />

      {/* Team + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Team Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.teamContributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts created yet.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span>Name</span>
                  <span className="text-center">Created</span>
                  <span className="text-center">Published</span>
                </div>
                {stats.teamContributions.map((tc) => (
                  <div key={tc.name} className="grid grid-cols-3 text-sm py-1">
                    <span className="font-medium">{tc.name}</span>
                    <span className="text-center">{tc.posts_created}</span>
                    <span className="text-center">{tc.posts_published}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium">{activity.changed_by_name}</span>{" "}
                      moved post to{" "}
                      <span className="font-medium">
                        {POST_STATUS_LABELS[activity.to_status as PostStatus] || activity.to_status}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ─── Employee Dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard() {
  const { currentUser } = useUser();
  const [posts, setPosts]                 = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showConfetti, setShowConfetti]   = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ])
      .then(([postsData, notifData]) => {
        const notifs: Notification[] = notifData.notifications || [];
        setPosts(Array.isArray(postsData) ? postsData : []);
        setNotifications(notifs);
        setLoading(false);
        // Trigger celebration if there are unread published notifications
        if (notifs.some((n) => n.type === "published" && !n.is_read)) {
          setShowConfetti(true);
        }
      })
      .catch(() => setLoading(false));
  }, [currentUser]);

  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const unread = notifications.filter((n) => !n.is_read);

  const empKpis = [
    { label: "Total Posts", value: posts.length,                                                             dot: "bg-primary",      num: "text-primary" },
    { label: "Drafts",      value: statusCounts["draft"] || 0,                                               dot: "bg-zinc-400",     num: "text-zinc-600 dark:text-zinc-400" },
    { label: "In Review",   value: (statusCounts["submitted"] || 0) + (statusCounts["under_review"] || 0),  dot: "bg-amber-500",    num: "text-amber-600 dark:text-amber-400" },
    { label: "Published",   value: statusCounts["published"] || 0,                                           dot: "bg-emerald-500",  num: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {showConfetti && <ConfettiOverlay onDone={() => setShowConfetti(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track your content across every stage</p>
        </div>
        <Link href="/posts/new">
          <Button size="sm">+ Create Post</Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {empKpis.map((k) => (
          <Card key={k.label} className="gap-0">
            <CardContent className="px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${k.dot}`} />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
              </div>
              <p className={`text-3xl font-bold tabular-nums ${k.num}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Changes requested alert — shown inline at top if any */}
      {posts.some((p) => p.status === "changes_requested") && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Action Required — Changes Requested</p>
          <div className="space-y-1.5">
            {posts.filter((p) => p.status === "changes_requested").map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 bg-white dark:bg-red-950/50 border border-red-100 dark:border-red-900 hover:border-red-300 dark:hover:border-red-700 transition-colors"
              >
                <span className="text-sm font-medium truncate">{post.title}</span>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium shrink-0 ml-3">Review →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">My Posts</CardTitle>
            <Link href="/posts">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse bg-muted rounded-lg" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground mb-3">No posts yet.</p>
                <Link href="/posts/new"><Button size="sm">Create Your First Post</Button></Link>
              </div>
            ) : (
              <div className="divide-y divide-border -mx-1">
                {posts.slice(0, 6).map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="flex items-center justify-between px-1 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-sm font-medium truncate flex-1 mr-3">{post.title}</span>
                    <PostStatusBadge status={post.status as PostStatus} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              {unread.length > 0 && (
                <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {unread.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 6).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                      n.is_read
                        ? "border-transparent bg-muted/30"
                        : "border-primary/20 bg-primary/5"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-muted-foreground/40" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {n.post_id && (
                      <Link href={`/posts/${n.post_id}`} className="text-xs text-primary font-medium shrink-0 hover:underline">
                        View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent activity */}
      <MyAgentActivity />

    </div>
  );
}

// ─── Designer Dashboard ───────────────────────────────────────────────────────
function DesignerDashboard() {
  const { currentUser } = useUser();
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<number | null>(null);
  const [copied, setCopied]   = useState<number | null>(null);

  const fetchPosts = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/posts?status=approved_for_design").then((r) => r.json()),
      fetch("/api/posts?status=design_in_progress").then((r) => r.json()),
      fetch("/api/posts?status=ready_to_publish").then((r) => r.json()),
    ])
      .then(([q, ip, rp]) => { setPosts([...q, ...ip, ...rp]); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const queue      = posts.filter((p) => p.status === "approved_for_design");
  const inProgress = posts.filter((p) => p.status === "design_in_progress");
  const ready      = posts.filter((p) => p.status === "ready_to_publish");
  const mine       = inProgress.filter((p) => p.assigned_designer_id === currentUser?.id);

  const takePost = async (post: Post) => {
    if (!currentUser) return;
    setActing(post.id);
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
      if (!res.ok) throw new Error((await res.json()).error);
      fetchPosts();
    } catch { /* silently refresh */ fetchPosts(); }
    finally { setActing(null); }
  };

  const markReady = async (post: Post) => {
    if (!currentUser) return;
    setActing(post.id);
    try {
      const res = await fetch(`/api/posts/${post.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready_to_publish", changed_by: currentUser.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchPosts();
    } catch { fetchPosts(); }
    finally { setActing(null); }
  };

  const copyContent = (post: Post) => {
    navigator.clipboard.writeText(post.content).then(() => {
      setCopied(post.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const kpis = [
    { label: "In Queue",         value: queue.length,      dot: "bg-blue-500",    num: "text-blue-600 dark:text-blue-400" },
    { label: "My Active",        value: mine.length,       dot: "bg-purple-500",  num: "text-purple-600 dark:text-purple-400" },
    { label: "Ready to Publish", value: ready.length,      dot: "bg-emerald-500", num: "text-emerald-600 dark:text-emerald-400" },
    { label: "Total Assigned",   value: inProgress.length, dot: "bg-amber-500",   num: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Design queue and your active work</p>
        </div>
        <Link href="/design">
          <Button size="sm">Open Design Queue</Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-0">
            <CardContent className="px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${k.dot}`} />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
              </div>
              <p className={`text-3xl font-bold tabular-nums ${k.num}`}>
                {loading ? <span className="text-muted-foreground">—</span> : k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved — waiting to be taken */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Approved for Design</CardTitle>
              {queue.length > 0 && (
                <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {queue.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />)}</div>
            ) : queue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No posts waiting for design.</p>
            ) : (
              <div className="space-y-2">
                {queue.map((post) => (
                  <div key={post.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {post.author_name} · {POST_TYPE_LABELS[post.post_type as PostType] ?? post.post_type}
                        </p>
                      </div>
                      <PostStatusBadge status={post.status as PostStatus} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => takePost(post)}
                        disabled={acting === post.id}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {acting === post.id ? "Taking…" : "Take Post"}
                      </button>
                      <button
                        onClick={() => copyContent(post)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors"
                      >
                        {copied === post.id ? "Copied!" : "Copy"}
                      </button>
                      <Link href={`/posts/${post.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My active designs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">My Active Designs</CardTitle>
              {mine.length > 0 && (
                <span className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  {mine.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />)}</div>
            ) : mine.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No active designs yet.</p>
                <p className="text-xs text-muted-foreground">Take a post from the queue to start.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mine.map((post) => (
                  <div key={post.id} className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {post.author_name} · {POST_TYPE_LABELS[post.post_type as PostType] ?? post.post_type}
                        </p>
                      </div>
                      <PostStatusBadge status={post.status as PostStatus} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markReady(post)}
                        disabled={acting === post.id}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {acting === post.id ? "Updating…" : "Mark Ready to Publish"}
                      </button>
                      <button
                        onClick={() => copyContent(post)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors"
                      >
                        {copied === post.id ? "Copied!" : "Copy"}
                      </button>
                      <Link href={`/posts/${post.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ready to publish — read-only reference */}
      {ready.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Ready to Publish</CardTitle>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                {ready.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border -mx-1">
              {ready.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="flex items-center justify-between px-1 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm font-medium truncate flex-1 mr-3">{post.title}</span>
                  <PostStatusBadge status={post.status as PostStatus} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Root — picks the right view ─────────────────────────────────────────────
export default function DashboardPage() {
  const { authRole, loading } = useUser();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (authRole === "employee") return <EmployeeDashboard />;
  if (authRole === "designer") return <DesignerDashboard />;
  return <AdminDashboard />;
}
