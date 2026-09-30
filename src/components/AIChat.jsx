import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useLocalStorage } from '../hooks.js';
import { askAI, compressImage, AI_READY } from '../lib/ai.js';
import AIMark from './AIMark.jsx';
import { getQuota, canSend, useQuota } from '../lib/quota.js';
import { useAuth } from '../hooks/useAuth.jsx';
import VerifiedBadge from './VerifiedBadge.jsx';
import {
  IcoPlus, IcoChat, IcoTrash, IcoChevron, IcoClose,
  IcoImage, IcoSend, IcoBrain, IcoCopy, IcoCheck,
  IcoUser, IcoCrown, IcoLogout, IcoSettings, IcoSparkle,
} from './Icons2.jsx';

const CLASSES = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

const SUGGESTIONS = [
  { tag: 'Định luật', text: 'Giải thích định luật bảo toàn khối lượng' },
  { tag: 'Bảng tuần hoàn', text: 'Sinh 5 câu hỏi về bảng tuần hoàn' },
  { tag: 'Cân bằng PTHH', text: 'Cách cân bằng phương trình Fe + O2' },
  { tag: 'Dung dịch', text: 'Giải thích công thức tính pH' },
];

const MAX_CHATS = 50;
const rid = () => Math.random().toString(36).slice(2, 10);

function groupChats(chats) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { today: [], yesterday: [], week: [], older: [] };
  for (const c of chats) {
    const d = new Date(c.updatedAt || c.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else if (d >= weekAgo) groups.week.push(c);
    else groups.older.push(c);
  }
  return groups;
}

const GROUP_LABELS = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  week: '7 ngày qua',
  older: 'Cũ hơn',
};

function getChatMessages(chat, max = 8) {
  if (!chat?.messages) return [];
  return chat.messages
    .filter((m) => m.role === 'user')
    .slice(-max)
    .map((m, idx) => ({
      id: idx,
      text: (m.preview?.text || (m.preview?.img ? '[Ảnh]' : 'Tin nhắn')).slice(0, 60),
    }));
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
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [showReasoning, setShowReasoning] = useState(true);
  const [err, setErr] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [quota, setQuota] = useState(() => getQuota(uid, tier));
  const [quotaError, setQuotaError] = useState('');

  const end = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const sendRef = useRef(null);
  const handledPendingRef = useRef(false);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId) || null,
    [chats, activeId]
  );
  const messages = activeChat?.messages || [];

  // Điều hướng
  const goProfile = () => {
    setUserMenuOpen(false);
    location.hash = 'profile';
  };

  const goUpgrade = () => {
    setUserMenuOpen(false);
    location.hash = 'profile';
    setTimeout(() => {
      const btn = document.querySelectorAll('.profile-nav-btn')[3];
      btn?.click();
    }, 220);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    if (confirm('Đăng xuất khỏi tài khoản?')) logout();
  };

  // Đóng menu user khi click ra ngoài
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [userMenuOpen]);

  // Auto scroll
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: streaming || reasoning ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [messages.length, streaming, reasoning]);

  // Auto chọn chat đầu
  useEffect(() => {
    if (!activeId && chats.length > 0) {
      setActiveId(chats[0].id);
    }
  }, [chats.length, activeId, setActiveId]);

  // Lắng nghe quota update
  useEffect(() => {
    const onUpdate = () => setQuota(getQuota(uid, tier));
    addEventListener('cs-quota-update', onUpdate);
    return () => removeEventListener('cs-quota-update', onUpdate);
  }, [uid, tier]);

  // Cập nhật quota khi user / tier đổi
  useEffect(() => {
    if (uid) setQuota(getQuota(uid, tier));
  }, [uid, tier]);

  // Nhận câu hỏi pending từ trang chủ
  useEffect(() => {
    if (handledPendingRef.current) return;
    handledPendingRef.current = true;
    try {
      const raw = localStorage.getItem('cs-ai-pending');
      if (!raw) return;
      const pending = JSON.parse(raw);
      localStorage.removeItem('cs-ai-pending');
      if (Date.now() - pending.t > 5000) return;
      if (pending.grade) setGrade(pending.grade);
      if (pending.text) {
        setTimeout(() => {
          if (sendRef.current) sendRef.current(pending.text);
        }, 300);
      }
    } catch (e) {
      console.error('Pending load error:', e);
    }
  }, []);

  // Ô nhập tự giãn
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  const newChat = () => {
    const id = rid();
    const chat = {
      id,
      title: 'Trò chuyện mới',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [chat, ...prev].slice(0, MAX_CHATS));
    setActiveId(id);
    setSidebarOpen(false);
    setExpandedId(null);
    setInput('');
    setImage(null);
    setErr('');
    setStreaming('');
    setReasoning('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const updateChat = (id, updater) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c))
    );
  };

  const deleteChat = (id, e) => {
    e?.stopPropagation();
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const rest = chats.filter((c) => c.id !== id);
      setActiveId(rest[0]?.id || null);
    }
  };

  const deleteAll = () => {
    if (!confirm('Xóa TẤT CẢ cuộc trò chuyện? Không thể hoàn tác.')) return;
    setChats([]);
    setActiveId(null);
  };

  const openChat = (chatId) => {
    setActiveId(chatId);
    setSidebarOpen(false);
    setStreaming('');
    setReasoning('');
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
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ds-msg-highlight');
        setTimeout(() => el.classList.remove('ds-msg-highlight'), 1500);
      }
    }, 200);
  };

  const pickImage = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErr('Chỉ chấp nhận file ảnh.');
      return;
    }
    try {
      const compressed = await compressImage(f);
      setImage(compressed);
      setErr('');
    } catch {
      setErr('Không đọc được ảnh.');
    }
  };

  useEffect(() => {
    const onPaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const compressed = await compressImage(file);
            setImage(compressed);
            setErr('');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if ((!text && !image) || loading) return;

    const hasImg = Boolean(image);
    if (!canSend(uid, tier, hasImg)) {
      setQuotaError(
        hasImg
          ? `Bạn đã dùng hết ${tier.quotaImage} lượt gửi ảnh hôm nay. Quay lại vào ngày mai nhé!`
          : `Bạn đã dùng hết ${tier.quotaText} lượt chat hôm nay. Nâng cấp lên CUAI VIP để chat không giới hạn!`
      );
      setTimeout(() => setQuotaError(''), 6000);
      return;
    }
    setQuotaError('');

    const newQuota = useQuota(uid, tier, hasImg);
    if (newQuota) setQuota(newQuota);

    let chatId = activeId;
    let currentChat = activeChat;
    if (!chatId || !currentChat) {
      const newId = rid();
      currentChat = {
        id: newId,
        title: text ? text.slice(0, 40) : 'Phân tích ảnh',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChats((prev) => [currentChat, ...prev].slice(0, MAX_CHATS));
      setActiveId(newId);
      chatId = newId;
    }

    setErr('');
    setLoading(true);
    setStreaming('');
    setReasoning('');

    const parts = [];
    if (image) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    }
    const userText = (text || 'Phân tích ảnh này.') + `\n\nTrình độ: ${grade}. KHÔNG dùng LaTeX.`;
    parts.push({ text: userText });

    const userMsg = {
      role: 'user',
      parts,
      preview: { text, img: image?.dataUrl },
    };

    const baseMessages = [...currentChat.messages, userMsg];

    updateChat(chatId, (c) => ({
      ...c,
      messages: baseMessages,
      title:
        c.messages.length === 0 && text
          ? text.slice(0, 40)
          : c.messages.length === 0
          ? 'Phân tích ảnh'
          : c.title,
    }));

    setInput('');
    setImage(null);

    try {
      const recent = baseMessages.slice(-8);
      const trimmed = recent[0]?.role === 'model' ? recent.slice(1) : recent;
      const apiHistory = trimmed.map((m, i) => ({
        role: m.role,
        parts:
          i === trimmed.length - 1
            ? m.parts
            : m.parts.filter((part) => !part.inlineData),
      }));

      let finalText = '';
      let finalReasoning = '';

      const IDLE_MS = 80000;

      let raf = 0;
      let pendText = null;
      let pendReason = null;
      const flush = () => {
        raf = 0;
        if (pendText !== null) {
          setStreaming(pendText);
          pendText = null;
        }
        if (pendReason !== null) {
          setReasoning(pendReason);
          pendReason = null;
        }
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(flush);
      };

      let timer;
      let timedOut = false;
      let arm = () => {};
      const watchdog = new Promise((_, reject) => {
        arm = () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            timedOut = true;
            reject(new Error('AI không phản hồi (quá 80 giây). Kiểm tra mạng hoặc API rồi thử lại.'));
          }, IDLE_MS);
        };
        arm();
      });

      try {
        await Promise.race([
          askAI(
            apiHistory,
            (partial) => {
              if (timedOut) return;
              arm();
              pendText = partial;
              schedule();
              finalText = partial;
            },
            (reasoningPart) => {
              if (timedOut) return;
              arm();
              pendReason = reasoningPart;
              schedule();
              finalReasoning = reasoningPart;
            }
          ),
          watchdog,
        ]);
      } finally {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
      }

      if (!finalText && !finalReasoning) {
        throw new Error('AI trả về rỗng. Thử gửi lại câu hỏi.');
      }

      updateChat(chatId, (c) => ({
        ...c,
        messages: [
          ...baseMessages,
          {
            role: 'model',
            parts: [{ text: finalText }],
            text: finalText,
            reasoning: finalReasoning,
          },
        ],
      }));
      setStreaming('');
      setReasoning('');
    } catch (e) {
      if (e?.isQuota) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: [
            ...baseMessages,
            {
              role: 'model',
              parts: [{ text: e.message }],
              text: e.message,
              isQuotaError: true,
            },
          ],
        }));
      } else {
        setErr(e.message || 'Lỗi gọi AI.');
      }
    } finally {
      setLoading(false);
    }
  };

  sendRef.current = send;

  const copyMsg = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const groups = useMemo(() => groupChats(chats), [chats]);

  const userName = user?.displayName || 'Ẩn danh';
  const userInitial = (userName || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="ds-page">
      <aside className={'ds-sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="ds-sidebar-head">
          <button className="ds-new-btn" onClick={newChat} type="button">
            <IcoPlus size={16} />
            <span>Trò chuyện mới</span>
          </button>
          <button
            className="ds-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Đóng"
          >
            <IcoClose size={18} />
          </button>
        </div>

        <div className="ds-sidebar-body">
          {chats.length === 0 ? (
            <p className="ds-sidebar-empty">Chưa có cuộc trò chuyện nào.</p>
          ) : (
            Object.entries(groups).map(([key, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={key} className="ds-chat-group">
                  <div className="ds-group-label">{GROUP_LABELS[key]}</div>
                  {list.map((c) => {
                    const subMsgs = getChatMessages(c);
                    const isExpanded = expandedId === c.id;
                    const isActive = c.id === activeId;
                    return (
                      <div key={c.id} className="ds-chat-wrapper">
                        <div
                          className={'ds-chat-item' + (isActive ? ' active' : '')}
                          onClick={() => openChat(c.id)}
                        >
                          {subMsgs.length > 0 ? (
                            <button
                              className={'ds-chat-expand' + (isExpanded ? ' open' : '')}
                              onClick={(e) => toggleExpand(c.id, e)}
                              type="button"
                              aria-label="Mở rộng"
                            >
                              <IcoChevron size={10} />
                            </button>
                          ) : (
                            <span className="ds-chat-item-ico">
                              <IcoChat size={14} />
                            </span>
                          )}
                          <span className="ds-chat-item-title">{c.title}</span>
                          <button
                            className="ds-chat-item-del"
                            onClick={(e) => deleteChat(c.id, e)}
                            type="button"
                            aria-label="Xóa"
                          >
                            <IcoTrash size={13} />
                          </button>
                        </div>

                        {isExpanded && subMsgs.length > 0 && (
                          <div className="ds-chat-submenu">
                            {subMsgs.map((sm) => (
                              <button
                                key={sm.id}
                                className="ds-submenu-item"
                                onClick={() => jumpToMessage(c.id, sm.id)}
                                type="button"
                              >
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
            <div className="ds-user-menu">
              <div className="ds-user-menu-head">
                <div
                  className="ds-user-avatar"
                  style={{ background: tier.color, color: '#111' }}
                >
                  {userInitial}
                </div>
      <div className="ds-user-menu-info">
  <b>
    {userName}
    {tier.key === 'vip' && <VerifiedBadge isVip={true} size={13} />}
  </b>
  <small>{user?.email}</small>
</div>
              </div>

              <div className="ds-user-menu-tier">
                <span className="ds-tier-badge" style={{ background: tier.color }}>
                  {tier.key === 'vip' ? <IcoCrown size={12} /> : <IcoSparkle size={12} />}
                  <span>{tier.name}</span>
                </span>
                {tier.key === 'free' && (
                  <button className="ds-tier-upgrade" onClick={goUpgrade} type="button">
                    Nâng cấp
                  </button>
                )}
              </div>

              <div className="ds-user-menu-items">
                <button onClick={goProfile} type="button">
                  <IcoUser size={15} />
                  <span>Trang cá nhân</span>
                </button>
                <button onClick={goUpgrade} type="button">
                  <IcoCrown size={15} />
                  <span>Gói sử dụng</span>
                </button>
                <button onClick={handleLogout} type="button" className="danger">
                  <IcoLogout size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}

          <button
            className={'ds-user-btn' + (userMenuOpen ? ' open' : '')}
            onClick={() => setUserMenuOpen((v) => !v)}
            type="button"
          >
            <div
              className="ds-user-avatar"
              style={{ background: tier.color, color: '#111' }}
            >
              {userInitial}
            </div>
<div className="ds-user-info">
  <b>
    {userName}
    {tier.key === 'vip' && <VerifiedBadge isVip={true} size={12} />}
  </b>
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

      {sidebarOpen && (
        <div className="ds-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="ds-content">
        <header className="ds-header">
          <div className="ds-header-inner">
            <button
              className="ds-menu-btn"
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Mở lịch sử"
            >
              <IcoChat size={18} />
            </button>

            <div className="ds-title-block">
              <AIMark size={48} mode={loading ? 'think' : 'idle'} look />
              <div>
                <h2 className="ds-page-title">Trợ lý Hóa học</h2>
                <span className="ds-status">
                  {loading
                    ? reasoning
                      ? 'đang phân tích…'
                      : streaming
                      ? 'đang trả lời…'
                      : 'đang suy nghĩ…'
                    : 'sẵn sàng'}
                </span>
              </div>
            </div>

            <div className="ds-quota">
              {tier.key === 'vip' ? (
                <span className="ds-quota-item vip" title="Gói CUAI VIP — Chat không giới hạn">
                  <IcoCrown size={13} />
                  <span>VIP</span>
                </span>
              ) : (
                <span
                  className={
                    'ds-quota-item' +
                    (quota.textLeft === 0 ? ' empty' : quota.textLeft <= 3 ? ' low' : '')
                  }
                  title={`Còn ${quota.textLeft}/${quota.quotaText} lượt chat`}
                >
                  <IcoChat size={13} />
                  <span>{quota.textLeft}/{quota.quotaText}</span>
                </span>
              )}

              <span
                className={
                  'ds-quota-item' +
                  (quota.imageLeft === 0 ? ' empty' : quota.imageLeft <= 1 ? ' low' : '')
                }
                title={`Còn ${quota.imageLeft}/${quota.quotaImage} lượt ảnh`}
              >
                <IcoImage size={13} />
                <span>{quota.imageLeft}/{quota.quotaImage}</span>
              </span>

              {tier.key === 'free' && (
                <button className="ds-quota-upgrade" onClick={goUpgrade} type="button">
                  <IcoCrown size={12} />
                  <span>Nâng cấp</span>
                </button>
              )}
            </div>

            <div className="ds-grade">
              {CLASSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={'ds-grade-btn' + (grade === c ? ' on' : '')}
                  onClick={() => setGrade(c)}
                >
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

          {messages.length === 0 && !streaming && !reasoning ? (
            <div className="ds-empty">
              <AIMark size={220} look mode={loading ? 'think' : 'idle'} />
              <h1 className="ds-empty-title">Hôm nay bạn muốn hỏi gì về Hóa?</h1>
              <p className="ds-empty-sub">
                Gõ câu hỏi, dán ảnh đề bài hoặc chụp trang sách. Chọn đúng lớp ở góc trên để câu trả lời vừa sức.
              </p>

              <div className="ds-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="ds-suggestion"
                    onClick={() => send(s.text)}
                    type="button"
                  >
                    <span className="ds-suggestion-tag">{s.tag}</span>
                    <span className="ds-suggestion-text">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ds-chat">
              {messages.map((m, i) => (
                <div
                  key={i}
                  data-msg-idx={i}
                  className={'ds-msg ds-msg-' + m.role}
                >
                  {m.role === 'user' ? (
                    <>
                      {m.preview?.img && (
                        <img src={m.preview.img} alt="Ảnh" className="ds-msg-img" />
                      )}
                      {m.preview?.text && (
                        <div className="ds-msg-user-text">{m.preview.text}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <AIMark size={40} animate={false} className="ds-avatar" />
                      <div className="ds-msg-body">
                        {m.reasoning && (
                          <div className="ds-reasoning-box">
                            <button
                              className="ds-reasoning-toggle"
                              onClick={() => setShowReasoning((v) => !v)}
                              type="button"
                            >
                              <IcoBrain size={13} />
                              <span>Phân tích của AI</span>
                              <span className="ds-reasoning-arrow">
                                {showReasoning ? '▼' : '▶'}
                              </span>
                            </button>
                            {showReasoning && (
                              <div className="ds-reasoning-content">
                                <MarkdownLike text={m.reasoning} />
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={
                            'ds-msg-content' + (m.isQuotaError ? ' quota-error' : '')
                          }
                        >
                          <MarkdownLike text={m.text || ''} />
                        </div>
                        <button
                          className="ds-msg-copy"
                          onClick={() => copyMsg(m.text || '', 'm' + i)}
                          type="button"
                        >
                          {copied === 'm' + i ? (
                            <IcoCheck size={13} />
                          ) : (
                            <IcoCopy size={13} />
                          )}
                          <span>{copied === 'm' + i ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {streaming && (
                <div className="ds-msg ds-msg-model">
                  <AIMark size={40} mode="talk" className="ds-avatar" />
                  <div className="ds-msg-body">
                    {reasoning && (
                      <div className="ds-reasoning-box streaming">
                        <div className="ds-reasoning-toggle">
                          <IcoBrain size={13} />
                          <span>Đang phân tích…</span>
                          <span className="ds-typing">
                            <i />
                            <i />
                            <i />
                          </span>
                        </div>
                        <div className="ds-reasoning-content">
                          <MarkdownLike text={reasoning} />
                        </div>
                      </div>
                    )}

                    <div className="ds-msg-content">
                      <MarkdownLike text={streaming} />
                    </div>
                  </div>
                </div>
              )}

              {loading && !streaming && (
                <div className="ds-msg ds-msg-model">
                  <AIMark size={40} mode="think" className="ds-avatar" />
                  <div className="ds-msg-body">
                    {reasoning ? (
                      <div className="ds-reasoning-box streaming">
                        <div className="ds-reasoning-toggle">
                          <IcoBrain size={13} />
                          <span>Đang phân tích…</span>
                          <span className="ds-typing">
                            <i />
                            <i />
                            <i />
                          </span>
                        </div>
                        <div className="ds-reasoning-content">
                          <MarkdownLike text={reasoning} />
                        </div>
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
              <button onClick={() => setImage(null)} type="button" aria-label="Bỏ ảnh">
                <IcoClose size={14} />
              </button>
            </div>
          )}

          <div className="ds-input-bar">
            <button
              className="ds-input-icon"
              onClick={() => fileRef.current?.click()}
              title="Đính kèm ảnh"
              type="button"
            >
              <IcoImage size={18} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={pickImage}
            />

            <textarea
              ref={inputRef}
              className="ds-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Hỏi về Hóa học, hoặc dán ảnh đề bài…"
              rows={1}
            />

            <button
              className="ds-send"
              onClick={() => send()}
              disabled={loading || (!input.trim() && !image)}
              type="button"
              aria-label="Gửi"
            >
              {loading ? (
                <span className="ds-send-loading">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <IcoSend size={18} />
              )}
            </button>
          </div>

          {quotaError && <p className="ds-quota-error">{quotaError}</p>}
          {err && <p className="ds-error">{err}</p>}
          <p className="ds-disclaimer">
            AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
          </p>
        </div>
      </div>
    </div>
  );
}

function MarkdownLikeBase({ text }) {
  if (!text) return null;

  text = text
    .replace(/User Safety:\s*\w+/gi, '')
    .replace(/Response Safety:\s*\w+/gi, '')
    .replace(/System Safety:\s*\w+/gi, '')
    .trim();

  if (!text) return null;

  const lines = text.split('\n');
  const blocks = [];
  let listBuf = [];
  let codeBuf = [];
  let inCode = false;
  let codeLang = '';

  const flushList = () => {
    if (listBuf.length) {
      blocks.push(
        <ul key={blocks.length} className="ds-list">
          {listBuf.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      listBuf = [];
    }
  };
  const flushCode = () => {
    if (codeBuf.length) {
      blocks.push(
        <CodeBlock key={blocks.length} lang={codeLang} code={codeBuf.join('\n')} />
      );
      codeBuf = [];
    }
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushList();
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      listBuf.push(line.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, ''));
      continue;
    }
    flushList();
    if (line.trim() === '') {
      blocks.push(<div key={blocks.length} style={{ height: '.5rem' }} />);
    } else if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#+\s/, '');
      const Tag = 'h' + Math.min(4, level + 2);
      blocks.push(
        <Tag
          key={blocks.length}
          dangerouslySetInnerHTML={{ __html: inlineFormat(content) }}
        />
      );
    } else {
      blocks.push(
        <p
          key={blocks.length}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />
      );
    }
  }
  flushList();
  flushCode();
  return <>{blocks}</>;
}

const MarkdownLike = memo(MarkdownLikeBase);

function inlineFormat(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="ds-inline-code">$1</code>');
}

function CodeBlock({ lang, code }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setOk(true);
    setTimeout(() => setOk(false), 1500);
  };
  return (
    <div className="ds-codeblock">
      <div className="ds-code-head">
        <span>{lang || 'code'}</span>
        <button className="ds-code-copy" onClick={copy} type="button">
          {ok ? 'Đã chép' : 'Sao chép'}
        </button>
      </div>
      <pre className="ds-code">
        <code>{code}</code>
      </pre>
    </div>
  );
}