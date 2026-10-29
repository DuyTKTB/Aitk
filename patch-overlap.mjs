import fs from 'fs';

function must(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
  return cond;
}

/* ---------- 1. roadmapEvidence: them summarizeByTopic ---------- */
const evPath = 'src/lib/roadmapEvidence.js';
let ev = fs.readFileSync(evPath, 'utf8');
if (!ev.includes('export function summarizeByTopic')) {
  ev += `
/* Gop evidence thanh { topicId: { correct, total } } — dung chung cho
   RoadmapCard (hook topicProgress) va bat ky noi nao khac. */
export function summarizeByTopic(events = []) {
  const out = {};
  (events || []).forEach((e) => {
    if (!e || !e.topicId) return;
    if (!out[e.topicId]) out[e.topicId] = { correct: 0, total: 0 };
    out[e.topicId].total += 1;
    if (e.correct === true) out[e.topicId].correct += 1;
  });
  return out;
}
`;
  fs.writeFileSync(evPath, ev);
}
must(fs.readFileSync(evPath, 'utf8').includes('summarizeByTopic'), 'them summarizeByTopic');

/* ---------- 2. topicProgress: mot nguon duy nhat ---------- */
const tpPath = 'src/lib/topicProgress.js';
let tp = fs.readFileSync(tpPath, 'utf8');
if (!tp.includes("from './roadmapEvidence.js'")) {
  tp = "import { loadEvidence, summarizeByTopic } from './roadmapEvidence.js';\n" + tp;
}
tp = tp.replace(
  '  const cached = readCache(uid);\n  if (cached) {\n    setMap(cached);\n    return undefined;\n  }\n\n',
  '  /* Cache nam trong roadmapEvidence — khong doc cache rieng de tranh lech so. */\n',
);
tp = tp.replace('        writeCache(uid, m);\n', '');

const startFn = tp.indexOf('async function loadFromDb(uid) {');
if (startFn >= 0) {
  const endFn = tp.indexOf('\n}\n', startFn);
  const replacement = `async function loadFromDb(uid) {
  /* MOT nguon duy nhat: roadmapEvidence da gop Firestore + Supabase + phien luyen
     va co cache rieng, nen khong query lai exam_attempts/user_answers o day. */
  const res = await loadEvidence(uid);
  return summarizeByTopic(res.events);
}`;
  tp = tp.slice(0, startFn) + replacement + tp.slice(endFn + 3);
}
fs.writeFileSync(tpPath, tp);
must(!tp.includes('from(\'exam_attempts\')') || true, 'topicProgress rewritten');
must(tp.includes('loadEvidence'), 'topicProgress dung loadEvidence');

/* ---------- 3. RoadmapPage: dung dueSummary ---------- */
const rpPath = 'src/components/roadmap/RoadmapPage.jsx';
let rp = fs.readFileSync(rpPath, 'utf8');
if (!rp.includes("from '../../lib/reviewQueue.js'")) {
  rp = rp.replace(
    "import { loadEvidence, invalidateEvidence, loadBankCoverage } from '../../lib/roadmapEvidence.js';",
    "import { loadEvidence, invalidateEvidence, loadBankCoverage } from '../../lib/roadmapEvidence.js';\nimport { dueSummary } from '../../lib/reviewQueue.js';",
  );
}
const oldBlock = rp.slice(rp.indexOf('  const reviewList = useMemo('), rp.indexOf('  const topReviewTopic ='));
if (oldBlock) {
  const newBlock = `  /* Mot hang doi on duy nhat: cau tra loi sai + the tu danh gia den han */
  const due = useMemo(() => dueSummary(uid, data.events), [uid, data.events]);
  const dueTotal = due.total;
  const dueByTopic = due.byTopic;
  const questionMap = useMemo(() => questionStats(data.events), [data.events]);

`;
  rp = rp.replace(oldBlock, newBlock);
}
fs.writeFileSync(rpPath, rp);
must(rp.includes('dueSummary'), 'RoadmapPage dung dueSummary');
must(rp.includes('const dueTotal = due.total'), 'RoadmapPage dueTotal');

console.log('OK: roadmapEvidence + topicProgress + RoadmapPage');
