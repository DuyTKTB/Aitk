with open('src/data/roadmapExercises.js', 'r', encoding='utf-8') as f:
    text = f.read()

sustain = text.find("'c12-sustain'")
if sustain == -1:
    sustain = text.find('"c12-sustain"')
print("c12-sustain index:", sustain)

# Find closing brace of c12-sustain, and then closing brace of BANK
end_bank = text.find("\n};\n", sustain)
print("end_bank index:", end_bank)
print("Context around end_bank:\n", text[end_bank-100:end_bank+100])
