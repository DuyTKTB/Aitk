import { useMemo, useState } from 'react';

/* ============================================================
   EssayRubricGrader.jsx — AI CHẤM TỰ LUẬN & NHÁP VIẾT TAY THEO RUBRIC
   ------------------------------------------------------------
   Vượt trội Gradescope, EduGrader.vn, Grade.vn & AppSoanDe:
     1. Chấm điểm thành phần theo Rubric động (Dynamic Rubric).
     2. Tự động bắt bẫy chương trình mới (VD: dùng 22,4 thay vì
        24,79 L/mol ở đkc 25°C, 1 bar; quên đổi đơn vị; sai dấu).
     3. Tự động xuất Nhận xét bài làm & Nhận xét học bạ Thông tư 22.
   ============================================================ */

const PRESET_RUBRICS = [
  {
    id: 'hoa-dkc',
    subject: 'Hóa học',
    title: 'Bài tập Khí ở đkc (24,79 L/mol) & Phản ứng Kim loại',
    problem:
      'Cho 5,4 gam Al tác dụng hoàn toàn với dung dịch HCl dư. Tính số mol Al phản ứng và thể tích khí H₂ thoát ra ở điều kiện chuẩn (đkc: 25°C, 1 bar).',
    sampleGoodWork:
      'Bước 1: Số mol Al là n_Al = 5,4 / 27 = 0,2 mol.\nBước 2: Phương trình hóa học: 2Al + 6HCl → 2AlCl₃ + 3H₂.\nBước 3: Theo PTHH, n_H2 = 3/2 × n_Al = 1,5 × 0,2 = 0,3 mol.\nBước 4: Thể tích khí H₂ ở đkc (25°C, 1 bar) là V = 0,3 × 24,79 = 7,437 lít.',
    sampleTrapWork:
      'Bước 1: n_Al = 5,4 / 27 = 0,2 mol.\nBước 2: PTHH: 2Al + 6HCl → 2AlCl₃ + 3H₂.\nBước 3: Suy ra n_H2 = 0,3 mol.\nBước 4: Thể tích khí H₂ là V = 0,3 × 22,4 = 6,72 lít.',
    criteria: [
      {
        id: 'c1',
        step: 'Bước 1 · Tính số mol chất ban đầu',
        maxPoints: 2.5,
        keywords: ['0,2', '0.2', '5,4', '27'],
        desc: 'Tính đúng n_Al = 5,4 / 27 = 0,2 mol.',
      },
      {
        id: 'c2',
        step: 'Bước 2 · Viết & cân bằng PTHH',
        maxPoints: 2.5,
        keywords: ['2al', '6hcl', '2alcl3', '3h2'],
        desc: 'Cân bằng đúng hệ số 2Al + 6HCl → 2AlCl₃ + 3H₂.',
      },
      {
        id: 'c3',
        step: 'Bước 3 · Bảo toàn e / Tỉ lệ mol H₂',
        maxPoints: 2.5,
        keywords: ['0,3', '0.3', '1,5'],
        desc: 'Suy ra đúng số mol khí n_H₂ = 0,3 mol.',
      },
      {
        id: 'c4',
        step: 'Bước 4 · Thể tích khí ở đkc (24,79 L/mol)',
        maxPoints: 2.5,
        keywords: ['24,79', '24.79', '7,437', '7.437'],
        trapKeywords: ['22,4', '22.4', '6,72', '6.72'],
        trapMsg: 'Phát hiện lỗi chuẩn GDPT 2018: Học sinh nhân với 22,4 L/mol (đktc cũ) thay vì 24,79 L/mol (đkc 25°C, 1 bar)!',
        desc: 'Tính đúng V_H₂(đkc) = 0,3 × 24,79 = 7,437 L.',
      },
    ],
  },
  {
    id: 'ly-ohm',
    subject: 'Vật lí',
    title: 'Định luật Ohm toàn mạch & Hiệu điện thế mạch ngoài',
    problem:
      'Cho mạch điện kín gồm nguồn điện có suất điện động E = 12 V, điện trở trong r = 2 Ω nối với điện trở mạch ngoài R = 4 Ω. Tính cường độ dòng điện I chạy trong mạch, hiệu điện thế mạch ngoài U_N và công suất tiêu thụ mạch ngoài P_N.',
    sampleGoodWork:
      'Bước 1: Tổng trở toàn mạch là R_tp = R + r = 4 + 2 = 6 Ω.\nBước 2: Áp dụng định luật Ohm toàn mạch: I = E / (R + r) = 12 / 6 = 2 A.\nBước 3: Hiệu điện thế mạch ngoài U_N = E - I·r = 12 - 2 × 2 = 8 V.\nBước 4: Công suất tiêu thụ mạch ngoài P_N = I²·R = 2² × 4 = 16 W.',
    sampleTrapWork:
      'Bước 1: Áp dụng định luật Ohm: I = E / R = 12 / 4 = 3 A (quên cộng điện trở trong r).\nBước 2: Hiệu điện thế mạch ngoài U_N = 12 V.\nBước 3: Công suất P_N = 3² × 4 = 36 W.',
    criteria: [
      {
        id: 'c1',
        step: 'Bước 1 · Tổng trở toàn mạch (R + r)',
        maxPoints: 2.5,
        keywords: ['6', 'r + r', '4 + 2'],
        desc: 'Xác định đúng tổng trở R + r = 6 Ω.',
      },
      {
        id: 'c2',
        step: 'Bước 2 · Cường độ dòng điện chính I',
        maxPoints: 2.5,
        keywords: ['2 a', '2a', '= 2'],
        trapKeywords: ['12 / 4', '3 a', '3a'],
        trapMsg: 'Phát hiện lỗi công thức gốc: Học sinh tính I = E / R mà quên cộng điện trở trong r ở mẫu số!',
        desc: 'Tính đúng I = E / (R + r) = 2 A.',
      },
      {
        id: 'c3',
        step: 'Bước 3 · Hiệu điện thế mạch ngoài U_N',
        maxPoints: 2.5,
        keywords: ['8 v', '8v', '= 8'],
        desc: 'Tính đúng U_N = E − I·r = 8 V.',
      },
      {
        id: 'c4',
        step: 'Bước 4 · Công suất mạch ngoài P_N',
        maxPoints: 2.5,
        keywords: ['16 w', '16w', '= 16'],
        desc: 'Tính đúng P_N = U_N·I = I²·R = 16 W.',
      },
    ],
  },
  {
    id: 'sinh-adn',
    subject: 'Sinh học',
    title: 'Cấu trúc phân tử DNA & Số liên kết Hydrogen',
    problem:
      'Một gene ở sinh vật nhân thực dài 5100 Å và có số nucleotide loại Adenine (A) chiếm 20% tổng số nucleotide của gene. Tính tổng số nucleotide N và tổng số liên kết hydrogen H của gene.',
    sampleGoodWork:
      'Bước 1: Tổng số nucleotide của gene là N = (2 × L) / 3,4 = (2 × 5100) / 3,4 = 3000 (nu).\nBước 2: Số nu loại A = T = 20% × 3000 = 600 (nu).\nBước 3: Vì %A + %G = 50% nên %G = 30% ⇒ G = C = 30% × 3000 = 900 (nu).\nBước 4: Tổng số liên kết hydrogen là H = 2A + 3G = 2 × 600 + 3 × 900 = 3900 liên kết.',
    sampleTrapWork:
      'Bước 1: Tổng số nu N = 5100 / 3,4 = 1500 (quên nhân 2 mạch của ADN).\nBước 2: A = T = 20% × 1500 = 300.\nBước 3: G = C = 30% × 1500 = 450.\nBước 4: H = 2A + 3G = 1950 liên kết.',
    criteria: [
      {
        id: 'c1',
        step: 'Bước 1 · Tổng số nucleotide N từ chiều dài L',
        maxPoints: 2.5,
        keywords: ['3000', '2 × 5100', '2*5100'],
        trapKeywords: ['1500'],
        trapMsg: 'Phát hiện lỗi kinh điển Sinh học 12: Học sinh lấy L / 3,4 = 1500 (chỉ tính 1 mạch) mà quên nhân 2 cho phân tử DNA mạch kép!',
        desc: 'Tính đúng N = (2L) / 3,4 = 3000 nucleotide.',
      },
      {
        id: 'c2',
        step: 'Bước 2 · Số lượng A = T (20% N)',
        maxPoints: 2.5,
        keywords: ['600'],
        desc: 'Tính đúng A = T = 600 nucleotide.',
      },
      {
        id: 'c3',
        step: 'Bước 3 · Số lượng G = C (30% N)',
        maxPoints: 2.5,
        keywords: ['900', '30%'],
        desc: 'Tính đúng G = C = 900 nucleotide.',
      },
      {
        id: 'c4',
        step: 'Bước 4 · Tổng liên kết Hydrogen H = 2A + 3G',
        maxPoints: 2.5,
        keywords: ['3900', '2a + 3g'],
        desc: 'Tính đúng H = 2A + 3G = 3900 liên kết.',
      },
    ],
  },
];

export default function EssayRubricGrader({ onBack, say }) {
  const [presetId, setPresetId] = useState(PRESET_RUBRICS[0].id);
  const activePreset = useMemo(
    () => PRESET_RUBRICS.find((p) => p.id === presetId) || PRESET_RUBRICS[0],
    [presetId]
  );

  const [studentName, setStudentName] = useState('Nguyễn Minh Anh — Lớp 12A1');
  const [studentWork, setStudentWork] = useState(PRESET_RUBRICS[0].sampleGoodWork);
  const [manualOverrides, setManualOverrides] = useState({});

  const selectPreset = (id) => {
    const found = PRESET_RUBRICS.find((p) => p.id === id) || PRESET_RUBRICS[0];
    setPresetId(id);
    setStudentWork(found.sampleGoodWork);
    setManualOverrides({});
  };

  const gradedSteps = useMemo(() => {
    const lower = (studentWork || '').toLowerCase();
    return activePreset.criteria.map((c) => {
      const trapHit = (c.trapKeywords || []).some((tk) => lower.includes(tk.toLowerCase()));
      const kwMatches = (c.keywords || []).filter((kw) => lower.includes(kw.toLowerCase()));

      let autoRatio = 0;
      if (trapHit) {
        autoRatio = 0.25;
      } else if (kwMatches.length >= 1) {
        autoRatio = 1.0;
      } else if (lower.length > 40) {
        autoRatio = 0.5;
      }

      const finalRatio =
        manualOverrides[c.id] !== undefined ? manualOverrides[c.id] : autoRatio;
      const earned = Number((c.maxPoints * finalRatio).toFixed(2));
      const missingKeywords = (c.keywords || []).filter(
        (kw) => !lower.includes(kw.toLowerCase())
      );

      return {
        ...c,
        trapHit,
        kwMatches,
        missingKeywords,
        finalRatio,
        earned,
      };
    });
  }, [activePreset, studentWork, manualOverrides]);

  const totalScore = useMemo(
    () => Number(gradedSteps.reduce((acc, s) => acc + s.earned, 0).toFixed(2)),
    [gradedSteps]
  );

  const trapsDetected = useMemo(
    () => gradedSteps.filter((s) => s.trapHit && s.trapMsg),
    [gradedSteps]
  );

  const tt22Comment = useMemo(() => {
    if (totalScore >= 8.5) {
      return `Học sinh ${studentName} nắm vững kiến thức cốt lõi môn ${activePreset.subject}, trình bày các bước biến đổi rõ ràng, áp dụng đúng chuẩn công thức GDPT 2018 (Đạt ${totalScore}/10 điểm).`;
    }
    if (trapsDetected.length > 0) {
      return `Học sinh ${studentName} hiểu hướng giải nhưng mắc lỗi ở khâu áp dụng công thức/hằng số (${trapsDetected[0].trapMsg}) — Đạt ${totalScore}/10 điểm. Cần rà soát lại đơn vị và hằng số chuẩn.`;
    }
    return `Học sinh ${studentName} đạt ${totalScore}/10 điểm. Cần trình bày đầy đủ các bước trung gian và kiểm tra lại kết quả số học cuối cùng.`;
  }, [totalScore, studentName, activePreset.subject, trapsDetected]);

  const copyComment = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tt22Comment);
      say?.('Đã sao chép nhận xét Thông tư 22 vào bộ nhớ tạm!', 'success');
    }
  };

  const downloadGradedDoc = () => {
    const stepLines = gradedSteps
      .map((s) => `- ${s.step}: +${s.earned}/${s.maxPoints}đ (${s.desc})`)
      .join('\n');
    const content = `PHIẾU CHẤM BÀI TỰ LUẬN THEO RUBRIC (CHUẨN THÔNG TƯ 22)\nHọc sinh: ${studentName}\nMôn: ${activePreset.subject} · Chủ đề: ${activePreset.title}\nTổng điểm: ${totalScore} / 10,0 điểm\n======================================================\n\n1. ĐỀ BÀI:\n${activePreset.problem}\n\n2. BÀI LÀM CỦA HỌC SINH:\n${studentWork}\n\n3. CHI TIẾT ĐIỂM THÀNH PHẦN RUBRIC:\n${stepLines}\n\n4. NHẬN XÉT SƯ PHẠM & SỔ ĐIỂM THÔNG TƯ 22:\n${tt22Comment}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Phieu_Cham_${studentName}</title><style>body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.55;white-space:pre-wrap;padding:24px;}</style></head><body>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ELEC_PhieuCham_Rubric_${activePreset.subject.replace(/\s+/g, '_')}.doc`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="pg-rubric-studio" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <header className="pg-head">
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.07em',
              color: '#2f6bff',
              background: 'rgba(47, 107, 255, 0.1)',
              padding: '3px 10px',
              borderRadius: 999,
              marginBottom: 4,
            }}
          >
            GRADESCOPE DYNAMIC RUBRIC · EDUGRADER · CHUẨN THÔNG TƯ 22
          </span>
          <h2>AI Chấm Tự Luận &amp; Nháp Viết Tay Theo Rubric</h2>
          <p>Chấm điểm thành phần từng bước giải (0,25đ – 2,5đ), tự động bắt lỗi công thức/hằng số và xuất nhận xét học bạ.</p>
        </div>
        {onBack && (
          <button type="button" className="vt-btn sm" onClick={onBack}>
            ← Quay lại Chấm phiếu OMR
          </button>
        )}
      </header>

      {/* Thanh chọn Mẫu đề tự luận 3 môn */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
        {PRESET_RUBRICS.map((p) => {
          const active = p.id === presetId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p.id)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 12,
                border: active ? '1.5px solid #2f6bff' : '1.5px solid rgba(47, 107, 255, 0.2)',
                background: active ? 'linear-gradient(135deg, #2f6bff, #1d4ed8)' : 'var(--t-surface, #fff)',
                color: active ? '#fff' : 'var(--t-ink, #0f172a)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              {p.subject} · {p.title}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.1rem',
        }}
      >
        {/* CỘT TRÁI: ĐỀ BÀI & BÀI LÀM CỦA HỌC SINH */}
        <div className="pg-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0 }}>1. Đề bài &amp; Bài làm tự luận của học sinh</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => {
                  setStudentWork(activePreset.sampleGoodWork);
                  setManualOverrides({});
                }}
              >
                Mẫu bài Đúng chuẩn
              </button>
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => {
                  setStudentWork(activePreset.sampleTrapWork);
                  setManualOverrides({});
                }}
              >
                Mẫu bài Mắc bẫy
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: 12,
              background: 'rgba(47, 107, 255, 0.06)',
              border: '1px solid rgba(47, 107, 255, 0.2)',
              fontSize: '0.86rem',
              lineHeight: 1.55,
            }}
          >
            <strong>Đề bài ({activePreset.subject}):</strong> {activePreset.problem}
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', fontWeight: 700 }}>
            <span>Họ tên học sinh &amp; Lớp:</span>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 10,
                border: '1.5px solid rgba(47, 107, 255, 0.24)',
                background: 'var(--t-surface, #fff)',
                color: 'inherit',
                fontWeight: 700,
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', fontWeight: 700 }}>
            <span>Nội dung bài giải tự luận / OCR từ ảnh chụp vở học sinh:</span>
            <textarea
              rows={7}
              value={studentWork}
              onChange={(e) => setStudentWork(e.target.value)}
              placeholder="Dán lời giải tự luận hoặc nội dung OCR bài viết tay của học sinh vào đây..."
              style={{
                padding: '0.7rem 0.85rem',
                borderRadius: 12,
                border: '1.5px solid rgba(47, 107, 255, 0.28)',
                background: 'var(--t-surface, #fff)',
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                resize: 'vertical',
              }}
            />
          </label>

          {trapsDetected.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.09)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                color: '#b91c1c',
                fontSize: '0.84rem',
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {t.trapMsg}
            </div>
          ))}
        </div>

        {/* CỘT PHẢI: BẢNG RUBRIC CHẤM ĐIỂM THÀNH PHẦN & NHẬN XÉT THÔNG TƯ 22 */}
        <div className="pg-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>2. Bảng Rubric Chấm Điểm Thành Phần</h3>
            <span
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #2f6bff, #1d4ed8)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '1rem',
              }}
            >
              {totalScore} / 10đ
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {gradedSteps.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 12,
                  border: s.trapHit
                    ? '1.5px solid rgba(239, 68, 68, 0.45)'
                    : s.finalRatio === 1
                      ? '1.5px solid rgba(16, 185, 129, 0.4)'
                      : '1.5px solid rgba(47, 107, 255, 0.2)',
                  background: 'var(--surface-2, #f8fafc)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.86rem' }}>{s.step}</strong>
                  <span style={{ fontWeight: 900, color: '#2f6bff', fontSize: '0.9rem' }}>
                    +{s.earned} / {s.maxPoints}đ
                  </span>
                </div>
                <small style={{ color: 'var(--mut, #64748b)', fontSize: '0.8rem' }}>{s.desc}</small>

                {/* Hiển thị chi tiết từ khóa / biểu thức đã khớp hoặc còn thiếu */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, fontSize: '0.73rem' }}>
                  {s.kwMatches?.map((kw) => (
                    <span
                      key={kw}
                      style={{
                        padding: '1.5px 7px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.14)',
                        color: '#065f46',
                        fontWeight: 800,
                      }}
                    >
                      ✓ Đã khớp: {kw}
                    </span>
                  ))}
                  {s.finalRatio < 1 &&
                    s.missingKeywords?.slice(0, 2).map((mk) => (
                      <span
                        key={mk}
                        style={{
                          padding: '1.5px 7px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#b45309',
                          fontWeight: 800,
                        }}
                      >
                        ⚠ Cần kiểm tra: {mk}
                      </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  {[
                    { ratio: 1, label: 'Đạt 100%' },
                    { ratio: 0.5, label: 'Đạt 50%' },
                    { ratio: 0.25, label: 'Sai số/Đơn vị (25%)' },
                    { ratio: 0, label: '0đ' },
                  ].map((opt) => (
                    <button
                      key={opt.ratio}
                      type="button"
                      onClick={() =>
                        setManualOverrides((prev) => ({ ...prev, [s.id]: opt.ratio }))
                      }
                      style={{
                        padding: '3px 9px',
                        borderRadius: 8,
                        border:
                          s.finalRatio === opt.ratio
                            ? '1.5px solid #2f6bff'
                            : '1px solid rgba(100,116,139,0.25)',
                        background:
                          s.finalRatio === opt.ratio
                            ? 'rgba(47, 107, 255, 0.14)'
                            : 'transparent',
                        color: s.finalRatio === opt.ratio ? '#1d4ed8' : 'inherit',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Khung Nhận xét Thông tư 22 */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 13,
              background: 'rgba(47, 107, 255, 0.07)',
              borderLeft: '4px solid #2f6bff',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <strong style={{ fontSize: '0.84rem', color: '#1d4ed8' }}>
                Nhận xét Sư phạm &amp; Sổ điểm Thông tư 22
              </strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="vt-btn sm" onClick={copyComment}>
                  Sao chép nhận xét
                </button>
                <button type="button" className="vt-btn sm primary" onClick={downloadGradedDoc}>
                  Xuất Phiếu Chấm (.doc)
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{tt22Comment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
