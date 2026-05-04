"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAgent } from "@/lib/agents/constants";
import { AgentOutput, SkillId } from "@/lib/agents/types";
import { cn } from "@/lib/utils";

// Lazy-load all skill components
const SKILL_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "content-calendar": lazy(() => import("@/components/agents/skills/content-calendar")),
  "post-generation": lazy(() => import("@/components/agents/skills/post-generation")),
  "aeo-optimization": lazy(() => import("@/components/agents/skills/aeo-optimization")),
  "seo-optimization": lazy(() => import("@/components/agents/skills/seo-optimization")),
  "repurposing": lazy(() => import("@/components/agents/skills/repurposing")),
  "performance-insight": lazy(() => import("@/components/agents/skills/performance-insight")),
  "linkedin-carousel": lazy(() => import("@/components/agents/skills/LinkedInCarouselSkill")),
  "pov-framing": lazy(() => import("@/components/agents/skills/pov-framing")),
  "deep-research": lazy(() => import("@/components/agents/skills/deep-research")),
  "argument-structuring": lazy(() => import("@/components/agents/skills/argument-structuring")),
  "long-form-asset": lazy(() => import("@/components/agents/skills/long-form-asset")),
  "council-review": lazy(() => import("@/components/agents/skills/council-review")),
  "executive-summary": lazy(() => import("@/components/agents/skills/executive-summary")),
  "competitor-profile": lazy(() => import("@/components/agents/skills/competitor-profile")),
  "signal-scanning": lazy(() => import("@/components/agents/skills/signal-scanning")),
  "trend-radar": lazy(() => import("@/components/agents/skills/trend-radar")),
  "aeo-audit": lazy(() => import("@/components/agents/skills/aeo-audit")),
  "opportunity-mapping": lazy(() => import("@/components/agents/skills/opportunity-mapping")),
  "briefing-pack": lazy(() => import("@/components/agents/skills/briefing-pack")),
};

function SkillLoadingFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-48" />
      <div className="h-4 bg-muted rounded w-96" />
      <div className="h-10 bg-muted rounded w-full" />
      <div className="h-10 bg-muted rounded w-full" />
      <div className="h-10 bg-muted rounded w-32" />
    </div>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = getAgent(agentId);
  const [activeSkill, setActiveSkill] = useState<SkillId | null>(null);
  const [recentOutputs, setRecentOutputs] = useState<AgentOutput[]>([]);
  const [showOutputs, setShowOutputs] = useState(false);

  useEffect(() => {
    if (agent) {
      setActiveSkill(agent.skills[0].id);
      fetch(`/api/agents/outputs?agent_id=${agent.id}`)
        .then((r) => r.json())
        .then((data) => setRecentOutputs(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Agent not found</h1>
        <Link href="/agents" className="text-primary text-sm mt-2 inline-block">
          Back to Agents
        </Link>
      </div>
    );
  }

  const ActiveComponent = activeSkill ? SKILL_COMPONENTS[activeSkill] : null;
  const activeSkillMeta = agent.skills.find((s) => s.id === activeSkill);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/agents" className="hover:text-foreground transition-colors">
          Agents
        </Link>
        <span>/</span>
        <span className="text-foreground">{agent.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted">
              {agent.shortName}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 max-w-3xl">{agent.description}</p>
        </div>
        <button
          onClick={() => setShowOutputs(!showOutputs)}
          className="shrink-0 px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
        >
          {showOutputs ? "Hide History" : `History (${recentOutputs.length})`}
        </button>
      </div>

      {/* Recent outputs panel */}
      {showOutputs && recentOutputs.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">Recent Outputs</h3>
          <div className="space-y-2">
            {recentOutputs.slice(0, 10).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                    {agent.skills.find((s) => s.id === o.skill_id)?.name || o.skill_id}
                  </span>
                  <span className="text-sm font-medium">{o.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {o.created_by_name} &middot;{" "}
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      o.status === "finalized"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : o.status === "archived"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                    )}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill tabs + content */}
      <div className="flex gap-6">
        {/* Skill sidebar */}
        <div className="w-56 shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Skills ({agent.skills.length})
          </h3>
          <nav className="space-y-1">
            {agent.skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setActiveSkill(skill.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  activeSkill === skill.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {skill.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Skill content area */}
        <div className="flex-1 min-w-0 bg-card border rounded-xl p-6">
          {ActiveComponent && (
            <Suspense fallback={<SkillLoadingFallback />}>
              <ActiveComponent key={activeSkill} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
