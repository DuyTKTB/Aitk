import re, os

base = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(base, 'assets', 'index-AZsqoF6X.js'), encoding='utf-8', errors='ignore').read()

pats = ['Point(', 'Segment(', 'Pyramid(', 'Volume(', 'Revolve(']
hits = []
for m in re.finditer(r'`([^`]{300,40000})`', s):
    t = m.group(1)
    score = sum(1 for p in pats if p in t)
    if score >= 3:
        hits.append((m.start(), len(t), score, t))
print('candidates', len(hits))
for pos, ln, sc, t in sorted(hits, key=lambda x: -x[1])[:5]:
    print('pos', pos, 'len', ln, 'score', sc)
    print(t[:400].replace('\n', ' '))
    print('---')

if hits:
    big = max(hits, key=lambda x: x[1])
    open(os.path.join(base, 'mv_doc.txt'), 'w', encoding='utf-8').write(big[3].replace('\\n', '\n'))
    print('saved mv_doc.txt', big[1])
