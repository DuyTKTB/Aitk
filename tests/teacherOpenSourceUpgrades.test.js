import { describe, it, expect } from 'vitest';
import { analyzeExamPsychometrics, interpretCronbachAlpha } from '../src/lib/examPsychometrics.js';
import {
  detectLmsFormat,
  parseMoodleXml,
  parseAikenText,
  parseGiftText,
  parseSpreadsheetQuestions,
  exportToMoodleXml,
  exportToAnkiDeckTsv,
  buildKahootSpreadsheetRows,
} from '../src/lib/lmsQuizFormats.js';
import { auditExamQuality, balanceMcqAnswerPositions } from '../src/lib/examQualityAudit.js';
import { detectExamCollusion, computeEssaySimilarity } from '../src/lib/examCollusionDetector.js';
import {
  generateAntiCheatSeating,
  generateBalancedGroups,
  formatGroupsForZalo,
  pickFairRandomStudent,
} from '../src/lib/classroomToolkitEngine.js';
import { parseJsonLoose } from '../src/lib/examAiUtils.js';
import { convertOmmlNode } from '../src/lib/examDocxParser.js';

describe('1. Exam Psychometrics CTT (Moodle Quiz Statistics Standard)', () => {
  it('computes Cronbach alpha, difficulty p, discrimination D, r_pb and flags suspect negative-D keys', () => {
    const exam = {
      id: 'ex_ctt_1',
      title: 'Kiểm tra Hóa 12',
      questions: [
        { type: 'single_choice', q: 'Câu 1: Chuẩn tốt', options: ['A1', 'B1', 'C1', 'D1'], correct: 0 },
        { type: 'single_choice', q: 'Câu 2: Chuẩn tốt', options: ['A2', 'B2', 'C2', 'D2'], correct: 1 },
        { type: 'single_choice', q: 'Câu 3: Chuẩn tốt', options: ['A3', 'B3', 'C3', 'D3'], correct: 2 },
        { type: 'single_choice', q: 'Câu 4: Sai đáp án ngược', options: ['A4', 'B4', 'C4', 'D4'], correct: 3 },
      ],
    };

    // 8 học sinh: 4 em giỏi đúng câu 1-3 nhưng sai câu 4; 4 em yếu sai câu 1-3 nhưng khoanh trúng câu 4
    const subs = [
      // Nhóm giỏi
      { score: 3, totalPoints: 4, detail: [{ isCorrect: true, chosen: 0 }, { isCorrect: true, chosen: 1 }, { isCorrect: true, chosen: 2 }, { isCorrect: false, chosen: 0 }] },
      { score: 3, totalPoints: 4, detail: [{ isCorrect: true, chosen: 0 }, { isCorrect: true, chosen: 1 }, { isCorrect: true, chosen: 2 }, { isCorrect: false, chosen: 0 }] },
      { score: 3, totalPoints: 4, detail: [{ isCorrect: true, chosen: 0 }, { isCorrect: true, chosen: 1 }, { isCorrect: true, chosen: 2 }, { isCorrect: false, chosen: 1 }] },
      { score: 2, totalPoints: 4, detail: [{ isCorrect: true, chosen: 0 }, { isCorrect: true, chosen: 1 }, { isCorrect: false, chosen: 0 }, { isCorrect: false, chosen: 0 }] },
      // Nhóm yếu
      { score: 1, totalPoints: 4, detail: [{ isCorrect: false, chosen: 1 }, { isCorrect: false, chosen: 0 }, { isCorrect: false, chosen: 0 }, { isCorrect: true, chosen: 3 }] },
      { score: 1, totalPoints: 4, detail: [{ isCorrect: false, chosen: 1 }, { isCorrect: false, chosen: 0 }, { isCorrect: false, chosen: 1 }, { isCorrect: true, chosen: 3 }] },
      { score: 1, totalPoints: 4, detail: [{ isCorrect: false, chosen: 2 }, { isCorrect: false, chosen: 0 }, { isCorrect: false, chosen: 1 }, { isCorrect: true, chosen: 3 }] },
      { score: 0, totalPoints: 4, detail: [{ isCorrect: false, chosen: 2 }, { isCorrect: false, chosen: 0 }, { isCorrect: false, chosen: 0 }, { isCorrect: false, chosen: 0 }] },
    ];

    const report = analyzeExamPsychometrics(exam, subs);
    expect(report.submissionCount).toBe(8);
    expect(report.questionCount).toBe(4);
    expect(report.items[0].difficulty).toBe(0.5);
    expect(report.items[0].discrimination).toBeGreaterThan(0.5);
    expect(report.items[0].quality.status).toBe('excellent');

    // Câu 4 có độ phân biệt âm -> nghi sai đáp án!
    expect(report.items[3].discrimination).toBeLessThan(0);
    expect(report.items[3].pointBiserial).toBeLessThan(0);
    expect(report.items[3].quality.status).toBe('suspect_key');
    expect(report.suspectKeyCount).toBe(1);

    // Distractor analysis: phương án D (idx 3) của câu 1 không ai chọn -> dead distractor
    expect(report.items[0].distractors.options[3].isDead).toBe(true);
    expect(interpretCronbachAlpha(0.85).tone).toBe('ex');
  });
});

describe('2. LMS Quiz Formats (Moodle XML, GIFT, Aiken, Spreadsheet)', () => {
  it('round-trips Moodle XML export and import accurately', () => {
    const questions = [
      { num: 1, type: 'single_choice', q: 'Công thức nước là gì?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0, explain: 'Nước gồm 2H và 1O', points: 0.25 },
      { num: 2, type: 'short_answer', q: 'Số proton của Carbon?', answer: '6', explain: 'Z = 6', points: 0.5 },
      { num: 3, type: 'essay', q: 'Trình bày định luật bảo toàn khối lượng.', sampleAnswer: 'Tổng khối lượng chất tham gia bằng sản phẩm.', points: 1 },
    ];
    const xml = exportToMoodleXml({ title: 'Đề Hóa 10', subject: 'Hóa học', questions });
    expect(detectLmsFormat(xml, 'de.xml')).toBe('moodle_xml');

    const parsed = parseMoodleXml(xml);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({ type: 'single_choice', correct: 0, options: ['H2O', 'CO2', 'NaCl', 'O2'] });
    expect(parsed[1]).toMatchObject({ type: 'short_answer', answer: '6' });
    expect(parsed[2]).toMatchObject({ type: 'essay' });
  });

  it('parses Aiken, GIFT, and Excel/CSV spreadsheet formats', () => {
    const aiken = `Thủ đô của Việt Nam là?\nA. TP.HCM\nB. Hà Nội\nC. Đà Nẵng\nD. Huế\nANSWER: B`;
    expect(detectLmsFormat(aiken, 'test.txt')).toBe('aiken');
    const aOut = parseAikenText(aiken);
    expect(aOut).toHaveLength(1);
    expect(aOut[0].correct).toBe(1);

    const gift = `::Q1:: 2 + 3 bằng mấy? { =5 #Chính xác ~4 ~6 ~7 }\n\n::Q2:: Nước sôi ở 100°C tại 1 atm. {TRUE}`;
    expect(detectLmsFormat(gift, 'quiz.gift')).toBe('gift');
    const gOut = parseGiftText(gift);
    expect(gOut).toHaveLength(2);
    expect(gOut[0].correct).toBe(0);
    expect(gOut[1].options).toEqual(['Đúng', 'Sai']);
    expect(gOut[1].correct).toBe(0);

    const rows = [
      ['Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án', 'Giải thích', 'Mức độ'],
      ['Khí nào nhẹ nhất?', 'O2', 'H2', 'N2', 'CO2', 'B', 'M(H2) = 2', 'NB'],
      ['Khối lượng mol của Na?', '', '', '', '', '23', 'Na = 23 g/mol', 'TH'],
    ];
    const sOut = parseSpreadsheetQuestions(rows);
    expect(sOut).toHaveLength(2);
    expect(sOut[0]).toMatchObject({ type: 'single_choice', correct: 1, level: 'nb' });
    expect(sOut[1]).toMatchObject({ type: 'short_answer', answer: '23', level: 'th' });
  });
});

describe('3. Exam Quality Audit & Smart Answer Balancer (0-credit AI guard)', () => {
  it('detects answer bias, length bias, unbalanced LaTeX, duplicate questions and balances A/B/C/D safely', () => {
    const qs = [
      { type: 'single_choice', q: 'Tính $\\frac{1}{2} + 1', options: ['Đáp án đúng rất dài chi tiết đầy đủ giải thích rõ ràng', '1', '2', '3'], correct: 0 },
      { type: 'single_choice', q: 'Chọn phát biểu đúng về kim loại kiềm nhóm IA trong bảng tuần hoàn', options: ['Đúng 2', 'Sai a', 'Sai b', 'Sai c'], correct: 0 },
      { type: 'single_choice', q: 'Chọn phát biểu đúng về kim loại kiềm nhóm IA trong bảng tuần hoàn hóa học', options: ['Đúng 3', 'Sai d', 'Sai e', 'Sai f'], correct: 0 },
      { type: 'single_choice', q: 'Chọn phát biểu đúng về axit mạnh', options: ['Đúng 4', 'Sai g', 'Sai h', 'Cả A và B đều đúng'], correct: 0 },
      { type: 'single_choice', q: 'Câu hỏi thứ năm về dao động điều hòa', options: ['Đúng 5', 'Sai i', 'Sai j', 'Sai k'], correct: 0 },
      { type: 'single_choice', q: 'Câu hỏi thứ sáu về sóng cơ học', options: ['Đúng 6', 'Sai l', 'Sai m', 'Sai n'], correct: 0 },
    ];

    const audit = auditExamQuality(qs);
    expect(audit.answerBias).toBe(true); // 100% đáp án ở A!
    expect(audit.latexErrorIndices).toContain(0);
    expect(audit.lengthBiasIndices).toContain(0);
    expect(audit.duplicatePairs.length).toBeGreaterThanOrEqual(1);

    const balanced = balanceMcqAnswerPositions(qs);
    // Câu index 3 có "Cả A và B đều đúng" nên PHẢI giữ nguyên vị trí
    expect(balanced[3].options[3]).toBe('Cả A và B đều đúng');
    expect(balanced[3].correct).toBe(0);
    // Các câu còn lại phải được phân bố đa dạng hơn thay vì toàn bộ = 0
    const distAfter = auditExamQuality(balanced).answerDistribution;
    expect(distAfter.filter((c) => c > 0).length).toBeGreaterThanOrEqual(3);
  });
});

describe('4. AI JSON Repair (LaTeX + Truncation Salvage) & Extended OMML Math Parser', () => {
  it('preserves LaTeX commands (\\frac, \\text, \\beta, \\rightarrow) and salvages truncated MAX_TOKENS JSON', () => {
    const latexJson = '{"questions":[{"q":"Tính $\\frac{1}{2}$ + $\\beta$ và $\\text{mol}$ \\rightarrow 0","options":["A","B","C","D"],"correct":0,}]}';
    const parsed = parseJsonLoose(latexJson);
    expect(parsed.questions[0].q).toContain('\\frac{1}{2}');
    expect(parsed.questions[0].q).toContain('\\beta');
    expect(parsed.questions[0].q).toContain('\\text{mol}');

    const truncated = '{"meta":{"title":"Đề dài"},"questions":[{"q":"Câu 1 hoàn chỉnh","options":["A","B","C","D"],"correct":1},{"q":"Câu 2 hoàn chỉnh","options":["A","B","C","D"],"correct":2},{"q":"Câu 3 bị cắt dở dang khi chạm MAX_TO';
    const salvaged = parseJsonLoose(truncated);
    expect(salvaged.__salvaged).toBe(true);
    expect(salvaged.questions).toHaveLength(2);
    expect(salvaged.questions[1].correct).toBe(2);
  });

  it('converts extended Word OMML nodes (nth-root, abs delimiter, integral, vector, isotope)', () => {
    const mk = (localName, children = [], attrs = {}) => ({
      localName,
      childNodes: children,
      textContent: typeof children === 'string' ? children : '',
      getAttribute: (k) => attrs[k] ?? null,
      getElementsByTagNameNS: (_ns, name) => {
        const res = [];
        const walk = (n) => {
          if (!n || typeof n !== 'object') return;
          if (n.localName === name) res.push(n);
          if (Array.isArray(n.childNodes)) n.childNodes.forEach(walk);
        };
        if (Array.isArray(children)) children.forEach(walk);
        return res;
      },
    });
    const t = (s) => ({ localName: 't', textContent: s, childNodes: [] });

    // Căn bậc 3: \sqrt[3]{x}
    const rad3 = mk('rad', [mk('deg', [t('3')]), mk('e', [t('x')])]);
    expect(convertOmmlNode(rad3)).toBe('\\sqrt[3]{x}');

    // Giá trị tuyệt đối: |x - 1|
    const absD = mk('d', [
      mk('dPr', [mk('begChr', [], { 'm:val': '|' }), mk('endChr', [], { 'm:val': '|' })]),
      mk('e', [t('x - 1')]),
    ]);
    expect(convertOmmlNode(absD)).toBe('|x - 1|');

    // Tích phân: \int_{0}^{1} x dx
    const integral = mk('nary', [
      mk('naryPr', [mk('chr', [], { 'm:val': '∫' })]),
      mk('sub', [t('0')]),
      mk('sup', [t('1')]),
      mk('e', [t('x dx')]),
    ]);
    expect(convertOmmlNode(integral)).toBe('\\int_{0}^{1} x dx');

    // Vector: \vec{a}
    const vec = mk('acc', [
      mk('accPr', [mk('chr', [], { 'm:val': '\u20D7' })]),
      mk('e', [t('a')]),
    ]);
    expect(convertOmmlNode(vec)).toBe('\\vec{a}');

    // Đồng vị: {}^{14}_{6}C
    const iso = mk('sPre', [mk('sub', [t('6')]), mk('sup', [t('14')]), mk('e', [t('C')])]);
    expect(convertOmmlNode(iso)).toBe('{}^{14}_{6}C');
  });
});

describe('5. Exam Collusion Detector (Harpp-Hogan Index + Essay TF-IDF)', () => {
  it('flags pairs sharing identical wrong MCQ choices without falsely flagging 10/10 students', () => {
    const exam = {
      questions: [
        { type: 'single_choice', options: ['A', 'B', 'C', 'D'], correct: 0 },
        { type: 'single_choice', options: ['A', 'B', 'C', 'D'], correct: 1 },
        { type: 'single_choice', options: ['A', 'B', 'C', 'D'], correct: 2 },
        { type: 'single_choice', options: ['A', 'B', 'C', 'D'], correct: 3 },
        { type: 'single_choice', options: ['A', 'B', 'C', 'D'], correct: 0 },
        { type: 'single_choice', options: ['A', 'B', 'C', 'D'], correct: 1 },
      ],
    };
    const subs = [
      // 2 học sinh giỏi làm đúng 100% -> KHÔNG được gắn cờ
      { studentId: 'g1', studentName: 'An (Giỏi)', answers: [0, 1, 2, 3, 0, 1] },
      { studentId: 'g2', studentName: 'Bình (Giỏi)', answers: [0, 1, 2, 3, 0, 1] },
      // 2 học sinh chép bài nhau: cùng sai y hệt 4 câu (cùng chọn 3, 3, 0, 0)
      { studentId: 'c1', studentName: 'Cường', answers: [3, 3, 0, 0, 0, 1] },
      { studentId: 'c2', studentName: 'Dũng', answers: [3, 3, 0, 0, 0, 1] },
    ];

    const res = detectExamCollusion(exam, subs);
    expect(res.totalPairsChecked).toBe(6);
    expect(res.highRiskCount).toBe(1);
    expect(res.flaggedPairs[0].studentA).toBe('Cường');
    expect(res.flaggedPairs[0].studentB).toBe('Dũng');
    expect(res.flaggedPairs[0].eic).toBe(4);
    expect(res.flaggedPairs[0].sharedWrongQs).toEqual([1, 2, 3, 4]);
  });

  it('detects copied essay answers via TF-IDF + 3-gram similarity', () => {
    const e1 = 'Định luật bảo toàn khối lượng khẳng định rằng tổng khối lượng các chất tham gia phản ứng luôn bằng tổng khối lượng các chất sản phẩm thu được trong một hệ kín.';
    const e2 = 'Định luật bảo toàn khối lượng khẳng định rằng tổng khối lượng các chất tham gia phản ứng luôn bằng tổng khối lượng các chất sản phẩm thu được trong hệ kín.';
    const e3 = 'Quang hợp là quá trình thực vật hấp thụ năng lượng ánh sáng mặt trời qua diệp lục để tổng hợp chất hữu cơ từ khí cacbonic và nước.';
    expect(computeEssaySimilarity(e1, e2)).toBeGreaterThanOrEqual(80);
    expect(computeEssaySimilarity(e1, e3)).toBeLessThan(30);
  });
});

describe('6. Classroom Toolkit Engine (SeatWise Anti-Cheat, Snake-Draft Groups, Fair Picker) & Anki/Kahoot Export', () => {
  it('assigns anti-cheat exam codes with zero horizontal or vertical adjacent duplicates', () => {
    const students = Array.from({ length: 24 }, (_, i) => ({ id: `s${i}`, name: `Học sinh ${i + 1}`, avgScore: 5 + (i % 5) }));
    const res = generateAntiCheatSeating({ students, rows: 6, cols: 4, examCodes: ['101', '102', '103', '104'] });
    expect(res.seatedCount).toBe(24);
    for (let r = 0; r < res.rows; r++) {
      for (let c = 0; c < res.cols; c++) {
        const cur = res.grid[r][c].examCode;
        if (c + 1 < res.cols) expect(cur).not.toBe(res.grid[r][c + 1].examCode);
        if (r + 1 < res.rows) expect(cur).not.toBe(res.grid[r + 1][c].examCode);
      }
    }
  });

  it('balances group strength via Snake-Draft and cycles fair random picker without repeats', () => {
    const students = [
      { id: '1', name: 'HS 1', avgScore: 10 },
      { id: '2', name: 'HS 2', avgScore: 9 },
      { id: '3', name: 'HS 3', avgScore: 8 },
      { id: '4', name: 'HS 4', avgScore: 7 },
      { id: '5', name: 'HS 5', avgScore: 6 },
      { id: '6', name: 'HS 6', avgScore: 5 },
      { id: '7', name: 'HS 7', avgScore: 4 },
      { id: '8', name: 'HS 8', avgScore: 3 },
    ];
    const groups = generateBalancedGroups({ students, groupCount: 4, mode: 'snake' });
    expect(groups).toHaveLength(4);
    // Snake draft: (10+3)/2=6.5, (9+4)/2=6.5, (8+5)/2=6.5, (7+6)/2=6.5 -> hoàn hảo!
    groups.forEach((g) => expect(g.avgScore).toBe(6.5));
    expect(formatGroupsForZalo(groups, '12A1')).toContain('LỚP 12A1');

    const { picked, resetCycle } = pickFairRandomStudent({ students: students.slice(0, 2), calledIds: ['1'] });
    expect(picked.id).toBe('2');
    expect(resetCycle).toBe(false);
    const next = pickFairRandomStudent({ students: students.slice(0, 2), calledIds: ['1', '2'] });
    expect(next.resetCycle).toBe(true);
  });

  it('exports Anki TSV flashcards and Kahoot 7-column spreadsheet rows cleanly', () => {
    const questions = [
      { num: 1, type: 'single_choice', q: 'Axit nào là axit mạnh?', options: ['CH3COOH', 'HCl', 'H2CO3', 'H2S'], correct: 1, explain: 'HCl điện li hoàn toàn.', topic: 'Axit', level: 'nb' },
    ];
    const anki = exportToAnkiDeckTsv({ title: 'Hóa 11', subject: 'Hóa học', questions });
    expect(anki).toContain('#separator:tab');
    expect(anki).toContain('B. HCl');
    expect(anki).toContain('HCl điện li hoàn toàn.');

    const kahootRows = buildKahootSpreadsheetRows(questions, 30);
    expect(kahootRows).toHaveLength(2);
    expect(kahootRows[1][0]).toBe('Axit nào là axit mạnh?');
    expect(kahootRows[1][5]).toBe(30);
    expect(kahootRows[1][6]).toBe(2); // 1-based index cho B
  });
});
