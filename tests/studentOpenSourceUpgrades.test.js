import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fsrsRetrievability,
  fsrsNextIntervalDays,
  fsrsSchedule,
  predictCardRetentionPct,
  FSRS_DAY_MS,
} from '../src/lib/fsrsEngine.js';
import { rateCardFsrs, dueCardsByRetention } from '../src/lib/flashcardStore.js';
import {
  parseClozeText,
  autoGenerateCloze,
  gradeClozeAnswers,
  evaluateFeynmanLocally,
  FEYNMAN_PROMPTS,
  compileSafeMathFn,
  analyzeMathFunction,
} from '../src/lib/studentStudyStudio.js';
import { FOCUS_SOUND_TRACKS, FOCUS_MIX_PRESETS } from '../src/lib/focusAudioEngine.js';

const mem = new Map();
beforeEach(() => {
  mem.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  });
  vi.stubGlobal('window', { dispatchEvent: () => true });
});

describe('1. FSRS v4.5 Spaced Repetition Engine (open-spaced-repetition / Anki)', () => {
  it('satisfies exact FSRS invariant R(S, S) = 0.90 and grows stability across recalls', () => {
    expect(fsrsRetrievability(10, 10)).toBeCloseTo(0.9, 5);
    expect(fsrsNextIntervalDays(10, 0.9)).toBe(10);

    const t0 = Date.UTC(2026, 10, 1);
    const r1 = fsrsSchedule(null, 3, t0); // Good
    expect(r1.stability).toBeGreaterThan(3);
    expect(r1.interval).toBeGreaterThanOrEqual(3);

    const r2 = fsrsSchedule(r1, 3, t0 + r1.interval * FSRS_DAY_MS);
    expect(r2.stability).toBeGreaterThan(r1.stability);
    expect(r2.interval).toBeGreaterThan(r1.interval);

    const lapse = fsrsSchedule(r2, 1, t0 + (r1.interval + r2.interval) * FSRS_DAY_MS);
    expect(lapse.lapses).toBe(1);
    expect(lapse.interval).toBe(1);
    expect(lapse.stability).toBeLessThan(r2.stability);
  });

  it('integrates rateCardFsrs and dueCardsByRetention cleanly with flashcardStore', () => {
    const t0 = Date.UTC(2026, 10, 1);
    const c1 = rateCardFsrs('stu1', 'q_hard', 1, t0);
    const c2 = rateCardFsrs('stu1', 'q_easy', 4, t0);
    expect(c1.stability).toBeLessThan(c2.stability);

    const ret1 = predictCardRetentionPct(c1, t0 + 3 * FSRS_DAY_MS);
    const ret2 = predictCardRetentionPct(c2, t0 + 3 * FSRS_DAY_MS);
    expect(ret1).toBeLessThan(ret2);

    const due = dueCardsByRetention('stu1', { now: t0 + 3 * FSRS_DAY_MS, thresholdPct: 95 });
    expect(due[0].qid).toBe('q_hard');
  });
});

describe('2. Active Recall Cloze Deletion & Feynman Technique Evaluator', () => {
  it('parses Anki cloze syntax, auto-generates blanks, and grades answers flexibly', () => {
    const raw = 'Nước sôi ở {{c1::100°C}} và có công thức {{c2::H2O}}.';
    const parsed = parseClozeText(raw);
    expect(parsed.blanks).toHaveLength(2);
    expect(parsed.blanks[0].answer).toBe('100°C');

    const grade = gradeClozeAnswers(parsed.blanks, ['100°c', 'h2o']);
    expect(grade.correct).toBe(2);
    expect(grade.pct).toBe(100);

    const auto = autoGenerateCloze('Axit sunfuric đặc H2SO4 có khối lượng mol 98 g/mol là chất hút ẩm mạnh.', 3);
    expect(auto).toContain('{{c1::H2SO4}}');
  });

  it('evaluates Feynman explanations with keyword coverage and real-world example bonus', () => {
    const prompt = FEYNMAN_PROMPTS[0]; // Định luật bảo toàn động lượng
    const good = evaluateFeynmanLocally({
      explanation: 'Trong một hệ kín không có ngoại lực thì tổng động lượng bằng khối lượng nhân vận tốc luôn không đổi trước và sau va chạm. Ví dụ hai viên bi va chạm nhau trên mặt bàn nhẵn.',
      keywords: prompt.keywords,
    });
    expect(good.score).toBeGreaterThanOrEqual(85);
    expect(good.hasExample).toBe(true);
    expect(good.missingKeywords).toHaveLength(0);

    const short = evaluateFeynmanLocally({ explanation: 'Không nhớ', keywords: prompt.keywords });
    expect(short.score).toBe(0);
  });
});

describe('3. Safe Math Function Grapher & Moodist 8-Layer Audio Mixer', () => {
  it('compiles safe math expressions without eval, rejects unsafe code, and finds exact roots & extrema', () => {
    const fn = compileSafeMathFn('x^3 - 3*x');
    expect(typeof fn).toBe('function');
    expect(fn(2)).toBeCloseTo(2, 5);
    expect(fn(1)).toBeCloseTo(-2, 5);

    const analysis = analyzeMathFunction(fn, -4, 4, 400);
    expect(analysis.roots.map((r) => r.x)).toEqual(expect.arrayContaining([0]));
    expect(analysis.roots.some((r) => Math.abs(r.x - 1.73) < 0.05)).toBe(true);
    expect(analysis.extrema.some((e) => e.kind === 'max' && Math.abs(e.x + 1) < 0.08 && Math.abs(e.y - 2) < 0.1)).toBe(true);
    expect(analysis.extrema.some((e) => e.kind === 'min' && Math.abs(e.x - 1) < 0.08 && Math.abs(e.y + 2) < 0.1)).toBe(true);

    // Chặn mã độc tuyệt đối
    expect(compileSafeMathFn('process.exit(1)')).toBeNull();
    expect(compileSafeMathFn('window.alert(1)')).toBeNull();
  });

  it('exposes 8 ambient tracks (including alpha10, cafe, fireplace) and 4 Moodist multi-layer presets', () => {
    const ids = FOCUS_SOUND_TRACKS.map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['binaural40', 'alpha10', 'rain', 'brown', 'waves', 'lofi', 'cafe', 'fireplace']));
    expect(FOCUS_MIX_PRESETS.length).toBeGreaterThanOrEqual(4);
  });
});

describe('4. Scientific SI Unit Converter, DNA Codon/Mutation Decoder, RSVP ORP & English Dictation', () => {
  it('converts physics/chemistry SI units accurately (eV->J, atm->Pa, °C->K, km/h->m/s)', async () => {
    const { convertScientificUnit, formatSciNumber } = await import('../src/lib/studentStemStudio.js');
    expect(convertScientificUnit('energy', 1, 'eV', 'J')).toBeCloseTo(1.602176634e-19, 25);
    expect(convertScientificUnit('pressure', 1, 'atm', 'Pa')).toBeCloseTo(101325, 2);
    expect(convertScientificUnit('temperature', 25, 'C', 'K')).toBeCloseTo(298.15, 2);
    expect(convertScientificUnit('speed', 72, 'kmh', 'ms')).toBeCloseTo(20, 5);
    expect(formatSciNumber(1.602e-19)).toContain('10^-19');
  });

  it('decodes DNA 3->5 template to mRNA, polypeptide, hydrogen bonds, and classifies point mutations', async () => {
    const { decodeDnaTemplate, classifyPointMutation } = await import('../src/lib/studentStemStudio.js');
    // 3'-TAC-GGA-TTC-ATT-5' -> mRNA 5'-AUG-CCU-AAG-UAA-3' -> Met-Pro-Lys (STOP)
    const dec = decodeDnaTemplate('TACGGATTCATT');
    expect(dec.mrna5to3).toBe('AUGCCUAAGUAA');
    expect(dec.aminoAcids).toEqual(['Met', 'Pro', 'Lys']);
    expect(dec.stats.totalNu).toBe(24);
    expect(dec.stats.lengthAngstrom).toBe(40.8);

    // Đột biến đồng nghĩa: GGA (CCU=Pro) -> GGG (CCC=Pro)
    expect(classifyPointMutation('TACGGATTCATT', 'TACGGGTTCATT').type).toBe('silent');
    // Đột biến vô nghĩa: TTC (AAG=Lys) -> ATC (UAG=STOP)
    expect(classifyPointMutation('TACGGATTCATT', 'TACGGAAUCATT'.replace('U', 'T')).type).toBe('nonsense');
    // Đột biến sai nghĩa: GGA (CCU=Pro) -> GCA (CGU=Arg)
    expect(classifyPointMutation('TACGGATTCATT', 'TACGCATTCATT').type).toBe('missense');
  });

  it('computes RSVP ORP pivot, smart punctuation pacing, and LCS English dictation word-diff', async () => {
    const { splitWordOrp, getRsvpWordDelayMs, gradeDictationText } = await import('../src/lib/studentStemStudio.js');
    expect(splitWordOrp('science')).toEqual({ left: 'sc', pivot: 'i', right: 'ence' });
    expect(getRsvpWordDelayMs('end.', 300)).toBeGreaterThan(getRsvpWordDelayMs('word', 300));

    const graded = gradeDictationText('Active recall strengthens long term memory', 'Active recall long term memory');
    expect(graded.correct).toBe(5);
    expect(graded.total).toBe(6);
    expect(graded.accuracy).toBe(83);
  });
});
