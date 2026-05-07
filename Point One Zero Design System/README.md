# Point One Zero — Design System

Point One Zero (POZ) is an **AI-native strategy and design organization** that builds products, reimagines experiences, and accelerates growth. This design system codifies the brand so any team — or AI agent — can produce on-brand artifacts: slides, mocks, marketing pages, product UI, social posts.

> **Source of truth:** this folder. If something conflicts with a screenshot or a stray file, the rules here win.

---

## Index

| Path | What it is |
| --- | --- |
| `README.md` | This file. Brand context + content/visual/iconography foundations. |
| `SKILL.md` | Agent-skill entry point. Tells an agent how to use this system. |
| `colors_and_type.css` | CSS custom properties for every color, font, size, space, radius, shadow, and motion token. Import first. |
| `fonts/` | Webfont files (or Google Fonts import notes). |
| `assets/` | Logo marks, wordmarks, brand guide, placeholder imagery. |
| `preview/` | Small HTML cards that populate the Design System tab. |
| `ui_kits/marketing-site/` | Hi-fi click-through of the POZ marketing site (hero, work, services, contact). |
| `scraps/` | Sliced brand guide — reference only, safe to ignore. |

---

## Source materials

All context for this system came from a single brand deliverable provided by the user:

- **`uploads/brand.jpg`** — a one-page brand bible (1920×12756). Covers colours, charts, typography, grids, icons, imagery, content checklist. Re-sliced into `scraps/brand-slice-*.png` for readability; full file preserved at `assets/brand-guide.jpg`.
- **`uploads/logo mark black.png`**, **`logo mark white.png`** — interlocking-square logomark in two values.
- **`uploads/Point-one-zero-White-png.png`**, **`POZ-Black-Font.png`** — full wordmark in two values.

No codebase, Figma, or live site was shared. UI kit choices are grounded in the brand guide and the company description — they are plausible extrapolations, not replicas.

---

## Who POZ is

> An AI-native strategy and design organization that builds products, reimagines experiences, and accelerates growth.

Three takeaways that drive every design decision:

1. **AI-native, not AI-decorated.** The brand doesn't lean on AI clichés (glowing orbs, purple gradients, generative blobs). It leans on *rigor* — grids, a tight type scale, restricted palette.
2. **Strategy + design as one discipline.** Copy should sound like a partner who's already seen the answer, not a vendor pitching.
3. **Accelerate growth.** Confidence, motion, forward-lean. Zero filler.

---

## Content fundamentals

**Voice.** Confident, quiet, premium. We sound like a small senior team that's already done the thinking. No breathless AI-startup energy.

**Tone dial.** Minimal → Bold → Direct. Never cute, never corporate-chummy, never hype.

**Rules pulled directly from the brand guide:**

- **6–10 words per slide** — text density stays *minimal*. If a sentence won't fit, the slide is wrong.
- **Lowercase bullets.** Bullet points start lowercase. Bullets are short phrases, not sentences. Example, verbatim from the guide:
  > - use a limited palette: 1 primary, 1 accent, neutrals
  > - avoid gradients unless approved
- **Bold italic for emphasis inside body copy.** Only one or two emphasis beats per block. Example: "maintain ***consistent hierarchy***", "always use multiples of 8 for ***spacing***".
- **UPPERCASE, tracked eyebrow labels.** Section tags like `COLOUR GUIDELINES`, `TEXT GUIDELINES`, `ICON SET`, `IMAGERY` are all-caps with extra letter-spacing (~0.16em) in Inter semibold gray.
- **British spelling is accepted** (the guide uses "colour"). Stay consistent within a piece.
- **No emoji.** None appear anywhere in the brand guide. Don't add them.
- **No exclamation points** unless the Caption icon specifically calls for one. Period.
- **"We" and "you", sparingly.** Prefer declarative statements over personal pronouns. "maintain consistent hierarchy" not "you should maintain consistent hierarchy".

**Quality check — 4 questions every piece must pass** (from the guide):
- is the message ***clear in 3 seconds***?
- does the design look ***premium***, not busy?
- is the tone ***consistent***?
- does this post ***feel like 2025***?

**Checklist every piece must clear:** brand colors only · correct typography · consistent spacing · no spelling errors · visuals follow style · caption follows tone · CTA is simple and specific · post adds value → not filler.

**Sample on-brand lines:**
- "your vision. our mission." (marketing tagline format)
- "strategy, design, and systems — shipped."
- "we build the things we'd want to use."
- "less, but sharper."

---

## Visual foundations

### Colors

Two blues + a blue-black ink + a neutral ramp. That's the whole palette.

| Role | Token | Hex |
| --- | --- | --- |
| Primary (cyan blue) | `--poz-blue` | `#009FF0` |
| Accent (electric blue) | `--poz-blue-electric` | `#0041E6` |
| Ink (near-black w/ blue cast) | `--poz-ink` | `#050517` |
| White | `--poz-white` | `#FFFFFF` |
| Neutral 50 | `--poz-n-50` | `#F6F6F6` |
| Neutral 100 | `--poz-n-100` | `#EEEEEE` |
| Neutral 200 | `--poz-n-200` | `#D9D9D9` |
| Neutral 300 | `--poz-n-300` | `#BEBEC9` |
| Neutral 400 | `--poz-n-400` | `#848492` |
| Neutral 500 | `--poz-n-500` | `#555562` |
| Neutral 600 | `--poz-n-600` | `#292937` |

**Rules:** 1 primary, 1 accent, neutrals. **Avoid gradients unless approved.** Use the ink (`#050517`) for dark sections rather than pure black — it has a subtle blue cast that reads more intentional.

### Typography

| Role | Family | Size (guide) | Notes |
| --- | --- | --- | --- |
| Display 1 | Bebas Neue | 185px | LS 0%, LH 100% |
| Display 2 | Bebas Neue | 144px | LS -1%, LH 100% |
| H1 | Bebas Neue | 120px | LS 0%, LH 100% |
| H2 | Bebas Neue | 100px | LS 2%, LH 100% |
| Caption | Bebas Neue (uppercase, tracked) | 30px | LS 10% |
| Body 1 | Inter | 44px | LS -1%, LH 120% |
| Body 2 | Inter | 27px | — |
| Body 3 | Inter | 21px | — |
| Body 4 | Inter | 10–16px | Guide shows 10; for web use 14–16. |

**Text guidelines (verbatim):** maintain ***consistent hierarchy*** · line spacing must be generous · no neon text, no drop shadows, no 3D text · ***never center-align long paragraphs*** · never center-align data like % · always include ***breathing space around text*** · always use multiples of 8 for ***spacing*** (8px, 16px, 24px…).

**Font substitution note:** Bebas Neue and Inter are both on Google Fonts and load from there in `colors_and_type.css`. No substitution is needed. If the user ships a licensed weight bundle later, drop it into `fonts/` and update the `@font-face` block.

### Spacing

**Multiples of 8 only.** 8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160, 200. No `5px`, no `13px`, no "eyeballed" values. Exposed as `--s-1` through `--s-12`.

**Grid specs (for social, from guide):**
- LinkedIn grid: margin 40px · gutter 24px · rows 4 · columns 2
- Story grid: x-margin 40px · y-margin 250px · gutter 24px · rows 4 · columns 2

### Backgrounds

- **Flat fills dominate.** White, ink, and primary blue are the three canvases.
- **No gradients unless approved.** Hard rule from the guide.
- **Full-bleed hero blocks** of solid blue or ink with the logomark centered are the signature layout.
- **No patterns, no textures, no grain filters.** The visual weight comes from type and negative space.

### Imagery

**Photography direction** (verbatim from guide):
- natural light > artificial
- candid > posed
- screens with aesthetic lighting & hand shots
- avoid over-saturated filters
- stay away from heavy vignettes, borders, frames

**Content direction:** use ***icons***, not clipart. Images must be ***high-resolution***. Avoid stock images that look ***plain & boring***. If using illustrations, keep them ***consistent in style (flat, monochrome)***.

Color vibe of imagery: **neutral, honest, slightly warm natural light.** Think "mid-afternoon on a good laptop" not "over-saturated Instagram."

### Borders & shadows

- **Borders:** 1px, neutral 200 (`#D9D9D9`) by default. Avoid rounded-corner + colored-left-accent combinations — the guide has none.
- **Shadows:** used sparingly. Three levels in tokens; flat is the default. No neon glows, no inner shadows, no 3D.
- **Corner radii:** mostly square. Cards can use 4–8px. Pills for small status/tag chips. The logomark's inner corner is ~12%.

### Motion

- **Short and calm.** 120ms for micro-interactions, 200ms for standard state changes, 400ms for page-level transitions.
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out) for entrances; `cubic-bezier(0.4, 0, 0.2, 1)` for in-out.
- **No bounces, no overshoot.** The brand is minimal; motion should match.
- **Hover:** slight darken (ink goes to 90% opacity, primary → electric), no scale-up.
- **Press:** shrink by 2% OR saturate the fill. Pick one per component and stay consistent.

### Transparency & blur

- **Used almost never.** Flat opaque fills are preferred.
- Acceptable use: a 70–90% ink overlay over photography for text legibility, or a light neutral scrim over imagery in cards.
- **No frosted glass** (backdrop-blur) — it dates the design.

### Cards

- White fill, 1px `--border-1` border, `--radius-md` (4px) corners, `--shadow-1` by default.
- Padding is a multiple of 8 — typically 24 or 32.
- No colored left-border accent. No drop shadow trick. Keep them quiet.

### Layout rules

- **Fixed nav** on marketing site: 72px tall, white bg, 1px bottom border, logomark left + word-nav right.
- **Max content width:** 1280px for marketing, 1440px for app shells.
- **Section padding:** 128px top/bottom on marketing heroes, 80px for standard sections.
- **Never center-align long paragraphs.** Left-align is the default for reading flow.

---

## Iconography

**The brand's built-in icon set.** The guide includes a large pictographic icon sheet organized into five groups: **Basic**, **Commerce**, **Leisure**, **Technology**, **Wellness**, plus an **Arrows** set. Icons are **solid, flat, single-weight, single-color white-on-dark or ink-on-light** — no two-tone, no outlines, no gradients.

**Our approach:**
- **Primary substitution: [Lucide](https://lucide.dev)** is currently in use via CDN for UI kits. Lucide is *outline* style, which does NOT match the brand guide's solid pictographs. **This is a flagged substitution.**
- **Ideal (flagged request to user):** a solid-filled pictographic set closer to the guide. Options: [Font Awesome Solid](https://fontawesome.com), [Material Symbols Filled](https://fonts.google.com/icons), or the original POZ icon sheet exported as SVGs. If you have the source icon font, drop it in `fonts/` and we'll switch.
- **Unicode / emoji:** never. No emoji appear in the brand guide.
- **PNG icons:** avoid. SVG only, so stroke/fill stays crisp at every scale.

**Usage rules:**
- One color per icon. No color-pair icons.
- Match the icon's visual weight to surrounding type. With Inter body at 16px, use 20px icons.
- Icons align to the type baseline in inline contexts, centered in buttons.

---

## Getting started

```html
<link rel="stylesheet" href="/path/to/colors_and_type.css">
```

Then use the tokens:

```css
.hero {
  background: var(--bg-dark);
  color: var(--fg-on-dark);
  padding: var(--s-10) var(--s-6);
}
.hero h1 {
  /* inherits H1 defaults from colors_and_type.css */
  color: var(--poz-blue);
}
```

Or jump straight to the UI kit: open `ui_kits/marketing-site/index.html`.

---

## Caveats / open questions

- **Icon set is a substitution.** We're using Lucide (outline) via CDN because no solid-filled set was provided. See *Iconography* above.
- **No production code or Figma was shared**, so the marketing-site UI kit is derived from brand-guide principles, not a live site recreation. If a real site exists, please share the URL or repo and we'll align.
- **Body 4 size** in the guide is 10px, which is too small for accessible web UI. We've mapped `--fs-body-4` to 16px for web contexts. The original 10px value is preserved in the type-specimen card for print/social fidelity.
- **Fonts load from Google Fonts CDN.** If licensing or offline use is required, ship `.woff2` files in `fonts/` and add `@font-face` declarations.
