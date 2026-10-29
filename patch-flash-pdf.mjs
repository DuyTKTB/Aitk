import fs from 'fs';

/* ---------- 1. ChapterSheet: thêm tab "Thẻ ghi nhớ" ---------- */
const p = 'src/components/roadmap/ChapterSheet.jsx';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('FlashcardSession')) {
  s = s.replace(
    "import PracticeRunner from './PracticeRunner.jsx';",
    "import PracticeRunner from './PracticeRunner.jsx';\nimport FlashcardSession from './FlashcardSession.jsx';",
  );
  s = s.replace(
    '  const [size, setSize] = useState(10);',
    '  const [size, setSize] = useState(10);\n  const [flash, setFlash] = useState(false);',
  );
  s = s.replace(
    `onClick={() => setTab('evidence')}>Bằng chứng</button>`,
    `onClick={() => setTab('evidence')}>Bằng chứng</button>
          <button type="button" role="tab" aria-selected={tab === 'flash'} className={tab === 'flash' ? 'on' : ''} onClick={() => setTab('flash')}>Thẻ ghi nhớ</button>`,
  );

  const flashBlock = `        {tab === 'flash' && (
          <div className="rm-sheet-body">
            {flash ? (
              <FlashcardSession
                chapterId={chapter.id}
                chapterName={chapter.name}
                uid={uid}
                onClose={() => setFlash(false)}
                onDone={() => onRefresh?.()}
              />
            ) : (
              <div className="rm-state inline">
                <b>Học bằng thẻ ghi nhớ</b>
                <p>
                  Mặt trước là câu hỏi, mặt sau là đáp án và giải thích. Bạn tự đánh giá 3 mức
                  (chưa nhớ / nhớ một phần / nhớ tốt) để hệ thống hẹn ngày ôn lại.
                </p>
                <button
                  type="button"
                  className="rm-btn primary"
                  onClick={() => setFlash(true)}
                  disabled={chapter.bank === false}
                >
                  {chapter.bank === false ? 'Chưa có ngân hàng câu hỏi' : 'Bắt đầu 10 thẻ'}
                </button>
              </div>
            )}
          </div>
        )}

        <footer className="rm-sheet-foot">`;
  s = s.replace('        <footer className="rm-sheet-foot">', flashBlock);
  fs.writeFileSync(p, s);
}
console.log('ChapterSheet flash tab:', s.includes('FlashcardSession') && s.includes("tab === 'flash'"));

/* ---------- 2. StudyPlanCard: in / lưu PDF ---------- */
const q = 'src/components/roadmap/StudyPlanCard.jsx';
let t = fs.readFileSync(q, 'utf8');
if (!t.includes('window.print')) {
  t = t.replace(
    `          {plan && plan.ok && (
            <button type="button" className="rm-btn" onClick={exportMd}>Tải .md</button>
          )}`,
    `          {plan && plan.ok && (
            <>
              <button type="button" className="rm-btn" onClick={() => window.print()}>In / Lưu PDF</button>
              <button type="button" className="rm-btn" onClick={exportMd}>Tải .md</button>
            </>
          )}`,
  );
  fs.writeFileSync(q, t);
}
console.log('StudyPlanCard print:', t.includes('window.print'));
