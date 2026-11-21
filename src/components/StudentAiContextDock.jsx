/* ============================================================
   StudentAiContextDock.jsx — Ngăn Kéo Gia Sư AI Chủ Động v2 (Overlay)
   - Bám theo mọi trang học sinh mà KHÔNG bóp méo bảng/podium
   - Proactive Insight Banner: tự đọc câu sai tồn đọng, đề thi gần nhất,
     NV1 mục tiêu & chuỗi học để gợi ý hành động cụ thể 1 chạm
   - 4 Chế độ Gia sư (Persona): Giải nhanh | Gợi ý từng bước | Ra 3 câu thử | Soi bẫy đề
   - Thanh công cụ trên mỗi câu trả lời AI: Chép Markdown, Đọc to (TTS tiếng Việt), Xóa phiên
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { askAI as callAiEngine } from '../lib/ai.js';
import { runWithCredit, CREDIT_TARIFF } from '../lib/creditService.js';
import { askAI as openFullAiPage } from './HomePlus.jsx';
import { MarkdownLike } from './ChatMarkdown.jsx';
import { getVirtualExamHistory } from '../data/virtualExamsBank.js';
import { getStudentElo, getStudentCombatPower, loadTargetUniversity } from '../lib/studentAnalytics.js';
import '../styles/student-v9-upgrades.css';

const AI_PERSONAS = [
  {
    id: 'fast',
    label: 'Giải nhanh',
    instruction: 'Trả lời cực ngắn gọn, đi thẳng vào đáp án, công thức lõi và kết luận rõ ràng.',
  },
  {
    id: 'socratic',
    label: 'Gợi ý từng bước',
    instruction: 'Đóng vai gia sư Socratic: chia 3 bước tư duy rõ ràng, nêu gợi ý mấu chốt để học sinh hiểu bản chất thay vì chỉ chép đáp án.',
  },
  {
    id: 'quiz',
    label: 'Ra 3 câu thử',
    instruction: 'Ra ngay 3 câu trắc nghiệm chuẩn GDPT 2025 (tăng dần từ Nhận biết đến Vận dụng) kèm đáp án ẩn ở cuối để học sinh tự kiểm tra.',
  },
  {
    id: 'trap',
    label: 'Soi bẫy đề',
    instruction: 'Chỉ ra các bẫy đề thi phổ biến nhất (từ khóa phủ định, đơn vị SI, điều kiện phản ứng, trường hợp ngoại lệ) và mẹo tránh sai.',
  },
];

const PAGE_CONTEXTS = {
  home: {
    name: 'Trang chủ học tập',
    chips: [
      { label: 'Lập kế hoạch học 30p tối nay', prompt: 'Hãy lập lịch tự học 30 phút tối nay thật hiệu quả (chia 3 chặng 10 phút) để tăng điểm THPTQG.' },
      { label: 'Mẹo giữ nhịp ôn thi không nản', prompt: 'Cho mình 3 mẹo giữ tập trung và duy trì chuỗi học mỗi ngày cho học sinh THPT.' },
      { label: 'Tóm tắt công thức KHTN hay thi', prompt: 'Tóm tắt ngắn gọn 5 công thức Vật lí / Hóa học hay ra nhất trong đề THPTQG 2025.' },
    ],
  },
  'virtual-exams': {
    name: 'Phòng thi ảo',
    chips: [
      { label: 'Chiến thuật phân bổ 50 phút thi', prompt: 'Chỉ mình chiến thuật phân bổ thời gian tối ưu cho đề 3 phần chuẩn GDPT 2025 (18 TN + 4 Đ/S + 6 TLN) trong 50 phút.' },
      { label: 'Cách tránh mất điểm Phần II Đúng/Sai', prompt: 'Chia sẻ mẹo làm bài Phần II (Trắc nghiệm Đúng/Sai) chuẩn GDPT 2025 để tránh bị mất điểm oan từ 1.0 xuống 0.25.' },
      { label: 'Cấu trúc đề HSA / TSA khác gì?', prompt: 'So sánh nhanh cấu trúc đề THPTQG, ĐGNL HSA và ĐGTD TSA để mình chọn hướng ôn phù hợp.' },
    ],
  },
  notebook: {
    name: 'Sổ lỗi sai',
    chips: [
      { label: 'Cách dứt điểm lỗi đọc thiếu đề', prompt: 'Mình rất hay mắc lỗi đọc thiếu đề và nhầm từ khóa phủ định (không đúng / sai). Chỉ mình quy trình đọc đề 3 bước để hết sai vặt.' },
      { label: 'Phương pháp ôn Sổ lỗi sai hiệu quả', prompt: 'Hướng dẫn mình cách ôn lại Sổ lỗi sai theo lặp lại ngắt quãng (SRS) để không lặp lại lỗi cũ.' },
      { label: 'Mẹo bấm máy Casio tránh nhầm đơn vị', prompt: 'Liệt kê 5 lỗi đổi đơn vị SI và bấm máy tính học sinh hay sai nhất trong Lý - Hóa.' },
    ],
  },
  admission: {
    name: 'Tra cứu điểm chuẩn ĐH',
    chips: [
      { label: 'Chiến thuật xếp nguyện vọng an toàn', prompt: 'Hướng dẫn mình nguyên tắc vàng chia 3 nhóm nguyện vọng (Ước mơ – Vừa sức – An toàn) khi đăng ký xét tuyển Đại học.' },
      { label: 'Thi thêm ĐGNL HSA/TSA có lợi không?', prompt: 'Phân tích lợi thế khi thi thêm ĐGNL (HSA/V-ACT) hoặc ĐGTD (TSA) song song với điểm thi THPTQG.' },
      { label: 'Cách tăng +2 điểm trong 2 tháng cuối', prompt: 'Mình đang cách điểm chuẩn mục tiêu khoảng 2 điểm, hãy đề xuất lộ trình kéo điểm thực chiến nhất.' },
    ],
  },
  roadmap: {
    name: 'Lộ trình ôn thi',
    chips: [
      { label: 'Thứ tự học các chương lấy gốc nhanh', prompt: 'Sắp xếp thứ tự các chương trọng tâm dễ ăn điểm nhất để lấy gốc chắc 7+ trước khi luyện vận dụng cao.' },
      { label: 'Cách kết hợp Flashcard + Luyện đề', prompt: 'Nên kết hợp ôn Flashcard SRS và làm đề bấm giờ theo tỷ lệ nào mỗi tuần là tối ưu?' },
      { label: 'Cho mình 3 câu kiểm tra nhanh', prompt: 'Hãy ra cho mình 3 câu trắc nghiệm nhanh ôn kiến thức nền tảng (kèm đáp án cuối bài để mình tự giải trước).' },
    ],
  },
  pomodoro: {
    name: 'Tập trung Pomodoro',
    chips: [
      { label: 'Nên chọn 25/5 hay 50/10?', prompt: 'Khi nào mình nên học theo chu kỳ Pomodoro 25/5 và khi nào nên chuyển sang Deep Work 50/10?' },
      { label: 'Cách nghỉ 5 phút không bị cuốn điện thoại', prompt: 'Gợi ý 4 hoạt động nghỉ ngắn 5 phút giữa các phiên Pomodoro giúp não hồi sức nhanh mà không bị cuốn vào mạng xã hội.' },
      { label: '40Hz Binaural có tác dụng gì?', prompt: 'Giải thích ngắn gọn âm thanh sóng 40Hz Binaural Beats hỗ trợ sự tập trung khi học như thế nào.' },
    ],
  },
  leaderboard: {
    name: 'Bảng xếp hạng & Quân đoàn',
    chips: [
      { label: 'Cách tăng điểm ELO & Lực chiến nhanh', prompt: 'Làm thế nào để tăng điểm ELO và Lực chiến bền vững khi ôn thi trên nền tảng?' },
      { label: 'Mẹo học nhóm cùng Quân đoàn hiệu quả', prompt: 'Gợi ý cách thi đua lành mạnh với bạn bè cùng mục tiêu trường Đại học để tạo động lực học mỗi ngày.' },
      { label: 'Cho mình lời khích lệ giữ streak', prompt: 'Viết cho mình một lời động viên ngắn gọn, truyền lửa để giữ vững chuỗi học hôm nay!' },
    ],
  },
  stats: {
    name: 'Thống kê học tập',
    chips: [
      { label: 'Đọc biểu đồ năng lực thế nào?', prompt: 'Cách đọc xu hướng điểm số và tốc độ làm bài (giây/câu) để phát hiện mình đang thiếu kiến thức hay thiếu tốc độ?' },
      { label: 'Mục tiêu tốc độ chuẩn mỗi câu', prompt: 'Nhịp độ trung bình bao nhiêu giây/câu cho Phần I, II, III là hợp lý để kịp kiểm tra lại bài?' },
      { label: 'Kế hoạch cải thiện điểm tuần tới', prompt: 'Gợi ý khung kế hoạch cải thiện 10% độ chính xác trong tuần học tới.' },
    ],
  },
};

export default function StudentAiContextDock({ page = 'home' }) {
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [persona, setPersona] = useState('fast');
  const [msgs, setMsgs] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const endRef = useRef(null);
  const reqRef = useRef(null);

  const ctxMeta = PAGE_CONTEXTS[page] || PAGE_CONTEXTS.home;
  const activePersona = AI_PERSONAS.find((p) => p.id === persona) || AI_PERSONAS[0];

  const studentSnapshot = useMemo(() => {
    const elo = getStudentElo(uid)?.elo || 1200;
    const power = getStudentCombatPower(uid)?.power || 1000;
    const nv1 = loadTargetUniversity(uid);
    const vHist = getVirtualExamHistory(uid) || [];
    const latestExam = vHist[0] || null;
    let wrongCount = 0;
    try {
      const w = JSON.parse(localStorage.getItem('elec-wrong-questions') || '[]');
      if (Array.isArray(w)) wrongCount = w.length;
    } catch { /* ignore */ }

    let proactive = null;
    if (wrongCount >= 3) {
      proactive = {
        badge: `Sổ lỗi sai (${wrongCount} câu)`,
        text: `Bạn đang có ${wrongCount} câu sai tồn đọng (+${wrongCount * 15} Lực chiến đang chờ). Hãy nhờ AI lên kế hoạch dọn sạch trong 10 phút!`,
        prompt: `Mình đang có ${wrongCount} câu sai tồn đọng trong Sổ lỗi sai. Hãy chỉ cho mình chiến thuật ôn dứt điểm trong 10 phút và cách tránh lặp lại lỗi cũ.`,
      };
    } else if (latestExam) {
      const pct = Number.isFinite(latestExam.pct)
        ? latestExam.pct
        : (latestExam.totalPoints > 0 ? Math.round((latestExam.score / latestExam.totalPoints) * 100) : null);
      proactive = {
        badge: 'Đề vừa thi gần nhất',
        text: `Gần đây bạn đạt ${pct != null ? `${pct}%` : `${latestExam.score}đ`} ở "${latestExam.title || 'Đề phòng thi ảo'}". Muốn AI phân tích bước nâng +1.5 điểm tiếp theo?`,
        prompt: `Ở đề gần nhất "${latestExam.title || 'Đề thi thử'}" mình đạt ${pct != null ? `${pct}%` : `${latestExam.score} điểm`}. ELO hiện tại ${elo}. Hãy đề xuất 3 việc cụ thể để bài sau tăng thêm ít nhất 10-15%.`,
      };
    } else if (nv1) {
      proactive = {
        badge: `NV1: ${nv1.code}`,
        text: `Mục tiêu ${nv1.major} — ${nv1.uni} (chuẩn ${nv1.s2025 ?? nv1.s2024 ?? '--'}). Nhờ AI thiết kế chiến lược bám sát điểm chuẩn ngay!`,
        prompt: `Mục tiêu NV1 của mình là ngành ${nv1.major} trường ${nv1.uni} (điểm chuẩn tham khảo ${nv1.s2025 ?? nv1.s2024 ?? ''}). Hãy lập chiến lược phân bổ điểm 3 môn và lịch luyện đề mỗi tuần.`,
      };
    }

    return { elo, power, nv1, wrongCount, proactive };
  }, [uid, open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, busy, open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }, []);

  const stopReq = () => {
    try { reqRef.current?.abort?.(); } catch { /* ignore */ }
    reqRef.current = null;
    setBusy(false);
  };

  const handleCopy = (id, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* ignore */ }
  };

  const handleSpeak = (id, text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const plain = String(text || '').replace(/[*#`>_~]/g, ' ').slice(0, 900);
      const u = new SpeechSynthesisUtterance(plain);
      u.lang = 'vi-VN';
      u.rate = 1.05;
      u.onend = () => setSpeakingId(null);
      u.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  const sendPrompt = async (textOverride) => {
    const q = String(textOverride ?? input).trim();
    if (!q || busy) return;
    setInput('');
    const userMsg = { id: `u_${Date.now()}`, role: 'user', text: q };
    const botId = `b_${Date.now() + 1}`;
    setMsgs((prev) => [...prev, userMsg, { id: botId, role: 'bot', text: '', streaming: true }]);
    setBusy(true);

    const sysPrompt = `Bạn là Bé Elec — Gia sư AI thân thiện (xưng "mình – bạn") của nền tảng ELEC AI cho học sinh THPT Việt Nam (GDPT 2025).
Chế độ hiện tại: ${activePersona.label} — ${activePersona.instruction}
Ngữ cảnh hiện tại của học sinh:
- Đang ở màn hình: ${ctxMeta.name}
- Điểm ELO: ${studentSnapshot.elo} | Lực chiến: ${studentSnapshot.power} | Câu sai tồn đọng: ${studentSnapshot.wrongCount}
${studentSnapshot.nv1 ? `- Nguyện vọng 1 đang ghim: ${studentSnapshot.nv1.major} — ${studentSnapshot.nv1.uni} (chuẩn ${studentSnapshot.nv1.s2025 ?? ''}đ)` : ''}
Hãy trả lời sắc nét, dễ đọc, có gạch đầu dòng rõ ràng, KHÔNG dùng emoji.`;

    const recentHistory = [...msgs.slice(-6), userMsg].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    try {
      const res = await runWithCredit(
        { userId: user?.uid, cost: CREDIT_TARIFF.TUTOR_CONTEXT, actionType: 'ai_tutor', reason: 'Gia sư AI ngữ cảnh học sinh' },
        () => {
          const req = callAiEngine(
            recentHistory,
            (partial) => {
              if (!partial) return;
              setMsgs((prev) => prev.map((m) => (m.id === botId ? { ...m, text: partial } : m)));
            },
            null,
            { systemPrompt: sysPrompt }
          );
          reqRef.current = req;
          return req.finally(() => {
            if (reqRef.current === req) reqRef.current = null;
          });
        }
      );
      const finalText = typeof res === 'string' ? res : (res?.text || '');
      setMsgs((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, text: finalText || 'Mình sẵn sàng hỗ trợ tiếp cho bạn nhé!', streaming: false } : m
        )
      );
    } catch (err) {
      if (err?.isAbort || err?.name === 'AbortError') {
        setMsgs((prev) => prev.map((m) => (m.id === botId ? { ...m, streaming: false } : m)));
      } else {
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === botId
              ? { ...m, text: err?.message || 'Kết nối AI tạm gián đoạn, bạn thử gửi lại nhé!', streaming: false }
              : m
          )
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`s9-dock-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={`Gia sư ELEC AI (${ctxMeta.name})`}
        aria-label="Mở Gia sư AI ngữ cảnh"
      >
        <img src="/img/elec/elec-hello.png" alt="Bé Elec AI" />
        <span>Hỏi AI</span>
        {studentSnapshot.wrongCount >= 3 && !open && (
          <i className="s9-dock-fab-dot" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="s9-dock-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <aside className="s9-dock-panel" role="dialog" aria-label="Gia sư AI ngữ cảnh">
            <header className="s9-dock-head">
              <div className="s9-dock-head-l">
                <img src="/img/elec/elec-hello.png" alt="Bé Elec" />
                <div>
                  <strong>Gia sư ELEC AI</strong>
                  <span className="s9-dock-ctx-pill">Đang xem: {ctxMeta.name}</span>
                </div>
              </div>
              <div className="s9-dock-head-r">
                {msgs.length > 0 && (
                  <button
                    type="button"
                    className="s9-dock-icon-btn"
                    onClick={() => { stopReq(); setMsgs([]); }}
                    title="Làm mới hội thoại"
                    aria-label="Làm mới hội thoại"
                  >
                    ↺
                  </button>
                )}
                <button
                  type="button"
                  className="s9-dock-icon-btn"
                  onClick={() => {
                    setOpen(false);
                    openFullAiPage(input.trim() || `Hỗ trợ mình khi đang ở mục ${ctxMeta.name}`);
                  }}
                  title="Mở Gia sư AI toàn màn hình"
                >
                  ⤢
                </button>
                <button
                  type="button"
                  className="s9-dock-icon-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng ngăn kéo AI"
                >
                  ✕
                </button>
              </div>
            </header>

            {/* 4 Chế độ Gia sư (Persona Toggle) */}
            <div className="s9-dock-personas" role="radiogroup" aria-label="Chế độ Gia sư AI">
              {AI_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={persona === p.id}
                  className={`s9-dock-persona ${persona === p.id ? 'active' : ''}`}
                  onClick={() => setPersona(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="s9-dock-body">
              {msgs.length === 0 ? (
                <div className="s9-dock-welcome">
                  {studentSnapshot.proactive && (
                    <div className="s9-dock-proactive">
                      <span className="s9-dock-pro-badge">{studentSnapshot.proactive.badge}</span>
                      <p>{studentSnapshot.proactive.text}</p>
                      <button
                        type="button"
                        className="s9-dock-pro-btn"
                        onClick={() => sendPrompt(studentSnapshot.proactive.prompt)}
                      >
                        Nhờ AI xử lý ngay →
                      </button>
                    </div>
                  )}
                  <p>
                    Chào bạn! Mình thấy bạn đang ở <b>{ctxMeta.name}</b>. Chọn nhanh một gợi ý dưới đây hoặc gõ câu hỏi bất kỳ nhé:
                  </p>
                  <div className="s9-dock-chips">
                    {ctxMeta.chips.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        className="s9-dock-chip"
                        onClick={() => sendPrompt(c.prompt)}
                      >
                        {c.label} →
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="s9-dock-msgs">
                  {msgs.map((m) => (
                    <div key={m.id} className={`s9-dock-msg ${m.role}`}>
                      {m.role === 'bot' ? (
                        <>
                          <MarkdownLike text={m.text || (m.streaming ? 'Đang suy nghĩ...' : '')} />
                          {!m.streaming && m.text && (
                            <div className="s9-dock-msg-tools">
                              <button type="button" onClick={() => handleCopy(m.id, m.text)}>
                                {copiedId === m.id ? 'Đã chép' : 'Chép'}
                              </button>
                              <button type="button" onClick={() => handleSpeak(m.id, m.text)}>
                                {speakingId === m.id ? 'Dừng đọc' : 'Đọc to'}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p>{m.text}</p>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {msgs.length > 0 && (
              <div className="s9-dock-quickbar">
                {ctxMeta.chips.slice(0, 2).map((c) => (
                  <button key={c.label} type="button" className="s9-dock-qbtn" onClick={() => sendPrompt(c.prompt)}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <form
              className="s9-dock-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (busy) stopReq();
                else sendPrompt();
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`[${activePersona.label}] Hỏi nhanh về ${ctxMeta.name.toLowerCase()}...`}
              />
              <button type="submit" className={busy ? 'is-stop' : ''} disabled={!busy && !input.trim()}>
                {busy ? 'Dừng' : 'Gửi'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
