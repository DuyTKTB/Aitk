/* ============================================================
   StudentAdvancedToolsModal.jsx — 6 Siêu Công Cụ STEM & Học Thuật Pro
   Chọn lọc từ các kho mã nguồn mở GitHub nổi bật:
     1. Image Occlusion (Anki Visual Che nhãn sơ đồ)
     2. Ghi chú Cornell chuẩn Đại học + In A4 (cornell-notes-generator)
     3. Đọc siêu tốc RSVP + ORP (rsvp-speed-reader)
     4. Nghe-Chép & Shadowing Tiếng Anh (EchoTalk + Web Speech API)
     5. Chuyển đổi Đơn vị Khoa học SI (Unit-Converter-in-React)
     6. Giải mã Gen ADN → mARN → Axit Amin & Đột biến Điểm (seqviz/Codon)
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  UNIT_CATEGORIES,
  convertScientificUnit,
  formatSciNumber,
  decodeDnaTemplate,
  classifyPointMutation,
  splitWordOrp,
  getRsvpWordDelayMs,
  ENGLISH_SHADOWING_SAMPLES,
  gradeDictationText,
} from '../lib/studentStemStudio.js';
import '../styles/teacher-pro-studio.css';

const SAMPLE_DIAGRAM_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="640" height="320">
    <rect width="640" height="320" fill="#f8fafc"/>
    <ellipse cx="320" cy="165" rx="220" ry="125" fill="#dbeafe" stroke="#2563eb" stroke-width="4"/>
    <circle cx="310" cy="155" r="56" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="3"/>
    <circle cx="310" cy="155" r="18" fill="#1e40af"/>
    <ellipse cx="445" cy="145" rx="46" ry="22" fill="#fecaca" stroke="#dc2626" stroke-width="3"/>
    <ellipse cx="205" cy="210" rx="44" ry="20" fill="#bbf7d0" stroke="#059669" stroke-width="3"/>
    <text x="310" y="34" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="800" fill="#0f172a">SƠ ĐỒ CẤU TẠO TẾ BÀO NHÂN THỰC (MẪU ÔN TẬP)</text>
    <text x="112" y="92" font-family="sans-serif" font-size="14" font-weight="700" fill="#1d4ed8">Màng sinh chất</text>
    <line x1="215" y1="88" x2="250" y2="68" stroke="#1d4ed8" stroke-width="2"/>
    <text x="310" y="232" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#1e40af">Nhân tế bào (ADN)</text>
    <text x="498" y="92" font-family="sans-serif" font-size="14" font-weight="700" fill="#dc2626">Ti thể (ATP)</text>
    <line x1="494" y1="95" x2="462" y2="128" stroke="#dc2626" stroke-width="2"/>
    <text x="66" y="266" font-family="sans-serif" font-size="14" font-weight="700" fill="#059669">Lục lạp (Quang hợp)</text>
    <line x1="168" y1="248" x2="190" y2="228" stroke="#059669" stroke-width="2"/>
  </svg>`);

const CORNELL_KEY = 'cs-cornell-notes-v1';

export default function StudentAdvancedToolsModal({ initialTab = 'occlusion', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2500);
  };

  /* --- 1. IMAGE OCCLUSION --- */
  const [occImg, setOccImg] = useState(SAMPLE_DIAGRAM_SVG);
  const [occBoxes, setOccBoxes] = useState([
    { id: 'b1', x: 14, y: 22, w: 22, h: 11 },
    { id: 'b2', x: 37, y: 66, w: 26, h: 11 },
    { id: 'b3', x: 75, y: 22, w: 20, h: 11 },
    { id: 'b4', x: 8, y: 76, w: 26, h: 11 },
  ]);
  const [occQuizMode, setOccQuizMode] = useState(true);
  const [occRevealed, setOccRevealed] = useState(() => new Set());
  const [drawingBox, setDrawingBox] = useState(null);
  const occStageRef = useRef(null);

  const onOccPointerDown = (e) => {
    if (occQuizMode || !occStageRef.current) return;
    const rect = occStageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDrawingBox({ x0: x, y0: y, x, y, w: 0, h: 0 });
  };

  const onOccPointerMove = (e) => {
    if (!drawingBox || !occStageRef.current) return;
    const rect = occStageRef.current.getBoundingClientRect();
    const cx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const cy = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setDrawingBox((b) => ({
      ...b,
      x: Math.min(b.x0, cx),
      y: Math.min(b.y0, cy),
      w: Math.abs(cx - b.x0),
      h: Math.abs(cy - b.y0),
    }));
  };

  const onOccPointerUp = () => {
    if (!drawingBox) return;
    if (drawingBox.w >= 3 && drawingBox.h >= 3) {
      setOccBoxes((arr) => [...arr, { id: `b_${Date.now()}`, x: drawingBox.x, y: drawingBox.y, w: drawingBox.w, h: drawingBox.h }]);
    }
    setDrawingBox(null);
  };

  /* --- 2. CORNELL NOTES --- */
  const [cornell, setCornell] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CORNELL_KEY) || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch { /* ignore */ }
    return {
      title: 'Dao động điều hòa — Vật lí 11',
      cues: '1. Phương trình li độ?\n2. Công thức vận tốc & gia tốc?\n3. Hệ thức độc lập thời gian?',
      notes: '- Li độ: x = A·cos(ωt + φ)\n- Vận tốc: v = -ωA·sin(ωt + φ), v_max = ωA tại VTCB\n- Gia tốc: a = -ω²x (luôn hướng về VTCB)\n- Độc lập thời gian: A² = x² + (v/ω)²',
      summary: 'Mọi đại lượng x, v, a đều biến thiên điều hòa cùng tần số góc ω; v sớm pha π/2 so với x, a ngược pha x.',
    };
  });

  useEffect(() => {
    try { localStorage.setItem(CORNELL_KEY, JSON.stringify(cornell)); } catch { /* ignore */ }
  }, [cornell]);

  const handlePrintCornell = () => {
    const win = window.open('', '_blank', 'width=860,height=760');
    if (!win) return;
    const esc = (s) => String(s || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
    win.document.write(`<!doctype html><html><head><title>Cornell Notes - ${cornell.title}</title></head><body style="font-family:system-ui,sans-serif;padding:28px;color:#0f172a;">
      <div style="border:2px solid #2563eb;border-radius:12px;overflow:hidden;">
        <div style="background:#eff6ff;padding:14px 18px;border-bottom:2px solid #2563eb;display:flex;justify-content:space-between;">
          <strong style="font-size:17px;">${esc(cornell.title)}</strong>
          <span style="font-size:12px;color:#475569;">Cornell Notes · ${new Date().toLocaleDateString('vi-VN')}</span>
        </div>
        <div style="display:grid;grid-template-columns:30% 70%;min-height:460px;">
          <div style="padding:16px;border-right:2px solid #93c5fd;background:#f8fafc;">
            <div style="font-size:11px;font-weight:800;color:#2563eb;margin-bottom:8px;">TỪ KHÓA / CÂU HỎI GỢI NHỚ</div>
            <div style="font-size:13.5px;line-height:1.7;">${esc(cornell.cues)}</div>
          </div>
          <div style="padding:16px;">
            <div style="font-size:11px;font-weight:800;color:#2563eb;margin-bottom:8px;">NỘI DUNG BÀI HỌC CHI TIẾT</div>
            <div style="font-size:14px;line-height:1.75;">${esc(cornell.notes)}</div>
          </div>
        </div>
        <div style="padding:14px 18px;border-top:2px solid #2563eb;background:#f0fdf4;">
          <div style="font-size:11px;font-weight:800;color:#059669;margin-bottom:4px;">TÓM TẮT CỐT LÕI</div>
          <div style="font-size:13.5px;line-height:1.6;">${esc(cornell.summary)}</div>
        </div>
      </div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  /* --- 3. RSVP SPEED READER --- */
  const [rsvpText, setRsvpText] = useState(
    'Kỹ thuật đọc nhanh RSVP giúp loại bỏ chuyển động đảo mắt lãng phí bằng cách đưa từng từ vào đúng điểm nhận diện tối ưu ORP. Nhờ đó học sinh có thể đọc hiểu đề thi Ngữ văn và Tiếng Anh nhanh hơn gấp đôi mà vẫn giữ độ tập trung cao.'
  );
  const [rsvpWpm, setRsvpWpm] = useState(280);
  const [rsvpRunning, setRsvpRunning] = useState(false);
  const [rsvpIdx, setRsvpIdx] = useState(0);

  const rsvpWords = useMemo(() => String(rsvpText || '').trim().split(/\s+/).filter(Boolean), [rsvpText]);
  const currentOrp = useMemo(() => splitWordOrp(rsvpWords[rsvpIdx] || ''), [rsvpWords, rsvpIdx]);

  useEffect(() => {
    if (!rsvpRunning || !rsvpWords.length) return undefined;
    if (rsvpIdx >= rsvpWords.length - 1) {
      setRsvpRunning(false);
      return undefined;
    }
    const delay = getRsvpWordDelayMs(rsvpWords[rsvpIdx], rsvpWpm);
    const id = setTimeout(() => setRsvpIdx((i) => i + 1), delay);
    return () => clearTimeout(id);
  }, [rsvpRunning, rsvpIdx, rsvpWords, rsvpWpm]);

  /* --- 4. ENGLISH DICTATION & SHADOWING --- */
  const [engSampleId, setEngSampleId] = useState(ENGLISH_SHADOWING_SAMPLES[0].id);
  const [engRate, setEngRate] = useState(0.95);
  const [engInput, setEngInput] = useState('');
  const [engReveal, setEngReveal] = useState(false);
  const [engResult, setEngResult] = useState(null);
  const [listeningMic, setListeningMic] = useState(false);

  const activeEng = useMemo(
    () => ENGLISH_SHADOWING_SAMPLES.find((s) => s.id === engSampleId) || ENGLISH_SHADOWING_SAMPLES[0],
    [engSampleId]
  );

  const speakEnglish = () => {
    try {
      if (!window.speechSynthesis) {
        showToast('Trình duyệt không hỗ trợ Web Speech TTS.');
        return;
      }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(activeEng.text);
      utt.lang = 'en-US';
      utt.rate = engRate;
      window.speechSynthesis.speak(utt);
    } catch { /* ignore */ }
  };

  const startVoiceShadowing = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Trình duyệt chưa hỗ trợ nhận diện giọng nói (hãy dùng Chrome/Edge).');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setListeningMic(true);
    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || '';
      setEngInput(transcript);
      setEngResult(gradeDictationText(activeEng.text, transcript));
      setListeningMic(false);
    };
    rec.onerror = () => setListeningMic(false);
    rec.onend = () => setListeningMic(false);
    rec.start();
  };

  /* --- 5. SI UNIT CONVERTER --- */
  const [unitCatId, setUnitCatId] = useState('energy');
  const [unitVal, setUnitVal] = useState('1');
  const [unitFrom, setUnitFrom] = useState('eV');

  const activeUnitCat = useMemo(
    () => UNIT_CATEGORIES.find((c) => c.id === unitCatId) || UNIT_CATEGORIES[0],
    [unitCatId]
  );

  /* --- 6. DNA → mRNA → CODON & POINT MUTATION --- */
  const [dnaOrig, setDnaOrig] = useState('TACGGATTCACGATT');
  const [dnaMut, setDnaMut] = useState('TACGGATTCACGATT');

  const origDecoded = useMemo(() => decodeDnaTemplate(dnaOrig), [dnaOrig]);
  const mutDecoded = useMemo(() => decodeDnaTemplate(dnaMut), [dnaMut]);
  const mutationInfo = useMemo(() => classifyPointMutation(dnaOrig, dnaMut), [dnaOrig, dnaMut]);

  const cycleBaseAt = (idx) => {
    const bases = ['A', 'T', 'G', 'C'];
    const arr = mutDecoded.template3to5.split('');
    if (!arr[idx]) return;
    arr[idx] = bases[(bases.indexOf(arr[idx]) + 1) % 4];
    setDnaMut(arr.join(''));
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try { window.speechSynthesis?.cancel?.(); } catch { /* ignore */ }
    };
  }, [onClose]);

  return (
    <div className="tps-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="tps-modal" role="dialog" aria-modal="true" aria-label="Bộ 6 Công Cụ STEM & Học Thuật Pro">
        <header className="tps-head">
          <div>
            <h2>Bộ 6 Công Cụ Học Thuật Pro (Anki · Cornell · RSVP · Tiếng Anh · SI · Gen ADN)</h2>
            <p>Tuyển chọn những tính năng học sinh chất lượng nhất từ các kho mã nguồn mở GitHub</p>
          </div>
          <button type="button" className="tps-btn" onClick={onClose}>Đóng</button>
        </header>

        <div className="tps-tabs" role="tablist">
          {[
            { id: 'occlusion', label: 'Che nhãn Hình ảnh' },
            { id: 'cornell', label: 'Ghi chú Cornell' },
            { id: 'rsvp', label: 'Đọc nhanh RSVP' },
            { id: 'english', label: 'Nghe & Shadowing EN' },
            { id: 'units', label: 'Đổi đơn vị SI' },
            { id: 'dna', label: 'Giải mã Gen ADN' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tps-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {toast && <div className="tps-toast" role="status">{toast}</div>}

        {/* TAB 1: IMAGE OCCLUSION */}
        {tab === 'occlusion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className={`tps-btn${occQuizMode ? ' primary' : ''}`} onClick={() => { setOccQuizMode(true); setOccRevealed(new Set()); }}>
                  Chế độ Ôn tập ({occBoxes.length} ô che)
                </button>
                <button type="button" className={`tps-btn${!occQuizMode ? ' primary' : ''}`} onClick={() => setOccQuizMode(false)}>
                  Vẽ thêm ô che nhãn
                </button>
                <label className="tps-btn" style={{ cursor: 'pointer' }}>
                  Tải sơ đồ của bạn
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => {
                        setOccImg(String(r.result || ''));
                        setOccBoxes([]);
                        setOccRevealed(new Set());
                        setOccQuizMode(false);
                      };
                      r.readAsDataURL(f);
                    }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="tps-btn" onClick={() => setOccRevealed(new Set())}>Ẩn tất cả</button>
                <button type="button" className="tps-btn danger" onClick={() => { setOccBoxes([]); setOccRevealed(new Set()); }}>Xóa ô che</button>
              </div>
            </div>

            <div
              ref={occStageRef}
              onPointerDown={onOccPointerDown}
              onPointerMove={onOccPointerMove}
              onPointerUp={onOccPointerUp}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 720,
                margin: '0 auto',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--t-border-strong, rgba(15,23,42,0.14))',
                userSelect: 'none',
                cursor: occQuizMode ? 'default' : 'crosshair',
              }}
            >
              <img src={occImg} alt="Sơ đồ học tập Image Occlusion" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
              {occBoxes.map((b, idx) => {
                const open = occQuizMode && occRevealed.has(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!occQuizMode) {
                        setOccBoxes((arr) => arr.filter((x) => x.id !== b.id));
                        return;
                      }
                      setOccRevealed((prev) => {
                        const next = new Set(prev);
                        if (next.has(b.id)) next.delete(b.id);
                        else next.add(b.id);
                        return next;
                      });
                    }}
                    title={occQuizMode ? 'Bấm để lật / ẩn nhãn' : 'Bấm để xóa ô che này'}
                    style={{
                      position: 'absolute',
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      width: `${b.w}%`,
                      height: `${b.h}%`,
                      borderRadius: 6,
                      border: open ? '2px dashed #10b981' : '2px solid #ffffff',
                      background: open ? 'rgba(16,185,129,0.08)' : occQuizMode ? '#2563eb' : 'rgba(239,68,68,0.68)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {!open && (occQuizMode ? `#${idx + 1} ?` : `× #${idx + 1}`)}
                  </button>
                );
              })}
              {drawingBox && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${drawingBox.x}%`,
                    top: `${drawingBox.y}%`,
                    width: `${drawingBox.w}%`,
                    height: `${drawingBox.h}%`,
                    border: '2px dashed #2563eb',
                    background: 'rgba(37,99,235,0.2)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            <small style={{ textAlign: 'center', color: 'var(--t-ink-3, #64748b)' }}>
              {occQuizMode
                ? 'Tự nhẩm tên bộ phận bị che rồi bấm vào từng ô xanh để kiểm tra trí nhớ!'
                : 'Kéo chuột trên hình để tạo ô che nhãn mới (bấm vào ô đỏ để xóa).'}
            </small>
          </div>
        )}

        {/* TAB 2: CORNELL NOTES */}
        {tab === 'cornell' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={cornell.title}
                onChange={(e) => setCornell((c) => ({ ...c, title: e.target.value }))}
                className="tps-select"
                style={{ flex: 1 }}
                placeholder="Tiêu đề bài học Cornell..."
              />
              <button type="button" className="tps-btn primary" onClick={handlePrintCornell}>In Phiếu Cornell A4</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 32%) minmax(0, 1fr)', gap: 10 }}>
              <div className="tps-studio-card" style={{ alignItems: 'stretch', padding: 12, gap: 6 }}>
                <strong style={{ fontSize: '0.76rem', color: '#2563eb' }}>TỪ KHÓA / CÂU HỎI GỢI NHỚ (30%)</strong>
                <textarea
                  rows={8}
                  value={cornell.cues}
                  onChange={(e) => setCornell((c) => ({ ...c, cues: e.target.value }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', font: '500 0.84rem system-ui', lineHeight: 1.6, resize: 'vertical' }}
                />
              </div>
              <div className="tps-studio-card" style={{ alignItems: 'stretch', padding: 12, gap: 6 }}>
                <strong style={{ fontSize: '0.76rem', color: '#2563eb' }}>NỘI DUNG BÀI GIẢNG CHI TIẾT (70%)</strong>
                <textarea
                  rows={8}
                  value={cornell.notes}
                  onChange={(e) => setCornell((c) => ({ ...c, notes: e.target.value }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', font: '500 0.86rem system-ui', lineHeight: 1.65, resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="tps-studio-card" style={{ alignItems: 'stretch', padding: 12, gap: 6 }}>
              <strong style={{ fontSize: '0.76rem', color: '#059669' }}>TÓM TẮT CỐT LÕI (Tự viết 2–3 câu sau buổi học)</strong>
              <textarea
                rows={2}
                value={cornell.summary}
                onChange={(e) => setCornell((c) => ({ ...c, summary: e.target.value }))}
                style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', font: '600 0.85rem system-ui', lineHeight: 1.55 }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: RSVP SPEED READER */}
        {tab === 'rsvp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              className="tps-studio-card"
              style={{ padding: '32px 20px', background: '#0f172a', color: '#f8fafc', borderColor: '#1e293b' }}
            >
              <div style={{ fontSize: '0.74rem', opacity: 0.7, fontWeight: 700 }}>
                Từ {Math.min(rsvpIdx + 1, rsvpWords.length)}/{rsvpWords.length} · Tốc độ {rsvpWpm} từ/phút (WPM)
              </div>
              <div
                style={{
                  fontSize: 'clamp(2rem, 6vw, 3.2rem)',
                  fontWeight: 850,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: '0.02em',
                  minHeight: 62,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span>{currentOrp.left}</span>
                <span style={{ color: '#ef4444' }}>{currentOrp.pivot}</span>
                <span>{currentOrp.right}</span>
              </div>
              <div style={{ width: '100%', maxWidth: 460, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                <div style={{ width: `${rsvpWords.length ? ((rsvpIdx + 1) / rsvpWords.length) * 100 : 0}%`, height: '100%', background: '#3b82f6' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', fontWeight: 700, flex: '1 1 220px' }}>
                <span>Tốc độ: {rsvpWpm} WPM</span>
                <input type="range" min={150} max={600} step={20} value={rsvpWpm} onChange={(e) => setRsvpWpm(Number(e.target.value))} style={{ flex: 1, accentColor: '#2563eb' }} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="tps-btn primary" onClick={() => { if (rsvpIdx >= rsvpWords.length - 1) setRsvpIdx(0); setRsvpRunning((v) => !v); }}>
                  {rsvpRunning ? 'Tạm dừng' : 'Bắt đầu đọc nhanh'}
                </button>
                <button type="button" className="tps-btn" onClick={() => { setRsvpRunning(false); setRsvpIdx(0); }}>Đọc lại từ đầu</button>
              </div>
            </div>

            <textarea
              rows={3}
              value={rsvpText}
              onChange={(e) => { setRsvpText(e.target.value); setRsvpRunning(false); setRsvpIdx(0); }}
              placeholder="Dán đoạn đọc hiểu Ngữ văn / Tiếng Anh / Lý thuyết muốn luyện đọc nhanh vào đây..."
              style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--t-border-strong, #cbd5e1)', background: 'var(--t-surface-1, #f8fafc)', color: 'inherit', font: '500 0.84rem system-ui' }}
            />
          </div>
        )}

        {/* TAB 4: ENGLISH DICTATION & SHADOWING */}
        {tab === 'english' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ENGLISH_SHADOWING_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`tps-btn${engSampleId === s.id ? ' primary' : ''}`}
                  style={{ height: 32, fontSize: '0.78rem' }}
                  onClick={() => { setEngSampleId(s.id); setEngInput(''); setEngResult(null); setEngReveal(false); }}
                >
                  [{s.level}] {s.title}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="tps-btn primary" onClick={speakEnglish}>Nghe phát âm mẫu (EN-US)</button>
              <select className="tps-select" value={engRate} onChange={(e) => setEngRate(Number(e.target.value))}>
                <option value={0.75}>Chậm 0.75x</option>
                <option value={0.95}>Chuẩn 1.0x</option>
                <option value={1.2}>Nhanh 1.2x</option>
              </select>
              <button type="button" className={`tps-btn${listeningMic ? ' danger' : ''}`} onClick={startVoiceShadowing} disabled={listeningMic}>
                {listeningMic ? 'Đang nghe giọng bạn...' : 'Nói Shadowing (Micro)'}
              </button>
              <button type="button" className="tps-btn" onClick={() => setEngReveal((v) => !v)}>
                {engReveal ? 'Ẩn văn bản gốc' : 'Hiện văn bản gốc'}
              </button>
            </div>

            {engReveal && (
              <div className="tps-toast" style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.25)', color: 'inherit' }}>
                {activeEng.text}
              </div>
            )}

            <textarea
              rows={3}
              value={engInput}
              onChange={(e) => setEngInput(e.target.value)}
              placeholder="Nghe câu mẫu rồi gõ chính tả tiếng Anh vào đây (hoặc bấm Nói Shadowing)..."
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--t-border-strong, #cbd5e1)', background: 'var(--t-surface-1, #f8fafc)', color: 'inherit', font: '500 0.88rem system-ui' }}
            />

            <div>
              <button type="button" className="tps-btn primary" onClick={() => setEngResult(gradeDictationText(activeEng.text, engInput))}>
                Chấm điểm từng từ (Word-Diff)
              </button>
            </div>

            {engResult && (
              <div className="tps-studio-card" style={{ alignItems: 'stretch', gap: 8 }}>
                <strong style={{ color: engResult.accuracy >= 80 ? '#059669' : '#d97706' }}>
                  Độ chính xác: {engResult.accuracy}% ({engResult.correct}/{engResult.total} từ khớp)
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, lineHeight: 1.8 }}>
                  {engResult.words.map((w, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: w.ok ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                        color: w.ok ? '#059669' : '#dc2626',
                      }}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SI UNIT CONVERTER */}
        {tab === 'units' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {UNIT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`tps-btn${unitCatId === c.id ? ' primary' : ''}`}
                  style={{ height: 32, fontSize: '0.78rem' }}
                  onClick={() => { setUnitCatId(c.id); setUnitFrom(c.units[0].id); }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="number"
                value={unitVal}
                onChange={(e) => setUnitVal(e.target.value)}
                className="tps-select"
                style={{ width: 160, fontSize: '1rem' }}
              />
              <select className="tps-select" value={unitFrom} onChange={(e) => setUnitFrom(e.target.value)}>
                {activeUnitCat.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
              {activeUnitCat.units.map((u) => {
                const res = convertScientificUnit(unitCatId, unitVal, unitFrom, u.id);
                return (
                  <div key={u.id} className="tps-studio-card" style={{ alignItems: 'flex-start', padding: '12px 14px', gap: 4 }}>
                    <small style={{ color: 'var(--t-ink-3, #64748b)', fontWeight: 700 }}>{u.label}</small>
                    <strong style={{ fontSize: '1.1rem', color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>
                      {formatSciNumber(res)}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: DNA → mRNA → CODON & MUTATION */}
        {tab === 'dna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 750 }}>Mạch gốc ADN (3&apos;→5&apos;):</label>
              <input
                value={dnaOrig}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^ATCGX]/g, '');
                  setDnaOrig(v);
                  setDnaMut(v);
                }}
                className="tps-select"
                style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.08em' }}
                placeholder="VD: TACGGATTCACGATT"
              />
              <button type="button" className="tps-btn" onClick={() => setDnaMut(dnaOrig)}>Khôi phục gen gốc</button>
            </div>

            <div className="tps-studio-card" style={{ alignItems: 'stretch', gap: 10 }}>
              <small style={{ color: 'var(--t-ink-3, #64748b)', fontWeight: 700 }}>
                Bấm vào bất kỳ Nucleotit nào bên dưới để gây đột biến điểm (A → T → G → C) và quan sát kết quả:
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {mutDecoded.template3to5.split('').map((b, i) => {
                  const changed = origDecoded.template3to5[i] !== b;
                  const colors = { A: '#10b981', T: '#ef4444', G: '#2563eb', C: '#f59e0b' };
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => cycleBaseAt(i)}
                      style={{
                        width: 30,
                        height: 32,
                        borderRadius: 8,
                        border: changed ? '2px solid #dc2626' : '1px solid transparent',
                        background: colors[b] || '#64748b',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                      title={`Vị trí #${i + 1} (gốc: ${origDecoded.template3to5[i] || '?'}) — bấm để đột biến`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gap: 5, fontFamily: 'monospace', fontSize: '0.84rem' }}>
                <div><strong>ADN bổ sung (5&apos;→3&apos;):</strong> {mutDecoded.coding5to3}</div>
                <div><strong>mARN (5&apos;→3&apos;):&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong> {mutDecoded.codons.map((c) => c.codon).join(' - ')}</div>
                <div>
                  <strong>Chuỗi Polipeptit:&nbsp;&nbsp;&nbsp;</strong>{' '}
                  <span style={{ color: '#2563eb', fontWeight: 800 }}>{mutDecoded.aminoAcids.join(' — ') || '(Chưa đủ bộ ba)'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Tổng Nu (N): {mutDecoded.stats.totalNu}</span>
                <span>Liên kết Hidro (H): {mutDecoded.stats.hBonds}</span>
                <span>Chiều dài (L): {mutDecoded.stats.lengthAngstrom} Å</span>
                <span>Khối lượng (M): {mutDecoded.stats.massDa.toLocaleString('vi-VN')} đvC</span>
              </div>

              {mutationInfo.type !== 'none' && (
                <div
                  className="tps-toast"
                  style={{
                    background: mutationInfo.type === 'silent' ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                    borderColor: mutationInfo.type === 'silent' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                    color: mutationInfo.type === 'silent' ? '#059669' : '#dc2626',
                  }}
                >
                  {mutationInfo.label} (ΔH = {mutationInfo.deltaH >= 0 ? `+${mutationInfo.deltaH}` : mutationInfo.deltaH} liên kết Hidro)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
