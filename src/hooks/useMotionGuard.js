/* useMotionGuard.js — phát hiện nhấc / giơ / lắc điện thoại khi đang thi (cảm biến chuyển động)
   Đặt tại: src/hooks/useMotionGuard.js
   - Chỉ chạy trên thiết bị cảm ứng có cảm biến; máy tính để bàn tự bỏ qua.
   - iOS 13+ bắt buộc xin quyền trong lúc người dùng bấm nút → gọi requestMotionPermission() ở nút "Bắt đầu làm bài".
   - Khi phát hiện: gọi onLift(info) — ExamJoin sẽ ghi vi phạm 'hard' + chụp ảnh bằng chứng gửi giáo viên.
   -------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react';

export async function requestMotionPermission() {
  try {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') return false;
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      return (await DeviceMotionEvent.requestPermission()) === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

const isTouchDevice = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches;

export default function useMotionGuard({
  active,
  onLift,
  accelThreshold = 14,   // m/s² (không tính trọng lực) — cầm tay bình thường < 4
  rotThreshold = 280,    // °/s
  tiltDeg = 45,          // đổi góc nghiêng ≥ 45° trong 1,5 giây
  cooldownMs = 10000,
  warmupMs = 3000,
}) {
  const cbRef = useRef(onLift);
  cbRef.current = onLift;

  useEffect(() => {
    if (!active || !isTouchDevice() || typeof window === 'undefined') return undefined;

    const startedAt = Date.now();
    let lastFire = 0;
    const hits = [];
    const tilts = [];

    const fire = (reason, info) => {
      const now = Date.now();
      if (now - startedAt < warmupMs || now - lastFire < cooldownMs) return;
      lastFire = now;
      try { cbRef.current?.({ reason, ...info }); } catch { /* */ }
    };

    const onMotion = (e) => {
      const a = e.acceleration;
      let am = 0;
      if (a && a.x != null) am = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      else if (e.accelerationIncludingGravity) {
        const g = e.accelerationIncludingGravity;
        am = Math.abs(Math.hypot(g.x || 0, g.y || 0, g.z || 0) - 9.8);
      }
      const r = e.rotationRate;
      const rm = r ? Math.hypot(r.alpha || 0, r.beta || 0, r.gamma || 0) : 0;
      const now = Date.now();
      if (am > accelThreshold || rm > rotThreshold) hits.push(now);
      while (hits.length && now - hits[0] > 800) hits.shift();
      if (hits.length >= 3) {
        hits.length = 0;
        fire('shake', { accel: Math.round(am * 10) / 10, rot: Math.round(rm) });
      }
    };

    const onOrient = (e) => {
      if (e.beta == null) return;
      const now = Date.now();
      tilts.push({ t: now, b: e.beta });
      while (tilts.length && now - tilts[0].t > 1500) tilts.shift();
      const delta = Math.abs(e.beta - tilts[0].b);
      if (delta >= tiltDeg) {
        tilts.length = 0;
        fire('raised', { tilt: Math.round(delta) });
      }
    };

    window.addEventListener('devicemotion', onMotion);
    window.addEventListener('deviceorientation', onOrient);
    return () => {
      window.removeEventListener('devicemotion', onMotion);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, [active, accelThreshold, rotThreshold, tiltDeg, cooldownMs, warmupMs]);
}
