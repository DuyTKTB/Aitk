import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getUserProfile,
  saveUserProfile,
  GRADES_LIST,
  VIETNAM_PROVINCES,
} from '../lib/userProfileService.js';
import { noteWeakTopic } from '../lib/aiMemory.js';
import { updateUserSettings } from '../lib/aspirationService.js';
import '../styles/onboarding-survey.css';

const GOALS = [
  { id: 'thptqg', title: 'Ôn thi THPT Quốc gia', desc: 'Luyện đề chuẩn cấu trúc Bộ GD&ĐT, tối ưu điểm xét ĐH' },
  { id: 'dgnl', title: 'Ôn thi ĐGNL / ĐGTD', desc: 'Tư duy định lượng, khoa học tự nhiên & đọc hiểu nhanh' },
  { id: 'hoc_tot', title: 'Học tốt trên lớp & GPA', desc: 'Nắm chắc lý thuyết, làm bài tập SGK & kiểm tra định kỳ' },
  { id: 'hsg', title: 'Ôn Học sinh giỏi / Chuyên', desc: 'Bài tập vận dụng cao, giải sâu bản chất & phương pháp hay' },
  { id: 'giang_day', title: 'Giảng dạy & Tạo đề', desc: 'Dành cho giáo viên soạn đề, quản lý lớp & theo dõi học sinh' },
];

const SUBJECTS = [
  { id: 'hoa_hoc', label: 'Hóa học' },
  { id: 'vat_ly', label: 'Vật lí' },
  { id: 'sinh_hoc', label: 'Sinh học' },
  { id: 'toan', label: 'Toán học' },
];

const BLOCKS = [
  { id: 'A00', label: 'Khối A00 (Toán - Lý - Hóa)' },
  { id: 'B00', label: 'Khối B00 (Toán - Hóa - Sinh)' },
  { id: 'A01', label: 'Khối A01 (Toán - Lý - Anh)' },
  { id: 'D07', label: 'Khối D07 (Toán - Hóa - Anh)' },
  { id: 'other', label: 'Chưa xác định / Khác' },
];

const LEVELS = [
  { id: 'mat_goc', title: 'Xây lại nền tảng (Mất gốc)', desc: 'Cần AI giảng chậm từ định nghĩa và công thức cơ bản' },
  { id: 'trung_binh', title: 'Trung bình – Khá (6.5 – 7.5đ)', desc: 'Chắc phần nhận biết & thông hiểu, bớt sai lỗi vặt' },
  { id: 'kha_gioi', title: 'Khá – Giỏi (8.0 – 8.75đ)', desc: 'Tăng tốc câu vận dụng, nhận diện bẫy đề thi thử' },
  { id: 'thu_khoa', title: 'Săn điểm 9+ / Thủ khoa', desc: 'Tối ưu tốc độ, giải nhanh bài vận dụng cao & đồ thị' },
];

const WEAK_CHIPS = [
  'Tính toán mol & bảo toàn',
  'Hóa hữu cơ & Este - Lipit',
  'Dao động & Điện xoay chiều',
  'Điện trường & Hạt nhân',
  'Quy luật di truyền & ADN',
  'Tránh bẫy câu lý thuyết',
];

const AI_STYLES = [
  { id: 'step_by_step', title: 'Chi tiết từng bước', desc: 'Phân tích giả thiết, công thức và tính toán rõ ràng' },
  { id: 'socratic', title: 'Gợi mở tư duy (Socratic)', desc: 'Đưa gợi ý từng bước để bạn tự tìm ra đáp án' },
  { id: 'concise', title: 'Ngắn gọn, trọng tâm', desc: 'Chốt công thức cốt lõi & mẹo giải nhanh trong 30 giây' },
  { id: 'friendly', title: 'Thân thiện, khích lệ', desc: 'Giải dễ hiểu như bạn đồng hành, nhắc mẹo nhớ lâu' },
];

const DAILY_MINUTES = [
  { value: 15, label: '15 phút / ngày', hint: 'Nhẹ nhàng duy trì chuỗi' },
  { value: 30, label: '30 phút / ngày', hint: 'Nhịp độ chuẩn (khuyên dùng)' },
  { value: 60, label: '60 phút / ngày', hint: 'Tăng tốc bứt phá điểm số' },
  { value: 90, label: '90+ phút / ngày', hint: 'Luyện đề chuyên sâu mỗi ngày' },
];

export default function OnboardingSurveyModal({ open, onClose, onCompleted }) {
  const { user, sendVerifyEmail } = useAuth();
  const uid = user?.uid;

  const [step, setStep] = useState(1); // 1..4, 5 = summary
  const [grade, setGrade] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [highSchool, setHighSchool] = useState('');
  const [goal, setGoal] = useState('thptqg');
  const [subjects, setSubjects] = useState(['hoa_hoc', 'vat_ly']);
  const [examBlock, setExamBlock] = useState('A00');
  const [currentLevel, setCurrentLevel] = useState('trung_binh');
  const [weakAreas, setWeakAreas] = useState([]);
  const [aiStyle, setAiStyle] = useState('step_by_step');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyMsg, setVerifyMsg] = useState('');

  const isPasswordUser = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );
  const showVerifyReminder = Boolean(isPasswordUser && user && !user.emailVerified);

  useEffect(() => {
    if (!open || !uid) return;
    const prof = getUserProfile(uid, user);
    const s = prof.survey || {};
    setStep(1);
    setGrade(prof.grade || '');
    setProvince(prof.province || '');
    setWard(prof.ward || '');
    setHighSchool(prof.highSchool || '');
    setGoal(s.goal || (s.role === 'teacher' ? 'giang_day' : 'thptqg'));
    setSubjects(s.subjects?.length ? s.subjects : ['hoa_hoc', 'vat_ly']);
    setExamBlock(s.examBlock || 'A00');
    setCurrentLevel(s.currentLevel || 'trung_binh');
    setWeakAreas(Array.isArray(s.weakAreas) ? s.weakAreas : []);
    setAiStyle(s.aiStyle || 'step_by_step');
    setDailyMinutes(Number(s.dailyMinutes) || 30);
    setVerifyMsg('');
  }, [open, uid, user]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!open || !uid) return null;

  const toggleArr = (list, setList, val) => {
    setList((prev) =>
      prev.includes(val)
        ? (prev.length > 1 ? prev.filter((x) => x !== val) : prev)
        : [...prev, val]
    );
  };

  const toggleWeak = (item) => {
    setWeakAreas((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item].slice(0, 5)
    );
  };

  const handleSkip = () => {
    saveUserProfile(uid, {
      survey: { skippedAt: Date.now() },
    });
    onClose?.();
  };

  const handleFinish = () => {
    const isTeacher = goal === 'giang_day' || grade === 'Sinh viên / Giáo viên';
    saveUserProfile(uid, {
      grade: grade || undefined,
      province: province || undefined,
      ward: ward.trim() || undefined,
      highSchool: highSchool.trim() || undefined,
      survey: {
        completed: true,
        completedAt: Date.now(),
        role: isTeacher ? 'teacher' : 'student',
        goal,
        subjects,
        examBlock,
        currentLevel,
        weakAreas,
        aiStyle,
        dailyMinutes,
      },
    });

    weakAreas.forEach((topic) => {
      try { noteWeakTopic(uid, topic); } catch { /* ignore */ }
    });

    try {
      const weeklyHours = Math.max(2, Math.round((dailyMinutes * 7) / 60));
      updateUserSettings(uid, { weeklyFreeHours: weeklyHours });
    } catch { /* ignore */ }

    setStep(5);
    onCompleted?.();
  };

  const handleResendVerify = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendVerifyEmail();
      setResendCooldown(60);
      setVerifyMsg('Đã gửi email xác thực mới! Hãy kiểm tra hộp thư (cả mục Spam).');
    } catch (err) {
      setVerifyMsg(err?.message || 'Không gửi lại được email xác thực lúc này.');
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'bạn';
  const progressPct = step >= 5 ? 100 : Math.round((step / 4) * 100);

  const modal = (
    <div
      className="osv-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="osv-title"
    >
      <div className="osv-modal">
        <div className="osv-top">
          <div className="osv-brand">
            <img
              src="/img/logo.png"
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="osv-badge">Cá nhân hóa ELEC AI</span>
          </div>
          {step < 5 && (
            <button type="button" className="osv-skip-btn" onClick={handleSkip}>
              Để sau
            </button>
          )}
        </div>

        {step < 5 && (
          <div className="osv-progress-wrap">
            <div className="osv-progress-bar">
              <div className="osv-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="osv-progress-meta">
              <span>Bước {step} / 4</span>
              <span>Khoảng 30 giây</span>
            </div>
          </div>
        )}

        {showVerifyReminder && (
          <div className="osv-verify-banner">
            <span>
              {verifyMsg || (
                <>
                  Email <b>{user.email}</b> chưa xác thực. Hãy kiểm tra hộp thư để kích hoạt đầy đủ tài khoản.
                </>
              )}
            </span>
            <button
              type="button"
              className="osv-verify-btn"
              onClick={handleResendVerify}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại email'}
            </button>
          </div>
        )}

        {step === 1 && (
          <>
            <header className="osv-head">
              <h2 id="osv-title">Chào {displayName}! Hiện tại bạn đang ở giai đoạn nào?</h2>
              <p>Giúp ELEC AI cập nhật đúng hồ sơ thật của bạn (không dùng dữ liệu mẫu) và gợi ý lộ trình chuẩn nhất.</p>
            </header>

            <div>
              <span className="osv-section-label">Lớp / Đối tượng của bạn</span>
              <div className="osv-chips">
                {GRADES_LIST.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`osv-chip ${grade === g ? 'on' : ''}`}
                    onClick={() => setGrade(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="osv-section-label">Mục tiêu chính khi dùng ELEC AI</span>
              <div className="osv-grid-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`osv-opt-card ${goal === g.id ? 'on' : ''}`}
                    onClick={() => setGoal(g.id)}
                  >
                    <b>{g.title}</b>
                    <small>{g.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="osv-inputs-row">
              <select
                className="osv-input"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                aria-label="Tỉnh / Thành phố"
              >
                <option value="">Tỉnh / Thành phố</option>
                {VIETNAM_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                className="osv-input"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Phường / Xã / Đặc khu"
                maxLength={60}
              />
            </div>

            <input
              type="text"
              className="osv-input"
              value={highSchool}
              onChange={(e) => setHighSchool(e.target.value)}
              placeholder="Tên trường đang học / công tác (tuỳ chọn)"
              maxLength={80}
            />
          </>
        )}

        {step === 2 && (
          <>
            <header className="osv-head">
              <h2 id="osv-title">Bạn quan tâm môn học và khối thi nào?</h2>
              <p>Chọn nhiều môn để AI tự động chuẩn bị ngân hàng câu hỏi & công thức phù hợp.</p>
            </header>

            <div>
              <span className="osv-section-label">Môn học trọng tâm (chọn 1 hoặc nhiều)</span>
              <div className="osv-chips">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`osv-chip ${subjects.includes(s.id) ? 'on' : ''}`}
                    onClick={() => toggleArr(subjects, setSubjects, s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="osv-section-label">Khối xét tuyển / Tổ hợp mục tiêu</span>
              <div className="osv-grid-2">
                {BLOCKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`osv-opt-card ${examBlock === b.id ? 'on' : ''}`}
                    onClick={() => setExamBlock(b.id)}
                  >
                    <b>{b.label}</b>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <header className="osv-head">
              <h2 id="osv-title">Nền tảng hiện tại & phần bạn muốn AI kèm kỹ</h2>
              <p>AI sẽ tự điều chỉnh độ khó bài giảng và nhắc lại các chuyên đề bạn dễ mất điểm.</p>
            </header>

            <div>
              <span className="osv-section-label">Mức độ hiện tại của bạn</span>
              <div className="osv-grid-2">
                {LEVELS.map((lv) => (
                  <button
                    key={lv.id}
                    type="button"
                    className={`osv-opt-card ${currentLevel === lv.id ? 'on' : ''}`}
                    onClick={() => setCurrentLevel(lv.id)}
                  >
                    <b>{lv.title}</b>
                    <small>{lv.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="osv-section-label">Chuyên đề còn vướng (tuỳ chọn, tối đa 5)</span>
              <div className="osv-chips">
                {WEAK_CHIPS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`osv-chip ${weakAreas.includes(w) ? 'on' : ''}`}
                    onClick={() => toggleWeak(w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <header className="osv-head">
              <h2 id="osv-title">Bạn muốn Gia sư ELEC AI đồng hành theo cách nào?</h2>
              <p>Thiết lập phong cách trả lời của AI và thời gian luyện tập mỗi ngày.</p>
            </header>

            <div>
              <span className="osv-section-label">Phong cách trả lời của AI</span>
              <div className="osv-grid-2">
                {AI_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`osv-opt-card ${aiStyle === st.id ? 'on' : ''}`}
                    onClick={() => setAiStyle(st.id)}
                  >
                    <b>{st.title}</b>
                    <small>{st.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="osv-section-label">Thời gian học mục tiêu mỗi ngày</span>
              <div className="osv-grid-2">
                {DAILY_MINUTES.map((dm) => (
                  <button
                    key={dm.value}
                    type="button"
                    className={`osv-opt-card ${dailyMinutes === dm.value ? 'on' : ''}`}
                    onClick={() => setDailyMinutes(dm.value)}
                  >
                    <b>{dm.label}</b>
                    <small>{dm.hint}</small>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <header className="osv-head">
              <span className="osv-badge" style={{ marginBottom: 8, display: 'inline-block' }}>
                Hoàn tất cá nhân hóa
              </span>
              <h2 id="osv-title">Hồ sơ AI của {displayName} đã sẵn sàng!</h2>
              <p>Mọi câu trả lời từ Gia sư AI, Lộ trình KHTN và Phòng thi ảo từ giờ sẽ ưu tiên theo cấu hình này.</p>
            </header>

            <div className="osv-summary-list">
              <div className="osv-summary-item">
                <span>Đối tượng / Lớp</span>
                <strong>{grade || 'Chưa chọn'}</strong>
              </div>
              <div className="osv-summary-item">
                <span>Mục tiêu chính</span>
                <strong>{GOALS.find((g) => g.id === goal)?.title || goal}</strong>
              </div>
              <div className="osv-summary-item">
                <span>Môn & Khối</span>
                <strong>
                  {subjects.map((id) => SUBJECTS.find((s) => s.id === id)?.label || id).join(', ')}
                  {examBlock && examBlock !== 'other' ? ` · ${examBlock}` : ''}
                </strong>
              </div>
              <div className="osv-summary-item">
                <span>Phong cách AI</span>
                <strong>{AI_STYLES.find((s) => s.id === aiStyle)?.title} · {dailyMinutes}p/ngày</strong>
              </div>
            </div>

            <div className="osv-foot" style={{ justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="osv-btn"
                onClick={() => {
                  onClose?.();
                  window.location.hash = 'roadmap';
                }}
              >
                Xem lộ trình KHTN
              </button>
              <button
                type="button"
                className="osv-btn"
                onClick={() => onClose?.()}
              >
                Vào trang chủ
              </button>
              <button
                type="button"
                className="osv-btn primary"
                onClick={() => {
                  onClose?.();
                  window.location.hash = 'ai';
                }}
              >
                Hỏi ELEC AI ngay
              </button>
            </div>
          </>
        )}

        {step < 5 && (
          <footer className="osv-foot">
            <button
              type="button"
              className="osv-btn"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : handleSkip())}
            >
              {step > 1 ? 'Quay lại' : 'Bỏ qua'}
            </button>
            <button
              type="button"
              className="osv-btn primary"
              onClick={() => (step < 4 ? setStep((s) => s + 1) : handleFinish())}
            >
              {step < 4 ? 'Tiếp tục' : 'Hoàn tất & Lưu hồ sơ'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
