"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Slide = { position: number; type: string; title: string; body: string };
type DailyOutput = { day: string; contentType: string; topic: string; slides: Slide[]; caption: string; hashtags: string[] };

/* ── Day config ─────────────────────────────────────────────────────────────── */
const DAY_CONFIG: Record<string, { type: string; description: string; colorClass: string; bg: string; border: string; badge: string }> = {
  Monday:    { type: "Thought Leadership", description: "Break down a trend, connect to business outcomes",  colorClass: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-800",    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  Tuesday:   { type: "Engagement Post",    description: "Thought-provoking question for your industry",    colorClass: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  Wednesday: { type: "Tool Spotlight",     description: "Analyse a tool with expert perspective",          colorClass: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  Thursday:  { type: "Industry Insight",   description: "Share a current update or data point",            colorClass: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-50 dark:bg-emerald-950/30",border: "border-emerald-200 dark:border-emerald-800",badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  Friday:    { type: "Forward-Looking",    description: "Share a prediction or lesson learned",            colorClass: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-200 dark:border-rose-800",     badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function getTodayKey(): string {
  const d = new Date().getDay(); // 0=Sun … 6=Sat
  const map: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday" };
  return map[d] ?? "Monday";
}

const inputCls = "w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Slide card ─────────────────────────────────────────────────────────────── */
function SlideCard({ slide, dc }: { slide: Slide; dc: typeof DAY_CONFIG[string] }) {
  const isHook = slide.position === 1;
  const isCta  = slide.position === 6;
  return (
    <div className={cn(
      "rounded-xl border-2 p-4 space-y-2 transition-all",
      isHook ? `${dc.border} ${dc.bg}` : "border-border bg-card"
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
          {String(slide.position).padStart(2, "0")} · {slide.type}
        </span>
        {isHook && <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", dc.badge)}>Hook</span>}
        {isCta  && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">CTA</span>}
      </div>
      <p className={cn("text-base font-bold leading-tight", isHook ? dc.colorClass : "")}>{slide.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{slide.body}</p>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function DailyContentSkill() {
  const { currentUser } = useUser();

  const [selectedDay, setSelectedDay] = useState(getTodayKey);
  const [topic,       setTopic]       = useState("");
  const [company,     setCompany]     = useState("");
  const [industry,    setIndustry]    = useState("");
  const [audience,    setAudience]    = useState("");
  const [brandVoice,  setBrandVoice]  = useState("Professional and authoritative");

  const [generating,   setGenerating]   = useState(false);
  const [output,       setOutput]       = useState<DailyOutput | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  const dc = DAY_CONFIG[selectedDay] ?? DAY_CONFIG["Monday"];

  async function generate() {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    setGenerating(true); setSaved(false); setOutput(null);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "daily-post",
          inputs: { day: selectedDay, contentType: dc.type, topic, company, industry, audience, brandVoice },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      setOutput(await res.json() as DailyOutput);
      toast.success("Post generated!");
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
          skill_id:     "daily-post",
          title:        `${selectedDay} — ${dc.type} — ${output.topic}`,
          input_params: JSON.stringify({ selectedDay, topic, company, industry, audience, brandVoice }),
          output_json:  JSON.stringify(output),
          created_by:   currentUser.id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      toast.success("Post saved to database!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  }

  async function submitForReview() {
    if (!output || !currentUser) return;
    setSubmitting(true);
    try {
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selectedDay} — ${dc.type} — ${output.topic}`,
          content: output.caption + "\n\n" + (output.hashtags ?? []).map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
          post_type: "carousel",
          author_id: currentUser.id,
          carousel_slides: JSON.stringify(output.slides),
          hashtags: (output.hashtags ?? []).join(", "),
          ai_model: "daily-post",
          ai_prompt: topic,
        }),
      });
      if (!postRes.ok) throw new Error("Failed to create post");
      const post = await postRes.json();

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

  return (
    <div className="space-y-6">

      {/* ── Day selector ─────────────────────────────────────── */}
      <div className={cn("rounded-2xl border-2 p-5", dc.border, dc.bg)}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Today's content type</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const cfg = DAY_CONFIG[d];
            const active = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => { setSelectedDay(d); setOutput(null); setSaved(false); }}
                className={cn(
                  "flex flex-col items-start px-3.5 py-2.5 rounded-xl border-2 text-left transition-all text-xs",
                  active ? `${cfg.border} ${cfg.bg} ${cfg.colorClass} font-bold` : "border-border bg-card text-muted-foreground hover:bg-accent"
                )}
              >
                <span className="font-bold">{d}</span>
                <span className={cn("mt-0.5 font-semibold", active ? cfg.colorClass : "text-muted-foreground/70")}>
                  {cfg.type}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{dc.description}</p>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-bold">Generate Your Post</h3>

        <Field label="Topic / Theme" required>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`e.g. ${selectedDay === "Wednesday" ? "Google Stitch vs Figma for UI generation" : selectedDay === "Thursday" ? "AI adoption in enterprise is accelerating" : "The shift from content volume to content authority"}`}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand / Company">
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Point One Zero" className={inputCls} />
          </Field>
          <Field label="Industry">
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. B2B SaaS, AI Consulting" className={inputCls} />
          </Field>
          <Field label="Target Audience">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. CIOs, CTOs, Marketing VPs" className={inputCls} />
          </Field>
          <Field label="Brand Voice">
            <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} className={inputCls}>
              <option>Professional and authoritative</option>
              <option>Conversational and approachable</option>
              <option>Bold and provocative</option>
              <option>Educational and informative</option>
              <option>Inspirational and motivating</option>
            </select>
          </Field>
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
            generating ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating…
            </span>
          ) : `Generate ${selectedDay}'s Post`}
        </button>
      </div>

      {/* ── Output ───────────────────────────────────────────── */}
      {output && (
        <div className="space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className={cn("text-xs font-bold uppercase tracking-widest", dc.colorClass)}>{output.day}</span>
              <h3 className="font-bold text-base mt-0.5">{dc.type} — {output.topic}</h3>
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
                <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save to Database</>
              )}
            </button>
            <button
              onClick={submitForReview}
              disabled={submitting || submitted}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                submitted ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : submitting ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                          : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              )}
            >
              {submitted ? (
                <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Sent to Review</>
              ) : submitting ? "Sending…" : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>Send to Review</>
              )}
            </button>
          </div>

          {/* Slides grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {output.slides?.map((slide) => (
              <SlideCard key={slide.position} slide={slide} dc={dc} />
            ))}
          </div>

          {/* Caption */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Caption</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{output.caption}</p>
            {output.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                {output.hashtags.map((h) => (
                  <span key={h} className={cn("text-xs px-2.5 py-1 rounded-md border font-mono", dc.border, dc.colorClass)}>
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
