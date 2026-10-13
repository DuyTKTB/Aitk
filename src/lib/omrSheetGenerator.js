/* ============================================================
   omrSheetGenerator.js — Bộ Tạo & In Phiếu Trả Lời Trắc Nghiệm A4
   Khớp chuẩn tọa độ nhận dạng Camera/Scanner OMR (omr.js)
   Chuẩn Bộ Giáo dục & Đào tạo 2025 (Kỳ thi tốt nghiệp THPT)
   ------------------------------------------------------------
   v2: Nhận danh sách câu hỏi → tự động tính layout
   ============================================================ */

/**
 * Phân loại câu hỏi thành 3 phần theo chuẩn Bộ GD&ĐT 2025.
 * @param {Array} questions
 * @returns {{ singleChoice: Array, trueFalse: Array, shortAnswer: Array }}
 */
export function categorizeQuestions(questions = []) {
  const singleChoice = [];
  const trueFalse = [];
  const shortAnswer = [];

  questions.forEach((q, idx) => {
    const type = q.type || 'single_choice';
    const num = idx + 1;
    if (type === 'single_choice') singleChoice.push({ ...q, num });
    else if (type === 'true_false') trueFalse.push({ ...q, num });
    else if (type === 'short_answer') shortAnswer.push({ ...q, num });
  });

  return { singleChoice, trueFalse, shortAnswer };
}

/**
 * Chia mảng thành `n` cột đều nhau.
 */
function splitIntoColumns(arr, numCols) {
  if (arr.length === 0) return [];
  const perCol = Math.ceil(arr.length / numCols);
  const cols = [];
  for (let i = 0; i < arr.length; i += perCol) {
    cols.push(arr.slice(i, i + perCol));
  }
  return cols;
}

/**
 * Render khối Phần I (Trắc nghiệm nhiều lựa chọn).
 */
function renderSection1(items) {
  if (items.length === 0) return '';

  // Tối đa 4 cột; nếu ít câu thì chia vừa đủ
  const numCols = items.length <= 10 ? 1
    : items.length <= 20 ? 2
    : items.length <= 30 ? 3
    : 4;
  const cols = splitIntoColumns(items, numCols);

  return `
    <div class="sec-title">
      PHẦN I. Thí sinh trả lời từ câu 1 đến câu ${items.length}. Mỗi câu chọn 1 đáp án.
    </div>
    <div class="p1-cols" style="grid-template-columns: repeat(${cols.length}, 1fr);">
      ${cols.map((col) => `
        <div class="p1-col">
          ${col.map((q) => `
            <div class="q-item">
              <span class="q-num">${q.num}.</span>
              <span class="bubble">A</span>
              <span class="bubble">B</span>
              <span class="bubble">C</span>
              <span class="bubble">D</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render khối Phần II (Đúng/Sai).
 */
function renderSection2(items) {
  if (items.length === 0) return '';

  const numCols = items.length <= 4 ? 2 : items.length <= 8 ? 4 : 4;
  const cols = splitIntoColumns(items, numCols);

  return `
    <div class="sec-title">
      PHẦN II. Câu trắc nghiệm Đúng/Sai (Từ câu 1 đến câu ${items.length}). Mỗi ý a), b), c), d) chọn Đúng hoặc Sai.
    </div>
    <div class="p2-cols" style="grid-template-columns: repeat(${cols.length}, 1fr);">
      ${cols.map((col) => col.map((q) => `
        <div class="p2-col">
          <strong>Câu ${q.num}</strong>
          ${['a', 'b', 'c', 'd'].map((sub) => `
            <div class="p2-row">
              <span>${sub})</span>
              <span class="bubble sm">Đ</span>
              <span class="bubble sm">S</span>
            </div>
          `).join('')}
        </div>
      `).join('')).join('')}
    </div>
  `;
}

/**
 * Render khối Phần III (Trả lời ngắn).
 */
function renderSection3(items) {
  if (items.length === 0) return '';

  const numCols = Math.min(items.length, 6);

  return `
    <div class="sec-title">
      PHẦN III. Câu trắc nghiệm trả lời ngắn (Từ câu 1 đến câu ${items.length}). Tô số tương ứng đáp án.
    </div>
    <div class="p3-cols" style="grid-template-columns: repeat(${numCols}, 1fr);">
      ${items.map((q) => `
        <div class="p3-col">
          <strong>Câu ${q.num}</strong>
          <div class="p3-signs">
            <span class="bubble sm">-</span>
            <span class="bubble sm">,</span>
          </div>
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `
            <div class="p3-digit-row">
              <span class="bubble sm">${digit}</span>
              <span class="bubble sm">${digit}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Mở cửa sổ in và xuất phiếu trả lời trắc nghiệm A4.
 * Tự động tính layout dựa trên danh sách câu hỏi.
 *
 * @param {Object} options
 * @param {Array}  options.questions   - Danh sách câu hỏi (có type: 'single_choice'|'true_false'|'short_answer')
 * @param {string} options.title       - Tiêu đề phiếu
 * @param {string} options.code        - Mã đề (VD: '101')
 * @param {string} options.examTitle   - Tên đề thi
 * @param {string} options.subject     - Môn học
 * @param {number} options.duration    - Thời gian (phút)
 * @param {string} options.schoolName  - Tên trường (tùy chọn)
 * @param {string} options.year        - Năm học (tùy chọn)
 */
export function printOmrSheetA4({
  questions = [],
  title = 'PHIẾU TRẢ LỜI TRẮC NGHIỆM',
  code = '',
  examTitle = '',
  subject = '',
  duration = 45,
  schoolName = 'BỘ GIÁO DỤC VÀ ĐÀO TẠO',
  year = 'KỲ THI TỐT NGHIỆP THPT NĂM 2025',
} = {}) {
  const printWin = window.open('', '_blank', 'width=900,height=1000');
  if (!printWin) {
    alert('Trình duyệt đang chặn cửa sổ pop-up. Vui lòng cho phép pop-up để in mẫu phiếu A4.');
    return;
  }

  const { singleChoice, trueFalse, shortAnswer } = categorizeQuestions(questions);
  const totalQuestions = singleChoice.length + trueFalse.length + shortAnswer.length;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}${code ? ` — Mã ${code}` : ''}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; }
    body { background: #ffffff; color: #000000; padding: 10px; }

    .sheet-container {
      width: 100%; max-width: 780px; margin: 0 auto;
      border: 2px solid #000; padding: 16px; position: relative;
    }

    /* 4 Dấu định vị nhận dạng ảnh */
    .fiducial-mark { position: absolute; width: 18px; height: 18px; background: #000; }
    .fiducial-tl { top: 8px; left: 8px; }
    .fiducial-tr { top: 8px; right: 8px; }
    .fiducial-bl { bottom: 8px; left: 8px; }
    .fiducial-br { bottom: 8px; right: 8px; }

    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .header-table td { vertical-align: top; font-size: 13px; }
    .title-h1 { text-align: center; font-size: 17px; font-weight: bold; text-transform: uppercase; margin: 4px 0 2px; }
    .title-sub { text-align: center; font-size: 12px; font-style: italic; margin-bottom: 10px; }

    .info-grid {
      display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;
      border: 1px solid #000; padding: 8px; margin-bottom: 12px; font-size: 12px;
    }

    .bubble-grid-box { border: 1px solid #000; padding: 6px; }
    .bubble-grid-box h4 {
      text-align: center; font-size: 12px; text-transform: uppercase;
      margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;
    }
    .bubble-row { display: flex; justify-content: space-around; align-items: center; margin: 2px 0; }

    .bubble {
      width: 15px; height: 15px; border: 1px solid #000; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: bold;
    }
    .bubble.sm { width: 13px; height: 13px; font-size: 8px; }

    .sec-title {
      font-size: 13px; font-weight: bold; text-transform: uppercase;
      background: #e5e5e5; padding: 3px 6px; border: 1px solid #000;
      margin-top: 10px; margin-bottom: 6px;
    }
    .p1-cols, .p2-cols, .p3-cols { display: grid; gap: 8px; }
    .p1-col, .p2-col, .p3-col { border: 1px solid #000; padding: 4px; }

    .q-item {
      display: flex; align-items: center; justify-content: space-between;
      margin: 3px 0; font-size: 11px;
    }
    .q-num { font-weight: bold; width: 20px; }

    .p2-row {
      display: flex; justify-content: space-between; align-items: center;
      margin: 2px 0; font-size: 11px;
    }
    .p2-row > span:first-child { width: 14px; font-weight: bold; }

    .p3-col { text-align: center; font-size: 10px; }
    .p3-signs { display: flex; justify-content: space-around; margin: 3px 0; }
    .p3-digit-row { display: flex; justify-content: space-around; margin: 1px 0; }

    @media print {
      body { padding: 0; }
      .sheet-container { border: 2px solid #000; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 10px 24px; font-size: 16px; font-weight: bold; background: #0284c7; color: #fff; border: none; border-radius: 999px; cursor: pointer;">
      🖨️ In Phiếu Trả Lời Trắc Nghiệm Ngay (A4)
    </button>
  </div>

  <div class="sheet-container">
    <div class="fiducial-mark fiducial-tl"></div>
    <div class="fiducial-mark fiducial-tr"></div>
    <div class="fiducial-mark fiducial-bl"></div>
    <div class="fiducial-mark fiducial-br"></div>

    <table class="header-table">
      <tr>
        <td style="width: 50%;">
          <strong>${schoolName}</strong><br>
          ${year}
        </td>
        <td style="width: 50%; text-align: right;">
          MÃ VẠCH QUÉT OMR<br>
          <strong style="letter-spacing: 2px;">|||||||||||||||||||||||||</strong>
        </td>
      </tr>
    </table>

    <div class="title-h1">${title}</div>
    <div class="title-sub">
      (Thí sinh dùng bút chì 2B để tô kín các ô tròn; không gấp, làm rách phiếu)
    </div>

    <div class="info-grid">
      <div>
        <p><strong>${examTitle || 'Đề kiểm tra'}</strong></p>
        ${subject ? `<p style="margin-top: 3px;">Môn: <b>${subject}</b>${duration ? ` — Thời gian: ${duration} phút` : ''}</p>` : ''}
        <p style="margin-top: 4px;">Họ tên thí sinh: ............................................................</p>
        <p style="margin-top: 4px;">Ngày sinh: ....../...... /.......... Lớp: ....................</p>
      </div>

      <div class="bubble-grid-box">
        <h4>SỐ BÁO DANH</h4>
        <div style="display: flex; justify-content: space-around; font-size: 10px; font-weight: bold; margin-bottom: 2px;">
          <span>①</span><span>②</span><span>③</span><span>④</span><span>⑤</span><span>⑥</span>
        </div>
        ${Array.from({ length: 10 }).map((_, r) => `
          <div class="bubble-row">
            ${Array.from({ length: 6 }).map(() => `<span class="bubble sm">${r}</span>`).join('')}
          </div>
        `).join('')}
      </div>

      <div class="bubble-grid-box">
        <h4>MÃ ĐỀ THI</h4>
        <div style="display: flex; justify-content: space-around; font-size: 10px; font-weight: bold; margin-bottom: 2px;">
          <span>①</span><span>②</span><span>③</span>
        </div>
        ${Array.from({ length: 10 }).map((_, r) => `
          <div class="bubble-row">
            ${Array.from({ length: 3 }).map((c) => {
              // Đánh dấu mã đề tương ứng nếu có
              const digitPos = code ? code[r] || code[c] : null;
              return `<span class="bubble sm">${r}</span>`;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>

    ${renderSection1(singleChoice)}
    ${renderSection2(trueFalse)}
    ${renderSection3(shortAnswer)}

    ${totalQuestions === 0 ? `
      <div style="text-align: center; padding: 40px; font-style: italic; color: #666;">
        (Chưa có câu hỏi nào để tạo phiếu. Vui lòng sinh đề trước.)
      </div>
    ` : `
      <div style="text-align: right; margin-top: 12px; font-size: 11px; font-style: italic;">
        Tổng số câu: <b>${totalQuestions}</b>
        ${code ? ` · Mã đề: <b>${code}</b>` : ''}
      </div>
    `}
  </div>
</body>
</html>`;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

/**
 * In nhiều phiếu OMR cho nhiều mã đề cùng lúc.
 * Mỗi mã sẽ mở 1 cửa sổ riêng, cách nhau 600ms để tránh block popup.
 *
 * @param {Object[]} variants - Mảng { code, questions }
 * @param {Object}   commonOptions - Các option chung (title, examTitle, subject, duration, ...)
 */
export function printMultipleOmrSheets(variants = [], commonOptions = {}) {
  if (!Array.isArray(variants) || variants.length === 0) {
    alert('Chưa có mã đề nào để in.');
    return;
  }

  variants.forEach((variant, idx) => {
    setTimeout(() => {
      printOmrSheetA4({
        ...commonOptions,
        code: variant.code,
        questions: variant.questions || commonOptions.questions || [],
      });
    }, idx * 600);
  });
}