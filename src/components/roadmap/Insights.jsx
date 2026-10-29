/* ============================================================
   Insights.jsx — NHỊP HỌC: chuỗi ngày, biểu đồ 14 ngày, mục tiêu tuần, thẻ ghi nhớ
   ------------------------------------------------------------
   Mọi số đều tính từ bằng chứng thật (events) và kho thẻ trên thiết bị.
   Không có dữ liệu → hiện "—"/trạng thái trống, không bịa số.
   ============================================================ */

import { useMemo } from 'react';
import { dailyActivity, streakOf } from '../../lib/roadmapEngine.js';

export function Insights({
  events, weekCount, weekGoal, cards, onReviewCards, onSetGoal, now = Date.now(),
}) {
  const days = useMemo(() => dailyActivity(events, 14, now), [events, now]);
  const streak = useMemo(() => streakOf(events, now), [events, now]);

  const peak = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((n, d) => n + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;
  const goalPct = weekGoal ? Math.min(100, Math.round((weekCount / weekGoal) * 100)) : null;
  const goalLeft = weekGoal ? Math.max(0, weekGoal - weekCount) : null;

  const streakNote = streak.current === 0
    ? (streak.best > 0 ? `Chuỗi dài nhất của bạn: ${streak.best} ngày` : 'Làm vài câu hôm nay để bắt đầu chuỗi')
    : streak.activeToday
      ? `Hôm nay đã học · dài nhất ${streak.best} ngày`
      : 'Làm vài câu hôm nay để giữ chuỗi';

  const summary = `Biểu đồ số câu mỗi ngày trong 14 ngày: tổng ${total} câu, học ${activeDays}/14 ngày.`;

  return (
    <section className="rm-insights" aria-label="Nhịp học">
      <article className={'rm-ins-card rm-ins-streak' + (streak.current > 0 ? ' is-live' : '')}>
        <small>Chuỗi ngày học</small>
        <b>
          {streak.current}
          <span>ngày</span>
        </b>
        <em>{streakNote}</em>
        {streak.current > 0 && !streak.activeToday && (
          <span className="rm-ins-pill warn">Còn hôm nay để giữ chuỗi</span>
        )}
      </article>

      <article className="rm-ins-card rm-ins-chart">
        <header>
          <small>14 ngày gần nhất</small>
          <span>{total ? `${total} câu · ${activeDays}/14 ngày có học` : 'chưa có hoạt động'}</span>
        </header>
        <div className="rm-bars" role="img" aria-label={summary}>
          {days.map((d) => {
            const h = d.count ? Math.max(8, Math.round((d.count / peak) * 100)) : 4;
            const acc = d.count ? Math.round((d.correct / d.count) * 100) : null;
            return (
              <div
                key={d.key}
                className={'rm-bar-col' + (d.isToday ? ' is-today' : '') + (d.count ? '' : ' is-empty')}
                title={d.count ? `${d.label} ${d.date}: ${d.count} câu, ${acc}% đúng` : `${d.label} ${d.date}: không làm câu nào`}
              >
                <i style={{ height: `${h}%` }} data-tone={acc === null ? 'none' : acc >= 80 ? 'ok' : acc >= 50 ? 'mid' : 'low'} />
                <span>{d.date}</span>
              </div>
            );
          })}
        </div>
        <p className="rm-muted sm">Màu cột: xanh ≥80% đúng, vàng 50–79%, đỏ dưới 50%. Cột xám nhạt là ngày không làm câu nào.</p>
      </article>

      <article className="rm-ins-card rm-ins-goal">
        <small>Mục tiêu tuần</small>
        {weekGoal ? (
          <>
            <b>{weekCount}<span>/{weekGoal} câu</span></b>
            <div className="rm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={weekGoal} aria-valuenow={Math.min(weekCount, weekGoal)}>
              <i style={{ width: `${goalPct}%` }} />
            </div>
            <em>{goalLeft === 0 ? 'Đã đạt mục tiêu tuần này' : `Còn ${goalLeft} câu (~${Math.ceil(goalLeft / 7)} câu/ngày nếu chia đều 7 ngày)`}</em>
          </>
        ) : (
          <>
            <b>{weekCount}<span>câu / 7 ngày</span></b>
            <em>Chưa đặt mục tiêu tuần.</em>
            <button type="button" className="rm-btn sm" onClick={() => onSetGoal(Math.max(20, weekCount * 2))}>
              Đặt {Math.max(20, weekCount * 2)} câu/tuần
            </button>
          </>
        )}
      </article>

      <article className={'rm-ins-card rm-ins-cards' + (cards.due > 0 ? ' is-warn' : '')}>
        <small>Thẻ ghi nhớ</small>
        {cards.total === 0 ? (
          <>
            <b>—</b>
            <em>Chưa có thẻ nào. Mở một chương → tab “Thẻ ghi nhớ” để bắt đầu.</em>
          </>
        ) : (
          <>
            <b>{cards.due}<span>/{cards.total} đến hạn</span></b>
            <em>Nhớ tốt {cards.byLevel[3]} · một phần {cards.byLevel[2]} · chưa nhớ {cards.byLevel[1]}</em>
            <button type="button" className="rm-btn sm primary" onClick={onReviewCards} disabled={cards.due === 0}>
              {cards.due ? `Ôn ${Math.min(cards.due, 10)} thẻ ngay` : 'Chưa có thẻ đến hạn'}
            </button>
          </>
        )}
      </article>
    </section>
  );
}

export default Insights;
