"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* ── Types ──────────────────────────────────────────────────────────────────── */
type SlideItem   = { position: number; type: string; title: string; body: string };
type ResultData  = {
  day?: string; contentType?: string; topic?: string;
  slides?: SlideItem[]; caption?: string; hashtags?: string[];
  bodyPost?: string;
  weekOf?: string; company?: string; days?: unknown[];
  overallScore?: number; refined?: { slides?: SlideItem[]; caption?: string; hashtags?: string[] };
};
type TrendItem   = { topic: string; day: string; type: string; handle?: string; authority?: string; whatTheySaid?: string };
type ChatMessage = {
  id: string; role: "user" | "agent"; text: string;
  resultType?: string; resultData?: ResultData;
  trendList?: TrendItem[];
  trendSources?: { handle: string; authority?: string }[];
};
type SharedChat  = { title: string; messages: ChatMessage[]; created_at: string; last_message_at: string };

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function PozStar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2"  x2="12" y2="6"/>  <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="6"  y2="12"/>  <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="4.93"  x2="7.76"  y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="4.93"  y1="19.07" x2="7.76"  y2="16.24"/>
        <line x1="16.24" y1="7.76"  x2="19.07" y2="4.93"/>
      </svg>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/* ── Result card (read-only) ────────────────────────────────────────────────── */
function SharedResultCard({ resultType, data }: { resultType: string; data: ResultData }) {
  if (resultType === "daily-content") {
    return (
      <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {data.day} · {data.contentType}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{data.topic}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
            {data.slides?.length ? `${data.slides.length} slides` : "Single post"}
          </span>
        </div>

        {data.bodyPost && (
          <div className="px-5 py-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{data.bodyPost}</p>
          </div>
        )}

        {data.slides && data.slides.length > 0 && (
          <div className="px-5 py-4 space-y-3">
            {data.slides.map((s) => (
              <div key={s.position} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s.position}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{s.type}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                {s.body && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.body}</p>}
              </div>
            ))}
          </div>
        )}

        {(data.caption || (data.hashtags && data.hashtags.length > 0)) && (
          <div className="px-5 py-3 border-t border-border bg-muted/20 space-y-2">
            {data.caption && <p className="text-xs text-foreground leading-relaxed">{data.caption}</p>}
            {data.hashtags && data.hashtags.length > 0 && (
              <p className="text-xs text-primary font-medium">{data.hashtags.map(h => `#${h}`).join(" ")}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (resultType === "weekly-calendar") {
    return (
      <div className="mt-3 rounded-2xl border border-border bg-card px-5 py-4">
        <p className="text-sm font-semibold text-foreground mb-1">
          Weekly Content Calendar
          {data.weekOf && <span className="text-muted-foreground font-normal ml-2 text-xs">w/c {data.weekOf}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{data.company}</p>
        {Array.isArray(data.days) && <p className="text-xs text-muted-foreground mt-2">{data.days.length} days planned</p>}
      </div>
    );
  }

  if (resultType === "content-refiner") {
    return (
      <div className="mt-3 rounded-2xl border border-border bg-card px-5 py-4 flex items-center gap-3">
        <span className="text-2xl font-bold text-foreground">{data.overallScore ?? "—"}</span>
        <span className="text-xs text-muted-foreground">/10 overall score</span>
      </div>
    );
  }

  return null;
}

/* ── Page ───────────────────────────────────────────────────────────────────── */
export default function SharePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [chat,    setChat]    = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    // sessionId here is actually the share_token (UUID) generated by the share API
    fetch(`/api/agents/chat-history/share?token=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setChat(d as SharedChat);
      })
      .catch(() => setError("Failed to load shared chat"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading shared chat…</p>
        </div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-muted-foreground">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Chat not found</h1>
          <p className="text-sm text-muted-foreground">This shared link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PozStar />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{chat.title}</p>
              <p className="text-[10px] text-muted-foreground">{fmtDate(chat.last_message_at)}</p>
            </div>
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Copy link
              </>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {chat.messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[78%] px-4 py-3 rounded-[20px] rounded-tr-[6px] bg-primary text-primary-foreground text-[15px] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-4">
                <PozStar />
                <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                  {msg.text && (
                    <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {msg.trendSources && msg.trendSources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 rounded-xl bg-muted/40 border border-border/60 mt-2">
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

                  {msg.trendList && msg.trendList.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {msg.trendList.map((t, i) => {
                        const initial = t.handle ? t.handle.replace("@", "").charAt(0).toUpperCase() : String(i + 1);
                        return (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card">
                            <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-black text-white mt-0.5 bg-orange-500">
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
                            <div className="flex-1 min-w-0">
                              {t.handle ? (
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="text-sm font-bold text-foreground">{t.handle}</span>
                                  {t.authority && (
                                    <span className="text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5 leading-none">{t.authority}</span>
                                  )}
                                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap shrink-0">{i + 1}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">{t.day} · {t.type}</span>
                                </div>
                              )}
                              {t.whatTheySaid && (
                                <p className="text-[11px] text-muted-foreground leading-snug mb-1.5 line-clamp-2 italic">&ldquo;{t.whatTheySaid}&rdquo;</p>
                              )}
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mt-0.5">Topic →</span>
                                <p className="text-sm font-semibold text-foreground leading-snug">{t.topic}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.resultType && msg.resultData && (
                    <SharedResultCard resultType={msg.resultType} data={msg.resultData} />
                  )}

                  {msg.resultType && !msg.resultData && (
                    <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Content preview not available in this shared view.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Shared from <span className="font-semibold text-foreground">POZ Social</span> · AI Content Platform
          </p>
          <p className="text-[11px] text-muted-foreground">Read-only view</p>
        </div>
      </footer>
    </div>
  );
}
