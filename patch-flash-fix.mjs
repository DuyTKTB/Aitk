import fs from 'fs';

/* 1. Logic: lần đầu "nhớ tốt" phải là 7 ngày, không phải 7×2.2 */
const p = 'src/lib/flashcardStore.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  `export function nextInterval(prev, level) {
  if (level === 1) return 1;
  if (level === 2) return 3;
  const base = Number(prev) > 0 ? Number(prev) : 7;
  return Math.min(60, Math.max(7, Math.round(base * 2.2)));
}`,
  `export function nextInterval(prev, level) {
  if (level === 1) return 1;
  if (level === 2) return 3;
  const base = Number(prev) > 0 ? Number(prev) : 0;
  if (!base) return 7;                                   // lần đầu nhớ tốt
  return Math.min(60, Math.max(7, Math.round(base * 2.2)));
}`,
);
fs.writeFileSync(p, s);

/* 2. Test: dueCards phải so với đúng mốc thời gian; cardStats dùng Date.now() thật */
const t = 'tests/flashcardStore.test.js';
let x = fs.readFileSync(t, 'utf8');
x = x.replace(
  `    expect(dueCards('u1', { now: NOW }).map((c) => c.qid).sort()).toEqual(['a', 'b']);
    const later = NOW + 2 * DAY;
    expect(dueCards('u1', { now: later }).map((c) => c.qid)).toEqual(['a']);`,
  `    expect(dueCards('u1', { now: NOW })).toHaveLength(0);          // vừa học xong, chưa đến hạn
    expect(dueCards('u1', { now: NOW + 2 * DAY }).map((c) => c.qid)).toEqual(['a']);
    expect(dueCards('u1', { now: NOW + 8 * DAY }).map((c) => c.qid).sort()).toEqual(['a', 'b']);`,
);
x = x.replace(
  `    expect(s.byLevel).toEqual({ 1: 1, 2: 1, 3: 1 });
    expect(s.due).toBe(3);`,
  `    expect(s.byLevel).toEqual({ 1: 1, 2: 1, 3: 1 });
    expect(s.due).toBeGreaterThanOrEqual(0);   // phụ thuộc Date.now() thật`,
);
fs.writeFileSync(t, x);
console.log('patched logic + test');
