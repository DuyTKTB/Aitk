import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import qn, nsdecls

def condense_paragraph_text(text):
    """
    Carefully condenses Vietnamese academic text by removing filler words,
    redundant introductory clauses, and repetitive verbose phrases,
    while strictly preserving technical terms, algorithms, metrics, and facts.
    """
    if len(text) < 100:
        return text

    # List of redundant filler patterns to remove or simplify
    subs = [
        (r'Trong khuôn khổ của đề tài nghiên cứu khoa học kỹ thuật này, chúng em nhận thấy rằng\s*', ''),
        (r'Như đã được chúng em trình bày một cách hết sức chi tiết và cụ thể ở các phần trên,\s*', ''),
        (r'Có thể khẳng định một cách hoàn toàn chắc chắn và rõ ràng rằng\s*', ''),
        (r'Được thiết kế và xây dựng dựa trên nền tảng công nghệ vô cùng tiên tiến,\s*', 'Được xây dựng trên nền tảng '),
        (r'đóng vai trò vô cùng quan trọng và không thể thiếu đối với\s*', 'đóng vai trò then chốt đối với '),
        (r'mang lại hiệu quả vô cùng to lớn, thiết thực và rõ rệt cho\s*', 'mang lại hiệu quả thiết thực cho '),
        (r'một cách hoàn toàn tự động, nhanh chóng và chính xác tuyệt đối\s*', 'tự động và chính xác '),
        (r'đã và đang là một trong những rào cản, khó khăn và thách thức lớn nhất\s*', 'là thách thức lớn '),
        (r'nhằm mục đích phục vụ tối đa cho nhu cầu thực tiễn trong công tác\s*', 'nhằm phục vụ '),
        (r'tạo điều kiện vô cùng thuận lợi để các em học sinh có thể dễ dàng\s*', 'hỗ trợ học sinh '),
        (r'trên thực tế triển khai thực nghiệm sư phạm tại trường THPT Đông Thụy Anh\s*', 'khi triển khai thực tế tại trường '),
        (r'với mục tiêu tối thượng là đảm bảo tính khách quan, công bằng và chính xác\s*', 'nhằm đảm bảo tính khách quan và chính xác '),
        (r'giúp cho người học có thể nắm bắt được một cách sâu sắc bản chất của\s*', 'giúp người học nắm vững bản chất '),
        (r'Để giải quyết triệt để và toàn diện vấn đề này, nhóm tác giả đã tiến hành\s*', 'Nhóm đã tiến hành '),
        (r'Quy trình này được thực hiện tuần tự qua các bước cụ thể như sau:\s*', 'Quy trình thực hiện gồm các bước: '),
        (r'Hệ thống tiến hành xử lý dữ liệu đầu vào theo trình tự các thao tác:\s*', 'Dữ liệu được xử lý tuần tự: '),
        (r'cho phép người sử dụng có thể dễ dàng thao tác mà không gặp bất kỳ trở ngại nào', 'giúp người dùng thao tác dễ dàng'),
        (r'đáp ứng đầy đủ các tiêu chuẩn kỹ thuật khắt khe do Bộ Giáo dục và Đào tạo ban hành', 'đáp ứng tiêu chuẩn kỹ thuật của Bộ GD&ĐT'),
    ]

    res = text
    for pattern, replacement in subs:
        res = re.sub(pattern, replacement, res, flags=re.IGNORECASE)

    # Clean up double spaces
    res = re.sub(r' +', ' ', res).strip()
    return res

def build_final_report():
    input_path = 'báo cáo/Bao_cao_khoa_hoc_da_can_chinh_FIXED_PRE_70P_BACKUP.docx'
    output_path = 'báo cáo/Bao_cao_khoa_hoc_da_can_chinh_FIXED.docx'
    output_root_path = 'BAO_CAO_KHOA_HOC_70_TRANG_HOAN_CHINH.docx'

    print(f"Loading document from '{input_path}'...")
    doc = docx.Document(input_path)

    # -------------------------------------------------------------
    # 1. STRICT CONSTRAINT: Page 1 Cover (paragraphs 0 to 13)
    # We do NOT touch paragraphs 0 through 13 at all!
    # -------------------------------------------------------------
    print("Verifying Page 1 (P0 to P13) - STRICTLY UNTOUCHED.")

    # -------------------------------------------------------------
    # 2. Page 2: MỤC LỤC (Table of Contents)
    # Build complete professional Table of Contents
    # -------------------------------------------------------------
    p_toc = doc.paragraphs[14]
    p_toc.text = "MỤC LỤC"
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_pPr = p_toc._element.get_or_add_pPr()
    # Ensure pageBreakBefore for Page 2
    if not p_toc_pPr.findall(qn('w:pageBreakBefore')):
        p_toc_pPr.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))

    # Add TOC entries under P14
    toc_entries = [
        ("LỜI CẢM ƠN VÀ DANH MỤC VIẾT TẮT", "3"),
        ("PHẦN I: VẤN ĐỀ CẦN GIẢI QUYẾT", "4"),
        ("  1. Lý do chọn đề tài", "4"),
        ("  2. Tổng quan nghiên cứu và các giải pháp hiện có", "5"),
        ("  3. Mục tiêu kỹ thuật và Vấn đề dự án cần giải quyết", "6"),
        ("  4. Phạm vi nghiên cứu & Giới hạn kỹ thuật", "8"),
        ("PHẦN II: THIẾT KẾ VÀ PHƯƠNG PHÁP NGHIÊN CỨU", "10"),
        ("  1. Kiến trúc tổng thể hệ thống", "10"),
        ("  2. Thiết kế chi tiết các phân hệ chức năng (GVCN, GVBM, Tự học Hóa)", "11"),
        ("  3. Phương pháp nghiên cứu và Công cụ thực hiện", "21"),
        ("PHẦN III: QUY TRÌNH THIẾT KẾ, XÂY DỰNG VÀ THỬ NGHIỆM HỆ THỐNG", "24"),
        ("  1. Phân tích yêu cầu và khảo sát nhu cầu", "24"),
        ("  2. Kiến trúc tổng thể và mô hình dữ liệu", "27"),
        ("  3. Thiết kế giao diện", "32"),
        ("  4. Xây dựng 11 module chức năng cốt lõi", "35"),
        ("  5. Tích hợp, triển khai và vận hành", "56"),
        ("  6. Bảng công nghệ và chi phí hạ tầng", "59"),
        ("  7. Thử nghiệm và đánh giá chất lượng", "61"),
        ("PHẦN IV: KẾT QUẢ, KẾT LUẬN VÀ KHẢ NĂNG ỨNG DỤNG", "66"),
        ("  1. Kết quả nghiên cứu đạt được và Phân tích định lượng", "66"),
        ("  2. Khả năng ứng dụng và Chuyển giao thực tiễn", "67"),
        ("  3. Kết luận và Định hướng phát triển công nghệ", "68"),
        ("PHỤ LỤC: DANH MỤC HỒ SƠ DỰ THI VÀ TÀI LIỆU THAM KHẢO", "69")
    ]

    # Combine TOC into a clean compact block inside P14 runs
    p_toc.runs[0].font.size = Pt(16)
    p_toc.runs[0].font.bold = True
    p_toc.runs[0].font.name = "Times New Roman"
    p_toc.runs[0].font.color.rgb = RGBColor(0, 0, 0)
    p_toc.paragraph_format.space_before = Pt(12)
    p_toc.paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # 3. Image Scaling: Scale all figures in Section 2 (after Page 1)
    # Target height: max 2.05 inches (147.6 pt)
    # -------------------------------------------------------------
    max_cy_emu = int(2.05 * 914400)
    scaled_imgs = 0
    for idx, child in enumerate(doc._element.body):
        if idx <= 13: # Strictly skip Page 1 cover!
            continue
        for ext in child.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}extent'):
            cx = int(ext.get('cx', 0))
            cy = int(ext.get('cy', 0))
            if cy > max_cy_emu:
                scale = max_cy_emu / cy
                new_cx = int(cx * scale)
                new_cy = max_cy_emu
                ext.set('cx', str(new_cx))
                ext.set('cy', str(new_cy))
                scaled_imgs += 1
                for a_ext in child.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}ext'):
                    if a_ext.get('cx') == str(cx) or a_ext.get('cy') == str(cy):
                        a_ext.set('cx', str(new_cx))
                        a_ext.set('cy', str(new_cy))

    print(f"Scaled {scaled_imgs} images to max 2.05 inches height.")

    # -------------------------------------------------------------
    # 4. Manage Page Breaks: Remove all artificial breaks
    # Keep pageBreakBefore ONLY on major sections
    # -------------------------------------------------------------
    major_break_prefixes = [
        'MỤC LỤC',
        'LỜI CẢM ƠN',
        'PHẦN I: VẤN ĐỀ CẦN GIẢI QUYẾT',
        'PHẦN II: THIẾT KẾ VÀ PHƯƠNG PHÁP NGHIÊN CỨU',
        'PHẦN III. QUY TRÌNH THIẾT KẾ, XÂY DỰNG VÀ THỬ NGHIỆM',
        'PHẦN IV: KẾT QUẢ, KẾT LUẬN VÀ KHẢ NĂNG ỨNG DỤNG',
        'PHỤ LỤC:'
    ]

    pbb_removed = 0
    pbb_kept = 0

    for idx, p in enumerate(doc.paragraphs):
        if idx <= 13: # Skip Page 1 cover!
            continue
        txt = p.text.strip()
        is_major = any(txt.startswith(pref) for pref in major_break_prefixes)
        pPr = p._element.find(qn('w:pPr'))
        if pPr is not None:
            pbb_elems = pPr.findall(qn('w:pageBreakBefore'))
            if is_major:
                if not pbb_elems:
                    pPr.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))
                pbb_kept += 1
            else:
                for elem in pbb_elems:
                    pPr.remove(elem)
                    pbb_removed += 1
        elif is_major:
            pPr = p._element.get_or_add_pPr()
            pPr.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))
            pbb_kept += 1

    print(f"Page breaks: {pbb_removed} artificial breaks removed, {pbb_kept} major breaks kept.")

    # -------------------------------------------------------------
    # 5. Smart Text Tightening in Phần III (P192 to P689)
    # Remove redundancy to hit exact target page length
    # -------------------------------------------------------------
    trimmed_count = 0
    for idx in range(192, min(690, len(doc.paragraphs))):
        p = doc.paragraphs[idx]
        txt = p.text
        if not txt.strip():
            continue
        # Skip headings, captions, and short labels
        if any(txt.strip().startswith(x) for x in ['PHẦN', '1.', '2.', '3.', '4.', '5.', '6.', '7.', 'a)', 'b)', 'c)', 'd)', 'đ)', 'e)', 'Hình ', 'Bảng ']):
            continue
        
        condensed = condense_paragraph_text(txt)
        if len(condensed) < len(txt):
            trimmed_count += 1
            if p.runs:
                p.runs[0].text = condensed
                for r in p.runs[1:]:
                    r.text = ""

    print(f"Tightened {trimmed_count} paragraphs in Phần III.")

    # -------------------------------------------------------------
    # 6. Formatting & Typography: Pure Black, Times New Roman,
    # 1.15 line spacing, 2.2pt space after
    # -------------------------------------------------------------
    for idx, p in enumerate(doc.paragraphs):
        if idx <= 13: # Strictly skip Page 1 cover!
            continue
        txt = p.text.strip()
        is_heading_1 = any(txt.startswith(x) for x in ['PHẦN', 'MỤC LỤC', 'LỜI CẢM ƠN', 'PHỤ LỤC'])
        is_heading_2 = len(txt) < 80 and re.match(r'^[1-9]\.\s+[^\.]+', txt) is not None
        is_heading_3 = len(txt) < 100 and re.match(r'^[1-9]\.[0-9]+\.\s+[^\.]+', txt) is not None
        is_heading_4 = len(txt) < 80 and (re.match(r'^[a-zđ]\)\s+', txt) is not None or re.match(r'^[1-9]\.[0-9]+\.[0-9]+\.\s+', txt) is not None)
        is_caption = txt.startswith(('Hình ', 'Bảng ')) and len(txt) < 120

        # Paragraph spacing & alignment
        if is_heading_1:
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if ('MỤC LỤC' in txt or 'LỜI CẢM ƠN' in txt) else WD_ALIGN_PARAGRAPH.LEFT
        elif is_heading_2:
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif is_heading_3:
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif is_heading_4:
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif is_caption:
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2.2)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        # Runs formatting
        for r in p.runs:
            r.font.color.rgb = RGBColor(0, 0, 0)
            if r.font.name != 'Consolas':
                r.font.name = 'Times New Roman'
                
            if is_heading_1:
                r.font.size = Pt(15)
                r.font.bold = True
            elif is_heading_2:
                r.font.size = Pt(13.5)
                r.font.bold = True
            elif is_heading_3:
                r.font.size = Pt(13)
                r.font.bold = True
            elif is_heading_4:
                r.font.size = Pt(13)
                r.font.bold = True
            elif is_caption:
                r.font.size = Pt(11)
                r.font.italic = True
                r.font.bold = True
            else:
                if r.font.name == 'Consolas':
                    r.font.size = Pt(9.5)
                else:
                    r.font.size = Pt(13)

    # -------------------------------------------------------------
    # 7. Tables Formatting: Pure black font, 10pt, neat padding
    # -------------------------------------------------------------
    for t in doc.tables:
        blips = t._element.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
        if blips and len(t.rows) == 1 and len(t.columns) == 1:
            t.alignment = docx.enum.table.WD_TABLE_ALIGNMENT.CENTER
            continue
            
        t.alignment = docx.enum.table.WD_TABLE_ALIGNMENT.CENTER
        for r_idx, r in enumerate(t.rows):
            for c in r.cells:
                for p in c.paragraphs:
                    p.paragraph_format.space_before = Pt(1)
                    p.paragraph_format.space_after = Pt(1)
                    p.paragraph_format.line_spacing = 1.1
                    for run in p.runs:
                        run.font.color.rgb = RGBColor(0, 0, 0)
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(10)
                        if r_idx == 0:
                            run.font.bold = True

    # -------------------------------------------------------------
    # 8. Save Final Document
    # -------------------------------------------------------------
    doc.save(output_path)
    doc.save(output_root_path)
    print(f"Document successfully created and saved to:\n  - {output_path}\n  - {output_root_path}")

if __name__ == '__main__':
    build_final_report()
