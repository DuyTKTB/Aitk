import fs from 'fs';

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Thêm import UniversityDetailModal nếu chưa có
if (!app.includes('UniversityDetailModal')) {
  app = "import UniversityDetailModal from './components/aspiration/UniversityDetailModal.jsx';\n" + app;
}

// 2. Thêm vào PAGES
if (!app.includes("['truong'")) {
  app = app.replace(
    "['virtual-exams', 'Phòng thi ảo', IconTarget],",
    "['virtual-exams', 'Phòng thi ảo', IconTarget],\n  ['truong', 'Đề án tuyển sinh', IconTarget],"
  );
}

// 3. Cập nhật readPage
if (!app.includes("h.startsWith('truong/')")) {
  app = app.replace(
    "if (h.startsWith('exam/')) return h;",
    "if (h.startsWith('exam/')) return h;\n  if (h === 'truong' || h.startsWith('truong/')) return h;"
  );
}

// 4. Thêm render trường vào renderPage
if (!app.includes("page.startsWith('truong/')")) {
  const truongRender = `
    if (page === 'truong' || page.startsWith('truong/')) {
      const schoolId = page.startsWith('truong/') ? page.replace('truong/', '') : 'NEU';
      return (
        <>
          <Home />
          <UniversityDetailModal
            open={true}
            schoolId={schoolId || 'NEU'}
            uid={user?.uid}
            onClose={() => { window.location.hash = 'home'; }}
          />
        </>
      );
    }
  `;
  app = app.replace("if (page === 'leaderboard') return <LeaderboardPage />;", "if (page === 'leaderboard') return <LeaderboardPage />;\n" + truongRender);
}

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('✓ Patched App.jsx with #truong/:id routing');
