/* LeaderboardCard.jsx — bảng xếp hạng lớp cho HỌC SINH
   Kiểu trình bày: podium 3 hạng + danh sách 4–10 + ô "Hạng của bạn".
   Dữ liệu: document tổng hợp `class_leaderboard/{classId}` do giáo viên công bố.
   Không đọc bài nộp của người khác. */
import { useEffect, useState } from 'react';
import { getClassLeaderboard } from '../lib/classLeaderboardDoc.js';

const MEDAL = { 1: '#f59e0b', 2: '#94a3b8', 3: '#f97316' };
const initials = (name = '') => (name.trim().split(/\s+/).pop() || '?').charAt(0).toUpperCase();

export default function LeaderboardCard({ classId, className = '', uid = '', compact = false }) {
  const [state, setState] = useState({ loading: true, data: null, err: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!classId) { setState({ loading: false, data: null, err: '' }); return; }
      try {
        const data = await getClassLeaderboard(classId);
        if (alive) setState({ loading: false, data, err: '' });
      } catch (e) {
        if (alive) setState({ loading: false, data: null, err: e?.message || 'Không tải được bảng xếp hạng.' });
      }
    })();
    return () => { alive = false; };
  }, [classId]);

  const rows = state.data?.rows || [];
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, compact ? 7 : 10);
  const me = uid ? rows.find((r) => r.id === uid) : null;

  const card = {
    border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, background: '#fff',
    padding: compact ? '.8rem .85rem' : '1rem 1.1rem',
  };

  if (state.loading) {
    return <section style={card}><p style={{ margin: 0, fontSize: '.82rem', color: '#6b7280' }}>Đang tải bảng xếp hạng…</p></section>;
  }
  if (state.err) {
    return <section style={card}><p style={{ margin: 0, fontSize: '.82rem', color: '#b91c1c' }}>{state.err}</p></section>;
  }
  if (!rows.length) {
    return (
      <section style={card}>
        <h3 style={{ margin: 0, fontSize: '.95rem' }}>Bảng xếp hạng</h3>
        <p style={{ margin: '.45rem 0 0', fontSize: '.82rem', color: '#6b7280', lineHeight: 1.5 }}>
          Lớp {className || ''} chưa có bảng xếp hạng. Giáo viên sẽ công bố sau khi lớp có bài được chấm.
        </p>
      </section>
    );
  }

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Bảng xếp hạng</h3>
        <span style={{ fontSize: '.72rem', color: '#6b7280' }}>
          {className || state.data.className} · {state.data.totalRanked}/{state.data.totalStudents} học sinh có bài
          {state.data.classAvgPct != null ? ` · TB lớp ${state.data.classAvgPct}%` : ''}
        </span>
      </div>

      {/* Podium: 2 – 1 – 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', marginTop: '.7rem', alignItems: 'end' }}>
        {[1, 0, 2].map((idx) => {
          const r = top3[idx];
          if (!r) return <div key={idx} />;
          const first = r.rank === 1;
          return (
            <div
              key={r.id}
              style={{
                textAlign: 'center', padding: first ? '.9rem .4rem 1rem' : '.7rem .4rem .85rem',
                borderRadius: 16, border: '1px solid rgba(15,23,42,0.06)',
                background: first ? 'linear-gradient(180deg, #fde68a, #fbbf24)' : (r.rank === 2 ? '#eef2f7' : '#fdeee4'),
                boxShadow: first ? '0 6px 18px rgba(251,191,36,0.35)' : 'none',
              }}
            >
              <div
                style={{
                  width: first ? 54 : 44, height: first ? 54 : 44, borderRadius: '50%', margin: '0 auto .35rem',
                  display: 'grid', placeItems: 'center', background: MEDAL[r.rank], color: '#fff',
                  fontWeight: 800, fontSize: first ? '1.2rem' : '1rem',
                }}
              >
                {initials(r.name)}
              </div>
              <div style={{ fontSize: '.8rem', fontWeight: 700, lineHeight: 1.25 }}>{r.name}</div>
              <div style={{ fontSize: first ? '1.05rem' : '.92rem', fontWeight: 800, marginTop: '.15rem' }}>{r.points} điểm</div>
              <div style={{ fontSize: '.68rem', color: '#6b4b00', opacity: 0.8 }}>{r.attempts} bài · TB {r.avgPct}%</div>
            </div>
          );
        })}
      </div>

      {/* Hạng 4–10 */}
      {rest.length > 0 && (
        <ol style={{ listStyle: 'none', margin: '.75rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
          {rest.map((r) => (
            <li
              key={r.id}
              style={{
                display: 'grid', gridTemplateColumns: '28px 1fr auto auto', gap: '.5rem', alignItems: 'center',
                padding: '.35rem .5rem', borderRadius: 10, fontSize: '.84rem',
                background: r.id === uid ? 'rgba(37,99,235,0.08)' : 'transparent',
                borderBottom: '1px solid rgba(15,23,42,0.05)',
              }}
            >
              <b style={{ color: '#6b7280' }}>{r.rank}</b>
              <span style={{ fontWeight: r.id === uid ? 800 : 600 }}>
                {r.name}{r.id === uid ? ' (bạn)' : ''}
              </span>
              <span style={{ fontSize: '.72rem', color: '#6b7280' }}>{r.attempts} bài</span>
              <b style={{ fontVariantNumeric: 'tabular-nums' }}>{r.points}</b>
            </li>
          ))}
        </ol>
      )}

      {/* Hạng của bạn */}
      <div
        style={{
          marginTop: '.7rem', padding: '.55rem .7rem', borderRadius: 12,
          background: me ? 'rgba(37,99,235,0.08)' : 'rgba(15,23,42,0.04)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '.82rem', fontWeight: 700 }}>
          {me ? `Hạng của bạn: #${me.rank}` : 'Bạn chưa có trong bảng'}
        </span>
        <span style={{ fontSize: '.78rem', color: '#475569' }}>
          {me ? `${me.points} điểm · TB ${me.avgPct}% · ${me.attempts} bài`
            : 'Làm ít nhất 1 bài để được xếp hạng.'}
        </span>
      </div>

      <p style={{ margin: '.5rem 0 0', fontSize: '.7rem', color: '#94a3b8', lineHeight: 1.5 }}>
        Điểm = điểm trung bình các bài đã làm ×10. Cập nhật lần cuối bởi giáo viên
        {state.data.publishedAt ? ` ngày ${new Date(state.data.publishedAt).toLocaleDateString('vi-VN')}` : ''}.
      </p>
    </section>
  );
}
