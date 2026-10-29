import { describe, it, expect } from 'vitest';
import { parseQuizFromText } from '../src/lib/aiQuizParser.js';

describe('aiQuizParser', () => {
  it('trích xuất quiz chuẩn từ khối ```quiz JSON', () => {
    const aiResponse = `Tôi sẽ tạo một bộ câu hỏi trắc nghiệm chuyên đề Cấp số cộng dành cho chương trình Toán lớp 11 để giúp bạn củng cố và ôn tập kiến thức thật vững vàng.

\`\`\`quiz
{
  "title": "Trắc nghiệm Chuyên đề Cấp số cộng - Toán 11",
  "subject": "Toán học",
  "questions": [
    {
      "id": 1,
      "question": "Cho cấp số cộng (u_n) có u_1 = 3 và d = -2. Số hạng thứ 5 là:",
      "options": ["-5", "-3", "-7", "11"],
      "correct": 0,
      "hint": "Dùng công thức u_n = u_1 + (n - 1)d",
      "explanation": "u_5 = 3 + 4*(-2) = -5"
    }
  ]
}
\`\`\`

Chúc bạn ôn tập thật tốt!`;

    const res = parseQuizFromText(aiResponse);
    expect(res).not.toBeNull();
    expect(res.quiz.title).toBe('Trắc nghiệm Chuyên đề Cấp số cộng - Toán 11');
    expect(res.quiz.questions.length).toBe(1);
    expect(res.quiz.questions[0].options[0]).toBe('-5');
    expect(res.quiz.questions[0].correct).toBe(0);
    expect(res.introText).toContain('Tôi sẽ tạo một bộ câu hỏi');
  });

  it('tự động nhận diện cấu trúc đề trắc nghiệm trong markdown thông thường', () => {
    const rawMarkdown = `Dưới đây là 2 câu hỏi trắc nghiệm:

Câu 1: Cho cấp số cộng có u1 = 1, d = 3. Số hạng thứ 2 là?
A. 4
B. 5
C. 6
D. 7
Đáp án: A.
Lời giải: u2 = u1 + d = 4.

Câu 2: Công sai của cấp số cộng 2, 5, 8 là?
A. 2
B. 3
C. 4
D. 5
Đáp án: B.
Lời giải: d = 5 - 2 = 3.`;

    const res = parseQuizFromText(rawMarkdown);
    expect(res).not.toBeNull();
    expect(res.quiz.questions.length).toBe(2);
    expect(res.quiz.questions[0].correct).toBe(0);
    expect(res.quiz.questions[1].correct).toBe(1);
  });
});
