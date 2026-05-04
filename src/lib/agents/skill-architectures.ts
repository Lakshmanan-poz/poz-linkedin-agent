/* ─────────────────────────────────────────────────────────────────────────────
   Claude Agent Skills — Skill Architecture Definitions
   Follows the official Anthropic Agent Skills architecture:
     • Level 1 — Metadata (YAML frontmatter, always loaded, ~100 tokens)
     • Level 2 — Instructions (SKILL.md body, loaded on trigger, <5k tokens)
     • Level 3 — Resources (bundled files + scripts, loaded on demand)
   Ref: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview
   ───────────────────────────────────────────────────────────────────────────── */

export type Runtime = "browser" | "python" | "node";

export type SkillFile = {
  name: string;
  type: "file" | "folder";
  level: 2 | 3;               // which loading level this belongs to
  description?: string;
};

export type SkillArchitecture = {
  id: string;
  // ── Level 1: Metadata (YAML frontmatter) ────────────────────────────────
  name: string;                // max 64 chars, lowercase + hyphens only
  description: string;         // max 1024 chars, what it does + when to trigger
  argumentHint: string;
  // ── Level 2: Instructions (SKILL.md body) ───────────────────────────────
  skillMd: string;             // full SKILL.md content (without YAML frontmatter)
  // ── Level 3: Resources ──────────────────────────────────────────────────
  fileSystem: SkillFile[];     // directory structure of the skill
  // ── Agent Configuration ─────────────────────────────────────────────────
  equippedSkills: string[];
  mcpServers: string[];
  contextNote: string;
  // ── VM Runtime ──────────────────────────────────────────────────────────
  runtime: Runtime[];
};

const SKILL_ARCH: Record<string, SkillArchitecture> = {

  /* ── Agent 1.1 · Content & Authority ──────────────────────────────────── */

  "content-calendar": {
    id: "content-calendar",
    name: "content-calendar",
    description: "Plan publishing frequency, topic rotation, and thematic content calendars with AI-suggested scheduling. Use when the user wants to plan a content schedule, posting cadence, or content themes for social media.",
    argumentHint: "topics, platforms, posting frequency, timeframe",
    skillMd: `# Content Calendar Planning

## Quick Start

Plan a structured content calendar by specifying your timeframe, posting frequency, topics, and target platforms.

\`\`\`bash
# Example invocation
Use content-calendar to plan 2 weeks of LinkedIn content about AI automation
\`\`\`

For platform-specific format guidance, see [FORMATS.md](FORMATS.md).

## Workflow

1. **Define timeframe** — Determine the calendar span (1 week, 2 weeks, or 1 month)
2. **Set posting cadence** — Establish posts-per-week per platform (default: 5/week LinkedIn)
3. **Generate topic clusters** — Group related topics into weekly themes
4. **Assign platform slots** — Map content types to platform-specific formats
5. **Schedule and export** — Output calendar with dates, formats, and content briefs

## Output Format

Return structured calendar entries:
- Date, platform, topic, post type, brief (1-sentence hook)
- Weekly focus themes
- Strategic notes for the period

## Self-Review Checklist

- [ ] Calendar covers the full requested timeframe
- [ ] Every slot has a platform, topic, format, and brief assigned
- [ ] Topic distribution balanced — no more than 3 consecutive similar posts
- [ ] LinkedIn prioritized as primary platform
- [ ] Each entry includes a hook or CTA direction`,
    fileSystem: [
      { name: "SKILL.md",         type: "file",   level: 2, description: "Main skill instructions" },
      { name: "FORMATS.md",       type: "file",   level: 3, description: "Platform format reference" },
      { name: "topics/",          type: "folder", level: 3, description: "Topic cluster templates" },
      { name: "schedule.json",    type: "file",   level: 3, description: "Scheduling rules" },
      { name: "brand-context.md", type: "file",   level: 3, description: "Brand voice guide" },
    ],
    equippedSkills: ["post-generation", "seo-optimization", "repurposing"],
    mcpServers: ["Calendar MCP", "LinkedIn MCP", "Web Search"],
    contextNote: "LinkedIn-first scheduling with cross-platform sync",
    runtime: ["browser", "node"],
  },

  "post-generation": {
    id: "post-generation",
    name: "post-generation",
    description: "Generate LinkedIn carousels, short posts, long-form articles, and threads. Use when the user wants to create, write, or draft social media posts in any format.",
    argumentHint: "topic, format (carousel|post|thread|article), tone, audience",
    skillMd: `# Post Generation

## Quick Start

Generate platform-optimized posts by specifying topic, format, tone, and target audience.

\`\`\`bash
# Generate a LinkedIn carousel
Use post-generation: topic="AI in Marketing", format=carousel, tone=authoritative
\`\`\`

For tone profiles and brand voice, see [BRAND-VOICE.md](BRAND-VOICE.md).
For format templates, see [templates/](templates/).

## Workflow

1. **Parse brief** — Extract topic, format, tone, platform, audience
2. **Select template** — Load appropriate format template from templates/
3. **Apply brand voice** — Match tone profile from BRAND-VOICE.md
4. **Generate content** — Write post with hooks, body, and CTA
5. **Format output** — Return in platform-ready structure

## Supported Formats

| Format    | Platform  | Length       | Structure               |
|-----------|-----------|--------------|-------------------------|
| Short post| LinkedIn  | 150–300 chars| Hook + insight + CTA    |
| Carousel  | LinkedIn  | 5–10 slides  | Title + slides + outro  |
| Thread    | Twitter/X | 3–8 tweets   | Hook tweet + context    |
| Article   | LinkedIn  | 800–2000 words | H2 sections + summary |

## Self-Review Checklist

- [ ] First line acts as a scroll-stopping hook
- [ ] Format matches the requested type exactly
- [ ] Tone matches the specified brand voice profile
- [ ] CTA is present and platform-appropriate
- [ ] No filler phrases ("In conclusion", "It's important to note")`,
    fileSystem: [
      { name: "SKILL.md",        type: "file",   level: 2, description: "Main skill instructions" },
      { name: "templates/",      type: "folder", level: 3, description: "Format-specific templates" },
      { name: "BRAND-VOICE.md",  type: "file",   level: 3, description: "Tone and voice profiles" },
      { name: "formats.json",    type: "file",   level: 3, description: "Format specifications" },
      { name: "scripts/",        type: "folder", level: 3, description: "Post validation scripts" },
    ],
    equippedSkills: ["content-calendar", "aeo-optimization", "repurposing"],
    mcpServers: ["LinkedIn MCP", "Twitter MCP", "Claude AI"],
    contextNote: "Multi-format generation with brand-voice enforcement",
    runtime: ["browser", "node"],
  },

  "aeo-optimization": {
    id: "aeo-optimization",
    name: "aeo-optimization",
    description: "Optimize content for AI answer engines (Gemini, Perplexity, Claude, ChatGPT). Use when the user wants their content to appear in AI-generated answers or improve AI search visibility.",
    argumentHint: "content or URL to optimize, target AI engines",
    skillMd: `# AEO Optimization

## Quick Start

Optimize content structure so AI answer engines cite your brand in responses.

\`\`\`bash
# Audit and optimize a URL
Use aeo-optimization: url="https://example.com/blog/post", engines=[perplexity, gemini]
\`\`\`

For engine-specific requirements, see [AI-ENGINES.md](AI-ENGINES.md).

## Workflow

1. **Audit current state** — Score content against AEO benchmarks
2. **Identify query targets** — Find high-intent questions the content should answer
3. **Restructure for direct answers** — Add Q&A sections, definition blocks, numbered lists
4. **Add schema signals** — Embed structured data patterns
5. **Benchmark against competitors** — Compare AI visibility scores

## AEO Scoring Criteria

| Signal              | Weight | Optimization               |
|---------------------|--------|----------------------------|
| Direct answers      | 30%    | Add concise answer blocks  |
| Structured data     | 25%    | JSON-LD schema markup      |
| Query match         | 25%    | Target question keywords   |
| Citation authority  | 20%    | Add source references      |

## Self-Review Checklist

- [ ] At least 3 direct-answer blocks added to the content
- [ ] Structured data schema present and valid
- [ ] Top 5 target queries identified and addressed
- [ ] Content scored against Perplexity and Gemini benchmarks
- [ ] Competitor AEO visibility compared`,
    fileSystem: [
      { name: "SKILL.md",        type: "file",   level: 2, description: "Main skill instructions" },
      { name: "AI-ENGINES.md",   type: "file",   level: 3, description: "Engine-specific requirements" },
      { name: "queries/",        type: "folder", level: 3, description: "Target query templates" },
      { name: "benchmarks.json", type: "file",   level: 3, description: "AEO scoring benchmarks" },
      { name: "scripts/audit.py",type: "file",   level: 3, description: "AEO audit script" },
    ],
    equippedSkills: ["seo-optimization", "post-generation", "performance-insight"],
    mcpServers: ["Perplexity MCP", "Web Search", "Claude AI"],
    contextNote: "AI-engine visibility across Gemini, Perplexity, Claude",
    runtime: ["browser", "python"],
  },

  "seo-optimization": {
    id: "seo-optimization",
    name: "seo-optimization",
    description: "Generate SEO briefs with title tags, meta descriptions, heading structures, and keyword recommendations. Use when the user wants to improve search rankings, optimize a page, or create an SEO brief.",
    argumentHint: "page URL or content, target keywords, industry",
    skillMd: `# SEO / On-Page Optimization

## Quick Start

Generate a complete SEO brief for a page or piece of content.

\`\`\`bash
Use seo-optimization: url="https://example.com/page", keywords=["AI marketing","automation"]
\`\`\`

For keyword research methodology, see [KEYWORD-GUIDE.md](KEYWORD-GUIDE.md).

## Workflow

1. **Keyword analysis** — Research primary and secondary keyword targets
2. **Competitive gap analysis** — Identify ranking opportunities vs. competitors
3. **On-page audit** — Score title, meta, headings, content, internal links
4. **Generate SEO brief** — Output complete optimization recommendations
5. **Technical checklist** — Flag Core Web Vitals and technical issues

## Output Structure

- Title tag (50–60 chars) with primary keyword
- Meta description (150–160 chars) with value proposition
- H1, H2, H3 heading structure
- Keyword density and placement recommendations
- Internal link opportunities
- Technical SEO checklist

## Self-Review Checklist

- [ ] Primary keyword in title tag, H1, and first 100 words
- [ ] Meta description contains a clear CTA
- [ ] Heading hierarchy is logical (H1 → H2 → H3 only)
- [ ] At least 3 internal link opportunities identified
- [ ] Core Web Vitals flags noted if applicable`,
    fileSystem: [
      { name: "SKILL.md",          type: "file",   level: 2, description: "Main skill instructions" },
      { name: "KEYWORD-GUIDE.md",  type: "file",   level: 3, description: "Keyword research methodology" },
      { name: "briefs/",           type: "folder", level: 3, description: "SEO brief templates" },
      { name: "keywords.json",     type: "file",   level: 3, description: "Keyword database" },
      { name: "scripts/audit.py",  type: "file",   level: 3, description: "Technical SEO audit script" },
    ],
    equippedSkills: ["aeo-optimization", "content-calendar", "performance-insight"],
    mcpServers: ["SEMrush MCP", "Web Search", "Search Console MCP"],
    contextNote: "On-page SEO with technical audit integration",
    runtime: ["browser", "node"],
  },

  "repurposing": {
    id: "repurposing",
    name: "repurposing",
    description: "Transform podcasts, meeting notes, blog posts, and whitepapers into multi-format social media content. Use when the user has existing content they want to reformat or republish across platforms.",
    argumentHint: "source content or URL, target formats, platforms",
    skillMd: `# Repurposing Skill

## Quick Start

Transform any source content into platform-optimized social media formats.

\`\`\`bash
# Repurpose a blog post
Use repurposing: source="blog_post.md", formats=[carousel, thread, short_post]
\`\`\`

Supported sources: podcast transcripts, blog posts, whitepapers, meeting notes, videos.
For format mapping, see [FORMAT-MAP.md](FORMAT-MAP.md).

## Workflow

1. **Ingest source** — Parse and extract key insights from source material
2. **Identify angles** — Find 3–5 distinct narrative angles from the source
3. **Map to formats** — Match each angle to best-fit output formats
4. **Generate content** — Create platform-specific versions for each angle
5. **Quality check** — Verify each output stands alone without the source

## Source-to-Format Matrix

| Source Type   | Best Output Formats                    |
|---------------|----------------------------------------|
| Podcast ep.   | Thread, carousel, quote cards          |
| Blog post     | LinkedIn post, carousel, Twitter thread|
| Whitepaper    | LinkedIn article, carousel series      |
| Meeting notes | Action-item post, lessons-learned post |

## Self-Review Checklist

- [ ] Each output stands alone without the original source
- [ ] No more than 3 consecutive posts use the same source
- [ ] Platform-specific formatting applied correctly
- [ ] Original insights preserved, not diluted
- [ ] Attribution included where appropriate`,
    fileSystem: [
      { name: "SKILL.md",       type: "file",   level: 2, description: "Main skill instructions" },
      { name: "FORMAT-MAP.md",  type: "file",   level: 3, description: "Source-to-format mapping guide" },
      { name: "sources/",       type: "folder", level: 3, description: "Source content storage" },
      { name: "outputs/",       type: "folder", level: 3, description: "Generated content output" },
      { name: "scripts/parse.py", type: "file", level: 3, description: "Source parsing script" },
    ],
    equippedSkills: ["post-generation", "content-calendar", "long-form-asset"],
    mcpServers: ["File Storage MCP", "YouTube MCP", "Web Scraper MCP"],
    contextNote: "Source-agnostic ingestion with format mapping",
    runtime: ["browser", "python", "node"],
  },

  "performance-insight": {
    id: "performance-insight",
    name: "performance-insight",
    description: "Analyze engagement data to surface top-performing content, audience patterns, and optimization opportunities. Use when the user wants to understand how their posts are performing or improve engagement.",
    argumentHint: "engagement metrics CSV, platform handle, or date range",
    skillMd: `# Performance Insight

## Quick Start

Analyze engagement data to identify patterns and optimization opportunities.

\`\`\`bash
# Analyze LinkedIn metrics
Use performance-insight: platform=linkedin, data="metrics.csv", period="last_30_days"
\`\`\`

For metric definitions and benchmarks, see [BENCHMARKS.md](BENCHMARKS.md).

## Workflow

1. **Ingest data** — Parse engagement metrics (impressions, likes, comments, shares, CTR)
2. **Segment by format** — Group performance by post type and platform
3. **Identify top performers** — Find posts in top 20% engagement percentile
4. **Surface patterns** — Extract timing, topic, and format correlations
5. **Generate recommendations** — Output prioritized optimization actions

## Key Metrics Tracked

| Metric            | LinkedIn Benchmark | What It Signals         |
|-------------------|--------------------|-------------------------|
| Engagement rate   | 2–5%               | Content resonance       |
| Impression reach  | 1k–10k             | Distribution quality    |
| Comment ratio     | >0.5%              | Conversation trigger    |
| Share rate        | >0.3%              | Shareworthy insight     |

## Self-Review Checklist

- [ ] At least 30 posts analyzed (statistical significance)
- [ ] Top 3 and bottom 3 posts identified with reasons
- [ ] Timing patterns extracted (best days/times)
- [ ] Format performance ranked
- [ ] At least 3 actionable recommendations provided`,
    fileSystem: [
      { name: "SKILL.md",       type: "file",   level: 2, description: "Main skill instructions" },
      { name: "BENCHMARKS.md",  type: "file",   level: 3, description: "Industry benchmark reference" },
      { name: "metrics/",       type: "folder", level: 3, description: "Metrics data storage" },
      { name: "reports/",       type: "folder", level: 3, description: "Generated analysis reports" },
      { name: "scripts/analyze.py", type: "file", level: 3, description: "Metrics analysis script" },
    ],
    equippedSkills: ["content-calendar", "post-generation", "aeo-optimization"],
    mcpServers: ["LinkedIn Analytics MCP", "Twitter Analytics MCP", "Dashboard MCP"],
    contextNote: "Cross-platform analytics with pattern recognition",
    runtime: ["browser", "python"],
  },

  /* ── Agent 1.2 · Thought Leadership ───────────────────────────────────── */

  "pov-framing": {
    id: "pov-framing",
    name: "pov-framing",
    description: "Develop contrarian angles, future narratives, and first-principles perspectives on a topic. Use when the user wants to build a differentiated point of view, challenge conventional thinking, or develop a narrative arc.",
    argumentHint: "topic or industry, audience, desired narrative angle",
    skillMd: `# POV Framing

## Quick Start

Develop a differentiated point of view that challenges conventional wisdom.

\`\`\`bash
Use pov-framing: topic="Remote work productivity", audience="tech executives", angle=contrarian
\`\`\`

For narrative frameworks, see [FRAMEWORKS.md](FRAMEWORKS.md).

## Workflow

1. **Map the consensus** — Identify the dominant industry narrative on the topic
2. **Find the inversion** — Locate assumptions that can be challenged with evidence
3. **Build the POV** — Develop a clear thesis with supporting arguments
4. **Structure the arc** — Apply Setup / Tension / Resolution narrative structure
5. **Add objection rebuttals** — Pre-empt and address the strongest counterarguments

## POV Arc Structure

\`\`\`
Setup    → "Here's what everyone believes..."
Tension  → "But here's what the data actually shows..."
Evidence → "3 specific examples proving the alternative..."
Resolution → "This changes how we should think about..."
\`\`\`

## Self-Review Checklist

- [ ] POV takes a clear, specific stance (not "it depends")
- [ ] At least 3 evidence points support the thesis
- [ ] Strongest counterargument is addressed directly
- [ ] Narrative arc follows Setup → Tension → Resolution
- [ ] Language is declarative, not hedging`,
    fileSystem: [
      { name: "SKILL.md",       type: "file",   level: 2, description: "Main skill instructions" },
      { name: "FRAMEWORKS.md",  type: "file",   level: 3, description: "Narrative framework library" },
      { name: "narratives/",    type: "folder", level: 3, description: "POV narrative templates" },
      { name: "objections.md",  type: "file",   level: 3, description: "Counterargument handling guide" },
      { name: "scripts/score.js", type: "file", level: 3, description: "POV strength scoring" },
    ],
    equippedSkills: ["argument-structuring", "deep-research", "long-form-asset"],
    mcpServers: ["Web Search", "Claude AI", "Knowledge Base MCP"],
    contextNote: "Narrative arc generation with contrarian angle engine",
    runtime: ["browser", "node"],
  },

  "deep-research": {
    id: "deep-research",
    name: "deep-research",
    description: "Conduct multi-source research synthesis with evidence extraction and content angle recommendations. Use when the user needs to research a topic thoroughly, synthesize multiple sources, or find evidence for an argument.",
    argumentHint: "research topic, depth level (quick|thorough|exhaustive), source preference",
    skillMd: `# Deep Research

## Quick Start

Synthesize research from multiple sources into structured insights and content angles.

\`\`\`bash
Use deep-research: topic="Impact of AI on knowledge work", depth=thorough, sources=[academic, news, reports]
\`\`\`

For source evaluation criteria, see [SOURCE-GUIDE.md](SOURCE-GUIDE.md).

## Workflow

1. **Define scope** — Establish research question and depth level
2. **Multi-source sweep** — Query news, academic, and industry sources
3. **Evidence extraction** — Pull key data points, quotes, and statistics
4. **Thematic clustering** — Group evidence into 3–5 main themes
5. **Content angle generation** — Derive 5+ editorial angles from the research

## Research Depth Levels

| Level     | Sources   | Output                              |
|-----------|-----------|-------------------------------------|
| Quick     | 3–5       | Key facts + 2 angles                |
| Thorough  | 10–20     | Thematic synthesis + 5 angles       |
| Exhaustive| 30+       | Full literature review + full report|

## Self-Review Checklist

- [ ] At least 5 distinct sources consulted
- [ ] Each claim has a source citation
- [ ] Evidence grouped into clear themes (not a flat list)
- [ ] At least 3 content angles derived from research
- [ ] Conflicting evidence flagged where it exists`,
    fileSystem: [
      { name: "SKILL.md",        type: "file",   level: 2, description: "Main skill instructions" },
      { name: "SOURCE-GUIDE.md", type: "file",   level: 3, description: "Source evaluation criteria" },
      { name: "sources/",        type: "folder", level: 3, description: "Research source cache" },
      { name: "synthesis/",      type: "folder", level: 3, description: "Synthesis output storage" },
      { name: "scripts/fetch.py",type: "file",   level: 3, description: "Multi-source fetch script" },
    ],
    equippedSkills: ["pov-framing", "argument-structuring", "executive-summary"],
    mcpServers: ["Web Search", "Arxiv MCP", "News MCP"],
    contextNote: "Multi-source synthesis with evidence graph",
    runtime: ["browser", "python", "node"],
  },

  "argument-structuring": {
    id: "argument-structuring",
    name: "argument-structuring",
    description: "Build MECE-compliant arguments with structured logic flow and counterargument handling. Use when the user wants to structure a persuasive argument, validate logic, or build a framework for an essay or presentation.",
    argumentHint: "thesis statement, audience, supporting evidence",
    skillMd: `# Argument Structuring

## Quick Start

Build a logically sound, MECE-structured argument from a thesis.

\`\`\`bash
Use argument-structuring: thesis="AI will replace 30% of knowledge work by 2030", audience=skeptical_executives
\`\`\`

For MECE framework templates, see [MECE-GUIDE.md](MECE-GUIDE.md).

## Workflow

1. **State the thesis** — One clear, falsifiable claim
2. **Build the logic tree** — Decompose into MECE supporting pillars
3. **Source each pillar** — Assign evidence to each branch
4. **Stress-test** — Identify logical gaps and weak links
5. **Add counterarguments** — State and rebut the top 3 objections

## MECE Structure Template

\`\`\`
Thesis: [One clear claim]
├── Pillar 1: [Evidence branch A]
│   ├── Evidence 1.1
│   └── Evidence 1.2
├── Pillar 2: [Evidence branch B]
│   ├── Evidence 2.1
│   └── Evidence 2.2
└── Pillar 3: [Evidence branch C]
    └── Evidence 3.1
\`\`\`

## Self-Review Checklist

- [ ] Thesis is specific and falsifiable
- [ ] Pillars are mutually exclusive (no overlap)
- [ ] Pillars are collectively exhaustive (no gaps)
- [ ] Each pillar has at least 2 evidence points
- [ ] Top 3 counterarguments addressed`,
    fileSystem: [
      { name: "SKILL.md",        type: "file",   level: 2, description: "Main skill instructions" },
      { name: "MECE-GUIDE.md",   type: "file",   level: 3, description: "MECE framework templates" },
      { name: "logic-trees/",    type: "folder", level: 3, description: "Logic tree templates" },
      { name: "arguments.json",  type: "file",   level: 3, description: "Argument structure schemas" },
      { name: "scripts/validate.js", type: "file", level: 3, description: "Logic validation script" },
    ],
    equippedSkills: ["pov-framing", "deep-research", "council-review"],
    mcpServers: ["Claude AI", "Knowledge Base MCP", "Logic MCP"],
    contextNote: "MECE logic validation with counterargument handling",
    runtime: ["browser", "node"],
  },

  "long-form-asset": {
    id: "long-form-asset",
    name: "long-form-asset",
    description: "Generate whitepapers, essays, reports, and guides with full section structure. Use when the user wants to create a long-form document, whitepaper, research report, or comprehensive guide.",
    argumentHint: "asset type (whitepaper|essay|report|guide), topic, audience, length",
    skillMd: `# Long-Form Asset Generation

## Quick Start

Generate structured long-form documents with automatic TOC scaffolding.

\`\`\`bash
Use long-form-asset: type=whitepaper, topic="Future of B2B Marketing", audience="CMOs", length=3000
\`\`\`

For document templates by type, see [templates/](templates/).

## Workflow

1. **Define asset type** — Select from whitepaper, essay, report, guide, playbook
2. **Scaffold structure** — Generate table of contents and section map
3. **Research briefing** — Pull key evidence and data points per section
4. **Generate content** — Write each section to the specified depth
5. **Auto-summary** — Generate executive summary and key takeaways

## Asset Type Specifications

| Type        | Length      | Structure                              |
|-------------|-------------|----------------------------------------|
| Whitepaper  | 2,000–5,000 | Abstract, Problem, Solution, Evidence  |
| Essay       | 800–2,000   | Thesis, Arguments, Conclusion          |
| Report      | 3,000–8,000 | Executive Summary, Sections, Appendix  |
| Guide       | 1,500–4,000 | Introduction, Steps, Reference         |

## Self-Review Checklist

- [ ] Executive summary stands alone as a complete overview
- [ ] Each section has a clear purpose and contributes to the thesis
- [ ] Data and claims are sourced or flagged as estimates
- [ ] Conclusion includes specific, actionable next steps
- [ ] Reading level appropriate for stated audience`,
    fileSystem: [
      { name: "SKILL.md",         type: "file",   level: 2, description: "Main skill instructions" },
      { name: "templates/",       type: "folder", level: 3, description: "Document templates by type" },
      { name: "drafts/",          type: "folder", level: 3, description: "Working draft storage" },
      { name: "references.json",  type: "file",   level: 3, description: "Reference source library" },
      { name: "scripts/outline.js", type: "file", level: 3, description: "TOC auto-generation script" },
    ],
    equippedSkills: ["deep-research", "pov-framing", "executive-summary"],
    mcpServers: ["Claude AI", "File Storage MCP", "Template MCP"],
    contextNote: "Structured long-form generation with TOC scaffolding",
    runtime: ["browser", "node"],
  },

  "council-review": {
    id: "council-review",
    name: "council-review",
    description: "Run a three-reviewer AI council (Strategist, Editor, Critic) to review content and prioritize revisions. Use when the user wants feedback on writing quality, argument strength, or strategic impact of content.",
    argumentHint: "content to review, review focus (strategy|style|logic), priority areas",
    skillMd: `# Council Review

## Quick Start

Submit content for independent review by three AI reviewer personas.

\`\`\`bash
Use council-review: content="essay.md", focus=[strategy, logic], audience=executives
\`\`\`

For reviewer persona definitions, see [reviewer-prompts/](reviewer-prompts/).

## Three Reviewers

### The Strategist
Evaluates: narrative strength, audience fit, strategic positioning
Ask: "Does this move the business objective?"

### The Editor
Evaluates: clarity, flow, structure, language precision
Ask: "Is every sentence earning its place?"

### The Critic
Evaluates: logical gaps, unsupported claims, counterarguments not addressed
Ask: "What's the strongest objection to this?"

## Workflow

1. **Submit to Strategist** — Score strategic relevance and positioning (1–10)
2. **Submit to Editor** — Score clarity and flow, flag weak passages
3. **Submit to Critic** — Identify logical gaps and missing evidence
4. **Merge feedback** — Combine reviews, weight by review focus
5. **Prioritize revisions** — Rank changes by impact (critical / important / nice-to-have)

## Self-Review Checklist

- [ ] All three reviewers provided independent scores
- [ ] At least 5 specific revision recommendations generated
- [ ] Revisions ranked by priority (critical first)
- [ ] Conflicting reviewer feedback flagged for author decision
- [ ] Final quality score assigned (avg of 3 reviewer scores)`,
    fileSystem: [
      { name: "SKILL.md",           type: "file",   level: 2, description: "Main skill instructions" },
      { name: "reviewer-prompts/",  type: "folder", level: 3, description: "Reviewer persona definitions" },
      { name: "reviews/",           type: "folder", level: 3, description: "Review output storage" },
      { name: "revisions.json",     type: "file",   level: 3, description: "Revision tracking schema" },
      { name: "scripts/score.py",   type: "file",   level: 3, description: "Review scoring script" },
    ],
    equippedSkills: ["argument-structuring", "long-form-asset", "executive-summary"],
    mcpServers: ["Claude AI", "Review MCP", "Feedback MCP"],
    contextNote: "Three-persona independent review with revision scoring",
    runtime: ["browser", "node"],
  },

  "executive-summary": {
    id: "executive-summary",
    name: "executive-summary",
    description: "Distill documents into C-level-ready one-pagers, executive briefs, or email summaries. Use when the user wants to summarize a long document, create a briefing, or prepare a concise overview for senior stakeholders.",
    argumentHint: "document to summarize, output format (one-pager|brief|email), audience level",
    skillMd: `# Executive Summary

## Quick Start

Distill any document into a C-level-ready summary in the requested format.

\`\`\`bash
Use executive-summary: source="whitepaper.pdf", format=one-pager, audience=board
\`\`\`

For format templates, see [templates/](templates/).

## Workflow

1. **Parse document** — Extract structure, key claims, and data points
2. **Identify core message** — Distill to one sentence: the single most important point
3. **Select format** — Match output format to audience and context
4. **Write summary** — Apply format template with key points and next steps
5. **Quality check** — Verify summary works without the source document

## Output Formats

| Format     | Length        | Structure                                |
|------------|---------------|------------------------------------------|
| One-pager  | 400–600 words | Situation, Insight, Recommendation, CTA  |
| Brief      | 200–300 words | Context, Finding, Action                 |
| Email      | 150–200 words | Subject, 3 bullets, Ask                  |
| Slide deck | 5–7 slides    | Cover, Problem, Solution, Evidence, CTA  |

## Self-Review Checklist

- [ ] Core message stated in first sentence
- [ ] Summary reads independently without the source document
- [ ] Length matches the format specification
- [ ] At least one specific, actionable recommendation included
- [ ] Audience-appropriate language and detail level`,
    fileSystem: [
      { name: "SKILL.md",        type: "file",   level: 2, description: "Main skill instructions" },
      { name: "templates/",      type: "folder", level: 3, description: "Summary format templates" },
      { name: "summaries/",      type: "folder", level: 3, description: "Generated summary storage" },
      { name: "style-guide.md",  type: "file",   level: 3, description: "Executive writing style guide" },
      { name: "scripts/parse.py",type: "file",   level: 3, description: "Document parsing script" },
    ],
    equippedSkills: ["long-form-asset", "deep-research", "council-review"],
    mcpServers: ["Claude AI", "File Storage MCP", "Template MCP"],
    contextNote: "C-level distillation with format-adaptive output",
    runtime: ["browser", "node"],
  },

  /* ── Agent 1.3 · Market Intelligence ──────────────────────────────────── */

  "competitor-profile": {
    id: "competitor-profile",
    name: "competitor-profile",
    description: "Build comprehensive competitor profiles covering product, pricing, positioning, and GTM strategy. Use when the user wants to research a competitor, understand competitive threats, or map the competitive landscape.",
    argumentHint: "competitor name or URL, analysis depth, industry vertical",
    skillMd: `# Competitor Profile

## Quick Start

Build a comprehensive competitor intelligence profile.

\`\`\`bash
Use competitor-profile: competitor="Salesforce", depth=thorough, vertical=CRM
\`\`\`

For profile schema and field definitions, see [PROFILE-SCHEMA.md](PROFILE-SCHEMA.md).

## Workflow

1. **Company overview** — Size, funding, founding date, key personnel
2. **Product analysis** — Feature set, positioning, pricing tiers
3. **GTM mapping** — Channels, ICP, sales motion, key messages
4. **Strength/weakness audit** — SWOT with evidence for each point
5. **Threat assessment** — Score competitive threat level (1–5) with rationale

## Profile Structure

\`\`\`
Company Overview
└── Founding, HQ, employees, funding, revenue

Product & Pricing
├── Core product features
├── Pricing tiers and model
└── Key differentiators

GTM Strategy
├── Target ICP
├── Primary channels
└── Key messages / positioning

SWOT Analysis
├── Strengths (evidence-backed)
├── Weaknesses
├── Opportunities (for us)
└── Threats (to us)

Threat Level: [1-5] with rationale
\`\`\`

## Self-Review Checklist

- [ ] All profile sections populated with sourced data
- [ ] Pricing information verified (not estimated)
- [ ] At least 3 evidence points per SWOT quadrant
- [ ] Threat level justified with specific reasoning
- [ ] Last updated date noted for time-sensitive data`,
    fileSystem: [
      { name: "SKILL.md",            type: "file",   level: 2, description: "Main skill instructions" },
      { name: "PROFILE-SCHEMA.md",   type: "file",   level: 3, description: "Profile field definitions" },
      { name: "profiles/",           type: "folder", level: 3, description: "Competitor profile storage" },
      { name: "pricing.json",        type: "file",   level: 3, description: "Pricing model templates" },
      { name: "scripts/scrape.py",   type: "file",   level: 3, description: "Competitor data scraper" },
    ],
    equippedSkills: ["signal-scanning", "opportunity-mapping", "briefing-pack"],
    mcpServers: ["Web Scraper MCP", "LinkedIn MCP", "Web Search"],
    contextNote: "Real-time competitor intelligence with GTM mapping",
    runtime: ["browser", "python", "node"],
  },

  "signal-scanning": {
    id: "signal-scanning",
    name: "signal-scanning",
    description: "Detect and categorize market signals from news, job postings, earnings reports, and social media. Use when the user wants to monitor a company or industry for strategic signals, hiring trends, or market movements.",
    argumentHint: "company names, industries, or keywords to monitor",
    skillMd: `# Signal Scanning

## Quick Start

Scan for and categorize market signals across multiple data sources.

\`\`\`bash
Use signal-scanning: targets=["OpenAI","Anthropic"], sources=[news,jobs,social], period="last_7_days"
\`\`\`

For signal category definitions, see [CATEGORIES.md](CATEGORIES.md).

## Workflow

1. **Define targets** — Companies, industries, keywords, or competitors to monitor
2. **Multi-source scan** — Query news, job boards, earnings calls, social media
3. **Signal extraction** — Pull relevant events and categorize by type
4. **Importance scoring** — Rate each signal (1–5) by strategic relevance
5. **Alert generation** — Flag critical signals (score 4–5) for immediate review

## Signal Categories

| Category        | Sources                    | Strategic Meaning              |
|-----------------|----------------------------|--------------------------------|
| Product signals | Press releases, product pages| Feature launches, pivots       |
| Hiring signals  | LinkedIn, job boards       | Capability building, expansion |
| Financial signals | Earnings, funding rounds   | Investment focus, runway       |
| Partnership signals | PR, LinkedIn             | Ecosystem moves                |

## Self-Review Checklist

- [ ] All target entities scanned across at least 3 source types
- [ ] Each signal categorized and scored
- [ ] High-priority signals (4–5) flagged prominently
- [ ] Signals dated and sourced
- [ ] Summary of key takeaways provided`,
    fileSystem: [
      { name: "SKILL.md",          type: "file",   level: 2, description: "Main skill instructions" },
      { name: "CATEGORIES.md",     type: "file",   level: 3, description: "Signal category definitions" },
      { name: "signals/",          type: "folder", level: 3, description: "Signal event storage" },
      { name: "alerts/",           type: "folder", level: 3, description: "Critical signal alerts" },
      { name: "scripts/scan.py",   type: "file",   level: 3, description: "Multi-source scanning script" },
    ],
    equippedSkills: ["competitor-profile", "trend-radar", "aeo-audit"],
    mcpServers: ["News MCP", "Twitter MCP", "Web Scraper MCP"],
    contextNote: "Real-time signal detection across news and social",
    runtime: ["browser", "python", "node"],
  },

  "trend-radar": {
    id: "trend-radar",
    name: "trend-radar",
    description: "Identify and assess macro and micro trends with momentum scoring and strategic implications. Use when the user wants to understand emerging trends, assess market direction, or identify strategic opportunities.",
    argumentHint: "industry, time horizon, trend categories (macro|micro|tech|cultural)",
    skillMd: `# Trend Radar

## Quick Start

Identify and score emerging trends with time-to-impact estimates.

\`\`\`bash
Use trend-radar: industry="B2B SaaS", horizon="18_months", categories=[tech,go-to-market]
\`\`\`

For trend scoring methodology, see [SCORING.md](SCORING.md).

## Workflow

1. **Define scope** — Industry, time horizon, and trend categories
2. **Signal aggregation** — Pull trend indicators from news, research, social
3. **Trend identification** — Cluster signals into named trend themes
4. **Momentum scoring** — Rate velocity (1–5) and time-to-impact
5. **Strategic mapping** — Assess implications and recommended actions

## Radar Quadrants

\`\`\`
         High Impact
              ↑
Watch    |  Act Now
(Monitor)|  (Prioritize)
←────────┼────────→
Ignore   |  Explore
(Low)    |  (Investigate)
         ↓
         Low Impact
      Slow    Fast
     (Velocity)
\`\`\`

## Self-Review Checklist

- [ ] At least 8 distinct trends identified
- [ ] Each trend scored on momentum (1–5) and impact (1–5)
- [ ] Time-to-impact estimated (months)
- [ ] Each trend mapped to a radar quadrant
- [ ] At least 2 strategic recommendations per "Act Now" trend`,
    fileSystem: [
      { name: "SKILL.md",        type: "file",   level: 2, description: "Main skill instructions" },
      { name: "SCORING.md",      type: "file",   level: 3, description: "Trend scoring methodology" },
      { name: "trends/",         type: "folder", level: 3, description: "Trend data storage" },
      { name: "momentum.json",   type: "file",   level: 3, description: "Momentum scoring data" },
      { name: "scripts/radar.py",type: "file",   level: 3, description: "Radar visualization script" },
    ],
    equippedSkills: ["signal-scanning", "opportunity-mapping", "competitor-profile"],
    mcpServers: ["Google Trends MCP", "Web Search", "News MCP"],
    contextNote: "Macro/micro trend detection with momentum engine",
    runtime: ["browser", "python"],
  },

  "aeo-audit": {
    id: "aeo-audit",
    name: "aeo-audit",
    description: "Audit brand visibility across AI platforms using Fairview-style scorecards with competitor benchmarking. Use when the user wants to understand how their brand appears in AI search results or audit their AI visibility.",
    argumentHint: "brand name, competitor names, AI platforms to audit",
    skillMd: `# AEO / Digital Presence Audit

## Quick Start

Audit AI visibility across major AI platforms with competitive benchmarking.

\`\`\`bash
Use aeo-audit: brand="Acme Corp", competitors=["Competitor A","Competitor B"], platforms=[perplexity,gemini,chatgpt]
\`\`\`

For platform-specific audit criteria, see [AI-PLATFORMS.md](AI-PLATFORMS.md).

## Workflow

1. **Query each platform** — Test 10 high-intent queries per brand
2. **Score visibility** — Rate appearance rate, position quality, and sentiment
3. **Benchmark competitors** — Run same queries for each competitor
4. **Gap analysis** — Identify where competitors outperform the brand
5. **Generate scorecard** — Output Fairview-style scorecard with improvement plan

## Scoring Rubric (per platform, per brand)

| Dimension        | Max Score | Criteria                              |
|------------------|-----------|---------------------------------------|
| Appearance rate  | 30 pts    | % of queries where brand is mentioned |
| Position quality | 30 pts    | Lead mention vs. buried mention        |
| Sentiment        | 20 pts    | Positive / neutral / negative framing  |
| Content accuracy | 20 pts    | Correct product claims                 |

**Total: 100 pts per platform**

## Self-Review Checklist

- [ ] Minimum 10 queries tested per brand per platform
- [ ] All specified competitors benchmarked on same queries
- [ ] Scorecard generated with numeric scores
- [ ] Top 3 content gaps identified
- [ ] Prioritized improvement action plan included`,
    fileSystem: [
      { name: "SKILL.md",          type: "file",   level: 2, description: "Main skill instructions" },
      { name: "AI-PLATFORMS.md",   type: "file",   level: 3, description: "Platform audit criteria" },
      { name: "scorecards/",       type: "folder", level: 3, description: "Generated scorecards" },
      { name: "benchmarks/",       type: "folder", level: 3, description: "Competitor benchmark data" },
      { name: "scripts/audit.py",  type: "file",   level: 3, description: "AEO audit automation script" },
    ],
    equippedSkills: ["competitor-profile", "signal-scanning", "opportunity-mapping"],
    mcpServers: ["Perplexity MCP", "Web Search", "Claude AI"],
    contextNote: "AI-engine visibility scoring with competitor benchmarks",
    runtime: ["browser", "python"],
  },

  "opportunity-mapping": {
    id: "opportunity-mapping",
    name: "opportunity-mapping",
    description: "Map white-space opportunities, assess threats, and prioritize strategic moves with feasibility scoring. Use when the user wants to identify market gaps, prioritize growth initiatives, or build a strategic opportunity matrix.",
    argumentHint: "market space, current positioning, strategic goals",
    skillMd: `# Opportunity Mapping

## Quick Start

Map white-space opportunities and prioritize strategic moves.

\`\`\`bash
Use opportunity-mapping: market="HR Tech", positioning="mid-market", goal="expand_upmarket"
\`\`\`

For opportunity scoring templates, see [SCORING.md](SCORING.md).

## Workflow

1. **Market landscape** — Map current players and positioning
2. **White-space detection** — Identify unserved or underserved segments
3. **Opportunity scoring** — Rate each opportunity on impact × feasibility
4. **Threat mapping** — Identify risks and competitive responses
5. **Priority matrix** — Rank moves in a 2×2 (impact vs. effort) matrix

## Opportunity Scoring

\`\`\`
Opportunity Score = (Market Size × 0.3) + (Fit Score × 0.3)
                  + (Feasibility × 0.2) + (Competitive Gap × 0.2)
\`\`\`

**High Priority**: Score ≥ 7.0
**Investigate**: Score 4.0–6.9
**Deprioritize**: Score < 4.0

## Self-Review Checklist

- [ ] At least 5 distinct opportunities identified and scored
- [ ] Each opportunity has an evidence-backed feasibility rating
- [ ] Priority matrix populated with all opportunities
- [ ] Top 3 threats mapped with likelihood and impact
- [ ] Recommended next actions specified for top 3 opportunities`,
    fileSystem: [
      { name: "SKILL.md",         type: "file",   level: 2, description: "Main skill instructions" },
      { name: "SCORING.md",       type: "file",   level: 3, description: "Opportunity scoring templates" },
      { name: "opportunities/",   type: "folder", level: 3, description: "Opportunity analysis output" },
      { name: "whitespace.json",  type: "file",   level: 3, description: "Market white-space data" },
      { name: "scripts/matrix.js",type: "file",   level: 3, description: "Priority matrix generator" },
    ],
    equippedSkills: ["trend-radar", "competitor-profile", "briefing-pack"],
    mcpServers: ["Web Search", "Market Data MCP", "Claude AI"],
    contextNote: "White-space detection with feasibility scoring",
    runtime: ["browser", "python", "node"],
  },

  "briefing-pack": {
    id: "briefing-pack",
    name: "briefing-pack",
    description: "Create structured one-pagers, slide deck outlines, and briefing documents for stakeholder communication. Use when the user needs to prepare a briefing, stakeholder update, or structured communication document.",
    argumentHint: "topic, audience, format (one-pager|slide-deck|memo|report), key messages",
    skillMd: `# Briefing Pack

## Quick Start

Create a structured briefing document for stakeholder communication.

\`\`\`bash
Use briefing-pack: topic="Q3 Market Intelligence", audience=board, format=one-pager
\`\`\`

For format templates, see [templates/](templates/).

## Workflow

1. **Define audience** — Identify stakeholder level and information needs
2. **Select format** — Match format to audience and context
3. **Structure key messages** — Identify 3–5 core messages
4. **Build narrative** — Connect messages in logical sequence
5. **Add supporting data** — Source evidence for each claim

## Format Templates

| Format     | Best For                    | Length          |
|------------|-----------------------------|-----------------|
| One-pager  | Board briefing, exec review | 1 page / 600 words |
| Slide deck | Presentations, workshops    | 5–10 slides     |
| Memo       | Internal decision-making    | 300–500 words   |
| Report     | Detailed stakeholder update | 1,000–3,000 words |

## Self-Review Checklist

- [ ] Opening states the purpose and context in one sentence
- [ ] Each key message is supported by at least one data point
- [ ] Clear recommendation or ask included
- [ ] Length matches format specification
- [ ] Audience-appropriate language (no internal jargon for external audiences)`,
    fileSystem: [
      { name: "SKILL.md",         type: "file",   level: 2, description: "Main skill instructions" },
      { name: "templates/",       type: "folder", level: 3, description: "Format templates by type" },
      { name: "packs/",           type: "folder", level: 3, description: "Generated briefing storage" },
      { name: "slide-outlines/",  type: "folder", level: 3, description: "Slide deck outline templates" },
      { name: "scripts/format.js",type: "file",   level: 3, description: "Document formatting script" },
    ],
    equippedSkills: ["executive-summary", "opportunity-mapping", "competitor-profile"],
    mcpServers: ["Claude AI", "Template MCP", "File Storage MCP"],
    contextNote: "Stakeholder-ready briefings with format selection",
    runtime: ["browser", "node"],
  },
};

export default SKILL_ARCH;
