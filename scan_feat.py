import io, os, re
root = "src"
keys = ["vẽ hình","ve hinh","hình học","geometry","GeoGebra","svg","SVG","katex","KaTeX","MathJax"]
hits = {k: [] for k in keys}
for dp, dn, fn in os.walk(root):
    for f in fn:
        if not f.endswith((".jsx",".js",".css",".md")): continue
        p = os.path.join(dp,f)
        try:
            s = io.open(p, encoding="utf-8", errors="replace").read()
        except: continue
        for k in keys:
            if k in s: hits[k].append(p)
for k in keys:
    print(f"--- {k}: {len(hits[k])}")
    for p in hits[k][:8]: print("   ", p)
