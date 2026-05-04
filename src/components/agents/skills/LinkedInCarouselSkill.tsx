"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type HatScores = { cSuite: number; algorithm: number; specialist: number };
type Slide = {
  position: number;
  type: string;
  title: string;
  body: string;
  wordCount: number;
  hatScores: HatScores;
  qualityNote: string;
};
type VisualizationIdea = {
  position: number;
  background: string;
  typography: string;
  layout: string;
  colorScheme: string;
  designNote: string;
};
type CarouselOutput = {
  topic: string;
  angle: string;
  overallScore: number;
  slides: Slide[];
  caption: string;
  hashtags: string[];
  visualizationIdeas: VisualizationIdea[];
};

/* ── Slide position config ──────────────────────────────────────────────────── */
const SLIDE_CONFIG: Record<number, { label: string; color: string; bg: string; border: string; badge: string; accent: string }> = {
  1: { label: "Hook",         color: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-50 dark:bg-blue-950/30",     border: "border-blue-300 dark:border-blue-700",   badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",   accent: "bg-blue-600" },
  2: { label: "Mental Model", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-700", badge: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300", accent: "bg-violet-600" },
  3: { label: "Core Shift",   color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-300 dark:border-orange-700", badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300", accent: "bg-orange-500" },
  4: { label: "Save Anchor",  color: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-50 dark:bg-emerald-950/30",border: "border-emerald-300 dark:border-emerald-700",badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",accent: "bg-emerald-600" },
  5: { label: "Depth / Proof",color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-300 dark:border-indigo-700", badge: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", accent: "bg-indigo-600" },
  6: { label: "The Contrast", color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-300 dark:border-rose-700",   badge: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",   accent: "bg-rose-500" },
  7: { label: "The Principle",color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-300 dark:border-amber-700", badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300", accent: "bg-amber-500" },
  8: { label: "CTA",          color: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-50 dark:bg-slate-900/40",   border: "border-slate-300 dark:border-slate-600", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",   accent: "bg-slate-500" },
};

const ANGLES = [
  "State Change — [Current broken reality]. That just changed.",
  "Not X — It IS Y — draw the precise distinction most people miss",
  "Hidden Specificity — everyone says X; the reality is far more specific",
  "Before / After — old world vs new world with named mechanisms",
  "The Assumption Kill — what your audience believes vs what is actually true",
  "Insider Signal — something practitioners know that the market hasn't priced in",
];

const inputCls = "w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── Score badge ─────────────────────────────────────────────────────────────── */
function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 9 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : score >= 7 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return (
    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", color)}>
      {label} {score}/10
    </span>
  );
}

/* ── Overall score ring ─────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 9.5 ? "text-emerald-600 dark:text-emerald-400"
    : score >= 8.5 ? "text-blue-600 dark:text-blue-400"
    : score >= 7 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";
  const label = score >= 9.5 ? "Ready to publish"
    : score >= 8.5 ? "Strong — minor fixes"
    : score >= 7 ? "Good foundation"
    : "Needs revision";
  return (
    <div className="flex items-center gap-3">
      <div className={cn("text-4xl font-black tabular-nums", color)}>{score.toFixed(1)}</div>
      <div>
        <p className={cn("text-sm font-bold", color)}>{label}</p>
        <p className="text-xs text-muted-foreground">Overall quality score</p>
      </div>
    </div>
  );
}

/* ── Slide card ─────────────────────────────────────────────────────────────── */
function SlideCard({ slide, showViz, viz }: { slide: Slide; showViz: boolean; viz?: VisualizationIdea }) {
  const cfg = SLIDE_CONFIG[slide.position] ?? SLIDE_CONFIG[1];
  const overLimit = slide.wordCount > 25;
  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all", cfg.border, cfg.bg)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-black tracking-widest uppercase", cfg.color)}>
            {String(slide.position).padStart(2, "0")}
          </span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.badge)}>
            {cfg.label}
          </span>
        </div>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded",
          overLimit ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
        )}>
          {slide.wordCount}w {overLimit ? "⚠ over 25" : ""}
        </span>
      </div>

      {/* Title */}
      <p className={cn("text-base font-black leading-tight", cfg.color)}>{slide.title}</p>

      {/* Body */}
      <p className="text-sm text-foreground/80 leading-relaxed">{slide.body}</p>

      {/* Quality note */}
      {slide.qualityNote && (
        <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-2">{slide.qualityNote}</p>
      )}

      {/* Hat scores */}
      <div className="flex flex-wrap gap-1 pt-1">
        <ScoreBadge score={slide.hatScores.cSuite}    label="C-Suite" />
        <ScoreBadge score={slide.hatScores.algorithm} label="Algo" />
        <ScoreBadge score={slide.hatScores.specialist} label="Specialist" />
      </div>

      {/* Visualization idea */}
      {showViz && viz && (
        <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Design Direction</p>
          <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/70">BG:</span> {viz.background}</p>
          <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/70">Type:</span> {viz.typography}</p>
          <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/70">Layout:</span> {viz.layout}</p>
          <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/70">Colour:</span> {viz.colorScheme}</p>
          <p className="text-[11px] text-foreground/70 font-medium italic">{viz.designNote}</p>
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function LinkedInCarouselSkill() {
  const { currentUser } = useUser();

  const [topic,            setTopic]            = useState("");
  const [angle,            setAngle]            = useState(ANGLES[0]);
  const [company,          setCompany]          = useState("");
  const [industry,         setIndustry]         = useState("");
  const [audience,         setAudience]         = useState("");
  const [brandVoice,       setBrandVoice]       = useState("Senior strategist — confident, calm, direct");
  const [referenceContent, setReferenceContent] = useState("");
  const [showReference,    setShowReference]    = useState(false);

  const [generating,   setGenerating]   = useState(false);
  const [output,       setOutput]       = useState<CarouselOutput | null>(null);
  const [showViz,      setShowViz]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  async function generate() {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    setGenerating(true); setSaved(false); setOutput(null);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "linkedin-carousel",
          inputs: { topic, angle, company, industry, audience, brandVoice, referenceContent: referenceContent.trim() || undefined },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      setOutput(await res.json() as CarouselOutput);
      toast.success("8-slide carousel generated!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    setGenerating(false);
  }

  async function saveToDb() {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id:     "content-authority",
          skill_id:     "linkedin-carousel",
          title:        `Carousel — ${output.topic}`,
          input_params: JSON.stringify({ topic, angle, company, industry, audience, brandVoice }),
          output_json:  JSON.stringify(output),
          created_by:   currentUser.id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      toast.success("Carousel saved to database!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  }

  async function submitForReview() {
    if (!output || !currentUser) return;
    setSubmitting(true);
    try {
      // 1 — Create post as draft
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Carousel — ${output.topic}`,
          content: output.caption + "\n\n" + output.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
          post_type: "carousel",
          author_id: currentUser.id,
          carousel_slides: JSON.stringify(output.slides),
          hashtags: output.hashtags.join(", "),
          ai_model: "linkedin-carousel",
          ai_prompt: topic,
        }),
      });
      if (!postRes.ok) throw new Error("Failed to create post");
      const post = await postRes.json();

      // 2 — Transition to submitted (notifies all reviewers automatically)
      const statusRes = await fetch(`/api/posts/${post.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted", changed_by: currentUser.id }),
      });
      if (!statusRes.ok) throw new Error("Failed to submit for review");

      setSubmitted(true);
      toast.success("Content sent to admin review queue!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Submission failed"); }
    setSubmitting(false);
  }

  async function copyCaption() {
    if (!output) return;
    const full = `${output.caption}\n\n${output.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    toast.success("Caption copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">

      {/* ── Header badge ───────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
            <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-sm">LinkedIn Carousel Generator</h2>
          <p className="text-xs text-muted-foreground">8 slides · Three-hat scoring · Visualization brief · Full caption</p>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-bold">Carousel Brief</h3>

        <Field label="Topic / Core Insight" required hint="The central idea or claim the carousel will prove">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. OpenAI GPT-5 changes the cyber threat landscape permanently"
            className={inputCls}
          />
        </Field>

        <Field label="Carousel Angle / Hook Type" hint="Choose the framing that creates the strongest knowledge gap">
          <select value={angle} onChange={(e) => setAngle(e.target.value)} className={inputCls}>
            {ANGLES.map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand / Company">
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Point One Zero" className={inputCls} />
          </Field>
          <Field label="Industry">
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. B2B Technology / AI Consulting" className={inputCls} />
          </Field>
          <Field label="Target Audience">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. CIOs, CTOs, CPOs" className={inputCls} />
          </Field>
          <Field label="Brand Voice">
            <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} className={inputCls}>
              <option>Senior strategist — confident, calm, direct</option>
              <option>Professional and authoritative</option>
              <option>Bold and provocative</option>
              <option>Educational and informative</option>
              <option>Conversational and approachable</option>
            </select>
          </Field>
        </div>

        {/* Reference content toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowReference(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {showReference ? <path d="m18 15-6-6-6 6"/> : <path d="m6 9 6 6 6-6"/>}
            </svg>
            {showReference ? "Hide" : "Add"} reference post or content (optional)
          </button>
          {showReference && (
            <textarea
              value={referenceContent}
              onChange={(e) => setReferenceContent(e.target.value)}
              rows={4}
              placeholder="Paste a LinkedIn post, article excerpt, or any content to use as a style/framing reference…"
              className={cn(inputCls, "mt-2 resize-none")}
            />
          )}
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
            generating ? "bg-muted text-muted-foreground cursor-not-allowed"
                       : "bg-linear-to-r from-blue-600 to-violet-600 text-white hover:opacity-90"
          )}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating 8 slides…
            </span>
          ) : "Generate LinkedIn Carousel"}
        </button>
      </div>

      {/* ── Output ─────────────────────────────────────────────── */}
      {output && (
        <div className="space-y-5">

          {/* Score + actions bar */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center justify-between gap-4">
            <ScoreRing score={output.overallScore} />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowViz(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                {showViz ? "Hide" : "Show"} design brief
              </button>
              <button
                onClick={saveToDb}
                disabled={saving || saved}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  saved  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                         : saving ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                         : "bg-primary text-primary-foreground border-primary hover:opacity-90"
                )}
              >
                {saved ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Saved</>
                ) : saving ? "Saving…" : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save</>
                )}
              </button>
              <button
                onClick={submitForReview}
                disabled={submitting || submitted}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  submitted ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            : submitting ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                            : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                )}
              >
                {submitted ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Sent to Review</>
                ) : submitting ? "Sending…" : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>Send to Review</>
                )}
              </button>
            </div>
          </div>

          {/* Topic + angle */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topic:</span>
            <span className="text-sm font-semibold">{output.topic}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{output.angle}</span>
          </div>

          {/* Slides grid — 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {output.slides?.map((slide) => (
              <SlideCard
                key={slide.position}
                slide={slide}
                showViz={showViz}
                viz={output.visualizationIdeas?.find(v => v.position === slide.position)}
              />
            ))}
          </div>

          {/* Caption */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Caption</p>
              <button
                onClick={copyCaption}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Copied!</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>Copy caption</>
                )}
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{output.caption}</p>
            {output.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                {output.hashtags.map((h) => (
                  <span key={h} className="text-xs px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono bg-blue-50 dark:bg-blue-950/30">
                    {h.startsWith("#") ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
