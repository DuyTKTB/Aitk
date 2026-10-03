import {
  Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { IconAlert, IconCheckCircle, IconClose, IconInfo, IconRefresh, IconWarning } from './AdminIcons.jsx';

/* ============================================================
   TOAST + CONFIRM — thay thế alert() / confirm() của trình duyệt
   ============================================================ */
const UICtx = createContext(null);

const fallbackUI = {
  toast: {
    success: (m) => console.info(m),
    info: (m) => console.info(m),
    error: (m) => window.alert(m),
  },
  confirm: async ({ message }) => window.confirm(message),
};

export const useUI = () => useContext(UICtx) || fallbackUI;
export const useToast = () => useUI().toast;
export const useConfirm = () => useUI().confirm;

export function AdminUIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type, ms) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), ms));
  }, [dismiss]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const toast = useMemo(() => ({
    success: (m) => push(m, 'success', 2800),
    info: (m) => push(m, 'info', 3500),
    error: (m) => push(m, 'error', 7000),
  }), [push]);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...(typeof opts === 'string' ? { message: opts } : opts), resolve })),
    [],
  );

  const closeDialog = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UICtx.Provider value={value}>
      {children}
      <div className="adl-toasts" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className={'adl-toast-item ' + t.type}>
            <span className="adl-toast-ico">
              {t.type === 'success' ? <IconCheckCircle size={18} /> : t.type === 'error' ? <IconAlert size={18} /> : <IconInfo size={18} />}
            </span>
            <span className="adl-toast-msg">{t.message}</span>
            <button type="button" className="adl-toast-x" onClick={() => dismiss(t.id)} aria-label="Đóng thông báo">
              <IconClose size={14} />
            </button>
          </div>
        ))}
      </div>
      {dialog && <ConfirmDialog dialog={dialog} onClose={closeDialog} />}
    </UICtx.Provider>
  );
}

function ConfirmDialog({ dialog, onClose }) {
  const {
    title = 'Xác nhận', message, confirmText = 'Đồng ý', cancelText = 'Hủy', danger = false, requireText,
  } = dialog;
  const [typed, setTyped] = useState('');
  const ok = !requireText || typed.trim().toUpperCase() === requireText.toUpperCase();
  const okRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    (inputRef.current || okRef.current)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="adl-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className={'adl-confirm' + (danger ? ' danger' : '')} role="alertdialog" aria-modal="true" aria-labelledby="adl-cf-title">
        <div className="adl-confirm-ico">{danger ? <IconWarning size={22} /> : <IconInfo size={22} />}</div>
        <h3 id="adl-cf-title">{title}</h3>
        {message && <p className="adl-confirm-msg">{message}</p>}
        {requireText && (
          <label className="adl-field">
            <span>Gõ <b>{requireText}</b> để xác nhận</span>
            <input ref={inputRef} type="text" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
        )}
        <div className="adl-confirm-actions">
          <button type="button" className="adl-btn-outline" onClick={() => onClose(false)}>{cancelText}</button>
          <button
            ref={okRef}
            type="button"
            className={danger ? 'adl-btn-danger' : 'adl-btn-primary'}
            disabled={!ok}
            onClick={() => onClose(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL
   ============================================================ */
export function Modal({ title, subtitle, onClose, children, wide = false }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="adl-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={boxRef}
        tabIndex={-1}
        className={'adl-modal' + (wide ? ' wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Chi tiết'}
      >
        <header className="adl-modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <button type="button" className="adl-icon-btn" onClick={onClose} aria-label="Đóng">
            <IconClose size={16} />
          </button>
        </header>
        <div className="adl-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   TRẠNG THÁI: loading / rỗng / lỗi
   ============================================================ */
export const Spinner = ({ size = 18 }) => (
  <span className="adl-spinner" style={{ width: size, height: size }} role="status" aria-label="Đang tải" />
);

export function PageLoader({ text = 'Đang tải…' }) {
  return (
    <div className="adl-loading">
      <Spinner size={22} />
      <span>{text}</span>
    </div>
  );
}

export function EmptyState({ Icon, title, children, action }) {
  return (
    <div className="adl-empty-state">
      {Icon && <span className="adl-empty-ico"><Icon size={26} /></span>}
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Không tải được dữ liệu', message, onRetry }) {
  return (
    <div className="adl-error-state" role="alert">
      <span className="adl-empty-ico bad"><IconAlert size={26} /></span>
      <b>{title}</b>
      {message && <p>{message}</p>}
      {onRetry && (
        <button type="button" className="adl-btn-outline" onClick={onRetry}>
          <IconRefresh size={14} /> Thử lại
        </button>
      )}
    </div>
  );
}

export const InlineAlert = ({ type = 'error', children }) => (
  <div className={'adl-alert ' + type} role={type === 'error' ? 'alert' : 'status'}>
    <span className="adl-alert-ico">
      {type === 'success' ? <IconCheckCircle size={16} /> : type === 'warn' ? <IconWarning size={16} /> : type === 'info' ? <IconInfo size={16} /> : <IconAlert size={16} />}
    </span>
    <div>{children}</div>
  </div>
);

/* ============================================================
   ERROR BOUNDARY — một màn hình lỗi không làm sập cả trang quản trị
   ============================================================ */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Admin] Lỗi giao diện:', error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="Màn hình này gặp lỗi"
          message={this.state.error.message || 'Lỗi không xác định'}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

/* ============================================================
   HOOKS
   ============================================================ */
export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* Cảnh báo khi đóng tab với dữ liệu chưa lưu */
export function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}
