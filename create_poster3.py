#!/usr/bin/env python3
"""
Poster 3 — Al-Kahf verse 10 (The Youth & The Cave)
إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ
+ www.taamun.com + #تمعّن
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
text_dim = (138, 126, 114)

def blend(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * max(0, min(1, t))) for i in range(3))

img = Image.new('RGB', (W, H), bg)
draw = ImageDraw.Draw(img)

FD = "/Users/ziyadalziyadi/.claude/skills/canvas-design/canvas-fonts"
AR = "/System/Library/Fonts/GeezaPro.ttc"

f_hero = ImageFont.truetype(AR, 105)
f_lg = ImageFont.truetype(AR, 85)
f_md = ImageFont.truetype(AR, 70)
f_sm = ImageFont.truetype(AR, 58)
f_hashtag = ImageFont.truetype(AR, 54)
f_bism = ImageFont.truetype(AR, 26)
f_surah = ImageFont.truetype(AR, 24)
f_url = ImageFont.truetype(f"{FD}/Jura-Light.ttf", 36)
f_ref = ImageFont.truetype(f"{FD}/Italiana-Regular.ttf", 28)
f_hash_sym = ImageFont.truetype(f"{FD}/Jura-Light.ttf", 44)
f_tiny = ImageFont.truetype(f"{FD}/DMMono-Regular.ttf", 13)

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
# DESIGN 3: ARCH / CAVE MOTIF
# =============================================

# --- 1. GRAIN ---
random.seed(18)
for _ in range(18000):
    x, y = random.randint(0, W-1), random.randint(0, H-1)
    v = random.randint(-5, 5)
    draw.point((x, y), fill=tuple(max(0, bg[i] + v) for i in range(3)))

# --- 2. CAVE ARCH — a large parabolic arch shape ---
arch_cx = W // 2
arch_top = 380
arch_bottom = 2300
arch_width = 700  # half-width at base

# Draw the arch outline — pointed/gothic arch shape
def arch_x_at_y(y_pos):
    """Returns half-width of arch at given y position"""
    if y_pos <= arch_top:
        return 0
    t = (y_pos - arch_top) / (arch_bottom - arch_top)
    # Pointed arch: starts narrow, widens
    return arch_width * math.sin(t * math.pi * 0.5) ** 0.7

# Fill inside arch with subtle warm glow
for y in range(arch_top, arch_bottom):
    hw = arch_x_at_y(y)
    if hw > 5:
        for x in range(int(arch_cx - hw), int(arch_cx + hw), 2):
            dx = abs(x - arch_cx)
            # Distance from edge
            edge_dist = hw - dx
            # Vertical position factor
            vert_t = (y - arch_top) / (arch_bottom - arch_top)
            # Glow strongest in upper-center
            glow = (1 - vert_t * 0.6) * min(1, edge_dist / 100) * 0.05
            if glow > 0.005:
                c = blend(bg, sand, glow)
                draw.point((x, y), fill=c)
                if x + 1 < arch_cx + hw:
                    draw.point((x+1, y), fill=c)

# Draw arch border lines
arch_border = blend(bg, sand, 0.22)
for y in range(arch_top, arch_bottom, 1):
    hw = arch_x_at_y(y)
    if hw > 3:
        # Left edge
        lx = int(arch_cx - hw)
        draw.point((lx, y), fill=arch_border)
        draw.point((lx+1, y), fill=arch_border)
        # Right edge
        rx = int(arch_cx + hw)
        draw.point((rx, y), fill=arch_border)
        draw.point((rx-1, y), fill=arch_border)

# Arch peak — draw the pointed top more carefully
for a in range(0, 180):
    rad = math.radians(a)
    r = 8
    px = int(arch_cx + r * math.cos(rad))
    py = int(arch_top - 5 + r * math.sin(rad))
    draw.point((px, py), fill=arch_border)

# Base line
for x in range(int(arch_cx - arch_width - 10), int(arch_cx + arch_width + 10)):
    draw.point((x, arch_bottom), fill=blend(bg, sand, 0.15))

# --- 3. DECORATIVE PATTERNS inside arch — Islamic geometric hints ---
# Small repeated diamond pattern along the arch border (inner side)
for y in range(arch_top + 80, arch_bottom - 80, 60):
    hw = arch_x_at_y(y)
    if hw > 40:
        for side in [-1, 1]:
            dx = int(hw - 25)
            px = arch_cx + side * dx
            ds = 3
            dc = blend(bg, sand, 0.12)
            draw.polygon([
                (px, y - ds), (px + ds, y),
                (px, y + ds), (px - ds, y)
            ], outline=dc)

# --- 4. BISMILLAH ---
bism = ar("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
center_text(bism, f_bism, 160, blend(bg, sand, 0.28))

# --- 5. THE VERSE — Al-Kahf 10 ---
verse_lines = [
    ("إِذْ أَوَى الْفِتْيَةُ", f_hero, gold),
    ("إِلَى الْكَهْفِ", f_hero, gold),
    ("فَقَالُوا رَبَّنَا آتِنَا", f_lg, gold_dim),
    ("مِن لَّدُنكَ رَحْمَةً", f_lg, gold),
    ("وَهَيِّئْ لَنَا", f_md, gold_dim),
    ("مِنْ أَمْرِنَا رَشَدًا", f_lg, gold),
]

sp = 45
rendered = []
total_h = 0
for txt, fnt, clr in verse_lines:
    s = ar(txt)
    bb = draw.textbbox((0, 0), s, font=fnt)
    h = bb[3] - bb[1]
    rendered.append((s, fnt, clr, h))
    total_h += h + sp
total_h -= sp

verse_center_y = (arch_top + arch_bottom) // 2
y_cur = verse_center_y - total_h // 2

for shaped, fnt, clr, h in rendered:
    center_text(shaped, fnt, y_cur, clr)
    y_cur += h + sp

# --- 6. DIVIDER ---
div_y = y_cur + 65
ds = 5
draw.polygon([
    (W//2, div_y-ds), (W//2+ds, div_y),
    (W//2, div_y+ds), (W//2-ds, div_y),
], fill=blend(bg, gold, 0.42))

for x in range(12, 180):
    fade = (1 - x/180) ** 0.6
    c = blend(bg, sand, fade * 0.28)
    draw.point((W//2+x, div_y), fill=c)
    draw.point((W//2-x, div_y), fill=c)

# --- 7. REFERENCE ---
ref = "Surah Al-Kahf · 10"
bb = draw.textbbox((0, 0), ref, font=f_ref)
draw.text(((W - bb[2] + bb[0]) // 2, div_y + 35), ref, font=f_ref, fill=text_dim)

surah = ar("سورة الكهف ١٠")
center_text(surah, f_surah, div_y + 72, blend(bg, stone, 0.28))

# --- 8. BOTTOM — URL + Hashtag ---
# Separator
sep_y = arch_bottom + 100
for x in range(W//2 - 300, W//2 + 300):
    fade = (1 - abs(x - W//2) / 300) ** 0.5
    draw.point((x, sep_y), fill=blend(bg, sand, fade * 0.16))

# URL
url_y = sep_y + 55
url = "www.taamun.com"
bb = draw.textbbox((0, 0), url, font=f_url)
draw.text(((W - bb[2] + bb[0]) // 2, url_y), url, font=f_url, fill=sand)

# Hashtag
tag_y = url_y + 75
tag_ar = ar("تمعّن")
tag_bb = draw.textbbox((0, 0), tag_ar, font=f_hashtag)
tag_w = tag_bb[2] - tag_bb[0]
hash_bb = draw.textbbox((0, 0), "#", font=f_hash_sym)
hash_w = hash_bb[2] - hash_bb[0]
total_tw = tag_w + 10 + hash_w
tx = (W - total_tw) // 2
draw.text((tx, tag_y), tag_ar, font=f_hashtag, fill=gold_dim)
draw.text((tx + tag_w + 10, tag_y + 4), "#", font=f_hash_sym, fill=blend(bg, sand, 0.48))

# --- 9. BOTTOM DOTS ---
dot_y = tag_y + 95
for i in range(9):
    dx = (i - 4) * 22
    s = 3 if i == 4 else (2 if abs(i-4) <= 2 else 1)
    t = 0.38 if i == 4 else (0.18 if abs(i-4) <= 2 else 0.07)
    draw.ellipse([W//2+dx-s, dot_y-s, W//2+dx+s, dot_y+s], fill=blend(bg, gold, t))

# --- 10. CORNERS ---
br, m = 45, 55
bc = blend(bg, stone, 0.22)
for (x, y, dx, dy) in [(m, m, 1, 1), (W-m, m, -1, 1), (m, H-m, 1, -1), (W-m, H-m, -1, -1)]:
    draw.line([(x, y), (x, y+dy*br)], fill=bc, width=1)
    draw.line([(x, y), (x+dx*br, y)], fill=bc, width=1)

lc = blend(bg, stone, 0.16)
draw.text((m+8, m+8), "18:10", font=f_tiny, fill=lc)

# === SAVE ===
out = "/Users/ziyadalziyadi/Projects/taamun-mvp/taamun-alkahf-poster-3.png"
img.save(out, "PNG", quality=100)
print(f"Done: {out}")
