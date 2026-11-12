import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
def show(pat, n=3, before=300, after=900):
    ms=list(re.finditer(pat, src))
    print(f"### {pat}: {len(ms)}")
    for m in ms[:n]:
        print("-----")
        print(src[max(0,m.start()-before):m.start()+after].replace("\n"," "))
show(r"kiemTra", 3)
show(r"doLai", 3)
