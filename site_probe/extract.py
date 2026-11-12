import re, os, json

base = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(base, 'assets', 'index-AZsqoF6X.js')
s = open(p, encoding='utf-8', errors='ignore').read()

out = []
W = out.append

# 1. fetch calls & endpoint templates
W('=' * 20 + ' FETCH / ENDPOINTS ' + '=' * 20)
eps = set()
for m in re.finditer(r'fetch\(`([^`]+)`|fetch\("([^"]+)"|fetch\(\'([^\']+)\'', s):
    eps.add(m.group(1) or m.group(2) or m.group(3))
for e in sorted(eps):
    W(e)

W('')
W('=' * 20 + ' ENDPOINT-LIKE TEMPLATES ' + '=' * 20)
tmpl = set()
for m in re.finditer(r'vT\(`([^`]+)`', s):
    tmpl.add(m.group(1))
for t in sorted(tmpl):
    W(t)

# 2. Vietnamese UI strings
W('')
W('=' * 20 + ' VIETNAMESE STRINGS (uniq) ' + '=' * 20)
vi = set()
for m in re.finditer(r'`([^`\\]{6,300})`', s):
    t = m.group(1)
    if re.search(r'[àáảãạăâđêôơưýÀÁẢÃẠĐÊÔƠƯÝọụộửữ]', t):
        vi.add(t.strip())
vlist = sorted(vi)
W(f'count={len(vlist)}')
for t in vlist:
    W(t)

open(os.path.join(base, 'extract.txt'), 'w', encoding='utf-8').write('\n'.join(out))
print('written', len(out), 'lines')
