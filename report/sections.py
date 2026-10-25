# -*- coding: utf-8 -*-
"""In chiều cao ước lượng theo từng mục lớn để biết chỗ nào chiếm nhiều trang."""
import math
import sys
import docx
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn

PATH = sys.argv[1]
TEXT_H, TEXT_W = 24.7, 16.0
d = docx.Document(PATH)


def blocks():
    for child in d.element.body.iterchildren():
        if child.tag == qn('w:p'):
            yield Paragraph(child, d)
        elif child.tag == qn('w:tbl'):
            yield Table(child, d)


def ph(p):
    text = p.text or ''
    if not text.strip():
        return 0.35
    size = 13
    for r in p.runs:
        if r.font.size:
            size = r.font.size.pt
            break
    if p.style.name.startswith('Heading'):
        size = {'Heading 1': 16, 'Heading 2': 14, 'Heading 3': 13}.get(p.style.name, 13)
    cpl = TEXT_W / (size * 0.0205)
    lines = max(1, math.ceil(len(text) / max(1, cpl)))
    extra = 0.0
    if p.paragraph_format.space_before:
        extra += p.paragraph_format.space_before.pt * 0.0353
    if p.paragraph_format.space_after:
        extra += p.paragraph_format.space_after.pt * 0.0353
    return lines * size * 0.0353 * 1.3 + extra


def th(t):
    n = len(t.columns)
    widths = [c.width.cm if c.width else TEXT_W / n for c in t.rows[0].cells]
    if sum(widths) < 1:
        widths = [TEXT_W / n] * n
    scale = TEXT_W / sum(widths)
    widths = [w * scale for w in widths]
    total = 0.0
    for row in t.rows:
        h = 0.30
        for i, cell in enumerate(row.cells):
            txt = cell.text or ''
            if not txt.strip():
                continue
            fs = 12 if n <= 5 else (10.5 if n == 6 else 9.5)
            cpl = max(4, widths[i] / (fs * 0.0205))
            lines = sum(max(1, math.ceil(len(x) / cpl)) for x in txt.split('\n'))
            h = max(h, lines * fs * 0.0353 * 1.05 + 0.14)
        total += h
    return total + 0.3


cur = '(bìa)'
acc = 0.0
rows = []
for item in blocks():
    if isinstance(item, Paragraph):
        if item.style.name in ('Heading 1', 'Heading 2') and item.text.strip():
            rows.append((cur, acc))
            cur = item.text.strip()[:52]
            acc = 0.0
        acc += ph(item)
    else:
        if len(item.rows) == 1 and len(item.columns) == 1 and 'CHÈN HÌNH' in item.cell(0, 0).text:
            acc += 7.2
        else:
            acc += th(item)
rows.append((cur, acc))

total = sum(h for _, h in rows) / TEXT_H
print('TỔNG TRANG ƯỚC LƯỢNG:', round(total, 1))
print()
for name, h in rows:
    if h / TEXT_H >= 0.4:
        print('%5.1f trang | %s' % (h / TEXT_H, name))
