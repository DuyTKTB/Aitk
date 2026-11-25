/* ============================================================
   paperGrade.js — Đáp án + chấm điểm phiếu trả lời giấy (thuần JS, không Firestore)
   ------------------------------------------------------------
   Cấu trúc phiếu: Phần I (nhiều lựa chọn A-D), Phần II (Đúng/Sai 4 ý a-d),
   Phần III (trả lời ngắn tối đa 4 ký tự).

   Quy ước đáp án (dạng chuỗi, dễ nhập / dán từ Excel):
     Phần I  : "ABCDABCD..."  hoặc "1A 2B 3C ..."      ('*' = cho điểm mọi thí sinh)
     Phần II : mỗi câu 1 dòng "ĐSĐS" (Đ/S, D/S, T/F)      ('*' từng ý = cho điểm ý đó)
     Phần III: mỗi câu 1 dòng "0,5" ; nhiều đáp án chấp nhận: "0,5|0.5|1/2"
   ============================================================ */

/* Thang điểm mặc định theo cấu trúc đề tốt nghiệp THPT 2025:
     • Phần I: 0,25 điểm/câu • Phần III: 0,25 điểm/câu
     • Phần II: đúng 1 ý = 0,1 • 2 ý = 0,25 • 3 ý = 0,5 • 4 ý = 1,0 */
export const DEFAULT_SCORING = { p1: 0.25, p2: [0, 0.1, 0.25, 0.5, 1], p3: 0.25 };
export const DEFAULT_COUNTS = { p1: 18, p2: 4, p3: 6 };
export const MAX_COUNTS = { p1: 40, p2: 8, p3: 6 };

/* Bộ mẫu cấu trúc & thang điểm chính thức theo Chương trình GDPT 2018 / Kỳ thi THPT 2025+ */
export const MOET_EXAM_PRESETS = [
  {
    id: 'khtn_2025',
    label: 'Lý / Hóa / Sinh / Địa / KHTN',
    shortLabel: 'KHTN · 18·4·6',
    badge: 'Chuẩn BGD 2025+',
    counts: { p1: 18, p2: 4, p3: 6 },
    scoring: { p1: 0.25, p2: [0, 0.1, 0.25, 0.5, 1], p3: 0.25 },
    note: '18 P.I (4,5đ) + 4 P.II (4đ) + 6 P.III (1,5đ) = 10,0đ',
  },
  {
    id: 'toan_2025',
    label: 'Toán học THPT',
    shortLabel: 'Toán · 12·4·6',
    badge: 'Chuẩn BGD 2025+',
    counts: { p1: 12, p2: 4, p3: 6 },
    scoring: { p1: 0.25, p2: [0, 0.1, 0.25, 0.5, 1], p3: 0.5 },
    note: '12 P.I (3,0đ) + 4 P.II (4đ) + 6 P.III (3,0đ) = 10,0đ',
  },
  {
    id: 'lichsu_2025',
    label: 'Sử / GDKT&PL / Tin / Công nghệ',
    shortLabel: '24·4·0 (BGD)',
    badge: 'Chuẩn BGD 2025+',
    counts: { p1: 24, p2: 4, p3: 0 },
    scoring: { p1: 0.25, p2: [0, 0.1, 0.25, 0.5, 1], p3: 0.25 },
    note: '24 P.I (6,0đ) + 4 P.II (4,0đ) = 10,0đ',
  },
  {
    id: 'ngoaingu_2025',
    label: 'Ngoại ngữ (40 câu)',
    shortLabel: 'Anh · 40·0·0',
    badge: 'Chuẩn BGD 2025+',
    counts: { p1: 40, p2: 0, p3: 0 },
    scoring: { p1: 0.25, p2: [0, 0.1, 0.25, 0.5, 1], p3: 0.25 },
    note: '40 câu P.I × 0,25đ = 10,0đ',
  },
  {
    id: 'full_moet',
    label: 'Phiếu Đầy đủ BGD',
    shortLabel: 'Full · 40·8·6',
    badge: 'Mẫu A4 Đầy đủ',
    counts: { p1: 40, p2: 8, p3: 6 },
    scoring: { p1: 0.25, p2: [0, 0.1, 0.25, 0.5, 1], p3: 0.25 },
    note: 'Toàn bộ khung 40 P.I · 8 P.II · 6 P.III (quy đổi thang 10)',
  },
];

export function matchMoetPreset(counts, scoring) {
  if (!counts) return null;
  return MOET_EXAM_PRESETS.find((p) => (
    p.counts.p1 === Number(counts.p1)
    && p.counts.p2 === Number(counts.p2)
    && p.counts.p3 === Number(counts.p3)
    && (!scoring || (Math.abs((scoring.p1 ?? 0.25) - p.scoring.p1) < 1e-6 && Math.abs((scoring.p3 ?? 0.25) - p.scoring.p3) < 1e-6))
  )) || null;
}

const stripMarks = (s) => String(s ?? '').normalize('NFC');

/* ---------- Phân tích đáp án nhập tay ---------- */
export function parseKeyP1(text, n = 40) {
  const t = stripMarks(text).toUpperCase();
  const out = new Array(n).fill('');
  // Dạng có số thứ tự: "1A 2B", "1.A", "1: B", "1) C", "Câu 1: D"
  const numbered = [...t.matchAll(/(?:^|[\s,;])(?:CÂU\s*)?(\d{1,2})\s*[:.)\-–]?\s*([ABCD*])(?=$|[\s,;])/g)];
  if (numbered.length >= 1) {
    numbered.forEach((m) => {
      const q = Number(m[1]);
      if (q >= 1 && q <= n) out[q - 1] = m[2];
    });
    return out;
  }
  // Bỏ tiền tố nhãn tiếng Việt như "Đáp án:", "Phần I:" trước khi lọc chuỗi liền "ABCD..."
  const cleaned = t.replace(/^\s*(?:ĐÁP\s*ÁN|PHẦN\s*I|P\.?\s*1)\s*[:.\-–]?\s*/i, '');
  // Dạng liền: "ABCD..." ; ký tự · - _ ? là câu chưa có đáp án
  cleaned.replace(/[^ABCD*·_?\-]/g, '').split('').slice(0, n).forEach((c, i) => {
    out[i] = 'ABCD*'.includes(c) ? c : '';
  });
  return out;
}

export function parseKeyP2(text, n = 8) {
  // Giữ nguyên chỉ số dòng để không đẩy Câu 2 lên Câu 1 khi dòng 1 để trống
  const rawLines = stripMarks(text).split(/\r?\n/).map((l) => l.trim());
  const out = [];
  for (let i = 0; i < n; i++) {
    let l = (rawLines[i] || '').replace(/^\s*(?:câu\s*)?\d+\s*[:.)\-–]\s*/i, '').toUpperCase();
    // chuẩn hóa: Đ/D/T/1 → D ; S/F/0 → S ; * giữ nguyên
    const arr = [];
    for (const ch of l) {
      if ('ĐD'.includes(ch) || ch === 'T' || ch === '1') arr.push('D');
      else if (ch === 'S' || ch === 'F' || ch === '0') arr.push('S');
      else if (ch === '*') arr.push('*');
      else if ('·_?-'.includes(ch)) arr.push('');
    }
    out.push(arr.slice(0, 4).concat(['', '', '', '']).slice(0, 4));
  }
  return out;
}

export function parseKeyP3(text, n = 6) {
  // Giữ nguyên chỉ số dòng để khi sửa/nhập câu sau không bị nhảy lên câu trước
  const rawLines = stripMarks(text).split(/\r?\n/).map((l) => l.trim());
  const out = [];
  for (let i = 0; i < n; i++) {
    const l = (rawLines[i] || '').replace(/^\s*(?:câu\s*)?\d+\s*[:=]\s*/i, '');
    out.push(l ? l.split('|').map((x) => x.trim()).filter(Boolean) : []);
  }
  return out;
}

/* Chuỗi hiển thị lại từ đáp án đã lưu (để đổ vào ô nhập) */
export const keyToTextP1 = (arr = []) => arr.map((c) => c || '·').join('').replace(/(.{10})/g, '$1\n').trim();
export const keyToTextP2 = (arr = []) => arr.map((q) => (q || []).map((c) => (c === 'D' ? 'Đ' : c || '·')).join('')).join('\n');
export const keyToTextP3 = (arr = []) => arr.map((q) => (q || []).join('|')).join('\n');

/* Chuẩn hóa đáp án ngắn để so sánh */
export function normShort(s) {
  let t = stripMarks(s).replace(/\s+/g, '').replace(/[.]/g, ',').replace(/−|–/g, '-');
  if (/^-?\d+,\d+$/.test(t)) t = t.replace(/0+$/, '').replace(/,$/, '');
  return t;
}

/* ---------- Chấm 1 phiếu ---------- */
export function gradeSheet(read, key, counts = DEFAULT_COUNTS, scoring = DEFAULT_SCORING) {
  const sc = { ...DEFAULT_SCORING, ...scoring };
  const detail = { p1: [], p2: [], p3: [] };
  let s1 = 0, s2 = 0, s3 = 0, c1 = 0, c3 = 0;

  for (let i = 0; i < counts.p1; i++) {
    const k = key?.p1?.[i] || '';
    const a = read?.p1?.[i] ?? null;
    const ok = k === '*' ? true : !!k && a === k;
    if (k && ok) { s1 += sc.p1; c1++; }
    detail.p1.push({ q: i + 1, ans: a, key: k, ok: k ? ok : null });
  }

  for (let i = 0; i < counts.p2; i++) {
    const kq = key?.p2?.[i] || [];
    const aq = read?.p2?.[i] || [];
    let right = 0;
    const ys = [0, 1, 2, 3].map((y) => {
      const k = kq[y] || '';
      const a = aq[y] ?? null;
      const ok = k === '*' ? true : !!k && a === k;
      if (k && ok) right++;
      return { ans: a, key: k, ok: k ? ok : null };
    });
    s2 += sc.p2[right] || 0;
    detail.p2.push({ q: i + 1, right, ys });
  }

  for (let i = 0; i < counts.p3; i++) {
    const alts = key?.p3?.[i] || [];
    const a = read?.p3?.[i] ?? '';
    const ok = alts.includes('*') ? true : alts.length > 0 && !!a && alts.some((x) => normShort(x) === normShort(a));
    if (alts.length && ok) { s3 += sc.p3; c3++; }
    detail.p3.push({ q: i + 1, ans: a, key: alts.join(' | '), ok: alts.length ? ok : null });
  }

  const max = maxScore(counts, sc);
  const total = round2(s1 + s2 + s3);
  return {
    total,
    max,
    score10: max ? round2((total / max) * 10) : 0,
    parts: { p1: round2(s1), p2: round2(s2), p3: round2(s3) },
    correct: { p1: c1, p3: c3 },
    detail,
  };
}

export function maxScore(counts, scoring = DEFAULT_SCORING) {
  const sc = { ...DEFAULT_SCORING, ...scoring };
  return round2(counts.p1 * sc.p1 + counts.p2 * (sc.p2[4] || 0) + counts.p3 * sc.p3);
}

export const round2 = (x) => Math.round(x * 100) / 100;

/* Kiểm tra đáp án đã đủ chưa */
export function checkKey(key, counts) {
  const miss = [];
  const k1 = (key?.p1 || []).slice(0, counts.p1).filter((c) => !c).length;
  if (k1) miss.push(`Phần I thiếu ${k1} đáp án`);
  const k2 = (key?.p2 || []).slice(0, counts.p2).filter((q) => !q || q.some((c) => !c)).length;
  if (k2) miss.push(`Phần II thiếu ý ở ${k2} câu`);
  const k3 = (key?.p3 || []).slice(0, counts.p3).filter((q) => !q || !q.length).length;
  if (k3) miss.push(`Phần III thiếu đáp án ${k3} câu`);
  return miss;
}

/** Phân loại 1 câu hỏi vào Phần I (1), Phần II (2), Phần III (3) hoặc Tự luận (4). */
export function classifyExamQuestionPart(q) {
  if (!q || typeof q !== 'object') return 1;
  if (q.type === 'essay' || q.part === 4) return 4;
  if (q.type === 'true_false' || q.part === 2 || (Array.isArray(q.statements) && q.statements.length > 0)) return 2;
  if (q.type === 'short_answer' || q.part === 3 || (q.answer !== undefined && q.answer !== '' && !(q.options?.length))) return 3;
  return 1;
}

/* Đáp án Phần I từ đề online có sẵn */
export function keyP1FromExam(exam, n = 40) {
  const out = new Array(n).fill('');
  const p1Questions = (exam?.questions || []).filter((q) => classifyExamQuestionPart(q) === 1);
  p1Questions.slice(0, n).forEach((q, i) => {
    if (typeof q.correct === 'number' && q.correct >= 0 && q.correct < 4) out[i] = 'ABCD'[q.correct];
  });
  return out;
}

/* ---------- Danh sách SBD dán từ Excel ---------- */
export const normName = (s) => stripMarks(s).toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function parseRoster(text, members = []) {
  const byName = new Map(members.map((m) => [normName(m.name), m]));
  const map = {};
  const unmatched = [];
  stripMarks(text).split(/\r?\n/).forEach((line) => {
    const m = line.trim().match(/^(\d{1,8})[\s,;\t.-]+(.+)$/);
    if (!m) return;
    const sbd = m[1];
    const name = m[2].trim();
    const mem = byName.get(normName(name));
    map[sbd] = mem ? { id: mem.id, name: mem.name } : { id: null, name };
    if (!mem) unmatched.push(name);
  });
  return { map, unmatched };
}

/* ---------- Xuất CSV ---------- */
export function resultsToRows(results, exam) {
  const head = ['SBD', 'Họ tên', 'Mã đề', 'Phần I', 'Phần II', 'Phần III', 'Tổng', 'Thang 10', 'Cần xem lại', 'Tên ảnh'];
  const rows = [head];
  results.forEach((r) => {
    rows.push([
      r.sbd, r.studentName || '', r.code, r.grade?.parts?.p1 ?? '', r.grade?.parts?.p2 ?? '',
      r.grade?.parts?.p3 ?? '', r.grade?.total ?? '', r.grade?.score10 ?? '',
      r.needsReview ? 'Có' : '', r.fileName || '',
    ]);
  });
  return rows;
}

/* Dựng lại "read" từ bản ghi đã lưu trên Firestore */
export function answersToRead(ans = {}) {
  return {
    p1: (ans.p1 || []).map((c) => c || null),
    p2: (ans.p2 || []).map((s) => String(s || '').split('').map((c) => (c === 'D' || c === 'S' || c === '*' ? c : null))),
    p3: ans.p3 || [],
  };
}

const normTFChar = (c) => {
  const ch = String(c || '').trim().toUpperCase();
  if (ch === 'D' || ch === 'Đ' || ch === 'T') return 'D';
  if (ch === 'S' || ch === 'F') return 'S';
  if (ch === '*') return '*';
  return '';
};

/* Lưu và đọc đáp án dạng chuỗi (chấp nhận cả Đ/S và T/F cũng như chuỗi/mảng) */
export function keyToStored(key = {}) {
  const p1Arr = Array.isArray(key.p1) ? key.p1 : String(key.p1 || '').split('');
  const p2Arr = Array.isArray(key.p2) ? key.p2 : [];
  const p3Arr = Array.isArray(key.p3) ? key.p3 : [];
  return {
    p1: p1Arr.map((c) => ('ABCD*'.includes(String(c || '').toUpperCase()) ? String(c).toUpperCase() : '-')).join(''),
    p2: p2Arr.map((q) => (Array.isArray(q) ? q : String(q || '').split('')).map((c) => normTFChar(c) || '-').join('')),
    p3: p3Arr.map((q) => (Array.isArray(q) ? q.join('|') : String(q || ''))),
  };
}
export function keyFromStored(s = {}) {
  const p1Raw = Array.isArray(s.p1) ? s.p1 : String(s.p1 || '').split('');
  return {
    p1: p1Raw.map((c) => {
      const u = String(c || '').toUpperCase();
      return 'ABCD*'.includes(u) ? u : '';
    }),
    p2: (s.p2 || []).map((q) => (Array.isArray(q) ? q : String(q || '').split('')).map((c) => normTFChar(c))),
    p3: (s.p3 || []).map((q) => (Array.isArray(q) ? q : String(q || '').split('|')).map((x) => String(x).trim()).filter(Boolean)),
  };
}

/* ============================================================
   NÂNG CẤP MỚI: PHÂN TÍCH PHỔ ĐIỂM & ĐỘ KHÓ CÂU HỎI (ANALYTICS)
   ============================================================ */
export function computePaperAnalytics(results = [], counts = DEFAULT_COUNTS) {
  if (!results.length) return null;

  const scores = results.map((r) => r.grade?.score10 ?? 0).filter((s) => !Number.isNaN(s));
  if (!scores.length) return null;

  const n = scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = round2(sum / n);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = n % 2 === 0 ? round2((sorted[n / 2 - 1] + sorted[n / 2]) / 2) : sorted[Math.floor(n / 2)];

  // Độ lệch chuẩn
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / n;
  const stdDev = round2(Math.sqrt(variance));

  // Tỷ lệ
  const passCount = scores.filter((s) => s >= 5.0).length;
  const passRate = Math.round((passCount / n) * 100);
  const goodCount = scores.filter((s) => s >= 8.0).length;
  const goodRate = Math.round((goodCount / n) * 100);

  // Phổ điểm 10 khoảng: [0-1), [1-2), ..., [9-10]
  const bins = [
    { label: '0 - 1', min: 0, max: 1, count: 0 },
    { label: '1 - 2', min: 1, max: 2, count: 0 },
    { label: '2 - 3', min: 2, max: 3, count: 0 },
    { label: '3 - 4', min: 3, max: 4, count: 0 },
    { label: '4 - 5', min: 4, max: 5, count: 0 },
    { label: '5 - 6', min: 5, max: 6, count: 0 },
    { label: '6 - 7', min: 6, max: 7, count: 0 },
    { label: '7 - 8', min: 7, max: 8, count: 0 },
    { label: '8 - 9', min: 8, max: 9, count: 0 },
    { label: '9 - 10', min: 9, max: 10.01, count: 0 },
  ];

  scores.forEach((s) => {
    const b = bins.find((bin) => s >= bin.min && s < bin.max);
    if (b) b.count++;
    else if (s >= 10) bins[bins.length - 1].count++;
  });

  // Phân tích chất lượng câu hỏi Phần I theo Lý thuyết Khảo thí Cổ điển (CTT / IRT):
  // - Độ khó p = Tỷ lệ làm đúng (0..1)
  // - Độ phân cách D = P_nhóm_cao(27%) - P_nhóm_thấp(27%)
  const getScore10 = (r) => {
    const val = r?.grade?.score10 ?? r?.grade?.total10;
    return typeof val === 'number' && !Number.isNaN(val) ? val : null;
  };
  const rankedResults = [...results]
    .filter((r) => getScore10(r) !== null)
    .sort((a, b) => (getScore10(b) || 0) - (getScore10(a) || 0));
  const groupSize = Math.max(1, Math.round(rankedResults.length * 0.27));
  const upperGroup = rankedResults.slice(0, groupSize);
  const lowerGroup = rankedResults.slice(Math.max(0, rankedResults.length - groupSize));

  const p1Questions = [];
  for (let q = 1; q <= (counts?.p1 || 0); q++) {
    let correctCount = 0;
    let totalAnswered = 0;
    results.forEach((r) => {
      const d = r.grade?.detail?.p1?.find((x) => x.q === q);
      if (d) {
        totalAnswered++;
        if (d.ok) correctCount++;
      }
    });
    const correctRate = totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const pIndex = totalAnswered ? round2(correctCount / totalAnswered) : 0;

    let upperCorrect = 0;
    upperGroup.forEach((r) => {
      const d = r.grade?.detail?.p1?.find((x) => x.q === q);
      if (d?.ok) upperCorrect++;
    });
    let lowerCorrect = 0;
    lowerGroup.forEach((r) => {
      const d = r.grade?.detail?.p1?.find((x) => x.q === q);
      if (d?.ok) lowerCorrect++;
    });
    const dIndex = rankedResults.length >= 2
      ? round2(upperCorrect / groupSize - lowerCorrect / groupSize)
      : 0;

    let qualityLabel = 'Phân hóa tốt';
    let qualityTone = 'good';
    if (rankedResults.length < 2) {
      qualityLabel = pIndex >= 0.8 ? 'Đạt tốt' : pIndex <= 0.4 ? 'Khó / hay sai' : 'Trung bình';
      qualityTone = pIndex <= 0.4 ? 'warn' : 'neutral';
    } else if (dIndex < 0.15) {
      qualityLabel = 'Cần rà soát mồi nhử';
      qualityTone = 'warn';
    } else if (pIndex > 0.88) {
      qualityLabel = 'Câu nhận biết dễ';
      qualityTone = 'neutral';
    } else if (pIndex < 0.25 && dIndex >= 0.25) {
      qualityLabel = 'Câu vận dụng cao (8.5+)';
      qualityTone = 'high';
    }

    p1Questions.push({
      q,
      correctRate,
      correctCount,
      totalAnswered,
      pIndex,
      dIndex,
      qualityLabel,
      qualityTone,
    });
  }

  // Phân tích Phần II (Đúng/Sai — tỷ lệ đạt tối đa 4/4 ý & trung bình số ý đúng)
  const p2Questions = [];
  for (let q = 1; q <= (counts?.p2 || 0); q++) {
    let fullCount = 0;
    let totalRight = 0;
    let totalAnswered = 0;
    results.forEach((r) => {
      const d = r.grade?.detail?.p2?.find((x) => x.q === q);
      if (d) {
        totalAnswered++;
        const right = Number(d.right || 0);
        totalRight += right;
        if (right === 4) fullCount++;
      }
    });
    p2Questions.push({
      q,
      fullCount,
      totalAnswered,
      fullRate: totalAnswered ? Math.round((fullCount / totalAnswered) * 100) : 0,
      avgRight: totalAnswered ? round2(totalRight / totalAnswered) : 0,
    });
  }

  // Phân tích Phần III (Trả lời ngắn)
  const p3Questions = [];
  for (let q = 1; q <= (counts?.p3 || 0); q++) {
    let correctCount = 0;
    let totalAnswered = 0;
    results.forEach((r) => {
      const d = r.grade?.detail?.p3?.find((x) => x.q === q);
      if (d) {
        totalAnswered++;
        if (d.ok) correctCount++;
      }
    });
    p3Questions.push({
      q,
      correctCount,
      totalAnswered,
      correctRate: totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0,
    });
  }

  // Top 5 câu học sinh sai nhiều nhất (Phần I)
  const hardestP1 = [...p1Questions].sort((a, b) => a.correctRate - b.correctRate).slice(0, 5);
  const lowDiscP1 = rankedResults.length >= 2
    ? p1Questions.filter((x) => x.dIndex < 0.15)
    : [];

  return {
    count: n,
    avg,
    median,
    min,
    max,
    stdDev,
    passRate,
    goodRate,
    bins,
    hardestP1,
    lowDiscP1,
    p2Questions,
    p3Questions,
    itemQualityList: p1Questions,
  };
}

/* Trích đáp án Phần II (Đúng/Sai) từ đề online đã soạn */
export function keyP2FromExam(exam, n = MAX_COUNTS.p2) {
  const qs = (exam?.questions || []).filter((q) => classifyExamQuestionPart(q) === 2);
  const out = [];
  for (let i = 0; i < n; i++) {
    const sts = qs[i]?.statements || [];
    const arr = [0, 1, 2, 3].map((k) => {
      const a = sts[k]?.answer;
      return typeof a === 'boolean' ? (a ? 'D' : 'S') : '';
    });
    out.push(arr);
  }
  return out;
}

/* Trích đáp án Phần III (Trả lời ngắn) từ đề online đã soạn */
export function keyP3FromExam(exam, n = MAX_COUNTS.p3) {
  const qs = (exam?.questions || []).filter((q) => classifyExamQuestionPart(q) === 3);
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = qs[i];
    if (!q) {
      out.push([]);
      continue;
    }
    const vals = [];
    const pushVal = (v) => {
      const s = String(v ?? '').trim();
      if (s && !vals.includes(s)) vals.push(s);
    };
    pushVal(q.answer);
    if (Array.isArray(q.accepted)) q.accepted.forEach(pushVal);
    out.push(vals);
  }
  return out;
}

/* ============================================================
   TIỆN ÍCH TNMAKER-STYLE: QUÉT ĐÁP ÁN MẪU, DÁN MA TRẬN EXCEL,
   SINH SBD TỰ ĐỘNG & IN BẢNG ĐIỂM LỚP A4
   ============================================================ */

/** Chuyển kết quả đọc 1 phiếu tô chuẩn của giáo viên (readSheet) thành bộ đáp án cấu hình. */
export function answerKeyFromSheetRead(read = {}, counts = DEFAULT_COUNTS) {
  const n1 = Math.max(0, Math.min(MAX_COUNTS.p1, Number(counts?.p1 ?? DEFAULT_COUNTS.p1)));
  const n2 = Math.max(0, Math.min(MAX_COUNTS.p2, Number(counts?.p2 ?? DEFAULT_COUNTS.p2)));
  const n3 = Math.max(0, Math.min(MAX_COUNTS.p3, Number(counts?.p3 ?? DEFAULT_COUNTS.p3)));

  const p1 = Array.from({ length: MAX_COUNTS.p1 }, (_, i) => {
    if (i >= n1) return '';
    const v = String(read?.p1?.[i] || '').toUpperCase();
    return 'ABCD'.includes(v) ? v : '';
  });

  const p2 = Array.from({ length: MAX_COUNTS.p2 }, (_, i) => {
    if (i >= n2) return ['', '', '', ''];
    const row = read?.p2?.[i] || [];
    return [0, 1, 2, 3].map((k) => {
      const ch = String(row[k] || '').toUpperCase();
      return ch === 'D' || ch === 'Đ' || ch === 'S' ? (ch === 'Đ' ? 'D' : ch) : '';
    });
  });

  const p3 = Array.from({ length: MAX_COUNTS.p3 }, (_, i) => {
    if (i >= n3) return [];
    const val = String(read?.p3?.[i] || '').replace(/\?/g, '').trim();
    return val ? [val] : [];
  });

  const rawCode = String(read?.code || '').replace(/\D/g, '');
  const code = /^\d{3}$/.test(rawCode) ? rawCode : '';

  return {
    code,
    key: { p1, p2, p3 },
    texts: {
      p1: keyToTextP1(p1.slice(0, n1)),
      p2: keyToTextP2(p2.slice(0, n2)),
      p3: keyToTextP3(p3.slice(0, n3)),
    },
    filledCount: {
      p1: p1.filter(Boolean).length,
      p2: p2.filter((q) => q.some(Boolean)).length,
      p3: p3.filter((q) => q.length > 0).length,
    },
  };
}

/**
 * Phân tích bảng đáp án dán từ Excel / McMix / TNMix / SmartTest cho nhiều mã đề cùng lúc.
 * Hỗ trợ dạng bảng cột tab ("Câu\t101\t102\t103\t104") hoặc từng khối ("Mã 101: ABCD...").
 */
export function parseBulkMatrixKeys(rawText, counts = MAX_COUNTS) {
  const clean = stripMarks(rawText);
  const lines = clean.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());
  const byCode = {};
  if (!lines.length) return { byCode, codes: [], parsedCount: 0 };

  const ensureCode = (c) => {
    if (!byCode[c]) {
      byCode[c] = {
        p1: new Array(MAX_COUNTS.p1).fill(''),
        p2: Array.from({ length: MAX_COUNTS.p2 }, () => ['', '', '', '']),
        p3: Array.from({ length: MAX_COUNTS.p3 }, () => []),
      };
    }
    return byCode[c];
  };

  // Thử nhận diện dòng tiêu đề dạng bảng chứa nhiều Mã đề 3 chữ số (VD: Câu | 101 | 102 | 103 | 104)
  let headerIdx = -1;
  let colCodeMap = []; // [{ colIdx, code }]
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const cells = lines[i].split(/[\t;|]+|\s{2,}/).map((x) => x.trim());
    const found = [];
    cells.forEach((cell, colIdx) => {
      const m = cell.match(/^(?:mã\s*(?:đề)?\s*)?(\d{3})$/i);
      if (m) found.push({ colIdx, code: m[1] });
    });
    if (found.length >= 1 && cells.length >= 2) {
      headerIdx = i;
      colCodeMap = found;
      break;
    }
  }

  if (headerIdx >= 0 && colCodeMap.length >= 1) {
    colCodeMap.forEach(({ code }) => ensureCode(code));
    let activePart = 1;
    let p1Row = 0;
    let p2Row = 0;
    let p3Row = 0;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^phần\s*i\b|^p\.?\s*1\b|^trắc\s*nghiệm/i.test(line)) { activePart = 1; continue; }
      if (/^phần\s*ii\b|^p\.?\s*2\b|^đúng\s*[\/-]?\s*sai/i.test(line)) { activePart = 2; continue; }
      if (/^phần\s*iii\b|^p\.?\s*3\b|^trả\s*lời\s*ngắn/i.test(line)) { activePart = 3; continue; }

      const cells = line.split(/[\t;|]+|\s{2,}/).map((x) => x.trim());
      if (cells.length < 2) continue;

      const label = cells[0].toLowerCase();
      const qNumMatch = label.match(/(\d{1,2})/);
      const qSubMatch = label.match(/(\d{1,2})\s*[.)\-:]?\s*([abcd])$/i);
      const colVals = colCodeMap.map(({ colIdx }) => cells[colIdx] || '');

      // Tự động suy đoán phần nếu người dùng không dán dòng tiêu đề "Phần I / II / III"
      const sample = colVals.find(Boolean) || '';
      if (qSubMatch && /^[đdstf*]/i.test(sample)) {
        const q = Number(qSubMatch[1]) - 1;
        const subIdx = 'abcd'.indexOf(qSubMatch[2].toLowerCase());
        if (q >= 0 && q < MAX_COUNTS.p2 && subIdx >= 0) {
          colCodeMap.forEach(({ code }, idx) => {
            const ch = normTFChar(colVals[idx]);
            if (ch) byCode[code].p2[q][subIdx] = ch;
          });
          activePart = 2;
        }
        continue;
      }

      const looksLikeP2Word = /^[đdstf*]{4}$/i.test(sample.replace(/\s+/g, ''));
      const looksLikeP1Char = /^[abcd*]$/i.test(sample);
      const looksLikeP3Num = /^-?\d+(?:[.,]\d+)?(?:\|.*)?$/.test(sample) && !looksLikeP2Word;

      let part = activePart;
      if (looksLikeP2Word) part = 2;
      else if (looksLikeP3Num && (!looksLikeP1Char || activePart === 3)) part = 3;
      else if (looksLikeP1Char && activePart === 1) part = 1;

      if (part === 1) {
        const idxQ = qNumMatch ? Number(qNumMatch[1]) - 1 : p1Row;
        if (idxQ >= 0 && idxQ < MAX_COUNTS.p1) {
          colCodeMap.forEach(({ code }, idx) => {
            const ch = String(colVals[idx] || '').trim().toUpperCase();
            if ('ABCD*'.includes(ch) && ch) byCode[code].p1[idxQ] = ch;
          });
          p1Row = idxQ + 1;
        }
      } else if (part === 2) {
        const idxQ = qNumMatch && Number(qNumMatch[1]) <= MAX_COUNTS.p2 ? Number(qNumMatch[1]) - 1 : p2Row;
        if (idxQ >= 0 && idxQ < MAX_COUNTS.p2) {
          colCodeMap.forEach(({ code }, idx) => {
            const parsed = parseKeyP2(colVals[idx], 1)[0];
            if (parsed) byCode[code].p2[idxQ] = parsed;
          });
          p2Row = idxQ + 1;
        }
      } else if (part === 3) {
        const idxQ = qNumMatch && Number(qNumMatch[1]) <= MAX_COUNTS.p3 ? Number(qNumMatch[1]) - 1 : p3Row;
        if (idxQ >= 0 && idxQ < MAX_COUNTS.p3) {
          colCodeMap.forEach(({ code }, idx) => {
            const alts = String(colVals[idx] || '').split('|').map((x) => x.trim()).filter(Boolean);
            if (alts.length) byCode[code].p3[idxQ] = alts;
          });
          p3Row = idxQ + 1;
        }
      }
    }
  } else {
    // Dự phòng định dạng dòng "101: ABCDABCD..." hoặc "Mã 101\tABCD..."
    lines.forEach((line) => {
      const m = line.match(/^(?:mã\s*(?:đề)?\s*)?(\d{3})\s*[:=\-\t]+\s*(.+)$/i);
      if (!m) return;
      const code = m[1];
      const entry = ensureCode(code);
      const chunks = m[2].split(/\s*[;|]\s*/);
      entry.p1 = parseKeyP1(chunks[0] || '', MAX_COUNTS.p1);
      if (chunks[1]) {
        const p2Raw = chunks[1].split(/[,/\s]+/).filter(Boolean).join('\n');
        entry.p2 = parseKeyP2(p2Raw, MAX_COUNTS.p2);
      }
      if (chunks[2]) {
        const p3Raw = chunks[2].split(/\s+/).filter(Boolean).join('\n');
        entry.p3 = parseKeyP3(p3Raw, MAX_COUNTS.p3);
      }
    });
  }

  const codes = Object.keys(byCode).sort();
  let maxP1 = 0;
  let maxP2 = 0;
  let maxP3 = 0;
  codes.forEach((c) => {
    const k = byCode[c];
    for (let i = k.p1.length - 1; i >= 0; i--) { if (k.p1[i]) { maxP1 = Math.max(maxP1, i + 1); break; } }
    for (let i = k.p2.length - 1; i >= 0; i--) { if (k.p2[i]?.some(Boolean)) { maxP2 = Math.max(maxP2, i + 1); break; } }
    for (let i = k.p3.length - 1; i >= 0; i--) { if (k.p3[i]?.length) { maxP3 = Math.max(maxP3, i + 1); break; } }
  });
  return { byCode, codes, parsedCount: codes.length, detectedCounts: { p1: maxP1, p2: maxP2, p3: maxP3 } };
}

/** Sinh nhanh danh sách SBD 6 chữ số (000001…) từ danh sách thành viên lớp học. */
export function autoGenerateSbdRoster(members = []) {
  const list = Array.isArray(members) ? members.filter((m) => m && (m.name || m.displayName || m.fullName)) : [];
  const sorted = [...list].sort((a, b) =>
    String(a.name || a.displayName || a.fullName || '').localeCompare(String(b.name || b.displayName || b.fullName || ''), 'vi')
  );
  const used = new Set();
  const map = {};
  const lines = [];

  sorted.forEach((m, i) => {
    const name = String(m.name || m.displayName || m.fullName || `Học sinh ${i + 1}`).trim();
    const codeDigits = String(m.code || m.studentCode || '').replace(/\D/g, '');
    let sbd = codeDigits && codeDigits.length <= 6 ? codeDigits.padStart(6, '0') : '';
    if (!sbd || used.has(sbd)) {
      let seq = i + 1;
      do {
        sbd = String(seq).padStart(6, '0');
        seq += 1;
      } while (used.has(sbd));
    }
    used.add(sbd);
    map[sbd] = { id: m.id || m.uid || null, name };
    lines.push(`${sbd}\t${name}`);
  });

  return { map, text: lines.join('\n'), count: lines.length };
}

function escapeHtmlBasic(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Tạo tài liệu HTML in / lưu PDF Bảng tổng hợp kết quả chấm phiếu OMR chuẩn A4. */
export function buildScoreReportPrintHtml({ paper = {}, results = [], classInfo = null } = {}) {
  const valid = results.filter((r) => r.status !== 'error' && r.grade);
  const analytics = computePaperAnalytics(valid, paper.counts);
  const rowsHtml = [...valid]
    .sort((a, b) => String(a.sbd || '').localeCompare(String(b.sbd || '')))
    .map((r, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td class="mono">${escapeHtmlBasic(r.sbd || '—')}</td>
        <td>${escapeHtmlBasic(r.studentName || '—')}</td>
        <td class="mono" style="text-align:center;">${escapeHtmlBasic(r.code || '—')}</td>
        <td style="text-align:right;">${r.grade?.parts?.p1 ?? 0}</td>
        <td style="text-align:right;">${r.grade?.parts?.p2 ?? 0}</td>
        <td style="text-align:right;">${r.grade?.parts?.p3 ?? 0}</td>
        <td style="text-align:right;font-weight:700;">${r.grade?.total ?? 0}</td>
        <td style="text-align:right;font-weight:800;color:#0369a1;">${r.grade?.score10 ?? 0}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Bảng điểm OMR — ${escapeHtmlBasic(paper.title || 'ELEC Science AI')}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; font-size: 12px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; }
    .head h1 { margin: 0 0 4px; font-size: 17px; text-transform: uppercase; color: #0f172a; }
    .head p { margin: 0; color: #475569; font-size: 12px; }
    .brand { text-align: right; font-size: 11px; color: #0284c7; font-weight: 700; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
    .stat { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; }
    .stat span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .stat b { font-size: 15px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11.5px; }
    th { background: #e0f2fe; color: #0c4a6e; text-align: left; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc; }
    .mono { font-family: ui-monospace, monospace; font-weight: 700; }
    .foot { margin-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <h1>BẢNG TỔNG HỢP ĐIỂM CHẤM PHIẾU OMR</h1>
      <p><b>Bài thi:</b> ${escapeHtmlBasic(paper.title || '—')} · <b>Lớp:</b> ${escapeHtmlBasic(classInfo?.name || 'Tự do')} · <b>Ngày in:</b> ${new Date().toLocaleDateString('vi-VN')}</p>
    </div>
    <div class="brand">ELEC Science AI<br/>elecai.id.vn</div>
  </div>
  ${analytics ? `
    <div class="stats">
      <div class="stat"><span>Số bài chấm</span><b>${analytics.count} bài</b></div>
      <div class="stat"><span>Điểm trung bình</span><b>${analytics.avg} / 10</b></div>
      <div class="stat"><span>Tỷ lệ đạt (≥ 5,0)</span><b>${analytics.passRate}%</b></div>
      <div class="stat"><span>Cao / Thấp nhất</span><b>${analytics.max} / ${analytics.min}</b></div>
    </div>
  ` : ''}
  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:36px;">STT</th>
        <th>SBD</th>
        <th>Họ và tên thí sinh</th>
        <th style="text-align:center;">Mã đề</th>
        <th style="text-align:right;">Phần I</th>
        <th style="text-align:right;">Phần II</th>
        <th style="text-align:right;">Phần III</th>
        <th style="text-align:right;">Tổng</th>
        <th style="text-align:right;">Thang 10</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || '<tr><td colspan="9" style="text-align:center;">Chưa có dữ liệu điểm</td></tr>'}</tbody>
  </table>
  <div class="foot">
    <span>Xuất tự động từ Hệ thống Khảo thí OMR ELEC Science AI</span>
    <span>Chữ ký giáo viên / Người chấm: ..........................................</span>
  </div>
</body>
</html>`;
}
