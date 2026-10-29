# -*- coding: utf-8 -*-
"""Render a data-tree + read/write permission map as a high-resolution PNG."""
import re
from PIL import Image, ImageDraw, ImageFont

S = 2  # supersample factor

FONTS = {
    "ui": "C:/Windows/Fonts/segoeui.ttf",
    "uib": "C:/Windows/Fonts/segoeuib.ttf",
    "mono": "C:/Windows/Fonts/consola.ttf",
    "monob": "C:/Windows/Fonts/consolab.ttf",
}

def F(name, size):
    return ImageFont.truetype(FONTS[name], int(size))

# ---------- palette ----------
BG        = "#F1F5F9"
CARD      = "#FFFFFF"
INK       = "#0F172A"
INK2      = "#334155"
MUTED     = "#64748B"
LINE      = "#E2E8F0"
TREE      = "#CBD5E1"
READ_C    = "#1D4ED8"
WRITE_C   = "#B45309"
GROUP_BG  = "#EEF2FF"
ACCENT    = "#1E3A8A"
CODE_C    = "#0F172A"
HEAD_BG   = "#0F172A"
SUB_C     = "#94A3B8"

# ---------- layout, in base units ----------
W        = 1560
CARD_X0  = 32
CARD_X1  = 1528
PATH_X   = 64
PATH_W   = 420
READ_X   = 506
READ_W   = 470
WRITE_X  = 1004
WRITE_W  = 490
INDENT   = 26
LH       = 26
PAD_T    = 13
PAD_B    = 13
HEADER_H = 168

ROWS = [
    (0, [], 0, "/users", "Chính chủ · Giáo viên cùng lớp · Admin",
     "Chính chủ; cấm đổi `role`, `classIds`", 1),
    (1, [1], 1, "{uid}", "Như trên", "Chỉ khi `auth.uid == $uid`", 0),

    (0, [], 0, "/classes", "Thành viên lớp · Giáo viên · Admin",
     "Giáo viên tạo lớp · Admin toàn quyền", 1),
    (1, [1], 0, "{classId}", "Thành viên của lớp đó",
     "Giáo viên chủ lớp · `ownerId`", 0),
    (2, [1, 1], 0, "members/{uid}", "Thành viên lớp",
     "Giáo viên chủ lớp / Cloud Function", 0),
    (2, [1, 0], 1, "pending/{email|uid}", "Giáo viên chủ lớp",
     "Học sinh tạo yêu cầu; cấm sửa / xóa", 0),

    (0, [], 0, "/exams", "Giáo viên sở hữu · Học sinh được giao",
     "Giáo viên sở hữu · `ownerId`", 1),
    (1, [1], 0, "{examId}", "Học sinh có trong `assignedTo`",
     "Giáo viên tạo đề", 0),
    (2, [1, 1], 0, "private", "Chỉ giáo viên sở hữu",
     "Chỉ giáo viên; học sinh = `false`", 0),
    (2, [1, 0], 1, "attempts/{uid}", "Giáo viên sở hữu + chính chủ",
     "Học sinh ghi khi thi; khóa sau khi nộp", 0),

    (0, [], 0, "/submissions", "Giáo viên sở hữu · Học sinh chính chủ",
     "Học sinh tạo 1 lần; cấm update / delete", 1),
    (1, [1], 1, "{examId}/{uid}", "Như trên",
     "Chỉ create: `!data.exists()`", 0),

    (0, [], 0, "/examSessions", "Giáo viên giám sát · Học sinh trong phiên",
     "Chỉ server (Cloud Function)", 1),
    (1, [1], 0, "{sessionId}", "Người tạo phiên + người tham gia",
     "Chỉ server", 0),
    (2, [1, 1], 0, "students/{uid}", "Giáo viên giám sát + chính chủ",
     "Học sinh cập nhật `status`, `lastSeen`", 0),
    (2, [1, 0], 1, "media/{fileId}", "Giáo viên giám sát + chính chủ",
     "Học sinh upload; cấm xóa", 0),

    (0, [], 0, "/examRetryPermits", "Giáo viên · Học sinh được cấp",
     "Chỉ giáo viên / admin", 1),
    (1, [1], 1, "{examId}/{uid}", "Chính chủ học sinh",
     "Giáo viên cấp lượt thi lại", 0),

    (0, [], 1, "/proKeys", "Không cho client (server-only)",
     "Admin / Cloud Function", 1),
    (1, [0], 1, "{keyId}", "`false`", "`false`", 0),
]

# measurement fonts (base units) and render fonts (xS)
m_path  = F("mono", 20);  m_pathb = F("monob", 20)
m_note  = F("ui", 17);    m_code  = F("mono", 15)
r_path  = F("mono", 20 * S);  r_pathb = F("monob", 20 * S)
r_note  = F("ui", 17 * S);    r_code  = F("mono", 15 * S)

_ms = ImageDraw.Draw(Image.new("RGB", (8, 8)))

def toks(text):
    out = []
    for i, part in enumerate(text.split("`")):
        if not part:
            continue
        code = (i % 2 == 1)
        for w in re.split(r"(\s+)", part):
            if w:
                out.append((w, code))
    return out

def wid(t, code=False):
    return _ms.textlength(t, font=m_code if code else m_note)

def wrap(text, maxw):
    lines, cur, curw = [], [], 0.0
    for t, code in toks(text):
        w = wid(t, code)
        if cur and curw + w > maxw:
            while cur and cur[-1][0].isspace():
                cur.pop()
            lines.append(cur)
            cur, curw = [], 0.0
            if t.isspace():
                continue
        cur.append((t, code))
        curw += w
    if cur:
        lines.append(cur)
    return lines

items = []
y = HEADER_H
for (depth, guides, last, path, rd, wr, is_group) in ROWS:
    rl, wl = [], []
    for seg in rd.split("|"):
        rl += wrap(seg, READ_W - 34)
    for seg in wr.split("|"):
        wl += wrap(seg, WRITE_W - 34)
    n = max(len(rl), len(wl), 1)
    h = max(56, n * LH + PAD_T + PAD_B)
    items.append(dict(depth=depth, guides=guides, path=path, rl=rl, wl=wl,
                      group=is_group, top=y, h=h))
    y += h

LEGEND_H = 84
H = y + LEGEND_H + 20

img = Image.new("RGB", (W * S, H * S), BG)
d = ImageDraw.Draw(img)

def box(x0, y0, x1, y1, fill=None, radius=0, outline=None, ow=1):
    b = [x0 * S, y0 * S, x1 * S, y1 * S]
    if radius:
        d.rounded_rectangle(b, radius=radius * S, fill=fill, outline=outline, width=ow * S)
    else:
        d.rectangle(b, fill=fill, outline=outline, width=ow * S)

def ln(x0, y0, x1, y1, color, w=1):
    d.line([x0 * S, y0 * S, x1 * S, y1 * S], fill=color, width=max(1, int(w * S)))

def dot(cx, cy, r, color):
    d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=color)

def tx(x, y, s, font, color, anchor="la"):
    d.text((x * S, y * S), s, font=font, fill=color, anchor=anchor)

def render_runs(x, yc, line):
    cx = x
    for t, code in line:
        d.text((cx * S, yc * S), t, font=r_code if code else r_note,
               fill=CODE_C if code else INK2, anchor="lm")
        cx += wid(t, code) + (1.2 if code else 0)

# ---------- header ----------
box(CARD_X0, 22, CARD_X1, H - 22, fill=CARD, radius=18)
box(CARD_X0, 22, CARD_X1, 104, fill=HEAD_BG, radius=18)
box(CARD_X0, 70, CARD_X1, 104, fill=HEAD_BG)

tx(PATH_X, 40, "CẤU TRÚC DỮ LIỆU & PHÂN QUYỀN ĐỌC / GHI", F("uib", 34), "#FFFFFF")
tx(PATH_X, 78, "Sơ đồ cây thư mục · Firebase Realtime Database · hệ thống thi ELEC AI",
   F("ui", 19), SUB_C)

hy = 118
box(CARD_X0 + 6, hy, CARD_X1 - 6, HEADER_H - 6, fill="#F8FAFC")
tx(PATH_X, hy + 15, "ĐƯỜNG DẪN", F("uib", 15), MUTED)
dot(READ_X + 6, hy + 25, 4.5, READ_C)
tx(READ_X + 20, hy + 15, "QUYỀN ĐỌC", F("uib", 15), READ_C)
dot(WRITE_X + 6, hy + 25, 4.5, WRITE_C)
tx(WRITE_X + 20, hy + 15, "QUYỀN GHI", F("uib", 15), WRITE_C)
ln(CARD_X0 + 6, HEADER_H - 6, CARD_X1 - 6, HEADER_H - 6, LINE, 1.5)

# ---------- rows ----------
for it in items:
    top, h, depth = it["top"], it["h"], it["depth"]
    bot = top + h
    if it["group"]:
        box(CARD_X0 + 6, top + 3, CARD_X1 - 6, bot - 3, fill=GROUP_BG)
        box(CARD_X0 + 6, top + 3, CARD_X0 + 10, bot - 3, fill="#6366F1")
    ln(CARD_X0 + 6, bot, CARD_X1 - 6, bot, LINE, 1)

    mid = top + h / 2
    for i, flag in enumerate(it["guides"]):
        gx = PATH_X + i * INDENT + 9
        if flag:
            ln(gx, top, gx, bot, TREE, 1.5)
    if depth:
        ex = PATH_X + (depth - 1) * INDENT + 9
        ln(ex, top, ex, mid, TREE, 1.5)
        ln(ex, mid, ex + 15, mid, TREE, 1.5)

    txx = PATH_X + depth * INDENT + 28
    tx(txx, mid, it["path"], r_pathb if it["group"] else r_path,
       ACCENT if it["group"] else INK2, anchor="lm")

    ry = mid - (len(it["rl"]) - 1) * LH / 2
    dot(READ_X + 6, ry, 4.5, READ_C)
    for i, line in enumerate(it["rl"]):
        render_runs(READ_X + 20, ry + i * LH, line)

    wy = mid - (len(it["wl"]) - 1) * LH / 2
    dot(WRITE_X + 6, wy, 4.5, WRITE_C)
    for i, line in enumerate(it["wl"]):
        render_runs(WRITE_X + 20, wy + i * LH, line)

# ---------- legend ----------
ly = y + 20
tx(PATH_X, ly, "Chú thích", F("uib", 15), INK)
dot(PATH_X + 80, ly + 8, 4.5, READ_C)
tx(PATH_X + 92, ly, "đọc (read)", F("ui", 15), MUTED)
dot(PATH_X + 196, ly + 8, 4.5, WRITE_C)
tx(PATH_X + 208, ly, "ghi (write)", F("ui", 15), MUTED)
tx(PATH_X, ly + 26,
   "$uid = auth.uid · admin = custom claim  role: admin   ·   `false` = chặn hoàn toàn phía client",
   F("ui", 15), MUTED)
tx(PATH_X, ly + 46,
   "Ghi members / pending và cấp proKeys nên chạy qua Cloud Function thay vì client trực tiếp.",
   F("ui", 15), MUTED)

out = "D:/Tải Xuống/app/cay_thu_muc_phan_quyen.png"
img.save(out, "PNG")
print("saved", out, img.size)
