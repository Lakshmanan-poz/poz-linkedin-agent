"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type Slide       = { position: number; type: string; title: string; body: string };
type CalDay      = { day: string; type: string; contentFocus: string; brief: string; hook: string; hashtags: string[] };
type RefinedSlide = { position: number; type: string; title: string; body: string; status: string; note: string };

type DailyResult = {
  day?: string; contentType?: string; topic?: string;
  slides?: Slide[];
  caption?: string; hashtags?: string[];
  bodyPost?: string; outreachHook?: string;
};
type CalendarResult = {
  weekOf?: string; company?: string; summary?: string;
  days?: CalDay[];
};
type RefinerResult = {
  overallScore?: number;
  refined?: { slides?: RefinedSlide[]; caption?: string; hashtags?: string[] };
  publishReady?: boolean; finalNote?: string;
};

type ChatMsg = {
  id: string;
  role: "user" | "agent";
  text: string;
  generating?: boolean;
  resultType?: string;
  resultData?: DailyResult | CalendarResult | RefinerResult;
};

type Session = {
  session_id: string;
  title: string;
  messages: ChatMsg[];
  last_message_at: string;
};

/* ─── POZ Logo ───────────────────────────────────────────────────────────────── */
function PozLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-xl bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-md shrink-0"
      style={{ width: size, height: size }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.44} height={size * 0.44} viewBox="0 0 24 24"
        fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2"  x2="12" y2="6"/>  <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="6"  y2="12"/>  <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="4.93"  x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="4.93"  y1="19.07" x2="7.76"  y2="16.24"/>
        <line x1="16.24" y1="7.76"  x2="19.07" y2="4.93"/>
      </svg>
    </div>
  );
}

/* ─── Result renderers ───────────────────────────────────────────────────────── */
function DailyCard({ data }: { data: DailyResult }) {
  return (
    <div className="mt-3 space-y-3">
      {/* Meta */}
      {(data.day || data.contentType || data.topic) && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {data.day        && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{data.day}</span>}
          {data.contentType && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{data.contentType}</span>}
        </div>
      )}
      {data.topic && <p className="text-sm font-semibold text-gray-800 leading-snug">{data.topic}</p>}

      {/* Slides */}
      {data.slides && data.slides.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Carousel · {data.slides.length} Slides
          </p>
          {data.slides.map(sl => (
            <div key={sl.position} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-600 tabular-nums">
                  {String(sl.position).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{sl.type}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 leading-snug">{sl.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{sl.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Body post */}
      {data.bodyPost && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">LinkedIn Post Body</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.bodyPost}</p>
        </div>
      )}

      {/* Caption */}
      {data.caption && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Caption</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{data.caption}</p>
        </div>
      )}

      {/* Hashtags */}
      {data.hashtags && data.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.hashtags.map(h => (
            <span key={h} className="text-[11px] px-2 py-0.5 rounded border border-blue-200 text-blue-600 font-mono bg-blue-50">
              {h.startsWith("#") ? h : `#${h}`}
            </span>
          ))}
        </div>
      )}

      {/* Outreach hook */}
      {data.outreachHook && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Outreach Hook</p>
          <p className="text-xs text-gray-600 italic leading-relaxed">&ldquo;{data.outreachHook}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

function CalendarCard({ data }: { data: CalendarResult }) {
  const dayColors: Record<string, string> = {
    Monday: "border-blue-200 bg-blue-50",
    Tuesday: "border-purple-200 bg-purple-50",
    Wednesday: "border-orange-200 bg-orange-50",
    Thursday: "border-emerald-200 bg-emerald-50",
    Friday: "border-rose-200 bg-rose-50",
  };
  return (
    <div className="mt-3 space-y-3">
      {data.summary && <p className="text-xs text-gray-500 leading-relaxed italic">{data.summary}</p>}
      {data.days && data.days.length > 0 && (
        <div className="space-y-2">
          {data.days.map(d => (
            <div key={d.day} className={`rounded-xl border p-3 space-y-1 ${dayColors[d.day] ?? "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-700">{d.day}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-gray-200 text-gray-500 font-semibold">{d.type}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-snug">{d.contentFocus}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{d.brief}</p>
              {d.hashtags && d.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {d.hashtags.map(h => (
                    <span key={h} className="text-[10px] text-blue-600 font-mono">{h.startsWith("#") ? h : `#${h}`}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RefinerCard({ data }: { data: RefinerResult }) {
  const refined = data.refined;
  return (
    <div className="mt-3 space-y-3">
      {data.overallScore != null && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Overall Score</span>
          <span className={`text-sm font-bold ${data.overallScore >= 80 ? "text-emerald-600" : data.overallScore >= 60 ? "text-amber-600" : "text-red-500"}`}>
            {data.overallScore}/100
          </span>
          {data.publishReady && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Publish Ready</span>}
        </div>
      )}
      {data.finalNote && <p className="text-xs text-gray-500 italic leading-relaxed">{data.finalNote}</p>}
      {refined?.slides && refined.slides.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Refined Slides</p>
          {refined.slides.map(sl => (
            <div key={sl.position} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-600 tabular-nums">{String(sl.position).padStart(2, "0")}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${sl.status === "Fixed" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{sl.status}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 leading-snug">{sl.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{sl.body}</p>
              {sl.note && <p className="text-[10px] text-blue-500 italic">{sl.note}</p>}
            </div>
          ))}
        </div>
      )}
      {refined?.caption && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Caption</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{refined.caption}</p>
        </div>
      )}
      {refined?.hashtags && refined.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {refined.hashtags.map(h => (
            <span key={h} className="text-[11px] px-2 py-0.5 rounded border border-blue-200 text-blue-600 font-mono bg-blue-50">
              {h.startsWith("#") ? h : `#${h}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultBlock({ msg }: { msg: ChatMsg }) {
  if (!msg.resultType || !msg.resultData) return null;
  const t = msg.resultType;
  if (t === "daily-content")   return <DailyCard    data={msg.resultData as DailyResult}    />;
  if (t === "weekly-calendar") return <CalendarCard data={msg.resultData as CalendarResult} />;
  if (t === "content-refiner") return <RefinerCard  data={msg.resultData as RefinerResult}  />;
  return null;
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function SharePage() {
  const params    = useParams();
  const sessionId = params.sessionId as string;

  const [session,  setSession]  = useState<Session | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    fetch(`/api/share/${sessionId}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(data => { if (data) { setSession(data); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [sessionId]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const messages = (session?.messages ?? []).filter(
    (m): m is ChatMsg =>
      (m.role === "user" || m.role === "agent") &&
      !m.generating &&
      typeof m.text === "string" &&
      m.text.trim().length > 0
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400 text-sm">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading conversation…
      </div>
    </div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <PozLogo size={48} />
      <p className="text-lg font-semibold text-gray-700">Conversation not found</p>
      <p className="text-sm text-gray-400">This link may be invalid or the session was deleted.</p>
    </div>
  );

  /* ── Share view ── */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PozLogo size={32} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">POZ Agent Catalog</p>
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {session?.title ?? "Conversation"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {session && (
              <span className="text-[11px] text-gray-400 hidden sm:block">
                {new Date(session.last_message_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={copied
                ? { background: "#f0fdf4", color: "#16a34a", borderColor: "#86efac" }
                : { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
            >
              {copied ? (
                <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Copied!</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Copy link</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-16">This conversation has no messages to display.</p>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id ?? i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

            {/* Avatar */}
            {msg.role === "agent"
              ? <div className="shrink-0 mt-0.5"><PozLogo size={28} /></div>
              : <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5">U</div>
            }

            {/* Bubble + result block */}
            <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end max-w-[78%]" : "items-start w-full max-w-[88%]"}`}>
              <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm w-full"
              }`}>
                {msg.text}

                {/* Inline result data */}
                {msg.role === "agent" && msg.resultData && (
                  <ResultBlock msg={msg} />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="pt-10 pb-4 flex items-center justify-center gap-2.5 text-[11px] text-gray-300">
          <PozLogo size={18} />
          <span>Shared via <strong className="text-gray-400">POZ Social</strong> · AI Content Platform</span>
        </div>
      </div>
    </div>
  );
}
