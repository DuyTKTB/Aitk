/* ============================================================
   ActivityHeatmap365.jsx — Bản Đồ Nhiệt Hoạt Động Kiểu GitHub
   + Tổng hợp ELO, Lực Chiến, Số ngày học & Chuỗi Băng giữ chuỗi
   Dùng trên trang Hồ sơ cá nhân (ProfilePage.jsx)
   ============================================================ */
import React, { useMemo } from 'react';
import { getVirtualExamHistory } from '../data/virtualExamsBank.js';
import { readStore } from '../lib/roadmapStore.js';
import {
  buildActivityHeatmap365,
  getStudentElo,
  computeEloUpdate,
  getStudentCombatPower,
} from '../lib/studentAnalytics.js';
import '../styles/student-v9-upgrades.css';

export default function ActivityHeatmap365({ uid = 'guest', streakDays = 0 }) {
  const data = useMemo(() => {
    const virtualHistory = getVirtualExamHistory(uid) || [];
    const roadmapSessions = (readStore(uid)?.sessions || []);
    let pomodoroHistory = {};
    try {
      pomodoroHistory = JSON.parse(localStorage.getItem('cs-pomo-history') || '{}') || {};
    } catch { /* ignore */ }

    const heatmap = buildActivityHeatmap365({
      virtualHistory,
      roadmapSessions,
      pomodoroHistory,
      days: 182, // 26 tuần (nửa năm cực gọn đẹp cả desktop & mobile)
    });

    const eloState = getStudentElo(uid);
    const eloRank = computeEloUpdate({ currentElo: eloState.elo, pct: 60 }).rank;
    const powerState = getStudentCombatPower(uid);
    let freezeCount = 1;
    try {
      const saved = localStorage.getItem('cs-streak-freeze-count');
      if (saved !== null) freezeCount = Math.max(0, Number(saved));
    } catch { /* ignore */ }

    return { heatmap, elo: eloState.elo, eloRank, powerState, freezeCount };
  }, [uid]);

  return (
    <section className="s9-hm365-card" aria-label="Bản đồ nhiệt hoạt động học tập">
      <div className="s9-hm365-head">
        <div>
          <h3>Bản đồ nhiệt hoạt động (26 tuần gần nhất)</h3>
          <p>
            <b>{data.heatmap.activeDays}</b> ngày học tích cực · <b>{data.heatmap.totalActions}</b> phiên ôn tập &amp; luyện đề
          </p>
        </div>
        <button
          type="button"
          className="s9-hm365-streak-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('elec-open-streak-modal'))}
        >
          Chuỗi {streakDays} ngày · {data.freezeCount} Băng bảo vệ
        </button>
      </div>

      <div className="s9-hm365-metrics">
        <div className="s9-hm365-metric">
          <span>ELO Năng lực</span>
          <b>{data.elo.toLocaleString('vi-VN')}</b>
          <small>{data.eloRank.label}</small>
        </div>
        <div className="s9-hm365-metric">
          <span>Lực chiến</span>
          <b>{data.powerState.power.toLocaleString('vi-VN')}</b>
          <small>{data.powerState.tier.label}</small>
        </div>
        <div className="s9-hm365-metric">
          <span>Băng giữ chuỗi</span>
          <b>{data.freezeCount} khiên</b>
          <small>Tự vá ngày nghỉ</small>
        </div>
      </div>

      <div className="s9-hm365-grid-wrap">
        <div className="s9-hm365-grid" role="list">
          {data.heatmap.cells.map((cell) => (
            <span
              key={cell.key}
              role="listitem"
              className={`s9-hm365-cell lv-${cell.level}`}
              title={`${cell.label}: ${cell.count} hoạt động học tập`}
            />
          ))}
        </div>
      </div>

      <div className="s9-hm365-foot">
        <span>Ít</span>
        <div className="s9-hm365-legend">
          <i className="lv-0" />
          <i className="lv-1" />
          <i className="lv-2" />
          <i className="lv-3" />
          <i className="lv-4" />
        </div>
        <span>Nhiều</span>
      </div>
    </section>
  );
}
