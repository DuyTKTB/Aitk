import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLocalStorage } from '../hooks.js';
import { askAI, compressImage, AI_READY } from '../lib/ai.js';
import { MODE_LIST } from '../lib/aiPrompts.js';
import NavCreditPopover from './NavCreditPopover.jsx';

const Casio580Widget = lazy(() => import('./Casio580Widget.jsx'));
const ChatScienceQuickRef = lazy(() => import('./ChatScienceQuickRef.jsx'));
const GRADE_OPTIONS = ['Tự động', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];
const KHTN_SYMBOLS = ['→', '⇌', 'Δ', 'π', 'ω', 'λ', 'Ω', 'μ', 'α', 'β', 'γ', '°', '²', '³', '√', '±', '≥', '≤', 'đkc', 'mol'];
import {
  fetchChats as fetchChatsServer,
  createChat as createChatServer,
  updateChat as updateChatServer,
  deleteChat as deleteChatServer,
  deleteAllChats as deleteAllChatsServer,
  migrateLocalChats,
  debouncedSync,
  cancelAllSyncs,
} from '../lib/aiChatApi.js';
import AIMark from './AIMark.jsx';
import UserAvatarLogo from './UserAvatar.jsx';
import { getQuota, canSend, consumeQuota } from '../lib/quota.js';
import { spendCredit, refundCredit, getCredits, calcChatCreditCost, formatCredits } from '../lib/creditService.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { recordWrongAnswers } from '../lib/wrongQuestionService.js';
import VerifiedBadge from './VerifiedBadge.jsx';
import { MarkdownLike, CollapsibleText, ReasoningSteps } from './ChatMarkdown.jsx';
import InteractiveQuizCanvas from './InteractiveQuizCanvas.jsx';
import { parseQuizFromText } from '../lib/aiQuizParser.js';
import InteractiveChalkboardCanvas from './InteractiveChalkboardCanvas.jsx';
import { parseChalkboardFromText } from '../lib/aiChalkboardParser.js';
import { getDefaultPresetForSubject } from '../lib/chalkboardPresets.js';
import SocraticCheckpointCard, { parseCheckpointFromText } from './SocraticCheckpointCard.jsx';
import { readChatDocument, isDocumentFile, formatDocsPromptBlock } from '../lib/docChatReader.js';
import { findRelatedYouTubeVideos } from '../lib/youtubeService.js';
import { YouTubeVideoSection } from './YouTubeVideoSection.jsx';
import * as tts from '../lib/tts.js';
import {
  IcoPlus, IcoChat, IcoTrash, IcoChevron, IcoClose, IcoImage, IcoSend, IcoBrain,
  IcoCopy, IcoCheck, IcoUser, IcoCrown, IcoLogout, IcoSettings, IcoSparkle,
  IcoCamera, IcoStop, IcoRefresh, IcoSearch,
} from './Icons.jsx';
import {
  PromptIcon, IcoMic, IcoDownload, IcoEdit, IcoArrowDown, IcoUploadCloud,
  IcoChevL, IcoChevR, IcoPlusSm, IcoLoader,
  IcoSunSm, IcoMoonSm, IcoCalendarSm, IcoArchive, IcoCalc, IcoShieldCheck,
  IcoWand, IcoPin, IcoSpeaker, IcoSpeakerOff, IcoNote, IcoPractice, IcoMore,
} from './AIChatIcons.jsx';
import {
  CgChat, CgCompose, CgClose, CgDots, CgPin, CgPencil, CgTrash, CgHome, CgGift,
} from './ChatGptIcons.jsx';
/* CSS: 8 lớp cũ đã gộp thành 1 file (giữ nguyên thứ tự cascade);
   ai-intelligence.css tinh chỉnh giao diện AI; ai-fullscreen.css là lớp CUỐI
   (phủ kín màn hình + giao diện điện thoại kiểu ChatGPT) nên phải import sau cùng. */
import '../styles/aichat.css';
import '../styles/ai-intelligence.css';
import '../styles/ai-fullscreen.css';
import '../styles/styles/ai-chatgpt.css';
import '../styles/ai-redesign-v2.css';
import '../styles/ai-chat-studio-pro.css';

const fmtCreditsShort = (n) => {
  if (n == null) return '...';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString('vi-VN');
};

const SUBJECT_LENSES = [
  { id: 'all', label: 'Tổng hợp', tone: 'elec' },
  { id: 'ly', label: 'Vật lí', tone: 'ly' },
  { id: 'hoa', label: 'Hóa học', tone: 'hoa' },
  { id: 'sinh', label: 'Sinh học', tone: 'sinh' },
];

const SUBJECT_CARDS = {
  all: [
    { kind: 'hoa', title: 'Cân bằng phương trình oxi hóa – khử', sub: 'Thăng bằng electron & bảo toàn e', prompt: 'Hướng dẫn cách cân bằng phương trình oxi hóa - khử bằng phương pháp thăng bằng electron kèm ví dụ mẫu chuẩn GDPT 2025.' },
    { kind: 'ly', title: 'Giao thoa sóng Y-âng & mạch RLC', sub: 'Công thức lõi và bẫy thường gặp', prompt: 'Tóm tắt công thức cốt lõi và giải mẫu bài toán giao thoa ánh sáng qua khe Y-âng kèm bẫy hay sai.' },
    { kind: 'sinh', title: 'Cấu trúc ADN & quy luật Men-đen', sub: 'Liên kết hiđrô và tỉ lệ kiểu hình', prompt: 'Tóm tắt các công thức tính chiều dài gen, số nucleotit, liên kết hiđrô của ADN và bài tập mẫu.' },
    { kind: 'quiz', title: 'Đề phản xạ 5 câu KHTN tương tác', sub: 'Mở trực tiếp trên Canvas tự chấm', prompt: 'Tạo cho mình 5 câu trắc nghiệm tương tác tổng hợp Lý - Hóa - Sinh mức độ Vận dụng có giải thích bẫy chi tiết.' },
  ],
  ly: [
    { kind: 'ly', title: 'Phương trình dao động điều hòa', sub: 'Xác định nhanh A, ω và pha ban đầu φ', prompt: 'Hướng dẫn từng bước cách xác định A, ω, φ khi viết phương trình dao động điều hòa x = Acos(ωt + φ).' },
    { kind: 'ly', title: 'Cộng hưởng điện mạch xoay chiều RLC', sub: 'Điều kiện cực trị công suất & điện áp', prompt: 'Giải chi tiết hiện tượng cộng hưởng điện và các công thức cực trị trong mạch xoay chiều RLC.' },
    { kind: 'ly', title: 'Vân trùng giao thoa ánh sáng Y-âng', sub: 'Tìm vị trí vân sáng trùng 2 bức xạ', prompt: 'Phương pháp giải nhanh bài toán vân trùng nhau trong giao thoa ánh sáng hai bức xạ đơn sắc.' },
    { kind: 'quiz', title: 'Bảng phấn 3D dao động con lắc lò xo', sub: 'Minh họa vectơ quay trực quan từng bước', prompt: 'Hãy giải một bài mẫu về dao động điều hòa và minh họa bằng bảng phấn 3D tương tác từng bước.' },
  ],
  hoa: [
    { kind: 'hoa', title: 'Thủy phân Este trong môi trường kiềm', sub: 'Quy đổi hỗn hợp & bẫy este của phenol', prompt: 'Trình bày phương pháp giải bài toán thủy phân este trong NaOH/KOH và mẹo tránh bẫy este của phenol.' },
    { kind: 'hoa', title: 'Pin Galvani & điện phân dung dịch', sub: 'Thế điện cực chuẩn, quy tắc alpha', prompt: 'Tóm tắt trọng tâm Pin điện hóa, quy tắc alpha và thứ tự điện phân dung dịch lớp 12 GDPT 2025.' },
    { kind: 'hoa', title: 'Tính pH dung dịch & chuẩn độ axit – bazơ', sub: 'Chuẩn chương trình Hóa GDPT 2025', prompt: 'Hướng dẫn cách tính pH dung dịch axit mạnh, bazơ mạnh và bài toán chuẩn độ dung dịch theo GDPT 2025.' },
    { kind: 'quiz', title: '5 câu Đúng/Sai Hóa học dễ mất điểm', sub: 'Luyện phản xạ soi bẫy trên Canvas', prompt: 'Tạo cho mình 5 câu trắc nghiệm tương tác Hóa học GDPT 2025 tập trung vào các bẫy lý thuyết hay sai nhất.' },
  ],
  sinh: [
    { kind: 'sinh', title: 'Nhân đôi ADN, phiên mã & dịch mã', sub: 'So sánh cơ chế và công thức tính nhanh', prompt: 'So sánh nhanh cơ chế nhân đôi ADN, phiên mã và dịch mã kèm các công thức tính toán thường thi.' },
    { kind: 'sinh', title: 'Quy luật Men-đen & khung Punnett', sub: 'Tách cặp xác định nhanh kiểu gen F2', prompt: 'Hướng dẫn cách giải nhanh bài toán lai hai tính trạng Men-đen và tương tác gen bằng phương pháp tách cặp.' },
    { kind: 'sinh', title: 'Định luật Hardy – Weinberg quần thể', sub: 'Điều kiện cân bằng & tần số alen', prompt: 'Trình bày điều kiện nghiệm đúng và cách giải bài toán định luật Hardy – Weinberg trong quần thể ngẫu phối.' },
    { kind: 'quiz', title: '5 câu Sinh học vận dụng trên Canvas', sub: 'Tương tác trắc nghiệm & giải chi tiết', prompt: 'Tạo cho mình 5 câu trắc nghiệm tương tác Sinh học mức độ Thông hiểu – Vận dụng kèm giải thích chi tiết.' },
  ],
};

function SubjectGlyph({ kind }) {
  if (kind === 'ly') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-30 12 12)" />
      </svg>
    );
  }
  if (kind === 'hoa') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 3h6" />
        <path d="M10 3v6.2L4.7 18.6A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.7-2.4L14 9.2V3" />
        <path d="M7.5 15h9" />
      </svg>
    );
  }
  if (kind === 'sinh') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 15c6.667-6 13.333 0 20-6" />
        <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
        <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
        <path d="m17 6-2.5-2.5" />
        <path d="m14 8-1-1" />
        <path d="m7 18 2.5 2.5" />
        <path d="m3.5 14.5.5.5" />
        <path d="m20 9 .5.5" />
        <path d="m6.5 12.5 1 1" />
        <path d="m16.5 10.5 1 1" />
        <path d="m10 16 1.5 1.5" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 17.5h7" />
      <path d="M17.5 14v7" />
    </svg>
  );
}

const SLASH_COMMANDS = [
  { cmd: '/giai', label: 'Giải chi tiết từng bước + công thức', prompt: 'Giải bài này chi tiết từng bước, nêu rõ công thức, đơn vị và kiểm tra lại kết quả: ' },
  { cmd: '/hoc', label: 'Học chủ động Study Mode (tự kiểm tra)', prompt: 'Hãy hướng dẫn mình từng bước kiểu Study Mode (chưa cho đáp án cuối ngay) kèm thẻ tự kiểm tra cho bài: ' },
  { cmd: '/casio', label: 'Hướng dẫn bấm máy Casio fx-580VN X', prompt: 'Hướng dẫn cách bấm máy tính Casio fx-580VN X / 880BTG nhanh nhất (ghi rõ từng phím bấm) cho bài: ' },
  { cmd: '/chamnhap', label: 'Chấm nháp viết tay, bắt lỗi dấu', prompt: 'Hãy chấm từng dòng bài làm này, chỉ ra dòng nào bắt đầu sai dấu/sai đơn vị và sửa lại từ đó: ' },
  { cmd: '/quiz5', label: 'Tạo đề phản xạ 5 câu Canvas', prompt: 'Tạo cho mình 5 câu trắc nghiệm tương tác tổng hợp KHTN mức độ Vận dụng kèm lời giải bẫy chi tiết về chủ đề: ' },
  { cmd: '/3d', label: 'Vẽ bảng phấn 3D minh họa', prompt: 'Giải và minh họa bằng bảng phấn 3D sử dụng cú pháp ```chalkboard-mv cho bài toán: ' },
  { cmd: '/tomtat', label: 'Tóm tắt trọng tâm & công thức lõi', prompt: 'Tóm tắt ngắn gọn công thức cốt lõi và các dạng bài hay thi nhất về: ' },
  { cmd: '/bayde', label: 'Soi bẫy đề thi GDPT 2025', prompt: 'Liệt kê 5 bẫy đề thi học sinh hay mất điểm nhất (đặc biệt Phần II Đúng/Sai) trong chuyên đề: ' },
];

/* ============================================================
   BỘ NHỚ ĐỆM SIÊU TỐC (CACHE) — CHỐNG LAG GIẬT KHI CHAT HOẶC GÕ PHÍM
   ============================================================ */
const QUIZ_CACHE = new Map();
const CB_CACHE = new Map();
const YT_VIDEOS_CACHE = new Map();

function getCachedQuiz(text) {
  if (!text) return null;
  if (QUIZ_CACHE.has(text)) return QUIZ_CACHE.get(text);
  const res = parseQuizFromText(text);
  if (QUIZ_CACHE.size > 200) {
    const firstKey = QUIZ_CACHE.keys().next().value;
    QUIZ_CACHE.delete(firstKey);
  }
  QUIZ_CACHE.set(text, res);
  return res;
}

function getCachedChalkboard(text) {
  if (!text) return null;
  if (CB_CACHE.has(text)) return CB_CACHE.get(text);
  const res = parseChalkboardFromText(text);
  if (CB_CACHE.size > 200) {
    const firstKey = CB_CACHE.keys().next().value;
    CB_CACHE.delete(firstKey);
  }
  CB_CACHE.set(text, res);
  return res;
}

function getCachedRelatedVideos(queryText, limit = 2) {
  const key = `${limit}:${queryText}`;
  if (YT_VIDEOS_CACHE.has(key)) return YT_VIDEOS_CACHE.get(key);
  const res = findRelatedYouTubeVideos(queryText, limit);
  if (YT_VIDEOS_CACHE.size > 150) {
    const firstKey = YT_VIDEOS_CACHE.keys().next().value;
    YT_VIDEOS_CACHE.delete(firstKey);
  }
  YT_VIDEOS_CACHE.set(key, res);
  return res;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const CLASSES = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

const QUICK_PROMPTS = [
  { icon: 'steps', label: 'Giải chi tiết', prompt: 'Giải bài này chi tiết từng bước, ghi rõ công thức và đơn vị.' },
  { icon: 'bolt', label: 'Giải nhanh', prompt: 'Giải nhanh, chỉ ghi kết quả và 1-2 dòng giải thích.' },
  { icon: 'bulb', label: 'Giải thích khái niệm', prompt: 'Giải thích khái niệm trong bài này bằng ngôn ngữ dễ hiểu, có ví dụ.' },
  { icon: 'repeat', label: 'Tạo bài tương tự', prompt: 'Tạo 3 bài tập tương tự để mình luyện thêm (có đáp án).' },
  { icon: 'bug', label: 'Tìm lỗi sai', prompt: 'Chỉ ra lỗi sai thường gặp khi giải dạng bài này.' },
  { icon: 'check', label: 'Chấm nháp viết tay', prompt: 'Hãy chấm từng dòng trong ảnh nháp/bài giải này của mình, chỉ rõ dòng nào bắt đầu biến đổi sai dấu, sai đơn vị hay sai công thức và sửa lại từ dòng đó.' },
  { icon: 'book', label: 'Tóm tắt lý thuyết', prompt: 'Tóm tắt lý thuyết liên quan cần nhớ để giải dạng bài này.' },
  { icon: 'wand', label: 'Vẽ bảng phấn 3D', prompt: 'Hãy giải bài này và minh họa bằng bảng phấn 3D sử dụng cú pháp ```chalkboard-mv kèm các câu lệnh dựng hình (Point, Segment, Pyramid, Sphere, Line, v.v.).' },
];

const TODAY_FACTS = [
  { type: 'Vật lí · Dao động', content: 'T = 2π√(m/k)', hint: 'Chu kỳ dao động con lắc lò xo phụ thuộc khối lượng m và độ cứng k.' },
  { type: 'Hóa học · Phản ứng', content: '2H₂ + O₂ → 2H₂O', hint: 'Phản ứng tạo nước — nền tảng của nhiều phản ứng hóa học.' },
  { type: 'Sinh học · Phân tử', content: '2A + 3G = H (liên kết hiđrô)', hint: 'Nguyên tắc bổ sung: A nối T bằng 2 liên kết, G nối X bằng 3 liên kết hiđrô.' },
  { type: 'Vật lí · Sóng & Ánh sáng', content: 'c ≈ 300.000 km/s', hint: 'Vận tốc ánh sáng trong chân không — giới hạn tốc độ tối đa của vũ trụ.' },
  { type: 'Hóa học · Dung dịch', content: 'pH = -log[H⁺]', hint: 'Với [H⁺] = 10⁻³ M thì pH = 3 (môi trường axit).' },
  { type: 'Sinh học · Mã di truyền', content: '64 bộ ba mã di truyền', hint: '61 bộ ba mã hóa cho 20 loại axit amin; 3 bộ ba kết thúc (UAA, UAG, UGA).' },
  { type: 'Vật lí · Điện xoay chiều', content: 'Z = √[R² + (Zʟ − Zᴄ)²]', hint: 'Tổng trở mạch RLC nối tiếp đạt cực tiểu Z = R khi xảy ra cộng hưởng điện.' },
  { type: 'Hóa học · Kim loại', content: 'Ag > Cu > Au > Al > Fe', hint: 'Thứ tự dẫn điện và dẫn nhiệt giảm dần của các kim loại thông dụng.' },
  { type: 'Sinh học · Quần thể', content: 'p²AA + 2pqAa + q²aa = 1', hint: 'Định luật Hardy - Weinberg về trạng thái cân bằng di truyền của quần thể.' },
];

const SUGGESTION_POOL = [
  { tag: 'Vật lí · Dao động', text: 'Cách viết phương trình dao động điều hòa x = A cos(wt + phi)', icon: 'wave' },
  { tag: 'Vật lí · Mạch RLC', text: 'Tính tổng trở và độ lệch pha mạch xoay chiều RLC', icon: 'circuit' },
  { tag: 'Vật lí · Quang học', text: 'Giải thích hiện tượng giao thoa ánh sáng qua khe Y-âng', icon: 'bolt' },
  { tag: 'Hóa học · Este', text: 'Phương pháp giải bài toán thủy phân este trong kiềm', icon: 'flask' },
  { tag: 'Hóa học · Cân bằng', text: 'Cách cân bằng phương trình oxi hóa khử bằng thăng bằng electron', icon: 'flask' },
  { tag: 'Hóa học · Dung dịch', text: 'Giải thích công thức tính pH và nồng độ mol CM', icon: 'drop' },
  { tag: 'Sinh học · ADN', text: 'Công thức tính chiều dài gen và số liên kết hydro của ADN', icon: 'dna' },
  { tag: 'Sinh học · Men-đen', text: 'Cách lập khung Punnett và xác định tỉ lệ phân li kiểu hình F2', icon: 'steps' },
  { tag: 'Sinh học · Quần thể', text: 'Định luật Hardy - Weinberg và bài toán cân bằng di truyền', icon: 'table' },
  { tag: 'KHTN · Định luật', text: 'Giải thích định luật bảo toàn khối lượng và cơ năng', icon: 'scale' },
];

const pickSuggestions = (seed) => {
  const arr = [...SUGGESTION_POOL];
  let x = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    const j = x % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 4);
};

const DRAFT_KEY = 'cs-ai-draft';
const readDraft = () => { try { return localStorage.getItem(DRAFT_KEY) || ''; } catch { return ''; } };

const MAX_CHATS = 50;
const MAX_IMAGES = 10;
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const isCoarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const onAiPage = () => {
  if (typeof window === 'undefined') return false;
  const hash = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0];
  const path = (window.location.pathname || '').replace(/^\/+/, '').split('/')[0];
  return hash === 'ai' || path === 'tro-ly-ai-giai-hoa';
};
const stamp = (c) => c.updatedAt || c.createdAt || 0;

const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
const isImageFile = (f) => Boolean(f) && ((f.type && f.type.startsWith('image/')) || IMG_EXT.test(f.name || ''));

const makeThumb = (dataUrl, max = 640) => new Promise((resolve) => {
  const im = new Image();
  im.onload = () => {
    try {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * s));
      c.height = Math.max(1, Math.round(im.height * s));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.74));
    } catch { resolve(dataUrl); }
  };
  im.onerror = () => resolve(dataUrl);
  im.src = dataUrl;
});

const slim = (msgs) => msgs.map((m) => (m.parts?.some((p) => p.inlineData)
  ? { ...m, parts: m.parts.filter((p) => !p.inlineData) }
  : m));

const slimServerMessages = (msgs) => {
  if (!Array.isArray(msgs)) return [];
  return msgs.map((m) => {
    if (!m.parts) return m;
    return {
      ...m,
      parts: m.parts.map((p) => (p.inlineData ? { text: '[ảnh đã gửi]' } : p)),
    };
  });
};

const withImages = (m) => {
  if (!m) return m;
  if (m.parts?.some((p) => p.inlineData)) return m;
  const list = m.preview?.images || [];
  if (list.length === 0) return m;
  const extra = list
    .filter((im) => im && im.dataUrl)
    .map((im) => ({
      inlineData: {
        mimeType: (im.dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg',
        data: im.dataUrl.split(',')[1],
      },
    }));
  return { ...m, parts: [...(m.parts || []), ...extra] };
};

const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
};

const SpeechRec = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

const GROUP_LABELS = { today: 'Hôm nay', yesterday: 'Hôm qua', week: '7 ngày qua', older: 'Cũ hơn' };
/* Icon nhóm lịch sử: SVG (không dùng emoji) */
const GROUP_ICONS = { today: IcoSunSm, yesterday: IcoMoonSm, week: IcoCalendarSm, older: IcoArchive };
const GroupIcon = ({ name, size = 22 }) => {
  const Cmp = GROUP_ICONS[name];
  return Cmp ? <Cmp size={size} /> : null;
};

/* ============================================================
   HELPERS
   ============================================================ */
function groupChats(chats) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { today: [], yesterday: [], week: [], older: [] };
  for (const c of [...chats].sort((a, b) => stamp(b) - stamp(a))) {
    const d = new Date(stamp(c)); d.setHours(0, 0, 0, 0);
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else if (d >= weekAgo) groups.week.push(c);
    else groups.older.push(c);
  }
  return groups;
}

function getChatMessages(chat, max = 8) {
  if (!chat?.messages) return [];
  const out = [];
  chat.messages.forEach((m, i) => {
    if (m.role === 'user') {
      const imgCount = m.preview?.images?.length || (m.preview?.img ? 1 : 0);
      const label = stripMarkdown(m.preview?.text)
        || (imgCount > 1 ? `[${imgCount} ảnh]` : imgCount === 1 ? '[Ảnh]' : 'Tin nhắn');
      out.push({ id: i, text: label.slice(0, 60) });
    }
  });
  return out.slice(-max);
}

function getChatPreview(chat) {
  if (!chat?.messages?.length) return { role: '', text: '' };
  const m = chat.messages[chat.messages.length - 1];

  if (m.role === 'user') {
    const t = stripMarkdown(m.preview?.text);
    const nImg = m.preview?.images?.length || 0;
    if (t) return { role: 'user', text: t.slice(0, 40) };
    if (nImg > 0) return { role: 'user', text: `[${nImg} ảnh]` };
    return { role: 'user', text: 'Tin nhắn' };
  }

  return {
    role: 'ai',
    text: stripMarkdown(m.text).slice(0, 40),
  };
}

function getTodayFact() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return TODAY_FACTS[dayOfYear % TODAY_FACTS.length];
}

/* ============================================================
   SUBCOMPONENTS
   ============================================================ */
function LiveBackground() {
  const atoms = useMemo(() => [
    { w: 220, h: 220, top: '8%', left: '4%', delay: '0s', dur: '22s' },
    { w: 320, h: 320, top: '55%', left: '68%', delay: '-6s', dur: '28s' },
    { w: 160, h: 160, top: '28%', left: '78%', delay: '-12s', dur: '24s' },
    { w: 260, h: 260, top: '75%', left: '12%', delay: '-18s', dur: '30s' },
    { w: 180, h: 180, top: '45%', left: '40%', delay: '-8s', dur: '26s' },
  ], []);

  const bonds = useMemo(() => [
    { top: '20%', left: '15%', width: 180, delay: '0s' },
    { top: '60%', left: '55%', width: 220, delay: '-3s' },
    { top: '80%', left: '25%', width: 140, delay: '-5s' },
  ], []);

  return (
    <div className="ds-live-bg" aria-hidden="true">
      {atoms.map((a, i) => (
        <div
          key={i}
          className="atom-bg"
          style={{
            width: a.w,
            height: a.h,
            top: a.top,
            left: a.left,
            animationDelay: a.delay,
            animationDuration: a.dur,
          }}
        />
      ))}
      {bonds.map((b, i) => (
        <div
          key={i}
          className="bond-line"
          style={{ top: b.top, left: b.left, width: b.width, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
}

function UserAvatar({ user, initial, color }) {
  if (user?.photoURL) {
    return (
      <div className="ds-user-avatar" style={{ background: color, color: '#111' }}>
        <img src={user.photoURL} alt="" />
      </div>
    );
  }
  return <UserAvatarLogo user={user} size={34} />;
}

function TodayCard({ onAsk }) {
  const fact = useMemo(() => getTodayFact(), []);

  const handleClick = () => {
    onAsk(`Hãy giải thích về: ${fact.content}`);
  };

  return (
    <button type="button" className="ds-today-card" onClick={handleClick}>
      <span className="ds-today-tag">
        <IcoSparkle size={12} />
        {fact.type} hôm nay
      </span>
      <div className="ds-today-content">{fact.content}</div>
      <div className="ds-today-hint">
        <IcoSparkle size={14} />
        <span>{fact.hint || 'Bấm để hỏi AI về điều này'}</span>
      </div>
    </button>
  );
}

function ConfirmDialog({ state, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (state && !d.open) d.showModal();
    if (!state && d.open) d.close();
  }, [state]);
  return (
    <dialog ref={ref} className="ds-confirm" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {state && (
        <>
          <h3>{state.title}</h3>
          <p>{state.body}</p>
          <div className="ds-confirm-actions">
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="button" className="danger" onClick={() => { state.onOk(); onClose(); }}>{state.okLabel || 'Đồng ý'}</button>
          </div>
        </>
      )}
    </dialog>
  );
}

function Lightbox({ state, onChange, onClose }) {
  const { list, index } = state;
  const many = list.length > 1;
  const touchX = useRef(null);

  const go = useCallback((d) => {
    onChange({ list, index: (index + d + list.length) % list.length });
  }, [list, index, onChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (many && e.key === 'ArrowLeft') go(-1);
      else if (many && e.key === 'ArrowRight') go(1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, onClose, many]);

  const src = list[index];
  if (!src) return null;

  return (
    <div
      className="ds-lightbox"
      onClick={onClose}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (!many || touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
      }}
    >
      <div className="ds-lightbox-bar" onClick={(e) => e.stopPropagation()}>
        {many && <span className="ds-lightbox-count">{index + 1} / {list.length}</span>}
        <a className="ds-lightbox-btn" href={src} download={`anh-${index + 1}.jpg`} aria-label="Tải ảnh về" title="Tải ảnh về">
          <IcoDownload size={20} />
        </a>
        <button type="button" className="ds-lightbox-btn" onClick={onClose} aria-label="Đóng" title="Đóng"><IcoClose size={20} /></button>
      </div>
      {many && (
        <button type="button" className="ds-lightbox-nav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Ảnh trước">
          <IcoChevL size={26} />
        </button>
      )}
      <img key={src} src={src} alt={`Ảnh ${index + 1}`} onClick={(e) => e.stopPropagation()} />
      {many && (
        <button type="button" className="ds-lightbox-nav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Ảnh sau">
          <IcoChevR size={26} />
        </button>
      )}
    </div>
  );
}

function QuotaRing({ left, total, size = 34, label }) {
  const pct = total === Infinity ? 100 : Math.max(0, (left / total) * 100);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';

  return (
    <span className="ds-quota-ring" title={`Còn ${left}/${total} ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".15" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .5s, stroke .3s' }}
        />
      </svg>
      <b style={{ color }}>{total === Infinity ? '∞' : left}</b>
    </span>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function AIChat({ onExit }) {
  const { user, tier: authTier, logout } = useAuth();
  const tier = useMemo(() => authTier || {
    key: 'free',
    name: 'Free',
    color: '#64748b',
    quotaText: 5,
    quotaImage: 2,
  }, [authTier]);
  const uid = user?.uid;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chats, setChats] = useLocalStorage('cs-ai-chats', []);
  const [activeId, setActiveId] = useLocalStorage('cs-ai-active', null);

  const [input, setInput] = useState(readDraft);
  const [sugSeed, setSugSeed] = useState(() => Date.now() % 100000);
  const [images, setImages] = useState([]);
  const [grade, setGrade] = useLocalStorage('cs-ai-grade', 'Tự động');
  const [casioOpen, setCasioOpen] = useState(false);
  const [quickRefOpen, setQuickRefOpen] = useState(false);
  const [symbolBarOpen, setSymbolBarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'bookmarks'
  const [bookmarks, setBookmarks] = useLocalStorage('cs-ai-bookmarks', []);
  const [canvasWidthPct, setCanvasWidthPct] = useLocalStorage('cs-ai-canvas-w', 50);
  const [isResizingCanvas, setIsResizingCanvas] = useState(false);
  const [sidebarManualExpand, setSidebarManualExpand] = useState(false);
  const stageSplitRef = useRef(null);
  /* Chế độ học: điều khiển cách AI trả lời (giải chi tiết / gợi ý từng bước / kiểm tra đáp án...) */
  const [mode, setMode] = useLocalStorage('cs-ai-mode', 'auto');
  const [activeInteractiveQuiz, setActiveInteractiveQuiz] = useState(null);
  const [activeChalkboardLesson, setActiveChalkboardLesson] = useState(null);
  const [plainViewMsgIds, setPlainViewMsgIds] = useState(() => new Set());
  const [openVideoMsgIds, setOpenVideoMsgIds] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const [streaming, setStreaming] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [openReasoningIds, setOpenReasoningIds] = useState(() => new Set());
  const toggleReasoningFor = (idx) => setOpenReasoningIds((prev) => {
    const next = new Set(prev);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });
  const [err, setErr] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('cs-ai-sidebar-collapsed', false);
  const [deepThink, setDeepThink] = useLocalStorage('cs-ai-deepthink', false);
  const [subjectLens, setSubjectLens] = useLocalStorage('cs-ai-subject-lens', 'all');
  const [tempMode, setTempMode] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);

  useEffect(() => {
    if (!uid) {
      setCreditBalance(null);
      return undefined;
    }
    let alive = true;
    getCredits(uid).then((c) => {
      if (alive && c && Number.isFinite(Number(c.balance))) setCreditBalance(Number(c.balance));
    }).catch(() => {});
    const onCreditEvt = (e) => {
      const b = e?.detail?.balance;
      if (Number.isFinite(Number(b))) setCreditBalance(Number(b));
    };
    window.addEventListener('cs-credit-update', onCreditEvt);
    return () => {
      alive = false;
      window.removeEventListener('cs-credit-update', onCreditEvt);
    };
  }, [uid]);
  const [liveElapsedSec, setLiveElapsedSec] = useState(0);
  const [exportingDocxIdx, setExportingDocxIdx] = useState(null);
  const tempChatIdsRef = useRef(new Set());
  const [aiTheme, setAiTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement?.dataset?.theme === 'dark' ? 'dark' : 'light'
  );

  // Live thinking timer (DeepSeek / Claude style "Đang suy luận 2.4s")
  useEffect(() => {
    if (busyId === null) {
      setLiveElapsedSec(0);
      return undefined;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setLiveElapsedSec(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(id);
  }, [busyId]);

  // Keyboard Shortcuts kiểu ChatGPT & Claude: Ctrl+K tìm hội thoại, Ctrl+Shift+O chat mới
  useEffect(() => {
    const onGlobalKey = (e) => {
      if (!visibleRef.current) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSidebarCollapsed(false);
        setSidebarOpen(true);
        setTimeout(() => document.getElementById('gm-sidebar-search-input')?.focus(), 120);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        newChatRef.current?.();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  // Tự dọn các đoạn chat tạm thời khi tắt chế độ hoặc rời trang
  useEffect(() => () => {
    if (tempChatIdsRef.current.size > 0) {
      const ids = Array.from(tempChatIdsRef.current);
      setChats((prev) => prev.filter((c) => !ids.includes(c.id)));
      tempChatIdsRef.current.clear();
    }
  }, []);

  const toggleTempMode = () => {
    setTempMode((prev) => {
      const next = !prev;
      if (!next && tempChatIdsRef.current.size > 0) {
        const ids = Array.from(tempChatIdsRef.current);
        setChats((list) => list.filter((c) => !ids.includes(c.id)));
        tempChatIdsRef.current.clear();
        setActiveId(null);
      } else if (next) {
        setActiveId(null);
      }
      return next;
    });
  };

  const handleExportMsgDocx = async (text, idx) => {
    if (!text || exportingDocxIdx !== null) return;
    setExportingDocxIdx(idx);
    try {
      const { exportAiNoteDocx } = await import('../lib/examExport.js');
      await exportAiNoteDocx({
        title: activeChat?.title || 'LỜI GIẢI & TÓM TẮT ELEC AI',
        content: text,
        teacherName: userName || 'Học sinh ELEC AI',
        schoolName: 'ELEC AI · TÀI LIỆU TỰ HỌC KHTN',
      });
    } catch (e) {
      console.warn('Export Word failed:', e);
    } finally {
      setExportingDocxIdx(null);
    }
  };

  useEffect(() => {
    const syncTheme = () => {
      setAiTheme(document.documentElement?.dataset?.theme === 'dark' ? 'dark' : 'light');
    };
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const onResize = () => {
      if (window.innerWidth <= 960) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const toggleAiTheme = () => {
    const next = aiTheme === 'dark' ? 'light' : 'dark';
    window.dispatchEvent(new CustomEvent('elec-toggle-theme'));
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('cs-theme-v2', JSON.stringify(next)); } catch { /* ignore */ }
    setAiTheme(next);
  };
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [quota, setQuota] = useState(() => getQuota(uid, tier));
  const [quotaError, setQuotaError] = useState('');
  const [credits, setCredits] = useState(null);
  const [query, setQuery] = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const [visible, setVisible] = useState(onAiPage);
  const [lightbox, setLightbox] = useState(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [processing, setProcessing] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [listening, setListening] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [pinnedIds, setPinnedIds] = useLocalStorage('cs-ai-pinned', []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [synced, setSynced] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useLocalStorage('cs-ai-autospeak', false);

  const [sidebarView, setSidebarView] = useState('folders');
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [selBar, setSelBar] = useState(null); // { text, x, y } — Highlight-to-Ask kiểu Claude/ChatGPT Canvas
  /* Menu header trên điện thoại: 'study' = trình độ + chế độ, 'more' = tùy chọn, null = đóng */
  const [hmenu, setHmenu] = useState(null);
  const [moreMenuId, setMoreMenuId] = useState(null);
  const [rowMenuId, setRowMenuId] = useState(null);   // menu ⋯ của dòng lịch sử (sidebar)

  const lastSeenLenRef = useRef(0);
  const mainRef = useRef(null);
  const end = useRef(null);
  const imagesRef = useRef([]);
  const docsRef = useRef([]);
  const dragDepth = useRef(0);
  const recRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const docRef = useRef(null);
  const cameraRef = useRef(null);
  const sendRef = useRef(null);
  const stopRef = useRef(null);
  const aiPromiseRef = useRef(null);
  const stickRef = useRef(true);
  const sendingRef = useRef(false);
  const visibleRef = useRef(visible);
  const chatsRef = useRef(chats);
  const qTimer = useRef(null);
  const newChatRef = useRef(null);
  visibleRef.current = visible;
  chatsRef.current = chats;
  imagesRef.current = images;
  docsRef.current = docs;

  const loading = busyId !== null;
  const activeChat = useMemo(() => {
    if (!activeId) return null;
    return chats.find((c) => c.id === activeId) || null;
  }, [chats, activeId]);
  const messages = activeChat?.messages || [];
  const showLive = loading && busyId === activeId;
  const lastMsg = messages[messages.length - 1];
  const canRetry = !loading && lastMsg?.role === 'user';

  useEffect(() => {
    setTtsSupported(tts.isSupported());
    return () => tts.stop();
  }, []);
  useEffect(() => {
    if (!visible) tts.stop();
  }, [visible]);

  // Đóng Canvas khi đổi đoạn chat
  useEffect(() => {
    setActiveInteractiveQuiz(null);
    setActiveChalkboardLesson(null);
  }, [activeId]);

  // Tự động mở Canvas khi AI vừa sinh xong một bộ bài tập trắc nghiệm mới
  useEffect(() => {
    if (loading || streaming) return;
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && last.role === 'model' && last.text) {
      const qData = getCachedQuiz(last.text);
      if (qData?.quiz && !activeInteractiveQuiz) {
        const isRecent = !last.createdAt || (Date.now() - last.createdAt < 20000);
        if (isRecent) {
          setActiveInteractiveQuiz(qData.quiz);
          setActiveChalkboardLesson(null);
        }
      }
      // Tự động nhảy sang giao diện Bảng vẽ hình học khi AI vừa giải bài hình ("Giải đến đâu vẽ tới đó")
      const cbData = getCachedChalkboard(last.text);
      if (cbData?.lesson && !activeChalkboardLesson) {
        const isRecent = !last.createdAt || (Date.now() - last.createdAt < 30000);
        if (isRecent) {
          setActiveChalkboardLesson(cbData.lesson);
          setActiveInteractiveQuiz(null);
        }
      }
    }
  }, [messages, loading, streaming]);

  /* SYNC CHAT LÊN SERVER */
  useEffect(() => {
    if (!uid) { setSynced(true); return undefined; }

    let cancelled = false;
    (async () => {
      try {
        const serverChats = await fetchChatsServer(uid);
        if (cancelled) return;

        if (serverChats.length > 0) {
          const mapped = serverChats.map((c) => ({
            id: c.id,
            title: c.title,
            messages: c.messages || [],
            createdAt: new Date(c.created_at).getTime(),
            updatedAt: new Date(c.updated_at).getTime(),
          }));
          setChats(mapped);
          setPinnedIds(serverChats.filter((c) => c.pinned).map((c) => c.id));

          if (activeId && !mapped.some((c) => c.id === activeId)) {
            setActiveId(mapped[0]?.id || null);
          }
        } else {
          const local = chatsRef.current || [];
          if (local.length > 0) {
            try {
              await migrateLocalChats(uid, local);
            } catch (e) {
              console.warn('[AIChat] Migrate fail:', e.message);
            }
          }
        }

        if (!cancelled) setSynced(true);
      } catch (e) {
        console.warn('[AIChat] Không load được chat từ server:', e.message);
        if (!cancelled) setSynced(true);
      }
    })();

    return () => {
      cancelled = true;
      cancelAllSyncs();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !synced) return undefined;
    const timer = setTimeout(() => {
      const now = Date.now();
      const recent = (chatsRef.current || []).filter(
        (c) => now - (c.updatedAt || 0) < 30000
      );
      recent.forEach((c) => {
        debouncedSync(c.id, {
          title: c.title,
          messages: slimServerMessages(c.messages),
          pinned: pinnedIds.includes(c.id),
        });
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [chats, pinnedIds, uid, synced]);

  /* Auto TTS */
  useEffect(() => {
    if (!autoSpeak || !ttsSupported) return;
    if (loading) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'model' || !last.text) return;
    if (speakingId) return;

    const id = `auto-${messages.length}`;
    setSpeakingId(id);
    tts.speak(last.text)
      .catch(() => {})
      .finally(() => setSpeakingId((cur) => (cur === id ? null : cur)));
  }, [messages.length, autoSpeak, ttsSupported, loading]);

  /* ĐIỀU HƯỚNG */
  const goProfile = () => {
    setUserMenuOpen(false);
    if (!uid) {
      location.hash = 'login';
      return;
    }
    location.hash = 'profile';
  };
  const goUpgrade = () => {
    setUserMenuOpen(false);
    if (!uid) {
      try { localStorage.setItem('cs-profile-tab', 'upgrade'); } catch { /* */ }
      location.hash = 'register';
      return;
    }
    try { localStorage.setItem('cs-profile-tab', 'upgrade'); } catch { /* */ }
    location.hash = 'profile';
  };
  const askConfirm = (cfg) => setConfirmState(cfg);
  const closeConfirm = useCallback(() => setConfirmState(null), []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    askConfirm({ title: 'Đăng xuất?', body: 'Bạn sẽ quay về trang đăng nhập.', okLabel: 'Đăng xuất', onOk: logout });
  };

  const consumePending = useCallback(() => {
    try {
      const raw = localStorage.getItem('cs-ai-pending');
      if (!raw) return;
      localStorage.removeItem('cs-ai-pending');
      const pending = JSON.parse(raw);
      if (Date.now() - pending.t > 5000) return;
      if (pending.grade) setGrade(pending.grade);
      if (pending.text) setTimeout(() => sendRef.current?.(pending.text), 300);
    } catch (e) {
      console.error('Pending load error:', e);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const v = onAiPage();
      setVisible(v);
      if (v) { consumePending(); setTimeout(() => inputRef.current?.focus(), 120); }
    };
    sync();
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, [consumePending]);

  useEffect(() => {
    const onNewChat = () => newChatRef.current?.();
    window.addEventListener('cs-new-chat', onNewChat);
    return () => window.removeEventListener('cs-new-chat', onNewChat);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setUserMenuOpen(false);
      setSidebarOpen(false);
      setShowQuickPrompts(false);
      setAttachOpen(false);
      setMoreMenuId(null);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const close = () => setUserMenuOpen(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!attachOpen) return undefined;
    const close = (e) => {
      if (e.target.closest('.ds-attach-menu') || e.target.closest('.ds-icon-attach')) return;
      setAttachOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [attachOpen]);

  useEffect(() => {
    if (!rowMenuId) return undefined;
    const close = (e) => {
      if (e.target.closest('.cg-row-menu') || e.target.closest('.cg-row-more')) return;
      setRowMenuId(null);
    };
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [rowMenuId]);

  useEffect(() => {
    if (!moreMenuId) return undefined;
    const close = (e) => {
      if (e.target.closest('.ds-more-wrap')) return;
      setMoreMenuId(null);
    };
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [moreMenuId]);

  /* CUỘN — theo dõi trực tiếp scrollTop của container .ds-main thay vì IntersectionObserver không có root */
  const hasMessages = messages.length > 0;
  const syncJumpVisibility = useCallback(() => {
    const scroller = mainRef.current;
    if (!scroller || !hasMessages) {
      stickRef.current = true;
      setShowJump(false);
      return;
    }
    const distFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    const canScroll = scroller.scrollHeight > scroller.clientHeight + 90;
    const isNearBottom = distFromBottom <= 90;
    stickRef.current = isNearBottom;
    setShowJump(canScroll && distFromBottom > 110);
    if (isNearBottom) {
      setUnreadCount(0);
      lastSeenLenRef.current = messages.length;
    }
  }, [hasMessages, messages.length]);

  useEffect(() => {
    const scroller = mainRef.current;
    if (!scroller) return undefined;
    const onScroll = () => syncJumpVisibility();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => syncJumpVisibility());
      ro.observe(scroller);
    }
    const raf = requestAnimationFrame(syncJumpVisibility);
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, [syncJumpVisibility, activeId]);

  useEffect(() => {
    stickRef.current = true;
    const scroller = mainRef.current;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    } else {
      end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    const t = setTimeout(syncJumpVisibility, 240);
    return () => clearTimeout(t);
  }, [messages.length, activeId, syncJumpVisibility]);

  useEffect(() => {
    if (!stickRef.current) return;
    if (busyId !== activeId) return;
    const scroller = mainRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    else end.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [streaming, reasoning, busyId, activeId]);

  useEffect(() => {
    if (stickRef.current) {
      lastSeenLenRef.current = messages.length;
      setUnreadCount(0);
    } else if (messages.length > lastSeenLenRef.current) {
      setUnreadCount(messages.length - lastSeenLenRef.current);
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    const scroller = mainRef.current;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    } else {
      end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    stickRef.current = true;
    setShowJump(false);
    setUnreadCount(0);
    lastSeenLenRef.current = messages.length;
  }, [messages.length]);

  const togglePin = useCallback((id, e) => {
    e?.stopPropagation();
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      updateChatServer(id, { pinned: next.includes(id) }).catch(() => {});
      return next;
    });
  }, [setPinnedIds]);

  /* KHÁC */
  useEffect(() => {
    if (!activeId && chats.length > 0) setActiveId(chats[0].id);
  }, [chats.length, activeId, setActiveId, chats]);

  useEffect(() => {
    const onUpdate = () => setQuota(getQuota(uid, tier));
    addEventListener('cs-quota-update', onUpdate);
    return () => removeEventListener('cs-quota-update', onUpdate);
  }, [uid, tier]);

  useEffect(() => { if (uid) setQuota(getQuota(uid, tier)); }, [uid, tier]);

  useEffect(() => {
    if (!uid) {
      setCredits(null);
      return;
    }
    getCredits(uid).then((c) => setCredits(c?.balance ?? 0)).catch(() => {});
    const onCreditEvt = (e) => {
      if (e.detail?.balance != null) {
        setCredits(e.detail.balance);
      } else if (e.detail?.delta != null) {
        setCredits((prev) => (prev != null ? prev + e.detail.delta : e.detail.delta));
      }
    };
    window.addEventListener('cs-credit-update', onCreditEvt);
    return () => window.removeEventListener('cs-credit-update', onCreditEvt);
  }, [uid]);
  useEffect(() => () => clearTimeout(qTimer.current), []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (input) localStorage.setItem(DRAFT_KEY, input.slice(0, 4000));
        else localStorage.removeItem(DRAFT_KEY);
      } catch { /* */ }
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    document.body.classList.toggle('on-ai-page', visible);
    return () => document.body.classList.remove('on-ai-page');
  }, [visible]);

  useEffect(() => {
    const lock = visible && (Boolean(lightbox) || (sidebarOpen && matchMedia('(max-width: 900px)').matches));
    document.body.classList.toggle('ds-lock', lock);
    return () => document.body.classList.remove('ds-lock');
  }, [visible, lightbox, sidebarOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (!visibleRef.current) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.target?.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  /* BÔI ĐEN ĐỂ HỎI TẠI CHỖ (CLAUDE ARTIFACTS × CHATGPT CANVAS HIGHLIGHT-TO-ASK) */
  useEffect(() => {
    const onSelUp = () => {
      try {
        const sel = window.getSelection?.();
        if (!sel || sel.isCollapsed) {
          setSelBar(null);
          return;
        }
        const txt = sel.toString().trim();
        if (txt.length < 4 || txt.length > 340) {
          setSelBar(null);
          return;
        }
        const anchorEl = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
        if (!anchorEl?.closest?.('.ds-msg-model .ds-msg-content')) {
          setSelBar(null);
          return;
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          setSelBar(null);
          return;
        }
        const cx = Math.max(150, Math.min(window.innerWidth - 150, rect.left + rect.width / 2));
        const cy = Math.max(66, rect.top - 10);
        setSelBar({ text: txt, x: cx, y: cy });
      } catch {
        setSelBar(null);
      }
    };
    const onDismiss = (e) => {
      if (e.target?.closest?.('.elec-sel-bar')) return;
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      setSelBar(null);
    };
    document.addEventListener('mouseup', onSelUp);
    document.addEventListener('touchend', onSelUp);
    document.addEventListener('keydown', onDismiss);
    window.addEventListener('scroll', onDismiss, true);
    return () => {
      document.removeEventListener('mouseup', onSelUp);
      document.removeEventListener('touchend', onSelUp);
      document.removeEventListener('keydown', onDismiss);
      window.removeEventListener('scroll', onDismiss, true);
    };
  }, []);

  /* ẢNH & TÀI LIỆU PDF / DOCX / TXT */
  const handleFiles = useCallback(async (files) => {
    const fileArr = Array.from(files || []);
    if (fileArr.length === 0) return;

    const imgs = fileArr.filter(isImageFile);
    const docFiles = fileArr.filter((f) => !isImageFile(f) && isDocumentFile(f));

    if (imgs.length === 0 && docFiles.length === 0) {
      setErr('Chỉ hỗ trợ ảnh (JPG, PNG, WebP, HEIC) hoặc tài liệu (PDF, DOCX, XLSX, TXT).');
      return;
    }

    if (docFiles.length > 0) {
      const docRoom = 3 - docsRef.current.length;
      if (docRoom <= 0) {
        setErr('Chỉ đính kèm tối đa 3 tài liệu mỗi lượt hỏi.');
      } else {
        const takeDocs = docFiles.slice(0, docRoom);
        setProcessing((p) => p + takeDocs.length);
        const parsedDocs = [];
        let docErr = '';
        for (const df of takeDocs) {
          try {
            const parsed = await readChatDocument(df);
            parsedDocs.push(parsed);
          } catch (e) {
            docErr = e?.message || `Không đọc được tệp ${df.name}`;
          } finally {
            setProcessing((p) => Math.max(0, p - 1));
          }
        }
        if (parsedDocs.length > 0) {
          setDocs((prev) => [...prev, ...parsedDocs].slice(0, 3));
        }
        if (docErr) setErr(docErr);
      }
    }

    if (imgs.length === 0) return;

    const room = MAX_IMAGES - imagesRef.current.length;
    if (room <= 0) {
      setErr(`Chỉ được gửi tối đa ${MAX_IMAGES} ảnh mỗi lần.`);
      return;
    }
    const take = imgs.slice(0, room);
    setErr(imgs.length > room ? `Chỉ nhận ${room} ảnh đầu — tối đa ${MAX_IMAGES} ảnh.` : '');

    setProcessing((p) => p + take.length);
    const results = [];
    let lastError = '';
    for (const f of take) {
      try {
        const compressed = await compressImage(f);
        const thumb = await makeThumb(compressed.dataUrl);
        results.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...compressed,
          thumb,
          name: f.name || 'ảnh',
        });
      } catch (e) {
        lastError = e?.message || 'Không đọc được ảnh.';
        console.warn('Bỏ qua ảnh lỗi:', f.name, e);
      } finally {
        setProcessing((p) => Math.max(0, p - 1));
      }
    }

    if (results.length === 0) {
      setErr(lastError || 'Không đọc được ảnh nào. Thử ảnh khác nhé.');
      return;
    }
    setImages((prev) => [...prev, ...results].slice(0, MAX_IMAGES));
    if (lastError) setErr(`Một số ảnh bị bỏ qua: ${lastError}`);
  }, []);

  const pickImages = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    handleFiles(files);
  };

  const removeImage = (id) => setImages((prev) => prev.filter((img) => img.id !== id));
  const clearImages = () => setImages([]);
  const removeDoc = (id) => setDocs((prev) => prev.filter((d) => d.id !== id));
  const clearDocs = () => setDocs([]);

  useEffect(() => {
    const onPaste = (e) => {
      if (!visibleRef.current) return;
      const items = [...(e.clipboardData?.items || [])];
      const files = items
        .filter((i) => i.type.startsWith('image/'))
        .map((i) => i.getAsFile())
        .filter(Boolean);
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    };
    addEventListener('paste', onPaste);
    return () => removeEventListener('paste', onPaste);
  }, [handleFiles]);

  /* NHẬP BẰNG GIỌNG NÓI */
  const toggleVoice = () => {
    if (!SpeechRec) { setErr('Trình duyệt này chưa hỗ trợ nhập giọng nói. Hãy dùng Chrome hoặc Safari mới.'); return; }
    if (recRef.current) { recRef.current.stop(); return; }
    const rec = new SpeechRec();
    rec.lang = 'vi-VN';
    rec.interimResults = true;
    rec.continuous = true;
    const base = input ? input.replace(/\s*$/, ' ') : '';
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      setInput((base + finalText + interim).slice(0, 4000));
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setErr('Hãy cho phép quyền micro để dùng nhập giọng nói.');
    };
    rec.onend = () => { recRef.current = null; setListening(false); };
    try { rec.start(); recRef.current = rec; setListening(true); setErr(''); } catch { /* đang chạy */ }
  };
  useEffect(() => () => recRef.current?.abort?.(), []);

  /* TTS */
  const speakMsg = async (text, id) => {
    if (!ttsSupported) return;
    if (speakingId === id) {
      tts.stop();
      setSpeakingId(null);
      return;
    }
    try {
      tts.stop();
      setSpeakingId(id);
      await tts.speak(text, { rate: 1.0 });
    } catch (e) {
      console.warn('[TTS]', e.message);
    } finally {
      setSpeakingId((cur) => (cur === id ? null : cur));
    }
  };

  /* XUẤT CHAT */
  const exportChat = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    const lines = [`# ${activeChat.title}`, ''];
    activeChat.messages.forEach((m) => {
      if (m.role === 'user') {
        const n = m.preview?.images?.length || 0;
        lines.push(`**Bạn:** ${m.preview?.text || ''}${n ? ` _(kèm ${n} ảnh)_` : ''}`, '');
      } else {
        lines.push('**Trợ lý:**', m.text || '', '');
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeChat.title || 'cuoc-tro-chuyen').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 40) + '.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* ĐỔI TÊN CHAT */
  const startRename = (c, e) => {
    e?.stopPropagation();
    setRenamingId(c.id);
    setRenameVal(c.title || '');
  };
  const commitRename = () => {
    const t = renameVal.trim();
    const id = renamingId;
    if (t && id) {
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: t.slice(0, 60) } : c)));
      updateChatServer(id, { title: t.slice(0, 60) }).catch(() => {});
    }
    setRenamingId(null);
  };

  /* SỬA TIN NHẮN */
  const editMessage = (idx) => {
    if (loading || !activeChat) return;
    const m = activeChat.messages[idx];
    if (!m || m.role !== 'user') return;
    setInput(m.preview?.text || '');
    setImages((m.preview?.images || []).slice(0, MAX_IMAGES).map((im, k) => ({
      id: `edit-${Date.now()}-${k}`,
      dataUrl: im.dataUrl,
      thumb: im.dataUrl,
      base64: im.dataUrl.split(',')[1],
      mimeType: (im.dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg',
      width: im.width,
      height: im.height,
      name: `ảnh ${k + 1}`,
    })));
    updateChat(activeChat.id, (c) => ({ ...c, messages: c.messages.slice(0, idx) }));
    setErr('');
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  /* QUẢN LÝ CHAT */
  const newChat = () => {
    const id = rid();
    const chat = { id, title: 'Trò chuyện mới', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    setChats((prev) => [chat, ...prev].slice(0, MAX_CHATS));
    setActiveId(id);
    setSidebarOpen(false);
    setSidebarView('folders');
    setSelectedFolderKey(null);
    setExpandedId(null);
    setInput('');
    setImages([]);
    setErr('');
    tts.stop();
    setSpeakingId(null);
    setTimeout(() => inputRef.current?.focus(), 100);

    if (uid) {
      createChatServer(uid, chat).catch((e) => console.warn('[AIChat] createChat fail:', e.message));
    }
  };

  newChatRef.current = newChat;

  const updateChat = (id, updater) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c)));
  };

  const deleteChat = (id, e) => {
    e?.stopPropagation();
    askConfirm({
      title: 'Xóa cuộc trò chuyện?',
      body: 'Cuộc trò chuyện này sẽ bị xóa khỏi thiết bị và server.',
      okLabel: 'Xóa',
      onOk: () => {
        const rest = chatsRef.current.filter((c) => c.id !== id);
        setChats(rest);
        if (activeId === id) setActiveId(rest[0]?.id || null);
        setPinnedIds((prev) => prev.filter((x) => x !== id));
        deleteChatServer(id).catch((err) => console.warn('[AIChat] deleteChat fail:', err.message));
      },
    });
  };

  const deleteAll = () => {
    askConfirm({
      title: 'Xóa tất cả cuộc trò chuyện?',
      body: 'Không thể hoàn tác.',
      okLabel: 'Xóa tất cả',
      onOk: () => {
        setChats([]);
        setActiveId(null);
        setPinnedIds([]);
        tts.stop();
        setSpeakingId(null);
        if (uid) {
          deleteAllChatsServer(uid).catch((err) => console.warn('[AIChat] deleteAll fail:', err.message));
        }
      },
    });
  };

  const openChat = (chatId) => {
    setActiveId(chatId);
    setSidebarOpen(false);
    setErr('');
    stickRef.current = true;
    setUnreadCount(0);
    tts.stop();
    setSpeakingId(null);
  };

  const toggleExpand = (chatId, e) => {
    e?.stopPropagation();
    setExpandedId((prev) => (prev === chatId ? null : chatId));
  };

  const jumpToMessage = (chatId, msgIdx) => {
    openChat(chatId);
    setTimeout(() => {
      const el = document.querySelector(`[data-msg-idx="${msgIdx}"]`);
      if (!el) return;
      stickRef.current = false;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ds-msg-highlight');
      setTimeout(() => el.classList.remove('ds-msg-highlight'), 1500);
    }, 200);
  };

  const openFolder = (key) => {
    setSelectedFolderKey(key);
    setSidebarView('list');
  };
  const closeFolder = () => {
    setSidebarView('folders');
    setSelectedFolderKey(null);
  };

  /* GỌI AI */
  const denyQuota = (hasImg) => {
    if (canSend(uid, tier, hasImg)) return false;
    setQuotaError(
      hasImg
        ? `Bạn đã dùng hết ${tier.quotaImage} lượt gửi ảnh hôm nay. Quay lại vào ngày mai nhé!`
        : `Bạn đã dùng hết ${tier.quotaText} lượt chat hôm nay. Nâng cấp VIP để nhận thêm Credit hoặc nạp thêm điểm để tiếp tục!`
    );
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => setQuotaError(''), 6000);
    return true;
  };

  const run = async (chatId, baseMessages) => {
    setErr('');
    setBusyId(chatId);
    setStreaming('');
    setReasoning('');
    tts.stop();
    setSpeakingId(null);

    const reqStartedAt = Date.now();
    let finalText = '';
    let finalReasoning = '';
    let finalMeta = null;   // citations / toolHits / verification do động cơ AI trả về
    if (tempMode && chatId) tempChatIdsRef.current.add(chatId);
    let timedOut = false;
    let stopped = false;

    try {
      const recent = baseMessages.slice(-8);
      const trimmed = recent[0]?.role === 'model' ? recent.slice(1) : recent;
      const apiHistory = trimmed.map((m, i) => ({
        role: m.role,
        parts: i === trimmed.length - 1 ? m.parts : m.parts.filter((p) => !p.inlineData),
      }));

      let raf = 0;
      let pendText = null;
      let pendReason = null;
      const flush = () => {
        raf = 0;
        if (pendText !== null) { setStreaming(pendText); pendText = null; }
        if (pendReason !== null) { setReasoning(pendReason); pendReason = null; }
      };
      const schedule = () => { if (!raf) raf = requestAnimationFrame(flush); };

      let timer;
      let arm = () => {};
      const watchdog = new Promise((_, reject) => {
        arm = () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            timedOut = true;
            reject(new Error('AI không phản hồi (quá 80 giây). Kiểm tra mạng hoặc API rồi thử lại.'));
          }, 80000);
        };
        arm();
      });
      const stopPromise = new Promise((resolve) => {
        stopRef.current = () => {
          stopped = true;
          if (aiPromiseRef.current?.abort) {
            try { aiPromiseRef.current.abort(); } catch {}
          }
          resolve('stopped');
        };
      });

      try {
        const aiPromise = askAI(
          apiHistory,
          (partial) => {
            if (timedOut || stopped) return;
            arm();
            pendText = partial;
            schedule();
            finalText = partial;
          },
          (part) => {
            if (timedOut || stopped) return;
            arm();
            pendReason = part;
            schedule();
            finalReasoning = part;
          },
          {
            grade: grade && grade !== 'Tự động' ? grade : '',
            mode: (deepThink && mode === 'auto') ? 'detail' : mode,
            subject: subjectLens,
            deepThink,
            uid,
            /* Chỉ kích hoạt thẩm định chéo sâu khi người dùng chủ động bật DeepThink (tránh gọi model phụ làm chậm/nhiễu câu trả lời thường) */
            deepVerify: deepThink,
          }
        );
        aiPromiseRef.current = aiPromise;

        const raced = await Promise.race([aiPromise, watchdog, stopPromise]);
        if (raced && typeof raced === 'object') finalMeta = raced;
        if (finalMeta?.reasoning && !finalReasoning) finalReasoning = finalMeta.reasoning;
      } finally {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        aiPromiseRef.current = null;
      }

      if (!finalText && !finalReasoning) {
        if (stopped) return { ok: true, reason: 'user_stopped' };
        throw new Error('AI trả về rỗng. Thử gửi lại câu hỏi.');
      }

      const thinkSec = Number(Math.max(0.4, (Date.now() - reqStartedAt) / 1000).toFixed(1));
      updateChat(chatId, (c) => ({
        ...c,
        messages: [...slim(baseMessages), {
          role: 'model',
          parts: [{ text: finalText }],
          text: finalText,
          reasoning: finalReasoning,
          thinkSec,
          usedDeepThink: deepThink,
          citations: finalMeta?.citations || undefined,
          toolHits: finalMeta?.toolHits || undefined,
          verification: finalMeta?.verification || undefined,
          modelUsed: finalMeta?.model,
          stopped,
        }],
      }));

      return { ok: true };
    } catch (e) {
      if (e?.isAbort || stopped) {
        if (finalText) {
          updateChat(chatId, (c) => ({
            ...c,
            messages: [...slim(baseMessages), {
              role: 'model',
              parts: [{ text: finalText }],
              text: finalText,
              reasoning: finalReasoning,
              stopped: true,
            }],
          }));
        }
        return { ok: true, reason: 'user_stopped' };
      }

      if (e?.isQuota) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...slim(baseMessages), {
            role: 'model',
            parts: [{ text: e.message }],
            text: e.message,
            isQuotaError: true,
          }],
        }));
        return { ok: false, reason: 'quota' };
      } else if (finalText) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...slim(baseMessages), {
            role: 'model',
            parts: [{ text: finalText }],
            text: finalText,
            reasoning: finalReasoning,
            stopped: true,
          }],
        }));
        setErr(e.message || 'Kết nối bị gián đoạn.');
        return { ok: true, reason: 'partial' };
      } else {
        setErr(e.message || 'Lỗi gọi AI.');
        return { ok: false, reason: e.message || 'error' };
      }
    } finally {
      stopRef.current = null;
      setStreaming('');
      setReasoning('');
      setBusyId(null);
    }
  };

  const send = async (overrideText) => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    try {
      const text = (typeof overrideText === 'string' ? overrideText : input).trim();
      const attachedDocs = docsRef.current || [];
      if ((!text && images.length === 0 && attachedDocs.length === 0) || loading || processing > 0) return;

      const imgCount = images.length + attachedDocs.filter((d) => d.base64).length;
      const textDocCount = attachedDocs.filter((d) => !d.base64).length;

      let charged = 0;
      if (uid) {
        const cr = await spendCredit(uid, imgCount, null, { deepThink, docCount: textDocCount });
        if (!cr.ok) {
          setCreditBalance(cr.balance);
          setQuotaError(
            cr.isSystemError
              ? `Lỗi trừ ELEC Credit tạm thời: ${cr.error || 'Vui lòng thử lại sau vài giây.'}`
              : `Không đủ ELEC Credit! Số dư ${formatCredits(cr.balance)}, cần ${formatCredits(cr.needed)} Credit. Bấm "Mua ELEC Credit" để nạp thêm.`
          );
          clearTimeout(qTimer.current);
          qTimer.current = setTimeout(() => setQuotaError(''), 8000);
          try { window.dispatchEvent(new CustomEvent('cs-credit-update', { detail: { balance: cr.balance } })); } catch {}
          return;
        }
        charged = cr.cost;
        setCreditBalance(cr.balance);
        try { window.dispatchEvent(new CustomEvent('cs-credit-update', { detail: { balance: cr.balance } })); } catch {}
      } else {
        if (denyQuota(imgCount > 0)) return;
        setQuotaError('');
        const nq = consumeQuota(uid, tier, imgCount > 0);
        if (nq) setQuota(nq);
      }

      const fallbackTitle = attachedDocs.length > 0
        ? `Tài liệu: ${attachedDocs[0].name.slice(0, 28)}`
        : (images.length > 1 ? `${images.length} ảnh` : 'Phân tích ảnh');

      let chatId = activeId;
      let current = activeChat;
      if (!chatId || !current) {
        const newId = rid();
        current = {
          id: newId,
          title: text ? text.slice(0, 40) : fallbackTitle,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const created = current;
        setChats((prev) => [created, ...prev].slice(0, MAX_CHATS));
        setActiveId(newId);
        chatId = newId;

        if (uid) {
          createChatServer(uid, created).catch(() => {});
        }
      }

      const parts = [];
      const defaultText = attachedDocs.length > 0
        ? 'Hãy phân tích, tóm tắt các ý trọng tâm và công thức cốt lõi trong tài liệu đính kèm (kèm trích dẫn [Trang X] nếu là PDF).'
        : (images.length > 1 ? 'Phân tích các ảnh này.' : 'Phân tích ảnh này.');
      const docPromptBlock = formatDocsPromptBlock(attachedDocs);
      const userText = [text || defaultText, docPromptBlock].filter(Boolean).join('\n\n');
      parts.push({ text: userText });

      for (const img of images) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
      }
      for (const d of attachedDocs) {
        if (d.base64 && d.mimeType) {
          parts.push({ inlineData: { mimeType: d.mimeType, data: d.base64 } });
        }
      }

      const userMsg = {
        role: 'user',
        parts,
        preview: {
          text: text || (attachedDocs.length > 0 ? `Phân tích tài liệu: ${attachedDocs.map((d) => d.name).join(', ')}` : ''),
          images: images.map((img) => ({
            dataUrl: img.thumb || img.dataUrl,
            width: img.width,
            height: img.height,
          })),
          docs: attachedDocs.map((d) => ({
            id: d.id,
            name: d.name,
            kind: d.kind,
            metaLabel: d.metaLabel,
          })),
        },
      };

      const baseMessages = [...current.messages, userMsg];

      updateChat(chatId, (c) => ({
        ...c,
        messages: slim(baseMessages),
        title: c.messages.length === 0 ? (text ? text.slice(0, 40) : fallbackTitle) : c.title,
      }));

      recRef.current?.stop?.();
      setInput('');
      setImages([]);
      setDocs([]);
      setSelBar(null);
      setShowQuickPrompts(false);
      setAttachOpen(false);
      stickRef.current = true;

      const result = await run(chatId, baseMessages);

      if (charged > 0 && result && result.ok === false) {
        try {
          await refundCredit(uid, charged, `Hoàn điểm: ${result.reason || 'AI lỗi'}`);
        } catch (e) {
          console.warn('[AIChat] refund fail:', e);
        }
      }
    } finally {
      sendingRef.current = false;
    }
  };
  sendRef.current = send;

  const regenerate = async (free = false) => {
    if (loading || !activeChat) return;

    const msgs = activeChat.messages;
    let i = msgs.length - 1;
    while (i >= 0 && msgs[i].role !== 'user') i--;
    if (i < 0) return;

    const imgList = msgs[i].preview?.images || [];
    const hasImg = msgs[i].parts?.some((p) => p.inlineData) || imgList.length > 0;
    const imgCount = imgList.length || (hasImg ? 1 : 0);

    let charged = 0;
    if (!free && uid) {
      const cr = await spendCredit(uid, imgCount, null, { deepThink });
      if (!cr.ok) {
        setCreditBalance(cr.balance);
        setQuotaError(
          cr.isSystemError
            ? `Lỗi trừ ELEC Credit tạm thời: ${cr.error || 'Vui lòng thử lại sau vài giây.'}`
            : `Không đủ ELEC Credit! Còn ${formatCredits(cr.balance)}, cần ${formatCredits(cr.needed)} Credit.`
        );
        clearTimeout(qTimer.current);
        qTimer.current = setTimeout(() => setQuotaError(''), 8000);
        try { window.dispatchEvent(new CustomEvent('cs-credit-update', { detail: { balance: cr.balance } })); } catch {}
        return;
      }
      charged = cr.cost;
      setCreditBalance(cr.balance);
      try { window.dispatchEvent(new CustomEvent('cs-credit-update', { detail: { balance: cr.balance } })); } catch {}
    } else if (!free && !uid) {
      if (denyQuota(hasImg)) return;
      const nq = consumeQuota(uid, tier, hasImg);
      if (nq) setQuota(nq);
    }

    const base = msgs.slice(0, i + 1).map((m, k) => (k === i ? withImages(m) : m));
    updateChat(activeChat.id, (c) => ({ ...c, messages: slim(base) }));
    stickRef.current = true;
    const result = await run(activeChat.id, base);

    if (charged > 0 && result && result.ok === false) {
      try {
        await refundCredit(uid, charged, `Hoàn điểm: ${result.reason || 'AI lỗi'}`);
      } catch (e) {
        console.warn('[AIChat] refund fail:', e);
      }
    }
  };

  const stop = () => {
    if (stopRef.current) {
      stopRef.current();
    } else if (aiPromiseRef.current?.abort) {
      try { aiPromiseRef.current.abort(); } catch {}
    }
  };

  const copyMsg = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setErr('Trình duyệt không cho phép sao chép.');
    }
  };

  const saveToNotebook = (msgText, msgIdx) => {
    try {
      const key = 'cs-wrong-notebook';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        id: Date.now(),
        text: stripMarkdown(msgText).slice(0, 500),
        createdAt: new Date().toISOString(),
        source: 'ai-chat',
      });
      localStorage.setItem(key, JSON.stringify(existing));

      try {
        recordWrongAnswers(user?.uid || 'guest', [{
          question: {
            id: `ai_${Date.now()}`,
            content: stripMarkdown(msgText).slice(0, 500),
            explanation: 'Ghi chú lưu từ Trợ lý AI Chem',
          },
          userPicked: null,
          isCorrect: false,
          examTitle: 'Trợ lý AI Chem',
          source: 'ai-chat',
        }]);
      } catch { /* ignore */ }

      setCopied('saved-' + msgIdx);
      setTimeout(() => setCopied((c) => (c === 'saved-' + msgIdx ? null : c)), 1500);
    } catch (e) {
      setErr('Không lưu được vào sổ tay.');
    }
  };

  const practiceSimilar = (msgText) => {
    const prompt = `Dựa vào bài toán sau, hãy tạo 3 bài tập tương tự (có đáp án):\n\n${stripMarkdown(msgText).slice(0, 500)}`;
    send(prompt);
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (isCoarse()) return;
    e.preventDefault();
    send();
  };

  /* DỮ LIỆU HIỂN THỊ */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? chats.filter((c) => (c.title || '').toLowerCase().includes(q))
      : chats;
    return [...arr].sort((a, b) => {
      const ap = pinnedIds.includes(a.id) ? 1 : 0;
      const bp = pinnedIds.includes(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return 0;
    });
  }, [chats, query, pinnedIds]);

  const groups = useMemo(() => groupChats(filtered), [filtered]);
  const suggestions = useMemo(() => pickSuggestions(sugSeed), [sugSeed]);

  const userName = user?.displayName || 'Ẩn danh';
  const firstName = useMemo(() => {
    const raw = (user?.displayName || '').trim();
    if (!raw) return '';
    const parts = raw.split(/\s+/).filter(Boolean);
    const fillers = new Set(['nè', 'ne', 'ơi', 'oi', 'nhé', 'nhe', 'nha', 'ạ', 'a', 'pro', 'vip', 'tk', 'official']);
    if (parts.length > 1 && fillers.has(parts[parts.length - 1].toLowerCase())) {
      return parts[0];
    }
    return parts.length <= 2 ? raw : parts[parts.length - 1];
  }, [user?.displayName]);
  const exitChat = () => {
    setSidebarOpen(false);
    if (onExit) onExit(); else location.hash = 'home';
  };
  const userInitial = (userName || user?.email || '?').trim().charAt(0).toUpperCase();
  const statusText = loading
    ? reasoning ? 'đang phân tích…' : streaming ? 'đang trả lời…' : 'đang suy nghĩ…'
    : 'sẵn sàng';
  const markMode = loading ? 'orbit' : 'idle';

  const hasInput = (Boolean(input.trim()) || images.length > 0 || docs.length > 0) && processing === 0;
  const placeholder = docs.length > 0
    ? `Đã đính kèm ${docs.length} tài liệu — hỏi về đề cương hoặc bấm Gửi…`
    : images.length > 0
      ? `Đã chọn ${images.length} ảnh — thêm mô tả (không bắt buộc)…`
      : 'Hỏi bài Lý, Hóa, Sinh, dán ảnh hoặc thả PDF…';

  /* ============================================================
     RENDER SIDEBAR
     ============================================================ */
  const renderChatItem = (c) => {
    const subMsgs = getChatMessages(c);
    const isExpanded = expandedId === c.id;
    const preview = getChatPreview(c);
    const isPinned = pinnedIds.includes(c.id);
    return (
      <div key={c.id} className="ds-chat-wrapper">
        <div className={'ds-chat-item' + (c.id === activeId ? ' active' : '') + (isPinned ? ' pinned' : '')} onClick={() => openChat(c.id)}>
          {subMsgs.length > 0 ? (
            <button
              className={'ds-chat-expand' + (isExpanded ? ' open' : '')}
              onClick={(e) => toggleExpand(c.id, e)}
              type="button"
              aria-label="Mở rộng"
              aria-expanded={isExpanded}
            >
              <IcoChevron size={10} />
            </button>
          ) : (
            <span className="ds-chat-item-ico"><IcoChat size={14} /></span>
          )}
          <div className="ds-chat-item-info">
            {renamingId === c.id ? (
              <input
                className="ds-rename-input"
                value={renameVal}
                autoFocus
                maxLength={60}
                onChange={(e) => setRenameVal(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                aria-label="Tên cuộc trò chuyện"
              />
            ) : (
              <span className="ds-chat-item-title" onDoubleClick={(e) => startRename(c, e)}>{c.title}</span>
            )}
            {preview.text && renamingId !== c.id && (
              <span className={`ds-chat-item-preview ${preview.role}`}>
                {preview.role === 'ai' ? (
                  <AIMark size={12} animate={false} className="ds-preview-ico" />
                ) : (
                  <svg className="ds-preview-ico user" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
                  </svg>
                )}
                <span className="ds-preview-text">{preview.text}</span>
              </span>
            )}
          </div>
          <button
            className={'ds-chat-item-pin' + (isPinned ? ' on' : '')}
            onClick={(e) => togglePin(c.id, e)}
            type="button"
            aria-label={isPinned ? 'Bỏ ghim' : 'Ghim'}
            title={isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
          >
            <IcoPin filled={isPinned} />
          </button>
          <button className="ds-chat-item-edit" onClick={(e) => startRename(c, e)} type="button" aria-label="Đổi tên" title="Đổi tên">
            <IcoEdit size={12} />
          </button>
          <button className="ds-chat-item-del" onClick={(e) => deleteChat(c.id, e)} type="button" aria-label="Xóa">
            <IcoTrash size={12} />
          </button>
        </div>

        {isExpanded && subMsgs.length > 0 && (
          <div className="ds-chat-submenu">
            {subMsgs.map((sm) => (
              <button key={sm.id} className="ds-submenu-item" onClick={() => jumpToMessage(c.id, sm.id)} type="button">
                {sm.text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* Dòng lịch sử kiểu ChatGPT: [icon chat] Tên ......... [⋯] */
  const renderCgRow = (c) => {
    const isPinned = pinnedIds.includes(c.id);
    const menuOpen = rowMenuId === c.id;
    return (
      <div
        key={c.id}
        className={'cg-row' + (c.id === activeId ? ' active' : '') + (menuOpen ? ' menu-open' : '')}
      >
        <div
          className="cg-row-main"
          role="button"
          tabIndex={0}
          onClick={() => openChat(c.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(c.id); } }}
        >
          <span className="cg-row-ico">{isPinned ? <CgPin size={18} /> : <CgChat size={20} />}</span>
          {renamingId === c.id ? (
            <input
              className="ds-rename-input cg-rename"
              value={renameVal}
              autoFocus
              maxLength={60}
              onChange={(e) => setRenameVal(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenamingId(null);
              }}
              aria-label="Tên cuộc trò chuyện"
            />
          ) : (
            <span className="cg-row-title" onDoubleClick={(e) => startRename(c, e)}>{c.title}</span>
          )}
        </div>
        <button
          type="button"
          className="cg-row-more"
          aria-label="Tùy chọn đoạn chat"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setRowMenuId((v) => (v === c.id ? null : c.id)); }}
        >
          <CgDots size={18} />
        </button>
        {menuOpen && (
          <div className="cg-row-menu" role="menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" role="menuitem" onClick={() => { setRowMenuId(null); togglePin(c.id); }}>
              <CgPin size={18} /><span>{isPinned ? 'Bỏ ghim đoạn chat' : 'Ghim đoạn chat'}</span>
            </button>
            <button type="button" role="menuitem" onClick={() => { setRowMenuId(null); startRename(c); }}>
              <CgPencil size={18} /><span>Đổi tên</span>
            </button>
            <div className="cg-sep" />
            <button type="button" role="menuitem" className="danger" onClick={() => { setRowMenuId(null); deleteChat(c.id); }}>
              <CgTrash size={18} /><span>Xóa</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSidebarContent = () => {
    if (chats.length === 0) {
      return <p className="ds-sidebar-empty">Chưa có cuộc trò chuyện nào.</p>;
    }
    const pinnedList = filtered.filter((c) => pinnedIds.includes(c.id));
    const sections = Object.entries(groups)
      .map(([key, list]) => [key, list.filter((c) => !pinnedIds.includes(c.id))])
      .filter(([, list]) => list.length > 0);
    if (pinnedList.length === 0 && sections.length === 0) {
      return <p className="ds-sidebar-empty">Không có kết quả cho "{query}".</p>;
    }
    return (
      <div className="cg-list">
        {pinnedList.length > 0 && (
          <section className="cg-section">
            <h3 className="cg-section-title">Đã ghim</h3>
            {pinnedList.map(renderCgRow)}
          </section>
        )}
        {sections.map(([key, list]) => (
          <section key={key} className="cg-section">
            <h3 className="cg-section-title">{GROUP_LABELS[key]}</h3>
            {list.map(renderCgRow)}
          </section>
        ))}
      </div>
    );
  };

  /* Tự động thu gọn Sidebar sang Slim Rail khi mở Canvas để Chat & Canvas rộng rãi */
  const hasCanvas = Boolean(activeInteractiveQuiz || activeChalkboardLesson);
  useEffect(() => {
    if (hasCanvas) setSidebarManualExpand(false);
  }, [hasCanvas]);

  const startCanvasResize = useCallback((e) => {
    e.preventDefault();
    const container = stageSplitRef.current;
    if (!container) return;
    setIsResizingCanvas(true);
    const rect = container.getBoundingClientRect();

    const onMove = (ev) => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const rightPx = rect.right - clientX;
      const pct = Math.min(66, Math.max(36, Math.round((rightPx / rect.width) * 100)));
      setCanvasWidthPct(pct);
    };
    const onUp = () => {
      setIsResizingCanvas(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
  }, [setCanvasWidthPct]);

  /* Chèn ký hiệu/công thức đúng vị trí con trỏ trong ô nhập Chat */
  const insertAtCursor = useCallback((snippet) => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${snippet}`);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    setInput((prev) => prev.slice(0, start) + snippet + prev.slice(end));
    requestAnimationFrame(() => {
      try {
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      } catch { /* ignore */ }
    });
  }, [input.length]);

  const toggleBookmarkMsg = useCallback((text, msgIdx) => {
    const bmId = `${activeId || 'temp'}_${msgIdx}`;
    setBookmarks((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((b) => b.id === bmId)) {
        return list.filter((b) => b.id !== bmId);
      }
      const cleanLine = String(text || '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[#>*_`]/g, '')
        .split('\n')
        .map((s) => s.trim())
        .find((s) => s.length > 8) || 'Ghi chú ELEC AI';
      return [
        {
          id: bmId,
          chatId: activeId || null,
          title: cleanLine.slice(0, 68),
          text: String(text || '').slice(0, 2400),
          savedAt: Date.now(),
        },
        ...list,
      ].slice(0, 60);
    });
  }, [activeId, setBookmarks]);

  const quizFromMessage = useCallback((text) => {
    const snippet = String(text || '').replace(/```[\s\S]*?```/g, '').trim().slice(0, 650);
    send(
      `Từ nội dung kiến thức sau, hãy tạo ngay 5 câu luyện tập chuẩn đề thi THPT Quốc gia 2025 trên Canvas tương tác (gồm cả Phần I Trắc nghiệm A-D, Phần II Đúng/Sai 4 ý và Phần III Trả lời ngắn) kèm lời giải soi bẫy chi tiết:\n\n${snippet}`
    );
  }, [send]);

  /* RENDER */
  const effectiveCollapsed = (sidebarCollapsed || (hasCanvas && !sidebarManualExpand)) && !sidebarOpen;

  return (
    <div
      className={'ds-page elec-studio' + (effectiveCollapsed ? ' is-sidebar-collapsed' : '') + ` lens-${subjectLens}`}
      onDragEnter={(e) => {
        if (!visible || !e.dataTransfer?.types?.includes('Files')) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragLeave={() => {
        if (!visible) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDragOver={(e) => { if (visible) e.preventDefault(); }}
      onDrop={(e) => {
        dragDepth.current = 0;
        setDragging(false);
        if (!visible) return;
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) {
          e.preventDefault();
          handleFiles(files);
        }
      }}
    >
      <LiveBackground />

      {dragging && (
        <div className="ds-dropzone" aria-hidden="true">
          <div className="ds-dropzone-card">
            <IcoUploadCloud size={44} />
            <b>Thả ảnh hoặc tài liệu vào đây</b>
            <span>Ảnh (JPG, PNG, WebP, HEIC) · Tài liệu (PDF, DOCX, XLSX, TXT)</span>
          </div>
        </div>
      )}

      {/* ============ SIDEBAR (GEMINI SLIM-RAIL COLLAPSIBLE 68px ↔ 258px) ============ */}
      <aside className={'ds-sidebar' + (sidebarOpen ? ' open' : '') + (effectiveCollapsed ? ' is-rail' : '')}>
        <div className="cg-head gm-sb-head">
          <button
            className="gm-rail-btn gm-sb-toggle"
            onClick={() => {
              if (hasCanvas) {
                setSidebarManualExpand((v) => !v);
                setSidebarCollapsed(false);
              } else {
                setSidebarCollapsed((v) => !v);
              }
            }}
            type="button"
            aria-label={effectiveCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            data-tip={effectiveCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {!effectiveCollapsed && (
            <div className="elec-sb-brand">
              <AIMark size={28} animate={false} className="elec-brand-mark" />
              <span className="gm-sb-title">ELEC <em>AI</em></span>
            </div>
          )}
          <span className="cg-spacer" />
          {!effectiveCollapsed && chats.length > 0 && (
            <button
              className="gm-rail-btn gm-sb-search-ico"
              type="button"
              onClick={() => document.getElementById('gm-sidebar-search-input')?.focus()}
              aria-label="Tìm cuộc trò chuyện"
              title="Tìm cuộc trò chuyện"
            >
              <IcoSearch size={17} />
            </button>
          )}
          <button className="cg-icon-btn ds-sidebar-close" onClick={() => setSidebarOpen(false)} type="button" aria-label="Đóng">
            <CgClose size={20} />
          </button>
        </div>

        <nav className="cg-nav gm-sb-nav" aria-label="Điều hướng">
          <button
            type="button"
            className="cg-nav-item primary gm-new-pill"
            onClick={newChat}
            data-tip="Đoạn chat mới (Ctrl+Shift+O)"
            aria-label="Đoạn chat mới"
          >
            <CgCompose size={17} />
            <span className="gm-sb-lbl">Đoạn chat mới</span>
            {!effectiveCollapsed && <kbd className="elec-sb-kbd">Ctrl+K</kbd>}
          </button>
          <button
            type="button"
            className="cg-nav-item gm-nav-pill"
            onClick={exitChat}
            data-tip="Về trang chủ"
            aria-label="Về trang chủ"
          >
            <CgHome size={19} />
            <span className="gm-sb-lbl">Về trang chủ</span>
          </button>
          {effectiveCollapsed && (
            <button
              type="button"
              className="cg-nav-item gm-nav-pill"
              onClick={() => {
                setSidebarCollapsed(false);
                setTimeout(() => document.getElementById('gm-sidebar-search-input')?.focus(), 180);
              }}
              data-tip="Tìm hội thoại (Ctrl+K)"
              aria-label="Tìm cuộc trò chuyện"
            >
              <IcoSearch size={18} />
            </button>
          )}
        </nav>

        {!effectiveCollapsed && (
          <div className="elec-sb-tabs" role="tablist" aria-label="Danh mục thanh bên">
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'chats'}
              className={sidebarTab === 'chats' ? 'is-active' : ''}
              onClick={() => setSidebarTab('chats')}
            >
              Hội thoại
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'bookmarks'}
              className={sidebarTab === 'bookmarks' ? 'is-active' : ''}
              onClick={() => setSidebarTab('bookmarks')}
            >
              Đã lưu ({Array.isArray(bookmarks) ? bookmarks.length : 0})
            </button>
          </div>
        )}

        {!effectiveCollapsed && sidebarTab === 'chats' && chats.length > 0 && (
          <label className="ds-search gm-sb-search">
            <IcoSearch size={14} />
            <input
              id="gm-sidebar-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              aria-label="Tìm cuộc trò chuyện"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"><IcoClose size={12} /></button>}
          </label>
        )}

        <div className="ds-sidebar-view gm-sb-list">
          {!effectiveCollapsed && (
            sidebarTab === 'bookmarks' ? (
              <div className="elec-bm-list">
                {(!Array.isArray(bookmarks) || bookmarks.length === 0) ? (
                  <p className="ds-sidebar-empty">
                    Chưa có ghi chú nào. Bấm nút <b>Lưu ghi chú</b> dưới câu trả lời AI để lưu nhanh công thức &amp; lời giải hay!
                  </p>
                ) : (
                  bookmarks.map((bm) => (
                    <div key={bm.id} className="elec-bm-card">
                      <div className="elec-bm-title">{bm.title}</div>
                      <p className="elec-bm-preview">{bm.text.replace(/[#>*_`]/g, '').slice(0, 120)}</p>
                      <div className="elec-bm-actions">
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button type="button" onClick={() => copyMsg(bm.text, `bm-${bm.id}`)}>
                            {copied === `bm-${bm.id}` ? 'Đã chép' : 'Chép'}
                          </button>
                          <button type="button" onClick={() => quizFromMessage(bm.text)}>
                            Tạo Quiz
                          </button>
                        </div>
                        <button
                          type="button"
                          className="is-del"
                          onClick={() => setBookmarks((prev) => prev.filter((x) => x.id !== bm.id))}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              renderSidebarContent()
            )
          )}
        </div>

        {/* USER MENU */}
        <div className="ds-user-wrap" onClick={(e) => e.stopPropagation()}>
          {userMenuOpen && (
            <div className="ds-user-menu" role="menu">
              <div className="ds-user-menu-head">
                <UserAvatar user={user} initial={userInitial} color={tier.color} />
                <div className="ds-user-menu-info">
                  <b>{userName}{(tier.key === 'vip' || tier.key === 'pro') && <VerifiedBadge isVip size={13} />}</b>
                  <small>{user?.email}</small>
                </div>
              </div>

              <div className="ds-user-menu-tier">
                <span className="ds-tier-badge" style={{ background: tier.color }}>
                  {(tier.key === 'vip' || tier.key === 'pro') ? <IcoCrown size={12} /> : <IcoSparkle size={12} />}
                  <span>{tier.name}</span>
                </span>
                {credits != null && (
                  <span className="ds-tier-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 700 }}>
                    {fmtCreditsShort(credits)} credit
                  </span>
                )}
                {tier.key === 'free' && (
                  <button className="ds-tier-upgrade" onClick={goUpgrade} type="button">Nâng cấp</button>
                )}
              </div>

              <div className="ds-user-menu-items">
                <button onClick={goProfile} type="button" role="menuitem"><IcoUser size={15} /><span>Trang cá nhân</span></button>
                <button onClick={goUpgrade} type="button" role="menuitem"><IcoCrown size={15} /><span>Gói sử dụng</span></button>
                <button onClick={handleLogout} type="button" role="menuitem" className="danger"><IcoLogout size={15} /><span>Đăng xuất</span></button>
              </div>
            </div>
          )}

          <button
            className={'ds-user-btn' + (userMenuOpen ? ' open' : '')}
            onClick={() => setUserMenuOpen((v) => !v)}
            type="button"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <UserAvatar user={user} initial={userInitial} color={tier?.color} />
            <div className="ds-user-info">
              <b>{userName}{(tier.key === 'vip' || tier.key === 'pro') && <VerifiedBadge isVip size={12} />}</b>
              <span className="ds-user-tier-name">
                {(tier.key === 'vip' || tier.key === 'pro') ? 'VIP' : tier.name}
                {credits != null ? ` · ${fmtCreditsShort(credits)} credit` : ''}
              </span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="elec-user-chev" aria-hidden="true">
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </button>
        </div>

        {!effectiveCollapsed && tier?.key !== 'vip' && tier?.key !== 'pro' && (
          <button type="button" className="cg-pill" onClick={goUpgrade}>
            <CgGift size={18} /><span>Nâng cấp VIP</span>
          </button>
        )}

        {!effectiveCollapsed && chats.length > 0 && (
          <div className="ds-sidebar-foot">
            <button className="ds-delete-all" onClick={deleteAll} type="button">
              <IcoTrash size={13} />
              <span>Xóa tất cả</span>
            </button>
          </div>
        )}
      </aside>

      {sidebarOpen && <div className="ds-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ============ CONTENT ============ */}
      <div className="ds-content">
        <header className="ds-header gm-header">
          <div className="ds-header-inner">
            <div className="ai2-head-left">
              <button className="ds-menu-btn" onClick={() => setSidebarOpen(true)} type="button" aria-label="Mở lịch sử">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className={'ai2-brand-group' + (!sidebarCollapsed ? ' is-hide-when-expanded' : '')}>
                <AIMark size={28} animate={false} className="elec-brand-mark" />
                <span className="ai2-brand-name">
                  ELEC <em className="elec-ai-tag">AI</em>
                </span>
              </div>

              {/* Pill chọn Chế độ trả lời tùy biến */}
              <div className="ai2-mode-wrap">
                <button
                  type="button"
                  className={`ai2-mode-trigger ${hmenu === 'mode' ? 'open' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHmenu((v) => (v === 'mode' ? null : 'mode'));
                  }}
                  aria-haspopup="menu"
                  aria-expanded={hmenu === 'mode'}
                  title="Chọn phong cách trả lời của AI"
                >
                  <span className={`ai2-status-dot ${loading ? 'busy' : ''}`} aria-hidden="true" />
                  <span>{MODE_LIST.find((m) => m.id === mode)?.label || 'Tự động'}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {hmenu === 'mode' && (
                  <div className="ai2-popover" role="menu" onClick={(e) => e.stopPropagation()}>
                    <div className="ai2-pop-head">Chế độ trả lời</div>
                    {MODE_LIST.map((mo) => (
                      <button
                        key={mo.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={mode === mo.id}
                        className={`ai2-pop-item ${mode === mo.id ? 'active' : ''}`}
                        onClick={() => {
                          setMode(mo.id);
                          setHmenu(null);
                        }}
                      >
                        <span className="ai2-pop-item-txt">
                          <b>{mo.label}</b>
                          <small>{mo.hint}</small>
                        </span>
                        {mode === mo.id && <IcoCheck size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pill chọn nhanh Khối lớp (Lớp 10 / 11 / 12 / Đại học) */}
              <div className="ai2-mode-wrap">
                <button
                  type="button"
                  className={`elec-grade-trigger ${hmenu === 'grade' ? 'open' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHmenu((v) => (v === 'grade' ? null : 'grade'));
                  }}
                  aria-haspopup="menu"
                  aria-expanded={hmenu === 'grade'}
                  title="Chọn khối lớp để AI bám sát đúng chương trình SGK GDPT 2018"
                >
                  <span>{grade === 'Tự động' ? 'Lớp: Tự động' : grade}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {hmenu === 'grade' && (
                  <div className="ai2-popover" role="menu" onClick={(e) => e.stopPropagation()}>
                    <div className="ai2-pop-head">Khối lớp trọng tâm</div>
                    {GRADE_OPTIONS.map((gr) => (
                      <button
                        key={gr}
                        type="button"
                        role="menuitemradio"
                        aria-checked={grade === gr}
                        className={`ai2-pop-item ${grade === gr ? 'active' : ''}`}
                        onClick={() => {
                          setGrade(gr);
                          setHmenu(null);
                        }}
                      >
                        <span className="ai2-pop-item-txt">
                          <b>{gr}</b>
                          <small>
                            {gr === 'Tự động'
                              ? 'AI tự nhận diện khối lớp theo đề bài'
                              : `Ưu tiên công thức & giới hạn kiến thức ${gr}`}
                          </small>
                        </span>
                        {grade === gr && <IcoCheck size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="ai2-head-right">
              <button
                type="button"
                className={`elec-casio-toggle-btn ${quickRefOpen ? 'is-open' : ''}`}
                onClick={() => {
                  setQuickRefOpen((v) => !v);
                  setCasioOpen(false);
                }}
                aria-pressed={quickRefOpen}
                title="Tra cứu nhanh Bảng tuần hoàn 118 nguyên tố, Tính M và Hằng số Lý - Hóa - Sinh"
              >
                <IcoSparkle size={14} />
                <span>Tra cứu</span>
              </button>

              <button
                type="button"
                className={`elec-casio-toggle-btn ${casioOpen ? 'is-open' : ''}`}
                onClick={() => {
                  setCasioOpen((v) => !v);
                  setQuickRefOpen(false);
                }}
                aria-pressed={casioOpen}
                title="Mở máy tính Casio fx-580VN X ngay trong phòng Chat AI"
              >
                <IcoCalc size={14} />
                <span>Casio 580</span>
              </button>

              {uid ? (
                <NavCreditPopover userId={uid} credits={creditBalance ?? credits ?? 0} />
              ) : (
                <QuotaRing left={quota.textLeft} total={quota.quotaText} label="lượt chat" />
              )}

              <button
                type="button"
                className={`ai2-icon-btn gm-temp-btn ${tempMode ? 'is-temp' : ''}`}
                onClick={toggleTempMode}
                title={tempMode ? 'Tắt chế độ Chat tạm thời (đang ẩn danh)' : 'Bật Chat tạm thời (không lưu lịch sử)'}
                aria-label="Chat tạm thời"
                aria-pressed={tempMode}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tempMode ? 'none' : '3 2.5'} aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              <button
                type="button"
                className="ai2-icon-btn"
                onClick={toggleAiTheme}
                title={aiTheme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                aria-label={aiTheme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {aiTheme === 'dark' ? <IcoSunSm size={16} /> : <IcoMoonSm size={16} />}
              </button>

              {/* Popover Tùy chọn gom gọn (không dàn trải nút lặp trên header) */}
              <div className="ai2-mode-wrap">
                <button
                  type="button"
                  className={`ai2-icon-btn ${hmenu === 'more' ? 'on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHmenu((v) => (v === 'more' ? null : 'more'));
                  }}
                  aria-label="Tùy chọn"
                  aria-haspopup="menu"
                  aria-expanded={hmenu === 'more'}
                  title="Tùy chọn khác"
                >
                  <IcoMore size={17} />
                </button>

                {hmenu === 'more' && (
                  <div className="ai2-popover align-right" role="menu" onClick={(e) => e.stopPropagation()}>
                    {ttsSupported && (
                      <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={autoSpeak}
                        className={`ai2-pop-item ${autoSpeak ? 'active' : ''}`}
                        onClick={() => setAutoSpeak((v) => !v)}
                      >
                        <span className="ai2-pop-item-txt">
                          <b>Đọc tự động câu trả lời</b>
                          <small>{autoSpeak ? 'Đang bật giọng đọc AI' : 'Đang tắt'}</small>
                        </span>
                        {autoSpeak ? <IcoSpeaker size={15} /> : <IcoSpeakerOff size={15} />}
                      </button>
                    )}
                    <button type="button" role="menuitem" className="ai2-pop-item" onClick={() => { setHmenu(null); exitChat(); }}>
                      <span className="ai2-pop-item-txt"><b>Về trang chủ</b></span>
                      <IcoChevL size={15} />
                    </button>
                    {messages.length > 0 && (
                      <button type="button" role="menuitem" className="ai2-pop-item" onClick={() => { setHmenu(null); exportChat(); }}>
                        <span className="ai2-pop-item-txt"><b>Tải cuộc trò chuyện (.md)</b></span>
                        <IcoDownload size={15} />
                      </button>
                    )}
                    {activeId && messages.length > 0 && (
                      <>
                        <div className="ai2-pop-sep" />
                        <button type="button" role="menuitem" className="ai2-pop-item" onClick={() => { setHmenu(null); togglePin(activeId); }}>
                          <span className="ai2-pop-item-txt"><b>{pinnedIds.includes(activeId) ? 'Bỏ ghim đoạn chat' : 'Ghim đoạn chat'}</b></span>
                          <IcoPin size={15} filled={pinnedIds.includes(activeId)} />
                        </button>
                        <button type="button" role="menuitem" className="ai2-pop-item danger" onClick={() => { setHmenu(null); deleteChat(activeId); }}>
                          <span className="ai2-pop-item-txt"><b>Xóa đoạn chat</b></span>
                          <IcoTrash size={15} />
                        </button>
                      </>
                    )}
                    <div className="ai2-pop-sep" />
                    <p className="ai2-pop-foot">
                      Lượt ảnh: {quota.quotaImage === Infinity || !Number.isFinite(quota.imageLeft)
                        ? 'Không giới hạn'
                        : `${quota.imageLeft}/${quota.quotaImage}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {hmenu && <div className="ds-m-backdrop" onClick={() => setHmenu(null)} />}
        </header>

        <div
          ref={stageSplitRef}
          className={`ds-stage-split ${hasCanvas ? 'has-canvas' : ''}`}
          style={hasCanvas ? { '--elec-canvas-w': `${canvasWidthPct}%` } : undefined}
        >
          <div className={'ds-stage-chat' + (messages.length === 0 && !(showLive && (streaming || reasoning)) ? ' is-gm-empty' : '')}>
            <main ref={mainRef} className={'ds-main' + (messages.length === 0 ? ' ds-main-empty' : '')}>
          {!AI_READY && (
            <div className="ds-warning">
              <b>Chưa cấu hình API</b>
              <p>
                Thêm vào file <code>.env</code> dòng:{' '}
                <code className="ds-code-inline">VITE_GEMINI_KEY=AIza...</code>{' '}
                rồi restart <code>npm run dev</code>.
              </p>
            </div>
          )}

          {messages.length === 0 && !(showLive && (streaming || reasoning)) ? (
            <div className="ds-empty gm-hero elec-hero">
              {tempMode && (
                <div className="gm-temp-banner">
                  <span className="gm-temp-dot" />
                  <span>Chat tạm thời đang bật — Đoạn hội thoại này sẽ tự xóa khi bạn rời đi.</span>
                </div>
              )}

              <div className={'elec-emblem-lockup' + (deepThink ? ' is-deep' : '')}>
                <div className="elec-hero-anim-wrap" title="Bấm vào bình thí nghiệm ELEC AI để tạo hiệu ứng">
                  <AIMark
                    size={112}
                    mode={deepThink ? 'think' : subjectLens === 'hoa' ? 'talk' : subjectLens === 'sinh' ? 'success' : 'idle'}
                    look
                    animate={visible}
                    effects="full"
                    className="elec-hero-aimark"
                  />
                </div>
                <span className="elec-hero-kicker">
                  {firstName ? `Chào ${firstName}` : 'Xin chào'} · ELEC AI Studio
                </span>
              </div>

              <h1 className="ds-empty-title gm-hero-title elec-hero-title">
                Chinh phục Lý · Hóa · Sinh cùng <span>ELEC</span>
              </h1>
            </div>
          ) : (
            <div className="ds-chat">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                return (
                  <div key={i} data-msg-idx={i} className={'ds-msg ds-msg-' + m.role}>
                    {m.role === 'user' ? (
                      <>
                        {m.preview?.images?.length > 0 && (
                          <div className={'ds-msg-img-grid' + (m.preview.images.length === 1 ? ' single' : '')}>
                            {m.preview.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.dataUrl}
                                alt={`Ảnh ${idx + 1}`}
                                className="ds-msg-img"
                                style={{ aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : undefined }}
                                onClick={() => setLightbox({ list: m.preview.images.map((x) => x.dataUrl), index: idx })}
                              />
                            ))}
                          </div>
                        )}
                        {m.preview?.img && !m.preview?.images && (
                          <img src={m.preview.img} alt="Ảnh đã gửi" className="ds-msg-img" onClick={() => setLightbox({ list: [m.preview.img], index: 0 })} />
                        )}
                        {m.preview?.docs?.length > 0 && (
                          <div className="elec-msg-docs">
                            {m.preview.docs.map((d) => (
                              <span key={d.id || d.name} className="elec-msg-doc-pill">
                                <span className="elec-doc-ext">{(d.kind || 'FILE').toUpperCase()}</span>
                                <span className="elec-doc-name">{d.name}</span>
                                {d.metaLabel && <small>{d.metaLabel}</small>}
                              </span>
                            ))}
                          </div>
                        )}
                        {m.preview?.text && <div className="ds-msg-user-text">{m.preview.text}</div>}
                        {!loading && (
                          <div className="ds-umsg-actions">
                            {m.preview?.text && (
                              <button type="button" onClick={() => copyMsg(m.preview.text, 'u' + i)} aria-label="Sao chép" title="Sao chép">
                                {copied === 'u' + i ? <IcoCheck size={14} /> : <IcoCopy size={14} />}
                              </button>
                            )}
                            <button type="button" onClick={() => editMessage(i)} aria-label="Sửa và gửi lại" title="Sửa và gửi lại">
                              <IcoEdit size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <AIMark size={36} animate={false} className="ds-avatar" />
                        <div className="ds-msg-body">
                          {m.reasoning && String(m.reasoning).trim().length >= 55 && (() => {
                            const isThinkOpen = openReasoningIds.has(i);
                            return (
                              <div className={'ds-reasoning-box gm-think-box' + (isThinkOpen ? ' is-open' : ' is-collapsed')}>
                                <button className="ds-reasoning-toggle" onClick={() => toggleReasoningFor(i)} type="button" aria-expanded={isThinkOpen}>
                                  <IcoBrain size={13} />
                                  <span>
                                    {m.thinkSec
                                      ? `Đã suy luận trong ${m.thinkSec}s${m.usedDeepThink ? ' · DeepThink' : ''}`
                                      : 'Quá trình suy luận của AI'}
                                  </span>
                                  <span className={'ds-reasoning-arrow' + (isThinkOpen ? ' open' : '')}><IcoChevron size={11} /></span>
                                </button>
                                {isThinkOpen && (
                                  <div className="ds-reasoning-content"><ReasoningSteps text={m.reasoning} /></div>
                                )}
                              </div>
                            );
                          })()}

                          {(() => {
                            const { cleanText: msgCleanText, checkpoint: socraticCheckpoint } = !m.isQuotaError && m.text
                              ? parseCheckpointFromText(m.text)
                              : { cleanText: m.text || '', checkpoint: null };
                            const quizData = !m.isQuotaError && msgCleanText ? getCachedQuiz(msgCleanText) : null;
                            const cbData = !m.isQuotaError && msgCleanText ? getCachedChalkboard(msgCleanText) : null;
                            return (
                              <div className={'ds-msg-content' + (m.isQuotaError ? ' quota-error' : '')}>
                                {m.isQuotaError ? (
                                  <MarkdownLike text={m.text || ''} />
                                ) : quizData ? (
                                  <div className="ds-gemini-quiz-block">
                                    {quizData.introText && (
                                      <div className="ds-gemini-intro">
                                        <MarkdownLike text={quizData.introText} />
                                      </div>
                                    )}

                                    <div
                                      className={`elec-quiz-launch-card ${activeInteractiveQuiz === quizData.quiz ? 'is-active' : ''}`}
                                      onClick={() => {
                                        setActiveChalkboardLesson(null);
                                        setActiveInteractiveQuiz(quizData.quiz);
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          setActiveChalkboardLesson(null);
                                          setActiveInteractiveQuiz(quizData.quiz);
                                        }
                                      }}
                                      title="Bấm để mở bộ đề trên Bảng Canvas tương tác"
                                    >
                                      <div className="elec-qlc-left">
                                        <img
                                          src="/img/elec/elec-fighting.png"
                                          alt=""
                                          aria-hidden="true"
                                          className="elec-qlc-mascot"
                                          width="48"
                                          height="48"
                                        />
                                        <div className="elec-qlc-info">
                                          <div className="elec-qlc-tags">
                                            <span className="elec-qlc-tag">ELEC QUIZ CANVAS</span>
                                            <span className="elec-qlc-tag">{quizData.quiz.questions?.length || 0} câu hỏi</span>
                                          </div>
                                          <h4 className="elec-qlc-title">{quizData.quiz.title}</h4>
                                          <p className="elec-qlc-sub">
                                            {activeInteractiveQuiz === quizData.quiz
                                              ? 'Đang mở trên bảng bên phải · Tự chấm & tích +10 XP/câu'
                                              : 'Làm bài trực tiếp, tự chấm điểm & lưu câu sai vào Sổ tay'}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="elec-qlc-cta">
                                        {activeInteractiveQuiz === quizData.quiz ? 'Đang mở' : 'Làm bài ngay →'}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      className="elec-qlc-plain-btn"
                                      onClick={() => setPlainViewMsgIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(i)) next.delete(i); else next.add(i);
                                        return next;
                                      })}
                                    >
                                      {plainViewMsgIds.has(i) ? 'Ẩn dạng văn bản' : 'Xem dạng văn bản'}
                                    </button>

                                    {plainViewMsgIds.has(i) && (
                                      <div className="ds-gemini-plain-box">
                                        <MarkdownLike text={msgCleanText || ''} />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <CollapsibleText defaultOpen={isLast}>
                                    {cbData?.lesson && (
                                      <div
                                        className={`ds-studio-hero-launcher ${activeChalkboardLesson === cbData.lesson ? 'is-active' : ''}`}
                                        onClick={() => {
                                          setActiveChalkboardLesson(cbData.lesson);
                                          setActiveInteractiveQuiz(null);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        title="Bấm để mở Bảng vẽ hình học tương tác trên Canvas (giải đến đâu vẽ tới đó)"
                                      >
                                        <div className="ds-studio-hero-info">
                                          <div className="ds-studio-hero-tag">
                                            <span className="ds-studio-pulse-dot" />
                                            <span>{cbData.lesson.baChieu !== false ? 'Studio Hình học 3D' : 'Studio Đồ thị & Hình phẳng'}</span>
                                            {cbData.lesson.buoc?.length > 0 && (
                                              <span style={{ opacity: 0.75 }}>· {cbData.lesson.buoc.length} bước</span>
                                            )}
                                          </div>
                                          <h4 className="ds-studio-hero-title">{cbData.lesson.tieuDe}</h4>
                                        </div>
                                        <div className="ds-studio-hero-btn">
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                          </svg>
                                          <span>{activeChalkboardLesson === cbData.lesson ? 'Đang mở trên Canvas' : 'Xem diễn hoạt'}</span>
                                        </div>
                                      </div>
                                    )}
                                    <MarkdownLike text={msgCleanText || ''} />

                                    {socraticCheckpoint && (
                                      <SocraticCheckpointCard
                                        checkpoint={socraticCheckpoint}
                                        onContinue={(nextText) => send(nextText)}
                                      />
                                    )}

                                    {/* GỢI Ý BÀI GIẢNG VIDEO YOUTUBE LIÊN QUAN */}
                                    {(cbData?.lesson || /(video|bài giảng|clip|youtube|thầy chí|vted|vietjack)/i.test(msgCleanText || '')) && (
                                      <div className="ds-yt-chat-cta-wrap">
                                        <button
                                          type="button"
                                          className="ds-yt-chat-toggle-btn"
                                          onClick={() => setOpenVideoMsgIds((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(i)) next.delete(i); else next.add(i);
                                            return next;
                                          })}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff0000' }} aria-hidden="true">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                          </svg>
                                          <span>
                                            {openVideoMsgIds.has(i)
                                              ? 'Thu gọn bài giảng video YouTube'
                                              : 'Xem video bài giảng liên quan trên YouTube'}
                                          </span>
                                        </button>
                                        {openVideoMsgIds.has(i) && (
                                          <div style={{ marginTop: '8px' }}>
                                            <YouTubeVideoSection
                                              videos={getCachedRelatedVideos(
                                                (cbData?.lesson?.tieuDe || '') + ' ' + (msgCleanText || ''),
                                                2
                                              )}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </CollapsibleText>
                                )}
                              </div>
                            );
                          })()}

                          {m.stopped && <span className="ds-stopped">đã dừng — câu trả lời chưa đầy đủ</span>}

                          {!m.isQuotaError && (m.toolHits?.length > 0 || m.verification || m.citations?.length > 0) && (
                            <div className="ds-ai-meta">
                              {m.toolHits?.length > 0 && (
                                <span className="ds-ai-badge" title={m.toolHits.map((h) => h.title).join(' · ')}>
                                  <IcoCalc size={13} /> Đã tính bằng công cụ
                                </span>
                              )}
                              {m.verification?.aiVerdict && (
                                <span
                                  className={'ds-ai-badge' + (/KẾT LUẬN:\s*(ĐÚNG|DUNG)/i.test(m.verification.aiVerdict) ? ' ok' : ' warn')}
                                  title={m.verification.aiVerdict}
                                >
                                  <IcoShieldCheck size={13} /> Đã thẩm định lại
                                </span>
                              )}
                              {m.citations
                                ?.filter((c) => !/hướng dẫn sử dụng elec ai/i.test(c.label || ''))
                                .map((c) => {
                                  const cleanLabel = String(c.label || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
                                  return (
                                    <span key={c.n} className="ds-ai-cite" title={`Nguồn nội bộ: ${cleanLabel}`}>
                                      [{c.n}] {cleanLabel}
                                    </span>
                                  );
                                })}
                            </div>
                          )}

                          {!m.isQuotaError && m.text && (() => {
                            const txtLen = (m.text || '').trim().length;
                            const isSubstantial = txtLen >= 150;
                            const isSolve = isSubstantial && /(bước\s*\d|đáp\s*số|đáp\s*án|công\s*thức|phương\s*trình|tính\s|mol|kết\s*quả|\$|\\frac|=)/i.test(m.text || '');
                            return (
                              <>
                                <div className="ds-msg-actions">
                                  <button
                                    className={'ds-action-btn' + (copied === 'm' + i ? ' on' : '')}
                                    onClick={() => copyMsg(m.text || '', 'm' + i)}
                                    type="button"
                                    aria-label={copied === 'm' + i ? 'Đã chép' : 'Sao chép'}
                                    title={copied === 'm' + i ? 'Đã chép' : 'Sao chép'}
                                  >
                                    {copied === 'm' + i ? <IcoCheck size={14} /> : <IcoCopy size={14} />}
                                    <span className="ds-btn-text">{copied === 'm' + i ? 'Đã chép' : 'Sao chép'}</span>
                                  </button>

                                  {ttsSupported && (
                                    <button
                                      className={'ds-action-icon-btn' + (speakingId === 'msg-' + i ? ' on' : '')}
                                      onClick={() => speakMsg(m.text, 'msg-' + i)}
                                      type="button"
                                      title={speakingId === 'msg-' + i ? 'Dừng đọc' : 'Đọc câu trả lời'}
                                      aria-label={speakingId === 'msg-' + i ? 'Dừng đọc' : 'Đọc'}
                                    >
                                      {speakingId === 'msg-' + i ? <IcoSpeakerOff size={15} /> : <IcoSpeaker size={15} />}
                                    </button>
                                  )}

                                  {isSubstantial && (
                                    <button
                                      className={'ds-action-icon-btn' + (copied === 'saved-' + i ? ' on' : '')}
                                      onClick={() => saveToNotebook(m.text, i)}
                                      type="button"
                                      title="Lưu vào sổ tay lỗi"
                                      aria-label="Lưu vào sổ tay lỗi"
                                    >
                                      <IcoNote size={15} />
                                    </button>
                                  )}

                                  {isSubstantial && (
                                    <button
                                      className={'ds-action-btn ds-action-desktop-only' + (Array.isArray(bookmarks) && bookmarks.some((b) => b.id === `${activeId || 'temp'}_${i}`) ? ' on' : '')}
                                      onClick={() => toggleBookmarkMsg(m.text, i)}
                                      type="button"
                                      title="Lưu công thức / lời giải vào mục Đã lưu ở thanh bên"
                                    >
                                      <IcoPin size={14} filled={Array.isArray(bookmarks) && bookmarks.some((b) => b.id === `${activeId || 'temp'}_${i}`)} />
                                      <span className="ds-btn-text">
                                        {Array.isArray(bookmarks) && bookmarks.some((b) => b.id === `${activeId || 'temp'}_${i}`) ? 'Đã lưu' : 'Lưu ghi chú'}
                                      </span>
                                    </button>
                                  )}

                                  {isSubstantial && (
                                    <button
                                      className="ds-action-btn ds-action-desktop-only"
                                      onClick={() => quizFromMessage(m.text)}
                                      type="button"
                                      title="Tạo ngay 5 câu luyện tập chuẩn THPT 2025 trên Canvas từ lời giải này"
                                    >
                                      <IcoPractice size={14} />
                                      <span className="ds-btn-text">Quiz 2025</span>
                                    </button>
                                  )}

                                  {isSubstantial && (
                                    <button
                                      className="ds-action-btn ds-action-desktop-only"
                                      onClick={() => handleExportMsgDocx(m.text, i)}
                                      disabled={exportingDocxIdx === i}
                                      type="button"
                                      title="Xuất câu trả lời ra tệp Word (.docx) chuẩn đẹp"
                                    >
                                      <IcoDownload size={14} />
                                      <span className="ds-btn-text">{exportingDocxIdx === i ? 'Đang xuất...' : 'Tải Word'}</span>
                                    </button>
                                  )}

                                  {isLast && !loading && (
                                    <button
                                      className="ds-action-btn ds-action-desktop-only"
                                      onClick={() => regenerate(false)}
                                      type="button"
                                      title="Tạo lại câu trả lời"
                                    >
                                      <IcoRefresh size={14} />
                                      <span className="ds-btn-text">Tạo lại</span>
                                    </button>
                                  )}

                                  {isSubstantial && (
                                    <div className="ds-more-wrap ds-action-mobile-only">
                                      <button
                                        className="ds-action-icon-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMoreMenuId(moreMenuId === 'msg-' + i ? null : 'msg-' + i);
                                        }}
                                        type="button"
                                        aria-label="Thêm hành động"
                                        aria-expanded={moreMenuId === 'msg-' + i}
                                      >
                                        <IcoMore size={15} />
                                      </button>

                                      {moreMenuId === 'msg-' + i && (
                                        <div className="ds-more-menu" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            className="ds-more-item"
                                            onClick={() => { practiceSimilar(m.text); setMoreMenuId(null); }}
                                            type="button"
                                          >
                                            <IcoPractice size={15} />
                                            <span>Tạo bài tương tự</span>
                                          </button>
                                          {isLast && !loading && (
                                            <button
                                              className="ds-more-item"
                                              onClick={() => { regenerate(false); setMoreMenuId(null); }}
                                              type="button"
                                            >
                                              <IcoRefresh size={15} />
                                              <span>Tạo lại câu trả lời</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Đa phương pháp giải 1 chạm (Photomath) + Smart Follow-up Chips — chỉ hiện với câu trả lời học thuật thực sự */}
                                {isLast && !loading && isSubstantial && (
                                  <div className="elec-post-actions">
                                    {isSolve && (
                                      <div className="elec-method-strip" aria-label="Đổi phương pháp giải nhanh">
                                        <span className="elec-method-lbl">Cách khác:</span>
                                        {[
                                          { label: 'Tự luận SGK', prompt: 'Hãy trình bày lại bài vừa rồi theo chuẩn tự luận SGK chi tiết nhất (đủ dữ kiện, công thức, đơn vị chuẩn chấm điểm).' },
                                          { label: 'Giải nhanh 15s', prompt: 'Hãy chỉ cách giải siêu tốc trắc nghiệm trong 15 giây (dùng bảo toàn, đường tròn lượng giác hoặc mẹo loại trừ) cho bài vừa rồi.' },
                                          { label: 'Bấm máy Casio', prompt: 'Hướng dẫn từng phím bấm máy tính Casio fx-580VN X / 880BTG để ra nhanh đáp số bài vừa rồi (nếu áp dụng được).' },
                                        ].map((mm) => (
                                          <button
                                            key={mm.label}
                                            type="button"
                                            className="elec-method-pill"
                                            onClick={() => send(mm.prompt)}
                                          >
                                            {mm.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    <div className="gm-followups" aria-label="Gợi ý hỏi tiếp">
                                      {[
                                        {
                                          label: 'Luyện 5 câu Canvas (THPT 2025)',
                                          prompt: 'Từ kiến thức vừa trao đổi, hãy tạo ngay 5 câu luyện tập chuẩn đề thi THPT Quốc gia 2025 trên Canvas tương tác (phối hợp cả Phần I Trắc nghiệm A-D, Phần II Đúng/Sai 4 ý và Phần III Trả lời ngắn) kèm lời giải soi bẫy chi tiết.',
                                          isQuizCta: true,
                                        },
                                        { label: 'Tóm tắt công thức lõi', prompt: 'Tóm tắt ngắn gọn các công thức cốt lõi và kết luận quan trọng nhất từ lời giải trên.' },
                                        { label: 'Soi bẫy hay sai nhất', prompt: 'Chỉ ra 3 lỗi sai và bẫy đề thi học sinh dễ mắc nhất ở dạng bài này.' },
                                      ].map((fu) => (
                                        <button
                                          key={fu.label}
                                          type="button"
                                          className={`gm-followup-chip ${fu.isQuizCta ? 'is-quiz-cta' : ''}`}
                                          onClick={() => send(fu.prompt)}
                                        >
                                          <span>{fu.label}</span>
                                          <span aria-hidden="true">→</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {showLive && streaming && (
                <div className="ds-msg ds-msg-model">
                  <AIMark size={40} mode="talk" animate={visible} className="ds-avatar" />
                  <div className="ds-msg-body">
                    {reasoning && (
                      <div className="ds-reasoning-box streaming gm-think-box">
                        <div className="ds-reasoning-toggle">
                          <IcoBrain size={13} />
                          <span className="gm-shimmer-txt">Đang suy luận ({liveElapsedSec.toFixed(1)}s)…</span>
                        </div>
                        <div className="ds-reasoning-content"><ReasoningSteps text={reasoning} /></div>
                      </div>
                    )}
                    <div className="ds-msg-content"><MarkdownLike text={streaming} /></div>
                  </div>
                </div>
              )}

              {showLive && !streaming && (
                <div className="ds-msg ds-msg-model">
                  <AIMark size={40} mode="orbit" animate={visible} className="ds-avatar" />
                  <div className="ds-msg-body">
                    {reasoning ? (
                      <div className="ds-reasoning-box streaming gm-think-box">
                        <div className="ds-reasoning-toggle">
                          <IcoBrain size={13} />
                          <span className="gm-shimmer-txt">Đang suy luận sâu ({liveElapsedSec.toFixed(1)}s)…</span>
                        </div>
                        <div className="ds-reasoning-content"><ReasoningSteps text={reasoning} /></div>
                      </div>
                    ) : (
                      <div className="gm-skeleton-wrap" aria-live="polite">
                        <span className="gm-shimmer-txt">
                          {deepThink ? `DeepThink đang suy luận (${liveElapsedSec.toFixed(1)}s)…` : `Đang phân tích (${liveElapsedSec.toFixed(1)}s)…`}
                        </span>
                        <div className="gm-shimmer-bars" aria-hidden="true">
                          <i style={{ width: '92%' }} />
                          <i style={{ width: '76%' }} />
                          <i style={{ width: '54%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={end} />
            </div>
          )}

          {/* Conversation Minimap Rail kiểu Claude/ChatGPT khi có >= 2 câu hỏi */}
          {(() => {
            const userTurns = messages
              .map((m, idx) => (m.role === 'user' ? { idx, text: m.preview?.text || 'Ảnh bài tập' } : null))
              .filter(Boolean);
            if (userTurns.length < 2) return null;
            return (
              <nav className="gm-minimap" aria-label="Mục lục câu hỏi trong đoạn chat">
                {userTurns.map((t, n) => (
                  <button
                    key={t.idx}
                    type="button"
                    className="gm-minimap-tick"
                    data-preview={`#${n + 1} ${t.text.slice(0, 44)}`}
                    onClick={() => {
                      document
                        .querySelector(`[data-msg-idx="${t.idx}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    aria-label={`Tới câu hỏi ${n + 1}`}
                  />
                ))}
              </nav>
            );
          })()}
        </main>

        {/* ============ INPUT ============ */}
        <div className="ds-input-wrap">
        <div className="ds-input-inner">
          {showJump && hasMessages && (
            <button
              type="button"
              className="ds-jump"
              onClick={scrollToBottom}
              aria-label="Cuộn xuống cuối"
              title="Cuộn xuống cuối"
            >
              <IcoArrowDown size={16} />
              {unreadCount > 0 && (
                <span className="ds-jump-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          )}

          {attachOpen && (
            <div className="ds-attach-menu" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ds-attach-btn"
                onClick={() => { fileRef.current?.click(); setAttachOpen(false); }}
              >
                <IcoImage size={16} />
                <span>Chọn ảnh từ máy</span>
              </button>
              <button
                type="button"
                className="ds-attach-btn"
                onClick={() => { cameraRef.current?.click(); setAttachOpen(false); }}
              >
                <IcoCamera size={16} />
                <span>Chụp ảnh mới</span>
              </button>
              <button
                type="button"
                className="ds-attach-btn"
                onClick={() => { docRef.current?.click(); setAttachOpen(false); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Tải tài liệu (PDF, Word, TXT)</span>
              </button>
              <button
                type="button"
                className="ds-attach-btn ds-m-only"
                onClick={() => { setShowQuickPrompts(true); setAttachOpen(false); }}
              >
                <IcoWand size={16} />
                <span>Prompt mẫu nhanh</span>
              </button>
            </div>
          )}

          {docs.length > 0 && (
            <div className="elec-doc-tray" aria-label="Tài liệu đã đính kèm">
              <div className="elec-doc-pills">
                {docs.map((d) => (
                  <div key={d.id} className="elec-doc-pill">
                    <span className="elec-doc-ext">{(d.kind || 'DOC').toUpperCase()}</span>
                    <span className="elec-doc-name" title={d.name}>{d.name}</span>
                    {d.metaLabel && <small>{d.metaLabel}</small>}
                    <button
                      type="button"
                      className="elec-doc-x"
                      onClick={() => removeDoc(d.id)}
                      aria-label={`Gỡ tài liệu ${d.name}`}
                    >
                      <IcoClose size={11} />
                    </button>
                  </div>
                ))}
                {docs.length > 1 && (
                  <button type="button" className="elec-doc-clear" onClick={clearDocs}>Xóa hết</button>
                )}
              </div>
              <div className="elec-doc-quick">
                <button type="button" onClick={() => send('Tóm tắt ngắn gọn trọng tâm tài liệu đính kèm và gắn trích dẫn [Trang X].')}>
                  Tóm tắt + [Trang X]
                </button>
                <button type="button" onClick={() => send('Từ nội dung tài liệu đính kèm, hãy tạo cho mình 5 câu trắc nghiệm tương tác trên Canvas kèm giải thích chi tiết (trích dẫn [Trang X]).')}>
                  Tạo đề 5 câu Canvas
                </button>
                <button type="button" onClick={() => send('Trích xuất toàn bộ công thức, phương trình và định luật quan trọng trong tài liệu đính kèm.')}>
                  Trích công thức lõi
                </button>
              </div>
            </div>
          )}

          {showQuickPrompts && (
            <div className="ds-quick-prompts">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  className="ds-quick-prompt"
                  onClick={() => { setInput(qp.prompt); setShowQuickPrompts(false); inputRef.current?.focus(); }}
                >
                  <span className="ds-quick-icon"><PromptIcon name={qp.icon} size={16} /></span>
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          )}

          {(images.length > 0 || processing > 0) && (
            <div className="ds-img-grid">
              {images.map((img, idx) => (
                <div key={img.id} className="ds-img-grid-item">
                  <img
                    src={img.thumb || img.dataUrl}
                    alt={img.name}
                    onClick={() => setLightbox({ list: images.map((x) => x.thumb || x.dataUrl), index: idx })}
                  />
                  <span className="ds-img-grid-n">{idx + 1}</span>
                  <button
                    type="button"
                    className="ds-img-grid-x"
                    onClick={() => removeImage(img.id)}
                    aria-label={`Xóa ảnh ${img.name}`}
                  >
                    <IcoClose size={12} />
                  </button>
                </div>
              ))}
              {Array.from({ length: processing }).map((_, k) => (
                <div key={'p' + k} className="ds-img-grid-item loading" aria-label="Đang xử lý ảnh"><IcoLoader size={20} /></div>
              ))}
              {images.length > 0 && images.length + processing < MAX_IMAGES && (
                <button type="button" className="ds-img-grid-add" onClick={() => fileRef.current?.click()} aria-label="Thêm ảnh" title="Thêm ảnh">
                  <IcoPlusSm size={20} />
                </button>
              )}
              {images.length > 1 && (
                <button
                  type="button"
                  className="ds-img-grid-clear"
                  onClick={clearImages}
                  aria-label="Xóa tất cả ảnh"
                >
                  <IcoTrash size={12} />
                  <span>Xóa hết ({images.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Menu lệnh nhanh Slash Command "/" */}
          {input.startsWith('/') && input.length <= 18 && !input.includes(' ') && (() => {
            const qCmd = input.toLowerCase();
            const hits = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(qCmd));
            if (!hits.length) return null;
            return (
              <div className="ai2-slash-menu" role="listbox" aria-label="Lệnh nhanh AI">
                {hits.map((c) => (
                  <button
                    key={c.cmd}
                    type="button"
                    className="ai2-slash-item"
                    onClick={() => {
                      setInput(c.prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <code className="ai2-slash-cmd">{c.cmd}</code>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Soft Paywall chuẩn 9Study khi hết Credit: vẫn cho soạn câu hỏi và xem lịch sử */}
          {uid && creditBalance !== null && (() => {
            const liveCost = calcChatCreditCost({
              imageCount: images.length + docs.filter((d) => d.base64).length,
              deepThink,
              docCount: docs.filter((d) => !d.base64).length,
            });
            if (creditBalance >= liveCost) return null;
            return (
              <div className="elec-chat-soft-paywall" role="status">
                <div className="elec-chat-sp-lead">
                  <img
                    src="/img/elec/elec-plead.png"
                    alt="Linh vật ELEC AI"
                    className="elec-chat-sp-mascot"
                    width="44"
                    height="44"
                  />
                  <div className="elec-chat-sp-copy">
                    <b>Số dư ELEC Credit không đủ ({formatCredits(creditBalance)} / {formatCredits(liveCost)} Credit)</b>
                    <span>Bạn vẫn có thể soạn sẵn câu hỏi và xem toàn bộ lịch sử trò chuyện.</span>
                  </div>
                </div>
                <div className="elec-chat-sp-actions">
                  <button
                    type="button"
                    className="elec-chat-sp-btn"
                    onClick={() => window.dispatchEvent(new CustomEvent('elec-open-credit-topup'))}
                  >
                    Mua ELEC Credit
                  </button>
                </div>
              </div>
            );
          })()}

          {symbolBarOpen && (
            <div className="elec-symbol-bar" role="toolbar" aria-label="Chèn nhanh ký hiệu Khoa học Tự nhiên">
              {KHTN_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  className="elec-symbol-btn"
                  onClick={() => insertAtCursor(sym)}
                  title={`Chèn ký hiệu ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}

          <div className={'ds-input-bar gm-composer' + (deepThink ? ' is-deepthink' : '') + (tempMode ? ' is-temp' : '') + (loading ? ' is-streaming' : '')}>
            <div className="gm-composer-top">
              <textarea
                ref={inputRef}
                className="ds-input gm-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={tempMode ? 'Hỏi ẩn danh (không lưu lịch sử)...' : placeholder}
                aria-label="Nhập câu hỏi"
                maxLength={4000}
                rows={1}
              />
            </div>

            <div className="gm-composer-bar">
              <div className="gm-composer-left">
                <button
                  className={'gm-tool-circle' + (attachOpen ? ' on' : '')}
                  onClick={(e) => { e.stopPropagation(); setAttachOpen((v) => !v); }}
                  title="Đính kèm ảnh hoặc chụp đề"
                  aria-label="Đính kèm"
                  aria-expanded={attachOpen}
                  type="button"
                >
                  <IcoPlus size={19} />
                </button>
                <input ref={fileRef} type="file" accept="image/*,.heic,.heif,.pdf,.docx,.xlsx,.xls,.txt,.md,.csv" multiple className="ds-file-hidden" tabIndex={-1} aria-label="Tải ảnh hoặc tài liệu lên để AI phân tích" onChange={pickImages} />
                <input ref={docRef} type="file" accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.csv" multiple className="ds-file-hidden" tabIndex={-1} aria-label="Tải tài liệu PDF, Word, Excel hoặc TXT" onChange={pickImages} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="ds-file-hidden" tabIndex={-1} aria-label="Chụp ảnh bài tập bằng camera" onChange={pickImages} />

                {/* Nút DeepThink kiểu DeepSeek R1 */}
                <button
                  type="button"
                  className={'gm-tool-pill gm-deepthink-pill' + (deepThink ? ' active' : '')}
                  onClick={() => setDeepThink((v) => !v)}
                  aria-pressed={deepThink}
                  title="Bật suy luận sâu & thẩm định chéo kết quả (kiểu DeepSeek R1)"
                >
                  <IcoBrain size={15} />
                  <span>DeepThink</span>
                </button>

                <button
                  type="button"
                  className="gm-tool-pill"
                  onClick={() => cameraRef.current?.click()}
                  title="Chụp ảnh đề bài nhận diện OCR tức thì"
                >
                  <IcoCamera size={15} />
                  <span>Chụp đề</span>
                </button>

                <button
                  type="button"
                  className="gm-tool-pill"
                  onClick={() => {
                    setInput('Hãy chấm từng dòng trong ảnh nháp/bài giải viết tay này của mình, chỉ rõ dòng nào bắt đầu biến đổi sai dấu, sai đơn vị hay sai công thức và sửa lại từ dòng đó.');
                    fileRef.current?.click();
                  }}
                  title="Tải ảnh nháp viết tay để AI bắt lỗi từng dòng"
                >
                  <IcoShieldCheck size={15} />
                  <span>Chấm nháp</span>
                </button>

                <button
                  type="button"
                  className={'gm-tool-pill' + (activeChalkboardLesson ? ' active-studio' : '')}
                  onClick={() => {
                    if (activeChalkboardLesson) {
                      setActiveChalkboardLesson(null);
                    } else {
                      setActiveInteractiveQuiz(null);
                      setActiveChalkboardLesson(getDefaultPresetForSubject(subjectLens));
                    }
                  }}
                  title="Mở ngay Studio vẽ hình 3D & 2D KHTN tương tác (6 mô hình mẫu + Vẽ tay + Lệnh trực tiếp)"
                >
                  <IcoWand size={15} />
                  <span>Bảng 3D</span>
                </button>

                <button
                  className={'gm-tool-circle elec-slash-btn' + (symbolBarOpen ? ' on' : '')}
                  onClick={() => setSymbolBarOpen((v) => !v)}
                  title="Thanh chèn nhanh ký hiệu KHTN (→, ⇌, Δ, ω, λ, Ω, ², ³, √...)"
                  aria-label="Ký hiệu KHTN"
                  aria-pressed={symbolBarOpen}
                  type="button"
                >
                  <span className="elec-slash-mark" aria-hidden="true">Σ</span>
                </button>

                <button
                  className={'gm-tool-circle elec-slash-btn' + (showQuickPrompts ? ' on' : '')}
                  onClick={() => setShowQuickPrompts((v) => !v)}
                  title="Prompt mẫu & lệnh nhanh (/)"
                  aria-label="Prompt mẫu"
                  type="button"
                >
                  <span className="elec-slash-mark" aria-hidden="true">/</span>
                </button>
              </div>

              <div className="gm-composer-right">
                <button
                  className={'gm-tool-circle' + (listening ? ' rec' : '')}
                  onClick={toggleVoice}
                  title={listening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                  aria-label={listening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                  aria-pressed={listening}
                  type="button"
                >
                  <IcoMic size={17} />
                </button>

                {uid && (() => {
                  const liveCost = calcChatCreditCost({
                    imageCount: images.length + docs.filter((d) => d.base64).length,
                    deepThink,
                    docCount: docs.filter((d) => !d.base64).length,
                  });
                  const low = creditBalance !== null && creditBalance < liveCost;
                  return (
                    <span
                      className={`elec-chat-cost-chip ${low ? 'is-insufficient' : ''}`}
                      title={`Lượt gửi này trừ đúng ${formatCredits(liveCost)} Credit (${deepThink ? 'DeepThink' : 'Chat nhanh'}${images.length > 0 ? ` + ${images.length} ảnh` : ''}). Lượt lỗi được hoàn 100%.`}
                    >
                      −{formatCredits(liveCost)}
                    </span>
                  );
                })()}

                {loading ? (
                  <button className="ds-send stop gm-send-btn" onClick={stop} type="button" aria-label="Dừng trả lời" title="Dừng">
                    <IcoStop size={15} />
                  </button>
                ) : (
                  <button className="ds-send gm-send-btn" onClick={() => send()} disabled={!hasInput} type="button" aria-label="Gửi">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 19V5" />
                      <path d="m5 12 7-7 7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Thanh chọn Môn học tối giản + 4 thẻ gợi ý Editorial 2×2 */}
          {messages.length === 0 && !(showLive && (streaming || reasoning)) && (
            <div className="elec-discover">
              <div className="elec-lens-tabs" role="tablist" aria-label="Chọn môn trọng tâm">
                {SUBJECT_LENSES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={subjectLens === l.id}
                    className={`elec-lens-tab tone-${l.tone} ${subjectLens === l.id ? 'active' : ''}`}
                    onClick={() => setSubjectLens(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="elec-prompt-grid">
                {(SUBJECT_CARDS[subjectLens] || SUBJECT_CARDS.all).map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    className={`elec-prompt-card kind-${card.kind}`}
                    onClick={() => send(card.prompt)}
                  >
                    <span className="elec-prompt-ico" aria-hidden="true">
                      <SubjectGlyph kind={card.kind} />
                    </span>
                    <span className="elec-prompt-copy">
                      <span className="elec-prompt-title">{card.title}</span>
                      <span className="elec-prompt-sub">{card.sub}</span>
                    </span>
                    <span className="elec-prompt-arrow" aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {input.length > 3200 && <p className={'ds-counter' + (input.length >= 3900 ? ' max' : '')}>{input.length}/4000</p>}
          {listening && (
            <div className="gm-voice-wave" aria-live="polite">
              <span className="gm-wave-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
              <span>Đang nghe giọng nói của bạn… bấm Micro để dừng</span>
            </div>
          )}
          {quotaError && <p className="ds-quota-error">{quotaError}</p>}
          {err && (
            <p className="ds-error">
              <span>{err}</span>
              {canRetry && <button type="button" className="ds-retry" onClick={() => regenerate(true)}>Thử lại</button>}
            </p>
          )}
          <p className="ds-disclaimer elec-disclaimer">
            <b>ELEC AI</b> · Trợ lý Khoa học Tự nhiên Việt Nam · AI có thể mắc lỗi, hãy kiểm tra lại công thức &amp; đơn vị quan trọng.
          </p>
        </div>
      </div>
          </div>

          {hasCanvas && (
            <>
              <div
                className={`elec-split-resizer ${isResizingCanvas ? 'is-dragging' : ''}`}
                role="separator"
                aria-orientation="vertical"
                aria-label="Kéo để chỉnh độ rộng giữa Chat AI và Bảng tương tác"
                title="Kéo sang trái/phải để chỉnh độ rộng bảng"
                onMouseDown={startCanvasResize}
                onTouchStart={startCanvasResize}
              />
              <aside
                className="ds-stage-canvas-panel"
                aria-label={activeInteractiveQuiz ? 'Bảng tương tác trắc nghiệm AI' : 'Bảng vẽ hình học tương tác'}
              >
                {activeInteractiveQuiz && (
                  <InteractiveQuizCanvas
                    quiz={activeInteractiveQuiz}
                    uid={uid}
                    onAskAi={(prompt) => send(prompt)}
                    onClose={() => setActiveInteractiveQuiz(null)}
                  />
                )}
                {activeChalkboardLesson && !activeInteractiveQuiz && (
                  <InteractiveChalkboardCanvas
                    lesson={activeChalkboardLesson}
                    onSelectLesson={(preset) => setActiveChalkboardLesson(preset)}
                    onAskAi={(prompt) => send(prompt)}
                    onClose={() => setActiveChalkboardLesson(null)}
                  />
                )}
              </aside>
            </>
          )}
        </div>
      </div>

      {/* Máy tính Casio fx-580VN X nổi ngay trong phòng Chat AI */}
      {casioOpen && (
        <div className="elec-chat-casio-dock" role="dialog" aria-label="Máy tính Casio fx-580VN X">
          <div className="elec-chat-casio-head">
            <div className="elec-chat-casio-title">
              <IcoCalc size={15} />
              <span>Casio fx-580VN X</span>
              <small>STUDIO PRO</small>
            </div>
            <button
              type="button"
              className="elec-chat-casio-close"
              onClick={() => setCasioOpen(false)}
              aria-label="Đóng máy tính Casio"
            >
              <IcoClose size={14} />
            </button>
          </div>
          <div className="elec-chat-casio-body">
            <Suspense fallback={<div className="elec-chat-casio-loading">Đang khởi động Casio fx-580VN X…</div>}>
              <Casio580Widget compact captureKeyboard={false} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Bảng Tra cứu nhanh KHTN (Bảng tuần hoàn + Tính M + Hằng số GDPT 2025) */}
      {quickRefOpen && (
        <Suspense fallback={null}>
          <ChatScienceQuickRef
            onInsert={(txt) => insertAtCursor(txt)}
            onClose={() => setQuickRefOpen(false)}
          />
        </Suspense>
      )}

      {/* Thanh bôi đen hỏi tại chỗ (Claude Artifacts × ChatGPT Canvas Highlight-to-Ask) */}
      {selBar && (
        <div
          className="elec-sel-bar"
          style={{ left: `${selBar.x}px`, top: `${selBar.y}px` }}
          role="toolbar"
          aria-label="Hỏi nhanh về đoạn vừa bôi đen"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => {
              const snippet = selBar.text;
              setSelBar(null);
              window.getSelection?.()?.removeAllRanges?.();
              send(`Giải thích thật dễ hiểu và chi tiết hơn đoạn này: «${snippet}»`);
            }}
          >
            Giải thích kỹ
          </button>
          <button
            type="button"
            onClick={() => {
              const snippet = selBar.text;
              setSelBar(null);
              window.getSelection?.()?.removeAllRanges?.();
              send(`Tại sao có công thức / kết luận này? Hãy chứng minh ngắn gọn bản chất của: «${snippet}»`);
            }}
          >
            Chứng minh
          </button>
          <button
            type="button"
            onClick={() => {
              const snippet = selBar.text;
              setSelBar(null);
              window.getSelection?.()?.removeAllRanges?.();
              send(`Giữ nguyên dạng bài nhưng đổi số liệu mới để mình tự luyện dựa trên phần: «${snippet}»`);
            }}
          >
            Đổi số luyện thêm
          </button>
        </div>
      )}

      <ConfirmDialog state={confirmState} onClose={closeConfirm} />
      {lightbox && <Lightbox state={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}