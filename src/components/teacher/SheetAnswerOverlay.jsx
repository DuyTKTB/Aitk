/* ============================================================
   SheetAnswerOverlay.jsx — Lớp phủ Đúng/Sai Xanh-Đỏ kiểu TNMaker
   Dựng trên ảnh phiếu đã chụp bằng tọa độ 4 góc cornersNorm (omr.js).
   ============================================================ */

import React, { useMemo } from 'react';
import { fitHomography, TEMPLATE } from '../../lib/omr.js';

export default function SheetAnswerOverlay({ grade, cornersNorm, counts }) {
  const rings = useMemo(() => {
    if (!cornersNorm?.TL || !cornersNorm?.TR || !cornersNorm?.BR || !cornersNorm?.BL || !grade?.detail) {
      return [];
    }
    const tc = TEMPLATE.corners;
    const src4 = [tc.TL, tc.TR, tc.BR, tc.BL];
    const dst4 = [
      [cornersNorm.TL[0] * 1000, cornersNorm.TL[1] * 1000],
      [cornersNorm.TR[0] * 1000, cornersNorm.TR[1] * 1000],
      [cornersNorm.BR[0] * 1000, cornersNorm.BR[1] * 1000],
      [cornersNorm.BL[0] * 1000, cornersNorm.BL[1] * 1000],
    ];
    const H = fitHomography(src4, dst4);
    if (!H) return [];

    // Ước lượng bán kính ô trên SVG viewBox 1000x1000 theo chiều ngang phiếu
    const spanW = Math.hypot(dst4[1][0] - dst4[0][0], dst4[1][1] - dst4[0][1]);
    const rPx = Math.max(3, (TEMPLATE.bubbleR / (tc.TR[0] - tc.TL[0])) * spanW * 1.15);
    const out = [];

    // Phần I
    const letters = 'ABCD';
    (grade.detail.p1 || []).slice(0, counts?.p1 || 0).forEach((d, i) => {
      const b = Math.floor(i / 10);
      const r = i % 10;
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

    // Phần II
    (grade.detail.p2 || []).slice(0, counts?.p2 || 0).forEach((qItem, qi) => {
      const b = Math.floor(qi / 2);
      const k = qi % 2;
      (qItem.ys || []).forEach((yObj, yi) => {
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

    // Phần III (tô xanh/đỏ tại dòng dấu & chữ số đầu cột đã tô)
    (grade.detail.p3 || []).slice(0, counts?.p3 || 0).forEach((d, qi) => {
      const ans = String(d.ans || '');
      if (!ans) return;
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
  }, [grade, cornersNorm, counts]);

  if (!rings.length) return null;

  return (
    <svg
      className="pg-ed-overlay-svg"
      viewBox="0 0 1000 1000"
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
