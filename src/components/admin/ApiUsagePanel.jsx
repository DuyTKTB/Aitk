/* ============================================================
   ApiUsagePanel.jsx — Hạn mức API (Vitality)
   ============================================================ */
import { useEffect, useState, useRef, useCallback } from 'react';
import { getUsage, resetUsage, API_LIMITS } from '../../lib/apiTracker.js';
import { ConfirmDialog } from './AdminShell.jsx';
import {
  IconActivity, IconRefresh, IconCheckCircle, IconWarning, IconAlert, IconBulb,
} from './AdminIcons.jsx';

const STATUS = {
  ok: { label: 'Ổn', color: '#16a34a' },
  warning: { label: 'Sắp hết', color: '#f59e0b' },
  critical: { label: 'Cần thay key', color: '#ef4444' },
};

function safeUsage() {
  try {
    const u = getUsage();
    return u && u.providers ? u : { day: '—', providers: {} };
  } catch {
    return { day: '—', providers: {} };
  }
}

export default function ApiUsagePanel() {
  const [usage, setUsage] = useState(safeUsage);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const onUpdate = () => setUsage(safeUsage());
    window.addEventListener('cs-api-update', onUpdate);
    const t = setInterval(onUpdate, 5000);
    return () => {
      window.removeEventListener('cs-api-update', onUpdate);
      clearInterval(t);
    };
  }, []);

  const handleReset = (provider) => {
    const name = provider ? API_LIMITS?.[provider]?.name || provider : 'tất cả nhà cung cấp';
    setConfirm({
      title: 'Reset bộ đếm',
      body: `Đặt lại số lượt đã dùng của ${name} về 0? Việc này chỉ ảnh hưởng đến số liệu hiển thị, không đổi hạn mức thật của nhà cung cấp.`,
      okLabel: 'Reset',
      onOk: () => {
        try {
          resetUsage(provider);
          setUsage(safeUsage());
          say('Đã reset bộ đếm');
        } catch (e) {
          say('Không reset được: ' + e.message);
        }
      },
    });
  };

  const entries = Object.entries(usage.providers);

  return (
    <>
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconActivity size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Hạn mức API hôm nay ({usage.day})
          </h3>
          <button type="button" className="vt-btn sm" onClick={() => handleReset()} disabled={!entries.length}>
            <IconRefresh size={13} /> Reset tất cả
          </button>
        </header>

        {entries.length === 0 ? (
          <div className="vt-calm">
            <IconBulb size={22} />
            <p>Chưa có lượt gọi API nào được ghi nhận trên trình duyệt này.</p>
          </div>
        ) : (
          <div className="vt-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {entries.map(([key, p]) => (
              <ApiCard key={key} data={p} onReset={() => handleReset(key)} />
            ))}
          </div>
        )}

        <p className="vt-muted" style={{ marginTop: '1rem', fontSize: '.78rem' }}>
          <IconBulb size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Số liệu được đếm trên trình duyệt này; thiết bị khác dùng chung API key sẽ có số liệu riêng.
          Khi gần hết hạn mức, thay key mới trong file <code>.env</code> rồi build lại.
        </p>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        okLabel={confirm?.okLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const fn = confirm?.onOk;
          setConfirm(null);
          fn?.();
        }}
      />

      {toast && <div className="vt-toast" role="status">{toast}</div>}
    </>
  );
}

function ApiCard({ data, onReset }) {
  const statusKey = STATUS[data.status] ? data.status : 'ok';
  const status = STATUS[statusKey];
  const percent = Math.min(100, Math.max(0, Number(data.percent) || 0));
  const num = (v) => (Number(v) || 0).toLocaleString('vi-VN');

  return (
    <div
      className="vt-card"
      style={{
        background: 'var(--vt-tint)',
        boxShadow: 'none',
        borderLeft: `4px solid ${status.color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.7rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: data.color || 'var(--mut)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ font: '700 .9rem var(--sans)', display: 'block' }}>{data.name}</b>
          <small style={{ color: 'var(--mut)', fontSize: '.7rem' }}>{data.model}</small>
        </div>
        <span className="vt-chip" style={{
          background: `color-mix(in srgb, ${status.color} 15%, transparent)`,
          color: status.color,
          fontSize: '.65rem',
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.4rem', marginBottom: '.7rem' }}>
        <div>
          <small style={{ color: 'var(--mut)', fontSize: '.65rem', display: 'block' }}>Đã dùng</small>
          <b style={{ font: '700 .95rem var(--mono)' }}>{num(data.used)}</b>
        </div>
        <div>
          <small style={{ color: 'var(--mut)', fontSize: '.65rem', display: 'block' }}>Còn</small>
          <b style={{ font: '700 .95rem var(--mono)', color: statusKey === 'critical' ? status.color : undefined }}>{num(data.remaining)}</b>
        </div>
        <div>
          <small style={{ color: 'var(--mut)', fontSize: '.65rem', display: 'block' }}>Tổng/ngày</small>
          <b style={{ font: '700 .95rem var(--mono)' }}>{num(data.rpd)}</b>
        </div>
        <div>
          <small style={{ color: 'var(--mut)', fontSize: '.65rem', display: 'block' }}>Lỗi</small>
          <b style={{ font: '700 .95rem var(--mono)', color: data.errors > 0 ? '#ef4444' : undefined }}>{num(data.errors)}</b>
        </div>
      </div>

      <div className="vt-bar" style={{ marginBottom: '.4rem' }}>
        <i style={{ width: `${percent}%`, background: data.color || 'var(--acc)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--mut)' }}>
        <span>{percent.toFixed(1)}% hạn mức đã dùng</span>
        <button type="button" className="vt-icon-btn" onClick={onReset} title="Reset bộ đếm" style={{ width: 26, height: 26 }}>
          <IconRefresh size={12} />
        </button>
      </div>

      {statusKey === 'critical' && (
        <p style={{
          margin: '.7rem 0 0',
          padding: '.5rem .7rem',
          background: `color-mix(in srgb, ${status.color} 12%, transparent)`,
          borderRadius: 10,
          fontSize: '.78rem',
          color: status.color,
        }}>
          <IconAlert size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          <b>Cần thay API key mới.</b> Đã dùng {percent.toFixed(0)}% hạn mức.
        </p>
      )}
      {statusKey === 'warning' && (
        <p style={{
          margin: '.7rem 0 0',
          padding: '.5rem .7rem',
          background: `color-mix(in srgb, ${status.color} 12%, transparent)`,
          borderRadius: 10,
          fontSize: '.78rem',
          color: '#a16207',
        }}>
          <IconWarning size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Sắp hết hạn mức — chuẩn bị key dự phòng.
        </p>
      )}
    </div>
  );
}