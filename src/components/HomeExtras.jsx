import { useEffect, useMemo, useRef, useState } from 'react';
import { IcoCheck, IcoX, IcoChevronDown, IcoArrowRight, IcoSparkle } from './Icons.jsx';
import './home-extras.css';

/* ============================================================
   HOME EXTRAS — các khối tương tác thêm vào trang chủ
   1. Mỗi ngày một chút : Nguyên tố hôm nay · Thử sức 10 giây · Đếm ngược kỳ thi
   2. Phòng thí nghiệm  : Thang pH · Phản ứng hóa học
   3. AI trong 10 giây  : demo 3 chế độ
   4. Lộ trình theo lớp : 10 / 11 / 12
   5. Câu hỏi thường gặp
   Tự chứa dữ liệu, không phụ thuộc file khác (chỉ cần Icons.jsx).
   ============================================================ */

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function Head({ tag, children }) {
  return (
    <div className="fx-head solo hx2-head">
      <div>
        <p className="slogan plain">{tag}</p>
        <h2 className="fx-title">{children}</h2>
      </div>
    </div>
  );
}

/* ============================================================
   1A. NGUYÊN TỐ HÔM NAY
   ============================================================ */
const CAT_NAME = {
  alkali: 'Kim loại kiềm',
  alkaline: 'Kim loại kiềm thổ',
  transition: 'Kim loại chuyển tiếp',
  post: 'Kim loại sau chuyển tiếp',
  metalloid: 'Á kim',
  nonmetal: 'Phi kim',
  halogen: 'Halogen',
  noble: 'Khí hiếm',
};

const ELEMENTS = [
  { z: 1, s: 'H', name: 'Hiđro', m: '1,008', cfg: '1s¹', cat: 'nonmetal', fact: 'Là nguyên tố nhẹ nhất và phổ biến nhất trong vũ trụ.' },
  { z: 2, s: 'He', name: 'Heli', m: '4,0026', cfg: '1s²', cat: 'noble', fact: 'Được phát hiện trên Mặt Trời (qua quang phổ) trước khi tìm thấy trên Trái Đất.' },
  { z: 3, s: 'Li', name: 'Liti', m: '6,94', cfg: '[He] 2s¹', cat: 'alkali', fact: 'Là kim loại nhẹ nhất, dùng làm pin lithium-ion trong điện thoại.' },
  { z: 6, s: 'C', name: 'Cacbon', m: '12,011', cfg: '[He] 2s² 2p²', cat: 'nonmetal', fact: 'Kim cương và than chì đều chỉ gồm các nguyên tử cacbon, khác nhau ở cách sắp xếp.' },
  { z: 7, s: 'N', name: 'Nitơ', m: '14,007', cfg: '[He] 2s² 2p³', cat: 'nonmetal', fact: 'Chiếm khoảng 78% thể tích khí quyển Trái Đất.' },
  { z: 8, s: 'O', name: 'Oxi', m: '15,999', cfg: '[He] 2s² 2p⁴', cat: 'nonmetal', fact: 'Chiếm khoảng 21% thể tích không khí, cần cho sự cháy và hô hấp.' },
  { z: 9, s: 'F', name: 'Flo', m: '18,998', cfg: '[He] 2s² 2p⁵', cat: 'halogen', fact: 'Là phi kim có độ âm điện lớn nhất trong bảng tuần hoàn.' },
  { z: 11, s: 'Na', name: 'Natri', m: '22,990', cfg: '[Ne] 3s¹', cat: 'alkali', fact: 'Phản ứng mạnh với nước nên thường được bảo quản ngâm trong dầu hỏa.' },
  { z: 12, s: 'Mg', name: 'Magie', m: '24,305', cfg: '[Ne] 3s²', cat: 'alkaline', fact: 'Cháy với ngọn lửa trắng chói và là nguyên tử trung tâm của diệp lục ở thực vật.' },
  { z: 13, s: 'Al', name: 'Nhôm', m: '26,982', cfg: '[Ne] 3s² 3p¹', cat: 'post', fact: 'Là kim loại phổ biến nhất trong vỏ Trái Đất, tự tạo lớp oxit mỏng bảo vệ bề mặt.' },
  { z: 14, s: 'Si', name: 'Silic', m: '28,085', cfg: '[Ne] 3s² 3p²', cat: 'metalloid', fact: 'Là nền tảng của chip bán dẫn; cát chủ yếu là silic đioxit (SiO₂).' },
  { z: 15, s: 'P', name: 'Photpho', m: '30,974', cfg: '[Ne] 3s² 3p³', cat: 'nonmetal', fact: 'Photpho trắng tự bốc cháy trong không khí nên được bảo quản dưới nước.' },
  { z: 16, s: 'S', name: 'Lưu huỳnh', m: '32,06', cfg: '[Ne] 3s² 3p⁴', cat: 'nonmetal', fact: 'Là chất rắn màu vàng, nguyên liệu chính để sản xuất axit sunfuric.' },
  { z: 17, s: 'Cl', name: 'Clo', m: '35,45', cfg: '[Ne] 3s² 3p⁵', cat: 'halogen', fact: 'Khí clo màu vàng lục, được dùng để khử trùng nước sinh hoạt.' },
  { z: 19, s: 'K', name: 'Kali', m: '39,098', cfg: '[Ar] 4s¹', cat: 'alkali', fact: 'Cần cho cây trồng (phân kali); khi đốt cho ngọn lửa màu tím.' },
  { z: 20, s: 'Ca', name: 'Canxi', m: '40,078', cfg: '[Ar] 4s²', cat: 'alkaline', fact: 'Có trong xương, răng, vỏ trứng và đá vôi (CaCO₃).' },
  { z: 26, s: 'Fe', name: 'Sắt', m: '55,845', cfg: '[Ar] 3d⁶ 4s²', cat: 'transition', fact: 'Là thành phần chính của thép, và có trong hemoglobin giúp vận chuyển oxi trong máu.' },
  { z: 29, s: 'Cu', name: 'Đồng', m: '63,546', cfg: '[Ar] 3d¹⁰ 4s¹', cat: 'transition', fact: 'Dẫn điện tốt, chỉ sau bạc; lâu ngày bị phủ lớp gỉ màu xanh lục.' },
  { z: 30, s: 'Zn', name: 'Kẽm', m: '65,38', cfg: '[Ar] 3d¹⁰ 4s²', cat: 'transition', fact: 'Được dùng mạ lên sắt (tôn) để chống gỉ.' },
  { z: 47, s: 'Ag', name: 'Bạc', m: '107,87', cfg: '[Kr] 4d¹⁰ 5s¹', cat: 'transition', fact: 'Là kim loại dẫn điện và dẫn nhiệt tốt nhất.' },
  { z: 79, s: 'Au', name: 'Vàng', m: '196,97', cfg: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', cat: 'transition', fact: 'Rất trơ, không bị oxi hóa trong không khí; chỉ tan trong nước cường toan.' },
  { z: 80, s: 'Hg', name: 'Thủy ngân', m: '200,59', cfg: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', cat: 'transition', fact: 'Là kim loại ở thể lỏng trong điều kiện thường, hơi của nó rất độc.' },
  { z: 82, s: 'Pb', name: 'Chì', m: '207,2', cfg: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', cat: 'post', fact: 'Dùng trong ắc quy axit–chì; độc với hệ thần kinh nên đã bị hạn chế dùng.' },
];

function DailyElement() {
  const today = Math.floor(Date.now() / 86400000) % ELEMENTS.length;
  const [i, setI] = useState(today);
  const [manual, setManual] = useState(false);
  const e = ELEMENTS[i];

  const another = () => {
    setManual(true);
    setI((cur) => {
      let n = cur;
      while (n === cur) n = Math.floor(Math.random() * ELEMENTS.length);
      return n;
    });
  };

  return (
    <article className="hx2-card hx2-el" data-cat={e.cat}>
      <header className="hx2-card-head">
        <span className="hx2-badge">{manual ? 'Ngẫu nhiên' : 'Nguyên tố hôm nay'}</span>
        <button type="button" className="hx2-ghost" onClick={another}>Đổi nguyên tố</button>
      </header>

      <div className="hx2-el-main">
        <div className="hx2-tile" aria-hidden="true">
          <small>{e.z}</small>
          <b>{e.s}</b>
          <span>{e.m}</span>
        </div>
        <div>
          <h3>{e.name}</h3>
          <p className="hx2-mut">{CAT_NAME[e.cat]}</p>
        </div>
      </div>

      <dl className="hx2-dl">
        <div><dt>Số hiệu</dt><dd>{e.z}</dd></div>
        <div><dt>Khối lượng</dt><dd>{e.m}</dd></div>
        <div className="wide"><dt>Cấu hình electron</dt><dd>{e.cfg}</dd></div>
      </dl>

      <p className="hx2-fact"><b>Bạn có biết?</b> {e.fact}</p>
      <a className="hx2-link" href="#table">Mở bảng tuần hoàn <IcoArrowRight size={14} /></a>
    </article>
  );
}

/* ============================================================
   1B. THỬ SỨC 10 GIÂY
   ============================================================ */
const QUIZ = [
  { q: 'Nguyên tố cacbon có số hiệu nguyên tử là bao nhiêu?', o: ['6', '12', '8', '14'], a: 0, ex: 'Cacbon (C) có Z = 6; số 12 là số khối của đồng vị phổ biến nhất.' },
  { q: 'Công thức hóa học của axit sunfuric là gì?', o: ['H₂SO₄', 'HCl', 'HNO₃', 'H₃PO₄'], a: 0, ex: 'H₂SO₄ là axit sunfuric; HCl là axit clohiđric, HNO₃ là axit nitric.' },
  { q: 'Dung dịch có pH = 3 có tính chất nào?', o: ['Axit', 'Trung tính', 'Bazơ', 'Lưỡng tính'], a: 0, ex: 'pH < 7 là môi trường axit; pH = 7 trung tính; pH > 7 là bazơ.' },
  { q: 'Kim loại nào sau đây tác dụng với nước ở nhiệt độ thường?', o: ['Na', 'Cu', 'Fe', 'Ag'], a: 0, ex: 'Kim loại kiềm như Na phản ứng mạnh với nước tạo NaOH và H₂.' },
  { q: 'Khí nào chiếm tỉ lệ thể tích lớn nhất trong không khí?', o: ['N₂', 'O₂', 'CO₂', 'Ar'], a: 0, ex: 'Không khí có khoảng 78% N₂ và 21% O₂ theo thể tích.' },
  { q: 'Chất nào sau đây là chất điện li mạnh?', o: ['NaCl', 'CH₃COOH', 'H₂O', 'C₂H₅OH'], a: 0, ex: 'NaCl là muối tan, phân li hoàn toàn; CH₃COOH điện li yếu; C₂H₅OH không điện li.' },
  { q: 'Cấu hình electron của nguyên tử Na (Z = 11) là gì?', o: ['1s² 2s² 2p⁶ 3s¹', '1s² 2s² 2p⁶ 3s²', '1s² 2s² 2p⁵ 3s²', '1s² 2s² 2p⁶'], a: 0, ex: 'Na có 11 electron: 2 + 8 + 1, lớp ngoài cùng là 3s¹.' },
  { q: 'Trong phản ứng Fe + CuSO₄ → FeSO₄ + Cu, chất khử là gì?', o: ['Fe', 'CuSO₄', 'FeSO₄', 'Cu'], a: 0, ex: 'Fe nhường electron (0 → +2) nên là chất khử.' },
  { q: 'Nhóm halogen gồm các nguyên tố nào?', o: ['F, Cl, Br, I', 'He, Ne, Ar, Kr', 'Li, Na, K, Rb', 'O, S, Se, Te'], a: 0, ex: 'Halogen thuộc nhóm VIIA: flo, clo, brom, iot.' },
  { q: 'Khi pha loãng axit sunfuric đặc, cách làm nào đúng?', o: ['Rót từ từ axit vào nước và khuấy', 'Rót nước vào axit', 'Đổ nhanh cùng lúc', 'Đun nóng axit trước'], a: 0, ex: 'Luôn rót axit vào nước, không làm ngược lại, vì quá trình tỏa nhiệt rất mạnh.' },
  { q: 'Số mol của 5,6 g sắt là bao nhiêu? (Fe = 56)', o: ['0,1 mol', '0,2 mol', '1 mol', '0,5 mol'], a: 0, ex: 'n = m / M = 5,6 / 56 = 0,1 mol.' },
  { q: 'Hiđrocacbon no, mạch hở đơn giản nhất là chất nào?', o: ['Metan CH₄', 'Etilen C₂H₄', 'Axetilen C₂H₂', 'Benzen C₆H₆'], a: 0, ex: 'Ankan đầu dãy là metan (CH₄).' },
];

function QuickQuiz() {
  const [order, setOrder] = useState(() => shuffle(QUIZ.map((_, k) => k)));
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState(null);
  const [st, setSt] = useState({ ok: 0, total: 0, streak: 0, best: 0 });

  const q = QUIZ[order[pos]];
  const opts = useMemo(() => shuffle(q.o.map((t, k) => ({ t, ok: k === q.a }))), [q]);

  const pick = (k) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = opts[k].ok;
    setSt((s) => {
      const streak = ok ? s.streak + 1 : 0;
      return { ok: s.ok + (ok ? 1 : 0), total: s.total + 1, streak, best: Math.max(s.best, streak) };
    });
  };

  const next = () => {
    setPicked(null);
    if (pos + 1 >= order.length) {
      setOrder(shuffle(order));
      setPos(0);
    } else {
      setPos(pos + 1);
    }
  };

  return (
    <article className="hx2-card hx2-quiz">
      <header className="hx2-card-head">
        <span className="hx2-badge">Thử sức 10 giây</span>
        <span className="hx2-score" aria-live="polite">
          Đúng <b>{st.ok}/{st.total}</b> · Chuỗi <b>{st.streak}</b>
        </span>
      </header>

      <h3 className="hx2-q">{q.q}</h3>

      <div className="hx2-opts" role="group" aria-label="Các đáp án">
        {opts.map((o, k) => {
          let cls = 'hx2-opt';
          if (picked !== null) {
            if (o.ok) cls += ' right';
            else if (k === picked) cls += ' wrong';
            else cls += ' dim';
          }
          return (
            <button key={o.t} type="button" className={cls} onClick={() => pick(k)} disabled={picked !== null}>
              <span className="hx2-opt-l">{'ABCD'[k]}</span>
              <span className="hx2-opt-t">{o.t}</span>
              {picked !== null && o.ok && <IcoCheck size={16} />}
              {picked !== null && k === picked && !o.ok && <IcoX size={16} />}
            </button>
          );
        })}
      </div>

      <div className={'hx2-explain' + (picked !== null ? ' show' : '')} aria-live="polite">
        {picked !== null && (
          <>
            <p><b>{opts[picked].ok ? 'Chính xác!' : 'Chưa đúng.'}</b> {q.ex}</p>
            <div className="hx2-row">
              <button type="button" className="hx2-btn" onClick={next}>Câu tiếp theo</button>
              <a className="hx2-link" href="#quiz">Luyện thêm ở mục Ôn tập <IcoArrowRight size={14} /></a>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   1C. ĐẾM NGƯỢC KỲ THI
   ============================================================ */
const EXAM_KEY = 'cs-home-exam';

function ExamCountdown() {
  const [d, setD] = useState({ name: '', date: '' });
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXAM_KEY);
      if (raw) setD(JSON.parse(raw));
    } catch { /* localStorage bị chặn */ }
  }, []);
  const save = (n) => {
    setD(n);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(EXAM_KEY, JSON.stringify(n)); } catch { /* */ }
    }, 400);
  };
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const left = useMemo(() => {
    if (!d.date) return null;
    const t = new Date(d.date + 'T00:00:00');
    if (Number.isNaN(t.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((t - now) / 86400000);
  }, [d.date]);

  let big = '—';
  let sub = 'Chọn ngày thi để bắt đầu đếm ngược';
  if (left !== null) {
    if (left > 0) { big = left; sub = 'ngày nữa là tới ' + (d.name || 'kỳ thi'); }
    else if (left === 0) { big = 'Hôm nay'; sub = (d.name || 'Kỳ thi') + ' — cố lên!'; }
    else { big = Math.abs(left); sub = 'ngày kể từ ' + (d.name || 'kỳ thi'); }
  }

  return (
    <article className="hx2-card hx2-exam">
      <header className="hx2-card-head">
        <span className="hx2-badge">Đếm ngược</span>
        <a className="hx2-ghost" href="#exam">Mở mục Kỳ thi</a>
      </header>
      <div className="hx2-exam-big">
        <b>{big}</b>
        <span>{sub}</span>
      </div>
      <div className="hx2-exam-form">
        <input
          type="text"
          placeholder="Tên kỳ thi (VD: Thi giữa kỳ)"
          value={d.name}
          maxLength={40}
          onChange={(ev) => save({ ...d, name: ev.target.value })}
          aria-label="Tên kỳ thi"
        />
        <input
          type="date"
          value={d.date}
          onChange={(ev) => save({ ...d, date: ev.target.value })}
          aria-label="Ngày thi"
        />
      </div>
    </article>
  );
}

/* ============================================================
   2A. THANG pH
   ============================================================ */
const PH_STOPS = [
  [0, [229, 57, 53]], [2, [244, 81, 30]], [4, [251, 140, 0]], [5.5, [253, 216, 53]],
  [7, [67, 160, 71]], [9, [0, 137, 123]], [11, [30, 136, 229]], [13, [94, 53, 177]], [14, [74, 20, 140]],
];
const PH_TRACK =
  'linear-gradient(90deg,' +
  PH_STOPS.map(([p, c]) => `rgb(${c.join(',')}) ${((p / 14) * 100).toFixed(1)}%`).join(',') + ')';

const phColor = (v) => {
  for (let k = 1; k < PH_STOPS.length; k++) {
    const [b, cb] = PH_STOPS[k];
    const [a, ca] = PH_STOPS[k - 1];
    if (v <= b) {
      const t = (v - a) / (b - a);
      return `rgb(${ca.map((c, n) => Math.round(c + (cb[n] - c) * t)).join(',')})`;
    }
  }
  return `rgb(${PH_STOPS[PH_STOPS.length - 1][1].join(',')})`;
};

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const fmtConc = (x) => {
  const [m, e] = x.toExponential(1).split('e');
  const exp = String(parseInt(e, 10)).split('').map((c) => SUP[c]).join('');
  return (m === '1.0' ? '' : m.replace('.', ',') + ' × ') + '10' + exp + ' M';
};

const PH_SAMPLES = [
  { n: 'Dịch vị dạ dày', v: 1.5 },
  { n: 'Nước chanh', v: 2.2 },
  { n: 'Cà phê', v: 5 },
  { n: 'Nước tinh khiết', v: 7 },
  { n: 'Máu người', v: 7.4 },
  { n: 'Nước biển', v: 8.1 },
  { n: 'Nước xà phòng', v: 10 },
  { n: 'Thuốc tẩy', v: 12.5 },
];

function phLabel(v) {
  if (Math.abs(v - 7) < 0.05) return 'Trung tính';
  if (v < 3) return 'Axit mạnh';
  if (v < 6.5) return 'Axit yếu';
  if (v < 7) return 'Gần trung tính (hơi axit)';
  if (v < 7.5) return 'Gần trung tính (hơi bazơ)';
  if (v < 11) return 'Bazơ yếu';
  return 'Bazơ mạnh';
}

function Beaker({ id, children }) {
  return (
    <svg className="hx2-beaker" viewBox="0 0 160 190" role="img" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d="M30 22 V150 Q30 170 50 170 H110 Q130 170 130 150 V22 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      <path d="M30 22 V150 Q30 170 50 170 H110 Q130 170 130 150 V22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 22 H138" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <g stroke="currentColor" strokeWidth="2" opacity=".35" strokeLinecap="round">
        <path d="M30 60 H44" /><path d="M30 90 H50" /><path d="M30 120 H44" />
      </g>
    </svg>
  );
}

function PhLab() {
  const [v, setV] = useState(7);
  const col = phColor(v);
  const h = Math.pow(10, -v);
  const oh = Math.pow(10, v - 14);

  return (
    <article className="hx2-card hx2-ph">
      <header className="hx2-card-head">
        <span className="hx2-badge">Thang pH</span>
        <span className="hx2-mut">Kéo thanh trượt</span>
      </header>

      <div className="hx2-ph-body">
        <div className="hx2-ph-vis" style={{ '--ph': col }}>
          <Beaker id="hx2-bk-ph">
            <rect x="20" y="62" width="120" height="120" fill={col} style={{ transition: 'fill .15s' }} />
            <path d="M20 62 Q40 54 60 62 T100 62 T140 62 V70 H20 Z" fill="rgba(255,255,255,.28)" />
          </Beaker>
          <div className="hx2-ph-val">
            <b>{v.toFixed(1).replace('.', ',')}</b>
            <span>pH</span>
          </div>
        </div>

        <div className="hx2-ph-info">
          <p className="hx2-ph-tag" style={{ background: col }}>{phLabel(v)}</p>
          <dl className="hx2-dl">
            <div><dt>[H⁺]</dt><dd>{fmtConc(h)}</dd></div>
            <div><dt>[OH⁻]</dt><dd>{fmtConc(oh)}</dd></div>
          </dl>
          <p className="hx2-mut hx2-small">Ở 25 °C: pH = −lg[H⁺] và pH + pOH = 14.</p>
        </div>
      </div>

      <input
        type="range"
        className="hx2-range"
        min="0" max="14" step="0.1"
        value={v}
        style={{ '--track': PH_TRACK }}
        onChange={(e) => setV(parseFloat(e.target.value))}
        aria-label="Giá trị pH"
        aria-valuetext={`pH ${v.toFixed(1)} — ${phLabel(v)}`}
      />
      <div className="hx2-range-scale" aria-hidden="true">
        <span>0 · axit</span><span>7</span><span>bazơ · 14</span>
      </div>

      <div className="hx2-chips" role="group" aria-label="Chất thường gặp (pH xấp xỉ)">
        {PH_SAMPLES.map((s) => (
          <button key={s.n} type="button" className={'hx2-chip' + (Math.abs(s.v - v) < 0.05 ? ' on' : '')} onClick={() => setV(s.v)}>
            {s.n}
          </button>
        ))}
      </div>
    </article>
  );
}

/* ============================================================
   2B. PHẢN ỨNG HÓA HỌC
   ============================================================ */
const RX = [
  {
    id: 'mg',
    title: 'Mg + HCl',
    eq: 'Mg + 2HCl → MgCl₂ + H₂↑',
    note: 'Magie tan dần trong dung dịch axit, sủi bọt khí H₂ không màu.',
  },
  {
    id: 'cu',
    title: 'CuSO₄ + NaOH',
    eq: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
    note: 'Dung dịch xanh lam tạo kết tủa Cu(OH)₂ màu xanh lơ, lắng dần xuống đáy.',
  },
  {
    id: 'fe',
    title: 'Fe + CuSO₄',
    eq: 'Fe + CuSO₄ → FeSO₄ + Cu',
    note: 'Đinh sắt bị phủ lớp đồng màu đỏ; màu xanh của dung dịch nhạt dần.',
  },
];

const BUBBLES = [
  { x: 62, d: 0 }, { x: 80, d: 0.5 }, { x: 98, d: 0.2 }, { x: 70, d: 1.1 },
  { x: 90, d: 0.8 }, { x: 106, d: 1.4 }, { x: 56, d: 1.7 }, { x: 84, d: 1.9 },
];
const PRECIP = [
  { x: 52, d: 0 }, { x: 68, d: 0.3 }, { x: 84, d: 0.1 }, { x: 100, d: 0.5 },
  { x: 112, d: 0.2 }, { x: 60, d: 0.7 }, { x: 92, d: 0.9 }, { x: 76, d: 1.1 },
];

function ReactionLab() {
  const [id, setId] = useState('mg');
  const [run, setRun] = useState(false);
  const rx = RX.find((r) => r.id === id);

  const choose = (k) => { setId(k); setRun(false); };

  return (
    <article className="hx2-card hx2-rx">
      <header className="hx2-card-head">
        <span className="hx2-badge">Phản ứng hóa học</span>
        <span className="hx2-mut">Minh họa</span>
      </header>

      <div className="hx2-tabs" role="tablist" aria-label="Chọn phản ứng">
        {RX.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={r.id === id} className={r.id === id ? 'on' : ''} onClick={() => choose(r.id)}>
            {r.title}
          </button>
        ))}
      </div>

      <div className="hx2-rx-body">
        <div className="hx2-rxbox" data-rx={id} data-run={run ? '1' : '0'}>
          <Beaker id="hx2-bk-rx">
            <rect className="hx2-liquid" x="20" y="64" width="120" height="120" />
            <path d="M20 64 Q40 58 60 64 T100 64 T140 64 V70 H20 Z" fill="rgba(255,255,255,.3)" />

            <rect className="hx2-mg" x="76" y="70" width="8" height="70" rx="3" />
            {BUBBLES.map((b, n) => (
              <circle key={n} className="hx2-bub" cx={b.x} cy="150" r={n % 3 === 0 ? 4 : 3} style={{ '--d': b.d + 's' }} />
            ))}

            {PRECIP.map((p, n) => (
              <ellipse key={n} className="hx2-ppt" cx={p.x} cy="72" rx="4" ry="3" style={{ '--d': p.d + 's' }} />
            ))}
            <rect className="hx2-pile" x="30" y="150" width="100" height="22" rx="6" />

            <g className="hx2-nail" transform="rotate(14 80 110)">
              <rect className="hx2-nail-fe" x="74" y="48" width="9" height="104" rx="3" />
              <rect className="hx2-nail-cu" x="74" y="48" width="9" height="104" rx="3" />
              <rect className="hx2-nail-fe" x="68" y="44" width="21" height="7" rx="3" />
            </g>
          </Beaker>
        </div>

        <div className="hx2-rx-info">
          <p className="hx2-eq">{rx.eq}</p>
          <p className="hx2-mut">{rx.note}</p>
          <div className="hx2-row">
            {!run
              ? <button type="button" className="hx2-btn" onClick={() => setRun(true)}>Chạy phản ứng</button>
              : <button type="button" className="hx2-btn alt" onClick={() => setRun(false)}>Làm lại</button>}
            <a className="hx2-link" href="#balance">Cân bằng PTHH <IcoArrowRight size={14} /></a>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   3. AI TRONG 10 GIÂY
   ============================================================ */
const AI_TABS = [
  {
    id: 'solve',
    label: 'Giải đề',
    q: 'Tính pH của dung dịch HCl 0,01M.',
    a: [
      { t: 'HCl là axit mạnh, phân li hoàn toàn trong nước:' },
      { f: 'HCl → H⁺ + Cl⁻' },
      { t: 'Do đó [H⁺] = [HCl] = 0,01 M = 10⁻² M.' },
      { f: 'pH = −lg[H⁺] = −lg(10⁻²) = 2' },
      { t: 'Đáp án: pH = 2, dung dịch có tính axit.', strong: true },
    ],
  },
  {
    id: 'theory',
    label: 'Giảng lý thuyết',
    q: 'Giải thích định luật bảo toàn khối lượng.',
    a: [
      { t: 'Trong một phản ứng hóa học, tổng khối lượng các chất tham gia bằng tổng khối lượng các chất sản phẩm.' },
      { t: 'Lý do: phản ứng chỉ làm đứt và hình thành liên kết, số nguyên tử của mỗi nguyên tố được giữ nguyên.' },
      { t: 'Ví dụ:' },
      { f: '2H₂ + O₂ → 2H₂O' },
      { f: '4 g + 32 g = 36 g' },
      { t: 'Ứng dụng: tính khối lượng chất còn thiếu khi biết các chất còn lại.', strong: true },
    ],
  },
  {
    id: 'gen',
    label: 'Sinh câu hỏi',
    q: 'Sinh 3 câu trắc nghiệm về este.',
    a: [
      { t: 'Câu 1. Este CH₃COOC₂H₅ có tên gọi là gì?' },
      { f: 'A. Metyl axetat   B. Etyl axetat ✓   C. Etyl fomat   D. Propyl axetat' },
      { t: 'Câu 2. Phản ứng thủy phân este trong môi trường kiềm gọi là gì?' },
      { f: 'A. Este hóa   B. Xà phòng hóa ✓   C. Trùng ngưng   D. Hiđro hóa' },
      { t: 'Câu 3. Thủy phân CH₃COOC₂H₅ bằng NaOH thu được:' },
      { f: 'A. CH₃COOH, C₂H₅ONa   B. CH₃COONa, C₂H₅OH ✓   C. HCOONa, C₂H₅OH   D. CH₃COONa, CH₃OH' },
    ],
  },
];

function AIDemo() {
  const [id, setId] = useState('solve');
  const tab = AI_TABS.find((t) => t.id === id);

  return (
    <div className="hx2-ai">
      <div className="hx2-tabs hx2-ai-tabs" role="tablist" aria-label="Chế độ trợ lý AI">
        {AI_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === id} className={t.id === id ? 'on' : ''} onClick={() => setId(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="hx2-chat" key={id}>
        <div className="hx2-msg me"><p>{tab.q}</p></div>
        <div className="hx2-msg ai">
          <span className="hx2-ai-dot" aria-hidden="true"><IcoSparkle size={14} /></span>
          <div>
            {tab.a.map((l, k) => (
              l.f
                ? <pre key={k} className="hx2-formula" style={{ '--i': k }}>{l.f}</pre>
                : <p key={k} className={l.strong ? 'strong' : ''} style={{ '--i': k }}>{l.t}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="hx2-row hx2-ai-foot">
        <a className="hx2-btn" href="#ai">Hỏi AI ngay <IcoArrowRight size={14} /></a>
        <span className="hx2-mut hx2-small">Nội dung minh họa. Câu trả lời thật do AI tạo trong mục Trợ lý AI.</span>
      </div>
    </div>
  );
}

/* ============================================================
   4. LỘ TRÌNH THEO LỚP
   ============================================================ */
const ROADMAP = {
  10: {
    title: 'Nền tảng: cấu tạo và quy luật',
    topics: ['Cấu tạo nguyên tử', 'Bảng tuần hoàn và định luật tuần hoàn', 'Liên kết hóa học', 'Phản ứng oxi hóa – khử', 'Năng lượng hóa học', 'Tốc độ phản ứng', 'Nhóm halogen'],
    tools: [['#table', 'Bảng tuần hoàn'], ['#balance', 'Cân bằng PTHH']],
  },
  11: {
    title: 'Mở rộng: cân bằng và hóa hữu cơ',
    topics: ['Cân bằng hóa học', 'Nitơ và lưu huỳnh', 'Đại cương hóa học hữu cơ', 'Hiđrocacbon', 'Dẫn xuất halogen – ancol – phenol', 'Hợp chất carbonyl – axit carboxylic'],
    tools: [['#formulas', 'Công thức nhanh'], ['#analyze', 'Phân tích']],
  },
  12: {
    title: 'Về đích: hợp chất và kim loại',
    topics: ['Este – lipid', 'Carbohiđrat', 'Hợp chất chứa nitơ', 'Polime', 'Pin điện và điện phân', 'Đại cương về kim loại', 'Kim loại nhóm IA, IIA', 'Kim loại chuyển tiếp và phức chất'],
    tools: [['#quiz', 'Ôn tập'], ['#exam', 'Kỳ thi']],
  },
};

function GradeRoadmap() {
  const [g, setG] = useState(11);
  const r = ROADMAP[g];

  return (
    <div className="hx2-road">
      <div className="hx2-tabs" role="tablist" aria-label="Chọn lớp">
        {[10, 11, 12].map((n) => (
          <button key={n} type="button" role="tab" aria-selected={n === g} className={n === g ? 'on' : ''} onClick={() => setG(n)}>
            Lớp {n}
          </button>
        ))}
      </div>

      <div className="hx2-card hx2-road-card" key={g}>
        <h3>{r.title}</h3>
        <ol className="hx2-topics">
          {r.topics.map((t, k) => (
            <li key={t} style={{ '--i': k }}><i>{String(k + 1).padStart(2, '0')}</i>{t}</li>
          ))}
        </ol>
        <div className="hx2-row">
          <span className="hx2-mut hx2-small">Công cụ nên dùng:</span>
          {r.tools.map(([href, name]) => (
            <a key={href} className="hx2-pill" href={href}>{name}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   5. CÂU HỎI THƯỜNG GẶP
   ============================================================ */
const FAQ = [
  { q: 'Web có miễn phí không?', a: 'Có. Các công cụ học tập và Trợ lý AI đều dùng miễn phí cho học sinh. Gói VIP đang được chuẩn bị và sẽ ra mắt sau.' },
  { q: 'Trợ lý AI giúp được những gì?', a: 'AI giải đề từng bước, giảng lý thuyết dễ hiểu và sinh câu hỏi ôn tập theo chủ đề bạn chọn. Bạn cũng có thể chụp ảnh đề để gửi trực tiếp.' },
  { q: 'Bảng tuần hoàn có những thông tin gì?', a: '118 nguyên tố với khối lượng, cấu hình electron, trạng thái và độ âm điện. Bạn có thể lọc theo nhóm, chu kỳ, phân loại và tìm kiếm tức thì.' },
  { q: 'Dùng được trên điện thoại không?', a: 'Được. Giao diện tự co giãn theo màn hình, có thanh điều hướng dưới và bảng chọn công cụ học tập dạng menu kéo lên.' },
  { q: 'Có chế độ tối không?', a: 'Có. Bấm biểu tượng mặt trăng trên thanh điều hướng để chuyển giữa giao diện sáng và tối.' },
];

function Faq() {
  return (
    <div className="hx2-faq">
      {FAQ.map((f) => (
        <details key={f.q} name="hx2-faq">
          <summary>
            <span>{f.q}</span>
            <IcoChevronDown size={18} />
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ============================================================
   WRAPPER
   ============================================================ */
export default function HomeExtras() {
  return (
    <>
      <section className="wrap hx2-sec" aria-label="Mỗi ngày một chút">
        <Head tag="Mỗi ngày một chút">
          Học <span className="hx2-hl">5 phút</span>, nhớ cả tuần
        </Head>
        <div className="hx2-grid-3">
          <div className="hx2-stack">
            <DailyElement />
            <ExamCountdown />
          </div>
          <QuickQuiz />
        </div>
      </section>

      <section className="wrap hx2-sec" aria-label="Phòng thí nghiệm ảo">
        <Head tag="Phòng thí nghiệm ảo">
          Thử ngay, <span className="hx2-hl">không cần hóa chất</span>
        </Head>
        <div className="hx2-grid-2">
          <PhLab />
          <ReactionLab />
        </div>
      </section>

      <section className="wrap hx2-sec" aria-label="Trợ lý AI">
        <Head tag="Trợ lý AI">
          Hỏi một câu, <span className="hx2-hl">nhận lời giải</span>
        </Head>
        <AIDemo />
      </section>

      <section className="wrap hx2-sec" aria-label="Lộ trình theo lớp">
        <Head tag="Lộ trình theo lớp">
          Học đúng chỗ, <span className="hx2-hl">đúng lớp</span>
        </Head>
        <GradeRoadmap />
      </section>

      <section className="wrap hx2-sec" aria-label="Câu hỏi thường gặp">
        <Head tag="Câu hỏi thường gặp">
          Còn <span className="hx2-hl">thắc mắc?</span>
        </Head>
        <Faq />
      </section>
    </>
  );
}