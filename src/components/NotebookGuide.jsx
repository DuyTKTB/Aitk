import { useState, useEffect } from 'react';
import {
  IcoBookOpen, IcoBookMark, IcoX, IcoCheck, IcoCheckCircle, IcoStar,
  IcoPlay, IcoSearch, IcoFilter, IcoSort, IcoShuffle, IcoCopy,
  IcoDownload, IcoUpload, IcoEye, IcoSparkle, IcoBulb, IcoFire,
  IcoTag, IcoClock, IcoInfo, IcoArrowUp,
} from './NotebookIcons.jsx';

const TOUR_KEY = 'cs-notebook-tour-v1';

export default function NotebookGuide({ forceOpen = false, onClose }) {
  const [open, setOpen] = useState(forceOpen);
  const [step, setStep] = useState(0);

  // Tự động mở lần đầu
  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setStep(0);
      return;
    }
    try {
      const seen = localStorage.getItem(TOUR_KEY);
      if (!seen) {
        setOpen(true);
        setStep(0);
      }
    } catch { /* */ }
  }, [forceOpen]);

  const close = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch { /* */ }
    setOpen(false);
    setStep(0);
    onClose?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const skip = () => close();

  if (!open) return null;

  const Current = STEPS[step];
  const Icon = Current.Icon;

  return (
    <div className="nb-guide-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="nb-guide">
        {/* Header */}
        <header className="nb-guide-head">
          <div className="nb-guide-head-l">
            <span className="nb-guide-badge">
              <IcoSparkle size={14} />
              Hướng dẫn sử dụng
            </span>
            <div className="nb-guide-progress">
              <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
            <span className="nb-guide-counter">
              Bước {step + 1}/{STEPS.length}
            </span>
          </div>
          <button
            type="button"
            className="nb-guide-x"
            onClick={close}
            aria-label="Đóng hướng dẫn"
          >
            <IcoX size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="nb-guide-body">
          <div className="nb-guide-icon" style={{ '--g-color': Current.color }}>
            <Icon size={40} filled={Current.filled} />
          </div>

          <h2 className="nb-guide-title">{Current.title}</h2>
          <p className="nb-guide-desc">{Current.desc}</p>

          {Current.points?.length > 0 && (
            <ul className="nb-guide-points">
              {Current.points.map((p, i) => (
                <li key={i}>
                  <span className="nb-guide-point-ico">
                    <IcoCheck size={12} />
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: p }} />
                </li>
              ))}
            </ul>
          )}

          {Current.tip && (
            <div className="nb-guide-tip">
              <IcoBulb size={16} />
              <span dangerouslySetInnerHTML={{ __html: Current.tip }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="nb-guide-foot">
          <button
            type="button"
            className="nb-guide-skip"
            onClick={skip}
          >
            Bỏ qua
          </button>

          <div className="nb-guide-nav">
            {step > 0 && (
              <button
                type="button"
                className="nb-guide-btn ghost"
                onClick={prev}
              >
                Trước
              </button>
            )}
            <button
              type="button"
              className="nb-guide-btn primary"
              onClick={next}
            >
              {step === STEPS.length - 1 ? (
                <>
                  <IcoCheck size={15} />
                  Bắt đầu sử dụng
                </>
              ) : (
                <>
                  Tiếp theo
                  <IcoArrowUp size={15} style={{ transform: 'rotate(90deg)' }} />
                </>
              )}
            </button>
          </div>
        </footer>

        {/* Dots */}
        <div className="nb-guide-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={'nb-guide-dot' + (i === step ? ' on' : '')}
              onClick={() => setStep(i)}
              aria-label={`Đi tới bước ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NỘI DUNG CÁC BƯỚC
   ============================================================ */
const STEPS = [
  {
    Icon: IcoBookOpen,
    color: '#4d86ff',
    title: 'Sổ tay của tôi là gì?',
    desc: 'Là sổ tay cá nhân giúp bạn lưu lại những câu hỏi cần ôn tập, để học đúng chỗ yếu thay vì học tràn lan.',
    points: [
      'Tự động ghi lại mọi câu bạn <b>làm sai</b> khi thi',
      'Lưu những câu bạn <b>tự tay đánh dấu sao ⭐</b>',
      'Ôn lại theo phương pháp <b>"Ôn câu sai"</b> — hiệu quả gấp 5-10 lần',
    ],
    tip: 'Câu sai là điểm yếu thật sự của bạn. Ôn đúng điểm yếu sẽ giúp bạn tiến bộ nhanh hơn nhiều.',
  },
  {
    Icon: IcoX,
    color: '#ef4444',
    title: 'Tab "Câu sai"',
    desc: 'Mọi câu bạn làm sai trong khi thi/luyện tập đều được tự động lưu vào đây.',
    points: [
      'Badge <b>"Sai X lần"</b> — câu nào sai nhiều, ôn trước',
      'Xem đầy đủ câu hỏi, các đáp án, đáp án đúng <b>đánh dấu ✓</b>',
      'Đọc <b>lời giải chi tiết</b> để hiểu gốc vấn đề',
    ],
    tip: 'Câu nào sai từ 3 lần trở lên → ưu tiên ôn ngay. Đó là lỗ hổng kiến thức lớn nhất của bạn.',
  },
  {
    Icon: IcoStar,
    color: '#fbbf24',
    filled: true,
    title: 'Tab "Đã lưu"',
    desc: 'Câu bạn tự tay đánh dấu ⭐ khi xem đề để xem lại sau.',
    points: [
      'Bấm icon <b>☆/★</b> trên bất kỳ câu hỏi nào để lưu',
      'Lưu cả câu hay, câu khó, câu muốn chia sẻ với bạn bè',
      'Bỏ lưu bằng nút 🗑 ở mỗi câu',
    ],
    tip: 'Dùng tab này để gom câu hỏi của một chuyên đề bạn đang ôn — ví dụ "este hóa 12".',
  },
  {
    Icon: IcoCheckCircle,
    color: '#22c55e',
    title: 'Đánh dấu "Đã hiểu"',
    desc: 'Khi đã nắm chắc một câu → đánh dấu "Đã hiểu" để xóa khỏi sổ.',
    points: [
      'Bấm <b>✓ Đã hiểu</b> ở mỗi câu, hoặc icon ✓ ở header card',
      'Câu sẽ biến mất khỏi tab "Câu sai"',
      'Sổ tay sẽ gọn dần → chỉ còn những câu thật sự khó',
    ],
    tip: 'Chỉ đánh dấu "Đã hiểu" khi bạn CÓ THỂ GIẢI LẠI câu đó không cần xem lời giải.',
  },
  {
    Icon: IcoPlay,
    color: '#8b5cf6',
    title: 'Luyện tập — Quiz mode',
    desc: 'Tự tạo đề quiz random từ chính câu trong sổ tay.',
    points: [
      'Bấm <b>▶ Luyện tập</b> ở header',
      'Hệ thống random câu, bạn chọn đáp án',
      'Chấm điểm tự động, hiện ngay <b>đáp án đúng</b> + lời giải',
      'Cuối bài có <b>điểm số</b> X/Y và làm lại được',
    ],
    tip: 'Làm quiz 3-5 lần liên tục, cho đến khi trả lời đúng hết trong 1 lượt. Đó là lúc bạn thật sự thuộc.',
  },
  {
    Icon: IcoSearch,
    color: '#0891b2',
    title: 'Tìm kiếm & Lọc',
    desc: 'Khi sổ tay nhiều câu, dùng công cụ lọc để tìm nhanh.',
    points: [
      '<b>🔍 Ô tìm kiếm</b> — tìm theo nội dung, lời giải, tên đề',
      '<b>Lọc độ khó</b> — chỉ xem câu dễ/TB/khó/rất khó',
      '<b>Sắp xếp</b> — mới nhất, cũ nhất, sai nhiều, độ khó cao',
      '<b>☑️ Chọn nhiều câu</b> → xử lý hàng loạt (Đã hiểu / Bỏ lưu)',
    ],
    tip: 'Trước kỳ thi, lọc "Độ khó cao" để ôn những câu khó nhất trước.',
  },
  {
    Icon: IcoDownload,
    color: '#f59e0b',
    title: 'Backup & Phục hồi',
    desc: 'Sao lưu sổ tay ra file JSON để không mất khi đổi máy.',
    points: [
      'Bấm <b>💾 Backup</b> → tải file JSON về máy',
      'Bấm <b>📤 Nhập</b> → chọn file JSON đã backup để phục hồi',
      'Dùng để <b>chuyển sổ tay</b> sang máy khác',
    ],
    tip: 'Nên backup mỗi tháng một lần. Đặc biệt trước khi xóa cache trình duyệt.',
  },
  {
    Icon: IcoSparkle,
    color: '#4d86ff',
    title: 'Bắt đầu thôi!',
    desc: 'Bây giờ bạn đã hiểu cách dùng Sổ tay. Cách học hiệu quả nhất:',
    points: [
      '<b>Bước 1:</b> Làm đề thi → câu sai tự động vào sổ',
      '<b>Bước 2:</b> Mở sổ tay → đọc lời giải từng câu',
      '<b>Bước 3:</b> Quiz mode → luyện lại đến khi thuộc',
      '<b>Bước 4:</b> Đánh dấu "Đã hiểu" → xóa khỏi sổ',
      '<b>Bước 5:</b> Lặp lại mỗi ngày — sổ tay càng gọn, bạn càng giỏi',
    ],
    tip: 'Học 30 phút mỗi ngày với Sổ tay hiệu quả hơn 5 giờ học dồn vào cuối tuần.',
  },
];