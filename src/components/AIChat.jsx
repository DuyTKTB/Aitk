import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks.js';
import { askAI, compressImage, AI_READY } from '../lib/ai.js';
import AIMark from './AIMark.jsx';
import { getQuota, canSend, useQuota as consumeQuota } from '../lib/quota.js';
import { useAuth } from '../hooks/useAuth.jsx';
import VerifiedBadge from './VerifiedBadge.jsx';
import { MarkdownLike, CollapsibleText } from './ChatMarkdown.jsx';
import {
  IcoPlus, IcoChat, IcoTrash, IcoChevron, IcoClose, IcoImage, IcoSend, IcoBrain,
  IcoCopy, IcoCheck, IcoUser, IcoCrown, IcoLogout, IcoSettings, IcoSparkle,
  IcoCamera, IcoStop, IcoRefresh, IcoSearch,
} from './Icons2.jsx';
import {
  PromptIcon, IcoMic, IcoDownload, IcoEdit, IcoArrowDown, IcoUploadCloud,
  IcoChevL, IcoChevR, IcoPlusSm, IcoLoader,
} from './AIChatIcons.jsx';
import './AIChat.css';
import '../AIChat-glass.css';
import '../AIChat-pro.css';

/* Nút AI lấp lánh */
const IcoAIStar = ({ size = 18 }) => (
  <svg className="ds-sparkle" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 3.2c.5 3.9 2.4 6.1 6.3 6.8-3.9.7-5.8 2.9-6.3 6.8-.5-3.9-2.4-6.1-6.3-6.8C7.6 9.3 9.5 7.1 10 3.2Z" />
    <path className="s2" d="M18.4 13.6c.25 1.9 1.2 3 3.1 3.4-1.9.35-2.85 1.45-3.1 3.4-.25-1.95-1.2-3.05-3.1-3.4 1.9-.4 2.85-1.5 3.1-3.4Z" />
  </svg>
);

/* Icon mới */
const IcoWand = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h0M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
  </svg>
);

const IcoExpand = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const IcoGrad = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const CLASSES = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

/* Prompt mẫu nhanh */
const QUICK_PROMPTS = [
  { icon: 'steps', label: 'Giải chi tiết', prompt: 'Giải bài này chi tiết từng bước, ghi rõ công thức và đơn vị.' },
  { icon: 'bolt', label: 'Giải nhanh', prompt: 'Giải nhanh, chỉ ghi kết quả và 1-2 dòng giải thích.' },
  { icon: 'bulb', label: 'Giải thích khái niệm', prompt: 'Giải thích khái niệm trong bài này bằng ngôn ngữ dễ hiểu, có ví dụ.' },
  { icon: 'repeat', label: 'Tạo bài tương tự', prompt: 'Tạo 3 bài tập tương tự để mình luyện thêm (có đáp án).' },
  { icon: 'bug', label: 'Tìm lỗi sai', prompt: 'Chỉ ra lỗi sai thường gặp khi giải dạng bài này.' },
  { icon: 'book', label: 'Tóm tắt lý thuyết', prompt: 'Tóm tắt lý thuyết liên quan cần nhớ để giải dạng bài này.' },
];

/* Gợi ý khi trống */
const SUGGESTIONS = [
  { tag: 'Định luật', text: 'Giải thích định luật bảo toàn khối lượng', icon: 'scale' },
  { tag: 'Bảng tuần hoàn', text: 'Sinh 5 câu hỏi về bảng tuần hoàn', icon: 'table' },
  { tag: 'Cân bằng PTHH', text: 'Cách cân bằng phương trình Fe + O2', icon: 'flask' },
  { tag: 'Dung dịch', text: 'Giải thích công thức tính pH', icon: 'drop' },
];

const MAX_CHATS = 50;
const MAX_IMAGES = 10;
const rid = () => Math.random().toString(36).slice(2, 10);
const isCoarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const onAiPage = () => location.hash.slice(1) === 'ai';
const stamp = (c) => c.updatedAt || c.createdAt || 0;

const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
/* Trên điện thoại file có thể có type rỗng (HEIC...) → kiểm tra thêm theo đuôi file */
const isImageFile = (f) => Boolean(f) && ((f.type && f.type.startsWith('image/')) || IMG_EXT.test(f.name || ''));

/* Ảnh thu nhỏ để hiển thị / lưu lịch sử (nhẹ hơn nhiều so với ảnh gửi AI) */
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

/* Bỏ dữ liệu ảnh base64 nặng khỏi tin nhắn lưu localStorage (giữ thumbnail trong preview) */
const slim = (msgs) => msgs.map((m) => (m.parts?.some((p) => p.inlineData)
  ? { ...m, parts: m.parts.filter((p) => !p.inlineData) }
  : m));

/* Dựng lại inlineData từ thumbnail khi cần gửi lại (Tạo lại / Thử lại) */
const withImages = (m) => {
  if (m.parts?.some((p) => p.inlineData)) return m;
  const list = m.preview?.images || [];
  if (list.length === 0) return m;
  const extra = list.map((im) => ({
    inlineData: {
      mimeType: (im.dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg',
      data: im.dataUrl.split(',')[1],
    },
  }));
  return { ...m, parts: [...(m.parts || []), ...extra] };
};

const SpeechRec = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

const GROUP_LABELS = { today: 'Hôm nay', yesterday: 'Hôm qua', week: '7 ngày qua', older: 'Cũ hơn' };

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
      const label = m.preview?.text
        || (imgCount > 1 ? `[${imgCount} ảnh]` : imgCount === 1 ? '[Ảnh]' : 'Tin nhắn');
      out.push({ id: i, text: label.slice(0, 60) });
    }
  });
  return out.slice(-max);
}

function UserAvatar({ user, initial, color }) {
  return (
    <div className="ds-user-avatar" style={{ background: color, color: '#111' }}>
      {user?.photoURL
        ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
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

/* Lightbox ảnh — xem nhiều ảnh, phím ← →, vuốt, tải về */
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

export default function AIChat() {
  const { user, tier, logout } = useAuth();
  const uid = user?.uid;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chats, setChats] = useLocalStorage('cs-ai-chats', []);
  const [activeId, setActiveId] = useLocalStorage('cs-ai-active', null);

  const [input, setInput] = useState('');
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

  const end = useRef(null);
  const imagesRef = useRef([]);
  const dragDepth = useRef(0);
  const recRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const sendRef = useRef(null);
  const stopRef = useRef(null);
  const stickRef = useRef(true);
  const visibleRef = useRef(visible);
  const chatsRef = useRef(chats);
  const qTimer = useRef(null);
  visibleRef.current = visible;
  chatsRef.current = chats;
  imagesRef.current = images;

  const loading = busyId !== null;
  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);
  const messages = activeChat?.messages || [];
  const showLive = loading && busyId === activeId;
  const lastMsg = messages[messages.length - 1];
  const canRetry = !loading && lastMsg?.role === 'user';

  /* ---------- Điều hướng ---------- */
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

  /* ---------- Chỉ hoạt động khi đang ở trang AI ---------- */
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

  /* ---------- Cuộn ---------- */
  const hasMessages = messages.length > 0;
  useEffect(() => {
    const el = end.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => { stickRef.current = e.isIntersecting; setShowJump(!e.isIntersecting); }, { rootMargin: '0px 0px 180px 0px' });
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

  /* ---------- Khác ---------- */
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

  /* ---------- Ảnh ---------- */
  const handleFiles = useCallback(async (files) => {
    /* QUAN TRỌNG: FileList là danh sách "sống". Phải sao chép sang mảng NGAY,
       vì khi input bị reset (value = '') thì FileList bị làm rỗng. */
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
    const files = Array.from(e.target.files || []);   // sao chép TRƯỚC khi reset input
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

  /* ---------- Nhập bằng giọng nói ---------- */
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

  /* ---------- Xuất cuộc trò chuyện (.md) ---------- */
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

  /* ---------- Đổi tên cuộc trò chuyện ---------- */
  const startRename = (c, e) => { e?.stopPropagation(); setRenamingId(c.id); setRenameVal(c.title || ''); };
  const commitRename = () => {
    const t = renameVal.trim();
    const id = renamingId;
    if (t && id) setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: t.slice(0, 60) } : c)));
    setRenamingId(null);
  };

  /* ---------- Sửa lại tin nhắn đã gửi ---------- */
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

  /* ---------- Quản lý cuộc trò chuyện ---------- */
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
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const updateChat = (id, updater) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c)));
  };

  const deleteChat = (id, e) => {
    e?.stopPropagation();
    askConfirm({
      title: 'Xóa cuộc trò chuyện?',
      body: 'Cuộc trò chuyện này sẽ bị xóa khỏi thiết bị.',
      okLabel: 'Xóa',
      onOk: () => {
        const rest = chatsRef.current.filter((c) => c.id !== id);
        setChats(rest);
        if (activeId === id) setActiveId(rest[0]?.id || null);
      },
    });
  };

  const deleteAll = () => {
    askConfirm({
      title: 'Xóa tất cả cuộc trò chuyện?',
      body: 'Không thể hoàn tác.',
      okLabel: 'Xóa tất cả',
      onOk: () => { setChats([]); setActiveId(null); },
    });
  };

  const openChat = (chatId) => {
    setActiveId(chatId);
    setSidebarOpen(false);
    setErr('');
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

  /* ---------- Gọi AI ---------- */
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
        stopRef.current = () => { stopped = true; resolve('stopped'); };
      });

      try {
        await Promise.race([
          askAI(
            apiHistory,
            (partial) => { if (timedOut || stopped) return; arm(); pendText = partial; schedule(); finalText = partial; },
            (part) => { if (timedOut || stopped) return; arm(); pendReason = part; schedule(); finalReasoning = part; }
          ),
          watchdog,
          stopPromise,
        ]);
      } finally {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
      }

      if (!finalText && !finalReasoning) {
        if (stopped) return;
        throw new Error('AI trả về rỗng. Thử gửi lại câu hỏi.');
      }

      updateChat(chatId, (c) => ({
        ...c,
        messages: [...slim(baseMessages), { role: 'model', parts: [{ text: finalText }], text: finalText, reasoning: finalReasoning, stopped }],
      }));
    } catch (e) {
      if (e?.isQuota) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...slim(baseMessages), { role: 'model', parts: [{ text: e.message }], text: e.message, isQuotaError: true }],
        }));
      } else if (finalText) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...slim(baseMessages), { role: 'model', parts: [{ text: finalText }], text: finalText, reasoning: finalReasoning, stopped: true }],
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
    if ((!text && images.length === 0) || loading) return;

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

  const stop = () => stopRef.current?.();

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

  /* ---------- Dữ liệu hiển thị ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? chats.filter((c) => (c.title || '').toLowerCase().includes(q)) : chats;
  }, [chats, query]);
  const groups = useMemo(() => groupChats(filtered), [filtered]);

  const userName = user?.displayName || 'Ẩn danh';
  const userInitial = (userName || user?.email || '?').trim().charAt(0).toUpperCase();
  const statusText = loading
    ? reasoning ? 'đang phân tích…' : streaming ? 'đang trả lời…' : 'đang suy nghĩ…'
    : 'sẵn sàng';
  const markMode = loading ? 'think' : 'idle';

  const hasInput = Boolean(input.trim()) || images.length > 0;
  const placeholder = images.length > 0
    ? `Đã chọn ${images.length} ảnh — thêm mô tả (không bắt buộc)…`
    : 'Hỏi về Hóa học, hoặc dán ảnh đề bài…';

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
      {/* ===== SIDEBAR ===== */}
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
            <p className="ds-sidebar-empty">Không có kết quả cho “{query}”.</p>
          ) : (
            Object.entries(groups).map(([key, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={key} className="ds-chat-group">
                  <div className="ds-group-label">{GROUP_LABELS[key]}</div>
                  {list.map((c) => {
                    const subMsgs = getChatMessages(c);
                    const isExpanded = expandedId === c.id;
                    return (
                      <div key={c.id} className="ds-chat-wrapper">
                        <div className={'ds-chat-item' + (c.id === activeId ? ' active' : '')} onClick={() => openChat(c.id)}>
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
                          <button className="ds-chat-item-edit" onClick={(e) => startRename(c, e)} type="button" aria-label="Đổi tên" title="Đổi tên">
                            <IcoEdit size={13} />
                          </button>
                          <button className="ds-chat-item-del" onClick={(e) => deleteChat(c.id, e)} type="button" aria-label="Xóa">
                            <IcoTrash size={13} />
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

        {/* ===== USER MENU ===== */}
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

      {/* ===== CONTENT ===== */}
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
                <span
                  className={'ds-quota-item' + (quota.textLeft === 0 ? ' empty' : quota.textLeft <= 3 ? ' low' : '')}
                  title={`Còn ${quota.textLeft}/${quota.quotaText} lượt chat`}
                >
                  <IcoChat size={13} /><span>{quota.textLeft}/{quota.quotaText}</span>
                </span>
              )}

              <span
                className={'ds-quota-item' + (quota.imageLeft === 0 ? ' empty' : quota.imageLeft <= 1 ? ' low' : '')}
                title={`Còn ${quota.imageLeft}/${quota.quotaImage} lượt ảnh`}
              >
                <IcoImage size={13} /><span>{quota.imageLeft}/{quota.quotaImage}</span>
              </span>
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
              <AIMark size={200} look mode={markMode} animate={visible} />
              <h1 className="ds-empty-title">Hôm nay bạn muốn hỏi gì về Hóa?</h1>
              <p className="ds-empty-sub">
                Gõ câu hỏi, dán ảnh đề bài hoặc chụp trang sách. Tối đa {MAX_IMAGES} ảnh cùng lúc.
              </p>
              <div className="ds-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s.text} className="ds-suggestion" onClick={() => send(s.text)} type="button">
                    <span className="ds-suggestion-icon"><PromptIcon name={s.icon} size={22} /></span>
                    <span className="ds-suggestion-body">
                      <span className="ds-suggestion-tag">{s.tag}</span>
                      <span className="ds-suggestion-text">{s.text}</span>
                    </span>
                  </button>
                ))}
              </div>
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
                                <div className="ds-reasoning-content"><MarkdownLike text={m.reasoning} /></div>
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
                        <div className="ds-reasoning-content"><MarkdownLike text={reasoning} /></div>
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
                        <div className="ds-reasoning-content"><MarkdownLike text={reasoning} /></div>
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

      {/* ===== INPUT ===== */}
      <div className="ds-input-wrap">
        <div className="ds-input-inner">
          {showJump && hasMessages && (
            <button type="button" className="ds-jump" onClick={() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })} aria-label="Cuộn xuống cuối">
              <IcoArrowDown size={16} />
            </button>
          )}
          {/* Quick prompts */}
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

          {/* Preview ảnh */}
          {(images.length > 0 || processing > 0) && (
            <div className="ds-img-grid">
              {images.map((img, idx) => (
                <div key={img.id} className="ds-img-grid-item">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    style={{ aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : undefined }}
                    onClick={() => setLightbox({ list: images.map((x) => x.dataUrl), index: idx })}
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