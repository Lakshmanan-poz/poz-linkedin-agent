export type AgentId = "content-authority" | "thought-leadership" | "market-intelligence";

export type SkillId =
  // Agent 1.1 — Content & Authority
  | "content-calendar"
  | "post-generation"
  | "aeo-optimization"
  | "seo-optimization"
  | "repurposing"
  | "performance-insight"
  | "content-refiner"
  | "daily-post"
  | "linkedin-carousel"
  // Agent 1.2 — Thought Leadership
  | "pov-framing"
  | "deep-research"
  | "argument-structuring"
  | "long-form-asset"
  | "council-review"
  | "executive-summary"
  // Agent 1.3 — Market Intelligence
  | "competitor-profile"
  | "signal-scanning"
  | "trend-radar"
  | "aeo-audit"
  | "opportunity-mapping"
  | "briefing-pack";

export type OutputStatus = "draft" | "finalized" | "archived";

export interface AgentOutput {
  id: number;
  agent_id: AgentId;
  skill_id: SkillId;
  title: string;
  input_params: string;
  output_json: string;
  status: OutputStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export interface SkillMeta {
  id: SkillId;
  name: string;
  description: string;
  agentId: AgentId;
}

export interface AgentMeta {
  id: AgentId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  skills: SkillMeta[];
}
