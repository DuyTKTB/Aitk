/* ============================================================
   elecRig.js — "Đội linh vật" ELEC AI
   Mascot Elec được tách thành các bộ phận (đầu, 2 tay, 2 bàn tay, 2 chân,
   mắt, miệng) rồi điều khiển bằng code, nên có thể đi, vẫy tay, nhảy,
   nhảy múa, reo hò, suy nghĩ… và chuyển động mượt giữa các tư thế.

   Dùng:  const crew = mountCrew(document.body, { count: 4, size: 124 });
          crew.destroy();
   (Trong React dùng component ElecCrew.jsx — chỉ là lớp vỏ gọi hàm này.)
   ============================================================ */

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (arr) => arr[(Math.random() * arr.length) | 0];
const f = (n) => n.toFixed(2);

const INK = '#1d4fb8';
const FONT = "Poppins, Nunito, 'Arial Rounded MT Bold', Arial, sans-serif";

/* ---------- gradient / clip dùng chung (chèn 1 lần) ---------- */
const DEFS = `<svg class="ec-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<radialGradient id="ec-iris" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#6cb4ff"/><stop offset="1" stop-color="#0a5fd6"/></radialGradient>
<linearGradient id="ec-head" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f3f8ff"/><stop offset="1" stop-color="#d9e9ff"/></linearGradient>
<linearGradient id="ec-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b9bff"/><stop offset="1" stop-color="#0a6ae6"/></linearGradient>
<linearGradient id="ec-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f86f5"/><stop offset="1" stop-color="#0d4fc9"/></linearGradient>
<linearGradient id="ec-liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe8ff"/><stop offset="1" stop-color="#2fb6f5"/></linearGradient>
<radialGradient id="ec-sh"><stop offset="0" stop-color="#6f95d6" stop-opacity=".55"/><stop offset=".6" stop-color="#6f95d6" stop-opacity=".25"/><stop offset="1" stop-color="#6f95d6" stop-opacity="0"/></radialGradient>
<clipPath id="ec-hc"><ellipse cx="320" cy="270" rx="215" ry="185"/></clipPath>
<clipPath id="ec-mc"><path d="M290,346 Q320,338 350,346 Q348,390 320,390 Q292,390 290,346Z"/></clipPath>
</defs></svg>`;

/* ---------- mascot đã tách bộ phận (tọa độ gốc của elec-*.svg) ----------
   data-part  = bộ phận được code xoay/tịnh tiến
   data-f     = biểu cảm nào thì hiện (default | happy | think | wink)      */
const MASCOT = `<svg class="ec-svg" viewBox="70 0 500 730" data-face="default" aria-hidden="true" focusable="false">
<g stroke-linejoin="round" stroke-linecap="round">
<ellipse data-part="shadow" cx="320" cy="708" rx="150" ry="17" fill="url(#ec-sh)"/>
<g data-part="lean"><g data-part="body" class="ec-hit">

<g data-part="legL">
  <path d="M276,586 Q276,650 282,672 L322,672 Q324,640 322,590Z" fill="#0f64dc" stroke="${INK}" stroke-width="4"/>
  <path d="M250,690 Q250,660 290,660 L322,660 Q330,664 330,684 Q330,708 292,708 Q250,708 250,690Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <path d="M256,698 Q290,708 326,698" fill="none" stroke="#9cc8ff" stroke-width="4"/>
</g>
<g data-part="legR">
  <path d="M318,590 Q316,640 318,672 L360,672 Q366,650 364,586Z" fill="#0f64dc" stroke="${INK}" stroke-width="4"/>
  <path d="M312,684 Q312,660 330,660 L352,660 Q392,660 392,690 Q392,708 350,708 Q312,708 312,684Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <path d="M318,698 Q352,708 388,698" fill="none" stroke="#9cc8ff" stroke-width="4"/>
</g>

<g>
  <path d="M250,438 Q320,420 390,438 Q412,520 392,596 Q320,616 248,596 Q228,520 250,438Z" fill="url(#ec-blue)" stroke="${INK}" stroke-width="4"/>
  <path d="M284,436 Q320,470 356,436" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
  <path d="M332,486 L298,540 L320,540 L310,580 L348,524 L326,524 Z" fill="#ffc21a" stroke="#d98f00" stroke-width="3.5"/>
  <path d="M258,590 Q320,612 384,590" fill="none" stroke="#0a54c0" stroke-width="4" opacity=".5"/>
</g>

<g data-part="armRb">
  <path d="M384,470 Q430,480 438,530" fill="none" stroke="${INK}" stroke-width="48"/>
  <path d="M384,470 Q430,480 438,530" fill="none" stroke="#2a8cf5" stroke-width="40"/>
</g>

<g data-part="head">
  <ellipse cx="320" cy="270" rx="215" ry="185" fill="url(#ec-head)" stroke="${INK}" stroke-width="4.5"/>
  <g fill="url(#ec-hair)" stroke="${INK}" stroke-width="4">
    <ellipse cx="250" cy="96" rx="42" ry="64" transform="rotate(-28 250 96)"/>
    <ellipse cx="400" cy="100" rx="40" ry="60" transform="rotate(30 400 100)"/>
    <ellipse cx="324" cy="70" rx="44" ry="70" transform="rotate(4 324 70)"/>
    <path d="M168,200 Q180,120 320,112 Q460,120 472,200 Z"/>
  </g>
  <ellipse cx="306" cy="52" rx="10" ry="22" transform="rotate(8 306 52)" fill="#fff" opacity=".35"/>
  <g clip-path="url(#ec-hc)">
    <path d="M90,176 Q320,146 550,172 L552,238 Q320,214 88,244 Z" fill="url(#ec-blue)" stroke="${INK}" stroke-width="4"/>
    <path d="M90,166 Q320,136 550,162 L550,176 Q320,150 90,180Z" fill="#fff" opacity=".18"/>
  </g>
  <text x="320" y="219" text-anchor="middle" transform="rotate(-1.2 320 205)" font-family="${FONT}" font-weight="800" font-size="40" fill="#fff" letter-spacing="2">ELEC AI</text>
  <ellipse cx="186" cy="354" rx="34" ry="21" fill="#ffa8bd" opacity=".7"/>
  <ellipse cx="454" cy="354" rx="34" ry="21" fill="#ffa8bd" opacity=".7"/>

  <g data-part="eyeL" data-f="default think wink">
    <ellipse cx="250" cy="312" rx="33" ry="38" fill="url(#ec-iris)"/>
    <ellipse cx="253" cy="318" rx="19" ry="23" fill="#13306b"/>
    <circle cx="241" cy="298" r="11" fill="#fff"/><circle cx="262" cy="330" r="5.5" fill="#fff"/><circle cx="264" cy="304" r="3" fill="#fff" opacity=".8"/>
  </g>
  <g data-part="eyeR" data-f="default think">
    <ellipse cx="390" cy="312" rx="33" ry="38" fill="url(#ec-iris)"/>
    <ellipse cx="393" cy="318" rx="19" ry="23" fill="#13306b"/>
    <circle cx="381" cy="298" r="11" fill="#fff"/><circle cx="402" cy="330" r="5.5" fill="#fff"/><circle cx="404" cy="304" r="3" fill="#fff" opacity=".8"/>
  </g>
  <path data-f="happy" d="M220,322 Q250,284 280,322" fill="none" stroke="#13306b" stroke-width="8"/>
  <path data-f="happy wink" d="M360,322 Q390,284 420,322" fill="none" stroke="#13306b" stroke-width="8"/>

  <g data-part="mouth" data-f="default happy wink">
    <path d="M290,346 Q320,338 350,346 Q348,390 320,390 Q292,390 290,346Z" fill="#b02a47"/>
    <g clip-path="url(#ec-mc)"><ellipse cx="320" cy="392" rx="22" ry="15" fill="#ff8aa0"/></g>
    <path d="M290,346 Q320,338 350,346 Q348,390 320,390 Q292,390 290,346Z" fill="none" stroke="#7d1d33" stroke-width="3.5"/>
  </g>
  <g data-f="think">
    <ellipse cx="320" cy="362" rx="11" ry="13" fill="#b02a47"/><ellipse cx="320" cy="368" rx="6" ry="5" fill="#ff8aa0"/>
  </g>
</g>

<g data-part="armRf">
  <g transform="translate(408 424)">
    <path d="M30,0 L30,44 L-4,96 Q-12,118 12,118 L80,118 Q104,118 96,96 L62,44 L62,0Z" fill="#f2fbff" fill-opacity=".9" stroke="${INK}" stroke-width="4"/>
    <path d="M2,86 Q46,70 92,86 L96,100 Q104,116 80,116 L12,116 Q-12,116 -2,100Z" fill="url(#ec-liq)"/>
    <rect x="24" y="-8" width="44" height="14" rx="7" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <circle cx="32" cy="100" r="5" fill="#fff" opacity=".9"/><circle cx="58" cy="92" r="4" fill="#fff" opacity=".9"/>
    <circle data-part="fb1" cx="48" cy="-30" r="8" fill="#a8ecff" stroke="${INK}" stroke-width="3"/>
    <circle data-part="fb2" cx="62" cy="-52" r="5" fill="#a8ecff" stroke="${INK}" stroke-width="3"/>
  </g>
  <circle cx="454" cy="540" r="27" fill="#fff" stroke="${INK}" stroke-width="4"/>
</g>

<g data-part="armL">
  <path d="M262,474 Q244,520 232,562" fill="none" stroke="${INK}" stroke-width="48"/>
  <path d="M262,474 Q244,520 232,562" fill="none" stroke="#2a8cf5" stroke-width="40"/>
  <g data-part="handL">
    <circle cx="228" cy="584" r="29" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="204" cy="570" rx="11" ry="15" transform="rotate(20 204 570)" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <circle cx="228" cy="584" r="25" fill="#fff"/>
  </g>
</g>

<g data-part="spark1" opacity="0"><path d="M0,-22 L6,-6 22,0 6,6 0,22 -6,6 -22,0 -6,-6Z" fill="#ffd45e"/></g>
<g data-part="spark2" opacity="0"><path d="M0,-22 L6,-6 22,0 6,6 0,22 -6,6 -22,0 -6,-6Z" fill="#9cc8ff"/></g>

</g></g>
</g></svg>`;

/* ---------- 4 bạn trong đội: tính cách = trọng số hành động + lời thoại ---------- */
const CREW = [
  {
    id: 'a', base: 'default', k: 1.0, enter: 'left', speed: 0.5,
    w: { idle: 2, walk: 4, wave: 3, jump: 1, cheer: 1, think: 1, dance: 1 },
    hello: ['Chào bạn! Hôm nay ôn chương nào nè?', 'Xin chào! Mình là Elec 👋', 'Hello! Sẵn sàng học Hóa chưa?'],
    lines: ['Làm 5 câu quiz rồi nghỉ nhé?', 'Chuỗi ngày học đừng để đứt nha 🔥', 'Sai không sao, sai là học thêm một điều!'],
    think: ['Hmm… cân bằng cái này sao ta?'],
    cheer: ['Đúng rồi! Giỏi quá!'],
    click: ['Á! Nhột đó nha 😆', 'Hỏi ELECAI bài khó đi, mình giúp!', 'Bấm gì mà bấm hoài vậy 😄'],
  },
  {
    id: 'b', base: 'happy', k: 0.94, enter: 'right', speed: 0.62,
    w: { idle: 1, walk: 3, wave: 1, jump: 3, cheer: 2, think: 0.3, dance: 3 },
    hello: ['Hihi, chào bạn!', 'Cùng học nào! ✨'],
    lines: ['Hóa học vui lắm luôn!', 'Axit + bazơ → muối + nước!', 'Nhảy chút cho tỉnh táo nè 🎵'],
    think: ['Ơ… hay là mình nhảy tiếp nhỉ?'],
    cheer: ['Yeah! Mục tiêu hôm nay xong rồi!'],
    click: ['Hihi!', 'Yeah! Nhảy cùng mình nào 🎶', 'Nhấc mình lên cao nữa đi 😆'],
  },
  {
    id: 'c', base: 'default', k: 1.04, enter: 'left', speed: 0.42,
    w: { idle: 2, walk: 3, wave: 1, jump: 0.5, cheer: 0.5, think: 4, dance: 0.5 },
    hello: ['Ơ, chào bạn!', 'Bạn cũng đang nghĩ bài hả?'],
    lines: ['Số oxi hóa tăng = bị oxi hóa, nhớ chưa?', 'Mol là cầu nối giữa khối lượng và số hạt.', 'Kim loại kiềm dễ nhường 1 electron nên rất hoạt động!'],
    think: ['Hmm… chất khử hay chất oxi hóa nhỉ?', 'Để mình nhẩm lại số oxi hóa…', 'Mol nối khối lượng với số hạt…'],
    cheer: ['À! Ra rồi!'],
    click: ['Đang suy nghĩ mà… 🤔', 'Khoan, để mình nghĩ đã!'],
  },
  {
    id: 'd', base: 'default', k: 0.97, enter: 'right', speed: 0.55, winker: true,
    w: { idle: 2, walk: 3, wave: 2, jump: 1, cheer: 1, think: 1, dance: 2 },
    hello: ['Ê, chào nè 😉', 'Ghé học Hóa với tụi mình nhé!'],
    lines: ['Pha loãng axit: rót axit vào nước nha!', 'Uống nước chưa? H₂O đó 💧', 'Este thơm mùi hoa quả thật luôn đó!'],
    think: ['Hừm, bài này có bẫy không ta?'],
    cheer: ['Quá đỉnh!'],
    click: ['Hì, bắt được mình rồi 😉', 'Bí quyết: ôn đều mỗi ngày!'],
  },
];

/* ---------- tư thế: trả về góc/độ lệch mục tiêu của từng bộ phận ----------
   Góc dương = xoay theo chiều kim đồng hồ. Tay trái: dương = giơ ra/lên.
   Tay phải (cầm bình): âm = giơ ra/lên.                                    */
function targets(pose, t, ph, dir, u) {
  const o = { armL: 4, handL: 0, armR: -4, legL: 0, legR: 0, liftL: 0, liftR: 0, head: 0, lean: 0, bob: 0, bx: 0, hop: 0, spark: 0 };
  const breath = 0.5 + 0.5 * Math.sin(t * 2);
  switch (pose) {
    case 'walk': {
      const th = ph * 2 * Math.PI, s = Math.sin(th), c = Math.cos(th);
      o.legL = 20 * s; o.legR = -20 * s;
      o.liftL = 18 * Math.max(0, c); o.liftR = 18 * Math.max(0, -c);
      o.armL = 8 - 18 * s; o.armR = -6 + 12 * s;
      o.bob = -13 * Math.abs(c);
      o.head = 3 * s; o.lean = dir * 5;
      break;
    }
    case 'wave':
      o.armL = 100 + 16 * Math.sin(t * 10); o.handL = 20 * Math.sin(t * 13);
      o.armR = -6; o.head = 6 + 2 * Math.sin(t * 3); o.lean = -3;
      o.bob = -5 * Math.abs(Math.sin(t * 5));
      break;
    case 'jump': {
      const hu = (u % 0.95) / 0.95, arc = Math.sin(Math.PI * hu);
      o.hop = -170 * 4 * hu * (1 - hu);
      o.bob = hu < 0.14 ? 16 * Math.sin((Math.PI * hu) / 0.14) : 0;
      o.armL = 40 + 80 * arc; o.armR = -(10 + 34 * arc);
      o.legL = 12 * arc; o.legR = -12 * arc; o.liftL = o.liftR = 16 * arc;
      o.head = -4 * arc; o.spark = 1;
      break;
    }
    case 'cheer':
      o.armL = 118 + 10 * Math.sin(t * 9); o.armR = -46 + 8 * Math.sin(t * 9 + Math.PI);
      o.bob = -10 * Math.abs(Math.sin(t * 6)); o.head = 5 * Math.sin(t * 6);
      o.legL = 6 * Math.sin(t * 12); o.legR = -6 * Math.sin(t * 12);
      o.spark = 1;
      break;
    case 'dance': {
      const s = Math.sin(t * 5.5), q = Math.sin(t * 11);
      o.lean = 7 * s; o.bx = 18 * s; o.bob = -12 * Math.abs(Math.cos(t * 5.5)); o.head = -9 * s;
      o.armL = 70 + 45 * s; o.armR = -25 + 20 * s;
      o.legL = 12 * q; o.legR = -12 * q;
      o.liftL = 10 * Math.max(0, Math.cos(t * 11)); o.liftR = 10 * Math.max(0, -Math.cos(t * 11));
      o.spark = 0.8;
      break;
    }
    case 'think':
      o.armL = 124 + 3 * Math.sin(t * 2.5); o.handL = -10;
      o.head = -9 + 2 * Math.sin(t * 1.4); o.bob = -5 * breath; o.armR = -4; o.lean = -2;
      break;
    default: // idle
      o.bob = -6 * breath;
      o.armL = 4 + 2.5 * Math.sin(t * 2 + 0.5); o.armR = -4 - 2.5 * Math.sin(t * 2);
      o.head = 4 * Math.sin(t * 0.8);
  }
  return o;
}

const KEYS = ['armL', 'handL', 'armR', 'legL', 'legR', 'liftL', 'liftR', 'head', 'lean', 'bob', 'bx', 'hop', 'spark', 'mouth'];

function render(P, c, t, blink) {
  P.lean.setAttribute('transform', `rotate(${f(c.lean)} 320 700)`);
  P.body.setAttribute('transform', `translate(${f(c.bx)} ${f(c.bob + c.hop)})`);
  P.legL.setAttribute('transform', `translate(0 ${f(-c.liftL)}) rotate(${f(c.legL)} 300 590)`);
  P.legR.setAttribute('transform', `translate(0 ${f(-c.liftR)}) rotate(${f(c.legR)} 340 590)`);
  const aR = `rotate(${f(c.armR)} 384 470)`;
  P.armRb.setAttribute('transform', aR);
  P.armRf.setAttribute('transform', aR);
  P.armL.setAttribute('transform', `rotate(${f(c.armL)} 262 474)`);
  P.handL.setAttribute('transform', `rotate(${f(c.handL)} 228 584)`);
  P.head.setAttribute('transform', `rotate(${f(c.head)} 320 455)`);
  P.eyeL.setAttribute('transform', `translate(250 312) scale(1 ${f(blink)}) translate(-250 -312)`);
  P.eyeR.setAttribute('transform', `translate(390 312) scale(1 ${f(blink)}) translate(-390 -312)`);
  P.mouth.setAttribute('transform', `translate(320 346) scale(1 ${f(c.mouth)}) translate(-320 -346)`);
  const air = Math.min(1, Math.max(0, -(c.hop + c.bob * 0.5) / 170));
  P.shadow.setAttribute('transform', `translate(${f(c.bx * 0.6)} 0) translate(320 708) scale(${f(1 - 0.35 * air)} 1) translate(-320 -708)`);
  P.shadow.setAttribute('opacity', f(1 - 0.45 * air));
  P.fb1.setAttribute('transform', `translate(0 ${f(-5 * Math.sin(t * 3))})`);
  P.fb2.setAttribute('transform', `translate(0 ${f(-5 * Math.sin(t * 3 + 1.6))})`);
  const sp = c.spark;
  P.spark1.setAttribute('opacity', f(Math.max(0, sp)));
  P.spark1.setAttribute('transform', `translate(112 150) scale(${f(0.5 + 0.6 * sp)}) rotate(${f(t * 70)})`);
  P.spark2.setAttribute('opacity', f(Math.max(0, sp)));
  P.spark2.setAttribute('transform', `translate(545 120) scale(${f(0.45 + 0.55 * sp)}) rotate(${f(-t * 50)})`);
}

/* ---------- một bạn linh vật: máy trạng thái + vòng lặp animation ---------- */
const POS = new Map();   // vị trí x của mọi bạn → tránh đi chồng lên nhau
let lastSpeakAt = 0;     // chỉ 1 bạn nói tại một thời điểm
let uidSeq = 0;

function createWalker(layer, spec, o) {
  const uid = ++uidSeq;
  const size = o.size, W = size * spec.k;
  const reduce = o.reduce;

  const el = document.createElement('div');
  el.className = 'ec-walker';
  el.style.setProperty('--ec-k', spec.k);
  el.innerHTML = MASCOT + '<div class="ec-bubble" data-show="0"></div>';
  layer.appendChild(el);

  const svg = el.querySelector('.ec-svg');
  const bubble = el.querySelector('.ec-bubble');
  const P = {};
  svg.querySelectorAll('[data-part]').forEach((n) => { P[n.getAttribute('data-part')] = n; });

  const lo = () => 44;
  const hi = () => Math.max(lo() + 10, window.innerWidth - W - 96); // chừa chỗ cho nút chat

  let x, dir = 1, pose = 'idle', poseT = 0, poseDur = 1, target = 0;
  let faceNow = spec.base, faceShown = '';
  let t = rand(0, 10), phase = rand(0, 1);
  let talkUntil = 0, hideTimer = 0, lastLine = '';
  let busyUntil = 0;
  let nextBlink = performance.now() + rand(1500, 4000), blinkStart = -1e9;
  let nextWink = performance.now() + rand(4000, 8000), winkUntil = 0;
  let waiting = reduce ? 0 : o.delay / 1000;
  let last = performance.now(), raf = 0, dead = false;
  const cur = { ...targets('idle', 0, 0, 1, 0), mouth: 1 };

  const setFace = (fc) => { faceNow = fc; };

  function say(src, force) {
    const now = performance.now();
    if (!force && now - lastSpeakAt < 6500) return;
    let text = Array.isArray(src) ? pickOne(src) : src;
    if (Array.isArray(src) && src.length > 1 && text === lastLine) text = pickOne(src);
    lastLine = text; lastSpeakAt = now;
    bubble.textContent = text;
    bubble.dataset.show = '1';
    el.dataset.talk = '1';
    talkUntil = now + Math.min(2600, 500 + text.length * 45);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { bubble.dataset.show = '0'; delete el.dataset.talk; }, 1800 + text.length * 55);
  }

  function pickTarget() {
    const a = lo(), b = hi();
    let best = a + Math.random() * (b - a);
    for (let i = 0; i < 8; i++) {
      const c = a + Math.random() * (b - a);
      if (Math.abs(c - x) < 110) continue;
      let ok = true;
      POS.forEach((px, id) => { if (id !== uid && Math.abs(px - c) < W * 0.85) ok = false; });
      if (ok) { best = c; break; }
    }
    target = best;
  }

  function enter(p) {
    pose = p; poseT = 0; el.dataset.pose = p;
    switch (p) {
      case 'walk': pickTarget(); poseDur = Infinity; setFace(spec.base); break;
      case 'idle': poseDur = rand(1.2, 3.4); setFace(spec.base); if (Math.random() < 0.18) say(spec.lines); break;
      case 'wave': poseDur = 2.2; setFace('wink'); if (Math.random() < 0.6) say(spec.hello); break;
      case 'jump': poseDur = 1.9; setFace('happy'); break;
      case 'cheer': poseDur = 2.0; setFace('happy'); if (Math.random() < 0.35) say(spec.cheer); break;
      case 'dance': poseDur = 3.4; setFace('happy'); break;
      case 'think': poseDur = 2.9; setFace('think'); if (Math.random() < 0.7) say(spec.think); break;
      default: poseDur = 1.5;
    }
  }

  function next() {
    let tot = 0;
    for (const k in spec.w) if (k !== pose) tot += spec.w[k];
    let r = Math.random() * tot, pick = 'idle';
    for (const k in spec.w) { if (k === pose) continue; if ((r -= spec.w[k]) <= 0) { pick = k; break; } }
    enter(pick);
  }

  function hover() {
    if (reduce || performance.now() < busyUntil) return;
    if (pose === 'idle' || pose === 'walk') enter('wave');
  }
  function poke() {
    busyUntil = performance.now() + 1200;
    if (!reduce) enter('jump');
    say(spec.click, true);
  }
  P.body.addEventListener('pointerenter', hover);
  P.body.addEventListener('click', poke);

  function place() {
    el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    POS.set(uid, x);
  }

  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (waiting > 0) { waiting -= dt; if (waiting <= 0) enter('walk'); else return; }

    t += dt; poseT += dt;
    if (pose === 'walk') {
      const step = spec.speed * size * dt, d = target - x;
      if (Math.abs(d) <= step) { x = target; next(); }
      else { x += Math.sign(d) * step; dir = Math.sign(d); phase += step / (size * 0.4); }
    } else if (poseT >= poseDur) next();

    // nháy mắt + (bạn D) thỉnh thoảng nháy một bên
    if (now > nextBlink) { blinkStart = now; nextBlink = now + rand(2200, 5200); }
    const bp = (now - blinkStart) / 150;
    const blink = bp < 1 ? 1 - 0.92 * Math.sin(Math.PI * bp) : 1;
    if (spec.winker && (pose === 'idle' || pose === 'walk') && now > nextWink) { winkUntil = now + 750; nextWink = now + rand(5500, 10000); }
    const face = spec.winker && now < winkUntil && (pose === 'idle' || pose === 'walk') ? 'wink' : faceNow;
    if (face !== faceShown) { svg.dataset.face = face; faceShown = face; }

    const tg = targets(pose, t, phase, dir, poseT);
    tg.mouth = now < talkUntil ? 0.55 + 0.45 * Math.abs(Math.sin(t * 14)) : 1;
    const k = 1 - Math.exp(-14 * dt);
    for (const key of KEYS) cur[key] += (tg[key] - cur[key]) * k;

    place();
    render(P, cur, t, blink);
  }

  if (reduce) {
    // Giảm chuyển động: đứng yên, rải đều trên màn hình; bấm vào vẫn nói chuyện
    x = lo() + ((hi() - lo()) * (o.index + 0.5)) / o.total - W / 2;
    el.dataset.pose = 'idle';
    svg.dataset.face = spec.base; faceShown = spec.base;
    place(); render(P, cur, 0, 1);
  } else {
    x = spec.enter === 'left' ? -W - 30 : window.innerWidth + 30;
    place();
    raf = requestAnimationFrame(frame);
  }

  return {
    el, pose: enter, say,
    destroy() {
      dead = true; cancelAnimationFrame(raf); clearTimeout(hideTimer);
      POS.delete(uid); el.remove();
    },
  };
}

/* ---------- gắn cả đội vào trang ---------- */
const bucket = (w) => (w < 640 ? 0 : w < 1000 ? 1 : 2);
const layoutFor = (w, opts) => {
  const base = [{ count: 2, size: 84 }, { count: 3, size: 104 }, { count: 4, size: 124 }][bucket(w)];
  return { count: Math.min(opts.count || base.count, CREW.length), size: opts.size || base.size };
};

export function mountCrew(host = document.body, opts = {}) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = document.createElement('div');
  layer.className = 'ec-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = DEFS;
  host.appendChild(layer);

  let walkers = [];
  const build = () => {
    walkers.forEach((w) => w.destroy());
    const L = layoutFor(window.innerWidth, opts);
    layer.style.setProperty('--ec-w', L.size + 'px');
    walkers = CREW.slice(0, L.count).map((spec, i, arr) =>
      createWalker(layer, spec, { size: L.size, index: i, total: arr.length, reduce, delay: 600 * i + 200 }));
  };
  build();

  let lastBucket = bucket(window.innerWidth), tm = 0;
  const onResize = () => {
    clearTimeout(tm);
    tm = setTimeout(() => { const b = bucket(window.innerWidth); if (b !== lastBucket) { lastBucket = b; build(); } }, 200);
  };
  window.addEventListener('resize', onResize);

  return {
    get walkers() { return walkers; },
    destroy() {
      window.removeEventListener('resize', onResize); clearTimeout(tm);
      walkers.forEach((w) => w.destroy()); layer.remove();
    },
  };
}