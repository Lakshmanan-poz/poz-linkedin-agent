# POZ Agent — Content Generation Workflow

**Last updated:** 2026-05-15
**Status:** Verified against live code. RAG file upload. PDF extraction via pdfjs-dist. Login page redesigned. 18 skills total. Trending UI workflow, carousel-html (Anthropic), timeout fixes, directAction bypass, content-refiner paste guard all added.

---

## The Correct Workflow (What the System Does)

```
USER GIVES TOPIC  ──OR──  USER UPLOADS FILE(S)
      │                          │
      │                          ▼
      │               RAG PATH (priority — runs before all other checks)
      │               Upload → /api/agents/upload → pdfjs-dist extraction
      │               → stored in agent_outputs (agent_id="rag")
      │               → ask questions → /api/agents/rag → GPT-4o answers
      │
      ▼
STEP 1 — Fetch X/Twitter Trends (Grok, last 2 days)
      │   Up to 20 sources, ranked by authority + velocity
      │
      ▼
STEP 2 — User Selects Intent
      │
      ├── Weekly Calendar ──→ STEP 3A: X trends only → content-calendar skill
      │                              Monday → Friday plan
      │
      └── Single Post / Carousel ──→ STEP 3B: X trends
                                           + Web search (20+ sources, Grok → OpenAI fallback)
                                           → daily-post skill (Framework A–E)
                                                 ↓
                                      STEP 4: Content Refiner (SKILL.md — 6-step audit)
                                                 ↓
                                      STEP 5: Deliver to user (publishReady >= 9.5)
```

---

## Full Request Processing Pipeline (System Architecture)

```
USER INPUT (Prompt / Topic / Question / File Upload)
                ↓
        AgentCatalog Interface
        (src/app/agent-catalog/page.tsx)
                ↓
     ┌──────────────────────────────────────────────────────┐
     │  PRIORITY CHECK 1 — Files uploading?                │
     │  → warn user to wait, return early                  │
     │                                                      │
     │  PRIORITY CHECK 2 — Ready documents attached?       │
     │  readyDocIds.length > 0                             │
     │  → POST /api/agents/rag (BYPASSES all other routing)│
     │  → GPT-4o answers from document content only        │
     │  → return (no intent detection, no skills)          │
     └──────────────────────────────────────────────────────┘
                ↓ (no docs attached)
     6-Layer Routing (checked in strict order — first match wins)
        │
        ├── LAYER 1 — directAction bypass
        │     topic card click → handleSend(topic, "carousel")
        │     → clears any pendingQ → immediate 8-slide carousel, no router called
        │
        ├── LAYER 2 — pendingQ state machine (trend workflow)
        │     trend-topic-pick  → user picked a topic number/text
        │     trend-more        → user wants more topics (fetches fresh batch)
        │     trend-format      → user chose Single Page or Carousel
        │     trend-slides      → user chose slide count → generate
        │     paste-content     → user pasted content after being asked
        │     slide-count       → legacy clarification
        │
        ├── LAYER 3 — Trend regex  (local, no API call)
        │     /trend|trending|today.*topic|.../ → GET /api/agents/trending
        │
        ├── LAYER 4 — detectIntent()  (local function, no API call)
        │     content-refiner  → checks for 80+ char pasted content first
        │                         if none → asks user to paste → pendingQ
        │     weekly-calendar  → generate directly
        │     topic-analysis   → calls chat router with research prefix
        │     daily-content    → generate directly (carousel/single/default)
        │
        ├── LAYER 5 — POST /api/agents/chat  (GPT-4o, temperature: 0.3, max_tokens: 1500)
        │     Only reached when layers 1-4 all miss
        │     Returns: daily-content / weekly-calendar / content-refiner /
        │              trending / topic-analysis / reply
        │
        └── LAYER 6 — reply fallback
              routed.text shown as chat bubble, or FALLBACK_REPLY constant
                ↓
        🧠 Hidden Thinking Layer  (INTERNAL — never shown in UI)
        ├── Understand intent & classify action
        ├── Select required tools (X search / web search / none)
        └── Plan execution order
                ↓
        Tool Execution Layer  (src/lib/agents/generate.ts)
        ├── OpenAI Chat           → General Reply (no skill)
        ├── X API / Grok          → X/Twitter Trends (12+ sources, last 7 days)
        ├── Web Search            → Grok live_search → OpenAI Responses API (fallback)
        └── Skills Engine         → generateSkillOutput({ skillId, inputs })
                ↓
        Data Processing
        ├── X trends merged into trendingContext
        ├── Web research merged (daily-post only — NOT content-calendar)
        └── Inputs validated + user prompt built
                ↓
     Content Structuring
        ├── [1] POZ_BRAND_GUIDELINES  (poz-brand.ts — always first)
        ├── [2] Skill system prompt   (SKILL_PROMPTS[skillId])
        └── [3] Brand Voice DB setting (app_settings.brand_voice — if set)
                ↓
        Auto Refiner  (content-refiner skill — triggered if user pastes content)
        ├── 3-hat scoring: C-Suite / Algorithm / Specialist
        ├── Slide-by-slide audit: pass / fix / fail
        ├── Rewrite all fix + fail slides
        └── publishReady = true ONLY if score >= 9.5
                ↓
        🎯 Direct Output Generator  (STRICT MODE — GPT-4o, temperature: 0.8)
        ├── Chat Completions + json_object   → deterministic skills
        └── Responses API + web_search tool  → real-time data skills
                ↓
         UI Response  (ONLY FINAL ANSWER — src/app/agent-catalog/page.tsx)
        ├── CarouselResultCard    → slides[]
        ├── CalendarResultCard    → days[]
        ├── TrendCard             → _xTrends sources + signals
        ├── WebSourcesCard        → _webSources[]
        ├── Slide audit cards     → refined.slides[] (Fixed / Unchanged)
        ├── publishReady gate     → publish indicator
        └── RAG answer bubble     → plain text from GPT-4o + doc context
```

---

## Path R — RAG Document Q&A (Priority Path)

When one or more files are attached and ready, **every** user message is answered from the documents — no intent detection, no skill routing.

### Step 1 — File Upload
File: `src/app/agent-catalog/page.tsx` → `handleFileUpload()`

```
User selects file(s)  (1–5 files, max 5MB each)
  → Placeholder chips shown immediately (animate-pulse, "uploading…")
  → POST /api/agents/upload  multipart/form-data { files[], session_id }
  → Placeholders replaced with real doc IDs + blue ✓ chip
  → Error chip (red) shown if extraction fails
```

Accepted formats: `.pdf  .docx  .doc  .txt  .md  .csv  .json  .js  .ts  .html  .xml  .yaml  .yml`

---

### Step 2 — Text Extraction
File: `src/app/api/agents/upload/route.ts`

| Format | Method |
|---|---|
| `.pdf` | `pdfjs-dist/legacy/build/pdf.mjs` — page-by-page `getTextContent()`, Node.js compatible, no browser APIs |
| `.docx` / `.doc` | `mammoth.extractRawText({ buffer })` |
| `.txt`, `.md`, `.csv`, `.json`, code files | `file.text()` direct read |

```
rawText → slice(0, 60 000 chars) → storeDocument()
  → INSERT INTO agent_outputs (agent_id="rag", skill_id="doc-{session_id}",
      title=filename, input_params={filename,file_type,session_id},
      output_json={content})
  → returns { id: number, filename, chars }
```

No new table required — documents are stored in the existing `agent_outputs` table with `agent_id = "rag"` as identifier.

---

### Step 3 — RAG Query
File: `src/app/api/agents/rag/route.ts`

```
POST /api/agents/rag
Body: { question: string, doc_ids: number[], history?: [{role, content}] }

→ getDocumentsByIds(doc_ids)   — SELECT FROM agent_outputs WHERE agent_id="rag" AND id IN (...)
→ retrieveRelevantChunks(content, question, 12000)
      · Split on double newlines (well-formatted text)
      · If < 5 paragraphs → group single-newline lines into 8-line chunks (PDF style)
      · Score each chunk by keyword overlap with question
      · Return top chunks up to 12 000 chars per document
→ Build system prompt with full document context
→ GPT-4o  temperature: 0.3  max_tokens: 2000
→ Returns { answer: string, doc_count: number }
```

---

### Step 4 — RAG Routing in UI
File: `src/app/agent-catalog/page.tsx` → `handleSend()`

```
Priority order (checked BEFORE trend regex or intent detection):

1. uploadingCount > 0  AND  readyDocIds.length === 0
   → add agent message: "Files still uploading — please wait"
   → return

2. readyDocIds.length > 0
   → POST /api/agents/rag  with { question: raw, doc_ids, history }
   → show "Searching N file(s)…" loading bubble
   → replace with GPT answer
   → return   ← no further routing
```

---

## Path A — Agent Chat (Primary Path)

### Step 1 — User Types Topic in Chat
File: `src/app/agent-catalog/page.tsx`

```
POST /api/agents/chat
Body: { message: string, history: [{ role, content }] }
```

---

### Step 2 — Intent Router Classifies the Message
File: `src/app/api/agents/chat/route.ts`

GPT-4o reads the message at `temperature: 0.3`, returns one structured action:

| What user says | Action | skillId used |
|---|---|---|
| Topic / "write a post" / "make a carousel" | `daily-content` | `daily-post` |
| "weekly plan" / "content calendar" / "what should I post this week" | `weekly-calendar` | `content-calendar` |
| Pastes content + "audit" / "refine" / "rate this" / "make this 10/10" | `content-refiner` | `content-refiner` |
| "what's trending" / "AI topics" / "give me ideas" | `trending` | (separate route) |
| Question / greeting / unclear | `reply` | (no generation) |

---

### Step 3 — UI Dispatches to Generation
File: `src/app/agent-catalog/page.tsx` → `generateFromChat()`

| Action | API call |
|---|---|
| `daily-content` | `POST /api/agents/generate` `{ skillId: "daily-post", inputs }` |
| `weekly-calendar` | `POST /api/agents/generate` `{ skillId: "content-calendar", inputs }` |
| `content-refiner` | `POST /api/agents/generate` `{ skillId: "content-refiner", inputs }` |
| `trending` | `GET /api/agents/trending` → Grok X search (standalone) |
| `topic-analysis` | Research text returned in `routed.text` from chat router (no generation) |
| `reply` | Rendered as chat bubble — no generation call |

---

### Step 4 — Auth Check
File: `src/app/api/agents/generate/route.ts`

```
Verify JWT cookie (poz-session) → 401 if missing or invalid
→ calls generateSkillOutput({ skillId, inputs })
```

---

### Step 5 — generateSkillOutput() — Core Engine
File: `src/lib/agents/generate.ts`

#### 5A — X Trend Search  *(content-calendar + daily-post)*
```
CHAT_TREND_SKILLS = { "content-calendar", "daily-post" }

Topic → Grok X search (XAI_API_KEY required)
  · Scans last 2 days of X/Twitter posts
  · Minimum 12 credible sources
  · Ranked by: source authority, cross-account convergence,
    velocity, enterprise relevance, content gap
  · Second pass if < 12 sources returned

Output stored as trendingContext (X signal block)
Output returned as _xTrends → rendered in chat UI as TrendCard

If XAI_API_KEY not set → status: "no-key", graceful fallback
```

#### 5B — Web Research  *(daily-post ONLY — not content-calendar)*
```
WEB_RESEARCH_SKILLS = { "daily-post" }

Topic → Grok web_search (primary, XAI_API_KEY)
       → OpenAI Responses API web_search (fallback)
  · Minimum 20 distinct web sources
  · Extracts: keyInsights, contextSummary, top 10 source snippets

MERGED with X trend context — not overwritten:
  "--- X/Twitter trend signals ---"    ← from Step 5A
  "--- Web research summary ---"       ← from Step 5B
  "Key research findings: ..."
  "Top sources: ..."

content-calendar receives X trends only (Step 5A) — no web research.

Output stored as params.inputs.trendingContext
Output returned as _webSources → rendered as WebSourcesCard in chat UI
```

#### 5C — Build System Prompt  *(layered, in this order)*
```
[1] POZ_BRAND_GUIDELINES          poz-brand.ts
     · Tone: confident, sharp, conversational authority
     · Signature openers: State Change / Revelation / Contrast
     · Forbidden words: game-changer, revolutionary, unlock, leverage...
     · Emoji: ONE at end of caption Line 1 only (✨)
     · Hashtag: #PointOneZero always first
     · Visual: dark-first #050517, Bebas Neue / Inter, 3-colour max

[2] Skill system prompt           SKILL_PROMPTS[skillId]
     · Slide formula (4–6 word title, 10–15 word body, <25 words total)
     · 3-hat scoring (C-Suite / Algorithm / Specialist)
     · Day frameworks A–E
     · Two real POZ post reference examples
     · (content-refiner) Full 6-step SKILL.md audit process

[3] brandVoice DB setting         app_settings table
     · Prepended as "Brand Voice: ..." if set
```

Applies to `BRAND_LAYER_SKILLS` = `{ daily-post, linkedin-carousel, content-refiner, content-calendar }`

#### 5D — Build User Prompt
```
buildUserPrompt(inputs)
+ trendingContext appended (X trends + web research — merged block)
```

#### 5E — Call OpenAI

| Skills | API | Why |
|---|---|---|
| `WEB_SEARCH_SKILLS`: content-calendar, linkedin-carousel, deep-research, signal-scanning, trend-radar, competitor-profile, aeo-audit, aeo-optimization, opportunity-mapping, briefing-pack, performance-insight | Responses API + `web_search` tool | Real-time data |
| All other skills | Chat Completions + `json_object` mode | Deterministic JSON |

```
model:       gpt-4o  (or default_model / ai_model from app_settings)
temperature: 0.8     (intent router uses 0.3)
```

#### 5F — Response Shape (daily-post / carousel)
```json
{
  "day": "Monday",
  "framework": "A (Insight / Thought Leadership)",
  "topic": "...",
  "angle": "...",
  "slides": [
    { "position": 1, "type": "Hook", "title": "...", "body": "..." }
  ],
  "caption": "...",
  "hashtags": ["PointOneZero", "..."],
  "bodyPost": "...",
  "outreachHook": "...",
  "trendInsights": [],
  "visualizationIdeas": [...],
  "_webSources": [...],
  "_xTrends": { "status": "ok", "sources": [...], "highLevelTrends": [...] }
}
```

---

### Step 6 — Content Refiner (SKILL.md — 6-Step Audit)
File: `src/lib/agents/generate.ts` → `content-refiner` skill

Triggered automatically when user pastes content and asks for audit, OR manually selected.

#### The 6-Step Process (from SKILL.md):

```
STEP 1 — Read all content completely
         Take in all slides, caption, audience/brand context

STEP 2 — Score slide by slide under all 3 hats
         Hat 1: C-Suite Executive (CIO/CPO/CEO, 30-second window)
                → Does it give something they didn't know?
                → Kills: generic claims, bullet fragments, corporate speak
         Hat 2: LinkedIn Algorithm (dwell, saves, comments)
                → 4–6 seconds dwell per slide minimum
                → Kills: fragments <1 sec to read, no CTA hook
         Hat 3: LinkedIn Content Specialist (B2B growth)
                → Structure: hook → mechanism → shift → implication → CTA
                → Kills: long sentences, vague claims, warm-up language

STEP 3 — Calculate overall score (honest — never inflate)

STEP 4 — Populate slideAudits
         verdict = "pass"   all three hat scores ≥ 9
         verdict = "fix"    any hat score 7–8.9
         verdict = "fail"   any hat score < 7

STEP 5 — Rewrite every slide with verdict "fix" or "fail"
         · status: "Fixed" or "Unchanged" per slide
         · note: one line explaining what changed
         · Body must always expand the title — never independent thought

STEP 6 — Final re-validation under all 3 hats
         · State new overall score in finalNote
         · State remaining gap in remainingGap
         · publishReady = true ONLY if new score >= 9.5
```

#### Scoring Reference:
| Score | Meaning | publishReady |
|---|---|---|
| 9.5–10 | Ready to publish. Outperforms 90% of content. | `true` |
| 8.5–9.4 | Strong. 1–2 targeted fixes needed. | `false` |
| 7–8.4 | Good foundation. 3–4 rewrites needed. | `false` |
| 5–6.9 | Directionally right, execution fails. | `false` |
| < 5 | Structural issues. Rebuild from formula. | `false` |

---

### Step 6B — Carousel HTML Generation (Visual Slides)
File: `src/app/api/agents/carousel-html/route.ts`

Triggered from the Agent Catalog UI when a carousel result has slides and the user views the carousel preview.

```
POST /api/agents/carousel-html
Body: { slides: Slide[], topic: string }

→ For each slide: Anthropic claude-sonnet-4-6  max_tokens: 8096
→ All slides generated in parallel (Promise.all)
→ Archetype routing per slide position:
     position 1 or type "hook/cover" → COVER  (ink canvas #050517)
     type "list/reframe"             → LIST   (white canvas)
     type "stat/depth/number"        → STAT   (white canvas)
     type "quote/principle"          → QUOTE  (ink canvas)
     last slide or type "cta"        → CTA    (blue canvas #009FF0)
→ Returns { slides: [{ ...slide, slideHtml: string }] }

maxDuration: 120s  (Anthropic 8096 tokens × up to 8 slides)
ANTHROPIC_API_KEY required
```

POZ Design rules enforced:
- Fonts: Bebas Neue (display, ALL CAPS) + Inter (body)
- Canvases: Ink #050517 / White #FFFFFF / Blue #009FF0
- No gradients, no blur, no colored shadows, no position:absolute on children
- Eyebrow chips: white-space:nowrap, max 3 words

---

### Step 7 — UI Renders Result
File: `src/app/agent-catalog/page.tsx`

| Response field | Rendered as |
|---|---|
| `slides[]` | CarouselResultCard |
| `caption` | Caption block in chat |
| `hashtags[]` | Hashtag chips (always starts #PointOneZero) |
| `bodyPost` | LinkedIn post body text |
| `outreachHook` | DM/comment hook line |
| `_webSources[]` | WebSourcesCard above result |
| `_xTrends` | TrendCard with source handles + signals |
| `days[]` (calendar) | CalendarResultCard |
| `refined.slides[]` (refiner) | Slide audit cards with Fixed/Unchanged status |
| `publishReady` (refiner) | Publish gate indicator |

---

## Path B — Posts / New (Legacy Path)

### Step 1 — User Input
File: `src/app/posts/new/page.tsx`

Three-step UI flow:
1. Select post type: `problem_solution` | `educational` | `execution` | `carousel`
2. Enter topic + optional context + slide count (carousel: 3–15)
3. Preview, edit, save as draft

---

### Step 2 — Generate Call
```
POST /api/generate
Body: { topic, post_type, additional_context, slide_count }
```

---

### Step 3 — Auth + Route
File: `src/app/api/generate/route.ts`

```
Verify JWT cookie (poz-session) → 401 if missing
→ calls generatePost({ topic, postType, additionalContext, slideCount })
```

---

### Step 4 — generatePost() → buildPrompt()
File: `src/lib/ai/generate.ts`

```
1. DB template (prompt_templates table, by postType)
   OR getDefaultSystemPrompt(postType)
2. + brandVoice setting (if set in app_settings)
3. + POZ_BRAND_GUIDELINES  ← always prepended as hard prefix
```

Default prompt structure per post type:

| Type | Structure |
|---|---|
| `problem_solution` | State Change / Contrast opener → specific problem → POZ perspective → question CTA |
| `educational` | Revelation frame → contrarian insight → mechanism breakdown → takeaway → question CTA |
| `execution` | Unexpected outcome → one-line context → what shifted → transferable lesson → question CTA |
| `carousel` | Slide-by-slide: title 4–6 words, body 10–15 words, never bullet fragments |

---

### Step 5 — OpenAI Call
```
Chat Completions + json_object mode
model: gpt-4o (or DB setting)
temperature: 0.8

Returns:
· Non-carousel → GeneratedPost  { title, hook, body, callToAction, hashtags, fullPost }
· Carousel     → GeneratedCarousel { title, slides[], closingSlide, captionText, hashtags }
```

---

### Step 6 — Preview, Edit, Save
```
editedTitle   ← data.title
editedContent ← data.fullPost (post) OR data.captionText (carousel)
slides        ← data.slides[] read-only cards (carousel only)
hashtags      ← data.hashtags[] chips

→ POST /api/posts  { title, content, post_type, author_id,
                     ai_prompt, ai_model, hashtags, carousel_slides }
→ redirect to /posts/{id}
```

---

## Brand Layer — poz-brand.ts

Single source of truth. Injected into every generation call across both paths.

```
poz-brand.ts
      │
      │  BRAND_LAYER_SKILLS (agents/generate.ts)
      ├──→  daily-post           ✅  X trends + web research + brand
      ├──→  linkedin-carousel    ✅  web search + brand
      ├──→  content-refiner      ✅  brand + 6-step SKILL.md audit
      ├──→  content-calendar     ✅  X trends + web search + brand
      │
      │  Hard prefix in buildPrompt() (ai/generate.ts)
      └──→  all post types       ✅  brand always first
```

### What poz-brand.ts enforces on every call:

| Rule | Value |
|---|---|
| Tone | Confident, sharp, direct, conversational authority |
| Opener patterns | State Change / Revelation ("actually") / Contrast ("Not X. It IS Y.") |
| Forbidden words | game-changer, revolutionary, unlock, leverage, synergy, transformative... |
| Emoji policy | ONE emoji at end of caption Line 1 only (✨) — never in slides |
| Hashtag | `#PointOneZero` always first — mandatory on every post |
| Visual | Dark-first #050517, Bebas Neue headers, Inter body, max 3 colours per slide |
| Hard rule | Never fabricate data — return `[]` over invented claims |

---

## POZ Tone & Voice — Reference

Derived from real POZ LinkedIn posts. Two reference examples are embedded in `daily-post` and `linkedin-carousel` skill prompts.

### Real POZ Post 1 — Revelation Frame
```
Opener:  "Design is where intelligence actually takes shape. ✨"
Pattern: [Domain] is where [concept] actually [verb].
Signal:  "actually" = others miss this
```

### Real POZ Post 2 — State Change Frame
```
Opener:  "Workflow ownership just changed. That's not a prediction — it's already happening."
Pattern: [Broken reality]. [That just changed.]
Signal:  Immediate tension, no warm-up
```

### Three Opener Patterns (use one per post):
| Pattern | Structure | Example |
|---|---|---|
| State Change | `[Current broken reality]. [That just changed.]` | "Most teams automate tasks. Workflow ownership just moved to the agent." |
| Revelation | `[Domain] is where [concept] actually [verb]. ✨` | "Design is where intelligence actually takes shape." |
| Contrast | `It's not about [surface]. It's about [real thing].` | "It's not about building fast. It's about defining intent before sprint one." |

---

## Changes — Session 3 (2026-05-15)

| # | Area | Change |
|---|---|---|
| 1 | Avatar | Topic cards now load real X/Twitter profile images via `unavatar.io/x/{handle}`; letter circle shown as CSS fallback on error |
| 2 | Topic card click | `handleSend(topic, "carousel")` directAction bypass added — fires before all pendingQ checks, clears any active pendingQ, generates 8-slide carousel immediately |
| 3 | Operator precedence | Fixed `routed.action === "daily-content" \|\| routed.action === "topic-analysis" && routed.topic` — added parentheses so topic-analysis routes correctly |
| 4 | Content-refiner | Hard-matched path now checks for 80+ char pasted content before generating; if none → asks user to paste and sets pendingQ |
| 5 | Chat route | `maxDuration = 30` added; OpenAI call wrapped with `AbortSignal.timeout(25_000)`; `max_tokens` raised 512 → 1500 for full topic-analysis research |
| 6 | carousel-html route | `maxDuration = 120` added (was defaulting to 30s — caused guaranteed timeout on every carousel) |
| 7 | rag route | `maxDuration = 60` added |
| 8 | trending route | `maxDuration = 30` added; `max_tokens: 2000` added to xAI request body |
| 9 | Frontend fetches | `AbortSignal.timeout(25_000)` on `askChatRouter`; `AbortSignal.timeout(55_000)` on all three `generateFromChat` calls |

---

## Changes — Session 2 (2026-05-04)

| # | Area | Change |
|---|---|---|
| 1 | RAG | New feature: file upload (1–5 files) + document Q&A in Agent Catalog |
| 2 | RAG | PDF extraction rewritten to use `pdfjs-dist/legacy` (Node.js compatible, no DOMMatrix/canvas) |
| 3 | RAG | Documents stored in existing `agent_outputs` table (`agent_id="rag"`) — no new table needed |
| 4 | RAG | `retrieveRelevantChunks` improved: handles single-newline PDF text, 12k char context window |
| 5 | RAG | RAG routing moved to TOP of `handleSend` — fires before trend regex and intent detection |
| 6 | RAG | Guard added: if files still uploading, warn user to wait before sending question |
| 7 | Web Research | Fixed `[web-research/grok] HTTP 422` — switched from `/v1/responses` + `web_search` to `/v1/chat/completions` + `live_search` |
| 8 | Agent Catalog | Copy buttons added to all content refiner outputs (per-slide, caption, hashtags, Copy All) |
| 9 | Agent Catalog | Score banner: replaced "Needs refinement" warning + verdict text with inline Score Details (3-hat verdicts + finalNote) |
| 10 | Posts / New | Replaced 4-card post-type grid with 2-button selector: Single Page / Carousel |
| 11 | Posts / New | Added "Send to Review" button to manual write, carousel write, and AI preview forms |
| 12 | Posts / New | Fixed state-reset bug — entering manual/AI mode now clears all previous form state |
| 13 | Posts / New | Fixed carousel write form — added per-slide title + body builder, caption, hashtags |
| 14 | Login | Full redesign: split-panel layout, POZ brand blue `#00AAEC`, show/hide password, gradient button |
| 15 | Login | Added POZ company logo SVG (`public/poz-logo.svg`) — two overlapping rounded squares with evenodd transparent intersection |
| 16 | Config | `next.config.ts`: added `turbopack: {}` (Next.js 16 default) + `serverExternalPackages: ["pdfjs-dist"]` |

---

## Bugs Fixed in This Session

| # | File | Problem | Fix |
|---|---|---|---|
| 1 | `agents/generate.ts` | `CHAT_TREND_SKILLS` was empty — X trends never fed into content generation | Added `daily-post` + `content-calendar` to `CHAT_TREND_SKILLS` |
| 2 | `agents/generate.ts` | Web research overwrote X trend context for `daily-post` | `applyWebSources()` now merges both contexts under labelled headers |
| 3 | `agents/generate.ts` | `content-calendar` buildUserPrompt had no `trendingContext` field | Added X trends injection to calendar prompt |
| 4 | `agents/generate.ts` | `publishReady` threshold was `>= 8.5` | Changed to `>= 9.5` to match SKILL.md |
| 5 | `agents/generate.ts` | `content-refiner` missing SKILL.md 6-step audit process | Full 6-step process, common failures table, updated caption formula added |
| 6 | `agents/generate.ts` | `BRAND_LAYER_SKILLS` used wrong gate (`CHAT_TREND_SKILLS` — empty) | Created dedicated `BRAND_LAYER_SKILLS` set — brand now always injected |
| 7 | `ai/generate.ts` | Legacy path never imported `poz-brand.ts` | Added import + hard prefix injection in `buildPrompt()` |
| 8 | `ai/generate.ts` | Default prompts said "Use emojis 1-3 max" — broke POZ rules | Rewritten to POZ-aligned 3-pattern openers |
| 9 | `api/generate/route.ts` | No auth check — unauthenticated calls accepted | Added JWT cookie verification (same as agents route) |
| 10 | `poz-brand.ts` | Tone said "never casual" — real posts are conversational | Updated to "conversational authority, not cold broadcasting" |
| 11 | `poz-brand.ts` | No emoji allowed anywhere — real posts use ✨ | Updated: ONE emoji allowed at end of caption Line 1 only |
| 12 | `poz-brand.ts` | No `#PointOneZero` hashtag mandate | Added as hard rule: always first hashtag |
| 13 | `linkedin-carousel` | GPT-5.4-Cyber used as reference — not a real POZ post | Replaced with actual POZ Design Intelligence post + Workflow post |
| 14 | `daily-post` | No reference examples | Added both real POZ posts with "what makes them work" breakdown |

---

## Skill Map

### Agent 1.1 — Content & Authority
| Skill | Trigger | Brand | X Trends | Web Search |
|---|---|---|---|---|
| `daily-post` | "write a post", topic in chat | ✅ | ✅ Grok (12+ sources) | ✅ Grok + OpenAI (20+ sources) — merged |
| `linkedin-carousel` | carousel request | ✅ | ❌ | ✅ OpenAI Responses API |
| `content-refiner` | "audit / refine / rate / improve this" | ✅ | ❌ | ❌ |
| `content-calendar` | "weekly plan / calendar" | ✅ | ✅ Grok (12+ sources) | ✅ OpenAI Responses API |
| `post-generation` | direct skill | ❌ | ❌ | ❌ |
| `repurposing` | direct skill | ❌ | ❌ | ❌ |
| `performance-insight` | direct skill | ❌ | ❌ | ✅ |
| `aeo-optimization` | direct skill | ❌ | ❌ | ✅ |
| `seo-optimization` | direct skill | ❌ | ❌ | ❌ |

### Agent 1.2 — Thought Leadership
| Skill | Brand | X Trends | Web Search |
|---|---|---|---|
| `pov-framing` | ❌ | ❌ | ❌ |
| `deep-research` | ❌ | ❌ | ✅ |
| `argument-structuring` | ❌ | ❌ | ❌ |
| `long-form-asset` | ❌ | ❌ | ❌ |
| `council-review` | ❌ | ❌ | ❌ |
| `executive-summary` | ❌ | ❌ | ❌ |

### Agent 1.3 — Market Intelligence
| Skill | Brand | X Trends | Web Search |
|---|---|---|---|
| `competitor-profile` | ❌ | ❌ | ✅ |
| `signal-scanning` | ❌ | ❌ | ✅ |
| `trend-radar` | ❌ | ❌ | ✅ |
| `aeo-audit` | ❌ | ❌ | ✅ |
| `opportunity-mapping` | ❌ | ❌ | ✅ |
| `briefing-pack` | ❌ | ❌ | ✅ |

---

## API Route Timeouts

| Route | maxDuration | External call | Client fetch timeout |
|---|---|---|---|
| `POST /api/agents/chat` | 30s | OpenAI GPT-4o, AbortSignal 25s | `askChatRouter`: AbortSignal 25s |
| `GET /api/agents/trending` | 30s | xAI Grok, AbortController 10s | `fetchAndShowTrends`: AbortController 13s |
| `POST /api/agents/generate` | 60s | OpenAI via generateSkillOutput | `generateFromChat`: AbortSignal 55s |
| `POST /api/agents/rag` | 60s | OpenAI GPT-4o | none |
| `POST /api/agents/carousel-html` | 120s | Anthropic claude-sonnet-4-6 | none |

---

## Key Files

| File | Role |
|---|---|
| `src/lib/agents/poz-brand.ts` | Brand guidelines — single source of truth for tone, voice, visual, hashtag |
| `src/lib/agents/generate.ts` | Core generation engine — all 18 skills, X trends, web research, brand injection |
| `src/lib/agents/types.ts` | SkillId, AgentId, AgentOutput type definitions |
| `src/lib/ai/generate.ts` | Legacy generation path — posts/new page |
| `src/lib/db/documents.ts` | RAG document storage — storeDocument, getDocumentsByIds, retrieveRelevantChunks |
| `src/app/api/agents/generate/route.ts` | Agent generation API (auth-protected) |
| `src/app/api/agents/chat/route.ts` | Intent router — classifies user message into action |
| `src/app/api/agents/trending/route.ts` | Standalone Grok X trend search |
| `src/app/api/agents/upload/route.ts` | RAG file upload — PDF/DOCX/text extraction + DB storage |
| `src/app/api/agents/rag/route.ts` | RAG Q&A — fetch docs, chunk retrieval, GPT-4o answer |
| `src/app/api/generate/route.ts` | Legacy generation API (auth-protected) |
| `src/app/agent-catalog/page.tsx` | Main chat UI — RAG priority + intent → dispatch → render |
| `src/app/posts/new/page.tsx` | Create post UI — Single Page / Carousel, Send to Review |
| `src/app/login/page.tsx` | Login page — split-panel layout, POZ brand |
| `public/poz-logo.svg` | POZ company logo — two overlapping rounded squares, evenodd fill |
| `next.config.ts` | Next.js config — turbopack, serverExternalPackages (pdfjs-dist) |
| `migration.sql` | Full DB schema including agent_catalog_chat_history + messages tables |
| `WORKFLOW.md` | This document |

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | agents/generate.ts, ai/generate.ts, agents/rag/route.ts | Content generation + RAG answers (GPT-4o) |
| `ANTHROPIC_API_KEY` | agents/carousel-html/route.ts | Visual HTML slide generation (claude-sonnet-4-6) |
| `XAI_API_KEY` | agents/generate.ts, agents/trending/route.ts | Grok X trend search + Grok live_search web research |
| `XAI_MODEL` | agents/generate.ts, agents/trending/route.ts | Grok model override (trending default: `grok-3-latest`, generate default: `grok-4-fast-reasoning`) |
| `NEXT_PUBLIC_SUPABASE_URL` | src/lib/db/index.ts | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | src/lib/db/index.ts | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | src/lib/db/index.ts | Supabase service role key (admin — bypasses RLS) |
| `JWT_SECRET` | src/lib/auth.ts | JWT signing/verification for session cookies |
| `COOKIE_NAME` | all API routes | JWT cookie name for auth verification |

### DB Settings (`app_settings` table):
| Key | Default | Purpose |
|---|---|---|
| `openai_api_key` | — | Fallback if `OPENAI_API_KEY` env not set |
| `default_model` | `gpt-4o` | OpenAI model override |
| `brand_name` | `POZ` | Prepended to system prompt |
| `brand_voice` | — | Prepended as "Brand Voice: ..." if set |
