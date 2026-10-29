import fs from 'fs';
const p = 'src/components/roadmap/RoadmapPage.jsx';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('StudyPlanCard')) {
  console.log('already wired');
  process.exit(0);
}
s = s.replace(
  "import BankTagger from './BankTagger.jsx';",
  "import BankTagger from './BankTagger.jsx';\nimport StudyPlanCard from './StudyPlanCard.jsx';",
);
s = s.replace(
  '      <div className="rm-grid">',
  `      <StudyPlanCard
        chapters={view.chapters}
        dueByTopic={dueByTopic}
        uid={uid}
        levelKey={levelKey}
        onOpenChapter={openChapter}
      />

      <div className="rm-grid">`,
);
fs.writeFileSync(p, s);
console.log('wired:', s.includes('<StudyPlanCard'), '| order ok:', s.indexOf('<StudyPlanCard') < s.indexOf('rm-grid'));
