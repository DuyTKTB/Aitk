/* ============================================================
   scripts/migrate-exam-answer-keys.mjs
   ------------------------------------------------------------
   Di chuyển an toàn toàn bộ đề thi cũ trong Firestore `exams/*`:
     • Trích đáp án + lời giải sang `exams/{examId}/private/answerKey`
     • Xoá đáp án khỏi `exams/{examId}.questions` và gắn `secureAnswerKey: true`
     • Idempotent: bỏ qua các đề đã tách đáp án và đã có `private/answerKey`
   Chạy: node scripts/migrate-exam-answer-keys.mjs [--dry-run]
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  stripAnswerKeys,
  extractAnswerKey,
  hasEmbeddedAnswers,
} from '../src/lib/examSecurity.js';
import { stripUndefined } from '../src/lib/examSubmit.js';

const dryRun = process.argv.includes('--dry-run');

function loadServiceAccount() {
  const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
    return JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
  }
  throw new Error('Không tìm thấy serviceAccountKey.json hoặc FIREBASE_SERVICE_ACCOUNT_JSON.');
}

async function main() {
  const sa = loadServiceAccount();
  if (!getApps().length) {
    initializeApp({ credential: cert(sa) });
  }
  const db = getFirestore();
  const snap = await db.collection('exams').get();

  let total = 0;
  let migrated = 0;
  let alreadySecure = 0;
  let skippedNoQuestions = 0;

  for (const docSnap of snap.docs) {
    total += 1;
    const exam = docSnap.data() || {};
    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    if (questions.length === 0) {
      skippedNoQuestions += 1;
      continue;
    }

    const keyRef = docSnap.ref.collection('private').doc('answerKey');
    const keySnap = await keyRef.get();
    const embedded = hasEmbeddedAnswers(questions);

    if (exam.secureAnswerKey === true && keySnap.exists && !embedded) {
      alreadySecure += 1;
      continue;
    }

    if (!embedded && keySnap.exists) {
      if (!dryRun) {
        await docSnap.ref.update({ secureAnswerKey: true });
      }
      migrated += 1;
      continue;
    }

    if (!embedded && !keySnap.exists) {
      skippedNoQuestions += 1;
      continue;
    }

    const privateKey = extractAnswerKey(questions);
    const cleanQuestions = stripAnswerKeys(questions);

    if (!dryRun) {
      const batch = db.batch();
      batch.set(
        keyRef,
        stripUndefined({
          questionsKey: privateKey,
          migratedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
      );
      batch.update(
        docSnap.ref,
        stripUndefined({
          questions: cleanQuestions,
          secureAnswerKey: true,
          answerKeyMigratedAt: FieldValue.serverTimestamp(),
        }),
      );
      await batch.commit();
    }
    migrated += 1;
  }

  console.log(JSON.stringify({
    ok: true,
    dryRun,
    total,
    migrated,
    alreadySecure,
    skippedNoQuestions,
  }, null, 2));
}

main().catch((err) => {
  console.error('[migrate-exam-answer-keys] Lỗi:', err?.message || err);
  process.exit(1);
});
