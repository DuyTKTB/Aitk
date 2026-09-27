import { useState, useMemo } from 'react';
import { ELEMENTS, SGK_MASS } from '../data/elements.js';

/* ========================================================================
   Tiện ích dùng chung
   ==================================================================== */
const fmt = (n, d = 4) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return '—';
  if (Math.abs(n) < 1e-9) return '0';
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toPrecision(d);
  return +n.toFixed(d);
};
const num = (v) => (v === '' || v === undefined ? NaN : parseFloat(v));

function Num({ label, value, onChange, placeholder, suffix }) {
  return (
    <label>
      {label}
      <input
        type="number"
        inputMode="decimal"
        step="any"
        value={value}
        placeholder={placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && <small className="hint" style={{ margin: 0 }}>{suffix}</small>}
    </label>
  );
}

function Out({ label, value, unit, bad, warn }) {
  return (
    <p className={'calc-out' + (bad ? ' bad' : '') + (warn ? ' warn' : '')}>
      <b>{label}:</b> {value} {unit || ''}
    </p>
  );
}

function Card({ title, hint, children }) {
  return (
    <div className="card calc">
      <h3>{title}</h3>
      {hint && <p className="hint" style={{ margin: '-.3rem 0 .2rem' }}>{hint}</p>}
      {children}
    </div>
  );
}

/* ========================================================================
   TAB 1 — Khối lượng mol
   ==================================================================== */
const MASS = Object.fromEntries(
  ELEMENTS.map((e) => [e.symbol, parseFloat(e.atomicMass.replace(/[[\]]/g, ''))])
);
const isValidSymbol = (s) => s in MASS;

function parseFormula(f) {
  const stack = [{}];
  let i = 0;
  const readNumber = () => {
    let s = '';
    while (i < f.length && /\d/.test(f[i])) s += f[i++];
    return s ? parseInt(s, 10) : 1;
  };
  const add = (group, sym, n) => { group[sym] = (group[sym] || 0) + n; };
  const mergeIntoParent = (child, mult) => {
    const parent = stack[stack.length - 1];
    for (const k in child) add(parent, k, child[k] * mult);
  };
  while (i < f.length) {
    const c = f[i];
    if (c === '(' || c === '[') { stack.push({}); i++; continue; }
    if (c === ')' || c === ']') {
      if (stack.length < 2) throw new Error('Ngoặc không cân đối');
      i++;
      const top = stack.pop();
      const mult = readNumber();
      mergeIntoParent(top, mult);
      continue;
    }
    if (c === '·' || c === '.' || c === '*') {
      i++;
      const mult = readNumber();
      const rest = f.slice(i);
      const sub = parseFormula(rest);
      for (const k in sub) add(stack[stack.length - 1], k, sub[k] * mult);
      return stack[0];
    }
    if (!/[A-Za-z]/.test(c)) throw new Error(`Ký tự không hợp lệ: "${c}"`);
    const two = f.slice(i, i + 2);
    const one = f[i];
    let sym;
    if (two.length === 2 && /^[A-Z][a-z]$/.test(two) && isValidSymbol(two)) { sym = two; i += 2; }
    else if (isValidSymbol(one)) { sym = one; i += 1; }
    else throw new Error(`Nguyên tố không tồn tại: "${/^[A-Z][a-z]$/.test(two) ? two : one}"`);
    const n = readNumber();
    add(stack[stack.length - 1], sym, n);
  }
  if (stack.length !== 1) throw new Error('Ngoặc không cân đối');
  return stack[0];
}

function MolTab() {
  const [f, setF] = useState('Ca(OH)2');
  const [v, setV] = useState('1');
  const [unit, setUnit] = useState('mol');
  const [useSGK, setUseSGK] = useState(false);

  const result = useMemo(() => {
    const t = f.replace(/\s/g, '');
    if (!t) return { ok: false, empty: true };
    let parts;
    try { parts = parseFormula(t); } catch (err) { return { ok: false, err: err.message }; }
    const getMass = (sym) => (useSGK && SGK_MASS[sym] !== undefined ? SGK_MASS[sym] : MASS[sym]);
    const M = Object.entries(parts).reduce((a, [k, n]) => a + getMass(k) * n, 0);
    return { ok: true, parts, M };
  }, [f, useSGK]);

  const { ok, parts, M, err, empty } = result;
  const x = parseFloat(v);
  const mol = !ok || isNaN(x) ? NaN : unit === 'mol' ? x : unit === 'g' ? x / M : x / 22.4;

  return (
    <div className="card">
      <label>
        Công thức (vd: H2SO4, Ca(OH)2, Al2(SO4)3, CuSO4.5H2O)
        <input value={f} onChange={(e) => setF(e.target.value)} autoComplete="off" spellCheck="false" />
      </label>

      {empty && <p className="hint">Nhập công thức để bắt đầu.</p>}
      {err && <p className="hint" style={{ color: 'var(--acc)' }}>⚠️ {err}</p>}

      {ok && (
        <>
          <p className="result">
            <span>M</span>
            <b>{fmt(M)}</b>
            <small>g/mol</small>
          </p>
          <p className="hint center">
            {Object.entries(parts).map(([k, n]) => {
              const m = useSGK && SGK_MASS[k] !== undefined ? SGK_MASS[k] : MASS[k];
              return `${k}×${n} (${m})`;
            }).join(' + ')}
          </p>

          <label className="row" style={{ marginTop: '.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={useSGK} onChange={(e) => setUseSGK(e.target.checked)} style={{ width: 'auto' }} />
            <span style={{ textTransform: 'none', letterSpacing: 0 }}>Dùng số liệu SGK phổ thông VN (làm tròn)</span>
          </label>

          <div className="row" style={{ marginTop: '1rem' }}>
            <label style={{ flex: 1 }}>
              Giá trị
              <input type="number" min="0" step="any" value={v} onChange={(e) => setV(e.target.value)} />
            </label>
            <label>
              Đơn vị
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="mol">mol</option>
                <option value="g">gam</option>
                <option value="l">lít khí (đktc)</option>
              </select>
            </label>
          </div>

          <dl>
            <div><dt>Số mol</dt><dd>{fmt(mol)} mol</dd></div>
            <div><dt>Khối lượng</dt><dd>{fmt(mol * M)} g</dd></div>
            <div><dt>Thể tích khí (đktc)</dt><dd>{fmt(mol * 22.4)} lít</dd></div>
          </dl>
          <p className="hint" style={{ marginTop: '.4rem' }}>* Đktc = 0°C, 1 atm → 22.4 L/mol (theo SGK VN).</p>
        </>
      )}
    </div>
  );
}

/* ========================================================================
   TAB 2 — Dung dịch & pH
   ==================================================================== */
function DungDichTab() {
  // pH <-> [H+]
  const [mode, setMode] = useState('ph');
  const [val, setVal] = useState('7');
  const pH = mode === 'ph' ? num(val) : -Math.log10(num(val));
  const H = mode === 'ph' ? Math.pow(10, -num(val)) : num(val);
  const OH = 1e-14 / H;
  const pOH = 14 - pH;

  // Độ điện li & Ka/Kb
  const [c0, setC0] = useState('0.1');
  const [hp, setHp] = useState('0.0013');
  const C0 = num(c0), Hp = num(hp);
  const alpha = C0 > 0 ? (Hp / C0) * 100 : NaN;
  const Ka = C0 - Hp > 0 ? (Hp * Hp) / (C0 - Hp) : NaN;

  // Trung hòa acid - base
  const [hcl, setHcl] = useState(''), [h2so4, setH2so4] = useState(''), [hno3, setHno3] = useState('');
  const [naoh, setNaoh] = useState(''), [koh, setKoh] = useState(''), [baoh2, setBaoh2] = useState('');
  const nH = (num(hcl) || 0) + 2 * (num(h2so4) || 0) + (num(hno3) || 0);
  const nOH = (num(naoh) || 0) + (num(koh) || 0) + 2 * (num(baoh2) || 0);
  const diff = nH - nOH;

  return (
    <div className="calc-grid">
      <Card title="pH ⇄ Nồng độ ion" hint="Chọn loại giá trị bạn có, các giá trị còn lại tự tính (25°C).">
        <div className="row" style={{ marginBottom: '.4rem' }}>
          <label style={{ flex: 1 }}>
            Loại giá trị nhập
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="ph">pH</option>
              <option value="h">Nồng độ [H⁺] (mol/l)</option>
            </select>
          </label>
        </div>
        <Num label={mode === 'ph' ? 'pH' : '[H⁺] (mol/l)'} value={val} onChange={setVal} />
        <Out label="pH" value={fmt(pH, 3)} />
        <Out label="[H⁺]" value={fmt(H, 6)} unit="mol/l" />
        <Out label="[OH⁻]" value={fmt(OH, 6)} unit="mol/l" />
        <Out label="pOH" value={fmt(pOH, 3)} />
        <Out label="Môi trường" value={isNaN(pH) ? '—' : pH < 7 ? 'Axit' : pH > 7 ? 'Kiềm' : 'Trung tính'} />
      </Card>

      <Card title="Độ điện li α & Ka" hint="Axit yếu HA ⇌ H⁺ + A⁻ (1 nấc). α = [H⁺]/C₀ ; Ka = [H⁺]²/(C₀−[H⁺]).">
        <Num label="Nồng độ ban đầu C₀" value={c0} onChange={setC0} suffix="mol/l" />
        <Num label="[H⁺] lúc cân bằng" value={hp} onChange={setHp} suffix="mol/l" />
        <Out label="Độ điện li α" value={fmt(alpha, 3)} unit="%" />
        <Out label="Hằng số Ka" value={fmt(Ka, 6)} />
      </Card>

      <Card title="Trung hòa Acid — Base" hint="nH⁺ = 2nH₂SO₄ + nHCl + nHNO₃  ;  nOH⁻ = 2nBa(OH)₂ + nNaOH + nKOH (đơn vị: mol).">
        <div className="calc-inputs">
          <Num label="n(HCl)" value={hcl} onChange={setHcl} />
          <Num label="n(H₂SO₄)" value={h2so4} onChange={setH2so4} />
          <Num label="n(HNO₃)" value={hno3} onChange={setHno3} />
          <Num label="n(NaOH)" value={naoh} onChange={setNaoh} />
          <Num label="n(KOH)" value={koh} onChange={setKoh} />
          <Num label="n(Ba(OH)₂)" value={baoh2} onChange={setBaoh2} />
        </div>
        <Out label="Tổng nH⁺" value={fmt(nH)} unit="mol" />
        <Out label="Tổng nOH⁻" value={fmt(nOH)} unit="mol" />
        <Out
          label="Kết luận"
          bad={Math.abs(diff) > 1e-9}
          value={
            isNaN(diff) ? '—'
              : Math.abs(diff) < 1e-9 ? '✅ Trung hòa vừa đủ'
              : diff > 0 ? `Dư axit — thừa ${fmt(diff)} mol H⁺`
              : `Dư bazơ — thừa ${fmt(-diff)} mol OH⁻`
          }
        />
      </Card>
    </div>
  );
}

/* ========================================================================
   TAB 3 — Vô cơ nâng cao (N, P, C)
   ==================================================================== */
function VoCoTab() {
  // HNO3 + kim loại
  const [mkl, setMkl] = useState('');
  const [no, setNo] = useState(''), [no2, setNo2] = useState(''), [n2o, setN2o] = useState(''), [n2, setN2] = useState(''), [nh4no3, setNh4no3] = useState('');
  const NO = num(no) || 0, NO2 = num(no2) || 0, N2O = num(n2o) || 0, N2 = num(n2) || 0, NH4 = num(nh4no3) || 0;
  const nHNO3 = 4 * NO + 2 * NO2 + 10 * N2O + 12 * N2 + 10 * NH4;
  const mMuoiKL = (num(mkl) || 0) + 62 * (3 * NO + NO2 + 8 * N2O + 10 * N2);
  const mMuoiTong = mMuoiKL + 80 * NH4;

  // Hiệu suất NH3
  const [mx, setMx] = useState(''), [my, setMy] = useState('');
  const Hpct = (2 - 2 * (num(mx) / num(my))) * 100;

  // H3PO4 / P2O5 + kiềm
  const [oh1, setOh1] = useState('');
  const [pMode, setPMode] = useState('h3po4');
  const [pVal, setPVal] = useState('');
  const nH3PO4 = pMode === 'h3po4' ? num(pVal) : 2 * num(pVal);
  const T1 = num(oh1) / nH3PO4;
  const pProduct = isNaN(T1) ? '—'
    : T1 <= 1 ? 'Chỉ tạo muối H₂PO₄⁻'
    : T1 < 2 ? 'Tạo 2 muối: H₂PO₄⁻ và HPO₄²⁻'
    : T1 === 2 ? 'Chỉ tạo muối HPO₄²⁻'
    : T1 < 3 ? 'Tạo 2 muối: HPO₄²⁻ và PO₄³⁻'
    : 'Chỉ tạo muối PO₄³⁻';

  // CO2 + kiềm
  const [oh2, setOh2] = useState(''), [co2v, setCo2v] = useState('');
  const T2 = num(oh2) / num(co2v);
  const co3 = num(oh2) - num(co2v);
  const cProduct = isNaN(T2) ? '—'
    : T2 <= 1 ? 'Chỉ tạo muối HCO₃⁻'
    : T2 < 2 ? `Tạo 2 muối HCO₃⁻ và CO₃²⁻ (nCO₃²⁻ = ${fmt(co3)} mol)`
    : 'Chỉ tạo muối CO₃²⁻';

  return (
    <div className="calc-grid">
      <Card title="Kim loại + HNO₃" hint="nHNO₃ = 4nNO+2nNO₂+10nN₂O+12nN₂+10nNH₄NO₃  ;  m muối = m KL + 62×(3nNO+nNO₂+8nN₂O+10nN₂) + 80×nNH₄NO₃.">
        <div className="calc-inputs">
          <Num label="m kim loại (g)" value={mkl} onChange={setMkl} />
          <Num label="n(NO)" value={no} onChange={setNo} />
          <Num label="n(NO₂)" value={no2} onChange={setNo2} />
          <Num label="n(N₂O)" value={n2o} onChange={setN2o} />
          <Num label="n(N₂)" value={n2} onChange={setN2} />
          <Num label="n(NH₄NO₃)" value={nh4no3} onChange={setNh4no3} />
        </div>
        <Out label="n HNO₃ phản ứng" value={fmt(nHNO3)} unit="mol" />
        <Out label="m muối nitrat" value={fmt(mMuoiTong)} unit="g" />
      </Card>

      <Card title="Hiệu suất tổng hợp NH₃" hint="N₂ + 3H₂ ⇌ 2NH₃, tỉ lệ đầu N₂:H₂ = 1:3. H% = (2 − 2·Mx/My) × 100.">
        <Num label="Mx (M trung bình trước phản ứng)" value={mx} onChange={setMx} />
        <Num label="My (M trung bình sau phản ứng)" value={my} onChange={setMy} />
        <Out label="Hiệu suất H%" value={fmt(Hpct, 2)} unit="%" bad={Hpct < 0 || Hpct > 100} />
      </Card>

      <Card title="H₃PO₄ / P₂O₅ + dung dịch kiềm" hint="T = nOH⁻ / nH₃PO₄  (nH₃PO₄ = 2×nP₂O₅).">
        <div className="row" style={{ marginBottom: '.2rem' }}>
          <label style={{ flex: 1 }}>
            Chất đã cho
            <select value={pMode} onChange={(e) => setPMode(e.target.value)}>
              <option value="h3po4">n(H₃PO₄)</option>
              <option value="p2o5">n(P₂O₅)</option>
            </select>
          </label>
        </div>
        <div className="calc-inputs">
          <Num label={pMode === 'h3po4' ? 'n(H₃PO₄) mol' : 'n(P₂O₅) mol'} value={pVal} onChange={setPVal} />
          <Num label="n(OH⁻) mol" value={oh1} onChange={setOh1} />
        </div>
        <Out label="Tỉ lệ T" value={fmt(T1, 3)} />
        <Out label="Sản phẩm" value={pProduct} />
      </Card>

      <Card title="CO₂ + dung dịch kiềm" hint="T = nOH⁻ / nCO₂. Nếu 1<T<2: nCO₃²⁻ = nOH⁻ − nCO₂.">
        <div className="calc-inputs">
          <Num label="n(OH⁻) mol" value={oh2} onChange={setOh2} />
          <Num label="n(CO₂) mol" value={co2v} onChange={setCo2v} />
        </div>
        <Out label="Tỉ lệ T" value={fmt(T2, 3)} />
        <Out label="Sản phẩm" value={cProduct} />
      </Card>
    </div>
  );
}

/* ========================================================================
   TAB 4 — Hữu cơ
   ==================================================================== */
function simplifyRatio(vals) {
  const nz = vals.filter((v) => v > 1e-9);
  if (!nz.length) return vals.map(() => 0);
  const m = Math.min(...nz);
  const r = vals.map((v) => v / m);
  for (let k = 1; k <= 6; k++) {
    const scaled = r.map((v) => v * k);
    if (scaled.every((v) => Math.abs(v - Math.round(v)) < 0.08)) return scaled.map((v) => Math.round(v));
  }
  return r.map((v) => Math.round(v));
}

function HuuCoTab() {
  // Độ bất bão hòa k
  const [kx, setKx] = useState(''), [ky, setKy] = useState(''), [kt, setKt] = useState(''), [kv, setKv] = useState('');
  const kVal = (2 * (num(kx) || 0) + 2 + (num(kt) || 0) - (num(ky) || 0) - (num(kv) || 0)) / 2;

  // CTPT từ % khối lượng
  const [pc, setPc] = useState(''), [ph, setPh] = useState(''), [po, setPo] = useState('');
  const ratioRes = useMemo(() => {
    const C = num(pc) || 0, H = num(ph) || 0, O = num(po) || 0;
    if (!C && !H && !O) return null;
    const [x, y, z] = simplifyRatio([C / 12, H / 1, O / 16]);
    return { x, y, z };
  }, [pc, ph, po]);

  // Đốt cháy hydrocarbon
  const [hcType, setHcType] = useState('ankan');
  const [co2b, setCo2b] = useState(''), [h2ob, setH2ob] = useState(''), [br2, setBr2] = useState('');
  const CO2 = num(co2b), H2O = num(h2ob), Br2 = num(br2);
  let nHC = NaN, cCount = NaN, noteHC = '';
  if (hcType === 'ankan') { nHC = H2O - CO2; cCount = CO2 / nHC; }
  else if (hcType === 'anken') { nHC = Br2; cCount = CO2 / nHC; noteHC = Math.abs(CO2 - H2O) > 1e-6 ? '⚠️ nCO₂ nên bằng nH₂O với anken' : ''; }
  else { nHC = CO2 - H2O; cCount = CO2 / nHC; }

  // Ancol + Na
  const [nH2, setNH2] = useState('');
  const nROH = 2 * (num(nH2) || 0);

  // Tách nước
  const [dehyType, setDehyType] = useState('ete');
  const [dh2o, setDh2o] = useState('');
  const DH2O = num(dh2o) || 0;
  const nAncolDehy = dehyType === 'ete' ? 2 * DH2O : DH2O;
  const outDehy = dehyType === 'ete' ? `nEte = ${fmt(DH2O)} mol` : `nAnken = ${fmt(DH2O)} mol`;

  // Tráng bạc
  const [andeType, setAndeType] = useState('rcho');
  const [nAnde, setNAnde] = useState('');
  const nAg = (andeType === 'hcho' ? 4 : 2) * (num(nAnde) || 0);

  // Acid + NaHCO3
  const [nNaHCO3, setNNaHCO3] = useState('');
  const nCOOH = num(nNaHCO3) || 0;

  // Số đồng phân
  const [isoType, setIsoType] = useState('ankan');
  const [isoN, setIsoN] = useState('');
  const N = num(isoN);
  let isoVal = NaN, isoRange = '', isoOk = true;
  if (isoType === 'ankan') { isoVal = Math.pow(2, N - 4) + 1; isoRange = '3 < n < 7 (n = 4, 5, 6)'; isoOk = N > 3 && N < 7; }
  else if (isoType === 'ancol') { isoVal = Math.pow(2, N - 2); isoRange = '2 ≤ n < 6'; isoOk = N >= 2 && N < 6; }
  else { isoVal = Math.pow(2, N - 3); isoRange = '2 ≤ n < 6'; isoOk = N >= 2 && N < 6; }

  return (
    <div className="calc-grid">
      <Card title="Độ bất bão hòa k" hint="Hợp chất CxHyOzNtXv (X = halogen). k = (2x + 2 + t − y − v) / 2. O không ảnh hưởng.">
        <div className="calc-inputs">
          <Num label="x (số C)" value={kx} onChange={setKx} />
          <Num label="y (số H)" value={ky} onChange={setKy} />
          <Num label="t (số N)" value={kt} onChange={setKt} />
          <Num label="v (số Halogen)" value={kv} onChange={setKv} />
        </div>
        <Out label="k (π + vòng)" value={fmt(kVal, 2)} bad={kVal < 0} />
      </Card>

      <Card title="Lập CTPT từ % khối lượng" hint="x : y : z = (%C/12) : (%H/1) : (%O/16), rút về tỉ lệ nguyên tối giản.">
        <div className="calc-inputs">
          <Num label="%C" value={pc} onChange={setPc} />
          <Num label="%H" value={ph} onChange={setPh} />
          <Num label="%O" value={po} onChange={setPo} />
        </div>
        <Out
          label="Công thức đơn giản nhất"
          value={ratioRes ? `C${ratioRes.x}H${ratioRes.y}${ratioRes.z ? 'O' + ratioRes.z : ''}` : '—'}
        />
      </Card>

      <Card title="Đốt cháy Hydrocarbon" hint="Ankan: nHC = nH₂O−nCO₂. Anken: nAnken = nBr₂. Ankin/Ankadien: nHC = nCO₂−nH₂O.">
        <div className="row" style={{ marginBottom: '.2rem' }}>
          <label style={{ flex: 1 }}>
            Loại
            <select value={hcType} onChange={(e) => setHcType(e.target.value)}>
              <option value="ankan">Ankan (no)</option>
              <option value="anken">Anken</option>
              <option value="ankin">Ankin / Ankadien</option>
            </select>
          </label>
        </div>
        <div className="calc-inputs">
          <Num label="n(CO₂) mol" value={co2b} onChange={setCo2b} />
          <Num label="n(H₂O) mol" value={h2ob} onChange={setH2ob} />
          {hcType === 'anken' && <Num label="n(Br₂) mol" value={br2} onChange={setBr2} />}
        </div>
        <Out label="Số mol hydrocarbon" value={fmt(nHC)} unit="mol" />
        <Out label="Số nguyên tử C" value={fmt(cCount, 2)} />
        {noteHC && <Out label="Lưu ý" value={noteHC} warn />}
      </Card>

      <Card title="Ancol + Na" hint="nROH = 2 × nH₂.">
        <Num label="n(H₂) sinh ra" value={nH2} onChange={setNH2} suffix="mol" />
        <Out label="n Ancol" value={fmt(nROH)} unit="mol" />
      </Card>

      <Card title="Ancol tách nước" hint="140°C (H₂SO₄ đặc): nAncol = 2nEte = 2nH₂O. 170°C: nAncol = nAnken = nH₂O.">
        <div className="row" style={{ marginBottom: '.2rem' }}>
          <label style={{ flex: 1 }}>
            Điều kiện
            <select value={dehyType} onChange={(e) => setDehyType(e.target.value)}>
              <option value="ete">140°C — tạo ete</option>
              <option value="anken">170°C — tạo anken</option>
            </select>
          </label>
        </div>
        <Num label="n(H₂O) tách ra" value={dh2o} onChange={setDh2o} suffix="mol" />
        <Out label="n Ancol" value={fmt(nAncolDehy)} unit="mol" />
        <Out label={dehyType === 'ete' ? 'n Ete' : 'n Anken'} value={outDehy.split('=')[1]} />
      </Card>

      <Card title="Phản ứng tráng bạc (Andehit)" hint="HCHO → 4Ag (nAg = 4nHCHO). RCHO → 2Ag (nAg = 2nRCHO).">
        <div className="row" style={{ marginBottom: '.2rem' }}>
          <label style={{ flex: 1 }}>
            Loại andehit
            <select value={andeType} onChange={(e) => setAndeType(e.target.value)}>
              <option value="rcho">RCHO (đơn chức thường)</option>
              <option value="hcho">HCHO (fomanđehit)</option>
            </select>
          </label>
        </div>
        <Num label="n Andehit" value={nAnde} onChange={setNAnde} suffix="mol" />
        <Out label="n Ag↓" value={fmt(nAg)} unit="mol" />
      </Card>

      <Card title="Carboxylic Acid + Na₂CO₃ / NaHCO₃" hint="nCOOH = nNaHCO₃ = nCO₂ sinh ra.">
        <Num label="n(NaHCO₃) phản ứng" value={nNaHCO3} onChange={setNNaHCO3} suffix="mol" />
        <Out label="n nhóm −COOH" value={fmt(nCOOH)} unit="mol" />
      </Card>

      <Card title="Số đồng phân" hint="Ankan: 2ⁿ⁻⁴+1. Ancol no đơn: 2ⁿ⁻². Andehit no đơn: 2ⁿ⁻³.">
        <div className="row" style={{ marginBottom: '.2rem' }}>
          <label style={{ flex: 1 }}>
            Loại hợp chất
            <select value={isoType} onChange={(e) => setIsoType(e.target.value)}>
              <option value="ankan">Ankan</option>
              <option value="ancol">Ancol no, đơn chức</option>
              <option value="andehit">Andehit no, đơn chức</option>
            </select>
          </label>
        </div>
        <Num label="n (số nguyên tử C)" value={isoN} onChange={setIsoN} />
        <Out label="Số đồng phân" value={isNaN(isoVal) ? '—' : Math.round(isoVal)} bad={!isNaN(N) && !isoOk} />
        <p className="hint" style={{ margin: '.2rem 0 0' }}>Công thức chỉ đúng khi {isoRange}{!isoOk && !isNaN(N) ? ' — n hiện tại ngoài phạm vi này.' : ''}</p>
      </Card>
    </div>
  );
}

/* ========================================================================
   Component chính
   ==================================================================== */
const TABS = [
  ['mol', 'Khối lượng mol'],
  ['dd', 'Dung dịch & pH'],
  ['vc', 'Vô cơ nâng cao'],
  ['hc', 'Hữu cơ'],
];

export default function FormulaCalculator() {
  const [tab, setTab] = useState('mol');

  return (
    <section className="wrap">
      <h1>Công thức nhanh</h1>
      <p className="lead" style={{ fontSize: '1rem' }}>
        Chỉ cần nhập số — mọi công thức Hóa 11 hay dùng đều được tính ngay tại đây.
      </p>

      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'mol' && <MolTab />}
      {tab === 'dd' && <DungDichTab />}
      {tab === 'vc' && <VoCoTab />}
      {tab === 'hc' && <HuuCoTab />}
    </section>
  );
}
