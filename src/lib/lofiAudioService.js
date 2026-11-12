/* ============================================================
   lofiAudioService.js — Trình phát Nhạc Lofi & Âm thanh thư giãn
   100% Thuần Web Audio API (Không tải file ngoài, không bản quyền)
   ============================================================ */

class LofiAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentMode = 'lofi'; // 'lofi' | 'rain' | 'lab'
    this.volume = 0.35;
    this.gainNode = null;
    this.loopTimer = null;
    this.noiseNode = null;
    this.listeners = [];
  }

  addListener(cb) {
    if (typeof cb === 'function') {
      this.listeners.push(cb);
      cb({ isPlaying: this.isPlaying, mode: this.currentMode, volume: this.volume });
    }
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== cb);
    };
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb({ isPlaying: this.isPlaying, mode: this.currentMode, volume: this.volume });
      } catch {}
    });
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  /* ---- Chế độ 1: Lofi Synth Chord Chime êm ái ---- */
  playLofiChord() {
    if (!this.isPlaying || !this.ctx || this.currentMode !== 'lofi') return;

    // Các hợp âm ấm áp Lofi (Fmaj7, Cmaj7, Am9, Dm7)
    const chordSets = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [196.00, 246.94, 293.66, 369.99], // Gmaj7 (G3, B3, D4, F#4)
    ];

    const chord = chordSets[Math.floor(Math.random() * chordSets.length)];
    const now = this.ctx.currentTime;

    // Filter lofi ấm áp loại bỏ dải tần cao sắc nhọn
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.connect(this.gainNode);

    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.12, now + 0.3 + i * 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now + i * 0.05);
      osc.stop(now + 4.2);
    });

    this.loopTimer = setTimeout(() => {
      this.playLofiChord();
    }, 4500);
  }

  /* ---- Chế độ 2: Tiếng Mưa Rơi Dịu Êm (Rain Ambient) ---- */
  startRain() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start(0);

    this.noiseNode = whiteNoise;
  }

  /* ---- Chế độ 3: Phòng Thí Nghiệm ASMR (Lab Bubble Pops) ---- */
  playLabBubble() {
    if (!this.isPlaying || !this.ctx || this.currentMode !== 'lab') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 300 + Math.random() * 400;
    const endFreq = startFreq + 150 + Math.random() * 200;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.1);

    const nextDelay = 300 + Math.random() * 900;
    this.loopTimer = setTimeout(() => {
      this.playLabBubble();
    }, nextDelay);
  }

  stopAll() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch { /* ignore */ }
      this.noiseNode = null;
    }
  }

  start(mode = 'lofi') {
    this.initContext();
    this.stopAll();
    this.currentMode = mode;
    this.isPlaying = true;

    if (mode === 'lofi') {
      this.playLofiChord();
    } else if (mode === 'rain') {
      this.startRain();
    } else if (mode === 'lab') {
      this.playLabBubble();
    }
    this.notify();
  }

  stop() {
    this.isPlaying = false;
    this.stopAll();
    this.notify();
  }

  toggle(mode = null) {
    if (mode && mode !== this.currentMode) {
      this.start(mode);
      return true;
    }
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    this.start(this.currentMode || 'lofi');
    return true;
  }
}

export const lofiAudio = new LofiAudioEngine();
