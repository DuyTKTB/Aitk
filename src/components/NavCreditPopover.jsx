/* ============================================================
   NavCreditPopover.jsx — POPOVER QUẢN LÝ ELEC CREDIT VIP (MASCOT + COBALT)
   ------------------------------------------------------------
   Chuẩn minh bạch 1 VNĐ = 1 Credit:
     • Hero Cobalt sang trọng + Linh vật ELEC theo trạng thái số dư
     • Bố cục thoáng 376px — tuyệt đối không rớt dòng hay chèn chữ
     • Tab 1: Bảng giá trừ chi tiết từng tính năng AI (Zero Surprise)
     • Tab 2: Lịch sử giao dịch & hoàn tiền thời gian thực
     • Đồng bộ đóng mở với các dropdown khác qua 'elec-close-nav-dropdowns'
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import {
  CREDIT_TARIFF_LIST,
  formatCredits,
  getTransactionHistory,
} from '../lib/creditService.js';
import '../styles/nav-credit-popover.css';

function formatTxTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mi} · ${dd}/${mm}`;
  } catch {
    return '';
  }
}

const SvgZap = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M13.3 2.3 4.9 13.2h6.3l-1 8.5L19.1 10.8h-6.3l.5-8.5Z"
      fill="currentColor"
    />
    <path
      d="M13 4.8 7.8 11.8h4.1l-.4 4.5 5-5.5h-3.9l.4-6Z"
      fill="#38bdf8"
      opacity="0.55"
    />
  </svg>
);

const SvgShieldCheck = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const SvgTag = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const SvgClock = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SvgPlus = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function NavCreditPopover({ userId, credits = 0 }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('tariff'); // 'tariff' | 'history'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const wrapRef = useRef(null);

  // Đóng khi các dropdown khác trên navbar mở
  useEffect(() => {
    const onCloseOthers = (e) => {
      if (e?.detail?.except !== 'credit') setOpen(false);
    };
    window.addEventListener('elec-close-nav-dropdowns', onCloseOthers);
    return () => window.removeEventListener('elec-close-nav-dropdowns', onCloseOthers);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'history' || !userId) return;
    let alive = true;
    setLoadingHistory(true);
    getTransactionHistory(userId, 15)
      .then((rows) => {
        if (alive) setHistory(Array.isArray(rows) ? rows : []);
      })
      .finally(() => {
        if (alive) setLoadingHistory(false);
      });
    return () => { alive = false; };
  }, [open, tab, userId, credits]);

  const bal = Math.max(0, Number(credits) || 0);
  const compactLabel = bal >= 1_000_000
    ? `${(bal / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    : bal >= 10_000
      ? `${(bal / 1_000).toFixed(bal % 1000 === 0 ? 0 : 1)}k`
      : formatCredits(bal);

  const tone = bal < 100 ? 'empty' : bal < 500 ? 'low' : 'ok';

  const mascotMeta = tone === 'empty'
    ? { src: '/img/elec/elec-plead.png', label: 'Hết credit' }
    : tone === 'low'
      ? { src: '/img/elec/elec-think.png', label: 'Sắp hết' }
      : { src: '/img/elec/elec-happy.png', label: 'Sẵn sàng' };

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        try {
          window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns', { detail: { except: 'credit' } }));
        } catch { /* ignore */ }
      }
      return next;
    });
  };

  const openTopUp = () => {
    setOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('elec-open-credit-topup'));
    } catch { /* ignore */ }
  };

  return (
    <div className="elec-cp-wrap" ref={wrapRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`nav-credit-pill elec-cp-trigger tone-${tone} ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`Số dư: ${formatCredits(bal)} ELEC Credit (1 Credit = 1 đ) — Bấm xem bảng giá & lịch sử`}
      >
        <SvgZap size={13} className="anim-ico-svg anim-ico-zap" />
        <span>{compactLabel}</span>
      </button>

      {open && (
        <div className="elec-cp-popover" role="dialog" aria-label="Thông tin ELEC Credit">
          {/* HERO COBALT + LINH VẬT ELEC */}
          <div className="elec-cp-hero">
            <div className="elec-cp-hero-main">
              <div className="elec-cp-mascot-ring">
                <img
                  src={mascotMeta.src}
                  alt="Linh vật ELEC AI"
                  className="elec-cp-mascot"
                  width="56"
                  height="56"
                />
              </div>

              <div className="elec-cp-hero-info">
                <div className="elec-cp-kicker-row">
                  <span className="elec-cp-kicker">ELEC CREDIT · 1 CREDIT = 1 Đ</span>
                  <span className={`elec-cp-status tone-${tone}`}>
                    <i className="elec-cp-dot" aria-hidden="true" />
                    {mascotMeta.label}
                  </span>
                </div>

                <div className="elec-cp-balance-row">
                  <strong className="elec-cp-balance-num">{formatCredits(bal)}</strong>
                  <span className="elec-cp-unit">Credit</span>
                </div>
              </div>
            </div>

            <div className="elec-cp-promise-bar">
              <SvgShieldCheck size={13} />
              <span>Trừ đúng giá hiển thị · Tự động hoàn 100% nếu AI lỗi</span>
            </div>
          </div>

          {/* BODY */}
          <div className="elec-cp-body">
            <div className="elec-cp-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'tariff'}
                className={tab === 'tariff' ? 'is-active' : ''}
                onClick={() => setTab('tariff')}
              >
                <SvgTag size={13} />
                <span>Bảng giá AI</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'history'}
                className={tab === 'history' ? 'is-active' : ''}
                onClick={() => setTab('history')}
              >
                <SvgClock size={13} />
                <span>Lịch sử dùng</span>
              </button>
            </div>

            {tab === 'tariff' ? (
              <ul className="elec-cp-list">
                {CREDIT_TARIFF_LIST.map((item) => (
                  <li key={item.id} className="elec-cp-row">
                    <div className="elec-cp-row-left">
                      <span className="elec-cp-row-title">{item.label}</span>
                      <span className="elec-cp-tag">{item.tag}</span>
                    </div>
                    <span className="elec-cp-cost-pill">
                      {item.id === 'exam_gen'
                        ? item.unit
                        : `${item.prefix || ''}${formatCredits(item.cost)}`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="elec-cp-history">
                {loadingHistory ? (
                  <div className="elec-cp-empty-state">
                    <img src="/img/elec/elec-think.png" alt="" width="44" height="44" />
                    <p>Đang tải lịch sử giao dịch...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="elec-cp-empty-state">
                    <img src="/img/elec/elec-hello.png" alt="" width="48" height="48" />
                    <p>Chưa có giao dịch Credit nào gần đây.</p>
                  </div>
                ) : (
                  <ul className="elec-cp-list">
                    {history.map((tx, idx) => {
                      const amt = Number(tx.amount) || 0;
                      const isPlus = amt > 0;
                      return (
                        <li key={tx.id || idx} className="elec-cp-row">
                          <div className="elec-cp-row-left">
                            <span className="elec-cp-row-title">{tx.description || tx.type || 'Giao dịch AI'}</span>
                            <small className="elec-cp-row-time">{formatTxTime(tx.created_at)}</small>
                          </div>
                          <span className={`elec-cp-cost-pill ${isPlus ? 'is-plus' : 'is-minus'}`}>
                            {isPlus ? '+' : '−'}{formatCredits(Math.abs(amt))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="elec-cp-foot">
              <button type="button" className="elec-cp-cta" onClick={openTopUp}>
                <SvgPlus size={14} />
                <span>Mua thêm ELEC Credit (VietQR tự động)</span>
              </button>
              <div className="elec-pop-copy">© 2026 ELEC Science AI · Nguyễn Thế Duy (Duy TK)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
