import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage, dayKey } from '../hooks.js';
import {
  IcoCalendar, IcoClock, IcoPlus, IcoTrash, IcoCheck, IcoChevronLeft, IcoChevronRight, IcoClose
} from './PomodoroIcons.jsx';
import './schedule.css';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatTime(h) { return `${String(h).padStart(2, '0')}:00`; }

export default function Schedule() {
  const [events, setEvents] = useLocalStorage('cs-schedule', []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', day: 1, start: 8, end: 9, color: '#4d86ff' });
  const [now, setNow] = useState(new Date());

  // Tick mỗi phút để cập nhật "đang diễn ra"
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const currentDayOfWeek = currentDate.getDay(); // 0-6
  const todayKey = dayKey(now);
  const isToday = dayKey(currentDate) === todayKey;

  const openAdd = () => {
    setForm({ id: null, title: '', day: currentDayOfWeek, start: 8, end: 9, color: '#4d86ff' });
    setModal(true);
  };

  const openEdit = (ev) => {
    setForm(ev);
    setModal(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (form.id) {
      setEvents(events.map(e => e.id === form.id ? form : e));
    } else {
      setEvents([...events, { ...form, id: Date.now() }]);
    }
    setModal(false);
  };

  const remove = (id) => setEvents(events.filter(e => e.id !== id));

  // Nhóm sự kiện theo ngày
  const byDay = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    events.forEach(e => { if (map[e.day]) map[e.day].push(e); });
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.start - b.start));
    return map;
  }, [events]);

  // Trạng thái sự kiện hôm nay (quá khứ, đang diễn ra, sắp tới)
  const todayEvents = byDay[currentDayOfWeek] || [];
  const nowH = now.getHours() + now.getMinutes() / 60;

  return (
    <div className="schedule-wrap">
      <header className="schedule-head">
        <div>
          <span className="schedule-badge"><IcoCalendar size={14} /> Thời khóa biểu</span>
          <h1 className="schedule-title">Lịch trình cá nhân</h1>
          <p className="schedule-sub">Tự lập thời gian, theo dõi tiến độ từng ngày.</p>
        </div>
        <button className="schedule-btn-primary" onClick={openAdd}>
          <IcoPlus size={16} /> Thêm sự kiện
        </button>
      </header>

      {/* Week Selector */}
      <div className="schedule-week-bar">
        <button className="schedule-icon-btn" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}>
          <IcoChevronLeft size={18} />
        </button>
        <div className="schedule-week-days">
          {DAYS.map((d, i) => {
            const date = new Date(currentDate);
            const diff = i - currentDate.getDay();
            date.setDate(currentDate.getDate() + diff);
            const isToday = dayKey(date) === todayKey;
            const active = i === currentDayOfWeek;
            return (
              <button
                key={i}
                className={'schedule-day' + (active ? ' active' : '') + (isToday ? ' today' : '')}
                onClick={() => setCurrentDate(date)}
              >
                <span className="schedule-day-name">{d}</span>
                <span className="schedule-day-num">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
        <button className="schedule-icon-btn" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}>
          <IcoChevronRight size={18} />
        </button>
      </div>

      {/* Timeline */}
      <div className="schedule-timeline">
        {HOURS.map(h => {
          const evs = todayEvents.filter(e => e.start <= h && e.end > h);
          const isCurrentHour = isToday && now.getHours() === h;
          return (
            <div key={h} className={'schedule-hour' + (isCurrentHour ? ' current' : '')}>
              <div className="schedule-hour-label">{formatTime(h)}</div>
              <div className="schedule-hour-slot">
                {evs.map(ev => {
                  const startPct = ev.start <= h ? 0 : (ev.start - h) * 100;
                  const heightPct = ev.end <= h + 1 ? 100 : (h + 1 - ev.start) * 100;
                  const isOngoing = isToday && ev.start <= nowH && ev.end > nowH;
                  return (
                    <div
                      key={ev.id}
                      className={'schedule-event' + (isOngoing ? ' ongoing' : '')}
                      style={{
                        background: `color-mix(in srgb, ${ev.color} 22%, transparent)`,
                        borderLeftColor: ev.color,
                        top: `${startPct}%`,
                        height: `${heightPct}%`,
                      }}
                      onClick={() => openEdit(ev)}
                    >
                      <span className="schedule-event-title">{ev.title}</span>
                      <span className="schedule-event-time">{formatTime(ev.start)} - {formatTime(ev.end)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="schedule-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}>
          <div className="schedule-modal">
            <header className="schedule-modal-head">
              <h2>{form.id ? 'Sửa sự kiện' : 'Thêm sự kiện'}</h2>
              <button className="schedule-modal-x" onClick={() => setModal(false)}><IcoClose size={16} /></button>
            </header>
            <div className="schedule-modal-body">
              <label className="schedule-field">
                <span>Tên sự kiện</span>
                <input autoFocus type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Học Hóa 11" />
              </label>
              <div className="schedule-row">
                <label className="schedule-field">
                  <span>Ngày</span>
                  <select value={form.day} onChange={e => setForm({ ...form, day: +e.target.value })}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </label>
                <label className="schedule-field">
                  <span>Màu</span>
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                </label>
              </div>
              <div className="schedule-row">
                <label className="schedule-field">
                  <span>Bắt đầu</span>
                  <select value={form.start} onChange={e => setForm({ ...form, start: +e.target.value })}>
                    {HOURS.map(h => <option key={h} value={h}>{formatTime(h)}</option>)}
                  </select>
                </label>
                <label className="schedule-field">
                  <span>Kết thúc</span>
                  <select value={form.end} onChange={e => setForm({ ...form, end: +e.target.value })}>
                    {HOURS.map(h => <option key={h} value={h}>{formatTime(h)}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <footer className="schedule-modal-foot">
              {form.id && <button className="schedule-btn schedule-btn-danger" onClick={() => remove(form.id)}><IcoTrash size={15} /> Xóa</button>}
              <button className="schedule-btn" onClick={() => setModal(false)}>Hủy</button>
              <button className="schedule-btn-primary" onClick={save}><IcoCheck size={15} /> Lưu</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}