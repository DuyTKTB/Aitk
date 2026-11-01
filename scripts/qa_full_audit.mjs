import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const EVIDENCE_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_360', width: 360, height: 800, isMobile: true },
  { name: 'mobile_390', width: 390, height: 844, isMobile: true },
  { name: 'mobile_landscape', width: 844, height: 390, isMobile: true },
  { name: 'tablet_768', width: 768, height: 1024, isMobile: false },
  { name: 'laptop_1024', width: 1024, height: 768, isMobile: false },
  { name: 'desktop_1366', width: 1366, height: 768, isMobile: false },
  { name: 'desktop_1920', width: 1920, height: 1080, isMobile: false },
];

const PAGES_TO_TEST = [
  { path: '/#home', id: 'home', name: 'Trang Chủ' },
  { path: '/#ai', id: 'ai', name: 'Trợ lý ELEC AI' },
  { path: '/#tools', id: 'tools', name: 'Trung tâm Công cụ' },
  { path: '/#profile?tab=overview', id: 'profile_overview', name: 'Hồ sơ - Tổng quan' },
  { path: '/#profile?tab=vip', id: 'profile_vip', name: 'Hồ sơ - Bảng giá VIP & Lộ trình' },
  { path: '/#profile?tab=billing', id: 'profile_billing', name: 'Hồ sơ - Lịch sử thanh toán' },
  { path: '/#profile?tab=reports', id: 'profile_reports', name: 'Hồ sơ - Báo lỗi & Góp ý' },
  { path: '/#profile?tab=referral', id: 'profile_referral', name: 'Hồ sơ - Chiêu mộ & Hoa hồng' },
  { path: '/#profile?tab=security', id: 'profile_security', name: 'Hồ sơ - Bảo mật & Thiết bị' },
  { path: '/#virtual-exams', id: 'virtual_exams', name: 'Phòng thi ảo' },
  { path: '/#quiz', id: 'quiz', name: 'Ôn tập & SRS' },
  { path: '/#roadmap', id: 'roadmap', name: 'Lộ trình kiến thức' },
  { path: '/#table', id: 'table', name: 'Bảng tuần hoàn' },
  { path: '/#formulas', id: 'formulas', name: 'Công thức nhanh' },
  { path: '/#balance', id: 'balance', name: 'Cân bằng PTHH' },
  { path: '/#notebook', id: 'notebook', name: 'Sổ tay lỗi sai' },
  { path: '/#leaderboard', id: 'leaderboard', name: 'Bảng xếp hạng' },
  { path: '/#stats', id: 'stats', name: 'Thống kê học tập' },
  { path: '/#games', id: 'games', name: 'Game Hub' },
  { path: '/#my-classes', id: 'my_classes', name: 'Lớp học' },
  { path: '/#non-existent-page-xyz', id: '404', name: 'Trang 404 Không tìm thấy' },
];

async function runAudit() {
  console.log('🚀 Bắt đầu đợt kiểm thử QA Audit tự động toàn diện...');
  const browser = await chromium.launch({ headless: true });
  
  const report = {
    startedAt: new Date().toISOString(),
    viewportsTested: VIEWPORTS.map(v => `${v.name} (${v.width}x${v.height})`),
    pagesTested: PAGES_TO_TEST.map(p => p.name),
    issues: [],
    consoleLogs: [],
    networkErrors: [],
  };

  let issueCounter = 1;

  for (const vp of VIEWPORTS) {
    console.log(`\n📱 Đang kiểm thử Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Lắng nghe console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        report.consoleLogs.push({
          viewport: vp.name,
          url: page.url(),
          text: msg.text(),
          location: msg.location(),
        });
      }
    });

    // Lắng nghe network failures
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon') && !res.url().includes('analytics')) {
        report.networkErrors.push({
          viewport: vp.name,
          url: res.url(),
          status: res.status(),
          statusText: res.statusText(),
        });
      }
    });

    for (const target of PAGES_TO_TEST) {
      const fullUrl = `${BASE_URL}${target.path}`;
      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 8000 });
      } catch (e) {
        try {
          await page.goto(fullUrl, { waitUntil: 'load', timeout: 5000 });
        } catch (err2) {
          // ignore timeout
        }
      }

      await page.waitForTimeout(400);

      // Chụp màn hình đại diện
      const screenshotFilename = `${vp.name}_${target.id}.png`;
      const screenshotPath = path.join(EVIDENCE_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // 1. Kiểm tra tràn ngang (Horizontal overflow)
      const overflowInfo = await page.evaluate(() => {
        const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const winW = window.innerWidth;
        const isOverflow = docW > winW + 1;
        let overflowingElements = [];
        if (isOverflow) {
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winW + 2 && rect.width > 0) {
              const selector = el.tagName.toLowerCase() + 
                (el.id ? '#' + el.id : '') + 
                (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
              overflowingElements.push({
                selector,
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                winW,
              });
              if (overflowingElements.length >= 5) break;
            }
          }
        }
        return { isOverflow, docW, winW, overflowingElements };
      });

      if (overflowInfo.isOverflow) {
        report.issues.push({
          id: `ISSUE-${issueCounter++}`,
          severity: 'High',
          type: 'UI',
          page: `${target.name} (${target.path})`,
          device: `${vp.name} (${vp.width}px)`,
          description: `Tràn ngang màn hình (${overflowInfo.docW}px > ${overflowInfo.winW}px). Gây hiện tượng thanh cuộn ngang khó chịu trên màn hình nhỏ.`,
          reproduce: `Mở ${fullUrl} ở kích thước màn hình ${vp.width}px, vuốt hoặc cuộn sang phải.`,
          actualVsExpected: `Thực tế: trang bị tràn ngang ${overflowInfo.docW}px. Mong đợi: trang hiển thị gọn gàng trong ${overflowInfo.winW}px, không có thanh cuộn ngang.`,
          evidence: `Ảnh: ${screenshotFilename}. Phần tử tràn: ${overflowInfo.overflowingElements.map(e => e.selector + ' (right=' + e.right + 'px)').join(', ')}`,
          fixRecommendation: `Thêm overflow-x: hidden vào container chính hoặc điều chỉnh max-width: 100% / flex-wrap cho các phần tử tràn.`,
        });
      }

      // 2. Kiểm tra ảnh vỡ (Broken images)
      const brokenImages = await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 150));
        window.scrollTo(0, 0);
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .filter(img => img.complete && img.naturalWidth === 0)
          .map(img => ({ src: img.src, alt: img.alt, className: img.className }));
      });

      if (brokenImages.length > 0) {
        report.issues.push({
          id: `ISSUE-${issueCounter++}`,
          severity: 'Medium',
          type: 'UI',
          page: `${target.name} (${target.path})`,
          device: `${vp.name}`,
          description: `Phát hiện ${brokenImages.length} ảnh bị vỡ (không tải được hoặc naturalWidth = 0).`,
          reproduce: `Mở ${fullUrl}, kiểm tra các thẻ <img> trên trang.`,
          actualVsExpected: `Thực tế: ảnh hiển thị biểu tượng vỡ hoặc trắng tinh. Mong đợi: ảnh tải thành công hoặc có fallback placeholder.`,
          evidence: `Ảnh src: ${brokenImages.map(b => b.src).join(' | ')}`,
          fixRecommendation: `Kiểm tra đường dẫn ảnh trong public/img hoặc thêm onError fallback.`,
        });
      }

      // 3. Kiểm tra Accessibility: nút/link/input thiếu label hoặc aria (chỉ log 1 lần trên desktop)
      if (vp.name === 'desktop_1366') {
        const a11yIssues = await page.evaluate(() => {
          const issues = [];
          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
          for (const input of inputs) {
            const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
            const hasParentLabel = input.closest('label');
            const hasAria = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby') || input.placeholder;
            if (!hasLabel && !hasParentLabel && !hasAria) {
              issues.push(`Input type="${input.type}" thiếu accessible label`);
            }
          }
          const buttons = Array.from(document.querySelectorAll('button'));
          for (const btn of buttons) {
            const text = (btn.innerText || btn.textContent || '').trim();
            const aria = btn.getAttribute('aria-label') || btn.getAttribute('title');
            const hasImgAlt = btn.querySelector('img[alt]') && btn.querySelector('img').getAttribute('alt').trim();
            if (!text && !aria && !hasImgAlt) {
              const cls = (btn.className && typeof btn.className === 'string') ? btn.className.trim() : btn.tagName;
              issues.push(`Nút <button class="${cls}"> thiếu text và aria-label`);
            }
          }
          return issues.slice(0, 5);
        });

        if (a11yIssues.length > 0) {
          report.issues.push({
            id: `ISSUE-${issueCounter++}`,
            severity: 'Low',
            type: 'A11y',
            page: `${target.name} (${target.path})`,
            device: 'Chung (Desktop/Mobile)',
            description: `Phát hiện các phần tử tương tác thiếu Accessible Name (nhãn cho trình đọc màn hình screen-reader).`,
            reproduce: `Dùng công cụ kiểm tra trợ năng (Axe/Lighthouse) trên ${fullUrl}.`,
            actualVsExpected: `Thực tế: ${a11yIssues.join('; ')}. Mong đợi: 100% input có label/aria-label, nút icon có aria-label.`,
            evidence: a11yIssues.join(' | '),
            fixRecommendation: `Thêm aria-label="..." hoặc <label for="..."> cho các phần tử trên.`,
          });
        }

        // 4. Kiểm tra Placeholder text rác hoặc lỗi chính tả/mã hóa
        const contentIssues = await page.evaluate(() => {
          const text = document.body.innerText || '';
          const problems = [];
          if (text.includes('undefined')) problems.push('Chứa chuỗi "undefined"');
          if (text.includes('NaN') && !text.includes('NaNO') && !text.includes('NaN3')) problems.push('Chứa giá trị số học "NaN"');
          if (text.includes('[object Object]')) problems.push('Chứa chuỗi "[object Object]"');
          if (text.includes('lorem ipsum') || text.includes('Lorem ipsum')) problems.push('Chứa text mẫu "Lorem ipsum"');
          return problems;
        });

        if (contentIssues.length > 0) {
          report.issues.push({
            id: `ISSUE-${issueCounter++}`,
            severity: 'High',
            type: 'Nội dung',
            page: `${target.name} (${target.path})`,
            device: 'Mọi thiết bị',
            description: `Phát hiện lỗi hiển thị chuỗi nội dung bất thường: ${contentIssues.join(', ')}.`,
            reproduce: `Mở ${fullUrl} và tìm kiếm các chuỗi trên trong DOM text.`,
            actualVsExpected: `Thực tế: hiển thị dữ liệu rác/lỗi mã hóa. Mong đợi: text tiếng Việt chuẩn hóa, không có placeholder kỹ thuật.`,
            evidence: `Lỗi phát hiện: ${contentIssues.join(', ')}`,
            fixRecommendation: `Kiểm tra state chưa khởi tạo hoặc render logic.`,
          });
        }
      }
    }

    await context.close();
  }

  // Functional Interactive Tests (Auth, Command Palette, Modals, Esc key, Dark mode)
  console.log('\n🔍 Bắt đầu kiểm tra Functional tương tác trực tiếp...');
  const interactiveContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const ipage = await interactiveContext.newPage();

  // Test 1: Command Palette (Ctrl+K)
  await ipage.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle' });
  await ipage.keyboard.press('Control+k');
  await ipage.waitForTimeout(500);
  const isCmdPaletteOpen = await ipage.evaluate(() => {
    const el = document.querySelector('.cmd-palette, .command-palette, [role="combobox"], [placeholder*="Tìm nhanh"]');
    return !!el && window.getComputedStyle(el).display !== 'none';
  });
  if (isCmdPaletteOpen) {
    // Test Escape key
    await ipage.keyboard.press('Escape');
    await ipage.waitForTimeout(300);
    const isClosedAfterEsc = await ipage.evaluate(() => {
      const el = document.querySelector('.cmd-palette, .command-palette');
      return !el || el.offsetParent === null || window.getComputedStyle(el).display === 'none';
    });
    if (!isClosedAfterEsc) {
      report.issues.push({
        id: `ISSUE-${issueCounter++}`,
        severity: 'Medium',
        type: 'Chức năng',
        page: 'Trang chủ (Toàn hệ thống)',
        device: 'Desktop',
        description: 'Hộp thoại Command Palette (Ctrl+K) không đóng khi bấm phím Esc.',
        reproduce: 'Bấm Ctrl+K để mở hộp tìm kiếm, sau đó bấm phím Esc trên bàn phím.',
        actualVsExpected: 'Thực tế: Hộp thoại vẫn mở. Mong đợi: Bấm Esc phải đóng ngay hộp thoại.',
        evidence: 'Phím Esc không kích hoạt sự kiện đóng',
        fixRecommendation: 'Thêm window.addEventListener("keydown", (e) => if (e.key === "Escape") onClose())',
      });
    }
  }

  // Test 2: Dark mode toggle
  await ipage.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle' });
  const hasDarkToggle = await ipage.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="tối"], button[title*="tối"], .dark-mode-toggle');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  await ipage.waitForTimeout(400);
  if (hasDarkToggle) {
    const isDarkApplied = await ipage.evaluate(() => {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark') || 
             document.documentElement.getAttribute('data-theme') === 'dark';
    });
    const darkScreenshot = path.join(EVIDENCE_DIR, 'dark_mode_home.png');
    await ipage.screenshot({ path: darkScreenshot });
    if (!isDarkApplied) {
      report.issues.push({
        id: `ISSUE-${issueCounter++}`,
        severity: 'Low',
        type: 'UI/Chức năng',
        page: 'Toàn hệ thống',
        device: 'Desktop',
        description: 'Nút chuyển đổi chế độ tối (Dark mode) không gán class dark hoặc data-theme="dark" lên <html>/<body>.',
        reproduce: 'Bấm nút Dark mode ở Header.',
        actualVsExpected: 'Thực tế: không có class hoặc attribute dark. Mong đợi: chuyển giao diện sang nền tối.',
        evidence: 'Screenshot: dark_mode_home.png',
        fixRecommendation: 'Đồng bộ state dark mode với document.documentElement.classList.toggle("dark")',
      });
    }
  }

  await browser.close();

  // Lưu file kết quả
  const reportPath = path.join(EVIDENCE_DIR, 'audit_raw_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n✅ Hoàn tất đợt audit tự động! Đã ghi nhận ${report.issues.length} vấn đề, ${report.consoleLogs.length} console error, ${report.networkErrors.length} network error.`);
  return report;
}

runAudit().catch(err => {
  console.error('Lỗi khi chạy QA audit:', err);
  process.exit(1);
});
