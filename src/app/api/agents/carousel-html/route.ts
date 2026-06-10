import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeApiKey } from "@/lib/secrets";

type Slide = { position: number; type: string; title: string; body: string };
type Arch = "COVER" | "LIST" | "DEFINITION" | "STAT" | "QUOTE" | "EDITORIAL" | "TWOCOL" | "CTA";

/* ─── Shared design constants (derived from generate_carousel.py, scaled 1080→1024) ─── */
// Scale factor: 1024/1080 = 0.948
// Background: cool blue-grey top → warm cream bottom (matches reference PDF exactly)
const BG = "linear-gradient(168deg, #dae0ee 0%, #edf0f6 18%, #f5f4f0 50%, #ece7db 100%)";

// Logo: 62px (Python 65px × 0.948). INK #0a0a0a on all slides.
const LOGO = `<div style="width:62px;height:62px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="#0a0a0a" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>`;

// Swipe chevron: matches reference PDF solid › icon
const CHEVRON = `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;"><path d="M15 9L31 22L15 35" stroke="#0a0a0a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
   REFERENCE HTML — ALL MEASUREMENTS FROM generate_carousel.py, SCALED 1350→1280

   LAYOUT RULES (derived from Python script):
   ─────────────────────────────────────────────────────────────────────────────
   Canvas:          1024 × 1280 px
   Horizontal margin: 66px (Python ML=70px × 0.948)
   Eyebrow from top: 80px (Python 84px × 0.948)
   Content from top: 140px (Python 148px × 0.948) — FIXED on every slide
   Footer rule from top: 1194px (Python 1260px × 0.948) = 86px from bottom
   Logo size:        62px (Python 65px × 0.948)

   KEY SPACING RULE:
   header-area ≈ 80px → fixed spacer = 60px → content starts at 140px
   After content: flex:1 fills the gap → footer stays pinned at bottom
   Cover & CTA: flex:1 is AFTER content (gap below content), NOT before it

════════════════════════════════════════════════════════════════════════════════ */

const REF_COVER = `<!-- COVER: content near top, flex:1 gap BELOW content, footer pinned -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <!-- HEADER: eyebrow + logo at ~80px from top -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:10px;padding-top:4px;">
      <div style="width:9px;height:9px;border-radius:50%;background:#009FEF;flex-shrink:0;"></div>
      <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;">AI Experience Design</span>
    </div>
    ${LOGO}
  </div>
  <!-- SPACER: 60px → positions headline at 140px from top -->
  <div style="height:60px;flex-shrink:0;"></div>
  <!-- CONTENT: headline + lead -->
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="font-family:'Inter',sans-serif;font-size:88px;font-weight:800;line-height:1.04;letter-spacing:-3.5px;color:#0a0a0a;">Most enterprise<br>AI fails on the<br><span style="color:#009FEF;">experience</span></div>
    <div style="height:44px;"></div>
    <p style="font-family:'Inter',sans-serif;font-size:32px;font-weight:400;color:#777777;line-height:1.52;letter-spacing:-0.4px;margin:0;max-width:840px;">Not the models. Not the engineering. Nobody designed how people actually use it.</p>
  </div>
  <!-- flex:1 AFTER content — creates the characteristic empty space below lead text -->
  <div style="flex:1;"></div>
  <!-- FOOTER: pinned at bottom -->
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_LIST = `<!-- LIST: headline + 4 rows that flex to fill space evenly, row text centered -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;padding-top:4px;">What Design Solves</span>
    ${LOGO}
  </div>
  <div style="height:60px;flex-shrink:0;"></div>
  <!-- Headline at 140px from top -->
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="font-family:'Inter',sans-serif;font-size:62px;font-weight:800;line-height:1.1;letter-spacing:-2px;color:#0a0a0a;">Four problems<br>only design solves</div>
  </div>
  <!-- Rule 24px below headline -->
  <div style="height:24px;flex-shrink:0;"></div>
  <div style="height:1px;background:#c8cdd8;margin:0 66px;flex-shrink:0;"></div>
  <!-- ROWS: flex:1 container distributes 4 rows evenly to fill remaining space -->
  <div style="flex:1;padding:0 66px;display:flex;flex-direction:column;">
    <!-- Row 1 -->
    <div style="flex:1;display:flex;align-items:center;gap:0;">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;color:#009FEF;width:40px;flex-shrink:0;">01</span>
      <div style="width:390px;flex-shrink:0;">
        <span style="font-family:'Inter',sans-serif;font-size:42px;font-weight:800;color:#0a0a0a;letter-spacing:-1px;">Adoption</span>
      </div>
      <span style="font-family:'Inter',sans-serif;font-size:28px;font-weight:400;color:#888888;letter-spacing:-0.3px;line-height:1.4;flex:1;">People actually use it</span>
    </div>
    <div style="height:1px;background:#c8cdd8;flex-shrink:0;"></div>
    <!-- Row 2 -->
    <div style="flex:1;display:flex;align-items:center;gap:0;">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;color:#009FEF;width:40px;flex-shrink:0;">02</span>
      <div style="width:390px;flex-shrink:0;">
        <span style="font-family:'Inter',sans-serif;font-size:42px;font-weight:800;color:#0a0a0a;letter-spacing:-1px;">Trust</span>
      </div>
      <span style="font-family:'Inter',sans-serif;font-size:28px;font-weight:400;color:#888888;letter-spacing:-0.3px;line-height:1.4;flex:1;">They act without re-checking</span>
    </div>
    <div style="height:1px;background:#c8cdd8;flex-shrink:0;"></div>
    <!-- Row 3 -->
    <div style="flex:1;display:flex;align-items:center;gap:0;">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;color:#009FEF;width:40px;flex-shrink:0;">03</span>
      <div style="width:390px;flex-shrink:0;">
        <span style="font-family:'Inter',sans-serif;font-size:42px;font-weight:800;color:#0a0a0a;letter-spacing:-1px;">Governance</span>
      </div>
      <span style="font-family:'Inter',sans-serif;font-size:28px;font-weight:400;color:#888888;letter-spacing:-0.3px;line-height:1.4;flex:1;">The business owns the rules</span>
    </div>
    <div style="height:1px;background:#c8cdd8;flex-shrink:0;"></div>
    <!-- Row 4 -->
    <div style="flex:1;display:flex;align-items:center;gap:0;">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;color:#009FEF;width:40px;flex-shrink:0;">04</span>
      <div style="width:390px;flex-shrink:0;">
        <span style="font-family:'Inter',sans-serif;font-size:42px;font-weight:800;color:#0a0a0a;letter-spacing:-1px;">Usefulness</span>
      </div>
      <span style="font-family:'Inter',sans-serif;font-size:28px;font-weight:400;color:#888888;letter-spacing:-0.3px;line-height:1.4;flex:1;">Correct and actually helpful</span>
    </div>
    <div style="height:1px;background:#c8cdd8;flex-shrink:0;"></div>
  </div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_DEFINITION = `<!-- DEFINITION: keyword at 140px from top, accent rule, bold definition, grey body -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;padding-top:4px;">The Case</span>
    ${LOGO}
  </div>
  <div style="height:60px;flex-shrink:0;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="font-family:'Inter',sans-serif;font-size:148px;font-weight:800;line-height:0.9;letter-spacing:-8px;color:#0a0a0a;text-transform:uppercase;">DESIGN</div>
    <div style="width:90px;height:4px;background:#009FEF;margin:28px 0 0;flex-shrink:0;"></div>
    <div style="height:22px;"></div>
    <div style="font-family:'Inter',sans-serif;font-size:40px;font-weight:700;line-height:1.28;letter-spacing:-0.8px;color:#0a0a0a;max-width:840px;">Not decoration applied after engineering finishes. The structural layer that decides whether the product is adopted at all.</div>
    <div style="height:20px;"></div>
    <p style="font-family:'Inter',sans-serif;font-size:29px;font-weight:400;color:#888888;line-height:1.52;letter-spacing:-0.3px;margin:0;max-width:840px;">You cannot design every conversation. You design the building blocks and the rules — the AI fills in the rest.</p>
  </div>
  <div style="flex:1;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_STAT = `<!-- STAT: giant number at 140px, label, body, flex:1 gap to footer -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;padding-top:4px;">The Problem</span>
    ${LOGO}
  </div>
  <div style="height:60px;flex-shrink:0;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="display:flex;align-items:flex-end;line-height:1;">
      <span style="font-family:'Inter',sans-serif;font-size:236px;font-weight:800;line-height:0.86;letter-spacing:-13px;color:#009FEF;">73</span>
      <span style="font-family:'Inter',sans-serif;font-size:95px;font-weight:700;line-height:1;letter-spacing:-3px;color:#888888;padding-bottom:6px;">%</span>
    </div>
    <div style="height:48px;"></div>
    <div style="font-family:'Inter',sans-serif;font-size:44px;font-weight:800;line-height:1.22;letter-spacing:-1.5px;color:#0a0a0a;max-width:840px;">of enterprise AI projects fail — because the experience was never designed.</div>
    <div style="height:22px;"></div>
    <p style="font-family:'Inter',sans-serif;font-size:27px;font-weight:400;color:#888888;line-height:1.52;letter-spacing:-0.3px;margin:0;max-width:840px;">The AI provides intelligence. Engineering provides infrastructure. Design provides the reason anyone uses it.</p>
  </div>
  <div style="flex:1;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_QUOTE = `<!-- QUOTE: vertically centered block between header and footer -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <div style="display:flex;justify-content:flex-end;padding:56px 66px 0;flex-shrink:0;">
    ${LOGO}
  </div>
  <!-- Quote content vertically centered between header and footer -->
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 66px;">
    <div style="font-family:'Inter',sans-serif;font-size:100px;font-weight:800;color:#009FEF;line-height:0.9;letter-spacing:-2px;margin-bottom:14px;">"</div>
    <div style="font-family:'Inter',sans-serif;font-size:60px;font-weight:700;line-height:1.14;letter-spacing:-1.8px;color:#0a0a0a;max-width:840px;">Speed without clarity just reaches the wrong outcome faster.</div>
    <div style="height:44px;"></div>
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="padding-top:20px;">
      <div style="font-family:'Inter',sans-serif;font-size:34px;font-weight:700;color:#0a0a0a;letter-spacing:-0.5px;">Point One Zero</div>
      <div style="font-family:'Inter',sans-serif;font-size:20px;font-weight:400;color:#888888;letter-spacing:0.04em;text-transform:uppercase;margin-top:8px;">Internal · 2026</div>
    </div>
  </div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_EDITORIAL = `<!-- EDITORIAL: drop cap at 140px from top, editorial body, flex:1 gap before footer -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;padding-top:4px;">The Reframe</span>
    ${LOGO}
  </div>
  <div style="height:60px;flex-shrink:0;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <!-- Drop cap row: large "A" floated left, text flows beside it -->
    <div style="display:flex;align-items:flex-start;gap:14px;">
      <div style="font-family:'Inter',sans-serif;font-size:156px;font-weight:800;line-height:0.88;letter-spacing:-4px;color:#009FEF;flex-shrink:0;">A</div>
      <div style="font-family:'Inter',sans-serif;font-size:47px;font-weight:700;line-height:1.22;letter-spacing:-0.8px;color:#0a0a0a;padding-top:8px;">n AI chat is not a search bar. It must earn <span style="color:#009FEF;">trust</span>, stay compliant, and prove its value — all through a single screen.</div>
    </div>
    <div style="height:24px;"></div>
    <p style="font-family:'Inter',sans-serif;font-size:29px;font-weight:400;color:#888888;line-height:1.52;letter-spacing:-0.3px;margin:0;max-width:840px;">The difference between adoption and abandonment is almost never the intelligence of the model. It is whether people could use it on the first day without a training session.</p>
  </div>
  <div style="flex:1;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_TWOCOL = `<!-- TWOCOL: headline at 140px, rule, two equal columns fill remaining space -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;padding-top:4px;">Where It Gets Real</span>
    ${LOGO}
  </div>
  <div style="height:60px;flex-shrink:0;"></div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="font-family:'Inter',sans-serif;font-size:60px;font-weight:800;line-height:1.1;letter-spacing:-2px;color:#0a0a0a;">Two layers decide<br>whether anyone acts.</div>
  </div>
  <div style="height:1px;background:#c8cdd8;margin:28px 66px;flex-shrink:0;"></div>
  <!-- Two columns fill the remaining space -->
  <div style="display:flex;flex:1;overflow:hidden;padding-bottom:0;">
    <div style="flex:1;padding:0 32px 0 66px;display:flex;flex-direction:column;">
      <div style="font-family:'Inter',sans-serif;font-size:50px;font-weight:800;letter-spacing:-1.5px;color:#0a0a0a;margin-bottom:20px;">Trust</div>
      <p style="font-family:'Inter',sans-serif;font-size:27px;font-weight:400;color:#888888;line-height:1.52;letter-spacing:-0.3px;margin:0;">Earned by showing your work — sources, confidence, and a way to flag mistakes on every answer. Or people re-check by hand.</p>
    </div>
    <div style="width:1px;background:#c8cdd8;flex-shrink:0;"></div>
    <div style="flex:1;padding:0 66px 0 32px;display:flex;flex-direction:column;">
      <div style="font-family:'Inter',sans-serif;font-size:50px;font-weight:800;letter-spacing:-1.5px;color:#0a0a0a;margin-bottom:20px;">Agentic action</div>
      <p style="font-family:'Inter',sans-serif;font-size:27px;font-weight:400;color:#888888;line-height:1.52;letter-spacing:-0.3px;margin:0;">When the AI acts, not just answers, design keeps the human in control. This is where AI liability lives.</p>
    </div>
  </div>
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
      ${CHEVRON}
    </div>
  </div>
</div>`;

const REF_CTA = `<!-- CTA: content near top (same as Cover), flex:1 gap below, no chevron -->
<div style="width:1024px;height:1280px;background:${BG};font-family:'Inter',sans-serif;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <!-- HEADER: eyebrow (no brand dot on CTA) + logo -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:56px 66px 0;flex-shrink:0;">
    <span style="font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;padding-top:4px;">Point One Zero</span>
    ${LOGO}
  </div>
  <!-- SPACER: 60px → positions headline at 140px from top (same as Cover) -->
  <div style="height:60px;flex-shrink:0;"></div>
  <!-- CONTENT: headline + lead + button + URL -->
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="font-family:'Inter',sans-serif;font-size:82px;font-weight:800;line-height:1.06;letter-spacing:-3px;color:#0a0a0a;">We design AI<br>products people<br><span style="color:#009FEF;">actually use</span></div>
    <div style="height:34px;"></div>
    <p style="font-family:'Inter',sans-serif;font-size:32px;font-weight:400;color:#777777;line-height:1.45;letter-spacing:-0.4px;margin:0;max-width:840px;">The full 12-layer framework — built for the leaders shipping enterprise AI.</p>
    <div style="height:44px;"></div>
    <div style="display:inline-flex;align-items:center;background:#0a0a0a;border-radius:9999px;padding:18px 44px;flex-shrink:0;">
      <span style="font-family:'Inter',sans-serif;font-size:27px;font-weight:700;color:#ffffff;letter-spacing:0.03em;">Follow for more insights</span>
    </div>
    <div style="height:32px;"></div>
    <div style="font-family:'Inter',sans-serif;font-size:23px;font-weight:400;color:#888888;letter-spacing:0.01em;">pointonezero.com</div>
  </div>
  <!-- flex:1 AFTER content — creates empty space below URL (matching reference PDF) -->
  <div style="flex:1;"></div>
  <!-- FOOTER: no chevron on last slide -->
  <div style="padding:0 66px;flex-shrink:0;">
    <div style="height:1px;background:#c8cdd8;"></div>
    <div style="padding:16px 0 20px;">
      <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
    </div>
  </div>
</div>`;

/* ─── System prompt ──────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are a senior visual designer at Point One Zero (POZ).
Output production-ready HTML for a single 1024×1280px LinkedIn carousel slide that EXACTLY matches the reference PDF (LinkedIn_Post_Reference.pdf).

════════════════════════════════════════════
CRITICAL LAYOUT RULE — READ THIS FIRST
════════════════════════════════════════════
Every slide uses this structure derived from generate_carousel.py (scaled 1350→1280px):

  HEADER  → padding-top:56px, eyebrow+logo at ~80px from top
  SPACER  → height:60px (fixed) → positions headline at EXACTLY 140px from top
  CONTENT → starts at 140px from top
  flex:1  → empty gap (fills remaining space, pushes footer down)
  FOOTER  → pinned at bottom, ~86px tall

COVER and CTA: the flex:1 goes AFTER the content (not before).
This creates the characteristic large empty space BELOW the text, matching the reference PDF.
The empty space is NOT a mistake — it is the correct design.

════════════════════════════════════════════
DESIGN TOKENS (from generate_carousel.py)
════════════════════════════════════════════
Canvas:    1024×1280px
Margin:    66px (left and right)
BG:        linear-gradient(168deg, #dae0ee 0%, #edf0f6 18%, #f5f4f0 50%, #ece7db 100%)
INK:       #0a0a0a   — headlines, wordmark, logo, button bg
BRAND:     #009FEF   — ONE featured element per slide
GREY:      #888888   — eyebrow, descriptions, body, attribution, URL
DARK:      #777777   — lead paragraph (Cover, CTA)
RULE:      #c8cdd8   — all 1px dividers

════════════════════════════════════════════
FONT (Inter only — always load first)
════════════════════════════════════════════
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
MUST be first child of root div.

NEVER use: Bebas Neue, Impact, Arial Narrow, system fonts.
font-family:'Inter',sans-serif on every element.

Sizes (from Python script, scaled 0.948):
  236px 800 → stat giant number
  156px 800 → editorial drop cap
  148px 800 → definition WORD (uppercase, line-height:0.9)
   88px 800 → cover headline (line-height:1.04)
   82px 800 → cta headline (line-height:1.06)
   62px 800 → list headline (line-height:1.1)
   60px 700 → quote text (line-height:1.14)
   60px 800 → twocol headline (line-height:1.1)
   50px 800 → twocol column heading
   47px 700 → editorial text beside drop cap (line-height:1.22)
   44px 800 → stat label (line-height:1.22)
   42px 800 → list item name
   40px 700 → definition sub-headline (line-height:1.28)
   34px 700 → quote attribution name
   32px 400 → cover lead (line-height:1.52)
   32px 400 → cta lead (line-height:1.45)
   29px 400 → definition body, editorial body, stat body (line-height:1.52)
   28px 400 → list description, twocol column body (line-height:1.4)
   27px 700 → cta pill button text
   23px 400 → cta URL
   21px 700 → footer wordmark
   20px 600 → list item number (brand blue)
   13px 600 → eyebrow label

Tracking:
  ≥80px: letter-spacing:-3px to -13px (negative, tighten)
  40-79px: -0.8px to -2px
  Body: -0.3px to -0.4px
  Eyebrow: +0.05em (positive, open)

════════════════════════════════════════════
LOGO (62px, INK #0a0a0a, top-right ALL slides)
════════════════════════════════════════════
<div style="width:62px;height:62px;flex-shrink:0;"><svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><path fill="#0a0a0a" fill-rule="evenodd" d="M15,28 H67 Q82,28 82,43 V95 Q82,110 67,110 H15 Q0,110 0,95 V43 Q0,28 15,28 Z M43,0 H95 Q110,0 110,15 V67 Q110,82 95,82 H43 Q28,82 28,67 V15 Q28,0 43,0 Z"/></svg></div>

════════════════════════════════════════════
CHEVRON (all slides except CTA/last)
════════════════════════════════════════════
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" style="flex-shrink:0;"><path d="M15 9L31 22L15 35" stroke="#0a0a0a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>

════════════════════════════════════════════
FOOTER (all slides)
════════════════════════════════════════════
<div style="padding:0 66px;flex-shrink:0;">
  <div style="height:1px;background:#c8cdd8;"></div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 20px;">
    <span style="font-family:'Inter',sans-serif;font-size:21px;font-weight:700;color:#0a0a0a;letter-spacing:0.01em;">point one zero</span>
    [CHEVRON — omit on CTA/last slide]
  </div>
</div>

════════════════════════════════════════════
EIGHT REFERENCE SLIDES — MATCH EXACTLY
════════════════════════════════════════════

${REF_COVER}

${REF_LIST}

${REF_DEFINITION}

${REF_STAT}

${REF_QUOTE}

${REF_EDITORIAL}

${REF_TWOCOL}

${REF_CTA}

════════════════════════════════════════════
ARCHETYPE-SPECIFIC LAYOUT NOTES
════════════════════════════════════════════

COVER & CTA — THE CRITICAL SPACING RULE:
  Structure: header → 60px spacer → content → flex:1 → footer
  The flex:1 is AFTER the text content.
  This creates ~500px of empty space below the last text line — this is CORRECT.
  Do NOT put flex:1 before the headline. It would push everything to the bottom, which is WRONG.

LIST — ROW DISTRIBUTION:
  After headline + 24px + rule, use flex:1 container with flex-direction:column.
  Each row is flex:1, giving equal height (~217px per row for 4 items).
  Row layout (fixed column widths):
    number: width:40px, Inter 600 20px #009FEF
    name:   width:390px, Inter 800 42px #0a0a0a letter-spacing:-1px
    desc:   flex:1, Inter 400 28px #888888 line-height:1.4
  Separator rule: height:1px background:#c8cdd8 flex-shrink:0 between rows.
  The last rule is AFTER the last row (then footer section follows).

DEFINITION — KEYWORD SIZE:
  The WORD is 148px Inter 800, line-height:0.9, uppercase.
  Accent rule: width:90px height:4px background:#009FEF, margin:28px 0 0.
  Sub-headline: Inter 700 40px (bold, not regular).
  Body: Inter 400 29px #888888.

STAT — NUMBER SCALE:
  Giant number: 236px Inter 800, line-height:0.86, letter-spacing:-13px.
  Suffix: 95px Inter 700, #888888, align to baseline of number.
  48px gap after number before label.

EDITORIAL — DROP CAP:
  Drop cap letter: 156px Inter 800, #009FEF, line-height:0.88, flex-shrink:0.
  Text beside it: Inter 700 47px, padding-top:8px, 14px gap from cap.
  The text WRAPS beside the cap (not below it).
  Body paragraph: Inter 400 29px #888888 below the cap row, height:24px gap.

QUOTE — VERTICAL CENTERING:
  Header (logo only, right-aligned).
  flex:1 on content area with justify-content:center.
  No fixed spacer needed — the quote block is perfectly centered vertically.
  Opening glyph: " character, 100px Inter 800, #009FEF, line-height:0.9.
  Quote text: 60px Inter 700, max-width:840px.
  Attribution: 1px rule + name (34px 700) + source (20px 400 uppercase grey).

TWOCOL — COLUMN WIDTHS:
  Headline (60px 800), then 1px horizontal rule at margin:28px 66px.
  Two-column flex row fills flex:1 (no additional flex:1 needed before footer).
  Left: padding 0 32px 0 66px | Right: padding 0 66px 0 32px.
  Vertical rule: 1px #c8cdd8 at center.
  Column heading: 50px 800 | Body: 27px 400 #888888.

════════════════════════════════════════════
OUTPUT RULE
════════════════════════════════════════════
Return ONLY the <div>. No markdown, no explanation, no wrapper.
<link> MUST be the first child of root div.
Replace ALL sample content with actual slide content.
Match ALL sizes, colors, spacing to the reference block.`;

/* ─── Per-slide prompt builder ───────────────────────────────────────────────── */
function buildSlidePrompt(slide: Slide, total: number): string {
  const arch = getArchetype(slide, total);
  const isLast = slide.position === total;

  const instructions: Record<Arch, string> = {
    COVER: `Archetype: COVER.
Structure: header → 60px spacer → content → flex:1 → footer
The flex:1 is AFTER content. Do NOT put it before the headline.
Header: 9px brand dot + eyebrow (2-3 word topic, all-caps grey 13px 600) + 62px INK logo (right side, no counter shown).
Headline: Inter 800 88px line-height:1.04 letter-spacing:-3.5px #0a0a0a, max 3 lines with <br>. ONE word/phrase = color:#009FEF.
Height:44px spacer after headline.
Lead: Inter 400 32px #777777 max-width:840px line-height:1.52 letter-spacing:-0.4px. Use body text.
Then flex:1 (empty gap). Then footer + chevron.`,

    LIST: `Archetype: LIST.
Structure: header → 60px spacer → headline → 24px + rule → flex:1 rows → footer
Header: eyebrow (2-3 words, all-caps grey 13px 600) + 62px INK logo.
Headline: Inter 800 62px line-height:1.1 letter-spacing:-2px #0a0a0a, max 2 lines. Use title.
flex:1 container (display:flex;flex-direction:column) holding rows:
  Each row: flex:1 (equal height, ~217px each), display:flex, align-items:center.
  Columns (fixed widths, no gap):
    Number: width:40px Inter 600 20px #009FEF ("01","02","03"...)
    Name:   width:390px Inter 800 42px #0a0a0a letter-spacing:-1px
    Desc:   flex:1 Inter 400 28px #888888 line-height:1.4
  Rule after each row: height:1px background:#c8cdd8 flex-shrink:0.
Parse body into 3-4 items. Each "Name: description" becomes a row.
Then footer + chevron.`,

    DEFINITION: `Archetype: DEFINITION.
Structure: header → 60px spacer → content → flex:1 → footer
Header: eyebrow (2-3 words, all-caps) + 62px INK logo.
Keyword: Inter 800 148px uppercase #0a0a0a line-height:0.9 letter-spacing:-8px. Use FIRST WORD of title (1 word).
Accent rule: width:90px height:4px background:#009FEF margin:28px 0 0.
Height:22px spacer.
Sub-headline: Inter 700 40px #0a0a0a line-height:1.28 letter-spacing:-0.8px max-width:840px. First sentence of body.
Height:20px spacer.
Body: Inter 400 29px #888888 line-height:1.52 letter-spacing:-0.3px max-width:840px. Second sentence.
flex:1. Footer + chevron.`,

    STAT: `Archetype: STAT.
Structure: header → 60px spacer → content → flex:1 → footer
Header: eyebrow (2-3 words) + 62px INK logo.
Extract key NUMBER from title/body (any digit sequence + suffix like %, x, k).
Number: Inter 800 236px #009FEF line-height:0.86 letter-spacing:-13px.
Suffix: Inter 700 95px #888888 line-height:1 letter-spacing:-3px padding-bottom:6px (align to baseline).
Height:48px spacer.
Label: Inter 800 44px #0a0a0a line-height:1.22 letter-spacing:-1.5px max-width:840px. Title as label.
Height:22px.
Body: Inter 400 27px #888888 line-height:1.52 letter-spacing:-0.3px max-width:840px. Body text.
flex:1. Footer + chevron.`,

    QUOTE: `Archetype: QUOTE.
Structure: header (logo only, right) → flex:1 (vertically centers the quote block) → footer
Header: 62px INK logo right-aligned only. No eyebrow. No fixed spacer.
Content area: flex:1, display:flex, flex-direction:column, justify-content:center, padding:0 66px.
  Opening glyph: " — Inter 800 100px #009FEF line-height:0.9 letter-spacing:-2px margin-bottom:14px.
  Quote: Inter 700 60px #0a0a0a max-width:840px line-height:1.14 letter-spacing:-1.8px. Body text as quote.
  Height:44px spacer.
  1px rule #c8cdd8 full width.
  Name: Inter 700 34px #0a0a0a letter-spacing:-0.5px padding-top:20px.
  Source: Inter 400 20px #888888 uppercase letter-spacing:0.04em margin-top:8px.
Footer + chevron.`,

    EDITORIAL: `Archetype: EDITORIAL.
Structure: header → 60px spacer → drop-cap block → body → flex:1 → footer
Header: eyebrow (2-3 words) + 62px INK logo.
Drop-cap row: display:flex align-items:flex-start gap:14px.
  Cap: FIRST LETTER of body — Inter 800 156px #009FEF line-height:0.88 letter-spacing:-4px flex-shrink:0.
  Text: Inter 700 47px #0a0a0a line-height:1.22 letter-spacing:-0.8px padding-top:8px.
    Include ONE key word/phrase as color:#009FEF inline.
Height:24px spacer.
Body: Inter 400 29px #888888 max-width:840px line-height:1.52 letter-spacing:-0.3px.
flex:1. Footer + chevron.`,

    TWOCOL: `Archetype: TWOCOL.
Structure: header → 60px spacer → headline → rule → two-column flex:1 → footer
Header: eyebrow (2-3 words) + 62px INK logo.
Headline: Inter 800 60px #0a0a0a line-height:1.1 letter-spacing:-2px, max 2 lines.
1px rule #c8cdd8 at margin:28px 66px flex-shrink:0.
Two-column flex row: flex:1, overflow:hidden, no padding-bottom.
  LEFT (flex:1 padding:0 32px 0 66px flex-direction:column):
    Heading: Inter 800 50px #0a0a0a letter-spacing:-1.5px margin-bottom:20px.
    Body: Inter 400 27px #888888 line-height:1.52 letter-spacing:-0.3px.
  Vertical rule: 1px #c8cdd8 flex-shrink:0.
  RIGHT (flex:1 padding:0 66px 0 32px flex-direction:column):
    Same structure.
For 6+ items (dense content), use 2-column numbered grid inside the two-column flex.
Footer + chevron.

IF grid mode (6+ items):
  Each grid-row: display:flex, 1px rule below.
  Left cell: blue number 20px 600 (width:40px) + name 32px 700 #0a0a0a (flex:1), padding:18px 32px 18px 66px.
  Right cell: blue number 20px 600 (width:40px) + name 32px 700 #0a0a0a (flex:1), padding:18px 66px 18px 32px.`,

    CTA: `Archetype: CTA.
Structure: header → 60px spacer → content → flex:1 → footer (NO chevron)
Background: ${BG} — WARM PAPER, NOT dark, NOT blue.
Header: eyebrow "Point One Zero" (Inter 600 13px #888888 uppercase) + 62px INK logo. No brand dot.
Fixed 60px spacer after header.
Content:
  Headline: Inter 800 82px #0a0a0a line-height:1.06 letter-spacing:-3px, max 3 lines with <br>. ONE phrase = color:#009FEF.
  Height:34px.
  Lead: Inter 400 32px #777777 max-width:840px line-height:1.45 letter-spacing:-0.4px. Body text.
  Height:44px.
  Pill button: display:inline-flex background:#0a0a0a border-radius:9999px padding:18px 44px flex-shrink:0.
    Text: Inter 700 27px #ffffff letter-spacing:0.03em. "Follow for more insights" or relevant CTA.
  Height:32px.
  URL: Inter 400 23px #888888 letter-spacing:0.01em "pointonezero.com".
flex:1 AFTER content (empty space below URL).
Footer: rule + "point one zero" — NO chevron (last slide).`,
  };

  return `Generate ONE 1024×1280px LinkedIn carousel slide. Match LinkedIn_Post_Reference.pdf exactly.

SLIDE DATA:
  Position: ${slide.position} of ${total}
  Type: ${slide.type} → Archetype: ${arch}
  Title: "${slide.title}"
  Body: "${slide.body}"
  Last slide: ${isLast}

${instructions[arch]}

SPACING CHECKLIST:
✓ Root: width:1024px height:1280px background:linear-gradient(168deg,#dae0ee 0%,#edf0f6 18%,#f5f4f0 50%,#ece7db 100%) flex-direction:column overflow:hidden
✓ <link> Inter 400,600,700,800 is the FIRST child of root div
✓ Header padding-top:56px, 62px INK logo
✓ 60px fixed spacer after header (except QUOTE which uses flex:1 to center)
✓ COVER and CTA: flex:1 is AFTER content, NOT before headline
✓ BRAND #009FEF on ONE element only
✓ Footer: "point one zero" 21px 700 #0a0a0a, rule #c8cdd8 ${isLast ? "— NO chevron" : "— WITH chevron"}
✓ All content uses actual slide data — no generic filler text

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
