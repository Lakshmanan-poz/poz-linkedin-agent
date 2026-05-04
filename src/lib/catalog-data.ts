// Service & Agent Catalog - Complete data model from the Gap Analysis plan

export type ServiceStatus = "EXISTS" | "PLANNED" | "MISSING" | "PARTIAL";
export type Priority = "HIGH" | "MEDIUM" | "LOW" | null;

export interface Skill {
  name: string;
  status: ServiceStatus;
  priority: Priority;
  agentMapping: string | null;
  notes: string;
}

export interface Agent {
  name: string;
  skills: Skill[];
}

export interface FunctionArea {
  id: string;
  name: string;
  agents: Agent[];
}

export const SERVICE_CATALOG: FunctionArea[] = [
  {
    id: "marketing",
    name: "1. Marketing",
    agents: [
      {
        name: "Content & Authority / Social Media Agent",
        skills: [
          {
            name: "Content Calendar Planning (frequency, topic rotation, themes)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.1",
            notes: "New — from meeting notes",
          },
          {
            name: "Post Generation (LinkedIn carousels, short posts, long-form)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.1",
            notes: "New — LinkedIn-first content engine",
          },
          {
            name: "AEO Skill (Answer Engine Optimization for AI surfaces)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.1",
            notes: "New — Gemini, Perplexity, Claude visibility",
          },
          {
            name: "SEO / On-Page Optimization (keywords, meta, H1/H2)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.1 (add-on)",
            notes: "Optional add-on per meeting notes",
          },
          {
            name: "Repurposing Skill (podcasts/calls/docs → multi-format posts)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.1",
            notes: "New — content multiplication",
          },
          {
            name: "Performance Insight Skill (engagement analytics, topic performance)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.1",
            notes: "New — basic analytics layer",
          },
          {
            name: "Social Media Management",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
        ],
      },
      {
        name: "Thought Leadership & POV Development Agent",
        skills: [
          {
            name: "POV Framing (problem framing, contrarian angles, future narratives)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.2",
            notes: "New — differentiated thought leadership",
          },
          {
            name: "Deep Research (multi-source scan, evidence/citation extraction)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.2",
            notes: "New — research backbone",
          },
          {
            name: "Argument Structuring (MECE storyline, objections & rebuttals)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.2",
            notes: "New — structured persuasion",
          },
          {
            name: "Long-Form Asset Generation (whitepapers, essays, reports)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.2",
            notes: "New — high-value content assets",
          },
          {
            name: "Council Review Skill (LLM council critique for quality)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.2",
            notes: "New — AI-powered peer review",
          },
          {
            name: "Executive Summary Skill (1-page / 1-slide for C-levels)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.2",
            notes: "New — exec-ready condensation",
          },
          {
            name: "Thought Leadership Content",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
        ],
      },
      {
        name: "Market & Competitive Intelligence Agent",
        skills: [
          {
            name: "Competitor Profile Skill (product, pricing, positioning, GTM)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.3",
            notes: "New — structured competitive intel",
          },
          {
            name: "Signal Scanning (news, job posts, earnings, social signals)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.3",
            notes: "New — continuous market monitoring",
          },
          {
            name: "Trend Radar (macro & micro trends)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.3",
            notes: "New — trend identification",
          },
          {
            name: "AEO / Digital Presence Audit (Fairview-style scorecards)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.3",
            notes: "New — AI visibility benchmarking",
          },
          {
            name: "Opportunity Mapping (white space, threats/risks)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 1.3",
            notes: "New — strategic opportunity ID",
          },
          {
            name: "Briefing Pack Skill (one-pager or deck for stakeholders)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 1.3",
            notes: "New — rapid briefing creation",
          },
          {
            name: "Company & Market Research",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
        ],
      },
      {
        name: "Campaign & Analytics (Original)",
        skills: [
          {
            name: "Campaign Planning & Execution",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Marketing Performance Analytics",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Public Relations",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Email Marketing Automation",
            status: "MISSING",
            priority: "LOW",
            agentMapping: null,
            notes: "Not addressed in meeting",
          },
          {
            name: "ABM (Account-Based Marketing)",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Not addressed in meeting",
          },
        ],
      },
    ],
  },
  {
    id: "sales",
    name: "2. Sales & Business Dev",
    agents: [
      {
        name: "ICP & Opportunity Qualification Agent",
        skills: [
          {
            name: "ICP Matching Skill (prospect vs. target attributes)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.1",
            notes: "New — systematic qualification",
          },
          {
            name: "Lead Enrichment Skill (company size, sector, tech stack, funding)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.1",
            notes: "New — automated lead enrichment",
          },
          {
            name: "Opportunity Scoring (fit, urgency, budget, political access)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.1",
            notes: "New — objective scoring model",
          },
          {
            name: "Risk Flagging (tire-kicker signals, misalignment)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 2.1",
            notes: "New — early disqualification",
          },
          {
            name: "Summary & Recommendation (pursue / nurture / drop)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.1",
            notes: "New — actionable recommendation engine",
          },
        ],
      },
      {
        name: "Client Intelligence & Account Research Agent",
        skills: [
          {
            name: "Company 360 Skill (size, financials, org, strategic priorities)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.2 (HIGH)",
            notes: "New — deep account intelligence",
          },
          {
            name: "Stakeholder Research (background, career, writing style)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.2 (HIGH)",
            notes: "New — stakeholder-level prep",
          },
          {
            name: "Strategic Initiatives Tracking (M&A, launches, transformation)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.2 (HIGH)",
            notes: "New — ongoing account monitoring",
          },
          {
            name: "Relationship Map Skill (org chart, influence, power centers)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 2.2 (HIGH)",
            notes: "New — political mapping",
          },
          {
            name: "Meeting Brief Skill (2-page brief per meeting)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.2 (HIGH)",
            notes: "New — meeting-ready intelligence",
          },
        ],
      },
      {
        name: "Proposal Development & Response Agent",
        skills: [
          {
            name: "RFP Decomposition (requirements vs. nice-to-have)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — systematic RFP breakdown",
          },
          {
            name: "Solution Outline Skill (approach, scope, assumptions, risks)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — rapid solution framing",
          },
          {
            name: "Commercial Risk Detection (fixed-price risk, SLAs, margin traps)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — commercial protection",
          },
          {
            name: "Proposal Structuring (ToC, templates, boilerplate injection)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — accelerated proposal assembly",
          },
          {
            name: "POV Development — Client-Specific",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — vertical/customer-specific angles",
          },
          {
            name: "Case Study Insertion Skill (select & adapt to context)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — contextual case study matching",
          },
          {
            name: "Exec Summary & Cover Letter",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.3 (HIGH)",
            notes: "New — senior decision-maker narrative",
          },
          {
            name: "Pre-sales / POV / Proposal Response",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog — now expanded",
          },
          {
            name: "Proposal Reviews",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
        ],
      },
      {
        name: "Pipeline & Sales Ops Agent",
        skills: [
          {
            name: "Pipeline Hygiene (missing next steps, stale opps, stage inconsistency)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.4",
            notes: "New — clean pipeline ops",
          },
          {
            name: "Forecast Quality Skill (stage vs. evidence validation)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.4",
            notes: "New — forecast accuracy",
          },
          {
            name: "Activity Insight (account coverage gaps)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 2.4",
            notes: "New — coverage visibility",
          },
          {
            name: "Weekly Sales Brief (top deals, risks, recommended actions)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 2.4",
            notes: "New — exec sales digest",
          },
        ],
      },
      {
        name: "Existing Sales Functions",
        skills: [
          {
            name: "Warm Contacts / Outbound / Inbound",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Lead Qualification",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Pipeline Management",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Strategic Alliance Management",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Not addressed in meeting",
          },
          {
            name: "Referral Program Development",
            status: "MISSING",
            priority: "LOW",
            agentMapping: null,
            notes: "Not addressed in meeting",
          },
          {
            name: "Account Management & Expansion (Upsell/Cross-sell)",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Still a gap — not in meeting notes",
          },
          {
            name: "Client Health Monitoring (NPS/CSAT)",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Partially covered by Meeting Intelligence sentiment",
          },
        ],
      },
    ],
  },
  {
    id: "services",
    name: "3. Services",
    agents: [
      {
        name: "Solution Architecture / Review Agent",
        skills: [
          {
            name: "Architecture Pattern Generator (layered views: channel→data→AI)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.1 (HIGH)",
            notes: "New — standardized architecture",
          },
          {
            name: "Tech Stack Recommendation (under constraints e.g. Azure+HubSpot)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.1 (HIGH)",
            notes: "New — constrained tech selection",
          },
          {
            name: "Integration Touchpoint Mapping (APIs, events, file drops)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.1 (HIGH)",
            notes: "New — integration design",
          },
          {
            name: "Architecture Critique (anti-patterns, coupling, scalability)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.1 (HIGH)",
            notes: "New — quality gate for designs",
          },
          {
            name: "Architecture Comparison (as-is vs. to-be visuals)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.1 (HIGH)",
            notes: "New — transformation visualization",
          },
          {
            name: "Solution Architecture",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog — now expanded",
          },
        ],
      },
      {
        name: "Automation Opportunity ID Agent",
        skills: [
          {
            name: "Process Decomposition (narratives → steps, actors, systems, rules)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.2",
            notes: "New — structured process analysis",
          },
          {
            name: "Volume & Effort Analysis (frequency, handle time, manual vs auto)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.2",
            notes: "New — quantified opportunity sizing",
          },
          {
            name: "ROI Estimation (savings, payback, NPV, risk)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.2",
            notes: "New — business case engine",
          },
          {
            name: "Use Case Ranking (impact vs. ease)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.2",
            notes: "New — prioritization framework",
          },
          {
            name: "Domain Overlay Skill (pharma, clinical, insurance, retail)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.2",
            notes: "New — industry-specific lens",
          },
          {
            name: "LinkedIn Workforce Signal Skill",
            status: "PLANNED",
            priority: "LOW",
            agentMapping: "Agent 3.2 (optional)",
            notes: "Optional — infer functional mix",
          },
        ],
      },
      {
        name: "Case Study Institutionalization Agent",
        skills: [
          {
            name: "Opportunity Detection (from meeting notes, JIRA, docs)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.3 (HIGH)",
            notes: "New — automated case study sourcing",
          },
          {
            name: "Case Study Structuring (problem/context/approach/outcome)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.3 (HIGH)",
            notes: "New — standardized CS framework",
          },
          {
            name: "Evidence Harvest (metrics, quotes, screenshots, artifacts)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.3 (HIGH)",
            notes: "New — proof point extraction",
          },
          {
            name: "Anonymization & Compliance (de-identify, NDA check)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.3 (HIGH)",
            notes: "New — safe-to-publish validation",
          },
          {
            name: "Repository Curation (tagging, search, service/industry mapping)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.3 (HIGH)",
            notes: "New — searchable CS library",
          },
          {
            name: "Case Studies",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog — now expanded",
          },
        ],
      },
      {
        name: "Profile & Competency Agent",
        skills: [
          {
            name: "Bio Generation (1-para, 1-page, proposal-ready)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.4",
            notes: "New — dynamic bio creation",
          },
          {
            name: "Skills Matrix (people → capabilities, domains, tools)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.4",
            notes: "New — competency mapping",
          },
          {
            name: "Project History Extraction (from calendars/JIRA/docs)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.4",
            notes: "New — automated experience tracking",
          },
          {
            name: "Proposal-Specific Tailoring (customize bios per opportunity)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.4",
            notes: "New — context-aware bio adaptation",
          },
          {
            name: "Profile Creation from Resumes",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog — now expanded",
          },
        ],
      },
      {
        name: "Engineering Acceleration Agent",
        skills: [
          {
            name: "Code Scaffold & Boilerplate Generator",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.5",
            notes: "New — standardized dev patterns",
          },
          {
            name: "Test Generation (unit/integration/contract stubs)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 3.5",
            notes: "New — automated test scaffolding",
          },
          {
            name: "Docs & ADR Synthesis (repo/API/design decision summaries)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.5",
            notes: "New — living documentation",
          },
          {
            name: "Code Review Guideline Skill (checklists from team standards)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 3.5",
            notes: "New — quality consistency",
          },
        ],
      },
      {
        name: "Design (Still Missing)",
        skills: [
          {
            name: "UX Research & Persona Development",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "No Design agent defined in meeting",
          },
          {
            name: "Usability Testing & Heuristic Evaluation",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — design validation",
          },
          {
            name: "Journey Mapping & Service Blueprinting",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — experience mapping",
          },
          {
            name: "Wireframing & Prototyping",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — design deliverables",
          },
          {
            name: "Visual / UI Design & Design Systems",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — component libraries",
          },
          {
            name: "Brand Identity & Guidelines",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Gap — brand system",
          },
          {
            name: "WCAG Compliance / Accessibility Audits",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Gap — accessibility practice",
          },
        ],
      },
      {
        name: "Engineering Delivery (Still Missing)",
        skills: [
          {
            name: "Frontend Development (React, Angular, Vue)",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Agent 3.5 covers acceleration, not delivery",
          },
          {
            name: "Mobile App Development (iOS, Android, Cross-platform)",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — mobile delivery capability",
          },
          {
            name: "API Design & Development (REST, GraphQL)",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — backend delivery",
          },
          {
            name: "Cloud Architecture (AWS, Azure, GCP)",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — cloud practice",
          },
          {
            name: "DevOps & CI/CD Pipeline Setup",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — infrastructure practice",
          },
          {
            name: "Data Pipeline & ETL Development",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — data engineering",
          },
          {
            name: "ML/AI Model Development & MLOps",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Gap — AI engineering delivery",
          },
          {
            name: "Performance & Load Testing",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Gap — non-functional testing",
          },
        ],
      },
    ],
  },
  {
    id: "technology",
    name: "4. Technology Solutions",
    agents: [
      {
        name: "Meeting Intelligence & Knowledge Capture Agent",
        skills: [
          {
            name: "Multi-Lens Extraction (engineering, design, business, risks)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 4.1",
            notes: "New — structured meeting intelligence",
          },
          {
            name: "Action Item Extraction & Routing (→ JIRA/Planner/Notion)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 4.1",
            notes: "New — automated task routing",
          },
          {
            name: "Client Sentiment Intelligence (tone, friction, energy, score)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 4.1",
            notes: "New — relationship health signals",
          },
          {
            name: "Document Sync Skill (push to PRDs, arch docs, values docs)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 4.1",
            notes: "New — living document updates",
          },
          {
            name: "Topic Tagging & Cross-Meeting Linking",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 4.1",
            notes: "New — knowledge graph layer",
          },
        ],
      },
      {
        name: "Internal Agent / Skills Library Agent",
        skills: [
          {
            name: "Meeting-to-Skill Extraction (transcripts → candidate skills)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 4.2",
            notes: "New — agent factory pipeline",
          },
          {
            name: "SSRA Validator (atomic, reusable, clearly named skills)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 4.2",
            notes: "New — quality standard for skills",
          },
          {
            name: "Agent Blueprints (templates for standard agent types)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 4.2",
            notes: "New — rapid agent creation",
          },
          {
            name: "Test Harness Skill (test scenarios & eval prompts per agent)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 4.2",
            notes: "New — agent quality assurance",
          },
          {
            name: "Documentation Generator (user guides, FAQs, change logs)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 4.2",
            notes: "New — agent documentation",
          },
        ],
      },
    ],
  },
  {
    id: "delivery",
    name: "5. Delivery Management",
    agents: [
      {
        name: "Delivery Risk Monitoring Agent",
        skills: [
          {
            name: "Delivery Signal Ingestion (JIRA, timesheets, emails, escalations)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.1",
            notes: "New — multi-source risk monitoring",
          },
          {
            name: "Schedule & Scope Risk Scoring (slippage, churn, dependencies)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.1",
            notes: "New — predictive risk scoring",
          },
          {
            name: "Cost Overrun Detection (burn vs budget, margin erosion)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.1",
            notes: "New — financial health monitoring",
          },
          {
            name: "Early-Warning Narrative (where project may derail and why)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.1",
            notes: "New — proactive risk storytelling",
          },
          {
            name: "Risk Mitigation Suggestion (actions, owners, timeframes)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 5.1",
            notes: "New — actionable mitigation plans",
          },
        ],
      },
      {
        name: "KPI & Performance Intelligence Agent",
        skills: [
          {
            name: "KPI Definition & Mapping (goals → measurable KPIs)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.2",
            notes: "New — goal-to-metric translation",
          },
          {
            name: "Data Aggregation (PM tools, finance, support, marketing)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.2",
            notes: "New — cross-function data pull",
          },
          {
            name: "Trend & Anomaly Detection (shifts, outliers, leading indicators)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 5.2",
            notes: "New — pattern recognition",
          },
          {
            name: "Narrative Insight (exec-ready 'what changed and so what')",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.2",
            notes: "New — insight storytelling",
          },
          {
            name: "Health Score Computation (project/team/client indices)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 5.2",
            notes: "New — composite health scoring",
          },
        ],
      },
      {
        name: "Existing Delivery Functions",
        skills: [
          {
            name: "Project / Program Management",
            status: "PARTIAL",
            priority: "HIGH",
            agentMapping: null,
            notes: "PM exists — needs Agile coaching & governance",
          },
          {
            name: "Agile Coaching & Scrum Mastering",
            status: "MISSING",
            priority: "HIGH",
            agentMapping: null,
            notes: "Still a gap",
          },
          {
            name: "Delivery Governance & QA",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Partially addressed by Agent 5.1",
          },
        ],
      },
    ],
  },
  {
    id: "corporate",
    name: "6. Corporate Functions",
    agents: [
      {
        name: "Legal & Contract Review Agent",
        skills: [
          {
            name: "Clause Extraction (indemnity, IP, termination, data protection)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 6.1",
            notes: "New — automated clause analysis",
          },
          {
            name: "Risk Classification (standard / negotiable / red flag)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 6.1",
            notes: "New — risk tagging per clause",
          },
          {
            name: "Profitability & Payment Term Check (milestones vs delivery risk)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 6.1",
            notes: "New — commercial health check",
          },
          {
            name: "Contract Comparison (vs. playbook or prior contracts)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 6.1",
            notes: "New — precedent matching",
          },
          {
            name: "Negotiation Point Summary (issues + fallback language)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 6.1",
            notes: "New — negotiation prep",
          },
          {
            name: "Legal & Compliance",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog — now expanded",
          },
        ],
      },
      {
        name: "Finance & Cost Optimization Agent",
        skills: [
          {
            name: "License & Tool Spend Analysis (by product, team, utilization)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 6.2",
            notes: "New — SaaS cost intelligence",
          },
          {
            name: "Cloud Cost Analysis (service-level breakdown, right-sizing)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 6.2",
            notes: "New — cloud FinOps",
          },
          {
            name: "Budget vs Actual Tracking (by client, project, portfolio)",
            status: "PLANNED",
            priority: "HIGH",
            agentMapping: "Agent 6.2",
            notes: "New — financial tracking automation",
          },
          {
            name: "Savings Opportunity Skill (cancel, downgrade, consolidate)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 6.2",
            notes: "New — actionable cost reduction",
          },
          {
            name: "Financial Operations",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog — now expanded",
          },
          {
            name: "Revenue Recognition & Project Costing",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Still a gap",
          },
        ],
      },
      {
        name: "HR & People Ops Agent",
        skills: [
          {
            name: "JD Generation (from role templates + current gaps)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 6.3 (later)",
            notes: "New — planned for scale",
          },
          {
            name: "Interview Question Set (competency & scenario-based)",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 6.3 (later)",
            notes: "New — structured interviewing",
          },
          {
            name: "Performance Review Drafting (from goals + evidence)",
            status: "PLANNED",
            priority: "LOW",
            agentMapping: "Agent 6.3 (later)",
            notes: "New — first-draft reviews",
          },
          {
            name: "Culture Code Alignment (behaviors/stories → values)",
            status: "PLANNED",
            priority: "LOW",
            agentMapping: "Agent 6.3 (later)",
            notes: "New — culture reinforcement",
          },
          {
            name: "Recruitment & Onboarding",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Talent Retention & Culture Programs",
            status: "MISSING",
            priority: "MEDIUM",
            agentMapping: null,
            notes: "Still a gap",
          },
        ],
      },
      {
        name: "Other Corporate (Original)",
        skills: [
          {
            name: "Internal IT Operations",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
          {
            name: "Vendor & Procurement Management",
            status: "EXISTS",
            priority: null,
            agentMapping: null,
            notes: "Already in original catalog",
          },
        ],
      },
    ],
  },
  {
    id: "bps",
    name: "7. Business Process Services",
    agents: [
      {
        name: "Customer Service / Contact Center Agent",
        skills: [
          {
            name: "Contact Reason Classification",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 7.1",
            notes: "New — BPS offering",
          },
          {
            name: "Script & Workflow Optimization",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 7.1",
            notes: "New — BPS offering",
          },
          {
            name: "Self-Service Opportunity Detection",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 7.1",
            notes: "New — deflection optimization",
          },
          {
            name: "KPI & Efficiency Tracking",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 7.1",
            notes: "New — BPS performance",
          },
        ],
      },
      {
        name: "Domain-Specific BPS (Pharma, Clinical, RCM, etc.)",
        skills: [
          {
            name: "Process Map & Compliance Rule Extraction",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 7.2",
            notes: "New — regulated industry BPS",
          },
          {
            name: "Document Template & Form Generation",
            status: "PLANNED",
            priority: "MEDIUM",
            agentMapping: "Agent 7.2",
            notes: "New — domain document automation",
          },
          {
            name: "Quality Checklist Skill",
            status: "PLANNED",
            priority: "LOW",
            agentMapping: "Agent 7.2",
            notes: "New — compliance quality gates",
          },
          {
            name: "Handoff & Escalation Flow Generation",
            status: "PLANNED",
            priority: "LOW",
            agentMapping: "Agent 7.2",
            notes: "New — workflow routing",
          },
        ],
      },
    ],
  },
];

// Helper functions for catalog statistics
export function getCatalogStats() {
  let totalSkills = 0;
  let planned = 0;
  let exists = 0;
  let missing = 0;
  let partial = 0;
  let highPriority = 0;
  let mediumPriority = 0;
  let lowPriority = 0;
  let totalAgents = 0;

  for (const area of SERVICE_CATALOG) {
    for (const agent of area.agents) {
      totalAgents++;
      for (const skill of agent.skills) {
        totalSkills++;
        if (skill.status === "PLANNED") planned++;
        else if (skill.status === "EXISTS") exists++;
        else if (skill.status === "MISSING") missing++;
        else if (skill.status === "PARTIAL") partial++;

        if (skill.priority === "HIGH") highPriority++;
        else if (skill.priority === "MEDIUM") mediumPriority++;
        else if (skill.priority === "LOW") lowPriority++;
      }
    }
  }

  return {
    totalSkills,
    totalAgents,
    totalFunctions: SERVICE_CATALOG.length,
    planned,
    exists,
    missing,
    partial,
    highPriority,
    mediumPriority,
    lowPriority,
  };
}

export function getAreaStats(area: FunctionArea) {
  let totalSkills = 0;
  let planned = 0;
  let exists = 0;
  let missing = 0;
  let partial = 0;

  for (const agent of area.agents) {
    for (const skill of agent.skills) {
      totalSkills++;
      if (skill.status === "PLANNED") planned++;
      else if (skill.status === "EXISTS") exists++;
      else if (skill.status === "MISSING") missing++;
      else if (skill.status === "PARTIAL") partial++;
    }
  }

  return { totalSkills, planned, exists, missing, partial };
}
