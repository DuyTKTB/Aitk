/* ============================================================================
   formulasGdpt2026.js — BỘ CÔNG THỨC TƯƠNG TÁC CHUẨN GDPT 2018 / THPT 2026
   ----------------------------------------------------------------------------
   Phủ trọn vẹn kiến thức trọng tâm 3 môn KHTN mới nhất theo Bộ GD&ĐT 2025–2026:
     • HÓA HỌC (7 công thức cốt lõi 2026):
         đkc 24,79 L/mol · Enthalpy ΔrH°298 (tạo thành & liên kết) · Van't Hoff
         Pin điện hóa E°pin · Điện phân Faraday · Chuẩn độ Acid–Base · Ester hóa
     • VẬT LÍ (10 công thức cốt lõi 2026 — phủ trọn 4 chương Vật lí 12 + Lý 11):
         Nhiệt lượng & ΔU = A+Q · Nóng chảy & Hóa hơi · Khí lí tưởng & Động học
         Lực từ F=BILsinα · Từ thông & Faraday · Điện xoay chiều & Máy biến áp
         Độ hụt khối & E_lk · Phóng xạ & Độ phóng xạ H · Sóng dừng · Con lắc đơn
     • SINH HỌC (8 công thức cốt lõi 2026 — phủ trọn Sinh 10–12):
         Phiên mã & Dịch mã · Phân li độc lập Mendel · Hoán vị gene (Bàng–Morgan)
         Tự thụ phấn n thế hệ · Số kiểu gene tối đa · Sinh trưởng VSV
         Kích thước quần thể & Hiệu suất sinh thái · Giảm phân & Thụ tinh
   ============================================================================ */

const fmt = (n, d = 4) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return '—';
  if (Math.abs(n) < 1e-9) return '0';
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toPrecision(d);
  return +n.toFixed(d);
};

const I = (k, label, unit = '', x = {}) => ({ k, label, unit, ...x });
const S = (k, label, options, def) => ({ k, label, options, def });

const solve = (v, rules) => {
  const bl = Object.keys(rules).filter((k) => Number.isNaN(v[k]));
  if (bl.length !== 1) return [{ l: 'Cách dùng', v: 'Để trống đúng 1 ô cần tìm', warn: true }];
  const [label, unit, fn, d] = rules[bl[0]];
  return [{ l: label, v: fn(v), u: unit, main: true, d }];
};

export const GDPT2026_CARDS = [
  /* ===================== HÓA HỌC CHUẨN 2026 ===================== */
  {
    id: 'hoa_dkc_2026',
    tab: 'mol',
    subject: 'hoa',
    subGroup: 'mol',
    grade: '10–12',
    is2026: true,
    title: 'Thể tích mol khí ở điều kiện chuẩn (đkc 2026)',
    f: 'n = V / 24,79   (đkc: 25°C, 1 bar)   ·   V_đkc = n × 24,79 lít',
    partial: true,
    kw: 'dkc 24.79 dieu kien chuan the tich khi mol 2025 2026',
    hint: 'Chương trình GDPT 2018 & đề thi THPT 2025–2026 dùng chuẩn đkc (24,79 L/mol). Để trống 1 ô cần tính.',
    inputs: [
      I('n', 'Số mol khí n', 'mol'),
      I('V', 'Thể tích khí V (đkc)', 'lít', { def: '2.479' }),
    ],
    calc: (v) => {
      const bl = ['n', 'V'].filter((k) => Number.isNaN(v[k]));
      if (bl.length !== 1) return [{ l: 'Cách dùng', v: 'Để trống đúng 1 ô (n hoặc V)', warn: true }];
      if (bl[0] === 'n') {
        const nVal = v.V / 24.79;
        return [
          { l: 'Số mol n (đkc 24,79)', v: nVal, u: 'mol', main: true, d: 4 },
          { l: 'Số phân tử khí', v: nVal * 6.022e23, u: 'phân tử', d: 3 },
        ];
      }
      return [
        { l: 'Thể tích V (đkc — 25°C, 1 bar)', v: v.n * 24.79, u: 'lít', main: true, d: 4 },
        { l: 'Số phân tử khí', v: v.n * 6.022e23, u: 'phân tử', d: 3 },
      ];
    },
  },
  {
    id: 'hoa_enthalpy_2026',
    tab: 'nhiet',
    subject: 'hoa',
    subGroup: 'nhiet',
    grade: '10',
    is2026: true,
    title: 'Biến thiên Enthalpy chuẩn ΔrH°₂₉₈',
    f: 'ΔrH° = ΣΔfH°(sp) − ΣΔfH°(cđ)   hoặc   ΔrH° = ΣEb(cđ) − ΣEb(sp)',
    kw: 'enthalpy nhiet tao thanh nang luong lien ket toa nhiet thu nhiet hoa 10 2026',
    hint: 'CHÚ Ý BẪY NGƯỢC DẤU: Nhiệt tạo thành lấy (Sản phẩm − Chất đầu); Năng lượng liên kết lấy (Chất đầu − Sản phẩm)!',
    selects: [
      S('mode', 'Phương pháp tính', [
        ['dfh', 'Theo nhiệt tạo thành chuẩn ΔfH°₂₉₈'],
        ['eb', 'Theo năng lượng liên kết Eb'],
      ]),
    ],
    inputs: [
      I('cd', (o) => (o.mode === 'dfh' ? 'Tổng ΔfH° chất đầu' : 'Tổng Eb chất đầu'), 'kJ', { def: '-110.5' }),
      I('sp', (o) => (o.mode === 'dfh' ? 'Tổng ΔfH° sản phẩm' : 'Tổng Eb sản phẩm'), 'kJ', { def: '-393.5' }),
    ],
    calc: (v, o) => {
      const dH = o.mode === 'dfh' ? v.sp - v.cd : v.cd - v.sp;
      return [
        { l: 'Biến thiên Enthalpy ΔrH°₂₉₈', v: dH, u: 'kJ', main: true, d: 2 },
        { l: 'Bản chất phản ứng', v: Math.abs(dH) < 1e-9 ? 'Không đổi nhiệt' : dH < 0 ? 'Phản ứng TỎA NHIỆT (thuận lợi)' : 'Phản ứng THU NHIỆT' },
        { l: 'Công thức đã áp dụng', v: o.mode === 'dfh' ? 'ΣΔfH°(sp) − ΣΔfH°(cđ)' : 'ΣEb(cđ) − ΣEb(sp)' },
      ];
    },
  },
  {
    id: 'hoa_vanthoff_2026',
    tab: 'nhiet',
    subject: 'hoa',
    subGroup: 'nhiet',
    grade: '10',
    is2026: true,
    title: "Quy tắc Van't Hoff (Ảnh hưởng nhiệt độ tới tốc độ)",
    f: 'v₂ / v₁ = γ ^ ((T₂ − T₁) / 10)',
    kw: 'vant hoff toc do phan ung nhiet do gamma hoa 10 2026',
    hint: 'Khi nhiệt độ tăng thêm 10°C, tốc độ phản ứng tăng lên γ lần (thường γ = 2 ÷ 4).',
    inputs: [
      I('g', 'Hệ số nhiệt độ γ', '', { def: '2' }),
      I('T1', 'Nhiệt độ ban đầu T₁', '°C', { def: '20' }),
      I('T2', 'Nhiệt độ sau T₂', '°C', { def: '50' }),
      I('v1', 'Tốc độ ban đầu v₁', '', { opt: 1, def: '1' }),
    ],
    calc: (v) => {
      if (v.g <= 0) return [{ l: 'Lưu ý', v: 'Hệ số γ phải > 0', bad: true }];
      const factor = v.g ** ((v.T2 - v.T1) / 10);
      return [
        { l: 'Tỉ số tốc độ v₂ / v₁', v: factor, u: 'lần', main: true, d: 3 },
        { l: 'Tốc độ sau v₂', v: (v.v1 || 1) * factor, d: 3 },
        { l: 'Thời gian phản ứng thay đổi', v: `Giảm ${fmt(factor, 2)} lần (t₂ = t₁ / ${fmt(factor, 2)})` },
      ];
    },
  },
  {
    id: 'hoa_pin_2026',
    tab: 'nhiet',
    subject: 'hoa',
    subGroup: 'nhiet',
    grade: '12',
    is2026: true,
    title: 'Sức điện động chuẩn Pin Galvani (Điện hóa 12)',
    f: 'E°_pin = E°_cathode (+) − E°_anode (−)   ·   ΔG° = −n·F·E°_pin',
    kw: 'pin galvani dien hoa suc dien dong the dien cuc cathode anode hoa 12 2026',
    hint: 'Cực có thế điện cực chuẩn E° lớn hơn làm Cathode (+, xảy ra sự khử), cực nhỏ hơn làm Anode (−, xảy ra sự oxi hóa).',
    inputs: [
      I('e1', 'Thế điện cực cặp 1 (E°₁)', 'V', { def: '-0.763' }),
      I('e2', 'Thế điện cực cặp 2 (E°₂)', 'V', { def: '0.340' }),
      I('n', 'Số electron trao đổi n', 'e', { opt: 2, def: '2' }),
    ],
    calc: (v) => {
      const eCat = Math.max(v.e1, v.e2);
      const eAno = Math.min(v.e1, v.e2);
      const ePin = eCat - eAno;
      const dG = -(v.n || 2) * 96.5 * ePin;
      return [
        { l: 'Sức điện động chuẩn E°_pin', v: ePin, u: 'V', main: true, d: 3 },
        { l: 'Cathode (+) / Anode (−)', v: `E°(+) = ${fmt(eCat, 3)} V  ·  E°(−) = ${fmt(eAno, 3)} V` },
        { l: 'Biến thiên ΔrG°', v: dG, u: 'kJ/mol', d: 2 },
      ];
    },
  },
  {
    id: 'hoa_faraday_2026',
    tab: 'nhiet',
    subject: 'hoa',
    subGroup: 'nhiet',
    grade: '12',
    is2026: true,
    title: 'Điện phân — Định luật Faraday (Hóa 12)',
    f: 'm = (A·I·t) / (n·F)   ·   n_e = I·t / 96500   (F = 96500 C/mol)',
    kw: 'dien phan faraday cuong do dong dien thoi gian cathode anode hoa 12 2026',
    hint: 'Thời gian t tính bằng giây (s). Ví dụ Cu (A = 64, n = 2), Ag (A = 108, n = 1).',
    inputs: [
      I('A', 'Nguyên tử khối A', 'g/mol', { def: '64' }),
      I('n', 'Số e trao đổi n', '', { def: '2' }),
      I('I', 'Cường độ dòng I', 'A', { def: '5' }),
      I('t', 'Thời gian t', 'giây', { def: '1930' }),
    ],
    calc: (v) => {
      if (v.n <= 0 || v.I < 0 || v.t < 0) return [{ l: 'Lưu ý', v: 'Kiểm tra n > 0 và I, t ≥ 0', bad: true }];
      const ne = (v.I * v.t) / 96500;
      const m = (v.A * ne) / v.n;
      return [
        { l: 'Khối lượng chất giải phóng m', v: m, u: 'g', main: true, d: 3 },
        { l: 'Số mol electron trao đổi n_e', v: ne, u: 'mol', d: 4 },
        { l: 'Thể tích khí O₂ (nếu 4e) ở đkc', v: (ne / 4) * 24.79, u: 'lít', d: 3 },
      ];
    },
  },
  {
    id: 'hoa_chuando_2026',
    tab: 'dd',
    subject: 'hoa',
    subGroup: 'dd',
    grade: '11',
    is2026: true,
    title: 'Chuẩn độ Acid – Base (Điểm tương đương)',
    f: 'a·C_A·V_A = b·C_B·V_B   (n_H⁺ = n_OH⁻)',
    partial: true,
    kw: 'chuan do acid base diem tuong duong phenolphtalein naoh hcl hoa 11 2026',
    hint: 'Để trống đúng 1 đại lượng cần tìm (C_A, V_A, C_B hoặc V_B). V nhập cùng đơn vị (mL hoặc L).',
    inputs: [
      I('CA', 'C_M acid (C_A)', 'M'),
      I('VA', 'Thể tích acid (V_A)', 'mL', { def: '10' }),
      I('CB', 'C_M base (C_B)', 'M', { def: '0.1' }),
      I('VB', 'Thể tích base (V_B)', 'mL', { def: '12.5' }),
      I('a', 'Số H⁺ (a)', '', { opt: 1, def: '1' }),
      I('b', 'Số OH⁻ (b)', '', { opt: 1, def: '1' }),
    ],
    calc: (v) => {
      const a = v.a || 1;
      const b = v.b || 1;
      return solve(v, {
        CA: ['Nồng độ acid C_A', 'M', (x) => (b * x.CB * x.VB) / (a * x.VA), 4],
        VA: ['Thể tích acid V_A', 'mL', (x) => (b * x.CB * x.VB) / (a * x.CA), 3],
        CB: ['Nồng độ base C_B', 'M', (x) => (a * x.CA * x.VA) / (b * x.VB), 4],
        VB: ['Thể tích base V_B', 'mL', (x) => (a * x.CA * x.VA) / (b * x.CB), 3],
      });
    },
  },
  {
    id: 'hoa_ester_2026',
    tab: 'hc',
    subject: 'hoa',
    subGroup: 'hc',
    grade: '12',
    is2026: true,
    title: 'Phản ứng Ester hóa & Hiệu suất (Hóa 12)',
    f: 'RCOOH + R\'OH ⇌ RCOOR\' + H₂O   ·   n_ester = min(n_acid, n_ancol) × H%',
    kw: 'ester este hoa hieu suat axit ancol etyl axetat hoa 12 2026',
    hint: 'Hiệu suất luôn tính theo chất có số mol NHỎ HƠN (chất hết theo tỉ lệ 1:1). Ví dụ CH₃COOC₂H₅ có M = 88.',
    inputs: [
      I('na', 'n acid (RCOOH)', 'mol', { def: '0.2' }),
      I('nb', 'n ancol (R\'OH)', 'mol', { def: '0.25' }),
      I('M', 'M ester (RCOOR\')', 'g/mol', { def: '88' }),
      I('H', 'Hiệu suất H', '%', { def: '75' }),
    ],
    calc: (v) => {
      const lim = Math.min(v.na, v.nb);
      const nEst = (lim * v.H) / 100;
      return [
        { l: 'Khối lượng ester thu được', v: nEst * v.M, u: 'g', main: true, d: 3 },
        { l: 'Số mol ester tạo thành', v: nEst, u: 'mol', d: 4 },
        { l: 'Tính hiệu suất theo', v: v.na <= v.nb ? 'Acid (số mol nhỏ hơn)' : 'Ancol (số mol nhỏ hơn)' },
      ];
    },
  },

  /* ===================== VẬT LÍ CHUẨN 2026 ===================== */
  {
    id: 'ly_nhiet_q',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_nhiet',
    grade: '12',
    is2026: true,
    title: 'Nhiệt lượng & Định luật I Nhiệt động lực học',
    f: 'Q = m·c·(t₂ − t₁)   ·   ΔU = A + Q   (c_nước = 4180 J/kg·K)',
    kw: 'vat li nhiet nhiet luong nhiet dung rieng noi nang dinh luat 1 nhiet dong luc hoc ly 12 2026',
    hint: 'Quy ước dấu GDPT 2018: Q > 0 (nhận nhiệt), Q < 0 (truyền nhiệt); A > 0 (nhận công), A < 0 (thực hiện công).',
    inputs: [
      I('m', 'Khối lượng m', 'kg', { def: '2' }),
      I('c', 'Nhiệt dung riêng c', 'J/kg·K', { def: '4180' }),
      I('t1', 'Nhiệt độ đầu t₁', '°C', { def: '25' }),
      I('t2', 'Nhiệt độ cuối t₂', '°C', { def: '100' }),
      I('A', 'Công A (nếu có)', 'J', { opt: 0, def: '0' }),
    ],
    calc: (v) => {
      const Q = v.m * v.c * (v.t2 - v.t1);
      const dU = Q + (v.A || 0);
      return [
        { l: 'Nhiệt lượng Q', v: Q / 1000, u: 'kJ', main: true, d: 3 },
        { l: 'Nhiệt lượng Q (Joule)', v: Q, u: 'J', d: 1 },
        { l: 'Độ biến thiên nội năng ΔU = A + Q', v: dU / 1000, u: 'kJ', d: 3 },
      ];
    },
  },
  {
    id: 'ly_chuyenthe',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_nhiet',
    grade: '12',
    is2026: true,
    title: 'Nhiệt nóng chảy riêng & Nhiệt hóa hơi riêng',
    f: 'Q_nóng chảy = λ·m   ·   Q_hóa hơi = L·m',
    kw: 'vat li nhiet nong chay rieng hoa hoi rieng chuyen the nuoc da ly 12 2026',
    hint: 'Nước đá (0°C): λ = 3,34×10⁵ J/kg · Nước sôi (100°C): L = 2,26×10⁶ J/kg.',
    selects: [
      S('mode', 'Quá trình chuyển thể', [
        ['nc', 'Nóng chảy (λ = 3,34×10⁵ J/kg — Nước đá)'],
        ['hh', 'Hóa hơi (L = 2,26×10⁶ J/kg — Nước sôi)'],
        ['custom', 'Tự nhập λ hoặc L (J/kg)'],
      ]),
    ],
    inputs: [
      I('m', 'Khối lượng m', 'kg', { def: '0.5' }),
      I('k', 'Hệ số λ hoặc L', 'J/kg', { def: '334000', show: (o) => o.mode === 'custom' }),
    ],
    calc: (v, o) => {
      const coeff = o.mode === 'nc' ? 3.34e5 : o.mode === 'hh' ? 2.26e6 : v.k;
      const Q = coeff * v.m;
      return [
        { l: 'Nhiệt lượng chuyển thể Q', v: Q / 1000, u: 'kJ', main: true, d: 2 },
        { l: 'Giá trị theo Joule', v: Q, u: 'J', d: 0 },
        { l: 'Hệ số đã dùng', v: coeff, u: 'J/kg', d: 3 },
      ];
    },
  },
  {
    id: 'ly_khi_li_tuong',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_khi',
    grade: '12',
    is2026: true,
    title: 'Khí lí tưởng & Động năng tịnh tiến phân tử',
    f: 'p·V = n·R·T   ·   E_đ = (3/2)·k_B·T   ·   v_rms = √(3RT/M)',
    kw: 'vat li khi li tuong dong nang phan tu boltzmann ap suat nhiet do kelvin ly 12 2026',
    hint: 'T(K) = t(°C) + 273. Hằng số Boltzmann k_B = 1,38×10⁻²³ J/K, R = 8,31 J/(mol·K).',
    inputs: [
      I('n', 'Số mol khí n', 'mol', { def: '1' }),
      I('V', 'Thể tích V', 'lít', { def: '24.79' }),
      I('tC', 'Nhiệt độ t', '°C', { def: '25' }),
      I('M', 'Khối lượng mol M (vd O₂=32)', 'g/mol', { opt: 32, def: '32' }),
    ],
    calc: (v) => {
      const T = v.tC + 273;
      if (v.V <= 0 || T <= 0) return [{ l: 'Lưu ý', v: 'V > 0 và T(K) > 0', bad: true }];
      const Vm3 = v.V * 1e-3;
      const pPa = (v.n * 8.31 * T) / Vm3;
      const Ed = 1.5 * 1.38e-23 * T;
      const Mkg = (v.M || 32) * 1e-3;
      const vrms = Math.sqrt((3 * 8.31 * T) / Mkg);
      return [
        { l: 'Áp suất khí p', v: pPa / 1e5, u: 'bar (≈ 10⁵ Pa)', main: true, d: 3 },
        { l: 'Áp suất theo Pascal', v: pPa, u: 'Pa', d: 1 },
        { l: 'Động năng trung bình E_đ', v: Ed, u: 'J', d: 3 },
        { l: 'Tốc độ căn quân phương v_rms', v: vrms, u: 'm/s', d: 1 },
      ];
    },
  },
  {
    id: 'ly_luc_tu',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_tu',
    grade: '12',
    is2026: true,
    title: 'Lực từ tác dụng lên dây dẫn mang dòng điện',
    f: 'F = B · I · L · sinα',
    partial: true,
    kw: 'vat li tu truong luc tu ampe cam ung tu b i l sin alpha ly 12 2026',
    hint: 'α là góc giữa dây dẫn và vectơ cảm ứng từ B (độ). Để trống đúng 1 trong 4 ô F, B, I, L.',
    inputs: [
      I('F', 'Lực từ F', 'N'),
      I('B', 'Cảm ứng từ B', 'T', { def: '0.2' }),
      I('I', 'Cường độ dòng I', 'A', { def: '5' }),
      I('L', 'Chiều dài dây L', 'm', { def: '0.5' }),
      I('deg', 'Góc α', 'độ', { opt: 90, def: '90' }),
    ],
    calc: (v) => {
      const sinA = Math.sin(((v.deg ?? 90) * Math.PI) / 180);
      return solve(v, {
        F: ['Lực từ F', 'N', (x) => x.B * x.I * x.L * sinA, 4],
        B: ['Cảm ứng từ B', 'T', (x) => x.F / (x.I * x.L * sinA), 4],
        I: ['Cường độ dòng I', 'A', (x) => x.F / (x.B * x.L * sinA), 4],
        L: ['Chiều dài L', 'm', (x) => x.F / (x.B * x.I * sinA), 4],
      });
    },
  },
  {
    id: 'ly_cam_ung_tu',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_tu',
    grade: '12',
    is2026: true,
    title: 'Từ thông & Suất điện động cảm ứng Faraday',
    f: 'Φ = N·B·S·cosα   ·   |e_c| = |ΔΦ / Δt|',
    kw: 'vat li tu thong cam ung dien tu faraday suat dien dong ly 12 2026',
    hint: 'α là góc hợp bởi vectơ pháp tuyến n và cảm ứng từ B (nếu B vuông góc mặt phẳng khung thì α = 0°).',
    inputs: [
      I('N', 'Số vòng dây N', 'vòng', { def: '100' }),
      I('B1', 'B ban đầu (B₁)', 'T', { def: '0.5' }),
      I('B2', 'B lúc sau (B₂)', 'T', { def: '0.1' }),
      I('S', 'Diện tích 1 vòng S', 'cm²', { def: '20' }),
      I('dt', 'Thời gian Δt', 's', { def: '0.04' }),
      I('deg', 'Góc α (n, B)', 'độ', { opt: 0, def: '0' }),
    ],
    calc: (v) => {
      if (v.dt <= 0) return [{ l: 'Lưu ý', v: 'Δt phải > 0', bad: true }];
      const Sm2 = v.S * 1e-4;
      const cosA = Math.cos(((v.deg || 0) * Math.PI) / 180);
      const phi1 = v.N * v.B1 * Sm2 * cosA;
      const phi2 = v.N * v.B2 * Sm2 * cosA;
      const ec = Math.abs(phi2 - phi1) / v.dt;
      return [
        { l: 'Suất điện động cảm ứng |e_c|', v: ec, u: 'V', main: true, d: 3 },
        { l: 'Từ thông ban đầu Φ₁', v: phi1, u: 'Wb', d: 5 },
        { l: 'Độ biến thiên |ΔΦ|', v: Math.abs(phi2 - phi1), u: 'Wb', d: 5 },
      ];
    },
  },
  {
    id: 'ly_may_bien_ap',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_tu',
    grade: '12',
    is2026: true,
    title: 'Điện xoay chiều & Máy biến áp lí tưởng',
    f: 'U = U₀/√2   ·   U₁ / U₂ = N₁ / N₂ = I₂ / I₁',
    partial: true,
    kw: 'vat li dien xoay chieu hieu dung may bien ap cuon so cap thu cap ly 12 2026',
    hint: 'Để trống đúng 1 ô trong 4 đại lượng U₁, U₂, N₁, N₂ để tính tự động.',
    inputs: [
      I('U1', 'Điện áp sơ cấp U₁', 'V', { def: '220' }),
      I('U2', 'Điện áp thứ cấp U₂', 'V'),
      I('N1', 'Số vòng sơ cấp N₁', 'vòng', { def: '1100' }),
      I('N2', 'Số vòng thứ cấp N₂', 'vòng', { def: '110' }),
    ],
    calc: (v) => {
      const res = solve(v, {
        U1: ['Điện áp sơ cấp U₁', 'V', (x) => (x.U2 * x.N1) / x.N2, 2],
        U2: ['Điện áp thứ cấp U₂', 'V', (x) => (x.U1 * x.N2) / x.N1, 2],
        N1: ['Số vòng sơ cấp N₁', 'vòng', (x) => (x.N2 * x.U1) / x.U2, 0],
        N2: ['Số vòng thứ cấp N₂', 'vòng', (x) => (x.N1 * x.U2) / x.U1, 0],
      });
      if (res[0]?.main && !res[0]?.warn) {
        const uVal = Number.isNaN(v.U2) ? res[0].v : v.U2;
        res.push({ l: 'Điện áp cực đại U₀₂ = U₂·√2', v: uVal * Math.SQRT2, u: 'V', d: 2 });
      }
      return res;
    },
  },
  {
    id: 'ly_hat_nhan_elk',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_hn',
    grade: '12',
    is2026: true,
    title: 'Độ hụt khối & Năng lượng liên kết hạt nhân',
    f: 'Δm = Z·m_p + (A − Z)·m_n − m_X   ·   E_lk = Δm·931,5 (MeV)   ·   ε = E_lk / A',
    kw: 'vat li hat nhan do hut khoi nang luong lien ket rieng mev ben vung ly 12 2026',
    hint: 'Mặc định: m_p = 1,0073 u · m_n = 1,0087 u · 1 u·c² = 931,5 MeV. Ví dụ He-4 (Z=2, A=4, m=4,0015 u).',
    inputs: [
      I('Z', 'Số proton Z', '', { def: '2' }),
      I('A', 'Số khối A', '', { def: '4' }),
      I('mX', 'Khối lượng hạt nhân m_X', 'u', { def: '4.0015' }),
    ],
    calc: (v) => {
      if (v.A <= 0 || v.Z < 0 || v.Z > v.A) return [{ l: 'Lưu ý', v: 'Kiểm tra 0 ≤ Z ≤ A', bad: true }];
      const dm = v.Z * 1.0073 + (v.A - v.Z) * 1.0087 - v.mX;
      const elk = dm * 931.5;
      return [
        { l: 'Năng lượng liên kết E_lk', v: elk, u: 'MeV', main: true, d: 3 },
        { l: 'Độ hụt khối Δm', v: dm, u: 'u', d: 5 },
        { l: 'Năng lượng liên kết riêng ε = E_lk/A', v: elk / v.A, u: 'MeV/nucleon', d: 3 },
      ];
    },
  },
  {
    id: 'ly_phong_xa',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_hn',
    grade: '12',
    is2026: true,
    title: 'Định luật phóng xạ & Độ phóng xạ H',
    f: 'N = N₀·2^(−t/T)   ·   ΔN = N₀·(1 − 2^(−t/T))   ·   H = (ln2 / T)·N',
    kw: 'vat li hat nhan phong xa chu ki ban ra do phong xa bq ly 12 2026',
    hint: 'Nhập t và T cùng đơn vị thời gian (ngày, năm, giờ hoặc giây).',
    inputs: [
      I('m0', 'Khối lượng/Số hạt ban đầu (m₀)', '', { def: '100' }),
      I('T', 'Chu kì bán rã T', 'đv thời gian', { def: '8' }),
      I('t', 'Thời gian phân rã t', 'đv thời gian', { def: '24' }),
    ],
    calc: (v) => {
      if (v.T <= 0 || v.t < 0) return [{ l: 'Lưu ý', v: 'T > 0 và t ≥ 0', bad: true }];
      const remainFrac = 2 ** (-v.t / v.T);
      const remain = v.m0 * remainFrac;
      return [
        { l: 'Lượng còn lại (m hoặc N)', v: remain, main: true, d: 4 },
        { l: 'Lượng đã phân rã (Δm hoặc ΔN)', v: v.m0 - remain, d: 4 },
        { l: 'Tỉ lệ còn lại / Đã phân rã', v: `${fmt(remainFrac * 100, 2)}%  /  ${fmt((1 - remainFrac) * 100, 2)}%` },
      ];
    },
  },
  {
    id: 'ly_song_dung',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_song',
    grade: '11',
    is2026: true,
    title: 'Sóng dừng trên dây (2 đầu cố định / 1 đầu tự do)',
    f: '2 đầu cố định: l = k·(λ/2)   ·   1 đầu tự do: l = (2k + 1)·(λ/4)',
    kw: 'vat li song dung bung song nut song chieu dai day buoc song ly 11 2026',
    selects: [
      S('mode', 'Điều kiện hai đầu dây', [
        ['fixed', 'Hai đầu cố định (số bụng = k, số nút = k + 1)'],
        ['free', 'Một đầu cố định, một đầu tự do (số bụng = số nút = k + 1)'],
      ]),
    ],
    inputs: [
      I('l', 'Chiều dài dây l', 'cm', { def: '120' }),
      I('lam', 'Bước sóng λ', 'cm', { def: '40' }),
    ],
    calc: (v, o) => {
      if (v.l <= 0 || v.lam <= 0) return [{ l: 'Lưu ý', v: 'l và λ phải > 0', bad: true }];
      if (o.mode === 'fixed') {
        const k = (2 * v.l) / v.lam;
        const ok = Math.abs(k - Math.round(k)) < 0.05 && Math.round(k) >= 1;
        const kn = Math.round(k);
        return [
          { l: 'Điều kiện sóng dừng', v: ok ? `Có sóng dừng (k = ${kn})` : `Chưa khớp (2l/λ = ${fmt(k, 2)})`, main: true, bad: !ok },
          { l: 'Số bụng sóng / Số nút sóng', v: ok ? `${kn} bụng  ·  ${kn + 1} nút` : '—' },
        ];
      }
      const m = (4 * v.l) / v.lam;
      const k = (m - 1) / 2;
      const ok = Math.abs(k - Math.round(k)) < 0.05 && Math.round(k) >= 0;
      const kn = Math.round(k);
      return [
        { l: 'Điều kiện sóng dừng', v: ok ? `Có sóng dừng (k = ${kn})` : `Chưa khớp (4l/λ = ${fmt(m, 2)})`, main: true, bad: !ok },
        { l: 'Số bụng sóng = Số nút sóng', v: ok ? `${kn + 1} bụng · ${kn + 1} nút` : '—' },
      ];
    },
  },
  {
    id: 'ly_con_lac_don',
    tab: 'ly',
    subject: 'ly',
    subGroup: 'ly_song',
    grade: '11',
    is2026: true,
    title: 'Dao động Con lắc đơn',
    f: 'T = 2π·√(l / g)   ·   ω = √(g / l)   ·   v_max = √(2gl(1 − cosα₀))',
    kw: 'vat li dao dong con lac don chu ki chieu dai gia toc roi tu do ly 11 2026',
    inputs: [
      I('l', 'Chiều dài dây l', 'm', { def: '1' }),
      I('g', 'Gia tốc g', 'm/s²', { def: '9.8' }),
      I('deg', 'Biên độ góc α₀', 'độ', { opt: 6, def: '6' }),
    ],
    calc: (v) => {
      if (v.l <= 0 || v.g <= 0) return [{ l: 'Lưu ý', v: 'l và g phải > 0', bad: true }];
      const w = Math.sqrt(v.g / v.l);
      const T = (2 * Math.PI) / w;
      const rad = ((v.deg || 0) * Math.PI) / 180;
      const vmax = Math.sqrt(2 * v.g * v.l * (1 - Math.cos(rad)));
      return [
        { l: 'Chu kì T', v: T, u: 's', main: true, d: 3 },
        { l: 'Tần số f / Tần số góc ω', v: `${fmt(1 / T, 3)} Hz  ·  ${fmt(w, 3)} rad/s` },
        { l: 'Vận tốc cực đại v_max', v: vmax, u: 'm/s', d: 3 },
      ];
    },
  },

  /* ===================== SINH HỌC CHUẨN 2026 ===================== */
  {
    id: 'sinh_phienma_dichma',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_pt',
    grade: '12',
    is2026: true,
    title: 'Phiên mã (mRNA) & Dịch mã (Chuỗi Polypeptide)',
    f: 'rN = N/2   ·   Số bộ ba = rN/3   ·   aa_mt = rN/3 − 1   ·   aa_hoàn chỉnh = rN/3 − 2',
    kw: 'sinh hoc phien ma dich ma mrna axit amin amino acid protein codon sinh 12 2026',
    hint: 'CHÚ Ý BẪY: Bộ ba kết thúc (UAA/UAG/UGA) không mã hóa amino acid; chuỗi protein hoàn chỉnh cắt bỏ thêm Met mở đầu nên trừ 2!',
    inputs: [
      I('N', 'Tổng số nu của gene DNA (N)', 'nu', { def: '3000' }),
      I('k', 'Số lần phiên mã (số mRNA)', 'lần', { opt: 1, def: '1' }),
      I('ribo', 'Số ribosome trượt qua 1 mRNA', 'ribo', { opt: 1, def: '1' }),
    ],
    calc: (v) => {
      if (v.N < 12) return [{ l: 'Lưu ý', v: 'Tổng nu N phải ≥ 12', bad: true }];
      const rN = v.N / 2;
      const codons = Math.floor(rN / 3);
      const aaMt = Math.max(0, codons - 1);
      const aaFinal = Math.max(0, codons - 2);
      const totalChains = (v.k || 1) * (v.ribo || 1);
      return [
        { l: 'Số amino acid chuỗi hoàn chỉnh', v: aaFinal, u: 'aa / chuỗi', main: true, d: 0 },
        { l: 'Số rN trên 1 mRNA · Số bộ ba (codon)', v: `${fmt(rN, 0)} rN  ·  ${codons} codon` },
        { l: 'Tổng aa môi trường cần cung cấp', v: aaMt * totalChains, u: 'aa', d: 0 },
        { l: 'Số phân tử H₂O giải phóng (tổng)', v: Math.max(0, aaMt - 1) * totalChains, u: 'phân tử', d: 0 },
      ];
    },
  },
  {
    id: 'sinh_mendel',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_ql',
    grade: '12',
    is2026: true,
    title: 'Phân li độc lập Mendel (n cặp gene dị hợp)',
    f: 'Giao tử = 2ⁿ   ·   Kiểu gene F₂ = 3ⁿ   ·   Kiểu hình F₂ = 2ⁿ   ·   Đồng hợp lặn = (1/4)ⁿ',
    kw: 'sinh hoc mendel phan li doc lap giao tu kieu gen kieu hinh di hop sinh 12 2026',
    hint: 'Áp dụng khi P dị hợp n cặp gene (AaBb...) tự thụ phấn, trội hoàn toàn, mỗi gene quy định 1 tính trạng.',
    inputs: [I('n', 'Số cặp gene dị hợp n', 'cặp', { def: '3' })],
    calc: (v) => {
      if (v.n < 1 || v.n > 15) return [{ l: 'Lưu ý', v: 'Nhập n từ 1 đến 15', bad: true }];
      const n = Math.round(v.n);
      return [
        { l: 'Số loại giao tử (2ⁿ)', v: 2 ** n, u: 'loại', main: true, d: 0 },
        { l: 'Số kiểu gene F₂ (3ⁿ)', v: 3 ** n, u: 'kiểu gene', d: 0 },
        { l: 'Số kiểu hình F₂ (2ⁿ) · Số tổ hợp (4ⁿ)', v: `${2 ** n} KH  ·  ${4 ** n} tổ hợp` },
        { l: 'Tỉ lệ đồng hợp lặn (aabb...)', v: `1 / ${4 ** n} (${fmt((100 / (4 ** n)), 3)}%)` },
      ];
    },
  },
  {
    id: 'sinh_hoanvi',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_ql',
    grade: '12',
    is2026: true,
    title: 'Hoán vị gene & Định lý Bàng – Morgan',
    f: 'GT liên kết = (1−f)/2   ·   GT hoán vị = f/2   ·   A−B− = 0,5 + aabb',
    kw: 'sinh hoc hoan vi gen morgan dinh ly bang tan so f ruoi giam sinh 12 2026',
    hint: 'Tần số hoán vị f ≤ 50%. Bẫy kinh điển: Ở ruồi giấm đực KHÔNG có hoán vị gene (f_đực = 0%)!',
    selects: [
      S('cis', 'Kiểu sắp xếp gene P dị hợp 2 cặp', [
        ['cis', 'Đồng hợp tử dị hợp đều (AB/ab × AB/ab)'],
        ['trans', 'Dị hợp chéo (Ab/aB × Ab/aB)'],
        ['mixed', 'Đều × Chéo (AB/ab × Ab/aB)'],
      ]),
    ],
    inputs: [
      I('f1', 'Tần số HVG giới 1 (f₁)', '%', { def: '20' }),
      I('f2', 'Tần số HVG giới 2 (f₂)', '%', { def: '20' }),
    ],
    calc: (v, o) => {
      if (v.f1 < 0 || v.f1 > 50 || v.f2 < 0 || v.f2 > 50) {
        return [{ l: 'Lưu ý', v: 'Tần số hoán vị f phải nằm trong [0%, 50%]', bad: true }];
      }
      const f1 = v.f1 / 100;
      const f2 = v.f2 / 100;
      const ab1 = o.cis === 'trans' ? f1 / 2 : (1 - f1) / 2;
      const ab2 = o.cis === 'cis' ? (1 - f2) / 2 : f2 / 2;
      const aabb = ab1 * ab2;
      const AB = 0.5 + aabb;
      const Ab = 0.25 - aabb;
      return [
        { l: 'Tỉ lệ kiểu hình trội 2 tính (A−B−)', v: AB * 100, u: '%', main: true, d: 2 },
        { l: 'Tỉ lệ đồng hợp lặn (ab/ab)', v: aabb * 100, u: '%', d: 2 },
        { l: 'Tỉ lệ (A−bb) = (aaB−)', v: Ab * 100, u: '%', d: 2 },
        { l: 'Giao tử ab (bố · mẹ)', v: `${fmt(ab1 * 100, 1)}%  ·  ${fmt(ab2 * 100, 1)}%` },
      ];
    },
  },
  {
    id: 'sinh_tuthuphan',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_qt',
    grade: '12',
    is2026: true,
    title: 'Quần thể Tự thụ phấn sau n thế hệ',
    f: 'Aa_n = h / 2ⁿ   ·   AA_n = d + h(1 − 1/2ⁿ)/2   ·   aa_n = r + h(1 − 1/2ⁿ)/2',
    kw: 'sinh hoc quan the tu thu phan the he di hop dong hop tan so alen sinh 12 2026',
    hint: 'Tự thụ phấn KHÔNG làm thay đổi tần số allele p(A), q(a) — chỉ làm tăng đồng hợp, giảm dị hợp!',
    inputs: [
      I('d', 'Tỉ lệ AA ban đầu (d)', '', { def: '0.2' }),
      I('h', 'Tỉ lệ Aa ban đầu (h)', '', { def: '0.6' }),
      I('r', 'Tỉ lệ aa ban đầu (r)', '', { def: '0.2' }),
      I('n', 'Số thế hệ tự thụ phấn n', 'thế hệ', { def: '2' }),
    ],
    calc: (v) => {
      const sum = v.d + v.h + v.r;
      if (sum <= 0 || v.n < 0) return [{ l: 'Lưu ý', v: 'Tổng tỉ lệ > 0 và n ≥ 0', bad: true }];
      const d = v.d / sum, h = v.h / sum, r = v.r / sum;
      const hn = h / (2 ** v.n);
      const dn = d + (h - hn) / 2;
      const rn = r + (h - hn) / 2;
      return [
        { l: `Cấu trúc F${Math.round(v.n)}`, v: `${fmt(dn, 4)} AA : ${fmt(hn, 4)} Aa : ${fmt(rn, 4)} aa`, main: true },
        { l: 'Tần số allele (không đổi)', v: `p(A) = ${fmt(d + h / 2, 3)}  ·  q(a) = ${fmt(r + h / 2, 3)}` },
        { l: 'Tỉ lệ kiểu hình trội (A−)', v: (dn + hn) * 100, u: '%', d: 2 },
      ];
    },
  },
  {
    id: 'sinh_kieu_gene_max',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_ql',
    grade: '12',
    is2026: true,
    title: 'Số kiểu gene tối đa (Gene có r allele)',
    f: 'NST thường: r(r + 1)/2   ·   Trên X (không tương đồng Y): r(r + 1)/2 + r',
    kw: 'sinh hoc so kieu gen toi da nhieu alen nhiem sac the thuong gioi tinh x y sinh 12 2026',
    inputs: [I('r', 'Số allele của gene (r)', 'allele', { def: '3' })],
    calc: (v) => {
      if (v.r < 1) return [{ l: 'Lưu ý', v: 'Số allele r phải ≥ 1', bad: true }];
      const r = Math.round(v.r);
      const auto = (r * (r + 1)) / 2;
      return [
        { l: 'Gene trên NST thường', v: auto, u: 'kiểu gene', main: true, d: 0 },
        { l: 'Gene trên vùng không tương đồng X', v: auto + r, u: 'kiểu gene (XX + XY)', d: 0 },
        { l: 'Gene trên vùng tương đồng X và Y', v: auto + r * r, u: 'kiểu gene', d: 0 },
      ];
    },
  },
  {
    id: 'sinh_vsv',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_qt',
    grade: '10',
    is2026: true,
    title: 'Sinh trưởng Vi sinh vật (Pha lũy thừa)',
    f: 'N_t = N₀ · 2ⁿ   với   n = t / g   (g: thời gian thế hệ)',
    kw: 'sinh hoc vi sinh vat sinh truong pha luy thua thoi gian the he sinh 10 2026',
    inputs: [
      I('N0', 'Số tế bào ban đầu N₀', 'TB', { def: '100' }),
      I('t', 'Thời gian nuôi cấy t', 'phút', { def: '120' }),
      I('g', 'Thời gian thế hệ g', 'phút', { def: '20' }),
    ],
    calc: (v) => {
      if (v.g <= 0 || v.t < 0 || v.N0 <= 0) return [{ l: 'Lưu ý', v: 'Kiểm tra N₀, g > 0 và t ≥ 0', bad: true }];
      const n = v.t / v.g;
      return [
        { l: 'Số tế bào sau thời gian t (N_t)', v: v.N0 * (2 ** n), u: 'TB', main: true, d: 0 },
        { l: 'Số lần phân chia n = t / g', v: n, u: 'lần', d: 2 },
      ];
    },
  },
  {
    id: 'sinh_sinhthai',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_qt',
    grade: '12',
    is2026: true,
    title: 'Kích thước quần thể & Hiệu suất sinh thái',
    f: 'N_t = N₀ + B − D + I − E   ·   H = (E_(n+1) / E_n) × 100%',
    kw: 'sinh hoc sinh thai kich thuoc quan the hieu suat sinh thai bac dinh duong sinh 12 2026',
    hint: 'BẪY KINH ĐIỂN: Sinh vật tiêu thụ bậc k thuộc Bậc dinh dưỡng cấp (k + 1)! Hiệu suất sinh thái thường khoảng 10%.',
    inputs: [
      I('En', 'Năng lượng bậc dinh dưỡng n', 'kcal', { def: '10000' }),
      I('En1', 'Năng lượng bậc kế tiếp (n+1)', 'kcal', { def: '1000' }),
    ],
    calc: (v) => {
      if (v.En <= 0) return [{ l: 'Lưu ý', v: 'Năng lượng bậc n phải > 0', bad: true }];
      const H = (v.En1 / v.En) * 100;
      return [
        { l: 'Hiệu suất sinh thái H', v: H, u: '%', main: true, d: 2 },
        { l: 'Năng lượng thất thoát (hô hấp, chất thải)', v: v.En - v.En1, u: 'kcal', d: 1 },
        { l: 'Phần trăm thất thoát', v: 100 - H, u: '%', d: 2 },
      ];
    },
  },
  {
    id: 'sinh_giamphan',
    tab: 'sinh',
    subject: 'sinh',
    subGroup: 'sinh_qt',
    grade: '10–12',
    is2026: true,
    title: 'Giảm phân tạo giao tử & Hiệu suất thụ tinh',
    f: 'a TB sinh tinh → 4a tinh trùng  ·  a TB sinh trứng → a trứng + 3a thể cực',
    kw: 'sinh hoc giam phan tinh trung trung the cuc thu tinh hop tu sinh 10 2026',
    selects: [
      S('sex', 'Loại tế bào sinh dục chín', [
        ['male', 'Tế bào sinh tinh (1 TB → 4 tinh trùng)'],
        ['female', 'Tế bào sinh trứng (1 TB → 1 trứng + 3 thể cực)'],
      ]),
    ],
    inputs: [
      I('a', 'Số tế bào giảm phân (a)', 'TB', { def: '10' }),
      I('H', 'Hiệu suất thụ tinh H', '%', { def: '50' }),
    ],
    calc: (v, o) => {
      const gametes = o.sex === 'male' ? 4 * v.a : v.a;
      const zygotes = (gametes * v.H) / 100;
      return [
        { l: o.sex === 'male' ? 'Tổng số tinh trùng tạo thành' : 'Tổng số trứng tạo thành', v: gametes, u: 'giao tử', main: true, d: 0 },
        { l: 'Số hợp tử được hình thành', v: zygotes, u: 'hợp tử', d: 1 },
        ...(o.sex === 'female' ? [{ l: 'Số thể cực tiêu biến', v: 3 * v.a, u: 'thể cực', d: 0 }] : []),
      ];
    },
  },
];
