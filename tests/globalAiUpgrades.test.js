import { describe, it, expect } from 'vitest';
import { parseCheckpointFromText } from '../src/components/SocraticCheckpointCard.jsx';
import { CHALKBOARD_PRESETS } from '../src/lib/chalkboardPresets.js';
import { formatDocsPromptBlock, isDocumentFile } from '../src/lib/docChatReader.js';
import { buildSystemPrompt } from '../src/lib/aiPrompts.js';
import { retrieve } from '../src/lib/aiKnowledge.js';
import { ROUTER_DEFAULTS } from '../src/lib/aiRouter.js';
import { BIOLOGY_CORPUS } from '../src/data/biologyCorpus.js';
import { BIOLOGY_EXAM_2026_OFFICIAL } from '../src/data/scienceExamQuestions.js';
import {
  populationSelfing,
  geneLinkageCrossing,
  cellDivisionMitosis,
  microbialGrowth,
  runScientificTools,
} from '../src/lib/scientificTools.js';

describe('Global AI Flagship Upgrades (All 5 Features)', () => {
  it('parses ```checkpoint JSON cleanly for Socratic Study Mode and strips raw block', () => {
    const raw = `Gợi ý bước 1: Tính số mol electron Fe nhường.
\`\`\`checkpoint
{
  "question": "0,1 mol Fe lên Fe³⁺ nhường bao nhiêu mol electron?",
  "options": ["0,1 mol", "0,2 mol", "0,3 mol", "0,4 mol"],
  "correct": 2,
  "hint": "Fe -> Fe3+ + 3e",
  "nextPrompt": "Mình ra 0,3 mol e!"
}
\`\`\``;
    const { cleanText, checkpoint } = parseCheckpointFromText(raw);
    expect(cleanText).toContain('Gợi ý bước 1');
    expect(cleanText).not.toContain('```checkpoint');
    expect(checkpoint?.correct).toBe(2);
    expect(checkpoint?.options).toHaveLength(4);
  });

  it('computes live resonance and impedance on Fresnel RLC interactive sliders', () => {
    const rlc = CHALKBOARD_PRESETS.find((p) => p.id === 'fresnel-rlc');
    expect(rlc?.params?.length).toBe(3);
    const res = rlc.buildDynamic({ R: 60, ZL: 80, ZC: 80 });
    expect(res.lenh.length).toBeGreaterThan(5);
    const cosPhiItem = res.readout.find((r) => r.label.includes('cos'));
    expect(cosPhiItem?.highlight).toBe(true);
    expect(cosPhiItem?.value).toContain('CỘNG HƯỞNG');
  });

  it('computes live inclined-plane acceleration and static friction stop', () => {
    const inc = CHALKBOARD_PRESETS.find((p) => p.id === 'inclined-plane');
    const sliding = inc.buildDynamic({ alpha: 45, mu: 0.1 });
    expect(sliding.readout.find((r) => r.label.includes('Gia tốc'))?.value).toContain('m/s²');
    const stuck = inc.buildDynamic({ alpha: 15, mu: 0.7 });
    expect(stuck.readout.find((r) => r.label.includes('Gia tốc'))?.value).toContain('Đứng yên');
  });

  it('computes live 3D pyramid section & parabola tangent dynamically', () => {
    const pyr = CHALKBOARD_PRESETS.find((p) => p.id === 'pyramid-section');
    const pDyn = pyr.buildDynamic({ h: 6.0, ratio: 0.5 });
    expect(pDyn.lenh.some((l) => l.includes('S = (0.2, 0.4, 6)'))).toBe(true);

    const para = CHALKBOARD_PRESETS.find((p) => p.id === 'parabola-oxy');
    const paDyn = para.buildDynamic({ a: 1, x0: 2 });
    expect(paDyn.readout.find((r) => r.label.includes('Đỉnh'))?.value).toBe('(1; -4)');
  });

  it('detects document files and builds Perplexity-style citation prompt block', () => {
    expect(isDocumentFile({ name: 'De-cuong-Hoa-12.pdf', type: 'application/pdf' })).toBe(true);
    expect(isDocumentFile({ name: 'Bai-tap.docx', type: '' })).toBe(true);
    expect(isDocumentFile({ name: 'photo.png', type: 'image/png' })).toBe(false);

    const block = formatDocsPromptBlock([
      { name: 'De-cuong-Ly.pdf', metaLabel: '5 trang', text: '[Trang 1]\nDao động điều hòa x = Acos(ωt + φ)' },
    ]);
    expect(block).toContain('[Trang 1]');
    expect(block).toContain('[Trang X]');
  });

  it('context-gates system prompt to eliminate ~70% bloat on pure STEM queries while keeping drawing/quiz when needed', () => {
    const bioPrompt = buildSystemPrompt({ query: 'Phân biệt nhân đôi ADN, phiên mã và dịch mã' });
    expect(bioPrompt).not.toContain('CHALKBOARD-MV');
    expect(bioPrompt).not.toContain('```quiz');
    expect(bioPrompt).not.toContain('APP_GUIDE');

    const drawPrompt = buildSystemPrompt({ query: 'Vẽ hình chóp S.ABC tìm thiết diện mặt phẳng (MNP)' });
    expect(drawPrompt).toContain('CHALKBOARD-MV');

    const quizPrompt = buildSystemPrompt({ query: 'Tạo đề trắc nghiệm 5 câu Hóa học lớp 12' });
    expect(quizPrompt).toContain('```quiz');
  });

  it('prevents noisy RAG pollution (App Guide & cross-subject Physics/Chemistry) on Biology queries while routing live Gemini 3 & Groq models', () => {
    const hits = retrieve('Phân biệt nhân đôi ADN, phiên mã và dịch mã trong tế bào');
    expect(hits.some((h) => h.kind === 'feature')).toBe(false);
    expect(hits.some((h) => h.id === 'formula:ph' || h.id.startsWith('formula:ly-'))).toBe(false);
    expect(hits.some((h) => h.id.includes('sinh') || h.kind === 'biology')).toBe(true);
    expect(ROUTER_DEFAULTS.gemini.smart[0]).toBe('gemini-3-flash-preview');
    expect(ROUTER_DEFAULTS.groq.smart[0]).toBe('openai/gpt-oss-120b');
  });

  it('indexes full Tài liệu Sinh học ELEC AI corpus (10, 11, 12 & Exam 2026) and runs deterministic Biology calculators', () => {
    expect(BIOLOGY_CORPUS.length).toBeGreaterThanOrEqual(12);
    expect(BIOLOGY_EXAM_2026_OFFICIAL).toHaveLength(28);

    const operonHits = retrieve('Cơ chế điều hòa biểu hiện gene Operon Lac ở E. coli khi có lactose');
    expect(operonHits.some((h) => h.id.includes('operon-lac'))).toBe(true);

    const pedigreeHits = retrieve('Phương pháp giải bài toán phả hệ bệnh bạch tạng và hội chứng Down');
    expect(pedigreeHits.some((h) => h.id.includes('pedigree'))).toBe(true);

    const selfing = populationSelfing({ d: 0.2, h: 0.8, r: 0, generations: 3 });
    expect(selfing.Aa).toBe(0.1);
    expect(selfing.AA).toBe(0.55);

    const hvg = geneLinkageCrossing({ f: 20 });
    expect(hvg.linkedGamete).toBe(0.4);
    expect(hvg.cisSelfCross.A_B_).toBe(0.66);

    const mit = cellDivisionMitosis({ cells: 3, twoN: 8, k: 5 });
    expect(mit.daughterCells).toBe(96);
    expect(mit.envChromosomes).toBe(744);

    const vsv = microbialGrowth({ N0: 10000, timeMin: 120, genTimeMin: 20 });
    expect(vsv.Nt).toBe(640000);

    const toolRun = runScientificTools('Cho quần thể 0,2 AA : 0,8 Aa tự thụ phấn qua 3 thế hệ. Tính tỉ lệ kiểu gene ở F3.');
    expect(toolRun.hits.some((h) => h.tool === 'population_selfing')).toBe(true);
  });
});
