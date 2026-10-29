/* ============================================================
   aspirationService.js — GIAI ĐOẠN 1: MÔ HÌNH DỮ LIỆU & SERVICE
   ------------------------------------------------------------
   Quản lý các thực thể chuẩn:
     • Exam (kỳ thi): THPTQG, HSA, TSA, V-ACT, SPT, H-SCA
     • School (trường ĐH/Học viện): id, name, code, cover...
     • Major (ngành học): id, schoolId, name, majorCode, blocks, cutoffs, note
     • Aspiration (nguyện vọng): id, userId, examId, schoolId, majorId, priority (1..3), targetScore, targetChemScore
     • Progress (tiến độ): predictedScore, targetScore, scoreGap, status, elo, eloHistory
   Sử dụng lớp trừu tượng StorageAdapter (mặc định localStorage + CustomEvent)
   để dễ dàng chuyển sang REST/Firestore/Supabase API khi cần.
   ============================================================ */

import referenceData from '../data/admissionsReference.json';

const STORAGE_PREFIX = 'elec-aspirations-v2:';
const CHANGE_EVENT = 'elec-aspirations-change';
export const ASPIRATION_CHANGE_EVENT = CHANGE_EVENT;
const MAX_ASPIRATIONS = 3;
const DAY_MS = 86400000;

/* ---------- Chuẩn hóa chuỗi tìm kiếm tiếng Việt không dấu ---------- */
export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/* ============================================================
   1. TRUY XUẤT DỮ LIỆU THAM KHẢO (EXAM, SCHOOL, MAJOR)
   ============================================================ */

export function getReferenceMetadata() {
  return {
    nam: referenceData.nam,
    nguon: referenceData.nguon,
    nhanHienThi: referenceData.nhanHienThi || `Dữ liệu tham khảo năm ${referenceData.nam}`,
  };
}

export function getExams() {
  return referenceData.exams || [];
}

export function getExamById(examId = 'THPTQG') {
  const exams = getExams();
  return exams.find((e) => e.id === examId) || exams[0];
}

export function getSchools() {
  return referenceData.schools || [];
}

export function getSchoolById(schoolId) {
  if (!schoolId) return null;
  const key = String(schoolId).trim().toUpperCase();
  const all = getSchools();
  return all.find((s) =>
    String(s.id || '').toUpperCase() === key
    || String(s.code || '').toUpperCase() === key
    || String(s.admissionCode || '').toUpperCase() === key
    || String(s.altCode || '').toUpperCase() === key
  ) || null;
}

export function searchSchools(query = '') {
  const q = normalizeText(query);
  const all = getSchools();
  if (!q) return all;
  return all.filter(
    (s) => normalizeText(s.name).includes(q)
      || normalizeText(s.code).includes(q)
      || normalizeText(s.city).includes(q),
  );
}

export function getMajorsBySchool(schoolId, query = '') {
  const all = (referenceData.majors || []).filter((m) => m.schoolId === schoolId);
  const q = normalizeText(query);
  if (!q) return all;
  return all.filter(
    (m) => normalizeText(m.name).includes(q)
      || normalizeText(m.majorCode).includes(q)
      || normalizeText(m.note).includes(q)
      || (m.blocks || []).some((b) => normalizeText(b).includes(q)),
  );
}

export function getMajorById(majorId) {
  if (!majorId) return null;
  const key = String(majorId).trim().toLowerCase();
  const all = referenceData.majors || [];
  return all.find((m) =>
    String(m.id || '').toLowerCase() === key
    || String(m.majorCode || '').toLowerCase() === key
  ) || null;
}

/**
 * Lấy điểm chuẩn gần nhất của một ngành theo kỳ thi (hoặc quy đổi tương đương nếu ngành chỉ công bố điểm THPTQG)
 */
export function getCutoffForMajor(majorOrId, examId = 'THPTQG') {
  const major = typeof majorOrId === 'string' ? getMajorById(majorOrId) : majorOrId;
  const meta = getReferenceMetadata();
  if (!major || !Array.isArray(major.cutoffs) || major.cutoffs.length === 0) {
    return { score: null, year: meta.nam, examId, isConverted: false, label: meta.nhanHienThi };
  }
  const direct = major.cutoffs.find((c) => c.examId === examId);
  if (direct) {
    return {
      score: direct.score,
      year: direct.year || meta.nam,
      examId: direct.examId,
      isConverted: false,
      label: `Dữ liệu tham khảo năm ${direct.year || meta.nam}`,
    };
  }
  const baseThpt = major.cutoffs.find((c) => c.examId === 'THPTQG') || major.cutoffs[0];
  const exam = getExamById(examId);
  if (baseThpt && Number.isFinite(baseThpt.score) && exam) {
    const ratio = baseThpt.score / 30;
    const raw = ratio * exam.scale;
    const step = exam.step || 0.25;
    const converted = Math.round(raw / step) * step;
    return {
      score: Number(converted.toFixed(2)),
      year: baseThpt.year || meta.nam,
      examId,
      isConverted: true,
      baseScore: baseThpt.score,
      label: `Quy đổi tham khảo từ chuẩn THPTQG năm ${baseThpt.year || meta.nam}`,
    };
  }
  return { score: null, year: meta.nam, examId, isConverted: false, label: meta.nhanHienThi };
}

/**
 * Đề xuất điểm mục tiêu = Điểm chuẩn gần nhất + biên an toàn (cho phép chỉnh tay bằng slider)
 */
export function suggestTargetScore(majorOrId, examId = 'THPTQG') {
  const exam = getExamById(examId);
  const cutoff = getCutoffForMajor(majorOrId, examId);
  const scale = exam?.scale || 30;
  const step = exam?.step || 0.25;
  const safetyMargin = exam?.safetyMargin ?? (scale === 30 ? 0.5 : scale * 0.03);

  const baseScore = Number.isFinite(cutoff.score) ? cutoff.score : (exam?.defaultTarget || scale * 0.8);
  const rawSuggested = Math.min(scale, baseScore + safetyMargin);
  const suggestedTarget = Number((Math.round(rawSuggested / step) * step).toFixed(2));

  // Điểm mục tiêu môn Hóa (thang 10) tương ứng
  const targetRatio = suggestedTarget / scale;
  const rawChem = Math.min(10, Math.max(5, targetRatio * 10 + 0.25));
  const targetChemScore = Number((Math.round(rawChem * 4) / 4).toFixed(2));

  const minScore = scale === 30 ? 15 : scale === 10 ? 5 : Math.round(scale * 0.4);

  return {
    examId: exam.id,
    scale,
    step,
    min: minScore,
    max: scale,
    cutoffScore: cutoff.score,
    cutoffYear: cutoff.year,
    isConvertedCutoff: cutoff.isConverted,
    referenceLabel: cutoff.label,
    safetyMargin,
    suggestedTarget,
    targetChemScore,
  };
}

/* ============================================================
   2. LỚP TRỪU TƯỢNG LƯU TRỮ (STORAGE ADAPTER) & QUẢN LÝ NGUYỆN VỌNG
   ============================================================ */

let customAdapter = null;

/**
 * Cho phép gắn adapter lưu trữ khác (VD: REST API / Firestore) trong tương lai mà không đổi code UI
 */
export function setAspirationStorageAdapter(adapter) {
  customAdapter = adapter;
}

function storageKey(uid) {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

function readRawState(uid) {
  const key = storageKey(uid);
  try {
    if (customAdapter?.getItem) {
      const val = customAdapter.getItem(key);
      return val ? JSON.parse(val) : null;
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRawState(uid, state) {
  const key = storageKey(uid);
  let ok = false;
  try {
    const serialized = JSON.stringify(state);
    if (customAdapter?.setItem) {
      customAdapter.setItem(key, serialized);
    } else {
      localStorage.setItem(key, serialized);
    }
    ok = true;
  } catch (e) {
    console.warn('[aspirationService] Không ghi được dữ liệu:', e);
  }
  if (ok && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { uid, state } }));
      // Giữ event cũ để các component cũ vẫn tự đồng bộ
      window.dispatchEvent(new Event('cs-aspirations'));
    } catch { /* môi trường test */ }
  }
  return state;
}

export function createDefaultUserState(uid = 'guest') {
  return {
    userId: uid || 'guest',
    selectedExamId: 'THPTQG',
    activeAspirationId: null,
    onboardingCompleted: false,
    weeklyFreeHours: 6,
    examDate: '2026-06-26',
    aspirations: [],
    updatedAt: 0,
  };
}

/**
 * Làm giàu Aspiration với thông tin School, Major, Cutoff để UI dùng trực tiếp
 */
export function hydrateAspiration(asp) {
  if (!asp) return null;
  const school = getSchoolById(asp.schoolId) || {
    id: asp.schoolId || 'CUSTOM',
    code: asp.schoolCode || asp.schoolId || 'ĐH',
    name: asp.schoolName || 'Trường Đại học',
    city: asp.city || 'Toàn quốc',
    coverColor: '#2f6bff',
    cover: 'linear-gradient(135deg, #2f6bff 0%, #60a5fa 100%)',
  };
  const major = getMajorById(asp.majorId) || {
    id: asp.majorId || 'custom-major',
    schoolId: school.id,
    name: asp.majorName || 'Ngành xét tuyển',
    majorCode: asp.majorCode || '',
    blocks: asp.blocks || [asp.block || 'A00'],
    note: asp.note || '',
    cutoffs: Number.isFinite(asp.cutoffScore)
      ? [{ year: referenceData.nam, examId: asp.examId || 'THPTQG', score: asp.cutoffScore }]
      : [],
  };
  const exam = getExamById(asp.examId || 'THPTQG');
  const cutoff = getCutoffForMajor(major, exam.id);
  const suggestion = suggestTargetScore(major, exam.id);

  const targetScore = Number.isFinite(Number(asp.targetScore))
    ? Number(asp.targetScore)
    : suggestion.suggestedTarget;

  const targetChemScore = Number.isFinite(Number(asp.targetChemScore))
    ? Number(asp.targetChemScore)
    : Number(Math.min(10, Math.max(5, Math.round(((targetScore / exam.scale) * 10) * 4) / 4)).toFixed(2));

  return {
    ...asp,
    examId: exam.id,
    exam,
    school,
    major,
    block: asp.block || major.blocks?.[0] || 'A00',
    cutoffScore: cutoff.score,
    cutoffYear: cutoff.year,
    referenceLabel: cutoff.label,
    targetScore,
    targetChemScore,
  };
}

export function getUserAspirationsState(uid) {
  const base = createDefaultUserState(uid);
  const raw = readRawState(uid);
  if (!raw || typeof raw !== 'object') return base;

  const rawList = Array.isArray(raw.aspirations) ? raw.aspirations : [];
  const sorted = rawList
    .slice(0, MAX_ASPIRATIONS)
    .map((item, idx) => hydrateAspiration({ ...item, priority: idx + 1 }))
    .filter(Boolean);

  const activeId = sorted.some((a) => a.id === raw.activeAspirationId)
    ? raw.activeAspirationId
    : (sorted[0]?.id || null);

  return {
    ...base,
    ...raw,
    userId: uid || 'guest',
    selectedExamId: getExamById(raw.selectedExamId || 'THPTQG').id,
    activeAspirationId: activeId,
    aspirations: sorted,
    activeAspiration: sorted.find((a) => a.id === activeId) || sorted[0] || null,
  };
}

/**
 * Thêm mới hoặc cập nhật một nguyện vọng (tối đa 3 nguyện vọng ưu tiên 1..3)
 */
export function upsertAspiration(uid, payload = {}) {
  const cur = getUserAspirationsState(uid);
  const examId = payload.examId || cur.selectedExamId || 'THPTQG';
  const school = getSchoolById(payload.schoolId);
  const major = getMajorById(payload.majorId);

  const id = payload.id || `${school?.id || payload.schoolId || 'sch'}-${major?.id || payload.majorId || Date.now()}`;
  const suggestion = suggestTargetScore(major || payload, examId);

  const targetScore = Number.isFinite(Number(payload.targetScore))
    ? Number(payload.targetScore)
    : suggestion.suggestedTarget;

  const exam = getExamById(examId);
  const targetChemScore = Number.isFinite(Number(payload.targetChemScore))
    ? Number(payload.targetChemScore)
    : Number(Math.min(10, Math.max(5, Math.round(((targetScore / exam.scale) * 10) * 4) / 4)).toFixed(2));

  const existingIdx = cur.aspirations.findIndex(
    (a) => a.id === id || (a.schoolId === payload.schoolId && a.majorId === payload.majorId),
  );

  const record = {
    id,
    userId: uid || 'guest',
    examId,
    schoolId: school?.id || payload.schoolId,
    schoolCode: school?.code || payload.schoolCode,
    schoolName: school?.name || payload.schoolName,
    majorId: major?.id || payload.majorId,
    majorName: major?.name || payload.majorName,
    majorCode: major?.majorCode || payload.majorCode,
    block: payload.block || major?.blocks?.[0] || 'A00',
    targetScore,
    targetChemScore,
    createdAt: existingIdx >= 0 ? cur.aspirations[existingIdx].createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  let nextList = cur.aspirations.map((a) => ({
    id: a.id,
    userId: a.userId,
    examId: a.examId,
    schoolId: a.schoolId,
    schoolCode: a.school?.code,
    schoolName: a.school?.name,
    majorId: a.majorId,
    majorName: a.major?.name,
    majorCode: a.major?.majorCode,
    block: a.block,
    targetScore: a.targetScore,
    targetChemScore: a.targetChemScore,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  if (existingIdx >= 0) {
    nextList[existingIdx] = { ...nextList[existingIdx], ...record };
  } else {
    if (nextList.length >= MAX_ASPIRATIONS) {
      return cur; // Đã đủ 3/3 nguyện vọng
    }
    nextList.push(record);
  }

  nextList = nextList.slice(0, MAX_ASPIRATIONS).map((item, idx) => ({
    ...item,
    priority: idx + 1,
  }));

  const nextState = {
    ...cur,
    selectedExamId: examId,
    activeAspirationId: payload.setActive !== false ? record.id : (cur.activeAspirationId || record.id),
    onboardingCompleted: true,
    aspirations: nextList,
    updatedAt: Date.now(),
  };

  writeRawState(uid, nextState);
  return getUserAspirationsState(uid);
}

/**
 * Xóa một nguyện vọng và tự động đánh số lại thứ tự ưu tiên 1..3
 */
export function deleteAspiration(uid, aspirationId) {
  const cur = getUserAspirationsState(uid);
  const filtered = cur.aspirations
    .filter((a) => a.id !== aspirationId)
    .map((a, idx) => ({
      id: a.id,
      userId: a.userId,
      examId: a.examId,
      schoolId: a.schoolId,
      schoolCode: a.school?.code,
      schoolName: a.school?.name,
      majorId: a.majorId,
      majorName: a.major?.name,
      majorCode: a.major?.majorCode,
      block: a.block,
      targetScore: a.targetScore,
      targetChemScore: a.targetChemScore,
      priority: idx + 1,
      createdAt: a.createdAt,
      updatedAt: Date.now(),
    }));

  const nextActive = filtered.some((a) => a.id === cur.activeAspirationId)
    ? cur.activeAspirationId
    : (filtered[0]?.id || null);

  writeRawState(uid, {
    ...cur,
    activeAspirationId: nextActive,
    aspirations: filtered,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

/**
 * Sắp xếp lại thứ tự ưu tiên nguyện vọng 1..3 (phục vụ kéo-thả hoặc nút đẩy lên NV1)
 */
export function reorderAspirations(uid, orderedIds = []) {
  const cur = getUserAspirationsState(uid);
  const map = new Map(cur.aspirations.map((a) => [a.id, a]));
  const reordered = [];

  orderedIds.forEach((id) => {
    if (map.has(id)) {
      reordered.push(map.get(id));
      map.delete(id);
    }
  });
  map.forEach((a) => reordered.push(a));

  const serialized = reordered.slice(0, MAX_ASPIRATIONS).map((a, idx) => ({
    id: a.id,
    userId: a.userId,
    examId: a.examId,
    schoolId: a.schoolId,
    schoolCode: a.school?.code,
    schoolName: a.school?.name,
    majorId: a.majorId,
    majorName: a.major?.name,
    majorCode: a.major?.majorCode,
    block: a.block,
    targetScore: a.targetScore,
    targetChemScore: a.targetChemScore,
    priority: idx + 1,
    createdAt: a.createdAt,
    updatedAt: Date.now(),
  }));

  writeRawState(uid, {
    ...cur,
    activeAspirationId: serialized[0]?.id || cur.activeAspirationId,
    aspirations: serialized,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function setActiveAspiration(uid, aspirationId) {
  const cur = getUserAspirationsState(uid);
  const hit = cur.aspirations.find((a) => a.id === aspirationId);
  if (!hit) return cur;
  writeRawState(uid, {
    ...cur,
    activeAspirationId: hit.id,
    selectedExamId: hit.examId || cur.selectedExamId,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function setSelectedExam(uid, examId, customTargetScore = null) {
  const cur = getUserAspirationsState(uid);
  const exam = getExamById(examId);
  const updatedAspirations = cur.aspirations.map((a, idx) => {
    const suggestion = suggestTargetScore(a.major, exam.id);
    const nextTarget = (customTargetScore !== null && a.id === cur.activeAspirationId)
      ? Number(customTargetScore)
      : (a.examId === exam.id ? a.targetScore : suggestion.suggestedTarget);
    return {
      id: a.id,
      userId: a.userId,
      examId: exam.id,
      schoolId: a.schoolId,
      schoolCode: a.school?.code,
      schoolName: a.school?.name,
      majorId: a.majorId,
      majorName: a.major?.name,
      majorCode: a.major?.majorCode,
      block: a.block,
      targetScore: nextTarget,
      targetChemScore: suggestion.targetChemScore,
      priority: idx + 1,
      createdAt: a.createdAt,
      updatedAt: Date.now(),
    };
  });

  writeRawState(uid, {
    ...cur,
    selectedExamId: exam.id,
    aspirations: updatedAspirations,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function updateUserSettings(uid, partial = {}) {
  const cur = getUserAspirationsState(uid);
  const rawAspirations = cur.aspirations.map((a, idx) => ({
    id: a.id,
    userId: a.userId,
    examId: a.examId,
    schoolId: a.schoolId,
    schoolCode: a.school?.code,
    schoolName: a.school?.name,
    majorId: a.majorId,
    majorName: a.major?.name,
    majorCode: a.major?.majorCode,
    block: a.block,
    targetScore: a.targetScore,
    targetChemScore: a.targetChemScore,
    priority: idx + 1,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  writeRawState(uid, {
    ...cur,
    ...partial,
    aspirations: rawAspirations,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function subscribeAspirationChanges(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/* ============================================================
   3. MÔ HÌNH PROGRESS (ĐIỂM DỰ ĐOÁN, TRẠNG THÁI, LỊCH SỬ ELO THEO NGÀY)
   ============================================================ */

function isoDay(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Xây dựng lịch sử Elo & Điểm dự đoán theo ngày từ chuỗi sự kiện làm bài thực tế
 */
export function buildDailyEloHistory(events = [], { scale = 30, targetScore = 25.5, days = 14, now = Date.now() } = {}) {
  const validEvents = (events || [])
    .filter((e) => e && Number.isFinite(e.at))
    .sort((a, b) => a.at - b.at);

  const byDate = new Map();
  validEvents.forEach((e) => {
    const k = isoDay(e.at);
    const cur = byDate.get(k) || { total: 0, correct: 0 };
    cur.total += 1;
    if (e.ok || e.correct) cur.correct += 1;
    byDate.set(k, cur);
  });

  const history = [];
  let runningTotal = 0;
  let runningCorrect = 0;
  let currentElo = 1000;

  // Tính lũy kế trước cửa sổ `days` ngày
  const startWindowTs = now - (days - 1) * DAY_MS;
  const startWindowKey = isoDay(startWindowTs);

  byDate.forEach((val, dateKey) => {
    if (dateKey < startWindowKey) {
      runningTotal += val.total;
      runningCorrect += val.correct;
      const acc = runningCorrect / Math.max(1, runningTotal);
      currentElo = Math.round(1000 + acc * 800 + Math.min(80, Math.sqrt(runningTotal) * 4));
    }
  });

  const baselineScore = runningTotal > 0
    ? (runningCorrect / runningTotal) * scale
    : scale * 0.55;

  for (let i = 0; i < days; i += 1) {
    const dayTs = startWindowTs + i * DAY_MS;
    const dateKey = isoDay(dayTs);
    const bucket = byDate.get(dateKey);

    if (bucket) {
      runningTotal += bucket.total;
      runningCorrect += bucket.correct;
      const acc = runningCorrect / Math.max(1, runningTotal);
      currentElo = Math.round(1000 + acc * 800 + Math.min(80, Math.sqrt(runningTotal) * 4));
    }

    const predictedScore = runningTotal > 0
      ? Number(((runningCorrect / runningTotal) * scale).toFixed(2))
      : null;

    // Đường lý tưởng tăng tuyến tính từ điểm xuất phát tới điểm mục tiêu
    const progressRatio = (i + 1) / days;
    const idealScore = Number((baselineScore + (targetScore - baselineScore) * progressRatio).toFixed(2));

    history.push({
      date: dateKey,
      label: dateKey.slice(8, 10) + '/' + dateKey.slice(5, 7),
      elo: runningTotal > 0 ? currentElo : null,
      predictedScore,
      idealScore,
      answersCount: bucket ? bucket.total : 0,
    });
  }

  return history;
}

/**
 * Tính toán thực thể Progress chuẩn Giai đoạn 1:
 *   - predictedScore (điểm dự đoán theo thang kỳ thi đang chọn)
 *   - targetScore (điểm mục tiêu của nguyện vọng đang chọn)
 *   - scoreGap (chênh lệch điểm)
 *   - status ('Vượt tiến độ' | 'Đúng tiến độ' | 'Cần tăng tốc' | 'Chưa có dữ liệu')
 *   - elo & eloHistory (lịch sử Elo theo ngày)
 */
export function computeStudentProgress(uidOrOptions, options = {}) {
  let uid, overview, events, now;
  if (typeof uidOrOptions === 'object' && uidOrOptions !== null) {
    uid = uidOrOptions.uid;
    overview = uidOrOptions.overview || {};
    events = uidOrOptions.events || [];
    now = uidOrOptions.now || Date.now();
  } else {
    uid = uidOrOptions;
    overview = options.overview || {};
    events = options.events || [];
    now = options.now || Date.now();
  }

  const userState = getUserAspirationsState(uid);
  const active = userState.activeAspiration;
  const exam = getExamById(active?.examId || userState.selectedExamId || 'THPTQG');
  const scale = exam?.scale || 30;
  const step = exam?.step || 0.25;

  const targetScore = active?.targetScore ?? exam?.defaultTarget ?? (scale * 0.8);
  const targetChemScore = active?.targetChemScore ?? 8.5;

  const rawMastery = overview?.avgMastery ?? overview?.accuracy ?? (overview?.hasEvidence ? 55 : null);
  const validMastery = rawMastery !== null && rawMastery !== undefined && Number.isFinite(Number(rawMastery))
    ? Number(rawMastery)
    : null;
  const hasEvidence = Boolean(overview?.hasEvidence && validMastery !== null);
  const masteryRatio = hasEvidence ? (validMastery / 100) : null;

  const predictedChemScore = masteryRatio !== null
    ? Number((Math.round(masteryRatio * 10 * 4) / 4).toFixed(2))
    : null;

  const rawPredicted = masteryRatio !== null ? masteryRatio * scale : null;
  const predictedScore = rawPredicted !== null
    ? Number((Math.round(rawPredicted / step) * step).toFixed(2))
    : null;

  // Chênh lệch giữa điểm dự đoán và điểm mục tiêu (dương = vượt, âm = còn thiếu)
  const scoreDiff = predictedScore !== null
    ? Number((predictedScore - targetScore).toFixed(2))
    : null;

  // Khoảng cách cần bù đắp (target - predicted)
  const scoreGap = predictedScore !== null
    ? Number((targetScore - predictedScore).toFixed(2))
    : null;

  // Ngưỡng 1 điểm trên thang 30 (tương đương 3.33% thang điểm bất kỳ)
  const threshold = scale === 30 ? 1.0 : Number((scale / 30).toFixed(2));

  let status = 'Chưa có dữ liệu';
  let statusTone = 'muted';
  if (predictedScore !== null) {
    if (scoreGap <= -threshold * 0.5) {
      status = 'Vượt tiến độ';
      statusTone = 'ok';
    } else if (scoreGap >= threshold) {
      status = 'Cần tăng tốc';
      statusTone = 'warn';
    } else {
      status = 'Đúng tiến độ';
      statusTone = 'info';
    }
  }

  const totalAnswers = overview?.totalAnswers || (events || []).length || 0;
  const elo = hasEvidence
    ? Math.round(1000 + (overview.avgMastery * 8) + Math.min(80, Math.sqrt(totalAnswers) * 4))
    : null;

  const eloHistory = buildDailyEloHistory(events, {
    scale,
    targetScore,
    days: 14,
    now,
  });

  return {
    exam,
    activeAspiration: active,
    aspirations: userState.aspirations,
    predictedScore,
    predictedChemScore,
    targetScore,
    targetChemScore,
    scoreDiff,
    scoreGap,
    status,
    statusTone,
    elo,
    eloHistory,
    hasEvidence,
    referenceMeta: getReferenceMetadata(),
  };
}

export const getAspirationProfile = getUserAspirationsState;

export function recordAttemptScore(uid, score) {
  const cur = getUserAspirationsState(uid);
  const next = {
    ...cur,
    lastAttemptScore: score,
    updatedAt: Date.now(),
  };
  return writeRawState(uid, next);
}

/**
 * Lấy Đề án tuyển sinh chi tiết của một trường Đại học (hỗ trợ cả 10 trường trọng điểm và 95+ trường sơ bộ)
 */
export function getDetailedAdmissionScheme(schoolIdOrCode) {
  if (!schoolIdOrCode) return null;
  const key = String(schoolIdOrCode).trim().toUpperCase();
  const schemes = referenceData.detailedSchemes || {};
  
  // 1. Kiểm tra nếu có đề án chi tiết sẵn
  if (schemes[key]) return schemes[key];
  
  // Tìm theo school
  const school = getSchools().find((s) => s.id === key || s.code === key || s.admissionCode === key || s.altCode === key);
  if (!school) return null;
  
  if (schemes[school.id]) return schemes[school.id];
  if (schemes[school.code]) return schemes[school.code];
  if (school.admissionCode && schemes[school.admissionCode]) return schemes[school.admissionCode];

  // 2. Tạo đề án sơ bộ chuẩn hóa cho trường
  return {
    schoolId: school.id,
    schoolName: school.name,
    admissionCode: school.admissionCode || school.code,
    yearPlan: school.yearPlan || 2026,
    totalMajors: school.totalMajors || 30,
    creditsPerYear: school.creditsPerYear || 33,
    cutoffRange: school.cutoffRange || '18.00 – 26.00',
    cover: school.cover || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    website: school.website || 'https://moet.gov.vn',
    sections: [
      { id: 'overview-quick', title: 'Tổng quan nhanh' },
      { id: 'intro-history', title: 'Giới thiệu và lịch sử' },
      { id: 'admissions-2026', title: 'Ngành tuyển sinh 2026' },
      { id: 'major-training', title: 'Ngành đào tạo' },
      { id: 'student-notes', title: 'Lưu ý học sinh' },
      { id: 'tuition-fees', title: 'Chi phí và học phí' },
    ],
    stats: [
      { label: 'Năm đề án', value: String(school.yearPlan || 2026) },
      { label: 'Ngành đào tạo', value: String(school.totalMajors || 30) },
      { label: 'Tín chỉ/năm', value: String(school.creditsPerYear || 33) },
      { label: 'Điểm 2025 THPT', value: school.cutoffRange || '18.00 – 26.00' },
    ],
    bannerNotice: `Điểm chuẩn trúng tuyển dao động trong khoảng ${school.cutoffRange || '18.00 – 26.00'} điểm.`,
    virtualExamCta: 'Thi thử tại Phòng thi ảo →',
    intro: school.admissionNote || `${school.name} (${school.city}) — trường đại học ${school.type || 'công lập'} uy tín thuộc nhóm ngành ${school.group || 'Đa ngành'}.`,
    methods: [
      {
        code: 'PT1',
        name: 'Xét tuyển theo kết quả thi tốt nghiệp THPT 2026',
        quotaPercent: '50% – 60%',
        desc: 'Xét tuyển theo các tổ hợp truyền thống A00, A01, B00, C00, D01, D07 tùy ngành.',
      },
      {
        code: 'PT2',
        name: 'Xét tuyển theo điểm thi Đánh giá năng lực (HSA / V-ACT / TSA)',
        quotaPercent: '20% – 30%',
        desc: 'Sử dụng điểm thi ĐGNL của ĐHQGHN, ĐHQG TP.HCM hoặc ĐH Bách Khoa Hà Nội.',
      },
      {
        code: 'PT3',
        name: 'Xét tuyển học bạ THPT & Chứng chỉ ngoại ngữ',
        quotaPercent: '15% – 20%',
        desc: 'Kết hợp kết quả học tập THPT 3 năm với chứng chỉ IELTS/TOEFL hoặc giải HSG cấp tỉnh.',
      },
      {
        code: 'PT4',
        name: 'Xét tuyển thẳng theo quy chế Bộ GD&ĐT',
        quotaPercent: '2% – 5%',
        desc: 'Thí sinh đạt giải Nhất, Nhì, Ba HSG Quốc gia, KHKT Quốc gia.',
      },
    ],
    tuition: {
      standard: 'Khoảng 15 – 25 triệu đồng/năm học (áp dụng theo quy định Nhà nước đối với trường công lập)',
      advanced: 'Khoảng 35 – 50 triệu đồng/năm học đối với chương trình chất lượng cao/liên kết',
      scholarships: 'Nhiều suất học bổng khuyến khích học tập cho tân sinh viên thủ khoa, á khoa và sinh viên có hoàn cảnh khó khăn.',
    },
    contact: {
      address: school.city + ', Việt Nam',
      hotline: 'Tuyển sinh trực tuyến',
      email: 'tuyensinh@' + (school.website ? school.website.replace(/^https?:\/\//, '') : 'edu.vn'),
    },
  };
}

/**
 * Lọc danh sách trường Đại học theo Miền, Nhóm ngành và Từ khóa
 */
export function filterSchoolsAdvanced({ region = 'all', group = 'all', query = '' } = {}) {
  const all = getSchools();
  const q = normalizeText(query);
  return all.filter((s) => {
    if (region !== 'all' && s.region !== region) return false;
    if (group !== 'all' && s.group !== group) return false;
    if (q) {
      const match = normalizeText(s.name).includes(q)
        || normalizeText(s.code).includes(q)
        || normalizeText(s.admissionCode).includes(q)
        || normalizeText(s.city).includes(q)
        || normalizeText(s.shortName).includes(q);
      if (!match) return false;
    }
    return true;
  });
}
