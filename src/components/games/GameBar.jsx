import { useEffect, useState } from 'react';
import { GIcon } from './GameIcons';
import { canMute, setMuted, useMuted } from '../../lib/gameAudio';

/* ============================================================
   GameBar — hàng nút nhỏ: Tạm dừng · Tắt tiếng · Toàn màn hình
   Phím tắt:  P = tạm dừng,  M = tắt tiếng,  F = toàn màn hình
   Truyền onTogglePause để hiện nút tạm dừng (game nào chưa hỗ trợ thì bỏ trống).
   ============================================================ */

const typing = (el) => !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

export default function GameBar({ paused = false, onTogglePause, className = '' }) {
  const muted = useMuted();
  const fsSupported = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const sync = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    sync();
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFs = () => {
    if (!fsSupported) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === 'p' && onTogglePause) { e.preventDefault(); onTogglePause(); }
      else if (k === 'm' && canMute()) { setMuted(!muted); }
      else if (k === 'f' && fsSupported) { toggleFs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // chạy lại mỗi lần render để luôn thấy muted / onTogglePause mới nhất

  return (
    <div className={('gx-bar ' + className).trim()} role="toolbar" aria-label="Điều khiển trò chơi">
      {onTogglePause && (
        <button type="button" className="gx-btn" onClick={onTogglePause} aria-pressed={paused} title="Tạm dừng (P)">
          <GIcon name={paused ? 'play' : 'pause'} />
          <span>{paused ? 'Tiếp tục' : 'Tạm dừng'}</span>
        </button>
      )}
      {canMute() && (
        <button type="button" className="gx-btn" onClick={() => setMuted(!muted)} aria-pressed={muted} title="Tắt/bật âm thanh (M)">
          <GIcon name={muted ? 'volumeOff' : 'volume'} />
          <span>{muted ? 'Đã tắt tiếng' : 'Âm thanh'}</span>
        </button>
      )}
      {fsSupported && (
        <button type="button" className="gx-btn" onClick={toggleFs} aria-pressed={isFs} title="Toàn màn hình (F)">
          <GIcon name={isFs ? 'shrink' : 'expand'} />
          <span>{isFs ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      )}
    </div>
  );
}
