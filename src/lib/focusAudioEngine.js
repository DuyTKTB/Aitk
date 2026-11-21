/* ============================================================
   focusAudioEngine.js — Bộ phát âm thanh tập trung Web Audio API
   - Chạy hoàn toàn offline, 0 file MP3 nặng, chuyển kênh mượt
   - 5 kênh chuẩn học tập:
     1. binaural40 — Sóng 40Hz Gamma Binaural (200Hz trái / 240Hz phải)
     2. rain       — Tiếng mưa rơi dịu tai (Pink noise + lọc thông thấp)
     3. brown      — Thư viện đêm (Brown noise ấm khử ồn)
     4. waves      — Sóng biển nhịp thở (LFO chậm 0.12Hz)
     5. lofi       — Hợp âm Ambient êm dịu (Cmaj9 sine/triangle pad)
   ============================================================ */

export const FOCUS_SOUND_TRACKS = [
  { id: 'none', label: 'Tắt tiếng', short: 'Tắt' },
  { id: 'binaural40', label: '40Hz Binaural', short: '40Hz Focus' },
  { id: 'rain', label: 'Mưa rơi', short: 'Mưa rơi' },
  { id: 'brown', label: 'Thư viện đêm', short: 'Thư viện' },
  { id: 'waves', label: 'Sóng biển', short: 'Sóng biển' },
  { id: 'lofi', label: 'Ambient Pad', short: 'Ambient' },
];

class FocusAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.nodes = [];
    this.activeId = 'none';
    this.volume = 0.35;
  }

  _ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _createNoiseBuffer(ctx, color = 'pink') {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = buffer.getChannelData(0);
    if (color === 'brown') {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = (last + 0.02 * white) / 1.02;
        last = out[i];
        out[i] *= 3.2;
      }
    } else {
      let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  stop() {
    this.nodes.forEach((n) => {
      try { n.stop?.(); } catch { /* ignore */ }
      try { n.disconnect?.(); } catch { /* ignore */ }
    });
    this.nodes = [];
    this.activeId = 'none';
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol) || 0));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
  }

  play(trackId) {
    this.stop();
    if (!trackId || trackId === 'none') return;
    const ctx = this._ensureContext();
    if (!ctx || !this.masterGain) return;

    this.activeId = trackId;
    const out = this.masterGain;

    if (trackId === 'binaural40') {
      // 200Hz left ear, 240Hz right ear => 40Hz Gamma binaural beat
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.value = 200;
      oscR.frequency.value = 240;
      gainL.gain.value = 0.22;
      gainR.gain.value = 0.22;

      if (typeof ctx.createStereoPanner === 'function') {
        const panL = ctx.createStereoPanner();
        const panR = ctx.createStereoPanner();
        panL.pan.value = -0.9;
        panR.pan.value = 0.9;
        oscL.connect(gainL).connect(panL).connect(out);
        oscR.connect(gainR).connect(panR).connect(out);
        this.nodes.push(panL, panR);
      } else {
        oscL.connect(gainL).connect(out);
        oscR.connect(gainR).connect(out);
      }
      oscL.start();
      oscR.start();
      this.nodes.push(oscL, oscR, gainL, gainR);
      return;
    }

    if (trackId === 'rain' || trackId === 'brown' || trackId === 'waves') {
      const src = ctx.createBufferSource();
      src.buffer = this._createNoiseBuffer(ctx, trackId === 'brown' ? 'brown' : 'pink');
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = trackId === 'rain' ? 1100 : trackId === 'brown' ? 420 : 650;

      const gain = ctx.createGain();
      gain.gain.value = trackId === 'brown' ? 0.55 : 0.45;

      src.connect(filter).connect(gain).connect(out);

      if (trackId === 'waves') {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.12;
        lfoGain.gain.value = 0.22;
        lfo.connect(lfoGain).connect(gain.gain);
        lfo.start();
        this.nodes.push(lfo, lfoGain);
      }

      src.start();
      this.nodes.push(src, filter, gain);
      return;
    }

    if (trackId === 'lofi') {
      // Warm Cmaj9 soft ambient chord pad
      const freqs = [130.81, 196.0, 246.94, 293.66];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      filter.connect(out);
      this.nodes.push(filter);

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        g.gain.value = 0.09;
        osc.connect(g).connect(filter);
        osc.start();
        this.nodes.push(osc, g);
      });
    }
  }
}

export const focusAudio = new FocusAudioEngine();
