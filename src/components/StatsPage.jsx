/* ============================================================
   StatsPage.jsx — Thống kê học tập CÁ NHÂN (Apple style)
   ------------------------------------------------------------
   Nguồn: Supabase exam_attempts (kết quả thi đã hoàn thành)
   Thêm: phân tích môn yếu, đề xuất ôn tập, breakdown theo môn,
         streak + XP, recent activity, quick links khi trống.
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { useGamification } from '../hooks/useGamification.js';

const A = {
  page: { minHeight: '100dvh', background: 'var(--t-bg, #f4f6fb)', color: 'var(--t-ink, #0f172a)', fontFamily: 'var(--t-font-sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 860, margin: '0 auto', padding: '1.2rem 1rem 2.5rem' },
  card: { background: 'var(--t-surface-2, #fff)', border: '1px solid var(--t-border, rgba(100,120,180,.16))', borderRadius: 'var(--t-r-lg, 20px)', boxShadow: 'var(--t-shadow-sm)', padding: '1rem 1.1rem' },
  label: { font: '700 .64rem var(--t-font-sans)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-ink-faint, #94a3b8)' },
  statVal: { font: '800 1.4rem var(--t-font-sans)', fontVariantNumeric: 'tabular-nums' },
};

const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const IC = {
  zap: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  fire: 'M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-7 0 2 1 3 2 3 0-2 0-4 0-6z',
  book: 'M4 4h6v16H4zM14 4h6v16h-6z',
  target: 'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 12h.01',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  alert: 'M12 9v4M12 17h.01M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z',
  check: 'M9 12l2 2 4-4M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z',
  play: 'M5 3l14 9-14 9V3z',
};

const pctFmt = (v) => `${Math.round(v)}%`;

export default function StatsPage() {
  const { user } = useAuth();
  const gamif = useGamification();
  const uid = user?.uid || user?.id;
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('exam_attempts')
          .select(`
            id, score, correct_count, wrong_count, blank_count,
            total_questions, time_spent, started_at, mode,
            exam:exams(id, title, subject:subjects(name, code), grade:grades(name))
          `)
          .eq('user_id', uid)
          .eq('is_completed', true)
          .order('started_at', { ascending: false })
          .limit(200);
        if (alive) setAttempts(data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [uid]);

  const stats = useMemo(() => {
    if (!attempts.length) return null;
    const total = attempts.length;
    const scores = attempts.map((a) => Math.round(((a.correct_count || 0) / (a.total_questions || 1)) * 100));
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / total);
    const best = Math.max(...scores);
    const correctTotal = attempts.reduce((s, a) => s + (a.correct_count || 0), 0);
    const questionTotal = attempts.reduce((s, a) => s + (a.total_questions || 0), 0);
    const accuracy = questionTotal ? Math.round((correctTotal / questionTotal) * 100) : 0;

    const bySubject = {};
    attempts.forEach((a) => {
      const subj = a.exam?.subject?.name || 'Khác';
      if (!bySubject[subj]) bySubject[subj] = { count: 0, sum: 0, best: 0 };
      const pct = Math.round(((a.correct_count || 0) / (a.total_questions || 1)) * 100);
      bySubject[subj].count++;
      bySubject[subj].sum += pct;
      bySubject[subj].best = Math.max(bySubject[subj].best, pct);
    });
    const subjects = Object.entries(bySubject)
      .map(([name, d]) => ({ name, avg: Math.round(d.sum / d.count), count: d.count, best: d.best }))
      .sort((a, b) => b.count - a.count);

    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayAttempts = attempts.filter((a) => (a.started_at || '').slice(0, 10) === key);
      const dayAvg = dayAttempts.length
        ? Math.round(dayAttempts.reduce((s, a) => s + Math.round(((a.correct_count || 0) / (a.total_questions || 1)) * 100), 0) / dayAttempts.length)
        : null;
      days.push({ label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()], value: dayAvg, count: dayAttempts.length });
    }

    const weakSubjects = subjects.filter((s) => s.avg < 50 && s.count >= 1);
    const strongSubjects = subjects.filter((s) => s.avg >= 70);
    const recent = scores.slice(0, 3);
    const trend = recent.length >= 2 ? (recent[0] >= recent[1] ? 'up' : 'down') : null;

    return { total, avg, best, accuracy, subjects, days, weakSubjects, strongSubjects, trend, correctTotal, questionTotal };
  }, [attempts]);

  const hasData = stats && stats.total > 0;

  if (loading) {
    return (
      <div style={A.page}>
        <div style={{ ...A.wrap, textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--t-border)', borderTopColor: 'var(--t-accent, #5b6cff)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--t-ink-muted, #64748b)', font: '600 .88rem var(--t-font-sans)' }}>Đang tải thống kê…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={A.page}>
      <div style={A.wrap}>
        <div style={{ marginBottom: '1.2rem' }}>
          <h1 style={{ margin: 0, font: '800 1.4rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Thống kê của tôi</h1>
          <p style={{ margin: '.15rem 0 0', color: 'var(--t-ink-muted, #64748b)', font: '500 .84rem var(--t-font-sans)' }}>
            Tiến độ học tập, điểm mạnh và điểm yếu
          </p>
        </div>

        {!hasData ? (
          <div style={{ ...A.card, textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--t-accent-subtle, rgba(91,108,255,.1))', color: 'var(--t-accent, #5b6cff)', display: 'grid', placeItems: 'center', margin: '0 auto .8rem' }}>
              <Ico d={IC.trend} size={30} />
            </div>
            <h2 style={{ margin: '0 0 .4rem', font: '800 1.15rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Bắt đầu hành trình học tập</h2>
            <p style={{ margin: '0 auto 1rem', color: 'var(--t-ink-muted, #64748b)', font: '500 .88rem var(--t-font-sans)', maxWidth: 380, lineHeight: 1.55 }}>
              Thống kê sẽ hiện ra sau khi bạn hoàn thành bài kiểm tra hoặc đề thi đầu tiên.
            </p>
            <div style={{ display: 'grid', gap: '.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', maxWidth: 480, margin: '0 auto 1rem' }}>
              {[
                { icon: IC.book, label: 'Ôn tập', hash: '#quiz' },
                { icon: IC.target, label: 'Thi thử', hash: '#exam' },
                { icon: IC.zap, label: 'Hỏi AI', hash: '#ai' },
                { icon: IC.play, label: 'Trò chơi', hash: '#games' },
              ].map((q) => (
                <a key={q.label} href={q.hash} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
                  padding: '.9rem .7rem', borderRadius: 'var(--t-r-md, 14px)',
                  border: '1px solid var(--t-border)', background: 'var(--t-surface-3, #f8fafc)',
                  textDecoration: 'none', color: 'var(--t-ink)', font: '600 .8rem var(--t-font-sans)',
                  transition: 'border-color .15s, transform .15s',
                }}>
                  <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--t-accent-subtle)', color: 'var(--t-accent)', display: 'grid', placeItems: 'center' }}>
                    <Ico d={q.icon} size={17} />
                  </span>
                  {q.label}
                </a>
              ))}
            </div>
            <p style={{ margin: 0, color: 'var(--t-ink-faint, #94a3b8)', font: '500 .76rem var(--t-font-sans)' }}>
              Mẹo: làm bài ôn tập hàng ngày để tăng streak và XP
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '.8rem' }}>
              <div style={{ ...A.card, display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.9rem 1.1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'var(--t-accent, #5b6cff)', color: 'var(--t-accent-ink, #fff)', display: 'grid', placeItems: 'center', font: '800 1.1rem var(--t-font-sans)' }}>
                  {gamif?.level || 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...A.label, marginBottom: '.2rem' }}>Cấp độ</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem' }}>
                    <b style={{ font: '800 1.2rem var(--t-font-sans)', color: 'var(--t-ink)' }}>{gamif?.xp || 0}</b>
                    <small style={{ color: 'var(--t-ink-muted)', font: '600 .74rem var(--t-font-sans)' }}>XP</small>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: 'var(--t-surface-3)', overflow: 'hidden', marginTop: '.25rem' }}>
                    <div style={{ width: `${Math.min(100, ((gamif?.xp || 0) % 100))}%`, height: '100%', background: 'var(--t-accent)', borderRadius: 'inherit' }} />
                  </div>
                  <small style={{ color: 'var(--t-ink-faint)', font: '500 .68rem var(--t-font-sans)' }}>
                    {100 - ((gamif?.xp || 0) % 100)} XP đến cấp {(gamif?.level || 1) + 1}
                  </small>
                </div>
              </div>
              <div style={{ ...A.card, display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.9rem 1.1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'var(--t-status-warn-subtle, #fef3c7)', color: 'var(--t-status-warn, #d97706)', display: 'grid', placeItems: 'center' }}>
                  <Ico d={IC.fire} size={26} />
                </div>
                <div>
                  <div style={{ ...A.label, marginBottom: '.2rem' }}>Chuỗi học</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem' }}>
                    <b style={{ font: '800 1.4rem var(--t-font-sans)', color: 'var(--t-ink)' }}>{gamif?.streak || 0}</b>
                    <small style={{ color: 'var(--t-ink-muted)', font: '600 .78rem var(--t-font-sans)' }}>ngày</small>
                  </div>
                  <small style={{ color: 'var(--t-ink-faint)', font: '500 .7rem var(--t-font-sans)' }}>Chuỗi học liên tiếp</small>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginBottom: '.8rem' }}>
              {[
                { label: 'Tổng lượt làm', value: stats.total, color: 'var(--t-accent)' },
                { label: 'Điểm trung bình', value: pctFmt(stats.avg), color: 'var(--t-accent)' },
                { label: 'Điểm cao nhất', value: pctFmt(stats.best), color: 'var(--t-status-ok)' },
                { label: 'Tỉ lệ đúng', value: pctFmt(stats.accuracy), color: 'var(--t-status-ok)' },
              ].map((s) => (
                <div key={s.label} style={{ ...A.card, padding: '.75rem .85rem' }}>
                  <div style={{ ...A.label, marginBottom: '.25rem' }}>{s.label}</div>
                  <b style={{ ...A.statVal, color: s.color }}>{s.value}</b>
                </div>
              ))}
            </div>

            <div style={{ ...A.card, marginBottom: '.8rem', padding: '1rem 1.1rem' }}>
              <div style={{ ...A.label, marginBottom: '.6rem' }}>7 ngày gần đây</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.3rem', height: 100 }}>
                {stats.days.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem' }}>
                    {d.value != null && <small style={{ font: '700 .64rem var(--t-font-sans)', color: 'var(--t-accent)' }}>{d.value}%</small>}
                    <div style={{
                      flex: 1, width: '100%', maxWidth: 42, borderRadius: '6px 6px 0 0',
                      background: d.value != null ? 'var(--t-accent, #5b6cff)' : 'var(--t-surface-3)',
                      opacity: d.value != null ? 0.85 : 0.5,
                      minHeight: d.value != null ? Math.max(4, (d.value / 100) * 80) : 3,
                      transition: 'height .3s ease',
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '.3rem', marginTop: '.3rem' }}>
                {stats.days.map((d, i) => (
                  <small key={i} style={{ flex: 1, textAlign: 'center', font: '600 .62rem var(--t-font-sans)', color: 'var(--t-ink-faint)' }}>{d.label}</small>
                ))}
              </div>
            </div>

            {stats.subjects.length > 0 && (
              <div style={{ ...A.card, marginBottom: '.8rem', padding: '1rem 1.1rem' }}>
                <div style={{ ...A.label, marginBottom: '.6rem' }}>Hiệu suất theo môn</div>
                <div style={{ display: 'grid', gap: '.5rem' }}>
                  {stats.subjects.map((s) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                      <b style={{ font: '600 .82rem var(--t-font-sans)', color: 'var(--t-ink)', minWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</b>
                      <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'var(--t-surface-3)', overflow: 'hidden' }}>
                        <div style={{ width: `${s.avg}%`, height: '100%', borderRadius: 'inherit', background: s.avg >= 70 ? 'var(--t-status-ok)' : s.avg >= 50 ? 'var(--t-status-warn)' : 'var(--t-status-err)', transition: 'width .3s ease' }} />
                      </div>
                      <small style={{ font: '700 .78rem var(--t-font-sans)', color: 'var(--t-ink)', minWidth: 34, textAlign: 'right' }}>{s.avg}%</small>
                      <small style={{ font: '500 .68rem var(--t-font-sans)', color: 'var(--t-ink-faint)', minWidth: 30 }}>{s.count} lượt</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.weakSubjects.length > 0 && (
              <div style={{ ...A.card, marginBottom: '.8rem', padding: '1rem 1.1rem', borderLeft: '3px solid var(--t-status-warn, #d97706)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', marginBottom: '.5rem' }}>
                  <Ico d={IC.alert} size={16} />
                  <b style={{ font: '800 .85rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Cần ôn tập thêm</b>
                </div>
                <div style={{ display: 'grid', gap: '.35rem' }}>
                  {stats.weakSubjects.map((s) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', font: '500 .82rem var(--t-font-sans)', color: 'var(--t-ink-2, #334155)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--t-status-warn)', flexShrink: 0 }} />
                      <b>{s.name}</b>
                      <span>— điểm TB {s.avg}% ({s.count} lượt làm)</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '.55rem' }}>
                  <a href="#quiz" style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem 1rem', borderRadius: 'var(--t-r-pill)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)', font: '600 .8rem var(--t-font-sans)', textDecoration: 'none' }}>
                    <Ico d={IC.play} size={13} /> Ôn tập ngay
                  </a>
                </div>
              </div>
            )}

            {stats.strongSubjects.length > 0 && (
              <div style={{ ...A.card, marginBottom: '.8rem', padding: '1rem 1.1rem', borderLeft: '3px solid var(--t-status-ok, #16a34a)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', marginBottom: '.4rem' }}>
                  <Ico d={IC.check} size={16} />
                  <b style={{ font: '800 .85rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Môn mạnh của bạn</b>
                </div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {stats.strongSubjects.map((s) => (
                    <span key={s.name} style={{ padding: '.25rem .65rem', borderRadius: 999, font: '600 .76rem var(--t-font-sans)', background: 'var(--t-status-ok-subtle, #dcfce7)', color: 'var(--t-status-ok, #16a34a)' }}>
                      {s.name} {s.avg}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ ...A.card, padding: '1rem 1.1rem' }}>
              <div style={{ ...A.label, marginBottom: '.55rem' }}>Lịch sử gần đây</div>
              <div style={{ display: 'grid', gap: '.35rem' }}>
                {attempts.slice(0, 10).map((a, i) => {
                  const pct = Math.round(((a.correct_count || 0) / (a.total_questions || 1)) * 100);
                  const good = pct >= 70;
                  const subj = a.exam?.subject?.name || '';
                  return (
                    <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.6rem .3rem', borderTop: i > 0 ? '1px solid var(--t-border-subtle)' : 'none' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 'var(--t-r-md, 12px)', flexShrink: 0, display: 'grid', placeItems: 'center', font: '800 .82rem var(--t-font-sans)', background: good ? 'var(--t-status-ok-subtle, #dcfce7)' : pct >= 40 ? 'var(--t-status-warn-subtle, #fef3c7)' : 'var(--t-status-err-subtle, #fee2e2)', color: good ? 'var(--t-status-ok)' : pct >= 40 ? 'var(--t-status-warn)' : 'var(--t-status-err)' }}>
                        {pct}%
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ font: '600 .82rem var(--t-font-sans)', color: 'var(--t-ink)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.exam?.title || 'Đề thi'}
                        </b>
                        <small style={{ color: 'var(--t-ink-muted)', font: '500 .7rem var(--t-font-sans)' }}>
                          {subj}{subj && ' · '}{a.correct_count}/{a.total_questions} đúng · {new Date(a.started_at).toLocaleDateString('vi-VN')}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
