import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const TARGET_ZALO_GROUP_URL = 'https://zalo.me/g/xbmme5srjzwbuvasu25u';
export const OFFICIAL_YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@ELECAI-idvn';

export const OFFICIAL_VIDEOS = {
  tronDeWord: {
    title: 'Cách Trộn Đề Thi Từ File Word Chuẩn 3 Phần GDPT 2018 & Xuất ZIP In A4 Trong 1 Phút',
    url: 'https://www.youtube.com/watch?v=ng6c7RdvLqw',
  },
  aiTaoDe: {
    title: 'AI Tạo Đề Thi 3 Phần Chuẩn THPT 2025 & Giao Đề Ôn Phụ Đạo Cho Học Sinh Dưới 5.0',
    url: 'https://www.youtube.com/watch?v=nzSoVddOf9s',
  },
};

export const BANK_INFO = {
  bankName: 'MBBANK (Ngân hàng Quân Đội)',
  accountNo: '999988882010',
  accountName: 'NGUYEN THE DUY',
  teacherPrefix: 'ELECAI PRO',
  studentPrefix: 'ELECAI VIP',
};

export const PRICING_CATALOG = {
  teacher: [
    { id: 'gv-1m', label: '1 tháng', price: '399.000đ', note: 'Tặng 100 Credit AI' },
    { id: 'gv-6m', label: '6 tháng', price: '1.990.000đ', note: 'Tiết kiệm 17%, tặng 350 Credit AI' },
    { id: 'gv-12m', label: '12 tháng', price: '3.590.000đ', note: 'Tiết kiệm 25%, tặng 800 Credit AI' },
  ],
  student: [
    { id: 'hs-1m', label: '1 tháng', price: '199.000đ', note: 'Tặng 60 Credit AI' },
    { id: 'hs-3m', label: '3 tháng', price: '399.000đ', note: 'Tiết kiệm 33%, tặng 150 Credit AI' },
    { id: 'hs-6m', label: '6 tháng', price: '699.000đ', note: 'Tiết kiệm 41%, tặng 320 Credit AI' },
    { id: 'hs-12m', label: '12 tháng', price: '999.000đ', note: 'Tiết kiệm 58%, tặng 700 Credit AI' },
  ],
};

export const DEFAULT_WELCOME_TEMPLATE = [
  'Chào mừng Thầy/Cô {name} đã tham gia Nhóm Giáo Viên ELEC AI! 👋',
  '',
  'Em là Trợ lý Hỗ trợ ELEC AI. Thầy/Cô có thể gõ !menu để xem nhanh hướng dẫn hoặc hỏi trực tiếp trong nhóm về:',
  '• Trộn đề Word 3 phần GDPT 2018 & Xuất ZIP A4: ' + OFFICIAL_VIDEOS.tronDeWord.url,
  '• AI Tạo đề THPT 2025 & Giao đề phụ đạo HS dưới 5.0: ' + OFFICIAL_VIDEOS.aiTaoDe.url,
  '• Chấm phiếu OMR A4 & Bảng giá Gói Giáo Viên VIP (!gia)',
  '',
  'Chúc Thầy/Cô trải nghiệm hiệu quả cùng ELEC AI!',
].join('\n');

export const MENU_TEXT = [
  '📌 MENU HỖ TRỢ NHANH — ELEC AI',
  'Thầy/Cô có thể gõ các lệnh sau hoặc nhắn trực tiếp câu hỏi:',
  '• !tronde — Hướng dẫn Trộn đề Word 3 phần & Xuất ZIP in A4',
  '• !taode — Hướng dẫn AI Tạo đề THPT 2025 & Giao bài phụ đạo',
  '• !omr — Hướng dẫn chấm phiếu trắc nghiệm A4 (OMR)',
  '• !gia — Bảng giá Gói Giáo Viên VIP & Học Sinh VIP',
  '• !stk — Thông tin chuyển khoản & kích hoạt VIP',
  '• !video — Kênh YouTube & Video hướng dẫn chính thức',
  '• /ai <câu hỏi> — Hỏi trực tiếp Trợ lý AI ELEC',
  '',
  `📺 Kênh YouTube: ${OFFICIAL_YOUTUBE_CHANNEL_URL}`,
].join('\n');

export const VIDEOS_TEXT = [
  '📺 VIDEO HƯỚNG DẪN CHÍNH THỨC ELEC AI',
  `1) ${OFFICIAL_VIDEOS.tronDeWord.title}:`,
  `   ▶ ${OFFICIAL_VIDEOS.tronDeWord.url}`,
  `2) ${OFFICIAL_VIDEOS.aiTaoDe.title}:`,
  `   ▶ ${OFFICIAL_VIDEOS.aiTaoDe.url}`,
  `📌 Kênh YouTube: ${OFFICIAL_YOUTUBE_CHANNEL_URL}`,
].join('\n');

export const DEFAULT_FAQ_RULES = [
  {
    id: 'cho-duyet-vip',
    title: 'Xác nhận chuyển khoản / Chờ duyệt VIP',
    enabled: true,
    notifyAdmin: true,
    keywords: [
      'đã chuyển khoản',
      'vừa chuyển khoản',
      'mới chuyển khoản',
      'đã ck',
      'vừa ck',
      'chưa lên vip',
      'chưa lên pro',
      'kích hoạt giúp',
      'duyệt giúp',
      'chưa được nâng cấp',
      'lỗi thanh toán',
    ],
    reply: [
      'Em đã ghi nhận thông tin và chuyển ngay thông báo tới Admin để kiểm tra kích hoạt cho Thầy/Cô ạ!',
      'Để Admin duyệt nhanh nhất, Thầy/Cô vui lòng nhắn kèm trong nhóm:',
      '1️⃣ Ảnh biên lai chuyển khoản (nếu chưa gửi)',
      '2️⃣ Email đăng nhập hoặc Mã định danh tài khoản (ví dụ: ELECAI-XXXXXX)',
      'Admin sẽ kiểm tra và nâng cấp trong vài phút ạ.',
    ].join('\n'),
  },
  {
    id: 'tron-de-word',
    title: 'Trộn đề Word 3 phần & Xuất ZIP A4',
    enabled: true,
    notifyAdmin: false,
    keywords: [
      'trộn đề',
      'file word',
      'docx',
      'xuất zip',
      'in a4',
      'đảo đề',
      'đảo mã đề',
    ],
    reply: [
      '📄 HƯỚNG DẪN TRỘN ĐỀ WORD CHUẨN 3 PHẦN GDPT 2018:',
      '1. Vào bảng điều khiển Giáo viên -> Chọn mục Trộn đề / Nhập file Word (.docx).',
      '2. Tải lên đề gốc theo cấu trúc 3 phần (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn).',
      '3. Chọn số lượng mã đề cần đảo -> Bấm Xuất trọn bộ ZIP in ấn A4 kèm bảng đáp án.',
      `▶ Xem video hướng dẫn chi tiết (1 phút): ${OFFICIAL_VIDEOS.tronDeWord.url}`,
    ].join('\n'),
  },
  {
    id: 'ai-tao-de',
    title: 'AI Tạo đề THPT 2025 & Giao bài phụ đạo',
    enabled: true,
    notifyAdmin: false,
    keywords: [
      'tạo đề',
      'ai tạo đề',
      'soạn đề',
      'ma trận',
      'phụ đạo',
      'dưới 5.0',
      'autoexam',
    ],
    reply: [
      '✨ HƯỚNG DẪN AI TẠO ĐỀ 3 PHẦN & GIAO PHỤ ĐẠO:',
      '1. Mở AutoExam AI Studio -> Chọn môn/khối và ma trận chuẩn THPT 2025 (3 phần).',
      '2. AI tự động sinh đề thi kèm lời giải chi tiết, có thể chỉnh sửa hoặc tách đề từ PDF/Ảnh.',
      '3. Giao bài về lớp hoặc tự động lọc nhóm học sinh dưới 5.0 để giao đề ôn phụ đạo.',
      `▶ Xem video hướng dẫn (1p30): ${OFFICIAL_VIDEOS.aiTaoDe.url}`,
    ].join('\n'),
  },
  {
    id: 'cham-omr',
    title: 'Chấm phiếu trắc nghiệm OMR A4',
    enabled: true,
    notifyAdmin: false,
    keywords: [
      'chấm phiếu',
      'omr',
      'chấm điểm',
      'phiếu trả lời',
      'chấm a4',
      'quét phiếu',
    ],
    reply: [
      '📷 HƯỚNG DẪN CHẤM PHIẾU OMR A4 TRÊN ELEC AI:',
      '1. Tải mẫu phiếu tô đáp án A4 chuẩn 3 phần ngay trong mục Chấm OMR.',
      '2. Dùng camera điện thoại/máy tính hoặc tải ảnh chụp bài làm của học sinh lên hệ thống.',
      '3. Hệ thống tự động nhận diện mã đề, chấm điểm tức thì và xuất bảng điểm Excel.',
      '💡 Bản Free dùng thử 5 tờ OMR; Gói Giáo Viên VIP không giới hạn số lượt chấm.',
    ].join('\n'),
  },
  {
    id: 'bang-gia-vip',
    title: 'Bảng giá Gói Giáo Viên VIP & Học Sinh VIP',
    enabled: true,
    notifyAdmin: false,
    keywords: [
      'bảng giá',
      'giá gói',
      'mua gói',
      'gói vip',
      'gói giáo viên',
      'gói pro',
      'bao nhiêu tiền',
      'nâng cấp',
      'gia hạn',
    ],
    reply: [
      '👑 BẢNG GIÁ CHÍNH THỨC ELEC AI:',
      '• Gói Giáo Viên VIP (PRO):',
      '  - 1 tháng: 399.000đ (Tặng 100 Credit AI)',
      '  - 6 tháng: 1.990.000đ (Tiết kiệm 17%, tặng 350 Credit AI)',
      '  - 12 tháng: 3.590.000đ (Tiết kiệm 25%, tặng 800 Credit AI)',
      '  ✅ Quyền lợi GV VIP: Không giới hạn lớp/sĩ số, không giới hạn trộn đề Word & tạo đề thủ công, mở khóa AI Tạo Đề theo ma trận, tách đề PDF/Ảnh OCR, chấm OMR A4 không giới hạn, giám sát thi LIVE Proctor.',
      '• Gói Học Sinh VIP:',
      '  - 1 tháng: 199.000đ | 3 tháng: 399.000đ | 6 tháng: 699.000đ | 12 tháng: 999.000đ.',
      'Gõ !stk để xem thông tin chuyển khoản nhanh ạ.',
    ].join('\n'),
  },
  {
    id: 'thanh-toan-ck',
    title: 'Hướng dẫn chuyển khoản & kích hoạt VIP',
    enabled: true,
    notifyAdmin: false,
    keywords: [
      'chuyển khoản',
      'thanh toán',
      'số tài khoản',
      'stk',
      'mbbank',
      'vietqr',
      'tài khoản ngân hàng',
    ],
    reply: [
      '💳 THÔNG TIN THANH TOÁN & KÍCH HOẠT TỰ ĐỘNG:',
      `• Ngân hàng: ${BANK_INFO.bankName}`,
      `• Số tài khoản: ${BANK_INFO.accountNo}`,
      `• Chủ tài khoản: ${BANK_INFO.accountName}`,
      '• Nội dung CK: ELECAI PRO <Mã tài khoản> (Giáo viên) hoặc ELECAI VIP <Mã tài khoản> (Học sinh).',
      '👉 Thầy/Cô vào mục "Nâng cấp VIP" trên web ELEC AI để quét mã VietQR — hệ thống tự động kích hoạt sau 15–30 giây. Hoặc gửi ảnh biên lai + Email vào nhóm để Admin hỗ trợ duyệt ngay ạ.',
    ].join('\n'),
  },
];

export function normalizeText(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

const ELEC_CONTEXT_HINTS = [
  'elec',
  'tron de',
  'tao de',
  'soan de',
  'word',
  'docx',
  'omr',
  'cham phieu',
  'cham bai',
  'cham diem',
  'giao bai',
  'giao de',
  'phu dao',
  'lop hoc',
  'hoc sinh',
  'giao vien',
  'tai khoan',
  'dang nhap',
  'otp',
  'vip',
  'pro',
  'credit',
  'nang cap',
  'thanh toan',
  'chuyen khoan',
  'gia han',
  'ma de',
  'xuat zip',
  'in a4',
  'pdf',
  'ocr',
  'proctor',
  'giam sat',
  'ngan hang cau hoi',
  'voucher',
  'ma giam gia',
  'link',
  'web',
  'app',
  'loi',
  'khong vao duoc',
  'huong dan',
  'cach dung',
  'lam sao',
  'the nao',
];

export function looksLikeQuestionForSupport(rawText = '') {
  const raw = String(rawText || '').trim();
  const norm = normalizeText(raw);
  if (norm.length < 8) return false;

  const hasElecCue = ELEC_CONTEXT_HINTS.some((kw) => norm.includes(kw));
  const hasQuestionCue =
    raw.includes('?') ||
    /\b(hoi|cho hoi|lam sao|cach|the nao|huong dan|bao nhieu|khong duoc|bi loi|tai sao|giup|ho tro|tu van)\b/.test(norm);

  return hasElecCue && (hasQuestionCue || norm.length >= 18);
}

/* ============================================================
   NẠP KHÓA AI TỪ .env & XOAY VÒNG KEY (GIỐNG api/ai-chat.js)
   ============================================================ */
let cachedEnvMap = null;

export function loadDotEnv(force = false) {
  if (cachedEnvMap && !force) return cachedEnvMap;
  const envMap = {};
  for (const [k, v] of Object.entries(process.env || {})) {
    if (v !== undefined) envMap[k] = String(v);
  }
  const envPath = path.join(REPO_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!envMap[key]) envMap[key] = val;
    }
  }
  cachedEnvMap = envMap;
  return envMap;
}

const PROVIDER_ENV_RE = {
  gemini: /^(?:VITE_)?GEMINI(?:_API)?_KEY$/i,
  groq: /^(?:VITE_)?GROQ(?:_API)?_KEY$/i,
  agnes: /^(?:VITE_)?AGNES(?:_API)?_KEY$/i,
};

export function collectProviderKeys(provider) {
  const re = PROVIDER_ENV_RE[provider];
  if (!re) return [];
  const envMap = loadDotEnv();
  const keys = [];
  for (const [envName, rawVal] of Object.entries(envMap)) {
    if (!rawVal || !re.test(envName)) continue;
    String(rawVal)
      .split(/[\s,;|]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((k) => {
        if (!keys.includes(k)) keys.push(k);
      });
  }
  return keys;
}

export function getAiKeyStats() {
  return {
    gemini: collectProviderKeys('gemini').length,
    groq: collectProviderKeys('groq').length,
    agnes: collectProviderKeys('agnes').length,
  };
}

export function getZaloBotEnvConfig() {
  const envMap = loadDotEnv();
  return {
    botToken: String(envMap.ZALO_BOT_TOKEN || '').trim(),
    webhookSecret: String(envMap.ZALO_WEBHOOK_SECRET || '').trim(),
  };
}

function buildSystemPrompt() {
  return [
    'Bạn là Trợ lý Hỗ trợ Khách hàng chính thức của nền tảng ELEC Science AI (https://elecai.id.vn) trong Nhóm Zalo Giáo viên.',
    'Phong cách trả lời:',
    '- Xưng "em" (hoặc "Trợ lý ELEC AI"), gọi thành viên trong nhóm là "Thầy/Cô" hoặc "Anh/Chị" một cách lịch sự, thân thiện, thực tế.',
    '- Trả lời ngắn gọn (tối đa khoảng 150-180 từ), rõ ý bằng gạch đầu dòng để dễ đọc trên điện thoại Zalo.',
    '- Không dùng ký tự Markdown (như **, ##, ```), trình bày bằng văn bản thuần tự nhiên trên Zalo.',
    '- TUYỆT ĐỐI KHÔNG tự bịa giá tiền, số tài khoản hoặc tính năng không có trong dữ liệu dưới đây.',
    '- Nếu khách hỏi vấn đề cần kiểm tra tài khoản cụ thể (lỗi đăng nhập, đã chuyển khoản chưa lên VIP), nhắc khách gửi Email/Mã định danh ELECAI-XXXXXX để Admin hỗ trợ.',
    '',
    'DỮ LIỆU CHÍNH THỨC ELEC AI:',
    `1. Kênh & Nhóm chính thức: Nhóm Zalo Giáo viên (${TARGET_ZALO_GROUP_URL}) | YouTube (${OFFICIAL_YOUTUBE_CHANNEL_URL})`,
    `2. Video Trộn đề Word 3 phần GDPT 2018 & Xuất ZIP in A4 (1 phút): ${OFFICIAL_VIDEOS.tronDeWord.url}`,
    `3. Video AI Tạo đề 3 phần THPT 2025 & Giao đề phụ đạo HS dưới 5.0 (1p30): ${OFFICIAL_VIDEOS.aiTaoDe.url}`,
    '4. Tính năng chính của ELEC AI:',
    '   - Trộn đề từ file Word (.docx) chuẩn 3 phần (TN nhiều lựa chọn, Đúng/Sai, Trả lời ngắn) và xuất ZIP in A4.',
    '   - AutoExam AI Studio: AI tạo đề theo ma trận THPT 2025, tách đề từ PDF/Ảnh OCR, tự động giao đề ôn phụ đạo cho học sinh dưới 5.0.',
    '   - Chấm phiếu trắc nghiệm OMR A4 bằng camera/ảnh chụp và xuất bảng điểm Excel.',
    '   - Quản lý lớp học, giám sát phòng thi trực tuyến (LIVE Proctor), ngân hàng câu hỏi KHTN/Toán.',
    '   - Bản Free Giáo viên: tối đa 1 lớp / 40 HS, 30 đề, 10 lần nhập Word, 30 lần tạo thủ công, 5 tờ chấm OMR thử.',
    '5. Bảng giá Gói Giáo Viên VIP (PRO):',
    '   - 1 tháng: 399.000đ (tặng 100 Credit AI)',
    '   - 6 tháng: 1.990.000đ (tiết kiệm 17%, tặng 350 Credit AI)',
    '   - 12 tháng: 3.590.000đ (tiết kiệm 25%, tặng 800 Credit AI)',
    '6. Bảng giá Gói Học Sinh VIP:',
    '   - 1 tháng: 199.000đ | 3 tháng: 399.000đ | 6 tháng: 699.000đ | 12 tháng: 999.000đ',
    '7. Thanh toán & Kích hoạt:',
    `   - Ngân hàng ${BANK_INFO.bankName} | STK: ${BANK_INFO.accountNo} | Chủ TK: ${BANK_INFO.accountName}`,
    '   - Nội dung CK: ELECAI PRO <Mã tài khoản> (GV) hoặc ELECAI VIP <Mã tài khoản> (HS). Quét VietQR trên web tự động kích hoạt sau 15-30 giây.',
  ].join('\n');
}

async function callGemini(apiKey, model, systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 600,
      },
    }),
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const reply = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p?.text || '')
    .join('')
    .trim();
  if (!reply) throw new Error('Gemini returned empty response');
  return reply;
}

async function callOpenAICompat(endpoint, apiKey, model, systemPrompt, userPrompt) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('OpenAI-compatible endpoint returned empty response');
  return reply;
}

export async function askElecSupportAI(question, { senderName = 'Thầy/Cô' } = {}) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Thành viên "${senderName}" hỏi trong nhóm Zalo: ${question}`;

  const plans = [
    {
      provider: 'gemini',
      models: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'],
      call: callGemini,
    },
    {
      provider: 'groq',
      models: ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile'],
      call: (key, model, sys, usr) =>
        callOpenAICompat('https://api.groq.com/openai/v1/chat/completions', key, model, sys, usr),
    },
    {
      provider: 'agnes',
      models: ['agnes-3.0-flash', 'agnes-2.5-flash'],
      call: (key, model, sys, usr) =>
        callOpenAICompat('https://apihub.agnes-ai.com/v1/chat/completions', key, model, sys, usr),
    },
  ];

  let lastError = null;

  for (const plan of plans) {
    const keys = collectProviderKeys(plan.provider);
    if (!keys.length) continue;

    for (const model of plan.models) {
      for (const key of keys) {
        try {
          const reply = await plan.call(key, model, systemPrompt, userPrompt);
          return { ok: true, provider: plan.provider, model, reply };
        } catch (err) {
          lastError = err;
          if (err?.status === 429 || err?.status === 401 || err?.status === 403) {
            continue;
          }
          break;
        }
      }
    }
  }

  return {
    ok: false,
    error: lastError?.message || 'Chưa cấu hình khóa API AI hợp lệ trong .env',
    reply: [
      'Dạ hiện Trợ lý AI đang bận nhẹ, Thầy/Cô có thể gõ !menu để xem nhanh hướng dẫn Trộn đề, AI Tạo đề, Chấm OMR và Bảng giá VIP, hoặc nhắn rõ vấn đề để Admin hỗ trợ trực tiếp ạ!',
    ].join('\n'),
  };
}

function findFaqMatch(faqRules, normText) {
  const enabledRules = (faqRules || []).filter((r) => r && r.enabled !== false);
  let bestMatch = null;
  let bestScore = -1;

  for (const rule of enabledRules) {
    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
    for (const rawKw of keywords) {
      const kwNorm = normalizeText(rawKw);
      if (!kwNorm) continue;
      if (normText.includes(kwNorm)) {
        // Ưu tiên rule cần báo Admin hoặc từ khóa dài & cụ thể hơn
        const score = kwNorm.length + (rule.notifyAdmin ? 100 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { rule, matchedKeyword: rawKw };
        }
      }
    }
  }
  return bestMatch;
}

export function stripBotMentionPrefix(text = '', botDisplayName = '', botAliases = []) {
  let s = String(text || '').trim();
  if (!s) return '';

  const candidates = [
    botDisplayName,
    'Trợ lý ELEC AI',
    'Tro ly ELEC AI',
    'ELEC AI Bot',
    'ELEC AI',
    'Trợ lý',
    'Bot',
    ...(Array.isArray(botAliases) ? botAliases : []),
  ]
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (s.startsWith('@')) {
    const afterAt = s.slice(1).trimStart();
    let matched = false;
    for (const candidate of candidates) {
      const candWords = candidate.split(/\s+/).filter(Boolean);
      const tokenParts = afterAt.split(/\s+/);
      if (tokenParts.length >= candWords.length) {
        const leading = tokenParts.slice(0, candWords.length).join(' ').replace(/[:,.;!?]+$/, '');
        if (normalizeText(leading) === normalizeText(candidate)) {
          s = tokenParts.slice(candWords.length).join(' ').replace(/^[:,.\-\s]+/, '').trim();
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      const cmdAfterMention = /^@[^!/\n]{1,45}\s+([!/].+)$/.exec(s);
      if (cmdAfterMention) {
        s = cmdAfterMention[1].trim();
      }
    }
  }

  return s;
}

/**
 * Quyết định Bot có trả lời tin nhắn này không và trả lời nội dung gì.
 * Trả về:
 *  {
 *    shouldReply: boolean,
 *    reason: string,
 *    mode: 'command' | 'faq' | 'ai' | 'mention' | 'none',
 *    reply: string,
 *    notifyAdmin: boolean,
 *    matchedRuleId?: string,
 *    provider?: string,
 *    model?: string,
 *  }
 */
export async function decideBotReply({
  text,
  senderName = 'Thầy/Cô',
  isMentioned = false,
  botDisplayName = '',
  config,
}) {
  const rawInput = String(text || '').trim();
  const hadAtPrefix = rawInput.startsWith('@');
  const raw = stripBotMentionPrefix(rawInput, botDisplayName, config?.botAliases);
  const norm = normalizeText(raw);
  const effectiveMention = Boolean(isMentioned || (hadAtPrefix && raw.length !== rawInput.length));

  if (!rawInput) {
    return { shouldReply: false, reason: 'empty', mode: 'none', reply: '', notifyAdmin: false };
  }
  if (!raw && effectiveMention) {
    return {
      shouldReply: true,
      reason: 'mention',
      mode: 'mention',
      reply: `Dạ em (Trợ lý ELEC AI) có mặt ạ! Thầy/Cô cần hỗ trợ nội dung nào cứ nhắn kèm câu hỏi hoặc gõ !menu để xem nhanh hướng dẫn nhé.`,
      notifyAdmin: false,
    };
  }

  const modes = config?.replyModes || {};
  const faqRules = config?.faqRules || DEFAULT_FAQ_RULES;
  const aliases = (config?.botAliases || ['bot', 'trợ lý', 'tro ly', 'elec ai', 'elec']).map(normalizeText).filter(Boolean);

  // 1. Lệnh nhanh bắt đầu bằng ! hoặc /
  if (modes.commands !== false && /^[!/]/.test(raw)) {
    const firstSpace = raw.search(/\s/);
    const cmd = (firstSpace === -1 ? raw : raw.slice(0, firstSpace)).toLowerCase();
    const rest = firstSpace === -1 ? '' : raw.slice(firstSpace + 1).trim();

    if (cmd === '!menu' || cmd === '/menu' || cmd === '!hotro' || cmd === '/hotro' || cmd === '!help') {
      return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: MENU_TEXT, notifyAdmin: false };
    }
    if (cmd === '!video' || cmd === '/video') {
      return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: VIDEOS_TEXT, notifyAdmin: false };
    }
    if (cmd === '!tronde' || cmd === '/tronde') {
      const rule = faqRules.find((r) => r.id === 'tron-de-word');
      if (rule) return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: rule.reply, notifyAdmin: Boolean(rule.notifyAdmin), matchedRuleId: rule.id };
    }
    if (cmd === '!taode' || cmd === '/taode') {
      const rule = faqRules.find((r) => r.id === 'ai-tao-de');
      if (rule) return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: rule.reply, notifyAdmin: Boolean(rule.notifyAdmin), matchedRuleId: rule.id };
    }
    if (cmd === '!omr' || cmd === '/omr') {
      const rule = faqRules.find((r) => r.id === 'cham-omr');
      if (rule) return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: rule.reply, notifyAdmin: Boolean(rule.notifyAdmin), matchedRuleId: rule.id };
    }
    if (cmd === '!gia' || cmd === '/gia' || cmd === '!vip' || cmd === '/vip') {
      const rule = faqRules.find((r) => r.id === 'bang-gia-vip');
      if (rule) return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: rule.reply, notifyAdmin: Boolean(rule.notifyAdmin), matchedRuleId: rule.id };
    }
    if (cmd === '!stk' || cmd === '/stk' || cmd === '!thanhtoan' || cmd === '/thanhtoan') {
      const rule = faqRules.find((r) => r.id === 'thanh-toan-ck');
      if (rule) return { shouldReply: true, reason: `command:${cmd}`, mode: 'command', reply: rule.reply, notifyAdmin: Boolean(rule.notifyAdmin), matchedRuleId: rule.id };
    }
    if (cmd === '/ai' || cmd === '!ai') {
      if (!rest) {
        return {
          shouldReply: true,
          reason: `command:${cmd}:empty`,
          mode: 'command',
          reply: 'Thầy/Cô vui lòng nhập câu hỏi sau lệnh, ví dụ: /ai cách trộn đề 3 phần trên ELEC AI',
          notifyAdmin: false,
        };
      }
      const faqHit = findFaqMatch(faqRules, normalizeText(rest));
      if (faqHit && faqHit.rule.notifyAdmin) {
        return {
          shouldReply: true,
          reason: `command:${cmd}->faq:${faqHit.rule.id}`,
          mode: 'faq',
          reply: faqHit.rule.reply,
          notifyAdmin: true,
          matchedRuleId: faqHit.rule.id,
        };
      }
      const aiRes = await askElecSupportAI(rest, { senderName });
      return {
        shouldReply: true,
        reason: `command:${cmd}`,
        mode: 'ai',
        reply: aiRes.reply,
        notifyAdmin: false,
        provider: aiRes.provider,
        model: aiRes.model,
      };
    }
  }

  // 2. Bắt từ khóa FAQ thông minh
  if (modes.keywordSmart !== false) {
    const faqHit = findFaqMatch(faqRules, norm);
    if (faqHit) {
      return {
        shouldReply: true,
        reason: `faq:${faqHit.rule.id} (${faqHit.matchedKeyword})`,
        mode: 'faq',
        reply: faqHit.rule.reply,
        notifyAdmin: Boolean(faqHit.rule.notifyAdmin),
        matchedRuleId: faqHit.rule.id,
      };
    }
  }

  // 3. Được @tag hoặc gọi tên Bot/Trợ lý/Admin
  const calledByAlias =
    effectiveMention ||
    aliases.some((alias) => norm.includes(alias)) ||
    /\b(admin oi|ad oi|tro ly oi|bot oi)\b/.test(norm);

  if (modes.mentionOrCall !== false && calledByAlias) {
    // Nếu có câu hỏi thực sự đi kèm -> hỏi AI; nếu chỉ gọi tên ngắn -> trả menu chào
    const cleanForAi = raw.replace(/^@\S+\s*/, '').trim();
    if (cleanForAi.length >= 6) {
      const aiRes = await askElecSupportAI(cleanForAi, { senderName });
      return {
        shouldReply: true,
        reason: effectiveMention ? 'mention+ai' : 'alias+ai',
        mode: 'ai',
        reply: aiRes.reply,
        notifyAdmin: false,
        provider: aiRes.provider,
        model: aiRes.model,
      };
    }
    return {
      shouldReply: true,
      reason: effectiveMention ? 'mention' : 'alias',
      mode: 'mention',
      reply: `Dạ em (Trợ lý ELEC AI) có mặt ạ! Thầy/Cô cần hỗ trợ nội dung nào cứ nhắn hoặc gõ !menu để xem nhanh hướng dẫn nhé.`,
      notifyAdmin: false,
    };
  }

  // 4. Câu hỏi mở liên quan đến ELEC AI
  if (modes.aiFallbackOnQuestion !== false && looksLikeQuestionForSupport(raw)) {
    const aiRes = await askElecSupportAI(raw, { senderName });
    return {
      shouldReply: true,
      reason: 'ai-question',
      mode: 'ai',
      reply: aiRes.reply,
      notifyAdmin: false,
      provider: aiRes.provider,
      model: aiRes.model,
    };
  }

  // 5. Tin nhắn trò chuyện bình thường -> Không spam
  return {
    shouldReply: false,
    reason: 'casual-chat-ignored',
    mode: 'none',
    reply: '',
    notifyAdmin: false,
  };
}

/* ============================================================
   ZALO BOT PLATFORM API (https://bot-api.zaloplatforms.com)
   Dùng chung cho Local Polling Server & Vercel Webhook Serverless
   ============================================================ */
export const ZALO_BOT_API_BASE = 'https://bot-api.zaloplatforms.com';

export async function callZaloBotApi(token, method, body = undefined, timeoutMs = 15000) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) throw new Error('Chưa cung cấp Zalo Bot Token.');
  if (/[\s/?#]/.test(cleanToken)) {
    throw new Error('Zalo Bot Token chứa ký tự không hợp lệ.');
  }

  const url = `${ZALO_BOT_API_BASE}/bot${cleanToken}/${method}`;
  const isGetMe = method === 'getMe' && body === undefined;
  const res = await fetch(url, {
    method: isGetMe ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: isGetMe ? undefined : JSON.stringify(body || {}),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const rawText = await res.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Zalo Bot API (${method}) trả về phản hồi không phải JSON: ${rawText.slice(0, 180)}`);
  }

  if (!res.ok || data?.ok === false) {
    const code = data?.error_code ?? res.status;
    const desc = data?.description || data?.message || rawText.slice(0, 180) || 'Lỗi không xác định';
    const err = new Error(`Zalo Bot API [${code}]: ${desc}`);
    err.code = code;
    throw err;
  }

  return data;
}

export function splitZaloText(text, maxLen = 1900) {
  const str = String(text || '').trim();
  if (!str) return [];
  if (str.length <= maxLen) return [str];

  const chunks = [];
  let remaining = str;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt < Math.floor(maxLen * 0.5)) {
      splitAt = remaining.lastIndexOf(' ', maxLen);
    }
    if (splitAt < Math.floor(maxLen * 0.4)) {
      splitAt = maxLen;
    }
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function sendZaloBotMessage(token, chatId, text) {
  const targetId = String(chatId || '').trim();
  if (!targetId) throw new Error('Thiếu chat_id nhận tin.');
  const parts = splitZaloText(text, 1900);
  const results = [];
  for (const part of parts) {
    const res = await callZaloBotApi(token, 'sendMessage', {
      chat_id: targetId,
      text: part,
    });
    results.push(res);
  }
  return results;
}

export function extractZaloBotUpdate(rawEnvelope) {
  if (!rawEnvelope || typeof rawEnvelope !== 'object') return null;
  const envelope = rawEnvelope.result && typeof rawEnvelope.result === 'object' ? rawEnvelope.result : rawEnvelope;
  const eventName = String(envelope.event_name || envelope.event || '').trim();
  const msg = envelope.message && typeof envelope.message === 'object' ? envelope.message : envelope;
  const chat = msg.chat && typeof msg.chat === 'object' ? msg.chat : envelope.chat || {};
  const from = msg.from && typeof msg.from === 'object' ? msg.from : envelope.from || {};

  const chatId = String(chat.id || '').trim();
  const text = typeof msg.text === 'string' ? msg.text : typeof msg.content === 'string' ? msg.content : '';
  const chatType = String(chat.chat_type || chat.type || '').trim();
  const isGroup = /group/i.test(chatType);

  if (!chatId && !text) return null;

  return {
    eventName,
    messageId: String(msg.message_id || msg.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    chatId,
    chatType: chatType || (isGroup ? 'group' : '1_1'),
    chatTitle: String(chat.title || chat.name || (isGroup ? `Nhóm ${chatId}` : from.display_name || `Chat ${chatId}`)).trim(),
    isGroup,
    senderId: String(from.id || '').trim(),
    senderName: String(from.display_name || from.name || 'Thầy/Cô').trim(),
    text: String(text || '').trim(),
    isBotSender: Boolean(from.is_bot),
  };
}
