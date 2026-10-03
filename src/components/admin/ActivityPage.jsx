import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { IconActivity, IconClock, IconEye, IconTrophy } from './AdminIcons.jsx';

export default function ActivityPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDays, setFilterDays] = useState(7);
  const [filterSubject, setFilterSubject] = useState('all');
  const [detail, setDetail] = useState(null);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    avgScore: 0,
  });

  useEffect(() => {
    load();
  }, [filterDays, filterSubject]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const since = new Date();
      since.setDate(since.getDate() - filterDays);

      let q = supabase
        .from('exam_attempts')
        .select(`
          id, score, correct_count, wrong_count, blank_count,
          total_questions, time_spent, started_at, submitted_at, mode,
          user_id,
          exam:exams(
            id, title, subject:subjects(id, name, code),
            grade:grades(id, name)
          )
        `)
        .eq('is_completed', true)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false })
        .limit(200);

      const { data, error: e } = await q;
      if (e) throw e;

      let filtered = data || [];
      if (filterSubject !== 'all') {
        filtered = filtered.filter((a) => a.exam?.subject?.code === filterSubject);
      }

      setAttempts(filtered);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = filtered.filter(
        (a) => new Date(a.started_at) >= today
      ).length;
      const avg = filtered.length
        ? filtered.reduce((s, a) => s + (Number(a.score) || 0), 0) / filtered.length
        : 0;

      setStats({
        today: todayCount,
        week: filtered.length,
        avgScore: avg,
      });
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (attempt) => {
    try {
      const { data: answers } = await supabase
        .from('user_answers')
        .select(`
          id, is_correct, selected_answer_id, answered_at,
          question:questions(
            id, question_number, content, explanation,
            answers:answers(id, label, content, is_correct)
          ),
          selected_answer:answers(id, label, content, is_correct)
        `)
        .eq('attempt_id', attempt.id)
        .order('question_id', { ascending: true });

      setDetail({ attempt, answers: answers || [] });
    } catch (e) {
      console.error(e);
      alert('Không tải được chi tiết');
    }
  };

  if (loading && attempts.length === 0) {
    return <div className="adl-loading">Đang tải hoạt động…</div>;
  }

  return (
    <div className="adl-activity">
      {/* ============ STATS ============ */}
      <section className="adl-stats">
        <StatBox
          Icon={IconActivity}
          label="Hôm nay"
          value={stats.today}
          color="var(--post)"
        />
        <StatBox
          Icon={IconClock}
          label={`${filterDays} ngày qua`}
          value={stats.week}
          color="var(--nonmetal)"
        />
        <StatBox
          Icon={IconTrophy}
          label="Điểm TB"
          value={stats.avgScore.toFixed(1)}
          color="var(--alkaline)"
        />
      </section>

      {/* ============ FILTER ============ */}
      <div className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconActivity size={16} />
            <span>Nhật ký hoạt động</span>
          </h3>
          <div className="adl-activity-filter">
            <select value={filterDays} onChange={(e) => setFilterDays(Number(e.target.value))}>
              <option value={1}>Hôm nay</option>
              <option value={7}>7 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="all">Tất cả môn</option>
              <option value="toan">Toán</option>
              <option value="ly">Vật lí</option>
              <option value="hoa">Hóa học</option>
              <option value="sinh">Sinh học</option>
              <option value="van">Ngữ văn</option>
              <option value="anh">Tiếng Anh</option>
            </select>
            <button className="adl-btn-sm" onClick={load}>↻ Làm mới</button>
          </div>
        </header>

        {error && <p className="adl-error">{error}</p>}

        {attempts.length === 0 ? (
          <p className="adl-empty">Chưa có hoạt động nào trong khoảng thời gian này</p>
        ) : (
          <table className="adl-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Đề thi</th>
                <th>Chế độ</th>
                <th>Điểm</th>
                <th>Đúng / Tổng</th>
                <th>Thời gian làm</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td className="adl-table-date">
                    {new Date(a.started_at).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="adl-td-title">
                    <b>{a.exam?.title || 'Đề đã xóa'}</b>
                    <small>
                      {a.exam?.subject?.name} · {a.exam?.grade?.name}
                    </small>
                  </td>
                  <td>
                    <span className={'adl-role ' + (a.mode === 'exam' ? 'admin' : 'teacher')}>
                      {a.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}
                    </span>
                  </td>
                  <td>
                    <b className={'adl-score ' + getScoreClass(a.score)}>
                      {Number(a.score).toFixed(1)}
                    </b>
                  </td>
                  <td>
                    <b>{a.correct_count}</b> / {a.total_questions}
                  </td>
                  <td className="adl-table-date">
                    {formatTime(a.time_spent)}
                  </td>
                  <td>
                    <button
                      className="adl-icon-btn-sm"
                      onClick={() => openDetail(a)}
                      title="Xem chi tiết"
                    >
                      <IconEye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {detail && (
        <div className="adl-modal-backdrop" onClick={() => setDetail(null)}>
          <div className="adl-modal" onClick={(e) => e.stopPropagation()}>
            <header className="adl-modal-head">
              <div>
                <h3>{detail.attempt.exam?.title}</h3>
                <small>
                  Điểm: <b>{Number(detail.attempt.score).toFixed(1)}/10</b> ·{' '}
                  {detail.attempt.correct_count}/{detail.attempt.total_questions} đúng ·{' '}
                  {formatTime(detail.attempt.time_spent)}
                </small>
              </div>
              <button className="adl-icon-btn" onClick={() => setDetail(null)}>✕</button>
            </header>

            <div className="adl-modal-body">
              {detail.answers.length === 0 ? (
                <p className="adl-empty">Không có dữ liệu</p>
              ) : (
                <ul className="adl-detail-list">
                  {detail.answers.map((ans, i) => (
                    <li
                      key={ans.id}
                      className={'adl-detail-item ' + (ans.is_correct ? 'ok' : 'bad')}
                    >
                      <div className="adl-detail-head">
                        <b>Câu {ans.question?.question_number || i + 1}</b>
                        <span className={'adl-role ' + (ans.is_correct ? 'admin' : '')}>
                          {ans.is_correct ? 'Đúng' : 'Sai'}
                        </span>
                      </div>
                      <p className="adl-detail-q">{ans.question?.content}</p>
                      <div className="adl-detail-ans">
                        {ans.selected_answer ? (
                          <div>
                            <small>Học sinh chọn</small>
                            <b className={ans.is_correct ? 'ok' : 'bad'}>
                              {ans.selected_answer.label}. {ans.selected_answer.content}
                            </b>
                          </div>
                        ) : (
                          <div>
                            <small>Học sinh chọn</small>
                            <b className="bad">— Bỏ trống</b>
                          </div>
                        )}
                        {!ans.is_correct && (
                          <div>
                            <small>Đáp án đúng</small>
                            <b className="ok">
                              {ans.question?.answers?.find((a) => a.is_correct)?.label}.{' '}
                              {ans.question?.answers?.find((a) => a.is_correct)?.content}
                            </b>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function StatBox({ Icon, label, value, color }) {
  return (
    <div className="adl-stat" style={{ '--stat-color': color }}>
      <span className="adl-stat-ico">
        <Icon size={22} />
      </span>
      <div className="adl-stat-info">
        <small>{label}</small>
        <b>{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</b>
      </div>
    </div>
  );
}

function getScoreClass(score) {
  const s = Number(score);
  if (s >= 8) return 'good';
  if (s >= 5) return 'mid';
  return 'bad';
}

function formatTime(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}′${String(s).padStart(2, '0')}″`;
}