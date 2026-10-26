/* ============================================================
   learningAnalyticsReport.js — HỢP ĐỒNG DỮ LIỆU VỚI AI (thuần JS)
   ------------------------------------------------------------
   Phần KHÔNG phụ thuộc Firebase/mạng của trung tâm phân tích:
     1. buildAiContext  — payload gọn, đã ẩn danh (không email, không
        tên học sinh) để gửi AI.
     2. buildPrompt + REPORT_RESPONSE_SCHEMA — yêu cầu & schema đầu ra.
     3. validateReport  — kiểm tra JSON AI trả về, cắt mọi thứ sai hình
        dạng; ném AiReportError khi không dùng được.
     4. auditNumbers    — đối chiếu mọi phát biểu "%" của AI với số liệu
        đã tính; số không khớp bị gắn cờ và ghi vào limitations.
     5. buildRuleBasedReport — báo cáo fallback bằng LUẬT khi AI lỗi,
        engine = 'rule' (không giả danh là AI).

   Tách riêng khỏi learningAnalyticsAi.js để test được bằng vitest
   mà không cần nạp Firebase/AI client.
   ============================================================ */

import { anonymizeForAi, mean, THRESHOLDS } from './learningAnalytics.js';

export const REPORT_SCHEMA_VERSION = 1;

const MAX = {
  findings: 10,
  evidence: 12,
  risks: 8,
  recommendations: 8,
  limitations: 8,
  perSubject: 12,
  listItem: 420,
  summary: 1200,
};

const clean = (v, max = MAX.listItem) => String(v ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/* ============================================================
   1. PAYLOAD CHO AI (tổng hợp, ẩn danh)
   ============================================================ */

/**
 * buildAiContext(analytics) → object chỉ chứa SỐ LIỆU TỔNG HỢP.
 * Không có email, không có tên học sinh, không có câu trả lời thô.
 */
export function buildAiContext(analytics) {
  const a = anonymizeForAi(analytics);
  const { meta, overview, subjects, timeline, distribution, topics, students, warnings, dataQuality, subjectDetails } = a;

  return {
    lop: meta.className,
    monChinh: meta.classSubject || '',
    khoangThoiGian: meta.rangeLabel,
    tuNgay: meta.from,
    denNgay: meta.to,
    doChiaBieuDo: meta.granularity,
    quyMo: {
      soHocSinh: overview.students,
      soGiaoVienBoMon: overview.teachers,
      soDe: overview.exams,
      soDeCoKetQua: overview.scoredExams,
      soLuotNop: overview.submissions,
      luotMongDoi: overview.expectedAttempts,
    },
    chiSo: {
      tyLeHoanThanh: overview.completionRate,
      tyLeThamGia: overview.participationRate,
      diemTrungBinh: overview.avgPct,
      trungVi: overview.medianPct,
      tyLeDat: overview.passRate,
      doLechChuan: overview.spreadPct,
      hocSinhCoBai: overview.activeStudents,
    },
    theoMon: subjects.map((s) => ({
      mon: s.subject,
      soGiaoVien: s.teachers,
      soDe: s.exams,
      soLuotNop: s.submissions,
      luotMongDoi: s.expected,
      tyLeThamGia: s.participation,
      diemTrungBinh: s.avgPct,
      tyLeDat: s.passRate,
      mucDuLieu: s.dataLevel,
      /* Số học sinh theo mức xếp loại của môn (đã tính sẵn trong code) */
      xepLoai: (() => {
        const b = a.subjectDetails?.[s.subject]?.bands;
        return b
          ? { gioi: b.gioi, kha: b.kha, trungBinh: b.tb, yeu: b.yeu, chuaCoBai: b.nodata }
          : null;
      })(),
    })),
    theoGiaoVien: (a.teachers || []).map((t) => ({
      ten: t.teacherName,
      mon: t.subject || '',
      vaiTro: t.isOwner ? 'chu-nhiem' : 'bo-mon',
      soDe: t.examCount,
      soLuotNop: t.submissions,
      tyLeThamGia: t.participation,
      diemTrungBinh: t.avgPct,
      deKhongCoBai: t.emptyExams,
      trangThai: t.status?.label || '',
    })),
    tienDo: timeline.map((b) => ({
      moc: b.label,
      soDe: b.exams,
      soLuotNop: b.submissions,
      diemTrungBinh: b.avgPct,
    })),
    phanBoDiem: distribution.map((d) => ({ muc: d.label, soBai: d.count, tyLe: d.share })),
    chuDe: topics.rows.slice(0, 20).map((t) => ({
      chuDe: t.topic,
      soLuot: t.attempts,
      tyLeDung: t.rate,
      soDe: t.examCount,
      coMetadata: t.tagged,
    })),
    tyLeGanChuDe: topics.coverage,
    hocSinh: students
      .slice()
      .sort((x, y) => (x.avgPct ?? 999) - (y.avgPct ?? 999))
      .slice(0, 25)
      .map((s) => ({
        ma: s.code,
        soBaiDaNop: s.submissions,
        soBaiDuocGiao: s.expected,
        soBaiThieu: s.missing,
        diemTrungBinh: s.avgPct,
        xuHuong: s.trend,
        chenhLech: s.delta,
      })),
    canhBaoDaTinh: warnings.slice(0, 15).map((w) => ({
      loai: w.kind,
      mucDo: w.priority,
      tieuDe: w.title,
      canCu: w.evidence,
    })),
    chatLuongDuLieu: {
      ghiChu: dataQuality.notes,
      tyLeGanChuDe: dataQuality.topicCoverage,
      duLieuDu: dataQuality.sufficient.ok,
      thieu: dataQuality.sufficient.missing,
    },
    chiTietMon: Object.values(subjectDetails || {})
      .filter((d) => d.exams.length || d.topics.length)
      .map((d) => ({
        mon: d.subject,
        de: d.exams.slice(0, 10).map((e) => ({
          ten: String(e.title).slice(0, 60),
          soBai: e.submissions,
          tyLeThamGia: e.participation,
          diemTrungBinh: e.avgPct,
        })),
        chuDeYeu: d.topics.filter((t) => t.rate !== null && t.rate < THRESHOLDS.weakTopicRate).slice(0, 6),
      })),
  };
}

/** Tập số liệu % hợp lệ để đối chiếu phát biểu của AI. */
export function numericCorpus(analytics) {
  const set = new Set();
  const add = (n) => { if (Number.isFinite(n)) set.add(Math.round(n)); };
  const o = analytics.overview || {};
  [o.completionRate, o.participationRate, o.avgPct, o.medianPct, o.passRate, o.spreadPct].forEach(add);
  (analytics.subjects || []).forEach((s) => [s.participation, s.avgPct, s.passRate].forEach(add));
  (analytics.teachers || []).forEach((t) => [t.participation, t.avgPct].forEach(add));
  (analytics.topics?.rows || []).forEach((t) => add(t.rate));
  (analytics.distribution || []).forEach((d) => add(d.share));
  (analytics.timeline || []).forEach((b) => add(b.avgPct));
  (analytics.students || []).forEach((s) => add(s.avgPct));
  (analytics.subjectDetails ? Object.values(analytics.subjectDetails) : []).forEach((d) => {
    (d.exams || []).forEach((e) => [e.participation, e.avgPct].forEach(add));
    (d.topics || []).forEach((t) => add(t.rate));
  });
  return set;
}

/* ============================================================
   2. PROMPT
   ============================================================ */

const SYSTEM = `Bạn là chuyên gia phân tích dữ liệu giáo dục của AITK, làm việc với giáo viên chủ nhiệm THPT Việt Nam.
Bạn CHỈ được diễn giải trên số liệu đã được tính sẵn trong dữ liệu JSON gửi kèm.
Tuyệt đối không tự tính lại, không bịa thêm số liệu, không suy ra nguyên nhân khi dữ liệu không chứng minh được.
Không đánh giá giáo viên tốt/kém dựa trên số lượng đề. Không gắn nhãn học sinh là yếu, lười hay kém năng lực.
Mọi nhận định phải phân biệt rõ: số liệu thực tế → nhận định của AI → đề xuất hành động.
Nếu dữ liệu mỏng (thiếu bài nộp, thiếu metadata chủ đề), phải nói rõ trong limitations thay vì kết luận.
Luôn trả về DUY NHẤT một đối tượng JSON hợp lệ, không markdown.`;

const OUTPUT_SPEC = `{
  "summary": "2–4 câu tóm tắt tình hình học tập dựa trên số liệu",
  "findings": [{"title":"phát hiện ngắn","detail":"giải thích dựa trên số liệu","evidence":"con số cụ thể lấy từ dữ liệu"}],
  "evidence": ["câu nêu số liệu và nguồn của nó (đề/bài nộp/môn)"],
  "risks": [{"title":"vấn đề cần chú ý","priority":"high|medium|low","detail":"vì sao cần chú ý"}],
  "recommendations": [{"action":"việc cần làm cụ thể, làm được ngay","target":"đối tượng áp dụng","timeframe":"thời điểm","basedOn":"căn cứ số liệu"}],
  "perSubject": [{"subject":"tên môn","summary":"nhận định riêng cho môn này","weakTopics":["chủ đề yếu 1"]}],
  "limitations": ["giới hạn của phân tích này"]
}`;

export function buildPrompt({ ctx, focusSubject = '' }) {
  const scope = focusSubject
    ? `Tập trung phân tích sâu môn: ${focusSubject}. Vẫn được dùng số liệu toàn lớp để so sánh.`
    : 'Phân tích toàn lớp, sau đó nêu riêng từng môn.';

  return `DỮ LIỆU ĐÃ TÍNH SẴN (JSON):
${JSON.stringify(ctx)}

NHIỆM VỤ: ${scope}

YÊU CẦU:
- Tối đa ${MAX.findings} phát hiện, ${MAX.risks} rủi ro, ${MAX.recommendations} đề xuất, ${MAX.limitations} giới hạn.
- Mỗi đề xuất phải gắn với một con số cụ thể trong dữ liệu (trường "basedOn") và phải khả thi với giáo viên.
- Chỉ dùng phần trăm xuất hiện trong dữ liệu; không tự tạo phần trăm mới.
- Nếu "chatLuongDuLieu.duLieuDu" là false, mở đầu summary bằng việc dữ liệu còn thiếu và nêu rõ cần bổ sung gì.
- Trả về đúng cấu trúc JSON:
${OUTPUT_SPEC}`;
}

/** JSON schema cho Gemini responseSchema (nếu backend hỗ trợ). */
export const REPORT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' }, evidence: { type: 'string' } },
        required: ['title'],
      },
    },
    evidence: { type: 'array', items: { type: 'string' } },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          priority: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['title'],
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          target: { type: 'string' },
          timeframe: { type: 'string' },
          basedOn: { type: 'string' },
        },
        required: ['action'],
      },
    },
    perSubject: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          summary: { type: 'string' },
          weakTopics: { type: 'array', items: { type: 'string' } },
        },
        required: ['subject'],
      },
    },
    limitations: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary'],
};

/* ============================================================
   3. KIỂM TRA & CHUẨN HOÁ KẾT QUẢ AI
   ============================================================ */

export class AiReportError extends Error {
  constructor(message, { code = 'invalid-response', raw } = {}) {
    super(message);
    this.name = 'AiReportError';
    this.code = code;
    this.raw = raw;
  }
}

const PRIORITIES = new Set(['high', 'medium', 'low']);

/**
 * validateReport(raw) → report chuẩn hoá.
 * Ném AiReportError nếu không có `summary` hoặc toàn bộ nội dung rỗng.
 */
export function validateReport(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiReportError('AI không trả về đối tượng JSON hợp lệ.', { code: 'not-object' });
  }

  const summary = clean(raw.summary ?? raw.tomTat ?? '', MAX.summary);
  if (!summary) {
    throw new AiReportError('AI trả về thiếu phần tóm tắt (summary).', { code: 'missing-summary' });
  }

  const findings = asArray(raw.findings).slice(0, MAX.findings).map((f, i) => {
    if (typeof f === 'string') return { title: clean(f) || `Phát hiện ${i + 1}`, detail: '', evidence: '' };
    return {
      title: clean(f?.title || f?.phatHien || f?.name) || `Phát hiện ${i + 1}`,
      detail: clean(f?.detail || f?.chiTiet || f?.description),
      evidence: clean(f?.evidence || f?.canCu || f?.data),
    };
  }).filter((f) => f.title);

  const evidence = asArray(raw.evidence).slice(0, MAX.evidence)
    .map((e) => (typeof e === 'string' ? clean(e) : clean(e?.text || e?.label || e?.detail)))
    .filter(Boolean);

  const risks = asArray(raw.risks).slice(0, MAX.risks).map((r, i) => {
    if (typeof r === 'string') return { title: clean(r) || `Rủi ro ${i + 1}`, priority: 'medium', detail: '' };
    const p = String(r?.priority || r?.mucDo || 'medium').toLowerCase();
    return {
      title: clean(r?.title || r?.name) || `Rủi ro ${i + 1}`,
      priority: PRIORITIES.has(p) ? p : 'medium',
      detail: clean(r?.detail || r?.why || r?.description),
    };
  }).filter((r) => r.title);

  const recommendations = asArray(raw.recommendations).slice(0, MAX.recommendations).map((x, i) => {
    if (typeof x === 'string') return { action: clean(x) || `Đề xuất ${i + 1}`, target: '', timeframe: '', basedOn: '' };
    return {
      action: clean(x?.action || x?.deXuat || x?.title) || `Đề xuất ${i + 1}`,
      target: clean(x?.target || x?.doiTuong, 160),
      timeframe: clean(x?.timeframe || x?.thoiDiem, 120),
      basedOn: clean(x?.basedOn || x?.canCu, 200),
    };
  }).filter((r) => r.action);

  const perSubject = asArray(raw.perSubject).slice(0, MAX.perSubject).map((s) => ({
    subject: clean(s?.subject || s?.mon, 80),
    summary: clean(s?.summary || s?.nhanDinh, 600),
    weakTopics: asArray(s?.weakTopics || s?.chuDeYeu).map((t) => clean(t, 120)).filter(Boolean).slice(0, 6),
  })).filter((s) => s.subject);

  const limitations = asArray(raw.limitations).slice(0, MAX.limitations)
    .map((l) => clean(l))
    .filter(Boolean);

  if (!findings.length && !recommendations.length && !evidence.length) {
    throw new AiReportError('AI trả về nội dung rỗng (không có phát hiện/đề xuất).', { code: 'empty-content' });
  }

  return { summary, findings, evidence, risks, recommendations, perSubject, limitations };
}

/* ============================================================
   4. KIỂM CHỨNG SỐ LIỆU AI NÊU
   ============================================================ */

/**
 * auditNumbers(report, corpus)
 * Tìm mọi phát biểu dạng "42%" trong báo cáo AI và đối chiếu với tập số liệu
 * đã tính. Cho phép lệch ±1 do làm tròn.
 * → { checked, unverified: [{value, text}] }
 */
export function auditNumbers(report, corpus) {
  const allowed = new Set([...(corpus || [])]);
  const texts = [
    report.summary,
    ...(report.findings || []).map((f) => `${f.title} ${f.detail} ${f.evidence}`),
    ...(report.evidence || []),
    ...(report.risks || []).map((r) => `${r.title} ${r.detail}`),
    ...(report.recommendations || []).map((r) => `${r.action} ${r.basedOn}`),
    ...(report.perSubject || []).map((s) => s.summary),
    ...(report.limitations || []),
  ];

  const unverified = [];
  let checked = 0;
  const seen = new Set();

  texts.forEach((text) => {
    const matches = String(text || '').match(/(\d{1,3}(?:[.,]\d+)?)\s*%/g) || [];
    matches.forEach((m) => {
      const num = Math.round(parseFloat(m.replace(',', '.')));
      if (!Number.isFinite(num)) return;
      checked += 1;
      const near = [num, num - 1, num + 1].some((n) => allowed.has(n));
      if (!near && !seen.has(m)) {
        seen.add(m);
        unverified.push({ value: m, text: clean(text, 200) });
      }
    });
  });

  return { checked, unverified };
}

/* ============================================================
   5. BÁO CÁO BẰNG LUẬT (không gọi AI)
   ============================================================ */

export function buildRuleBasedReport(analytics) {
  const o = analytics.overview || {};
  const dq = analytics.dataQuality || { sufficient: { ok: false, missing: [] }, notes: [] };
  const warnings = analytics.warnings || [];
  const subjects = analytics.subjects || [];
  const topTopics = (analytics.topics?.rows || []).filter((t) => t.rate !== null);

  const finds = [];
  if (o.avgPct !== null && o.avgPct !== undefined) {
    finds.push({
      title: `Điểm trung bình ${o.avgPct}% trên ${o.submissions} lượt làm bài`,
      detail: `Trung vị ${o.medianPct ?? '—'}% · tỷ lệ đạt ≥50% là ${o.passRate ?? '—'}%.`,
      evidence: `${o.scoredExams}/${o.exams} đề có kết quả · ${o.students} học sinh.`,
    });
  }
  const best = subjects.filter((s) => s.avgPct !== null).sort((a, b) => b.avgPct - a.avgPct)[0];
  const worst = subjects.filter((s) => s.avgPct !== null).sort((a, b) => a.avgPct - b.avgPct)[0];
  if (best && worst && best.subject !== worst.subject) {
    finds.push({
      title: `Chênh lệch giữa các môn: ${best.subject} ${best.avgPct}% – ${worst.subject} ${worst.avgPct}%`,
      detail: 'Chênh lệch lớn cho thấy dữ liệu kiểm tra chưa phân bổ đều giữa các môn.',
      evidence: `${subjects.length} môn có dữ liệu trong khoảng đang xem.`,
    });
  }
  const weakTopic = topTopics[0];
  if (weakTopic && weakTopic.rate < THRESHOLDS.weakTopicRate) {
    finds.push({
      title: `Chủ đề yếu nhất: ${weakTopic.topic} (${weakTopic.rate}% đúng)`,
      detail: `${weakTopic.correct}/${weakTopic.attempts} lượt trả lời đúng.`,
      evidence: `Trải trên ${weakTopic.examCount} đề.`,
    });
  }

  const recommendations = warnings.slice(0, 6).map((w) => ({
    action: w.action,
    target: w.kind.startsWith('student') ? 'Học sinh được nêu trong cảnh báo' : 'Toàn lớp',
    timeframe: w.priority === 'high' ? 'Trong tuần này' : 'Trong 2 tuần tới',
    basedOn: w.evidence,
  }));

  if (!recommendations.length && o.exams === 0) {
    recommendations.push({
      action: 'Giao ít nhất một đề ngắn 8–10 câu có gắn chủ đề cho lớp.',
      target: 'Giáo viên bộ môn',
      timeframe: 'Tuần này',
      basedOn: `0 đề trong khoảng ${analytics.meta?.rangeLabel || ''}.`,
    });
  }

  const limitations = [
    'Báo cáo này được tạo bằng luật thống kê (không gọi AI), nên không có phần diễn giải ngữ nghĩa.',
  ];
  if (!dq.sufficient?.ok) {
    limitations.push(`Dữ liệu chưa đủ để kết luận: ${(dq.sufficient?.missing || []).join('; ')}.`);
  }
  (dq.notes || []).forEach((n) => limitations.push(n));

  return {
    summary: o.submissions
      ? `Lớp ${analytics.meta?.className || ''} có ${o.exams} đề và ${o.submissions} lượt làm bài trong ${analytics.meta?.rangeLabel || 'khoảng đang xem'}; điểm trung bình ${o.avgPct ?? '—'}%, tỷ lệ hoàn thành ${o.completionRate ?? '—'}%.`
      : `Lớp ${analytics.meta?.className || ''} chưa có lượt làm bài nào trong ${analytics.meta?.rangeLabel || 'khoảng đang xem'}. Hãy giao đề để có dữ liệu phân tích.`,
    findings: finds,
    evidence: [
      `Nguồn: đề của lớp (${o.exams}), bài nộp (${o.submissions}), học sinh (${o.students}), giáo viên bộ môn (${o.teachers}).`,
      `Tỷ lệ hoàn thành = lượt nộp / (số đề × số học sinh) = ${o.submissions}/${o.expectedAttempts}.`,
    ],
    risks: warnings.slice(0, 6).map((w) => ({ title: w.title, priority: w.priority, detail: w.why })),
    recommendations,
    perSubject: subjects.map((s) => ({
      subject: s.subject,
      summary: s.submissions
        ? `${s.exams} đề · ${s.submissions}/${s.expected} lượt · TB ${s.avgPct ?? '—'}% · tham gia ${s.participation ?? '—'}%.`
        : `Chưa có dữ liệu bài nộp (${s.exams} đề).`,
      weakTopics: (analytics.subjectDetails?.[s.subject]?.topics || [])
        .filter((t) => t.rate !== null && t.rate < THRESHOLDS.weakTopicRate)
        .slice(0, 5)
        .map((t) => `${t.topic} (${t.rate}%)`),
    })),
    limitations,
  };
}

/** Gắn kết quả kiểm chứng số liệu vào báo cáo (dùng sau khi validateReport). */
export function applyNumberAudit(report, audit) {
  if (!audit || !audit.unverified?.length) return report;
  const note = `Một số con số AI nêu không khớp dữ liệu đã tính (${audit.unverified.map((u) => u.value).join(', ')}) — chỉ tin số liệu ở phần thống kê.`;
  return {
    ...report,
    limitations: [...(report.limitations || []), note].slice(0, MAX.limitations + 1),
  };
}

/** Hệ thống prompt (dùng cho lớp gọi AI). */
export { SYSTEM as ANALYTICS_SYSTEM_PROMPT, MAX as REPORT_LIMITS };

/** Thống kê nhanh cho phần "vì sao báo cáo cũ" (dùng ở UI). */
export function reportStaleness(report, analytics) {
  if (!report) return { stale: true, reason: 'Chưa có báo cáo' };
  const saved = report.dataFingerprint || report.fingerprint || '';
  const current = analytics?.meta?.fingerprint || '';
  if (!saved) return { stale: true, reason: 'Báo cáo không có dấu vân tay dữ liệu' };
  if (saved !== current) {
    return { stale: true, reason: 'Dữ liệu lớp đã thay đổi sau khi tạo báo cáo' };
  }
  return { stale: false, reason: '' };
}

export const __test__ = { clean, asArray, mean };
