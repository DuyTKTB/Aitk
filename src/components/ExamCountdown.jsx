import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks.js';

const EMPTY = { name: '', subject: '', date: '', time: '', notes: '' };
const stamp = (x) => new Date(`${x.date}T${x.time || '23:59'}`).getTime();

const SUBJECT_TIPS = {
  'toán': 'Ôn lại công thức, làm đề thử, chú ý thời gian.',
  'lý': 'Nắm công thức, làm bài tập tính toán, vẽ sơ đồ mạch.',
  'hóa': 'Học thuộc bảng tuần hoàn, cân bằng PTHH, làm bài tập mol.',
  'sinh': 'Vẽ sơ đồ tư duy, học thuộc quá trình, làm trắc nghiệm.',
  'văn': 'Ôn dàn ý, luyện viết mở bài, học dẫn chứng.',
  'anh': 'Luyện nghe, học từ vựng chủ đề, làm đề reading.',
  'sử': 'Lập timeline, học sự kiện, so sánh giai đoạn.',
  'địa': 'Học bản đồ, atlat, số liệu, phân tích biểu đồ.',
};

function urgency(diff) {
  if (diff <= 0) return 'past';
  if (diff < 864e5) return 'critical';    // < 1 ngày
  if (diff < 3 * 864e5) return 'urgent';  // < 3 ngày
  if (diff < 7 * 864e5) return 'soon';    // < 7 ngày
  return 'normal';
}

function tipFor(subject) {
  if (!subject) return null;
  const s = subject.toLowerCase();
  for (const key in SUBJECT_TIPS) {
    if (s.includes(key)) return SUBJECT_TIPS[key];
  }
  return null;
}

export default function ExamCountdown() {
  const [exams, setExams] = useLocalStorage('cs-exams', []);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [notified, setNotified] = useLocalStorage('cs-exam-notified', {});
  const [notifyOn, setNotifyOn] = useLocalStorage('cs-exam-notify', false);
  const fileRef = useRef(null);
  useEffect(() => {
    const hasNear = exams.some((x) => stamp(x) - now < 864e5 && stamp(x) > now);
    const interval = hasNear ? 1000 : 15000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [exams, now]);
  useEffect(() => {
    if (!notifyOn || !('Notification' in window) || Notification.permission !== 'granted') return;
    for (const x of exams) {
      const diff = stamp(x) - now;
      if (diff <= 0) continue;
      const key1d = `${x.id}-1d`;
      const key1h = `${x.id}-1h`;
      if (diff < 864e5 && !notified[key1d]) {
        try { new Notification('📅 Còn 1 ngày!', { body: `${x.name} — ${x.subject || ''}` }); } catch {}
        setNotified({ ...notified, [key1d]: true });
      }
      if (diff < 36e5 && !notified[key1h]) {
        try { new Notification('⏰ Còn 1 giờ!', { body: `${x.name} — chuẩn bị thôi!` }); } catch {}
        setNotified({ ...notified, [key1h]: true });
      }
    }
  }, [now, notifyOn]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cancel = () => { setForm(EMPTY); setEditId(null); };
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    if (editId) setExams(exams.map((x) => (x.id === editId ? { ...x, ...form } : x)));
    else setExams([...exams, { ...form, id: Date.now().toString(36), pinned: false, created: Date.now() }]);
    cancel();
  };

  const past = (x) => stamp(x) <= now;
  const sorted = [...exams].sort((a, b) =>
    past(a) - past(b) ||
    (past(a) ? stamp(b) - stamp(a) : Number(b.pinned) - Number(a.pinned) || stamp(a) - stamp(b))
  );
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ exams, exported: Date.now() })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chem-study-exams-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.exams)) {
          setExams(data.exams);
          alert(`Đã nhập ${data.exams.length} kỳ thi.`);
        }
      } catch { alert('File không hợp lệ.'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const enableNotify = async () => {
    if (!('Notification' in window)) return alert('Trình duyệt không hỗ trợ thông báo.');
    const p = await Notification.requestPermission();
    if (p === 'granted') setNotifyOn(true);
  };

  return (
    <section className="wrap">
      <h1>Đếm ngược kỳ thi</h1>

      <form className="card examform" onSubmit={submit}>
        <label>Tên kỳ thi<input value={form.name} onChange={set('name')} required placeholder="Kiểm tra 45' chương 3" /></label>
        <label>Môn học<input value={form.subject} onChange={set('subject')} placeholder="Hóa, Lý, Toán..." /></label>
        <label>Ngày thi<input type="date" value={form.date} onChange={set('date')} required /></label>
        <label>Giờ thi (không bắt buộc)<input type="time" value={form.time} onChange={set('time')} /></label>
        <label style={{ gridColumn: '1 / -1' }}>Ghi chú<input value={form.notes} onChange={set('notes')} placeholder="Ôn chương 1-3, mang máy tính..." /></label>
        <div className="row" style={{ gridColumn: '1 / -1' }}>
          <button className="btn primary" type="submit">{editId ? 'Lưu thay đổi' : '+ Thêm kỳ thi'}</button>
          {editId && <button className="btn" type="button" onClick={cancel}>Hủy</button>}
          <button className="btn" type="button" onClick={exportJSON} disabled={!exams.length}>⬇ Xuất JSON</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ Nhập JSON
            <input type="file" accept=".json" hidden onChange={importJSON} />
          </label>
          <button className="btn" type="button" onClick={enableNotify}>
            {notifyOn ? '🔔 Đã bật thông báo' : '🔕 Bật thông báo'}
          </button>
        </div>
      </form>

      {sorted.length === 0 && (
        <p className="hint center">Chưa có kỳ thi nào. Thêm kỳ thi đầu tiên ở trên để bắt đầu đếm ngược.</p>
      )}

      <div className="grid">
        {sorted.map((x) => {
          const diff = stamp(x) - now;
          const over = diff <= 0;
          const days = Math.floor(diff / 864e5);
          const hours = Math.floor(diff / 36e5) % 24;
          const mins = Math.floor(diff / 6e4) % 60;
          const secs = Math.floor(diff / 1000) % 60;
          const u = urgency(diff);
          const total = x.created ? stamp(x) - x.created : 30 * 864e5;
          const progress = x.created ? Math.min(100, Math.max(0, ((now - x.created) / total) * 100)) : 0;
          const tip = tipFor(x.subject);

          return (
            <article key={x.id} className={'card exam urgency-' + u + (x.pinned && !over ? ' pinned' : '')}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3>{x.name}</h3>
                {x.pinned && !over && <span className="badge">📌</span>}
              </div>

              <p className="hint">
                {[x.subject, x.date.split('-').reverse().join('/'), x.time].filter(Boolean).join(' · ')}
              </p>

              {x.notes && <p className="exam-notes">📝 {x.notes}</p>}

              {over ? (
                <p className="done">✓ Đã diễn ra</p>
              ) : (
                <>
                  <div className={'cd ' + u} aria-label={`Còn ${days} ngày ${hours} giờ ${mins} phút`}>
                    <div><b>{days}</b><span>Ngày</span></div>
                    <div><b>{hours}</b><span>Giờ</span></div>
                    <div><b>{mins}</b><span>Phút</span></div>
                    {days < 1 && <div><b>{secs}</b><span>Giây</span></div>}
                  </div>
                  <div className="bar exam-bar" aria-label="Tiến độ thời gian">
                    <i style={{ width: progress + '%' }} />
                  </div>
                </>
              )}

              {tip && !over && (
                <p className="exam-tip">💡 <b>Gợi ý:</b> {tip}</p>
              )}

              <div className="row">
                <button className="btn sm" onClick={() => setExams(exams.map((y) => (y.id === x.id ? { ...y, pinned: !y.pinned } : y)))}>
                  {x.pinned ? 'Bỏ ghim' : 'Ghim'}
                </button>
                <button className="btn sm" onClick={() => {
                  setEditId(x.id);
                  setForm({ name: x.name, subject: x.subject || '', date: x.date, time: x.time || '', notes: x.notes || '' });
                  scrollTo({ top: 0, behavior: 'smooth' });
                }}>Sửa</button>
                <button className="btn sm" onClick={() => setExams(exams.filter((y) => y.id !== x.id))}>Xóa</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}