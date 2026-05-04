"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type HatScore = { score: number; verdict: string };
type SlideAudit = {
  slide: number;
  scores: { cSuite: number; algorithm: number; specialist: number };
  verdict: "pass" | "fix" | "fail";
  issue: string;
};
type RefinedSlide = { position: number; type: string; title: string; body: string; status: "Fixed" | "Unchanged"; note: string };
type AuditResult = {
  overallScore: number;
  hatScores: { cSuite: HatScore; algorithm: HatScore; specialist: HatScore };
  slideAudits: SlideAudit[];
  refined: { slides: RefinedSlide[]; caption: string; hashtags: string[] };
  publishReady: boolean;
  finalNote: string;
};

/* ── Score bar ──────────────────────────────────────────────────────────────── */
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-7 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

/* ── Verdict dot ────────────────────────────────────────────────────────────── */
const VERDICT_CONFIG = {
  pass: { dot: "bg-emerald-500", label: "Pass", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  fix:  { dot: "bg-amber-500",   label: "Fix",  text: "text-amber-700 dark:text-amber-300",     bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-amber-200 dark:border-amber-800"   },
  fail: { dot: "bg-red-500",     label: "Fail", text: "text-red-700 dark:text-red-300",         bg: "bg-red-50 dark:bg-red-950/30",         border: "border-red-200 dark:border-red-800"       },
};

const inputCls = "w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/80">{label}</label>
      {children}
    </div>
  );
}

/* ── Refined slide card ─────────────────────────────────────────────────────── */
function RefinedCard({ slide }: { slide: RefinedSlide }) {
  const isFixed = slide.status === "Fixed";
  return (
    <div className={cn(
      "rounded-xl border-2 p-4 space-y-2",
      isFixed ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border bg-card"
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
          {String(slide.position).padStart(2, "0")} · {slide.type}
        </span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          isFixed
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
        )}>
          {slide.status}
        </span>
      </div>
      <p className="text-base font-bold leading-tight">{slide.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{slide.body}</p>
      {slide.note && (
        <p className={cn("text-[11px] pt-1 border-t", isFixed ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "text-muted-foreground border-border/50")}>
          {slide.note}
        </p>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function ContentRefinerSkill() {
  const { currentUser } = useUser();

  const [content,   setContent]   = useState("");
  const [company,   setCompany]   = useState("");
  const [audience,  setAudience]  = useState("B2B C-suite — CIOs, CTOs, CEOs");

  const [auditing,  setAuditing]  = useState(false);
  const [result,    setResult]    = useState<AuditResult | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  async function audit() {
    if (!content.trim()) { toast.error("Paste your content to audit"); return; }
    setAuditing(true); setSaved(false); setResult(null);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "content-refiner",
          inputs: { content, company, audience },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Audit failed");
      setResult(await res.json() as AuditResult);
      toast.success("Audit complete!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Audit failed"); }
    setAuditing(false);
  }

  async function saveToDb() {
    if (!result || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id:     "content-authority",
          skill_id:     "content-refiner",
          title:        `Content Audit — Score ${result.overallScore}/10 — ${company || "Brand"}`,
          input_params: JSON.stringify({ content: content.slice(0, 200), company, audience }),
          output_json:  JSON.stringify(result),
          created_by:   currentUser.id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      toast.success("Audit saved to database!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  }

  /* score colour */
  const scoreColor = (s: number) =>
    s >= 9 ? "bg-emerald-500" : s >= 7 ? "bg-blue-500" : s >= 5 ? "bg-amber-500" : "bg-red-500";

  const overallColor =
    !result ? "" :
    result.overallScore >= 9 ? "text-emerald-600 dark:text-emerald-400" :
    result.overallScore >= 7 ? "text-blue-600 dark:text-blue-400" :
    result.overallScore >= 5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">

      {/* ── Instructions ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste your LinkedIn carousel slides, caption, or post copy below.
          The three-hat audit will score it from a <strong>C-Suite Executive</strong>, the <strong>LinkedIn Algorithm</strong>, and a <strong>Content Specialist</strong> perspective — then rewrite every slide to 10/10 standard.
        </p>
      </div>

      {/* ── Input ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Field label="Your content — paste slides, caption, or post copy">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Slide 1:\nStarting from scratch just ended.\nGoogle Stitch generates structured UI from a description — the blank canvas no longer exists.\n\nSlide 2:\n...`}
            className={cn(inputCls, "min-h-[180px] resize-y font-mono text-xs leading-relaxed")}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand / Company (optional)">
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Point One Zero" className={inputCls} />
          </Field>
          <Field label="Target Audience (optional)">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. CIOs, CTOs, B2B leaders" className={inputCls} />
          </Field>
        </div>

        <button
          onClick={audit}
          disabled={auditing}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
            auditing ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {auditing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Auditing content…
            </span>
          ) : "Audit & Refine to 10/10"}
        </button>
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      {result && (
        <div className="space-y-5">

          {/* Overall score banner */}
          <div className="rounded-2xl border-2 border-border bg-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={cn("text-5xl font-black tabular-nums", overallColor)}>
                  {result.overallScore.toFixed(1)}
                  <span className="text-xl font-semibold text-muted-foreground">/10</span>
                </div>
                <div>
                  <p className={cn("text-sm font-bold", result.publishReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                    {result.publishReady ? "✓ Ready to publish" : "⚠ Needs refinement"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{result.finalNote}</p>
                </div>
              </div>
              <button
                onClick={saveToDb}
                disabled={saving || saved}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                  saved ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : saving ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                        : "bg-primary text-primary-foreground border-primary hover:opacity-90"
                )}
              >
                {saved ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Saved</>
                ) : saving ? "Saving…" : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Audit</>
                )}
              </button>
            </div>
          </div>

          {/* Three hat scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "cSuite",    label: "C-Suite Executive",      icon: "👔" },
              { key: "algorithm", label: "LinkedIn Algorithm",     icon: "📊" },
              { key: "specialist",label: "Content Specialist",     icon: "🎯" },
            ].map(({ key, label, icon }) => {
              const hat = result.hatScores[key as keyof typeof result.hatScores];
              return (
                <div key={key} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="text-xs font-bold">{label}</span>
                  </div>
                  <ScoreBar score={hat.score} color={scoreColor(hat.score)} />
                  <p className="text-xs text-muted-foreground leading-snug">{hat.verdict}</p>
                </div>
              );
            })}
          </div>

          {/* Slide-by-slide verdicts */}
          {result.slideAudits?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Slide verdicts</p>
              <div className="flex flex-wrap gap-2">
                {result.slideAudits.map((sa) => {
                  const vc = VERDICT_CONFIG[sa.verdict] ?? VERDICT_CONFIG.fix;
                  return (
                    <div
                      key={sa.slide}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs", vc.bg, vc.border)}
                      title={sa.issue}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", vc.dot)} />
                      <span className={cn("font-semibold", vc.text)}>Slide {sa.slide}</span>
                      <span className="text-muted-foreground max-w-[120px] truncate">{sa.issue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Refined slides */}
          {result.refined?.slides?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-muted-foreground px-3 py-1 rounded-full border border-border bg-muted">
                  Rewritten to 10/10 Standard
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.refined.slides.map((slide) => (
                  <RefinedCard key={slide.position} slide={slide} />
                ))}
              </div>
            </div>
          )}

          {/* Refined caption + hashtags */}
          {result.refined?.caption && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Caption — post this above the carousel</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.refined.caption}</p>
              {result.refined.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                  {result.refined.hashtags.map((h) => (
                    <span key={h} className="text-xs px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono">
                      {h.startsWith("#") ? h : `#${h}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
