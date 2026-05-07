type Slide = { position: number; type: string; title: string; body: string };

export type DesignParams = {
  accentColor: string;
  bgColor: string;
  titleColor: string;
  blobOpacity: number;
  darkMode: boolean;
};

const DEFAULT_DESIGN: DesignParams = {
  accentColor: "#009FF0",
  bgColor: "#FFFFFF",
  titleColor: "#111111",
  blobOpacity: 0.045,
  darkMode: false,
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

export function buildCarouselPython(
  slides: Slide[],
  topic: string,
  hashtags: string[],
  designParams?: Partial<DesignParams>
): string {
  const dp: DesignParams = { ...DEFAULT_DESIGN, ...designParams };
  const [ar, ag, ab] = hexToRgb(dp.accentColor);
  const [br, bg2, bb] = hexToRgb(dp.bgColor);
  const [tr, tg, tb] = hexToRgb(dp.titleColor);
  const blobAlpha = dp.blobOpacity;
  const ctaBg = dp.darkMode ? "#1A1A2E" : "#F0EEF8";
  const sepColor = dp.darkMode ? "#2A2A3A" : "#E8E8E8";
  const bodyGray = dp.darkMode ? "#AAAAAA" : "#444444";
  const darkGray = dp.darkMode ? "#CCCCCC" : "#333333";
  const badgeBg = dp.darkMode ? "#1A2A3A" : "#EAF5FE";

  const slidesJson   = JSON.stringify(slides);
  const hashtagsJson = JSON.stringify(hashtags);
  const topicJson    = JSON.stringify(topic);

  return `
import subprocess, base64, math, random, re
subprocess.run(["pip", "install", "reportlab", "-q"], capture_output=True)

from reportlab.pdfgen import canvas as rlcanvas
from reportlab.lib.colors import HexColor, Color, white, black

# ── Dimensions ────────────────────────────────────────────────────────────────
SLIDE_W = 1080
SLIDE_H = 1350
CX      = SLIDE_W // 2
MARGIN  = 80

# ── Brand colours (from designParams) ─────────────────────────────────────────
BLUE     = Color(${ar}, ${ag}, ${ab})
BLACK    = Color(${tr}, ${tg}, ${tb})
DARKGRAY = HexColor('${darkGray}')
BODYGRAY = HexColor('${bodyGray}')
WHITE    = white
BG       = Color(${br}, ${bg2}, ${bb})
BG_CTA   = HexColor('${ctaBg}')
SEPCOL   = HexColor('${sepColor}')
BADGEBG  = HexColor('${badgeBg}')
BLOB_A   = ${blobAlpha}

# ── Layout zones ───────────────────────────────────────────────────────────────
FOOTER_H   = 260          # body-text zone height from bottom
FOOTER_SEP = FOOTER_H     # separator line y
ILLUS_BOT  = FOOTER_H + 24

# ─────────────────────────────────────────────────────────────────────────────
# BACKGROUND  — soft blue glow blob (simulates gradient, like reference)
# ─────────────────────────────────────────────────────────────────────────────

def draw_bg_cover(c):
    for i in range(7):
        alpha = BLOB_A * (7 - i) / 7
        r     = 420 * (1 + i * 0.28)
        c.setFillColor(Color(${ar}, ${ag}, ${ab}, alpha=alpha))
        c.circle(SLIDE_W + 60, -80, r, fill=1, stroke=0)

def draw_bg_content(c):
    for i in range(5):
        alpha = BLOB_A * 0.78 * (5 - i) / 5
        r     = 260 * (1 + i * 0.35)
        c.setFillColor(Color(${ar}, ${ag}, ${ab}, alpha=alpha))
        c.circle(CX, SLIDE_H + 80, r, fill=1, stroke=0)

def draw_bg_cta(c):
    for i in range(6):
        alpha = BLOB_A * 0.89 * (6 - i) / 6
        r     = 350 * (1 + i * 0.3)
        c.setFillColor(Color(${ar}, ${ag}, ${ab}, alpha=alpha))
        c.circle(CX, CX, r, fill=1, stroke=0)

# ─────────────────────────────────────────────────────────────────────────────
# LOGO helpers
# ─────────────────────────────────────────────────────────────────────────────

def draw_poz_mark(c, cx, cy, size=24):
    sq  = int(size * 0.76)
    gap = int(size * 0.32)
    r   = max(3, int(sq * 0.22))
    x1  = cx - (sq + gap) // 2
    y1  = cy - (sq + gap) // 2
    c.setFillColor(BLACK)
    c.roundRect(x1,       y1,       sq, sq, r, fill=1, stroke=0)
    c.roundRect(x1 + gap, y1 + gap, sq, sq, r, fill=1, stroke=0)

def draw_logo_centered(c, cx, top_y):
    mark_cy = top_y - 20
    draw_poz_mark(c, cx, mark_cy, size=24)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 21)
    c.drawCentredString(cx, mark_cy - 24, "point")
    c.drawCentredString(cx, mark_cy - 48, "one zero")
    return mark_cy - 58

def draw_logo_outline_tr(c, bg_col):
    sq, gap, r, pad = 30, 13, 6, 52
    x1 = SLIDE_W - pad - sq - gap
    y1 = SLIDE_H - pad - sq - gap
    c.setFillColor(bg_col)
    c.setStrokeColor(BLACK)
    c.setLineWidth(2.5)
    c.roundRect(x1,        y1,        sq, sq, r, fill=1, stroke=1)
    c.roundRect(x1 + gap,  y1 + gap,  sq, sq, r, fill=1, stroke=1)

# ─────────────────────────────────────────────────────────────────────────────
# BADGE — slide number pill (like "RULE 1" in reference)
# ─────────────────────────────────────────────────────────────────────────────

def draw_badge(c, label, cx, y):
    bw, bh = 200, 46
    c.setFillColor(BADGEBG)
    c.setStrokeColor(BLUE)
    c.setLineWidth(1.5)
    c.roundRect(cx - bw // 2, y, bw, bh, bh // 2, fill=1, stroke=1)
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(cx, y + bh // 2 - 6, label.upper())

# ─────────────────────────────────────────────────────────────────────────────
# ARROW
# ─────────────────────────────────────────────────────────────────────────────

def draw_arrow(c):
    s  = 26
    tx = SLIDE_W - 60
    ay = 90
    c.setFillColor(BLACK)
    p = c.beginPath()
    p.moveTo(tx,              ay)
    p.lineTo(tx - int(s*1.2), ay + s)
    p.lineTo(tx - int(s*1.2), ay - s)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

# ─────────────────────────────────────────────────────────────────────────────
# TEXT helpers
# ─────────────────────────────────────────────────────────────────────────────

def wrap_text(c, text, font, size, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if c.stringWidth(t, font, size) <= max_w:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def strip_md(text):
    return re.sub(r'\\*{1,2}([^*]+)\\*{1,2}', r'\\1', text).strip()

def best_title_size(char_n):
    if char_n < 18: return 96
    if char_n < 28: return 84
    if char_n < 40: return 72
    if char_n < 55: return 60
    return 50

def split_sentences(text):
    parts = re.split(r'(?<=[.!?])\\s+', text.strip())
    return [p.rstrip('.,!?').strip() for p in parts if len(p.strip()) > 8]

def find_stat(text):
    m = re.search(r'(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:%|x|X|\\+)?|\\$\\d+[KMBkmb]?)', text or "")
    return m.group(0).strip() if m else None

# ─────────────────────────────────────────────────────────────────────────────
# ILLUSTRATION 1 — Editorial numbered list  (reference: font table, rule list)
# ─────────────────────────────────────────────────────────────────────────────

def draw_editorial_list(c, phrases, cx, cy, avail_w):
    count   = min(len(phrases), 4)
    items   = phrases[:count]
    row_h   = 88
    gap     = 16
    total_h = count * row_h + (count - 1) * gap
    sy      = cy + total_h / 2
    cw      = min(avail_w + 20, 940)
    lx      = cx - cw // 2

    for i, phrase in enumerate(items):
        iy = sy - i * (row_h + gap) - row_h

        # Thin separator line above (except first)
        if i > 0:
            c.setStrokeColor(SEPCOL)
            c.setLineWidth(1)
            c.line(lx + 56, iy + row_h + gap // 2, lx + cw, iy + row_h + gap // 2)

        # Number badge
        badge_cx = lx + 34
        badge_cy = iy + row_h // 2
        c.setFillColor(BLUE)
        c.circle(badge_cx, badge_cy, 28, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(badge_cx, badge_cy - 7, str(i + 1))

        # Phrase text — two sub-lines if long
        max_w = cw - 90
        fsize = 28
        display = phrase
        while c.stringWidth(display, "Helvetica-Bold", fsize) > max_w and len(display) > 8:
            display = display[:-4] + "..."
        c.setFillColor(BLACK)
        c.setFont("Helvetica-Bold", fsize)
        c.drawString(lx + 74, badge_cy - 10, display)


# ─────────────────────────────────────────────────────────────────────────────
# ILLUSTRATION 2 — Big stat callout  (reference: percentage / metric highlight)
# ─────────────────────────────────────────────────────────────────────────────

def draw_stat_card(c, stat, caption, cx, cy, avail_w):
    cw   = min(avail_w, 860)
    ch   = 300
    bx   = cx - cw // 2
    by_  = cy - ch // 2

    # Card with subtle border
    c.setFillColor(BADGEBG)
    c.setStrokeColor(Color(0, 0.627, 0.941, alpha=0.25))
    c.setLineWidth(2)
    c.roundRect(bx, by_, cw, ch, 28, fill=1, stroke=1)

    # Top accent bar
    c.setFillColor(BLUE)
    c.roundRect(bx + 44, by_ + ch - 16, 100, 10, 5, fill=1, stroke=0)

    # Stat number
    ns = 120 if len(stat) <= 4 else 96 if len(stat) <= 7 else 76
    c.setFont("Helvetica-Bold", ns)
    c.setFillColor(BLUE)
    c.drawCentredString(cx, cy + 18, stat)

    # Caption
    if caption:
        cap = caption[:65]
        c.setFont("Helvetica", 24)
        c.setFillColor(DARKGRAY)
        c.drawCentredString(cx, cy - ns // 2 - 30, cap)


# ─────────────────────────────────────────────────────────────────────────────
# ILLUSTRATION 3 — Quote card  (reference: pull quote style)
# ─────────────────────────────────────────────────────────────────────────────

def draw_quote_card(c, text, cx, cy, avail_w):
    cw    = min(avail_w, 900)
    inner = cw - 120
    fsize = 36 if len(text) < 60 else 30 if len(text) < 90 else 26
    lines = wrap_text(c, text, "Helvetica-Bold", fsize, inner)[:3]
    lh    = fsize + 16
    th    = len(lines) * lh
    ch    = th + 120
    bx    = cx - cw // 2
    by_   = cy - ch // 2

    # Background card
    c.setFillColor(Color(0.957, 0.957, 0.965, alpha=1))
    c.roundRect(bx, by_, cw, ch, 24, fill=1, stroke=0)

    # Blue left accent bar
    c.setFillColor(BLUE)
    c.roundRect(bx, by_, 8, ch, 4, fill=1, stroke=0)

    # Top accent dot
    c.setFillColor(BLUE)
    c.roundRect(bx + 44, by_ + ch - 14, 90, 8, 4, fill=1, stroke=0)

    # Quotation mark
    c.setFont("Helvetica-Bold", 80)
    c.setFillColor(Color(0, 0.627, 0.941, alpha=0.18))
    c.drawString(bx + 28, by_ + ch - 72, '“')

    # Text
    c.setFillColor(BLACK)
    ty = cy + th // 2 - fsize + 10
    for ln in lines:
        c.setFont("Helvetica-Bold", fsize)
        c.drawCentredString(cx, ty, ln)
        ty -= lh


# ─────────────────────────────────────────────────────────────────────────────
# ILLUSTRATION SELECTOR — content-driven
# ─────────────────────────────────────────────────────────────────────────────

def draw_content_visual(c, stype, title_raw, body, cx, cy, avail_w):
    """
    Selects the best illustration based on actual slide content:
      1. Stat found           → Stat card
      2. Body has 2+ sentences → Editorial numbered list
      3. Single sentence      → Quote card
      4. Fallback             → Quote card from title
    """
    # 1 — Stat
    stat = find_stat(body)
    if stat:
        rest = re.sub(r'(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:%|x|X|\\+)?|\\$\\d+[KMBkmb]?)', '', body).strip()
        draw_stat_card(c, stat, rest[:65], cx, cy, avail_w)
        return

    # 2 — Multiple sentences → numbered list
    sentences = split_sentences(body)
    if len(sentences) >= 2:
        draw_editorial_list(c, sentences, cx, cy, avail_w)
        return

    # 3 — Single strong sentence → quote
    text = sentences[0] if sentences else (body or title_raw or "").strip()
    if text:
        draw_quote_card(c, text[:130], cx, cy, avail_w)
        return

    # 4 — Fallback
    draw_quote_card(c, title_raw[:100], cx, cy, avail_w)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE RENDERER
# ─────────────────────────────────────────────────────────────────────────────

def draw_slide(c, slide, num, total, tags):
    stype     = slide.get("type", "")
    title_raw = strip_md(slide.get("title", ""))
    body      = strip_md(slide.get("body",  ""))

    is_cover = (num == 1)
    is_cta   = stype.strip().upper() in ("CTA", "CALL TO ACTION") or num == total

    # ── Background ────────────────────────────────────────────────────────────
    bg = BG_CTA if is_cta else BG
    c.setFillColor(bg); c.rect(0, 0, SLIDE_W, SLIDE_H, fill=1, stroke=0)

    if is_cover:   draw_bg_cover(c)
    elif is_cta:   draw_bg_cta(c)
    else:          draw_bg_content(c)

    # ── Logo ──────────────────────────────────────────────────────────────────
    if is_cover or is_cta:
        logo_bottom = draw_logo_centered(c, CX, SLIDE_H - 14)
    else:
        draw_logo_outline_tr(c, bg)
        logo_bottom = SLIDE_H - 130

    # ── CTA layout ────────────────────────────────────────────────────────────
    if is_cta:
        c.setFillColor(DARKGRAY)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(CX, 510, "HELLO@POINTONEZERO.COM")
        cta    = title_raw if title_raw else "Follow for More Such Insights"
        tsize  = 86 if len(cta) < 24 else 72 if len(cta) < 38 else 60
        tlines = wrap_text(c, cta, "Helvetica-Bold", tsize, SLIDE_W - 2*MARGIN)
        ty     = 468
        for ln in tlines[:3]:
            c.setFont("Helvetica-Bold", tsize)
            c.setFillColor(BLACK)
            c.drawCentredString(CX, ty, ln)
            ty -= tsize + 14
        c.showPage()
        return

    # ── Badge — slide type / number pill ──────────────────────────────────────
    if is_cover:
        badge_y  = logo_bottom - 56
        badge_lbl = stype.upper() if stype else f"SLIDE {num} / {total}"
    else:
        badge_y  = SLIDE_H - 120
        badge_lbl = stype.upper() if stype else f"SLIDE {num} / {total}"
    draw_badge(c, badge_lbl, CX, badge_y)

    # ── Title (mixed case, blue first line, black rest) ────────────────────────
    avail_w = SLIDE_W - 2*MARGIN
    tsize   = best_title_size(len(title_raw))
    tlines  = wrap_text(c, title_raw, "Helvetica-Bold", tsize, avail_w)

    if is_cover:
        ty = badge_y - 48
    else:
        ty = badge_y - 48

    for i, ln in enumerate(tlines[:3]):
        c.setFillColor(BLUE if i == 0 else BLACK)
        c.setFont("Helvetica-Bold", tsize)
        c.drawString(MARGIN, ty, ln)
        ty -= tsize + 16
    title_end = ty

    # ── Separator above footer ─────────────────────────────────────────────────
    c.setStrokeColor(SEPCOL)
    c.setLineWidth(1.2)
    c.line(MARGIN, FOOTER_SEP + 8, SLIDE_W - MARGIN, FOOTER_SEP + 8)

    # ── Content illustration — fully driven by slide's generated text ──────────
    illus_top = title_end - 20
    illus_bot = ILLUS_BOT
    if illus_top > illus_bot + 100:
        illus_cy = int((illus_top + illus_bot) / 2)
        c.saveState()
        path = c.beginPath()
        path.rect(MARGIN - 20, illus_bot, SLIDE_W - 2*(MARGIN-20), illus_top - illus_bot)
        c.clipPath(path, stroke=0)
        draw_content_visual(c, stype, title_raw, body, CX, illus_cy, avail_w)
        c.restoreState()

    # ── Body text (centered, 30pt) ─────────────────────────────────────────────
    if body:
        blines = wrap_text(c, body, "Helvetica", 30, SLIDE_W - 2*MARGIN)
        c.setFillColor(BODYGRAY)
        by = FOOTER_SEP - 18
        for ln in blines[:3]:
            c.setFont("Helvetica", 30)
            c.drawCentredString(CX, by, ln)
            by -= 40

    # ── Arrow ──────────────────────────────────────────────────────────────────
    draw_arrow(c)
    c.showPage()


# ── Generate ───────────────────────────────────────────────────────────────────
slides_data = ${slidesJson}
hashtags    = ${hashtagsJson}
topic       = ${topicJson}

out_path = "/home/user/carousel.pdf"
c = rlcanvas.Canvas(out_path, pagesize=(SLIDE_W, SLIDE_H))
for i, slide in enumerate(slides_data, 1):
    draw_slide(c, slide, i, len(slides_data), hashtags)
c.save()

with open(out_path, "rb") as f:
    print("B64:" + base64.b64encode(f.read()).decode("utf-8"))
`;
}
