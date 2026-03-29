#!/usr/bin/env python3
"""
Sacred Cartography — Taamun Eidiya Ad (Refined)
Premium 1080x1350 PNG poster for Instagram.
"""

import math
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

# ─── Canvas ───────────────────────────────────────────────────────
W, H = 1080, 1350
BG = (21, 19, 15)
GOLD = (201, 184, 138)
GOLD_MID = (160, 147, 110)
GOLD_DIM = (110, 100, 75)
GOLD_FAINT = (60, 55, 40)
GOLD_WHISPER = (40, 37, 28)
CREAM = (232, 225, 217)
CREAM_DIM = (180, 174, 168)

FONTS_DIR = "/Users/ziyadalziyadi/.claude/skills/canvas-design/canvas-fonts"
ARABIC_FONT = "/System/Library/Fonts/GeezaPro.ttc"

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)


def ar(text):
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def draw_centered(text, y, font, fill=GOLD):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, y), text, font=font, fill=fill)
    return tw


def blend(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


# ─── Load Fonts ───────────────────────────────────────────────────
font_ar_hero = ImageFont.truetype(ARABIC_FONT, 78)
font_ar_sub = ImageFont.truetype(ARABIC_FONT, 32)
font_ar_body = ImageFont.truetype(ARABIC_FONT, 26)
font_ar_small = ImageFont.truetype(ARABIC_FONT, 21)
font_ar_tiny = ImageFont.truetype(ARABIC_FONT, 15)

font_lat_micro = ImageFont.truetype(f"{FONTS_DIR}/DMMono-Regular.ttf", 9)
font_lat_label = ImageFont.truetype(f"{FONTS_DIR}/DMMono-Regular.ttf", 10)
font_lat_note = ImageFont.truetype(f"{FONTS_DIR}/Jura-Light.ttf", 12)
font_lat_med = ImageFont.truetype(f"{FONTS_DIR}/Jura-Medium.ttf", 16)
font_price_num = ImageFont.truetype(f"{FONTS_DIR}/Jura-Light.ttf", 72)
font_price_label = ImageFont.truetype(f"{FONTS_DIR}/Jura-Light.ttf", 22)


# ═══════════════════════════════════════════════════════════════════
# LAYER 0 — Subtle Background Texture (Dot Grid)
# ═══════════════════════════════════════════════════════════════════

# Fine dot grid — like graph paper on dark vellum
for gx in range(0, W, 30):
    for gy in range(0, H, 30):
        draw.point((gx, gy), fill=GOLD_WHISPER)


# ═══════════════════════════════════════════════════════════════════
# LAYER 1 — Cartographic Frame
# ═══════════════════════════════════════════════════════════════════

M = 48  # margin

# Outer frame — thin precise rectangle
draw.rectangle([M, M, W - M, H - M], outline=GOLD_FAINT, width=1)

# Inner frame — breathing room
draw.rectangle([M + 12, M + 12, W - M - 12, H - M - 12], outline=GOLD_WHISPER, width=1)

# Corner registration marks (extended)
for cx_m, cy_m in [(M, M), (W - M, M), (M, H - M), (W - M, H - M)]:
    dx = 24 if cx_m < W // 2 else -24
    dy = 24 if cy_m < H // 2 else -24
    draw.line([cx_m - dx * 0.5, cy_m, cx_m + dx, cy_m], fill=GOLD_DIM, width=1)
    draw.line([cx_m, cy_m - dy * 0.5, cx_m, cy_m + dy], fill=GOLD_DIM, width=1)
    # Tiny circle at corner
    draw.ellipse([cx_m - 2, cy_m - 2, cx_m + 2, cy_m + 2], outline=GOLD_DIM, width=1)


# ═══════════════════════════════════════════════════════════════════
# LAYER 2 — Top Field Notes
# ═══════════════════════════════════════════════════════════════════

# Top-left: catalog reference
draw.text((M + 24, M + 22), "CAT. NO. 1447/28", font=font_lat_label, fill=GOLD_DIM)

# Top-right: classification
draw.text((W - M - 190, M + 22), "CONTEMPLATION MAP", font=font_lat_label, fill=GOLD_DIM)

# Thin separator
draw.line([M + 24, M + 44, W - M - 24, M + 44], fill=GOLD_WHISPER, width=1)


# ═══════════════════════════════════════════════════════════════════
# LAYER 3 — Hero Arabic Title
# ═══════════════════════════════════════════════════════════════════

title = ar("عيدية تمعّن")
draw_centered(title, 80, font_ar_hero, GOLD)

# Ornamental dots flanking the title
title_bbox = draw.textbbox((0, 0), title, font=font_ar_hero)
title_w = title_bbox[2] - title_bbox[0]
title_center_y = 80 + (title_bbox[3] - title_bbox[1]) // 2
for offset in [-title_w // 2 - 30, title_w // 2 + 30]:
    dx = W // 2 + offset
    draw.ellipse([dx - 2, title_center_y - 2, dx + 2, title_center_y + 2], fill=GOLD_DIM)

# Subtitle
sub = ar("٢٨ يومًا تُنير مدينتك الداخلية")
draw_centered(sub, 175, font_ar_sub, CREAM_DIM)

# Fine rule under subtitle
draw.line([W // 2 - 100, 218, W // 2 + 100, 218], fill=GOLD_FAINT, width=1)

# Source note
src = ar("من كتاب مدينة المعنى بلغة القرآن")
draw_centered(src, 228, font_ar_tiny, GOLD_DIM)


# ═══════════════════════════════════════════════════════════════════
# LAYER 4 — Sacred Geometry (Central System)
# ═══════════════════════════════════════════════════════════════════

cx, cy = W // 2, 470

# Outermost guide circle
outer_r = 300
draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
             outline=GOLD_WHISPER, width=1)

# Main orbital rings
for r in [50, 100, 150, 200, 250]:
    fade = max(0.15, 1.0 - r / 350)
    c = blend(BG, GOLD_FAINT, fade)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=1)

# Radial axes — 24 divisions (like hours)
for i in range(24):
    angle = 2 * math.pi * i / 24
    inner = 35
    outer = 280
    x1 = cx + inner * math.cos(angle)
    y1 = cy + inner * math.sin(angle)
    x2 = cx + outer * math.cos(angle)
    y2 = cy + outer * math.sin(angle)
    # Every 6th line slightly brighter
    c = GOLD_FAINT if i % 6 == 0 else GOLD_WHISPER
    draw.line([x1, y1, x2, y2], fill=c, width=1)

# 28 station markers on the 200px orbit
orbit_r = 200
milestones = {1, 3, 7, 14, 21, 28}
for i in range(28):
    angle = (2 * math.pi * i / 28) - math.pi / 2
    x = cx + orbit_r * math.cos(angle)
    y = cy + orbit_r * math.sin(angle)
    if (i + 1) in milestones:
        # Milestone: filled gold circle with outer ring
        draw.ellipse([x - 7, y - 7, x + 7, y + 7], outline=GOLD, width=1)
        draw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=GOLD)
        # Day number label
        lbl = str(i + 1)
        lbl_r = orbit_r + 20
        lx = cx + lbl_r * math.cos(angle)
        ly = cy + lbl_r * math.sin(angle)
        draw.text((lx - 5, ly - 5), lbl, font=font_lat_micro, fill=GOLD_DIM)
    else:
        draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=GOLD_DIM)

# Inner sacred geometry — rotated nested squares
for s, rot in [(100, 0), (100, math.pi / 4), (70, 0), (70, math.pi / 4)]:
    half = s / 2
    pts = []
    for corner in range(4):
        a = rot + corner * math.pi / 2 + math.pi / 4
        pts.append((cx + half * math.cos(a), cy + half * math.sin(a)))
    pts.append(pts[0])
    c = GOLD_FAINT if s == 100 else GOLD_WHISPER
    draw.line(pts, fill=c, width=1)

# Center point — precise crosshair
draw.line([cx - 12, cy, cx - 4, cy], fill=GOLD_MID, width=1)
draw.line([cx + 4, cy, cx + 12, cy], fill=GOLD_MID, width=1)
draw.line([cx, cy - 12, cx, cy - 4], fill=GOLD_MID, width=1)
draw.line([cx, cy + 4, cx, cy + 12], fill=GOLD_MID, width=1)
draw.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=GOLD)

# Arc decorations — partial arcs at cardinal directions
for angle_start in [0, 90, 180, 270]:
    r = 270
    a1 = math.radians(angle_start - 8)
    a2 = math.radians(angle_start + 8)
    pts = []
    for step in range(17):
        a = a1 + (a2 - a1) * step / 16
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    if len(pts) > 1:
        draw.line(pts, fill=GOLD_DIM, width=1)


# ═══════════════════════════════════════════════════════════════════
# LAYER 5 — Left Edge Scale (28-day ruler)
# ═══════════════════════════════════════════════════════════════════

ruler_x = M + 20
ruler_top = 290
ruler_bottom = 650
for i in range(28):
    y = ruler_top + i * (ruler_bottom - ruler_top) / 27
    is_milestone = (i + 1) in milestones
    tick_w = 14 if is_milestone else 5
    c = GOLD_DIM if is_milestone else GOLD_WHISPER
    draw.line([ruler_x, y, ruler_x + tick_w, y], fill=c, width=1)
    if is_milestone:
        draw.text((ruler_x + 18, y - 5), f"D{i+1:02d}", font=font_lat_micro, fill=GOLD_DIM)

# Vertical spine
draw.line([ruler_x, ruler_top, ruler_x, ruler_bottom], fill=GOLD_WHISPER, width=1)


# ═══════════════════════════════════════════════════════════════════
# LAYER 6 — Price Block
# ═══════════════════════════════════════════════════════════════════

price_y = 730

# Ornamental separator — three dots
for dx in [-12, 0, 12]:
    draw.ellipse([W // 2 + dx - 1, price_y - 1, W // 2 + dx + 1, price_y + 1], fill=GOLD_DIM)

# Price number
draw_centered("82", price_y + 14, font_price_num, GOLD)

# Currency
sar = ar("ريال")
draw_centered(sar, price_y + 92, font_ar_body, GOLD_MID)

# Discount context
discount = ar("بدلاً من ٢٨٠ — خصم ٧١٪")
draw_centered(discount, price_y + 125, font_ar_tiny, GOLD_DIM)

# Fine lines framing the price
draw.line([W // 2 - 60, price_y + 155, W // 2 + 60, price_y + 155], fill=GOLD_WHISPER, width=1)


# ═══════════════════════════════════════════════════════════════════
# LAYER 7 — Features (Right-aligned, compact)
# ═══════════════════════════════════════════════════════════════════

feat_y = 920
right_margin = W - M - 24
features = [
    "بوابة الصمت — ٦٠ ثانية تأمّل",
    "آية + سؤال عميق + طبقة مخفية",
    "مفكّرة تأمّل تُحفظ تلقائيًا",
    "ميزان الوعي اليومي",
    "أوسمة المحطات المحورية",
    "صالح لمدة ٣ أشهر",
]

for i, feat in enumerate(features):
    y = feat_y + i * 34
    # Diamond bullet
    bx = right_margin
    draw.polygon([(bx, y + 8), (bx + 3, y + 11), (bx, y + 14), (bx - 3, y + 11)], fill=GOLD_MID)
    # Text
    ft = ar(feat)
    bbox = draw.textbbox((0, 0), ft, font=font_ar_small)
    tw = bbox[2] - bbox[0]
    draw.text((bx - 14 - tw, y), ft, font=font_ar_small, fill=CREAM_DIM)


# ═══════════════════════════════════════════════════════════════════
# LAYER 8 — Gift Line & Footer
# ═══════════════════════════════════════════════════════════════════

# Gift CTA
gift = ar("أهدِها لمن تحب · أو ابدأ رحلتك")
draw_centered(gift, H - 120, font_ar_body, GOLD)

# Bottom rule
draw.line([M + 24, H - M - 40, W - M - 24, H - M - 40], fill=GOLD_WHISPER, width=1)

# Footer left
draw.text((M + 24, H - M - 28), "TAAMUN · 1447H · EIDIYA EDITION", font=font_lat_label, fill=GOLD_DIM)

# Footer right
draw.text((W - M - 180, H - M - 28), "taamun-mvp.vercel.app", font=font_lat_label, fill=GOLD_DIM)


# ═══════════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════════

output = "/Users/ziyadalziyadi/Projects/taamun-mvp/public/eid-ads/eidiya-sacred-cartography.png"
img.save(output, "PNG", quality=100)
print(f"✓ Saved: {output}")
print(f"  Canvas: {W}×{H}")
