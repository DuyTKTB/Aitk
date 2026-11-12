import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
for pat in ["You are", "# Role", "# Rules", "Return ONE json", "cu_phap", "ve\"", "lenh", "nhip"]:
    ms = list(re.finditer(re.escape(pat), src))
    print(f"{pat!r}: {len(ms)}")
print("==========")
# print the repair prompt fully
i = src.find("You repair drawing statements")
print(src[i-1500:i+2500])
