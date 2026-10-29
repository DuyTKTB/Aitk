import fs from 'fs';

let s = fs.readFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', 'utf8');

// 1. Xóa UniversityDetailModal khỏi ScoreCircle
const wrongSnippetInScoreCircle = `    
      {/* ── MODAL CHI TIẾT ĐỀ ÁN TUYỂN SINH TRƯỜNG ĐH (CHUẨN 9STUDY) ── */}
      <UniversityDetailModal
        open={universityModalOpen}
        schoolId={selectedSchoolId || activeAsp?.school?.code || 'NEU'}
        uid={uid}
        onClose={() => setUniversityModalOpen(false)}
      />`;

s = s.replace(wrongSnippetInScoreCircle, '');

// 2. Thêm UniversityDetailModal vào đúng cuối component StudyGoalNavDropdown
const correctPlacementTarget = `      <ElecTutorOnboardingModal
        open={tutorOpen}
        uid={uid}
        initialAspiration={editingAsp}
        initialExamId={activeExam.id}
        onClose={() => {
          setTutorOpen(false);
          setEditingAsp(null);
        }}
        onCompleted={(updatedState) => {
          setState(updatedState);
        }}
      />`;

const replacementWithUniModal = `${correctPlacementTarget}

      {/* ── MODAL CHI TIẾT ĐỀ ÁN TUYỂN SINH TRƯỜNG ĐH (CHUẨN 9STUDY) ── */}
      <UniversityDetailModal
        open={universityModalOpen}
        schoolId={selectedSchoolId || activeAsp?.school?.code || 'NEU'}
        uid={uid}
        onClose={() => setUniversityModalOpen(false)}
      />`;

s = s.replace(correctPlacementTarget, replacementWithUniModal);

fs.writeFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', s, 'utf8');
console.log('✓ Corrected UniversityDetailModal position in StudyGoalNavDropdown.jsx');
