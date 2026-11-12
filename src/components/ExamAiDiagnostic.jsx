/* ============================================================
   ExamAiDiagnostic.jsx — AI Chẩn đoán điểm yếu & Đơn thuốc học tập
   ------------------------------------------------------------
   Phân tích bài thi sau khi học sinh làm xong:
     1. Thống kê tỷ lệ làm đúng/sai theo từng chuyên đề & cấp độ Bloom
     2. AI phân tích chuyên sâu: chỉ rõ học sinh bị yếu bài nào, vì sao
     3. Bóc tách bẫy ở các câu sai & kê đơn học tập 3 bước để bù hổng
   ============================================================ */

import React, { useState, useMemo, useEffect } from 'react';
import MathText from './MathText.jsx';
import { callModel, parseJsonLoose } from '../lib/examAiUtils.js';

const IcoSpark = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
  </svg>
);

const IcoAlert = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IcoCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoBook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function ExamAiDiagnostic({ exam, result }) {
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRequested, setHasRequested] = useState(false);

  /* Thống kê chuyên đề & mức độ bằng code (luôn tức thì & chính xác 100%) */
  const { topicStats, levelStats, wrongQuestions, strongestTopic, weakestTopic } = useMemo(() => {
    if (!exam?.questions || !result?.detail) {
      return { topicStats: [], levelStats: {}, wrongQuestions: [], strongestTopic: null, weakestTopic: null };
    }

    const tMap = {};
    const lMap = {
      nb: { key: 'nb', label: 'Nhận biết', correct: 0, total: 0 },
      th: { key: 'th', label: 'Thông hiểu', correct: 0, total: 0 },
      vd: { key: 'vd', label: 'Vận dụng', correct: 0, total: 0 },
      vdc: { key: 'vdc', label: 'Vận dụng cao', correct: 0, total: 0 },
    };

    const wrongs = [];

    exam.questions.forEach((q, i) => {
      const d = result.detail[i] || {};
      const tName = String(q.topic || 'Chuyên đề trọng tâm').trim();
      if (!tMap[tName]) {
        tMap[tName] = { name: tName, total: 0, correct: 0, wrong: 0, points: 0 };
      }
      tMap[tName].total += 1;

      const lvl = String(q.level || 'nb').toLowerCase();
      const normLvl = lvl.includes('vdc') || lvl.includes('cao') ? 'vdc'
        : lvl.includes('vd') || lvl.includes('dung') ? 'vd'
        : lvl.includes('th') || lvl.includes('hieu') ? 'th'
        : 'nb';

      if (lMap[normLvl]) lMap[normLvl].total += 1;

      if (d.isCorrect) {
        tMap[tName].correct += 1;
        if (lMap[normLvl]) lMap[normLvl].correct += 1;
      } else {
        tMap[tName].wrong += 1;
        wrongs.push({
          index: i,
          question: q,
          detail: d,
          topic: tName,
          level: normLvl,
        });
      }
    });

    const topicList = Object.values(tMap).map((t) => ({
      ...t,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    })).sort((a, b) => a.accuracy - b.accuracy); // Yếu nhất xếp trước

    const weakest = topicList.length > 0 && topicList[0].accuracy < 75 ? topicList[0] : null;
    const strongest = topicList.length > 0 && topicList[topicList.length - 1].accuracy >= 75 ? topicList[topicList.length - 1] : null;

    return {
      topicStats: topicList,
      levelStats: lMap,
      wrongQuestions: wrongs,
      strongestTopic: strongest,
      weakestTopic: weakest,
    };
  }, [exam, result]);

  /* Gọi AI chẩn đoán chuyên sâu */
  const handleAnalyzeWithAI = async () => {
    setLoading(true);
    setError(null);
    setHasRequested(true);

    try {
      const system = `Bạn là Chuyên gia Khảo thí & Cố vấn Sư phạm AI của ELEC AI.
Học sinh vừa làm xong bài kiểm tra. Hãy phân tích bài nộp, chỉ rõ:
1. Học sinh bị YẾU CHUYÊN ĐỀ NÀO NHẤT và nguyên nhân cốt lõi (hổng khái niệm hay sai kỹ năng tính toán).
2. Phân tích bẫy/sai sót của các câu làm sai.
3. Kê "Đơn thuốc học tập" gồm 3 hành động khắc phục cụ thể.

Phong cách: Ngắn gọn, chuẩn xác, thấu hiểu, động viên học sinh.
Chỉ trả về JSON hợp lệ:
{
  "verdict": "1-2 câu nhận xét tổng quát về năng lực học sinh trong bài thi này.",
  "weaknesses": [
    {
      "topic": "Tên chuyên đề bị hổng",
      "issue": "Mô tả cụ thể lỗ hổng kiến thức dẫn đến mất điểm.",
      "level": "Khái niệm lý thuyết | Tính toán vận dụng"
    }
  ],
  "mistakes": [
    {
      "qNum": 1,
      "topic": "Tên chuyên đề",
      "trap": "Bẫy đề thi hoặc sai lầm kinh điển mà học sinh mắc phải ở câu này",
      "tip": "Mẹo tư duy để không sai lại"
    }
  ],
  "prescriptions": [
    "Hành động 1...",
    "Hành động 2...",
    "Hành động 3..."
  ]
}`;

      const user = `ĐỀ THI: ${exam?.title || 'Đề kiểm tra Hóa học'}
Điểm số: ${result?.score}/${result?.totalPoints} (${Math.round(((result?.score || 0) / (result?.totalPoints || 10)) * 100)}%)
Số câu làm sai: ${wrongQuestions.length}/${exam?.questions?.length || 0}

THỐNG KÊ THEO CHUYÊN ĐỀ:
${topicStats.map((t) => `- ${t.name}: Đúng ${t.correct}/${t.total} (${t.accuracy}%)`).join('\n')}

THỐNG KÊ THEO MỨC ĐỘ NHẬN THỨC:
- Nhận biết: ${levelStats.nb?.correct || 0}/${levelStats.nb?.total || 0}
- Thông hiểu: ${levelStats.th?.correct || 0}/${levelStats.th?.total || 0}
- Vận dụng: ${levelStats.vd?.correct || 0}/${levelStats.vd?.total || 0}
- Vận dụng cao: ${levelStats.vdc?.correct || 0}/${levelStats.vdc?.total || 0}

DANH SÁCH CÂU LÀM SAI (tối đa 4 câu):
${wrongQuestions.slice(0, 4).map((w) => `Câu ${w.index + 1} (${w.topic} - ${w.level}):
Đề: ${w.question.q}
Học sinh chọn: ${JSON.stringify(w.detail.picked)}
Đáp án đúng: ${w.question.answer ?? w.question.correct}
Giải thích: ${w.question.explain || 'Không có'}`).join('\n\n')}`;

      const raw = await callModel({
        system,
        parts: [{ text: user }],
        temperature: 0.3,
      });

      const parsed = parseJsonLoose(raw);
      if (!parsed) throw new Error('AI không trả về cấu trúc phân tích hợp lệ.');
      setAiReport(parsed);
    } catch (err) {
      console.warn('[ExamAiDiagnostic] Lỗi gọi AI:', err);
      setError(err.message || 'Chưa thể kết nối AI để phân tích chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ead-card"
      style={{
        marginTop: '1.4rem',
        padding: '1.4rem',
        borderRadius: '20px',
        background: 'linear-gradient(180deg, rgba(47, 107, 255, 0.04) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: '1.5px solid rgba(47, 107, 255, 0.18)',
        boxShadow: '0 8px 24px -6px rgba(47, 107, 255, 0.08)',
        textAlign: 'left',
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #2f6bff 0%, #8b5cf6 100%)', color: '#fff'
          }}>
            <IcoSpark size={18} />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink, #111827)' }}>
              AI Chẩn Đoán Lỗ Hổng & Điểm Yếu
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--mut, #6b7280)' }}>
              Phân tích học lực tự động từ bài nộp của bạn
            </span>
          </div>
        </div>

        {!loading && (
          <button
            type="button"
            onClick={handleAnalyzeWithAI}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem', borderRadius: '10px',
              background: '#2f6bff', color: '#fff', border: 'none',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(47, 107, 255, 0.25)',
            }}
          >
            <IcoSpark size={13} /> {aiReport ? 'Phân tích lại (1 credit)' : 'Chẩn đoán với AI (1 credit)'}
          </button>
        )}
      </div>

      {/* 1. THANH CHẨN ĐOÁN THEO CHUYÊN ĐỀ */}
      {topicStats.length > 0 && (
        <div style={{ marginBottom: '1.2rem', padding: '0.9rem 1rem', borderRadius: '14px', background: '#fff', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Độ thành thạo theo từng chuyên đề trong bài:</span>
            {weakestTopic && (
              <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IcoAlert size={14} /> Yếu nhất: {weakestTopic.name} ({weakestTopic.accuracy}%)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {topicStats.map((t, idx) => {
              const tone = t.accuracy >= 75 ? '#16a34a' : t.accuracy >= 50 ? '#f59e0b' : '#dc2626';
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 50px 100px', alignItems: 'center', gap: '0.8rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </span>
                  <span style={{ fontWeight: 700, color: tone, textAlign: 'right' }}>
                    {t.accuracy}%
                  </span>
                  <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${t.accuracy}%`, height: '100%', background: tone, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. KẾT QUẢ AI PHÂN TÍCH */}
      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.88rem' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}>
            <IcoSpark size={24} />
          </div>
          <div>AI đang đọc chi tiết từng câu sai để chẩn đoán điểm yếu...</div>
        </div>
      ) : aiReport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nhận xét tổng quan */}
          {aiReport.verdict && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(47, 107, 255, 0.08)', borderLeft: '4px solid #2f6bff', fontSize: '0.88rem', lineHeight: 1.55, color: '#1e3a8a' }}>
              <span style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <IcoSpark size={14} /> Nhận định từ AI:
              </span>{' '}
              {aiReport.verdict}
            </div>
          )}

          {/* Các chuyên đề bị hổng */}
          {Array.isArray(aiReport.weaknesses) && aiReport.weaknesses.length > 0 && (
            <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', background: '#fff', border: '1px solid #fee2e2' }}>
              <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991b1b', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                <IcoAlert size={16} /> Lỗ hổng kiến thức cần chú ý:
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {aiReport.weaknesses.map((w, wi) => (
                  <div key={wi} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#fef2f2', fontSize: '0.84rem' }}>
                    <b style={{ color: '#b91c1c' }}>• {w.topic}: </b>
                    <span style={{ color: '#4b5563' }}>{w.issue}</span>
                    {w.level && <small style={{ display: 'block', color: '#9ca3af', marginTop: '2px' }}>Dạng: {w.level}</small>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bẫy và sai sót tiêu biểu */}
          {Array.isArray(aiReport.mistakes) && aiReport.mistakes.length > 0 && (
            <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', background: '#fff', border: '1px solid #e5e7eb' }}>
              <b style={{ color: '#374151', fontSize: '0.85rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IcoAlert size={15} /> Giải mã bẫy ở các câu làm sai:
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {aiReport.mistakes.map((m, mi) => (
                  <div key={mi} style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', background: '#f9fafb', borderLeft: '3px solid #f59e0b', fontSize: '0.83rem' }}>
                    <b>Câu {m.qNum ? m.qNum : mi + 1} ({m.topic}):</b> {m.trap}
                    {m.tip && <div style={{ color: '#059669', marginTop: '3px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><IcoCheck size={13} /> Lời khuyên: {m.tip}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Đơn thuốc học tập */}
          {Array.isArray(aiReport.prescriptions) && aiReport.prescriptions.length > 0 && (
            <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <b style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <IcoBook size={16} /> Đơn thuốc ôn tập đề xuất (Làm ngay để bù điểm):
              </b>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.84rem', color: '#1f2937', lineHeight: 1.6 }}>
                {aiReport.prescriptions.map((p, pi) => (
                  <li key={pi} style={{ marginBottom: '0.2rem' }}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* NÚT TẠO ĐỀ ÔN BÙ LỖ HỔNG */}
          {weakestTopic && (
            <div
              style={{
                marginTop: '0.6rem',
                padding: '0.9rem 1.1rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(47, 107, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                border: '1px solid rgba(47, 107, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.8rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>
                  Luyện tập bù lỗ hổng: {weakestTopic.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Tỷ lệ đúng chỉ {weakestTopic.accuracy}% · AI sẽ tạo ngay đề 10 câu bám sát dạng bài bạn làm sai
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const payload = {
                    title: `Đề ôn bù hổng: ${weakestTopic.name}`,
                    topic: weakestTopic.name,
                    count: 10,
                    hint: `Được tạo tự động từ bài kiểm tra trước (Học sinh đang bị yếu dạng bài này, độ chính xác ${weakestTopic.accuracy}%).`,
                  };
                  try {
                    localStorage.setItem('aes_remedial_preset', JSON.stringify(payload));
                  } catch {}
                  window.location.hash = '#classroom';
                }}
                style={{
                  background: 'linear-gradient(135deg, #2f6bff 0%, #8b5cf6 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(47, 107, 255, 0.25)',
                }}
              >
                <IcoSpark size={15} /> Tạo ngay đề ôn bù phần này
              </button>
            </div>
          )}
        </div>
      ) : error ? (
        <div style={{ padding: '0.8rem 1rem', borderRadius: '10px', background: '#fef2f2', color: '#991b1b', fontSize: '0.84rem' }}>
          {error}
        </div>
      ) : (
        <div style={{ fontSize: '0.84rem', color: '#6b7280', textAlign: 'center', padding: '0.8rem' }}>
          Bấm nút <b>"Chẩn đoán với AI"</b> ở trên để AI chỉ ra chính xác điểm yếu và bẫy bạn đã mắc phải!
        </div>
      )}
    </div>
  );
}
