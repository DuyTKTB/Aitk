import React, { useEffect, useState } from 'react';

const DIGESTIVE_STAGES = [
  { id: 'mouth', name: '1. Khoang miệng', ph: 7.0, mech: 'Răng nhai nghiền, lưỡi đảo trộn tạo viên thức ăn', chem: 'Enzyme Amylase nước bọt thủy phân 1 phần Tinh bột → Đường Maltose.', active: { starch: 25, protein: 0, lipid: 0 } },
  { id: 'esophagus', name: '2. Thực quản', ph: 6.8, mech: 'Nhu động cơ trơn đẩy viên thức ăn xuống dạ dày trong ~5–8 giây', chem: 'Không tiết enzyme tiêu hóa; Amylase nước bọt tiếp tục tác dụng nhẹ.', active: { starch: 30, protein: 0, lipid: 0 } },
  { id: 'stomach', name: '3. Dạ dày', ph: 2.0, mech: 'Co bóp nhào trộn mạnh thành nhũ trấp', chem: 'Acid HCl diệt khuẩn & hoạt hóa Pepsinogen → Pepsin cắt Protein chuỗi dài thành các chuỗi Polypeptide ngắn.', active: { starch: 30, protein: 45, lipid: 5 } },
  { id: 'duodenum', name: '4. Tá tràng (Đầu ruột non)', ph: 7.8, mech: 'Hòa trộn dịch mật (từ gan) & dịch tụy (NaHCO₃ trung hòa HCl)', chem: 'Muối mật nhũ tương hóa Lipid; Trypsin, Amylase tụy, Lipase thủy phân mạnh cả 3 nhóm chất.', active: { starch: 85, protein: 85, lipid: 80 } },
  { id: 'small_int', name: '5. Ruột non (Hấp thụ chính)', ph: 8.0, mech: 'Lông ruột (villi) & vi nhung mao tăng diện tích hấp thụ tới ~250 m²', chem: 'Hoàn tất phân giải thành Glucose, Amino acid (hấp thụ vào mao mạch máu) và Acid béo + Glycerol (vào mạch bạch huyết).', active: { starch: 100, protein: 100, lipid: 100 } },
  { id: 'large_int', name: '6. Ruột già', ph: 7.2, mech: 'Co bóp dồn chất bã về trực tràng', chem: 'Hấp thụ lại phần lớn nước & ion khoáng; vi khuẩn cộng sinh tổng hợp Vitamin K, nhóm B.', active: { starch: 100, protein: 100, lipid: 100 } },
];

export default function DigestiveSim() {
  const [stageIdx, setStageIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [meal, setMeal] = useState('mixed'); // 'starch' | 'protein' | 'lipid' | 'mixed'

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      setStageIdx((i) => {
        if (i >= DIGESTIVE_STAGES.length - 1) {
          setRunning(false);
          return i;
        }
        return i + 1;
      });
    }, 1700);
    return () => clearInterval(t);
  }, [running]);

  const cur = DIGESTIVE_STAGES[stageIdx];
  const breakdown = cur.active;

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-tabs">
          {[
            { id: 'mixed', label: 'Bữa ăn đầy đủ' },
            { id: 'starch', label: 'Giàu Tinh bột (Cơm)' },
            { id: 'protein', label: 'Giàu Protein (Thịt)' },
            { id: 'lipid', label: 'Giàu Lipid (Dầu/Mỡ)' },
          ].map((m) => (
            <button key={m.id} type="button" className={`bl-tab${meal === m.id ? ' on' : ''}`} onClick={() => { setMeal(m.id); setStageIdx(0); }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="bl-panel" style={{ background: '#071224', color: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" className="bl-btn primary" onClick={() => { if (stageIdx >= 5) setStageIdx(0); setRunning((r) => !r); }}>
              {running ? 'Tạm dừng' : 'Bắt đầu nuốt & tiêu hóa'}
            </button>
            <button type="button" className="bl-btn" onClick={() => { setRunning(false); setStageIdx((i) => Math.max(0, i - 1)); }}>← Cơ quan trước</button>
            <button type="button" className="bl-btn" onClick={() => { setRunning(false); setStageIdx((i) => Math.min(5, i + 1)); }}>Cơ quan tiếp →</button>
          </div>

          <div style={{ display: 'grid', gap: 7 }}>
            {DIGESTIVE_STAGES.map((st, idx) => {
              const isCur = idx === stageIdx;
              const isDone = idx < stageIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { setRunning(false); setStageIdx(idx); }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: 11,
                    border: isCur ? '1.5px solid #10b981' : '1px solid rgba(148,163,184,0.22)',
                    background: isCur ? 'rgba(16,185,129,0.2)' : isDone ? 'rgba(47,107,255,0.1)' : 'rgba(15,23,42,0.75)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ fontSize: '0.84rem' }}>{isCur ? '● ' : isDone ? '✓ ' : '○ '}{st.name}</strong>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: st.ph < 4 ? '#fb7185' : '#38bdf8' }}>
                    pH ≈ {st.ph.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>{cur.name} (pH = {cur.ph.toFixed(1)})</h4>
          <p style={{ margin: '0 0 8px', fontSize: '0.82rem', lineHeight: 1.5 }}>
            <strong>Tiêu hóa cơ học:</strong> {cur.mech}
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
            <strong>Tiêu hóa hóa học &amp; Enzyme:</strong> {cur.chem}
          </p>
        </div>

        <div className="bl-panel">
          <h4>Mức độ Phân giải thành Đơn phân Hấp thụ</h4>
          {[
            { key: 'starch', label: 'Tinh bột → Glucose (Amylase / Maltase)', color: '#f59e0b', show: meal === 'mixed' || meal === 'starch' },
            { key: 'protein', label: 'Protein → Amino acid (Pepsin / Trypsin)', color: '#ef4444', show: meal === 'mixed' || meal === 'protein' },
            { key: 'lipid', label: 'Lipid → Acid béo + Glycerol (Mật + Lipase)', color: '#10b981', show: meal === 'mixed' || meal === 'lipid' },
          ].filter((x) => x.show).map((row) => (
            <div key={row.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
                <span>{row.label}</span>
                <b>{breakdown[row.key]}%</b>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--bl-surface)', overflow: 'hidden' }}>
                <div style={{ width: `${breakdown[row.key]}%`, height: '100%', background: row.color, transition: 'width 0.35s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
