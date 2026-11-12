import re, os

base = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(base, 'assets', 'index-AZsqoF6X.js'), encoding='utf-8', errors='ignore').read()

# long template strings = likely prompts
cands = []
for m in re.finditer(r'`([^`]{600,20000})`', s):
    t = m.group(1)
    if '\\n' in t or 'Bạn' in t or 'You are' in t or 'JSON' in t or 'json' in t:
        cands.append((m.start(), t))

print('long strings:', len(cands))
for i, (pos, t) in enumerate(cands):
    head = t[:260].replace('\n', ' ')
    print(f'\n--- #{i} pos={pos} len={len(t)} ---')
    print(head)
