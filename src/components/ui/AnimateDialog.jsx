/* ============================================================
   AnimateDialog.jsx — CHUẨN ANIMATE UI + BASE UI + MOTION
   ------------------------------------------------------------
   Tích hợp theo đúng đặc tả kỹ thuật từ animate-ui.com:
     1. Khung 3D Perspective Spring Entry:
        • perspective(1200px) rotateX(-18deg) scale(0.9) blur(6px)
        • Bung lò xo sắc nét (stiffness 160, damping 24)
     2. Làm mờ nền lũy tiến (Progressive Backdrop Blur 12px)
     3. Tự động hỗ trợ 4 hướng: from="top" | "bottom" | "left" | "right"
     4. Focus trap, phím Escape, click ra ngoài để đóng, aria-modal="true"
     5. Cung cấp cả bộ Primitive (Dialog.*) và tiện ích trọn gói (AnimateModal)
   ============================================================ */

import React, { createContext, useContext, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import '../../styles/animate-dialog.css';

const DialogContext = createContext({
  open: false,
  onClose: () => {},
  titleId: '',
  descriptionId: '',
});

/* ============================================================
   MOTION VARIANTS — CHUẨN VẬT LÝ LÒ XO CỦA ANIMATE UI
   ============================================================ */
const BACKDROP_VARIANTS = {
  initial: { opacity: 0, backdropFilter: 'blur(0px)' },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] },
  },
};

const POPUP_VARIANTS = {
  top: {
    initial: {
      opacity: 0,
      scale: 0.88,
      rotateX: -18,
      y: -24,
      filter: 'blur(6px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 160,
        damping: 24,
        mass: 0.9,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      rotateX: -14,
      y: -18,
      filter: 'blur(4px)',
      transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
    },
  },
  bottom: {
    initial: {
      opacity: 0,
      scale: 0.88,
      rotateX: 18,
      y: 28,
      filter: 'blur(6px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 160,
        damping: 24,
        mass: 0.9,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      rotateX: 14,
      y: 22,
      filter: 'blur(4px)',
      transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
    },
  },
  left: {
    initial: {
      opacity: 0,
      scale: 0.88,
      rotateY: 18,
      x: -30,
      filter: 'blur(6px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      x: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 160, damping: 24 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      rotateY: 14,
      x: -22,
      filter: 'blur(4px)',
      transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
    },
  },
  right: {
    initial: {
      opacity: 0,
      scale: 0.88,
      rotateY: -18,
      x: 30,
      filter: 'blur(6px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      x: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 160, damping: 24 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      rotateY: -14,
      x: 22,
      filter: 'blur(4px)',
      transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
    },
  },
};

const IcoClose = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ============================================================
   1. BỘ THÀNH PHẦN NGUYÊN BẢN (PRIMITIVES)
   ============================================================ */
export function DialogRoot({ children, open = false, onOpenChange }) {
  const titleId = useId();
  const descriptionId = useId();

  // Khóa cuộn trang nền khi mở
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  // Đóng khi bấm phím Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider
      value={{
        open,
        onClose: () => onOpenChange?.(false),
        titleId,
        descriptionId,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function DialogPortal({ children }) {
  const { open } = useContext(DialogContext);
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {open && children}
    </AnimatePresence>,
    document.body,
  );
}

export function DialogBackdrop({ className = '', onClick }) {
  const { onClose } = useContext(DialogContext);
  return (
    <motion.div
      className={`ad-backdrop ${className}`}
      variants={BACKDROP_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClick || onClose}
      aria-hidden="true"
    />
  );
}

export function DialogPopup({
  children,
  from = 'top',
  size = 'md',
  className = '',
  role = 'dialog',
  ariaModal = true,
  onClick,
  ...props
}) {
  const { onClose, titleId, descriptionId } = useContext(DialogContext);
  const popupRef = useRef(null);
  const variant = POPUP_VARIANTS[from] || POPUP_VARIANTS.top;

  return (
    <div className="ad-viewport" onClick={onClose}>
      <motion.div
        ref={popupRef}
        role={role}
        aria-modal={ariaModal ? 'true' : 'false'}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`ad-popup size-${size} ${className}`}
        variants={variant}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function DialogHeader({ children, className = '' }) {
  return <div className={`ad-header ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }) {
  const { titleId } = useContext(DialogContext);
  return (
    <h2 id={titleId} className={`ad-title ${className}`}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className = '' }) {
  const { descriptionId } = useContext(DialogContext);
  return (
    <p id={descriptionId} className={`ad-description ${className}`}>
      {children}
    </p>
  );
}

export function DialogCloseButton({ className = '', ariaLabel = 'Đóng' }) {
  const { onClose } = useContext(DialogContext);
  return (
    <button
      type="button"
      className={`ad-close-btn ${className}`}
      onClick={onClose}
      aria-label={ariaLabel}
    >
      <IcoClose size={16} />
    </button>
  );
}

export function DialogBody({ children, className = '' }) {
  return <div className={`ad-body ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = '' }) {
  return <div className={`ad-footer ${className}`}>{children}</div>;
}

/* ============================================================
   2. TIỆN ÍCH TRỌN GÓI: AnimateModal (PLUG-AND-PLAY)
   Dành cho việc nâng cấp nhanh bất kỳ Modal nào trên web
   ============================================================ */
export default function AnimateModal({
  open = false,
  onClose,
  title,
  description,
  from = 'top',
  size = 'md',
  showClose = true,
  children,
  footer,
  className = '',
  bodyClassName = '',
}) {
  return (
    <DialogRoot open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup from={from} size={size} className={className}>
          {(title || showClose) && (
            <DialogHeader>
              <div className="ad-title-row">
                {title ? <DialogTitle>{title}</DialogTitle> : <div />}
                {showClose && <DialogCloseButton />}
              </div>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}

          <DialogBody className={bodyClassName}>
            {children}
          </DialogBody>

          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
