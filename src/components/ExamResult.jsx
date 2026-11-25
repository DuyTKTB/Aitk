/* ============================================================
   ExamResult.jsx — v2
   • Dùng <MathText /> cho câu hỏi, đáp án, lời giải (hết hiện $\frac{1}{2}$ thô)
   • Vòng điểm, thống kê đúng / sai / bỏ qua, lọc theo trạng thái
   • Báo rõ khi bài đang chờ nộp (rớt mạng) thay vì "chưa lưu được"
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import MathText, { MathTextConfigContext } from './MathText.jsx';
import { subjectUsesMath } from '../lib/subjects.js';
import ExamAiDiagnostic from './ExamAiDiagnostic.jsx';
import ScoreDistributionChart from './exam/ScoreDistributionChart.jsx';
import { QuestionImage } from './QuestionAnswer.jsx';
import { ElecFlaskBrandSvg, ElecMascot } from './teacher/ElecBrandMark.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { askAI } from './HomePlus.jsx';
import {
  buildPostExamAnalytics,
  buildScoreDistributionHistogram,
  buildTopicPerformanceBreakdown,
  recordStudentEloOnce,
  recordCombatPowerOnce,
} from '../lib/studentAnalytics.js';
import '../styles/classroom.css';
import '../styles/exam-mode-upgrade.css';
import '../styles/student-v9-upgrades.css';
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
const IcoRefresh = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
);
const IcoHome = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /></svg>
);
const IcoBolt = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const IcoChart = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const IcoCompass = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
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
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';
  const [filter, setFilter] = useState('all');
  const [breakdownTab, setBreakdownTab] = useState('parts'); // 'parts' | 'topics'
  const [eloInfo, setEloInfo] = useState(null);
  const [powerInfo, setPowerInfo] = useState(null);
  const [drillItems, setDrillItems] = useState(null);
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillPicked, setDrillPicked] = useState(null);
  const [drillScore, setDrillScore] = useState(0);

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
      const isPendingEssay = !isSkipped && (q?.type === 'essay' || d?.needsManualGrading) && !d?.manualGraded && !d.isCorrect;
      const status = isSkipped ? 'skip' : isPendingEssay ? 'pending' : d.isCorrect ? 'ok' : 'no';
      return { q, d, i, status };
    }).filter(Boolean);
  }, [exam, result, showAnswer]);

  const counts = useMemo(() => ({
    ok: rows.filter((r) => r.status === 'ok').length,
    no: rows.filter((r) => r.status === 'no').length,
    skip: rows.filter((r) => r.status === 'skip').length,
    pending: rows.filter((r) => r.status === 'pending').length,
  }), [rows]);

  const correctCount = result.correct ?? result.correctCount ?? counts.ok;
  const totalCount = result.total ?? result.totalQuestions ?? exam?.questions?.length ?? rows.length;
  const wrongCount = Math.max(0, totalCount - correctCount - counts.skip - counts.pending);

  const postAnalytics = useMemo(() => buildPostExamAnalytics({ exam, result }), [exam, result]);
  const histogram = useMemo(() => buildScoreDistributionHistogram(pct), [pct]);
  const topicBreakdown = useMemo(() => buildTopicPerformanceBreakdown(rows), [rows]);

  useEffect(() => {
    if (queued || noScore) return;
    const attemptKey = result.id || `${exam?.id || exam?.title || 'exam'}_${result.score}_${result.timeSpent || 0}_${totalCount}`;
    setEloInfo(recordStudentEloOnce({ uid, attemptKey, pct, totalQuestions: totalCount }));
    setPowerInfo(recordCombatPowerOnce({ uid, attemptKey, correctCount, wrongCount }));
  }, [uid, queued, noScore, result.id, result.score, result.timeSpent, exam?.id, exam?.title, pct, totalCount, correctCount, wrongCount]);

  const wrongChoiceRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          (r.status === 'no' || r.status === 'skip') &&
          !(r.q.type === 'true_false' || Array.isArray(r.q.statements)) &&
          r.q.type !== 'short_answer' &&
          r.q.type !== 'essay' &&
          Array.isArray(r.q.options) &&
          r.q.options.length >= 2
      ),
    [rows]
  );

  const startWrongDrill = () => {
    if (!wrongChoiceRows.length) return;
    setDrillItems(wrongChoiceRows);
    setDrillIdx(0);
    setDrillPicked(null);
    setDrillScore(0);
  };

  const jumpToQuestion = (qIndex) => {
    setFilter('all');
    setTimeout(() => {
      document.getElementById(`erx-q-${qIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  };

  const askAiForQuestion = (q, d) => {
    const opts = (q.options || []).map((o, idx) => `${String.fromCharCode(65 + idx)}. ${o}`).join('\n');
    const pickedStr =
      typeof d.picked === 'number' && d.picked >= 0
        ? String.fromCharCode(65 + d.picked)
        : Array.isArray(d.picked)
          ? d.picked.map((v, i) => `${String.fromCharCode(97 + i)}:${v === true ? 'Đ' : v === false ? 'S' : '?'}`).join(', ')
          : String(d.picked || 'Chưa trả lời');
    askAI(
      `Em vừa làm sai/bỏ qua câu này trong đề "${exam?.title || 'luyện thi'}". Hãy giải thích cặn kẽ từng bước vì sao đáp án đúng là như vậy và chỉ giúp em lỗi sai của em (em chọn: ${pickedStr}):\n\nCâu hỏi: ${q.q || ''}${opts ? `\n\nCác phương án:\n${opts}` : ''}`
    );
  };

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const mascotMood =
    noScore ? 'think'
      : pct >= 85 ? 'celebrate'
        : pct >= 65 ? 'happy'
          : pct >= 45 ? 'fighting'
            : 'think';

  return (
    <MathTextConfigContext.Provider value={{ disableChemFormat: Boolean(exam?.subject) && !subjectUsesMath(exam?.subject) }}>
      <div className="er-page erx er-studio">
      <header className="erx-topbar">
        <div className="erx-topbar-left">
          <ElecFlaskBrandSvg size={30} />
          <span className="erx-topbar-div" aria-hidden="true" />
          <div className="erx-topbar-title">
            <b title={exam?.title}>{exam?.title || 'Kết quả bài thi'}</b>
            <small>
              {result.practice
                ? 'Chế độ luyện tập'
                : result.autoSubmitted
                  ? 'Nộp tự động · ELEC Exam Studio'
                  : 'Báo cáo kết quả · ELEC Exam Studio'}
            </small>
          </div>
        </div>
        <div className="erx-topbar-right">
          {!noScore && (
            <span className="erx-top-score">
              {result.score} / {result.totalPoints} điểm ({pct}%)
            </span>
          )}
          <button type="button" className="erx-top-exit" onClick={onExit}>
            <IcoHome size={14} /> Về trang chủ
          </button>
        </div>
      </header>

      <div className="er-card erx-card">
        <div className="erx-hero" style={{ '--grade-color': grade.color }}>
          <div className="erx-hero-left">
            {noScore ? (
              <ScoreRing pct={0} color="#94a3b8"><b className="erx-score">—</b></ScoreRing>
            ) : (
              <>
                <ScoreRing pct={pct} color={grade.color}>
                  <b className="erx-score">{result.score}</b>
                  <span className="erx-of">/ {result.totalPoints}</span>
                </ScoreRing>
                <div className="erx-grade" style={{ background: grade.color }}>{grade.label} · {pct}%</div>
              </>
            )}
          </div>

          <div className="erx-hero-right">
            <div className="erx-hero-head">
              <div>
                <span className="erx-tag">
                  {result.practice ? 'LUYỆN TẬP' : result.autoSubmitted ? 'TỰ ĐỘNG NỘP' : 'KẾT QUẢ CHÍNH THỨC'}
                </span>
                <p className="erx-exam">{exam?.title}</p>
              </div>
              <ElecMascot mood={mascotMood} size={68} className="erx-hero-mascot" />
            </div>

            {queued ? (
              <div className="erx-notice warn" role="status">
                <IcoCloud />
                <div>
                  <b>Bài đã được lưu trên máy</b>
                  <span>Mất kết nối mạng. Bài sẽ tự động nộp khi có mạng — đừng xóa dữ liệu trình duyệt.</span>
                </div>
              </div>
            ) : hasSaveError ? (
              <div className="erx-notice err" role="alert">
                <IcoCloud size={20} />
                <div>
                  <b>Chưa lưu được bài nộp lên hệ thống</b>
                  <span>
                    {result.saveError ? `Lỗi: ${result.saveError}` : 'Bài thi đã chấm điểm nhưng chưa thể đồng bộ lên máy chủ.'}
                  </span>
                  {onRetrySubmit && (
                    <button
                      type="button"
                      className="erx-retry-btn"
                      onClick={onRetrySubmit}
                    >
                      <IcoRefresh size={14} /> Thử nộp lại bài ngay
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {noScore && (
              <p className="erx-sub">Chưa chấm được điểm bài của bạn. Hãy chụp màn hình và báo giáo viên.</p>
            )}

            {!queued && !noScore && (
              <ul className="erx-stats" aria-label="Thống kê bài làm">
                <li className="ok"><b>{correctCount}</b><span>Câu đúng</span></li>
                <li className="no"><b>{wrongCount}</b><span>Câu sai</span></li>
                <li className="skip"><b>{counts.skip}</b><span>Bỏ qua</span></li>
                <li><b>{result.timeSpent ? fmtDur(result.timeSpent) : '—'}</b><span>Thời gian</span></li>
              </ul>
            )}

            {!queued && !noScore && (
              <div className="erx-hero-actions">
                {wrongChoiceRows.length > 0 && (
                  <button type="button" className="erx-act-btn drill" onClick={startWrongDrill}>
                    <IcoBolt size={14} /> Luyện lại {wrongChoiceRows.length} câu sai
                  </button>
                )}
                {counts.no > 0 && (
                  <button
                    type="button"
                    className="erx-act-btn err"
                    onClick={() => { window.location.hash = 'notebook'; }}
                  >
                    <IcoX size={13} /> Sổ tay lỗi ({counts.no})
                  </button>
                )}
                <button
                  type="button"
                  className="erx-act-btn"
                  onClick={() => { window.location.hash = 'stats'; }}
                >
                  <IcoChart size={14} /> Thống kê
                </button>
                <button
                  type="button"
                  className="erx-act-btn"
                  onClick={() => { window.location.hash = 'roadmap'; }}
                >
                  <IcoCompass size={14} /> Lộ trình AI
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bảng ELO Năng lực, Tốc độ làm bài & Độ chính xác 3 phần GDPT 2025 */}
        {!queued && !noScore && (
          <section className="s9-er-insights" aria-label="Phân tích ELO và tốc độ làm bài">
            <div className="s9-er-kpi-row">
              {eloInfo && (
                <div className="s9-er-kpi">
                  <span className="s9-er-kpi-lbl">ĐIỂM ELO NĂNG LỰC</span>
                  <div className="s9-er-kpi-val">
                    <b>{eloInfo.nextElo.toLocaleString('vi-VN')}</b>
                    <em className={`s9-er-elo-delta ${eloInfo.delta >= 0 ? 'up' : 'down'}`}>
                      {eloInfo.delta >= 0 ? `+${eloInfo.delta}` : eloInfo.delta}
                    </em>
                  </div>
                  <small>Hạng hiện tại: <b>{eloInfo.rank.label}</b></small>
                </div>
              )}

              <div className="s9-er-kpi">
                <span className="s9-er-kpi-lbl">TỐC ĐỘ LÀM BÀI</span>
                <div className="s9-er-kpi-val">
                  <b>{postAnalytics.secPerQuestion != null ? `${postAnalytics.secPerQuestion}s/câu` : '—'}</b>
                  <em className={`s9-er-pace-pill is-${postAnalytics.paceStatus.tone}`}>
                    {postAnalytics.paceStatus.label.split('·')[1]?.trim() || 'Chuẩn'}
                  </em>
                </div>
                <small>{postAnalytics.paceStatus.hint || `Nhịp mục tiêu ~${postAnalytics.targetSecPerQuestion}s/câu`}</small>
              </div>
            </div>

            {/* Thanh Lực chiến & Móc giữ chân ôn câu sai (kiểu 9Study) */}
            {powerInfo && (
              <div className="s9-er-power-bar">
                <div className="s9-er-power-top">
                  <div>
                    <span className="s9-er-kpi-lbl">LỰC CHIẾN HỌC TẬP</span>
                    <div className="s9-er-power-val">
                      <b>{powerInfo.totalPower.toLocaleString('vi-VN')}</b>
                      <em className="s9-er-elo-delta up">+{powerInfo.earned} Lực chiến</em>
                      <span className="s9-er-power-tier">{powerInfo.tier.label} → {powerInfo.tier.next.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                  {powerInfo.waitingFromMistakes > 0 && wrongChoiceRows.length > 0 && (
                    <button type="button" className="s9-er-power-cta" onClick={startWrongDrill}>
                      Gom +{powerInfo.waitingFromMistakes} lực chiến từ câu sai →
                    </button>
                  )}
                </div>
                <div className="s9-er-part-track">
                  <div className="s9-er-part-fill ok" style={{ width: `${Math.max(5, powerInfo.tier.pct)}%` }} />
                </div>
                {powerInfo.waitingFromMistakes > 0 && (
                  <small className="s9-er-power-hook">
                    Đề này còn <b>+{powerInfo.waitingFromMistakes} Lực chiến</b> đang chờ ở những câu bạn chưa làm đúng. Ôn câu sai ngay để lấy trọn điểm!
                  </small>
                )}
              </div>
            )}

            {/* Wave 5: Biểu đồ Phổ điểm & Percentile ("Cao hơn X% thí sinh") */}
            <div className="s9-er-hist-card">
              <div className="s9-er-hist-head">
                <div>
                  <span className="s9-er-kpi-lbl">VỊ THẾ PHỔ ĐIỂM TOÀN QUỐC</span>
                  <h4>
                    Điểm của bạn cao hơn <b>{histogram.percentile}%</b> thí sinh
                  </h4>
                </div>
                <span className="s9-er-top-pill">Top {histogram.topPct}%</span>
              </div>
              <div className="s9-er-hist-bars" role="img" aria-label={`Biểu đồ phổ điểm, bạn đạt ${histogram.score10} điểm, cao hơn ${histogram.percentile}% thí sinh`}>
                {histogram.bins.map((b) => (
                  <div key={b.idx} className={`s9-er-hist-col ${b.isUser ? 'is-user' : ''}`}>
                    {b.isUser && <span className="s9-er-you-tag">Bạn</span>}
                    <div className="s9-er-hist-bar-wrap">
                      <i style={{ height: `${Math.max(12, b.heightPct)}%` }} />
                    </div>
                    <small>{b.label}</small>
                  </div>
                ))}
              </div>
            </div>

            {(postAnalytics.partBreakdown.length > 0 || topicBreakdown.length > 0) && (
              <div className="s9-er-parts">
                <div className="s9-er-seg-row" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={breakdownTab === 'parts'}
                    className={`s9-er-seg-btn ${breakdownTab === 'parts' ? 'active' : ''}`}
                    onClick={() => setBreakdownTab('parts')}
                  >
                    Theo 3 Phần GDPT 2025
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={breakdownTab === 'topics'}
                    className={`s9-er-seg-btn ${breakdownTab === 'topics' ? 'active' : ''}`}
                    onClick={() => setBreakdownTab('topics')}
                  >
                    Theo chủ đề &amp; dạng câu ({topicBreakdown.length})
                  </button>
                </div>

                {breakdownTab === 'parts' ? (
                  postAnalytics.partBreakdown.map((p) => (
                    <div key={p.part} className="s9-er-part-row">
                      <div className="s9-er-part-top">
                        <span>{p.label}</span>
                        <b>{p.correct}/{p.total} câu ({p.pct}%)</b>
                      </div>
                      <div className="s9-er-part-track">
                        <div
                          className={`s9-er-part-fill ${p.pct >= 75 ? 'ok' : p.pct >= 50 ? 'warn' : 'bad'}`}
                          style={{ width: `${Math.max(4, p.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  topicBreakdown.map((tp) => (
                    <div key={tp.topic} className="s9-er-part-row">
                      <div className="s9-er-part-top">
                        <span>{tp.topic}</span>
                        <b>{tp.correct}/{tp.total} đúng ({tp.pct}%)</b>
                      </div>
                      <div className="s9-er-part-track">
                        <div
                          className={`s9-er-part-fill ${tp.pct >= 75 ? 'ok' : tp.pct >= 50 ? 'warn' : 'bad'}`}
                          style={{ width: `${Math.max(4, tp.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {showAnswer && rows.length > 0 && (
              <div className="s9-er-heatmap-wrap">
                <div className="s9-er-heatmap-head">
                  <span>Bản đồ kết quả từng câu (bấm số câu để nhảy nhanh)</span>
                  <span className="s9-er-legend">
                    <i><b className="ok" />Đúng</i>
                    <i><b className="no" />Sai</i>
                    <i><b className="skip" />Bỏ qua</i>
                    {counts.pending > 0 && <i><b className="skip" style={{ background: '#d97706' }} />Chờ chấm</i>}
                  </span>
                </div>
                <div className="s9-er-heatmap">
                  {rows.map((r) => (
                    <button
                      key={r.i}
                      type="button"
                      className={`s9-er-cell is-${r.status}`}
                      onClick={() => jumpToQuestion(r.i)}
                      title={`Câu ${r.i + 1}: ${r.status === 'ok' ? 'Đúng' : r.status === 'no' ? 'Sai' : r.status === 'pending' ? 'Chờ chấm' : 'Bỏ qua'}`}
                    >
                      {r.i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Biểu đồ Phổ điểm chuẩn hình chuông (Gaussian Bell Curve) so sánh cả nước */}
        {!queued && !noScore && (
          <ScoreDistributionChart
            userScore={result.score}
            totalPoints={exam.totalPoints || result.totalPoints || 10}
          />
        )}

        {/* AI Chẩn đoán điểm yếu & Đơn thuốc học tập */}
        <ExamAiDiagnostic exam={exam} result={result} />

        {showAnswer && rows.length > 0 && (
          <>
            <div className="erx-bar">
              <h3 className="er-h3">Chi tiết bài làm</h3>
              <div className="erx-filter" role="tablist" aria-label="Lọc câu hỏi">
                {[['all', 'Tất cả', rows.length], ['no', 'Sai', counts.no], ['skip', 'Bỏ qua', counts.skip], ...(counts.pending > 0 ? [['pending', 'Chờ chấm', counts.pending]] : []), ['ok', 'Đúng', counts.ok]].map(([k, label, n]) => (
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
                <li key={i} id={`erx-q-${i}`} className={'erx-item ' + status}>
                  <div className="er-list-head">
                    <span
                      className={'erx-mark ' + status}
                      style={status === 'pending' ? { background: 'rgba(217, 119, 6, 0.14)', color: '#d97706' } : undefined}
                    >
                      {status === 'ok' ? <IcoCheck /> : status === 'no' ? <IcoX /> : <IcoMinus />}
                    </span>
                    <b>Câu {i + 1}</b>
                    {status === 'pending' && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 999, background: 'rgba(217, 119, 6, 0.14)', color: '#b45309' }}>
                        Chờ GV chấm
                      </span>
                    )}
                    <span className="er-points">+{typeof d.earned === 'number' ? d.earned : (d.isCorrect ? (q.points || 1) : 0)} điểm</span>
                    {status !== 'ok' && (
                      <button
                        type="button"
                        className="s9-er-ask-ai"
                        onClick={() => askAiForQuestion(q, d)}
                        title="Hỏi ELEC AI giải thích chi tiết bẫy câu này"
                      >
                        Hỏi AI giải thích
                      </button>
                    )}
                  </div>

                  {(q.instruction || q.passage) && (
                    <div style={{ margin: '0.45rem 0', padding: '0.6rem 0.75rem', borderRadius: 10, background: 'rgba(148, 163, 184, 0.08)', borderLeft: '3px solid var(--acc, #2563eb)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                      {q.instruction && <div style={{ fontStyle: 'italic', color: 'var(--mut)', marginBottom: q.passage ? '0.3rem' : 0 }}>{q.instruction}</div>}
                      {q.passage && <MathText as="div">{q.passage}</MathText>}
                    </div>
                  )}
                  <MathText as="p" className="er-q">{q.q}</MathText>
                  <QuestionImage q={q} />

                  {/* 1. Dạng True / False (Đúng/Sai) */}
                  {(q.type === 'true_false' || Array.isArray(q.statements)) ? (
                    <div className="er-tf-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.6rem' }}>
                      {(q.statements || []).map((st, si) => {
                        const userVal = Array.isArray(d.picked) ? d.picked[si] : (d.picked && typeof d.picked === 'object' ? d.picked[si] : null);
                        const correctVal = st.answer ?? st.correct ?? (Array.isArray(d.correct) ? d.correct[si] : undefined);
                        const isMatch = userVal !== null && correctVal !== undefined && userVal === correctVal;
                        return (
                          <div
                            key={si}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '10px',
                              background: isMatch ? 'rgba(16, 185, 129, 0.08)' : (userVal !== null ? 'rgba(239, 68, 68, 0.08)' : 'rgba(148, 163, 184, 0.08)'),
                              border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.25)' : (userVal !== null ? 'rgba(239, 68, 68, 0.25)' : 'rgba(148, 163, 184, 0.2)')}`,
                              fontSize: '0.86rem',
                              lineHeight: 1.5,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span><b>{String.fromCharCode(97 + si)})</b> <MathText as="span">{st.text}</MathText></span>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                Bạn chọn: <b style={{ color: userVal === true ? '#10b981' : userVal === false ? '#ef4444' : '#64748b' }}>
                                  {userVal === true ? 'Đúng' : userVal === false ? 'Sai' : 'Chưa chọn'}
                                </b>
                                {' · '}
                                Đáp án: <b style={{ color: '#10b981' }}>{correctVal === true ? 'Đúng' : correctVal === false ? 'Sai' : '—'}</b>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : q.type === 'essay' ? (
                    /* 2b. Dạng Tự luận / Đọc hiểu mở */
                    <div
                      className="er-sa-box"
                      style={{
                        marginTop: '0.6rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '10px',
                        background: 'rgba(14, 165, 233, 0.06)',
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        fontSize: '0.88rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: '#0369a1' }}>Bài làm của bạn: </span>
                        <div style={{ marginTop: 4 }}>
                          {String(d.picked || '').trim() ? String(d.picked) : <em style={{ opacity: 0.7 }}>Chưa trả lời</em>}
                        </div>
                      </div>
                      {(q.answer || (typeof d.correct === 'string' && d.correct)) && (
                        <div>
                          <span style={{ fontWeight: 700, color: '#047857' }}>Gợi ý chấm: </span>
                          <MathText as="div">{q.answer || d.correct}</MathText>
                        </div>
                      )}
                    </div>
                  ) : q.type === 'short_answer' ? (
                    /* 2. Dạng Trả lời ngắn */
                    <div className="er-sa-box" style={{ marginTop: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: '10px', background: d.isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${d.isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div>
                        <span>Bạn trả lời: </span>
                        <b style={{ color: d.isCorrect ? '#10b981' : '#ef4444' }}>
                          {String(d.picked || '').trim() ? String(d.picked) : 'Chưa trả lời'}
                        </b>
                      </div>
                      <div>
                        <span>Đáp án đúng: </span>
                        <b style={{ color: '#10b981' }}>
                          {String(q.answer ?? (q.accepted || [])[0] ?? (Array.isArray(d.correct) ? d.correct[0] : d.correct) ?? '')}
                        </b>
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
                            <span className="er-opt-body"><MathText>{opt}</MathText></span>
                            {isPicked && <em>Bạn chọn</em>}
                            {isCorrect && !isPicked && <em className="erx-right">Đáp án đúng</em>}
                          </div>
                        );
                      })}
                      {d.picked === -1 && <p className="er-skipped">Bạn chưa trả lời câu này</p>}
                    </div>
                  )}

                  {(q.explain || q.explanation) && (
                    <div className="erx-explain">
                      <b>Lời giải chi tiết</b>
                      <MathText as="div">{q.explain || q.explanation}</MathText>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="er-actions" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
          {wrongChoiceRows.length > 0 && (
            <button
              className="td-btn"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={startWrongDrill}
              type="button"
            >
              Luyện lại ngay {wrongChoiceRows.length} câu sai
            </button>
          )}
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

      {/* Modal Luyện lại nhanh các câu vừa sai ngay trên màn hình kết quả */}
      {drillItems && (
        <div
          className="s9-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Luyện lại các câu vừa sai"
          onClick={(e) => { if (e.target === e.currentTarget) setDrillItems(null); }}
        >
          <div className="s9-drill-modal">
            {drillIdx >= drillItems.length ? (
              <div className="s9-drill-done">
                <div className="s9-drill-mascot-duo" aria-hidden="true">
                  <img src="/img/elec/elec-heart-eyes.png" alt="" className="side" />
                  <img src="/img/elec/elec-celebrate.png" alt="Bé Elec chúc mừng hoàn thành sửa sai" className="main" />
                  <img src="/img/elec/elec-wink.png" alt="" className="side" />
                </div>
                <h3>Đã hoàn tất vòng sửa sai!</h3>
                <p>
                  Bạn làm đúng lại <b>{drillScore}</b> / <b>{drillItems.length}</b> câu vừa sai.
                </p>
                <div className="s9-drill-foot">
                  <button type="button" className="s9-pm-btn is-ghost" onClick={() => setDrillItems(null)}>
                    Đóng
                  </button>
                  <button type="button" className="s9-pm-btn is-primary" onClick={startWrongDrill}>
                    Luyện thêm lần nữa
                  </button>
                </div>
              </div>
            ) : (() => {
              const cur = drillItems[drillIdx];
              const correctIdx = cur.d?.correct;
              const isDrillCorrect = drillPicked !== null && drillPicked === correctIdx;
              const isDrillWrong = drillPicked !== null && drillPicked !== correctIdx;
              return (
                <>
                  <header className="s9-pm-head">
                    <div className="s9-pm-head-main">
                      <div className={`emm-hero-mascot sm ${isDrillCorrect ? 'is-emerald' : isDrillWrong ? 'is-amber' : ''}`} aria-hidden="true">
                        <img
                          src={
                            isDrillCorrect
                              ? '/img/elec/elec-celebrate.png'
                              : isDrillWrong
                                ? '/img/elec/elec-think.png'
                                : '/img/elec/elec-fighting.png'
                          }
                          alt="Bé Elec đồng hành sửa lỗi sai"
                          draggable={false}
                        />
                      </div>
                      <div className="s9-pm-head-info">
                        <span className="s9-pm-badge is-type">Sửa sai tức thì · Câu {drillIdx + 1}/{drillItems.length}</span>
                        <h3>Câu {cur.i + 1} trong đề</h3>
                        <div className="emm-speech-pill">
                          <span className="emm-speech-dot" aria-hidden="true" />
                          <span>
                            {isDrillCorrect
                              ? 'Quá đỉnh! Bạn đã gỡ bẫy thành công câu này rồi!'
                              : isDrillWrong
                                ? 'Không sao nhé! Xem lời giải bên dưới để nhớ chắc dạng này!'
                                : 'Bình tĩnh đọc kỹ đề và chọn lại đáp án chuẩn xác nào!'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="s9-pm-close" onClick={() => setDrillItems(null)} aria-label="Đóng">
                      <IcoX size={15} />
                    </button>
                  </header>
                  <div className="s9-drill-body">
                    <MathText as="div" className="s9-pm-qtext">{cur.q.q}</MathText>
                    <QuestionImage q={cur.q} />
                    <div className="s9-drill-opts">
                      {(cur.q.options || []).map((opt, oi) => {
                        const isPicked = drillPicked === oi;
                        const isRight = oi === correctIdx;
                        let cls = 's9-drill-opt';
                        if (drillPicked !== null) {
                          if (isRight) cls += ' is-right';
                          else if (isPicked) cls += ' is-wrong';
                        }
                        return (
                          <button
                            key={oi}
                            type="button"
                            className={cls}
                            disabled={drillPicked !== null}
                            onClick={() => {
                              setDrillPicked(oi);
                              if (oi === correctIdx) setDrillScore((s) => s + 1);
                            }}
                          >
                            <b className="s9-pm-opt-letter">{String.fromCharCode(65 + oi)}</b>
                            <MathText as="span">{String(opt).replace(/^[A-D]\.\s*/i, '')}</MathText>
                          </button>
                        );
                      })}
                    </div>
                    {drillPicked !== null && (cur.q.explain || cur.q.explanation) && (
                      <div className="s9-pm-explain">
                        <img src="/img/elec/elec-wink.png" alt="" className="emm-mini-mascot" aria-hidden="true" />
                        <div className="s9-pm-explain-body">
                          <b>Lời giải · Bé Elec hướng dẫn</b>
                          <MathText as="div">{cur.q.explain || cur.q.explanation}</MathText>
                        </div>
                      </div>
                    )}
                  </div>
                  {drillPicked !== null && (
                    <footer className="s9-pm-foot">
                      <div className="s9-pm-foot-buddy">
                        <img src={isDrillCorrect ? '/img/elec/elec-happy.png' : '/img/elec/elec-cool.png'} alt="" className="emm-mini-mascot" aria-hidden="true" />
                        <span>Đã gỡ đúng {drillScore}/{drillIdx + 1} câu trong vòng này</span>
                      </div>
                      <div className="s9-pm-foot-actions">
                        <button
                          type="button"
                          className="s9-pm-btn is-primary"
                          onClick={() => {
                            setDrillIdx((x) => x + 1);
                            setDrillPicked(null);
                          }}
                        >
                          {drillIdx === drillItems.length - 1 ? 'Xem kết quả sửa sai' : 'Câu sai tiếp theo →'}
                        </button>
                      </div>
                    </footer>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      </div>
    </MathTextConfigContext.Provider>
  );
}
