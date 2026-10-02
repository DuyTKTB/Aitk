import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconExam, IconQuestion, IconTrophy, IconUsers,
  IconTrendUp, IconTrendDown, IconPlus, IconClock,
} from './AdminIcons.jsx';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalExams: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    totalUsers: 0,
  });
  const [recentExams, setRecentExams] = useState([]);
  const [topExams, setTopExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [examsRes, questionsRes, attemptsRes, usersRes] = await Promise.all([
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          totalExams: examsRes.count || 0,
          totalQuestions: questionsRes.count || 0,
          totalAttempts: attemptsRes.count || 0,
          totalUsers: usersRes.count || 0,
        });

        const { data: recent } = await supabase
          .from('exams')
          .select('id, title, attempt_count, created_at, grade:grades(name), subject:subjects(name)')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentExams(recent || []);

        const { data: top } = await supabase
          .from('exams')
          .select('id, title, attempt_count, grade:grades(name), subject:subjects(name)')
          .order('attempt_count', { ascending: false })
          .limit(5);
        setTopExams(top || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="adl-loading">Đang tải dashboard…</div>;
  }

  return (
    <div className="adl-dashboard">
      {/* ============ STATS ============ */}
      <section className="adl-stats">
        <StatCard
          Icon={IconExam}
          label="Tổng đề thi"
          value={stats.totalExams}
          color="var(--post)"
          trend="+12%"
          trendUp
          onClick={() => onNavigate('exams')}
        />
        <StatCard
          Icon={IconQuestion}
          label="Câu hỏi"
          value={stats.totalQuestions}
          color="var(--nonmetal)"
          trend="+8%"
          trendUp
          onClick={() => onNavigate('questions')}
        />
        <StatCard
          Icon={IconTrophy}
          label="Lượt làm bài"
          value={stats.totalAttempts}
          color="var(--alkaline)"
          trend="+24%"
          trendUp
        />
        <StatCard
          Icon={IconUsers}
          label="Người dùng"
          value={stats.totalUsers}
          color="var(--noble)"
          trend="-2%"
          trendUp={false}
          onClick={() => onNavigate('users')}
        />
      </section>

      {/* ============ 2 CỘT ============ */}
      <div className="adl-grid-2">
        <section className="adl-panel">
          <header className="adl-panel-head">
            <h3>
              <IconTrophy size={16} />
              <span>Top đề phổ biến</span>
            </h3>
            <button type="button" className="adl-btn-sm" onClick={() => onNavigate('exams')}>
              Xem tất cả
            </button>
          </header>

          {topExams.length === 0 ? (
            <p className="adl-empty">Chưa có dữ liệu</p>
          ) : (
            <ul className="adl-list">
              {topExams.map((e, i) => (
                <li key={e.id} className="adl-list-item">
                  <span className="adl-rank">{i + 1}</span>
                  <div className="adl-list-info">
                    <b>{e.title}</b>
                    <small>{e.subject?.name} · {e.grade?.name}</small>
                  </div>
                  <span className="adl-list-value">
                    {(e.attempt_count || 0).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="adl-panel">
          <header className="adl-panel-head">
            <h3>
              <IconClock size={16} />
              <span>Đề gần đây</span>
            </h3>
            <button type="button" className="adl-btn-sm" onClick={() => onNavigate('exams')}>
              Xem tất cả
            </button>
          </header>

          {recentExams.length === 0 ? (
            <p className="adl-empty">Chưa có đề nào</p>
          ) : (
            <ul className="adl-list">
              {recentExams.map((e) => (
                <li key={e.id} className="adl-list-item">
                  <div className="adl-list-info">
                    <b>{e.title}</b>
                    <small>
                      {e.subject?.name} · {e.grade?.name} ·{' '}
                      {new Date(e.created_at).toLocaleDateString('vi-VN')}
                    </small>
                  </div>
                  <span className="adl-list-value">
                    {(e.attempt_count || 0).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ============ QUICK ACTIONS ============ */}
      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconPlus size={16} />
            <span>Thao tác nhanh</span>
          </h3>
        </header>

        <div className="adl-quick">
          <button type="button" className="adl-quick-btn" onClick={() => onNavigate('exams')}>
            <span className="adl-quick-ico" style={{ background: 'var(--post)' }}>
              <IconExam size={20} />
            </span>
            <div>
              <b>Tạo đề mới</b>
              <small>Dùng AI hoặc Import JSON</small>
            </div>
          </button>

          <button type="button" className="adl-quick-btn" onClick={() => onNavigate('questions')}>
            <span className="adl-quick-ico" style={{ background: 'var(--nonmetal)' }}>
              <IconQuestion size={20} />
            </span>
            <div>
              <b>Quản lý câu hỏi</b>
              <small>Xem ngân hàng câu hỏi</small>
            </div>
          </button>

          <button type="button" className="adl-quick-btn" onClick={() => onNavigate('users')}>
            <span className="adl-quick-ico" style={{ background: 'var(--noble)' }}>
              <IconUsers size={20} />
            </span>
            <div>
              <b>Người dùng</b>
              <small>Quản lý tài khoản</small>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

function StatCard({ Icon, label, value, color, trend, trendUp, onClick }) {
  const TrendIcon = trendUp ? IconTrendUp : IconTrendDown;
  return (
    <button
      type="button"
      className="adl-stat"
      style={{ '--stat-color': color }}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="adl-stat-ico">
        <Icon size={22} />
      </span>
      <div className="adl-stat-info">
        <small>{label}</small>
        <b>{value.toLocaleString('vi-VN')}</b>
        {trend && (
          <span className={'adl-stat-trend' + (trendUp ? ' up' : ' down')}>
            <TrendIcon size={12} />
            {trend}
          </span>
        )}
      </div>
    </button>
  );
}