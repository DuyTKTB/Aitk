/* ============================================================
   aiQuizParser.js — Tự động bóc tách & chuẩn hóa đề thi tương tác AI
   ------------------------------------------------------------
   Hỗ trợ trọn bộ 3 phần cấu trúc đề thi THPT Quốc gia 2025–2026:
     • type: 'mcq'   (Phần I  — Trắc nghiệm 4 phương án A–D)
     • type: 'tf'    (Phần II — Đúng / Sai 4 ý a, b, c, d)
     • type: 'short' (Phần III — Trả lời ngắn nhập số, hỗ trợ ',' và '.')
   ============================================================ */

/**
 * Chuẩn hóa số từ chuỗi tiếng Việt ("4,48 lít" -> 4.48)
 */
export function parseNumericValue(raw) {
  if (raw === null || raw === undefined) return NaN;
  const cleaned = String(raw)
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.+-]/g, '');
  if (!cleaned || cleaned === '.' || cleaned === '-' || cleaned === '+') return NaN;
  return Number(cleaned);
}

/**
 * Chấm câu Trả lời ngắn (Phần III) — chấp nhận cả dấu phẩy/chấm & sai số làm tròn nhỏ
 */
export function gradeShortAnswer(userInput, expectedAnswer, tolerance = 0.02) {
  const rawUser = String(userInput ?? '').trim();
  const rawExpected = String(expectedAnswer ?? '').trim();
  if (!rawUser || !rawExpected) return false;

  const normUser = rawUser.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
  const normExpected = rawExpected.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
  if (normUser === normExpected) return true;

  const numUser = parseNumericValue(rawUser);
  const numExpected = parseNumericValue(rawExpected);
  if (Number.isFinite(numUser) && Number.isFinite(numExpected)) {
    const tol = Math.max(0.0001, Number(tolerance) || 0.02);
    return Math.abs(numUser - numExpected) <= tol;
  }
  return false;
}

/**
 * Chấm câu Đúng/Sai 4 ý (Phần II) theo thang điểm chuẩn Bộ GD&ĐT 2025:
 *   • 1 ý đúng = 0.10 đ · 2 ý = 0.25 đ · 3 ý = 0.50 đ · 4 ý = 1.00 đ
 */
export function gradeTfQuestion(pickedMap = {}, statements = []) {
  const total = statements.length;
  let rightCount = 0;
  statements.forEach((st, idx) => {
    if (pickedMap[idx] === Boolean(st.correct)) rightCount += 1;
  });

  const scoreTable = total === 4
    ? [0, 0.1, 0.25, 0.5, 1]
    : Array.from({ length: total + 1 }, (_, k) => (total > 0 ? Number((k / total).toFixed(2)) : 0));

  return {
    rightCount,
    total,
    score: scoreTable[Math.min(rightCount, scoreTable.length - 1)] ?? 0,
    isAllCorrect: total > 0 && rightCount === total,
  };
}

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

        let correctIdx = 0;
        const ansMatch = fullBlock.match(/(?:đáp án|chọn|kết quả)[\s:]*([A-D])/i);
        if (ansMatch) {
          const letter = ansMatch[1].toUpperCase();
          correctIdx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3;
        }

        const explMatch = fullBlock.match(/(?:giải thích|lời giải|hướng dẫn|chi tiết)[\s:]*([\s\S]*?)$/i);
        const hintMatch = fullBlock.match(/(?:gợi ý|mẹo)[\s:]*([^\n]+)/i);

        extractedQuestions.push({
          id: idx + 1,
          type: 'mcq',
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

/** Chuẩn hóa danh sách câu hỏi (hỗ trợ mcq, tf, short) */
export function sanitizeQuestions(questions = []) {
  return questions.map((q, idx) => {
    const rawType = String(q.type || '').trim().toLowerCase();
    const base = {
      id: q.id || idx + 1,
      question: q.question || q.q || q.content || `Câu hỏi ${idx + 1}`,
      hint: q.hint || q.gợi_ý || '',
      explanation: q.explanation || q.explain || q.lời_giải || '',
    };

    // Phần II: Đúng / Sai 4 ý
    const hasStatements = Array.isArray(q.statements) && q.statements.length >= 2;
    if (rawType === 'tf' || rawType === 'true_false' || rawType === 'dung_sai' || hasStatements) {
      const stmts = (q.statements || []).slice(0, 4).map((st, sIdx) => ({
        id: st.id || String.fromCharCode(97 + sIdx),
        text: typeof st === 'string' ? st : (st.text || st.content || st.statement || `Ý ${String.fromCharCode(97 + sIdx)}`),
        correct: Boolean(typeof st === 'object' ? (st.correct ?? st.isCorrect ?? st.answer) : false),
      }));
      return {
        ...base,
        type: 'tf',
        statements: stmts,
      };
    }

    // Phần III: Trả lời ngắn
    if (
      rawType === 'short' ||
      rawType === 'short_answer' ||
      rawType === 'tra_loi_ngan' ||
      (q.answer !== undefined && !Array.isArray(q.options))
    ) {
      return {
        ...base,
        type: 'short',
        answer: String(q.answer ?? q.correctAnswer ?? q.correct ?? '').trim(),
        unit: String(q.unit || '').trim(),
        tolerance: Number.isFinite(Number(q.tolerance)) ? Number(q.tolerance) : 0.02,
      };
    }

    // Phần I: Trắc nghiệm A–D (mặc định)
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
      ...base,
      type: 'mcq',
      options: Array.isArray(q.options) && q.options.length ? q.options : ['A', 'B', 'C', 'D'],
      correct,
    };
  });
}
