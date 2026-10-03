import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconExam, IconQuestion, IconTrophy, IconUsers, IconTrendUp, IconPlus,
  IconClock, IconBook, IconWarning, IconRefresh, IconEdit,
} from './AdminIcons.jsx';
import ApiUsagePanel from './ApiUsagePanel.jsx';
import { ErrorState, InlineAlert, PageLoader } from './AdminUI.jsx';
import { friendlyError, formatDate } from './adminUtils.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/* Đếm số dòng; lỗi riêng lẻ trả về null để không làm hỏng cả dashboard */
async function safeCount(query) {
  try {
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    console.warn('[Dashboard] count lỗi:', e.message);
    return null;
  }
}

const countOf = (table) => supabase.from(table).select('*', { count: 'exact', head: true });

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partial, setPartial] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - WEEK_MS).toISOString();

      const [exams, questions, attempts, users, examsWeek, questionsWeek, attemptsWeek, usersWeek] =
        await Promise.all([
          safeCount(countOf('exams')),
          safeCount(countOf('questions')),
          safeCount(countOf('exam_attempts')),
          safeCount(countOf('profiles')),
          safeCount(countOf('exams').gte('created_at', since)),
          safeCount(countOf('questions').gte('created_at', since)),
          safeCount(countOf('exam_attempts').gte('started_at', since)),
          safeCount(countOf('profiles').gte('created_at', since)),
        ]);

      const [topRes, recentRes, emptyRes] = await Promise.all([
        supabase
          .from('exams')
          .select('id, title, attempt_count, grade:grades(name), subject:subjects(name)')
          .order('attempt_count', { ascending: false, nullsFirst: false })
          .limit(5),
        supabase
          .from('exams')
          .select('id, title, attempt_count, created_at, grade:grades(name), subject:subjects(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('exams')
          .select('id, title, is_published, questions(count)')
          .eq('is_published', true)
          .limit(300),
      ]);

      if (topRes.error && recentRes.error) throw topRes.error;

      setPartial(
        [exams, questions, attempts, users].some((v) => v === null) || !!topRes.error || !!recentRes.error || !!emptyRes.error,
      );

      setData({
        stats: { exams, questions, attempts, users },
        week: { exams: examsWeek, questions: questionsWeek, attempts: attemptsWeek, users: usersWeek },
        top: topRes.data || [],
        recent: recentRes.data || [],
        emptyExams: (emptyRes.data || []).filter((e) => !e.questions?.[0]?.count).slice(0, 5),
      });
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <PageLoader text="Đang tải tổng quan…" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const { stats, week, top, recent, emptyExams } = data;

  return (
    <div className="adl-dashboard">
      {partial && (
        <InlineAlert type="warn">
          Một số số liệu không tải được (thiếu quyền hoặc bảng chưa có cột <code>created_at</code>). Phần còn lại vẫn hiển thị bình thường.
        </InlineAlert>
      )}

      <section className="adl-stats" aria-label="Số liệu tổng quan">
        <StatCard Icon={IconExam} label="Đề thi" value={stats.exams} delta={week.exams} color="var(--post, #6fb35a)" onClick={() => onNavigate('exams')} />
        <StatCard Icon={IconQuestion} label="Câu hỏi" value={stats.questions} delta={week.questions} color="var(--nonmetal, #3aa6c7)" onClick={() => onNavigate('questions')} />
        <StatCard Icon={IconTrophy} label="Lượt làm bài" value={stats.attempts} delta={week.attempts} color="var(--alkaline, #e0a43a)" onClick={() => onNavigate('activity')} />
        <StatCard Icon={IconUsers} label="Người dùng" value={stats.users} delta={week.users} color="var(--noble, #7a6ad8)" onClick={() => onNavigate('users')} />
      </section>

      {emptyExams.length > 0 && (
        <section className="adl-panel adl-attention">
          <header className="adl-panel-head">
            <h3><IconWarning size={16} /><span>Đề đang hiện nhưng chưa có câu hỏi</span></h3>
          </header>
          <ul className="adl-list">
            {emptyExams.map((e) => (
              <li key={e.id} className="adl-list-item">
                <div className="adl-list-info"><b>{e.title}</b><small>Học sinh sẽ thấy đề trống</small></div>
                <button type="button" className="adl-btn-sm" onClick={() => onNavigate('exams', { editId: e.id })}>
                  <IconEdit size={13} /> Thêm câu hỏi
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ApiUsagePanel />

      <div className="adl-grid-2">
        <ExamListPanel title="Đề được làm nhiều nhất" Icon={IconTrophy} exams={top} ranked onAll={() => onNavigate('exams')} />
        <ExamListPanel title="Đề mới tạo" Icon={IconClock} exams={recent} showDate onAll={() => onNavigate('exams')} />
      </div>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconPlus size={16} /><span>Việc thường làm</span></h3>
          <button type="button" className="adl-btn-icon" onClick={load} title="Làm mới số liệu" aria-label="Làm mới">
            <IconRefresh size={16} />
          </button>
        </header>
        <div className="adl-quick">
          <QuickAction Icon={IconExam} color="var(--post, #6fb35a)" title="Tạo đề mới" sub="Thủ công, Import JSON hoặc dùng AI" onClick={() => onNavigate('create')} />
          <QuickAction Icon={IconQuestion} color="var(--nonmetal, #3aa6c7)" title="Ngân hàng câu hỏi" sub="Tìm, xem và dọn câu hỏi" onClick={() => onNavigate('questions')} />
          <QuickAction Icon={IconUsers} color="var(--noble, #7a6ad8)" title="Người dùng" sub="Xem tài khoản, đổi vai trò" onClick={() => onNavigate('users')} />
          <QuickAction Icon={IconBook} color="var(--alkaline, #e0a43a)" title="Hướng dẫn sử dụng" sub="Quy trình tạo đề bằng AI từng bước" onClick={() => onNavigate('guide')} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ Icon, label, value, delta, color, onClick }) {
  return (
    <button type="button" className="adl-stat" style={{ '--stat-color': color }} onClick={onClick}>
      <span className="adl-stat-ico"><Icon size={22} /></span>
      <div className="adl-stat-info">
        <small>{label}</small>
        <b>{value === null ? '—' : value.toLocaleString('vi-VN')}</b>
        {delta != null && (
          <span className={'adl-stat-trend' + (delta > 0 ? ' up' : '')}>
            {delta > 0 && <IconTrendUp size={12} />}
            {delta > 0 ? `+${delta.toLocaleString('vi-VN')} trong 7 ngày` : 'Không có mới trong 7 ngày'}
          </span>
        )}
      </div>
    </button>
  );
}

function ExamListPanel({ title, Icon, exams, ranked, showDate, onAll }) {
  return (
    <section className="adl-panel">
      <header className="adl-panel-head">
        <h3><Icon size={16} /><span>{title}</span></h3>
        <button type="button" className="adl-btn-sm" onClick={onAll}>Xem tất cả</button>
      </header>
      {exams.length === 0 ? (
        <p className="adl-empty">Chưa có dữ liệu</p>
      ) : (
        <ul className="adl-list">
          {exams.map((e, i) => (
            <li key={e.id} className="adl-list-item">
              {ranked && <span className="adl-rank">{i + 1}</span>}
              <div className="adl-list-info">
                <b>{e.title}</b>
                <small>
                  {[e.subject?.name, e.grade?.name, showDate ? formatDate(e.created_at) : null].filter(Boolean).join(' · ')}
                </small>
              </div>
              <span className="adl-list-value" title="Lượt làm">{(e.attempt_count || 0).toLocaleString('vi-VN')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuickAction({ Icon, color, title, sub, onClick }) {
  return (
    <button type="button" className="adl-quick-btn" onClick={onClick}>
      <span className="adl-quick-ico" style={{ background: color }}><Icon size={20} /></span>
      <div><b>{title}</b><small>{sub}</small></div>
    </button>
  );
}
