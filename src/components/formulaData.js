// src/components/formulaData.js
// File này CHỈ chứa dữ liệu. KHÔNG được có JSX, KHÔNG có <select>, onChange, className.

export const FORMULA_CATEGORIES = [
  { id: 'all',       name: 'Tất cả',        Icon: 'IconBook'      },
  { id: 'dai_cuong', name: 'Đại cương',     Icon: 'IconFlask'     },
  { id: 'dung_dich', name: 'Dung dịch',     Icon: 'IconGraph'     },
  { id: 'dien_li',   name: 'Điện li',       Icon: 'IconAtom'      },
  { id: 'oxi_hoa',   name: 'Oxi hóa — Khử', Icon: 'IconReaction'  },
  { id: 'huu_co',    name: 'Hữu cơ',        Icon: 'IconBond'      },
  { id: 'kim_loai',  name: 'Kim loại',      Icon: 'IconBalance'   },
];

export const FORMULAS = [
  {
    id: 'n-m',
    name: 'Số mol theo khối lượng',
    formula: 'n = m / M',
    category: 'dai_cuong',
    grade: [10, 11, 12],
    symbols: [
      { s: 'n', name: 'Số mol chất',     unit: 'mol'   },
      { s: 'm', name: 'Khối lượng chất', unit: 'gam'   },
      { s: 'M', name: 'Khối lượng mol',  unit: 'g/mol' },
    ],
    example: {
      problem: 'Tính số mol của 5,6 gam Fe (M = 56 g/mol).',
      steps: [
        'Áp dụng công thức: n = m / M',
        'Thay số: n = 5,6 / 56',
        'Kết quả: n = 0,1 mol',
      ],
    },
    notes: 'Dùng khi biết khối lượng và khối lượng mol của chất.',
  },
  {
    id: 'n-V',
    name: 'Số mol khí ở điều kiện tiêu chuẩn',
    formula: 'n = V / 22,4',
    category: 'dai_cuong',
    grade: [10, 11, 12],
    symbols: [
      { s: 'n', name: 'Số mol khí',          unit: 'mol' },
      { s: 'V', name: 'Thể tích khí (đktc)', unit: 'lít' },
    ],
    example: {
      problem: 'Tính số mol của 4,48 lít khí H₂ ở đktc.',
      steps: [
        'Áp dụng: n = V / 22,4',
        'Thay số: n = 4,48 / 22,4',
        'Kết quả: n = 0,2 mol',
      ],
    },
    notes: 'Đktc: 0°C, 1 atm. Ở điều kiện thường (25°C, 1 atm) dùng 24 lít.',
  },
  {
    id: 'CM',
    name: 'Nồng độ mol',
    formula: 'C_M = n / V',
    category: 'dung_dich',
    grade: [10, 11, 12],
    symbols: [
      { s: 'C_M', name: 'Nồng độ mol',        unit: 'mol/lít' },
      { s: 'n',   name: 'Số mol chất tan',    unit: 'mol'     },
      { s: 'V',   name: 'Thể tích dung dịch', unit: 'lít'     },
    ],
    example: {
      problem: 'Hòa tan 0,2 mol NaCl vào 500 ml nước. Tính C_M.',
      steps: [
        'Đổi đơn vị: V = 500 ml = 0,5 lít',
        'Áp dụng: C_M = n / V',
        'Thay số: C_M = 0,2 / 0,5 = 0,4 M',
      ],
    },
  },
  {
    id: 'C%',
    name: 'Nồng độ phần trăm',
    formula: 'C% = (m_ct / m_dd) × 100',
    category: 'dung_dich',
    grade: [10, 11, 12],
    symbols: [
      { s: 'C%',   name: 'Nồng độ phần trăm',    unit: '%'   },
      { s: 'm_ct', name: 'Khối lượng chất tan',  unit: 'gam' },
      { s: 'm_dd', name: 'Khối lượng dung dịch', unit: 'gam' },
    ],
    notes: 'm_dd = m_ct + m_dung môi (thường là nước).',
  },
  {
    id: 'pH',
    name: 'Tính pH của dung dịch',
    formula: 'pH = −log[H⁺]',
    category: 'dien_li',
    grade: [11, 12],
    symbols: [
      { s: 'pH',   name: 'Độ pH',           unit: '' },
      { s: '[H⁺]', name: 'Nồng độ ion H⁺', unit: 'M' },
    ],
    example: {
      problem: 'Tính pH của dung dịch HCl 0,01M.',
      steps: [
        'HCl phân li hoàn toàn: [H⁺] = 0,01 M',
        'pH = −log(0,01) = 2',
      ],
    },
    notes: 'pH < 7: axit, pH = 7: trung tính, pH > 7: bazơ.',
  },
  {
    id: 'bao-toan-khoi-luong',
    name: 'Bảo toàn khối lượng',
    formula: 'm_tổng_trước = m_tổng_sau',
    category: 'oxi_hoa',
    grade: [10, 11, 12],
    symbols: [
      { s: 'm_trước', name: 'Tổng khối lượng chất tham gia', unit: 'gam' },
      { s: 'm_sau',   name: 'Tổng khối lượng sản phẩm',      unit: 'gam' },
    ],
    notes: 'Áp dụng cho mọi phản ứng hóa học. Rất hữu ích khi tính toán phản ứng có kết tủa hoặc khí bay ra.',
  },
  {
    id: 'hieu-suat',
    name: 'Hiệu suất phản ứng',
    formula: 'H = (m_tt / m_lt) × 100',
    category: 'dai_cuong',
    grade: [10, 11, 12],
    symbols: [
      { s: 'H',    name: 'Hiệu suất',            unit: '%'   },
      { s: 'm_tt', name: 'Khối lượng thực tế',   unit: 'gam' },
      { s: 'm_lt', name: 'Khối lượng lý thuyết', unit: 'gam' },
    ],
    notes: 'H ≤ 100%. Nếu đề cho hiệu suất < 100% thì khối lượng thực tế nhỏ hơn lý thuyết.',
  },
  {
    id: 'do-ruou',
    name: 'Độ rượu',
    formula: 'Độ rượu = (V_rượu / V_dd) × 100',
    category: 'huu_co',
    grade: [11, 12],
    symbols: [
      { s: 'V_rượu', name: 'Thể tích rượu nguyên chất', unit: 'ml' },
      { s: 'V_dd',   name: 'Thể tích dung dịch rượu',   unit: 'ml' },
    ],
    notes: 'Độ rượu là số ml rượu nguyên chất có trong 100 ml dung dịch.',
  },
  {
    id: 'khoi-luong-rieng',
    name: 'Khối lượng riêng',
    formula: 'D = m / V',
    category: 'dai_cuong',
    grade: [10, 11, 12],
    symbols: [
      { s: 'D', name: 'Khối lượng riêng', unit: 'g/ml' },
      { s: 'm', name: 'Khối lượng',        unit: 'gam'  },
      { s: 'V', name: 'Thể tích',          unit: 'ml'   },
    ],
    notes: 'Khối lượng riêng của nước là 1 g/ml ở 4°C.',
  },
];