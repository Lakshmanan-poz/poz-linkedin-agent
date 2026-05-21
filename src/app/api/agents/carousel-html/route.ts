import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeApiKey } from "@/lib/secrets";

type Slide = { position: number; type: string; title: string; body: string };

/* ─── POZ logo SVG — two overlapping rounded squares, fill-rule evenodd ─────── */
const LOGO = (fill: string) =>
  `<svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="${fill}" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg>`;

/* ─── Archetype routing ──────────────────────────────────────────────────────── */
function getArchetype(slide: Slide, total: number): "COVER" | "LIST" | "STAT" | "QUOTE" | "CTA" {
  const t = (slide.type || "").toLowerCase();
  if (slide.position === total || t.includes("cta")) return "CTA";
  if (t.includes("hook") || t.includes("cover") || slide.position === 1) return "COVER";
  if (t.includes("stat") || t.includes("depth") || t.includes("number") || t.includes("data")) return "STAT";
  if (t.includes("quote") || t.includes("principle") || t.includes("statement")) return "QUOTE";
  return "LIST";
}

/* ─── Full HTML reference blocks per archetype ───────────────────────────────── */
const REF_COVER = `<!-- ═══ ARCHETYPE A: COVER — INK canvas ═══ -->
<div style="width:1024px;height:1280px;background:#050517;overflow:hidden;position:relative;font-family:'Inter',sans-serif;display:flex;flex-direction:column;padding:64px 64px 64px 64px;box-sizing:border-box;">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
  <!-- top bar -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;">
    <div style="width:56px;height:56px;flex-shrink:0;">${LOGO("#FFFFFF")}</div>
    <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;color:#848492;letter-spacing:0.04em;font-style:normal;">01 / 05</span>
  </div>
  <!-- vertical spacer — push content to ~40% from top -->
  <div style="flex:1;min-height:160px;"></div>
  <!-- eyebrow chip -->
  <span style="display:inline-block;background:#009FF0;color:#050517;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;letter-spacing:0.10em;text-transform:uppercase;padding:10px 24px;border-radius:4px;width:fit-content;max-width:820px;overflow:hidden;font-style:normal;white-space:nowrap;">HOOK</span>
  <div style="height:32px;flex-shrink:0;"></div>
  <!-- ═ TITLE DIV — contains ONLY the Bebas Neue headline text and one <span> — NO <p> tags inside ═ -->
  <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:120px;line-height:1.0;letter-spacing:0;text-transform:uppercase;font-style:normal;color:#FFFFFF;flex-shrink:0;">
    AI AGENTS JUST<br><span style="color:#009FF0;">TOOK YOUR JOB.</span>
  </div><!-- ← TITLE DIV CLOSED HERE. The body <p> is a SIBLING below — NEVER a child of the title div -->
  <div style="height:80px;flex-shrink:0;"></div>
  <!-- ═ BODY <p> — DIRECT CHILD of root div, placed AFTER the 80px spacer above ═ -->
  <p style="font-family:'Inter',sans-serif;font-size:36px;line-height:1.5;letter-spacing:-0.01em;color:rgba(255,255,255,0.70);margin:0;font-weight:400;max-width:880px;flex-shrink:0;">most teams are automating steps. the shift is agents owning entire workflows.</p>
  <div style="height:64px;flex-shrink:0;"></div>
</div>`;

const REF_LIST = `<!-- ═══ ARCHETYPE B: LIST — WHITE canvas ═══ -->
<div style="width:1024px;height:1280px;background:#FFFFFF;overflow:hidden;position:relative;font-family:'Inter',sans-serif;display:flex;flex-direction:column;padding:64px 64px 64px 64px;box-sizing:border-box;">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
  <!-- top bar -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;">
    <div style="width:56px;height:56px;flex-shrink:0;">${LOGO("#009FF0")}</div>
    <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;color:#848492;letter-spacing:0.04em;font-style:normal;">02 / 05</span>
  </div>
  <div style="height:64px;flex-shrink:0;"></div>
  <!-- eyebrow chip: ink bg on white canvas -->
  <span style="display:inline-block;background:#050517;color:#FFFFFF;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;letter-spacing:0.10em;text-transform:uppercase;padding:10px 24px;border-radius:4px;width:fit-content;max-width:820px;overflow:hidden;font-style:normal;white-space:nowrap;">REFRAME</span>
  <div style="height:24px;flex-shrink:0;"></div>
  <!-- title: Bebas Neue 120px -->
  <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:120px;line-height:1.0;letter-spacing:0;text-transform:uppercase;font-style:normal;color:#050517;">
    NOT AUTOMATION.<br><span style="color:#009FF0;">ORCHESTRATION.</span>
  </div>
  <div style="height:48px;flex-shrink:0;"></div>
  <!-- numbered rows -->
  <div style="display:flex;flex-direction:column;border-top:1px solid #EEEEEE;">
    <div style="display:flex;align-items:flex-start;padding:28px 0;border-bottom:1px solid #EEEEEE;gap:0;">
      <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:40px;line-height:1.1;color:#009FF0;width:64px;flex-shrink:0;font-style:normal;">01</span>
      <div style="width:1px;background:#D9D9D9;height:56px;margin:0 24px 0 0;flex-shrink:0;margin-top:4px;"></div>
      <div style="flex:1;">
        <div style="font-family:'Inter',sans-serif;font-size:36px;font-weight:700;color:#050517;line-height:1.2;letter-spacing:-0.01em;">automation executes a defined task</div>
        <div style="font-family:'Inter',sans-serif;font-size:26px;font-weight:400;color:#555562;line-height:1.3;letter-spacing:-0.01em;margin-top:8px;">someone else made the decision</div>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;padding:28px 0;border-bottom:1px solid #EEEEEE;gap:0;">
      <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:40px;line-height:1.1;color:#009FF0;width:64px;flex-shrink:0;font-style:normal;">02</span>
      <div style="width:1px;background:#D9D9D9;height:56px;margin:0 24px 0 0;flex-shrink:0;margin-top:4px;"></div>
      <div style="flex:1;">
        <div style="font-family:'Inter',sans-serif;font-size:36px;font-weight:700;color:#050517;line-height:1.2;letter-spacing:-0.01em;">orchestration owns the decision</div>
        <div style="font-family:'Inter',sans-serif;font-size:26px;font-weight:400;color:#555562;line-height:1.3;letter-spacing:-0.01em;margin-top:8px;">across the entire workflow</div>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;padding:28px 0;border-bottom:1px solid #EEEEEE;gap:0;">
      <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:40px;line-height:1.1;color:#009FF0;width:64px;flex-shrink:0;font-style:normal;">03</span>
      <div style="width:1px;background:#D9D9D9;height:56px;margin:0 24px 0 0;flex-shrink:0;margin-top:4px;"></div>
      <div style="flex:1;">
        <div style="font-family:'Inter',sans-serif;font-size:36px;font-weight:700;color:#050517;line-height:1.2;letter-spacing:-0.01em;">accountability has permanently moved</div>
        <div style="font-family:'Inter',sans-serif;font-size:26px;font-weight:400;color:#555562;line-height:1.3;letter-spacing:-0.01em;margin-top:8px;">to whoever owns the agent</div>
      </div>
    </div>
  </div>
  <div style="flex:1;min-height:24px;"></div>
  <!-- footer body -->
  <p style="font-family:'Inter',sans-serif;font-size:32px;line-height:1.4;letter-spacing:-0.01em;color:#555562;margin:0;font-weight:400;">automation reduces labour. orchestration changes who holds accountability.</p>
</div>`;

const REF_STAT = `<!-- ═══ ARCHETYPE C: STAT — WHITE canvas ═══ -->
<div style="width:1024px;height:1280px;background:#FFFFFF;overflow:hidden;position:relative;font-family:'Inter',sans-serif;display:flex;flex-direction:column;padding:64px 64px 64px 64px;box-sizing:border-box;">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
  <!-- top bar -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;">
    <div style="width:56px;height:56px;flex-shrink:0;">${LOGO("#009FF0")}</div>
    <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;color:#848492;letter-spacing:0.04em;font-style:normal;">03 / 05</span>
  </div>
  <div style="height:64px;flex-shrink:0;"></div>
  <!-- eyebrow chip: blue bg -->
  <span style="display:inline-block;background:#009FF0;color:#FFFFFF;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;letter-spacing:0.10em;text-transform:uppercase;padding:10px 24px;border-radius:4px;width:fit-content;max-width:820px;overflow:hidden;font-style:normal;white-space:nowrap;">DEPTH</span>
  <div style="height:24px;flex-shrink:0;"></div>
  <!-- title -->
  <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:120px;line-height:1.0;letter-spacing:0;text-transform:uppercase;font-style:normal;color:#050517;">
    THE NUMBER<br><span style="color:#009FF0;">THAT PROVES IT.</span>
  </div>
  <div style="height:48px;flex-shrink:0;"></div>
  <!-- stat card: flat, no shadow glow -->
  <div style="background:#F6F6F6;border:1px solid #EEEEEE;border-radius:8px;padding:48px 56px;box-sizing:border-box;">
    <!-- the number: Bebas Neue 185px, LEFT-ALIGNED, never centered -->
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:185px;line-height:1.0;letter-spacing:0;color:#009FF0;font-style:normal;text-align:left;">87%</div>
    <div style="font-family:'Inter',sans-serif;font-size:32px;font-weight:600;color:#050517;letter-spacing:-0.01em;margin-top:8px;">of enterprise AI projects fail at adoption</div>
    <div style="font-family:'Inter',sans-serif;font-size:26px;font-weight:400;color:#555562;letter-spacing:-0.01em;margin-top:16px;line-height:1.4;">traced to design stages that skipped intent mapping</div>
  </div>
  <div style="flex:1;min-height:24px;"></div>
  <!-- footer body -->
  <p style="font-family:'Inter',sans-serif;font-size:32px;line-height:1.4;letter-spacing:-0.01em;color:#555562;margin:0;font-weight:400;">the failure is not in the model. it is in the design stage that came before it.</p>
</div>`;

const REF_QUOTE = `<!-- ═══ ARCHETYPE D: QUOTE — INK canvas ═══ -->
<div style="width:1024px;height:1280px;background:#050517;overflow:hidden;position:relative;font-family:'Inter',sans-serif;display:flex;flex-direction:column;padding:64px 64px 64px 64px;box-sizing:border-box;">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
  <!-- top bar -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;">
    <div style="width:56px;height:56px;flex-shrink:0;">${LOGO("#FFFFFF")}</div>
    <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;color:#848492;letter-spacing:0.04em;font-style:normal;">04 / 05</span>
  </div>
  <!-- spacer -->
  <div style="flex:1;min-height:120px;"></div>
  <!-- eyebrow: plain text, no chip, on dark -->
  <span style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;color:#009FF0;letter-spacing:0.10em;text-transform:uppercase;font-style:normal;">PRINCIPLE</span>
  <div style="height:32px;flex-shrink:0;"></div>
  <!-- quote: Bebas Neue 100px, UPPERCASE, one word in blue -->
  <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:100px;line-height:1.05;letter-spacing:0;text-transform:uppercase;font-style:normal;color:#FFFFFF;">
    CLARITY BEFORE<br><span style="color:#009FF0;">VELOCITY.</span>
  </div>
  <div style="height:48px;flex-shrink:0;"></div>
  <!-- attribution: Inter 28px, muted -->
  <div style="border-top:1px solid #292937;padding-top:24px;">
    <span style="font-family:'Inter',sans-serif;font-size:28px;font-weight:600;color:#848492;letter-spacing:-0.01em;">point one zero</span>
  </div>
  <!-- spacer -->
  <div style="flex:1;min-height:80px;"></div>
  <!-- footer body -->
  <p style="font-family:'Inter',sans-serif;font-size:32px;line-height:1.4;letter-spacing:-0.01em;color:rgba(255,255,255,0.55);margin:0;font-weight:400;">speed without clarity just reaches the wrong outcome faster.</p>
</div>`;

const REF_CTA = `<!-- ═══ ARCHETYPE E: CTA — BLUE canvas ═══ -->
<div style="width:1024px;height:1280px;background:#009FF0;overflow:hidden;position:relative;font-family:'Inter',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 64px 64px 64px;box-sizing:border-box;text-align:center;">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">
  <!-- centered logo: INK version, 96×96 -->
  <div style="width:96px;height:96px;flex-shrink:0;">${LOGO("#050517")}</div>
  <div style="height:48px;flex-shrink:0;"></div>
  <!-- CTA title: Bebas Neue 120px, ink color, centered — EXACTLY 2 lines via EXACTLY 1 <br> -->
  <!-- max-height:240px (2×120px) + overflow:hidden = hard cap at 2 lines regardless of <br> count -->
  <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:120px;line-height:1.0;letter-spacing:0;text-transform:uppercase;font-style:normal;color:#050517;flex-shrink:0;max-height:240px;overflow:hidden;">
    FOLLOW FOR MORE<br>SUCH INSIGHTS
  </div>
  <div style="height:24px;flex-shrink:0;"></div>
  <!-- sub-line: Inter 32px, ink 65% opacity — SIBLING of title div, NOT nested inside it -->
  <p style="font-family:'Inter',sans-serif;font-size:32px;font-weight:600;color:rgba(5,5,23,0.65);letter-spacing:-0.01em;margin:0;flex-shrink:0;">hello@pointonezero.com</p>
  <div style="height:32px;flex-shrink:0;"></div>
  <!-- handle tag: ink bg, white text, Bebas Neue 28px, white-space:nowrap -->
  <span style="display:inline-block;background:#050517;color:#FFFFFF;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1;letter-spacing:0.10em;text-transform:uppercase;padding:12px 40px;border-radius:4px;font-style:normal;white-space:nowrap;flex-shrink:0;">POINT ONE ZERO</span>
</div>`;

/* ─── System prompt ──────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are a senior visual designer at Point One Zero (POZ).
Your only job: output production-ready HTML for a single 1024×1280px LinkedIn carousel slide.

════════════════════════════════
FONT RULES — NON-NEGOTIABLE
════════════════════════════════
Always add this as the FIRST child of the root div (before any other element):
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap" rel="stylesheet">

DISPLAY FONT — every title, eyebrow, number, counter, tag:
  font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif
  font-style: normal  ← always write this explicitly
  font-weight: 400    ← Bebas Neue has exactly one weight; do not write 700 or 800
  text-transform: uppercase  ← Bebas Neue is ALL-CAPS always
  letter-spacing: 0em  ← for sizes ≥ 80px
  letter-spacing: 0.04em  ← for counter (28px)
  letter-spacing: 0.10em  ← for eyebrow labels (28px)

BODY FONT — every body paragraph, sub-text, caption, description:
  font-family: 'Inter', sans-serif
  font-style: normal
  letter-spacing: -0.01em  ← always for Inter body

FONT SIZES (strictly follow, no exceptions):
  185px  Bebas Neue  →  stat number (the giant metric)
  144px  Bebas Neue  →  cover/CTA main title
  120px  Bebas Neue  →  content slide main title
  100px  Bebas Neue  →  quote archetype
   40px  Bebas Neue  →  row numbers in list
   28px  Bebas Neue  →  eyebrow labels, slide counter, tag chips
   36px  Inter 700   →  list row primary text
   36px  Inter 400   →  cover body paragraph
   32px  Inter 400   →  footer body paragraph on all slides
   28px  Inter 600   →  attribution line, sub-labels
   26px  Inter 400   →  list row sub-text, stat card context

════════════════════════════════
COLOR RULES — NON-NEGOTIABLE
════════════════════════════════
ONLY these hex values. No others:
  #009FF0  Primary Blue  — one dominant element per slide
  #050517  Ink           — never pure #000000
  #FFFFFF  White
  #F6F6F6  Neutral 50    — card backgrounds on white canvas
  #EEEEEE  Neutral 100   — borders, dividers
  #D9D9D9  Neutral 200   — vertical dividers in list rows
  #848492  Neutral 400   — counter text, muted labels, attribution
  #555562  Neutral 500   — footer body on white canvas
  #292937  Neutral 600   — dark card bg on ink canvas, thin dividers on ink

THREE CANVASES:
  COVER  →  background: #050517  (INK)
  LIST   →  background: #FFFFFF  (WHITE)
  STAT   →  background: #FFFFFF  (WHITE)
  QUOTE  →  background: #050517  (INK)
  CTA    →  background: #009FF0  (BLUE)

════════════════════════════════
LAYOUT RULES — NON-NEGOTIABLE
════════════════════════════════
- Root div: width:1024px; height:1280px; overflow:hidden; position:relative; box-sizing:border-box
- All padding is 64px on all four sides (pad:64px 64px 64px 64px)
- Use display:flex; flex-direction:column on the root div
- ALL spacing values must be multiples of 8 (8,16,24,32,40,48,56,64,80,96...)
- NO gradients (no linear-gradient, no radial-gradient)
- NO blur (no backdrop-filter, no filter:blur)
- NO box-shadow with color (no glow, no colored shadows)
- Allowed shadow only: box-shadow:0 1px 2px rgba(5,5,23,0.06)
- Border-radius: 4px for chips/tags, 8px for cards, 9999px for pills only
- NEVER exceed 8px border-radius except pills
- Left-align all reading text (never center-align body paragraphs)
- CTA slide is the ONLY slide where text is centered
- NEVER use position:absolute, position:fixed, or position:sticky on any child element — flexbox only
- NEVER nest a body <p> or Inter paragraph inside a title div — body text is ALWAYS a direct child of the root div, after the spacer div
- Eyebrow chip: ALWAYS add white-space:nowrap; max-width:820px; overflow:hidden; chip contains plain text only (no child elements); max 3 words
- Handle chip on CTA: ALWAYS add white-space:nowrap to prevent wrapping

════════════════════════════════
LOGO — always use this exact SVG
════════════════════════════════
WHITE version  (ink/dark canvas):  <div style="width:56px;height:56px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="#FFFFFF" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>
BLUE  version  (white canvas):     <div style="width:56px;height:56px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="#009FF0" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>
INK  version   (blue/CTA canvas):  <div style="width:96px;height:96px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="#050517" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>

════════════════════════════════
COMPLETE REFERENCE HTML — MATCH EXACTLY
════════════════════════════════

${REF_COVER}

${REF_LIST}

${REF_STAT}

${REF_QUOTE}

${REF_CTA}

════════════════════════════════
OUTPUT RULE
════════════════════════════════
Return ONLY the single <div>…</div>. No markdown fences, no explanation, no comments outside the div.
The <link> tag must be the FIRST child inside the root div.
Replace the sample content with the actual slide content provided. Keep all sizes, colors, fonts, and structure identical.`;

/* ─── Archetype-aware prompt builder ────────────────────────────────────────── */
function buildSlidePrompt(slide: Slide, total: number): string {
  const arch = getArchetype(slide, total);
  const counter = `${String(slide.position).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const instructions: Record<string, string> = {
    COVER: `Use ARCHETYPE A (COVER). Canvas: #050517. Logo: WHITE 56×56. Counter: "${counter}". Title font-size rule (NON-NEGOTIABLE): ≤20 chars → 144px; 21–34 chars → 120px; ≥35 chars → 96px. Max 2 lines — use exactly 1 <br> to split into 2 balanced halves. Add flex-shrink:0 to the title div. Eyebrow chip: 1–3 words ONLY, white-space:nowrap, max-width:820px, overflow:hidden. BODY STRUCTURE (CRITICAL): (1) Close the title </div> tag. (2) Add height:80px spacer div. (3) Add body <p>. The <p> MUST be a DIRECT SIBLING of the title div — NEVER a child of it. Placing <p> inside the title div causes the body text to visually collide with the title headline. Wrong: <div title><p>body</p></div>. Right: <div title></div><div 80px></div><p>body</p>.`,
    LIST:  `Use ARCHETYPE B (LIST). Canvas: #FFFFFF. Logo: BLUE 56×56. Counter: "${counter}". Title: Bebas Neue 120px uppercase. Eyebrow chip: 1–3 words ONLY, white-space:nowrap, max-width:820px, overflow:hidden, NO line breaks, NO sub-labels beneath the chip. Extract 2–4 distinct items from the body and render them as numbered rows (number 40px Bebas blue, row title 36px Inter 700, sub-text 26px Inter 400). Footer: Inter 32px.`,
    STAT:  `Use ARCHETYPE C (STAT). Canvas: #FFFFFF. Logo: BLUE 56×56. Counter: "${counter}". Title: Bebas Neue 120px uppercase. Eyebrow chip: 1–3 words ONLY, white-space:nowrap, max-width:820px, overflow:hidden. Find the key metric in the body (number, %, $) — make it the 185px Bebas Neue stat. Label: Inter 32px 600. Context: Inter 26px 400. Footer: Inter 32px.`,
    QUOTE: `Use ARCHETYPE D (QUOTE). Canvas: #050517. Logo: WHITE 56×56. Counter: "${counter}". Quote text: Bebas Neue 100px uppercase — one key word in #009FF0. Attribution: Inter 28px 600 #848492. Footer: Inter 32px rgba(255,255,255,0.55).`,
    CTA:   `Use ARCHETYPE E (CTA). Canvas: #009FF0. Exact structure — NOTHING else:
① Logo div (INK 96×96, flex-shrink:0)
② height:48px spacer div (flex-shrink:0)
③ Title div: Bebas Neue 120px #050517 centered, flex-shrink:0, max-height:240px, overflow:hidden — EXACTLY 2 LINES using EXACTLY 1 <br>. Combine words into 2 roughly equal halves and join them with ONE <br>. COUNT your <br> tags before outputting — there must be exactly 1. RIGHT: "POSITION YOUR<br>STRATEGY NOW". WRONG: "POSITION<br>YOUR<br>STRATEGY<br>NOW" (3 line-breaks = 4 lines = broken layout).
④ height:24px spacer div (flex-shrink:0)
⑤ Sub-line <p>: Inter 32px 600 rgba(5,5,23,0.65), flex-shrink:0 — use slide body text verbatim (max 12 words). This <p> is a SIBLING of the title div, NOT nested inside it.
⑥ height:32px spacer div (flex-shrink:0)
⑦ Handle chip <span>: Bebas Neue 28px bg:#050517 color:#FFFFFF white-space:nowrap padding:12px 40px flex-shrink:0 — text: "POINT ONE ZERO"
NO other elements. NO extra paragraphs. All 7 elements must have flex-shrink:0.`,
  };

  return `Generate ONE LinkedIn carousel slide — 1024×1280px.

SLIDE CONTENT:
  Position: ${slide.position} of ${total}
  Slide type: ${slide.type}
  Title: "${slide.title}"
  Body: "${slide.body}"

ARCHETYPE INSTRUCTION:
${instructions[arch]}

CRITICAL CHECKLIST — verify before outputting:
✓ <link> Google Fonts tag is the FIRST child of the root div
✓ All titles use font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif with font-style:normal
✓ All body text uses font-family:'Inter',sans-serif with letter-spacing:-0.01em
✓ Root div has box-sizing:border-box and padding:64px 64px 64px 64px
✓ Zero gradients, zero blur, zero colored shadows
✓ All spacing values are multiples of 8
✓ Border-radius max 8px (never higher, except 9999px for pills)
✓ Content derived from the actual slide data above — no generic filler
✓ Title is UPPERCASE (Bebas Neue is always uppercase)
✓ NO position:absolute / position:fixed on any child element
✓ COVER body: title </div> is CLOSED, then 80px spacer, then <p> — body <p> is a SIBLING of title div, NEVER a child (nesting causes body to collide with the headline)
✓ Every eyebrow chip has white-space:nowrap AND max-width:820px AND overflow:hidden
✓ CTA title: COUNT the <br> tags — exactly 1 (two or more <br> = 3–4 lines = overlap). Add max-height:240px;overflow:hidden to the title div.
✓ CTA slide has EXACTLY the 7 elements listed — no extra paragraphs — all have flex-shrink:0

Return ONLY the <div>. Nothing else.`;
}

export const maxDuration = 120;

/* ─── Route handler ─────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { slides, topic } = await req.json() as { slides: Slide[]; topic: string };

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided" }, { status: 400 });
    }

    const apiKey = await getClaudeApiKey();
    const client = new Anthropic({ apiKey });

    const htmlResults = await Promise.all(
      slides.map(async (slide) => {
        const msg = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 8096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildSlidePrompt(slide, slides.length) }],
        });
        const html = (msg.content[0] as { type: string; text: string }).text.trim();
        return { ...slide, slideHtml: html };
      })
    );

    console.log(`[carousel-html] Generated ${htmlResults.length} slides — topic: ${topic}`);
    return NextResponse.json({ slides: htmlResults });
  } catch (err) {
    console.error("[carousel-html] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
