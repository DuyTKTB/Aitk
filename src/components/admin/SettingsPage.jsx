import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import AdminShell, { Topbar, Modal, ConfirmDialog } from './AdminShell.jsx';
import {
  IconSettings, IconTrash, IconSave, IconRefresh, IconDownload, IconUpload,
  IconDatabase, IconShield, IconWarning, IconInfo, IconCheck,
} from './AdminIcons.jsx';
import { chunk, downloadFile, fetchAllRows, friendlyError } from './adminUtils.js';

/* Bảng được sao lưu. profiles chỉ để lưu trữ — KHÔNG BAO GIỜ bị xóa/ghi đè khi khôi phục. */
const BACKUP_TABLES = ['grades', 'subjects', 'topics', 'exams', 'questions', 'answers', 'profiles'];
const RESTORE_TABLES = ['grades', 'subjects', 'topics', 'exams', 'questions', 'answers'];
const DELETE_ORDER = ['answers', 'questions', 'exams', 'topics'];
const ALL_ROWS = (q) => q.not('id', 'is', null);

const TOGGLES = [
  { key: 'enableAI', label: 'AI Chat (CU AI)', desc: 'Trợ lý AI Hóa học trong web' },
  { key: 'enableChat', label: 'Chat cộng đồng', desc: 'Chat nhóm giữa học sinh' },
  { key: 'enablePet', label: 'Pet Widget', desc: 'Linh vật pha lê ở góc phải' },
  { key: 'enableGames', label: 'Trò chơi', desc: 'GameHub và các game nhỏ' },
  { key: 'enableQuiz', label: 'Ôn tập (Quiz)', desc: 'Trang quiz và SRS' },
  { key: 'maintenanceMode', label: 'Chế độ bảo trì', desc: 'Khóa toàn bộ web, chỉ admin vào được', danger: true },
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  const initial = useMemo(() => ({
    siteName: settings.siteName ?? '',
    siteDesc: settings.siteDesc ?? '',
    enableAI: !!settings.enableAI,
    enableChat: !!settings.enableChat,
    enablePet: !!settings.enablePet,
    enableGames: !!settings.enableGames,
    enableQuiz: !!settings.enableQuiz,
    maintenanceMode: !!settings.maintenanceMode,
  }), [settings]);

  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [busy, setBusy] = useState(null); // 'backup' | 'restore' | 'attempts' | 'exams'
  const [progress, setProgress] = useState('');
  const [restoreMode, setRestoreMode] = useState('merge');
  const fileRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const say = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ============ CẤU HÌNH ============ */
  const handleSave = async () => {
    if (!form.siteName.trim()) return say('Tên website không được để trống.');
    if (form.maintenanceMode && !initial.maintenanceMode) {
      setConfirm({
        title: 'Bật chế độ bảo trì',
        body: 'Toàn bộ học sinh sẽ không vào được web cho đến khi bạn tắt chế độ này.',
        okLabel: 'Bật bảo trì',
        danger: true,
        onOk: () => {
          try {
            updateSettings({ ...form, siteName: form.siteName.trim(), siteDesc: form.siteDesc.trim() });
            say('Đã lưu và áp dụng ngay');
          } catch (e) {
            say('Không lưu được cấu hình: ' + e.message);
          }
        },
      });
      return;
    }
    try {
      updateSettings({ ...form, siteName: form.siteName.trim(), siteDesc: form.siteDesc.trim() });
      say('Đã lưu và áp dụng ngay');
    } catch (e) {
      say('Không lưu được cấu hình: ' + e.message);
    }
  };

  const handleReset = () => {
    setConfirm({
      title: 'Khôi phục mặc định',
      body: 'Đặt lại toàn bộ cài đặt giao diện/tính năng về mặc định và tải lại trang?',
      okLabel: 'Khôi phục',
      onOk: () => { resetSettings(); window.location.reload(); },
    });
  };

  /* ============ SAO LƯU ============ */
  const buildBackup = async () => {
    const tables = {};
    const warnings = [];
    for (const t of BACKUP_TABLES) {
      setProgress(`Đang đọc bảng ${t}…`);
      try {
        // eslint-disable-next-line no-await-in-loop
        tables[t] = await fetchAllRows(() => supabase.from(t).select('*').order('id', { ascending: true }));
      } catch (e) {
        warnings.push(`${t}: ${friendlyError(e)}`);
      }
    }
    const counts = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length]));
    return {
      backup: { meta: { app: 'a7k60dta', version: 2, createdAt: new Date().toISOString(), counts }, tables },
      warnings,
    };
  };

  const handleBackup = async () => {
    setBusy('backup');
    try {
      const { backup, warnings } = await buildBackup();
      if (Object.keys(backup.tables).length === 0) throw new Error('Không đọc được bảng nào. Kiểm tra quyền truy cập Supabase.');
      downloadFile(`backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`, JSON.stringify(backup, null, 2));
      if (warnings.length) say(`Đã tải backup, bỏ qua ${warnings.length} bảng lỗi`);
      else say('Đã tải file sao lưu');
    } catch (e) {
      say('Lỗi sao lưu: ' + friendlyError(e));
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  /* ============ KHÔI PHỤC ============ */
  const readBackupFile = async (file) => {
    if (file.size > 100 * 1024 * 1024) throw new Error('File quá lớn (tối đa 100 MB).');
    let json;
    try {
      json = JSON.parse(await file.text());
    } catch {
      throw new Error('File không phải JSON hợp lệ.');
    }
    const tables = json?.tables && typeof json.tables === 'object' ? json.tables : json;
    const found = RESTORE_TABLES.filter((t) => Array.isArray(tables?.[t]));
    if (found.length === 0) throw new Error('File không chứa dữ liệu hợp lệ (cần các bảng exams, questions, answers…).');
    for (const t of found) {
      if (tables[t].some((r) => r == null || typeof r !== 'object' || r.id == null)) {
        throw new Error(`Bảng "${t}" có dòng thiếu cột id — file bị hỏng hoặc không đúng định dạng.`);
      }
    }
    return { tables, found };
  };

  const handleRestore = async (file) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    let parsed;
    try {
      parsed = await readBackupFile(file);
    } catch (e) {
      return say(e.message);
    }
    const { tables, found } = parsed;
    const summary = found.map((t) => `${t}: ${tables[t].length}`).join(' · ');

    setConfirm({
      title: restoreMode === 'replace' ? 'Khôi phục — THAY THẾ toàn bộ' : 'Khôi phục — Gộp dữ liệu',
      body: restoreMode === 'replace'
        ? `Sẽ XÓA toàn bộ đề, câu hỏi, đáp án hiện có rồi nạp lại từ file (${summary}). Hệ thống tự tải bản sao lưu an toàn trước khi xóa. Tài khoản người dùng không bị đụng tới.`
        : `Sẽ thêm mới và cập nhật theo id từ file (${summary}). Dữ liệu hiện có không bị xóa. Tài khoản người dùng không bị đụng tới.`,
      okLabel: restoreMode === 'replace' ? 'Thay thế dữ liệu' : 'Khôi phục',
      danger: restoreMode === 'replace',
      onOk: () => doRestore(tables, found),
    });
  };

  const doRestore = async (tables, found) => {
    setBusy('restore');
    try {
      if (restoreMode === 'replace') {
        setProgress('Đang tạo bản sao lưu an toàn…');
        const { backup } = await buildBackup();
        downloadFile(`truoc-khi-khoi-phuc-${Date.now()}.json`, JSON.stringify(backup, null, 2));
        for (const t of DELETE_ORDER) {
          if (!found.includes(t)) continue;
          setProgress(`Đang xóa bảng ${t}…`);
          // eslint-disable-next-line no-await-in-loop
          const { error } = await ALL_ROWS(supabase.from(t).delete());
          if (error) throw new Error(`Xóa bảng ${t} thất bại: ${friendlyError(error)}`);
        }
      }
      let written = 0;
      for (const t of RESTORE_TABLES) {
        if (!found.includes(t)) continue;
        for (const part of chunk(tables[t], 500)) {
          setProgress(`Đang ghi ${t} (${written.toLocaleString('vi-VN')} dòng)…`);
          // eslint-disable-next-line no-await-in-loop
          const { error } = await supabase.from(t).upsert(part, { onConflict: 'id' });
          if (error) throw new Error(`Ghi bảng ${t} thất bại: ${friendlyError(error)}`);
          written += part.length;
        }
      }
      say(`Khôi phục xong ${written.toLocaleString('vi-VN')} dòng`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      say(e.message);
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  /* ============ VÙNG NGUY HIỂM ============ */
  const deleteAttempts = () => {
    setConfirm({
      title: 'Xóa tất cả lượt làm bài',
      body: 'Toàn bộ lịch sử làm bài và chi tiết đáp án của học sinh sẽ bị xóa vĩnh viễn.',
      okLabel: 'Xóa lượt làm bài',
      danger: true,
      onOk: async () => {
        setBusy('attempts');
        try {
          const r1 = await ALL_ROWS(supabase.from('user_answers').delete());
          if (r1.error) throw r1.error;
          const r2 = await ALL_ROWS(supabase.from('exam_attempts').delete());
          if (r2.error) throw r2.error;
          await ALL_ROWS(supabase.from('exams').update({ attempt_count: 0 }));
          say('Đã xóa toàn bộ lượt làm bài');
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setBusy(null);
        }
      },
    });
  };

  const deleteExams = () => {
    setConfirm({
      title: 'Xóa tất cả đề thi',
      body: 'Toàn bộ đề, câu hỏi và đáp án sẽ bị xóa vĩnh viễn. Hãy tải bản sao lưu trước.',
      okLabel: 'Xóa tất cả đề',
      danger: true,
      onOk: async () => {
        setBusy('exams');
        try {
          const { error } = await ALL_ROWS(supabase.from('exams').delete());
          if (error) throw error;
          say('Đã xóa toàn bộ đề thi');
          setTimeout(() => window.location.reload(), 1200);
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setBusy(null);
        }
      },
    });
  };

  const working = busy !== null;

  return (
    <AdminShell active="settings" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Cài đặt"
        subtitle="Tên website, bật/tắt tính năng, sao lưu và khôi phục"
      />

      {/* ===== THÔNG TIN WEBSITE ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Thông tin website</h3>
        </header>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label className="vt-field">
            <span>Tên website</span>
            <input
              type="text"
              value={form.siteName}
              onChange={(e) => set('siteName', e.target.value)}
              maxLength={80}
            />
          </label>
          <label className="vt-field">
            <span>Mô tả ngắn</span>
            <input
              type="text"
              value={form.siteDesc}
              onChange={(e) => set('siteDesc', e.target.value)}
              maxLength={200}
            />
          </label>
        </div>
      </div>

      {/* ===== BẬT/TẮT TÍNH NĂNG ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Bật / tắt tính năng</h3>
        </header>

        <div style={{ display: 'grid', gap: '.5rem' }}>
          {TOGGLES.map((t) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              desc={t.desc}
              checked={form[t.key]}
              onChange={(v) => set(t.key, v)}
              danger={t.danger}
            />
          ))}
        </div>

        {form.maintenanceMode && (
          <div
            className="vt-card soft"
            style={{ marginTop: '1rem', borderLeft: '4px solid var(--vt-amber)' }}
          >
            <p className="vt-muted" style={{ margin: 0 }}>
              Chế độ bảo trì đang được bật: học sinh sẽ thấy trang bảo trì thay vì web.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
          <button type="button" className="vt-btn primary" onClick={handleSave} disabled={!dirty}>
            <IconSave size={14} /> Lưu cấu hình
          </button>
          <button type="button" className="vt-btn" onClick={() => setForm(initial)} disabled={!dirty}>
            Hoàn tác thay đổi
          </button>
          <button type="button" className="vt-btn" onClick={handleReset}>
            <IconRefresh size={14} /> Khôi phục mặc định
          </button>
        </div>
        <p className="vt-muted" style={{ marginTop: '.8rem', fontSize: '.8rem' }}>
          <IconInfo size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Cài đặt áp dụng ngay khi bấm Lưu, không cần tải lại trang.
        </p>
      </div>

      {/* ===== SAO LƯU / KHÔI PHỤC ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Sao lưu và khôi phục</h3>
        </header>

        <p className="vt-muted" style={{ marginTop: 0 }}>
          <IconShield size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          File sao lưu gồm lớp, môn, chủ đề, đề thi, câu hỏi, đáp án và hồ sơ người dùng.
          Khi khôi phục, <b>tài khoản người dùng không bao giờ bị xóa hay ghi đè</b>.
        </p>

        <div style={{ display: 'grid', gap: '.6rem', marginTop: '1rem' }}>
          <RestoreModeCard
            active={restoreMode === 'merge'}
            onSelect={() => setRestoreMode('merge')}
            title="Gộp (khuyên dùng)"
            desc="Thêm mới và cập nhật theo id, không xóa gì."
          />
          <RestoreModeCard
            active={restoreMode === 'replace'}
            onSelect={() => setRestoreMode('replace')}
            title="Thay thế"
            desc="Xóa đề/câu hỏi hiện có rồi nạp lại từ file. Tự tải bản an toàn trước."
            danger
          />
        </div>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
          <button type="button" className="vt-btn primary" onClick={handleBackup} disabled={working}>
            {busy === 'backup' ? 'Đang tạo…' : <><IconDownload size={14} /> Tải bản sao lưu</>}
          </button>
          <button type="button" className="vt-btn" onClick={() => fileRef.current?.click()} disabled={working}>
            {busy === 'restore' ? 'Đang khôi phục…' : <><IconUpload size={14} /> Khôi phục từ file</>}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => handleRestore(e.target.files?.[0])} />
        </div>

        {progress && (
          <p className="vt-muted" style={{ marginTop: '.8rem', fontSize: '.82rem' }}>
            <span className="page-loader-spinner" style={{ display: 'inline-block', width: 12, height: 12, marginRight: 6, verticalAlign: '-2px' }} />
            {progress}
          </p>
        )}
      </div>

      {/* ===== VÙNG NGUY HIỂM ===== */}
      <div className="vt-card" style={{ borderLeft: '4px solid var(--vt-red)' }}>
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconWarning size={16} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--vt-red)' }} />
            Vùng nguy hiểm
          </h3>
        </header>
        <p className="vt-muted">
          Các thao tác dưới đây <b>không thể hoàn tác</b>. Hãy tải bản sao lưu trước khi thực hiện.
        </p>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="vt-btn danger" onClick={deleteAttempts} disabled={working}>
            {busy === 'attempts' ? 'Đang xóa…' : <><IconTrash size={14} /> Xóa tất cả lượt làm bài</>}
          </button>
          <button type="button" className="vt-btn danger" onClick={deleteExams} disabled={working}>
            {busy === 'exams' ? 'Đang xóa…' : <><IconTrash size={14} /> Xóa tất cả đề thi</>}
          </button>
        </div>
      </div>

      {/* ===== CONFIRM ===== */}
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
    </AdminShell>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function ToggleRow({ label, desc, checked, onChange, danger }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '.7rem .9rem',
        borderRadius: 14,
        background: checked ? 'color-mix(in srgb, var(--acc) 8%, var(--vt-tint))' : 'var(--vt-tint)',
        border: danger && checked ? '1.5px solid var(--vt-red)' : '1.5px solid transparent',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', font: '700 .95rem var(--sans)', color: 'var(--ink)' }}>
          {label}
        </b>
        <small style={{ color: 'var(--mut)', fontSize: '.8rem' }}>{desc}</small>
      </div>

      <span
        style={{
          position: 'relative',
          width: 44,
          height: 26,
          flexShrink: 0,
          borderRadius: 999,
          background: checked ? (danger ? 'var(--vt-red)' : 'var(--acc)') : 'color-mix(in srgb, var(--ink) 20%, transparent)',
          transition: 'background .2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            transition: 'left .2s',
          }}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', margin: 0 }}
        />
      </span>
    </label>
  );
}

function RestoreModeCard({ active, onSelect, title, desc, danger }) {
  return (
    <label
      onClick={onSelect}
      style={{
        display: 'flex',
        gap: '.8rem',
        alignItems: 'flex-start',
        padding: '.9rem 1rem',
        borderRadius: 14,
        border: active
          ? `2px solid ${danger ? 'var(--vt-red)' : 'var(--acc)'}`
          : '2px solid transparent',
        background: active
          ? `color-mix(in srgb, ${danger ? 'var(--vt-red)' : 'var(--acc)'} 8%, var(--vt-tint))`
          : 'var(--vt-tint)',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      <input
        type="radio"
        checked={active}
        onChange={onSelect}
        style={{ marginTop: 4, accentColor: danger ? 'var(--vt-red)' : 'var(--acc)' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', font: '700 .92rem var(--sans)', color: 'var(--ink)' }}>{title}</b>
        <small style={{ color: 'var(--mut)', fontSize: '.78rem', lineHeight: 1.4 }}>{desc}</small>
      </div>
    </label>
  );
}