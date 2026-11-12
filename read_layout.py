import io,re
s=io.open("src/components/AIChat.jsx",encoding="utf-8",errors="replace").read()
cls = sorted(set(re.findall(r'className="([a-zA-Z0-9_\- ]{3,60})"', s)))
print("class count:", len(cls))
print("\n".join(cls[:45]))
print()
# find the main layout return
i = s.find("return (")
print(s[i:i+1400])
