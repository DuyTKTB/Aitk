/* ============================================================
   focusAudioEngine.js — Bộ trộn Âm thanh Tập trung Web Audio API (12 Kênh Đa Lớp)
   - Chạy hoàn toàn offline, 0 file MP3 nặng, hỗ trợ MIX ĐA LỚP cùng lúc với YouTube
   - Phân nhóm chuẩn 9Study: Thiên nhiên · Góc làm việc · Đô thị
   ============================================================ */

export const FOCUS_NOISE_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'nature', label: 'Thiên nhiên' },
  { id: 'workspace', label: 'Góc làm việc' },
  { id: 'urban', label: 'Đô thị' },
];

export const FOCUS_SOUND_TRACKS = [
  { id: 'none', label: 'Tắt tiếng', short: 'Tắt', category: 'all' },
  { id: 'rain', label: 'Mưa rơi', short: 'Mưa rơi', category: 'nature' },
  { id: 'fireplace', label: 'Lửa trại ấm', short: 'Lửa trại', category: 'nature' },
  { id: 'waves', label: 'Sóng biển', short: 'Sóng biển', category: 'nature' },
  { id: 'stream', label: 'Suối chảy', short: 'Suối chảy', category: 'nature' },
  { id: 'wind', label: 'Gió thổi nhẹ', short: 'Gió thổi', category: 'nature' },
  { id: 'brown', label: 'Thư viện đêm', short: 'Thư viện', category: 'workspace' },
  { id: 'binaural40', label: 'Sóng 40Hz Gamma', short: '40Hz Focus', category: 'workspace' },
  { id: 'alpha10', label: 'Sóng 10Hz Alpha', short: '10Hz Nhớ sâu', category: 'workspace' },
  { id: 'clock', label: 'Đồng hồ tích tắc', short: 'Tích tắc', category: 'workspace' },
  { id: 'cafe', label: 'Quán cà phê', short: 'Cà phê', category: 'urban' },
  { id: 'lofi', label: 'Ambient Pad êm', short: 'Ambient', category: 'urban' },
  { id: 'nightcity', label: 'Phố đêm mưa', short: 'Phố đêm', category: 'urban' },
];

export const FOCUS_MIX_PRESETS = [
  { id: 'deep_exam', label: 'Đêm ôn thi sâu', layers: { rain: 0.45, binaural40: 0.28, brown: 0.22 } },
  { id: 'cozy_library', label: 'Thư viện mưa', layers: { rain: 0.4, fireplace: 0.35, lofi: 0.3 } },
  { id: 'alpha_memory', label: 'Ghi nhớ Alpha', layers: { waves: 0.45, alpha10: 0.3, stream: 0.25 } },
  { id: 'cafe_sprint', label: 'Cà phê giải đề', layers: { cafe: 0.5, rain: 0.25, nightcity: 0.2 } },
];

class FocusAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.nodes = [];
    this.layers = new Map(); // trackId -> { gain, nodes, volume, timer }
    this.activeId = 'none';
    this.volume = 0.4;
    this.listeners = new Set();
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => this.listeners.delete(cb);
  }

  getSnapshot() {
    const activeLayers = {};
    this.layers.forEach((v, k) => {
      activeLayers[k] = v.volume;
    });
    return {
      activeId: this.activeId,
      volume: this.volume,
      activeLayers,
      activeCount: this.layers.size,
    };
  }

  _notify() {
    const snap = this.getSnapshot();
    this.listeners.forEach((cb) => {
      try { cb(snap); } catch { /* ignore */ }
    });
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
    this.layers.forEach((layer) => {
      if (layer.timer) clearInterval(layer.timer);
      layer.nodes.forEach((n) => {
        try { n.stop?.(); } catch { /* ignore */ }
        try { n.disconnect?.(); } catch { /* ignore */ }
      });
      try { layer.gain?.disconnect?.(); } catch { /* ignore */ }
    });
    this.layers.clear();
    this.activeId = 'none';
    this._notify();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol) || 0));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
    this._notify();
  }

  _buildTrackNodes(ctx, trackId, out) {
    const created = [];
    let timer = null;

    if (trackId === 'binaural40' || trackId === 'alpha10') {
      const baseFreq = trackId === 'alpha10' ? 210 : 200;
      const beatHz = trackId === 'alpha10' ? 10 : 40;
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.value = baseFreq;
      oscR.frequency.value = baseFreq + beatHz;
      gainL.gain.value = 0.22;
      gainR.gain.value = 0.22;

      if (typeof ctx.createStereoPanner === 'function') {
        const panL = ctx.createStereoPanner();
        const panR = ctx.createStereoPanner();
        panL.pan.value = -0.9;
        panR.pan.value = 0.9;
        oscL.connect(gainL).connect(panL).connect(out);
        oscR.connect(gainR).connect(panR).connect(out);
        created.push(panL, panR);
      } else {
        oscL.connect(gainL).connect(out);
        oscR.connect(gainR).connect(out);
      }
      oscL.start();
      oscR.start();
      created.push(oscL, oscR, gainL, gainR);
      return { nodes: created, timer };
    }

    if (trackId === 'clock') {
      // Tiếng tích tắc nhẹ đều nhịp 1 giây
      let tickToggle = true;
      timer = setInterval(() => {
        if (!this.ctx || !this.layers.has('clock')) return;
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(tickToggle ? 1150 : 880, now);
          tickToggle = !tickToggle;
          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(0.18, now + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
          osc.connect(g).connect(out);
          osc.start(now);
          osc.stop(now + 0.06);
        } catch { /* ignore */ }
      }, 1000);
      return { nodes: created, timer };
    }

    if (
      trackId === 'rain' ||
      trackId === 'brown' ||
      trackId === 'waves' ||
      trackId === 'cafe' ||
      trackId === 'fireplace' ||
      trackId === 'stream' ||
      trackId === 'wind' ||
      trackId === 'nightcity'
    ) {
      const src = ctx.createBufferSource();
      const isBrown = trackId === 'brown' || trackId === 'fireplace' || trackId === 'nightcity';
      src.buffer = this._createNoiseBuffer(ctx, isBrown ? 'brown' : 'pink');
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      if (trackId === 'cafe' || trackId === 'stream') {
        filter.type = 'bandpass';
        filter.frequency.value = trackId === 'stream' ? 1450 : 720;
        filter.Q.value = trackId === 'stream' ? 0.55 : 0.7;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value =
          trackId === 'rain' ? 1150
          : trackId === 'wind' ? 480
          : trackId === 'fireplace' ? 520
          : trackId === 'nightcity' ? 620
          : trackId === 'brown' ? 420
          : 650;
      }

      const gain = ctx.createGain();
      gain.gain.value = trackId === 'brown' ? 0.55 : trackId === 'fireplace' ? 0.5 : 0.45;
      src.connect(filter).connect(gain).connect(out);

      if (trackId === 'waves' || trackId === 'fireplace' || trackId === 'wind') {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = trackId === 'fireplace' ? 1.8 : trackId === 'wind' ? 0.18 : 0.12;
        lfoGain.gain.value = trackId === 'fireplace' ? 0.14 : 0.2;
        lfo.connect(lfoGain).connect(gain.gain);
        lfo.start();
        created.push(lfo, lfoGain);
      }

      src.start();
      created.push(src, filter, gain);
      return { nodes: created, timer };
    }

    if (trackId === 'lofi') {
      const freqs = [130.81, 196.0, 246.94, 293.66];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      filter.connect(out);
      created.push(filter);

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        g.gain.value = 0.09;
        osc.connect(g).connect(filter);
        osc.start();
        created.push(osc, g);
      });
    }
    return { nodes: created, timer };
  }

  /** Bật/tắt 1 lớp âm thanh riêng lẻ (Moodist Multi-Layer Mixer) */
  toggleLayer(trackId, layerVolume = 0.45) {
    if (!trackId || trackId === 'none') {
      this.stop();
      return false;
    }
    if (this.layers.has(trackId)) {
      const existing = this.layers.get(trackId);
      if (existing.timer) clearInterval(existing.timer);
      existing.nodes.forEach((n) => {
        try { n.stop?.(); } catch { /* ignore */ }
        try { n.disconnect?.(); } catch { /* ignore */ }
      });
      try { existing.gain?.disconnect?.(); } catch { /* ignore */ }
      this.layers.delete(trackId);
      this.activeId = this.layers.size > 0 ? [...this.layers.keys()][0] : 'none';
      this._notify();
      return false;
    }

    const ctx = this._ensureContext();
    if (!ctx || !this.masterGain) return false;
    const layerGain = ctx.createGain();
    layerGain.gain.value = Math.max(0, Math.min(1, Number(layerVolume) || 0.45));
    layerGain.connect(this.masterGain);
    const { nodes, timer } = this._buildTrackNodes(ctx, trackId, layerGain);
    this.layers.set(trackId, { gain: layerGain, nodes, timer, volume: layerGain.gain.value });
    this.activeId = trackId;
    this._notify();
    return true;
  }

  setLayerVolume(trackId, vol) {
    const layer = this.layers.get(trackId);
    if (!layer || !this.ctx) return;
    const v = Math.max(0, Math.min(1, Number(vol) || 0));
    layer.volume = v;
    layer.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.06);
    this._notify();
  }

  applyPreset(presetId) {
    const preset = FOCUS_MIX_PRESETS.find((p) => p.id === presetId);
    if (!preset) return [];
    this.stop();
    Object.entries(preset.layers).forEach(([tid, vol]) => {
      this.toggleLayer(tid, vol);
    });
    return Object.keys(preset.layers);
  }

  play(trackId) {
    this.stop();
    if (!trackId || trackId === 'none') return;
    this.toggleLayer(trackId, 0.65);
  }
}

export const focusAudio = new FocusAudioEngine();
