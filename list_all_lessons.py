import json

with open('dedicated_lessons_inventory.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

lessons = []
for sub, chs in data.items():
    for ch in chs:
        for l in ch.get('lessons', []):
            lessons.append({
                'sub': sub,
                'chapterId': ch['chapterId'],
                'chapterName': ch['chapterName'],
                'id': l['id'],
                'title': l['title'],
                'concepts': len(l.get('concepts', [])),
                'formulas': len(l.get('formulas', [])),
                'questions': len(l.get('sampleQuestions', [])) + len(l.get('exam2026Questions', [])),
            })

print(f"Total lessons: {len(lessons)}")
empty_q = [x for x in lessons if x['questions'] == 0]
print(f"Lessons with 0 questions: {len(empty_q)}")
one_q = [x for x in lessons if x['questions'] == 1]
print(f"Lessons with 1 question: {len(one_q)}")
more_q = [x for x in lessons if x['questions'] > 1]
print(f"Lessons with >1 question: {len(more_q)}")

few_f = [x for x in lessons if x['formulas'] < 2]
print(f"Lessons with <2 formulas: {len(few_f)}")
