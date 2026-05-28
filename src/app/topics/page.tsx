"use client";

import { useEffect, useState } from "react";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface XTopic {
  id: number;
  username: string;
  user_title: string;
  quote: string;
  topic: string;
  category: string;
  post_url?: string;
  posted_at?: string;
}

/* ─── Category config ────────────────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  "Finance / PE / VC":    { color: "#10b981", icon: "💰" },
  "SaaS / Tech":          { color: "#3b82f6", icon: "⚡" },
  "Healthcare / MedTech": { color: "#ec4899", icon: "🏥" },
  "AI / LLM":             { color: "#8b5cf6", icon: "🤖" },
  "Macro / Economy":      { color: "#f59e0b", icon: "📈" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

/* ─── Relative time helper ───────────────────────────────────────────────────── */
function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return "";
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function absoluteTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/* ─── Avatar ─────────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#06b6d4"];
function Avatar({ handle }: { handle: string }) {
  const letter = handle.replace("@","")[0]?.toUpperCase() ?? "?";
  const color  = AVATAR_COLORS[handle.charCodeAt(1) % AVATAR_COLORS.length];
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ background: color }}
    >
      {letter}
    </div>
  );
}

/* ─── X icon ─────────────────────────────────────────────────────────────────── */
function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

/* ─── Topic Card ─────────────────────────────────────────────────────────────── */
function TopicCard({ item, index }: { item: XTopic; index: number }) {
  const cfg      = CATEGORY_CONFIG[item.category] ?? { color: "#6b7280", icon: "📌" };
  const relTime  = relativeTime(item.posted_at);
  const absTime  = absoluteTime(item.posted_at);
  const postUrl  = item.post_url ?? `https://x.com/${item.username.replace("@", "")}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200 relative flex flex-col gap-3">

      {/* Number badge */}
      <div
        className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: cfg.color }}
      >
        {index + 1}
      </div>

      {/* Author row */}
      <div className="flex items-center gap-3 pr-8">
        <Avatar handle={item.username} />
        <div className="min-w-0">
          <div className="font-bold text-sm">{item.username}</div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${cfg.color}20`, color: cfg.color }}
          >
            {item.user_title}
          </span>
        </div>
      </div>

      {/* Quote */}
      <p
        className="text-sm text-muted-foreground italic leading-relaxed border-l-2 pl-3 flex-1"
        style={{ borderColor: cfg.color }}
      >
        &ldquo;{item.quote}&rdquo;
      </p>

      {/* Topic */}
      <div className="flex items-start gap-2">
        <span className="text-xs font-semibold text-muted-foreground tracking-widest mt-0.5 shrink-0">
          TOPIC →
        </span>
        <p className="text-sm font-bold leading-snug">{item.topic}</p>
      </div>

      {/* Footer: timestamp + view on X link */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        {relTime ? (
          <span
            className="text-xs text-muted-foreground"
            title={absTime}
          >
            🕐 {relTime}
            {absTime && <span className="ml-1 opacity-60">· {absTime}</span>}
          </span>
        ) : (
          <span />
        )}

        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-90"
          style={{ background: cfg.color, color: "#fff" }}
        >
          <XIcon />
          View post
        </a>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-4/6 bg-muted rounded" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-3 w-48 bg-muted rounded" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function TopicsPage() {
  const [topics,    setTopics]    = useState<XTopic[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [fromDate,  setFromDate]  = useState("");
  const [toDate,    setToDate]    = useState("");

  const fetchTopics = () => {
    setLoading(true);
    setError(null);
    fetch("/api/topics")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setTopics(d.topics ?? []);
        setFromDate(d.from_date ?? "");
        setToDate(d.to_date ?? "");
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTopics(); }, []);

  const tabs    = ["All", ...ALL_CATEGORIES];
  const visible = activeTab === "All"
    ? topics
    : topics.filter(t => t.category === activeTab);

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            X Trending Topics
            <span className="text-base font-normal text-muted-foreground">𝕏</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              LIVE · 2 days
            </span>
          </h2>
          {fromDate && toDate && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {topics.length} trending posts · <strong>{fromDate}</strong> → <strong>{toDate}</strong>
            </p>
          )}
        </div>
        <button
          onClick={fetchTopics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            className={loading ? "animate-spin" : ""}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          {loading ? "Fetching…" : "Refresh"}
        </button>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const cfg      = tab === "All" ? null : CATEGORY_CONFIG[tab];
          const isActive = activeTab === tab;
          const count    = tab === "All" ? topics.length : topics.filter(t => t.category === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border flex items-center gap-1"
              style={isActive
                ? { background: cfg?.color ?? "#374151", color: "#fff", borderColor: "transparent" }
                : { background: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" }
              }
            >
              {cfg?.icon && <span>{cfg.icon}</span>}
              {tab}
              {!loading && count > 0 && (
                <span
                  className="ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-bold"
                  style={isActive
                    ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                    : { background: "var(--muted)", color: "var(--muted-foreground)" }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-5 py-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="text-4xl">📭</div>
          <p className="font-semibold">No topics found</p>
          <p className="text-sm text-muted-foreground">Try refreshing or selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((item, i) => (
            <TopicCard key={item.id ?? i} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
