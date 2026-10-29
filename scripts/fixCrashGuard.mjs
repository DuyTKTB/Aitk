import fs from 'fs';

// 1. Vá aspirationService.js
let as = fs.readFileSync('src/lib/aspirationService.js', 'utf8');

// Cập nhật getSchoolById
const robustGetSchool = `export function getSchoolById(schoolId) {
  if (!schoolId) return null;
  const key = String(schoolId).trim().toUpperCase();
  const all = getSchools();
  return all.find((s) =>
    String(s.id || '').toUpperCase() === key
    || String(s.code || '').toUpperCase() === key
    || String(s.admissionCode || '').toUpperCase() === key
    || String(s.altCode || '').toUpperCase() === key
  ) || null;
}`;

as = as.replace(/export function getSchoolById\([^\)]*\)\s*\{[\s\S]*?\n\}/, robustGetSchool);

// Cập nhật getMajorById
const robustGetMajor = `export function getMajorById(majorId) {
  if (!majorId) return null;
  const key = String(majorId).trim().toLowerCase();
  const all = referenceData.majors || [];
  return all.find((m) =>
    String(m.id || '').toLowerCase() === key
    || String(m.majorCode || '').toLowerCase() === key
  ) || null;
}`;

as = as.replace(/export function getMajorById\([^\)]*\)\s*\{[\s\S]*?\n\}/, robustGetMajor);

fs.writeFileSync('src/lib/aspirationService.js', as, 'utf8');
console.log('✓ Fixed getSchoolById and getMajorById in aspirationService.js');

// 2. Vá Home.jsx (Bảo vệ PersonalAiHero)
let home = fs.readFileSync('src/components/Home.jsx', 'utf8');

// Thay thế dòng dễ crash trong PersonalAiHero
home = home.replace(
  `<b>{activeAsp.school.code} · {activeAsp.school.name}</b>`,
  `<b>{activeAsp?.school?.code || 'ĐH'} · {activeAsp?.school?.name || 'Trường Đại học'}</b>`
);

home = home.replace(
  `<small>Ngành {activeAsp.major.name.replace(/^ngành\\s+/i, '')} · Tổ hợp {activeAsp.block} · Mục tiêu {activeAsp.targetScore}đ</small>`,
  `<small>Ngành {(activeAsp?.major?.name || 'Ngành xét tuyển').replace(/^ngành\\s+/i, '')} · Tổ hợp {activeAsp?.block || 'A00'} · Mục tiêu {activeAsp?.targetScore ?? 24}đ</small>`
);

home = home.replace(
  `Nguyện vọng 1: \${asp.school.code} - \${asp.school.name} (\${asp.major.name}), Điểm mục tiêu \${asp.targetScore}/\${rmData.examScale} (Môn Hóa cần đạt \${rmData.targetChem10}/10).`,
  `Nguyện vọng 1: \${asp?.school?.code || 'ĐH'} - \${asp?.school?.name || 'Trường Đại học'} (\${asp?.major?.name || 'Ngành xét tuyển'}), Điểm mục tiêu \${asp?.targetScore ?? 24}/\${rmData.examScale} (Môn Hóa cần đạt \${rmData.targetChem10}/10).`
);

fs.writeFileSync('src/components/Home.jsx', home, 'utf8');
console.log('✓ Fixed optional chaining in Home.jsx');

// 3. Vá StudyGoalNavDropdown.jsx
let sg = fs.readFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', 'utf8');

sg = sg.replace(
  /\`Mục tiêu học tập: \$\{activeExam\.name\}, trường \$\{activeAsp \? activeAsp\.school\.code : 'chưa chọn'\}\`/g,
  "`Mục tiêu học tập: ${activeExam?.name || 'Kỳ thi'}, trường ${activeAsp?.school?.code || 'chưa chọn'}`"
);

sg = sg.replace(
  `<b>{activeAsp ? activeAsp.school.code : 'Chọn NV'}</b>`,
  `<b>{activeAsp?.school?.code || 'Chọn NV'}</b>`
);

sg = sg.replace(
  `<span>Đề án tuyển sinh {activeAsp.school.code}</span>`,
  `<span>Đề án tuyển sinh {activeAsp?.school?.code || 'trường'}</span>`
);

sg = sg.replace(
  `setSelectedSchoolId(activeAsp.school.code || activeAsp.school.id);`,
  `setSelectedSchoolId(activeAsp?.school?.code || activeAsp?.school?.id || 'NEU');`
);

sg = sg.replace(
  `<b>{activeAsp.school.name}</b> ({activeAsp.school.city}) — Ngành{' '}`,
  `<b>{activeAsp?.school?.name || 'Trường Đại học'}</b> ({activeAsp?.school?.city || 'Việt Nam'}) — Ngành{' '}`
);

sg = sg.replace(
  `<b>{activeAsp.major.name}</b> (Mã: <code>{activeAsp.major.majorCode}</code>).`,
  `<b>{activeAsp?.major?.name || 'Ngành xét tuyển'}</b> (Mã: <code>{activeAsp?.major?.majorCode || ''}</code>).`
);

sg = sg.replace(
  `{(activeAsp.major.blocks || []).join(', ')}`,
  `{(activeAsp?.major?.blocks || ['A00']).join(', ')}`
);

fs.writeFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', sg, 'utf8');
console.log('✓ Fixed optional chaining in StudyGoalNavDropdown.jsx');
