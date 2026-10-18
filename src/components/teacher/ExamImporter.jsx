/* ============================================================
   ExamImporter.jsx — Nhập đề từ file (khôi phục sau khi file hỏng)
   Props tương thích với CreateExamPage / QuestionBank:
   variant, classInfo, classes, allowBank, allowSoftExam, onCreateSoftExam
   ============================================================ */
import { useRef, useState } from 'react';

const parseQuestions = (raw) => {
  /* Định dạng: mỗi câu bắt đầu bằng số; lựa chọn "A. …"; dòng "Đáp án: B" */
  const blocks = raw.split(/\n(?=\s*\d+[.)])/g);
  const out = [];
  for (const b of blocks) {
    const lines = b.trim().split('\n').filter(Boolean);
    if (!lines.length) continue;
    const qText = lines[0].replace(/^\s*\d+[.)]\s*/, '').trim();
    if (!qText) continue;
    const body = lines.slice(1).join('\n');
    const ansMatch = body.match(/(?:đáp án|Đáp án|ĐÁP ÁN)\s*[:\-]?\s*([A-Da-d])/);
    const optionLines = body.split('\n').filter((l) => /^[A-Da-d][.)]\s/.test(l.trim()));
    let options = [], correct = 0;
    if (optionLines.length >= 2) {
      options = optionLines.map((l) => l.replace(/^[A-Da-d][.)]\s*/, '').trim());
      if (ansMatch) {
        const idx = ['A', 'B', 'C', 'D'].indexOf(ansMatch[1].toUpperCase());
        if (idx >= 0 && idx < options.length) correct = idx;
      }
    }
    out.push({
      q: qText,
      type: 'mcq',
      options: options.length ? options : ['', '', '', ''],
      correct: options.length ? correct : 0,
      points: 1,
      explain: '',
    });
  }
  return out;
};

export default function ExamImporter({
  variant = 'page',
  classInfo = null,
  classes = [],
  allowBank = false,
  allowSoftExam = false,
  onCreateSoftExam = null,
}) {
  const fileRef = useRef(null);
  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState(classInfo?.id || classes[0]?.id || '');
  const [msg, setMsg] = useState('');

  const parsed = raw.trim() ? parseQuestions(raw) : [];

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      let text = '';
      if (/\.pdf$/i.test(f.name)) {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
        for (let i = 1; i <= Math.min(15, pdf.numPages); i++) {
          const page = await pdf.getPage(i);
          const c = await page.getTextContent();
          text += c.items.map((it) => it.str).join(' ') + '\n';
        }
      } else {
        text = await f.text();
      }
      setRaw(text);
      setFileName(f.name);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
      setMsg('');
    } catch {
      setMsg('Không đọc được file này. Dùng PDF có chữ hoặc TXT.');
    }
  };

  const handleCreate = async () => {
    if (!parsed.length) { setMsg('Chưa nhận diện được câu hỏi nào.'); return; }
    if (!onCreateSoftExam) { setMsg('Tính năng nhập đang không khả dụng ở nơi này.'); return; }
    try {
      await onCreateSoftExam({
        title: title || fileName || 'Đề nhập từ file',
        duration: Math.max(15, parsed.length * 2),
        classId,
        subject: classInfo?.subject || '',
        grade: classInfo?.grade || '',
        questions: parsed,
        sourceFile: fileName || null,
      });
      setMsg('Đã tạo đề từ file thành công!');
    } catch (e) {
      setMsg(e.message || 'Lỗi khi tạo đề.');
    }
  };

  return (
    <div style={{ padding: '1.2rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
      <div>
        <h3 style={{ margin: 0, font: '700 1rem var(--sans, sans-serif)', color: 'var(--ink, #1d1d1f)' }}>
          Nhập đề từ file
        </h3>
        <small style={{ color: 'var(--mut, #6e6e73)', fontSize: '.78rem' }}>
          Hỗ trợ PDF / TXT. Mỗi câu bắt đầu bằng số; lựa chọn dạng <code>A. …</code>; dòng <code>Đáp án: B</code> đánh dấu đáp án đúng.
        </small>
      </div>

      <label style={{
        display: 'block', padding: '1.2rem', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
        border: '2px dashed var(--edge, rgba(0,0,0,.15))', background: 'var(--soft, #f5f5f7)',
      }}>
        <input type="file" accept=".pdf,.txt,.md" hidden ref={fileRef} onChange={onFile} />
        <b style={{ fontSize: '.88rem' }}>Chọn file để nhập</b>
        <div style={{ fontSize: '.74rem', color: 'var(--mut, #6e6e73)', marginTop: 4 }}>
          {fileName || 'PDF · TXT · MD'}
        </div>
      </label>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder="…hoặc dán nội dung đề trực tiếp vào đây (định dạng giống file)…"
        style={{ width: '100%', resize: 'vertical', padding: '.7rem .85rem', borderRadius: 12, border: '1px solid var(--edge, rgba(0,0,0,.12))', font: '500 .8rem/1.5 var(--mono, monospace)', background: 'var(--bg, #fff)', color: 'var(--ink, #1d1d1f)' }}
      />

      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'grid', gap: 4, flex: '1 1 200px' }}>
          <small style={{ fontWeight: 700, fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--mut, #6e6e73)' }}>Tên đề</small>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Kiểm tra 15p Chương 2"
            style={{ padding: '.5rem .8rem', borderRadius: 10, border: '1px solid var(--edge, rgba(0,0,0,.12))', background: 'var(--bg, #fff)', color: 'var(--ink)', font: '500 .84rem var(--sans)' }} />
        </label>
        {classes.length > 0 && (
          <label style={{ display: 'grid', gap: 4, flex: '1 1 180px' }}>
            <small style={{ fontWeight: 700, fontSize: '.68rem', textTransform: 'uppercase', color: 'var(--mut, #6e6e73)' }}>Lớp</small>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}
              style={{ padding: '.5rem .7rem', borderRadius: 10, border: '1px solid var(--edge, rgba(0,0,0,.12))', background: 'var(--bg, #fff)', color: 'var(--ink)', font: '500 .82rem var(--sans)' }}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name || c.title || c.id}</option>)}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={!parsed.length || !allowSoftExam}
          style={{
            padding: '.55rem 1.2rem', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--acc, #0071e3)', color: 'var(--acc-ink, #fff)', font: '700 .82rem var(--sans)',
            opacity: !parsed.length || !allowSoftExam ? .5 : 1,
          }}
        >
          Tạo đề từ {parsed.length} câu nhận diện được
        </button>
      </div>

      {msg && (
        <p style={{ margin: 0, font: '600 .78rem var(--sans)', color: msg.includes('thành công') ? 'var(--ok, #16a34a)' : 'var(--err, #dc2626)' }}>
          {msg}
        </p>
      )}
    </div>
  );
}
