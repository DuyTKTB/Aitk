# -*- coding: utf-8 -*-
import io

p = 'c01.py'
s = io.open(p, encoding='utf-8').read()

pairs = [
    ("    ('p', '', space_after=10),\n", "    ('spacer',),\n"),
    ("    ('p', '', space_after=12),\n", "    ('spacer',),\n"),
    ("    ('p', 'Nhóm tác giả', bold=True, align='right'),\n", "    ('right', 'Nhóm tác giả', True),\n"),
    ("    ('p', 'Nguyễn Thế Duy – Nguyễn Bùi Nguyệt Minh', align='right'),\n", "    ('right', 'Nguyễn Thế Duy – Nguyễn Bùi Nguyệt Minh', False),\n"),
    ("    ('p', 'Hưng Yên, ngày ...... tháng ...... năm 2026', align='right'),\n", "    ('right', 'Hưng Yên, ngày ...... tháng ...... năm 2026', False),\n"),
    ("    ('p', 'Đại diện nhóm tác giả', bold=True, align='right'),\n", "    ('right', 'Đại diện nhóm tác giả', True),\n"),
    ("    ('p', '(Kí và ghi rõ họ tên)', italic=True, align='right'),\n", "    ('right', '(Kí và ghi rõ họ tên)', False),\n"),
    ("    ('p', 'Nguyễn Thế Duy', align='right'),\n", "    ('right', 'Nguyễn Thế Duy', False),\n"),
]
for a, b in pairs:
    s = s.replace(a, b)

io.open(p, 'w', encoding='utf-8').write(s)
print('space_after kw left:', s.count('space_after='))
print("align right left:", s.count("align='right'"))
