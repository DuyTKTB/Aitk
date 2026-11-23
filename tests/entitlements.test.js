import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEACHER_VIP_ANNUAL_PRICE,
  STUDENT_VIP_ANNUAL_PRICE,
  TEACHER_VIP_MONTHLY_PRICE,
  STUDENT_VIP_MONTHLY_PRICE,
  FREE_TEACHER_LIMITS,
  SUBSCRIPTION_CATALOG,
  getPackagesForRole,
  findPackageById,
  isPackageAllowedForRole,
  resolveEntitlements,
  getTeacherQuotaStatus,
  canUseStudentFeature,
  getOmrTrialUsed,
  incrementOmrTrialUsed,
  getOmrTrialRemaining,
  resetOmrTrialCounterForTest,
  getWordImportTrialUsed,
  incrementWordImportTrialUsed,
  getWordImportTrialRemaining,
  resetWordImportTrialCounterForTest,
  getManualEntryTrialUsed,
  incrementManualEntryTrialUsed,
  getManualEntryTrialRemaining,
  resetManualEntryTrialCounterForTest,
  buildIdentCode,
} from '../src/lib/entitlements.js';
import { canAccessVirtualExam, redeemActivationCode, getSubscriptionAndQuota } from '../src/data/virtualExamsBank.js';

describe('Student vs Teacher Free/VIP Entitlements & Pricing', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('sets Teacher VIP to 999.000đ/year, Student VIP to 299.000đ/year, and separates roles strictly', () => {
    expect(TEACHER_VIP_ANNUAL_PRICE).toBe(999000);
    expect(STUDENT_VIP_ANNUAL_PRICE).toBe(299000);
    expect(TEACHER_VIP_MONTHLY_PRICE).toBe(999000);
    expect(STUDENT_VIP_MONTHLY_PRICE).toBe(299000);
    expect(SUBSCRIPTION_CATALOG['gv-12m'].amount).toBe(999000);
    expect(SUBSCRIPTION_CATALOG['gv-12m'].months).toBe(12);
    expect(SUBSCRIPTION_CATALOG['hs-12m'].amount).toBe(299000);
    expect(SUBSCRIPTION_CATALOG['hs-12m'].months).toBe(12);
    expect(findPackageById('gv-khoi-dau')?.amount).toBe(999000);
    expect(findPackageById('gv-1m')?.amount).toBe(999000);
    expect(findPackageById('hs-hoc-ba')?.amount).toBe(299000);
    expect(findPackageById('hs-1m')?.amount).toBe(299000);

    const teacherPkgs = getPackagesForRole('teacher');
    const studentPkgs = getPackagesForRole('student');
    expect(teacherPkgs.length).toBeGreaterThanOrEqual(1);
    expect(studentPkgs.length).toBeGreaterThanOrEqual(1);
    expect(teacherPkgs.every((p) => p.role === 'teacher')).toBe(true);
    expect(studentPkgs.every((p) => p.role === 'student')).toBe(true);

    // Cross-role purchase guard
    expect(isPackageAllowedForRole('teacher', SUBSCRIPTION_CATALOG['hs-12m'])).toBe(false);
    expect(isPackageAllowedForRole('student', SUBSCRIPTION_CATALOG['gv-12m'])).toBe(false);
    expect(isPackageAllowedForRole('teacher', SUBSCRIPTION_CATALOG['gv-12m'])).toBe(true);
    expect(isPackageAllowedForRole('student', SUBSCRIPTION_CATALOG['hs-12m'])).toBe(true);
  });

  it('keeps Teacher FREE strictly gated and fixes Free teacher getting PRO in VirtualExamRoom', () => {
    const teacherUser = { uid: 't-free-1', role: 'teacher', email: 'gv@school.edu.vn' };
    const ent = resolveEntitlements({
      user: teacherUser,
      pro: { isPro: false },
      userRole: 'teacher',
      subQuota: { planName: 'FREE' },
    });

    expect(ent.isTeacherAccount).toBe(true);
    expect(ent.isTeacherVip).toBe(false);
    expect(ent.hasVipAccess).toBe(false);
    expect(ent.virtualExamPlan).toBe('FREE');
    expect(ent.maxHearts).toBe(5);
    expect(ent.teacherLimits).toEqual({
      maxClasses: 1,
      maxStudentsPerClass: 40,
      maxExams: 30,
      maxOmrTrialSheets: 5,
      maxBankQuestions: 50,
      maxWordImports: 10,
      maxManualEntries: 30,
    });

    expect(canAccessVirtualExam(ent.virtualExamPlan, 'FREE')).toBe(true);
    expect(canAccessVirtualExam(ent.virtualExamPlan, 'PRO')).toBe(false);
    expect(canAccessVirtualExam(ent.virtualExamPlan, 'VIP')).toBe(false);
  });

  it('prevents Student VIP from unlocking Teacher VIP, while unlocking Teacher VIP properly', () => {
    const teacherWithStudentVip = resolveEntitlements({
      user: { uid: 't-1', role: 'teacher' },
      pro: { isPro: true, isTeacherPro: false, isStudentVip: true },
      userRole: 'teacher',
    });
    expect(teacherWithStudentVip.isTeacherVip).toBe(false);

    const paidTeacherVip = resolveEntitlements({
      user: { uid: 't-2', role: 'teacher' },
      pro: { isPro: true, isTeacherPro: true, isStudentVip: false },
      userRole: 'teacher',
    });
    expect(paidTeacherVip.isTeacherVip).toBe(true);
    expect(paidTeacherVip.hasVipAccess).toBe(true);
    expect(paidTeacherVip.virtualExamPlan).toBe('VIP');
    expect(paidTeacherVip.teacherLimits).toBeNull();
    expect(canAccessVirtualExam(paidTeacherVip.virtualExamPlan, 'PRO')).toBe(true);
    expect(canAccessVirtualExam(paidTeacherVip.virtualExamPlan, 'VIP')).toBe(true);
  });

  it('handles Student FREE vs Student VIP while preserving excluded free modules (Roadmap, Aspiration, WrongNotebook)', () => {
    const freeStudent = resolveEntitlements({
      user: { uid: 's-free-1', role: 'student' },
      pro: { isPro: false },
      tier: { key: 'free' },
      userRole: 'student',
    });
    expect(freeStudent.isStudentVip).toBe(false);
    expect(freeStudent.isTeacherVip).toBe(false);
    expect(freeStudent.virtualExamPlan).toBe('FREE');
    expect(canUseStudentFeature(freeStudent, 'roadmap')).toBe(true);
    expect(canUseStudentFeature(freeStudent, 'aspiration')).toBe(true);
    expect(canUseStudentFeature(freeStudent, 'wrong-notebook')).toBe(true);
    expect(canUseStudentFeature(freeStudent, 'docStudio')).toBe(false);
    expect(canUseStudentFeature(freeStudent, 'voiceTutor')).toBe(false);
    expect(canUseStudentFeature(freeStudent, 'aiDiagnostic')).toBe(false);

    const vipStudent = resolveEntitlements({
      user: { uid: 's-vip-1', role: 'student' },
      pro: { isPro: true, isTeacherPro: false, isStudentVip: true },
      userRole: 'student',
    });
    expect(vipStudent.isStudentVip).toBe(true);
    expect(vipStudent.isTeacherVip).toBe(false);
    expect(vipStudent.hasVipAccess).toBe(true);
    expect(vipStudent.virtualExamPlan).toBe('VIP');
    expect(vipStudent.maxHearts).toBe(99);
    expect(canUseStudentFeature(vipStudent, 'docStudio')).toBe(true);
  });

  it('tracks Teacher Free quotas accurately (1 class, 30 exams, 50 bank, 10 Word imports, 30 manual entries, 5 OMR sheets)', () => {
    expect(FREE_TEACHER_LIMITS.maxClasses).toBe(1);
    expect(FREE_TEACHER_LIMITS.maxStudentsPerClass).toBe(40);
    expect(FREE_TEACHER_LIMITS.maxExams).toBe(30);
    expect(FREE_TEACHER_LIMITS.maxOmrTrialSheets).toBe(5);
    expect(FREE_TEACHER_LIMITS.maxBankQuestions).toBe(50);
    expect(FREE_TEACHER_LIMITS.maxWordImports).toBe(10);
    expect(FREE_TEACHER_LIMITS.maxManualEntries).toBe(30);

    const under = getTeacherQuotaStatus({
      classesCount: 0,
      examsCount: 2,
      bankCount: 19,
      omrUsed: 4,
      wordImportUsed: 9,
      manualEntryUsed: 29,
      isTeacherVip: false,
    });
    expect(under.canCreateClass).toBe(true);
    expect(under.canCreateExam).toBe(true);
    expect(under.canAddBankQuestion).toBe(true);
    expect(under.canUseOmr).toBe(true);
    expect(under.canImportWord).toBe(true);
    expect(under.canUseManualEntry).toBe(true);
    expect(under.remainingWordImports).toBe(1);
    expect(under.remainingManualEntries).toBe(1);
    expect(under.remainingOmr).toBe(1);

    const atCap = getTeacherQuotaStatus({
      classesCount: 1,
      examsCount: 30,
      bankCount: 50,
      omrUsed: 5,
      wordImportUsed: 10,
      manualEntryUsed: 30,
      isTeacherVip: false,
    });
    expect(atCap.canCreateClass).toBe(false);
    expect(atCap.canCreateExam).toBe(false);
    expect(atCap.canAddBankQuestion).toBe(false);
    expect(atCap.canUseOmr).toBe(false);
    expect(atCap.canImportWord).toBe(false);
    expect(atCap.canUseManualEntry).toBe(false);
    expect(atCap.remainingOmr).toBe(0);
    expect(atCap.remainingWordImports).toBe(0);
    expect(atCap.remainingManualEntries).toBe(0);

    const vip = getTeacherQuotaStatus({
      classesCount: 10,
      examsCount: 50,
      bankCount: 500,
      omrUsed: 200,
      wordImportUsed: 50,
      manualEntryUsed: 200,
      isTeacherVip: true,
    });
    expect(vip.canCreateClass).toBe(true);
    expect(vip.canCreateExam).toBe(true);
    expect(vip.canAddBankQuestion).toBe(true);
    expect(vip.canUseOmr).toBe(true);
    expect(vip.canImportWord).toBe(true);
    expect(vip.canUseManualEntry).toBe(true);
    expect(vip.remainingOmr).toBe(Infinity);
    expect(vip.remainingWordImports).toBe(Infinity);
    expect(vip.remainingManualEntries).toBe(Infinity);
  });

  it('tracks persistent OMR 5-sheet trial count cleanly across sessions and floor counts', () => {
    const uid = 'teacher-omr-test';
    resetOmrTrialCounterForTest(uid);
    expect(getOmrTrialRemaining(uid, false, 0)).toBe(5);
    expect(incrementOmrTrialUsed(uid, 2, 0)).toBe(2);
    expect(getOmrTrialRemaining(uid, false, 0)).toBe(3);
    // FloorTotal overrides smaller stored value if teacher cleared storage
    expect(getOmrTrialUsed(uid, 4)).toBe(4);
    expect(getOmrTrialRemaining(uid, false, 4)).toBe(1);
    incrementOmrTrialUsed(uid, 1, 4);
    expect(getOmrTrialRemaining(uid, false, 4)).toBe(0);
    // VIP is unlimited regardless of usage
    expect(getOmrTrialRemaining(uid, true, 50)).toBe(Infinity);
  });

  it('blocks client-side ELECVIP free bypass code while keeping stable SePay identCode generation', async () => {
    const uid = 'no-bypass-' + Date.now();
    // 4. Client bypass & SePay identCode
    const res = await redeemActivationCode(uid, 'ELECVIP');
    expect(res.ok).toBe(false);
    expect(getSubscriptionAndQuota(uid).planName).toBe('Free');

    expect(buildIdentCode('teacher@elec.vn')).toBe(buildIdentCode('teacher@elec.vn'));
    expect(buildIdentCode('teacher@elec.vn')).toMatch(/^ELECAI-[0-9A-F]{1,6}$/);
  });

  it('ignores expired or unverified local subQuota so Free accounts never keep stale VIP access', () => {
    const uid = 'expired-sub-' + Date.now();
    const expiredIso = new Date(Date.now() - 86400000).toISOString();
    const prevStorage = globalThis.localStorage;
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(String(k), String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
    try {
      localStorage.setItem(`cs-user-subscription:${uid}`, JSON.stringify({
        uid,
        planName: 'VIP',
        hearts: 99,
        maxHearts: 99,
        expiry: expiredIso,
      }));

      const subQuota = getSubscriptionAndQuota(uid);
      expect(subQuota.planName).toBe('Free');
      expect(subQuota.maxHearts).toBe(5);
    } finally {
      globalThis.localStorage = prevStorage;
    }

    const freeStudent = resolveEntitlements({
      user: { uid, role: 'student' },
      pro: { isPro: false, serverChecked: true },
      tier: { key: 'free' },
      subQuota: { planName: 'VIP', expiry: expiredIso },
    });
    expect(freeStudent.isStudentVip).toBe(false);
    expect(freeStudent.hasVipAccess).toBe(false);
    expect(freeStudent.virtualExamPlan).toBe('FREE');

    const unverifiedSubWithServerFree = resolveEntitlements({
      user: { uid, role: 'student' },
      pro: { isPro: false, serverChecked: true },
      tier: { key: 'free' },
      subQuota: { planName: 'VIP' },
    });
    expect(unverifiedSubWithServerFree.isStudentVip).toBe(false);
    expect(unverifiedSubWithServerFree.hasVipAccess).toBe(false);
  });

  it('tracks persistent 10x Word import & 30x manual entry trial quotas per teacher uid', () => {
    const uidA = 'teacher-trial-a';
    const uidB = 'teacher-trial-b';
    resetWordImportTrialCounterForTest(uidA);
    resetWordImportTrialCounterForTest(uidB);
    resetManualEntryTrialCounterForTest(uidA);
    resetManualEntryTrialCounterForTest(uidB);

    expect(getWordImportTrialRemaining(uidA, false)).toBe(10);
    expect(getManualEntryTrialRemaining(uidA, false)).toBe(30);

    expect(incrementWordImportTrialUsed(uidA, 1)).toBe(1);
    expect(getWordImportTrialUsed(uidA)).toBe(1);
    expect(getWordImportTrialRemaining(uidA, false)).toBe(9);
    expect(getWordImportTrialRemaining(uidB, false)).toBe(10);

    incrementWordImportTrialUsed(uidA, 9);
    expect(getWordImportTrialRemaining(uidA, false)).toBe(0);
    expect(getWordImportTrialRemaining(uidA, true)).toBe(Infinity);

    expect(incrementManualEntryTrialUsed(uidA, 15)).toBe(15);
    expect(getManualEntryTrialRemaining(uidA, false)).toBe(15);
    expect(getManualEntryTrialRemaining(uidB, false)).toBe(30);

    incrementManualEntryTrialUsed(uidA, 15);
    expect(getManualEntryTrialUsed(uidA)).toBe(30);
    expect(getManualEntryTrialRemaining(uidA, false)).toBe(0);
    expect(getManualEntryTrialRemaining(uidA, true)).toBe(Infinity);
  });
});
