# -*- coding: utf-8 -*-
"""ERD diagram: 11 entities, FK badges and 1-N relations -> PNG."""
import math
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

# ---------- palette ----------
BG        = "#EEF1F6"
CARD      = "#FFFFFF"
INK       = "#0F172A"
INK2      = "#334155"
MUTED     = "#64748B"
FAINT     = "#94A3B8"
BORDER    = "#E2E8F0"
CONN      = "#8FA0B5"

C_DB  = "#1E3A8A"
C_EX  = "#0F766E"
C_PAY = "#9A3412"
C_REF = "#334155"

PK_BG, PK_TX = "#FEF3C7", "#92400E"
FK_BG, FK_TX = "#DBEAFE", "#1D4ED8"
UQ_BG, UQ_TX = "#E2E8F0", "#334155"
ONE_BG, ONE_TX = "#E0E7FF", "#3730A3"
MANY_BG, MANY_TX = "#FEF3C7", "#B45309"

# ---------- geometry ----------
BW, BH_HDR, RH, PADB = 380, 36, 23, 10
C = {1: 40, 2: 480, 3: 920, 4: 1360}
W = 1800

def bh(n, extra=0):
    return BH_HDR + n * RH + PADB + extra

TABLES = {
    "exams": dict(col=1, row=1, accent=C_DB, cols=[
        ("id", "uuid", ["PK"]), ("title", "varchar(200)", []),
        ("description", "text", []), ("subject", "varchar(80)", []),
        ("duration_minutes", "int", []), ("total_questions", "int", []),
        ("pass_score", "numeric(5,2)", []), ("price_credit", "int", []),
        ("status", "enum", []), ("created_by", "uuid", ["FK"]),
        ("created_at", "timestamptz", []),
    ]),
    "questions": dict(col=2, row=1, accent=C_DB, cols=[
        ("id", "uuid", ["PK"]), ("exam_id", "uuid", ["FK"]),
        ("content", "text", []), ("type", "enum", []),
        ("difficulty", "enum", []), ("points", "numeric(5,2)", []),
        ("order_index", "int", []), ("created_at", "timestamptz", []),
    ]),
    "answers": dict(col=3, row=1, accent=C_DB, cols=[
        ("id", "uuid", ["PK"]), ("question_id", "uuid", ["FK"]),
        ("content", "text", []), ("is_correct", "bool", []),
        ("order_index", "int", []), ("created_at", "timestamptz", []),
    ]),
    "exam_attempts": dict(col=1, row=2, accent=C_EX, cols=[
        ("id", "uuid", ["PK"]), ("exam_id", "uuid", ["FK"]),
        ("user_id", "uuid", ["FK"]), ("started_at", "timestamptz", []),
        ("submitted_at", "timestamptz", []), ("duration_seconds", "int", []),
        ("score", "numeric(5,2)", []), ("status", "enum", []),
        ("created_at", "timestamptz", []),
    ]),
    "user_answers": dict(col=2, row=2, accent=C_EX, cols=[
        ("id", "uuid", ["PK"]), ("attempt_id", "uuid", ["FK"]),
        ("question_id", "uuid", ["FK"]), ("answer_id", "uuid", ["FK"]),
        ("is_correct", "bool", []), ("time_spent_seconds", "int", []),
        ("answered_at", "timestamptz", []),
    ]),
    "saved_questions": dict(col=3, row=2, accent=C_EX, cols=[
        ("id", "uuid", ["PK"]), ("user_id", "uuid", ["FK"]),
        ("question_id", "uuid", ["FK"]), ("note", "varchar(200)", []),
        ("created_at", "timestamptz", []),
    ]),
    "wrong_questions": dict(col=4, row=2, accent=C_EX, cols=[
        ("id", "uuid", ["PK"]), ("user_id", "uuid", ["FK"]),
        ("question_id", "uuid", ["FK"]), ("attempt_id", "uuid", ["FK"]),
        ("wrong_count", "int", []), ("resolved", "bool", []),
        ("last_wrong_at", "timestamptz", []),
    ]),
    "ai_chats": dict(col=1, row=3, accent=C_EX, cols=[
        ("id", "uuid", ["PK"]), ("user_id", "uuid", ["FK"]),
        ("attempt_id", "uuid", ["FK"]), ("question_id", "uuid", ["FK"]),
        ("role", "enum", []), ("message", "text", []), ("tokens", "int", []),
        ("model", "varchar(60)", []), ("created_at", "timestamptz", []),
    ]),
    "user_credits": dict(col=2, row=3, accent=C_PAY, cols=[
        ("id", "uuid", ["PK"]), ("user_id", "uuid", ["FK", "UQ"]),
        ("balance", "int", []), ("lifetime_used", "int", []),
        ("lifetime_topup", "int", []), ("updated_at", "timestamptz", []),
    ]),
    "credit_transactions": dict(col=3, row=3, accent=C_PAY, cols=[
        ("id", "uuid", ["PK"]), ("credit_id", "uuid", ["FK"]),
        ("user_id", "uuid", ["FK"]), ("order_id", "uuid", ["FK"]),
        ("amount", "int", []), ("type", "enum", []),
        ("balance_after", "int", []), ("note", "varchar(200)", []),
        ("created_at", "timestamptz", []),
    ]),
    "payment_orders": dict(col=4, row=3, accent=C_PAY, cols=[
        ("id", "uuid", ["PK"]), ("user_id", "uuid", ["FK"]),
        ("order_code", "varchar(40)", ["UQ"]), ("package_code", "varchar(40)", []),
        ("credits", "int", []), ("amount", "numeric(12,2)", []),
        ("currency", "char(3)", []), ("provider", "enum", []),
        ("status", "enum", []), ("paid_at", "timestamptz", []),
        ("created_at", "timestamptz", []),
    ]),
    "users": dict(col=2, row=4, accent=C_REF, dashed=True, cols=[
        ("id", "uuid", ["PK"]), ("email", "varchar(120)", []),
    ]),
}

ROW_Y = {1: 200, 2: 599, 3: 952, 4: 1311}
for name, t in TABLES.items():
    t["x"] = C[t["col"]]
    t["y"] = ROW_Y[t["row"]]
    t["w"] = BW
    t["h"] = bh(len(t["cols"]), 26 if t.get("dashed") else 0)
    t["name"] = name

def X(n, right=True):
    t = TABLES[n]
    return t["x"] + t["w"] if right else t["x"]

def Y(n, frac=0.5):
    t = TABLES[n]
    return t["y"] + t["h"] * frac

def B(n):
    t = TABLES[n]
    return t["y"] + t["h"]

RP_Y = 1470
H = 1830

img = Image.new("RGB", (W * S, H * S), BG)
d = ImageDraw.Draw(img)

def rrect(x0, y0, x1, y1, fill=None, outline=None, w=1, r=8):
    d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], radius=int(r * S),
                        fill=fill, outline=outline, width=max(1, int(w * S)))

def line(p1, p2, color=CONN, w=1.6, casing=True):
    if casing:
        d.line([p1[0] * S, p1[1] * S, p2[0] * S, p2[1] * S], fill="#FFFFFF",
               width=max(1, int((w + 4) * S)))
    d.line([p1[0] * S, p1[1] * S, p2[0] * S, p2[1] * S], fill=color,
           width=max(1, int(w * S)))

def dashed(p1, p2, color=CONN, w=1.6, dash=9, gap=7):
    (x1, y1), (x2, y2) = p1, p2
    L = math.hypot(x2 - x1, y2 - y1)
    if not L:
        return
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    t = 0.0
    while t < L:
        e = min(t + dash, L)
        line((x1 + ux * t, y1 + uy * t), (x1 + ux * e, y1 + uy * e), color, w,
             casing=False)
        t = e + gap

def text(x, y, s, font, color, anchor="lm"):
    d.text((x * S, y * S), s, font=font, fill=color, anchor=anchor)

def pill(cx, cy, label, bg, fg, fw=22, fh=15, fs=10):
    rrect(cx - fw / 2, cy - fh / 2, cx + fw / 2, cy + fh / 2, fill=bg, r=fh / 2)
    text(cx, cy + 0.6, label, F("uib", fs), fg, anchor="mm")

BADGE_STYLE = {"PK": (PK_BG, PK_TX), "FK": (FK_BG, FK_TX), "UQ": (UQ_BG, UQ_TX)}

# ---------- card + header ----------
rrect(20, 20, W - 20, H - 20, fill=CARD, r=16)
rrect(20, 20, W - 20, 118, fill="#0F172A", r=16)
rrect(20, 80, W - 20, 118, fill="#0F172A", r=0)
text(56, 52, "SƠ ĐỒ THỰC THỂ – QUAN HỆ (ERD)", F("uib", 32), "#FFFFFF")
text(56, 90, "11 thực thể · khóa ngoại & quan hệ một – nhiều · PostgreSQL",
     F("ui", 18), FAINT)

for ylab, txt in [(172, "① NGÂN HÀNG ĐỀ"), (571, "② LÀM BÀI & THEO DÕI"),
                  (924, "③ TÍN DỤNG & THANH TOÁN"), (1283, "④ THAM CHIẾU")]:
    text(40, ylab, txt, F("uib", 12.5), MUTED)

# ---------- connectors ----------
BADGES = []

def connect(pts, a="1", b="N", color=CONN, dash=False, a_style=ONE_BG,
            a_tx=ONE_TX, b_style=MANY_BG, b_tx=MANY_TX):
    for i in range(len(pts) - 1):
        if dash:
            dashed(pts[i], pts[i + 1], color)
        else:
            line(pts[i], pts[i + 1], color)
    def inside(p, q, dist):
        dx, dy = q[0] - p[0], q[1] - p[1]
        L = math.hypot(dx, dy) or 1
        return (p[0] + dx / L * dist, p[1] + dy / L * dist)
    BADGES.append((inside(pts[0], pts[1], 11), a, a_style, a_tx))
    BADGES.append((inside(pts[-1], pts[-2], 11), b, b_style, b_tx))

connect([(X("exams"), 300), (X("questions", False), 300)])
connect([(X("questions"), 320), (X("answers", False), 320)])
connect([(230, B("exams")), (230, TABLES["exam_attempts"]["y"])])
connect([(X("exam_attempts"), 700), (X("user_answers", False), 700)])
connect([(600, B("questions")), (600, TABLES["user_answers"]["y"])])
connect([(1000, B("answers")), (1000, 580), (820, 580),
         (820, TABLES["user_answers"]["y"])])
connect([(620, B("questions")), (620, 555), (900, 555), (900, 640),
         (X("saved_questions", False), 640)])
connect([(700, B("questions")), (700, 515), (1340, 515), (1340, 700),
         (X("wrong_questions", False), 700)])
connect([(230, B("exam_attempts")), (230, TABLES["ai_chats"]["y"])])
connect([(X("user_credits"), 1020), (X("credit_transactions", False), 1020)])
connect([(X("payment_orders", False), 1020), (X("credit_transactions"), 1020)])
connect([(670, B("user_credits")), (670, TABLES["users"]["y"])], a="1", b="1",
        color=FAINT, dash=True)

# 1-1 label with white backing
lby = (B("user_credits") + TABLES["users"]["y"]) / 2
d.rectangle([688 * S, (lby - 12) * S, 906 * S, (lby + 12) * S], fill=CARD)
text(696, lby, "1 — 1  (user_id UNIQUE)", F("uib", 12.5), C_REF)

# ---------- tables ----------
for name, t in TABLES.items():
    x, y, w, h, acc = t["x"], t["y"], t["w"], t["h"], t["accent"]
    if t.get("dashed"):
        rrect(x, y, x + w, y + h, fill="#F8FAFC", outline=None, r=10)
        # dashed border
        for p1, p2 in [((x, y), (x + w, y)), ((x + w, y), (x + w, y + h)),
                       ((x + w, y + h), (x, y + h)), ((x, y + h), (x, y))]:
            dashed(p1, p2, FAINT, 1.6, 8, 6)
        rrect(x, y, x + w, y + BH_HDR, fill="#EEF1F6", r=10)
        rrect(x, y + BH_HDR - 12, x + w, y + BH_HDR, fill="#EEF1F6", r=0)
    else:
        rrect(x, y, x + w, y + h, fill="#FFFFFF", outline=BORDER, w=1.4, r=10)
        rrect(x, y, x + w, y + BH_HDR, fill=acc, r=10)
        rrect(x, y + BH_HDR - 10, x + w, y + BH_HDR, fill=acc, r=0)

    text(x + 14, y + BH_HDR / 2, name, F("monob", 16),
         MUTED if t.get("dashed") else "#FFFFFF")
    if t.get("dashed"):
        text(x + w - 14, y + BH_HDR / 2, "ngoài phạm vi", F("ui", 11), FAINT, anchor="rm")

    ry = y + BH_HDR
    for i, (cn, ct, badges) in enumerate(t["cols"]):
        cy = ry + RH / 2 + i * RH
        if i % 2 == 1:
            d.rectangle([(x + 2) * S, (ry + i * RH) * S, (x + w - 2) * S,
                         (ry + (i + 1) * RH) * S], fill="#FAFBFD")
        if badges:
            d.line([(x + 2) * S, cy * S, (x + 78) * S, cy * S], fill="#F1F5F9",
                   width=1 * S)
        for j, b in enumerate(badges):
            bg, fg = BADGE_STYLE[b]
            pill(x + 21 + j * 25, cy, b, bg, fg, fw=22, fh=14, fs=9)
        text(x + 88, cy, cn, F("mono", 13.5),
             INK if "PK" in badges else INK2)
        text(x + w - 12, cy, ct, F("ui", 11.5), MUTED, anchor="rm")

    if t.get("dashed"):
        text(x + 14, y + BH_HDR + 2 * RH + 15,
             "user_id / created_by → users.id  (8 FK)", F("ui", 11), FAINT)

# ---------- badges on top ----------
for (cx, cy), label, bg, fg in BADGES:
    pill(cx, cy, label, bg, fg, fw=18, fh=18, fs=11)

# ---------- relation panel ----------
rrect(40, RP_Y, W - 40, RP_Y + 258, fill="#F8FAFC", outline=BORDER, w=1.2, r=12)
text(68, RP_Y + 26,
     "DANH SÁCH QUAN HỆ MỘT – NHIỀU  ·  khớp với đường nối trong sơ đồ",
     F("uib", 14), INK)

def rel_row(x, y, i, parent, child, fk, one_to_one=False):
    text(x, y + 1, f"{i:02d}", F("monob", 11.5), FAINT)
    text(x + 28, y, parent, F("mono", 13), INK2)
    pill(x + 200, y, "1", ONE_BG, ONE_TX, fw=18, fh=18, fs=11)
    line((x + 212, y), (x + 250, y), CONN, 1.5, casing=False)
    if one_to_one:
        text(x + 231, y - 12, "1—1", F("uib", 10), ONE_TX, anchor="mm")
        pill(x + 262, y, "1", ONE_BG, ONE_TX, fw=18, fh=18, fs=11)
    else:
        pill(x + 262, y, "N", MANY_BG, MANY_TX, fw=18, fh=18, fs=11)
    text(x + 280, y, child, F("mono", 13), INK2)
    text(x + 466, y, fk, F("mono", 11.5), FAINT)

REL = [
    ("exams", "questions", "exam_id"),
    ("questions", "answers", "question_id"),
    ("exams", "exam_attempts", "exam_id"),
    ("exam_attempts", "user_answers", "attempt_id"),
    ("questions", "user_answers", "question_id"),
    ("answers", "user_answers", "answer_id"),
    ("questions", "saved_questions", "question_id"),
    ("questions", "wrong_questions", "question_id"),
    ("exam_attempts", "ai_chats", "attempt_id"),
    ("user_credits", "credit_transactions", "credit_id"),
    ("payment_orders", "credit_transactions", "order_id"),
]
for i, (p, c, fk) in enumerate(REL):
    col, row = (0, i) if i < 6 else (1, i - 6)
    rel_row(68 + col * 880, RP_Y + 68 + row * 27, i + 1, p, c, fk)
rel_row(68 + 880, RP_Y + 68 + 5 * 27, 12, "users", "user_credits",
        "user_id (UNIQUE)", one_to_one=True)

# ---------- legend ----------
LY = RP_Y + 284
text(68, LY, "Chú thích", F("uib", 13), INK)
pill(150, LY, "PK", PK_BG, PK_TX, fw=22, fh=14, fs=9)
text(166, LY, "khóa chính", F("ui", 12), MUTED)
pill(256, LY, "FK", FK_BG, FK_TX, fw=22, fh=14, fs=9)
text(272, LY, "khóa ngoại — đích ghi ở bảng quan hệ", F("ui", 12), MUTED)
pill(486, LY, "UQ", UQ_BG, UQ_TX, fw=22, fh=14, fs=9)
text(502, LY, "unique", F("ui", 12), MUTED)
pill(576, LY, "1", ONE_BG, ONE_TX, fw=18, fh=18, fs=11)
text(592, LY, "phía một", F("ui", 12), MUTED)
pill(676, LY, "N", MANY_BG, MANY_TX, fw=18, fh=18, fs=11)
text(692, LY, "phía nhiều", F("ui", 12), MUTED)
text(68, LY + 26,
     "FK không vẽ đường (cùng đích users): exam_attempts, user_answers, wrong_questions, "
     "saved_questions, ai_chats, credit_transactions, payment_orders (user_id) · "
     "exams.created_by · credit_transactions.user_id → credit_transactions.ref_type/ref_id "
     "phân biệt nguồn (order | attempt).",
     F("ui", 11.5), FAINT)

out = "D:/Tải Xuống/app/erd_thuc_the_quan_he.png"
img.save(out, "PNG")
print("saved", out, img.size)
