import re, os, collections

base = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(base, 'assets', 'index-AZsqoF6X.js'), encoding='utf-8', errors='ignore').read()

def show(label, pat, span=200, limit=12, flags=0):
    print('\n' + '=' * 10, label, '=' * 10)
    n = 0
    for m in re.finditer(pat, s, flags):
        print('>>>', s[max(0, m.start()-span):m.start()+span].replace('\n', ' '))
        n += 1
        if n >= limit:
            break
    if n == 0:
        print('(none)')

show('src paths', r'src/[a-zA-Z0-9_\-/]+\.ts')
print('\nUNIQUE src paths:')
print(sorted(set(re.findall(r'src/[a-zA-Z0-9_\-/]+\.(?:ts|tsx|js|json)', s))))

show('model / provider', r'max[tT]okens|max_tokens', 260, 6)
show('model names', r'gpt-[0-9a-z.\-]+|claude[a-z0-9.\-]*|gemini[-a-z0-9.]*|qwen[a-z0-9.\-]*|deepseek[a-z0-9.\-]*|sonnet|llama[a-z0-9.\-]*', 150, 15, re.I)
show('goi_ai', r'goi_ai', 400, 4)
show('prompt roles', r'role:`system`|role:"system"|"system"', 300, 6)
show('stream parts', r'delta|choices\[0\]|sse|text/event-stream', 200, 8, re.I)
