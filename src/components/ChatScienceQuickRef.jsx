/* ============================================================
   ChatScienceQuickRef.jsx — TRA CỨU KHTN TỨC THÌ TRONG PHÒNG CHAT AI
   ------------------------------------------------------------
   • Tab 1: Bảng tuần hoàn 118 nguyên tố + Tính nhanh M (khối lượng mol)
            hỗ trợ công thức có ngoặc: Al2(SO4)3, Fe3O4, Ca(OH)2, C6H12O6...
   • Tab 2: Hằng số & Công thức cốt lõi chuẩn GDPT 2025 (Hóa · Lý · Sinh)
   • 1 chạm chèn thẳng vào ô nhập Chat hoặc sao chép nhanh
   ============================================================ */

import { useMemo, useState } from 'react';
import { ELEMENTS, SGK_MASS, norm } from '../data/elements.js';

const MASS_MAP = (() => {
  const m = { ...SGK_MASS };
  for (const el of ELEMENTS) {
    if (!m[el.symbol]) {
      const parsed = Number(String(el.atomicMass).replace(/[\[\]]/g, ''));
      if (Number.isFinite(parsed)) m[el.symbol] = Math.round(parsed);
    }
  }
  return m;
})();

/**
 * Phân tích & tính khối lượng mol M (g/mol) theo chuẩn SGK Việt Nam
 * Hỗ trợ ngoặc đơn/vuông lồng nhau: Al2(SO4)3, CuSO4.5H2O, Ca(OH)2, Fe2O3...
 */
export function calcMolarMass(rawFormula) {
  const input = String(rawFormula || '').trim();
  if (!input || input.length > 48) return null;
  // Phải bắt đầu bằng chữ hoa hoặc ngoặc và chỉ chứa ký tự hợp lệ của công thức hóa học
  if (!/^[A-Za-z0-9()[\].·•*]+$/.test(input)) return null;
  if (!/[A-Z]/.test(input)) return null;

  // Tách tinh thể ngậm nước dạng CuSO4.5H2O hoặc CuSO4·5H2O
  const segments = input.split(/[.·•*]/).filter(Boolean);
  if (!segments.length) return null;

  const totalCounts = {};

  for (const seg of segments) {
    const multMatch = seg.match(/^(\d+)(.+)$/);
    const segMult = multMatch ? Number(multMatch[1]) : 1;
    const body = multMatch ? multMatch[2] : seg;

    const stack = [{}];
    let idx = 0;

    while (idx < body.length) {
      const ch = body[idx];
      if (ch === '(' || ch === '[') {
        stack.push({});
        idx += 1;
      } else if (ch === ')' || ch === ']') {
        if (stack.length <= 1) return null;
        idx += 1;
        let numStr = '';
        while (idx < body.length && /\d/.test(body[idx])) {
          numStr += body[idx++];
        }
        const factor = numStr ? Number(numStr) : 1;
        const popped = stack.pop();
        const top = stack[stack.length - 1];
        for (const [sym, cnt] of Object.entries(popped)) {
          top[sym] = (top[sym] || 0) + cnt * factor;
        }
      } else if (/[A-Z]/.test(ch)) {
        let sym = ch;
        idx += 1;
        if (idx < body.length && /[a-z]/.test(body[idx])) {
          sym += body[idx++];
        }
        if (!MASS_MAP[sym]) return null;
        let numStr = '';
        while (idx < body.length && /\d/.test(body[idx])) {
          numStr += body[idx++];
        }
        const cnt = numStr ? Number(numStr) : 1;
        const top = stack[stack.length - 1];
        top[sym] = (top[sym] || 0) + cnt;
      } else {
        return null;
      }
    }

    if (stack.length !== 1) return null;
    for (const [sym, cnt] of Object.entries(stack[0])) {
      totalCounts[sym] = (totalCounts[sym] || 0) + cnt * segMult;
    }
  }

  const entries = Object.entries(totalCounts);
  if (entries.length === 0) return null;
  // Tránh nhận diện 1 nguyên tố đơn lẻ không có số là công thức nếu người dùng đang gõ tên 1 nguyên tố?
  // Vẫn cho phép nhưng trả về rõ breakdown!
  let molarMass = 0;
  const breakdown = entries.map(([sym, count]) => {
    const unitMass = MASS_MAP[sym];
    molarMass += unitMass * count;
    return { symbol: sym, count, unitMass };
  });

  return {
    formula: input,
    molarMass: Number(molarMass.toFixed(2)),
    breakdown,
  };
}

export const KHTN_CONSTANTS = [
  { id: 'dkc',   subject: 'hoa',  label: 'Thể tích mol khí (đkc 25°C, 1 bar)', value: '24,79 L/mol',   insert: 'V = n × 24,79 (đkc)' },
  { id: 'fara',  subject: 'hoa',  label: 'Hằng số Faraday (điện phân)',        value: '96.500 C/mol',  insert: 'F = 96500 C/mol' },
  { id: 'na',    subject: 'hoa',  label: 'Số Avogadro N_A',                    value: '6,022 × 10²³',  insert: 'N_A = 6,022×10^23' },
  { id: 'r_gas', subject: 'hoa',  label: 'Hằng số khí lí tưởng R',             value: '8,314 J/mol·K', insert: 'R = 8,314 J/(mol·K)' },
  { id: 'c_vel', subject: 'ly',   label: 'Tốc độ ánh sáng trong chân không',   value: '3 × 10⁸ m/s',   insert: 'c = 3×10^8 m/s' },
  { id: 'plank', subject: 'ly',   label: 'Hằng số Planck h',                   value: '6,625 × 10⁻³⁴ J·s', insert: 'h = 6,625×10^-34 J·s' },
  { id: 'elec',  subject: 'ly',   label: 'Điện tích nguyên tố e',              value: '1,6 × 10⁻¹⁹ C', insert: '|e| = 1,6×10^-19 C' },
  { id: 'amu',   subject: 'ly',   label: 'Đơn vị khối lượng nguyên tử u',      value: '931,5 MeV/c²',  insert: '1 u = 931,5 MeV/c^2' },
  { id: 'g_acc', subject: 'ly',   label: 'Gia tốc trọng trường g',             value: '9,8 hoặc 10 m/s²', insert: 'g = 10 m/s²' },
  { id: 'dna_l', subject: 'sinh', label: 'Chiều dài gene DNA mạch kép',        value: 'L = (N/2)·3,4 Å', insert: 'L = (N/2) × 3,4 Å' },
  { id: 'dna_h', subject: 'sinh', label: 'Số liên kết hiđrô của DNA',          value: 'H = 2A + 3G',   insert: 'H = 2A + 3G' },
  { id: 'dna_m', subject: 'sinh', label: 'Khối lượng 1 nucleotide',            value: '300 đvC',       insert: 'M = N × 300 đvC' },
  { id: 'hw',    subject: 'sinh', label: 'Cân bằng Hardy – Weinberg',          value: 'p²AA + 2pqAa + q²aa = 1', insert: 'p²AA + 2pqAa + q²aa = 1 (p + q = 1)' },
];

const POPULAR_SYMBOLS = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Ba'];

const SvgClose = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgSearch = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SvgAtom = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(30 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-30 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(90 12 12)" />
  </svg>
);

export default function ChatScienceQuickRef({ onInsert, onClose }) {
  const [tab, setTab] = useState('chem'); // 'chem' | 'const'
  const [q, setQ] = useState('');
  const [constFilter, setConstFilter] = useState('all');
  const [copiedId, setCopiedId] = useState('');

  const molarResult = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed) return null;
    // Chỉ hiển thị máy tính M khi gõ công thức có >= 2 ký tự (vd H2O, Fe2O3, CuSO4, NaOH)
    if (trimmed.length < 2) return null;
    return calcMolarMass(trimmed);
  }, [q]);

  const matchedElements = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      return POPULAR_SYMBOLS.map((sym) => ELEMENTS.find((e) => e.symbol === sym)).filter(Boolean);
    }
    const nq = norm(trimmed);
    const asNum = Number(trimmed);
    return ELEMENTS.filter((el) => {
      if (Number.isInteger(asNum) && el.atomicNumber === asNum) return true;
      return el.s.symbol === nq || el.s.symbol.startsWith(nq) || el.s.name.includes(nq);
    }).slice(0, 12);
  }, [q]);

  const filteredConstants = useMemo(() => {
    const nq = norm(q);
    return KHTN_CONSTANTS.filter((c) => {
      if (constFilter !== 'all' && c.subject !== constFilter) return false;
      if (!nq) return true;
      return norm(c.label).includes(nq) || norm(c.value).includes(nq);
    });
  }, [constFilter, q]);

  const handleInsert = (text, id) => {
    onInsert?.(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1400);
  };

  return (
    <div className="elec-qref-dock" role="dialog" aria-label="Tra cứu nhanh KHTN">
      <div className="elec-qref-head">
        <div className="elec-qref-title">
          <SvgAtom size={16} />
          <span>Tra cứu KHTN tức thì</span>
          <small>GDPT 2025</small>
        </div>
        <button type="button" className="elec-qref-close" onClick={onClose} aria-label="Đóng bảng tra cứu">
          <SvgClose size={14} />
        </button>
      </div>

      <div className="elec-qref-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chem'}
          className={tab === 'chem' ? 'is-active' : ''}
          onClick={() => setTab('chem')}
        >
          Bảng tuần hoàn &amp; Tính M
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'const'}
          className={tab === 'const' ? 'is-active' : ''}
          onClick={() => setTab('const')}
        >
          Hằng số Lý · Hóa · Sinh
        </button>
      </div>

      <div className="elec-qref-search">
        <SvgSearch size={14} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === 'chem'
              ? 'Gõ nguyên tố (Fe, 26) hoặc công thức (Al2(SO4)3, CuSO4.5H2O)...'
              : 'Tìm nhanh hằng số (đkc, Planck, DNA, Faraday...)'
          }
          autoFocus
        />
        {q && (
          <button type="button" className="elec-qref-clear" onClick={() => setQ('')} aria-label="Xóa">
            <SvgClose size={12} />
          </button>
        )}
      </div>

      <div className="elec-qref-body">
        {tab === 'chem' ? (
          <>
            {molarResult && (
              <div className="elec-qref-molar-card">
                <div className="elec-qref-molar-top">
                  <div>
                    <span className="elec-qref-molar-kicker">KHỐI LƯỢNG MOL (SGK)</span>
                    <div className="elec-qref-molar-val">
                      <b>M({molarResult.formula}) = {molarResult.molarMass}</b>
                      <span>g/mol</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="elec-qref-insert-btn"
                    onClick={() => handleInsert(`M(${molarResult.formula}) = ${molarResult.molarMass} g/mol`, 'molar')}
                  >
                    {copiedId === 'molar' ? 'Đã chèn' : '+ Chèn'}
                  </button>
                </div>
                <div className="elec-qref-molar-break">
                  {molarResult.breakdown
                    .map((b) => `${b.count}×${b.symbol}(${b.unitMass})`)
                    .join(' + ')}
                </div>
              </div>
            )}

            <div className="elec-qref-el-grid">
              {matchedElements.map((el) => {
                const sgkM = SGK_MASS[el.symbol] ?? el.atomicMass;
                return (
                  <button
                    key={el.atomicNumber}
                    type="button"
                    className="elec-qref-el-card"
                    onClick={() =>
                      handleInsert(
                        `${el.symbol} (Z=${el.atomicNumber}, M=${sgkM})`,
                        `el-${el.symbol}`
                      )
                    }
                    title={`Bấm để chèn ${el.symbol} (${el.name}) — Cấu hình: ${el.shortConfiguration}`}
                  >
                    <span className="elec-qref-el-z">Z={el.atomicNumber}</span>
                    <strong className="elec-qref-el-sym">{el.symbol}</strong>
                    <span className="elec-qref-el-mass">M = {sgkM}</span>
                    <small className="elec-qref-el-cfg">{el.shortConfiguration}</small>
                  </button>
                );
              })}
            </div>

            {matchedElements.length === 0 && !molarResult && (
              <p className="elec-qref-empty">Không tìm thấy nguyên tố hoặc công thức phù hợp.</p>
            )}
          </>
        ) : (
          <>
            <div className="elec-qref-filter-row">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'hoa', label: 'Hóa học' },
                { id: 'ly', label: 'Vật lí' },
                { id: 'sinh', label: 'Sinh học' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`elec-qref-filter-pill ${constFilter === f.id ? 'is-active' : ''}`}
                  onClick={() => setConstFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="elec-qref-const-list">
              {filteredConstants.map((c) => (
                <div key={c.id} className="elec-qref-const-row">
                  <div className="elec-qref-const-info">
                    <span className={`elec-qref-subj tone-${c.subject}`}>
                      {c.subject === 'hoa' ? 'HÓA' : c.subject === 'ly' ? 'LÝ' : 'SINH'}
                    </span>
                    <div>
                      <b>{c.value}</b>
                      <small>{c.label}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="elec-qref-insert-btn"
                    onClick={() => handleInsert(c.insert, c.id)}
                  >
                    {copiedId === c.id ? 'Đã chèn' : '+ Chèn'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
