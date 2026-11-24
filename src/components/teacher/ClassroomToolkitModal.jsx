/* ============================================================
   ClassroomToolkitModal.jsx — Studio Công cụ Dạy học Trên lớp Pro
   Lấy cảm hứng từ Wheel of Names, ClassroomScreen, SeatWise & RandomGroup:
     1. Vòng quay May mắn 60fps (Canvas đa sắc + âm thanh tạch tạch + Confetti + không gọi lặp)
     2. Sơ đồ Phòng thi chống nhìn bài (mã đề 2D Coloring + bấm 2 ghế đổi chỗ + In A4)
     3. Chia nhóm Thảo luận (Snake-Draft cân bằng lực học + Copy gửi Zalo lớp)
     4. Đồng hồ Chiếu bảng & Đo độ ồn lớp học Realtime (WebAudio Microphone Meter)
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  generateAntiCheatSeating,
  generateBalancedGroups,
  formatGroupsForZalo,
} from '../../lib/classroomToolkitEngine.js';
import '../../styles/teacher-pro-studio.css';

const WHEEL_PALETTE = [
  '#2563eb', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const CODE_COLORS = [
  { bg: 'rgba(37, 99, 235, 0.14)', text: '#1d4ed8', border: 'rgba(37, 99, 235, 0.34)' },
  { bg: 'rgba(16, 185, 129, 0.14)', text: '#047857', border: 'rgba(16, 185, 129, 0.34)' },
  { bg: 'rgba(245, 158, 11, 0.16)', text: '#b45309', border: 'rgba(245, 158, 11, 0.36)' },
  { bg: 'rgba(139, 92, 246, 0.14)', text: '#6d28d9', border: 'rgba(139, 92, 246, 0.34)' },
];

function playTickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!playTickSound._ctx) playTickSound._ctx = new AudioCtx();
    const ctx = playTickSound._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch { /* ignore */ }
}

function playWinChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.1 + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.45);
    });
  } catch { /* ignore */ }
}

function fmtTimer(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function ClassroomToolkitModal({ classes = [], initialClassId = '', onClose }) {
  const [selectedClassId, setSelectedClassId] = useState(
    () => initialClassId || classes[0]?.id || ''
  );
  const [toolTab, setToolTab] = useState('wheel'); // 'wheel' | 'seating' | 'groups' | 'board'
  const [toast, setToast] = useState('');

  const activeClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0] || null,
    [classes, selectedClassId]
  );

  const students = useMemo(() => {
    const mems = Array.isArray(activeClass?.members) ? activeClass.members : [];
    return mems.map((m, idx) => ({
      id: m.id || m.uid || `m_${idx}`,
      name: m.name || m.studentName || `Học sinh ${idx + 1}`,
      avgScore: typeof m.avgScore === 'number' ? m.avgScore : null,
    }));
  }, [activeClass]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }, []);

  /* --- 1. SPINNING WHEEL (60FPS CANVAS) --- */
  const [calledIds, setCalledIds] = useState([]);
  const [bonusMap, setBonusMap] = useState({});
  const [noRepeat, setNoRepeat] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);
  const wheelCanvasRef = useRef(null);
  const angleRef = useRef(0);
  const confettiRef = useRef([]);

  const wheelPool = useMemo(() => {
    if (!students.length) return [];
    if (!noRepeat) return students;
    const set = new Set(calledIds);
    const remain = students.filter((s) => !set.has(s.id));
    return remain.length > 0 ? remain : students;
  }, [students, calledIds, noRepeat]);

  const drawWheel = useCallback((rotAngle, confetti = []) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 316;
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 6;
    const list = wheelPool.length ? wheelPool : [{ id: 'empty', name: 'Chưa có HS' }];
    const n = list.length;
    const arc = (Math.PI * 2) / n;

    list.forEach((st, i) => {
      const start = rotAngle + i * arc - Math.PI / 2;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.stroke();

      // Tên học sinh dọc theo bán kính
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      const fontSize = n > 24 ? 9 : n > 14 ? 10.5 : 12.5;
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
      const parts = String(st.name || '').trim().split(/\s+/);
      const shortLbl = parts.length >= 2 ? `${parts[parts.length - 2]} ${parts[parts.length - 1]}` : st.name;
      ctx.fillText(shortLbl.slice(0, 15), radius - 14, fontSize * 0.35);
      ctx.restore();
    });

    // Tâm vòng quay sang trọng
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QUAY', cx, cy);

    // Pháo giấy Confetti khi dừng
    confetti.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    ctx.restore();
  }, [wheelPool]);

  useEffect(() => {
    if (toolTab === 'wheel') {
      drawWheel(angleRef.current);
    }
  }, [toolTab, drawWheel]);

  const handleSpinWheel = () => {
    if (!wheelPool.length || spinning) return;
    setSpinning(true);
    const poolSnap = [...wheelPool];
    const n = poolSnap.length;
    const arc = (Math.PI * 2) / n;
    const startAngle = angleRef.current;
    const extraTurns = 5 + Math.random() * 3;
    const targetDelta = extraTurns * Math.PI * 2 + Math.random() * Math.PI * 2;
    const duration = 3600;
    const t0 = performance.now();
    let lastSliceIdx = -1;

    const frame = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      // Cubic ease-out mượt chuẩn vật lý
      const ease = 1 - Math.pow(1 - p, 3);
      const curAngle = startAngle + targetDelta * ease;
      angleRef.current = curAngle;

      // Xác định lát đang đi qua kim đỉnh 12 giờ
      const norm = (((-curAngle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const sliceIdx = Math.floor(norm / arc) % n;
      if (sliceIdx !== lastSliceIdx) {
        lastSliceIdx = sliceIdx;
        if (p < 0.96) playTickSound();
      }

      drawWheel(curAngle);

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        const winner = poolSnap[sliceIdx];
        setPickedStudent(winner);
        if (noRepeat && winner) {
          setCalledIds((prev) => {
            const set = new Set(prev);
            const remaining = students.filter((s) => !set.has(s.id));
            if (remaining.length <= 1) {
              showToast('Đã quay trọn 1 vòng lớp — lượt sau sẽ mở vòng mới!');
              return [];
            }
            return [...prev, winner.id];
          });
        }
        playWinChime();
        setSpinning(false);

        // Hiệu ứng pháo giấy Confetti bùng nổ 1.1s
        confettiRef.current = Array.from({ length: 42 }, (_, k) => {
          const ang = (Math.PI * 2 * k) / 42 + Math.random() * 0.2;
          const spd = 2.2 + Math.random() * 4.5;
          return {
            x: 158,
            y: 158,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 1.5,
            w: 5 + Math.random() * 5,
            h: 4 + Math.random() * 4,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 0.25,
            color: WHEEL_PALETTE[k % WHEEL_PALETTE.length],
            alpha: 1,
          };
        });
        const burstStart = performance.now();
        const animConfetti = (ts) => {
          const dt = (ts - burstStart) / 1100;
          confettiRef.current.forEach((pt) => {
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += 0.12;
            pt.rot += pt.vrot;
            pt.alpha = 1 - dt;
          });
          drawWheel(angleRef.current, confettiRef.current);
          if (dt < 1) requestAnimationFrame(animConfetti);
          else drawWheel(angleRef.current, []);
        };
        requestAnimationFrame(animConfetti);
      }
    };
    requestAnimationFrame(frame);
  };

  /* --- 2. SEATING CHART (SEATWISE + 2-CLICK SWAP) --- */
  const [seatRows, setSeatRows] = useState(6);
  const [seatCols, setSeatCols] = useState(4);
  const [seatMode, setSeatMode] = useState('random');
  const [seatCodeCount, setSeatCodeCount] = useState(4);
  const [seatNonce, setSeatNonce] = useState(0);
  const [swapOrigin, setSwapOrigin] = useState(null);
  const [customGrid, setCustomGrid] = useState(null);

  const generatedSeating = useMemo(() => {
    const codes = Array.from({ length: seatCodeCount }, (_, i) => String(101 + i));
    return generateAntiCheatSeating({
      students,
      rows: seatRows,
      cols: seatCols,
      examCodes: codes,
      mode: seatMode,
    });
  }, [students, seatRows, seatCols, seatMode, seatCodeCount, seatNonce]);

  useEffect(() => {
    setCustomGrid(null);
    setSwapOrigin(null);
  }, [generatedSeating]);

  const activeGrid = customGrid || generatedSeating.grid;

  const handleSeatClick = (r, c) => {
    if (!swapOrigin) {
      setSwapOrigin({ r, c });
      return;
    }
    if (swapOrigin.r === r && swapOrigin.c === c) {
      setSwapOrigin(null);
      return;
    }
    const next = activeGrid.map((row) => row.map((cell) => ({ ...cell })));
    const a = next[swapOrigin.r][swapOrigin.c];
    const b = next[r][c];
    const tmpStu = a.student;
    a.student = b.student;
    b.student = tmpStu;
    a.examCode = a.student ? generatedSeating.codes[a.codeIndex] : null;
    b.examCode = b.student ? generatedSeating.codes[b.codeIndex] : null;
    setCustomGrid(next);
    setSwapOrigin(null);
    showToast(`Đã hoán đổi chỗ ghế ${a.seatLabel} ↔ ${b.seatLabel} (giữ nguyên mã đề chống nhìn bài).`);
  };

  /* --- 3. GROUP MAKER --- */
  const [groupCount, setGroupCount] = useState(4);
  const [groupMode, setGroupMode] = useState('snake');
  const [groupNonce, setGroupNonce] = useState(0);

  const groups = useMemo(
    () => generateBalancedGroups({ students, groupCount, mode: groupMode }),
    [students, groupCount, groupMode, groupNonce]
  );

  /* --- 4. BOARD TIMER + LIVE NOISE METER (WEBAUDIO MICROPHONE) --- */
  const [timerSec, setTimerSec] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLabel, setTimerLabel] = useState('Thảo luận nhóm');

  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState('');
  const [noiseLevel, setNoiseLevel] = useState(0); // 0..100
  const [noiseThreshold, setNoiseThreshold] = useState(65);
  const [noiseBars, setNoiseBars] = useState(() => new Array(16).fill(8));
  const micCleanupRef = useRef(null);
  const lastAlertRef = useRef(0);

  const stopNoiseMeter = useCallback(() => {
    micCleanupRef.current?.();
    micCleanupRef.current = null;
    setMicActive(false);
    setNoiseLevel(0);
    setNoiseBars(new Array(16).fill(8));
  }, []);

  const startNoiseMeter = async () => {
    setMicError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập Micro.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let alive = true;
      let raf = 0;

      const loop = () => {
        if (!alive) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const pct = Math.min(100, Math.round((avg / 140) * 100));
        setNoiseLevel(pct);
        const bars = Array.from({ length: 16 }, (_, i) => {
          const val = data[i * 2] || 0;
          return Math.max(8, Math.min(100, Math.round((val / 210) * 100)));
        });
        setNoiseBars(bars);
        raf = requestAnimationFrame(loop);
      };
      loop();

      micCleanupRef.current = () => {
        alive = false;
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close?.().catch(() => {});
      };
      setMicActive(true);
    } catch (err) {
      setMicError(err?.message || 'Không bật được Micro (hãy cấp quyền micro trên trình duyệt).');
    }
  };

  useEffect(() => {
    if (micActive && noiseLevel >= noiseThreshold) {
      const now = Date.now();
      if (now - lastAlertRef.current > 4500) {
        lastAlertRef.current = now;
        playTickSound();
      }
    }
  }, [micActive, noiseLevel, noiseThreshold]);

  useEffect(() => () => stopNoiseMeter(), [stopNoiseMeter]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playWinChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopyGroupsZalo = async () => {
    const txt = formatGroupsForZalo(groups, activeClass?.name || '');
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Đã copy danh sách nhóm — sẵn sàng dán vào Zalo lớp!');
    } catch {
      showToast('Không thể copy tự động trên trình duyệt này.');
    }
  };

  const handlePrintSeating = () => {
    const win = window.open('', '_blank', 'width=960,height=720');
    if (!win) return;
    const htmlRows = activeGrid
      .map(
        (row) =>
          `<tr>${row
            .map(
              (cell) =>
                `<td style="border:1px solid #cbd5e1;padding:10px 8px;text-align:center;vertical-align:middle;width:${Math.floor(100 / generatedSeating.cols)}%">
                  <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${cell.seatLabel}</div>
                  <div style="font-weight:700;font-size:13px;color:#0f172a;">${cell.student ? cell.student.name : '— Trống —'}</div>
                  ${cell.examCode ? `<div style="margin-top:4px;display:inline-block;padding:2px 8px;border-radius:99px;background:#eff6ff;color:#1d4ed8;font-weight:800;font-size:11px;">Mã đề ${cell.examCode}</div>` : ''}
                </td>`
            )
            .join('')}</tr>`
      )
      .join('');
    win.document.write(`<!doctype html><html><head><title>Sơ đồ phòng thi - Lớp ${activeClass?.name || ''}</title></head><body style="font-family:system-ui,sans-serif;padding:24px;">
      <h2 style="text-align:center;margin:0 0 6px;">SƠ ĐỒ CHỖ NGỒI PHÒNG THI — LỚP ${(activeClass?.name || '').toUpperCase()}</h2>
      <p style="text-align:center;color:#475569;margin:0 0 18px;font-size:13px;">Sĩ số: ${generatedSeating.seatedCount}/${students.length} HS · Mã đề xen kẽ chống nhìn bài (${generatedSeating.codes.join(', ')})</p>
      <div style="text-align:center;padding:8px;margin:0 auto 14px;width:240px;border:2px dashed #64748b;border-radius:8px;font-weight:700;font-size:13px;">BẢNG / BÀN GIÁO VIÊN</div>
      <table style="width:100%;border-collapse:collapse;">${htmlRows}</table>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  return (
    <div
      className="tps-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="tps-modal" role="dialog" aria-modal="true" aria-label="Studio Công cụ Dạy học Trên lớp">
        <header className="tps-head">
          <div>
            <h2>Studio Công cụ Dạy học Trên lớp</h2>
            <p>Vòng quay May mắn 60fps · Sơ đồ Phòng thi 2D · Chia nhóm Zalo · Đồng hồ &amp; Đo độ ồn lớp học</p>
          </div>
          <div className="tps-head-ctrl">
            {classes.length > 0 && (
              <select
                className="tps-select"
                value={activeClass?.id || ''}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setCalledIds([]);
                  setPickedStudent(null);
                }}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({c.members?.length || 0} HS)
                  </option>
                ))}
              </select>
            )}
            <button type="button" className="tps-btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        </header>

        <div className="tps-tabs" role="tablist">
          {[
            { id: 'wheel', label: 'Vòng quay May mắn' },
            { id: 'seating', label: 'Sơ đồ Phòng thi & Mã đề' },
            { id: 'groups', label: 'Chia nhóm Thảo luận' },
            { id: 'board', label: 'Đồng hồ & Đo độ ồn' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={toolTab === t.id}
              className={`tps-tab${toolTab === t.id ? ' active' : ''}`}
              onClick={() => setToolTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {toast && <div className="tps-toast" role="status">{toast}</div>}

        {/* TAB 1: SPINNING WHEEL */}
        {toolTab === 'wheel' && (
          <div className="tps-wheel-layout">
            <div className="tps-wheel-stage">
              <div className="tps-wheel-pointer" aria-hidden="true" />
              <canvas
                ref={wheelCanvasRef}
                className="tps-wheel-canvas"
                onClick={handleSpinWheel}
                style={{ cursor: spinning ? 'wait' : 'pointer' }}
                title="Bấm vào vòng quay để quay gọi tên"
              />
            </div>

            <div className="tps-wheel-panel">
              <div className="tps-winner-box">
                <small>
                  {spinning
                    ? 'Đang quay chọn ngẫu nhiên...'
                    : pickedStudent
                    ? 'Học sinh được chọn'
                    : `Sẵn sàng · ${wheelPool.length}/${students.length} em trên vòng quay`}
                </small>
                <div className="tps-winner-name">
                  {pickedStudent ? pickedStudent.name : students.length ? 'Bấm Quay ngay!' : 'Lớp chưa có học sinh'}
                </div>
                {pickedStudent && !spinning && (
                  <button
                    type="button"
                    className="tps-btn"
                    style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
                    onClick={() => {
                      setBonusMap((m) => ({ ...m, [pickedStudent.id]: (m[pickedStudent.id] || 0) + 1 }));
                      showToast(`Đã ghi +1 điểm phát biểu cho ${pickedStudent.name}`);
                    }}
                  >
                    +1 Điểm phát biểu ({bonusMap[pickedStudent.id] || 0})
                  </button>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', fontWeight: 650, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noRepeat}
                  onChange={(e) => setNoRepeat(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#2563eb' }}
                />
                Loại khỏi vòng quay sau khi gọi (công bằng cả lớp)
              </label>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="tps-btn primary" style={{ flex: 1 }} disabled={spinning || !students.length} onClick={handleSpinWheel}>
                  {spinning ? 'Đang quay...' : 'Quay gọi tên ngay'}
                </button>
                <button
                  type="button"
                  className="tps-btn"
                  onClick={() => {
                    setCalledIds([]);
                    setPickedStudent(null);
                    showToast('Đã đặt lại vòng quay đầy đủ cả lớp.');
                  }}
                >
                  Đặt lại ({calledIds.length}/{students.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEATING CHART */}
        {toolTab === 'seating' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: '0.82rem' }}>
                <label>Hàng <input type="number" min={1} max={12} value={seatRows} onChange={(e) => setSeatRows(Number(e.target.value) || 4)} className="tps-select" style={{ width: 58, height: 32 }} /></label>
                <label>Dãy <input type="number" min={1} max={8} value={seatCols} onChange={(e) => setSeatCols(Number(e.target.value) || 4)} className="tps-select" style={{ width: 58, height: 32 }} /></label>
                <select value={seatCodeCount} onChange={(e) => setSeatCodeCount(Number(e.target.value))} className="tps-select" style={{ height: 32 }}>
                  <option value={2}>2 mã đề (101–102)</option>
                  <option value={4}>4 mã đề (101–104)</option>
                  <option value={6}>6 mã đề (101–106)</option>
                </select>
                <select value={seatMode} onChange={(e) => setSeatMode(e.target.value)} className="tps-select" style={{ height: 32 }}>
                  <option value="random">Xáo ngẫu nhiên</option>
                  <option value="alpha">Theo thứ tự ABC</option>
                  <option value="mentor">Ghép giỏi kèm yếu</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="tps-btn" onClick={() => setSeatNonce((n) => n + 1)}>Xáo lại chỗ</button>
                <button type="button" className="tps-btn primary" onClick={handlePrintSeating}>In Sơ đồ A4</button>
              </div>
            </div>

            <div className="tps-board-banner">
              BẢNG / BÀN GIÁO VIÊN · Bấm chọn 2 ghế bất kỳ để hoán đổi học sinh (mã đề tự động chống nhìn bài 4 hướng)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${generatedSeating.cols}, minmax(132px, 1fr))`, gap: 8, overflowX: 'auto' }}>
              {activeGrid.flat().map((cell) => {
                const pal = CODE_COLORS[cell.codeIndex % CODE_COLORS.length];
                const isSel = swapOrigin && swapOrigin.r === cell.row && swapOrigin.c === cell.col;
                return (
                  <button
                    type="button"
                    key={cell.seatLabel}
                    className={`tps-seat-cell${isSel ? ' is-selected' : ''}`}
                    style={{ borderColor: isSel ? '#2563eb' : cell.student ? pal.border : undefined }}
                    onClick={() => handleSeatClick(cell.row, cell.col)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.7rem', color: 'var(--t-ink-3, #64748b)' }}>
                      <span>Ghế {cell.seatLabel}</span>
                      {cell.examCode && (
                        <span style={{ padding: '1px 6px', borderRadius: 99, background: pal.bg, color: pal.text, fontWeight: 800 }}>
                          Mã {cell.examCode}
                        </span>
                      )}
                    </div>
                    <strong style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                      {cell.student ? cell.student.name : '— Trống —'}
                    </strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: GROUP MAKER */}
        {toolTab === 'groups' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: '0.83rem' }}>
                <label>Số nhóm <input type="number" min={2} max={10} value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value) || 4)} className="tps-select" style={{ width: 60, height: 34 }} /></label>
                <select value={groupMode} onChange={(e) => setGroupMode(e.target.value)} className="tps-select" style={{ height: 34 }}>
                  <option value="snake">Cân bằng lực học (Snake-Draft)</option>
                  <option value="random">Chia ngẫu nhiên đều sĩ số</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="tps-btn" onClick={() => setGroupNonce((n) => n + 1)}>Chia lại nhóm</button>
                <button type="button" className="tps-btn primary" onClick={handleCopyGroupsZalo}>Copy gửi Zalo lớp</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
              {groups.map((g) => (
                <div key={g.index} className="tps-studio-card" style={{ alignItems: 'stretch', padding: '14px 16px', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#2563eb' }}>{g.name}</strong>
                    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--t-ink-3, #64748b)' }}>
                      {g.members.length} HS{g.avgScore !== null ? ` · TB ${g.avgScore}` : ''}
                    </span>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {g.members.map((m) => <li key={m.id}>{m.name}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BOARD TIMER + LIVE CLASSROOM NOISE METER */}
        {toolTab === 'board' && (
          <div className="tps-timer-grid">
            <div className="tps-studio-card">
              <input
                value={timerLabel}
                onChange={(e) => setTimerLabel(e.target.value)}
                className="tps-select"
                style={{ textAlign: 'center', width: '100%', maxWidth: 260 }}
                placeholder="Tên hoạt động..."
              />
              <div
                style={{
                  fontSize: 'clamp(3.1rem, 8vw, 4.4rem)',
                  fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                  color: timerSec <= 30 && timerSec > 0 ? '#dc2626' : '#2563eb',
                  lineHeight: 1.05,
                }}
              >
                {fmtTimer(timerSec)}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[1, 3, 5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="tps-btn"
                    style={{ height: 30, padding: '0 10px', fontSize: '0.76rem' }}
                    onClick={() => { setTimerRunning(false); setTimerSec(m * 60); }}
                  >
                    {m}p
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="tps-btn primary" onClick={() => setTimerRunning((v) => !v)}>
                  {timerRunning ? 'Tạm dừng' : 'Bắt đầu'}
                </button>
                <button type="button" className="tps-btn" onClick={() => { setTimerRunning(false); setTimerSec(300); }}>
                  Đặt lại
                </button>
              </div>
            </div>

            <div className="tps-studio-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <strong style={{ fontSize: '0.92rem' }}>Đo độ ồn lớp học (Micro Live)</strong>
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: 99,
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    background: !micActive ? 'rgba(148,163,184,0.16)' : noiseLevel >= noiseThreshold ? 'rgba(239,68,68,0.16)' : noiseLevel >= noiseThreshold * 0.7 ? 'rgba(245,158,11,0.16)' : 'rgba(16,185,129,0.16)',
                    color: !micActive ? '#64748b' : noiseLevel >= noiseThreshold ? '#dc2626' : noiseLevel >= noiseThreshold * 0.7 ? '#b45309' : '#059669',
                  }}
                >
                  {!micActive ? 'Đang tắt' : noiseLevel >= noiseThreshold ? `Quá ồn (${noiseLevel}%)` : noiseLevel >= noiseThreshold * 0.7 ? `Ồn vừa (${noiseLevel}%)` : `Yên tĩnh (${noiseLevel}%)`}
                </span>
              </div>

              <div className="tps-noise-bars" aria-label="Cột sóng độ ồn lớp học">
                {noiseBars.map((h, i) => (
                  <span
                    key={i}
                    className="tps-noise-bar"
                    style={{
                      height: `${h}%`,
                      background: h >= noiseThreshold ? '#ef4444' : h >= noiseThreshold * 0.7 ? '#f59e0b' : '#10b981',
                    }}
                  />
                ))}
              </div>

              <label style={{ width: '100%', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Ngưỡng báo ồn ({noiseThreshold}%)</span>
                <input
                  type="range"
                  min={25}
                  max={95}
                  value={noiseThreshold}
                  onChange={(e) => setNoiseThreshold(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#2563eb' }}
                />
              </label>

              {micError && <small style={{ color: '#dc2626', fontWeight: 600 }}>{micError}</small>}

              <button
                type="button"
                className={`tps-btn ${micActive ? 'danger' : 'primary'}`}
                onClick={micActive ? stopNoiseMeter : startNoiseMeter}
              >
                {micActive ? 'Tắt cảm biến độ ồn' : 'Bật Micro đo độ ồn lớp'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
