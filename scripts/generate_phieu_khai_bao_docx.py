# -*- coding: utf-8 -*-
"""
Tạo tệp Word (.docx) PHIẾU KHAI BÁO MINH BẠCH VIỆC ỨNG DỤNG CÔNG NGHỆ SỐ VÀ TRÍ TUỆ NHÂN TẠO (AI)
Chuẩn Điều 15 Thông tư 84/2026/TT-BGDĐT & Nghị định 30/2020/NĐ-CP
Đầy đủ Mục I: Cam kết về mục đích và nguyên tắc
Mục II: Bảng kê khai chi tiết các công nghệ số & AI
Mục III: Minh chứng sử dụng trí tuệ nhân tạo (Prompt Log tương tác lặp thực tế có lỗi & sửa lỗi)
Mục IV: Giải trình cơ chế kiểm soát độ chính xác, an toàn dữ liệu và đạo đức
Dự án ELEC AI: 3 môn KHTN (Vật lý, Hóa học, Sinh học).
"""

import os
import sys
import docx
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = docx.Document()

    # Cấu hình lề trang A4 chuẩn thể thức văn bản hành chính
    for s in doc.sections:
        s.page_width = Cm(21.0)
        s.page_height = Cm(29.7)
        s.top_margin = Cm(2.0)
        s.bottom_margin = Cm(2.0)
        s.left_margin = Cm(2.5)
        s.right_margin = Cm(2.0)

    FONT_NAME = 'Times New Roman'
    COLOR_PRIMARY = RGBColor(30, 58, 138)  # #1E3A8A (Sapphire Blue)
    COLOR_INK = RGBColor(15, 23, 42)       # #0F172A
    COLOR_ALERT = RGBColor(185, 28, 28)    # #B91C1C (Crimson Red for bugs)
    COLOR_SUCCESS = RGBColor(4, 120, 87)   # #047857 (Emerald Green for verification)

    def format_run(run, font_name=FONT_NAME, size_pt=11.0, bold=False, italic=False, color_rgb=(15, 23, 42)):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb) if isinstance(color_rgb, tuple) else color_rgb
        rPr = run._element.get_or_add_rPr()
        rFonts = rPr.find(qn('w:rFonts'))
        if rFonts is None:
            rFonts = OxmlElement('w:rFonts')
            rPr.append(rFonts)
        for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
            rFonts.set(qn(attr), font_name)

    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=70, bottom=70, left=90, right=90):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin_name, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin_name}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_table_borders(table, hex_color="475569"):
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

    def set_row_cant_split(row):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

    def set_row_header(row):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

    def set_col_widths(row, widths_cm):
        for idx, width in enumerate(widths_cm):
            row.cells[idx].width = Cm(width)

    def add_p(text="", size=11.0, bold=False, italic=False, color=COLOR_INK, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3, space_before=0, line_spacing=1.18):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            run = p.add_run(text)
            format_run(run, size_pt=size, bold=bold, italic=italic, color_rgb=color)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        format_run(run, size_pt=11.5, bold=True, color_rgb=(30, 58, 138))
        return p

    # ========================================================
    # QUỐC HIỆU, TIÊU NGỮ & CƠ QUAN BAN HÀNH
    # ========================================================
    head_table = doc.add_table(rows=1, cols=2)
    head_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_col_widths(head_table.rows[0], [8.0, 8.5])
    c0, c1 = head_table.rows[0].cells

    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.line_spacing = 1.15
    r = p0.add_run("SỞ GIÁO DỤC VÀ ĐÀO TẠO HƯNG YÊN\n")
    format_run(r, size_pt=10, bold=True)
    r = p0.add_run("TRƯỜNG THPT ĐÔNG THỤY ANH\n")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(30, 58, 138))
    r = p0.add_run("————————————")
    format_run(r, size_pt=9, bold=True)

    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.line_spacing = 1.15
    r = p1.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    format_run(r, size_pt=10, bold=True)
    r = p1.add_run("Độc lập – Tự do – Hạnh phúc\n")
    format_run(r, size_pt=10.5, bold=True)
    r = p1.add_run("————————————")
    format_run(r, size_pt=9, bold=True)

    add_p("", space_after=6)

    # TIÊU ĐỀ CHÍNH
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    r_t = p_title.add_run("PHIẾU KHAI BÁO MINH BẠCH VIỆC ỨNG DỤNG\nCÔNG NGHỆ SỐ VÀ TRÍ TUỆ NHÂN TẠO (AI)")
    format_run(r_t, size_pt=14, bold=True, color_rgb=(30, 58, 138))

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(8)
    r_s = p_sub.add_run("(Kèm theo Hồ sơ dự thi Cuộc thi KHKT dành cho học sinh trung học theo Điều 15 Thông tư số 84/2026/TT-BGDĐT)")
    format_run(r_s, size_pt=10, italic=True)

    # BẢNG THÔNG TIN DỰ ÁN
    info_table = doc.add_table(rows=5, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(info_table, "CBD5E1")
    INFO_WIDTHS = [4.2, 12.3]
    for row in info_table.rows:
        set_col_widths(row, INFO_WIDTHS)
        set_row_cant_split(row)

    info_data = [
        ("Tên dự án:", "NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG LỚP HỌC SỐ TÍCH HỢP KHẢO THÍ TRỰC TUYẾN ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN (VẬT LÝ, HÓA HỌC, SINH HỌC) CHO HỌC SINH THPT"),
        ("Lĩnh vực dự thi:", "Phần mềm hệ thống (System Software) — Mã lĩnh vực: 07"),
        ("Đơn vị dự thi:", "Trường THPT Đông Thụy Anh – Sở Giáo dục và Đào tạo Hưng Yên"),
        ("Học sinh thực hiện:", "1. Nguyễn Thế Duy (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Kiến trúc hệ thống)\n2. Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Thành viên, Phụ trách nội dung liên môn KHTN, Khảo sát & Truyền thông)"),
        ("Người hướng dẫn KH:", "Cô giáo Nguyễn Thị Thanh Hà (Giáo viên trường THPT Đông Thụy Anh)")
    ]
    for idx, (lbl, val) in enumerate(info_data):
        c0, c1 = info_table.rows[idx].cells
        set_cell_background(c0, "F8FAFC")
        set_cell_margins(c0, top=50, bottom=50, left=70, right=70)
        set_cell_margins(c1, top=50, bottom=50, left=70, right=70)
        p0 = c0.paragraphs[0]; p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r0 = p0.add_run(lbl); format_run(r0, size_pt=10, bold=True)
        p1 = c1.paragraphs[0]; p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r1 = p1.add_run(val); format_run(r1, size_pt=10, bold=(idx==0))

    add_p("", space_after=4)

    # ========================================================
    # I. CAM KẾT VỀ MỤC ĐÍCH VÀ NGUYÊN TẮC
    # ========================================================
    add_h1("I. CAM KẾT VỀ MỤC ĐÍCH VÀ NGUYÊN TẮC SỬ DỤNG CÔNG NGHỆ SỐ & AI")
    add_p("1. Tính độc lập và sáng tạo: Toàn bộ thiết kế kiến trúc hệ thống 4 tầng, mã nguồn giao diện (245 component React .jsx), logic nghiệp vụ client (168 tệp .js), hệ thống 47 tệp kiểm thử tự động Vitest (486 ca test passed 100%), cơ sở dữ liệu tích hợp và kịch bản thực nghiệm sư phạm đối chứng đều do nhóm học sinh tự nghiên cứu, thiết kế và lập trình dưới sự hướng dẫn khoa học của giáo viên.")
    add_p("2. Vai trò công cụ hỗ trợ: Công nghệ số, thư viện mã nguồn mở và API Trí tuệ nhân tạo (AI) chỉ đóng vai trò hỗ trợ kỹ thuật: tra cứu thuật toán, phân tích ngữ nghĩa câu hỏi, gợi ý kịch bản sư phạm gợi mở (Scaffolding) và hỗ trợ viết kiểm thử mã nguồn.")
    add_p("3. Tuân thủ liêm chính học thuật: Không sử dụng AI để viết hộ báo cáo khoa học. Toàn bộ văn bản báo cáo, số liệu thống kê thực nghiệm và kết luận sư phạm là sản phẩm thực tế của nhóm tác giả. Lõi tính toán khoa học KHTN được xây dựng theo mô hình lai (Hybrid) với lớp công cụ tất định kiểm soát số liệu, không để AI tự ý suy diễn hoặc bịa số liệu học thuật.")

    # ========================================================
    # II. BẢNG KÊ KHAI CÔNG NGHỆ SỐ & AI
    # ========================================================
    add_h1("II. NỘI DUNG KÊ KHAI CHI TIẾT CÁC CÔNG NGHỆ SỐ VÀ CÔNG CỤ AI ĐƯỢC SỬ DỤNG")
    tech_table = doc.add_table(rows=1, cols=4)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tech_table, "475569")
    TECH_WIDTHS = [1.0, 4.5, 3.5, 7.5]
    set_col_widths(tech_table.rows[0], TECH_WIDTHS)
    set_row_header(tech_table.rows[0])

    hdr_cells = tech_table.rows[0].cells
    for i, t in enumerate(["TT", "Công nghệ / Nền tảng / Mô hình", "Nguồn gốc / Đơn vị cung cấp", "Phạm vi và Mục đích sử dụng cụ thể"]):
        set_cell_background(hdr_cells[i], "E2E8F0")
        set_cell_margins(hdr_cells[i], top=70, bottom=70, left=60, right=60)
        p = hdr_cells[i].paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(t); format_run(r, size_pt=9.5, bold=True)

    tech_items = [
        ("1", "Ngôn ngữ & Nền tảng phát triển Web\n(React 18, Vite 5.4, Tailwind CSS, JavaScript ES6+)", "Mã nguồn mở (Cộng đồng React / Meta / Vite)", "Xây dựng giao diện ứng dụng web tiến trình (PWA) đa nền tảng, phản hồi tức thì trên máy tính và điện thoại. Tối ưu nạp mô-đun lười (lazy loading), nạp trang dưới 1.2s."),
        ("2", "Hạ tầng Đám mây & Cơ sở dữ liệu\n(Firebase Auth, Firestore Realtime & Supabase PostgreSQL)", "Google Cloud Platform & Supabase Inc.", "Firebase: Xác thực người dùng, đồng bộ dữ liệu lớp học số, phiên thi và giám sát thời gian thực. Supabase: Quản lý ngân hàng đề KHTN, sổ câu sai SRS, dữ liệu điểm chuẩn tuyển sinh ĐH."),
        ("3", "API Mô hình Ngôn ngữ lớn (LLMs)\n(Google Gemini Flash/Pro API, DeepSeek AI API, Groq Llama-3 API)", "Google Cloud, DeepSeek AI, Groq Inc.", "Tích hợp vào phân hệ Trợ lý AI KHTN và Studio tạo đề thi ma trận 4 mức độ GDPT 2018. Đóng vai trò gia sư gợi ý tư duy từng bước (Scaffolding), không giải hộ."),
        ("4", "Lõi Khoa học Tất định Toán - Lý - Hóa - Sinh\n(scientificTools.js, chemBalance.js)", "Nhóm học sinh tự nghiên cứu & lập trình thuật toán", "Khắc phục triệt để ảo giác số liệu của AI: khử Gauss-Jordan BigInt cân bằng phản ứng, stoichiometry, pH; giải dao động điều hòa, mạch RLC xoay chiều, khí lý tưởng; di truyền Menđen, Hardy-Weinberg, bảng mã di truyền 64 bộ ba."),
        ("5", "Thị giác Máy tính Chấm trắc nghiệm A4 (OMR Scanner)\n(Pure JavaScript - src/lib/omr.js)", "Nhóm học sinh tự phát triển trên Canvas API", "Quét phiếu trả lời trắc nghiệm giấy A4 mẫu Bộ GD&ĐT 2025 (đủ 3 phần thi) trực tiếp qua camera/ảnh chụp trên máy khách bằng biến đổi Homography và trích xuất Kênh Đỏ (Red Channel)."),
        ("6", "Thị giác Máy tính Giám sát Thi & Tương tác Cử chỉ\n(Google MediaPipe Tasks Vision)", "Google MediaPipe (Mã nguồn mở)", "Giám sát thi: Phát hiện quay mặt khỏi màn hình, mất mặt, xuất hiện người lạ qua webcam ngay trên trình duyệt (Edge AI). Gamification: Nhận diện cử chỉ tay (A, B, C, D) trả lời câu hỏi ôn tập."),
        ("7", "Đồ họa Không gian 3D Mô phỏng Thí nghiệm KHTN\n(Three.js, @react-three/fiber)", "Thư viện đồ họa mã nguồn mở Three.js", "Xây dựng phòng thí nghiệm ảo 3D trực quan: phản ứng hóa học (tỏa nhiệt, sủi bọt, kết tủa đổi màu, đo pH); mô phỏng tương tác mạch điện & quang hình Vật lý; mô hình xoay 3D phân tử ADN & phân bào Sinh học."),
        ("8", "Công cụ Kiểm thử Tự động & Quản lý Mã nguồn\n(Vitest, Tesseract.js OCR, GitHub)", "Công cụ kiểm thử và mã nguồn mở", "Vitest: Kiểm thử tự động toàn diện 486 ca kiểm thử lõi KHTN đạt passed 100% trong 11.56s. Tesseract.js: Nhận dạng ký tự quang học bài tập ngoại tuyến trên máy khách.")
    ]

    for idx, (stt, name, prov, purpose) in enumerate(tech_items):
        row = tech_table.add_row()
        set_col_widths(row, TECH_WIDTHS)
        set_row_cant_split(row)
        bg = "FAFAFA" if idx % 2 == 1 else "FFFFFF"

        for c_idx, cell in enumerate(row.cells):
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=50, bottom=50, left=50, right=50)

        c0, c1, c2, c3 = row.cells
        p0 = c0.paragraphs[0]; p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p0.add_run(stt); format_run(r, size_pt=9.5, bold=True)
        p1 = c1.paragraphs[0]; p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p1.add_run(name); format_run(r, size_pt=9.5, bold=True)
        p2 = c2.paragraphs[0]; p2.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p2.add_run(prov); format_run(r, size_pt=9.0)
        p3 = c3.paragraphs[0]; p3.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p3.paragraph_format.line_spacing = 1.15
        r = p3.add_run(purpose); format_run(r, size_pt=9.0)

    add_p("", space_after=6)

    # ========================================================
    # III. MỤC 2: MINH CHỨNG SỬ DỤNG TRÍ TUỆ NHÂN TẠO (PROMPT LOG)
    # ========================================================
    add_h1("III. MINH CHỨNG SỬ DỤNG TRÍ TUỆ NHÂN TẠO (PROMPT LOG - QUÁ TRÌNH THỰC TẾ CÓ LỖI & DEBUG)")
    add_p("Theo quy định tại Điều 15 Thông tư 84/2026/TT-BGDĐT: Nhóm tác giả cung cấp Nhật ký câu lệnh (Prompt Log) thể hiện chân thực quá trình tương tác lặp (Iterative Prompting), các lỗi kỹ thuật/ảo giác số liệu thực tế phát sinh từ AI, câu lệnh chất vấn bắt lỗi của học sinh và giải pháp tự lập trình kiểm chứng độc lập của nhóm tác giả (đã xóa PII).", size=10, italic=True)

    prompt_logs = [
        {
            "badge": "MINH CHỨNG 1: Xây dựng Lõi Cân bằng Phản ứng Hóa học Tất định & Khắc phục Lỗi Số học của AI",
            "tool": "DeepSeek-Coder (DeepSeek AI) & Google Gemini 1.5 Pro",
            "target": "Xây dựng hàm JavaScript độc lập balanceEquation(rawEq) cân bằng mọi phản ứng vô cơ/hữu cơ THPT, xử lý được chất ngậm nước (CuSO4·5H2O), gốc nhóm ngoặc lồng nhau (Fe2(SO4)3) mà không dùng thư viện ngoài.",
            "turn1_prompt": "Viết cho tôi một hàm JavaScript cân bằng phương trình hóa học bằng cách giải hệ phương trình tuyến tính đại số ma trận.",
            "turn1_response": "AI đưa ra đoạn code dùng thư viện mathjs và kiểu số thực Number (Float 64-bit) thông thường để khử Gauss ma trận, sau đó làm tròn bằng Math.round().",
            "error_encountered": [
                "Lỗi 1 (Sai số dấu phẩy động - Floating Point Bug): Khi kiểm thử phương trình oxi hóa - khử phức tạp: KMnO4 + FeSO4 + H2SO4 -> Fe2(SO4)3 + K2SO4 + MnSO4 + H2O, máy tính ra nghiệm phân số 2.9999999999999995 và hàm làm tròn sai khiến hệ số cân bằng bị lệch, phương trình không bảo toàn nguyên tố.",
                "Lỗi 2 (Crash phân tích cú pháp - Regex Syntax Error): Khi gặp chất có ngoặc hoặc ngậm nước như CuSO4·5H2O hoặc Al2(SO4)3, biểu thức Regex đơn giản của AI văng lỗi: TypeError: Cannot read properties of undefined (reading 'elements')."
            ],
            "turn2_prompt": "Code của bạn bị 2 lỗi nghiêm trọng khi chạy thực tế:\n1. Dùng Number bị sai số dấu phẩy động làm hỏng bảo toàn nguyên tố phương trình oxi hóa khử KMnO4 + FeSO4. Tôi cần thuật toán khử Gauss-Jordan ma trận bậc thang rút gọn (RREF) giải hoàn toàn trên phân số hữu tỉ gồm 2 số nguyên lớn BigInt (tử số / mẫu số), kèm hàm tìm Bội chung nhỏ nhất (LCM) để quy đồng ra hệ số nguyên dương tối giản tuyệt đối.\n2. Hàm tách nguyên tử của bạn dùng Regex không parse được ngoặc lồng nhau và dấu chấm ngậm nước. Hãy gợi ý cho tôi cấu trúc dữ liệu Ngăn xếp (Stack Parser) để duyệt từng ký tự chuỗi hóa học.",
            "turn2_response": "AI thừa nhận hạn chế của kiểu số Number thông thường, cung cấp giải thuật lớp FractionBigInt (phép cộng/trừ/nhân/chia phân số rút gọn bằng thuật toán Euclid GCD) và mô hình Stack để nhân hệ số ngoặc từ trong ra ngoài.",
            "human_impl": "Nhóm tự tay viết lại toàn bộ mã nguồn vào tệp src/lib/chemBalance.js (không sử dụng mathjs giúp web nhẹ hơn 3.2MB). Tự lập trình bộ phân tích cú pháp 3 giai đoạn: Chuẩn hóa ký tự -> Ngăn xếp phân tích ngoặc -> Lập ma trận nguyên tố -> Khử Gauss-Jordan RREF BigInt. Viết 14 ca kiểm thử tự động trong tests/chemBalance.test.js kiểm tra từ phản ứng đơn giản đến các phản ứng hữu cơ Este, Peptit, chất ngậm nước. Kết quả: 14/14 tests pass 100% trong 31ms."
        },
        {
            "badge": "MINH CHỨNG 2: Thiết kế System Prompt Sư phạm Gợi mở (Scaffolding) & Chống Ảo giác (Anti-Hallucination)",
            "tool": "Google Gemini API (Gemini 2.0 Flash / Gemini 1.5 Flash)",
            "target": "Thiết lập System Prompt sư phạm cho Trợ lý ELEC AI: đóng vai gia sư định hướng tư duy theo phương pháp Socrates, chia bài toán thành các chặng nhỏ (Scaffolding), tuyệt đối không giải hộ và không bịa số liệu.",
            "turn1_prompt": "Bạn là gia sư AI dạy Vật lý, Hóa học, Sinh học THPT. Hãy đóng vai một người thầy nhiệt tình, giúp học sinh giải các bài tập KHTN một cách dễ hiểu nhất.",
            "turn1_response": "AI đóng vai giáo viên khen ngợi, nhưng luôn giải trọn vẹn cả bài từ bước 1 đến đáp số cuối cùng ngay trong câu trả lời đầu tiên.",
            "error_encountered": [
                "Lỗi 1 (Giải hộ toàn bộ - Triệt tiêu tư duy học sinh): Khi học sinh paste câu hỏi: 'Hòa tan hoàn toàn 5.4g Al vào dung dịch HCl dư, tính thể tích H2 thu được (đktc)?', AI lập tức tuôn ra toàn bộ lời giải và đáp số 6.72 lít từ dòng đầu tiên. Học sinh chỉ việc chép bài mà không cần suy nghĩ gì, vi phạm tiêu chí sư phạm của dự án.",
                "Lỗi 2 (Ảo giác số liệu - Hallucination): Ở bài tập pH dung dịch hỗn hợp axit yếu, AI tự ý làm tròn số bừa bãi: -log(0.025) AI tính thành 1.4 (thực tế là 1.602), dẫn đến chọn sai đáp án trắc nghiệm chuẩn của Bộ GD&ĐT."
            ],
            "turn2_prompt": "System Prompt như vậy thất bại hoàn toàn về mặt sư phạm:\n1. Học sinh chỉ việc copy-paste đáp án để đối phó bài tập về nhà. Tôi cần một kịch bản Scaffolding 3 bước nghiêm ngặt: Bước 1 chỉ hỏi học sinh dữ kiện đã biết và công thức cần dùng; Bước 2 nhận xét câu trả lời của học sinh; Bước 3 mới xác nhận đáp án. Tuyệt đối không đưa ra lời giải hoàn chỉnh ở phản hồi đầu tiên.\n2. Về số liệu: Hệ thống web của tôi đã có sẵn công cụ tính toán tất định trong scientificTools.js. Hãy thiết kế khối tiếp nhận [DỮ LIỆU ĐÃ TÍNH TOÁN BẰNG TOOL CHÍNH XÁC: {...}] trong prompt. Ép AI bắt buộc phải dùng con số này, nếu AI tự tính ra con số khác thì hệ thống coi như vi phạm nguyên tắc bảo toàn.",
            "turn2_response": "AI đề xuất kiến trúc Prompt phân tầng 5 khối: IDENTITY & SOCRATIC PEDAGOGY (Quy định bắt buộc không đưa đáp án ở turn 1), TOOL GROUNDING CONTRACT (Quy ước số liệu bất khả xâm phạm), SUBJECT ADAPTATION (Phân chia phong cách Lý / Hóa / Sinh), FALLBACK SAFETY (Cách xử lý khi học sinh nói 'Em không biết làm').",
            "human_impl": "Nhóm tích hợp cấu trúc này vào src/lib/aiPrompts.js và điều phối qua src/lib/aiRouter.js. Bổ sung cơ chế Hậu kiểm cục bộ (Client-side Post-Check Verification): Trước khi hiển thị tin nhắn của AI lên màn hình, hàm JavaScript chạy đối soát; nếu AI nhắc đến giá trị khối lượng mol hoặc pH sai lệch > 0.5% so với kết quả của scientificTools.js, giao diện sẽ tự động ghim nhãn vàng cảnh báo: '⚠️ Lưu ý: Con số này có thể chưa chính xác, hãy bấm kiểm tra lại bằng công cụ tính toán nội bộ'. Thử nghiệm với 86 phiên trò chuyện thực nghiệm tại trường THPT Đông Thụy Anh, tỷ lệ gợi mở tư duy đạt 94.2%."
        },
        {
            "badge": "MINH CHỨNG 3: Bóc tách Đề thi Word/PDF sang Ma trận 4 Mức độ GDPT 2018 (AutoExam Studio)",
            "tool": "Groq Llama-3-70B & Google Gemini 1.5 Flash",
            "target": "Chuyển đổi tệp đề thi thực tế (dạng thô .docx hoặc .pdf tải từ các Sở GD&ĐT) thành cấu trúc JSON chuẩn hóa gồm 3 phần thi theo format mới nhất của Bộ GD&ĐT 2025: Phần I (4 lựa chọn), Phần II (Đúng/Sai 4 ý a,b,c,d), Phần III (Điền số ngắn), tự động gắn thẻ ma trận nhận thức (NB, TH, VD, VDC).",
            "turn1_prompt": "Dưới đây là nội dung toàn bộ tệp đề thi thử KHTN tốt nghiệp THPT 2025 dài 8 trang. Hãy đọc và xuất ra cho tôi mảng JSON chứa tất cả câu hỏi, đáp án đúng và mức độ nhận thức của từng câu.",
            "turn1_response": "AI bắt đầu đọc văn bản và tạo JSON, nhưng dừng lại đột ngột ở câu 28 do hết giới hạn output tokens.",
            "error_encountered": [
                "Lỗi 1 (Tràn ngữ cảnh & Nuốt câu hỏi - Context Cutoff): Do đề thi dài và chứa nhiều công thức, AI xử lý đến câu 28 thì cạn output token, chuỗi JSON bị đứt gãy giữa chừng gây lỗi cú pháp nghiêm trọng: SyntaxError: Unexpected end of JSON input at JSON.parse().",
                "Lỗi 2 (Nhận diện sai dạng thức đề thi mới): Đề thi 2025 có Phần II (Đúng/Sai gồm 4 ý a, b, c, d), nhưng AI lại gom gộp nhầm thành một câu trắc nghiệm 4 phương án A, B, C, D truyền thống, làm sai lệch hoàn toàn biểu điểm khảo thí (1 ý đúng được 0.1đ, 4 ý đúng được 1.0đ).",
                "Lỗi 3 (Lỗi công thức hóa học & số mũ): Các ký hiệu Fe^{3+}, SO_4^{2-}, lambda = 0.5 um bị biến thành ký tự rác Fe3+, SO42-, l = 0.5um."
            ],
            "turn2_prompt": "Cách làm gửi toàn bộ tệp văn bản cho AI là phi thực tế vì tốn chi phí token và thường xuyên làm gãy JSON. Tôi quyết định chia bài toán thành mô hình xử lý 2 lớp (Two-Pass Architecture):\n- Lớp 1 (Tiền xử lý Regex thuần trên Client): Tôi sẽ dùng JavaScript bóc tách thô tệp Word thành từng khối câu hỏi riêng biệt dựa trên biểu thức chính quy nhận diện tiêu đề 'Câu 1:', 'Phần I', 'Phần II'.\n- Lớp 2 (AI phân tích ngữ nghĩa từng câu): Hãy viết cho tôi JSON Schema chuẩn nghiêm ngặt và hàm phân loại câu hỏi với đầu ra JSON có định dạng: { id, part: 1|2|3, format: 'MCQ'|'TF'|'SHORT_ANSWER', stem, subQuestions?: [{id: 'a', content, correct: true}], level: 'NB'|'TH'|'VD'|'VDC' }. Hướng dẫn cách xử lý ký tự công thức Toán/Lý/Hóa bằng cú pháp LaTeX chuẩn để thư viện KaTeX hiển thị được.",
            "turn2_response": "AI cung cấp bộ mẫu Regex tối ưu cho 3 dạng thức đề thi mới, đồng thời cung cấp hàm ép kiểu JSON an toàn (JSON repair parser) loại bỏ các ký tự Markdown thừa ```json để tránh lỗi JSON.parse().",
            "human_impl": "Nhóm tự tay xây dựng hai module: src/lib/examParser.js (xử lý Regex và KaTeX thuần tốc độ < 0.1 giây) và src/lib/matrixAiService.js (gửi xử lý song song các câu hỏi qua hàng đợi API). Thử nghiệm bóc tách thành công 35 đề thi thử tốt nghiệp THPT thực tế của các Sở GD&ĐT Hà Nội, Nam Định, Nghệ An, Hưng Yên với độ chính xác phân loại mức độ đạt 91.4%."
        },
        {
            "badge": "MINH CHỨNG 4: Giải thuật Nắn ảnh Homography & Tách Kênh Đỏ chấm Phiếu OMR (src/lib/omr.js)",
            "tool": "DeepSeek-Coder & Claude 3.5 Sonnet",
            "target": "Viết thuật toán thị giác máy tính chấm phiếu trắc nghiệm A4 (mẫu Bộ GD&ĐT 2025) chạy 100% trên Canvas trình duyệt của máy khách (Client-side Edge AI), không gửi ảnh về server để bảo vệ quyền riêng tư và tốc độ phản hồi tức thì.",
            "turn1_prompt": "Viết code JavaScript sử dụng OpenCV.js để tìm 4 góc của tờ giấy thi trắc nghiệm và nắn thẳng ảnh (warp perspective) để đọc ô tô trắc nghiệm.",
            "turn1_response": "AI cung cấp đoạn mã JavaScript phụ thuộc thư viện opencv.js và hàm cv.warpPerspective().",
            "error_encountered": [
                "Lỗi 1 (Dung lượng thư viện quá nặng): Thư viện opencv.js có dung lượng lên tới 8.4MB WebAssembly, khi học sinh hoặc giáo viên tải trang trên điện thoại bằng mạng 4G/3G trường học mất hơn 15 giây mới nạp xong, gây đơ trình duyệt di động.",
                "Lỗi 2 (Nắn ảnh bị lộn ngược và đen sì): Nhóm yêu cầu AI bỏ opencv.js và tự viết hàm giải ma trận Homography 3x3 bằng thuật toán DLT. Tuy nhiên, code AI đưa ra sắp xếp sai thứ tự 4 góc định vị (Top-Left, Top-Right, Bottom-Right, Bottom-Left), dẫn đến ma trận nghịch đảo H^{-1} tính sai khiến ảnh nắn ra bị lộn ngược 180 độ hoặc bị biến dạng thành vệt đen.",
                "Lỗi 3 (Nhầm lẫn mực in màu hồng với vết tô bút chì): Phiếu thi của Bộ GD&ĐT in khung và chữ số bằng mực màu hồng cánh sen. Thuật toán nhị phân hóa (Thresholding) thang độ xám (Grayscale) của AI nhận diện toàn bộ khung viền hồng là... đáp án tô chì 2B!"
            ],
            "turn2_prompt": "Code tự viết của bạn gặp 2 lỗi nghiêm trọng:\n1. Ma trận Homography tính theo thuật toán khử Gauss 8 phương trình bị lỗi hoán vị hàng (Row Pivoting), làm ảnh nắn ra bị xoay ngược đầu đuôi. Thứ tự 4 điểm mốc góc của tôi trên Canvas là: TL(0,0), TR(width, 0), BR(width, height), BL(0, height). Hãy viết lại thuật toán tính ma trận Homography chuẩn xác bằng giải thuật đại số tuyến tính trực tiếp.\n2. Về xử lý màu sắc: Tại sao lại chuyển ảnh về Grayscale khiến viền in màu hồng bị biến thành màu xám và đè lên vết chì? Tôi nhận thấy mực in màu hồng có thành phần Kênh Đỏ (Red Channel) rất lớn (R ≈ 230 - 255) tương đương nền giấy trắng (R ≈ 255), trong khi than chì bút chì 2B thì hấp thụ ánh sáng mạnh trên cả 3 kênh (R, G, B <= 80). Hãy cho tôi giải thuật tách độc lập Kênh Đỏ (Red Channel Extraction) trên mảng ImageData.data của Canvas HTML5 để triệt tiêu hoàn toàn khung in màu hồng!",
            "turn2_response": "AI thừa nhận sai sót trong việc sắp xếp tọa độ điểm đích và phép khử Gauss không chọn phần tử trục (partial pivoting). AI cung cấp lại công thức giải hệ 8 phương trình tìm ma trận biến đổi phối cảnh 2D Homography chuẩn xác, và đồng thuận giải pháp trích xuất Kênh Đỏ: Pixel_{processed} = Pixel_{Red}, sau đó áp dụng ngưỡng thích nghi Otsu cục bộ.",
            "human_impl": "Nhóm tự tay lập trình tệp src/lib/omr.js và src/lib/omrSheetGenerator.js bằng JavaScript thuần 100% (dung lượng mã nguồn chưa đến 38KB, không phụ thuộc bất kỳ thư viện ngoài nào). Tự thiết kế thuật toán bù trừ độ sáng bất đối xứng (khi học sinh chụp ảnh bài thi bị bóng bàn tay hoặc đèn phòng học chiếu xiên). Kiểm thử thực tế trên 50 phiếu thi trắc nghiệm A4 của học sinh khối 11 và khối 12 trường THPT Đông Thụy Anh, đạt độ chính xác chấm điểm 98.2%, thời gian xử lý cực nhanh: 1.2 giây/phiếu."
        }
    ]

    for p_idx, item in enumerate(prompt_logs):
        log_table = doc.add_table(rows=1, cols=1)
        log_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_box = log_table.rows[0].cells[0]
        c_box.width = Cm(16.5)
        set_cell_background(c_box, "F8FAFC")
        set_cell_margins(c_box, top=70, bottom=70, left=80, right=80)
        
        # Border xanh dương chuyên nghiệp
        tcPr = c_box._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="3B82F6"/>'
            f'  <w:left w:val="single" w:sz="18" w:space="0" w:color="1D4ED8"/>'
            f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="3B82F6"/>'
            f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="3B82F6"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)

        p = c_box.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(2)
        
        # Tiêu đề & Công cụ
        r = p.add_run(f"{item['badge']}\n")
        format_run(r, size_pt=10.5, bold=True, color_rgb=(30, 58, 138))
        
        r = p.add_run("• Tên công cụ AI: ")
        format_run(r, size_pt=10, bold=True)
        r = p.add_run(f"{item['tool']}\n")
        format_run(r, size_pt=10, italic=True)

        r = p.add_run("• Mục tiêu kỹ thuật: ")
        format_run(r, size_pt=10, bold=True)
        r = p.add_run(f"{item['target']}\n\n")
        format_run(r, size_pt=9.5)

        # Lượt 1
        r = p.add_run("1. Lượt hỏi ban đầu (Initial Prompt - Đã xóa PII):\n")
        format_run(r, size_pt=10, bold=True, color_rgb=(71, 85, 105))
        r = p.add_run(f"   \"{item['turn1_prompt']}\"\n")
        format_run(r, size_pt=9.5, italic=True, color_rgb=(51, 65, 85))

        r = p.add_run("2. Phản hồi ban đầu của AI (Initial AI Output):\n")
        format_run(r, size_pt=10, bold=True, color_rgb=(71, 85, 105))
        r = p.add_run(f"   {item['turn1_response']}\n\n")
        format_run(r, size_pt=9.5, color_rgb=(30, 41, 59))

        # Lỗi phát sinh thực tế (Highlight đỏ)
        r = p.add_run("3. Lỗi phát sinh trong thực tế kiểm thử của nhóm (Errors Encountered):\n")
        format_run(r, size_pt=10, bold=True, color_rgb=(185, 28, 28))
        for err in item['error_encountered']:
            r = p.add_run(f"   [!] {err}\n")
            format_run(r, size_pt=9.5, color_rgb=(185, 28, 28))
        p.add_run("\n")

        # Lượt 2: Học sinh bắt lỗi & Debug
        r = p.add_run("4. Lượt hỏi chất vấn & Bắt lỗi AI của học sinh (Follow-up Debug Prompt):\n")
        format_run(r, size_pt=10, bold=True, color_rgb=(37, 99, 235))
        r = p.add_run(f"   \"{item['turn2_prompt']}\"\n")
        format_run(r, size_pt=9.5, italic=True, color_rgb=(30, 58, 138))

        r = p.add_run("5. Phản hồi sửa lỗi & Đề xuất giải thuật của AI (Corrected AI Output):\n")
        format_run(r, size_pt=10, bold=True, color_rgb=(71, 85, 105))
        r = p.add_run(f"   {item['turn2_response']}\n\n")
        format_run(r, size_pt=9.5, color_rgb=(30, 41, 59))

        # Đánh giá & Tự lập trình (Highlight xanh lá)
        r = p.add_run("6. Đánh giá & Tự lập trình của nhóm học sinh (Human Implementation & Vitest Verification):\n")
        format_run(r, size_pt=10, bold=True, color_rgb=(4, 120, 87))
        r = p.add_run(f"   {item['human_impl']}")
        format_run(r, size_pt=9.5, color_rgb=(15, 23, 42))

        add_p("", space_after=5)

    # ========================================================
    # IV. CƠ CHẾ BẢO MẬT VÀ ĐẠO ĐỨC
    # ========================================================
    add_h1("IV. GIẢI TRÌNH CƠ CHẾ KIỂM SOÁT ĐỘ CHÍNH XÁC, AN TOÀN DỮ LIỆU VÀ ĐẠO ĐỨC")
    add_p("1. Cơ chế Kiểm soát Độ chính xác (Zero-Hallucination Policy): Triệt để áp dụng nguyên lý 'Code tất định tính trước – AI lập luận sư phạm sau'. Mọi bài toán định lượng (khối lượng mol, nồng độ mol, pH dung dịch, chu kỳ con lắc, tổng trở RLC, tần số alen di truyền) đều bắt buộc giải qua thư viện thuần scientificTools.js và chemBalance.js. Kết quả số học được đưa vào làm ngữ cảnh bất khả xâm phạm của LLM. Hệ thống có module hậu kiểm (Post-verifier) tự động đối soát; nếu AI phản hồi sai lệch quá ngưỡng cho phép, hệ thống lập tức chặn tin nhắn sai và gắn cảnh báo trực quan cho học sinh.")
    add_p("2. Cơ chế Bảo vệ Dữ liệu Riêng tư (PII & Data Privacy Protection): Tuyệt đối không gửi thông tin định danh của học sinh (họ tên, ngày sinh, trường lớp, số điện thoại, kết quả bài thi) lên các API AI bên ngoài. Dữ liệu gửi lên AI chỉ bao gồm nội dung văn bản thuần túy của câu hỏi KHTN cần giải đáp. Toàn bộ mã định danh học sinh được bảo vệ an toàn trên hạ tầng Firebase Auth.")
    add_p("3. Cơ chế Đạo đức trong Giám sát Khảo thí (Ethical AI & MediaPipe): Giám sát phòng thi phân tích luồng thị giác hoàn toàn cục bộ trên thiết bị của học sinh qua thư viện MediaPipe (Edge AI). Hệ thống tuyệt đối không truyền phát video luồng liên tục và không ghi âm về máy chủ, chỉ chụp ảnh nhỏ (snapshot) làm bằng chứng kiểm toán tại thời điểm xảy ra hành vi vi phạm quy chế kéo dài.")

    add_p("", space_after=8)

    # ========================================================
    # CHỮ KÝ PHÊ DUYỆT
    # ========================================================
    p_date = add_p("Hưng Yên, ngày 30 tháng 10 năm 2026", size=10.5, italic=True, align=WD_ALIGN_PARAGRAPH.RIGHT, space_after=4)

    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_col_widths(sig_table.rows[0], [8.0, 8.5])
    set_row_cant_split(sig_table.rows[0])

    s0, s1 = sig_table.rows[0].cells
    p0 = s0.paragraphs[0]; p0.alignment = WD_ALIGN_PARAGRAPH.CENTER; p0.paragraph_format.line_spacing = 1.15
    r = p0.add_run("NGƯỜI HƯỚNG DẪN NGHIÊN CỨU\n")
    format_run(r, size_pt=10.5, bold=True)
    r = p0.add_run("(Ký, ghi rõ họ tên và xác nhận tính minh bạch)\n\n\n\n\n")
    format_run(r, size_pt=9.5, italic=True)
    r = p0.add_run("Nguyễn Thị Thanh Hà")
    format_run(r, size_pt=11, bold=True)

    p1 = s1.paragraphs[0]; p1.alignment = WD_ALIGN_PARAGRAPH.CENTER; p1.paragraph_format.line_spacing = 1.15
    r = p1.add_run("HỌC SINH / TRƯỞNG NHÓM\n")
    format_run(r, size_pt=10.5, bold=True)
    r = p1.add_run("(Ký, ghi rõ họ tên và cam kết liêm chính học thuật)\n\n\n\n\n")
    format_run(r, size_pt=9.5, italic=True)
    r = p1.add_run("Nguyễn Thế Duy")
    format_run(r, size_pt=11, bold=True)

    output_path = os.path.abspath("PHIEU_KHAI_BAO_MINH_BACH_AI_THONG_TU_84.docx")
    doc.save(output_path)
    print("SUCCESS: PHIEU_KHAI_BAO_MINH_BACH_AI_THONG_TU_84.docx generated cleanly with realistic bug logs.")

if __name__ == "__main__":
    create_document()
