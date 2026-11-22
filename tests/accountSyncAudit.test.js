import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const fbState = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'userA', email: 'a@elec.vn', displayName: 'User A' } },
  db: { _mock: true },
  docs: new Map(),
  pullDelayMs: 0,
  setCalls: [],
}));

vi.mock('../src/lib/firebase.js', () => ({
  auth: fbState.auth,
  db: fbState.db,
  doc: (_db, col, id) => `${col}/${id}`,
  collection: (_db, col) => col,
  query: (...args) => args,
  where: (...args) => args,
  limit: (n) => n,
  writeBatch: () => ({ set: vi.fn(), delete: vi.fn(), commit: async () => {} }),
  getDocs: async () => ({ empty: true, forEach: () => {} }),
  deleteDoc: async (ref) => { fbState.docs.delete(ref); },
  onSnapshot: () => () => {},
  getDoc: async (ref) => {
    if (fbState.pullDelayMs > 0) {
      await new Promise((r) => setTimeout(r, fbState.pullDelayMs));
    }
    const data = fbState.docs.get(ref);
    return {
      exists: () => Boolean(data),
      data: () => data || {},
    };
  },
  setDoc: async (ref, payload, opts) => {
    fbState.setCalls.push({ ref, payload, opts });
    const prev = opts?.merge ? (fbState.docs.get(ref) || {}) : {};
    fbState.docs.set(ref, { ...prev, ...payload });
  },
}));

import {
  ensureStudyOwner,
  clearLocalStudyStateOnLogout,
  collectLocalStudyState,
  collectLocalTeacherState,
  applyMergedCloudStudyState,
  applyMergedTeacherState,
  initCloudStudySyncForUser,
  pushCloudStudyState,
  stopCloudStudySync,
} from '../src/lib/cloudStudySync.js';
import {
  loadTeacherFloatingChat,
  saveTeacherFloatingChat,
  clearTeacherFloatingChat,
} from '../src/lib/aiChatApi.js';

function installMockBrowser() {
  const store = new Map();
  const listeners = new Map();

  const localStorageMock = {
    get length() { return store.size; },
    key: (idx) => Array.from(store.keys())[idx] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: (k) => { store.delete(String(k)); },
    clear: () => { store.clear(); },
  };

  class MockCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  class MockEvent {
    constructor(type) { this.type = type; }
  }

  const dispatchEvent = (evt) => {
    const set = listeners.get(evt?.type);
    if (set) {
      Array.from(set).forEach((fn) => {
        try { fn(evt); } catch { /* ignore */ }
      });
    }
    return true;
  };

  const addEventListener = (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
  };

  const removeEventListener = (type, fn) => {
    listeners.get(type)?.delete(fn);
  };

  const winMock = {
    localStorage: localStorageMock,
    addEventListener,
    removeEventListener,
    dispatchEvent,
    CustomEvent: MockCustomEvent,
    Event: MockEvent,
  };

  const docMock = {
    visibilityState: 'visible',
    documentElement: { dataset: {} },
    addEventListener,
    removeEventListener,
  };

  vi.stubGlobal('window', winMock);
  vi.stubGlobal('document', docMock);
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('CustomEvent', MockCustomEvent);
  vi.stubGlobal('Event', MockEvent);
  vi.stubGlobal('addEventListener', addEventListener);
  vi.stubGlobal('removeEventListener', removeEventListener);
  vi.stubGlobal('dispatchEvent', dispatchEvent);

  return { store, docMock };
}

describe('ELEC AI Whole-Repo Account Sync Audit', () => {
  beforeEach(() => {
    stopCloudStudySync();
    fbState.docs.clear();
    fbState.setCalls = [];
    fbState.pullDelayMs = 0;
    fbState.auth.currentUser = { uid: 'userA', email: 'a@elec.vn', displayName: 'User A' };
    installMockBrowser();
  });

  afterEach(() => {
    stopCloudStudySync();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('1. Đồng bộ đầy đủ toàn bộ dữ liệu Học sinh & Giáo viên từ Cloud sang máy mới', () => {
    const cloudStudy = {
      version: 2,
      updatedAt: 5000,
      sectionTs: {
        favExams: 4000,
        wrongNotes: 4000,
        studyPlan: 4000,
        weeklyPlan: 4000,
        teacherWorkspace: 4000,
      },
      streak: { last: '2026-11-22', n: 9, total: 20, freezeCount: 4, passes: { PRO: 1 }, claimedMilestones: [3, 7], lastFed: '2026-11-22', updatedAt: 4500 },
      xp: 980,
      petFood: 14,
      aiPrefs: { grade: 'Lớp 12', mode: 'deep', deepThink: true, theme: 'dark', homeGrade: '12', currentSubject: 'ly', updatedAt: 4800 },
      eloState: { elo: 1520, history: [{ key: 'k1', before: 1480, delta: 40, after: 1520, at: 4100 }] },
      combatPower: { power: 1440, history: [{ key: 'k1', earned: 60, after: 1440, at: 4100 }] },
      targetUni: { uni: 'ĐH Bách Khoa Hà Nội', major: 'IT1', code: 'BKA' },
      wrongNotes: { q_99: 'Nhớ kiểm tra điều kiện este phenol' },
      examDrafts: { ex_1: { answers: { 0: 2 }, updatedAt: 4200 } },
      rewardShop: { spent: 120, owned: ['frame-minimal', 'frame-gold'], equippedFrame: 'frame-gold', equippedTitle: 'Học Bá' },
      subQuota: { planName: 'Free', hearts: 3, usedCodes: ['TEST1'], transactions: [] },
      flashcards: { version: 1, cards: { q_fc1: { qid: 'q_fc1', level: 3, interval: 7, seen: 2, lastAt: 4100, dueAt: 9999999999999 } } },
      studyPlan: { settings: { examDate: '2027-06-26', minutesPerDay: 45, restDays: [0], maxTasksPerDay: 4 }, done: { '2026-11-22|c12-ester': true } },
      weeklyPlan: { focusMinutes: 50, tasks: [{ id: 't1', dayIndex: 0, text: 'Ôn Este', completed: true }] },
      roadmapSchedule: { weeklyFreeHours: 8, examDate: '2027-06-26', configuredOnce: true },
      aspStrategy: { probability: 82, appliedAt: 4300, diagnosedTopics: [{ id: 'c12-ester' }] },
      aiMemory: { grade: 'Lớp 12', weakTopics: [{ topic: 'Este', count: 3, at: 4100 }], lastSeen: 4100 },
      pomodoro: { history: { '2026-11-22': 3 }, sessions: 12, goal: 10, tasks: [{ id: 'p1', text: 'Làm 1 đề', done: true }], cfg: { focus: 25, short: 5, long: 15 } },
      clockHub: { focusHist: { '2026-11-22': 2 }, focusCycle: 4, focusTasks: [{ id: 'c1', text: 'Đọc SGK' }], alarms: [{ id: 'a1', time: '06:30' }] },
      lessons: { completed: ['hoa-12-b1'], bookmarkedFormulas: ['m = n.M'], notesByLesson: { 'hoa-12-b1': 'Công thức thủy phân' } },
      wrongCauses: { q_99: 'trap' },
      achievements: ['diligent'],
      ptFavs: [1, 6, 8],
    };

    const cloudTeacher = {
      version: 1,
      updatedAt: 5000,
      workspaceTs: 4500,
      qbFavFilters: [{ id: 'f1', name: 'Câu VDC Hóa' }],
      qbQMeta: { q10: { type: 'true_false', accuracyRate: 62 } },
      shuffleHistory: [{ id: 'sh1', title: 'Đề 45p', createdAt: 4200, versions: [{ code: '101', questionCount: 20 }] }],
      teacherTheme: 'light',
      teacherRailCollapsed: '1',
      omrTrialUsed: 4,
      wordImportTrialUsed: 3,
      manualEntryTrialUsed: 9,
      paperExamsLocal: [{ id: 'paper_1', title: 'Giữa kỳ' }],
      manualDrafts: { cls_1: { title: 'Nháp 12A', savedAt: 4200 } },
    };

    const resStudy = applyMergedCloudStudyState('userA', cloudStudy);
    const resTeacher = applyMergedTeacherState('userA', cloudTeacher);

    expect(resStudy.changed).toBe(true);
    expect(resTeacher.changed).toBe(true);

    // Freeze count không bị ghi đè bởi mặc định 1 trên máy mới
    expect(localStorage.getItem('cs-streak-freeze-count')).toBe('4');
    // Theme & Subject được khôi phục xuống localStorage + DOM
    expect(JSON.parse(localStorage.getItem('cs-theme-v2'))).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('elec-current-subject')).toBe('ly');

    // Dữ liệu học tập mở rộng đã về đầy đủ
    expect(JSON.parse(localStorage.getItem('elec_student_elo_v1_userA')).elo).toBe(1520);
    expect(JSON.parse(localStorage.getItem('elec_student_power_v1_userA')).power).toBe(1440);
    expect(JSON.parse(localStorage.getItem('elec_reward_shop_v1_userA')).equippedFrame).toBe('frame-gold');
    expect(JSON.parse(localStorage.getItem('cs-flashcards-v1:userA')).cards.q_fc1.interval).toBe(7);
    expect(JSON.parse(localStorage.getItem('cs-study-plan-v1:userA')).settings.minutesPerDay).toBe(45);
    expect(JSON.parse(localStorage.getItem('elec_weekly_plan_v1_userA')).tasks).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('cs-ai-memory:userA')).weakTopics[0].topic).toBe('Este');
    expect(JSON.parse(localStorage.getItem('cs-pomo-history'))['2026-11-22']).toBe(3);
    expect(JSON.parse(localStorage.getItem('cs-ch-focus-hist'))['2026-11-22']).toBe(2);
    expect(JSON.parse(localStorage.getItem('elec-completed-lessons'))).toEqual(['hoa-12-b1']);
    expect(localStorage.getItem('elec-notes-hoa-12-b1')).toBe('Công thức thủy phân');
    expect(JSON.parse(localStorage.getItem('elec_wrong_causes_v1')).q_99).toBe('trap');
    expect(JSON.parse(localStorage.getItem('pt-favs'))).toEqual([1, 6, 8]);

    // Dữ liệu Giáo viên đã về đầy đủ
    expect(localStorage.getItem('elec_teacher_theme')).toBe('light');
    expect(localStorage.getItem('elec_teacher_rail_collapsed')).toBe('1');
    expect(localStorage.getItem('elec-omr-trial-count:userA')).toBe('4');
    expect(JSON.parse(localStorage.getItem('cs-qb-fav-filters-v1'))[0].name).toBe('Câu VDC Hóa');
    expect(JSON.parse(localStorage.getItem('cs-shuffle-history-v1'))[0].code ?? JSON.parse(localStorage.getItem('cs-shuffle-history-v1'))[0].title).toBe('Đề 45p');
    expect(JSON.parse(localStorage.getItem('cs-exam-manual-draft:cls_1')).title).toBe('Nháp 12A');

    // Collect ngược lại bảo toàn dữ liệu để đẩy cloud
    const roundTrip = collectLocalStudyState('userA');
    const teacherRoundTrip = collectLocalTeacherState('userA');
    expect(roundTrip.eloState.elo).toBe(1520);
    expect(teacherRoundTrip.omrTrialUsed).toBe(4);
  });

  it('2. Xóa Bookmark / Bỏ thích Đề trên Điện thoại đồng bộ sang PC (không hồi sinh)', () => {
    // Máy PC đã đồng bộ mốc 1000 với 2 bookmark & 2 favExams
    localStorage.setItem('cs-ai-bookmarks', JSON.stringify([{ id: 'b1', text: 'giữ', ts: 900 }, { id: 'b2', text: 'xóa', ts: 950 }]));
    localStorage.setItem('elec_fav_exams_v1_userA', JSON.stringify(['ex1', 'ex2']));
    localStorage.setItem('cs-study-sync-meta', JSON.stringify({
      sectionTs: { aiBookmarks: 1000, favExams: 1000 },
      syncedSectionTs: { aiBookmarks: 1000, favExams: 1000 },
    }));

    // Trên Điện thoại người dùng xóa b2 & bỏ thích ex2 ở mốc 2000
    applyMergedCloudStudyState('userA', {
      updatedAt: 2000,
      sectionTs: { aiBookmarks: 2000, favExams: 2000 },
      aiBookmarks: [{ id: 'b1', text: 'giữ', ts: 900 }],
      favExams: ['ex1'],
    });

    expect(JSON.parse(localStorage.getItem('cs-ai-bookmarks')).map((b) => b.id)).toEqual(['b1']);
    expect(JSON.parse(localStorage.getItem('elec_fav_exams_v1_userA'))).toEqual(['ex1']);
  });

  it('3. pushCloudStudyState chờ initial pull hoàn tất để không ghi đè mất dữ liệu cloud khi vừa mở máy mới', async () => {
    fbState.pullDelayMs = 40;
    fbState.docs.set('users/userA', {
      uid: 'userA',
      studyStateUpdatedAt: 9000,
      studyState: {
        version: 2,
        updatedAt: 9000,
        xp: 777,
        streak: { last: '2026-11-22', n: 12, total: 15, freezeCount: 3, updatedAt: 9000 },
      },
    });

    initCloudStudySyncForUser('userA');
    // Ngay lập tức giả lập 1 event muốn đẩy snapshot rỗng cục bộ lên
    await pushCloudStudyState('userA', true);

    expect(JSON.parse(localStorage.getItem('cs-xp'))).toBe(777);
    const savedOnCloud = fbState.docs.get('users/userA')?.studyState;
    expect(savedOnCloud.xp).toBe(777);
    expect(savedOnCloud.streak.n).toBe(12);
  });

  it('4. clearLocalStudyStateOnLogout và ensureStudyOwner cô lập hoàn toàn giữa các tài khoản', () => {
    localStorage.setItem('cs-study-owner', 'userA');
    localStorage.setItem('cs-xp', '500');
    localStorage.setItem('cs-pomo-history', JSON.stringify({ '2026-11-22': 2 }));
    localStorage.setItem('elec-notes-hoa-1', 'Ghi chú của A');
    localStorage.setItem('cs-exam-manual-draft:cls1', '{"title":"Đề của A"}');
    localStorage.setItem('aes_topic', 'Este');
    localStorage.setItem('cs-ai-chats:userA', '[{"id":"cA"}]');

    clearLocalStudyStateOnLogout();

    expect(localStorage.getItem('cs-xp')).toBeNull();
    expect(localStorage.getItem('cs-pomo-history')).toBeNull();
    expect(localStorage.getItem('elec-notes-hoa-1')).toBeNull();
    expect(localStorage.getItem('cs-exam-manual-draft:cls1')).toBeNull();
    expect(localStorage.getItem('aes_topic')).toBeNull();
    expect(localStorage.getItem('cs-study-owner')).toBeNull();
    // Dữ liệu scoped của A vẫn an toàn nếu A đăng nhập lại trên máy này, nhưng B không đọc của A
    expect(localStorage.getItem('cs-ai-chats:userA')).toBe('[{"id":"cA"}]');

    // Khi A chưa kịp logout mà đổi owner trực tiếp sang B
    localStorage.setItem('cs-study-owner', 'userA');
    localStorage.setItem('cs-xp', '999');
    const switched = ensureStudyOwner('userB');
    expect(switched).toBe(true);
    expect(localStorage.getItem('cs-xp')).toBeNull();
  });

  it('5. TeacherFloatingChat đồng bộ Firestore (save / load / clear theo đúng uid)', async () => {
    await saveTeacherFloatingChat('userA', [
      { id: 'welcome_ultra', sender: 'ai', text: 'Xin chào' },
      { id: 'u1', sender: 'user', text: 'Tạo 5 câu Este', imagePreview: { dataUrl: 'data:image/png;base64,ABC', name: 'anh.png' } },
    ], 12345);

    const loaded = await loadTeacherFloatingChat('userA');
    expect(loaded).not.toBeNull();
    expect(loaded.updatedAt).toBe(12345);
    expect(loaded.messages).toHaveLength(2);
    expect(loaded.messages[1].imagePreview?.dataUrl).toBeUndefined();

    // Không cho userB đọc đè bằng token giả
    const wrongUser = await loadTeacherFloatingChat('userB');
    expect(wrongUser).toBeNull();

    await clearTeacherFloatingChat('userA', 22222);
    const afterClear = await loadTeacherFloatingChat('userA');
    expect(afterClear.messages).toEqual([]);
    expect(afterClear.clearedAt).toBe(22222);
  });

  it('6. Guard mã nguồn tĩnh: logout flush trước signOut, AIChat fix togglePin & realtime, hết key chết elec-wrong-questions', () => {
    const useAuthSrc = fs.readFileSync(path.resolve('src/hooks/useAuth.jsx'), 'utf8');
    expect(useAuthSrc).toContain('flushCloudStudyState');
    expect(useAuthSrc).toContain('clearLocalStudyStateOnLogout');
    expect(useAuthSrc.indexOf('flushCloudStudyState')).toBeLessThan(useAuthSrc.indexOf('await signOut(auth)'));

    const aiChatSrc = fs.readFileSync(path.resolve('src/components/AIChat.jsx'), 'utf8');
    expect(aiChatSrc).toContain('subscribeChatsRealtime');
    expect(aiChatSrc).toContain('[setPinnedIds, uid]');

    const abilitySrc = fs.readFileSync(path.resolve('src/components/StudentAbilityHub.jsx'), 'utf8');
    const statsSrc = fs.readFileSync(path.resolve('src/components/StatsPage.jsx'), 'utf8');
    const dockSrc = fs.readFileSync(path.resolve('src/components/StudentAiContextDock.jsx'), 'utf8');
    expect(abilitySrc).not.toContain('elec-wrong-questions');
    expect(statsSrc).not.toContain('elec-wrong-questions');
    expect(dockSrc).not.toContain('elec-wrong-questions');
  });
});
