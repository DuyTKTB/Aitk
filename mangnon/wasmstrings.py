import re
b = open("ve.wasm","rb").read()
strs = re.findall(rb"[ -~]{6,}", b)
s = [x.decode("ascii","ignore") for x in strs]
import collections
print("total strings:", len(s))
kw = ["geogebra","GeoGebra","java","Java","cairo","ghostscript","asy","asymptote","rustc","emscripten","clang","panic","MV","ve_","draw","kernel","libc","WASM"]
for k in kw:
    hits = [x for x in s if k in x]
    print(f"--- {k}: {len(hits)}")
    for h in hits[:6]:
        print("   ", h[:160])
