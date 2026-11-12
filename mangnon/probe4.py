import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
i = src.find("Midpoint(")
print("=== MV docs region ===")
print(src[i-5000:i+7000])
