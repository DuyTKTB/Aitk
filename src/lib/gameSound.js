/* ============================================================
   gameSound — Âm thanh game dùng Web Audio API
   Không cần file mp3. Tự sinh tone đơn giản.
   Có sẵn 8 hiệu ứng: correct, wrong, click, tick, win, lose,
   bubble, pop.
   ============================================================ */

let ctx = null;

const ensureCtx = () => {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

const tone = (freq, dur = 0.12, type = 'sine', vol = 0.25) => {
  const c = ensureCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch {}
};

export const sound = {
  /* ===== UI CƠ BẢN ===== */
  click: () => tone(660, 0.04, 'square', 0.12),
  tick: () => tone(1000, 0.02, 'sine', 0.08),

  /* ===== ĐÚNG / SAI ===== */
  correct: () => {
    tone(880, 0.1);
    setTimeout(() => tone(1320, 0.15), 90);
  },
  wrong: () => tone(220, 0.22, 'sawtooth', 0.2),

  /* ===== KẾT THÚC ===== */
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => tone(f, 0.18), i * 130)
    );
  },
  lose: () => {
    [392, 330, 262].forEach((f, i) =>
      setTimeout(() => tone(f, 0.25, 'sine', 0.2), i * 150)
    );
  },

  /* ===== VIRTUAL LAB ===== */
  /** Tiếng bong bóng khí sủi lên — random tần số cho tự nhiên */
  bubble: () => tone(400 + Math.random() * 200, 0.06, 'sine', 0.08),

  /** Tiếng nổ nhỏ khi có lửa — tần số cao tụt xuống thấp */
  pop: () => {
    tone(1200, 0.05, 'triangle', 0.15);
    setTimeout(() => tone(300, 0.12, 'sawtooth', 0.12), 40);
  },
};