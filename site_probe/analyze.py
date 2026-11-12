import re, os, sys, json, collections

p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'index-AZsqoF6X.js')
s = open(p, encoding='utf-8', errors='ignore').read()
print('bundle length', len(s))

kws = ['supabase','firebase','openai','gemini','anthropic','/api/','localStorage','sessionStorage',
       'indexedDB','serviceWorker','katex','mammoth','pdfjs','rive','worker','fetch(','axios',
       'Authorization','Bearer','token','stream','EventSource','WebSocket','camera','getUserMedia',
       'canvas','toDataURL','Blob','stripe','vnpay','momo','zalo','telegram','sentry','posthog',
       'gtag','analytics','clarity','stripe','paddle','lemonsqueezy']
for k in kws:
    c = s.lower().count(k.lower())
    if c:
        print(f'{k:16s} {c}')

print('\n--- /assets refs ---')
print(sorted(set(re.findall(r'"(/assets/[^"]+)"', s))))
print(sorted(set(re.findall(r"'(/assets/[^']+)'", s))))

print('\n--- api-ish strings ---')
for pat in [r'"[^"]{0,40}/api/[^"]{0,60}"', r"'[^']{0,40}/api/[^']{0,60}'"]:
    for m in sorted(set(re.findall(pat, s)))[:50]:
        print(m)

print('\n--- route paths ---')
routes = sorted(set(re.findall(r'path:"([^"]*)"', s)))
print(routes)

print('\n--- localStorage keys ---')
keys = sorted(set(re.findall(r'localStorage\.(?:getItem|setItem)\(([^)]{0,60})\)', s)))
for k in keys[:60]:
    print(k)
