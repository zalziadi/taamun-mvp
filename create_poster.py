#!/usr/bin/env python3
"""
Desert Cartography — Taamun Al-Kahf 109 Poster (Final)
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

f_verse_xl = ImageFont.truetype(AR, 96)
f_verse_lg = ImageFont.truetype(AR, 80)
f_verse_md = ImageFont.truetype(AR, 68)
f_hashtag_ar = ImageFont.truetype(AR, 58)
f_hashtag_sym = ImageFont.truetype(f"{FD}/Jura-Light.ttf", 50)
f_bism = ImageFont.truetype(AR, 30)
f_surah = ImageFont.truetype(AR, 28)
f_ref = ImageFont.truetype(f"{FD}/Italiana-Regular.ttf", 32)
f_tiny = ImageFont.truetype(f"{FD}/DMMono-Regular.ttf", 14)

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

cx, cy = W // 2, H // 2 - 100

# --- 1. GRAIN ---
random.seed(42)
for _ in range(18000):
    x, y = random.randint(0, W-1), random.randint(0, H-1)
    v = random.randint(-4, 4)
    draw.point((x, y), fill=tuple(max(0, min(255, bg[i] + v)) for i in range(3)))

# --- 2. RADIAL GLOW behind verse ---
# Pre-calculate row by row for performance
for y in range(max(0, cy - 700), min(H, cy + 700)):
    dy = y - cy
    for x in range(max(0, cx - 700), min(W, cx + 700), 2):
        dx = x - cx
        dist = math.sqrt(dx*dx + dy*dy)
        if dist < 650:
            t = (1 - dist / 650) ** 1.5 * 0.08
            c = blend(bg, sand, t)
            draw.point((x, y), fill=c)
            if x + 1 < W:
                draw.point((x + 1, y), fill=c)

# --- 3. CONCENTRIC RINGS ---
radii = [200, 300, 420, 560, 720, 900]
for ri, radius in enumerate(radii):
    intensity = 0.32 - ri * 0.04
    if intensity < 0.08: intensity = 0.08
    color = blend(bg, dark_stone, intensity)

    for thickness in [-1, 0, 1]:
        r = radius + thickness * 0.4
        dash = 18 + ri * 3
        gap = 10 + ri * 4
        circ = 2 * math.pi * r
        angle = 0
        while angle < 360:
            end_d = angle + (dash / circ) * 360
            for a10 in range(int(angle * 10), int(min(end_d, 360) * 10)):
                rad = math.radians(a10 / 10)
                px, py = int(cx + r * math.cos(rad)), int(cy + r * math.sin(rad))
                if 0 <= px < W and 0 <= py < H:
                    draw.point((px, py), fill=color)
            angle = end_d + (gap / circ) * 360

# Inner golden ring — solid, warm
for t in [-1.5, -0.5, 0.5, 1.5]:
    r = 200 + t
    for a10 in range(3600):
        rad = math.radians(a10 / 10)
        px, py = int(cx + r * math.cos(rad)), int(cy + r * math.sin(rad))
        if 0 <= px < W and 0 <= py < H:
            alpha = 0.22 + 0.08 * abs(math.sin(rad * 3))
            draw.point((px, py), fill=blend(bg, sand, alpha))

# --- 4. MERIDIANS ---
for y in range(90, H - 90, 3):
    draw.point((W//2, y), fill=blend(bg, dark_stone, 0.10))

gy = int(H * 0.382)
for x in range(140, W - 140, 4):
    draw.point((x, gy), fill=blend(bg, dark_stone, 0.07))

# --- 5. CARDINAL + MINOR TICKS ---
mc = blend(bg, sand, 0.28)
for angle_deg in [0, 90, 180, 270]:
    rad = math.radians(angle_deg)
    x1, y1 = int(cx + 198 * math.cos(rad)), int(cy + 198 * math.sin(rad))
    x2, y2 = int(cx + 240 * math.cos(rad)), int(cy + 240 * math.sin(rad))
    draw.line([(x1, y1), (x2, y2)], fill=mc, width=1)

for angle_deg in range(0, 360, 30):
    if angle_deg % 90 != 0:
        rad = math.radians(angle_deg)
        x1, y1 = int(cx + 198 * math.cos(rad)), int(cy + 198 * math.sin(rad))
        x2, y2 = int(cx + 218 * math.cos(rad)), int(cy + 218 * math.sin(rad))
        draw.line([(x1, y1), (x2, y2)], fill=blend(bg, dark_stone, 0.16), width=1)

# --- 6. DATA POINTS ---
random.seed(109)
for _ in range(150):
    x = random.randint(80, W-80)
    y = random.randint(80, H-80)
    dist = math.sqrt((x-cx)**2 + (y-cy)**2)
    if 260 < dist < 1050:
        s = random.choice([1, 2, 2])
        draw.ellipse([x-s, y-s, x+s, y+s], fill=blend(bg, sand, random.uniform(0.08, 0.15)))

# --- 7. CORNER BRACKETS ---
br, m = 50, 62
bc = blend(bg, stone, 0.28)
corners = [(m, m, 1, 1), (W-m, m, -1, 1), (m, H-m, 1, -1), (W-m, H-m, -1, -1)]
for (x, y, dx, dy) in corners:
    draw.line([(x, y), (x, y + dy*br)], fill=bc, width=1)
    draw.line([(x, y), (x + dx*br, y)], fill=bc, width=1)

lc = blend(bg, stone, 0.18)
draw.text((m+8, m+8), "18:109", font=f_tiny, fill=lc)
draw.text((W-m-48, m+8), "028.D", font=f_tiny, fill=lc)

# Side ticks — 28 marks for 28 days
tc = blend(bg, dark_stone, 0.14)
for i in range(28):
    y = 180 + i * 100
    if y < H - 180:
        l = 18 if i % 7 == 0 else 8
        draw.line([(m+2, y), (m+2+l, y)], fill=tc, width=1)
        draw.line([(W-m-2, y), (W-m-2-l, y)], fill=tc, width=1)

# --- 8. BISMILLAH ---
bism = ar("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
center_text(bism, f_bism, 185, blend(bg, sand, 0.30))

# Fine underline
for x in range(W//2 - 130, W//2 + 130):
    fade = 1 - abs(x - W//2) / 130
    draw.point((x, 232), fill=blend(bg, sand, fade * 0.14))

# --- 9. THE VERSE ---
verse_data = [
    ("قُل لَّوْ كَانَ الْبَحْرُ مِدَادًا", f_verse_xl, gold),
    ("لِّكَلِمَاتِ رَبِّي", f_verse_xl, gold),
    ("لَنَفِدَ الْبَحْرُ", f_verse_lg, gold_dim),
    ("قَبْلَ أَن تَنفَدَ كَلِمَاتُ رَبِّي", f_verse_md, gold_dim),
    ("وَلَوْ جِئْنَا بِمِثْلِهِ مَدَدًا", f_verse_lg, gold),
]

# Measure
sp = 50
rendered = []
total_h = 0
for txt, fnt, clr in verse_data:
    s = ar(txt)
    bb = draw.textbbox((0, 0), s, font=fnt)
    h = bb[3] - bb[1]
    rendered.append((s, fnt, clr, h))
    total_h += h + sp
total_h -= sp

y_cur = cy - total_h // 2 - 15
for shaped, fnt, clr, h in rendered:
    center_text(shaped, fnt, y_cur, clr)
    y_cur += h + sp

# --- 10. ORNAMENTAL DIVIDER ---
div_y = y_cur + 85

# Central diamond
ds = 6
draw.polygon([
    (W//2, div_y - ds), (W//2 + ds, div_y),
    (W//2, div_y + ds), (W//2 - ds, div_y),
], fill=blend(bg, gold, 0.50))

# Extending lines with gradient fade
lw = 220
for x in range(12, lw):
    fade = (1 - x / lw) ** 0.7
    c = blend(bg, sand, fade * 0.32)
    draw.point((W//2 + x, div_y), fill=c)
    draw.point((W//2 - x, div_y), fill=c)

# Flanking dots
for off in [28, 52, 76]:
    dd = 2
    dc = blend(bg, sand, 0.20 - off * 0.001)
    draw.ellipse([W//2+off-dd, div_y-dd, W//2+off+dd, div_y+dd], fill=dc)
    draw.ellipse([W//2-off-dd, div_y-dd, W//2-off+dd, div_y+dd], fill=dc)

# --- 11. SURAH REF ---
ref = "Surah Al-Kahf  ·  109"
bb = draw.textbbox((0, 0), ref, font=f_ref)
draw.text(((W - bb[2] + bb[0]) // 2, div_y + 48), ref, font=f_ref, fill=text_dim)

surah = ar("سورة الكهف")
center_text(surah, f_surah, div_y + 92, blend(bg, stone, 0.30))

# --- 12. HASHTAG — render # and تمعّن separately for clean display ---
tag_y = H - 330

tag_ar = ar("تمعّن")
tag_bb = draw.textbbox((0, 0), tag_ar, font=f_hashtag_ar)
tag_w = tag_bb[2] - tag_bb[0]
tag_h = tag_bb[3] - tag_bb[1]

hash_bb = draw.textbbox((0, 0), "#", font=f_hashtag_sym)
hash_w = hash_bb[2] - hash_bb[0]

total_tag_w = tag_w + 8 + hash_w
tag_start_x = (W - total_tag_w) // 2

# Arabic text first (right side in visual)
draw.text((tag_start_x, tag_y), tag_ar, font=f_hashtag_ar, fill=sand)
# # symbol after (left side in visual)
draw.text((tag_start_x + tag_w + 8, tag_y + 6), "#", font=f_hashtag_sym, fill=blend(bg, sand, 0.55))

# --- 13. BOTTOM DOTS ---
dot_y = H - 240
for i in range(11):
    dx = (i - 5) * 24
    s = 3 if i == 5 else (2 if abs(i-5) <= 2 else 1)
    t = 0.42 if i == 5 else (0.22 if abs(i-5) <= 2 else 0.09)
    draw.ellipse([W//2+dx-s, dot_y-s, W//2+dx+s, dot_y+s], fill=blend(bg, gold, t))

# --- SAVE ---
out = "/Users/ziyadalziyadi/Projects/taamun-mvp/taamun-alkahf-poster.png"
img.save(out, "PNG", quality=100)
print(f"Done: {out}")
