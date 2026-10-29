import fs from 'fs';
const p = 'src/components/roadmap/StudyPlanCard.jsx';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  '<div><small>Còn lại</small><b>{plan.stats.days} ngày</b></div>',
  '<div><small>Ngày học</small><b>{plan.stats.days} ngày</b></div>',
);
var hint = '            <span className="rm-muted sm">Ngày không hiện trong danh sách = ngày nghỉ hoặc không còn việc.</span>\n            {plan.unplaced && plan.unplaced.length > 0 && (';
if (s.indexOf('Ngày không hiện trong danh sách') === -1) {
  s = s.replace('            {plan.unplaced && plan.unplaced.length > 0 && (', hint);
}
fs.writeFileSync(p, s);
console.log('label:', s.indexOf('<small>Ngày học</small>') >= 0, '| hint:', s.indexOf('Ngày không hiện') >= 0);
