"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/providers/user-provider";
import { AGENTS } from "@/lib/agents/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Colour config ─────────────────────────────────────────────────────────── */
type Color = "blue" | "purple" | "emerald";

const C: Record<Color, { grad: string; tab: string; chip: string; label: string; card: string }> = {
  blue: {
    grad:  "from-blue-500 to-indigo-600",
    tab:   "bg-blue-600 text-white",
    chip:  "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40",
    label: "text-blue-600 dark:text-blue-400",
    card:  "hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/20",
  },
  purple: {
    grad:  "from-purple-500 to-violet-600",
    tab:   "bg-purple-600 text-white",
    chip:  "border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40",
    label: "text-purple-600 dark:text-purple-400",
    card:  "hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30 dark:hover:bg-purple-950/20",
  },
  emerald: {
    grad:  "from-emerald-500 to-teal-600",
    tab:   "bg-emerald-600 text-white",
    chip:  "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
    label: "text-emerald-600 dark:text-emerald-400",
    card:  "hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20",
  },
};

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
function IconEdit()         { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>; }
function IconBulb()         { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>; }
function IconTarget()       { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function IconArrowUp()      { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>; }
function IconBack()         { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>; }
function IconPlus()         { return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>; }
function IconChevronRight() { return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>; }
function IconPaperclip()    { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>; }
function IconCamera()       { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg>; }
function IconPlug()         { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>; }
function IconLayers()       { return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>; }
function IconSettings2()    { return <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>; }
function IconCalendar()     { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>; }
function IconLinkedin()     { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>; }
function IconStar()         { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

const ICON_MAP: Record<string, React.ReactNode> = {
  edit:      <IconEdit />,
  lightbulb: <IconBulb />,
  target:    <IconTarget />,
};

/* ─── Generating progress bar ───────────────────────────────────────────────── */
function GeneratingProgressBar({ label }: { label?: string }) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setProgress(prev => {
        if (prev >= 97) return prev;
        return Math.min(97, prev + (97 - prev) * 0.04 + 0.3);
      });
    }, 120);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="py-1 w-64 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground truncate pr-2">{label || "Generating…"}</span>
        <span className="text-[12px] font-semibold text-foreground shrink-0">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg,#f97316,#ef4444,#ec4899)" }}
        />
      </div>
    </div>
  );
}

/* ─── POZ star logo ─────────────────────────────────────────────────────────── */
function PozStar({ size = 8 }: { size?: number }) {
  const s = size * 4;
  return (
    <div
      className="rounded-lg bg-linear-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-md shrink-0"
      style={{ width: s, height: s }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={s * 0.44} height={s * 0.44} viewBox="0 0 24 24"
        fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
    </div>
  );
}

/* ─── Chat types & result shapes ────────────────────────────────────────────── */
type EmbedType = "daily-content" | "weekly-calendar" | "content-refiner" | "topic-analysis";

type TrendItem = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  type: string;
  topic: string;
  summary: string;
  handle?: string;
  authority?: string;
  whatTheySaid?: string;
  post_url?: string;
  posted_at?: string;
};

type TrendPendingQ =
  | { type: "trend-topic-pick"; trends: TrendItem[]; seenTopics: string[] }
  | { type: "trend-more";       seenTopics: string[] }
  | { type: "trend-format";     topic: string; day: string; contentType: string }
  | { type: "trend-slides";     topic: string; day: string; contentType: string }
  | { type: "topic-format";     topic: string }
  | { type: "topic-slides";     topic: string };

type LegacyPendingQ = {
  type: "slide-count" | "single-page-confirm" | "paste-content";
  intent: EmbedType;
  originalText: string;
};

type PendingQ = LegacyPendingQ | TrendPendingQ;

type VisualizationIdea = {
  position: number;
  background: string;
  typography: string;
  layout: string;
  colorScheme: string;
  designNote: string;
};

type XTrends = {
  status?: "ok" | "no-key" | "insufficient" | "error" | "no-query";
  statusMessage?: string;
  window: { since: string; until: string };
  methodology?: string;
  sources?: { handle: string; authority: string; whatTheySaid: string; relevance: string }[];
  highLevelTrends: {
    trend: string;
    convergence?: string;
    velocity?: string;
    authoritySignal?: string;
    enterpriseRelevance?: string;
    contentGap?: string;
  }[];
  keyDataPoints: string[];
};

type WebSource = { title: string; url?: string; domain?: string; snippet?: string };
type DailyResult = {
  day: string; contentType: string; topic: string;
  angle?: string; framework?: string;
  slides: { position: number; type: string; title: string; body: string }[];
  caption: string; hashtags: string[];
  bodyPost?: string;
  outreachHook?: string;
  trendInsights?: string[];
  visualizationIdeas?: VisualizationIdea[];
  _xTrends?: XTrends;
  _webSources?: WebSource[];
};
type CalDay = { day: string; type: string; contentFocus: string; brief: string; hook: string; hashtags: string[] };
type CalendarResult = { weekOf: string; company: string; industry: string; summary: string; days: CalDay[]; _xTrends?: XTrends };
type RefinerResult = {
  overallScore: number;
  hatScores: { cSuite: { score: number; verdict: string }; algorithm: { score: number; verdict: string }; specialist: { score: number; verdict: string } };
  slideAudits: { slide: number; verdict: "pass" | "fix" | "fail"; issue: string }[];
  refined: { slides: { position: number; type: string; title: string; body: string; status: "Fixed" | "Unchanged"; note: string }[]; caption: string; hashtags: string[] };
  publishReady: boolean; finalNote: string;
  _xTrends?: XTrends;
};

interface ChatMsg {
  id: string;
  role: "user" | "agent";
  text: string;
  generating?: boolean;
  resultType?: EmbedType;
  resultData?: DailyResult | CalendarResult | RefinerResult;
  error?: string;
  quickReplies?: Array<{ label: string; value: string }>;
  trendList?: TrendItem[];
  trendSources?: Array<{ handle: string; authority?: string }>;
}

interface ChatSession {
  id: number;
  session_id: string;
  user_id: number;
  title: string;
  messages: ChatMsg[];
  last_message_at: string;
  created_at: string;
}

/* ─── History panel (left) ────────────────────────────────────────────────────── */
function HistoryPanel({
  sessions, activeId, loading,
  onSelect, onNew, onDelete,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  loading: boolean;
  onSelect: (s: ChatSession) => void;
  onNew: () => void;
  onDelete: (sessionId: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setIsScrolled(el.scrollTop > 8);
    setCanScrollMore(el.scrollHeight - el.scrollTop - el.clientHeight > 24);
  }

  React.useEffect(() => {
    // Re-check after render when sessions change
    const t = setTimeout(checkScroll, 80);
    return () => clearTimeout(t);
  }, [sessions, search]);

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  function fmtDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000)     return "just now";
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }

  const filtered = search.trim()
    ? sessions.filter((s) => (s.title ?? "").toLowerCase().includes(search.toLowerCase()))
    : sessions;

  const groups: { label: string; items: ChatSession[] }[] = [];
  const now = Date.now();
  const today: ChatSession[] = [], yesterday: ChatSession[] = [], week: ChatSession[] = [], older: ChatSession[] = [];
  filtered.forEach((s) => {
    const diff = now - new Date(s.last_message_at).getTime();
    if (diff < 86_400_000)       today.push(s);
    else if (diff < 172_800_000) yesterday.push(s);
    else if (diff < 604_800_000) week.push(s);
    else                          older.push(s);
  });
  if (today.length)     groups.push({ label: "Today",     items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (week.length)      groups.push({ label: "This week", items: week });
  if (older.length)     groups.push({ label: "Older",     items: older });

  return (
    <div className="w-[260px] shrink-0 border-r border-border bg-background flex flex-col h-full overflow-hidden">

      {/* New chat button */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-sm font-semibold transition-colors border border-primary/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-7 pr-8 py-1.5 text-xs rounded-lg bg-muted border border-border outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversation count + top shadow when scrolled */}
      <div className={cn(
        "px-4 pb-1 shrink-0 flex items-center justify-between transition-all",
        isScrolled ? "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]" : ""
      )}>
        {!loading && filtered.length > 0 && (
          <span className="text-[10px] text-muted-foreground/40 font-medium">
            {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Scrollable sessions list */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="h-full overflow-y-auto px-2 pb-10 space-y-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
        >
          {loading && (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin w-4 h-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-[11px] text-muted-foreground/50 text-center px-3 py-8 leading-relaxed">
              {search ? "No conversations match." : "No chats yet.\nStart a conversation."}
            </p>
          )}
          {!loading && groups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-2 py-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((s) => (
                  <div
                    key={s.session_id}
                    className={cn(
                      "group relative flex items-start rounded-xl px-3 py-2.5 cursor-pointer transition-colors",
                      s.session_id === activeId
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onSelect(s)}
                  >
                    <div className="flex-1 min-w-0 pr-5">
                      <p className={cn(
                        "text-xs font-medium leading-snug truncate",
                        s.session_id === activeId ? "text-foreground" : ""
                      )}>
                        {s.title ?? "Untitled"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">{fmtDate(s.last_message_at)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(s.session_id); }}
                      title="Delete"
                      className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom fade gradient — visible when more content below */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-opacity duration-300",
          canScrollMore ? "opacity-100" : "opacity-0"
        )}
          style={{ background: "linear-gradient(to top, hsl(var(--background)) 20%, transparent)" }}
        />

        {/* Scroll-to-bottom button */}
        {canScrollMore && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 shadow-sm transition-all z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            scroll down
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Markdown-lite text renderer ───────────────────────────────────────────── */
function MdText({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className={cn("space-y-2", className)}>
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        return (
          <p key={pi} className="leading-[1.7] whitespace-pre-wrap">
            {lines.map((line, li) => {
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <React.Fragment key={li}>
                  {li > 0 && <br />}
                  {parts.map((p, j) =>
                    p.startsWith("**") && p.endsWith("**")
                      ? <strong key={j} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
                      : <React.Fragment key={j}>{p}</React.Fragment>
                  )}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

/* ─── Day colour config (used in result cards) ───────────────────────────────── */
const DAY_CFG: Record<string, { type: string; color: string; bg: string; border: string; badge: string }> = {
  Monday:    { type: "Thought Leadership", color: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-800",    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"    },
  Tuesday:   { type: "Engagement Post",    color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  Wednesday: { type: "Tool Spotlight",     color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  Thursday:  { type: "Industry Insight",   color: "text-emerald-700 dark:text-emerald-300",bg:"bg-emerald-50 dark:bg-emerald-950/30",border:"border-emerald-200 dark:border-emerald-800",badge:"bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"},
  Friday:    { type: "Forward-Looking",    color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-200 dark:border-rose-800",     badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"     },
};
const CAL_DAY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  Monday:    { color: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-800"    },
  Tuesday:   { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800" },
  Wednesday: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800" },
  Thursday:  { color: "text-emerald-700 dark:text-emerald-300",bg:"bg-emerald-50 dark:bg-emerald-950/30",border:"border-emerald-200 dark:border-emerald-800"},
  Friday:    { color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-200 dark:border-rose-800"     },
};

/* ─── Save helper ────────────────────────────────────────────────────────────── */
async function saveOutput(payload: {
  agent_id: string; skill_id: string; title: string;
  input_params: string; output_json: string; created_by: number;
}) {
  const res = await fetch("/api/agents/outputs", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) { let m = "Save failed"; try { m = (await res.json()).error ?? m; } catch {} throw new Error(m); }
}

/* ─── Professional X/Twitter trend scan (12+ sources, not engagement-based) ── */
function XTrendsCard({ trends }: { trends: XTrends }) {
  if (!trends) return null;
  const sourceCount = trends.sources?.length ?? 0;
  const meetsMin = sourceCount >= 12;
  const status = trends.status ?? (sourceCount > 0 ? "ok" : "insufficient");

  // For failure/config states, render a short explanatory card instead of
  // hiding the card silently. This is how the user knows WHY they have no
  // sources (missing XAI_API_KEY, x.ai error, niche topic, etc.).
  if (status !== "ok" && sourceCount === 0 && (trends.highLevelTrends?.length ?? 0) === 0) {
    const tone =
      status === "no-key"
        ? { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", label: "text-amber-700 dark:text-amber-300", heading: "Live X search not configured" }
        : status === "error"
        ? { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", label: "text-red-700 dark:text-red-300", heading: "Live X search failed" }
        : status === "insufficient"
        ? { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", label: "text-amber-700 dark:text-amber-300", heading: "Fewer than 12 credible sources found" }
        : { bg: "bg-muted/40", border: "border-border", label: "text-muted-foreground", heading: "X trend scan skipped" };
    return (
      <div className={cn("rounded-xl border-2 p-4 space-y-2", tone.bg, tone.border)}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-bold">𝕏</span>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", tone.label)}>
            {tone.heading}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto">
            {trends.window.since} → {trends.window.until}
          </span>
        </div>
        {trends.statusMessage && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{trends.statusMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-bold">𝕏</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Professional trend scan · last 7 days
        </span>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold",
            meetsMin
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
          )}
          title={meetsMin ? "12+ sources analysed" : "Fewer than 12 credible sources found"}
        >
          {sourceCount}/12 sources
        </span>
        <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto">
          {trends.window.since} → {trends.window.until}
        </span>
      </div>

      {trends.methodology && (
        <p className="text-[11px] text-muted-foreground italic leading-relaxed border-l-2 border-border pl-2">
          {trends.methodology}
        </p>
      )}

      {trends.highLevelTrends?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            High-level trends (by convergence + velocity)
          </p>
          {trends.highLevelTrends.map((t, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black tabular-nums pt-0.5 shrink-0 text-blue-600 dark:text-blue-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xs font-bold leading-snug text-foreground flex-1">{t.trend}</p>
              </div>
              <div className="pl-6 space-y-1 text-[11px] leading-relaxed">
                {t.convergence && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24 shrink-0 pt-px">Convergence</span>
                    <span className="text-foreground">{t.convergence}</span>
                  </div>
                )}
                {t.velocity && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24 shrink-0 pt-px">Velocity</span>
                    <span className="text-foreground">{t.velocity}</span>
                  </div>
                )}
                {t.authoritySignal && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24 shrink-0 pt-px">Authority</span>
                    <span className="text-foreground">{t.authoritySignal}</span>
                  </div>
                )}
                {t.enterpriseRelevance && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24 shrink-0 pt-px">Enterprise</span>
                    <span className="text-foreground">{t.enterpriseRelevance}</span>
                  </div>
                )}
                {t.contentGap && (
                  <div className="flex items-start gap-1.5 pt-1 border-t border-border/40">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-24 shrink-0 pt-px">POV gap</span>
                    <span className="text-foreground italic">{t.contentGap}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {trends.keyDataPoints?.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Key data points</p>
          {trends.keyDataPoints.map((d, i) => (
            <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">• {d}</p>
          ))}
        </div>
      )}

      {sourceCount > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Sources ({sourceCount}) — ranked by authority, not engagement
          </p>
          <div className="space-y-1">
            {trends.sources!.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <span className="text-[10px] font-black tabular-nums text-muted-foreground/60 w-5 shrink-0 pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground">{s.handle}</span>
                  {s.authority && <span className="text-muted-foreground"> — {s.authority}</span>}
                  {s.whatTheySaid && (
                    <p className="text-muted-foreground italic mt-0.5">&ldquo;{s.whatTheySaid}&rdquo;</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inline result cards ────────────────────────────────────────────────────── */
function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving || saved} className={cn(
      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
      saved  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
             : saving ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
             : "bg-primary text-primary-foreground border-primary hover:opacity-90"
    )}>
      {saved ? "✓ Saved" : saving ? "Saving…" : (
        <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save</>
      )}
    </button>
  );
}

function ReviewBtn({ submitting, submitted, onClick }: { submitting: boolean; submitted: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={submitting || submitted} className={cn(
      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
      submitted  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
               : submitting ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
               : "bg-primary text-primary-foreground hover:bg-primary/90"
    )}>
      {submitted ? "✓ Sent to Review" : submitting ? "Sending…" : (
        <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>Send to Review</>
      )}
    </button>
  );
}

function CopyIconBtn({ text, title = "Copy to clipboard", size = 12, className }: { text: string; title?: string; size?: number; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : title}
      className={cn(
        "flex items-center justify-center rounded-md border transition-all shrink-0",
        copied
          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 11 4 11"/><line x1="4" x2="4" y1="11" y2="16"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      )}
    </button>
  );
}

async function submitForReview(params: {
  title: string; content: string; postType: string;
  carouselSlides?: string; hashtags?: string; userId: number;
}): Promise<void> {
  const createRes = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: params.title, content: params.content, post_type: params.postType,
      platform: "linkedin", author_id: params.userId,
      carousel_slides: params.carouselSlides ?? null,
      hashtags: params.hashtags ?? null, status: "draft",
      ai_model: "agent-catalog",
    }),
  });
  if (!createRes.ok) throw new Error((await createRes.json()).error ?? "Failed to create post");
  const post = await createRes.json();
  if (!post?.id) throw new Error("Post created but ID missing");
  const statusRes = await fetch(`/api/posts/${post.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "submitted", changed_by: params.userId }),
  });
  if (!statusRes.ok) {
    const err = await statusRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to submit for review");
  }
}

/* ─── Manual Carousel Editor ─────────────────────────────────────────────────── */
const SLIDE_TYPE_OPTIONS = ["Hook", "Problem", "Solution", "Insight", "Data", "Story", "Reframe", "The Shift", "Context", "CTA", "Close"];

type ManualSlide = { position: number; type: string; title: string; body: string };

function ManualCarouselEditor({ userId, userName, onClose }: { userId?: number; userName?: string; onClose: () => void }) {
  const [postTitle,    setPostTitle]    = React.useState("");
  const [slides,       setSlides]       = React.useState<ManualSlide[]>([
    { position: 1, type: "Hook",    title: "", body: "" },
    { position: 2, type: "Insight", title: "", body: "" },
    { position: 3, type: "CTA",     title: "", body: "" },
  ]);
  const [caption,      setCaption]      = React.useState("");
  const [tagInput,     setTagInput]     = React.useState("");
  const [hashtags,     setHashtags]     = React.useState<string[]>(["PointOneZero"]);
  const [submitting,   setSubmitting]   = React.useState(false);
  const [submitted,    setSubmitted]    = React.useState(false);

  function addSlide() {
    if (slides.length >= 15) return;
    setSlides((prev) => [...prev, { position: prev.length + 1, type: "Insight", title: "", body: "" }]);
  }

  function removeSlide(idx: number) {
    setSlides((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i + 1 })));
  }

  function updateSlide(idx: number, field: keyof ManualSlide, value: string) {
    setSlides((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= slides.length) return;
    setSlides((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr.map((s, i) => ({ ...s, position: i + 1 }));
    });
  }

  function addTag() {
    const tag = tagInput.replace(/^#/, "").trim();
    if (tag && !hashtags.includes(tag)) setHashtags((p) => [...p, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    if (tag === "PointOneZero") return;
    setHashtags((p) => p.filter((t) => t !== tag));
  }

  async function sendToReview() {
    if (!userId) { toast.error("Not logged in"); return; }
    if (!postTitle.trim()) { toast.error("Add a post title"); return; }
    if (slides.some((s) => !s.title.trim())) { toast.error("Every slide needs a title"); return; }
    setSubmitting(true);
    try {
      const contentLines = slides.map((s) => `${s.title}\n${s.body}`);
      if (caption) contentLines.push(`\nCaption:\n${caption}`);
      const content = contentLines.join("\n\n").trim();

      const carouselPayload = {
        type: "manual",
        slides: slides.map((s) => ({ position: s.position, type: s.type, title: s.title, body: s.body, status: "Manual", note: "" })),
        caption,
        hashtags,
      };

      await submitForReview({
        title: postTitle.trim(),
        content,
        postType: "carousel",
        carouselSlides: JSON.stringify(carouselPayload),
        hashtags: JSON.stringify(hashtags),
        userId,
      });
      setSubmitted(true);
      toast.success("Sent to admin for review!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to submit"); }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Write Carousel Manually</p>
            <p className="text-[11px] text-muted-foreground">Build your slides, caption, and hashtags — then send to admin</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground text-xs transition-colors">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Post title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Post Title</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Blockchain redefines infrastructure"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
          </div>

          {/* Slides */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slides ({slides.length}/15)</label>
              <button
                onClick={addSlide}
                disabled={slides.length >= 15}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add Slide
              </button>
            </div>

            {slides.map((slide, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                {/* Slide header row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-muted-foreground tabular-nums w-5">{String(slide.position).padStart(2, "0")}</span>
                  <select
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                    value={slide.type}
                    onChange={(e) => updateSlide(idx, "type", e.target.value)}
                  >
                    {SLIDE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSlide(idx, -1)} disabled={idx === 0} className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors text-xs">↑</button>
                    <button onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors text-xs">↓</button>
                    <button onClick={() => removeSlide(idx)} disabled={slides.length <= 1} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors text-xs">✕</button>
                  </div>
                </div>
                {/* Title */}
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Slide title (4–6 words)"
                  value={slide.title}
                  onChange={(e) => updateSlide(idx, "title", e.target.value)}
                />
                {/* Body */}
                <textarea
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Slide body (10–15 words)"
                  rows={2}
                  value={slide.body}
                  onChange={(e) => updateSlide(idx, "body", e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Caption</label>
            <textarea
              className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Write your LinkedIn caption here..."
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hashtags</label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] rounded-xl border border-border bg-background px-3 py-2">
              {hashtags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border">
                  #{tag}
                  {tag !== "PointOneZero" && (
                    <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">✕</button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add hashtag (without #)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              />
              <button onClick={addTag} className="px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-colors">Add</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border shrink-0 bg-card">
          <p className="text-[11px] text-muted-foreground">
            {userName && <span className="font-semibold text-foreground">{userName} · </span>}
            {slides.length} slide{slides.length !== 1 ? "s" : ""} · {hashtags.length} hashtag{hashtags.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs border border-border text-muted-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
            {submitted ? (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Sent to Review
              </span>
            ) : (
              <button
                onClick={sendToReview}
                disabled={submitting || !postTitle.trim() || slides.some((s) => !s.title.trim())}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Sending…</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg> Send to Review</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Web sources panel — Gemini-style collapsible ──────────────────────────── */
function WebSourcesPanel({ sources }: { sources: WebSource[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 overflow-hidden">
      {/* Collapsed pill / trigger row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
      >
        {/* Globe icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

        <span className="text-[11px] font-semibold text-foreground">Web Research</span>

        {/* Source count badge */}
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-semibold",
          sources.length >= 20
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
            : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
        )}>
          {sources.length} sources
        </span>

        <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
          Content grounded in live web research
        </span>

        {/* Chevron */}
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={cn("ml-auto text-muted-foreground transition-transform duration-200 shrink-0", open && "rotate-180")}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded source list */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-2.5 max-h-[420px] overflow-y-auto">
          {sources.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[11px] leading-relaxed group">
              <span className="tabular-nums text-[10px] font-bold text-muted-foreground/40 w-5 shrink-0 pt-0.5 text-right">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5 flex-wrap">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary hover:underline transition-colors leading-snug break-words"
                    >
                      {s.title}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground leading-snug">{s.title}</span>
                  )}
                  {s.domain && (
                    <span className="text-[10px] text-muted-foreground border border-border/60 rounded-full px-1.5 py-0 leading-5 shrink-0">
                      {s.domain}
                    </span>
                  )}
                </div>
                {s.snippet && (
                  <p className="text-muted-foreground/70 mt-0.5 text-[10.5px] leading-relaxed">{s.snippet}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── POZ carousel preview — renders Claude-generated HTML per slide ─────────── */
type SlideWithHtml = { position: number; type: string; title: string; body: string; slideHtml?: string };

function applyColorOverride(html: string, accent: string): string {
  // Replace only the primary blue — keeps ink (#050517) and white intact
  return html.replace(/#009FF0/gi, accent);
}

function fallbackSlideHtml(s: SlideWithHtml): string {
  const isInk = s.position === 1 || (s.type || "").toLowerCase().includes("hook") || (s.type || "").toLowerCase().includes("quote") || (s.type || "").toLowerCase().includes("principle");
  const bg = isInk ? "#050517" : "#FFFFFF";
  const titleColor = isInk ? "#FFFFFF" : "#050517";
  const bodyColor  = isInk ? "rgba(255,255,255,0.65)" : "#555562";
  return `<div style="width:1024px;height:1280px;background:${bg};display:flex;flex-direction:column;padding:64px;font-family:'Inter',sans-serif;">
    <style>@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');</style>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:0.10em;padding:8px 24px;background:#009FF0;color:${isInk ? "#050517" : "#FFFFFF"};border-radius:4px;width:fit-content;">${(s.type || "SLIDE").toUpperCase()}</div>
    <div style="flex:1;"></div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:120px;line-height:1.0;color:${titleColor};letter-spacing:0;">${s.title}</div>
    <div style="height:40px;"></div>
    <p style="font-family:'Inter',sans-serif;font-size:36px;line-height:1.5;color:${bodyColor};margin:0;">${s.body}</p>
    <div style="height:64px;"></div>
  </div>`;
}

function HtmlSlidePreview({ html }: { html: string }) {
  // Detect ink (dark) slides to give frame correct background
  const isDark = /background:#050517/i.test(html) || /background:\s*#050517/i.test(html);
  return (
    <div style={{ width: 256, height: 320, overflow: "hidden", borderRadius: 6, boxShadow: "0 2px 16px rgba(5,5,23,0.18)", flexShrink: 0, background: isDark ? "#050517" : "#FFFFFF", position: "relative" }}>
      <div
        style={{ width: 1024, height: 1280, transformOrigin: "top left", transform: "scale(0.25)", pointerEvents: "none" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function CarouselHtmlPreview({ slides, accentOverride }: {
  slides: SlideWithHtml[];
  accentOverride?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, paddingTop: 4 }}>
      {slides.map(s => {
        let html = s.slideHtml || fallbackSlideHtml(s);
        if (accentOverride && accentOverride !== "#009FF0") {
          html = applyColorOverride(html, accentOverride);
        }
        return <HtmlSlidePreview key={s.position} html={html} />;
      })}
    </div>
  );
}

/* ─── DailyResultCard ───────────────────────────────────────────────────────── */
function DailyResultCard({ data, userId, userName }: { data: DailyResult; userId?: number; userName?: string }) {
  const sentKey = `poz-sent-${data.day}-${data.topic.slice(0, 50).replace(/\W+/g, "-")}`;

  const cardRef = React.useRef<HTMLDivElement>(null);

  const [saving,      setSaving]      = React.useState(false);
  const [saved,       setSaved]       = React.useState(false);
  const [submitting,  setSubmitting]  = React.useState(false);
  const [submitted,   setSubmitted]   = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  /* Scroll this card into view when it first mounts so the user always sees it */
  React.useEffect(() => {
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dc = DAY_CFG[data.day] ?? DAY_CFG["Monday"];

  // Restore one-time-send state from localStorage on mount
  React.useEffect(() => {
    try { if (localStorage.getItem(sentKey) === "1") setSubmitted(true); } catch {}
  }, [sentKey]);

  function buildCopyText(): string {
    const lines: string[] = [`${data.day} · ${data.contentType}`, data.topic, ""];
    if (data.bodyPost) { lines.push(data.bodyPost); lines.push(""); }
    if (data.slides?.length > 0) {
      data.slides.forEach((s) => {
        lines.push(`[Slide ${s.position}: ${s.type}]`);
        lines.push(s.title);
        if (s.body) lines.push(s.body);
        lines.push("");
      });
    }
    if (data.caption) { lines.push("Caption:"); lines.push(data.caption); lines.push(""); }
    if (data.hashtags?.length > 0) lines.push(data.hashtags.join(" "));
    return lines.join("\n").trim();
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      await saveOutput({ agent_id: "content-authority", skill_id: "daily-post", title: `${data.day} — ${dc.type} — ${data.topic}`, input_params: JSON.stringify({ day: data.day, topic: data.topic }), output_json: JSON.stringify(data), created_by: userId });
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  }

  async function confirmSend() {
    if (!userId) return;
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const parts: string[] = [];
      if (data.bodyPost) parts.push(data.bodyPost);
      if (data.slides?.length > 0) {
        const slidesText = data.slides
          .map((s) => `Slide ${s.position} · ${s.type}\n${s.title}\n${s.body}`)
          .join("\n\n");
        parts.push(`--- Carousel Content (${data.slides.length} Slides) ---\n${slidesText}`);
      }
      const content = parts.join("\n\n") || data.caption || "";
      await submitForReview({
        title: `${data.day} — ${dc.type} — ${data.topic}`,
        content,
        postType: data.slides?.length > 0 ? "carousel" : "educational",
        carouselSlides: data.slides?.length > 0
          ? JSON.stringify({ type: "daily", slides: data.slides, caption: data.caption ?? "", hashtags: data.hashtags ?? [] })
          : undefined,
        hashtags: JSON.stringify(data.hashtags ?? []),
        userId,
      });
      setSubmitted(true);
      try { localStorage.setItem(sentKey, "1"); } catch {}
      toast.success("Content sent to admin for review!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to submit"); }
    setSubmitting(false);
  }

  return (
    <div ref={cardRef} className="space-y-5">

      {/* ── Confirmation popup ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-card rounded-2xl border-2 border-border p-6 w-80 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <p className="font-bold text-base">Send to Admin Review?</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Sending as <span className="font-semibold text-foreground">{userName || "Current User"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">
                This content can only be submitted once. Once sent, the button will be permanently disabled for this content.
              </p>
            </div>
            <div className="text-[11px] bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
              <span className={cn("font-bold uppercase tracking-wide text-[10px]", dc.color)}>{data.day} · {data.contentType}</span>
              <p className="font-semibold text-foreground mt-0.5 leading-snug">{data.topic}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                className="px-4 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Web research sources ── */}
      {data._webSources && data._webSources.length > 0 && (
        <WebSourcesPanel sources={data._webSources} />
      )}

      {/* ── Day banner + actions ── */}
      <div className={cn("flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 flex-wrap", dc.border, dc.bg)}>
        <div>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", dc.color)}>{data.day} · {data.contentType}</span>
          <p className="font-bold text-sm mt-0.5">{data.topic}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyIconBtn text={buildCopyText()} title="Copy content" className="p-1.5 w-7 h-7" />
          <SaveBtn saving={saving} saved={saved} onClick={save} />
          <ReviewBtn submitting={submitting} submitted={submitted} onClick={() => !submitted && setShowConfirm(true)} />
        </div>
      </div>

      {/* ── Angle + Framework metadata ── */}
      {(data.angle || data.framework) && (
        <div className="flex flex-wrap gap-2">
          {data.angle && (
            <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border", dc.badge, dc.border)}>
              Angle: {data.angle}
            </span>
          )}
          {data.framework && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
              Framework {data.framework}
            </span>
          )}
        </div>
      )}

      {/* ── Trending insights from X/Grok ── */}
      {data.trendInsights && data.trendInsights.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">X / Twitter Trend Insights</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-bold">𝕏</span>
          </div>
          <div className="space-y-1.5">
            {data.trendInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={cn("text-[10px] font-black tabular-nums pt-0.5 shrink-0", dc.color)}>{String(i + 1).padStart(2,"0")}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LinkedIn body post ── */}
      {data.bodyPost && (
        <div className="rounded-xl border-2 border-border bg-card p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 shrink-0"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Post Body</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{data.bodyPost}</p>
        </div>
      )}

      {/* ── Carousel 8-page content (text only) ── */}
      {data.slides && data.slides.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Carousel Content · {data.slides.length} Slides
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {data.slides.map((sl) => (
              <div key={sl.position} className={cn(
                "rounded-xl border-2 p-3.5 space-y-1",
                sl.position === 1
                  ? cn("border-l-4", dc.border, dc.bg)
                  : sl.position === data.slides.length
                  ? "border-l-4 border-dashed border-border bg-muted/20"
                  : "border border-border bg-card"
              )}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-[10px] font-black tabular-nums tracking-widest", dc.color)}>
                    {String(sl.position).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {sl.type}
                  </span>
                </div>
                <p className="text-sm font-bold leading-snug text-foreground">{sl.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{sl.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Visualization ideas ── */}
      {data.visualizationIdeas && data.visualizationIdeas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Visualization Ideas
            </span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              design brief
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.visualizationIdeas.map((vi) => (
              <div key={vi.position} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-black tabular-nums shrink-0", dc.color)}>
                    Slide {String(vi.position).padStart(2, "0")}
                  </span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", dc.badge)}>
                    {vi.colorScheme}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-16 shrink-0 pt-px">BG</span>
                    <span className="text-[11px] text-foreground leading-snug">{vi.background}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-16 shrink-0 pt-px">TYPE</span>
                    <span className="text-[11px] text-foreground leading-snug">{vi.typography}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-16 shrink-0 pt-px">LAYOUT</span>
                    <span className="text-[11px] text-foreground leading-snug">{vi.layout}</span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1 border-t border-border/40">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 w-16 shrink-0 pt-px">NOTE</span>
                    <span className="text-[11px] text-muted-foreground leading-snug italic">{vi.designNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Caption + hashtags ── */}
      {data.caption && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Caption</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{data.caption}</p>
          {data.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
              {data.hashtags.map((h) => <span key={h} className={cn("text-[10px] px-2 py-0.5 rounded border font-mono", dc.border, dc.color)}>{h.startsWith("#") ? h : `#${h}`}</span>)}
            </div>
          )}
        </div>
      )}

      {/* ── Outreach hook ── */}
      {data.outreachHook && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Outreach Hook</span>
            <span className="text-[10px] text-muted-foreground/60 ml-auto">for DMs / comments after posting</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground italic">&ldquo;{data.outreachHook}&rdquo;</p>
        </div>
      )}


    </div>
  );
}

function CalendarResultCard({ data, userId }: { data: CalendarResult; userId?: number }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [saving,     setSaving]     = React.useState(false);
  const [saved,      setSaved]      = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted,  setSubmitted]  = React.useState(false);
  const DAYS_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      await saveOutput({ agent_id: "content-authority", skill_id: "content-calendar", title: `Weekly Calendar — ${data.company || "Brand"} — w/c ${data.weekOf}`, input_params: JSON.stringify({ weekOf: data.weekOf }), output_json: JSON.stringify(data), created_by: userId });
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  }

  async function sendToReview() {
    if (!userId) return;
    setSubmitting(true);
    try {
      const lines: string[] = [data.summary || ""];
      (data.days || []).forEach((d) => {
        lines.push(`\n${d.day} — ${d.type}\nHook: ${d.hook}\nBrief: ${d.brief}\nHashtags: ${d.hashtags?.join(" ") || ""}`);
      });
      const content = lines.join("\n").trim();
      await submitForReview({
        title: `Weekly Calendar — ${data.company || "Brand"} — w/c ${data.weekOf}`,
        content,
        postType: "educational",
        userId,
      });
      setSubmitted(true);
      toast.success("Sent to review! Admin will review your content.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to submit"); }
    setSubmitting(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground font-mono">w/c {data.weekOf} · {data.company || ""} {data.industry ? `· ${data.industry}` : ""}</p>
          {data.summary && <p className="text-xs text-muted-foreground mt-1">{data.summary}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SaveBtn saving={saving} saved={saved} onClick={save} />
          <ReviewBtn submitting={submitting} submitted={submitted} onClick={sendToReview} />
        </div>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-primary text-primary-foreground"><th className="text-left px-4 py-2.5 font-semibold w-24">Day</th><th className="text-left px-4 py-2.5 font-semibold w-32">Type</th><th className="text-left px-4 py-2.5 font-semibold">Hook</th></tr></thead>
          <tbody>
            {DAYS_ORDER.map((day, i) => {
              const entry = data.days?.find((d) => d.day === day);
              const dc = CAL_DAY_COLORS[day];
              return (
                <tr key={day} className={cn("border-t border-border", i % 2 === 1 ? "bg-muted/20" : "")}>
                  <td className="px-4 py-3 font-bold">{day}</td>
                  <td className="px-4 py-3"><span className={cn("font-semibold", dc.color)}>{entry?.type || "—"}</span></td>
                  <td className="px-4 py-3 text-muted-foreground italic line-clamp-2 max-w-[280px]">{entry?.hook || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all shrink-0",
        copied
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
          : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
      )}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function RefinerResultCard({ data, userId }: { data: RefinerResult; userId?: number }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [saving,     setSaving]     = React.useState(false);
  const [saved,      setSaved]      = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted,  setSubmitted]  = React.useState(false);
  const VCFG = { pass: { dot:"bg-emerald-500", text:"text-emerald-700 dark:text-emerald-300", bg:"bg-emerald-50 dark:bg-emerald-950/30", border:"border-emerald-200 dark:border-emerald-800" }, fix: { dot:"bg-amber-500", text:"text-amber-700 dark:text-amber-300", bg:"bg-amber-50 dark:bg-amber-950/30", border:"border-amber-200 dark:border-amber-800" }, fail: { dot:"bg-red-500", text:"text-red-700 dark:text-red-300", bg:"bg-red-50 dark:bg-red-950/30", border:"border-red-200 dark:border-red-800" } };
  const scoreColor = (s: number) => s >= 9 ? "bg-emerald-500" : s >= 7 ? "bg-blue-500" : s >= 5 ? "bg-amber-500" : "bg-red-500";
  const scoreText = (s: number) => s >= 9 ? "text-emerald-600 dark:text-emerald-400" : s >= 7 ? "text-blue-600 dark:text-blue-400" : s >= 5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      await saveOutput({ agent_id: "content-authority", skill_id: "content-refiner", title: `Content Audit — ${data.overallScore}/10`, input_params: "{}", output_json: JSON.stringify(data), created_by: userId });
      setSaved(true); toast.success("Saved!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  }

  async function sendToReview() {
    if (!userId) return;
    setSubmitting(true);
    try {
      // Plain text for the content field (readable in admin)
      const contentLines: string[] = [];
      (data.refined?.slides ?? []).forEach((s) => {
        contentLines.push(`${s.title}\n${s.body}`);
      });
      if (data.refined?.caption) contentLines.push(`\nCaption:\n${data.refined.caption}`);
      const content = contentLines.join("\n\n").trim() || data.finalNote || "";

      // Full structured payload stored in carousel_slides
      const carouselPayload = {
        type: "refined",
        overallScore: data.overallScore,
        hatScores: data.hatScores,
        publishReady: data.publishReady,
        finalNote: data.finalNote,
        slideAudits: data.slideAudits,
        slides: (data.refined?.slides ?? []).map((s) => ({
          position: s.position,
          type: s.type,
          title: s.title,
          body: s.body,
          status: s.status,
          note: s.note,
        })),
        caption: data.refined?.caption ?? "",
        hashtags: data.refined?.hashtags ?? [],
      };

      await submitForReview({
        title: `Refined Content — Score ${data.overallScore}/10${data.publishReady ? " ✓ Publish Ready" : ""}`,
        content,
        postType: "carousel",
        carouselSlides: JSON.stringify(carouselPayload),
        hashtags: JSON.stringify(data.refined?.hashtags ?? []),
        userId,
      });
      setSubmitted(true);
      toast.success("Sent to review! Admin will review your content.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to submit"); }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      {/* Score banner */}
      <div className="rounded-xl border-2 border-border bg-card px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={cn("text-4xl font-black tabular-nums", scoreText(data.overallScore))}>{data.overallScore.toFixed(1)}<span className="text-base font-semibold text-muted-foreground">/10</span></span>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score Details</p>
              <div className="space-y-0.5">
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">👔</span> {data.hatScores.cSuite.verdict}</p>
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">📊</span> {data.hatScores.algorithm.verdict}</p>
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">🎯</span> {data.hatScores.specialist.verdict}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SaveBtn saving={saving} saved={saved} onClick={save} />
            <ReviewBtn submitting={submitting} submitted={submitted} onClick={sendToReview} />
          </div>
        </div>
        {data.finalNote && (
          <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 leading-relaxed">
            <span className="font-semibold text-foreground">Note →</span> {data.finalNote}
          </p>
        )}
      </div>
      {/* Hat scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {([["cSuite","👔","C-Suite"],["algorithm","📊","Algorithm"],["specialist","🎯","Specialist"]] as const).map(([k, icon, label]) => {
          const h = data.hatScores[k as "cSuite"|"algorithm"|"specialist"];
          return (
            <div key={k} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold"><span>{icon}</span>{label}</div>
              <div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", scoreColor(h.score))} style={{width:`${h.score*10}%`}}/></div><span className="text-xs font-bold tabular-nums w-6">{h.score}</span></div>
            </div>
          );
        })}
      </div>
      {/* Slide verdicts */}
      {data.slideAudits?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.slideAudits.map((sa) => { const vc = VCFG[sa.verdict] ?? VCFG.fix; return (
            <div key={sa.slide} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px]", vc.bg, vc.border)} title={sa.issue}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", vc.dot)}/><span className={cn("font-semibold", vc.text)}>Slide {sa.slide}</span><span className="text-muted-foreground max-w-[100px] truncate">{sa.issue}</span>
            </div>
          ); })}
        </div>
      )}
      {/* Refined slides */}
      {data.refined?.slides?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border"/>
            <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-full border border-border bg-muted whitespace-nowrap">Rewritten to 10/10</span>
            <div className="flex-1 h-px bg-border"/>
            <CopyBtn
              text={[
                ...data.refined.slides.map((sl) => `[Slide ${sl.position} · ${sl.type}]\n${sl.title}\n${sl.body}${sl.note ? `\nNote: ${sl.note}` : ""}`),
                data.refined.caption ? `\n[Caption]\n${data.refined.caption}` : "",
                data.refined.hashtags?.length > 0 ? `\n${data.refined.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")}` : "",
              ].filter(Boolean).join("\n\n")}
              label="Copy All"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.refined.slides.map((sl) => (
              <div key={sl.position} className={cn("rounded-xl border-2 p-3.5 space-y-1.5", sl.status === "Fixed" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border bg-card")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{String(sl.position).padStart(2,"0")} · {sl.type}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", sl.status === "Fixed" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{sl.status}</span>
                    <CopyBtn text={`${sl.title}\n\n${sl.body}`} />
                  </div>
                </div>
                <p className="text-sm font-bold leading-snug">{sl.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{sl.body}</p>
                {sl.note && <p className={cn("text-[10px] pt-1 border-t", sl.status === "Fixed" ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "text-muted-foreground border-border/50")}>{sl.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Caption */}
      {data.refined?.caption && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Refined Caption</p>
            <CopyBtn
              text={[
                data.refined.caption,
                data.refined.hashtags?.length > 0 ? data.refined.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ") : "",
              ].filter(Boolean).join("\n\n")}
              label="Copy Caption"
            />
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{data.refined.caption}</p>
          {data.refined.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50 items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {data.refined.hashtags.map((h) => <span key={h} className="text-[10px] px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono">{h.startsWith("#") ? h : `#${h}`}</span>)}
              </div>
              <CopyBtn text={data.refined.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ")} label="Copy Tags" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Connector data ─────────────────────────────────────────────────────────── */
type ConnectorBadge = "Most popular" | "New" | `#${number} popular`;
type Connector = { id: string; name: string; badge: ConnectorBadge; description: string; bg: string; fg: string; label: string };

const CONNECTORS: Connector[] = [
  { id: "linkedin",    name: "LinkedIn",              badge: "Most popular", description: "Publish posts, read analytics, and manage your LinkedIn presence directly.",         bg: "#0A66C2", fg: "#fff", label: "in"  },
  { id: "twitter",     name: "Twitter / X",           badge: "#2 popular",  description: "Post threads, monitor mentions, and track engagement across X.",                     bg: "#000",    fg: "#fff", label: "𝕏"   },
  { id: "google-drive",name: "Google Drive",          badge: "#3 popular",  description: "Search, read, and upload files instantly from your Drive.",                          bg: "#4285F4", fg: "#fff", label: "▲"  },
  { id: "gmail",       name: "Gmail",                 badge: "New",         description: "Draft replies, summarize threads, and search your inbox.",                           bg: "#EA4335", fg: "#fff", label: "M"   },
  { id: "google-cal",  name: "Google Calendar",       badge: "New",         description: "Manage your schedule and coordinate meetings effortlessly.",                         bg: "#0F9D58", fg: "#fff", label: "31"  },
  { id: "instagram",   name: "Instagram",             badge: "New",         description: "Schedule posts, track hashtags, and analyze story performance.",                     bg: "#E1306C", fg: "#fff", label: "ig"  },
  { id: "notion",      name: "Notion",                badge: "New",         description: "Read and write pages, databases, and blocks inside your Notion workspace.",          bg: "#191919", fg: "#fff", label: "N"   },
  { id: "slack",       name: "Slack",                 badge: "New",         description: "Send messages, search channels, and surface content across your workspace.",         bg: "#4A154B", fg: "#fff", label: "S"   },
  { id: "hubspot",     name: "HubSpot",               badge: "New",         description: "Manage contacts, track deals, and sync CRM data with your content pipeline.",        bg: "#FF7A59", fg: "#fff", label: "H"   },
  { id: "canva",       name: "Canva",                 badge: "New",         description: "Create, update, and export designs without leaving your workflow.",                   bg: "#7B2D8B", fg: "#fff", label: "C"   },
  { id: "facebook",    name: "Facebook / Meta",       badge: "New",         description: "Schedule posts to Pages, read insights, and manage ad campaigns.",                   bg: "#1877F2", fg: "#fff", label: "f"   },
  { id: "webhook",     name: "Custom Webhook",        badge: "New",         description: "Send structured payloads to any endpoint — Zapier, Make, n8n, or your own API.",    bg: "#6366F1", fg: "#fff", label: "⚡"  },
];

/* ─── Skill Directory Modal ──────────────────────────────────────────────────── */
type DirTab = "skills" | "connectors" | "plugins";
type DirFile = "SKILL.md" | "agents" | "inputs" | "outputs" | "examples";

function DirectoryModal({ onClose, onUseSkill }: {
  onClose: () => void;
  onUseSkill: (agentId: string, skillId: string) => void;
}) {
  const [tab, setTab]           = React.useState<DirTab>("skills");
  const [search, setSearch]     = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [connSearch, setConnSearch] = React.useState("");
  const [connected, setConnected]   = React.useState<Set<string>>(new Set());
  const [detail, setDetail]     = React.useState<{ agentId: string; skillId: string } | null>(null);
  const [file, setFile]         = React.useState<DirFile>("SKILL.md");

  const detailAgent = detail ? AGENTS.find((a) => a.id === detail.agentId)   : null;
  const detailSkillId = detail?.skillId;
  const detailSkill = detailAgent && detailSkillId ? detailAgent.skills.find((s) => s.id === detailSkillId) : null;

  const categoryOptions = [
    { id: "all",               label: "All Skills" },
    { id: "content-authority", label: "Content & Authority" },
    { id: "thought-leadership",label: "Thought Leadership" },
    { id: "market-intel",      label: "Market Intelligence" },
  ];

  const filteredAgents = AGENTS.filter((a) => category === "all" || a.id === category);
  const allSkills = filteredAgents.flatMap((a) => a.skills.map((s) => ({ ...s, agent: a })));
  const visibleSkills = allSkills.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  function fileContent() {
    if (!detailSkill || !detailAgent) return "";
    switch (file) {
      case "SKILL.md":
        return `# ${detailSkill.name}\n\n${detailSkill.description}\n\n**Agent:** ${detailAgent.name}\n\n**Skill ID:** \`${detailSkill.id}\``;
      case "agents":
        return `## Agent Configuration\n\nThis skill belongs to **${detailAgent.name}** (${detailAgent.shortName}).\n\n${detailAgent.description}`;
      case "inputs":
        return `## Input Parameters\n\nThis skill accepts the following inputs:\n\n- **topic** — The main topic or content focus\n- **company** — Brand / company name\n- **industry** — Target industry vertical\n- **audience** — Target audience description\n- **brandVoice** — Tone and brand voice guidelines`;
      case "outputs":
        return `## Output Format\n\nThis skill returns a structured JSON response containing the generated content, metadata, and quality indicators relevant to **${detailSkill.name}**.`;
      case "examples":
        return `## Example Usage\n\nTry prompting:\n\n> "Generate a ${detailSkill.name.toLowerCase()} about AI transformation in healthcare for hospital CTOs"\n\n> "Create a ${detailSkill.name.toLowerCase()} for a B2B SaaS brand targeting enterprise CTOs"`;
      default: return "";
    }
  }

  const FILE_TREE: { id: DirFile; label: string; icon: string; children?: { id: DirFile; label: string }[] }[] = [
    { id: "SKILL.md", label: "SKILL.md",  icon: "📄" },
    { id: "agents",   label: "agents/",   icon: "📁", children: [{ id: "agents", label: "agent_config.md" }] },
    { id: "inputs",   label: "inputs/",   icon: "📁", children: [{ id: "inputs",  label: "parameters.md" }] },
    { id: "outputs",  label: "outputs/",  icon: "📁", children: [{ id: "outputs", label: "schema.md" }] },
    { id: "examples", label: "examples/", icon: "📁", children: [{ id: "examples",label: "usage.md" }] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-[82vh] bg-card border border-border rounded-2xl shadow-2xl flex overflow-hidden">

        {/* ── Left nav ── */}
        <div className="w-[200px] shrink-0 bg-muted/30 border-r border-border flex flex-col">
          <div className="px-4 py-4 border-b border-border">
            <h2 className="text-lg font-bold tracking-tight">Directory</h2>
          </div>
          <nav className="p-2 space-y-0.5 flex-1">
            {(["skills", "connectors", "plugins"] as DirTab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setDetail(null); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {t === "skills"     && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>}
                {t === "connectors" && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>}
                {t === "plugins"    && <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          {tab === "connectors" ? (
            /* ── Connectors grid ── */
            <>
              <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input type="text" placeholder="Search connectors..." value={connSearch} onChange={(e) => setConnSearch(e.target.value)}
                    className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 rounded-full text-xs font-semibold border bg-foreground text-background border-foreground">Anthropic &amp; Partners</button>
                  <div className="ml-auto flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors">Filter by <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors">Sort by <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONNECTORS.filter((c) => !connSearch || c.name.toLowerCase().includes(connSearch.toLowerCase()) || c.description.toLowerCase().includes(connSearch.toLowerCase()))
                    .map((c) => {
                      const isConnected = connected.has(c.id);
                      return (
                        <div key={c.id} className="group rounded-xl border border-border bg-card hover:border-border/80 transition-all p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              {/* Brand icon */}
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold select-none" style={{ background: c.bg, color: c.fg }}>
                                {c.label}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold leading-snug">{c.name}</span>
                                  {c.badge === "New" && (
                                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">New</span>
                                  )}
                                  {c.badge !== "New" && (
                                    <span className="text-[10px] text-muted-foreground">{c.badge}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setConnected((prev) => { const n = new Set(prev); isConnected ? n.delete(c.id) : n.add(c.id); return n; })}
                              className={cn(
                                "shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border transition-colors text-sm",
                                isConnected
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                              )}
                              title={isConnected ? "Disconnect" : "Connect"}
                            >
                              {isConnected ? "✓" : "+"}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          ) : tab === "plugins" ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Plugins coming soon</p>
            </div>
          ) : detail && detailSkill && detailAgent ? (
            /* ── Skill detail (Image 2 format) ── */
            <div className="flex flex-1 min-h-0">
              {/* File tree */}
              <div className="w-[220px] shrink-0 border-r border-border overflow-y-auto">
                <div className="p-3 border-b border-border">
                  <button
                    onClick={() => { setDetail(null); setFile("SKILL.md"); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Back
                  </button>
                </div>
                <div className="p-2">
                  {FILE_TREE.map((node) => (
                    <div key={node.id}>
                      <button
                        onClick={() => setFile(node.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors",
                          file === node.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <span className="shrink-0 text-sm">{node.icon}</span>
                        <span>{node.label}</span>
                      </button>
                      {node.children && file === node.id && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {node.children.map((c) => (
                            <button key={c.id} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left text-primary font-medium bg-primary/5">
                              <span className="shrink-0">📝</span>
                              <span>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail content */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">{detailSkill.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{detailAgent.shortName} · {detailAgent.name}</p>
                  </div>
                  <button
                    onClick={() => { onUseSkill(detail.agentId, detail.skillId); onClose(); }}
                    className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Use Skill
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {fileContent().split("\n").map((line, i) => {
                      if (line.startsWith("## "))   return <h2 key={i} className="text-sm font-bold mt-4 mb-2 first:mt-0">{line.slice(3)}</h2>;
                      if (line.startsWith("# "))    return <h1 key={i} className="text-base font-bold mb-3">{line.slice(2)}</h1>;
                      if (line.startsWith("- "))    return <li key={i} className="text-sm text-muted-foreground ml-3 list-disc">{line.slice(2)}</li>;
                      if (line.startsWith("> "))    return <blockquote key={i} className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground my-2">{line.slice(2)}</blockquote>;
                      if (line.trim() === "")        return <div key={i} className="h-2" />;
                      const inlined = line.replace(/`([^`]+)`/g, (_,m) => `<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">${m}</code>`).replace(/\*\*([^*]+)\*\*/g, (_,m) => `<strong>${m}</strong>`);
                      return <p key={i} className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: inlined }} />;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Skill grid (Image 1 format) ── */
            <>
              {/* Toolbar */}
              <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                {/* Category chips + sort/filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  {categoryOptions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                        category === c.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors">
                      Filter by
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors">
                      Sort by
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Skill grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleSkills.map((sk) => {
                    const color = C[sk.agent.color as Color];
                    return (
                      <button
                        key={`${sk.agentId}-${sk.id}`}
                        onClick={() => { setDetail({ agentId: sk.agentId, skillId: sk.id }); setFile("SKILL.md"); }}
                        className="group text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all p-4 relative"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-bold text-foreground leading-snug">/{sk.id}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("text-[10px] font-semibold", color.label)}>{sk.agent.shortName}</span>
                              <span className="text-[10px] text-muted-foreground/50">·</span>
                              <span className="text-[10px] text-muted-foreground">installed</span>
                            </div>
                          </div>
                          <div className={cn(
                            "shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border transition-colors",
                            "border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary group-hover:bg-primary/5"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{sk.description}</p>
                      </button>
                    );
                  })}
                  {visibleSkills.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">No skills match your search.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Intent detection ───────────────────────────────────────────────────────── */
function detectIntent(text: string): EmbedType | null {
  if (/refine|audit|rate|score|check.*(?:post|slide|content)|make.*10.?10|review.*content|analyse.*slide|validate|improve.*caption/i.test(text)) {
    return "content-refiner";
  }
  if (/calendar|weekly.*(?:post|plan|content)|content.*(?:plan|schedule)|post.*(?:week|plan)|schedul/i.test(text)) {
    return "weekly-calendar";
  }
  // Topic Analysis — understand/research a topic without creating a post
  if (/(?:what(?:'s| is|are)|tell me about|explain|analyse|analyze|understand|deep.?dive|breakdown|research|study)\s+.{2,60}(?:trend|topic|space|market|industry|technology|concept|landscape|signal)/i.test(text) ||
      /(?:analyse|analyze|research|deep.?dive into|give me insights on)\s+(?:the\s+)?.{3,}/i.test(text)) {
    return "topic-analysis";
  }
  if (/(?:generate|create|write|draft|build|make|give\s+me).*(?:post|content|carousel|caption)|single[\s-]?(?:page\s+)?post|today.*(?:post|content)|linkedin.*post|(?:post|content).*(?:about|for|on|today)|carousel/i.test(text)) {
    return "daily-content";
  }
  return null;
}

function extractSlideCount(text: string): number | null {
  const m = text.match(/(\d+)\s*[-–]?\s*(?:slide|page|card)s?/i)
           ?? text.match(/(?:slide|page|card)s?\s*[-:]\s*(\d+)/i)
           ?? text.match(/\b(\d+)\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 3 && n <= 20) return n;
  }
  return null;
}

function isCarouselRequest(text: string): boolean {
  return /carousel|swipe\s*post|multi[\s-]?(?:slide|page)|slide\s*post|\bslides?\b/i.test(text);
}

async function generateFromChat(
  intent: EmbedType,
  text: string,
  opts?: { slideCount?: number; singlePage?: boolean; day?: string; contentType?: string }
): Promise<DailyResult | CalendarResult | RefinerResult> {
  if (intent === "daily-content") {
    const dayMap: Record<number,string> = {1:"Monday",2:"Tuesday",3:"Wednesday",4:"Thursday",5:"Friday"};
    const day = opts?.day ?? dayMap[new Date().getDay()] ?? "Monday";
    const typeMap: Record<string,string> = { Monday:"Thought Leadership", Tuesday:"Engagement Post", Wednesday:"Tool Spotlight", Thursday:"Industry Insight", Friday:"Forward-Looking" };
    // Strip post-creation instruction words so the AI generates content about the
    // subject matter (e.g. "blockchain") not the delivery format ("linkedin carousel").
    const cleanedTopic = text
      .replace(/\b(?:create|write|generate|make|draft|build|produce)\s+(?:a\s+|an\s+|the\s+)?(?:linkedin|linked[\s-]in)?\s*(?:post|carousel|content|article|slides?)\s+(?:about|on|for|to|regarding)?\s*/gi, "")
      .replace(/\b(?:for\s+)?(?:linkedin|linked[\s-]in)\s+(?:post|carousel|content|article)\s*/gi, "")
      .replace(/\b(?:carousel|slides?)\s+(?:format|post|content)?\s*/gi, "")
      .replace(/\b(?:in|to|like|with|having|using|of|for)\s+\d+\s+slides?\b/gi, "")
      .replace(/\b\d+\s+slides?\s*(?:content|format|post)?\b/gi, "")
      .replace(/\bformat\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() || text;
    const inputs: Record<string, unknown> = { day, contentType: opts?.contentType ?? typeMap[day], topic: cleanedTopic };
    if (opts?.slideCount) inputs.slideCount = opts.slideCount;
    if (opts?.singlePage) inputs.singlePage = true;
    const res = await fetch("/api/agents/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ skillId:"daily-post", inputs }), signal: AbortSignal.timeout(90_000) });
    if (res.status === 401) { window.location.href = "/login"; throw new Error("Session expired — please log in again"); }
    if (!res.ok) { let m = "Generation failed"; try { m = (await res.json()).error ?? m; } catch {} throw new Error(m); }
    return res.json();
  }
  if (intent === "weekly-calendar") {
    const d = new Date(); const dn = d.getDay(); d.setDate(d.getDate() + (dn === 0 ? 1 : 8 - dn));
    const weekOf = d.toISOString().split("T")[0];
    const res = await fetch("/api/agents/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ skillId:"content-calendar", inputs:{ weekOf, company:"Point One Zero (POZ)", industry:"AI Strategy & Design", audience:"CIOs, CTOs, CEOs, founders, B2B tech decision-makers", keyTopics: text } }), signal: AbortSignal.timeout(90_000) });
    if (res.status === 401) { window.location.href = "/login"; throw new Error("Session expired — please log in again"); }
    if (!res.ok) { let m = "Generation failed"; try { m = (await res.json()).error ?? m; } catch {} throw new Error(m); }
    return res.json();
  }
  if (intent === "content-refiner") {
    const match = text.match(/(?:audit|refine|rate|score|check|review)[^:]*:?\s*([\s\S]{80,})/i);
    const content = match?.[1]?.trim() ?? text;
    const res = await fetch("/api/agents/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ skillId:"content-refiner", inputs:{ content } }), signal: AbortSignal.timeout(90_000) });
    if (res.status === 401) { window.location.href = "/login"; throw new Error("Session expired — please log in again"); }
    if (!res.ok) { let m = "Generation failed"; try { m = (await res.json()).error ?? m; } catch {} throw new Error(m); }
    return res.json();
  }
  throw new Error("Unknown intent");
}

/* ── Auto Refiner — silently pipes carousel slides through the quality audit ── */
async function autoRefineContent(result: DailyResult): Promise<RefinerResult | null> {
  if (!result.slides || result.slides.length < 2) return null;
  try {
    const content = result.slides
      .map((s) => `[Slide ${s.position}] ${s.type}\nTitle: ${s.title}\nBody: ${s.body}`)
      .join("\n\n")
      + (result.caption ? `\n\nCaption: ${result.caption}\nHashtags: ${(result.hashtags ?? []).map((h) => `#${h}`).join(" ")}` : "");
    const res = await fetch("/api/agents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: "content-refiner", inputs: { content } }),
    });
    if (res.status === 401) { window.location.href = "/login"; return null; }
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const FALLBACK_REPLY = "I can help you create LinkedIn content. Try:\n\n• \"Create a carousel about AI in healthcare for hospital CTOs\"\n• \"Generate a weekly content calendar for my fintech brand\"\n• \"Audit this post: [paste your content]\" — or pick a skill from the + menu.";

/* ── Claude-powered chat router ─────────────────────────────────────────────── */
async function askChatRouter(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<{ action: string; topic?: string; isCarousel?: boolean; slideCount?: number; theme?: string; hasContent?: boolean; count?: number; text?: string }> {
  const res = await fetch("/api/agents/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error("Chat router failed");
  return res.json();
}

/* ─── Suggestion chips ───────────────────────────────────────────────────────── */
const SUGGESTIONS: Array<{ icon: React.ReactNode; label: string; desc: string; text: string }> = [
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>,
    label: "Generate today's post",
    desc: "Carousel or single post based on today's content type",
    text: "Create today's LinkedIn carousel about AI trends in enterprise",
  },
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    label: "Weekly content calendar",
    desc: "5-day LinkedIn strategy with hooks and hashtags",
    text: "Generate a weekly LinkedIn content calendar for a B2B AI brand",
  },
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    label: "What's trending today",
    desc: "Live X/Twitter signals for B2B thought leaders",
    text: "Show me trending topics from X for LinkedIn content today",
  },
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    label: "Audit my content",
    desc: "Three-hat review — score and rewrite to 10/10",
    text: "Audit and refine my LinkedIn carousel",
  },
];

/* ─── UUID helper (works on non-secure contexts & older browsers) ───────────── */
function uuid(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function") {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function AgentCatalogPage() {
  const { currentUser, authRole } = useUser();

  /* skill detail state */

  /* chat state */
  const [messages,     setMessages]     = useState<ChatMsg[]>([]);
  const [inputText,    setInputText]    = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* pending workflow state */
  const [pendingQ, setPendingQ] = useState<PendingQ | null>(null);

  /* history / session state */
  const [sessionId,      setSessionId]      = useState<string>(() => uuid());
  const [sessions,       setSessions]       = useState<ChatSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* load history on mount */
  useEffect(() => {
    if (!currentUser?.id) return;
    setLoadingHistory(true);
    fetch("/api/agents/chat-history")
      .then((r) => r.json())
      .then((data: ChatSession[]) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [currentUser?.id]);

  /* pre-warm trending cache as soon as user is authenticated —
     x_search takes 13-23s; doing it silently on mount means the
     user's click returns from cache instantly (0ms).            */
  useEffect(() => {
    if (!currentUser?.id) return;
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const idx = new Date().getDay();
    const today = dayNames[idx >= 1 && idx <= 5 ? idx : 1];
    fetch(`/api/agents/trending?day=${today}`).catch(() => {});
  }, [currentUser?.id]);

  /* auto-save session whenever messages settle (debounced 800ms) */
  useEffect(() => {
    if (!currentUser?.id || messages.length === 0) return;
    // Don't save while any message is still generating
    if (messages.some((m) => m.generating)) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const title = messages.find((m) => m.role === "user")?.text?.slice(0, 72) ?? "Chat";
      const serialized = messages.map((m) => {
        let rd: unknown = null;
        if (m.resultData) {
          // Strip heavy raw-data fields that are not needed for display
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _xTrends, _webSources, ...displayData } = m.resultData as DailyResult & { _xTrends?: unknown; _webSources?: unknown };
          rd = displayData;
        }
        return {
          id: m.id,
          role: m.role,
          text: m.text,
          resultType: m.resultType ?? null,
          resultData: rd,
          trendList: m.trendList ?? null,
          trendSources: m.trendSources ?? null,
        };
      });
      fetch("/api/agents/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, title, messages: serialized }),
      })
        .then((r) => r.json())
        .then((saved: ChatSession) => {
          setSessions((prev) => {
            const exists = prev.some((s) => s.session_id === saved.session_id);
            return exists
              ? prev.map((s) => s.session_id === saved.session_id ? saved : s)
              : [saved, ...prev];
          });
        })
        .catch(() => {});
    }, 800);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  /* keep sidebar in sync: broadcast sessions + active id */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("agent-catalog-sessions-updated", {
      detail: { sessions, activeId: sessionId },
    }));
  }, [sessions, sessionId]);

  /* action menu state */
  const [showMenu,         setShowMenu]         = useState(false);
  const [subMenu,          setSubMenu]          = useState<"skills" | "connection" | null>(null);
  const [showSkillGrid,    setShowSkillGrid]    = useState(false);
  const [pickerTab,        setPickerTab]        = useState("all");
  const [uploadedFiles,    setUploadedFiles]    = useState<File[]>([]);
  type UploadedDoc = { id: string | number; filename: string; uploading: boolean; error?: boolean };
  const [uploadedDocs,     setUploadedDocs]     = useState<UploadedDoc[]>([]);
  const [showDirectory,    setShowDirectory]    = useState(false);
  const [showManualEditor, setShowManualEditor] = useState(false);

  /* selected skills (chips shown above input) */
  const [selectedSkills, setSelectedSkills] = useState<Array<{ agentId: string; skillId: string; name: string; color: Color }>>([]);

  /* inline prompt edit */
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText,     setEditText]     = useState("");

  /* listen for sidebar new-chat / load-session events */
  useEffect(() => {
    const handleNew = () => {
      setMessages([]);
      setSessionId(uuid());
      setPendingQ(null);
      setSelectedSkills([]);
      setUploadedFiles([]);
      setUploadedDocs([]);
      setInputText("");
      setEditingMsgId(null);
    };
    const handleLoad = (e: Event) => {
      const session = (e as CustomEvent).detail?.session as ChatSession;
      if (!session) return;
      setMessages((session.messages as ChatMsg[]) || []);
      setSessionId(session.session_id);
      setPendingQ(null);
      setSelectedSkills([]);
      setUploadedFiles([]);
      setUploadedDocs([]);
      setInputText("");
      setEditingMsgId(null);
    };
    window.addEventListener("agent-catalog-new-chat", handleNew);
    window.addEventListener("agent-catalog-load-session", handleLoad);
    return () => {
      window.removeEventListener("agent-catalog-new-chat", handleNew);
      window.removeEventListener("agent-catalog-load-session", handleLoad);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* stop generation — clears generating messages immediately */
  function handleStop() {
    setMessages(prev => prev.map(m =>
      m.generating ? { ...m, generating: false, text: "Generation stopped." } : m
    ));
    setPendingQ(null);
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  const userName  = currentUser?.name ?? "";
  const firstName = userName.split(" ")[0] || "there";

  /* scroll to bottom on new messages — skip when last message has a result card (card self-scrolls) */
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.resultType) return;
    const t = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 250);
    return () => clearTimeout(t);
  }, [messages]);


  /* send a chat message */
  async function handleSend(overrideText?: string, directAction?: "carousel") {
    if (messages.some((m) => m.generating)) return;
    const raw  = (overrideText ?? inputText).trim();
    if (!raw) return;
    const text = selectedSkills.length > 0
      ? `[Active skills: ${selectedSkills.map((s) => s.name).join(", ")}]\n\n${raw}`
      : raw;

    setInputText("");
    setShowMenu(false);
    setShowSkillGrid(false);

    /* ── RAG: files still uploading ──────────────────────────────────── */
    const uploadingCount = uploadedDocs.filter((d) => d.uploading).length;
    const readyDocIds = uploadedDocs.filter((d) => !d.uploading && !d.error).map((d) => d.id as number);

    if (uploadingCount > 0 && readyDocIds.length === 0) {
      setMessages((prev) => [...prev,
        { id: uuid(), role: "user", text },
        { id: uuid(), role: "agent", text: `Your file${uploadingCount > 1 ? "s are" : " is"} still uploading — please wait a moment and send your question again.` },
      ]);
      return;
    }

    /* ── RAG: answer from uploaded documents (always takes priority) ─── */
    if (readyDocIds.length > 0) {
      const ragAgentId = uuid();
      const userMsg: ChatMsg = { id: uuid(), role: "user", text };
      const agentMsg: ChatMsg = {
        id: ragAgentId, role: "agent", generating: true,
        text: `Searching ${readyDocIds.length} file${readyDocIds.length > 1 ? "s" : ""}…`,
      };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      try {
        const history = messages
          .filter((m) => !m.generating && m.text)
          .slice(-6)
          .map((m) => ({ role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant", content: m.text ?? "" }));
        const res = await fetch("/api/agents/rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: raw, doc_ids: readyDocIds, history }),
        });
        const data = await res.json() as { answer?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "RAG failed");
        setMessages((prev) => prev.map((m) =>
          m.id === ragAgentId ? { ...m, generating: false, text: data.answer ?? "No answer found." } : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to search documents";
        setMessages((prev) => prev.map((m) =>
          m.id === ragAgentId ? { ...m, generating: false, text: `Sorry — ${msg}` } : m
        ));
      }
      return;
    }

    /* ── Direct action from topic card click — runs before any pendingQ ── */
    if (directAction === "carousel") {
      setPendingQ(null);
      const agentId = uuid();
      const userMsg: ChatMsg = { id: uuid(), role: "user", text };
      const agentMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "" };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      try {
        const data = await generateFromChat("daily-content", text, { slideCount: 8 });
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: "Here you go:", resultType: "daily-content", resultData: data }
            : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
        ));
        toast.error(msg);
      }
      return;
    }

    /* ── Trend workflow steps ───────────────────────────────────────── */
    if (pendingQ && pendingQ.type === "trend-topic-pick") {
      const pq = pendingQ;
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      setPendingQ(null);

      const lower = text.toLowerCase();

      // Match order: exact → partial text → number index.
      // Partial text runs BEFORE number so "5 years" in a topic title doesn't
      // accidentally pick index 4 instead of the intended topic.
      const byExact   = pq.trends.find((t) => t.topic.trim() === text.trim());
      const byPartial = !byExact
        ? pq.trends.find((t) => t.topic.toLowerCase().includes(text.toLowerCase().slice(0, 30)) || text.toLowerCase().includes(t.topic.toLowerCase().slice(0, 30)))
        : null;
      const numMatch  = !byExact && !byPartial ? text.match(/^\s*(\d+)\s*$/) : null;
      const idx       = numMatch ? parseInt(numMatch[1], 10) - 1 : -1;
      const picked    = byExact
        ?? byPartial
        ?? (idx >= 0 && idx < pq.trends.length ? pq.trends[idx] : null)
        ?? null;

      // Only treat as "show more topics" when NO topic was matched AND the
      // message is a short, explicit "more" request (not a sentence with "more").
      if (!picked) {
        const isMoreRequest = /^more$|^(?:show\s+)?more\s+topics?|^\d+\s+more$/i.test(text.trim())
                           || (/\bmore\b/.test(lower) && text.trim().length <= 15);
        if (isMoreRequest) {
          await fetchAndShowTrends(3, pq.seenTopics);
          return;
        }
        setMessages((prev) => [...prev, {
          id: uuid(), role: "agent",
          text: "Please click one of the topic cards above, or type the topic number (e.g. **2**), or say **\"more\"** to see additional topics.",
        }]);
        setPendingQ(pq);
        return;
      }

      // Smart format detection — skip questions if format already mentioned
      const wantsCarousel = /carousel|\bslides?\b|multi[\s-]?slide/i.test(text);
      const wantsSingle   = /single[\s-]?(?:page|post)|one[\s-]?page|text[\s-]?post/i.test(text);
      const slideInPick   = extractSlideCount(text);

      if (wantsSingle) {
        await runTrendGenerate(picked.topic, picked.day, picked.type, "single", 0);
        return;
      }

      if (wantsCarousel && slideInPick) {
        await runTrendGenerate(picked.topic, picked.day, picked.type, "carousel", slideInPick);
        return;
      }

      if (wantsCarousel) {
        // User said "carousel" but no slide count — skip format question, ask slides only
        setMessages((prev) => [...prev, {
          id: uuid(), role: "agent",
          text: `How many slides for **"${picked.topic}"**?\n\n(Recommended: 6–8)`,
          quickReplies: [
            { label: "5 slides", value: "5" }, { label: "6 slides", value: "6" },
            { label: "7 slides", value: "7" }, { label: "8 slides", value: "8" },
          ],
        }]);
        setPendingQ({ type: "trend-slides", topic: picked.topic, day: picked.day, contentType: picked.type });
        return;
      }

      // Default — ask format (single or carousel)
      setMessages((prev) => [...prev, {
        id: uuid(), role: "agent",
        text: `Great choice!\n\n**${picked.day} · ${picked.type}**\n"${picked.topic}"\n\nHow would you like this content formatted?`,
        quickReplies: [
          { label: "📄 Single Page Post", value: "single" },
          { label: "🎠 Carousel Slides",  value: "carousel" },
        ],
      }]);
      setPendingQ({ type: "trend-format", topic: picked.topic, day: picked.day, contentType: picked.type });
      return;
    }

    if (pendingQ && pendingQ.type === "trend-more") {
      const pq = pendingQ;
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      setPendingQ(null);
      await fetchAndShowTrends(3, pq.seenTopics);
      return;
    }

    if (pendingQ && pendingQ.type === "trend-format") {
      const pq = pendingQ;
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      setPendingQ(null);

      const lower = text.toLowerCase();
      if (/single|one.?page|text.?post|no.?carousel/i.test(lower)) {
        await runTrendGenerate(pq.topic, pq.day, pq.contentType, "single", 0);
        return;
      }
      if (/carousel|slide|multi/i.test(lower)) {
        const slideInFormat = extractSlideCount(text);
        if (slideInFormat) {
          // Slide count already in message — generate directly, no extra question
          await runTrendGenerate(pq.topic, pq.day, pq.contentType, "carousel", slideInFormat);
          return;
        }
        setMessages((prev) => [...prev, {
          id: uuid(), role: "agent",
          text: "How many slides would you like? (Recommended: 6–8)",
          quickReplies: [
            { label: "5 slides", value: "5" }, { label: "6 slides", value: "6" },
            { label: "7 slides", value: "7" }, { label: "8 slides", value: "8" },
          ],
        }]);
        setPendingQ({ type: "trend-slides", topic: pq.topic, day: pq.day, contentType: pq.contentType });
        return;
      }
      // Ambiguous — re-ask
      setMessages((prev) => [...prev, {
        id: uuid(), role: "agent",
        text: "Would you like a **Single Page Post** or **Carousel Slides**?",
        quickReplies: [
          { label: "📄 Single Page Post", value: "single" },
          { label: "🎠 Carousel Slides",  value: "carousel" },
        ],
      }]);
      setPendingQ(pq);
      return;
    }

    if (pendingQ && pendingQ.type === "trend-slides") {
      const pq = pendingQ;
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      setPendingQ(null);
      const n = extractSlideCount(text) ?? parseInt(text, 10);
      const slideCount = (!isNaN(n) && n >= 3 && n <= 20) ? n : 7;
      await runTrendGenerate(pq.topic, pq.day, pq.contentType, "carousel", slideCount);
      return;
    }

    /* ── Topic format handler: user answered single/carousel for a bare topic ── */
    if (pendingQ && pendingQ.type === "topic-format") {
      const pq = pendingQ;
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      setPendingQ(null);
      const lower = text.toLowerCase();
      const wantsCarousel = /carousel|slide|multi/i.test(lower);
      const wantsSingle   = /single|one.?page|text.?post|no.?carousel/i.test(lower);
      const slideInMsg    = extractSlideCount(text);

      if (wantsSingle || !wantsCarousel) {
        const agentId = uuid();
        setMessages((prev) => [...prev, { id: agentId, role: "agent", generating: true, text: "" }]);
        try {
          const data = await generateFromChat("daily-content", pq.topic, { singlePage: true });
          setMessages((prev) => prev.map((m) =>
            m.id === agentId ? { ...m, generating: false, text: "Here you go:", resultType: "daily-content" as EmbedType, resultData: data } : m
          ));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Generation failed";
          setMessages((prev) => prev.map((m) =>
            m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
          ));
          toast.error(msg);
        }
        return;
      }
      if (wantsCarousel && slideInMsg) {
        const agentId = uuid();
        setMessages((prev) => [...prev, { id: agentId, role: "agent", generating: true, text: "" }]);
        try {
          const data = await generateFromChat("daily-content", pq.topic, { slideCount: slideInMsg });
          setMessages((prev) => prev.map((m) =>
            m.id === agentId ? { ...m, generating: false, text: "Here you go:", resultType: "daily-content" as EmbedType, resultData: data } : m
          ));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Generation failed";
          setMessages((prev) => prev.map((m) =>
            m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
          ));
          toast.error(msg);
        }
        return;
      }
      // Carousel but no slide count — ask
      setMessages((prev) => [...prev, {
        id: uuid(), role: "agent",
        text: "How many slides would you like? (Recommended: 6–8)",
        quickReplies: [
          { label: "5 slides", value: "5" }, { label: "6 slides", value: "6" },
          { label: "7 slides", value: "7" }, { label: "8 slides", value: "8" },
        ],
      }]);
      setPendingQ({ type: "topic-slides", topic: pq.topic });
      return;
    }

    /* ── Topic slides handler: user answered slide count for a bare topic ── */
    if (pendingQ && pendingQ.type === "topic-slides") {
      const pq = pendingQ;
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      setPendingQ(null);
      const n = extractSlideCount(text) ?? parseInt(text, 10);
      const slideCount = (!isNaN(n) && n >= 3 && n <= 20) ? n : 8;
      const agentId = uuid();
      setMessages((prev) => [...prev, { id: agentId, role: "agent", generating: true, text: "" }]);
      try {
        const data = await generateFromChat("daily-content", pq.topic, { slideCount });
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: "Here you go:", resultType: "daily-content" as EmbedType, resultData: data } : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
        ));
        toast.error(msg);
      }
      return;
    }

    /* ── Paste-content handler: user pasted after being asked ────────── */
    if (pendingQ && pendingQ.type === "paste-content") {
      const pq = pendingQ as LegacyPendingQ;
      const agentId = uuid();
      const userMsg: ChatMsg = { id: uuid(), role: "user", text };
      const agentMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "Auditing and rewriting your content to 10/10 standard…" };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      setPendingQ(null);
      try {
        const data = await generateFromChat(pq.intent, text);
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: "Here's your content audit:", resultType: pq.intent, resultData: data }
            : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Audit failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
        ));
        toast.error(msg);
      }
      return;
    }

    /* ── Legacy clarification (slide-count / single-page-confirm) ────── */
    if (pendingQ && (pendingQ.type === "slide-count" || pendingQ.type === "single-page-confirm")) {
      const pq = pendingQ as LegacyPendingQ;
      const agentId = uuid();
      const userMsg: ChatMsg = { id: uuid(), role: "user", text };
      const agentMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "Generating your content…" };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      setPendingQ(null);

      try {
        let opts: { slideCount?: number; singlePage?: boolean } = {};
        if (pq.type === "slide-count") {
          const n = extractSlideCount(text);
          opts = { slideCount: n ?? 8 };
        } else {
          opts = { singlePage: true };
        }
        const data = await generateFromChat(pq.intent, pq.originalText, opts);
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: "Here you go:", resultType: pq.intent, resultData: data }
            : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
        ));
        toast.error(msg);
      }
      return;
    }

    /* ── Trend search trigger ───────────────────────────────────────── */
    if (/trend|trending|today.*topic|topic.*today|what.*trending|show.*trend|latest.*topic|current.*topic|popular.*topic|ai.*update|ai.*news|what.*hot|what.*popular/i.test(text)) {
      setMessages((prev) => [...prev, { id: uuid(), role: "user", text }]);
      await fetchAndShowTrends(3, []);
      return;
    }

    const intent = detectIntent(text);

    /* ── Hard-matched intent: generate directly, no interruptions ───────── */
    if (intent === "daily-content") {
      const carouselRequest = isCarouselRequest(text);
      const slideCountInMsg = extractSlideCount(text);
      const isSinglePage = !carouselRequest && /single[\s-]?(?:page|post)|text[\s-]?post|no\s+carousel|without\s+carousel|\bpost\b/i.test(text);

      const agentId = uuid();
      const userMsg: ChatMsg = { id: uuid(), role: "user", text };
      const slides = slideCountInMsg ?? 8;
      // Hidden Thinking Layer — no intermediate text, only loading dots
      const agentMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "" };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      try {
        const opts = isSinglePage ? { singlePage: true } : carouselRequest ? { slideCount: slides } : { slideCount: slides };
        const data = await generateFromChat(intent, text, opts);
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: "Here you go:", resultType: "daily-content" as EmbedType, resultData: data }
            : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
        ));
        toast.error(msg);
      }
      return;
    }

    /* ── Hard-matched intent: topic analysis — research topic via AI ────── */
    if (intent === "topic-analysis") {
      const agentId = uuid();
      const userMsg: ChatMsg = { id: uuid(), role: "user", text };
      // Hidden Thinking Layer — internal only, no status text shown
      const agentMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "" };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      try {
        const history = messages
          .filter((m) => !m.generating && m.text)
          .slice(-8)
          .map((m) => ({ role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant", content: m.text ?? "" }));
        const routed = await askChatRouter(`Research and provide deep insights, trends, and signals on this topic: ${text}`, history);
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: routed.text || FALLBACK_REPLY }
            : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Research failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry — ${msg}` } : m
        ));
      }
      return;
    }

    const agentId = uuid();
    const userMsg: ChatMsg = { id: uuid(), role: "user", text };

    /* ── Hard-matched: calendar or content-refiner → generate directly ── */
    if (intent) {
      // Content-refiner: require pasted content (80+ chars after keyword)
      if (intent === "content-refiner") {
        const hasContent = /(?:audit|refine|rate|score|check|review)[^:]*:?\s*([\s\S]{80,})/i.test(text);
        if (!hasContent) {
          setMessages((prev) => [...prev, userMsg, {
            id: agentId, role: "agent",
            text: "Paste your post or carousel slides below — I'll audit and rewrite it to 10/10 standard.",
          }]);
          setPendingQ({ type: "paste-content", intent: "content-refiner", originalText: text });
          return;
        }
      }

      const agentMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "" };
      setMessages((prev) => [...prev, userMsg, agentMsg]);
      try {
        const data = await generateFromChat(intent, text);
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: "Here you go:", resultType: intent, resultData: data }
            : m
        ));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) =>
          m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
        ));
        toast.error(msg);
      }
      return;
    }

    /* ── No regex match — Claude routes intelligently (Hidden Thinking Layer) ── */
    const thinkingMsg: ChatMsg = { id: agentId, role: "agent", generating: true, text: "" };
    setMessages((prev) => [...prev, userMsg, thinkingMsg]);

    try {
      const history = messages
        .filter((m) => !m.generating && m.text)
        .slice(-8)
        .map((m) => ({ role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant", content: m.text ?? "" }));

      const routed = await askChatRouter(text, history);

      if (routed.action === "trending") {
        setMessages((prev) => prev.filter((m) => m.id !== agentId));
        await fetchAndShowTrends(3, []);
        return;
      }

      if (routed.action === "daily-content" || (routed.action === "topic-analysis" && routed.topic)) {
        const topic = routed.topic || text;
        // Ask format preference — don't silently default to carousel
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? {
                ...m, generating: false,
                text: `Got it!\n\n**"${topic}"**\n\nHow would you like this formatted?`,
                quickReplies: [
                  { label: "📄 Single Page Post", value: "single" },
                  { label: "🎠 Carousel Slides",  value: "carousel" },
                ],
              }
            : m
        ));
        setPendingQ({ type: "topic-format", topic });
        return;
      }

      if (routed.action === "topic-analysis") {
        // Topic Analysis — research insights, no post generation
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: routed.text || FALLBACK_REPLY }
            : m
        ));
        return;
      }

      if (routed.action === "weekly-calendar") {
        // Hidden Thinking Layer — no intermediate text
        const data = await generateFromChat("weekly-calendar", routed.theme || text);
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: "Here you go:", resultType: "weekly-calendar", resultData: data }
            : m
        ));
        return;
      }

      if (routed.action === "content-refiner") {
        if (routed.hasContent) {
          const data = await generateFromChat("content-refiner", text);
          setMessages((prev) => prev.map((m) =>
            m.id === agentId
              ? { ...m, generating: false, text: "Here's your audit:", resultType: "content-refiner", resultData: data }
              : m
          ));
        } else {
          setMessages((prev) => prev.map((m) =>
            m.id === agentId
              ? { ...m, generating: false, text: "Paste your carousel slides or post copy below — I'll audit and rewrite it to 10/10 standard." }
              : m
          ));
          setPendingQ({ type: "paste-content", intent: "content-refiner", originalText: text });
        }
        return;
      }

      /* action === "reply" — conversational response from Claude */
      setMessages((prev) => prev.map((m) =>
        m.id === agentId
          ? { ...m, generating: false, text: routed.text || FALLBACK_REPLY }
          : m
      ));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) => prev.map((m) =>
        m.id === agentId ? { ...m, generating: false, text: `Sorry — ${msg}. Try rephrasing or use the + menu to pick a skill.` } : m
      ));
    }
  }

  const isGenerating = messages.some((m) => m.generating);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) handleSend();
    }
  }

  async function handleResend(originalMsgId: string, newText: string) {
    if (messages.some((m) => m.generating)) return;
    const raw = newText.trim();
    if (!raw) return;

    setEditingMsgId(null);
    setPendingQ(null);
    setInputText("");
    setShowMenu(false);
    setShowSkillGrid(false);

    const text = selectedSkills.length > 0
      ? `[Active skills: ${selectedSkills.map((s) => s.name).join(", ")}]\n\n${raw}`
      : raw;

    // Truncate: keep only messages before the edited one
    const editIdx = messages.findIndex((m) => m.id === originalMsgId);
    const base = editIdx >= 0 ? messages.slice(0, editIdx) : [];

    // Re-answer detection: if the edited message was answering a pending question,
    // reconstruct the correct flow from the last agent message in base.
    const lastAgent = [...base].reverse().find((m) => m.role === "agent" && !m.generating);
    const agentText = lastAgent?.text ?? "";

    // CASE A: was answering slide count for a regular carousel
    if (/how many slides do you need for the carousel/i.test(agentText)) {
      const lastUser = [...base].reverse().find((m) => m.role === "user");
      const originalText = lastUser?.text ?? raw;
      const intent = (detectIntent(originalText) ?? "daily-content") as EmbedType;
      const n = extractSlideCount(raw) ?? parseInt(raw, 10);
      const slideCount = (!isNaN(n) && n >= 3 && n <= 20) ? n : 8;
      const agentId = uuid();
      setMessages([...base,
        { id: uuid(), role: "user", text: raw },
        { id: agentId, role: "agent", generating: true, text: `Generating a ${slideCount}-slide carousel…` },
      ]);
      try {
        const data = await generateFromChat(intent, originalText, { slideCount });
        setMessages((prev) => prev.map((m) => m.id === agentId
          ? { ...m, generating: false, text: "Here you go:", resultType: intent, resultData: data } : m));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) => m.id === agentId
          ? { ...m, generating: false, text: `Sorry — ${msg}` } : m));
        toast.error(msg);
      }
      return;
    }

    // CASE B: was answering slide count for a trending-topic carousel
    if (/how many slides would you like/i.test(agentText)) {
      const greatChoiceMsg = [...base].reverse().find((m) => m.role === "agent" && /Great choice/i.test(m.text ?? ""));
      const match = greatChoiceMsg?.text?.match(/\*\*(.+?) · (.+?)\*\*\n"(.+?)"/);
      if (match) {
        const [, day, contentType, topic] = match;
        const n = extractSlideCount(raw) ?? parseInt(raw, 10);
        const slideCount = (!isNaN(n) && n >= 3 && n <= 20) ? n : 7;
        setMessages([...base, { id: uuid(), role: "user", text: raw }]);
        await runTrendGenerate(topic, day, contentType, "carousel", slideCount);
        return;
      }
    }

    // CASE C: was answering single/carousel format for a trending topic
    if (lastAgent?.quickReplies?.some((q) => q.value === "single" || q.value === "carousel")) {
      const greatChoiceMsg = [...base].reverse().find((m) => m.role === "agent" && /Great choice/i.test(m.text ?? ""));
      const match = greatChoiceMsg?.text?.match(/\*\*(.+?) · (.+?)\*\*\n"(.+?)"/);
      if (match) {
        const [, day, contentType, topic] = match;
        const lower = raw.toLowerCase();
        setMessages([...base, { id: uuid(), role: "user", text: raw }]);
        if (/single|one.?page|text.?post|no.?carousel/i.test(lower)) {
          await runTrendGenerate(topic, day, contentType, "single", 0);
          return;
        }
        if (/carousel|slide|multi/i.test(lower)) {
          const slideInFormat = extractSlideCount(raw);
          if (slideInFormat) {
            await runTrendGenerate(topic, day, contentType, "carousel", slideInFormat);
            return;
          }
          setMessages((prev) => [...prev, {
            id: uuid(), role: "agent", generating: false,
            text: "How many slides would you like? (Recommended: 6–8)",
            quickReplies: [
              { label: "5 slides", value: "5" }, { label: "6 slides", value: "6" },
              { label: "7 slides", value: "7" }, { label: "8 slides", value: "8" },
              { label: "10 slides", value: "10" },
            ],
          }]);
          setPendingQ({ type: "trend-slides", topic, day, contentType });
          return;
        }
      }
    }

    // CASE D: was pasting content for content-refiner audit
    if (/Paste your carousel slides or post copy below/i.test(agentText)) {
      const agentId = uuid();
      setMessages([...base,
        { id: uuid(), role: "user", text: raw },
        { id: agentId, role: "agent", generating: true, text: "Auditing and rewriting your content to 10/10 standard…" },
      ]);
      try {
        const data = await generateFromChat("content-refiner", raw);
        setMessages((prev) => prev.map((m) => m.id === agentId
          ? { ...m, generating: false, text: "Here you go:", resultType: "content-refiner" as EmbedType, resultData: data } : m));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setMessages((prev) => prev.map((m) => m.id === agentId
          ? { ...m, generating: false, text: `Sorry — ${msg}` } : m));
        toast.error(msg);
      }
      return;
    }

    // CASE E: was answering how many more trend topics to fetch
    if (/how many more topics/i.test(agentText)) {
      const seenTopics = base
        .filter((m) => m.trendList && m.trendList.length > 0)
        .flatMap((m) => (m.trendList ?? []).map((t) => t.topic));
      const count = extractSlideCount(raw) ?? parseInt(raw, 10);
      const n = (!isNaN(count) && count > 0 && count <= 20) ? count : 3;
      setMessages([...base, { id: uuid(), role: "user", text: raw }]);
      await fetchAndShowTrends(n, seenTopics);
      return;
    }

    // CASE F: was picking a trending topic from a displayed card list
    if (lastAgent?.trendList && lastAgent.trendList.length > 0) {
      const trendList = lastAgent.trendList;
      const seenTopics = base
        .filter((m) => m.trendList && m.trendList.length > 0)
        .flatMap((m) => (m.trendList ?? []).map((t) => t.topic));
      const lower = raw.toLowerCase();

      // Match topic FIRST so sentences containing "more" (e.g. "10x more in 5 years")
      // don't trigger "show more topics".
      const byExact  = trendList.find((t) => t.topic === raw);
      const numMatch = !byExact ? raw.match(/\b(\d+)\b/) : null;
      const idx      = numMatch ? parseInt(numMatch[1], 10) - 1 : -1;
      const picked   = byExact
        ?? (idx >= 0 && idx < trendList.length ? trendList[idx] : null)
        ?? trendList.find((t) => t.topic.toLowerCase().includes(lower.slice(0, 30)))
        ?? null;

      if (picked) {
        setMessages([...base, { id: uuid(), role: "user", text: raw }]);

        // Smart format detection — same logic as handleSend trend-topic-pick
        const wantsCarousel = /carousel|\bslides?\b|multi[\s-]?slide/i.test(raw);
        const wantsSingle   = /single[\s-]?(?:page|post)|one[\s-]?page|text[\s-]?post/i.test(raw);
        const slideInPick   = extractSlideCount(raw);

        if (wantsSingle) {
          await runTrendGenerate(picked.topic, picked.day, picked.type, "single", 0);
          return;
        }
        if (wantsCarousel && slideInPick) {
          await runTrendGenerate(picked.topic, picked.day, picked.type, "carousel", slideInPick);
          return;
        }
        if (wantsCarousel) {
          setMessages((prev) => [...prev, {
            id: uuid(), role: "agent" as const, generating: false,
            text: `How many slides for **"${picked.topic}"**?\n\n(Recommended: 6–8)`,
            quickReplies: [
              { label: "5 slides", value: "5" }, { label: "6 slides", value: "6" },
              { label: "7 slides", value: "7" }, { label: "8 slides", value: "8" },
            ],
          }]);
          setPendingQ({ type: "trend-slides", topic: picked.topic, day: picked.day, contentType: picked.type });
          return;
        }

        setMessages((prev) => [...prev, {
          id: uuid(), role: "agent" as const, generating: false,
          text: `Great choice!\n\n**${picked.day} · ${picked.type}**\n"${picked.topic}"\n\nHow would you like this content formatted?`,
          quickReplies: [
            { label: "📄 Single Page Post", value: "single" },
            { label: "🎠 Carousel Slides",  value: "carousel" },
          ],
        }]);
        setPendingQ({ type: "trend-format", topic: picked.topic, day: picked.day, contentType: picked.type });
        return;
      }
      // No topic match — check if it's a strict "more" request
      const isMoreRequest = /^more$|^(?:show\s+)?more\s+topics?|^\d+\s+more$/i.test(raw.trim())
                         || (/\bmore\b/.test(lower) && raw.trim().length <= 15);
      if (isMoreRequest) {
        setMessages([...base, { id: uuid(), role: "user", text: raw }]);
        await fetchAndShowTrends(3, seenTopics);
        return;
      }
      // No match found — fall through to normal flow so user can type a new intent
    }

    // Trend trigger
    if (/trend|trending|today.*topic|topic.*today|what.*trending|show.*trend|latest.*topic|current.*topic|popular.*topic/i.test(text)) {
      setMessages([...base, { id: uuid(), role: "user", text }]);
      await fetchAndShowTrends(3, []);
      return;
    }

    const intent = detectIntent(text);
    const needsPaste = intent === "content-refiner" &&
      !text.match(/(?:audit|refine|rate|score|check|review)[^:]*:?\s*([\s\S]{80,})/i) &&
      text.split("\n").length < 4 &&
      text.length < 200;

    // Carousel / single-page clarification flow
    if (intent === "daily-content" && !needsPaste) {
      const carouselRequest = isCarouselRequest(text);
      const slideCountInMsg  = extractSlideCount(text);

      if (!carouselRequest && /single[\s-]?(?:page|post)|text[\s-]?post|no\s+carousel|without\s+carousel/i.test(text)) {
        const agentId = uuid();
        setMessages([...base, { id: uuid(), role: "user", text }, { id: agentId, role: "agent", generating: true, text: "Generating a single-page LinkedIn post…" }]);
        try {
          const data = await generateFromChat(intent, text, { singlePage: true });
          setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, generating: false, text: "Here you go:", resultType: intent, resultData: data } : m));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Generation failed";
          setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, generating: false, text: `Sorry — ${msg}` } : m));
          toast.error(msg);
        }
        return;
      }

      if (carouselRequest && slideCountInMsg) {
        const agentId = uuid();
        setMessages([...base, { id: uuid(), role: "user", text }, { id: agentId, role: "agent", generating: true, text: `Generating a ${slideCountInMsg}-slide carousel…` }]);
        try {
          const data = await generateFromChat(intent, text, { slideCount: slideCountInMsg });
          setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, generating: false, text: "Here you go:", resultType: intent, resultData: data } : m));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Generation failed";
          setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, generating: false, text: `Sorry — ${msg}` } : m));
          toast.error(msg);
        }
        return;
      }

      if (carouselRequest && !slideCountInMsg) {
        setMessages([...base,
          { id: uuid(), role: "user", text },
          { id: uuid(), role: "agent", generating: false, text: "How many slides do you need for the carousel? (e.g. 5, 8, 10 — default is 8 if you skip)" },
        ]);
        setPendingQ({ type: "slide-count", intent, originalText: text });
        return;
      }
    }

    const agentId = uuid();
    const userMsg: ChatMsg = { id: uuid(), role: "user", text };
    const agentMsg: ChatMsg = {
      id: agentId,
      role: "agent",
      generating: !!intent && !needsPaste,
      text: needsPaste
        ? "Paste your carousel slides or post copy below — I'll audit and rewrite it to 10/10 standard."
        : intent
          ? intent === "daily-content"
            ? "Researching your topic across 20+ web sources and crafting your LinkedIn content…"
            : "Generating your content…"
          : FALLBACK_REPLY,
    };

    setMessages([...base, userMsg, agentMsg]);

    if (needsPaste) {
      setPendingQ({ type: "paste-content", intent: "content-refiner", originalText: text });
      return;
    }
    if (!intent) return;

    try {
      const data = await generateFromChat(intent, text);
      setMessages((prev) => prev.map((m) =>
        m.id === agentId ? { ...m, generating: false, text: "Here you go:", resultType: intent, resultData: data } : m
      ));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setMessages((prev) => prev.map((m) =>
        m.id === agentId ? { ...m, generating: false, text: `Sorry, something went wrong — ${msg}` } : m
      ));
      toast.error(msg);
    }
  }

  function openSkill(agentId: string, skillId: string) {
    const agent = AGENTS.find((a) => a.id === agentId);
    const skill = agent?.skills.find((s) => s.id === skillId);
    if (!agent || !skill) return;
    setSelectedSkills((prev) => {
      const exists = prev.some((s) => s.skillId === skillId);
      return exists
        ? prev.filter((s) => s.skillId !== skillId)
        : [...prev, { agentId, skillId, name: skill.name, color: agent.color as Color }];
    });
    setShowMenu(false);
    setShowSkillGrid(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    e.target.value = "";
    setShowMenu(false);
    if (!newFiles.length) return;

    const remaining = 5 - uploadedDocs.length;
    if (remaining <= 0) { toast.error("Maximum 5 files already attached — remove one to add more"); return; }
    const toUpload = newFiles.slice(0, remaining);
    if (!toUpload.length) return;

    // Add as "uploading" placeholders immediately
    const placeholders: UploadedDoc[] = toUpload.map((f) => ({
      id: `uploading-${f.name}-${Date.now()}`,
      filename: f.name,
      uploading: true,
    }));
    setUploadedDocs((prev) => [...prev, ...placeholders]);
    setUploadedFiles((prev) => [...prev, ...toUpload]);

    // Upload to backend
    try {
      const formData = new FormData();
      toUpload.forEach((f) => formData.append("files", f));
      formData.append("session_id", sessionId);

      const res = await fetch("/api/agents/upload", { method: "POST", body: formData });
      const data = await res.json() as { documents?: { id: string; filename: string }[]; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      // Replace placeholders with real doc IDs
      const uploaded = data.documents ?? [];
      setUploadedDocs((prev) =>
        prev.map((doc) => {
          if (!doc.uploading) return doc;
          const match = uploaded.find((u) => u.filename === doc.filename);
          return match ? { id: match.id, filename: match.filename, uploading: false } : { ...doc, uploading: false, error: true };
        })
      );
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} ready — ask anything about them`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadedDocs((prev) =>
        prev.map((doc) => doc.uploading ? { ...doc, uploading: false, error: true } : doc)
      );
      toast.error(msg);
    }
  }

  function closeMenu() {
    setShowMenu(false);
    setSubMenu(null);
  }

  function newChat() {
    setMessages([]);
    setSessionId(uuid());
    setPendingQ(null);
    setSelectedSkills([]);
    setUploadedFiles([]);
    setUploadedDocs([]);
    setInputText("");
    setEditingMsgId(null);
  }

  function loadSession(session: ChatSession) {
    setMessages((session.messages as ChatMsg[]) || []);
    setSessionId(session.session_id);
    setPendingQ(null);
    setSelectedSkills([]);
    setUploadedFiles([]);
    setUploadedDocs([]);
    setInputText("");
    setEditingMsgId(null);
  }

  async function deleteSession(sid: string) {
    setSessions((prev) => prev.filter((s) => s.session_id !== sid));
    if (sid === sessionId) newChat();
    try {
      await fetch(`/api/agents/chat-history?session_id=${sid}`, { method: "DELETE" });
    } catch { /* silent */ }
  }

  /* ── Trend workflow ────────────────────────────────────────────────────── */
  async function fetchAndShowTrends(count: number, seenTopics: string[]) {
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const todayIdx = new Date().getDay();
    const today    = dayNames[todayIdx >= 1 && todayIdx <= 5 ? todayIdx : 1];

    const agentId = uuid();
    const loadingText = seenTopics.length > 0
      ? `Fetching 3 more fresh topics from X… (usually instant)`
      : `Scanning X for today's top 3 trending ${today} topics… (15–20s first load, instant after)`;

    setMessages((prev) => [
      ...prev,
      { id: agentId, role: "agent", generating: true, text: loadingText },
    ]);

    try {
      // 28s client timeout — server uses x_search (13-23s) with a 25s abort.
      // Cache pre-warm means this fires only on the very first cold load; all
      // subsequent calls return instantly from cache.
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 28_000);
      // Only send the last batch (3) as exclude — sending all seen topics confuses
      // x.ai and breaks the loop. Client-side fuzzy dedup handles all historical repeats.
      const lastBatch = seenTopics.slice(-3);
      const excludeParam = lastBatch.length > 0
        ? `&exclude=${encodeURIComponent(lastBatch.join("|||"))}`
        : "";
      const res  = await fetch(`/api/agents/trending?day=${today}${excludeParam}`, { signal: ctrl.signal });
      clearTimeout(tid);

      // If API Gateway killed the Lambda (504), res.json() throws — fall to catch.
      // If Lambda returned an error JSON, handle it below.
      const data = await res.json();
      const fresh: TrendItem[]  = Array.isArray(data.trends) ? data.trends : [];
      const contentType: string = data.contentType ?? fresh[0]?.type ?? "content";

      // Show API error if no topics returned
      if (fresh.length === 0 && data.error) {
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: `⚠️ ${data.error}\n\nPlease try again in a moment.` }
            : m
        ));
        setPendingQ(null);
        return;
      }

      // Fuzzy dedup — catches rephrased versions of the same topic
      function sigWords(s: string): string[] {
        return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3);
      }
      function topicIsDupe(candidate: string): boolean {
        const cw = new Set(sigWords(candidate));
        return seenTopics.some((seen) => {
          if (seen === candidate) return true;
          return sigWords(seen).filter((w) => cw.has(w)).length >= 3;
        });
      }
      const seenHandleSet = new Set(
        messages.flatMap((m) => (m.trendList ?? []).map((t) => (t.handle ?? "").toLowerCase())).filter(Boolean)
      );
      const newUnique = fresh.filter((t) => {
        if (topicIsDupe(t.topic)) return false;
        if (t.handle && seenHandleSet.has(t.handle.toLowerCase())) return false;
        return true;
      });
      const shown     = newUnique.slice(0, count);

      if (shown.length === 0) {
        // All returned topics were dupes — show what we got anyway so loop never dead-ends
        const fallback = fresh.slice(0, count);
        if (fallback.length === 0) {
          setMessages((prev) => prev.map((m) =>
            m.id === agentId
              ? { ...m, generating: false, text: "No more new topics available right now. Try again in a moment." }
              : m
          ));
          setPendingQ(null);
          return;
        }
        // Use fallback topics (may overlap slightly) rather than blocking the loop
        const shownFallback = fallback;
        const newSeenFallback = [...seenTopics, ...shownFallback.map((t) => t.topic)];
        const trendSourcesFallback = shownFallback.filter((t) => t.handle).map((t) => ({ handle: t.handle!, authority: t.authority }));
        const introFallback = `Here are ${shownFallback.length} more **${contentType}** topics from X. Click a card or type a number:`;
        setMessages((prev) => prev.map((m) =>
          m.id === agentId
            ? { ...m, generating: false, text: introFallback, trendList: shownFallback, trendSources: trendSourcesFallback.length > 0 ? trendSourcesFallback : undefined }
            : m
        ));
        setPendingQ({ type: "trend-topic-pick", trends: shownFallback, seenTopics: newSeenFallback });
        // Pre-warm next batch
        const nxExclude = encodeURIComponent(newSeenFallback.slice(-3).join("|||"));
        fetch(`/api/agents/trending?day=${today}&exclude=${nxExclude}`).catch(() => {});
        return;
      }

      const newSeenTopics = [...seenTopics, ...shown.map((t) => t.topic)];

      // Collect source handles for the attribution bar shown above topic cards
      const trendSources = shown
        .filter((t) => t.handle)
        .map((t) => ({ handle: t.handle!, authority: t.authority }));

      const introText = seenTopics.length > 0
        ? `Here are ${shown.length} more **${contentType}** topics from X. Click a card or type a number:`
        : `Here are ${shown.length} **${contentType}** topics trending on X today. Click a card or type its number to generate LinkedIn content:`;

      setMessages((prev) => prev.map((m) =>
        m.id === agentId
          ? {
              ...m,
              generating: false,
              text: introText,
              trendList: shown,
              trendSources: trendSources.length > 0 ? trendSources : undefined,
            }
          : m
      ));
      setPendingQ({ type: "trend-topic-pick", trends: shown, seenTopics: newSeenTopics });

      // Pre-warm the next "more" batch immediately in the background.
      // By the time the user clicks "Load 3 more", the server cache is already warm → instant.
      const nextExclude = newSeenTopics.slice(-3);
      const nextExcludeParam = encodeURIComponent(nextExclude.join("|||"));
      fetch(`/api/agents/trending?day=${today}&exclude=${nextExcludeParam}`).catch(() => {});

    } catch (err) {
      const isAbort = err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"));
      const msg = isAbort
        ? "Fetching trends took longer than expected. Please try again."
        : "Couldn't connect to the trends service. Please try again or type your own topic.";
      setMessages((prev) => prev.map((m) =>
        m.id === agentId
          ? { ...m, generating: false, text: msg }
          : m
      ));
      setPendingQ(null);
    }
  }

  async function runTrendGenerate(topic: string, day: string, contentType: string, format: "single" | "carousel", slideCount: number) {
    const agentId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: agentId, role: "agent", generating: true, text: `Researching "${topic}" across 20+ web sources and crafting your LinkedIn content…` },
    ]);
    try {
      const data = await generateFromChat("daily-content", topic, {
        singlePage:  format === "single",
        slideCount:  format === "carousel" ? slideCount : undefined,
        day, contentType,
      });
      setMessages((prev) => prev.map((m) =>
        m.id === agentId
          ? { ...m, generating: false, text: "Here's your LinkedIn content:", resultType: "daily-content", resultData: data }
          : m
      ));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setMessages((prev) => prev.map((m) =>
        m.id === agentId ? { ...m, generating: false, text: `Sorry — ${msg}` } : m
      ));
      toast.error(msg);
    }
  }

  /* ── CHAT / WELCOME VIEW ────────────────────────────────────────────────── */
  return (
    <div className="flex flex-1 min-h-0">

      {/* Directory modal */}
      {showDirectory && (
        <DirectoryModal
          onClose={() => setShowDirectory(false)}
          onUseSkill={(agentId, skillId) => openSkill(agentId, skillId)}
        />
      )}

      {/* Manual carousel editor modal */}
      {showManualEditor && (
        <ManualCarouselEditor
          userId={currentUser?.id}
          userName={userName}
          onClose={() => setShowManualEditor(false)}
        />
      )}

    <div className="flex flex-col flex-1 min-h-0 min-w-0">

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {messages.length === 0 ? (

          /* ── Welcome screen ── */
          <div className="flex flex-col items-center justify-center min-h-full px-6 py-16 max-w-2xl mx-auto w-full">
            {/* POZ star */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="12" y1="2"  x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="2"  y1="12" x2="6"  y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-600 opacity-20 blur-2xl scale-150 -z-10" />
            </div>

            <h1 className="text-[28px] sm:text-3xl font-bold text-center tracking-tight text-foreground">
              How can I help you today
              {firstName !== "there" ? `, ${firstName}` : ""}?
            </h1>
            <p className="text-muted-foreground mt-2 text-sm text-center max-w-sm leading-relaxed">
              LinkedIn content, trending topics, carousels, or weekly calendars — just ask.
            </p>

            {/* 2×2 suggestion cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.text)}
                  className="group text-left p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-150"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-3 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {s.icon}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

        ) : (

          /* ── Chat messages ── */
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {messages.map((msg) =>
              msg.role === "user" ? (
                /* ── User message ── */
                <div key={msg.id} className="flex justify-end group/usermsg">
                  {editingMsgId === msg.id ? (
                    <div className="max-w-[78%] w-full space-y-2">
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (editText.trim()) handleResend(msg.id, editText.trim());
                          }
                          if (e.key === "Escape") setEditingMsgId(null);
                        }}
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl text-[15px] bg-primary/10 border-2 border-primary/30 text-foreground leading-relaxed resize-none outline-none focus:border-primary"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingMsgId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
                        <button
                          onClick={() => { if (editText.trim()) handleResend(msg.id, editText.trim()); }}
                          disabled={!editText.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                          Resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5 max-w-[78%]">
                      <div className="px-4 py-3 rounded-[20px] rounded-tr-[6px] bg-primary text-primary-foreground text-[15px] leading-relaxed">
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/usermsg:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.text)}
                          title="Copy"
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          Copy
                        </button>
                        <button
                          onClick={() => { setEditingMsgId(msg.id); setEditText(msg.text); }}
                          title="Edit & resend"
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Agent message ── */
                <div key={msg.id} className="flex items-start gap-4 group/agentmsg">
                  <div className="shrink-0 mt-0.5">
                    <PozStar size={8} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                    {/* Generating: progress bar 0→100 */}
                    {msg.generating ? (
                      <GeneratingProgressBar label={msg.text || undefined} />
                    ) : (
                      <>
                        {/* Message text */}
                        <MdText text={msg.text} className="text-[15px] text-foreground" />

                        {/* Hover action row */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/agentmsg:opacity-100 transition-opacity -ml-1">
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.text)}
                            title="Copy"
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            Copy
                          </button>
                          <button
                            onClick={() => toast.success("Feedback recorded!")}
                            title="Good response"
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                          </button>
                          <button
                            onClick={() => toast.error("Thanks for the feedback.")}
                            title="Bad response"
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Quick-reply buttons */}
                    {!msg.generating && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr.value}
                            onClick={() => handleSend(qr.value)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary/25 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                          >
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* X source attribution bar — shown above topic cards */}
                    {!msg.generating && msg.trendSources && msg.trendSources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-bold shrink-0">𝕏</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">Sources</span>
                        <span className="text-muted-foreground/40 text-[10px] shrink-0">·</span>
                        {msg.trendSources.map((s, i) => (
                          <span key={i} className="text-[11px] text-foreground font-medium">
                            {s.handle}
                            {s.authority && <span className="text-muted-foreground font-normal"> ({s.authority})</span>}
                            {i < msg.trendSources!.length - 1 && <span className="text-muted-foreground">,</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Trend list — X source cards */}
                    {!msg.generating && msg.trendList && msg.trendList.length > 0 && (
                      <div className="space-y-2">
                        {msg.trendList.map((t, i) => {                          const dc = DAY_CFG[t.day] ?? DAY_CFG.Monday;
                          const initial = t.handle
                            ? t.handle.replace("@", "").charAt(0).toUpperCase()
                            : String(i + 1);
                          const avatarBg = dc.badge.includes("blue") ? "bg-blue-500"
                            : dc.badge.includes("purple") ? "bg-purple-500"
                            : dc.badge.includes("orange") ? "bg-orange-500"
                            : dc.badge.includes("emerald") ? "bg-emerald-500"
                            : "bg-rose-500";
                          return (
                            <div key={`${t.day}-${i}`} className="relative group">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSend(t.topic, "carousel")}
                                onKeyDown={(e) => e.key === "Enter" && handleSend(t.topic, "carousel")}
                                className={cn(
                                  "w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-accent/50 transition-all cursor-pointer",
                                  dc.border
                                )}
                              >
                                <div className={cn("relative shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-black text-white mt-0.5", avatarBg)}>
                                  <span className="select-none">{initial}</span>
                                  {t.handle && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={`https://unavatar.io/x/${t.handle.replace("@", "")}`}
                                      alt=""
                                      className="absolute inset-0 w-full h-full object-cover"
                                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  {t.handle ? (
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                      <span className="text-sm font-bold text-foreground">{t.handle}</span>
                                      {t.authority && (
                                        <span className="text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5 leading-none">{t.authority}</span>
                                      )}
                                      <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0", dc.badge)}>
                                        {i + 1}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", dc.badge)}>{t.day} · {t.type}</span>
                                    </div>
                                  )}
                                  {t.whatTheySaid && (
                                    <p className="text-[11px] text-muted-foreground leading-snug mb-1.5 line-clamp-2 italic">&ldquo;{t.whatTheySaid}&rdquo;</p>
                                  )}
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mt-0.5">Topic →</span>
                                    <p className="text-sm font-semibold text-foreground leading-snug">{t.topic}</p>
                                  </div>
                                  {/* Blue X post link */}
                                  {t.post_url && (
                                    <a
                                      href={t.post_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg w-full justify-center transition-all hover:opacity-80"
                                      style={{ background: "#3b82f615", color: "#3b82f6", border: "1px solid #3b82f640" }}
                                    >
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                      View post on X ↗
                                    </a>
                                  )}
                                  {/* Date/time below the link */}
                                  {t.posted_at && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground justify-center">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                      <span>{new Date(t.posted_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Copy topic button — appears on hover */}
                              <CopyIconBtn
                                text={t.topic}
                                title="Copy topic"
                                size={11}
                                className="absolute top-2.5 right-2.5 w-6 h-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                          );
                        })}

                        {/* Load more button — visible after every trend batch */}
                        {pendingQ?.type === "trend-topic-pick" &&
                          msg.id === messages.filter((m) => m.trendList && m.trendList.length > 0).at(-1)?.id && (
                          <button
                            onClick={() => fetchAndShowTrends(3, pendingQ.seenTopics)}
                            className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary/40 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                            Load 3 more topics
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline result cards */}
                    {!msg.generating && msg.resultType === "daily-content" && msg.resultData && (
                      <DailyResultCard data={msg.resultData as DailyResult} userId={currentUser?.id} userName={currentUser?.name ?? currentUser?.email ?? ""} />
                    )}
                    {!msg.generating && msg.resultType === "weekly-calendar" && msg.resultData && (
                      <CalendarResultCard data={msg.resultData as CalendarResult} userId={currentUser?.id} />
                    )}
                    {!msg.generating && msg.resultType === "content-refiner" && msg.resultData && (
                      <RefinerResultCard data={msg.resultData as RefinerResult} userId={currentUser?.id} />
                    )}
                    {/* Fallback for history sessions where resultData was not persisted */}
                    {!msg.generating && msg.resultType && !msg.resultData && (
                      <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground leading-snug">Content preview unavailable for this session. Start a new chat and regenerate to view and export the full result.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* ── Sticky input bar ── */}
      <div className={cn(
        "shrink-0 px-4 pb-6 bg-background",
        messages.length > 0 ? "pt-3 shadow-[0_-1px_0_0_hsl(var(--border)/0.5)]" : "pt-0"
      )}>
        <div className="max-w-3xl mx-auto">

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.js,.ts,.jsx,.tsx,.html,.xml,.yaml,.yml"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Uploaded file chips */}
          {uploadedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Files attached:</span>
              {uploadedDocs.map((doc, i) => (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                    doc.uploading
                      ? "bg-muted border-border text-muted-foreground animate-pulse"
                      : doc.error
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600"
                        : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  )}
                >
                  <IconPaperclip />
                  <span className="max-w-[160px] truncate">{doc.filename}</span>
                  {doc.uploading && <span className="text-[10px]">uploading…</span>}
                  {doc.error && <span className="text-[10px]">failed</span>}
                  {!doc.uploading && !doc.error && <span className="text-[10px] text-blue-500">✓</span>}
                  <button
                    onClick={() => {
                      setUploadedDocs((prev) => prev.filter((_, j) => j !== i));
                      setUploadedFiles((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >✕</button>
                </div>
              ))}
              {uploadedDocs.filter((d) => !d.uploading && !d.error).length > 0 && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  Ask anything about {uploadedDocs.filter((d) => !d.uploading && !d.error).length === 1 ? "this file" : "these files"}
                </span>
              )}
            </div>
          )}

          {/* Action menu popup */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeMenu} />
              <div className="absolute bottom-full mb-2 left-0 z-40 w-[220px] bg-popover border border-border rounded-2xl shadow-2xl py-1.5 overflow-visible">

                <button
                  onClick={() => { setShowManualEditor(true); closeMenu(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl hover:bg-accent transition-colors text-left"
                >
                  <span className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                  </span>
                  <span className="text-sm font-medium">Write Manually</span>
                  <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">Carousel</span>
                </button>

                <div className="my-1 mx-3 border-t border-border/50" />

                <label
                  className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => { if (uploadedDocs.length >= 5) { toast.error("Maximum 5 files — remove one to add more"); return; } fileInputRef.current?.click(); }}
                >
                  <span className="text-muted-foreground"><IconPaperclip /></span>
                  <span className="text-sm">
                    Attach files <span className="text-muted-foreground font-normal">(PDF, DOCX, TXT…)</span>
                    <span className={cn("ml-1.5 text-xs font-semibold", uploadedDocs.length >= 5 ? "text-amber-500" : "text-muted-foreground")}>
                      {uploadedDocs.length}/5
                    </span>
                  </span>
                </label>

                <button onClick={closeMenu} className="w-full flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl hover:bg-accent transition-colors text-left">
                  <span className="text-muted-foreground"><IconCamera /></span>
                  <span className="text-sm">Take a screenshot</span>
                </button>

                <div className="my-1 mx-3 border-t border-border/50" />

                <div className="relative mx-1" onMouseEnter={() => setSubMenu("skills")} onMouseLeave={() => setSubMenu(null)}>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-left">
                    <span className="text-muted-foreground"><IconLayers /></span>
                    <span className="text-sm flex-1">Skills</span>
                    <span className="text-muted-foreground"><IconChevronRight /></span>
                  </button>
                  {subMenu === "skills" && (
                    <div className="absolute left-full top-0 ml-1 w-[200px] bg-popover border border-border rounded-2xl shadow-2xl py-1.5 z-50">
                      <button onClick={() => { setShowDirectory(true); closeMenu(); }} className="w-full flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl hover:bg-accent transition-colors text-left">
                        <span className="text-muted-foreground"><IconSettings2 /></span>
                        <span className="text-sm">Manage skills</span>
                      </button>
                      <button onClick={() => { setShowDirectory(true); closeMenu(); }} className="w-full flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl hover:bg-accent transition-colors text-left">
                        <span className="text-muted-foreground"><IconPlus /></span>
                        <span className="text-sm">Add skill</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Skill grid popup */}
          {showSkillGrid && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSkillGrid(false)} />
              <div className="absolute bottom-full mb-3 left-0 right-0 z-40 bg-card border-2 border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 pt-3 pb-2.5 border-b overflow-x-auto">
                  {(["all", ...AGENTS.map((a) => a.id)] as string[]).map((id) => {
                    const isAll  = id === "all";
                    const agent  = isAll ? null : AGENTS.find((a) => a.id === id)!;
                    const color  = agent ? C[agent.color as Color] : null;
                    const active = pickerTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setPickerTab(id)}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap",
                          active
                            ? isAll ? "bg-foreground text-background border-foreground" : color!.tab
                            : isAll ? "border-transparent text-muted-foreground hover:bg-accent" : cn("border-transparent", color!.chip)
                        )}
                      >
                        {!isAll && ICON_MAP[agent!.icon]}
                        {isAll ? "All Skills" : agent!.shortName}
                      </button>
                    );
                  })}
                </div>
                <div className="p-3 max-h-[280px] overflow-y-auto space-y-4">
                  {(pickerTab === "all" ? AGENTS : AGENTS.filter((a) => a.id === pickerTab)).map((a) => {
                    const t = C[a.color as Color];
                    return (
                      <div key={a.id}>
                        {pickerTab === "all" && (
                          <div className={cn("flex items-center gap-1.5 text-xs font-bold mb-2.5 px-1", t.label)}>
                            {ICON_MAP[a.icon]} {a.shortName} — {a.name}
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {a.skills.map((sk) => {
                            const isSelected = selectedSkills.some((s) => s.skillId === sk.id);
                            return (
                              <button
                                key={sk.id}
                                onClick={() => openSkill(a.id, sk.id)}
                                className={cn(
                                  "text-left px-3 py-2.5 rounded-xl border transition-all relative",
                                  isSelected ? cn(t.tab, "ring-2 ring-offset-1 ring-current") : cn("bg-background", t.card)
                                )}
                              >
                                {isSelected && (
                                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                  </span>
                                )}
                                <span className="font-semibold text-xs leading-tight block mb-1 pr-4">{sk.name}</span>
                                <span className="text-xs text-muted-foreground leading-snug line-clamp-2">{sk.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Main input box */}
          <div className={cn(
            "relative rounded-2xl border bg-card shadow-sm transition-all duration-150",
            (showMenu || showSkillGrid)
              ? "border-primary/40 shadow-md"
              : "border-border hover:border-muted-foreground/40 focus-within:border-primary/50 focus-within:shadow-md"
          )}>

            {/* Selected skill chips */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-0">
                {selectedSkills.map((s) => {
                  const t = C[s.color];
                  return (
                    <span key={s.skillId} className={cn("inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold border", t.tab)}>
                      {s.name}
                      <button
                        onClick={() => setSelectedSkills((prev) => prev.filter((x) => x.skillId !== s.skillId))}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Message POZ Agents…"
              rows={1}
              className="w-full px-5 pt-4 pb-14 text-[15px] bg-transparent resize-none outline-none leading-relaxed placeholder:text-muted-foreground/40 max-h-52 overflow-y-auto"
              style={{ minHeight: "60px" }}
            />

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-3">
              {/* Left: attach / plus */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setShowMenu((v) => !v); setSubMenu(null); setShowSkillGrid(false); }}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg border transition-all",
                    showMenu
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                  )}
                  title="Actions"
                >
                  <IconPlus />
                </button>
                <button
                  onClick={() => { if (uploadedDocs.length < 5) fileInputRef.current?.click(); else toast.error("Maximum 5 files — remove one to add more"); }}
                  title={uploadedDocs.length >= 5 ? "Maximum 5 files reached" : `Attach file (${uploadedDocs.length}/5)`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <IconPaperclip />
                </button>
              </div>

              {/* Right: hint + send/stop */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground/40 font-medium hidden sm:block select-none">POZ Agents</span>
                {isGenerating ? (
                  <button
                    onClick={handleStop}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground text-background hover:opacity-75 transition-all"
                    title="Stop generation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      inputText.trim()
                        ? "bg-foreground text-background hover:opacity-75"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    title="Send"
                  >
                    <IconArrowUp />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <p className="text-center text-[11px] text-muted-foreground/35 mt-2 select-none">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
