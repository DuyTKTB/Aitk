import React, { useMemo, useState } from 'react';
import { calcEnergyPyramid } from '../bioEngine.js';

const SPECIES = [
  { id: 'grass', name: 'Cỏ & Cây xanh', level: 1, x: 135, y: 292, color: '#16a34a', role: 'Sinh vật sản xuất' },
  { id: 'algae', name: 'Tảo & Thực vật nước', level: 1, x: 385, y: 292, color: '#059669', role: 'Sinh vật sản xuất' },
  { id: 'rabbit', name: 'Thỏ đồng', level: 2, x: 88, y: 210, color: '#0284c7', role: 'Tiêu thụ bậc 1' },
  { id: 'hopper', name: 'Châu chấu', level: 2, x: 245, y: 210, color: '#0ea5e9', role: 'Tiêu thụ bậc 1' },
  { id: 'fish', name: 'Cá nhỏ', level: 2, x: 418, y: 210, color: '#06b6d4', role: 'Tiêu thụ bậc 1' },
  { id: 'fox', name: 'Cáo đỏ', level: 3, x: 112, y: 122, color: '#f59e0b', role: 'Tiêu thụ bậc 2' },
  { id: 'frog', name: 'Ếch đồng', level: 3, x: 268, y: 122, color: '#d97706', role: 'Tiêu thụ bậc 2' },
  { id: 'snake', name: 'Rắn nước', level: 3, x: 404, y: 122, color: '#ea580c', role: 'Tiêu thụ bậc 2' },
  { id: 'eagle', name: 'Đại bàng', level: 4, x: 256, y: 42, color: '#dc2626', role: 'Đỉnh lưới thức ăn (Bậc 3)' },
];

const EDGES = [
  ['grass', 'rabbit'],
  ['grass', 'hopper'],
  ['algae', 'fish'],
  ['rabbit', 'fox'],
  ['rabbit', 'eagle'],
  ['hopper', 'frog'],
  ['fish', 'frog'],
  ['fish', 'snake'],
  ['frog', 'snake'],
  ['fox', 'eagle'],
  ['snake', 'eagle'],
  ['frog', 'eagle'],
];

export default function FoodWebSim({ onAskAI }) {
  const [alive, setAlive] = useState(() => Object.fromEntries(SPECIES.map((s) => [s.id, true])));
  const [producerKcal, setProducerKcal] = useState(100000);
  const [efficiencyPct, setEfficiencyPct] = useState(10);
  const [selectedId, setSelectedId] = useState('eagle');

  const toggleSpecies = (id) => {
    setAlive((prev) => ({ ...prev, [id]: !prev[id] }));
    setSelectedId(id);
  };

  const resetAll = () => {
    setAlive(Object.fromEntries(SPECIES.map((s) => [s.id, true])));
    setProducerKcal(100000);
    setEfficiencyPct(10);
  };

  const pyramid = useMemo(() => calcEnergyPyramid(producerKcal, efficiencyPct), [producerKcal, efficiencyPct]);

  // Tính toán hiệu ứng dây chuyền (trophic cascade)
  const speciesStatus = useMemo(() => {
    const map = {};
    SPECIES.forEach((s) => {
      if (!alive[s.id]) {
        map[s.id] = { state: 'extinct', label: 'Tuyệt chủng / Loại bỏ', popPct: 0 };
        return;
      }
      if (s.level === 1) {
        const activePredators = EDGES.filter(([u, v]) => u === s.id && alive[v]).length;
        const totalPredators = EDGES.filter(([u]) => u === s.id).length;
        const popPct = totalPredators > 0 && activePredators < totalPredators ? 128 : 100;
        map[s.id] = {
          state: popPct > 100 ? 'boom' : 'stable',
          label: popPct > 100 ? 'Bùng phát sinh khối' : 'Ổn định',
          popPct,
        };
        return;
      }
      const preyIds = EDGES.filter(([, v]) => v === s.id).map(([u]) => u);
      const alivePrey = preyIds.filter((p) => alive[p] && map[p]?.state !== 'starved');
      const predIds = EDGES.filter(([u]) => u === s.id).map(([, v]) => v);
      const alivePred = predIds.filter((p) => alive[p]);

      if (alivePrey.length === 0) {
        map[s.id] = { state: 'starved', label: 'Thiếu thức ăn nghiêm trọng (Suy kiệt)', popPct: 12 };
      } else {
        const foodRatio = alivePrey.length / Math.max(1, preyIds.length);
        const predPressure = predIds.length > 0 ? alivePred.length / predIds.length : 1;
        const popPct = Math.round(100 * foodRatio * (1.25 - 0.25 * predPressure));
        if (popPct > 112) map[s.id] = { state: 'boom', label: 'Tăng mạnh (Giảm thiên địch)', popPct };
        else if (popPct < 75) map[s.id] = { state: 'declining', label: 'Suy giảm (Thiếu nguồn mồi)', popPct };
        else map[s.id] = { state: 'stable', label: 'Cân bằng sinh thái', popPct };
      }
    });
    return map;
  }, [alive]);

  const activeChains = useMemo(() => {
    const activeEdges = EDGES.filter(([u, v]) => alive[u] && alive[v]);
    return activeEdges.length;
  }, [alive]);

  const extinctList = SPECIES.filter((s) => !alive[s.id]);
  const stressedList = SPECIES.filter((s) => alive[s.id] && (speciesStatus[s.id]?.state === 'starved' || speciesStatus[s.id]?.state === 'declining'));
  const selectedSp = SPECIES.find((s) => s.id === selectedId) || SPECIES[0];
  const selectedSt = speciesStatus[selectedSp.id];

  const byId = useMemo(() => Object.fromEntries(SPECIES.map((s) => [s.id, s])), []);

  return (
    <div className="bl-grid-2">
      <div className="bl-stage">
        <svg viewBox="0 0 520 340" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Lưới thức ăn và dòng năng lượng">
          <defs>
            <marker id="fw-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="fw-arrow-off" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Trophic bands */}
          {[
            { y: 14, h: 58, label: 'Bậc 4 · Đỉnh', bg: 'rgba(220,38,38,0.06)' },
            { y: 92, h: 62, label: 'Bậc 3 · Ăn thịt nhỏ', bg: 'rgba(245,158,11,0.06)' },
            { y: 178, h: 64, label: 'Bậc 2 · Ăn cỏ', bg: 'rgba(14,165,233,0.06)' },
            { y: 262, h: 64, label: 'Bậc 1 · Sản xuất', bg: 'rgba(16,185,129,0.07)' },
          ].map((b) => (
            <g key={b.label}>
              <rect x="8" y={b.y} width="504" height={b.h} rx="10" fill={b.bg} />
              <text x="16" y={b.y + 15} fontSize="10" fontWeight="700" fill="currentColor" opacity="0.55">
                {b.label}
              </text>
            </g>
          ))}

          {/* Edges */}
          {EDGES.map(([u, v]) => {
            const a = byId[u];
            const b = byId[v];
            const active = alive[u] && alive[v];
            const highlight = active && (selectedId === u || selectedId === v);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            const x1 = a.x + (dx / dist) * 26;
            const y1 = a.y + (dy / dist) * 22;
            const x2 = b.x - (dx / dist) * 30;
            const y2 = b.y - (dy / dist) * 24;
            return (
              <line
                key={`${u}-${v}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={active ? (highlight ? '#059669' : '#10b981') : '#94a3b8'}
                strokeOpacity={active ? (highlight ? 0.95 : 0.55) : 0.28}
                strokeWidth={highlight ? 2.6 : 1.7}
                strokeDasharray={active ? undefined : '4 4'}
                markerEnd={active ? 'url(#fw-arrow)' : 'url(#fw-arrow-off)'}
              />
            );
          })}

          {/* Nodes */}
          {SPECIES.map((s) => {
            const st = speciesStatus[s.id];
            const isAlive = alive[s.id];
            const isSel = selectedId === s.id;
            return (
              <g
                key={s.id}
                transform={`translate(${s.x}, ${s.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSpecies(s.id)}
              >
                <rect
                  x="-54"
                  y="-20"
                  width="108"
                  height="40"
                  rx="12"
                  fill={isAlive ? s.color : '#64748b'}
                  fillOpacity={isAlive ? (st.state === 'starved' ? 0.45 : 0.92) : 0.25}
                  stroke={isSel ? '#0f172a' : (st.state === 'starved' ? '#dc2626' : '#ffffff')}
                  strokeWidth={isSel ? 2.6 : 1.5}
                />
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={isAlive ? '#ffffff' : 'currentColor'}
                  textDecoration={isAlive ? undefined : 'line-through'}
                >
                  {s.name}
                </text>
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={isAlive ? 'rgba(255,255,255,0.92)' : 'currentColor'}
                  opacity={isAlive ? 1 : 0.7}
                >
                  {isAlive ? `Quần thể: ${st.popPct}%` : 'Đã loại bỏ'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Energy Pyramid */}
        <div className="bl-info-card" style={{ marginTop: 12 }}>
          <h4 style={{ marginBottom: 8 }}>Tháp năng lượng sinh thái (Hiệu suất truyền {efficiencyPct}% / bậc)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {[...pyramid].reverse().map((lvl, idx) => {
              const widths = [34, 54, 76, 98];
              const colors = ['#dc2626', '#f59e0b', '#0284c7', '#10b981'];
              return (
                <div
                  key={lvl.level}
                  style={{
                    width: `${widths[idx]}%`,
                    background: colors[idx],
                    color: '#fff',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span>Bậc {lvl.level}: {lvl.name.split(' (')[0]}</span>
                  <span>{lvl.energy.toLocaleString('vi-VN')} kcal</span>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: 8, fontSize: 12 }}>
            Khoảng <strong>{100 - efficiencyPct}%</strong> năng lượng bị thất thoát ở mỗi bậc dinh dưỡng qua hô hấp (tỏa nhiệt), bài tiết và phần không tiêu hóa được.
          </p>
        </div>
      </div>

      <div className="bl-panel">
        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Năng lượng sinh vật sản xuất (kcal)</label>
            <strong>{producerKcal.toLocaleString('vi-VN')} kcal</strong>
          </div>
          <input
            type="range"
            className="bl-range"
            min="20000"
            max="500000"
            step="10000"
            value={producerKcal}
            onChange={(e) => setProducerKcal(Number(e.target.value))}
          />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Hiệu suất sinh thái qua mỗi bậc (%)</label>
            <strong>{efficiencyPct}%</strong>
          </div>
          <input
            type="range"
            className="bl-range"
            min="5"
            max="20"
            step="1"
            value={efficiencyPct}
            onChange={(e) => setEfficiencyPct(Number(e.target.value))}
          />
        </div>

        <div className="bl-ctrl">
          <label>Thử nghiệm xáo trộn hệ sinh thái (Bấm để loại bỏ / khôi phục loài)</label>
          <div className="bl-toggle-grid">
            {SPECIES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`bl-toggle-chip${alive[s.id] ? ' on' : ''}`}
                onClick={() => toggleSpecies(s.id)}
              >
                {alive[s.id] ? '✓' : '✕'} {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bl-kpis">
          <div className="bl-kpi">
            <span>Liên kết dinh dưỡng</span>
            <strong>{activeChains}/{EDGES.length}</strong>
          </div>
          <div className="bl-kpi">
            <span>Loài bị suy kiệt</span>
            <strong style={{ color: stressedList.length ? '#dc2626' : '#059669' }}>{stressedList.length} loài</strong>
          </div>
          <div className="bl-kpi">
            <span>Đỉnh lưới (Bậc 4)</span>
            <strong>{pyramid[3].energy.toLocaleString('vi-VN')} kcal</strong>
          </div>
        </div>

        <div className="bl-info-card">
          <h4>Phân tích loài: {selectedSp.name}</h4>
          <p>
            <strong>Vai trò:</strong> {selectedSp.role} · <strong>Trạng thái:</strong> {selectedSt?.label}
          </p>
          <p style={{ marginTop: 6 }}>
            {extinctList.length === 0
              ? 'Hệ sinh thái đang có độ đa dạng tối đa — lưới thức ăn càng phức tạp, tính ổn định sinh học càng cao.'
              : `Đang loại bỏ: ${extinctList.map((s) => s.name).join(', ')}. ${stressedList.length ? `Cảnh báo hiệu ứng dây chuyền lên: ${stressedList.map((s) => s.name).join(', ')}.` : 'Các loài khác vẫn duy trì được nguồn thức ăn thay thế.'}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="bl-btn" onClick={resetAll}>
            Khôi phục hệ sinh thái
          </button>
          <button
            type="button"
            className="bl-btn cobalt"
            onClick={() =>
              onAskAI?.(
                `Trong lưới thức ăn đồng cỏ, khi loại bỏ ${extinctList.length ? extinctList.map((s) => s.name).join(', ') : 'Ếch đồng và Rắn'}, điều gì xảy ra với các bậc dinh dưỡng còn lại và tại sao hiệu suất sinh thái chỉ đạt khoảng ${efficiencyPct}%?`
              )
            }
          >
            Hỏi Bé ELEC về hiệu ứng dây chuyền
          </button>
        </div>
      </div>
    </div>
  );
}
