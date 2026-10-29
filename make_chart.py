# -*- coding: utf-8 -*-
"""Grouped bar chart: homepage load vs AI response time across 3 device groups,
   with a 3-second reference line."""
from PIL import Image, ImageDraw, ImageFont

S = 2
FONTS = {
    "ui": "C:/Windows/Fonts/segoeui.ttf",
    "uib": "C:/Windows/Fonts/segoeuib.ttf",
    "mono": "C:/Windows/Fonts/consola.ttf",
}

def F(name, size):
    return ImageFont.truetype(FONTS[name], int(size))

def Fs(name, size):
    return ImageFont.truetype(FONTS[name], int(size * S))

BG     = "#EEF1F6"
INK    = "#0F172A"
INK2   = "#334155"
MUTED  = "#64748B"
FAINT  = "#94A3B8"
GRID   = "#E8EDF3"
BORDER = "#E2E8F0"
BLUE   = "#1E3A8A"
TEAL   = "#0F766E"
RED    = "#DC2626"

W, H = 1600, 980
PX0, PX1 = 130, 1500          # plot area
PY0, PY1 = 250, 800
YMAX = 6.0

GROUPS = [
    ("Máy cao cấp", "iPhone 13 · Snapdragon 8", 1.1, 2.2),
    ("Máy tầm trung", "4 GB RAM · 4G LTE", 1.9, 3.1),
    ("Máy cũ · mạng yếu", "iPhone 6s · 3G", 3.6, 5.4),
]
THRESHOLD = 3.0

img = Image.new("RGB", (W * S, H * S), BG)
d = ImageDraw.Draw(img)

def rrect(x0, y0, x1, y1, fill=None, outline=None, w=1, r=8):
    d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], radius=int(r * S),
                        fill=fill, outline=outline, width=max(1, int(w * S)))

def rect(x0, y0, x1, y1, fill):
    d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill)

def line(p1, p2, color, w=1.4):
    d.line([p1[0] * S, p1[1] * S, p2[0] * S, p2[1] * S], fill=color,
           width=max(1, int(w * S)))

def dashed(p1, p2, color, w=1.6, dash=10, gap=7):
    import math
    (x1, y1), (x2, y2) = p1, p2
    L = math.hypot(x2 - x1, y2 - y1)
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    t = 0.0
    while t < L:
        e = min(t + dash, L)
        line((x1 + ux * t, y1 + uy * t), (x1 + ux * e, y1 + uy * e), color, w)
        t = e + gap

def text(x, y, s, font, color, anchor="lm"):
    d.text((x * S, y * S), s, font=font, fill=color, anchor=anchor)

def bar(x, w, vtop, color):
    rrect(x, vtop, x + w, PY1, fill=color, r=7)
    rect(x, PY1 - 9, x + w, PY1, color)

def yof(v):
    return PY1 - v / YMAX * (PY1 - PY0)

f_h1 = Fs("uib", 32)
f_h2 = Fs("ui", 18)
f_tick = Fs("ui", 14)
f_val = Fs("uib", 17)
f_grp = Fs("uib", 17)
f_sub = Fs("ui", 13.5)
f_leg = Fs("ui", 15)
f_note = Fs("ui", 13)

# ---------- frame ----------
rrect(20, 20, W - 20, H - 20, fill="#FFFFFF", r=16)
rrect(20, 20, W - 20, 132, fill="#0F172A", r=16)
rrect(20, 96, W - 20, 132, fill="#0F172A", r=0)
text(56, 56, "THỜI GIAN TẢI TRANG CHỦ & PHẢN HỒI AI THEO NHÓM THIẾT BỊ", f_h1, "#FFFFFF")
text(56, 100, "đơn vị: giây (s) · đường nét đứt đỏ = ngưỡng 3 giây", f_h2, "#94A3B8")

# sample-data badge
text(W - 300, 56, "DỮ LIỆU MINH HOẠ", Fs("uib", 13), "#FCA5A5")
text(W - 300, 82, "thay bằng số đo thực tế", Fs("ui", 12), "#64748B")
rrect(W - 312, 40, W - 56, 98, outline="#475569", w=1.2, r=8)

# ---------- grid + y axis ----------
for v in range(0, int(YMAX) + 1):
    y = yof(v)
    if v:
        line((PX0, y), (PX1, y), GRID, 1.2)
    text(PX0 - 18, y, str(v), f_tick, MUTED, anchor="rm")

line((PX0, PY1), (PX1, PY1), "#CBD5E1", 1.6)
line((PX0, PY0 - 14), (PX0, PY1), "#CBD5E1", 1.6)
text(PX0 - 18, PY0 - 30, "giây", f_tick, MUTED, anchor="rm")

# ---------- threshold ----------
ty = yof(THRESHOLD)
dashed((PX0, ty), (PX1, ty), RED, 2, 11, 7)
rrect(PX0 + 12, ty - 15, PX0 + 140, ty + 15, fill="#FFFFFF", outline=RED, w=1.2, r=15)
text(PX0 + 76, ty, "ngưỡng 3 giây", Fs("uib", 13), RED, anchor="mm")

# ---------- bars ----------
GW = (PX1 - PX0) / len(GROUPS)
BW_ = 88
GAP = 24
maxv = 0
for i, (name, spec, home, ai) in enumerate(GROUPS):
    cx = PX0 + GW * (i + 0.5)
    x1 = cx - GAP / 2 - BW_
    x2 = cx + GAP / 2
    bar(x1, BW_, yof(home), BLUE)
    bar(x2, BW_, yof(ai), TEAL)
    maxv = max(maxv, home, ai)

    for x, v, col in ((x1, home, BLUE), (x2, ai, TEAL)):
        text(x + BW_ / 2, yof(v) - 18, f"{v:.1f}".replace(".", ",") + " s",
             f_val, RED if v > THRESHOLD else INK, anchor="mm")

    # group labels
    text(cx, PY1 + 28, name, f_grp, INK, anchor="mm")
    text(cx, PY1 + 52, spec, f_sub, FAINT, anchor="mm")

# ---------- legend ----------
ly = 190
rrect(PX0, ly - 13, PX0 + 15, ly + 2, fill=BLUE, r=3)
text(PX0 + 24, ly - 5, "Tải trang chủ", f_leg, INK2)
rrect(PX0 + 170, ly - 13, PX0 + 185, ly + 2, fill=TEAL, r=3)
text(PX0 + 194, ly - 5, "Phản hồi AI (first token)", f_leg, INK2)
d.ellipse([(PX0 + 450 - 3) * S, (ly - 9) * S, (PX0 + 450 + 3) * S, (ly - 3) * S], fill=RED)
text(PX0 + 460, ly - 5, "nhãn đỏ = cột vượt ngưỡng", f_leg, MUTED)

# ---------- footnote ----------
n1 = ("Số liệu minh hoạ để dựng khung biểu đồ — thay bằng p50 sau ≥ 20 lần đo thật "
      "(Performance API: navigationStart → loadEventEnd; AI: request → first token).")
n2 = "Kết quả mẫu: 2/6 cột vượt 3 giây, đều thuộc nhóm máy cũ / mạng yếu — đúng điểm nghẽn cần tối ưu."
text(56, 888, n1, f_note, MUTED)
text(56, 912, n2, Fs("uib", 13), INK2)
text(56, 940, "Gợi ý đọc: so sánh trong cùng nhóm thiết bị (cột xanh vs xanh ngọc), không so chéo nhóm.",
     f_note, FAINT)

out = "D:/Tải Xuống/app/bieu_do_thoi_gian_tai_3_nhom_thiet_bi.png"
img.save(out, "PNG")
print("saved", out, img.size)
