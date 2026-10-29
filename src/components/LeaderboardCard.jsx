/* ============================================================
   LeaderboardCard.jsx — Bảng xếp hạng lớp học sinh (100% SVG, Dark Mode)
   ------------------------------------------------------------
   Chuẩn Apple Glassmorphism & visionOS:
     - Bục vinh danh Top 3 Podium (Vàng, Bạc, Đồng)
     - Avatar thông minh (tự động lọc hậu tố lớp 6A6, 11A7 để lấy đúng tên thật)
     - Hỗ trợ Chế độ Sáng / Tối hoàn hảo qua CSS tokens
     - Bộ lọc: Theo Điểm số · Theo Số bài đã làm
     - Thanh dính vị trí của bạn (Sticky User Standing)
   ============================================================ */
import { useEffect, useState, useMemo } from 'react';
import { getClassLeaderboard } from '../lib/classLeaderboardDoc.js';

/* Icon SVG sắc nét 100% */
const IcoTrophy = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const IcoCrown = ({ size = 18, color = '#ffd700' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IcoMedal = ({ size = 14, color = '#ffd700' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

/**
 * Trích xuất chữ cái đại diện thông minh:
 * Loại bỏ các hậu tố như "6A6", "11A7", "12A1", "Lớp 11" để lấy đúng chữ cái đầu của tên thật!
 * Ví dụ: "Bùi Tiến Phát 6A6" -> 'P' (Phát) thay vì '6'!
 */
export function getStudentInitials(name = '') {
  if (!name || typeof name !== 'string') return '?';
  const clean = name
    .replace(/\s*[\(\[]?[0-9]{1,2}[A-Za-z0-9\s_-]*[\)\]]?$/i, '')
    .trim();
  const target = clean || name.trim();
  const parts = target.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const lastName = parts[parts.length - 1];
  const match = lastName.match(/[a-zA-ZÀ-ỹ]/);
  return match ? match[0].toUpperCase() : lastName.charAt(0).toUpperCase();
}

export default function LeaderboardCard({ classId, className = '', uid = '', compact = false }) {
  const [state, setState] = useState({ loading: true, data: null, err: '' });
  const [sortMode, setSortMode] = useState('points'); // 'points' | 'attempts'

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

  const rawRows = state.data?.rows || [];

  const sortedRows = useMemo(() => {
    const list = [...rawRows];
    if (sortMode === 'attempts') {
      list.sort((a, b) => (b.attempts || 0) - (a.attempts || 0) || (b.points || 0) - (a.points || 0));
    } else {
      list.sort((a, b) => (b.points || 0) - (a.points || 0) || (b.attempts || 0) - (a.attempts || 0));
    }
    return list;
  }, [rawRows, sortMode]);

  const top3 = sortedRows.slice(0, 3);
  const rest = sortedRows.slice(3, compact ? 7 : 12);
  const me = uid ? sortedRows.find((r) => r.id === uid) : null;
  const myRank = me ? sortedRows.findIndex((r) => r.id === uid) + 1 : null;

  if (state.loading) {
    return (
      <section className="ap-lb-card">
        <div className="ap-loading" style={{ padding: '2rem 1rem' }}>
          <div className="ap-spinner" />
          <p>Đang đồng bộ bảng xếp hạng lớp…</p>
        </div>
      </section>
    );
  }

  if (state.err) {
    return (
      <section className="ap-lb-card">
        <p className="ap-err" style={{ margin: 0, justifyContent: 'center' }}>
          {state.err}
        </p>
      </section>
    );
  }

  if (!rawRows.length) {
    return (
      <section className="ap-lb-card ap-empty" style={{ padding: '2.5rem 1rem' }}>
        <IcoTrophy size={36} />
        <h3 style={{ margin: '0.6rem 0 0.3rem', fontSize: '1.05rem' }}>Bảng xếp hạng lớp</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--mut)', lineHeight: 1.5 }}>
          Lớp {className || ''} chưa công bố bảng xếp hạng. Giáo viên sẽ cập nhật điểm xếp hạng sau khi lớp hoàn thành các bài thi đầu tiên.
        </p>
      </section>
    );
  }

  return (
    <section className="ap-lb-card" aria-label="Bảng xếp hạng lớp">
      {/* HEADER BẢNG XẾP HẠNG */}
      <div className="ap-lb-header">
        <div>
          <div className="ap-lb-title-row">
            <span className="ap-lb-icon-box">
              <IcoTrophy size={16} />
            </span>
            <h3 className="ap-lb-title">Bảng xếp hạng vinh danh</h3>
          </div>
          <p className="ap-lb-subtitle">
            {className || state.data.className} · {state.data.totalRanked || rawRows.length}/{state.data.totalStudents || rawRows.length} học sinh có bài
            {state.data.classAvgPct != null ? ` · Điểm TB lớp ${state.data.classAvgPct}%` : ''}
          </p>
        </div>

        {/* Nút lọc sắp xếp */}
        <div className="ap-lb-sort-pills" role="group" aria-label="Lọc xếp hạng">
          <button
            type="button"
            className={sortMode === 'points' ? 'on' : ''}
            onClick={() => setSortMode('points')}
          >
            Theo Điểm số
          </button>
          <button
            type="button"
            className={sortMode === 'attempts' ? 'on' : ''}
            onClick={() => setSortMode('attempts')}
          >
            Chăm chỉ nhất
          </button>
        </div>
      </div>

      {/* BỤC VINH DANH TOP 3 PODIUM (Hạng 2 - Hạng 1 - Hạng 3) */}
      <div className="ap-lb-podium">
        {[1, 0, 2].map((idx) => {
          const r = top3[idx];
          if (!r) return <div key={idx} className="ap-lb-podium-slot empty" />;
          const rank = idx === 0 ? 1 : idx === 1 ? 2 : 3;
          const isGold = rank === 1;
          const isSilver = rank === 2;
          const isBronze = rank === 3;
          const isMe = r.id === uid;

          return (
            <div
              key={r.id}
              className={`ap-lb-podium-item rank-${rank} ${isMe ? 'is-me' : ''}`}
            >
              {isGold && (
                <div className="ap-lb-crown-badge" title="Quán quân lớp">
                  <IcoCrown size={22} color="#f59e0b" />
                </div>
              )}

              <div className={`ap-lb-podium-avatar rank-${rank}`}>
                {getStudentInitials(r.name)}
                <span className={`ap-lb-rank-badge rank-${rank}`}>{rank}</span>
              </div>

              <div className="ap-lb-podium-name" title={r.name}>
                {r.name}
                {isMe && <span className="ap-lb-me-tag">Bạn</span>}
              </div>

              <div className="ap-lb-podium-points">
                {r.points} <small>điểm</small>
              </div>

              <div className="ap-lb-podium-meta">
                <span>{r.attempts} bài</span>
                <span>·</span>
                <span>TB {r.avgPct}%</span>
              </div>

              <div className={`ap-lb-honor-tag rank-${rank}`}>
                {isGold ? 'Quán quân' : isSilver ? 'Á quân' : 'Quý quân'}
              </div>
            </div>
          );
        })}
      </div>

      {/* DANH SÁCH TOP 4–10 */}
      {rest.length > 0 && (
        <div className="ap-lb-list-wrap">
          <ol className="ap-lb-list">
            {rest.map((r, i) => {
              const displayRank = i + 4;
              const isMe = r.id === uid;
              return (
                <li
                  key={r.id}
                  className={`ap-lb-item ${isMe ? 'is-me' : ''}`}
                >
                  <span className="ap-lb-item-rank">{displayRank}</span>
                  <div className="ap-lb-item-info">
                    <span className="ap-lb-item-avatar">
                      {getStudentInitials(r.name)}
                    </span>
                    <span className="ap-lb-item-name">
                      {r.name}
                      {isMe && <span className="ap-lb-me-tag">Bạn</span>}
                    </span>
                  </div>
                  <span className="ap-lb-item-meta">{r.attempts} bài · TB {r.avgPct}%</span>
                  <span className="ap-lb-item-score">{r.points}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* THANH VỊ TRÍ CỦA TÔI (STICKY USER BAR) */}
      <div className={`ap-lb-me-bar ${me ? 'active' : ''}`}>
        <div className="ap-lb-me-left">
          <IcoMedal size={17} color={myRank && myRank <= 3 ? '#f59e0b' : '#3b82f6'} />
          <span>
            {me ? (
              <>
                Hạng của bạn: <b>#{myRank}</b>
                <span className="ap-lb-me-sub"> ({me.points} điểm · TB {me.avgPct}%)</span>
              </>
            ) : (
              'Bạn chưa có điểm trong bảng xếp hạng lớp'
            )}
          </span>
        </div>
        <div className="ap-lb-me-right">
          {me ? (
            myRank > 3 ? (
              <span className="ap-lb-cheer">
                {myRank <= 10 ? 'Tuyệt vời! Đang nằm trong Top 10' : `Cố lên! Làm thêm bài để tăng hạng`}
              </span>
            ) : (
              <span className="ap-lb-cheer top">Xuất sắc! Bạn đang trong Top 3 dẫn đầu!</span>
            )
          ) : (
            <span className="ap-lb-cheer">Hoàn thành bài tập để ghi danh</span>
          )}
        </div>
      </div>

      <div className="ap-lb-footer-note">
        Điểm = Điểm trung bình các bài đã nộp × 10 (thang 1000). Cập nhật lần cuối:
        {state.data?.publishedAt
          ? ` ${new Date(state.data.publishedAt).toLocaleDateString('vi-VN')}`
          : ' Gần đây'}
      </div>
    </section>
  );
}
