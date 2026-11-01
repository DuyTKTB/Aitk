import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const EVIDENCE_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

async function runDeepAudit() {
  console.log('🔍 Bắt đầu kiểm tra sâu: Links, Forms, Contrast, Z-Index, Modals...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const results = {
    brokenLinks: [],
    formBugs: [],
    contrastBugs: [],
    overlapBugs: [],
    consoleErrors: [],
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({ text: msg.text(), url: page.url() });
    }
  });

  // 1. Kiểm tra toàn bộ Links trên Trang chủ và Footer
  console.log('--- 1. Kiểm tra tất cả Links & Navigation ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: a.getAttribute('href'),
      text: a.innerText.trim() || a.getAttribute('aria-label') || 'No text',
      className: a.className,
    }));
  });

  for (const link of links) {
    if (!link.href) continue;
    if (link.href.startsWith('#') || link.href.startsWith('/#')) {
      const targetHash = link.href.replace(/^\//, '');
      const testUrl = `${BASE_URL}/${targetHash}`;
      try {
        await page.goto(testUrl, { waitUntil: 'load', timeout: 4000 });
        const is404 = await page.evaluate(() => {
          return document.body.innerText.includes('404') && 
                 (document.body.innerText.includes('Không tìm thấy trang') || document.querySelector('.not-found'));
        });
        if (is404) {
          results.brokenLinks.push({
            linkText: link.text,
            href: link.href,
            error: 'Dẫn tới trang 404 Không tìm thấy',
          });
        }
      } catch (err) {
        results.brokenLinks.push({
          linkText: link.text,
          href: link.href,
          error: err.message,
        });
      }
    }
  }

  // 2. Kiểm tra Form Profile Edit (Chỉnh sửa hồ sơ)
  console.log('--- 2. Kiểm tra Form Chỉnh sửa hồ sơ & Edge cases ---');
  await page.goto(`${BASE_URL}/#profile?tab=settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Test 2.1: Bỏ trống họ tên
  const emptyNameResult = await page.evaluate(async () => {
    const nameInput = document.querySelector('input[value*="Duy"], .ns9-pe-input');
    if (!nameInput) return 'Không tìm thấy input tên';
    const original = nameInput.value;
    
    // Gán rỗng
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(nameInput, '');
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Bấm lưu
    const saveBtn = document.querySelector('button[type="submit"], .ns9-pe-save-btn');
    let alertMsg = '';
    window.alert = (msg) => { alertMsg = msg; };
    if (saveBtn) saveBtn.click();
    
    return { alertMsg, nameVal: nameInput.value };
  });
  if (!emptyNameResult.alertMsg) {
    results.formBugs.push({
      form: 'Chỉnh sửa hồ sơ',
      issue: 'Cho phép hoặc không cảnh báo khi bỏ trống Họ tên',
      details: emptyNameResult,
    });
  }

  // Test 2.2: XSS Payload vào họ tên
  const xssResult = await page.evaluate(async () => {
    const nameInput = document.querySelector('input.ns9-pe-input');
    if (!nameInput) return 'No name input';
    const payload = '<script>window.__xss_vuln=true</script><b>In đậm</b>';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(nameInput, payload);
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    const saveBtn = document.querySelector('.ns9-pe-save-btn');
    if (saveBtn) saveBtn.click();
    await new Promise(r => setTimeout(r, 400));
    return {
      xssExecuted: window.__xss_vuln === true,
      hasRawTag: document.querySelector('.ns9-pe-name')?.innerHTML?.includes('<script>'),
    };
  });
  if (xssResult.xssExecuted) {
    results.formBugs.push({
      form: 'Chỉnh sửa hồ sơ',
      issue: 'Lỗ hổng XSS: Mã JavaScript trong input Họ tên được thực thi!',
      severity: 'Critical',
    });
  }

  // 3. Kiểm tra Độ tương phản màu sắc (WCAG AA Contrast)
  console.log('--- 3. Kiểm tra Độ tương phản (Contrast Ratio) ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle' });
  const contrastIssues = await page.evaluate(() => {
    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrast(rgb1, rgb2) {
      const lum1 = getLuminance(...rgb1);
      const lum2 = getLuminance(...rgb2);
      return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    }

    function parseRgb(str) {
      const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
    }

    const lowContrastElements = [];
    const elements = Array.from(document.querySelectorAll('p, span, small, label, h1, h2, h3, h4, button, a')).slice(0, 100);
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const color = parseRgb(style.color);
      let bg = parseRgb(style.backgroundColor);
      if (!bg || (bg[0] === 0 && bg[1] === 0 && bg[2] === 0 && style.backgroundColor.includes('rgba(0, 0, 0, 0)'))) {
        bg = [255, 255, 255]; // fallback light bg
      }
      if (color && bg) {
        const ratio = getContrast(color, bg);
        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight) >= 700;
        const minRatio = (fontSize >= 18 || (fontSize >= 14 && isBold)) ? 3.0 : 4.5;
        if (ratio < minRatio && el.innerText.trim().length > 3) {
          lowContrastElements.push({
            tag: el.tagName.toLowerCase(),
            text: el.innerText.trim().slice(0, 30),
            ratio: ratio.toFixed(2),
            minRatio,
            color: style.color,
            bg: style.backgroundColor,
          });
          if (lowContrastElements.length >= 8) break;
        }
      }
    }
    return lowContrastElements;
  });
  results.contrastBugs = contrastIssues;

  // 4. Kiểm tra Z-Index & Sticky Collisions trên Mobile 360px
  console.log('--- 4. Kiểm tra Z-Index & Va chạm UI trên Mobile ---');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const mobileCollisions = await page.evaluate(() => {
    const bottomNav = document.querySelector('.bottom-nav, .mobile-bottom-nav');
    const floatingWidgets = Array.from(document.querySelectorAll('.pet-widget, .chat-widget, [class*="mascot"], .chibi-wrap, [class*="chat-btn"]'));
    const collisions = [];
    if (bottomNav) {
      const navRect = bottomNav.getBoundingClientRect();
      for (const w of floatingWidgets) {
        const wRect = w.getBoundingClientRect();
        if (wRect.bottom > navRect.top && wRect.top < navRect.bottom) {
          collisions.push({
            widget: w.className,
            overlapBottomNav: true,
            navTop: navRect.top,
            widgetBottom: wRect.bottom,
          });
        }
      }
    }
    return collisions;
  });
  results.overlapBugs = mobileCollisions;

  // 5. Kiểm tra Dark Mode trên nhiều trang
  console.log('--- 5. Kiểm tra Dark Mode ---');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  });
  await page.waitForTimeout(300);
  const darkCardCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.pf-m-card, .tool-card, .quiz-card, .roadmap-node-card')).slice(0, 10);
    const unadapted = [];
    for (const card of cards) {
      const style = window.getComputedStyle(card);
      const bg = style.backgroundColor;
      if (bg === 'rgb(255, 255, 255)' || bg === '#ffffff') {
        unadapted.push({
          class: card.className,
          bg,
        });
      }
    }
    return unadapted;
  });
  results.darkModeUnadapted = darkCardCheck;

  await browser.close();

  const deepReportPath = path.join(EVIDENCE_DIR, 'deep_audit_results.json');
  fs.writeFileSync(deepReportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log('✅ Hoàn tất đợt deep audit!');
  console.log(JSON.stringify(results, null, 2));
}

runDeepAudit().catch(err => {
  console.error('Lỗi deep audit:', err);
});
