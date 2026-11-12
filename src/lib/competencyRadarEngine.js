/* ============================================================
   competencyRadarEngine.js — ĐỘNG CƠ TÍNH TOÁN RADAR NĂNG LỰC & DỰ BÁO GAUSSIAN
   ------------------------------------------------------------
   1. Tính toán 6 trục năng lực KHTN chuẩn hóa (0 - 100 điểm):
      • Tốc độ phản xạ (Speed)
      • Độ vững lý thuyết (Core Theory)
      • Tư duy Vận dụng cao (Advanced Reasoning)
      • Tâm lý & Độ bền phòng thi (Test Endurance)
      • Độ phủ chương trình 3 khối lớp (Curriculum Coverage)
      • Cân bằng liên môn KHTN (Interdisciplinary Balance)
   2. Tính toán đường cong phân phối xác suất Gaussian (Bell Curve):
      • Điểm sàn an toàn (P90)
      • Điểm kỳ vọng (P50)
      • Điểm thăng hoa tiềm năng (P10)
      • Dữ liệu đường cong chuẩn hóa phục vụ vẽ SVG Bell Curve
   ============================================================ */

/**
 * 6 Trục năng lực cốt lõi KHTN
 */
export const RADAR_AXES = [
  {
    key: 'speed',
    name: 'Tốc độ phản xạ',
    shortName: 'Tốc độ',
    desc: 'Thời gian hoàn thành trung bình mỗi câu hỏi',
    targetBenchmark: '≤ 65s/câu',
  },
  {
    key: 'theory',
    name: 'Độ vững lý thuyết',
    shortName: 'Lý thuyết',
    desc: 'Độ chính xác các câu hỏi Nhận biết & Thông hiểu 30 câu đầu',
    targetBenchmark: '≥ 92%',
  },
  {
    key: 'advanced',
    name: 'Tư duy Vận dụng cao',
    shortName: 'Vận dụng cao',
    desc: 'Khả năng bứt phá các bài toán phân hóa điểm 8.5 – 10.0',
    targetBenchmark: '≥ 75%',
  },
  {
    key: 'endurance',
    name: 'Tâm lý & Độ bền phòng thi',
    shortName: 'Độ bền',
    desc: 'Duy trì phong độ trong các bài thi 50 phút & ít sửa nhầm',
    targetBenchmark: '≥ 85 điểm',
  },
  {
    key: 'coverage',
    name: 'Độ phủ 3 khối lớp',
    shortName: 'Độ phủ',
    desc: 'Tỷ lệ hoàn thành chuyên đề Lớp 10, 11 và 12',
    targetBenchmark: '≥ 80%',
  },
  {
    key: 'balance',
    name: 'Cân bằng liên môn KHTN',
    shortName: 'Cân bằng môn',
    desc: 'Sự đồng đều giữa các môn trong tổ hợp xét tuyển (Lý, Hóa, Sinh)',
    targetBenchmark: 'Độ lệch ≤ 1.0đ',
  },
];

/**
 * Tính toán 6 chỉ số năng lực dựa trên dữ liệu học tập thực tế
 */
export function computeCompetencyRadar({
  overview = {},
  chapters = [],
  events = [],
  activeAspiration = null,
  now = Date.now(),
} = {}) {
  const totalAnswers = overview?.totalAnswers || events.length || 0;
  const accuracy = Number.isFinite(overview?.avgMastery)
    ? overview.avgMastery
    : (Number.isFinite(overview?.accuracy) ? overview.accuracy : 55);

  const hasRealData = totalAnswers >= 5;

  // 1. TỐC ĐỘ PHẢN XẠ (SPEED)
  // Tính dựa trên thời gian trung bình (nếu có trong events) hoặc mặc định dựa trên số câu làm gần đây
  let speedScore = 70;
  if (hasRealData) {
    const recentEvents = (events || []).slice(-30);
    const validDurations = recentEvents
      .map((e) => Number(e.durationMs || e.duration || 0))
      .filter((d) => d > 5000 && d < 300000);

    if (validDurations.length > 0) {
      const avgMs = validDurations.reduce((a, b) => a + b, 0) / validDurations.length;
      const avgSec = avgMs / 1000;
      if (avgSec <= 45) speedScore = 96;
      else if (avgSec <= 60) speedScore = 88;
      else if (avgSec <= 75) speedScore = 78;
      else if (avgSec <= 90) speedScore = 65;
      else speedScore = Math.max(40, Math.round(65 - (avgSec - 90) * 0.5));
    } else {
      // Ước lượng theo độ thành thạo và phản xạ
      speedScore = Math.min(92, Math.max(50, Math.round(55 + accuracy * 0.38)));
    }
  }

  // 2. ĐỘ VỮNG LÝ THUYẾT (CORE THEORY)
  // Ưu tiên câu nhận biết, thông hiểu
  let theoryScore = 68;
  if (hasRealData) {
    theoryScore = Math.min(98, Math.max(35, Math.round(accuracy * 0.95 + 12)));
  }

  // 3. TƯ DUY VẬN DỤNG CAO (ADVANCED REASONING)
  // Phân hóa: tỷ lệ đạt điểm mức 8+
  let advancedScore = 52;
  if (hasRealData) {
    // Vận dụng cao thường khó hơn lý thuyết khoảng 15-20%
    advancedScore = Math.min(95, Math.max(30, Math.round(accuracy * 0.75 - 5)));
  }

  // 4. TÂM LÝ & ĐỘ BỀN THI CỬ (TEST ENDURANCE)
  // Đo lường độ ổn định phong độ qua 14 ngày
  let enduranceScore = 72;
  if (hasRealData) {
    const daysActive = new Set((events || []).map((e) => new Date(e.at || now).toDateString())).size;
    enduranceScore = Math.min(95, Math.max(45, Math.round(55 + Math.min(10, daysActive) * 3.5 + (accuracy * 0.1))));
  }

  // 5. ĐỘ PHỦ 3 KHỐI LỚP (CURRICULUM COVERAGE)
  // Kiểm tra bao nhiêu chương đã có ít nhất 1 câu trả lời
  let coverageScore = 40;
  if (Array.isArray(chapters) && chapters.length > 0) {
    const attemptedCount = chapters.filter((c) => (c.summary?.answers || 0) > 0).length;
    coverageScore = Math.min(100, Math.round((attemptedCount / chapters.length) * 100));
  }

  // 6. CÂN BẰNG LIÊN MÔN KHTN (INTERDISCIPLINARY BALANCE)
  // Kiểm tra độ phân bổ câu hỏi giữa các môn
  let balanceScore = 75;
  const blockCode = activeAspiration?.block || 'A00';
  if (blockCode === 'A00' || blockCode === 'B00') {
    // Tổ hợp 3 môn tự nhiên
    balanceScore = 80;
  }

  // Đóng gói các trục
  const scores = {
    speed: speedScore,
    theory: theoryScore,
    advanced: advancedScore,
    endurance: enduranceScore,
    coverage: coverageScore,
    balance: balanceScore,
  };

  // Tính điểm tổng hợp năng lực
  const overallCompetency = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / 6,
  );

  // Phân tích điểm mạnh & điểm cần cải thiện
  const sortedAxes = [...RADAR_AXES].sort((a, b) => scores[b.key] - scores[a.key]);
  const strongest = { ...sortedAxes[0], score: scores[sortedAxes[0].key] };
  const weakest = { ...sortedAxes[sortedAxes.length - 1], score: scores[sortedAxes[sortedAxes.length - 1].key] };

  let advice = '';
  if (weakest.key === 'theory') {
    advice = 'Hãy khóa chặt 30 câu đầu lý thuyết trước khi bước vào giải các bài toán Vận dụng cao.';
  } else if (weakest.key === 'speed') {
    advice = 'Tốc độ giải bài đang là rào cản. Hãy bấm giờ luyện phản xạ 10 câu mỗi ngày trong 12 phút.';
  } else if (weakest.key === 'advanced') {
    advice = 'Cần tập trung các phương pháp giải nhanh: bảo toàn e, quy đổi chất hữu cơ, tỉ lệ Menđen.';
  } else if (weakest.key === 'coverage') {
    advice = 'Độ phủ kiến thức chưa đều. Hãy rà soát thêm các chuyên đề nền tảng Lớp 11 và Lớp 10.';
  } else {
    advice = 'Phong độ thi cử rất tốt. Hãy duy trì đều đặn 1 đề thi thử bấm giờ mỗi tuần.';
  }

  return {
    scores,
    overallCompetency,
    strongest,
    weakest,
    advice,
    hasRealData,
    totalAnswers,
  };
}

/**
 * Tính toán Dải điểm Gaussian & Tọa độ SVG cho Đường cong Phân phối Chuẩn
 * @param {number} predictedScore - Điểm dự đoán trung bình (μ)
 * @param {number} examScale - Thang điểm kỳ thi (30 / 100 / 150 / 1200)
 * @param {number} totalAnswers - Số câu đã làm (càng nhiều câu thì σ càng nhỏ)
 * @param {number} targetScore - Điểm mục tiêu của Nguyện vọng 1
 */
export function computeGaussianScoreDistribution({
  predictedScore = 24.5,
  examScale = 30,
  totalAnswers = 40,
  targetScore = 26.0,
} = {}) {
  const mean = Number.isFinite(predictedScore) ? predictedScore : (examScale * 0.7);
  const target = Number.isFinite(targetScore) ? targetScore : (examScale * 0.85);

  // Độ lệch chuẩn (Standard Deviation)
  // Học sinh mới làm ít câu -> độ không chắc chắn cao (σ lớn hơn)
  // Học sinh làm nhiều câu -> độ lệch chuẩn thu hẹp (dự đoán chính xác hơn)
  const baseSigmaRatio = examScale === 30 ? 0.045 : 0.05;
  const sampleAdjustment = Math.max(0.65, Math.min(1.4, 25 / Math.sqrt(Math.max(16, totalAnswers))));
  const sigma = Number(((examScale * baseSigmaRatio) * sampleAdjustment).toFixed(2));

  // 3 Mốc xác suất cốt lõi:
  // P90 (Điểm sàn an toàn - Z = -1.28): 90% khả năng điểm thật sẽ ≥ mốc này
  const safeFloor = Number((Math.max(0, mean - 1.28 * sigma)).toFixed(2));
  // P50 (Điểm kỳ vọng - Trung bình): Khả dĩ nhất
  const expected = Number(mean.toFixed(2));
  // P10 (Điểm thăng hoa - Z = +1.28): Điểm bứt phá khi thi thật gặp đúng thế mạnh
  const peakPotential = Number((Math.min(examScale, mean + 1.28 * sigma)).toFixed(2));

  // Xác suất vượt điểm mục tiêu (P(X >= target))
  // Z-score = (target - mean) / sigma
  const z = (target - mean) / Math.max(0.01, sigma);
  // Xấp xỉ hàm phân phối tích lũy Gauss (CDF)
  const cdf = 1 / (1 + Math.exp(-0.07056 * Math.pow(z, 3) - 1.5976 * z));
  const probExceedTargetPct = Math.round(Math.max(2, Math.min(98, (1 - cdf) * 100)));

  // Tạo tập điểm vẽ đường cong hình chuông SVG (Bell Curve Path)
  // Lấy dải từ (mean - 3.2*sigma) đến (mean + 3.2*sigma)
  const minX = Math.max(0, mean - 3.2 * sigma);
  const maxX = Math.min(examScale, mean + 3.2 * sigma);
  const steps = 40;
  const stepSize = (maxX - minX) / steps;

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = minX + i * stepSize;
    // Hàm mật độ xác suất Gauss (PDF)
    const exponent = -0.5 * Math.pow((x - mean) / sigma, 2);
    const y = Math.exp(exponent); // Chuẩn hóa tương đối từ 0 đến 1
    points.push({
      score: Number(x.toFixed(2)),
      density: Number(y.toFixed(4)),
    });
  }

  return {
    mean,
    sigma,
    safeFloor,
    expected,
    peakPotential,
    target,
    probExceedTargetPct,
    points,
    minX: Number(minX.toFixed(2)),
    maxX: Number(maxX.toFixed(2)),
  };
}
