/* ============================================================
   admissionCareerEngine.js — ĐỘNG CƠ ĐỊNH HƯỚNG NGHỀ NGHIỆP HOLLAND RIASEC
   & XÉT TUYỂN ĐẠI HỌC ĐA PHƯƠNG THỨC CHUẨN QUY CHẾ BỘ GD&ĐT (9STUDY PRO)
   ------------------------------------------------------------
   1. Tính điểm ưu tiên Khu vực (KV1, KV2-NT, KV2, KV3) & Đối tượng (ĐT1, ĐT2)
      theo đúng công thức giảm tuyến tính từ 22.5 điểm của Bộ GD&ĐT:
      Điểm ƯT = [(30 - Tổng điểm đạt được) / 7.5] × Mức điểm ƯT gốc
   2. Quy đổi tương đương đa kỳ thi theo phân vị (Percentile Equivalence):
      THPTQG (/30) ↔ HSA (/150) ↔ TSA (/100) ↔ V-ACT (/1200) ↔ SPT (/30) ↔ H-SCA (/100)
      + Quy đổi điểm cộng / thay thế chứng chỉ IELTS (5.0 -> 8.0+)
   3. Mô hình Holland RIASEC 6 trục × 11 môn học GDPT 2018 × Điểm năng lực thật
      -> Báo cáo hướng nghiệp chuyên sâu + Lộ trình lương & Xu hướng 2026–2030
   4. Tự động thiết lập "Rổ Nguyện vọng Vàng 3 tầng" (NV1 Mơ ước - NV2 Vừa sức - NV3 An toàn)
      và đồng bộ 2 chiều với aspirationService + Navbar StudyGoalNavDropdown
   ============================================================ */

import {
  getSchools,
  getMajorsBySchool,
  getUserAspirationsState,
  upsertAspiration,
  reorderAspirations,
} from './aspirationService.js';
import { saveTargetUniversity } from './studentAnalytics.js';

/* ── 1. BẢNG KHU VỰC & ĐỐI TƯỢNG ƯU TIÊN CHUẨN QUY CHẾ BỘ GD&ĐT ── */
export const MOET_PRIORITY_AREAS = [
  { id: 'KV3', label: 'KV3 · Thành phố / Thị xã trực thuộc', bonus: 0, short: 'KV3 (+0đ)' },
  { id: 'KV2', label: 'KV2 · Thị xã / Ngoại thành', bonus: 0.25, short: 'KV2 (+0.25đ)' },
  { id: 'KV2-NT', label: 'KV2-NT · Nông thôn', bonus: 0.5, short: 'KV2-NT (+0.50đ)' },
  { id: 'KV1', label: 'KV1 · Miền núi / Vùng sâu / Hải đảo', bonus: 0.75, short: 'KV1 (+0.75đ)' },
];

export const MOET_PRIORITY_GROUPS = [
  { id: 'NONE', label: 'Không thuộc đối tượng ưu tiên', bonus: 0, short: 'Không (+0đ)' },
  { id: 'UT2', label: 'Nhóm ƯT2 (ĐT 05, 06, 07)', bonus: 1.0, short: 'ƯT2 (+1.0đ)' },
  { id: 'UT1', label: 'Nhóm ƯT1 (ĐT 01, 02, 03, 04)', bonus: 2.0, short: 'ƯT1 (+2.0đ)' },
];

export const IELTS_CONVERSION_TABLE = [
  { band: 'none', label: 'Không dùng IELTS', engScore10: null, bonus30: 0 },
  { band: '5.0', label: 'IELTS 5.0', engScore10: 8.5, bonus30: 0.25 },
  { band: '5.5', label: 'IELTS 5.5', engScore10: 9.0, bonus30: 0.5 },
  { band: '6.0', label: 'IELTS 6.0', engScore10: 9.5, bonus30: 0.75 },
  { band: '6.5', label: 'IELTS 6.5', engScore10: 10.0, bonus30: 1.0 },
  { band: '7.0', label: 'IELTS 7.0', engScore10: 10.0, bonus30: 1.25 },
  { band: '7.5+', label: 'IELTS 7.5 – 9.0', engScore10: 10.0, bonus30: 1.5 },
];

/**
 * Tính điểm ưu tiên thực nhận theo Điều 7 Quy chế Tuyển sinh ĐH Bộ GD&ĐT:
 * - Nếu tổng điểm 3 môn (thang 30) < 22.5: hưởng 100% điểm ưu tiên (KV + ĐT)
 * - Nếu tổng điểm 3 môn >= 22.5:
 *   Điểm ƯT = [(30 - Tổng điểm đạt được) / 7.5] × Tổng điểm ƯT gốc (làm tròn 2 chữ số thập phân)
 */
export function calculateMoetPriorityScore({
  rawScore30 = 0,
  areaId = 'KV3',
  groupId = 'NONE',
  extraBonus = 0,
} = {}) {
  const safeRaw = Math.max(0, Math.min(30, Number(rawScore30) || 0));
  const area = MOET_PRIORITY_AREAS.find((a) => a.id === areaId) || MOET_PRIORITY_AREAS[0];
  const group = MOET_PRIORITY_GROUPS.find((g) => g.id === groupId) || MOET_PRIORITY_GROUPS[0];
  const basePriority = Number((area.bonus + group.bonus).toFixed(2));
  const safeExtra = Math.max(0, Math.min(3, Number(extraBonus) || 0));

  let effectivePriority = basePriority;
  let isReduced = false;

  if (safeRaw <= 0) {
    effectivePriority = 0;
  } else if (safeRaw >= 30) {
    effectivePriority = 0;
    isReduced = basePriority > 0;
  } else if (safeRaw >= 22.5 && basePriority > 0) {
    effectivePriority = Number((((30 - safeRaw) / 7.5) * basePriority).toFixed(2));
    isReduced = true;
  }

  const finalScore30 = Number(Math.min(30, safeRaw + effectivePriority + safeExtra).toFixed(2));

  return {
    rawScore30: Number(safeRaw.toFixed(2)),
    areaId: area.id,
    groupId: group.id,
    areaBonus: area.bonus,
    groupBonus: group.bonus,
    basePriority,
    effectivePriority,
    extraBonus: Number(safeExtra.toFixed(2)),
    isReduced,
    reductionAmount: Number(Math.max(0, basePriority - effectivePriority).toFixed(2)),
    finalScore30,
    formulaNote: isReduced
      ? `Áp dụng giảm trừ từ 22.5đ: [(30 - ${safeRaw.toFixed(2)}) / 7.5] × ${basePriority} = +${effectivePriority}đ`
      : basePriority > 0
        ? `Hưởng trọn 100% mức ưu tiên (${area.id}${group.bonus > 0 ? ` + ${group.id}` : ''}): +${effectivePriority}đ`
        : 'Không cộng điểm ưu tiên khu vực / đối tượng',
  };
}

/* ── 2. BỘ QUY ĐỔI TƯƠNG ĐƯƠNG ĐA KỲ THI THEO PHÂN VỊ (PERCENTILE EQUIVALENCE) ── */
// Bảng móc xích phân vị thực tế giữa các kỳ thi lớn tại Việt Nam
const PERCENTILE_ANCHORS = [
  { pct: 99.5, THPTQG: 28.8, HSA: 122, TSA: 86, 'V-ACT': 1040, SPT: 27.8, 'H-SCA': 90 },
  { pct: 98.0, THPTQG: 27.8, HSA: 112, TSA: 78, 'V-ACT': 970,  SPT: 26.8, 'H-SCA': 85 },
  { pct: 95.0, THPTQG: 26.8, HSA: 103, TSA: 71, 'V-ACT': 905,  SPT: 25.6, 'H-SCA': 80 },
  { pct: 90.0, THPTQG: 25.8, HSA: 95,  TSA: 65, 'V-ACT': 845,  SPT: 24.5, 'H-SCA': 75 },
  { pct: 80.0, THPTQG: 24.5, HSA: 87,  TSA: 59, 'V-ACT': 780,  SPT: 23.2, 'H-SCA': 70 },
  { pct: 65.0, THPTQG: 23.0, HSA: 78,  TSA: 53, 'V-ACT': 710,  SPT: 21.8, 'H-SCA': 64 },
  { pct: 50.0, THPTQG: 21.2, HSA: 70,  TSA: 48, 'V-ACT': 640,  SPT: 20.0, 'H-SCA': 58 },
  { pct: 30.0, THPTQG: 18.8, HSA: 60,  TSA: 41, 'V-ACT': 560,  SPT: 17.8, 'H-SCA': 50 },
  { pct: 10.0, THPTQG: 15.5, HSA: 48,  TSA: 32, 'V-ACT': 460,  SPT: 15.0, 'H-SCA': 40 },
];

export function convertExamScoreEquivalence(score, fromExamId = 'THPTQG') {
  const val = Number(score);
  if (!Number.isFinite(val) || val <= 0) return null;
  const key = PERCENTILE_ANCHORS[0][fromExamId] !== undefined ? fromExamId : 'THPTQG';

  // Nội suy tuyến tính trên các mốc phân vị
  let upper = PERCENTILE_ANCHORS[0];
  let lower = PERCENTILE_ANCHORS[PERCENTILE_ANCHORS.length - 1];

  for (let i = 0; i < PERCENTILE_ANCHORS.length - 1; i++) {
    const a = PERCENTILE_ANCHORS[i];
    const b = PERCENTILE_ANCHORS[i + 1];
    if (val <= a[key] && val >= b[key]) {
      upper = a;
      lower = b;
      break;
    }
  }

  let ratio = 0.5;
  if (val >= PERCENTILE_ANCHORS[0][key]) {
    upper = PERCENTILE_ANCHORS[0];
    lower = PERCENTILE_ANCHORS[1];
    ratio = 1;
  } else if (val <= PERCENTILE_ANCHORS[PERCENTILE_ANCHORS.length - 1][key]) {
    upper = PERCENTILE_ANCHORS[PERCENTILE_ANCHORS.length - 2];
    lower = PERCENTILE_ANCHORS[PERCENTILE_ANCHORS.length - 1];
    ratio = 0;
  } else {
    const span = Math.max(0.0001, upper[key] - lower[key]);
    ratio = (val - lower[key]) / span;
  }

  const interp = (field, decimals = 1) => {
    const raw = lower[field] + ratio * (upper[field] - lower[field]);
    const factor = 10 ** decimals;
    return Math.round(raw * factor) / factor;
  };

  return {
    fromExamId: key,
    inputScore: val,
    percentile: interp('pct', 1),
    topPercent: Number(Math.max(0.5, 100 - interp('pct', 1)).toFixed(1)),
    equivalents: {
      THPTQG: interp('THPTQG', 2),
      HSA: Math.round(interp('HSA', 0)),
      TSA: interp('TSA', 1),
      'V-ACT': Math.round(interp('V-ACT', 0)),
      SPT: interp('SPT', 2),
      'H-SCA': interp('H-SCA', 1),
    },
  };
}

/* ── 3. TÍNH XÁC SUẤT ĐỖ & PHÂN TẦNG NGUYỆN VỌNG CHUẨN 9STUDY ── */
export function computeMajorAdmissionChance(myScore30, cutoffScore30) {
  if (myScore30 == null || cutoffScore30 == null || !Number.isFinite(Number(myScore30)) || !Number.isFinite(Number(cutoffScore30))) {
    return null;
  }
  const score = Number(myScore30);
  const cutoff = Number(cutoffScore30);
  const diff = Number((score - cutoff).toFixed(2)); // Dương: vượt chuẩn, Âm: thiếu điểm

  let chancePct = 55;
  let tier = 'target'; // 'safety' | 'target' | 'reach' | 'overreach'
  let status = 'near'; // backward-compatible with AdmissionLookup: 'safe' | 'near' | 'far'
  let badgeLabel = 'Vừa sức';
  let tone = 'blue';

  if (diff >= 1.25) {
    chancePct = Math.min(98, Math.round(86 + (diff - 1.25) * 6));
    tier = 'safety';
    status = 'safe';
    badgeLabel = 'An toàn cao';
    tone = 'emerald';
  } else if (diff >= 0.25) {
    chancePct = Math.min(85, Math.round(70 + (diff - 0.25) * 14));
    tier = 'safety';
    status = 'safe';
    badgeLabel = 'An toàn';
    tone = 'emerald';
  } else if (diff >= -0.6) {
    chancePct = Math.round(50 + (diff + 0.6) * 22);
    tier = 'target';
    status = diff >= 0 ? 'safe' : 'near';
    badgeLabel = 'Vừa sức';
    tone = 'blue';
  } else if (diff >= -1.75) {
    chancePct = Math.max(22, Math.round(25 + (diff + 1.75) * 21));
    tier = 'reach';
    status = 'near';
    badgeLabel = 'Mơ ước · Bứt phá';
    tone = 'amber';
  } else {
    chancePct = Math.max(6, Math.round(18 + (diff + 2.5) * 6));
    tier = 'overreach';
    status = 'far';
    badgeLabel = 'Thử thách cao';
    tone = 'rose';
  }

  return {
    diff,
    absDiff: Math.abs(diff),
    chancePct,
    tier,
    status,
    badgeLabel,
    tone,
    text:
      diff >= 0
        ? `${chancePct}% đỗ · Vượt +${diff.toFixed(2)}đ (${badgeLabel})`
        : `${chancePct}% đỗ · Thiếu ${Math.abs(diff).toFixed(2)}đ (${badgeLabel})`,
  };
}

/* ── 4. MÔ HÌNH ĐỊNH HƯỚNG NGHỀ NGHIỆP HOLLAND RIASEC × GDPT 2018 ── */
export const RIASEC_DIMENSIONS = [
  {
    k: 'R',
    code: 'R',
    name: 'Thực tế · Kỹ thuật (Realistic)',
    shortName: 'Kỹ thuật (R)',
    tagline: 'Người kiến tạo phần cứng, vận hành công nghệ & kỹ thuật thực chiến',
    color: '#2563eb',
    bgSoft: 'rgba(37, 99, 235, 0.1)',
    traits: ['Tư duy thực hành', 'Thích máy móc & thiết bị', 'Giải quyết bài toán vật lý/kỹ thuật', 'Bền bỉ, rõ ràng'],
    bestBlocks: ['A00', 'A01', 'X06', 'C01'],
    topMajors: ['Kỹ thuật Cơ điện tử & Robot', 'Thiết kế Vi mạch Bán dẫn', 'Kỹ thuật Ô tô & Xe điện', 'Kỹ thuật Điện - Tự động hóa', 'Kỹ thuật Hóa học & Vật liệu', 'Xây dựng & Kiến trúc công trình'],
    salaryRange: '14 – 38 triệu/tháng',
    demand2030: 'Rất cao (Bán dẫn, Tự động hóa, Năng lượng sạch)',
    qs: [
      'Tôi thích tự tay lắp ráp, sửa chữa đồ điện tử, máy móc hoặc mô hình kỹ thuật',
      'Tôi hứng thú với việc điều khiển thiết bị, lập trình phần cứng, robot hoặc phòng Lab',
      'Tôi thích nhìn thấy kết quả công việc là một sản phẩm vật lý, công trình hoặc hệ thống chạy được thật',
      'Tôi thích các hoạt động thực nghiệm, vận động hoặc khảo sát thực địa hơn chỉ ngồi đọc lý thuyết suông',
    ],
  },
  {
    k: 'I',
    code: 'I',
    name: 'Nghiên cứu · Khoa học (Investigative)',
    shortName: 'Nghiên cứu (I)',
    tagline: 'Người giải mã bản chất khoa học, thuật toán AI, dữ liệu & Y sinh',
    color: '#7c3aed',
    bgSoft: 'rgba(124, 58, 237, 0.1)',
    traits: ['Tư duy logic sâu', 'Đam mê tìm nguyên lý gốc rễ', 'Phân tích dữ liệu & thí nghiệm', 'Độc lập, học thuật cao'],
    bestBlocks: ['A00', 'B00', 'A01', 'X06', 'D07'],
    topMajors: ['Trí tuệ nhân tạo (AI) & Khoa học máy tính', 'Khoa học dữ liệu (Data Science)', 'Y khoa (Bác sĩ đa khoa)', 'Dược học & Hóa dược', 'Công nghệ Sinh học & Y sinh', 'Răng - Hàm - Mặt'],
    salaryRange: '18 – 55 triệu/tháng',
    demand2030: 'Đỉnh cao (AI, Y sinh, Hóa dược, Khoa học dữ liệu)',
    qs: [
      'Tôi thích chinh phục các bài toán khó, câu hỏi phân loại đòi hỏi suy luận nhiều bước',
      'Tôi luôn tò mò đặt câu hỏi "Tại sao hiện tượng này xảy ra?" và tìm quy luật khoa học phía sau',
      'Tôi thích làm thí nghiệm Hóa - Sinh - Lý, phân tích số liệu hoặc viết thuật toán máy tính',
      'Tôi có thể tập trung hàng giờ để đọc tài liệu chuyên sâu, nghiên cứu công nghệ hoặc y học mới',
    ],
  },
  {
    k: 'A',
    code: 'A',
    name: 'Nghệ thuật · Sáng tạo (Artistic)',
    shortName: 'Sáng tạo (A)',
    tagline: 'Nhà thiết kế trải nghiệm số, truyền thông đa phương tiện & kiến trúc',
    color: '#ec4899',
    bgSoft: 'rgba(236, 72, 153, 0.1)',
    traits: ['Trực giác thẩm mỹ cao', 'Giàu trí tưởng tượng', 'Ghét sự rập khuôn máy móc', 'Biểu đạt ngôn từ & hình ảnh tốt'],
    bestBlocks: ['D01', 'V00', 'H00', 'C00', 'X26'],
    topMajors: ['Thiết kế Đồ họa & UI/UX Product Design', 'Truyền thông Đa phương tiện & Digital Content', 'Kiến trúc & Quy hoạch đô thị', 'Quan hệ công chúng (PR) & Quảng cáo', 'Ngôn ngữ & Văn hóa quốc tế'],
    salaryRange: '13 – 35 triệu/tháng',
    demand2030: 'Cao (Thiết kế sản phẩm số UI/UX, Nội dung đa nền tảng)',
    qs: [
      'Tôi có gu thẩm mỹ tốt, thích vẽ, thiết kế giao diện, chỉnh sửa ảnh/video hoặc bố cục trình bày đẹp',
      'Tôi thích viết lách, kể chuyện, sáng tạo nội dung hoặc đưa ra những ý tưởng khác biệt',
      'Tôi yêu thích âm nhạc, nghệ thuật, kiến trúc hoặc văn hóa và nhạy cảm với cái đẹp',
      'Tôi phát huy tốt nhất trong môi trường tự do sáng tạo thay vì các quy định cứng nhắc lặp đi lặp lại',
    ],
  },
  {
    k: 'S',
    code: 'S',
    name: 'Xã hội · Cộng đồng (Social)',
    shortName: 'Xã hội (S)',
    tagline: 'Người truyền lửa giáo dục, chăm sóc sức khỏe & phát triển con người',
    color: '#10b981',
    bgSoft: 'rgba(16, 185, 129, 0.1)',
    traits: ['Thấu cảm & lắng nghe', 'Diễn đạt sư phạm dễ hiểu', 'Tinh thần phụng sự cộng đồng', 'Hợp tác đội nhóm tốt'],
    bestBlocks: ['B00', 'D01', 'C00', 'A00', 'D07'],
    topMajors: ['Sư phạm Toán / Lý / Hóa / Sinh / Anh (Hưởng NĐ 116)', 'Bác sĩ Y học dự phòng & Điều dưỡng chất lượng cao', 'Tâm lý học & Tham vấn trị liệu', 'Quản trị Nhân sự (HR) & Công tác xã hội', 'Ngoại giao & Quan hệ quốc tế'],
    salaryRange: '12 – 32 triệu/tháng (Miễn học phí + hỗ trợ 3.63tr/tháng với Sư phạm)',
    demand2030: 'Bền vững & Không thể bị AI thay thế (Giáo dục, Y tế, Tâm lý)',
    qs: [
      'Tôi rất vui khi giảng bài cho bạn bè hiểu một kiến thức khó hoặc giúp đỡ người khác tiến bộ',
      'Tôi thích lắng nghe, chia sẻ và kết nối mọi người trong lớp học hoặc câu lạc bộ',
      'Tôi quan tâm sâu sắc đến sức khỏe thể chất, tinh thần và sự an toàn của những người xung quanh',
      'Tôi muốn công việc tương lai của mình mang lại giá trị nhân văn trực tiếp cho học sinh, bệnh nhân hoặc cộng đồng',
    ],
  },
  {
    k: 'E',
    code: 'E',
    name: 'Quản trị · Kinh doanh (Enterprising)',
    shortName: 'Quản trị (E)',
    tagline: 'Nhà lãnh đạo chiến lược, thương mại quốc tế, Marketing & Luật',
    color: '#f59e0b',
    bgSoft: 'rgba(245, 158, 11, 0.1)',
    traits: ['Quyết đoán & dám dẫn dắt', 'Thuyết phục & đàm phán giỏi', 'Nhạy bén với thị trường & cơ hội', 'Chịu được áp lực cạnh tranh'],
    bestBlocks: ['A00', 'A01', 'D01', 'D07', 'C00'],
    topMajors: ['Kinh tế đối ngoại & Thương mại quốc tế', 'Marketing số & Quản trị thương hiệu', 'Quản trị kinh doanh & Khởi nghiệp', 'Logistics & Quản lý chuỗi cung ứng toàn cầu', 'Luật Kinh tế & Luật Quốc tế'],
    salaryRange: '15 – 45+ triệu/tháng',
    demand2030: 'Rất cao (Thương mại xuyên biên giới, Logistics, Luật công nghệ)',
    qs: [
      'Tôi thường chủ động nhận vai trò nhóm trưởng, phân công việc và dẫn dắt cả đội về đích',
      'Tôi tự tin khi thuyết trình, tranh biện, đàm phán hoặc thuyết phục người khác đồng ý với giải pháp của mình',
      'Tôi hứng thú với kinh doanh, đầu tư, xây dựng thương hiệu hoặc khởi nghiệp dự án riêng',
      'Tôi thích môi trường năng động, có mục tiêu thử thách rõ ràng và cơ hội thăng tiến nhanh',
    ],
  },
  {
    k: 'C',
    code: 'C',
    name: 'Nghiệp vụ · Hệ thống (Conventional)',
    shortName: 'Nghiệp vụ (C)',
    tagline: 'Chuyên gia Tài chính - Ngân hàng, Kiểm toán, An toàn thông tin & Quản trị hệ thống',
    color: '#0ea5e9',
    bgSoft: 'rgba(14, 165, 233, 0.1)',
    traits: ['Cẩn trọng & chính xác cao', 'Tổ chức dữ liệu khoa học', 'Tuân thủ chuẩn mực & kỷ luật', 'Quản trị rủi ro xuất sắc'],
    bestBlocks: ['A00', 'A01', 'D01', 'D07', 'X26'],
    topMajors: ['Tài chính - Ngân hàng & Đầu tư (FinTech)', 'Kế toán - Kiểm toán chuẩn Quốc tế (ACCA/CFA)', 'Hệ thống thông tin quản lý (MIS) & An toàn thông tin', 'Kinh tế đầu tư & Thẩm định dự án', 'Hậu cần Quân đội / Nghiệp vụ An ninh'],
    salaryRange: '14 – 36 triệu/tháng',
    demand2030: 'Ổn định cao (FinTech, Kiểm toán số, An ninh mạng)',
    qs: [
      'Tôi luôn lập kế hoạch, thời khóa biểu và sắp xếp tài liệu học tập có hệ thống, ngăn nắp',
      'Tôi làm việc rất tốt với con số, bảng biểu, thống kê tài chính và phân tích quy trình chuẩn xác',
      'Tôi coi trọng sự minh bạch, kỷ luật, quy tắc rõ ràng và kiểm soát rủi ro chặt chẽ',
      'Tôi kiên nhẫn rà soát từng chi tiết nhỏ để đảm bảo bài làm hoặc dự án không có bất kỳ sai sót nào',
    ],
  },
];

/* ── 6 Câu Chẩn Đoán Nhanh 60 Giây (Quick Mode) ── */
export const QUICK_RIASEC_QUESTIONS = [
  {
    id: 'q1',
    q: 'Khi tham gia một dự án khoa học hoặc cuộc thi ở trường, vai trò nào khiến bạn hào hứng nhất?',
    options: [
      { label: 'Nghiên cứu bản chất khoa học, giải thuật toán khó hoặc phân tích dữ liệu thí nghiệm', weights: { I: 4, R: 1 } },
      { label: 'Thiết kế mạch điện, lắp ráp phần cứng, lập trình sản phẩm chạy được ngay', weights: { R: 4, I: 1 } },
      { label: 'Trưởng nhóm lập kế hoạch, gọi vốn, thuyết trình và thuyết phục ban giám khảo', weights: { E: 4, S: 1 } },
      { label: 'Thiết kế slide/giao diện ấn tượng hoặc kết nối, hướng dẫn các thành viên phối hợp', weights: { A: 3, S: 3 } },
    ],
  },
  {
    id: 'q2',
    q: 'Không gian làm việc lý tưởng của bạn trong 5–10 năm tới là đâu?',
    options: [
      { label: 'Trung tâm R&D Trí tuệ nhân tạo, bệnh viện lớn hoặc viện nghiên cứu công nghệ sinh - hóa', weights: { I: 4, S: 2 } },
      { label: 'Nhà máy sản xuất chip bán dẫn, tập đoàn công nghệ, kỹ thuật tự động hóa hoặc công trường hiện đại', weights: { R: 4, C: 1 } },
      { label: 'Ngân hàng đầu tư, tập đoàn thương mại đa quốc gia, sàn tài chính hoặc văn phòng luật', weights: { E: 3, C: 3 } },
      { label: 'Giảng đường đại học/trường phổ thông, tổ chức y tế cộng đồng hoặc studio sáng tạo số', weights: { S: 4, A: 2 } },
    ],
  },
  {
    id: 'q3',
    q: 'Nhóm môn học nào ở trường THPT mang lại cho bạn điểm số và sự tự tin cao nhất?',
    options: [
      { label: 'Toán – Vật lí – Tin học (Tư duy mô hình, thuật toán & kỹ thuật công nghệ)', weights: { R: 3, I: 3 } },
      { label: 'Hóa học – Sinh học – Toán (Thí nghiệm, phản ứng, khoa học sự sống & Y Dược)', weights: { I: 4, S: 2 } },
      { label: 'Toán – Tiếng Anh – Kinh tế & Pháp luật (Tài chính, thương mại quốc tế & quản trị)', weights: { E: 3, C: 3 } },
      { label: 'Ngữ văn – Ngoại ngữ – Lịch sử / Nghệ thuật (Ngôn từ, truyền thông, sư phạm & xã hội)', weights: { A: 3, S: 3 } },
    ],
  },
  {
    id: 'q4',
    q: 'Phong cách làm bài và giải quyết vấn đề đặc trưng nhất của bạn là gì?',
    options: [
      { label: 'Cực kỳ cẩn thận, lập bảng kiểm tra từng bước, tính toán số liệu chuẩn xác 100%', weights: { C: 4, I: 1 } },
      { label: 'Đào sâu đến tận gốc rễ công thức để hiểu bản chất chứ không bao giờ học vẹt', weights: { I: 4, R: 1 } },
      { label: 'Nhanh nhạy chọn chiến thuật tối ưu điểm số, quyết đoán và chịu áp lực phòng thi tốt', weights: { E: 4, C: 1 } },
      { label: 'Thích tổng hợp thành sơ đồ tư duy trực quan và giảng lại dễ hiểu cho bạn bè', weights: { S: 3, A: 3 } },
    ],
  },
  {
    id: 'q5',
    q: 'Giá trị cốt lõi nào bạn đặt lên hàng đầu khi chọn ngành Đại học?',
    options: [
      { label: 'Làm chủ công nghệ lõi (AI, Bán dẫn, Phần mềm, Kỹ thuật) với thu nhập bứt phá', weights: { R: 3, I: 3 } },
      { label: 'Cứu chữa người bệnh, nghiên cứu thuốc mới hoặc đào tạo thế hệ học sinh ưu tú', weights: { S: 4, I: 2 } },
      { label: 'Tự chủ tài chính, làm việc tại tập đoàn toàn cầu hoặc tự xây dựng doanh nghiệp riêng', weights: { E: 4, C: 2 } },
      { label: 'Công việc ổn định lâu dài, quy trình chuyên nghiệp hoặc được tự do sáng tạo cá tính', weights: { C: 3, A: 3 } },
    ],
  },
  {
    id: 'q6',
    q: 'Chủ đề nào bạn thường chủ động tìm đọc/xem nhiều nhất khi rảnh rỗi?',
    options: [
      { label: 'Công nghệ mới, lập trình, phần cứng máy tính, xe điện, robot hoặc vũ trụ', weights: { R: 4, I: 2 } },
      { label: 'Y học, hóa sinh, khám phá khoa học tự nhiên hoặc giải đố tư duy logic', weights: { I: 4, S: 1 } },
      { label: 'Kinh doanh, tài chính cá nhân, marketing, thương mại điện tử hoặc tin tức quốc tế', weights: { E: 3, C: 3 } },
      { label: 'Thiết kế, nhiếp ảnh, âm nhạc, tâm lý học hoặc kỹ năng giao tiếp - giảng dạy', weights: { A: 3, S: 3 } },
    ],
  },
];

/* ── Danh sách 11 môn học GDPT 2018 & Gợi ý Tổ hợp tự động ── */
export const GDPT2018_SUBJECTS = [
  { id: 'Toán', label: 'Toán học', key: 'toan', group: 'core' },
  { id: 'Vật lý', label: 'Vật lí', key: 'ly', group: 'khtn' },
  { id: 'Hóa học', label: 'Hóa học', key: 'hoa', group: 'khtn' },
  { id: 'Sinh học', label: 'Sinh học', key: 'sinh', group: 'khtn' },
  { id: 'Tin học', label: 'Tin học (Mới 2025+)', key: 'tin', group: 'tech' },
  { id: 'Tiếng Anh', label: 'Tiếng Anh', key: 'anh', group: 'core' },
  { id: 'Ngữ văn', label: 'Ngữ văn', key: 'van', group: 'core' },
  { id: 'Lịch sử', label: 'Lịch sử', key: 'su', group: 'khxh' },
  { id: 'Địa lý', label: 'Địa lí', key: 'dia', group: 'khxh' },
  { id: 'KT&PL', label: 'GD Kinh tế & Pháp luật', key: 'ktpl', group: 'khxh' },
  { id: 'Công nghệ', label: 'Công nghệ', key: 'cn', group: 'tech' },
];

export const GDPT2018_COMBO_RULES = [
  { code: 'A00', name: 'A00 (Toán · Lí · Hóa)', req: ['Toán', 'Vật lý', 'Hóa học'], fitGroups: ['Kỹ thuật - Công nghệ', 'Kinh tế - Quản trị', 'Sư phạm - KHTN', 'Y - Dược'] },
  { code: 'A01', name: 'A01 (Toán · Lí · Anh)', req: ['Toán', 'Vật lý', 'Tiếng Anh'], fitGroups: ['Kỹ thuật - Công nghệ', 'Kinh tế - Quản trị'] },
  { code: 'B00', name: 'B00 (Toán · Hóa · Sinh)', req: ['Toán', 'Hóa học', 'Sinh học'], fitGroups: ['Y - Dược', 'Sư phạm - KHTN', 'Kỹ thuật - Công nghệ'] },
  { code: 'D07', name: 'D07 (Toán · Hóa · Anh)', req: ['Toán', 'Hóa học', 'Tiếng Anh'], fitGroups: ['Y - Dược', 'Kinh tế - Quản trị', 'Kỹ thuật - Công nghệ'] },
  { code: 'D01', name: 'D01 (Toán · Văn · Anh)', req: ['Toán', 'Ngữ văn', 'Tiếng Anh'], fitGroups: ['Kinh tế - Quản trị', 'Luật - Ngoại giao', 'Sư phạm - KHTN'] },
  { code: 'X06', name: 'X06 (Toán · Lí · Tin — Mới GDPT 2018)', req: ['Toán', 'Vật lý', 'Tin học'], fitGroups: ['Kỹ thuật - Công nghệ'] },
  { code: 'X26', name: 'X26 (Toán · Tin · Anh — Mới GDPT 2018)', req: ['Toán', 'Tin học', 'Tiếng Anh'], fitGroups: ['Kỹ thuật - Công nghệ', 'Kinh tế - Quản trị'] },
  { code: 'A02', name: 'A02 (Toán · Lí · Sinh)', req: ['Toán', 'Vật lý', 'Sinh học'], fitGroups: ['Y - Dược', 'Sư phạm - KHTN'] },
  { code: 'B08', name: 'B08 (Toán · Sinh · Anh)', req: ['Toán', 'Sinh học', 'Tiếng Anh'], fitGroups: ['Y - Dược', 'Sư phạm - KHTN'] },
  { code: 'C00', name: 'C00 (Văn · Sử · Địa)', req: ['Ngữ văn', 'Lịch sử', 'Địa lý'], fitGroups: ['Luật - Ngoại giao', 'Sư phạm - KHTN', 'Công an - Quân đội'] },
  { code: 'C03', name: 'C03 (Toán · Văn · Sử)', req: ['Toán', 'Ngữ văn', 'Lịch sử'], fitGroups: ['Công an - Quân đội', 'Luật - Ngoại giao'] },
  { code: 'D84', name: 'D84 (Toán · Anh · KT&PL — Mới GDPT 2018)', req: ['Toán', 'Tiếng Anh', 'KT&PL'], fitGroups: ['Kinh tế - Quản trị', 'Luật - Ngoại giao'] },
];

export function inferOptimalBlocksFromSubjects(selectedSubjects = []) {
  const set = new Set(selectedSubjects);
  const scored = GDPT2018_COMBO_RULES.map((rule) => {
    const matched = rule.req.filter((s) => set.has(s)).length;
    return {
      ...rule,
      matchedCount: matched,
      isFullMatch: matched === 3,
      score: matched * 10 + (rule.code === 'A00' || rule.code === 'B00' || rule.code === 'A01' || rule.code === 'D07' ? 2 : 0),
    };
  }).sort((a, b) => b.score - a.score);

  const recommended = scored.filter((r) => r.matchedCount >= 2).slice(0, 4);
  return recommended.length > 0 ? recommended : scored.slice(0, 3);
}

/* ── Kho dữ liệu Nhóm Ngành Chuẩn 9Study (Dùng cho cả AI Report & Deterministic Engine) ── */
export const CAREER_MAJOR_FAMILIES = [
  {
    id: 'ai-cs-semiconductor',
    name: 'Khoa học Máy tính, Trí tuệ Nhân tạo (AI) & Vi mạch Bán dẫn',
    riasecPrimary: ['I', 'R', 'C'],
    uniGroups: ['Kỹ thuật - Công nghệ'],
    blocks: ['A00', 'A01', 'X06', 'X26', 'D07'],
    majors: ['Khoa học máy tính', 'Trí tuệ nhân tạo (AI)', 'Kỹ thuật Máy tính & Thiết kế Vi mạch', 'Khoa học dữ liệu (Data Science)', 'An toàn thông tin (Cyber Security)', 'Kỹ thuật phần mềm'],
    unis: ['ĐH Bách Khoa Hà Nội (BKA)', 'ĐH Công nghệ - ĐHQGHN (QHI)', 'ĐH Bách Khoa TP.HCM (QSB)', 'ĐH CNTT - ĐHQG TP.HCM (UIT)', 'HV Công nghệ Bưu chính Viễn thông (PTT)', 'ĐH KHTN (QHT / QST)', 'ĐH FPT'],
    salaryJunior: '15 – 28 triệu/tháng',
    salarySenior: '45 – 95+ triệu/tháng',
    demandIndex: 98,
    aiResilience: 'Làm chủ công nghệ AI — Nhóm ngành dẫn dắt kỷ nguyên số 2026–2035',
    whyTemplate: 'Sự kết hợp mạnh mẽ giữa tư duy Nghiên cứu thuật toán (I) và Kỹ thuật hệ thống (R) giúp bạn cực kỳ nhạy bén với cấu trúc dữ liệu, mô hình AI và phần cứng bán dẫn.',
    roadmapSteps: [
      'Tập trung đạt 9.0+ môn Toán & Vật lí/Hóa học; luyện thêm kỳ thi ĐGTD Bách Khoa (TSA) hoặc ĐGNL (HSA/V-ACT).',
      'Làm quen sớm với Python / C++ và tư duy thuật toán cơ bản.',
      'Ưu tiên đạt IELTS 6.0+ để đọc tài liệu công nghệ quốc tế và cộng điểm xét tuyển kết hợp.',
    ],
  },
  {
    id: 'medicine-pharmacy-biotech',
    name: 'Y khoa, Răng - Hàm - Mặt, Dược học & Công nghệ Y sinh',
    riasecPrimary: ['I', 'S', 'R'],
    uniGroups: ['Y - Dược'],
    blocks: ['B00', 'A00', 'D07', 'B08', 'A02'],
    majors: ['Y khoa (Bác sĩ đa khoa)', 'Răng - Hàm - Mặt', 'Dược học & Hóa dược', 'Kỹ thuật Xét nghiệm Y học', 'Công nghệ Sinh học Y dược', 'Điều dưỡng chất lượng cao'],
    unis: ['ĐH Y Hà Nội (YHA)', 'ĐH Y Dược TP.HCM (YDS)', 'ĐH Dược Hà Nội (DKH)', 'ĐH Y khoa Phạm Ngọc Thạch (YTP)', 'ĐH Y Dược - ĐHQGHN (QHY)', 'HV Quân Y (YQH)', 'ĐH Y Dược Huế / Cần Thơ / Thái Bình'],
    salaryJunior: '14 – 26 triệu/tháng',
    salarySenior: '40 – 90+ triệu/tháng',
    demandIndex: 96,
    aiResilience: 'Không thể thay thế — Chẩn đoán lâm sàng, phẫu thuật và nghiên cứu Hóa dược luôn khát nhân lực chất lượng cao',
    whyTemplate: 'Tố chất Nghiên cứu khoa học tự nhiên (I) kết hợp lòng Thấu cảm xã hội (S) và sự tỉ mỉ Thực hành (R) là chân dung chuẩn mực của đội ngũ Bác sĩ và Dược sĩ tinh hoa.',
    roadmapSteps: [
      'Khóa chặt tổ hợp B00 (Toán - Hóa - Sinh) hoặc A00/D07 (với ngành Dược/Hóa dược) ở ngưỡng 25.5 – 28.0+ điểm.',
      'Rèn luyện đặc biệt các chuyên đề Hóa hữu cơ (Este, Amino acid, Phức chất) và Di truyền học phân tử.',
      'Chuẩn bị tinh thần học tập chuyên sâu 5–6 năm với lộ trình thực hành bệnh viện/phòng Lab bài bản.',
    ],
  },
  {
    id: 'automation-chem-mechatronics',
    name: 'Kỹ thuật Điều khiển - Tự động hóa, Hóa học & Công nghệ Vật liệu mới',
    riasecPrimary: ['R', 'I', 'C'],
    uniGroups: ['Kỹ thuật - Công nghệ'],
    blocks: ['A00', 'A01', 'B00', 'D07', 'X06'],
    majors: ['Kỹ thuật Điều khiển & Tự động hóa', 'Kỹ thuật Cơ điện tử & Robot thông minh', 'Kỹ thuật Hóa học & Hóa dầu', 'Kỹ thuật Sinh học & Thực phẩm', 'Kỹ thuật Điện tử - Viễn thông', 'Kỹ thuật Ô tô điện & Năng lượng tái tạo'],
    unis: ['ĐH Bách Khoa Hà Nội (BKA)', 'ĐH Bách Khoa TP.HCM (QSB)', 'ĐH Công nghiệp Hà Nội (DCN)', 'ĐH Sư phạm Kỹ thuật TP.HCM (SPK)', 'ĐH Giao thông Vận tải (GHA)', 'ĐH Xây dựng Hà Nội (XDA)'],
    salaryJunior: '14 – 24 triệu/tháng',
    salarySenior: '35 – 70 triệu/tháng',
    demandIndex: 93,
    aiResilience: 'Rất an toàn — Làn sóng FDI sản xuất công nghệ cao, xe điện và vật liệu xanh tại Việt Nam tăng trưởng mạnh',
    whyTemplate: 'Điểm Thực tế - Kỹ thuật (R) và Nghiên cứu (I) nổi trội giúp bạn làm chủ quy trình vận hành nhà máy thông minh, tổng hợp vật liệu và hệ thống điều khiển tự động.',
    roadmapSteps: [
      'Tối ưu điểm Vật lí (Dao động, Điện xoay chiều, Nhiệt - Khí) và Hóa học (Điện hóa, Kim loại chuyển tiếp).',
      'Tham khảo đề án xét tuyển TSA (ĐHBK Hà Nội) hoặc V-ACT (ĐHBK TP.HCM) để nhân đôi cơ hội trúng tuyển.',
      'Phát triển kỹ năng thực hành thí nghiệm ảo trên Phòng Lab 3D ELEC AI.',
    ],
  },
  {
    id: 'economics-fintech-business',
    name: 'Kinh tế Quốc tế, Tài chính - Ngân hàng (FinTech) & Quản trị Chuỗi cung ứng',
    riasecPrimary: ['E', 'C', 'I'],
    uniGroups: ['Kinh tế - Quản trị'],
    blocks: ['A00', 'A01', 'D01', 'D07', 'X26', 'D84'],
    majors: ['Kinh tế đối ngoại & Thương mại quốc tế', 'Tài chính - Ngân hàng & Đầu tư (FinTech)', 'Kế toán - Kiểm toán chuẩn quốc tế', 'Logistics & Quản lý chuỗi cung ứng', 'Marketing số & Phân tích kinh doanh (BA)', 'Kinh tế đầu tư'],
    unis: ['ĐH Ngoại thương (FTU)', 'ĐH Kinh tế Quốc dân (NEU)', 'ĐH Kinh tế TP.HCM (UEH)', 'HV Tài chính (HTC)', 'HV Ngân hàng (NHH)', 'ĐH Thương mại (TMA)', 'ĐH Kinh tế - ĐHQGHN (QHE)'],
    salaryJunior: '13 – 25 triệu/tháng',
    salarySenior: '35 – 85+ triệu/tháng',
    demandIndex: 92,
    aiResilience: 'Cao khi kết hợp Phân tích dữ liệu (Business Analytics) & Ngoại ngữ',
    whyTemplate: 'Sự nhạy bén Quản trị - Kinh doanh (E) kết hợp tư duy Hệ thống - Số liệu (C) giúp bạn tỏa sáng trong điều hành thương mại, phân tích đầu tư và quản trị tài chính.',
    roadmapSteps: [
      'Đầu tư mạnh cho Toán (tư duy định lượng) + Tiếng Anh (IELTS 6.5+ được quy đổi 10đ hoặc cộng điểm lớn tại NEU, FTU, UEH).',
      'Kết hợp thi ĐGNL HSA (mục tiêu 100+/150) hoặc V-ACT (850+/1200) vì các trường Kinh tế top đầu dành 30–50% chỉ tiêu cho phương thức này.',
      'Rèn kỹ năng thuyết trình, phân tích dữ liệu Excel/BI và tư duy kinh tế số.',
    ],
  },
  {
    id: 'education-stem-pedagogy',
    name: 'Sư phạm Khoa học Tự nhiên (Toán - Lý - Hóa - Sinh) & Công nghệ Giáo dục',
    riasecPrimary: ['S', 'I', 'A'],
    uniGroups: ['Sư phạm - KHTN'],
    blocks: ['A00', 'B00', 'A01', 'D07', 'D01', 'C00'],
    majors: ['Sư phạm Hóa học', 'Sư phạm Toán học', 'Sư phạm Vật lí', 'Sư phạm Sinh học', 'Sư phạm Khoa học Tự nhiên', 'Sư phạm Tiếng Anh & Giáo dục Tiểu học'],
    unis: ['ĐH Sư phạm Hà Nội (HNUE)', 'ĐH Sư phạm TP.HCM (HCMUE)', 'ĐH Giáo dục - ĐHQGHN (QHS)', 'ĐH Sư phạm Thái Nguyên (TNU)', 'ĐH Sư phạm Huế / Đà Nẵng', 'ĐH Sài Gòn (SGD)'],
    salaryJunior: '12 – 22 triệu/tháng (Miễn 100% học phí + hỗ trợ 3.63tr/tháng khi học)',
    salarySenior: '25 – 55+ triệu/tháng',
    demandIndex: 94,
    aiResilience: 'Cực kỳ bền vững — Chương trình GDPT 2018 & EdTech mở ra nhu cầu lớn về giáo viên KHTN hiện đại',
    whyTemplate: 'Khả năng Truyền đạt & Thấu cảm (S) hòa quyện cùng nền tảng Học thuật vững chắc (I) giúp bạn trở thành người thầy truyền cảm hứng và chuyên gia giáo dục xuất sắc.',
    roadmapSteps: [
      'Do được hưởng Nghị định 116 (miễn học phí + cấp 3.63 triệu/tháng), điểm chuẩn khối Sư phạm rất cao (25.5 – 28.5đ) — cần ôn chắc từng câu lý thuyết.',
      'Đăng ký thêm kỳ thi ĐGNL riêng SPT (ĐH Sư phạm Hà Nội) hoặc H-SCA (ĐH Sư phạm TP.HCM) để mở rộng cánh cửa trúng tuyển.',
      'Luyện kỹ năng diễn đạt trực quan và ứng dụng AI/công nghệ mô phỏng vào bài giảng.',
    ],
  },
  {
    id: 'law-diplomacy-creative-security',
    name: 'Luật học, Ngoại giao, Truyền thông Sáng tạo & An ninh - Quốc phòng',
    riasecPrimary: ['E', 'A', 'S', 'C'],
    uniGroups: ['Luật - Ngoại giao', 'Công an - Quân đội'],
    blocks: ['D01', 'C00', 'A00', 'A01', 'C03', 'D14'],
    majors: ['Luật Kinh tế & Luật Quốc tế', 'Quan hệ Quốc tế & Truyền thông Quốc tế', 'An ninh mạng & Phòng chống tội phạm công nghệ cao', 'Truyền thông đa phương tiện & Báo chí số', 'Ngôn ngữ Anh / Trung / Hàn / Nhật'],
    unis: ['ĐH Luật Hà Nội (LHA)', 'HV Ngoại giao (DAV)', 'HV An ninh Nhân dân (ANND)', 'HV Cảnh sát Nhân dân (CSND)', 'ĐH Ngoại ngữ - ĐHQGHN (QHF)', 'HV Báo chí & Tuyên truyền (HBT)', 'ĐH Luật TP.HCM (LPS)'],
    salaryJunior: '13 – 25 triệu/tháng',
    salarySenior: '35 – 75+ triệu/tháng',
    demandIndex: 90,
    aiResilience: 'Cao — Đàm phán pháp lý, ngoại giao chiến lược và nghiệp vụ an ninh đòi hỏi bản lĩnh con người',
    whyTemplate: 'Tư duy phản biện sắc bén (E), khả năng diễn đạt ngôn ngữ/sáng tạo (A-S) và tính kỷ luật hệ thống (C) tạo nên lợi thế vượt trội trong lĩnh vực Pháp lý, Ngoại giao và An ninh.',
    roadmapSteps: [
      'Nắm chắc tổ hợp D01, C00, C03 hoặc A00/A01 tùy định hướng; chú ý mốc sơ tuyển sớm nếu đăng ký khối trường Công an / Quân đội.',
      'Rèn kỹ năng lập luận chặt chẽ, đọc hiểu văn bản nhanh và ngoại ngữ chuyên ngành.',
      'Xây dựng rổ 3 nguyện vọng có trường công lập top đầu làm NV1 và trường vừa sức làm NV2-NV3.',
    ],
  },
];

/**
 * Xây dựng Báo cáo Định hướng Nghề nghiệp & Trường ĐH chuẩn 9Study
 * (Hoạt động 100% deterministic tức thì + có thể làm giàu thêm bằng AI narrative)
 */
export function buildDeepRiasecReport({
  riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
  subjects = [],
  goal = 'Công việc lương cao & ổn định',
  predictedScore30 = null,
  preferredRegion = 'Tất cả',
  cutoffCatalog = [],
} = {}) {
  const maxPossiblePerDim = Math.max(
    1,
    ...Object.values(riasecScores).map((v) => Number(v) || 0),
    12
  );

  const dimensions = RIASEC_DIMENSIONS.map((d) => {
    const raw = Number(riasecScores[d.k]) || 0;
    const pct = Math.min(100, Math.max(15, Math.round((raw / maxPossiblePerDim) * 100)));
    return {
      ...d,
      rawScore: raw,
      pct,
    };
  });

  const sortedDims = [...dimensions].sort((a, b) => b.rawScore - a.rawScore);
  const top3Dims = sortedDims.slice(0, 3);
  const hollandCode = top3Dims.map((d) => d.k).join('-');
  const optimalBlocks = inferOptimalBlocksFromSubjects(subjects);
  const optimalBlockCodes = new Set(optimalBlocks.map((b) => b.code));

  // Chấm điểm độ hợp cho 6 Nhóm ngành lớn
  const scoredFamilies = CAREER_MAJOR_FAMILIES.map((fam) => {
    const p0 = dimensions.find((d) => d.k === fam.riasecPrimary[0])?.pct || 50;
    const p1 = dimensions.find((d) => d.k === fam.riasecPrimary[1])?.pct || 50;
    const p2 = dimensions.find((d) => d.k === fam.riasecPrimary[2])?.pct || 50;
    let score = p0 * 0.5 + p1 * 0.32 + p2 * 0.18;

    // Cộng thưởng nếu khớp môn học mạnh / tổ hợp
    const blockOverlap = fam.blocks.filter((b) => optimalBlockCodes.has(b)).length;
    score += blockOverlap * 3.5;

    // Cộng thưởng theo mục tiêu cá nhân
    if (goal.includes('lương cao') && (fam.id.includes('ai-cs') || fam.id.includes('economics'))) score += 4;
    if (goal.includes('sáng tạo') && (fam.id.includes('creative') || fam.id.includes('ai-cs'))) score += 5;
    if (goal.includes('cộng đồng') && (fam.id.includes('medicine') || fam.id.includes('education'))) score += 6;
    if (goal.includes('kinh doanh') && fam.id.includes('economics')) score += 6;
    if (goal.includes('Nghiên cứu') && (fam.id.includes('ai-cs') || fam.id.includes('medicine') || fam.id.includes('automation'))) score += 5;

    const match = Math.min(98, Math.max(64, Math.round(score)));
    return {
      ...fam,
      match,
      why: fam.whyTemplate,
      outlook: `Lương khởi điểm: ${fam.salaryJunior} · Chuyên gia: ${fam.salarySenior} · ${fam.aiResilience}`,
    };
  }).sort((a, b) => b.match - a.match);

  const top3Groups = scoredFamilies.slice(0, 3);

  // Lọc và chấm điểm các ngành/trường thực tế từ catalog
  const topCodeSet = new Set(top3Dims.map((d) => d.k));
  const GROUP_TO_RIASEC = {
    'Y - Dược': ['I', 'S', 'R'],
    'Y Dược': ['I', 'S', 'R'],
    'Kỹ thuật - Công nghệ': ['R', 'I', 'C'],
    'Kinh tế - Quản trị': ['E', 'C', 'I'],
    'Kinh tế - Quản lý': ['E', 'C', 'I'],
    'Luật - Ngoại giao': ['E', 'S', 'A'],
    'Sư phạm - KHTN': ['S', 'I', 'A'],
    'Sư phạm': ['S', 'I', 'A'],
    'Công an - Quân đội': ['C', 'R', 'E'],
  };

  const matchedMajors = (cutoffCatalog || [])
    .filter((row) => {
      if (preferredRegion && preferredRegion !== 'Tất cả') {
        if (preferredRegion === 'Miền Bắc' && !/Hà Nội|Thái Nguyên|Hải Phòng|Bắc/i.test(row.city || '')) return false;
        if (preferredRegion === 'Miền Nam' && !/TP\.HCM|HCM|Cần Thơ|Nam/i.test(row.city || '')) return false;
        if (preferredRegion === 'Miền Trung' && !/Đà Nẵng|Huế|ĐN|Vinh|Trung/i.test(row.city || '')) return false;
        if (!['Miền Bắc', 'Miền Nam', 'Miền Trung'].includes(preferredRegion) && !(row.city || '').includes(preferredRegion)) return false;
      }
      return true;
    })
    .map((row) => {
      const codes = row.riasec || GROUP_TO_RIASEC[row.group] || ['I', 'R', 'C'];
      const d0 = dimensions.find((d) => d.k === codes[0])?.pct || 55;
      const d1 = dimensions.find((d) => d.k === codes[1])?.pct || 50;
      const d2 = dimensions.find((d) => d.k === codes[2])?.pct || 45;
      let fit = d0 * 0.5 + d1 * 0.32 + d2 * 0.18;

      const rowBlocks = String(row.combo || '').split(/[/,\s]+/).filter(Boolean);
      if (rowBlocks.some((b) => optimalBlockCodes.has(b))) fit += 6;
      if (codes.some((c) => topCodeSet.has(c))) fit += 4;

      const cutoff = Number(row.s2025 ?? row.s2024 ?? 0);
      const chance = predictedScore30 != null && cutoff > 0
        ? computeMajorAdmissionChance(predictedScore30, cutoff)
        : null;

      if (chance) {
        if (chance.tier === 'safety' || chance.tier === 'target') fit += 5;
        else if (chance.tier === 'reach') fit += 2;
        else fit -= 4;
      }

      const fitPct = Math.min(98, Math.max(60, Math.round(fit)));
      return {
        ...row,
        fitPct,
        profileCodes: codes,
        admissionChance: chance,
      };
    })
    .sort((a, b) => b.fitPct - a.fitPct || (b.s2025 || 0) - (a.s2025 || 0));

  const summary =
    `Mã Holland nổi bật của bạn là ${hollandCode} — sự kết hợp giữa ${top3Dims[0].name} (${top3Dims[0].pct}%) và ${top3Dims[1].name} (${top3Dims[1].pct}%). ` +
    `Với thế mạnh ở ${subjects.length ? subjects.join(', ') : 'các môn Khoa học Tự nhiên & Toán'}, tổ hợp xét tuyển tối ưu nhất cho bạn là ${optimalBlocks.slice(0, 3).map((b) => b.code).join(', ')}.`;

  const advice =
    predictedScore30 != null
      ? `Với mức điểm năng lực hiện tại ~${predictedScore30}/30, bạn nên chọn 1 ngành thuộc nhóm "${top3Groups[0].name}" làm NV1 (Mơ ước/Trọng tâm) và ghim thêm 1–2 ngành có điểm chuẩn khoảng ${(predictedScore30 - 1.2).toFixed(1)} – ${predictedScore30.toFixed(1)}đ làm NV2–NV3 để an toàn 100%.`
      : `Hãy ghim ngay 1–2 ngành có độ hợp trên 85% bên dưới vào Rổ Nguyện vọng (NV1 - NV2 - NV3), sau đó làm 1 đề chẩn đoán tại Phòng thi ảo để đo chính xác tỷ lệ đỗ.`;

  return {
    hollandCode,
    topCodes: top3Dims.map((d) => d.k),
    dimensions,
    optimalBlocks,
    summary,
    groups: top3Groups,
    matchedMajors: matchedMajors.slice(0, 12),
    advice,
  };
}

/**
 * Tự động xây dựng "Rổ Nguyện vọng Vàng 3 tầng" (NV1 Mơ ước · NV2 Vừa sức · NV3 Bảo hiểm an toàn)
 * dựa trên điểm xét tuyển hiện tại và nhóm ngành / khu vực học sinh đang chọn
 */
export function buildRecommended3TierPortfolio({
  score30 = 25.0,
  group = 'Tất cả',
  city = 'Tất cả',
  catalog = [],
} = {}) {
  const safeScore = Number.isFinite(Number(score30)) && Number(score30) > 0 ? Number(score30) : 25.0;
  let pool = (catalog || []).filter((r) => Number.isFinite(Number(r.s2025 ?? r.s2024)));

  if (group && group !== 'Tất cả') {
    const byGroup = pool.filter((r) => r.group === group);
    if (byGroup.length >= 3) pool = byGroup;
  }
  if (city && city !== 'Tất cả') {
    const byCity = pool.filter((r) => (r.city || '').includes(city));
    if (byCity.length >= 3) pool = byCity;
  }

  const getCutoff = (r) => Number(r.s2024 ?? r.s2025 ?? 24);

  // NV1 (Reach): cutoff cao hơn điểm hiện tại từ > +0.5đ đến +2.0đ (đúng chuẩn classifyAspirationTier = 'reach')
  const reachCandidates = [...pool]
    .filter((r) => {
      const c = getCutoff(r);
      return c > safeScore + 0.5 && c <= safeScore + 2.0;
    })
    .sort((a, b) => Math.abs(getCutoff(a) - (safeScore + 0.9)) - Math.abs(getCutoff(b) - (safeScore + 0.9)));

  const nv1 =
    reachCandidates[0] ||
    [...pool].sort((a, b) => Math.abs(getCutoff(a) - (safeScore + 0.8)) - Math.abs(getCutoff(b) - (safeScore + 0.8)))[0];

  // NV2 (Target): cutoff nằm trong khoảng [safeScore - 1.2, safeScore + 0.5] (đúng chuẩn classifyAspirationTier = 'target')
  const nv1Cutoff = nv1 ? getCutoff(nv1) : safeScore + 0.8;
  const targetCandidates = [...pool]
    .filter((r) => {
      const c = getCutoff(r);
      return r.id !== nv1?.id && c <= Math.min(nv1Cutoff, safeScore + 0.5) && c > safeScore - 1.25;
    })
    .sort((a, b) => Math.abs(getCutoff(a) - safeScore) - Math.abs(getCutoff(b) - safeScore));

  const nv2 =
    targetCandidates[0] ||
    [...pool]
      .filter((r) => r.id !== nv1?.id && getCutoff(r) <= nv1Cutoff)
      .sort((a, b) => Math.abs(getCutoff(a) - safeScore) - Math.abs(getCutoff(b) - safeScore))[0];

  // NV3 (Safety Net): cutoff <= safeScore - 1.25đ (đúng chuẩn classifyAspirationTier = 'safety')
  const nv2Cutoff = nv2 ? getCutoff(nv2) : safeScore;
  const safetyCandidates = [...pool]
    .filter((r) => r.id !== nv1?.id && r.id !== nv2?.id && getCutoff(r) <= Math.min(safeScore - 1.25, nv2Cutoff))
    .sort((a, b) => Math.abs(getCutoff(a) - (safeScore - 1.6)) - Math.abs(getCutoff(b) - (safeScore - 1.6)));

  const nv3 =
    safetyCandidates[0] ||
    [...pool]
      .filter((r) => r.id !== nv1?.id && r.id !== nv2?.id && getCutoff(r) <= nv2Cutoff)
      .sort((a, b) => getCutoff(a) - getCutoff(b))[0];

  return [nv1, nv2, nv3].filter(Boolean);
}

/**
 * Đồng bộ 2 chiều: Ghim 1 ngành vào đúng vị trí Nguyện vọng 1, 2 hoặc 3
 * trong cả `aspirationService` (Navbar StudyGoalNavDropdown) lẫn `saveTargetUniversity`
 */
export function pinMajorToAspirationSlot(uid = 'guest', record, priority = 1, examId = 'THPTQG') {
  if (!record) return null;
  const schoolCode = record.code || record.schoolId || record.school?.code || 'NEU';
  const majorId = record.id || record.majorId || `${schoolCode.toLowerCase()}-major`;
  const cutoff = Number(record.s2025 ?? record.s2024 ?? record.cutoffScore ?? 25.0);
  const block = String(record.combo || record.block || 'A00').split(/[/,\s]+/)[0] || 'A00';
  const targetScore = Number(Math.min(30, Math.max(15, cutoff + 0.5)).toFixed(2));

  const cur = getUserAspirationsState(uid);
  // Nếu trường/ngành chưa có và đã đủ 3 NV, thay thế đúng vị trí priority (1..3)
  const existingIdx = cur.aspirations.findIndex(
    (a) => a.majorId === majorId || (a.school?.code === schoolCode && a.major?.name === (record.major || record.name))
  );

  if (existingIdx < 0 && cur.aspirations.length >= 3) {
    const slotIdx = Math.max(0, Math.min(2, (Number(priority) || 1) - 1));
    const victim = cur.aspirations[slotIdx];
    if (victim) {
      upsertAspiration(uid, {
        id: victim.id,
        examId,
        schoolId: schoolCode,
        schoolCode,
        schoolName: record.uni || record.schoolName || schoolCode,
        majorId,
        majorName: record.major || record.name || 'Ngành xét tuyển',
        majorCode: record.majorCode || '',
        block,
        targetScore,
        cutoffScore: cutoff,
        setActive: priority === 1,
      });
    }
  } else {
    const updated = upsertAspiration(uid, {
      examId,
      schoolId: schoolCode,
      schoolCode,
      schoolName: record.uni || record.schoolName || schoolCode,
      majorId,
      majorName: record.major || record.name || 'Ngành xét tuyển',
      majorCode: record.majorCode || '',
      block,
      targetScore,
      cutoffScore: cutoff,
      setActive: priority === 1,
    });

    // Đưa đúng về vị trí ưu tiên 1, 2 hoặc 3 theo majorId chính xác
    const hit = updated.aspirations.find(
      (a) => a.majorId === majorId || (a.school?.code === schoolCode && a.major?.name === (record.major || record.name))
    );
    if (hit && Number(priority) >= 1 && Number(priority) <= 3) {
      const others = updated.aspirations.filter((a) => a.id !== hit.id).map((a) => a.id);
      const insertAt = Math.min(others.length, Number(priority) - 1);
      others.splice(insertAt, 0, hit.id);
      reorderAspirations(uid, others);
    }
  }

  if (Number(priority) === 1) {
    saveTargetUniversity(uid, {
      id: majorId,
      uni: record.uni || record.schoolName || schoolCode,
      code: schoolCode,
      majorCode: record.majorCode || '',
      group: record.group || 'Kỹ thuật - Công nghệ',
      city: record.city || 'Hà Nội',
      major: record.major || record.name || 'Ngành xét tuyển',
      combo: record.combo || block,
      methods: record.methods || ['THPTQG'],
      s2024: record.s2024 ?? cutoff,
      s2025: record.s2025 ?? cutoff,
    });
  }

  return getUserAspirationsState(uid);
}
