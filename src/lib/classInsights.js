/* ============================================================
   classInsights.js — Phân tích bài nộp thật của lớp
   Dùng cho dashboard giáo viên và prompt tạo đề.
   ============================================================ */

const pctOf = (s) => (s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0);

function stem(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > 88 ? `${t.slice(0, 88)}…` : t;
}

/**
 * Gom thống kê từ đề + submissions đã tải.
 * Không gọi AI — chỉ số liệu để dashboard và prompt tạo đề bám thực tế.
 */
export function buildClassInsights({ exams = [], submissionsMap = {}, rangeDays = 'all', now = Date.now() } = {}) {
  const cutoff = rangeDays === 'all' ? 0 : now - Number(rangeDays) * 86400000;
  const examById = Object.fromEntries(exams.map((e) => [e.id, e]));

  const subs = [];
  Object.entries(submissionsMap).forEach(([examId, list]) => {
    (list || []).forEach((s) => {
      const t = s.submittedAt?.toMillis?.() || (s.submittedAt?.seconds ? s.submittedAt.seconds * 1000 : new Date(s.submittedAt || 0).getTime());
      const ms = Number.isFinite(t) ? t : now;
      if (ms >= cutoff) subs.push({ ...s, examId });
    });
  });

  const avgPct = subs.length
    ? Math.round(subs.reduce((a, s) => a + pctOf(s), 0) / subs.length)
    : 0;
  const passRate = subs.length
    ? Math.round((subs.filter((s) => pctOf(s) >= 50).length / subs.length) * 100)
    : 0;

  const health = !subs.length
    ? { grade: '—', label: 'Chưa có bài nộp' }
    : avgPct >= 85 && passRate >= 90 ? { grade: 'A+', label: 'Xuất sắc' }
    : avgPct >= 75 && passRate >= 80 ? { grade: 'A', label: 'Tốt' }
    : avgPct >= 65 && passRate >= 70 ? { grade: 'B+', label: 'Khá' }
    : avgPct >= 50 ? { grade: 'B', label: 'Đạt chuẩn' }
    : { grade: 'C', label: 'Cần hỗ trợ' };

  const atRiskMap = {};
  subs.forEach((s) => {
    const p = pctOf(s);
    if (p >= 50) return;
    if (!atRiskMap[s.studentId] || atRiskMap[s.studentId].pct > p) {
      atRiskMap[s.studentId] = {
        studentId: s.studentId,
        studentName: s.studentName || 'Học sinh',
        pct: Math.round(p),
      };
    }
  });
  const atRisk = Object.values(atRiskMap).sort((a, b) => a.pct - b.pct);

  const qStats = [];
  const topicMap = {};
  exams.forEach((exam) => {
    const list = submissionsMap[exam.id] || [];
    if (!list.length) return;
    (exam.questions || []).forEach((qq, i) => {
      let rated = 0;
      let ok = 0;
      list.forEach((s) => {
        const d = s.detail?.[i];
        const picked = d?.picked ?? s.answers?.[i];
        if (typeof picked !== 'number' && !d) return;
        rated += 1;
        if (d?.isCorrect || picked === qq.correct) ok += 1;
      });
      if (!rated) return;
      const rate = Math.round((ok / rated) * 100);
      const topic = String(qq.topic || exam.title || 'Chưa gắn chuyên đề').trim() || 'Chưa gắn chuyên đề';
      qStats.push({
        examId: exam.id,
        examTitle: exam.title,
        index: i,
        text: qq.q,
        topic,
        level: qq.level || '',
        rate,
        rated,
      });
      if (!topicMap[topic]) topicMap[topic] = { topic, rated: 0, ok: 0 };
      topicMap[topic].rated += rated;
      topicMap[topic].ok += ok;
    });
  });

  const hardest = [...qStats].sort((a, b) => a.rate - b.rate).slice(0, 6);
  const weakestTopics = Object.values(topicMap)
    .map((t) => ({ ...t, rate: Math.round((t.ok / t.rated) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);

  const diagnosis = !subs.length
    ? 'Chưa có bài nộp trong khoảng đang xem. Khi học sinh nộp bài, hệ thống sẽ chỉ ra câu sai nhiều và chuyên đề yếu.'
    : hardest.length
      ? `Câu khó nhất chỉ ${hardest[0].rate}% học sinh làm đúng: “${stem(hardest[0].text)}”.`
      : avgPct < 70
        ? `Điểm trung bình ${avgPct}% — lớp đang dưới mức vững. Nên ôn lại phần tính toán và các câu vận dụng.`
        : `Điểm trung bình ${avgPct}%, tỷ lệ đạt ${passRate}%. Lớp nắm phần nền khá tốt.`;

  const nextLesson = !subs.length
    ? 'Giao một đề ngắn (8–10 câu) để có dữ liệu chẩn đoán trước khi dạy chuyên đề mới.'
    : weakestTopics[0]
      ? `Tiết tới dành 8–10 phút ôn “${weakestTopics[0].topic}” (đúng ${weakestTopics[0].rate}%), rồi cho 3 câu vận dụng cùng dạng.`
      : 'Công bố câu sai nhiều nhất, giải lại trên bảng, rồi mở quyền thi lại cho học sinh dưới 50%.';

  const forAi = [
    subs.length ? `Dữ liệu lớp: ${subs.length} bài nộp, điểm TB ${avgPct}%, đạt ≥50% là ${passRate}%.` : 'Chưa có bài nộp — soạn đề ôn bao quát, ưu tiên nhận biết và thông hiểu.',
    weakestTopics.length
      ? `Chuyên đề yếu: ${weakestTopics.map((t) => `${t.topic} (${t.rate}% đúng)`).join('; ')}.`
      : '',
    hardest.length
      ? `Dạng câu sai nhiều: ${hardest.slice(0, 3).map((h) => stem(h.text)).join(' | ')}.`
      : '',
    atRisk.length ? `${atRisk.length} học sinh dưới 50%: cần câu nhận biết/thông hiểu để kéo điểm, xen vài câu vận dụng.` : '',
  ].filter(Boolean).join('\n');

  return {
    examCount: exams.length,
    submissionCount: subs.length,
    avgPct,
    passRate,
    health,
    atRisk,
    hardest,
    weakestTopics,
    diagnosis,
    nextLesson,
    forAi,
    examTitles: exams.map((e) => examById[e.id]?.title || e.title).filter(Boolean),
  };
}
