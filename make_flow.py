# -*- coding: utf-8 -*-
"""5-step process diagram with a test-failure loop back to step 2
   and three deployment targets (static hosting, Firebase, Supabase)."""
from PIL import Image, ImageDraw, ImageFont

S = 2
FONTS = {
    "ui": "C:/Windows/Fonts/segoeui.ttf",
    "uib": "C:/Windows/Fonts/segoeuib.ttf",
    "mono": "C:/Windows/Fonts/consola.ttf",
    "monob": "C:/Windows/Fonts/consolab.ttf",
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
BORDER = "#E2E8F0"
ARR    = "#94A3B8"
GREEN  = "#15803D"
AMBER  = "#B45309"
BLUE   = "#1E3A8A"
TEAL   = "#0F766E"

W = 1760
STEP_W, STEP_H = 300, 140
STEP_X = [40, 384, 728, 1072, 1416]
STEP_Y = 210

STEPS = [
    ("KHẢO SÁT", BLUE, [
        "Yêu cầu & phạm vi tính năng",
        "Đối tượng người dùng, luồng chính",
        "Tiêu chí nghiệm thu",
    ]),
    ("THIẾT KẾ", BLUE, [
        "Kiến trúc, sơ đồ màn hình",
        "Mô hình dữ liệu (ERD / cây)",
        "Quy tắc phân quyền đọc – ghi",
    ]),
    ("HIỆN THỰC", TEAL, [
        "Giao diện + API nghiệp vụ",
        "Seed dữ liệu mẫu, tài khoản test",
        "Cấu hình môi trường, biến bí mật",
    ]),
    ("KIỂM THỬ", AMBER, [
        "Chức năng & phân quyền từng vai",
        "Hiệu năng, thiết bị di động cũ",
        "Đối chiếu đặc tả bước 1–2",
    ]),
    ("TRIỂN KHAI", GREEN, [
        "Đóng gói build, kiểm tra production",
        "Domain, CDN, biến môi trường",
        "Theo dõi lỗi & log sau phát hành",
    ]),
]

DEP = [
    ("TĨNH · CDN", "Dịch vụ tĩnh", INK2, ["Netlify / Vercel / Cloudflare Pages / GitHub Pages",
     "Build sẵn HTML–CSS–JS, phục vụ qua CDN, không backend",
     "Không có sẵn auth, DB — dữ liệu phải gọi API ngoài"],
     "Chọn khi: chỉ cần giao diện, landing, tài liệu hoặc bản demo."),
    ("BaaS · NoSQL", "Firebase", AMBER, ["Hosting + Auth + Realtime DB/Firestore + Storage",
     "Khớp mô hình cây: users / classes / exams / examSessions…",
     "Bảo mật bằng rules; proKeys & cấp quyền nên qua Cloud Function"],
     "Chọn khi: cần realtime (giám sát thi), phát hành nhanh, ít vận hành."),
    ("BaaS · SQL", "Supabase", TEAL, ["Postgres + Auth + Storage + Edge Functions",
     "Khớp ERD 11 bảng: exams, questions, attempts, credits…",
     "Bảo mật bằng RLS theo user_id / role, không cần server riêng"],
     "Chọn khi: dữ liệu quan hệ chặt, cần SQL, báo cáo & thống kê."),
]

DEP_W, DEP_X = 480, [105, 640, 1175]
DEP_Y = 584

# ---------- measure ----------
_meas = ImageDraw.Draw(Image.new("RGB", (8, 8)))
def tw(s, size, bold=False):
    return _meas.textlength(s, font=ImageFont.truetype(
        FONTS["uib" if bold else "ui"], int(size)))

def wrap(s, size, maxw):
    out, cur = [], ""
    for w in s.split():
        t = (cur + " " + w).strip()
        if tw(t, size) <= maxw:
            cur = t
        else:
            if cur:
                out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out

# ---------- dep card geometry ----------
dep_rows = []
for tag, title, accent, bullets, choose in DEP:
    lines = []
    for b in bullets:
        lines += wrap(b, 12.5, DEP_W - 56 - 14)
    ch = wrap(choose, 12.5, DEP_W - 56 - 14)
    dep_rows.append((tag, title, accent, bullets, choose, lines, ch))

maxb = max(len(r[5]) for r in dep_rows)
maxc = max(len(r[6]) for r in dep_rows)
DEP_H = 74 + maxb * 21 + 16 + maxc * 18 + 18

H = DEP_Y + DEP_H + 84

img = Image.new("RGB", (W * S, H * S), BG)
d = ImageDraw.Draw(img)

def rrect(x0, y0, x1, y1, fill=None, outline=None, w=1, r=8):
    d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], radius=int(r * S),
                        fill=fill, outline=outline, width=max(1, int(w * S)))

def line(p1, p2, color=ARR, w=1.8, casing=False):
    if casing:
        d.line([p1[0] * S, p1[1] * S, p2[0] * S, p2[1] * S], fill="#FFFFFF",
               width=int((w + 4) * S))
    d.line([p1[0] * S, p1[1] * S, p2[0] * S, p2[1] * S], fill=color,
           width=max(1, int(w * S)))

def dashed(p1, p2, color=AMBER, w=1.8, dash=9, gap=7):
    import math
    (x1, y1), (x2, y2) = p1, p2
    L = math.hypot(x2 - x1, y2 - y1)
    if not L:
        return
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    t = 0.0
    while t < L:
        e = min(t + dash, L)
        line((x1 + ux * t, y1 + uy * t), (x1 + ux * e, y1 + uy * e), color, w)
        t = e + gap

def arrow(p1, p2, color=ARR, w=1.8, head=7):
    line(p1, p2, color, w)
    import math
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    for s in (0.42, -0.42):
        line(p2, (p2[0] - head * math.cos(ang - s), p2[1] - head * math.sin(ang - s)),
             color, w)

def text(x, y, s, font, color, anchor="lm"):
    d.text((x * S, y * S), s, font=font, fill=color, anchor=anchor)

def pill(cx, cy, label, bg, fg, fw=22, fh=15, fs=10):
    rrect(cx - fw / 2, cy - fh / 2, cx + fw / 2, cy + fh / 2, fill=bg, r=fh / 2)
    text(cx, cy + 0.6, label, Fs("uib", fs), fg, anchor="mm")

f_step_title = Fs("uib", 15)
f_bullet = Fs("ui", 12.5)
f_body = Fs("ui", 12.5)
f_small = Fs("ui", 11.5)
f_dep_title = Fs("uib", 20)
f_h1 = Fs("uib", 32)
f_h2 = Fs("ui", 18)

# ---------- card frame ----------
rrect(20, 20, W - 20, H - 20, fill="#FFFFFF", r=16)
rrect(20, 20, W - 20, 118, fill="#0F172A", r=16)
rrect(20, 80, W - 20, 118, fill="#0F172A", r=0)
text(56, 52, "QUY TRÌNH 5 BƯỚC", f_h1, "#FFFFFF")
text(56, 90, "có nhánh lặp khi kiểm thử không đạt · ba đích triển khai", f_h2, FAINT)

# ---------- connectors: main flow ----------
for i in range(4):
    x1 = STEP_X[i] + STEP_W
    x2 = STEP_X[i + 1]
    arrow((x1 + 6, STEP_Y + 62), (x2 - 6, STEP_Y + 62), ARR, 2)

# loop back 4 -> 2
LB_X = STEP_X[3] + STEP_W / 2      # 1222
L2_X = STEP_X[1] + STEP_W / 2      # 534
loop_y = 450
dashed((LB_X, STEP_Y + STEP_H), (LB_X, loop_y), AMBER, 2)
dashed((LB_X, loop_y), (L2_X, loop_y), AMBER, 2)
arrow((L2_X, loop_y), (L2_X, STEP_Y + STEP_H + 4), AMBER, 2)
pill(LB_X, STEP_Y + STEP_H + 28, "KHÔNG ĐẠT", "#FEF3C7", AMBER, fw=64, fh=19, fs=10)
text(L2_X + 18, loop_y + 20,
     "quay lại BƯỚC 2 — sửa thiết kế (dữ liệu, phân quyền) trước khi sửa mã nguồn",
     Fs("uib", 12), AMBER)

# pass label on 4 -> 5
pill(1394, STEP_Y + 40, "ĐẠT", "#DCFCE7", GREEN, fw=40, fh=18, fs=9.5)

# ---------- bus to deployment targets ----------
BX = STEP_X[4] + STEP_W / 2
BUS_Y = 524
arrow((BX, STEP_Y + STEP_H), (BX, BUS_Y), GREEN, 2)
line((BX, BUS_Y), (DEP_X[0] + DEP_W / 2, BUS_Y), GREEN, 2)
for dx in (DEP_X[0] + DEP_W / 2, DEP_X[1] + DEP_W / 2, DEP_X[2] + DEP_W / 2):
    arrow((dx, BUS_Y), (dx, DEP_Y - 4), GREEN, 2)

text(105, BUS_Y - 22, "BA ĐÍCH TRIỂN KHAI — cùng một mã nguồn, khác tầng lưu trữ",
     Fs("uib", 13), GREEN)

# ---------- step cards ----------
for i, (title, accent, bullets) in enumerate(STEPS):
    x, y = STEP_X[i], STEP_Y
    rrect(x, y, x + STEP_W, y + STEP_H, fill="#FFFFFF", outline=BORDER, w=1.4, r=12)
    rrect(x, y, x + STEP_W, y + 7, fill=accent, r=12)
    d.rectangle([x * S, (y + 1) * S, (x + STEP_W) * S, (y + 5) * S], fill=accent)
    d.ellipse([(x + 16) * S, (y + 20) * S, (x + 48) * S, (y + 52) * S], fill=accent)
    text(x + 32, y + 36, str(i + 1), Fs("uib", 15), "#FFFFFF", anchor="mm")
    text(x + 58, y + 36, title, f_step_title, INK)
    for j, b in enumerate(bullets):
        by = y + 76 + j * 21
        d.ellipse([(x + 18) * S, (by - 2.5) * S, (x + 23) * S, (by + 2.5) * S],
                  fill=FAINT)
        text(x + 30, by, b, f_bullet, INK2)

# ---------- deployment cards ----------
for idx, (tag, title, accent, bullets, choose, lines, chs) in enumerate(dep_rows):
    x, y = DEP_X[idx], DEP_Y
    rrect(x, y, x + DEP_W, y + DEP_H, fill="#FBFCFE", outline=BORDER, w=1.4, r=12)
    rrect(x, y, x + 6, y + DEP_H, fill=accent, r=3)

    tw_ = F("uib", 10.5)
    pw = _meas.textlength(tag, font=tw_) + 20
    rrect(x + 24, y + 18, x + 24 + pw, y + 38, fill="#FFFFFF", outline=accent,
          w=1.1, r=10)
    text(x + 24 + pw / 2, y + 28, tag, Fs("uib", 10.5), accent, anchor="mm")

    text(x + 24, y + 56, title, f_dep_title, INK)
    yy = y + 84
    for ln_ in lines:
        d.ellipse([(x + 26) * S, (yy - 2.5) * S, (x + 31) * S, (yy + 2.5) * S],
                  fill=FAINT)
        text(x + 38, yy, ln_, f_body, INK2)
        yy += 21
    yy += 6
    line((x + 24, yy), (x + DEP_W - 24, yy), BORDER, 1)
    yy += 16
    for ln_ in chs:
        text(x + 24, yy, ln_, f_small, MUTED)
        yy += 18

# ---------- footer ----------
text(56, DEP_Y + DEP_H + 34,
     "Đổi đích triển khai = đổi tầng dữ liệu + biến môi trường; giao diện và nghiệp vụ giữ nguyên.",
     Fs("ui", 12), MUTED)
text(56, DEP_Y + DEP_H + 54,
     "Chốt ngay ở bước 2: cây JSON → Firebase  ·  ERD quan hệ → Supabase  ·  chỉ giao diện, không backend → dịch vụ tĩnh.",
     Fs("ui", 12), FAINT)

out = "D:/Tải Xuống/app/quy_trinh_5_buoc_trien_khai.png"
img.save(out, "PNG")
print("saved", out, img.size, "DEP_H", DEP_H, "H", H)
