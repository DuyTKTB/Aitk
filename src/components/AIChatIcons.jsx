/* ============================================================
   AIChatIcons.jsx — bộ icon SVG riêng cho trang AI Chat
   (thay toàn bộ emoji). Nét 1.8px, bo tròn, kế thừa currentColor.
   ============================================================ */

const Svg = ({ size = 18, children, fill = 'none', sw = 1.8, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

/* ---------- Icon thao tác ---------- */
export const IcoMic = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7" />
  </Svg>
);

export const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />
  </Svg>
);

export const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Svg>
);

export const IcoArrowDown = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
);

export const IcoUploadCloud = (p) => (
  <Svg {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.9 9.2 4.4 4.4 0 0 1 17.5 18" />
    <path d="M12 21v-8M8.8 15.8 12 12.6l3.2 3.2" />
  </Svg>
);

export const IcoChevL = (p) => (
  <Svg {...p}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
);

export const IcoChevR = (p) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const IcoPlusSm = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IcoLoader = ({ size = 18, ...rest }) => (
  <svg
    className="ds-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
    {...rest}
  >
    <path d="M12 3a9 9 0 1 0 9 9" opacity=".95" />
    <path d="M12 3a9 9 0 0 1 9 9" opacity=".25" />
  </svg>
);

/* ---------- Icon cho prompt mẫu & gợi ý (thay emoji) ---------- */
const PROMPT_ICONS = {
  /* Giải chi tiết — danh sách từng bước */
  steps: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
    </>
  ),
  /* Giải nhanh — tia chớp */
  bolt: <path d="M13 3 5 13.5h6L10 21l9-11.5h-6.2L13 3Z" />,
  /* Giải thích khái niệm — bóng đèn */
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
    </>
  ),
  /* Tạo bài tương tự — nhân đôi */
  repeat: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  /* Tìm lỗi sai — kính lúp + dấu chấm than */
  bug: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.9-4.9M10.5 7.8v3.4M10.5 13.6v.1" />
    </>
  ),
  /* Tóm tắt lý thuyết — sách */
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6" />
    </>
  ),
  /* Định luật — cân */
  scale: (
    <>
      <path d="M12 4v16M8 20h8M5 7h14" />
      <path d="m5 7-3 7a3.2 3.2 0 0 0 6 0L5 7ZM19 7l-3 7a3.2 3.2 0 0 0 6 0l-3-7Z" />
    </>
  ),
  /* Bảng tuần hoàn — lưới ô */
  table: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
    </>
  ),
  /* Cân bằng PTHH — bình tam giác */
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v6L5 18.2A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-2.8L13.5 9V3" />
      <path d="M7.8 15h8.4" />
    </>
  ),
  /* Dung dịch — giọt nước */
  drop: (
    <>
      <path d="M12 3.2c3.4 4 6 7 6 10.2a6 6 0 0 1-12 0c0-3.2 2.6-6.2 6-10.2Z" />
      <path d="M9.2 14.2a2.9 2.9 0 0 0 2.4 2.4" />
    </>
  ),
  atom: (
    <>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
    </>
  ),
};

export const PromptIcon = ({ name, size = 18 }) => (
  <Svg size={size}>{PROMPT_ICONS[name] || PROMPT_ICONS.atom}</Svg>
);
