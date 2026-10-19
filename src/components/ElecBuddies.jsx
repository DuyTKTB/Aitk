import { useEffect } from 'react';
/* ============================================================
   ElecBuddies.jsx — vài bạn Elec cỡ lớn đứng cạnh các mục trên trang chủ (chỉ máy tính)
   Đặt tại: src/components/ElecBuddies.jsx  (1 file duy nhất, CSS tự chèn)
   Mỗi bạn đứng yên nhưng tay chân cử động: vẫy, reo hò, nhảy, nhảy múa, ôm cằm suy nghĩ,
   mắt + đầu nhìn theo con trỏ chuột, bấm vào thì nhảy và nói chuyện.
   Props tùy chọn: count (1–4), size (px tối đa, mặc định 300)
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

/* ---------- tư thế: trả về góc/độ lệch mục tiêu của từng bộ phận ----------
   Góc dương = xoay theo chiều kim đồng hồ. Tay trái: dương = giơ ra/lên.
   Tay phải (cầm bình): âm = giơ ra/lên.                                    */
function targets(pose, t, ph, dir, u) {
  const o = { lookX: 0, lookY: 0, armL: 4, handL: 0, armR: -4, legL: 0, legR: 0, liftL: 0, liftR: 0, head: 0, lean: 0, bob: 0, bx: 0, hop: 0, spark: 0 };
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

const KEYS = ['armL', 'handL', 'armR', 'legL', 'legR', 'liftL', 'liftR', 'head', 'lean', 'bob', 'bx', 'hop', 'spark', 'mouth', 'lookX', 'lookY'];

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
  P.eyeL.setAttribute('transform', `translate(${f(c.lookX)} ${f(c.lookY)}) translate(250 312) scale(1 ${f(blink)}) translate(-250 -312)`);
  P.eyeR.setAttribute('transform', `translate(${f(c.lookX)} ${f(c.lookY)}) translate(390 312) scale(1 ${f(blink)}) translate(-390 -312)`);
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


const CSS = `
.eb-layer { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 20; pointer-events: none; }
.eb-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.eb-buddy { position: absolute; pointer-events: none; transform-origin: 50% 100%; animation: eb-pop .7s cubic-bezier(.2, .9, .25, 1.25) both; }
.eb-buddy[data-vis='0'] { display: none; }
.eb-buddy[data-talk] { z-index: 5; }
@keyframes eb-pop { from { opacity: 0; transform: translateY(24px) scale(.82); } to { opacity: 1; transform: none; } }

.eb-buddy .ec-svg { display: block; width: 100%; height: auto; overflow: visible; pointer-events: none; }
.eb-buddy .ec-svg .ec-hit { pointer-events: auto; cursor: pointer; }
.eb-buddy .ec-svg [data-f] { display: none; }
.eb-buddy .ec-svg[data-face='default'] [data-f~='default'],
.eb-buddy .ec-svg[data-face='happy'] [data-f~='happy'],
.eb-buddy .ec-svg[data-face='think'] [data-f~='think'],
.eb-buddy .ec-svg[data-face='wink'] [data-f~='wink'] { display: inline; }

.eb-bubble {
  position: absolute; left: 50%; bottom: calc(100% + 6px);
  width: max-content; max-width: 230px; padding: .6rem .9rem; border-radius: 18px; text-align: center;
  background: var(--surface, #fff); color: var(--ink, #10223f);
  border: 1px solid var(--line, rgba(30, 80, 200, .18));
  box-shadow: var(--sh-2, 0 10px 28px -10px rgba(20, 60, 160, .35));
  font: 500 .9rem/1.4 var(--sans, system-ui, sans-serif);
  opacity: 0; transform: translate(-50%, 6px) scale(.92); transform-origin: 50% 100%;
  transition: opacity .22s ease, transform .28s cubic-bezier(.2, .8, .2, 1.2); pointer-events: none;
}
.eb-bubble[data-show='1'] { opacity: 1; transform: translate(-50%, 0) scale(1); }
.eb-bubble::after {
  content: ''; position: absolute; left: 50%; bottom: -6px; width: 10px; height: 10px;
  background: inherit; border: inherit; border-top: 0; border-left: 0; border-radius: 0 0 3px 0;
  transform: translateX(-50%) rotate(45deg);
}
.eb-buddy[data-pose='jump'] .eb-bubble[data-show='1'] { transform: translate(-50%, -40px) scale(1); }

@media (max-width: 1099px), print { .eb-layer { display: none; } }
@media (prefers-reduced-motion: reduce) { .eb-buddy { animation: none; } .eb-bubble { transition: none; } }
`;

/* ---------- các bạn đứng cạnh từng mục: vị trí = neo vào phần tử trên trang ---------- */
const BUDDIES = [
  { id: 'hero', anchor: '.bento-today-widget', side: 'right', drop: 0.2, base: 'default', first: 'wave',
    w: { idle: 3, wave: 3, cheer: 1, think: 1, dance: 1, jump: 1 },
    hello: ['Chào bạn! Hôm nay ôn chương nào nè?', 'Xin chào! Mình là Elec 👋'],
    lines: ['Hỏi ELECAI bất kỳ bài Hóa nào nhé!', 'Chụp đề là có lời giải từng bước luôn!', 'Mục tiêu hôm nay chỉ 5 câu thôi, dễ mà!'],
    think: ['Hmm… hôm nay ôn gì ta?'], cheer: ['Giỏi quá! Tiếp tục nào!'],
    click: ['Á! Nhột đó nha 😆', 'Hỏi ELECAI bài khó đi, mình giúp!', 'Bấm gì mà bấm hoài vậy 😄'] },
  { id: 'stats', anchor: '.bento-stats-strip', side: 'left', drop: 0.02, base: 'happy', first: 'cheer',
    w: { idle: 1, wave: 1, cheer: 2, think: 0.3, dance: 3, jump: 3 },
    hello: ['Hihi, chào bạn!', 'Cùng học nào! ✨'],
    lines: ['Giữ chuỗi ngày học nha 🔥', 'Độ chính xác tăng dần là đang tiến bộ đó!', 'Mỗi ngày một ít, nhớ lâu hơn nhiều!'],
    think: ['Ơ… hay là mình nhảy tiếp nhỉ?'], cheer: ['Yeah! Cố lên nào!'],
    click: ['Hihi!', 'Yeah! Nhảy cùng mình nào 🎶', 'Nhấc mình lên cao nữa đi 😆'] },
  { id: 'element', anchor: '.bento-element-card', side: 'right', drop: 0.02, base: 'default', first: 'think',
    w: { idle: 2, wave: 1, cheer: 0.5, think: 4, dance: 0.5, jump: 0.5 },
    hello: ['Ơ, chào bạn!', 'Bạn cũng đang xem nguyên tố hả?'],
    lines: ['Bảng tuần hoàn có 118 nguyên tố đó!', 'Số oxi hóa tăng = bị oxi hóa, nhớ chưa?', 'Mol là cầu nối giữa khối lượng và số hạt.'],
    think: ['Hmm… nguyên tố này có mấy electron nhỉ?', 'Để mình nhẩm lại cấu hình electron…'], cheer: ['À! Ra rồi!'],
    click: ['Đang suy nghĩ mà… 🤔', 'Khoan, để mình nghĩ đã!'] },
  { id: 'games', anchor: '.bento-games', side: 'left', drop: 0.02, base: 'default', winker: true, first: 'wave',
    w: { idle: 2, wave: 2, cheer: 1, think: 1, dance: 2, jump: 1.5 },
    hello: ['Ê, chào nè 😉', 'Ghé chơi game Hóa học với mình nhé!'],
    lines: ['Chơi một ván cho đỡ căng thẳng nè!', 'Pha loãng axit: rót axit vào nước nha!', 'Este thơm mùi hoa quả thật luôn đó!'],
    think: ['Hừm, ván này có bẫy không ta?'], cheer: ['Quá đỉnh!'],
    click: ['Hì, bắt được mình rồi 😉', 'Bí quyết: ôn đều mỗi ngày!'] },
];

let lastSpeakAt = 0;
const mouse = { x: -1, y: -1, on: false };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function createBuddy(layer, spec, o) {
  const reduce = o.reduce;
  const el = document.createElement('div');
  el.className = 'eb-buddy';
  el.dataset.vis = '0';
  el.innerHTML = MASCOT + '<div class="eb-bubble" data-show="0"></div>';
  layer.appendChild(el);
  const svg = el.querySelector('.ec-svg');
  const bubble = el.querySelector('.eb-bubble');
  const P = {};
  svg.querySelectorAll('[data-part]').forEach((n) => { P[n.getAttribute('data-part')] = n; });

  let pose = 'idle', poseT = 0, poseDur = 1.2, faceNow = spec.base, faceShown = '';
  let t = rand(0, 10), talkUntil = 0, hideTimer = 0, lastLine = '', busyUntil = 0;
  let nextBlink = performance.now() + rand(1500, 4000), blinkStart = -1e9;
  let nextWink = performance.now() + rand(4000, 8000), winkUntil = 0;
  let wasVisible = false, startedAt = 0;
  let px = 0, py = 0, pw = 200;               // vị trí trang (page coords) & bề rộng hiện tại
  let last = performance.now(), raf = 0, dead = false, firstDone = false;
  const cur = { ...targets('idle', 0, 0, 1, 0), mouth: 1 };

  function say(src, force) {
    const now = performance.now();
    if (!force && now - lastSpeakAt < 6500) return;
    let text = Array.isArray(src) ? pickOne(src) : src;
    if (Array.isArray(src) && src.length > 1 && text === lastLine) text = pickOne(src);
    lastLine = text; lastSpeakAt = now;
    bubble.textContent = text; bubble.dataset.show = '1'; el.dataset.talk = '1';
    talkUntil = now + Math.min(2600, 500 + text.length * 45);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { bubble.dataset.show = '0'; delete el.dataset.talk; }, 1800 + text.length * 55);
  }

  function enter(p) {
    pose = p; poseT = 0; el.dataset.pose = p;
    switch (p) {
      case 'idle': poseDur = rand(1.6, 3.6); faceNow = spec.base; if (Math.random() < 0.2) say(spec.lines); break;
      case 'wave': poseDur = 2.4; faceNow = 'wink'; if (Math.random() < 0.55) say(spec.hello); break;
      case 'jump': poseDur = 1.9; faceNow = 'happy'; break;
      case 'cheer': poseDur = 2.2; faceNow = 'happy'; if (Math.random() < 0.35) say(spec.cheer); break;
      case 'dance': poseDur = 3.6; faceNow = 'happy'; break;
      case 'think': poseDur = 3.0; faceNow = 'think'; if (Math.random() < 0.7) say(spec.think); break;
      default: poseDur = 1.5;
    }
  }
  function next() {
    let tot = 0;
    for (const k in spec.w) if (k !== pose) tot += spec.w[k];
    let r = Math.random() * tot, pick = 'idle';
    for (const k in spec.w) { if (k === pose) continue; if ((r -= spec.w[k]) <= 0) { pick = k; break; } }
    // sau mỗi hành động lớn thì nghỉ một nhịp cho tự nhiên
    enter(pose !== 'idle' && Math.random() < 0.6 ? 'idle' : pick);
  }

  P.body.addEventListener('pointerenter', () => {
    if (reduce || performance.now() < busyUntil) return;
    if (pose === 'idle') enter('wave');
  });
  P.body.addEventListener('click', () => {
    busyUntil = performance.now() + 1200;
    if (!reduce) enter('jump');
    say(spec.click, true);
  });

  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (el.dataset.vis !== '1') return;
    if (!wasVisible) { wasVisible = true; startedAt = now; }
    t += dt; poseT += dt;
    // vừa hiện ra thì làm động tác "đặc trưng" của bạn đó trước
    if (!firstDone && now - startedAt > 700 + o.index * 350) { firstDone = true; enter(spec.first); }
    else if (poseT >= poseDur) next();

    if (now > nextBlink) { blinkStart = now; nextBlink = now + rand(2200, 5200); }
    const bp = (now - blinkStart) / 150;
    const blink = bp < 1 ? 1 - 0.92 * Math.sin(Math.PI * bp) : 1;
    if (spec.winker && pose === 'idle' && now > nextWink) { winkUntil = now + 750; nextWink = now + rand(5500, 10000); }
    const face = spec.winker && pose === 'idle' && now < winkUntil ? 'wink' : faceNow;
    if (face !== faceShown) { svg.dataset.face = face; faceShown = face; }

    const tg = targets(pose, t, 0, 1, poseT);
    tg.mouth = now < talkUntil ? 0.55 + 0.45 * Math.abs(Math.sin(t * 14)) : 1;
    // mắt + đầu nhìn theo con trỏ chuột
    const H = pw * 730 / 500;
    const hx = px - window.scrollX + pw * 250 / 500, hy = py - window.scrollY + H * 300 / 730;
    let dx, dy;
    if (mouse.on) { dx = mouse.x - hx; dy = mouse.y - hy; } else { dx = Math.sin(t * 0.6) * 220; dy = 60; }
    tg.lookX = clamp(dx / 450, -1, 1) * 10; tg.lookY = clamp(dy / 450, -1, 1) * 7;
    if (pose !== 'think' && pose !== 'dance') tg.head += clamp(dx / 700, -1, 1) * 6;
    const k = 1 - Math.exp(-14 * dt);
    for (const key of KEYS) cur[key] += (tg[key] - cur[key]) * k;
    render(P, cur, t, blink);
  }

  if (reduce) { svg.dataset.face = spec.base; faceShown = spec.base; render(P, cur, 0, 1); }
  else raf = requestAnimationFrame(frame);

  return {
    el,
    setBox(x, y, w, show) {
      px = x; py = y; pw = w;
      el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px';
      el.dataset.vis = show ? '1' : '0';
      if (reduce && show && !firstDone) { firstDone = true; svg.dataset.face = spec.base; }
    },
    destroy() { dead = true; cancelAnimationFrame(raf); clearTimeout(hideTimer); el.remove(); },
  };
}

function mountBuddies(opts = {}) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.getElementById('eb-style')) {
    const st = document.createElement('style');
    st.id = 'eb-style'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  const layer = document.createElement('div');
  layer.className = 'eb-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = DEFS.replace('class="ec-defs"', 'class="eb-defs"');
  document.body.appendChild(layer);

  const buddies = BUDDIES.slice(0, opts.count || BUDDIES.length).map((spec, i) => ({ spec, b: createBuddy(layer, spec, { reduce, index: i }) }));
  const MIN_MARGIN = opts.minMargin || 90, MAX_W = opts.size || 300;

  function layout() {
    const vw = document.documentElement.clientWidth;
    const wrap = document.querySelector('.db-bento-wrap');
    const lr = layer.getBoundingClientRect();
    const ox = lr.left + window.scrollX, oy = lr.top + window.scrollY;
    const wr = wrap && vw >= 1100 ? wrap.getBoundingClientRect() : null;
    for (const { spec, b } of buddies) {
      const a = wr && document.querySelector(spec.anchor);
      if (!a) { b.setBox(0, 0, 10, false); continue; }
      const left = spec.side === 'left';
      const margin = left ? wr.left : vw - wr.right;
      if (margin < MIN_MARGIN) { b.setBox(0, 0, 10, false); continue; }
      const W = clamp(margin + 40, 130, MAX_W), H = (W * 730) / 500;
      const ar = a.getBoundingClientRect();
      let cx = left ? wr.left - W + 40 : wr.right - 40;
      cx = clamp(cx, 6, vw - W - 6);
      const footY = ar.bottom + window.scrollY + spec.drop * H;
      b.setBox(cx + window.scrollX - ox, footY - H - oy, W, true);
    }
  }
  layout();

  const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', layout);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
  if (ro) ro.observe(document.body);
  const iv = setInterval(layout, 600);   // trang tải dần / đổi lớp → neo lại vị trí

  return {
    destroy() {
      clearInterval(iv); ro && ro.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', layout);
      buddies.forEach(({ b }) => b.destroy()); layer.remove();
    },
  };
}

export default function ElecBuddies({ count, size }) {
  useEffect(() => {
    const m = mountBuddies({ count, size });
    return () => m.destroy();
  }, [count, size]);
  return null;
}
