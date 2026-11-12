import re, json, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
print("raw len", len(src))
print("unicode-escape count:", src.count("\\u"))
print("'hinh' count:", src.count("hinh"))
# find occurrences of 'hinh:' with context
for m in list(re.finditer(r"hinh:", src))[:6]:
    print("-----")
    print(src[max(0,m.start()-400):m.start()+400].replace("\n"," "))
