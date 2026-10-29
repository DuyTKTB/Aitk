/* reviewQueue.js — mot hang doi on duy nhat cho trang Lo trinh.
   Gop 2 nguon: cau tra loi sai (roadmapEngine) + the tu danh gia (flashcardStore).
   Khong tao lich on thu ba. */
import { questionStats, reviewQueue } from './roadmapEngine.js';
import { dueCards } from './flashcardStore.js';

export function dueItems(uid, events = [], now = Date.now()) {
  const wrong = reviewQueue(questionStats(events), { limit: 300, now });
  const items = wrong.map((q) => ({
    qid: q.qid,
    topicId: q.topicId || null,
    reason: 'wrong',
    priority: 3 + Math.min(3, Math.max(0, (q.wrong || 0) - (q.right || 0))),
  }));

  const cards = dueCards(uid, { now, limit: 200 }) || [];
  const seen = new Set(items.map((i) => i.qid));
  cards.forEach((c) => {
    if (!c.qid || seen.has(c.qid)) return;
    items.push({
      qid: c.qid,
      topicId: c.topicId || null,
      reason: 'card',
      priority: c.level === 1 ? 3 : 2,
    });
  });

  return items.sort((a, b) => b.priority - a.priority);
}

export function dueSummary(uid, events = [], now = Date.now()) {
  const items = dueItems(uid, events, now);
  const byTopic = {};
  const byReason = { wrong: 0, card: 0 };
  items.forEach((i) => {
    if (i.topicId) byTopic[i.topicId] = (byTopic[i.topicId] || 0) + 1;
    byReason[i.reason] = (byReason[i.reason] || 0) + 1;
  });
  return { total: items.length, byTopic, byReason, items };
}
