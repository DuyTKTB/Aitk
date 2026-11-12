/**
 * aiChalkboardParser.js
 * 
 * Bộ phân tích và trích xuất kịch bản Bảng Phấn Tương Tác từ phản hồi của AI
 * Hỗ trợ chuyển đổi tự động từ văn bản giải toán sang bài giảng vẽ từng bước (Step-by-step)
 */

/**
 * Nhận diện chính xác chế độ 3D/2D và Hệ trục tọa độ từ nội dung câu lệnh vẽ và văn bản đề bài
 */
export function detectDimensionAndAxes(allMvContent = '', fullText = '') {
  // 1. Kiểm tra tọa độ 3D trong câu lệnh (ví dụ: A = (-3.2, 0, 0) hoặc S = (0.2, 0.4, 5.0))
  const has3DCoords = /=\s*\(\s*[-+]?\d*\.?\d+\s*,\s*[-+]?\d*\.?\d+\s*,\s*[-+]?\d*\.?\d+\s*\)/.test(allMvContent);
  const has3DPrimitives = /\b(Pyramid|Prism|Sphere|Cone|Cylinder)\b/i.test(allMvContent);
  const has3DKeywords = /(hình\s*chóp|chóp|tứ\s*diện|lăng\s*trụ|hình\s*hộp|lập\s*phương|khối|nón|trụ|cầu|thiết\s*diện|giao\s*tuyến|không\s*gian|mặt\s*phẳng|đồng\s*phẳng|S\.[A-Z]{3,4}|\([A-Z]{3,4}\)|đáy)/i.test(fullText);

  // Mặc định là 3D nếu có tọa độ (x,y,z), lệnh khối 3D hoặc từ khóa hình học không gian
  let baChieu = true;
  if (has3DCoords || has3DPrimitives || has3DKeywords) {
    baChieu = true;
  } else {
    // Chỉ là 2D khi là bài tập thuần túy quang học, mạch điện hoặc khảo sát hàm số phẳng
    const has2DText = /(thấu\s*kính|lăng\s*kính|khúc\s*xạ|fresnel|mạch\s*rlc|mặt\s*phẳng\s*nghiêng|dao\s*động|đồ\s*thị|hàm\s*số|parabol|f\(x\)|g\(x\))/i.test(fullText);
    baChieu = !has2DText;
  }

  // 2. Hệ trục tọa độ (heTruc):
  // CHỈ BẬT KHI là bài khảo sát hàm số, đồ thị hoặc tọa độ Oxyz/Oxy tường minh!
  // Tuyệt đối KHÔNG BẬT hệ trục trong hình học không gian thuần túy (hình chóp, thiết diện, v.v.)
  let heTruc = false;
  if (has3DKeywords && !/\bOxyz\b/i.test(fullText)) {
    // Trong hình học không gian cổ điển (hình chóp S.ABC, tứ diện, thiết diện...)
    // KHÔNG BAO GIỜ vẽ hệ trục tọa độ x, y, z hay lưới Cartesian 2D!
    heTruc = false;
    baChieu = true;
  } else {
    const needsAxes = /(Oxyz|Oxy\b|hệ\s*trục|trục\s*tọa\s*độ|trục\s*hoành|trục\s*tung|khảo\s*sát\s*hàm\s*số|tiếp\s*tuyến\s*đồ\s*thị)/i.test(fullText) ||
                      /\b(domain=\[|Plot\(|f\(x\)\s*=|g\(x\)\s*=)/i.test(allMvContent);
    heTruc = needsAxes;
  }

  const gocNhin = baChieu ? [-1.22, 0.36, 1.0] : [0, 0, 1.0];

  return { baChieu, heTruc, gocNhin };
}

export function parseChalkboardFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Thử tìm khối JSON định dạng ```chalkboard-lesson
  const lessonMatch = text.match(/```(?:chalkboard-lesson|chalkboard-json)\s*([\s\S]*?)\s*```/i);
  if (lessonMatch) {
    try {
      const parsed = JSON.parse(lessonMatch[1].trim());
      if (parsed && Array.isArray(parsed.buoc) && parsed.buoc.length > 0) {
        return {
          lesson: sanitizeLesson(parsed),
          rawType: 'json-lesson',
        };
      }
    } catch (e) {
      console.warn('[aiChalkboardParser] Lỗi parse JSON lesson:', e);
    }
  }

  // 2. Thử tìm khối code ```chalkboard-mv hoặc ```mv
  const mvMatches = [...text.matchAll(/```(?:chalkboard-mv|chalkboard|mv)\s*([\s\S]*?)\s*```/gi)];
  if (mvMatches.length > 0) {
    // Trích xuất đề bài hoặc dòng đầu tiên
    const firstLines = text.split('\n').filter((l) => l.trim() && !l.startsWith('```')).slice(0, 3).join(' ');
    const titleMatch = text.match(/^(?:#+\s*)?(Cho\s+[^.\n]+|Khảo sát\s+[^.\n]+|Tính\s+[^.\n]+|Bài toán\s*:[^\n]+)/im);
    const tieuDe = titleMatch ? titleMatch[1].replace(/^#+\s*/, '').trim() : 'Mô phỏng hình học tương tác';

    // Trích xuất đáp số nếu có
    const dapSoMatch = text.match(/(?:Đáp số|Đáp án|Kết luận|Vậy)\s*[:=]?\s*([^\n]+)/i);
    const dapSo = dapSoMatch ? dapSoMatch[1].trim() : '';

    // Nếu có nhiều khối code theo từng bước
    if (mvMatches.length > 1) {
      const buoc = mvMatches.map((m, idx) => {
        // Trích xuất văn bản nằm ngay trước khối code này
        const prevEnd = idx === 0 ? 0 : mvMatches[idx - 1].index + mvMatches[idx - 1][0].length;
        const textBefore = text.slice(prevEnd, m.index).trim();
        const headingMatch = textBefore.match(/(?:^|\n)#{1,4}\s*(Bước\s*\d+[^:\n]*[:\s]*[^\n]*|[^\n]+)/i);
        const tieuDe = headingMatch ? headingMatch[1].replace(/^#{1,4}\s*/, '').trim() : `Bước ${idx + 1}: Dựng hình phần ${idx + 1}`;
        const giaiThich = textBefore.replace(/(?:^|\n)#{1,4}\s*[^\n]+/g, '').trim() || `Thực hiện dựng hình và tính toán ở bước ${idx + 1}`;

        return {
          buocSo: idx + 1,
          tieuDe,
          giaiThich,
          lenh: m[1].split('\n').map((l) => l.trim()).filter(Boolean),
        };
      });

      const allMvContent = mvMatches.map((m) => m[1]).join('\n');
      const { baChieu, heTruc, gocNhin } = detectDimensionAndAxes(allMvContent, text);

      return {
        lesson: sanitizeLesson({
          tieuDe,
          deBai: firstLines,
          baChieu,
          heTruc,
          gocNhin,
          buoc,
          dapSo,
          meo: 'Mẹo của Bé Elec: Bấm vào từng bước ở trên hoặc bấm "Tiếp theo" để xem từng nét dựng!',
        }),
        rawType: 'multi-block-mv',
      };
    }

    // Nếu chỉ có 1 khối code tổng hợp: tự động chia thành các bước logic
    const allCommands = mvMatches[0][1].split('\n').map((l) => l.trim()).filter(Boolean);
    const allMvContent = mvMatches[0][1];
    const { baChieu, heTruc, gocNhin } = detectDimensionAndAxes(allMvContent, text);

    const step1Commands = allCommands.filter((c) => /^[A-Z0-9_]+\s*=|\b(Point|Segment|Line)\b/i.test(c) && !/Pyramid|Prism|Sphere|Cone|Cylinder|Vector|Angle/i.test(c));
    const step2Commands = allCommands.filter((c) => /Pyramid|Prism|Sphere|Cone|Cylinder|Vector|Angle|style=dashed/i.test(c));
    const step3Commands = allCommands.filter((c) => !step1Commands.includes(c) && !step2Commands.includes(c));

    const buoc = [];
    if (step1Commands.length > 0) {
      buoc.push({
        buocSo: 1,
        tieuDe: !baChieu ? 'Bước 1: Thiết lập hệ quy chiếu & Tọa độ gốc' : 'Bước 1: Xác định tọa độ & Dựng mặt đáy',
        giaiThich: 'Xác định hệ trục tọa độ, các điểm và đoạn thẳng cơ sở ban đầu của bài toán.',
        lenh: step1Commands,
      });
    }
    if (step2Commands.length > 0) {
      buoc.push({
        buocSo: buoc.length + 1,
        tieuDe: !baChieu ? `Bước ${buoc.length + 1}: Dựng các Véctơ, Tia sáng & Cung góc` : `Bước ${buoc.length + 1}: Dựng khối không gian & Đường cao`,
        giaiThich: !baChieu ? 'Dựng các thành phần véctơ lực/điện áp hoặc đường truyền tia sáng và góc lệch.' : 'Dựng các cạnh bên, đỉnh và các đường khuất trong không gian 3D.',
        lenh: step2Commands,
      });
    }
    if (step3Commands.length > 0 || buoc.length === 0) {
      buoc.push({
        buocSo: buoc.length + 1,
        tieuDe: `Bước ${buoc.length + 1}: Đo đạc, kiểm định & Hoàn thiện hình vẽ`,
        giaiThich: 'Xác định các yếu tố cần tính toán (góc, khoảng cách, thiết diện) và kiểm định số đo.',
        lenh: step3Commands.length > 0 ? step3Commands : allCommands,
      });
    }

    return {
      lesson: sanitizeLesson({
        tieuDe,
        deBai: firstLines,
        baChieu,
        heTruc,
        gocNhin,
        buoc,
        dapSo,
        meo: 'Mẹo của Bé Elec: Bấm "▶ Tự động vẽ" để xem hệ thống dựng từng nét hình học!',
      }),
      rawType: 'single-block-mv',
    };
  }

  return null;
}

function cleanTitleString(raw) {
  let res = String(raw || '').replace(/^#+\s*/, '').trim();
  // Khử triệt để mọi tiền tố lặp như "Bước 3: Bước 3:" hoặc "Bước 3. Bước 3:"
  while (/^Bước\s*\d+[:.\s\-]*/i.test(res)) {
    res = res.replace(/^Bước\s*\d+[:.\s\-]*/i, '').trim();
  }
  // Loại bỏ các đoạn tọa độ thô ráp nếu có trong tiêu đề (ví dụ: A(-2,-2)...)
  res = res.replace(/:\s*[A-Za-z]\([^)]+\)[^.\n]*/, '').trim();
  return res;
}

function sanitizeLesson(lesson) {
  const baChieu = lesson.baChieu !== false;
  let heTruc = !!lesson.heTruc;

  // Lọc tiêu đề bài học cho trang nhã, đúng phong cách giáo dục chuẩn mực
  let tieuDe = cleanTitleString(lesson.tieuDe);
  if (!tieuDe || tieuDe.length < 3 || /^(Cho\s+|Tính\s+toạ\s+độ)/i.test(tieuDe)) {
    tieuDe = 'Mô phỏng: Hình chóp S.ABC & Thiết diện';
  }

  const rawSteps = Array.isArray(lesson.buoc) ? lesson.buoc : [];
  let buoc = rawSteps.map((b, idx) => {
    const cleanTitle = cleanTitleString(b.tieuDe) || `Dựng hình phần ${idx + 1}`;
    return {
      buocSo: b.buocSo || idx + 1,
      tieuDe: cleanTitle,
      giaiThich: b.giaiThich || b.ketQua || '',
      lenh: Array.isArray(b.lenh) ? b.lenh : Array.isArray(b.ve) ? b.ve : [],
    };
  });

  // Nếu là hình học không gian 3D, đảm bảo Bước 1 luôn có các đỉnh và cạnh cơ bản của hình chóp nền tảng
  if (baChieu && buoc.length > 0) {
    const step1Commands = buoc[0].lenh || [];
    const hasBaseApex = step1Commands.some((c) => /\bS\s*=/.test(c)) && step1Commands.some((c) => /\bA\s*=/.test(c));
    if (!hasBaseApex) {
      // Tìm xem các bước sau có khởi tạo hình chóp không
      const allLines = buoc.flatMap((b) => b.lenh || []);
      const baseVertices = allLines.filter((c) => /^[SABC]\s*=\s*\(/i.test(c.trim()));
      const baseEdges = allLines.filter((c) => /^Segment\s*\(\s*[SABC]\s*,\s*[SABC]\s*\)/i.test(c.trim()));

      if (baseVertices.length >= 3) {
        // Gom các đỉnh và cạnh nền tảng đưa lên Bước 1
        const missingLines = [...baseVertices, ...baseEdges].filter((l) => !step1Commands.includes(l));
        buoc[0].lenh = [...missingLines, ...step1Commands];
      } else {
        // Sử dụng tọa độ phối cảnh chuẩn SGK Hình 11 (khớp 100% Ảnh 2 SGK)
        const canonicalBase = [
          'A = (-3.2, 0, 0)',
          'C = (3.5, 0, 0)',
          'B = (-0.6, -2.6, 0)',
          'S = (0.2, 0.4, 5.0)',
          'Segment(A, C) | style=dashed | color=white',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(S, A)',
          'Segment(S, B)',
          'Segment(S, C)',
        ];
        const missingLines = canonicalBase.filter((l) => !step1Commands.some((c) => c.includes(l.split('=')[0]?.trim() || 'XYZ')));
        buoc[0].lenh = [...missingLines, ...step1Commands];
      }
    }
  }

  return {
    id: lesson.id || 'ai-gen-' + Date.now(),
    tieuDe,
    deBai: lesson.deBai || '',
    mon: lesson.mon || 'toan',
    lop: lesson.lop || 11,
    baChieu,
    heTruc,
    gocNhin: lesson.gocNhin || (baChieu ? [-1.22, 0.36, 1.0] : [0, 0, 1.0]),
    buoc,
    dapSo: lesson.dapSo || '',
    meo: lesson.meo || 'Mẹo của Bé Elec: Kéo chuột để xoay hình 3D 360° quan sát rõ các cạnh khuất nét đứt!',
  };
}
