# POZ Agent — Content Generation Workflow

**Last updated:** 2026-05-02
**Status:** Verified against live code. Content-calendar uses X trends only (not web research). 18 skills total.

---

## The Correct Workflow (What the System Does)

```
USER GIVES TOPIC
      │
      ▼
STEP 1 — Fetch X/Twitter Trends (Grok, last 7 days)
      │   12+ credible sources, ranked by authority + velocity
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
USER INPUT (Prompt / Topic / Question)
                ↓
        AgentCatalog Interface
        (src/app/agent-catalog/page.tsx)
                ↓
     Intent Detection Layer  —  POST /api/agents/chat  (temperature: 0.3)
        ├── General Chat          → reply (chat bubble, no generation)
        ├── Trend Request         → POST /api/agents/trending (Grok X search)
        ├── Topic Analysis        → daily-content → daily-post skill
        ├── Content Creation      → weekly-calendar → content-calendar skill
        └── Content Refiner       → content-refiner → 6-step SKILL.md audit
                ↓
        🧠 Hidden Thinking Layer  (INTERNAL — never shown in UI)
        ├── Understand intent & classify action
        ├── Select required tools (X search / web search / none)
        └── Plan execution order
                ↓
        Tool Execution Layer  (src/lib/agents/generate.ts)
        ├── OpenAI Chat           → General Reply (no skill)
        ├── X API / Grok          → X/Twitter Trends (12+ sources, last 7 days)
        ├── Web Search            → Grok web_search → OpenAI Responses API (fallback)
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
        └── publishReady gate     → publish indicator
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
| `trending` | `POST /api/agents/trending` → Grok X search (standalone) |
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
  · Scans last 7 days of X/Twitter posts
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

## Key Files

| File | Role |
|---|---|
| `src/lib/agents/poz-brand.ts` | Brand guidelines — single source of truth for tone, voice, visual, hashtag |
| `src/lib/agents/generate.ts` | Core generation engine — all 18 skills, X trends, web research, brand injection |
| `src/lib/agents/types.ts` | SkillId, AgentId, AgentOutput type definitions |
| `src/lib/ai/generate.ts` | Legacy generation path — posts/new page |
| `src/app/api/agents/generate/route.ts` | Agent generation API (auth-protected) |
| `src/app/api/agents/chat/route.ts` | Intent router — classifies user message into action |
| `src/app/api/agents/trending/route.ts` | Standalone Grok X trend search |
| `src/app/api/generate/route.ts` | Legacy generation API (auth-protected) |
| `src/app/agent-catalog/page.tsx` | Main chat UI — intent → dispatch → render |
| `src/app/posts/new/page.tsx` | Legacy create post UI |
| `WORKFLOW.md` | This document |

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | agents/generate.ts, ai/generate.ts | Content generation (GPT-4o) |
| `XAI_API_KEY` | agents/generate.ts | Grok X trend search + Grok web research |
| `XAI_MODEL` | agents/generate.ts | Grok model override (default: `grok-3-fast`) |
| `COOKIE_NAME` | all API routes | JWT cookie name for auth verification |

### DB Settings (`app_settings` table):
| Key | Default | Purpose |
|---|---|---|
| `openai_api_key` | — | Fallback if `OPENAI_API_KEY` env not set |
| `default_model` | `gpt-4o` | OpenAI model override |
| `brand_name` | `POZ` | Prepended to system prompt |
| `brand_voice` | — | Prepended as "Brand Voice: ..." if set |
