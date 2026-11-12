import io,re
s=io.open("src/components/AIChat.jsx",encoding="utf-8",errors="replace").read()
print("lines:", s.count("\n"))
for pat in ["function ","const [","image","ảnh","tesseract","fetch(","import "]:
    ms=[m.start() for m in re.finditer(re.escape(pat), s)]
    print(f"{pat}: {len(ms)}")
print("--- imports ---")
for l in s.split("\n")[:40]:
    if l.startswith("import"): print(l)
print("--- first 1200 chars ---")
print(s[:1200])
