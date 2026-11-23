/* ============================================================
   OmrPrintStudioModal.jsx — Studio Thiết Kế & In Phiếu OMR A4
   Chuẩn Bộ GD&ĐT (GDPT 2018 / THPT 2025+) · Bản quyền ELEC Science AI
   ============================================================ */

import React, { useMemo, useState, useEffect } from 'react';
import {
  buildOmrSvgMarkup,
  buildSheetSerial,
  downloadOmrSheetHtml,
  printOmrSheetA4,
  printMultipleOmrSheets,
} from '../../lib/omrSheetGenerator.js';
import { MOET_EXAM_PRESETS } from '../../lib/paperGrade.js';
import { ElecFlaskBrandSvg } from './ElecBrandMark.jsx';

const Svg = ({ size = 15, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoX = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoPrint = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoDownload = (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;

function parseCodeList(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map((x) => x.replace(/[^0-9A-Za-z]/g, '').slice(0, 4))
    .filter(Boolean);
}

export default function OmrPrintStudioModal({ open, onClose, paper = null, onPrinted = null }) {
  const paperCodes = useMemo(() => Object.keys(paper?.keys || {}).sort(), [paper]);
  const [presetId, setPresetId] = useState(paper ? 'active_paper' : 'full_moet');
  const [schoolName, setSchoolName] = useState('SỞ GIÁO DỤC VÀ ĐÀO TẠO');
  const [year, setYear] = useState('KỲ THI TỐT NGHIỆP THPT NĂM 2025');
  const [examTitle, setExamTitle] = useState(paper?.title || '');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(50);
  const [council, setCouncil] = useState('');
  const [examSite, setExamSite] = useState('');
  const [examDate, setExamDate] = useState('');
  const [codesInput, setCodesInput] = useState(paperCodes.join(', '));
  const [prefillCodeBubbles, setPrefillCodeBubbles] = useState(false);
  const [colorMode, setColorMode] = useState('rose');
  const [previewIdx, setPreviewIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    if (paper) {
      setPresetId('active_paper');
      setExamTitle(paper.title || '');
      const list = Object.keys(paper.keys || {}).sort();
      setCodesInput(list.join(', '));
    } else {
      setPresetId('full_moet');
    }
    setPreviewIdx(0);
  }, [open, paper]);

  const activeCounts = useMemo(() => {
    if (presetId === 'active_paper' && paper?.counts) {
      return paper.counts;
    }
    const found = MOET_EXAM_PRESETS.find((p) => p.id === presetId);
    return found ? found.counts : { p1: 40, p2: 8, p3: 6 };
  }, [presetId, paper]);

  const parsedCodes = useMemo(() => {
    const list = parseCodeList(codesInput);
    return list.length > 0 ? list : [''];
  }, [codesInput]);

  useEffect(() => {
    if (previewIdx >= parsedCodes.length) setPreviewIdx(0);
  }, [parsedCodes.length, previewIdx]);

  const buildOptionsForCode = (codeVal) => ({
    counts: activeCounts,
    title: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM',
    code: codeVal,
    examTitle,
    subject,
    duration,
    schoolName,
    year,
    council,
    examSite,
    examDate,
    colorMode,
    prefillCodeBubbles: Boolean(prefillCodeBubbles && codeVal),
  });

  const currentPreviewCode = parsedCodes[previewIdx] || '';
  const previewSvg = useMemo(
    () => (open ? buildOmrSvgMarkup(buildOptionsForCode(currentPreviewCode)) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, activeCounts, currentPreviewCode, examTitle, subject, duration, schoolName, year, council, examSite, examDate, colorMode, prefillCodeBubbles]
  );

  const serialTag = useMemo(
    () => buildSheetSerial({ code: currentPreviewCode, examTitle, subject }),
    [currentPreviewCode, examTitle, subject]
  );

  if (!open) return null;

  const pageList = parsedCodes.map((c) => buildOptionsForCode(c));

  const handlePrint = () => {
    setErrorMsg('');
    try {
      if (pageList.length > 1) {
        printMultipleOmrSheets(pageList);
      } else {
        printOmrSheetA4(pageList[0]);
      }
      onPrinted?.({ count: pageList.length, colorMode, method: 'print' });
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể mở lệnh in. Bạn có thể bấm Tải file A4 (.html).');
    }
  };

  const handleDownload = () => {
    setErrorMsg('');
    try {
      const slug = (examTitle || 'phieu-omr-bgd-2025')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'phieu-omr-bgd-2025';
      downloadOmrSheetHtml(pageList, `${slug}-${pageList.length}trang-elecai.html`);
      onPrinted?.({ count: pageList.length, colorMode, method: 'download' });
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể tải file HTML A4.');
    }
  };

  return (
    <div
      className="vt-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="pg-print-studio"
        role="dialog"
        aria-modal="true"
        aria-label="Studio In Phiếu OMR Chuẩn Bộ GD&ĐT"
      >
        <header className="pg-ed-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ElecFlaskBrandSvg size={28} variant="gradient" />
            <div>
              <h3 style={{ margin: 0 }}>Studio Thiết Kế &amp; In Phiếu OMR A4</h3>
              <small style={{ marginLeft: 0 }}>Chuẩn Bộ GD&amp;ĐT 2025+ · Khớp 55 vạch quang học ELEC AI · Khóa 1 trang A4</small>
            </div>
          </div>
          <button type="button" className="pg-icon" onClick={onClose} aria-label="Đóng">
            <IcoX size={16} />
          </button>
        </header>

        <div className="pg-studio-body">
          {/* Cột trái: Cấu hình */}
          <div className="pg-studio-controls">
            <div className="pg-studio-group">
              <span className="pg-studio-label">1. Cấu trúc đề trên phiếu</span>
              <div className="pg-preset-chips">
                {paper?.counts && (
                  <button
                    type="button"
                    className={'pg-preset-chip' + (presetId === 'active_paper' ? ' on' : '')}
                    onClick={() => setPresetId('active_paper')}
                  >
                    <b>Bài chấm ({paper.counts.p1}·{paper.counts.p2}·{paper.counts.p3})</b>
                  </button>
                )}
                {MOET_EXAM_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={'pg-preset-chip' + (presetId === p.id ? ' on' : '')}
                    onClick={() => setPresetId(p.id)}
                    title={p.note}
                  >
                    <b>{p.shortLabel}</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="pg-studio-group">
              <span className="pg-studio-label">2. Thông tin in trên phiếu</span>
              <div className="pg-studio-grid">
                <label className="pg-field">
                  <span>Sở / Trường</span>
                  <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO" />
                </label>
                <label className="pg-field">
                  <span>Niên khóa / Tiêu ngữ</span>
                  <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="KỲ THI TỐT NGHIỆP THPT NĂM 2025" />
                </label>
                <label className="pg-field wide">
                  <span>Kỳ thi (để trống = dòng chấm cho thí sinh ghi)</span>
                  <input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="VD: Thi thử Tốt nghiệp THPT Lần 1" />
                </label>
                <label className="pg-field">
                  <span>Bài thi / Môn</span>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Toán / Vật lí / Hóa học..." />
                </label>
                <label className="pg-field">
                  <span>Thời gian (phút)</span>
                  <input type="number" min="0" max="240" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 0)} />
                </label>
                <label className="pg-field">
                  <span>Hội đồng thi (tùy chọn)</span>
                  <input value={council} onChange={(e) => setCouncil(e.target.value)} placeholder="Để trống nếu muốn chấm...." />
                </label>
                <label className="pg-field">
                  <span>Ngày thi (tùy chọn)</span>
                  <input value={examDate} onChange={(e) => setExamDate(e.target.value)} placeholder="VD: 26/06/2025" />
                </label>
                <label className="pg-field wide">
                  <span>Điểm thi (tùy chọn)</span>
                  <input value={examSite} onChange={(e) => setExamSite(e.target.value)} placeholder="Để trống nếu muốn để dòng chấm...." />
                </label>
              </div>
            </div>

            <div className="pg-studio-group">
              <span className="pg-studio-label">3. In nhiều mã đề &amp; Chế độ mực</span>
              <label className="pg-field">
                <span>Danh sách Mã đề (cách nhau dấu phẩy · bỏ trống để học sinh tự tô)</span>
                <input
                  value={codesInput}
                  onChange={(e) => setCodesInput(e.target.value)}
                  placeholder="VD: 101, 102, 103, 104"
                />
              </label>
              {parsedCodes[0] && (
                <label className="pg-check-row">
                  <input
                    type="checkbox"
                    checked={prefillCodeBubbles}
                    onChange={(e) => setPrefillCodeBubbles(e.target.checked)}
                  />
                  <span>Tô sẵn luôn 3 ô tròn Mã đề (giúp quét OMR 100%, không lo thí sinh quên tô)</span>
                </label>
              )}

              <div className="pg-ink-toggle">
                <button
                  type="button"
                  className={'pg-ink-btn rose' + (colorMode === 'rose' ? ' on' : '')}
                  onClick={() => setColorMode('rose')}
                >
                  <span className="dot" />
                  Chuẩn OMR Đỏ-Hồng (Quét nhạy nhất)
                </button>
                <button
                  type="button"
                  className={'pg-ink-btn bw' + (colorMode === 'bw' ? ' on' : '')}
                  onClick={() => setColorMode('bw')}
                >
                  <span className="dot" />
                  Đen trắng (Photocopy)
                </button>
              </div>
            </div>

            {errorMsg && <p className="pg-error">{errorMsg}</p>}

            <div className="pg-studio-actions">
              <button type="button" className="vt-btn" onClick={handleDownload}>
                <IcoDownload size={15} /> Tải File In A4 (.html)
              </button>
              <button type="button" className="vt-btn primary" onClick={handlePrint}>
                <IcoPrint size={15} /> In {pageList.length > 1 ? `${pageList.length} Mã Đề A4` : 'Phiếu A4 Ngay'}
              </button>
            </div>
          </div>

          {/* Cột phải: Xem trước trực tiếp khổ A4 */}
          <div className="pg-studio-preview">
            <div className="pg-preview-bar">
              <span className="pg-preview-badge">
                <IcoCheck size={13} /> Bản quyền {serialTag} · Khớp 55 vạch OMR
              </span>
              {parsedCodes.length > 1 && (
                <div className="pg-preview-tabs">
                  {parsedCodes.map((c, idx) => (
                    <button
                      key={`${c}-${idx}`}
                      type="button"
                      className={idx === previewIdx ? 'on' : ''}
                      onClick={() => setPreviewIdx(idx)}
                    >
                      Mã {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pg-preview-paper-wrap">
              <div
                className="pg-preview-paper"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
