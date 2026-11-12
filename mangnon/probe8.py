import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
i = src.find("buoc:${")
print(src[i-200:i+3500])
