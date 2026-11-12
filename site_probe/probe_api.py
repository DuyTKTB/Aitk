import urllib.request, urllib.error, os, json

base = 'https://mangnon.io.vn'
paths = ['/ban-dung.json', '/api/tts/config', '/api/bai', '/api/ai', '/api/auth/me',
         '/api/thong-ke', '/api/bai-cua-toi', '/api/account', '/api/ho-so', '/api/health']
for p in paths:
    req = urllib.request.Request(base + p, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        body = r.read(4000)
        print('===', p, r.status, r.headers.get('content-type'), 'len', len(body))
        print(body.decode('utf-8', 'replace')[:4000])
    except urllib.error.HTTPError as e:
        body = e.read(2000)
        print('===', p, 'HTTPError', e.code, e.headers.get('content-type'))
        print(body.decode('utf-8', 'replace')[:1500])
    except Exception as e:
        print('===', p, 'ERR', e)
    print()
