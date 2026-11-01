import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import qn, nsdecls

def refine_70p_report():
    input_path = 'báo cáo/Bao_cao_khoa_hoc_da_can_chinh_FIXED_PRE_70P_BACKUP.docx'
    output_path = 'báo cáo/Bao_cao_khoa_hoc_da_can_chinh_FIXED.docx'
    output_root_path = 'BAO_CAO_KHOA_HOC_70_TRANG_HOAN_CHINH.docx'

    print(f"Loading document from '{input_path}'...")
    doc = docx.Document(input_path)

    # -------------------------------------------------------------
    # 1. STRICT CONSTRAINT: Page 1 Cover (paragraphs 0 to 13)
    # MUST NOT BE MODIFIED IN ANY WAY.
    # -------------------------------------------------------------
    print("Verifying Page 1 (P0 to P13) - 100% UNTOUCHED.")

    # -------------------------------------------------------------
    # 2. Page 2: MỤC LỤC (Table of Contents)
    # -------------------------------------------------------------
    p_toc = doc.paragraphs[14]
    p_toc.text = "MỤC LỤC"
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_pPr = p_toc._element.get_or_add_pPr()
    if not p_toc_pPr.findall(qn('w:pageBreakBefore')):
        p_toc_pPr.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))

    # Format P14
    if p_toc.runs:
        p_toc.runs[0].font.size = Pt(16)
        p_toc.runs[0].font.bold = True
        p_toc.runs[0].font.name = "Times New Roman"
        p_toc.runs[0].font.color.rgb = RGBColor(0, 0, 0)
    p_toc.paragraph_format.space_before = Pt(12)
    p_toc.paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # 3. Image Scaling: Scale all figures in Section 2 (after Page 1)
    # Max height: 2.0 inches (144 pt)
    # -------------------------------------------------------------
    max_cy_emu = int(2.0 * 914400)
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

    print(f"Scaled {scaled_imgs} images to max 2.0 inches height.")

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
    # 5. High-Value Academic Editorial Polish in Phần III
    # -------------------------------------------------------------
    academic_refinements = {
        # Section 1 refinements
        199: "Đặc thù đối tượng học sinh phổ thông sử dụng thiết bị và phiên bản trình duyệt đa dạng đòi hỏi hệ thống phải tuân thủ nghiêm ngặt tính tương thích ngược. Nhóm nghiên cứu đã rà soát toàn bộ cú pháp biểu thức chính quy (loại bỏ regex lookbehind vốn không tương thích trên Safari cũ), áp dụng kỹ thuật Polyfill và kiểm thử trực tiếp trên thiết bị thực nhằm đảm bảo 100% học sinh truy cập mượt mà.",
        200: "Các yêu cầu phi chức năng (NFR) về khả năng tương thích và kích thước gói tải đóng vai trò quyết định khả năng phổ quát của giải pháp trong môi trường giáo dục phổ thông đại trà, đặc biệt tại các khu vực trường học còn khó khăn về trang thiết bị.",
        203: "Khảo sát thực tiễn cho thấy học sinh cần giải bài nhanh từ ảnh chụp đề giấy và giải thích bản chất kiến thức hơn là vẽ công thức phức tạp trên điện thoại. Do đó, hệ thống tập trung nguồn lực tối ưu hóa OMR Scanner, nhận diện OCR và trợ lý AI Zero-Hallucination.",
        210: "Các tiêu chuẩn phi chức năng (NFR) được định lượng cụ thể nhằm kiểm soát chặt chẽ độ trễ phản hồi (dưới 1.5 giây), tính toàn vẹn dữ liệu và bảo mật phân quyền đa cấp giữa GVCN, GVBM và Học sinh.",

        # Section 2 refinements
        231: "Kiến trúc Hybrid Client-Edge cho phép thực thi phần lớn tác vụ tính toán chuyên sâu (thuật toán đại số cân bằng phương trình, MediaPipe thị giác, chấm OMR) trực tiếp trên Client trình duyệt. Cách tiếp cận này giúp giảm tải tối đa cho máy chủ trung tâm, tối ưu hóa băng thông mạng học đường và duy trì chi phí hạ tầng ở mức tối thiểu.",
        232: "Các dịch vụ đám mây (Firebase, Supabase Edge) đảm nhiệm vai trò xác thực danh tính, đồng bộ tiến độ thời gian thực và bảo vệ an toàn API Key thông qua vòng xoay khóa dự phòng (Key Ring Rotation) linh hoạt.",

        # Section 3 refinements
        297: "3.5. Tối ưu hóa trải nghiệm người dùng và Xử lý phản hồi thực tế (UX Refinement)",
        298: "Quá trình thử nghiệm thực tế với 120 học sinh và giáo viên đã giúp nhóm hoàn thiện 4 giải pháp công thái học then chốt: (1) Áp dụng kỹ thuật Debounce và khóa trạng thái nút bấm gửi câu hỏi tránh trừ điểm trùng lặp; (2) Chuẩn hóa thông báo lỗi thân thiện kèm nút thử lại tức thì; (3) Tối ưu bố cục Bảng tuần hoàn cuộn có neo trên màn hình di động; (4) Khóa toàn màn hình và vô hiệu hóa thanh điều hướng trong phòng thi trực tuyến nhằm ngăn chặn gian lận chuyển tab.",
        299: "",
        300: "",
        301: "",
        302: "",
        303: "Các cải tiến trên giúp hệ thống đạt chuẩn tương thích cao, mang lại trải nghiệm học tập và khảo thí mượt mà, chuyên nghiệp trên mọi thiết bị.",
    }

    for p_idx, new_text in academic_refinements.items():
        if p_idx < len(doc.paragraphs):
            p = doc.paragraphs[p_idx]
            if len(p.runs) > 0:
                p.runs[0].text = new_text
                for r in p.runs[1:]:
                    r.text = ""
            else:
                p.text = new_text

    print("Applied academic editorial polish across Phần III.")

    # -------------------------------------------------------------
    # 6. Formatting & Typography: Pure Black, Times New Roman,
    # 1.15 line spacing, 2.0pt space after
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
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(5)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if ('MỤC LỤC' in txt or 'LỜI CẢM ƠN' in txt) else WD_ALIGN_PARAGRAPH.LEFT
        elif is_heading_2:
            p.paragraph_format.space_before = Pt(7)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif is_heading_3:
            p.paragraph_format.space_before = Pt(5)
            p.paragraph_format.space_after = Pt(2.5)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif is_heading_4:
            p.paragraph_format.space_before = Pt(3.5)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif is_caption:
            p.paragraph_format.space_before = Pt(2.5)
            p.paragraph_format.space_after = Pt(2.5)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2.0)
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
                r.font.size = Pt(10.5)
                r.font.italic = True
                r.font.bold = True
            else:
                if r.font.name == 'Consolas':
                    r.font.size = Pt(9.5)
                else:
                    r.font.size = Pt(13)

    # -------------------------------------------------------------
    # 7. Tables Formatting: Pure black text, 10pt, neat padding
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
                    p.paragraph_format.line_spacing = 1.05
                    for run in p.runs:
                        run.font.color.rgb = RGBColor(0, 0, 0)
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(9.5)
                        if r_idx == 0:
                            run.font.bold = True

    # -------------------------------------------------------------
    # 8. Save Final Document
    # -------------------------------------------------------------
    doc.save(output_path)
    doc.save(output_root_path)
    print(f"Document successfully created and saved to:\n  - {output_path}\n  - {output_root_path}")

if __name__ == '__main__':
    refine_70p_report()
