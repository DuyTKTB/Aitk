# -*- coding: utf-8 -*-
"""
Tạo tệp Word (.docx) Báo cáo nghiên cứu khoa học ELEC AI
Thể thức chuẩn văn bản kỹ thuật hành chính theo Nghị định 30/2020/NĐ-CP & Thông tư 84/2026/TT-BGDĐT
Đề tài: ELEC AI - HỆ SINH THÁI LỚP HỌC SỐ, KHẢO THÍ ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN CẤP THPT
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

    # Cấu hình lề trang A4 chuẩn kỹ thuật: Trên 2cm, Dưới 2cm, Trái 3cm, Phải 2cm
    for s in doc.sections:
        s.page_width = Cm(21.0)
        s.page_height = Cm(29.7)
        s.top_margin = Cm(2.0)
        s.bottom_margin = Cm(2.0)
        s.left_margin = Cm(3.0)
        s.right_margin = Cm(2.0)

    FONT_NAME = 'Times New Roman'
    COLOR_PRIMARY = RGBColor(30, 58, 138)  # #1E3A8A
    COLOR_INK = RGBColor(15, 23, 42)       # #0F172A
    COLOR_MUTED = RGBColor(71, 85, 105)    # #475569

    def format_run(run, font_name=FONT_NAME, size_pt=13, bold=False, italic=False, color_rgb=(15, 23, 42)):
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

    def add_p(text="", size=13, bold=False, italic=False, color=COLOR_INK, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4, space_before=0, line_spacing=1.25):
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
        p = add_p(text, size=15, bold=True, color=COLOR_PRIMARY, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=6)
        return p

    def add_h2(text):
        p = add_p(text, size=13.5, bold=True, color=COLOR_PRIMARY, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=4)
        return p

    def add_h3(text):
        p = add_p(text, size=13, bold=True, color=COLOR_INK, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=6, space_after=2)
        return p

    # --- TRANG BÌA ---
    p_sod = add_p("SỞ GIÁO DỤC VÀ ĐÀO TẠO HƯNG YÊN", size=13, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    p_cuc = add_p("CUỘC THI KHKT HỌC SINH TRUNG HỌC NĂM HỌC 2026 - 2027", size=12, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=36)

    p_rep = add_p("BÁO CÁO NGHIÊN CỨU KHOA HỌC", size=18, bold=True, color=COLOR_PRIMARY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)
    
    p_duan = add_p("DỰ ÁN:\n“ELEC AI - HỆ SINH THÁI LỚP HỌC SỐ, KHẢO THÍ ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN CẤP THPT”", size=15, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=24, line_spacing=1.3)

    p_field = add_p("Lĩnh vực dự thi: 07- Máy tính (Hệ thống phần mềm)", size=13, bold=True, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=60)

    # Khung tác giả
    box_table = doc.add_table(rows=1, cols=1)
    box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = box_table.rows[0].cells[0]
    c.width = Cm(15.0)
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>')
    c._tc.get_or_add_tcPr().append(shd)

    p_box = c.paragraphs[0]
    p_box.paragraph_format.line_spacing = 1.25
    r = p_box.add_run("Học sinh thực hiện:\n")
    format_run(r, size_pt=12, bold=True)
    r = p_box.add_run("1. Nguyễn Thế Duy (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Kiến trúc hệ thống)\n2. Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Thành viên, Phụ trách nội dung liên môn KHTN)\n")
    format_run(r, size_pt=11.5)
    r = p_box.add_run("Người hướng dẫn khoa học: ")
    format_run(r, size_pt=12, bold=True)
    r = p_box.add_run("Cô giáo Nguyễn Thị Thanh Hà (Trường THPT Đông Thụy Anh)\n")
    format_run(r, size_pt=11.5)

    add_p("", space_after=40)
    p_loc = add_p("HƯNG YÊN - 2026", size=13, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=40)

    # Ngắt trang sang Mục lục
    doc.add_page_break()

    # --- MỤC LỤC ---
    add_p("MỤC LỤC", size=16, bold=True, color=COLOR_PRIMARY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    toc_items = [
        ("PHẦN I: VẤN ĐỀ CẦN GIẢI QUYẾT", "1"),
        ("  1. Lý do chọn đề tài", "1"),
        ("  2. Tổng quan nghiên cứu và các giải pháp hiện có", "2"),
        ("  3. Mục tiêu kỹ thuật và vấn đề dự án cần giải quyết", "3"),
        ("  4. Phạm vi nghiên cứu và giới hạn kỹ thuật", "3"),
        ("PHẦN II: THIẾT KẾ VÀ PHƯƠNG PHÁP NGHIÊN CỨU", "4"),
        ("  1. Kiến trúc tổng thể hệ thống (Hybrid Client-Edge 4 tầng)", "4"),
        ("  2. Thiết kế chi tiết các phân hệ chức năng", "5"),
        ("  3. Phương pháp nghiên cứu và công cụ thực hiện", "6"),
        ("PHẦN III. QUY TRÌNH THIẾT KẾ, XÂY DỰNG VÀ THỬ NGHIỆM HỆ THỐNG", "7"),
        ("  1. Khảo sát nhu cầu và đặc tả yêu cầu cốt lõi (28 FR & 12 NFR)", "7"),
        ("  2. Luồng xử lý dữ liệu và mô hình cơ sở dữ liệu tích hợp", "8"),
        ("  3. Thiết kế giao diện và tối ưu hóa trải nghiệm (UX)", "9"),
        ("  4. Hiện thực hóa các module kỹ thuật trọng tâm", "10"),
        ("  5. Tích hợp, triển khai và vận hành (CI/CD)", "13"),
        ("  6. Kiểm thử hiệu năng và Đánh giá thực nghiệm", "14"),
        ("PHẦN IV: KẾT QUẢ, KẾT LUẬN VÀ KHẢ NĂNG ỨNG DỤNG", "15"),
        ("  1. Kết quả nghiên cứu đạt được và phân tích định lượng", "15"),
        ("  2. Tính mới và tính sáng tạo", "16"),
        ("  3. Khả năng ứng dụng và chuyển giao thực tiễn", "18"),
        ("  4. Kết luận và định hướng phát triển công nghệ", "19"),
        ("TÀI LIỆU THAM KHẢO", "20"),
    ]
    for item, page in toc_items:
        p_toc = doc.add_paragraph()
        p_toc.paragraph_format.space_after = Pt(3)
        p_toc.paragraph_format.line_spacing = 1.15
        is_sec = item.startswith("PHẦN") or item.startswith("TÀI")
        r1 = p_toc.add_run(item)
        format_run(r1, size_pt=11.5, bold=is_sec, color_rgb=(0,0,0) if is_sec else (50,50,50))

    # Ngắt trang sang Nội dung chính
    doc.add_page_break()

    # --- PHẦN I ---
    add_h1("PHẦN I: VẤN ĐỀ CẦN GIẢI QUYẾT")
    
    add_h2("1. Lý do chọn đề tài")
    add_h3("1.1. Bối cảnh đổi mới khảo thí & Lộ trình thi THPT trên máy tính của Bộ GD&ĐT")
    add_p("Bộ Giáo dục và Đào tạo đã xác định định hướng chiến lược: tổ chức kỳ thi tốt nghiệp THPT trên máy tính là xu thế tất yếu trong lộ trình chuyển đổi số giáo dục giai đoạn 2025 – 2030, từng bước thí điểm và nhân rộng trên phạm vi toàn quốc (được cụ thể hóa tại Công văn số 5548/BGDĐT-QLCL).")
    add_p("Đối với học sinh THPT, việc sớm tiếp cận và hình thành năng lực khảo thí số là yêu cầu cấp thiết: làm quen với giao diện đề thi điện tử, thao tác trả lời các định dạng câu hỏi mới theo Chương trình GDPT 2018 (Trắc nghiệm nhiều lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn); rèn luyện kỹ năng phân bổ thời gian và tôi luyện tâm lý làm bài thi trên màn hình thiết bị số.")
    add_p("Đối với đội ngũ giáo viên, chuyển đổi số đòi hỏi sự kết hợp hài hòa giữa quy trình kiểm tra đánh giá truyền thống và kiểm tra số hóa: xây dựng ngân hàng câu hỏi chuẩn hóa, biên soạn đề theo ma trận và bản đặc tả 4 mức độ nhận thức, tổ chức các đợt kiểm tra thường xuyên và định kỳ trên máy tính để học sinh cọ xát thực tiễn.")

    add_h3("1.2. Thực trạng và khoảng trống rào cản tại trường THPT hiện nay")
    add_p("Công tác phối hợp giữa Giáo viên chủ nhiệm (GVCN) và Giáo viên bộ môn (GVBM) trong việc đôn đốc, kiểm soát bài tập về nhà của học sinh hiện nay chủ yếu qua sổ ghi chép hoặc nhóm Zalo rời rạc. GVCN hoàn toàn thiếu một công cụ tập trung để giám sát tổng thể bài tập, tiến độ làm bài và bức tranh học lực liên môn của học sinh trong lớp theo thời gian thực.")
    add_p("Việc biên soạn đề kiểm tra trắc nghiệm bám sát ma trận 4 mức độ nhận thức tốn rất nhiều thời gian nếu làm thủ công. Khi tổ chức kiểm tra, ôn tập trực tuyến tại nhà, giáo viên luôn đối mặt với nguy cơ học sinh gian lận (chuyển tab tra Google, dùng AI giải hộ, thi hộ), làm sai lệch kết quả đánh giá thực chất.")
    add_p("Trong tổ hợp Khoa học Tự nhiên (KHTN: Vật lý, Hóa học, Sinh học), hình thức thi tốt nghiệp trên máy tính khiến học sinh đối mặt với khó khăn lớn: khó trực quan hóa đồ thị và hình vẽ mạch điện, bất tiện khi tính nháp stoichiometry, chuỗi di truyền và tra cứu hằng số khoa học. Đặc biệt, tổ hợp 3 môn KHTN chứa đựng mật độ công thức dày đặc, nhiều đơn vị thứ nguyên chuẩn SI phức tạp và vô số 'bẫy' đề thi kinh điển. Học sinh rất thiếu một hệ sinh thái tự học thông minh có khả năng chẩn đoán chính xác sai lầm nhận thức và hỗ trợ thực hành thí nghiệm mô phỏng trực quan.")

    add_h2("2. Tổng quan nghiên cứu và các giải pháp hiện có")
    add_p("Trong quá trình nghiên cứu, nhóm tác giả đã tiến hành khảo sát thực tiễn và đối soát các nền tảng giáo dục số, công cụ khảo thí và quản lý học tập phổ biến hiện nay tại Việt Nam. Kết quả tổng quan cho thấy các giải pháp hiện hành đang phân thành 3 nhóm chính: Nhóm 1 (Azota, Shub Classroom); Nhóm 2 (Google Classroom, Microsoft Teams); Nhóm 3 (K12Online, SMAS, vnEdu). Tuy nhiên, các giải pháp này đều bộc lộ những rào cản kỹ thuật cốt lõi:")
    add_p("• Thiếu cơ chế liên kết GVCN - GVBM thời gian thực: Chưa có nền tảng nào cung cấp Dashboard số đồng bộ tức thời giúp GVCN theo dõi toàn diện tiến độ bài tập liên môn và tự động tạo bảng xếp hạng thi đua.")
    add_p("• Nguy cơ sai số và ảo giác AI (AI Hallucination): Các ứng dụng tích hợp AI hiện nay khi giải bài tập Lý - Hóa - Sinh thường tự tính toán số học bằng mô hình ngôn ngữ dẫn tới kết quả sai lệch, bịa công thức hoặc cân bằng sai phương trình.")
    add_p("• Giám sát thi trực tuyến chưa bảo đảm an toàn dữ liệu: Hầu hết giải pháp đòi hỏi truyền luồng video liên tục về máy chủ (tốn băng thông, nguy cơ lộ hình ảnh riêng tư) hoặc chỉ chặn chuyển tab đơn giản rất dễ bị qua mặt.")
    add_p("• Thiếu công cụ số hóa bài thi giấy truyền thống (OMR): Giáo viên vẫn phải chấm tay hoặc sử dụng máy chấm phiếu đắt tiền, thiếu công cụ quét phiếu A4 thông minh qua camera điện thoại có khả năng loại trừ nhiễu nền và nắn góc nghiêng.")
    add_p("• Thiếu hệ sinh thái tự học chuyên sâu cho 3 môn KHTN: Chưa có nền tảng nào kết hợp được Lõi giải thuật khoa học tất định + Phòng thí nghiệm ảo 3D nhập vai + Sổ câu sai thông minh SRS + Bản đồ Radar đánh giá năng lực 6 chiều theo chuẩn GDPT 2018.")

    add_h2("3. Mục tiêu kỹ thuật và vấn đề dự án cần giải quyết")
    add_p("Vấn đề kỹ thuật: Làm thế nào để xây dựng một giải pháp lớp học số tích hợp đồng thời nền tảng khảo thí trực tuyến an toàn theo chuẩn định hướng thi máy tính của Bộ GD&ĐT, cơ chế điều hành lớp học liên môn cho GVCN - GVBM và hệ sinh thái thông minh hỗ trợ tự học toàn diện cho 3 môn Khoa học Tự nhiên (Vật lý, Hóa học, Sinh học) cấp THPT?")
    add_p("Ba mục tiêu kỹ thuật cụ thể:")
    add_p("1. Mục tiêu 1 (Dành cho GVCN): Xây dựng Dashboard số quản lý bài tập liên môn thời gian thực, theo dõi tiến độ nộp bài, tự động tính điểm thi đua và xuất phiếu điểm tổng hợp gửi phụ huynh qua Zalo/Email.")
    add_p("2. Mục tiêu 2 (Dành cho GVBM và Khảo thí đa môn): AutoExam Studio tạo ma trận 4 mức độ nhận thức cho cả 3 dạng thức trắc nghiệm mới; bóc tách đề từ Word/PDF; hoán vị đề triệt tiêu chép bài; phòng thi trực tuyến an toàn với Edge AI MediaPipe giám sát webcam ngay tại máy khách; module OMR Computer Vision quét chấm phiếu trắc nghiệm A4 bằng camera điện thoại đạt độ chính xác > 98% trong < 1.5 giây.")
    add_p("3. Mục tiêu 3 (Dành cho Học sinh và Tự học KHTN): Xây dựng Lõi tính toán khoa học tất định Toán - Lý - Hóa - Sinh triệt tiêu 100% ảo giác số liệu; Phân tích Bẫy đề thi KHTN; Bản đồ Radar Năng lực KHTN 6 chiều; Phòng thí nghiệm ảo 3D nhập vai & 2D; Sổ tay câu sai SRS (SuperMemo SM-2) đa môn kết hợp Gamification cử chỉ camera MediaPipe; Trợ lý AI tư vấn chiến lược nguyện vọng Đại học khối KHTN (A00, B00, A01).")

    add_h2("4. Phạm vi nghiên cứu và giới hạn kỹ thuật")
    add_p("• Phạm vi đối tượng: Triển khai thử nghiệm tại các khối lớp 10, 11, 12 trường THPT phục vụ công tác quản lý quá trình học tập, kiểm tra thường xuyên, định kỳ và ôn luyện thi tốt nghiệp THPT.")
    add_p("• Giới hạn công nghệ: Nền tảng Web / PWA chạy trên các trình duyệt tiêu chuẩn (Chrome, Edge, Cốc Cốc, Safari iOS) tương thích máy tính và thiết bị di động. Hệ thống thiết kế theo kiến trúc nền tảng lớp học số và khảo thí đa môn, tập trung phân hệ tự học chuyên sâu vào tổ hợp 3 môn KHTN (Vật lý - Hóa học - Sinh học).")

    # --- PHẦN II ---
    add_h1("PHẦN II: THIẾT KẾ VÀ PHƯƠNG PHÁP NGHIÊN CỨU")
    add_h2("1. Kiến trúc tổng thể hệ thống (Hybrid Client-Edge 4 tầng)")
    add_p("Hệ thống ELEC AI được thiết kế theo kiến trúc Client - Server 4 tầng phân tách nghiêm ngặt, tối ưu hóa theo mô hình Hybrid Client-Edge nhằm giải phóng tải tối đa cho máy chủ trung tâm và bảo vệ tuyệt đối dữ liệu cá nhân của học sinh:")
    add_p("• Tầng 1: Tầng Trình diễn (Presentation Layer) — Ứng dụng Web / PWA (React 18, Vite 5.4, Tailwind CSS), Giao diện học sinh/giáo viên, Phòng lab KHTN 3D (Three.js / React Three Fiber) & Giao diện Canvas 2D.")
    add_p("• Tầng 2: Tầng Nghiệp vụ Client (Client Business Layer) — Xử lý tại chỗ bằng JavaScript: scientificTools.js (Lõi tính toán Vật lý, Hóa học, Sinh học tất định), chemBalance.js (Thuật toán RREF Gauss-Jordan BigInt cân bằng phản ứng & stoichiometry), omr.js (Biến đổi Homography & Trích xuất Kênh Đỏ chấm phiếu A4), aiRouter.js (Định tuyến API & Tool Grounding), useProctorCamera.js (Giám sát phòng thi).")
    add_p("• Tầng 3: Tầng Dịch vụ Đám mây (Cloud Services Layer) — Firebase Platform (Firebase Auth, Cloud Firestore Realtime, Storage); Supabase Platform (PostgreSQL Database, Row Level Security, Edge Functions); Cổng nạp điểm Credit tự động qua VietQR/SePay Webhook.")
    add_p("• Tầng 4: Tầng Tính toán Biên & Dữ liệu (Edge Computing & Data Layer) — Google MediaPipe Tasks Vision (Edge AI nhận diện diện mạo, hướng nhìn, cử chỉ tay), Tesseract.js (OCR offline đọc đề bài từ ảnh), Dữ liệu tri thức KHTN chuẩn SGK 10-11-12 (Local Indexed Knowledge).")
    add_p("[Hình 1: Sơ đồ khối kiến trúc Hybrid Client-Edge 4 tầng của hệ thống ELEC AI]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    add_h2("2. Thiết kế chi tiết các phân hệ chức năng")
    add_p("2.1. Phân hệ quản lý lớp học số (Dành cho GVCN): Khởi tạo không gian lớp học số với Mã định danh an toàn (Teacher Invite Keys) Base32 (không gian mẫu 32^8 ≈ 1,1 nghìn tỷ tổ hợp, chống vét cạn) gán cố định cho từng môn học. Dashboard tập trung giúp GVCN theo dõi toàn bộ bài tập liên môn realtime, phát hiện sớm học sinh nợ bài, tự động tính điểm thi đua và trích xuất phiếu điểm Zalo gửi phụ huynh.")
    add_p("2.2. Phân hệ khảo thí chuẩn Bộ GD&ĐT (Dành cho GVBM): AutoExam Studio hỗ trợ AI tạo ma trận 4 mức độ nhận thức cho 3 dạng thức trắc nghiệm mới của Bộ GD&ĐT; bóc tách đề từ file Word/PDF; thuật toán hoán vị đề Seeded Shuffle; phòng thi trực tuyến bảo mật đa tầng tích hợp Edge AI MediaPipe; module OMR chấm phiếu trắc nghiệm A4 bằng camera điện thoại.")
    add_p("2.3. Phân hệ chuyên sâu liên môn Khoa học Tự nhiên (Dành cho Học sinh):")
    add_p("• Lõi tính toán khoa học tất định: Vật lý (dao động điều hòa, mạch xoay chiều RLC, khí lý tưởng PV=nRT, quang hình học); Hóa học (cân bằng phản ứng Gauss-Jordan BigInt, stoichiometry, pH axit-bazơ yếu/mạnh, nhiệt phản ứng); Sinh học (quy luật di truyền Menđen, Hardy-Weinberg, Bảng mã di truyền 64 bộ ba, phân bào).")
    add_p("• Phân tích Bẫy đề thi KHTN (examTrapAnalyzer.js): Tự động phát hiện bẫy đơn vị SI, bẫy từ ngữ phủ định, bẫy điều kiện biên hóa học, bẫy quy luật di truyền sinh học; tự động tạo giải thích sư phạm phương án nhiễu.")
    add_p("• Bản đồ Radar Đánh giá Năng lực KHTN 6 chiều (competencyRadarEngine.js): Đánh giá năng lực theo chuẩn GDPT 2018 (Nhận thức KHTN, Tìm hiểu tự nhiên, Vận dụng thực tiễn, Giải toán khoa học, Tư duy thực nghiệm, Phân tích đồ thị dữ liệu).")
    add_p("• Phòng thí nghiệm KHTN ảo 3D nhập vai (Three.js) & 2D: Bàn thực hành phản ứng hóa học tương tác, mô phỏng mạch điện & quang hình Vật lý, mô hình xoay 3D phân tử ADN & phân bào Sinh học.")
    add_p("• Sổ tay câu sai thông minh SRS (SuperMemo SM-2) đa môn & Gamification cử chỉ camera MediaPipe; Trợ lý AI tư vấn chiến lược nguyện vọng Đại học khối KHTN (A00, B00, A01).")

    add_h2("3. Phương pháp nghiên cứu và Công cụ thực hiện")
    add_p("3.1. Phương pháp nghiên cứu lý thuyết: Nghiên cứu chuẩn kiến thức GDPT 2018 môn Vật lí, Hóa học, Sinh học; Bloom; đường cong lãng quên Ebbinghaus; khảo sát định lượng 75 GV và 250 HS.")
    add_p("3.2. Phương pháp thiết kế công nghệ: React 18, Vite 5.4, Tailwind CSS, Firebase, Supabase PostgreSQL, MediaPipe Vision, Three.js, Vitest. Dự án tuân thủ nghiêm ngặt Điều 15 Thông tư 84/2026/TT-BGDĐT về việc khai báo công nghệ số, thư viện mã nguồn mở và API.")
    add_p("3.3. Thiết kế mô hình Thực nghiệm Sư phạm Liên môn KHTN: Triển khai trên 4 lớp khối 11 Trường THPT Đông Thụy Anh: Nhóm Thực nghiệm (11A5: 49 HS, 11A7: 45 HS -> Tổng 94 HS) học tập trên nền tảng ELEC AI; Nhóm Đối chứng (11A6: 49 HS, 11A3: 48 HS -> Tổng 97 HS) học tập theo phương pháp truyền thống trong 8 tuần liên tục.")

    # --- PHẦN III ---
    add_h1("PHẦN III. QUY TRÌNH THIẾT KẾ, XÂY DỰNG VÀ THỬ NGHIỆM HỆ THỐNG")
    add_h2("1. Khảo sát nhu cầu và đặc tả yêu cầu cốt lõi")
    add_p("Khảo sát thực tiễn trên 75 giáo viên KHTN và 250 học sinh THPT cho thấy: 43.0% học sinh gặp khó khăn ở khâu đọc đề, tìm hướng giải và tính toán số học; 37.0% gặp khó khăn ghi nhớ công thức và cặp gen di truyền; 71.2% giáo viên đánh giá việc biên soạn, trộn đề, in ấn và chấm bài thủ công tốn quá nhiều thời gian.")
    add_p("[Hình 2: Biểu đồ kết quả khảo sát nhu cầu của học sinh và giáo viên]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p("Từ đó, nhóm xác lập 28 yêu cầu chức năng (FR) và 12 yêu cầu phi chức năng (NFR) chia thành 4 nhóm cốt lõi: Tài khoản & Phân quyền, Trợ lý AI & Lõi KHTN, Tự học & Sổ câu sai liên môn, Khảo thí & Giám sát.")

    add_h2("2. Luồng xử lý dữ liệu và Mô hình cơ sở dữ liệu tích hợp")
    add_p("2.1. Luồng xử lý 7 bước câu hỏi AI (Zero-Hallucination Pipeline): Để triệt tiêu hiện tượng 'ảo giác' số liệu của mô hình ngôn ngữ lớn, mọi câu hỏi từ học sinh được xử lý qua quy trình 7 bước nghiêm ngặt: (1) Chuẩn hóa văn bản; (2) Phân loại tác vụ môn Lý/Hóa/Sinh và độ khó qua aiRouter.js; (3) Truy xuất tri thức nội bộ BM25; (4) Tính toán trước bằng công cụ tất định scientificTools.js / chemBalance.js; (5) Ghép câu lệnh sư phạm đa tầng; (6) Gọi mô hình AI với Vòng xoay khóa Key Ring Rotation streaming; (7) Chuẩn hóa & Tự kiểm tra đối chiếu con số.")
    add_p("[Hình 3: Sơ đồ luồng xử lý 7 bước ngăn ngừa lỗi ảo giác AI]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p("2.2. Mô hình cơ sở dữ liệu tích hợp: Kết nối song song Firebase Firestore (nguồn đúng realtime cho danh tính, lớp học, phiên thi trực tuyến) và Supabase PostgreSQL (nguồn đúng cho ngân hàng đề KHTN, lịch sử làm bài, sổ câu sai SRS, điểm chuẩn tuyển sinh ĐH) qua khóa liên kết duy nhất UID.")
    add_p("[Hình 4: Sơ đồ liên kết dữ liệu giữa Firebase Firestore và Supabase qua UID]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    add_h2("3. Thiết kế giao diện và Tối ưu hóa trải nghiệm (UX)")
    add_p("Giao diện được thiết kế theo 4 nguyên tắc công thái học phần mềm: (1) Ưu tiên tuyệt đối nội dung học, ẩn toàn bộ thanh điều hướng khi vào phòng thi; (2) Hành động đơn nhất trên mỗi màn hình; (3) Chuẩn hóa hình vẽ kỹ thuật SVG sắc nét; (4) Hiển thị công thức Hóa học bằng ký tự Unicode thống nhất, KaTeX cho biểu thức Toán - Lý phức tạp.")
    add_p("Hoàn thiện 4 giải pháp công thái học then chốt: Debounce khóa nút bấm tránh trừ điểm trùng; Bảng tuần hoàn & Bảng mã di truyền cuộn ngang có neo cột nhóm trên điện thoại; Ngăn kéo lưới số câu hỏi trong phòng thi; Thông báo lỗi hướng dẫn hành động thân thiện.")
    add_p("[Hình 5: Giao diện trang chủ trên thiết bị di động, máy tính]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    add_h2("4. Hiện thực hóa các module kỹ thuật trọng tâm")
    add_p("4.1. Lõi AI Router và Vòng xoay khóa API (aiRouter.js): Thuật toán aiRouter.js quản lý danh sách nhiều API Key; khi phát hiện lỗi vượt hạn mức (HTTP 429), hệ thống tự động đưa khóa đó vào trạng thái tạm nghỉ 10 phút và chuyển ngay sang khóa tiếp theo, bảo đảm phòng thi không bị gián đoạn.")
    add_p("4.2. Lõi tính toán Khoa học Tự nhiên tất định (scientificTools.js & chemBalance.js):")
    add_p("• Hóa học: Phân tích công thức có ngoặc, tinh thể ngậm nước bằng ngăn xếp Stack, lập hệ phương trình và giải bằng đại số tuyến tính khử Gauss-Jordan (RREF) trên phân số BigInt không làm tròn; tính stoichiometry, pH dung dịch.")
    add_p("• Vật lý & Sinh học: Module scientificTools.js tính toán dao động điều hòa (T, f, vmax, amax, W), mạch RLC xoay chiều (ZL, ZC, Z, cosφ), phương trình khí lý tưởng PV=nRT, quy luật di truyền Menđen và cân bằng quần thể Hardy-Weinberg (p^2AA + 2pqAa + q^2aa = 1).")
    add_p("4.3. Module chấm phiếu trắc nghiệm A4 bằng Camera (omr.js): Định vị 4 vạch đen góc phiếu, áp dụng biến đổi phối cảnh Homography nắn phẳng ảnh về tọa độ chuẩn 2480 x 3508 px. Ứng dụng kỹ thuật Trích xuất Kênh Đỏ (Red Channel Extraction): mực in màu hồng biến mất trên kênh R, vết chì tô hấp thụ quang mạnh, giúp đo chính xác tỷ số độ đen quang học tương đối mà không bị ảnh hưởng bởi ánh sáng môi trường.")
    add_p("4.4. Giám sát thi trực tuyến thời gian thực (useProctorCamera.js): Tích hợp MediaPipe Vision Edge AI chạy trực tiếp trên trình duyệt với chu kỳ quét 600ms; phát hiện quay mặt quá 5s, vắng mặt quá 5s, người thứ hai quá 3s; nén ảnh vi phạm gửi Firestore mà không truyền video lên máy chủ.")
    add_p("[Hình 6: Màn hình giám sát trực tiếp của giáo viên]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p("4.5. Thuật toán lặp lại ngắt quãng tối ưu hóa (srs.js): Áp dụng SuperMemo SM-2 cho 3 môn Vật lý, Hóa học, Sinh học, tự động cập nhật hệ số dễ EF và khoảng cách ôn tập I sau mỗi lần làm bài.")

    add_h2("5. Tích hợp, Triển khai và Vận hành (CI/CD)")
    add_p("[Hình 7: Quy trình đóng gói và triển khai hệ thống]", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p("Hệ thống xây dựng quy trình CI/CD tự động 5 bước qua Vercel Edge Network. Điểm sáng nổi bật của dự án là việc thiết lập 36 tệp kiểm thử tự động với 460 ca kiểm thử chuyên sâu (Unit & Integration Tests) bao quát cả 3 môn KHTN, chạy hoàn tất trong thời gian kỷ lục 13,42 giây với tỷ lệ thành công tuyệt đối 100% (460/460 passed).")
    add_p("Xử lý triệt để 4 lỗi hồi quy kỹ thuật: (1) Thay thế Regex lookbehind bằng cú pháp chuẩn ES6 tương thích Safari iOS cũ; (2) Lọc bỏ đệ quy các trường rỗng khi nộp bài thi lên Firestore; (3) Thống nhất một lõi tính toán duy nhất (scientificTools.js, chemBalance.js); (4) Thêm thời gian ân hạn 12 giây khi vừa bật camera.")

    add_h2("6. Kiểm thử hiệu năng và Đánh giá thực nghiệm")
    add_p("Toàn bộ 36 kịch bản kiểm thử chức năng thuộc 6 nhóm phân hệ đạt kết quả Đạt 100%. Tốc độ tải trang đạt FCP 0.6s / LCP 1.2s trên máy tính để bàn và 0.9s / 1.8s trên iPhone; phản hồi AI trung bình 2.5s; chấm quét OMR camera đạt 1.4s/phiếu.")
    add_p("Khảo sát trên 250 học sinh và 75 giáo viên ghi nhận: 92.5% hài lòng về độ mượt mà của giao diện; 89.6% tin cậy tuyệt đối vào con số giải toán KHTN của AI; 93.8% mong muốn tiếp tục sử dụng nền tảng trong các năm học tiếp theo.")

    # --- PHẦN IV ---
    add_h1("PHẦN IV: KẾT QUẢ, KẾT LUẬN VÀ KHẢ NĂNG ỨNG DỤNG")
    add_h2("1. Kết quả nghiên cứu đạt được và Phân tích định lượng")
    add_p("1.1. Sản phẩm kỹ thuật và hạ tầng: Hệ thống ELEC AI được hoàn thiện với quy mô mã nguồn gồm 495.210 dòng lệnh, 245 component React (.jsx), 168 tệp thuật toán lõi (.js) và 285 stylesheet (.css). Độ tin cậy được chứng minh qua 460/460 ca kiểm thử Vitest thành công 100%. Vận hành chính thức trên Internet tại: https://aitk-ten.vercel.app/.")
    add_p("1.2. Hiệu quả quản lý lớp học và khảo thí đa môn:")
    add_p("• Phân hệ dành cho GVCN: Quản trị lớp học số, liên kết GVBM Lý - Hóa - Sinh, theo dõi bài tập liên môn realtime, bảng xếp hạng thi đua, trích xuất phiếu điểm Zalo gửi phụ huynh.")
    add_p("• Phân hệ dành cho GVBM: Quản lý ngân hàng câu hỏi, tạo đề ma trận 4 mức độ chuẩn GDPT 2018, tổ chức phòng thi an toàn có giám sát MediaPipe, chấm phiếu trắc nghiệm A4 bằng camera OMR.")
    add_p("• Phân hệ dành cho Học sinh: Tự học 3 môn Khoa học Tự nhiên (Vật lý, Hóa học, Sinh học) với Lõi tính toán tất định chống ảo giác, Phân tích bẫy đề thi KHTN, Bản đồ Radar năng lực 6 chiều, Phòng thí nghiệm ảo 3D nhập vai, Sổ tay câu sai SRS thông minh và AI tư vấn chiến lược nguyện vọng Đại học khối KHTN.")
    add_p("1.3. Kết quả Thực nghiệm Sư phạm: Sau 8 tuần thực nghiệm, Nhóm Thực nghiệm (N=94) đạt tỷ lệ nộp bài 93.8% (so với 71.5% của Nhóm Đối chứng); điểm trung bình kiểm tra 3 môn KHTN đạt 7.45 điểm (cao hơn 6.48 điểm của nhóm ĐC, p < 0.01, Cohen's d = 0.82); tỷ lệ khắc phục câu sai trong Sổ lỗi SRS đạt 89.6%.")

    add_h2("2. Tính mới và Tính sáng tạo")
    add_p("2.1. Đột phá về Kiến trúc Kỹ thuật và Công nghệ Lõi:")
    add_p("• Mô hình kết hợp Client-Edge và Lõi tính toán tất định KHTN (scientificTools.js, chemBalance.js): Khắc phục triệt để điểm yếu 'tính toán ẩu, bịa số liệu' của các mô hình LLM. Mọi bài toán Vật lý, Hóa học, Sinh học đều được xử lý chính xác bằng mã nguồn thuần trước khi chuyển kết quả cho AI trình bày.")
    add_p("• Cơ chế định tuyến AI Router và Vòng xoay khóa API (Key Ring Rotation): Vận hành liên tục 24/7 ngay cả khi một nhà cung cấp gặp sự cố quá tải (lỗi 429).")
    add_p("• Thị giác máy tính chạy trực tiếp trên trình duyệt (MediaPipe Vision & Homography OMR): Giám sát phòng thi an toàn và chấm phiếu trắc nghiệm A4 ngay trên máy khách mà không cần truyền video lên máy chủ, bảo đảm bảo mật tuyệt đối.")
    add_p("2.2. Đột phá về Sư phạm và Nghiệp vụ Quản lý Giáo dục (GDPT 2018):")
    add_p("• Hệ thống liên kết dữ liệu đa chiều GVCN - GVBM thời gian thực.")
    add_p("• Tổ hợp Khảo thí chuẩn cấu trúc mới Bộ GD&ĐT (AutoExam Studio).")
    add_p("• Hệ sinh thái Tự học và Trải nghiệm chuyên sâu liên môn KHTN: Phòng thí nghiệm 3D tương tác cao, Bản đồ Radar năng lực 6 chiều, Phân tích bẫy đề thi KHTN, Sổ tay câu sai SRS, Gamification cử chỉ camera và AI tư vấn chiến lược nguyện vọng Đại học khối KHTN.")

    add_h2("3. Khả năng ứng dụng và Chuyển giao thực tiễn")
    add_p("3.1. Tính phổ quát và chi phí triển khai siêu rẻ: Hệ thống hoạt động trên Web/PWA, tương thích mọi thiết bị di động cá nhân và máy tính. Chi phí vận hành hạ tầng đám mây cực thấp (khoảng 450.000 – 500.000 VNĐ/tháng cho toàn trường), hoàn toàn khả thi để chuyển giao và nhân rộng đại trà tới các trường THPT.")
    add_p("3.2. Giá trị kinh tế - xã hội và Chuyển đổi số: Tự động hóa khảo thí và chấm OMR camera giúp giáo viên cắt giảm đến 70% thời gian sự vụ bàn giấy, giảm hàng triệu đồng chi phí in ấn. Học sinh được hình thành năng lực khảo thí số vững vàng, sẵn sàng cho kỳ thi tốt nghiệp THPT trên máy tính.")

    add_h2("4. Kết luận và Định hướng phát triển công nghệ")
    add_p("4.1. Kết luận: Đề tài đã nghiên cứu và hoàn thiện thành công nền tảng ELEC AI, giải quyết trọn vẹn sự kết hợp giữa Trí tuệ nhân tạo, Thị giác máy tính, Điện toán biên và Lý luận dạy học hiện đại, đáp ứng xuất sắc yêu cầu chuyển đổi số và đổi mới giáo dục theo Chương trình GDPT 2018.")
    add_p("4.2. Định hướng phát triển:")
    add_p("• Giai đoạn 1: Hoàn thiện AI Gateway phân tán và siết chặt bảo mật phân quyền theo Nghị định 13/2023/NĐ-CP.")
    add_p("• Giai đoạn 2: Mở rộng Lõi tính toán tất định và ngân hàng câu hỏi sang các môn Khoa học Xã hội và Ngoại ngữ.")
    add_p("• Giai đoạn 3: Xây dựng giải đấu học tập liên trường trực tuyến (Arena Mode) và phát triển mô hình học tập thích ứng sâu (Deep Adaptive Learning).")

    # --- TÀI LIỆU THAM KHẢO ---
    add_h1("TÀI LIỆU THAM KHẢO")
    refs = [
        "1. Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông 2018 - Chương trình tổng thể và các môn học Vật lí, Hóa học, Sinh học, Ban hành kèm theo Thông tư số 32/2018/TT-BGDĐT ngày 26/12/2018.",
        "2. Bộ Giáo dục và Đào tạo (2023), Công văn số 5548/BGDĐT-QLCL về việc hướng dẫn tổ chức kỳ thi tốt nghiệp THPT và định hướng tổ chức thi trên máy tính giai đoạn 2025 - 2030.",
        "3. Bộ Giáo dục và Đào tạo (2026), Thông tư số 84/2026/TT-BGDĐT về Quy chế thi nghiên cứu khoa học kỹ thuật cấp quốc gia dành cho học sinh trung học cơ sở và trung học phổ thông.",
        "4. Flanagan, D. (2020), JavaScript: The Definitive Guide (7th Edition), O'Reilly Media.",
        "5. Martin, R. C. (2008), Clean Code: A Handbook of Agile Software Craftsmanship, Prentice Hall.",
        "6. Kleppmann, M. (2017), Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems, O'Reilly Media.",
        "7. Lugaresi, C. et al. (2019), MediaPipe: A Framework for Building Perception Pipelines, arXiv:1906.08172. Truy cập tại: https://arxiv.org/abs/1906.08172",
        "8. Bradski, G. & Kaehler, A. (2008), Learning OpenCV: Computer Vision with the OpenCV Library, O'Reilly Media.",
        "9. Wozniak, P. A. (1990), Optimization of learning: SuperMemo 2 algorithm, University of Technology in Poznan.",
        "10. White, J. et al. (2023), A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT, arXiv:2302.11382.",
        "11. Google DeepMind (2024), Gemini: A Family of Highly Capable Multimodal Models, arXiv:2312.11805.",
        "12. Anthropic (2024), The Claude 3 Model Family: Opus, Sonnet, Haiku, Anthropic Research.",
        "13. DeepSeek AI (2024), DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model, arXiv:2405.04434."
    ]
    for ref in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_after = Pt(4)
        p_ref.paragraph_format.line_spacing = 1.15
        p_ref.paragraph_format.left_indent = Cm(0.75)
        p_ref.paragraph_format.first_line_indent = Cm(-0.75)
        r = p_ref.add_run(ref)
        format_run(r, size_pt=11.5)

    output_path = os.path.abspath("BAO_CAO_KHOA_HOC_KHTN_ELEC_AI.docx")
    doc.save(output_path)
    print("SUCCESS: BAO_CAO_KHOA_HOC_KHTN_ELEC_AI.docx created cleanly.")

if __name__ == "__main__":
    create_document()
