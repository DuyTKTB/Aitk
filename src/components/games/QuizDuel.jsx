/* ============================================================
   QuizDuel.jsx — THÁCH ĐẤU QUIZ 1-1 REALTIME (Firestore)
   Tạo phòng → nhận mã → bạn bè join bằng mã (hoặc từ phòng chờ)
   → cả 2 làm cùng 5 câu → ai đúng nhanh hơn ăn điểm cao hơn.
   Firestore: duels/{code} — realtime qua onSnapshot
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalStorage } from '../../hooks.js';
import { db } from '../../lib/firebase.js';
import {
  collection, doc, setDoc, updateDoc, deleteDoc, query, where, limit,
  getDocs, onSnapshot,
} from 'firebase/firestore';
import { fetchBankQuestions } from '../../lib/gameQuestionBank.js';

const A = {
  page: { minHeight: '100dvh', background: 'var(--t-bg, #f4f6fb)', color: 'var(--t-ink, #0f172a)', fontFamily: 'var(--t-font-sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 680, margin: '0 auto', padding: '1.2rem 1rem 3rem' },
  card: { background: 'var(--t-surface-2, #fff)', border: '1px solid var(--t-border, rgba(100,120,180,.16))', borderRadius: 20, boxShadow: 'var(--t-shadow-sm)' },
  btn: { padding: '.65rem 1.4rem', borderRadius: 999, border: 'none', background: 'var(--t-accent, #5b6cff)', color: 'var(--t-accent-ink, #fff)', font: '700 .88rem var(--t-font-sans)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.45rem' },
};
const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const QUESTION_MS = 20000;

export default function QuizDuel() {
  const { user } = useAuth();
  const uid = user?.uid || user?.id;
  const name = user?.displayName || user?.email?.split('@')[0] || 'Khách';
  const [duelCode, setDuelCode] = useState(null);   // phòng mình đang ở
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [err, setErr] = useState('');
  const [wl, setWl] = useLocalStorage('cs-duel-wl', { w: 0, l: 0, d: 0 });
  const [now, setNow] = useState(Date.now());
  const stateRef = useRef(null); stateRef.current = { uid, name };

  /* Danh sách phòng đang chờ */
  useEffect(() => {
    if (!uid) return undefined;
    const q = query(collection(db, 'duels'), where('status', '==', 'open'), limit(10));
    return onSnapshot(q, (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.host?.uid !== uid)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRooms(rows);
    }, () => setRooms([]));
  }, [uid]);

  /* Đồng hồ local cho câu đang chơi */
  useEffect(() => {
    if (!duelCode) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [duelCode]);

  /* Lắng nghe phòng hiện tại */
  const [duel, setDuel] = useState(null);
  useEffect(() => {
    if (!duelCode) { setDuel(null); return undefined; }
    return onSnapshot(doc(db, 'duels', duelCode), (snap) => {
      if (!snap.exists()) { setErr('Phòng đã bị hủy.'); setDuelCode(null); return; }
      setDuel({ id: snap.id, ...snap.data() });
    }, () => setErr('Mất kết nối tới phòng.'));
  }, [duelCode]);

  useEffect(() => {
    if (!err) return undefined;
    const t = setTimeout(() => setErr(''), 4000);
    return () => clearTimeout(t);
  }, [err]);

  /* ===== Tạo phòng ===== */
  const create = async () => {
    if (!uid || !user) { setErr('Cần đăng nhập để thách đấu.'); return; }
    try {
      const res = await fetchBankQuestions({ maxAnswerLen: 80, minWrong: 3, pool: 300 });
      const bank = (res?.eligible || []).filter((q) => (q.wrong || []).length >= 3);
      if (bank.length < 5) { setErr('Ngân hàng câu hỏi chưa đủ — hãy xuất bản thêm đề.'); return; }
      const picked = [...bank].sort(() => Math.random() - 0.5).slice(0, 5).map((q) => {
        const opts = [q.correct, ...[...(q.wrong || [])].sort(() => Math.random() - 0.5).slice(0, 3)];
        const order = [...opts].sort(() => Math.random() - 0.5);
        return { q: q.question, opts: order, correct: order.indexOf(q.correct) };
      });
      const code = code6();
      await setDoc(doc(db, 'duels', code), {
        host: { uid, name },
        guest: null,
        status: 'open',
        qs: picked,
        picks: {},
        createdAt: Date.now(),
      });
      setDuelCode(code);
    } catch (e) {
      setErr(e.message || 'Không tạo được phòng.');
    }
  };

  /* ===== Join phòng ===== */
  const join = async (code) => {
    if (!uid) { setErr('Cần đăng nhập để thách đấu.'); return; }
    const c = String(code || '').trim().toUpperCase();
    if (!c) return;
    try {
      const snap = await getDocs(query(collection(db, 'duels'), limit(50)));
      const target = snap.docs.find((d) => d.id === c);
      if (!target) { setErr('Không tìm thấy phòng — kiểm tra lại mã.'); return; }
      const d = target.data();
      if (d.status !== 'open') { setErr('Phòng đã bắt đầu hoặc đã xong.'); return; }
      if (d.host?.uid === uid) { setDuelCode(c); return; }
      await updateDoc(doc(db, 'duels', c), {
        guest: { uid, name },
        status: 'playing',
        startedAt: Date.now(),
      });
      setDuelCode(c);
    } catch (e) {
      setErr(e.message || 'Không vào được phòng.');
    }
  };

  /* ===== Chơi: trả lời câu i ===== */
  const answer = async (optIdx, spentMs) => {
    if (!duel || !uid) return;
    const idx = currentIdx(duel);
    if (idx == null || idx >= duel.qs.length) return;
    const mine = duel.picks?.[uid] || [];
    if (mine.length > idx) return; // đã chọn
    const bonus = Math.max(0, Math.round(50 * (1 - (spentMs || QUESTION_MS) / QUESTION_MS)));
    const pts = optIdx === duel.qs[idx].correct ? 100 + bonus : 0;
    const nextPicks = [...mine, { o: optIdx, t: pts }];
    await updateDoc(doc(db, 'duels', duel.id), { [`picks.${uid}`]: nextPicks });
  };

  const currentIdx = (d) => {
    if (!d || d.status !== 'playing') return d?.status === 'open' && !d.guest ? 0 : null;
    const uids = [d.host?.uid, d.guest?.uid].filter(Boolean);
    const lens = uids.map((u) => (d.picks?.[u] || []).length);
    return Math.min(...lens);
  };

  const scores = useMemo(() => {
    if (!duel) return {};
    const out = {};
    for (const u of [duel.host?.uid, duel.guest?.uid].filter(Boolean)) {
      out[u] = (duel.picks?.[u] || []).reduce((s, p) => s + (p.t || 0), 0);
    }
    return out;
  }, [duel]);

  /* Kết thúc: cả 2 trả lời đủ 5 câu */
  const finished = duel && duel.status === 'playing' && currentIdx(duel) >= duel.qs.length;
  useEffect(() => {
    if (!finished || !duel || !uid) return;
    if (duel.status !== 'done') {
      updateDoc(doc(db, 'duels', duel.id), { status: 'done', endedAt: Date.now() }).catch(() => {});
    }
    const oppUid = uid === duel.host?.uid ? duel.guest?.uid : duel.host?.uid;
    const my = (duel.picks?.[uid] || []).reduce((s, p) => s + (p.t || 0), 0);
    const opp = (duel.picks?.[oppUid] || []).reduce((s, p) => s + (p.t || 0), 0);
    setWl((w) => ({
      w: w.w + (my > opp ? 1 : 0),
      l: w.l + (my < opp ? 1 : 0),
      d: w.d + (my === opp ? 1 : 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const leave = async () => {
    try {
      if (duel && duel.status === 'open' && duel.host?.uid === uid) {
        await deleteDoc(doc(db, 'duels', duel.id));
      }
    } catch { /* bỏ qua */ }
    setDuelCode(null); setDuel(null);
  };

  /* ================= RENDER ================= */
  if (!uid) {
    return (
      <div style={A.page}><div style={A.wrap}>
        <Header />
        <div style={{ ...A.card, padding: '2rem', textAlign: 'center', color: 'var(--t-ink-muted, #64748b)', font: '500 .9rem var(--t-font-sans)' }}>
          Đăng nhập để thách đấu bạn bè!
        </div>
      </div></div>
    );
  }

  /* ---- ĐANG CHƠI / KẾT QUẢ ---- */
  if (duel && (duel.status === 'playing' || duel.status === 'done')) {
    const idx = currentIdx(duel);
    const oppUid = uid === duel.host?.uid ? duel.guest?.uid : duel.host?.uid;
    const oppName = (uid === duel.host?.uid ? duel.guest?.name : duel.host?.name) || 'Đối thủ';
    const q = idx != null && idx < duel.qs.length ? duel.qs[idx] : null;
    const mine = duel.picks?.[uid] || [];
    const qStartAt = duel.startedAt || 0;
    const spent = now - qStartAt - idx * QUESTION_MS;
    const waiting = duel.status === 'playing' && mine.length <= idx && (duel.picks?.[oppUid] || []).length <= idx;

    return (
      <div style={A.page}><div style={A.wrap}>
        <Header />
        <div style={{ ...A.card, padding: '1.3rem 1.2rem' }}>
          {/* Scoreboard */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <b style={{ font: '800 .85rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)' }}>Bạn</b>
              <div style={{ font: '800 1.6rem var(--t-font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                {(scores[uid] || 0)}
              </div>
            </div>
            <small style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '700 .72rem var(--t-font-sans)' }}>VS</small>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <b style={{ font: '800 .85rem var(--t-font-sans)', color: '#f59e0b' }}>{oppName}</b>
              <div style={{ font: '800 1.6rem var(--t-font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                {scores[oppUid] || 0}
              </div>
            </div>
          </div>

          {duel.status === 'done' || finished ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ font: '800 1.6rem var(--t-font-sans)', color: (scores[uid] || 0) > (scores[oppUid] || 0) ? 'var(--t-status-ok, #16a34a)' : (scores[uid] || 0) < (scores[oppUid] || 0) ? 'var(--t-status-err, #dc2626)' : 'var(--t-ink-muted)' }}>
                {(scores[uid] || 0) > (scores[oppUid] || 0) ? 'THẮNG!' : (scores[uid] || 0) < (scores[oppUid] || 0) ? 'THUA — lục lại kiến thức nhé!' : 'HÒA!'}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1rem 0' }}>
                <small style={{ font: '700 .78rem var(--t-font-sans)', color: 'var(--t-status-ok, #16a34a)' }}>Thắng: {wl.w}</small>
                <small style={{ font: '700 .78rem var(--t-font-sans)', color: 'var(--t-status-err, #dc2626)' }}>Thua: {wl.l}</small>
                <small style={{ font: '700 .78rem var(--t-font-sans)', color: 'var(--t-ink-muted)' }}>Hòa: {wl.d}</small>
              </div>
              <button type="button" style={A.btn} onClick={leave}>Đấu tiếp</button>
            </div>
          ) : q ? (
            <>
              <div style={{ height: 5, borderRadius: 999, background: 'var(--t-surface-3, #eef1f8)', overflow: 'hidden', marginBottom: '.9rem' }}>
                <div style={{ width: `${(idx / duel.qs.length) * 100}%`, height: '100%', background: 'var(--t-accent, #5b6cff)', transition: 'width .3s' }} />
              </div>
              <small style={{ font: '700 .68rem var(--t-font-sans)', color: 'var(--t-ink-faint, #94a3b8)' }}>Câu {idx + 1}/{duel.qs.length}</small>
              {mine.length > idx ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--t-ink-muted, #64748b)', font: '600 .85rem var(--t-font-sans)' }}>
                  Đã trả lời — chờ đối thủ…
                </div>
              ) : (
                <>
                  <div style={{ font: '700 1.05rem var(--t-font-sans)', color: 'var(--t-ink)', lineHeight: 1.5, margin: '.4rem 0 1rem', whiteSpace: 'pre-wrap' }}>{q.q}</div>
                  <div style={{ display: 'grid', gap: '.5rem' }}>
                    {q.opts.map((o, i) => (
                      <button key={i} type="button" onClick={() => answer(i, Math.min(spent, QUESTION_MS))}
                        style={{
                          textAlign: 'left', padding: '.7rem .95rem', borderRadius: 14, cursor: 'pointer',
                          border: '1.5px solid var(--t-border, rgba(100,120,180,.16))', background: 'var(--t-surface-2, #fff)',
                          color: 'var(--t-ink)', font: '500 .9rem var(--t-font-sans)', lineHeight: 1.4,
                          transition: 'border-color .15s, transform .1s',
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.borderColor = 'var(--t-accent, #5b6cff)'; }}
                      >
                        <b style={{ color: 'var(--t-accent, #5b6cff)', marginRight: '.5rem' }}>{String.fromCharCode(65 + i)}</b>{o}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '.9rem', font: '700 .8rem var(--t-font-sans)', color: spent > QUESTION_MS ? 'var(--t-status-err, #dc2626)' : 'var(--t-ink-faint, #94a3b8)' }}>
Còn {Math.max(0, Math.ceil((QUESTION_MS - spent) / 1000))}s — trả lời nhanh để ăn thêm điểm tốc độ!
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--t-ink-muted, #64748b)', font: '600 .85rem var(--t-font-sans)' }}>
              {waiting ? 'Đang chờ…' : 'Sẵn sàng!'}
            </div>
          )}
        </div>
      </div></div>
    );
  }

  /* ---- PHÒNG CHỜ (host) ---- */
  if (duel && duel.status === 'open') {
    return (
      <div style={A.page}><div style={A.wrap}>
        <Header />
        <div style={{ ...A.card, padding: '1.8rem 1.4rem', textAlign: 'center' }}>
          <small style={{ font: '700 .7rem var(--t-font-sans)', color: 'var(--t-ink-faint, #94a3b8)' }}>MÃ PHÒNG</small>
          <div style={{ font: '900 2.6rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)', letterSpacing: '.2em', margin: '.3rem 0 .6rem' }}>
            {duel.id}
          </div>
          <p style={{ color: 'var(--t-ink-muted, #64748b)', font: '500 .84rem var(--t-font-sans)', margin: '0 0 1.2rem' }}>
            Gửi mã này cho bạn bè — họ nhập mã ở trang Thách đấu để vào phòng.<br />5 câu · 20 giây/câu · đúng nhanh ăn thêm điểm.
          </p>
          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" style={A.btn} onClick={() => { navigator.clipboard?.writeText(duel.id); }}>Copy mã phòng</button>
            <button type="button" style={{ ...A.btn, background: 'var(--t-surface-3, #eef1f8)', color: 'var(--t-ink)' }} onClick={leave}>Hủy phòng</button>
          </div>
        </div>
      </div></div>
    );
  }

  /* ---- LOBBY ---- */
  return (
    <div style={A.page}><div style={A.wrap}>
      <Header />
      {err && (
        <p style={{ margin: '0 0 .7rem', padding: '.55rem .9rem', borderRadius: 12, background: 'rgba(239,68,68,.09)', color: '#ef4444', font: '600 .8rem var(--t-font-sans)' }}>{err}</p>
      )}

      <div style={{ ...A.card, padding: '1.2rem', marginBottom: '.9rem' }}>
        <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Tạo phòng mới</b>
        <p style={{ color: 'var(--t-ink-muted, #64748b)', font: '500 .8rem var(--t-font-sans)', margin: '.25rem 0 .8rem' }}>
          5 câu hỏi ngẫu nhiên từ ngân hàng đề — thách bạn bè xem ai nhanh và chính xác hơn.
        </p>
        <button type="button" style={A.btn} onClick={create}>Tạo phòng thách đấu</button>
      </div>

      <div style={{ ...A.card, padding: '1.2rem', marginBottom: '.9rem' }}>
        <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Vào bằng mã phòng</b>
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem' }}>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="VD: K3X9A2"
            maxLength={6}
            style={{ flex: 1, padding: '.6rem .9rem', borderRadius: 12, border: '1px solid var(--t-border, rgba(100,120,180,.16))', background: 'var(--t-surface-3, #f8fafc)', color: 'var(--t-ink)', font: '700 1rem var(--t-font-sans)', letterSpacing: '.15em', outline: 'none', textAlign: 'center' }}
          />
          <button type="button" style={A.btn} onClick={() => join(joinCode)}>Vào phòng</button>
        </div>
      </div>

      <div style={{ ...A.card, padding: '1.2rem' }}>
        <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Phòng đang chờ đối thủ</b>
        {rooms.length === 0 ? (
          <p style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '500 .8rem var(--t-font-sans)', margin: '.5rem 0 0' }}>
            Chưa có phòng nào — hãy tạo phòng đầu tiên!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '.4rem', marginTop: '.6rem' }}>
            {rooms.map((r) => (
              <button key={r.id} type="button" onClick={() => join(r.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem',
                  padding: '.6rem .8rem', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid var(--t-border, rgba(100,120,180,.16))', background: 'var(--t-surface-3, #f8fafc)',
                  color: 'var(--t-ink)', font: '500 .84rem var(--t-font-sans)',
                }}>
                <span><b>{r.host?.name || 'Học sinh'}</b> đang chờ…</span>
                <small style={{ font: '700 .72rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)' }}>{r.id} → Vào</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div></div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h1 style={{ margin: 0, font: '800 1.4rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Thách đấu Quiz</h1>
      <p style={{ margin: '.15rem 0 0', color: 'var(--t-ink-muted, #64748b)', font: '500 .84rem var(--t-font-sans)' }}>
        Đấu quiz 1-1 realtime — 5 câu, 20 giây/câu, điểm tốc độ tối đa +50
      </p>
    </div>
  );
}
