import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COLORS, colorOf, DAY_ORDER, DAY_SHORT, DAY_LONG,
  toMin, minToStr, dateKey, eventsOn, doneKey, fmtDur, useSchedule,
} from '../lib/schedule.js';
import '../styles/schedule.css';

/* ============================================================
   Schedule.jsx — THỜI KHÓA BIỂU TỰ LẬP
   • Chọn ngày trong tuần, xem dạng Dòng thời gian hoặc Danh sách
   • Thêm / sửa / xóa lịch, lặp hàng tuần hoặc chỉ một ngày
   • Đánh dấu hoàn thành theo từng ngày, nhắc khi đến giờ
   Route: #schedule
   ============================================================ */

const ico = (d) => ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoPlus = ico(<path d="M12 5v14M5 12h14" />);
const IcoLeft = ico(<path d="M14.5 5l-7 7 7 7" />);
const IcoRight = ico(<path d="M9.5 5l7 7-7 7" />);
const IcoCheck = ico(<path d="M5 12.5l4.5 4.5L19 7.5" />);
const IcoClose = ico(<path d="M6 6l12 12M18 6L6 18" />);
const IcoTrash = ico(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></>);
const IcoBell = ico(<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" /><path d="M10 19a2 2 0 0 0 4 0" /></>);
const IcoTimer = ico(<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 3h5" /></>);
const IcoCal = ico(<><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>);
const IcoList = ico(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />);
const IcoRows = ico(<><path d="M4 5h16M4 12h16M4 19h16" /><path d="M9 3v4M15 10v4M7 17v4" /></>);

const HOUR_H = 60;

const SAMPLE = [
  { title: 'Học buổi sáng', start: '07:00', end: '08:30', color: 'blue', days: [1, 2, 3, 4, 5] },
  { title: 'Ôn Hóa học', start: '19:30', end: '20:30', color: 'purple', days: [1, 3, 5] },
  { title: 'Làm bài tập', start: '20:45', end: '21:30', color: 'orange', days: [2, 4] },
  { title: 'Vận động & nghỉ ngơi', start: '17:30', end: '18:15', color: 'green', days: [1, 2, 3, 4, 5, 6, 0] },
];

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7));

/* Chia cột cho các lịch bị trùng giờ */
function layoutDay(events) {
  const res = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = [];
    cluster.forEach((it) => {
      let c = cols.findIndex((end) => end <= it.s);
      if (c === -1) { c = cols.length; cols.push(it.e); } else cols[c] = it.e;
      it.col = c;
    });
    cluster.forEach((it) => { it.cols = cols.length; res.push(it); });
    cluster = [];
    clusterEnd = -1;
  };
  events.forEach((ev) => {
    const it = { ev, s: toMin(ev.start), e: toMin(ev.end) };
    if (cluster.length && it.s >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.e);
  });
  if (cluster.length) flush();
  return res;
}

/* ============================================================
   MODAL THÊM / SỬA
   ============================================================ */
function EventModal({ initial, defaults, onSave, onDelete, onClose }) {
  const editing = !!initial;
  const [d, setD] = useState(() =>
    initial
      ? {
          ...initial,
          repeat: initial.date ? 'once' : 'weekly',
          date: initial.date || defaults.date,
          days: initial.days?.length ? initial.days : [defaults.day],
        }
      : {
          title: '', repeat: 'weekly', days: [defaults.day], date: defaults.date,
          start: defaults.start, end: defaults.end, color: 'blue', note: '', remind: true,
        }
  );
  const [err, setErr] = useState('');
  const set = (k, v) => { setD((x) => ({ ...x, [k]: v })); if (err) setErr(''); };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setStart = (v) => {
    setD((x) => {
      const dur = Math.max(15, toMin(x.end) - toMin(x.start));
      return { ...x, start: v, end: minToStr(Math.min(1439, toMin(v) + dur)) };
    });
    if (err) setErr('');
  };
  const toggleDay = (n) =>
    set('days', d.days.includes(n) ? d.days.filter((x) => x !== n) : [...d.days, n]);

  const submit = (e) => {
    e.preventDefault();
    const title = d.title.trim();
    if (!title) return setErr('Hãy nhập tên hoạt động.');
    if (toMin(d.end) <= toMin(d.start)) return setErr('Giờ kết thúc phải sau giờ bắt đầu.');
    if (d.repeat === 'weekly' && d.days.length === 0) return setErr('Chọn ít nhất một ngày trong tuần.');
    return onSave({
      id: d.id,
      title,
      start: d.start,
      end: d.end,
      color: d.color,
      note: (d.note || '').trim(),
      remind: d.remind,
      days: d.repeat === 'weekly' ? d.days : [],
      date: d.repeat === 'once' ? d.date : null,
    });
  };

  const dateLabel = new Date(`${d.date}T00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'numeric',
  });

  return (
    <div className="sch-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sch-sheet" onSubmit={submit} style={{ '--t': colorOf(d.color).rgb }}>
        <header className="sch-sheet-head">
          <h2>{editing ? 'Sửa lịch' : 'Thêm lịch mới'}</h2>
          <button type="button" className="sch-icon-btn" onClick={onClose} aria-label="Đóng">
            <IcoClose size={16} />
          </button>
        </header>

        <div className="sch-sheet-body">
          <input
            className="sch-title-input"
            type="text"
            value={d.title}
            placeholder="Tên hoạt động, ví dụ: Ôn chương Este"
            onChange={(e) => set('title', e.target.value)}
            autoFocus
          />

          <div className="sch-field">
            <span>Lặp lại</span>
            <div className="sch-seg">
              <button type="button" className={d.repeat === 'weekly' ? 'on' : ''} onClick={() => set('repeat', 'weekly')}>Hàng tuần</button>
              <button type="button" className={d.repeat === 'once' ? 'on' : ''} onClick={() => set('repeat', 'once')}>Chỉ một ngày</button>
            </div>
          </div>

          {d.repeat === 'weekly' ? (
            <div className="sch-field">
              <span>Các ngày trong tuần</span>
              <div className="sch-days">
                {DAY_ORDER.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={d.days.includes(n) ? 'on' : ''}
                    onClick={() => toggleDay(n)}
                    aria-pressed={d.days.includes(n)}
                  >
                    {DAY_SHORT[n]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="sch-field">
              <span>Ngày</span>
              <input
                className="sch-input"
                type="date"
                value={d.date}
                onChange={(e) => e.target.value && set('date', e.target.value)}
              />
              <small className="sch-hint">{dateLabel}</small>
            </div>
          )}

          <div className="sch-row2">
            <label className="sch-field">
              <span>Bắt đầu</span>
              <input className="sch-input" type="time" value={d.start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="sch-field">
              <span>Kết thúc</span>
              <input className="sch-input" type="time" value={d.end} onChange={(e) => set('end', e.target.value)} />
            </label>
          </div>

          <div className="sch-field">
            <span>Màu</span>
            <div className="sch-colors">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={d.color === c.key ? 'on' : ''}
                  style={{ '--c': c.rgb }}
                  onClick={() => set('color', c.key)}
                  aria-label={c.label}
                  aria-pressed={d.color === c.key}
                />
              ))}
            </div>
          </div>

          <label className="sch-field">
            <span>Ghi chú</span>
            <textarea
              className="sch-input"
              rows={2}
              value={d.note || ''}
              placeholder="Không bắt buộc"
              onChange={(e) => set('note', e.target.value)}
            />
          </label>

          <label className="sch-switch-row">
            <span className="sch-switch-label"><IcoBell size={17} /> Nhắc khi đến giờ</span>
            <input type="checkbox" checked={d.remind} onChange={(e) => set('remind', e.target.checked)} />
            <i className="sch-switch" aria-hidden="true" />
          </label>

          {err && <p className="sch-err" role="alert">{err}</p>}
        </div>

        <footer className="sch-sheet-foot">
          {editing && (
            <button type="button" className="sch-btn danger" onClick={() => onDelete(d.id)}>
              <IcoTrash size={15} /> Xóa
            </button>
          )}
          <span className="sch-spacer" />
          <button type="button" className="sch-btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="sch-btn primary">Lưu</button>
        </footer>
      </form>
    </div>
  );
}

/* ============================================================
   DÒNG THỜI GIAN
   ============================================================ */
function Timeline({ events, isToday, nowMin, isDone, statusOf, onOpen, onToggle }) {
  const items = useMemo(() => layoutDay(events), [events]);
  const mins = events.flatMap((e) => [toMin(e.start), toMin(e.end)]);
  const lo = mins.length ? Math.min(...mins) : 420;
  const hi = mins.length ? Math.max(...mins) : 1260;
  const fromH = Math.min(6, Math.floor(lo / 60));
  const toH = Math.min(24, Math.max(22, Math.ceil(hi / 60)));
  const height = (toH - fromH) * HOUR_H;
  const hours = Array.from({ length: toH - fromH + 1 }, (_, i) => fromH + i);
  const nowTop = ((nowMin - fromH * 60) / 60) * HOUR_H;

  return (
    <div className="sch-timeline" style={{ height }}>
      {hours.map((h) => (
        <div key={h} className="sch-hour" style={{ top: (h - fromH) * HOUR_H }}>
          <span>{String(h).padStart(2, '0')}:00</span>
        </div>
      ))}
      <div className="sch-track">
        {items.map(({ ev, s, e, col, cols }) => {
          const top = ((s - fromH * 60) / 60) * HOUR_H;
          const h = Math.max(30, ((e - s) / 60) * HOUR_H - 2);
          const st = statusOf(ev);
          const done = isDone(ev);
          return (
            <div
              key={ev.id}
              role="button"
              tabIndex={0}
              className={`sch-block ${st} ${done ? 'done' : ''}`}
              style={{
                top,
                height: h,
                left: `calc(${(col / cols) * 100}% + 2px)`,
                width: `calc(${100 / cols}% - 4px)`,
                '--t': colorOf(ev.color).rgb,
              }}
              onClick={() => onOpen(ev)}
              onKeyDown={(k) => k.key === 'Enter' && onOpen(ev)}
            >
              <div className="sch-block-main">
                <b>{ev.title}</b>
                {h >= 44 && <small>{ev.start} – {ev.end}</small>}
              </div>
              <button
                type="button"
                className={`sch-check ${done ? 'on' : ''}`}
                onClick={(k) => { k.stopPropagation(); onToggle(ev); }}
                aria-label={done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
              >
                <IcoCheck size={13} />
              </button>
            </div>
          );
        })}
        {isToday && nowTop >= 0 && nowTop <= height && (
          <div className="sch-now" style={{ top: nowTop }}><i /></div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TRANG CHÍNH
   ============================================================ */
export default function Schedule() {
  const { events, setEvents, done, toggleDone } = useSchedule();
  const [sel, setSel] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState('timeline');
  const [modal, setModal] = useState(null); // { ev?: event }
  const [toast, setToast] = useState('');
  const fired = useRef(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  /* Nhắc khi đến giờ bắt đầu */
  useEffect(() => {
    const nm = now.getHours() * 60 + now.getMinutes();
    const key = dateKey(now);
    eventsOn(events, now).forEach((ev) => {
      if (!ev.remind) return;
      const s = toMin(ev.start);
      if (nm >= s && nm < s + 2) {
        const fk = `${ev.id}@${key}`;
        if (fired.current.has(fk)) return;
        fired.current.add(fk);
        setToast(`Đến giờ: ${ev.title} (${ev.start})`);
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification('Đến giờ rồi', { body: `${ev.title} · ${ev.start}–${ev.end}` }); } catch { /* */ }
        }
      }
    });
  }, [now, events]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(id);
  }, [toast]);

  const weekDays = useMemo(() => {
    const ws = startOfWeek(sel);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [sel]);

  const selKey = dateKey(sel);
  const todayKey = dateKey(now);
  const isToday = selKey === todayKey;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayEvents = useMemo(() => eventsOn(events, sel), [events, sel]);
  const isDone = (ev) => !!done[doneKey(ev.id, sel)];
  const doneCount = dayEvents.filter(isDone).length;
  const pct = dayEvents.length ? Math.round((doneCount / dayEvents.length) * 100) : 0;

  const statusOf = (ev) => {
    if (!isToday) return '';
    const s = toMin(ev.start);
    const e = toMin(ev.end);
    if (nowMin >= s && nowMin < e) return 'now';
    if (nowMin >= e) return 'past';
    return 'soon';
  };
  const current = isToday ? dayEvents.find((e) => statusOf(e) === 'now') : null;
  const next = isToday ? dayEvents.find((e) => statusOf(e) === 'soon') : null;

  const openNew = () => {
    let startMin = 420;
    if (isToday) startMin = Math.min(1320, Math.ceil((nowMin + 1) / 15) * 15);
    setModal({
      defaults: {
        date: selKey,
        day: sel.getDay(),
        start: minToStr(startMin),
        end: minToStr(Math.min(1439, startMin + 45)),
      },
    });
  };
  const openEdit = (ev) => setModal({ ev, defaults: { date: selKey, day: sel.getDay() } });

  const save = (ev) => {
    if (ev.id) setEvents((list) => list.map((x) => (x.id === ev.id ? { ...x, ...ev } : x)));
    else setEvents((list) => [...list, { ...ev, id: Date.now() }]);
    if (ev.remind && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setModal(null);
  };
  const remove = (id) => {
    setEvents((list) => list.filter((x) => x.id !== id));
    setModal(null);
  };
  const addSample = () => {
    const base = Date.now();
    setEvents((list) => [
      ...list,
      ...SAMPLE.map((s, i) => ({ ...s, id: base + i, note: '', remind: true, date: null })),
    ]);
  };

  const monthLabel = sel.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const dayLabel = `${DAY_LONG[sel.getDay()]}, ${sel.getDate()}/${sel.getMonth() + 1}`;

  const toggleFor = (ev) => toggleDone(ev.id, sel);

  return (
    <div className="sch-wrap">
      <div className="sch-ambient" aria-hidden="true" />

      <header className="sch-head">
        <div>
          <p className="sch-eyebrow">{monthLabel}</p>
          <h1>Thời khóa biểu</h1>
          <p className="sch-sub">Tự lập lịch học của bạn, nhắc đúng giờ và theo dõi tiến độ mỗi ngày.</p>
        </div>
        <button type="button" className="sch-btn primary lg" onClick={openNew}>
          <IcoPlus size={18} /> Thêm lịch
        </button>
      </header>

      {/* Dải chọn tuần */}
      <section className="sch-week" aria-label="Chọn ngày">
        <button type="button" className="sch-icon-btn" onClick={() => setSel(addDays(sel, -7))} aria-label="Tuần trước">
          <IcoLeft size={18} />
        </button>
        <div className="sch-week-days">
          {weekDays.map((d) => {
            const k = dateKey(d);
            const has = eventsOn(events, d).length > 0;
            return (
              <button
                key={k}
                type="button"
                className={`sch-day ${k === selKey ? 'on' : ''} ${k === todayKey ? 'today' : ''}`}
                onClick={() => setSel(d)}
                aria-pressed={k === selKey}
              >
                <small>{DAY_SHORT[d.getDay()]}</small>
                <b>{d.getDate()}</b>
                <i className={has ? 'dot' : ''} />
              </button>
            );
          })}
        </div>
        <button type="button" className="sch-icon-btn" onClick={() => setSel(addDays(sel, 7))} aria-label="Tuần sau">
          <IcoRight size={18} />
        </button>
      </section>

      {/* Tóm tắt trong ngày */}
      <section className="sch-summary" style={{ '--t': current ? colorOf(current.color).rgb : '10,132,255' }}>
        <div className="sch-summary-main">
          <p className="sch-eyebrow">{dayLabel}{isToday ? ' · Hôm nay' : ''}</p>
          {current ? (
            <>
              <h2><span className="live-dot" /> Đang diễn ra: {current.title}</h2>
              <p>
                {current.start} – {current.end} · còn {fmtDur(toMin(current.end) - nowMin)}
              </p>
              <div className="sch-bar"><i style={{ width: `${Math.min(100, ((nowMin - toMin(current.start)) / Math.max(1, toMin(current.end) - toMin(current.start))) * 100)}%` }} /></div>
            </>
          ) : next ? (
            <>
              <h2>Tiếp theo: {next.title}</h2>
              <p>Lúc {next.start} · còn {fmtDur(toMin(next.start) - nowMin)}</p>
            </>
          ) : dayEvents.length ? (
            <>
              <h2>{isToday ? 'Bạn đã hết lịch hôm nay' : `${dayEvents.length} hoạt động trong ngày`}</h2>
              <p>{doneCount}/{dayEvents.length} hoạt động đã hoàn thành</p>
            </>
          ) : (
            <>
              <h2>Ngày trống</h2>
              <p>Chưa có hoạt động nào. Thêm lịch để bắt đầu.</p>
            </>
          )}
        </div>
        <div className="sch-summary-side">
          <div className="sch-ring" style={{ '--p': pct }}>
            <b>{pct}%</b>
          </div>
          <small>{doneCount}/{dayEvents.length} xong</small>
          <a className="sch-btn" href="#pomodoro"><IcoTimer size={15} /> Pomodoro</a>
        </div>
      </section>

      {/* Chọn kiểu xem */}
      {dayEvents.length > 0 && (
        <div className="sch-viewbar">
          <div className="sch-seg">
            <button type="button" className={view === 'timeline' ? 'on' : ''} onClick={() => setView('timeline')}>
              <IcoRows size={15} /> Dòng thời gian
            </button>
            <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
              <IcoList size={15} /> Danh sách
            </button>
          </div>
          {!isToday && (
            <button type="button" className="sch-btn" onClick={() => setSel(new Date())}>Về hôm nay</button>
          )}
        </div>
      )}

      {/* Nội dung ngày */}
      <section className="sch-day-card">
        {dayEvents.length === 0 ? (
          <div className="sch-empty">
            <div className="sch-empty-ico"><IcoCal size={30} /></div>
            <h3>Chưa có lịch cho ngày này</h3>
            <p>Thêm hoạt động học tập, ôn bài hoặc nghỉ ngơi để sắp xếp ngày của bạn.</p>
            <div className="sch-empty-actions">
              <button type="button" className="sch-btn primary" onClick={openNew}><IcoPlus size={16} /> Thêm lịch</button>
              {events.length === 0 && (
                <button type="button" className="sch-btn" onClick={addSample}>Dùng mẫu gợi ý</button>
              )}
              {!isToday && <button type="button" className="sch-btn" onClick={() => setSel(new Date())}>Về hôm nay</button>}
            </div>
          </div>
        ) : view === 'timeline' ? (
          <Timeline
            events={dayEvents}
            isToday={isToday}
            nowMin={nowMin}
            isDone={isDone}
            statusOf={statusOf}
            onOpen={openEdit}
            onToggle={toggleFor}
          />
        ) : (
          <ul className="sch-list">
            {dayEvents.map((ev) => {
              const st = statusOf(ev);
              const dn = isDone(ev);
              return (
                <li
                  key={ev.id}
                  className={`sch-item ${st} ${dn ? 'done' : ''}`}
                  style={{ '--t': colorOf(ev.color).rgb }}
                >
                  <button
                    type="button"
                    className={`sch-check lg ${dn ? 'on' : ''}`}
                    onClick={() => toggleFor(ev)}
                    aria-label={dn ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
                  >
                    <IcoCheck size={15} />
                  </button>
                  <button type="button" className="sch-item-body" onClick={() => openEdit(ev)}>
                    <span className="sch-item-time">{ev.start} – {ev.end}</span>
                    <b>{ev.title}</b>
                    {ev.note && <small>{ev.note}</small>}
                  </button>
                  {st === 'now' && <span className="sch-chip">Đang diễn ra</span>}
                  {st === 'soon' && ev === next && <span className="sch-chip soft">Tiếp theo</span>}
                  {ev.remind && <span className="sch-item-bell" title="Có nhắc giờ"><IcoBell size={15} /></span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {toast && (
        <div className="sch-toast" role="status">
          <IcoBell size={18} />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} aria-label="Đóng"><IcoClose size={14} /></button>
        </div>
      )}

      {modal && (
        <EventModal
          initial={modal.ev}
          defaults={modal.defaults}
          onSave={save}
          onDelete={remove}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}