import re, io, collections
src = io.open("index.js", encoding="utf-8", errors="replace").read()
print("=== _viec / viec values ===")
print(collections.Counter(re.findall(r"viec:\s*`([a-z_]+)`", src)))
print(collections.Counter(re.findall(r"viec=`([a-z_]+)`", src)))
print(collections.Counter(re.findall(r"`(giai|buoc|hoi|anh|meo|sua|soan|dich)`", src)))
print()
print("=== Nu( cache keys (prompt builders) ===")
for k in sorted(set(re.findall(r"Nu\(`([a-zA-Z_0-9:\${}\.\- ]{1,40})`", src)))[:60]: print(k)
