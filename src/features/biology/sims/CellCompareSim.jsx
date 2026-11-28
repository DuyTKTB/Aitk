import React, { useState } from 'react';

const CELLS = {
  animal: {
    name: 'Tế bào Động vật',
    group: 'Nhân thực (Eukaryote)',
    size: '10 – 30 µm',
    color: '#3b82f6',
    features: { nucleus: 'Có (màng kép)', wall: 'Không', chloroplast: 'Không', mitochondria: 'Nhiều', special: 'Có Trung thể & Lysosome; hình dạng linh hoạt' },
    desc: 'Không có thành cellulose nên dễ biến đổi hình dạng, linh hoạt trong di chuyển và phân chia.',
  },
  plant: {
    name: 'Tế bào Thực vật',
    group: 'Nhân thực (Eukaryote)',
    size: '20 – 100 µm',
    color: '#10b981',
    features: { nucleus: 'Có (đẩy lệch cạnh)', wall: 'Có (Cellulose)', chloroplast: 'Có (Quang hợp)', mitochondria: 'Có', special: 'Không bào trung tâm lớn duy trì sức trương' },
    desc: 'Hình khối đa giác ổn định nhờ thành cellulose; tự dưỡng quang hợp nhờ hệ lục lạp.',
  },
  bacteria: {
    name: 'Tế bào Vi khuẩn (E. coli)',
    group: 'Nhân sơ (Prokaryote)',
    size: '1 – 5 µm',
    color: '#f59e0b',
    features: { nucleus: 'Chưa có màng nhân (vùng nhân)', wall: 'Có (Peptidoglycan)', chloroplast: 'Không', mitochondria: 'Không (hô hấp tại màng)', special: 'DNA vòng trần + Plasmid, Ribosome 70S, có roi & lông' },
    desc: 'Kích thước rất nhỏ → tỉ lệ S/V lớn → trao đổi chất và sinh sản cực nhanh.',
  },
  neuron: {
    name: 'Tế bào Thần kinh (Neuron)',
    group: 'Tế bào chuyên hóa (Động vật)',
    size: 'Sợi trục dài tới >1 m',
    color: '#8b5cf6',
    features: { nucleus: 'Có (ở thân neuron)', wall: 'Không', chloroplast: 'Không', mitochondria: 'Rất nhiều (tạo ATP bơm Na⁺/K⁺)', special: 'Nhiều sợi nhánh, 1 sợi trục bọc myelin & cúc synapse' },
    desc: 'Chuyên hóa cao để tiếp nhận kích thích, phát sinh và dẫn truyền xung thần kinh tốc độ cao.',
  },
  muscle: {
    name: 'Tế bào Cơ vân',
    group: 'Tế bào chuyên hóa (Động vật)',
    size: 'Đường kính 10–100 µm, dài vài cm',
    color: '#e11d48',
    features: { nucleus: 'Nhiều nhân nằm sát màng', wall: 'Không', chloroplast: 'Không', mitochondria: 'Cực kỳ nhiều', special: 'Tơ cơ Actin & Myosin xếp vân sáng–tối tạo lực co cơ' },
    desc: 'Hợp bào đa nhân giàu ti thể và lưới nội cơ tương dự trữ Ca²⁺ phục vụ co rút mạnh.',
  },
  rbc: {
    name: 'Tế bào Hồng cầu người',
    group: 'Tế bào chuyên hóa (Máu)',
    size: '7 – 8 µm',
    color: '#dc2626',
    features: { nucleus: 'KHÔNG có nhân (khi trưởng thành)', wall: 'Không', chloroplast: 'Không', mitochondria: 'Không (hô hấp kị khí)', special: 'Hình đĩa lõm 2 mặt, chứa ~270 triệu phân tử Hemoglobin' },
    desc: 'Hình đĩa lõm 2 mặt làm tăng diện tích tiếp xúc khuếch tán O₂ và dễ biến dạng chui qua mao mạch nhỏ.',
  },
};

function CellDiagramSvg({ type }) {
  const meta = CELLS[type];
  return (
    <svg viewBox="0 0 260 170" style={{ width: '100%', height: 165, background: '#071224', borderRadius: 12 }}>
      {type === 'animal' && (
        <g>
          <ellipse cx="130" cy="85" rx="95" ry="62" fill="rgba(59,130,246,0.22)" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="122" cy="82" r="28" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="2" />
          <circle cx="128" cy="78" r="9" fill="#ddd6fe" />
          <ellipse cx="178" cy="65" rx="18" ry="9" fill="#f97316" transform="rotate(20 178 65)" />
          <ellipse cx="76" cy="108" rx="17" ry="8" fill="#f97316" transform="rotate(-25 76 108)" />
          <circle cx="174" cy="108" r="9" fill="#ef4444" />
          <path d="M90 60 Q112 45 140 52" stroke="#ec4899" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {type === 'plant' && (
        <g>
          <rect x="28" y="20" width="204" height="130" rx="16" fill="rgba(22,163,74,0.2)" stroke="#22c55e" strokeWidth="6" />
          <rect x="37" y="29" width="186" height="112" rx="10" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <ellipse cx="152" cy="86" rx="54" ry="38" fill="rgba(6,182,212,0.45)" stroke="#22d3ee" strokeWidth="2" />
          <circle cx="72" cy="64" r="22" fill="#7c3aed" />
          <ellipse cx="75" cy="118" rx="18" ry="9" fill="#22c55e" />
          <ellipse cx="188" cy="46" rx="16" ry="8" fill="#22c55e" />
          <ellipse cx="110" cy="126" rx="13" ry="6" fill="#f97316" />
        </g>
      )}
      {type === 'bacteria' && (
        <g>
          <rect x="52" y="54" width="132" height="62" rx="31" fill="rgba(245,158,11,0.22)" stroke="#f59e0b" strokeWidth="4" />
          <path d="M88 85 C95 66, 118 102, 130 78 C142 62, 152 102, 162 82" stroke="#fb7185" strokeWidth="3.5" fill="none" />
          <circle cx="76" cy="86" r="9" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
          <path d="M184 85 Q210 62 225 85 T252 80" stroke="#fbbf24" strokeWidth="3" fill="none" />
        </g>
      )}
      {type === 'neuron' && (
        <g>
          <path d="M55 85 L22 50 M55 85 L18 85 M55 85 L28 122 M55 85 L44 38" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
          <circle cx="66" cy="85" r="22" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="2" />
          <circle cx="66" cy="85" r="8" fill="#ede9fe" />
          <line x1="88" y1="85" x2="220" y2="85" stroke="#c4b5fd" strokeWidth="3" />
          {[100, 136, 172].map((x) => (
            <rect key={x} x={x} y="76" width="28" height="18" rx="8" fill="#38bdf8" opacity="0.85" />
          ))}
          <path d="M220 85 L242 66 M220 85 L245 85 M220 85 L242 104" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {type === 'muscle' && (
        <g>
          <rect x="20" y="42" width="220" height="86" rx="18" fill="rgba(225,29,72,0.26)" stroke="#fb7185" strokeWidth="3" />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={32 + i * 20} y="46" width="8" height="78" fill="rgba(251,113,133,0.45)" />
          ))}
          {[62, 135, 202].map((cx) => (
            <ellipse key={cx} cx={cx} cy="52" rx="11" ry="5" fill="#7c3aed" />
          ))}
        </g>
      )}
      {type === 'rbc' && (
        <g>
          <ellipse cx="130" cy="85" rx="76" ry="54" fill="#dc2626" stroke="#fca5a5" strokeWidth="3" />
          <ellipse cx="130" cy="85" rx="34" ry="22" fill="#991b1b" opacity="0.85" />
          <text x="130" y="156" textAnchor="middle" fontSize="10.5" fill="#fecaca">Lõm 2 mặt · Giàu Hemoglobin · Không nhân</text>
        </g>
      )}
      <text x="12" y="18" fontSize="11" fontWeight="700" fill={meta.color}>{meta.name} ({meta.size})</text>
    </svg>
  );
}

const ROW_LABELS = [
  ['nucleus', 'Nhân tế bào'],
  ['wall', 'Thành tế bào'],
  ['chloroplast', 'Lục lạp'],
  ['mitochondria', 'Ti thể'],
  ['special', 'Đặc điểm thích nghi nổi bật'],
];

export default function CellCompareSim() {
  const [left, setLeft] = useState('animal');
  const [right, setRight] = useState('plant');
  const cellKeys = Object.keys(CELLS);

  return (
    <div className="bl-controls">
      <div className="bl-grid-equal">
        {[{ side: 'Trái', val: left, set: setLeft }, { side: 'Phải', val: right, set: setRight }].map(({ side, val, set }) => (
          <div key={side} className="bl-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <strong style={{ fontSize: '0.84rem' }}>Mẫu đối chiếu ({side}):</strong>
              <select
                className="bl-search-input"
                style={{ width: 'auto', margin: 0 }}
                value={val}
                onChange={(e) => set(e.target.value)}
              >
                {cellKeys.map((k) => <option key={k} value={k}>{CELLS[k].name}</option>)}
              </select>
            </div>
            <CellDiagramSvg type={val} />
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--bl-mut)', lineHeight: 1.45 }}>
              <b style={{ color: 'var(--bl-ink)' }}>{CELLS[val].group}:</b> {CELLS[val].desc}
            </p>
          </div>
        ))}
      </div>

      <div className="bl-panel">
        <h4>Bảng Đối Chiếu Đặc Điểm Cấu Tạo</h4>
        <table className="bl-table">
          <thead>
            <tr>
              <th>Tiêu chí</th>
              <th>{CELLS[left].name}</th>
              <th>{CELLS[right].name}</th>
              <th>Nhận xét</th>
            </tr>
          </thead>
          <tbody>
            {ROW_LABELS.map(([key, label]) => {
              const v1 = CELLS[left].features[key];
              const v2 = CELLS[right].features[key];
              const same = v1 === v2;
              return (
                <tr key={key}>
                  <td><strong>{label}</strong></td>
                  <td>{v1}</td>
                  <td>{v2}</td>
                  <td>
                    <span className={same ? 'bl-pill' : 'bl-pill-soft'}>
                      {same ? 'Giống nhau' : 'Khác biệt'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
