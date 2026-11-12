import io
p="src/prompts/hocToan.js"
s=io.open(p,encoding="utf-8",errors="replace").read()
print("LEN",len(s))
print(s[:3000])
