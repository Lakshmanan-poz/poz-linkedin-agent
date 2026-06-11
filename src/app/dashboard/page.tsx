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

/* ─── Hex colours (SVG can't use Tailwind classes) ──────────────────────────── */
const STATUS_HEX: Record<string, string> = {
  draft:               "#6b7280",
  submitted:           "#ca8a04",
  under_review:        "#ea580c",
  changes_requested:   "#dc2626",
  approved_for_design: "#2563eb",
  design_in_progress:  "#7c3aed",
  ready_to_publish:    "#059669",
  published:           "#16a34a",
};

const GROUPED_STAGES = [
  { label: "Draft",      statuses: ["draft"],                                                   color: "#6b7280" },
  { label: "In Review",  statuses: ["submitted", "under_review", "changes_requested"],           color: "#f59e0b" },
  { label: "In Design",  statuses: ["approved_for_design", "design_in_progress"],                color: "#3b82f6" },
  { label: "Publishing", statuses: ["ready_to_publish", "published"],                            color: "#10b981" },
] as const;
/* ─── SVG Vertical Bar Chart ─────────────────────────────────────────────────── */
function VerticalBarChart({
  bars,
  height = 130,
}: {
  bars: { label: string; value: number; color: string }[];
  height?: number;
}) {
  if (bars.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No data</p>;
  const W      = 320;
  const labelH = 44;
  const pad    = 6;
  const max    = Math.max(...bars.map(b => b.value), 1);
  const slotW  = (W - pad * 2) / bars.length;
  const barW   = Math.min(slotW * 0.55, 36);

  return (
    <svg viewBox={`0 0 ${W} ${height + labelH}`} style={{ width: "100%", height: height + labelH }} overflow="visible">
      {bars.map((bar, i) => {
        const x    = pad + i * slotW + (slotW - barW) / 2;
        const cx   = x + barW / 2;
        const barH = Math.max((bar.value / max) * (height - 20), bar.value > 0 ? 4 : 0);
        const y    = height - barH;
        return (
          <g key={i}>
            {/* track */}
            <rect x={x} y={0} width={barW} height={height} rx={6} fill="#f1f5f9" className="dark:opacity-10" />
            {/* bar */}
            {bar.value > 0 && (
              <rect x={x} y={y} width={barW} height={barH} rx={6} fill={bar.color} opacity={0.9} />
            )}
            {/* value label */}
            {bar.value > 0 && (
              <text x={cx} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="700" fill={bar.color}>
                {bar.value}
              </text>
            )}
            {/* axis label — rotated so full text fits */}
            <text
              x={cx}
              y={height + 8}
              textAnchor="end"
              fontSize={10}
              fontWeight="600"
              fill="#4b5563"
              transform={`rotate(-38, ${cx}, ${height + 8})`}
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}


/* ─── SVG Activity Bar Chart ─────────────────────────────────────────────────── */
function ActivityBarChart({ bars, height = 120, color = "#00AAEC" }: { bars: { label: string; value: number }[]; height?: number; color?: string }) {
  if (bars.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No data</p>;
  const W = 320, labelH = 20, pad = 10;
  const max = Math.max(...bars.map(b => b.value), 1);
  const slotW = (W - pad * 2) / bars.length;
  const barW  = Math.min(slotW * 0.6, 30);

  return (
    <svg viewBox={`0 0 ${W} ${height + labelH}`} style={{ width: "100%", height: height + labelH }}>
      {bars.map((bar, i) => {
        const x    = pad + i * slotW + (slotW - barW) / 2;
        const barH = Math.max((bar.value / max) * (height - 20), bar.value > 0 ? 4 : 0);
        const y    = height - barH;
        return (
          <g key={i}>
            <rect x={x} y={4} width={barW} height={height - 4} rx={5} fill="#f1f5f9" className="dark:opacity-10" />
            {bar.value > 0 && (
              <rect x={x} y={y} width={barW} height={barH} rx={5} fill={color} opacity={0.85} />
            )}
            {bar.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill={color}>
                {bar.value}
              </text>
            )}
            {(bars.length <= 10 || i % Math.ceil(bars.length / 10) === 0) && (
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize={8.5} fill="#9ca3af">
                {bar.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Calendar Heatmap ───────────────────────────────────────────────────────── */
function CalendarHeatmap({ activity, month }: { activity: { created_at: string }[]; month: Date }) {
  const year = month.getFullYear();
  const mon  = month.getMonth();

  const counts: Record<number, number> = {};
  activity.forEach(a => {
    const d = new Date(a.created_at);
    if (d.getFullYear() === year && d.getMonth() === mon) {
      counts[d.getDate()] = (counts[d.getDate()] || 0) + 1;
    }
  });

  const firstDay    = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today       = new Date();

  const cellColor = (c: number) =>
    c === 0 ? "#f1f5f9" : c === 1 ? "#bfdbfe" : c <= 3 ? "#60a5fa" : "#2563eb";

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="w-full space-y-1">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-muted-foreground uppercase">{d}</div>
        ))}
      </div>
      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="h-8" />;
            const c = counts[day] || 0;
            const isToday = today.getFullYear() === year && today.getMonth() === mon && today.getDate() === day;
            return (
              <div
                key={di}
                title={`${c} activit${c === 1 ? "y" : "ies"} — ${month.toLocaleString("en", { month: "short" })} ${day}`}
                style={{ background: cellColor(c), color: c >= 2 ? "#fff" : c === 1 ? "#1d4ed8" : "#94a3b8" }}
                className={`h-8 rounded-md flex items-center justify-center text-[10px] font-semibold select-none${isToday ? " ring-2 ring-offset-1 ring-[#00AAEC]" : ""}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center gap-1 pt-1 justify-end">
        <span className="text-[9px] text-muted-foreground mr-0.5">Less</span>
        {[0, 1, 2, 4].map(c => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ background: cellColor(c) }} />
        ))}
        <span className="text-[9px] text-muted-foreground ml-0.5">More</span>
      </div>
    </div>
  );
}

/* ─── SVG Donut Chart ────────────────────────────────────────────────────────── */
function DonutChart({
  segments,
  label,
}: {
  segments: { name: string; value: number; color: string }[];
  label?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const CX = 58, CY = 58, R = 48, r = 30;
  let angle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const frac       = seg.value / total;
    const startAngle = angle;
    angle += frac * Math.PI * 2;
    const endAngle   = angle;
    const large      = frac > 0.5 ? 1 : 0;
    const x1 = CX + R * Math.cos(startAngle), y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle),   y2 = CY + R * Math.sin(endAngle);
    const xi1 = CX + r * Math.cos(startAngle), yi1 = CY + r * Math.sin(startAngle);
    const xi2 = CX + r * Math.cos(endAngle),   yi2 = CY + r * Math.sin(endAngle);
    return {
      ...seg, frac,
      path: `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${xi2.toFixed(1)},${yi2.toFixed(1)} A${r},${r} 0 ${large},0 ${xi1.toFixed(1)},${yi1.toFixed(1)} Z`,
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 116 116" style={{ width: 116, height: 116, flexShrink: 0 }}>
        {arcs.map(arc => arc.frac > 0 && (
          <path key={arc.name} d={arc.path} fill={arc.color} opacity={0.9} />
        ))}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize={16} fontWeight="700" fill="#374151">{total}</text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize={8.5} fill="#9ca3af">{label ?? "posts"}</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {arcs.filter(a => a.value > 0).map(arc => (
          <div key={arc.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: arc.color }} />
            <span className="text-xs text-muted-foreground truncate flex-1">{arc.name}</span>
            <span className="text-xs font-bold tabular-nums">{arc.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

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
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors hover:opacity-90"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
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
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [calMonth, setCalMonth]     = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const load = () =>
      fetch("/api/dashboard/stats")
        .then((r) => r.json())
        .then((data) => { setStats(data); setLastUpdated(new Date()); })
        .catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const pbs = (stats?.postsByStatus ?? {}) as Record<string, number>;
  const acceptedCount = (pbs.approved_for_design || 0) + (pbs.design_in_progress || 0) + (pbs.ready_to_publish || 0) + (pbs.published || 0);
  const rejectedCount = pbs.changes_requested || 0;

  const KPI_CARDS = [
    { label: "Total Posts",    value: stats?.totalPosts,         dot: "bg-primary",     num: "text-primary",                              spark: "#00AAEC" },
    { label: "Monthly Posts",  value: stats?.publishedThisMonth, dot: "bg-violet-500",  num: "text-violet-600 dark:text-violet-400",       spark: "#8b5cf6" },
    { label: "Accepted",       value: acceptedCount,             dot: "bg-emerald-500", num: "text-emerald-600 dark:text-emerald-400",     spark: "#10b981" },
    { label: "Rejected",       value: rejectedCount,             dot: "bg-red-500",     num: "text-red-600 dark:text-red-400",             spark: "#ef4444" },
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
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Auto-refreshes every 30s · Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <Link href="/review">
          <Button size="sm" className="h-8 text-xs">Review Queue</Button>
        </Link>
      </div>

      {/* KPI row — 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Posts",  value: stats.totalPosts ?? 0,         color: "#00AAEC", bg: "#00AAEC12",
            icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
          { label: "This Month",   value: stats.publishedThisMonth ?? 0, color: "#8b5cf6", bg: "#8b5cf612",
            icon: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></> },
          { label: "Accepted",     value: acceptedCount,                 color: "#10b981", bg: "#10b98112",
            icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
          { label: "Rejected",     value: rejectedCount,                 color: "#ef4444", bg: "#ef444412",
            icon: <><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></> },
        ].map((k) => (
          <Card key={k.label} className="gap-0 border-0 shadow-sm" style={{ background: k.bg }}>
            <CardContent className="px-4 pt-4 pb-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider leading-tight">{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: k.color + "22" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
                </div>
              </div>
              <p className="text-[30px] font-black tabular-nums leading-none" style={{ color: k.color }}>{fmt(k.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline + Activity — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline */}
        <Card>
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px] font-semibold">Pipeline</CardTitle>
              <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{fmt(stats.totalPosts ?? 0)} posts</span>
            </div>
          </CardHeader>
          <CardContent className="py-3 px-4 space-y-3">
            {GROUPED_STAGES.map((stage) => {
              const count = stage.statuses.reduce((sum, s) => sum + ((stats.postsByStatus as Record<string, number>)[s] || 0), 0);
              const pct   = Math.round((count / (stats.totalPosts || 1)) * 100);
              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                      <span className="text-[12px] font-medium">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{pct}%</span>
                      <span className="text-[13px] font-bold tabular-nums w-8 text-right" style={{ color: stage.color }}>{fmt(count)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Activity Calendar */}
        <Card>
          <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[13px] font-semibold">Activity Trend</CardTitle>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="text-[11px] font-semibold px-1 w-[76px] text-center tabular-nums">
                {calMonth.toLocaleString("en", { month: "short", year: "numeric" })}
              </span>
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                disabled={calMonth.getFullYear() === new Date().getFullYear() && calMonth.getMonth() === new Date().getMonth()}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <CalendarHeatmap activity={stats.recentActivity} month={calMonth} />
          </CardContent>
        </Card>
      </div>

      {/* Team Contributions — leaderboard */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[15px] font-semibold">Team Contributions</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Created & reached publishing stage</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats.teamContributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <p className="text-sm text-muted-foreground">No contributions yet</p>
            </div>
          ) : (() => {
            const sorted = [...stats.teamContributions].sort((a, b) => b.posts_created - a.posts_created);
            const max = Math.max(...sorted.map(x => x.posts_created), 1);
            const rankLabels = ["🥇", "🥈", "🥉"];
            const avatarColors    = ["#00AAEC20", "#8B5CF620", "#10B98120", "#F59E0B20", "#EF444420", "#6366F120"];
            const avatarTextColors = ["#00AAEC",  "#8B5CF6",   "#10B981",   "#F59E0B",   "#EF4444",   "#6366F1"];
            return (
              <div className="max-h-80 overflow-y-auto">
                {/* Column headers */}
                <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
                  <span className="w-5 shrink-0" />
                  <span className="w-8 shrink-0" />
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Member</span>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)] w-14 text-center">Created</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 w-16 text-center">Published</span>
                  </div>
                </div>

                {sorted.map((tc, i) => {
                  const pct      = Math.round((tc.posts_created / max) * 100);
                  const initials = tc.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  const colorIdx = i % avatarColors.length;
                  return (
                    <div
                      key={tc.name}
                      className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Rank */}
                      <span className="text-[13px] w-5 shrink-0 text-center">
                        {i < 3 ? rankLabels[i] : <span className="text-[11px] font-semibold text-muted-foreground">{i + 1}</span>}
                      </span>

                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                        style={{ background: avatarColors[colorIdx], color: avatarTextColors[colorIdx] }}
                      >
                        {initials}
                      </div>

                      {/* Name + progress bar */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[12.5px] font-semibold truncate block mb-1">{tc.name.split(" ")[0]}</span>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: avatarTextColors[colorIdx] }}
                          />
                        </div>
                      </div>

                      {/* Counts */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="w-14 text-center">
                          <span className="text-[15px] font-black tabular-nums" style={{ color: avatarTextColors[colorIdx] }}>
                            {tc.posts_created}
                          </span>
                        </div>
                        <div className="w-16 text-center">
                          <span className={`text-[15px] font-black tabular-nums ${tc.posts_published > 0 ? "text-emerald-500" : "text-muted-foreground/30"}`}>
                            {tc.posts_published}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

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
    // Initial load — full fetch including notifications + confetti
    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ])
      .then(([postsData, notifData]) => {
        const notifs: Notification[] = notifData.notifications || [];
        setPosts(Array.isArray(postsData) ? postsData : []);
        setNotifications(notifs);
        setLoading(false);
        if (notifs.some((n) => n.type === "published" && !n.is_read)) {
          setShowConfetti(true);
        }
        if (notifs.some((n) => !n.is_read)) {
          fetch("/api/notifications/read-all", { method: "PATCH" })
            .then(() => window.dispatchEvent(new CustomEvent("notifications-read")))
            .catch(() => {});
          setNotifications(notifs.map((n) => ({ ...n, is_read: true })));
        }
      })
      .catch(() => setLoading(false));

    // Poll every 30s — silently refresh post counts so KPI cards stay up to date
    const t = setInterval(() => {
      fetch("/api/posts")
        .then((r) => r.json())
        .then((data) => setPosts(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(t);
  }, [currentUser]);

  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const unread = notifications.filter((n) => !n.is_read);

  const empKpis = [
    { label: "Total Posts", value: posts.length,                                                                                                                                           dot: "bg-primary",      num: "text-primary" },
    { label: "Draft",       value: statusCounts["draft"] || 0,                                                                                                                             dot: "bg-zinc-400",     num: "text-zinc-600 dark:text-zinc-400" },
    { label: "In Review",   value: (statusCounts["submitted"] || 0) + (statusCounts["under_review"] || 0) + (statusCounts["changes_requested"] || 0),                                    dot: "bg-amber-500",    num: "text-amber-600 dark:text-amber-400" },
    { label: "Published",   value: (statusCounts["ready_to_publish"] || 0) + (statusCounts["published"] || 0),                                                                            dot: "bg-emerald-500",  num: "text-emerald-600 dark:text-emerald-400" },
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

      {/* Charts row — donut + bar */}
      {!loading && (() => {
        const donutSegs = GROUPED_STAGES
          .map(g => ({
            name: g.label,
            value: g.statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0),
            color: g.color,
          }))
          .filter(seg => seg.value > 0);
        const SOURCE_CATEGORIES = [
          {
            label: "Agent Catalog",
            color: "#8b5cf6",
            // posts tagged explicitly OR old posts with no ai fields (all created via agent catalog)
            test: (p: Post) => p.ai_model === "agent-catalog" || (!p.ai_model && !p.ai_prompt),
          },
          {
            label: "AI Generator",
            color: "#f59e0b",
            // posts generated via the AI writer (has ai_prompt set, model isn't agent-catalog)
            test: (p: Post) => !!p.ai_prompt && p.ai_model !== "agent-catalog",
          },
          {
            label: "Manual",
            color: "#3b82f6",
            // posts with an explicit non-catalog ai_model but no prompt (shouldn't happen, safety net)
            test: (p: Post) => !!p.ai_model && p.ai_model !== "agent-catalog" && !p.ai_prompt,
          },
        ];
        const sourceBars = SOURCE_CATEGORIES.map(s => ({
          label: s.label,
          value: posts.filter(s.test).length,
          color: s.color,
        }));
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">My Posts by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {donutSegs.length === 0
                  ? <p className="text-xs text-muted-foreground py-4 text-center">No posts yet</p>
                  : <DonutChart segments={donutSegs} label="my posts" />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">My Posts by Source</CardTitle>
              </CardHeader>
              <CardContent className="pb-10">
                <VerticalBarChart bars={sourceBars} height={130} />
              </CardContent>
            </Card>
          </div>
        );
      })()}

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
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors hover:opacity-90"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
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
