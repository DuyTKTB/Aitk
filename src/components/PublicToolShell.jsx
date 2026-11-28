import { Suspense, useEffect } from 'react';
import '../styles/app-shell-styles.js';
import SystemAnnouncementBanner from './SystemAnnouncementBanner.jsx';
import SiteFooter from './SiteFooter.jsx';
import { SeoRouteFooterContent } from './SeoPillarLanding.jsx';
import { SEO_ROUTE_BY_APP_PAGE } from '../data/seoPillarRoutes.js';
import { PageLoader } from './ElecIntroLoader.jsx';
import { initSubmitQueue } from '../lib/submitQueue.js';
import { initServerClock } from '../lib/serverClock.js';

export default function PublicToolShell({ page, renderPage }) {
  useEffect(() => {
    initSubmitQueue();
    initServerClock();
  }, []);

  if (page === 'ai' || page === 'pomodoro' || page === 'tap-trung') {
    return (
      <Suspense fallback={<PageLoader />}>
        <main id="main" tabIndex="-1" style={{ width: '100%', height: '100%' }}>
          {renderPage({ isTeacherAccount: false, credits: null })}
        </main>
      </Suspense>
    );
  }

  return (
    <div className="public-guest-wrap" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SystemAnnouncementBanner />
      <div className="guest-banner" style={{
        background: 'linear-gradient(90deg, #1d4ed8, #6d28d9)',
        color: '#fff',
        padding: '8px 12px',
        textAlign: 'center',
        fontSize: '12.5px',
        fontWeight: 600,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px 10px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z" />
          </svg>
          <span>Bạn đang xem bản trải nghiệm mở của <strong>ELEC AI</strong>.</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="/#/register"
            style={{
              background: '#fff',
              color: '#1d4ed8',
              padding: '4px 12px',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            Đăng ký miễn phí
          </a>
          <a
            href="/#/login"
            style={{
              color: 'rgba(255,255,255,0.92)',
              textDecoration: 'underline',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            Đăng nhập
          </a>
        </span>
      </div>
      <Suspense fallback={<PageLoader />}>
        <main id="main" tabIndex="-1" style={{ flex: 1 }}>
          {renderPage({ isTeacherAccount: false, credits: null })}
          {SEO_ROUTE_BY_APP_PAGE[page]?.kind === 'tool' && (
            <SeoRouteFooterContent route={SEO_ROUTE_BY_APP_PAGE[page]} />
          )}
        </main>
      </Suspense>
      <SiteFooter />
    </div>
  );
}
