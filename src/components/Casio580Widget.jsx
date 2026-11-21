/* ============================================================
   Casio580Widget.jsx — React Wrapper Pro cho Casio fx-580VN X ClassWiz
   ------------------------------------------------------------
   • An toàn tuyệt đối với React StrictMode & mount/unmount nhiều lần
   • 3 Vỏ phần cứng cao cấp: Carbon Black · ELEC Cobalt · Pearl Silver
   • Thanh điều khiển nhanh: DEG/RAD/GRA · Âm bấm phím · Copy kết quả
   • Expose imperative API (insertText, loadExpression, selectMode, setAngleUnit)
   ============================================================ */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CalculatorApp } from '../features/casio580/ui/CalculatorApp.ts';
import '../features/casio580/casio580.css';

export const CASIO_MODES = [
  { id: 'COMP', code: '1', short: 'COMP', name: 'Tính toán thường', desc: 'Số học, phân số, lượng giác, log, S⇔D' },
  { id: 'COMPLEX', code: '2', short: 'CMPLX', name: 'Số phức (a+bi)', desc: 'Tổng hợp dao động & điện xoay chiều' },
  { id: 'BASE-N', code: '3', short: 'BASE', name: 'Hệ cơ số', desc: 'Chuyển đổi DEC / HEX / BIN / OCT 32-bit' },
  { id: 'MATRIX', code: '4', short: 'MAT', name: 'Ma trận 4×4', desc: 'Cộng, nhân, định thức, nghịch đảo' },
  { id: 'VECTOR', code: '5', short: 'VEC', name: 'Véc-tơ 2D/3D', desc: 'Tích vô hướng, có hướng, độ lớn' },
  { id: 'STATISTICS', code: '6', short: 'STAT', name: 'Thống kê', desc: '1 biến & hồi quy tuyến tính 2 biến' },
  { id: 'TABLE', code: '9', short: 'TBL', name: 'Bảng giá trị f(x)', desc: 'Lập bảng khảo sát hàm f(x), g(x)' },
  { id: 'EQUATION', code: 'A', short: 'EQN', name: 'Phương trình & Hệ', desc: 'Hệ 2–4 ẩn & đa thức bậc 2–4' },
];

const SKINS = [
  { id: 'carbon', label: 'Carbon' },
  { id: 'cobalt', label: 'ELEC Cobalt' },
  { id: 'pearl', label: 'Pearl' },
];

const IcoCopy = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IcoVolume = ({ size = 13, muted = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {muted ? (
      <>
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    ) : (
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    )}
  </svg>
);

const Casio580Widget = forwardRef(function Casio580Widget(
  {
    compact = false,
    captureKeyboard = true,
    showModeBar = true,
    showHardwareBar = true,
    onModeChange,
    onAngleChange,
    onHistoryChange,
    externalMode,
  },
  ref
) {
  const mountRef = useRef(null);
  const appRef = useRef(null);
  const cbRef = useRef({ onModeChange, onAngleChange, onHistoryChange });
  cbRef.current = { onModeChange, onAngleChange, onHistoryChange };

  const [activeMode, setActiveMode] = useState('COMP');
  const [angleUnit, setAngleUnit] = useState('DEG');
  const [lastResult, setLastResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [skin, setSkin] = useState(() => {
    try {
      const saved = localStorage.getItem('elec_casio_skin');
      return saved === 'carbon' || saved === 'cobalt' || saved === 'pearl' ? saved : 'cobalt';
    } catch {
      return 'cobalt';
    }
  });

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    const app = new CalculatorApp(el, {
      captureKeyboard,
      lcdTheme: skin,
      soundEnabled: soundOn,
      onStateChange: (st) => {
        if (st?.currentMode) {
          setActiveMode(st.currentMode);
          cbRef.current.onModeChange?.(st.currentMode);
        }
        if (st?.statusFlags?.angleUnit) {
          const u = st.statusFlags.angleUnit === 'R' ? 'RAD' : st.statusFlags.angleUnit === 'G' ? 'GRA' : 'DEG';
          setAngleUnit(u);
          cbRef.current.onAngleChange?.(u);
        }
        setLastResult(st?.result ? String(st.result) : '');
        cbRef.current.onHistoryChange?.(app.getHistory());
      },
    });
    appRef.current = app;
    cbRef.current.onHistoryChange?.(app.getHistory());

    return () => {
      app.destroy();
      appRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureKeyboard]);

  useEffect(() => {
    appRef.current?.setLcdTheme(skin);
    try { localStorage.setItem('elec_casio_skin', skin); } catch { /* ignore */ }
  }, [skin]);

  useEffect(() => {
    appRef.current?.setSoundEnabled(soundOn);
  }, [soundOn]);

  useEffect(() => {
    if (externalMode && appRef.current) {
      appRef.current.selectMode(externalMode);
    }
  }, [externalMode]);

  useImperativeHandle(ref, () => ({
    selectMode: (m) => appRef.current?.selectMode(m),
    setAngleUnit: (u) => appRef.current?.setAngleUnit(u),
    insertText: (txt) => appRef.current?.insertText(txt),
    loadExpression: (expr, res) => appRef.current?.loadExpression(expr, res),
    getHistory: () => appRef.current?.getHistory() || [],
  }));

  const cycleAngle = () => {
    const next = angleUnit === 'DEG' ? 'RAD' : angleUnit === 'RAD' ? 'GRA' : 'DEG';
    appRef.current?.setAngleUnit(next);
  };

  const cycleSkin = () => {
    const idx = SKINS.findIndex((s) => s.id === skin);
    const next = SKINS[(idx + 1) % SKINS.length].id;
    setSkin(next);
  };

  const handleCopy = () => {
    if (!lastResult) return;
    navigator.clipboard?.writeText(lastResult).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  };

  const skinLabel = SKINS.find((s) => s.id === skin)?.label || 'Cobalt';

  return (
    <div
      className={'elec-casio-host' + (compact ? ' is-compact' : '')}
      data-skin={skin}
    >
      {showHardwareBar && (
        <div className="elec-casio-hw-bar">
          <div className="elec-casio-hw-left">
            <button
              type="button"
              className="elec-casio-hw-pill angle"
              onClick={cycleAngle}
              title="Đổi đơn vị góc lượng giác (DEG / RAD / GRA)"
            >
              {angleUnit}
            </button>
            <button
              type="button"
              className="elec-casio-hw-pill"
              onClick={cycleSkin}
              title="Đổi vỏ máy tính (Carbon · ELEC Cobalt · Pearl)"
            >
              Vỏ: {skinLabel}
            </button>
          </div>
          <div className="elec-casio-hw-right">
            <button
              type="button"
              className={'elec-casio-hw-ico' + (soundOn ? ' on' : '')}
              onClick={() => setSoundOn((v) => !v)}
              title={soundOn ? 'Tắt âm bấm phím' : 'Bật âm bấm phím'}
              aria-label={soundOn ? 'Tắt âm bấm phím' : 'Bật âm bấm phím'}
            >
              <IcoVolume size={13} muted={!soundOn} />
            </button>
            <button
              type="button"
              className={'elec-casio-hw-pill' + (copied ? ' copied' : '')}
              onClick={handleCopy}
              disabled={!lastResult}
              title="Sao chép kết quả trên màn hình LCD"
            >
              <IcoCopy size={12} /> {copied ? 'Đã copy' : 'Copy KQ'}
            </button>
          </div>
        </div>
      )}

      {showModeBar && (
        <div className="elec-casio-mode-bar" role="tablist" aria-label="Chọn nhanh chế độ Casio fx-580VN X">
          {CASIO_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={activeMode === m.id}
              className={'elec-casio-mode-chip' + (activeMode === m.id ? ' on' : '')}
              onClick={() => appRef.current?.selectMode(m.id)}
              title={`${m.code}: ${m.name} — ${m.desc}`}
            >
              {m.code}:{m.short}
            </button>
          ))}
        </div>
      )}

      <div ref={mountRef} className="elec-casio-mount" />
    </div>
  );
});

export default Casio580Widget;
