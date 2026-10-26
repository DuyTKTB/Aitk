/* ============================================================
   analyticsReports.js — LƯU & ĐỌC BÁO CÁO AI THEO LỚP
   ------------------------------------------------------------
   Mô hình dữ liệu (mới, không đụng collection cũ):

     class_analytics_reports/{classId}__{rangeKey}[__custom_from_to][__subject]
        classId, rangeKey, rangeLabel, from, to, focusSubject,
        dataFingerprint, engine, schemaVersion, version,
        report: { summary, findings, evidence, risks, recommendations,
                  perSubject, limitations },
        metrics: ảnh chụp nhanh các con số đã dùng để tạo báo cáo,
        generatedAt, generatedAtMs, createdBy, createdByName

     class_analytics_reports/{docId}__v{n}
        Bản lưu từng lần tạo (cùng collection, có `versionsOf`) → báo
        cáo cũ vẫn tra cứu được và phân biệt rõ với báo cáo hiện tại.

   DocId xác định (không cần composite index): mỗi (lớp, khoảng thời
   gian, môn trọng tâm) có 1 doc "mới nhất" + các doc phiên bản.
   Mọi doc đều mang `classId` để Firestore Rules giới hạn theo chủ lớp.
   ============================================================ */

import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp, query, where,
} from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'class_analytics_reports';

const safe = (s) => String(s || '').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 60);

/** Doc id ổn định cho (lớp, khoảng thời gian, môn trọng tâm). */
export function reportDocId(classId, range = {}, focusSubject = '') {
  const parts = [safe(classId) || 'class', safe(range.key || 'all') || 'all'];
  if (range.key === 'custom') {
    parts.push(String(range.from || 0), String(range.to || 0));
  }
  const subj = safe(focusSubject);
  if (subj) parts.push(subj);
  return parts.join('__');
}

/** Ảnh chụp các con số then chốt — để đối chiếu báo cáo với dữ liệu lúc tạo. */
export function metricsSnapshot(analytics) {
  const o = analytics?.overview || {};
  return {
    students: o.students ?? 0,
    teachers: o.teachers ?? 0,
    exams: o.exams ?? 0,
    submissions: o.submissions ?? 0,
    completionRate: o.completionRate,
    participationRate: o.participationRate,
    avgPct: o.avgPct,
    passRate: o.passRate,
    warnings: (analytics?.warnings || []).length,
    dataSufficient: Boolean(analytics?.dataQuality?.sufficient?.ok),
  };
}

/**
 * Lưu báo cáo (ghi đè bản "mới nhất" + lưu 1 bản vào versions).
 * Trả về { id, version }.
 */
export async function saveAnalyticsReport({
  classId, range = {}, focusSubject = '', result, analytics,
  userId = '', userName = '',
}) {
  if (!classId) throw new Error('Thiếu mã lớp.');
  if (!result?.report) throw new Error('Không có nội dung báo cáo để lưu.');

  const id = reportDocId(classId, range, focusSubject);
  const ref = doc(db, COL, id);

  let version = 1;
  try {
    const prev = await getDoc(ref);
    if (prev.exists()) version = (Number(prev.data()?.version) || 0) + 1;
  } catch (e) {
    console.warn('[analyticsReports] không đọc được bản cũ:', e?.code || e?.message);
  }

  const stamp = Date.now();

  const base = {
    classId,
    rangeKey: range.key || 'all',
    rangeLabel: range.label || '',
    from: range.from || null,
    to: range.to || null,
    focusSubject: focusSubject || '',
    dataFingerprint: analytics?.meta?.fingerprint || '',
    engine: result.engine || 'rule',
    schemaVersion: result.meta?.schemaVersion || 1,
    version,
    versionsOf: id,
    report: result.report,
    metrics: metricsSnapshot(analytics),
    aiError: result.error || '',
    generatedAtMs: stamp,
    createdBy: userId,
    createdByName: userName,
  };

  await setDoc(ref, { ...base, generatedAt: serverTimestamp() });

  try {
    await setDoc(doc(db, COL, `${id}__v${String(version).padStart(4, '0')}`), {
      ...base,
      isVersion: true,
      generatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[analyticsReports] không lưu được bản lịch sử:', e?.code || e?.message);
  }

  return { id, version };
}

/** Đọc báo cáo mới nhất của (lớp, khoảng thời gian, môn trọng tâm). */
export async function getAnalyticsReport({ classId, range = {}, focusSubject = '' }) {
  if (!classId) return null;
  const id = reportDocId(classId, range, focusSubject);
  try {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn('[analyticsReports] không đọc được báo cáo:', e?.code || e?.message);
    return null;
  }
}

/** Lịch sử các lần tạo báo cáo (mới nhất trước). */
export async function listReportVersions({ classId, range = {}, focusSubject = '', max = 10 }) {
  if (!classId) return [];
  const id = reportDocId(classId, range, focusSubject);
  try {
    const snap = await getDocs(query(collection(db, COL), where('versionsOf', '==', id)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.generatedAtMs || 0) - (a.generatedAtMs || 0))
      .slice(0, Math.max(1, Math.min(50, max)));
  } catch (e) {
    console.warn('[analyticsReports] không đọc được lịch sử:', e?.code || e?.message);
    return [];
  }
}

/** Báo cáo đã lưu có còn khớp dữ liệu hiện tại hay không. */
export function savedReportStaleness(saved, analytics) {
  if (!saved) return { stale: true, reason: 'Chưa có báo cáo' };
  const savedFp = saved.dataFingerprint || '';
  const nowFp = analytics?.meta?.fingerprint || '';
  if (!savedFp) return { stale: true, reason: 'Báo cáo không có dấu vân tay dữ liệu' };
  if (savedFp !== nowFp) return { stale: true, reason: 'Dữ liệu lớp đã thay đổi sau khi tạo báo cáo' };
  return { stale: false, reason: '' };
}
