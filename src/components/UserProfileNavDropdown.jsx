import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getAspirationProfile,
  getSchoolById,
  ASPIRATION_CHANGE_EVENT,
} from '../lib/aspirationService.js';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { getUserRole } from '../lib/userRole.js';
import '../styles/nav-dropdowns.css';

/* ============================================================
   UserProfileNavDropdown.jsx — MENU AVATAR CÁ NHÂN GÓC PHẢI TRÊN CÙNG
   ------------------------------------------------------------
   Thiết kế chuẩn 100% SVG (không dùng emoji) theo đúng ảnh mẫu:
     • Nút bấm trên thanh điều hướng:
       [Vòng tròn Avatar chữ cái/ảnh] + [Mũi tên ⌄]
     • Bên trong Dropdown:
       - Hàng thông tin trên cùng:
         + Bên trái: Vòng tròn Avatar lớn (50x50, nền xanh tím #5c6bc0)
         + Bên phải: Tên học sinh + Tên trường (hoặc "Chưa cập nhật trường học") + Pill điểm xanh nhạt
       - 7 mục giữa (SVG nét mảnh):
         1. Chỉnh sửa hồ sơ
         2. Đề yêu thích
         3. Góp ý (bong bóng chat có trái tim SVG)
         4. Hướng dẫn
         5. Lịch sử học tập
         6. Báo lỗi của tôi
         7. Chiêu mộ & hoa hồng
       - 3 mục dưới:
         8. Gói của tôi (icon vương miện SVG màu xanh)
         9. Đổi mật khẩu (icon ổ khóa SVG)
         10. Đăng xuất (icon cửa thoát SVG + chữ xanh)
   ============================================================ */

const MENU_ITEMS = [
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
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const dropRef = useRef(null);
  const teacherPro = useTeacherPro();
  const role = getUserRole(user);
  const isTeacher = Boolean(
    isTeacherProp ||
    role === 'teacher' ||
    teacherPro?.isPro
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

  const reloadAspiration = useCallback(() => {
    setAspProfile(getAspirationProfile(user?.uid));
  }, [user?.uid]);

  useEffect(() => {
    reloadAspiration();
    window.addEventListener(ASPIRATION_CHANGE_EVENT, reloadAspiration);
    return () => window.removeEventListener(ASPIRATION_CHANGE_EVENT, reloadAspiration);
  }, [reloadAspiration]);

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

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Học sinh ELEC AI';
  // Lấy chữ cái đầu của từ cuối hoặc từ đầu trong tên (VD: Nguyễn Bùi Nguyệt Minh -> B hoặc M)
  const nameParts = displayName.trim().split(/\s+/);
  const initial = (nameParts.length >= 2 ? nameParts[1].charAt(0) : displayName.trim().charAt(0)).toUpperCase();

  const activeWish =
    aspProfile.aspirations?.find((a) => a.id === aspProfile.activeAspirationId) ||
    aspProfile.aspirations?.[0] ||
    null;

  const school = activeWish ? getSchoolById(activeWish.schoolId) : null;
  const displayScore = activeWish?.targetScore ?? aspProfile?.lastAttemptScore ?? 0.5;

  
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

  const menuJSX = open ? (
    <>
      <div className="ns9-uprof-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="ns9-uprof-menu" role="menu" aria-label="Menu cá nhân">
        <div className="ns9-uprof-sheet-grip" aria-hidden="true" />

        {/* ── Header thông tin: Avatar tròn lớn bên trái + Tên/Trường/Điểm bên phải (Giống hệt ảnh mẫu) ── */}
        <div className="ns9-uprof-head-row">
          <div className="ns9-uprof-avatar-lg" aria-hidden="true">
            {user?.photoURL ? <img src={user.photoURL} alt="" /> : <span>{initial}</span>}
          </div>

          <div className="ns9-uprof-head-info">
            <strong className="ns9-uprof-name">{displayName}</strong>
            <span className="ns9-uprof-school">
              {school ? school.name : 'Chưa cập nhật trường học'}
            </span>
            <div className="ns9-uprof-wish-row">
              <span className="ns9-uprof-score-pill">
                {displayScore} điểm
              </span>
            </div>
          </div>
        </div>

        <div className="ns9-uprof-divider" />

        {/* ── Các mục chức năng chính (100% SVG) ── */}
        <div className="ns9-uprof-list">
          {MENU_ITEMS.filter((item) => !item.teacherOnly || isTeacher).map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={'ns9-uprof-item' + (item.id === 'classroom' ? ' is-highlight' : '')}
              onClick={() => navigateTo(item.href)}
            >
              <span className="ns9-uprof-ico">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="ns9-uprof-divider" />

        {/* ── Cụm dưới: Gói của tôi · Đổi mật khẩu · Đăng xuất ── */}
        <div className="ns9-uprof-list">
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

          <button
            type="button"
            role="menuitem"
            className="ns9-uprof-item is-logout"
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
          {user?.photoURL ? <img src={user.photoURL} alt="" /> : <span>{initial}</span>}
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
