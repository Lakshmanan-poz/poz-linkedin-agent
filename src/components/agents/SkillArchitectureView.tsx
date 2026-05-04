"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SkillArchitecture, Runtime } from "@/lib/agents/skill-architectures";

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IFile()    { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>; }
function IFolder()  { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>; }
function IServer()  { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>; }
function ISend()    { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>; }
function IPlug()    { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>; }
function ILayers()  { return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>; }
function ICopy()    { return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>; }
function ICheck()   { return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>; }

/* ── Theme config ──────────────────────────────────────────────────────────── */
const AGENT_C = {
  blue:    { border: "border-blue-200 dark:border-blue-800",    hdr: "bg-blue-50 dark:bg-blue-950/30",    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",    dot: "bg-blue-500",   text: "text-blue-600 dark:text-blue-400"    },
  purple:  { border: "border-purple-200 dark:border-purple-800",hdr: "bg-purple-50 dark:bg-purple-950/30",badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",dot: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
  emerald: { border: "border-emerald-200 dark:border-emerald-800",hdr: "bg-emerald-50 dark:bg-emerald-950/30",badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",dot: "bg-emerald-500",text: "text-emerald-600 dark:text-emerald-400"},
};

const RUNTIME_C: Record<Runtime, { label: string; cls: string }> = {
  browser: { label: "Browser", cls: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  python:  { label: "Python",  cls: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" },
  node:    { label: "Node.js", cls: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
};

/* ── SKILL.md syntax highlighting ─────────────────────────────────────────── */
function SkillMdViewer({ content, skillName, description }: {
  content: string;
  skillName: string;
  description: string;
}) {
  const [copied, setCopied] = useState(false);

  const fullContent = `---\nname: ${skillName}\ndescription: ${description}\n---\n\n${content}`;

  function copy() {
    navigator.clipboard.writeText(fullContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const lines = fullContent.split("\n");
  let inFrontmatter = false;
  let frontmatterDone = false;
  let fmCount = 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden font-mono text-xs">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <span className="text-muted-foreground ml-1 text-[11px]">SKILL.md</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <ICheck /> : <ICopy />}
          <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-auto max-h-[360px] bg-muted/20">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              // Track frontmatter state
              if (line === "---") {
                if (!frontmatterDone) {
                  fmCount++;
                  inFrontmatter = fmCount === 1;
                  if (fmCount === 2) { inFrontmatter = false; frontmatterDone = true; }
                }
              }

              let cls = "text-foreground";
              let lineInFm = frontmatterDone ? i < 4 : inFrontmatter || line === "---";

              if (line === "---")                          cls = "text-orange-500 dark:text-orange-400 font-semibold";
              else if (lineInFm && line.includes(":"))     cls = "text-blue-600 dark:text-blue-400";
              else if (/^#{1,3} /.test(line))              cls = "text-foreground font-bold";
              else if (/^## /.test(line))                  cls = "text-foreground font-semibold";
              else if (/^- \[/.test(line))                 cls = "text-emerald-600 dark:text-emerald-400";
              else if (/^\d+\. /.test(line))               cls = "text-purple-600 dark:text-purple-400";
              else if (/^\|/.test(line))                   cls = "text-muted-foreground";
              else if (/^```/.test(line))                  cls = "text-orange-500 dark:text-orange-400";
              else if (line.startsWith("Use "))            cls = "text-green-600 dark:text-green-400";

              return (
                <tr key={i} className="hover:bg-muted/40 transition-colors">
                  <td className="select-none text-right pr-4 pl-4 text-muted-foreground/40 text-[10px] w-8 py-0.5 align-top">
                    {i + 1}
                  </td>
                  <td className={cn("pr-6 py-0.5 whitespace-pre leading-relaxed", cls)}>
                    {line || "\u00A0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── File system tree ──────────────────────────────────────────────────────── */
function FileSystemTree({ files }: { files: SkillArchitecture["fileSystem"] }) {
  const l2Color = "text-blue-600 dark:text-blue-400";
  const l3Color = "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/60 border-b border-border flex items-center gap-2">
        <IFolder />
        <span className="text-xs font-mono text-muted-foreground">skill-directory/</span>
      </div>
      <div className="divide-y divide-border/40">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
            <span className={f.type === "folder" ? "text-yellow-500" : "text-muted-foreground"}>
              {f.type === "folder" ? <IFolder /> : <IFile />}
            </span>
            <span className={cn("text-xs font-mono flex-1", f.level === 2 ? l2Color : l3Color)}>
              {f.name}
            </span>
            {f.description && (
              <span className="text-[10px] text-muted-foreground/50 hidden sm:block">{f.description}</span>
            )}
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              f.level === 2
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                : "bg-muted text-muted-foreground"
            )}>
              L{f.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
type Props = {
  arch: SkillArchitecture;
  agentColor: "blue" | "purple" | "emerald";
};

export function SkillArchitectureView({ arch, agentColor }: Props) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const c = AGENT_C[agentColor];

  async function handleRun() {
    if (!prompt.trim()) return;
    setRunning(true);
    await new Promise((r) => setTimeout(r, 600));
    setResponse(
      `Skill \`${arch.name}\` triggered.\n\nReading SKILL.md… ✓\nLoading Level 2 instructions… ✓\n\nReady to execute with: "${prompt}"\n\nConnect MCP servers to run this skill in a live agent environment.`
    );
    setRunning(false);
  }

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-muted-foreground">/{arch.name}</span>
          <span className="text-muted-foreground/30">·</span>
          {arch.runtime.map((r) => (
            <span key={r} className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", RUNTIME_C[r].cls)}>
              {RUNTIME_C[r].label}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {arch.description}
        </p>
      </div>

      {/* ── SKILL.md viewer ────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          SKILL.md — Level 2 Instructions
        </h3>
        <SkillMdViewer
          content={arch.skillMd}
          skillName={arch.name}
          description={arch.description}
        />
      </section>

      {/* ── Agent Configuration + VM ────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Agent Configuration + Virtual Machine
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* LEFT: Agent Configuration */}
          <div className={cn("rounded-2xl border-2 overflow-hidden", c.border)}>
            <div className={cn("px-5 py-3 border-b", c.border, c.hdr)}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Agent Configuration
              </p>
            </div>
            <div className="p-5 space-y-5">

              {/* Context */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Connection / context
                </p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                  <span className="text-muted-foreground shrink-0"><IPlug /></span>
                  <span className="text-xs leading-snug">{arch.contextNote}</span>
                </div>
              </div>

              {/* Equipped Skills */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Equipped Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {arch.equippedSkills.map((s) => (
                    <span key={s} className={cn("text-xs font-mono px-2.5 py-1 rounded-md border", c.badge)}>
                      /{s}
                    </span>
                  ))}
                </div>
              </div>

              {/* MCP Servers */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Equipped MCP servers
                </p>
                <div className="space-y-1.5">
                  {arch.mcpServers.map((srv, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 border border-border">
                      <span className="text-muted-foreground"><IServer /></span>
                      <span className="text-xs font-medium flex-1">{srv}</span>
                      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Agent VM */}
          <div className="rounded-2xl border-2 border-border overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Agent Virtual Machine
              </p>
            </div>
            <div className="p-5 space-y-5">

              {/* Runtime */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Runtime environment
                </p>
                <div className="flex flex-wrap gap-2">
                  {arch.runtime.map((r) => (
                    <span key={r} className={cn("text-xs font-bold px-3 py-1 rounded-md border", RUNTIME_C[r].cls)}>
                      {RUNTIME_C[r].label}
                    </span>
                  ))}
                </div>
              </div>

              {/* File System */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  File system
                </p>
                <FileSystemTree files={arch.fileSystem} />
              </div>

              {/* Bash invocation */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  How Claude loads this skill
                </p>
                <div className="rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 space-y-1">
                  {[
                    `$ bash: read ${arch.name}/SKILL.md`,
                    `→ Level 2 instructions loaded into context`,
                    `$ bash: read ${arch.name}/${arch.fileSystem.find(f => f.level === 3 && f.type === "file")?.name ?? "reference.md"}`,
                    `→ Level 3 resource loaded on demand`,
                  ].map((line, i) => (
                    <p key={i} className={cn(
                      "text-[11px] font-mono leading-relaxed",
                      line.startsWith("$") ? "text-green-400" : "text-zinc-400"
                    )}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skill chat input ─────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Invoke Skill
        </h3>
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
          {response && (
            <div className="px-5 py-4 border-b bg-muted/20">
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/80">
                {response}
              </pre>
            </div>
          )}
          <div className="flex items-end gap-3 p-4">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground/50 font-mono mb-1.5">
                /{arch.name} · {arch.argumentHint}
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRun(); } }}
                placeholder={`Use /${arch.name}…`}
                rows={2}
                className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed
                           placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              onClick={handleRun}
              disabled={!prompt.trim() || running}
              className={cn(
                "w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all mb-1",
                prompt.trim() && !running
                  ? "bg-foreground text-background hover:opacity-75"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ISend />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
