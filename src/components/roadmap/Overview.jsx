/* ============================================================
   Overview.jsx — KHỐI TỔNG QUAN CỦA TRANG LỘ TRÌNH
   Gồm: vòng thành thạo, dải chỉ số, thẻ "Tiếp tục học", bản đồ nhiệt.
   Mọi chỉ số đều có nguồn: engine tính từ bằng chứng trả lời thật.
   Chỉ số chưa đủ dữ liệu hiển thị "—" + nhãn, KHÔNG bịa số.
   ============================================================ */

import { useState } from 'react';
import {
  STATE_META, agoLabel, fmtMinutes, MIN_ANSWERS, MASTERED_SCORE,
} from '../../lib/roadmapEngine.js';

/* ---------- Vòng thành thạo ---------- */
export function MasteryRing({ score, size = 54, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const has = typeof score === 'number';
  return (
    <svg className={'rm-ring' + (has ? '' : ' is-empty')} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="rm-ring-bg" strokeWidth={stroke} />
      {has && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="rm-ring-fg"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, score)) / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" className="rm-ring-t">
        {has ? score : '—'}
      </text>
    </svg>
  );
}

/* ---------- Dải chỉ số ---------- */
export function OverviewMetrics({
  overview, minutes, weekCount, weekGoal, onSetGoal, loading, dueQuestions = 0, dueCards = 0, onReviewCards,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(weekGoal || 50);

  return (
    <section className="rm-metrics" aria-label="Tổng quan học tập">
      <article className="rm-metric">
        <small>Tiến độ chương trình</small>
        {loading ? <span className="rm-skel" style={{ height: 26, width: '60%' }} /> : (
          <>
            <b>{overview.chaptersMastered}<span>/{overview.chaptersTotal}</span></b>
            <div className="rm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={overview.chaptersTotal} aria-valuenow={overview.chaptersMastered}>
              <i style={{ width: `${overview.completionPct}%` }} />
            </div>
            <em>{overview.completionPct}% chương đạt ≥{MASTERED_SCORE}%</em>
          </>
        )}
      </article>

      <article className="rm-metric">
        <small>Chương đã luyện</small>
        {loading ? <span className="rm-skel" style={{ height: 26, width: '50%' }} /> : (
          <>
            <b>{overview.chaptersStarted}<span>/{overview.chaptersTotal}</span></b>
            <em>{overview.hasEvidence ? `${overview.answered} câu đã làm` : 'chưa có câu nào'}</em>
          </>
        )}
      </article>

      <article className="rm-metric">
        <small>Độ chính xác</small>
        {loading ? <span className="rm-skel" style={{ height: 26, width: '45%' }} /> : (
          <>
            <b>{overview.accuracy === null ? '—' : `${overview.accuracy}%`}</b>
            <em>{overview.answered ? `${overview.correct}/${overview.answered} câu` : 'chưa đủ dữ liệu'}</em>
          </>
        )}
      </article>

      <article className={'rm-metric' + (overview.reviewDue || dueQuestions || dueCards ? ' is-warn' : '')}>
        <small>Cần ôn hôm nay</small>
        <b>{overview.reviewDue}</b>
        <em>
          {overview.reviewDue ? 'chương quá chu kỳ ôn' : 'chưa có chương đến hạn'}
          {dueQuestions > 0 && <> · <b className="rm-metric-inline">{dueQuestions} câu từng sai</b></>}
          {dueCards > 0 && (
            <>
              {' · '}
              <button type="button" className="rm-link" onClick={onReviewCards}>{dueCards} thẻ đến hạn</button>
            </>
          )}
        </em>
      </article>

      <article className="rm-metric">
        <small>Thời gian học</small>
        <b>{minutes ? fmtMinutes(minutes) : '—'}</b>
        <em>{minutes ? 'từ các lượt làm bài đã ghi nhận' : 'chưa ghi nhận lượt nào'}</em>
      </article>

      <article className="rm-metric" aria-live="polite">
        <small>Mục tiêu tuần</small>
        {editing ? (
          <form
            className="rm-goal-form"
            onSubmit={(e) => { e.preventDefault(); onSetGoal(Number(draft) || null); setEditing(false); }}
          >
            <input
              type="number"
              min="5"
              max="500"
              step="5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Số câu mục tiêu mỗi tuần"
            />
            <button type="submit" className="rm-btn sm primary">Lưu</button>
          </form>
        ) : (
          <>
            <b>{weekGoal ? `${weekCount}/${weekGoal}` : weekCount}</b>
            <em>
              {weekGoal ? 'câu trong 7 ngày qua' : 'câu trong 7 ngày · chưa đặt mục tiêu'}
              <button type="button" className="rm-link" onClick={() => { setDraft(weekGoal || Math.max(20, weekCount * 2)); setEditing(true); }}>
                {weekGoal ? 'Đổi' : 'Đặt'}
              </button>
            </em>
          </>
        )}
      </article>
    </section>
  );
}

/* ---------- Thẻ tiếp tục học ---------- */
export function ContinueCard({ view, suggestion, onOpen, onPractice, onReview, onAi, hasAny, attemptsCount = 0, dueCount = 0 }) {
  if (!view) {
    return (
      <section className="rm-continue empty">
        <div>
          <small>Bắt đầu</small>
          <h2>{attemptsCount > 0 ? 'Chưa tính được tiến độ theo chương' : 'Chưa có dữ liệu học tập'}</h2>
          <p>
            {attemptsCount > 0
              ? `Hệ thống thấy ${attemptsCount} lượt làm bài của bạn, nhưng câu hỏi trong các đề đó chưa được gắn chuyên đề nên không thể quy về từng chương. `
                + 'Khi đề có gắn chuyên đề, tiến độ sẽ tự hiện ở đây.'
              : 'Bạn chưa có câu trả lời nào được ghi nhận. Hãy mở chương đầu tiên, luyện thử vài câu '
                + 'hoặc nhờ AI tóm tắt trọng tâm — tiến độ sẽ xuất hiện ngay sau đó.'}
          </p>
          <div className="rm-continue-actions">
            <button type="button" className="rm-btn primary" onClick={() => onOpen(suggestion?.chapterId)}>
              Mở chương đầu tiên
            </button>
            <button type="button" className="rm-btn ghost" onClick={() => onAi('analysis')}>AI phân tích</button>
          </div>
        </div>
      </section>
    );
  }

  const { chapter, summary, mastery, state, review } = view;
  const meta = STATE_META[state] || STATE_META.none;

  return (
    <section className="rm-continue">
      <div className="rm-continue-main">
        <small>Tiếp tục học</small>
        <h2>{chapter.name}</h2>
        <p className="rm-continue-reason">
          {suggestion?.reason || (summary
            ? `Bạn đã làm ${summary.correct}/${summary.answers} câu · lần cuối ${agoLabel(summary.lastAt)}.`
            : 'Chương này chưa có dữ liệu luyện tập.')}
        </p>
        <div className="rm-continue-meta">
          <span className={`rm-badge tone-${meta.tone}`}>{meta.icon} {meta.label}</span>
          {summary && <span className="rm-muted">{summary.answers} câu đã làm · {mastery.accuracy}% đúng</span>}
          {review.isDue && <span className="rm-badge tone-warn">◷ quá hạn {review.overdueDays} ngày</span>}
        </div>
        <div className="rm-continue-actions">
          <button type="button" className="rm-btn primary" onClick={() => onPractice(chapter.id)}>
            {summary ? 'Luyện tiếp' : 'Luyện 10 câu'}
          </button>
          {dueCount > 0 && (
            <button type="button" className="rm-btn" onClick={() => onReview(chapter.id)}>
              Ôn {dueCount} câu từng sai
            </button>
          )}
          <button type="button" className="rm-btn" onClick={() => onOpen(chapter.id)}>Xem chi tiết</button>
          {!hasAny && <button type="button" className="rm-btn ghost" onClick={() => onAi('analysis')}>AI phân tích</button>}
        </div>
      </div>
      <div className="rm-continue-score">
        <MasteryRing score={mastery.score} size={92} stroke={7} />
        <small>{mastery.score === null ? 'chưa đủ dữ liệu' : 'điểm thành thạo'}</small>
      </div>
    </section>
  );
}

/* ---------- Bản đồ nhiệt theo chương ---------- */
export function Heatmap({ chapters, onOpen }) {
  const rows = chapters.filter((c) => c.chapter.bank !== false);
  const legend = ['none', 'insufficient', 'weak', 'forming', 'proficient', 'mastered', 'strong'];

  return (
    <section className="rm-heat" aria-label="Bản đồ nhiệt kiến thức">
      {rows.length === 0 ? (
        <p className="rm-heat-empty">Khối này chưa có chương thuộc ngân hàng trắc nghiệm để vẽ bản đồ nhiệt.</p>
      ) : (
        <div className="rm-heat-grid">
          {rows.map((c) => {
            const meta = STATE_META[c.state] || STATE_META.none;
            const score = c.mastery.score;
            const low = c.summary && c.summary.answers < MIN_ANSWERS;
            return (
              <button
                key={c.chapter.id || c.index}
                type="button"
                className={`rm-heat-cell tone-${meta.tone}`}
                onClick={() => onOpen(c.chapter.id)}
                title={`${c.chapter.name} — ${meta.label}${score !== null ? ` (${score}%)` : ''}`}
              >
                <span className="rm-heat-name">{c.chapter.name}</span>
                <span className="rm-heat-val">
                  {score === null ? '—' : `${score}%`}
                  {low ? <i>n={c.summary.answers}</i> : null}
                </span>
                <span className="rm-heat-state">{meta.icon} {meta.short}</span>
              </button>
            );
          })}
        </div>
      )}
      <ul className="rm-legend">
        {legend.map((k) => (
          <li key={k} className={`tone-${STATE_META[k].tone}`}>
            <i aria-hidden="true">{STATE_META[k].icon}</i> {STATE_META[k].label}
          </li>
        ))}
      </ul>
      <p className="rm-muted sm">
        Ô “—” là chưa có câu trả lời nào — không phải 0 điểm. Bậc thành thạo cần tối thiểu {MIN_ANSWERS} câu mới được kết luận.
      </p>
    </section>
  );
}
