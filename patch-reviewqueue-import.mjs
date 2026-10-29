import fs from 'fs';
const p = 'src/components/roadmap/RoadmapPage.jsx';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes("from '../../lib/reviewQueue.js'")) {
  s = s.replace(
    "import { cardStats, dueCards, subscribeCards } from '../../lib/flashcardStore.js';",
    "import { cardStats, dueCards, subscribeCards } from '../../lib/flashcardStore.js';\nimport { dueSummary } from '../../lib/reviewQueue.js';",
  );
}
s = s.replace(
  'const due = useMemo(() => dueSummary(uid, data.events), [uid, data.events]);',
  'const due = useMemo(() => dueSummary(uid, events), [uid, events]);',
);
fs.writeFileSync(p, s);
console.log('import:', s.includes('reviewQueue.js'), '| uses events:', s.includes('dueSummary(uid, events)'));
