/* ============================================================
   StudentAbilityHub.jsx — Hồ Sơ Năng Lực Học Viên 2.0
   1. Biểu đồ Radar 6 trục năng lực (SVG thuần, tính từ dữ liệu thật)
   2. Dự báo quỹ đạo điểm /30 THPTQG so với mục tiêu NV1
   3. Xuất ảnh Thẻ Học Bá 1200x630 (.png) qua HTML5 Canvas để khoe bạn
   ============================================================ */
import React, { useEffect, useMemo, useState } from 'react';
import { getVirtualExamHistory } from '../data/virtualExamsBank.js';
import { readStore } from '../lib/roadmapStore.js';
import {
  computeStudentAbilityRadar,
  computeRealPredictedScore30,
  getStudentElo,
  computeEloUpdate,
  getStudentCombatPower,
  loadTargetUniversity,
  getRewardShopState,
  SHOP_CATALOG,
} from '../lib/studentAnalytics.js';
import RewardShopModal from './RewardShopModal.jsx';
import '../styles/student-v9-upgrades.css';

function getDaysToThptqg() {
  const now = new Date();
  const y = now.getFullYear();
  let target = new Date(y, 5, 26, 7, 30, 0);
  if (now.getTime() > target.getTime()) target = new Date(y + 1, 5, 26, 7, 30, 0);
  return {
    days: Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 86400000)),
    year: target.getFullYear(),
  };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function StudentAbilityHub({
  uid = 'guest',
  displayName = 'Học sinh ELEC AI',
  streakDays = 0,
}) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopState, setShopState] = useState(() => getRewardShopState(uid));

  useEffect(() => {
    const sync = () => setShopState(getRewardShopState(uid));
    sync();
    window.addEventListener('elec-shop-updated', sync);
    return () => window.removeEventListener('elec-shop-updated', sync);
  }, [uid]);

  const activeFrame = SHOP_CATALOG.find((x) => x.id === shopState.equippedFrame) || SHOP_CATALOG[0];
  const initials = String(displayName || 'E').trim().slice(0, 1).toUpperCase();

  const info = useMemo(() => {
    const virtualHistory = getVirtualExamHistory(uid) || [];
    const roadmapSessions = readStore(uid)?.sessions || [];
    let pomodoroHistory = {};
    let wrongCount = 0;
    try {
      pomodoroHistory = JSON.parse(localStorage.getItem('cs-pomo-history') || '{}') || {};
      const wrongList = JSON.parse(localStorage.getItem('elec-wrong-questions') || '[]');
      if (Array.isArray(wrongList)) wrongCount = wrongList.length;
    } catch { /* ignore */ }

    const eloState = getStudentElo(uid);
    const eloRank = computeEloUpdate({ currentElo: eloState.elo, pct: 60 }).rank;
    const powerState = getStudentCombatPower(uid);
    const nv1 = loadTargetUniversity(uid);
    const pred30 = computeRealPredictedScore30({ virtualHistory });
    const radar = computeStudentAbilityRadar({
      virtualHistory,
      roadmapSessions,
      pomodoroHistory,
      streakDays,
      wrongCount,
      elo: eloState.elo,
    });
    const countdown = getDaysToThptqg();
    const nv1Cutoff = Number(nv1?.s2025 || nv1?.s2024 || 0);
    const gap = pred30 != null && nv1Cutoff > 0 ? Number((nv1Cutoff - pred30).toFixed(2)) : null;
    const weeksLeft = Math.max(1, Math.round(countdown.days / 7));
    const gainPerMonth = gap != null && gap > 0 ? Number((gap / Math.max(1, weeksLeft / 4)).toFixed(2)) : 0;

    return {
      elo: eloState.elo,
      eloRank,
      powerState,
      nv1,
      nv1Cutoff,
      pred30,
      radar,
      countdown,
      gap,
      gainPerMonth,
      examsDone: virtualHistory.length,
    };
  }, [uid, streakDays]);

  // SVG Radar geometry
  const cx = 130;
  const cy = 122;
  const maxR = 84;
  const n = info.radar.axes.length;

  const getPoint = (idx, ratio) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxR * ratio,
      y: cy + Math.sin(angle) * maxR * ratio,
    };
  };

  const dataPolygon = info.radar.axes
    .map((a, idx) => {
      const pt = getPoint(idx, Math.max(0.15, a.score / 100));
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const exportCardPng = () => {
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      // Deep midnight luxe background
      const grad = ctx.createLinearGradient(0, 0, 1200, 630);
      grad.addColorStop(0, '#0b1224');
      grad.addColorStop(0.55, '#172554');
      grad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Subtle glow orbs
      const orb = ctx.createRadialGradient(980, 130, 20, 980, 130, 320);
      orb.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      orb.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, 1200, 630);

      // Outer glass card
      drawRoundedRect(ctx, 44, 40, 1112, 550, 28);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.56)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Header badge
      drawRoundedRect(ctx, 84, 78, 250, 38, 19);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.28)';
      ctx.fill();
      ctx.fillStyle = '#93c5fd';
      ctx.font = '700 18px system-ui, -apple-system, sans-serif';
      ctx.fillText('THẺ HỌC BÁ · ELEC AI', 108, 103);

      // Student Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 46px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(displayName || 'Học sinh ELEC AI').slice(0, 28), 84, 178);

      // NV1 subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 22px system-ui, -apple-system, sans-serif';
      const nv1Line = info.nv1
        ? `Mục tiêu NV1: ${info.nv1.uni} (${info.nv1.code}) · ${info.nv1.major}`
        : `Hành trình chinh phục THPTQG ${info.countdown.year} · Còn ${info.countdown.days} ngày`;
      ctx.fillText(nv1Line.slice(0, 62), 84, 218);

      // 4 KPI Cards
      const kpis = [
        { lbl: 'ELO NĂNG LỰC', val: `${info.elo}`, sub: info.eloRank.label },
        { lbl: 'LỰC CHIẾN', val: info.powerState.power.toLocaleString('vi-VN'), sub: info.powerState.tier.label },
        { lbl: 'DỰ ĐOÁN /30', val: info.pred30 != null ? `${info.pred30}` : '--', sub: `${info.examsDone} đề đã thi` },
        { lbl: 'CHUỖI NGÀY', val: `${streakDays} ngày`, sub: `Tổng lực ${info.radar.overall}/100` },
      ];
      kpis.forEach((k, idx) => {
        const x = 84 + idx * 260;
        const y = 264;
        drawRoundedRect(ctx, x, y, 240, 138, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#93c5fd';
        ctx.font = '700 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(k.lbl, x + 22, y + 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 36px system-ui, -apple-system, sans-serif';
        ctx.fillText(k.val, x + 22, y + 86);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 17px system-ui, -apple-system, sans-serif';
        ctx.fillText(k.sub, x + 22, y + 118);
      });

      // 6-axis mastery bar summary
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 19px system-ui, -apple-system, sans-serif';
      ctx.fillText('CHỈ SỐ 6 TRỤC NĂNG LỰC:', 84, 448);

      info.radar.axes.forEach((ax, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = 84 + col * 348;
        const y = 472 + row * 48;
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 17px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${ax.label}`, x, y + 14);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 17px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${ax.score}%`, x + 150, y + 14);

        drawRoundedRect(ctx, x + 206, y + 2, 118, 12, 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fill();
        drawRoundedRect(ctx, x + 206, y + 2, Math.max(10, (118 * ax.score) / 100), 12, 6);
        ctx.fillStyle = '#34d399';
        ctx.fill();
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-hoc-ba-elec-ai-${Date.now()}.png`;
      a.click();
    } catch { /* ignore */ } finally {
      setExporting(false);
    }
  };

  const copyFlexSummary = () => {
    const text = [
      `Hồ sơ Học Bá ELEC AI — ${displayName}`,
      `• ELO Năng lực: ${info.elo} (${info.eloRank.label})`,
      `• Lực chiến: ${info.powerState.power.toLocaleString('vi-VN')} (${info.powerState.tier.label})`,
      `• Điểm năng lực tổng hợp: ${info.radar.overall}/100 (Mạnh nhất: ${info.radar.strongest.label} ${info.radar.strongest.score}%)`,
      info.nv1 ? `• Mục tiêu NV1: ${info.nv1.major} — ${info.nv1.uni}` : null,
      `• Chuỗi giữ lửa: ${streakDays} ngày liên tiếp`,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <section className="s9-ahub-card" aria-label="Hồ sơ năng lực 6 trục và Thẻ học bá">
      <div className="s9-ahub-head">
        <div className="s9-ahub-identity">
          <div className={`s9-avatar-ring sm ${activeFrame.previewClass || 's9-frame-minimal'}`}>
            <div className="s9-avatar-core sm">{initials}</div>
          </div>
          <div>
            <span className="s9-ahub-eyebrow">
              HỒ SƠ NĂNG LỰC 2.0 {shopState.equippedTitle ? `· ${shopState.equippedTitle.toUpperCase()}` : ''}
            </span>
            <h3>Bản đồ 6 trục năng lực &amp; Quỹ đạo mục tiêu THPTQG</h3>
          </div>
        </div>
        <div className="s9-ahub-actions">
          <button type="button" className="s9-ahub-btn shop" onClick={() => setShopOpen(true)}>
            Cửa hàng ({shopState.coins} Xu)
          </button>
          <button type="button" className="s9-ahub-btn primary" onClick={exportCardPng} disabled={exporting}>
            {exporting ? 'Đang tạo ảnh...' : 'Tải Thẻ Học Bá (.png)'}
          </button>
          <button type="button" className="s9-ahub-btn ghost" onClick={copyFlexSummary}>
            {copied ? 'Đã chép thành tích' : 'Chép khoe bạn'}
          </button>
        </div>
      </div>

      <div className="s9-ahub-grid">
        {/* Cột 1: SVG Radar 6 trục */}
        <div className="s9-ahub-radar-box">
          <svg viewBox="0 0 260 244" className="s9-ahub-svg" role="img" aria-label="Biểu đồ Radar 6 trục năng lực">
            {[0.25, 0.5, 0.75, 1].map((r) => {
              const pts = info.radar.axes
                .map((_, idx) => {
                  const pt = getPoint(idx, r);
                  return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                })
                .join(' ');
              return <polygon key={r} points={pts} className="s9-ahub-ring" />;
            })}

            {info.radar.axes.map((_, idx) => {
              const pt = getPoint(idx, 1);
              return <line key={idx} x1={cx} y1={cy} x2={pt.x} y2={pt.y} className="s9-ahub-axis" />;
            })}

            <polygon points={dataPolygon} className="s9-ahub-poly" />

            {info.radar.axes.map((ax, idx) => {
              const pt = getPoint(idx, Math.max(0.15, ax.score / 100));
              const lblPt = getPoint(idx, 1.24);
              return (
                <g key={ax.key}>
                  <circle cx={pt.x} cy={pt.y} r="3.8" className="s9-ahub-dot" />
                  <text
                    x={lblPt.x}
                    y={lblPt.y + 3}
                    textAnchor="middle"
                    className="s9-ahub-lbl"
                  >
                    {ax.label}
                  </text>
                </g>
              );
            })}

            <text x={cx} y={cy - 2} textAnchor="middle" className="s9-ahub-center-val">
              {info.radar.overall}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="s9-ahub-center-sub">
              / 100 điểm
            </text>
          </svg>
        </div>

        {/* Cột 2: Chi tiết 6 trục + Quỹ đạo NV1 */}
        <div className="s9-ahub-right">
          <div className="s9-ahub-bars">
            {info.radar.axes.map((ax) => (
              <div key={ax.key} className="s9-ahub-bar-row">
                <div className="s9-ahub-bar-top">
                  <span>{ax.label}</span>
                  <b>{ax.score}/100</b>
                </div>
                <div className="s9-ahub-bar-track">
                  <i style={{ width: `${ax.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="s9-ahub-traj">
            <div className="s9-ahub-traj-top">
              <strong>
                {info.nv1
                  ? `Quỹ đạo ${info.nv1.code} — ${info.nv1.uni}`
                  : `Đếm ngược THPTQG ${info.countdown.year}`}
              </strong>
              <span className="s9-ahub-days-pill">Còn {info.countdown.days} ngày</span>
            </div>
            <p>
              {info.pred30 != null && info.nv1Cutoff > 0 ? (
                info.gap <= 0 ? (
                  <>
                    Điểm dự đoán hiện tại <b>{info.pred30}/30</b> đã <b>vượt chuẩn tham khảo ({info.nv1Cutoff})</b>. Duy trì luyện đề VIP để giữ chắc suất đỗ!
                  </>
                ) : (
                  <>
                    Điểm dự đoán <b>{info.pred30}/30</b> · còn cách chuẩn <b>{info.nv1Cutoff}</b> khoảng <b>+{info.gap} điểm</b> (nhịp mục tiêu: tăng <b>+{info.gainPerMonth}đ/tháng</b>). Điểm cần nâng nhất: <b>{info.radar.weakest.label}</b>.
                  </>
                )
              ) : (
                <>
                  Hoàn thành ít nhất 1 đề Phòng thi ảo và ghim trường NV1 để AI tính quỹ đạo điểm <b>/30</b> chính xác đến ngày thi.
                </>
              )}
            </p>
            <div className="s9-ahub-traj-links">
              <a href="#virtual-exams">Luyện đề kéo điểm →</a>
              <a href="#admission">{info.nv1 ? 'Xem điểm chuẩn NV1' : 'Ghim trường NV1'}</a>
            </div>
          </div>
        </div>
      </div>

      <RewardShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        uid={uid}
        displayName={displayName}
      />
    </section>
  );
}
