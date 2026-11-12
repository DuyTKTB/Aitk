import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
paths = set(re.findall(r"[`\"'](/[a-zA-Z0-9_\-/${}.]{2,60})[`\"']", src))
api = sorted(p for p in paths if p.startswith("/api") or p.startswith("/bai") or p.startswith("/hinh") or p.startswith("/anh") or "hinh" in p or "anh" in p)
print("=== paths ===")
for p in api[:120]: print(p)
print()
print("=== routes (reroutes) ===")
for m in list(re.finditer(r"path:`([^`]{1,40})`", src))[:40]: print(m.group(1))
