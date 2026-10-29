import fs from 'fs';

let code = fs.readFileSync('src/lib/aspirationService.js', 'utf8');

const helpers = `
/**
 * Lấy Đề án tuyển sinh chi tiết của một trường Đại học (hỗ trợ cả 10 trường trọng điểm và 95+ trường sơ bộ)
 */
export function getDetailedAdmissionScheme(schoolIdOrCode) {
  if (!schoolIdOrCode) return null;
  const key = String(schoolIdOrCode).trim().toUpperCase();
  const schemes = referenceData.detailedSchemes || {};
  
  // 1. Kiểm tra nếu có đề án chi tiết sẵn
  if (schemes[key]) return schemes[key];
  
  // Tìm theo school
  const school = getSchools().find((s) => s.id === key || s.code === key || s.admissionCode === key || s.altCode === key);
  if (!school) return null;
  
  if (schemes[school.id]) return schemes[school.id];
  if (schemes[school.code]) return schemes[school.code];
  if (school.admissionCode && schemes[school.admissionCode]) return schemes[school.admissionCode];

  // 2. Tạo đề án sơ bộ chuẩn hóa cho trường
  return {
    schoolId: school.id,
    schoolName: school.name,
    admissionCode: school.admissionCode || school.code,
    yearPlan: school.yearPlan || 2026,
    totalMajors: school.totalMajors || 30,
    creditsPerYear: school.creditsPerYear || 33,
    cutoffRange: school.cutoffRange || '18.00 – 26.00',
    cover: school.cover || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    website: school.website || 'https://moet.gov.vn',
    sections: [
      { id: 'overview-quick', title: 'Tổng quan nhanh' },
      { id: 'intro-history', title: 'Giới thiệu và lịch sử' },
      { id: 'admissions-2026', title: 'Ngành tuyển sinh 2026' },
      { id: 'major-training', title: 'Ngành đào tạo' },
      { id: 'student-notes', title: 'Lưu ý học sinh' },
      { id: 'tuition-fees', title: 'Chi phí và học phí' },
    ],
    stats: [
      { label: 'Năm đề án', value: String(school.yearPlan || 2026) },
      { label: 'Ngành đào tạo', value: String(school.totalMajors || 30) },
      { label: 'Tín chỉ/năm', value: String(school.creditsPerYear || 33) },
      { label: 'Điểm 2025 THPT', value: school.cutoffRange || '18.00 – 26.00' },
    ],
    bannerNotice: \`Điểm chuẩn trúng tuyển dao động trong khoảng \${school.cutoffRange || '18.00 – 26.00'} điểm.\`,
    virtualExamCta: 'Thi thử tại Phòng thi ảo →',
    intro: school.admissionNote || \`\${school.name} (\${school.city}) — trường đại học \${school.type || 'công lập'} uy tín thuộc nhóm ngành \${school.group || 'Đa ngành'}.\`,
    methods: [
      {
        code: 'PT1',
        name: 'Xét tuyển theo kết quả thi tốt nghiệp THPT 2026',
        quotaPercent: '50% – 60%',
        desc: 'Xét tuyển theo các tổ hợp truyền thống A00, A01, B00, C00, D01, D07 tùy ngành.',
      },
      {
        code: 'PT2',
        name: 'Xét tuyển theo điểm thi Đánh giá năng lực (HSA / V-ACT / TSA)',
        quotaPercent: '20% – 30%',
        desc: 'Sử dụng điểm thi ĐGNL của ĐHQGHN, ĐHQG TP.HCM hoặc ĐH Bách Khoa Hà Nội.',
      },
      {
        code: 'PT3',
        name: 'Xét tuyển học bạ THPT & Chứng chỉ ngoại ngữ',
        quotaPercent: '15% – 20%',
        desc: 'Kết hợp kết quả học tập THPT 3 năm với chứng chỉ IELTS/TOEFL hoặc giải HSG cấp tỉnh.',
      },
      {
        code: 'PT4',
        name: 'Xét tuyển thẳng theo quy chế Bộ GD&ĐT',
        quotaPercent: '2% – 5%',
        desc: 'Thí sinh đạt giải Nhất, Nhì, Ba HSG Quốc gia, KHKT Quốc gia.',
      },
    ],
    tuition: {
      standard: 'Khoảng 15 – 25 triệu đồng/năm học (áp dụng theo quy định Nhà nước đối với trường công lập)',
      advanced: 'Khoảng 35 – 50 triệu đồng/năm học đối với chương trình chất lượng cao/liên kết',
      scholarships: 'Nhiều suất học bổng khuyến khích học tập cho tân sinh viên thủ khoa, á khoa và sinh viên có hoàn cảnh khó khăn.',
    },
    contact: {
      address: school.city + ', Việt Nam',
      hotline: 'Tuyển sinh trực tuyến',
      email: 'tuyensinh@' + (school.website ? school.website.replace(/^https?:\\/\\//, '') : 'edu.vn'),
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
`;

code = code.trim() + '\n\n' + helpers.trim() + '\n';
fs.writeFileSync('src/lib/aspirationService.js', code, 'utf8');
console.log('Appended detailed admission scheme helpers to aspirationService.js');
