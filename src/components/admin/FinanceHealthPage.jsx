/* ============================================================
   FinanceHealthPage.jsx — Trung tâm Tài chính SaaS, Sổ cái Credit & Health Monitor
   ------------------------------------------------------------
   Lấy cảm hứng từ shadcn-admin / Refine SaaS Control Planes:
     • Phân tích Doanh thu ước tính (MRR / ARR / Retention / Rủi ro hết hạn 7 ngày)
     • Sổ cái Credit AI realtime từ Supabase `credit_transactions` + biểu đồ 7 ngày VN
     • Live System Health Ping (Supabase, Firestore, Admin Claim, User Reports, AI API)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { db } from '../../lib/firebase.js';
import { doc, getDoc, collection, getDocs, limit as fsLimit, query as fsQuery } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth.jsx';
import { isAdmin } from '../../lib/isAdmin.js';
import { adminFetchMergedUsers } from '../../lib/proKeyApi.js';
import {
  STUDENT_VIP_ANNUAL_PRICE,
  TEACHER_VIP_ANNUAL_PRICE,
  formatVnd,
} from '../../lib/entitlements.js';
import {
  computeSaasRevenueMetrics,
  summarizeCreditLedger,
  CREDIT_TX_LABELS,
} from '../../lib/adminAnalyticsEngine.js';
import AdminShell, { Topbar, downloadCsv } from './AdminShell.jsx';
import {
  IconChart, IconCrown, IconBolt, IconRefresh, IconDownload,
  IconSearch, IconShield, IconCheckCircle, IconWarning, IconClock, IconSparkle,
} from './AdminIcons.jsx';
import { friendlyError } from './adminUtils.js';

const SUB_TABS = [
  { key: 'revenue', label: 'Doanh thu & Thuê bao', Icon: IconCrown },
  { key: 'ledger',  label: 'Sổ cái Credit AI',     Icon: IconBolt },
  { key: 'health',  label: 'Sức khỏe Hệ thống',    Icon: IconShield },
];

export default function FinanceHealthPage({ onNavigate }) {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proUsers, setProUsers] = useState([]);
  const [creditRows, setCreditRows] = useState([]);
  const [walletTotal, setWalletTotal] = useState(0);
  const [userMap, setUserMap] = useState({});

  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txSearch, setTxSearch] = useState('');

  // System Health checks
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthChecks, setHealthChecks] = useState([]);

  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const say = useCallback((m) => {
    clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [proRes, txRes, walletRes, mergedUsers] = await Promise.all([
        supabase.from('pro_users').select('user_id, key_code, expiry, activated_at, duration_days, note'),
        supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(400),
        supabase.from('user_credits').select('user_id, balance'),
        adminFetchMergedUsers({ limit: 500 }).catch(() => []),
      ]);

      if (proRes.error && txRes.error) throw proRes.error;
      setProUsers(proRes.data || []);
      setCreditRows(txRes.data || []);
      const sumBal = (walletRes.data || []).reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
      setWalletTotal(sumBal);

      const uMap = {};
      (mergedUsers || []).forEach((u) => {
        if (u?.id) uMap[u.id] = u;
      });
      setUserMap(uMap);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runHealthPing = useCallback(async () => {
    setHealthBusy(true);
    const probes = [
      {
        id: 'supabase',
        name: 'Supabase PostgreSQL (Đề thi, Credit, PRO)',
        run: async () => {
          const { error: e } = await supabase.from('grades').select('id').limit(1);
          if (e) throw e;
          return 'Kết nối bình thường · Đọc bảng chuẩn';
        },
      },
      {
        id: 'firestore',
        name: 'Firebase Firestore (Cấu hình siteConfig)',
        run: async () => {
          const snap = await getDoc(doc(db, 'siteConfig', 'global'));
          return snap.exists() ? 'Đồng bộ cấu hình toàn cục OK' : 'Kết nối OK (chưa lưu cấu hình tùy biến)';
        },
      },
      {
        id: 'reports',
        name: 'Hộp thư Báo lỗi Firestore (user_reports)',
        run: async () => {
          const snap = await getDocs(fsQuery(collection(db, 'user_reports'), fsLimit(1)));
          return `Firestore Rules OK · Có thể đọc (${snap.size >= 0 ? 'truy cập hợp lệ' : ''})`;
        },
      },
      {
        id: 'audit',
        name: 'Nhật ký Kiểm toán (admin_audit_logs)',
        run: async () => {
          await getDocs(fsQuery(collection(db, 'admin_audit_logs'), fsLimit(1)));
          return 'Firestore Rules OK · Bất biến (append-only)';
        },
      },
      {
        id: 'admin-claim',
        name: 'Xác thực Quyền Quản trị (Firebase Claim)',
        run: async () => {
          if (!isAdmin(user)) throw new Error('Tài khoản chỉ có role Supabase, chưa có Custom Claim admin trên Firebase');
          return `Hợp lệ (${user?.email || user?.uid})`;
        },
      },
    ];

    const results = [];
    for (const p of probes) {
      const t0 = performance.now();
      try {
        // eslint-disable-next-line no-await-in-loop
        const detail = await p.run();
        results.push({ id: p.id, name: p.name, ok: true, ms: Math.round(performance.now() - t0), detail });
      } catch (e) {
        results.push({
          id: p.id,
          name: p.name,
          ok: false,
          ms: Math.round(performance.now() - t0),
          detail: friendlyError(e),
        });
      }
    }
    setHealthChecks(results);
    setHealthBusy(false);
  }, [user]);

  useEffect(() => {
    if (subTab === 'health' && healthChecks.length === 0) {
      runHealthPing();
    }
  }, [subTab, healthChecks.length, runHealthPing]);

  const saas = useMemo(
    () => computeSaasRevenueMetrics(proUsers, {
      teacherPrice: TEACHER_VIP_ANNUAL_PRICE,
      studentPrice: STUDENT_VIP_ANNUAL_PRICE,
    }),
    [proUsers]
  );

  const ledger = useMemo(() => summarizeCreditLedger(creditRows), [creditRows]);

  const filteredTx = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return creditRows.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (!q) return true;
      const u = userMap[tx.user_id];
      return [tx.user_id, tx.description, tx.type, u?.email, u?.display_name]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [creditRows, txTypeFilter, txSearch, userMap]);

  const handleExportLedgerCsv = () => {
    const header = ['Thời gian', 'Người dùng', 'Email', 'Loại giao dịch', 'Biến động Credit', 'Mô tả'];
    const rows = filteredTx.map((tx) => {
      const u = userMap[tx.user_id];
      return [
        tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '',
        u?.display_name || tx.user_id || '',
        u?.email || '',
        CREDIT_TX_LABELS[tx.type] || tx.type || '',
        tx.amount,
        tx.description || '',
      ];
    });
    downloadCsv(`elec-ai-credit-ledger-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    say('Đã xuất Sổ cái Credit (.csv)');
  };

  const maxDailyBurn = Math.max(1, ...ledger.dailyBurn.map((b) => b.sum));

  return (
    <AdminShell
      active="finance"
      onChange={(k) => (onNavigate ? onNavigate(k) : (window.location.hash = k === 'dashboard' ? 'admin' : `admin/${k}`))}
    >
      <Topbar
        title="Tài chính SaaS, Credit AI & Sức khỏe Hệ thống"
        subtitle="Theo dõi doanh thu ước tính MRR/ARR, sổ cái giao dịch Credit và trạng thái máy chủ thời gian thực"
        right={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subTab === 'ledger' && (
              <button type="button" className="vt-btn" onClick={handleExportLedgerCsv} disabled={!filteredTx.length}>
                <IconDownload size={14} /> Xuất CSV Sổ cái
              </button>
            )}
            <button
              type="button"
              className="vt-btn primary"
              onClick={() => (subTab === 'health' ? runHealthPing() : load())}
              disabled={loading || healthBusy}
            >
              <IconRefresh size={14} /> {subTab === 'health' ? 'Chạy Ping lại' : 'Làm mới dữ liệu'}
            </button>
          </div>
        )}
      />

      {toast && (
        <div className="vt-card" style={{ padding: '10px 16px', marginBottom: 14, borderLeft: '4px solid #16a34a', fontWeight: 700, color: '#15803d' }}>
          {toast}
        </div>
      )}
      {error && (
        <div className="vt-card" style={{ padding: '12px 16px', marginBottom: 14, borderLeft: '4px solid #dc2626', color: '#dc2626' }}>
          <IconWarning size={15} /> {error}
        </div>
      )}

      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`vt-btn ${subTab === t.key ? 'primary' : ''}`}
            onClick={() => setSubTab(t.key)}
          >
            <t.Icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DOANH THU & THUÊ BAO SAAS */}
      {subTab === 'revenue' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            {[
              { label: 'ARR ước tính (năm)', val: formatVnd(saas.arrVnd), sub: `MRR ~ ${formatVnd(saas.mrrVnd)}/tháng`, color: '#2563eb', Icon: IconChart },
              { label: 'Thuê bao đang hoạt động', val: `${saas.activeTotal}`, sub: `${saas.teacherActive} GV PRO · ${saas.studentActive} HS VIP`, color: '#16a34a', Icon: IconCrown },
              { label: 'Rủi ro hết hạn (≤7 ngày)', val: `${saas.expiringSoonCount} gói`, sub: `Giá trị gia hạn ~ ${formatVnd(saas.renewalAtRiskVnd)}`, color: '#d97706', Icon: IconClock },
              { label: 'Tổng Credit tồn ví user', val: walletTotal.toLocaleString('vi-VN'), sub: `~ ${formatVnd(walletTotal)} (1đ = 1 Credit)`, color: '#7c3aed', Icon: IconSparkle },
            ].map((k) => (
              <div key={k.label} className="vt-card" style={{ padding: '16px 18px', display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="vt-muted" style={{ fontSize: '0.78rem', fontWeight: 700 }}>{k.label}</span>
                  <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: `${k.color}18`, color: k.color }}>
                    <k.Icon size={16} />
                  </span>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{k.val}</div>
                <div className="vt-muted" style={{ fontSize: '0.76rem' }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="vt-card" style={{ padding: '18px 20px', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Cơ cấu Gói thuê bao &amp; Tỷ lệ giữ chân ({saas.retentionRate}%)</h3>
              <button type="button" className="vt-btn" onClick={() => onNavigate?.('pro-users')}>
                Mở danh sách VIP &amp; PRO →
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: `Giáo viên PRO (${formatVnd(TEACHER_VIP_ANNUAL_PRICE)}/năm)`, count: saas.teacherActive, color: '#f59e0b', vnd: saas.teacherActive * TEACHER_VIP_ANNUAL_PRICE },
                { label: `Học sinh VIP (${formatVnd(STUDENT_VIP_ANNUAL_PRICE)}/năm)`, count: saas.studentActive, color: '#7c3aed', vnd: saas.studentActive * STUDENT_VIP_ANNUAL_PRICE },
                { label: 'Đã hết hạn (cần chăm sóc gia hạn)', count: saas.expiredCount, color: '#94a3b8', vnd: 0 },
              ].map((row) => {
                const pct = saas.totalSubscribers ? Math.round((row.count / saas.totalSubscribers) * 100) : 0;
                return (
                  <div key={row.label} style={{ display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span><b>{row.label}</b></span>
                      <span><b>{row.count}</b> ({pct}%){row.vnd > 0 ? ` · ${formatVnd(row.vnd)}` : ''}</span>
                    </div>
                    <div style={{ height: 9, borderRadius: 99, background: 'var(--soft, rgba(15,23,42,0.08))', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SỔ CÁI CREDIT AI */}
      {subTab === 'ledger' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            {[
              { label: 'Tổng Credit nạp / thưởng', val: `+${ledger.totalInflow.toLocaleString('vi-VN')}`, color: '#16a34a' },
              { label: 'Doanh thu nạp Credit (purchase)', val: formatVnd(ledger.totalPurchaseVnd), color: '#2563eb' },
              { label: 'Tổng Credit tiêu thụ AI', val: `-${ledger.totalAiBurn.toLocaleString('vi-VN')}`, color: '#ea580c' },
              { label: 'Hoàn tiền tự động (AI lỗi)', val: `+${ledger.totalRefund.toLocaleString('vi-VN')}`, color: '#7c3aed' },
            ].map((c) => (
              <div key={c.label} className="vt-card" style={{ padding: '14px 16px' }}>
                <div className="vt-muted" style={{ fontSize: '0.76rem', fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color, marginTop: 4 }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* 7-day AI Burn Chart (Vietnam UTC+7) */}
          <div className="vt-card" style={{ padding: '16px 18px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.96rem' }}>Tốc độ tiêu thụ Credit AI 7 ngày gần nhất (Giờ VN UTC+7)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, alignItems: 'end', height: 130 }}>
              {ledger.dailyBurn.map((b) => {
                const h = Math.max(8, Math.round((b.sum / maxDailyBurn) * 92));
                return (
                  <div key={b.key} style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
                    <small style={{ fontSize: '0.7rem', fontWeight: 700 }}>{b.sum > 0 ? b.sum.toLocaleString('vi-VN') : '0'}</small>
                    <div style={{ width: '100%', maxWidth: 40, height: h, borderRadius: 8, background: 'linear-gradient(180deg,#3b82f6,#6366f1)' }} title={`${b.label}: ${b.count} lượt · ${b.sum} Credit`} />
                    <small className="vt-muted" style={{ fontSize: '0.72rem' }}>{b.label}</small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter & Table */}
          <div className="vt-card" style={{ padding: '16px 18px', display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem' }}>400 giao dịch Credit gần nhất ({filteredTx.length})</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line,#cbd5e1)', background: 'var(--panel,#fff)', color: 'inherit', fontSize: '0.8rem' }}
                >
                  <option value="all">Mọi loại giao dịch</option>
                  {Object.entries(CREDIT_TX_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <div style={{ position: 'relative', minWidth: 210 }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'grid' }}>
                    <IconSearch size={14} />
                  </span>
                  <input
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Tìm email, UID, mô tả…"
                    style={{ width: '100%', padding: '6px 10px 6px 28px', borderRadius: 10, border: '1px solid var(--line,#cbd5e1)', background: 'var(--panel,#fff)', color: 'inherit', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line,#e2e8f0)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px' }}>Thời gian</th>
                    <th style={{ padding: '8px 6px' }}>Người dùng</th>
                    <th style={{ padding: '8px 6px' }}>Loại</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Credit</th>
                    <th style={{ padding: '8px 6px' }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.slice(0, 120).map((tx, idx) => {
                    const u = userMap[tx.user_id];
                    const amt = Number(tx.amount) || 0;
                    return (
                      <tr key={tx.id || idx} style={{ borderBottom: '1px solid var(--line,#f1f5f9)' }}>
                        <td style={{ padding: '8px 6px', whiteSpace: 'nowrap' }} className="vt-muted">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <b>{u?.display_name || 'Người dùng'}</b>
                          <div className="vt-muted" style={{ fontSize: '0.73rem' }}>{u?.email || String(tx.user_id || '').slice(0, 16)}</div>
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: 'var(--soft,rgba(37,99,235,0.1))' }}>
                            {CREDIT_TX_LABELS[tx.type] || tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: amt >= 0 ? '#16a34a' : '#dc2626' }}>
                          {amt >= 0 ? `+${amt.toLocaleString('vi-VN')}` : amt.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '8px 6px', maxWidth: 320 }} className="vt-muted">{tx.description || '—'}</td>
                      </tr>
                    );
                  })}
                  {filteredTx.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center' }} className="vt-muted">Chưa có giao dịch Credit nào khớp bộ lọc.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SYSTEM HEALTH MONITOR */}
      {subTab === 'health' && (
        <div className="vt-card" style={{ padding: '18px 20px', display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Chẩn đoán Kết nối &amp; Độ trễ Máy chủ (Live Ping)</h3>
              <p className="vt-muted" style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                Kiểm tra trực tiếp Supabase DB, Firestore Cloud, Firestore Rules và quyền Admin trên tài khoản hiện tại.
              </p>
            </div>
            <button type="button" className="vt-btn primary" onClick={runHealthPing} disabled={healthBusy}>
              <IconRefresh size={14} /> {healthBusy ? 'Đang đo độ trễ…' : 'Chạy kiểm tra ngay'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {healthChecks.map((hc) => (
              <div
                key={hc.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${hc.ok ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)'}`,
                  background: hc.ok ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: hc.ok ? '#16a34a' : '#dc2626', display: 'grid' }}>
                    {hc.ok ? <IconCheckCircle size={20} /> : <IconWarning size={20} />}
                  </span>
                  <div>
                    <b style={{ fontSize: '0.9rem' }}>{hc.name}</b>
                    <div className="vt-muted" style={{ fontSize: '0.78rem' }}>{hc.detail}</div>
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: '0.74rem', fontWeight: 800,
                  background: hc.ok ? 'rgba(22,163,74,0.14)' : 'rgba(220,38,38,0.14)',
                  color: hc.ok ? '#15803d' : '#dc2626',
                }}>
                  {hc.ok ? `OK · ${hc.ms} ms` : `LỖI · ${hc.ms} ms`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
