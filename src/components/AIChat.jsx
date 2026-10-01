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
import './AIChat.css';
import "../AIChat-glass.css";

/* Ngôi sao AI lấp lánh — hiện khi ô nhập đang trống */
const IcoAIStar = ({ size = 18 }) => (
  <svg className="ds-sparkle" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 3.2c.5 3.9 2.4 6.1 6.3 6.8-3.9.7-5.8 2.9-6.3 6.8-.5-3.9-2.4-6.1-6.3-6.8C7.6 9.3 9.5 7.1 10 3.2Z" />
    <path className="s2" d="M18.4 13.6c.25 1.9 1.2 3 3.1 3.4-1.9.35-2.85 1.45-3.1 3.4-.25-1.95-1.2-3.05-3.1-3.4 1.9-.4 2.85-1.5 3.1-3.4Z" />
  </svg>
);

const CLASSES = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

const SUGGESTIONS = [
  { tag: 'Định luật', text: 'Giải thích định luật bảo toàn khối lượng' },
  { tag: 'Bảng tuần hoàn', text: 'Sinh 5 câu hỏi về bảng tuần hoàn' },
  { tag: 'Cân bằng PTHH', text: 'Cách cân bằng phương trình Fe + O2' },
  { tag: 'Dung dịch', text: 'Giải thích công thức tính pH' },
];

const MAX_CHATS = 50;
const rid = () => Math.random().toString(36).slice(2, 10);
const isCoarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const onAiPage = () => location.hash.slice(1) === 'ai';
const stamp = (c) => c.updatedAt || c.createdAt || 0;

const GROUP_LABELS = { today: 'Hôm nay', yesterday: 'Hôm qua', week: '7 ngày qua', older: 'Cũ hơn' };

function groupChats(chats) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { today: [], yesterday: [], week: [], older: [] };
  // mới cập nhật nằm trên cùng
  for (const c of [...chats].sort((a, b) => stamp(b) - stamp(a))) {
    const d = new Date(stamp(c)); d.setHours(0, 0, 0, 0);
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else if (d >= weekAgo) groups.week.push(c);
    else groups.older.push(c);
  }
  return groups;
}

// id = chỉ số thật trong chat.messages (trước đây là chỉ số sau khi lọc → nhảy sai tin nhắn)
function getChatMessages(chat, max = 8) {
  if (!chat?.messages) return [];
  const out = [];
  chat.messages.forEach((m, i) => {
    if (m.role === 'user') {
      out.push({ id: i, text: (m.preview?.text || (m.preview?.img ? '[Ảnh]' : 'Tin nhắn')).slice(0, 60) });
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

/* Hộp thoại xác nhận — thay cho window.confirm() */
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

export default function AIChat() {
  const { user, tier, logout } = useAuth();
  const uid = user?.uid;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chats, setChats] = useLocalStorage('cs-ai-chats', []);
  const [activeId, setActiveId] = useLocalStorage('cs-ai-active', null);

  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [grade, setGrade] = useState('Lớp 11');
  const [busyId, setBusyId] = useState(null); // id cuộc trò chuyện đang chờ AI
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

  const end = useRef(null);
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
    try { localStorage.setItem('cs-profile-tab', 'upgrade'); } catch { /* bỏ qua */ }
    location.hash = 'profile';
  };
  const askConfirm = (cfg) => setConfirmState(cfg);
  const closeConfirm = useCallback(() => setConfirmState(null), []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    askConfirm({ title: 'Đăng xuất?', body: 'Bạn sẽ quay về trang đăng nhập.', okLabel: 'Đăng xuất', onOk: logout });
  };

  /* ---------- Chỉ hoạt động khi đang ở trang AI (component luôn được giữ mount trong App) ---------- */
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

  /* ---------- Phím tắt / click ngoài ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setUserMenuOpen(false);
      setSidebarOpen(false);
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

  /* ---------- Cuộn: chỉ bám đáy khi người dùng đang ở đáy ---------- */
  const hasMessages = messages.length > 0;
  useEffect(() => {
    const el = end.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => { stickRef.current = e.isIntersecting; }, { rootMargin: '0px 0px 180px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMessages]);

  useEffect(() => {
    stickRef.current = true;
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (!stickRef.current) return;
    end.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [streaming, reasoning]);

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

  /* ---------- Ảnh: chọn / dán / kéo thả ---------- */
  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr('Chỉ chấp nhận file ảnh.'); return; }
    try {
      setImage(await compressImage(f));
      setErr('');
    } catch {
      setErr('Không đọc được ảnh.');
    }
  }, []);

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    handleFile(f);
  };

  useEffect(() => {
    const onPaste = (e) => {
      if (!visibleRef.current) return; // trước đây dán ảnh ở trang khác cũng bị nhận
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) handleFile(file);
    };
    addEventListener('paste', onPaste);
    return () => removeEventListener('paste', onPaste);
  }, [handleFile]);

  /* ---------- Quản lý cuộc trò chuyện ---------- */
  const newChat = () => {
    const id = rid();
    const chat = { id, title: 'Trò chuyện mới', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    setChats((prev) => [chat, ...prev].slice(0, MAX_CHATS));
    setActiveId(id);
    setSidebarOpen(false);
    setExpandedId(null);
    setInput('');
    setImage(null);
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
        messages: [...baseMessages, { role: 'model', parts: [{ text: finalText }], text: finalText, reasoning: finalReasoning, stopped }],
      }));
    } catch (e) {
      if (e?.isQuota) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...baseMessages, { role: 'model', parts: [{ text: e.message }], text: e.message, isQuotaError: true }],
        }));
      } else if (finalText) {
        // lỗi giữa chừng nhưng đã có nội dung → giữ lại phần đã nhận
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...baseMessages, { role: 'model', parts: [{ text: finalText }], text: finalText, reasoning: finalReasoning, stopped: true }],
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
    if ((!text && !image) || loading) return;

    const hasImg = Boolean(image);
    if (denyQuota(hasImg)) return;
    setQuotaError('');
    const nq = consumeQuota(uid, tier, hasImg);
    if (nq) setQuota(nq);

    let chatId = activeId;
    let current = activeChat;
    if (!chatId || !current) {
      const newId = rid();
      current = {
        id: newId,
        title: text ? text.slice(0, 40) : 'Phân tích ảnh',
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
    if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    parts.push({ text: (text || 'Phân tích ảnh này.') + `\n\nTrình độ: ${grade}. KHÔNG dùng LaTeX.` });

    const userMsg = { role: 'user', parts, preview: { text, img: image?.dataUrl } };
    const baseMessages = [...current.messages, userMsg];

    updateChat(chatId, (c) => ({
      ...c,
      messages: baseMessages,
      title: c.messages.length === 0 ? (text ? text.slice(0, 40) : 'Phân tích ảnh') : c.title,
    }));

    setInput('');
    setImage(null);
    stickRef.current = true;
    await run(chatId, baseMessages);
  };
  sendRef.current = send;

  /* Tạo lại câu trả lời cuối (free = thử lại sau lỗi, không trừ lượt) */
  const regenerate = (free = false) => {
    if (loading || !activeChat) return;
    const msgs = activeChat.messages;
    let i = msgs.length - 1;
    while (i >= 0 && msgs[i].role !== 'user') i--;
    if (i < 0) return;
    if (!free) {
      const hasImg = msgs[i].parts?.some((p) => p.inlineData);
      if (denyQuota(hasImg)) return;
      const nq = consumeQuota(uid, tier, hasImg);
      if (nq) setQuota(nq);
    }
    const base = msgs.slice(0, i + 1);
    updateChat(activeChat.id, (c) => ({ ...c, messages: base }));
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
    // đang gõ tiếng Việt bằng bộ gõ (Telex/VNI) → Enter chỉ để chốt chữ, không gửi
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    // điện thoại: Enter xuống dòng, gửi bằng nút
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

  return (
    <div
      className="ds-page"
      onDragOver={(e) => { if (visible) e.preventDefault(); }}
      onDrop={(e) => {
        if (!visible) return;
        const f = e.dataTransfer?.files?.[0];
        if (f) { e.preventDefault(); handleFile(f); }
      }}
    >
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
                          <span className="ds-chat-item-title">{c.title}</span>
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
            <UserAvatar user={user} initial={userInitial} color={tier.color} />
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

      <div className="ds-content">
        <header className="ds-header">
          <div className="ds-header-inner">
            <button className="ds-menu-btn" onClick={() => setSidebarOpen(true)} type="button" aria-label="Mở lịch sử">
              <IcoChat size={18} />
            </button>

            <div className="ds-title-block">
              <AIMark size={48} mode={markMode} look animate={visible} />
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

              {tier.key === 'free' && (
                <button className="ds-quota-upgrade" onClick={goUpgrade} type="button">
                  <IcoCrown size={12} /><span>Nâng cấp</span>
                </button>
              )}
            </div>

            <div className="ds-grade" role="radiogroup" aria-label="Trình độ">
              {CLASSES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={grade === c}
                  className={'ds-grade-btn' + (grade === c ? ' on' : '')} onClick={() => setGrade(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="ds-main">
          {!AI_READY && (
            <div className="ds-warning">
              <b>Chưa cấu hình API</b>
              <p>
                Thêm vào file <code>.env</code> dòng:{' '}
                <code className="ds-code-inline">VITE_OPENROUTER_KEY=sk-or-v1-...</code>{' '}
                rồi restart <code>npm run dev</code>.
              </p>
            </div>
          )}

          {messages.length === 0 && !(showLive && (streaming || reasoning)) ? (
            <div className="ds-empty">
              <AIMark size={220} look mode={markMode} animate={visible} />
              <h1 className="ds-empty-title">Hôm nay bạn muốn hỏi gì về Hóa?</h1>
              <p className="ds-empty-sub">
                Gõ câu hỏi, dán ảnh đề bài hoặc chụp trang sách. Chọn đúng lớp ở góc trên để câu trả lời vừa sức.
              </p>
              <div className="ds-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s.text} className="ds-suggestion" onClick={() => send(s.text)} type="button">
                    <span className="ds-suggestion-tag">{s.tag}</span>
                    <span className="ds-suggestion-text">{s.text}</span>
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
                        {m.preview?.img && <img src={m.preview.img} alt="Ảnh đã gửi" className="ds-msg-img" />}
                        {m.preview?.text && <div className="ds-msg-user-text">{m.preview.text}</div>}
                      </>
                    ) : (
                      <>
                        <AIMark size={56} animate={false} className="ds-avatar" />
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
                  <AIMark size={56} mode="talk" animate={visible} className="ds-avatar" />
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
                  <AIMark size={56} mode="think" animate={visible} className="ds-avatar" />
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

      <div className="ds-input-wrap">
        <div className="ds-input-inner">
          {image && (
            <div className="ds-img-chip">
              <img src={image.dataUrl} alt="Xem trước" />
              <span>Ảnh đã chọn</span>
              <button onClick={() => setImage(null)} type="button" aria-label="Bỏ ảnh"><IcoClose size={14} /></button>
            </div>
          )}

          <div className="ds-input-bar">
            <button className="ds-input-icon ds-icon-gallery" onClick={() => fileRef.current?.click()} title="Chọn ảnh từ thư viện" aria-label="Chọn ảnh" type="button">
              <IcoImage size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />

            <button className="ds-input-icon ds-icon-camera" onClick={() => cameraRef.current?.click()} title="Chụp ảnh" aria-label="Chụp ảnh" type="button">
              <IcoCamera size={18} />
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pickImage} />

            <textarea
              ref={inputRef}
              className="ds-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Hỏi về Hóa học, hoặc dán ảnh đề bài…"
              aria-label="Nhập câu hỏi"
              maxLength={4000}
              rows={1}
            />

            {loading ? (
              <button className="ds-send stop" onClick={stop} type="button" aria-label="Dừng trả lời" title="Dừng">
                <IcoStop size={18} />
              </button>
            ) : (
              <button className="ds-send" onClick={() => send()} disabled={!input.trim() && !image} type="button" aria-label="Gửi">
                {input.trim() || image ? <IcoSend size={18} /> : <IcoAIStar size={18} />}
              </button>
            )}
          </div>

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
    </div>
  );
}