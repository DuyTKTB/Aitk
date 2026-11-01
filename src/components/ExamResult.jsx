/* ============================================================
   ExamResult.jsx — v2
   • Dùng <MathText /> cho câu hỏi, đáp án, lời giải (hết hiện $\frac{1}{2}$ thô)
   • Vòng điểm, thống kê đúng / sai / bỏ qua, lọc theo trạng thái
   • Báo rõ khi bài đang chờ nộp (rớt mạng) thay vì "chưa lưu được"
   ============================================================ */
import { useMemo, useState } from 'react';
import MathText from './MathText.jsx';
import '../styles/classroom.css';
import '../styles/exam-result-v2.css';

const IcoCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
);
const IcoX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const IcoMinus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="6" y1="12" x2="18" y2="12" /></svg>
);
const IcoCloud = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 10a6 6 0 0 0-11.5-1.5A4.5 4.5 0 0 0 7 17h11a3.5 3.5 0 0 0 0-7z" /></svg>
);

const gradeOf = (pct) =>
  pct >= 90 ? { label: 'Xuất sắc', color: '#16a34a' }
  : pct >= 70 ? { label: 'Tốt', color: '#2563eb' }
  : pct >= 50 ? { label: 'Trung bình', color: '#f59e0b' }
  : { label: 'Cần cố gắng', color: '#dc2626' };

const fmtDur = (s) => {
  const n = Math.max(0, Math.round(Number(s) || 0));
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};

function ScoreRing({ pct, color, children }) {
  const size = 148; const stroke = 12;
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <div className="erx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="erx-ring-bg" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke={color}
          strokeLinecap="round" strokeDasharray={`${(c * Math.min(100, pct)) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="erx-ring-fg"
        />
      </svg>
      <div className="erx-ring-in">{children}</div>
    </div>
  );
}

export default function ExamResult({ exam, result, showAnswer, onExit, onRetrySubmit }) {
  const [filter, setFilter] = useState('all');
  const queued = !!result.queued;
  const hasSaveError = !result.practice && (!!result.saveError || (!result.id && !queued));
  const noScore = result.score == null;
  const pct = !noScore && result.totalPoints > 0 ? Math.round((result.score / result.totalPoints) * 100) : 0;
  const grade = gradeOf(pct);

  const rows = useMemo(() => {
    if (!showAnswer || !result.detail) return [];
    return exam.questions.map((q, i) => {
      const d = result.detail[i];
      if (!d) return null;
      const isSkipped = d.picked === -1 || (Array.isArray(d.picked) && d.picked.every((x) => x === null)) || (typeof d.picked === 'string' && !d.picked.trim());
      const status = isSkipped ? 'skip' : d.isCorrect ? 'ok' : 'no';
      return { q, d, i, status };
    }).filter(Boolean);
  }, [exam, result, showAnswer]);

  const counts = useMemo(() => ({
    ok: rows.filter((r) => r.status === 'ok').length,
    no: rows.filter((r) => r.status === 'no').length,
    skip: rows.filter((r) => r.status === 'skip').length,
  }), [rows]);

  const correctCount = result.correct ?? result.correctCount ?? counts.ok;
  const totalCount = result.total ?? result.totalQuestions ?? exam?.questions?.length ?? rows.length;
  const wrongCount = Math.max(0, totalCount - correctCount - counts.skip);

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="er-page erx">
      <div className="er-card erx-card">
        <div className="erx-hero" style={{ '--grade-color': grade.color }}>
          <span className="erx-tag">{result.autoSubmitted ? 'TỰ ĐỘNG NỘP' : 'KẾT QUẢ'}</span>
          <p className="erx-exam">{exam?.title}</p>

          {queued ? (
            <div className="erx-notice warn" role="status">
              <IcoCloud />
              <div>
                <b>Bài đã được lưu trên máy</b>
                <span>Mất kết nối mạng. Bài sẽ tự động nộp khi có mạng — đừng xóa dữ liệu trình duyệt.</span>
              </div>
            </div>
          ) : hasSaveError ? (
            <div className="erx-notice warn" role="alert" style={{ background: '#fef2f2', borderColor: '#ef4444', color: '#991b1b', width: '100%', maxWidth: '520px', padding: '0.9rem 1.1rem', borderRadius: '12px', margin: '0 auto 1rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <IcoCloud size={20} />
                <b style={{ fontSize: '.95rem' }}>Chưa lưu được bài nộp lên hệ thống!</b>
              </div>
              <p style={{ margin: '0 0 .6rem 0', fontSize: '.84rem', opacity: 0.9 }}>
                {result.saveError ? `Lỗi: ${result.saveError}` : 'Bài thi đã chấm điểm nhưng chưa thể đồng bộ lên máy chủ.'}
              </p>
              {onRetrySubmit && (
                <button
                  type="button"
                  className="td-btn primary"
                  onClick={onRetrySubmit}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '.45rem 1rem', fontSize: '.85rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  🔄 Thử nộp lại bài ngay
                </button>
              )}
            </div>
          ) : null}

          {noScore ? (
            <>
              <ScoreRing pct={0} color="#94a3b8"><b className="erx-score">—</b></ScoreRing>
              <p className="erx-sub">Chưa chấm được điểm bài của bạn. Hãy chụp màn hình và báo giáo viên.</p>
            </>
          ) : (
            <>
              <ScoreRing pct={pct} color={grade.color}>
                <b className="erx-score">{result.score}</b>
                <span className="erx-of">/ {result.totalPoints}</span>
              </ScoreRing>
              <div className="erx-grade" style={{ background: grade.color }}>{grade.label} · {pct}%</div>
            </>
          )}

          {!queued && !noScore && (
            <ul className="erx-stats" aria-label="Thống kê bài làm">
              <li className="ok"><b>{correctCount}</b><span>Đúng</span></li>
              <li className="no"><b>{wrongCount}</b><span>Sai</span></li>
              {rows.length > 0 && <li className="skip"><b>{counts.skip}</b><span>Bỏ qua</span></li>}
              {result.timeSpent ? <li><b>{fmtDur(result.timeSpent)}</b><span>Thời gian</span></li> : null}
            </ul>
          )}
        </div>

        {showAnswer && rows.length > 0 && (
          <>
            <div className="erx-bar">
              <h3 className="er-h3">Chi tiết bài làm</h3>
              <div className="erx-filter" role="tablist" aria-label="Lọc câu hỏi">
                {[['all', 'Tất cả', rows.length], ['no', 'Sai', counts.no], ['skip', 'Bỏ qua', counts.skip], ['ok', 'Đúng', counts.ok]].map(([k, label, n]) => (
                  <button key={k} type="button" role="tab" aria-selected={filter === k}
                    className={'erx-chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>
                    {label} <em>{n}</em>
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 && (
              <p className="erx-empty">
                <IcoCheck size={16} /> Không có câu nào ở mục này
              </p>
            )}

            <ol className="er-list erx-list">
              {visible.map(({ q, d, i, status }) => (
                <li key={i} className={'erx-item ' + status}>
                  <div className="er-list-head">
                    <span className={'erx-mark ' + status}>
                      {status === 'ok' ? <IcoCheck /> : status === 'no' ? <IcoX /> : <IcoMinus />}
                    </span>
                    <b>Câu {i + 1}</b>
                    <span className="er-points">+{typeof d.earned === 'number' ? d.earned : (d.isCorrect ? (q.points || 1) : 0)} điểm</span>
                  </div>

                  <MathText as="p" className="er-q">{q.q}</MathText>

                  {/* 1. Dạng True / False (Đúng/Sai) */}
                  {(q.type === 'true_false' || Array.isArray(q.statements)) ? (
                    <div className="er-tf-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.6rem' }}>
                      {(q.statements || []).map((st, si) => {
                        const userVal = Array.isArray(d.picked) ? d.picked[si] : (d.picked && typeof d.picked === 'object' ? d.picked[si] : null);
                        const correctVal = st.answer ?? st.correct;
                        const isMatch = userVal !== null && userVal === correctVal;
                        return (
                          <div
                            key={si}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              background: isMatch ? 'rgba(16, 185, 129, 0.08)' : (userVal !== null ? 'rgba(239, 68, 68, 0.08)' : 'rgba(148, 163, 184, 0.08)'),
                              border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.25)' : (userVal !== null ? 'rgba(239, 68, 68, 0.25)' : 'rgba(148, 163, 184, 0.2)')}`,
                              fontSize: '0.86rem',
                              lineHeight: 1.5,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span><b>{String.fromCharCode(97 + si)})</b> <MathText as="span">{st.text}</MathText></span>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                Bạn chọn: <b style={{ color: userVal === true ? '#10b981' : userVal === false ? '#ef4444' : '#64748b' }}>
                                  {userVal === true ? 'Đúng' : userVal === false ? 'Sai' : 'Chưa chọn'}
                                </b>
                                {' · '}
                                Đáp án: <b style={{ color: '#10b981' }}>{correctVal === true ? 'Đúng' : 'Sai'}</b>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : q.type === 'short_answer' ? (
                    /* 2. Dạng Trả lời ngắn */
                    <div className="er-sa-box" style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', borderRadius: '8px', background: d.isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${d.isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div>
                        <span>Bạn trả lời: </span>
                        <b style={{ color: d.isCorrect ? '#10b981' : '#ef4444' }}>
                          {String(d.picked || '').trim() ? String(d.picked) : 'Chưa trả lời'}
                        </b>
                      </div>
                      <div>
                        <span>Đáp án đúng: </span>
                        <b style={{ color: '#10b981' }}>{String(q.answer ?? (q.accepted || [])[0] ?? d.correct ?? '')}</b>
                      </div>
                    </div>
                  ) : (
                    /* 3. Dạng Trắc nghiệm 1 đáp án */
                    <div className="er-opts">
                      {(q.options || []).map((opt, oi) => {
                        const isCorrect = oi === d.correct;
                        const isPicked = oi === d.picked;
                        return (
                          <div key={oi}
                            className={'er-opt' + (isCorrect ? ' correct' : '') + (isPicked && !isCorrect ? ' wrong' : '')}>
                            <span className="er-opt-key">{String.fromCharCode(65 + oi)}</span>
                            <MathText>{opt}</MathText>
                            {isPicked && <em>Bạn chọn</em>}
                            {isCorrect && !isPicked && <em className="erx-right">Đáp án đúng</em>}
                          </div>
                        );
                      })}
                      {d.picked === -1 && <p className="er-skipped">Bạn chưa trả lời câu này</p>}
                    </div>
                  )}

                  {q.explain && (
                    <div className="erx-explain">
                      <b>Lời giải</b>
                      <MathText as="div">{q.explain}</MathText>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="er-actions" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
          {counts.no > 0 && (
            <button
              className="td-btn"
              style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => { window.location.hash = 'notebook'; }}
              type="button"
            >
              <IcoX size={15} /> Sổ tay lỗi ({counts.no} câu)
            </button>
          )}
          <button
            className="td-btn"
            style={{ background: 'rgba(47, 107, 255, 0.1)', color: '#2f6bff', border: '1px solid rgba(47, 107, 255, 0.3)' }}
            onClick={() => { window.location.hash = 'stats'; }}
            type="button"
          >
            Xem Thống kê bài làm
          </button>
          <button
            className="td-btn"
            style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}
            onClick={() => { window.location.hash = 'roadmap'; }}
            type="button"
          >
            Lộ trình AI ôn tập
          </button>
          <button className="td-btn primary big" onClick={onExit} type="button">
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
