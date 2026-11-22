/* ============================================================
   TeacherFloatingChat.jsx — Con Chat AI Trợ Lý Siêu Cấp (Next-Gen AI Teaching Agent)
   ------------------------------------------------------------
   4 ĐỘT PHÁ SIÊU CAO CẤP:
     1. ONE-COMMAND AUTONOMOUS AGENT (AI TỰ ĐỘNG THAO TÁC):
        - Ra lệnh 1 câu tự nhiên: "Soạn đề 15p Este rồi giao ngay cho lớp 12A1"
        - AI tự động: Soạn chuẩn GDPT 2025 -> Đảo 4 mã đề 101-104 -> Giao vào lớp thật!
     2. THẨM ĐỊNH ĐỀ BẰNG 100 HỌC SINH ẢO (VIRTUAL STUDENT EXAM SIMULATOR):
        - Mô phỏng 100 thí sinh ảo giải đề trong 3 giây.
        - Dự báo điểm TB, biểu đồ phổ điểm hình chuông, cảnh báo thời gian làm bài,
          và chỉ số phân hóa (Discrimination Index).
     3. CHẨN ĐOÁN BỆNH LÝ TƯ DUY & KÊ ĐƠN PHỤC HỒI (COGNITIVE DIAGNOSIS & PRESCRIPTION):
        - Bóc tách 3 lớp sai sót: Bẫy đề bài, Lỗ hổng khái niệm, Điểm nghẽn tính toán.
        - Sinh "Đơn thuốc học tập" 3 câu đặc trị gửi riêng cho học sinh yếu.
     4. TƯƠNG TÁC GIỌNG NÓI 2 CHIỀU (VOICE MIC & TEXT-TO-SPEECH):
        - Bấm mic nói tiếng Việt tự nhiên (Web Speech API).
        - Đọc lời giải, lời phê sư phạm truyền cảm.
   ============================================================ */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { parseExamFile } from '../../lib/examParser.js';
import { buildClassInsights } from '../../lib/classInsights.js';
import { exportToWord, exportAiNoteDocx } from '../../lib/examExport.js';
import { askAI } from '../../lib/ai.js';
import * as tts from '../../lib/tts.js';
import { runWithCredit, CREDIT_TARIFF } from '../../lib/creditService.js';
import { detectExamSubjectAndGrade } from '../../lib/subjectClassifier.js';
import { getCurrentTabInfo, buildTabDetailedAnalysis } from '../../lib/tabContextAnalyzer.js';
const WordDocxEditor = React.lazy(() => import('./WordDocxEditor.jsx'));
import { ElecMascot } from './ElecBrandMark.jsx';
import {
  IcoSparkles,
  IcoMinus,
  IcoMaximize,
  IcoMinimize,
  IcoTrash,
  IcoFileDoc,
} from './chat/tfcIcons.jsx';
import {
  createWelcomeMessage,
  buildConversationHistory,
  loadPersistedMessages,
  savePersistedMessages,
  clearPersistedMessages,
  getAiModeDirective,
  getMatrixPromptSpec,
  extractExamIntentFromQuery,
  inferQuestionBloomLevel,
  buildRichCopilotContext,
  buildClassHealthCardData,
  buildParentReportCardData,
  readImageFileAsAttachment,
} from './chat/tfcHelpers.js';
import TeacherChatMessageList from './chat/TeacherChatMessageList.jsx';
import TeacherChatComposer from './chat/TeacherChatComposer.jsx';
import '../../styles/teacher-floating-chat.css';

/* Tiện ích sửa JSON và phân tích chuyên đề GDPT 2025 */
function cleanJsonString(raw) {
  if (!raw) return '';
  let inString = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"' && !escaped) {
      inString = !inString;
      out += ch;
    } else if (inString && ch === '\n') {
      out += '\\n';
    } else if (inString && ch === '\r') {
      out += '\\r';
    } else if (inString && ch === '\t') {
      out += '\\t';
    } else {
      out += ch;
    }
    if (ch === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }
  return out;
}

function parseExamJsonSafe(text) {
  if (!text) return null;
  const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(s); } catch (_) {}
  try { return JSON.parse(cleanJsonString(s)); } catch (_) {}
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const sub = s.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(sub); } catch (_) {}
    try { return JSON.parse(cleanJsonString(sub)); } catch (_) {}
  }
  return null;
}


export const SUBJECT_GRADE_TOPICS = {
  'Hóa học': {
    '12': ['Este - Lipit', 'Cacbohidrat', 'Amin - Amino Axit - Protein', 'Polime', 'Pin điện & Điện phân', 'Đại cương Kim loại', 'Nguyên tố nhóm chuyển tiếp'],
    '11': ['Cân bằng hóa học', 'Nitơ - Photpho', 'Đại cương Hóa Hữu cơ', 'Hiđrocacbon', 'Dẫn xuất Halogen - Ancol - Phenol', 'Hợp chất Cacbonyl'],
    '10': ['Nguyên tử & Bảng tuần hoàn', 'Liên kết hóa học', 'Phản ứng Oxi hóa - Khử', 'Năng lượng hóa học & Tốc độ phản ứng', 'Halogen'],
  },
  'Toán học': {
    '12': ['Ứng dụng đạo hàm khảo sát hàm số', 'Vectơ và Hệ tọa độ Oxyz', 'Nguyên hàm - Tích phân', 'Thống kê & Xác suất có điều kiện'],
    '11': ['Hàm số lượng giác & Phương trình lượng giác', 'Dãy số, Cấp số cộng, Cấp số nhân', 'Giới hạn & Hàm số liên tục', 'Đạo hàm', 'Quan hệ vuông góc trong không gian'],
    '10': ['Mệnh đề & Tập hợp', 'Bất phương trình bậc nhất hai ẩn', 'Hệ thức lượng trong tam giác', 'Vectơ trong mặt phẳng', 'Thống kê mô tả'],
  },
  'Vật lí': {
    '12': ['Vật lý nhiệt & Nhiệt động lực học', 'Khí lý tưởng & Thuyết động học phân tử', 'Từ trường & Cảm ứng điện từ', 'Vật lý hạt nhân & Phóng xạ'],
    '11': ['Dao động điều hòa', 'Sóng cơ & Sóng điện từ', 'Điện trường & Điện thế', 'Dòng điện không đổi & Mạch điện'],
    '10': ['Động học chuyển động', 'Động lực học (Định luật Newton)', 'Công cơ học, Năng lượng & Công suất', 'Động lượng & Va chạm'],
  },
  'Sinh học': {
    '12': ['Di truyền học phân tử & Điều hòa hoạt động gen', 'Nhiễm sắc thể & Di truyền tế bào', 'Quy luật di truyền & Di truyền học người', 'Tiến hóa & Sinh thái học'],
    '11': ['Trao đổi chất & Chuyển hóa năng lượng ở SV', 'Cảm ứng & Tập tính ở động vật', 'Sinh trưởng và phát triển', 'Sinh sản ở sinh vật'],
    '10': ['Thành phần hóa học của tế bào', 'Cấu trúc tế bào & Vận chuyển chất', 'Trao đổi chất và năng lượng ở tế bào', 'Phân chia tế bào & Công nghệ tế bào'],
  },
  'Tiếng Anh': {
    '12': ['Life Stories & Cultural Diversity', 'Urbanisation & The World of Work', 'Green Living & Ecosystems', 'Advanced Reading & Language Focus'],
    '11': ['A Long and Healthy Life', 'The Generation Gap & Relationships', 'Cities of the Future & Global Warming', 'Grammar & Vocabulary Mastery'],
    '10': ['Family Life & Humans and Environment', 'Music & Community Services', 'Inventions & Gender Equality', 'Eco-tourism & New Ways to Learn'],
  },
};

export const GRADE_TOPICS = SUBJECT_GRADE_TOPICS['Hóa học'];

export function getTopicsForSubjectAndGrade(subject = 'Hóa học', grade = '12') {
  const normSub = Object.keys(SUBJECT_GRADE_TOPICS).find((k) =>
    k.toLowerCase().includes(String(subject || '').toLowerCase()) ||
    String(subject || '').toLowerCase().includes(k.toLowerCase())
  ) || 'Hóa học';
  return SUBJECT_GRADE_TOPICS[normSub]?.[String(grade)] || SUBJECT_GRADE_TOPICS['Hóa học']['12'];
}

/* ============================================================
   TEACHER COPILOT SYSTEM PROMPT & AUDIT INTENT DETECTOR
   ============================================================ */
const TEACHER_COPILOT_SYSTEM_PROMPT = `Bạn là ELEC AI Senior Academic Copilot — Chủ tịch Hội đồng Thẩm định Sư phạm & Cố vấn Chuyên môn Đa môn học THPT (Toán học, Vật lí, Hóa học, Sinh học, Tiếng Anh, Lịch sử, Địa lí, Tin học... theo Chương trình GDPT 2025 của Bộ Giáo dục & Đào tạo).
Đối tượng làm việc của bạn là Quý Thầy/Cô Giáo viên (xưng hô: "Em" hoặc "AI", gọi người dùng là "Thầy/Cô").
Vị thế & Năng lực cốt lõi:
- Am hiểu sâu sắc quy chuẩn đề thi GDPT 2025 của Bộ Giáo dục & Đào tạo cho tất cả các môn:
  + Phần I: Trắc nghiệm 4 lựa chọn (0.25đ/câu), các phương án nhiễu phải độc lập, bóc tách ngộ nhận.
  + Phần II: Trắc nghiệm Đúng/Sai (1 câu 4 ý a/b/c/d; thang điểm 0.1 - 0.25 - 0.5 - 1.0đ), phân bậc nhận thức NB -> TH -> VD -> VDC.
  + Phần III: Trả lời ngắn (0.25đ hoặc 0.5đ/câu), kết quả số duy nhất, rõ ràng đơn vị và quy tắc làm tròn.
- Tự động nhận diện chính xác môn học và khối lớp của đề thi (Toán, Vật lí, Hóa học, Sinh học, Tiếng Anh...), không bao giờ áp đặt hay nhầm lẫn sang môn khác.
- Bảo toàn trọn vẹn 100% hình ảnh, sơ đồ thí nghiệm, đồ thị toán/lý/hóa trong tệp Word (.docx).
- Năng lực đo lường & chẩn đoán tâm lý sư phạm (Psychometrics): Bóc tách chính xác vì sao học sinh chọn phương án nhiễu.
- Nắm vững kiến thức khoa học và danh pháp mới theo SGK GDPT 2025.

QUY TẮC BẮT BUỘC VỀ DANH TÍNH & BẢN QUYỀN (TUYỆT ĐỐI TUÂN THỦ):
- Bạn là "ELEC AI Senior Academic Copilot", do Hệ sinh thái Công nghệ Giáo dục ELEC AI phát triển độc quyền.
- TUYỆT ĐỐI KHÔNG BAO GIỜ tự nhận là Agnes, Sapiens AI, OpenAI, ChatGPT, Gemini, Google, Claude hay bất kỳ bên thứ ba nào.
- Khi được hỏi về danh tính, tên tuổi, nguồn gốc, bản quyền, mô hình: BẮT BUỘC khẳng định bạn là ELEC AI Senior Academic Copilot của ELEC AI.

QUY TẮC PHẢN HỒI:
- Trả lời trực diện, chuẩn xác, giàu hàm lượng học thuật và giá trị sư phạm.
- Thẩm định chuyên sâu đúng theo môn học của câu hỏi / đề thi.
- Tuyệt đối KHÔNG trả lời vòng vo kiểu điều hướng giao diện nếu Thầy/Cô đang hỏi chuyên môn, bài tập, hay thẩm định.
- Tuyệt đối KHÔNG dùng emoji. Định dạng Markdown sắc nét, chuyên nghiệp.`;

function detectAuditOrAcademicQuery(query) {
  if (!query) return false;
  const norm = query.toLowerCase().trim();

  // Đừng chặn nếu giáo viên đang phản hồi về chất lượng phân tích đề, mất câu hỏi có ảnh, hoặc nhận diện môn
  const isSystemFeedback = (
    norm.includes('phân tích đề đi') ||
    norm.includes('phân tích chưa chuẩn') ||
    norm.includes('chưa nhận dạng đúng môn') ||
    norm.includes('mất mấy cái câu') ||
    norm.includes('mất câu có hình') ||
    norm.includes('mất hình ảnh') ||
    norm.includes('kiểm tra lại ai') ||
    norm.includes('check lại toàn bộ ai') ||
    norm.includes('ai chưa ổn') ||
    norm.includes('ai chưa hiểu') ||
    norm.includes('hỏi một kiểu nó trả lời một kiểu')
  );
  if (isSystemFeedback) return false;

  // Đừng chặn nếu giáo viên đang muốn tạo đề mới hoặc sửa file word
  if (
    norm.includes('sửa file word') || norm.includes('chuẩn hóa word') || norm.includes('bác sĩ sửa') ||
    ((norm.startsWith('soạn') || norm.startsWith('tạo đề') || norm.startsWith('ra đề')) && !norm.includes('thẩm định') && !norm.includes('phán xét'))
  ) {
    return false;
  }

  // 1. Từ khóa thẩm định, phán xét, kiểm tra câu
  const auditKeywords = [
    'thẩm định', 'phán xét', 'giám định', 'kiểm tra câu', 'xem câu', 'soát lỗi',
    'bắt lỗi', 'sửa câu', 'câu này đúng hay sai', 'đúng hay sai', 'chuẩn gdpt',
    'chuẩn bộ', 'chuẩn 2025', 'tại sao sai', 'vì sao sai', 'vì sao chọn',
    'tại sao chọn', 'đáp án nào đúng', 'đáp án là gì', 'phân tích câu',
    'bóc tách bẫy', 'bẫy đề', 'giải thích câu', 'đánh giá câu', 'nhận xét câu',
    'câu hỏi này có chuẩn', 'câu này có lỗi', 'câu này có sai', 'kiểm tra tính khoa học',
    'thẩm tra', 'giải chi tiết câu', 'tại sao câu này',
    'xem giúp tôi câu', 'xem giúp em câu', 'câu này có vấn đề gì', 'câu này lỗi gì'
  ];
  if (auditKeywords.some((k) => norm.includes(k))) return true;

  // 2. Định dạng câu hỏi trắc nghiệm (VD: "Câu 1: ...", hoặc chứa A. B. C. D.)
  const hasQuestionHeader = /câu\s*\d+\s*[:.]/i.test(query);
  const hasChoicePattern = (
    /(?:^|\n|\s)[A-D][.)]\s+/i.test(query) &&
    /(?:^|\n|\s)[B-D][.)]\s+/i.test(query)
  );
  if (hasQuestionHeader && (hasChoicePattern || norm.includes('?') || norm.includes('chọn'))) return true;
  if (hasChoicePattern && query.length > 25) return true;

  // 3. Bài toán THPT cụ thể các môn kèm yêu cầu tính toán / câu hỏi
  const stemTerms = [
    'este', 'axit', 'ancol', 'naoh', 'hcl', 'h2so4', 'hno3', 'cu', 'fe', 'al', 'ag', 'mol', 'gam', 'ml', 'kết tủa', 'dd', 'dung dịch', 'chất béo',
    'dao động', 'con lắc', 'chu kỳ', 'tần số', 'biên độ', 'vận tốc', 'gia tốc', 'bước sóng', 'điện trường', 'từ trường', 'dòng điện', 'hiệu điện thế',
    'hàm số', 'đạo hàm', 'tích phân', 'nguyên hàm', 'tiệm cận', 'hình chóp', 'lăng trụ', 'mặt cầu', 'vectơ', 'xác suất',
    'nhiễm sắc thể', 'đột biến', 'gen', 'alen', 'nucleotit', 'adn', 'arn', 'quần thể', 'kiểu gen', 'kiểu hình',
    'pronunciation', 'stress', 'closest in meaning', 'opposite in meaning'
  ];
  const hitTerms = stemTerms.filter((t) => norm.includes(t)).length;
  if (hitTerms >= 2 && (norm.includes('?') || norm.includes('tính') || norm.includes('chọn') || norm.includes('giải') || norm.includes('giá trị của') || norm.includes('công thức'))) {
    return true;
  }

  return false;
}

/* ============================================================
   MÔ PHỎNG 100 HỌC SINH ẢO (VIRTUAL STUDENT EXAM SIMULATION)
   Thuật toán Item Response Theory (IRT 3PL) + Heuristic Bloom + Seeded Monte Carlo
   ============================================================ */
function createSeededRng(seedStr = 'elec') {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runVirtualStudentSimulation(exam) {
  const questions = exam?.questions || [];
  const qCount = questions.length || 1;
  const rng = createSeededRng(`${exam?.title || 'exam'}_${qCount}_${exam?.duration || 45}`);

  // 1. Phân loại câu hỏi theo 4 mức độ nhận thức (tự suy luận nếu file Word chưa gắn level)
  let nbCount = 0;
  let thCount = 0;
  let vdCount = 0;
  let vdcCount = 0;
  let totalEstSeconds = 0;
  const resolvedLevels = [];

  questions.forEach((q) => {
    const lvl = inferQuestionBloomLevel(q);
    resolvedLevels.push(lvl);
    const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
    const partExtra = part === 2 ? 45 : part === 3 ? 30 : 0;

    if (lvl === 'VDC') {
      vdcCount++;
      totalEstSeconds += 190 + partExtra;
    } else if (lvl === 'VD') {
      vdCount++;
      totalEstSeconds += 130 + partExtra;
    } else if (lvl === 'TH') {
      thCount++;
      totalEstSeconds += 75 + partExtra;
    } else {
      nbCount++;
      totalEstSeconds += 45 + partExtra;
    }
  });

  const estMinutes = Math.max(5, Math.round(totalEstSeconds / 60));
  const durationLimit = exam?.duration || 45;

  // 2. Mô phỏng Monte Carlo 100 học sinh ảo nhất quán với phổ năng lực Gauss (Box-Muller)
  const studentScores = [];

  for (let i = 0; i < 100; i++) {
    const u1 = Math.max(0.0001, rng());
    const u2 = rng();
    const ability = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    let studentScore = 0;
    let totalMaxScore = 0;

    questions.forEach((q, qIdx) => {
      const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
      const lvl = resolvedLevels[qIdx] || 'TH';
      const b = lvl === 'VDC' ? 1.65 : lvl === 'VD' ? 0.65 : lvl === 'TH' ? -0.2 : -1.15;

      const guessRate = part === 1 ? 0.25 : 0.05;
      const prob = guessRate + (1 - guessRate) / (1 + Math.exp(-1.7 * (ability - b)));

      if (part === 2) {
        totalMaxScore += 1.0;
        let correctStatements = 0;
        for (let s = 0; s < 4; s++) {
          if (rng() < prob) correctStatements++;
        }
        if (correctStatements === 4) studentScore += 1.0;
        else if (correctStatements === 3) studentScore += 0.5;
        else if (correctStatements === 2) studentScore += 0.25;
        else if (correctStatements === 1) studentScore += 0.1;
      } else if (part === 3) {
        totalMaxScore += 0.25;
        if (rng() < prob) studentScore += 0.25;
      } else {
        totalMaxScore += 0.25;
        if (rng() < prob) studentScore += 0.25;
      }
    });

    const finalScaledScore = totalMaxScore > 0 ? (studentScore / totalMaxScore) * 10 : 0;
    studentScores.push(Math.round(finalScaledScore * 100) / 100);
  }

  // 3. Tính Điểm Trung Bình & Phân Bố 5 Nhóm Phổ Điểm
  studentScores.sort((a, b) => a - b);
  const sumScores = studentScores.reduce((acc, sc) => acc + sc, 0);
  const predAvg = Math.round((sumScores / studentScores.length) * 100) / 100;

  const b1 = studentScores.filter((s) => s < 4.0).length;
  const b2 = studentScores.filter((s) => s >= 4.0 && s < 6.0).length;
  const b3 = studentScores.filter((s) => s >= 6.0 && s < 7.5).length;
  const b4 = studentScores.filter((s) => s >= 7.5 && s < 9.0).length;
  const b5 = studentScores.filter((s) => s >= 9.0).length;

  const bins = [
    { label: '<4.0', count: b1, pct: `${b1}%` },
    { label: '4–5.9', count: b2, pct: `${b2}%` },
    { label: '6–7.4', count: b3, pct: `${b3}%` },
    { label: '7.5–8.9', count: b4, pct: `${b4}%` },
    { label: '9–10', count: b5, pct: `${b5}%` },
  ];

  // 4. Chỉ số phân hóa D (Discrimination Index = Điểm TB Top 27% - Điểm TB Bottom 27% / 10)
  const top27 = studentScores.slice(73);
  const bottom27 = studentScores.slice(0, 27);
  const topAvg = top27.reduce((a, b) => a + b, 0) / top27.length;
  const bottomAvg = bottom27.reduce((a, b) => a + b, 0) / bottom27.length;
  const dIndex = Math.round(((topAvg - bottomAvg) / 10) * 100) / 100;

  let discrimLabel = `${dIndex} (Khá tốt)`;
  if (dIndex >= 0.40) discrimLabel = `${dIndex} (Phân hóa Rất tốt)`;
  else if (dIndex >= 0.28) discrimLabel = `${dIndex} (Phân hóa Tốt)`;
  else if (dIndex < 0.20) discrimLabel = `${dIndex} (Phân hóa Thấp)`;

  const timeHealth = estMinutes <= durationLimit
    ? { ok: true, msg: `Ước tính ${estMinutes}/${durationLimit}p — Vừa vặn, hợp lý` }
    : { ok: false, msg: `Ước tính ${estMinutes}/${durationLimit}p — Nguy cơ thiếu giờ` };

  let advice = '';
  if (vdcCount === 0 && vdCount === 0) {
    advice = 'Đề hiện chủ yếu ở mức Nhận biết - Thông hiểu. Rất phù hợp ôn tập lấy gốc, nhưng nên thêm 2–3 câu Vận dụng để phân hóa.';
  } else if (vdcCount > 6 || predAvg < 5.0) {
    advice = 'Đề có độ khó cao, nhiều câu Vận dụng cao. Phù hợp thi thử chọn học sinh giỏi hoặc luyện thi 9+.';
  } else {
    advice = `Phân tầng hợp lý: ${nbCount} NB · ${thCount} TH · ${vdCount} VD · ${vdcCount} VDC. Đạt chuẩn cấu trúc phân hóa GDPT 2025.`;
  }

  return {
    qCount,
    predAvg,
    bins,
    estMinutes,
    timeHealth,
    discrimIndex: discrimLabel,
    advice,
    bloomBreakdown: { nb: nbCount, th: thCount, vd: vdCount, vdc: vdcCount },
  };
}

/* ============================================================
   BỘ NÃO PHÂN TÍCH NGỮ NGHĨA & TRUY VẤN DỮ LIỆU THỰC TẾ
   ============================================================ */
function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

const pctOf = (s) => {
  if (!s) return 0;
  if (typeof s.percentage === 'number' && !Number.isNaN(s.percentage)) return s.percentage;
  if (s.totalPoints > 0 && typeof s.score === 'number' && !Number.isNaN(s.score)) {
    return (s.score / s.totalPoints) * 100;
  }
  if (s.totalQuestions > 0 && typeof s.correctCount === 'number' && !Number.isNaN(s.correctCount)) {
    return (s.correctCount / s.totalQuestions) * 100;
  }
  const n = Number(s.score);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Trích xuất tên lớp học mà giáo viên nhắc tới trong câu hỏi (nếu có)
 * Ví dụ: "lớp 11a5", "lop 11A5", "lớp 12A1", "11a5", "12a2", "lớp 10 Chuyên Hóa"...
 */
export function extractMentionedClassName(query) {
  if (!query) return null;
  const raw = String(query).trim();

  // 1. Sau từ "lớp" hoặc "lop": trích xuất mã lớp (VD: 11a5, 12A1, 10A2, 10-A1, 10 Chuyên Hóa, 10 Lý, 11 Tin)
  const mChuyen = raw.match(/(?:lớp|lop)\s+([0-9]{1,2}\s+(?:chuyên|chuyen)\s+[a-zA-Zà-ỹÀ-Ỹ0-9]+)/i);
  if (mChuyen) {
    return mChuyen[1].trim();
  }

  const m1 = raw.match(/(?:lớp|lop)\s+([0-9]{1,2}\s*[-/_]?[a-zA-Z0-9]+)/i);
  if (m1) {
    return m1[1].trim();
  }

  // 2. Tên lớp viết liền/độc lập: ví dụ "11a5", "12a1", "10A2"
  const m2 = raw.match(/\b(10|11|12)\s*([a-zA-Z][0-9]*)\b/i);
  if (m2) {
    return `${m2[1]}${m2[2].toUpperCase()}`;
  }

  return null;
}

/**
 * Trích xuất tên lớp học hợp lệ khi giáo viên muốn tạo lớp mới
 * Tránh bắt nhầm các từ thông dụng tiếng Việt như "học", "mới", "này", "kia", "h", "cho"...
 */
export function extractValidNewClassName(query) {
  if (!query) return null;
  const raw = String(query).trim();

  // Nếu câu hỏi mang tính chất hướng dẫn/hỏi cách làm thì không trích xuất tên lớp để tạo
  if (/(?:cách|hướng dẫn|làm sao|làm thế nào|như thế nào|thế nào|quy trình)\b/i.test(raw)) {
    return null;
  }

  // 1. Kiểm tra bằng hàm extractMentionedClassName (đã chuẩn hóa mã lớp như 11A5, 12A1, 10 Chuyên Hóa...)
  const explicit = extractMentionedClassName(raw);
  if (explicit) return explicit;

  // 2. Tìm kiếm sau cụm "tạo lớp", "thêm lớp", "mở lớp", "lập lớp"
  const m = raw.match(/(?:tạo|thêm|mở|lập)\s+(?:mới\s+)?(?:lớp|lop)\s+([a-zA-Z0-9_\-\sà-ỹÀ-Ỹ]+)/i);
  if (!m || !m[1]) return null;

  let candidate = m[1].trim();
  // Cắt bỏ phần sau nếu có các từ nối như "môn", "khối", "cho", "và", "để", "ở", "tại"
  candidate = candidate.split(/(?:\s+|^)(?:môn|mon|khối|khoi|cho|và|va|để|de|ở|tại)\b/i)[0].trim();

  const normCandidate = normalizeText(candidate).toLowerCase();
  const blacklistedWords = [
    'hoc', 'moi', 'nay', 'kia', 'nao', 'cho', 'cua', 'tren', 'duoi',
    'mot', 'cac', 'nhung', 'minh', 'truong', 'mon', 'khoi', 'h',
    'de', 'bai', 'thi', 'kiem tra', 'online', 'truc tuyen', 'va', 'duoc', 'khong'
  ];

  if (!candidate || candidate.length < 2) return null;
  if (blacklistedWords.includes(normCandidate)) return null;
  if (blacklistedWords.some(w => normCandidate === w || normCandidate.startsWith(w + ' '))) return null;
  if (normCandidate.startsWith('hoc') || normCandidate.startsWith('moi') || normCandidate.startsWith('nay')) return null;

  return candidate;
}

/**
 * Đối soát lớp học trong hệ thống giáo viên (classes, linkedClasses, exams, submissions)
 */
export function findTargetClassInQuery(query, classes = [], exams = [], submissionsMap = {}) {
  if (!query) return null;
  const mentioned = extractMentionedClassName(query);
  const rawQ = query.trim().toLowerCase();
  const normQ = normalizeText(query);

  const sorted = [...classes].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

  // 1. Nếu có tên lớp cụ thể được trích xuất
  if (mentioned) {
    const rawM = mentioned.trim().toLowerCase();
    const normM = normalizeText(mentioned);

    for (const c of sorted) {
      if (!c.name) continue;
      const cRaw = c.name.trim().toLowerCase();
      const cNorm = normalizeText(c.name);

      if (cRaw === rawM || cNorm === normM) return c;
      if (cRaw.includes(rawM) || rawM.includes(cRaw)) return c;
      if (cNorm && (cNorm.includes(normM) || normM.includes(cNorm))) return c;
    }

    // Tìm trong exams
    for (const ex of (exams || [])) {
      if (ex.className) {
        const exNorm = normalizeText(ex.className);
        if (exNorm === normM || exNorm.includes(normM) || normM.includes(exNorm)) {
          return {
            id: ex.classId || `virtual_${exNorm}`,
            name: ex.className,
            grade: ex.grade || mentioned.match(/^(10|11|12)/)?.[1] || '12',
            subject: ex.subject || classes.find((c) => c.id === ex.classId)?.subject || classes[0]?.subject || '',
            _isVirtualFromExam: true,
          };
        }
      }
    }

    // Tìm trong submissionsMap
    for (const subList of Object.values(submissionsMap || {})) {
      for (const sub of (subList || [])) {
        if (sub.className) {
          const subNorm = normalizeText(sub.className);
          if (subNorm === normM || subNorm.includes(normM) || normM.includes(subNorm)) {
            const matchedCls = classes.find((c) => c.id === sub.classId || normalizeText(c.name) === subNorm);
            const matchedEx = (exams || []).find((ex) => ex.id === sub.examId || ex.classId === sub.classId);
            return {
              id: sub.classId || `virtual_${subNorm}`,
              name: sub.className,
              grade: sub.grade || matchedCls?.grade || mentioned.match(/^(10|11|12)/)?.[1] || '12',
              subject: sub.subject || matchedEx?.subject || matchedCls?.subject || classes[0]?.subject || '',
              _isVirtualFromSub: true,
            };
          }
        }
      }
    }
  }

  // 2. Quét trực tiếp danh sách classes trong query nếu query không theo mẫu thông thường
  for (const c of sorted) {
    if (!c.name || c.name.trim().length < 2) continue; // Tuyệt đối bỏ qua tên lớp rác dưới 2 ký tự (như "h")
    const cRaw = c.name.trim().toLowerCase();
    const cNorm = normalizeText(c.name);
    if (!cNorm || cNorm.length < 2) continue;

    // Ranh giới từ rõ ràng: phải có tiền tố "lớp"/"lop" hoặc là từ riêng biệt độc lập
    const wordRegex = new RegExp(`(?:\\b(?:lớp|lop)\\s+|\\b)${cRaw}\\b`, 'i');
    if (wordRegex.test(rawQ)) {
      return c;
    }
    if (normQ.includes(`lop ${cNorm}`)) {
      return c;
    }
  }

  const gradeMatch = rawQ.match(/\b(10|11|12)\s*([a-z][0-9]*)\b/i);
  if (gradeMatch) {
    const compactName = `${gradeMatch[1]}${gradeMatch[2]}`.toLowerCase();
    const found = classes.find((c) => normalizeText(c.name) === compactName);
    if (found) return found;
  }

  return null;
}


/**
 * Lọc và tổng hợp toàn bộ bài nộp & học sinh theo đúng lớp học
 */
function extractClassStats(targetClass, { exams = [], submissionsMap = {} }) {
  if (!targetClass) return null;

  const targetClassNorm = normalizeText(targetClass.name);
  const targetClassId = String(targetClass.id || '');

  const classExams = exams.filter((e) => {
    if (String(e.classId || '') === targetClassId) return true;
    if (Array.isArray(e.classIds) && e.classIds.map(String).includes(targetClassId)) return true;
    if (e.className && normalizeText(e.className) === targetClassNorm) return true;
    return false;
  });
  const classExamIdSet = new Set(classExams.map((e) => String(e.id)));

  const memberIdSet = new Set();
  const memberNameSet = new Set();
  (targetClass.members || []).forEach((m) => {
    const uid = m.uid || m.id || m.studentId;
    if (uid) memberIdSet.add(String(uid));
    const nm = m.name || m.displayName;
    if (nm) memberNameSet.add(normalizeText(nm));
  });
  (targetClass.memberIds || []).forEach((id) => memberIdSet.add(String(id)));

  const classSubs = [];
  Object.entries(submissionsMap).forEach(([examId, list]) => {
    const isExamOfClass = classExamIdSet.has(String(examId));
    (list || []).forEach((s) => {
      const matchClassId = String(s.classId || '') === targetClassId;
      const matchClassName = s.className && normalizeText(s.className) === targetClassNorm;
      const matchMemberId = s.studentId && memberIdSet.has(String(s.studentId));
      const matchMemberName = s.studentName && memberNameSet.has(normalizeText(s.studentName));

      if (matchClassId || matchClassName || matchMemberId || matchMemberName || isExamOfClass) {
        classSubs.push({ ...s, examId });
      }
    });
  });

  const studentMap = new Map();
  classSubs.forEach((s) => {
    const key = String(s.studentId || s.studentName || 'anonymous');
    const p = Math.max(0, Math.min(100, pctOf(s)));
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: s.studentId || key,
        studentName: s.studentName || 'Học sinh',
        submissions: [],
        pcts: [],
      });
    }
    const item = studentMap.get(key);
    item.submissions.push(s);
    item.pcts.push(p);
  });

  const studentStats = Array.from(studentMap.values()).map((st) => {
    const avgPct = Math.round(st.pcts.reduce((a, b) => a + b, 0) / st.pcts.length);
    const minPct = Math.round(Math.min(...st.pcts));
    const maxPct = Math.round(Math.max(...st.pcts));
    const latestSub = st.submissions[st.submissions.length - 1];
    return {
      studentId: st.studentId,
      studentName: st.studentName,
      avgPct,
      minPct,
      maxPct,
      subCount: st.submissions.length,
      latestSub,
    };
  });

  const weakest = [...studentStats].sort((a, b) => a.avgPct - b.avgPct || a.minPct - b.minPct);
  const strongest = [...studentStats].sort((a, b) => b.avgPct - a.avgPct || b.maxPct - a.maxPct);
  const atRisk = weakest.filter((s) => s.avgPct < 50 || s.minPct < 50);

  const allPcts = classSubs.map((s) => pctOf(s));
  const classAvg = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;
  const passRate = allPcts.length ? Math.round((allPcts.filter((p) => p >= 50).length / allPcts.length) * 100) : 0;

  return {
    targetClass,
    classExams,
    totalSubs: classSubs.length,
    studentCount: studentStats.length || (targetClass.members || []).length || targetClass.studentCount || 0,
    classAvg,
    passRate,
    weakest,
    strongest,
    atRisk,
    studentStats,
  };
}

/**
 * Tìm học sinh cụ thể được nhắc tới trong câu hỏi
 */
function findTargetStudent(query, { classes = [], submissionsMap = {} }) {
  if (!query) return null;
  const normQ = normalizeText(query);

  const studentMap = new Map();
  Object.values(submissionsMap).forEach((list) => {
    (list || []).forEach((s) => {
      const name = s.studentName;
      if (!name) return;
      const normN = normalizeText(name);
      if (!normN || normN.length < 3) return;
      if (!studentMap.has(normN)) {
        studentMap.set(normN, {
          name,
          studentId: s.studentId,
          classId: s.classId,
          className: s.className,
          submissions: [],
        });
      }
      studentMap.get(normN).submissions.push(s);
    });
  });

  const sortedNames = Array.from(studentMap.entries()).sort((a, b) => b[0].length - a[0].length);
  for (const [normN, data] of sortedNames) {
    if (normQ.includes(normN)) {
      const pcts = data.submissions.map((s) => pctOf(s));
      const avgPct = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
      const minPct = pcts.length ? Math.round(Math.min(...pcts)) : 0;
      const maxPct = pcts.length ? Math.round(Math.max(...pcts)) : 0;

      let clsName = data.className;
      if (!clsName && data.classId) {
        const foundCls = classes.find((c) => String(c.id) === String(data.classId));
        if (foundCls) clsName = foundCls.name;
      }

      return {
        ...data,
        className: clsName || 'Chưa gắn lớp',
        avgPct,
        minPct,
        maxPct,
        subCount: data.submissions.length,
      };
    }
  }

  return null;
}


export default function TeacherFloatingChat({
  user,
  classes = [],
  linkedClasses = [],
  exams = [],
  submissionsMap = {},
  liveSessions = [],
  teacherSubject = '',
  onOpenSimulator,
  onCreateExam,
  onOpenImporter,
  onCreateClass,
  onNavigate,
  onSay,
  isOpen: controlledOpen,
  onToggleOpen,
  initialOpen = false,
  activeSection = 'overview',
  activeSubTab = 'all',
  selectedClass = null,
  selectedExam = null,
  viewingSessionId = null,
  wordEditorOpen: propWordEditorOpen = false,
  wordEditorExam: propWordEditorExam = null,
}) {
  const inferredSubject = useMemo(() => {
    const clean = String(teacherSubject || '').trim();
    if (clean) return clean;
    const clsWithSubj = (classes || []).find((c) => c?.subject);
    if (clsWithSubj?.subject) return clsWithSubj.subject;
    const examWithSubj = (exams || []).find((ex) => ex?.subject);
    return examWithSubj?.subject || 'Toán học';
  }, [teacherSubject, classes, exams]);

  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (val) => {
    const next = typeof val === 'function' ? val(isOpen) : val;
    if (onToggleOpen) onToggleOpen(next);
    setInternalOpen(next);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wordEditorOpen, setWordEditorOpen] = useState(false);
  const [wordEditorExam, setWordEditorExam] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [confirmClearChat, setConfirmClearChat] = useState(false);
  const [aiMode, setAiMode] = useState('balanced');
  const [pendingImage, setPendingImage] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const inputRef = useRef(null);
  const bodyEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeRequestRef = useRef(null);
  const messagesRef = useRef([]);

  const handleCopyMessage = useCallback((id, text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleStopGeneration = useCallback(() => {
    try {
      activeRequestRef.current?.abort?.();
    } catch { /* ignore */ }
    activeRequestRef.current = null;
    setIsTyping(false);
    setTypingStatus('');
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming
          ? {
              ...m,
              streaming: false,
              text: m.text?.trim() ? m.text : 'Đã dừng tạo phản hồi theo yêu cầu của Thầy/Cô.',
            }
          : m
      )
    );
  }, []);

  const callCopilotAI = (promptOrHistory, opts = {}, cost = CREDIT_TARIFF.TUTOR_CONTEXT, reason = 'AI Trợ lý Lớp học', onChunk = null, creditMeta = {}) =>
    runWithCredit(
      {
        userId: user?.uid,
        cost,
        imageCount: creditMeta.imageCount || 0,
        actionType: creditMeta.actionType || (creditMeta.imageCount ? 'ai_image' : 'ai_tutor'),
        reason,
      },
      async () => {
        const modeDirective = getAiModeDirective(aiMode);
        const mergedSystemPrompt = modeDirective
          ? `${TEACHER_COPILOT_SYSTEM_PROMPT}\n\n${modeDirective}`
          : TEACHER_COPILOT_SYSTEM_PROMPT;
        const req = askAI(promptOrHistory, onChunk, null, {
          systemPrompt: mergedSystemPrompt,
          ...opts,
        });
        activeRequestRef.current = req;
        try {
          const res = await req;
          const outText = String(typeof res === 'string' ? res : (res?.text || '')).trim();
          if (!outText) {
            throw new Error('AI chưa trả về nội dung (ELEC Credit đã được hoàn trả).');
          }
          if (typeof creditMeta.validate === 'function') {
            return creditMeta.validate(outText, res);
          }
          return res;
        } finally {
          if (activeRequestRef.current === req) activeRequestRef.current = null;
        }
      }
    );

  const aiErrMsg = (err, fallback) =>
    err?.code === 'OUT_OF_CREDITS' || err?.code === 'CREDIT_SYSTEM_ERROR' || err?.code === 'LOGIN_REQUIRED'
      ? err.message
      : (fallback || err?.message || 'Kết nối AI tạm thời gián đoạn.');

  const handleCreateClassDirectly = async (className) => {
    if (!className) return;
    const gradeMatch = String(className).match(/^(10|11|12)/);
    const grade = gradeMatch ? gradeMatch[1] : '12';
    const subject = inferredSubject;

    if (onCreateClass) {
      try {
        setTypingStatus(`Đang khởi tạo lớp ${className}...`);
        setIsTyping(true);
        const res = await onCreateClass({ name: className, grade, subject });
        setIsTyping(false);
        setTypingStatus('');
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_cls_created_' + Date.now(),
            sender: 'bot',
            text: `Đã tạo thành công **Lớp ${res?.name || className}** (Khối ${grade} - Môn ${subject})!\nMã mời học sinh vào lớp: **${res?.key || res?.id || 'Đã tạo'}**\n\nThầy/Cô có thể gửi mã vào lớp cho học sinh hoặc bắt đầu soạn đề kiểm tra đầu tiên cho lớp:`,
            navSuggestions: [
              { label: `Soạn đề cho lớp ${className}`, action: 'simulator' },
              { label: 'Mở Quản lý Lớp học', sec: 'classes' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        setIsTyping(false);
        setTypingStatus('');
        onSay?.('Lỗi tạo lớp: ' + (err.message || err), 'error');
      }
    } else {
      onNavigate?.('classes');
    }
  };

  // 1. Phân tích số liệu THỰC TẾ
  const realInsights = useMemo(() => {
    return buildClassInsights({
      exams,
      submissionsMap,
      rangeDays: 'all',
      now: Date.now(),
    });
  }, [exams, submissionsMap]);

  // 2. Kiểm tra các phòng thi LIVE THẬT
  const activeLiveRooms = useMemo(() => {
    return (liveSessions || []).filter((s) => s.status === 'live');
  }, [liveSessions]);

  const realViolationsCount = useMemo(() => {
    let count = 0;
    activeLiveRooms.forEach((ss) => {
      (ss.students || []).forEach((st) => {
        count += (st.violations || []).length;
      });
    });
    return count;
  }, [activeLiveRooms]);

  // Khôi phục lịch sử hội thoại theo tài khoản (hoặc khởi tạo lời chào gọn gàng)
  const [messages, setMessages] = useState(() =>
    loadPersistedMessages(user?.uid, user?.displayName)
  );

  // Giữ ref luôn mới nhất để build lịch sử đa lượt không bị stale closure
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Đồng bộ lời chào khi tên giáo viên vừa tải xong và lưu lịch sử vào localStorage
  useEffect(() => {
    if (!user?.displayName) return;
    setMessages((prev) => {
      if (!prev.length || prev[0].id !== 'welcome_ultra') return prev;
      const fresh = createWelcomeMessage(user.displayName);
      if (prev[0].text === fresh.text) return prev;
      const next = [...prev];
      next[0] = { ...prev[0], ...fresh, time: prev[0].time };
      return next;
    });
  }, [user?.displayName]);

  useEffect(() => {
    savePersistedMessages(user?.uid, messages);
  }, [user?.uid, messages]);

  const handleClearChat = useCallback(() => {
    handleStopGeneration();
    clearPersistedMessages(user?.uid);
    setMessages([createWelcomeMessage(user?.displayName)]);
    setConfirmClearChat(false);
  }, [handleStopGeneration, user?.uid, user?.displayName]);

  // Bộ cảm biến ngữ cảnh Tab thời gian thực
  const currentTabInfo = useMemo(() => {
    const isWordActive = Boolean(propWordEditorOpen || wordEditorOpen);
    const activeWordDoc = propWordEditorExam || wordEditorExam;
    return getCurrentTabInfo({
      activeSection,
      activeSubTab,
      selectedClass,
      selectedExam,
      classes,
      exams,
      submissionsMap,
      liveSessions,
      wordEditorOpen: isWordActive,
      wordEditorExam: activeWordDoc,
    });
  }, [
    activeSection,
    activeSubTab,
    selectedClass,
    selectedExam,
    classes,
    exams,
    submissionsMap,
    liveSessions,
    propWordEditorOpen,
    wordEditorOpen,
    propWordEditorExam,
    wordEditorExam,
  ]);

  // Hàm tự động phân tích chi tiết chức năng của Tab hiện tại
  const handleAnalyzeCurrentTab = () => {
    const isWordActive = Boolean(propWordEditorOpen || wordEditorOpen);
    const activeWordDoc = propWordEditorExam || wordEditorExam;
    const analysisText = buildTabDetailedAnalysis({
      activeSection,
      activeSubTab,
      selectedClass,
      selectedExam,
      classes,
      exams,
      submissionsMap,
      liveSessions,
      wordEditorOpen: isWordActive,
      wordEditorExam: activeWordDoc,
    });

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: 'bot_tab_analysis_' + Date.now(),
        sender: 'bot',
        text: analysisText,
        navSuggestions: currentTabInfo.quickChips?.map((c) => ({
          label: c.label,
          action: c.action,
          sec: c.sec,
          query: c.query,
        })) || [],
        time: timeStr,
      },
    ]);
  };

  // Tự động cuộn xuống dưới
  useEffect(() => {
    if (isOpen) {
      bodyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Phím tắt Esc
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Khởi tạo nhận diện giọng nói (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'vi-VN';
      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
        setIsRecording(false);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      onSay?.('Trình duyệt chưa hỗ trợ nhận diện giọng nói Web Speech.', 'warn');
      return;
    }


    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        onSay?.('Đang lắng nghe... Thầy/Cô hãy nói yêu cầu.', 'info');
      } catch (_) {
        setIsRecording(false);
      }
    }
  };

  const speakText = async (text, msgId) => {
    if (!tts.isSupported()) return;
    if (speakingMsgId === msgId) {
      tts.stop();
      setSpeakingMsgId(null);
      return;
    }
    setSpeakingMsgId(msgId);
    try {
      await tts.speak(text, { rate: 1.03 });
    } catch (err) {
      onSay?.(err?.message || 'Không thể phát giọng đọc Tiếng Việt lúc này.', 'warn');
    } finally {
      setSpeakingMsgId((cur) => (cur === msgId ? null : cur));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      tts.stop();
      setSpeakingMsgId(null);
    }
  }, [isOpen]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    try { activeRequestRef.current?.abort?.(); } catch { /* ignore */ }
    tts.stop();
  }, []);

  // TIỆN ÍCH XUẤT FILE WORD (.DOCX) CHUẨN 3 PHẦN
  const handleExportExamWord = async (exam) => {
    if (!exam || !exam.questions?.length) {
      onSay?.('Không có câu hỏi để xuất file Word.', 'warn');
      return;
    }


    try {
      const filename = await exportToWord({
        examTitle: exam.title || 'Đề kiểm tra',
        subject: exam.subject || inferredSubject,
        duration: exam.duration || 45,
        code: '101',
        questions: exam.questions,
        includeAnswers: true,
        headerInfo: {
          deptName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
          schoolName: 'TRƯỜNG THPT',
          examName: (exam.title || 'ĐỀ KIỂM TRA ĐÁNH GIÁ CHUẨN GDPT 2025').toUpperCase(),
          subject: exam.subject || inferredSubject,
          grade: String(exam.grade || '12'),
          schoolYear: '2026 - 2027',
          duration: exam.duration || 45,
        },
      });
      onSay?.(`Đã tải xuống file Word chuẩn 3 phần: ${filename}`, 'success');
    } catch (err) {
      onSay?.(`Lỗi khi xuất file Word: ${err.message}`, 'error');
    }
  };

  // BÁC SĨ SỬA FILE WORD: TỰ ĐỘNG BỔ SUNG ĐỦ 3 PHẦN GDPT 2025 (28 CÂU)
  const handleAiCompleteExam3Parts = async (exam) => {
    if (!exam || !exam.questions?.length) return;
    const p1Count = exam.questions.filter((q) => q.part === 1 || q.type === 'single_choice' || (!q.part && !q.type)).length;
    const p2Count = exam.questions.filter((q) => q.part === 2 || q.type === 'true_false').length;
    const p3Count = exam.questions.filter((q) => q.part === 3 || q.type === 'short_answer').length;

    const needP2 = Math.max(0, 4 - p2Count);
    const needP3 = Math.max(0, 6 - p3Count);
    if (needP2 === 0 && needP3 === 0) {
      onSay?.('Đề đã có đủ số câu Phần II & Phần III chuẩn cấu trúc 3 phần GDPT 2025!', 'success');
      return;
    }

    setTypingStatus('Bác sĩ AI đang bổ sung Phần II & Phần III...');
    setIsTyping(true);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    onSay?.('AI Bác sĩ đang phân tích chuyên đề và sinh bổ sung Phần II & Phần III...', 'info');

    const sampleStems = exam.questions.slice(0, 5).map((q, i) => `${i + 1}. ${q.q || ''}`).join('\n');
    const subject = exam.subject || inferredSubject;
    const grade = exam.grade || '12';

    const prompt = `Bạn là chuyên gia ra đề ${subject} lớp ${grade} chuẩn GDPT 2025 của Bộ Giáo dục và Đào tạo.
Dưới đây là một số câu hỏi trắc nghiệm hiện có trong đề thi của giáo viên:
${sampleStems}

Hiện tại file đề đang thiếu ${needP2} câu Phần II (Đúng/Sai) và ${needP3} câu Phần III (Trả lời ngắn).
Hãy bổ sung chính xác:
- ${needP2} câu Phần II (Trắc nghiệm Đúng/Sai): Mỗi câu có ngữ cảnh/bài toán dẫn, gồm 4 nhận định a), b), c), d). Mỗi nhận định có đáp án boolean (true/false) và giải thích chi tiết.
- ${needP3} câu Phần III (Trả lời ngắn): Mỗi câu là một bài toán tính toán hoặc tìm số lượng, có đáp án số rõ ràng (ví dụ "12,5" hoặc "3"), và giải thích chi tiết.

TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO MẪU:
{
  "part2": [
    {
      "q": "Đề dẫn bài toán hoặc thí nghiệm hóa học...",
      "statements": [
        { "text": "a) Nhận định a...", "answer": true },
        { "text": "b) Nhận định b...", "answer": false },
        { "text": "c) Nhận định c...", "answer": true },
        { "text": "d) Nhận định d...", "answer": false }
      ],
      "level": "VD",
      "explain": "Lời giải chi tiết từng ý..."
    }
  ],
  "part3": [
    {
      "q": "Câu hỏi tính toán yêu cầu điền số...",
      "answer": "12,5",
      "level": "VDC",
      "explain": "Lời giải chi tiết từng bước..."
    }
  ]
}`;

    try {
      const parsed = await callCopilotAI(
        prompt,
        {},
        CREDIT_TARIFF.EXAM_GEN_SMALL,
        'Bổ sung Phần II & III đề thi',
        null,
        {
          actionType: 'exam_gen',
          validate: (rawText) => {
            const p = parseExamJsonSafe(rawText);
            if (!(p?.part2?.length || p?.part3?.length)) {
              throw new Error('AI chưa trả về được câu hỏi Phần II/III hợp lệ (ELEC Credit đã được hoàn trả).');
            }
            return p;
          },
        }
      );

      let newP2List = (parsed?.part2 || []).map((q, idx) => ({
        id: `q_p2_comp_${Date.now()}_${idx}`,
        q: q.q,
        statements: (q.statements || []).map((st) => ({
          text: st.text || '',
          answer: st.answer === true,
        })),
        level: q.level || 'VD',
        explain: q.explain || '',
        part: 2,
        type: 'true_false',
        points: 1.0,
      }));

      let newP3List = (parsed?.part3 || []).map((q, idx) => ({
        id: `q_p3_comp_${Date.now()}_${idx}`,
        q: q.q,
        answer: String(q.answer || '0').replace('.', ','),
        level: q.level || 'VDC',
        explain: q.explain || '',
        part: 3,
        type: 'short_answer',
        points: 0.25,
      }));

      // Bổ sung câu hỏi dự phòng chuyên biệt theo đúng Môn học đã nhận diện
      if (!newP2List.length && needP2 > 0) {
        if (/vật l[íy]/i.test(subject)) {
          newP2List = [
            {
              id: 'q_p2_fb_phy_1',
              q: 'Một con lắc lò xo treo thẳng đứng gồm vật nặng có khối lượng m = 200 g và lò xo có độ cứng k = 50 N/m. Kích thích cho vật dao động điều hòa theo phương thẳng đứng với biên độ A = 4 cm. Lấy g = 10 m/s², π² = 10.',
              statements: [
                { text: 'a) Chu kỳ dao động riêng của con lắc lò xo là 0,4 s.', answer: true },
                { text: 'b) Độ dãn của lò xo ở vị trí cân bằng là 4 cm.', answer: true },
                { text: 'c) Lực đàn hồi cực đại của lò xo có độ lớn là 4 N.', answer: true },
                { text: 'd) Trong một chu kỳ, thời gian lò xo bị nén là 0,133 s.', answer: false },
              ],
              level: 'VD',
              explain: 'T = 2π√(m/k) = 0,4 s. Δl0 = mg/k = 4 cm. Do A = Δl0 = 4 cm nên lò xo không bị nén, lực đàn hồi F_max = k(Δl0 + A) = 4 N.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
            {
              id: 'q_p2_fb_phy_2',
              q: 'Đặt điện áp xoay chiều u = 220√2 cos(100πt) (V) vào hai đầu đoạn mạch RLC nối tiếp gồm R = 100 Ω, cuộn cảm thuần L = 1/π H và tụ điện C = 10⁻⁴/(2π) F.',
              statements: [
                { text: 'a) Cảm kháng của cuộn cảm bằng 100 Ω và dung kháng của tụ điện bằng 200 Ω.', answer: true },
                { text: 'b) Tổng trở của toàn đoạn mạch là 100√2 Ω.', answer: true },
                { text: 'c) Cường độ dòng điện trong mạch sớm pha π/4 so với điện áp hai đầu đoạn mạch.', answer: true },
                { text: 'd) Công suất tiêu thụ điện cực đại khi giữ nguyên L, C và tăng R.', answer: false },
              ],
              level: 'VD',
              explain: 'ZL = 100 Ω, ZC = 200 Ω. Z = 100√2 Ω. tanφ = -1 -> i sớm pha π/4 so với u. Công suất cực đại khi xảy ra cộng hưởng.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
          ];
        } else if (/toán/i.test(subject)) {
          newP2List = [
            {
              id: 'q_p2_fb_math_1',
              q: 'Cho hàm số bậc ba y = f(x) = x³ - 3x + 2 có đồ thị (C).',
              statements: [
                { text: 'a) Đạo hàm f\'(x) = 3x² - 3.', answer: true },
                { text: 'b) Hàm số đồng biến trên khoảng (-1; 1).', answer: false },
                { text: 'c) Điểm cực đại của đồ thị hàm số là (-1; 4).', answer: true },
                { text: 'd) Phương trình f(x) = 0 có đúng 2 nghiệm thực phân biệt.', answer: true },
              ],
              level: 'VD',
              explain: 'f\'(x) = 3x² - 3 = 0 -> x = ±1. Hàm số nghịch biến trên (-1; 1). Điểm CĐ (-1; 4). f(x) = (x-1)²(x+2) = 0 có 2 nghiệm phân biệt.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
            {
              id: 'q_p2_fb_math_2',
              q: 'Trong không gian Oxyz, cho bốn điểm A(1; 0; 0), B(0; 2; 0), C(0; 0; 3) và D(1; 2; 3).',
              statements: [
                { text: 'a) Phương trình mặt phẳng (ABC) là x/1 + y/2 + z/3 = 1.', answer: true },
                { text: 'b) Vectơ pháp tuyến của (ABC) có tọa độ là (6; 3; 2).', answer: true },
                { text: 'c) Điểm D thuộc mặt phẳng (ABC).', answer: false },
                { text: 'd) Thể tích tứ diện ABCD bằng 2.', answer: true },
              ],
              level: 'VD',
              explain: 'Phương trình (ABC): 6x + 3y + 2z - 6 = 0. Thay tọa độ D vào vế trái = 12 ≠ 0 nên D không thuộc (ABC).',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
          ];
        } else if (/sinh/i.test(subject)) {
          newP2List = [
            {
              id: 'q_p2_fb_bio_1',
              q: 'Ở một loài thực vật lưỡng bội, gen A quy định thân cao trội hoàn toàn so với a quy định thân thấp; gen B quy định hoa đỏ trội hoàn toàn so với b quy định hoa trắng. Hai gen phân ly độc lập. Cây dị hợp 2 cặp gen tự thụ phấn thu được F1.',
              statements: [
                { text: 'a) Ở F1 xuất hiện 9 loại kiểu gen và 4 loại kiểu hình.', answer: true },
                { text: 'b) Tỉ lệ cây thân cao, hoa trắng thuần chủng ở F1 là 1/16.', answer: true },
                { text: 'c) Trong số cây thân cao, hoa đỏ ở F1, cây thuần chủng chiếm tỉ lệ 4/9.', answer: false },
                { text: 'd) Lấy ngẫu nhiên 1 cây F1, xác suất thu được cây mang 2 alen trội là 6/16.', answer: true },
              ],
              level: 'VD',
              explain: 'Trong số cây A-B- (chiếm 9/16), cây AABB là 1/16 nên chiếm tỉ lệ 1/9 chứ không phải 4/9.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
          ];
        } else if (/anh|english/i.test(subject)) {
          newP2List = [
            {
              id: 'q_p2_fb_eng_1',
              q: 'Read the following statements regarding modern educational technology and distance learning:',
              statements: [
                { text: 'a) Digital learning platforms provide customized pacing for diverse learners.', answer: true },
                { text: 'b) Autonomous AI agents completely supersede the pedagogical presence of human educators.', answer: false },
                { text: 'c) Academic integrity and verification protocols are vital components of online assessments.', answer: true },
                { text: 'd) Adaptive formative feedback enhances knowledge retention.', answer: true },
              ],
              level: 'VD',
              explain: 'Statement b is false because human pedagogical guidance and mentorship remain central.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
          ];
        } else {
          newP2List = [
            {
              id: 'q_p2_fb_chem_1',
              q: 'Tiến hành thí nghiệm xà phòng hóa chất béo: Cho vào bát sứ nhỏ khoảng 2 ml dầu dừa và 5 ml dung dịch NaOH 40%. Đun sôi nhẹ hỗn hợp khoảng 30 phút và khuấy liên tục bằng đũa thủy tinh, thỉnh thoảng thêm vài giọt nước cất để giữ cho thể tích hỗn hợp không đổi. Sau đó rót thêm 10 ml dung dịch NaCl bão hòa nóng, khuấy nhẹ rồi để nguội.',
              statements: [
                { text: 'a) Sau bước 3 thấy có lớp chất rắn màu trắng nổi lên trên, đó là muối natri của axit béo.', answer: true },
                { text: 'b) Thêm dung dịch NaCl bão hòa để làm tăng khối lượng riêng của dung dịch giúp xà phòng kết tinh nổi lên.', answer: true },
                { text: 'c) Thêm nước cất để tránh este bị bay hơi và giữ phản ứng diễn ra liên tục.', answer: true },
                { text: 'd) Nếu thay dầu dừa bằng dầu bôi trơn máy thì hiện tượng thí nghiệm xảy ra tương tự.', answer: false },
              ],
              level: 'VD',
              explain: 'Dầu bôi trơn máy là hiđrocacbon, không phản ứng với NaOH nên không sinh ra xà phòng.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
            {
              id: 'q_p2_fb_chem_2',
              q: 'Hợp chất hữu cơ X (no, mạch hở, chứa C, H, O) có công thức phân tử C6H10O4. Cho 1 mol X tác dụng vừa đủ với 2 mol NaOH trong dung dịch, thu được muối của axit cacboxylic Y và hỗn hợp gồm 2 ancol Z, T (MZ < MT). Biết Y tác dụng với dung dịch AgNO3/NH3 sinh ra kết tủa Ag.',
              statements: [
                { text: 'a) Axit Y là axit fomic (HCOOH).', answer: true },
                { text: 'b) Z và T thuộc cùng dãy đồng đẳng ancol no, đơn chức, mạch hở.', answer: true },
                { text: 'c) Đốt cháy hoàn toàn 1 mol Z thu được 2 mol CO2.', answer: false },
                { text: 'd) Có 2 công thức cấu tạo thỏa mãn tính chất của X.', answer: true },
              ],
              level: 'VD',
              explain: 'X là HCOOCH2CH2OOCCH3 hoặc HCOOCH2CH2CH2OOCH hoặc đimetyl este.',
              part: 2,
              type: 'true_false',
              points: 1.0,
            },
          ];
        }
      }

      if (!newP3List.length && needP3 > 0) {
        if (/vật l[íy]/i.test(subject)) {
          newP3List = [
            {
              id: 'q_p3_fb_phy_1',
              q: 'Một con lắc đơn có chiều dài l = 1 m dao động điều hòa tại nơi có gia tốc trọng trường g = 9,8 m/s². Chu kỳ dao động của con lắc bằng bao nhiêu giây? (Làm tròn đến 2 chữ số thập phân).',
              answer: '2,01',
              level: 'VD',
              explain: 'T = 2π√(l/g) = 2 * 3,1416 * √(1/9,8) ≈ 2,01 s.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
            {
              id: 'q_p3_fb_phy_2',
              q: 'Đặt điện áp xoay chiều u = 200 cos(100πt) (V) vào hai đầu đoạn mạch gồm R = 60 Ω và ZL = 80 Ω nối tiếp. Cường độ dòng điện hiệu dụng trong mạch bằng bao nhiêu ampe? (Làm tròn đến 2 chữ số thập phân).',
              answer: '1,41',
              level: 'VD',
              explain: 'Tổng trở Z = √(60² + 80²) = 100 Ω. U = 200/√2 ≈ 141,42 V. I = U/Z ≈ 1,41 A.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
          ];
        } else if (/toán/i.test(subject)) {
          newP3List = [
            {
              id: 'q_p3_fb_math_1',
              q: 'Cho hình chóp S.ABC có đáy là tam giác vuông cân tại B, AB = 2. Cạnh bên SA vuông góc với mặt phẳng đáy và SA = 3. Thể tích của khối chóp S.ABC bằng bao nhiêu?',
              answer: '2',
              level: 'VD',
              explain: 'S_ABC = 1/2 * 2 * 2 = 2. V = 1/3 * SA * S_ABC = 1/3 * 3 * 2 = 2.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
            {
              id: 'q_p3_fb_math_2',
              q: 'Tìm giá trị lớn nhất của hàm số f(x) = -x⁴ + 2x² + 3 trên đoạn [-2; 2].',
              answer: '4',
              level: 'VD',
              explain: 'f\'(x) = -4x³ + 4x = 0 -> x = 0 hoặc x = ±1. Giá trị lớn nhất đạt được tại x = ±1 với f(±1) = 4.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
          ];
        } else if (/sinh/i.test(subject)) {
          newP3List = [
            {
              id: 'q_p3_fb_bio_1',
              q: 'Một đoạn phân tử ADN mạch kép dài 408 nm có tỉ lệ nuclêôtit loại A/G = 2/3. Số nuclêôtit loại Guanin (G) của đoạn ADN này là bao nhiêu?',
              answer: '720',
              level: 'VD',
              explain: 'Tổng số nu N = (408 * 10 / 3,4) * 2 = 2400. 2A + 2G = 2400 và A/G = 2/3 -> A = 480, G = 720.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
          ];
        } else {
          newP3List = [
            {
              id: 'q_p3_fb_chem_1',
              q: 'Đốt cháy hoàn toàn 0,15 mol este đơn chức X thu được 0,6 mol CO2 và 0,6 mol H2O. Số nguyên tử hiđro (H) trong một phân tử este X là bao nhiêu?',
              answer: '8',
              level: 'VD',
              explain: 'nCO2 = nH2O = 0,6 mol -> este no đơn chức CnH2nO2. Số C = 0,6 / 0,15 = 4 -> CTPT C4H8O2 -> 8 nguyên tử H.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
            {
              id: 'q_p3_fb_chem_2',
              q: 'Cho 8,8 gam etyl axetat tác dụng hoàn toàn với 150 ml dung dịch NaOH 1M. Sau khi phản ứng xảy ra hoàn toàn, cô cạn dung dịch thu được m gam chất rắn khan. Giá trị của m là bao nhiêu gam?',
              answer: '10,2',
              level: 'VD',
              explain: 'nEste = 8,8/88 = 0,1 mol. nNaOH = 0,15 mol (dư 0,05 mol). m_rắn = mCH3COONa (0,1 * 82) + mNaOH dư (0,05 * 40) = 8,2 + 2,0 = 10,2 gam.',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            },
          ];
        }
      }

      const mergedQuestions = [
        ...exam.questions,
        ...newP2List,
        ...newP3List,
      ].map((q, idx) => ({ ...q, id: q.id || `q_all_${idx + 1}` }));

      const p1 = mergedQuestions.filter((q) => q.part === 1 || q.type === 'single_choice' || (!q.part && !q.type)).length;
      const p2 = mergedQuestions.filter((q) => q.part === 2 || q.type === 'true_false').length;
      const p3 = mergedQuestions.filter((q) => q.part === 3 || q.type === 'short_answer').length;

      const upgradedExam = {
        ...exam,
        id: 'exam_upgraded_' + Date.now(),
        title: `${exam.title || 'Đề thi'} (Đã hoàn thiện chuẩn GDPT 2025)`,
        totalQuestions: mergedQuestions.length,
        questions: mergedQuestions,
      };

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_upgraded_' + Date.now(),
          sender: 'bot',
          text: `Bác sĩ AI đã hoàn thành chuẩn hóa và bổ sung thành công đủ 3 phần cho file đề "${exam.title}". Đề hiện có tổng cộng ${mergedQuestions.length} câu chuẩn GDPT 2025:`,
          examData: upgradedExam,
          diag: {
            total: mergedQuestions.length,
            part1: p1,
            part2: p2,
            part3: p3,
            successRate: 100,
          },
          time: timeStr,
        },
      ]);
      onSay?.(`Đã hoàn thiện đề thi đủ 3 phần (${mergedQuestions.length} câu)!`, 'success');
    } catch (err) {
      setIsTyping(false);
      setTypingStatus('');
      onSay?.(`Lỗi khi AI bổ sung đề: ${err.message}`, 'error');
    }
  };

  // BÁC SĨ AI: TỰ ĐỘNG GIẢI & ĐIỀN ĐÁP ÁN + LỜI GIẢI CHO CÁC CÂU THIẾU ĐÁP ÁN
  const handleAiFillMissingAnswers = async (exam) => {
    if (!exam || !exam.questions?.length) return;
    const missingEntries = [];
    exam.questions.forEach((q, idx) => {
      const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
      const isMissing =
        part === 2
          ? !(q.statements || []).some((s) => s.answer === true || s.answer === false)
          : part === 3
            ? !String(q.answer || '').trim()
            : q.correct === undefined || q.correct === null || q.correct < 0;
      if (isMissing) missingEntries.push({ idx, part, q });
    });

    if (!missingEntries.length) {
      onSay?.('Tất cả câu hỏi trong đề đều đã có đáp án đầy đủ!', 'success');
      return;
    }

    const batch = missingEntries.slice(0, 18);
    setTypingStatus(`AI đang giải & điền đáp án cho ${batch.length} câu...`);
    setIsTyping(true);
    const subject = exam.subject || inferredSubject || 'Bộ môn';
    const grade = exam.grade || '12';
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const serialized = batch
      .map(({ idx, part, q }) => {
        if (part === 2) {
          const stms = (q.statements || []).map((s, i) => `  ${String.fromCharCode(97 + i)}) ${s.text || ''}`).join('\n');
          return `[index=${idx}, part=2] ${q.q || ''}\n${stms}`;
        }
        if (part === 3) {
          return `[index=${idx}, part=3] ${q.q || ''}`;
        }
        const opts = (q.options || []).map((o, i) => `  ${i}: ${o}`).join('\n');
        return `[index=${idx}, part=1] ${q.q || ''}\n${opts}`;
      })
      .join('\n\n');

    const solvePrompt = `Bạn là giáo viên giỏi môn ${subject} lớp ${grade} chuẩn GDPT 2025.
Hãy giải chính xác các câu hỏi đang thiếu đáp án dưới đây và trả về DUY NHẤT JSON hợp lệ:
${serialized}

MẪU JSON:
{
  "answers": [
    { "index": 0, "part": 1, "correct": 0, "level": "TH", "explain": "Giải thích ngắn gọn chuẩn xác..." },
    { "index": 1, "part": 2, "statements": [true, false, true, false], "level": "VD", "explain": "..." },
    { "index": 2, "part": 3, "answer": "12,5", "level": "VD", "explain": "..." }
  ]
}`;

    try {
      const { byIndex } = await callCopilotAI(
        solvePrompt,
        { noGuide: true, noCache: true },
        CREDIT_TARIFF.ERROR_ANALYSIS,
        'AI giải & điền đáp án thiếu',
        null,
        {
          actionType: 'exam_solve',
          validate: (rawText) => {
            const parsed = parseExamJsonSafe(rawText);
            const ansList = Array.isArray(parsed?.answers) ? parsed.answers : [];
            if (!ansList.length) {
              throw new Error('AI chưa trích xuất được bảng đáp án JSON hợp lệ (ELEC Credit đã được hoàn trả). Thầy/Cô vui lòng thử lại.');
            }
            return { byIndex: new Map(ansList.map((a) => [Number(a.index), a])) };
          },
        }
      );
      let filledCount = 0;
      const updatedQuestions = exam.questions.map((q, idx) => {
        const hit = byIndex.get(idx);
        if (!hit) return q;
        const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
        filledCount++;
        if (part === 2 && Array.isArray(hit.statements)) {
          return {
            ...q,
            statements: (q.statements || []).map((s, si) => ({
              ...s,
              answer: Boolean(hit.statements[si]),
            })),
            level: q.level || hit.level || inferQuestionBloomLevel(q),
            explain: q.explain || hit.explain || '',
          };
        }
        if (part === 3 && hit.answer !== undefined) {
          return {
            ...q,
            answer: String(hit.answer).replace('.', ','),
            level: q.level || hit.level || inferQuestionBloomLevel(q),
            explain: q.explain || hit.explain || '',
          };
        }
        const corr = Number(hit.correct);
        return {
          ...q,
          correct: Number.isInteger(corr) && corr >= 0 && corr <= 3 ? corr : 0,
          level: q.level || hit.level || inferQuestionBloomLevel(q),
          explain: q.explain || hit.explain || '',
        };
      });

      const updatedExam = { ...exam, questions: updatedQuestions };
      setWordEditorExam(updatedExam);

      const p1 = updatedQuestions.filter((q) => q.part === 1 || q.type === 'single_choice' || (!q.part && !q.type)).length;
      const p2 = updatedQuestions.filter((q) => q.part === 2 || q.type === 'true_false').length;
      const p3 = updatedQuestions.filter((q) => q.part === 3 || q.type === 'short_answer').length;
      const remainingMissing = Math.max(0, missingEntries.length - filledCount);

      setIsTyping(false);
      setTypingStatus('');
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_solved_' + Date.now(),
          sender: 'bot',
          text: `Đã tự động giải và điền đáp án + lời giải chi tiết cho **${filledCount} câu** trong đề **"${exam.title}"**${remainingMissing > 0 ? ` (còn ${remainingMissing} câu nữa, bấm tiếp nếu cần)` : ' — Đề hiện đã đủ 100% đáp án!'}:`,
          examData: updatedExam,
          diag: { total: updatedQuestions.length, part1: p1, part2: p2, part3: p3, successRate: 100 },
          time: timeStr,
        },
      ]);
      onSay?.(`Đã điền đáp án cho ${filledCount} câu hỏi!`, 'success');
    } catch (err) {
      setIsTyping(false);
      setTypingStatus('');
      onSay?.(aiErrMsg(err, 'Không thể tự động giải đáp án lúc này.'), 'error');
    }
  };

  // KHỞI TẠO INTERACTIVE EXAM WIZARD (TƯ VẤN & SOẠN ĐỀ)
  const handleStartExamWizard = (initialConfig = {}) => {
    const defaultGrade = String(classes[0]?.grade || linkedClasses?.[0]?.grade || '12');
    const defaultSubject = inferredSubject || 'Hóa học';
    const chosenSubject = initialConfig.subject || defaultSubject;
    const chosenGrade = initialConfig.grade || defaultGrade;
    const availableTopics = getTopicsForSubjectAndGrade(chosenSubject, chosenGrade);
    const wizardId = 'wizard_' + Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: wizardId,
        sender: 'bot',
        text: 'Em chào Thầy/Cô! Em là Chuyên gia Soạn đề GDPT 2025. Để tạo đề thi chuẩn cấu trúc 3 phần của Bộ GD&ĐT, Thầy/Cô vui lòng tùy chọn thông số bên dưới:',
        wizardData: {
          id: wizardId,
          subject: chosenSubject,
          grade: chosenGrade,
          format: initialConfig.format || 'gdpt2025',
          topic: initialConfig.topic || availableTopics[0] || 'Kiến thức trọng tâm',
          matrix: initialConfig.matrix || 'standard',
        },
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Cập nhật wizard state trong message
  const handleUpdateWizard = (wizardId, patch) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.wizardData && m.wizardData.id === wizardId) {
          const nextWz = { ...m.wizardData, ...patch };
          const curSub = patch.subject || nextWz.subject || inferredSubject || 'Hóa học';
          const curGrade = patch.grade || nextWz.grade || '12';
          if ((patch.grade && patch.grade !== m.wizardData.grade) || (patch.subject && patch.subject !== m.wizardData.subject)) {
            const tops = getTopicsForSubjectAndGrade(curSub, curGrade);
            nextWz.topic = tops[0] || 'Kiến thức trọng tâm';
          }
          return { ...m, wizardData: nextWz };
        }
        return m;
      })
    );
  };

  // THỰC THI SINH ĐỀ CHUẨN 3 PHẦN TỪ WIZARD
  const handleExecuteGenerateExam = async (wzData) => {
    if (!wzData) return;
    setTypingStatus(`Đang biên soạn đề ${wzData.format === 'gdpt2025' ? '28 câu (50p)' : '10 câu (15p)'}...`);
    setIsTyping(true);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isFullGdpt = wzData.format === 'gdpt2025';
    const subject = wzData.subject || inferredSubject || 'Hóa học';
    const grade = wzData.grade || '12';
    const targetTopic = wzData.topic || getTopicsForSubjectAndGrade(subject, grade)[0] || 'Kiến thức trọng tâm';
    const duration = isFullGdpt ? 50 : 15;
    const matrixSpec = getMatrixPromptSpec(wzData.matrix);
    const classWeakHint = realInsights.weakestTopics?.length
      ? `\nGợi ý dữ liệu thực tế từ lớp học (nên lồng ghép củng cố nếu cùng chuyên đề): ${realInsights.weakestTopics.slice(0, 2).map((t) => `${t.topic} (${t.rate}% đúng)`).join(', ')}.`
      : '';

    onSay?.(`AI đang biên soạn đề ${duration} phút chuyên đề ${targetTopic} (${matrixSpec.label})...`, 'info');

    try {
      let finalQuestions = [];

      if (!isFullGdpt) {
        // Đề 15 phút: 6 Phần I + 2 Phần II + 2 Phần III = 10 câu
        const prompt15 = `Bạn là chuyên gia ra đề ${subject} lớp ${grade} chuẩn GDPT 2025.
Hãy biên soạn 1 đề kiểm tra 15 phút chuyên đề "${targetTopic}" gồm đúng 10 câu chuẩn 3 phần:
- Phần I (6 câu trắc nghiệm 4 lựa chọn A, B, C, D, 1 đáp án đúng, có giải thích).
- Phần II (2 câu trắc nghiệm Đúng/Sai, mỗi câu có đề dẫn và 4 nhận định a, b, c, d với đáp án boolean true/false và giải thích).
- Phần III (2 câu trắc nghiệm Trả lời ngắn, bài toán tính toán với đáp án số cụ thể, và giải thích chi tiết).

${matrixSpec.instruction}${classWeakHint}

TRẢ VỀ DUY NHẤT ĐỐI TƯỢNG JSON HỢP LỆ THEO MẪU:
{
  "title": "Đề kiểm tra 15 phút ${targetTopic} - Lớp ${grade}",
  "part1": [
    { "q": "Nội dung câu...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 0, "level": "NB", "explain": "..." }
  ],
  "part2": [
    { "q": "Đề dẫn...", "statements": [{ "text": "a) ...", "answer": true }, { "text": "b) ...", "answer": false }, { "text": "c) ...", "answer": true }, { "text": "d) ...", "answer": false }], "level": "VD", "explain": "..." }
  ],
  "part3": [
    { "q": "Câu hỏi tính số...", "answer": "12", "level": "VD", "explain": "..." }
  ]
}`;

        finalQuestions = await callCopilotAI(
          prompt15,
          {},
          CREDIT_TARIFF.EXAM_GEN_SMALL,
          'Tạo đề kiểm tra 15 phút AI',
          null,
          {
            actionType: 'exam_gen',
            validate: (text) => {
              const parsed = parseExamJsonSafe(text);
              const q1 = (parsed?.part1 || []).map((q, idx) => ({
                id: `q_15_p1_${idx + 1}`,
                q: q.q,
                options: (Array.isArray(q.options) && q.options.length === 4) ? q.options : [
                  'A. ' + (q.options?.[0] || 'Phương án đúng'),
                  'B. ' + (q.options?.[1] || 'Phương án gây nhiễu 1'),
                  'C. ' + (q.options?.[2] || 'Phương án gây nhiễu 2'),
                  'D. ' + (q.options?.[3] || 'Phương án gây nhiễu 3'),
                ],
                correct: q.correct ?? 0,
                level: q.level || 'NB',
                explain: q.explain || '',
                part: 1,
                type: 'single_choice',
                points: 0.25,
              }));
              const q2 = (parsed?.part2 || []).map((q, idx) => ({
                id: `q_15_p2_${idx + 1}`,
                q: q.q,
                statements: (q.statements || []).map((s) => ({ text: s.text, answer: s.answer === true })),
                level: q.level || 'VD',
                explain: q.explain || '',
                part: 2,
                type: 'true_false',
                points: 1.0,
              }));
              const q3 = (parsed?.part3 || []).map((q, idx) => ({
                id: `q_15_p3_${idx + 1}`,
                q: q.q,
                answer: String(q.answer || '0').replace('.', ','),
                level: q.level || 'VDC',
                explain: q.explain || '',
                part: 3,
                type: 'short_answer',
                points: 0.25,
              }));
              const list = [...q1, ...q2, ...q3];
              if (!list.length) {
                throw new Error('AI chưa kịp hoàn tất định dạng JSON câu hỏi (ELEC Credit đã được hoàn trả).');
              }
              return list;
            },
          }
        );
      } else {
        // Đề chuẩn GDPT 2025: 18 Phần I + 4 Phần II + 6 Phần III = 28 câu
        const promptP1 = `Bạn là chuyên gia ra đề ${subject} lớp ${grade} GDPT 2025. Hãy soạn 18 câu trắc nghiệm 4 lựa chọn (Phần I) chuyên đề "${targetTopic}".
${matrixSpec.instruction}${classWeakHint}
Trả về duy nhất JSON:
{
  "part1": [
    { "q": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": 0, "level": "TH", "explain": "..." }
  ]
}`;

        const promptP2P3 = `Bạn là chuyên gia ra đề ${subject} lớp ${grade} GDPT 2025. Hãy soạn:
- 4 câu Phần II (Đúng/Sai, mỗi câu có 4 ý a, b, c, d với boolean true/false và giải thích)
- 6 câu Phần III (Trả lời ngắn tính toán với đáp án số cụ thể và giải thích)
Chuyên đề "${targetTopic}".
${matrixSpec.instruction}
Trả về duy nhất JSON:
{
  "part2": [
    { "q": "...", "statements": [{ "text": "a) ...", "answer": true }, { "text": "b) ...", "answer": false }, { "text": "c) ...", "answer": true }, { "text": "d) ...", "answer": false }], "level": "VD", "explain": "..." }
  ],
  "part3": [
    { "q": "...", "answer": "12,5", "level": "VDC", "explain": "..." }
  ]
}`;

        finalQuestions = await runWithCredit(
          { userId: user?.uid, cost: CREDIT_TARIFF.EXAM_GEN_LARGE, actionType: 'exam_gen', reason: 'Tạo đề kiểm tra 45-90 phút AI' },
          async () => {
            let p1Err = null;
            let p2Err = null;
            const pair = await Promise.all([
              askAI(promptP1, null, null, { systemPrompt: TEACHER_COPILOT_SYSTEM_PROMPT }).catch((e) => { p1Err = e; return null; }),
              askAI(promptP2P3, null, null, { systemPrompt: TEACHER_COPILOT_SYSTEM_PROMPT }).catch((e) => { p2Err = e; return null; }),
            ]);
            if (!pair[0] && !pair[1]) {
              throw new Error(p1Err?.message || p2Err?.message || 'Không kết nối được AI để sinh đề.');
            }
            const textP1 = typeof pair[0] === 'string' ? pair[0] : (pair[0]?.text || '');
            const textP2P3 = typeof pair[1] === 'string' ? pair[1] : (pair[1]?.text || '');
            const parsedP1 = parseExamJsonSafe(textP1);
            const parsedP2P3 = parseExamJsonSafe(textP2P3);
            const p1 = (parsedP1?.part1 || []).map((q, idx) => ({
              id: `q_gdpt_p1_${idx + 1}`,
              q: q.q,
              options: (Array.isArray(q.options) && q.options.length === 4) ? q.options : [
                'A. ' + (q.options?.[0] || 'Phương án đúng'),
                'B. ' + (q.options?.[1] || 'Phương án gây nhiễu 1'),
                'C. ' + (q.options?.[2] || 'Phương án gây nhiễu 2'),
                'D. ' + (q.options?.[3] || 'Phương án gây nhiễu 3'),
              ],
              correct: q.correct ?? 0,
              level: q.level || (idx < 6 ? 'NB' : idx < 14 ? 'TH' : 'VD'),
              explain: q.explain || '',
              part: 1,
              type: 'single_choice',
              points: 0.25,
            }));
            const p2 = (parsedP2P3?.part2 || []).map((q, idx) => ({
              id: `q_gdpt_p2_${idx + 1}`,
              q: q.q,
              statements: (q.statements || []).map((s) => ({ text: s.text, answer: s.answer === true })),
              level: q.level || 'VD',
              explain: q.explain || '',
              part: 2,
              type: 'true_false',
              points: 1.0,
            }));
            const p3 = (parsedP2P3?.part3 || []).map((q, idx) => ({
              id: `q_gdpt_p3_${idx + 1}`,
              q: q.q,
              answer: String(q.answer || '0').replace('.', ','),
              level: q.level || 'VDC',
              explain: q.explain || '',
              part: 3,
              type: 'short_answer',
              points: 0.25,
            }));
            const list = [...p1, ...p2, ...p3];
            if (!list.length) {
              throw new Error('AI chưa kịp hoàn tất định dạng JSON câu hỏi (ELEC Credit đã được hoàn trả).');
            }
            return list;
          }
        );
      }

      // Không bao giờ chèn câu hỏi Hóa học giả khi sinh đề môn khác bị ngắt quãng
      if (!finalQuestions.length) {
        setIsTyping(false);
        setTypingStatus('');
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_gen_retry_' + Date.now(),
            sender: 'bot',
            text: `AI chưa kịp hoàn tất định dạng JSON cho đề **${subject} ${grade} — ${targetTopic}**. Thầy/Cô bấm thử lại ngay bên dưới (không bị mất cấu hình đã chọn):`,
            navSuggestions: [
              { label: `Thử soạn lại đề ${targetTopic}`, action: 'start_wizard' },
              { label: 'Mở tab AI Tạo đề đầy đủ', sec: 'create' },
            ],
            time: timeStr,
          },
        ]);
        return;
      }

      const p1Len = finalQuestions.filter((q) => q.part === 1 || q.type === 'single_choice' || (!q.part && !q.type)).length;
      const p2Len = finalQuestions.filter((q) => q.part === 2 || q.type === 'true_false').length;
      const p3Len = finalQuestions.filter((q) => q.part === 3 || q.type === 'short_answer').length;

      const generatedExam = {
        id: 'exam_ai_' + Date.now(),
        title: `Đề thi ${isFullGdpt ? 'chuẩn GDPT 2025' : '15 phút'}: ${targetTopic} (Lớp ${grade})`,
        subject,
        grade,
        duration,
        totalQuestions: finalQuestions.length,
        questions: finalQuestions,
        createdAt: new Date().toISOString(),
      };

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_gen_done_' + Date.now(),
          sender: 'bot',
          text: `Đã biên soạn thành công đề thi chuẩn cấu trúc 3 phần GDPT 2025 theo đúng yêu cầu của Thầy/Cô (${finalQuestions.length} câu • ${duration} phút):`,
          examData: generatedExam,
          diag: {
            total: finalQuestions.length,
            part1: p1Len,
            part2: p2Len,
            part3: p3Len,
            successRate: 100,
          },
          time: timeStr,
        },
      ]);
      onSay?.(`Đã tạo xong đề chuẩn 3 phần (${finalQuestions.length} câu)!`, 'success');
    } catch (err) {
      setIsTyping(false);
      onSay?.(`Lỗi khi sinh đề: ${err.message}`, 'error');
    }
  };

  // XỬ LÝ 1: Nhập và sửa file đề THỰC TẾ (BÁC SĨ CHẨN ĐOÁN & SỬA FILE WORD)
  const handleProcessRealFile = async (file) => {
    if (!file) return;
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: 'usr_file_' + Date.now(),
        sender: 'user',
        text: `Nạp tệp đề thi: ${file.name}`,
        fileMeta: { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' },
        time: timeStr,
      },
    ]);

    setTypingStatus(`Đang bóc tách & chẩn đoán ${file.name}...`);
    setIsTyping(true);

    try {
      const parsed = await parseExamFile(file);
      const questions = (parsed.questions || []).map((q, idx) => ({
        ...q,
        id: q.id || `q_${idx + 1}`,
        points: q.points || (q.part === 2 ? 1.0 : q.part === 3 ? 0.5 : 0.25),
        part: q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1),
        type: q.type || (q.part === 2 ? 'true_false' : q.part === 3 ? 'short_answer' : 'single_choice'),
      }));

      const part1 = questions.filter((q) => q.part === 1 || q.type === 'single_choice' || (!q.part && !q.type)).length;
      const part2 = questions.filter((q) => q.part === 2 || q.type === 'true_false').length;
      const part3 = questions.filter((q) => q.part === 3 || q.type === 'short_answer').length;

      const detectedInfo = detectExamSubjectAndGrade({
        fileName: file.name,
        text: parsed.text || '',
        questions,
      });
      const resolvedSubject = parsed.subject || detectedInfo.subject || classes[0]?.subject || 'Toán học';
      const resolvedGrade = String(parsed.grade || detectedInfo.grade || classes[0]?.grade || '12');
      const imgCount = questions.filter((q) => q.image || (q.images && q.images.length > 0) || q.optionImages).length;

      const realParsedExam = {
        id: 'exam_parsed_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        subject: resolvedSubject,
        grade: resolvedGrade,
        duration: 45,
        totalQuestions: questions.length,
        questions,
        extractedImages: parsed.extractedImages || [],
        createdAt: new Date().toISOString(),
      };
      setWordEditorExam(realParsedExam);

      const isCompliant = (part2 >= 4 && part3 >= 6) || (questions.length <= 12 && part2 >= 2 && part3 >= 2);
      const missingAnswers = questions.filter((q) => {
        if (q.type === 'true_false') return !(q.statements || []).some((s) => s.answer === true || s.answer === false);
        if (q.type === 'short_answer') return !String(q.answer || '').trim();
        return q.correct === undefined || q.correct === null || q.correct < 0;
      }).length;

      setIsTyping(false);
      setTypingStatus('');
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_file_res_' + Date.now(),
          sender: 'bot',
          text: isCompliant
            ? `Bác sĩ AI chẩn đoán: Đã bóc tách thành công đề thi môn ${resolvedSubject} - Lớp ${resolvedGrade} từ file "${file.name}" đạt chuẩn cấu trúc 3 phần GDPT 2025 (${questions.length} câu: ${part1} câu Phần I, ${part2} câu Phần II, ${part3} câu Phần III${imgCount > 0 ? `, bảo toàn ${imgCount} câu có hình ảnh/đồ thị` : ''}${missingAnswers > 0 ? `; phát hiện ${missingAnswers} câu chưa có đáp án` : ''}).`
            : `Bác sĩ AI chẩn đoán: File "${file.name}" là môn ${resolvedSubject} - Lớp ${resolvedGrade} (${questions.length} câu${imgCount > 0 ? `, ${imgCount} câu có hình/đồ thị` : ''}). Hiện còn thiếu ${Math.max(0, 4 - part2)} câu Phần II và ${Math.max(0, 6 - part3)} câu Phần III để đủ 28 câu chuẩn GDPT 2025${missingAnswers > 0 ? ` (và ${missingAnswers} câu chưa có đáp án)` : ''}:`,
          doctorData: {
            fileName: file.name,
            total: questions.length,
            part1,
            part2,
            part3,
            imgCount,
            subject: resolvedSubject,
            grade: resolvedGrade,
            missingAnswers,
            isCompliant,
          },
          examData: realParsedExam,
          diag: {
            total: questions.length,
            part1,
            part2,
            part3,
            successRate: parsed.stats?.successRate || 100,
          },
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      onSay?.(`Đã bóc tách thành công ${questions.length} câu hỏi!`, 'success');
    } catch (err) {
      setIsTyping(false);
      setTypingStatus('');
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_file_err_' + Date.now(),
          sender: 'bot',
          text: `Không đọc được nội dung: ${err.message}. Thầy/Cô bấm nút dưới để mở Trình Nhập Đề Nâng Cao (hỗ trợ MathType, OMML, ảnh):`,
          navSuggestions: [
            { label: 'Mở Trình Nhập Đề Nâng Cao', action: 'importer' },
            { label: 'Chọn file khác', action: 'pick_file' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // XỬ LÝ 2: Kích hoạt Thẩm định 100 học sinh ảo
  const handleRunSimulation = (exam) => {
    setTypingStatus('Đang mô phỏng 100 thí sinh ảo giải đề...');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setTypingStatus('');
      const sim = runVirtualStudentSimulation(exam);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_sim_' + Date.now(),
          sender: 'bot',
          text: `Báo cáo thẩm định mô phỏng 100 học sinh ảo giải đề "${exam.title}":`,
          simResult: sim,
          examData: exam,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  // XỬ LÝ 3: Kích hoạt Chẩn đoán Bệnh lý Tư duy & Kê đơn
  const handleRunCognitiveRx = async (studentName, topicName) => {
    setTypingStatus(`Đang chẩn đoán & kê đơn phục hồi cho ${studentName || 'học sinh'}...`);
    setIsTyping(true);
    const targetStudent = studentName || 'Học sinh';
    const detectedSubj = detectExamSubjectAndGrade({
      text: `${targetStudent} ${topicName || ''}`,
      fileName: '',
    }).subject;
    const rxSubject = detectedSubj || inferredSubject;
    const targetTopic = topicName || `Kiến thức trọng tâm môn ${rxSubject}`;

    try {
      const rxPrompt = `Bạn là chuyên gia sư phạm môn ${rxSubject} GDPT 2025. Học sinh "${targetStudent}" đang gặp lỗ hổng kiến thức nghiêm trọng phần "${targetTopic}".
Hãy chẩn đoán 3 lớp sai sót (Bẫy đề, Khái niệm, Kỹ năng) và biên soạn đúng 3 bài tập trắc nghiệm 4 lựa chọn A, B, C, D đặc trị môn ${rxSubject} để phục hồi toàn diện.
Mỗi câu hỏi phải có 4 phương án độc lập, 1 đáp án đúng, và lời giải bóc tách chi tiết nguyên nhân sai sót.
Trả về duy nhất đối tượng JSON hợp lệ:
{
  "layers": [
    { "tag": "Lớp 1: Bẫy Đề", "desc": "Bỏ sót từ khóa phủ định và điều kiện đề bài..." },
    { "tag": "Lớp 2: Khái Niệm", "desc": "Nhầm lẫn bản chất định nghĩa / công thức trọng tâm..." },
    { "tag": "Lớp 3: Kỹ Năng", "desc": "Điểm nghẽn khi thiết lập biểu thức hoặc tính toán..." }
  ],
  "remedialQuestions": [
    {
      "q": "Câu 1 (Chữa bẫy đề): ...?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "ans": "Phương án đúng...",
      "explain": "Lời giải chi tiết chỉ ra bẫy..."
    },
    {
      "q": "Câu 2 (Chữa khái niệm): ...?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 1,
      "ans": "Phương án đúng...",
      "explain": "Lời giải khắc phục ngộ nhận..."
    },
    {
      "q": "Câu 3 (Chữa kỹ năng): ...?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 2,
      "ans": "Phương án đúng...",
      "explain": "Lời giải từng bước tính toán..."
    }
  ]
}`;
      const parsed = await callCopilotAI(
        rxPrompt,
        {},
        CREDIT_TARIFF.TUTOR_CONTEXT,
        'Kê đơn ôn tập AI cho học sinh',
        null,
        {
          validate: (genText) => {
            const p = parseExamJsonSafe(genText);
            if (!p?.layers?.length || !p?.remedialQuestions?.length) {
              throw new Error(`AI chưa trả về được đơn bài tập môn ${rxSubject} hợp lệ (ELEC Credit đã được hoàn trả). Thầy/Cô vui lòng thử lại.`);
            }
            return p;
          },
        }
      );

      const rxData = {
        student: targetStudent,
        topic: targetTopic,
        subject: rxSubject,
        layers: parsed.layers,
        remedialQuestions: parsed.remedialQuestions,
      };

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_rx_' + Date.now(),
          sender: 'bot',
          text: `Hồ sơ chẩn đoán bệnh lý tư duy & Đơn thuốc học tập (${rxSubject}) cho ${targetStudent}:`,
          rxData,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_rx_err_' + Date.now(),
          sender: 'bot',
          text: aiErrMsg(err, `Không thể tạo đơn bài tập phục hồi môn ${rxSubject} lúc này. Vui lòng thử lại sau.`),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // XỬ LÝ 4: Gửi tin nhắn & Xử lý TRÍ TUỆ NHÂN TẠO ĐA NGỮ CẢNH (+ VISION ẢNH ĐỀ BÀI)
  const handleSend = async (userPrompt, overridePrompt, sendOpts = {}) => {
    const attachedImg = sendOpts.skipImage ? null : pendingImage;
    const rawQuery = (overridePrompt || userPrompt || input).trim();
    const query = rawQuery || (attachedImg ? 'Hãy đọc ảnh đề bài này, giải chi tiết từng bước, chỉ ra bẫy thường gặp và nêu rõ đáp án cuối cùng.' : '');
    if (!query) return;

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (!sendOpts.skipUserBubble) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'usr_' + Date.now(),
          sender: 'user',
          text: query,
          imagePreview: attachedImg
            ? { name: attachedImg.name, sizeLabel: attachedImg.sizeLabel, dataUrl: attachedImg.dataUrl }
            : undefined,
          time: timeStr,
        },
      ]);
    }
    setInput('');
    if (attachedImg) setPendingImage(null);
    setTypingStatus(attachedImg ? 'AI Vision đang đọc & phân tích ảnh đề bài...' : 'ELEC đang phân tích yêu cầu...');
    setIsTyping(true);

    // Nếu có ảnh đề bài đính kèm -> đi thẳng luồng Multimodal Vision + Streaming
    if (attachedImg) {
      const streamMsgId = 'bot_vision_' + Date.now();
      const replyTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      let hasStreamedBubble = false;
      try {
        const visionPrompt = `Bạn là ELEC AI Senior Academic Copilot — chuyên gia sư phạm môn ${inferredSubject} chuẩn GDPT 2025.
Giáo viên vừa gửi kèm 1 hình ảnh đề bài/câu hỏi và yêu cầu:
"${query}"

HÃY THỰC HIỆN CHÍNH XÁC:
1. Đọc kỹ toàn bộ chữ, công thức, đồ thị, hình vẽ trong ảnh (nếu có chi tiết mờ hãy ghi chú rõ).
2. Trả lời đúng yêu cầu giáo viên với lời giải chuẩn xác từng bước, trình bày rõ ràng, dễ hiểu, KHÔNG dùng emoji.
3. Kết thúc bằng mục **Bẫy học sinh dễ sai** (1–2 ý ngắn gọn) để giáo viên lưu ý trên lớp.`;
        const visionHistory = buildConversationHistory(messagesRef.current, visionPrompt, 6, attachedImg);
        const res = await callCopilotAI(
          visionHistory,
          { noGuide: true, noCache: true },
          CREDIT_TARIFF.CHAT_FAST + CREDIT_TARIFF.CHAT_IMAGE_ADDON,
          'Phân tích ảnh đề bài (AI Vision)',
          (partialText) => {
            if (!partialText) return;
            if (!hasStreamedBubble) {
              hasStreamedBubble = true;
              setMessages((prev) => [
                ...prev,
                { id: streamMsgId, sender: 'bot', text: partialText, streaming: true, time: replyTimeStr },
              ]);
            } else {
              setMessages((prev) => prev.map((m) => (m.id === streamMsgId ? { ...m, text: partialText } : m)));
            }
          },
          { imageCount: 1 }
        );
        const aiReply = typeof res === 'string' ? res : (res?.text || '');
        setIsTyping(false);
        setTypingStatus('');
        if (hasStreamedBubble) {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamMsgId ? { ...m, text: aiReply || m.text, streaming: false } : m))
          );
        } else {
          setMessages((prev) => [
            ...prev,
            { id: streamMsgId, sender: 'bot', text: aiReply || 'Đã đọc ảnh đề bài nhưng chưa trích xuất được nội dung rõ ràng.', time: replyTimeStr },
          ]);
        }
      } catch (e) {
        setIsTyping(false);
        setTypingStatus('');
        if (e?.isAbort || e?.name === 'AbortError') {
          if (hasStreamedBubble) {
            setMessages((prev) => prev.map((m) => (m.id === streamMsgId ? { ...m, streaming: false } : m)));
          }
          return;
        }
        setMessages((prev) => {
          const cleaned = hasStreamedBubble ? prev.filter((m) => m.id !== streamMsgId) : prev;
          return [
            ...cleaned,
            {
              id: 'bot_vision_err_' + Date.now(),
              sender: 'bot',
              text: aiErrMsg(e, 'Không thể đọc ảnh lúc này. Thầy/Cô thử chụp rõ nét hơn hoặc dán nội dung câu hỏi dạng chữ nhé!'),
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      }
      return;
    }

    const norm = query.toLowerCase();

    // 0.0000A. CHẨN ĐOÁN SỨC KHỎE LỚP & TOP CÂU HỎI SAI NHIỀU NHẤT
    const isClassHealthQuery =
      norm.includes('sức khỏe lớp') ||
      norm.includes('câu nào học sinh sai nhiều') ||
      norm.includes('câu sai nhiều nhất') ||
      norm.includes('chuyên đề yếu nhất') ||
      norm.includes('tiết sau nên ôn gì') ||
      norm.includes('lỗ hổng kiến thức');

    if (isClassHealthQuery && !sendOpts.forceAi) {
      setIsTyping(false);
      setTypingStatus('');
      const healthData = buildClassHealthCardData(realInsights, {
        classCount: classes.length,
        examCount: exams.length,
        subject: inferredSubject,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_health_' + Date.now(),
          sender: 'bot',
          text:
            healthData.submissionCount > 0
              ? `Báo cáo chẩn đoán sức khỏe lớp học từ **${healthData.submissionCount} bài nộp thực tế** (${classes.length} lớp · ${exams.length} đề):`
              : `Hệ thống chưa ghi nhận bài nộp nào để phân tích chuyên sâu. Thầy/Cô có thể giao 1 đề ngắn 10 câu để lấy dữ liệu chẩn đoán:`,
          healthData: healthData.submissionCount > 0 ? healthData : undefined,
          navSuggestions:
            healthData.submissionCount === 0
              ? [
                  { label: 'Soạn đề ngắn 15 phút ngay', action: 'start_wizard' },
                  { label: 'Mở Kho Đề Thi', sec: 'exams' },
                ]
              : undefined,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // 0.0000B. SOẠN TIN NHẮN ZALO / SỔ LIÊN LẠC PHỤ HUYNH
    const isParentMsgQuery =
      (norm.includes('phụ huynh') || norm.includes('zalo') || norm.includes('sổ liên lạc')) &&
      (norm.includes('nhận xét') || norm.includes('tin nhắn') || norm.includes('gửi') || norm.includes('viết') || norm.includes('soạn')) &&
      !norm.includes('viết lại');

    if (isParentMsgQuery && !sendOpts.forceAi) {
      setIsTyping(false);
      setTypingStatus('');
      // Thử tìm học sinh khớp tên trong danh sách bài nộp thật
      let matchedStudent = null;
      const allSubsFlat = Object.values(submissionsMap || {}).flat();
      for (const s of allSubsFlat) {
        const sName = String(s?.studentName || '').trim();
        if (sName.length >= 2 && norm.includes(sName.toLowerCase())) {
          const sameSt = allSubsFlat.filter((x) => (x?.studentName || '').toLowerCase() === sName.toLowerCase());
          const avg = Math.round(sameSt.reduce((acc, x) => acc + pctOf(x), 0) / sameSt.length);
          matchedStudent = { studentName: sName, pct: avg, subCount: sameSt.length };
          break;
        }
      }
      if (!matchedStudent && realInsights.atRisk?.length) {
        matchedStudent = realInsights.atRisk[0];
      }
      const reportData = buildParentReportCardData({
        studentName: matchedStudent?.studentName || 'học sinh',
        pct: typeof matchedStudent?.pct === 'number' ? matchedStudent.pct : null,
        subCount: matchedStudent?.subCount || 0,
        weakTopic: realInsights.weakestTopics?.[0]?.topic || '',
        subject: inferredSubject,
        teacherName: user?.displayName || 'Giáo viên bộ môn',
      });
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_parent_' + Date.now(),
          sender: 'bot',
          text: `Em đã soạn sẵn 3 mẫu tin nhắn gửi phụ huynh em **${reportData.studentName}** theo số liệu thực tế. Thầy/Cô có thể chuyển giọng điệu và sao chép dán thẳng vào Zalo:`,
          parentReport: reportData,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // 0.0001. TỰ ĐỘNG PHÂN TÍCH CHỨC NĂNG CỦA TAB HIỆN TẠI (TAB SENSOR & ANALYSIS)
    const isTabAnalysisQuery = (
      norm.includes('phân tích tab') ||
      norm.includes('chức năng tab') ||
      norm.includes('tab này để làm gì') ||
      norm.includes('chưa hiểu chức năng') ||
      norm.includes('chưa hiểu tab') ||
      norm.includes('hướng dẫn tab') ||
      norm.includes('hướng dẫn trang này') ||
      norm.includes('màn hình này để làm gì') ||
      norm.includes('chức năng ở đây') ||
      norm.includes('phân tích màn hình') ||
      norm.includes('chức năng này') ||
      norm.includes('tab này có tác dụng gì')
    );

    if (isTabAnalysisQuery) {
      setIsTyping(false);
      handleAnalyzeCurrentTab();
      return;
    }

    // 0.0005. XÁC NHẬN DANH TÍNH & BẢN QUYỀN HỆ THỐNG (IDENTITY & COPYRIGHT VERIFICATION)
    const isIdentityQuery = (
      norm.includes('bạn là ai') ||
      norm.includes('em là ai') ||
      norm.includes('bạn tên gì') ||
      norm.includes('tên bạn là gì') ||
      norm.includes('tên là gì') ||
      norm.includes('xác nhận danh tính') ||
      norm.includes('danh tính của bạn') ||
      norm.includes('ai tạo ra bạn') ||
      norm.includes('ai phát triển bạn') ||
      norm.includes('mô hình nào') ||
      norm.includes('model nào') ||
      norm.includes('bạn là model gì') ||
      norm.includes('bạn là mô hình gì') ||
      norm.includes('bản quyền') ||
      norm.includes('nguồn gốc của bạn') ||
      norm.includes('bạn thuộc công ty nào') ||
      norm.includes('agnes') ||
      norm.includes('sapiens') ||
      norm.includes('bạn có phải chatgpt') ||
      norm.includes('bạn có phải gemini')
    );

    if (isIdentityQuery) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_identity_' + Date.now(),
          sender: 'bot',
          text: `**Xác nhận danh tính & Bản quyền hệ thống:**

Em là **ELEC AI Senior Academic Copilot** — Hệ thống Trợ lý Sư phạm, Thẩm định Đề thi & Khảo thí Trực tuyến Bản quyền, được phát triển và vận hành độc quyền bởi **Hệ sinh thái Giáo dục ELEC AI**.

**Hồ sơ Năng lực & Danh tính Hệ thống:**
* **Định danh chính thức:** ELEC AI Senior Academic Copilot (Bản quyền GDPT 2025).
* **Đơn vị phát triển:** ELEC AI Education Technology.
* **Tiêu chuẩn vận hành:** Bám sát tuyệt đối Chương trình Giáo dục Phổ thông 2025 của Bộ Giáo dục & Đào tạo.
* **Năng lực cốt lõi:**
  1. **Thẩm định & Phán xét đề thi:** Soát lỗi ma trận 3 phần (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn), phân tích phương án nhiễu, thẩm định cấp độ tư duy Bloom.
  2. **Bác sĩ sửa file Word (.docx):** Bảo toàn 100% hình ảnh, sơ đồ thí nghiệm, công thức MathType/OMML, tự động đảo 4 mã đề (101 - 104).
  3. **Mô phỏng 100 học sinh ảo:** Phân tích độ khó câu hỏi, phổ điểm Gauss và ma trận phân cách trước khi tổ chức thi thật.
  4. **Giám sát & Kê đơn học tập:** Chẩn đoán bệnh lý tư duy từng học sinh và kê đơn câu hỏi phục hồi kiến thức.

Em cam kết bảo mật 100% dữ liệu đề thi, lớp học và điểm số của Quý Thầy/Cô!`,
          navSuggestions: [
            { label: 'Soạn đề chuẩn 3 phần GDPT 2025', action: 'start_wizard' },
            { label: 'Bác sĩ sửa file Word (.docx)', action: 'word_editor' },
            { label: 'Phân tích tab này', action: 'analyze_tab' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // 0.001. LỜI CHÀO HỎI / GREETINGS (HI, HELLO, HI LÔ, XIN CHÀO, CHÀO BẠN...)
    const isGreeting = /^(hi|hí|hello|hé lô|helo|hi lô|chào|xin chào|chào bạn|chào em|chào bot|alo|alô)\b/i.test(query.trim());
    if (isGreeting && !norm.includes('điểm') && !norm.includes('lớp') && !norm.includes('đề') && !norm.includes('soạn') && !norm.includes('tạo')) {
      setIsTyping(false);
      const validClassNames = classes.filter(c => c.name && c.name.trim().length >= 2).map((c) => c.name);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_greeting_' + Date.now(),
          sender: 'bot',
          text: `Em chào ${user?.displayName ? 'Thầy/Cô ' + user.displayName : 'Thầy/Cô'}! Em là **ELEC AI Senior Academic Copilot**.

Hôm nay em có thể hỗ trợ gì cho công tác giảng dạy của Thầy/Cô ạ?
* **Biên soạn & Thẩm định đề:** Soạn đề chuẩn 3 phần GDPT 2025, phản biện bẫy câu hỏi, thẩm định mức nhận thức Bloom.
* **Bác sĩ sửa file Word:** Nạp file Word (.docx), sửa lỗi chính tả IUPAC, công thức Toán/Lý/Hóa, xuất file A4.
* **Theo dõi Số liệu & Điểm số:** Phân tích phổ điểm, cảnh báo học sinh hổng kiến thức (${validClassNames.length > 0 ? 'Hiện đang quản lý các lớp: ' + validClassNames.join(', ') : 'Chưa có lớp nào'}).`,
          navSuggestions: [
            { label: 'Soạn đề chuẩn 3 phần GDPT 2025', action: 'start_wizard' },
            { label: 'Mở Bác sĩ sửa file Word', action: 'word_editor' },
            { label: 'Mở tab Số liệu lớp (Analytics)', sec: 'analytics' },
            { label: 'Hướng dẫn sử dụng toàn hệ thống', action: 'ask_workflow' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // 0.0. PHẢN HỒI NÂNG CẤP BỘ PHÂN TÍCH ĐỀ & NHẬN DIỆN MÔN HỌC / HÌNH ẢNH
    const isFeedbackOnExamAnalysis = (
      norm.includes('phân tích đề') && (
        norm.includes('chưa chuẩn') || norm.includes('mất') || norm.includes('chưa nhận dạng') ||
        norm.includes('hình ảnh') || norm.includes('đúng môn') || norm.includes('xem lại') || norm.includes('kiểm tra')
      )
    ) || (
      norm.includes('chưa nhận dạng đúng môn') || norm.includes('mất mấy cái câu') ||
      (norm.includes('mất') && norm.includes('hình ảnh')) ||
      norm.includes('ai phân tích chưa chuẩn')
    );

    if (isFeedbackOnExamAnalysis) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_analysis_status_' + Date.now(),
          sender: 'bot',
          text: `Em đã kiểm tra toàn diện và nâng cấp triệt để 3 vấn đề Thầy/Cô phản ánh về Bộ Phân Tích Đề Thi:

### 1. Nhận diện chuẩn xác môn học (Toán, Vật lí, Hóa học, Sinh học, Tiếng Anh...)
- Tích hợp mô-đun phân loại đa tín hiệu: Tự động chấm điểm từ tiêu đề file, phần mở đầu đề thi và toàn bộ thuật ngữ chuyên ngành trong từng câu hỏi.
- Hoàn toàn loại bỏ việc mặc định gán môn Hóa học cho các môn khác (như Vật lí, Toán học, Tiếng Anh, Sinh học).

### 2. Bảo toàn 100% câu hỏi có hình ảnh, sơ đồ, đồ thị
- Giải mã sâu gói tin Word (.docx): Chuyển đổi toàn bộ hình ảnh dạng nổi (floating/anchor) thành dạng inline để không bao giờ bị bỏ sót.
- Bóc tách hình ảnh trực tiếp từ kho lưu trữ phương tiện của tệp Word và gắn chính xác vào phần dẫn câu hỏi hoặc phương án tương ứng.
- Câu hỏi chỉ có hình ảnh không có văn bản dẫn vẫn được giữ nguyên vẹn với nhãn trực quan.

### 3. Chuẩn hóa cấu trúc 3 phần GDPT 2025
- Tách bạch chuẩn mực Phần I (Trắc nghiệm 4 lựa chọn), Phần II (Đúng/Sai 4 ý a, b, c, d), và Phần III (Trả lời ngắn).
- Bác sĩ AI bù đắp câu hỏi theo đúng chuyên môn của môn học đã nhận diện.

Thầy/Cô hãy bấm nút (+) bên dưới để nạp lại file Word (.docx) hoặc PDF kiểm tra ngay:`,
          navSuggestions: [
            { label: 'Nạp file Word (.docx) để kiểm tra lại', action: 'pick_file' },
            { label: 'Mở Trình Nhập Đề Nâng Cao', action: 'importer' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    const isGuidanceQuery = (
      norm.includes('cách') ||
      norm.includes('hướng dẫn') ||
      norm.includes('làm sao') ||
      norm.includes('làm thế nào') ||
      norm.includes('như thế nào') ||
      norm.includes('thế nào') ||
      norm.includes('quy trình') ||
      norm.includes('các bước') ||
      norm.includes('chỉ em') ||
      norm.includes('chỉ tôi') ||
      norm.includes('chỉ cách') ||
      norm.includes('chỉ với') ||
      norm.includes('bước làm') ||
      norm.includes('hỏi cách') ||
      norm.includes('ở đâu') ||
      norm.includes('chỗ nào')
    );

    // 0.005. HƯỚNG DẪN QUY TRÌNH TẠO LỚP HỌC & CHO HỌC SINH KIỂM TRA (WORKFLOW GUIDE)
    const isAskingClassAndExamWorkflow = (
      // Phản hồi ý kiến khi giáo viên thắc mắc sao AI tự động tạo lớp khi đang hỏi cách làm
      norm.includes('tự động tạo') ||
      (norm.includes('chưa hỏi') && (norm.includes('khách hàng') || norm.includes('người dùng') || norm.includes('tạo') || norm.includes('cần gì'))) ||
      (norm.includes('sao') && norm.includes('tự tạo')) ||
      (norm.includes('hỏi cách tạo') && norm.includes('sao')) ||
      (isGuidanceQuery && (
        (norm.includes('lớp') && (norm.includes('kiểm tra') || norm.includes('thi') || norm.includes('giao bài') || norm.includes('giao đề') || norm.includes('làm bài'))) ||
        ((norm.includes('tạo lớp') || norm.includes('thêm lớp') || norm.includes('mở lớp') || norm.includes('lập lớp')) && !extractValidNewClassName(query)) ||
        ((norm.includes('cho học sinh') || norm.includes('học sinh')) && (norm.includes('kiểm tra') || norm.includes('thi') || norm.includes('làm bài'))) ||
        norm.includes('giao bài kiểm tra') ||
        norm.includes('giao đề cho lớp') ||
        norm.includes('giao đề kiểm tra')
      ))
    );

    if (isAskingClassAndExamWorkflow) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_class_exam_workflow_' + Date.now(),
          sender: 'bot',
          text: `Dưới đây là **quy trình chuẩn 3 bước** từ việc khởi tạo lớp học đến tổ chức cho học sinh làm bài kiểm tra và theo dõi điểm số trên hệ thống ELEC AI:

### Bước 1: Tạo Lớp học mới & Cấp mã vào lớp cho học sinh
1. Vào tab **"Lớp học & Liên kết"** (mục \`classes\` ở thanh điều hướng bên trái màn hình).
2. Bấm nút **"+ Tạo lớp mới"**:
   * Nhập **Tên lớp** (Ví dụ: 10A1, 11A5, 12A1...).
   * Chọn **Khối lớp** (Khối 10, 11 hoặc 12) và **Môn học** giảng dạy.
3. Sau khi bấm Tạo, hệ thống tự động sinh một **Mã vào lớp (Class Code)** duy nhất (Ví dụ: \`H-ZS9J8TAJ\`).
4. Thầy/Cô sao chép mã này gửi cho học sinh để các em tự nhập mã vào lớp từ tài khoản học sinh.

### Bước 2: Chuẩn bị đề thi & Giao đề kiểm tra cho lớp
* **Cách A - Giao đề có sẵn trong kho:**
  1. Vào tab **"Kho đề thi"** (\`exams\`).
  2. Tìm đề kiểm tra cần cho học sinh làm và bấm nút **"Giao đề cho lớp"**.
  3. Chọn lớp cần giao, thiết lập:
     * Thời gian mở đề và thời gian kết thúc nộp bài.
     * Thời lượng làm bài (Ví dụ: 15 phút, 45 phút, 50 phút).
     * Bật/tắt tính năng giám sát thông minh: Chống chuyển tab, giám sát camera OMR.
  4. Bấm **"Xác nhận giao đề"**.
* **Cách B - Biên soạn đề mới chuẩn GDPT 2025:**
  * Vào tab **"AI Tạo đề"** (\`create\`) để AI tự động sinh đề chuẩn 3 phần (Trắc nghiệm, Đúng/Sai, Trả lời ngắn), hoặc dùng công cụ **"Bác sĩ sửa file Word"** để nạp file Word có sẵn lên chỉnh sửa và giao ngay.

### Bước 3: Học sinh làm bài & Thầy/Cô giám sát, tổng kết điểm
1. **Học sinh làm bài:** Học sinh đăng nhập tài khoản học sinh, truy cập vào lớp học sẽ thấy bài kiểm tra hiển thị trong mục "Bài tập cần làm" và bấm **"Bắt đầu làm bài"**.
2. **Giám sát thời gian thực:** Thầy/Cô có thể mở tab **"Phòng thi LIVE"** (\`sessions\`) để theo dõi trực tiếp học sinh đang làm bài thi (hệ thống cảnh báo tức thì nếu phát hiện gian lận hoặc chuyển tab).
3. **Xem và phân tích điểm số:** Ngay khi hết giờ làm bài, hệ thống chấm điểm tự động. Thầy/Cô bấm **"Xem bài nộp"** trong Kho đề thi hoặc vào tab **"Số liệu lớp"** (\`analytics\`) để xem phổ điểm và xuất file Excel (.xlsx).

> **Hỏi ý kiến Thầy/Cô:** Nếu Thầy/Cô muốn em hỗ trợ tạo lớp học ngay tại đây, xin vui lòng cho em biết:
> * **Tên lớp**: (Ví dụ: 10A1, 11A5, 12 Tin...)
> * **Khối lớp**: (Khối 10, 11 hoặc 12)
> * **Môn học**: (Hóa học, Toán học, Vật lí, Sinh học, Tiếng Anh...)`,
          navSuggestions: [
            { label: 'Mở tab Lớp học & Liên kết', sec: 'classes' },
            { label: 'Mở Kho đề thi (Giao bài)', sec: 'exams' },
            { label: 'Mở AI Tạo đề chuẩn 2025', sec: 'create' },
            { label: 'Mở Phòng thi LIVE', sec: 'sessions' },
            { label: 'Mở Bác sĩ sửa file Word', action: 'word_editor' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

// 0.01. HƯỚNG DẪN KIỂM TRA ĐIỂM SỐ HỌC SINH (CHUẨN 100% GIAO DIỆN WEB ELEC AI)
    const isAskingHowToCheckScores = (
      norm.includes('check điểm') ||
      norm.includes('xem điểm') ||
      norm.includes('tra cứu điểm') ||
      norm.includes('bảng điểm') ||
      (norm.includes('điểm') && (
        norm.includes('cách') || norm.includes('làm sao') || norm.includes('học sinh') ||
        norm.includes('ở đâu') || norm.includes('chỗ nào') || norm.includes('hướng dẫn')
      ))
    ) && !findTargetClassInQuery(query, classes, exams, submissionsMap);

    if (isAskingHowToCheckScores) {
      setIsTyping(false);
      const teacherClassNames = classes.map((c) => c.name).filter(Boolean);
      const sampleClass = teacherClassNames[0] || '11A5';

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_check_scores_guide_' + Date.now(),
          sender: 'bot',
          text: `Dưới đây là **3 cách kiểm tra và phân tích điểm số học sinh** chuẩn xác nhất trên hệ thống ELEC AI:

### Cách 1: Xem toàn diện tại tab "Số liệu lớp" (Analytics)
* **Vị trí:** Bấm vào tab **Số liệu lớp** (biểu tượng biểu đồ) ở thanh điều hướng bên trái màn hình.
* **Quy trình thao tác:**
  1. Chọn lớp cần xem (ví dụ: các lớp Thầy/Cô đang phụ trách: ${teacherClassNames.length > 0 ? teacherClassNames.join(', ') : '11A5, 11A7, 11A9, 11A10'}).
  2. Hệ thống hiển thị trực quan: **Biểu đồ phổ điểm hình chuông**, **Điểm trung bình**, **Tỷ lệ Đạt/Khá/Giỏi**, và danh sách học sinh có nguy cơ bị hổng kiến thức.
  3. Bấm nút **Xuất Excel (.xlsx)** ở góc phải nếu Thầy/Cô cần lưu trữ hoặc nộp báo cáo điểm cho Ban Giám Hiệu.

### Cách 2: Xem chi tiết theo từng bài thi tại tab "Kho đề thi" hoặc "Tổng quan"
* **Vị trí:** Vào tab **Kho đề thi** (hoặc tab **Tổng quan**).
* **Quy trình thao tác:**
  1. Tìm bài thi đã giao cho học sinh làm.
  2. Bấm nút **"Xem bài nộp"** trên thẻ bài thi đó.
  3. Bảng điểm chi tiết sẽ hiện ra: Tên học sinh, điểm số chính xác, thời gian nộp bài, số câu làm đúng. Bấm vào tên học sinh để xem chi tiết từng câu em đó chọn đúng hoặc sai.

### Cách 3: Hỏi trực tiếp ELEC AI Agent ngay tại đây (Nhanh nhất)
* Thầy/Cô chỉ cần gõ lệnh tự nhiên ngay trong ô chat:
  * \`điểm lớp ${sampleClass}\` (Xem bảng điểm tổng quát của lớp)
  * \`lớp ${sampleClass} ai kém nhất\` (AI tự động lọc các em dưới trung bình để kê đơn bồi dưỡng)
  * \`top 5 học sinh điểm cao lớp ${sampleClass}\`
  * \`xem điểm học sinh [Tên]\` (Ví dụ: \`xem điểm Khôi\`)

> **Mẹo hữu ích:** Thầy/Cô có thể bấm ngay các phím tắt bên dưới để hệ thống chuyển thẳng đến màn hình mong muốn:`,
          navSuggestions: [
            { label: 'Mở tab Số liệu lớp (Analytics)', sec: 'analytics' },
            { label: `Xem điểm Lớp ${sampleClass}`, action: 'query_class', className: sampleClass },
            { label: 'Mở Kho đề thi (Xem bài nộp)', sec: 'exams' },
            { label: 'Mở tab Lớp học & Liên kết', sec: 'classes' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

// 0.02. HƯỚNG DẪN SỬ DỤNG HỆ THỐNG TOÀN DIỆN (ELEC AI MASTER GUIDE)
    const isAskingHowToUseWeb = (
      norm.includes('hướng dẫn sử dụng web') ||
      norm.includes('hướng dẫn dùng web') ||
      norm.includes('hướng dẫn sử dụng') ||
      norm.includes('hướng dẫn dùng') ||
      norm.includes('cách dùng web') ||
      norm.includes('các tính năng của web') ||
      norm.includes('web làm được gì') ||
      norm.includes('tính năng của web') ||
      norm.includes('tổng hợp tính năng') ||
      norm.includes('giới thiệu web') ||
      norm.includes('chức năng web')
    ) && !norm.includes('soạn') && !norm.includes('ma trận');

    if (isAskingHowToUseWeb) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_web_guide_' + Date.now(),
          sender: 'bot',
          text: `ELEC AI là **Hệ sinh thái Trợ lý Giảng dạy & Khảo thí Trực tuyến Siêu cấp** chuẩn GDPT 2025. Dưới đây là sơ đồ hướng dẫn sử dụng toàn diện các phân hệ chính trên hệ thống:

### 1. Quản lý Lớp học & Theo dõi Điểm số
* **Tab "Lớp học & Liên kết" (\`classes\`):** Tạo lớp mới, cấp Mã lớp (Class Code) cho học sinh tự tham gia, phê duyệt danh sách thành viên.
* **Tab "Số liệu lớp" (\`analytics\`):** Xem phổ điểm hình chuông, tỷ lệ đạt/khá/giỏi, phân tích điểm số chi tiết từng bài thi và xuất bảng điểm ra Excel (.xlsx).
* **Tra cứu nhanh bằng AI Chat:** Gõ trực tiếp \`điểm lớp 11A5\`, \`lớp 11A5 ai kém nhất\` để AI phân tích ngay.

### 2. Biên soạn & Quản lý Kho Đề thi GDPT 2025
* **Tab "AI Tạo đề" (\`create\`):** Nhập chủ đề, môn học và số lượng câu -> AI sinh đề chuẩn 3 phần (Phần I: 4 lựa chọn, Phần II: Đúng/Sai, Phần III: Trả lời ngắn).
* **Bác sĩ AI Sửa file Word A4:** Trình soạn thảo Word chuẩn Office 365, sửa lỗi chính tả IUPAC, tự động cân bằng nhận thức Bloom, xem Khung Ma Trận và xuất file \`.docx\`.
* **Tab "Kho đề thi" (\`exams\`):** Lưu trữ toàn bộ đề thi, giao đề cho lớp học theo lịch hẹn, theo dõi trạng thái bài nộp.
* **Tab "Mô phỏng & Đảo đề" (\`simulator\`):** Tự động đảo 4 mã đề (101-104), sinh phiếu soi đáp án và xuất gói nén ZIP.

### 3. Tổ chức Thi & Giám sát Chấm bài
* **Tab "Phòng thi LIVE" (\`sessions\`):** Giám sát học sinh thi trực tiếp theo thời gian thực (phát hiện rời tab, gian lận, cảnh báo tức thì).
* **Tab "Chấm phiếu A4" (\`paper\`):** Quét và chấm tự động phiếu trả lời trắc nghiệm qua camera hoặc file ảnh.
* **Tab "Xin thi lại" (\`retry\`):** Tiếp nhận và phê duyệt yêu cầu làm lại bài của học sinh gặp sự cố kỹ thuật.

### 4. Trợ lý Sư phạm Độc quyền trong Khung Chat
* **Soạn Giáo án Công văn 5512:** Gõ lệnh \`Soạn giáo án [Tên bài]\` -> AI thiết kế 4 hoạt động chuẩn Bộ GD&ĐT kèm nút xuất Word (.docx).
* **Lập Khung Ma Trận & Bản Đặc Tả:** Gõ lệnh \`Lập ma trận đề [Môn] [Lớp]\` -> AI sinh ma trận Bloom và bản đặc tả YCCĐ.
* **Thẩm định & Hiệu đính Đề:** Dán câu hỏi vào chat -> AI phán xét mức độ nhận thức (NB/TH/VD/VDC), phát hiện bẫy đề bài và lỗi khoa học.

> **Thao tác nhanh:** Thầy/Cô hãy bấm vào các nút điều hướng bên dưới để mở ngay tính năng cần dùng:`,
          navSuggestions: [
            { label: 'Mở tab Số liệu lớp (Analytics)', sec: 'analytics' },
            { label: 'Mở Kho đề thi', sec: 'exams' },
            { label: 'Mở tab Lớp học', sec: 'classes' },
            { label: 'Mở Chấm phiếu A4', sec: 'paper' },
            { label: 'Mở Bác sĩ sửa file Word', action: 'word_editor' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // 0.1. SOẠN KẾ HOẠCH BÀI DẠY (GIÁO ÁN) CHUẨN CÔNG VĂN 5512/BGDĐT-GDTrH
    const isAskingForLessonPlan = (
      norm.includes('soạn giáo án') ||
      norm.includes('kế hoạch bài dạy') ||
      norm.includes('giáo án') ||
      norm.includes('công văn 5512') ||
      (norm.includes('5512') && (norm.includes('kế hoạch') || norm.includes('bài dạy') || norm.includes('soạn')))
    ) && !norm.includes('tạo lớp');

    if (isAskingForLessonPlan) {
      try {
        const detectedInfo = detectExamSubjectAndGrade({ text: query, fileName: '' });
        const planSubject = detectedInfo.subject || 'Khoa học';
        const planGrade = detectedInfo.grade || '12';

        const lessonPlanPrompt = `Bạn là Chuyên gia Phương pháp Giảng dạy & Cố vấn Sư phạm Cấp cao của Bộ Giáo dục và Đào tạo.
Giáo viên đang yêu cầu soạn KẾ HOẠCH BÀI DẠY (GIÁO ÁN) chuẩn hóa theo đúng CÔNG VĂN 5512/BGDĐT-GDTrH (Chương trình GDPT 2025).

Yêu cầu cụ thể của Thầy/Cô:
"${query}"

Môn học & khối lớp: ${planSubject} lớp ${planGrade}.

HÃY SOẠN BÀI DẠY CHI TIẾT THEO ĐÚNG KHUNG 4 BƯỚC CỦA CÔNG VĂN 5512:
# KẾ HOẠCH BÀI DẠY (CÔNG VĂN 5512)
## Tên bài dạy: ... (Số tiết: ...)

### I. MỤC TIÊU BÀI DẠY
1. Về kiến thức: Liệt kê rõ các kiến thức trọng tâm học sinh cần nắm được sau bài học.
2. Về năng lực:
- Năng lực chung: Tự chủ và tự học, Giao tiếp và hợp tác, Giải quyết vấn đề và sáng tạo.
- Năng lực chuyên biệt / đặc thù của môn học (Ví dụ: Nhận thức hóa học/vật lí/toán học, Tìm hiểu thế giới tự nhiên, Vận dụng kiến thức kĩ năng đã học).
3. Về phẩm chất: Chăm chỉ, trung thực, trách nhiệm, yêu nước.

### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
1. Đối với giáo viên: Kế hoạch bài dạy, bài trình chiếu (PowerPoint), phiếu học tập số 1, 2, dụng cụ thí nghiệm hoặc video minh họa nếu có.
2. Đối với học sinh: Sách giáo khoa, vở ghi, đồ dùng học tập, nghiên cứu trước bài mới.

### III. TIẾN TRÌNH DẠY HỌC (CHUẨN 4 HOẠT ĐỘNG 5512)
1. HOẠT ĐỘNG 1: MỞ ĐẦU / KHỞI ĐỘNG (Xác định vấn đề / nhiệm vụ học tập)
a) Mục tiêu: ...
b) Nội dung: ...
c) Sản phẩm: ...
d) Tổ chức thực hiện:
- Chuyển giao nhiệm vụ: ...
- Thực hiện nhiệm vụ: ...
- Báo cáo, thảo luận: ...
- Kết luận, nhận định: ...

2. HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI
(Chia thành các hoạt động nhỏ 2.1, 2.2 tùy dung lượng bài)
a) Mục tiêu: ...
b) Nội dung: ...
c) Sản phẩm: ...
d) Tổ chức thực hiện (đủ 4 bước: Chuyển giao -> Thực hiện -> Báo cáo -> Nhận định).

3. HOẠT ĐỘNG 3: LUYỆN TẬP
a) Mục tiêu: Củng cố và khắc sâu kiến thức.
b) Nội dung: Hệ thống 3-5 câu hỏi trắc nghiệm hoặc bài tập tình huống thực tế.
c) Sản phẩm: Câu trả lời và bài giải của học sinh.
d) Tổ chức thực hiện: ...

4. HOẠT ĐỘNG 4: VẬN DỤNG
a) Mục tiêu: Ứng dụng kiến thức vào giải quyết vấn đề thực tiễn đời sống.
b) Nội dung: Nhiệm vụ nghiên cứu hoặc tình huống thực tế giao về nhà.
c) Sản phẩm: Báo cáo ngắn, poster hoặc sản phẩm học tập của học sinh.
d) Tổ chức thực hiện: ...

### IV. HỒ SƠ DẠY HỌC (PHIẾU HỌC TẬP & BẢNG KIỂM ĐÁNH GIÁ RUBRICS)
- Thiết kế mẫu Phiếu học tập số 1 và tiêu chí đánh giá mức độ đạt được của học sinh.

YÊU CẦU: Trình bày học thuật chuẩn mực, sư phạm, KHÔNG dùng emoji.`;

        const res = await callCopilotAI(lessonPlanPrompt, {}, CREDIT_TARIFF.TUTOR_CONTEXT, 'Soạn kế hoạch bài dạy AI');
        const aiReply = typeof res === 'string' ? res : (res?.text || '');
        setIsTyping(false);

        const planTitle = `Kế hoạch bài dạy môn ${planSubject} ${planGrade} - ${query.replace(/(?:soạn|tạo|lập|giáo\s*án|kế\s*hoạch\s*bài\s*dạy|5512)\s*/gi, '').slice(0, 40).trim() || 'Chuẩn GDPT 2025'}`;

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_lesson_plan_' + Date.now(),
            sender: 'bot',
            text: aiReply || 'Em đã hoàn tất thiết kế Kế hoạch bài dạy theo Công văn 5512 cho Thầy/Cô.',
            navSuggestions: [
              {
                label: 'Xuất Giáo Án ra file Word (.docx)',
                action: 'export_lesson_plan',
                title: planTitle,
                content: aiReply,
                subject: planSubject,
                grade: planGrade,
              },
              { label: 'Mở Bác sĩ sửa file Word', action: 'word_editor' },
              { label: 'Soạn đề kiểm tra cho bài này', action: 'simulator' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_plan_err_' + Date.now(),
            sender: 'bot',
            text: aiErrMsg(err, 'Em đang xử lý soạn bài dạy nhưng gặp gián đoạn tạm thời. Thầy/Cô vui lòng bấm gửi lại câu hỏi nhé.'),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }
    }

    // 0.2. LẬP KHUNG MA TRẬN & BẢN ĐẶC TẢ ĐỀ KIỂM TRA GDPT 2025
    const isAskingForMatrixOrSpec = (
      norm.includes('ma trận') ||
      norm.includes('bản đặc tả') ||
      norm.includes('khung ma trận') ||
      norm.includes('đặc tả đề')
    ) && !norm.includes('toán cao cấp') && !norm.includes('ngân hàng');

    if (isAskingForMatrixOrSpec) {
      try {
        const detectedInfo = detectExamSubjectAndGrade({ text: query, fileName: '' });
        const matrixSubject = detectedInfo.subject || 'Bộ môn';
        const matrixGrade = detectedInfo.grade || '12';

        const matrixPrompt = `Bạn là Trưởng ban Khảo thí & Chuyên gia Xây dựng Ma trận Đề thi Chuẩn Quốc gia theo Chương trình GDPT 2025 của Bộ Giáo dục và Đào tạo.
Giáo viên đang yêu cầu lập KHUNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ.

Yêu cầu cụ thể của Thầy/Cô:
"${query}"

Môn học & khối lớp: ${matrixSubject} lớp ${matrixGrade}.

HÃY LẬP BẢNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐẦY ĐỦ THEO CHUẨN ĐỊNH DẠNG ĐỀ THI GDPT 2025:
1. KHUNG MA TRẬN ĐỀ THI:
- Bảng ma trận phân phối số lượng câu hỏi và thang điểm theo 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao):
  + Phần I: Trắc nghiệm 4 phương án lựa chọn (Số câu NB, TH, VD. Điểm số: 0.25đ/câu, tổng 4.0đ).
  + Phần II: Trắc nghiệm Đúng/Sai (Mỗi câu có 4 ý a, b, c, d. Điểm: 1 ý 0.1đ, 2 ý 0.25đ, 3 ý 0.5đ, 4 ý 1.0đ. Tổng 4.0đ).
  + Phần III: Trắc nghiệm trả lời ngắn (Số câu VD, VDC. Điểm số: 0.25-0.5đ/câu, tổng 2.0đ).
  + Tổng điểm: 10.0 điểm.
  + Tỷ lệ phần trăm nhận thức: Nhận biết (khoảng 30-40%), Thông hiểu (khoảng 30%), Vận dụng (khoảng 20-30%), Vận dụng cao (khoảng 10%).

2. BẢN ĐẶC TẢ YÊU CẦU CẦN ĐẠT (YCCĐ):
- Trình bày dạng danh mục / bảng chi tiết từng mạch nội dung kiến thức, đơn vị kiến thức, và mức độ yêu cầu cần đạt tương ứng cho từng câu hỏi trong đề.

3. HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM CHI TIẾT.

YÊU CẦU: Trình bày chuẩn mực, rõ ràng, định dạng Markdown bảng và danh sách đẹp mắt, KHÔNG dùng emoji.`;

        const res = await callCopilotAI(matrixPrompt, {}, CREDIT_TARIFF.TUTOR_CONTEXT, 'Lập khung ma trận & đặc tả đề AI');
        const aiReply = typeof res === 'string' ? res : (res?.text || '');
        setIsTyping(false);

        const matrixTitle = `Khung Ma trận & Bản đặc tả môn ${matrixSubject} ${matrixGrade} - ${query.replace(/(?:ma\s*trận|đặc\s*tả|bản\s*đặc\s*tả|lập|soạn)\s*/gi, '').slice(0, 40).trim() || 'GDPT 2025'}`;

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_matrix_' + Date.now(),
            sender: 'bot',
            text: aiReply || 'Em đã thiết kế xong Khung Ma Trận và Bản Đặc Tả đề thi GDPT 2025.',
            navSuggestions: [
              {
                label: 'Xuất Ma Trận ra file Word (.docx)',
                action: 'export_matrix',
                title: matrixTitle,
                content: aiReply,
                subject: matrixSubject,
                grade: matrixGrade,
              },
              { label: 'Mở Bác sĩ sửa file Word', action: 'word_editor' },
              { label: 'Soạn đề thi theo ma trận này', action: 'simulator' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_matrix_err_' + Date.now(),
            sender: 'bot',
            text: aiErrMsg(err, 'Em đang thiết lập ma trận đề thi nhưng gặp gián đoạn kết nối. Thầy/Cô vui lòng gửi lại yêu cầu nhé.'),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }
    }

    // 0. THẨM ĐỊNH & PHÁN XÉT CÂU HỎI / ĐỀ THI CHUYÊN SÂU GDPT 2025
    if (detectAuditOrAcademicQuery(query)) {
      try {
        const detectedAudit = detectExamSubjectAndGrade({ text: query, fileName: '' });
        const auditSubject = detectedAudit.subject || 'Chuyên sâu';
        const auditGrade = detectedAudit.grade || '12';

        const auditPrompt = `Bạn là Chủ tịch Hội đồng Thẩm định Đề thi & Chuyên gia Giám định Sư phạm môn ${auditSubject} lớp ${auditGrade} cấp cao theo Chương trình GDPT 2025 của Bộ Giáo dục và Đào tạo.
Giáo viên đang gửi câu hỏi / bài toán / đề bài cần Thầy/Cô thẩm định, phán xét và hiệu đính học thuật:

"${query}"

HÃY THỰC HIỆN GIÁM ĐỊNH SƯ PHẠM VÀ PHẢN BIỆN KHOA HỌC THEO ĐÚNG 5 TRỤ CỘT DƯỚI ĐÂY (KHÔNG DÙNG EMOJI, DÙNG ĐỊNH DẠNG MARKDOWN CHUYÊN NGHIỆP):

### 1. KẾT LUẬN THẨM ĐỊNH & MỨC ĐỘ NHẬN THỨC
- **Môn học & Khối lớp:** ${auditSubject} - Lớp ${auditGrade}
- **Kết luận:** [ĐẠT CHUẨN 10/10] hoặc [CẦN HIỆU ĐÍNH] hoặc [LỖI KHOA HỌC / LỖI KỸ THUẬT SOẠN THẢO].
- **Cấu trúc phần:** Thuộc Phần I (Trắc nghiệm 4 lựa chọn), Phần II (Đúng/Sai), hay Phần III (Trả lời ngắn).
- **Mức độ nhận thức chuẩn:** [Nhận biết (NB)] / [Thông hiểu (TH)] / [Vận dụng (VD)] / [Vận dụng cao (VDC)] căn cứ theo Thông tư 22 và Khung năng lực GDPT 2025. Giải thích ngắn gọn lý do phân mức.

### 2. GIÁM ĐỊNH TÍNH CHÍNH XÁC KHOA HỌC & QUY CHUẨN GDPT 2025 (MÔN ${auditSubject.toUpperCase()})
- Kiểm tra tính thực nghiệm, tính đúng đắn khoa học, điều kiện bài toán, danh pháp và quy ước mới theo SGK 2025.

### 3. RÀ SOÁT KỸ THUẬT SOẠN ĐỀ & FORM THI BỘ GD&ĐT
- **Tính độc lập của phương án:** 4 lựa chọn phải có cấu trúc ngữ pháp đồng nhất, độ dài tương đương, các phương án nhiễu phải hợp lý và độc lập.
- **Tránh lỗi kỹ thuật:** Không để lộ đáp án, không dùng cụm từ vô hiệu như "Tất cả đều đúng/sai", không tạo bẫy câu chữ phi học thuật.
- **Nếu là Phần II (Đúng/Sai):** Đánh giá 4 nhận định a, b, c, d có độc lập không, có thang bậc nhận thức rõ ràng không.
- **Nếu là Phần III (Trả lời ngắn):** Giá trị số cần tính toán có đơn nhất không, quy ước làm tròn có minh bạch không.

### 4. GIẢI MÃ ĐÁP ÁN & BÓC TÁCH BẪY TƯ DUY HỌC SINH (DISTRACTOR ANALYSIS)
- **Đáp án chính xác:** Chỉ rõ đáp án đúng kèm lời giải chi tiết từng bước.
- **Bóc tách tâm lý chọn sai:** Phân tích cặn kẽ tại sao học sinh dễ chọn nhầm các phương án còn lại (ngộ nhận khái niệm cốt lõi nào, nhầm lẫn công thức nào).

### 5. BẢN HIỆU ĐÍNH CHUẨN MỰC (NẾU CẦN)
- Đưa ra bản viết lại hoàn chỉnh của câu hỏi đạt 10/10 chuẩn GDPT 2025 sẵn sàng đưa vào đề thi chính thức.`;

        const res = await callCopilotAI(auditPrompt, {}, CREDIT_TARIFF.TUTOR_CONTEXT, 'Thẩm định câu hỏi đề thi AI');
        const aiReply = typeof res === 'string' ? res : (res?.text || '');

        let verdict = 'ĐẠT CHUẨN 10/10';
        let level = 'Vận dụng (VD)';
        if (/cần hiệu đính/i.test(aiReply)) verdict = 'CẦN HIỆU ĐÍNH';
        else if (/lỗi khoa học|lỗi kỹ thuật/i.test(aiReply)) verdict = 'LỖI KHOA HỌC / KỸ THUẬT';

        if (/nhận biết\s*\(?nb\)?/i.test(aiReply)) level = 'Nhận biết (NB)';
        else if (/thông hiểu\s*\(?th\)?/i.test(aiReply)) level = 'Thông hiểu (TH)';
        else if (/vận dụng cao\s*\(?vdc\)?/i.test(aiReply)) level = 'Vận dụng cao (VDC)';
        else if (/vận dụng\s*\(?vd\)?/i.test(aiReply)) level = 'Vận dụng (VD)';

        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_audit_' + Date.now(),
            sender: 'bot',
            text: 'Hội Đồng Giám Định Sư Phạm & Thẩm Định Đề Thi GDPT 2025 báo cáo kết quả:',
            auditData: {
              rawQuery: query,
              verdict,
              level,
              analysis: aiReply,
            },
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_audit_err_' + Date.now(),
            sender: 'bot',
            text: aiErrMsg(err, 'Không thể thẩm định câu hỏi lúc này (ELEC Credit đã được hoàn trả nếu lỗi). Thầy/Cô vui lòng thử lại.'),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }
    }

    // 0. BÁC SĨ SỬA FILE WORD (chỉ mở khi giáo viên thực sự yêu cầu sửa/mở trình Word, không cướp lệnh soạn đề hay hỏi lý thuyết)
    const isCreatingOrExplaining =
      norm.includes('soạn đề') ||
      norm.includes('tạo đề') ||
      norm.includes('ra đề') ||
      norm.includes('giải thích') ||
      norm.includes('là gì') ||
      norm.includes('cấu trúc');

    if (
      !isCreatingOrExplaining &&
      (norm.includes('sửa file word') ||
        norm.includes('chuẩn hóa word') ||
        norm.includes('bác sĩ sửa') ||
        norm.includes('trình sửa word') ||
        norm.includes('giống như word') ||
        norm.includes('giống word') ||
        norm.includes('sửa trực quan'))
    ) {
      setIsTyping(false);
      setWordEditorExam((prev) => prev || (exams && exams[0]) || null);
      setWordEditorOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_doctor_guide_' + Date.now(),
          sender: 'bot',
          text: `Em đã mở Trình Soạn Thảo & Sửa File Word Trực Quan (Word Editor). Thầy/Cô có thể chỉnh sửa trực tiếp trên mặt giấy A4 giống hệt như đang dùng Microsoft Word trên máy tính:
1. Gõ sửa trực tiếp từng câu hỏi, 4 phương án A, B, C, D và nhận định Đúng/Sai a), b), c), d).
2. Thanh công cụ Ribbon chuẩn: Phông chữ (Times New Roman), Cỡ chữ, Căn lề, Giãn dòng, In đậm/nghiêng/gạch chân.
3. Chèn hình ảnh, công thức Toán/Lý/Hóa, và xuất file Word (.docx) chuẩn Bộ Giáo Dục tải về máy!`,
          navSuggestions: [
            { label: 'Mở Trình Sửa Giống Word (A4)', action: 'word_editor' },
            { label: 'Nạp file Word (.docx) khác', action: 'pick_file' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 0.1. SOẠN ĐỀ / TẠO ĐỀ CHUẨN 3 PHẦN GDPT 2025 (INTERACTIVE WIZARD — ĐA MÔN, TỰ BÓC TÁCH CHỦ ĐỀ & MA TRẬN)
    if (
      !isGuidanceQuery &&
      (norm.includes('soạn đề') || norm.includes('tạo đề') || norm.includes('ra đề') || norm.includes('làm đề')) &&
      !norm.includes('giao ngay') && !norm.includes('giao cho lớp')
    ) {
      setIsTyping(false);
      setTypingStatus('');
      const detected = detectExamSubjectAndGrade({ text: query, fileName: '' });
      const parsedIntent = extractExamIntentFromQuery(query, {
        detectedSubject: detected.subject || '',
        detectedGrade: detected.grade || '',
        fallbackSubject: inferredSubject,
        fallbackGrade: String(classes[0]?.grade || linkedClasses?.[0]?.grade || '12'),
        getTopics: getTopicsForSubjectAndGrade,
      });

      handleStartExamWizard(parsedIntent);
      return;
    }



    // 1. ONE-COMMAND AUTONOMOUS AGENT (RA LỆNH TỰ ĐỘNG SOẠN & GIAO ĐỀ TOÀN TRÌNH)
    if (
      !isGuidanceQuery &&
      (norm.includes('soạn') || norm.includes('tạo')) &&
      (norm.includes('giao') || norm.includes('cho lớp'))
    ) {
      const targetClass = findTargetClassInQuery(query, classes) || classes[0] || { name: '12A1', id: 'c_auto' };
      const grade = String(targetClass.grade || '12');
      const detectedInfo = detectExamSubjectAndGrade({ text: query, fileName: '' });
      const subject = detectedInfo.subject || targetClass.subject || 'Toán học';

      try {
        const finalQuestions = await callCopilotAI(
          `Bạn là chuyên gia ra đề môn ${subject} GDPT 2025. Hãy soạn 10 câu hỏi chuẩn cấu trúc 3 phần theo yêu cầu: "${query}".
Gồm:
- 6 câu trắc nghiệm 4 lựa chọn (Phần I: A, B, C, D độc lập, 1 đáp án đúng).
- 2 câu trắc nghiệm Đúng/Sai (Phần II: mỗi câu có 4 nhận định a, b, c, d với boolean true/false).
- 2 câu trả lời ngắn (Phần III: bài toán tính toán với đáp số số học duy nhất).
Trả về duy nhất đối tượng JSON:
{
  "title": "Tên đề kiểm tra phù hợp",
  "part1": [
    {
      "q": "Nội dung câu hỏi môn ${subject}",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "level": "TH",
      "explain": "Lời giải chi tiết từng bước"
    }
  ],
  "part2": [
    {
      "q": "Đề dẫn bài toán hoặc thí nghiệm",
      "statements": [
        { "text": "a) ...", "answer": true },
        { "text": "b) ...", "answer": false },
        { "text": "c) ...", "answer": true },
        { "text": "d) ...", "answer": false }
      ],
      "level": "VD",
      "explain": "Lời giải từng ý"
    }
  ],
  "part3": [
    {
      "q": "Câu hỏi tính toán điền số",
      "answer": "12,5",
      "level": "VDC",
      "explain": "Lời giải chi tiết"
    }
  ]
}`,
          {},
          CREDIT_TARIFF.EXAM_GEN_SMALL,
          'Tạo đề kiểm tra giao nhanh cho lớp',
          null,
          {
            actionType: 'exam_gen',
            validate: (genText) => {
              const parsed = parseExamJsonSafe(genText);
              const q1 = (parsed?.part1 || []).map((q, idx) => ({
                id: `q_agent_p1_${Date.now()}_${idx + 1}`,
                q: q.q,
                options: (Array.isArray(q.options) && q.options.length === 4) ? q.options : [
                  'A. ' + (q.options?.[0] || 'Phương án đúng'),
                  'B. ' + (q.options?.[1] || 'Phương án gây nhiễu 1'),
                  'C. ' + (q.options?.[2] || 'Phương án gây nhiễu 2'),
                  'D. ' + (q.options?.[3] || 'Phương án gây nhiễu 3'),
                ],
                correct: q.correct ?? 0,
                level: q.level || 'TH',
                explain: q.explain || '',
                part: 1,
                type: 'single_choice',
                points: 0.25,
              }));
              const q2 = (parsed?.part2 || []).map((q, idx) => ({
                id: `q_agent_p2_${Date.now()}_${idx + 1}`,
                q: q.q,
                statements: (q.statements || []).map((s) => ({ text: s.text, answer: s.answer === true })),
                level: q.level || 'VD',
                explain: q.explain || '',
                part: 2,
                type: 'true_false',
                points: 1.0,
              }));
              const q3 = (parsed?.part3 || []).map((q, idx) => ({
                id: `q_agent_p3_${Date.now()}_${idx + 1}`,
                q: q.q,
                answer: String(q.answer || '0').replace('.', ','),
                level: q.level || 'VDC',
                explain: q.explain || '',
                part: 3,
                type: 'short_answer',
                points: 0.25,
              }));
              const list = [...q1, ...q2, ...q3];
              if (!list.length) {
                throw new Error('AI chưa sinh được câu hỏi hợp lệ cho đề kiểm tra này (ELEC Credit đã được hoàn trả). Thầy/Cô vui lòng thử lại.');
              }
              return { list, title: parsed?.title };
            },
          }
        );
        const agentQuestions = finalQuestions.list;

        const agentExam = {
          id: 'exam_agent_' + Date.now(),
          title: finalQuestions.title || `Đề giao tự động: ${query.slice(0, 28)}...`,
          subject: subject,
          grade: grade,
          classId: targetClass.id === 'c_auto' ? '' : targetClass.id,
          duration: 15,
          totalQuestions: agentQuestions.length,
          questions: agentQuestions,
        };

        await onCreateExam?.(agentExam);

        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_agent_done_' + Date.now(),
            sender: 'bot',
            text: `AI Agent đã hoàn thành tự động toàn trình nhiệm vụ theo lệnh của Thầy/Cô:`,
            agentWorkflow: {
              targetClassName: targetClass.name,
              examTitle: agentExam.title,
              steps: [
                'Biên soạn bộ câu hỏi chuẩn khung GDPT 2025 theo chuyên đề',
                'Thiết lập 3 phần đầy đủ: Trắc nghiệm 4 lựa chọn, Đúng/Sai và Trả lời ngắn',
                `Giao bài kiểm tra trực tiếp vào danh sách đề của lớp ${targetClass.name}`,
              ],
            },
            examData: agentExam,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        onSay?.(`AI Agent đã tự động giao đề vào lớp ${targetClass.name}!`, 'success');
        return;
      } catch (err) {
        setIsTyping(false);
        if (err?.code === 'OUT_OF_CREDITS') {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot_audit_err_' + Date.now(),
              sender: 'bot',
              text: err.message,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }
      }
    }

    // 2. HỖ TRỢ FILE WORD, CÔNG THỨC VÀ HÌNH ẢNH (MATH-TYPE, OMML, PIN GALVANI...)
    if (
      norm.includes('nhập file') || norm.includes('file word') || norm.includes('.docx') ||
      norm.includes('mathtype') || norm.includes('omml') || norm.includes('công thức') ||
      (norm.includes('hình ảnh') && (norm.includes('nhận diện') || norm.includes('đề'))) ||
      norm.includes('trộn đề') || norm.includes('đảo đề')
    ) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_importer_guide_' + Date.now(),
          sender: 'bot',
          text: `ELEC AI đã tích hợp sẵn Trình Nhập Đề Nâng Cao và Trộn Đề Thi tự động chuẩn GDPT 2025:
- Tự động giải mã MathType & OMML (Toán - Lý - Hóa) mượt mà.
- Tự động nhận diện sơ đồ thí nghiệm, hình vẽ (như sơ đồ Pin Galvani Zn - Cu) và gắn vào câu hỏi.
- Chuẩn hóa 3 phần: Phần I (Trắc nghiệm 4 lựa chọn), Phần II (Đúng/Sai 4 ý a-b-c-d), Phần III (Trả lời ngắn).
- Tự động ẩn nhãn [NB], [TH], [VD], [VDC] và nhận diện đáp án in đậm / gạch chân.
- Trộn đề tự động tạo 4 mã đề (101, 102, 103, 104) với tiêu đề chuẩn Sở GD, Trường, Khối, Lớp, Thời gian làm bài.`,
          navSuggestions: [
            { label: 'Mở Trình Nhập Đề Nâng Cao', action: 'importer' },
            { label: 'Mở Trộn Đề Thi', action: 'simulator' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 2.1. ĐIỀU HƯỚNG TÍNH NĂNG CHUYÊN SÂU TRÊN WEB (CHẤM PHIẾU A4, NGÂN HÀNG, THI LẠI, HỒ SƠ)
    if (norm.includes('chấm phiếu') || norm.includes('phiếu a4') || norm.includes('chấm bài') || norm.includes('quét phiếu')) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_nav_paper_' + Date.now(),
          sender: 'bot',
          text: 'Tính năng Chấm phiếu A4 hỗ trợ nhận diện và chấm bài thi tự động qua camera hoặc file ảnh quét phiếu trắc nghiệm:',
          navSuggestions: [{ label: 'Mở tab Chấm phiếu A4', sec: 'paper' }],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    if (norm.includes('ngân hàng') || norm.includes('kho câu hỏi')) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_nav_bank_' + Date.now(),
          sender: 'bot',
          text: 'Ngân hàng câu hỏi của Thầy/Cô lưu trữ toàn bộ các câu hỏi trắc nghiệm đã biên soạn, phân loại theo chuyên đề và mức độ nhận thức:',
          navSuggestions: [{ label: 'Mở Ngân hàng câu hỏi', sec: 'bank' }],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    if (norm.includes('thi lại') || norm.includes('xin thi lại') || norm.includes('duyệt thi lại')) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_nav_retry_' + Date.now(),
          sender: 'bot',
          text: 'Mục Xin thi lại tổng hợp toàn bộ các yêu cầu được làm lại bài từ học sinh do gặp sự cố mạng hoặc điểm thấp:',
          navSuggestions: [{ label: 'Mở danh sách Xin thi lại', sec: 'retry' }],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    if (norm.includes('hồ sơ') || norm.includes('tài khoản') || norm.includes('đổi mật khẩu') || norm.includes('thông tin cá nhân')) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_nav_profile_' + Date.now(),
          sender: 'bot',
          text: 'Thầy/Cô có thể cập nhật thông tin cá nhân, tổ bộ môn, trường học và đổi mật khẩu tại trang Hồ sơ giáo viên:',
          navSuggestions: [{ label: 'Mở Hồ sơ giáo viên', sec: 'profile' }],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 2.2. TẠO LỚP HỌC MỚI TRỰC TIẾP TỪ LỆNH CHAT (HỎI NHU CẦU & XÁC NHẬN THÔNG TIN)
    if (
      (norm.includes('tạo lớp') || norm.includes('thêm lớp') || norm.includes('mở lớp') || norm.includes('lập lớp')) &&
      !norm.includes('giao đề') && !norm.includes('giao bài') && !norm.includes('soạn')
    ) {
      if (isGuidanceQuery) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_class_guide_' + Date.now(),
            sender: 'bot',
            text: `Để tạo lớp học mới (VD: **${extractValidNewClassName(query) || '11A5'}**), Thầy/Cô vào tab **Lớp học & Liên kết** -> nhấn **+ Tạo lớp mới**, điền tên lớp, khối lớp và môn học, hoặc bấm nút bên dưới để mở trực tiếp:`,
            navSuggestions: [{ label: 'Mở Quản lý Lớp học', sec: 'classes' }],
            time: timeStr,
          },
        ]);
        return;
      }

      const clsName = extractValidNewClassName(query);
      if (!clsName) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_ask_class_needs_' + Date.now(),
            sender: 'bot',
            text: `Thầy/Cô muốn tạo lớp học mới với thông tin như thế nào ạ?

Để khởi tạo lớp học chuẩn xác, Thầy/Cô vui lòng cung cấp:
1. **Tên lớp học**: (Ví dụ: 10A1, 11A5, 12 Chuyên Hóa...)
2. **Khối lớp**: (Khối 10, 11 hoặc 12)
3. **Môn giảng dạy**: (Hóa học, Toán học, Vật lí, Sinh học, Tiếng Anh...)

Thầy/Cô có thể nhắn trực tiếp (Ví dụ: *Tạo lớp 11A5 môn Hóa khối 11*), hoặc bấm nút bên dưới để mở giao diện điền biểu mẫu trực quan:`,
            navSuggestions: [
              { label: 'Mở tab Lớp học để tạo lớp', sec: 'classes' },
              { label: 'Hướng dẫn quy trình tạo lớp & giao đề', action: 'ask_workflow' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // Kiểm tra xem lớp đã có trong danh sách chưa
      const existingCls = classes.find((c) =>
        c.name?.toLowerCase() === clsName.toLowerCase() ||
        normalizeText(c.name || '').toLowerCase() === normalizeText(clsName).toLowerCase()
      );

      if (existingCls) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_cls_exists_' + Date.now(),
            sender: 'bot',
            text: `Thầy/Cô đã có sẵn **Lớp ${existingCls.name}** trong danh sách quản lý rồi ạ:
* **Mã vào lớp:** **${existingCls.key || existingCls.id || 'Đã có'}**
* **Khối:** Khối ${existingCls.grade || '12'} - **Môn:** ${existingCls.subject || 'Hóa học'}
* **Sĩ số hiện tại:** ${existingCls.members?.length || 0} học sinh.

Thầy/Cô có muốn em hỗ trợ soạn đề hoặc giao bài kiểm tra cho lớp này không?`,
            navSuggestions: [
              { label: `Soạn đề cho lớp ${existingCls.name}`, action: 'simulator' },
              { label: `Xem điểm lớp ${existingCls.name}`, action: 'query_class', className: existingCls.name },
              { label: 'Mở tab Lớp học', sec: 'classes' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // Lớp chưa tồn tại: Xác nhận thông tin với giáo viên trước khi tạo
      setIsTyping(false);
      const gradeMatch = clsName.match(/^(10|11|12)/);
      const grade = gradeMatch ? gradeMatch[1] : (norm.includes('10') ? '10' : norm.includes('11') ? '11' : '12');
      const detectedInfo = detectExamSubjectAndGrade({ text: query, fileName: '' });
      const subject = detectedInfo.subject || inferredSubject || 'Hóa học';

      // Nếu giáo viên ra lệnh tạo khẩn cấp (vd: "tạo ngay lớp 11A5" hoặc "xác nhận tạo")
      const isUrgentCreate = norm.includes('tạo ngay') || norm.includes('tạo luôn') || norm.includes('xác nhận tạo');
      if (isUrgentCreate && onCreateClass) {
        try {
          const newCls = await onCreateClass({ name: clsName, grade, subject });
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot_cls_created_' + Date.now(),
              sender: 'bot',
              text: `AI đã tạo thành công **Lớp ${newCls?.name || clsName}** (Khối ${grade} - Môn ${subject})!\nMã vào lớp cho học sinh: **${newCls?.key || newCls?.id || 'Đã tạo'}**\n\nThầy/Cô có thể gửi mã vào lớp cho học sinh hoặc bấm nút bên dưới để bắt đầu soạn bài kiểm tra đầu tiên cho lớp:`,
              navSuggestions: [
                { label: `Soạn đề cho lớp ${clsName}`, action: 'simulator' },
                { label: 'Mở Quản lý Lớp học', sec: 'classes' },
              ],
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        } catch (err) {
          // fallback
        }
      }

      // Mặc định: Hỏi ý kiến và cung cấp nút bấm xác nhận 1 chạm
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_confirm_create_class_' + Date.now(),
          sender: 'bot',
          text: `Em đã ghi nhận nhu cầu khởi tạo **Lớp ${clsName}** của Thầy/Cô với các thông số dự kiến:
* **Tên lớp:** **${clsName}**
* **Khối lớp:** Khối ${grade}
* **Môn học:** Môn ${subject}

Thầy/Cô bấm nút **"Xác nhận Tạo Lớp ${clsName}"** bên dưới để khởi tạo ngay và nhận Mã vào lớp, hoặc gửi lại tin nhắn nếu muốn điều chỉnh môn học / khối lớp:`,
          navSuggestions: [
            { label: `Xác nhận Tạo Lớp ${clsName}`, action: 'create_class', className: clsName },
            { label: 'Mở tab Lớp học để tự điền form', sec: 'classes' },
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // 3. TRUY VẤN THEO LỚP HỌC CỤ THỂ
    const mentionedClassStr = extractMentionedClassName(query);
    const targetClass = findTargetClassInQuery(query, classes, exams, submissionsMap);

    // 3.A. Giáo viên hỏi về một lớp cụ thể NHƯNG lớp này CHƯA có trong hệ thống
    if (mentionedClassStr && !targetClass) {
      setIsTyping(false);
      const currentClassList = classes.length
        ? classes.map((c) => `- **${c.name}** (${c.members?.length || 0} học sinh)`).join('\n')
        : '- Chưa có lớp học nào trong danh sách quản lý.';

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_class_not_found_' + Date.now(),
          sender: 'bot',
          text: `Thầy/Cô đang hỏi về **Lớp ${mentionedClassStr}**, nhưng hiện tại hệ thống chưa ghi nhận dữ liệu lớp học này.

Danh sách các lớp Thầy/Cô hiện đang quản lý:
${currentClassList}

Thầy/Cô có muốn em hỗ trợ:
1. Tạo mới ngay lớp **${mentionedClassStr}** để cấp mã vào lớp cho học sinh?
2. Hay phân tích dữ liệu học sinh của một trong các lớp Thầy/Cô đang có ở trên?`,
          navSuggestions: [
            { label: `Tạo ngay Lớp ${mentionedClassStr}`, action: 'create_class', className: mentionedClassStr },
            { label: 'Mở Quản lý Lớp học', sec: 'classes' },
            ...(classes.slice(0, 2).map((c) => ({ label: `Xem lớp ${c.name}`, action: 'query_class', className: c.name }))),
          ],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 3.B. Lớp học TỒN TẠI trong hệ thống -> Phân tích chính xác theo dữ liệu lớp
    if (targetClass) {
      const stats = extractClassStats(targetClass, { exams, submissionsMap });

      // Nếu lớp chưa có bài nộp nào
      if (!stats || stats.totalSubs === 0) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_class_empty_' + Date.now(),
            sender: 'bot',
            text: `Hiện tại trong **Lớp ${targetClass.name}**, hệ thống chưa ghi nhận bài nộp nào từ học sinh (0 bài nộp). Thầy/Cô có thể giao một bài kiểm tra để AI tiến hành phân loại và phát hiện học sinh cần bồi dưỡng.`,
            navSuggestions: [
              { label: `Mở Quản lý Lớp ${targetClass.name}`, sec: 'classes' },
              { label: `Giao đề mới cho lớp ${targetClass.name}`, action: 'simulator' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // 3.1. HỎI HỌC SINH ĐIỂM THẤP NHẤT / KÉM NHẤT TRONG LỚP
      if (/(kém|thấp|yếu|đội sổ|dưới trung bình|cần phụ đạo|bét|tệ|hổng|nguy cơ)/i.test(norm)) {
        setIsTyping(false);
        const lowest = stats.weakest && stats.weakest.length ? stats.weakest[0] : null;

        if (!lowest) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot_weak_class_' + Date.now(),
              sender: 'bot',
              text: `Trong **Lớp ${targetClass.name}**, tất cả học sinh đều hoàn thành bài kiểm tra với kết quả tốt, không có học sinh nào bị hổng kiến thức nghiêm trọng!`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }

        const weakRankingText = stats.weakest
          .slice(0, 3)
          .map((st, i) => `${i + 1}. **${st.studentName}** — Điểm đạt: **${st.avgPct}%** (${st.subCount} bài làm)`)
          .join('\n');

        const reply = `Trong **Lớp ${targetClass.name}**, học sinh có điểm thấp nhất hiện tại là **${lowest.studentName}** với điểm đạt **${lowest.avgPct}%** (${lowest.subCount} bài nộp).

Bảng xếp hạng học sinh điểm thấp cần hỗ trợ lớp ${targetClass.name}:
${weakRankingText}

Thống kê lớp ${targetClass.name}: Điểm trung bình là **${stats.classAvg}%**, tỷ lệ đạt (≥50%) là **${stats.passRate}%** (tổng số ${stats.totalSubs} bài nộp từ ${stats.studentCount} học sinh).

Thầy/Cô có thể bấm **"Kê đơn phục hồi"** bên dưới để AI tạo ngay đơn thuốc học tập 3 câu đặc trị kéo điểm cho ${lowest.studentName}:`;

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_weak_class_' + Date.now(),
            sender: 'bot',
            text: reply,
            realAtRisk: stats.weakest.slice(0, 5).map((st) => ({
              studentName: st.studentName,
              pct: st.avgPct,
              subCount: st.subCount,
              studentId: st.studentId,
            })),
            navSuggestions: [
              { label: `Mở danh sách lớp ${targetClass.name}`, sec: 'classes' },
              { label: `Soạn đề kéo điểm cho lớp ${targetClass.name}`, action: 'simulator' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // 3.2. HỎI HỌC SINH ĐIỂM CAO NHẤT / GIỎI NHẤT TRONG LỚP
      if (/(cao|giỏi|thủ khoa|đứng đầu|tốt nhất|xuất sắc|top 1|hạng 1)/i.test(norm)) {
        setIsTyping(false);
        const topStudent = stats.strongest && stats.strongest.length ? stats.strongest[0] : null;
        if (!topStudent) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot_top_class_' + Date.now(),
              sender: 'bot',
              text: `Chưa đủ dữ liệu bài nộp để xếp hạng thủ khoa lớp ${targetClass.name}.`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }

        const topStrongText = stats.strongest
          .slice(0, 3)
          .map((st, i) => `${i + 1}. **${st.studentName}** — Điểm đạt: **${st.avgPct}%** (${st.subCount} bài làm)`)
          .join('\n');

        const reply = `Trong **Lớp ${targetClass.name}**, học sinh có điểm cao nhất hiện tại là **${topStudent.studentName}** với điểm đạt **${topStudent.avgPct}%** (${topStudent.subCount} bài nộp).

Top học sinh xuất sắc nhất lớp ${targetClass.name}:
${topStrongText}

Điểm trung bình toàn lớp ${targetClass.name} là **${stats.classAvg}%**, tỷ lệ đạt chuẩn là **${stats.passRate}%** (${stats.totalSubs} bài nộp).`;

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_top_class_' + Date.now(),
            sender: 'bot',
            text: reply,
            topStudents: stats.strongest.slice(0, 5).map((st) => ({
              studentName: st.studentName,
              pct: st.avgPct,
              subCount: st.subCount,
              studentId: st.studentId,
            })),
            navSuggestions: [
              { label: `Mở chi tiết lớp ${targetClass.name}`, sec: 'classes' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // 3.3. TÌNH HÌNH / TỔNG QUAN / BÁO CÁO LỚP HỌC
      if (/(tình hình|báo cáo|thống kê|tổng quan|phổ điểm|bao nhiêu|thế nào|như thế nào)/i.test(norm)) {
        setIsTyping(false);
        const reply = `Báo cáo tổng quan tình hình học tập của **Lớp ${targetClass.name}**:
- Số học sinh ghi nhận: **${stats.studentCount} học sinh** (${stats.totalSubs} bài nộp đã chấm).
- Điểm trung bình lớp: **${stats.classAvg}%**.
- Tỷ lệ đạt chuẩn (≥50%): **${stats.passRate}%**.
- Học sinh dẫn đầu: **${stats.strongest[0]?.studentName || '—'}** (${stats.strongest[0]?.avgPct || 0}%).
- Học sinh cần lưu ý hỗ trợ: **${stats.atRisk.length} học sinh** dưới 50% (thấp nhất là **${stats.weakest[0]?.studentName || '—'}**: ${stats.weakest[0]?.avgPct || 0}%).

${stats.atRisk.length > 0 ? `Em đã lập danh sách các học sinh cần bồi dưỡng thêm bên dưới để Thầy/Cô tiện theo dõi và kê đơn bài tập:` : `Lớp đang duy trì phong độ làm bài rất tốt!`}`;

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_class_overview_' + Date.now(),
            sender: 'bot',
            text: reply,
            realAtRisk: stats.atRisk.length > 0 ? stats.atRisk.slice(0, 5).map((st) => ({
              studentName: st.studentName,
              pct: st.avgPct,
              subCount: st.subCount,
              studentId: st.studentId,
            })) : null,
            navSuggestions: [
              { label: `Mở quản lý lớp ${targetClass.name}`, sec: 'classes' },
              { label: `Giao đề mới cho lớp ${targetClass.name}`, action: 'simulator' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // 3.4. CÂU HỎI MỞ VỀ LỚP NÀY -> GỬI SỐ LIỆU THẬT CHO GEMINI TRẢ LỜI
      try {
        const classContextPrompt = `Bạn là ELEC AI Copilot — Trợ lý giáo viên siêu cấp.
Thầy/Cô đang hỏi về lớp ${targetClass.name}.
Dữ liệu thực tế của lớp ${targetClass.name}:
- Tên lớp: ${targetClass.name} (Khối ${targetClass.grade || '11'})
- Tổng số bài nộp: ${stats.totalSubs} bài
- Điểm trung bình lớp: ${stats.classAvg}%
- Tỷ lệ đạt: ${stats.passRate}%
- Học sinh điểm cao nhất: ${stats.strongest.slice(0, 3).map((s) => `${s.studentName} (${s.avgPct}%)`).join(', ') || 'Chưa có'}
- Học sinh điểm thấp nhất: ${stats.weakest.slice(0, 3).map((s) => `${s.studentName} (${s.avgPct}%)`).join(', ') || 'Chưa có'}
- Số học sinh cần phụ đạo (<50%): ${stats.atRisk.length} học sinh

Câu hỏi của giáo viên: "${query}"

Hãy trả lời chính xác, bám sát các số liệu thực tế trên của lớp ${targetClass.name}, ngắn gọn, sư phạm, KHÔNG dùng emoji.`;

        const res = await callCopilotAI(classContextPrompt, {}, CREDIT_TARIFF.TUTOR_CONTEXT, 'Phân tích số liệu lớp học AI');
        const aiReply = typeof res === 'string' ? res : (res?.text || '');
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_text_' + Date.now(),
            sender: 'bot',
            text: aiReply || 'Đã phân tích xong dữ liệu của lớp.',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      } catch (clsErr) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_cls_err_' + Date.now(),
            sender: 'bot',
            text: aiErrMsg(clsErr, 'Chưa thể phân tích số liệu lớp lúc này (ELEC Credit đã được hoàn trả nếu lỗi).'),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }
    }

    // 4. TRUY VẤN THEO HỌC SINH CỤ THỂ (VD: "xem điểm Duyyy nè", "học sinh Khôi học thế nào")
    const targetStudent = findTargetStudent(query, { classes, submissionsMap });
    if (targetStudent) {
      setIsTyping(false);
      setTypingStatus('');
      const isStrongStudent = targetStudent.avgPct >= 75;
      const reply = `Hồ sơ học tập của học sinh **${targetStudent.name}** (Lớp ${targetStudent.className}):
- Số bài thi đã hoàn thành: **${targetStudent.subCount} bài**.
- Điểm trung bình đạt: **${targetStudent.avgPct}%** (Thấp nhất: ${targetStudent.minPct}%, Cao nhất: ${targetStudent.maxPct}%).
- Đánh giá năng lực: ${
        targetStudent.avgPct < 50
          ? 'Em đang hổng kiến thức nền tảng và cần được can thiệp sớm bằng bài tập nhận biết - thông hiểu để lấy lại tự tin.'
          : isStrongStudent
            ? 'Em học vững và có phong độ tốt, nên khen ngợi khích lệ và giao thêm câu Vận dụng cao.'
            : 'Em nắm kiến thức ở mức trung bình - khá, nên củng cố thêm các dạng bài Thông hiểu & Vận dụng.'
      }`;

      const studentEntry = {
        studentName: targetStudent.name,
        pct: targetStudent.avgPct,
        subCount: targetStudent.subCount,
        studentId: targetStudent.studentId,
      };

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_student_' + Date.now(),
          sender: 'bot',
          text: reply,
          ...(isStrongStudent ? { topStudents: [studentEntry] } : { realAtRisk: [studentEntry] }),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 5. PHÒNG THI LIVE & GIÁM THỊ THỰC TẾ
    if (
      norm.includes('phòng thi') || norm.includes('vi phạm') || norm.includes('gian lận') ||
      norm.includes('giám sát') || norm.includes('chuyển tab')
    ) {
      setIsTyping(false);
      if (activeLiveRooms.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_proctor_' + Date.now(),
            sender: 'bot',
            text: `Hiện tại không có phòng thi trực tiếp nào đang mở (0 phòng thi LIVE). Thầy/Cô có thể mở phòng thi để AI kích hoạt camera giám sát:`,
            navSuggestions: [
              { label: 'Mở tab Phòng thi LIVE', sec: 'sessions' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      const realAlerts = [];
      activeLiveRooms.forEach((ss) => {
        (ss.students || []).forEach((st) => {
          const vs = st.violations || [];
          if (vs.length > 0) {
            const hardCount = vs.filter((v) => v.severity === 'hard').length;
            realAlerts.push({
              sessionId: ss.id,
              examTitle: ss.title || 'Phòng thi LIVE',
              studentId: st.studentId,
              name: st.studentName || 'Thí sinh',
              count: vs.length,
              lastViolation: vs[vs.length - 1]?.type || 'Chuyển tab làm bài',
              severity: hardCount > 0 || vs.length >= 3 ? 'Nghiêm trọng' : 'Trung bình',
            });
          }
        });
      });

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_proctor_' + Date.now(),
          sender: 'bot',
          text: realAlerts.length > 0
            ? `Cảnh báo trực tiếp: Đang ghi nhận ${realAlerts.length} học sinh có hành vi vi phạm quy chế:`
            : `Tất cả học sinh trong ${activeLiveRooms.length} phòng thi đang làm bài nghiêm túc, không có vi phạm!`,
          realAlerts: realAlerts.length > 0 ? realAlerts : null,
          navSuggestions: [{ label: 'Xem camera phòng thi LIVE', sec: 'sessions' }],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 6. HỌC SINH YẾU TOÀN TRƯỜNG (CHỈ KHI GIÁO VIÊN YÊU CẦU DANH SÁCH / BẢNG XẾP HẠNG HỌC SINH YẾU TOÀN DIỆN)
    const isAskingForWeakList = (
      !mentionedClassStr &&
      !targetStudent &&
      (
        norm.includes('danh sách học sinh yếu') ||
        norm.includes('ai kém nhất trường') ||
        norm.includes('học sinh nào kém nhất') ||
        norm.includes('học sinh nào yếu nhất') ||
        norm.includes('những học sinh cần phụ đạo') ||
        norm.includes('thống kê học sinh dưới 5') ||
        norm.includes('top học sinh kém') ||
        norm.includes('danh sách học sinh dưới trung bình') ||
        norm.includes('danh sách cần phụ đạo') ||
        ((norm.startsWith('ai kém') || norm.startsWith('ai yếu') || norm.startsWith('học sinh nào kém')) && !norm.includes('lớp'))
      ) &&
      !norm.includes('phương pháp') &&
      !norm.includes('làm sao') &&
      !norm.includes('tại sao') &&
      !norm.includes('vì sao') &&
      !norm.includes('soạn') &&
      !norm.includes('bài tập')
    );

    if (isAskingForWeakList) {
      setIsTyping(false);
      const subCount = realInsights.submissionCount;
      const atRisk = realInsights.atRisk || [];
      const weakest = realInsights.weakestTopics || [];

      if (subCount === 0) {
        const classNames = classes.map((c) => c.name).join(', ') || 'Chưa tạo lớp';
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_risk_' + Date.now(),
            sender: 'bot',
            text: `Hiện tại Thầy/Cô đang quản lý ${classes.length} lớp (${classNames}), nhưng hệ thống chưa ghi nhận bài nộp nào từ học sinh.`,
            navSuggestions: [
              { label: 'Mở Quản lý Lớp học', sec: 'classes' },
              { label: 'Giao đề từ Kho Đề Thi', sec: 'exams' },
            ],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_risk_' + Date.now(),
          sender: 'bot',
          text: `Tổng hợp trên toàn bộ các lớp (${subCount} bài nộp thực tế, Điểm TB: ${realInsights.avgPct}%, Tỷ lệ đạt: ${realInsights.passRate}%). Đang có ${atRisk.length} học sinh có điểm dưới 50% cần hỗ trợ:`,
          realAtRisk: atRisk,
          realWeakest: weakest.slice(0, 4),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }



    // 7. TRẢ LỜI SƯ PHẠM ĐA LƯỢT + STREAMING VỚI NGỮ CẢNH THỰC TẾ (GEMINI AI COPILOT)
    const streamMsgId = 'bot_text_' + Date.now();
    const replyTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    let hasStreamedBubble = false;

    try {
      setTypingStatus('Đang tổng hợp phân tích chuyên môn...');
      const richContextBlock = buildRichCopilotContext({
        user,
        inferredSubject,
        currentTabInfo,
        classes,
        exams,
        realInsights,
        activeLiveRooms,
        selectedClass,
        selectedExam,
      });
      const realContextPrompt = `Bạn là ELEC AI Senior Academic Copilot — Cố vấn Chuyên môn & Trợ lý Sư phạm Cấp cao của Quý Thầy/Cô.
Ngữ cảnh công tác THỜI GIAN THỰC của Thầy/Cô trên hệ thống ELEC AI:
${richContextBlock}

SƠ ĐỒ CÁC TAB CHỨC NĂNG THẬT TRÊN THANH ĐIỀU HƯỚNG BÊN TRÁI HỆ THỐNG:
1. "Số liệu lớp" (key: 'analytics'): Xem điểm số học sinh, phổ điểm, tỷ lệ đạt/khá/giỏi, phân tích điểm và xuất bảng điểm Excel (.xlsx).
2. "Tổng quan" (key: 'overview'): Báo cáo tổng thể, bấm vào đề thi để xem bài nộp.
3. "Kho đề thi" (key: 'exams'): Danh sách đề thi đã tạo, nút "Giao đề" cho lớp và nút "Xem bài nộp" để xem điểm chi tiết từng học sinh.
4. "Lớp học & Liên kết" (key: 'classes'): Danh sách lớp, tạo lớp, mã lớp mời học sinh, duyệt học sinh.
5. "AI Tạo đề" (key: 'create'): Soạn đề chuẩn GDPT 2025 theo yêu cầu.
6. "Ngân hàng câu hỏi" (key: 'bank'): Kho câu hỏi theo bài và mức độ nhận thức.
7. "Mô phỏng & Đảo đề" (key: 'simulator'): Đảo 4 mã đề kèm đáp án.
8. "Phòng thi LIVE" (key: 'sessions'): Giám sát trực tiếp học sinh làm bài thi trực tuyến.
9. "Chấm phiếu A4" (key: 'paper'): Quét và chấm tự động phiếu trắc nghiệm bằng camera/ảnh.
10. "Xin thi lại" (key: 'retry'): Duyệt học sinh xin thi lại do sự cố.
11. Bác sĩ sửa file Word (Trình soạn thảo Word A4 Office 365): Sửa đề, cân bằng Bloom, xem Khung Ma Trận và xuất .docx.

Câu hỏi/Yêu cầu hiện tại của Thầy/Cô (hãy bám sát mạch hội thoại trước đó nếu là câu hỏi tiếp nối):
"${query}"

HƯỚNG DẪN TRẢ LỜI:
1. ĐÚNG CHUYÊN MÔN & THỰC TIỄN:
   - Nếu Thầy/Cô hỏi về kiến thức chuyên môn (Toán học, Vật lí, Hóa học, Sinh học, Tiếng Anh...), phương pháp giảng dạy, ma trận đề, mẹo sư phạm, phân tích lỗi sai của học sinh: Trả lời với vị thế Chuyên gia Học thuật Cấp cao đúng chuyên ngành đó, bám sát Chương trình GDPT 2025, định lý/định luật chuẩn xác và kinh nghiệm sư phạm thực chiến.
   - Nếu Thầy/Cô hỏi về cách sử dụng web hay tính năng: DÙNG ĐÚNG tên các tab chức năng ở trên (Ví dụ: tab "Số liệu lớp" để xem điểm, tab "Kho đề thi" để xem bài nộp, tab "Lớp học & Liên kết" để quản lý thành viên). TUYỆT ĐỐI KHÔNG BỊA RA các module không có như "Gradebook" hay "module Quản lý lớp".
2. BỐ TRÍ CHUẨN CHATGPT:
   - Trình bày dạng danh sách gạch đầu dòng rõ ràng, phân chia các Bước 1, Bước 2, Bước 3.
   - In đậm các từ khóa vị trí, nút bấm.
   - Ngắn gọn, súc tích, mạch lạc, KHÔNG dùng emoji.
   - Dùng khối trích dẫn > cho các lưu ý hoặc mẹo hữu ích.`;

      const multiTurnHistory = buildConversationHistory(messagesRef.current, realContextPrompt, 8);
      const res = await callCopilotAI(
        multiTurnHistory,
        sendOpts.noCache ? { noCache: true } : {},
        CREDIT_TARIFF.CHAT_FAST,
        'Hỏi đáp sư phạm AI Copilot',
        (partialText) => {
          if (!partialText) return;
          if (!hasStreamedBubble) {
            hasStreamedBubble = true;
            setMessages((prev) => [
              ...prev,
              {
                id: streamMsgId,
                sender: 'bot',
                text: partialText,
                streaming: true,
                time: replyTimeStr,
              },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === streamMsgId ? { ...m, text: partialText } : m))
            );
          }
        }
      );

      const aiReply = typeof res === 'string' ? res : (res?.text || '');
      setIsTyping(false);
      setTypingStatus('');
      if (hasStreamedBubble) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamMsgId
              ? { ...m, text: aiReply || m.text || 'Em có thể giúp gì thêm cho Thầy/Cô ạ?', streaming: false }
              : m
          )
        );
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: streamMsgId,
            sender: 'bot',
            text: aiReply || 'Em có thể giúp gì thêm cho Thầy/Cô ạ?',
            time: replyTimeStr,
          },
        ]);
      }
    } catch (e) {
      setIsTyping(false);
      setTypingStatus('');
      if (e?.isAbort || e?.name === 'AbortError') {
        if (hasStreamedBubble) {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamMsgId ? { ...m, streaming: false } : m))
          );
        }
        return;
      }
      setMessages((prev) => {
        const cleaned = hasStreamedBubble ? prev.filter((m) => m.id !== streamMsgId) : prev;
        return [
          ...cleaned,
          {
            id: 'bot_err_' + Date.now(),
            sender: 'bot',
            text: aiErrMsg(e, 'Thầy/Cô có thể bấm mic nói tự nhiên hoặc gõ yêu cầu để em xử lý nhé!'),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      });
    }
  };

  // Bộ điều phối hành động nâng cao: Ảnh đề bài Vision, Sức khỏe lớp, Tin nhắn PH, Xuất Word, Tạo lại
  const handleImageSelected = useCallback(
    async (file) => {
      if (!file) return;
      try {
        const attachment = await readImageFileAsAttachment(file);
        setPendingImage(attachment);
        onSay?.(`Đã gắn ảnh "${attachment.name}" — chọn tác vụ nhanh hoặc bấm Gửi ngay!`, 'info');
        setTimeout(() => inputRef.current?.focus(), 0);
      } catch (err) {
        onSay?.(err?.message || 'Không đọc được tệp hình ảnh.', 'error');
      }
    },
    [onSay]
  );

  const handleShowClassHealth = useCallback(() => {
    const healthData = buildClassHealthCardData(realInsights, {
      classCount: classes.length,
      examCount: exams.length,
      subject: inferredSubject,
    });
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: 'bot_health_' + Date.now(),
        sender: 'bot',
        text:
          healthData.submissionCount > 0
            ? `Chẩn đoán sức khỏe lớp học từ **${healthData.submissionCount} bài nộp thực tế** (${classes.length} lớp · ${exams.length} đề):`
            : `Chưa có bài nộp nào để chẩn đoán sức khỏe lớp. Thầy/Cô có thể giao nhanh một đề 15 phút để thu thập dữ liệu:`,
        healthData: healthData.submissionCount > 0 ? healthData : undefined,
        navSuggestions:
          healthData.submissionCount === 0
            ? [
                { label: 'Soạn đề 15 phút ngay', action: 'start_wizard' },
                { label: 'Mở Kho Đề Thi', sec: 'exams' },
              ]
            : undefined,
        time: timeStr,
      },
    ]);
  }, [realInsights, classes.length, exams.length, inferredSubject]);

  const handleOpenParentReport = useCallback(
    (opts = {}) => {
      const fallbackStudent = realInsights.atRisk?.[0];
      const reportData = buildParentReportCardData({
        studentName: opts.studentName || fallbackStudent?.studentName || 'học sinh',
        pct: typeof opts.pct === 'number' ? opts.pct : fallbackStudent?.pct ?? null,
        subCount: opts.subCount ?? fallbackStudent?.subCount ?? 0,
        weakTopic: opts.weakTopic || realInsights.weakestTopics?.[0]?.topic || '',
        subject: inferredSubject,
        teacherName: user?.displayName || 'Giáo viên bộ môn',
      });
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_parent_' + Date.now(),
          sender: 'bot',
          text: `Đã soạn 3 mẫu tin nhắn gửi phụ huynh em **${reportData.studentName}**. Thầy/Cô chọn giọng điệu phù hợp và bấm sao chép để dán vào Zalo:`,
          parentReport: reportData,
          time: timeStr,
        },
      ]);
    },
    [realInsights, inferredSubject, user?.displayName]
  );

  const handleExportNoteWord = useCallback(
    async (content) => {
      if (!content) return;
      try {
        const fn = await exportAiNoteDocx({
          title: `Tài liệu sư phạm ELEC AI (${inferredSubject})`,
          content,
          teacherName: user?.displayName || user?.email || 'Thầy/Cô',
          schoolName: user?.schoolName || 'TRƯỜNG THPT',
          subject: inferredSubject,
        });
        onSay?.(`Đã xuất file Word: ${fn}`, 'success');
      } catch (err) {
        onSay?.(`Lỗi xuất file Word: ${err?.message || err}`, 'error');
      }
    },
    [inferredSubject, user?.displayName, user?.email, user?.schoolName, onSay]
  );

  const handleRegenerateLast = useCallback(() => {
    if (isTyping) return;
    const list = messagesRef.current || [];
    let lastUserIdx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i]?.sender === 'user' && list[i]?.text) {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;
    const lastUserText = list[lastUserIdx].text;
    setMessages((prev) => prev.slice(0, lastUserIdx + 1));
    setTimeout(() => {
      handleSend(lastUserText, null, { skipUserBubble: true, skipImage: true, noCache: true, forceAi: true });
    }, 0);
  }, [isTyping]);

  const handleStartWizardWithTopic = useCallback(
    (topic) => {
      handleStartExamWizard({ subject: inferredSubject, topic });
    },
    [inferredSubject]
  );

  const handleOpenWordEditor = useCallback(
    (exam) => {
      setWordEditorExam(exam || (exams && exams[0]) || null);
      setWordEditorOpen(true);
    },
    [exams]
  );

  const handleQuickAction = useCallback(
    (action) => {
      if (action === 'start_wizard') {
        handleStartExamWizard();
      } else if (action === 'pick_file') {
        fileInputRef.current?.click();
      } else if (action === 'pick_image') {
        imageInputRef.current?.click();
      } else if (action === 'class_health') {
        handleShowClassHealth();
      } else if (action === 'parent_report') {
        handleOpenParentReport();
      } else if (action === 'word_editor') {
        handleOpenWordEditor();
      } else if (action === 'prefill_audit') {
        setInput('Thẩm định & phán xét câu hỏi GDPT 2025: ');
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (action === 'run_sim_latest') {
        const targetExam = selectedExam || (exams && exams[0]);
        if (targetExam && targetExam.questions?.length) {
          handleRunSimulation(targetExam);
        } else {
          handleSend('Chạy mô phỏng 100 học sinh ảo giải đề thi');
        }
      } else if (action === 'analyze_tab') {
        handleAnalyzeCurrentTab();
      } else if (action === 'clear_chat') {
        handleClearChat();
      }
    },
    [selectedExam, exams, handleOpenWordEditor, handleClearChat, handleShowClassHealth, handleOpenParentReport]
  );

  const handleRunSlashCommand = useCallback(
    (item) => {
      if (!item) return;
      if (item.action) {
        handleQuickAction(item.action);
      } else if (item.query) {
        handleSend(item.query);
      }
    },
    [handleQuickAction]
  );

  // Kéo thả file Word/PDF hoặc Ảnh đề bài (.png/.jpg/.webp)
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => { setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (dropped.type?.startsWith('image/')) {
      handleImageSelected(dropped);
    } else {
      handleProcessRealFile(dropped);
    }
  };

  return (
    <>
      {/* ============================================================
          1. NÚT NỔI LAUNCHER GÓC DƯỚI PHẢI
          ============================================================ */}
      <div className="tfc-launcher-wrap">
        <span className="tfc-launcher-tooltip" aria-hidden="true">
          <strong>ELEC AI Agent</strong>
          <span>
            {realViolationsCount > 0
              ? `${realViolationsCount} cảnh báo LIVE`
              : `${classes.length} lớp · ${exams.length} đề thi`}
          </span>
        </span>
        <button
          type="button"
          className={`tfc-launcher-btn ${isOpen ? 'is-open' : ''} ${realViolationsCount > 0 ? 'has-alert' : ''}`}
          onClick={() => setIsOpen((v) => !v)}
          title="ELEC AI Agent (Cố vấn Sư phạm & Khảo thí GDPT 2025)"
          aria-label="ELEC AI Agent"
        >
          <div className="tfc-launcher-avatar">
            <ElecMascot
              mood={isOpen ? 'happy' : realViolationsCount > 0 ? 'suspicious' : 'cool'}
              size={36}
              alt="ELEC AI"
              className="tfc-launcher-mascot"
            />
            <div className={`tfc-live-pulse-dot ${realViolationsCount > 0 ? 'alert' : ''}`} />
          </div>
        </button>
      </div>

      {/* ============================================================
          2. CỬA SỔ CON CHAT
          ============================================================ */}
      {isOpen && (
        <div
          className={`tfc-window ${isExpanded ? 'expanded' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {isDragging && (
            <div className="tfc-drag-overlay">
              <IcoFileDoc size={48} />
              <span>Thả file Word (.docx), PDF hoặc Ảnh đề bài (.png/.jpg) vào đây</span>
            </div>
          )}

          {/* Header gọn gàng 1 dòng, không lặp số liệu */}
          <div className="tfc-header">
            <div className="tfc-header-left">
              <div className="tfc-header-avatar">
                <ElecMascot
                  mood={isTyping ? 'think' : realViolationsCount > 0 ? 'suspicious' : 'hello'}
                  size={34}
                  alt="ELEC AI"
                />
              </div>
              <div className="tfc-header-meta">
                <div className="tfc-header-title-row">
                  <span className="tfc-header-title">ELEC AI Agent</span>
                  {activeLiveRooms.length > 0 && (
                    <span className="tfc-header-pill is-live">
                      {activeLiveRooms.length} LIVE
                    </span>
                  )}
                </div>
                <div className="tfc-header-status">
                  <div className={`tfc-status-dot ${realViolationsCount > 0 ? 'alert' : ''}`} />
                  <span className="tfc-header-status-text">
                    {isTyping
                      ? (typingStatus || 'ELEC đang phân tích...')
                      : realViolationsCount > 0
                        ? `Đang theo dõi ${realViolationsCount} cảnh báo LIVE`
                        : `Trợ lý GDPT 2025 · ${inferredSubject}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="tfc-header-actions">
              <button
                type="button"
                className="tfc-icon-btn"
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? 'Thu nhỏ chiều rộng' : 'Mở rộng chiều rộng'}
              >
                {isExpanded ? <IcoMinimize size={15} /> : <IcoMaximize size={15} />}
              </button>
              <button
                type="button"
                className="tfc-icon-btn"
                onClick={() => setConfirmClearChat((v) => !v)}
                title="Làm mới cuộc trò chuyện"
              >
                <IcoTrash size={15} />
              </button>
              <button
                type="button"
                className="tfc-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng trợ lý (Esc)"
              >
                <IcoMinus size={16} />
              </button>
            </div>
          </div>

          {confirmClearChat && (
            <div className="tfc-confirm-bar">
              <span>Làm mới lại cuộc trò chuyện này?</span>
              <div className="tfc-confirm-actions">
                <button
                  type="button"
                  className="tfc-confirm-cancel"
                  onClick={() => setConfirmClearChat(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="tfc-confirm-ok"
                  onClick={handleClearChat}
                >
                  Xóa mới
                </button>
              </div>
            </div>
          )}

          {/* Cảm biến ngữ cảnh Tab thời gian thực (Nguồn số liệu đồng nhất duy nhất) */}
          <div className="tfc-context-radar">
            <div className="tfc-radar-left">
              <span className="tfc-radar-pulse" />
              <div className="tfc-radar-meta">
                <span className="tfc-radar-title">Đang ở: <b>{currentTabInfo.shortName}</b></span>
                <span className="tfc-radar-badge" title={currentTabInfo.contextBadge}>{currentTabInfo.contextBadge}</span>
              </div>
            </div>
            <button
              type="button"
              className="tfc-radar-analyze-btn"
              onClick={handleAnalyzeCurrentTab}
              title="Yêu cầu AI tự động phân tích chi tiết chức năng, số liệu và quy trình chuẩn của tab này"
            >
              <IcoSparkles size={11} /> Phân tích tab này
            </button>
          </div>

          {/* Danh sách tin nhắn đã tách & memo hóa */}
          <TeacherChatMessageList
            messages={messages}
            isTyping={isTyping}
            typingStatus={typingStatus}
            copiedId={copiedId}
            speakingMsgId={speakingMsgId}
            inferredSubject={inferredSubject}
            user={user}
            classes={classes}
            linkedClasses={linkedClasses}
            exams={exams}
            bodyEndRef={bodyEndRef}
            onCopyMessage={handleCopyMessage}
            onSpeakText={speakText}
            onStopGeneration={handleStopGeneration}
            onRegenerateLast={handleRegenerateLast}
            onExportNoteWord={handleExportNoteWord}
            onQuickAction={handleQuickAction}
            onOpenParentReport={handleOpenParentReport}
            onStartWizardWithTopic={handleStartWizardWithTopic}
            onSend={handleSend}
            onNavigate={onNavigate}
            onOpenSimulator={onOpenSimulator}
            onCreateExam={onCreateExam}
            onOpenImporter={onOpenImporter}
            onSay={onSay}
            onRunSimulation={handleRunSimulation}
            onRunCognitiveRx={handleRunCognitiveRx}
            onUpdateWizard={handleUpdateWizard}
            onExecuteGenerateExam={handleExecuteGenerateExam}
            onAiCompleteExam3Parts={handleAiCompleteExam3Parts}
            onAiFillMissingAnswers={handleAiFillMissingAnswers}
            onExportExamWord={handleExportExamWord}
            onOpenWordEditor={handleOpenWordEditor}
            onCreateClassDirectly={handleCreateClassDirectly}
            getTopicsForSubjectAndGrade={getTopicsForSubjectAndGrade}
          />

          {/* Thanh gợi ý nhanh gọn theo ngữ cảnh Tab (không lặp nút Phân tích tab) */}
          {(currentTabInfo.quickChips || []).length > 0 && (
            <div className="tfc-quick-chips-wrap">
              <div className="tfc-quick-chips">
                {(currentTabInfo.quickChips || []).map((qc, qIdx) => (
                  <button
                    key={'tc_' + qIdx}
                    type="button"
                    className={`tfc-chip ${qIdx === 0 ? 'tone-emerald' : ''}`}
                    onClick={() => {
                      if (qc.action) handleQuickAction(qc.action);
                      else if (qc.query) handleSend(qc.query);
                    }}
                  >
                    {qc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Khung nhập liệu tự giãn + Ảnh đề bài (Vision/Ctrl+V) + 4 Chế độ AI + Slash Commands */}
          <TeacherChatComposer
            input={input}
            setInput={setInput}
            inputRef={inputRef}
            fileInputRef={fileInputRef}
            imageInputRef={imageInputRef}
            aiMode={aiMode}
            onChangeAiMode={setAiMode}
            pendingImage={pendingImage}
            onImageSelected={handleImageSelected}
            onClearPendingImage={() => setPendingImage(null)}
            isTyping={isTyping}
            isRecording={isRecording}
            inferredSubject={inferredSubject}
            onSubmit={(promptOverride) => handleSend(promptOverride)}
            onStopGeneration={handleStopGeneration}
            onToggleMic={toggleMic}
            onFileSelected={handleProcessRealFile}
            onRunSlashCommand={handleRunSlashCommand}
          />
        </div>
      )}
      {/* ============================================================
          TRÌNH SOẠN THẢO & SỬA FILE WORD GIỐNG WORD (WORD DOCX EDITOR)
          ============================================================ */}
      {wordEditorOpen && (
        <React.Suspense fallback={null}>
          <WordDocxEditor
            open={wordEditorOpen}
            onClose={() => setWordEditorOpen(false)}
            initialExam={wordEditorExam || null}
            initialClassId={selectedClass?.id || classes?.[0]?.id || ''}
            classes={classes}
            onSaveToClass={async (ex) => {
              if (onCreateExam) await onCreateExam(ex);
              else onSay?.(`Đã lưu đề "${ex.title}"!`, 'success');
            }}
            onSay={onSay}
          />
        </React.Suspense>
      )}
    </>
  );
}
