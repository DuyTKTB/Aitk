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

const stripMarks = (s) => String(s ?? '').normalize('NFC');

/* ---------- Phân tích đáp án nhập tay ---------- */
export function parseKeyP1(text, n = 40) {
  const t = stripMarks(text).toUpperCase();
  const out = new Array(n).fill('');
  // Dạng có số thứ tự: "1A 2B", "1.A", "1: B", "1) C", "Câu 1: D"
  const numbered = [...t.matchAll(/(\d{1,2})\s*[:.)\-–]?\s*([ABCD*])/g)];
  if (numbered.length >= 2) {
    numbered.forEach((m) => {
      const q = Number(m[1]);
      if (q >= 1 && q <= n) out[q - 1] = m[2];
    });
    return out;
  }
  // Dạng liền: "ABCD..." ; ký tự · - _ ? là câu chưa có đáp án
  t.replace(/[^ABCD*·_?\-]/g, '').split('').slice(0, n).forEach((c, i) => {
    out[i] = 'ABCD*'.includes(c) ? c : '';
  });
  return out;
}

export function parseKeyP2(text, n = 8) {
  const lines = stripMarks(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < n; i++) {
    let l = (lines[i] || '').replace(/^\s*(?:câu\s*)?\d+\s*[:.)\-–]\s*/i, '').toUpperCase();
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
  const lines = stripMarks(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < n; i++) {
    const l = (lines[i] || '').replace(/^\s*(?:câu\s*)?\d+\s*[:=]\s*/i, '');
    out.push(l.split('|').map((x) => x.trim()).filter(Boolean));
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

/* Đáp án Phần I từ đề online có sẵn */
export function keyP1FromExam(exam, n = 40) {
  const out = new Array(n).fill('');
  (exam?.questions || []).slice(0, n).forEach((q, i) => {
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

/* Lưu và đọc đáp án dạng chuỗi */
export function keyToStored(key = {}) {
  return {
    p1: (key.p1 || []).map((c) => c || '-').join(''),
    p2: (key.p2 || []).map((q) => (q || []).map((c) => c || '-').join('')),
    p3: (key.p3 || []).map((q) => (q || []).join('|')),
  };
}
export function keyFromStored(s = {}) {
  return {
    p1: String(s.p1 || '').split('').map((c) => ('ABCD*'.includes(c) ? c : '')),
    p2: (s.p2 || []).map((q) => String(q).split('').map((c) => ('DS*'.includes(c) ? c : ''))),
    p3: (s.p3 || []).map((q) => String(q).split('|').map((x) => x.trim()).filter(Boolean)),
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

  // Phân tích câu hỏi khó nhất Phần I
  const p1Questions = [];
  for (let q = 1; q <= counts.p1; q++) {
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
    p1Questions.push({ q, correctRate, correctCount, totalAnswered });
  }

  // Top 5 câu học sinh sai nhiều nhất
  const hardestP1 = [...p1Questions].sort((a, b) => a.correctRate - b.correctRate).slice(0, 5);

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
  };
}
