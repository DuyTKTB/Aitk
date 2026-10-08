/* ============================================================
   gameAudio.js — Tắt/bật tiếng cho mọi game mà không cần sửa gameSound.js
   Bọc từng hàm của `sound` (correct, wrong, click, win, lose, ...) bằng một
   lớp kiểm tra "đang tắt tiếng". Trạng thái lưu ở localStorage 'cs-game:muted'.
   Nếu `sound` bị đóng băng (không bọc được) thì canMute() trả về false và
   nút tắt tiếng tự ẩn.
   ============================================================ */
import { useSyncExternalStore } from 'react';
import { sound } from './gameSound';

const KEY = 'cs-game:muted';
const listeners = new Set();

let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* bỏ qua */ }

let wrapped = false;
let supported = true;

function wrapOnce() {
  if (wrapped) return;
  wrapped = true;
  try {
    for (const k of Object.keys(sound)) {
      const orig = sound[k];
      if (typeof orig !== 'function') continue;
      sound[k] = (...args) => (muted ? undefined : orig.apply(sound, args));
    }
  } catch {
    supported = false;
  }
}
wrapOnce(); // bọc ngay khi module được nạp, trước mọi lần phát âm thanh

export const canMute = () => supported;
export const isMuted = () => muted;

export function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* bỏ qua */ }
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function useMuted() {
  return useSyncExternalStore(subscribe, isMuted, () => false);
}
