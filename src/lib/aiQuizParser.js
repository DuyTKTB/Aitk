/* ============================================================
   aiQuizParser.js — Tự động bóc tách & phát hiện bộ câu hỏi trắc nghiệm
   ------------------------------------------------------------
   Hỗ trợ 2 chế độ:
     1. Khối chuẩn: ```quiz ... ``` hoặc ```json { "questions": [...] } ```
     2. Tự động nhận diện cấu trúc đề trắc nghiệm trong markdown:
        "Câu 1:" / "1." + A/B/C/D + "Đáp án:" + "Lời giải / Gợi ý"
   ============================================================ */

/**
 * Phân tích và trích xuất Quiz từ văn bản AI phản hồi
 * @param {string} text - Toàn bộ văn bản phản hồi từ AI
 * @returns {{ quiz: Object, introText: string, rawQuizBlock: string } | null}
 */
export function parseQuizFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Nhận diện khối ```quiz ... ``` hoặc ```json:quiz ... ```
  const quizBlockMatch = text.match(/```(?:quiz|json:quiz)\s*([\s\S]*?)```/i);
  if (quizBlockMatch) {
    try {
      const parsed = JSON.parse(quizBlockMatch[1].trim());
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          quiz: {
            title: parsed.title || 'Trắc nghiệm luyện tập tương tác',
            subject: parsed.subject || 'Luyện tập',
            grade: parsed.grade || '',
            questions: sanitizeQuestions(parsed.questions),
          },
          introText: text.replace(quizBlockMatch[0], '').trim(),
          rawQuizBlock: quizBlockMatch[0],
        };
      }
    } catch (e) {
      console.warn('[aiQuizParser] Lỗi parse JSON trong ```quiz:', e);
    }
  }

  // 2. Nhận diện khối ```json chứa thuộc tính "questions"
  const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?"questions"[\s\S]*?\})\s*```/i);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          quiz: {
            title: parsed.title || 'Trắc nghiệm luyện tập tương tác',
            subject: parsed.subject || 'Luyện tập',
            grade: parsed.grade || '',
            questions: sanitizeQuestions(parsed.questions),
          },
          introText: text.replace(jsonBlockMatch[0], '').trim(),
          rawQuizBlock: jsonBlockMatch[0],
        };
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Fallback: Tự động trích xuất cấu trúc đề thi trắc nghiệm tiếng Việt trong Markdown
  const questionRegex = /(?:(?:^|\n)(?:Câu|Bài)\s*(\d+)[\s.:-]+|\n(\d+)\.\s+)([\s\S]*?)(?=(?:\n(?:Câu|Bài)\s*\d+[\s.:-]+|\n\d+\.\s+|$))/gi;
  const matches = [...text.matchAll(questionRegex)];

  if (matches.length >= 2) {
    const extractedQuestions = [];
    matches.forEach((m, idx) => {
      const fullBlock = m[3] || '';
      // Nhận diện 4 phương án: A. B. C. D.
      const optA = fullBlock.match(/(?:^|\n)\s*[A][\s.:)\/]+([^\n]+)/i);
      const optB = fullBlock.match(/(?:^|\n)\s*[B][\s.:)\/]+([^\n]+)/i);
      const optC = fullBlock.match(/(?:^|\n)\s*[C][\s.:)\/]+([^\n]+)/i);
      const optD = fullBlock.match(/(?:^|\n)\s*[D][\s.:)\/]+([^\n]+)/i);

      if (optA && optB) {
        const firstOptIndex = Math.min(
          optA.index ?? 9999,
          optB.index ?? 9999,
          optC?.index ?? 9999,
          optD?.index ?? 9999
        );
        const qStem = fullBlock.slice(0, firstOptIndex).trim();

        // Nhận diện đáp án đúng
        let correctIdx = 0;
        const ansMatch = fullBlock.match(/(?:đáp án|chọn|kết quả)[\s:]*([A-D])/i);
        if (ansMatch) {
          const letter = ansMatch[1].toUpperCase();
          correctIdx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3;
        }

        // Nhận diện lời giải
        const explMatch = fullBlock.match(/(?:giải thích|lời giải|hướng dẫn|chi tiết)[\s:]*([\s\S]*?)$/i);
        // Nhận diện gợi ý
        const hintMatch = fullBlock.match(/(?:gợi ý|mẹo)[\s:]*([^\n]+)/i);

        extractedQuestions.push({
          id: idx + 1,
          question: qStem || `Câu hỏi ${idx + 1}`,
          options: [
            optA[1].trim(),
            optB[1].trim(),
            optC ? optC[1].trim() : '',
            optD ? optD[1].trim() : '',
          ].filter(Boolean),
          correct: correctIdx,
          hint: hintMatch ? hintMatch[1].trim() : '',
          explanation: explMatch ? explMatch[1].trim() : '',
        });
      }
    });

    if (extractedQuestions.length >= 2) {
      const firstQIndex = text.search(/(?:Câu|Bài)\s*1[\s.:-]+/i);
      const intro = firstQIndex > 0 ? text.slice(0, firstQIndex).trim() : 'Bộ câu hỏi trắc nghiệm tương tác';
      const cleanTitle = intro.split('\n')[0].replace(/[#*]/g, '').trim();

      return {
        quiz: {
          title: cleanTitle || 'Trắc nghiệm luyện tập tương tác',
          subject: 'Luyện tập',
          grade: '',
          questions: extractedQuestions,
        },
        introText: intro,
        rawQuizBlock: '',
      };
    }
  }

  return null;
}

/** Chuẩn hóa danh sách câu hỏi đảm bảo dữ liệu hợp lệ */
function sanitizeQuestions(questions = []) {
  return questions.map((q, idx) => {
    let correct = 0;
    if (typeof q.correct === 'number') {
      correct = q.correct;
    } else if (typeof q.correct === 'string') {
      const c = q.correct.trim().toUpperCase();
      if (c === 'A') correct = 0;
      else if (c === 'B') correct = 1;
      else if (c === 'C') correct = 2;
      else if (c === 'D') correct = 3;
      else correct = parseInt(c, 10) || 0;
    }

    return {
      id: q.id || idx + 1,
      question: q.question || q.q || q.content || `Câu hỏi ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length ? q.options : ['A', 'B', 'C', 'D'],
      correct,
      hint: q.hint || q.gợi_ý || '',
      explanation: q.explanation || q.explain || q.lời_giải || '',
    };
  });
}
