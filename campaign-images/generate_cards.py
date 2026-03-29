#!/usr/bin/env python3
"""
عيدية تمعّن — حملة ذئب الشمال
Generate all Instagram carousel slides and stories
Desert Nocturne visual philosophy — v2 (Geeza Pro fix)
"""

from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
import os
import random

# ─── Config ───────────────────────────────────────────────────
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
BG = '#15130F'
BG_RGB = (21, 19, 15)
GOLD = '#C9B88A'
GOLD_LIGHT = '#E6D4A4'
CREAM = '#E8E1D9'
CREAM_DIM = '#9E9688'
GOLD_DARK = '#8A7D5E'

# Fonts — Geeza Pro for Arabic (best rendering), Instrument for Latin
ARABIC_FONT = '/System/Library/Fonts/GeezaPro.ttc'
FONTS_DIR = '/Users/ziyadalziyadi/.claude/skills/canvas-design/canvas-fonts'
LATIN_FONT = os.path.join(FONTS_DIR, 'InstrumentSans-Regular.ttf')
LATIN_BOLD = os.path.join(FONTS_DIR, 'InstrumentSans-Bold.ttf')

SQ = 1080
ST_W, ST_H = 1080, 1920


# ─── Helpers ──────────────────────────────────────────────────

def ar(text):
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def draw_stars(draw, w, h, seed=28):
    rng = random.Random(seed)
    count = int(w * h * 0.0006)
    for _ in range(count):
        x = rng.randint(20, w - 20)
        y = rng.randint(20, h - 20)
        size = rng.choice([2, 2, 3, 3])
        opacity = rng.randint(28, 50)
        color = (201, 184, 138, opacity)
        pts = [(x, y - size), (x + size, y), (x, y + size), (x - size, y)]
        draw.polygon(pts, fill=color)


def gold_line(draw, y, w, margin=180):
    draw.line([(margin, y), (w - margin, y)], fill=GOLD_DARK, width=1)


def vert_line(draw, x, y1, y2):
    draw.line([(x, y1), (x, y2)], fill=GOLD_DARK, width=1)


def diamond(draw, cx, cy, size=8, color=GOLD):
    pts = [(cx, cy - size), (cx + size, cy), (cx, cy + size), (cx - size, cy)]
    draw.polygon(pts, fill=color)


def make_card(w, h):
    img = Image.new('RGBA', (w, h), BG_RGB + (255,))
    draw = ImageDraw.Draw(img)
    draw_stars(draw, w, h)
    return img, draw


def header(draw, w, y=45):
    font = ImageFont.truetype(LATIN_FONT, 18)
    draw.text((w // 2, y), "TAAMUN", font=font, fill=CREAM_DIM, anchor='mt')
    vert_line(draw, w // 2, y + 25, y + 70)


def footer(draw, w, h):
    font = ImageFont.truetype(LATIN_FONT, 16)
    draw.text((w // 2, h - 45), "taamun.com", font=font, fill=CREAM_DIM, anchor='mm')


def ar_text(draw, text, y, w, size=48, color=GOLD, bold=False):
    font = ImageFont.truetype(ARABIC_FONT, size)
    draw.text((w // 2, y), ar(text), font=font, fill=color, anchor='mm')


def lat_text(draw, text, y, w, size=48, color=GOLD):
    try:
        font = ImageFont.truetype(LATIN_BOLD, size)
    except:
        font = ImageFont.truetype(LATIN_FONT, size)
    draw.text((w // 2, y), text, font=font, fill=color, anchor='mm')


def cta_button(draw, w, y, text, width=500, height=70):
    x1, x2 = w // 2 - width // 2, w // 2 + width // 2
    y1, y2 = y - height // 2, y + height // 2
    draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=6, fill='#F0E1C0')
    font = ImageFont.truetype(ARABIC_FONT, 26)
    draw.text((w // 2, y), ar(text), font=font, fill='#221B07', anchor='mm')


def save(img, name):
    rgb = Image.new('RGB', img.size, BG_RGB)
    rgb.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
    path = os.path.join(OUT_DIR, name)
    rgb.save(path, 'PNG', quality=95)
    print(f"  ✓ {name}")


# ═══════════════════════════════════════════════════════════════
# CAROUSEL 1: "ليش 28 ريال؟" — 6 slides
# ═══════════════════════════════════════════════════════════════

def carousel1():
    print("\n▸ كاروسيل 1: ليش ٢٨ ريال؟")

    # --- Slide 1: Cover ---
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    diamond(d, SQ//2, 130, 10, GOLD)
    ar_text(d, "ليش عيدية تمعّن", 370, SQ, 52, GOLD_LIGHT)
    ar_text(d, "بـ ٢٨ ريال فقط؟", 450, SQ, 44, GOLD)
    gold_line(d, 520, SQ)
    ar_text(d, "اسحب لليسار", 700, SQ, 24, CREAM_DIM)
    footer(d, SQ, SQ)
    save(img, "c1-slide1-cover.png")

    # --- Slide 2: Goal ---
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 280)
    diamond(d, SQ//2, 280, 8, GOLD)
    ar_text(d, "لأن هدفنا مو الربح.", 420, SQ, 46, GOLD_LIGHT)
    gold_line(d, 500, SQ)
    ar_text(d, "هدفنا إنك تبدأ.", 600, SQ, 42, CREAM)
    footer(d, SQ, SQ)
    save(img, "c1-slide2-goal.png")

    # --- Slide 3: Equation ---
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 200)
    diamond(d, SQ//2, 200, 8, GOLD)
    items = [
        ("٢٨ يوم", 52, GOLD_LIGHT),
        ("آية واحدة", 44, CREAM),
        ("١٥ دقيقة", 44, CREAM),
    ]
    y = 300
    for text, sz, col in items:
        ar_text(d, text, y, SQ, sz, col)
        y += 75
        if text != "١٥ دقيقة":
            lat_text(d, "×", y - 35, SQ, 28, CREAM_DIM)

    gold_line(d, y + 10, SQ, 300)
    lat_text(d, "=", y + 50, SQ, 36, CREAM_DIM)
    ar_text(d, "حياة مختلفة", y + 120, SQ, 52, GOLD_LIGHT)
    footer(d, SQ, SQ)
    save(img, "c1-slide3-equation.png")

    # --- Slide 4: Features ---
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 180)
    diamond(d, SQ//2, 180, 8, GOLD)
    ar_text(d, "كل يوم فيه:", 260, SQ, 36, GOLD)
    gold_line(d, 310, SQ, 250)
    features = ["صمت", "آية", "سؤال تأمل", "طبقة مخفية", "تأمل شخصي", "مقياس وعي"]
    y = 390
    for f in features:
        ar_text(d, f, y, SQ, 30, CREAM)
        diamond(d, SQ//2 + 180, y, 3, GOLD)
        y += 65
    gold_line(d, y + 10, SQ, 250)
    footer(d, SQ, SQ)
    save(img, "c1-slide4-features.png")

    # --- Slide 5: Coffee comparison ---
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 180)
    diamond(d, SQ//2, 180, 8, GOLD)
    lat_text(d, "28", 290, SQ, 100, GOLD_LIGHT)
    ar_text(d, "ريال =", 365, SQ, 28, CREAM_DIM)
    gold_line(d, 410, SQ, 220)
    ar_text(d, "قهوة تنتهي في ٥ دقائق", 490, SQ, 30, CREAM_DIM)
    ar_text(d, "أو", 570, SQ, 34, GOLD)
    ar_text(d, "رحلة تغيّر علاقتك مع القرآن", 660, SQ, 32, GOLD_LIGHT)
    gold_line(d, 730, SQ, 220)
    footer(d, SQ, SQ)
    save(img, "c1-slide5-compare.png")

    # --- Slide 6: CTA ---
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 200)
    diamond(d, SQ//2, 200, 10, GOLD)
    ar_text(d, "عيدية تمعّن", 340, SQ, 54, GOLD_LIGHT)
    lat_text(d, "28", 480, SQ, 120, GOLD_LIGHT)
    ar_text(d, "ريال — ابدأ الحين", 570, SQ, 26, CREAM_DIM)
    gold_line(d, 630, SQ)
    cta_button(d, SQ, 730, "ابدأ رحلتك")
    ar_text(d, "الرابط في البايو", 830, SQ, 22, CREAM_DIM)
    footer(d, SQ, SQ)
    save(img, "c1-slide6-cta.png")


# ═══════════════════════════════════════════════════════════════
# CAROUSEL 2: "5 إشارات إنك تحتاج تمعّن" — 7 slides
# ═══════════════════════════════════════════════════════════════

def carousel2():
    print("\n▸ كاروسيل 2: ٥ إشارات")

    # Cover
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 250)
    diamond(d, SQ//2, 250, 10, GOLD)
    ar_text(d, "٥ إشارات", 400, SQ, 56, GOLD_LIGHT)
    ar_text(d, "إنك تحتاج تمعّن", 480, SQ, 40, GOLD)
    gold_line(d, 550, SQ)
    ar_text(d, "لو واحدة فيك — هذا لك", 640, SQ, 24, CREAM_DIM)
    footer(d, SQ, SQ)
    save(img, "c2-slide1-cover.png")

    signs = [
        ("1", "تقرأ القرآن...", "لكن تحس إنك تمر", "على كلمات مو أكثر."),
        ("2", "تبي تتعمّق...", "لكن ما تعرف", "من وين تبدأ."),
        ("3", "عندك ١٥ دقيقة...", "لكن تضيعها في", "التصفح العشوائي."),
        ("4", "تحس بفجوة روحية...", "رغم إنك ملتزم", "ظاهرياً."),
        ("5", "تبي نظام يأخذك", "خطوة خطوة...", "مو فوضى ومعلومات مبعثرة."),
    ]

    for i, (num, l1, l2, l3) in enumerate(signs):
        img, d = make_card(SQ, SQ)
        header(d, SQ)
        vert_line(d, SQ//2, 80, 200)
        diamond(d, SQ//2, 200, 8, GOLD)
        lat_text(d, num, 330, SQ, 110, GOLD_LIGHT)
        gold_line(d, 420, SQ, 280)
        ar_text(d, l1, 510, SQ, 36, CREAM)
        ar_text(d, l2, 580, SQ, 32, CREAM_DIM)
        ar_text(d, l3, 640, SQ, 32, CREAM_DIM)
        # Progress dots
        for j in range(5):
            dx = SQ//2 + (j - 2) * 40
            diamond(d, dx, 790, 5 if j <= i else 3, GOLD if j <= i else GOLD_DARK)
        footer(d, SQ, SQ)
        save(img, f"c2-slide{i+2}-sign{num}.png")

    # CTA
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 200)
    diamond(d, SQ//2, 200, 10, GOLD)
    ar_text(d, "لو واحدة فيك:", 320, SQ, 34, CREAM)
    gold_line(d, 380, SQ, 250)
    ar_text(d, "عيدية تمعّن", 460, SQ, 46, GOLD_LIGHT)
    lat_text(d, "28", 580, SQ, 100, GOLD_LIGHT)
    ar_text(d, "ريال", 650, SQ, 28, CREAM_DIM)
    gold_line(d, 700, SQ)
    ar_text(d, "٢٨ يوم تغيّر علاقتك مع القرآن.", 780, SQ, 26, CREAM_DIM)
    ar_text(d, "الرابط في البايو", 860, SQ, 22, CREAM_DIM)
    footer(d, SQ, SQ)
    save(img, "c2-slide7-cta.png")


# ═══════════════════════════════════════════════════════════════
# CAROUSEL 3: "القراءة مقابل التمعّن" — 5 slides
# ═══════════════════════════════════════════════════════════════

def carousel3():
    print("\n▸ كاروسيل 3: القراءة مقابل التمعّن")

    # Cover
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 220)
    diamond(d, SQ//2, 220, 10, GOLD)
    ar_text(d, "قراءة القرآن", 380, SQ, 42, CREAM)
    ar_text(d, "مقابل", 450, SQ, 30, GOLD_DARK)
    ar_text(d, "التمعّن في القرآن", 530, SQ, 42, GOLD_LIGHT)
    gold_line(d, 600, SQ)
    ar_text(d, "الفرق اللي ما حد يحكيه.", 700, SQ, 26, CREAM_DIM)
    footer(d, SQ, SQ)
    save(img, "c3-slide1-cover.png")

    # القراءة
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 180)
    diamond(d, SQ//2, 180, 8, GOLD)
    ar_text(d, "القراءة:", 280, SQ, 44, GOLD)
    gold_line(d, 330, SQ, 280)
    items = ["عينك تمر على الكلمات", "تختم بسرعة", "أجر إن شاء الله"]
    y = 420
    for item in items:
        ar_text(d, item, y, SQ, 30, CREAM)
        y += 65
    gold_line(d, y + 20, SQ, 250)
    ar_text(d, "لكن...", y + 80, SQ, 36, GOLD)
    ar_text(d, "وش تغيّر فيك؟", y + 150, SQ, 38, GOLD_LIGHT)
    footer(d, SQ, SQ)
    save(img, "c3-slide2-reading.png")

    # التمعّن
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 180)
    diamond(d, SQ//2, 180, 8, GOLD)
    ar_text(d, "التمعّن:", 280, SQ, 44, GOLD_LIGHT)
    gold_line(d, 330, SQ, 280)
    items = [
        ("تتوقف عند آية واحدة", CREAM),
        ("تسأل: وش تقول لي أنا؟", CREAM),
        ("تكتشف معنى ما شفته قبل", CREAM),
        ("تكتب تأملك", CREAM),
        ("تتغيّر — فعلاً.", GOLD_LIGHT),
    ]
    y = 410
    for text, color in items:
        ar_text(d, text, y, SQ, 30, color)
        diamond(d, SQ//2 + 230, y, 3, GOLD)
        y += 65
    footer(d, SQ, SQ)
    save(img, "c3-slide3-taamun.png")

    # Comparison table
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 180)
    diamond(d, SQ//2, 180, 8, GOLD)
    # Headers
    ar_text(d, "القراءة", 270, SQ - 280, 34, CREAM_DIM)
    ar_text(d, "التمعّن", 270, SQ + 280, 34, GOLD)
    gold_line(d, 310, SQ, 120)
    rows = [
        ("صفحات كثيرة", "آية واحدة"),
        ("٥ دقائق", "١٥ دقيقة"),
        ("كمية", "عمق"),
        ("عادة", "تحوّل"),
    ]
    y = 400
    for left, right in rows:
        ar_text(d, left, y, SQ - 280, 28, CREAM_DIM)
        diamond(d, SQ//2, y, 4, GOLD_DARK)
        ar_text(d, right, y, SQ + 280, 28, GOLD_LIGHT)
        y += 85
    gold_line(d, y + 20, SQ, 120)
    footer(d, SQ, SQ)
    save(img, "c3-slide4-table.png")

    # CTA
    img, d = make_card(SQ, SQ)
    header(d, SQ)
    vert_line(d, SQ//2, 80, 200)
    diamond(d, SQ//2, 200, 10, GOLD)
    ar_text(d, "تبي تتحول", 340, SQ, 36, CREAM)
    ar_text(d, "من قارئ إلى متمعّن؟", 410, SQ, 40, GOLD_LIGHT)
    gold_line(d, 480, SQ)
    ar_text(d, "عيدية تمعّن", 560, SQ, 42, GOLD)
    lat_text(d, "28", 680, SQ, 100, GOLD_LIGHT)
    ar_text(d, "ريال — ٢٨ يوم — آية واحدة كل يوم", 770, SQ, 24, CREAM_DIM)
    gold_line(d, 820, SQ)
    ar_text(d, "الرابط في البايو", 900, SQ, 22, CREAM_DIM)
    footer(d, SQ, SQ)
    save(img, "c3-slide5-cta.png")


# ═══════════════════════════════════════════════════════════════
# STORIES — 7 stories (1080×1920)
# ═══════════════════════════════════════════════════════════════

def stories():
    print("\n▸ ستوريز إنستغرام (7)")

    # Story 1 — استطلاع
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 500)
    diamond(d, ST_W//2, 500, 12, GOLD)
    ar_text(d, "سؤال:", 650, ST_W, 30, CREAM_DIM)
    ar_text(d, "تقرأ القرآن كل يوم؟", 780, ST_W, 46, GOLD_LIGHT)
    gold_line(d, 870, ST_W, 200)
    # Poll buttons
    for text, xoff in [("نعم", -150), ("أحياناً", 150)]:
        bx = ST_W//2 + xoff
        d.rounded_rectangle([(bx-120, 960), (bx+120, 1040)], radius=8, fill='#2A2520', outline=GOLD_DARK)
        font = ImageFont.truetype(ARABIC_FONT, 24)
        d.text((bx, 1000), ar(text), font=font, fill=GOLD, anchor='mm')
    footer(d, ST_W, ST_H)
    save(img, "story1-poll.png")

    # Story 2 — الحقيقة
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 450)
    diamond(d, ST_W//2, 450, 10, GOLD)
    ar_text(d, "أغلبنا يقول نعم", 600, ST_W, 38, CREAM)
    gold_line(d, 680, ST_W, 250)
    ar_text(d, "لكن السؤال الحقيقي:", 780, ST_W, 32, CREAM_DIM)
    ar_text(d, "متى آخر مرة حسيت", 900, ST_W, 40, GOLD_LIGHT)
    ar_text(d, "إن الآية تكلّمك أنت؟", 970, ST_W, 40, GOLD_LIGHT)
    gold_line(d, 1070, ST_W, 300)
    footer(d, ST_W, ST_H)
    save(img, "story2-truth.png")

    # Story 3 — التقديم
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 480)
    diamond(d, ST_W//2, 480, 12, GOLD)
    ar_text(d, "اليوم نطلق شي مختلف.", 620, ST_W, 34, CREAM)
    gold_line(d, 700, ST_W, 250)
    ar_text(d, "تمعّن", 830, ST_W, 68, GOLD_LIGHT)
    ar_text(d, "رحلة ٢٨ يوم", 940, ST_W, 36, GOLD)
    ar_text(d, "لاكتشاف المعنى بلغة القرآن.", 1010, ST_W, 30, CREAM)
    gold_line(d, 1090, ST_W, 250)
    ar_text(d, "مو تطبيق قراءة.", 1170, ST_W, 28, CREAM_DIM)
    ar_text(d, "تجربة تحوّل.", 1240, ST_W, 32, GOLD_LIGHT)
    footer(d, ST_W, ST_H)
    save(img, "story3-intro.png")

    # Story 4 — كيف يشتغل
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 400)
    diamond(d, ST_W//2, 400, 10, GOLD)
    ar_text(d, "كل يوم في ١٥ دقيقة:", 520, ST_W, 36, GOLD)
    gold_line(d, 590, ST_W, 220)
    features = ["صمت — ٦٠ ثانية", "آية مختارة بعناية", "سؤال تأمل",
                "طبقة معنى مخفية", "تكتب تأملك", "مقياس وعيك"]
    y = 700
    for f in features:
        ar_text(d, f, y, ST_W, 30, CREAM)
        diamond(d, ST_W//2 + 220, y, 3, GOLD)
        y += 75
    gold_line(d, y + 30, ST_W, 220)
    ar_text(d, "٢٨ يوم. من الظل إلى النور.", y + 100, ST_W, 30, GOLD_LIGHT)
    footer(d, ST_W, ST_H)
    save(img, "story4-howitworks.png")

    # Story 5 — العرض
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 380)
    diamond(d, ST_W//2, 380, 12, GOLD)
    ar_text(d, "عيدية تمعّن", 520, ST_W, 56, GOLD_LIGHT)
    gold_line(d, 600, ST_W)
    lat_text(d, "28", 750, ST_W, 130, GOLD_LIGHT)
    ar_text(d, "ريال فقط", 850, ST_W, 28, CREAM_DIM)
    ar_text(d, "أرخص من قهوة", 920, ST_W, 24, CREAM_DIM)
    gold_line(d, 980, ST_W, 250)
    checks = ["رحلة ٢٨ يوم كاملة", "صلاحية ٣ أشهر", "لنفسك أو هدية"]
    y = 1060
    for c in checks:
        ar_text(d, c, y, ST_W, 28, CREAM)
        y += 60
    gold_line(d, y + 20, ST_W)
    cta_button(d, ST_W, y + 100, "اسحب لفوق", 400)
    footer(d, ST_W, ST_H)
    save(img, "story5-offer.png")

    # Story 6 — الإهداء
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 450)
    diamond(d, ST_W//2, 450, 12, GOLD)
    ar_text(d, "أحلى عيدية", 600, ST_W, 52, GOLD_LIGHT)
    gold_line(d, 680, ST_W)
    ar_text(d, "هدية تفتح قلب من تحب", 790, ST_W, 34, CREAM)
    ar_text(d, "على القرآن", 860, ST_W, 34, CREAM)
    ar_text(d, "بطريقة ما جرّبها قبل.", 930, ST_W, 30, CREAM_DIM)
    gold_line(d, 1010, ST_W, 250)
    ar_text(d, "٢٨ ريال", 1100, ST_W, 38, GOLD)
    ar_text(d, "كود تفعيل + بطاقة عيدية رقمية", 1170, ST_W, 24, CREAM_DIM)
    gold_line(d, 1240, ST_W, 300)
    ar_text(d, "الرابط في البايو", 1330, ST_W, 22, CREAM_DIM)
    footer(d, ST_W, ST_H)
    save(img, "story6-gift.png")

    # Story 7 — ختام
    img, d = make_card(ST_W, ST_H)
    header(d, ST_W, 80)
    vert_line(d, ST_W//2, 120, 500)
    diamond(d, ST_W//2, 500, 12, GOLD)
    ar_text(d, "اليوم أول يوم.", 660, ST_W, 38, CREAM)
    gold_line(d, 730, ST_W, 300)
    ar_text(d, "كثير بدأوا رحلتهم.", 830, ST_W, 34, CREAM_DIM)
    gold_line(d, 920, ST_W, 200)
    ar_text(d, "من الظل إلى أفضل احتمالك —", 1030, ST_W, 32, GOLD_LIGHT)
    ar_text(d, "٢٨ يوماً في كل مرة.", 1100, ST_W, 32, GOLD_LIGHT)
    gold_line(d, 1180, ST_W, 200)
    lat_text(d, "taamun.com/pricing", 1300, ST_W, 22, GOLD)
    footer(d, ST_W, ST_H)
    save(img, "story7-closing.png")


# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 50)
    print("  عيدية تمعّن — حملة ذئب الشمال v2")
    print("=" * 50)
    carousel1()
    carousel2()
    carousel3()
    stories()
    print(f"\n  Done! → {OUT_DIR}")
    print("=" * 50)
