import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { markMastered, markWrong, unsaveQuestion, saveQuestion } from '../lib/examApi.js';
import { getWrongQuestions, markQuestionMastered, WRONG_UPDATE_EVENT } from '../lib/wrongQuestionService.js';
import {
  IcoBookOpen, IcoBookMark, IcoX, IcoCheck, IcoCheckCircle, IcoSearch,
  IcoClose, IcoTrash, IcoStar, IcoCopy, IcoDownload, IcoSort,
  IcoGrid, IcoList, IcoShuffle, IcoPlay, IcoArrowUp, IcoSparkle,
  IcoBulb, IcoStats, IcoFire, IcoTag, IcoEye, IcoEyeOff, IcoInfo,
  IcoRefresh, IcoFilter, IcoNote, IcoClock,
} from './NotebookIcons.jsx';
import NotebookGuide from './NotebookGuide.jsx';
import MathText from './MathText.jsx';
import { askAI } from './HomePlus.jsx';
import {
  buildWrongCauseBreakdown,
  loadWrongQuestionNotes,
  saveWrongQuestionNote,
} from '../lib/studentAnalytics.js';
import { topicName, UNCLASSIFIED } from '../data/chemTopics.js';
import { useCurrentSubject } from './SubjectSwitcher.jsx';
import { exportToAnkiDeckTsv } from '../lib/lmsQuizFormats.js';

// Import CSS chuẩn xác
import './notebook-v2.css';
import './notebook-guide.css';
import '../styles/student-v9-upgrades.css';

const SUBJECT_TABS = [
  { id: 'all', label: 'Tất cả KHTN', color: '#0071e3' },
  { id: 'ly', label: 'Vật lí', color: '#af52de' },
  { id: 'hoa', label: 'Hóa học', color: '#32ade6' },
  { id: 'sinh', label: 'Sinh học', color: '#34c759' },
];

const DIFFICULTIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'easy', label: 'Dễ', color: '#34c759' },
  { id: 'medium', label: 'Trung bình', color: '#ff9500' },
  { id: 'hard', label: 'Khó', color: '#ff6b35' },
  { id: 'extreme', label: 'Rất khó', color: '#ff3b30' },
];

const DIFF_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó', extreme: 'Rất khó' };
const DIFF_COLORS = { easy: '#34c759', medium: '#ff9500', hard: '#ff6b35', extreme: '#ff3b30' };

const TRAP_CAUSES = [
  { id: 'all', label: 'Mọi nguyên nhân sai' },
  { id: 'concept', label: 'Hổng bản chất lý thuyết', color: '#af52de' },
  { id: 'formula', label: 'Nhầm công thức / Đơn vị SI', color: '#0071e3' },
  { id: 'calc', label: 'Bấm máy / Tính toán sai', color: '#ff9500' },
  { id: 'trap', label: 'Bẫy đọc đề (Đúng/Sai)', color: '#ff3b30' },
];

function inferTrapCause(q = {}) {
  const txt = `${q.content || ''} ${q.explanation || ''}`.toLowerCase();
  if (/đúng hay sai|phát biểu|nhận định|không đúng|sai khi nói/i.test(txt)) return 'trap';
  if (/mol|khối lượng|nồng độ|phần trăm|hiệu suất|tính giá trị|bao nhiêu gam/i.test(txt)) return 'calc';
  if (/công thức|đơn vị|chu kỳ|tần số|bước sóng|điện trở|cảm kháng|dung kháng/i.test(txt)) return 'formula';
  return 'concept';
}

function getItemQid(item) {
  return item?.question?.id ?? item?.questionId ?? item?.id;
}

function hasCompactAnswers(answers = []) {
  if (!Array.isArray(answers) || answers.length < 2 || answers.length > 4) return false;
  return answers.every((a) => String(a?.content || '').length <= 68);
}

export default function WrongNotebook() {
  const { user } = useAuth();
  const [wrongQs, setWrongQs] = useState([]);
  const [savedQs, setSavedQs] = useState([]);
  const [tab, setTab] = useState('wrong');
  const [loading, setLoading] = useState(true);

  // Filters
  const { subject: globalSubject, setSubject: setGlobalSubject } = useCurrentSubject();
  const [filterSubject, setFilterSubject] = useState(globalSubject || 'all');

  useEffect(() => {
    if (globalSubject && globalSubject !== filterSubject) {
      setFilterSubject(globalSubject);
    }
  }, [globalSubject, filterSubject]);

  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  /* Cho phép mở sẵn theo chương: #notebook?topic=c11-alcohol
     (đi từ thẻ "Lộ trình kiến thức" → Sổ lỗi sai) */
  const [filterTopic, setFilterTopic] = useState(() => {
    try {
      const q = window.location.hash.split('?')[1] || '';
      const t = new URLSearchParams(q).get('topic');
      return t || 'all';
    } catch {
      return 'all';
    }
  });
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('list');
  const [studyHideAns, setStudyHideAns] = useState(false);
  const [revealedCards, setRevealedCards] = useState(() => new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Modals
  const [detail, setDetail] = useState(null);
  const [detailRevealAns, setDetailRevealAns] = useState(true);
  const [personalNotes, setPersonalNotes] = useState(() => loadWrongQuestionNotes(user?.uid || user?.id || 'guest'));
  const [quizMode, setQuizMode] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizPicked, setQuizPicked] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [sprintSecLeft, setSprintSecLeft] = useState(0);
  const [filterCause, setFilterCause] = useState('all');
  const [customCauses, setCustomCauses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('elec_wrong_causes_v1') || '{}');
    } catch {
      return {};
    }
  });

  const setQuestionCause = (qid, causeId) => {
    setCustomCauses((prev) => {
      const next = { ...prev, [qid]: causeId };
      try {
        localStorage.setItem('elec_wrong_causes_v1', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'elec_wrong_causes_v1' }));
      } catch { /* ignore */ }
      return next;
    });
  };

  const sprintActive = Boolean(quizMode && sprintSecLeft > 0 && quizIdx < quizMode.length);
  const wasSprintActiveRef = useRef(false);
  useEffect(() => {
    if (!sprintActive) return undefined;
    wasSprintActiveRef.current = true;
    const t = setInterval(() => {
      setSprintSecLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [sprintActive]);

  useEffect(() => {
    if (sprintSecLeft === 0 && wasSprintActiveRef.current) {
      wasSprintActiveRef.current = false;
      if (quizMode && quizIdx < quizMode.length) {
        setQuizIdx(quizMode.length);
        showToast('Hết 5 phút Đề Vá Lỗ Hổng!', 'err');
      }
    }
  }, [sprintSecLeft, quizMode, quizIdx]);

  // Guide
  const [guideOpen, setGuideOpen] = useState(false);

  // Feedback
  const [toast, setToast] = useState(null);

  const uid = user?.uid || user?.id;

  const showToast = (text, type = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2400);
  };

  const [loadError, setLoadError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');

      // Luôn đọc trước từ kho dữ liệu câu sai nội bộ (offline-first, hỗ trợ cả khách)
      const localWrongs = getWrongQuestions(uid || 'guest').filter((w) => !w.mastered);

      if (!uid) {
        setWrongQs(localWrongs);
        setSavedQs([]);
        setLoading(false);
        return;
      }

      // Timeout 8s cho Supabase tránh treo khi mạng yếu
      const withTimeout = (p, ms = 8000) =>
        Promise.race([
          p,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Hết thời gian kết nối (Timeout)')), ms)),
        ]);

      let remoteWrongs = [];
      let remoteSaved = [];

      try {
        const [wrongRes, savedRes] = await withTimeout(
          Promise.all([
            supabase
              .from('wrong_questions')
              .select(`
                id, wrong_count, mastered, last_wrong_at,
                question:questions(
                  id, question_number, content, explanation, difficulty, topic_id,
                  exam:exams(id, title, subject:subjects(name)),
                  answers:answers(id, label, content, is_correct)
                )
              `)
              .eq('user_id', uid)
              .eq('mastered', false)
              .order('last_wrong_at', { ascending: false }),

            supabase
              .from('saved_questions')
              .select(`
                id, note, saved_at,
                question:questions(
                  id, question_number, content, explanation, difficulty, topic_id,
                  exam:exams(id, title, subject:subjects(name)),
                  answers:answers(id, label, content, is_correct)
                )
              `)
              .eq('user_id', uid)
              .order('saved_at', { ascending: false }),
          ])
        );

        if (!wrongRes.error) remoteWrongs = wrongRes.data || [];
        if (!savedRes.error) remoteSaved = savedRes.data || [];
      } catch (err) {
        console.warn('[WrongNotebook] Không tải được từ Supabase, dùng cache câu sai nội bộ:', err.message);
      }

      // Hợp nhất câu sai từ Supabase và từ các bài thi lớp / phòng thi ảo / lộ trình
      const combined = [...remoteWrongs];
      const seen = new Set(combined.map((w) => w.question?.content || w.id));
      localWrongs.forEach((lw) => {
        const c = lw.question?.content;
        if (!seen.has(c) && !seen.has(lw.questionId)) {
          combined.push(lw);
          if (c) seen.add(c);
        }
      });

      setWrongQs(combined);
      setSavedQs(remoteSaved);
    } catch (e) {
      console.error('Lỗi hệ thống:', e);
      setLoadError('Không thể tải dữ liệu câu sai. Vui lòng thử lại.');
      showToast('Lỗi tải dữ liệu', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPersonalNotes(loadWrongQuestionNotes(uid || 'guest'));
    try {
      setCustomCauses(JSON.parse(localStorage.getItem('elec_wrong_causes_v1') || '{}'));
    } catch { /* ignore */ }
  }, [uid]);

  useEffect(() => {
    const onCloudSync = () => {
      setPersonalNotes(loadWrongQuestionNotes(uid || 'guest'));
      try {
        setCustomCauses(JSON.parse(localStorage.getItem('elec_wrong_causes_v1') || '{}'));
      } catch { /* ignore */ }
    };
    window.addEventListener('cs-cloud-sync-update', onCloudSync);
    window.addEventListener('elec-student-analytics-change', onCloudSync);
    return () => {
      window.removeEventListener('cs-cloud-sync-update', onCloudSync);
      window.removeEventListener('elec-student-analytics-change', onCloudSync);
    };
  }, [uid]);

  const handleSavePersonalNote = (qid, text) => {
    const next = saveWrongQuestionNote(uid || 'guest', qid, text);
    setPersonalNotes(next);
  };

  useEffect(() => {
    load();
    const onWrongUpdate = () => load();
    window.addEventListener(WRONG_UPDATE_EVENT, onWrongUpdate);
    return () => window.removeEventListener(WRONG_UPDATE_EVENT, onWrongUpdate);
    /* eslint-disable-next-line */
  }, [uid]);

  /* ============ FILTER + SORT ============ */
  const items = tab === 'wrong' ? wrongQs : savedQs;

  const topicCounts = useMemo(() => {
    const m = new Map();
    for (const it of items) {
      const id = it.question?.topic_id || UNCLASSIFIED;
      m.set(id, (m.get(id) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const causeBreakdown = useMemo(
    () => buildWrongCauseBreakdown(wrongQs, customCauses, inferTrapCause, TRAP_CAUSES),
    [wrongQs, customCauses]
  );

  const askAiExplainQuestion = (item) => {
    const q = item?.question || {};
    const qid = getItemQid(item);
    const causeId = customCauses[qid] || inferTrapCause(q);
    const causeLabel = TRAP_CAUSES.find((c) => c.id === causeId)?.label || 'Hổng bản chất';
    const opts = (q.answers || []).map((a) => `${a.label}. ${a.content}`).join('\n');
    const correctAns = (q.answers || []).find((a) => a.is_correct);
    askAI(
      `Em làm sai câu này (nguyên nhân: ${causeLabel}). Hãy giải thích từng bước thật dễ hiểu, chỉ ra bẫy khiến em dễ sai và cho 1 mẹo nhớ nhanh:\n\nCâu hỏi: ${q.content || ''}\n${opts ? `\nCác đáp án:\n${opts}` : ''}${correctAns ? `\nĐáp án đúng: ${correctAns.label}. ${correctAns.content}` : ''}`
    );
  };

  const startCauseSprint = (causeId) => {
    const pool = wrongQs.filter((it) => {
      const q = it.question || {};
      const qid = getItemQid(it);
      return (customCauses[qid] || inferTrapCause(q)) === causeId;
    });
    if (!pool.length) {
      showToast('Chưa có câu nào thuộc nhóm lỗi này', 'err');
      return;
    }
    const picked = [...pool]
      .sort((a, b) => (b.wrong_count || 1) - (a.wrong_count || 1))
      .slice(0, 5);
    setQuizMode(picked);
    setQuizIdx(0);
    setQuizPicked(null);
    setQuizScore(0);
    setSprintSecLeft(300);
  };

  const filtered = useMemo(() => {
    let arr = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((it) => {
        const question = it.question;
        if (!question) return false;
        if (question.content?.toLowerCase().includes(q)) return true;
        if (question.explanation?.toLowerCase().includes(q)) return true;
        if (question.exam?.title?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    if (filterSubject !== 'all') {
      arr = arr.filter((it) => {
        const s = it.subject || it.question?.subject || it.question?.exam?.subject?.id;
        const sName = (it.question?.exam?.subject?.name || '').toLowerCase();
        if (filterSubject === 'ly') return s === 'ly' || sName.includes('vật lí');
        if (filterSubject === 'sinh') return s === 'sinh' || sName.includes('sinh học');
        if (filterSubject === 'hoa') return s === 'hoa' || sName.includes('hóa học') || (!s && !sName.includes('vật lí') && !sName.includes('sinh học'));
        return true;
      });
    }

    if (filterDiff !== 'all') {
      arr = arr.filter((it) => it.question?.difficulty === filterDiff);
    }

    if (filterTopic !== 'all') {
      arr = arr.filter((it) => (it.question?.topic_id || UNCLASSIFIED) === filterTopic);
    }

    if (tab === 'wrong' && filterCause !== 'all') {
      arr = arr.filter((it) => {
        const qid = getItemQid(it);
        const cause = customCauses[qid] || inferTrapCause(it.question);
        return cause === filterCause;
      });
    }

    arr = [...arr].sort((a, b) => {
      const qa = a.question;
      const qb = b.question;
      switch (sortBy) {
        case 'recent':
          return (new Date(b.last_wrong_at || b.saved_at || 0).getTime() || 0) - (new Date(a.last_wrong_at || a.saved_at || 0).getTime() || 0);
        case 'oldest':
          return (new Date(a.last_wrong_at || a.saved_at || 0).getTime() || 0) - (new Date(b.last_wrong_at || b.saved_at || 0).getTime() || 0);
        case 'wrongCount':
          return (b.wrong_count || 0) - (a.wrong_count || 0);
        case 'difficulty': {
          const order = { easy: 1, medium: 2, hard: 3, extreme: 4 };
          return (order[qb?.difficulty] || 0) - (order[qa?.difficulty] || 0);
        }
        default: return 0;
      }
    });

    return arr;
  }, [items, tab, search, filterSubject, filterDiff, filterTopic, filterCause, customCauses, sortBy]);

  /* Keyboard shortcuts for Detail Modal */
  useEffect(() => {
    if (!detail) return undefined;
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
      if (e.key === 'Escape') {
        setDetail(null);
      } else if (e.key === 'ArrowLeft') {
        const idx = filtered.findIndex((x) => x.id === detail.id);
        if (idx > 0) setDetail(filtered[idx - 1]);
      } else if (e.key === 'ArrowRight') {
        const idx = filtered.findIndex((x) => x.id === detail.id);
        if (idx >= 0 && idx < filtered.length - 1) setDetail(filtered[idx + 1]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detail, filtered]);

  const activeFilterCount =
    (filterDiff !== 'all' ? 1 : 0) +
    (filterTopic !== 'all' ? 1 : 0) +
    (tab === 'wrong' && filterCause !== 'all' ? 1 : 0);

  const hasAnyFilter = activeFilterCount > 0 || filterSubject !== 'all' || Boolean(search.trim());

  const resetAllFilters = () => {
    setSearch('');
    setFilterSubject('all');
    setGlobalSubject('all');
    setFilterDiff('all');
    setFilterTopic('all');
    setFilterCause('all');
    try { history.replaceState(null, '', '#notebook'); } catch { /* */ }
  };

  /* ============ STATS ============ */
  const stats = useMemo(() => {
    const totalWrong = wrongQs.length;
    const totalSaved = savedQs.length;
    const totalWrongCount = wrongQs.reduce((s, x) => s + (x.wrong_count || 0), 0);
    return { totalWrong, totalSaved, totalWrongCount };
  }, [wrongQs, savedQs]);

  /* ============ ACTIONS ============ */
  const handleMastered = async (questionId) => {
    try {
      markQuestionMastered(uid || 'guest', questionId);
      if (uid) await markMastered(uid, questionId).catch(() => {});
      setWrongQs((qs) => qs.filter((q) => q.question?.id !== questionId && q.id !== questionId && q.questionId !== questionId));
      setSelected((prev) => {
        if (!prev.has(questionId)) return prev;
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      showToast('Đã đánh dấu hiểu rồi');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleUnsave = async (questionId) => {
    try {
      await unsaveQuestion(uid, questionId);
      setSavedQs((qs) => qs.filter((q) => getItemQid(q) !== questionId));
      setSelected((prev) => {
        if (!prev.has(questionId)) return prev;
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      showToast('Đã bỏ lưu');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleSave = async (questionId) => {
    try {
      await saveQuestion(uid, questionId);
      showToast('Đã lưu vào sổ tay');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };
  void handleSave;

  const handleBulkMastered = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Đánh dấu ${selected.size} câu đã hiểu?`)) return;
    const ids = [...selected];
    const count = ids.length;
    try {
      ids.forEach((qid) => markQuestionMastered(uid || 'guest', qid));
      if (uid) await Promise.all(ids.map((qid) => markMastered(uid, qid).catch(() => {})));
      setWrongQs((qs) => qs.filter((q) => !selected.has(getItemQid(q))));
      setSelected(new Set());
      showToast(`Đã xử lý ${count} câu`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleBulkUnsave = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Bỏ lưu ${selected.size} câu?`)) return;
    const count = selected.size;
    try {
      await Promise.all([...selected].map((qid) => unsaveQuestion(uid, qid)));
      setSavedQs((qs) => qs.filter((q) => !selected.has(getItemQid(q))));
      setSelected(new Set());
      showToast(`Đã bỏ lưu ${count} câu`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const toggleSelect = (qid) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(qid)) n.delete(qid);
      else n.add(qid);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((x) => getItemQid(x)).filter(Boolean)));
  };

  const toggleCardReveal = (qid) => {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  /* ============ COPY / EXPORT / IMPORT ============ */
  const copyItem = async (item) => {
    const q = item.question;
    const text = `Câu hỏi: ${q.content}\n\n${q.answers?.map((a) => `${a.label}. ${a.content}${a.is_correct ? ' ✓' : ''}`).join('\n')}\n\nLời giải: ${q.explanation || '(không có)'}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Đã sao chép');
    } catch {
      showToast('Không sao chép được', 'err');
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify({ wrong: wrongQs, saved: savedQs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notebook-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải backup');
  };

  const exportAnki = () => {
    if (!filtered.length) {
      showToast('Chưa có câu nào để xuất sang Anki', 'err');
      return;
    }
    const questions = filtered.map((item, idx) => {
      const q = item.question || {};
      const ans = Array.isArray(q.answers) ? q.answers : [];
      const correctIdx = ans.findIndex((a) => a.is_correct);
      return {
        num: idx + 1,
        type: ans.length >= 2 ? 'single_choice' : 'short_answer',
        q: q.content || '',
        options: ans.map((a) => a.content || ''),
        correct: correctIdx >= 0 ? correctIdx : 0,
        answer: ans[correctIdx]?.content || '',
        explain: q.explanation || '',
        topic: q.topic || '',
      };
    });
    const tsv = exportToAnkiDeckTsv({ title: 'So-tay-loi-sai-ELEC-AI', subject: filterSubject === 'all' ? 'KHTN' : filterSubject, questions });
    const blob = new Blob([tsv], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So-tay-loi-sai-Anki-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${questions.length} thẻ ôn tập chuẩn Anki (.txt)!`);
  };

  /* ============ QUIZ MODE ============ */
  const startQuiz = () => {
    const pool = filtered.filter((x) => x.question?.answers?.length > 0);
    if (pool.length < 1) {
      showToast('Không có câu nào để làm quiz', 'err');
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSprintSecLeft(0);
    setQuizMode(shuffled);
    setQuizIdx(0);
    setQuizPicked(null);
    setQuizScore(0);
  };

  const start5MinGapSprint = () => {
    const pool = filtered.filter((x) => x.question?.answers?.length > 0);
    if (pool.length < 1) {
      showToast('Chưa có câu sai nào để tạo Đề Vá Lỗ Hổng 5 Phút', 'err');
      return;
    }
    const urgent5 = [...pool]
      .sort((a, b) => (b.wrong_count || 1) - (a.wrong_count || 1))
      .slice(0, 5);
    setSprintSecLeft(300);
    setQuizMode(urgent5);
    setQuizIdx(0);
    setQuizPicked(null);
    setQuizScore(0);
    showToast('Bắt đầu Đề Vá Lỗ Hổng 5 Phút (5 câu hay sai nhất)!');
  };

  const quizCurrent = quizMode?.[quizIdx];
  const quizDone = quizMode && quizIdx >= quizMode.length;

  const handleQuizPick = (answerId) => {
    if (quizPicked) return;
    setQuizPicked(answerId);
    const correct = quizCurrent.question.answers.find((a) => a.is_correct);
    if (answerId === correct?.id) {
      setQuizScore((s) => s + 1);
    } else if (uid && quizCurrent.question?.id) {
      markWrong(uid, quizCurrent.question.id, null).catch(() => {});
    }
  };

  const nextQuiz = () => {
    setQuizIdx((i) => i + 1);
    setQuizPicked(null);
  };

  const closeQuiz = () => {
    wasSprintActiveRef.current = false;
    setSprintSecLeft(0);
    setQuizMode(null);
    setQuizIdx(0);
    setQuizPicked(null);
    setQuizScore(0);
  };

  const openDetailModal = (item) => {
    setDetailRevealAns(!studyHideAns);
    setDetail(item);
  };

  /* ============ RENDER ============ */
  if (loading) {
    return (
      <div className="nb">
        <div className="nb-loading">
          <div className="nb-loading-spinner" />
          <p>Đang tải sổ lỗi sai…</p>
        </div>
      </div>
    );
  }

  if (loadError && !wrongQs.length && !savedQs.length) {
    return (
      <div className="nb">
        <div className="nb-empty nb-error-state">
          <img src="/img/elec/elec-shy.png" alt="Lỗi tải dữ liệu" className="nb-empty-mascot" />
          <h3>Không thể tải sổ lỗi sai</h3>
          <p>{loadError}</p>
          <button type="button" className="nb-btn nb-btn-primary" onClick={load}>
            <IcoRefresh size={15} /><span>Thử lại ngay</span>
          </button>
        </div>
      </div>
    );
  }

  const showCausePanel = tab === 'wrong' && wrongQs.length > 0 && causeBreakdown[0]?.count > 0;
  const quizAccuracy = quizMode?.length ? Math.round((quizScore / quizMode.length) * 100) : 0;

  return (
    <div className="nb nb-studio nb-apple">
      {/* ============ COMPACT APPLE EDITORIAL TOPBAR ============ */}
      <header className="nb-hero">
        <div className="nb-hero-top">
          <div className="nb-hero-brand">
            <div className="nb-hero-avatar">
              <img src="/img/elec/elec-suspicious.png" alt="Elec Soi Lỗi Sai" />
            </div>
            <div className="nb-hero-copy">
              <div className="nb-title-row">
                <h1 className="nb-title">Sổ lỗi sai</h1>
                <span className="nb-eyebrow">
                  <IcoSparkle size={11} />
                  <span>KHTN</span>
                </span>
              </div>
              <p className="nb-sub">
                Phân tích gốc rễ câu sai, tự kiểm tra trí nhớ và ôn luyện chuẩn xác cùng Elec.
              </p>
            </div>
          </div>

          <div className="nb-hero-right">
            <div className="nb-hero-actions">
              <button
                type="button"
                className="nb-cta nb-cta-play"
                onClick={startQuiz}
                disabled={filtered.length === 0}
              >
                <IcoPlay size={14} />
                <span>Luyện tập</span>
              </button>
              <button
                type="button"
                className="nb-cta nb-cta-sprint"
                onClick={start5MinGapSprint}
                disabled={filtered.length === 0}
                title="Tạo nhanh đề 5 câu từ các lỗi sai nhiều nhất trong 5 phút"
              >
                <IcoFire size={14} />
                <span>Vá lỗi 5p</span>
              </button>
              <button
                type="button"
                className="nb-cta nb-cta-srs"
                onClick={() => { window.location.hash = '#quiz'; }}
                title="Ôn lặp lại ngắt quãng — hệ SRS của Ôn tập thông minh"
              >
                <IcoRefresh size={14} />
                <span>SRS</span>
              </button>
            </div>

            <div className="nb-hero-utils">
              <button
                type="button"
                className="nb-util-btn"
                onClick={() => setGuideOpen(true)}
                title="Xem hướng dẫn sử dụng"
              >
                <IcoInfo size={14} /><span>Hướng dẫn</span>
              </button>
              <button
                type="button"
                className="nb-util-btn"
                onClick={exportAnki}
                disabled={filtered.length === 0}
                title="Xuất câu sai sang thẻ nhớ Anki / AnkiDroid (FSRS)"
              >
                <IcoDownload size={14} /><span>Anki</span>
              </button>
              <button
                type="button"
                className="nb-util-btn"
                onClick={exportJSON}
                title="Tải backup JSON"
              >
                <IcoDownload size={14} /><span>Backup</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MACOS NAVIGATION SPLIT VIEW (LEFT SMART SIDEBAR + RIGHT CANVAS) ============ */}
      <div className="nb-workspace nb-split-apple">
        {/* ── LEFT STICKY APPLE REMINDERS SIDEBAR ── */}
        <aside className={'nb-aside' + (mobileFilterOpen ? ' is-mobile-open' : '')}>
          {/* 2x2 Apple Reminders Smart-List Grid */}
          <section className="nb-smart-grid" aria-label="Thống kê nhanh & chuyển danh mục">
            <button
              type="button"
              className={'nb-kpi-card is-rose is-interactive' + (tab === 'wrong' ? ' is-selected' : '')}
              onClick={() => { setTab('wrong'); setSelected(new Set()); setFilterTopic('all'); }}
            >
              <div className="nb-kpi-head">
                <span className="nb-kpi-ico"><IcoX size={14} /></span>
                <b>{stats.totalWrong}</b>
              </div>
              <small>Câu sai</small>
            </button>

            <button
              type="button"
              className={'nb-kpi-card is-cobalt is-interactive' + (tab === 'saved' ? ' is-selected' : '')}
              onClick={() => { setTab('saved'); setSelected(new Set()); setFilterTopic('all'); }}
            >
              <div className="nb-kpi-head">
                <span className="nb-kpi-ico"><IcoBookMark size={14} filled /></span>
                <b>{stats.totalSaved}</b>
              </div>
              <small>Đã lưu</small>
            </button>

            <div className="nb-kpi-card is-amber">
              <div className="nb-kpi-head">
                <span className="nb-kpi-ico"><IcoFire size={14} /></span>
                <b>{stats.totalWrongCount}</b>
              </div>
              <small>Lượt sai</small>
            </div>

            <div className="nb-kpi-card is-emerald">
              <div className="nb-kpi-head">
                <span className="nb-kpi-ico"><IcoStats size={14} /></span>
                <b>{filtered.length}</b>
              </div>
              <small>Đang xem</small>
            </div>
          </section>

          {/* Root-Cause Analytics Panel */}
          {showCausePanel && (
            <section className="nb-side-card nb-cause-card" aria-label="Phân tích nguyên nhân sai">
              <div className="nb-side-head">
                <div>
                  <h2 className="nb-side-title">Bản đồ gốc rễ lỗi sai</h2>
                  <p className="nb-side-sub">
                    Hay sai nhất:{' '}
                    <b style={{ color: causeBreakdown[0].color }}>{causeBreakdown[0].label}</b>{' '}
                    ({causeBreakdown[0].pct}%)
                  </p>
                </div>
              </div>

              <div className="nb-cause-list">
                {causeBreakdown.map((c) => {
                  const isActive = filterCause === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={'nb-cause-row' + (isActive ? ' active' : '')}
                      onClick={() => setFilterCause((prev) => (prev === c.id ? 'all' : c.id))}
                      title={`Bấm để lọc riêng nhóm "${c.label}"`}
                    >
                      <div className="nb-cause-row-top">
                        <span className="nb-cause-name">
                          <i className="nb-cause-dot" style={{ background: c.color }} />
                          {c.label}
                        </span>
                        <b>{c.count} · {c.pct}%</b>
                      </div>
                      <div className="nb-cause-track">
                        <div
                          className="nb-cause-fill"
                          style={{ width: `${Math.max(c.count ? 8 : 0, c.pct)}%`, background: c.color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="nb-cause-sprint-cta"
                onClick={() => startCauseSprint(causeBreakdown[0].id)}
              >
                <IcoFire size={14} />
                <span>Vá nhóm này (5 phút)</span>
              </button>
            </section>
          )}

          {/* Smart Filter Panel */}
          <section className="nb-side-card nb-filter-card" aria-label="Bộ lọc thông minh">
            <div className="nb-side-head">
              <h2 className="nb-side-title">
                <IcoFilter size={14} />
                <span>Bộ lọc</span>
              </h2>
              {hasAnyFilter && (
                <button type="button" className="nb-reset-link" onClick={resetAllFilters}>
                  Đặt lại
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="nb-filter-group">
              <div className="nb-filter-label">Độ khó</div>
              <div className="nb-diff-grid">
                {DIFFICULTIES.map((d) => {
                  const isActive = filterDiff === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={'nb-chip' + (isActive ? ' on' : '')}
                      style={isActive && d.color ? { '--chip-accent': d.color } : undefined}
                      onClick={() => setFilterDiff(d.id)}
                    >
                      {d.color && <span className="nb-chip-dot" style={{ background: d.color }} />}
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cause Filter fallback when Cause Analytics panel is not shown */}
            {tab === 'wrong' && !showCausePanel && (
              <div className="nb-filter-group">
                <div className="nb-filter-label">Nguyên nhân sai</div>
                <div className="nb-cause-chips">
                  {TRAP_CAUSES.map((c) => {
                    const isActive = filterCause === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={'nb-chip' + (isActive ? ' on' : '')}
                        style={isActive && c.color ? { '--chip-accent': c.color } : undefined}
                        onClick={() => setFilterCause(c.id)}
                      >
                        {c.color && <span className="nb-chip-dot" style={{ background: c.color }} />}
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topic Filter List */}
            {(topicCounts.some(([id]) => id !== UNCLASSIFIED) || filterTopic !== 'all') && (
              <div className="nb-filter-group">
                <div className="nb-filter-label">Chuyên đề ({topicCounts.length})</div>
                <div className="nb-topic-list">
                  <button
                    type="button"
                    className={'nb-topic-item' + (filterTopic === 'all' ? ' on' : '')}
                    onClick={() => {
                      setFilterTopic('all');
                      try { history.replaceState(null, '', '#notebook'); } catch { /* */ }
                    }}
                  >
                    <span>Mọi chuyên đề</span>
                    <em>{items.length}</em>
                  </button>
                  {filterTopic !== 'all' && !topicCounts.some(([id]) => id === filterTopic) && (
                    <button
                      type="button"
                      className="nb-topic-item on"
                      onClick={() => {
                        setFilterTopic('all');
                        try { history.replaceState(null, '', '#notebook'); } catch { /* */ }
                      }}
                    >
                      <span>{topicName(filterTopic)}</span>
                      <em>0</em>
                    </button>
                  )}
                  {topicCounts.map(([id, n]) => (
                    <button
                      key={id}
                      type="button"
                      className={'nb-topic-item' + (filterTopic === id ? ' on' : '')}
                      onClick={() => setFilterTopic(id)}
                    >
                      <span>{topicName(id)}</span>
                      <em>{n}</em>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>

        {/* ── RIGHT MAIN CONTENT STREAM ── */}
        <main className="nb-main">
          {/* Unified Control Panel */}
          <div className="nb-controls">
            <div className="nb-controls-top">
              <nav className="nb-tabs" aria-label="Chuyển danh mục">
                <button
                  type="button"
                  className={'nb-tab' + (tab === 'wrong' ? ' on' : '')}
                  onClick={() => { setTab('wrong'); setSelected(new Set()); setFilterTopic('all'); }}
                >
                  <IcoBookOpen size={15} />
                  <span>Câu sai</span>
                  <em>{wrongQs.length}</em>
                </button>
                <button
                  type="button"
                  className={'nb-tab' + (tab === 'saved' ? ' on' : '')}
                  onClick={() => { setTab('saved'); setSelected(new Set()); setFilterTopic('all'); }}
                >
                  <IcoStar size={15} filled />
                  <span>Đã lưu</span>
                  <em>{savedQs.length}</em>
                </button>
              </nav>

              <label className="nb-search">
                <IcoSearch size={15} />
                <input
                  type="search"
                  placeholder="Tìm câu hỏi, lời giải, tên đề…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">
                    <IcoClose size={13} />
                  </button>
                )}
              </label>
            </div>

            <div className="nb-controls-bar">
              <div className="nb-subject-pills" role="group" aria-label="Lọc theo môn học">
                {SUBJECT_TABS.map((sub) => {
                  const isActive = filterSubject === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      className={'nb-subj-pill' + (isActive ? ' on' : '')}
                      style={isActive ? { '--subj-color': sub.color } : undefined}
                      onClick={() => {
                        setFilterSubject(sub.id);
                        setGlobalSubject(sub.id);
                      }}
                    >
                      <span className="nb-subj-dot" style={{ background: sub.color }} />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="nb-controls-right">
                <button
                  type="button"
                  className={'nb-mode-pill' + (studyHideAns ? ' is-on' : '')}
                  onClick={() => {
                    setStudyHideAns((v) => !v);
                    setRevealedCards(new Set());
                  }}
                  title="Ẩn đáp án đúng và lời giải trên danh sách để tự kiểm tra trí nhớ"
                >
                  {studyHideAns ? <IcoEyeOff size={14} /> : <IcoEye size={14} />}
                  <span>{studyHideAns ? 'Đang ẩn đáp án' : 'Chế độ tự ôn'}</span>
                </button>

                <label className="nb-select" title="Sắp xếp câu hỏi">
                  <IcoSort size={14} />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="wrongCount">Sai nhiều nhất</option>
                    <option value="difficulty">Độ khó cao</option>
                  </select>
                </label>

                <div className="nb-seg" role="group" aria-label="Kiểu hiển thị">
                  <button
                    type="button"
                    className={viewMode === 'list' ? 'on' : ''}
                    onClick={() => setViewMode('list')}
                    title="Danh sách"
                    aria-label="Danh sách"
                  >
                    <IcoList size={15} />
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'grid' ? 'on' : ''}
                    onClick={() => setViewMode('grid')}
                    title="Lưới 2 cột"
                    aria-label="Lưới"
                  >
                    <IcoGrid size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  className={'nb-mobile-filter-btn' + (activeFilterCount > 0 ? ' has-active' : '')}
                  onClick={() => setMobileFilterOpen((v) => !v)}
                >
                  <IcoFilter size={14} />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 && <em>{activeFilterCount}</em>}
                </button>
              </div>
            </div>

            {/* Active filters strip */}
            {hasAnyFilter && (
              <div className="nb-active-strip">
                <span className="nb-active-label">Đang lọc:</span>
                {filterDiff !== 'all' && (
                  <button type="button" className="nb-active-tag" onClick={() => setFilterDiff('all')}>
                    Độ khó: {DIFF_LABELS[filterDiff]} <IcoClose size={11} />
                  </button>
                )}
                {tab === 'wrong' && filterCause !== 'all' && (
                  <button type="button" className="nb-active-tag" onClick={() => setFilterCause('all')}>
                    {TRAP_CAUSES.find((c) => c.id === filterCause)?.label} <IcoClose size={11} />
                  </button>
                )}
                {filterTopic !== 'all' && (
                  <button
                    type="button"
                    className="nb-active-tag"
                    onClick={() => {
                      setFilterTopic('all');
                      try { history.replaceState(null, '', '#notebook'); } catch { /* */ }
                    }}
                  >
                    Chuyên đề: {topicName(filterTopic)} <IcoClose size={11} />
                  </button>
                )}
                {search.trim() && (
                  <button type="button" className="nb-active-tag" onClick={() => setSearch('')}>
                    “{search.trim()}” <IcoClose size={11} />
                  </button>
                )}
                <button type="button" className="nb-reset-link" onClick={resetAllFilters}>
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div className="nb-bulk">
              <span className="nb-bulk-info">Đã chọn <b>{selected.size}</b> câu hỏi</span>
              <div className="nb-bulk-actions">
                {tab === 'wrong' && (
                  <button type="button" className="nb-btn nb-btn-primary" onClick={handleBulkMastered}>
                    <IcoCheckCircle size={15} /><span>Đánh dấu đã hiểu</span>
                  </button>
                )}
                {tab === 'saved' && (
                  <button type="button" className="nb-btn nb-btn-danger" onClick={handleBulkUnsave}>
                    <IcoTrash size={15} /><span>Bỏ lưu đã chọn</span>
                  </button>
                )}
                <button type="button" className="nb-btn" onClick={() => setSelected(new Set())}>
                  <IcoClose size={14} /><span>Bỏ chọn</span>
                </button>
              </div>
            </div>
          )}

          {/* Question List or Empty State */}
          {filtered.length === 0 ? (
            <div className="nb-empty">
              <img
                src={items.length === 0 ? '/img/elec/elec-celebrate.png' : '/img/elec/elec-shy.png'}
                alt="Elec Mascot"
                className="nb-empty-mascot"
              />
              <h3>
                {items.length === 0
                  ? (tab === 'wrong' ? 'Tuyệt vời! Bạn chưa có câu sai nào' : 'Chưa có câu nào được lưu')
                  : 'Không tìm thấy câu hỏi phù hợp'}
              </h3>
              <p>
                {items.length === 0
                  ? (tab === 'wrong'
                    ? 'Khi bạn làm đề trong Phòng thi ảo, Lộ trình học tập hoặc Lớp học — các câu làm sai sẽ tự động được Elec gom vào đây để ôn lại.'
                    : 'Bấm biểu tượng ngôi sao trên câu hỏi trong lúc xem bài để lưu vào sổ tay.')
                  : 'Thử điều chỉnh lại bộ lọc môn học, độ khó hoặc xóa từ khóa tìm kiếm.'}
              </p>
              <div className="nb-empty-actions">
                {items.length > 0 ? (
                  <button type="button" className="nb-btn nb-btn-primary" onClick={resetAllFilters}>
                    <IcoClose size={15} /><span>Xóa toàn bộ bộ lọc</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="nb-btn nb-btn-primary"
                    onClick={() => { window.location.hash = '#virtual-exams'; }}
                  >
                    <IcoPlay size={15} /><span>Vào Phòng thi ảo luyện đề</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="nb-list-meta">
                <label className="nb-selectall-label">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                  />
                  <span>Chọn tất cả ({filtered.length} câu)</span>
                </label>
                <span className="nb-list-hint">Bấm vào thẻ để xem chi tiết &amp; ghi chú</span>
              </div>

              <ul className={'nb-list ' + viewMode}>
                {filtered.map((item) => {
                  const q = item.question || {};
                  const qid = getItemQid(item);
                  const isSelected = selected.has(qid);
                  const diff = q.difficulty || 'medium';
                  const diffColor = DIFF_COLORS[diff] || '#2563eb';
                  const causeId = customCauses[qid] || inferTrapCause(q);
                  const causeMeta = TRAP_CAUSES.find((c) => c.id === causeId) || TRAP_CAUSES[1];
                  const isAnsHidden = studyHideAns && !revealedCards.has(qid);
                  const notePreview = personalNotes[qid] || '';
                  const compactGrid = viewMode === 'list' && hasCompactAnswers(q.answers);

                  return (
                    <li
                      key={item.id}
                      className={'nb-card' + (isSelected ? ' selected' : '')}
                      style={{ '--nb-diff': diffColor }}
                    >
                      <header className="nb-card-head">
                        <label className="nb-check" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(qid)}
                            aria-label="Chọn câu hỏi"
                          />
                        </label>

                        <div className="nb-card-badges">
                          {tab === 'wrong' && item.wrong_count > 0 && (
                            <span className="nb-badge wrong">
                              <IcoX size={11} />Sai {item.wrong_count} lần
                            </span>
                          )}
                          {tab === 'saved' && (
                            <span className="nb-badge saved">
                              <IcoStar size={11} filled />Đã lưu
                            </span>
                          )}
                          <span className={'nb-badge diff is-' + diff}>
                            {DIFF_LABELS[diff] || diff}
                          </span>
                          {q.exam?.subject?.name && (
                            <span className="nb-badge subject">{q.exam.subject.name}</span>
                          )}
                          {q.topic_id && (
                            <span className="nb-badge topic">{topicName(q.topic_id)}</span>
                          )}
                        </div>

                        {tab === 'wrong' && (
                          <select
                            className="nb-cause-select"
                            value={causeId}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setQuestionCause(qid, e.target.value)}
                            style={{ '--cause-color': causeMeta.color || '#64748b' }}
                            title="Phân loại nguyên nhân sai để vá lỗ hổng gốc rễ"
                            aria-label="Nguyên nhân sai"
                          >
                            {TRAP_CAUSES.filter((c) => c.id !== 'all').map((c) => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        )}
                      </header>

                      <div className="nb-card-body" onClick={() => openDetailModal(item)}>
                        <MathText as="p" className="nb-q">{q.content}</MathText>

                        {Array.isArray(q.answers) && q.answers.length > 0 && (
                          <div className={'nb-answers' + (compactGrid ? ' is-two-col' : '')}>
                            {q.answers.map((a) => {
                              const showRight = !isAnsHidden && a.is_correct;
                              return (
                                <div key={a.id} className={'nb-answer' + (showRight ? ' correct' : '')}>
                                  <span className="nb-answer-lbl">{a.label}</span>
                                  <MathText as="span" className="nb-answer-txt">{a.content}</MathText>
                                  {showRight && (
                                    <span className="nb-answer-check" aria-label="Đáp án đúng">
                                      <IcoCheck size={11} />
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!isAnsHidden && q.explanation && (
                          <div className="nb-explain">
                            <span className="nb-explain-ico"><IcoBulb size={15} /></span>
                            <div className="nb-explain-content">
                              <b>Lời giải chi tiết</b>
                              <MathText as="p">{q.explanation}</MathText>
                            </div>
                          </div>
                        )}

                        {notePreview && (
                          <div className="nb-card-note">
                            <IcoNote size={13} />
                            <span><b>Ghi chú của bạn:</b> {notePreview}</span>
                          </div>
                        )}
                      </div>

                      <footer className="nb-card-foot">
                        <div className="nb-card-foot-l">
                          {q.exam?.title && (
                            <span className="nb-source" title={q.exam.title}>
                              <IcoTag size={12} />
                              <span>{q.exam.title}</span>
                            </span>
                          )}
                          {studyHideAns && (
                            <button
                              type="button"
                              className="nb-reveal-inline"
                              onClick={(e) => { e.stopPropagation(); toggleCardReveal(qid); }}
                            >
                              {isAnsHidden ? <IcoEye size={13} /> : <IcoEyeOff size={13} />}
                              <span>{isAnsHidden ? 'Hiện đáp án' : 'Ẩn đáp án'}</span>
                            </button>
                          )}
                        </div>

                        <div className="nb-card-actions">
                          <button
                            type="button"
                            className="nb-act nb-act-ai"
                            onClick={() => askAiExplainQuestion(item)}
                            title="Hỏi AI giải thích cặn kẽ bẫy câu này"
                          >
                            <IcoSparkle size={13} />
                            <span>Hỏi AI</span>
                          </button>
                          <button
                            type="button"
                            className="nb-act"
                            onClick={() => openDetailModal(item)}
                            title="Xem chi tiết & viết ghi chú"
                          >
                            <IcoEye size={13} />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            type="button"
                            className="nb-icon"
                            onClick={() => copyItem(item)}
                            title="Sao chép câu hỏi"
                            aria-label="Sao chép"
                          >
                            <IcoCopy size={14} />
                          </button>
                          {tab === 'wrong' && (
                            <button
                              type="button"
                              className="nb-act nb-act-ok"
                              onClick={() => handleMastered(qid)}
                              title="Đánh dấu đã hiểu và dọn khỏi danh sách sai"
                            >
                              <IcoCheckCircle size={13} />
                              <span>Đã hiểu</span>
                            </button>
                          )}
                          {tab === 'saved' && (
                            <button
                              type="button"
                              className="nb-act nb-act-danger"
                              onClick={() => handleUnsave(qid)}
                              title="Bỏ lưu câu này"
                            >
                              <IcoTrash size={13} />
                              <span>Bỏ lưu</span>
                            </button>
                          )}
                        </div>
                      </footer>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </main>
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {detail && (() => {
        const detailQid = getItemQid(detail);
        const curIdx = filtered.findIndex((x) => x.id === detail.id);
        const hasPrev = curIdx > 0;
        const hasNext = curIdx >= 0 && curIdx < filtered.length - 1;
        const noteVal = personalNotes[detailQid] || '';
        const diff = detail.question?.difficulty || 'medium';
        const causeId = customCauses[detailQid] || inferTrapCause(detail.question);
        const causeMeta = TRAP_CAUSES.find((c) => c.id === causeId) || TRAP_CAUSES[1];

        return (
          <div className="nb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
            <div className="nb-detail" role="dialog" aria-modal="true" aria-label="Chi tiết câu hỏi">
              <header className="nb-detail-head">
                <div className="nb-detail-badges">
                  <span className={'nb-badge diff is-' + diff}>{DIFF_LABELS[diff] || 'Trung bình'}</span>
                  {tab === 'wrong' && detail.wrong_count > 0 && (
                    <span className="nb-badge wrong"><IcoX size={11} />Sai {detail.wrong_count} lần</span>
                  )}
                  {tab === 'saved' && (
                    <span className="nb-badge saved"><IcoStar size={11} filled />Đã lưu</span>
                  )}
                  {curIdx >= 0 && (
                    <span className="nb-badge subject">Câu {curIdx + 1} / {filtered.length}</span>
                  )}
                </div>
                <div className="nb-detail-head-r">
                  <button
                    type="button"
                    className={'nb-reveal-toggle' + (detailRevealAns ? ' is-on' : '')}
                    onClick={() => setDetailRevealAns((v) => !v)}
                  >
                    {detailRevealAns ? <IcoEyeOff size={13} /> : <IcoEye size={13} />}
                    <span>{detailRevealAns ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                  </button>
                  <button type="button" className="nb-icon nb-modal-close" onClick={() => setDetail(null)} aria-label="Đóng">
                    <IcoClose size={16} />
                  </button>
                </div>
              </header>

              <div className="nb-detail-body">
                {tab === 'wrong' && (
                  <div className="nb-detail-cause-bar">
                    <span>Nguyên nhân sai:</span>
                    <select
                      className="nb-cause-select"
                      value={causeId}
                      onChange={(e) => setQuestionCause(detailQid, e.target.value)}
                      style={{ '--cause-color': causeMeta.color || '#64748b' }}
                    >
                      {TRAP_CAUSES.filter((c) => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <MathText as="h2" className="nb-detail-q">{detail.question.content}</MathText>

                <div className="nb-answers">
                  {detail.question.answers?.map((a) => (
                    <div key={a.id} className={'nb-answer' + (detailRevealAns && a.is_correct ? ' correct' : '')}>
                      <span className="nb-answer-lbl">{a.label}</span>
                      <MathText as="span" className="nb-answer-txt">{a.content}</MathText>
                      {detailRevealAns && a.is_correct && (
                        <span className="nb-answer-check"><IcoCheck size={11} /></span>
                      )}
                    </div>
                  ))}
                </div>

                {detailRevealAns && detail.question.explanation && (
                  <div className="nb-explain">
                    <span className="nb-explain-ico"><IcoBulb size={16} /></span>
                    <div className="nb-explain-content">
                      <b>Lời giải chi tiết</b>
                      <MathText as="p">{detail.question.explanation}</MathText>
                    </div>
                  </div>
                )}

                {detail.question.exam?.title && (
                  <div className="nb-source nb-detail-source">
                    <IcoTag size={13} />
                    <span>{detail.question.exam.title}</span>
                  </div>
                )}

                {/* Ghi chú cá nhân 500 ký tự */}
                <div className="nb-note-box">
                  <div className="nb-note-head">
                    <b><IcoNote size={14} /> Ghi chú cá nhân (tự lưu)</b>
                    <span>{noteVal.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    className="nb-note-input"
                    value={noteVal}
                    onChange={(e) => handleSavePersonalNote(detailQid, e.target.value)}
                    placeholder="Ghi nhanh lý do mình sai, công thức cần nhớ hoặc mẹo tránh bẫy cho câu này…"
                  />
                </div>
              </div>

              <footer className="nb-detail-foot">
                <div className="nb-step-nav">
                  <button
                    type="button"
                    className="nb-btn"
                    disabled={!hasPrev}
                    onClick={() => hasPrev && setDetail(filtered[curIdx - 1])}
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    className="nb-btn"
                    disabled={!hasNext}
                    onClick={() => hasNext && setDetail(filtered[curIdx + 1])}
                  >
                    Sau →
                  </button>
                </div>

                <div className="nb-detail-foot-r">
                  <button
                    type="button"
                    className="nb-btn nb-btn-ai"
                    onClick={() => {
                      const cur = detail;
                      setDetail(null);
                      askAiExplainQuestion(cur);
                    }}
                  >
                    <IcoSparkle size={14} /><span>Hỏi AI</span>
                  </button>
                  <button type="button" className="nb-btn" onClick={() => copyItem(detail)}>
                    <IcoCopy size={14} /><span>Chép</span>
                  </button>
                  {tab === 'wrong' && (
                    <button
                      type="button"
                      className="nb-btn nb-btn-success"
                      onClick={() => { handleMastered(detailQid); setDetail(null); }}
                    >
                      <IcoCheckCircle size={15} /><span>Đã hiểu</span>
                    </button>
                  )}
                  {tab === 'saved' && (
                    <button
                      type="button"
                      className="nb-btn nb-btn-danger"
                      onClick={() => { handleUnsave(detailQid); setDetail(null); }}
                    >
                      <IcoTrash size={15} /><span>Bỏ lưu</span>
                    </button>
                  )}
                </div>
              </footer>
            </div>
          </div>
        );
      })()}

      {/* ============ QUIZ / SPRINT MODAL ============ */}
      {quizMode && (
        <div className="nb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeQuiz()}>
          <div className="nb-quiz" role="dialog" aria-modal="true" aria-label="Chế độ luyện tập sổ lỗi sai">
            {quizDone ? (
              <div className="nb-quiz-result">
                <img
                  src={quizScore >= Math.ceil(quizMode.length * 0.8) ? '/img/elec/elec-celebrate.png' : '/img/elec/elec-fighting.png'}
                  alt="Bé Elec Chúc Mừng"
                  className="nb-quiz-mascot"
                />
                <span className="nb-quiz-acc-pill">{quizAccuracy}% chính xác</span>
                <h2>{quizAccuracy >= 80 ? 'Quá xuất sắc!' : 'Hoàn thành phiên ôn!'}</h2>
                <p className="nb-quiz-score">
                  Bạn trả lời đúng <b>{quizScore}</b> / <b>{quizMode.length}</b> câu cùng Bé Elec
                </p>
                <div className="nb-quiz-actions">
                  <button type="button" className="nb-btn" onClick={closeQuiz}>Đóng lại</button>
                  <button type="button" className="nb-btn nb-btn-primary" onClick={startQuiz}>
                    <IcoShuffle size={15} /><span>Luyện lượt mới</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <header className="nb-quiz-head">
                  <div className="nb-quiz-progress">
                    <div className="nb-quiz-meta-row">
                      <span className="nb-quiz-title-chip">
                        <img src="/img/elec/elec-fighting.png" alt="Bé Elec" />
                        <span>Câu {quizIdx + 1} / {quizMode.length}</span>
                      </span>
                      <div className="nb-quiz-pills">
                        <span className="nb-quiz-score-pill">Đúng {quizScore}</span>
                        {sprintSecLeft > 0 && (
                          <span className={'nb-quiz-timer' + (sprintSecLeft < 60 ? ' is-urgent' : '')}>
                            <IcoClock size={13} />
                            <span>{Math.floor(sprintSecLeft / 60)}:{String(sprintSecLeft % 60).padStart(2, '0')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="nb-quiz-bar">
                      <i style={{ width: `${((quizIdx + 1) / quizMode.length) * 100}%` }} />
                    </div>
                  </div>
                  <button type="button" className="nb-icon nb-modal-close" onClick={closeQuiz} aria-label="Đóng">
                    <IcoClose size={16} />
                  </button>
                </header>

                <div className="nb-quiz-body">
                  <MathText as="p" className="nb-quiz-q">{quizCurrent.question.content}</MathText>
                  <div className="nb-quiz-answers">
                    {quizCurrent.question.answers?.map((a) => {
                      const isCorrect = a.is_correct;
                      const isPicked = quizPicked === a.id;
                      let cls = 'nb-quiz-answer';
                      if (quizPicked) {
                        if (isCorrect) cls += ' correct';
                        else if (isPicked) cls += ' wrong';
                        else cls += ' dim';
                      }
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={cls}
                          disabled={!!quizPicked}
                          onClick={() => handleQuizPick(a.id)}
                        >
                          <span className="nb-quiz-lbl">{a.label}</span>
                          <MathText as="span" className="nb-quiz-txt">{a.content}</MathText>
                          {quizPicked && isCorrect && (
                            <span className="nb-quiz-answer-check"><IcoCheck size={13} /></span>
                          )}
                          {quizPicked && isPicked && !isCorrect && (
                            <span className="nb-quiz-answer-check wrong"><IcoX size={13} /></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizPicked && quizCurrent.question.explanation && (
                    <div className="nb-explain">
                      <span className="nb-explain-ico"><IcoBulb size={16} /></span>
                      <div className="nb-explain-content">
                        <b>Lời giải chi tiết</b>
                        <MathText as="p">{quizCurrent.question.explanation}</MathText>
                      </div>
                    </div>
                  )}
                </div>

                {quizPicked && (
                  <footer className="nb-quiz-foot">
                    {tab === 'wrong' && (
                      <button
                        type="button"
                        className="nb-btn"
                        onClick={() => handleMastered(getItemQid(quizCurrent))}
                      >
                        <IcoCheckCircle size={15} /><span>Đánh dấu đã hiểu</span>
                      </button>
                    )}
                    <button type="button" className="nb-btn nb-btn-primary" onClick={nextQuiz}>
                      <span>{quizIdx === quizMode.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
                      <IcoArrowUp size={15} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                  </footer>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className={'nb-toast ' + (toast.type === 'err' ? 'err' : 'ok')}>
          {toast.type === 'err' ? <IcoX size={14} /> : <IcoCheck size={14} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ============ GUIDE ============ */}
      <NotebookGuide forceOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
