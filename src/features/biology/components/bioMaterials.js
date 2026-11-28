import * as THREE from 'three';

/**
 * bioMaterials.js — Bộ sinh vân bề mặt sinh học PBR (Albedo + Bump Map 512x512)
 * Chạy 100% bằng Canvas2D → THREE.CanvasTexture (không cần tải file ảnh ngoài,
 * cache dùng chung toàn app) giúp mô hình 3D có độ thật y khoa như BioDigital / Sketchfab.
 */
const TEX_CACHE = new Map();

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(size = 512) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function toTex(canvas, isColor = true, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function getOrganicTextures(kind = 'organ', repeat = 2) {
  const cacheKey = `${kind}_${repeat}`;
  if (TEX_CACHE.has(cacheKey)) return TEX_CACHE.get(cacheKey);
  const colorCvs = makeCanvas(512);
  const bumpCvs = makeCanvas(512);
  if (!colorCvs || !bumpCvs) return { map: null, bumpMap: null };

  const cCtx = colorCvs.getContext('2d');
  const bCtx = bumpCvs.getContext('2d');
  const S = 512;
  const rand = seededRand(kind.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));

  if (kind === 'brain') {
    // Rãnh cuộn vỏ não Gyri & Sulci nổi khối 3D
    cCtx.fillStyle = '#e7c6b3';
    cCtx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#d4d4d4';
    bCtx.fillRect(0, 0, S, S);

    for (let i = 0; i < 65; i++) {
      let x = rand() * S;
      let y = rand() * S;
      const steps = 14 + Math.floor(rand() * 16);
      const ang0 = rand() * Math.PI * 2;
      cCtx.beginPath();
      bCtx.beginPath();
      cCtx.moveTo(x, y);
      bCtx.moveTo(x, y);
      let ang = ang0;
      for (let k = 0; k < steps; k++) {
        ang += (rand() - 0.5) * 1.15;
        x += Math.cos(ang) * 18;
        y += Math.sin(ang) * 18;
        cCtx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
      // Viền rãnh sâu tối màu (sulci)
      cCtx.strokeStyle = 'rgba(138, 69, 58, 0.55)';
      cCtx.lineWidth = 10;
      cCtx.lineCap = 'round';
      cCtx.lineJoin = 'round';
      cCtx.stroke();

      // Mao mạch đỏ mảnh chạy dọc rãnh não
      cCtx.strokeStyle = 'rgba(185, 28, 28, 0.35)';
      cCtx.lineWidth = 2;
      cCtx.stroke();

      // Bump map: rãnh lõm sâu xuống màu tối
      bCtx.strokeStyle = 'rgba(25, 25, 25, 0.85)';
      bCtx.lineWidth = 13;
      bCtx.lineCap = 'round';
      bCtx.lineJoin = 'round';
      bCtx.stroke();
    }
  } else if (kind === 'muscle') {
    // Thớ cơ vân đỏ xen gân trắng dọc
    cCtx.fillStyle = '#b91c1c';
    cCtx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, S, S);

    for (let i = 0; i < 240; i++) {
      const x = (i / 240) * S + (rand() - 0.5) * 4;
      const isTendon = rand() > 0.86;
      cCtx.strokeStyle = isTendon
        ? `rgba(254, 226, 226, ${0.22 + rand() * 0.25})`
        : `rgba(${120 + Math.floor(rand() * 90)}, 24, 38, ${0.4 + rand() * 0.45})`;
      cCtx.lineWidth = isTendon ? 1.8 : 2.6 + rand() * 2.4;
      cCtx.beginPath();
      cCtx.moveTo(x, 0);
      cCtx.bezierCurveTo(x + (rand() - 0.5) * 16, S * 0.33, x + (rand() - 0.5) * 16, S * 0.66, x, S);
      cCtx.stroke();

      bCtx.strokeStyle = isTendon ? 'rgba(230,230,230,0.65)' : 'rgba(55,55,55,0.55)';
      bCtx.lineWidth = 3;
      bCtx.beginPath();
      bCtx.moveTo(x, 0);
      bCtx.bezierCurveTo(x + (rand() - 0.5) * 14, S * 0.33, x + (rand() - 0.5) * 14, S * 0.66, x, S);
      bCtx.stroke();
    }
  } else if (kind === 'lung') {
    // Tiểu thùy phổi hồng-tím nhạt + mạng mao mạch phổi
    cCtx.fillStyle = '#d98a96';
    cCtx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#909090';
    bCtx.fillRect(0, 0, S, S);

    // Tiểu thùy phế nang dạng cụm tròn phồng nhẹ
    for (let i = 0; i < 220; i++) {
      const cx = rand() * S;
      const cy = rand() * S;
      const r = 10 + rand() * 22;
      const g = cCtx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 2, cx, cy, r);
      g.addColorStop(0, 'rgba(255, 212, 220, 0.55)');
      g.addColorStop(0.75, 'rgba(217, 119, 140, 0.35)');
      g.addColorStop(1, 'rgba(136, 48, 78, 0.5)');
      cCtx.fillStyle = g;
      cCtx.beginPath();
      cCtx.arc(cx, cy, r, 0, Math.PI * 2);
      cCtx.fill();

      const bg = bCtx.createRadialGradient(cx, cy, 1, cx, cy, r);
      bg.addColorStop(0, 'rgba(245,245,245,0.85)');
      bg.addColorStop(1, 'rgba(35,35,35,0.8)');
      bCtx.fillStyle = bg;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();
    }
    // Mạng mao mạch xanh-đỏ mịn trên bề mặt màng phổi
    for (let v = 0; v < 42; v++) {
      let x = rand() * S;
      let y = rand() * S;
      cCtx.beginPath();
      cCtx.moveTo(x, y);
      for (let s = 0; s < 8; s++) {
        x += (rand() - 0.5) * 42;
        y += (rand() - 0.5) * 42;
        cCtx.lineTo(x, y);
      }
      cCtx.strokeStyle = v % 2 === 0 ? 'rgba(59, 130, 246, 0.32)' : 'rgba(220, 38, 38, 0.32)';
      cCtx.lineWidth = 1.4;
      cCtx.stroke();
    }
  } else if (kind === 'bone') {
    // Vân xương ngà tự nhiên
    cCtx.fillStyle = '#ede7d9';
    cCtx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#b0b0b0';
    bCtx.fillRect(0, 0, S, S);

    for (let i = 0; i < 650; i++) {
      const x = rand() * S;
      const y = rand() * S;
      const w = 1 + rand() * 3;
      const h = 8 + rand() * 34;
      cCtx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(180,168,148,0.24)';
      cCtx.fillRect(x, y, w, h);
      bCtx.fillStyle = rand() > 0.5 ? 'rgba(205,205,205,0.35)' : 'rgba(95,95,95,0.35)';
      bCtx.fillRect(x, y, w, h);
    }
  } else if (kind === 'membrane') {
    // Lớp kép Phospholipid dạng hạt hữu cơ + lỗ xuyên màng
    cCtx.fillStyle = '#0ea5e9';
    cCtx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#7c7c7c';
    bCtx.fillRect(0, 0, S, S);

    for (let i = 0; i < 420; i++) {
      const cx = rand() * S;
      const cy = rand() * S;
      const r = 5 + rand() * 12;
      const g = cCtx.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, 'rgba(186, 230, 253, 0.65)');
      g.addColorStop(1, 'rgba(2, 132, 199, 0.12)');
      cCtx.fillStyle = g;
      cCtx.beginPath();
      cCtx.arc(cx, cy, r, 0, Math.PI * 2);
      cCtx.fill();

      const bg = bCtx.createRadialGradient(cx, cy, 1, cx, cy, r);
      bg.addColorStop(0, 'rgba(235,235,235,0.75)');
      bg.addColorStop(1, 'rgba(60,60,60,0.4)');
      bCtx.fillStyle = bg;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();
    }
  } else if (kind === 'cytoplasm') {
    // Đĩa cắt ngang tế bào chất với lưới sợi khung xương tế bào (cytoskeleton)
    const rg = cCtx.createRadialGradient(S / 2, S / 2, 20, S / 2, S / 2, S / 2);
    rg.addColorStop(0, '#0f3057');
    rg.addColorStop(0.75, '#0b2545');
    rg.addColorStop(1, '#1e4e79');
    cCtx.fillStyle = rg;
    cCtx.fillRect(0, 0, S, S);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, S, S);

    for (let i = 0; i < 90; i++) {
      const x1 = rand() * S, y1 = rand() * S;
      const x2 = x1 + (rand() - 0.5) * 180;
      const y2 = y1 + (rand() - 0.5) * 180;
      cCtx.strokeStyle = 'rgba(125, 211, 252, 0.14)';
      cCtx.lineWidth = 1.4;
      cCtx.beginPath();
      cCtx.moveTo(x1, y1);
      cCtx.quadraticCurveTo((x1 + x2) / 2 + 20, (y1 + y2) / 2 - 20, x2, y2);
      cCtx.stroke();
    }
  } else {
    // Vân mô nội tạng hữu cơ chung (gan, ruột, nhân tế bào, ti thể)
    cCtx.fillStyle = '#c8c8c8';
    cCtx.fillRect(0, 0, S, S);
    bCtx.fillStyle = '#858585';
    bCtx.fillRect(0, 0, S, S);

    for (let i = 0; i < 360; i++) {
      const cx = rand() * S;
      const cy = rand() * S;
      const r = 8 + rand() * 24;
      const lum = 155 + Math.floor(rand() * 85);
      const g = cCtx.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, `rgba(${lum}, ${lum}, ${lum}, 0.42)`);
      g.addColorStop(1, 'rgba(90, 90, 90, 0.05)');
      cCtx.fillStyle = g;
      cCtx.beginPath();
      cCtx.arc(cx, cy, r, 0, Math.PI * 2);
      cCtx.fill();

      const bg = bCtx.createRadialGradient(cx, cy, 1, cx, cy, r);
      bg.addColorStop(0, 'rgba(230,230,230,0.65)');
      bg.addColorStop(1, 'rgba(40,40,40,0.45)');
      bCtx.fillStyle = bg;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const out = {
    map: toTex(colorCvs, true, repeat),
    bumpMap: toTex(bumpCvs, false, repeat),
  };
  TEX_CACHE.set(cacheKey, out);
  return out;
}
