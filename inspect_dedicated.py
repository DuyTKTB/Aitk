import json
import re

with open('src/data/dedicatedLessonsData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect chapters and lessons in dedicatedLessonsData.js
print("File length:", len(content))
