import re, os

base = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(base, 'assets', 'index-AZsqoF6X.js')
s = open(p, encoding='utf-8', errors='ignore').read()

print('=== /api/ contexts ===')
for m in re.finditer(r'/api/', s):
    print('...', s[max(0,m.start()-140):m.start()+140].replace('\n',' '), '...\n')

print('=== mangnon / io.vn mentions ===')
for m in re.finditer(r'mangnon|io\.vn', s):
    print('...', s[max(0,m.start()-120):m.start()+160].replace('\n',' '), '...\n')

print('=== serviceWorker contexts ===')
for m in re.finditer(r'serviceWorker', s):
    print('...', s[max(0,m.start()-150):m.start()+200].replace('\n',' '), '...\n')

print('=== gtag contexts ===')
for m in re.finditer(r'gtag', s):
    print('...', s[max(0,m.start()-200):m.start()+200].replace('\n',' '), '...\n')

print('=== zalo contexts ===')
for m in re.finditer(r'zalo', s, re.I):
    print('...', s[max(0,m.start()-150):m.start()+150].replace('\n',' '), '...\n')
