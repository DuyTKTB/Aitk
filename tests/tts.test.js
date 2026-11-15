import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function loadFreshTts() {
  vi.resetModules();
  return await import('../src/lib/tts.js');
}

describe('tts.js — 100% Vietnamese voice guarantee & fallback', () => {
  const origWindow = globalThis.window;
  const origSpeechUtterance = globalThis.SpeechSynthesisUtterance;
  const origFetch = globalThis.fetch;
  const origAudio = globalThis.Audio;
  const origCreateObjectURL = globalThis.URL?.createObjectURL;
  const origRevokeObjectURL = globalThis.URL?.revokeObjectURL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = origWindow;
    globalThis.SpeechSynthesisUtterance = origSpeechUtterance;
    globalThis.fetch = origFetch;
    globalThis.Audio = origAudio;
    if (globalThis.URL) {
      globalThis.URL.createObjectURL = origCreateObjectURL;
      globalThis.URL.revokeObjectURL = origRevokeObjectURL;
    }
  });

  it('pickVietnameseVoice never selects English voices and prioritizes natural Vietnamese voices', async () => {
    const { pickVietnameseVoice, getVietnameseVoices } = await loadFreshTts();
    const onlyEnglish = [
      { name: 'Microsoft David - English (United States)', lang: 'en-US' },
      { name: 'Google US English', lang: 'en-US' },
    ];
    expect(pickVietnameseVoice(onlyEnglish)).toBeNull();

    const mixed = [
      ...onlyEnglish,
      { name: 'Microsoft An - Vietnamese (Vietnam)', lang: 'vi-VN' },
      { name: 'Google Tiếng Việt', lang: 'vi_VN' },
      { name: 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)', lang: 'vi-VN' },
    ];
    expect(pickVietnameseVoice(mixed)?.name).toContain('HoaiMy');
    expect(getVietnameseVoices(mixed)).toHaveLength(3);
  });

  it('cleanForSpeech converts Markdown, LaTeX, and chemical subscripts to spoken Vietnamese', async () => {
    const { cleanForSpeech } = await loadFreshTts();
    const raw = '**Bước 1:** Cho $\\ce{H2SO4}$ + $SO \\perp (ABCD)$, tính $\\frac{3}{4}$ và $\\sqrt{9}$ tại 25°C [xem](https://example.com) H₂O → H₂↑';
    const out = cleanForSpeech(raw);
    expect(out).not.toContain('**');
    expect(out).not.toContain('https://');
    expect(out).toContain('vuông góc với');
    expect(out).toContain('3 phần 4');
    expect(out).toContain('căn bậc hai của 9');
    expect(out).toContain('25 độ C');
    expect(out).toContain('H2O');
    expect(out).toContain('tạo thành');
    expect(out).toContain('H2 bay lên');
  });

  it('splitSpeechChunks splits long sentences without truncating words', async () => {
    const { splitSpeechChunks } = await loadFreshTts();
    const longText = 'Phản ứng thứ nhất tạo ra kết tủa trắng bạc. Phản ứng thứ hai giải phóng khí hiđro không màu bay lên nhanh chóng. Sau đó ta cân bằng phương trình hóa học theo bảo toàn electron.';
    const chunks = splitSpeechChunks(longText, 90);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(90);
    }
    expect(chunks.join(' ')).toContain('bảo toàn electron.');
  });

  it('pcm16ToWavBlob creates a valid 44-byte RIFF/WAVE container', async () => {
    const { pcm16ToWavBlob } = await loadFreshTts();
    const pcm = new Uint8Array([1, 2, 3, 4]);
    const blob = pcm16ToWavBlob(pcm, 24000, 1);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(48);
    const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
    expect(String.fromCharCode(...header.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...header.slice(8, 12))).toBe('WAVE');
  });

  it('waits for voiceschanged when initial voice list only has English, then speaks with Google Tiếng Việt', async () => {
    const listeners = {};
    let currentVoices = [{ name: 'Microsoft David', lang: 'en-US' }];
    const speakSpy = vi.fn((u) => setTimeout(() => u.onend?.(), 0));
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) { this.text = t; }
    };
    globalThis.window = {
      speechSynthesis: {
        speaking: false,
        pending: false,
        paused: false,
        getVoices: () => currentVoices,
        addEventListener: (ev, cb) => { listeners[ev] = cb; },
        removeEventListener: vi.fn(),
        speak: speakSpy,
        cancel: vi.fn(),
      },
    };

    const { speak } = await loadFreshTts();
    const speakPromise = speak('Xin chào Việt Nam');

    setTimeout(() => {
      currentVoices = [
        { name: 'Microsoft David', lang: 'en-US' },
        { name: 'Google Tiếng Việt', lang: 'vi-VN' },
      ];
      listeners.voiceschanged?.();
    }, 20);

    const res = await speakPromise;
    expect(res.canceled).toBe(false);
    expect(res.engine).toBe('webspeech');
    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect(speakSpy.mock.calls[0][0].voice.name).toBe('Google Tiếng Việt');
    expect(speakSpy.mock.calls[0][0].lang).toBe('vi-VN');
  });

  it('uses Gemini Cloud Vietnamese TTS fallback instead of English voice when browser has zero Vietnamese voices', async () => {
    const speakSpy = vi.fn();
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) { this.text = t; }
    };
    globalThis.window = {
      speechSynthesis: {
        speaking: false,
        pending: false,
        paused: false,
        getVoices: () => [{ name: 'Microsoft David - English (United States)', lang: 'en-US' }],
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        speak: speakSpy,
        cancel: vi.fn(),
      },
    };

    const fakePcmBase64 = Buffer.from([0, 0, 1, 0, 2, 0, 3, 0]).toString('base64');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: fakePcmBase64 } }],
          },
        }],
      }),
    });

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-vi-wav');
    globalThis.URL.revokeObjectURL = vi.fn();

    let playedUrl = '';
    globalThis.Audio = class {
      constructor(url) {
        playedUrl = url;
        this.paused = false;
        this.ended = false;
      }
      play() {
        setTimeout(() => {
          this.ended = true;
          this.onended?.();
        }, 0);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
      removeAttribute() {}
    };

    const { speak, getVoices } = await loadFreshTts();
    // Pre-probe quickly with short timeout
    await getVoices(60);
    const res = await speak('Giải bài tập hóa học');

    expect(speakSpy).not.toHaveBeenCalled(); // TUYỆT ĐỐI KHÔNG đọc bằng giọng tiếng Anh
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/ai-chat');
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).model).toBe('gemini-2.5-flash-preview-tts');
    expect(playedUrl).toBe('blob:mock-vi-wav');
    expect(res.engine).toBe('gemini-tts');
    expect(res.canceled).toBe(false);
  });

  it('falls back to Gemini Cloud Vietnamese TTS when Web Speech throws a network/synthesis error', async () => {
    const listeners = {};
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) { this.text = t; }
    };
    globalThis.window = {
      speechSynthesis: {
        speaking: false,
        pending: false,
        paused: false,
        getVoices: () => [{ name: 'Google Tiếng Việt', lang: 'vi-VN' }],
        addEventListener: (ev, cb) => { listeners[ev] = cb; },
        removeEventListener: vi.fn(),
        speak: vi.fn((u) => setTimeout(() => u.onerror?.({ error: 'network' }), 0)),
        cancel: vi.fn(),
      },
    };

    const fakePcmBase64 = Buffer.from([0, 0, 5, 0]).toString('base64');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: fakePcmBase64 } }],
          },
        }],
      }),
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fallback-wav');
    globalThis.URL.revokeObjectURL = vi.fn();
    globalThis.Audio = class {
      constructor() { this.paused = false; this.ended = false; }
      play() { setTimeout(() => { this.ended = true; this.onended?.(); }, 0); return Promise.resolve(); }
      pause() { this.paused = true; }
      removeAttribute() {}
    };

    const { speak } = await loadFreshTts();
    const res = await speak('Chuyển sang giọng đọc dự phòng Tiếng Việt');
    expect(res.engine).toBe('gemini-tts');
    expect(res.canceled).toBe(false);
  });

  it('stop() interrupts active speech cleanly and marks playback as canceled', async () => {
    const cancelSpy = vi.fn();
    let activeUtterance = null;
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) { this.text = t; }
    };
    globalThis.window = {
      speechSynthesis: {
        speaking: true,
        pending: false,
        paused: false,
        getVoices: () => [{ name: 'Microsoft HoaiMy Online (Natural)', lang: 'vi-VN' }],
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        speak: vi.fn((u) => { activeUtterance = u; }),
        cancel: () => {
          cancelSpy();
          activeUtterance?.onerror?.({ error: 'canceled' });
        },
      },
    };

    const { speak, stop } = await loadFreshTts();
    const pending = speak('Đang giảng bài trên bảng phấn 3D');
    setTimeout(() => stop(), 45);
    const res = await pending;
    expect(cancelSpy).toHaveBeenCalled();
    expect(res.canceled).toBe(true);
  });
});
