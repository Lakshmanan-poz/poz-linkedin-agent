import { AgentMeta } from "./types";

export const AGENTS: AgentMeta[] = [
  {
    id: "content-authority",
    name: "Content & Authority / Social Media Agent",
    shortName: "Agent 1.1",
    description:
      "AI-powered content engine for LinkedIn-first social media. Plans content calendars, generates posts across formats, optimizes for AI search engines (AEO), handles SEO, repurposes content from multiple sources, and provides performance analytics.",
    icon: "edit",
    color: "blue",
    skills: [
      {
        id: "content-calendar",
        name: "Content Calendar Planning",
        description:
          "Plan publishing frequency, topic rotation, and thematic content calendars with AI-suggested scheduling.",
        agentId: "content-authority",
      },
      {
        id: "post-generation",
        name: "Post Generation",
        description:
          "Generate LinkedIn carousels, short posts, long-form articles, and threads with customizable tone and audience targeting.",
        agentId: "content-authority",
      },
      {
        id: "aeo-optimization",
        name: "AEO Optimization",
        description:
          "Answer Engine Optimization — optimize content to appear in AI-generated answers from Gemini, Perplexity, Claude, and ChatGPT.",
        agentId: "content-authority",
      },
      {
        id: "seo-optimization",
        name: "SEO / On-Page Optimization",
        description:
          "Generate SEO briefs with title tags, meta descriptions, heading structures, keyword recommendations, and technical checklists.",
        agentId: "content-authority",
      },
      {
        id: "repurposing",
        name: "Repurposing Skill",
        description:
          "Transform podcasts, meeting notes, blog posts, and whitepapers into multi-format social media content.",
        agentId: "content-authority",
      },
      {
        id: "performance-insight",
        name: "Performance Insight",
        description:
          "Analyze engagement data to identify top-performing content, audience patterns, and optimization opportunities.",
        agentId: "content-authority",
      },
      {
        id: "linkedin-carousel",
        name: "LinkedIn Carousel Generator",
        description:
          "Generate publish-ready 8-slide LinkedIn carousels with three-hat quality scoring, visualization ideas, and a full caption — following the SKILL.md content authority framework.",
        agentId: "content-authority",
      },
    ],
  },
  {
    id: "thought-leadership",
    name: "Thought Leadership & POV Development Agent",
    shortName: "Agent 1.2",
    description:
      "Develops differentiated points of view, conducts deep research, structures arguments with MECE frameworks, generates long-form assets (whitepapers, essays, reports), provides AI council review, and creates executive summaries.",
    icon: "lightbulb",
    color: "purple",
    skills: [
      {
        id: "pov-framing",
        name: "POV Framing",
        description:
          "Develop contrarian angles, future narratives, and first-principles perspectives that challenge conventional thinking.",
        agentId: "thought-leadership",
      },
      {
        id: "deep-research",
        name: "Deep Research",
        description:
          "Multi-source research synthesis with evidence extraction, thematic analysis, and content angle recommendations.",
        agentId: "thought-leadership",
      },
      {
        id: "argument-structuring",
        name: "Argument Structuring",
        description:
          "Build MECE-compliant arguments with structured logic flow, counterargument handling, and strength assessment.",
        agentId: "thought-leadership",
      },
      {
        id: "long-form-asset",
        name: "Long-Form Asset Generation",
        description:
          "Generate whitepapers, essays, reports, and guides with full section structure and executive summaries.",
        agentId: "thought-leadership",
      },
      {
        id: "council-review",
        name: "Council Review",
        description:
          "Three-reviewer AI council (Strategist, Editor, Critic) provides independent feedback and prioritized revisions.",
        agentId: "thought-leadership",
      },
      {
        id: "executive-summary",
        name: "Executive Summary",
        description:
          "Distill documents into C-level-ready one-pagers, executive briefs, slide summaries, or email briefs.",
        agentId: "thought-leadership",
      },
    ],
  },
  {
    id: "market-intelligence",
    name: "Market & Competitive Intelligence Agent",
    shortName: "Agent 1.3",
    description:
      "Builds competitor profiles, scans market signals (news, job posts, earnings), identifies macro/micro trends, audits AI visibility (AEO), maps white-space opportunities, and creates stakeholder briefing packs.",
    icon: "target",
    color: "emerald",
    skills: [
      {
        id: "competitor-profile",
        name: "Competitor Profile",
        description:
          "Build comprehensive competitor profiles covering product, pricing, positioning, GTM strategy, strengths, and weaknesses.",
        agentId: "market-intelligence",
      },
      {
        id: "signal-scanning",
        name: "Signal Scanning",
        description:
          "Detect and categorize market signals from news, job postings, earnings reports, and social media activity.",
        agentId: "market-intelligence",
      },
      {
        id: "trend-radar",
        name: "Trend Radar",
        description:
          "Identify and assess macro and micro trends with momentum scoring, time-to-impact, and strategic implications.",
        agentId: "market-intelligence",
      },
      {
        id: "aeo-audit",
        name: "AEO / Digital Presence Audit",
        description:
          "Fairview-style scorecards assessing brand visibility across AI platforms with competitor benchmarking.",
        agentId: "market-intelligence",
      },
      {
        id: "opportunity-mapping",
        name: "Opportunity Mapping",
        description:
          "Map white-space opportunities, assess threats and risks, and prioritize strategic moves with feasibility analysis.",
        agentId: "market-intelligence",
      },
      {
        id: "briefing-pack",
        name: "Briefing Pack",
        description:
          "Create structured one-pagers, slide deck outlines, memos, and briefing documents for stakeholder communication.",
        agentId: "market-intelligence",
      },
    ],
  },
];

export function getAgent(agentId: string): AgentMeta | undefined {
  return AGENTS.find((a) => a.id === agentId);
}

export function getSkill(agentId: string, skillId: string) {
  const agent = getAgent(agentId);
  return agent?.skills.find((s) => s.id === skillId);
}
