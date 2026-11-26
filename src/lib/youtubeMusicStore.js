/* ============================================================
   youtubeMusicStore.js — Trình phát nhạc & Video nền YouTube Toàn Cục
   - Dùng YouTube IFrame Player API chạy xuyên suốt toàn web
   - Tra cứu BẤT KỲ bài hát / ca sĩ / Lofi nào qua /api/youtube-search
   - Hỗ trợ dán trực tiếp link YouTube (watch, youtu.be, shorts, music)
   - Hỗ trợ bật Video YouTube làm ảnh nền mờ toàn màn hình cho Phòng Tập Trung
   - Lưu bài yêu thích & lịch sử đã phát trong localStorage
   ============================================================ */

import { useState, useEffect } from 'react';

const STATE_KEY = 'elec-yt-music-state-v1';
const FAV_KEY = 'elec-yt-music-favs-v1';
const HIST_KEY = 'elec-yt-music-hist-v1';

export const CURATED_YOUTUBE_MUSIC = [
  {
    videoId: 'lTRiuFIWV54',
    title: '1 A.M Study Session — lofi hip hop / chill beats',
    channel: 'Lofi Girl',
    duration: '1:01:13',
    category: 'lofi',
    thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg',
  },
  {
    videoId: '9kzE8isXlQY',
    title: 'Less talk... more action / Lo-fi for study, work (with Rain sounds)',
    channel: 'chill chill journal',
    duration: '3:25:33',
    category: 'lofi',
    thumbnail: 'https://i.ytimg.com/vi/9kzE8isXlQY/hqdefault.jpg',
  },
  {
    videoId: 'CFGLoQIhmow',
    title: 'lofi hip hop mix — beats to relax/study to (Part 1)',
    channel: 'Lofi Girl',
    duration: '2:50:41',
    category: 'lofi',
    thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
  },
  {
    videoId: '4xDzrJKXOOY',
    title: 'synthwave radio — beats to chill/game/study to',
    channel: 'Lofi Girl',
    duration: 'LIVE',
    category: 'lofi',
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    isLive: true,
  },
  {
    videoId: 'HSOtku1j600',
    title: 'Relaxing Studio Ghibli Piano Collection for Studying & Focus',
    channel: 'Ghibli Piano',
    duration: '3:12:40',
    category: 'piano',
    thumbnail: 'https://i.ytimg.com/vi/HSOtku1j600/hqdefault.jpg',
  },
  {
    videoId: '4oStw0r33so',
    title: 'Classical Music for Studying & Brain Power | Mozart, Debussy, Chopin',
    channel: 'HALIDONMUSIC',
    duration: '2:45:10',
    category: 'piano',
    thumbnail: 'https://i.ytimg.com/vi/4oStw0r33so/hqdefault.jpg',
  },
  {
    videoId: 'nVYFSpGLkVU',
    title: 'Playlist Nhạc Chill Yêu Đời Học Bài: Hoá ra chuyện mình thật tình, Hư Không',
    channel: 'Deven',
    duration: '1:05:27',
    category: 'vpop',
    thumbnail: 'https://i.ytimg.com/vi/nVYFSpGLkVU/hqdefault.jpg',
  },
  {
    videoId: 'zoEtcR5EW08',
    title: 'SƠN TÙNG M-TP | CHÚNG TA CỦA TƯƠNG LAI | OFFICIAL MUSIC VIDEO',
    channel: 'Sơn Tùng M-TP Official',
    duration: '4:37',
    category: 'vpop',
    thumbnail: 'https://i.ytimg.com/vi/zoEtcR5EW08/hqdefault.jpg',
  },
  {
    videoId: 'nZtFlrwCbs4',
    title: 'Study With Me 3 Tiếng // Pomodoro 50/10 // Mưa nhẹ & Lofi tập trung',
    channel: 'jawonee',
    duration: '3:01:18',
    category: 'swm',
    thumbnail: 'https://i.ytimg.com/vi/nZtFlrwCbs4/hqdefault.jpg',
  },
  {
    videoId: 'WPni755-Krg',
    title: 'Study Music Alpha Waves: Relaxing Studying Music, Brain Power, Focus Concentration',
    channel: 'Yellow Brick Cinema',
    duration: '3:00:00',
    category: 'piano',
    thumbnail: 'https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg',
  },
];

export const QUICK_SEARCH_CHIPS = [
  'lofi chill học bài',
  'HIEUTHUHAI',
  'Sơn Tùng M-TP',
  'nhạc không lời tập trung',
  'Ghibli piano',
  'Đen Vâu chill',
  'Study With Me 50/10',
  'nhạc cổ điển Mozart',
];

export function extractYouTubeVideoId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const match = s.match(
    /(?:youtube\.com\/watch\?.*?\bv=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?.*?\bv=)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

export function formatTrackTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch { /* ignore */ }
}

let ytApiPromise = null;
function loadYouTubeIframeAPI() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try { prev?.(); } catch { /* ignore */ }
      resolve(window.YT);
    };
    if (!document.getElementById('elec-yt-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'elec-yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return ytApiPromise;
}

class YouTubeMusicStore {
  constructor() {
    const saved = readJson(STATE_KEY, {});
    this.state = {
      currentTrack: saved.currentTrack || null,
      queue: Array.isArray(saved.queue) && saved.queue.length > 0 ? saved.queue : CURATED_YOUTUBE_MUSIC,
      isPlaying: false,
      isBuffering: false,
      currentTime: 0,
      duration: 0,
      volume: typeof saved.volume === 'number' ? saved.volume : 75,
      muted: Boolean(saved.muted),
      loop: Boolean(saved.loop),
      videoBgEnabled: Boolean(saved.videoBgEnabled),
      inFocusStage: false,
      error: null,
      favorites: readJson(FAV_KEY, []),
      history: readJson(HIST_KEY, []),
    };

    this.listeners = new Set();
    this.progressListeners = new Set();
    this.player = null;
    this.playerReady = false;
    this.pendingVideoId = null;
    this.hostEl = null;
    this.progressTimer = null;
    this.videoReadyTimer = null;
    this.videoReady = false;
    this.lastShowVideoBg = null;
    this.lastVideoReady = null;
    this.consecutiveErrors = 0;
  }

  /** Nạp sẵn YouTube IFrame API sớm để khi bấm phát nhạc nhanh hơn ~1s */
  preloadAPI() {
    if (typeof window === 'undefined') return;
    loadYouTubeIframeAPI().catch(() => {});
  }

  getState() {
    return this.state;
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  /** Kênh tiến trình nhẹ — chỉ cập nhật thanh tua & giờ phát, KHÔNG re-render toàn trang */
  subscribeProgress(cb) {
    this.progressListeners.add(cb);
    cb({ currentTime: this.state.currentTime, duration: this.state.duration });
    return () => this.progressListeners.delete(cb);
  }

  _emitProgress() {
    const snap = { currentTime: this.state.currentTime, duration: this.state.duration };
    this.progressListeners.forEach((cb) => {
      try { cb(snap); } catch { /* ignore */ }
    });
  }

  _emit(persist = true) {
    const snapshot = { ...this.state };
    this.state = snapshot;
    if (persist) {
      writeJson(STATE_KEY, {
        currentTrack: snapshot.currentTrack,
        volume: snapshot.volume,
        muted: snapshot.muted,
        loop: snapshot.loop,
        videoBgEnabled: snapshot.videoBgEnabled,
      });
    }
    this.listeners.forEach((cb) => {
      try { cb(snapshot); } catch { /* ignore */ }
    });
    this._syncHostPresentation();
  }

  _ensureHostElement() {
    if (typeof document === 'undefined') return null;
    if (this.hostEl && document.body.contains(this.hostEl)) return this.hostEl;

    const host = document.createElement('div');
    host.id = 'elec-global-yt-host';
    host.className = 'elec-global-yt-host is-hidden';
    const inner = document.createElement('div');
    inner.id = 'elec-global-yt-player';
    host.appendChild(inner);
    document.body.appendChild(host);
    this.hostEl = host;
    return host;
  }

  _syncHostPresentation() {
    if (!this.hostEl) return;
    const showVideoBg =
      this.state.videoBgEnabled &&
      this.state.inFocusStage &&
      Boolean(this.state.currentTrack?.videoId) &&
      (this.state.isPlaying || this.state.isBuffering);
    const ready = showVideoBg && this.videoReady && this.state.isPlaying;

    if (this.lastShowVideoBg !== showVideoBg) {
      this.lastShowVideoBg = showVideoBg;
      this.hostEl.classList.toggle('is-video-bg', showVideoBg);
      this.hostEl.classList.toggle('is-hidden', !showVideoBg);
    }
    if (this.lastVideoReady !== ready) {
      this.lastVideoReady = ready;
      this.hostEl.classList.toggle('is-video-ready', ready);
    }
  }

  setInFocusStage(flag) {
    const next = Boolean(flag);
    if (this.state.inFocusStage === next) return;
    this.state.inFocusStage = next;
    this._syncHostPresentation();
    this._emit();
  }

  async _ensurePlayer(initialVideoId) {
    this._ensureHostElement();
    const YT = await loadYouTubeIframeAPI();
    if (this.player) return this.player;

    return new Promise((resolve) => {
      this.player = new YT.Player('elec-global-yt-player', {
        videoId: initialVideoId || CURATED_YOUTUBE_MUSIC[0].videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            this.playerReady = true;
            try {
              e.target.setVolume(this.state.volume);
              if (this.state.muted) e.target.mute();
              else e.target.unMute();
              if (this.pendingVideoId) {
                e.target.loadVideoById(this.pendingVideoId);
                this.pendingVideoId = null;
              } else {
                e.target.playVideo();
              }
            } catch { /* ignore */ }
            this._startProgressPolling();
            resolve(this.player);
          },
          onStateChange: (e) => {
            const YTState = window.YT?.PlayerState || {};
            if (e.data === YTState.PLAYING) {
              this.consecutiveErrors = 0;
              this.state.isPlaying = true;
              this.state.isBuffering = false;
              this.state.error = null;
              try {
                const dur = e.target.getDuration?.() || 0;
                const cur = e.target.getCurrentTime?.() || 0;
                if (dur > 0) this.state.duration = dur;
                this.state.currentTime = cur;
              } catch { /* ignore */ }
              clearTimeout(this.videoReadyTimer);
              this.videoReadyTimer = setTimeout(() => {
                if (this.state.isPlaying) {
                  this.videoReady = true;
                  this._syncHostPresentation();
                }
              }, 220);
              this._emit(false);
              this._emitProgress();
            } else if (e.data === YTState.BUFFERING) {
              this.state.isBuffering = true;
              this._emit(false);
            } else if (e.data === YTState.PAUSED) {
              clearTimeout(this.videoReadyTimer);
              this.videoReady = false;
              this.state.isPlaying = false;
              this.state.isBuffering = false;
              this._emit(false);
            } else if (e.data === YTState.ENDED) {
              if (this.state.loop && this.state.currentTrack?.videoId) {
                try {
                  e.target.seekTo(0, true);
                  e.target.playVideo();
                } catch { /* ignore */ }
              } else {
                this.next();
              }
            }
          },
          onError: (e) => {
            const code = e?.data;
            this.state.isPlaying = false;
            this.state.isBuffering = false;
            // Tự động chuyển sang bản phát được tiếp theo nếu video chính chủ khóa nhúng (101 / 150)
            if ((code === 101 || code === 150) && this.state.queue.length > 1 && this.consecutiveErrors < 2) {
              this.consecutiveErrors += 1;
              this.state.error = 'Bản MV này chặn phát nhúng — tự động chuyển sang bản khả dụng tiếp theo...';
              this._emit();
              setTimeout(() => this.next(), 450);
              return;
            }
            let msg = 'Video này bị chủ kênh chặn phát nhúng. Hãy chọn bản Lyrics / Audio khác cùng bài nhé!';
            if (code === 100) msg = 'Video YouTube không tồn tại hoặc đã bị gỡ.';
            this.state.error = msg;
            this._emit();
          },
        },
      });
    });
  }

  _startProgressPolling() {
    if (this.progressTimer) return;
    this.progressTimer = setInterval(() => {
      if (!this.player || !this.playerReady || !this.state.isPlaying) return;
      try {
        const cur = this.player.getCurrentTime?.() || 0;
        const dur = this.player.getDuration?.() || this.state.duration;
        if (Math.abs(cur - this.state.currentTime) >= 0.35 || dur !== this.state.duration) {
          this.state.currentTime = cur;
          if (dur > 0) this.state.duration = dur;
          this._emitProgress();
        }
      } catch { /* ignore */ }
    }, 500);
  }

  _pushHistory(track) {
    if (!track?.videoId) return;
    const filtered = this.state.history.filter((t) => t.videoId !== track.videoId);
    const nextHist = [
      {
        videoId: track.videoId,
        title: track.title || `Video YouTube (${track.videoId})`,
        channel: track.channel || 'YouTube',
        duration: track.duration || '',
        thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`,
        isLive: Boolean(track.isLive),
      },
      ...filtered,
    ].slice(0, 20);
    this.state.history = nextHist;
    writeJson(HIST_KEY, nextHist);
  }

  async playTrack(track, newQueue = null) {
    if (!track?.videoId) return;
    const normalized = {
      videoId: track.videoId,
      title: track.title || `Video YouTube (${track.videoId})`,
      channel: track.channel || 'YouTube',
      duration: track.duration || '',
      thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`,
      isLive: Boolean(track.isLive),
    };

    if (Array.isArray(newQueue) && newQueue.length > 0) {
      this.state.queue = newQueue;
    } else if (!this.state.queue.some((q) => q.videoId === normalized.videoId)) {
      this.state.queue = [normalized, ...this.state.queue].slice(0, 30);
    }

    clearTimeout(this.videoReadyTimer);
    this.videoReady = false;
    this.state.currentTrack = normalized;
    this.state.currentTime = 0;
    this.state.duration = 0;
    this.state.isBuffering = true;
    this.state.error = null;
    this._pushHistory(normalized);
    this._emit(true);
    this._emitProgress();

    if (!this.player) {
      this.pendingVideoId = normalized.videoId;
      await this._ensurePlayer(normalized.videoId);
      return;
    }

    if (this.playerReady) {
      try {
        this.player.loadVideoById({ videoId: normalized.videoId, startSeconds: 0 });
      } catch {
        try { this.player.loadVideoById(normalized.videoId); } catch { /* ignore */ }
      }
    } else {
      this.pendingVideoId = normalized.videoId;
    }
  }

  async togglePlay() {
    if (!this.state.currentTrack) {
      await this.playTrack(this.state.queue[0] || CURATED_YOUTUBE_MUSIC[0]);
      return;
    }
    if (!this.player || !this.playerReady) {
      await this.playTrack(this.state.currentTrack);
      return;
    }
    try {
      if (this.state.isPlaying) {
        this.player.pauseVideo();
        this.state.isPlaying = false;
      } else {
        this.player.playVideo();
        this.state.isPlaying = true;
      }
      this._emit();
    } catch { /* ignore */ }
  }

  pause() {
    try {
      this.player?.pauseVideo?.();
    } catch { /* ignore */ }
    this.state.isPlaying = false;
    this._emit();
  }

  stop() {
    try {
      this.player?.stopVideo?.();
    } catch { /* ignore */ }
    this.state.isPlaying = false;
    this.state.isBuffering = false;
    this.state.currentTime = 0;
    this._emit();
  }

  next() {
    const q = this.state.queue;
    if (!q || q.length === 0) return;
    const idx = q.findIndex((t) => t.videoId === this.state.currentTrack?.videoId);
    const nextTrack = q[(idx + 1 + q.length) % q.length];
    if (nextTrack) this.playTrack(nextTrack);
  }

  prev() {
    const q = this.state.queue;
    if (!q || q.length === 0) return;
    if (this.state.currentTime > 5 && this.playerReady) {
      this.seek(0);
      return;
    }
    const idx = q.findIndex((t) => t.videoId === this.state.currentTrack?.videoId);
    const prevTrack = q[(idx - 1 + q.length) % q.length];
    if (prevTrack) this.playTrack(prevTrack);
  }

  seek(seconds) {
    const sec = Math.max(0, Number(seconds) || 0);
    this.state.currentTime = sec;
    try {
      this.player?.seekTo?.(sec, true);
    } catch { /* ignore */ }
    this._emitProgress();
  }

  setVolume(vol) {
    const v = Math.max(0, Math.min(100, Math.round(Number(vol) || 0)));
    this.state.volume = v;
    if (v > 0 && this.state.muted) {
      this.state.muted = false;
      try { this.player?.unMute?.(); } catch { /* ignore */ }
    }
    try { this.player?.setVolume?.(v); } catch { /* ignore */ }
    this._emit();
  }

  toggleMute() {
    this.state.muted = !this.state.muted;
    try {
      if (this.state.muted) this.player?.mute?.();
      else this.player?.unMute?.();
    } catch { /* ignore */ }
    this._emit();
  }

  toggleLoop() {
    this.state.loop = !this.state.loop;
    this._emit();
  }

  setVideoBgEnabled(enabled) {
    this.state.videoBgEnabled = Boolean(enabled);
    if (this.state.videoBgEnabled && this.state.isPlaying && !this.state.isBuffering) {
      this.videoReady = true;
    }
    this._emit(true);
  }

  toggleFavorite(track) {
    if (!track?.videoId) return;
    const exists = this.state.favorites.some((f) => f.videoId === track.videoId);
    const nextFavs = exists
      ? this.state.favorites.filter((f) => f.videoId !== track.videoId)
      : [
          {
            videoId: track.videoId,
            title: track.title || `Video YouTube (${track.videoId})`,
            channel: track.channel || 'YouTube',
            duration: track.duration || '',
            thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`,
            isLive: Boolean(track.isLive),
          },
          ...this.state.favorites,
        ].slice(0, 40);
    this.state.favorites = nextFavs;
    writeJson(FAV_KEY, nextFavs);
    this._emit();
  }

  isFavorite(videoId) {
    return this.state.favorites.some((f) => f.videoId === videoId);
  }

  async searchYouTube(rawQuery) {
    const q = String(rawQuery || '').trim();
    if (!q) return { ok: true, results: CURATED_YOUTUBE_MUSIC };

    // Kiểm tra dán link YouTube trực tiếp trước
    const directId = extractYouTubeVideoId(q);
    if (directId && (q.includes('youtu') || q.length === 11)) {
      try {
        const resp = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
        const data = await resp.json();
        if (data?.results?.length) return { ok: true, results: data.results, direct: true };
      } catch { /* fallback below */ }
      return {
        ok: true,
        direct: true,
        results: [
          {
            videoId: directId,
            title: `Video YouTube (${directId})`,
            channel: 'YouTube',
            duration: '',
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          },
        ],
      };
    }

    try {
      const resp = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data?.ok && Array.isArray(data.results) && data.results.length > 0) {
        return { ok: true, results: data.results };
      }
      throw new Error(data?.error || 'Không tìm thấy kết quả');
    } catch (err) {
      // Fallback lọc kho nhạc sẵn có khi offline
      const lower = q.toLowerCase();
      const localMatches = CURATED_YOUTUBE_MUSIC.filter(
        (t) => t.title.toLowerCase().includes(lower) || t.channel.toLowerCase().includes(lower)
      );
      return {
        ok: false,
        results: localMatches.length > 0 ? localMatches : CURATED_YOUTUBE_MUSIC.slice(0, 6),
        error: err?.message || 'Đang dùng danh sách gợi ý ngoại tuyến',
      };
    }
  }
}

export const youtubeMusic = new YouTubeMusicStore();

export function useYouTubeMusic() {
  const [state, setState] = useState(() => youtubeMusic.getState());
  useEffect(() => youtubeMusic.subscribe(setState), []);
  return state;
}

export function useYouTubeProgress() {
  const [prog, setProg] = useState(() => ({
    currentTime: youtubeMusic.getState().currentTime,
    duration: youtubeMusic.getState().duration,
  }));
  useEffect(() => youtubeMusic.subscribeProgress(setProg), []);
  return prog;
}
