/* ============================================================
   KnowledgeMap.jsx — BẢN ĐỒ KIẾN THỨC TƯƠNG TÁC
   ------------------------------------------------------------
   Vẽ bằng SVG thuần (không thêm thư viện đồ hoạ mới).
   Cùng một nguồn dữ liệu với chế độ Danh sách: mỗi node là một
   chương thật trong data/roadmap.js, màu/trạng thái lấy từ
   roadmapEngine (điểm thành thạo, lịch ôn, điều kiện tiên quyết).

   • Node = <g role="button" tabIndex=0> → dùng được bàn phím.
   • Trạng thái luôn có NHÃN CHỮ + icon, không chỉ dựa vào màu.
   • Thu phóng bằng nút + − và nút "Vừa khung"; cuộn ngang khi hẹp.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STATE_META } from '../../lib/roadmapEngine.js';

const NODE_W = 300;
const NODE_H = 108;
const GAP_X = 64;
const GAP_Y = 46;
const PAD = 24;
const COLS = 2;

function layout(chapters) {
  const rows = Math.ceil(chapters.length / COLS);
  const width = PAD * 2 + COLS * NODE_W + (COLS - 1) * GAP_X;
  const height = PAD * 2 + rows * NODE_H + Math.max(0, rows - 1) * GAP_Y;
  const pos = {};
  chapters.forEach((c, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    pos[c.chapter.id || `idx-${i}`] = {
      x: PAD + col * (NODE_W + GAP_X),
      y: PAD + row * (NODE_H + GAP_Y),
      row,
      col,
    };
  });
  return { width, height, pos };
}

function edgePath(a, b) {
  /* Nối cạnh phải node trước → cạnh trái node sau (hoặc vòng xuống dòng mới) */
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  if (b.col === a.col) {
    /* Cùng cột: đi vòng bên phải node để không đè lên node nằm giữa */
    const sx = a.x + NODE_W;
    const sy = a.y + NODE_H / 2;
    const ty = b.y + NODE_H / 2;
    const bulge = sx + GAP_X * 0.45;
    return `M ${sx} ${sy} C ${bulge} ${sy}, ${bulge} ${ty}, ${sx} ${ty}`;
  }
  if (b.col > a.col) {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  }
  /* Sang dòng mới: đi xuống rồi vòng sang trái */
  const drop = a.y + NODE_H + GAP_Y / 2;
  const x2r = b.x + NODE_W;
  return `M ${x1 - 20} ${y1} C ${x1 + 40} ${y1}, ${x1 + 40} ${drop}, ${x1 - 60} ${drop} `
    + `L ${x2r + 60} ${drop} C ${x2r + 40} ${drop}, ${x2r + 40} ${y2}, ${x2r} ${y2}`;
}

export default function KnowledgeMap({ chapters, onOpen, onPractice }) {
  const [scale, setScale] = useState(1);
  const wrapRef = useRef(null);
  const { width, height, pos } = useMemo(() => layout(chapters), [chapters]);

  const fit = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const avail = el.clientWidth - 8;
    const next = Math.min(1, Math.max(0.55, avail / width));
    setScale(Number(next.toFixed(2)));
  }, [width]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fit]);

  const zoom = (delta) => setScale((s) => Math.min(1.6, Math.max(0.5, Number((s + delta).toFixed(2)))));

  const onKey = (e, view) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(view.chapter.id);
    }
  };

  return (
    <div className="rm-map">
      <div className="rm-map-toolbar">
        <span className="rm-map-hint">Bấm vào chương để xem chi tiết · đường nét đứt = kiến thức cần học trước</span>
        <div className="rm-zoom" role="group" aria-label="Thu phóng bản đồ">
          <button type="button" onClick={() => zoom(-0.1)} aria-label="Thu nhỏ">−</button>
          <span aria-live="polite">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(0.1)} aria-label="Phóng to">+</button>
          <button type="button" className="rm-zoom-fit" onClick={fit}>Vừa khung</button>
        </div>
      </div>

      <div className="rm-map-scroll" ref={wrapRef}>
        <svg
          className="rm-map-svg"
          width={width * scale}
          height={height * scale}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Bản đồ kiến thức theo chương"
        >
          <defs>
            <pattern id="rm-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1.4" cy="1.4" r="1.2" className="rm-dot" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#rm-dots)" aria-hidden="true" />

          {/* Đường nối theo điều kiện tiên quyết */}
          {chapters.map((view) => {
            const key = view.chapter.id || `idx-${view.index}`;
            const from = pos[key];
            if (!from) return null;
            return (view.chapter.prereq || []).map((pid) => {
              const target = chapters.find((c) => c.chapter.id === pid);
              if (!target) return null;
              const to = pos[pid];
              if (!to) return null;
              const weak = view.missingPrereq.some((p) => p.id === pid);
              return (
                <path
                  key={`${pid}-${key}`}
                  d={edgePath(to, from)}
                  className={'rm-edge' + (weak ? ' is-warning' : '')}
                  fill="none"
                  aria-hidden="true"
                />
              );
            });
          })}

          {/* Node chương */}
          {chapters.map((view) => {
            const key = view.chapter.id || `idx-${view.index}`;
            const p = pos[key];
            if (!p) return null;
            const meta = STATE_META[view.state] || STATE_META.none;
            const score = view.mastery.score;
            const isDue = view.review.isDue && view.summary;
            return (
              <g
                key={key}
                className={`rm-node tone-${meta.tone}${isDue ? ' is-due' : ''}${view.chapter.bank === false ? ' is-ai' : ''}`}
                transform={`translate(${p.x} ${p.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${view.chapter.name} — ${meta.label}${score !== null ? `, ${score}% thành thạo` : ''}`}
                onClick={() => onOpen(view.chapter.id)}
                onKeyDown={(e) => onKey(e, view)}
              >
                <rect className="rm-node-box" width={NODE_W} height={NODE_H} rx="16" />
                <rect className="rm-node-accent" width="6" height={NODE_H} rx="3" />
                <text className="rm-node-idx" x="22" y="30">{view.index + 1}</text>
                <text className="rm-node-name" x="46" y="31">{clamp(view.chapter.name, 26)}</text>
                <text className="rm-node-state" x="22" y="58">
                  {meta.icon} {meta.label}{score !== null ? ` · ${score}%` : ''}
                </text>
                <text className="rm-node-meta" x="22" y="82">
                  {view.summary
                    ? `${view.summary.correct}/${view.summary.answers} câu đúng${isDue ? ' · cần ôn' : ''}`
                    : view.chapter.bank === false ? 'Học bằng AI, chưa có ngân hàng câu hỏi' : 'Chưa có dữ liệu luyện tập'}
                </text>
                {view.chapter.bank === false && (
                  <text className="rm-node-act" x={NODE_W - 20} y={NODE_H - 16} textAnchor="end">AI ✦</text>
                )}
                {view.chapter.bank !== false && (
                  <text
                    className="rm-node-act"
                    x={NODE_W - 20}
                    y={NODE_H - 16}
                    textAnchor="end"
                    onClick={(e) => { e.stopPropagation(); onPractice?.(view.chapter.id); }}
                  >
                    Luyện ›
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function clamp(text, max) {
  const s = String(text || '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
