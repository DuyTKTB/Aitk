import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import {
  IconSettings, IconTrash, IconSave, IconRefresh, IconDownload, IconUpload, IconDatabase,
  IconShield, IconWarning, IconInfo,
} from './AdminIcons.jsx';
import { InlineAlert, Spinner, useConfirm, useToast } from './AdminUI.jsx';
import { chunk, downloadFile, fetchAllRows, friendlyError } from './adminUtils.js';

/* Bảng được sao lưu. profiles chỉ để lưu trữ — KHÔNG BAO GIỜ bị xóa/ghi đè khi khôi phục. */
const BACKUP_TABLES = ['grades', 'subjects', 'topics', 'exams', 'questions', 'answers', 'profiles'];
/* Thứ tự khôi phục (cha → con) và thứ tự xóa (con → cha) */
const RESTORE_TABLES = ['grades', 'subjects', 'topics', 'exams', 'questions', 'answers'];
const DELETE_ORDER = ['answers', 'questions', 'exams', 'topics'];
const ALL_ROWS = (q) => q.not('id', 'is', null); // hoạt động với cả id uuid lẫn số

const TOGGLES = [
  { key: 'enableAI', label: 'AI Chat (CU AI)', desc: 'Trợ lý AI Hóa học trong web' },
  { key: 'enableChat', label: 'Chat cộng đồng', desc: 'Chat nhóm giữa học sinh' },
  { key: 'enablePet', label: 'Pet Widget', desc: 'Linh vật pha lê ở góc phải' },
  { key: 'enableGames', label: 'Trò chơi', desc: 'GameHub và các game nhỏ' },
  { key: 'enableQuiz', label: 'Ôn tập (Quiz)', desc: 'Trang quiz và SRS' },
  { key: 'maintenanceMode', label: 'Chế độ bảo trì', desc: 'Khóa toàn bộ web, chỉ admin vào được' },
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const toast = useToast();
  const confirm = useConfirm();

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

  /* ============ CẤU HÌNH ============ */
  const handleSave = async () => {
    if (!form.siteName.trim()) return toast.error('Tên website không được để trống.');
    if (form.maintenanceMode && !initial.maintenanceMode) {
      const ok = await confirm({
        title: 'Bật chế độ bảo trì',
        message: 'Toàn bộ học sinh sẽ không vào được web cho đến khi bạn tắt chế độ này.',
        confirmText: 'Bật bảo trì',
        danger: true,
      });
      if (!ok) return;
    }
    try {
      updateSettings({ ...form, siteName: form.siteName.trim(), siteDesc: form.siteDesc.trim() });
      toast.success('Đã lưu và áp dụng ngay');
    } catch (e) {
      toast.error('Không lưu được cấu hình: ' + e.message);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Khôi phục mặc định',
      message: 'Đặt lại toàn bộ cài đặt giao diện/tính năng về mặc định và tải lại trang?',
      confirmText: 'Khôi phục',
    });
    if (!ok) return;
    resetSettings();
    window.location.reload();
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
      if (warnings.length) toast.info(`Đã tải backup, nhưng bỏ qua ${warnings.length} bảng lỗi: ${warnings[0]}`);
      else toast.success('Đã tải file sao lưu');
    } catch (e) {
      toast.error('Lỗi sao lưu: ' + friendlyError(e));
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
    const tables = json?.tables && typeof json.tables === 'object' ? json.tables : json; // hỗ trợ định dạng cũ
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
      return toast.error(e.message);
    }
    const { tables, found } = parsed;
    const summary = found.map((t) => `${t}: ${tables[t].length}`).join(' · ');

    const ok = await confirm({
      title: restoreMode === 'replace' ? 'Khôi phục — THAY THẾ toàn bộ' : 'Khôi phục — Gộp dữ liệu',
      message: restoreMode === 'replace'
        ? `Sẽ XÓA toàn bộ đề, câu hỏi, đáp án hiện có rồi nạp lại từ file (${summary}). Hệ thống tự tải bản sao lưu an toàn trước khi xóa. Tài khoản người dùng không bị đụng tới.`
        : `Sẽ thêm mới và cập nhật theo id từ file (${summary}). Dữ liệu hiện có không bị xóa. Tài khoản người dùng không bị đụng tới.`,
      confirmText: restoreMode === 'replace' ? 'Thay thế dữ liệu' : 'Khôi phục',
      danger: restoreMode === 'replace',
      requireText: restoreMode === 'replace' ? 'KHOI PHUC' : undefined,
    });
    if (!ok) return;

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
      toast.success(`Khôi phục xong ${written.toLocaleString('vi-VN')} dòng`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      toast.error(e.message + (restoreMode === 'replace' ? ' — hãy nạp lại file sao lưu an toàn vừa được tải về.' : ''));
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  /* ============ VÙNG NGUY HIỂM ============ */
  const deleteAttempts = async () => {
    const ok = await confirm({
      title: 'Xóa tất cả lượt làm bài',
      message: 'Toàn bộ lịch sử làm bài và chi tiết đáp án của học sinh sẽ bị xóa vĩnh viễn.',
      confirmText: 'Xóa lượt làm bài',
      danger: true,
      requireText: 'XOA',
    });
    if (!ok) return;
    setBusy('attempts');
    try {
      const r1 = await ALL_ROWS(supabase.from('user_answers').delete());
      if (r1.error) throw r1.error;
      const r2 = await ALL_ROWS(supabase.from('exam_attempts').delete());
      if (r2.error) throw r2.error;
      const r3 = await ALL_ROWS(supabase.from('exams').update({ attempt_count: 0 }));
      if (r3.error) console.warn('Không reset được attempt_count:', r3.error.message);
      toast.success('Đã xóa toàn bộ lượt làm bài');
    } catch (e) {
      toast.error('Không xóa được: ' + friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const deleteExams = async () => {
    const ok = await confirm({
      title: 'Xóa tất cả đề thi',
      message: 'Toàn bộ đề, câu hỏi và đáp án sẽ bị xóa vĩnh viễn. Hãy tải bản sao lưu trước.',
      confirmText: 'Xóa tất cả đề',
      danger: true,
      requireText: 'XOA TAT CA',
    });
    if (!ok) return;
    setBusy('exams');
    try {
      const { error } = await ALL_ROWS(supabase.from('exams').delete());
      if (error) throw error;
      toast.success('Đã xóa toàn bộ đề thi');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast.error('Không xóa được: ' + friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const working = busy !== null;

  return (
    <div className="adl-settings">
      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconSettings size={16} /><span>Thông tin website</span></h3>
        </header>
        <div className="adl-form">
          <label className="adl-field">
            <span>Tên website</span>
            <input type="text" value={form.siteName} onChange={(e) => set('siteName', e.target.value)} maxLength={80} />
          </label>
          <label className="adl-field">
            <span>Mô tả ngắn</span>
            <input type="text" value={form.siteDesc} onChange={(e) => set('siteDesc', e.target.value)} maxLength={200} />
          </label>
        </div>
      </section>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconSettings size={16} /><span>Bật / tắt tính năng</span></h3>
        </header>

        <div className="adl-toggles">
          {TOGGLES.map((t) => (
            <Toggle key={t.key} label={t.label} desc={t.desc} checked={form[t.key]} onChange={(v) => set(t.key, v)} danger={t.key === 'maintenanceMode'} />
          ))}
        </div>

        {form.maintenanceMode && (
          <InlineAlert type="warn">Chế độ bảo trì đang được bật: học sinh sẽ thấy trang bảo trì thay vì web.</InlineAlert>
        )}

        <div className="adl-form-actions">
          <button type="button" className="adl-btn-primary" onClick={handleSave} disabled={!dirty}><IconSave size={14} /> Lưu cấu hình</button>
          <button type="button" className="adl-btn-outline" onClick={() => setForm(initial)} disabled={!dirty}>Hoàn tác thay đổi</button>
          <button type="button" className="adl-btn-outline" onClick={handleReset}><IconRefresh size={14} /> Khôi phục mặc định</button>
        </div>
        <p className="adl-hint"><IconInfo size={14} /><span>Cài đặt áp dụng ngay khi bấm Lưu, không cần tải lại trang.</span></p>
      </section>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconDatabase size={16} /><span>Sao lưu và khôi phục</span></h3>
        </header>

        <p className="adl-hint">
          <IconShield size={14} />
          <span>
            File sao lưu gồm lớp, môn, chủ đề, đề thi, câu hỏi, đáp án và hồ sơ người dùng. Khi khôi phục,
            <b> tài khoản người dùng không bao giờ bị xóa hay ghi đè</b>.
          </span>
        </p>

        <div className="adl-restore-mode" role="radiogroup" aria-label="Cách khôi phục">
          <label className={restoreMode === 'merge' ? 'on' : ''}>
            <input type="radio" name="restore-mode" checked={restoreMode === 'merge'} onChange={() => setRestoreMode('merge')} />
            <div><b>Gộp (khuyên dùng)</b><small>Thêm mới và cập nhật theo id, không xóa gì.</small></div>
          </label>
          <label className={restoreMode === 'replace' ? 'on danger' : ''}>
            <input type="radio" name="restore-mode" checked={restoreMode === 'replace'} onChange={() => setRestoreMode('replace')} />
            <div><b>Thay thế</b><small>Xóa đề/câu hỏi hiện có rồi nạp lại từ file. Tự tải bản an toàn trước.</small></div>
          </label>
        </div>

        <div className="adl-form-actions">
          <button type="button" className="adl-btn-primary" onClick={handleBackup} disabled={working}>
            {busy === 'backup' ? <Spinner size={14} /> : <IconDownload size={14} />} Tải bản sao lưu
          </button>
          <button type="button" className="adl-btn-outline" onClick={() => fileRef.current?.click()} disabled={working}>
            {busy === 'restore' ? <Spinner size={14} /> : <IconUpload size={14} />} Khôi phục từ file
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => handleRestore(e.target.files?.[0])} />
        </div>
        {progress && <p className="adl-progress" role="status"><Spinner size={13} /> {progress}</p>}
      </section>

      <section className="adl-panel adl-danger">
        <header className="adl-panel-head">
          <h3><IconWarning size={16} /><span>Vùng nguy hiểm</span></h3>
        </header>
        <p className="adl-hint"><IconWarning size={14} /><span>Các thao tác dưới đây <b>không thể hoàn tác</b>. Hãy tải bản sao lưu trước khi thực hiện.</span></p>
        <div className="adl-form-actions">
          <button type="button" className="adl-btn-danger" onClick={deleteAttempts} disabled={working}>
            {busy === 'attempts' ? <Spinner size={14} /> : <IconTrash size={14} />} Xóa tất cả lượt làm bài
          </button>
          <button type="button" className="adl-btn-danger" onClick={deleteExams} disabled={working}>
            {busy === 'exams' ? <Spinner size={14} /> : <IconTrash size={14} />} Xóa tất cả đề thi
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, danger }) {
  return (
    <label className={'adl-toggle' + (danger ? ' danger' : '')}>
      <div><b>{label}</b><small>{desc}</small></div>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adl-toggle-slider" aria-hidden="true" />
    </label>
  );
}
