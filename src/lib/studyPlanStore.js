/* ============================================================
   studyPlanStore.js — Lưu CÀI ĐẶT kế hoạch + đánh dấu việc đã xong
   (localStorage theo tài khoản, cùng triết lý với roadmapStore)
   ============================================================ */

import { DEFAULT_PLAN } from './studyPlan.js';

const VERSION = 1;
const EVT = 'cs-study-plan';

const keyOf = (uid) => `cs-study-plan-v${VERSION}:${uid || 'guest'}`;

const empty = () => ({ settings: { ...DEFAULT_PLAN }, done: {} });

const DONE_TTL_DAYS = 30;

const pruneDone = (done, now = Date.now()) => {
  if (!done || typeof done !== 'object') return {};
  const cutoff = new Date(now - DONE_TTL_DAYS * 86400000).toISOString().slice(0, 10);
  const out = {};
  Object.keys(done).forEach((k) => {
    const datePart = String(k).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || datePart >= cutoff) {
      out[k] = true;
    }
  });
  return out;
};

export function readPlanState(uid, now = Date.now()) {
  try {
    const raw = localStorage.getItem(keyOf(uid));
    if (!raw) return empty();
    const box = JSON.parse(raw);
    const s = (box && box.settings) || {};
    return {
      settings: {
        examDate: typeof s.examDate === 'string' ? s.examDate : '',
        minutesPerDay: Number(s.minutesPerDay) || DEFAULT_PLAN.minutesPerDay,
        restDays: Array.isArray(s.restDays) ? s.restDays : DEFAULT_PLAN.restDays,
        maxTasksPerDay: Number(s.maxTasksPerDay) || DEFAULT_PLAN.maxTasksPerDay,
      },
      done: pruneDone(box && box.done, now),
    };
  } catch {
    return empty();
  }
}

function write(uid, next) {
  let written = false;
  try {
    localStorage.setItem(keyOf(uid), JSON.stringify(next));
    written = true;
  } catch (e) {
    console.warn('[studyPlanStore] không lưu được:', e && e.message);
  }
  if (written) {
    try { window.dispatchEvent(new Event(EVT)); } catch { /* test */ }
  }
}

export function savePlanSettings(uid, settings) {
  const cur = readPlanState(uid);
  const nextSettings = { ...cur.settings, ...settings };
  /* Đổi ngày thi → lịch mới hoàn toàn, xoá dấu hoàn thành của lịch cũ */
  const nextDone = settings && settings.examDate !== undefined && settings.examDate !== cur.settings.examDate
    ? {}
    : cur.done;
  write(uid, { settings: nextSettings, done: nextDone });
}

export const doneKey = (date, chapterId) => `${date}|${chapterId}`;

export function togglePlanDone(uid, date, chapterId) {
  const cur = readPlanState(uid);
  const k = doneKey(date, chapterId);
  const done = { ...cur.done };
  if (done[k]) delete done[k];
  else done[k] = true;
  write(uid, { ...cur, done });
  return !done[k] ? false : true;
}

export function clearPlanDone(uid) {
  const cur = readPlanState(uid);
  write(uid, { ...cur, done: {} });
}

export function subscribePlan(cb) {
  if (typeof window === 'undefined') return () => {};
  const onEvt = () => cb();
  window.addEventListener(EVT, onEvt);
  return () => window.removeEventListener(EVT, onEvt);
}

/* Tải file .md không cần thư viện */
export function downloadText(fileName, content) {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}
