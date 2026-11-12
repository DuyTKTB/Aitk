import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
i = src.find("# Rules")
print("=== around # Rules ===")
print(src[i-3000:i+6000])
