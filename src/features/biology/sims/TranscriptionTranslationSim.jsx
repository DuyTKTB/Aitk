import React, { useEffect, useMemo, useState } from 'react';
import { analyzeDnaSequence } from '../bioEngine.js';

const PRESET_GENES = [
  { id: 'normal', label: 'Đoạn gen chuẩn', seq: 'TACCGGAAATTTGCTCTGATT' },
  { id: 'silent', label: 'Đột biến đồng nghĩa', seq: 'TACCGAAAATTTGCTCTGATT' },
  { id: 'missense', label: 'Đột biến sai nghĩa', seq: 'TACCGGACATTTGCTCTGATT' },
  { id: 'nonsense', label: 'Đột biến vô nghĩa (STOP sớm)', seq: 'TACCGGAAATTGACTCTGATT' },
  { id: 'frameshift', label: 'Đột biến dịch khung (Mất nu)', seq: 'TACGAAATTTGCTCTGATT' },
];

const AA_COLORS = {
  Met: '#10b981',
  STOP: '#ef4444',
  Phe: '#3b82f6',
  Leu: '#0ea5e9',
  Ala: '#8b5cf6',
  Gly: '#f59e0b',
  Lys: '#ec4899',
  Cys: '#14b8a6',
};

export default function TranscriptionTranslationSim() {
  const [dnaSeq, setDnaSeq] = useState(PRESET_GENES[0].seq);
  const [riboStep, setRiboStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const baseRef = useMemo(() => analyzeDnaSequence(PRESET_GENES[0].seq), []);
  const cur = useMemo(() => analyzeDnaSequence(dnaSeq), [dnaSeq]);

  const maxStep = Math.max(0, cur.codons.length - 1);
  const clampedStep = Math.min(riboStep, maxStep);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => {
      setRiboStep((s) => (s >= maxStep ? 0 : s + 1));
    }, 950);
    return () => clearInterval(t);
  }, [playing, maxStep]);

  const activePolypeptide = cur.aminoAcids.slice(0, clampedStep + 1);
  const curCodon = cur.codons[clampedStep] || '—';
  const curAnti = cur.anticodons[clampedStep] || '—';
  const curAA = cur.aminoAcids[clampedStep] || '—';

  const mutationSummary = useMemo(() => {
    const a = baseRef.aminoAcids.join('-');
    const b = cur.aminoAcids.join('-');
    if (dnaSeq === PRESET_GENES[0].seq) return 'Mạch chuẩn gốc (chưa có đột biến).';
    if (a === b) return 'Đột biến ĐỒNG NGHĨA (do tính thoái hóa của mã di truyền — chuỗi polypeptide không đổi).';
    if (cur.aminoAcids.length < baseRef.aminoAcids.length && cur.aminoAcids.includes('STOP')) {
      return 'Đột biến VÔ NGHĨA — xuất hiện codon kết thúc sớm làm chuỗi polypeptide bị cắt ngắn!';
    }
    if (dnaSeq.length !== PRESET_GENES[0].seq.length) {
      return 'Đột biến DỊCH KHUNG (mất/thêm nu) — toàn bộ bộ ba từ điểm đột biến trở về sau bị lệch khung đọc!';
    }
    return 'Đột biến SAI NGHĨA — làm thay đổi ít nhất 1 amino acid trên chuỗi polypeptide.';
  }, [baseRef.aminoAcids, cur.aminoAcids, dnaSeq]);

  // Tọa độ Ribosome trượt mượt trên sân khấu SVG 560x210
  const riboX = 110 + (maxStep > 0 ? (clampedStep / maxStep) * 340 : 170);

  return (
    <div className="bl-controls">
      <div className="bl-tabs">
        {PRESET_GENES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`bl-tab${dnaSeq === g.seq ? ' on' : ''}`}
            onClick={() => { setDnaSeq(g.seq); setRiboStep(0); setPlaying(false); }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Sân khấu Ribosome 2 tiểu phần + tRNA lá chẻ 3 + Chuỗi Polypeptide */}
      <div className="bl-canvas-box" style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <strong style={{ color: '#34d399', fontSize: '0.86rem' }}>
            Phức hợp Ribosome dịch mã trên mRNA (5&apos; → 3&apos;) · Khoang E – P – A
          </strong>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="bl-mini-btn primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Tạm dừng' : '▶ Chạy Ribosome'}
            </button>
            <button type="button" className="bl-mini-btn" onClick={() => { setPlaying(false); setRiboStep((s) => Math.max(0, s - 1)); }}>
              ← Codon trước
            </button>
            <button type="button" className="bl-mini-btn" onClick={() => { setPlaying(false); setRiboStep((s) => Math.min(maxStep, s + 1)); }}>
              Codon tiếp →
            </button>
          </div>
        </div>

        <svg viewBox="0 0 560 205" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Sơ đồ Ribosome dịch mã mRNA">
          <defs>
            <linearGradient id="riboLargeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="riboSmallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Ribosome trượt mượt */}
          <g style={{ transform: `translateX(${riboX - 280}px)`, transition: 'transform 0.42s cubic-bezier(0.22,1,0.36,1)' }}>
            {/* Tiểu phần lớn (60S) */}
            <path d="M 210 132 C 210 52, 350 52, 350 132 Z" fill="url(#riboLargeGrad)" stroke="#60a5fa" strokeWidth="2" />
            {/* 3 khoang E - P - A */}
            {[{ l: 'E', x: 242 }, { l: 'P', x: 280 }, { l: 'A', x: 318 }].map((slot) => (
              <g key={slot.l}>
                <rect x={slot.x - 14} y="76" width="28" height="48" rx="6" fill="rgba(15,23,42,0.45)" stroke="rgba(147,197,253,0.45)" strokeDasharray="3 2" />
                <text x={slot.x} y="90" textAnchor="middle" fontSize="10" fontWeight="800" fill="#93c5fd">{slot.l}</text>
              </g>
            ))}

            {/* Tiểu phần nhỏ (40S) bên dưới mRNA */}
            <rect x="220" y="152" width="120" height="30" rx="15" fill="url(#riboSmallGrad)" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="280" y="171" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#e0f2fe">Tiểu phần nhỏ Ribosome</text>

            {/* Phân tử tRNA hình lá chẻ 3 ở khoang P */}
            {curAA !== 'STOP' && curAA !== '—' && (
              <g transform="translate(280, 108)">
                <path d="M 0 18 L 0 -18 M -10 -4 C -16 -12, -4 -20, 0 -10 M 10 -4 C 16 -12, 4 -20, 0 -10" stroke="#facc15" strokeWidth="3" fill="none" strokeLinecap="round" />
                <rect x="-18" y="14" width="36" height="14" rx="4" fill="#ca8a04" />
                <text x="0" y="24" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#ffffff" fontFamily="monospace">{curAnti}</text>
              </g>
            )}

            {/* Chuỗi hạt Amino Acid (Polypeptide) vươn lên trên Ribosome */}
            {activePolypeptide.map((aa, i) => {
              const offset = activePolypeptide.length - 1 - i;
              const px = 280 - offset * 28;
              const py = 54 - Math.sin(offset * 0.9) * 12;
              return (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={280 - (offset + 1) * 28}
                      y1={54 - Math.sin((offset + 1) * 0.9) * 12}
                      x2={px}
                      y2={py}
                      stroke="#cbd5e1"
                      strokeWidth="2.5"
                    />
                  )}
                  <circle cx={px} cy={py} r="12.5" fill={AA_COLORS[aa] || '#2f6bff'} stroke="#ffffff" strokeWidth="1.5" />
                  <text x={px} y={py + 3.5} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#ffffff">{aa}</text>
                </g>
              );
            })}
          </g>

          {/* Sợi mRNA 5' -> 3' chạy ngang giữa 2 tiểu phần */}
          <rect x="24" y="133" width="512" height="18" rx="9" fill="rgba(16, 185, 129, 0.25)" stroke="#34d399" strokeWidth="1.8" />
          <text x="14" y="145" fontSize="10" fontWeight="800" fill="#6ee7b7">5&apos;</text>
          <text x="540" y="145" fontSize="10" fontWeight="800" fill="#6ee7b7">3&apos;</text>
          {cur.codons.map((c, idx) => {
            const cx = 110 + (maxStep > 0 ? (idx / maxStep) * 340 : 170);
            const isAct = idx === clampedStep;
            return (
              <g key={idx} style={{ cursor: 'pointer' }} onClick={() => { setPlaying(false); setRiboStep(idx); }}>
                <rect x={cx - 18} y="134" width="36" height="16" rx="5" fill={isAct ? '#facc15' : 'rgba(15,23,42,0.75)'} />
                <text x={cx} y="145" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill={isAct ? '#0f172a' : '#e2e8f0'}>
                  {c}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bảng từng bộ ba DNA -> mRNA -> tRNA -> Amino acid (tô đỏ vị trí đột biến) */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 10, paddingBottom: 4 }}>
          {cur.codons.map((codon, idx) => {
            const dnaTrip = cur.template3to5.slice(idx * 3, idx * 3 + 3);
            const anti = cur.anticodons[idx] || '—';
            const aa = cur.aminoAcids[idx] || '—';
            const baseCodon = baseRef.codons[idx];
            const baseAA = baseRef.aminoAcids[idx];
            const codonMutated = baseCodon && baseCodon !== codon;
            const aaMutated = baseAA && baseAA !== aa;
            const isActive = idx === clampedStep;
            const isPast = idx <= clampedStep && aa !== '—';
            return (
              <button
                key={idx}
                type="button"
                onClick={() => { setPlaying(false); setRiboStep(idx); }}
                style={{
                  minWidth: 96,
                  padding: '9px 8px',
                  borderRadius: 12,
                  border: isActive
                    ? '2px solid #fbbf24'
                    : codonMutated
                      ? '1.5px solid #ef4444'
                      : '1px solid rgba(148,163,184,0.28)',
                  background: isActive
                    ? 'rgba(251,191,36,0.16)'
                    : codonMutated
                      ? 'rgba(239,68,68,0.14)'
                      : 'rgba(15,23,42,0.8)',
                  color: '#f8fafc',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ fontSize: 10, color: codonMutated ? '#fca5a5' : '#94a3b8' }}>
                  #{idx + 1} {codonMutated ? '· ĐỘT BIẾN' : ''}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#93c5fd', marginTop: 3 }}>DNA: {dnaTrip}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#34d399', marginTop: 2 }}>mRNA: {codon}</div>
                <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>tRNA: {anti}</div>
                <div
                  style={{
                    marginTop: 6,
                    padding: '3px 6px',
                    borderRadius: 99,
                    fontSize: 11.5,
                    fontWeight: 800,
                    fontFamily: 'system-ui',
                    background: aaMutated ? '#dc2626' : isPast ? (AA_COLORS[aa] || '#2f6bff') : 'rgba(148,163,184,0.2)',
                    color: '#fff',
                  }}
                >
                  {aa}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bl-grid-equal">
        <div className="bl-panel">
          <h4>Tự nhập mạch khuôn DNA (3&apos; → 5&apos;) để thử đột biến</h4>
          <input
            type="text"
            className="bl-search-input"
            style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '0.92rem' }}
            value={dnaSeq}
            maxLength={36}
            onChange={(e) => {
              setDnaSeq(e.target.value.toUpperCase().replace(/[^ATGCX]/g, ''));
              setRiboStep(0);
            }}
          />
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--bl-mut)' }}>
            Mẹo: Sửa 1 ký tự (A, T, G, C), xóa 1 ký tự hoặc thêm 1 ký tự — hệ thống tự tô đỏ vị trí đột biến so với mạch chuẩn gốc!
          </p>
        </div>

        <div className="bl-panel bl-highlight-card" style={{ '--card-accent': '#2f6bff' }}>
          <h4>Phân tích Tác động Đột biến (Codon #{clampedStep + 1}: {curCodon})</h4>
          <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 700, color: 'var(--bl-ink)' }}>{mutationSummary}</p>
          <div className="bl-kpi-grid" style={{ margin: 0 }}>
            <div className="bl-kpi"><small>Số bộ ba mRNA</small><strong>{cur.codons.length}</strong></div>
            <div className="bl-kpi"><small>Số amino acid</small><strong>{cur.aminoAcids.filter((x) => x !== 'STOP').length}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
