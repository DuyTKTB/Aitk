import { describe, it, expect } from 'vitest';
import {
  measureImageQuality, qualityScore, groupBySbd, duplicateSbdIds,
  duplicateSbdMessage, IMG_LIMITS,
} from '../src/lib/omrQuality.js';

/** Tạo ImageData giả: nền sáng + "chữ" đen dạng sọc để có gradient. */
function makeImage({ width = 1200, height = 900, bg = 240, ink = 20, striped = true, noise = 0 } = {}) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isInk = striped && ((Math.floor(x / 6) + Math.floor(y / 6)) % 5 === 0);
      let v = isInk ? ink : bg;
      if (noise) v = Math.max(0, Math.min(255, v + ((x * y) % noise) - noise / 2));
      const i = (y * width + x) * 4;
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

describe('measureImageQuality', () => {
  it('ảnh đủ lớn, có chữ rõ → đạt', () => {
    const q = measureImageQuality(makeImage());
    expect(q.ok).toBe(true);
    expect(q.issues).toHaveLength(0);
    expect(q.width).toBe(1200);
    expect(q.sharpness).toBeGreaterThan(IMG_LIMITS.minSharpness);
  });

  it('ảnh trắng trơn → báo thiếu tương phản và mờ', () => {
    const q = measureImageQuality(makeImage({ striped: false }));
    expect(q.ok).toBe(false);
    expect(q.issues.join(' ')).toMatch(/Tương phản thấp/);
    expect(q.issues.join(' ')).toMatch(/mờ/);
  });

  it('ảnh quá tối → cảnh báo', () => {
    const q = measureImageQuality(makeImage({ bg: 20, ink: 0 }));
    expect(q.ok).toBe(false);
    expect(q.issues.join(' ')).toMatch(/quá tối/);
  });

  it('ảnh nhỏ → cảnh báo độ phân giải', () => {
    const q = measureImageQuality(makeImage({ width: 600, height: 400 }));
    expect(q.issues.join(' ')).toMatch(/Ảnh nhỏ/);
  });

  it('dữ liệu ảnh hỏng không làm crash', () => {
    const q = measureImageQuality({ width: 0, height: 0, data: null });
    expect(q.ok).toBe(false);
    expect(q.issues[0]).toMatch(/Không đọc được/);
  });
});

describe('qualityScore', () => {
  it('ảnh tốt gần 100, ảnh xấu bị trừ điểm', () => {
    expect(qualityScore(measureImageQuality(makeImage()))).toBeGreaterThanOrEqual(90);
    const bad = measureImageQuality(makeImage({ width: 700, height: 500, bg: 200, ink: 195 }));
    expect(qualityScore(bad)).toBeLessThan(60);
    expect(qualityScore(null)).toBe(0);
  });
});

describe('trùng số báo danh', () => {
  const items = [
    { id: 'a', sbd: '001' },
    { id: 'b', sbd: '002' },
    { id: 'c', sbd: '001' },
    { id: 'd', sbd: '0?3' },
  ];

  it('gom theo SBD, bỏ SBD không đọc được', () => {
    const map = groupBySbd(items);
    expect(map['001']).toEqual(['a', 'c']);
    expect(map['0?3']).toBeUndefined();
  });

  it('đánh dấu cả hai phiếu trùng', () => {
    const ids = duplicateSbdIds(items);
    expect(ids.has('a')).toBe(true);
    expect(ids.has('c')).toBe(true);
    expect(ids.has('b')).toBe(false);
    expect(ids.size).toBe(2);
  });

  it('thông điệp nêu rõ SBD và số phiếu', () => {
    expect(duplicateSbdMessage(items)).toMatch(/001 \(2 phiếu\)/);
    expect(duplicateSbdMessage([{ id: 'x', sbd: '9' }])).toBe('');
  });
});
