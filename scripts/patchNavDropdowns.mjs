import fs from 'fs';

// 1. Cập nhật UserProfileNavDropdown.jsx
let u = fs.readFileSync('src/components/UserProfileNavDropdown.jsx', 'utf8');

const userProfileEffect = `
  // Tự động đóng khi hash thay đổi hoặc khi dropdown khác mở
  useEffect(() => {
    const onCloseOthers = (e) => {
      if (e.detail?.except !== 'user-profile') {
        setOpen(false);
      }
    };
    const onHash = () => setOpen(false);
    window.addEventListener('elec-close-nav-dropdowns', onCloseOthers);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('elec-close-nav-dropdowns', onCloseOthers);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(
          new CustomEvent('elec-close-nav-dropdowns', { detail: { except: 'user-profile' } })
        );
      }
      return next;
    });
  };
`;

if (!u.includes('elec-close-nav-dropdowns')) {
  u = u.replace('const navigateTo = (href) => {', userProfileEffect + '\n  const navigateTo = (href) => {');
  u = u.replace("onClick={() => setOpen((s) => !s)}", "onClick={toggleOpen}");
  fs.writeFileSync('src/components/UserProfileNavDropdown.jsx', u, 'utf8');
  console.log('✓ Updated UserProfileNavDropdown.jsx');
}

// 2. Cập nhật StudyGoalNavDropdown.jsx
let s = fs.readFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', 'utf8');

// Thêm import UniversityDetailModal
if (!s.includes('UniversityDetailModal')) {
  s = s.replace(
    "import ElecTutorOnboardingModal from './ElecTutorOnboardingModal.jsx';",
    "import ElecTutorOnboardingModal from './ElecTutorOnboardingModal.jsx';\nimport UniversityDetailModal from './UniversityDetailModal.jsx';"
  );
}

// Thêm state universityModalOpen và event listener
const studyGoalSnippet = `
  const [universityModalOpen, setUniversityModalOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  // Tự động đóng khi hash thay đổi hoặc khi dropdown khác mở
  useEffect(() => {
    const onCloseOthers = (e) => {
      if (e.detail?.except !== 'study-goal') {
        setPanelOpen(false);
        setEditingExamId(null);
      }
    };
    const onHash = () => {
      setPanelOpen(false);
      setEditingExamId(null);
    };
    const onOpenUni = (e) => {
      if (e.detail?.schoolId) {
        setSelectedSchoolId(e.detail.schoolId);
        setUniversityModalOpen(true);
        setPanelOpen(false);
      }
    };
    window.addEventListener('elec-close-nav-dropdowns', onCloseOthers);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('elec-open-university-detail', onOpenUni);
    return () => {
      window.removeEventListener('elec-close-nav-dropdowns', onCloseOthers);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('elec-open-university-detail', onOpenUni);
    };
  }, []);

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(
          new CustomEvent('elec-close-nav-dropdowns', { detail: { except: 'study-goal' } })
        );
      }
      return next;
    });
  };
`;

if (!s.includes('elec-close-nav-dropdowns')) {
  s = s.replace('const [isMobile, setIsMobile] = useState(', studyGoalSnippet + '\n  const [isMobile, setIsMobile] = useState(');
  s = s.replace('onClick={() => setPanelOpen((v) => !v)}', 'onClick={togglePanel}');
}

// Thay nút Đề án tuyển sinh để mở UniversityDetailModal
s = s.replace(
  `onClick={() => setShowAdmissionNote((v) => !v)}`,
  `onClick={() => {
                      setSelectedSchoolId(activeAsp.school.code || activeAsp.school.id);
                      setUniversityModalOpen(true);
                      setPanelOpen(false);
                    }}`
);

// Thêm component UniversityDetailModal vào cuối JSX
if (!s.includes('<UniversityDetailModal')) {
  const modalJSX = `
      {/* ── MODAL CHI TIẾT ĐỀ ÁN TUYỂN SINH TRƯỜNG ĐH (CHUẨN 9STUDY) ── */}
      <UniversityDetailModal
        open={universityModalOpen}
        schoolId={selectedSchoolId || activeAsp?.school?.code || 'NEU'}
        uid={uid}
        onClose={() => setUniversityModalOpen(false)}
      />
    </div>
  );`;
  s = s.replace('</div>\n  );', modalJSX);
}

fs.writeFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', s, 'utf8');
console.log('✓ Updated StudyGoalNavDropdown.jsx');
