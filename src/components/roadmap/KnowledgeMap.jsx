/* ============================================================
   KnowledgeMap.jsx — BẢN ĐỒ ĐỒ THỊ KIẾN THỨC DAG PRO (GDPT 2018)
   ------------------------------------------------------------
   • Phân tầng khoa học 3 cột: Lớp 10 → Lớp 11 → Lớp 12 (tự co theo bộ lọc).
   • Đường nối Bezier có mũi tên thể hiện quan hệ tiên quyết (DAG thật).
   • Rê chuột hoặc chọn 1 chuyên đề → Phát sáng toàn bộ nhánh Gốc tiên quyết
     (Upstream) và nhánh Mở khóa phía sau (Downstream), làm mờ nút không liên quan.
   • Đồng bộ trực tiếp với Bảng Thanh tra cố định (ChapterInspectorPanel).
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getChapterMeta,
  getDownstreamIds,
  getUpstreamIds,
} from '../../data/curriculumDag.js';
import { formatMathAndChemSymbols } from '../../lib/chemFormulaFormatter.js';

const NODE_W = 248;
const NODE_H = 88;
const COL_GAP = 104;
const ROW_GAP = 26;
const PAD_X = 32;
const PAD_TOP = 64;
const PAD_BOTTOM = 36;

const GRADES = [
  { grade: 10, label: 'LỚP 10 · NỀN TẢNG', tone: 'g10' },
  { grade: 11, label: 'LỚP 11 · XƯƠNG SỐNG', tone: 'g11' },
  { grade: 12, label: 'LỚP 12 · TRỌNG TÂM THPT', tone: 'g12' },
];

function buildDagLayout(chapters) {
  const byGrade = { 10: [], 11: [], 12: [] };
  (chapters || []).forEach((c) => {
    const meta = getChapterMeta(c.chapter?.id);
    const g = meta?.grade || c.chapter?.grade || 12;
    const bucket = byGrade[g] ? g : 12;
    byGrade[bucket].push(c);
  });

  const activeGrades = GRADES.filter((g) => byGrade[g.grade].length > 0);
  const cols = activeGrades.length > 0 ? activeGrades : GRADES;

  const pos = {};
  let maxRows = 1;

  cols.forEach((colInfo, colIdx) => {
    const items = byGrade[colInfo.grade] || [];
    if (items.length > maxRows) maxRows = items.length;
    const x = PAD_X + colIdx * (NODE_W + COL_GAP);
    items.forEach((c, rowIdx) => {
      const y = PAD_TOP + rowIdx * (NODE_H + ROW_GAP);
      pos[c.chapter.id] = { x, y, colIdx, rowIdx, grade: colInfo.grade };
    });
  });

  const width = PAD_X * 2 + cols.length * NODE_W + Math.max(0, cols.length - 1) * COL_GAP;
  const height = PAD_TOP + maxRows * NODE_H + Math.max(0, maxRows - 1) * ROW_GAP + PAD_BOTTOM;

  const edges = [];
  (chapters || []).forEach((c) => {
    const toId = c.chapter.id;
    const toPos = pos[toId];
    if (!toPos) return;
    const meta = getChapterMeta(toId);
    const prereqs = meta?.prereq || c.chapter.prereq || [];
    prereqs.forEach((fromId) => {
      const fromPos = pos[fromId];
      if (!fromPos) return;
      edges.push({ id: `${fromId}->${toId}`, fromId, toId, from: fromPos, to: toPos });
    });
  });

  return { width, height, pos, cols, edges };
}

function dagEdgePath(from, to) {
  // Cùng cột (liên tiếp trong 1 lớp): nối cạnh đáy → cạnh đỉnh hoặc vòng mượt bên phải
  if (from.colIdx === to.colIdx) {
    if (to.rowIdx === from.rowIdx + 1) {
      const x = from.x + NODE_W / 2;
      const y1 = from.y + NODE_H;
      const y2 = to.y;
      return `M ${x} ${y1} L ${x} ${y2}`;
    }
    const sx = from.x + NODE_W;
    const sy = from.y + NODE_H * 0.5;
    const tx = to.x + NODE_W;
    const ty = to.y + NODE_H * 0.5;
    const bulge = sx + 26 + Math.min(34, Math.abs(to.rowIdx - from.rowIdx) * 8);
    return `M ${sx} ${sy} C ${bulge} ${sy}, ${bulge} ${ty}, ${tx} ${ty}`;
  }

  // Khác cột (Lớp 10 → 11 hoặc 11 → 12 hoặc 10 → 12): nối cạnh phải → cạnh trái
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H * 0.5;
  const x2 = to.x;
  const y2 = to.y + NODE_H * 0.5;
  const dx = Math.max(46, (x2 - x1) * 0.48);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function statusKindOf(c) {
  const answers = c.answers ?? c.summary?.answers ?? 0;
  const mastery = c.masteryPct ?? c.mastery?.score ?? 0;
  if (c.review?.isDue) return 'decay';
  if (answers >= 6 && mastery >= 78) return 'mastered';
  if (answers > 0 && mastery < 55) return 'weak';
  if (answers > 0) return 'active';
  return 'ready';
}

export default function KnowledgeMap({
  chapters = [],
  selectedId = null,
  onSelect,
  onOpen,
}) {
  const [scale, setScale] = useState(1);
  const [hoverId, setHoverId] = useState(null);
  const wrapRef = useRef(null);

  const { width, height, pos, cols, edges } = useMemo(
    () => buildDagLayout(chapters),
    [chapters],
  );

  const focusId = hoverId || selectedId || null;

  const { upstreamSet, downstreamSet } = useMemo(() => {
    if (!focusId) return { upstreamSet: new Set(), downstreamSet: new Set() };
    return {
      upstreamSet: new Set(getUpstreamIds(focusId)),
      downstreamSet: new Set(getDownstreamIds(focusId)),
    };
  }, [focusId]);

  const fit = useCallback(() => {
    const el = wrapRef.current;
    if (!el || !width) return;
    const avail = Math.max(320, el.clientWidth - 20);
    const next = Math.min(1, Math.max(0.58, avail / width));
    setScale(Number(next.toFixed(2)));
  }, [width]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fit]);

  const zoom = (delta) => setScale((s) => Math.min(1.35, Math.max(0.52, Number((s + delta).toFixed(2)))));

  const handleSelect = (id) => {
    if (onSelect) onSelect(id);
    else onOpen?.(id);
  };

  return (
    <div className="rm-pro-dag-wrap">
      <div className="rm-pro-dag-toolbar">
        <div className="rm-pro-dag-legend" aria-label="Chú giải đồ thị DAG">
          <span className="lg-item"><i className="dot is-mastered" /> Thành thạo</span>
          <span className="lg-item"><i className="dot is-active" /> Đang luyện</span>
          <span className="lg-item"><i className="dot is-decay" /> Cần ôn</span>
          <span className="lg-item"><i className="line is-up" /> Gốc tiên quyết</span>
          <span className="lg-item"><i className="line is-down" /> Nhánh mở khóa</span>
        </div>

        <div className="rm-pro-dag-zoom" role="group" aria-label="Thu phóng đồ thị">
          <button type="button" onClick={() => zoom(-0.1)} aria-label="Thu nhỏ">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(0.1)} aria-label="Phóng to">+</button>
          <button type="button" className="fit-btn" onClick={fit}>Vừa khung</button>
        </div>
      </div>

      <div className="rm-pro-dag-scroll" ref={wrapRef}>
        <svg
          className="rm-pro-dag-svg"
          width={Math.round(width * scale)}
          height={Math.round(height * scale)}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Đồ thị phụ thuộc kiến thức GDPT 2018"
        >
          <defs>
            <pattern id="rm-pro-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.1" className="rm-pro-dag-dot" />
            </pattern>
            <marker id="dag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
              <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="currentColor" />
            </marker>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="url(#rm-pro-grid)" />

          {/* Tiêu đề cột Lớp 10 / 11 / 12 */}
          {cols.map((col, idx) => {
            const x = PAD_X + idx * (NODE_W + COL_GAP);
            return (
              <g key={col.grade} className="rm-pro-dag-colhead">
                <rect x={x} y="16" width={NODE_W} height="30" rx="15" className={`col-pill ${col.tone}`} />
                <text x={x + NODE_W / 2} y="35" textAnchor="middle" className="col-txt">
                  {col.label}
                </text>
              </g>
            );
          })}

          {/* Các cạnh phụ thuộc DAG */}
          <g className="rm-pro-dag-edges">
            {edges.map((e) => {
              const isUpstreamEdge = focusId && (e.toId === focusId || (upstreamSet.has(e.toId) && upstreamSet.has(e.fromId)));
              const isDownstreamEdge = focusId && (e.fromId === focusId || (downstreamSet.has(e.fromId) && downstreamSet.has(e.toId)));
              const isDim = Boolean(focusId) && !isUpstreamEdge && !isDownstreamEdge;
              const cls = isUpstreamEdge
                ? 'is-up'
                : (isDownstreamEdge ? 'is-down' : (isDim ? 'is-dim' : ''));
              return (
                <path
                  key={e.id}
                  d={dagEdgePath(e.from, e.to)}
                  className={`rm-pro-dag-edge ${cls}`}
                  fill="none"
                  markerEnd="url(#dag-arrow)"
                />
              );
            })}
          </g>

          {/* Các Node Chuyên đề */}
          <g className="rm-pro-dag-nodes">
            {chapters.map((c) => {
              const id = c.chapter.id;
              const p = pos[id];
              if (!p) return null;
              const meta = getChapterMeta(id);
              const kind = statusKindOf(c);
              const answers = c.answers ?? c.summary?.answers ?? 0;
              const mastery = c.masteryPct ?? c.mastery?.score ?? 0;

              const isFocus = focusId === id;
              const isSelected = selectedId === id;
              const isUp = upstreamSet.has(id);
              const isDown = downstreamSet.has(id);
              const isDim = Boolean(focusId) && !isFocus && !isUp && !isDown;

              const rawTitle = formatMathAndChemSymbols(c.chapter.name);
              const titleLine = rawTitle.length > 27 ? `${rawTitle.slice(0, 26)}…` : rawTitle;
              const subLine = `${meta?.code || ''} · ${meta?.questionsInExam || c.questionsInExam || '2 câu'}${answers > 0 ? ` · ${mastery}%` : ''}`;

              return (
                <g
                  key={id}
                  className={`rm-pro-dag-node st-${kind} ${isSelected ? 'is-selected' : ''} ${isUp ? 'is-up' : ''} ${isDown ? 'is-down' : ''} ${isDim ? 'is-dim' : ''}`}
                  transform={`translate(${p.x}, ${p.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${c.chapter.name}, lớp ${p.grade}, thành thạo ${answers > 0 ? `${mastery}%` : 'chưa học'}`}
                  onMouseEnter={() => setHoverId(id)}
                  onMouseLeave={() => setHoverId((cur) => (cur === id ? null : cur))}
                  onFocus={() => setHoverId(id)}
                  onBlur={() => setHoverId((cur) => (cur === id ? null : cur))}
                  onClick={() => handleSelect(id)}
                  onDoubleClick={() => onOpen?.(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(id);
                    }
                  }}
                >
                  <rect width={NODE_W} height={NODE_H} rx="14" className="node-bg" />
                  <rect x="0" y="14" width="4.5" height={NODE_H - 28} rx="2.25" className="node-accent" />

                  <text x="16" y="24" className="node-meta">{subLine}</text>
                  <text x="16" y="48" className="node-title">{titleLine}</text>

                  {/* Thanh tiến độ mini trong node */}
                  <rect x="16" y="64" width={NODE_W - 64} height="5" rx="2.5" className="node-bar-bg" />
                  <rect
                    x="16"
                    y="64"
                    width={answers > 0 ? Math.max(10, Math.round(((NODE_W - 64) * Math.min(100, mastery)) / 100)) : 0}
                    height="5"
                    rx="2.5"
                    className="node-bar-fill"
                  />

                  <text x={NODE_W - 14} y="69" textAnchor="end" className="node-pct">
                    {answers > 0 ? `${mastery}%` : 'Mới'}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
