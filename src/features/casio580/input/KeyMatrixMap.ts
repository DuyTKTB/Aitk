import { KeyDefinition } from '../types/key';
import { KeyAction } from '../types/events';
import { ModifierMode } from '../types/state';

/**
 * Danh mục 50 phím cứng chuẩn xác của Casio fx-580VN X
 * Trích xuất từ bảng tại VA 0x10004010 trong CLASSWIZ_P20.dll
 */
export const CASIO_KEYS: KeyDefinition[] = [
  // Hàng 1
  {
    index: 0,
    id: 'KEY_SHIFT',
    label: 'SHIFT',
    pcShortcut: 'q',
    matrixRow: 0x80,
    matrixCol: 0x01,
    x: 99,
    y: 479,
    w: 49,
    h: 49,
    group: 'func-top'
  },
  {
    index: 1,
    id: 'KEY_ALPHA',
    label: 'ALPHA',
    pcShortcut: 'Q',
    matrixRow: 0x80,
    matrixCol: 0x02,
    x: 169,
    y: 479,
    w: 49,
    h: 49,
    group: 'func-top'
  },
  {
    index: 4,
    id: 'KEY_UP',
    label: '▲',
    pcShortcut: 'E',
    matrixRow: 0x80,
    matrixCol: 0x04,
    x: 298,
    y: 478,
    w: 49,
    h: 49,
    group: 'dpad'
  },
  {
    index: 2,
    id: 'KEY_MENU',
    label: 'MENU',
    shiftLabel: 'SET UP',
    pcShortcut: 'w',
    matrixRow: 0x80,
    matrixCol: 0x10,
    x: 427,
    y: 479,
    w: 49,
    h: 49,
    group: 'func-top'
  },
  {
    index: 3,
    id: 'KEY_ON',
    label: 'ON',
    pcShortcut: 'W',
    matrixRow: 0x00,
    matrixCol: 0x00,
    x: 496,
    y: 479,
    w: 49,
    h: 49,
    group: 'func-top'
  },

  // Cụm D-Pad điều hướng
  {
    index: 6,
    id: 'KEY_LEFT',
    label: '◀',
    pcShortcut: '!',
    matrixRow: 0x40,
    matrixCol: 0x04,
    x: 236,
    y: 512,
    w: 49,
    h: 49,
    group: 'dpad'
  },
  {
    index: 7,
    id: 'KEY_RIGHT',
    label: '▶',
    pcShortcut: '$',
    matrixRow: 0x80,
    matrixCol: 0x08,
    x: 360,
    y: 512,
    w: 49,
    h: 49,
    group: 'dpad'
  },
  {
    index: 5,
    id: 'KEY_DOWN',
    label: '▼',
    pcShortcut: 'R',
    matrixRow: 0x40,
    matrixCol: 0x08,
    x: 298,
    y: 546,
    w: 49,
    h: 49,
    group: 'dpad'
  },

  // Hàng 2: OPTN, CALC, d/dx / Integral, x
  {
    index: 8,
    id: 'KEY_OPTN',
    label: 'OPTN',
    shiftLabel: 'QR',
    pcShortcut: 'T',
    matrixRow: 0x40,
    matrixCol: 0x01,
    x: 94,
    y: 575,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 9,
    id: 'KEY_CALC',
    label: 'CALC',
    shiftLabel: 'SOLVE',
    alphaLabel: '=',
    pcShortcut: 'r',
    matrixRow: 0x40,
    matrixCol: 0x02,
    x: 172,
    y: 575,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 10,
    id: 'KEY_INTEGRAL',
    label: '∫dx',
    shiftLabel: 'd/dx',
    alphaLabel: ':',
    pcShortcut: 'y',
    matrixRow: 0x40,
    matrixCol: 0x10,
    x: 406,
    y: 575,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 11,
    id: 'KEY_X',
    label: 'x',
    shiftLabel: 'Σ',
    pcShortcut: '[',
    matrixRow: 0x40,
    matrixCol: 0x20,
    x: 484,
    y: 575,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },

  // Hàng 3: Phân số, Căn, x^2, x^y, log_a(b), ln
  {
    index: 12,
    id: 'KEY_FRAC',
    label: 'a b/c',
    shiftLabel: 'd/c',
    pcShortcut: 'a',
    matrixRow: 0x20,
    matrixCol: 0x01,
    x: 94,
    y: 640,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 13,
    id: 'KEY_SQRT',
    label: '√',
    shiftLabel: '3√',
    pcShortcut: 's',
    matrixRow: 0x20,
    matrixCol: 0x02,
    x: 172,
    y: 640,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 14,
    id: 'KEY_SQUARE',
    label: 'x²',
    shiftLabel: 'x³',
    pcShortcut: 'd',
    matrixRow: 0x20,
    matrixCol: 0x04,
    x: 250,
    y: 640,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 15,
    id: 'KEY_POWER',
    label: 'x^■',
    shiftLabel: '■√',
    pcShortcut: '^',
    matrixRow: 0x20,
    matrixCol: 0x08,
    x: 329,
    y: 640,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 16,
    id: 'KEY_LOG_AB',
    label: 'log■□',
    pcShortcut: 'i',
    matrixRow: 0x20,
    matrixCol: 0x10,
    x: 406,
    y: 640,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 17,
    id: 'KEY_LN',
    label: 'ln',
    shiftLabel: 'e^■',
    pcShortcut: 'h',
    matrixRow: 0x20,
    matrixCol: 0x20,
    x: 484,
    y: 640,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },

  // Hàng 4: (-), ''", x^-1, sin, cos, tan
  {
    index: 18,
    id: 'KEY_NEG',
    label: '(-)',
    alphaLabel: 'A',
    pcShortcut: 'z',
    matrixRow: 0x10,
    matrixCol: 0x01,
    x: 94,
    y: 706,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 19,
    id: 'KEY_DEGREE',
    label: '° \' "',
    shiftLabel: 'FACT',
    alphaLabel: 'B',
    pcShortcut: 'x',
    matrixRow: 0x10,
    matrixCol: 0x02,
    x: 172,
    y: 706,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 20,
    id: 'KEY_RECIPROCAL',
    label: 'x⁻¹',
    shiftLabel: 'x!',
    alphaLabel: 'C',
    pcShortcut: 'u',
    matrixRow: 0x10,
    matrixCol: 0x04,
    x: 250,
    y: 706,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 21,
    id: 'KEY_SIN',
    label: 'sin',
    shiftLabel: 'sin⁻¹',
    alphaLabel: 'D',
    pcShortcut: 'j',
    matrixRow: 0x10,
    matrixCol: 0x08,
    x: 329,
    y: 706,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 22,
    id: 'KEY_COS',
    label: 'cos',
    shiftLabel: 'cos⁻¹',
    alphaLabel: 'E',
    pcShortcut: 'k',
    matrixRow: 0x10,
    matrixCol: 0x10,
    x: 406,
    y: 706,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },
  {
    index: 23,
    id: 'KEY_TAN',
    label: 'tan',
    shiftLabel: 'tan⁻¹',
    alphaLabel: 'F',
    pcShortcut: 'l',
    matrixRow: 0x10,
    matrixCol: 0x20,
    x: 484,
    y: 706,
    w: 68,
    h: 40,
    group: 'func-scientific'
  },

  // Hàng 5: STO, ENG, (, ), S<=>D, M+
  {
    index: 24,
    id: 'KEY_STO',
    label: 'STO',
    shiftLabel: 'RECALL',
    pcShortcut: 'J',
    matrixRow: 0x08,
    matrixCol: 0x01,
    x: 94,
    y: 772,
    w: 68,
    h: 40,
    group: 'func-mid'
  },
  {
    index: 25,
    id: 'KEY_ENG',
    label: 'ENG',
    shiftLabel: '←',
    alphaLabel: 'i',
    pcShortcut: 'b',
    matrixRow: 0x08,
    matrixCol: 0x02,
    x: 172,
    y: 772,
    w: 68,
    h: 40,
    group: 'func-mid'
  },
  {
    index: 26,
    id: 'KEY_LPAREN',
    label: '(',
    shiftLabel: '%',
    pcShortcut: '(',
    matrixRow: 0x08,
    matrixCol: 0x04,
    x: 250,
    y: 772,
    w: 68,
    h: 40,
    group: 'func-mid'
  },
  {
    index: 27,
    id: 'KEY_RPAREN',
    label: ')',
    shiftLabel: ',',
    alphaLabel: 'x',
    pcShortcut: ')',
    matrixRow: 0x08,
    matrixCol: 0x08,
    x: 329,
    y: 772,
    w: 68,
    h: 40,
    group: 'func-mid'
  },
  {
    index: 28,
    id: 'KEY_SD',
    label: 'S⇔D',
    alphaLabel: 'y',
    pcShortcut: 'n',
    matrixRow: 0x08,
    matrixCol: 0x10,
    x: 406,
    y: 772,
    w: 68,
    h: 40,
    group: 'func-mid'
  },
  {
    index: 29,
    id: 'KEY_M_PLUS',
    label: 'M+',
    shiftLabel: 'M-',
    alphaLabel: 'M',
    pcShortcut: 'm',
    matrixRow: 0x08,
    matrixCol: 0x20,
    x: 484,
    y: 772,
    w: 68,
    h: 40,
    group: 'func-mid'
  },

  // Hàng 6 (Khối số): 7, 8, 9, DEL, AC
  {
    index: 30,
    id: 'KEY_7',
    label: '7',
    shiftLabel: 'CONST',
    pcShortcut: '7',
    matrixRow: 0x04,
    matrixCol: 0x01,
    x: 96,
    y: 841,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 31,
    id: 'KEY_8',
    label: '8',
    shiftLabel: 'CONV',
    pcShortcut: '8',
    matrixRow: 0x04,
    matrixCol: 0x02,
    x: 189,
    y: 841,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 32,
    id: 'KEY_9',
    label: '9',
    shiftLabel: 'RESET',
    pcShortcut: '9',
    matrixRow: 0x04,
    matrixCol: 0x04,
    x: 282,
    y: 841,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 33,
    id: 'KEY_DEL',
    label: 'DEL',
    shiftLabel: 'INS',
    pcShortcut: 'o',
    matrixRow: 0x04,
    matrixCol: 0x08,
    x: 375,
    y: 841,
    w: 80,
    h: 56,
    group: 'keypad-action'
  },
  {
    index: 34,
    id: 'KEY_AC',
    label: 'AC',
    shiftLabel: 'OFF',
    pcShortcut: 'C',
    matrixRow: 0x04,
    matrixCol: 0x10,
    x: 468,
    y: 841,
    w: 80,
    h: 56,
    group: 'keypad-action'
  },

  // Hàng 7: 4, 5, 6, *, /
  {
    index: 35,
    id: 'KEY_4',
    label: '4',
    shiftLabel: 'MATRIX',
    pcShortcut: '4',
    matrixRow: 0x02,
    matrixCol: 0x01,
    x: 96,
    y: 921,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 36,
    id: 'KEY_5',
    label: '5',
    shiftLabel: 'VECTOR',
    pcShortcut: '5',
    matrixRow: 0x02,
    matrixCol: 0x02,
    x: 189,
    y: 921,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 37,
    id: 'KEY_6',
    label: '6',
    pcShortcut: '6',
    matrixRow: 0x02,
    matrixCol: 0x04,
    x: 282,
    y: 921,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 38,
    id: 'KEY_MUL',
    label: '×',
    shiftLabel: 'nPr',
    pcShortcut: 'O',
    matrixRow: 0x02,
    matrixCol: 0x08,
    x: 375,
    y: 921,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 39,
    id: 'KEY_DIV',
    label: '÷',
    shiftLabel: 'nCr',
    pcShortcut: 'P',
    matrixRow: 0x02,
    matrixCol: 0x10,
    x: 468,
    y: 921,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },

  // Hàng 8: 1, 2, 3, +, -
  {
    index: 40,
    id: 'KEY_1',
    label: '1',
    shiftLabel: 'STAT',
    pcShortcut: '1',
    matrixRow: 0x01,
    matrixCol: 0x01,
    x: 96,
    y: 1001,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 41,
    id: 'KEY_2',
    label: '2',
    shiftLabel: 'COMPLEX',
    pcShortcut: '2',
    matrixRow: 0x01,
    matrixCol: 0x02,
    x: 189,
    y: 1001,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 42,
    id: 'KEY_3',
    label: '3',
    shiftLabel: 'BASE',
    pcShortcut: '3',
    matrixRow: 0x01,
    matrixCol: 0x04,
    x: 282,
    y: 1001,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 43,
    id: 'KEY_ADD',
    label: '+',
    shiftLabel: 'Pol',
    pcShortcut: '+',
    matrixRow: 0x01,
    matrixCol: 0x08,
    x: 375,
    y: 1001,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 44,
    id: 'KEY_SUB',
    label: '−',
    shiftLabel: 'Rec',
    pcShortcut: 'p',
    matrixRow: 0x01,
    matrixCol: 0x10,
    x: 468,
    y: 1001,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },

  // Hàng 9: 0, ., *10^x, Ans, =
  {
    index: 45,
    id: 'KEY_0',
    label: '0',
    shiftLabel: 'Rnd',
    pcShortcut: '0',
    matrixRow: 0x10,
    matrixCol: 0x40,
    x: 96,
    y: 1081,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 46,
    id: 'KEY_DOT',
    label: '.',
    shiftLabel: 'Ran#',
    alphaLabel: 'RanInt',
    pcShortcut: '.',
    matrixRow: 0x08,
    matrixCol: 0x40,
    x: 189,
    y: 1081,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 47,
    id: 'KEY_EXP',
    label: '×10ⁿ',
    shiftLabel: 'π',
    alphaLabel: 'e',
    pcShortcut: 'K',
    matrixRow: 0x04,
    matrixCol: 0x40,
    x: 282,
    y: 1081,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 48,
    id: 'KEY_ANS',
    label: 'Ans',
    shiftLabel: '%',
    alphaLabel: 'PreAns',
    pcShortcut: 'M',
    matrixRow: 0x02,
    matrixCol: 0x40,
    x: 375,
    y: 1081,
    w: 80,
    h: 56,
    group: 'keypad-num'
  },
  {
    index: 49,
    id: 'KEY_EQUALS',
    label: '=',
    pcShortcut: '=',
    matrixRow: 0x01,
    matrixCol: 0x40,
    x: 468,
    y: 1081,
    w: 80,
    h: 56,
    group: 'keypad-action'
  }
];

/** Map tra cứu nhanh theo ID */
export const KEY_BY_ID = new Map<string, KeyDefinition>(
  CASIO_KEYS.map((k) => [k.id, k])
);

/** Map tra cứu nhanh theo PC Shortcut (chữ cái từ classwiz_p20.dll) */
export const KEY_BY_SHORTCUT = new Map<string, KeyDefinition>(
  CASIO_KEYS.map((k) => [k.pcShortcut, k])
);

/**
 * Hàm phân giải hành động tương ứng với phím bấm và trạng thái modifier
 */
export function resolveKeyAction(key: KeyDefinition, modifier: ModifierMode): KeyAction {
  // 1. Phím chuyển trạng thái (SHIFT / ALPHA)
  if (key.id === 'KEY_SHIFT') {
    return { type: 'MODIFIER', value: 'SHIFT', label: 'SHIFT' };
  }
  if (key.id === 'KEY_ALPHA') {
    return { type: 'MODIFIER', value: 'ALPHA', label: 'ALPHA' };
  }

  // 2. Phím điều hướng
  if (key.id === 'KEY_UP') return { type: 'NAV', value: 'UP', label: '▲' };
  if (key.id === 'KEY_DOWN') return { type: 'NAV', value: 'DOWN', label: '▼' };
  if (key.id === 'KEY_LEFT') return { type: 'NAV', value: 'LEFT', label: '◀' };
  if (key.id === 'KEY_RIGHT') return { type: 'NAV', value: 'RIGHT', label: '▶' };

  // 3. Phím hệ thống
  if (key.id === 'KEY_AC') return { type: 'SYSTEM', value: 'AC', label: 'AC' };
  if (key.id === 'KEY_DEL') return { type: 'SYSTEM', value: 'DEL', label: 'DEL' };
  if (key.id === 'KEY_ON') return { type: 'SYSTEM', value: 'ON', label: 'ON' };
  if (key.id === 'KEY_MENU') return { type: 'SYSTEM', value: modifier === 'SHIFT' ? 'SETUP' : 'MENU', label: 'MENU' };
  if (key.id === 'KEY_EQUALS') return { type: 'EXECUTE', value: '=', label: '=' };

  // 4. Khi đang ở chế độ SHIFT
  if (modifier === 'SHIFT') {
    if (key.id === 'KEY_EXP') return { type: 'CHAR', value: 'π', label: 'π' };
    if (key.id === 'KEY_SIN') return { type: 'FUNCTION', value: 'sin⁻¹(', label: 'sin⁻¹' };
    if (key.id === 'KEY_COS') return { type: 'FUNCTION', value: 'cos⁻¹(', label: 'cos⁻¹' };
    if (key.id === 'KEY_TAN') return { type: 'FUNCTION', value: 'tan⁻¹(', label: 'tan⁻¹' };
    if (key.id === 'KEY_RECIPROCAL') return { type: 'FUNCTION', value: '!', label: 'x!' };
    if (key.id === 'KEY_SQUARE') return { type: 'CHAR', value: '³', label: 'x³' };
    if (key.id === 'KEY_POWER') return { type: 'FUNCTION', value: 'root(', label: '■√' };
    if (key.id === 'KEY_LN') return { type: 'FUNCTION', value: 'e^(', label: 'e^■' };
    if (key.id === 'KEY_INTEGRAL') return { type: 'FUNCTION', value: 'diff(', label: 'd/dx' };
    if (key.id === 'KEY_X') return { type: 'FUNCTION', value: 'sum(', label: 'Σ' };
    if (key.id === 'KEY_MUL') return { type: 'CHAR', value: 'P', label: 'nPr' };
    if (key.id === 'KEY_DIV') return { type: 'CHAR', value: 'C', label: 'nCr' };
    if (key.id === 'KEY_M_PLUS') return { type: 'SYSTEM', value: 'M-', label: 'M-' };
    if (key.id === 'KEY_9') return { type: 'SYSTEM', value: 'RESET', label: 'RESET' };
  }

  // 5. Khi đang ở chế độ ALPHA
  if (modifier === 'ALPHA') {
    if (key.alphaLabel) {
      return { type: 'CHAR', value: key.alphaLabel, label: key.alphaLabel };
    }
  }

  // 6. Chế độ NORMAL mặc định
  switch (key.id) {
    case 'KEY_0': case 'KEY_1': case 'KEY_2': case 'KEY_3': case 'KEY_4':
    case 'KEY_5': case 'KEY_6': case 'KEY_7': case 'KEY_8': case 'KEY_9':
      return { type: 'CHAR', value: key.label, label: key.label };
    case 'KEY_DOT': return { type: 'CHAR', value: '.', label: '.' };
    case 'KEY_ADD': return { type: 'CHAR', value: '+', label: '+' };
    case 'KEY_SUB': return { type: 'CHAR', value: '−', label: '−' };
    case 'KEY_MUL': return { type: 'CHAR', value: '×', label: '×' };
    case 'KEY_DIV': return { type: 'CHAR', value: '÷', label: '÷' };
    case 'KEY_LPAREN': return { type: 'CHAR', value: '(', label: '(' };
    case 'KEY_RPAREN': return { type: 'CHAR', value: ')', label: ')' };
    case 'KEY_NEG': return { type: 'CHAR', value: '-', label: '(-)' };
    case 'KEY_ANS': return { type: 'CHAR', value: 'Ans', label: 'Ans' };
    case 'KEY_EXP': return { type: 'CHAR', value: '×10^', label: '×10ⁿ' };
    case 'KEY_FRAC': return { type: 'BLOCK', value: 'FRAC', label: 'a b/c' };
    case 'KEY_SQRT': return { type: 'FUNCTION', value: '√(', label: '√' };
    case 'KEY_SQUARE': return { type: 'CHAR', value: '²', label: 'x²' };
    case 'KEY_POWER': return { type: 'CHAR', value: '^', label: 'x^■' };
    case 'KEY_SIN': return { type: 'FUNCTION', value: 'sin(', label: 'sin' };
    case 'KEY_COS': return { type: 'FUNCTION', value: 'cos(', label: 'cos' };
    case 'KEY_TAN': return { type: 'FUNCTION', value: 'tan(', label: 'tan' };
    case 'KEY_LN': return { type: 'FUNCTION', value: 'ln(', label: 'ln' };
    case 'KEY_LOG_AB': return { type: 'FUNCTION', value: 'log(', label: 'log' };
    case 'KEY_SD': return { type: 'SYSTEM', value: 'SD_TOGGLE', label: 'S⇔D' };
    case 'KEY_M_PLUS': return { type: 'SYSTEM', value: 'M+', label: 'M+' };
    case 'KEY_STO': return { type: 'SYSTEM', value: 'STO', label: 'STO' };
    case 'KEY_ENG': return { type: 'SYSTEM', value: 'ENG', label: 'ENG' };
    case 'KEY_OPTN': return { type: 'SYSTEM', value: 'OPTN', label: 'OPTN' };
    case 'KEY_CALC': return { type: 'SYSTEM', value: 'CALC', label: 'CALC' };
    case 'KEY_INTEGRAL': return { type: 'FUNCTION', value: '∫(', label: '∫dx' };
    case 'KEY_X': return { type: 'CHAR', value: 'x', label: 'x' };
    case 'KEY_DEGREE': return { type: 'CHAR', value: '°', label: '° \' "' };
    default:
      return { type: 'CHAR', value: key.label, label: key.label };
  }
}
