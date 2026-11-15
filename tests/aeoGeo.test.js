import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

const EXPECTED_SEO_SLUGS = [
  'tro-ly-ai-giai-hoa',
  'phong-thi-ao',
  'bang-tuan-hoan',
  'can-bang-phuong-trinh-hoa-hoc',
  'lo-trinh-on-thi-thpt-quoc-gia',
  'cong-thuc-hoa-hoc',
  'tai-lieu-hoa-hoc',
  'tinh-diem-xet-tuyen-dai-hoc',
  'tra-cuu-diem-chuan',
  'dinh-huong-nghe-nghiep',
  'tro-choi-khoa-hoc',
  'ai-doc-studio',
  'bang-phan-tuong-tac',
  'quiz',
  'bang-xep-hang',
];

describe('AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization)', () => {
  it('provides valid llmstxt.org compliant llms.txt and llms-full.txt', () => {
    const llmsTxt = fs.readFileSync(path.join(PUBLIC_DIR, 'llms.txt'), 'utf8');
    const llmsFullTxt = fs.readFileSync(path.join(PUBLIC_DIR, 'llms-full.txt'), 'utf8');

    expect(llmsTxt.startsWith('# ELEC Science AI')).toBe(true);
    expect(llmsTxt).toContain('> ELEC Science AI');
    expect(llmsTxt).toContain('[Tài liệu toàn diện ELEC Science AI (LLMs Full Knowledge Base)](https://www.elecai.id.vn/llms-full.txt)');
    expect(llmsTxt).toContain('Nguyễn Thế Duy');

    for (const slug of EXPECTED_SEO_SLUGS) {
      expect(llmsTxt).toContain(`(https://www.elecai.id.vn/${slug})`);
      expect(llmsFullTxt).toContain(`https://www.elecai.id.vn/${slug}`);
    }

    expect(llmsFullTxt.length).toBeGreaterThan(8000);
    expect(llmsFullTxt).toContain('Phần I — Trắc nghiệm nhiều phương án lựa chọn');
    expect(llmsFullTxt).toContain('Phần II — Trắc nghiệm Đúng/Sai');
    expect(llmsFullTxt).toContain('Phần III — Trắc nghiệm trả lời ngắn');
    expect(llmsFullTxt).toContain('SuperMemo SM-2');
    expect(llmsFullTxt).toContain('IUPAC');
  });

  it('allows major Search & AI Generative crawlers in robots.txt', () => {
    const robots = fs.readFileSync(path.join(PUBLIC_DIR, 'robots.txt'), 'utf8');
    const requiredBots = [
      'Googlebot',
      'Bingbot',
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'Claude-Web',
      'PerplexityBot',
      'Perplexity-User',
      'Google-Extended',
      'Applebot-Extended',
      'Meta-ExternalAgent',
      'DuckAssistBot',
    ];
    for (const bot of requiredBots) {
      expect(robots).toContain(`User-agent: ${bot}`);
    }
    expect(robots).toContain('Allow: /llms.txt');
    expect(robots).toContain('Allow: /llms-full.txt');
    expect(robots).toContain('Sitemap: https://www.elecai.id.vn/sitemap.xml');
  });

  it('includes all routes and LLM context files in sitemap.xml and vercel.json', () => {
    const sitemap = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://www.elecai.id.vn/llms.txt</loc>');
    expect(sitemap).toContain('<loc>https://www.elecai.id.vn/llms-full.txt</loc>');
    for (const slug of EXPECTED_SEO_SLUGS) {
      expect(sitemap).toContain(`<loc>https://www.elecai.id.vn/${slug}</loc>`);
    }

    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const fallbackRewrite = vercelConfig.rewrites.find((r) => r.destination === '/index.html');
    expect(fallbackRewrite.source).toContain('llms\\.txt');
    expect(fallbackRewrite.source).toContain('llms-full\\.txt');
  });

  it('validates index.html AEO/GEO structured data, Speakable, HowTo, and Fact Sheet', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(indexHtml).toContain('href="https://www.elecai.id.vn/llms.txt"');
    expect(indexHtml).toContain('href="https://www.elecai.id.vn/llms-full.txt"');
    expect(indexHtml).toContain('id="aeo-direct-answer"');
    expect(indexHtml).toContain('id="geo-fact-sheet"');
    expect(indexHtml).toContain('id="aeo-faq"');

    const ldMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(ldMatch).toBeTruthy();
    const ld = JSON.parse(ldMatch[1]);
    const types = ld['@graph'].flatMap((node) => (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]));
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
    expect(types).toContain('Person');
    expect(types).toContain('EducationalOrganization');
    expect(types).toContain('SoftwareApplication');
    expect(types).toContain('HowTo');
    expect(types).toContain('ItemList');
    expect(types).toContain('Course');
    expect(types).toContain('FAQPage');

    const webPage = ld['@graph'].find((n) => n['@type'] === 'WebPage');
    expect(webPage.speakable['@type']).toBe('SpeakableSpecification');

    const faqPage = ld['@graph'].find((n) => n['@type'] === 'FAQPage');
    expect(faqPage.mainEntity.length).toBeGreaterThanOrEqual(10);
  });

  it('validates all 15 prerendered route HTML files in dist/', () => {
    if (!fs.existsSync(DIST_DIR)) return;
    for (const slug of EXPECTED_SEO_SLUGS) {
      const filePath = path.join(DIST_DIR, `${slug}.html`);
      expect(fs.existsSync(filePath)).toBe(true);
      const html = fs.readFileSync(filePath, 'utf8');
      expect(html).toContain(`<link rel="canonical" href="https://www.elecai.id.vn/${slug}" />`);
      expect(html).toContain('id="aeo-direct-answer"');
      expect(html).toContain('id="geo-key-specs"');
      expect(html).toContain('id="route-faq"');

      const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(ldMatch).toBeTruthy();
      const ld = JSON.parse(ldMatch[1]);
      const types = ld['@graph'].flatMap((node) => (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]));
      expect(types).toContain('WebPage');
      expect(types).toContain('SoftwareApplication');
      expect(types).toContain('HowTo');
      expect(types).toContain('BreadcrumbList');
      expect(types).toContain('FAQPage');
    }
  });

  it('validates static HTML pages (gioi-thieu, nha-sang-lap, chinh-sach-bao-mat, dieu-khoan-su-dung)', () => {
    const staticPages = ['gioi-thieu.html', 'nha-sang-lap.html', 'chinh-sach-bao-mat.html', 'dieu-khoan-su-dung.html'];
    for (const file of staticPages) {
      const html = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
      expect(html).toContain('href="https://www.elecai.id.vn/llms.txt"');
      expect(html).toContain('href="https://www.elecai.id.vn/llms-full.txt"');
      const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(ldMatch).toBeTruthy();
      const ld = JSON.parse(ldMatch[1]);
      expect(Array.isArray(ld['@graph'])).toBe(true);
    }
  });
});
