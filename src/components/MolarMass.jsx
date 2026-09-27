import { useState, useMemo } from 'react';
import { ELEMENTS, SGK_MASS } from '../data/elements.js';

// Bảng khối lượng: ưu tiên atomicMass chuẩn, fallback [số khối]
const MASS = Object.fromEntries(
  ELEMENTS.map((e) => [
    e.symbol,
    parseFloat(e.atomicMass.replace(/[[\]]/g, '')),
  ])
);

// Kiểm tra ký hiệu có tồn tại không (phân biệt hoa/thường)
const isValidSymbol = (s) => s in MASS;

/**
 * Parse công thức hóa học.
 * Hỗ trợ:
 *   - H2O, H2SO4, Ca(OH)2, Al2(SO4)3
 *   - Co (Cobalt) vs CO (Carbon + Oxygen) — phân biệt đúng
 *   - Dấu chấm ngậm nước: CuSO4.5H2O
 *
 * @param {string} f - công thức (không có khoảng trắng)
 * @returns {Record<string, number>}
 * @throws {Error} khi công thức không hợp lệ
 */
function parse(f) {
  const stack = [{}];
  let i = 0;

  // Đọc số (mặc định 1 nếu không có)
  const readNumber = () => {
    let s = '';
    while (i < f.length && /\d/.test(f[i])) s += f[i++];
    return s ? parseInt(s, 10) : 1;
  };

  const add = (group, sym, n) => {
    group[sym] = (group[sym] || 0) + n;
  };

  // Nhân toàn bộ group con vào group cha
  const mergeIntoParent = (child, mult) => {
    const parent = stack[stack.length - 1];
    for (const k in child) add(parent, k, child[k] * mult);
  };

  while (i < f.length) {
    const c = f[i];

    // Mở ngoặc
    if (c === '(' || c === '[') {
      stack.push({});
      i++;
      continue;
    }

    // Đóng ngoặc
    if (c === ')' || c === ']') {
      if (stack.length < 2) throw new Error('Ngoặc không cân đối');
      i++;
      const top = stack.pop();
      const mult = readNumber();
      mergeIntoParent(top, mult);
      continue;
    }

    // Dấu chấm ngậm nước: CuSO4.5H2O
    if (c === '·' || c === '.' || c === '*') {
      i++;
      const mult = readNumber();
      // Phần sau dấu chấm được parse như một group mới rồi nhân vào group hiện tại
      const sub = {};
      // Lưu lại vị trí để parse đệ quy đơn giản: cắt chuỗi còn lại
      const rest = f.slice(i);
      const subParsed = parse(rest);
      for (const k in subParsed) add(sub, k, subParsed[k] * mult);
      for (const k in sub) add(stack[stack.length - 1], k, sub[k]);
      return stack[0]; // đã xử lý hết phần còn lại
    }

    // Bỏ qua khoảng trắng / ký tự lạ
    if (!/[A-Za-z]/.test(c)) throw new Error(`Ký tự không hợp lệ: "${c}"`);

    // Đọc nguyên tố: ưu tiên 2 ký tự (Co) trước 1 ký tự (C)
    const two = f.slice(i, i + 2);
    const one = f[i];

    let sym;
    if (two.length === 2 && /^[A-Z][a-z]$/.test(two) && isValidSymbol(two)) {
      sym = two;
      i += 2;
    } else if (isValidSymbol(one)) {
      sym = one;
      i += 1;
    } else {
      // Thử phần còn lại sau ký tự đầu (trường hợp CO → C + O)
      if (two.length === 2 && /^[A-Z][a-z]$/.test(two)) {
        // Co không hợp lệ, nhưng C hợp lệ → quay lại 1 ký tự
        if (isValidSymbol(one)) {
          sym = one;
          i += 1;
        } else {
          throw new Error(`Nguyên tố không tồn tại: "${two}"`);
        }
      } else {
        throw new Error(`Nguyên tố không tồn tại: "${one}"`);
      }
    }

    const n = readNumber();
    add(stack[stack.length - 1], sym, n);
  }

  if (stack.length !== 1) throw new Error('Ngoặc không cân đối');
  return stack[0];
}

const fmt = (n, digits = 4) => {
  if (isNaN(n) || !isFinite(n)) return '—';
  if (n === 0) return '0';
  // Dùng toPrecision cho số rất nhỏ, toFixed cho số thường
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toPrecision(digits);
  return +n.toFixed(digits);
};

export default function MolarMass() {
  const [f, setF] = useState('Ca(OH)2');
  const [v, setV] = useState('1');
  const [unit, setUnit] = useState('mol');
  const [useSGK, setUseSGK] = useState(false);

  const result = useMemo(() => {
    const t = f.replace(/\s/g, '');
    if (!t) return { ok: false, empty: true };

    let parts;
    try {
      parts = parse(t);
    } catch (err) {
      return { ok: false, err: err.message };
    }

    const getMass = (sym) => {
      if (useSGK && SGK_MASS[sym] !== undefined) return SGK_MASS[sym];
      return MASS[sym];
    };

    const M = Object.entries(parts).reduce(
      (a, [k, n]) => a + getMass(k) * n,
      0
    );
    return { ok: true, parts, M };
  }, [f, useSGK]);

  const { ok, parts, M, err, empty } = result;
  const x = parseFloat(v);
  const mol =
    !ok || isNaN(x)
      ? NaN
      : unit === 'mol'
        ? x
        : unit === 'g'
          ? x / M
          : x / 22.4; // đktc: 0°C, 1 atm (theo SGK VN)

  return (
    <section className="wrap narrow">
      <h1>Máy tính khối lượng mol</h1>
      <div className="card">
        <label>
          Công thức (vd: H2SO4, Ca(OH)2, Al2(SO4)3, CuSO4.5H2O)
          <input
            value={f}
            onChange={(e) => setF(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </label>

        {empty && <p className="hint">Nhập công thức để bắt đầu.</p>}
        {err && (
          <p className="hint" style={{ color: 'var(--acc)' }}>
            ⚠️ {err}
          </p>
        )}

        {ok && (
          <>
            <p className="result">
              <span>M</span>
              <b>{fmt(M)}</b>
              <small>g/mol</small>
            </p>
            <p className="hint center">
              {Object.entries(parts)
                .map(([k, n]) => {
                  const m = useSGK && SGK_MASS[k] !== undefined ? SGK_MASS[k] : MASS[k];
                  return `${k}×${n} (${m})`;
                })
                .join(' + ')}
            </p>

            <label className="row" style={{ marginTop: '.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useSGK}
                onChange={(e) => setUseSGK(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span style={{ textTransform: 'none', letterSpacing: 0 }}>
                Dùng số liệu SGK phổ thông VN (làm tròn)
              </span>
            </label>

            <div className="row" style={{ marginTop: '1rem' }}>
              <label style={{ flex: 1 }}>
                Giá trị
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={v}
                  onChange={(e) => setV(e.target.value)}
                />
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
              <div>
                <dt>Số mol</dt>
                <dd>{fmt(mol)} mol</dd>
              </div>
              <div>
                <dt>Khối lượng</dt>
                <dd>{fmt(mol * M)} g</dd>
              </div>
              <div>
                <dt>Thể tích khí (đktc)</dt>
                <dd>{fmt(mol * 22.4)} lít</dd>
              </div>
            </dl>
            <p className="hint" style={{ marginTop: '.4rem' }}>
              * Đktc = 0°C, 1 atm → 22.4 L/mol (theo SGK VN).
            </p>
          </>
        )}
      </div>
    </section>
  );
}