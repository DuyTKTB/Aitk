/* ============================================================
   omrSheetGenerator.js — Bộ Tạo & In Phiếu Trả Lời Trắc Nghiệm A4
   Khớp chuẩn tọa độ nhận dạng Camera/Scanner OMR (omr.js)
   Chuẩn Bộ Giáo dục & Đào tạo 2025 (Kỳ thi tốt nghiệp THPT)
   ============================================================ */

/**
 * Mở cửa sổ in và xuất phiếu trả lời trắc nghiệm A4 chuẩn Bộ GD&ĐT 2025
 */
export function printOmrSheetA4({ title = 'PHIẾU TRẢ LỜI TRẮC NGHIỆM' } = {}) {
  const printWin = window.open('', '_blank', 'width=900,height=1000');
  if (!printWin) {
    alert('Trình duyệt đang chặn cửa sổ pop-up. Vui lòng cho phép pop-up để in mẫu phiếu A4.');
    return;
  }

  const p1Blocks = [
    { start: 1, end: 10 },
    { start: 11, end: 20 },
    { start: 21, end: 30 },
    { start: 31, end: 40 },
  ];

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title} — Chuẩn Bộ GD&ĐT 2025</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
    }
    body {
      background: #ffffff;
      color: #000000;
      padding: 10px;
    }
    .sheet-container {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 16px;
      position: relative;
    }
    /* 4 Dấu định vị nhận dạng ảnh ở 4 góc */
    .fiducial-mark {
      position: absolute;
      width: 18px;
      height: 18px;
      background: #000;
    }
    .fiducial-tl { top: 8px; left: 8px; }
    .fiducial-tr { top: 8px; right: 8px; }
    .fiducial-bl { bottom: 8px; left: 8px; }
    .fiducial-br { bottom: 8px; right: 8px; }

    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
      font-size: 13px;
    }
    .title-h1 {
      text-align: center;
      font-size: 17px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 4px 0 2px;
    }
    .title-sub {
      text-align: center;
      font-size: 12px;
      font-style: italic;
      margin-bottom: 10px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 10px;
      border: 1px solid #000;
      padding: 8px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    /* Khung SBD & Mã Đề */
    .bubble-grid-box {
      border: 1px solid #000;
      padding: 6px;
    }
    .bubble-grid-box h4 {
      text-align: center;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 4px;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
    }
    .bubble-row {
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin: 2px 0;
    }
    .bubble {
      width: 15px;
      height: 15px;
      border: 1px solid #000;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: bold;
    }

    /* Phần I: 40 câu */
    .sec-title {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      background: #e5e5e5;
      padding: 3px 6px;
      border: 1px solid #000;
      margin-top: 10px;
      margin-bottom: 6px;
    }
    .p1-cols {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .p1-col {
      border: 1px solid #000;
      padding: 4px;
    }
    .q-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 11px;
    }
    .q-num {
      font-weight: bold;
      width: 20px;
    }

    /* Phần II: Đúng/Sai */
    .p2-cols {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .p2-col {
      border: 1px solid #000;
      padding: 4px;
      font-size: 11px;
    }

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
          <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br>
          KỲ THI TỐT NGHIỆP THPT NĂM 2025
        </td>
        <td style="width: 50%; text-align: right;">
          MÃ VẠCH QUÉT OMR<br>
          <strong style="letter-spacing: 2px;">|||||||||||||||||||||||||</strong>
        </td>
      </tr>
    </table>

    <div class="title-h1">${title}</div>
    <div class="title-sub">(Thí sinh dùng bút chì 2B để tô kín các ô tròn; không gấp, làm rách phiếu)</div>

    <div class="info-grid">
      <div>
        <p>Hội đồng thi: ..............................................................</p>
        <p style="margin-top: 4px;">Điểm thi: .....................................................................</p>
        <p style="margin-top: 4px;">Họ tên thí sinh: ............................................................</p>
        <p style="margin-top: 4px;">Ngày sinh: ....../...... /.......... Phòng thi: ....................</p>
      </div>

      <!-- SBD (6 cột) -->
      <div class="bubble-grid-box">
        <h4>SỐ BÁO DANH</h4>
        <div style="display: flex; justify-content: space-around; font-size: 10px; font-weight: bold; margin-bottom: 2px;">
          <span>①</span><span>②</span><span>③</span><span>④</span><span>⑤</span><span>⑥</span>
        </div>
        ${Array.from({ length: 10 }).map((_, r) => `
          <div class="bubble-row">
            ${Array.from({ length: 6 }).map(() => `<span class="bubble">${r}</span>`).join('')}
          </div>
        `).join('')}
      </div>

      <!-- MÃ ĐỀ (3 cột) -->
      <div class="bubble-grid-box">
        <h4>MÃ ĐỀ THI</h4>
        <div style="display: flex; justify-content: space-around; font-size: 10px; font-weight: bold; margin-bottom: 2px;">
          <span>①</span><span>②</span><span>③</span>
        </div>
        ${Array.from({ length: 10 }).map((_, r) => `
          <div class="bubble-row">
            ${Array.from({ length: 3 }).map(() => `<span class="bubble">${r}</span>`).join('')}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- PHẦN I: 40 CÂU -->
    <div class="sec-title">PHẦN I. Thí sinh trả lời từ câu 1 đến câu 40. Mỗi câu chọn 1 đáp án.</div>
    <div class="p1-cols">
      ${p1Blocks.map((blk) => `
        <div class="p1-col">
          ${Array.from({ length: blk.end - blk.start + 1 }).map((_, idx) => {
            const qNum = blk.start + idx;
            return `
              <div class="q-item">
                <span class="q-num">${qNum}.</span>
                <span class="bubble">A</span>
                <span class="bubble">B</span>
                <span class="bubble">C</span>
                <span class="bubble">D</span>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>

    <!-- PHẦN II: 8 CÂU ĐÚNG / SAI -->
    <div class="sec-title">PHẦN II. Câu trắc nghiệm Đúng/Sai (Từ câu 1 đến câu 8). Trong mỗi ý a), b), c), d) chọn Đúng hoặc Sai.</div>
    <div class="p2-cols">
      ${[1, 2, 3, 4, 5, 6, 7, 8].map((qNum) => `
        <div class="p2-col">
          <strong>Câu ${qNum}</strong>
          ${['a', 'b', 'c', 'd'].map((sub) => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 2px 0;">
              <span>${sub})</span>
              <span class="bubble" style="font-size: 8px;">Đ</span>
              <span class="bubble" style="font-size: 8px;">S</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <!-- PHẦN III: 6 CÂU TRẢ LỜI NGẮN -->
    <div class="sec-title">PHẦN III. Câu trắc nghiệm trả lời ngắn (Từ câu 1 đến câu 6). Tô số tương ứng đáp án.</div>
    <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; font-size: 11px;">
      ${[1, 2, 3, 4, 5, 6].map((qNum) => `
        <div style="border: 1px solid #000; padding: 4px; text-align: center;">
          <strong>Câu ${qNum}</strong>
          <div style="display: flex; justify-content: space-around; margin: 3px 0;">
            <span class="bubble" style="font-size: 8px;">-</span>
            <span class="bubble" style="font-size: 8px;">,</span>
          </div>
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `
            <div style="display: flex; justify-content: space-around; margin: 1px 0;">
              <span class="bubble" style="font-size: 8px;">${digit}</span>
              <span class="bubble" style="font-size: 8px;">${digit}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}
