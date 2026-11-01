# -*- coding: utf-8 -*-
"""
Tạo tệp Word (.docx) Kế hoạch nghiên cứu dự án KHKT ELEC AI
Thể thức chuẩn hành chính theo Nghị định 30/2020/NĐ-CP & Thông tư 84/2026/TT-BGDĐT
Nguyễn Thế Duy phụ trách Lập trình chính & Kiến trúc hệ thống
Không sử dụng icon/emoji.
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
        ("Tên dự án:", " NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG LỚP HỌC SỐ TÍCH HỢP KHẢO THÍ TRỰC TUYẾN ĐA MÔN VÀ TỰ HỌC MÔN HÓA HỌC TẠI TRƯỜNG THPT", True),
        ("Tên nền tảng phần mềm:", " ELEC AI (Hệ sinh thái EdTech trực tuyến tại: https://aitk-ten.vercel.app/)", False),
        ("Lĩnh vực dự thi:", " Phần mềm hệ thống (System Software)", False),
        ("Học sinh thực hiện:", " 1. Nguyễn Thế Duy (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Thiết kế hệ thống)\n                        2. Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Thành viên, Phụ trách nội dung, khảo sát & truyền thông)", False),
        ("Người hướng dẫn KH:", " Cô giáo Nguyễn Thị Thanh Hà (Giáo viên Hóa học, Trường THPT Đông Thụy Anh)", False),
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
            "month_title": "THÁNG 1: KHẢO SÁT & THIẾT KẾ KIẾN TRÚC (01/06 - 30/06/2026) | Xác nhận định kỳ của GVHD: 30/06/2026",
            "weeks": [
                (
                    "Tuần 1\n(01/06 - 07/06)",
                    "Phê duyệt kế hoạch cấp trường & Khởi tạo dự án",
                    [
                        "Lập đề cương và kế hoạch nghiên cứu 5 tháng trình Tổ chuyên môn và BGH phê duyệt (Điều 17 TT84).",
                        "Đánh giá mức độ an toàn: Thuộc 'Mức an toàn để thực hiện' (Điểm b Khoản 4 Điều 4 TT84).",
                        "Khởi tạo kho mã nguồn Git và Sổ nhật ký nghiên cứu điện tử (Điều 14 TT84)."
                    ],
                    "Thế Duy,\nNguyệt Minh",
                    "Kế hoạch nghiên cứu có chữ ký BGH; Repo Git & Sổ nhật ký điện tử."
                ),
                (
                    "Tuần 2\n(08/06 - 15/06)",
                    "Khảo sát thực tiễn giáo viên & học sinh",
                    [
                        "Khảo sát 59 giáo viên (áp lực ra đề ma trận, chấm bài thủ công) và 180 học sinh (khó khăn tự học Hóa, gian lận thi online).",
                        "Tổng hợp số liệu định lượng; lưu trữ tập dữ liệu thô có gắn dấu thời gian làm bằng chứng khoa học."
                    ],
                    "Nguyệt Minh\n(Chính),\nThế Duy",
                    "Bộ dữ liệu khảo sát gốc; Báo cáo phân tích định lượng nhu cầu."
                ),
                (
                    "Tuần 3\n(16/06 - 22/06)",
                    "Phân tích yêu cầu hệ thống (24 FR & 12 NFR)",
                    [
                        "Chuẩn hóa 24 yêu cầu chức năng (FR-01 đến FR-24: 17 mức 1, 6 mức 2, 1 mức 3).",
                        "Xác lập 12 yêu cầu phi chức năng (NFR: phản hồi < 1.5s, không lộ khóa API, tương thích Safari iOS, bảo vệ dữ liệu học sinh).",
                        "Lập Ma trận truy vết yêu cầu (Traceability Matrix)."
                    ],
                    "Thế Duy\n(Chính),\nNguyệt Minh",
                    "Tài liệu SRS; Bảng ma trận truy vết yêu cầu hoàn chỉnh."
                ),
                (
                    "Tuần 4\n(23/06 - 30/06)",
                    "Thiết kế kiến trúc 4 tầng & Cơ sở dữ liệu",
                    [
                        "Thiết kế kiến trúc 4 tầng: Presentation, Client Logic (/lib, /hooks), Cloud Services, Edge AI/MediaPipe.",
                        "Thiết kế CSDL liên thông: Firestore (realtime lớp học, thi) & Supabase PostgreSQL (ngân hàng đề, sổ câu sai) qua UID.",
                        "Ký xác nhận định kỳ Tháng 6 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy\n(Chính)",
                    "Sơ đồ kiến trúc 4 tầng; Thiết kế CSDL (ERD); Biên bản xác nhận Tháng 6 của GVHD."
                )
            ]
        },
        # THÁNG 2
        {
            "month_title": "THÁNG 2: PHÁT TRIỂN LÕI HÓA HỌC & TRỢ LÝ AI (01/07 - 31/07/2026) | Xác nhận định kỳ của GVHD: 31/07/2026",
            "weeks": [
                (
                    "Tuần 5\n(01/07 - 07/07)",
                    "Lập trình lõi Hóa học tất định (chemBalance.js & aiTools.js)",
                    [
                        "Phân tích công thức hóa học hỗ trợ ngoặc tròn, ngoặc vuông, ngậm nước (CuSO4·5H2O).",
                        "Cài đặt thuật toán đại số tuyến tính khử Gauss-Jordan (RREF) trên phân số BigInt cân bằng phản ứng không làm tròn số.",
                        "Xây dựng bộ công cụ stoichiometry & dung dịch (lib/aiTools.js): khối lượng mol, nồng độ CM, C%, pH, bảo toàn nguyên tố."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn lib/chemBalance.js, lib/aiTools.js; 14 ca kiểm thử tự động cân bằng phản ứng passed 100%."
                ),
                (
                    "Tuần 6\n(08/07 - 15/07)",
                    "Xây dựng Bảng tuần hoàn & Cơ sở tri thức",
                    [
                        "Đóng gói 118 nguyên tố chuẩn IUPAC (data/elements.js).",
                        "Lập trình tìm kiếm không dấu tiếng Việt, lọc 10 nhóm nguyên tố, so sánh đối đầu 2 nguyên tố.",
                        "Xây dựng chỉ mục tri thức nội bộ (aiKnowledge.js) hỗ trợ thuật toán BM25 và chỉ mục nghịch đảo phục vụ AI."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Dữ liệu)",
                    "Mã nguồn data/elements.js, lib/aiKnowledge.js; Giao diện Bảng tuần hoàn cuộn neo trên mobile."
                ),
                (
                    "Tuần 7\n(16/07 - 23/07)",
                    "Xây dựng AI Router & Vòng xoay khóa API",
                    [
                        "Cài đặt luồng xử lý 7 bước câu hỏi AI; thuật toán phân loại tác vụ, chấm điểm độ khó và chọn mô hình tối ưu.",
                        "Cơ chế Vòng xoay khóa API (Key Ring Rotation) tự động chuyển khóa khi chạm hạn mức (rate limit 429).",
                        "Cơ chế Chống ảo giác số liệu (Deterministic Tool Grounding): Đối chiếu độc lập con số của AI với kết quả công cụ tất định, gắn nhãn kiểm chứng."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn lib/ai.js, lib/aiRouter.js; Bộ 22 ca test phân loại & xoay khóa API."
                ),
                (
                    "Tuần 8\n(24/07 - 31/07)",
                    "Giao diện Trợ lý AI & Bộ kiểm thử Vitest",
                    [
                        "Thiết kế giao diện Trợ lý AI: 6 chế độ học tập gợi mở (Scaffolding), chọn khối lớp 10-11-12.",
                        "Tích hợp Tesseract.js OCR đọc đề bài từ ảnh chụp trực tiếp trên máy khách (Client-side fallback).",
                        "Chạy nghiệm thu 58 ca kiểm thử tự động Vitest cho phân hệ AI.",
                        "Ký xác nhận định kỳ Tháng 7 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Kịch bản)",
                    "Module Trợ lý AI hoàn thiện; 58 ca Vitest passed; Biên bản xác nhận Tháng 7 của GVHD."
                )
            ]
        },
        # THÁNG 3
        {
            "month_title": "THÁNG 3: KHẢO THÍ SỐ, STUDIO RA ĐỀ & GIÁM SÁT THI (01/08 - 31/08/2026) | Xác nhận định kỳ của GVHD: 31/08/2026",
            "weeks": [
                (
                    "Tuần 9\n(01/08 - 07/08)",
                    "AutoExam Studio & Ma trận đề 4 mức độ",
                    [
                        "Lập trình thuật toán dựng ma trận 4 mức nhận thức (NB, TH, VD, VDC) cố định chuẩn tổng 10 điểm.",
                        "Tích hợp 3 phần thi mới theo cấu trúc Đề thi tốt nghiệp THPT Chương trình GDPT 2018 (Trắc nghiệm, Đúng/Sai, Trả lời ngắn).",
                        "Bóc tách đề thi tự động từ file Word (.docx) và PDF bằng regex kết hợp AI (examParser.js)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Đề mẫu)",
                    "Mã nguồn matrixAiService.js, examParser.js; 20 ca test bóc tách đề đạt 100%."
                ),
                (
                    "Tuần 10\n(08/08 - 15/08)",
                    "Phân hệ Quản lý Lớp học số (GVCN)",
                    [
                        "Cơ chế liên kết GVCN - GVBM bằng Mã định danh an toàn chống vét cạn (hàm generateClassKey sinh từ bảng 32 ký tự an toàn Base32, không gian mẫu 32^8 ≈ 1,1 nghìn tỷ tổ hợp).",
                        "Dashboard giám sát bài tập liên môn realtime, bảng xếp hạng thi đua, xuất phiếu điểm Zalo.",
                        "Thuật toán xáo trộn câu hỏi và hoán vị phương án đảo đề trắc nghiệm triệt tiêu gian lận."
                    ],
                    "Thế Duy (Lập trình chính),\nNguyệt Minh (Nghiệp vụ)",
                    "Phân hệ Quản lý lớp học số GVCN; Giao diện giao đề và đồng bộ CSDL."
                ),
                (
                    "Tuần 11\n(16/08 - 23/08)",
                    "Phòng thi an toàn & Giám sát MediaPipe",
                    [
                        "Khóa màn hình (Fullscreen enforcement), bẫy chuyển tab (blur), chặn DevTools, chặn Copy/Paste.",
                        "Tích hợp MediaPipe Tasks Vision nhận diện khuôn mặt, phát hiện quay đầu, vắng mặt hoặc thi hộ qua webcam (Edge AI máy khách, không gửi video về server).",
                        "Ghi nhật ký vi phạm (useProctorCamera.js) kèm ảnh bằng chứng gửi Firestore."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Mã nguồn hooks/useProctorCamera.js; Module phòng thi bảo mật đa tầng."
                ),
                (
                    "Tuần 12\n(24/08 - 31/08)",
                    "Chấm phiếu trắc nghiệm A4 bằng Camera (OMR)",
                    [
                        "Thiết kế mẫu phiếu A4 chuẩn Bộ GD&ĐT (đủ 3 phần thi, SBD 6 số, mã đề 3 số).",
                        "Thuật toán biến đổi phối cảnh Homography nắn phẳng ảnh và trích xuất Kênh Đỏ (Red Channel) loại trừ nền hồng.",
                        "Đo độ đen tương đối ô tô; thử nghiệm chấm quét trên 20 ảnh thực tế.",
                        "Ký xác nhận định kỳ Tháng 8 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Thực nghiệm)",
                    "Mã nguồn lib/omr.js; Mẫu phiếu OMR A4; Bộ ảnh thử nghiệm OMR; Biên bản xác nhận Tháng 8."
                )
            ]
        },
        # THÁNG 4
        {
            "month_title": "THÁNG 4: PHÂN HỆ TỰ HỌC, TÍCH HỢP & ĐÓNG GÓI PWA (01/09 - 30/09/2026) | Xác nhận định kỳ của GVHD: 30/09/2026",
            "weeks": [
                (
                    "Tuần 13\n(01/09 - 07/09)",
                    "Phòng thí nghiệm Hóa học ảo 3D & 2D",
                    [
                        "Lập trình Engine phản ứng vật lý & hóa học (features/lab3d/engine.js) độc lập giao diện.",
                        "Dựng không gian 3D tương tác bàn thực hành bằng Three.js / React Three Fiber (ống nghiệm, kết tủa đổi màu, sủi bọt, tỏa nhiệt).",
                        "Xây dựng chế độ hiển thị 2D phẳng Canvas dự phòng cho thiết bị cấu hình yếu."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Module Phòng lab 3D/2D; Thư viện phản ứng hóa học trực quan hoàn chỉnh."
                ),
                (
                    "Tuần 14\n(08/09 - 15/09)",
                    "Sổ câu sai thông minh (SRS) & Game Camera",
                    [
                        "Thuật toán Lặp lại ngắt quãng SRS (srs.js theo chuẩn SuperMemo SM-2) tính hệ số dễ (EF) lên lịch ôn theo đường cong quên Ebbinghaus.",
                        "Lập trình 14 chế độ ôn tập flashcard và 9 trò chơi cử chỉ camera MediaPipe (giơ ngón tay chọn A-B-C-D, cử chỉ đầu, ánh mắt).",
                        "Module phụ trợ: Clock Hub (Pomodoro), Thời khóa biểu, Thú cưng học tập, Đếm ngược kỳ thi."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Câu hỏi)",
                    "Mã nguồn lib/srs.js, lib/cameraGames.js; Giao diện Sổ câu sai & Gamification."
                ),
                (
                    "Tuần 15\n(16/09 - 22/09)",
                    "Phân quyền đa cấp, Bảo mật & Điểm Credit",
                    [
                        "Phân quyền 3 vai trò (Học sinh, Giáo viên, Quản trị) qua Firestore Rules & Supabase RLS.",
                        "Serverless Cloud Functions giữ khóa API an toàn; tích hợp cơ chế nạp điểm Credit tự động qua VietQR/SePay.",
                        "Rà soát bảo vệ dữ liệu cá nhân học sinh theo Nghị định 13/2023/NĐ-CP và tuân thủ các tiêu chuẩn an toàn, đạo đức nghiên cứu theo Thông tư 84/2026/TT-BGDĐT."
                    ],
                    "Thế Duy\n(Lập trình chính)",
                    "Tệp cấu hình firestore.rules, migrations; Module tài khoản & hạn mức sử dụng."
                ),
                (
                    "Tuần 16\n(23/09 - 30/09)",
                    "Tích hợp toàn diện 11 module & Đóng gói PWA",
                    [
                        "Tích hợp toàn diện 11 module chức năng; xử lý triệt để 4 xung đột lớn (CSS, dữ liệu hạn mức, thư viện nặng, Safari iOS).",
                        "Đóng gói Progressive Web App (PWA) với Vite 5.4; cấu hình Service Worker và cache ngoại tuyến.",
                        "Triển khai sản phẩm thực tế lên Internet (https://aitk-ten.vercel.app/).",
                        "Ký xác nhận định kỳ Tháng 9 vào Nhật ký nghiên cứu (Điều 14 TT84)."
                    ],
                    "Thế Duy (Code chính),\nNguyệt Minh (Kiểm thử)",
                    "Hệ thống ELEC AI hoạt động trên Internet; Biên bản xác nhận Tháng 9 của GVHD."
                )
            ]
        },
        # THÁNG 5
        {
            "month_title": "THÁNG 5: THỰC NGHIỆM SƯ PHẠM, KIỂM ĐỊNH & HOÀN TẤT HỒ SƠ (01/10 - 30/10/2026) | Xác nhận định kỳ của GVHD: 30/10/2026",
            "weeks": [
                (
                    "Tuần 17\n(01/10 - 08/10)",
                    "Thực nghiệm sư phạm tại THPT Đông Thụy Anh",
                    [
                        "Triển khai thử nghiệm tại khối 10, 11 (Lớp Cô Hà, Lớp 11A7).",
                        "Chia nhóm thực nghiệm (dùng ELEC AI) và nhóm đối chứng (học truyền thống).",
                        "Thu thập dữ liệu bài thi trực tuyến, nhật ký nộp bài liên môn và biên bản vi phạm phòng thi."
                    ],
                    "Nguyệt Minh,\nThế Duy",
                    "Bộ dữ liệu thực nghiệm thực tế tại trường; Danh sách bài nộp và phổ điểm thi."
                ),
                (
                    "Tuần 18\n(09/10 - 15/10)",
                    "Kiểm thử chức năng, Hiệu năng & 401 ca Vitest",
                    [
                        "Chạy toàn bộ 33 tệp kiểm thử tự động với 401 ca Vitest (đạt 401/401 passed 100% trong 11.87s).",
                        "Thực hiện 36 kịch bản kiểm thử chức năng (Bảng 27) và đo hiệu năng FCP/LCP trên 3 dòng máy (Bảng 30).",
                        "Thử nghiệm chấm 35 phiếu OMR A4 thực tế (đạt độ chính xác 97.1%, 1.8s/phiếu)."
                    ],
                    "Thế Duy\n(Chính)",
                    "Biên bản kiểm thử tự động Vitest 401 ca passed; Bảng đo lường hiệu năng thực tế."
                ),
                (
                    "Tuần 19\n(16/10 - 22/10)",
                    "Khảo sát người dùng & Thống kê định lượng",
                    [
                        "Phát phiếu khảo sát 15 tiêu chí (A1-D3) cho giáo viên và học sinh; thu thập phản hồi định lượng.",
                        "Xử lý số liệu: Tỷ lệ nộp bài đạt 92.5% (tăng từ 68%), điểm trung bình tăng 18.4% (từ 6.2 lên 7.34), làm chủ câu sai đạt 88.2%.",
                        "Tổng hợp nhật ký lỗi (Bảng 24) và phân tích 4 bài học kinh nghiệm kỹ thuật."
                    ],
                    "Nguyệt Minh\n(Chính),\nThế Duy",
                    "Bộ phiếu khảo sát người dùng đã điền; Báo cáo phân tích định lượng hiệu quả sư phạm."
                ),
                (
                    "Tuần 20\n(23/10 - 30/10)",
                    "Nghiệm thu cấp trường & Đóng gói hồ sơ Điều 18",
                    [
                        "Hoàn tất Báo cáo kết quả nghiên cứu toàn văn (71 trang) chuẩn dự án kỹ thuật (Điểm b Khoản 1 Điều 3 TT84).",
                        "Soạn thảo Báo cáo tóm tắt (Abstract) KHÔNG QUÁ 300 CHỮ (Điểm b Khoản 1 Điều 3 TT84).",
                        "Lập Phiếu khai báo công nghệ số và trí tuệ nhân tạo (Điều 15 TT84).",
                        "Đóng tập Sổ nhật ký nghiên cứu (đủ 5 chữ ký định kỳ tháng của GVHD) & Dữ liệu gốc (Điều 14 TT84).",
                        "Ký Cam kết liêm chính (Điều 4 & 16 TT84); BGH tổ chức nghiệm thu trước 30/10/2026."
                    ],
                    "Thế Duy,\nNguyệt Minh,\nGVHD",
                    "Trọn bộ Hồ sơ dự thi chuẩn Điều 18 TT84; Biên bản nghiệm thu cấp trường."
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
        ("2", "Kế hoạch nghiên cứu & Thuyết minh đăng ký", "Kế hoạch nghiên cứu 5 tháng đã được Hiệu trưởng cơ sở giáo dục phê duyệt từ đầu kỳ (Tuân thủ Điều 17 Thông tư 84)."),
        ("3", "Báo cáo kết quả nghiên cứu toàn văn", "Báo cáo chi tiết 71 trang đầy đủ 4 phần chuẩn dự án kỹ thuật theo Điểm b Khoản 1 Điều 3 Thông tư 84."),
        ("4", "Báo cáo tóm tắt kết quả (Abstract)", "Độ dài giới hạn KHÔNG QUÁ 300 CHỮ phản ánh đầy đủ 4 nội dung cốt lõi của đề tài theo Điểm b Khoản 1 Điều 3 Thông tư 84."),
        ("5", "Sổ nhật ký nghiên cứu & Dữ liệu gốc", "Ghi chép liên tục từ 01/06 đến 30/10/2026; có đủ 5 chữ ký xác nhận định kỳ hàng tháng của GVHD và file dữ liệu thô (Điều 14 Thông tư 84)."),
        ("6", "Phiếu khai báo công nghệ số & AI", "Kê khai chi tiết các mô hình AI (Gemini Flash, Groq, Agnes) và thư viện kỹ thuật số theo mẫu thống nhất của Bộ GD&ĐT (Điều 15 Thông tư 84)."),
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
    r = p.add_run("Cô giáo Nguyễn Thị Thanh Hà")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))

    # Cột 2: Tổ trưởng chuyên môn
    p = s1.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run("TỔ TRƯỞNG CHUYÊN MÔN\n")
    format_run(r, size_pt=10, bold=True, color_rgb=(0, 0, 0))
    r = p.add_run("(Ký duyệt đề cương & tiến độ)\n\n\n\n\n")
    format_run(r, size_pt=9, italic=True, color_rgb=(80, 80, 80))
    r = p.add_run("(Ký và ghi rõ họ tên)")
    format_run(r, size_pt=9.5, italic=True, color_rgb=(80, 80, 80))

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
