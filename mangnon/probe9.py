import re, io
src = io.open("index.js", encoding="utf-8", errors="replace").read()
for k in ["THREE","three.module","WebGL","webgl","getContext(`2d`)","Path2D","toDataURL","OffscreenCanvas","requestAnimationFrame","zoom","KaTeX","katex","tauri","Tauri","serviceWorker","workbox","PWA"]:
    print(f"{k}: {src.count(k)}")
print()
# how figure is rendered: look for canvas/svg renderer entry
for m in list(re.finditer(r"getContext\(`2d`\)", src))[:3]:
    print("-----"); print(src[max(0,m.start()-500):m.start()+300].replace("\n"," "))
