const fs = require('fs');
const path = require('path');

function getStudentAvatarSvg(name = '', uid = '', size = 64) {
  const seed = (name || uid || 'student');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  // Background palettes
  const BG_GRADIENTS = [
    ['#ec4899', '#f43f5e'], // Rose / pink (Thư Vũ)
    ['#f97316', '#fbbf24'], // Amber / orange (Lộc)
    ['#06b6d4', '#3b82f6'], // Cyan / blue
    ['#8b5cf6', '#a855f7'], // Violet / purple
    ['#10b981', '#14b8a6'], // Emerald / teal
    ['#6366f1', '#8b5cf6'], // Indigo
  ];
  const [bg1, bg2] = BG_GRADIENTS[hash % BG_GRADIENTS.length];
  const preset = hash % 4;
  const hasGlasses = (hash >> 3) % 2 === 1;

  // Render SVG
  return `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:50%;display:block;">
  <defs>
    <linearGradient id="bg-${hash}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <clipPath id="clip-${hash}">
      <circle cx="32" cy="32" r="32" />
    </clipPath>
  </defs>

  <g clip-path="url(#clip-${hash})">
    <!-- Circle Background -->
    <rect width="64" height="64" fill="url(#bg-${hash})" />

    <!-- Shoulders / Clothes -->
    <path d="M14 62 C16 48, 24 44, 32 44 C40 44, 48 48, 50 62 Z" fill="#ffffff" opacity="0.92" />
    <path d="M28 44 L32 50 L36 44 Z" fill="#e2e8f0" />

    <!-- Neck -->
    <rect x="28" y="38" width="8" height="8" rx="2" fill="#ffd1b3" />

    <!-- Head / Face -->
    <circle cx="32" cy="27" r="13" fill="#ffe0cc" />

    <!-- Cheeks (Blush) -->
    <circle cx="23" cy="29" r="2.2" fill="#fca5a5" opacity="0.6" />
    <circle cx="41" cy="29" r="2.2" fill="#fca5a5" opacity="0.6" />

    <!-- Eyes -->
    ${hasGlasses ? `
      <!-- Glasses -->
      <circle cx="26" cy="26" r="4.2" stroke="#1e293b" stroke-width="1.3" fill="none" />
      <circle cx="38" cy="26" r="4.2" stroke="#1e293b" stroke-width="1.3" fill="none" />
      <line x1="30.2" y1="26" x2="33.8" y2="26" stroke="#1e293b" stroke-width="1.3" />
      <circle cx="26" cy="26" r="1.5" fill="#1e293b" />
      <circle cx="38" cy="26" r="1.5" fill="#1e293b" />
    ` : `
      <circle cx="26" cy="26" r="1.8" fill="#1e293b" />
      <circle cx="38" cy="26" r="1.8" fill="#1e293b" />
    `}

    <!-- Smile -->
    <path d="M29 32 Q32 35 35 32" stroke="#1e293b" stroke-width="1.4" stroke-linecap="round" fill="none" />

    <!-- Hair Styles based on preset -->
    ${preset === 0 ? `
      <!-- Hair 0: Girl bangs + bob hair -->
      <path d="M19 25 C19 14, 45 14, 45 25 C45 32, 42 34, 42 34 C42 34, 41 20, 32 20 C23 20, 22 34, 22 34 C22 34, 19 32, 19 25 Z" fill="#33241b" />
      <path d="M20 22 C24 16, 40 16, 44 22 C41 18, 35 18, 32 20 C29 18, 23 18, 20 22 Z" fill="#4a3528" />
      <circle cx="41" cy="21" r="2" fill="#fbbf24" />
    ` : preset === 1 ? `
      <!-- Hair 1: Boy modern parted short hair -->
      <path d="M19 24 C19 15, 26 13, 33 14 C40 15, 45 18, 45 24 C45 24, 43 19, 36 18 C28 17, 21 21, 19 24 Z" fill="#1e293b" />
      <path d="M18 24 C18 19, 21 16, 27 15 C23 18, 21 21, 20 26 Z" fill="#334155" />
    ` : preset === 2 ? `
      <!-- Hair 2: Wavy hair / side swept -->
      <path d="M19 25 C18 16, 28 13, 38 15 C45 17, 46 25, 46 27 C44 22, 38 18, 32 19 C25 20, 21 23, 19 25 Z" fill="#451a03" />
      <path d="M18 27 C17 21, 20 17, 25 15 C21 18, 19 22, 19 28 Z" fill="#78350f" />
    ` : `
      <!-- Hair 3: Student with cap or neat styled hair -->
      <path d="M18 23 C19 14, 45 14, 46 23 C44 18, 38 17, 32 17 C26 17, 20 18, 18 23 Z" fill="#0f172a" />
      <path d="M19 23 L45 23 L43 25 L21 25 Z" fill="#3b82f6" opacity="0.8" />
    `}
  </g>
</svg>
  `.trim();
}

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Student Avatars Preview</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 40px; display: flex; gap: 24px; align-items: center; }
    .card { background: #1e293b; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  </style>
</head>
<body>
  <div class="card">
    ${getStudentAvatarSvg('Thư Vũ', 'uid-thu-vu', 64)}
    <b>Thư Vũ</b>
  </div>
  <div class="card">
    ${getStudentAvatarSvg('Lộc', 'uid-loc', 64)}
    <b>Lộc</b>
  </div>
  <div class="card">
    ${getStudentAvatarSvg('Mai Anh', 'uid-mai-anh', 64)}
    <b>Mai Anh</b>
  </div>
  <div class="card">
    ${getStudentAvatarSvg('Hoàng Nam', 'uid-hoang-nam', 64)}
    <b>Hoàng Nam</b>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'preview_student_avatars.html'), html);
console.log('Saved preview_student_avatars.html');
