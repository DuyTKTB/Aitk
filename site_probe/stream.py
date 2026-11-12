import re, os

base = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(base, 'assets', 'index-AZsqoF6X.js'), encoding='utf-8', errors='ignore').read()

i = s.find('getReader()')
print('--- stream reader block ---')
print(s[i - 200:i + 3500])

print('\n--- event-stream block ---')
j = s.find('event-stream')
print(s[j - 1200:j + 800])
