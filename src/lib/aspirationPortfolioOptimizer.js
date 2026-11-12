/* ============================================================
   aspirationPortfolioOptimizer.js — BỘ TỐI ƯU HÓA RỔ NGUYỆN VỌNG & SO SÁNH ĐỐI ĐẦU
   ------------------------------------------------------------
   1. Đánh giá sức khỏe danh mục nguyện vọng (Portfolio Health Check):
      • Phân loại 3 tầng: Reach (Mơ ước), Target (Vừa sức), Safety (Bảo hiểm)
      • Kiểm tra lỗi thứ tự ưu tiên (Bộ GD&ĐT xét NV1 -> NV2 -> NV3)
      • Chấm điểm độ an toàn hồ sơ (0 - 100%) và phát hiện rủi ro trượt trắng
      • Đề xuất trường/ngành bảo hiểm tương đương
   2. So sánh song song đối đầu (Head-to-Head Comparison) giữa các trường/ngành
   ============================================================ */

import { getSchoolById, getMajorById } from './aspirationService.js';

/**
 * Đánh giá phân loại một nguyện vọng so với điểm dự đoán
 */
export function classifyAspirationTier(cutoffScore, predictedScore, examScale = 30) {
  if (!Number.isFinite(cutoffScore) || !Number.isFinite(predictedScore)) {
    return {
      tierKey: 'target',
      tierLabel: 'Vừa sức',
      tierTone: 'info',
      diff: 0,
      desc: 'Cần làm thêm bài thi để xác định chính xác vị thế',
    };
  }

  const diff = Number((predictedScore - cutoffScore).toFixed(2));
  const normDiff = (diff / examScale) * 30; // Chuẩn hóa về thang 30

  if (normDiff >= 1.25) {
    return {
      tierKey: 'safety',
      tierLabel: 'Phao cứu sinh · Bảo hiểm an toàn',
      tierTone: 'ok',
      diff,
      desc: `Điểm dự đoán cao hơn điểm chuẩn +${diff}đ. Khả năng đỗ trên 92%.`,
    };
  }
  if (normDiff >= -0.5) {
    return {
      tierKey: 'target',
      tierLabel: 'Vừa sức · Trọng tâm',
      tierTone: 'info',
      diff,
      desc: diff >= 0
        ? `Điểm dự đoán cao hơn điểm chuẩn +${diff}đ. Điểm số nằm đúng ngưỡng cạnh tranh tốt.`
        : `Điểm dự đoán thấp hơn điểm chuẩn ${Math.abs(diff)}đ. Chỉ cần tăng 1-2 câu trắc nghiệm là đỗ.`,
    };
  }
  if (normDiff >= -2.0) {
    return {
      tierKey: 'reach',
      tierLabel: 'Mơ ước · Thử sức bứt phá',
      tierTone: 'warn',
      diff,
      desc: `Điểm dự đoán thấp hơn điểm chuẩn ${Math.abs(diff)}đ. Đây là nguyện vọng thử sức rất đẹp nếu có NV2-NV3 bảo vệ.`,
    };
  }
  return {
    tierKey: 'overreach',
    tierLabel: 'Rủi ro cao · Quá tầm',
    tierTone: 'err',
    diff,
    desc: `Cách điểm chuẩn ${Math.abs(diff)}đ. Nguy cơ trượt rất lớn nếu không có các phương án dự phòng an toàn.`,
  };
}

/**
 * Đánh giá sức khỏe toàn diện của danh mục nguyện vọng (Tối đa 3 NV)
 */
export function evaluatePortfolioHealth(aspirations = [], predictedScore = 24.5, examScale = 30) {
  if (!Array.isArray(aspirations) || aspirations.length === 0) {
    return {
      healthScore: 40,
      statusLabel: 'Chưa đủ nguyện vọng',
      statusTone: 'warn',
      hasInversion: false,
      hasSafetyNet: false,
      tiersCount: { safety: 0, target: 0, reach: 0, overreach: 0 },
      warnings: ['Bạn chưa thêm nguyện vọng nào. Hãy chọn tối thiểu 2–3 nguyện vọng để AI phân tích.'],
      recommendations: ['Nên đăng ký đủ 3 nguyện vọng theo mô hình 3 tầng (Mơ ước - Vừa sức - Bảo hiểm).'],
      analyzedList: [],
      safetyAspirations: [],
      targetAspirations: [],
      reachAspirations: [],
    };
  }

  const analyzedList = aspirations.map((asp, idx) => {
    const cutoff = Number.isFinite(asp.cutoffScore) ? asp.cutoffScore : 24.0;
    const classification = classifyAspirationTier(cutoff, predictedScore, examScale);
    return {
      ...asp,
      priority: idx + 1,
      classification,
    };
  });

  const tiersCount = {
    safety: 0,
    target: 0,
    reach: 0,
    overreach: 0,
  };

  analyzedList.forEach((item) => {
    tiersCount[item.classification.tierKey] = (tiersCount[item.classification.tierKey] || 0) + 1;
  });

  const warnings = [];
  const recommendations = [];

  // 1. Kiểm tra nghịch đảo thứ tự ưu tiên (NV1 điểm chuẩn thấp hơn NV2/NV3)
  let hasInversion = false;
  for (let i = 0; i < analyzedList.length - 1; i += 1) {
    const curCutoff = analyzedList[i].cutoffScore || 0;
    const nextCutoff = analyzedList[i + 1].cutoffScore || 0;
    if (curCutoff > 0 && nextCutoff > 0 && curCutoff < nextCutoff - 0.75) {
      hasInversion = true;
      warnings.push(
        `Nghịch đảo thứ tự: Nguyện vọng ${i + 1} (${analyzedList[i].school?.code || 'ĐH'} - ${curCutoff}đ) có điểm chuẩn thấp hơn Nguyện vọng ${i + 2} (${analyzedList[i + 1].school?.code || 'ĐH'} - ${nextCutoff}đ). Khi đã đỗ NV${i + 1}, hệ thống tuyển sinh của Bộ GD&ĐT sẽ tự động hủy NV${i + 2}.`,
      );
    }
  }

  // 2. Kiểm tra phao cứu sinh (Safety Net)
  const hasSafetyNet = tiersCount.safety > 0;
  if (!hasSafetyNet) {
    warnings.push(
      'Hồ sơ thiếu "Phao cứu sinh": Bạn chưa có nguyện vọng nào có điểm chuẩn thấp hơn điểm dự đoán ít nhất 1.25đ. Nguy cơ trượt trắng nếu đề thi năm nay khó hơn dự kiến.',
    );
    recommendations.push(
      'Hãy bổ sung hoặc điều chỉnh NV3 thành một ngành an toàn (điểm chuẩn thấp hơn điểm dự đoán 1.5 - 2.5đ) để bảo đảm 100% đỗ Đại học công lập.',
    );
  }

  // 3. Kiểm tra rủi ro quá cao
  const isHighRisk = (tiersCount.reach + tiersCount.overreach) === analyzedList.length;
  if (isHighRisk) {
    warnings.push(
      'Hồ sơ quá mạo hiểm: Cả 3 nguyện vọng đều cao hơn điểm dự đoán. Khả năng trượt cả 3 là rất lớn.',
    );
  }

  // 4. Tính điểm sức khỏe hồ sơ (0 - 100)
  let healthScore = 75;
  if (hasInversion) healthScore -= 25;
  if (!hasSafetyNet) healthScore -= 20;
  if (isHighRisk) healthScore -= 25;
  if (tiersCount.safety >= 1 && tiersCount.target >= 1 && (tiersCount.reach >= 1 || analyzedList.length === 2)) {
    healthScore = Math.min(100, healthScore + 25);
    recommendations.push(
      'Hồ sơ cân bằng lý tưởng theo nguyên tắc "Rổ nguyện vọng vàng": Có trường mơ ước để thử sức, có trường vừa sức để chiến đấu, và có trường bảo hiểm chống trượt.',
    );
  }

  healthScore = Math.max(20, Math.min(100, healthScore));

  let statusLabel = 'Cân bằng lý tưởng';
  let statusTone = 'ok';
  if (healthScore < 50) {
    statusLabel = 'Rủi ro cao · Cần điều chỉnh';
    statusTone = 'err';
  } else if (healthScore < 75) {
    statusLabel = 'Khá ổn · Cần tối ưu';
    statusTone = 'warn';
  }

  const safetyAspirations = analyzedList.filter((a) => a.classification?.tierKey === 'safety');
  const targetAspirations = analyzedList.filter((a) => a.classification?.tierKey === 'target');
  const reachAspirations = analyzedList.filter(
    (a) => a.classification?.tierKey === 'reach' || a.classification?.tierKey === 'overreach',
  );

  return {
    healthScore,
    statusLabel,
    statusTone,
    hasInversion,
    hasSafetyNet,
    tiersCount,
    warnings,
    recommendations,
    analyzedList,
    safetyAspirations,
    targetAspirations,
    reachAspirations,
  };
}

/**
 * So sánh đối đầu song song giữa 2 hoặc 3 ngành/trường
 */
export function compareMajorsHeadToHead(majorIds = []) {
  if (!Array.isArray(majorIds) || majorIds.length === 0) return [];

  return majorIds.slice(0, 3).map((mId) => {
    const major = getMajorById(mId);
    if (!major) return null;
    const school = getSchoolById(major.schoolId) || {};

    const cutoffs = major.cutoffs || [];
    const thptCutoff2024 = cutoffs.find((c) => c.examId === 'THPTQG' && c.year === 2024)?.score || '—';
    const thptCutoff2025 = cutoffs.find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score || '—';
    const hsaCutoff = cutoffs.find((c) => c.examId === 'HSA')?.score || '—';
    const tsaCutoff = cutoffs.find((c) => c.examId === 'TSA')?.score || '—';

    return {
      majorId: major.id,
      majorName: major.name,
      majorCode: major.majorCode || '',
      faculty: major.faculty || 'Khoa đào tạo',
      blocks: major.blocks || ['A00'],
      quota: major.quota || 150,
      tuition: major.tuitionPerYear || school.tuitionPerYear || 'Theo quy định nhà nước',
      school: {
        id: school.id || major.schoolId,
        code: school.code || major.schoolId,
        name: school.name || 'Trường Đại học',
        city: school.city || 'Việt Nam',
        type: school.type || 'Công lập',
      },
      cutoffs: {
        thpt2024: thptCutoff2024,
        thpt2025: thptCutoff2025,
        hsa: hsaCutoff,
        tsa: tsaCutoff,
      },
      career: major.career || 'Kỹ sư chuyên ngành, Chuyên viên nghiên cứu',
      note: major.note || '',
    };
  }).filter(Boolean);
}
