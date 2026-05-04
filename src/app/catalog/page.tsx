"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { AGENTS } from "@/lib/agents/constants";
import SKILL_ARCH from "@/lib/agents/skill-architectures";
import { SkillArchitectureView } from "@/components/agents/SkillArchitectureView";
import WeeklyCalendarSkill from "@/components/agents/skills/WeeklyCalendarSkill";
import { cn } from "@/lib/utils";

// ─── Agent colour tokens ───────────────────────────────────────────────────────
type AgentColor = "blue" | "purple" | "emerald";

const THEME: Record<AgentColor, { grad: string; pill: string; activePill: string; hover: string; label: string }> = {
  blue: {
    grad:       "from-blue-500 to-blue-700",
    pill:       "text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50",
    activePill: "bg-blue-600 text-white border-blue-600",
    hover:      "hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/20",
    label:      "text-blue-600 dark:text-blue-400",
  },
  purple: {
    grad:       "from-purple-500 to-purple-700",
    pill:       "text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50",
    activePill: "bg-purple-600 text-white border-purple-600",
    hover:      "hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-950/20",
    label:      "text-purple-600 dark:text-purple-400",
  },
  emerald: {
    grad:       "from-emerald-500 to-emerald-700",
    pill:       "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50",
    activePill: "bg-emerald-600 text-white border-emerald-600",
    hover:      "hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
    label:      "text-emerald-600 dark:text-emerald-400",
  },
};

// ─── Inline SVG icons per agent ────────────────────────────────────────────────
const AGENT_ICON: Record<string, React.ReactNode> = {
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
    </svg>
  ),
  lightbulb: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/><path d="M10 22h4"/>
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AgentCatalogPage() {
  const { currentUser } = useUser();
  const [showPicker, setShowPicker]   = useState(false);
  const [pickerTab, setPickerTab]     = useState("all");
  const [activeSkill, setActiveSkill] = useState<{ agentId: string; skillId: string } | null>(null);
  const [skillView, setSkillView]     = useState<"arch" | "generate">("arch");

  const userName  = currentUser?.name ?? "";
  const firstName = userName.split(" ")[0] || "there";

  const openSkill = (agentId: string, skillId: string) => {
    setActiveSkill({ agentId, skillId });
    setSkillView("arch");
    setShowPicker(false);
  };

  const activeAgent     = activeSkill ? AGENTS.find((a) => a.id === activeSkill.agentId) : null;
  const activeSkillMeta = activeAgent?.skills.find((s) => s.id === activeSkill?.skillId);
  const activeArch      = activeSkill ? SKILL_ARCH[activeSkill.skillId] : null;

  // ── Skill architecture view ──────────────────────────────────────────────────
  if (activeSkill && activeAgent && activeSkillMeta && activeArch) {
    const t = THEME[activeAgent.color as AgentColor];
    const hasGenerate = activeSkill.skillId === "content-calendar";
    return (
      <div className="flex flex-col flex-1 min-h-0">

        {/* Sticky breadcrumb */}
        <div className="shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-2 px-6 py-3 flex-wrap">
            <button
              onClick={() => setActiveSkill(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Agent Hub
            </button>
            <span className="text-muted-foreground/40">/</span>

            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-muted", t.label)}>
              {AGENT_ICON[activeAgent.icon]}
              {activeAgent.shortName}
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium">{activeSkillMeta.name}</span>

            {/* Architecture / Generate toggle */}
            {hasGenerate && (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 ml-2">
                <button
                  onClick={() => setSkillView("arch")}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                    skillView === "arch"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Architecture
                </button>
                <button
                  onClick={() => setSkillView("generate")}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                    skillView === "generate"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Generate
                </button>
              </div>
            )}

            {/* Skill pills */}
            <div className="ml-auto flex items-center gap-1 overflow-x-auto">
              {activeAgent.skills.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSkill({ agentId: activeAgent.id, skillId: s.id })}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    s.id === activeSkill.skillId
                      ? t.activePill
                      : "text-muted-foreground border-transparent hover:bg-accent"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skill content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {hasGenerate && skillView === "generate" ? (
              <WeeklyCalendarSkill />
            ) : (
              <SkillArchitectureView
                key={activeSkill.skillId}
                arch={activeArch}
                agentColor={activeAgent.color as AgentColor}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Welcome / landing view ───────────────────────────────────────────────────
  return (
    // flex-1 fills parent height; overflow-auto lets it scroll if content is tall
    <div className="flex-1 min-h-0 overflow-auto flex flex-col items-center justify-center px-4 py-12 relative">

      {/* ── POZ star icon ─── */}
      <div className="relative mb-6 shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2"  x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93"  y1="4.93"  x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2"  y1="12" x2="6"  y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93"  y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76"  x2="19.07" y2="4.93"/>
          </svg>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-orange-400 to-pink-600 opacity-25 blur-xl -z-10 scale-150" />
      </div>

      {/* ── Greeting ─── */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
        Hey there,{" "}
        <span className="bg-linear-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent">
          {userName || firstName}
        </span>
      </h1>
      <p className="text-muted-foreground mt-3 text-base text-center max-w-sm">
        What would you like to create today?
      </p>

      {/* ── Chat input ─── */}
      <div className="w-full max-w-2xl mt-8 relative">
        {/* Input box */}
        <div className={cn(
          "border-2 rounded-2xl bg-card shadow-sm transition-colors",
          showPicker ? "border-primary/60" : "border-border hover:border-muted-foreground/40"
        )}>
          <textarea
            placeholder="How can I help you today?"
            rows={3}
            className="w-full px-5 pt-5 pb-14 text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-muted-foreground/60"
          />
          {/* Bottom toolbar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-border/30">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className={cn(
                "flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-semibold transition-colors",
                showPicker
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border hover:bg-accent hover:text-foreground"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
              Skills
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/50 font-medium hidden sm:block">POZ Agents</span>
              <button
                className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-70 transition-opacity"
                title="Send"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Skill picker popup ─── */}
        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full mb-3 left-0 right-0 bg-card border-2 border-border rounded-2xl shadow-2xl z-40 overflow-hidden">

              {/* Tabs */}
              <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b overflow-x-auto">
                <button
                  onClick={() => setPickerTab("all")}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    pickerTab === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
                  )}
                >All Skills</button>
                {AGENTS.map((a) => {
                  const t = THEME[a.color as AgentColor];
                  return (
                    <button
                      key={a.id}
                      onClick={() => setPickerTab(a.id)}
                      className={cn(
                        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                        pickerTab === a.id ? t.activePill : cn("border-transparent", t.pill)
                      )}
                    >
                      {AGENT_ICON[a.icon]}{a.shortName}
                    </button>
                  );
                })}
              </div>

              {/* Skills grid */}
              <div className="p-3 max-h-72 overflow-y-auto space-y-4">
                {(pickerTab === "all" ? AGENTS : AGENTS.filter((a) => a.id === pickerTab)).map((a) => {
                  const t = THEME[a.color as AgentColor];
                  return (
                    <div key={a.id}>
                      {pickerTab === "all" && (
                        <div className={cn("flex items-center gap-1.5 text-xs font-bold mb-2 px-1", t.label)}>
                          {AGENT_ICON[a.icon]}{a.shortName} — {a.name}
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {a.skills.map((sk) => (
                          <button
                            key={sk.id}
                            onClick={() => openSkill(a.id, sk.id)}
                            className={cn("text-left px-3 py-2.5 rounded-xl border transition-all", t.hover)}
                          >
                            <span className="font-semibold text-xs block leading-tight mb-1">{sk.name}</span>
                            <span className="text-xs text-muted-foreground line-clamp-2 leading-snug">{sk.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Quick chips ─── */}
      <div className="flex flex-wrap gap-2 mt-5 justify-center max-w-2xl">
        {AGENTS.map((a) => {
          const t = THEME[a.color as AgentColor];
          return (
            <button
              key={a.id}
              onClick={() => openSkill(a.id, a.skills[0].id)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:shadow-sm", t.pill)}
            >
              {AGENT_ICON[a.icon]}
              {a.shortName} — {a.name.split("&")[0].split("/")[0].trim()}
            </button>
          );
        })}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed text-sm font-medium text-muted-foreground hover:bg-accent hover:border-solid transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3"  y="3"  rx="1"/>
            <rect width="7" height="7" x="14" y="3"  rx="1"/>
            <rect width="7" height="7" x="14" y="14" rx="1"/>
            <rect width="7" height="7" x="3"  y="14" rx="1"/>
          </svg>
          All 18 Skills
        </button>
      </div>

      {/* ── Agent cards ─── */}
      <div className="w-full max-w-2xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AGENTS.map((a) => {
          const t = THEME[a.color as AgentColor];
          return (
            <button
              key={a.id}
              onClick={() => openSkill(a.id, a.skills[0].id)}
              className="group text-left p-4 rounded-2xl border bg-card hover:shadow-md transition-all"
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-linear-to-br mb-3 shadow-sm text-white", t.grad)}>
                {AGENT_ICON[a.icon]}
              </div>
              <p className={cn("text-xs font-bold mb-1", t.label)}>{a.shortName}</p>
              <p className="text-sm font-semibold leading-snug line-clamp-2">{a.name}</p>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">{a.description}</p>
              <p className={cn("mt-3 text-xs font-semibold flex items-center gap-1 group-hover:underline", t.label)}>
                {a.skills.length} skills
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground/40 mt-8 text-center shrink-0">
        {AGENTS.length} agents · {AGENTS.reduce((n, a) => n + a.skills.length, 0)} skills
      </p>
    </div>
  );
}
