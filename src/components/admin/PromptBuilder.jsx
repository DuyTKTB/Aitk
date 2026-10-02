import { useState } from 'react';

const TEMPLATES = {
  fromText: {
    name: '📄 Từ nội dung bài học',
    build: (opts) => `Bạn là giáo viên ${opts.subject} ${opts.grade} có kinh nghiệm.

Dựa vào nội dung sau, hãy tạo ${opts.count} câu hỏi trắc nghiệm ${opts.difficultyText}.

NỘI DUNG:
"""
${opts.text || '(Paste nội dung bài học / đề thi vào đây)'}
"""

YÊU CẦU:
- Số câu: ${opts.count}
- Môn: ${opts.subject}
- Lớp: ${opts.grade}
- Độ khó: ${opts.difficultyText}
- Loại: trắc nghiệm 1 đáp án đúng (A/B/C/D)

ĐỊNH DẠNG TRẢ VỀ — CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH:

{
  "questions": [
    {
      "content": "Nội dung câu hỏi?",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "Đáp án A" },
        { "label": "B", "content": "Đáp án B" },
        { "label": "C", "content": "Đáp án C" },
        { "label": "D", "content": "Đáp án D" }
      ],
      "correctAnswer": "B",
      "explanation": "Lời giải chi tiết",
      "difficulty": "${opts.difficulty}",
      "topic": "Chủ đề"
    }
  ]
}`,
  },

  fromTopic: {
    name: '💡 Từ chủ đề',
    build: (opts) => `Bạn là giáo viên ${opts.subject} ${opts.grade} có kinh nghiệm.

Hãy tạo ${opts.count} câu hỏi trắc nghiệm về chủ đề: "${opts.topic || '(chủ đề)'}".

YÊU CẦU:
- Số câu: ${opts.count}
- Môn: ${opts.subject}
- Lớp: ${opts.grade}
- Độ khó: ${opts.difficultyText}
- Loại: trắc nghiệm 1 đáp án đúng

ĐỊNH DẠNG TRẢ VỀ — CHỈ TRẢ VỀ JSON:

{
  "questions": [
    {
      "content": "Câu hỏi?",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "..." },
        { "label": "B", "content": "..." },
        { "label": "C", "content": "..." },
        { "label": "D", "content": "..." }
      ],
      "correctAnswer": "B",
      "explanation": "Lời giải",
      "difficulty": "${opts.difficulty}",
      "topic": "${opts.topic}"
    }
  ]
}`,
  },

  fromImage: {
    name: '📷 Từ ảnh đề thi (OCR)',
    build: (opts) => `Tôi sẽ gửi cho bạn 1 ẢNH đề thi ${opts.subject} ${opts.grade}.

BƯỚC 1: Trích xuất toàn bộ nội dung văn bản trong ảnh (giữ nguyên công thức, số liệu).

BƯỚC 2: Chuyển thành ${opts.count} câu hỏi trắc nghiệm có cấu trúc.

YÊU CẦU:
- Môn: ${opts.subject}, Lớp: ${opts.grade}
- Độ khó: ${opts.difficultyText}
- Nếu ảnh đã có đáp án → dùng làm correctAnswer
- Nếu không có → tự suy luận đáp án đúng

ĐỊNH DẠNG TRẢ VỀ — JSON:

{
  "questions": [
    {
      "content": "...",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "..." },
        { "label": "B", "content": "..." },
        { "label": "C", "content": "..." },
        { "label": "D", "content": "..." }
      ],
      "correctAnswer": "B",
      "explanation": "Lời giải",
      "difficulty": "${opts.difficulty}",
      "topic": "..."
    }
  ]
}

Tôi sẽ gửi ảnh ngay sau tin nhắn này.`,
  },
};

const DIFFICULTY_TEXT = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  extreme: 'Rất khó',
};

export default function PromptBuilder({ grades = [], subjects = [], onImportJson }) {
  const [template, setTemplate] = useState('fromText');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [grade, setGrade] = useState('Lớp 11');
  const [subject, setSubject] = useState('Hóa học');
  const [difficulty, setDifficulty] = useState('medium');
  const [copied, setCopied] = useState(false);

  const buildPrompt = () => {
    const tpl = TEMPLATES[template];
    return tpl.build({
      text, topic, count, grade, subject, difficulty,
      difficultyText: DIFFICULTY_TEXT[difficulty],
    });
  };

  const prompt = buildPrompt();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Không copy được. Chọn thủ công nhé!');
    }
  };

  const handleOpenChatGPT = () => {
    navigator.clipboard.writeText(prompt);
    window.open('https://chat.openai.com', '_blank');
    alert('✅ Đã copy prompt. Paste vào ChatGPT (Ctrl+V) và gửi.');
  };

  const handleOpenGemini = () => {
    navigator.clipboard.writeText(prompt);
    window.open('https://gemini.google.com', '_blank');
    alert('✅ Đã copy prompt. Paste vào Gemini (Ctrl+V) và gửi.');
  };

  return (
    <div className="ad-prompt-builder">
      <div className="ad-pb-head">
        <h2>🎯 Tạo Prompt cho AI</h2>
        <p className="ad-hint">
          Điền thông tin → Copy prompt → Paste vào ChatGPT/Gemini/CU AI → Nhận JSON → Dán vào ô bên dưới.
        </p>
      </div>

      <div className="ad-pb-templates">
        {Object.entries(TEMPLATES).map(([id, t]) => (
          <button
            key={id}
            className={'ad-pb-tpl' + (template === id ? ' on' : '')}
            onClick={() => setTemplate(id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="ad-pb-form">
        <div className="ad-form-row">
          <label>
            <span>Lớp</span>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {grades.length ? (
                grades.map((g) => <option key={g.id}>{g.name}</option>)
              ) : (
                <>
                  <option>Lớp 10</option>
                  <option>Lớp 11</option>
                  <option>Lớp 12</option>
                </>
              )}
            </select>
          </label>

          <label>
            <span>Môn</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.length ? (
                subjects.map((s) => <option key={s.id}>{s.name}</option>)
              ) : (
                <>
                  <option>Hóa học</option>
                  <option>Toán</option>
                  <option>Vật lí</option>
                  <option>Sinh học</option>
                </>
              )}
            </select>
          </label>

          <label>
            <span>Số câu</span>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(+e.target.value)}
              min={1}
              max={50}
            />
          </label>

          <label>
            <span>Độ khó</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
              <option value="extreme">Rất khó</option>
            </select>
          </label>
        </div>

        {template === 'fromTopic' && (
          <label>
            <span>Chủ đề</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Axit - Bazơ, Phản ứng oxi hóa khử…"
            />
          </label>
        )}

        {template === 'fromText' && (
          <label>
            <span>Nội dung bài học / đề thi</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste nội dung bài học hoặc đề thi vào đây…"
            />
          </label>
        )}

        {template === 'fromImage' && (
          <div className="ad-pb-image-hint">
            <p>📷 <b>Hướng dẫn:</b></p>
            <ol>
              <li>Nhấn <b>Copy prompt</b> bên dưới</li>
              <li>Mở <b>ChatGPT</b> hoặc <b>Gemini</b></li>
              <li>Paste prompt (Ctrl+V)</li>
              <li>Đính kèm <b>ảnh đề thi</b> vào cùng tin nhắn</li>
              <li>Gửi và chờ AI trả JSON</li>
              <li>Copy JSON → dán vào ô bên dưới</li>
            </ol>
          </div>
        )}
      </div>

      <details className="ad-pb-preview">
        <summary>👁 Xem prompt đã tạo</summary>
        <pre>{prompt}</pre>
      </details>

      <div className="ad-pb-actions">
        <button className="ad-btn primary" onClick={handleCopy}>
          {copied ? '✅ Đã copy!' : '📋 Copy prompt'}
        </button>
        <button className="ad-btn" onClick={handleOpenChatGPT}>
          💬 Mở ChatGPT
        </button>
        <button className="ad-btn" onClick={handleOpenGemini}>
          ✨ Mở Gemini
        </button>
      </div>

      <div className="ad-pb-import">
        <h3>📥 Dán JSON từ AI</h3>
        <textarea
          placeholder='Paste JSON mà AI trả về vào đây…'
          rows={8}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text');
            if (pasted && onImportJson) {
              setTimeout(() => onImportJson(pasted), 50);
            }
          }}
          onChange={(e) => {
            if (e.target.value.trim().length > 50 && onImportJson) {
              onImportJson(e.target.value);
            }
          }}
        />
        <p className="ad-hint">
          💡 Sau khi paste JSON, sẽ tự động chuyển sang bước <b>Duyệt câu hỏi</b>.
        </p>
      </div>
    </div>
  );
}