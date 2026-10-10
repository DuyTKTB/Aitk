import { cloneElement, createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import './ui.css';

const cx = (...a) => a.filter(Boolean).join(' ');

/* Button — truyền href để render <a> */
export function Button({ variant, size, icon, href, className, children, ...rest }) {
  const cls = cx('ui-btn', variant, size, icon && 'icon', className);
  return href
    ? <a className={cls} href={href} {...rest}>{children}</a>
    : <button type="button" className={cls} {...rest}>{children}</button>;
}

export function Card({ as: Tag = 'section', tight, flat, className, children, ...rest }) {
  return <Tag className={cx('ui-card', tight && 'tight', flat && 'flat', className)} {...rest}>{children}</Tag>;
}
export function CardHead({ title, action }) {
  return <div className="ui-card-head"><h2>{title}</h2>{action}</div>;
}

export const Badge = ({ tone, children }) => <span className={cx('ui-badge', tone)}>{children}</span>;
export const Skeleton = ({ w = '100%', h = 16, style }) => <span className="ui-skel" style={{ width: w, height: h, ...style }} aria-hidden="true" />;

export function EmptyState({ title, text, action }) {
  return <div className="ui-empty"><h3>{title}</h3>{text && <p>{text}</p>}{action}</div>;
}

/* Field — bọc input/textarea/select, nối label + gợi ý + lỗi qua aria */
export function Field({ label, hint, error, children }) {
  const id = useId();
  const child = cloneElement(children, { id, 'aria-invalid': !!error || undefined, 'aria-describedby': (hint || error) ? id + '-d' : undefined });
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      {child}
      {(error || hint) && <small id={id + '-d'} className={error ? 'err' : ''} role={error ? 'alert' : undefined}>{error || hint}</small>}
    </div>
  );
}

/* Segmented — radiogroup */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="ui-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" className="ui-switch" aria-checked={!!checked} aria-label={label} onClick={() => onChange(!checked)} />;
}

/* Dialog — <dialog> gốc: tự có focus trap, Esc, backdrop */
export function Dialog({ open, title, text, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="ui-dialog" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      <div className="ui-dialog-actions">{children}</div>
    </dialog>
  );
}

/* Toast — bọc <ToastProvider> quanh App; gọi useToast()('Đã lưu') */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, text, action: opts.action }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), opts.action ? 12000 : 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="ui-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="ui-toast">
            <span>{t.text}</span>
            {t.action && <button type="button" onClick={t.action.onClick}>{t.action.label}</button>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
