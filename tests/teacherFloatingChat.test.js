import { describe, it, expect } from 'vitest';
import {
  extractMentionedClassName,
  extractValidNewClassName,
  findTargetClassInQuery,
  getTopicsForSubjectAndGrade,
  runVirtualStudentSimulation,
  SUBJECT_GRADE_TOPICS,
} from '../src/components/teacher/TeacherFloatingChat.jsx';
import {
  AI_MODES,
  getAiModeDirective,
  getMatrixPromptSpec,
  extractExamIntentFromQuery,
  inferQuestionBloomLevel,
  buildRichCopilotContext,
  createWelcomeMessage,
  getSubjectExamplePlaceholder,
  getWelcomeQuickCards,
  filterSlashCommands,
  buildConversationHistory,
  buildClassHealthCardData,
  buildParentReportCardData,
} from '../src/components/teacher/chat/tfcHelpers.js';
import { getCurrentTabInfo } from '../src/lib/tabContextAnalyzer.js';

describe('TeacherFloatingChat Class & Semantic Resolution', () => {
  it('extracts class names accurately from user queries without pollution', () => {
    expect(extractMentionedClassName('bạn xem lớp 11a5 ai kém nhất')).toBe('11a5');
    expect(extractMentionedClassName('lớp 12A1 ai cao nhất')).toBe('12A1');
    expect(extractMentionedClassName('tình hình lớp 10A2 thế nào')).toBe('10A2');
    expect(extractMentionedClassName('xem điểm 11a5')).toBe('11A5');
    expect(extractMentionedClassName('cho xem lop 11A5')).toBe('11A5');

    // Questions without class mention must return null
    expect(extractMentionedClassName('học sinh làm bài kém môn Hóa thì nên ôn phần nào?')).toBeNull();
    expect(extractMentionedClassName('soạn 5 câu este cho học sinh yếu')).toBeNull();
    expect(extractMentionedClassName('tại sao câu này học sinh hay sai')).toBeNull();
    expect(extractMentionedClassName('')).toBeNull();
    expect(extractMentionedClassName(null)).toBeNull();
  });

  it('matches target classes across classes list, exams, and submissionsMap', () => {
    const classes = [
      { id: 'c1', name: '12A1', grade: '12', subject: 'Hóa học' },
      { id: 'c2', name: '10 Lý', grade: '10', subject: 'Vật lí' },
    ];
    const exams = [
      { id: 'ex1', title: 'Kiểm tra 15p 11A5', className: '11A5', grade: '11', subject: 'Hóa học' },
    ];
    const submissionsMap = {};

    // 1. Tìm thấy trong classes
    const match12A1 = findTargetClassInQuery('bạn xem lớp 12a1 ai cao nhất', classes, exams, submissionsMap);
    expect(match12A1).not.toBeNull();
    expect(match12A1.name).toBe('12A1');

    // 2. Tìm thấy trong exams (khi lớp chưa tạo trong tab lớp nhưng có đề mang tên lớp)
    const match11A5 = findTargetClassInQuery('bạn xem lớp 11a5 ai kém nhất', classes, exams, submissionsMap);
    expect(match11A5).not.toBeNull();
    expect(match11A5.name).toBe('11A5');

    // 3. Không tìm thấy lớp nào khi người dùng hỏi lớp không tồn tại (vd: lớp 11A99)
    const matchUnknown = findTargetClassInQuery('bạn xem lớp 11A99 ai kém nhất', classes, [], {});
    expect(matchUnknown).toBeNull();

    // 4. Câu hỏi chuyên môn sư phạm không bị nhận nhầm thành lớp học
    const matchPedagogy = findTargetClassInQuery('phương pháp dạy học sinh yếu este', classes, exams, submissionsMap);
    expect(matchPedagogy).toBeNull();

    // 5. Lời chào như "hi lô", "hello", "chào" không bị nhận nhầm thành lớp "h" hoặc lớp rác
    const classesWithGhost = [
      ...classes,
      { id: 'ghost_h', name: 'h', grade: '12', subject: 'Toán' },
      { id: 'ghost_moi', name: 'mới', grade: '12', subject: 'Toán' },
    ];
    expect(findTargetClassInQuery('hi lô', classesWithGhost, [], {})).toBeNull();
    expect(findTargetClassInQuery('hello bot', classesWithGhost, [], {})).toBeNull();
    expect(findTargetClassInQuery('chào em', classesWithGhost, [], {})).toBeNull();
  });

  it('safely extracts new class names while rejecting boilerplate words like "học", "mới", "h"', () => {
    // Boilerplate inquiries should return null
    expect(extractValidNewClassName('cách tạo lớp học và cho học sinh kiểm tra')).toBeNull();
    expect(extractValidNewClassName('tạo lớp mới')).toBeNull();
    expect(extractValidNewClassName('tạo lớp học')).toBeNull();
    expect(extractValidNewClassName('thêm lớp')).toBeNull();
    expect(extractValidNewClassName('hướng dẫn tạo lớp')).toBeNull();

    // Explicit valid classes should be extracted cleanly
    expect(extractValidNewClassName('tạo lớp 11A5')).toMatch(/11a5/i);
    expect(extractValidNewClassName('tạo lớp 12A1 môn Hóa')).toMatch(/12A1/i);
    expect(extractValidNewClassName('mở lớp 10 Chuyên Hóa')).toBe('10 Chuyên Hóa');
  });

  it('provides multi-subject GDPT 2025 topics accurately for Math, Physics, Chemistry, Biology, English', () => {
    const math12 = getTopicsForSubjectAndGrade('Toán học', '12');
    expect(math12).toBeDefined();
    expect(math12[0]).toContain('khảo sát hàm số');

    const phys12 = getTopicsForSubjectAndGrade('Vật lí', '12');
    expect(phys12).toBeDefined();
    expect(phys12[0]).toContain('Vật lý nhiệt');

    const chem12 = getTopicsForSubjectAndGrade('Hóa học', '12');
    expect(chem12).toBeDefined();
    expect(chem12[0]).toContain('Este');

    const bio12 = getTopicsForSubjectAndGrade('Sinh học', '12');
    expect(bio12).toBeDefined();
    expect(bio12[0]).toContain('Di truyền');

    const eng12 = getTopicsForSubjectAndGrade('Tiếng Anh', '12');
    expect(eng12).toBeDefined();
    expect(eng12[0]).toContain('Life Stories');
  });

  it('builds single-source-of-truth overview stats and personalized welcome/composer helpers', () => {
    const tab = getCurrentTabInfo({
      activeSection: 'overview',
      classes: [{ id: '1' }, { id: '2' }, { id: '3' }],
      exams: Array.from({ length: 23 }, (_, i) => ({ id: `e${i}` })),
      submissionsMap: { e0: new Array(67).fill({ score: 8 }) },
    });
    expect(tab.contextBadge).toBe('3 lớp • 23 đề • 67 bài nộp');

    const welcome = createWelcomeMessage('Duy');
    expect(welcome.isWelcome).toBe(true);
    expect(welcome.text).toContain('Chào Duy!');
    expect(welcome.realSummary).toBeUndefined();

    expect(getSubjectExamplePlaceholder('Toán học')).toContain('Tích phân');
    expect(getSubjectExamplePlaceholder('Vật lí')).toContain('Dao động cơ');
    expect(getWelcomeQuickCards('Hóa học')).toHaveLength(4);
  });

  it('filters slash commands and constructs valid multi-turn conversation history with optional vision image', () => {
    expect(filterSlashCommands('/')).toHaveLength(12);
    expect(filterSlashCommands('/soan').map((c) => c.cmd)).toContain('/soande');
    expect(filterSlashCommands('/suc').map((c) => c.cmd)).toContain('/suckhoelop');
    expect(filterSlashCommands('/nhan').map((c) => c.cmd)).toContain('/nhanxet');
    expect(filterSlashCommands('/soande 15p')).toEqual([]);
    expect(filterSlashCommands('hello')).toEqual([]);

    const history = buildConversationHistory(
      [
        { id: 'welcome_ultra', sender: 'bot', isWelcome: true, text: 'Chào!' },
        { id: 'u1', sender: 'user', text: 'Soạn 2 câu Este' },
        { id: 'b1', sender: 'bot', text: 'Đây là 2 câu Este...' },
        { id: 'u2', sender: 'user', text: 'Làm câu 2 khó hơn' },
      ],
      'ENRICHED_CONTEXT: Làm câu 2 khó hơn',
      8,
      { mimeType: 'image/png', base64: 'AAAA' }
    );
    expect(history).toHaveLength(3);
    expect(history[0]).toEqual({ role: 'user', parts: [{ text: 'Soạn 2 câu Este' }] });
    expect(history[1]).toEqual({ role: 'model', parts: [{ text: 'Đây là 2 câu Este...' }] });
    expect(history[2].parts).toHaveLength(2);
    expect(history[2].parts[1]).toEqual({ inlineData: { mimeType: 'image/png', data: 'AAAA' } });
  });

  it('builds AI mode directives, class health diagnostics, and 3-tone parent Zalo reports', () => {
    expect(AI_MODES).toHaveLength(4);
    expect(getAiModeDirective('balanced')).toBe('');
    expect(getAiModeDirective('auditor')).toContain('GDPT 2025');

    const health = buildClassHealthCardData(
      {
        health: { grade: 'B', label: 'Đạt chuẩn' },
        avgPct: 68,
        passRate: 82,
        submissionCount: 67,
        atRisk: [{ studentName: 'Minh', pct: 40 }],
        weakestTopics: [{ topic: 'Este - Lipit', rate: 38, rated: 20 }],
        hardest: [{ examTitle: 'Đề 15p', index: 2, text: 'Thủy phân este...', rate: 25, rated: 20 }],
        nextLesson: 'Ôn Este 10 phút',
      },
      { classCount: 3, examCount: 23, subject: 'Hóa học' }
    );
    expect(health.submissionCount).toBe(67);
    expect(health.weakestTopics[0].topic).toBe('Este - Lipit');
    expect(health.hardestQuestions[0].rate).toBe(25);

    const parentWeak = buildParentReportCardData({
      studentName: 'Nguyễn Minh',
      pct: 42,
      subCount: 3,
      weakTopic: 'Este - Lipit',
      subject: 'Hóa học',
      teacherName: 'Thầy Duy',
    });
    expect(parentWeak.tones).toHaveLength(3);
    expect(parentWeak.score10).toBe('4.2');
    expect(parentWeak.tones[0].text).toContain('Nguyễn Minh');
    expect(parentWeak.tones[2].label).toBe('Phối hợp sát sao');

    const parentTop = buildParentReportCardData({
      studentName: 'Trần An',
      pct: 94,
      subCount: 4,
      subject: 'Toán học',
      teacherName: 'Thầy Duy',
    });
    expect(parentTop.tones[2].label).toBe('Bồi dưỡng 9+');
  });

  it('extracts multi-subject exam intents accurately instead of hardcoding Chemistry', () => {
    const bioIntent = extractExamIntentFromQuery(
      'Soạn đề 15p Tiêu hóa ở động vật lớp 11 cho học sinh yếu',
      { detectedSubject: 'Sinh học', detectedGrade: '11', fallbackSubject: 'Hóa học', getTopics: getTopicsForSubjectAndGrade }
    );
    expect(bioIntent.subject).toBe('Sinh học');
    expect(bioIntent.grade).toBe('11');
    expect(bioIntent.format).toBe('15min');
    expect(bioIntent.matrix).toBe('remedial');
    expect(bioIntent.topic.toLowerCase()).toContain('tiêu hóa ở động vật');

    const mathIntent = extractExamIntentFromQuery(
      'Tạo đề phân hóa 9+ Nguyên hàm - Tích phân lớp 12',
      { detectedSubject: 'Toán học', detectedGrade: '12', getTopics: getTopicsForSubjectAndGrade }
    );
    expect(mathIntent.subject).toBe('Toán học');
    expect(mathIntent.format).toBe('gdpt2025');
    expect(mathIntent.matrix).toBe('advanced');
    expect(mathIntent.topic).toContain('Nguyên hàm');
    expect(getMatrixPromptSpec('advanced').instruction).toContain('30% Vận dụng cao (VDC)');
  });

  it('infers Bloom levels on unlabeled Word questions and runs deterministic IRT simulation', () => {
    expect(inferQuestionBloomLevel({ part: 1, q: 'Công thức phân tử của glucozơ là?' })).toBe('NB');
    expect(inferQuestionBloomLevel({ part: 1, q: 'Phát biểu nào sau đây đúng khi so sánh glucozơ và fructozơ?' })).toBe('TH');
    expect(inferQuestionBloomLevel({ part: 3, q: 'Tính khối lượng gam este thu được khi đun 12 gam axit với 15 gam ancol biết hiệu suất 80%?' })).toBe('VDC');

    const unlabeledExam = {
      title: 'Đề tiêu hóa ở động vật',
      duration: 45,
      questions: [
        { part: 1, q: 'Cơ quan tiêu hóa chính ở người là?' },
        { part: 1, q: 'Phát biểu nào sau đây đúng khi giải thích cơ chế hấp thụ chất dinh dưỡng ở ruột non?' },
        { part: 2, q: 'Xét quá trình tiêu hóa ở động vật nhai lại...', statements: [{ text: 'a) ...' }, { text: 'b) ...' }] },
        { part: 3, q: 'Tính năng lượng kcal hấp thụ khi khẩu phần có 120 gam tinh bột và 40 gam protein biết hiệu suất 85%?' },
      ],
    };
    const simA = runVirtualStudentSimulation(unlabeledExam);
    const simB = runVirtualStudentSimulation(unlabeledExam);
    expect(simA.predAvg).toBe(simB.predAvg);
    expect(simA.bloomBreakdown.nb + simA.bloomBreakdown.th + simA.bloomBreakdown.vd + simA.bloomBreakdown.vdc).toBe(4);
    expect(simA.bloomBreakdown.vd + simA.bloomBreakdown.vdc).toBeGreaterThan(0);

    const ctx = buildRichCopilotContext({
      user: { displayName: 'Thầy Duy' },
      inferredSubject: 'Sinh học',
      currentTabInfo: { name: 'Tổng Quan' },
      classes: [{ name: '11A2', grade: '11' }],
      exams: [unlabeledExam],
      realInsights: {
        submissionCount: 67,
        avgPct: 72,
        passRate: 85,
        weakestTopics: [{ topic: 'Tiêu hóa', rate: 41 }],
        atRisk: [{ studentName: 'Minh', pct: 35 }],
        hardest: [{ text: 'Câu khó về enzym pepsin', rate: 22 }],
      },
      selectedClass: { name: '11A2', grade: '11', subject: 'Sinh học' },
      selectedExam: unlabeledExam,
    });
    expect(ctx).toContain('Đề tiêu hóa ở động vật');
    expect(ctx).toContain('Tiêu hóa (41% đúng)');
    expect(ctx).toContain('Minh (35%)');
    expect(ctx).toContain('enzym pepsin');
  });
});
