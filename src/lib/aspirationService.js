/* ============================================================
   aspirationService.js — GIAI ĐOẠN 1: MÔ HÌNH DỮ LIỆU & SERVICE
   ------------------------------------------------------------
   Quản lý các thực thể chuẩn:
     • Exam (kỳ thi): THPTQG, HSA, TSA, V-ACT, SPT, H-SCA
     • School (trường ĐH/Học viện): id, name, code, cover...
     • Major (ngành học): id, schoolId, name, majorCode, blocks, cutoffs, note
     • Aspiration (nguyện vọng): id, userId, examId, schoolId, majorId, priority (1..3), targetScore, targetChemScore
     • Progress (tiến độ): predictedScore, targetScore, scoreGap, status, elo, eloHistory
   Sử dụng lớp trừu tượng StorageAdapter (mặc định localStorage + CustomEvent)
   để dễ dàng chuyển sang REST/Firestore/Supabase API khi cần.
   ============================================================ */

import referenceData from '../data/admissionsReference.json';
import { CUTOFF_DATA } from '../data/uniCutoffs.js';
import { getUniversityCover, getUniversityInfo } from '../data/universityCovers.js';

const STORAGE_PREFIX = 'elec-aspirations-v2:';
const CHANGE_EVENT = 'elec-aspirations-change';
export const ASPIRATION_CHANGE_EVENT = CHANGE_EVENT;
const MAX_ASPIRATIONS = 3;
const DAY_MS = 86400000;

/* ---------- Chuẩn hóa chuỗi tìm kiếm tiếng Việt không dấu ---------- */
export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/* ============================================================
   1. TRUY XUẤT DỮ LIỆU THAM KHẢO (EXAM, SCHOOL, MAJOR)
   ============================================================ */

export function getReferenceMetadata() {
  return {
    nam: referenceData.nam,
    nguon: referenceData.nguon,
    nhanHienThi: referenceData.nhanHienThi || `Dữ liệu tham khảo năm ${referenceData.nam}`,
  };
}

export function getExams() {
  return referenceData.exams || [];
}

export function getExamById(examId = 'THPTQG') {
  const exams = getExams();
  return exams.find((e) => e.id === examId) || exams[0];
}

export function getSchools() {
  return (referenceData.schools || []).map((s) => ({
    ...s,
    cover: getUniversityCover(s.id || s.code),
  }));
}

export function getSchoolById(schoolId) {
  if (!schoolId) return null;
  const key = String(schoolId).trim().toUpperCase();
  const all = getSchools();
  const direct = all.find(
    (s) =>
      String(s.id || '').toUpperCase() === key ||
      String(s.code || '').toUpperCase() === key ||
      String(s.admissionCode || '').toUpperCase() === key ||
      String(s.altCode || '').toUpperCase() === key
  );
  if (direct) return direct;
  const info = getUniversityInfo(key);
  if (info?.id) {
    return all.find((s) => String(s.id || '').toUpperCase() === info.id) || null;
  }
  return null;
}

export function searchSchools(query = '') {
  const q = normalizeText(query);
  const all = getSchools();
  if (!q) return all;
  return all.filter(
    (s) => normalizeText(s.name).includes(q)
      || normalizeText(s.code).includes(q)
      || normalizeText(s.city).includes(q),
  );
}

/* ── Bổ sung tự động danh mục ngành chuẩn cho 105 trường ĐH ── */
const GROUP_MAJOR_TEMPLATES = {
  'Y Dược': [
    { suffix: 'ykhoa', code: '7720101', name: 'Y khoa (Bác sĩ Đa khoa)', blocks: ['B00', 'A00'], delta: 1.2, career: 'Bác sĩ đa khoa, Bác sĩ nội trú tại các bệnh viện tuyến trung ương' },
    { suffix: 'duoc', code: '7720201', name: 'Dược học', blocks: ['A00', 'B00', 'D07'], delta: 0.2, career: 'Dược sĩ lâm sàng, Nghiên cứu phát triển thuốc & Kiểm nghiệm dược phẩm' },
    { suffix: 'rhm', code: '7720501', name: 'Răng - Hàm - Mặt', blocks: ['B00'], delta: 0.9, career: 'Bác sĩ Răng Hàm Mặt, Chuyên gia nha khoa thẩm mỹ & phẫu thuật hàm mặt' },
    { suffix: 'xn', code: '7720601', name: 'Kỹ thuật Xét nghiệm Y học', blocks: ['B00', 'A00'], delta: -0.8, career: 'Chuyên viên xét nghiệm y sinh, Chẩn đoán phân tử tại bệnh viện & viện nghiên cứu' },
  ],
  'Kinh tế': [
    { suffix: 'qtkd', code: '7340101', name: 'Quản trị kinh doanh & Kinh doanh số', blocks: ['A00', 'A01', 'D01', 'D07'], delta: 0.3, career: 'Quản trị doanh nghiệp, Giám đốc dự án, Chuyên viên phát triển kinh doanh' },
    { suffix: 'tcnh', code: '7340201', name: 'Tài chính - Ngân hàng & Đầu tư (FinTech)', blocks: ['A00', 'A01', 'D01', 'D07'], delta: 0.5, career: 'Chuyên viên phân tích đầu tư, Ngân hàng thương mại, Quản trị rủi ro tài chính' },
    { suffix: 'mkt', code: '7340115', name: 'Marketing số & Truyền thông thương hiệu', blocks: ['A00', 'A01', 'D01'], delta: 0.9, career: 'Chuyên gia Digital Marketing, Quản trị thương hiệu, Nghiên cứu thị trường' },
    { suffix: 'ktkt', code: '7340301', name: 'Kế toán - Kiểm toán', blocks: ['A00', 'A01', 'D01', 'D07'], delta: 0.0, career: 'Kiểm toán viên quốc tế (Big4), Kế toán trưởng, Tư vấn thuế' },
    { suffix: 'logistics', code: '7510605', name: 'Logistics & Quản lý chuỗi cung ứng', blocks: ['A00', 'A01', 'D01', 'D07'], delta: 0.8, career: 'Điều phối chuỗi cung ứng toàn cầu, Xuất nhập khẩu & Thương mại quốc tế' },
  ],
  'Kỹ thuật': [
    { suffix: 'cntt', code: '7480201', name: 'Công nghệ thông tin & Kỹ thuật phần mềm', blocks: ['A00', 'A01', 'X06', 'D07'], delta: 1.1, career: 'Kỹ sư phần mềm, Kiến trúc sư hệ thống, Chuyên gia phát triển ứng dụng AI' },
    { suffix: 'tdh', code: '7520216', name: 'Kỹ thuật Điều khiển & Tự động hóa', blocks: ['A00', 'A01', 'X06'], delta: 0.6, career: 'Kỹ sư tự động hóa nhà máy thông minh, Robot công nghiệp, Hệ thống nhúng' },
    { suffix: 'dtvt', code: '7520207', name: 'Kỹ thuật Điện tử - Viễn thông & Vi mạch', blocks: ['A00', 'A01', 'X06'], delta: 0.4, career: 'Kỹ sư thiết kế vi mạch bán dẫn, Hệ thống IoT & Viễn thông thế hệ mới' },
    { suffix: 'kthoa', code: '7520301', name: 'Kỹ thuật Hóa học & Công nghệ Vật liệu', blocks: ['A00', 'B00', 'D07'], delta: -0.6, career: 'Kỹ sư công nghệ hóa dầu, Vật liệu mới, Năng lượng sạch & Môi trường' },
  ],
  'Sư phạm': [
    { suffix: 'sptoan', code: '7140209', name: 'Sư phạm Toán học (Hưởng NĐ 116)', blocks: ['A00', 'A01'], delta: 1.0, career: 'Giáo viên Toán THPT/THCS, Giảng viên, Chuyên gia phát triển chương trình STEM' },
    { suffix: 'sphoa', code: '7140212', name: 'Sư phạm Hóa học (Hưởng NĐ 116)', blocks: ['A00', 'B00', 'D07'], delta: 0.7, career: 'Giáo viên Hóa học & KHTN, Chuyên gia nghiên cứu khoa học giáo dục' },
    { suffix: 'sply', code: '7140211', name: 'Sư phạm Vật lí & KHTN (Hưởng NĐ 116)', blocks: ['A00', 'A01', 'A02'], delta: 0.5, career: 'Giáo viên Vật lí & Khoa học tự nhiên, Chuyên viên thiết bị thí nghiệm' },
    { suffix: 'spanh', code: '7140231', name: 'Sư phạm Tiếng Anh', blocks: ['D01'], delta: 0.9, career: 'Giáo viên Tiếng Anh, Chuyên gia đào tạo ngoại ngữ & khảo thí quốc tế' },
  ],
  'Công an': [
    { suffix: 'nghiepvu', code: '7860100', name: 'Nghiệp vụ An ninh / Cảnh sát / Quân sự', blocks: ['A00', 'A01', 'C03', 'D01'], delta: 0.6, career: 'Sĩ quan nghiệp vụ chuyên ngành (Miễn 100% học phí, phân công công tác sau tốt nghiệp)' },
    { suffix: 'attt', code: '7480202', name: 'An toàn thông tin & An ninh mạng', blocks: ['A00', 'A01'], delta: 1.0, career: 'Sĩ quan tác chiến không gian mạng, Bảo mật hệ thống thông tin trọng yếu' },
    { suffix: 'ktqs', code: '7520201', name: 'Kỹ thuật Điện tử & Chỉ huy Kỹ thuật', blocks: ['A00', 'A01'], delta: 0.2, career: 'Kỹ sư quân sự, Nghiên cứu chế tạo khí tài công nghệ cao' },
  ],
  'Luật': [
    { suffix: 'luat', code: '7380101', name: 'Luật học', blocks: ['A00', 'A01', 'C00', 'D01'], delta: 0.4, career: 'Luật sư, Thẩm phán, Kiểm sát viên, Chuyên viên pháp chế' },
    { suffix: 'luatkt', code: '7380107', name: 'Luật Kinh tế & Thương mại quốc tế', blocks: ['A00', 'A01', 'D01', 'C00'], delta: 0.9, career: 'Cố vấn pháp lý doanh nghiệp, Trọng tài thương mại, Pháp chế ngân hàng' },
    { suffix: 'qhqt', code: '7310206', name: 'Quan hệ Quốc tế & Ngoại giao', blocks: ['D01', 'A01', 'D07'], delta: 1.1, career: 'Cán bộ ngoại giao, Chuyên viên tổ chức quốc tế & đối ngoại tập đoàn' },
  ],
  'Ngoại ngữ': [
    { suffix: 'nna', code: '7220201', name: 'Ngôn ngữ Anh & Biên phiên dịch quốc tế', blocks: ['D01', 'D07', 'A01'], delta: 0.7, career: 'Biên phiên dịch cao cấp, Truyền thông đối ngoại, Giảng dạy tiếng Anh' },
    { suffix: 'nntrung', code: '7220204', name: 'Ngôn ngữ Trung Quốc / Hàn Quốc / Nhật Bản', blocks: ['D01'], delta: 0.9, career: 'Chuyên gia thương mại song ngữ, Đối ngoại doanh nghiệp FDI' },
    { suffix: 'ttdpt', code: '7320104', name: 'Truyền thông đa phương tiện & PR', blocks: ['D01', 'C00', 'A01'], delta: 0.8, career: 'Chuyên viên truyền thông số, Sản xuất nội dung, Quan hệ công chúng' },
  ],
};

function parseMidCutoff(cutoffRange = '') {
  const nums = String(cutoffRange || '')
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((n) => n >= 14 && n <= 30);
  if (!nums || !nums.length) return 24.5;
  const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
  return Number(avg.toFixed(2));
}

function pickTemplateBucket(groupStr = '') {
  const g = String(groupStr || '');
  if (/Y Dược/i.test(g)) return GROUP_MAJOR_TEMPLATES['Y Dược'];
  if (/Sư phạm/i.test(g)) return GROUP_MAJOR_TEMPLATES['Sư phạm'];
  if (/Công an|Quân đội/i.test(g)) return GROUP_MAJOR_TEMPLATES['Công an'];
  if (/Luật|Ngoại giao/i.test(g)) return GROUP_MAJOR_TEMPLATES['Luật'];
  if (/Ngoại ngữ|Xã hội|Báo chí/i.test(g)) return GROUP_MAJOR_TEMPLATES['Ngoại ngữ'];
  if (/Kinh tế|Thương mại|Tài chính|Du lịch/i.test(g)) return GROUP_MAJOR_TEMPLATES['Kinh tế'];
  return GROUP_MAJOR_TEMPLATES['Kỹ thuật'];
}

function buildEnrichedMajorsForSchool(school) {
  if (!school) return [];
  const sCode = String(school.id || school.code).toUpperCase();
  const validIds = new Set(
    [school.id, school.code, school.admissionCode, school.altCode]
      .filter(Boolean)
      .map((x) => String(x).toUpperCase())
  );

  // 1. Lấy từ referenceData.majors
  const direct = (referenceData.majors || []).filter((m) =>
    validIds.has(String(m.schoolId || '').toUpperCase())
  );

  // 2. Lấy từ detailedSchemes[k].majors nếu có
  const schemes = referenceData.detailedSchemes || {};
  const schemeObj =
    schemes[sCode] ||
    (school.code && schemes[school.code]) ||
    (school.admissionCode && schemes[school.admissionCode]);
  const fromScheme = (schemeObj?.majors || []).map((sm, idx) => {
    const id = sm.id || `${sCode.toLowerCase()}-${sm.majorCode || idx + 1}`;
    const cVal = parseMidCutoff(sm.cutoff2024 || sm.cutoff || school.cutoffRange);
    return {
      id: String(id).toLowerCase(),
      schoolId: school.id,
      majorCode: sm.majorCode || sm.code || `${sCode}0${idx + 1}`,
      name: sm.name,
      faculty: sm.faculty || school.group || 'Khoa chuyên ngành',
      blocks: Array.isArray(sm.blocks) ? sm.blocks : ['A00', 'A01', 'D01', 'D07'],
      quota: sm.quota || 180,
      tuitionPerYear: sm.tuitionPerYear || '22 – 32 triệu/năm',
      career: sm.career || 'Chuyên viên, Kỹ sư & Quản lý chuyên ngành tại các tập đoàn trong và ngoài nước',
      note: sm.note || `Đề án tuyển sinh ${school.shortName || school.name}`,
      cutoffs: Array.isArray(sm.cutoffs)
        ? sm.cutoffs
        : [
            { examId: 'THPTQG', year: 2024, score: cVal },
            { examId: 'THPTQG', year: 2025, score: Number(Math.min(29.5, cVal + 0.25).toFixed(2)) },
          ],
    };
  });

  // 3. Lấy từ CUTOFF_DATA (uniCutoffs.js)
  const fromCutoffData = (CUTOFF_DATA || [])
    .filter((c) => validIds.has(String(c.code || '').toUpperCase()))
    .map((c) => ({
      id: c.id,
      schoolId: school.id,
      majorCode: c.majorCode || c.code,
      name: c.major,
      faculty: c.group || school.group || 'Khoa đào tạo',
      blocks: String(c.combo || 'A00')
        .split(/[/,\s]+/)
        .filter((b) => /^[A-Z]\d{2}$/.test(b)),
      quota: c.quota || 200,
      tuitionPerYear: c.tuition || 'Theo quy định',
      career: 'Chuyên gia, Kỹ sư, Bác sĩ / Cử nhân chất lượng cao theo chuẩn ngành',
      note: `Phương thức: ${(c.methods || ['THPTQG']).join(', ')}`,
      cutoffs: [
        ...(c.s2024 != null ? [{ examId: 'THPTQG', year: 2024, score: c.s2024 }] : []),
        ...(c.s2025 != null ? [{ examId: 'THPTQG', year: 2025, score: c.s2025 }] : []),
        ...(c.hsa2025 != null ? [{ examId: 'HSA', year: 2025, score: c.hsa2025 }] : []),
        ...(c.tsa2025 != null ? [{ examId: 'TSA', year: 2025, score: c.tsa2025 }] : []),
        ...(c.vact2025 != null ? [{ examId: 'V-ACT', year: 2025, score: c.vact2025 }] : []),
      ],
    }));

  // Gộp không trùng lặp
  const map = new Map();
  [...direct, ...fromScheme, ...fromCutoffData].forEach((m) => {
    const key = String(m.id || `${m.schoolId}-${m.majorCode}`).toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        ...m,
        blocks: m.blocks?.length ? m.blocks : ['A00', 'A01', 'D01'],
      });
    }
  });

  // 4. Nếu trường có ít hơn 3 ngành chi tiết, tự bổ sung bộ ngành chuẩn theo nhóm trường để mỗi trường có tối thiểu 3-5 ngành
  if (map.size < 3) {
    const mid = parseMidCutoff(school.cutoffRange);
    const templates = pickTemplateBucket(school.group);
    templates.forEach((tpl) => {
      const id = `${String(school.id).toLowerCase()}-${tpl.suffix}`;
      if (map.has(id)) return;
      const score24 = Number(Math.min(29.2, Math.max(16.0, mid + tpl.delta)).toFixed(2));
      const score25 = Number(Math.min(29.4, Math.max(16.5, score24 + 0.25)).toFixed(2));
      map.set(id, {
        id,
        schoolId: school.id,
        majorCode: tpl.code,
        name: tpl.name,
        faculty: school.group || 'Khoa đào tạo đại học',
        blocks: tpl.blocks,
        quota: 180,
        tuitionPerYear: /Sư phạm|Công an|Quân đội/i.test(school.group || '')
          ? 'Miễn 100% học phí theo quy định Nhà nước'
          : '20 – 32 triệu/năm',
        career: tpl.career,
        note: `Tuyển sinh tại ${school.city || 'Toàn quốc'} · ${school.type || 'Công lập'}`,
        cutoffs: [
          { examId: 'THPTQG', year: 2024, score: score24, block: tpl.blocks[0] },
          { examId: 'THPTQG', year: 2025, score: score25, block: tpl.blocks[0] },
        ],
      });
    });
  }

  return Array.from(map.values());
}

export function getMajorsBySchool(schoolId, query = '') {
  if (!schoolId) return [];
  const target = String(schoolId).trim().toUpperCase();
  const school = getSchoolById(target);
  const all = school
    ? buildEnrichedMajorsForSchool(school)
    : (referenceData.majors || []).filter(
        (m) => String(m.schoolId || '').toUpperCase() === target
      );

  const q = normalizeText(query);
  if (!q) return all;
  return all.filter(
    (m) => normalizeText(m.name).includes(q)
      || normalizeText(m.majorCode).includes(q)
      || normalizeText(m.note).includes(q)
      || (m.blocks || []).some((b) => normalizeText(b).includes(q)),
  );
}

export function getMajorById(majorId) {
  if (!majorId) return null;
  const key = String(majorId).trim().toLowerCase();
  const direct = (referenceData.majors || []).find(
    (m) =>
      String(m.id || '').toLowerCase() === key
      || String(m.majorCode || '').toLowerCase() === key
  );
  if (direct) return direct;

  // Tìm trong CUTOFF_DATA hoặc các trường được làm giàu tự động
  for (const sch of getSchools()) {
    const list = buildEnrichedMajorsForSchool(sch);
    const hit = list.find(
      (m) =>
        String(m.id || '').toLowerCase() === key
        || String(m.majorCode || '').toLowerCase() === key
    );
    if (hit) return hit;
  }
  return null;
}

/**
 * Lấy toàn bộ danh mục Ngành × Trường đã hợp nhất (105 trường ĐH, 350+ ngành)
 * để dùng chung cho cả Tra cứu Điểm chuẩn (#admission) lẫn Định hướng Nghề nghiệp (#career)
 */
export function getUnifiedAdmissionCatalog() {
  const rows = [];
  const seen = new Set();

  // 1. Ưu tiên các ngành trọng điểm trong CUTOFF_DATA
  (CUTOFF_DATA || []).forEach((item) => {
    seen.add(item.id);
    const sch = getSchoolById(item.code);
    rows.push({
      ...item,
      schoolId: sch?.id || item.code,
      region: sch?.region || (/TP\.HCM|Cần Thơ/i.test(item.city) ? 'Miền Nam' : /Đà Nẵng|Huế/i.test(item.city) ? 'Miền Trung' : 'Miền Bắc'),
      type: sch?.type || 'Công lập',
    });
  });

  // 2. Bổ sung ngành từ toàn bộ 105 trường trong admissionsReference.json
  for (const sch of getSchools()) {
    const majors = buildEnrichedMajorsForSchool(sch);
    majors.forEach((m) => {
      if (seen.has(m.id)) return;
      seen.add(m.id);
      const c24 = m.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2024)?.score
        ?? m.cutoffs?.find((c) => c.examId === 'THPTQG')?.score
        ?? null;
      const c25 = m.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score
        ?? (c24 != null ? Number(Math.min(29.5, c24 + 0.25).toFixed(2)) : null);
      const hsa = m.cutoffs?.find((c) => c.examId === 'HSA')?.score ?? null;
      const tsa = m.cutoffs?.find((c) => c.examId === 'TSA')?.score ?? null;
      const vact = m.cutoffs?.find((c) => c.examId === 'V-ACT')?.score ?? null;

      const methods = ['THPTQG'];
      if (hsa != null || sch.region === 'Miền Bắc') methods.push('HSA');
      if (tsa != null || /Kỹ thuật|Bách Khoa|Công nghệ/i.test(sch.group || '')) methods.push('TSA');
      if (vact != null || sch.region === 'Miền Nam' || sch.region === 'Miền Trung') methods.push('V-ACT');

      let normalizedGroup = 'Kỹ thuật - Công nghệ';
      if (/Y Dược/i.test(sch.group || '')) normalizedGroup = 'Y - Dược';
      else if (/Kinh tế|Thương mại|Tài chính|Quản/i.test(sch.group || '')) normalizedGroup = 'Kinh tế - Quản trị';
      else if (/Sư phạm|Khoa học cơ bản/i.test(sch.group || '')) normalizedGroup = 'Sư phạm - KHTN';
      else if (/Luật|Ngoại giao|Ngoại ngữ|Báo chí|Xã hội/i.test(sch.group || '')) normalizedGroup = 'Luật - Ngoại giao';
      else if (/Công an|Quân đội/i.test(sch.group || '')) normalizedGroup = 'Công an - Quân đội';

      rows.push({
        id: m.id,
        schoolId: sch.id,
        uni: sch.name,
        code: sch.code || sch.admissionCode,
        majorCode: m.majorCode || '',
        group: normalizedGroup,
        rawGroup: sch.group,
        city: sch.city || 'Hà Nội',
        region: sch.region || 'Miền Bắc',
        type: sch.type || 'Công lập',
        major: m.name,
        combo: (m.blocks || ['A00']).join('/'),
        methods: Array.from(new Set(methods)),
        s2024: c24,
        s2025: c25,
        hsa2025: hsa,
        tsa2025: tsa,
        vact2025: vact,
        tuition: m.tuitionPerYear || 'Theo quy định',
        quota: m.quota || 180,
        career: m.career || '',
        note: m.note || '',
      });
    });
  }

  return rows;
}

/**
 * Lấy điểm chuẩn gần nhất của một ngành theo kỳ thi (hoặc quy đổi tương đương nếu ngành chỉ công bố điểm THPTQG)
 */
export function getCutoffForMajor(majorOrId, examId = 'THPTQG') {
  const major = typeof majorOrId === 'string' ? getMajorById(majorOrId) : majorOrId;
  const meta = getReferenceMetadata();
  if (!major || !Array.isArray(major.cutoffs) || major.cutoffs.length === 0) {
    return { score: null, year: meta.nam, examId, isConverted: false, label: meta.nhanHienThi };
  }
  const direct = major.cutoffs.find((c) => c.examId === examId);
  if (direct) {
    return {
      score: direct.score,
      year: direct.year || meta.nam,
      examId: direct.examId,
      isConverted: false,
      label: `Dữ liệu tham khảo năm ${direct.year || meta.nam}`,
    };
  }
  const baseThpt = major.cutoffs.find((c) => c.examId === 'THPTQG') || major.cutoffs[0];
  const exam = getExamById(examId);
  if (baseThpt && Number.isFinite(baseThpt.score) && exam) {
    const ratio = baseThpt.score / 30;
    const raw = ratio * exam.scale;
    const step = exam.step || 0.25;
    const converted = Math.round(raw / step) * step;
    return {
      score: Number(converted.toFixed(2)),
      year: baseThpt.year || meta.nam,
      examId,
      isConverted: true,
      baseScore: baseThpt.score,
      label: `Quy đổi tham khảo từ chuẩn THPTQG năm ${baseThpt.year || meta.nam}`,
    };
  }
  return { score: null, year: meta.nam, examId, isConverted: false, label: meta.nhanHienThi };
}

/**
 * Đề xuất điểm mục tiêu = Điểm chuẩn gần nhất + biên an toàn (cho phép chỉnh tay bằng slider)
 */
export function suggestTargetScore(majorOrId, examId = 'THPTQG') {
  const exam = getExamById(examId);
  const cutoff = getCutoffForMajor(majorOrId, examId);
  const scale = exam?.scale || 30;
  const step = exam?.step || 0.25;
  const safetyMargin = exam?.safetyMargin ?? (scale === 30 ? 0.5 : scale * 0.03);

  const baseScore = Number.isFinite(cutoff.score) ? cutoff.score : (exam?.defaultTarget || scale * 0.8);
  const rawSuggested = Math.min(scale, baseScore + safetyMargin);
  const suggestedTarget = Number((Math.round(rawSuggested / step) * step).toFixed(2));

  // Điểm mục tiêu môn Hóa (thang 10) tương ứng
  const targetRatio = suggestedTarget / scale;
  const rawChem = Math.min(10, Math.max(5, targetRatio * 10 + 0.25));
  const targetChemScore = Number((Math.round(rawChem * 4) / 4).toFixed(2));

  const minScore = scale === 30 ? 15 : scale === 10 ? 5 : Math.round(scale * 0.4);

  return {
    examId: exam.id,
    scale,
    step,
    min: minScore,
    max: scale,
    cutoffScore: cutoff.score,
    cutoffYear: cutoff.year,
    isConvertedCutoff: cutoff.isConverted,
    referenceLabel: cutoff.label,
    safetyMargin,
    suggestedTarget,
    targetChemScore,
  };
}

/* ============================================================
   2. LỚP TRỪU TƯỢNG LƯU TRỮ (STORAGE ADAPTER) & QUẢN LÝ NGUYỆN VỌNG
   ============================================================ */

let customAdapter = null;

/**
 * Cho phép gắn adapter lưu trữ khác (VD: REST API / Firestore) trong tương lai mà không đổi code UI
 */
export function setAspirationStorageAdapter(adapter) {
  customAdapter = adapter;
}

function storageKey(uid) {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

function readRawState(uid) {
  const key = storageKey(uid);
  try {
    if (customAdapter?.getItem) {
      const val = customAdapter.getItem(key);
      return val ? JSON.parse(val) : null;
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRawState(uid, state) {
  const key = storageKey(uid);
  let ok = false;
  try {
    const serialized = JSON.stringify(state);
    if (customAdapter?.setItem) {
      customAdapter.setItem(key, serialized);
    } else {
      localStorage.setItem(key, serialized);
    }
    ok = true;
  } catch (e) {
    console.warn('[aspirationService] Không ghi được dữ liệu:', e);
  }
  if (ok && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { uid, state } }));
      // Giữ event cũ để các component cũ vẫn tự đồng bộ
      window.dispatchEvent(new Event('cs-aspirations'));
    } catch { /* môi trường test */ }
  }
  return state;
}

export function createDefaultUserState(uid = 'guest') {
  return {
    userId: uid || 'guest',
    selectedExamId: 'THPTQG',
    activeAspirationId: null,
    onboardingCompleted: false,
    weeklyFreeHours: 6,
    examDate: '2026-06-26',
    aspirations: [],
    updatedAt: 0,
  };
}

/**
 * Làm giàu Aspiration với thông tin School, Major, Cutoff để UI dùng trực tiếp
 */
export function hydrateAspiration(asp) {
  if (!asp) return null;
  const schoolId = asp.schoolId || asp.school?.id || asp.school?.code;
  const school = getSchoolById(schoolId) || (asp.school ? { ...asp.school, code: asp.school.code || schoolId || 'ĐH' } : {
    id: schoolId || 'CUSTOM',
    code: asp.schoolCode || schoolId || 'ĐH',
    name: asp.schoolName || 'Trường Đại học',
    city: asp.city || 'Toàn quốc',
    coverColor: '#2f6bff',
    cover: 'linear-gradient(135deg, #2f6bff 0%, #60a5fa 100%)',
  });
  const majorId = asp.majorId || asp.major?.id;
  const major = getMajorById(majorId) || (asp.major ? { ...asp.major } : {
    id: majorId || 'custom-major',
    schoolId: school.id,
    name: asp.majorName || 'Ngành xét tuyển',
    majorCode: asp.majorCode || '',
    blocks: asp.blocks || [asp.block || 'A00'],
    note: asp.note || '',
    cutoffs: Number.isFinite(asp.cutoffScore)
      ? [{ year: referenceData.nam, examId: asp.examId || 'THPTQG', score: asp.cutoffScore }]
      : [],
  });
  const exam = getExamById(asp.examId || 'THPTQG');
  const cutoff = getCutoffForMajor(major, exam.id);
  const suggestion = suggestTargetScore(major, exam.id);

  const targetScore = Number.isFinite(Number(asp.targetScore))
    ? Number(asp.targetScore)
    : suggestion.suggestedTarget;

  const targetChemScore = Number.isFinite(Number(asp.targetChemScore))
    ? Number(asp.targetChemScore)
    : Number(Math.min(10, Math.max(5, Math.round(((targetScore / exam.scale) * 10) * 4) / 4)).toFixed(2));

  return {
    ...asp,
    examId: exam.id,
    exam,
    school,
    major,
    block: asp.block || major.blocks?.[0] || 'A00',
    cutoffScore: cutoff.score,
    cutoffYear: cutoff.year,
    referenceLabel: cutoff.label,
    targetScore,
    targetChemScore,
  };
}

export function getUserAspirationsState(uid) {
  const base = createDefaultUserState(uid);
  const raw = readRawState(uid);
  if (!raw || typeof raw !== 'object') return base;

  const rawList = Array.isArray(raw.aspirations) ? raw.aspirations : [];
  const sorted = rawList
    .slice(0, MAX_ASPIRATIONS)
    .map((item, idx) => hydrateAspiration({ ...item, priority: idx + 1 }))
    .filter(Boolean);

  const activeId = sorted.some((a) => a.id === raw.activeAspirationId)
    ? raw.activeAspirationId
    : (sorted[0]?.id || null);

  return {
    ...base,
    ...raw,
    userId: uid || 'guest',
    selectedExamId: getExamById(raw.selectedExamId || 'THPTQG').id,
    activeAspirationId: activeId,
    aspirations: sorted,
    activeAspiration: sorted.find((a) => a.id === activeId) || sorted[0] || null,
  };
}

/**
 * Thêm mới hoặc cập nhật một nguyện vọng (tối đa 3 nguyện vọng ưu tiên 1..3)
 */
export function upsertAspiration(uid, payload = {}) {
  const cur = getUserAspirationsState(uid);
  const examId = payload.examId || cur.selectedExamId || 'THPTQG';
  const school = getSchoolById(payload.schoolId);
  const major = getMajorById(payload.majorId);

  const id = payload.id || `${school?.id || payload.schoolId || 'sch'}-${major?.id || payload.majorId || Date.now()}`;
  const suggestion = suggestTargetScore(major || payload, examId);

  const targetScore = Number.isFinite(Number(payload.targetScore))
    ? Number(payload.targetScore)
    : suggestion.suggestedTarget;

  const exam = getExamById(examId);
  const targetChemScore = Number.isFinite(Number(payload.targetChemScore))
    ? Number(payload.targetChemScore)
    : Number(Math.min(10, Math.max(5, Math.round(((targetScore / exam.scale) * 10) * 4) / 4)).toFixed(2));

  const existingIdx = cur.aspirations.findIndex(
    (a) => a.id === id || (a.schoolId === payload.schoolId && a.majorId === payload.majorId),
  );

  const record = {
    id,
    userId: uid || 'guest',
    examId,
    schoolId: school?.id || payload.schoolId,
    schoolCode: school?.code || payload.schoolCode,
    schoolName: school?.name || payload.schoolName,
    majorId: major?.id || payload.majorId,
    majorName: major?.name || payload.majorName,
    majorCode: major?.majorCode || payload.majorCode,
    block: payload.block || major?.blocks?.[0] || 'A00',
    targetScore,
    targetChemScore,
    createdAt: existingIdx >= 0 ? cur.aspirations[existingIdx].createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  let nextList = cur.aspirations.map((a) => ({
    id: a.id,
    userId: a.userId,
    examId: a.examId,
    schoolId: a.schoolId,
    schoolCode: a.school?.code,
    schoolName: a.school?.name,
    majorId: a.majorId,
    majorName: a.major?.name,
    majorCode: a.major?.majorCode,
    block: a.block,
    targetScore: a.targetScore,
    targetChemScore: a.targetChemScore,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  if (existingIdx >= 0) {
    nextList[existingIdx] = { ...nextList[existingIdx], ...record };
  } else {
    if (nextList.length >= MAX_ASPIRATIONS) {
      return cur; // Đã đủ 3/3 nguyện vọng
    }
    nextList.push(record);
  }

  nextList = nextList.slice(0, MAX_ASPIRATIONS).map((item, idx) => ({
    ...item,
    priority: idx + 1,
  }));

  const nextState = {
    ...cur,
    selectedExamId: examId,
    activeAspirationId: payload.setActive !== false ? record.id : (cur.activeAspirationId || record.id),
    onboardingCompleted: true,
    aspirations: nextList,
    updatedAt: Date.now(),
  };

  writeRawState(uid, nextState);
  return getUserAspirationsState(uid);
}

/**
 * Xóa một nguyện vọng và tự động đánh số lại thứ tự ưu tiên 1..3
 */
export function deleteAspiration(uid, aspirationId) {
  const cur = getUserAspirationsState(uid);
  const filtered = cur.aspirations
    .filter((a) => a.id !== aspirationId)
    .map((a, idx) => ({
      id: a.id,
      userId: a.userId,
      examId: a.examId,
      schoolId: a.schoolId,
      schoolCode: a.school?.code,
      schoolName: a.school?.name,
      majorId: a.majorId,
      majorName: a.major?.name,
      majorCode: a.major?.majorCode,
      block: a.block,
      targetScore: a.targetScore,
      targetChemScore: a.targetChemScore,
      priority: idx + 1,
      createdAt: a.createdAt,
      updatedAt: Date.now(),
    }));

  const nextActive = filtered.some((a) => a.id === cur.activeAspirationId)
    ? cur.activeAspirationId
    : (filtered[0]?.id || null);

  writeRawState(uid, {
    ...cur,
    activeAspirationId: nextActive,
    aspirations: filtered,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

/**
 * Sắp xếp lại thứ tự ưu tiên nguyện vọng 1..3 (phục vụ kéo-thả hoặc nút đẩy lên NV1)
 */
export function reorderAspirations(uid, orderedIds = []) {
  const cur = getUserAspirationsState(uid);
  const map = new Map(cur.aspirations.map((a) => [a.id, a]));
  const reordered = [];

  orderedIds.forEach((id) => {
    if (map.has(id)) {
      reordered.push(map.get(id));
      map.delete(id);
    }
  });
  map.forEach((a) => reordered.push(a));

  const serialized = reordered.slice(0, MAX_ASPIRATIONS).map((a, idx) => ({
    id: a.id,
    userId: a.userId,
    examId: a.examId,
    schoolId: a.schoolId,
    schoolCode: a.school?.code,
    schoolName: a.school?.name,
    majorId: a.majorId,
    majorName: a.major?.name,
    majorCode: a.major?.majorCode,
    block: a.block,
    targetScore: a.targetScore,
    targetChemScore: a.targetChemScore,
    priority: idx + 1,
    createdAt: a.createdAt,
    updatedAt: Date.now(),
  }));

  writeRawState(uid, {
    ...cur,
    activeAspirationId: serialized[0]?.id || cur.activeAspirationId,
    aspirations: serialized,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function setActiveAspiration(uid, aspirationId) {
  const cur = getUserAspirationsState(uid);
  const hit = cur.aspirations.find((a) => a.id === aspirationId);
  if (!hit) return cur;
  writeRawState(uid, {
    ...cur,
    activeAspirationId: hit.id,
    selectedExamId: hit.examId || cur.selectedExamId,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function setSelectedExam(uid, examId, customTargetScore = null) {
  const cur = getUserAspirationsState(uid);
  const exam = getExamById(examId);
  const updatedAspirations = cur.aspirations.map((a, idx) => {
    const suggestion = suggestTargetScore(a.major, exam.id);
    const nextTarget = (customTargetScore !== null && a.id === cur.activeAspirationId)
      ? Number(customTargetScore)
      : (a.examId === exam.id ? a.targetScore : suggestion.suggestedTarget);
    return {
      id: a.id,
      userId: a.userId,
      examId: exam.id,
      schoolId: a.schoolId,
      schoolCode: a.school?.code,
      schoolName: a.school?.name,
      majorId: a.majorId,
      majorName: a.major?.name,
      majorCode: a.major?.majorCode,
      block: a.block,
      targetScore: nextTarget,
      targetChemScore: suggestion.targetChemScore,
      priority: idx + 1,
      createdAt: a.createdAt,
      updatedAt: Date.now(),
    };
  });

  writeRawState(uid, {
    ...cur,
    selectedExamId: exam.id,
    aspirations: updatedAspirations,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function updateUserSettings(uid, partial = {}) {
  const cur = getUserAspirationsState(uid);
  const rawAspirations = cur.aspirations.map((a, idx) => ({
    id: a.id,
    userId: a.userId,
    examId: a.examId,
    schoolId: a.schoolId,
    schoolCode: a.school?.code,
    schoolName: a.school?.name,
    majorId: a.majorId,
    majorName: a.major?.name,
    majorCode: a.major?.majorCode,
    block: a.block,
    targetScore: a.targetScore,
    targetChemScore: a.targetChemScore,
    priority: idx + 1,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  writeRawState(uid, {
    ...cur,
    ...partial,
    aspirations: rawAspirations,
    updatedAt: Date.now(),
  });
  return getUserAspirationsState(uid);
}

export function subscribeAspirationChanges(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/* ============================================================
   3. MÔ HÌNH PROGRESS (ĐIỂM DỰ ĐOÁN, TRẠNG THÁI, LỊCH SỬ ELO THEO NGÀY)
   ============================================================ */

function isoDay(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Xây dựng lịch sử Elo & Điểm dự đoán theo ngày từ chuỗi sự kiện làm bài thực tế
 */
export function buildDailyEloHistory(events = [], { scale = 30, targetScore = 25.5, days = 14, now = Date.now() } = {}) {
  const validEvents = (events || [])
    .filter((e) => e && Number.isFinite(e.at))
    .sort((a, b) => a.at - b.at);

  const byDate = new Map();
  validEvents.forEach((e) => {
    const k = isoDay(e.at);
    const cur = byDate.get(k) || { total: 0, correct: 0 };
    cur.total += 1;
    if (e.ok || e.correct) cur.correct += 1;
    byDate.set(k, cur);
  });

  const history = [];
  let runningTotal = 0;
  let runningCorrect = 0;
  let currentElo = 1000;

  // Tính lũy kế trước cửa sổ `days` ngày
  const startWindowTs = now - (days - 1) * DAY_MS;
  const startWindowKey = isoDay(startWindowTs);

  byDate.forEach((val, dateKey) => {
    if (dateKey < startWindowKey) {
      runningTotal += val.total;
      runningCorrect += val.correct;
      const acc = runningCorrect / Math.max(1, runningTotal);
      currentElo = Math.round(1000 + acc * 800 + Math.min(80, Math.sqrt(runningTotal) * 4));
    }
  });

  const baselineScore = runningTotal > 0
    ? (runningCorrect / runningTotal) * scale
    : scale * 0.55;

  for (let i = 0; i < days; i += 1) {
    const dayTs = startWindowTs + i * DAY_MS;
    const dateKey = isoDay(dayTs);
    const bucket = byDate.get(dateKey);

    if (bucket) {
      runningTotal += bucket.total;
      runningCorrect += bucket.correct;
      const acc = runningCorrect / Math.max(1, runningTotal);
      currentElo = Math.round(1000 + acc * 800 + Math.min(80, Math.sqrt(runningTotal) * 4));
    }

    const predictedScore = runningTotal > 0
      ? Number(((runningCorrect / runningTotal) * scale).toFixed(2))
      : null;

    // Đường lý tưởng tăng tuyến tính từ điểm xuất phát tới điểm mục tiêu
    const progressRatio = (i + 1) / days;
    const idealScore = Number((baselineScore + (targetScore - baselineScore) * progressRatio).toFixed(2));

    history.push({
      date: dateKey,
      label: dateKey.slice(8, 10) + '/' + dateKey.slice(5, 7),
      elo: runningTotal > 0 ? currentElo : null,
      predictedScore,
      idealScore,
      answersCount: bucket ? bucket.total : 0,
    });
  }

  return history;
}

/**
 * Tính toán thực thể Progress chuẩn Giai đoạn 1:
 *   - predictedScore (điểm dự đoán theo thang kỳ thi đang chọn)
 *   - targetScore (điểm mục tiêu của nguyện vọng đang chọn)
 *   - scoreGap (chênh lệch điểm)
 *   - status ('Vượt tiến độ' | 'Đúng tiến độ' | 'Cần tăng tốc' | 'Chưa có dữ liệu')
 *   - elo & eloHistory (lịch sử Elo theo ngày)
 */
export function computeStudentProgress(uidOrOptions, options = {}) {
  let uid, overview, events, now;
  if (typeof uidOrOptions === 'object' && uidOrOptions !== null) {
    uid = uidOrOptions.uid;
    overview = uidOrOptions.overview || {};
    events = uidOrOptions.events || [];
    now = uidOrOptions.now || Date.now();
  } else {
    uid = uidOrOptions;
    overview = options.overview || {};
    events = options.events || [];
    now = options.now || Date.now();
  }

  const userState = getUserAspirationsState(uid);
  const active = userState.activeAspiration;
  const exam = getExamById(active?.examId || userState.selectedExamId || 'THPTQG');
  const scale = exam?.scale || 30;
  const step = exam?.step || 0.25;

  const targetScore = active?.targetScore ?? exam?.defaultTarget ?? (scale * 0.8);
  const targetChemScore = active?.targetChemScore ?? 8.5;

  const rawMastery = overview?.avgMastery ?? overview?.accuracy ?? (overview?.hasEvidence ? 55 : null);
  const validMastery = rawMastery !== null && rawMastery !== undefined && Number.isFinite(Number(rawMastery))
    ? Number(rawMastery)
    : null;
  const hasEvidence = Boolean(overview?.hasEvidence && validMastery !== null);
  const masteryRatio = hasEvidence ? (validMastery / 100) : null;

  const predictedChemScore = masteryRatio !== null
    ? Number((Math.round(masteryRatio * 10 * 4) / 4).toFixed(2))
    : null;

  const rawPredicted = masteryRatio !== null ? masteryRatio * scale : null;
  const predictedScore = rawPredicted !== null
    ? Number((Math.round(rawPredicted / step) * step).toFixed(2))
    : null;

  // Chênh lệch giữa điểm dự đoán và điểm mục tiêu (dương = vượt, âm = còn thiếu)
  const scoreDiff = predictedScore !== null
    ? Number((predictedScore - targetScore).toFixed(2))
    : null;

  // Khoảng cách cần bù đắp (target - predicted)
  const scoreGap = predictedScore !== null
    ? Number((targetScore - predictedScore).toFixed(2))
    : null;

  // Ngưỡng 1 điểm trên thang 30 (tương đương 3.33% thang điểm bất kỳ)
  const threshold = scale === 30 ? 1.0 : Number((scale / 30).toFixed(2));

  let status = 'Chưa có dữ liệu';
  let statusTone = 'muted';
  if (predictedScore !== null) {
    if (scoreGap <= -threshold * 0.5) {
      status = 'Vượt tiến độ';
      statusTone = 'ok';
    } else if (scoreGap >= threshold) {
      status = 'Cần tăng tốc';
      statusTone = 'warn';
    } else {
      status = 'Đúng tiến độ';
      statusTone = 'info';
    }
  }

  const totalAnswers = overview?.totalAnswers || (events || []).length || 0;
  const elo = hasEvidence
    ? Math.round(1000 + (overview.avgMastery * 8) + Math.min(80, Math.sqrt(totalAnswers) * 4))
    : null;

  const eloHistory = buildDailyEloHistory(events, {
    scale,
    targetScore,
    days: 14,
    now,
  });

  return {
    exam,
    activeAspiration: active,
    aspirations: userState.aspirations,
    predictedScore,
    predictedChemScore,
    targetScore,
    targetChemScore,
    scoreDiff,
    scoreGap,
    status,
    statusTone,
    elo,
    eloHistory,
    hasEvidence,
    referenceMeta: getReferenceMetadata(),
  };
}

export const getAspirationProfile = getUserAspirationsState;

export function recordAttemptScore(uid, score) {
  const cur = getUserAspirationsState(uid);
  const next = {
    ...cur,
    lastAttemptScore: score,
    updatedAt: Date.now(),
  };
  return writeRawState(uid, next);
}

/**
 * Lấy Đề án tuyển sinh chi tiết của một trường Đại học (hỗ trợ cả 10 trường trọng điểm và 95+ trường sơ bộ)
 */
export function getDetailedAdmissionScheme(schoolIdOrCode) {
  if (!schoolIdOrCode) return null;
  const key = String(schoolIdOrCode).trim().toUpperCase();
  const schemes = referenceData.detailedSchemes || {};

  const school = getSchoolById(key);
  const uniInfo = getUniversityInfo(school?.id || key);
  const localCover = getUniversityCover(school?.id || key);

  const defaultSections = [
    { id: 'overview-quick', title: 'Tổng quan nhanh' },
    { id: 'intro-history', title: 'Giới thiệu và lịch sử' },
    { id: 'admissions-2026', title: 'Đề án tuyển sinh 2026' },
    { id: 'major-training', title: 'Ngành đào tạo & Tổ hợp' },
    { id: 'student-notes', title: 'Thế mạnh & Lưu ý thí sinh' },
    { id: 'tuition-fees', title: 'Chi phí và học phí' },
  ];

  const isPedagogy = /Sư phạm/i.test(school?.group || uniInfo?.group || '');
  const isMilitaryPolice = /Công an|Quân đội/i.test(school?.group || uniInfo?.group || '');
  const isMedical = /Y Dược/i.test(school?.group || uniInfo?.group || '');

  const groupTuition = isPedagogy
    ? {
        standard: 'Miễn 100% học phí và hỗ trợ sinh hoạt phí 3.63 triệu đồng/tháng theo Nghị định 116/2020/NĐ-CP cho sinh viên khối ngành Sư phạm.',
        advanced: 'Các ngành ngoài sư phạm thu theo quy định Nhà nước (khoảng 15 – 24 triệu đồng/năm học).',
        scholarships: 'Học bổng Khuyến khích học tập hàng kỳ, học bổng tài năng sư phạm và quỹ hỗ trợ sinh viên vượt khó.',
        dormitory: uniInfo?.dormitory || 'Ký túc xá trong khuôn viên trường với chi phí ưu đãi 400.000 – 800.000đ/tháng.',
      }
    : isMilitaryPolice
      ? {
          standard: 'Miễn 100% học phí, Nhà nước bảo đảm toàn bộ tiền ăn, ở nội trú, quân trang và cấp phụ cấp sinh hoạt hàng tháng.',
          advanced: '100% học viên tốt nghiệp được Bộ Công an / Bộ Quốc phòng phân công công tác và phong cấp bậc hàm sĩ quan.',
          scholarships: 'Chế độ khen thưởng học viên giỏi, xuất sắc và phụ cấp nghiên cứu khoa học theo quy định ngành.',
          dormitory: uniInfo?.dormitory || '100% học viên ở nội trú tập trung theo chế độ điều lệnh.',
        }
      : isMedical
        ? {
            standard: 'Khoảng 27.6 – 55.2 triệu đồng/năm học (tùy chuyên ngành Y khoa, Răng Hàm Mặt, Dược học hoặc Điều dưỡng/Kỹ thuật Y học).',
            advanced: 'Khoảng 55 – 84.7 triệu đồng/năm học đối với các chương trình tự chủ hoặc tăng cường ngoại ngữ.',
            scholarships: 'Quỹ học bổng khuyến khích học tập tối thiểu 8% nguồn thu học phí, học bổng doanh nghiệp dược phẩm & bệnh viện.',
            dormitory: uniInfo?.dormitory || 'Ký túc xá sinh viên Y Dược gần các bệnh viện thực hành tuyến trung ương.',
          }
        : {
            standard: 'Khoảng 18 – 30 triệu đồng/năm học (tương đương 550.000 – 950.000đ/tín chỉ theo lộ trình tự chủ của trường công lập).',
            advanced: 'Khoảng 38 – 65 triệu đồng/năm học đối với chương trình Chất lượng cao, Tiên tiến hoặc Liên kết quốc tế.',
            scholarships: 'Học bổng Tân sinh viên Thủ khoa/Á khoa (50% – 100% học phí), học bổng khuyến khích học tập loại Giỏi/Xuất sắc và học bổng doanh nghiệp đối tác.',
            dormitory: uniInfo?.dormitory || 'Hệ thống Ký túc xá sinh viên hiện đại trong khuôn viên hoặc khu đô thị đại học.',
          };

  // 1. Kiểm tra nếu có đề án chi tiết sẵn
  const rawScheme =
    schemes[key] ||
    (school
      ? schemes[school.id] ||
        schemes[school.code] ||
        (school.admissionCode && schemes[school.admissionCode])
      : null);

  if (rawScheme) {
    return {
      ...rawScheme,
      schoolId: rawScheme.schoolId || rawScheme.universityId || school?.id || key,
      schoolName: rawScheme.schoolName || rawScheme.name || school?.name || 'Trường Đại học',
      admissionCode: rawScheme.admissionCode || rawScheme.code || school?.admissionCode || school?.code || key,
      yearPlan: rawScheme.yearPlan || rawScheme.planYear || 2026,
      cutoffRange: rawScheme.cutoffRange || school?.cutoffRange || '21.00 – 28.50',
      totalMajors: rawScheme.totalMajors || school?.totalMajors || (Array.isArray(rawScheme.majors) ? rawScheme.majors.length : 30),
      creditsPerYear: rawScheme.creditsPerYear || school?.creditsPerYear || 34,
      cover: localCover,
      website: rawScheme.website || school?.website || uniInfo?.website || 'https://moet.gov.vn',
      foundedYear: uniInfo?.foundedYear || 1960,
      studentScale: uniInfo?.studentScale || '18.000+ sinh viên',
      employmentRate: uniInfo?.employmentRate || '97.5% có việc làm sau 12 tháng',
      type: school?.type || uniInfo?.type || 'Công lập',
      region: school?.region || uniInfo?.region || 'Miền Bắc',
      group: school?.group || uniInfo?.group || 'Đa ngành',
      city: school?.city || uniInfo?.city || 'Hà Nội',
      highlights: uniInfo?.highlights || [],
      sections: defaultSections,
      stats: rawScheme.stats || [
        { label: 'Năm đề án', value: String(rawScheme.yearPlan || rawScheme.planYear || 2026) },
        { label: 'Ngành đào tạo', value: String(rawScheme.totalMajors || school?.totalMajors || 32) },
        { label: 'Tín chỉ/năm', value: String(rawScheme.creditsPerYear || school?.creditsPerYear || 34) },
        { label: 'Điểm chuẩn THPT', value: rawScheme.cutoffRange || school?.cutoffRange || '21.00 – 28.50' },
      ],
      bannerNotice:
        rawScheme.bannerNotice ||
        `Điểm chuẩn trúng tuyển năm gần nhất dao động trong khoảng ${rawScheme.cutoffRange || school?.cutoffRange || '21.00 – 28.50'} điểm.`,
      virtualExamCta: rawScheme.virtualExamCta || 'Thi thử tại Phòng thi ảo →',
      intro:
        rawScheme.intro ||
        school?.admissionNote ||
        `${school?.name || rawScheme.schoolName} là cơ sở giáo dục đại học trọng điểm, uy tín hàng đầu Việt Nam.`,
      methods: rawScheme.methods || (rawScheme.admissionMethods || []).map((m) => ({
        code: m.code,
        name: m.name,
        quotaPercent: m.quotaPercent || m.quotaPct || '—',
        desc: m.desc,
      })),
      tuition: {
        standard: rawScheme.tuition?.standard || rawScheme.tuitionAndScholarships?.standardTuition || groupTuition.standard,
        advanced: rawScheme.tuition?.advanced || rawScheme.tuitionAndScholarships?.advancedTuition || groupTuition.advanced,
        scholarships: rawScheme.tuition?.scholarships || rawScheme.tuitionAndScholarships?.scholarshipFund || groupTuition.scholarships,
        dormitory: uniInfo?.dormitory || groupTuition.dormitory,
      },
      contact: {
        address: uniInfo?.location || rawScheme.contact?.address || rawScheme.address || school?.city || 'Việt Nam',
        hotline: uniInfo?.hotline || rawScheme.contact?.hotline || rawScheme.hotline || '024 / 028 · Phòng Tuyển sinh',
        email: uniInfo?.email || rawScheme.contact?.email || rawScheme.email || 'tuyensinh@edu.vn',
        website: rawScheme.website || school?.website || uniInfo?.website || 'https://moet.gov.vn',
      },
    };
  }
  if (!school) return null;

  // 2. Tạo đề án chuẩn hóa giàu thông tin cho trường
  return {
    schoolId: school.id,
    schoolName: school.name,
    admissionCode: school.admissionCode || school.code,
    yearPlan: school.yearPlan || 2026,
    totalMajors: school.totalMajors || 30,
    creditsPerYear: school.creditsPerYear || 33,
    cutoffRange: school.cutoffRange || '18.00 – 26.00',
    cover: localCover,
    website: school.website || uniInfo?.website || 'https://moet.gov.vn',
    foundedYear: uniInfo?.foundedYear || 1975,
    studentScale: uniInfo?.studentScale || '14.000+ sinh viên',
    employmentRate: uniInfo?.employmentRate || '96.2% có việc làm sau 12 tháng',
    type: school.type || uniInfo?.type || 'Công lập',
    region: school.region || uniInfo?.region || 'Miền Bắc',
    group: school.group || uniInfo?.group || 'Đa ngành',
    city: school.city || uniInfo?.city || 'Hà Nội',
    highlights: uniInfo?.highlights || [],
    sections: defaultSections,
    stats: [
      { label: 'Năm đề án', value: String(school.yearPlan || 2026) },
      { label: 'Ngành đào tạo', value: String(school.totalMajors || 30) },
      { label: 'Tín chỉ/năm', value: String(school.creditsPerYear || 33) },
      { label: 'Điểm 2025 THPT', value: school.cutoffRange || '18.00 – 26.00' },
    ],
    bannerNotice: `Điểm chuẩn trúng tuyển dao động trong khoảng ${school.cutoffRange || '18.00 – 26.00'} điểm.`,
    virtualExamCta: 'Thi thử tại Phòng thi ảo →',
    intro: school.admissionNote || `${school.name} (${school.city}) — trường đại học ${school.type || 'công lập'} uy tín thuộc nhóm ngành ${school.group || 'Đa ngành'}.`,
    methods: [
      {
        code: 'PT1',
        name: 'Xét tuyển theo kết quả thi tốt nghiệp THPT 2026',
        quotaPercent: '50% – 65%',
        desc: 'Xét tuyển theo các tổ hợp truyền thống A00, A01, B00, C00, D01, D07 và các tổ hợp mới GDPT 2018 (Tin học, Công nghệ, KT&PL).',
      },
      {
        code: 'PT2',
        name: 'Xét tuyển theo điểm thi Đánh giá năng lực & Đánh giá tư duy (HSA / V-ACT / TSA / SPT)',
        quotaPercent: '20% – 30%',
        desc: 'Sử dụng kết quả kỳ thi ĐGNL của ĐHQGHN (HSA), ĐHQG TP.HCM (V-ACT), ĐGTD ĐHBK Hà Nội (TSA) hoặc ĐGNL Sư phạm.',
      },
      {
        code: 'PT3',
        name: 'Xét tuyển kết hợp Chứng chỉ Ngoại ngữ quốc tế (IELTS / TOEFL / SAT) & Học bạ THPT',
        quotaPercent: '10% – 20%',
        desc: 'Thí sinh có IELTS từ 5.5 trở lên được quy đổi điểm môn Tiếng Anh hoặc cộng điểm ưu tiên xét tuyển theo quy chế riêng của trường.',
      },
      {
        code: 'PT4',
        name: 'Xét tuyển thẳng & Ưu tiên xét tuyển theo quy chế Bộ GD&ĐT',
        quotaPercent: '2% – 5%',
        desc: 'Thí sinh đạt giải Nhất, Nhì, Ba kỳ thi Học sinh giỏi Quốc gia, Khoa học kỹ thuật cấp Quốc gia hoặc học sinh trường chuyên.',
      },
    ],
    tuition: groupTuition,
    contact: {
      address: uniInfo?.location || `${school.city}, Việt Nam`,
      hotline: uniInfo?.hotline || '024 / 028 · Phòng Đào tạo & Tuyển sinh',
      email: uniInfo?.email || 'tuyensinh@' + (school.website ? school.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : 'edu.vn'),
      website: school.website || uniInfo?.website || 'https://moet.gov.vn',
    },
  };
}

/**
 * Lọc danh sách trường Đại học theo Miền, Nhóm ngành và Từ khóa
 */
export function filterSchoolsAdvanced({ region = 'all', group = 'all', query = '' } = {}) {
  const all = getSchools();
  const q = normalizeText(query);
  return all.filter((s) => {
    if (region !== 'all' && s.region !== region) return false;
    if (group !== 'all' && s.group !== group) return false;
    if (q) {
      const match = normalizeText(s.name).includes(q)
        || normalizeText(s.code).includes(q)
        || normalizeText(s.admissionCode).includes(q)
        || normalizeText(s.city).includes(q)
        || normalizeText(s.shortName).includes(q);
      if (!match) return false;
    }
    return true;
  });
}
