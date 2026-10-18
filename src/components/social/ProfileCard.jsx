/* ============================================================
   ProfileCard.jsx — Thẻ hồ sơ công khai (Apple style)
   Xem: tên, VIP, thống kê học tập — Kết bạn / Nhắn tin
   ============================================================ */
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getProfile, friendStatus, sendFriendRequest, acceptFriendRequest, openDm } from '../../lib/social.js';
import { TIERS } from '../../lib/tier.js';
import VerifiedBadge from '../VerifiedBadge.jsx';
import './social.css';

const Svg = ({ d, size = 18, sw = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={fill === 'none' ? 'currentColor' : 'none'}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  chat: 'M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-4.9A8.5 8.5 0 1 1 21 11.5z',
  add: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  zap: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  fire: 'M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-7 0 2 1 3 2 3 0-2 0-4 0-6z',
  target: 'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  star: 'M12 3l2.4 5.4 5.6.6-4.2 3.9 1.2 5.6L12 15.6 7.4 18.5l1.2-5.6L4.4 9l5.6-.6z',
};

export default function ProfileCard({ targetUid, fallbackName = '', onClose, onOpenDm }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!targetUid) return;
    let alive = true;
    setProfile(null); setStatus('loading'); setNote('');
    (async () => {
      try {
        const [p, st] = await Promise.all([
          getProfile(targetUid),
          user ? friendStatus(user.uid, targetUid) : Promise.resolve('none'),
        ]);
        if (!alive) return;
        setProfile(p);
        setStatus(st);
      } catch {
        if (!alive) return;
        setStatus('none');
      }
    })();
    return () => { alive = false; };
  }, [targetUid, user?.uid]);

  if (!targetUid) return null;
  const isMe = user?.uid === targetUid;
  const anonymous = !targetUid || targetUid === 'anonymous';
  const isVip = !!profile?.vip || profile?.tier === 'vip';
  const tier = isVip ? TIERS.vip : TIERS.free;
  const pub = profile?.public;
  const name = profile?.name || fallbackName || 'Học sinh ẩn danh';

  const doFriend = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (status === 'incoming') {
        await acceptFriendRequest(user, { uid: targetUid, name: profile?.name || fallbackName });
        setStatus('friends');
        setNote('Đã kết bạn!');
      } else if (status === 'none') {
        const r = await sendFriendRequest(user, targetUid, profile?.name || fallbackName);
        setStatus(r === 'accepted' ? 'friends' : 'requested');
        setNote(r === 'accepted' ? 'Đã kết bạn!' : 'Đã gửi lời mời kết bạn');
      }
    } catch (e) {
      setNote(e.message || 'Lỗi kết bạn');
    } finally {
      setBusy(false);
      setTimeout(() => setNote(''), 2500);
    }
  };

  const doDm = async () => {
    if (!user || busy || isMe) return;
    setBusy(true);
    try {
      const { id } = await openDm(user, targetUid, profile?.name || fallbackName);
      onOpenDm?.(id, profile?.name || fallbackName);
      onClose();
    } catch (e) {
      setNote(e.message || 'Lỗi mở hội thoại');
      setTimeout(() => setNote(''), 3000);
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { Icon: P.zap, label: 'Cấp độ', value: pub?.level ?? '—', color: '#5b6cff' },
    { Icon: P.star, label: 'XP', value: pub?.xp != null ? pub.xp : '—', color: '#f59e0b' },
    { Icon: P.fire, label: 'Streak', value: pub?.streak != null ? `${pub.streak} ngày` : '—', color: '#f97316' },
    { Icon: P.target, label: 'Chính xác', value: pub?.accuracy != null ? `${pub.accuracy}%` : '—', color: '#16a34a' },
  ];

  return (
    <div className="pc-overlay" onClick={onClose} role="dialog" aria-label="Hồ sơ người dùng">
      <div className="pc-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pc-close" onClick={onClose} aria-label="Đóng"><Svg d={P.x} size={16} /></button>

        <div className="pc-head">
          <span className="pc-avatar" style={(() => {
            const GRAD = [
              ['#007aff','#5856d6'], ['#34c759','#30d158'],
              ['#ff9f0a','#ff6b00'], ['#ff375f','#ff2d55'],
              ['#5856d6','#af52de'], ['#32ade6','#007aff'],
            ];
            const [c1, c2] = GRAD[(targetUid?.charCodeAt(0) || 0) % GRAD.length];
            return { background: `linear-gradient(135deg,${c1},${c2})` };
          })()}>
            {profile?.photoURL
              ? <img src={profile.photoURL} alt="" referrerPolicy="no-referrer" />
              : <span>{(name[0] || '?').toUpperCase()}</span>}
          </span>
          <div className="pc-id">
            <h3>{name}<VerifiedBadge uid={targetUid} size={14} /></h3>
            <span className={'pc-tier' + (isVip ? ' vip' : '')}>
              <Svg d={tier.key === 'vip' ? P.star : P.user} size={11} fill={tier.key === 'vip' ? 'currentColor' : 'none'} />
              {tier.name}
            </span>
          </div>
        </div>

        <div className="pc-section-label">Chế độ học tập</div>
        <div className="pc-stats">
          {stats.map((s) => (
            <div key={s.label} className="pc-stat">
              <span style={{ color: s.color }}><Svg d={s.Icon} size={15} /></span>
              <b>{s.value}</b>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
        {anonymous ? (
          <p className="pc-hint">Người này đang chat ẩn danh (chưa đăng nhập) nên chưa có hồ sơ. Hỏi bạn ấy đăng ký tài khoản để kết bạn & xem hồ sơ nhé!</p>
        ) : (
          <>
            {!pub && !isMe && (
              <p className="pc-hint">Bạn ấy chưa đồng bộ thống kê học tập — khi bạn ấy mở chat lần nữa sẽ hiện ra.</p>
            )}
            {isMe && <p className="pc-hint">Đây là hồ sơ của bạn.</p>}
          </>
        )}

        {!isMe && !anonymous && (
          <div className="pc-actions">
            {status === 'friends' ? (
              <span className="pc-friend-ok"><Svg d={P.check} size={14} /> Bạn bè</span>
            ) : status === 'requested' ? (
              <span className="pc-friend-wait">Đã gửi lời mời</span>
            ) : (
              <button type="button" className="pc-btn" onClick={doFriend} disabled={!user || busy}>
                <Svg d={status === 'incoming' ? P.check : P.add} size={14} />
                {status === 'incoming' ? 'Chấp nhận lời mời' : 'Kết bạn'}
              </button>
            )}
            <button type="button" className="pc-btn primary" onClick={doDm} disabled={!user || busy}>
              <Svg d={P.chat} size={14} /> Nhắn tin
            </button>
          </div>
        )}
        {note && <p className="pc-note">{note}</p>}
      </div>
    </div>
  );
}
