/* ============================================================
   SidePanels.jsx — CỘT PHẢI: gợi ý, hoạt động gần đây, ghi chú dữ liệu
   ============================================================ */

import { useMemo, useState } from 'react';
import { agoLabel } from '../../lib/roadmapEngine.js';
import { chapterName } from '../../data/roadmap.js';
import { IconClock, IconAlert, IconArrowRight, IconStar } from '../Icons.jsx';

const KIND_ICON = {
  review: <IconClock size={13} />,
  weak: <IconAlert size={13} />,
  next: <IconArrowRight size={13} />,
  strong: <IconStar size={13} on />,
};

export function SuggestionsPanel({ suggestions, onAction, onAi, dueTotal = 0, onReviewAll }) {
  return (
    <section className="rm-panel" aria-label="Gợi ý học tập">
      <header className="rm-panel-head">
        <h3>Gợi ý cho bạn</h3>
        <button type="button" className="rm-link" onClick={() => onAi('analysis')}>AI phân tích</button>
      </header>

      {dueTotal > 0 && (
        <div className="rm-due">
          <div>
            <b>{dueTotal} câu từng sai đang chờ ôn</b>
            <small>Ôn lại đúng những câu bạn đã làm sai — cách nhanh nhất để kéo điểm lên.</small>
          </div>
          <button type="button" className="rm-btn sm primary" onClick={onReviewAll}>Ôn ngay</button>
        </div>
      )}

      {suggestions.length === 0 ? (
        <p className="rm-muted">
          Chưa đủ dữ liệu để gợi ý. Luyện vài câu ở một chương bất kỳ, gợi ý sẽ xuất hiện ở đây.
        </p>
      ) : (
        <ul className="rm-sug">
          {suggestions.map((s) => (
            <li key={`${s.kind}-${s.chapterId}`}>
              <span className="rm-sug-ico" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{KIND_ICON[s.kind] || '•'}</span>
              <div>
                <b>{s.title}</b>
                <p>{s.reason}</p>
                <button type="button" className="rm-btn sm" onClick={() => onAction(s)}>{s.actionLabel}</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="rm-muted sm">
        Gợi ý do hệ thống tính từ kết quả trả lời thật (không gọi AI mỗi lần mở trang) để tiết kiệm chi phí.
      </p>
    </section>
  );
}

export function RecentPanel({ attempts, onOpen }) {
  const [showAll, setShowAll] = useState(false);
  const all = attempts || [];
  const rows = showAll ? all : all.slice(0, 6);

  /* Xu hướng độ chính xác của tối đa 8 phiên gần nhất có tổng câu > 0 (xếp từ cũ → mới) */
  const trendBars = useMemo(() => {
    const valid = all.filter((a) => a && a.total > 0).slice(0, 8).reverse();
    return valid.map((a) => ({
      id: a.id,
      pct: Math.round((a.correct / a.total) * 100),
      label: `${Math.round((a.correct / a.total) * 100)}% (${a.correct}/${a.total})`,
    }));
  }, [all]);

  const trendDelta = trendBars.length >= 2
    ? trendBars[trendBars.length - 1].pct - trendBars[0].pct
    : null;

  return (
    <section className="rm-panel" aria-label="Hoạt động gần đây">
      <header className="rm-panel-head">
        <h3>Hoạt động gần đây</h3>
      </header>

      {rows.length === 0 ? (
        <p className="rm-muted">Chưa có lượt làm bài nào được ghi nhận.</p>
      ) : (
        <>
          <ul className="rm-recent">
            {rows.map((a) => {
              const name = a.topicId ? chapterName(a.topicId) : null;
              const pct = a.total ? Math.round((a.correct / a.total) * 100) : null;
              const label = a.source === 'exam' ? 'Bài cô giao' : a.source === 'practice' ? 'Luyện trong Lộ trình' : 'Bài luyện';
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    className="rm-recent-btn"
                    onClick={() => (a.topicId ? onOpen(a.topicId) : null)}
                    disabled={!a.topicId}
                  >
                    <span className={'rm-recent-dot ' + (pct === null ? '' : pct >= 80 ? 'ok' : pct >= 50 ? 'mid' : 'low')} aria-hidden="true" />
                    <span className="rm-recent-main">
                      <b>{name || a.title || label}</b>
                      <small>{label} · {a.correct}/{a.total || '—'} câu · {agoLabel(a.at)}</small>
                    </span>
                    <span className="rm-recent-pct">{pct === null ? '—' : `${pct}%`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {all.length > 6 && (
            <div className="rm-panel-more">
              <button type="button" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Thu gọn' : `Xem thêm ${all.length - 6} lượt`}
              </button>
            </div>
          )}
          {trendBars.length >= 2 && (
            <div className="rm-sparkline-section">
              <h4>Xu hướng độ chính xác ({trendBars.length} phiên gần nhất)</h4>
              <div className="rm-sparkline-bars" role="img" aria-label="Biểu đồ xu hướng độ chính xác">
                {trendBars.map((b) => (
                  <span
                    key={b.id}
                    className="rm-sparkline-bar"
                    style={{ height: `${Math.max(12, b.pct)}%` }}
                    data-label={b.label}
                  />
                ))}
              </div>
              <div className={'rm-sparkline-trend ' + (trendDelta > 0 ? 'up' : trendDelta < 0 ? 'down' : '')}>
                {trendBars[0].pct}% → {trendBars[trendBars.length - 1].pct}%
                {trendDelta > 0 ? ` (↑ +${trendDelta}% đang tiến bộ)` : trendDelta < 0 ? ` (↓ ${trendDelta}%)` : ' (ổn định)'}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function DataNote({ issues, sources, bank, onRefresh, loading }) {
  return (
    <section className="rm-panel rm-panel-quiet">
      <header className="rm-panel-head">
        <h3>Dữ liệu lấy từ đâu</h3>
        <button type="button" className="rm-link" onClick={onRefresh} disabled={loading}>
          {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </header>
      <ul className="rm-sources">
        <li><b>{sources.exam}</b> câu từ bài cô giao (Firestore)</li>
        <li><b>{sources.attempt}</b> câu từ bài luyện trên máy chủ (Supabase)</li>
        <li><b>{sources.practice}</b> câu từ phiên luyện trên thiết bị này</li>
        {bank && (
          <li>
            Ngân hàng câu hỏi: <b>{bank.tagged}/{bank.total}</b> câu đã gắn chuyên đề
          </li>
        )}
      </ul>
      {issues.length > 0 && (
        <details className="rm-issues">
          <summary>{issues.length} nguồn chưa đọc được</summary>
          <ul>{issues.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </details>
      )}
      <p className="rm-muted sm">
        Phiên luyện trong Lộ trình được lưu theo tài khoản trên thiết bị này (giống XP/SRS của app),
        vì app đăng nhập bằng Firebase và chưa có phiên Supabase để ghi bảng cá nhân.
      </p>
    </section>
  );
}
