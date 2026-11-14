import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getAspirationProfile,
  getSchoolById,
  ASPIRATION_CHANGE_EVENT,
} from '../lib/aspirationService.js';
import {
  getUserProfile,
  USER_PROFILE_CHANGE_EVENT,
} from '../lib/userProfileService.js';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { getUserRole } from '../lib/userRole.js';
import UserAvatar from './UserAvatar.jsx';
import '../styles/nav-dropdowns.css';

/* ============================================================
   UserProfileNavDropdown.jsx — MENU AVATAR CÁ NHÂN GÓC PHẢI TRÊN CÙNG
   ------------------------------------------------------------
   Thiết kế 100% SVG thuần — Không dùng emoji — Chuẩn theo mẫu:
     • Nút bấm trigger trên thanh điều hướng:
       [Vòng tròn Avatar chữ cái/ảnh] + [Mũi tên ⌄]
     • Header thông tin trong Menu:
       + Avatar tròn lớn bên trái
       + Tên học sinh (e.g. "Nguyễn Duy TK")
       + Trường nguyện vọng / Trường học (e.g. "Học Viện An Ninh Nhân Dân")
       + Pill điểm xanh dương "26 điểm" + Nguyện vọng "(1) Ngành An ninh mạng..."
     • 7 mục tính năng chính:
       1. Chỉnh sửa hồ sơ (#profile?tab=info)
       2. Đề yêu thích (#profile?tab=favorites)
       3. Góp ý (mở modal góp ý chuẩn hình ảnh)
       4. Hướng dẫn (#profile?tab=guide)
       5. Lịch sử học tập (#profile?tab=history)
       6. Báo lỗi của tôi (#profile?tab=reports)
       7. Chiêu mộ & hoa hồng (#profile?tab=referral)
     • Divider phân cách
     • 5 mục quản lý & tài khoản:
       8. Mua ELEC AI Credit (icon thẻ/tiền xanh dương)
       9. Gói của tôi (icon vương miện xanh dương)
       10. Lịch sử thanh toán (icon hóa đơn xanh dương)
       11. Đổi mật khẩu (icon ổ khóa)
       12. Đăng xuất (icon mũi tên thoát xanh dương)
   ============================================================ */

const MAIN_MENU_ITEMS = [
  {
    id: 'info',
    label: 'Chỉnh sửa hồ sơ',
    href: '#profile?tab=info',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
  },
  {
    id: 'favorites',
    label: 'Đề yêu thích',
    href: '#profile?tab=favorites',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    ),
  },
  {
    id: 'feedback',
    label: 'Góp ý',
    action: 'open-feedback',
    href: '#profile?tab=feedback',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M12 12.5c-1.5-1.2-2.5-2.2-2.5-3.2A1.5 1.5 0 0 1 12 8.2a1.5 1.5 0 0 1 2.5 1.1c0 1-1 2-2.5 3.2z" />
      </svg>
    ),
  },
  {
    id: 'guide',
    label: 'Hướng dẫn',
    href: '#profile?tab=guide',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Lịch sử học tập',
    href: '#profile?tab=history',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Báo lỗi của tôi',
    href: '#profile?tab=reports',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: 'referral',
    label: 'Chiêu mộ & hoa hồng',
    href: '#profile?tab=referral',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" rx="1" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    id: 'classroom',
    label: 'Vào quản lý lớp học',
    href: '#classroom',
    teacherOnly: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
        <path d="M6 14h6" />
      </svg>
    ),
  },
];

export default function UserProfileNavDropdown({ user, page, onLogout, isTeacher: isTeacherProp }) {
  const [open, setOpen] = useState(false);
  const [aspProfile, setAspProfile] = useState(() => getAspirationProfile(user?.uid));
  const [userProfile, setUserProfile] = useState(() => getUserProfile(user?.uid, user));
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const dropRef = useRef(null);
  const teacherPro = useTeacherPro();
  const role = getUserRole(user);
  const isTeacher = Boolean(
    isTeacherProp ||
    role === 'teacher' ||
    (teacherPro?.isPro && teacherPro?.isTeacherPro !== false)
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (open && isMobile && typeof document !== 'undefined') {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [open, isMobile]);

  const reloadData = useCallback(() => {
    setAspProfile(getAspirationProfile(user?.uid));
    setUserProfile(getUserProfile(user?.uid, user));
  }, [user]);

  useEffect(() => {
    reloadData();
    window.addEventListener(ASPIRATION_CHANGE_EVENT, reloadData);
    window.addEventListener(USER_PROFILE_CHANGE_EVENT, reloadData);
    return () => {
      window.removeEventListener(ASPIRATION_CHANGE_EVENT, reloadData);
      window.removeEventListener(USER_PROFILE_CHANGE_EVENT, reloadData);
    };
  }, [reloadData]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const displayName =
    userProfile?.fullName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Thành viên ELEC AI';

  const nameParts = displayName.trim().split(/\s+/);
  const initial = (nameParts.length >= 2 ? nameParts[1].charAt(0) : displayName.trim().charAt(0)).toUpperCase();

  const activeWish =
    aspProfile.aspirations?.find((a) => a.id === aspProfile.activeAspirationId) ||
    aspProfile.aspirations?.[0] ||
    null;

  const school = activeWish ? getSchoolById(activeWish.schoolId) : null;
  const schoolDisplay =
    school?.name ||
    activeWish?.schoolName ||
    userProfile?.highSchool ||
    user?.email ||
    'Chưa cập nhật trường';

  const displayScore = activeWish?.targetScore ?? aspProfile?.lastAttemptScore ?? null;
  const majorDisplay = activeWish?.majorName
    ? `(1) ${activeWish.majorName}`
    : (userProfile?.grade || 'Chưa chọn nguyện vọng');

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

  const navigateTo = (href) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
    if (window.location.hash === href) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = href;
    }
  };

  const handleOpenFeedback = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
    window.dispatchEvent(new CustomEvent('elec-open-feedback-modal'));
  };

  const handleOpenCreditTopUp = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
    window.dispatchEvent(new CustomEvent('elec-open-credit-topup'));
  };

  const menuJSX = open ? (
    <>
      <div className="ns9-uprof-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="ns9-uprof-menu" role="menu" aria-label="Menu cá nhân">
        <div className="ns9-uprof-sheet-grip" aria-hidden="true" />

        {/* ── Header thông tin: Avatar tròn lớn bên trái + Tên/Trường/Điểm bên phải (Khớp 100% Ảnh 3) ── */}
        <div className="ns9-uprof-head-row">
          <div className="ns9-uprof-avatar-lg" aria-hidden="true">
            <UserAvatar user={user} size={48} title={displayName} />
          </div>

          <div className="ns9-uprof-head-info">
            <strong className="ns9-uprof-name">{displayName}</strong>
            {teacherPro?.isPro && teacherPro?.isTeacherPro !== false ? (
              <>
                <span className="ns9-uprof-school" title={user?.email || 'Giáo viên PRO'}>
                  {user?.email || 'Giáo viên — Quản lý lớp học'}
                </span>
                <div className="ns9-uprof-wish-row">
                  <span
                    className="ns9-uprof-score-pill"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    GIÁO VIÊN PRO
                  </span>
                  <span
                    className="ns9-uprof-major-pill"
                    title={teacherPro.pro?.key ? `Key: ${teacherPro.pro.key}` : 'Gói Giáo viên PRO'}
                  >
                    Còn {teacherPro.daysLeft ?? 30} ngày{teacherPro.pro?.key ? ` · ${teacherPro.pro.key}` : ''}
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="ns9-uprof-school" title={schoolDisplay}>
                  {schoolDisplay}
                </span>
                <div className="ns9-uprof-wish-row">
                  {displayScore != null && (
                    <span className="ns9-uprof-score-pill">
                      {displayScore} điểm
                    </span>
                  )}
                  <span className="ns9-uprof-major-pill" title={activeWish?.majorName || majorDisplay}>
                    {majorDisplay}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="ns9-uprof-divider" />

        {/* ── 7 mục tính năng chính (100% SVG thuần) ── */}
        <div className="ns9-uprof-list">
          {MAIN_MENU_ITEMS.filter((item) => !item.teacherOnly || isTeacher).map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={'ns9-uprof-item' + (item.id === 'classroom' ? ' is-highlight' : '')}
              onClick={() => {
                if (item.action === 'open-feedback') {
                  handleOpenFeedback();
                } else {
                  navigateTo(item.href);
                }
              }}
            >
              <span className="ns9-uprof-ico">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="ns9-uprof-divider" />

        {/* ── Cụm dưới: Mua ELEC AI Credit · Gói của tôi · Lịch sử thanh toán · Đổi mật khẩu · Đăng xuất (Khớp 100% Ảnh 3) ── */}
        <div className="ns9-uprof-list">
          {/* Mua ELEC AI Credit */}
          <button
            type="button"
            role="menuitem"
            className="ns9-uprof-item is-study-credit"
            onClick={handleOpenCreditTopUp}
          >
            <span className="ns9-uprof-ico is-blue">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <path d="M6 15h2" />
                <path d="M14 15h4" />
              </svg>
            </span>
            <span>Mua ELEC AI Credit</span>
          </button>

          {/* Gói của tôi */}
          <button
            type="button"
            role="menuitem"
            className="ns9-uprof-item is-crown"
            onClick={() => navigateTo('#profile?tab=upgrade')}
          >
            <span className="ns9-uprof-ico is-blue">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
            </span>
            <span>Gói của tôi</span>
          </button>

          {/* Lịch sử thanh toán */}
          <button
            type="button"
            role="menuitem"
            className="ns9-uprof-item is-billing"
            onClick={() => navigateTo('#profile?tab=billing')}
          >
            <span className="ns9-uprof-ico is-blue">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span>Lịch sử thanh toán</span>
          </button>

          {/* Đổi mật khẩu */}
          <button
            type="button"
            role="menuitem"
            className="ns9-uprof-item"
            onClick={() => navigateTo('#profile?tab=security')}
          >
            <span className="ns9-uprof-ico">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span>Đổi mật khẩu</span>
          </button>

          {/* Đăng xuất (icon xanh + chữ xanh theo Ảnh 3) */}
          <button
            type="button"
            role="menuitem"
            className="ns9-uprof-item is-logout-blue"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            <span className="ns9-uprof-ico is-blue">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="ns9-uprof-wrap" ref={dropRef}>
      <button
        type="button"
        className={'ns9-uprof-trigger' + (open || page === 'profile' ? ' is-open' : '')}
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label="Mở menu Hồ sơ cá nhân"
        title={displayName}
      >
        <span className="ns9-uprof-avatar">
          <UserAvatar user={user} size={28} title={displayName} />
        </span>
        <svg
          className={'ns9-uprof-chev' + (open ? ' up' : '')}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (isMobile && typeof document !== 'undefined' ? createPortal(menuJSX, document.body) : menuJSX)}
    </div>
  );
}
