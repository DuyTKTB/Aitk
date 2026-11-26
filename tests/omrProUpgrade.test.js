import { describe, it, expect } from 'vitest';
import {
  computeAdaptiveThreshold,
  decodeSheetFills,
  mergeBurstReads,
} from '../src/lib/omr.js';

function makeRaw({
  blank = 0.03,
  ink = 0.55,
  sbd = [1, 2, 3, 4, 5, 6],
  code = [1, 0, 1],
  p1 = [0, 1, 2, 3],
  erasureOnQ0 = 0,
} = {}) {
  const idFill = sbd.map((d) => Array.from({ length: 10 }, (_, i) => (i === d ? ink : blank)));
  const codeFill = code.map((d) => Array.from({ length: 10 }, (_, i) => (i === d ? ink : blank)));
  const p1Fill = Array.from({ length: 40 }, (_, qi) => (
    Array.from({ length: 4 }, (_, ci) => {
      if (qi < p1.length && ci === p1[qi]) return ink;
      if (qi === 0 && ci === 2 && erasureOnQ0 > 0) return erasureOnQ0;
      return blank;
    })
  ));
  const p2Fill = Array.from({ length: 8 }, () => (
    Array.from({ length: 4 }, () => [blank, blank])
  ));
  p2Fill[0][0] = [ink, blank]; // D
  p2Fill[0][1] = [blank, ink]; // S
  const p3Fill = Array.from({ length: 6 }, () => (
    Array.from({ length: 4 }, () => ({
      minus: blank,
      comma: blank,
      digits: Array.from({ length: 10 }, () => blank),
    }))
  ));
  p3Fill[0][0].digits[4] = ink;
  p3Fill[0][1].comma = ink;
  p3Fill[0][2].digits[5] = ink;
  return { idFill, codeFill, p1Fill, p2Fill, p3Fill };
}

describe('OMR Pro Accuracy Engine', () => {
  it('computeAdaptiveThreshold tự hạ ngưỡng cho bút chì 2B tô nhạt và tăng ngưỡng cho giấy photo nhiễu', () => {
    const cleanLight = [...Array(220).fill(0.025), ...Array(30).fill(0.19)];
    const noisyPhoto = [...Array(220).fill(0.14), ...Array(30).fill(0.58)];

    const rLight = computeAdaptiveThreshold(cleanLight, { sensitivity: 'normal' });
    const rNoisy = computeAdaptiveThreshold(noisyPhoto, { sensitivity: 'normal' });

    expect(rLight.adapted).toBe(true);
    expect(rLight.threshold).toBeLessThan(0.18);
    expect(rNoisy.threshold).toBeGreaterThan(0.24);
    expect(rNoisy.threshold).toBeLessThan(0.35);

    const sensLight = computeAdaptiveThreshold(cleanLight, { sensitivity: 'light' }).threshold;
    const sensNormal = computeAdaptiveThreshold(cleanLight, { sensitivity: 'normal' }).threshold;
    const sensStrict = computeAdaptiveThreshold(cleanLight, { sensitivity: 'strict' }).threshold;
    expect(sensLight).toBeLessThanOrEqual(sensNormal);
    expect(sensNormal).toBeLessThanOrEqual(sensStrict);
  });

  it('decodeSheetFills đọc chính xác phiếu chì 2B nhạt và phân tách vết tẩy xóa vs tô 2 ô', () => {
    // Bút chì 2B tô nhạt (0.18) trên giấy trắng (0.02)
    const lightRaw = makeRaw({ blank: 0.02, ink: 0.18 });
    const lightDecoded = decodeSheetFills(lightRaw, { sensitivity: 'light' });
    expect(lightDecoded.sbd).toBe('123456');
    expect(lightDecoded.code).toBe('101');
    expect(lightDecoded.p1.slice(0, 4)).toEqual(['A', 'B', 'C', 'D']);
    expect(lightDecoded.p2[0].slice(0, 2)).toEqual(['D', 'S']);
    expect(lightDecoded.p3[0]).toBe('4,5');

    // Vết tẩy chưa sạch ở ô C (0.23) nhưng ô A tô đậm (0.52) → nhận A, không báo multi
    const erasureRaw = makeRaw({ blank: 0.03, ink: 0.52, erasureOnQ0: 0.23 });
    const erasureDecoded = decodeSheetFills(erasureRaw);
    expect(erasureDecoded.p1[0]).toBe('A');

    // Tô đậm cả 2 ô (0.50 và 0.46) → báo multi '*'
    const multiRaw = makeRaw({ blank: 0.03, ink: 0.50, erasureOnQ0: 0.46 });
    const multiDecoded = decodeSheetFills(multiRaw);
    expect(multiDecoded.p1[0]).toBe('*');
  });

  it('mergeBurstReads (3-frame consensus) loại bỏ khung nhiễu rung tay/bóng đổ và giữ 100% đáp án chuẩn', () => {
    const clean1 = { ok: true, quality: { markFit: 0.92, alignment: 0.22 }, raw: makeRaw({ ink: 0.54 }) };
    const clean2 = { ok: true, quality: { markFit: 0.90, alignment: 0.21 }, raw: makeRaw({ ink: 0.50 }) };

    // Khung 3 bị bóng lướt / rung tay làm nhiễu sai câu 1 & chữ số SBD đầu tiên
    const badRaw = makeRaw({ ink: 0.52 });
    badRaw.p1Fill[0] = [0.05, 0.62, 0.04, 0.03]; // đọc nhầm sang B ở khung lỗi
    badRaw.idFill[0][1] = 0.04;
    badRaw.idFill[0][8] = 0.61; // đọc nhầm SBD đầu thành 8
    const noisy3 = { ok: true, quality: { markFit: 0.72, alignment: 0.14 }, raw: badRaw };

    const merged = mergeBurstReads([clean1, noisy3, clean2]);
    expect(merged.ok).toBe(true);
    expect(merged.sbd).toBe('123456');
    expect(merged.code).toBe('101');
    expect(merged.p1.slice(0, 4)).toEqual(['A', 'B', 'C', 'D']);
    expect(merged.quality.burstFrames).toBe(3);
  });
});
