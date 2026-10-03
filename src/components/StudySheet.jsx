import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconNote, IconTarget, IconQuiz,
  IconGamepad, IconUser, IconCalc,
  IconBook, IconChart, IconAtom,
  IconClose,
} from './Icons.jsx';

const STUDY_TOOLS = [
  { id: 'table', name: 'Bảng tuần hoàn', Icon: IconAtom },
  { id: 'formulas', name: 'Công thức nhanh', Icon: IconCalc },
  { id: 'analyze', name: 'Phân tích', Icon: IconMicroscope },
  { id: 'balance', name: 'Cân bằng PTHH', Icon: IconScale },
  { id: 'pomodoro', name: 'Pomodoro', Icon: IconTimer },
  { id: 'exam', name: 'Kỳ thi', Icon: IconCalendar },
  { id: 'notes', name: 'Ghi chú', Icon: IconNote },
  { id: 'notebook', name: 'Sổ tay', Icon: IconBook },
  { id: 'grade', name: 'Tính điểm', Icon: IconTarget },
  { id: 'quiz', name: 'Ôn tập', Icon: IconQuiz },
  { id: 'stats', name: 'Thống kê', Icon: IconChart },
  { id: 'games', name: 'Trò chơi', Icon: IconGamepad },
  { id: 'profile', name: 'Trang cá nhân', Icon: IconUser },
];

export default function StudySheet({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="ss-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="ss-sheet" role="dialog" aria-modal="true" aria-label="Công cụ học tập">
        <div className="ss-grabber" aria-hidden="true" />

        <header className="ss-head">
          <h2>Công cụ học tập</h2>
          <button type="button" className="ss-close" onClick={onClose} aria-label="Đóng">
            <IconClose size={18} />
          </button>
        </header>

        <nav className="ss-list">
          {STUDY_TOOLS.map(({ id, name, Icon }) => (
            <a key={id} href={'#' + id} className="ss-item" onClick={onClose}>
              <span className="ss-item-ico"><Icon size={20} /></span>
              <span className="ss-item-name">{name}</span>
            </a>
          ))}
        </nav>
      </div>
    </>,
    document.body
  );
}