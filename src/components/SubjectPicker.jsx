/* ============================================================
   SubjectPicker.jsx — Component chọn môn học (đa môn)
   ------------------------------------------------------------
   Dùng cho AutoExamStudio, CreateExamAI, ExamCreateForm...
   Hiển thị:
     • Grid chip 12 môn chính (Toán, Lý, Hóa, Sinh, Văn, Anh, Sử,
       Địa, GDCD, Tin, Công nghệ, KHTN)
     • Icon SVG riêng cho từng môn
     • Nút "+ Môn khác" — mở input tự do
     • Highlight môn đang chọn
   Props:
     value       string — tên môn đang chọn
     onChange    (subject: string) => void
     disabled    boolean
     compact     boolean — chế độ gọn cho sidebar
     className   string
   ============================================================ */
import { useState, useEffect, useMemo, useRef } from 'react';
import { SUBJECTS, GENERIC_SUBJECT, getSubject } from '../lib/subjects.js';
import './subject-picker.css';

/* ============ SVG ICONS ============ */
const Svg = ({ size = 20, sw = 1.8, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/* Icon cho từng môn — SVG riêng, không dùng emoji */
const IcoToan = (p) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="12" y1="5" x2="12" y2="19" />
    <circle cx="12" cy="12" r="9" opacity="0.4" />
  </Svg>
);

const IcoLy = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" />
  </Svg>
);

const IcoHoa = (p) => (
  <Svg {...p}>
    <path d="M10 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V2" />
    <line x1="8" y1="2" x2="16" y2="2" />
    <path d="M6 14h12" />
  </Svg>
);

const IcoSinh = (p) => (
  <Svg {...p}>
    <path d="M7 21c0-5 3-9 8-11" />
    <path d="M7 21c-2 0-4-2-4-5 0-4 3-7 6-9" />
    <ellipse cx="15" cy="8" rx="4" ry="2" transform="rotate(-25 15 8)" />
    <ellipse cx="9" cy="14" rx="3" ry="1.5" transform="rotate(-25 9 14)" />
  </Svg>
);

const IcoVan = (p) => (
  <Svg {...p}>
    <path d="M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    <path d="M14 4v6h6" />
    <path d="M8 14h6M8 17h4" />
    <path d="M8 10h2" />
  </Svg>
);

const IcoAnh = (p) => (
  <Svg {...p}>
    <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" />
    <path d="M7 15c1.5-1.5 2.5-1.5 4 0s2.5 1.5 4 0" />
  </Svg>
);

const IcoSu = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
  </Svg>
);

const IcoDia = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);

const IcoGdcd = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

const IcoTin = (p) => (
  <Svg {...p}>
    <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />
    <path d="M16 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2" />
    <path d="M10 9l2 3-2 3M14 9l-2 3 2 3" opacity="0.5" />
    <path d="M11 9l-1.5 6M13 9l1.5 6" />
  </Svg>
);

const IcoCongNghe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
  </Svg>
);

const IcoKhtn = (p) => (
  <Svg {...p}>
    <path d="M9 3v6.5L4 18a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 18l-5-8.5V3" />
    <line x1="7" y1="3" x2="17" y2="3" />
    <path d="M7 14h10" />
    <circle cx="10" cy="17" r="0.8" fill="currentColor" />
    <circle cx="14" cy="16.5" r="0.8" fill="currentColor" />
  </Svg>
);

const IcoKhac = (p) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </Svg>
);

const IcoCheck = (p) => (
  <Svg {...p} sw={2.6}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

/* Map icon theo id môn */
const SUBJECT_ICONS = {
  toan: IcoToan,
  ly: IcoLy,
  hoa: IcoHoa,
  sinh: IcoSinh,
  van: IcoVan,
  anh: IcoAnh,
  su: IcoSu,
  dia: IcoDia,
  gdcd: IcoGdcd,
  tin: IcoTin,
  congnghe: IcoCongNghe,
  khtn: IcoKhtn,
  generic: IcoKhac,
};

const getIcon = (id) => SUBJECT_ICONS[id] || IcoKhac;

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function SubjectPicker({
  value = '',
  onChange,
  disabled = false,
  compact = false,
  className = '',
}) {
  const subjectInfo = useMemo(() => getSubject(value), [value]);
  const isCustom = subjectInfo.id === 'generic' && value.trim() !== '';

  const [showCustom, setShowCustom] = useState(isCustom);
  const [customInput, setCustomInput] = useState(isCustom ? value : '');
  const inputRef = useRef(null);

  useEffect(() => {
    const info = getSubject(value);
    const custom = info.id === 'generic' && value.trim() !== '';
    setShowCustom(custom);
    if (custom) setCustomInput(value);
  }, [value]);

  useEffect(() => {
    if (showCustom) inputRef.current?.focus();
  }, [showCustom]);

  const handlePick = (subjectLabel) => {
    if (disabled) return;
    setShowCustom(false);
    setCustomInput('');
    onChange?.(subjectLabel);
  };

  const handleCustomSubmit = () => {
    const name = customInput.trim();
    if (!name) {
      setShowCustom(false);
      return;
    }
    onChange?.(name);
  };

  const handleCustomCancel = () => {
    setShowCustom(false);
    setCustomInput('');
    if (subjectInfo.id === 'generic' && !value.trim()) {
      onChange?.('');
    } else if (!value.trim()) {
      onChange?.('Hóa học');
    }
  };

  return (
    <div className={`sp ${compact ? 'sp-compact' : ''} ${className}`.trim()}>
      {/* Grid chip môn học */}
      <div className="sp-grid" role="radiogroup" aria-label="Chọn môn học">
        {SUBJECTS.map((s) => {
          const Icon = getIcon(s.id);
          const active = subjectInfo.id === s.id && !showCustom;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={'sp-subject-btn' + (active ? ' on' : '')}
              onClick={() => handlePick(s.label)}
              disabled={disabled}
              title={s.label}
            >
              <span className="sp-subject-icon">
                <Icon size={compact ? 18 : 22} />
              </span>
              {!compact && <span className="sp-subject-label">{s.label}</span>}
              {active && (
                <span className="sp-subject-check" aria-hidden="true">
                  <IcoCheck size={12} />
                </span>
              )}
            </button>
          );
        })}

        {/* Nút "Môn khác" */}
        <button
          type="button"
          role="radio"
          aria-checked={showCustom}
          className={'sp-subject-btn sp-subject-custom' + (showCustom ? ' on' : '')}
          onClick={() => {
            if (disabled) return;
            setShowCustom(true);
          }}
          disabled={disabled}
          title="Nhập môn khác"
        >
          <span className="sp-subject-icon">
            <IcoKhac size={compact ? 18 : 22} />
          </span>
          {!compact && <span className="sp-subject-label">Môn khác</span>}
          {showCustom && (
            <span className="sp-subject-check" aria-hidden="true">
              <IcoCheck size={12} />
            </span>
          )}
        </button>
      </div>

      {/* Input môn tự chọn */}
      {showCustom && (
        <div className="sp-custom-box">
          <input
            ref={inputRef}
            type="text"
            className="sp-custom-input"
            placeholder="Nhập tên môn (VD: Giáo dục quốc phòng, Âm nhạc...)"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomSubmit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCustomCancel();
              }
            }}
            disabled={disabled}
            maxLength={40}
            aria-label="Tên môn tự chọn"
          />
          <div className="sp-custom-actions">
            <button
              type="button"
              className="sp-custom-btn"
              onClick={handleCustomCancel}
              disabled={disabled}
            >
              Hủy
            </button>
            <button
              type="button"
              className="sp-custom-btn primary"
              onClick={handleCustomSubmit}
              disabled={disabled || !customInput.trim()}
            >
              <IcoCheck size={12} /> Chọn
            </button>
          </div>
        </div>
      )}

      {/* Hint cho môn không có guide */}
      {subjectInfo.id === 'generic' && !showCustom && value.trim() && (
        <p className="sp-hint">
          Môn "<b>{value}</b>" sẽ được AI tự suy luận theo tên môn và cấp lớp. Nếu có công thức, AI sẽ dùng LaTeX.
        </p>
      )}
    </div>
  );
}

/* Export icon getter để component khác dùng */
export { getIcon as getSubjectIcon, SUBJECT_ICONS };