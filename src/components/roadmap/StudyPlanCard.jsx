/* ============================================================
   StudyPlanCard.jsx — KẾ HOẠCH TỚI NGÀY THI (trong trang Lộ trình)
   ------------------------------------------------------------
   Nhập ngày thi + số phút/ngày + ngày nghỉ → sinh lịch theo ngày từ
   dữ liệu thật (mức thành thạo còn thiếu, câu đang chờ ôn).
   Không có API AI, không thêm bảng: cài đặt & dấu "đã xong" lưu theo
   tài khoản trên thiết bị.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildStudyPlan, planToMarkdown, planFileName, planToICal, planICalFileName, tomorrowISO,
} from '../../lib/studyPlan.js';
import {
  readPlanState, savePlanSettings, togglePlanDone, clearPlanDone, doneKey, downloadText, subscribePlan,
} from '../../lib/studyPlanStore.js';

const WEEK_LABELS = [
  { d: 1, label: 'T2' }, { d: 2, label: 'T3' }, { d: 3, label: 'T4' }, { d: 4, label: 'T5' },
  { d: 5, label: 'T6' }, { d: 6, label: 'T7' }, { d: 0, label: 'CN' },
];
const MINUTE_OPTIONS = [30, 45, 60, 90, 120];

export default function StudyPlanCard({ chapters, dueByTopic, uid, levelKey, onOpenChapter }) {
  const [state, setState] = useState(() => readPlanState(uid));
  const [plan, setPlan] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const { settings, done } = state;

  useEffect(() => { setState(readPlanState(uid)); }, [uid]);
  useEffect(() => subscribePlan(() => setState(readPlanState(uid))), [uid]);

  const generate = useCallback((nextSettings = settings) => {
    const p = buildStudyPlan({
      chapters, dueByTopic, settings: nextSettings,
    });
    setPlan(p);
    return p;
  }, [chapters, dueByTopic, settings]);

  /* Có ngày thi đã lưu → tự dựng lại lịch khi mở trang hoặc khi số câu chờ ôn thay đổi */
  const dueKey = useMemo(
    () => Object.entries(dueByTopic || {}).map(([k, v]) => `${k}:${v}`).sort().join(','),
    [dueByTopic],
  );
  useEffect(() => {
    if (!settings.examDate) { setPlan(null); return; }
    generate(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, settings.examDate, settings.minutesPerDay, settings.restDays.join(','), settings.maxTasksPerDay, chapters.length, dueKey]);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setState((s) => ({ ...s, settings: next }));
    savePlanSettings(uid, next);
    return next;
  };

  const visibleDays = useMemo(() => {
    if (!plan || !plan.days) return [];
    if (showAll) return plan.days;
    return plan.days.slice(0, 7);
  }, [plan, showAll]);

  const progress = useMemo(() => {
    if (!plan || !plan.days) return { total: 0, finished: 0 };
    let total = 0;
    let finished = 0;
    plan.days.forEach((d) => d.tasks.forEach((t) => {
      total += 1;
      if (done[doneKey(d.date, t.chapterId)]) finished += 1;
    }));
    return { total, finished };
  }, [plan, done]);

  const exportMd = () => {
    if (!plan || !plan.ok) return;
    const md = planToMarkdown(plan, { levelKey, settings });
    downloadText(planFileName(settings, levelKey), md);
  };

  const exportIcs = () => {
    if (!plan || !plan.ok) return;
    const ics = planToICal(plan, { levelKey, settings });
    downloadText(planICalFileName(settings, levelKey), ics);
  };

  const todayISO = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }, []);

  return (
    <section className="rm-plan" aria-label="Kế hoạch tới ngày thi">
      <header className="rm-plan-head">
        <div>
          <h2>Kế hoạch tới ngày thi</h2>
          <p className="rm-muted sm">
            Lịch theo ngày, tính từ mức thành thạo và số câu đang chờ ôn — không phải chia đều.
          </p>
        </div>
        {plan && plan.ok && (
          <div className="rm-plan-progress" aria-live="polite">
            <b>{progress.finished}/{progress.total}</b>
            <small>việc đã xong</small>
          </div>
        )}
      </header>

      <div className="rm-plan-form">
        <label className="rm-field">
          <span>Ngày thi</span>
          <input
            type="date"
            value={settings.examDate}
            min={tomorrowISO()}
            onChange={(e) => { const next = update({ examDate: e.target.value }); if (next.examDate) generate(next); }}
          />
        </label>

        <label className="rm-field">
          <span>Phút mỗi ngày</span>
          <select
            value={settings.minutesPerDay}
            onChange={(e) => { const next = update({ minutesPerDay: Number(e.target.value) }); generate(next); }}
          >
            {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m} phút</option>)}
          </select>
        </label>

        <label className="rm-field">
          <span>Việc tối đa/ngày</span>
          <select
            value={settings.maxTasksPerDay}
            onChange={(e) => { const next = update({ maxTasksPerDay: Number(e.target.value) }); generate(next); }}
          >
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} việc</option>)}
          </select>
        </label>

        <div className="rm-field rm-field-days">
          <span>Ngày nghỉ</span>
          <div className="rm-days" role="group" aria-label="Chọn ngày nghỉ trong tuần">
            {WEEK_LABELS.map((w) => (
              <button
                key={w.d}
                type="button"
                className={settings.restDays.includes(w.d) ? 'on' : ''}
                aria-pressed={settings.restDays.includes(w.d)}
                onClick={() => {
                  const has = settings.restDays.includes(w.d);
                  const next = { ...settings, restDays: has ? settings.restDays.filter((x) => x !== w.d) : [...settings.restDays, w.d] };
                  setState((st) => ({ ...st, settings: next }));
                  savePlanSettings(uid, next);
                  generate(next);
                }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rm-plan-buttons">
          <button type="button" className="rm-btn primary" onClick={() => generate(settings)} disabled={!settings.examDate}>
            {plan ? 'Cập nhật lịch' : 'Tạo kế hoạch'}
          </button>
          {plan && plan.ok && (
            <>
              <button type="button" className="rm-btn" onClick={() => window.print()}>In / Lưu PDF</button>
              <button type="button" className="rm-btn" onClick={exportMd}>Tải .md</button>
              <button type="button" className="rm-btn rm-btn-ical" onClick={exportIcs}>Lịch (.ics)</button>
            </>
          )}
        </div>
      </div>

      {!settings.examDate && (
        <p className="rm-muted">
          Chọn ngày thi để hệ thống tính số buổi cần thiết, chương nào học trước và mỗi ngày làm gì.
          Chưa có ngày thi thì mục "Mục tiêu tuần" ở trên vẫn dùng được.
        </p>
      )}

      {plan && !plan.ok && (
        <div className="rm-state err" role="alert">
          <b>Chưa tạo được kế hoạch</b>
          <p>{plan.warnings[0]}</p>
        </div>
      )}

      {plan && plan.ok && (
        <>
          <div className={`rm-plan-stats ${plan.stats.feasible ? 'ok' : 'warn'}`}>
            <div><small>Ngày học</small><b>{plan.stats.days} ngày</b></div>
            <div><small>Cần</small><b>{plan.stats.totalNeed} phút</b></div>
            <div><small>Đã xếp</small><b>{plan.stats.planned} phút</b></div>
            <div><small>Độ phủ</small><b>{Math.round(plan.stats.coverage * 100)}%</b></div>
            <p>
              {plan.stats.feasible
                ? `Khả thi với ${plan.stats.minutesPerDay} phút/ngày · mỗi ngày khoảng ${plan.stats.budget} phút học.${plan.stats.lastDayReview ? ' Ngày cuối dành để ôn tổng.' : ' Ngày cuối để khởi động lại trước khi thi.'}`
                : `Không đủ thời gian — cần khoảng ${plan.stats.suggestedMinutes} phút/ngày, hoặc bỏ bớt chương ưu tiên thấp.`}
            </p>
          </div>

          {plan.warnings.length > 0 && (
            <ul className="rm-plan-warn">
              {plan.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}

          <ol className="rm-plan-days">
            {visibleDays.map((d) => (
              <li key={d.date}>
                <div className="rm-plan-day-head">
                  <b>
                    {d.label}
                    {d.date === todayISO && <span className="rm-plan-today">Hôm nay</span>}
                  </b>
                  <span>{d.minutes} phút · {d.tasks.length} việc</span>
                </div>
                <ul className="rm-plan-tasks">
                  {d.tasks.map((t) => {
                    const k = doneKey(d.date, t.chapterId);
                    const isDone = !!done[k];
                    return (
                      <li key={k} className={isDone ? 'done' : ''}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => togglePlanDone(uid, d.date, t.chapterId)}
                          aria-label={`Đánh dấu xong: ${t.name}`}
                        />
                        <button type="button" className="rm-plan-task" onClick={() => onOpenChapter?.(t.chapterId)}>
                          <span>{t.name}</span>
                          <em className={`rm-plan-tag tag-${t.action.key}`}>{t.action.label}</em>
                          <small>{t.minutes}′</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>

          <div className="rm-plan-foot">
            {plan.days.length > 7 && (
              <button type="button" className="rm-link" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Thu gọn 7 ngày đầu' : `Xem tất cả ${plan.days.length} ngày`}
              </button>
            )}
            {progress.finished > 0 && (
              <button type="button" className="rm-link" onClick={() => clearPlanDone(uid)}>Xoá dấu đã xong</button>
            )}
            <span className="rm-muted sm">Ngày không hiện trong danh sách = ngày nghỉ hoặc không còn việc.</span>
            {plan.unplaced && plan.unplaced.length > 0 && (
              <span className="rm-muted sm">
                Chưa xếp được: {plan.unplaced.map((u) => u.name).join(', ')}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
