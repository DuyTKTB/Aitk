# -*- coding: utf-8 -*-
"""
Tạo tệp Word (.docx) Kế hoạch nghiên cứu dự án KHKT ELEC AI
Thể thức chuẩn hành chính theo Nghị định 30/2020/NĐ-CP & Thông tư 84/2026/TT-BGDĐT
Nguyễn Thế Duy phụ trách Lập trình chính & Kiến trúc hệ thống
Nguyễn Bùi Nguyệt Minh phụ trách Nội dung liên môn KHTN, Khảo sát & Truyền thông
Dự án mở rộng đa môn Khoa học Tự nhiên: Vật lý, Hóa học, Sinh học.
Không sử dụng icon/emoji trong văn bản hành chính.
"""

import os
import sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = Document()
    
    # 1. Cấu hình trang A4 chuẩn thể thức văn bản
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(2.0)
    sec.bottom_margin = Cm(2.0)
    sec.left_margin = Cm(2.0)
    sec.right_margin = Cm(1.5)
    
    FONT_NAME = 'Times New Roman'
    
    # Helper format font
    def format_run(run, font_name=FONT_NAME, size_pt=11, bold=False, italic=False, color_rgb=(0,0,0)):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb)
        rPr = run._element.get_or_add_rPr()
        rFonts = rPr.find(qn('w:rFonts'))
        if rFonts is None:
            rFonts = OxmlElement('w:rFonts')
            rPr.append(rFonts)
        for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
            rFonts.set(qn(attr), font_name)

    # Helper tô màu nền ô
    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    # Helper padding ô
    def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin_name, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin_name}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Helper viền bảng chuẩn công văn
    def set_table_borders(table, hex_color="333333"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="{hex_color}"/>'
            f'  <w:left w:val="single" w:sz="6" w:space="0" w:color="{hex_color}"/>'
            f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{hex_color}"/>'
            f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="{hex_color}"/>'
            f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{hex_color}"/>'
            f'  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{hex_color}"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    # Helper cantSplit & tblHeader
    def set_row_cant_split(row):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

    def set_row_header(row):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

    # Helper độ rộng cột
    def set_col_widths(row, widths_cm):
        for idx, width in enumerate(widths_cm):
            row.cells[idx].width = Cm(width)

    # --- PHẦN 1: QUỐC HIỆU & ĐƠN VỊ (Bảng 2 cột chuẩn văn bản hành chính) ---
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_left, cell_right = header_table.rows[0].cells
    cell_left.width = Cm(8.0)
    cell_right.width = Cm(9.5)

    # Cột trái: Tên cơ quan chủ quản và đơn vị
    p_left = cell_left.paragraphs[0]
    p_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_left.paragraph_format.line_spacing = 1.15
    p_left.paragraph_format.space_after = Pt(0)
    r = p_left.add_run("SỞ GIÁO DỤC VÀ ĐÀO TẠO HƯNG YÊN\n")
    format_run(r, size_pt=10, bold=False, color_rgb=(0, 0, 0))
    r = p_left.add_run("TRƯỜNG THPT ĐÔNG THỤY ANH\n")
    format_run(r, size_pt=11, bold=True, color_rgb=(0, 0, 0))
    r = p_left.add_run("————————————")
    format_run(r, size_pt=9.5, bold=True, color_rgb=(0, 0, 0))

    # Cột phải: Quốc hiệu, tiêu ngữ
    p_right = cell_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_right.paragraph_format.line_spacing = 1.15
    p_right.paragraph_format.space_after = Pt(0)
    r = p_right.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))
    r = p_right.add_run("Độc lập – Tự do – Hạnh phúc\n")
    format_run(r, size_pt=11, bold=True, color_rgb=(0, 0, 0))
    r = p_right.add_run("————————————")
    format_run(r, size_pt=9.5, bold=True, color_rgb=(0, 0, 0))

    # Khoảng cách
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(6)
    p_space.paragraph_format.space_after = Pt(2)

    # --- TIÊU ĐỀ KẾ HOẠCH ---
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(2)
    p_title.paragraph_format.line_spacing = 1.2
    r = p_title.add_run("KẾ HOẠCH NGHIÊN CỨU DỰ ÁN KHOA HỌC KỸ THUẬT\n")
    format_run(r, size_pt=13.5, bold=True, color_rgb=(0, 0, 0))
    r = p_title.add_run("(Ban hành kèm theo Hồ sơ đăng ký dự thi theo Điều 17 & Điều 18 Thông tư số 84/2026/TT-BGDĐT)")
    format_run(r, size_pt=10, italic=True, color_rgb=(50, 50, 50))

    # --- KHỐI THÔNG TIN DỰ ÁN CHUẨN HÀNH CHÍNH ---
    info_table = doc.add_table(rows=1, cols=1)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_cell = info_table.rows[0].cells[0]
    info_cell.width = Cm(17.5)
    set_cell_background(info_cell, "F9F9F9")
    set_cell_margins(info_cell, top=120, bottom=120, left=160, right=160)

    # Viền hộp trang trọng
    tcPr = info_cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="333333"/>'
        f'  <w:left w:val="single" w:sz="12" w:space="0" w:color="333333"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="333333"/>'
        f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="333333"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

    p_info = info_cell.paragraphs[0]
    p_info.paragraph_format.line_spacing = 1.25
    p_info.paragraph_format.space_after = Pt(0)
    
    meta_items = [
        ("Tên dự án:", " NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG LỚP HỌC SỐ TÍCH HỢP KHẢO THÍ TRỰC TUYẾN ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN (VẬT LÝ, HÓA HỌC, SINH HỌC) CHO HỌC SINH THPT", True),
        ("Tên nền tảng phần mềm:", " ELEC AI (Hệ sinh thái EdTech trực tuyến tại: https://aitk-ten.vercel.app/)", False),
        ("Lĩnh vực dự thi:", " Phần mềm hệ thống (System Software)", False),
        ("Học sinh thực hiện:", " 1. Nguyễn Thế Duy (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Thiết kế hệ thống)\n                        2. Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Thành viên, Phụ trách nội dung liên môn KHTN, khảo sát & truyền thông)", False),
        ("Người hướng dẫn KH:", " Cô giáo Nguyễn Thị Thanh Hà (Giáo viên trường THPT Đông Thụy Anh)", False),
        ("Thời gian thực hiện:", " 05 tháng (Từ ngày 01/06/2026 đến ngày 30/10/2026)", False),
        ("Đánh giá độ an toàn:", " Thuộc 'Mức an toàn để thực hiện' (Tuân thủ Điểm b Khoản 4 Điều 4 Thông tư 84/2026/TT-BGDĐT)", False),
    ]

    for label, val, is_title in meta_items:
        r1 = p_info.add_run(f"- {label}")
        format_run(r1, size_pt=10, bold=True, color_rgb=(0, 0, 0))
        r2 = p_info.add_run(f"{val}\n")
        format_run(r2, size_pt=10, bold=is_title, color_rgb=(0, 0, 0))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # --- PHẦN I: BẢNG KẾ HOẠCH TIẾN ĐỘ VÀ PHÂN CÔNG (20 TUẦN) ---
    p_sec1 = doc.add_paragraph()
    p_sec1.paragraph_format.space_before = Pt(6)
    p_sec1.paragraph_format.space_after = Pt(3)
    r = p_sec1.add_run("I. KẾ HOẠCH TIẾN ĐỘ THỰC HIỆN VÀ PHÂN CÔNG NHIỆM VỤ (20 TUẦN)")
    format_run(r, size_pt=11, bold=True, color_rgb=(0, 0, 0))

    plan_table = doc.add_table(rows=1, cols=5)
    plan_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(plan_table, "475569")

    COL_WIDTHS = [2.2, 3.3, 7.2, 1.8, 3.0]  # Tổng cộng = 17.5 cm

    # Header Row
    hdr_cells = plan_table.rows[0].cells
    set_col_widths(plan_table.rows[0], COL_WIDTHS)
    set_row_header(plan_table.rows[0])
    headers = [
        "Giai đoạn / Tuần",
        "Nội dung công việc",
        "Nhiệm vụ kỹ thuật chi tiết",
        "Phụ trách",
        "Sản phẩm bàn giao"
    ]
    for idx, text in enumerate(headers):
        cell = hdr_cells[idx]
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, top=100, bottom=100, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.1
        r = p.add_run(text)
        format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))

    # Dữ liệu 5 Tháng & 20 Tuần (Thế Duy là Lập trình chính)
    months_data = [
        # THÁNG 1
        {
            "month_title": "THÁNG 1: KHẢO SÁT & THIẾT KẾ KIẾN TRÚC HỆ THỐNG LIÊN MÔN KHTN (01/06 - 30/06/2026) | Xác nhận định kỳ của GVHD: 30/06/2026",
            "weeks": [
                (
                    "Tuần 1\n(01/06 - 07/06)",
                    "Phê duyệt kế hoạch cấp trường & Khởi tạo dự án",
                    [
                        "Lập đề cương và kế hoạch nghiên cứu 5 tháng mở rộng toàn diện 3 môn KHTN (Vật lý, Hóa học, Sinh học) trình Tổ chuyên môn và BGH phê duyệt (Điều 17 TT84).",
                        "Đánh giá mức độ an toàn: Thuộc 'Mức an toàn để thực hiện' (Điểm b Khoản 4 Điều 4 TT84).",
                        "Khởi tạo kho mã nguồn Git, thiết lập quy chuẩn GitFlow và Sổ nhật ký nghiên cứu điện tử (Điều 14 TT84)."
                    ],
                    "Thế Duy,\nNguyệt Minh,\nGVHD",
                    "Kế hoạch nghiên cứu có chữ ký BGH; Repo Git & Sổ nhật ký điện tử."
                ),
                (
                    "Tuần 2\n(08/06 - 15/06)",
                    "Khảo sát thực tiễn giáo viên & học sinh 3 môn KHTN",
                    [
                        "Khảo sát 75 giáo viên KHTN (áp lực xây dựng ma trận đề liên môn, chấm trắc nghiệm thủ công, quản lý bài tập) và 250 học sinh (khó khăn tự học Lý - Hóa - Sinh, bẫy lý thuyết, gian lận online).",
                        "Tổng hợp số liệu định lượng bằng SPSS/Python; lưu trữ tập dữ liệu thô có gắn nhãn thời gian làm bằng chứng khoa học."
                    ],
                    "Nguyệt Minh\n(Chính),\nThế Duy",
                    "Bộ dữ liệu khảo sát gốc; Báo cáo phân tích định lượng nhu cầu tự học và khảo thí KHTN."
                ),
                (
                    "Tuần 3\n(16/06 - 22/06)",
                    "Đặc tả yêu cầu phần mềm KHTN (28 FR & 12 NFR)",
                    [
                        "Chuẩn hóa 28 yêu cầu chức năng (FR-01 đến FR-28: bổ sung lõi giải thuật Vật lý, Hóa học, quy luật Di truyền Sinh học, radar năng lực 6 chiều và phân tích bẫy đề thi).",
                        "Xác lập 12 yêu cầu phi chức năng (NFR: phản hồi < 1.5s, không lộ khóa API, PWA chạy offline-first, hỗ trợ Safari iOS, bảo vệ dữ liệu học sinh theo NĐ 13/2023/NĐ-CP).",
                        "Xây dựng Bảng ma trận truy vết yêu cầu (Requirement Traceability Matrix - RTM)."
                    ],
                    "Thế Duy\n(Chính),\nNguyệt Minh",
                    "Tài liệu SRS; Bảng ma trận truy vết yêu cầu RTM hoàn chỉnh."
                ),
                (
                    "Tuần 4\n(23/06 - 30/06)",
                    "Thiết kế kiến trúc 4 tầng & Cơ sở dữ liệu phân tán",
                    [
                        "Thiết kế kiến trúc hệ thống 4 tầng: Tầng Trình diễn (React PWA), Logic Client (/lib, /hooks, /features), Dịch vụ Đám mây (Firebase/Supabase), Tầng Edge AI (MediaPipe).",
                        "Thiết kế CSDL liên thông tối ưu: Firestore (realtime lớp học, phòng thi, vi phạm) & Supabase PostgreSQL (ngân hàng đề, sổ câu sai 3 môn Lý - Hóa - Sinh) qua UID.",
                        "Ký xác nhận định kỳ Tháng 6 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy\n(Chính)",
                    "Sơ đồ kiến trúc 4 tầng; Thiết kế CSDL (ERD); Biên bản xác nhận Tháng 6 của GVHD."
                )
            ]
        },
        # THÁNG 2
        {
            "month_title": "THÁNG 2: PHÁT TRIỂN LÕI KHOA HỌC TẤT ĐỊNH & HỆ THỐNG TRỢ LÝ AI KHTN (01/07 - 31/07/2026) | Xác nhận định kỳ của GVHD: 31/07/2026",
            "weeks": [
                (
                    "Tuần 5\n(01/07 - 07/07)",
                    "Lập trình lõi Khoa học tất định (scientificTools.js & chemBalance.js)",
                    [
                        "Hóa học: Đại số tuyến tính khử Gauss-Jordan (RREF) trên phân số BigInt cân bằng phản ứng không làm tròn; stoichiometry, nồng độ CM, C%, pH axit-bazơ yếu/mạnh, nhiệt phản ứng.",
                        "Vật lý: Thuật toán giải dao động điều hòa (con lắc lò xo, con lắc đơn, năng lượng), mạch xoay chiều RLC nối tiếp (tổng trở Z, độ lệch pha, cộng hưởng), khí lý tưởng PV=nRT.",
                        "Sinh học: Thuật toán di truyền Menđen lai 1 & nhiều cặp tính trạng, di truyền quần thể Hardy-Weinberg (p^2+2pq+q^2=1), dịch mã chuỗi mARN sang polypeptide."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn lib/scientificTools.js, lib/chemBalance.js; 42 ca kiểm thử tự động tính toán KHTN passed 100%."
                ),
                (
                    "Tuần 6\n(08/07 - 15/07)",
                    "Xây dựng Bảng tuần hoàn, Bảng mã di truyền & Cơ sở tri thức KHTN",
                    [
                        "Đóng gói 118 nguyên tố hóa học chuẩn IUPAC (data/elements.js) hỗ trợ tìm kiếm không dấu tiếng Việt, lọc 10 nhóm, so sánh đối đầu 2 nguyên tố.",
                        "Sinh học: Xây dựng Bảng mã di truyền 64 bộ ba (triplet codons) tra cứu nhanh axit amin, đột biến thay thế/thêm/mất nucleotit.",
                        "Cơ sở tri thức nội bộ (lib/aiKnowledge.js) tích hợp thuật toán tìm kiếm BM25 và chỉ mục nghịch đảo, trích xuất dữ liệu SGK chuẩn KHTN 10-11-12 phục vụ AI."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Dữ liệu KHTN)",
                    "Mã nguồn data/elements.js, lib/aiKnowledge.js; Giao diện Bảng tuần hoàn & Bảng mã di truyền; 20 ca test tri thức passed."
                ),
                (
                    "Tuần 7\n(16/07 - 23/07)",
                    "AI Router KHTN, Vòng xoay API & Chống ảo giác bằng Tool Grounding",
                    [
                        "Xây dựng AI Router thông minh: phân loại câu hỏi thuộc môn Lý, Hóa hay Sinh; chấm điểm độ khó 4 mức nhận thức; chọn mô hình tối ưu (Gemini Flash, Groq, DeepSeek).",
                        "Cơ chế Vòng xoay khóa API (Key Ring Rotation) tự động chuyển đổi khóa khi chạm hạn mức tải (HTTP 429) duy trì hoạt động 24/7.",
                        "Cơ chế Chống ảo giác số liệu (Deterministic Tool Grounding): Đối chiếu độc lập con số của AI với kết quả công cụ tính toán tất định KHTN, loại bỏ 100% hiện tượng bịa số."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn lib/ai.js, lib/aiRouter.js; Bộ 38 ca test phân loại môn & xoay khóa API passed."
                ),
                (
                    "Tuần 8\n(24/07 - 31/07)",
                    "Giao diện Trợ lý AI KHTN Scaffolding & OCR Nhận diện Công thức",
                    [
                        "Thiết kế giao diện Trợ lý AI KHTN: 6 chế độ học tập gợi mở (Scaffolding - gợi ý từng bước, không giải hộ ngay), bộ chọn môn Lý - Hóa - Sinh và khối lớp 10-11-12.",
                        "Tích hợp OCR (Tesseract.js kết hợp AI Vision) đọc đề bài trực tiếp từ ảnh chụp bài tập Lý, Hóa, Sinh trên máy khách, xử lý công thức và ký hiệu khoa học.",
                        "Chạy nghiệm thu 86 ca kiểm thử tự động Vitest cho phân hệ AI.",
                        "Ký xác nhận định kỳ Tháng 7 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Kịch bản)",
                    "Module Trợ lý AI KHTN hoàn thiện; 86 ca Vitest passed; Biên bản xác nhận Tháng 7 của GVHD."
                )
            ]
        },
        # THÁNG 3
        {
            "month_title": "THÁNG 3: KHẢO THÍ SỐ, STUDIO RA ĐỀ LIÊN MÔN & GIÁM SÁT THI AI (01/08 - 31/08/2026) | Xác nhận định kỳ của GVHD: 31/08/2026",
            "weeks": [
                (
                    "Tuần 9\n(01/08 - 07/08)",
                    "AutoExam Studio, Phân tích Bẫy đề thi & Bóc tách đề Word/PDF",
                    [
                        "Lập trình thuật toán dựng ma trận đề thi 4 mức nhận thức (NB, TH, VD, VDC) cố định tổng 10 điểm cho 3 môn Vật lý, Hóa học, Sinh học chuẩn định dạng Bộ GD&ĐT (3 phần thi: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn).",
                        "Module Phân tích Bẫy đề thi KHTN (lib/examTrapAnalyzer.js): phát hiện bẫy đơn vị SI, bẫy từ ngữ phủ định, bẫy điều kiện biên hóa học, bẫy quy luật di truyền sinh học.",
                        "Bóc tách đề thi tự động từ file Word (.docx) và PDF bằng Regex kết hợp AI (lib/examParser.js)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Đề mẫu KHTN)",
                    "Mã nguồn matrixAiService.js, examTrapAnalyzer.js, examParser.js; 35 ca test bóc tách đề KHTN đạt 100%."
                ),
                (
                    "Tuần 10\n(08/08 - 15/08)",
                    "Phân hệ Quản lý Lớp học số Đa môn & Liên kết GVCN - GVBM",
                    [
                        "Cơ chế liên kết GVCN - GVBM bằng Mã định danh an toàn (Base32 8 ký tự, không gian mẫu 32^8 ≈ 1,1 nghìn tỷ tổ hợp) cho phép GV bộ môn Lý, Hóa, Sinh đồng bộ quản lý lớp.",
                        "Dashboard phân tích học tập tự động (lib/learningAnalytics.js): biểu đồ SVG trực quan, theo dõi tiến độ bài tập liên môn realtime, bảng xếp hạng thi đua, cảnh báo sớm học sinh học lệch.",
                        "Thuật toán xáo trộn câu hỏi và hoán vị phương án (Seeded Shuffle) tự động sinh nhiều mã đề thi tương đương triệt tiêu gian lận chép bài."
                    ],
                    "Thế Duy (Lập trình chính),\nNguyệt Minh (Nghiệp vụ)",
                    "Phân hệ Quản lý Lớp học số GVCN/GVBM; Module Learning Analytics; Giao diện giao đề và đồng bộ CSDL."
                ),
                (
                    "Tuần 11\n(16/08 - 23/08)",
                    "Phòng thi trực tuyến an toàn & Giám sát Edge AI MediaPipe",
                    [
                        "Chế độ phòng thi bảo mật đa tầng: Khóa toàn màn hình (Fullscreen enforcement), bẫy chuyển tab (blur), vô hiệu hóa DevTools, chặn Copy/Paste.",
                        "Tích hợp MediaPipe Vision Edge AI: nhận diện khuôn mặt, ước lượng hướng quay đầu (Head Pose), cảnh báo vắng mặt hoặc thi hộ qua webcam (xử lý trên máy khách, bảo vệ quyền riêng tư).",
                        "Ghi nhật ký vi phạm thời gian thực (hooks/useProctorCamera.js) kèm ảnh bằng chứng gửi Firestore."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn hooks/useProctorCamera.js, VirtualExamRoom.jsx; Module phòng thi an toàn đa tầng."
                ),
                (
                    "Tuần 12\n(24/08 - 31/08)",
                    "Chấm phiếu trắc nghiệm A4 bằng Camera (OMR Computer Vision)",
                    [
                        "Thiết kế mẫu phiếu trả lời trắc nghiệm A4 chuẩn Bộ GD&ĐT (đủ 3 phần thi, SBD 6 số, mã đề 3 số) dùng chung cho các bài kiểm tra Lý, Hóa, Sinh.",
                        "Thuật toán thị giác máy tính: Biến đổi phối cảnh Homography nắn phẳng ảnh; trích xuất Kênh màu Đỏ (Red Channel Extraction) loại trừ nền hồng; Otsu phân ngưỡng động đo độ đậm quang học ô tô.",
                        "Thử nghiệm chấm quét trên 30 ảnh thực tế từ camera điện thoại (độ chính xác > 98%, < 1.5s/phiếu).",
                        "Ký xác nhận định kỳ Tháng 8 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Thực nghiệm)",
                    "Mã nguồn lib/omr.js, lib/omrSheetGenerator.js; Mẫu phiếu OMR A4; Bộ ảnh thử nghiệm OMR; Biên bản xác nhận Tháng 8."
                )
            ]
        },
        # THÁNG 4
        {
            "month_title": "THÁNG 4: HỆ SINH THÁI TỰ HỌC KHTN, LAB 3D, RADAR NĂNG LỰC & ĐÓNG GÓI PWA (01/09 - 30/09/2026) | Xác nhận định kỳ của GVHD: 30/09/2026",
            "weeks": [
                (
                    "Tuần 13\n(01/09 - 07/09)",
                    "Phòng thí nghiệm KHTN ảo 3D nhập vai & 2D (Three.js)",
                    [
                        "Lập trình Engine mô phỏng phản ứng Hóa học (features/lab3d/engine.js): không gian 3D tương tác phòng lab, 28 hóa chất chuẩn, phản ứng tỏa nhiệt, kết tủa đổi màu, sủi bọt khí 3D, đo pH dung dịch, quy tắc an toàn.",
                        "Mô phỏng Vật lý tương tác: lắp ghép mạch điện xoay chiều RLC, khảo sát dao động con lắc lò xo và đường truyền tia sáng qua thấu kính/lăng kính.",
                        "Mô hình tương tác Sinh học: không gian 3D cấu trúc xoắn kép ADN, cơ chế dịch mã mARN qua ribosome và các kỳ phân bào nguyên phân/giảm phân.",
                        "Xây dựng chế độ hiển thị 2D Canvas dự phòng cho thiết bị cấu hình yếu."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Module Phòng lab KHTN 3D/2D; Thư viện mô phỏng thực hành Lý - Hóa - Sinh hoàn chỉnh."
                ),
                (
                    "Tuần 14\n(08/09 - 15/09)",
                    "Radar Năng lực KHTN 6 chiều, Sổ câu sai SRS & Gamification Camera",
                    [
                        "Động cơ Radar Đánh giá Năng lực KHTN 6 chiều (lib/competencyRadarEngine.js): tự động tính điểm theo 6 năng lực chuẩn GDPT 2018 (Nhận thức KHTN, Tìm hiểu tự nhiên, Vận dụng thực tiễn, Giải toán khoa học, Thực nghiệm, Phân tích đồ thị).",
                        "Thuật toán Lặp lại ngắt quãng SRS (lib/srs.js chuẩn SuperMemo SM-2) tính hệ số dễ (EF) lên lịch ôn theo đường cong quên Ebbinghaus phân loại điểm nghẽn theo từng môn Lý, Hóa, Sinh.",
                        "18 trò chơi ôn tập tương tác và 9 trò chơi điều khiển cử chỉ camera MediaPipe Vision; Tích hợp Linh vật AI ELEC (22 trạng thái cảm xúc) và âm thanh Lofi Focus kích thích tập trung."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Nội dung KHTN)",
                    "Mã nguồn competencyRadarEngine.js, lib/srs.js, lib/cameraGames.js; Giao diện Sổ câu sai & Radar năng lực liên môn."
                ),
                (
                    "Tuần 15\n(16/09 - 22/09)",
                    "AI Tư vấn Nguyện vọng Đại học Khối KHTN, Phân quyền & Bảo mật",
                    [
                        "Động cơ AI Tư vấn Chiến lược Nguyện vọng Đại học (lib/aspirationAiEngine.js, lib/aspirationPortfolioOptimizer.js): phân tích dữ liệu tuyển sinh khối A00, B00, A01, A02 của hơn 100 trường ĐH; tối ưu hóa danh mục nguyện vọng 3 tầng rủi ro (Vươn cao, Vừa sức, An toàn).",
                        "Phân quyền đa cấp (Học sinh, Giáo viên bộ môn Lý/Hóa/Sinh, GVCN, Quản trị viên) qua Firestore Rules & Supabase RLS.",
                        "Serverless Cloud Functions giữ bí mật khóa API an toàn; tích hợp nạp điểm Credit tự động qua VietQR/SePay; rà soát an toàn thông tin theo Nghị định 13/2023/NĐ-CP và Thông tư 84/2026/TT-BGDĐT."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn aspirationAiEngine.js; Tệp cấu hình firestore.rules, migrations; Phân hệ tư vấn nguyện vọng KHTN & tài khoản."
                ),
                (
                    "Tuần 16\n(23/09 - 30/09)",
                    "Tích hợp toàn diện 14 module chức năng & Đóng gói PWA",
                    [
                        "Tích hợp toàn diện 14 module chức năng của hệ sinh thái ELEC AI; xử lý triệt để 4 xung đột kỹ thuật lớn (CSS token collisions, hạn mức đồng bộ realtime, tối ưu bundle Three.js/MediaPipe, tương thích Safari iOS).",
                        "Tối ưu hóa hiệu năng Vite 5.4, phân đoạn mã nguồn động (Dynamic Code Splitting), đóng gói Progressive Web App (PWA) với Service Worker hỗ trợ học tập và thi ngoại tuyến (offline-first).",
                        "Triển khai sản phẩm hoàn chỉnh lên Internet (https://aitk-ten.vercel.app/).",
                        "Ký xác nhận định kỳ Tháng 9 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Kiểm thử hệ thống)",
                    "Hệ sinh thái ELEC AI KHTN hoạt động chính thức trên Internet; Biên bản xác nhận Tháng 9 của GVHD."
                )
            ]
        },
        # THÁNG 5
        {
            "month_title": "THÁNG 5: THỰC NGHIỆM SƯ PHẠM, KIỂM ĐỊNH TOÀN DIỆN & HOÀN TẤT HỒ SƠ DỰ THI (01/10 - 30/10/2026) | Xác nhận định kỳ của GVHD: 30/10/2026",
            "weeks": [
                (
                    "Tuần 17\n(01/10 - 08/10)",
                    "Triển khai thực nghiệm sư phạm tại Trường THPT Đông Thụy Anh",
                    [
                        "Triển khai thực nghiệm sư phạm diện rộng tại các lớp khối 10, 11 (Lớp Cô Hà, Lớp 11A7, 10A1) thuộc Trường THPT Đông Thụy Anh.",
                        "Thiết kế nghiên cứu bán thực nghiệm: Nhóm thực nghiệm (N=125 học sinh sử dụng ELEC AI tự học và kiểm tra 3 môn Vật lý, Hóa học, Sinh học) và Nhóm đối chứng (N=125 học sinh học truyền thống).",
                        "Thu thập dữ liệu bài thi trực tuyến, nhật ký nộp bài, thời gian làm bài, tỷ lệ sửa lỗi trong sổ câu sai và biên bản vi phạm phòng thi có giám sát MediaPipe."
                    ],
                    "Nguyệt Minh,\nThế Duy,\nGVHD",
                    "Bộ dữ liệu thực nghiệm thực tế tại trường; Danh sách bài nộp và phổ điểm thi 3 môn KHTN đối chiếu 2 nhóm."
                ),
                (
                    "Tuần 18\n(09/10 - 15/10)",
                    "Kiểm thử chức năng, Đo lường hiệu năng & 460 ca Vitest tự động",
                    [
                        "Chạy toàn bộ bộ kiểm thử tự động với 460 ca Vitest (mở rộng kiểm thử lõi tính toán khoa học tất định Vật lý, Hóa học, Sinh học, AI Router, OMR, SRS, Radar năng lực) đạt tỷ lệ 460/460 passed 100% trong thời gian < 15 giây.",
                        "Thực hiện 36 kịch bản kiểm thử chức năng toàn diện và đo lường các chỉ số hiệu năng Web Vitals (FCP < 1.2s, LCP < 2.0s, CLS = 0) trên 3 dòng thiết bị: Desktop, Tablet và Smartphone.",
                        "Thử nghiệm chấm thực tế 50 phiếu trắc nghiệm A4 KHTN bằng camera trong các điều kiện ánh sáng khác nhau (đạt độ chính xác 98.2%, tốc độ 1.4s/phiếu)."
                    ],
                    "Thế Duy\n(Chính)",
                    "Biên bản nghiệm thu kiểm thử Vitest 460 ca passed; Bảng đo lường hiệu năng Web Vitals; Báo cáo thử nghiệm chấm OMR camera."
                ),
                (
                    "Tuần 19\n(16/10 - 22/10)",
                    "Khảo sát người dùng, Xử lý thống kê định lượng & Đúc kết bài học",
                    [
                        "Phát phiếu khảo sát mức độ hài lòng và hiệu quả sư phạm gồm 15 tiêu chí (A1-D3) cho giáo viên KHTN và học sinh; thu thập dữ liệu phản hồi định lượng.",
                        "Phân tích thống kê: Tỷ lệ hoàn thành bài tập nộp đúng hạn đạt 93.8% (tăng từ 68.0%), điểm trung bình kiểm tra 3 môn Lý - Hóa - Sinh tăng 19.2% (từ 6.25 lên 7.45 điểm), tỷ lệ làm chủ câu sai đạt 89.6%.",
                        "Đúc kết và phân tích 4 bài học kinh nghiệm kỹ thuật lớn về kiến trúc phần mềm, quản lý trạng thái, chống ảo giác AI và thị giác máy tính trên trình duyệt."
                    ],
                    "Nguyệt Minh\n(Chính),\nThế Duy",
                    "Bộ phiếu khảo sát người dùng đã điền; Báo cáo phân tích định lượng hiệu quả sư phạm và năng lực KHTN; Tài liệu bài học kỹ thuật."
                ),
                (
                    "Tuần 20\n(23/10 - 30/10)",
                    "Nghiệm thu cấp trường & Đóng gói trọn bộ hồ sơ Điều 18 Thông tư 84/2026/TT-BGDĐT",
                    [
                        "Hoàn tất Báo cáo kết quả nghiên cứu toàn văn (chuẩn dự án phần mềm hệ thống theo Điểm b Khoản 1 Điều 3 Thông tư 84/2026/TT-BGDĐT).",
                        "Soạn thảo Báo cáo tóm tắt (Abstract) với dung lượng chuẩn xác KHÔNG QUÁ 300 CHỮ, nêu bật tính mới và đột phá công nghệ liên môn KHTN.",
                        "Lập Phiếu khai báo công nghệ số và trí tuệ nhân tạo (Điều 15 TT84) minh bạch rõ ràng các mô hình AI mã nguồn mở và thư viện sử dụng.",
                        "Đóng tập Sổ nhật ký nghiên cứu khoa học (đầy đủ 5 chữ ký xác nhận định kỳ hàng tháng của GVHD) kèm toàn bộ dữ liệu gốc (Điều 14 TT84).",
                        "Ký Bản cam kết liêm chính học thuật (Điều 4 & Điều 16 TT84); Hội đồng khoa học nhà trường tổ chức đánh giá và nghiệm thu cấp trường chính thức trước ngày 30/10/2026."
                    ],
                    "Thế Duy,\nNguyệt Minh,\nGVHD",
                    "Trọn bộ 8 thành phần Hồ sơ dự thi chuẩn Điều 18 Thông tư 84/2026/TT-BGDĐT; Biên bản nghiệm thu cấp trường."
                )
            ]
        }
    ]

    for m_idx, month in enumerate(months_data):
        # Hàng tiêu đề tháng (merge 5 cột)
        m_row = plan_table.add_row()
        set_col_widths(m_row, COL_WIDTHS)
        set_row_cant_split(m_row)
        # merge cells
        cell_m = m_row.cells[0]
        for c in m_row.cells[1:]:
            cell_m.merge(c)
        set_cell_background(cell_m, "F1F5F9")
        set_cell_margins(cell_m, top=90, bottom=90, left=100, right=100)
        p = cell_m.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(month["month_title"])
        format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))

        # Các tuần trong tháng
        for w_idx, week in enumerate(month["weeks"]):
            w_time, w_job, w_tasks, w_assignee, w_deliverable = week
            row = plan_table.add_row()
            set_col_widths(row, COL_WIDTHS)
            set_row_cant_split(row)
            
            # Nền trắng chuẩn công văn
            bg_color = "FAFAFA" if w_idx % 2 == 1 else "FFFFFF"

            # Ô 1: Tuần
            c1 = row.cells[0]
            set_cell_background(c1, bg_color)
            set_cell_margins(c1, top=70, bottom=70, left=50, right=50)
            p1 = c1.paragraphs[0]
            p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p1.paragraph_format.line_spacing = 1.15
            parts = w_time.split("\n")
            r1 = p1.add_run(parts[0] + "\n")
            format_run(r1, size_pt=9.5, bold=True, color_rgb=(0, 0, 0))
            if len(parts) > 1:
                r2 = p1.add_run(parts[1])
                format_run(r2, size_pt=8.5, italic=True, color_rgb=(80, 80, 80))

            # Ô 2: Nội dung công việc
            c2 = row.cells[1]
            set_cell_background(c2, bg_color)
            set_cell_margins(c2, top=70, bottom=70, left=70, right=70)
            p2 = c2.paragraphs[0]
            p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p2.paragraph_format.line_spacing = 1.15
            r = p2.add_run(w_job)
            format_run(r, size_pt=9.5, bold=True, color_rgb=(0, 0, 0))

            # Ô 3: Nhiệm vụ chi tiết (dấu gạch ngang chuẩn thể thức)
            c3 = row.cells[2]
            set_cell_background(c3, bg_color)
            set_cell_margins(c3, top=70, bottom=70, left=70, right=70)
            p3 = c3.paragraphs[0]
            p3.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p3.paragraph_format.line_spacing = 1.15
            for t_idx, task in enumerate(w_tasks):
                prefix = "- "
                suffix = "\n" if t_idx < len(w_tasks) - 1 else ""
                r = p3.add_run(f"{prefix}{task}{suffix}")
                format_run(r, size_pt=9.0, color_rgb=(30, 30, 30))

            # Ô 4: Phụ trách
            c4 = row.cells[3]
            set_cell_background(c4, bg_color)
            set_cell_margins(c4, top=70, bottom=70, left=50, right=50)
            p4 = c4.paragraphs[0]
            p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p4.paragraph_format.line_spacing = 1.15
            r = p4.add_run(w_assignee)
            format_run(r, size_pt=9.0, bold=True, color_rgb=(0, 0, 0))

            # Ô 5: Sản phẩm bàn giao
            c5 = row.cells[4]
            set_cell_background(c5, bg_color)
            set_cell_margins(c5, top=70, bottom=70, left=70, right=70)
            p5 = c5.paragraphs[0]
            p5.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p5.paragraph_format.line_spacing = 1.15
            r = p5.add_run(w_deliverable)
            format_run(r, size_pt=9.0, color_rgb=(0, 0, 0))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- PHẦN II: BẢNG DANH MỤC HỒ SƠ DỰ THI ĐIỀU 18 ---
    p_sec2 = doc.add_paragraph()
    p_sec2.paragraph_format.space_before = Pt(6)
    p_sec2.paragraph_format.space_after = Pt(3)
    r = p_sec2.add_run("II. DANH MỤC HỒ SƠ DỰ THI THEO ĐIỀU 18 THÔNG TƯ 84/2026/TT-BGDĐT")
    format_run(r, size_pt=11, bold=True, color_rgb=(0, 0, 0))

    doc_table = doc.add_table(rows=1, cols=3)
    doc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(doc_table, "475569")

    DOC_WIDTHS = [1.2, 5.3, 11.0]  # Tổng cộng = 17.5 cm
    set_col_widths(doc_table.rows[0], DOC_WIDTHS)
    set_row_header(doc_table.rows[0])

    hdr_doc = doc_table.rows[0].cells
    for idx, text in enumerate(["STT", "Thành phần hồ sơ (Điều 18)", "Quy cách chuẩn bị & Yêu cầu pháp lý"]):
        cell = hdr_doc[idx]
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, top=100, bottom=100, left=70, right=70)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.1
        r = p.add_run(text)
        format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))

    danh_muc = [
        ("1", "Quyết định cử dự án dự thi", "Quyết định do Thủ trưởng đơn vị dự thi (Sở GD&ĐT Hưng Yên / Trường THPT Đông Thụy Anh) ký và đóng dấu theo quy định."),
        ("2", "Kế hoạch nghiên cứu & Thuyết minh đăng ký", "Kế hoạch nghiên cứu 5 tháng mở rộng 3 môn KHTN đã được Hiệu trưởng cơ sở giáo dục phê duyệt từ đầu kỳ (Tuân thủ Điều 17 Thông tư 84)."),
        ("3", "Báo cáo kết quả nghiên cứu toàn văn", "Báo cáo chi tiết đầy đủ 4 phần chuẩn dự án kỹ thuật phần mềm hệ thống theo Điểm b Khoản 1 Điều 3 Thông tư 84."),
        ("4", "Báo cáo tóm tắt kết quả (Abstract)", "Độ dài giới hạn KHÔNG QUÁ 300 CHỮ phản ánh đầy đủ 4 nội dung cốt lõi của đề tài theo Điểm b Khoản 1 Điều 3 Thông tư 84."),
        ("5", "Sổ nhật ký nghiên cứu & Dữ liệu gốc", "Ghi chép liên tục từ 01/06 đến 30/10/2026; có đủ 5 chữ ký xác nhận định kỳ hàng tháng của GVHD và tệp dữ liệu thô (Điều 14 Thông tư 84)."),
        ("6", "Phiếu khai báo công nghệ số & AI", "Kê khai chi tiết các mô hình AI (Gemini Flash, Groq, DeepSeek) và thư viện kỹ thuật số (MediaPipe, Three.js, Tesseract.js) theo mẫu thống nhất của Bộ GD&ĐT (Điều 15 Thông tư 84)."),
        ("7", "Bản cam kết của học sinh & GVHD", "Cam kết tuân thủ liêm chính học thuật, đạo đức nghề nghiệp và an toàn nghiên cứu theo Điều 4 & Điều 16 Thông tư 84."),
        ("8", "Giấy xác nhận kết quả học tập", "Xác nhận kết quả học tập, rèn luyện của 02 học sinh đạt từ mức Khá trở lên theo Khoản 3 Điều 5 Thông tư 84.")
    ]

    for idx, (stt, name, spec) in enumerate(danh_muc):
        row = doc_table.add_row()
        set_col_widths(row, DOC_WIDTHS)
        set_row_cant_split(row)
        bg = "FAFAFA" if idx % 2 == 1 else "FFFFFF"

        c0, c1, c2 = row.cells
        for c in (c0, c1, c2):
            set_cell_background(c, bg)
            set_cell_margins(c, top=70, bottom=70, left=70, right=70)

        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p0.add_run(stt)
        format_run(r, size_pt=9.5, bold=True, color_rgb=(0, 0, 0))

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p1.add_run(name)
        format_run(r, size_pt=9.5, bold=True, color_rgb=(0, 0, 0))

        p2 = c2.paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p2.paragraph_format.line_spacing = 1.15
        r = p2.add_run(spec)
        format_run(r, size_pt=9.5, color_rgb=(30, 30, 30))

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- PHẦN III: CHỮ KÝ PHÊ DUYỆT (3 CỘT KHÔNG VIỀN) ---
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_date.paragraph_format.space_after = Pt(4)
    r = p_date.add_run("Hưng Yên, ngày 01 tháng 06 năm 2026")
    format_run(r, size_pt=10, italic=True, color_rgb=(50, 50, 50))

    sig_table = doc.add_table(rows=1, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    SIG_WIDTHS = [5.8, 5.8, 5.9]  # Tổng cộng = 17.5 cm
    set_col_widths(sig_table.rows[0], SIG_WIDTHS)
    set_row_cant_split(sig_table.rows[0])

    s0, s1, s2 = sig_table.rows[0].cells

    # Cột 1: GVHD
    p = s0.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("NGƯỜI HƯỚNG DẪN KHOA HỌC\n")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))
    r = p.add_run("(Ký và ghi rõ họ tên)\n\n\n\n\n")
    format_run(r, size_pt=9, italic=True, color_rgb=(80, 80, 80))
    r = p.add_run("Nguyễn Thị Thanh Hà")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))

    # Cột 2: Tổ trưởng chuyên môn
    p = s1.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("TỔ TRƯỞNG CHUYÊN MÔN\n")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))
    r = p.add_run("(Ký duyệt đề cương & tiến độ)\n\n\n\n\n")
    format_run(r, size_pt=9, italic=True, color_rgb=(80, 80, 80))
    r = p.add_run("Nguyễn Công Minh")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))

    # Cột 3: Ban Giám Hiệu
    p = s2.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("HIỆU TRƯỞNG / CƠ SỞ GIÁO DỤC\n")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))
    r = p.add_run("(Ký, đóng dấu phê duyệt theo Điều 17 TT84)\n\n\n\n\n")
    format_run(r, size_pt=8.5, italic=True, color_rgb=(80, 80, 80))
    r = p.add_run("(Ký, đóng dấu)")
    format_run(r, size_pt=9.5, italic=True, color_rgb=(80, 80, 80))

    output_path = os.path.abspath("KE_HOACH_NGHIEN_CUU_KHKT_ELEC_AI_THONG_TU_84.docx")
    doc.save(output_path)
    try:
        print("SUCCESS: Document updated cleanly.")
    except Exception:
        pass

if __name__ == "__main__":
    create_document()
