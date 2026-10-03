import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { useGamification } from '../hooks/useGamification.js';

export default function StatsPage() {
  const { user } = useAuth();
  const gamif = useGamification();
  const uid = user?.uid || user?.id;

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('exam_attempts')
          .select(`
            id, score, correct_count, wrong_count, blank_count,
            total_questions, time_spent, started_at,
            exam:exams(id, title, subject:subjects(name, code))
          `)
          .eq('user_id', uid)
          .eq('is_completed', true)
          .order('started_at', { ascending: false })
          .limit(100);

        setAttempts(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading) return <div className="sp-loading">Đang tải thống kê…</div>;

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts
    ? attempts.reduce((s, a) => s + Number(a.score || 0), 0) / totalAttempts
    : 0;
  const bestScore = totalAttempts
    ? Math.max(...attempts.map((a) => Number(a.score || 0)))
    : 0;
  const bySubject = {};
  attempts.forEach((a) => {
    const subj = a.exam?.subject?.name || 'Khác';
    if (!bySubject[subj]) bySubject[subj] = { count: 0, sum: 0 };
    bySubject[subj].count += 1;
    bySubject[subj].sum += Number(a.score || 0);
  });

  const subjectStats = Object.entries(bySubject).map(([name, v]) => ({
    name,
    count: v.count,
    avg: v.sum / v.count,
  }));
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = attempts.filter(
      (a) => a.started_at.slice(0, 10) === dateStr
    ).length;
    return { day: d.toLocaleDateString('vi-VN', { weekday: 'short' }), count };
  });
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  const levelProg = gamif.getLevelProgress();

  return (
    <div className="sp">
      <header className="sp-head">
        <h1>Thống kê của tôi</h1>
        <p className="sp-sub">Xem tiến độ học tập và điểm mạnh, điểm yếu</p>
      </header>

      {/* ============ GAMIFICATION ============ */}
      <section className="sp-gamif">
        <div className="sp-level-card">
          <div className="sp-level-badge">
            <small>Level</small>
            <b>{gamif.level || 1}</b>
          </div>
          <div className="sp-level-info">
            <span className="sp-xp">{gamif.xp || 0} XP</span>
            <div className="sp-xp-bar">
              <i style={{ width: levelProg.pct + '%' }} />
            </div>
            <small>
              {levelProg.current} / {levelProg.needed} XP đến level{' '}
              {(gamif.level || 1) + 1}
            </small>
          </div>
        </div>

        <div className="sp-streak-card">
          <div className="sp-streak-flame">🔥</div>
          <div>
            <b>{gamif.streak || 0} ngày</b>
            <small>Chuỗi học liên tiếp</small>
          </div>
        </div>
      </section>

      {/* ============ STAT CARDS ============ */}
      <section className="sp-stats">
        <StatBox label="Tổng lượt làm" value={totalAttempts} />
        <StatBox label="Điểm trung bình" value={avgScore.toFixed(1)} />
        <StatBox label="Điểm cao nhất" value={bestScore.toFixed(1)} />
        <StatBox
          label="Câu đúng"
          value={gamif.totalCorrect || 0}
          color="var(--post)"
        />
      </section>

      {/* ============ 7 NGÀY ============ */}
      <section className="sp-panel">
        <h3>7 ngày gần đây</h3>
        <div className="sp-chart">
          {last7.map((d, i) => (
            <div key={i} className="sp-bar-col">
              <div className="sp-bar-wrap">
                <div
                  className="sp-bar"
                  style={{
                    height: `${(d.count / maxCount) * 100}%`,
                    minHeight: d.count > 0 ? 4 : 0,
                  }}
                >
                  {d.count > 0 && <span>{d.count}</span>}
                </div>
              </div>
              <small>{d.day}</small>
            </div>
          ))}
        </div>
      </section>

      {/* ============ THEO MÔN ============ */}
      {subjectStats.length > 0 && (
        <section className="sp-panel">
          <h3>Điểm theo môn</h3>
          <ul className="sp-subjects">
            {subjectStats.map((s) => (
              <li key={s.name}>
                <div className="sp-subject-name">
                  <b>{s.name}</b>
                  <small>{s.count} lượt</small>
                </div>
                <div className="sp-subject-bar">
                  <i
                    style={{
                      width: `${(s.avg / 10) * 100}%`,
                      background:
                        s.avg >= 8
                          ? 'var(--post)'
                          : s.avg >= 5
                          ? 'var(--alkaline)'
                          : 'var(--acc)',
                    }}
                  />
                </div>
                <b className="sp-subject-avg">{s.avg.toFixed(1)}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============ LỊCH SỬ ============ */}
      <section className="sp-panel">
        <h3>Lịch sử gần đây</h3>
        {attempts.length === 0 ? (
          <p className="sp-empty">Chưa có lượt làm nào</p>
        ) : (
          <ul className="sp-history">
            {attempts.slice(0, 10).map((a) => (
              <li key={a.id}>
                <div>
                  <b>{a.exam?.title || 'Đề đã xóa'}</b>
                  <small>
                    {new Date(a.started_at).toLocaleDateString('vi-VN')} ·{' '}
                    {a.exam?.subject?.name}
                  </small>
                </div>
                <span
                  className={
                    'sp-history-score ' +
                    (Number(a.score) >= 8
                      ? 'good'
                      : Number(a.score) >= 5
                      ? 'mid'
                      : 'bad')
                  }
                >
                  {Number(a.score).toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="sp-stat" style={{ '--stat-color': color || 'var(--acc)' }}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}