import fs from 'fs';
const p = 'src/lib/studyPlan.js';
let s = fs.readFileSync(p, 'utf8');

/* 1. Ngan sach moi ngay khong duoc nho hon mot phien toi thieu (25'),
      neu khong se khong xep duoc viec nao va bao "bat kha thi" sai. */
s = s.replace(
  'const budget = Math.max(10, Math.min(minutesPerDay, Math.round(totalNeed / Math.max(1, studyDays.length))));',
  'const budget = Math.max(25, Math.min(minutesPerDay, Math.round(totalNeed / Math.max(1, studyDays.length))));',
);

/* 2. Kha thi = tong nhu cau lot vao tong quy thoi gian, khong phu thuoc vao
      viec con sot bao nhieu phut le (truoc day bao sai "khong du thoi gian"). */
s = s.replace(
  'const feasible = leftMinutes <= 0 && totalNeed <= capacity;',
  'const feasible = totalNeed <= capacity && planned >= totalNeed - 5;',
);

fs.writeFileSync(p, s);
console.log('budget>=25:', s.includes('Math.max(25'), '| feasible fixed:', s.includes('planned >= totalNeed - 5'));
