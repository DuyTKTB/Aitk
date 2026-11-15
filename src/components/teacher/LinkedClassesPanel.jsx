/* ============================================================
   LinkedClassesPanel.jsx — Không gian giảng dạy lớp bộ môn (GVBM)
   ------------------------------------------------------------
   Điểm hợp nhất duy nhất cho giáo viên bộ môn:
     • Hiển thị 4 chỉ số tổng quan + lọc theo môn / tìm kiếm (lớp, GVCN, mã lớp)
     • Trạng thái chưa liên kết → Launchpad 3 bước hướng dẫn rõ ràng
     • Mỗi lớp gồm đủ thao tác: Giao đề, Đề đã giao, Xuất Excel TT22, Gỡ liên kết
     • Mở rộng từng lớp để Giám sát LIVE, Sửa, Quản lý, Kết quả & Xoá đề (có Hoàn tác)
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listMyLinkedClasses,
  unlinkTeacher,
  examStatus,
  studentCountOf,
  toMs,
} from '../../lib/classTeachers.js';
import {
  getClassById,
  getExamsByClass,
  getSubmissionsByExam,
  deleteExam,
  createExam,
} from '../../lib/classroom.js';
import { createExamSession, getSessionByExam } from '../../lib/examSession.js';
import { Modal } from '../DashShell.jsx';
import ExamEditModal from './ExamEditModal.jsx';
import ExamManagePanel from '../ExamManagePanel.jsx';
import {
  classifyExamGradeColumn,
  computeStudentPeriodGrades,
  exportStyledWorkbook,
} from '../../lib/excelExport.js';
import '../../styles/subject-teachers.css';

const fmtDate = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
};

const fmtDateTime = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const pct = (sub) => {
  const total = Number(sub?.totalPoints) || 0;
  const score = Number(sub?.score);
  if (!total || !Number.isFinite(score)) return null;
  return Math.round((score / total) * 100);
};

const classBadgeOf = (name) => {
  const s = String(name || '').trim();
  if (!s) return 'BM';
  if (/^\d{1,2}[A-Za-z0-9]{1,3}$/.test(s)) return s.toUpperCase();
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.slice(0, 3).map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase())).join('').slice(0, 4);
  }
  return s.slice(0, 3).toUpperCase();
};

const STATUS_TONE = { open: 'good', soon: 'mid', closed: 'na', off: 'bad', live: 'ex' };

export default function LinkedClassesPanel({
  user,
  onAssign,
  onMonitor,
  onSay,
  onFocusKeyInput,
  onLinkedChange,
  reloadToken = 0,
  initialItems = null,
}) {
  const [items, setItems] = useState(() => (Array.isArray(initialItems) ? initialItems : []));
  const [loading, setLoading] = useState(() => initialItems === null);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [openClass, setOpenClass] = useState('');
  const [detail, setDetail] = useState({}); // classId → { loading, subs, sessions }
  const [resultsOf, setResultsOf] = useState(''); // examId đang xem kết quả
  const [confirmId, setConfirmId] = useState(''); // examId chờ xác nhận mở phòng
  const [busy, setBusy] = useState('');
  const [exportingClassId, setExportingClassId] = useState('');
  const [editCtx, setEditCtx] = useState(null);
  const [manageCtx, setManageCtx] = useState(null);
  const [confirmRemoveCtx, setConfirmRemoveCtx] = useState(null);
  const [confirmUnlinkItem, setConfirmUnlinkItem] = useState(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);

  const fetchClassDetail = async (item) => {
    const subs = {};
    const sessions = {};
    await Promise.all((item.mine || []).map(async (ex) => {
      try { subs[ex.id] = await getSubmissionsByExam(ex.id); } catch { subs[ex.id] = []; }
      try { sessions[ex.id] = await getSessionByExam(ex.id); } catch { sessions[ex.id] = null; }
    }));
    return { loading: false, subs, sessions };
  };

  const exportLinkedClassXlsx = async (item) => {
    setExportingClassId(item.classId);
    try {
      let data = detail[item.classId];
      if (!data || data.loading) {
        data = await fetchClassDetail(item);
        setDetail((d) => ({ ...d, [item.classId]: data }));
      }
      const clsName = item.cls?.name || item.className || item.classId;
      const subsByExam = data?.subs || {};
      const members = Array.isArray(item.cls?.members) ? [...item.cls.members] : [];
      const seenIds = new Set(members.map((m) => m.id || m.uid));
      (item.mine || []).forEach((ex) => {
        (subsByExam[ex.id] || []).forEach((s) => {
          const sid = s.studentId || s.uid;
          if (sid && !seenIds.has(sid)) {
            seenIds.add(sid);
            members.push({ id: sid, name: s.studentName || 'Học sinh', email: s.studentEmail || '' });
          }
        });
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      await exportStyledWorkbook({
        filename: `bang-diem-GVBM-${clsName.replace(/\s+/g, '-')}-${dateStr}.xlsx`,
        mascot: 'cool',
        sheets: [
          {
            name: 'Bảng điểm Bộ môn',
            mascot: 'cool',
            title: `BẢNG ĐIỂM GIÁO VIÊN BỘ MÔN — ${clsName.toUpperCase()}`,
            subtitle: `Môn ${item.subject || 'Chuyên môn'} · GVBM: ${user?.displayName || user?.email || ''} · Hệ số TX(1) · ĐGK(2) · CKK(3)`,
            meta: [
              { label: 'Lớp giảng dạy', value: clsName },
              { label: 'GV Chủ nhiệm', value: item.cls?.teacherName || '—' },
              { label: 'Số đề đã giao', value: `${(item.mine || []).length} đề` },
            ],
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 7 },
              { header: 'Họ và tên học sinh', key: 'name', align: 'left', width: 26 },
              { header: 'Email', key: 'email', align: 'left', width: 28 },
              { header: 'TX (HS1)', key: 'tx', align: 'center', numFmt: '0.0', isScore10: true, width: 13 },
              { header: 'ĐGK (HS2)', key: 'dgk', align: 'center', numFmt: '0.0', isScore10: true, width: 13 },
              { header: 'CKK (HS3)', key: 'ckk', align: 'center', numFmt: '0.0', isScore10: true, width: 13 },
              { header: 'Điểm TB', key: 'tb', align: 'center', numFmt: '0.0', isScore10: true, width: 13 },
              { header: 'Đánh giá', key: 'status', align: 'center', isScoreBand: true, width: 16 },
              { header: 'Số bài nộp', key: 'subCount', align: 'center', width: 12 },
            ],
            rows: members.map((m, idx) => {
              const sid = m.id || m.uid;
              const grades = computeStudentPeriodGrades({ id: sid, name: m.name }, item.mine || [], subsByExam);
              return {
                stt: idx + 1,
                name: m.name || 'Học sinh',
                email: m.email || '',
                tx: grades.tx,
                dgk: grades.dgk,
                ckk: grades.ckk,
                tb: grades.tb,
                status: grades.status,
                subCount: grades.subCount,
              };
            }),
          },
          {
            name: 'Đề đã giao',
            mascot: 'happy',
            title: `DANH SÁCH ĐỀ KIỂM TRA ĐÃ GIAO — ${clsName.toUpperCase()}`,
            subtitle: `Tổng hợp ${(item.mine || []).length} đề do giáo viên bộ môn phát hành`,
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 7 },
              { header: 'Tên đề kiểm tra', key: 'title', align: 'left', width: 34 },
              { header: 'Cột điểm', key: 'bucket', align: 'center', width: 12 },
              { header: 'Thời gian (phút)', key: 'duration', align: 'center', width: 16 },
              { header: 'Số bài nộp', key: 'subCount', align: 'center', width: 13 },
              { header: 'Điểm TB (10)', key: 'avg10', align: 'center', numFmt: '0.0', isScore10: true, width: 14 },
            ],
            rows: (item.mine || []).map((ex, idx) => {
              const subs = subsByExam[ex.id] || [];
              const avg = subs.length
                ? Math.round((subs.reduce((a, s) => a + ((Number(s.score) || 0) / Math.max(1, Number(s.totalPoints) || 10)) * 10, 0) / subs.length) * 10) / 10
                : null;
              return {
                stt: idx + 1,
                title: ex.title || 'Đề kiểm tra',
                bucket: classifyExamGradeColumn(ex).toUpperCase(),
                duration: Number(ex.duration) || 45,
                subCount: subs.length,
                avg10: avg,
              };
            }),
          },
        ],
      });
      onSay?.(`Đã xuất bảng điểm Excel lớp ${clsName}`, 'success');
    } catch (e) {
      onSay?.(`Không xuất được Excel: ${e?.message || e}`, 'error');
    } finally {
      setExportingClassId('');
    }
  };

  const exportLinkedExamXlsx = async (item, ex, subs = []) => {
    try {
      const clsName = item.cls?.name || item.className || item.classId;
      const safeTitle = (ex.title || 'de-thi').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 32);
      const sorted = [...subs].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
      await exportStyledWorkbook({
        filename: `ket-qua-${safeTitle}-${clsName.replace(/\s+/g, '-')}.xlsx`,
        mascot: 'happy',
        sheets: [
          {
            name: 'Kết quả bài thi',
            mascot: 'happy',
            title: `KẾT QUẢ ĐỀ: ${(ex.title || 'ĐỀ KIỂM TRA').toUpperCase()}`,
            subtitle: `Lớp ${clsName} · Cột điểm ${classifyExamGradeColumn(ex).toUpperCase()} · ${sorted.length} bài nộp`,
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 7 },
              { header: 'Họ và tên học sinh', key: 'name', align: 'left', width: 26 },
              { header: 'Điểm (Thang 10)', key: 'score10', align: 'center', numFmt: '0.0', isScore10: true, width: 15 },
              { header: 'Đúng / Tổng câu', key: 'ratio', align: 'center', width: 15 },
              { header: 'Hình thức nộp', key: 'mode', align: 'center', width: 16 },
              { header: 'Thời điểm nộp', key: 'submitted', align: 'center', width: 20 },
            ],
            rows: sorted.map((s, idx) => {
              const tot = Math.max(1, Number(s.totalPoints) || 10);
              const sc10 = Math.round(((Number(s.score) || 0) / tot) * 100) / 10;
              return {
                stt: idx + 1,
                name: s.studentName || 'Học sinh',
                score10: sc10,
                ratio: s.totalQuestions ? `${s.correctCount || 0}/${s.totalQuestions}` : `${s.score || 0}/${tot}`,
                mode: (s.isPaperOmr || s.source === 'paper-omr') ? 'Phiếu A4 OMR' : 'Thi trực tuyến',
                submitted: fmtDateTime(toMs(s.submittedAt)),
              };
            }),
          },
        ],
      });
      onSay?.(`Đã xuất Excel đề "${ex.title}"`, 'success');
    } catch (e) {
      onSay?.(`Không xuất được Excel đề: ${e?.message || e}`, 'error');
    }
  };

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setErr('');
    try {
      const links = await listMyLinkedClasses(user.uid);
      const built = await Promise.all(links.map(async (l) => {
        try {
          const [cls, exs] = await Promise.all([
            getClassById(l.classId),
            getExamsByClass(l.classId),
          ]);
          const mine = (exs || []).filter((e) => e.teacherId === user.uid);
          return { ...l, cls, mine, classError: '' };
        } catch (e) {
          return {
            ...l,
            cls: null,
            mine: [],
            classError: e?.code === 'permission-denied'
              ? 'Không đọc được dữ liệu lớp (kiểm tra firestore rules đã deploy).'
              : (e?.message || 'Không tải được lớp.'),
          };
        }
      }));
      setItems(built);
    } catch (e) {
      setErr(
        e?.code === 'permission-denied'
          ? 'Chưa có quyền đọc danh sách liên kết. Cần deploy firestore.rules (phần class_teachers) trước khi dùng.'
          : (e?.message || 'Không tải được danh sách lớp đã liên kết.'),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (initialItems === null || reloadToken > 0) {
      load();
    }
  }, [initialItems, reloadToken, load]);

  const openClassDetail = async (item) => {
    if (openClass === item.classId) {
      setOpenClass('');
      return;
    }
    setOpenClass(item.classId);
    setResultsOf('');
    setConfirmId('');
    if (detail[item.classId]) return;

    setDetail((d) => ({ ...d, [item.classId]: { loading: true, subs: {}, sessions: {} } }));
    const data = await fetchClassDetail(item);
    setDetail((d) => ({ ...d, [item.classId]: data }));
  };

  const removeExam = (item, exam) => {
    setConfirmRemoveCtx({ item, exam });
  };

  const executeRemoveExam = async () => {
    if (!confirmRemoveCtx) return;
    const { item, exam } = confirmRemoveCtx;
    setConfirmRemoveCtx(null);
    const snapshot = { ...exam };
    setBusy(exam.id);
    try {
      await deleteExam(exam.id);
      await load();
      setDetail((d) => {
        const next = { ...d };
        delete next[item.classId];
        return next;
      });
      onSay?.(`Đã xoá đề “${exam.title || 'Đề'}”`, 'success', {
        undoLabel: 'Hoàn tác',
        onUndo: async () => {
          try {
            const { id: _id, ...rest } = snapshot;
            await createExam(rest);
            await load();
            onSay?.(`Đã khôi phục đề “${snapshot.title || 'Đề'}”`, 'success');
          } catch (undoErr) {
            onSay?.(`Không khôi phục được đề: ${undoErr?.message || undoErr}`, 'error');
          }
        },
      });
    } catch (e) {
      onSay?.(`Không xoá được: ${e?.message || e}`, 'error');
    } finally {
      setBusy('');
    }
  };

  const executeUnlink = async () => {
    const item = confirmUnlinkItem;
    if (!item || !user?.uid) return;
    setUnlinkBusy(true);
    try {
      await unlinkTeacher(item.classId, user.uid, {
        by: user.uid,
        byName: user.displayName || user.email || 'Giáo viên',
        teacherName: user.displayName || user.email || 'Giáo viên',
        subject: item.subject || '',
      });
      setConfirmUnlinkItem(null);
      if (openClass === item.classId) setOpenClass('');
      setItems((prev) => prev.filter((x) => x.classId !== item.classId));
      onSay?.(`Đã gỡ liên kết lớp ${item.cls?.name || item.className || item.classId}.`, 'success');
      await onLinkedChange?.();
    } catch (e) {
      onSay?.(`Không gỡ được liên kết: ${e?.message || e}`, 'error');
    } finally {
      setUnlinkBusy(false);
    }
  };

  const monitor = async (item, exam) => {
    setBusy(exam.id);
    try {
      const current = detail[item.classId]?.sessions?.[exam.id];
      if (current && current.status === 'live') {
        onMonitor?.(current);
        return;
      }
      const session = await createExamSession({
        examId: exam.id,
        examToken: exam.token,
        classId: exam.classId,
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Giáo viên',
        title: exam.title,
        duration: exam.duration,
      });
      setDetail((d) => ({
        ...d,
        [item.classId]: {
          ...(d[item.classId] || { subs: {}, sessions: {} }),
          sessions: { ...(d[item.classId]?.sessions || {}), [exam.id]: session },
        },
      }));
      setConfirmId('');
      onMonitor?.(session);
    } catch (e) {
      onSay?.(`Không mở được phòng giám sát: ${e?.message || e}`, 'error');
    } finally {
      setBusy('');
    }
  };

  const summary = useMemo(() => {
    let totalStudents = 0;
    let totalExams = 0;
    let openExams = 0;
    const subjects = new Set();
    items.forEach((it) => {
      totalStudents += studentCountOf(it.cls);
      const mine = it.mine || [];
      totalExams += mine.length;
      mine.forEach((ex) => {
        if (examStatus(ex).code === 'open') openExams += 1;
      });
      if (it.subject) subjects.add(it.subject);
    });
    return {
      classCount: items.length,
      totalStudents,
      totalExams,
      openExams,
      subjects: [...subjects].sort((a, b) => a.localeCompare(b, 'vi')),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (subjectFilter !== 'all' && it.subject !== subjectFilter) return false;
      if (!q) return true;
      const hay = `${it.cls?.name || it.className || ''} ${it.cls?.key || ''} ${it.cls?.teacherName || ''} ${it.subject || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, subjectFilter]);

  /* ---------- trạng thái tải / lỗi ---------- */
  if (loading) {
    return (
      <div className="gvbm-state-card">
        <p className="st-empty">Đang tải danh sách lớp dạy bộ môn…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="gvbm-state-card">
        <p className="st-error">{err}</p>
        <button type="button" className="vt-btn sm primary" style={{ marginTop: '0.6rem' }} onClick={load}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <section className="gvbm-onboarding" aria-label="Hướng dẫn nhận lớp dạy bộ môn">
        <div className="gvbm-onboarding-head">
          <span className="gvbm-pill-tag">Không gian Giáo viên Bộ môn</span>
          <h3>Chưa có lớp dạy bộ môn nào được liên kết</h3>
          <p>
            Nhận lớp bằng key phân công từ Giáo viên Chủ nhiệm để soạn đề AI gắn thẳng vào lớp,
            mở phòng thi giám sát và xuất bảng điểm chuẩn Thông tư 22.
          </p>
        </div>

        <ol className="gvbm-steps">
          <li>
            <span className="gvbm-step-num" aria-hidden="true">1</span>
            <div>
              <b>Xin Key liên kết từ GV Chủ nhiệm</b>
              <small>Chủ nhiệm mở <i>Chi tiết lớp → GV bộ môn</i>, chọn phân môn và tạo mã dạng <code>GV-XXXXXX</code>.</small>
            </div>
          </li>
          <li>
            <span className="gvbm-step-num" aria-hidden="true">2</span>
            <div>
              <b>Dán Key vào khung Nhận lớp bên phải</b>
              <small>Hệ thống tự nhận diện tên lớp và môn phụ trách trước khi bạn xác nhận liên kết.</small>
            </div>
          </li>
          <li>
            <span className="gvbm-step-num" aria-hidden="true">3</span>
            <div>
              <b>Giao đề, Giám sát &amp; Xuất Excel một chạm</b>
              <small>Đề bạn giao tự đồng bộ để GVCN xem tiến độ chung nhưng vẫn giữ quyền chỉnh sửa độc lập của bạn.</small>
            </div>
          </li>
        </ol>

        {onFocusKeyInput && (
          <div className="gvbm-onboarding-foot">
            <button type="button" className="vt-btn sm primary" onClick={onFocusKeyInput}>
              Nhập key nhận lớp ngay →
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="gvbm-workspace">
      {/* 4 chỉ số tổng quan GVBM */}
      <div className="gvbm-kpi-strip">
        <div className="gvbm-kpi-tile" data-tone="acc">
          <small>Lớp phụ trách</small>
          <b>{summary.classCount}</b>
          <span>{summary.subjects.length ? `${summary.subjects.length} phân môn` : 'Đã liên kết'}</span>
        </div>
        <div className="gvbm-kpi-tile" data-tone="violet">
          <small>Tổng học sinh</small>
          <b>{summary.totalStudents}</b>
          <span>Trong các lớp nhận dạy</span>
        </div>
        <div className="gvbm-kpi-tile" data-tone="ok">
          <small>Đề đã giao</small>
          <b>{summary.totalExams}</b>
          <span>{summary.openExams > 0 ? `${summary.openExams} đề đang mở` : 'Chưa có đề mở'}</span>
        </div>
        <div className="gvbm-kpi-tile" data-tone="amber">
          <small>Phân môn</small>
          <b>{summary.subjects.length || 1}</b>
          <span>{summary.subjects.slice(0, 2).join(', ') || 'Bộ môn'}</span>
        </div>
      </div>

      {/* Bộ lọc & tìm kiếm thông minh */}
      <div className="gvbm-filterbar">
        <input
          type="search"
          className="gvbm-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên lớp, môn học, GVCN hoặc mã lớp…"
          aria-label="Tìm lớp dạy bộ môn"
        />
        {summary.subjects.length > 1 && (
          <div className="gvbm-subject-pills" role="group" aria-label="Lọc theo phân môn">
            <button
              type="button"
              className={`gvbm-chip${subjectFilter === 'all' ? ' is-on' : ''}`}
              onClick={() => setSubjectFilter('all')}
            >
              Tất cả ({items.length})
            </button>
            {summary.subjects.map((sub) => (
              <button
                key={sub}
                type="button"
                className={`gvbm-chip${subjectFilter === sub ? ' is-on' : ''}`}
                onClick={() => setSubjectFilter(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="gvbm-state-card">
          <p className="st-empty">Không tìm thấy lớp nào khớp với bộ lọc hiện tại.</p>
          <button
            type="button"
            className="vt-btn sm"
            style={{ marginTop: '0.5rem' }}
            onClick={() => { setSearch(''); setSubjectFilter('all'); }}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="gvbm-card-list">
          {filteredItems.map((item) => {
            const d = detail[item.classId];
            const isOpen = openClass === item.classId;
            const clsName = item.cls?.name || item.className || item.classId;
            const studentCount = studentCountOf(item.cls);
            const mine = item.mine || [];
            const badge = classBadgeOf(clsName);
            const liveCount = Object.values(d?.sessions || {}).filter((s) => s?.status === 'live').length;

            return (
              <article key={item.classId} className={`gvbm-class-card${isOpen ? ' is-expanded' : ''}`}>
                <header className="gvbm-class-head">
                  <div className="gvbm-class-identity">
                    <span className={`gvbm-avatar${badge.length >= 3 ? ' is-long' : ''}`} aria-hidden="true">
                      {badge}
                    </span>
                    <div className="gvbm-class-title">
                      <div className="gvbm-title-row">
                        <h4>{clsName}</h4>
                        <span className="gvbm-subject-tag">{item.subject || 'Chưa rõ môn'}</span>
                        {item.cls?.key && <code className="gvbm-class-code">{item.cls.key}</code>}
                        {liveCount > 0 && <span className="gvbm-live-tag">LIVE</span>}
                      </div>
                      <p className="gvbm-meta-line">
                        <span>GVCN: <b>{item.cls?.teacherName || '—'}</b></span>
                        <span>·</span>
                        <span><b>{studentCount}</b> học sinh</span>
                        <span>·</span>
                        <span><b>{mine.length}</b> đề đã giao</span>
                        <span>·</span>
                        <span>Nhận lớp {fmtDate(toMs(item.linkedAt) || item.linkedAtMs)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="gvbm-card-actions">
                    <button
                      type="button"
                      className="vt-btn sm primary"
                      onClick={() => onAssign?.({
                        id: item.classId,
                        name: clsName,
                        teacherId: item.cls?.teacherId || '',
                        teacherName: item.cls?.teacherName || '',
                        subject: item.subject || '',
                        members: item.cls?.members || [],
                      })}
                    >
                      + Giao đề
                    </button>
                    <button
                      type="button"
                      className={`vt-btn sm${isOpen ? ' active' : ''}`}
                      onClick={() => openClassDetail(item)}
                    >
                      {isOpen ? 'Thu gọn' : `Đề đã giao (${mine.length})`}
                    </button>
                    <button
                      type="button"
                      className="vt-btn sm"
                      disabled={exportingClassId === item.classId}
                      onClick={() => exportLinkedClassXlsx(item)}
                      title="Xuất bảng điểm GVBM (.xlsx) có hệ số Thông tư 22"
                    >
                      {exportingClassId === item.classId ? 'Đang xuất…' : 'Xuất Excel'}
                    </button>
                    <button
                      type="button"
                      className="vt-btn sm danger"
                      onClick={() => setConfirmUnlinkItem(item)}
                      title="Gỡ liên kết khỏi lớp này"
                    >
                      Gỡ liên kết
                    </button>
                  </div>
                </header>

                {item.classError && <p className="st-error" style={{ marginTop: '0.6rem' }}>{item.classError}</p>}

                {isOpen && (
                  <div className="gvbm-class-drawer">
                    {d?.loading ? (
                      <p className="st-empty sm">Đang tải danh sách đề và lượt nộp…</p>
                    ) : mine.length === 0 ? (
                      <div className="gvbm-drawer-empty">
                        <p>Bạn chưa giao đề nào cho lớp <b>{clsName}</b>.</p>
                        <button
                          type="button"
                          className="vt-btn sm primary"
                          onClick={() => onAssign?.({
                            id: item.classId,
                            name: clsName,
                            teacherId: item.cls?.teacherId || '',
                            teacherName: item.cls?.teacherName || '',
                            subject: item.subject || '',
                            members: item.cls?.members || [],
                          })}
                        >
                          Soạn &amp; Giao đề đầu tiên →
                        </button>
                      </div>
                    ) : (
                      <div className="st-scroll">
                        <table className="st-table mobile-cards">
                          <thead>
                            <tr>
                              <th>Đề kiểm tra</th>
                              <th className="num">Trạng thái</th>
                              <th className="num">Bài nộp</th>
                              <th className="num">Điểm TB</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {mine.map((ex) => {
                              const subs = d?.subs?.[ex.id] || [];
                              const session = d?.sessions?.[ex.id];
                              const isLive = Boolean(session && session.status === 'live');
                              const st = examStatus(ex);
                              const statusKey = isLive ? 'live' : st.code;
                              const statusLabel = isLive ? 'Đang thi' : st.label;
                              const scored = subs
                                .map((s) => {
                                  const p = pct(s);
                                  return p === null ? null : { p };
                                })
                                .filter(Boolean);
                              const avg = scored.length
                                ? Math.round(scored.reduce((a, s) => a + s.p, 0) / scored.length)
                                : null;

                              return (
                                <tr key={ex.id}>
                                  <td data-label="Đề kiểm tra">
                                    <b>{ex.title || 'Đề'}</b>
                                    <small className="st-mail">{ex.subject || item.subject || '—'}</small>
                                  </td>
                                  <td className="num" data-label="Trạng thái">
                                    <span className={`st-badge tone-${STATUS_TONE[statusKey] || 'na'}`}>
                                      {statusLabel}
                                    </span>
                                  </td>
                                  <td className="num" data-label="Bài nộp">{subs.length}</td>
                                  <td className="num" data-label="Điểm TB">{avg === null ? '—' : `${avg}%`}</td>
                                  <td>
                                    <div className="gvbm-row-actions">
                                      {isLive ? (
                                        <button type="button" className="st-btn primary" onClick={() => onMonitor?.(session)}>
                                          Giám sát LIVE
                                        </button>
                                      ) : confirmId === ex.id ? (
                                        <>
                                          <span className="st-keymeta">Mở phòng thi?</span>
                                          <button
                                            type="button"
                                            className="st-btn primary"
                                            disabled={busy === ex.id}
                                            onClick={() => monitor(item, ex)}
                                          >
                                            {busy === ex.id ? 'Đang mở…' : 'Đồng ý'}
                                          </button>
                                          <button type="button" className="st-btn ghost" onClick={() => setConfirmId('')}>
                                            Hủy
                                          </button>
                                        </>
                                      ) : (
                                        <button type="button" className="st-btn" onClick={() => setConfirmId(ex.id)}>
                                          Giám sát
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="st-btn"
                                        onClick={() => setEditCtx({ exam: ex, item })}
                                        title="Sửa câu hỏi, thời gian, cấu hình giám sát"
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        className="st-btn"
                                        onClick={() => setManageCtx({ exam: ex, item })}
                                        title="Gia hạn, đóng/mở đề, nhân bản, phân tích, chấm lại"
                                      >
                                        Quản lý
                                      </button>
                                      <button
                                        type="button"
                                        className="st-btn ghost"
                                        onClick={() => exportLinkedExamXlsx(item, ex, subs)}
                                        title="Xuất kết quả bài kiểm tra ra file Excel (.xlsx)"
                                      >
                                        Excel
                                      </button>
                                      <button
                                        type="button"
                                        className="st-btn ghost"
                                        onClick={() => setResultsOf(resultsOf === ex.id ? '' : ex.id)}
                                      >
                                        {resultsOf === ex.id ? 'Ẩn KQ' : 'Kết quả'}
                                      </button>
                                      <button
                                        type="button"
                                        className="st-btn ghost gvbm-del-btn"
                                        title="Xoá đề khỏi lớp"
                                        onClick={() => removeExam(item, ex)}
                                      >
                                        Xoá
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {resultsOf && (() => {
                          const subs = (d?.subs?.[resultsOf] || []).slice().sort((a, b) => {
                            const pa = pct(a); const pb = pct(b);
                            if (pa === null && pb === null) return 0;
                            if (pa === null) return 1;
                            if (pb === null) return -1;
                            return pb - pa;
                          });
                          return (
                            <div className="gvbm-results-box">
                              <div className="st-sub" style={{ marginBottom: '0.35rem' }}>
                                Kết quả đề “{mine.find((e) => e.id === resultsOf)?.title || 'Đề'}” · {subs.length} bài nộp
                              </div>
                              {subs.length === 0 ? (
                                <p className="st-empty sm">Chưa có học sinh nào nộp bài.</p>
                              ) : (
                                <table className="st-exams">
                                  <thead>
                                    <tr>
                                      <th>Học sinh</th>
                                      <th className="num">Điểm</th>
                                      <th className="num">%</th>
                                      <th className="num">Nộp lúc</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subs.map((s) => (
                                      <tr key={s.id}>
                                        <td>{s.studentName || s.studentEmail || s.studentId}</td>
                                        <td className="num">{Number(s.score)}/{Number(s.totalPoints)}</td>
                                        <td className="num">{pct(s) === null ? '—' : `${pct(s)}%`}</td>
                                        <td className="num">{fmtDateTime(toMs(s.submittedAt))}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {manageCtx && (
        <Modal
          title={`Quản lý đề — ${manageCtx.exam.title || 'Đề'}`}
          size="lg"
          onClose={() => setManageCtx(null)}
        >
          <p className="st-empty sm" style={{ marginTop: 0 }}>
            Thao tác áp dụng cho đề <b>{manageCtx.exam.title || 'Đề'}</b> trong lớp{' '}
            <b>{manageCtx.item.cls?.name || manageCtx.item.className || manageCtx.item.classId}</b>.
          </p>
          <ExamManagePanel
            exam={manageCtx.exam}
            submissions={detail[manageCtx.item.classId]?.subs?.[manageCtx.exam.id] || []}
            toast={{
              success: (m) => onSay?.(m, 'success'),
              error: (m) => onSay?.(m, 'error'),
            }}
            onChanged={async () => {
              const target = manageCtx.item;
              await load();
              const data = await fetchClassDetail(target);
              setDetail((d) => ({ ...d, [target.classId]: data }));
            }}
          />
        </Modal>
      )}

      {editCtx && (
        <ExamEditModal
          exam={editCtx.exam}
          classes={[{
            id: editCtx.item.classId,
            name: editCtx.item.cls?.name || editCtx.item.className || editCtx.item.classId,
          }]}
          onClose={() => setEditCtx(null)}
          onSaved={async () => {
            const target = editCtx.item;
            setEditCtx(null);
            await load();
            const data = await fetchClassDetail(target);
            setDetail((d) => ({ ...d, [target.classId]: data }));
          }}
        />
      )}

      {confirmRemoveCtx && (
        <Modal
          title="Xác nhận xoá đề khỏi lớp"
          size="sm"
          onClose={() => setConfirmRemoveCtx(null)}
        >
          <p className="st-empty" style={{ marginTop: 0, lineHeight: 1.5 }}>
            Bạn sắp xoá đề <b>“{confirmRemoveCtx.exam.title || 'Đề'}”</b> khỏi lớp{' '}
            <b>{confirmRemoveCtx.item.cls?.name || confirmRemoveCtx.item.className || confirmRemoveCtx.item.classId}</b>.
            Bạn có thể bấm <b>Hoàn tác</b> trong vài giây sau khi xoá.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="st-btn" onClick={() => setConfirmRemoveCtx(null)}>Hủy</button>
            <button
              type="button"
              className="st-btn primary"
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
              onClick={executeRemoveExam}
            >
              Xác nhận xoá
            </button>
          </div>
        </Modal>
      )}

      {confirmUnlinkItem && (
        <Modal
          title={`Gỡ liên kết lớp ${confirmUnlinkItem.cls?.name || confirmUnlinkItem.className || confirmUnlinkItem.classId}?`}
          size="sm"
          onClose={() => { if (!unlinkBusy) setConfirmUnlinkItem(null); }}
        >
          <p className="st-empty" style={{ marginTop: 0, lineHeight: 1.55 }}>
            Bạn sẽ ngừng nhận giao đề mới cho phân môn{' '}
            <b>{confirmUnlinkItem.subject || 'đã liên kết'}</b> tại lớp này.
            Nếu muốn giảng dạy lại, bạn sẽ cần key mới từ giáo viên chủ nhiệm.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="st-btn" disabled={unlinkBusy} onClick={() => setConfirmUnlinkItem(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="st-btn primary"
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
              disabled={unlinkBusy}
              onClick={executeUnlink}
            >
              {unlinkBusy ? 'Đang gỡ…' : 'Xác nhận gỡ'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
