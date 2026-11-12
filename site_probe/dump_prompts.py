import re, os

base = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(base, 'assets', 'index-AZsqoF6X.js'), encoding='utf-8', errors='ignore').read()

cands = []
for m in re.finditer(r'`([^`]{500,30000})`', s):
    cands.append((m.start(), m.group(1)))

markers = ['mẹo nhỏ', 'MV language', '# Task', 'Diagrams in the plan',
           'Variation / sign tables', 'failed at sampled values', 'Continue this exercise',
           'drawing statements']
out = []
seen = set()
for pos, t in cands:
    if any(k in t for k in markers) and pos not in seen:
        seen.add(pos)
        out.append(f'\n\n===== pos={pos} len={len(t)} =====\n')
        out.append(t.replace('\\n', '\n'))
open(os.path.join(base, 'prompts_dump.txt'), 'w', encoding='utf-8').write(''.join(out))
print('picked', len(seen))
