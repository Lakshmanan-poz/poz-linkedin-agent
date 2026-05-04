"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type DayEntry = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  type: string;
  contentFocus: string;
  brief: string;
  hook: string;
  hashtags: string[];
};

type CalendarOutput = {
  weekOf: string;
  company: string;
  industry: string;
  summary: string;
  days: DayEntry[];
};

/* ── Day config ─────────────────────────────────────────────────────────────── */
const DAY_CONFIG: Record<string, { type: string; color: string; bg: string; border: string; dot: string }> = {
  Monday:    { type: "Thought Leadership", color: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-800",    dot: "bg-blue-500"    },
  Tuesday:   { type: "Engagement Post",    color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500"  },
  Wednesday: { type: "Tool Spotlight",     color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500"  },
  Thursday:  { type: "Industry Insight",   color: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-50 dark:bg-emerald-950/30",border: "border-emerald-200 dark:border-emerald-800",dot: "bg-emerald-500"},
  Friday:    { type: "Forward-Looking",    color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-200 dark:border-rose-800",     dot: "bg-rose-500"    },
};

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/* ── Form field helper ──────────────────────────────────────────────────────── */
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

const inputCls = "w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50";

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function WeeklyCalendarSkill() {
  const { currentUser } = useUser();

  // Form state
  const [company,    setCompany]    = useState("");
  const [industry,   setIndustry]   = useState("");
  const [audience,   setAudience]   = useState("");
  const [weekOf,     setWeekOf]     = useState(() => {
    // Default to next Monday
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  });
  const [keyTopics,  setKeyTopics]  = useState("");
  const [brandVoice, setBrandVoice] = useState("Professional and authoritative");

  // UI state
  const [generating, setGenerating] = useState(false);
  const [output,     setOutput]     = useState<CalendarOutput | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  /* ── Generate ───────────────────────────────────────────────────────────── */
  async function generate() {
    if (!company.trim() || !industry.trim() || !keyTopics.trim()) {
      toast.error("Please fill in Company, Industry, and Key Topics");
      return;
    }
    setGenerating(true);
    setSaved(false);
    setOutput(null);

    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: "content-calendar",
          inputs: { company, industry, audience, weekOf, keyTopics, brandVoice },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      const data = await res.json();
      setOutput(data as CalendarOutput);
      toast.success("Weekly calendar generated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    }
    setGenerating(false);
  }

  /* ── Save to DB ─────────────────────────────────────────────────────────── */
  async function saveToDb() {
    if (!output || !currentUser) return;
    setSaving(true);
    try {
      const title = `Weekly Calendar — ${output.company} — w/c ${output.weekOf}`;
      const res = await fetch("/api/agents/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id:     "content-authority",
          skill_id:     "content-calendar",
          title,
          input_params: JSON.stringify({ company, industry, audience, weekOf, keyTopics, brandVoice }),
          output_json:  JSON.stringify(output),
          created_by:   currentUser.id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      toast.success("Calendar saved to database!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
    setSaving(false);
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">

      {/* ── Input form ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground">Generate Your Week</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company / Brand" required>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={inputCls}
            />
          </Field>
          <Field label="Industry" required>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. B2B SaaS, Fintech, Marketing"
              className={inputCls}
            />
          </Field>
          <Field label="Target Audience">
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. CTOs, Marketing Managers"
              className={inputCls}
            />
          </Field>
          <Field label="Week Starting (Monday)">
            <input
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Key Topics / Themes for This Week" required>
          <textarea
            value={keyTopics}
            onChange={(e) => setKeyTopics(e.target.value)}
            placeholder="e.g. AI adoption in enterprise sales, ChatGPT vs Gemini comparison, customer success metrics"
            className={cn(inputCls, "min-h-[80px] resize-none")}
          />
        </Field>

        <Field label="Brand Voice / Tone">
          <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} className={inputCls}>
            <option>Professional and authoritative</option>
            <option>Conversational and approachable</option>
            <option>Bold and provocative</option>
            <option>Educational and informative</option>
            <option>Inspirational and motivating</option>
          </select>
        </Field>

        <button
          onClick={generate}
          disabled={generating}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
            generating
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating calendar…
            </span>
          ) : "Generate Weekly Calendar"}
        </button>
      </div>

      {/* ── Output ─────────────────────────────────────────── */}
      {output && (
        <div className="space-y-5">

          {/* Summary header */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-mono">
                  {output.company} · {output.industry} · w/c {output.weekOf}
                </p>
                <h3 className="font-bold mt-0.5">Weekly Content Plan</h3>
              </div>
              <button
                onClick={saveToDb}
                disabled={saving || saved}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                  saved
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : saving
                      ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                      : "bg-primary text-primary-foreground border-primary hover:opacity-90"
                )}
              >
                {saved ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Saved to DB
                  </>
                ) : saving ? "Saving…" : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save to Database
                  </>
                )}
              </button>
            </div>
            {output.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{output.summary}</p>
            )}
          </div>

          {/* Calendar table — desktop */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="text-left px-5 py-3 font-semibold w-28">Day</th>
                  <th className="text-left px-5 py-3 font-semibold w-44">Type</th>
                  <th className="text-left px-5 py-3 font-semibold">Content Focus</th>
                  <th className="text-left px-5 py-3 font-semibold">Hook</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_ORDER.map((day, i) => {
                  const entry = output.days?.find((d) => d.day === day);
                  const dc = DAY_CONFIG[day];
                  return (
                    <tr
                      key={day}
                      className={cn(
                        "border-t border-border cursor-pointer hover:bg-muted/40 transition-colors",
                        i % 2 === 1 ? "bg-muted/20" : ""
                      )}
                      onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                    >
                      <td className="px-5 py-4 font-bold">{day}</td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border", dc.bg, dc.border, dc.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", dc.dot)} />
                          {entry?.type || dc.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">{entry?.contentFocus || "—"}</td>
                      <td className="px-5 py-4 text-xs text-muted-foreground italic max-w-[220px] line-clamp-2">
                        {entry?.hook || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded day detail */}
          {expandedDay && (() => {
            const entry = output.days?.find((d) => d.day === expandedDay);
            const dc = DAY_CONFIG[expandedDay];
            if (!entry) return null;
            return (
              <div className={cn("rounded-2xl border-2 p-5 space-y-4", dc.border, dc.bg)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("font-bold text-lg", dc.color)}>{entry.day}</span>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-md border", dc.border, dc.color)}>
                      {entry.type}
                    </span>
                  </div>
                  <button onClick={() => setExpandedDay(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Content Focus</p>
                    <p className="text-sm font-medium">{entry.contentFocus}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Opening Hook</p>
                    <p className="text-sm italic text-foreground/80 border-l-2 pl-3" style={{ borderColor: "currentColor" }}>
                      "{entry.hook}"
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Content Brief</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{entry.brief}</p>
                  </div>
                  {entry.hashtags?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.hashtags.map((h) => (
                          <span key={h} className={cn("text-xs px-2.5 py-1 rounded-md border font-mono", dc.border, dc.color)}>
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {DAYS_ORDER.map((day) => {
              const entry = output.days?.find((d) => d.day === day);
              const dc = DAY_CONFIG[day];
              return (
                <div key={day} className={cn("rounded-xl border-2 p-4 space-y-2", dc.border, dc.bg)}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{day}</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", dc.border, dc.color)}>
                      {entry?.type || dc.type}
                    </span>
                  </div>
                  <p className="text-sm">{entry?.contentFocus || "—"}</p>
                  {entry?.hook && <p className="text-xs text-muted-foreground italic">"{entry.hook}"</p>}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
