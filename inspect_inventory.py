import json

with open('dedicated_lessons_inventory.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for sub, chapters in data.items():
    print(f"=== {sub.upper()} ===")
    for ch in chapters:
        print(f"Chapter {ch['chapterId']}: {ch['chapterName']}")
        for l in ch.get('lessons', []):
            fc = len(l.get('formulas', []))
            sq = len(l.get('sampleQuestions', []))
            eq = len(l.get('exam2026Questions', []))
            cc = len(l.get('concepts', []))
            ac = len(l.get('algorithms', []))
            tc = len(l.get('traps', []))
            flashc = len(l.get('flashcards', []))
            print(f"  - {l['id']}: {l['title']} | Concepts: {cc}, Formulas: {fc}, Qs: {sq + eq}, Algo: {ac}, Traps: {tc}, Flash: {flashc}")
