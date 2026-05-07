# POZ Social Media Agent — Complete Project Documentation

## Table of Contents

1. [Project Description](#1-project-description)
2. [Tech Stack](#2-tech-stack)
3. [Architecture & Workflow](#3-architecture--workflow)
4. [Database Schema](#4-database-schema)
5. [Pages & Navigation](#5-pages--navigation)
6. [API Reference](#6-api-reference)
7. [Post Creation Flow (Input → Output)](#7-post-creation-flow-input--output)
8. [Marketing Agents System (Input → Output)](#8-marketing-agents-system-input--output)
9. [Service Catalog](#9-service-catalog)
10. [File Structure](#10-file-structure)
11. [Configuration & Environment](#11-configuration--environment)
12. [Default Data & Seeding](#12-default-data--seeding)

---

## 1. Project Description

**POZ Social Media Agent** is a full-stack AI-powered social media content management platform built for LinkedIn-first B2B thought leadership. It combines four core capabilities:

1. **Content Creation Pipeline** — A multi-step wizard that uses OpenAI GPT-4o to generate LinkedIn posts (problem-solution, educational, execution/build, carousel formats), with a full editorial workflow from draft to published.

2. **Marketing AI Agents** — Three specialized agents (18 skills total) covering content strategy, thought leadership development, and market intelligence. Nine of these skills use OpenAI's Responses API with real-time web search for up-to-date competitive and market data.

3. **LinkedIn Carousel Generator** — On the Agent Catalog page, any agent skill automatically generates a 5-slide POZ-branded carousel using Claude claude-sonnet-4-6. Each slide is production-quality HTML following the POZ design system (Bebas Neue + Inter, Ink/White/Blue canvases). Slides are cached in localStorage and downloadable as a PDF in one click.

4. **Service Catalog & Planning** — A comprehensive gap analysis dashboard mapping 7 function areas, 27 planned agents, and 149 skills with status tracking (Exists, Planned, Missing, Partial) and priority rankings.

The platform is designed for a marketing team of 10 members with role-based workflows (leads, members, designers) and includes a content calendar, prompt template management, analytics dashboard, and team management.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 15.x | Full-stack React framework with API routes |
| **UI Library** | React | 19.x | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | Latest | Accessible component library (Card, Tabs, Dialog, Badge, Select, Button, etc.) |
| **Icons** | Lucide React | Latest | SVG icon library |
| **Database** | SQLite via better-sqlite3 | 12.6.2 | Local embedded database with WAL mode |
| **AI — Posts & Agents** | OpenAI SDK | Latest | GPT-4o for content generation, Responses API for web search |
| **AI — Carousel** | Anthropic SDK (`@anthropic-ai/sdk`) | Latest | claude-sonnet-4-6 for carousel slide HTML generation |
| **PDF Export** | html-to-image + jsPDF | Latest | Browser-side: renders slide divs → JPEG → stitches into PDF |
| **Fonts** | Google Fonts (Bebas Neue + Inter) | — | Loaded globally in layout.tsx head; used in all carousel slides |
| **Notifications** | Sonner | Latest | Toast notifications |
| **Theming** | next-themes | Latest | Light/dark mode |
| **Validation** | Zod | 4.3.6 | Schema validation |
| **Utilities** | date-fns, clsx, tailwind-merge | Latest | Date formatting, class name merging |

---

## 3. Architecture & Workflow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js App Router (React 19 + TypeScript)                 │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │  Posts    │ │  Agents  │ │ Catalog  │       │
│  │  Page    │ │  Pages   │ │  Pages   │ │  Page    │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘       │
│       │             │             │                           │
│  ┌────▼─────────────▼─────────────▼──────────────────┐      │
│  │              API Routes (Next.js)                  │      │
│  │  /api/dashboard  /api/posts  /api/agents/generate  │      │
│  │  /api/team       /api/generate  /api/agents/outputs│      │
│  │  /api/templates  /api/settings  /api/calendar      │      │
│  └────┬─────────────┬─────────────┬──────────────────┘      │
└───────┼─────────────┼─────────────┼──────────────────────────┘
        │             │             │
┌───────▼─────────────▼─────────────▼──────────────────────────┐
│                       BACKEND                                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  SQLite DB   │  │  OpenAI Chat     │  │  OpenAI        │ │
│  │ (better-     │  │  Completions     │  │  Responses API │ │
│  │  sqlite3)    │  │  (JSON mode)     │  │  + Web Search  │ │
│  │              │  │                  │  │                │ │
│  │ 7 Tables     │  │ Post generation  │  │ 9 skills with  │ │
│  │ WAL mode     │  │ 9 agent skills   │  │ real-time data │ │
│  └──────────────┘  └──────────────────┘  └────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow Overview

```
User Input → Frontend Form → API Route → AI Generation → JSON Response → UI Rendering → Save to DB
```

### Post Creation Workflow

```
Select Type → Enter Topic → AI Generates → Preview & Edit → Save Draft
     │                           │                              │
     ▼                           ▼                              ▼
 4 post types            POST /api/generate           POST /api/posts
 - Problem-Solution      → OpenAI GPT-4o              → SQLite INSERT
 - Educational           → JSON mode                  → Status: "draft"
 - Execution/Build       → Template-based prompts     → Revision logged
 - Carousel                                           → Status history

Draft → In Review → Ready for Design → With Designer → Ready to Publish → Published
  │         │              │                │                │              │
  └─── Each transition logged in post_status_history table ──┘              │
                                                                      
                                                                    Published URL saved
```

### Agent Skill Workflow

```
User fills skill form → POST /api/agents/generate → AI processes → JSON output → Render UI → Save

For 9 web-search skills:                    For 9 standard skills:
┌─────────────────────────┐                ┌─────────────────────────┐
│  OpenAI Responses API   │                │  OpenAI Chat Completions│
│  + web_search tool      │                │  + json_object mode     │
│  Real-time web data     │                │  Prompt-based output    │
│  JSON extracted from    │                │  Direct JSON response   │
│  response text          │                │                         │
└─────────────────────────┘                └─────────────────────────┘
```

### Carousel Generation Workflow

```
Agent Catalog page loads
        │
        ▼
Topic + Day + Slides fingerprint → 32-bit hash → check localStorage
        │                                               │
   Cache HIT                                      Cache MISS
        │                                               │
        ▼                                               ▼
Render cached HTML slides              POST /api/agents/carousel-html
(no Claude API call)                           │
                                               ▼
                                  claude-sonnet-4-6 generates 5 slides
                                  in parallel (Promise.all)
                                  Each slide: archetype-routed HTML
                                  (COVER / LIST / STAT / QUOTE / CTA)
                                               │
                                               ▼
                                  Store in localStorage by hash
                                               │
                                               ▼
                                  Render in HtmlSlidePreview frames
                                               │
                        ┌──────────────────────┘
                        │
               User clicks Download PDF
                        │
                        ▼
         Show overlay (z-index:99998, ink background)
                        │
         For each slide:
           1. Strip <link> tags from HTML (CORS prevention)
           2. Append div at z-index:99999 (must be in viewport)
           3. Wait 200ms for fonts + layout paint
           4. toJpeg(div, { pixelRatio:1, quality:0.95 })
           5. Remove div (in inner finally block)
           6. jsPDF.addImage(jpeg, "JPEG", 0, 0, 1080, 1350)
                        │
                        ▼
         doc.save("topic-carousel.pdf")
         Remove overlay (outer finally block)
```

### POZ Design System — Carousel Rules

```
CANVASES:
  COVER  → background: #050517 (Ink)
  LIST   → background: #FFFFFF (White)
  STAT   → background: #FFFFFF (White)
  QUOTE  → background: #050517 (Ink)
  CTA    → background: #009FF0 (Blue)

FONTS:
  Display  → Bebas Neue 400  (titles, eyebrows, numbers, counters)
  Body     → Inter 400/600/700 (paragraphs, list rows, sub-labels)

FONT SIZES:
  185px Bebas Neue → stat number
  144px Bebas Neue → cover / CTA headline
  120px Bebas Neue → content slide headline
  100px Bebas Neue → quote archetype
   40px Bebas Neue → list row numbers
   28px Bebas Neue → eyebrow chips, counter, handle tags
   36px Inter 700  → list row primary text
   32px Inter 400  → footer body paragraph
   26px Inter 400  → list row sub-text

RULES: No gradients. No blur. No colored box-shadows. 
       Spacing multiples of 8. Border-radius max 8px (4px chips).
       All children in flexbox — no position:absolute.
       Eyebrow chips: white-space:nowrap.
```

### State Management

```
┌────────────────────────────────────────────────┐
│            React Context (UserProvider)          │
│  - Current user selection                       │
│  - Team member list from /api/team              │
│  - Persisted in component state                 │
└────────────────────────────────────────────────┘
│
├── Dashboard: Fetches /api/dashboard/stats
├── Posts: Fetches /api/posts with filters
├── Calendar: Fetches /api/calendar?week=...
├── Templates: Fetches /api/templates
├── Agents Hub: Fetches /api/agents/outputs (counts)
├── Agent Detail: Fetches /api/agents/outputs?agent_id=...
└── Settings: Fetches /api/settings
```

---

## 4. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ team_members │     │      posts       │     │   post_revisions   │
│──────────────│     │──────────────────│     │────────────────────│
│ id (PK)      │◄────│ author_id (FK)   │     │ id (PK)            │
│ name         │◄────│ assigned_designer│     │ post_id (FK) ──────┼──► posts.id
│ email        │     │ id (PK)          │     │ content            │
│ role         │     │ title            │     │ revised_by (FK) ───┼──► team_members.id
│ created_at   │     │ content          │     │ revision_type      │
└──────────────┘     │ post_type        │     │ created_at         │
       │             │ status           │     └────────────────────┘
       │             │ platform         │
       │             │ scheduled_date   │     ┌────────────────────┐
       │             │ carousel_slides  │     │ post_status_history│
       │             │ hashtags         │     │────────────────────│
       │             │ ai_prompt        │     │ id (PK)            │
       │             │ ai_model         │     │ post_id (FK) ──────┼──► posts.id
       │             │ notes            │     │ from_status        │
       │             │ created_at       │     │ to_status          │
       │             │ updated_at       │     │ changed_by (FK) ───┼──► team_members.id
       │             └──────────────────┘     │ note               │
       │                                      │ created_at         │
       │                                      └────────────────────┘
       │
       │             ┌──────────────────┐     ┌────────────────────┐
       │             │ prompt_templates │     │   app_settings     │
       │             │──────────────────│     │────────────────────│
       └─────────────│ created_by (FK)  │     │ key (PK)           │
                     │ id (PK)          │     │ value              │
                     │ name             │     │ updated_at         │
                     │ post_type        │     └────────────────────┘
                     │ system_prompt    │
                     │ user_prompt_     │
                     │   template       │
                     │ is_default       │
                     └──────────────────┘

┌──────────────────┐
│  agent_outputs   │
│──────────────────│
│ id (PK)          │
│ agent_id         │  "content-authority" | "thought-leadership" | "market-intelligence"
│ skill_id         │  18 possible skill IDs
│ title            │
│ input_params     │  JSON string of form inputs
│ output_json      │  JSON string of AI-generated output
│ status           │  "draft" | "finalized" | "archived"
│ created_by (FK)  │──► team_members.id
│ created_at       │
│ updated_at       │
└──────────────────┘
```

### Table Details

| Table | Rows (Default) | Purpose |
|-------|---------------|---------|
| `team_members` | 10 (seeded) | Users: leads, members, designers |
| `posts` | 0 | LinkedIn posts with full metadata |
| `post_revisions` | 0 | Edit history for each post |
| `post_status_history` | 0 | Status transition audit trail |
| `prompt_templates` | 4 (seeded) | AI prompt templates per post type |
| `app_settings` | 4 (seeded) | Key-value configuration |
| `agent_outputs` | 0 | Saved outputs from agent skills |

### Post Status State Machine

```
draft ──► in_review ──► ready_for_design ──► with_designer ──► ready_to_publish ──► published
  │          │                                                         │
  │          └──► draft (reject back)                                  │
  │                                                                    │
  └──► archived                                                        └──► archived
```

---

## 5. Pages & Navigation

### Sidebar Navigation (9 items)

| # | Page | Route | Icon | Description |
|---|------|-------|------|-------------|
| 1 | Dashboard | `/dashboard` | BarChart3 | KPI cards, pipeline overview, team stats |
| 2 | Posts | `/posts` | FileText | Post list with search, filters, table view |
| 3 | Create Post | `/posts/new` | PlusCircle | 3-step AI post creation wizard |
| 4 | Calendar | `/calendar` | CalendarDays | Weekly content calendar view |
| 5 | Templates | `/templates` | LayoutGrid | Prompt template management |
| 6 | Agent Catalog | `/catalog` | Layers | Service catalog gap analysis (149 skills) |
| 7 | Agents | `/agents` | Bot | Marketing agents hub (3 agents, 18 skills) |
| 8 | Team | `/team` | Users | Team member management |
| 9 | Settings | `/settings` | Settings | OpenAI config, brand settings |

### Dynamic Routes

| Route | Description |
|-------|-------------|
| `/posts/[id]` | Post detail — edit, status transitions, revisions |
| `/agents/[agentId]` | Agent detail — skill tabs, forms, AI generation, outputs |

---

## 6. API Reference

### Post Management

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| `POST` | `/api/generate` | `{ topic, post_type, additional_context }` | `GeneratedPost` or `GeneratedCarousel` JSON |
| `GET` | `/api/posts` | Query: `status`, `post_type`, `author_id`, `search` | `Post[]` with author/designer names |
| `POST` | `/api/posts` | `{ title, content, post_type, author_id, platform, ai_prompt, ai_model, carousel_slides, hashtags }` | `Post` (status: draft) |
| `GET` | `/api/posts/[id]` | Path: `id` | `Post` with author/designer names |
| `PUT` | `/api/posts/[id]` | `{ title?, content?, scheduled_date?, assigned_designer_id?, hashtags?, notes? }` | Updated `Post` |
| `DELETE` | `/api/posts/[id]` | Path: `id` | `{ success: true }` |
| `PATCH` | `/api/posts/[id]/status` | `{ status, changed_by, note? }` | Updated `Post` |
| `GET` | `/api/posts/[id]/revisions` | Path: `id` | `PostRevision[]` |
| `POST` | `/api/posts/[id]/revisions` | `{ content, revised_by, revision_type }` | `PostRevision` |

### Agent System

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| `POST` | `/api/agents/generate` | `{ skillId, inputs }` | Skill-specific JSON (see Section 8) |
| `POST` | `/api/agents/carousel-html` | `{ slides: Slide[], topic: string }` | `{ slides: SlideWithHtml[] }` — each slide has `slideHtml` (full 1080×1350px HTML string) |
| `GET` | `/api/agents/outputs` | Query: `agent_id`, `skill_id`, `status`, `created_by`, `search` | `AgentOutput[]` |
| `POST` | `/api/agents/outputs` | `{ agent_id, skill_id, title, input_params, output_json, created_by }` | `AgentOutput` (status: draft) |
| `GET` | `/api/agents/outputs/[id]` | Path: `id` | `AgentOutput` |
| `PUT` | `/api/agents/outputs/[id]` | `{ title?, output_json?, status? }` | Updated `AgentOutput` |
| `DELETE` | `/api/agents/outputs/[id]` | Path: `id` | `{ success: true }` |

#### `/api/agents/carousel-html` — Carousel HTML Generator

- **Engine**: Anthropic claude-sonnet-4-6 (`@anthropic-ai/sdk`), `max_tokens: 8096`
- **Parallelism**: All slides are generated simultaneously via `Promise.all`
- **Archetype routing**: Each slide's `type` field maps to a template — `hook→COVER`, `list/reframe→LIST`, `stat/depth→STAT`, `quote/principle→QUOTE`, last slide→`CTA`
- **Output**: Each slide returns a standalone `<div style="width:1080px;height:1350px">` with inline CSS, no external dependencies except Google Fonts `<link>` (stripped at PDF render time)
- **Required env**: `ANTHROPIC_API_KEY`

### Other APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/dashboard/stats` | Dashboard KPIs and analytics |
| `GET/POST` | `/api/team` | List / create team members |
| `GET/PUT/DELETE` | `/api/team/[id]` | Single team member CRUD |
| `GET/POST` | `/api/templates` | List / create prompt templates |
| `GET/PUT/DELETE` | `/api/templates/[id]` | Single template CRUD |
| `GET/POST` | `/api/settings` | Get / update app settings |
| `GET` | `/api/calendar` | Posts for a given week (query: `week`) |

---

## 7. Post Creation Flow (Input → Output)

### End-to-End Example: Creating an Educational Post

#### Step 1: User Input
```
Post Type: Educational
Topic: "Why most AI implementations fail in enterprise"
Additional Context: "Focus on change management and data quality"
```

#### Step 2: API Call
```http
POST /api/generate
Content-Type: application/json

{
  "topic": "Why most AI implementations fail in enterprise",
  "post_type": "educational",
  "additional_context": "Focus on change management and data quality"
}
```

#### Step 3: AI Processing
- System prompt loaded from `prompt_templates` (Educational template)
- Brand context injected: `Brand: POZ, Voice: Professional yet approachable...`
- OpenAI GPT-4o called with `response_format: { type: "json_object" }`

#### Step 4: AI Output
```json
{
  "hook": "80% of enterprise AI projects fail before reaching production.\n\nBut the problem isn't the technology.",
  "body": "After working with dozens of enterprise teams, I've noticed the same 3 patterns...\n\n1. Data quality is an afterthought\nMost teams jump to model training before auditing their data...\n\n2. Change management is invisible\nNo one budgets time for the human side of AI adoption...\n\n3. Success metrics are undefined\nWithout clear KPIs, even successful implementations get killed...",
  "callToAction": "Which of these patterns have you seen in your organization? Drop a comment below.",
  "hashtags": ["#AI", "#Enterprise", "#ChangeManagement", "#DataQuality", "#Leadership"],
  "fullPost": "80% of enterprise AI projects fail before reaching production...",
  "wordCount": 245,
  "readingTime": "1 min"
}
```

#### Step 5: Save to Database
```http
POST /api/posts
Content-Type: application/json

{
  "title": "Why most AI implementations fail in enterprise",
  "content": "80% of enterprise AI projects fail before reaching production...",
  "post_type": "educational",
  "author_id": 4,
  "platform": "linkedin",
  "ai_prompt": "Why most AI implementations fail in enterprise",
  "ai_model": "gpt-4o",
  "hashtags": "[\"#AI\", \"#Enterprise\", \"#ChangeManagement\"]"
}
```

#### Step 6: Database Record Created
```sql
INSERT INTO posts (title, content, post_type, status, platform, author_id, ai_prompt, ai_model, hashtags)
VALUES ('Why most AI...', '80% of enterprise...', 'educational', 'draft', 'linkedin', 4, '...', 'gpt-4o', '[...]');

INSERT INTO post_revisions (post_id, content, revised_by, revision_type)
VALUES (1, '80% of enterprise...', 4, 'ai_generated');

INSERT INTO post_status_history (post_id, from_status, to_status, changed_by)
VALUES (1, NULL, 'draft', 4);
```

### Carousel Post Example

#### Input
```json
{
  "topic": "5 frameworks for product-led growth",
  "post_type": "carousel",
  "additional_context": "B2B SaaS focus"
}
```

#### Output
```json
{
  "title": "5 Frameworks for Product-Led Growth",
  "slides": [
    { "slideNumber": 1, "headline": "5 PLG Frameworks Every B2B Leader Needs", "bodyText": "A visual guide to scaling SaaS growth", "visualSuggestion": "Bold title card with gradient" },
    { "slideNumber": 2, "headline": "1. The Bowling Alley Framework", "bodyText": "Start with one narrow use case...", "visualSuggestion": "Bowling pins diagram" },
    { "slideNumber": 3, "headline": "2. The Hook Model", "bodyText": "Trigger → Action → Variable Reward → Investment...", "visualSuggestion": "4-step cycle diagram" }
  ],
  "closingSlide": {
    "headline": "Which framework will you try first?",
    "callToAction": "Follow POZ for more growth insights"
  },
  "captionText": "Stop guessing at growth strategy. Here are 5 battle-tested frameworks...",
  "hashtags": ["#PLG", "#SaaS", "#GrowthStrategy", "#ProductLed", "#B2B"]
}
```

---

## 8. Marketing Agents System (Input → Output)

### Agent Overview

| Agent | ID | Skills | Color | Description |
|-------|----|--------|-------|-------------|
| **Agent 1.1** Content & Authority / Social Media Agent | `content-authority` | 6 | Blue | Content calendars, post generation, AEO/SEO, repurposing, analytics |
| **Agent 1.2** Thought Leadership & POV Development Agent | `thought-leadership` | 6 | Purple | POV framing, deep research, argument structuring, long-form, council review, executive summary |
| **Agent 1.3** Market & Competitive Intelligence Agent | `market-intelligence` | 6 | Emerald | Competitor profiles, signal scanning, trend radar, AEO audit, opportunity mapping, briefing packs |

### AI Engine Split

| Engine | Skills | Why |
|--------|--------|-----|
| **OpenAI Responses API + Web Search** | deep-research, signal-scanning, trend-radar, competitor-profile, aeo-audit, aeo-optimization, performance-insight, opportunity-mapping, briefing-pack | Need real-time web data (news, competitors, market signals) |
| **OpenAI Chat Completions (JSON mode)** | content-calendar, post-generation, seo-optimization, repurposing, pov-framing, argument-structuring, long-form-asset, council-review, executive-summary | Work from user-provided content, no live data needed |

### Skill Details: Input → Output

#### Agent 1.1 — Content & Authority

**Skill: Content Calendar Planning**
| Input | Output |
|-------|--------|
| Timeframe (1 week / 2 weeks / 1 month) | `calendarName`: string |
| Posts per week (1-7) | `themes[]`: thematic pillars |
| Core topics/themes | `entries[]`: { date, platform, topic, postType, brief, theme } |
| Platforms (LinkedIn, Twitter, etc.) | `weeklyBreakdown[]`: { week, focus, postCount } |
| Brand context | `notes`: strategic notes |

**Skill: Post Generation**
| Input | Output |
|-------|--------|
| Topic (required) | `title`, `hook`, `body`, `callToAction` |
| Post type (short, long-form, carousel, thread) | `hashtags[]` |
| Platform (LinkedIn, Twitter, Blog) | `fullPost` (assembled) |
| Tone (professional, conversational, etc.) | `slides[]` (for carousels) |
| Target audience | `threadPosts[]` (for threads) |
| Additional context | `wordCount`, `readingTime` |

**Skill: AEO Optimization** (Web Search)
| Input | Output |
|-------|--------|
| Topic to optimize | `currentVisibilityAssessment` |
| Target AI queries | `targetQueries[]`: { query, idealAnswer, contentRecommendation } |
| Existing content | `faqPairs[]`: { question, answer } |
| Competitors | `citationTemplates[]`, `schemaMarkupSuggestions[]` |
| | `priorityActions[]` |

**Skill: SEO / On-Page Optimization**
| Input | Output |
|-------|--------|
| Page URL or topic | `titleTag` (< 60 chars), `metaDescription` (< 160 chars) |
| Primary keyword | `h1Suggestion`, `headingStructure[]` |
| Secondary keywords | `keywordDensity`, `contentGaps[]` |
| Existing page content | `internalLinkSuggestions[]` |
| Competitor URLs | `technicalChecklist[]`, `priorityFixes[]` |

**Skill: Repurposing**
| Input | Output |
|-------|--------|
| Source type (podcast, meeting, blog, whitepaper) | `sourceTitle` (inferred) |
| Source content (pasted text) | `keyInsights[]` (3-5 takeaways) |
| Target formats (linkedin-post, thread, carousel, etc.) | `quotableLines[]` |
| Brand voice notes | `outputs[]`: { format, title, content, wordCount, hashtags } |

**Skill: Performance Insight** (Web Search)
| Input | Output |
|-------|--------|
| Engagement data (pasted) | `summary` (executive overview) |
| Timeframe | `topPerformingPosts[]`, `underPerformingPosts[]` |
| Goals | `topicPerformance[]`, `bestPostingTimes[]` |
| | `audienceInsights[]`, `recommendations[]` |

---

#### Agent 1.2 — Thought Leadership

**Skill: POV Framing**
| Input | Output |
|-------|--------|
| Topic (required) | `thesis` (one-sentence POV) |
| Angle (contrarian, first-principles, future-back, reframe) | `headline`, `conventionalWisdom`, `contrarianInsight` |
| Industry context | `problemReframe` |
| Existing narratives | `evidencePoints[]`: { point, source } |
| Target audience | `narrativeArc`: { setup, tension, resolution } |
| | `potentialObjections[]`: { objection, rebuttal } |

**Skill: Deep Research** (Web Search)
| Input | Output |
|-------|--------|
| Research question (required) | `executiveSummary` (2-3 paragraphs) |
| Scope (narrow / broad / competitive) | `keyFindings[]`: { finding, evidence, confidence, source } |
| Sources (preferred) | `thematicAnalysis[]`: { theme, summary, supportingEvidence } |
| Depth (summary / detailed / comprehensive) | `dataPoints[]`: { statistic, source, context } |
| Output focus (evidence / trend / opinion) | `bibliography[]`: { title, author, year, relevance } |
| | `gapsAndLimitations[]`, `contentAngles[]` |

**Skill: Argument Structuring**
| Input | Output |
|-------|--------|
| Thesis statement | `thesis`, `oneLineSummary`, `elevatorPitch` |
| Framework (MECE, Pyramid, etc.) | `argumentStructure[]`: { level, point, evidence, transition } |
| Key points | `counterarguments[]`: { objection, acknowledgment, rebuttal, evidence } |
| Known counterarguments | `logicFlow` (paragraph) |
| Evidence notes | `strengthAssessment`: { strengths, weaknesses, improvements } |

**Skill: Long-Form Asset Generation**
| Input | Output |
|-------|--------|
| Asset type (whitepaper, essay, report, etc.) | `title`, `subtitle`, `assetType` |
| Title, thesis | `sections[]`: { heading, content, keyTakeaway } |
| Outline, research notes | `executiveSummary`, `keyStatistics[]` |
| Target length (1500 / 3000 / 5000 words) | `conclusion`, `callToAction` |
| Target audience | `fullDocument` (markdown) |
| | `wordCount`, `readingTime`, `suggestedVisuals[]` |

**Skill: Council Review**
| Input | Output |
|-------|--------|
| Content to review (pasted) | `overallScore` (1-10) |
| Content type (post, article, whitepaper, etc.) | 3 reviewer cards: |
| Review focus areas | — `strategistReview`: { score, strengths, concerns, suggestions } |
| Target audience | — `editorReview`: { score, strengths, concerns, suggestions } |
| | — `criticReview`: { score, strengths, concerns, suggestions } |
| | `consensusStrengths[]`, `prioritizedRevisions[]` |
| | `revisedExcerpts[]`: { original, revised, explanation } |

**Skill: Executive Summary**
| Input | Output |
|-------|--------|
| Source content (pasted) | `bottomLine` (single key takeaway) |
| Format (1-page, 1-slide, email, memo) | `keySections[]`: { heading, content } |
| Audience (C-suite, board, team, investors) | `decisionPoints[]`: { decision, options, recommendation } |
| Focus areas | `keyMetrics[]`: { metric, value, context } |
| | `nextSteps[]`, `fullSummary`, `wordCount` |

---

#### Agent 1.3 — Market Intelligence

**Skill: Competitor Profile** (Web Search)
| Input | Output |
|-------|--------|
| Competitor name (required) | `companyName`, `summary` |
| Website URL | `product`: { description, keyFeatures, differentiators } |
| Industry | `pricing`: { model, tiers, comparison } |
| Known info | `positioning`: { targetMarket, valueProposition, messaging } |
| Focus areas | `gtmStrategy`: { channels, approach, partnerships } |
| | `strengths[]`, `weaknesses[]`, `recentMoves[]` |
| | `threatLevel`, `threatAssessment`, `opportunities[]` |

**Skill: Signal Scanning** (Web Search)
| Input | Output |
|-------|--------|
| Company/market to scan | `scanTarget`, `scanPeriod`, `signalSummary` |
| Signal types (news, jobs, earnings, social) | `signals[]`: { type, title, description, significance, source, date } |
| Timeframe | `patterns[]`: { pattern, evidence, implication } |
| Context | `earlyWarnings[]`, `recommendedActions[]`, `confidenceLevel` |

**Skill: Trend Radar** (Web Search)
| Input | Output |
|-------|--------|
| Industry | `radarSummary` |
| Scope (macro / micro / both) | `trends[]`: { name, category, description, momentum, timeToImpact, relevanceScore, implications, signalsOfChange } |
| Time horizon (6 months / 1 year / 3 years) | `convergences[]`: { trends, insight } |
| Focus lens | `blindSpots[]`, `strategicImplications[]`, `recommendedWatches[]` |

**Skill: AEO / Digital Presence Audit** (Web Search)
| Input | Output |
|-------|--------|
| Brand name (required) | `overallScore` (0-100) |
| Website URL | `platformScores[]`: { platform, visibility, accuracy, sentiment } |
| Key queries users ask AI | `queryAnalysis[]`: { query, brandMentioned, position, context } |
| Competitors | `gapAnalysis`: { strengths, gaps, opportunities } |
| AI platforms to check | `competitorComparison[]`, `recommendations[]` |
| | `scorecard`: { visibility, accuracy, sentiment, authority, freshness } |

**Skill: Opportunity Mapping** (Web Search)
| Input | Output |
|-------|--------|
| Market | `opportunitySummary`, `strategicRecommendation` |
| Current offering | `whiteSpaceOpportunities[]`: { opportunity, marketSize, feasibility, investment } |
| Competitive landscape | `threats[]`: { threat, likelihood, impact, mitigation } |
| Customer pain points | `risks[]`: { risk, category, severity, mitigation } |
| Constraints | `prioritizedOpportunities[]`: { rank, opportunity, rationale, nextStep } |

**Skill: Briefing Pack** (Web Search)
| Input | Output |
|-------|--------|
| Topic (required) | `title`, `subtitle`, `executiveSummary` |
| Format (1-pager, deck, memo, report) | `situationOverview` |
| Audience | `keyFindings[]`: { finding, evidence, significance } |
| Key data / context | `dataHighlights[]`: { metric, value, trend, context } |
| Objective | `options[]`: { option, pros, cons, recommendation } |
| | `recommendation`, `nextSteps[]`, `fullBriefing` |

---

## 9. Service Catalog

The Service Catalog (`/catalog`) maps the complete vision for the platform with 7 function areas:

| # | Function Area | Agents | Skills | Status |
|---|--------------|--------|--------|--------|
| 1 | Marketing | 3 | ~20 | 18 skills built (Agents 1.1, 1.2, 1.3) |
| 2-7 | (Future areas) | 24 | ~129 | Planned |
| | **Total** | **27** | **149** | |

### Status Legend
- **EXISTS** (green) — Fully implemented and functional
- **PLANNED** (blue) — Designed but not yet built
- **MISSING** (red) — Gap identified, needs design
- **PARTIAL** (yellow) — Partially implemented

### Priority Legend
- **HIGH** — Critical for launch
- **MEDIUM** — Important for complete functionality
- **LOW** — Nice to have

---

## 10. File Structure

```
poz-agent-main/
├── src/
│   ├── app/                          # Next.js App Router pages & API
│   │   ├── page.tsx                  # Root redirect → /dashboard
│   │   ├── layout.tsx                # Root layout — loads Bebas Neue + Inter globally
│   │   ├── globals.css               # Global styles
│   │   ├── dashboard/page.tsx        # Dashboard with KPIs
│   │   ├── posts/
│   │   │   ├── page.tsx              # Posts list
│   │   │   ├── new/page.tsx          # 3-step post creation wizard
│   │   │   └── [id]/page.tsx         # Post detail/editor
│   │   ├── calendar/page.tsx         # Content calendar
│   │   ├── templates/page.tsx        # Prompt template manager
│   │   ├── agent-catalog/page.tsx    # Carousel generator + PDF download
│   │   ├── catalog/page.tsx          # Service catalog browser (149 skills)
│   │   ├── agents/
│   │   │   ├── page.tsx              # Agents hub (3 cards)
│   │   │   └── [agentId]/page.tsx    # Agent detail (6 skill tabs)
│   │   ├── team/page.tsx             # Team management
│   │   ├── settings/page.tsx         # App settings
│   │   └── api/                      # API routes
│   │       ├── generate/route.ts     # OpenAI post generation
│   │       ├── posts/
│   │       │   ├── route.ts          # GET/POST posts
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET/PUT/DELETE post
│   │       │       ├── status/route.ts    # PATCH status
│   │       │       └── revisions/route.ts # GET/POST revisions
│   │       ├── agents/
│   │       │   ├── generate/route.ts      # OpenAI skill generation (18 skills)
│   │       │   ├── carousel-html/route.ts # Claude carousel HTML generator ★
│   │       │   └── outputs/
│   │       │       ├── route.ts           # GET/POST outputs
│   │       │       └── [id]/route.ts      # GET/PUT/DELETE output
│   │       ├── dashboard/stats/route.ts
│   │       ├── team/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── templates/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── settings/route.ts
│   │       └── calendar/route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Navigation sidebar
│   │   │   └── shell.tsx             # App shell wrapper
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── posts/
│   │   │   ├── post-status-badge.tsx
│   │   │   └── post-type-badge.tsx
│   │   └── agents/
│   │       ├── skill-form.tsx        # Reusable skill form wrapper
│   │       ├── skill-output.tsx      # Reusable output display
│   │       └── skills/               # 18 skill components
│   │           ├── content-calendar.tsx
│   │           ├── post-generation.tsx
│   │           ├── aeo-optimization.tsx
│   │           ├── seo-optimization.tsx
│   │           ├── repurposing.tsx
│   │           ├── performance-insight.tsx
│   │           ├── pov-framing.tsx
│   │           ├── deep-research.tsx
│   │           ├── argument-structuring.tsx
│   │           ├── long-form-asset.tsx
│   │           ├── council-review.tsx
│   │           ├── executive-summary.tsx
│   │           ├── competitor-profile.tsx
│   │           ├── signal-scanning.tsx
│   │           ├── trend-radar.tsx
│   │           ├── aeo-audit.tsx
│   │           ├── opportunity-mapping.tsx
│   │           └── briefing-pack.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts              # SQLite singleton (WAL mode)
│   │   │   ├── schema.ts             # 7 tables + indexes + seed data
│   │   │   ├── posts.ts              # Post CRUD + dashboard stats
│   │   │   ├── team.ts               # Team member CRUD
│   │   │   ├── templates.ts          # Prompt template CRUD
│   │   │   ├── settings.ts           # Key-value settings
│   │   │   └── agent-outputs.ts      # Agent output CRUD
│   │   ├── ai/
│   │   │   └── generate.ts           # Post generation (OpenAI Chat Completions)
│   │   ├── agents/
│   │   │   ├── types.ts              # AgentId, SkillId, AgentOutput types
│   │   │   ├── constants.ts          # 3 agents, 18 skills metadata
│   │   │   └── generate.ts           # Skill generation (18 prompts, web search)
│   │   ├── types.ts                  # Post, Dashboard types
│   │   ├── constants.ts              # Status labels, transitions
│   │   ├── catalog-data.ts           # Service catalog (149 skills)
│   │   ├── utils.ts                  # cn() helper
│   │   └── workflow.ts               # Workflow utilities
│   │
│   └── providers/
│       └── user-provider.tsx         # React Context for current user
│
├── Point One Zero Design System/     # Brand reference files (fonts, colors, layout)
│   ├── colors_and_type.css           # CSS variables for brand tokens
│   └── preview/                      # HTML preview files per component
│
├── public/
│   └── carousel-sample.html          # 5-slide POZ carousel visual reference
│
├── data/
│   └── social-media-agent.db         # SQLite database (auto-created)
│
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config (sqlite + @anthropic-ai/sdk external)
├── tailwind.config.ts                # Tailwind CSS config
├── .env.local                        # OPENAI_API_KEY + ANTHROPIC_API_KEY
├── README.md                         # Quick start guide
└── DOCUMENTATION.md                  # Full reference (this file)
```

### Key Files — Carousel System

| File | Purpose |
|------|---------|
| `src/app/api/agents/carousel-html/route.ts` | Anthropic API handler — archetype routing, 5 reference HTML templates, SYSTEM_PROMPT with POZ design rules, `buildSlidePrompt()` per archetype |
| `src/app/agent-catalog/page.tsx` | Carousel UI — `generateClaudeHtml()`, localStorage cache, `HtmlSlidePreview`, `downloadPdf()`, color override, redesign/retry buttons |
| `src/app/layout.tsx` | Loads Bebas Neue + Inter globally in `<head>` — critical for font availability before any carousel renders |
| `public/carousel-sample.html` | 5-slide static preview showing the exact POZ design output expected from Claude |
| `Point One Zero Design System/` | Brand source of truth — used to author the SYSTEM_PROMPT reference HTML |

---

## 11. Configuration & Environment

### Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | GPT-4o for post generation and 18 agent skills | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | Yes | claude-sonnet-4-6 for carousel HTML generation | `sk-ant-...` |

The OpenAI key can also be set via the Settings page (stored in `app_settings` table), which overrides the environment variable. The Anthropic key must be in `.env.local` — it is server-side only and never exposed to the browser.

### App Settings (Configurable via UI)

| Setting Key | Default Value | Description |
|-------------|---------------|-------------|
| `brand_name` | `POZ` | Injected into all AI prompts |
| `brand_voice` | `Professional yet approachable...` | Brand tone guidelines for AI |
| `default_model` | `gpt-4o` | OpenAI model for generation |
| `posts_per_week_target` | `5` | Weekly publishing goal |
| `openai_api_key` | *(empty)* | Optional override for env var |

### Running the Application

```bash
# Install dependencies
npm install

# Set up environment
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local

# Start development server
npm run dev

# The app will be available at http://localhost:3000
# SQLite database is auto-created at ./data/social-media-agent.db
# Default team members and templates are seeded on first run
```

---

## 12. Default Data & Seeding

On first database initialization, the following data is automatically seeded:

### Team Members (10)

| Name | Email | Role |
|------|-------|------|
| Shweta | shweta@poz.ai | Lead |
| Miguel | miguel@poz.ai | Member |
| Tejas | tejas@poz.ai | Member |
| Bhubesh | bhubesh@poz.ai | Member |
| Lakshman | lakshman@poz.ai | Member |
| Rucha | rucha@poz.ai | Designer |
| Karishma | karishma@poz.ai | Designer |
| Sridhar | sridhar@poz.ai | Member |
| Rajarajan | rajarajan@poz.ai | Member |
| Shagita | shagita@poz.ai | Member |

### Prompt Templates (4)

1. **Default Problem-Solution** — Hook with problem → agitate → solution → CTA
2. **Default Educational** — Surprising insight → teach framework → numbered takeaways
3. **Default Execution/Build** — Building/working on → challenge → concrete details → lesson
4. **Default Carousel** — Cover slide → 6-8 key point slides → CTA slide (JSON output)

---

*Updated May 7, 2026 | POZ Social Media Agent v0.2.0*
*v0.2.0 additions: LinkedIn Carousel Generator (Claude claude-sonnet-4-6), POZ Design System integration, PDF download, localStorage caching, carousel-html API route*
