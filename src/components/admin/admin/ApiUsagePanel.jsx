import { useEffect, useState } from 'react';
import { getUsage, resetUsage, API_LIMITS } from '../../lib/apiTracker.js';
import {
  IconActivity, IconRefresh, IconCheckCircle, IconWarning, IconAlert, IconBulb,
} from './AdminIcons.jsx';
import { useConfirm, useToast } from './AdminUI.jsx';

const STATUS = {
  ok: { label: 'Ổn', Icon: IconCheckCircle },
  warning: { label: 'Sắp hết', Icon: IconWarning },
  critical: { label: 'Cần thay key', Icon: IconAlert },
};

function safeUsage() {
  try {
    const u = getUsage();
    return u && u.providers ? u : { day: '—', providers: {} };
  } catch (e) {
    console.error('[ApiUsage] đọc bộ đếm lỗi:', e);
    return { day: '—', providers: {} };
  }
}

export default function ApiUsagePanel() {
  const [usage, setUsage] = useState(safeUsage);
  const confirm = useConfirm();
  const toast = useToast();

  useEffect(() => {
    const onUpdate = () => setUsage(safeUsage());
    window.addEventListener('cs-api-update', onUpdate);
    const t = setInterval(onUpdate, 5000);
    return () => {
      window.removeEventListener('cs-api-update', onUpdate);
      clearInterval(t);
    };
  }, []);

  const handleReset = async (provider) => {
    const name = provider ? API_LIMITS?.[provider]?.name || provider : 'tất cả nhà cung cấp';
    const ok = await confirm({
      title: 'Reset bộ đếm',
      message: `Đặt lại số lượt đã dùng của ${name} về 0? Việc này chỉ ảnh hưởng đến số liệu hiển thị, không đổi hạn mức thật của nhà cung cấp.`,
      confirmText: 'Reset',
    });
    if (!ok) return;
    try {
      resetUsage(provider);
      setUsage(safeUsage());
      toast.success('Đã reset bộ đếm');
    } catch (e) {
      toast.error('Không reset được: ' + e.message);
    }
  };

  const entries = Object.entries(usage.providers);

  return (
    <section className="adl-panel">
      <header className="adl-panel-head">
        <h3><IconActivity size={16} /><span>Hạn mức API hôm nay ({usage.day})</span></h3>
        <button type="button" className="adl-btn-sm" onClick={() => handleReset()} disabled={!entries.length}>
          <IconRefresh size={13} /> Reset tất cả
        </button>
      </header>

      {entries.length === 0 ? (
        <p className="adl-empty">Chưa có lượt gọi API nào được ghi nhận trên trình duyệt này.</p>
      ) : (
        <div className="adl-api-grid">
          {entries.map(([key, p]) => (
            <ApiCard key={key} data={p} onReset={() => handleReset(key)} />
          ))}
        </div>
      )}

      <p className="adl-hint">
        <IconBulb size={14} />
        <span>
          Số liệu được đếm trên trình duyệt này; thiết bị khác dùng chung API key sẽ có số liệu riêng.
          Khi gần hết hạn mức, thay key mới trong file <code>.env</code> rồi build lại.
        </span>
      </p>
    </section>
  );
}

function ApiCard({ data, onReset }) {
  const status = STATUS[data.status] ? data.status : 'ok';
  const { label, Icon } = STATUS[status];
  const percent = Math.min(100, Math.max(0, Number(data.percent) || 0));
  const num = (v) => (Number(v) || 0).toLocaleString('vi-VN');

  return (
    <div className={'adl-api-card ' + status}>
      <div className="adl-api-head">
        <div className="adl-api-info">
          <span className="adl-api-dot" style={{ background: data.color || 'var(--mut)' }} />
          <div><b>{data.name}</b><small>{data.model}</small></div>
        </div>
        <span className={'adl-api-status ' + status}><Icon size={13} /> {label}</span>
      </div>

      <div className="adl-api-stats">
        <div><small>Đã dùng</small><b>{num(data.used)}</b></div>
        <div><small>Còn lại</small><b className={status === 'critical' ? 'bad' : ''}>{num(data.remaining)}</b></div>
        <div><small>Tổng / ngày</small><b>{num(data.rpd)}</b></div>
        <div><small>Lỗi</small><b className={data.errors > 0 ? 'bad' : ''}>{num(data.errors)}</b></div>
      </div>

      <div
        className="adl-api-bar"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Đã dùng ${percent.toFixed(0)}% hạn mức ${data.name}`}
      >
        <div className="adl-api-bar-fill" style={{ width: `${percent}%`, background: data.color || 'var(--acc)' }} />
      </div>
      <div className="adl-api-bar-label">
        <span>{percent.toFixed(1)}% hạn mức đã dùng</span>
        <button type="button" className="adl-api-reset" onClick={onReset} title="Reset bộ đếm" aria-label={`Reset ${data.name}`}>
          <IconRefresh size={13} />
        </button>
      </div>

      {status === 'critical' && (
        <div className="adl-api-alert"><IconAlert size={14} /><span><b>Cần thay API key mới.</b> Đã dùng {percent.toFixed(0)}% hạn mức.</span></div>
      )}
      {status === 'warning' && (
        <div className="adl-api-warn"><IconWarning size={14} /><span>Sắp hết hạn mức — chuẩn bị key dự phòng.</span></div>
      )}
    </div>
  );
}
