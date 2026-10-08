import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks.js';
import { askAI, compressImage, AI_READY } from '../lib/ai.js';
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
import { getQuota, canSend, consumeQuota } from '../lib/quota.js';
import { useAuth } from '../hooks/useAuth.jsx';
import VerifiedBadge from './VerifiedBadge.jsx';
import { MarkdownLike, CollapsibleText, ReasoningSteps } from './ChatMarkdown.jsx';
import * as tts from '../lib/tts.js';
import {
  IcoPlus, IcoChat, IcoTrash, IcoChevron, IcoClose, IcoImage, IcoSend, IcoBrain,
  IcoCopy, IcoCheck, IcoUser, IcoCrown, IcoLogout, IcoSettings, IcoSparkle,
  IcoCamera, IcoStop, IcoRefresh, IcoSearch,
} from './Icons.jsx';
import {
  PromptIcon, IcoMic, IcoDownload, IcoEdit, IcoArrowDown, IcoUploadCloud,
  IcoChevL, IcoChevR, IcoPlusSm, IcoLoader,
} from './AIChatIcons.jsx';
import './AIChat.css';
import '../AIChat-glass.css';
import '../AIChat-pro.css';
import '../AIChat-fix.css';
import '../AIChat-glass-v2.css';

/* ============================================================
   ICONS
   ============================================================ */
const IcoAIStar = ({ size = 18 }) => (
  <svg className="ds-sparkle" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 3.2c.5 3.9 2.4 6.1 6.3 6.8-3.9.7-5.8 2.9-6.3 6.8-.5-3.9-2.4-6.1-6.3-6.8C7.6 9.3 9.5 7.1 10 3.2Z" />
    <path className="s2" d="M18.4 13.6c.25 1.9 1.2 3 3.1 3.4-1.9.35-2.85 1.45-3.1 3.4-.25-1.95-1.2-3.05-3.1-3.4 1.9-.4 2.85-1.5 3.1-3.4Z" />
  </svg>
);

const IcoWand = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h0M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
  </svg>
);

const IcoPin = ({ size = 13, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 17v5M9 3h6l-1 7 3 2v2H7v-2l3-2-1-7z" />
  </svg>
);

const IcoSpeaker = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
  </svg>
);

const IcoSpeakerOff = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="m23 9-6 6M17 9l6 6" />
  </svg>
);

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
  { icon: 'book', label: 'Tóm tắt lý thuyết', prompt: 'Tóm tắt lý thuyết liên quan cần nhớ để giải dạng bài này.' },
];

const SUGGESTION_POOL = [
  { tag: 'Định luật', text: 'Giải thích định luật bảo toàn khối lượng', icon: 'scale' },
  { tag: 'Bảng tuần hoàn', text: 'Sinh 5 câu hỏi về bảng tuần hoàn', icon: 'table' },
  { tag: 'Cân bằng PTHH', text: 'Cách cân bằng phương trình Fe + O2', icon: 'flask' },
  { tag: 'Dung dịch', text: 'Giải thích công thức tính pH', icon: 'drop' },
  { tag: 'Cấu tạo nguyên tử', text: 'Cách viết cấu hình electron của nguyên tử', icon: 'atom' },
  { tag: 'Mol & khối lượng', text: 'Cách tính số mol và khối lượng chất tham gia', icon: 'bolt' },
  { tag: 'Oxi hóa - khử', text: 'Cách xác định chất oxi hóa và chất khử', icon: 'bulb' },
  { tag: 'Liên kết hóa học', text: 'Phân biệt liên kết ion và liên kết cộng hóa trị', icon: 'steps' },
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
const onAiPage = () => location.hash.slice(1) === 'ai';
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

/* ============================================================
   STRIP MARKDOWN — Fix lỗi hiển thị ** ** trong preview
   ============================================================ */
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

/* ============================================================
   SUBCOMPONENTS
   ============================================================ */
function UserAvatar({ user, initial, color }) {
  return (
    <div className="ds-user-avatar" style={{ background: color, color: '#111' }}>
      {user?.photoURL
        ? <img src={user.photoURL} alt="" />
        : initial}
    </div>
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
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor" strokeWidth="2.5"
          opacity=".15"
        />
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
export default function AIChat() {
  const { user, tier, logout } = useAuth();
  const uid = user?.uid;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chats, setChats] = useLocalStorage('cs-ai-chats', []);
  const [activeId, setActiveId] = useLocalStorage('cs-ai-active', null);

  const [input, setInput] = useState(readDraft);
  const [sugSeed, setSugSeed] = useState(() => Date.now() % 100000);
  const [images, setImages] = useState([]);
  const [grade, setGrade] = useState('Lớp 11');
  const [busyId, setBusyId] = useState(null);
  const [streaming, setStreaming] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);
  const [err, setErr] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [quota, setQuota] = useState(() => getQuota(uid, tier));
  const [quotaError, setQuotaError] = useState('');
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

  const lastSeenLenRef = useRef(0);
  const end = useRef(null);
  const imagesRef = useRef([]);
  const dragDepth = useRef(0);
  const recRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const sendRef = useRef(null);
  const stopRef = useRef(null);
  const aiPromiseRef = useRef(null);
  const stickRef = useRef(true);
  const visibleRef = useRef(visible);
  const chatsRef = useRef(chats);
  const qTimer = useRef(null);
  const newChatRef = useRef(null);
  visibleRef.current = visible;
  chatsRef.current = chats;
  imagesRef.current = images;

  const loading = busyId !== null;
  const activeChat = useMemo(() => {
    if (!activeId) return null;
    return chats.find((c) => c.id === activeId) || null;
  }, [chats, activeId]);
  const messages = activeChat?.messages || [];
  const showLive = loading && busyId === activeId;
  const lastMsg = messages[messages.length - 1];
  const canRetry = !loading && lastMsg?.role === 'user';

  /* TTS */
  useEffect(() => {
    setTtsSupported(tts.isSupported());
    return () => tts.stop();
  }, []);
  useEffect(() => {
    if (!visible) tts.stop();
  }, [visible]);

  /* SYNC CHAT LÊN SUPABASE */
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

  /* TTS Auto-read */
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
  const goProfile = () => { setUserMenuOpen(false); location.hash = 'profile'; };
  const goUpgrade = () => {
    setUserMenuOpen(false);
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

  /* CUỘN */
  const hasMessages = messages.length > 0;
  useEffect(() => {
    const el = end.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      stickRef.current = e.isIntersecting;
      setShowJump(!e.isIntersecting);
    }, { rootMargin: '0px 0px 180px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMessages]);

  useEffect(() => {
    stickRef.current = true;
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (!stickRef.current) return;
    if (busyId !== activeId) return;
    end.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
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
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    stickRef.current = true;
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

  /* ẢNH */
  const handleFiles = useCallback(async (files) => {
    const fileArr = Array.from(files || []);
    if (fileArr.length === 0) return;

    const imgs = fileArr.filter(isImageFile);
    if (imgs.length === 0) {
      setErr('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, HEIC…).');
      return;
    }

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

  /* TTS — Đọc tin nhắn */
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

  /* XUẤT CHAT (.md) */
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

  /* SỬA TIN NHẮN ĐÃ GỬI */
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

  /* GỌI AI */
  const denyQuota = (hasImg) => {
    if (canSend(uid, tier, hasImg)) return false;
    setQuotaError(
      hasImg
        ? `Bạn đã dùng hết ${tier.quotaImage} lượt gửi ảnh hôm nay. Quay lại vào ngày mai nhé!`
        : `Bạn đã dùng hết ${tier.quotaText} lượt chat hôm nay. Nâng cấp lên CUAI VIP để chat không giới hạn!`
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

    let finalText = '';
    let finalReasoning = '';
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
          }
        );
        aiPromiseRef.current = aiPromise;

        await Promise.race([aiPromise, watchdog, stopPromise]);
      } finally {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        aiPromiseRef.current = null;
      }

      if (!finalText && !finalReasoning) {
        if (stopped) return;
        throw new Error('AI trả về rỗng. Thử gửi lại câu hỏi.');
      }

      updateChat(chatId, (c) => ({
        ...c,
        messages: [...slim(baseMessages), {
          role: 'model',
          parts: [{ text: finalText }],
          text: finalText,
          reasoning: finalReasoning,
          stopped,
        }],
      }));
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
        return;
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
      } else {
        setErr(e.message || 'Lỗi gọi AI.');
      }
    } finally {
      stopRef.current = null;
      setStreaming('');
      setReasoning('');
      setBusyId(null);
    }
  };

  const send = async (overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim();
    if ((!text && images.length === 0) || loading || processing > 0) return;

    const hasImg = images.length > 0;
    if (denyQuota(hasImg)) return;
    setQuotaError('');
    const nq = consumeQuota(uid, tier, hasImg);
    if (nq) setQuota(nq);

    let chatId = activeId;
    let current = activeChat;
    if (!chatId || !current) {
      const newId = rid();
      const fallbackTitle = images.length > 1 ? `${images.length} ảnh` : 'Phân tích ảnh';
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
    const defaultText = images.length > 1 ? 'Phân tích các ảnh này.' : 'Phân tích ảnh này.';
    const userText = (text || (images.length > 0 ? defaultText : ''))
      + `\n\nTrình độ: ${grade}. KHÔNG dùng LaTeX.`;
    parts.push({ text: userText });

    for (const img of images) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    }

    const userMsg = {
      role: 'user',
      parts,
      preview: {
        text,
        images: images.map((img) => ({
          dataUrl: img.thumb || img.dataUrl,
          width: img.width,
          height: img.height,
        })),
      },
    };

    const baseMessages = [...current.messages, userMsg];
    const fallbackTitle = images.length > 1 ? `${images.length} ảnh` : 'Phân tích ảnh';

    updateChat(chatId, (c) => ({
      ...c,
      messages: slim(baseMessages),
      title: c.messages.length === 0 ? (text ? text.slice(0, 40) : fallbackTitle) : c.title,
    }));

    recRef.current?.stop?.();
    setInput('');
    setImages([]);
    setShowQuickPrompts(false);
    stickRef.current = true;
    await run(chatId, baseMessages);
  };
  sendRef.current = send;

  const regenerate = (free = false) => {
    if (loading || !activeChat) return;
    const msgs = activeChat.messages;
    let i = msgs.length - 1;
    while (i >= 0 && msgs[i].role !== 'user') i--;
    if (i < 0) return;
    if (!free) {
      const hasImg = msgs[i].parts?.some((p) => p.inlineData) || (msgs[i].preview?.images?.length > 0);
      if (denyQuota(hasImg)) return;
      const nq = consumeQuota(uid, tier, hasImg);
      if (nq) setQuota(nq);
    }
    const base = msgs.slice(0, i + 1).map((m, k) => (k === i ? withImages(m) : m));
    updateChat(activeChat.id, (c) => ({ ...c, messages: slim(base) }));
    stickRef.current = true;
    run(activeChat.id, base);
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
  const userInitial = (userName || user?.email || '?').trim().charAt(0).toUpperCase();
  const statusText = loading
    ? reasoning ? 'đang phân tích…' : streaming ? 'đang trả lời…' : 'đang suy nghĩ…'
    : 'sẵn sàng';
  const markMode = loading ? 'think' : 'idle';

  const hasInput = (Boolean(input.trim()) || images.length > 0) && processing === 0;
  const placeholder = images.length > 0
    ? `Đã chọn ${images.length} ảnh — thêm mô tả (không bắt buộc)…`
    : 'Hỏi về Hóa học, hoặc dán ảnh đề bài…';

  /* RENDER */
  return (
    <div
      className="ds-page"
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
      {dragging && (
        <div className="ds-dropzone" aria-hidden="true">
          <div className="ds-dropzone-card">
            <IcoUploadCloud size={44} />
            <b>Thả ảnh vào đây</b>
            <span>Tối đa {MAX_IMAGES} ảnh · JPG, PNG, WebP, HEIC</span>
          </div>
        </div>
      )}

      {/* ============ SIDEBAR ============ */}
      <aside className={'ds-sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="ds-sidebar-head">
          <button className="ds-new-btn" onClick={newChat} type="button">
            <IcoPlus size={16} />
            <span>Trò chuyện mới</span>
          </button>
          <button className="ds-sidebar-close" onClick={() => setSidebarOpen(false)} type="button" aria-label="Đóng">
            <IcoClose size={18} />
          </button>
        </div>

        {chats.length > 4 && (
          <label className="ds-search">
            <IcoSearch size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm cuộc trò chuyện" aria-label="Tìm cuộc trò chuyện" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"><IcoClose size={12} /></button>}
          </label>
        )}

        <div className="ds-sidebar-body">
          {chats.length === 0 ? (
            <p className="ds-sidebar-empty">Chưa có cuộc trò chuyện nào.</p>
          ) : filtered.length === 0 ? (
            <p className="ds-sidebar-empty">Không có kết quả cho "{query}".</p>
          ) : (
            Object.entries(groups).map(([key, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={key} className="ds-chat-group">
                  <div className="ds-group-label">{GROUP_LABELS[key]}</div>
                  {list.map((c) => {
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
                                  <svg
                                    className="ds-preview-ico user"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
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
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* ============ USER MENU ============ */}
        <div className="ds-user-wrap" onClick={(e) => e.stopPropagation()}>
          {userMenuOpen && (
            <div className="ds-user-menu" role="menu">
              <div className="ds-user-menu-head">
                <UserAvatar user={user} initial={userInitial} color={tier.color} />
                <div className="ds-user-menu-info">
                  <b>{userName}{tier.key === 'vip' && <VerifiedBadge isVip size={13} />}</b>
                  <small>{user?.email}</small>
                </div>
              </div>

              <div className="ds-user-menu-tier">
                <span className="ds-tier-badge" style={{ background: tier.color }}>
                  {tier.key === 'vip' ? <IcoCrown size={12} /> : <IcoSparkle size={12} />}
                  <span>{tier.name}</span>
                </span>
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
              <b>{userName}{tier.key === 'vip' && <VerifiedBadge isVip size={12} />}</b>
              <span className="ds-user-tier-name">
                {tier.key === 'vip' ? <IcoCrown size={10} /> : <IcoSparkle size={10} />}
                {tier.name}
              </span>
            </div>
            <IcoSettings size={14} />
          </button>
        </div>

        {chats.length > 0 && (
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
        <header className="ds-header">
          <div className="ds-header-inner">
            <button className="ds-menu-btn" onClick={() => setSidebarOpen(true)} type="button" aria-label="Mở lịch sử">
              <IcoChat size={18} />
            </button>

            <div className="ds-title-block">
              <AIMark size={44} mode={markMode} look animate={visible} />
              <div>
                <h2 className="ds-page-title">Trợ lý Hóa học</h2>
                <span className="ds-status" data-s={loading ? 'busy' : 'idle'} aria-live="polite">{statusText}</span>
              </div>
            </div>

            <div className="ds-quota">
              {tier.key === 'vip' ? (
                <span className="ds-quota-item vip" title="Gói CUAI VIP — Chat không giới hạn">
                  <IcoCrown size={13} /><span>VIP</span>
                </span>
              ) : (
                <QuotaRing left={quota.textLeft} total={quota.quotaText} label="lượt chat" />
              )}
              <QuotaRing left={quota.imageLeft} total={quota.quotaImage} label="lượt ảnh" />
            </div>

            <div className="ds-grade" role="radiogroup" aria-label="Trình độ">
              {CLASSES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={grade === c}
                  className={'ds-grade-btn' + (grade === c ? ' on' : '')} onClick={() => setGrade(c)}>
                  {c}
                </button>
              ))}
            </div>
            <select
              className="ds-grade-select"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              aria-label="Trình độ"
            >
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {ttsSupported && (
              <button
                className={'ds-hbtn' + (autoSpeak ? ' on' : '')}
                type="button"
                onClick={() => setAutoSpeak((v) => !v)}
                title={autoSpeak ? 'Tắt đọc tự động' : 'Tự động đọc câu trả lời'}
                aria-label="Toggle đọc tự động"
                aria-pressed={autoSpeak}
              >
                {autoSpeak ? <IcoSpeaker size={17} /> : <IcoSpeakerOff size={17} />}
              </button>
            )}

            {messages.length > 0 && (
              <button className="ds-hbtn" type="button" onClick={exportChat} title="Tải cuộc trò chuyện (.md)" aria-label="Tải cuộc trò chuyện">
                <IcoDownload size={17} />
              </button>
            )}
          </div>
        </header>

        <main className="ds-main">
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
            <div className="ds-empty">
              <AIMark size={180} look mode={markMode} animate={visible} />
              <h1 className="ds-empty-title">Hôm nay bạn muốn hỏi gì về Hóa?</h1>
              <p className="ds-empty-sub">
                Gõ câu hỏi, dán ảnh đề bài hoặc chụp trang sách. Tối đa {MAX_IMAGES} ảnh cùng lúc.
              </p>
              <div className="ds-suggestions">
                {suggestions.map((s) => (
                  <button key={s.text} className="ds-suggestion" onClick={() => send(s.text)} type="button">
                    <span className="ds-suggestion-icon"><PromptIcon name={s.icon} size={20} /></span>
                    <span className="ds-suggestion-body">
                      <span className="ds-suggestion-tag">{s.tag}</span>
                      <span className="ds-suggestion-text">{s.text}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" className="ds-suggest-refresh" onClick={() => setSugSeed((v) => v + 7919)}>
                <IcoRefresh size={13} />
                <span>Gợi ý khác</span>
              </button>
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
                        <AIMark size={40} animate={false} className="ds-avatar" />
                        <div className="ds-msg-body">
                          {m.reasoning && (
                            <div className="ds-reasoning-box">
                              <button className="ds-reasoning-toggle" onClick={() => setShowReasoning((v) => !v)} type="button" aria-expanded={showReasoning}>
                                <IcoBrain size={13} />
                                <span>Phân tích của AI</span>
                                <span className={'ds-reasoning-arrow' + (showReasoning ? ' open' : '')}><IcoChevron size={11} /></span>
                              </button>
                              {showReasoning && (
                                <div className="ds-reasoning-content"><ReasoningSteps text={m.reasoning} /></div>
                              )}
                            </div>
                          )}

                          <div className={'ds-msg-content' + (m.isQuotaError ? ' quota-error' : '')}>
                            {m.isQuotaError ? (
                              <MarkdownLike text={m.text || ''} />
                            ) : (
                              <CollapsibleText defaultOpen={isLast}>
                                <MarkdownLike text={m.text || ''} />
                              </CollapsibleText>
                            )}
                          </div>

                          {m.stopped && <span className="ds-stopped">đã dừng — câu trả lời chưa đầy đủ</span>}

                          <div className={'ds-msg-actions' + (isLast ? ' last' : '')}>
                            <button className="ds-msg-copy" onClick={() => copyMsg(m.text || '', 'm' + i)} type="button">
                              {copied === 'm' + i ? <IcoCheck size={13} /> : <IcoCopy size={13} />}
                              <span>{copied === 'm' + i ? 'Đã chép' : 'Sao chép'}</span>
                            </button>

                            {ttsSupported && m.text && !m.isQuotaError && (
                              <button
                                className={'ds-msg-speak' + (speakingId === 'msg-' + i ? ' on' : '')}
                                onClick={() => speakMsg(m.text, 'msg-' + i)}
                                type="button"
                                title={speakingId === 'msg-' + i ? 'Dừng đọc' : 'Đọc câu trả lời'}
                              >
                                {speakingId === 'msg-' + i ? <IcoSpeakerOff size={13} /> : <IcoSpeaker size={13} />}
                                <span>{speakingId === 'msg-' + i ? 'Đang đọc' : 'Đọc'}</span>
                              </button>
                            )}

                            {isLast && !loading && !m.isQuotaError && (
                              <button className="ds-msg-regen" onClick={() => regenerate(false)} type="button">
                                <IcoRefresh size={13} />
                                <span>Tạo lại</span>
                              </button>
                            )}
                          </div>
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
                      <div className="ds-reasoning-box streaming">
                        <div className="ds-reasoning-toggle">
                          <IcoBrain size={13} />
                          <span>Đang phân tích…</span>
                          <span className="ds-typing"><i /><i /><i /></span>
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
                  <AIMark size={40} mode="think" animate={visible} className="ds-avatar" />
                  <div className="ds-msg-body">
                    {reasoning ? (
                      <div className="ds-reasoning-box streaming">
                        <div className="ds-reasoning-toggle">
                          <IcoBrain size={13} />
                          <span>Đang phân tích…</span>
                          <span className="ds-typing"><i /><i /><i /></span>
                        </div>
                        <div className="ds-reasoning-content"><ReasoningSteps text={reasoning} /></div>
                      </div>
                    ) : (
                      <span className="ds-thinking">Đang suy nghĩ…</span>
                    )}
                  </div>
                </div>
              )}

              <div ref={end} />
            </div>
          )}
        </main>
      </div>

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

          <div className="ds-input-bar">
            <button
              className="ds-input-icon ds-icon-gallery"
              onClick={() => fileRef.current?.click()}
              title="Chọn ảnh (tối đa 10)"
              aria-label="Chọn ảnh"
              type="button"
            >
              <IcoImage size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="ds-file-hidden" tabIndex={-1} onChange={pickImages} />

            <button
              className="ds-input-icon ds-icon-camera"
              onClick={() => cameraRef.current?.click()}
              title="Chụp ảnh"
              aria-label="Chụp ảnh"
              type="button"
            >
              <IcoCamera size={18} />
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="ds-file-hidden" tabIndex={-1} onChange={pickImages} />

            <button
              className={'ds-input-icon ds-icon-wand' + (showQuickPrompts ? ' on' : '')}
              onClick={() => setShowQuickPrompts((v) => !v)}
              title="Prompt mẫu nhanh"
              aria-label="Prompt mẫu"
              type="button"
            >
              <IcoWand size={18} />
            </button>

            <textarea
              ref={inputRef}
              className="ds-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              aria-label="Nhập câu hỏi"
              maxLength={4000}
              rows={1}
            />

            <button
              className={'ds-input-icon ds-icon-mic' + (listening ? ' rec' : '')}
              onClick={toggleVoice}
              title={listening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
              aria-label={listening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
              aria-pressed={listening}
              type="button"
            >
              <IcoMic size={18} />
            </button>

            {loading ? (
              <button className="ds-send stop" onClick={stop} type="button" aria-label="Dừng trả lời" title="Dừng">
                <IcoStop size={18} />
              </button>
            ) : (
              <button className="ds-send" onClick={() => send()} disabled={!hasInput} type="button" aria-label="Gửi">
                {hasInput ? <IcoSend size={18} /> : <IcoAIStar size={18} />}
              </button>
            )}
          </div>

          {input.length > 3200 && <p className={'ds-counter' + (input.length >= 3900 ? ' max' : '')}>{input.length}/4000</p>}
          {listening && <p className="ds-listening"><i /><i /><i /> Đang nghe… bấm micro để dừng</p>}
          {quotaError && <p className="ds-quota-error">{quotaError}</p>}
          {err && (
            <p className="ds-error">
              <span>{err}</span>
              {canRetry && <button type="button" className="ds-retry" onClick={() => regenerate(true)}>Thử lại</button>}
            </p>
          )}
          <p className="ds-disclaimer">AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.</p>
        </div>
      </div>

      <ConfirmDialog state={confirmState} onClose={closeConfirm} />
      {lightbox && <Lightbox state={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}