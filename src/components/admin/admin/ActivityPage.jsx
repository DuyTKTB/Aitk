import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconActivity, IconClock, IconEye, IconTrophy, IconRefresh, IconCheck, IconClose,
} from './AdminIcons.jsx';
import {
  EmptyState, ErrorState, InlineAlert, Modal, PageLoader, Spinner, useToast,
} from './AdminUI.jsx';
import { formatDateTime, friendlyError } from './adminUtils.js';

const LIMIT = 200;

const scoreNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const scoreClass = (s) => (s >= 8 ? 'good' : s >= 5 ? 'mid' : 'bad');
const formatTime = (sec) => {
  const t = Math.round(Number(sec) || 0);
  if (!t) return '—';
  return `${Math.floor(t / 60)}′${String(t % 60).padStart(2, '0')}″`;
};

export default function ActivityPage() {
  const toast = useToast();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDays, setFilterDays] = useState(7);
  const [filterSubject, setFilterSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    supabase.from('subjects').select('id, name').order('sort_order').then(({ data, error: e }) => {
      if (e) console.warn('[Activity] không tải được danh sách môn:', e.message);
      else setSubjects(data || []);
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
      console.error(e);
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
    return { today, total: attempts.length, avg };
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
      console.error(e);
      toast.error('Không tải được chi tiết bài làm: ' + friendlyError(e));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading && attempts.length === 0 && !error) return <PageLoader text="Đang tải hoạt động…" />;

  return (
    <div className="adl-activity">
      <section className="adl-stats adl-stats-compact" aria-label="Thống kê hoạt động">
        <StatBox Icon={IconActivity} label="Hôm nay" value={stats.today} color="var(--post, #6fb35a)" />
        <StatBox Icon={IconClock} label={filterDays === 1 ? 'Trong ngày' : `${filterDays} ngày qua`} value={stats.total} color="var(--nonmetal, #3aa6c7)" />
        <StatBox Icon={IconTrophy} label="Điểm trung bình" value={stats.avg.toFixed(1)} color="var(--alkaline, #e0a43a)" />
      </section>

      <div className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconActivity size={16} /><span>Nhật ký làm bài</span></h3>
          <div className="adl-activity-filter">
            <select value={filterDays} onChange={(e) => setFilterDays(Number(e.target.value))} aria-label="Khoảng thời gian">
              <option value={1}>Hôm nay</option>
              <option value={7}>7 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} aria-label="Lọc theo môn">
              <option value="all">Tất cả môn</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" className="adl-btn-sm" onClick={load} disabled={loading}>
              {loading ? <Spinner size={13} /> : <IconRefresh size={13} />} Làm mới
            </button>
          </div>
        </header>

        {error && <ErrorState message={error} onRetry={load} />}

        {!error && attempts.length >= LIMIT && (
          <InlineAlert type="info">Chỉ hiển thị {LIMIT} lượt gần nhất. Thu hẹp khoảng thời gian hoặc chọn môn để xem chính xác hơn; điểm trung bình tính trên các lượt đang hiển thị.</InlineAlert>
        )}

        {!error && attempts.length === 0 && !loading && (
          <EmptyState Icon={IconActivity} title="Chưa có lượt làm bài nào" >Thử chọn khoảng thời gian dài hơn hoặc bỏ lọc môn.</EmptyState>
        )}

        {!error && attempts.length > 0 && (
          <div className="adl-table-wrap">
            <table className="adl-table">
              <thead>
                <tr><th>Thời gian</th><th>Đề thi</th><th>Chế độ</th><th>Điểm</th><th>Đúng / Tổng</th><th>Thời gian làm</th><th><span className="adl-sr">Chi tiết</span></th></tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const s = scoreNum(a.score);
                  return (
                    <tr key={a.id}>
                      <td className="adl-table-date">{formatDateTime(a.started_at)}</td>
                      <td className="adl-td-title">
                        <b>{a.exam?.title || 'Đề đã xóa'}</b>
                        <small>{[a.exam?.subject?.name, a.exam?.grade?.name].filter(Boolean).join(' · ')}</small>
                      </td>
                      <td><span className={'adl-role ' + (a.mode === 'exam' ? 'admin' : 'teacher')}>{a.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}</span></td>
                      <td><b className={'adl-score ' + scoreClass(s)}>{s.toFixed(1)}</b></td>
                      <td><b>{a.correct_count ?? 0}</b> / {a.total_questions ?? 0}</td>
                      <td className="adl-table-date">{formatTime(a.time_spent)}</td>
                      <td>
                        <button type="button" className="adl-icon-btn-sm" onClick={() => openDetail(a)} title="Xem chi tiết" aria-label="Xem chi tiết bài làm"><IconEye size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <Modal
          wide
          title={detail.attempt.exam?.title || 'Đề đã xóa'}
          subtitle={`Điểm ${scoreNum(detail.attempt.score).toFixed(1)}/10 · ${detail.attempt.correct_count ?? 0}/${detail.attempt.total_questions ?? 0} đúng · ${formatTime(detail.attempt.time_spent)}`}
          onClose={() => setDetail(null)}
        >
          {detailLoading || !detail.answers ? (
            <PageLoader text="Đang tải chi tiết…" />
          ) : detail.answers.length === 0 ? (
            <p className="adl-empty">Không có dữ liệu chi tiết cho lượt làm này.</p>
          ) : (
            <ul className="adl-detail-list">
              {detail.answers.map((ans, i) => {
                const right = ans.question?.answers?.find((x) => x.is_correct);
                return (
                  <li key={ans.id} className={'adl-detail-item ' + (ans.is_correct ? 'ok' : 'bad')}>
                    <div className="adl-detail-head">
                      <b>Câu {ans.question?.question_number || i + 1}</b>
                      <span className={'adl-verdict ' + (ans.is_correct ? 'ok' : 'bad')}>
                        {ans.is_correct ? <IconCheck size={13} /> : <IconClose size={13} />}
                        {ans.is_correct ? 'Đúng' : ans.selected_answer ? 'Sai' : 'Bỏ trống'}
                      </span>
                    </div>
                    <p className="adl-detail-q">{ans.question?.content}</p>
                    <div className="adl-detail-ans">
                      <div>
                        <small>Học sinh chọn</small>
                        {ans.selected_answer
                          ? <b className={ans.is_correct ? 'ok' : 'bad'}>{ans.selected_answer.label}. {ans.selected_answer.content}</b>
                          : <b className="bad">Bỏ trống</b>}
                      </div>
                      {!ans.is_correct && right && (
                        <div><small>Đáp án đúng</small><b className="ok">{right.label}. {right.content}</b></div>
                      )}
                    </div>
                    {!ans.is_correct && ans.question?.explanation && (
                      <div className="adl-explain"><small>Lời giải</small><p>{ans.question.explanation}</p></div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

function StatBox({ Icon, label, value, color }) {
  return (
    <div className="adl-stat static" style={{ '--stat-color': color }}>
      <span className="adl-stat-ico"><Icon size={22} /></span>
      <div className="adl-stat-info">
        <small>{label}</small>
        <b>{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</b>
      </div>
    </div>
  );
}
