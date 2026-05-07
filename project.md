# POZ Agent — Full Project Documentation

**Point One Zero (POZ)** — AI-powered LinkedIn content management platform  
Built with Next.js 16, Supabase, OpenAI GPT-4o, and Grok (X.AI)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Full Workflow Diagram](#3-full-workflow-diagram)
4. [Chat Agent Flow (Agent Catalog)](#4-chat-agent-flow-agent-catalog)
5. [Data Flow Diagram](#5-data-flow-diagram)
6. [Database Structure](#6-database-structure)
7. [API Reference](#7-api-reference)
8. [AI Agents & Skills](#8-ai-agents--skills)
9. [Tech Stack](#9-tech-stack)
10. [External API Integrations](#10-external-api-integrations)
11. [Authentication & Roles](#11-authentication--roles)
12. [File Upload & RAG Pipeline](#12-file-upload--rag-pipeline)
13. [Content Generation Pipeline](#13-content-generation-pipeline)
14. [Post Approval Workflow](#14-post-approval-workflow)
15. [Environment Variables](#15-environment-variables)
16. [Project File Structure](#16-project-file-structure)

---

## 1. Project Overview

POZ Agent is a full-stack Next.js web application that gives a 4-person AI consultancy team (Point One Zero) a private workspace to:

- **Generate** LinkedIn carousels, single posts, and weekly content calendars using AI
- **Research** real-time X/Twitter trends and web sources to ground content in live data
- **Review & approve** generated content through a structured team workflow
- **Ask questions** against uploaded documents (PDFs, DOCX, etc.) using RAG
- **Manage** the full post lifecycle from draft → design → publish

### Who Uses It

| Role | What They Do |
|------|-------------|
| `employee` | Create posts, ask AI agents, upload files |
| `admin` | Review all posts, manage settings, oversee workflow |
| `designer` | Pick up approved posts, move to ready-to-publish |
| `superadmin` | Full access, user management, system config |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React / Next.js)                    │
│                                                                     │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐    │
│  │  Agent       │  │  Posts         │  │  Team / Settings /   │    │
│  │  Catalog     │  │  Dashboard     │  │  Calendar / Admin    │    │
│  │  (Chat UI)   │  │  (Workflow)    │  │  (Management)        │    │
│  └──────┬───────┘  └───────┬────────┘  └──────────┬───────────┘    │
└─────────┼──────────────────┼───────────────────────┼───────────────┘
          │  Next.js API Routes (/api/...)            │
          ▼                  ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Node.js / Turbopack)             │
│                                                                     │
│  /api/agents/        /api/posts/        /api/team/                  │
│  generate            [id]/status        [id]                        │
│  chat                [id]/revisions     /api/auth/                  │
│  upload              [id]/comments      login / session / logout    │
│  rag                                                                │
│  trending            /api/settings/     /api/notifications/         │
│  chat-history        /api/dashboard/    /api/calendar/              │
│                      stats                                          │
└──────────┬───────────────────────────────────────────────────────┬──┘
           │                                                       │
           ▼                                                       ▼
┌──────────────────────┐                            ┌─────────────────────┐
│   src/lib/agents/    │                            │  src/lib/db/        │
│   generate.ts        │                            │  (Supabase client)  │
│                      │                            │                     │
│  SKILL_PROMPTS       │                            │  posts.ts           │
│  POZ_BRAND           │                            │  team.ts            │
│  Web research logic  │                            │  agent-outputs.ts   │
│  Trend fetch logic   │                            │  documents.ts       │
└──────────┬───────────┘                            │  settings.ts        │
           │                                        │  notifications.ts   │
     ┌─────┴──────┐                                 │  auth.ts            │
     ▼            ▼                                 └─────────┬───────────┘
┌─────────┐  ┌─────────┐                                     │
│ OpenAI  │  │  X.AI   │                                     ▼
│ GPT-4o  │  │  Grok   │                         ┌─────────────────────┐
│         │  │  + Live │                         │     SUPABASE        │
│ Chat    │  │  Search │                         │  (PostgreSQL)       │
│ Comple- │  │  + Web  │                         │                     │
│ tions   │  │  Search │                         │  team_members       │
└─────────┘  └─────────┘                         │  posts              │
                                                 │  agent_outputs      │
                                                 │  app_settings       │
                                                 │  notifications      │
                                                 └─────────────────────┘
```

---

## 3. Full Workflow Diagram

```
USER TYPES A MESSAGE IN AGENT CATALOG
              │
              ▼
┌─────────────────────────────────┐
│  PRIORITY CHECK 1               │
│  Are files currently uploading? │
└─────────────────────────────────┘
         │ YES                │ NO
         ▼                   ▼
  "Still uploading..."   ┌─────────────────────────────────┐
                         │  PRIORITY CHECK 2               │
                         │  Are documents ready (RAG)?     │
                         └─────────────────────────────────┘
                                  │ YES              │ NO
                                  ▼                  ▼
                         ┌──────────────┐   ┌──────────────────────────┐
                         │  RAG PATH    │   │  TREND TRIGGER CHECK     │
                         │  POST /api/  │   │  "trending / what's hot" │
                         │  agents/rag  │   └──────────────────────────┘
                         │              │          │ YES         │ NO
                         │  - Retrieve  │          ▼             ▼
                         │    chunks    │   ┌────────────┐  ┌──────────────┐
                         │  - GPT-4o    │   │ FETCH X    │  │ detectIntent │
                         │    answers   │   │ TRENDS via │  │ (client-side │
                         └──────────────┘   │ Grok API   │  │  regex)      │
                                            └────────────┘  └──────────────┘
                                                                   │
                                     ┌─────────────────────────────┤
                                     │                             │
                              intent found                  no intent
                                     │                             │
                                     ▼                             ▼
                         ┌─────────────────────┐         ┌────────────────┐
                         │  DIRECT ROUTE       │         │  CLAUDE ROUTER │
                         │  (carousel request? │         │  POST /api/    │
                         │   single post?      │         │  agents/chat   │
                         │   calendar?)        │         │  (GPT-4o JSON) │
                         └─────────────────────┘         └────────────────┘
                                     │                             │
                                     └─────────────┬───────────────┘
                                                   ▼
                         ┌────────────────────────────────────────────┐
                         │          INTENT RESOLVED                   │
                         │                                            │
                         │  daily-content  │  weekly-calendar         │
                         │  content-refiner│  topic-analysis          │
                         │  trending       │  reply                   │
                         └────────────────────────────────────────────┘
                                          │
                                          ▼
                         ┌────────────────────────────────────────────┐
                         │       CONTENT GENERATION PIPELINE          │
                         │       POST /api/agents/generate            │
                         │                                            │
                         │  1. Load app settings (model, brand voice) │
                         │  2. Fetch X trends (Grok live_search)      │
                         │  3. Fetch web research (Grok/OpenAI)       │
                         │  4. Build system + user prompt             │
                         │  5. Call OpenAI Chat Completions           │
                         │  6. Parse & return JSON result             │
                         └────────────────────────────────────────────┘
                                          │
                                          ▼
                         ┌────────────────────────────────────────────┐
                         │         AUTO REFINER (carousel only)       │
                         │  - Runs silent quality audit               │
                         │  - Rewrites if any slide scores < 8/10     │
                         └────────────────────────────────────────────┘
                                          │
                                          ▼
                               UI RENDERS RESULT CARD
                               (carousel / calendar / single post)
                                          │
                                          ▼
                         ┌────────────────────────────────────────────┐
                         │       USER SAVES / SENDS TO REVIEW         │
                         │  POST /api/agents/outputs  →  saved        │
                         │  POST /api/posts           →  review queue │
                         └────────────────────────────────────────────┘
```

---

## 4. Chat Agent Flow (Agent Catalog)

This is the heart of the application — the conversational AI interface.

### Step-by-Step Chat Processing

```
handleSend(text)
     │
     ├─► [1] RAG Guard
     │       ├─ uploading count > 0 AND no ready docs → show "still uploading" message
     │       └─ readyDocIds.length > 0 → POST /api/agents/rag → return answer
     │
     ├─► [2] Trend Guard
     │       └─ regex: /trend|trending|what.*trending/ → fetchAndShowTrends()
     │              └─ GET /api/agents/trending → Grok live_search → render XTrendsCard
     │
     ├─► [3] detectIntent(text) — client-side regex:
     │       ├─ "calendar / week / schedule"         → "weekly-calendar"
     │       ├─ "carousel / slides / multi-slide"    → "daily-content"
     │       ├─ "audit / refine / rate / review"     → "content-refiner"
     │       └─ "create / write / post / generate"   → "daily-content"
     │
     ├─► [4] If intent === "daily-content":
     │       ├─ isCarouselRequest(text) + slideCount known  → generateFromChat(slideCount)
     │       ├─ isCarouselRequest(text) + no count          → ask "how many slides?"
     │       └─ single page keywords                        → generateFromChat(singlePage)
     │
     ├─► [5] If no intent or needs routing → POST /api/agents/chat
     │       └─ GPT-4o returns JSON: { action, topic, isCarousel, slideCount, theme, text }
     │
     └─► [6] generateFromChat(intent, topic, opts) → POST /api/agents/generate
```

### Topic Extraction (Web Research & Content)

When the user sends a full instruction like *"create linkedin post about blockchain carousel 3 slides"*, the system strips out delivery instructions before searching:

```
Raw text:  "create the linkedin post to blockchain carousel format like 3 slide content"
           │
           ▼  (regex strip)
Clean topic: "blockchain"
           │
           ├─► Web research query: "blockchain" (finds blockchain tech sources)
           └─► Content topic:      "blockchain" (AI writes about blockchain, not LinkedIn tips)
```

---

## 5. Data Flow Diagram

```
┌──────────┐         ┌────────────────┐        ┌──────────────┐
│  BROWSER │ ──1──►  │  NEXT.JS API   │ ──2──► │  SUPABASE    │
│          │         │  ROUTE         │        │  (Database)  │
│          │ ◄──8──  │                │ ◄──3── │              │
└──────────┘         └───────┬────────┘        └──────────────┘
                             │ 4
                             ▼
                    ┌────────────────┐
                    │  generate.ts   │
                    │  (AI Engine)   │
                    └───────┬────────┘
                    5 ──────┼────── 6
                    ▼               ▼
             ┌──────────┐    ┌──────────┐
             │  OpenAI  │    │  X.AI    │
             │  GPT-4o  │    │  Grok    │
             │          │    │          │
             │  Chat    │    │  Live    │
             │  Comple- │    │  Search  │
             │  tions   │    │  + Web   │
             └────┬─────┘    └────┬─────┘
                  └──────┬────────┘
                         │ 7 (AI response)
                         ▼
                    ┌────────────────┐
                    │  JSON Parser   │
                    │  & Validator   │
                    └───────┬────────┘
                            └──────────► Back to API Route (step 8)

Flow:
1  Browser sends POST request with user message / form inputs
2  API route queries DB for settings (model, brand voice, user info)
3  DB returns settings and user data
4  API calls generate.ts with skillId + inputs
5  generate.ts calls OpenAI for content generation
6  generate.ts calls Grok for real-time trends + web research
7  AI responses returned to generate.ts
8  Parsed JSON result returned to browser
```

---

## 6. Database Structure

### Tables

#### `team_members`
Stores all user accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment primary key |
| `name` | text | Full name |
| `email` | text | Unique email address |
| `username` | text | Unique username |
| `password_hash` | text | bcrypt hashed password |
| `role` | text | Team role: `member` / `lead` / `designer` |
| `auth_role` | text | Access level: `employee` / `admin` / `designer` / `superadmin` |
| `created_at` | timestamptz | Account creation time |

#### `posts`
Stores all LinkedIn content posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment primary key |
| `title` | text | Post headline |
| `content` | text | Full post copy / caption |
| `post_type` | text | `problem_solution` / `educational` / `execution` / `carousel` |
| `status` | text | Workflow status (see Post Status below) |
| `platform` | text | Target platform (e.g. `linkedin`) |
| `author_id` | integer (FK) | References `team_members.id` |
| `assigned_designer_id` | integer (FK) | Nullable, references `team_members.id` |
| `scheduled_date` | timestamptz | Planned publish date |
| `published_url` | text | URL after publishing |
| `ai_prompt` | text | Original AI prompt used |
| `ai_model` | text | AI model used (e.g. `gpt-4o`) |
| `carousel_slides` | jsonb | JSON array of slide objects |
| `hashtags` | text | Comma-separated or JSON hashtags |
| `notes` | text | Internal notes |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update time |

#### `post_revisions`
Full version history for every post.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `post_id` | integer (FK) | References `posts.id` |
| `content` | text | Content snapshot at this revision |
| `revised_by` | integer (FK) | References `team_members.id` |
| `revision_type` | text | `ai_generated` / `manual_edit` / `ai_regenerated` |
| `created_at` | timestamptz | Revision timestamp |

#### `post_status_history`
Audit trail of every status change.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `post_id` | integer (FK) | References `posts.id` |
| `from_status` | text | Previous status (null on first) |
| `to_status` | text | New status |
| `changed_by` | integer (FK) | References `team_members.id` |
| `note` | text | Optional comment on change |
| `created_at` | timestamptz | Change timestamp |

#### `agent_outputs`
Stores all AI-generated skill outputs **and** RAG uploaded documents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `agent_id` | text | `content-authority` / `thought-leadership` / `market-intelligence` / `rag` |
| `skill_id` | text | Skill that produced this output |
| `title` | text | Display title |
| `input_params` | jsonb | JSON of the input parameters |
| `output_json` | jsonb | Full JSON output from AI / document text for RAG |
| `status` | text | `draft` / `finalized` / `archived` |
| `created_by` | integer (FK) | References `team_members.id` |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update time |

> **RAG Documents** use `agent_id = "rag"`, `skill_id = "rag-document"`, and store the extracted document text in `output_json`.

#### `app_settings`
Key-value configuration store.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `key` | text (unique) | Setting name (e.g. `ai_model`, `brand_voice`) |
| `value` | text | Setting value |
| `updated_at` | timestamptz | Last update time |

Key settings stored:
- `ai_model` — OpenAI model override (default: `gpt-4o`)
- `brand_voice` — Custom brand voice instructions
- `openai_api_key` — Optional stored API key

#### `notifications`
In-app notification system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `user_id` | integer (FK) | Recipient: references `team_members.id` |
| `type` | text | Notification category |
| `post_id` | integer (FK) | Nullable: related post |
| `message` | text | Notification text |
| `is_read` | boolean | Read/unread state |
| `created_by` | integer (FK) | Sender: references `team_members.id` |
| `created_at` | timestamptz | Creation time |

#### `post_comments`
Threaded comments on posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `post_id` | integer (FK) | References `posts.id` |
| `author_id` | integer (FK) | References `team_members.id` |
| `content` | text | Comment text |
| `created_at` | timestamptz | Creation time |

### Post Status Workflow

```
draft
  │
  ▼
submitted
  │
  ▼
under_review  ◄─── changes_requested (loop back to employee)
  │
  ▼
approved_for_design
  │
  ▼
design_in_progress
  │
  ▼
ready_to_publish
  │
  ▼
published
```

### Entity Relationship Diagram

```
team_members ──────< posts (author_id)
     │                │
     │                ├──< post_revisions (post_id)
     │                ├──< post_status_history (post_id)
     │                └──< post_comments (post_id)
     │
     ├──< agent_outputs (created_by)
     └──< notifications (user_id, created_by)

app_settings  (standalone key-value)
```

---

## 7. API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with `{ identifier, password }` → sets `poz-session` cookie |
| GET | `/api/auth/session` | Verify session → returns `{ user }` |
| POST | `/api/auth/logout` | Clear `poz-session` cookie |

### AI Agent Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/generate` | Run a skill. Body: `{ skillId, inputs }` |
| POST | `/api/agents/chat` | Intent router. Body: `{ message, history }` → returns `{ action, topic, ... }` |
| POST | `/api/agents/upload` | Upload file (multipart). Extracts text, stores as RAG doc. Returns `{ id, filename, chars }` |
| POST | `/api/agents/rag` | RAG query. Body: `{ question, doc_ids[] }` → GPT-4o answer |
| GET | `/api/agents/trending` | Fetch X/Twitter trends via Grok. Query: `?topic=...&count=10` |
| GET/POST | `/api/agents/outputs` | List own outputs / create output |
| GET/PUT/DELETE | `/api/agents/outputs/[id]` | Get / update / delete a single output |
| GET/POST | `/api/agents/chat-history` | Store and retrieve chat history |

#### `/api/agents/generate` — Body Schema

```json
{
  "skillId": "daily-post",
  "inputs": {
    "topic": "blockchain",
    "day": "Tuesday",
    "contentType": "Engagement Post",
    "slideCount": 3
  }
}
```

#### `/api/agents/chat` — Response Schema

```json
{
  "action": "daily-content",
  "topic": "blockchain",
  "isCarousel": true,
  "slideCount": 3,
  "theme": null,
  "hasContent": false,
  "text": null
}
```

### Post Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts. Filters: `?status=&type=&author_id=&search=` |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/[id]` | Get post with revisions + status history |
| PUT | `/api/posts/[id]` | Update post fields |
| DELETE | `/api/posts/[id]` | Delete post |
| PUT | `/api/posts/[id]/status` | Change post status. Body: `{ status, note }` |
| GET/POST | `/api/posts/[id]/revisions` | Get history / create revision |
| GET/POST | `/api/posts/[id]/comments` | Get / add comments |
| POST | `/api/posts/[id]/quick-publish` | Publish directly |

### Team & Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/team` | List / create team members |
| GET/PUT/DELETE | `/api/team/[id]` | Team member CRUD |
| GET/PUT | `/api/settings` | Read / update app settings |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET/POST | `/api/notifications` | Get / create notifications |
| PUT | `/api/notifications/[id]` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |

---

## 8. AI Agents & Skills

The system has three specialized agents, each with a set of skills.

### Agent 1.1 — Content Authority
*Colour: Blue | Icon: Edit*

| Skill ID | Purpose | Key Output |
|----------|---------|-----------|
| `daily-post` | Daily LinkedIn post (Framework A–E by day) | slides[], caption, hashtags, outreachHook |
| `content-calendar` | Full week content plan | 5 days × {type, topic, brief, hook, hashtags} |
| `linkedin-carousel` | 8-slide POZ-style carousel | slides[], scores, visualizationIdeas |
| `content-refiner` | 3-hat quality audit + rewrite | Slide-by-slide scoring, refined output |
| `post-generation` | Multi-format post (any type) | title, hook, body, CTA, hashtags |
| `aeo-optimization` | Answer Engine Optimization | FAQ pairs, schema markup, citation templates |
| `seo-optimization` | On-page SEO brief | titleTag, metaDescription, h1, headingStructure |
| `repurposing` | Transform content to new formats | Multi-format outputs (carousel, post, thread) |
| `performance-insight` | Engagement analysis | Top content patterns, improvement suggestions |

### Agent 1.2 — Thought Leadership
*Colour: Purple | Icon: Lightbulb*

| Skill ID | Purpose | Key Output |
|----------|---------|-----------|
| `pov-framing` | Contrarian POV development | Angles, narratives, argument structure |
| `deep-research` | Multi-source research synthesis | Research report with citations |
| `argument-structuring` | MECE argument building | Logic tree, structured argument |
| `long-form-asset` | Whitepaper / essay / report | Full document with headings, callouts |
| `council-review` | 3-reviewer AI council | Feedback from 3 distinct reviewer personas |
| `executive-summary` | C-level brief | Bullet summary, key decisions, actions |

### Agent 1.3 — Market Intelligence
*Colour: Emerald | Icon: Target*

| Skill ID | Purpose | Key Output |
|----------|---------|-----------|
| `competitor-profile` | Competitor analysis | Profile, strengths, weaknesses, messaging |
| `signal-scanning` | Market signal detection | News signals, job signals, earnings signals |
| `trend-radar` | Trend identification | Macro + micro trends with scoring |
| `aeo-audit` | AI visibility audit | AEO scorecard, competitor comparison |
| `opportunity-mapping` | Opportunity & gap analysis | White-space map, threats |
| `briefing-pack` | Stakeholder briefing doc | Structured briefing with context + actions |

### Daily Post Frameworks (Framework A–E)

The `daily-post` skill selects a framework based on the day of the week:

| Day | Framework | Type | Output |
|-----|-----------|------|--------|
| Monday | **A — Insight / Thought Leadership** | Carousel | 7 slides: Hook → Reframe → Shift → Why It Matters → POZ Observation → Question → CTA |
| Tuesday | **E — Engagement Post** | Single post | No slides. Sharp caption with open question |
| Wednesday | **B — Trend → Business Decision** | Carousel | 7 slides: Trend → Decision → Mistake → Right Move → Filter → POZ Question → CTA |
| Thursday | **C — Industry Listicle** | Carousel | 7 slides: Hook + 5 named insights + CTA |
| Friday | **D — Forward / Story** | Carousel | 5–7 slides: Hook → Context → Journey → Lesson → CTA |

> When a user explicitly requests a carousel on Tuesday, the system overrides Framework E and uses Framework A instead.

### POZ Brand Rules (Applied to Every Generation)

- **Audience**: CIOs, CTOs, CEOs, CPOs at mid-to-large companies
- **Tone**: Confident, sharp, intelligent, direct, authoritative, conversational
- **Forbidden words**: game-changer, revolutionary, unlock, synergy, transformative, cutting-edge, holistic, leverage
- **Slide title**: 4–6 words, declarative, never a question
- **Slide body**: 10–15 words, one sentence only
- **Caption openers** (one of three):
  - Option A: `"[Broken reality]. [That just changed.]"`
  - Option B: `"[Domain] is where [concept] actually [verb]. ✨"`
  - Option C: `"It's not about [obvious]. It's about [real thing]."`
- **Hashtags**: Always start with `#PointOneZero`

---

## 9. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 16.1.6 | React SSR/SSG, App Router, API routes |
| **UI Library** | React | 19.2.3 | Component rendering |
| **CSS Framework** | Tailwind CSS | 4.x | Utility-first styling |
| **UI Components** | Radix UI + shadcn/ui | 1.4.3 | Accessible unstyled primitives |
| **Icons** | Lucide React | 0.576.0 | SVG icon set |
| **Toasts** | Sonner | 2.0.7 | Toast notifications |
| **Theme** | next-themes | 0.4.6 | Dark/light mode |
| **Database** | Supabase (PostgreSQL) | 2.99.2 | Storage, auth, RLS |
| **ORM/Query** | Supabase JS client + `pg` | — | Database queries |
| **AI — Content** | OpenAI SDK | 6.25.0 | GPT-4o for all content generation |
| **AI — Trends** | X.AI Grok API | — | Live X/Twitter trend search |
| **Auth** | jose (JWT) | 6.2.1 | Session tokens in httpOnly cookies |
| **Password** | bcryptjs | 3.0.3 | Password hashing |
| **PDF Parsing** | pdfjs-dist (legacy) | — | Page-by-page text extraction |
| **DOCX Parsing** | mammoth | 1.12.0 | Word document text extraction |
| **Build Tool** | Turbopack | (Next.js 16) | Fast dev/build bundler |
| **Runtime** | Node.js | — | Server-side execution |

---

## 10. External API Integrations

### OpenAI (GPT-4o)

```
Endpoint:  https://api.openai.com/v1/chat/completions
Auth:      Authorization: Bearer $OPENAI_API_KEY
Model:     gpt-4o (configurable via app_settings.ai_model)

Used for:
  ├─ All skill content generation (daily-post, linkedin-carousel, etc.)
  ├─ Chat intent routing (/api/agents/chat)
  ├─ RAG document Q&A (/api/agents/rag)
  └─ Web research fallback (Responses API with web_search tool)

Typical request:
  {
    "model": "gpt-4o",
    "messages": [
      { "role": "system", "content": "POZ_BRAND + SKILL_PROMPT" },
      { "role": "user",   "content": "Topic: blockchain, Day: Tuesday, slideCount: 3" }
    ],
    "temperature": 0.7,
    "max_tokens": 4000,
    "response_format": { "type": "json_object" }
  }
```

### X.AI Grok (Real-time Web + X/Twitter)

```
Endpoint:  https://api.x.ai/v1/chat/completions
Auth:      Authorization: Bearer $XAI_API_KEY
Model:     grok-3-latest (configurable via XAI_MODEL env var)

Used for:
  ├─ Trend discovery: /api/agents/trending
  │    Tool: live_search + sources:[{type:"web"}]
  │    Returns: 12+ credible X sources, last 7 days
  │
  └─ Web research: generate.ts (WEB_RESEARCH_SKILLS)
       Tool: live_search + sources:[{type:"web"}]
       Returns: 20+ sources, keyInsights, contextSummary

Typical request:
  {
    "model": "grok-3-latest",
    "messages": [{ "role": "user", "content": "Search web for: blockchain" }],
    "tools": [{ "type": "live_search", "sources": [{ "type": "web" }] }],
    "temperature": 0.2,
    "max_tokens": 8000
  }
```

### Supabase

```
Client-side (anon key):  NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
Server-side (service):   SUPABASE_SECRET_KEY (bypasses RLS)

Connection:
  ├─ getDb()      → Supabase JS client (anon, respects RLS)
  └─ getAdminDb() → Supabase JS client (service role, bypasses RLS)

Used for:
  ├─ All database reads & writes (posts, team, outputs, settings)
  ├─ Row Level Security (data isolation per user)
  └─ Realtime (notifications, if configured)
```

---

## 11. Authentication & Roles

### Session Flow

```
1. User submits login form → POST /api/auth/login
2. Server queries team_members by email or username
3. bcryptjs.compare(password, password_hash)
4. If valid → jose.SignJWT({ userId, authRole }).setExpirationTime("7d")
5. Set httpOnly cookie: poz-session = <jwt>
6. Client calls refreshUser() → GET /api/auth/session
7. API verifies JWT → extracts userId, authRole
8. Returns { user: TeamMember }

Every protected API route:
  - Reads poz-session cookie
  - Calls verifyToken() → { userId, authRole }
  - Injects x-user-id and x-auth-role headers for downstream use
```

### Role Permissions

| Feature | employee | admin | designer | superadmin |
|---------|----------|-------|----------|------------|
| Create / view own posts | ✓ | ✓ | ✓ | ✓ |
| View all posts | — | ✓ | — | ✓ |
| Approve / reject posts | — | ✓ | — | ✓ |
| Mark design complete | — | — | ✓ | ✓ |
| Manage team members | — | — | — | ✓ |
| Change app settings | — | ✓ | — | ✓ |
| Use AI agents | ✓ | ✓ | ✓ | ✓ |

---

## 12. File Upload & RAG Pipeline

### Supported File Types

| Format | Extension | Parser |
|--------|-----------|--------|
| PDF | `.pdf` | `pdfjs-dist/legacy` (page-by-page) |
| Word | `.docx`, `.doc` | `mammoth` |
| Plain text | `.txt`, `.md` | Direct read |
| Data | `.csv`, `.json` | Direct read |
| Code | `.js`, `.ts`, `.jsx`, `.tsx`, `.py` | Direct read |
| Markup | `.xml`, `.yaml`, `.html` | Direct read |

### RAG Upload Pipeline

```
User attaches file
       │
       ▼
POST /api/agents/upload (multipart FormData)
       │
       ▼
Text Extraction:
  PDF   → pdfjs-dist: iterate pages → getTextContent() → join items
  DOCX  → mammoth.extractRawText() → value
  Other → buffer.toString("utf-8")
       │
       ▼
Truncate to 60,000 characters
       │
       ▼
INSERT into agent_outputs:
  agent_id   = "rag"
  skill_id   = "rag-document"
  title      = filename
  output_json = { content: extractedText, filename }
       │
       ▼
Returns: { id: number, filename: string, chars: number }
```

### RAG Query Pipeline

```
User types question while documents are attached
       │
       ▼
POST /api/agents/rag
  { question, doc_ids: [1, 2, 3] }
       │
       ▼
For each doc_id:
  SELECT output_json FROM agent_outputs WHERE id = doc_id
  → extractedText
       │
       ▼
retrieveRelevantChunks(content, question, maxChars=12000)
  1. Split text on double newlines → paragraphs
  2. If < 5 paragraphs (e.g. PDF single-line): group every 8 lines
  3. Score each chunk by keyword overlap with question
  4. Return top-scoring chunks up to 12,000 chars
       │
       ▼
Build context string: [doc1 chunks] + [doc2 chunks] + ...
       │
       ▼
POST to OpenAI:
  system: "Answer based on documents only. If not found, say so."
  user:   "Question: [question]\n\nDocuments:\n[context]"
  max_tokens: 2000
       │
       ▼
Return answer to chat UI
```

---

## 13. Content Generation Pipeline

### Inside `generate.ts` — Execution Order

```
POST /api/agents/generate
  { skillId: "daily-post", inputs: { topic, day, slideCount } }
         │
         ▼
1. Load settings from DB
   ├─ ai_model (default: gpt-4o)
   ├─ brand_voice (custom instructions)
   └─ stored openai_api_key (if no env var)
         │
         ▼
2. X/Twitter Trend Fetch (CHAT_TREND_SKILLS: content-calendar, daily-post)
   ├─ Extract search query from inputs
   ├─ POST to https://api.x.ai/v1/chat/completions
   │    model: grok-3-latest, tools: live_search
   │    → 12+ credible X sources, last 7 days
   └─ Parse: sources[], highLevelTrends[], keyDataPoints[]
         │
         ▼
3. Web Research (WEB_RESEARCH_SKILLS: daily-post)
   ├─ Clean topic (strip delivery instructions: "create linkedin post about...")
   ├─ POST to Grok (primary) or OpenAI Responses API (fallback)
   │    → 20+ web sources, keyInsights[], contextSummary
   └─ Merge into trendingContext for prompt injection
         │
         ▼
4. Build Prompt
   ├─ systemPrompt = POZ_BRAND_GUIDELINES + SKILL_PROMPTS[skillId].systemPrompt
   ├─ userPrompt  = buildUserPrompt(inputs) with trendingContext injected
   └─ If carousel requested: prepend CAROUSEL OVERRIDE block
         │
         ▼
5. Call OpenAI Chat Completions
   ├─ model: gpt-4o (or configured model)
   ├─ temperature: 0.7
   ├─ response_format: json_object
   └─ max_tokens: 4000
         │
         ▼
6. Parse JSON response
   ├─ day, contentType, topic, angle, framework
   ├─ slides[]: [{ position, type, title, body }]
   ├─ caption, hashtags[], outreachHook
   ├─ trendInsights[], visualizationIdeas[]
   └─ _xTrends, _webSources (attached from pre-fetch)
         │
         ▼
7. Return to API route → return to browser
```

### Auto Refiner (Carousel Quality Gate)

For carousel outputs (slides.length > 1), a silent quality audit runs before the result is shown:

```
Generated carousel
       │
       ▼
autoRefineContent(daily)
  POST /api/agents/generate
    skillId: "content-refiner"
    inputs: { content: formattedSlides }
       │
       ▼
3-Hat Scoring:
  Hat 1 — C-Suite Executive (CIO/CPO/CEO)
  Hat 2 — LinkedIn Algorithm
  Hat 3 — POZ Content Specialist
       │
       ▼
If any slide < 8/10 → rewrite that slide
       │
       ▼
Return refined output
  (shown as "Here you go:" with content-refiner result type)
```

---

## 14. Post Approval Workflow

This is the human workflow layer that operates independently of the AI generation.

```
Employee creates post (AI or manual)
              │ status: draft
              ▼
Employee clicks "Submit for Review"
              │ status: submitted
              ▼
Admin / Lead reviews post
  ├─ Approve → status: approved_for_design
  └─ Request Changes → status: changes_requested
              │              │
              │              ▼
              │       Employee revises
              │              │ status: submitted (loop)
              ▼
Designer picks up post
              │ status: design_in_progress
              ▼
Designer marks design complete
              │ status: ready_to_publish
              ▼
Admin / Employee publishes
              │ status: published
              │ post.published_url = "..."
              ▼
Done
```

Each status change:
- Creates a `post_status_history` record
- Sends `notifications` to relevant team members
- Is visible in the post detail view timeline

---

## 15. Environment Variables

```bash
# ── Database ────────────────────────────────────────────────────────
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

# ── Supabase ────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SECRET_KEY=<service_role_key>        # Server-side only (bypasses RLS)

# ── Authentication ──────────────────────────────────────────────────
JWT_SECRET=<random_64_char_string>            # Signs session tokens

# ── AI APIs ─────────────────────────────────────────────────────────
OPENAI_API_KEY=<openai_key>                   # For all content generation + RAG
XAI_API_KEY=<grok_key>                        # For X/Twitter trends + web research
XAI_MODEL=grok-3-fast                         # Optional (default: grok-3-latest)
```

| Variable | Required | Used In |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Database migrations (`npm run db:migrate`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All DB reads/writes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client-side Supabase queries |
| `SUPABASE_SECRET_KEY` | Yes | Server-side admin operations |
| `JWT_SECRET` | Yes | Login / session verification |
| `OPENAI_API_KEY` | Yes* | AI generation (can also be stored in `app_settings`) |
| `XAI_API_KEY` | No | Trend fetching (gracefully disabled if missing) |
| `XAI_MODEL` | No | Defaults to `grok-3-latest` |

---

## 16. Project File Structure

```
poz-agent-main/
├── public/
│   └── poz-logo.svg                # POZ brand logo (two overlapping rounded squares)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout: ThemeProvider + UserProvider
│   │   ├── page.tsx                # Home redirect
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx            # Split-panel login page
│   │   │
│   │   ├── agent-catalog/
│   │   │   └── page.tsx            # Main chat UI (6000+ lines)
│   │   │
│   │   ├── agents/
│   │   │   ├── page.tsx            # Agent listing
│   │   │   └── [agentId]/
│   │   │       └── page.tsx        # Individual agent view
│   │   │
│   │   ├── posts/
│   │   │   └── page.tsx            # Post dashboard
│   │   │
│   │   ├── dashboard/page.tsx      # Stats dashboard
│   │   ├── calendar/page.tsx       # Content calendar view
│   │   ├── content-status/page.tsx # Content pipeline view
│   │   ├── team/page.tsx           # Team management
│   │   ├── settings/page.tsx       # App settings
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── session/route.ts
│   │       │   └── logout/route.ts
│   │       │
│   │       ├── agents/
│   │       │   ├── generate/route.ts   # Skill generation (calls generate.ts)
│   │       │   ├── chat/route.ts       # Intent router
│   │       │   ├── upload/route.ts     # File upload + text extraction
│   │       │   ├── rag/route.ts        # RAG document Q&A
│   │       │   ├── trending/route.ts   # X/Twitter trend fetch
│   │       │   ├── outputs/route.ts
│   │       │   ├── outputs/[id]/route.ts
│   │       │   └── chat-history/route.ts
│   │       │
│   │       ├── posts/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── status/route.ts
│   │       │       ├── revisions/route.ts
│   │       │       ├── comments/route.ts
│   │       │       └── quick-publish/route.ts
│   │       │
│   │       ├── team/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       │
│   │       ├── settings/route.ts
│   │       ├── dashboard/stats/route.ts
│   │       ├── notifications/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── read-all/route.ts
│   │       ├── calendar/route.ts
│   │       └── admin/cleanup/route.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts            # Supabase client factory
│   │   │   ├── auth.ts             # Auth queries
│   │   │   ├── posts.ts            # Post CRUD
│   │   │   ├── agent-outputs.ts    # Output storage
│   │   │   ├── team.ts             # Team CRUD
│   │   │   ├── documents.ts        # RAG chunk retrieval
│   │   │   ├── settings.ts         # Settings key-value
│   │   │   ├── notifications.ts    # Notification CRUD
│   │   │   ├── comments.ts         # Comment CRUD
│   │   │   ├── chat-history.ts     # Chat session storage
│   │   │   └── templates.ts        # Prompt templates
│   │   │
│   │   ├── agents/
│   │   │   ├── constants.ts        # AGENTS array (3 agents, 21 skills)
│   │   │   ├── generate.ts         # SKILL_PROMPTS + full generation engine
│   │   │   ├── types.ts            # AgentId, SkillId, OutputStatus types
│   │   │   ├── poz-brand.ts        # POZ brand guidelines (injected globally)
│   │   │   └── skill-architectures.ts  # Skill metadata + loading levels
│   │   │
│   │   ├── auth.ts                 # JWT helpers (signToken, verifyToken)
│   │   ├── types.ts                # Post, TeamMember, Notification interfaces
│   │   ├── utils.ts                # cn() and other utilities
│   │   ├── workflow.ts             # Workflow state machine helpers
│   │   ├── catalog-data.ts         # Catalog UI metadata
│   │   └── constants.ts            # App-wide constants
│   │
│   ├── components/
│   │   ├── agents/
│   │   │   ├── CarouselVisual.tsx
│   │   │   ├── SkillArchitectureView.tsx
│   │   │   ├── skill-form.tsx
│   │   │   ├── skill-output.tsx
│   │   │   └── skills/            # 20+ skill-specific UI components
│   │   ├── layout/
│   │   │   ├── shell.tsx
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── posts/
│   │   │   ├── post-status-badge.tsx
│   │   │   └── post-type-badge.tsx
│   │   └── ui/                    # shadcn/ui base components
│   │
│   └── providers/
│       └── user-provider.tsx       # UserContext + useUser() hook
│
├── next.config.ts                  # turbopack: {}, serverExternalPackages: [pdfjs-dist]
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── WORKFLOW.md                     # Detailed workflow documentation
└── project.md                      # This file
```

---

*Last updated: 2026-05-05 | POZ Agent v2 | Point One Zero*
