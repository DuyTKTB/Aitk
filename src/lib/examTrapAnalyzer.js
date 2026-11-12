/* ============================================================
   examTrapAnalyzer.js — ĐỘNG CƠ CHẨN ĐOÁN BẪY ĐỀ & NGUYÊN NHÂN SAI LẦM
   ------------------------------------------------------------
   Phân tích từng câu sai trong bài thi trắc nghiệm KHTN theo 3 nhóm:
     1. Bẫy từ phủ định / Câu hỏi gài bẫy (Negative Keyword Trap)
     2. Lỗi đổi đơn vị & tính toán ẩu (Unit / Calculation Glitch)
     3. Lỗ hổng kiến thức cốt lõi (Core Knowledge Gap)
   ============================================================ */

const NEGATIVE_KEYWORDS = [
  'không đúng',
  'không chính xác',
  'sai',
  'không xảy ra',
  'không phản ứng',
  'ngoại trừ',
  'không phải',
  'chưa đúng',
  'không tồn tại',
  'không cùng',
  'không có tính',
  'không làm',
  'ít nhất',
  'nhiều nhất',
];

const UNIT_CALC_KEYWORDS = [
  'đktc',
  'lít',
  'ml',
  'gam',
  'kg',
  'mol/l',
  'nồng độ mol',
  'hiệu suất',
  'tính toán',
  'khối lượng',
  'chu kỳ',
  'tần số',
  'bước sóng',
  'đổi đơn vị',
  'nhiệt độ k',
  'công suất',
];

/**
 * Phân tích và chẩn đoán nguyên nhân sai lầm cho từng câu hỏi
 */
export function diagnoseQuestionError(question, studentAnswerIndex, correctAnswerIndex) {
  if (studentAnswerIndex === correctAnswerIndex) return null; // Câu đúng

  const text = (question?.question || question?.text || '').toLowerCase();
  const options = question?.options || [];
  const studentAnsText = options[studentAnswerIndex] || '';
  const correctAnsText = options[correctAnswerIndex] || '';

  // 1. Kiểm tra Bẫy từ phủ định (Negative Trap)
  const matchedNegative = NEGATIVE_KEYWORDS.find((kw) => text.includes(kw));
  if (matchedNegative) {
    return {
      type: 'trap',
      typeLabel: 'Bẫy từ phủ định',
      typeTone: 'warn',
      tag: `Bẫy: "${matchedNegative}"`,
      reason: `Đề bài có chứa cụm từ gài bẫy "${matchedNegative}". Bạn có thể đã đọc lướt và chọn phương án đúng thay vì tìm phương án KHÔNG đúng.`,
      advice: 'Gạch chân từ phủ định ngay khi đọc đề để không bị phản xạ chọn câu đúng.',
    };
  }

  // 2. Kiểm tra Bẫy đơn vị & Tính toán (Unit / Calc Glitch)
  const matchedUnit = UNIT_CALC_KEYWORDS.find((kw) => text.includes(kw));
  if (matchedUnit) {
    return {
      type: 'calc',
      typeLabel: 'Lỗi đổi đơn vị / Tính ẩu',
      typeTone: 'info',
      tag: 'Lỗi tính toán',
      reason: `Câu hỏi liên quan đến dữ kiện "${matchedUnit}". Rất có thể bạn đã nhầm lẫn bước đổi đơn vị hoặc bỏ quên hiệu suất phản ứng.`,
      advice: 'Viết rõ công thức và đơn vị ra giấy nháp trước khi bấm máy tính.',
    };
  }

  // 3. Lỗ hổng kiến thức chuyên đề (Knowledge Gap)
  return {
    type: 'knowledge',
    typeLabel: 'Lỗ hổng kiến thức',
    typeTone: 'err',
    tag: 'Cần ôn lại',
    reason: 'Chưa nắm vững lý thuyết cốt lõi hoặc dạng bài phân loại của chuyên đề này.',
    advice: 'Lưu vào Sổ tay lỗi sai và làm lại 3 câu tương tự để bù đắp kiến thức.',
  };
}

/**
 * Tổng hợp báo cáo bẫy đề toàn bộ bài thi
 */
export function analyzeExamTraps({ questions = [], answers = {}, detail = [] }) {
  const trapItems = [];
  let trapCount = 0;
  let calcCount = 0;
  let knowledgeCount = 0;

  questions.forEach((q, idx) => {
    const studentAns = answers[idx] ?? answers[q.id];
    const correctAns = q.correct ?? q.correctIndex ?? 0;

    // Kiểm tra đúng/sai
    const isCorrect = Number(studentAns) === Number(correctAns);
    if (!isCorrect && studentAns !== undefined && studentAns !== null) {
      const diag = diagnoseQuestionError(q, Number(studentAns), Number(correctAns));
      if (diag) {
        if (diag.type === 'trap') trapCount += 1;
        else if (diag.type === 'calc') calcCount += 1;
        else knowledgeCount += 1;

        trapItems.push({
          questionIndex: idx + 1,
          questionText: q.question || q.text || '',
          studentAnswer: q.options?.[studentAns] || `Lựa chọn ${studentAns}`,
          correctAnswer: q.options?.[correctAns] || `Đáp án ${correctAns}`,
          diagnosis: diag,
        });
      }
    }
  });

  const totalErrors = trapItems.length;

  // Lời khuyên tổng quan
  let summaryAdvice = 'Bài thi được xử lý rất tốt, không mắc nhiều bẫy cơ bản.';
  if (trapCount >= 2) {
    summaryAdvice = `Bạn đã mất oan ${trapCount} câu do vướng "Bẫy từ phủ định". Cần rèn thói quen gạch chân từ khóa "không", "sai", "chưa đúng" khi đọc đề.`;
  } else if (calcCount >= 2) {
    summaryAdvice = `Có ${calcCount} câu sai do nhầm lẫn tính toán hoặc đơn vị. Hãy chậm lại 10 giây ở khâu bấm máy tính.`;
  } else if (knowledgeCount >= 3) {
    summaryAdvice = `Có ${knowledgeCount} câu sai kiến thức nền tảng. Hệ thống đã đồng bộ các câu này vào Sổ tay lỗi sai để bạn ôn lại ngay.`;
  }

  return {
    totalErrors,
    trapCount,
    calcCount,
    knowledgeCount,
    trapItems,
    summaryAdvice,
  };
}
