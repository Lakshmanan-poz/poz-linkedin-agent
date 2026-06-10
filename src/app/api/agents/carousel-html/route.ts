import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeApiKey } from "@/lib/secrets";

type Slide = { position: number; type: string; title: string; body: string };
type Arch = "COVER" | "LIST" | "DEFINITION" | "STAT" | "QUOTE" | "EDITORIAL" | "TWOCOL" | "CTA";

/* ─── Archetype routing ──────────────────────────────────────────────────────── */
function getArchetype(slide: Slide, total: number): Arch {
  const t = (slide.type || "").toLowerCase().replace(/[- _]/g, "");
  if (slide.position === total || t.includes("cta")) return "CTA";
  if (t.includes("cover") || slide.position === 1) return "COVER";
  if (t.includes("list") || t.includes("chapter")) return "LIST";
  if (t.includes("definition") || t.includes("define")) return "DEFINITION";
  if (t.includes("stat")) return "STAT";
  if (t.includes("quote")) return "QUOTE";
  if (t.includes("editorial")) return "EDITORIAL";
  if (t.includes("twocol") || t.includes("grid") || t.includes("comparison")) return "TWOCOL";
  const fb: Partial<Record<number, Arch>> = {
    2: "LIST", 3: "DEFINITION", 4: "STAT",
    5: "QUOTE", 6: "EDITORIAL", 7: "TWOCOL",
  };
  return fb[slide.position] ?? "LIST";
}

/* ════════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — SKILL.md v2.0 (poz-social-media-design-system)
   Canvas: 1080 × 1350 px

   BACKGROUND:
   --c-paper (all slides):   linear-gradient(180deg, #fdfcfa 0%, #fcfbf8 55%, #faf9f5 100%)
   --c-veil (Cover + CTA):   above + radial-gradient(ellipse 75% 50% at 95% -5%, rgba(0,159,239,0.075), transparent 65%)

   TYPE SCALE (exact slide px from SKILL.md §4.3, §8):
   display-lg:  124px / 600 / -5px   / 1.06 — Cover headline
   display-md:   88px / 600 / -3.2px / 1.08 — CTA headline
   display-sm:   64px / 600 / -1.6px / 1.14 — Stat label, two-col heading, list headline
   word:        220px / 600 / -10px  / 0.90 — Definition WORD
   stat-val:    440px / 600 / -22px  / 0.86 — Featured stat (brand blue)
   stat-suf:     96px / 600          / 1.0  — Stat suffix (brand, opacity 0.55)
   lead:         44px / 400 / -0.4px / 1.45 — Lead under headline
   body:         40px / 400 / -0.3px / 1.45 — Body paragraphs
   body-sm:      32px / 400 mono            — Source / footnote
   wordmark:     32px / 510 / -0.4px        — Footer
   eyebrow:      14px / 600 / +0.05em upper — Eyebrow label
   quote:        72px / 510 / -1.8px / 1.16 — Pull quote
   editorial:    64px / 400 / -0.6px / 1.22 — Editorial paragraph
   drop-cap:    240px / 400 / lh:0.82       — First letter (ALWAYS INK, never brand)

   LAYOUT: --c-pad-x:96px, --c-pad-top:80px
   LOGO: 65×65px top-right
════════════════════════════════════════════════════════════════════════════════ */

const BG_PAPER = `linear-gradient(180deg, #fdfcfa 0%, #fcfbf8 55%, #faf9f5 100%)`;
const BG_VEIL  = `radial-gradient(ellipse 75% 50% at 95% -5%, rgba(0,159,239,0.075), transparent 65%), ${BG_PAPER}`;
const FONT_LINK = `<link href="https://rsms.me/inter/inter.css" rel="stylesheet">`;
const LOGO = `<div style="width:65px;height:65px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="#0a0a0a" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>`;
const FOOT_RULE = `<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.16) 12%,rgba(0,0,0,0.16) 88%,transparent);flex-shrink:0;"></div>`;
const WORDMARK  = `<span style="font-family:Inter,sans-serif;font-size:32px;font-weight:510;color:#0a0a0a;letter-spacing:-0.4px;">point one zero</span>`;
const SWIPE     = `<img src="/assets/Swipe.png" alt="" style="width:36px;height:36px;display:block;flex-shrink:0;object-fit:contain;">`;
const FOOTER_STD = `<div style="padding:0 96px;flex-shrink:0;margin-top:auto;">${FOOT_RULE}<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 0 24px;">${WORDMARK}${SWIPE}</div></div>`;
const FOOTER_CTA = `<div style="padding:0 96px;flex-shrink:0;margin-top:auto;">${FOOT_RULE}<div style="padding:20px 0 24px;">${WORDMARK}</div></div>`;

/* ─── Eight reference slide blocks ───────────────────────────────────────────── */

const REF_COVER = `<!-- COVER: 1080x1350, warm paper + veil, ALL text CENTER aligned, limited bottom gap -->
<div style="width:1080px;height:1350px;background:${BG_VEIL};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:12px;padding-top:6px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#009FEF;flex-shrink:0;box-shadow:0 0 8px rgba(0,159,239,0.35);"></div>
      <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;">AI Experience Design</span>
    </div>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;text-align:center;">
    <h1 style="font-family:Inter,sans-serif;font-size:124px;font-weight:600;line-height:1.06;letter-spacing:-5px;color:#0a0a0a;margin:0;">Most enterprise<br>AI fails on the<br><span style="color:#009FEF;">experience</span></h1>
    <div style="height:44px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:44px;font-weight:400;color:#3f3f46;line-height:1.45;letter-spacing:-0.4px;margin:0;">Not the models. Not the engineering. Nobody designed how people actually use it.</p>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_LIST = `<!-- LIST: 64px headline, rule, flex:1 rows, 4 items with number+name+desc columns -->
<div style="width:1080px;height:1350px;background:${BG_PAPER};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;padding-top:6px;">What Design Solves</span>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;">
    <h2 style="font-family:Inter,sans-serif;font-size:64px;font-weight:600;line-height:1.14;letter-spacing:-1.6px;color:#0a0a0a;margin:0;">Four problems<br>only design solves</h2>
  </div>
  <div style="height:1px;background:rgba(0,0,0,0.08);margin:28px 96px 0;flex-shrink:0;"></div>
  <div style="flex:1;padding:0 96px;display:flex;flex-direction:column;min-height:0;">
    <div style="flex:1;display:flex;align-items:center;">
      <span style="font-family:'Courier New',monospace;font-size:24px;color:#009FEF;width:52px;flex-shrink:0;">01</span>
      <div style="width:380px;flex-shrink:0;"><span style="font-family:Inter,sans-serif;font-size:48px;font-weight:600;color:#0a0a0a;letter-spacing:-1.2px;">Adoption</span></div>
      <span style="font-family:Inter,sans-serif;font-size:36px;font-weight:400;color:#767d87;line-height:1.42;flex:1;">People actually use it</span>
    </div>
    <div style="height:1px;background:rgba(0,0,0,0.08);flex-shrink:0;"></div>
    <div style="flex:1;display:flex;align-items:center;">
      <span style="font-family:'Courier New',monospace;font-size:24px;color:#009FEF;width:52px;flex-shrink:0;">02</span>
      <div style="width:380px;flex-shrink:0;"><span style="font-family:Inter,sans-serif;font-size:48px;font-weight:600;color:#0a0a0a;letter-spacing:-1.2px;">Trust</span></div>
      <span style="font-family:Inter,sans-serif;font-size:36px;font-weight:400;color:#767d87;line-height:1.42;flex:1;">They act without re-checking</span>
    </div>
    <div style="height:1px;background:rgba(0,0,0,0.08);flex-shrink:0;"></div>
    <div style="flex:1;display:flex;align-items:center;">
      <span style="font-family:'Courier New',monospace;font-size:24px;color:#009FEF;width:52px;flex-shrink:0;">03</span>
      <div style="width:380px;flex-shrink:0;"><span style="font-family:Inter,sans-serif;font-size:48px;font-weight:600;color:#0a0a0a;letter-spacing:-1.2px;">Governance</span></div>
      <span style="font-family:Inter,sans-serif;font-size:36px;font-weight:400;color:#767d87;line-height:1.42;flex:1;">The business owns the rules</span>
    </div>
    <div style="height:1px;background:rgba(0,0,0,0.08);flex-shrink:0;"></div>
    <div style="flex:1;display:flex;align-items:center;">
      <span style="font-family:'Courier New',monospace;font-size:24px;color:#009FEF;width:52px;flex-shrink:0;">04</span>
      <div style="width:380px;flex-shrink:0;"><span style="font-family:Inter,sans-serif;font-size:48px;font-weight:600;color:#0a0a0a;letter-spacing:-1.2px;">Usefulness</span></div>
      <span style="font-family:Inter,sans-serif;font-size:36px;font-weight:400;color:#767d87;line-height:1.42;flex:1;">Correct and actually helpful</span>
    </div>
    <div style="height:1px;background:rgba(0,0,0,0.08);flex-shrink:0;"></div>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_DEFINITION = `<!-- DEFINITION: WORD font sized by length (≤4=220 5-6=180 7-8=140 9+=110), centered, limited gap -->
<div style="width:1080px;height:1350px;background:${BG_PAPER};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;padding-top:6px;">The Case</span>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;text-align:center;">
    <h2 style="font-family:Inter,sans-serif;font-size:180px;font-weight:600;line-height:0.90;letter-spacing:-8px;color:#0a0a0a;text-transform:uppercase;margin:0;">DESIGN</h2>
    <div style="width:96px;height:2px;background:linear-gradient(90deg,#009FEF,rgba(0,159,239,0));margin:28px auto 0;flex-shrink:0;"></div>
    <div style="height:20px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:44px;font-weight:510;color:#0a0a0a;line-height:1.28;letter-spacing:-0.4px;margin:0;">Not decoration applied after engineering finishes. The structural layer that decides whether the product is adopted at all.</p>
    <div style="height:20px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:40px;font-weight:400;color:#3f3f46;line-height:1.45;letter-spacing:-0.3px;margin:0;">You cannot design every conversation. You design the building blocks and the rules — the AI fills in the rest.</p>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_STAT = `<!-- STAT: featured 440px brand number + 96px suffix centered + 64px label + 40px body -->
<div style="width:1080px;height:1350px;background:${BG_PAPER};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;padding-top:6px;">The Problem</span>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;text-align:center;">
    <div style="display:flex;align-items:flex-end;justify-content:center;line-height:1;">
      <span style="font-family:Inter,sans-serif;font-size:440px;font-weight:600;line-height:0.86;letter-spacing:-22px;color:#009FEF;">73</span>
      <span style="font-family:Inter,sans-serif;font-size:96px;font-weight:600;line-height:1;color:#009FEF;opacity:0.55;padding-bottom:8px;">%</span>
    </div>
    <div style="height:48px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:64px;font-weight:600;line-height:1.14;letter-spacing:-1.6px;color:#0a0a0a;margin:0;">of enterprise AI projects fail — because the experience was never designed.</p>
    <div style="height:24px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:40px;font-weight:400;color:#3f3f46;line-height:1.45;letter-spacing:-0.3px;margin:0;">The AI provides intelligence. Engineering provides infrastructure. Design provides the reason anyone uses it.</p>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_QUOTE = `<!-- QUOTE: logo only header, vertically centered content, 72px quote text, ALL centered -->
<div style="width:1080px;height:1350px;background:${BG_PAPER};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;justify-content:flex-end;padding:80px 96px 0;flex-shrink:0;">
    ${LOGO}
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 96px;min-height:0;text-align:center;">
    <div style="font-family:Inter,sans-serif;font-size:96px;font-weight:600;color:#009FEF;line-height:0.9;letter-spacing:-2px;margin-bottom:16px;">"</div>
    <p style="font-family:Inter,sans-serif;font-size:72px;font-weight:510;line-height:1.16;letter-spacing:-1.8px;color:#0a0a0a;margin:0;">Speed without clarity just reaches the wrong outcome faster.</p>
    <div style="height:48px;"></div>
    <div style="height:1px;background:rgba(0,0,0,0.08);"></div>
    <div style="padding-top:20px;">
      <div style="font-family:Inter,sans-serif;font-size:40px;font-weight:510;color:#0a0a0a;letter-spacing:-0.4px;">Point One Zero</div>
      <div style="font-family:'Courier New',monospace;font-size:32px;color:#767d87;letter-spacing:0.06em;text-transform:uppercase;margin-top:10px;">Internal · 2026</div>
    </div>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_EDITORIAL = `<!-- EDITORIAL: 240px INK drop-cap (NEVER brand), 64px body, 40px support centered, limited gap -->
<div style="width:1080px;height:1350px;background:${BG_PAPER};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;padding-top:6px;">The Reframe</span>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;">
    <div style="overflow:hidden;">
      <span style="font-family:Inter,sans-serif;font-size:240px;font-weight:400;line-height:0.82;color:#0a0a0a;float:left;margin:12px 24px -8px -6px;">A</span>
      <p style="font-family:Inter,sans-serif;font-size:64px;font-weight:400;line-height:1.22;letter-spacing:-0.6px;color:#0a0a0a;margin:0;">n AI chat is not a search bar. It must earn <span style="color:#009FEF;">trust</span>, stay compliant, and prove its value — all through a single screen.</p>
    </div>
    <div style="height:28px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:40px;font-weight:400;color:#3f3f46;line-height:1.45;letter-spacing:-0.3px;margin:0;text-align:center;">The difference between adoption and abandonment is almost never the intelligence of the model. It is whether people could use it on the first day without a training session.</p>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_TWOCOL = `<!-- TWOCOL: 64px headline + rule + two equal columns with 64px heading + 40px body -->
<div style="width:1080px;height:1350px;background:${BG_PAPER};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;padding-top:6px;">Where It Gets Real</span>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;">
    <h2 style="font-family:Inter,sans-serif;font-size:64px;font-weight:600;line-height:1.14;letter-spacing:-1.6px;color:#0a0a0a;margin:0;">Two layers decide<br>whether anyone acts.</h2>
  </div>
  <div style="height:1px;background:rgba(0,0,0,0.08);margin:32px 96px;flex-shrink:0;"></div>
  <div style="display:flex;flex:1;overflow:hidden;min-height:0;">
    <div style="flex:1;padding:0 40px 0 96px;display:flex;flex-direction:column;">
      <div style="font-family:Inter,sans-serif;font-size:64px;font-weight:600;letter-spacing:-1.4px;color:#0a0a0a;margin-bottom:24px;">Trust</div>
      <p style="font-family:Inter,sans-serif;font-size:40px;font-weight:400;color:#3f3f46;line-height:1.42;letter-spacing:-0.3px;margin:0;">Earned by showing your work — sources, confidence, and a way to flag mistakes on every answer. Or people re-check by hand.</p>
    </div>
    <div style="width:1px;background:linear-gradient(180deg,transparent,rgba(0,0,0,0.16) 20%,rgba(0,0,0,0.16) 80%,transparent);flex-shrink:0;"></div>
    <div style="flex:1;padding:0 96px 0 40px;display:flex;flex-direction:column;">
      <div style="font-family:Inter,sans-serif;font-size:64px;font-weight:600;letter-spacing:-1.4px;color:#0a0a0a;margin-bottom:24px;">Agentic action</div>
      <p style="font-family:Inter,sans-serif;font-size:40px;font-weight:400;color:#3f3f46;line-height:1.42;letter-spacing:-0.3px;margin:0;">When the AI acts, not just answers, design keeps the human in control. This is where AI liability lives.</p>
    </div>
  </div>
  ${FOOTER_STD}
</div>`;

const REF_CTA = `<!-- CTA: 1080x1350, warm paper + veil, 88px headline CENTER aligned, dark pill button, limited gap, no swipe -->
<div style="width:1080px;height:1350px;background:${BG_VEIL};font-family:Inter,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  ${FONT_LINK}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:80px 96px 0;flex-shrink:0;">
    <span style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#767d87;letter-spacing:0.05em;text-transform:uppercase;padding-top:6px;">Point One Zero</span>
    ${LOGO}
  </div>
  <div style="padding:0 96px;flex-shrink:0;margin-top:24px;text-align:center;">
    <h2 style="font-family:Inter,sans-serif;font-size:88px;font-weight:600;line-height:1.08;letter-spacing:-3.2px;color:#0a0a0a;margin:0;">We design AI<br>products people<br><span style="color:#009FEF;">actually use</span></h2>
    <div style="height:44px;"></div>
    <p style="font-family:Inter,sans-serif;font-size:44px;font-weight:400;color:#3f3f46;line-height:1.45;letter-spacing:-0.4px;margin:0;">The full 12-layer framework — built for the leaders shipping enterprise AI.</p>
    <div style="height:80px;"></div>
    <div style="display:inline-flex;align-items:center;height:96px;padding:0 48px;border-radius:9999px;background:linear-gradient(180deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0) 60%),#0a0a0a;box-shadow:rgba(0,0,0,0.06) 0 12px 24px -6px,rgba(0,0,0,0.12) 0 4px 8px -2px,rgba(0,0,0,0.20) 0 0 0 1px,inset 0 1px 0 rgba(255,255,255,0.28),inset 0 -1px 0 rgba(0,0,0,0.50);flex-shrink:0;">
      <span style="font-family:Inter,sans-serif;font-size:34px;font-weight:510;color:#fcfbf8;letter-spacing:0.02em;">Follow for more insights</span>
    </div>
    <div style="height:36px;"></div>
    <div style="font-family:'Courier New',monospace;font-size:32px;color:#767d87;letter-spacing:0.02em;">pointonezero.com</div>
  </div>
  ${FOOTER_CTA}
</div>`;

/* ─── System prompt ──────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are a senior visual designer at Point One Zero (POZ).
Generate production-ready HTML for ONE 1080×1350px LinkedIn carousel slide matching the reference images.

══════════════════════════════════════════════════
CANVAS — ABSOLUTE RULES
══════════════════════════════════════════════════
Width: 1080px. Height: 1350px.

WARM PAPER (all slides except Cover/CTA):
  background: linear-gradient(180deg, #fdfcfa 0%, #fcfbf8 55%, #faf9f5 100%)
  Very subtle warm-cream gradient. NOT white. NOT grey. NOT blue-grey.

WITH VEIL (Cover + CTA — add atmospheric blue top-right corner):
  background: radial-gradient(ellipse 75% 50% at 95% -5%, rgba(0,159,239,0.075), transparent 65%),
              linear-gradient(180deg, #fdfcfa 0%, #fcfbf8 55%, #faf9f5 100%)

NEVER: #ffffff, #f5f4f0, #dae0ee, grey or dark backgrounds.

══════════════════════════════════════════════════
FONT — ALWAYS Inter Variable from rsms.me
══════════════════════════════════════════════════
<link href="https://rsms.me/inter/inter.css" rel="stylesheet"> — MUST be FIRST child.
font-family: Inter, sans-serif on every element.
NEVER: Bebas Neue, Arial, system-ui.

══════════════════════════════════════════════════
TEXT ALIGNMENT — ABSOLUTE RULE
══════════════════════════════════════════════════
ALL headline, lead, body, and supporting text MUST be center-aligned.
Add text-align:center to every content wrapper div.
Exception: LIST rows use flex layout (number | name | desc) — no text-align needed there.
Exception: EDITORIAL drop-cap block uses float:left — that inner paragraph stays as-is,
  but the support paragraph below it MUST have text-align:center.

══════════════════════════════════════════════════
TOKENS
══════════════════════════════════════════════════
Colors:
  INK:    #0a0a0a — headlines, logo, wordmark, button bg
  MUTED:  #3f3f46 — lead + body text
  SUBTLE: #767d87 — eyebrow labels
  BRAND:  #009FEF — ONE element per slide ONLY
  CANVAS: #fcfbf8 — button text

Layout:
  Horizontal padding: 96px both sides
  Header top padding: 80px
  Content starts: margin-top:24px after header (~145px from top)
  Logo: 65×65px top-right in header
  Bottom spacer: flex:1;max-height:180px;min-height:40px — limits blank space above footer

Rule colors:
  rgba(0,0,0,0.08)  — list rows, section dividers
  rgba(0,0,0,0.16)  — footer rule, vertical col divider
  linear-gradient(90deg,#009FEF,transparent) — definition accent rule ONLY

══════════════════════════════════════════════════
TYPE SCALE (exact pixels — 1080px canvas, SKILL.md §4.3 §8)
══════════════════════════════════════════════════
COVER headline:      124px  wt:600  ls:-5px    lh:1.06
CTA headline:         88px  wt:600  ls:-3.2px  lh:1.08
Stat label / col hd:  64px  wt:600  ls:-1.6px  lh:1.14
List headline:        64px  wt:600  ls:-1.6px  lh:1.14
Definition WORD:  SIZE BY WORD LENGTH (must fit 888px width):
                     ≤4 chars → 220px  ls:-10px
                     5-6 chars → 180px  ls:-8px
                     7-8 chars → 140px  ls:-6px
                     9+ chars  → 110px  ls:-4px
                     wt:600 lh:0.90 uppercase INK #0a0a0a
Stat value:          440px  wt:600  ls:-22px   lh:0.86  brand blue
Stat suffix:          96px  wt:600  brand opacity:0.55
Lead paragraph:       44px  wt:400  ls:-0.4px  lh:1.45  #3f3f46
Body paragraph:       40px  wt:400  ls:-0.3px  lh:1.45  #3f3f46
Footnote/source:      32px  wt:400  monospace  uppercase #767d87
Footer wordmark:      32px  wt:510  ls:-0.4px  #0a0a0a
Eyebrow:              14px  wt:600  ls:+0.05em uppercase #767d87
Quote text:           72px  wt:510  ls:-1.8px  lh:1.16
Editorial body:       64px  wt:400  ls:-0.6px  lh:1.22
Drop-cap letter:     240px  wt:400  lh:0.82    #0a0a0a (NEVER brand!)
List number:          24px  monospace  #009FEF
List item name:       48px  wt:600  ls:-1.2px  #0a0a0a
List description:     36px  wt:400  ls:-0.3px  lh:1.42  #767d87
CTA button text:      34px  wt:510  ls:+0.02em #fcfbf8

══════════════════════════════════════════════════
LOGO (65×65px — ALL slides, top-right)
══════════════════════════════════════════════════
<div style="width:65px;height:65px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" style="width:100%;height:100%;display:block;"><path fill="#0a0a0a" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>

══════════════════════════════════════════════════
FOOTER (all slides) — COPY EXACTLY
══════════════════════════════════════════════════
CRITICAL: The footer div MUST have margin-top:auto so it is always pinned to the very bottom of the 1350px slide.
Do NOT use a spacer div before the footer. Use margin-top:auto on the footer itself.

Non-last slides (has arrow image on right):
<div style="padding:0 96px;flex-shrink:0;margin-top:auto;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.16) 12%,rgba(0,0,0,0.16) 88%,transparent);"></div><div style="display:flex;justify-content:space-between;align-items:center;padding:20px 0 24px;"><span style="font-family:Inter,sans-serif;font-size:32px;font-weight:510;color:#0a0a0a;letter-spacing:-0.4px;">point one zero</span><img src="/assets/Swipe.png" alt="" style="width:36px;height:36px;display:block;flex-shrink:0;object-fit:contain;"></div></div>

Last slide / CTA (NO arrow — wordmark only):
<div style="padding:0 96px;flex-shrink:0;margin-top:auto;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.16) 12%,rgba(0,0,0,0.16) 88%,transparent);"></div><div style="padding:20px 0 24px;"><span style="font-family:Inter,sans-serif;font-size:32px;font-weight:510;color:#0a0a0a;letter-spacing:-0.4px;">point one zero</span></div></div>

FOOTER RULES:
- margin-top:auto on the footer div — ALWAYS, NO exceptions — this pins footer to bottom
- "point one zero" ALWAYS on the LEFT (32px wt:510 #0a0a0a)
- Arrow image <img src="/assets/Swipe.png"> on RIGHT — on every slide EXCEPT the last
- Horizontal fading line ALWAYS above the footer row
- NEVER center the footer — it must be left/right split

══════════════════════════════════════════════════
EIGHT REFERENCE SLIDES — MATCH EXACTLY
══════════════════════════════════════════════════

${REF_COVER}

${REF_LIST}

${REF_DEFINITION}

${REF_STAT}

${REF_QUOTE}

${REF_EDITORIAL}

${REF_TWOCOL}

${REF_CTA}

══════════════════════════════════════════════════
ARCHETYPE LAYOUT RULES
══════════════════════════════════════════════════

COVER:
  Root bg: WITH veil. Header: padding-top:80px, brand-dot (10px circle #009FEF glow) + eyebrow + logo.
  Content (margin-top:24px, padding:0 96px, text-align:center):
    Headline: 124px wt:600 ls:-5px lh:1.06 INK, up to 3 lines with <br>. ONE phrase = #009FEF.
    height:44px gap.
    Lead: 44px wt:400 #3f3f46 — NO max-width (full width, centered).
  Bottom spacer: flex:1;max-height:180px;min-height:40px (limits blank space above footer).
  Footer: wordmark left + › right.

LIST:
  Header: eyebrow + logo.
  Content: margin-top:24px, headline 64px wt:600 ls:-1.6px.
  Rule: height:1px rgba(0,0,0,0.08) margin:28px 96px 0 flex-shrink:0.
  Rows: flex:1 padding:0 96px flex-direction:column min-height:0.
    Parse "Name: description" pairs from body → 3-4 rows.
    Each row: flex:1 display:flex align-items:center.
      Number (24px mono brand #009FEF, width:52px) | Name (48px wt:600, width:380px) | Desc (36px wt:400 #767d87, flex:1).
    Rule between rows + after last row: height:1px rgba(0,0,0,0.08) flex-shrink:0.
  Footer + ›.

DEFINITION:
  Header + logo. Content margin-top:24px padding:0 96px text-align:center.
  WORD: INK #0a0a0a UPPERCASE — scale font-size by character count to fit 888px:
    ≤4 chars → 220px ls:-10px
    5-6 chars → 180px ls:-8px
    7-8 chars → 140px ls:-6px
    9+ chars → 110px ls:-4px
    All: wt:600 lh:0.90. NEVER let the word overflow — reduce size until it fits.
  Accent rule: width:96px height:2px linear-gradient(90deg,#009FEF,transparent) margin:28px auto 0 (centered).
  height:20px gap.
  Definition: 44px wt:510 ls:-0.4px lh:1.28 #0a0a0a — full width, centered.
  height:20px gap.
  Body: 40px wt:400 #3f3f46 lh:1.45 — full width, centered.
  Bottom spacer: flex:1;max-height:180px;min-height:40px. Footer + ›.

STAT:
  Header + logo. Content margin-top:24px padding:0 96px text-align:center.
  Number row: display:flex align-items:flex-end justify-content:center.
    Val: 440px wt:600 ls:-22px lh:0.86 #009FEF. Suf: 96px wt:600 #009FEF opacity:0.55 pb:8px.
  height:48px gap. Label: 64px wt:600 ls:-1.6px lh:1.14 #0a0a0a — full width, centered.
  height:24px gap. Body: 40px wt:400 #3f3f46 — full width, centered.
  Bottom spacer: flex:1;max-height:180px;min-height:40px. Footer + ›.

QUOTE:
  Header: logo ONLY right-aligned (NO eyebrow). flex:1 content area with justify-content:center padding:0 96px.
  Opening glyph: 96px wt:600 #009FEF lh:0.9 ls:-2px mb:16px — the " character.
  Quote: 72px wt:510 ls:-1.8px lh:1.16 #0a0a0a max-width:888px. Body text as quote.
  height:48px gap. Rule: height:1px rgba(0,0,0,0.08). padding-top:20px for attribution.
  Name: 40px wt:510 #0a0a0a ls:-0.4px. Source: 32px monospace #767d87 uppercase mt:10px.
  Footer + ›.

EDITORIAL:
  Header: eyebrow + logo. Content margin-top:24px padding:0 96px.
  Drop-cap block: overflow:hidden wrapper.
    Cap: float:left 240px wt:400 lh:0.82 color:#0a0a0a margin:12px 24px -8px -6px.
    Cap MUST be #0a0a0a (INK) — NEVER #009FEF — this is a design law.
    Paragraph: 64px wt:400 ls:-0.6px lh:1.22 #0a0a0a. First letter is the cap.
      Include ONE word/phrase as color:#009FEF inline.
  height:28px gap. Body: 40px wt:400 #3f3f46 — text-align:center.
  Bottom spacer: flex:1;max-height:180px;min-height:40px. Footer + ›.

TWOCOL:
  Header + logo. Headline margin-top:24px 64px wt:600.
  Rule: height:1px rgba(0,0,0,0.08) margin:32px 96px flex-shrink:0.
  Columns: display:flex flex:1 overflow:hidden min-height:0.
    Left (flex:1 padding:0 40px 0 96px flex-direction:column): heading 64px wt:600 + body 40px #3f3f46.
    Vertical rule: 1px linear-gradient(180deg,transparent,rgba(0,0,0,0.16) 20%,rgba(0,0,0,0.16) 80%,transparent).
    Right (flex:1 padding:0 96px 0 40px flex-direction:column): same structure.
  Footer + ›.

  GRID MODE (6+ items like "12 layers"):
    After headline + rule: two-column numbered grid, flex:1 rows.
    Each row: display:flex height:~80px border-bottom:1px rgba(0,0,0,0.08).
    Left cell: padding 0 40px 0 96px — number (24px mono brand) + name (36px wt:600 ls:-0.8px #0a0a0a).
    Right cell: padding 0 96px 0 40px — same structure. Items go L1,R1,L2,R2... across pairs.

CTA:
  Root bg: WITH veil. Header: eyebrow "Point One Zero" + logo. NO brand-dot on CTA.
  Content margin-top:24px padding:0 96px text-align:center.
  Headline: 88px wt:600 ls:-3.2px lh:1.08 #0a0a0a. ONE phrase = #009FEF.
  height:44px gap. Lead: 44px wt:400 #3f3f46 — full width, centered.
  height:80px gap.
  Pill button: inline-flex, height:96px padding:0 48px border-radius:9999px,
    bg: linear-gradient(180deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0) 60%),#0a0a0a,
    box-shadow: complex (see reference). Text: 34px wt:510 #fcfbf8 ls:0.02em.
  height:36px gap. URL: 32px monospace #767d87 ls:0.02em — bare domain only.
  Bottom spacer: flex:1;max-height:180px;min-height:40px.
  Footer: wordmark LEFT ONLY — NO › on last slide (CTA is always last).

══════════════════════════════════════════════════
OUTPUT RULES
══════════════════════════════════════════════════
1. Return ONLY the <div>. No markdown fence, no explanation.
2. <link rsms.me inter> MUST be the first child of root div.
3. Replace ALL sample text with actual slide content.
4. Match ALL sizes, colors, letter-spacing to the reference block.
5. BRAND #009FEF on ONE element only.
6. Warm paper background — NEVER pure white.`;

/* ─── Per-slide prompt ────────────────────────────────────────────────────────── */
function buildSlidePrompt(slide: Slide, total: number): string {
  const arch = getArchetype(slide, total);
  const isLast = slide.position === total;

  const archNotes: Record<Arch, string> = {
    COVER: `COVER — Veil bg. Brand-dot + eyebrow. text-align:center on content. 124px headline ONE phrase brand. 44px lead. Spacer flex:1 max-height:180px. Footer: "point one zero" LEFT + "›" RIGHT.`,
    LIST: `LIST — 64px headline centered. Rule. flex:1 rows (flex layout, no text-align). Each: 24px mono brand number | 48px wt:600 name | 36px #767d87 desc. Rules between rows. Footer: wordmark left + › right.`,
    DEFINITION: `DEFINITION — text-align:center. Extract 1-word UPPERCASE INK. Font size by length: ≤4=220px, 5-6=180px, 7-8=140px, 9+=110px. Brand accent rule margin:28px auto 0. 44px definition. 40px body. Spacer flex:1 max-height:180px. Footer: wordmark left + › right.`,
    STAT: `STAT — text-align:center. Number row justify-content:center. 440px brand stat + 96px suffix opacity:0.55. 64px label. 40px body. Spacer flex:1 max-height:180px. Footer: wordmark left + › right.`,
    QUOTE: `QUOTE — Logo only header. Vertically centered content text-align:center. 96px brand " glyph. 72px wt:510 quote. Attribution below rule. Footer: wordmark left + › right.`,
    EDITORIAL: `EDITORIAL — Float:left 240px INK drop-cap (#0a0a0a NEVER brand). 64px body wraps beside. ONE brand word inline. 40px support paragraph text-align:center. Spacer flex:1 max-height:180px. Footer: wordmark left + › right.`,
    TWOCOL: `TWOCOL — 64px headline centered. Rule. Two columns, column headings + body. Footer: wordmark left + › right.`,
    CTA: `CTA — Veil bg. No brand-dot. text-align:center. 88px headline ONE phrase brand. 44px lead. Dark pill button. URL. Spacer flex:1 max-height:180px. Footer: "point one zero" LEFT ONLY — NO › (last slide).`,
  };

  return `Generate ONE 1080×1350px carousel slide. Match reference exactly.

SLIDE:
  Position: ${slide.position} of ${total}
  Archetype: ${arch}
  Title: "${slide.title}"
  Body: "${slide.body}"

${archNotes[arch]}

CHECKLIST before output:
✓ 1080×1350px, warm paper background (NOT white, NOT blue-grey)
✓ <link rsms.me/inter/inter.css> is FIRST child
✓ 96px horizontal padding throughout
✓ 65px INK logo top-right
✓ Header padding-top:80px, margin-top:24px before content
✓ Brand #009FEF on ONE element only
✓ Footer: margin-top:auto, "point one zero" 32px wt:510 left${isLast ? ", NO arrow (last slide)" : ", <img src='/assets/Swipe.png' width=36 height=36> right"}
✓ All content replaced with actual slide data

Return ONLY the <div>. Nothing else.`;
}

export const maxDuration = 120;

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
