import React, { useState } from 'react';
import { MarkdownLike } from '../../ChatMarkdown.jsx';
import { ElecMascot } from '../ElecBrandMark.jsx';
import {
  exportLessonPlanDocx,
  exportMatrixDocx,
  exportAiNoteDocx,
} from '../../../lib/examExport.js';
import { warnStudent, setStudentPaused } from '../../../lib/examSession.js';
import {
  IcoSparkles,
  IcoCopy,
  IcoVolume,
  IcoCheck,
  IcoFileDoc,
  IcoBrain,
  IcoArrowRight,
  IcoTarget,
  IcoShuffle,
  IcoBolt,
  IcoDownload,
  IcoShieldCheck,
  IcoExternal,
  IcoSave,
  IcoStop,
  IcoImage,
  IcoRefresh,
  IcoMessage,
  IcoChart,
} from './tfcIcons.jsx';
import { getWelcomeQuickCards } from './tfcHelpers.js';

function WelcomeCardIcon({ type }) {
  if (type === 'sparkles') return <IcoSparkles size={16} />;
  if (type === 'doc') return <IcoFileDoc size={16} />;
  if (type === 'shield') return <IcoShieldCheck size={16} />;
  if (type === 'target') return <IcoTarget size={16} />;
  if (type === 'chart') return <IcoChart size={16} />;
  if (type === 'image') return <IcoImage size={16} />;
  return <IcoBolt size={16} />;
}

function ParentMessageCard({ data, onSend, onSay }) {
  const tones = data?.tones || [];
  const [toneId, setToneId] = useState(tones[0]?.id || 'warm');
  const [copied, setCopied] = useState(false);

  const activeTone = tones.find((t) => t.id === toneId) || tones[0];
  if (!activeTone) return null;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(activeTone.text);
      setCopied(true);
      onSay?.(`Đã sao chép tin nhắn gửi phụ huynh em ${data.studentName}!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tfc-parent-card">
      <div className="tfc-parent-head">
        <span className="tfc-parent-title">
          <IcoMessage size={14} /> Tin nhắn Phụ huynh / Zalo
        </span>
        <span className="tfc-parent-student">
          {data.studentName}
          {data.score10 ? ` · ${data.score10}/10` : ''}
        </span>
      </div>

      <div className="tfc-parent-tabs" role="tablist">
        {tones.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={toneId === t.id}
            className={`tfc-parent-tab ${toneId === t.id ? 'active' : ''}`}
            onClick={() => setToneId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tfc-parent-preview">{activeTone.text}</div>

      <div className="tfc-action-btn-row">
        <button type="button" className="tfc-btn-action" onClick={handleCopy}>
          {copied ? (
            <>
              <IcoCheck size={13} /> Đã sao chép Zalo
            </>
          ) : (
            <>
              <IcoCopy size={13} /> Sao chép gửi Zalo
            </>
          )}
        </button>
        <button
          type="button"
          className="tfc-btn-action sec"
          onClick={() =>
            onSend(
              `Hãy viết lại tin nhắn gửi phụ huynh em ${data.studentName} (môn ${data.subject}, đạt ${data.pct ?? 'chưa rõ'}%) theo giọng "${activeTone.label}" tự nhiên hơn, giàu sự thấu hiểu và có lịch ôn cụ thể trong 7 ngày.`
            )
          }
        >
          <IcoSparkles size={13} /> AI viết sâu hơn
        </button>
      </div>
    </div>
  );
}

function ClassHealthCard({ data, user, onSend, onStartWizardWithTopic, onSay }) {
  if (!data) return null;
  const gradeTone =
    data.grade === 'A+' || data.grade === 'A'
      ? 'ok'
      : data.grade === 'C'
        ? 'danger'
        : 'warn';

  const handleExportHealthDocx = async () => {
    const lines = [
      `### Tổng quan sức khỏe lớp học`,
      `- **Xếp loại:** ${data.grade} (${data.gradeLabel})`,
      `- **Điểm trung bình:** ${data.avgPct}% | **Tỷ lệ đạt ≥ 50%:** ${data.passRate}%`,
      `- **Dữ liệu ghi nhận:** ${data.classCount} lớp, ${data.examCount} đề thi, ${data.submissionCount} bài nộp`,
      data.diagnosis ? `\n> ${data.diagnosis}` : '',
      data.weakestTopics?.length
        ? `\n### Chuyên đề học sinh yếu nhất\n` +
          data.weakestTopics.map((t) => `- **${t.topic}**: đúng ${t.rate}% (${t.rated} lượt)`).join('\n')
        : '',
      data.hardestQuestions?.length
        ? `\n### Top câu hỏi học sinh hay sai nhất\n` +
          data.hardestQuestions
            .map((q, i) => `${i + 1}. (${q.rate}% đúng — ${q.examTitle}): ${q.text}`)
            .join('\n')
        : '',
      data.nextLesson ? `\n### Đề xuất 10 phút đầu tiết tới\n${data.nextLesson}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const fn = await exportAiNoteDocx({
        title: `Báo cáo sức khỏe lớp học (${data.subject})`,
        content: lines,
        teacherName: user?.displayName || user?.email || 'Thầy/Cô',
        schoolName: user?.schoolName || 'TRƯỜNG THPT',
        subject: data.subject,
      });
      onSay?.(`Đã xuất báo cáo Word: ${fn}`, 'success');
    } catch (err) {
      onSay?.(`Lỗi xuất báo cáo Word: ${err?.message || err}`, 'error');
    }
  };

  return (
    <div className="tfc-health-card">
      <div className="tfc-health-head">
        <div className="tfc-health-title">
          <IcoChart size={15} /> Chẩn Đoán Sức Khỏe Lớp Học
        </div>
        <span className={`tfc-health-grade ${gradeTone}`}>
          {data.grade} · {data.gradeLabel}
        </span>
      </div>

      <div className="tfc-health-kpis">
        <div className="tfc-health-kpi">
          <strong>{data.avgPct}%</strong>
          <span>Điểm TB</span>
        </div>
        <div className="tfc-health-kpi">
          <strong>{data.passRate}%</strong>
          <span>Đạt ≥ 5.0</span>
        </div>
        <div className="tfc-health-kpi">
          <strong>{data.submissionCount}</strong>
          <span>Bài nộp thật</span>
        </div>
        <div className={`tfc-health-kpi ${data.atRiskCount > 0 ? 'warn' : ''}`}>
          <strong>{data.atRiskCount}</strong>
          <span>Cần hỗ trợ</span>
        </div>
      </div>

      {data.weakestTopics?.length > 0 && (
        <div className="tfc-health-sec">
          <div className="tfc-health-sec-lbl">Chuyên đề hổng nhiều nhất (bấm để soạn đề ôn):</div>
          <div className="tfc-health-topics">
            {data.weakestTopics.map((t, idx) => (
              <button
                key={idx}
                type="button"
                className="tfc-health-topic-row"
                onClick={() => onStartWizardWithTopic?.(t.topic)}
                title={`Mở trình soạn đề củng cố chuyên đề "${t.topic}"`}
              >
                <div className="tfc-health-topic-top">
                  <span>{t.topic}</span>
                  <strong className={t.rate < 50 ? 'bad' : 'warn'}>{t.rate}% đúng</strong>
                </div>
                <div className="tfc-health-bar-track">
                  <div
                    className={`tfc-health-bar-fill ${t.rate < 50 ? 'bad' : 'warn'}`}
                    style={{ width: `${Math.max(6, Math.min(100, t.rate))}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.hardestQuestions?.length > 0 && (
        <div className="tfc-health-sec">
          <div className="tfc-health-sec-lbl">Top câu học sinh sai nhiều nhất:</div>
          <div className="tfc-health-q-list">
            {data.hardestQuestions.slice(0, 3).map((q, idx) => (
              <div key={idx} className="tfc-health-q-item">
                <div className="tfc-health-q-top">
                  <span className="tfc-health-q-rate">{q.rate}% đúng</span>
                  <span className="tfc-health-q-exam">{q.examTitle}</span>
                </div>
                <div className="tfc-health-q-text">{q.text}</div>
                <button
                  type="button"
                  className="tfc-health-q-btn"
                  onClick={() =>
                    onSend(
                      `Học sinh chỉ làm đúng ${q.rate}% câu này: "${q.text}". Hãy giải thích ngắn gọn vì sao học sinh hay mắc bẫy, cách giảng lại trong 3 phút và tạo 2 câu tương tự để luyện lại.`
                    )
                  }
                >
                  <IcoSparkles size={11} /> Giải thích bẫy &amp; tạo 2 câu luyện lại
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.nextLesson && (
        <div className="tfc-health-next">
          <strong>Gợi ý 10 phút đầu tiết tới:</strong> {data.nextLesson}
        </div>
      )}

      <div className="tfc-action-btn-row">
        <button type="button" className="tfc-btn-action download" onClick={handleExportHealthDocx}>
          <IcoDownload size={13} /> Xuất báo cáo Word (.docx)
        </button>
        {data.atRiskCount > 0 && (
          <button
            type="button"
            className="tfc-btn-action sec"
            onClick={() => onSend('Lớp nào đang có học sinh điểm dưới 5.0?')}
          >
            Xem {data.atRiskCount} HS cần hỗ trợ
          </button>
        )}
      </div>
    </div>
  );
}

const TeacherChatMessageList = React.memo(function TeacherChatMessageList({
  messages,
  isTyping,
  typingStatus,
  copiedId,
  speakingMsgId,
  inferredSubject,
  user,
  classes,
  linkedClasses,
  exams,
  bodyEndRef,
  onCopyMessage,
  onSpeakText,
  onStopGeneration,
  onRegenerateLast,
  onExportNoteWord,
  onQuickAction,
  onOpenParentReport,
  onStartWizardWithTopic,
  onSend,
  onNavigate,
  onOpenSimulator,
  onCreateExam,
  onOpenImporter,
  onSay,
  onRunSimulation,
  onRunCognitiveRx,
  onUpdateWizard,
  onExecuteGenerateExam,
  onAiCompleteExam3Parts,
  onAiFillMissingAnswers,
  onExportExamWord,
  onOpenWordEditor,
  onCreateClassDirectly,
  getTopicsForSubjectAndGrade,
}) {
  const showWelcomeGrid = messages.length <= 1 && !isTyping;
  const welcomeCards = React.useMemo(
    () => getWelcomeQuickCards(inferredSubject),
    [inferredSubject]
  );

  const lastBotIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.sender === 'bot' && !messages[i]?.isWelcome && messages[i]?.id !== 'welcome_ultra') {
        return i;
      }
    }
    return -1;
  }, [messages]);

  return (
    <div className="tfc-body">
      {messages.map((m, msgIdx) => {
        const isWelcomeMsg = Boolean(m.isWelcome || m.id === 'welcome_ultra');
        const isLastBot = msgIdx === lastBotIndex;
        const hasRichCard = Boolean(
          m.agentWorkflow ||
            m.simResult ||
            m.rxData ||
            m.wizardData ||
            m.doctorData ||
            m.auditData ||
            m.examData ||
            m.healthData ||
            m.parentReport ||
            m.realAtRisk ||
            m.topStudents ||
            m.realAlerts
        );
        const canExportNote = m.sender === 'bot' && !isWelcomeMsg && !m.streaming && (m.text?.length || 0) > 220;
        const showSmartFollowups =
          isLastBot && !isTyping && !m.streaming && !hasRichCard && (m.text?.length || 0) > 80;

        return (
          <div key={m.id} className={`tfc-msg ${m.sender}`}>
            <div className="tfc-msg-avatar">
              {m.sender === 'bot' ? (
                <ElecMascot mood="happy" size={26} alt="ELEC AI" />
              ) : (
                'GV'
              )}
            </div>

            <div className={`tfc-bubble ${isWelcomeMsg ? 'is-welcome' : ''}`}>
              {/* Ảnh đề bài người dùng đính kèm / dán Ctrl+V */}
              {m.imagePreview && (
                <div className="tfc-msg-img-wrap">
                  {m.imagePreview.dataUrl ? (
                    <img
                      src={m.imagePreview.dataUrl}
                      alt={m.imagePreview.name || 'Ảnh đề bài'}
                      className="tfc-msg-img"
                    />
                  ) : (
                    <div className="tfc-msg-img-chip">
                      <IcoImage size={13} />
                      <span>{m.imagePreview.name || 'Ảnh đề bài'}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="tfc-markdown-content">
                {m.sender === 'bot' ? (
                  <MarkdownLike text={m.text} />
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.text}</p>
                )}
              </div>

              {/* Preview file đính kèm */}
              {m.fileMeta && (
                <div className="tfc-file-preview-card">
                  <div className="tfc-file-icon-badge">
                    <IcoFileDoc size={18} />
                  </div>
                  <div className="tfc-file-info">
                    <div className="tfc-file-name">{m.fileMeta.name}</div>
                    <div className="tfc-file-sub">{m.fileMeta.size} · Tệp đề thi đã nạp</div>
                  </div>
                </div>
              )}

              {/* THẺ CHẨN ĐOÁN SỨC KHỎE LỚP HỌC & TOP CÂU SAI NHIỀU */}
              {m.healthData && (
                <ClassHealthCard
                  data={m.healthData}
                  user={user}
                  onSend={onSend}
                  onStartWizardWithTopic={onStartWizardWithTopic}
                  onSay={onSay}
                />
              )}

              {/* THẺ SOẠN TIN NHẮN ZALO / SỔ LIÊN LẠC PHỤ HUYNH (3 GIỌNG ĐIỆU) */}
              {m.parentReport && (
                <ParentMessageCard data={m.parentReport} onSend={onSend} onSay={onSay} />
              )}

              {/* 1. ONE-COMMAND AGENT WORKFLOW CARD */}
              {m.agentWorkflow && (
                <div className="tfc-agent-card">
                  <div className="tfc-agent-head">
                    <span className="tfc-agent-title">
                      <IcoBrain size={15} /> AI Agent Workflow
                    </span>
                    <span className="tfc-agent-badge">Tự Động 100%</span>
                  </div>
                  <div className="tfc-agent-steps">
                    {m.agentWorkflow.steps.map((stText, sIdx) => (
                      <div key={sIdx} className="tfc-agent-step done">
                        <div className="tfc-agent-step-icon">
                          <IcoCheck size={11} sw={2.2} />
                        </div>
                        <span>{stText}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tfc-action-btn-row">
                    <button
                      type="button"
                      className="tfc-btn-action"
                      onClick={() => onNavigate?.('classes')}
                    >
                      <IcoArrowRight size={13} /> Xem đề trong lớp {m.agentWorkflow.targetClassName}
                    </button>
                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onRunSimulation(m.examData)}
                    >
                      <IcoTarget size={13} /> Thẩm định 100 học sinh ảo
                    </button>
                  </div>
                </div>
              )}

              {/* 2. VIRTUAL STUDENT EXAM SIMULATOR CARD */}
              {m.simResult && (
                <div className="tfc-sim-box">
                  <div className="tfc-sim-head">
                    <div>
                      <div className="tfc-sim-score-big">
                        {m.simResult.predAvg}{' '}
                        <small style={{ fontSize: '0.8rem', color: 'var(--t-ink-2, #64748b)' }}>/ 10</small>
                      </div>
                      <div className="tfc-sim-score-label">Điểm trung bình dự báo (100 học sinh ảo)</div>
                    </div>
                    <span className="tfc-diag-chip ok">{m.simResult.discrimIndex}</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--t-ink-2, #475569)', marginBottom: '4px' }}>
                      Phổ điểm dự kiến:
                    </div>
                    <div className="tfc-bell-chart">
                      {m.simResult.bins.map((b, bi) => (
                        <div key={bi} className="tfc-bell-col">
                          <span className="tfc-bell-n">{b.count}</span>
                          <div className="tfc-bell-bar" style={{ height: `${Math.max(8, b.count * 1.3)}px` }} />
                          <span className="tfc-bell-lbl">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {m.simResult.bloomBreakdown && (
                    <div className="tfc-diag-chips">
                      <span className="tfc-diag-chip">NB: {m.simResult.bloomBreakdown.nb}</span>
                      <span className="tfc-diag-chip">TH: {m.simResult.bloomBreakdown.th}</span>
                      <span className="tfc-diag-chip">VD: {m.simResult.bloomBreakdown.vd}</span>
                      <span className="tfc-diag-chip">VDC: {m.simResult.bloomBreakdown.vdc}</span>
                    </div>
                  )}

                  <div className="tfc-sim-metrics">
                    <div className="tfc-sim-metric-pill">
                      <span className="tfc-sim-metric-val">{m.simResult.estMinutes} phút</span>
                      <span className="tfc-sim-metric-lbl">{m.simResult.timeHealth.msg}</span>
                    </div>
                    <div className="tfc-sim-metric-pill">
                      <span className="tfc-sim-metric-val">Khuyến nghị sư phạm</span>
                      <span className="tfc-sim-metric-lbl">{m.simResult.advice}</span>
                    </div>
                  </div>

                  <div className="tfc-action-btn-row">
                    <button
                      type="button"
                      className="tfc-btn-action"
                      onClick={() => onOpenSimulator?.(m.examData)}
                    >
                      <IcoShuffle size={13} /> Mở Trộn Đề Thi ngay
                    </button>
                  </div>
                </div>
              )}

              {/* 3. COGNITIVE ROOT-CAUSE DIAGNOSIS & PRESCRIPTION CARD */}
              {m.rxData && (
                <div className="tfc-rx-box">
                  <div className="tfc-rx-head">
                    <span>Đơn thuốc học tập cho {m.rxData.student}</span>
                    <span>{m.rxData.topic}</span>
                  </div>

                  <div className="tfc-rx-layers">
                    {m.rxData.layers.map((l, li) => (
                      <div key={li} className="tfc-rx-layer-item">
                        <span className="tfc-rx-layer-tag">{l.tag}</span>
                        <span>{l.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '4px', padding: '6px 8px', background: 'var(--t-surface-0, #ffffff)', borderRadius: 10, border: '1px solid rgba(217, 119, 6, 0.35)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--t-warn, #92400e)', marginBottom: '4px' }}>
                      3 Bài tập đặc trị phục hồi:
                    </div>
                    {m.rxData.remedialQuestions.map((rq, ri) => (
                      <div key={ri} style={{ fontSize: '0.74rem', color: 'var(--t-ink, #1e293b)', marginBottom: '4px' }}>
                        <b>{rq.q}</b>
                        <div style={{ color: 'var(--t-ok, #15803d)', fontSize: '0.7rem' }}>Đáp án: {rq.ans}</div>
                      </div>
                    ))}
                  </div>

                  <div className="tfc-action-btn-row">
                    <button
                      type="button"
                      className="tfc-btn-action"
                      onClick={async () => {
                        try {
                          const qList = (m.rxData.remedialQuestions || []).map((rq, idx) => ({
                            id: `rx_q_${Date.now()}_${idx + 1}`,
                            q: rq.q,
                            options: (Array.isArray(rq.options) && rq.options.length === 4)
                              ? rq.options
                              : [
                                  'A. ' + (rq.ans || 'Phương án đúng'),
                                  'B. Phương án gây nhiễu 1',
                                  'C. Phương án gây nhiễu 2',
                                  'D. Phương án gây nhiễu 3',
                                ],
                            correct: typeof rq.correct === 'number' ? rq.correct : 0,
                            explain: rq.explain || `Kiến thức trọng tâm: ${rq.ans}`,
                            level: idx === 0 ? 'NB' : idx === 1 ? 'TH' : 'VD',
                            part: 1,
                            type: 'single_choice',
                            points: 1.0,
                          }));
                          const targetClassId = classes[0]?.id || linkedClasses?.[0]?.id || '';
                          const rxExam = {
                            id: 'rx_exam_' + Date.now(),
                            title: `Đơn thuốc học tập: ${m.rxData.topic} (${m.rxData.student})`,
                            subject: m.rxData.subject || inferredSubject || 'Hóa học',
                            grade: String(classes[0]?.grade || linkedClasses?.[0]?.grade || '12'),
                            classId: targetClassId,
                            duration: 15,
                            totalQuestions: qList.length,
                            questions: qList,
                          };
                          await onCreateExam?.(rxExam);
                          onSay?.(`Đã tạo và giao gói bài tập phục hồi cho ${m.rxData.student}!`, 'success');
                        } catch (err) {
                          onSay?.(`Lỗi khi tạo đề phục hồi: ${err?.message || err}`, 'error');
                        }
                      }}
                    >
                      Giao 3 câu phục hồi này cho em
                    </button>
                  </div>
                </div>
              )}

              {/* 4. INTERACTIVE EXAM CREATION WIZARD CARD */}
              {m.wizardData && (
                <div className="tfc-wizard-card">
                  <div className="tfc-wizard-head">
                    <span className="tfc-wizard-title">
                      <IcoSparkles size={14} /> Chuyên Gia Soạn Đề GDPT 2025
                    </span>
                    <span className="tfc-wizard-badge">Tương tác trực tiếp</span>
                  </div>

                  <div className="tfc-wizard-sec">
                    <span className="tfc-wizard-label">1. Môn học &amp; Khối lớp:</span>
                    <div className="tfc-pill-row" style={{ marginBottom: 6 }}>
                      {Array.from(new Set([inferredSubject, 'Hóa học', 'Toán học', 'Vật lí', 'Sinh học', 'Tiếng Anh'].filter(Boolean))).map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          className={`tfc-pill-btn ${(m.wizardData.subject || inferredSubject || 'Hóa học') === sub ? 'active' : ''}`}
                          onClick={() => onUpdateWizard(m.wizardData.id, { subject: sub })}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                    <div className="tfc-pill-row">
                      {['12', '11', '10'].map((gr) => (
                        <button
                          key={gr}
                          type="button"
                          className={`tfc-pill-btn ${(m.wizardData.grade || '12') === gr ? 'active' : ''}`}
                          onClick={() => onUpdateWizard(m.wizardData.id, { grade: gr })}
                        >
                          Khối {gr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tfc-wizard-sec">
                    <span className="tfc-wizard-label">2. Hình thức &amp; Thời lượng thi:</span>
                    <div className="tfc-pill-row">
                      <button
                        type="button"
                        className={`tfc-pill-btn ${m.wizardData.format === 'gdpt2025' ? 'active' : ''}`}
                        onClick={() => onUpdateWizard(m.wizardData.id, { format: 'gdpt2025' })}
                      >
                        Chuẩn GDPT 2025 (28 câu, 50p: 18 TN + 4 Đ/S + 6 TLN)
                      </button>
                      <button
                        type="button"
                        className={`tfc-pill-btn ${m.wizardData.format === '15min' ? 'active' : ''}`}
                        onClick={() => onUpdateWizard(m.wizardData.id, { format: '15min' })}
                      >
                        Kiểm tra 15 phút (10 câu: 6 TN + 2 Đ/S + 2 TLN)
                      </button>
                    </div>
                  </div>

                  <div className="tfc-wizard-sec">
                    <span className="tfc-wizard-label">
                      3. Chuyên đề kiến thức trọng tâm ({m.wizardData.subject || inferredSubject || 'Hóa học'} {m.wizardData.grade || '12'}):
                    </span>
                    <div className="tfc-pill-row">
                      {getTopicsForSubjectAndGrade(m.wizardData.subject, m.wizardData.grade).map((tp) => (
                        <button
                          key={tp}
                          type="button"
                          className={`tfc-pill-btn ${m.wizardData.topic === tp ? 'active' : ''}`}
                          onClick={() => onUpdateWizard(m.wizardData.id, { topic: tp })}
                        >
                          {tp}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="tfc-pill-input"
                      style={{ marginTop: 4 }}
                      placeholder="Hoặc gõ chuyên đề tùy chọn..."
                      value={m.wizardData.topic || ''}
                      onChange={(e) => onUpdateWizard(m.wizardData.id, { topic: e.target.value })}
                    />
                  </div>

                  <div className="tfc-wizard-sec">
                    <span className="tfc-wizard-label">4. Ma trận nhận thức:</span>
                    <div className="tfc-pill-row">
                      <button
                        type="button"
                        className={`tfc-pill-btn ${m.wizardData.matrix === 'standard' ? 'active' : ''}`}
                        onClick={() => onUpdateWizard(m.wizardData.id, { matrix: 'standard' })}
                      >
                        Chuẩn Bộ GD (40% NB - 30% TH - 20% VD - 10% VDC)
                      </button>
                      <button
                        type="button"
                        className={`tfc-pill-btn ${m.wizardData.matrix === 'remedial' ? 'active' : ''}`}
                        onClick={() => onUpdateWizard(m.wizardData.id, { matrix: 'remedial' })}
                      >
                        Củng cố học sinh yếu (60% NB - 40% TH)
                      </button>
                      <button
                        type="button"
                        className={`tfc-pill-btn ${m.wizardData.matrix === 'advanced' ? 'active' : ''}`}
                        onClick={() => onUpdateWizard(m.wizardData.id, { matrix: 'advanced' })}
                      >
                        Phân hóa 9+ (30% TH - 40% VD - 30% VDC)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="tfc-wizard-launch-btn"
                    onClick={() => onExecuteGenerateExam(m.wizardData)}
                  >
                    <IcoBolt size={14} /> Bắt đầu biên soạn đề chuẩn 3 phần ngay
                  </button>
                </div>
              )}

              {/* 5. BÁC SĨ CHẨN ĐOÁN & SỬA FILE WORD CARD */}
              {m.doctorData && (
                <div className="tfc-doctor-card">
                  <div className="tfc-doctor-head">
                    <span className="tfc-doctor-title">
                      <IcoFileDoc size={15} /> Bác Sĩ Chẩn Đoán &amp; Sửa File Word
                    </span>
                    <span
                      className="tfc-wizard-badge"
                      style={{
                        background: 'var(--t-warn-soft, rgba(217, 119, 6, 0.14))',
                        color: 'var(--t-warn, #b45309)',
                        borderColor: 'rgba(217, 119, 6, 0.35)',
                      }}
                    >
                      {m.doctorData.isCompliant ? 'Đạt chuẩn 3 phần' : 'Cần chuẩn hóa'}
                    </span>
                  </div>

                  <div className="tfc-doctor-grid">
                    <div className="tfc-doctor-box">
                      <span className="tfc-doctor-box-n">{m.doctorData.part1}</span>
                      <span className="tfc-doctor-box-lbl">Phần I (Nhiều lựa chọn)</span>
                    </div>
                    <div className={`tfc-doctor-box ${m.doctorData.part2 === 0 ? 'warn' : ''}`}>
                      <span className="tfc-doctor-box-n">{m.doctorData.part2} / 4</span>
                      <span className="tfc-doctor-box-lbl">Phần II (Đúng/Sai)</span>
                    </div>
                    <div className={`tfc-doctor-box ${m.doctorData.part3 === 0 ? 'warn' : ''}`}>
                      <span className="tfc-doctor-box-n">{m.doctorData.part3} / 6</span>
                      <span className="tfc-doctor-box-lbl">Phần III (Trả lời ngắn)</span>
                    </div>
                  </div>

                  {!m.doctorData.isCompliant && (
                    <div className="tfc-doctor-warn-banner">
                      <b>Cảnh báo Bộ GD&amp;ĐT:</b> File hiện chưa đủ 4 câu Phần II và 6 câu Phần III. Bấm nút bên dưới để AI tự động bổ sung đủ 28 câu cùng chuyên đề và xuất Word chuẩn.
                    </div>
                  )}

                  {m.doctorData.missingAnswers > 0 && (
                    <div className="tfc-doctor-warn-banner">
                      <b>Phát hiện thiếu đáp án:</b> Có <b>{m.doctorData.missingAnswers} câu</b> chưa gắn đáp án chuẩn. Bấm nút bên dưới để AI tự giải và điền đáp án + lời giải chi tiết.
                    </div>
                  )}

                  <div className="tfc-action-btn-row tfc-exam-actions-grid">
                    {!m.doctorData.isCompliant && (
                      <button
                        type="button"
                        className="tfc-btn-action doctor tfc-btn-span-2"
                        onClick={() => onAiCompleteExam3Parts(m.examData)}
                      >
                        <IcoBolt size={13} /> AI Bổ sung đủ 3 phần (28 câu)
                      </button>
                    )}

                    {m.doctorData.missingAnswers > 0 && (
                      <button
                        type="button"
                        className="tfc-btn-action tfc-btn-span-2"
                        onClick={() => onAiFillMissingAnswers?.(m.examData)}
                      >
                        <IcoSparkles size={13} /> AI Giải &amp; điền đáp án ({m.doctorData.missingAnswers} câu)
                      </button>
                    )}

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      style={{ background: '#185abd', color: '#ffffff', borderColor: '#185abd' }}
                      onClick={() => onOpenWordEditor(m.examData)}
                      title="Chỉnh sửa trực quan trên trang giấy A4 giống Microsoft Word"
                    >
                      <IcoFileDoc size={13} /> Sửa Word (A4)
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action download"
                      onClick={() => onExportExamWord(m.examData)}
                    >
                      <IcoDownload size={13} /> Tải Word (.docx)
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onRunSimulation(m.examData)}
                    >
                      <IcoTarget size={13} /> Mô phỏng 100 HS
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onOpenSimulator?.(m.examData)}
                    >
                      <IcoShuffle size={13} /> Trộn đề thi
                    </button>
                  </div>
                </div>
              )}

              {/* 6. AUDIT & PEDAGOGICAL PHÁN XÉT CARD */}
              {m.auditData && (
                <div className="tfc-audit-card">
                  <div className="tfc-audit-head">
                    <span className="tfc-audit-title">
                      <IcoShieldCheck size={16} /> Giám Định Sư Phạm GDPT 2025
                    </span>
                    <div className="tfc-audit-badges">
                      <span
                        className={`tfc-audit-badge ${
                          m.auditData.verdict.includes('ĐẠT')
                            ? 'ok'
                            : m.auditData.verdict.includes('HIỆU')
                              ? 'warn'
                              : 'danger'
                        }`}
                      >
                        {m.auditData.verdict}
                      </span>
                      <span className="tfc-audit-badge level">{m.auditData.level}</span>
                    </div>
                  </div>

                  <div className="tfc-audit-body">{m.auditData.analysis}</div>

                  <div className="tfc-action-btn-row">
                    <button
                      type="button"
                      className="tfc-btn-action"
                      onClick={() =>
                        onSend(
                          `Hãy soạn 3 câu hỏi trắc nghiệm tương tự cùng mức độ nhận thức ${m.auditData.level} và dạng bài với câu: ${m.auditData.rawQuery}`
                        )
                      }
                    >
                      <IcoSparkles size={13} /> Tạo 3 câu biến thể tương tự
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => {
                        navigator.clipboard?.writeText(m.auditData.analysis);
                        onSay?.('Đã sao chép báo cáo giám định sư phạm vào bộ nhớ tạm!', 'success');
                      }}
                    >
                      <IcoCheck size={13} /> Sao chép báo cáo
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onNavigate?.('bank')}
                    >
                      <IcoExternal size={13} /> Mở Ngân hàng câu hỏi
                    </button>
                  </div>
                </div>
              )}

              {/* Thẻ đề thi */}
              {m.examData && !m.simResult && !m.agentWorkflow && !m.doctorData && !m.auditData && (
                <div className="tfc-diag-box">
                  <div className="tfc-diag-row">
                    <span>
                      Đề: <b>{m.examData.title}</b>
                    </span>
                    <span style={{ color: 'var(--t-ok, #15803d)' }}>Chuẩn GDPT 2025</span>
                  </div>

                  <div className="tfc-diag-chips">
                    <span className="tfc-diag-chip ok">{m.examData.questions?.length || 0} câu</span>
                    {m.diag && (
                      <>
                        <span className="tfc-diag-chip">P.I: {m.diag.part1}</span>
                        <span className="tfc-diag-chip">P.II: {m.diag.part2}</span>
                        <span className="tfc-diag-chip">P.III: {m.diag.part3}</span>
                      </>
                    )}
                  </div>

                  <div className="tfc-action-btn-row tfc-exam-actions-grid">
                    <button
                      type="button"
                      className="tfc-btn-action download tfc-btn-span-2"
                      onClick={() => onExportExamWord(m.examData)}
                      title="Tải file Word (.docx) chuẩn 3 phần"
                    >
                      <IcoDownload size={13} /> Tải File Word (.docx)
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action"
                      onClick={() => onRunSimulation(m.examData)}
                    >
                      <IcoTarget size={13} /> Mô phỏng 100 HS
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onOpenSimulator?.(m.examData)}
                    >
                      <IcoShuffle size={13} /> Trộn đề thi
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onCreateExam?.(m.examData)}
                    >
                      <IcoSave size={13} /> Lưu kho đề
                    </button>

                    <button
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => onOpenImporter?.()}
                    >
                      <IcoExternal size={13} /> Nhập đề nâng cao
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách học sinh yếu (thêm nút Nhắn PH 1 chạm) */}
              {m.realAtRisk && (
                <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {m.realAtRisk.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '12px',
                        background: 'var(--t-bad-soft, rgba(239, 68, 68, 0.14))',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--t-ink, #0f172a)' }}>{st.studentName}</div>
                        <div style={{ color: 'var(--t-bad, #be123c)', fontSize: '0.72rem' }}>
                          Điểm đạt: {st.pct}% {st.subCount ? `(${st.subCount} bài nộp)` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="tfc-btn-action sec"
                          style={{ padding: '3px 7px', fontSize: '0.68rem' }}
                          onClick={() =>
                            onOpenParentReport?.({
                              studentName: st.studentName,
                              pct: st.pct,
                              subCount: st.subCount || 0,
                              weakTopic: m.realWeakest?.[0]?.topic || '',
                            })
                          }
                          title="Soạn tin nhắn Zalo gửi phụ huynh"
                        >
                          <IcoMessage size={11} /> Nhắn PH
                        </button>
                        <button
                          type="button"
                          className="tfc-btn-action"
                          style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                          onClick={() =>
                            onRunCognitiveRx(
                              st.studentName,
                              m.realWeakest?.[0]?.topic ||
                                getTopicsForSubjectAndGrade(
                                  inferredSubject || 'Hóa học',
                                  String(classes[0]?.grade || linkedClasses?.[0]?.grade || '12')
                                )[0] ||
                                'Kiến thức trọng tâm'
                            )
                          }
                        >
                          <IcoBrain size={11} /> Kê đơn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Danh sách học sinh xuất sắc (thêm nút Nhắn PH khen ngợi) */}
              {m.topStudents && (
                <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {m.topStudents.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '12px',
                        background: 'var(--t-ok-soft, rgba(16, 185, 129, 0.14))',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--t-ink, #0f172a)' }}>
                          #{idx + 1} {st.studentName}
                        </div>
                        <div style={{ color: 'var(--t-ok, #15803d)', fontSize: '0.72rem' }}>
                          Điểm đạt: {st.pct}% {st.subCount ? `(${st.subCount} bài làm)` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          type="button"
                          className="tfc-btn-action sec"
                          style={{ padding: '3px 7px', fontSize: '0.68rem' }}
                          onClick={() =>
                            onOpenParentReport?.({
                              studentName: st.studentName,
                              pct: st.pct,
                              subCount: st.subCount || 0,
                            })
                          }
                          title="Soạn tin nhắn khen gửi phụ huynh"
                        >
                          <IcoMessage size={11} /> Khen PH
                        </button>
                        <span className="tfc-diag-chip ok" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          {st.pct >= 90 ? 'Xuất sắc' : 'Giỏi'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cảnh báo vi phạm LIVE */}
              {m.realAlerts && (
                <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {m.realAlerts.map((al, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '12px',
                        background:
                          al.severity === 'Nghiêm trọng'
                            ? 'var(--t-bad-soft, rgba(239, 68, 68, 0.14))'
                            : 'var(--t-warn-soft, rgba(245, 158, 11, 0.14))',
                        border: `1px solid ${
                          al.severity === 'Nghiêm trọng' ? 'rgba(239, 68, 68, 0.38)' : 'rgba(245, 158, 11, 0.38)'
                        }`,
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span style={{ color: 'var(--t-ink, #0f172a)' }}>{al.name}</span>
                        <span
                          style={{
                            color: al.severity === 'Nghiêm trọng' ? 'var(--t-bad, #e11d48)' : 'var(--t-warn, #ca8a04)',
                            fontWeight: 800,
                          }}
                        >
                          {al.severity} ({al.count} lần)
                        </span>
                      </div>
                      <div style={{ color: 'var(--t-ink-2, #475569)', fontSize: '0.72rem', marginTop: '2px' }}>
                        Hành vi: {al.lastViolation}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="tfc-btn-action danger"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={async () => {
                            if (!al.sessionId) {
                              onSay?.('Chưa xác định được phòng thi của học sinh này.', 'error');
                              return;
                            }
                            try {
                              await warnStudent({
                                sessionId: al.sessionId,
                                studentId: al.studentId,
                                message: 'Cảnh báo Giám thị: Em hãy tập trung quay lại màn hình làm bài!',
                              });
                              onSay?.(`Đã gửi nhắc nhở trực tiếp tới ${al.name}!`, 'info');
                            } catch (err) {
                              onSay?.('Không gửi được nhắc nhở: ' + (err?.message || err), 'error');
                            }
                          }}
                        >
                          Gửi nhắc nhở
                        </button>
                        <button
                          type="button"
                          className="tfc-btn-action sec"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={async () => {
                            if (!al.sessionId) {
                              onSay?.('Chưa xác định được phòng thi của học sinh này.', 'error');
                              return;
                            }
                            try {
                              await setStudentPaused({
                                sessionId: al.sessionId,
                                studentId: al.studentId,
                                paused: true,
                              });
                              onSay?.(`Đã tạm dừng bài thi của ${al.name}!`, 'warn');
                            } catch (err) {
                              onSay?.('Không tạm dừng được bài thi: ' + (err?.message || err), 'error');
                            }
                          }}
                        >
                          Tạm dừng thi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nút điều hướng */}
              {m.navSuggestions && m.navSuggestions.length > 0 && (
                <div className="tfc-action-btn-row">
                  {m.navSuggestions.map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      type="button"
                      className="tfc-btn-action sec"
                      onClick={() => {
                        if (btn.query) {
                          onSend(btn.query);
                          return;
                        }
                        if (btn.sec) onNavigate?.(btn.sec);
                        if (btn.action === 'importer') onOpenImporter?.();
                        if (btn.action === 'simulator') onOpenSimulator?.();
                        if (btn.action === 'rx') onRunCognitiveRx(btn.studentName, btn.topic);
                        if (btn.action === 'pick_file') onQuickAction('pick_file');
                        if (btn.action === 'pick_image') onQuickAction('pick_image');
                        if (btn.action === 'start_wizard') onQuickAction('start_wizard');
                        if (btn.action === 'class_health') onQuickAction('class_health');
                        if (btn.action === 'parent_report') onQuickAction('parent_report');
                        if (btn.action === 'word_editor') onOpenWordEditor((exams && exams[0]) || null);
                        if (btn.action === 'export_lesson_plan') {
                          exportLessonPlanDocx({
                            title: btn.title || 'Ke-Hoach-Bai-Day-5512',
                            content: btn.content || '',
                            teacherName: user?.displayName || user?.email || 'Thầy/Cô',
                            schoolName: user?.schoolName || 'TRƯỜNG THPT',
                            subject: btn.subject || '',
                            grade: btn.grade || '',
                          });
                        }
                        if (btn.action === 'export_matrix') {
                          exportMatrixDocx({
                            title: btn.title || 'Khung-Ma-Tran-Dac-Ta-2025',
                            content: btn.content || '',
                            subject: btn.subject || '',
                            grade: btn.grade || '',
                            schoolName: user?.schoolName || 'TRƯỜNG THPT',
                          });
                        }
                        if (btn.action === 'create_class') {
                          onCreateClassDirectly(btn.className);
                        }
                        if (btn.action === 'query_class') {
                          onSend(`tổng quan lớp ${btn.className}`);
                        }
                      }}
                    >
                      <IcoArrowRight size={13} /> {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Gợi ý tiếp nối nhanh trên câu trả lời AI mới nhất */}
              {showSmartFollowups && (
                <div className="tfc-followup-row">
                  <button
                    type="button"
                    className="tfc-followup-pill"
                    onClick={() => onSend('Hãy rút gọn câu trả lời vừa rồi thành 4–5 ý chính ngắn nhất để trình chiếu slide.')}
                  >
                    Rút gọn slide
                  </button>
                  <button
                    type="button"
                    className="tfc-followup-pill"
                    onClick={() => onSend('Hãy giải thích chi tiết hơn từng bước và nêu 1 ví dụ minh họa dễ hiểu.')}
                  >
                    Giải thích sâu hơn
                  </button>
                  <button
                    type="button"
                    className="tfc-followup-pill"
                    onClick={() => onSend('Từ nội dung vừa rồi, hãy soạn nhanh 3 câu trắc nghiệm củng cố kèm đáp án.')}
                  >
                    +3 câu luyện tập
                  </button>
                </div>
              )}

              {/* Footer nhỏ của tin nhắn: Copy · Loa · Xuất Word · Tạo lại + Timestamp */}
              <div className="tfc-bubble-footer">
                {m.sender === 'bot' && !isWelcomeMsg && !m.streaming ? (
                  <div className="tfc-bubble-actions-inline">
                    <button
                      type="button"
                      className="tfc-bubble-btn"
                      onClick={() => onCopyMessage(m.id, m.text)}
                      title="Sao chép nội dung"
                    >
                      {copiedId === m.id ? (
                        <span className="tfc-copied-chip">
                          <IcoCheck size={11} /> Đã chép
                        </span>
                      ) : (
                        <IcoCopy size={12} />
                      )}
                    </button>
                    <button
                      type="button"
                      className={`tfc-bubble-btn ${speakingMsgId === m.id ? 'active' : ''}`}
                      onClick={() => onSpeakText(m.text, m.id)}
                      title={speakingMsgId === m.id ? 'Dừng đọc' : 'Đọc bằng giọng Tiếng Việt'}
                    >
                      <IcoVolume size={12} />
                    </button>
                    {canExportNote && (
                      <button
                        type="button"
                        className="tfc-bubble-btn"
                        onClick={() => onExportNoteWord?.(m.text)}
                        title="Xuất câu trả lời này ra file Word (.docx)"
                      >
                        <IcoDownload size={12} />
                      </button>
                    )}
                    {isLastBot && !isTyping && (
                      <button
                        type="button"
                        className="tfc-bubble-btn"
                        onClick={() => onRegenerateLast?.()}
                        title="Tạo lại câu trả lời khác"
                      >
                        <IcoRefresh size={12} />
                      </button>
                    )}
                  </div>
                ) : (
                  <span />
                )}
                <span className="tfc-time">{m.streaming ? 'Đang viết...' : m.time}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Lưới 2×2 thẻ tác vụ nhanh khi bắt đầu phiên mới */}
      {showWelcomeGrid && (
        <div className="tfc-welcome-grid" role="group" aria-label="Tác vụ nhanh AI">
          {welcomeCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`tfc-welcome-card tone-${card.tone}`}
              onClick={() => onQuickAction(card.action)}
            >
              <span className="tfc-welcome-card-ico">
                <WelcomeCardIcon type={card.icon} />
              </span>
              <span className="tfc-welcome-card-text">
                <strong>{card.title}</strong>
                <span>{card.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Chỉ báo đang xử lý kèm mô tả bước & nút Dừng */}
      {isTyping && (
        <div className="tfc-msg bot">
          <div className="tfc-msg-avatar">
            <IcoSparkles size={14} />
          </div>
          <div className="tfc-bubble tfc-typing-bubble">
            <div className="tfc-typing-row">
              <div className="tfc-typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="tfc-typing-label">{typingStatus || 'ELEC đang phân tích...'}</span>
              {onStopGeneration && (
                <button
                  type="button"
                  className="tfc-stop-inline-btn"
                  onClick={onStopGeneration}
                  title="Dừng tạo phản hồi"
                >
                  <IcoStop size={10} /> Dừng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={bodyEndRef} />
    </div>
  );
});

export default TeacherChatMessageList;
