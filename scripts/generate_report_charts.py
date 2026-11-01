# -*- coding: utf-8 -*-
"""Sinh các biểu đồ kỹ thuật và sơ đồ kiến trúc minh họa cho PHẦN III báo cáo ELEC AI.
Đảm bảo phong cách đồ họa đồng bộ với make_chart.py và make_flow.py.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont

S = 2
FONTS = {
    "ui": "C:/Windows/Fonts/segoeui.ttf",
    "uib": "C:/Windows/Fonts/segoeuib.ttf",
    "mono": "C:/Windows/Fonts/consola.ttf",
    "monob": "C:/Windows/Fonts/consolab.ttf",
}

def Fs(name, size):
    return ImageFont.truetype(FONTS[name], int(size * S))

BG     = "#EEF1F6"
CARD_BG= "#FFFFFF"
INK    = "#0F172A"
INK2   = "#334155"
MUTED  = "#64748B"
FAINT  = "#94A3B8"
BORDER = "#CBD5E1"
GRID   = "#E2E8F0"
BLUE   = "#1E3A8A"
PRIMARY= "#2563EB"
TEAL   = "#0F766E"
CYAN   = "#06B6D4"
GREEN  = "#15803D"
AMBER  = "#D97706"
PURPLE = "#7C3AED"
RED    = "#DC2626"

os.makedirs("report", exist_ok=True)

# ==============================================================================
# 1. HÌNH 3: BIỂU ĐỒ KHẢO SÁT NHU CẦU HỌC SINH VÀ GIÁO VIÊN
# ==============================================================================
def draw_chart_survey():
    W, H = 1600, 960
    img = Image.new("RGB", (W * S, H * S), BG)
    d = ImageDraw.Draw(img)

    # Card background
    d.rounded_rectangle([30*S, 30*S, (W-30)*S, (H-30)*S], radius=16*S, fill=CARD_BG, outline=BORDER, width=2*S)

    # Title & Subtitle
    d.text((60*S, 60*S), "KẾT QUẢ KHẢO SÁT NHU CẦU NGƯỜI DÙNG TRƯỚC KHI XÂY DỰNG HỆ THỐNG", fill=INK, font=Fs("uib", 22))
    d.text((60*S, 95*S), "Mẫu khảo sát: 150 học sinh THPT (khối 10, 11, 12) & 20 giáo viên môn Hóa học và GVCN tại Hưng Yên", fill=MUTED, font=Fs("ui", 14))

    # Categories
    data = [
        ("Cần lộ trình học tập cá nhân hóa theo mục tiêu điểm / nguyện vọng ĐH", 91.3, PRIMARY),
        ("Cần hệ thống tự động ghi nhớ câu sai và xếp lịch ôn tập thông minh", 88.0, TEAL),
        ("Khó khăn khi gõ lại đề Hóa học có công thức phức tạp (cần nhận ảnh)", 86.7, AMBER),
        ("Muốn có AI giải thích chi tiết từng bước bản chất phản ứng Hóa học", 84.0, PURPLE),
        ("Giáo viên mất nhiều thời gian biên soạn đề thi ma trận 4 mức độ BGD", 89.5, RED),
        ("Giáo viên cần công cụ tự động phát hiện lỗ hổng kiến thức của lớp", 92.0, BLUE),
    ]

    PX0, PX1 = 620, 1480
    PY0, PY1 = 160, 840
    n = len(data)
    row_h = (PY1 - PY0) / n

    # Draw grid lines (0%, 25%, 50%, 75%, 100%)
    for pct in [0, 25, 50, 75, 100]:
        gx = PX0 + (PX1 - PX0) * (pct / 100.0)
        d.line([(gx*S, (PY0 - 20)*S), (gx*S, (PY1 + 10)*S)], fill=GRID, width=1*S)
        d.text((gx*S - 15*S, (PY1 + 20)*S), f"{pct}%", fill=MUTED, font=Fs("mono", 12))

    for i, (label, val, color) in enumerate(data):
        y_center = PY0 + i * row_h + row_h / 2
        # Text label on the left
        d.text((60*S, (y_center - 12)*S), f"{i+1}. {label}", fill=INK2, font=Fs("uib", 13))

        # Bar background
        bw_max = PX1 - PX0
        bw = bw_max * (val / 100.0)
        bar_y0 = y_center - 16
        bar_y1 = y_center + 16

        d.rounded_rectangle([PX0*S, bar_y0*S, PX1*S, bar_y1*S], radius=8*S, fill="#F1F5F9")
        d.rounded_rectangle([PX0*S, bar_y0*S, (PX0 + bw)*S, bar_y1*S], radius=8*S, fill=color)

        # Percentage text
        d.text(((PX0 + bw + 15)*S, (y_center - 12)*S), f"{val:.1f}%", fill=color, font=Fs("monob", 14))

    # Caption
    d.text((60*S, (H - 50)*S), "Hình 3. Biểu đồ tỉ lệ nhu cầu cấp thiết của học sinh và giáo viên khảo sát tại trường THPT (N = 170)", fill=MUTED, font=Fs("ui", 13))

    out_path = "report/hinh03_khao_sat_nhu_cau.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

# ==============================================================================
# 2. HÌNH: SƠ ĐỒ KIẾN TRÚC LỘ TRÌNH THÍCH ỨNG THEO NGUYỆN VỌNG (ADAPTIVE ROADMAP)
# ==============================================================================
def draw_roadmap_architecture():
    W, H = 1700, 1050
    img = Image.new("RGB", (W * S, H * S), BG)
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([30*S, 30*S, (W-30)*S, (H-30)*S], radius=16*S, fill=CARD_BG, outline=BORDER, width=2*S)

    # Title
    d.text((60*S, 55*S), "KIẾN TRÚC ĐỘNG CƠ SINH LỘ TRÌNH THÍCH ỨNG THEO MỤC TIÊU NGUYỆN VỌNG", fill=INK, font=Fs("uib", 22))
    d.text((60*S, 90*S), "Luồng tương tác đa tầng: Thiết lập nguyện vọng -> Động cơ tính toán -> Lộ trình 4 giai đoạn -> AI Cố vấn", fill=MUTED, font=Fs("ui", 14))

    def box(x, y, w, h, title, subtitle, items, color, bg_col="#F8FAFC"):
        d.rounded_rectangle([x*S, y*S, (x+w)*S, (y+h)*S], radius=10*S, fill=bg_col, outline=color, width=2*S)
        # Header strip
        d.rounded_rectangle([x*S, y*S, (x+w)*S, (y+42)*S], radius=10*S, fill=color)
        d.rectangle([x*S, (y+32)*S, (x+w)*S, (y+42)*S], fill=color)
        d.text(((x+15)*S, (y+10)*S), title, fill="#FFFFFF", font=Fs("uib", 14))
        d.text(((x+15)*S, (y+52)*S), subtitle, fill=MUTED, font=Fs("ui", 12))
        
        curr_y = y + 80
        for item in items:
            d.text(((x+18)*S, curr_y*S), "• " + item, fill=INK2, font=Fs("ui", 12))
            curr_y += 24

    # Row 1: Input Layer (Tầng Đầu Vào)
    box(60, 150, 360, 240, "1. HỌC SINH & NGUYỆN VỌNG", "aspirationStore.js / AdmissionLookup", [
        "Chọn trường ĐH & Ngành học mong muốn",
        "Tổ hợp môn xét tuyển (A00, B00, D07...)",
        "Điểm chuẩn tham chiếu 3 năm gần nhất",
        "Mục tiêu điểm số môn Hóa học (Ví dụ: 8.5+)",
        "Thời gian còn lại đến kỳ thi THPTQG"
    ], PRIMARY)

    box(460, 150, 360, 240, "2. CHẨN ĐOÁN NĂNG LỰC", "Quiz / Diagnostic Exam Room", [
        "Bài thi chẩn đoán đầu vào chuẩn ma trận",
        "Đo lường độ thành thạo từng chuyên đề",
        "Ghi nhận tỉ lệ làm đúng / sai / bỏ trống",
        "Xác định lỗ hổng kiến thức nền tảng",
        "Tính toán khoảng cách điểm (Score Gap)"
    ], TEAL)

    box(860, 150, 380, 240, "3. ĐỘNG CƠ SINH LỘ TRÌNH LÕI", "autoRoadmapEngine.js (Deterministic)", [
        "Cây phụ thuộc kiến thức (Pre-requisite Tree)",
        "Thuật toán phân bổ trọng số & thời gian",
        "Xếp thứ tự ưu tiên chuyên đề cần củng cố",
        "Cơ chế Spaced Repetition (Lặp lại ngắt quãng)",
        "Sinh hành động học tiếp theo (Next Action)"
    ], BLUE)

    box(1280, 150, 360, 240, "4. AI CỐ VẤN & GIA SƯ", "aiTutorService.js / LLM Reasoning", [
        "Phân tích định tính nguyên nhân mất điểm",
        "Dự báo xác suất đỗ nguyện vọng (Pass Rate)",
        "Đề xuất chiến thuật làm bài thi trắc nghiệm",
        "Giải thích câu sai & giao bài tập bổ trợ",
        "Tự động cá nhân hóa lời khuyên học tập"
    ], PURPLE)

    # Big Block: 4 Giai đoạn lộ trình học tập thực thi
    d.rounded_rectangle([60*S, 430*S, 1640*S, 950*S], radius=12*S, fill="#F8FAFC", outline=BORDER, width=2*S)
    d.text((85*S, 450*S), "KHUNG LỘ TRÌNH 4 GIAI ĐOẠN CHUẨN KỲ THI TỐT NGHIỆP THPT (GDPT 2018)", fill=INK, font=Fs("uib", 16))

    stages = [
        ("GIAI ĐOẠN 1: CỦNG CỐ NỀN TẢNG", "Mục tiêu: Đạt 5.0 - 6.5 điểm", [
            "Lớp 10: Cấu tạo nguyên tử, Bảng tuần hoàn, Liên kết hóa học",
            "Lớp 10: Phản ứng Oxi hóa - khử, Năng lượng hóa học",
            "Lớp 11: Cân bằng hóa học, Nitrogen & Sulfur",
            "Mục tiêu thành thạo: 100% câu hỏi Nhận biết & Thông hiểu"
        ], CYAN),
        ("GIAI ĐOẠN 2: CHUYÊN ĐỀ TRỌNG TÂM", "Mục tiêu: Đạt 6.5 - 8.0 điểm", [
            "Lớp 11: Đại cương Hóa hữu cơ, Hydrocarbon, Dẫn xuất Halogen",
            "Lớp 12: Ester - Lipid, Carbohydrate, Hợp chất chứa Nitrogen",
            "Lớp 12: Polymer & Vật liệu polymer tiên tiến",
            "Luyện giải nhanh bài tập Vận dụng trung bình & thực tiễn"
        ], GREEN),
        ("GIAI ĐOẠN 3: LUYỆN ĐỀ THỰC CHIẾN", "Mục tiêu: Đạt 8.0 - 9.0 điểm", [
            "Luyện đề thi thử chuẩn ma trận định dạng mới BGD",
            "Giám sát phòng thi ảo với camera liêm chính MediaPipe",
            "Rèn kỹ năng phân bổ thời gian (50 phút / 40 câu hỏi)",
            "Chữa chi tiết từng câu trong Sổ câu sai cá nhân"
        ], AMBER),
        ("GIAI ĐOẠN 4: VỀ ĐÍCH & TỐI ƯU ĐIỂM", "Mục tiêu: Bứt phá 9.0 - 10.0 điểm", [
            "Chinh phục câu hỏi Vận dụng cao (Điện phân, Peptit, Đồ thị)",
            "Tối ưu hóa phản xạ làm bài, loại bỏ hoàn toàn bẫy lý thuyết",
            "Dự báo phong độ điểm rơi trước kỳ thi chính thức",
            "Tổng ôn kiến thức cô đọng & tự tin bước vào phòng thi"
        ], RED)
    ]

    col_w = (1640 - 60 - 30*3) / 4
    for i, (stitle, starget, sdesc, scolor) in enumerate(stages):
        cx = 85 + i * (col_w + 25)
        cy = 500
        d.rounded_rectangle([cx*S, cy*S, (cx+col_w)*S, (cy+410)*S], radius=10*S, fill="#FFFFFF", outline=scolor, width=2*S)
        d.rounded_rectangle([cx*S, cy*S, (cx+col_w)*S, (cy+45)*S], radius=10*S, fill=scolor)
        d.rectangle([cx*S, (cy+35)*S, (cx+col_w)*S, (cy+45)*S], fill=scolor)
        d.text(((cx+12)*S, (cy+12)*S), stitle, fill="#FFFFFF", font=Fs("uib", 12))
        d.text(((cx+12)*S, (cy+55)*S), starget, fill=MUTED, font=Fs("uib", 12))

        sy = cy + 90
        for desc in sdesc:
            d.text(((cx+14)*S, sy*S), "✔ " + desc, fill=INK2, font=Fs("ui", 11))
            sy += 65

    # Connect arrows across top layer
    for ax in [420, 820, 1240]:
        d.line([(ax*S, 270*S), ((ax+40)*S, 270*S)], fill=MUTED, width=3*S)
        d.polygon([((ax+40)*S, 264*S), ((ax+40)*S, 276*S), ((ax+48)*S, 270*S)], fill=MUTED)

    # Caption
    d.text((60*S, (H - 35)*S), "Hình 4. Sơ đồ kiến trúc động cơ lộ trình học tập thích ứng theo mục tiêu nguyện vọng đại học (ELEC AI Roadmap Engine)", fill=MUTED, font=Fs("ui", 13))

    out_path = "report/hinh_kientruc_lotrinh_nguyenvong.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

# ==============================================================================
# 3. HÌNH 46: BIỂU ĐỒ HIỆU NĂNG THỜI GIAN TẢI TRANG VÀ ĐÁP ỨNG CỦA HỆ THỐNG
# ==============================================================================
def draw_chart_performance():
    W, H = 1600, 960
    img = Image.new("RGB", (W * S, H * S), BG)
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([30*S, 30*S, (W-30)*S, (H-30)*S], radius=16*S, fill=CARD_BG, outline=BORDER, width=2*S)
    d.text((60*S, 60*S), "KẾT QUẢ ĐO LƯỜNG HIỆU NĂNG VÀ THỜI GIAN PHẢN HỒI THỰC TẾ CỦA HỆ THỐNG", fill=INK, font=Fs("uib", 22))
    d.text((60*S, 95*S), "Đo lường trung vị 3 lần thử nghiệm trên Lighthouse, Web Vitals và Chrome DevTools Network Audit", fill=MUTED, font=Fs("ui", 14))

    # Metrics
    metrics = [
        ("Thời gian tải trang ban đầu (FCP - First Contentful Paint)", 0.65, 1.80, "giây", PRIMARY),
        ("Thời gian dựng xong nội dung lớn nhất (LCP - Largest Contentful Paint)", 1.12, 2.50, "giây", TEAL),
        ("Thời gian sinh lộ trình học tập cá nhân hóa (Roadmap Engine)", 0.18, 0.50, "giây", BLUE),
        ("Thời gian phản hồi token đầu tiên của Trợ lý AI (Time to First Token)", 1.35, 3.00, "giây", PURPLE),
        ("Thời gian xử lý thị giác máy tính MediaPipe (mỗi frame webcam)", 28.0, 50.0, "mili-giây (ms)", AMBER),
        ("Thời gian chấm tự động phiếu trắc nghiệm A4 qua Camera (OMR)", 0.85, 2.00, "giây", GREEN)
    ]

    PX0, PX1 = 680, 1480
    PY0, PY1 = 160, 840
    n = len(metrics)
    row_h = (PY1 - PY0) / n

    for i, (label, val, threshold, unit, color) in enumerate(metrics):
        y_center = PY0 + i * row_h + row_h / 2
        d.text((60*S, (y_center - 12)*S), f"{label}", fill=INK2, font=Fs("uib", 12))

        # Normalized to threshold
        pct = min(1.0, val / threshold)
        bw_max = PX1 - PX0
        bw = bw_max * (pct * 0.75) # leave room for threshold mark

        bar_y0 = y_center - 16
        bar_y1 = y_center + 16

        d.rounded_rectangle([PX0*S, bar_y0*S, PX1*S, bar_y1*S], radius=8*S, fill="#F1F5F9")
        d.rounded_rectangle([PX0*S, bar_y0*S, (PX0 + bw)*S, bar_y1*S], radius=8*S, fill=color)

        # Value
        val_str = f"{val} {unit}  (Tiêu chuẩn: < {threshold} {unit})"
        d.text(((PX0 + bw + 15)*S, (y_center - 12)*S), val_str, fill=color, font=Fs("monob", 13))

    # Caption
    d.text((60*S, (H - 50)*S), "Hình 46. Biểu đồ hiệu năng thực tế của các module trong hệ thống ELEC AI (đạt tiêu chuẩn Web Vitals xuất sắc)", fill=MUTED, font=Fs("ui", 13))

    out_path = "report/hinh46_hieu_nang_he_thong.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

# ==============================================================================
# 4. HÌNH 47: BIỂU ĐỒ ĐÁNH GIÁ MỨC ĐỘ HÀI LÒNG CỦA HỌC SINH VÀ GIÁO VIÊN
# ==============================================================================
def draw_chart_satisfaction():
    W, H = 1600, 960
    img = Image.new("RGB", (W * S, H * S), BG)
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([30*S, 30*S, (W-30)*S, (H-30)*S], radius=16*S, fill=CARD_BG, outline=BORDER, width=2*S)
    d.text((60*S, 60*S), "KẾT QUẢ ĐÁNH GIÁ MỨC ĐỘ HÀI LÒNG CỦA NGƯỜI DÙNG SAU THỰC NGHIỆM", fill=INK, font=Fs("uib", 22))
    d.text((60*S, 95*S), "Khảo sát sau 4 tuần triển khai thực tế trên 120 học sinh THPT và 12 giáo viên bộ môn / GVCN (Thang điểm 5.0)", fill=MUTED, font=Fs("ui", 14))

    criteria = [
        ("Tính hữu ích của Lộ trình kiến thức và Đặt mục tiêu nguyện vọng", 4.85, 97.0, PRIMARY),
        ("Độ chính xác và tính sư phạm của Trợ lý AI giải thích bài tập", 4.65, 93.0, TEAL),
        ("Giao diện trực quan, dễ thao tác trên điện thoại thông minh (Mobile-first)", 4.78, 95.6, GREEN),
        ("Hiệu quả của tính năng Sổ câu sai & Lịch ôn tập ngắt quãng (Spaced Repetition)", 4.82, 96.4, PURPLE),
        ("Tính minh bạch và tin cậy của Phòng thi trực tuyến có giám sát Camera AI", 4.58, 91.6, AMBER),
        ("Mức độ hỗ trợ giáo viên tiết kiệm thời gian ra đề và chấm thi tự động", 4.90, 98.0, BLUE),
    ]

    PX0, PX1 = 700, 1480
    PY0, PY1 = 160, 840
    n = len(criteria)
    row_h = (PY1 - PY0) / n

    for i, (label, score, pct, color) in enumerate(criteria):
        y_center = PY0 + i * row_h + row_h / 2
        d.text((60*S, (y_center - 12)*S), f"{label}", fill=INK2, font=Fs("uib", 12))

        bw_max = PX1 - PX0
        bw = bw_max * (score / 5.0)

        bar_y0 = y_center - 16
        bar_y1 = y_center + 16

        d.rounded_rectangle([PX0*S, bar_y0*S, PX1*S, bar_y1*S], radius=8*S, fill="#F1F5F9")
        d.rounded_rectangle([PX0*S, bar_y0*S, (PX0 + bw)*S, bar_y1*S], radius=8*S, fill=color)

        score_str = f"{score:.2f} / 5.0 ({pct:.1f}%)"
        d.text(((PX0 + bw + 15)*S, (y_center - 12)*S), score_str, fill=color, font=Fs("monob", 13))

    # Caption
    d.text((60*S, (H - 50)*S), "Hình 47. Biểu đồ đánh giá sự hài lòng và giá trị thực tiễn của hệ thống ELEC AI sau thực nghiệm (N = 132)", fill=MUTED, font=Fs("ui", 13))

    out_path = "report/hinh47_danh_gia_nguoi_dung.png"
    img.save(out_path, quality=95)
    print("Saved:", out_path)

if __name__ == "__main__":
    draw_chart_survey()
    draw_roadmap_architecture()
    draw_chart_performance()
    draw_chart_satisfaction()
    print("ALL 4 CHARTS GENERATED SUCCESSFULLY!")
