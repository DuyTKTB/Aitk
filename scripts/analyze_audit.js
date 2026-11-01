import fs from 'fs';

const reportPath = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence/audit_raw_report.json';
const data = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

console.log('Total issues:', data.issues.length);
console.log('Console errors:', data.consoleLogs.length);
console.log('Network errors:', data.networkErrors.length);

const bySeverity = {};
const byType = {};
data.issues.forEach(i => {
  bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
  byType[i.type] = (byType[i.type] || 0) + 1;
});

console.log('By Severity:', bySeverity);
console.log('By Type:', byType);

console.log('\n--- ALL UNIQUE ISSUES GROUPED ---');
const grouped = {};
data.issues.forEach(i => {
  const key = `${i.type} | ${i.page} | ${i.description.slice(0, 60)}`;
  if (!grouped[key]) {
    grouped[key] = {
      ...i,
      devices: [i.device],
    };
  } else {
    if (!grouped[key].devices.includes(i.device)) {
      grouped[key].devices.push(i.device);
    }
  }
});

console.log('Unique grouped issues:', Object.keys(grouped).length);
Object.values(grouped).forEach((item, idx) => {
  console.log(`\n#${idx + 1} [${item.severity}] [${item.type}] [${item.page}] Devices: ${item.devices.join(', ')}`);
  console.log(`   Mô tả: ${item.description}`);
  console.log(`   Tái hiện: ${item.reproduce}`);
  console.log(`   Bằng chứng: ${item.evidence}`);
  console.log(`   Gợi ý sửa: ${item.fixRecommendation}`);
});
