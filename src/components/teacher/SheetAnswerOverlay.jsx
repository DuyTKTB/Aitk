/* ============================================================
   SheetAnswerOverlay.jsx — Lớp phủ Đúng/Sai Xanh-Đỏ kiểu TNMaker
   Dựng trên ảnh phiếu đã chụp bằng tọa độ 4 góc cornersNorm (omr.js).
   ============================================================ */

import React, { useMemo } from 'react';
import { fitHomography, TEMPLATE } from '../../lib/omr.js';

export default function SheetAnswerOverlay({ grade, cornersNorm, counts, imgSize = null }) {
  // Dùng tỷ lệ khung hình thật của ảnh để viewBox không bị kéo méo hình tròn thành elip
  const vbW = 1000;
  const vbH = useMemo(() => {
    const w = Number(imgSize?.width) || 0;
    const h = Number(imgSize?.height) || 0;
    if (w > 0 && h > 0) return Math.max(200, Math.round((vbW * h) / w));
    return Math.round((vbW * TEMPLATE.height) / TEMPLATE.width); // mặc định tỷ lệ A4 dọc ~1415
  }, [imgSize?.width, imgSize?.height]);

  const rings = useMemo(() => {
    if (!cornersNorm?.TL || !cornersNorm?.TR || !cornersNorm?.BR || !cornersNorm?.BL || !grade?.detail) {
      return [];
    }
    const tc = TEMPLATE.corners;
    const src4 = [tc.TL, tc.TR, tc.BR, tc.BL];
    const dst4 = [
      [cornersNorm.TL[0] * vbW, cornersNorm.TL[1] * vbH],
      [cornersNorm.TR[0] * vbW, cornersNorm.TR[1] * vbH],
      [cornersNorm.BR[0] * vbW, cornersNorm.BR[1] * vbH],
      [cornersNorm.BL[0] * vbW, cornersNorm.BL[1] * vbH],
    ];
    const H = fitHomography(src4, dst4);
    if (!H) return [];

    // Ước lượng bán kính ô chuẩn theo cạnh trên phiếu trong cùng hệ tọa độ đẳng hướng
    const spanW = Math.hypot(dst4[1][0] - dst4[0][0], dst4[1][1] - dst4[0][1]);
    const rPx = Math.max(3, (TEMPLATE.bubbleR / (tc.TR[0] - tc.TL[0])) * spanW * 1.15);
    const out = [];

    // Phần I (chặn an toàn tối đa 40 câu theo TEMPLATE.p1X)
    const letters = 'ABCD';
    const maxP1 = Math.min(counts?.p1 || 0, TEMPLATE.p1X.length * TEMPLATE.p1Y.length);
    (grade.detail.p1 || []).slice(0, maxP1).forEach((d, i) => {
      const b = Math.floor(i / 10);
      const r = i % 10;
      if (!TEMPLATE.p1X[b] || TEMPLATE.p1Y[r] == null) return;
      const ansIdx = letters.indexOf(d.ans || '');
      const keyIdx = letters.indexOf(d.key || '');
      if (ansIdx >= 0) {
        const [x, y] = H(TEMPLATE.p1X[b][ansIdx], TEMPLATE.p1Y[r]);
        out.push({ key: `p1-a-${i}`, x, y, r: rPx, color: d.ok ? '#10b981' : '#ef4444', dashed: false });
      }
      if (!d.ok && keyIdx >= 0) {
        const [x, y] = H(TEMPLATE.p1X[b][keyIdx], TEMPLATE.p1Y[r]);
        out.push({ key: `p1-k-${i}`, x, y, r: rPx * 1.15, color: '#0284c7', dashed: true });
      }
    });

    // Phần II (chặn an toàn tối đa 8 câu theo TEMPLATE.p2X)
    const maxP2 = Math.min(counts?.p2 || 0, TEMPLATE.p2X.length * 2);
    (grade.detail.p2 || []).slice(0, maxP2).forEach((qItem, qi) => {
      const b = Math.floor(qi / 2);
      const k = qi % 2;
      if (!TEMPLATE.p2X[b]) return;
      (qItem.ys || []).forEach((yObj, yi) => {
        if (TEMPLATE.p2Y[yi] == null) return;
        const ansCol = yObj.ans === 'D' ? 0 : yObj.ans === 'S' ? 1 : -1;
        const keyCol = yObj.key === 'D' ? 0 : yObj.key === 'S' ? 1 : -1;
        if (ansCol >= 0) {
          const [x, y] = H(TEMPLATE.p2X[b][k * 2 + ansCol], TEMPLATE.p2Y[yi]);
          out.push({ key: `p2-a-${qi}-${yi}`, x, y, r: rPx, color: yObj.ok ? '#10b981' : '#ef4444', dashed: false });
        }
        if (!yObj.ok && keyCol >= 0) {
          const [x, y] = H(TEMPLATE.p2X[b][k * 2 + keyCol], TEMPLATE.p2Y[yi]);
          out.push({ key: `p2-k-${qi}-${yi}`, x, y, r: rPx * 1.15, color: '#0284c7', dashed: true });
        }
      });
    });

    // Phần III (chặn an toàn tối đa 6 câu theo TEMPLATE.p3X)
    const maxP3 = Math.min(counts?.p3 || 0, TEMPLATE.p3X.length);
    (grade.detail.p3 || []).slice(0, maxP3).forEach((d, qi) => {
      const ans = String(d.ans || '');
      if (!ans || !TEMPLATE.p3X[qi]) return;
      ans.split('').forEach((ch, ci) => {
        if (ci >= 4) return;
        let ty = null;
        if (ch === '-' && ci === 0) ty = TEMPLATE.p3MinusY;
        else if (ch === ',' && (ci === 1 || ci === 2)) ty = TEMPLATE.p3CommaY;
        else if (ch >= '0' && ch <= '9') ty = TEMPLATE.p3DigitY[Number(ch)];
        if (ty != null) {
          const [x, y] = H(TEMPLATE.p3X[qi][ci], ty);
          out.push({ key: `p3-${qi}-${ci}`, x, y, r: rPx, color: d.ok ? '#10b981' : '#ef4444', dashed: false });
        }
      });
    });

    return out;
  }, [grade, cornersNorm, counts, vbW, vbH]);

  if (!rings.length) return null;

  return (
    <svg
      className="pg-ed-overlay-svg"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {rings.map((ring) => (
        <circle
          key={ring.key}
          cx={ring.x.toFixed(1)}
          cy={ring.y.toFixed(1)}
          r={ring.r.toFixed(1)}
          fill="none"
          stroke={ring.color}
          strokeWidth={ring.dashed ? '2.2' : '2.8'}
          strokeDasharray={ring.dashed ? '4 2' : undefined}
        />
      ))}
    </svg>
  );
}
