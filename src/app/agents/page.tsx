"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AGENTS } from "@/lib/agents/constants";
import { AgentOutput } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

const AGENT_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
};

const AGENT_ICONS: Record<string, React.ReactNode> = {
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
  ),
  lightbulb: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  ),
};

export default function AgentsHubPage() {
  const [outputCounts, setOutputCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/agents/outputs")
      .then((r) => r.json())
      .then((outputs: AgentOutput[]) => {
        const counts: Record<string, number> = {};
        outputs.forEach((o) => {
          counts[o.agent_id] = (counts[o.agent_id] || 0) + 1;
        });
        setOutputCounts(counts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing Agents</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered agents for content creation, thought leadership, and market intelligence
        </p>
      </div>

      {/* Agent summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Agents</p>
          <p className="text-2xl font-bold mt-1">3</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Skills</p>
          <p className="text-2xl font-bold mt-1">18</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Outputs Generated</p>
          <p className="text-2xl font-bold mt-1">
            {Object.values(outputCounts).reduce((s, c) => s + c, 0)}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-2xl font-bold mt-1 text-green-600">Active</p>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid gap-6">
        {AGENTS.map((agent) => {
          const colors = AGENT_COLORS[agent.color];
          return (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className={cn(
                "block border rounded-xl p-6 transition-all hover:shadow-md",
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("mt-0.5", colors.icon)}>
                  {AGENT_ICONS[agent.icon]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">{agent.name}</h2>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", colors.badge)}>
                      {agent.shortName}
                    </span>
                    {outputCounts[agent.id] ? (
                      <span className="text-xs text-muted-foreground">
                        {outputCounts[agent.id]} output{outputCounts[agent.id] > 1 ? "s" : ""} generated
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{agent.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {agent.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="text-xs bg-background border px-2.5 py-1 rounded-md"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-sm font-medium text-primary">
                    Open Agent
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
