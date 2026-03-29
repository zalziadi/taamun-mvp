#!/usr/bin/env python3
"""
Poster 2 — Bold geometric slab design. Completely different aesthetic.
Al-Kahf 109 + taamun.com + #تمعّن
"""

from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import math, random

W, H = 2400, 3200
bg = (21, 19, 15)
gold = (240, 225, 192)
gold_dim = (211, 197, 165)
sand = (196, 168, 130)
stone = (150, 144, 131)
dark_stone = (75, 70, 60)
surface = (34, 31, 26)
text_dim = (138, 126, 114)
warm_dark = (30, 27, 22)

def blend(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * max(0, min(1, t))) for i in range(3))

img = Image.new('RGB', (W, H), bg)
draw = ImageDraw.Draw(img)

FD = "/Users/ziyadalziyadi/.claude/skills/canvas-design/canvas-fonts"
AR = "/System/Library/Fonts/GeezaPro.ttc"

f_verse_hero = ImageFont.truetype(AR, 110)
f_verse_lg = ImageFont.truetype(AR, 88)
f_verse_md = ImageFont.truetype(AR, 72)
f_hashtag_ar = ImageFont.truetype(AR, 54)
f_bism = ImageFont.truetype(AR, 26)
f_surah = ImageFont.truetype(AR, 24)
f_url = ImageFont.truetype(f"{FD}/Jura-Light.ttf", 38)
f_dot = ImageFont.truetype(f"{FD}/Jura-Medium.ttf", 38)
f_ref = ImageFont.truetype(f"{FD}/Italiana-Regular.ttf", 28)
f_tiny = ImageFont.truetype(f"{FD}/DMMono-Regular.ttf", 13)
f_hash_sym = ImageFont.truetype(f"{FD}/Jura-Light.ttf", 46)

reshaper = arabic_reshaper.ArabicReshaper(configuration={
    'delete_harakat': False,
    'delete_tatweel': False,
    'support_ligatures': True,
})

def ar(text):
    return get_display(reshaper.reshape(text))

def center_text(text, font, y, color):
    bb = draw.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    draw.text(((W - tw) // 2, y), text, font=font, fill=color)
    return th

# =============================================
# DESIGN 2: VERTICAL SLAB / MONOLITH LAYOUT
# =============================================

# --- 1. GRAIN ---
random.seed(71)
for _ in range(20000):
    x, y = random.randint(0, W-1), random.randint(0, H-1)
    v = random.randint(-4, 4)
    draw.point((x, y), fill=tuple(max(0, bg[i] + v) for i in range(3)))

# --- 2. VERTICAL GOLDEN STRIP — a monolith slab behind the verse ---
strip_left = 280
strip_right = W - 280
strip_top = 520
strip_bottom = 2200

# Fill with warm dark tone
for y in range(strip_top, strip_bottom):
    # Slight vertical gradient — darker at edges
    for x in range(strip_left, strip_right):
        dx = min(x - strip_left, strip_right - x)
        edge_fade = min(1.0, dx / 60)
        # Vertical fade at top and bottom
        dy_top = y - strip_top
        dy_bot = strip_bottom - y
        vert_fade = min(1.0, min(dy_top, dy_bot) / 80)
        t = 0.035 * edge_fade * vert_fade
        if t > 0.005:
            c = blend(bg, sand, t)
            draw.point((x, y), fill=c)

# Strip border — thin golden lines at left and right edges
border_c = blend(bg, sand, 0.18)
for y in range(strip_top + 30, strip_bottom - 30):
    if y % 3 < 2:  # dashed
        draw.point((strip_left, y), fill=border_c)
        draw.point((strip_right, y), fill=border_c)

# Top and bottom borders
for x in range(strip_left + 30, strip_right - 30):
    if x % 4 < 3:
        draw.point((x, strip_top), fill=border_c)
        draw.point((x, strip_bottom), fill=border_c)

# Corner dots at strip corners
cd = 4
cc = blend(bg, gold, 0.35)
for (sx, sy) in [(strip_left, strip_top), (strip_right, strip_top),
                  (strip_left, strip_bottom), (strip_right, strip_bottom)]:
    draw.ellipse([sx-cd, sy-cd, sx+cd, sy+cd], fill=cc)

# --- 3. HORIZONTAL RULED LINES inside strip — like parchment ---
for i in range(18):
    ly = strip_top + 90 + i * 100
    if ly < strip_bottom - 90:
        for x in range(strip_left + 60, strip_right - 60):
            if x % 5 < 3:
                draw.point((x, ly), fill=blend(bg, dark_stone, 0.06))

# --- 4. TOP SECTION — Bismillah in a quiet band ---
bism = ar("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
center_text(bism, f_bism, 200, blend(bg, sand, 0.30))

# Thin decorative line
for x in range(W//2 - 100, W//2 + 100):
    fade = 1 - abs(x - W//2) / 100
    draw.point((x, 244), fill=blend(bg, sand, fade * 0.15))

# --- 5. LARGE GEOMETRIC MARK — an octagonal star at top of strip ---
star_cx, star_cy = W // 2, strip_top + 160
star_r_outer = 55
star_r_inner = 28
star_points = 8
star_color = blend(bg, gold, 0.22)

pts = []
for i in range(star_points * 2):
    angle = math.radians(i * 360 / (star_points * 2) - 90)
    r = star_r_outer if i % 2 == 0 else star_r_inner
    pts.append((star_cx + r * math.cos(angle), star_cy + r * math.sin(angle)))
draw.polygon(pts, outline=star_color)

# Inner circle
for a10 in range(3600):
    rad = math.radians(a10 / 10)
    px = int(star_cx + 18 * math.cos(rad))
    py = int(star_cy + 18 * math.sin(rad))
    draw.point((px, py), fill=star_color)

# --- 6. THE VERSE — stacked monumentally ---
verse_lines = [
    ("قُل لَّوْ كَانَ الْبَحْرُ", f_verse_hero, gold),
    ("مِدَادًا لِّكَلِمَاتِ رَبِّي", f_verse_lg, gold),
    ("لَنَفِدَ الْبَحْرُ قَبْلَ", f_verse_md, gold_dim),
    ("أَن تَنفَدَ كَلِمَاتُ رَبِّي", f_verse_md, gold_dim),
    ("وَلَوْ جِئْنَا", f_verse_lg, gold),
    ("بِمِثْلِهِ مَدَدًا", f_verse_hero, gold),
]

sp = 42
rendered = []
total_h = 0
for txt, fnt, clr in verse_lines:
    s = ar(txt)
    bb = draw.textbbox((0, 0), s, font=fnt)
    h = bb[3] - bb[1]
    rendered.append((s, fnt, clr, h))
    total_h += h + sp
total_h -= sp

verse_block_center = (strip_top + strip_bottom) // 2
y_cur = verse_block_center - total_h // 2

for shaped, fnt, clr, h in rendered:
    center_text(shaped, fnt, y_cur, clr)
    y_cur += h + sp

# --- 7. VERSE REFERENCE — below verse block ---
ref_y = y_cur + 50

# Diamond
ds = 5
draw.polygon([
    (W//2, ref_y - ds), (W//2 + ds, ref_y),
    (W//2, ref_y + ds), (W//2 - ds, ref_y),
], fill=blend(bg, gold, 0.40))

# Lines
for x in range(15, 160):
    fade = (1 - x / 160) ** 0.6
    c = blend(bg, sand, fade * 0.25)
    draw.point((W//2 + x, ref_y), fill=c)
    draw.point((W//2 - x, ref_y), fill=c)

# Surah reference
ref = "Surah Al-Kahf · 109"
bb = draw.textbbox((0, 0), ref, font=f_ref)
draw.text(((W - bb[2] + bb[0]) // 2, ref_y + 30), ref, font=f_ref, fill=text_dim)

surah = ar("سورة الكهف ١٠٩")
center_text(surah, f_surah, ref_y + 68, blend(bg, stone, 0.30))

# --- 8. BOTTOM ZONE — URL + Hashtag ---
# Horizontal separator line
sep_y = strip_bottom + 80
for x in range(W//2 - 350, W//2 + 350):
    dist = abs(x - W//2)
    fade = (1 - dist / 350) ** 0.5
    draw.point((x, sep_y), fill=blend(bg, sand, fade * 0.18))

# URL: www.taamun.com
url_y = sep_y + 60
url_text = "www.taamun.com"
bb = draw.textbbox((0, 0), url_text, font=f_url)
url_w = bb[2] - bb[0]
draw.text(((W - url_w) // 2, url_y), url_text, font=f_url, fill=sand)

# Hashtag: #تمعّن
tag_y = url_y + 80
tag_ar = ar("تمعّن")
tag_bb = draw.textbbox((0, 0), tag_ar, font=f_hashtag_ar)
tag_w = tag_bb[2] - tag_bb[0]
hash_bb = draw.textbbox((0, 0), "#", font=f_hash_sym)
hash_w = hash_bb[2] - hash_bb[0]
total_tw = tag_w + 10 + hash_w
tx = (W - total_tw) // 2
draw.text((tx, tag_y), tag_ar, font=f_hashtag_ar, fill=gold_dim)
draw.text((tx + tag_w + 10, tag_y + 4), "#", font=f_hash_sym, fill=blend(bg, sand, 0.50))

# --- 9. BOTTOM DOTS ---
dot_y = tag_y + 100
for i in range(9):
    dx = (i - 4) * 22
    s = 3 if i == 4 else (2 if abs(i-4) <= 2 else 1)
    t = 0.38 if i == 4 else (0.18 if abs(i-4) <= 2 else 0.07)
    draw.ellipse([W//2+dx-s, dot_y-s, W//2+dx+s, dot_y+s], fill=blend(bg, gold, t))

# --- 10. OUTER FRAME CORNERS ---
br, m = 45, 55
bc = blend(bg, stone, 0.22)
for (x, y, dx, dy) in [(m, m, 1, 1), (W-m, m, -1, 1), (m, H-m, 1, -1), (W-m, H-m, -1, -1)]:
    draw.line([(x, y), (x, y + dy*br)], fill=bc, width=1)
    draw.line([(x, y), (x + dx*br, y)], fill=bc, width=1)

# --- 11. SIDE ACCENT — repeating dots along outer edges ---
random.seed(28)
for side_x in [120, W - 120]:
    for i in range(40):
        sy = 300 + i * 65
        if sy < H - 300:
            s = 1 if i % 4 != 0 else 2
            draw.ellipse([side_x-s, sy-s, side_x+s, sy+s],
                        fill=blend(bg, dark_stone, 0.10 + (0.06 if i % 4 == 0 else 0)))

# === SAVE ===
out = "/Users/ziyadalziyadi/Projects/taamun-mvp/taamun-alkahf-poster-2.png"
img.save(out, "PNG", quality=100)
print(f"Done: {out}")
