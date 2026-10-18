/* ============================================================
   ActivityPage.jsx — Nhật ký làm bài (Vitality)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import AdminShell, { Topbar, Donut } from './AdminShell.jsx';
import { Modal } from './AdminUI.jsx';
import {
  IconActivity, IconClock, IconEye, IconTrophy, IconRefresh,
  IconCheck, IconClose, IconChart, IconTrendUp, IconWarning,
} from './AdminIcons.jsx';
import { formatDateTime, friendlyError } from './adminUtils.js';

const LIMIT = 200;

const scoreNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const scoreColor = (s) => (s >= 8 ? '#16a34a' : s >= 5 ? '#f59e0b' : '#ef4444');
const formatTime = (sec) => {
  const t = Math.round(Number(sec) || 0);
  if (!t) return '—';
  return `${Math.floor(t / 60)}′${String(t % 60).padStart(2, '0')}″`;
};

export default function ActivityPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDays, setFilterDays] = useState(7);
  const [filterSubject, setFilterSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const reqId = useRef(0);

  useEffect(() => {
    supabase.from('subjects').select('id, name').order('sort_order').then(({ data, error: e }) => {
      if (!e) setSubjects(data || []);
    });
  }, []);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const since = new Date();
      since.setDate(since.getDate() - filterDays);
      if (filterDays === 1) since.setHours(0, 0, 0, 0);

      let examIds = null;
      if (filterSubject !== 'all') {
        const { data, error: e } = await supabase.from('exams').select('id').eq('subject_id', Number(filterSubject));
        if (e) throw e;
        examIds = (data || []).map((x) => x.id);
        if (examIds.length === 0) {
          if (my === reqId.current) setAttempts([]);
          return;
        }
      }

      let q = supabase
        .from('exam_attempts')
        .select(`
          id, score, correct_count, wrong_count, blank_count,
          total_questions, time_spent, started_at, submitted_at, mode, user_id, exam_id,
          exam:exams(id, title, subject:subjects(id, name), grade:grades(id, name))
        `)
        .eq('is_completed', true)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false })
        .limit(LIMIT);
      if (examIds) q = q.in('exam_id', examIds);

      const { data, error: e } = await q;
      if (e) throw e;
      if (my !== reqId.current) return;
      setAttempts(data || []);
    } catch (e) {
      if (my !== reqId.current) return;
      setError(friendlyError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [filterDays, filterSubject]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = attempts.filter((a) => new Date(a.started_at) >= startOfToday).length;
    const avg = attempts.length ? attempts.reduce((s, a) => s + scoreNum(a.score), 0) / attempts.length : 0;
    const passed = attempts.filter((a) => scoreNum(a.score) >= 5).length;
    const excellent = attempts.filter((a) => scoreNum(a.score) >= 8).length;
    return { today, total: attempts.length, avg, passed, excellent };
  }, [attempts]);

  const openDetail = async (attempt) => {
    setDetail({ attempt, answers: null });
    setDetailLoading(true);
    try {
      const { data, error: e } = await supabase
        .from('user_answers')
        .select(`
          id, is_correct, selected_answer_id, answered_at,
          question:questions(
            id, question_number, content, explanation,
            answers:answers(id, label, content, is_correct)
          ),
          selected_answer:answers!selected_answer_id(id, label, content, is_correct)
        `)
        .eq('attempt_id', attempt.id)
        .order('question_id', { ascending: true });
      if (e) throw e;
      setDetail({ attempt, answers: data || [] });
    } catch (e) {
      say('Không tải được chi tiết: ' + friendlyError(e));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminShell active="activity" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Hoạt động"
        subtitle={`Nhật ký làm bài ${filterDays === 1 ? 'hôm nay' : `${filterDays} ngày qua`}`}
      />

      {/* ===== HERO ===== */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">Lượt làm bài</span>
            <div className="vt-hero-num">
              <b>{stats.total}</b>
              <span>lượt</span>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Hôm nay</dt><dd>{stats.today}</dd></div>
              <div><dt>Điểm TB</dt><dd>{stats.avg.toFixed(1)}</dd></div>
              <div><dt>Đạt ≥5</dt><dd>{stats.passed}</dd></div>
              <div><dt>Xuất sắc ≥8</dt><dd>{stats.excellent}</dd></div>
            </dl>
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Tỷ lệ đạt</b>
            </div>
            <div className="vt-donut-row">
              <Donut
                value={stats.passed}
                max={Math.max(stats.total, 1)}
                size={130}
                stroke={12}
                tone={stats.total && stats.passed / stats.total < 0.5 ? 'danger' : 'acc'}
              >
                <strong>{stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}<sup>%</sup></strong>
                <small>đạt ≥5</small>
              </Donut>
              <ul className="vt-rank" style={{ flex: 1 }}>
                <li><span className="vt-rank-n r1">✓</span><b>Đạt</b><span className="vt-rank-score">{stats.passed}</span></li>
                <li><span className="vt-rank-n">×</span><b>Chưa đạt</b><span className="vt-rank-score">{stats.total - stats.passed}</span></li>
                <li><span className="vt-rank-n r2">★</span><b>Xuất sắc</b><span className="vt-rank-score">{stats.excellent}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTER ===== */}
      <div className="vt-card soft">
        <div className="vt-filter-bar">
          <div className="vt-filter-group">
            <IconClock size={14} className="vt-filter-ico" />
            <select value={filterDays} onChange={(e) => setFilterDays(Number(e.target.value))}>
              <option value={1}>Hôm nay</option>
              <option value={7}>7 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
          </div>
          <div className="vt-filter-group">
            <IconChart size={14} className="vt-filter-ico" />
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="all">Tất cả môn</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* ===== LIST ===== */}
      {error ? (
        <div className="vt-empty">
          <span><IconWarning size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      ) : loading && attempts.length === 0 ? (
        <div className="vt-card">
          <div className="vt-skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="vt-skeleton-row">
                <div className="vt-skeleton-line" style={{ width: '12%' }} />
                <div className="vt-skeleton-line" style={{ width: '38%' }} />
                <div className="vt-skeleton-line" style={{ width: '10%' }} />
                <div className="vt-skeleton-line" style={{ width: '8%' }} />
                <div className="vt-skeleton-line" style={{ width: '10%' }} />
              </div>
            ))}
          </div>
        </div>
      ) : attempts.length === 0 ? (
        <div className="vt-empty">
          <span><IconActivity size={30} /></span>
          <h3>Chưa có lượt làm bài nào</h3>
          <p>Thử chọn khoảng thời gian dài hơn hoặc bỏ lọc môn.</p>
        </div>
      ) : (
        <div className="vt-card">
          <header className="vt-card-head">
            <h3 className="vt-card-title">
              <IconActivity size={16} className="vt-title-ico" />
              Nhật ký ({attempts.length})
            </h3>
          </header>
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Đề thi</th>
                  <th>Chế độ</th>
                  <th>Điểm</th>
                  <th>Đúng / Tổng</th>
                  <th>Thời gian làm</th>
                  <th style={{ width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const s = scoreNum(a.score);
                  return (
                    <tr key={a.id}>
                      <td style={{ fontSize: '.82rem', color: 'var(--mut)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(a.started_at)}
                      </td>
                      <td>
                        <b style={{ display: 'block', fontSize: '.88rem' }}>{a.exam?.title || 'Đề đã xóa'}</b>
                        <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>
                          {[a.exam?.subject?.name, a.exam?.grade?.name].filter(Boolean).join(' · ')}
                        </small>
                      </td>
                      <td>
                        <span className={'vt-chip ' + (a.mode === 'exam' ? 'ready' : 'closed')}>
                          {a.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}
                        </span>
                      </td>
                      <td>
                        <b style={{ font: '800 1rem var(--mono)', color: scoreColor(s) }}>
                          {s.toFixed(1)}
                        </b>
                      </td>
                      <td>
                        <b>{a.correct_count ?? 0}</b>
                        <span style={{ color: 'var(--mut)' }}> / {a.total_questions ?? 0}</span>
                      </td>
                      <td style={{ fontSize: '.82rem', color: 'var(--mut)' }}>{formatTime(a.time_spent)}</td>
                      <td>
                        <button
                          type="button"
                          className="vt-icon-btn"
                          onClick={() => openDetail(a)}
                          title="Xem chi tiết"
                        >
                          <IconEye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {attempts.length >= LIMIT && (
            <p className="vt-muted" style={{ marginTop: '1rem', fontSize: '.78rem' }}>
              Chỉ hiển thị {LIMIT} lượt gần nhất. Thu hẹp khoảng thời gian hoặc chọn môn để xem chính xác hơn.
            </p>
          )}
        </div>
      )}

      {/* ===== MODAL CHI TIẾT ===== */}
      {detail && (
        <Modal
          title={detail.attempt.exam?.title || 'Đề đã xóa'}
          size="lg"
          onClose={() => setDetail(null)}
        >
          <div className="vt-detail-summary">
            <div className="vt-detail-score">
              <small>Điểm</small>
              <b style={{ color: scoreColor(scoreNum(detail.attempt.score)) }}>
                {scoreNum(detail.attempt.score).toFixed(1)}
              </b>
            </div>
            <div className="vt-detail-stat">
              <small>Đúng</small>
              <b>{detail.attempt.correct_count ?? 0}/{detail.attempt.total_questions ?? 0}</b>
            </div>
            <div className="vt-detail-stat">
              <small>Thời gian</small>
              <b>{formatTime(detail.attempt.time_spent)}</b>
            </div>
          </div>

          {detailLoading || !detail.answers ? (
            <div className="vt-loading" style={{ minHeight: 'auto', padding: '2rem' }}>
              <div className="page-loader-spinner" />
              <p>Đang tải chi tiết…</p>
            </div>
          ) : detail.answers.length === 0 ? (
            <p className="vt-muted">Không có dữ liệu chi tiết cho lượt làm này.</p>
          ) : (
            <ul className="vt-answer-list">
              {detail.answers.map((ans, i) => {
                const right = ans.question?.answers?.find((x) => x.is_correct);
                return (
                  <li
                    key={ans.id}
                    className={'vt-answer-item ' + (ans.is_correct ? 'ok' : 'bad')}
                  >
                    <div className="vt-answer-head">
                      <b>Câu {ans.question?.question_number || i + 1}</b>
                      <span className={'vt-chip ' + (ans.is_correct ? 'ready' : 'kicked')}>
                        {ans.is_correct ? <IconCheck size={12} /> : <IconClose size={12} />}
                        {ans.is_correct ? 'Đúng' : ans.selected_answer ? 'Sai' : 'Bỏ trống'}
                      </span>
                    </div>
                    <p className="vt-answer-q">{ans.question?.content}</p>
                    <div className="vt-answer-cols">
                      <div>
                        <small className="vt-answer-label">Học sinh chọn</small>
                        <b style={{ color: ans.is_correct ? '#16a34a' : '#ef4444' }}>
                          {ans.selected_answer ? `${ans.selected_answer.label}. ${ans.selected_answer.content}` : 'Bỏ trống'}
                        </b>
                      </div>
                      {!ans.is_correct && right && (
                        <div>
                          <small className="vt-answer-label">Đáp án đúng</small>
                          <b style={{ color: '#16a34a' }}>
                            {right.label}. {right.content}
                          </b>
                        </div>
                      )}
                    </div>
                    {!ans.is_correct && ans.question?.explanation && (
                      <div className="vt-answer-explain">
                        <small>Lời giải</small>
                        {ans.question.explanation}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Modal>
      )}

      {toast && <div className="vt-toast" role="status">{toast}</div>}
    </AdminShell>
  );
}