import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSchools,
  getMajorsBySchool,
  getMajorById,
  getUnifiedAdmissionCatalog,
  getUserAspirationsState,
  getDetailedAdmissionScheme,
} from '../src/lib/aspirationService.js';
import { getUniversityCover, getUniversityInfo } from '../src/data/universityCovers.js';
import {
  getUniversityMascotOutfits,
  getSavedMascotOutfit,
  saveMascotOutfit,
  resolveCornerMascotOutfit,
} from '../src/components/PetSkins.jsx';
import {
  calculateMoetPriorityScore,
  convertExamScoreEquivalence,
  computeMajorAdmissionChance,
  inferOptimalBlocksFromSubjects,
  buildDeepRiasecReport,
  buildRecommended3TierPortfolio,
  pinMajorToAspirationSlot,
} from '../src/lib/admissionCareerEngine.js';
import { loadTargetUniversity } from '../src/lib/studentAnalytics.js';
import { evaluatePortfolioHealth } from '../src/lib/aspirationPortfolioOptimizer.js';
import {
  KNOWLEDGE_PROGRAMMES,
  KNOWLEDGE_SHELF_TIERS,
  DETAILED_TEXTBOOK_CURRICULA,
  getAllKnowledgeVolumes,
  getDetailedBookCurriculum,
} from '../src/data/aiducationKnowledgeLibrary.js';

describe('9Study Pro Upgrade — Định hướng Nghề nghiệp AI & Xét Nguyện vọng Đại học', () => {
  let memoryStore = {};

  beforeEach(() => {
    memoryStore = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
      setItem: (k, v) => { memoryStore[k] = String(v); },
      removeItem: (k) => { delete memoryStore[k]; },
    });
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
        setItem: (k, v) => { memoryStore[k] = String(v); },
        removeItem: (k) => { delete memoryStore[k]; },
      },
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      CustomEvent: class CustomEvent {
        constructor(type, detail) {
          this.type = type;
          this.detail = detail?.detail;
        }
      },
      Event: class Event {
        constructor(type) {
          this.type = type;
        }
      },
    });
  });

  it('100% trong 105 trường Đại học đều có danh sách ngành đào tạo đầy đủ (không còn trường nào bị rỗng ngành)', () => {
    const schools = getSchools();
    expect(schools.length).toBeGreaterThanOrEqual(100);

    const emptySchools = schools.filter((s) => getMajorsBySchool(s.id).length === 0);
    expect(emptySchools).toHaveLength(0);

    // Kiểm tra các trường từng bị thiếu trong referenceData.majors như FTU, UEH, TMA, HTC, CSND
    expect(getMajorsBySchool('FTU').length).toBeGreaterThanOrEqual(3);
    expect(getMajorsBySchool('UEH').length).toBeGreaterThanOrEqual(3);
    expect(getMajorsBySchool('TMA').length).toBeGreaterThanOrEqual(3);
    expect(getMajorsBySchool('CSND').length).toBeGreaterThanOrEqual(3);

    const catalog = getUnifiedAdmissionCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(300);
    expect(getMajorById('ftu-ktdn')).toBeTruthy();
  });

  it('calculateMoetPriorityScore tính đúng công thức giảm tuyến tính điểm ưu tiên từ mốc 22.5đ của Bộ GD&ĐT', () => {
    // Dưới 22.5đ: hưởng trọn 100% mức ưu tiên (KV1 = 0.75 + ƯT1 = 2.0 -> +2.75đ)
    const under225 = calculateMoetPriorityScore({
      rawScore30: 21.0,
      areaId: 'KV1',
      groupId: 'UT1',
    });
    expect(under225.basePriority).toBe(2.75);
    expect(under225.effectivePriority).toBe(2.75);
    expect(under225.isReduced).toBe(false);
    expect(under225.finalScore30).toBe(23.75);

    // Từ 22.5đ trở lên: Điểm ƯT = [(30 - 26.25) / 7.5] * 0.75 = 0.5 * 0.75 = 0.38đ
    const above225 = calculateMoetPriorityScore({
      rawScore30: 26.25,
      areaId: 'KV1',
      groupId: 'NONE',
    });
    expect(above225.isReduced).toBe(true);
    expect(above225.effectivePriority).toBe(0.38);
    expect(above225.finalScore30).toBe(26.63);
  });

  it('convertExamScoreEquivalence quy đổi chuẩn xác giữa 6 kỳ thi THPTQG, HSA, TSA, V-ACT, SPT, H-SCA', () => {
    const eq = convertExamScoreEquivalence(27.0, 'THPTQG');
    expect(eq).toBeTruthy();
    expect(eq.percentile).toBeGreaterThan(90);
    expect(eq.equivalents.HSA).toBeGreaterThanOrEqual(100);
    expect(eq.equivalents.TSA).toBeGreaterThanOrEqual(70);
    expect(eq.equivalents['V-ACT']).toBeGreaterThanOrEqual(900);
  });

  it('buildDeepRiasecReport phân tích đầy đủ 6 trục Holland, tổ hợp GDPT 2018 (kể cả X06/X26) và gợi ý trường khớp điểm', () => {
    const blocks = inferOptimalBlocksFromSubjects(['Toán', 'Vật lý', 'Tin học', 'Hóa học']);
    expect(blocks.some((b) => b.code === 'A00')).toBe(true);
    expect(blocks.some((b) => b.code === 'X06')).toBe(true);

    const catalog = getUnifiedAdmissionCatalog();
    const report = buildDeepRiasecReport({
      riasecScores: { I: 19, R: 17, C: 13, S: 9, E: 8, A: 7 },
      subjects: ['Toán', 'Vật lý', 'Hóa học', 'Tin học'],
      goal: 'Làm chủ công nghệ lõi (AI, Bán dẫn, Khoa học dữ liệu, Kỹ thuật)',
      predictedScore30: 27.2,
      preferredRegion: 'Miền Bắc',
      cutoffCatalog: catalog,
    });

    expect(report.hollandCode).toBe('I-R-C');
    expect(report.dimensions).toHaveLength(6);
    expect(report.groups).toHaveLength(3);
    expect(report.groups[0].match).toBeGreaterThanOrEqual(80);
    expect(report.matchedMajors.length).toBeGreaterThanOrEqual(5);
  });

  it('buildRecommended3TierPortfolio & pinMajorToAspirationSlot thiết lập Rổ 3 Nguyện vọng Vàng không bị nghịch đảo và đồng bộ 2 chiều', () => {
    const catalog = getUnifiedAdmissionCatalog();
    const threeTiers = buildRecommended3TierPortfolio({
      score30: 26.0,
      group: 'Kỹ thuật - Công nghệ',
      city: 'Hà Nội',
      catalog,
    });

    expect(threeTiers).toHaveLength(3);
    threeTiers.forEach((rec, idx) => {
      pinMajorToAspirationSlot('student-9study', rec, idx + 1, 'THPTQG');
    });

    const state = getUserAspirationsState('student-9study');
    expect(state.aspirations).toHaveLength(3);
    expect(state.aspirations.map((a) => a.priority)).toEqual([1, 2, 3]);

    // Kiểm tra đồng bộ sang saveTargetUniversity (NV1)
    const pinnedNv1 = loadTargetUniversity('student-9study');
    expect(pinnedNv1).toBeTruthy();
    expect(pinnedNv1.id).toBe(threeTiers[0].id);

    // Kiểm tra sức khỏe danh mục không bị nghịch đảo thứ tự
    const health = evaluatePortfolioHealth(state.aspirations, 26.0, 30);
    expect(health.hasInversion).toBe(false);
    expect(health.hasSafetyNet).toBe(true);
    expect(health.healthScore).toBeGreaterThanOrEqual(80);
  });

  it('100% trong 105 trường Đại học đều có ảnh khuôn viên WebP thật trong public/img/universities/ và đầy đủ hồ sơ 6 tab tuyển sinh 2026', () => {
    const schools = getSchools();
    expect(schools.length).toBe(105);

    const publicDir = path.resolve(process.cwd(), 'public');
    const distinctCovers = new Set();

    for (const s of schools) {
      const cover = getUniversityCover(s.id);
      expect(cover).toMatch(/^\/img\/universities\/[a-z0-9_-]+\.webp$/i);
      distinctCovers.add(cover);

      const diskPath = path.join(publicDir, cover.replace(/^\//, ''));
      expect(fs.existsSync(diskPath), `Missing image on disk for ${s.id}: ${diskPath}`).toBe(true);
      const stat = fs.statSync(diskPath);
      expect(stat.size).toBeGreaterThan(5000);

      const info = getUniversityInfo(s.id);
      expect(info.location.length).toBeGreaterThan(5);
      expect(info.foundedYear).toBeGreaterThanOrEqual(1898);
      expect(info.studentScale).toBeTruthy();
      expect(info.employmentRate).toMatch(/%/);
      expect(info.highlights.length).toBeGreaterThanOrEqual(3);

      const scheme = getDetailedAdmissionScheme(s.id);
      expect(scheme).toBeTruthy();
      expect(scheme.contact.address.length).toBeGreaterThan(5);
      expect(scheme.contact.website).toMatch(/^https?:\/\//);
      expect(scheme.contact.hotline).toBeTruthy();
      expect(scheme.contact.email).toMatch(/@/);
      expect(scheme.tuition.standard).toBeTruthy();
      expect(scheme.tuition.dormitory).toBeTruthy();
    }

    // Toàn bộ 105 trường có 105 ảnh riêng biệt, không dùng chung ảnh fallback
    expect(distinctCovers.size).toBe(105);
  });

  it('Tủ đồ Linh vật ELEC AI có đầy đủ 105 trang phục đồng phục trường ĐH tách nền sạch và đồng bộ Auto-NV1', () => {
    const outfits = getUniversityMascotOutfits();
    expect(outfits).toHaveLength(105);

    const publicDir = path.resolve(process.cwd(), 'public');
    for (const o of outfits) {
      expect(o.src).toMatch(/^\/img\/elec\/outfits\/[a-z0-9_-]+\.webp$/i);
      const diskPath = path.join(publicDir, o.src.replace(/^\//, ''));
      expect(fs.existsSync(diskPath), `Missing mascot outfit for ${o.schoolId}: ${diskPath}`).toBe(true);
      const stat = fs.statSync(diskPath);
      expect(stat.size).toBeGreaterThan(2000);
    }

    // Kiểm tra chế độ Auto NV1
    const autoResolved = resolveCornerMascotOutfit({
      outfitConfig: { mode: 'auto_nv1', value: 'hello' },
      nv1SchoolCode: 'BKA',
    });
    expect(autoResolved.schoolId).toBe('BKA');
    expect(autoResolved.src).toBe('/img/elec/outfits/bka.webp');

    // Kiểm tra lưu và đọc trang phục trường tự chọn (VD: Học viện Hàng Hải HHA)
    saveMascotOutfit('student-9study', { mode: 'uni', value: 'HHA' });
    const saved = getSavedMascotOutfit('student-9study');
    expect(saved).toEqual({ mode: 'uni', value: 'HHA' });

    const uniResolved = resolveCornerMascotOutfit({
      outfitConfig: saved,
      nv1SchoolCode: 'NEU',
    });
    expect(uniResolved.schoolId).toBe('HHA');
    expect(uniResolved.src).toBe('/img/elec/outfits/hha.webp');
  });

  it('cung cấp trọn bộ Thư viện Giáo trình KHTN ELEC AI (100% Hoá - Lý - Sinh · 5 chuyên khoa · 16 đầu sách)', () => {
    expect(KNOWLEDGE_PROGRAMMES).toHaveLength(5);
    expect(KNOWLEDGE_SHELF_TIERS).toHaveLength(5);

    const allVolumes = getAllKnowledgeVolumes();
    expect(allVolumes.length).toBeGreaterThanOrEqual(16);

    for (const vol of allVolumes) {
      expect(vol.slug).toBeTruthy();
      expect(vol.title).toBeTruthy();
      expect(vol.chapters).toBeGreaterThan(0);
      expect(vol.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(['hoa', 'ly', 'sinh']).toContain(vol.subjectKey);
    }

    // Kiểm tra Hoá Đại Cương — Vô Cơ (3 Phần · 10 Chương)
    const hoaVoCoVol = allVolumes.find((v) => v.slug === 'hoa-dai-cuong-vo-co');
    expect(hoaVoCoVol).toBeTruthy();
    const hoaVoCoBook = getDetailedBookCurriculum(hoaVoCoVol);
    expect(hoaVoCoBook.parts).toHaveLength(3);
    expect(hoaVoCoBook.parts.reduce((s, p) => s + p.chapters.length, 0)).toBe(10);

    // Kiểm tra Hoá Hữu Cơ Toàn Tập (4 Phần · 40 Chương)
    const hoaHuuCoVol = allVolumes.find((v) => v.slug === 'hoa-huu-co');
    expect(hoaHuuCoVol).toBeTruthy();
    const hoaHuuCoBook = getDetailedBookCurriculum(hoaHuuCoVol);
    expect(hoaHuuCoBook.parts).toHaveLength(4);
    expect(hoaHuuCoBook.parts.reduce((s, p) => s + p.chapters.length, 0)).toBe(40);

    // Kiểm tra Sinh học Đại cương (4 Phần · 21 Chương)
    const sinhDcVol = allVolumes.find((v) => v.slug === 'sinh-hoc-dai-cuong');
    expect(sinhDcVol).toBeTruthy();
    const sinhDcBook = getDetailedBookCurriculum(sinhDcVol);
    expect(sinhDcBook.parts).toHaveLength(4);
    expect(sinhDcBook.parts.reduce((s, p) => s + p.chapters.length, 0)).toBe(21);

    // Kiểm tra sách KHTN THPT GDPT 2018 đồng bộ trực tiếp từ Dedicated Lessons & DAG
    const hoa12Vol = allVolumes.find((v) => v.slug === 'hoa-hoc-12');
    expect(hoa12Vol).toBeTruthy();
    const hoa12Book = getDetailedBookCurriculum(hoa12Vol);
    expect(hoa12Book.parts.length).toBeGreaterThanOrEqual(2);
    expect(hoa12Book.parts[0].chapters[0].sections.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(DETAILED_TEXTBOOK_CURRICULA)).toEqual(
      expect.arrayContaining(['hoa-dai-cuong-vo-co', 'hoa-huu-co', 'sinh-hoc-dai-cuong']),
    );
  });
});
