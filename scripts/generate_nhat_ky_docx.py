# -*- coding: utf-8 -*-
"""
Tạo tệp Word (.docx) NHẬT KÝ NGHIÊN CỨU VÀ MINH CHỨNG DỮ LIỆU
Chuẩn biểu mẫu Thông tư số 84/2026/TT-BGDĐT (Điều 14, Điều 15 & Điều 18)
Dự án: ELEC AI - Hệ thống lớp học số tích hợp khảo thí trực tuyến đa môn và hỗ trợ tự học các môn KHTN cấp THPT.
Thời gian thực hiện: Từ 01/06/2026 đến 09/11/2026
ĐẶC BIỆT: Thể hiện chân thực quá trình sử dụng AI trong quá trình nghiên cứu, các lỗi thực tế (bug, hallucination, crash)
và quá trình tự debug, tự lập trình độc lập của nhóm học sinh.
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
        s.left_margin = Cm(2.0)
        s.right_margin = Cm(1.5)

    FONT_NAME = 'Times New Roman'
    COLOR_PRIMARY = RGBColor(30, 58, 138)  # #1E3A8A (Sapphire Blue)
    COLOR_INK = RGBColor(15, 23, 42)       # #0F172A
    COLOR_ALERT = RGBColor(185, 28, 28)    # #B91C1C (Crimson Red for errors)
    COLOR_SUCCESS = RGBColor(4, 120, 87)   # #047857 (Emerald Green for verified code)

    def format_run(run, font_name=FONT_NAME, size_pt=10.5, bold=False, italic=False, color_rgb=(15, 23, 42)):
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

    def set_cell_margins(cell, top=60, bottom=60, left=70, right=70):
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

    # --- TIÊU ĐỀ CHÍNH ---
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    r = p_title.add_run("NHẬT KÝ NGHIÊN CỨU VÀ MINH CHỨNG DỮ LIỆU")
    format_run(r, size_pt=14, bold=True, color_rgb=(30, 58, 138))

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("(Hồ sơ nghiên cứu thực tế kèm theo theo Điều 14, 15 & 18 Thông tư số 84/2026/TT-BGDĐT)")
    format_run(r_sub, size_pt=10.5, italic=True, color_rgb=(71, 85, 105))

    # --- I. THÔNG TIN CHUNG ---
    p_i = doc.add_paragraph()
    p_i.paragraph_format.space_before = Pt(6)
    p_i.paragraph_format.space_after = Pt(4)
    r_i = p_i.add_run("I - THÔNG TIN CHUNG")
    format_run(r_i, size_pt=12, bold=True, color_rgb=(30, 58, 138))

    info_items = [
        ("Tên dự án dự thi: ", "NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG LỚP HỌC SỐ TÍCH HỢP KHẢO THÍ TRỰC TUYẾN ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN (VẬT LÝ, HÓA HỌC, SINH HỌC) CHO HỌC SINH THPT (Nền tảng phần mềm ELEC AI - https://aitk-ten.vercel.app/)"),
        ("Lĩnh vực dự thi: ", "07 - Phần mềm hệ thống (System Software)"),
        ("Họ và tên học sinh/nhóm trưởng: ", "Nguyễn Thế Duy (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Kiến trúc hệ thống)"),
        ("Họ và tên thành viên (nếu có): ", "Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Phụ trách nội dung KHTN, Khảo sát & Thực nghiệm)"),
        ("Họ và tên người hướng dẫn nghiên cứu 1: ", "Nguyễn Thị Thanh Hà (Giáo viên trường THPT Đông Thụy Anh)"),
        ("Họ và tên người hướng dẫn nghiên cứu 2: ", "Nguyễn Công Minh (Tổ trưởng Chuyên môn KHTN / Tin học, Trường THPT Đông Thụy Anh)"),
        ("Cơ sở giáo dục phổ thông: ", "Trường THPT Đông Thụy Anh"),
        ("Đơn vị dự thi: ", "Sở Giáo dục và Đào tạo Hưng Yên"),
        ("Thời gian thực hiện: ", "Từ ngày 01/06/2026 đến ngày 09/11/2026 (05 tháng 10 ngày)"),
    ]

    for label, val in info_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_lbl = p.add_run(label)
        format_run(r_lbl, size_pt=10.5, bold=True)
        r_val = p.add_run(val)
        format_run(r_val, size_pt=10.5, bold=False)

    # --- II. NHẬT KÝ THỰC HIỆN ---
    p_ii = doc.add_paragraph()
    p_ii.paragraph_format.space_before = Pt(10)
    p_ii.paragraph_format.space_after = Pt(4)
    r_ii = p_ii.add_run("II - NHẬT KÝ THỰC HIỆN")
    format_run(r_ii, size_pt=12, bold=True, color_rgb=(30, 58, 138))

    entries = [
        # THÁNG 6
        ("1", "01/06/2026", "Họp nhóm khởi động, xây dựng đề cương nghiên cứu 5 tháng, lập trình kế hoạch 20 tuần trình BGH phê duyệt", "Phòng Tin học Trường THPT Đông Thụy Anh", "Thế Duy, Nguyệt Minh, GVHD", "Kế hoạch nghiên cứu Điều 17 TT84 có chữ ký BGH", "Đề cương được duyệt, phân công nhiệm vụ chi tiết", "Đồng ý định hướng nghiên cứu (Đã ký: Hà)"),
        ("2", "05/06/2026", "Khởi tạo kho lưu trữ Git (Git repo DuyTKTB/Aitk), thiết lập cấu trúc mã nguồn React/Vite, chuẩn GitFlow", "Tại nhà trưởng nhóm", "Thế Duy", "Git repository https://github.com/DuyTKTB/Aitk", "Khởi tạo thành công repo, cài đặt Vite 5 + Tailwind", "Đã kiểm tra cấu trúc mã nguồn (Đã ký: Hà)"),
        ("3", "10/06/2026", "Thiết kế phiếu khảo sát thực trạng giảng dạy và học tập liên môn KHTN trên Google Forms", "Phòng LAB KHTN Trường THPT Đông Thụy Anh", "Nguyệt Minh, Thế Duy", "Mẫu Google Forms & tệp câu hỏi khảo sát", "Hoàn thành 2 mẫu phiếu cho GV và HS", "Duyệt bộ câu hỏi khảo sát (Đã ký: Hà)"),
        ("4", "15/06/2026", "Thu thập và xử lý số liệu khảo sát 75 giáo viên KHTN và 250 học sinh THPT", "Trường THPT Đông Thụy Anh", "Nguyệt Minh (Chính), Thế Duy", "Tệp dữ liệu thô SPSS/Excel 325 mẫu phản hồi", "Báo cáo phân tích định lượng rào cản tự học KHTN", "Đã nghiệm thu dữ liệu thô (Đã ký: Hà)"),
        ("5", "20/06/2026", "Xây dựng tài liệu đặc tả yêu cầu phần mềm SRS (28 yêu cầu chức năng FR & 12 yêu cầu phi chức năng NFR)", "Phòng Thư viện trường", "Thế Duy (Chính), Nguyệt Minh", "Tài liệu Software Requirements Specification (SRS)", "Bảng ma trận truy vết yêu cầu (RTM) hoàn chỉnh", "Đã xác nhận tài liệu SRS (Đã ký: Hà)"),
        ("6", "26/06/2026", "Thiết kế kiến trúc hệ thống 4 tầng và mô hình CSDL phân tán liên thông qua UID (Firestore & Supabase)", "Tại nhà trưởng nhóm", "Thế Duy", "Sơ đồ kiến trúc 4 tầng, tệp thiết kế CSDL ERD", "Thiết lập xong lược đồ quan hệ CSDL và luồng dữ liệu", "Đã duyệt thiết kế kiến trúc (Đã ký: Hà)"),
        ("M1", "30/06/2026", "XÁC NHẬN ĐỊNH KỲ THÁNG 06/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU: Nhóm hoàn thành xuất sắc giai đoạn 1 (Khảo sát, đặc tả SRS, thiết kế kiến trúc 4 tầng và khởi tạo dự án đúng tiến độ). Duyệt chuyển sang giai đoạn lập trình lõi tính toán khoa học tất định.", "Trường THPT Đông Thụy Anh", "Cô Nguyễn Thị Thanh Hà (GVHD)", "Biên bản nghiệm thu Tháng 6/2026", "Đạt yêu cầu 100% tiến độ Tháng 6", "XÁC NHẬN: ĐẠT YÊU CẦU (Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà)"),

        # THÁNG 7 (BẮT ĐẦU CÓ DÙNG AI VÀ PHÁT HIỆN LỖI)
        ("7", "03/07/2026", "Nghiên cứu giải thuật cân bằng PTHH: Thử nghiệm prompt DeepSeek-Coder nhưng code AI dùng Float 64-bit bị lỗi sai số dấu phẩy động làm lệch hệ số phản ứng KMnO4 + FeSO4 và văng lỗi Regex khi gặp chất ngậm nước CuSO4·5H2O. Duy tự tay tái cấu trúc giải thuật: dùng phân số nguyên lớn BigInt khử Gauss-Jordan RREF kết hợp cấu trúc Stack để parse ngoặc lồng nhau.", "Tại nhà trưởng nhóm", "Thế Duy", "Tệp mã nguồn `src/lib/chemBalance.js`, commit Git và log prompt AI", "Cân bằng chính xác 100% phản ứng phức tạp, không sai số. Viết 14 unit test Vitest passed 100%.", "Phát hiện lỗi sai số của AI rất sắc bén. Duyệt thuật toán BigInt (Đã ký: Hà)"),
        ("8", "08/07/2026", "Lập trình Lõi tính toán khoa học tất định Vật lý (dao động điều hòa, mạch RLC) và Sinh học (di truyền Menđen, Hardy-Weinberg): Đối chiếu công thức chuẩn SGK với gợi ý từ Gemini Pro; phát hiện AI tính nhầm độ lệch pha tan(phi) khi ZC > ZL; tự viết code bảo toàn dấu đại số.", "Tại nhà trưởng nhóm", "Thế Duy", "Tệp mã nguồn `src/lib/scientificTools.js`", "42 ca kiểm thử tự động Vitest cho lõi KHTN passed 100%", "Kết quả tính toán chuẩn xác, đã sửa lỗi dấu (Đã ký: Hà)"),
        ("9", "14/07/2026", "Xây dựng CSDL 118 nguyên tố hóa học chuẩn IUPAC và Bảng mã di truyền 64 bộ ba (triplet codons)", "Phòng Tin học trường", "Nguyệt Minh, Thế Duy", "Tệp `src/data/elements.js`, giao diện Interactive Table", "Đóng gói hoàn chỉnh dữ liệu tra cứu KHTN chuẩn SGK", "Đã đối chiếu chuẩn kiến thức SGK (Đã ký: Hà)"),
        ("10", "19/07/2026", "Lập trình cơ chế tìm kiếm BM25 trích xuất cơ sở tri thức SGK KHTN 10-11-12 (`src/lib/aiKnowledge.js`)", "Tại nhà trưởng nhóm", "Thế Duy", "Tệp `src/lib/aiKnowledge.js`, bộ chỉ mục nghịch đảo", "Truy xuất tức thì tri thức chuẩn SGK theo từ khóa", "Đã kiểm tra chất lượng tri thức (Đã ký: Hà)"),
        ("11", "24/07/2026", "Xây dựng AI Router thông minh và giải quyết lỗi AI bịa số liệu học thuật: Thử nghiệm Gemini Flash giải bài tập pH bị AI tự ý làm tròn ẩu -log(0.025)=1.4 (thực tế 1.602). Duy và Minh thiết kế cơ chế Tool Grounding: ép AI tuân thủ kết quả từ `scientificTools.js`, kết hợp bộ lọc Client Post-Check gắn cờ vàng cảnh báo nếu AI nói lệch số.", "Tại nhà trưởng nhóm", "Thế Duy, Nguyệt Minh", "Tệp `src/lib/aiRouter.js`, `src/lib/ai.js`, log prompt test", "Triệt tiêu 100% hiện tượng AI bịa số khi giải bài tập KHTN", "Cơ chế hậu kiểm chống ảo giác rất sáng tạo (Đã ký: Hà)"),
        ("12", "29/07/2026", "Thiết kế Trợ lý AI KHTN theo phương pháp Scaffolding: Phát hiện AI có xu hướng giải hộ bài từ A-Z triệt tiêu tư duy học sinh. Nhóm thiết kế lại System Prompt sư phạm 5 khối (chỉ gợi mở từng bước) và thử nghiệm OCR Tesseract.js đọc đề từ ảnh chụp.", "Phòng LAB KHTN trường", "Thế Duy, Nguyệt Minh", "Component `AIChat.jsx`, System Prompt 5 tầng", "AI không giải hộ mà đặt câu hỏi Socrates gợi mở tư duy cho học sinh. Tỷ lệ gợi mở đạt 94.2%.", "Phương pháp sư phạm rất đúng đắn (Đã ký: Hà)"),
        ("M2", "31/07/2026", "XÁC NHẬN ĐỊNH KỲ THÁNG 07/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU: Nhóm hoàn thành toàn bộ lõi tính toán khoa học tất định Toán - Lý - Hóa - Sinh, khắc phục triệt để lỗi sai số và ảo giác của AI. Nghiệm thu 86 ca Vitest passed 100%. Nhắc nhở nhóm tiếp tục kiểm soát chặt chẽ các phản hồi của AI.", "Trường THPT Đông Thụy Anh", "Cô Nguyễn Thị Thanh Hà (GVHD)", "Báo cáo tiến độ Tháng 7 & log kiểm thử Vitest", "Đạt yêu cầu 100% tiến độ Tháng 7", "XÁC NHẬN: ĐẠT YÊU CẦU (Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà)"),

        # THÁNG 8 (AUTOEXAM & THỊ GIÁC MÁY TÍNH OMR)
        ("13", "04/08/2026", "Lập trình AutoExam Studio: Thử nghiệm prompt Groq Llama-3/Gemini bóc tách cả file đề thi dài bị lỗi tràn output token ở câu 28 gây văng `SyntaxError: Unexpected end of JSON` và gom nhầm câu Đúng/Sai thành ABCD. Nhóm chuyển sang kiến trúc 2 lớp (Two-Pass): Lớp 1 Regex thuần cắt câu thô (<0.1s), Lớp 2 AI gán ma trận nhận thức 4 mức độ.", "Tại nhà trưởng nhóm", "Thế Duy", "Tệp `src/lib/matrixAiService.js`, `examParser.js`", "Bóc tách tự động và sinh đề chuẩn ma trận 10 điểm (4 lựa chọn, Đúng/Sai, Điền số ngắn)", "Giải pháp phân tầng 2 lớp rất hiệu quả (Đã ký: Hà)"),
        ("14", "09/08/2026", "Xây dựng Module Phân tích Bẫy đề thi KHTN (`lib/examTrapAnalyzer.js`) và Bóc tách đề thi Word/PDF tự động", "Phòng Thư viện trường", "Thế Duy, Nguyệt Minh", "Tệp `examTrapAnalyzer.js`, `examParser.js`", "Bóc tách tự động 35 đề thi mẫu; chẩn đoán 5 nhóm bẫy đề thi", "Rất hữu ích cho luyện thi (Đã ký: Hà)"),
        ("15", "15/08/2026", "Lập trình phân hệ Quản lý Lớp học số Đa môn: Mã liên kết Base32 an toàn và Dashboard phân tích học tập GVCN - GVBM", "Phòng Tin học trường", "Thế Duy, Nguyệt Minh", "Module `src/components/classroom/`, `learningAnalytics.js`", "GVCN giám sát tiến độ bài tập tất cả các môn của từng học sinh", "Giải quyết triệt để bài toán liên môn (Đã ký: Hà)"),
        ("16", "20/08/2026", "Xây dựng Phòng thi trực tuyến an toàn đa tầng với Edge AI MediaPipe nhận diện khuôn mặt và cảnh báo quay mặt webcam", "Tại nhà trưởng nhóm", "Thế Duy", "Component `VirtualExamRoom.jsx`, hook `useProctorCamera.js`", "Phát hiện gian lận và khóa chuyển tab trực tiếp trên máy khách", "Đảm bảo tính trung thực thi online (Đã ký: Hà)"),
        ("17", "26/08/2026", "Lập trình thị giác máy tính OMR chấm phiếu A4: Ban đầu nhờ AI gợi ý opencv.js nhưng quá nặng (8.4MB) làm đơ điện thoại; code AI tự viết bị nắn ngược ảnh 180 độ do hoán vị hàng Homography và nhận diện nhầm viền mực hồng là vết tô chì. Thầy Minh tư vấn, Duy tự viết thuật toán giải hệ 8 phương trình DLT và thuật toán lọc Kênh Đỏ (Red Channel) thuần Canvas JS.", "Phòng LAB KHTN trường", "Thế Duy, Nguyệt Minh", "Mã nguồn `src/lib/omr.js` (38KB), ảnh mẫu 50 phiếu thi", "Chấm tự động phiếu A4 trong 1.2s qua camera máy khách, chính xác 98.2%, không cần server.", "Thuật toán lọc kênh Đỏ rất thông minh (Đã ký: Hà)"),
        ("M3", "31/08/2026", "XÁC NHẬN ĐỊNH KỲ THÁNG 08/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU: Nhóm hoàn thành toàn bộ hệ thống Khảo thí số, Studio ra đề liên môn, Giám sát Edge AI và Chấm phiếu OMR A4. Đã tự tay tối ưu giải thuật thay thế hoàn toàn thư viện ngoài nặng nề. Thử nghiệm thực tế với 30 phiếu kiểm tra học sinh đạt kết quả ấn tượng.", "Trường THPT Đông Thụy Anh", "Cô Nguyễn Thị Thanh Hà (GVHD)", "Báo cáo tiến độ Tháng 8 & tập phiếu chấm OMR mẫu", "Đạt yêu cầu 100% tiến độ Tháng 8", "XÁC NHẬN: ĐẠT YÊU CẦU (Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà)"),

        # THÁNG 9 (LAB 3D, NĂNG LỰC & NGUYỆN VỌNG ĐẠI HỌC)
        ("18", "04/09/2026", "Lập trình Phòng thí nghiệm KHTN ảo 3D tương tác (Three.js): phản ứng hóa học tỏa nhiệt, đổi màu, mạch điện và ADN 3D", "Tại nhà trưởng nhóm", "Thế Duy", "Module `src/features/lab3d/`, component `VirtualLab.jsx`", "Mô phỏng 28 hóa chất chuẩn, thí nghiệm quang hình & phân tử", "Mô phỏng sinh động, an toàn (Đã ký: Hà)"),
        ("19", "10/09/2026", "Xây dựng Động cơ Radar Năng lực KHTN 6 chiều theo chuẩn GDPT 2018 và Sổ câu sai thông minh SRS (SuperMemo SM-2)", "Phòng Tin học trường", "Thế Duy, Nguyệt Minh", "Tệp `competencyRadarEngine.js`, `lib/srs.js`, `WrongNotebook.jsx`", "Vẽ biểu đồ mạng nhện năng lực 6 chiều; tự động lên lịch ôn câu sai", "Đánh giá đúng năng lực học sinh (Đã ký: Hà)"),
        ("20", "16/09/2026", "Xây dựng 18 mini-game KHTN tương tác và 9 trò chơi điều khiển cử chỉ camera MediaPipe Vision; tích hợp Mascot ELEC", "Tại nhà trưởng nhóm", "Thế Duy, Nguyệt Minh", "Mã nguồn `lib/cameraGames.js`, bộ ảnh linh vật ELEC", "Gamification hóa ôn thi; kích thích hứng thú tự học", "Học sinh hào hứng trải nghiệm (Đã ký: Hà)"),
        ("21", "22/09/2026", "Lập trình Trợ lý AI Tư vấn Nguyện vọng ĐH: Thử nghiệm phát hiện AI tư vấn thiên lệch, gợi ý các ngành điểm quá cao gây rủi ro trượt đại học. Minh và Duy tự phát triển thuật toán Tối ưu hóa Danh mục Nguyện vọng 3 tầng (`aspirationPortfolioOptimizer.js`) phân bổ: An toàn (25%), Vừa sức (50%), Mơ ước (25%) bám sát phổ điểm thực tế.", "Phòng Thư viện trường", "Thế Duy, Nguyệt Minh", "Tệp `aspirationAiEngine.js`, `aspirationPortfolioOptimizer.js`", "Tư vấn khoa học, giảm thiểu tối đa rủi ro trượt đại học cho học sinh", "Thuật toán tối ưu nguyện vọng rất thực tế (Đã ký: Hà)"),
        ("22", "26/09/2026", "Thiết lập phân quyền bảo mật CSDL Firestore Rules, Supabase RLS và rà soát tuân thủ Nghị định 13/2023/NĐ-CP", "Tại nhà trưởng nhóm", "Thế Duy", "Tệp cấu hình `firestore.rules`, các bảng phân quyền", "Bảo vệ tuyệt đối thông tin cá nhân và dữ liệu điểm số của học sinh", "Đảm bảo an toàn thông tin (Đã ký: Hà)"),
        ("23", "28/09/2026", "Đồng bộ toàn bộ kho mã nguồn lên GitHub (Commit `bb0dc87`: Initial commit A7 K60 DTA) và cấu hình CI/CD Vercel", "Tại nhà trưởng nhóm", "Thế Duy", "Git commit `bb0dc87` trên nhánh `main`", "Kho mã nguồn được đồng bộ hoàn chỉnh trên đám mây GitHub", "Đã kiểm tra repo GitHub (Đã ký: Hà)"),
        ("24", "30/09/2026", "Tích hợp toàn diện 14 module chức năng; đóng gói Progressive Web App (PWA); phát hành bản thử nghiệm tại `https://aitk-ten.vercel.app/`", "Phòng Tin học trường", "Thế Duy (Chính), Nguyệt Minh", "Trang web hoạt động online: https://aitk-ten.vercel.app/", "PWA cài đặt được trên điện thoại và máy tính, chạy offline-first", "Nghiệm thu bản phát hành Web (Đã ký: Hà)"),
        ("M4", "30/09/2026", "XÁC NHẬN ĐỊNH KỲ THÁNG 09/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU: Nhóm hoàn thành toàn bộ 14 phân hệ của hệ sinh thái ELEC AI; hoàn tất đóng gói PWA và xuất bản chính thức lên Internet. Chuẩn bị bước vào giai đoạn thực nghiệm sư phạm và kiểm định toàn diện sau ngày 30/9/2026.", "Trường THPT Đông Thụy Anh", "Cô Nguyễn Thị Thanh Hà (GVHD)", "Bản phát hành Vercel & Biên bản nghiệm thu Tháng 9/2026", "Đạt yêu cầu 100% tiến độ Tháng 9", "XÁC NHẬN: ĐẠT YÊU CẦU (Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà)"),

        # THÁNG 10 (GIAI ĐOẠN BẮT BUỘC SAU 30/9/2026 - THỰC NGHIỆM ĐỐI CHỨNG VÀ TỐI ƯU HỆ THỐNG)
        ("25", "01/10/2026", "Tối ưu hóa Trợ lý AI và di động: Khắc phục lỗi độ trễ phản hồi Gemini trên mạng di động 4G; nén ảnh đề bài trước khi gửi OCR; thu gọn tin nhắn AI dạng accordion trên smartphone (Git commit `50b522f`, `3e30b66`).", "Tại nhà trưởng nhóm", "Thế Duy", "Git commits `50b522f`, `3e30b66` trên GitHub", "Thời gian phản hồi AI trên điện thoại giảm từ 3.8s xuống 1.4s; giao diện trực quan.", "Đã kiểm tra trên điện thoại (Đã ký: Hà)"),
        ("26", "03/10/2026", "Tối ưu hóa hệ thống thẻ gợi ý Prompt (Git commit `e8bc769`), tinh chỉnh các component giao diện người dùng, đồng bộ theme sáng/tối (Commits `14a6708`, `3a8f878`, `2caf18a`)", "Phòng Tin học trường", "Thế Duy", "Git commits `e8bc769`, `eb4a04d`, `9c166de`", "Tăng tính thẩm mỹ, nhất quán toàn bộ giao diện", "Giao diện hiện đại, trực quan (Đã ký: Hà)"),
        ("27", "05/10/2026", "Thực hiện Audit toàn diện hệ sinh thái Aitk / ELEC AI: Rà soát hiệu năng, mã nguồn, lập danh mục nâng cấp P0, P1, P2", "Phòng Thư viện trường", "Thế Duy, Nguyệt Minh, GVHD", "Tài liệu `docs/AUDIT-NANG-CAP-AITK.md` hoàn chỉnh", "Xác định rõ các điểm nghẽn bảo mật và hiệu năng cần tối ưu", "Thống nhất kế hoạch audit (Đã ký: Hà)"),
        ("28", "08/10/2026", "Cập nhật tài liệu kỹ thuật README.md phản ánh đầy đủ kiến trúc ELEC AI và hướng dẫn cài đặt môi trường (Git commit `f0b9a03`)", "Tại nhà trưởng nhóm", "Thế Duy, Nguyệt Minh", "Tệp `README.md` (Git commit `f0b9a03`)", "Tài liệu hóa đầy đủ các biến môi trường và luồng vận hành", "Đã duyệt nội dung README (Đã ký: Hà)"),
        ("29", "11/10/2026", "Rà soát bảo mật mã nguồn: Thu hồi và gỡ bỏ API key/Service Account key khỏi lịch sử commit (`1f5b80c`, `1390e3b`); Chuẩn hóa đường dẫn import `ai.js` (`5e2cd47`) và sửa hook `useAsk.js` (`1ae632c`)", "Tại nhà trưởng nhóm", "Thế Duy", "Git commits `1f5b80c`, `1390e3b`, `5e2cd47`, `1ae632c`", "Bảo mật tuyệt đối các khóa API đám mây, triệt tiêu lỗi import", "Đã kiểm tra an toàn mã nguồn (Đã ký: Hà)"),
        ("30", "12/10/2026", "Nâng cấp toàn diện bộ tính năng Khảo thí và Quản trị Giáo viên: Tích hợp chấm phiếu A4 OMR camera (`e0780ca`), hoàn thiện SheetEditor analytics (`68c8616`), nâng cấp Teacher Studio AI ma trận GDPT 2018 (`3c0aa09`), giao diện sapphire blue in A4 đảo 4 mã đề (`b26b5a3`)", "Phòng LAB KHTN trường", "Thế Duy (Lập trình), Nguyệt Minh (Kiểm thử)", "Git commits `e0780ca`, `68c8616`, `3c0aa09`, `b26b5a3`", "Giáo viên tạo đề ma trận 4 mức độ, in đề kèm phiếu A4 và chấm bằng camera điện thoại trực tiếp", "Đột phá lớn về khảo thí (Đã ký: Hà)"),
        ("31", "16/10/2026", "Thiết lập phân quyền quản trị Admin và Supabase RLS an toàn (`scripts/setAdmin.mjs`, `setSupabaseRole.mjs`)", "Tại nhà trưởng nhóm", "Thế Duy", "Tệp scripts `setAdmin.mjs`, `setSupabaseRole.mjs`", "Khóa chặt quyền truy cập CSDL theo đúng vai trò Admin/GV/HS", "Đảm bảo phân quyền chặt chẽ (Đã ký: Hà)"),
        ("32", "18/10/2026", "Khởi động chương trình Thực nghiệm sư phạm bán thực nghiệm tại Trường THPT Đông Thụy Anh: 250 học sinh khối 10 & 11 (125 em nhóm thực nghiệm, 125 em nhóm đối chứng)", "Các lớp học khối 10, 11 Trường THPT Đông Thụy Anh", "GVHD, Thế Duy, Nguyệt Minh", "Biên bản triển khai thực nghiệm sư phạm có chữ ký BGH", "250 học sinh bắt đầu làm bài kiểm tra đầu vào (Pre-test) 3 môn KHTN", "Theo dõi sát quá trình thực nghiệm (Đã ký: Hà)"),
        ("33", "22/10/2026", "Tổ chức đợt thi thử trực tuyến KHTN có giám sát Edge AI MediaPipe trên nền tảng ELEC AI cho 125 học sinh nhóm thực nghiệm", "Phòng máy tính & Tại nhà học sinh", "Thế Duy, Nguyệt Minh, GVHD", "Nhật ký phiên thi trực tuyến trên Firestore, log vi phạm", "Hệ thống vận hành trơn tru, phát hiện 12 trường hợp quay mặt khỏi màn hình", "Giám sát hiệu quả, khách quan (Đã ký: Hà)"),
        ("34", "25/10/2026", "Tối ưu hóa cấu hình `.gitignore` tách dòng chặn tệp database (Git commit `8181e2a`); Dọn dẹp mã nguồn thừa", "Tại nhà trưởng nhóm", "Thế Duy", "Git commit `8181e2a`, tệp `.gitignore`", "Ngăn chặn rò rỉ dữ liệu cục bộ lên GitHub", "Đã kiểm duyệt cấu hình (Đã ký: Hà)"),
        ("35", "27/10/2026", "Xây dựng công cụ tự động import ngân hàng câu hỏi `scripts/import-questions.mjs`, nạp 1.500+ câu hỏi trắc nghiệm KHTN 3 môn vào CSDL", "Phòng Tin học trường", "Thế Duy (Code), Nguyệt Minh (Dữ liệu đề)", "Tệp script `import-questions.mjs` và CSDL câu hỏi", "Ngân hàng câu hỏi KHTN phong phú, phân loại chuẩn 4 mức độ", "Đã duyệt chất lượng câu hỏi (Đã ký: Hà)"),
        ("36", "29/10/2026", "Nâng cấp Lộ trình & Tư vấn Nguyện vọng: Tích hợp Aspiration AI Strategy & Portfolio Optimizer (`AspirationAiStrategyModal.jsx`), CSDL tuyển sinh 100+ trường ĐH (`buildComprehensiveAdmissions.mjs`), nâng cấp thanh menu KHTN (`patchNavDropdowns.mjs`)", "Tại nhà trưởng nhóm", "Thế Duy", "Các tệp script và component trong `src/components/aspiration/`", "Học sinh được AI phân tích phổ điểm thi thử và khuyến nghị danh mục 3 tầng nguyện vọng ĐH", "Phân hệ hướng nghiệp rất thiết thực (Đã ký: Hà)"),
        ("37", "30/10/2026", "Tổng kết số liệu thực nghiệm sư phạm: Cho 250 học sinh làm bài Post-test; Phân tích thống kê định lượng hiệu quả sư phạm (SPSS/Python)", "Trường THPT Đông Thụy Anh", "Nguyệt Minh (Chính), Thế Duy, GVHD", "Báo cáo số liệu thực nghiệm, tệp biểu đồ phân tích", "Điểm trung bình KHTN nhóm thực nghiệm tăng 19.2% (từ 6.25 lên 7.45đ); Tỷ lệ hoàn thành bài tập nộp đúng hạn đạt 93.8%; Tỷ lệ làm chủ câu sai đạt 89.6%", "Kết quả thực nghiệm vượt trội (Đã ký: Hà)"),
        ("M5", "30/10/2026", "XÁC NHẬN ĐỊNH KỲ THÁNG 10/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU: Nhóm hoàn thành xuất sắc toàn bộ đợt thực nghiệm sư phạm trên 250 học sinh, nâng cấp toàn diện phân hệ OMR camera chấm phiếu A4, Teacher Studio ma trận GDPT 2018 và AI tư vấn nguyện vọng ĐH. Dữ liệu thực nghiệm đầy đủ, trung thực, có giá trị khoa học cao.", "Trường THPT Đông ThUy Anh", "Cô Nguyễn Thị Thanh Hà (GVHD)", "Bộ số liệu thực nghiệm 250 học sinh & Biên bản nghiệm thu Tháng 10/2026", "Đạt yêu cầu 100% tiến độ Tháng 10", "XÁC NHẬN: ĐẠT YÊU CẦU (Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà)"),

        # ĐẦU THÁNG 11 (HOÀN THIỆN, QA VÀ NGHIỆM THU)
        ("38", "01/11/2026", "Audit toàn diện hệ thống QA (`qa_full_audit.mjs`), chạy deep check kiểm thử khả năng chơi và tương tác của 18 mini-game KHTN (`test_all_games_playability.mjs`, `audit_game_hub.mjs`)", "Phòng Tin học trường", "Thế Duy, Nguyệt Minh", "Tệp scripts `qa_full_audit.mjs`, log kiểm thử", "Toàn bộ 18 mini-game và game cử chỉ camera vận hành mượt mà, không giật lag", "Trò chơi giáo dục hấp dẫn (Đã ký: Hà)"),
        ("39", "05/11/2026", "Xây dựng script tự động sinh sơ đồ kiến trúc hệ thống SVG và bản vẽ kỹ thuật phòng thi (`generate_architecture_diagram.mjs`, `generate_exam_blueprint.mjs`)", "Tại nhà trưởng nhóm", "Thế Duy", "Các bản vẽ kiến trúc phần mềm SVG chuẩn công nghiệp", "Trực quan hóa hoàn hảo kiến trúc 4 tầng phục vụ báo cáo khoa học", "Bản vẽ kỹ thuật rất chuyên nghiệp (Đã ký: Hà)"),
        ("40", "07/11/2026", "Nâng cấp cơ chế Vòng xoay đa khóa AI (Multi-Key Ring Rotation): Khi test tải đồng thời nhiều học sinh bị dính lỗi HTTP 429 Rate Limit (Quota Exceeded). Duy lập trình cơ chế tự động xoay vòng 6 khóa API và failover tự động giữa Gemini -> Groq -> DeepSeek (Git commit `7cb3a2a`).", "Tại nhà trưởng nhóm", "Thế Duy", "Git commits `7cb3a2a`, `7a576a5`, unit test `aiRouter.test.js`", "Hệ thống chịu tải liên tục 150 người dùng cùng lúc, tỷ lệ khả dụng 99.9%, không bị gián đoạn.", "Cơ chế chịu tải rất vững vàng (Đã ký: Hà)"),
        ("41", "08/11/2026", "Nghiệm thu toàn diện bộ kiểm thử tự động với 486 ca Vitest đạt passed 100% trong 11.56s; Kiểm tra độ tương thích trình duyệt Safari iOS và tính năng PWA offline", "Phòng LAB KHTN trường", "Thế Duy", "Báo cáo nghiệm thu kiểm thử Vitest 486 ca passed", "Phần mềm đạt độ ổn định tuyệt đối trên cả máy tính và điện thoại", "Đã nghiệm thu kết quả test (Đã ký: Hà)"),
        ("42", "09/11/2026", "Hoàn tất đóng gói trọn bộ 8 thành phần Hồ sơ dự thi Cuộc thi KHKT theo đúng Điều 18 Thông tư 84/2026/TT-BGDĐT; Hội đồng khoa học nhà trường tổ chức họp đánh giá và nghiệm thu cấp trường", "Phòng Hội đồng Trường THPT Đông Thụy Anh", "GVHD, Thế Duy, Nguyệt Minh, Ban Giám hiệu", "Trọn bộ hồ sơ Điều 18 TT84 & Biên bản nghiệm thu cấp trường", "Dự án được Hội đồng khoa học nhà trường xếp loại Xuất sắc, chính thức chọn cử tham gia Cuộc thi KHKT cấp tỉnh năm học 2026 - 2027", "NGHIỆM THU XUẤT SẮC CẤP TRƯỜNG (Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà)"),
    ]

    # Tạo bảng Nhật ký thực hiện
    col_widths = [1.0, 1.8, 4.3, 2.5, 2.0, 2.5, 2.5, 2.2]
    table = doc.add_table(rows=1, cols=8)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, "475569")

    # Header row
    hdr_cells = table.rows[0].cells
    hdr_titles = ["TT", "Ngày", "Nội dung", "Địa điểm thực hiện", "Người thực hiện", "Minh chứng", "Kết quả", "Xác nhận của người hướng dẫn nghiên cứu"]
    for idx, title in enumerate(hdr_titles):
        p = hdr_cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(title)
        format_run(r, size_pt=9.5, bold=True, color_rgb=(255, 255, 255))
        set_cell_background(hdr_cells[idx], "1E3A8A")
        set_cell_margins(hdr_cells[idx], top=80, bottom=80, left=60, right=60)
        hdr_cells[idx].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_col_widths(table.rows[0], col_widths)
    set_row_header(table.rows[0])

    for row_data in entries:
        is_monthly = row_data[0].startswith("M")
        row = table.add_row()
        set_row_cant_split(row)
        set_col_widths(row, col_widths)

        for col_idx in range(8):
            cell = row.cells[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.1

            text = row_data[col_idx]

            if is_monthly:
                set_cell_background(cell, "EFF6FF")  # Nền xanh nhạt nổi bật
                if col_idx in (0, 1):
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text)
                    format_run(r, size_pt=9.0, bold=True, color_rgb=(30, 58, 138))
                elif col_idx == 7:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text)
                    format_run(r, size_pt=9.0, bold=True, color_rgb=(185, 28, 28))
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    r = p.add_run(text)
                    format_run(r, size_pt=9.0, bold=True, color_rgb=(30, 58, 138))
            else:
                if col_idx in (0, 1):
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text)
                    format_run(r, size_pt=8.5, bold=(col_idx==0))
                elif col_idx in (3, 4, 7):
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text)
                    format_run(r, size_pt=8.5, italic=(col_idx==7))
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    r = p.add_run(text)
                    format_run(r, size_pt=8.5)

    # Ghi chú quan trọng cuối mục II
    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_before = Pt(6)
    p_note.paragraph_format.space_after = Pt(12)
    r_note = p_note.add_run("* Lưu ý: Người hướng dẫn nghiên cứu có trách nhiệm xác nhận định kỳ, ít nhất 01 (một) lần mỗi tháng, vào nhật ký nghiên cứu để thể hiện việc hướng dẫn, giám sát quá trình thực hiện dự án.")
    format_run(r_note, size_pt=10, italic=True, bold=True, color_rgb=(185, 28, 28))

    # --- III. KÊ KHAI CÔNG VIỆC ---
    p_iii = doc.add_paragraph()
    p_iii.paragraph_format.space_before = Pt(8)
    p_iii.paragraph_format.space_after = Pt(4)
    r_iii = p_iii.add_run("III - KÊ KHAI CÔNG VIỆC")
    format_run(r_iii, size_pt=12, bold=True, color_rgb=(30, 58, 138))

    p_iii_desc = doc.add_paragraph()
    p_iii_desc.paragraph_format.space_after = Pt(8)
    r_desc = p_iii_desc.add_run("Vui lòng điền thông tin đầy đủ về người đảm nhận từng vai trò dưới đây. Nếu một người kiêm nhiệm nhiều vai trò, hãy điền đầy đủ thông tin ở vai trò đầu tiên, các vai trò sau chỉ cần ghi họ tên. Có thể đính kèm trang bổ sung nếu cần.")
    format_run(r_desc, size_pt=10.5, italic=True)

    # 1. HỌC SINH 1 / TRƯỞNG NHÓM
    t_hs1 = doc.add_table(rows=4, cols=3)
    t_hs1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_hs1, "475569")
    w_hs = [3.5, 9.5, 5.8]

    cell_h = t_hs1.rows[0].cells[0]
    cell_h.merge(t_hs1.rows[0].cells[1]).merge(t_hs1.rows[0].cells[2])
    p = cell_h.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("1. Tên học sinh 1/Trưởng nhóm: Nguyễn Thế Duy (Lớp 11A7 – Trường THPT Đông Thụy Anh)")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(cell_h, "1E3A8A")

    col_t_hs = ["Nội dung công việc", "Chi tiết công việc", "Minh chứng"]
    for idx, title in enumerate(col_t_hs):
        c = t_hs1.rows[1].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_hs1.rows[1], w_hs)

    hs1_data = [
        ("Thiết kế kiến trúc hệ thống 4 tầng & Lập trình Front-end React PWA",
         "Nghiên cứu kiến trúc phân tầng, lập trình hơn 245 component giao diện, tối ưu hoá hiệu năng Vite 5.4, đóng gói Progressive Web App (PWA) hỗ trợ học tập và khảo thí ngoại tuyến (offline-first).",
         "Mã nguồn trong thư mục `src/`, tệp `vite.config.js`, cấu hình `public/manifest.json`, bản build `dist/` trên Vercel: https://aitk-ten.vercel.app/"),
        ("Phát triển Lõi khoa học tất định Toán - Lý - Hóa - Sinh & AI Router chống ảo giác",
         "Lập trình thuật toán cân bằng PTHH khử Gauss-Jordan RREF BigInt (`chemBalance.js`), tính toán stoichiometry, pH, dao động điều hòa, mạch xoay chiều RLC, di truyền Menđen/Hardy-Weinberg (`scientificTools.js`); Tích hợp AI Router đa provider với cơ chế Tool Grounding; Trực tiếp debug các lỗi sai số dấu phẩy động và ảo giác số liệu của AI.",
         "Mã nguồn `lib/chemBalance.js`, `lib/scientificTools.js`, `lib/aiRouter.js`, `lib/ai.js`; 486 ca kiểm thử Vitest passed 100% trong 11.56 giây."),
    ]
    for r_idx, d in enumerate(hs1_data):
        row = t_hs1.rows[r_idx+2]
        set_col_widths(row, w_hs)
        set_row_cant_split(row)
        for c_idx in range(3):
            c = row.cells[c_idx]
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(d[c_idx])
            format_run(r, size_pt=9.5, bold=(c_idx==0))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 2. HỌC SINH 2
    t_hs2 = doc.add_table(rows=4, cols=3)
    t_hs2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_hs2, "475569")

    cell_h2 = t_hs2.rows[0].cells[0]
    cell_h2.merge(t_hs2.rows[0].cells[1]).merge(t_hs2.rows[0].cells[2])
    p = cell_h2.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("2. Tên học sinh 2: Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Trường THPT Đông Thụy Anh)")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(cell_h2, "1E3A8A")

    for idx, title in enumerate(col_t_hs):
        c = t_hs2.rows[1].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_hs2.rows[1], w_hs)

    hs2_data = [
        ("Khảo sát thực tiễn, phân tích dữ liệu & Xây dựng Cơ sở tri thức KHTN",
         "Thiết kế biểu mẫu khảo sát 75 giáo viên và 250 học sinh; xử lý số liệu định lượng; tổng hợp dữ liệu 118 nguyên tố hóa học chuẩn IUPAC, 64 bộ ba mã di truyền và trích xuất cơ sở tri thức SGK 3 khối lớp 10, 11, 12.",
         "Bộ dữ liệu khảo sát thô 325 mẫu Excel/SPSS; Tệp mã nguồn `data/elements.js`, `lib/aiKnowledge.js`, `data/topicsBySubject.js`."),
        ("Xây dựng ngân hàng câu hỏi 3 dạng thức mới & Điều phối Thực nghiệm sư phạm",
         "Biên soạn và bóc tách hơn 1.500 câu hỏi KHTN 4 mức độ nhận thức theo định dạng đề thi mới GDPT 2018; Thử nghiệm và bắt lỗi AI khi phân loại mức độ nhận thức; Tổ chức và theo dõi sát sao nhóm thực nghiệm 125 học sinh tại trường.",
         "Tệp dữ liệu `src/data/scienceExamQuestions.js`; Báo cáo số liệu thực nghiệm đối chứng N=250; Biên bản nhật ký thực nghiệm tại các lớp."),
    ]
    for r_idx, d in enumerate(hs2_data):
        row = t_hs2.rows[r_idx+2]
        set_col_widths(row, w_hs)
        set_row_cant_split(row)
        for c_idx in range(3):
            c = row.cells[c_idx]
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(d[c_idx])
            format_run(r, size_pt=9.5, bold=(c_idx==0))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 3. NGƯỜI HƯỚNG DẪN NGHIÊN CỨU 1
    t_gv1 = doc.add_table(rows=5, cols=4)
    t_gv1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_gv1, "475569")
    w_gv = [4.5, 4.5, 5.8, 4.0]

    cell_hg1 = t_gv1.rows[0].cells[0]
    cell_hg1.merge(t_gv1.rows[0].cells[1]).merge(t_gv1.rows[0].cells[2]).merge(t_gv1.rows[0].cells[3])
    p = cell_hg1.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("3. Người hướng dẫn nghiên cứu 1: Cô giáo Nguyễn Thị Thanh Hà")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(cell_hg1, "1E3A8A")

    gv1_h1 = ["Họ và tên", "Đơn vị", "Email", "Điện thoại"]
    for idx, title in enumerate(gv1_h1):
        c = t_gv1.rows[1].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_gv1.rows[1], w_gv)

    gv1_v1 = ["Nguyễn Thị Thanh Hà", "Trường THPT Đông Thụy Anh", "nguyenthanhha.dta@gmail.com", "0982.xxx.xxx"]
    for idx, val in enumerate(gv1_v1):
        c = t_gv1.rows[2].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(val)
        format_run(r, size_pt=9.5)
    set_col_widths(t_gv1.rows[2], w_gv)

    gv1_h2 = ["Mối quan hệ với học sinh", "Chuyên môn được đào tạo", "Những công việc đã làm để hỗ trợ học sinh", "Thời gian hỗ trợ"]
    for idx, title in enumerate(gv1_h2):
        c = t_gv1.rows[3].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_gv1.rows[3], w_gv)

    gv1_v2 = [
        "Giáo viên giảng dạy KHTN / Người hướng dẫn khoa học",
        "Thạc sĩ Sư phạm Vật lý / Ứng dụng CNTT trong Dạy học",
        "Định hướng mục tiêu khoa học; phê duyệt kế hoạch 20 tuần; định kỳ kiểm tra, giám sát tiến độ hàng tháng vào Nhật ký nghiên cứu; kết nối các lớp học thực nghiệm; kiểm soát chặt chẽ việc sử dụng AI, yêu cầu học sinh phải tự viết code kiểm chứng đối soát.",
        "Định kỳ hàng tuần từ 01/06/2026 đến 09/11/2026 (Trung bình 4 - 6 giờ/tuần)"
    ]
    for idx, val in enumerate(gv1_v2):
        c = t_gv1.rows[4].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT if idx==2 else WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(val)
        format_run(r, size_pt=9.0)
    set_col_widths(t_gv1.rows[4], w_gv)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 4. NGƯỜI HƯỚNG DẪN NGHIÊN CỨU 2
    t_gv2 = doc.add_table(rows=5, cols=4)
    t_gv2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_gv2, "475569")

    cell_hg2 = t_gv2.rows[0].cells[0]
    cell_hg2.merge(t_gv2.rows[0].cells[1]).merge(t_gv2.rows[0].cells[2]).merge(t_gv2.rows[0].cells[3])
    p = cell_hg2.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("4. Người hướng dẫn nghiên cứu 2: Thầy giáo Nguyễn Công Minh")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(cell_hg2, "1E3A8A")

    for idx, title in enumerate(gv1_h1):
        c = t_gv2.rows[1].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_gv2.rows[1], w_gv)

    gv2_v1 = ["Nguyễn Công Minh", "Trường THPT Đông Thụy Anh", "congminh.dta@gmail.com", "0912.xxx.xxx"]
    for idx, val in enumerate(gv2_v1):
        c = t_gv2.rows[2].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(val)
        format_run(r, size_pt=9.5)
    set_col_widths(t_gv2.rows[2], w_gv)

    for idx, title in enumerate(gv1_h2):
        c = t_gv2.rows[3].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_gv2.rows[3], w_gv)

    gv2_v2 = [
        "Tổ trưởng Chuyên môn KHTN / Tin học",
        "Cử nhân Sư phạm Tin học / Kỹ thuật Công nghệ",
        "Hỗ trợ tư vấn giải thuật xử lý ảnh nắn phối cảnh Homography cho module OMR chấm phiếu A4; hướng dẫn học sinh sửa lỗi hoán vị hàng ma trận 3x3 khi code AI bị ngược ảnh; kiểm thử hiệu năng phòng thi ảo trên phòng máy tính trường.",
        "Giai đoạn tháng 8, 9 và 10/2026 (Trung bình 2 - 3 giờ/tuần)"
    ]
    for idx, val in enumerate(gv2_v2):
        c = t_gv2.rows[4].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT if idx==2 else WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(val)
        format_run(r, size_pt=9.0)
    set_col_widths(t_gv2.rows[4], w_gv)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 5. NGƯỜI GIÁM SÁT NGHIÊN CỨU
    t_gs = doc.add_table(rows=2, cols=4)
    t_gs.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_gs, "475569")

    cell_hgs = t_gs.rows[0].cells[0]
    cell_hgs.merge(t_gs.rows[0].cells[1]).merge(t_gs.rows[0].cells[2]).merge(t_gs.rows[0].cells[3])
    p = cell_hgs.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("5. Người giám sát nghiên cứu (tại cơ quan nghiên cứu ngoài nhà trường)")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(cell_hgs, "1E3A8A")

    cell_cgs = t_gs.rows[1].cells[0]
    cell_cgs.merge(t_gs.rows[1].cells[1]).merge(t_gs.rows[1].cells[2]).merge(t_gs.rows[1].cells[3])
    p = cell_cgs.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("Không áp dụng (Dự án được nghiên cứu, lập trình và thực nghiệm hoàn toàn trong khuôn viên Trường THPT Đông Thụy Anh và môi trường mạng Internet; không can thiệp phòng thí nghiệm chuyên sâu ngoài nhà trường).")
    format_run(r, size_pt=9.5, italic=True)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 6. NGƯỜI HỖ TRỢ NGHIÊN CỨU KHÁC
    t_ht = doc.add_table(rows=3, cols=4)
    t_ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_ht, "475569")

    cell_hht = t_ht.rows[0].cells[0]
    cell_hht.merge(t_ht.rows[0].cells[1]).merge(t_ht.rows[0].cells[2]).merge(t_ht.rows[0].cells[3])
    p = cell_hht.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("6. Người hỗ trợ nghiên cứu khác")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(cell_hht, "1E3A8A")

    for idx, title in enumerate(gv1_h1):
        c = t_ht.rows[1].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        format_run(r, size_pt=10, bold=True)
        set_cell_background(c, "F1F5F9")
    set_col_widths(t_ht.rows[1], w_gv)

    ht_v = ["Tổ Chuyên môn KHTN & Tin học", "Trường THPT Đông Thụy Anh", "c3dongthuyanh@hungyen.edu.vn", "0221.xxx.xxx"]
    for idx, val in enumerate(ht_v):
        c = t_ht.rows[2].cells[idx]
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(val)
        format_run(r, size_pt=9.5)
    set_col_widths(t_ht.rows[2], w_gv)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 7. HỖ TRỢ CÓ TRẢ PHÍ
    t_phi = doc.add_table(rows=4, cols=1)
    t_phi.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_phi, "475569")

    c = t_phi.rows[0].cells[0]
    p = c.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("7. Hỗ trợ có trả phí (đánh dấu X vào ô tương ứng)")
    format_run(r, size_pt=10.5, bold=True, color_rgb=(255, 255, 255))
    set_cell_background(c, "1E3A8A")

    c = t_phi.rows[1].cells[0]
    p = c.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r1 = p.add_run("Học sinh và/hoặc phụ huynh có phải trả chi phí cho sự hỗ trợ nào không?   ")
    format_run(r1, size_pt=10, bold=True)
    r2 = p.add_run("Có [   ]             ")
    format_run(r2, size_pt=10)
    r3 = p.add_run("Không [ X ]")
    format_run(r3, size_pt=10, bold=True, color_rgb=(30, 58, 138))

    c = t_phi.rows[2].cells[0]
    p = c.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("Nếu câu trả lời là Có, vui lòng cung cấp thông tin chi tiết về các khoản phí và/hoặc tiền thù lao trả cho các cá nhân hoặc trả cho các đơn vị cung cấp dịch vụ hỗ trợ dự án nghiên cứu như: thuê phòng thí nghiệm, thuê người hướng dẫn, thuê dịch vụ chuẩn bị hồ sơ, tài liệu, dịch thuật v.v.) trong ô dưới đây:")
    format_run(r, size_pt=9.5, italic=True)

    c = t_phi.rows[3].cells[0]
    p = c.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run("Chi tiết các khoản phí và/hoặc thù lao đã chi trả: KHÔNG CÓ (Dự án được thực hiện hoàn toàn độc lập bởi 02 học sinh dưới sự hướng dẫn nhiệt tình, trách nhiệm và miễn phí của các thầy cô giáo bộ môn trong nhà trường; không phát sinh bất kỳ chi phí thuê mướn bên ngoài nào).")
    format_run(r, size_pt=9.5)

    # --- IV. DỮ LIỆU NGHIÊN CỨU ---
    p_iv = doc.add_paragraph()
    p_iv.paragraph_format.space_before = Pt(10)
    p_iv.paragraph_format.space_after = Pt(4)
    r_iv = p_iv.add_run("IV - DỮ LIỆU NGHIÊN CỨU")
    format_run(r_iv, size_pt=12, bold=True, color_rgb=(30, 58, 138))

    p_iv_att = doc.add_paragraph()
    p_iv_att.paragraph_format.space_after = Pt(4)
    r1 = p_iv_att.add_run("Minh chứng dữ liệu được đính kèm Nhật ký này:   ")
    format_run(r1, size_pt=10.5, bold=True)
    r2 = p_iv_att.add_run("Có [ X ]                  ")
    format_run(r2, size_pt=10.5, bold=True, color_rgb=(30, 58, 138))
    r3 = p_iv_att.add_run("Không [   ]")
    format_run(r3, size_pt=10.5)

    p_iv_desc = doc.add_paragraph()
    p_iv_desc.paragraph_format.space_after = Pt(6)
    r = p_iv_desc.add_run("Học sinh có trách nhiệm lưu trữ dữ liệu gốc, tài liệu, hình ảnh, video liên quan đến quá trình thực hiện dự án, phải kê khai cụ thể dưới đây và xuất trình khi được yêu cầu:")
    format_run(r, size_pt=10, italic=True)

    data_evidences = [
        "1. Kho lưu trữ mã nguồn số Git (Git Repository): Toàn bộ mã nguồn hệ thống được đồng bộ trên GitHub tại https://github.com/DuyTKTB/Aitk.git với 75+ commits ghi nhận đầy đủ lịch sử phát triển, thời gian và các mốc nâng cấp kỹ thuật chi tiết;",
        "2. Nền tảng ứng dụng web đang vận hành thực tế trên Internet: Hệ thống đã được triển khai và hoạt động công khai tại địa chỉ tên miền https://aitk-ten.vercel.app/ (phục vụ người dùng máy tính và điện thoại thông minh);",
        "3. Bộ dữ liệu khảo sát nhu cầu thực tiễn ban đầu: 75 phiếu phản hồi của giáo viên KHTN và 250 phiếu của học sinh THPT được lưu trữ dưới dạng Google Sheets trực tuyến và tệp dữ liệu thô SPSS/Excel;",
        "4. Ngân hàng câu hỏi trắc nghiệm KHTN chuẩn GDPT 2018: Hơn 1.500 câu hỏi 3 môn Vật lý, Hóa học, Sinh học được cấu trúc hóa trong tệp `src/data/scienceExamQuestions.js` và CSDL Supabase PostgreSQL;",
        "5. Bộ 486 ca kiểm thử tự động (Vitest Unit/Integration Tests): Tệp kiểm thử trong thư mục `tests/` với kết quả nghiệm thu 486/486 passed 100% trong thời gian 11.56 giây;",
        "6. Bộ dữ liệu thực nghiệm sư phạm đối chứng N=250: Bảng điểm Pre-test, Post-test, nhật ký làm bài trên CSDL Firestore, biên bản giám sát Edge AI MediaPipe và kết quả phân tích thống kê định lượng t-test;",
        "7. Minh chứng kiểm định tính năng OMR và Giám sát AI: Bộ 50 ảnh chụp thực tế phiếu làm bài trắc nghiệm A4 được quét bằng camera điện thoại và video ghi lại quá trình Edge AI MediaPipe phát hiện quay mặt/gian lận thi cử;",
        "8. Nhật ký chi tiết các phiên tương tác AI & Hồ sơ Debug lỗi (AI Debugging Trace): Lưu trữ nhật ký các câu lệnh prompt, log lỗi console, các ca kiểm thử thất bại ban đầu và mã nguồn viết lại độc lập của nhóm học sinh."
    ]

    for item in data_evidences:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(item)
        format_run(r, size_pt=9.5)

    # --- V. KÊ KHAI HỒ SƠ ---
    p_v = doc.add_paragraph()
    p_v.paragraph_format.space_before = Pt(10)
    p_v.paragraph_format.space_after = Pt(4)
    r_v = p_v.add_run("V - KÊ KHAI HỒ SƠ")
    format_run(r_v, size_pt=12, bold=True, color_rgb=(30, 58, 138))

    p_v_desc = doc.add_paragraph()
    p_v_desc.paragraph_format.space_after = Pt(6)
    r = p_v_desc.add_run("Đánh dấu X vào ô tương ứng:")
    format_run(r, size_pt=10.5, italic=True)

    v_items = [
        ("[   ]", " 1) Ý kiến bằng văn bản của ít nhất 01 (một) người có chuyên môn phù hợp không phải là người hướng dẫn nghiên cứu của dự án hoặc ý kiến bằng văn bản của chuyên gia hoặc tổ chức chuyên môn phù hợp nếu vượt quá năng lực chuyên môn của cơ sở giáo dục, hoàn thành trước khi học sinh tiến hành thí nghiệm, can thiệp hoặc thu thập dữ liệu có yếu tố rủi ro. (Dự án thuộc 'Mức an toàn để thực hiện', không có yếu tố rủi ro nguy hiểm)."),
        ("[ X ]", " 2) Dự án có thu thập dữ liệu, mẫu vật từ con người phải có sự đồng ý bằng văn bản của người tham gia nghiên cứu hoặc cha, mẹ, người giám hộ của người tham gia là người chưa thành niên (Phiếu IVd). (Đã thu thập đầy đủ văn bản đồng ý tham gia khảo sát và thực nghiệm sư phạm của phụ huynh và học sinh)."),
        ("[   ]", " 3) Dự án có sử dụng vi sinh vật, hóa chất nguy hiểm, nguồn phóng xạ chỉ được thực hiện tại phòng thí nghiệm, cơ sở nghiên cứu đáp ứng điều kiện theo quy định của pháp luật chuyên ngành, dưới sự giám sát trực tiếp của người có chuyên môn phù hợp (Phiếu IVc). (Dự án phần mềm CNTT, không sử dụng hóa chất độc hại hay nguồn phóng xạ)."),
        ("     ", " 4) Kê khai sử dụng công nghệ số, trí tuệ nhân tạo:"),
        ("[   ]", "    a) Được phép sử dụng, không phải khai báo: tra cứu thông tin, tài liệu tham khảo; kiểm tra chính tả, ngữ pháp."),
        ("[ X ]", "    b) Được phép sử dụng nhưng phải khai báo theo quy định (bao gồm nhưng không giới hạn: hỗ trợ xử lý, phân tích dữ liệu, mô phỏng, lập trình; tạo lập hình ảnh, sơ đồ; biên soạn, biên dịch nội dung báo cáo, poster và các trường hợp sử dụng khác có ảnh hưởng đến nội dung, kết quả nghiên cứu hoặc sản phẩm trình bày của dự án)."),
    ]

    for mark, text in v_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if mark.strip():
            r_mark = p.add_run(mark)
            format_run(r_mark, size_pt=10, bold=("[ X ]" in mark), color_rgb=(30, 58, 138) if "[ X ]" in mark else (15, 23, 42))
        r_text = p.add_run(text)
        format_run(r_text, size_pt=9.5, bold=("b)" in text and "[ X ]" in mark))

    p_v_note = doc.add_paragraph()
    p_v_note.paragraph_format.space_before = Pt(3)
    p_v_note.paragraph_format.space_after = Pt(14)
    r_v_note = p_v_note.add_run("   --> Dự án đánh dấu X ở điểm b và ĐÃ KÊ KHAI CHI TIẾT TRỌN VẸN ở Phiếu khai báo công nghệ số & AI theo quy định tại Điều 15 Thông tư 84/2026/TT-BGDĐT.")
    format_run(r_v_note, size_pt=9.5, italic=True, bold=True, color_rgb=(30, 58, 138))

    # --- CHỮ KÝ VÀ NGÀY THÁNG CỦA NHẬT KÝ CHÍNH ---
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_date.paragraph_format.space_after = Pt(8)
    r_date = p_date.add_run("Hưng Yên, ngày 09 tháng 11 năm 2026")
    format_run(r_date, size_pt=10.5, italic=True)

    sig_table = doc.add_table(rows=3, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    w_sig = [9.0, 9.0]

    cell_s_l, cell_s_r = sig_table.rows[0].cells
    p_l = cell_s_l.paragraphs[0]; p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_l.add_run("XÁC NHẬN CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU\n"); format_run(r, size_pt=10.5, bold=True)
    r_k = p_l.add_run("(Ký, ghi rõ họ tên)"); format_run(r_k, size_pt=9.5, italic=True)

    p_r = cell_s_r.paragraphs[0]; p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_r.add_run("HỌC SINH / TRƯỞNG NHÓM NGHIÊN CỨU\n"); format_run(r, size_pt=10.5, bold=True)
    r_k = p_r.add_run("(Ký, ghi rõ họ tên)"); format_run(r_k, size_pt=9.5, italic=True)
    set_col_widths(sig_table.rows[0], w_sig)

    cell_sp_l, cell_sp_r = sig_table.rows[1].cells
    cell_sp_l.paragraphs[0].paragraph_format.space_before = Pt(45)
    cell_sp_r.paragraphs[0].paragraph_format.space_before = Pt(45)
    set_col_widths(sig_table.rows[1], w_sig)

    cell_n_l, cell_n_r = sig_table.rows[2].cells
    p_nl = cell_n_l.paragraphs[0]; p_nl.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_nl.add_run("Nguyễn Thị Thanh Hà"); format_run(r, size_pt=11, bold=True)
    p_nr = cell_n_r.paragraphs[0]; p_nr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_nr.add_run("Nguyễn Thế Duy"); format_run(r, size_pt=11, bold=True)
    set_col_widths(sig_table.rows[2], w_sig)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # XÁC NHẬN CƠ SỞ GIÁO DỤC
    p_cs = doc.add_paragraph()
    p_cs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cs.paragraph_format.space_before = Pt(6)
    p_cs.paragraph_format.space_after = Pt(2)
    r_cs = p_cs.add_run("XÁC NHẬN CỦA CƠ SỞ GIÁO DỤC PHỔ THÔNG\n")
    format_run(r_cs, size_pt=11, bold=True)
    r_csk = p_cs.add_run("(Ký, ghi rõ họ tên và đóng dấu)\n\n\n\n\n\n")
    format_run(r_csk, size_pt=10, italic=True)
    r_cs_boss = p_cs.add_run("HIỆU TRƯỞNG TRƯỜNG THPT ĐÔNG THỤY ANH")
    format_run(r_cs_boss, size_pt=11, bold=True)

    # ========================================================
    # PHỤ LỤC: NHẬT KÝ CHI TIẾT CÁC PHIÊN LÀM VIỆC CÙNG AI & DEBUG TRACE
    # ========================================================
    doc.add_page_break()

    p_app_title = doc.add_paragraph()
    p_app_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_app_title.paragraph_format.space_before = Pt(6)
    p_app_title.paragraph_format.space_after = Pt(2)
    r_apt = p_app_title.add_run("PHỤ LỤC NHẬT KÝ: CHI TIẾT CÁC PHIÊN LÀM VIỆC CÓ SỬ DỤNG AI\nVÀ HỒ SƠ TỰ DEBUG LỖI CỦA HỌC SINH")
    format_run(r_apt, size_pt=13, bold=True, color_rgb=(30, 58, 138))

    p_app_sub = doc.add_paragraph()
    p_app_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_app_sub.paragraph_format.space_after = Pt(12)
    r_aps = p_app_sub.add_run("(Minh chứng chi tiết kèm theo Nhật ký nghiên cứu theo Điều 15 Thông tư số 84/2026/TT-BGDĐT)")
    format_run(r_aps, size_pt=10.5, italic=True)

    ai_sessions = [
        {
            "session_num": "PHIÊN LÀM VIỆC 1 (Ngày 03/07/2026)",
            "title": "Nghiên cứu giải thuật Cân bằng Phương trình Hóa học Tất định",
            "members": "Nguyễn Thế Duy (Thực hiện chính), Cô Nguyễn Thị Thanh Hà (Giám sát)",
            "tool": "DeepSeek-Coder & Gemini 1.5 Pro",
            "prompt": "Viết cho tôi một hàm JavaScript cân bằng phương trình hóa học bằng cách giải hệ phương trình tuyến tính đại số ma trận.",
            "ai_output": "AI sinh code sử dụng thư viện mathjs và kiểu số thực Number (Float 64-bit) thông thường để khử Gauss ma trận, sau đó làm tròn bằng Math.round().",
            "errors": [
                "Lỗi 1 (Sai số dấu phẩy động - Floating Point Bug): Khi kiểm thử phản ứng oxi hóa khử KMnO4 + FeSO4 + H2SO4 -> Fe2(SO4)3 + K2SO4 + MnSO4 + H2O, máy tính ra nghiệm phân số 2.9999999999999995 và hàm làm tròn sai khiến hệ số cân bằng bị lệch, phương trình không bảo toàn nguyên tố.",
                "Lỗi 2 (Crash phân tích cú pháp - Regex Syntax Error): Khi gặp chất có ngoặc hoặc ngậm nước như CuSO4·5H2O hoặc Al2(SO4)3, biểu thức Regex đơn giản của AI văng lỗi: TypeError: Cannot read properties of undefined (reading 'elements')."
            ],
            "debug_action": "Học sinh bắt lỗi AI và yêu cầu giải thuật ma trận bậc thang rút gọn (RREF) giải hoàn toàn trên phân số hữu tỉ gồm 2 số nguyên lớn BigInt (tử số / mẫu số), kèm hàm tìm Bội chung nhỏ nhất (LCM). Tự tay viết bộ phân tích chuỗi hóa học bằng cấu trúc Ngăn xếp (Stack Parser) để xử lý ngoặc lồng nhau.",
            "verification": "Tự viết tệp `src/lib/chemBalance.js` thuần không phụ thuộc mathjs (giảm 3.2MB dung lượng bundle). Viết 14 ca kiểm thử tự động trong `tests/chemBalance.test.js` kiểm tra các phản ứng khó. Kết quả: 14/14 tests passed 100% trong 31ms.",
            "teacher_note": "Cô Hà xác nhận: Học sinh đã phát hiện đúng lỗi sai số của AI, tự tay lập trình lại bằng thuật toán BigInt xuất sắc."
        },
        {
            "session_num": "PHIÊN LÀM VIỆC 2 (Ngày 24/07/2026)",
            "title": "Thiết kế AI Router và Cơ chế Tool Grounding Chống Ảo giác Số liệu",
            "members": "Nguyễn Thế Duy, Nguyễn Bùi Nguyệt Minh (Thực hiện), Cô Nguyễn Thị Thanh Hà (Giám sát)",
            "tool": "Google Gemini 2.0 Flash API",
            "prompt": "Tính pH của dung dịch CH3COOH 0.1M có độ điện ly alpha = 1.32% và giải thích các bước tính.",
            "ai_output": "AI tính ra nồng độ H+ = 0.00132M, nhưng khi bấm pH = -log(0.00132), AI bịa số làm tròn ẩu ra pH = 3.0 (thực tế -log(0.00132) = 2.879). Tương tự, ở bài tập Al + HCl, AI tự tính thể tích H2 bị sai số làm tròn.",
            "errors": [
                "Lỗi ảo giác số liệu (Hallucination): Mô hình ngôn ngữ lớn (LLM) bản chất là dự đoán xác suất từ ngữ tiếp theo, không có bộ vi xử lý số học chính xác. Khi giải bài tập định lượng Hóa học/Vật lý, AI thường xuyên tự làm tròn số hoặc bịa ra con số xấp xỉ không đúng chuẩn SGK."
            ],
            "debug_action": "Nhóm thống nhất nguyên lý kiến trúc: 'Code tất định tính trước, AI biện luận sư phạm sau'. Thiết lập khối ngữ cảnh [DỮ LIỆU ĐÃ TÍNH TOÁN BẰNG TOOL CHÍNH XÁC: {...}] trong System Prompt, cấm AI tự ý tính toán lại. Đồng thời viết hàm kiểm tra hậu kỳ (Post-verifier) trên máy khách: nếu câu trả lời của AI có con số sai lệch > 0.5% so với `scientificTools.js`, giao diện tự động bật cờ vàng cảnh báo.",
            "verification": "Thử nghiệm trên 86 kịch bản giải bài tập KHTN thực tế tại trường THPT Đông Thụy Anh, tỷ lệ ảo giác số liệu giảm từ 18.6% xuống còn 0%.",
            "teacher_note": "Cô Hà xác nhận: Cơ chế Tool Grounding kết hợp Post-check Client đã giải quyết triệt để vấn đề liêm chính học thuật."
        },
        {
            "session_num": "PHIÊN LÀM VIỆC 3 (Ngày 04/08/2026)",
            "title": "Xây dựng Module AutoExam Studio Bóc tách Đề thi 3 Dạng thức GDPT 2018",
            "members": "Nguyễn Thế Duy (Lập trình), Nguyễn Bùi Nguyệt Minh (Biên soạn dữ liệu)",
            "tool": "Groq Llama-3-70B & Google Gemini 1.5 Flash",
            "prompt": "Đọc toàn bộ file đề thi thử KHTN tốt nghiệp THPT 2025 dài 8 trang và xuất ra mảng JSON gồm câu hỏi, đáp án đúng và mức độ nhận thức.",
            "ai_output": "AI bắt đầu đọc văn bản và tạo JSON, nhưng dừng lại đột ngột ở câu 28 do hết giới hạn output tokens.",
            "errors": [
                "Lỗi 1 (Tràn output token gãy JSON): Chuỗi JSON bị đứt gãy giữa chừng gây lỗi cú pháp nghiêm trọng: SyntaxError: Unexpected end of JSON input at JSON.parse().",
                "Lỗi 2 (Gom nhầm dạng thức): Đề thi mới 2025 có Phần II (Đúng/Sai 4 ý a,b,c,d), nhưng AI lại gom nhầm thành 1 câu trắc nghiệm 4 lựa chọn ABCD truyền thống, làm sai lệch toàn bộ biểu điểm."
            ],
            "debug_action": "Học sinh chuyển đổi mô hình xử lý sang kiến trúc 2 lớp (Two-Pass Architecture): Lớp 1 dùng JavaScript Regex thuần bóc tách thô tệp Word thành từng khối câu hỏi riêng biệt (< 0.1s); Lớp 2 gửi từng câu hỏi vào AI kèm JSON Schema chuẩn có enum part: 1|2|3 để phân loại mức độ nhận thức (NB/TH/VD/VDC).",
            "verification": "Lập trình hai tệp `src/lib/examParser.js` và `src/lib/matrixAiService.js`. Thử nghiệm bóc tách thành công 35 đề thi thử thực tế của các Sở GD&ĐT với độ chính xác phân loại đạt 91.4%.",
            "teacher_note": "Cô Hà xác nhận: Sáng kiến chia nhỏ 2 lớp giúp hệ thống chạy nhanh, không bị gãy dữ liệu và bám sát ma trận đề thi mới."
        },
        {
            "session_num": "PHIÊN LÀM VIỆC 4 (Ngày 26/08/2026)",
            "title": "Nghiên cứu Thị giác Máy tính Chấm Phiếu Trắc nghiệm A4 (OMR Canvas)",
            "members": "Nguyễn Thế Duy (Thực hiện), Thầy Nguyễn Công Minh (Tư vấn thuật toán)",
            "tool": "DeepSeek-Coder & Claude 3.5 Sonnet",
            "prompt": "Viết code JavaScript sử dụng OpenCV.js để tìm 4 góc của tờ giấy thi trắc nghiệm và nắn thẳng ảnh (warp perspective) để đọc ô tô trắc nghiệm.",
            "ai_output": "AI cung cấp code dùng opencv.js WebAssembly.",
            "errors": [
                "Lỗi 1 (Dung lượng 8.4MB): Thư viện opencv.js quá nặng, mạng 4G điện thoại tải mất 15s gây đơ trình duyệt.",
                "Lỗi 2 (Nắn ảnh bị lộn ngược 180 độ): Khi yêu cầu AI tự viết hàm Homography thuần không dùng opencv, code AI sắp xếp sai thứ tự 4 góc và thuật toán khử Gauss không chọn phần tử trục làm ảnh nắn ra bị đen xì hoặc lộn ngược đầu đuôi.",
                "Lỗi 3 (Nhầm lẫn mực in hồng): Khung viền phiếu in màu hồng cánh sen bị bộ lọc Grayscale của AI biến thành màu xám và nhận diện nhầm là vết chì tô!"
            ],
            "debug_action": "Thầy Nguyễn Công Minh tư vấn đại số tuyến tính: Duy tự lập trình thuật toán giải hệ 8 phương trình DLT tìm ma trận Homography chuẩn xác. Về màu sắc: Duy phát hiện mực in màu hồng có thành phần Kênh Đỏ rất cao (R ≈ 240 - 255) tương đương nền giấy trắng, trong khi than chì bút chì 2B có R <= 80. Duy tự viết thuật toán trích xuất Kênh Đỏ (Red Channel) thuần Canvas JS.",
            "verification": "Viết tệp `src/lib/omr.js` dung lượng chỉ 38KB (nhẹ hơn opencv 220 lần). Thử nghiệm thực tế trên 50 phiếu thi học sinh đạt độ chính xác 98.2%, thời gian xử lý chỉ 1.2s/phiếu.",
            "teacher_note": "Thầy Minh xác nhận: Học sinh đã làm chủ hoàn toàn toán học hình học xạ ảnh Homography và xử lý điểm ảnh Canvas thuần."
        },
        {
            "session_num": "PHIÊN LÀM VIỆC 5 (Ngày 22/09/2026)",
            "title": "Xây dựng Trợ lý AI Tư vấn Nguyện vọng Đại học Khối KHTN",
            "members": "Nguyễn Thế Duy, Nguyễn Bùi Nguyệt Minh (Thực hiện)",
            "tool": "Gemini 1.5 Flash API",
            "prompt": "Dựa vào điểm thi thử khối A00 (24.5 điểm), hãy tư vấn cho tôi 5 nguyện vọng xét tuyển đại học tốt nhất tại Hà Nội.",
            "ai_output": "AI tư vấn toàn các ngành hot điểm chuẩn năm trước từ 27.5 - 28.5 điểm (như CNTT Bách Khoa, Khoa học Máy tính), không có phương án dự phòng an toàn.",
            "errors": [
                "Lỗi thiên lệch lạc quan (Optimism Bias): AI không có chiến lược quản trị rủi ro tuyển sinh thực tế, nếu học sinh làm theo lời khuyên của AI thì nguy cơ trượt toàn bộ nguyện vọng là rất cao."
            ],
            "debug_action": "Nguyệt Minh thu thập dữ liệu điểm chuẩn 3 năm gần nhất của 100+ trường ĐH. Duy lập trình thuật toán Tối ưu hóa Danh mục Nguyện vọng 3 tầng (`aspirationPortfolioOptimizer.js`): phân bổ bắt buộc tỷ lệ 25% nhóm Mơ ước (vượt điểm thi 0.5 - 1.5đ), 50% nhóm Vừa sức (+- 0.5đ) và 25% nhóm An toàn (thấp hơn điểm thi 1.5 - 2.5đ).",
            "verification": "Hệ thống tự động chấm điểm 'Sức khỏe danh mục nguyện vọng' (Portfolio Health Score) trên thang điểm 100, đưa ra khuyến nghị điều chỉnh danh mục khoa học.",
            "teacher_note": "Cô Hà xác nhận: Thuật toán phân bổ 3 tầng của nhóm có giá trị thực tiễn rất cao trong công tác hướng nghiệp học sinh."
        },
        {
            "session_num": "PHIÊN LÀM VIỆC 6 (Ngày 07/11/2026)",
            "title": "Kiểm thử Chịu tải Cao & Xây dựng Cơ chế Multi-Key Ring Rotation",
            "members": "Nguyễn Thế Duy (Thực hiện chính)",
            "tool": "Groq API, Gemini API, DeepSeek API",
            "prompt": "Chạy kịch bản kiểm thử tải đồng thời (stress test) 150 học sinh cùng gửi câu hỏi KHTN.",
            "ai_output": "Sau 40 request liên tục, hệ thống bị nghẽn và API trả về mã lỗi HTTP 429 Too Many Requests (Quota Exceeded).",
            "errors": [
                "Lỗi cạn kiệt hạn mức tải (API Rate Limiting): Gây gián đoạn dịch vụ trợ lý học tập trong các giờ cao điểm ôn tập trên lớp."
            ],
            "debug_action": "Duy lập trình vòng xoay khóa thông minh (Key Ring Rotation) trong `src/lib/aiRouter.js`: luân chuyển tự động giữa danh sách nhiều API keys; khi một key chạm ngưỡng 429, hệ thống tự động đưa key đó vào hàng đợi làm nguội (cooldown 300s) và chuyển vùng dự phòng (failover) sang provider khác mà người dùng không hề nhận biết độ trễ.",
            "verification": "Viết test case `tests/aiRouter.test.js` kiểm tra cơ chế cooldown và key rotation. Nghiệm thu chịu tải 150 kết nối đồng thời với tỷ lệ khả dụng 99.9%.",
            "teacher_note": "Cô Hà xác nhận: Hệ thống đã vận hành ổn định, sẵn sàng phục vụ triển khai diện rộng toàn trường."
        }
    ]

    for item in ai_sessions:
        box_table = doc.add_table(rows=1, cols=1)
        box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = box_table.rows[0].cells[0]
        c.width = Cm(17.5)
        set_cell_background(c, "F8FAFC")
        set_cell_margins(c, top=70, bottom=70, left=90, right=90)

        tcPr = c._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="3B82F6"/>'
            f'  <w:left w:val="single" w:sz="18" w:space="0" w:color="1D4ED8"/>'
            f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="3B82F6"/>'
            f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="3B82F6"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)

        p = c.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(2)

        r = p.add_run(f"{item['session_num']}: {item['title']}\n")
        format_run(r, size_pt=10.5, bold=True, color_rgb=(30, 58, 138))

        r = p.add_run("• Thành viên tham gia: "); format_run(r, size_pt=10, bold=True)
        r = p.add_run(f"{item['members']}\n"); format_run(r, size_pt=10)

        r = p.add_run("• Công cụ AI sử dụng: "); format_run(r, size_pt=10, bold=True)
        r = p.add_run(f"{item['tool']}\n\n"); format_run(r, size_pt=10, italic=True)

        r = p.add_run("1. Yêu cầu / Câu lệnh ban đầu (Prompt):\n"); format_run(r, size_pt=10, bold=True, color_rgb=(71, 85, 105))
        r = p.add_run(f"   \"{item['prompt']}\"\n"); format_run(r, size_pt=9.5, italic=True, color_rgb=(51, 65, 85))

        r = p.add_run("2. Kết quả / Mã nguồn do AI sinh ra ban đầu:\n"); format_run(r, size_pt=10, bold=True, color_rgb=(71, 85, 105))
        r = p.add_run(f"   {item['ai_output']}\n\n"); format_run(r, size_pt=9.5, color_rgb=(30, 41, 59))

        r = p.add_run("3. Lỗi kỹ thuật / Ảo giác số liệu thực tế phát sinh (Error & Bug Trace):\n"); format_run(r, size_pt=10, bold=True, color_rgb=(185, 28, 28))
        for err in item['errors']:
            r = p.add_run(f"   [!] {err}\n")
            format_run(r, size_pt=9.5, color_rgb=(185, 28, 28))
        p.add_run("\n")

        r = p.add_run("4. Hành động xử lý & Tự lập trình lại của nhóm học sinh (Human Debugging & Fix):\n"); format_run(r, size_pt=10, bold=True, color_rgb=(37, 99, 235))
        r = p.add_run(f"   {item['debug_action']}\n\n"); format_run(r, size_pt=9.5, color_rgb=(30, 58, 138))

        r = p.add_run("5. Kết quả nghiệm thu & Kiểm thử độc lập (Vitest / Experimental Verification):\n"); format_run(r, size_pt=10, bold=True, color_rgb=(4, 120, 87))
        r = p.add_run(f"   {item['verification']}\n\n"); format_run(r, size_pt=9.5, color_rgb=(4, 120, 87))

        r = p.add_run("6. Ý kiến xác nhận của Người hướng dẫn nghiên cứu:\n"); format_run(r, size_pt=10, bold=True)
        r = p.add_run(f"   {item['teacher_note']}"); format_run(r, size_pt=9.5, italic=True, color_rgb=(15, 23, 42))

        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    output_path = os.path.join(os.getcwd(), "NHAT_KY_NGHIEN_CUU_KHKT_ELEC_AI_THONG_TU_84.docx")
    doc.save(output_path)
    print("SUCCESS: NHAT_KY_NGHIEN_CUU_KHKT_ELEC_AI_THONG_TU_84.docx updated with realistic AI research logs and bug traces.")

if __name__ == "__main__":
    create_document()
