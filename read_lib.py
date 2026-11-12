import io,re
for p in ["src/lib/aiPrompts.js","src/lib/ai.js"]:
    s=io.open(p,encoding="utf-8",errors="replace").read()
    print("="*20,p,len(s))
    print(s[:1800])
    print()
