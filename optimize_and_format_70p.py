import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import qn, nsdecls

def optimize_report():
    input_path = 'báo cáo/Bao_cao_khoa_hoc_da_can_chinh_FIXED_PRE_70P_BACKUP.docx'
    output_path = 'báo cáo/Bao_cao_khoa_hoc_da_can_chinh_FIXED.docx'
    output_root_path = 'BAO_CAO_KHOA_HOC_70_TRANG_HOAN_CHINH.docx'

    print(f'Loading document from {input_path}...')
    doc = docx.Document(input_path)

    # 1. Image scaling: scale images in Section 2 (after Page 1) to max 2.05 inches height
    max_cy_emu = int(2.05 * 914400)
    scaled_images = 0

    for i, child in enumerate(doc._element.body):
        if i <= 13: # Strictly skip Page 1 cover!
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
                scaled_images += 1
                for a_ext in child.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}ext'):
                    if a_ext.get('cx') == str(cx) or a_ext.get('cy') == str(cy):
                        a_ext.set('cx', str(new_cx))
                        a_ext.set('cy', str(new_cy))

    print(f'Scaled {scaled_images} images to max 2.05 inches height.')

    # 2. Manage page breaks: remove all artificial pageBreakBefore, keep only major part boundaries
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
        if idx <= 13: # Strictly skip Page 1 cover!
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

    print(f'Page breaks updated: {pbb_removed} artificial pageBreakBefore removed, {pbb_kept} major section breaks kept.')

    # 3. Text Tightening in Phần III (from P192 to P689)
    # We trim repetitive filler phrases, redundant transition sentences, and verbose intros
    # while 100% preserving technical formulas, test results (33 files / 401 tests), code lines, architecture, tables and figures.
    trimmed_chars = 0
    
    # Common redundant filler phrases in academic Vietnamese reports
    replacements = [
        ('Trong khuôn khổ đề tài nghiên cứu này, chúng em nhận thấy rằng ', ''),
        ('Như đã được trình bày một cách rất chi tiết ở các phần trên, ', ''),
        ('Có thể khẳng định một cách chắc chắn và hoàn toàn rõ ràng rằng ', ''),
        ('Được thiết kế và xây dựng trên nền tảng công nghệ vô cùng tiên tiến, ', 'Được xây dựng trên nền tảng '),
        ('giúp cho người học có thể dễ dàng và thuận tiện trong việc ', 'giúp người học '),
        ('đóng vai trò vô cùng quan trọng và không thể thiếu đối với ', 'đóng vai trò then chốt đối với '),
        ('mang lại hiệu quả vô cùng to lớn và thiết thực cho ', 'mang lại hiệu quả thiết thực cho '),
        ('một cách hoàn toàn tự động và chính xác tuyệt đối', 'tự động và chính xác'),
        ('đã và đang là một trong những rào cản và thách thức lớn nhất', 'là thách thức lớn'),
        ('nhằm mục đích phục vụ cho nhu cầu thực tiễn của ', 'nhằm phục vụ '),
        ('tạo điều kiện vô cùng thuận lợi để các em học sinh có thể ', 'hỗ trợ học sinh '),
        ('trên thực tế triển khai thực nghiệm sư phạm tại trường THPT Đông Thụy Anh', 'khi triển khai thực tế tại trường'),
        ('với mục tiêu tối thượng là đảm bảo tính khách quan, công bằng và chính xác', 'nhằm đảm bảo tính khách quan và chính xác'),
    ]

    for idx in range(192, min(690, len(doc.paragraphs))):
        p = doc.paragraphs[idx]
        txt = p.text
        if not txt.strip():
            continue
        
        orig_len = len(txt)
        new_txt = txt
        for old, new in replacements:
            new_txt = new_txt.replace(old, new)
            
        # Condense consecutive whitespace
        new_txt = re.sub(r' +', ' ', new_txt)
        
        if len(new_txt) < orig_len:
            trimmed_chars += (orig_len - len(new_txt))
            # Update paragraph text while preserving styling
            if len(p.runs) > 0:
                p.runs[0].text = new_txt
                for r in p.runs[1:]:
                    r.text = ''

    print(f'Text tightened in Phần III: trimmed {trimmed_chars} redundant characters.')

    # 4. Format all text runs in Section 2 (index > 13):
    # - Pure black font color #000000
    # - Times New Roman (Consolas for code)
    # - Proper line spacing (1.15) and space after (3pt body, 6pt headings)
    for idx, p in enumerate(doc.paragraphs):
        if idx <= 13: # Strictly skip Page 1 cover!
            continue
        
        txt = p.text.strip()
        is_heading_1 = any(txt.startswith(x) for x in ['PHẦN', 'MỤC LỤC', 'LỜI CẢM ƠN', 'PHỤ LỤC'])
        is_heading_2 = len(txt) < 80 and re.match(r'^[1-9]\.\s+[^\.]+', txt) is not None
        is_heading_3 = len(txt) < 100 and re.match(r'^[1-9]\.[0-9]+\.\s+[^\.]+', txt) is not None
        is_heading_4 = len(txt) < 80 and (re.match(r'^[a-zđ]\)\s+', txt) is not None or re.match(r'^[1-9]\.[0-9]+\.[0-9]+\.\s+', txt) is not None)
        is_caption = txt.startswith(('Hình ', 'Bảng ')) and len(txt) < 120
        
        # Spacing and alignment
        if is_heading_1:
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if 'MỤC LỤC' in txt or 'LỜI CẢM ƠN' in txt else WD_ALIGN_PARAGRAPH.LEFT
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
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(3.0)
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
                    r.font.size = Pt(10)
                else:
                    r.font.size = Pt(13)

    # 5. Format all tables: pure black text, compact 10.5pt font, neat cell padding
    for t_idx, t in enumerate(doc.tables):
        # check if it's an image table
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
                        run.font.size = Pt(10.5)
                        if r_idx == 0:
                            run.font.bold = True

    # 6. Save modified document
    doc.save(output_path)
    doc.save(output_root_path)
    print(f'Saved perfected document to {output_path} and {output_root_path}')

if __name__ == '__main__':
    optimize_report()
