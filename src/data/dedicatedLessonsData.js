/* ============================================================
   dedicatedLessonsData.js — DỮ LIỆU BÀI HỌC CHUYÊN SÂU ELEC AI (CHUẨN GDPT 2026)
   ------------------------------------------------------------
   Mỗi môn (Vật lí, Hóa học, Sinh học) có các chương và bài học chi tiết:
     • id: mã bài học duy nhất
     • chapterId: mã chương cha
     • chapterName: tên chương
     • chapterNum: '01', '02'...
     • title: tên bài học (chuẩn danh pháp IUPAC theo CT GDPT 2018)
     • questionsCount: số câu trắc nghiệm
     • durationMinutes: thời lượng học ước tính
     • concepts: các khái niệm cốt lõi (MathText / KaTeX)
     • algorithms: các bước quy trình giải mẫu
     • formulas: thẻ công thức chuẩn thi tốt nghiệp & ĐGNL (KaTeX)
     • traps: các bẫy đề thi và lỗi thường gặp kèm cách né
     • flashcards: thẻ ghi nhớ phản xạ nhanh
     • sampleQuestions & exam2026Questions: bộ câu hỏi chuẩn ma trận đề 2026 (MCQ, Đúng/Sai, Trả lời ngắn)
     • infographics: danh sách tài nguyên đồ họa trực quan (knowledgeManifest)
   ============================================================ */

import { getInfographicsForTopic } from './knowledgeManifest.js';

export const DEDICATED_LESSONS = {
  "ly": [
    {
      "chapterId": "ly-c1-donghoc",
      "chapterNum": "01",
      "chapterName": "Động học",
      "lessons": [
        {
          "id": "ly-chuyen-dong-nem",
          "title": "Chuyển động ném ngang & ném xiên",
          "questionsCount": 36,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Chuyển động ném ngang",
              "desc": "Vật được ném theo phương ngang với vận tốc ban đầu $v_0$. Phân tích thành: Ox thẳng đều ($v_x = v_0, a_x = 0$), Oy rơi tự do ($v_y = gt, a_y = g$)."
            },
            {
              "title": "Chuyển động ném xiên",
              "desc": "Vận tốc $v_0$ hợp góc $\\alpha$ với phương ngang: $v_{0x} = v_0 \\cos\\alpha$, $v_{0y} = v_0 \\sin\\alpha$. Tầm bay cao $H = \\frac{v_0^2 \\sin^2\\alpha}{2g}$, tầm bay xa $L = \\frac{v_0^2 \\sin 2\\alpha}{g}$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Chiếu lên trục Oxy",
              "instruction": "Ox theo phương ngang, Oy thẳng đứng hướng xuống."
            },
            {
              "step": 2,
              "title": "Tìm t, tầm xa và vận tốc",
              "instruction": "Vật chạm đất khi $y = h \\implies t = \\sqrt{2h/g}$. Tầm xa $L = v_0 t$."
            }
          ],
          "formulas": [
            {
              "label": "Phương trình quỹ đạo ném ngang",
              "formula": "y = \\frac{g}{2v_0^2} x^2",
              "displayLatex": "y = \\frac{g}{2v_0^2} x^2",
              "notes": "Quỹ đạo là nhánh parabol đỉnh O."
            },
            {
              "label": "Thời gian rơi và tầm xa ném ngang",
              "formula": "t = \\sqrt{\\frac{2h}{g}}, \\quad L = v_0 \\sqrt{\\frac{2h}{g}}",
              "displayLatex": "t = \\sqrt{\\frac{2h}{g}}, \\quad L = v_0 \\sqrt{\\frac{2h}{g}}",
              "notes": "Thời gian rơi độc lập với v₀."
            },
            {
              "label": "Vận tốc khi chạm đất",
              "formula": "v = \\sqrt{v_0^2 + 2gh}",
              "displayLatex": "v = \\sqrt{v_0^2 + 2gh}",
              "notes": "Tổng hợp hai thành phần vuông góc: v_x và v_y."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng ném mạnh hơn thì vật rơi lâu hơn",
              "avoid": "Thời gian rơi chỉ phụ thuộc vào độ cao h và gia tốc g."
            },
            {
              "trap": "Quên cộng vận tốc ban đầu nằm ngang khi chạm đất",
              "avoid": "Vận tốc chạm đất là $v = \\sqrt{v_0^2 + 2gh}$."
            }
          ],
          "aspiration": {
            "priorityTag": "🔥 Trọng tâm ANND (≥ 8.5đ)",
            "examFrequency": "Chiếm 3 – 4 câu trong ma trận đề thi",
            "targetSchool": "Học viện An ninh Nhân dân (ANND)",
            "targetScoreAdvice": "Để trúng tuyển ngành An ninh mạng ANND, điểm Vật lí cần đạt ≥ 8.75đ. Bài Chuyển động ném là mắt xích phân loại cốt lõi để chạm mốc điểm này."
          },
          "podcast": {
            "title": "Audio tóm tắt nhanh 3 phút: Bản chất & Thủ thuật Chuyển động ném",
            "duration": "03:15",
            "audioScript": "Chào bạn, trong 3 phút này ELEC AI sẽ giúp bạn làm chủ bài Chuyển động ném. Nguyên tắc vàng: Phương ngang luôn là chuyển động thẳng đều với vận tốc v0 không đổi. Phương thẳng đứng rơi tự do với gia tốc g. Nhớ kỹ: thời gian rơi CHỈ phụ thuộc vào độ cao H, hoàn toàn không phụ thuộc vào vận tốc ném ngang!"
          },
          "flashcards": [
            {
              "id": "fc-p1-1",
              "front": "Thời gian rơi của ném ngang phụ thuộc vào yếu tố nào?",
              "back": "Chỉ phụ thuộc vào độ cao h và g: t = √(2h/g)."
            },
            {
              "id": "fc-p1-2",
              "front": "Dạng quỹ đạo chuyển động ném ngang là gì?",
              "back": "Một nhánh parabol đỉnh tại điểm ném."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Từ độ cao $h = 45\\text{ m}$, ném một vật theo phương ngang với $v_0 = 20\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tầm bay xa của vật là:",
              "options": [
                "60 m",
                "45 m",
                "90 m",
                "30 m"
              ],
              "correct": 0,
              "solution": "Thời gian rơi: $t = \\sqrt{2h/g} = 3\\text{ s}$. Tầm bay xa: $L = v_0 \\times t = 20 \\times 3 = 60\\text{ m}$.",
              "trapAlert": "Nhầm công thức tầm xa với quãng đường rơi tự do.",
              "fastTip": "t = 3s -> L = 20 * 3 = 60m."
            },
            {
              "id": "q-p1-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một máy bay bay ngang ở độ cao 500 m với tốc độ 100 m/s thả một kiện hàng. Lấy $g = 10\\text{ m/s}^2$. Bỏ qua sức cản. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p1-a",
                  "statement": "a) Thời gian rơi của kiện hàng là 10 giây.",
                  "isTrue": true,
                  "explain": "t = √(2*500/10) = 10 s. Đúng."
                },
                {
                  "id": "tf-p1-b",
                  "statement": "b) Tầm xa theo phương ngang là 1000 m.",
                  "isTrue": true,
                  "explain": "L = 100 * 10 = 1000 m. Đúng."
                },
                {
                  "id": "tf-p1-c",
                  "statement": "c) Vận tốc khi chạm đất là 100 m/s.",
                  "isTrue": false,
                  "explain": "v = √(100² + 2*10*500) = 141,4 m/s. Sai."
                },
                {
                  "id": "tf-p1-d",
                  "statement": "d) Quỹ đạo đối với phi công là một đường thẳng đứng.",
                  "isTrue": true,
                  "explain": "Đối với phi công, kiện hàng luôn ở ngay dưới máy bay nên rơi thẳng đứng. Đúng."
                }
              ]
            },
            {
              "id": "q-p1-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Ném ngang một quả bóng từ độ cao 80 m với vận tốc $v_0 = 15\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ của quả bóng khi chạm đất (đơn vị: m/s, làm tròn số nguyên gần nhất).",
              "correctAnswer": "43",
              "unit": "m/s",
              "solution": "v_y = √(2*10*80) = 40 m/s. v = √(15² + 40²) = √1825 ≈ 42,72 ≈ 43 m/s.",
              "trapAlert": "Quên cộng vận tốc ngang ban đầu 15 m/s."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Từ độ cao $h = 45\\text{ m}$, ném một vật theo phương ngang với $v_0 = 20\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tầm bay xa của vật là:",
              "options": [
                "60 m",
                "45 m",
                "90 m",
                "30 m"
              ],
              "correct": 0,
              "solution": "Thời gian rơi: $t = \\sqrt{2h/g} = 3\\text{ s}$. Tầm bay xa: $L = v_0 \\times t = 20 \\times 3 = 60\\text{ m}$.",
              "trapAlert": "Nhầm công thức tầm xa với quãng đường rơi tự do.",
              "fastTip": "t = 3s -> L = 20 * 3 = 60m."
            },
            {
              "id": "q-p1-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một máy bay bay ngang ở độ cao 500 m với tốc độ 100 m/s thả một kiện hàng. Lấy $g = 10\\text{ m/s}^2$. Bỏ qua sức cản. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p1-a",
                  "statement": "a) Thời gian rơi của kiện hàng là 10 giây.",
                  "isTrue": true,
                  "explain": "t = √(2*500/10) = 10 s. Đúng."
                },
                {
                  "id": "tf-p1-b",
                  "statement": "b) Tầm xa theo phương ngang là 1000 m.",
                  "isTrue": true,
                  "explain": "L = 100 * 10 = 1000 m. Đúng."
                },
                {
                  "id": "tf-p1-c",
                  "statement": "c) Vận tốc khi chạm đất là 100 m/s.",
                  "isTrue": false,
                  "explain": "v = √(100² + 2*10*500) = 141,4 m/s. Sai."
                },
                {
                  "id": "tf-p1-d",
                  "statement": "d) Quỹ đạo đối với phi công là một đường thẳng đứng.",
                  "isTrue": true,
                  "explain": "Đối với phi công, kiện hàng luôn ở ngay dưới máy bay nên rơi thẳng đứng. Đúng."
                }
              ]
            },
            {
              "id": "q-p1-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Ném ngang một quả bóng từ độ cao 80 m với vận tốc $v_0 = 15\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ của quả bóng khi chạm đất (đơn vị: m/s, làm tròn số nguyên gần nhất).",
              "correctAnswer": "43",
              "unit": "m/s",
              "solution": "v_y = √(2*10*80) = 40 m/s. v = √(15² + 40²) = √1825 ≈ 42,72 ≈ 43 m/s.",
              "trapAlert": "Quên cộng vận tốc ngang ban đầu 15 m/s."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Từ độ cao $h = 45\\text{ m}$, ném một vật theo phương ngang với $v_0 = 20\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tầm bay xa của vật là:",
              "options": [
                "60 m",
                "45 m",
                "90 m",
                "30 m"
              ],
              "correct": 0,
              "solution": "Thời gian rơi: $t = \\sqrt{2h/g} = 3\\text{ s}$. Tầm bay xa: $L = v_0 \\times t = 20 \\times 3 = 60\\text{ m}$.",
              "trapAlert": "Nhầm công thức tầm xa với quãng đường rơi tự do.",
              "fastTip": "t = 3s -> L = 20 * 3 = 60m."
            },
            {
              "id": "q-p1-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một máy bay bay ngang ở độ cao 500 m với tốc độ 100 m/s thả một kiện hàng. Lấy $g = 10\\text{ m/s}^2$. Bỏ qua sức cản. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p1-a",
                  "statement": "a) Thời gian rơi của kiện hàng là 10 giây.",
                  "isTrue": true,
                  "explain": "t = √(2*500/10) = 10 s. Đúng."
                },
                {
                  "id": "tf-p1-b",
                  "statement": "b) Tầm xa theo phương ngang là 1000 m.",
                  "isTrue": true,
                  "explain": "L = 100 * 10 = 1000 m. Đúng."
                },
                {
                  "id": "tf-p1-c",
                  "statement": "c) Vận tốc khi chạm đất là 100 m/s.",
                  "isTrue": false,
                  "explain": "v = √(100² + 2*10*500) = 141,4 m/s. Sai."
                },
                {
                  "id": "tf-p1-d",
                  "statement": "d) Quỹ đạo đối với phi công là một đường thẳng đứng.",
                  "isTrue": true,
                  "explain": "Đối với phi công, kiện hàng luôn ở ngay dưới máy bay nên rơi thẳng đứng. Đúng."
                }
              ]
            },
            {
              "id": "q-p1-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Ném ngang một quả bóng từ độ cao 80 m với vận tốc $v_0 = 15\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ của quả bóng khi chạm đất (đơn vị: m/s, làm tròn số nguyên gần nhất).",
              "correctAnswer": "43",
              "unit": "m/s",
              "solution": "v_y = √(2*10*80) = 40 m/s. v = √(15² + 40²) = √1825 ≈ 42,72 ≈ 43 m/s.",
              "trapAlert": "Quên cộng vận tốc ngang ban đầu 15 m/s."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-chuyen-dong-thang-bien-doi-deu",
          "title": "Chuyển động thẳng biến đổi đều",
          "questionsCount": 22,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Gia tốc không đổi",
              "desc": "Gia tốc là đại lượng vectơ đặc trưng cho sự thay đổi vận tốc: $\\vec{a} = \\frac{\\Delta\\vec{v}}{\\Delta t} = \\text{const}$."
            },
            {
              "title": "Dấu của gia tốc và vận tốc",
              "desc": "Nhanh dần đều: $\\vec{a}$ cùng hướng $\\vec{v} \\implies a \\cdot v > 0$. Chậm dần đều: $\\vec{a}$ ngược hướng $\\vec{v} \\implies a \\cdot v < 0$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Chọn chiều dương",
              "instruction": "Chọn chiều dương cùng chiều vận tốc ban đầu $v_0$."
            },
            {
              "step": 2,
              "title": "Áp dụng công thức phù hợp",
              "instruction": "Nếu có t: $v = v_0 + at$, $d = v_0 t + 0.5at^2$. Nếu không có t: $v^2 - v_0^2 = 2ad$."
            }
          ],
          "formulas": [
            {
              "label": "Phương trình vận tốc",
              "formula": "v = v_0 + at",
              "displayLatex": "v = v_0 + at",
              "notes": "a mang dấu đại số theo chiều dương đã chọn."
            },
            {
              "label": "Phương trình độ dịch chuyển",
              "formula": "d = v_0 t + \\frac{1}{2}at^2",
              "displayLatex": "d = v_0 t + \\frac{1}{2}at^2",
              "notes": "Không đổi chiều thì s = d."
            },
            {
              "label": "Công thức độc lập thời gian",
              "formula": "v^2 - v_0^2 = 2ad",
              "displayLatex": "v^2 - v_0^2 = 2ad",
              "notes": "Dùng khi bài toán không cho đại lượng thời gian t."
            }
          ],
          "traps": [
            {
              "trap": "Quên dấu âm của gia tốc khi vật hãm phanh",
              "avoid": "Hãm phanh chậm dần đều luôn có $a < 0$."
            },
            {
              "trap": "Tính thời gian sau khi xe đã dừng hẳn",
              "avoid": "Phải tìm thời điểm dừng $t = -v_0 / a$ trước."
            }
          ],
          "aspiration": {
            "priorityTag": "✓ Ăn chắc điểm nền tảng (8.0đ)",
            "examFrequency": "Chiếm 2 – 3 câu trong đề thi",
            "targetSchool": "Học viện An ninh Nhân dân (ANND)",
            "targetScoreAdvice": "Dạng bài nền tảng tuyệt đối không được mất điểm. Đạt điểm tối đa phần này sẽ tạo đà vững chắc cho nhóm câu phân loại."
          },
          "podcast": {
            "title": "Audio tóm tắt nhanh 3 phút: Chuyển động biến đổi đều",
            "duration": "02:45",
            "audioScript": "Ghi nhớ công thức độc lập thời gian v bình trừ v0 bình bằng 2as. Nhanh dần đều a và v cùng dấu, chậm dần đều a và v trái dấu. Hãy cẩn thận dấu âm của gia tốc nhé!"
          },
          "flashcards": [
            {
              "id": "fc-p2-1",
              "front": "Dấu hiệu nhận biết chuyển động chậm dần đều?",
              "back": "Tích a * v < 0 (gia tốc và vận tốc ngược dấu)."
            },
            {
              "id": "fc-p2-2",
              "front": "Công thức Torricelli không chứa thời gian t?",
              "back": "v² - v₀² = 2ad."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p2-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tàu hỏa chạy 72 km/h thì hãm phanh chậm dần đều, sau 10s còn 36 km/h. Quãng đường đi trong 10s đó là:",
              "options": [
                "150 m",
                "200 m",
                "100 m",
                "250 m"
              ],
              "correct": 0,
              "solution": "v₀ = 20 m/s, v = 10 m/s. s = ((20 + 10)/2) * 10 = 150 m.",
              "trapAlert": "Quên đổi km/h ra m/s.",
              "fastTip": "v_tb = 15 m/s -> s = 15 * 10 = 150 m."
            },
            {
              "id": "q-p2-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Ô tô đang chạy 54 km/h thì hãm phanh với độ lớn gia tốc $2\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p2-a",
                  "statement": "a) Vận tốc ban đầu bằng 15 m/s.",
                  "isTrue": true,
                  "explain": "54 / 3,6 = 15 m/s. Đúng."
                },
                {
                  "id": "tf-p2-b",
                  "statement": "b) Sau 7,5 giây ô tô dừng lại hẳn.",
                  "isTrue": true,
                  "explain": "t = 15 / 2 = 7,5 s. Đúng."
                },
                {
                  "id": "tf-p2-c",
                  "statement": "c) Quãng đường đi sau 5 giây là 50 m.",
                  "isTrue": true,
                  "explain": "s = 15*5 - 0,5*2*25 = 50 m. Đúng."
                },
                {
                  "id": "tf-p2-d",
                  "statement": "d) Quãng đường hãm phanh tới khi dừng là 60 m.",
                  "isTrue": false,
                  "explain": "s = 15² / (2*2) = 56,25 m != 60 m. Sai."
                }
              ]
            },
            {
              "id": "q-p2-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & ĐGNL",
              "prompt": "Vật chuyển động nhanh dần đều không vận tốc đầu, đi được 24 m trong 4 giây. Quãng đường đi trong giây thứ 4 là bao nhiêu mét (viết số thập phân)?",
              "correctAnswer": "10.5",
              "unit": "m",
              "solution": "24 = 0,5*a*16 -> a = 3 m/s². s_3 = 0,5*3*9 = 13,5 m. Delta_s = 24 - 13,5 = 10,5 m.",
              "trapAlert": "Nhầm quãng đường trong 4s với quãng đường TRONG giây thứ 4."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p2-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tàu hỏa chạy 72 km/h thì hãm phanh chậm dần đều, sau 10s còn 36 km/h. Quãng đường đi trong 10s đó là:",
              "options": [
                "150 m",
                "200 m",
                "100 m",
                "250 m"
              ],
              "correct": 0,
              "solution": "v₀ = 20 m/s, v = 10 m/s. s = ((20 + 10)/2) * 10 = 150 m.",
              "trapAlert": "Quên đổi km/h ra m/s.",
              "fastTip": "v_tb = 15 m/s -> s = 15 * 10 = 150 m."
            },
            {
              "id": "q-p2-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Ô tô đang chạy 54 km/h thì hãm phanh với độ lớn gia tốc $2\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p2-a",
                  "statement": "a) Vận tốc ban đầu bằng 15 m/s.",
                  "isTrue": true,
                  "explain": "54 / 3,6 = 15 m/s. Đúng."
                },
                {
                  "id": "tf-p2-b",
                  "statement": "b) Sau 7,5 giây ô tô dừng lại hẳn.",
                  "isTrue": true,
                  "explain": "t = 15 / 2 = 7,5 s. Đúng."
                },
                {
                  "id": "tf-p2-c",
                  "statement": "c) Quãng đường đi sau 5 giây là 50 m.",
                  "isTrue": true,
                  "explain": "s = 15*5 - 0,5*2*25 = 50 m. Đúng."
                },
                {
                  "id": "tf-p2-d",
                  "statement": "d) Quãng đường hãm phanh tới khi dừng là 60 m.",
                  "isTrue": false,
                  "explain": "s = 15² / (2*2) = 56,25 m != 60 m. Sai."
                }
              ]
            },
            {
              "id": "q-p2-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & ĐGNL",
              "prompt": "Vật chuyển động nhanh dần đều không vận tốc đầu, đi được 24 m trong 4 giây. Quãng đường đi trong giây thứ 4 là bao nhiêu mét (viết số thập phân)?",
              "correctAnswer": "10.5",
              "unit": "m",
              "solution": "24 = 0,5*a*16 -> a = 3 m/s². s_3 = 0,5*3*9 = 13,5 m. Delta_s = 24 - 13,5 = 10,5 m.",
              "trapAlert": "Nhầm quãng đường trong 4s với quãng đường TRONG giây thứ 4."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p2-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tàu hỏa chạy 72 km/h thì hãm phanh chậm dần đều, sau 10s còn 36 km/h. Quãng đường đi trong 10s đó là:",
              "options": [
                "150 m",
                "200 m",
                "100 m",
                "250 m"
              ],
              "correct": 0,
              "solution": "v₀ = 20 m/s, v = 10 m/s. s = ((20 + 10)/2) * 10 = 150 m.",
              "trapAlert": "Quên đổi km/h ra m/s.",
              "fastTip": "v_tb = 15 m/s -> s = 15 * 10 = 150 m."
            },
            {
              "id": "q-p2-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Ô tô đang chạy 54 km/h thì hãm phanh với độ lớn gia tốc $2\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p2-a",
                  "statement": "a) Vận tốc ban đầu bằng 15 m/s.",
                  "isTrue": true,
                  "explain": "54 / 3,6 = 15 m/s. Đúng."
                },
                {
                  "id": "tf-p2-b",
                  "statement": "b) Sau 7,5 giây ô tô dừng lại hẳn.",
                  "isTrue": true,
                  "explain": "t = 15 / 2 = 7,5 s. Đúng."
                },
                {
                  "id": "tf-p2-c",
                  "statement": "c) Quãng đường đi sau 5 giây là 50 m.",
                  "isTrue": true,
                  "explain": "s = 15*5 - 0,5*2*25 = 50 m. Đúng."
                },
                {
                  "id": "tf-p2-d",
                  "statement": "d) Quãng đường hãm phanh tới khi dừng là 60 m.",
                  "isTrue": false,
                  "explain": "s = 15² / (2*2) = 56,25 m != 60 m. Sai."
                }
              ]
            },
            {
              "id": "q-p2-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & ĐGNL",
              "prompt": "Vật chuyển động nhanh dần đều không vận tốc đầu, đi được 24 m trong 4 giây. Quãng đường đi trong giây thứ 4 là bao nhiêu mét (viết số thập phân)?",
              "correctAnswer": "10.5",
              "unit": "m",
              "solution": "24 = 0,5*a*16 -> a = 3 m/s². s_3 = 0,5*3*9 = 13,5 m. Delta_s = 24 - 13,5 = 10,5 m.",
              "trapAlert": "Nhầm quãng đường trong 4s với quãng đường TRONG giây thứ 4."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-su-roi-tu-do",
          "title": "Sự rơi tự do",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Bản chất sự rơi tự do",
              "desc": "Chuyển động rơi của các vật chỉ chịu tác dụng của trọng lực. Không phụ thuộc khối lượng vật nặng hay nhẹ."
            },
            {
              "title": "Gia tốc rơi tự do g",
              "desc": "Tại cùng một vĩ độ địa lí, mọi vật rơi tự do với cùng gia tốc $g \\approx 9{,}8\\text{ m/s}^2$ hoặc $10\\text{ m/s}^2$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định thời gian rơi",
              "instruction": "Từ độ cao h, tính $t = \\sqrt{2h/g}$."
            },
            {
              "step": 2,
              "title": "Tính vận tốc chạm đất",
              "instruction": "Áp dụng $v = gt = \\sqrt{2gh}$."
            }
          ],
          "formulas": [
            {
              "label": "Vận tốc rơi tự do",
              "formula": "v = gt",
              "displayLatex": "v = gt",
              "notes": "Vận tốc ban đầu v₀ = 0."
            },
            {
              "label": "Quãng đường rơi",
              "formula": "h = \\frac{1}{2}gt^2",
              "displayLatex": "h = \\frac{1}{2}gt^2",
              "notes": "Thời gian rơi t = √(2h/g)."
            },
            {
              "label": "Vận tốc chạm đất",
              "formula": "v = \\sqrt{2gh}",
              "displayLatex": "v = \\sqrt{2gh}",
              "notes": "Liên hệ giữa vận tốc và độ cao."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng vật nặng rơi nhanh hơn vật nhẹ trong chân không",
              "avoid": "Gia tốc rơi tự do g là như nhau đối với mọi vật."
            },
            {
              "trap": "Nhầm rơi tự do với ném thẳng đứng xuống",
              "avoid": "Rơi tự do luôn có vận tốc ban đầu v₀ = 0."
            }
          ],
          "aspiration": {
            "priorityTag": "🔥 Trọng tâm ANND (≥ 8.5đ)",
            "examFrequency": "Chiếm 2 – 3 câu trong đề thi KHTN",
            "targetSchool": "Học viện An ninh Nhân dân (ANND)",
            "targetScoreAdvice": "Sự rơi tự do là dạng bài thường xuất hiện trong câu hỏi thực tế (đo độ sâu giếng, thả vật từ tòa tháp). Nắm chắc công thức giây cuối cùng để giải trong 30s."
          },
          "podcast": {
            "title": "Audio tóm tắt nhanh 3 phút: Bản chất sự rơi tự do",
            "duration": "02:50",
            "audioScript": "Sự rơi tự do là chuyển động thẳng nhanh dần đều không vận tốc ban đầu dưới tác dụng duy nhất của trọng lực. Vận tốc v = gt = căn 2gh, quãng đường h = 1/2 gt bình. Hãy nhớ: trong chân không, một chiếc lông vũ và hòn đá rơi nhanh như nhau!"
          },
          "flashcards": [
            {
              "id": "fc-p3-1",
              "front": "Mọi vật rơi tự do có gia tốc phụ thuộc khối lượng không?",
              "back": "Không, gia tốc g không phụ thuộc khối lượng vật."
            },
            {
              "id": "fc-p3-2",
              "front": "Vận tốc khi chạm đất từ độ cao h?",
              "back": "v = √(2gh)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p3-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Vật rơi tự do từ độ cao 20 m xuống đất. Lấy $g = 10\\text{ m/s}^2$. Thời gian rơi là:",
              "options": [
                "2 s",
                "4 s",
                "1 s",
                "√2 s"
              ],
              "correct": 0,
              "solution": "t = √(2h/g) = √(2*20/10) = 2 s.",
              "trapAlert": "Quên căn bậc hai.",
              "fastTip": "2*20/10 = 4 -> căn ra 2s."
            },
            {
              "id": "q-p3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thả một hòn đá rơi tự do từ độ cao 45 m. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p3-a",
                  "statement": "a) Thời gian rơi là 3 giây.",
                  "isTrue": true,
                  "explain": "t = √(2*45/10) = 3 s. Đúng."
                },
                {
                  "id": "tf-p3-b",
                  "statement": "b) Vận tốc khi chạm đất là 30 m/s.",
                  "isTrue": true,
                  "explain": "v = 10*3 = 30 m/s. Đúng."
                },
                {
                  "id": "tf-p3-c",
                  "statement": "c) Quãng đường rơi trong giây thứ nhất là 10 m.",
                  "isTrue": false,
                  "explain": "h₁ = 0,5*10*1 = 5 m. Sai."
                },
                {
                  "id": "tf-p3-d",
                  "statement": "d) Quãng đường rơi trong giây cuối là 25 m.",
                  "isTrue": true,
                  "explain": "h(3) - h(2) = 45 - 20 = 25 m. Đúng."
                }
              ]
            },
            {
              "id": "q-p3-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Giọt nước mưa rơi tự do từ độ cao 125 m. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ giọt nước ngay trước khi chạm đất (đơn vị: m/s).",
              "correctAnswer": "50",
              "unit": "m/s",
              "solution": "v = √(2gh) = √(2*10*125) = √2500 = 50 m/s.",
              "trapAlert": "Quên nhân hệ số 2 trong căn."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p3-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Vật rơi tự do từ độ cao 20 m xuống đất. Lấy $g = 10\\text{ m/s}^2$. Thời gian rơi là:",
              "options": [
                "2 s",
                "4 s",
                "1 s",
                "√2 s"
              ],
              "correct": 0,
              "solution": "t = √(2h/g) = √(2*20/10) = 2 s.",
              "trapAlert": "Quên căn bậc hai.",
              "fastTip": "2*20/10 = 4 -> căn ra 2s."
            },
            {
              "id": "q-p3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thả một hòn đá rơi tự do từ độ cao 45 m. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p3-a",
                  "statement": "a) Thời gian rơi là 3 giây.",
                  "isTrue": true,
                  "explain": "t = √(2*45/10) = 3 s. Đúng."
                },
                {
                  "id": "tf-p3-b",
                  "statement": "b) Vận tốc khi chạm đất là 30 m/s.",
                  "isTrue": true,
                  "explain": "v = 10*3 = 30 m/s. Đúng."
                },
                {
                  "id": "tf-p3-c",
                  "statement": "c) Quãng đường rơi trong giây thứ nhất là 10 m.",
                  "isTrue": false,
                  "explain": "h₁ = 0,5*10*1 = 5 m. Sai."
                },
                {
                  "id": "tf-p3-d",
                  "statement": "d) Quãng đường rơi trong giây cuối là 25 m.",
                  "isTrue": true,
                  "explain": "h(3) - h(2) = 45 - 20 = 25 m. Đúng."
                }
              ]
            },
            {
              "id": "q-p3-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Giọt nước mưa rơi tự do từ độ cao 125 m. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ giọt nước ngay trước khi chạm đất (đơn vị: m/s).",
              "correctAnswer": "50",
              "unit": "m/s",
              "solution": "v = √(2gh) = √(2*10*125) = √2500 = 50 m/s.",
              "trapAlert": "Quên nhân hệ số 2 trong căn."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p3-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Vật rơi tự do từ độ cao 20 m xuống đất. Lấy $g = 10\\text{ m/s}^2$. Thời gian rơi là:",
              "options": [
                "2 s",
                "4 s",
                "1 s",
                "√2 s"
              ],
              "correct": 0,
              "solution": "t = √(2h/g) = √(2*20/10) = 2 s.",
              "trapAlert": "Quên căn bậc hai.",
              "fastTip": "2*20/10 = 4 -> căn ra 2s."
            },
            {
              "id": "q-p3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thả một hòn đá rơi tự do từ độ cao 45 m. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p3-a",
                  "statement": "a) Thời gian rơi là 3 giây.",
                  "isTrue": true,
                  "explain": "t = √(2*45/10) = 3 s. Đúng."
                },
                {
                  "id": "tf-p3-b",
                  "statement": "b) Vận tốc khi chạm đất là 30 m/s.",
                  "isTrue": true,
                  "explain": "v = 10*3 = 30 m/s. Đúng."
                },
                {
                  "id": "tf-p3-c",
                  "statement": "c) Quãng đường rơi trong giây thứ nhất là 10 m.",
                  "isTrue": false,
                  "explain": "h₁ = 0,5*10*1 = 5 m. Sai."
                },
                {
                  "id": "tf-p3-d",
                  "statement": "d) Quãng đường rơi trong giây cuối là 25 m.",
                  "isTrue": true,
                  "explain": "h(3) - h(2) = 45 - 20 = 25 m. Đúng."
                }
              ]
            },
            {
              "id": "q-p3-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Giọt nước mưa rơi tự do từ độ cao 125 m. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ giọt nước ngay trước khi chạm đất (đơn vị: m/s).",
              "correctAnswer": "50",
              "unit": "m/s",
              "solution": "v = √(2gh) = √(2*10*125) = √2500 = 50 m/s.",
              "trapAlert": "Quên nhân hệ số 2 trong căn."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-toc-do-va-van-toc",
          "title": "Tốc độ và Vận tốc",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Tốc độ trung bình (đại lượng vô hướng)",
              "desc": "Đặc trưng cho độ nhanh chậm của chuyển động: $v_{tb} = s / t$ (quãng đường chia thời gian). Luôn dương."
            },
            {
              "title": "Vận tốc trung bình (đại lượng vectơ)",
              "desc": "Đặc trưng cho cả độ nhanh chậm và phương chiều: $\\vec{v}_{tb} = \\frac{\\Delta\\vec{d}}{\\Delta t}$ (độ dịch chuyển chia thời gian). Có thể âm, dương hoặc bằng 0."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định quãng đường và độ dịch chuyển",
              "instruction": "Quãng đường s là chiều dài vết đường. Độ dịch chuyển d là vectơ nối vị trí đầu và cuối."
            },
            {
              "step": 2,
              "title": "Tính tốc độ và vận tốc",
              "instruction": "$v_{tb} = s/t$ và $v = d/t$."
            }
          ],
          "formulas": [
            {
              "label": "Tốc độ trung bình",
              "formula": "v_{tb} = \\frac{s}{t}",
              "displayLatex": "v_{tb} = \\frac{s}{t}",
              "notes": "s là tổng quãng đường, t là tổng thời gian."
            },
            {
              "label": "Vận tốc trung bình",
              "formula": "v = \\frac{d}{t}",
              "displayLatex": "v = \\frac{d}{t}",
              "notes": "d là độ dịch chuyển d = x₂ - x₁."
            },
            {
              "label": "Quy đổi km/h sang m/s",
              "formula": "1\\text{ m/s} = 3{,}6\\text{ km/h}",
              "displayLatex": "1\\text{ m/s} = 3{,}6\\text{ km/h}",
              "notes": "Từ km/h sang m/s thì chia 3,6."
            }
          ],
          "traps": [
            {
              "trap": "Lấy trung bình cộng các tốc độ thay vì dùng s/t",
              "avoid": "Chỉ được lấy trung bình cộng khi thời gian chuyển động ở các đoạn bằng nhau."
            },
            {
              "trap": "Nhầm vận tốc bằng 0 với đứng yên",
              "avoid": "Đi 1 vòng khép kín quay về điểm đầu thì độ dịch chuyển bằng 0 nên vận tốc trung bình bằng 0, nhưng vật vẫn chuyển động."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p4-1",
              "front": "Vận tốc khác tốc độ ở điểm nào?",
              "back": "Vận tốc là vectơ có hướng, tốc độ là vô hướng không âm."
            },
            {
              "id": "fc-p4-2",
              "front": "Khi nào vận tốc trung bình bằng 0 dù vật chuyển động?",
              "back": "Khi vật đi một quỹ đạo khép kín quay về đúng vị trí ban đầu (d = 0)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p4-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Bơi dọc bể bơi 50 m hết 20s rồi quay lại điểm xuất phát hết 25s. Tốc độ trung bình và vận tốc trung bình là:",
              "options": [
                "2,22 m/s và 0 m/s",
                "2,22 m/s và 2,22 m/s",
                "0 m/s và 2,22 m/s",
                "1,11 m/s và 0 m/s"
              ],
              "correct": 0,
              "solution": "s = 100m, t = 45s -> v_tb = 100/45 = 2,22 m/s. Quay về chỗ cũ -> d = 0 -> vận tốc = 0.",
              "trapAlert": "Nhầm độ dịch chuyển d với quãng đường s.",
              "fastTip": "Quay về điểm cũ -> vận tốc = 0 ngay lập tức!"
            },
            {
              "id": "q-p4-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ô tô đi từ A đến B cách nhau 120 km theo đường thẳng. Nửa quãng đường đầu đi 40 km/h, nửa sau đi 60 km/h. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p4-a",
                  "statement": "a) Thời gian đi nửa đầu là 1,5 h.",
                  "isTrue": true,
                  "explain": "60 / 40 = 1,5 h. Đúng."
                },
                {
                  "id": "tf-p4-b",
                  "statement": "b) Thời gian đi nửa sau là 1,0 h.",
                  "isTrue": true,
                  "explain": "60 / 60 = 1,0 h. Đúng."
                },
                {
                  "id": "tf-p4-c",
                  "statement": "c) Tốc độ trung bình cả chuyến đi là 50 km/h.",
                  "isTrue": false,
                  "explain": "v_tb = 120 / 2,5 = 48 km/h != 50 km/h. Sai."
                },
                {
                  "id": "tf-p4-d",
                  "statement": "d) Vì đường thẳng không đổi chiều nên độ lớn vận tốc trung bình bằng tốc độ trung bình.",
                  "isTrue": true,
                  "explain": "Không đổi chiều -> |d| = s -> độ lớn bằng nhau. Đúng."
                }
              ]
            },
            {
              "id": "q-p4-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "ĐGNL & TSA",
              "prompt": "Người đi xe đạp nửa thời gian đầu đi với 12 km/h, nửa thời gian sau đi với 18 km/h. Tính tốc độ trung bình trên cả chặng đường (đơn vị: km/h).",
              "correctAnswer": "15",
              "unit": "km/h",
              "solution": "Cùng thời gian: v_tb = (12 + 18)/2 = 15 km/h.",
              "trapAlert": "Nhầm giữa đi cùng thời gian (trung bình cộng) và đi cùng quãng đường (trung bình điều hòa)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p4-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Bơi dọc bể bơi 50 m hết 20s rồi quay lại điểm xuất phát hết 25s. Tốc độ trung bình và vận tốc trung bình là:",
              "options": [
                "2,22 m/s và 0 m/s",
                "2,22 m/s và 2,22 m/s",
                "0 m/s và 2,22 m/s",
                "1,11 m/s và 0 m/s"
              ],
              "correct": 0,
              "solution": "s = 100m, t = 45s -> v_tb = 100/45 = 2,22 m/s. Quay về chỗ cũ -> d = 0 -> vận tốc = 0.",
              "trapAlert": "Nhầm độ dịch chuyển d với quãng đường s.",
              "fastTip": "Quay về điểm cũ -> vận tốc = 0 ngay lập tức!"
            },
            {
              "id": "q-p4-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ô tô đi từ A đến B cách nhau 120 km theo đường thẳng. Nửa quãng đường đầu đi 40 km/h, nửa sau đi 60 km/h. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p4-a",
                  "statement": "a) Thời gian đi nửa đầu là 1,5 h.",
                  "isTrue": true,
                  "explain": "60 / 40 = 1,5 h. Đúng."
                },
                {
                  "id": "tf-p4-b",
                  "statement": "b) Thời gian đi nửa sau là 1,0 h.",
                  "isTrue": true,
                  "explain": "60 / 60 = 1,0 h. Đúng."
                },
                {
                  "id": "tf-p4-c",
                  "statement": "c) Tốc độ trung bình cả chuyến đi là 50 km/h.",
                  "isTrue": false,
                  "explain": "v_tb = 120 / 2,5 = 48 km/h != 50 km/h. Sai."
                },
                {
                  "id": "tf-p4-d",
                  "statement": "d) Vì đường thẳng không đổi chiều nên độ lớn vận tốc trung bình bằng tốc độ trung bình.",
                  "isTrue": true,
                  "explain": "Không đổi chiều -> |d| = s -> độ lớn bằng nhau. Đúng."
                }
              ]
            },
            {
              "id": "q-p4-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "ĐGNL & TSA",
              "prompt": "Người đi xe đạp nửa thời gian đầu đi với 12 km/h, nửa thời gian sau đi với 18 km/h. Tính tốc độ trung bình trên cả chặng đường (đơn vị: km/h).",
              "correctAnswer": "15",
              "unit": "km/h",
              "solution": "Cùng thời gian: v_tb = (12 + 18)/2 = 15 km/h.",
              "trapAlert": "Nhầm giữa đi cùng thời gian (trung bình cộng) và đi cùng quãng đường (trung bình điều hòa)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p4-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Bơi dọc bể bơi 50 m hết 20s rồi quay lại điểm xuất phát hết 25s. Tốc độ trung bình và vận tốc trung bình là:",
              "options": [
                "2,22 m/s và 0 m/s",
                "2,22 m/s và 2,22 m/s",
                "0 m/s và 2,22 m/s",
                "1,11 m/s và 0 m/s"
              ],
              "correct": 0,
              "solution": "s = 100m, t = 45s -> v_tb = 100/45 = 2,22 m/s. Quay về chỗ cũ -> d = 0 -> vận tốc = 0.",
              "trapAlert": "Nhầm độ dịch chuyển d với quãng đường s.",
              "fastTip": "Quay về điểm cũ -> vận tốc = 0 ngay lập tức!"
            },
            {
              "id": "q-p4-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ô tô đi từ A đến B cách nhau 120 km theo đường thẳng. Nửa quãng đường đầu đi 40 km/h, nửa sau đi 60 km/h. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p4-a",
                  "statement": "a) Thời gian đi nửa đầu là 1,5 h.",
                  "isTrue": true,
                  "explain": "60 / 40 = 1,5 h. Đúng."
                },
                {
                  "id": "tf-p4-b",
                  "statement": "b) Thời gian đi nửa sau là 1,0 h.",
                  "isTrue": true,
                  "explain": "60 / 60 = 1,0 h. Đúng."
                },
                {
                  "id": "tf-p4-c",
                  "statement": "c) Tốc độ trung bình cả chuyến đi là 50 km/h.",
                  "isTrue": false,
                  "explain": "v_tb = 120 / 2,5 = 48 km/h != 50 km/h. Sai."
                },
                {
                  "id": "tf-p4-d",
                  "statement": "d) Vì đường thẳng không đổi chiều nên độ lớn vận tốc trung bình bằng tốc độ trung bình.",
                  "isTrue": true,
                  "explain": "Không đổi chiều -> |d| = s -> độ lớn bằng nhau. Đúng."
                }
              ]
            },
            {
              "id": "q-p4-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "ĐGNL & TSA",
              "prompt": "Người đi xe đạp nửa thời gian đầu đi với 12 km/h, nửa thời gian sau đi với 18 km/h. Tính tốc độ trung bình trên cả chặng đường (đơn vị: km/h).",
              "correctAnswer": "15",
              "unit": "km/h",
              "solution": "Cùng thời gian: v_tb = (12 + 18)/2 = 15 km/h.",
              "trapAlert": "Nhầm giữa đi cùng thời gian (trung bình cộng) và đi cùng quãng đường (trung bình điều hòa)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-do-thi-do-dich-chuyen",
          "title": "Đồ thị độ dịch chuyển – thời gian (d - t)",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Độ dốc của đồ thị d - t",
              "desc": "Hệ số góc (độ dốc) của đường biểu diễn $d - t$ chính là vận tốc của vật: $v = \\frac{\\Delta d}{\\Delta t} = \\tan\\theta$."
            },
            {
              "title": "Dấu của vận tốc trên đồ thị",
              "desc": "Đường dốc lên: $v > 0$ (chuyển động cùng chiều dương). Đường nằm ngang: $v = 0$ (đứng yên). Đường dốc xuống: $v < 0$ (chuyển động ngược chiều dương)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định tọa độ hai điểm",
              "instruction": "Đọc $(t_1, d_1)$ và $(t_2, d_2)$ trên đoạn cần xét."
            },
            {
              "step": 2,
              "title": "Tính vận tốc",
              "instruction": "Tính $v = (d_2 - d_1) / (t_2 - t_1)$."
            }
          ],
          "formulas": [
            {
              "label": "Vận tốc từ độ dốc",
              "formula": "v = \\frac{d_2 - d_1}{t_2 - t_1} = \\tan\\theta",
              "displayLatex": "v = \\frac{\\Delta d}{\\Delta t} = \\tan\\theta",
              "notes": "Góc theta so với phương ngang trục thời gian Ot."
            },
            {
              "label": "Phương trình chuyển động thẳng đều",
              "formula": "d = v \\cdot t",
              "displayLatex": "d = v \\cdot t",
              "notes": "Đồ thị là đoạn thẳng thẳng tắp."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm đồ thị d - t với đồ thị v - t",
              "avoid": "Đoạn nằm ngang trên đồ thị d - t nghĩa là ĐỨNG YÊN, còn trên đồ thị v - t là CHUYỂN ĐỘNG THẲNG ĐỀU."
            },
            {
              "trap": "Quên dấu âm khi đồ thị dốc xuống",
              "avoid": "Đồ thị dốc xuống biểu diễn chuyển động theo chiều âm, vận tốc có giá trị âm."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p5-1",
              "front": "Hệ số góc của đồ thị d - t thể hiện đại lượng nào?",
              "back": "Thể hiện vận tốc của vật: v = Delta(d) / Delta(t)."
            },
            {
              "id": "fc-p5-2",
              "front": "Đồ thị d - t là đoạn thẳng nằm ngang nghĩa là gì?",
              "back": "Nghĩa là vật đang đứng yên (v = 0)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p5-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đoạn đồ thị độ dịch chuyển – thời gian (d - t) song song với trục thời gian cho biết vật đang:",
              "options": [
                "đứng yên",
                "chuyển động thẳng đều",
                "chuyển động nhanh dần đều",
                "chuyển động chậm dần đều"
              ],
              "correct": 0,
              "solution": "d không đổi theo thời gian -> vận tốc v = 0 -> vật đứng yên.",
              "trapAlert": "Nhầm với đồ thị vận tốc - thời gian.",
              "fastTip": "d nằm ngang -> đứng yên."
            },
            {
              "id": "q-p5-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một vật có đồ thị d - t: từ 0 đến 2s tăng đều từ 0 đến 10m; từ 2s đến 5s giữ nguyên 10m; từ 5s đến 7s giảm đều về 0. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p5-a",
                  "statement": "a) Trong 2s đầu vận tốc là 5 m/s.",
                  "isTrue": true,
                  "explain": "v = 10 / 2 = 5 m/s. Đúng."
                },
                {
                  "id": "tf-p5-b",
                  "statement": "b) Từ 2s đến 5s vật chuyển động đều với 10 m/s.",
                  "isTrue": false,
                  "explain": "Vật đứng yên (v = 0). Sai."
                },
                {
                  "id": "tf-p5-c",
                  "statement": "c) Từ 5s đến 7s vận tốc là -5 m/s.",
                  "isTrue": true,
                  "explain": "v = (0 - 10) / (7 - 5) = -5 m/s. Đúng."
                },
                {
                  "id": "tf-p5-d",
                  "statement": "d) Tổng quãng đường đi được trong cả 7s là 20 m.",
                  "isTrue": true,
                  "explain": "s = 10 + 0 + 10 = 20 m. Đúng."
                }
              ]
            },
            {
              "id": "q-p5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "THPTQG & TSA",
              "prompt": "Xe máy có đồ thị d - t đi từ vị trí d = 5m đến d = 45m trong thời gian 8 giây. Tính tốc độ của xe máy (đơn vị: m/s).",
              "correctAnswer": "5",
              "unit": "m/s",
              "solution": "Delta_d = 45 - 5 = 40 m. v = 40 / 8 = 5 m/s.",
              "trapAlert": "Lấy 45 chia 8 thay vì lấy độ dời 40m."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p5-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đoạn đồ thị độ dịch chuyển – thời gian (d - t) song song với trục thời gian cho biết vật đang:",
              "options": [
                "đứng yên",
                "chuyển động thẳng đều",
                "chuyển động nhanh dần đều",
                "chuyển động chậm dần đều"
              ],
              "correct": 0,
              "solution": "d không đổi theo thời gian -> vận tốc v = 0 -> vật đứng yên.",
              "trapAlert": "Nhầm với đồ thị vận tốc - thời gian.",
              "fastTip": "d nằm ngang -> đứng yên."
            },
            {
              "id": "q-p5-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một vật có đồ thị d - t: từ 0 đến 2s tăng đều từ 0 đến 10m; từ 2s đến 5s giữ nguyên 10m; từ 5s đến 7s giảm đều về 0. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p5-a",
                  "statement": "a) Trong 2s đầu vận tốc là 5 m/s.",
                  "isTrue": true,
                  "explain": "v = 10 / 2 = 5 m/s. Đúng."
                },
                {
                  "id": "tf-p5-b",
                  "statement": "b) Từ 2s đến 5s vật chuyển động đều với 10 m/s.",
                  "isTrue": false,
                  "explain": "Vật đứng yên (v = 0). Sai."
                },
                {
                  "id": "tf-p5-c",
                  "statement": "c) Từ 5s đến 7s vận tốc là -5 m/s.",
                  "isTrue": true,
                  "explain": "v = (0 - 10) / (7 - 5) = -5 m/s. Đúng."
                },
                {
                  "id": "tf-p5-d",
                  "statement": "d) Tổng quãng đường đi được trong cả 7s là 20 m.",
                  "isTrue": true,
                  "explain": "s = 10 + 0 + 10 = 20 m. Đúng."
                }
              ]
            },
            {
              "id": "q-p5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "THPTQG & TSA",
              "prompt": "Xe máy có đồ thị d - t đi từ vị trí d = 5m đến d = 45m trong thời gian 8 giây. Tính tốc độ của xe máy (đơn vị: m/s).",
              "correctAnswer": "5",
              "unit": "m/s",
              "solution": "Delta_d = 45 - 5 = 40 m. v = 40 / 8 = 5 m/s.",
              "trapAlert": "Lấy 45 chia 8 thay vì lấy độ dời 40m."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p5-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đoạn đồ thị độ dịch chuyển – thời gian (d - t) song song với trục thời gian cho biết vật đang:",
              "options": [
                "đứng yên",
                "chuyển động thẳng đều",
                "chuyển động nhanh dần đều",
                "chuyển động chậm dần đều"
              ],
              "correct": 0,
              "solution": "d không đổi theo thời gian -> vận tốc v = 0 -> vật đứng yên.",
              "trapAlert": "Nhầm với đồ thị vận tốc - thời gian.",
              "fastTip": "d nằm ngang -> đứng yên."
            },
            {
              "id": "q-p5-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một vật có đồ thị d - t: từ 0 đến 2s tăng đều từ 0 đến 10m; từ 2s đến 5s giữ nguyên 10m; từ 5s đến 7s giảm đều về 0. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p5-a",
                  "statement": "a) Trong 2s đầu vận tốc là 5 m/s.",
                  "isTrue": true,
                  "explain": "v = 10 / 2 = 5 m/s. Đúng."
                },
                {
                  "id": "tf-p5-b",
                  "statement": "b) Từ 2s đến 5s vật chuyển động đều với 10 m/s.",
                  "isTrue": false,
                  "explain": "Vật đứng yên (v = 0). Sai."
                },
                {
                  "id": "tf-p5-c",
                  "statement": "c) Từ 5s đến 7s vận tốc là -5 m/s.",
                  "isTrue": true,
                  "explain": "v = (0 - 10) / (7 - 5) = -5 m/s. Đúng."
                },
                {
                  "id": "tf-p5-d",
                  "statement": "d) Tổng quãng đường đi được trong cả 7s là 20 m.",
                  "isTrue": true,
                  "explain": "s = 10 + 0 + 10 = 20 m. Đúng."
                }
              ]
            },
            {
              "id": "q-p5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "THPTQG & TSA",
              "prompt": "Xe máy có đồ thị d - t đi từ vị trí d = 5m đến d = 45m trong thời gian 8 giây. Tính tốc độ của xe máy (đơn vị: m/s).",
              "correctAnswer": "5",
              "unit": "m/s",
              "solution": "Delta_d = 45 - 5 = 40 m. v = 40 / 8 = 5 m/s.",
              "trapAlert": "Lấy 45 chia 8 thay vì lấy độ dời 40m."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-do-dich-chuyen-quang-duong",
          "title": "Độ dịch chuyển và Quãng đường đi được",
          "questionsCount": 13,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Quãng đường s",
              "desc": "Độ dài toàn bộ quỹ đạo mà vật đã vạch ra trong suốt quá trình chuyển động. Là đại lượng vô hướng không âm ($s \\ge 0$)."
            },
            {
              "title": "Độ dịch chuyển d",
              "desc": "Đại lượng vectơ biểu diễn sự thay đổi vị trí của vật: $\\vec{d} = \\vec{r}_2 - \\vec{r}_1$. Độ lớn $d \\le s$, dấu bằng chỉ xảy ra khi chuyển động thẳng không đổi chiều."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Vẽ sơ đồ dịch chuyển",
              "instruction": "Vẽ các vectơ chuyển dời nối tiếp nhau."
            },
            {
              "step": 2,
              "title": "Tính d và s",
              "instruction": "s là tổng độ dài các đoạn. d là khoảng cách từ điểm xuất phát đến điểm kết thúc."
            }
          ],
          "formulas": [
            {
              "label": "Hệ thức so sánh",
              "formula": "d \\le s",
              "displayLatex": "d \\le s",
              "notes": "Độ lớn độ dịch chuyển luôn nhỏ hơn hoặc bằng quãng đường."
            },
            {
              "label": "Tổng hợp hai độ dịch chuyển vuông góc",
              "formula": "d = \\sqrt{d_1^2 + d_2^2}",
              "displayLatex": "d = \\sqrt{d_1^2 + d_2^2}",
              "notes": "Khi vật đi hướng Bắc rồi rẽ hướng Đông."
            }
          ],
          "traps": [
            {
              "trap": "Đồng nhất quãng đường với độ dịch chuyển",
              "avoid": "Chỉ bằng nhau khi chuyển động thẳng và KHÔNG đổi chiều."
            },
            {
              "trap": "Quên cộng theo quy tắc hình bình hành",
              "avoid": "Độ dịch chuyển là vectơ nên phải cộng theo hình học."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p6-1",
              "front": "Khi nào độ lớn độ dịch chuyển bằng quãng đường?",
              "back": "Khi vật chuyển động thẳng và không đổi chiều."
            },
            {
              "id": "fc-p6-2",
              "front": "Đi 3m về phía Bắc rồi 4m về phía Đông, độ dịch chuyển là bao nhiêu?",
              "back": "d = √(3² + 4²) = 5 m."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p6-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một người đi bộ từ A đến B cách nhau 4 km theo đường thẳng rồi quay lại A. Quãng đường và độ dịch chuyển là:",
              "options": [
                "s = 8 km, d = 0 km",
                "s = 8 km, d = 8 km",
                "s = 0 km, d = 0 km",
                "s = 4 km, d = 0 km"
              ],
              "correct": 0,
              "solution": "s = 4 + 4 = 8 km. Quay lại điểm đầu A -> d = 0.",
              "trapAlert": "Nhầm quãng đường bằng 0.",
              "fastTip": "Quay lại A -> d = 0, đi 2 lần 4km -> s = 8km."
            },
            {
              "id": "q-p6-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một học sinh đi xe đạp 3 km về phía Bắc, sau đó rẽ phải đi tiếp 4 km về phía Đông. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p6-a",
                  "statement": "a) Quãng đường học sinh đã đi là 7 km.",
                  "isTrue": true,
                  "explain": "s = 3 + 4 = 7 km. Đúng."
                },
                {
                  "id": "tf-p6-b",
                  "statement": "b) Độ lớn độ dịch chuyển là 5 km.",
                  "isTrue": true,
                  "explain": "d = √(3² + 4²) = 5 km. Đúng."
                },
                {
                  "id": "tf-p6-c",
                  "statement": "c) Hướng của độ dịch chuyển là hướng Đông Bắc.",
                  "isTrue": true,
                  "explain": "Đi Bắc rồi Đông nên hướng tổng hợp là Đông Bắc. Đúng."
                },
                {
                  "id": "tf-p6-d",
                  "statement": "d) Quãng đường đi luôn bằng độ lớn độ dịch chuyển.",
                  "isTrue": false,
                  "explain": "7 km > 5 km. Sai."
                }
              ]
            },
            {
              "id": "q-p6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "ĐGNL HSA",
              "prompt": "Một người chạy quanh một đường đua hình tròn bán kính R = 50 m. Khi chạy được đúng 1,5 vòng thì độ dịch chuyển của người đó có độ lớn là bao nhiêu mét?",
              "correctAnswer": "100",
              "unit": "m",
              "solution": "1,5 vòng đưa người đó đến điểm đối diện đường kính với điểm xuất phát. d = 2R = 2 * 50 = 100 m.",
              "trapAlert": "Tính độ dài cung tròn thay vì khoảng cách điểm đầu - cuối."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p6-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một người đi bộ từ A đến B cách nhau 4 km theo đường thẳng rồi quay lại A. Quãng đường và độ dịch chuyển là:",
              "options": [
                "s = 8 km, d = 0 km",
                "s = 8 km, d = 8 km",
                "s = 0 km, d = 0 km",
                "s = 4 km, d = 0 km"
              ],
              "correct": 0,
              "solution": "s = 4 + 4 = 8 km. Quay lại điểm đầu A -> d = 0.",
              "trapAlert": "Nhầm quãng đường bằng 0.",
              "fastTip": "Quay lại A -> d = 0, đi 2 lần 4km -> s = 8km."
            },
            {
              "id": "q-p6-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một học sinh đi xe đạp 3 km về phía Bắc, sau đó rẽ phải đi tiếp 4 km về phía Đông. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p6-a",
                  "statement": "a) Quãng đường học sinh đã đi là 7 km.",
                  "isTrue": true,
                  "explain": "s = 3 + 4 = 7 km. Đúng."
                },
                {
                  "id": "tf-p6-b",
                  "statement": "b) Độ lớn độ dịch chuyển là 5 km.",
                  "isTrue": true,
                  "explain": "d = √(3² + 4²) = 5 km. Đúng."
                },
                {
                  "id": "tf-p6-c",
                  "statement": "c) Hướng của độ dịch chuyển là hướng Đông Bắc.",
                  "isTrue": true,
                  "explain": "Đi Bắc rồi Đông nên hướng tổng hợp là Đông Bắc. Đúng."
                },
                {
                  "id": "tf-p6-d",
                  "statement": "d) Quãng đường đi luôn bằng độ lớn độ dịch chuyển.",
                  "isTrue": false,
                  "explain": "7 km > 5 km. Sai."
                }
              ]
            },
            {
              "id": "q-p6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "ĐGNL HSA",
              "prompt": "Một người chạy quanh một đường đua hình tròn bán kính R = 50 m. Khi chạy được đúng 1,5 vòng thì độ dịch chuyển của người đó có độ lớn là bao nhiêu mét?",
              "correctAnswer": "100",
              "unit": "m",
              "solution": "1,5 vòng đưa người đó đến điểm đối diện đường kính với điểm xuất phát. d = 2R = 2 * 50 = 100 m.",
              "trapAlert": "Tính độ dài cung tròn thay vì khoảng cách điểm đầu - cuối."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p6-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một người đi bộ từ A đến B cách nhau 4 km theo đường thẳng rồi quay lại A. Quãng đường và độ dịch chuyển là:",
              "options": [
                "s = 8 km, d = 0 km",
                "s = 8 km, d = 8 km",
                "s = 0 km, d = 0 km",
                "s = 4 km, d = 0 km"
              ],
              "correct": 0,
              "solution": "s = 4 + 4 = 8 km. Quay lại điểm đầu A -> d = 0.",
              "trapAlert": "Nhầm quãng đường bằng 0.",
              "fastTip": "Quay lại A -> d = 0, đi 2 lần 4km -> s = 8km."
            },
            {
              "id": "q-p6-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một học sinh đi xe đạp 3 km về phía Bắc, sau đó rẽ phải đi tiếp 4 km về phía Đông. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p6-a",
                  "statement": "a) Quãng đường học sinh đã đi là 7 km.",
                  "isTrue": true,
                  "explain": "s = 3 + 4 = 7 km. Đúng."
                },
                {
                  "id": "tf-p6-b",
                  "statement": "b) Độ lớn độ dịch chuyển là 5 km.",
                  "isTrue": true,
                  "explain": "d = √(3² + 4²) = 5 km. Đúng."
                },
                {
                  "id": "tf-p6-c",
                  "statement": "c) Hướng của độ dịch chuyển là hướng Đông Bắc.",
                  "isTrue": true,
                  "explain": "Đi Bắc rồi Đông nên hướng tổng hợp là Đông Bắc. Đúng."
                },
                {
                  "id": "tf-p6-d",
                  "statement": "d) Quãng đường đi luôn bằng độ lớn độ dịch chuyển.",
                  "isTrue": false,
                  "explain": "7 km > 5 km. Sai."
                }
              ]
            },
            {
              "id": "q-p6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "ĐGNL HSA",
              "prompt": "Một người chạy quanh một đường đua hình tròn bán kính R = 50 m. Khi chạy được đúng 1,5 vòng thì độ dịch chuyển của người đó có độ lớn là bao nhiêu mét?",
              "correctAnswer": "100",
              "unit": "m",
              "solution": "1,5 vòng đưa người đó đến điểm đối diện đường kính với điểm xuất phát. d = 2R = 2 * 50 = 100 m.",
              "trapAlert": "Tính độ dài cung tròn thay vì khoảng cách điểm đầu - cuối."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        }
      ]
    },
    {
      "chapterId": "ly-c2-dongluchoc",
      "chapterNum": "02",
      "chapterName": "Động lực học",
      "lessons": [
        {
          "id": "ly-dinh-luat-newton",
          "title": "Các định luật Newton về chuyển động",
          "questionsCount": 35,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Định luật I Newton (Quán tính)",
              "desc": "Nếu một vật không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực cân bằng thì vật đang đứng yên sẽ tiếp tục đứng yên, đang chuyển động sẽ tiếp tục chuyển động thẳng đều."
            },
            {
              "title": "Định luật II Newton",
              "desc": "Gia tốc tỉ lệ thuận với hợp lực và tỉ lệ nghịch với khối lượng: $\\vec{a} = \\frac{\\vec{F}_{hl}}{m} \\iff \\vec{F}_{hl} = m\\vec{a}$."
            },
            {
              "title": "Định luật III Newton (Tương tác)",
              "desc": "Lực và phản lực luôn xuất hiện đồng thời, cùng giá, ngược chiều, cùng độ lớn và đặt vào hai vật khác nhau (không cân bằng nhau): $\\vec{F}_{AB} = -\\vec{F}_{BA}$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Phân tích các lực tác dụng",
              "instruction": "Vẽ hình, xác định trọng lực P, phản lực N, lực kéo F, lực cản/ma sát Fms."
            },
            {
              "step": 2,
              "title": "Chiếu lên trục tọa độ",
              "instruction": "Ox theo phương chuyển động: $F_{hl,x} = ma$. Oy vuông góc: $N = P$."
            }
          ],
          "formulas": [
            {
              "label": "Định luật II Newton",
              "formula": "\\vec{F}_{hl} = m\\vec{a}",
              "displayLatex": "\\vec{F}_{hl} = m\\vec{a}",
              "notes": "F đơn vị Newton (N), m đơn vị kg, a đơn vị m/s²."
            },
            {
              "label": "Định luật III Newton",
              "formula": "\\vec{F}_{12} = -\\vec{F}_{21}",
              "displayLatex": "\\vec{F}_{12} = -\\vec{F}_{21}",
              "notes": "Lực và phản lực không bao giờ triệt tiêu lẫn nhau vì đặt vào 2 vật khác nhau."
            },
            {
              "label": "Trọng lực",
              "formula": "P = mg",
              "displayLatex": "P = mg",
              "notes": "Lực hút Trái Đất tác dụng lên vật."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng lực và phản lực là hai lực cân bằng",
              "avoid": "Lực và phản lực đặt vào hai vật khác nhau nên không bao giờ là hai lực cân bằng."
            },
            {
              "trap": "Nghĩ rằng vật muốn chuyển động bắt buộc phải có lực tác dụng",
              "avoid": "Theo định luật I, lực không phải nguyên nhân duy trì chuyển động mà là nguyên nhân làm biến đổi chuyển động."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p7-1",
              "front": "Hợp lực tác dụng lên vật bằng 0 thì vật sẽ thế nào?",
              "back": "Tiếp tục đứng yên hoặc chuyển động thẳng đều mãi mãi."
            },
            {
              "id": "fc-p7-2",
              "front": "Lực và phản lực có triệt tiêu nhau không?",
              "back": "Không, vì chúng đặt vào hai vật thể khác nhau."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p7-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tác dụng một lực không đổi 20 N vào vật có khối lượng 4 kg đang đứng yên. Gia tốc vật thu được là:",
              "options": [
                "5 m/s²",
                "80 m/s²",
                "0,2 m/s²",
                "16 m/s²"
              ],
              "correct": 0,
              "solution": "a = F / m = 20 / 4 = 5 m/s².",
              "trapAlert": "Nhầm phép nhân thay vì chia.",
              "fastTip": "20 / 4 = 5."
            },
            {
              "id": "q-p7-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một ôtô đang chạy thẳng đều với tốc độ 60 km/h trên đường nằm ngang. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p7-a",
                  "statement": "a) Hợp lực tác dụng lên ôtô bằng 0.",
                  "isTrue": true,
                  "explain": "Chuyển động thẳng đều nên a = 0 -> F_hl = 0. Đúng."
                },
                {
                  "id": "tf-p7-b",
                  "statement": "b) Lực kéo của động cơ có độ lớn bằng lực cản tác dụng lên xe.",
                  "isTrue": true,
                  "explain": "Hai lực cùng phương ngược chiều cân bằng nhau. Đúng."
                },
                {
                  "id": "tf-p7-c",
                  "statement": "c) Khi hãm phanh, hành khách trong xe sẽ bị ngả người về phía sau.",
                  "isTrue": false,
                  "explain": "Do quán tính, hành khách bị chúi người về phía trước. Sai."
                },
                {
                  "id": "tf-p7-d",
                  "statement": "d) Trọng lực tác dụng lên xe và phản lực của mặt đường là cặp lực trực đối định luật III.",
                  "isTrue": false,
                  "explain": "Cùng đặt lên xe nên là 2 lực cân bằng, không phải cặp lực định luật III. Sai."
                }
              ]
            },
            {
              "id": "q-p7-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một lực F truyền cho vật m₁ gia tốc $6\\text{ m/s}^2$, truyền cho vật m₂ gia tốc $3\\text{ m/s}^2$. Nếu lực F tác dụng vào vật có khối lượng $(m_1 + m_2)$ thì gia tốc thu được là bao nhiêu m/s²?",
              "correctAnswer": "2",
              "unit": "m/s²",
              "solution": "a = F / (m₁ + m₂) = 1 / (1/a₁ + 1/a₂) = 1 / (1/6 + 1/3) = 1 / (3/6) = 2 m/s².",
              "trapAlert": "Lấy trung bình cộng gia tốc thay vì nghịch đảo."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p7-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tác dụng một lực không đổi 20 N vào vật có khối lượng 4 kg đang đứng yên. Gia tốc vật thu được là:",
              "options": [
                "5 m/s²",
                "80 m/s²",
                "0,2 m/s²",
                "16 m/s²"
              ],
              "correct": 0,
              "solution": "a = F / m = 20 / 4 = 5 m/s².",
              "trapAlert": "Nhầm phép nhân thay vì chia.",
              "fastTip": "20 / 4 = 5."
            },
            {
              "id": "q-p7-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một ôtô đang chạy thẳng đều với tốc độ 60 km/h trên đường nằm ngang. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p7-a",
                  "statement": "a) Hợp lực tác dụng lên ôtô bằng 0.",
                  "isTrue": true,
                  "explain": "Chuyển động thẳng đều nên a = 0 -> F_hl = 0. Đúng."
                },
                {
                  "id": "tf-p7-b",
                  "statement": "b) Lực kéo của động cơ có độ lớn bằng lực cản tác dụng lên xe.",
                  "isTrue": true,
                  "explain": "Hai lực cùng phương ngược chiều cân bằng nhau. Đúng."
                },
                {
                  "id": "tf-p7-c",
                  "statement": "c) Khi hãm phanh, hành khách trong xe sẽ bị ngả người về phía sau.",
                  "isTrue": false,
                  "explain": "Do quán tính, hành khách bị chúi người về phía trước. Sai."
                },
                {
                  "id": "tf-p7-d",
                  "statement": "d) Trọng lực tác dụng lên xe và phản lực của mặt đường là cặp lực trực đối định luật III.",
                  "isTrue": false,
                  "explain": "Cùng đặt lên xe nên là 2 lực cân bằng, không phải cặp lực định luật III. Sai."
                }
              ]
            },
            {
              "id": "q-p7-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một lực F truyền cho vật m₁ gia tốc $6\\text{ m/s}^2$, truyền cho vật m₂ gia tốc $3\\text{ m/s}^2$. Nếu lực F tác dụng vào vật có khối lượng $(m_1 + m_2)$ thì gia tốc thu được là bao nhiêu m/s²?",
              "correctAnswer": "2",
              "unit": "m/s²",
              "solution": "a = F / (m₁ + m₂) = 1 / (1/a₁ + 1/a₂) = 1 / (1/6 + 1/3) = 1 / (3/6) = 2 m/s².",
              "trapAlert": "Lấy trung bình cộng gia tốc thay vì nghịch đảo."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p7-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tác dụng một lực không đổi 20 N vào vật có khối lượng 4 kg đang đứng yên. Gia tốc vật thu được là:",
              "options": [
                "5 m/s²",
                "80 m/s²",
                "0,2 m/s²",
                "16 m/s²"
              ],
              "correct": 0,
              "solution": "a = F / m = 20 / 4 = 5 m/s².",
              "trapAlert": "Nhầm phép nhân thay vì chia.",
              "fastTip": "20 / 4 = 5."
            },
            {
              "id": "q-p7-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một ôtô đang chạy thẳng đều với tốc độ 60 km/h trên đường nằm ngang. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p7-a",
                  "statement": "a) Hợp lực tác dụng lên ôtô bằng 0.",
                  "isTrue": true,
                  "explain": "Chuyển động thẳng đều nên a = 0 -> F_hl = 0. Đúng."
                },
                {
                  "id": "tf-p7-b",
                  "statement": "b) Lực kéo của động cơ có độ lớn bằng lực cản tác dụng lên xe.",
                  "isTrue": true,
                  "explain": "Hai lực cùng phương ngược chiều cân bằng nhau. Đúng."
                },
                {
                  "id": "tf-p7-c",
                  "statement": "c) Khi hãm phanh, hành khách trong xe sẽ bị ngả người về phía sau.",
                  "isTrue": false,
                  "explain": "Do quán tính, hành khách bị chúi người về phía trước. Sai."
                },
                {
                  "id": "tf-p7-d",
                  "statement": "d) Trọng lực tác dụng lên xe và phản lực của mặt đường là cặp lực trực đối định luật III.",
                  "isTrue": false,
                  "explain": "Cùng đặt lên xe nên là 2 lực cân bằng, không phải cặp lực định luật III. Sai."
                }
              ]
            },
            {
              "id": "q-p7-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một lực F truyền cho vật m₁ gia tốc $6\\text{ m/s}^2$, truyền cho vật m₂ gia tốc $3\\text{ m/s}^2$. Nếu lực F tác dụng vào vật có khối lượng $(m_1 + m_2)$ thì gia tốc thu được là bao nhiêu m/s²?",
              "correctAnswer": "2",
              "unit": "m/s²",
              "solution": "a = F / (m₁ + m₂) = 1 / (1/a₁ + 1/a₂) = 1 / (1/6 + 1/3) = 1 / (3/6) = 2 m/s².",
              "trapAlert": "Lấy trung bình cộng gia tốc thay vì nghịch đảo."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-luc-ma-sat",
          "title": "Lực ma sát, Lực cản và Lực nâng",
          "questionsCount": 25,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Lực ma sát trượt",
              "desc": "Xuất hiện ở mặt tiếp xúc khi vật trượt trên một bề mặt, cản trở chuyển động trượt: $F_{mst} = \\mu_t \\cdot N$. Hệ số ma sát $\\mu_t$ phụ thuộc vật liệu và tình trạng bề mặt tiếp xúc, không phụ thuộc diện tích tiếp xúc."
            },
            {
              "title": "Lực ma sát nghỉ",
              "desc": "Giữ cho vật không bị trượt khi có ngoại lực kéo. Lực ma sát nghỉ cực đại $F_{msn,max} \\approx \\mu_n N$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tìm áp lực N",
              "instruction": "Trên mặt ngang: $N = mg$. Trên mặt nghiêng góc $\\alpha$: $N = mg \\cos\\alpha$."
            },
            {
              "step": 2,
              "title": "Tính lực ma sát trượt",
              "instruction": "$F_{mst} = \\mu_t N$. Hợp lực kéo theo phương chuyển động: $F_{hl} = F_k - F_{mst} = ma$."
            }
          ],
          "formulas": [
            {
              "label": "Độ lớn lực ma sát trượt",
              "formula": "F_{mst} = \\mu_t N",
              "displayLatex": "F_{mst} = \\mu_t N",
              "notes": "N là áp lực vuông góc với mặt tiếp xúc."
            },
            {
              "label": "Áp lực trên mặt phẳng nghiêng",
              "formula": "N = mg \\cos\\alpha",
              "displayLatex": "N = mg \\cos\\alpha",
              "notes": "alpha là góc nghiêng so với mặt phẳng ngang."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng diện tích tiếp xúc lớn hơn thì ma sát trượt lớn hơn",
              "avoid": "Ma sát trượt không phụ thuộc diện tích tiếp xúc."
            },
            {
              "trap": "Cho rằng ma sát luôn có hại",
              "avoid": "Ma sát nghỉ đóng vai trò lực phát động giúp người và xe di chuyển được."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p8-1",
              "front": "Hệ số ma sát trượt có đơn vị là gì?",
              "back": "Là đại lượng không có thứ nguyên (không có đơn vị)."
            },
            {
              "id": "fc-p8-2",
              "front": "Lực ma sát trượt phụ thuộc yếu tố nào?",
              "back": "Phụ thuộc vật liệu, tình trạng bề mặt và áp lực N. Không phụ thuộc diện tích tiếp xúc."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p8-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Kéo một thùng hàng 20 kg trượt đều trên sàn nhà nằm ngang với lực 40 N theo phương ngang. Lấy $g = 10\\text{ m/s}^2$. Hệ số ma sát trượt giữa thùng và sàn là:",
              "options": [
                "0,2",
                "0,4",
                "0,1",
                "0,5"
              ],
              "correct": 0,
              "solution": "Trượt đều -> a = 0 -> F_k = F_mst = 40 N. N = mg = 200 N. mu = F_mst / N = 40 / 200 = 0,2.",
              "trapAlert": "Quên chia cho trọng lượng mg.",
              "fastTip": "40 / 200 = 0,2."
            },
            {
              "id": "q-p8-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Vật 2 kg được kéo trên sàn nằm ngang bởi lực $F = 10\\text{ N}$ theo phương ngang. Hệ số ma sát trượt $\\mu = 0{,}2$. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p8-a",
                  "statement": "a) Độ lớn lực ma sát trượt tác dụng lên vật là 4 N.",
                  "isTrue": true,
                  "explain": "F_mst = 0,2 * 2 * 10 = 4 N. Đúng."
                },
                {
                  "id": "tf-p8-b",
                  "statement": "b) Hợp lực tác dụng lên vật có độ lớn bằng 6 N.",
                  "isTrue": true,
                  "explain": "F_hl = 10 - 4 = 6 N. Đúng."
                },
                {
                  "id": "tf-p8-c",
                  "statement": "c) Gia tốc của vật là 3 m/s².",
                  "isTrue": true,
                  "explain": "a = 6 / 2 = 3 m/s². Đúng."
                },
                {
                  "id": "tf-p8-d",
                  "statement": "d) Nếu tăng lực kéo lên gấp đôi thì hệ số ma sát trượt tăng gấp đôi.",
                  "isTrue": false,
                  "explain": "Hệ số ma sát chỉ phụ thuộc bản chất bề mặt tiếp xúc. Sai."
                }
              ]
            },
            {
              "id": "q-p8-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một ôtô đang chạy 72 km/h thì tắt máy hãm phanh. Bánh xe trượt trên đường có hệ số ma sát $\\mu = 0{,}5$. Lấy $g = 10\\text{ m/s}^2$. Quãng đường trượt của xe đến khi dừng lại là bao nhiêu mét?",
              "correctAnswer": "40",
              "unit": "m",
              "solution": "v₀ = 20 m/s. Gia tốc hãm do ma sát: a = -mu * g = -0,5 * 10 = -5 m/s². s = v₀² / (2|a|) = 400 / 10 = 40 m.",
              "trapAlert": "Quên đổi 72 km/h ra 20 m/s."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p8-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Kéo một thùng hàng 20 kg trượt đều trên sàn nhà nằm ngang với lực 40 N theo phương ngang. Lấy $g = 10\\text{ m/s}^2$. Hệ số ma sát trượt giữa thùng và sàn là:",
              "options": [
                "0,2",
                "0,4",
                "0,1",
                "0,5"
              ],
              "correct": 0,
              "solution": "Trượt đều -> a = 0 -> F_k = F_mst = 40 N. N = mg = 200 N. mu = F_mst / N = 40 / 200 = 0,2.",
              "trapAlert": "Quên chia cho trọng lượng mg.",
              "fastTip": "40 / 200 = 0,2."
            },
            {
              "id": "q-p8-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Vật 2 kg được kéo trên sàn nằm ngang bởi lực $F = 10\\text{ N}$ theo phương ngang. Hệ số ma sát trượt $\\mu = 0{,}2$. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p8-a",
                  "statement": "a) Độ lớn lực ma sát trượt tác dụng lên vật là 4 N.",
                  "isTrue": true,
                  "explain": "F_mst = 0,2 * 2 * 10 = 4 N. Đúng."
                },
                {
                  "id": "tf-p8-b",
                  "statement": "b) Hợp lực tác dụng lên vật có độ lớn bằng 6 N.",
                  "isTrue": true,
                  "explain": "F_hl = 10 - 4 = 6 N. Đúng."
                },
                {
                  "id": "tf-p8-c",
                  "statement": "c) Gia tốc của vật là 3 m/s².",
                  "isTrue": true,
                  "explain": "a = 6 / 2 = 3 m/s². Đúng."
                },
                {
                  "id": "tf-p8-d",
                  "statement": "d) Nếu tăng lực kéo lên gấp đôi thì hệ số ma sát trượt tăng gấp đôi.",
                  "isTrue": false,
                  "explain": "Hệ số ma sát chỉ phụ thuộc bản chất bề mặt tiếp xúc. Sai."
                }
              ]
            },
            {
              "id": "q-p8-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một ôtô đang chạy 72 km/h thì tắt máy hãm phanh. Bánh xe trượt trên đường có hệ số ma sát $\\mu = 0{,}5$. Lấy $g = 10\\text{ m/s}^2$. Quãng đường trượt của xe đến khi dừng lại là bao nhiêu mét?",
              "correctAnswer": "40",
              "unit": "m",
              "solution": "v₀ = 20 m/s. Gia tốc hãm do ma sát: a = -mu * g = -0,5 * 10 = -5 m/s². s = v₀² / (2|a|) = 400 / 10 = 40 m.",
              "trapAlert": "Quên đổi 72 km/h ra 20 m/s."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p8-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Kéo một thùng hàng 20 kg trượt đều trên sàn nhà nằm ngang với lực 40 N theo phương ngang. Lấy $g = 10\\text{ m/s}^2$. Hệ số ma sát trượt giữa thùng và sàn là:",
              "options": [
                "0,2",
                "0,4",
                "0,1",
                "0,5"
              ],
              "correct": 0,
              "solution": "Trượt đều -> a = 0 -> F_k = F_mst = 40 N. N = mg = 200 N. mu = F_mst / N = 40 / 200 = 0,2.",
              "trapAlert": "Quên chia cho trọng lượng mg.",
              "fastTip": "40 / 200 = 0,2."
            },
            {
              "id": "q-p8-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Vật 2 kg được kéo trên sàn nằm ngang bởi lực $F = 10\\text{ N}$ theo phương ngang. Hệ số ma sát trượt $\\mu = 0{,}2$. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p8-a",
                  "statement": "a) Độ lớn lực ma sát trượt tác dụng lên vật là 4 N.",
                  "isTrue": true,
                  "explain": "F_mst = 0,2 * 2 * 10 = 4 N. Đúng."
                },
                {
                  "id": "tf-p8-b",
                  "statement": "b) Hợp lực tác dụng lên vật có độ lớn bằng 6 N.",
                  "isTrue": true,
                  "explain": "F_hl = 10 - 4 = 6 N. Đúng."
                },
                {
                  "id": "tf-p8-c",
                  "statement": "c) Gia tốc của vật là 3 m/s².",
                  "isTrue": true,
                  "explain": "a = 6 / 2 = 3 m/s². Đúng."
                },
                {
                  "id": "tf-p8-d",
                  "statement": "d) Nếu tăng lực kéo lên gấp đôi thì hệ số ma sát trượt tăng gấp đôi.",
                  "isTrue": false,
                  "explain": "Hệ số ma sát chỉ phụ thuộc bản chất bề mặt tiếp xúc. Sai."
                }
              ]
            },
            {
              "id": "q-p8-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một ôtô đang chạy 72 km/h thì tắt máy hãm phanh. Bánh xe trượt trên đường có hệ số ma sát $\\mu = 0{,}5$. Lấy $g = 10\\text{ m/s}^2$. Quãng đường trượt của xe đến khi dừng lại là bao nhiêu mét?",
              "correctAnswer": "40",
              "unit": "m",
              "solution": "v₀ = 20 m/s. Gia tốc hãm do ma sát: a = -mu * g = -0,5 * 10 = -5 m/s². s = v₀² / (2|a|) = 400 / 10 = 40 m.",
              "trapAlert": "Quên đổi 72 km/h ra 20 m/s."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-luc-dan-hoi",
          "title": "Lực đàn hồi và Định luật Hooke",
          "questionsCount": 20,
          "durationMinutes": 25,
          "concepts": [
            {
              "title": "Định luật Hooke",
              "desc": "Trong giới hạn đàn hồi, lực đàn hồi của lò xo tỉ lệ thuận với độ biến dạng của lò xo: $F_{dh} = k |\\Delta l|$."
            },
            {
              "title": "Độ cứng k",
              "desc": "Đặc trưng cho khả năng chống lại sự biến dạng của lò xo. Phụ thuộc vật liệu làm lò xo, chiều dài tự nhiên và tiết diện dây. Đơn vị: N/m."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tìm độ biến dạng Delta l",
              "instruction": "Đổi chiều dài tự nhiên $l_0$ và chiều dài $l$ sang đơn vị mét."
            },
            {
              "step": 2,
              "title": "Tính lực đàn hồi hoặc độ cứng",
              "instruction": "$F_{dh} = k|l - l_0|$."
            }
          ],
          "formulas": [
            {
              "label": "Định luật Hooke",
              "formula": "F_{dh} = k |\\Delta l|",
              "displayLatex": "F_{dh} = k |\\Delta l|",
              "notes": "Delta_l = l - l₀ là độ biến dạng (m), k là độ cứng (N/m)."
            },
            {
              "label": "Độ dãn tại vị trí cân bằng (treo thẳng đứng)",
              "formula": "\\Delta l_0 = \\frac{mg}{k}",
              "displayLatex": "\\Delta l_0 = \\frac{mg}{k}",
              "notes": "Khi vật đứng cân bằng thì F_dh = P."
            }
          ],
          "traps": [
            {
              "trap": "Quên đổi đơn vị cm sang mét",
              "avoid": "Độ biến dạng bắt buộc phải đổi sang mét (m)."
            },
            {
              "trap": "Áp dụng định luật Hooke khi vượt quá giới hạn đàn hồi",
              "avoid": "Khi biến dạng quá lớn lò xo bị biến dạng dẻo, định luật Hooke không còn đúng."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p9-1",
              "front": "Đơn vị chuẩn của độ cứng lò xo k là gì?",
              "back": "N/m (Newton trên mét)."
            },
            {
              "id": "fc-p9-2",
              "front": "Treo vật m vào lò xo thẳng đứng, độ dãn ở VTCB là?",
              "back": "Delta(l₀) = mg / k."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p9-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Treo vật nặng 200 g vào lò xo thẳng đứng thì lò xo dãn 4 cm. Lấy $g = 10\\text{ m/s}^2$. Độ cứng k của lò xo là:",
              "options": [
                "50 N/m",
                "5 N/m",
                "500 N/m",
                "20 N/m"
              ],
              "correct": 0,
              "solution": "P = mg = 0,2 * 10 = 2 N. Delta_l = 0,04 m. k = P / Delta_l = 2 / 0,04 = 50 N/m.",
              "trapAlert": "Không đổi 200g ra 0,2kg hoặc 4cm ra 0,04m.",
              "fastTip": "2 / 0,04 = 50 N/m."
            },
            {
              "id": "q-p9-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một lò xo có chiều dài tự nhiên 20 cm, độ cứng $k = 100\\text{ N/m}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p9-a",
                  "statement": "a) Khi tác dụng lực kéo 5 N thì lò xo dãn 5 cm.",
                  "isTrue": true,
                  "explain": "Delta_l = 5 / 100 = 0,05 m = 5 cm. Đúng."
                },
                {
                  "id": "tf-p9-b",
                  "statement": "b) Chiều dài của lò xo khi chịu lực kéo 5 N là 25 cm.",
                  "isTrue": true,
                  "explain": "l = 20 + 5 = 25 cm. Đúng."
                },
                {
                  "id": "tf-p9-c",
                  "statement": "c) Cắt lò xo làm đôi thì độ cứng của mỗi nửa là 50 N/m.",
                  "isTrue": false,
                  "explain": "Lò xo càng ngắn thì độ cứng càng tăng: k_mới = 2k = 200 N/m. Sai."
                },
                {
                  "id": "tf-p9-d",
                  "statement": "d) Khi nén lò xo một đoạn 2 cm thì lực đàn hồi có độ lớn là 2 N.",
                  "isTrue": true,
                  "explain": "F_dh = 100 * 0,02 = 2 N. Đúng."
                }
              ]
            },
            {
              "id": "q-p9-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một lò xo khi treo vật $m_1 = 100\\text{ g}$ dãn 2 cm. Muốn lò xo dãn 6 cm thì phải treo thêm vào đó một vật có khối lượng bao nhiêu gam?",
              "correctAnswer": "200",
              "unit": "g",
              "solution": "Độ dãn tỉ lệ thuận với khối lượng: Delta_l₂ / Delta_l₁ = m_tổng / m₁ -> 6 / 2 = m_tổng / 100 -> m_tổng = 300 g. Khối lượng treo thêm: Delta_m = 300 - 100 = 200 g.",
              "trapAlert": "Nhầm hỏi khối lượng treo THÊM với tổng khối lượng."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p9-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Treo vật nặng 200 g vào lò xo thẳng đứng thì lò xo dãn 4 cm. Lấy $g = 10\\text{ m/s}^2$. Độ cứng k của lò xo là:",
              "options": [
                "50 N/m",
                "5 N/m",
                "500 N/m",
                "20 N/m"
              ],
              "correct": 0,
              "solution": "P = mg = 0,2 * 10 = 2 N. Delta_l = 0,04 m. k = P / Delta_l = 2 / 0,04 = 50 N/m.",
              "trapAlert": "Không đổi 200g ra 0,2kg hoặc 4cm ra 0,04m.",
              "fastTip": "2 / 0,04 = 50 N/m."
            },
            {
              "id": "q-p9-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một lò xo có chiều dài tự nhiên 20 cm, độ cứng $k = 100\\text{ N/m}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p9-a",
                  "statement": "a) Khi tác dụng lực kéo 5 N thì lò xo dãn 5 cm.",
                  "isTrue": true,
                  "explain": "Delta_l = 5 / 100 = 0,05 m = 5 cm. Đúng."
                },
                {
                  "id": "tf-p9-b",
                  "statement": "b) Chiều dài của lò xo khi chịu lực kéo 5 N là 25 cm.",
                  "isTrue": true,
                  "explain": "l = 20 + 5 = 25 cm. Đúng."
                },
                {
                  "id": "tf-p9-c",
                  "statement": "c) Cắt lò xo làm đôi thì độ cứng của mỗi nửa là 50 N/m.",
                  "isTrue": false,
                  "explain": "Lò xo càng ngắn thì độ cứng càng tăng: k_mới = 2k = 200 N/m. Sai."
                },
                {
                  "id": "tf-p9-d",
                  "statement": "d) Khi nén lò xo một đoạn 2 cm thì lực đàn hồi có độ lớn là 2 N.",
                  "isTrue": true,
                  "explain": "F_dh = 100 * 0,02 = 2 N. Đúng."
                }
              ]
            },
            {
              "id": "q-p9-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một lò xo khi treo vật $m_1 = 100\\text{ g}$ dãn 2 cm. Muốn lò xo dãn 6 cm thì phải treo thêm vào đó một vật có khối lượng bao nhiêu gam?",
              "correctAnswer": "200",
              "unit": "g",
              "solution": "Độ dãn tỉ lệ thuận với khối lượng: Delta_l₂ / Delta_l₁ = m_tổng / m₁ -> 6 / 2 = m_tổng / 100 -> m_tổng = 300 g. Khối lượng treo thêm: Delta_m = 300 - 100 = 200 g.",
              "trapAlert": "Nhầm hỏi khối lượng treo THÊM với tổng khối lượng."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p9-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Treo vật nặng 200 g vào lò xo thẳng đứng thì lò xo dãn 4 cm. Lấy $g = 10\\text{ m/s}^2$. Độ cứng k của lò xo là:",
              "options": [
                "50 N/m",
                "5 N/m",
                "500 N/m",
                "20 N/m"
              ],
              "correct": 0,
              "solution": "P = mg = 0,2 * 10 = 2 N. Delta_l = 0,04 m. k = P / Delta_l = 2 / 0,04 = 50 N/m.",
              "trapAlert": "Không đổi 200g ra 0,2kg hoặc 4cm ra 0,04m.",
              "fastTip": "2 / 0,04 = 50 N/m."
            },
            {
              "id": "q-p9-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một lò xo có chiều dài tự nhiên 20 cm, độ cứng $k = 100\\text{ N/m}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p9-a",
                  "statement": "a) Khi tác dụng lực kéo 5 N thì lò xo dãn 5 cm.",
                  "isTrue": true,
                  "explain": "Delta_l = 5 / 100 = 0,05 m = 5 cm. Đúng."
                },
                {
                  "id": "tf-p9-b",
                  "statement": "b) Chiều dài của lò xo khi chịu lực kéo 5 N là 25 cm.",
                  "isTrue": true,
                  "explain": "l = 20 + 5 = 25 cm. Đúng."
                },
                {
                  "id": "tf-p9-c",
                  "statement": "c) Cắt lò xo làm đôi thì độ cứng của mỗi nửa là 50 N/m.",
                  "isTrue": false,
                  "explain": "Lò xo càng ngắn thì độ cứng càng tăng: k_mới = 2k = 200 N/m. Sai."
                },
                {
                  "id": "tf-p9-d",
                  "statement": "d) Khi nén lò xo một đoạn 2 cm thì lực đàn hồi có độ lớn là 2 N.",
                  "isTrue": true,
                  "explain": "F_dh = 100 * 0,02 = 2 N. Đúng."
                }
              ]
            },
            {
              "id": "q-p9-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một lò xo khi treo vật $m_1 = 100\\text{ g}$ dãn 2 cm. Muốn lò xo dãn 6 cm thì phải treo thêm vào đó một vật có khối lượng bao nhiêu gam?",
              "correctAnswer": "200",
              "unit": "g",
              "solution": "Độ dãn tỉ lệ thuận với khối lượng: Delta_l₂ / Delta_l₁ = m_tổng / m₁ -> 6 / 2 = m_tổng / 100 -> m_tổng = 300 g. Khối lượng treo thêm: Delta_m = 300 - 100 = 200 g.",
              "trapAlert": "Nhầm hỏi khối lượng treo THÊM với tổng khối lượng."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-ap-suat-chat-long",
          "title": "Khối lượng riêng và Áp suất chất lỏng",
          "questionsCount": 18,
          "durationMinutes": 20,
          "concepts": [
            {
              "title": "Áp suất chất lỏng",
              "desc": "Chất lỏng gây áp suất theo mọi phương lên các vật nhúng trong lòng nó. Áp suất ở độ sâu h: $p = p_0 + \\rho g h$."
            },
            {
              "title": "Nguyên lí Pascal & Lực đẩy Archimedes",
              "desc": "Độ tăng áp suất truyền nguyên vẹn tới mọi điểm: máy nén thủy lực $\\frac{F_2}{F_1} = \\frac{S_2}{S_1}$. Lực đẩy Archimedes $F_A = \\rho g V_{chìm}$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định độ sâu h",
              "instruction": "h tính từ mặt thoáng chất lỏng đến điểm cần tính áp suất."
            },
            {
              "step": 2,
              "title": "Tính áp suất toàn phần",
              "instruction": "$p = p_{khí quyên} + \\rho g h$."
            }
          ],
          "formulas": [
            {
              "label": "Áp suất thủy tĩnh ở độ sâu h",
              "formula": "p = \\rho g h",
              "displayLatex": "p = \\rho g h",
              "notes": "rho là khối lượng riêng chất lỏng (kg/m³), h là độ sâu (m)."
            },
            {
              "label": "Lực đẩy Archimedes",
              "formula": "F_A = \\rho g V",
              "displayLatex": "F_A = \\rho g V",
              "notes": "V là thể tích phần chìm trong chất lỏng."
            },
            {
              "label": "Nguyên lí máy nén thủy lực",
              "formula": "\\frac{F_2}{F_1} = \\frac{S_2}{S_1}",
              "displayLatex": "\\frac{F_2}{F_1} = \\frac{S_2}{S_1}",
              "notes": "Lực tác dụng tỉ lệ thuận với diện tích pít-tông."
            }
          ],
          "traps": [
            {
              "trap": "Quên cộng áp suất khí quyển p₀ khi tính áp suất tuyệt đối",
              "avoid": "Áp suất tuyệt đối bằng áp suất khí quyển cộng áp suất thủy tĩnh."
            },
            {
              "trap": "Lấy toàn bộ thể tích vật thay vì thể tích phần CHÌM",
              "avoid": "Lực đẩy Archimedes chỉ tính trên thể tích chất lỏng bị chiếm chỗ."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p10-1",
              "front": "Áp suất chất lỏng phụ thuộc vào yếu tố nào?",
              "back": "Phụ thuộc khối lượng riêng chất lỏng rho, gia tốc g và độ sâu h: p = rho * g * h."
            },
            {
              "id": "fc-p10-2",
              "front": "Điều kiện để vật nổi trên mặt chất lỏng?",
              "back": "Khối lượng riêng của vật nhỏ hơn khối lượng riêng của chất lỏng (d_vật < d_chất lỏng)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p10-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một thợ lặn ở độ sâu 15 m dưới biển. Khối lượng riêng của nước biển là $1030\\text{ kg/m}^3$, $g = 10\\text{ m/s}^2$. Áp suất thủy tĩnh do nước biển gây ra tại độ sâu đó là:",
              "options": [
                "154500 Pa",
                "15450 Pa",
                "10300 Pa",
                "309000 Pa"
              ],
              "correct": 0,
              "solution": "p = rho * g * h = 1030 * 10 * 15 = 154500 Pa.",
              "trapAlert": "Nhầm đơn vị Pa và kPa.",
              "fastTip": "1030 * 150 = 154500 Pa."
            },
            {
              "id": "q-p10-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một khối gỗ hình hộp có thể tích $1000\\text{ cm}^3$ được thả nổi trong nước ($\\rho_{nước} = 1000\\text{ kg/m}^3$). Khối lượng riêng của gỗ là $600\\text{ kg/m}^3$. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p10-a",
                  "statement": "a) Trọng lượng của khối gỗ là 6 N.",
                  "isTrue": true,
                  "explain": "m = 600 * 0,001 = 0,6 kg -> P = 6 N. Đúng."
                },
                {
                  "id": "tf-p10-b",
                  "statement": "b) Khi nổi cân bằng, lực đẩy Archimedes có độ lớn là 6 N.",
                  "isTrue": true,
                  "explain": "Nổi cân bằng nên F_A = P = 6 N. Đúng."
                },
                {
                  "id": "tf-p10-c",
                  "statement": "c) Thể tích phần chìm trong nước là 600 cm³.",
                  "isTrue": true,
                  "explain": "V_chìm = 6 / (1000 * 10) = 0,0006 m³ = 600 cm³. Đúng."
                },
                {
                  "id": "tf-p10-d",
                  "statement": "d) Nếu đổ thêm dầu lên trên thì thể tích phần gỗ chìm trong nước sẽ tăng lên.",
                  "isTrue": false,
                  "explain": "Dầu cũng gây thêm lực đẩy Archimedes phụ nên phần chìm trong nước sẽ giảm. Sai."
                }
              ]
            },
            {
              "id": "q-p10-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trong máy ép thủy lực, pít-tông nhỏ có diện tích $S_1 = 2\\text{ cm}^2$, pít-tông lớn $S_2 = 100\\text{ cm}^2$. Muốn nâng một ôtô nặng 1500 kg thì cần tác dụng vào pít-tông nhỏ một lực tối thiểu là bao nhiêu Newton (lấy $g = 10\\text{ m/s}^2$)?",
              "correctAnswer": "300",
              "unit": "N",
              "solution": "F₂ = P = 1500 * 10 = 15000 N. F₁ = F₂ * (S₁ / S₂) = 15000 * (2 / 100) = 300 N.",
              "trapAlert": "Quên nhân gia tốc g = 10 để ra trọng lượng F₂ = 15000 N."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p10-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một thợ lặn ở độ sâu 15 m dưới biển. Khối lượng riêng của nước biển là $1030\\text{ kg/m}^3$, $g = 10\\text{ m/s}^2$. Áp suất thủy tĩnh do nước biển gây ra tại độ sâu đó là:",
              "options": [
                "154500 Pa",
                "15450 Pa",
                "10300 Pa",
                "309000 Pa"
              ],
              "correct": 0,
              "solution": "p = rho * g * h = 1030 * 10 * 15 = 154500 Pa.",
              "trapAlert": "Nhầm đơn vị Pa và kPa.",
              "fastTip": "1030 * 150 = 154500 Pa."
            },
            {
              "id": "q-p10-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một khối gỗ hình hộp có thể tích $1000\\text{ cm}^3$ được thả nổi trong nước ($\\rho_{nước} = 1000\\text{ kg/m}^3$). Khối lượng riêng của gỗ là $600\\text{ kg/m}^3$. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p10-a",
                  "statement": "a) Trọng lượng của khối gỗ là 6 N.",
                  "isTrue": true,
                  "explain": "m = 600 * 0,001 = 0,6 kg -> P = 6 N. Đúng."
                },
                {
                  "id": "tf-p10-b",
                  "statement": "b) Khi nổi cân bằng, lực đẩy Archimedes có độ lớn là 6 N.",
                  "isTrue": true,
                  "explain": "Nổi cân bằng nên F_A = P = 6 N. Đúng."
                },
                {
                  "id": "tf-p10-c",
                  "statement": "c) Thể tích phần chìm trong nước là 600 cm³.",
                  "isTrue": true,
                  "explain": "V_chìm = 6 / (1000 * 10) = 0,0006 m³ = 600 cm³. Đúng."
                },
                {
                  "id": "tf-p10-d",
                  "statement": "d) Nếu đổ thêm dầu lên trên thì thể tích phần gỗ chìm trong nước sẽ tăng lên.",
                  "isTrue": false,
                  "explain": "Dầu cũng gây thêm lực đẩy Archimedes phụ nên phần chìm trong nước sẽ giảm. Sai."
                }
              ]
            },
            {
              "id": "q-p10-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trong máy ép thủy lực, pít-tông nhỏ có diện tích $S_1 = 2\\text{ cm}^2$, pít-tông lớn $S_2 = 100\\text{ cm}^2$. Muốn nâng một ôtô nặng 1500 kg thì cần tác dụng vào pít-tông nhỏ một lực tối thiểu là bao nhiêu Newton (lấy $g = 10\\text{ m/s}^2$)?",
              "correctAnswer": "300",
              "unit": "N",
              "solution": "F₂ = P = 1500 * 10 = 15000 N. F₁ = F₂ * (S₁ / S₂) = 15000 * (2 / 100) = 300 N.",
              "trapAlert": "Quên nhân gia tốc g = 10 để ra trọng lượng F₂ = 15000 N."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p10-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một thợ lặn ở độ sâu 15 m dưới biển. Khối lượng riêng của nước biển là $1030\\text{ kg/m}^3$, $g = 10\\text{ m/s}^2$. Áp suất thủy tĩnh do nước biển gây ra tại độ sâu đó là:",
              "options": [
                "154500 Pa",
                "15450 Pa",
                "10300 Pa",
                "309000 Pa"
              ],
              "correct": 0,
              "solution": "p = rho * g * h = 1030 * 10 * 15 = 154500 Pa.",
              "trapAlert": "Nhầm đơn vị Pa và kPa.",
              "fastTip": "1030 * 150 = 154500 Pa."
            },
            {
              "id": "q-p10-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một khối gỗ hình hộp có thể tích $1000\\text{ cm}^3$ được thả nổi trong nước ($\\rho_{nước} = 1000\\text{ kg/m}^3$). Khối lượng riêng của gỗ là $600\\text{ kg/m}^3$. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p10-a",
                  "statement": "a) Trọng lượng của khối gỗ là 6 N.",
                  "isTrue": true,
                  "explain": "m = 600 * 0,001 = 0,6 kg -> P = 6 N. Đúng."
                },
                {
                  "id": "tf-p10-b",
                  "statement": "b) Khi nổi cân bằng, lực đẩy Archimedes có độ lớn là 6 N.",
                  "isTrue": true,
                  "explain": "Nổi cân bằng nên F_A = P = 6 N. Đúng."
                },
                {
                  "id": "tf-p10-c",
                  "statement": "c) Thể tích phần chìm trong nước là 600 cm³.",
                  "isTrue": true,
                  "explain": "V_chìm = 6 / (1000 * 10) = 0,0006 m³ = 600 cm³. Đúng."
                },
                {
                  "id": "tf-p10-d",
                  "statement": "d) Nếu đổ thêm dầu lên trên thì thể tích phần gỗ chìm trong nước sẽ tăng lên.",
                  "isTrue": false,
                  "explain": "Dầu cũng gây thêm lực đẩy Archimedes phụ nên phần chìm trong nước sẽ giảm. Sai."
                }
              ]
            },
            {
              "id": "q-p10-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trong máy ép thủy lực, pít-tông nhỏ có diện tích $S_1 = 2\\text{ cm}^2$, pít-tông lớn $S_2 = 100\\text{ cm}^2$. Muốn nâng một ôtô nặng 1500 kg thì cần tác dụng vào pít-tông nhỏ một lực tối thiểu là bao nhiêu Newton (lấy $g = 10\\text{ m/s}^2$)?",
              "correctAnswer": "300",
              "unit": "N",
              "solution": "F₂ = P = 1500 * 10 = 15000 N. F₁ = F₂ * (S₁ / S₂) = 15000 * (2 / 100) = 300 N.",
              "trapAlert": "Quên nhân gia tốc g = 10 để ra trọng lượng F₂ = 15000 N."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-cong-co-hoc-cong-suat",
          "title": "Công cơ học, Công suất & Hiệu suất",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Công cơ học A",
              "desc": "Công là đại lượng vô hướng đặc trưng cho tác dụng làm dịch chuyển vật: $A = F \\cdot s \\cdot \\cos\\alpha$. Nếu $\\alpha < 90^\\circ$: công phát động ($A > 0$); $\\alpha = 90^\\circ$: công bằng 0; $\\alpha > 90^\\circ$: công cản ($A < 0$)."
            },
            {
              "title": "Công suất P và Hiệu suất H",
              "desc": "Công suất đo tốc độ sinh công: $\\mathcal{P} = \\frac{A}{t} = F \\cdot v$. Hiệu suất $H = \\frac{A_{ích}}{A_{toàn phần}} \\times 100\\%$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định góc alpha",
              "instruction": "Lực kéo cùng hướng: $\\alpha = 0^\\circ \\implies \\cos\\alpha = 1$. Lực ma sát ngược hướng: $\\alpha = 180^\\circ \\implies \\cos\\alpha = -1$."
            },
            {
              "step": 2,
              "title": "Tính công và công suất",
              "instruction": "$A = F s \\cos\\alpha$, $\\mathcal{P} = A / t$."
            }
          ],
          "formulas": [
            {
              "label": "Công của lực F",
              "formula": "A = F s \\cos\\alpha",
              "displayLatex": "A = F s \\cos\\alpha",
              "notes": "alpha là góc hợp bởi vectơ lực F và hướng dịch chuyển."
            },
            {
              "label": "Công suất tức thời",
              "formula": "\\mathcal{P} = F \\cdot v \\cdot \\cos\\alpha",
              "displayLatex": "\\mathcal{P} = F \\cdot v \\cdot \\cos\\alpha",
              "notes": "v là vận tốc tức thời, P đơn vị Watt (W)."
            },
            {
              "label": "Hiệu suất máy",
              "formula": "H = \\frac{\\mathcal{P}_{có ích}}{\\mathcal{P}_{toàn phần}} \\times 100\\%",
              "displayLatex": "H = \\frac{\\mathcal{P}_{có ích}}{\\mathcal{P}_{toàn phần}} \\times 100\\%",
              "notes": "Luôn có H < 100% do hao phí ma sát/nhiệt."
            }
          ],
          "traps": [
            {
              "trap": "Quên góc alpha khi lực không song song với hướng dịch chuyển",
              "avoid": "Lực kéo hợp góc nghiêng phải nhân với cos(alpha)."
            },
            {
              "trap": "Cho rằng trọng lực luôn sinh công",
              "avoid": "Khi vật chuyển động trên mặt sàn nằm ngang, trọng lực vuông góc độ dịch chuyển nên công của trọng lực bằng 0."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p11-1",
              "front": "Khi lực tác dụng vuông góc với phương dịch chuyển thì công bằng mấy?",
              "back": "A = 0 (vì cos 90 độ = 0)."
            },
            {
              "id": "fc-p11-2",
              "front": "1 kWh tương đương bao nhiêu Joule (J)?",
              "back": "1 kWh = 1000 W * 3600 s = 3.600.000 J (3,6 MJ)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p11-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một lực kéo $F = 50\\text{ N}$ hợp với phương ngang góc $60^\\circ$ kéo vật đi được quãng đường 10 m trên mặt sàn nằm ngang. Công của lực kéo là:",
              "options": [
                "250 J",
                "500 J",
                "433 J",
                "250√3 J"
              ],
              "correct": 0,
              "solution": "A = F * s * cos(60°) = 50 * 10 * 0,5 = 250 J.",
              "trapAlert": "Quên nhân cos(60°) = 0,5.",
              "fastTip": "500 * 0,5 = 250 J."
            },
            {
              "id": "q-p11-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một động cơ cần cẩu nâng một khối hàng 500 kg lên cao 12 m thẳng đứng đều trong thời gian 30 giây. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p11-a",
                  "statement": "a) Công có ích của cần cẩu là 60 kJ.",
                  "isTrue": true,
                  "explain": "A = mgh = 500 * 10 * 12 = 60000 J = 60 kJ. Đúng."
                },
                {
                  "id": "tf-p11-b",
                  "statement": "b) Công suất có ích của cần cẩu là 2 kW.",
                  "isTrue": true,
                  "explain": "P = 60000 / 30 = 2000 W = 2 kW. Đúng."
                },
                {
                  "id": "tf-p11-c",
                  "statement": "c) Nếu hiệu suất là 80% thì công suất toàn phần động cơ là 2,5 kW.",
                  "isTrue": true,
                  "explain": "P_tp = 2 / 0,8 = 2,5 kW. Đúng."
                },
                {
                  "id": "tf-p11-d",
                  "statement": "d) Trọng lực tác dụng lên khối hàng đã sinh công phát động.",
                  "isTrue": false,
                  "explain": "Khối hàng đi lên ngược chiều trọng lực nên trọng lực sinh công cản (A < 0). Sai."
                }
              ]
            },
            {
              "id": "q-p11-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một ôtô có công suất động cơ không đổi $\\mathcal{P} = 60\\text{ kW}$ đang chạy đều trên đường bằng với tốc độ 72 km/h. Tính độ lớn lực cản của không khí và mặt đường tác dụng lên ôtô (đơn vị: Newton).",
              "correctAnswer": "3000",
              "unit": "N",
              "solution": "72 km/h = 20 m/s. Xe chạy đều -> F_kéo = F_cản. P = F * v -> F = P / v = 60000 / 20 = 3000 N.",
              "trapAlert": "Không đổi 72 km/h sang 20 m/s."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p11-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một lực kéo $F = 50\\text{ N}$ hợp với phương ngang góc $60^\\circ$ kéo vật đi được quãng đường 10 m trên mặt sàn nằm ngang. Công của lực kéo là:",
              "options": [
                "250 J",
                "500 J",
                "433 J",
                "250√3 J"
              ],
              "correct": 0,
              "solution": "A = F * s * cos(60°) = 50 * 10 * 0,5 = 250 J.",
              "trapAlert": "Quên nhân cos(60°) = 0,5.",
              "fastTip": "500 * 0,5 = 250 J."
            },
            {
              "id": "q-p11-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một động cơ cần cẩu nâng một khối hàng 500 kg lên cao 12 m thẳng đứng đều trong thời gian 30 giây. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p11-a",
                  "statement": "a) Công có ích của cần cẩu là 60 kJ.",
                  "isTrue": true,
                  "explain": "A = mgh = 500 * 10 * 12 = 60000 J = 60 kJ. Đúng."
                },
                {
                  "id": "tf-p11-b",
                  "statement": "b) Công suất có ích của cần cẩu là 2 kW.",
                  "isTrue": true,
                  "explain": "P = 60000 / 30 = 2000 W = 2 kW. Đúng."
                },
                {
                  "id": "tf-p11-c",
                  "statement": "c) Nếu hiệu suất là 80% thì công suất toàn phần động cơ là 2,5 kW.",
                  "isTrue": true,
                  "explain": "P_tp = 2 / 0,8 = 2,5 kW. Đúng."
                },
                {
                  "id": "tf-p11-d",
                  "statement": "d) Trọng lực tác dụng lên khối hàng đã sinh công phát động.",
                  "isTrue": false,
                  "explain": "Khối hàng đi lên ngược chiều trọng lực nên trọng lực sinh công cản (A < 0). Sai."
                }
              ]
            },
            {
              "id": "q-p11-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một ôtô có công suất động cơ không đổi $\\mathcal{P} = 60\\text{ kW}$ đang chạy đều trên đường bằng với tốc độ 72 km/h. Tính độ lớn lực cản của không khí và mặt đường tác dụng lên ôtô (đơn vị: Newton).",
              "correctAnswer": "3000",
              "unit": "N",
              "solution": "72 km/h = 20 m/s. Xe chạy đều -> F_kéo = F_cản. P = F * v -> F = P / v = 60000 / 20 = 3000 N.",
              "trapAlert": "Không đổi 72 km/h sang 20 m/s."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p11-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một lực kéo $F = 50\\text{ N}$ hợp với phương ngang góc $60^\\circ$ kéo vật đi được quãng đường 10 m trên mặt sàn nằm ngang. Công của lực kéo là:",
              "options": [
                "250 J",
                "500 J",
                "433 J",
                "250√3 J"
              ],
              "correct": 0,
              "solution": "A = F * s * cos(60°) = 50 * 10 * 0,5 = 250 J.",
              "trapAlert": "Quên nhân cos(60°) = 0,5.",
              "fastTip": "500 * 0,5 = 250 J."
            },
            {
              "id": "q-p11-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một động cơ cần cẩu nâng một khối hàng 500 kg lên cao 12 m thẳng đứng đều trong thời gian 30 giây. Lấy $g = 10\\text{ m/s}^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p11-a",
                  "statement": "a) Công có ích của cần cẩu là 60 kJ.",
                  "isTrue": true,
                  "explain": "A = mgh = 500 * 10 * 12 = 60000 J = 60 kJ. Đúng."
                },
                {
                  "id": "tf-p11-b",
                  "statement": "b) Công suất có ích của cần cẩu là 2 kW.",
                  "isTrue": true,
                  "explain": "P = 60000 / 30 = 2000 W = 2 kW. Đúng."
                },
                {
                  "id": "tf-p11-c",
                  "statement": "c) Nếu hiệu suất là 80% thì công suất toàn phần động cơ là 2,5 kW.",
                  "isTrue": true,
                  "explain": "P_tp = 2 / 0,8 = 2,5 kW. Đúng."
                },
                {
                  "id": "tf-p11-d",
                  "statement": "d) Trọng lực tác dụng lên khối hàng đã sinh công phát động.",
                  "isTrue": false,
                  "explain": "Khối hàng đi lên ngược chiều trọng lực nên trọng lực sinh công cản (A < 0). Sai."
                }
              ]
            },
            {
              "id": "q-p11-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một ôtô có công suất động cơ không đổi $\\mathcal{P} = 60\\text{ kW}$ đang chạy đều trên đường bằng với tốc độ 72 km/h. Tính độ lớn lực cản của không khí và mặt đường tác dụng lên ôtô (đơn vị: Newton).",
              "correctAnswer": "3000",
              "unit": "N",
              "solution": "72 km/h = 20 m/s. Xe chạy đều -> F_kéo = F_cản. P = F * v -> F = P / v = 60000 / 20 = 3000 N.",
              "trapAlert": "Không đổi 72 km/h sang 20 m/s."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-dinh-luat-bao-toan-co-nang",
          "title": "Động năng, Thế năng & Bảo toàn cơ năng",
          "questionsCount": 30,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Định luật bảo toàn cơ năng",
              "desc": "Khi vật chỉ chịu tác dụng của lực thế (trọng lực, lực đàn hồi), cơ năng của vật là một đại lượng bảo toàn: $W = W_d + W_t = \\text{const}$."
            },
            {
              "title": "Định lí động năng",
              "desc": "Độ biến thiên động năng của vật bằng tổng công của tất cả các ngoại lực tác dụng lên vật: $W_{d2} - W_{d1} = A_{ngoại lực}$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Chọn mốc thế năng",
              "instruction": "Thường chọn mặt đất hoặc vị trí thấp nhất làm mốc ($z = 0$)."
            },
            {
              "step": 2,
              "title": "Lập phương trình bảo toàn cơ năng",
              "instruction": "$W_1 = W_2 \\iff \\frac{1}{2}mv_1^2 + mgz_1 = \\frac{1}{2}mv_2^2 + mgz_2$."
            }
          ],
          "formulas": [
            {
              "label": "Cơ năng trong trọng trường",
              "formula": "W = \\frac{1}{2}mv^2 + mgz = \\text{const}",
              "displayLatex": "W = \\frac{1}{2}mv^2 + mgz = \\text{const}",
              "notes": "z là độ cao so với mốc thế năng."
            },
            {
              "label": "Định lí biến thiên cơ năng khi có ma sát",
              "formula": "W_2 - W_1 = A_{Fms}",
              "displayLatex": "W_2 - W_1 = A_{Fms}",
              "notes": "Công lực ma sát âm làm hao hụt cơ năng chuyển thành nhiệt."
            }
          ],
          "traps": [
            {
              "trap": "Quên chọn mốc thế năng",
              "avoid": "Giá trị thế năng phụ thuộc vào việc chọn mốc thế năng."
            },
            {
              "trap": "Bảo toàn cơ năng khi có lực ma sát",
              "avoid": "Có lực ma sát thì cơ năng KHÔNG bảo toàn, phải dùng $W_2 - W_1 = A_{ms}$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p12-1",
              "front": "Điều kiện để cơ năng của vật được bảo toàn?",
              "back": "Vật chỉ chịu tác dụng của các lực thế (trọng lực, lực đàn hồi), không có lực ma sát, lực cản."
            },
            {
              "id": "fc-p12-2",
              "front": "Độ cao cực đại vật đạt được khi ném thẳng đứng với vận tốc v₀?",
              "back": "h_max = v₀² / (2g)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p12-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ném vật $m = 0{,}5\\text{ kg}$ thẳng đứng lên cao từ mặt đất với $v_0 = 10\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$, mốc thế năng ở mặt đất. Độ cao cực đại mà vật đạt được là:",
              "options": [
                "5 m",
                "10 m",
                "2,5 m",
                "20 m"
              ],
              "correct": 0,
              "solution": "Bảo toàn cơ năng: 0,5 * m * v₀² = m * g * h_max -> h_max = v₀² / (2g) = 100 / 20 = 5 m.",
              "trapAlert": "Nhầm công thức h = v₀² / g.",
              "fastTip": "v² / (2g) = 100 / 20 = 5m."
            },
            {
              "id": "q-p12-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thả một vật rơi tự do từ độ cao 20 m so với mặt đất. Lấy $g = 10\\text{ m/s}^2$, chọn mốc thế năng ở mặt đất. Bỏ qua sức cản. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p12-a",
                  "statement": "a) Vận tốc của vật khi chạm đất là 20 m/s.",
                  "isTrue": true,
                  "explain": "v = √(2gh) = √(2*10*20) = 20 m/s. Đúng."
                },
                {
                  "id": "tf-p12-b",
                  "statement": "b) Ở độ cao 10 m, động năng của vật bằng thế năng của vật.",
                  "isTrue": true,
                  "explain": "z = h/2 -> W_t = W/2 -> W_d = W_t. Đúng."
                },
                {
                  "id": "tf-p12-c",
                  "statement": "c) Khi động năng gấp 3 lần thế năng thì vật ở độ cao 5 m.",
                  "isTrue": true,
                  "explain": "W_d = 3W_t -> W = 4W_t -> z = h/4 = 5 m. Đúng."
                },
                {
                  "id": "tf-p12-d",
                  "statement": "d) Trong quá trình rơi, tổng động năng và thế năng luôn tăng dần.",
                  "isTrue": false,
                  "explain": "Tổng động năng và thế năng là cơ năng không đổi (bảo toàn). Sai."
                }
              ]
            },
            {
              "id": "q-p12-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Một con lắc đơn gồm dây dài $l = 1\\text{ m}$, kéo con lắc lệch góc $\\alpha_0 = 60^\\circ$ rồi thả nhẹ. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ của con lắc khi đi qua vị trí cân bằng (đơn vị: m/s, làm tròn 1 chữ số thập phân nếu cần hoặc ghi số nguyên nếu chẵn)?",
              "correctAnswer": "3.2",
              "unit": "m/s",
              "solution": "v = √(2gl(1 - cos alpha₀)) = √(2 * 10 * 1 * (1 - 0,5)) = √10 ≈ 3,16 ≈ 3,2 m/s.",
              "trapAlert": "Nhầm cos(60°) thành sin(60°)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p12-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ném vật $m = 0{,}5\\text{ kg}$ thẳng đứng lên cao từ mặt đất với $v_0 = 10\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$, mốc thế năng ở mặt đất. Độ cao cực đại mà vật đạt được là:",
              "options": [
                "5 m",
                "10 m",
                "2,5 m",
                "20 m"
              ],
              "correct": 0,
              "solution": "Bảo toàn cơ năng: 0,5 * m * v₀² = m * g * h_max -> h_max = v₀² / (2g) = 100 / 20 = 5 m.",
              "trapAlert": "Nhầm công thức h = v₀² / g.",
              "fastTip": "v² / (2g) = 100 / 20 = 5m."
            },
            {
              "id": "q-p12-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thả một vật rơi tự do từ độ cao 20 m so với mặt đất. Lấy $g = 10\\text{ m/s}^2$, chọn mốc thế năng ở mặt đất. Bỏ qua sức cản. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p12-a",
                  "statement": "a) Vận tốc của vật khi chạm đất là 20 m/s.",
                  "isTrue": true,
                  "explain": "v = √(2gh) = √(2*10*20) = 20 m/s. Đúng."
                },
                {
                  "id": "tf-p12-b",
                  "statement": "b) Ở độ cao 10 m, động năng của vật bằng thế năng của vật.",
                  "isTrue": true,
                  "explain": "z = h/2 -> W_t = W/2 -> W_d = W_t. Đúng."
                },
                {
                  "id": "tf-p12-c",
                  "statement": "c) Khi động năng gấp 3 lần thế năng thì vật ở độ cao 5 m.",
                  "isTrue": true,
                  "explain": "W_d = 3W_t -> W = 4W_t -> z = h/4 = 5 m. Đúng."
                },
                {
                  "id": "tf-p12-d",
                  "statement": "d) Trong quá trình rơi, tổng động năng và thế năng luôn tăng dần.",
                  "isTrue": false,
                  "explain": "Tổng động năng và thế năng là cơ năng không đổi (bảo toàn). Sai."
                }
              ]
            },
            {
              "id": "q-p12-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Một con lắc đơn gồm dây dài $l = 1\\text{ m}$, kéo con lắc lệch góc $\\alpha_0 = 60^\\circ$ rồi thả nhẹ. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ của con lắc khi đi qua vị trí cân bằng (đơn vị: m/s, làm tròn 1 chữ số thập phân nếu cần hoặc ghi số nguyên nếu chẵn)?",
              "correctAnswer": "3.2",
              "unit": "m/s",
              "solution": "v = √(2gl(1 - cos alpha₀)) = √(2 * 10 * 1 * (1 - 0,5)) = √10 ≈ 3,16 ≈ 3,2 m/s.",
              "trapAlert": "Nhầm cos(60°) thành sin(60°)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p12-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ném vật $m = 0{,}5\\text{ kg}$ thẳng đứng lên cao từ mặt đất với $v_0 = 10\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$, mốc thế năng ở mặt đất. Độ cao cực đại mà vật đạt được là:",
              "options": [
                "5 m",
                "10 m",
                "2,5 m",
                "20 m"
              ],
              "correct": 0,
              "solution": "Bảo toàn cơ năng: 0,5 * m * v₀² = m * g * h_max -> h_max = v₀² / (2g) = 100 / 20 = 5 m.",
              "trapAlert": "Nhầm công thức h = v₀² / g.",
              "fastTip": "v² / (2g) = 100 / 20 = 5m."
            },
            {
              "id": "q-p12-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thả một vật rơi tự do từ độ cao 20 m so với mặt đất. Lấy $g = 10\\text{ m/s}^2$, chọn mốc thế năng ở mặt đất. Bỏ qua sức cản. Xét các khẳng định:",
              "subQuestions": [
                {
                  "id": "tf-p12-a",
                  "statement": "a) Vận tốc của vật khi chạm đất là 20 m/s.",
                  "isTrue": true,
                  "explain": "v = √(2gh) = √(2*10*20) = 20 m/s. Đúng."
                },
                {
                  "id": "tf-p12-b",
                  "statement": "b) Ở độ cao 10 m, động năng của vật bằng thế năng của vật.",
                  "isTrue": true,
                  "explain": "z = h/2 -> W_t = W/2 -> W_d = W_t. Đúng."
                },
                {
                  "id": "tf-p12-c",
                  "statement": "c) Khi động năng gấp 3 lần thế năng thì vật ở độ cao 5 m.",
                  "isTrue": true,
                  "explain": "W_d = 3W_t -> W = 4W_t -> z = h/4 = 5 m. Đúng."
                },
                {
                  "id": "tf-p12-d",
                  "statement": "d) Trong quá trình rơi, tổng động năng và thế năng luôn tăng dần.",
                  "isTrue": false,
                  "explain": "Tổng động năng và thế năng là cơ năng không đổi (bảo toàn). Sai."
                }
              ]
            },
            {
              "id": "q-p12-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Một con lắc đơn gồm dây dài $l = 1\\text{ m}$, kéo con lắc lệch góc $\\alpha_0 = 60^\\circ$ rồi thả nhẹ. Lấy $g = 10\\text{ m/s}^2$. Tính tốc độ của con lắc khi đi qua vị trí cân bằng (đơn vị: m/s, làm tròn 1 chữ số thập phân nếu cần hoặc ghi số nguyên nếu chẵn)?",
              "correctAnswer": "3.2",
              "unit": "m/s",
              "solution": "v = √(2gl(1 - cos alpha₀)) = √(2 * 10 * 1 * (1 - 0,5)) = √10 ≈ 3,16 ≈ 3,2 m/s.",
              "trapAlert": "Nhầm cos(60°) thành sin(60°)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        }
      ]
    },
    {
      "chapterId": "ly-c1-daodong",
      "chapterNum": "03",
      "chapterName": "Dao động điều hòa",
      "lessons": [
        {
          "id": "ly-dao-dong-dieu-hoa-ly-thuyet",
          "title": "Phương trình dao động điều hòa",
          "questionsCount": 35,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Phương trình li độ x",
              "desc": "Dao động điều hòa có li độ biến thiên theo quy luật hàm cos: $x = A \\cos(\\omega t + \\varphi)$. Trong đó: A là biên độ ($A > 0$), $\\omega$ là tần số góc, $\\varphi$ là pha ban đầu."
            },
            {
              "title": "Mối quan hệ pha giữa x, v, a",
              "desc": "Vận tốc sớm pha $\\pi/2$ so với li độ: $v = -\\omega A \\sin(\\omega t + \\varphi)$. Gia tốc ngược pha ($\\\\pi$) so với li độ: $a = -\\omega^2 x$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định các thông số dao động",
              "instruction": "Biên độ A, tần số góc $\\omega$, pha ban đầu $\\varphi$ từ điều kiện ban đầu ($t = 0$)."
            },
            {
              "step": 2,
              "title": "Dùng vòng tròn lượng giác",
              "instruction": "Biểu diễn li độ và vận tốc trên đường tròn lượng giác để tìm thời gian chuyển động."
            }
          ],
          "formulas": [
            {
              "label": "Hệ thức độc lập thời gian giữa x và v",
              "formula": "x^2 + \\frac{v^2}{\\omega^2} = A^2",
              "displayLatex": "x^2 + \\frac{v^2}{\\omega^2} = A^2",
              "notes": "Li độ vuông pha với vận tốc."
            },
            {
              "label": "Gia tốc cực đại và Vận tốc cực đại",
              "formula": "v_{max} = \\omega A, \\quad a_{max} = \\omega^2 A",
              "displayLatex": "v_{max} = \\omega A, \\quad a_{max} = \\omega^2 A",
              "notes": "v_max tại VTCB, a_max tại vị trí biên âm."
            },
            {
              "label": "Chu kì và tần số",
              "formula": "T = \\frac{2\\pi}{\\omega}, \\quad f = \\frac{1}{T} = \\frac{\\omega}{2\\pi}",
              "displayLatex": "T = \\frac{2\\pi}{\\omega}, \\quad f = \\frac{\\omega}{2\\pi}",
              "notes": "Đơn vị: T (s), f (Hz)."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm gia tốc sớm pha so với vận tốc là pi/2 nhưng ngược pha so với li độ là pi",
              "avoid": "Nhớ thứ tự pha: a sớm pha hơn v là $\\pi/2$, v sớm pha hơn x là $\\pi/2$."
            },
            {
              "trap": "Quên đổi đơn vị cm sang mét khi tính năng lượng hay gia tốc",
              "avoid": "Khi tính gia tốc (m/s²) hoặc năng lượng (J) bắt buộc đổi A ra mét."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p13-1",
              "front": "Vận tốc và li độ trong dao động điều hòa lệch pha nhau bao nhiêu?",
              "back": "Vận tốc sớm pha pi/2 (vuông pha) so với li độ."
            },
            {
              "id": "fc-p13-2",
              "front": "Tại vị trí cân bằng, gia tốc của chất điểm bằng bao nhiêu?",
              "back": "a = 0 (vì x = 0)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p13-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một chất điểm dao động điều hòa với phương trình $x = 6\\cos(4\\pi t + \\pi/3)\\text{ cm}$. Pha ban đầu của dao động là:",
              "options": [
                "π/3 rad",
                "4π rad",
                "6 cm",
                "π rad"
              ],
              "correct": 0,
              "solution": "Pha ban đầu phi = pi/3 rad.",
              "trapAlert": "Nhầm pha ban đầu với biên độ hoặc tần số góc.",
              "fastTip": "Hằng số trong ngoặc tại t = 0 chính là phi = pi/3."
            },
            {
              "id": "q-p13-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Chất điểm dao động với $x = 5\\cos(10t - \\pi/2)\\text{ cm}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p13-a",
                  "statement": "a) Biên độ dao động là 5 cm.",
                  "isTrue": true,
                  "explain": "A = 5 cm. Đúng."
                },
                {
                  "id": "tf-p13-b",
                  "statement": "b) Tốc độ cực đại là 50 cm/s.",
                  "isTrue": true,
                  "explain": "v_max = omega * A = 10 * 5 = 50 cm/s. Đúng."
                },
                {
                  "id": "tf-p13-c",
                  "statement": "c) Gia tốc cực đại là 500 cm/s² = 5 m/s².",
                  "isTrue": true,
                  "explain": "a_max = omega² * A = 100 * 5 = 500 cm/s² = 5 m/s². Đúng."
                },
                {
                  "id": "tf-p13-d",
                  "statement": "d) Tại thời điểm t = 0 chất điểm đang ở vị trí biên dương.",
                  "isTrue": false,
                  "explain": "Tại t = 0, x = 5*cos(-pi/2) = 0 (ở VTCB đi theo chiều dương). Sai."
                }
              ]
            },
            {
              "id": "q-p13-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một vật dao động điều hòa với chu kì $T = 2\\text{ s}$, biên độ $A = 10\\text{ cm}$. Khi vật có li độ $x = 6\\text{ cm}$ thì tốc độ của vật là bao nhiêu cm/s (lấy $\\pi = 3{,}14$, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "25.1",
              "unit": "cm/s",
              "solution": "omega = 2*pi / 2 = pi rad/s. v = omega * √(A² - x²) = pi * √(10² - 6²) = 8pi ≈ 8 * 3,14 = 25,12 ≈ 25,1 cm/s.",
              "trapAlert": "Quên công thức độc lập thời gian v = omega * √(A² - x²)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p13-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một chất điểm dao động điều hòa với phương trình $x = 6\\cos(4\\pi t + \\pi/3)\\text{ cm}$. Pha ban đầu của dao động là:",
              "options": [
                "π/3 rad",
                "4π rad",
                "6 cm",
                "π rad"
              ],
              "correct": 0,
              "solution": "Pha ban đầu phi = pi/3 rad.",
              "trapAlert": "Nhầm pha ban đầu với biên độ hoặc tần số góc.",
              "fastTip": "Hằng số trong ngoặc tại t = 0 chính là phi = pi/3."
            },
            {
              "id": "q-p13-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Chất điểm dao động với $x = 5\\cos(10t - \\pi/2)\\text{ cm}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p13-a",
                  "statement": "a) Biên độ dao động là 5 cm.",
                  "isTrue": true,
                  "explain": "A = 5 cm. Đúng."
                },
                {
                  "id": "tf-p13-b",
                  "statement": "b) Tốc độ cực đại là 50 cm/s.",
                  "isTrue": true,
                  "explain": "v_max = omega * A = 10 * 5 = 50 cm/s. Đúng."
                },
                {
                  "id": "tf-p13-c",
                  "statement": "c) Gia tốc cực đại là 500 cm/s² = 5 m/s².",
                  "isTrue": true,
                  "explain": "a_max = omega² * A = 100 * 5 = 500 cm/s² = 5 m/s². Đúng."
                },
                {
                  "id": "tf-p13-d",
                  "statement": "d) Tại thời điểm t = 0 chất điểm đang ở vị trí biên dương.",
                  "isTrue": false,
                  "explain": "Tại t = 0, x = 5*cos(-pi/2) = 0 (ở VTCB đi theo chiều dương). Sai."
                }
              ]
            },
            {
              "id": "q-p13-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một vật dao động điều hòa với chu kì $T = 2\\text{ s}$, biên độ $A = 10\\text{ cm}$. Khi vật có li độ $x = 6\\text{ cm}$ thì tốc độ của vật là bao nhiêu cm/s (lấy $\\pi = 3{,}14$, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "25.1",
              "unit": "cm/s",
              "solution": "omega = 2*pi / 2 = pi rad/s. v = omega * √(A² - x²) = pi * √(10² - 6²) = 8pi ≈ 8 * 3,14 = 25,12 ≈ 25,1 cm/s.",
              "trapAlert": "Quên công thức độc lập thời gian v = omega * √(A² - x²)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p13-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một chất điểm dao động điều hòa với phương trình $x = 6\\cos(4\\pi t + \\pi/3)\\text{ cm}$. Pha ban đầu của dao động là:",
              "options": [
                "π/3 rad",
                "4π rad",
                "6 cm",
                "π rad"
              ],
              "correct": 0,
              "solution": "Pha ban đầu phi = pi/3 rad.",
              "trapAlert": "Nhầm pha ban đầu với biên độ hoặc tần số góc.",
              "fastTip": "Hằng số trong ngoặc tại t = 0 chính là phi = pi/3."
            },
            {
              "id": "q-p13-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Chất điểm dao động với $x = 5\\cos(10t - \\pi/2)\\text{ cm}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p13-a",
                  "statement": "a) Biên độ dao động là 5 cm.",
                  "isTrue": true,
                  "explain": "A = 5 cm. Đúng."
                },
                {
                  "id": "tf-p13-b",
                  "statement": "b) Tốc độ cực đại là 50 cm/s.",
                  "isTrue": true,
                  "explain": "v_max = omega * A = 10 * 5 = 50 cm/s. Đúng."
                },
                {
                  "id": "tf-p13-c",
                  "statement": "c) Gia tốc cực đại là 500 cm/s² = 5 m/s².",
                  "isTrue": true,
                  "explain": "a_max = omega² * A = 100 * 5 = 500 cm/s² = 5 m/s². Đúng."
                },
                {
                  "id": "tf-p13-d",
                  "statement": "d) Tại thời điểm t = 0 chất điểm đang ở vị trí biên dương.",
                  "isTrue": false,
                  "explain": "Tại t = 0, x = 5*cos(-pi/2) = 0 (ở VTCB đi theo chiều dương). Sai."
                }
              ]
            },
            {
              "id": "q-p13-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một vật dao động điều hòa với chu kì $T = 2\\text{ s}$, biên độ $A = 10\\text{ cm}$. Khi vật có li độ $x = 6\\text{ cm}$ thì tốc độ của vật là bao nhiêu cm/s (lấy $\\pi = 3{,}14$, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "25.1",
              "unit": "cm/s",
              "solution": "omega = 2*pi / 2 = pi rad/s. v = omega * √(A² - x²) = pi * √(10² - 6²) = 8pi ≈ 8 * 3,14 = 25,12 ≈ 25,1 cm/s.",
              "trapAlert": "Quên công thức độc lập thời gian v = omega * √(A² - x²)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-con-lac-lo-xo-con-lac-don",
          "title": "Con lắc lò xo & Con lắc đơn",
          "questionsCount": 30,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Con lắc lò xo",
              "desc": "Chu kì: $T = 2\\pi \\sqrt{\\frac{m}{k}}$. Động năng $W_d = \\frac{1}{2}mv^2$, thế năng đàn hồi $W_t = \\frac{1}{2}kx^2$. Cơ năng bảo toàn: $W = \\frac{1}{2}kA^2$."
            },
            {
              "title": "Con lắc đơn",
              "desc": "Chu kì: $T = 2\\pi \\sqrt{\\frac{l}{g}}$. Chu kì không phụ thuộc khối lượng quả nặng, chỉ phụ thuộc chiều dài l và gia tốc trọng trường g."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tìm tần số góc omega",
              "instruction": "Lò xo: $\\omega = \\sqrt{k/m}$. Con lắc đơn: $\\omega = \\sqrt{g/l}$."
            },
            {
              "step": 2,
              "title": "Tính chu kì và cơ năng",
              "instruction": "$T = 2\\pi / \\omega$, $W = 0.5 m \\omega^2 A^2$."
            }
          ],
          "formulas": [
            {
              "label": "Chu kì con lắc lò xo",
              "formula": "T = 2\\pi \\sqrt{\\frac{m}{k}}",
              "displayLatex": "T = 2\\pi \\sqrt{\\frac{m}{k}}",
              "notes": "m tăng 4 lần thì T tăng 2 lần."
            },
            {
              "label": "Chu kì con lắc đơn",
              "formula": "T = 2\\pi \\sqrt{\\frac{l}{g}}",
              "displayLatex": "T = 2\\pi \\sqrt{\\frac{l}{g}}",
              "notes": "Độc lập hoàn toàn với khối lượng m."
            },
            {
              "label": "Cơ năng dao động điều hòa",
              "formula": "W = \\frac{1}{2}kA^2 = \\frac{1}{2}m\\omega^2 A^2",
              "displayLatex": "W = \\frac{1}{2}kA^2 = \\frac{1}{2}m\\omega^2 A^2",
              "notes": "Tỉ lệ thuận với bình phương biên độ A²."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng tăng khối lượng quả nặng con lắc đơn thì chu kì thay đổi",
              "avoid": "Chu kì con lắc đơn hoàn toàn không phụ thuộc khối lượng m."
            },
            {
              "trap": "Nhầm chu kì biến thiên của động năng/thế năng với chu kì dao động",
              "avoid": "Động năng và thế năng biến thiên với chu kì T' = T/2, tần số f' = 2f."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p14-1",
              "front": "Tăng chiều dài con lắc đơn lên 4 lần thì chu kì thay đổi thế nào?",
              "back": "Chu kì tăng lên 2 lần (vì T tỉ lệ thuận với căn bậc hai của l)."
            },
            {
              "id": "fc-p14-2",
              "front": "Cơ năng của con lắc lò xo tỉ lệ với đại lượng nào của biên độ?",
              "back": "Tỉ lệ thuận với bình phương biên độ (A²)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p14-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một con lắc lò xo gồm lò xo có $k = 100\\text{ N/m}$ và vật $m = 0{,}25\\text{ kg}$. Lấy $\\pi^2 = 10$. Chu kì dao động của con lắc là:",
              "options": [
                "0,314 s",
                "0,5 s",
                "1 s",
                "2 s"
              ],
              "correct": 0,
              "solution": "T = 2pi * √(m/k) = 2pi * √(0,25/100) = 2pi * 0,05 = 0,1pi ≈ 0,314 s.",
              "trapAlert": "Nhầm công thức nghịch đảo căn k/m.",
              "fastTip": "√(0,25/100) = 0,05 -> T = 0,1pi ≈ 0,314 s."
            },
            {
              "id": "q-p14-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tại cùng một nơi, con lắc đơn chiều dài $l_1$ có chu kì $T_1 = 1{,}2\\text{ s}$, con lắc $l_2$ có chu kì $T_2 = 1{,}6\\text{ s}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p14-a",
                  "statement": "a) Con lắc có chiều dài $l = l_1 + l_2$ có chu kì là 2,0 s.",
                  "isTrue": true,
                  "explain": "T = √(T₁² + T₂²) = √(1,2² + 1,6²) = 2,0 s. Đúng."
                },
                {
                  "id": "tf-p14-b",
                  "statement": "b) Con lắc có chiều dài $l = l_2 - l_1$ có chu kì là 0,4 s.",
                  "isTrue": false,
                  "explain": "T = √(T₂² - T₁²) = √(1,6² - 1,2²) ≈ 1,06 s != 0,4 s. Sai."
                },
                {
                  "id": "tf-p14-c",
                  "statement": "c) Nếu tăng khối lượng con lắc $l_1$ lên 2 lần thì chu kì của nó vẫn là 1,2 s.",
                  "isTrue": true,
                  "explain": "Chu kì con lắc đơn không phụ thuộc khối lượng. Đúng."
                },
                {
                  "id": "tf-p14-d",
                  "statement": "d) Đưa con lắc lên núi cao thì chu kì của nó giảm đi.",
                  "isTrue": false,
                  "explain": "Lên cao gia tốc g giảm -> T tăng. Sai."
                }
              ]
            },
            {
              "id": "q-p14-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Con lắc lò xo dao động với biên độ $A = 8\\text{ cm}$. Tại vị trí thế năng bằng 3 lần động năng thì li độ của vật có độ lớn là bao nhiêu cm (làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "6.9",
              "unit": "cm",
              "solution": "W_t = 3W_d -> W = 4/3 W_t -> 0,5 k A² = 4/3 * 0,5 k x² -> |x| = A * √(3/4) = 8 * (√3 / 2) = 4√3 ≈ 6,93 ≈ 6,9 cm.",
              "trapAlert": "Nhầm giữa thế năng bằng 3 lần động năng với động năng bằng 3 lần thế năng."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p14-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một con lắc lò xo gồm lò xo có $k = 100\\text{ N/m}$ và vật $m = 0{,}25\\text{ kg}$. Lấy $\\pi^2 = 10$. Chu kì dao động của con lắc là:",
              "options": [
                "0,314 s",
                "0,5 s",
                "1 s",
                "2 s"
              ],
              "correct": 0,
              "solution": "T = 2pi * √(m/k) = 2pi * √(0,25/100) = 2pi * 0,05 = 0,1pi ≈ 0,314 s.",
              "trapAlert": "Nhầm công thức nghịch đảo căn k/m.",
              "fastTip": "√(0,25/100) = 0,05 -> T = 0,1pi ≈ 0,314 s."
            },
            {
              "id": "q-p14-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tại cùng một nơi, con lắc đơn chiều dài $l_1$ có chu kì $T_1 = 1{,}2\\text{ s}$, con lắc $l_2$ có chu kì $T_2 = 1{,}6\\text{ s}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p14-a",
                  "statement": "a) Con lắc có chiều dài $l = l_1 + l_2$ có chu kì là 2,0 s.",
                  "isTrue": true,
                  "explain": "T = √(T₁² + T₂²) = √(1,2² + 1,6²) = 2,0 s. Đúng."
                },
                {
                  "id": "tf-p14-b",
                  "statement": "b) Con lắc có chiều dài $l = l_2 - l_1$ có chu kì là 0,4 s.",
                  "isTrue": false,
                  "explain": "T = √(T₂² - T₁²) = √(1,6² - 1,2²) ≈ 1,06 s != 0,4 s. Sai."
                },
                {
                  "id": "tf-p14-c",
                  "statement": "c) Nếu tăng khối lượng con lắc $l_1$ lên 2 lần thì chu kì của nó vẫn là 1,2 s.",
                  "isTrue": true,
                  "explain": "Chu kì con lắc đơn không phụ thuộc khối lượng. Đúng."
                },
                {
                  "id": "tf-p14-d",
                  "statement": "d) Đưa con lắc lên núi cao thì chu kì của nó giảm đi.",
                  "isTrue": false,
                  "explain": "Lên cao gia tốc g giảm -> T tăng. Sai."
                }
              ]
            },
            {
              "id": "q-p14-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Con lắc lò xo dao động với biên độ $A = 8\\text{ cm}$. Tại vị trí thế năng bằng 3 lần động năng thì li độ của vật có độ lớn là bao nhiêu cm (làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "6.9",
              "unit": "cm",
              "solution": "W_t = 3W_d -> W = 4/3 W_t -> 0,5 k A² = 4/3 * 0,5 k x² -> |x| = A * √(3/4) = 8 * (√3 / 2) = 4√3 ≈ 6,93 ≈ 6,9 cm.",
              "trapAlert": "Nhầm giữa thế năng bằng 3 lần động năng với động năng bằng 3 lần thế năng."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p14-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một con lắc lò xo gồm lò xo có $k = 100\\text{ N/m}$ và vật $m = 0{,}25\\text{ kg}$. Lấy $\\pi^2 = 10$. Chu kì dao động của con lắc là:",
              "options": [
                "0,314 s",
                "0,5 s",
                "1 s",
                "2 s"
              ],
              "correct": 0,
              "solution": "T = 2pi * √(m/k) = 2pi * √(0,25/100) = 2pi * 0,05 = 0,1pi ≈ 0,314 s.",
              "trapAlert": "Nhầm công thức nghịch đảo căn k/m.",
              "fastTip": "√(0,25/100) = 0,05 -> T = 0,1pi ≈ 0,314 s."
            },
            {
              "id": "q-p14-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tại cùng một nơi, con lắc đơn chiều dài $l_1$ có chu kì $T_1 = 1{,}2\\text{ s}$, con lắc $l_2$ có chu kì $T_2 = 1{,}6\\text{ s}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p14-a",
                  "statement": "a) Con lắc có chiều dài $l = l_1 + l_2$ có chu kì là 2,0 s.",
                  "isTrue": true,
                  "explain": "T = √(T₁² + T₂²) = √(1,2² + 1,6²) = 2,0 s. Đúng."
                },
                {
                  "id": "tf-p14-b",
                  "statement": "b) Con lắc có chiều dài $l = l_2 - l_1$ có chu kì là 0,4 s.",
                  "isTrue": false,
                  "explain": "T = √(T₂² - T₁²) = √(1,6² - 1,2²) ≈ 1,06 s != 0,4 s. Sai."
                },
                {
                  "id": "tf-p14-c",
                  "statement": "c) Nếu tăng khối lượng con lắc $l_1$ lên 2 lần thì chu kì của nó vẫn là 1,2 s.",
                  "isTrue": true,
                  "explain": "Chu kì con lắc đơn không phụ thuộc khối lượng. Đúng."
                },
                {
                  "id": "tf-p14-d",
                  "statement": "d) Đưa con lắc lên núi cao thì chu kì của nó giảm đi.",
                  "isTrue": false,
                  "explain": "Lên cao gia tốc g giảm -> T tăng. Sai."
                }
              ]
            },
            {
              "id": "q-p14-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Con lắc lò xo dao động với biên độ $A = 8\\text{ cm}$. Tại vị trí thế năng bằng 3 lần động năng thì li độ của vật có độ lớn là bao nhiêu cm (làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "6.9",
              "unit": "cm",
              "solution": "W_t = 3W_d -> W = 4/3 W_t -> 0,5 k A² = 4/3 * 0,5 k x² -> |x| = A * √(3/4) = 8 * (√3 / 2) = 4√3 ≈ 6,93 ≈ 6,9 cm.",
              "trapAlert": "Nhầm giữa thế năng bằng 3 lần động năng với động năng bằng 3 lần thế năng."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        }
      ]
    },
    {
      "chapterId": "ly-c2-song",
      "chapterNum": "04",
      "chapterName": "Sóng cơ và Sóng ánh sáng",
      "lessons": [
        {
          "id": "ly-song-co-giao-thoa-song",
          "title": "Sóng cơ, Bước sóng & Giao thoa sóng nước",
          "questionsCount": 30,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Sóng cơ và Bước sóng lambda",
              "desc": "Sóng cơ là sự lan truyền dao động cơ trong môi trường vật chất. Bước sóng $\\lambda$ là quãng đường sóng truyền đi trong 1 chu kì: $\\lambda = v \\cdot T = \\frac{v}{f}$."
            },
            {
              "title": "Giao thoa hai sóng kết hợp",
              "desc": "Hai nguồn cùng pha: Cực đại giao thoa: $d_2 - d_1 = k\\lambda$. Cực tiểu giao thoa: $d_2 - d_1 = (k + 0{,}5)\\lambda$. Khoảng cách giữa 2 cực đại liên tiếp trên đường nối nguồn là $\\lambda / 2$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tìm bước sóng lambda",
              "instruction": "$\\lambda = v / f$."
            },
            {
              "step": 2,
              "title": "Tìm số cực đại trên đoạn thẳng nối 2 nguồn",
              "instruction": "Giải bất phương trình: $-S_1S_2 < k\\lambda < S_1S_2 \\implies -\\frac{S_1S_2}{\\lambda} < k < \\frac{S_1S_2}{\\lambda}$."
            }
          ],
          "formulas": [
            {
              "label": "Hệ thức bước sóng",
              "formula": "\\lambda = vT = \\frac{v}{f}",
              "displayLatex": "\\lambda = vT = \\frac{v}{f}",
              "notes": "v là tốc độ truyền sóng (phụ thuộc bản chất môi trường)."
            },
            {
              "label": "Điều kiện cực đại giao thoa (cùng pha)",
              "formula": "d_2 - d_1 = k\\lambda, \\quad k \\in \\mathbb{Z}",
              "displayLatex": "d_2 - d_1 = k\\lambda",
              "notes": "k = 0 là vân cực đại trung tâm."
            },
            {
              "label": "Điều kiện cực tiểu giao thoa (cùng pha)",
              "formula": "d_2 - d_1 = (k + 0{,}5)\\lambda, \\quad k \\in \\mathbb{Z}",
              "displayLatex": "d_2 - d_1 = (k + 0{,}5)\\lambda",
              "notes": "Triệt tiêu dao động hoàn toàn."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm khoảng cách 2 cực đại liên tiếp là lambda thay vì lambda / 2",
              "avoid": "Trên đoạn nối hai nguồn, khoảng cách giữa 2 cực đại liên tiếp chỉ là $\\lambda / 2$."
            },
            {
              "trap": "Nhầm tốc độ truyền sóng với tốc độ dao động của phần tử",
              "avoid": "Tốc độ truyền sóng $v = \\text{const}$, còn tốc độ dao động phần tử biến thiên điều hòa $v_p = \\omega A \\cos(...)$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p15-1",
              "front": "Khoảng cách giữa hai cực đại liên tiếp trên đoạn nối hai nguồn kết hợp cùng pha?",
              "back": "Bằng lambda / 2 (nửa bước sóng)."
            },
            {
              "id": "fc-p15-2",
              "front": "Khi sóng truyền từ không khí vào nước, tần số f có đổi không?",
              "back": "Tần số f KHÔNG ĐỔI, chỉ có bước sóng lambda và vận tốc v thay đổi."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p15-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một sóng cơ lan truyền với tần số $50\\text{ Hz}$, tốc độ truyền sóng $20\\text{ m/s}$. Bước sóng là:",
              "options": [
                "0,4 m",
                "2,5 m",
                "1000 m",
                "40 m"
              ],
              "correct": 0,
              "solution": "lambda = v / f = 20 / 50 = 0,4 m = 40 cm.",
              "trapAlert": "Nhầm lấy f chia v.",
              "fastTip": "20 / 50 = 0,4 m."
            },
            {
              "id": "q-p15-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Hai nguồn kết hợp $S_1, S_2$ trên mặt nước cách nhau 15 cm cùng dao động với tần số 20 Hz, tốc độ truyền sóng 40 cm/s. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p15-a",
                  "statement": "a) Bước sóng của sóng là 2 cm.",
                  "isTrue": true,
                  "explain": "lambda = 40 / 20 = 2 cm. Đúng."
                },
                {
                  "id": "tf-p15-b",
                  "statement": "b) Trung điểm của S₁S₂ là một điểm dao động với biên độ cực đại.",
                  "isTrue": true,
                  "explain": "Hai nguồn cùng pha nên trung điểm d₁ = d₂ là cực đại trung tâm (k = 0). Đúng."
                },
                {
                  "id": "tf-p15-c",
                  "statement": "c) Trên đoạn thẳng S₁S₂ có 15 điểm cực đại giao thoa.",
                  "isTrue": true,
                  "explain": "-15 < 2k < 15 -> -7,5 < k < 7,5 -> k từ -7 đến 7 (15 giá trị). Đúng."
                },
                {
                  "id": "tf-p15-d",
                  "statement": "d) Khoảng cách giữa hai cực tiểu liên tiếp trên đoạn S₁S₂ là 2 cm.",
                  "isTrue": false,
                  "explain": "Khoảng cách giữa hai cực tiểu liên tiếp là lambda/2 = 1 cm != 2 cm. Sai."
                }
              ]
            },
            {
              "id": "q-p15-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Tại điểm M cách 2 nguồn cùng pha những khoảng $d_1 = 18\\text{ cm}, d_2 = 24\\text{ cm}$ có cực đại giao thoa. Giữa M và trung trực của hai nguồn có 2 dãy cực đại khác. Tính bước sóng (đơn vị: cm).",
              "correctAnswer": "2",
              "unit": "cm",
              "solution": "M là cực đại bậc 3: d₂ - d₁ = 3*lambda -> 24 - 18 = 6 = 3*lambda -> lambda = 2 cm.",
              "trapAlert": "Xác định sai bậc của M (giữa M và trung trực có 2 dãy khác nghĩa là M ở vân thứ 3: k = 3)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p15-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một sóng cơ lan truyền với tần số $50\\text{ Hz}$, tốc độ truyền sóng $20\\text{ m/s}$. Bước sóng là:",
              "options": [
                "0,4 m",
                "2,5 m",
                "1000 m",
                "40 m"
              ],
              "correct": 0,
              "solution": "lambda = v / f = 20 / 50 = 0,4 m = 40 cm.",
              "trapAlert": "Nhầm lấy f chia v.",
              "fastTip": "20 / 50 = 0,4 m."
            },
            {
              "id": "q-p15-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Hai nguồn kết hợp $S_1, S_2$ trên mặt nước cách nhau 15 cm cùng dao động với tần số 20 Hz, tốc độ truyền sóng 40 cm/s. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p15-a",
                  "statement": "a) Bước sóng của sóng là 2 cm.",
                  "isTrue": true,
                  "explain": "lambda = 40 / 20 = 2 cm. Đúng."
                },
                {
                  "id": "tf-p15-b",
                  "statement": "b) Trung điểm của S₁S₂ là một điểm dao động với biên độ cực đại.",
                  "isTrue": true,
                  "explain": "Hai nguồn cùng pha nên trung điểm d₁ = d₂ là cực đại trung tâm (k = 0). Đúng."
                },
                {
                  "id": "tf-p15-c",
                  "statement": "c) Trên đoạn thẳng S₁S₂ có 15 điểm cực đại giao thoa.",
                  "isTrue": true,
                  "explain": "-15 < 2k < 15 -> -7,5 < k < 7,5 -> k từ -7 đến 7 (15 giá trị). Đúng."
                },
                {
                  "id": "tf-p15-d",
                  "statement": "d) Khoảng cách giữa hai cực tiểu liên tiếp trên đoạn S₁S₂ là 2 cm.",
                  "isTrue": false,
                  "explain": "Khoảng cách giữa hai cực tiểu liên tiếp là lambda/2 = 1 cm != 2 cm. Sai."
                }
              ]
            },
            {
              "id": "q-p15-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Tại điểm M cách 2 nguồn cùng pha những khoảng $d_1 = 18\\text{ cm}, d_2 = 24\\text{ cm}$ có cực đại giao thoa. Giữa M và trung trực của hai nguồn có 2 dãy cực đại khác. Tính bước sóng (đơn vị: cm).",
              "correctAnswer": "2",
              "unit": "cm",
              "solution": "M là cực đại bậc 3: d₂ - d₁ = 3*lambda -> 24 - 18 = 6 = 3*lambda -> lambda = 2 cm.",
              "trapAlert": "Xác định sai bậc của M (giữa M và trung trực có 2 dãy khác nghĩa là M ở vân thứ 3: k = 3)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p15-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một sóng cơ lan truyền với tần số $50\\text{ Hz}$, tốc độ truyền sóng $20\\text{ m/s}$. Bước sóng là:",
              "options": [
                "0,4 m",
                "2,5 m",
                "1000 m",
                "40 m"
              ],
              "correct": 0,
              "solution": "lambda = v / f = 20 / 50 = 0,4 m = 40 cm.",
              "trapAlert": "Nhầm lấy f chia v.",
              "fastTip": "20 / 50 = 0,4 m."
            },
            {
              "id": "q-p15-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Hai nguồn kết hợp $S_1, S_2$ trên mặt nước cách nhau 15 cm cùng dao động với tần số 20 Hz, tốc độ truyền sóng 40 cm/s. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p15-a",
                  "statement": "a) Bước sóng của sóng là 2 cm.",
                  "isTrue": true,
                  "explain": "lambda = 40 / 20 = 2 cm. Đúng."
                },
                {
                  "id": "tf-p15-b",
                  "statement": "b) Trung điểm của S₁S₂ là một điểm dao động với biên độ cực đại.",
                  "isTrue": true,
                  "explain": "Hai nguồn cùng pha nên trung điểm d₁ = d₂ là cực đại trung tâm (k = 0). Đúng."
                },
                {
                  "id": "tf-p15-c",
                  "statement": "c) Trên đoạn thẳng S₁S₂ có 15 điểm cực đại giao thoa.",
                  "isTrue": true,
                  "explain": "-15 < 2k < 15 -> -7,5 < k < 7,5 -> k từ -7 đến 7 (15 giá trị). Đúng."
                },
                {
                  "id": "tf-p15-d",
                  "statement": "d) Khoảng cách giữa hai cực tiểu liên tiếp trên đoạn S₁S₂ là 2 cm.",
                  "isTrue": false,
                  "explain": "Khoảng cách giữa hai cực tiểu liên tiếp là lambda/2 = 1 cm != 2 cm. Sai."
                }
              ]
            },
            {
              "id": "q-p15-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Tại điểm M cách 2 nguồn cùng pha những khoảng $d_1 = 18\\text{ cm}, d_2 = 24\\text{ cm}$ có cực đại giao thoa. Giữa M và trung trực của hai nguồn có 2 dãy cực đại khác. Tính bước sóng (đơn vị: cm).",
              "correctAnswer": "2",
              "unit": "cm",
              "solution": "M là cực đại bậc 3: d₂ - d₁ = 3*lambda -> 24 - 18 = 6 = 3*lambda -> lambda = 2 cm.",
              "trapAlert": "Xác định sai bậc của M (giữa M và trung trực có 2 dãy khác nghĩa là M ở vân thứ 3: k = 3)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-song-anh-sang-giao-thoa-khe-young",
          "title": "Giao thoa sóng ánh sáng qua khe Young",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Thí nghiệm Young về giao thoa ánh sáng",
              "desc": "Chứng minh ánh sáng có tính chất sóng. Hai khe hẹp đóng vai trò hai nguồn sáng kết hợp phát ra từ cùng một nguồn mẹ."
            },
            {
              "title": "Khoảng vân i",
              "desc": "Khoảng cách giữa hai vân sáng liên tiếp (hoặc hai vân tối liên tiếp): $i = \\frac{\\lambda D}{a}$. Trong đó a là khoảng cách 2 khe, D là khoảng cách từ 2 khe đến màn."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Quy đổi đơn vị chuẩn",
              "instruction": "$a$ (mm), $D$ (m), $\\lambda$ ($\\mu$m) $\\implies i = \\lambda D / a$ (mm)."
            },
            {
              "step": 2,
              "title": "Tìm vị trí và số vân trên trường giao thoa L",
              "instruction": "Số vân sáng: $N_s = 2[\\frac{L}{2i}] + 1$."
            }
          ],
          "formulas": [
            {
              "label": "Khoảng vân",
              "formula": "i = \\frac{\\lambda D}{a}",
              "displayLatex": "i = \\frac{\\lambda D}{a}",
              "notes": "lambda tính bằng micro-mét (um), D (m), a (mm) thì i ra mm."
            },
            {
              "label": "Vị trí vân sáng và vân tối",
              "formula": "x_s = k \\cdot i, \\quad x_t = (k + 0{,}5) \\cdot i",
              "displayLatex": "x_s = k \\cdot i, \\quad x_t = (k + 0{,}5) \\cdot i",
              "notes": "k là bậc giao thoa (k = 0 là vân sáng trung tâm)."
            }
          ],
          "traps": [
            {
              "trap": "Quên đồng bộ thứ nguyên đơn vị",
              "avoid": "Giữ công thức tiện lợi: $\\lambda(\\mu\\text{m}) \\times D(\\text{m}) / a(\\text{mm}) = i(\\text{mm})$."
            },
            {
              "trap": "Nhầm vân tối thứ 3 có k = 3",
              "avoid": "Vân tối thứ 3 có $k = 2$ ($x = 2{,}5i$)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p16-1",
              "front": "Khoảng vân i phụ thuộc thế nào vào khoảng cách hai khe a?",
              "back": "Tỉ lệ nghịch với a: a càng lớn thì khoảng vân i càng hẹp lại."
            },
            {
              "id": "fc-p16-2",
              "front": "Thí nghiệm giao thoa ánh sáng khẳng định ánh sáng có tính chất gì?",
              "back": "Khẳng định ánh sáng có bản chất sóng."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p16-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong thí nghiệm Young, $a = 1\\text{ mm}, D = 2\\text{ m}, \\lambda = 0{,}5\\text{ }\\mu\\text{m}$. Khoảng vân giao thoa trên màn là:",
              "options": [
                "1 mm",
                "0,5 mm",
                "2 mm",
                "1,5 mm"
              ],
              "correct": 0,
              "solution": "i = (lambda * D) / a = (0,5 * 2) / 1 = 1 mm.",
              "trapAlert": "Nhầm lẫn số mũ khi đổi đơn vị.",
              "fastTip": "0,5 * 2 / 1 = 1 mm."
            },
            {
              "id": "q-p16-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thí nghiệm Young với ánh sáng đơn sắc có bước sóng 600 nm, $a = 0{,}8\\text{ mm}, D = 1{,}6\\text{ m}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p16-a",
                  "statement": "a) Khoảng vân giao thoa là 1,2 mm.",
                  "isTrue": true,
                  "explain": "i = 0,6 * 1,6 / 0,8 = 1,2 mm. Đúng."
                },
                {
                  "id": "tf-p16-b",
                  "statement": "b) Khoảng cách từ vân sáng bậc 4 đến vân trung tâm là 4,8 mm.",
                  "isTrue": true,
                  "explain": "x = 4 * 1,2 = 4,8 mm. Đúng."
                },
                {
                  "id": "tf-p16-c",
                  "statement": "c) Vân tối thứ 3 cách vân trung tâm 3,6 mm.",
                  "isTrue": false,
                  "explain": "x_t3 = 2,5 * 1,2 = 3,0 mm != 3,6 mm. Sai."
                },
                {
                  "id": "tf-p16-d",
                  "statement": "d) Khi đưa toàn bộ hệ thống vào nước thì khoảng vân i sẽ giảm đi.",
                  "isTrue": true,
                  "explain": "Trong nước lambda giảm -> i giảm. Đúng."
                }
              ]
            },
            {
              "id": "q-p16-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trên màn quan sát, người ta đo được khoảng cách giữa 6 vân sáng liên tiếp là $6\\text{ mm}$. Khoảng cách giữa vân sáng bậc 2 và vân tối thứ 4 ở cùng một phía so với vân trung tâm là bao nhiêu mm (ghi số thập phân)?",
              "correctAnswer": "1.8",
              "unit": "mm",
              "solution": "6 vân sáng liên tiếp có 5 khoảng vân: 5i = 6 mm -> i = 1,2 mm. Vân sáng bậc 2: x_s2 = 2i = 2,4 mm. Vân tối thứ 4: x_t4 = 3,5i = 4,2 mm. Khoảng cách: Delta_x = 4,2 - 2,4 = 1,8 mm.",
              "trapAlert": "Nhầm 6 vân sáng có 6 khoảng vân (phải là 5 khoảng vân)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p16-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong thí nghiệm Young, $a = 1\\text{ mm}, D = 2\\text{ m}, \\lambda = 0{,}5\\text{ }\\mu\\text{m}$. Khoảng vân giao thoa trên màn là:",
              "options": [
                "1 mm",
                "0,5 mm",
                "2 mm",
                "1,5 mm"
              ],
              "correct": 0,
              "solution": "i = (lambda * D) / a = (0,5 * 2) / 1 = 1 mm.",
              "trapAlert": "Nhầm lẫn số mũ khi đổi đơn vị.",
              "fastTip": "0,5 * 2 / 1 = 1 mm."
            },
            {
              "id": "q-p16-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thí nghiệm Young với ánh sáng đơn sắc có bước sóng 600 nm, $a = 0{,}8\\text{ mm}, D = 1{,}6\\text{ m}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p16-a",
                  "statement": "a) Khoảng vân giao thoa là 1,2 mm.",
                  "isTrue": true,
                  "explain": "i = 0,6 * 1,6 / 0,8 = 1,2 mm. Đúng."
                },
                {
                  "id": "tf-p16-b",
                  "statement": "b) Khoảng cách từ vân sáng bậc 4 đến vân trung tâm là 4,8 mm.",
                  "isTrue": true,
                  "explain": "x = 4 * 1,2 = 4,8 mm. Đúng."
                },
                {
                  "id": "tf-p16-c",
                  "statement": "c) Vân tối thứ 3 cách vân trung tâm 3,6 mm.",
                  "isTrue": false,
                  "explain": "x_t3 = 2,5 * 1,2 = 3,0 mm != 3,6 mm. Sai."
                },
                {
                  "id": "tf-p16-d",
                  "statement": "d) Khi đưa toàn bộ hệ thống vào nước thì khoảng vân i sẽ giảm đi.",
                  "isTrue": true,
                  "explain": "Trong nước lambda giảm -> i giảm. Đúng."
                }
              ]
            },
            {
              "id": "q-p16-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trên màn quan sát, người ta đo được khoảng cách giữa 6 vân sáng liên tiếp là $6\\text{ mm}$. Khoảng cách giữa vân sáng bậc 2 và vân tối thứ 4 ở cùng một phía so với vân trung tâm là bao nhiêu mm (ghi số thập phân)?",
              "correctAnswer": "1.8",
              "unit": "mm",
              "solution": "6 vân sáng liên tiếp có 5 khoảng vân: 5i = 6 mm -> i = 1,2 mm. Vân sáng bậc 2: x_s2 = 2i = 2,4 mm. Vân tối thứ 4: x_t4 = 3,5i = 4,2 mm. Khoảng cách: Delta_x = 4,2 - 2,4 = 1,8 mm.",
              "trapAlert": "Nhầm 6 vân sáng có 6 khoảng vân (phải là 5 khoảng vân)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p16-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong thí nghiệm Young, $a = 1\\text{ mm}, D = 2\\text{ m}, \\lambda = 0{,}5\\text{ }\\mu\\text{m}$. Khoảng vân giao thoa trên màn là:",
              "options": [
                "1 mm",
                "0,5 mm",
                "2 mm",
                "1,5 mm"
              ],
              "correct": 0,
              "solution": "i = (lambda * D) / a = (0,5 * 2) / 1 = 1 mm.",
              "trapAlert": "Nhầm lẫn số mũ khi đổi đơn vị.",
              "fastTip": "0,5 * 2 / 1 = 1 mm."
            },
            {
              "id": "q-p16-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thí nghiệm Young với ánh sáng đơn sắc có bước sóng 600 nm, $a = 0{,}8\\text{ mm}, D = 1{,}6\\text{ m}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p16-a",
                  "statement": "a) Khoảng vân giao thoa là 1,2 mm.",
                  "isTrue": true,
                  "explain": "i = 0,6 * 1,6 / 0,8 = 1,2 mm. Đúng."
                },
                {
                  "id": "tf-p16-b",
                  "statement": "b) Khoảng cách từ vân sáng bậc 4 đến vân trung tâm là 4,8 mm.",
                  "isTrue": true,
                  "explain": "x = 4 * 1,2 = 4,8 mm. Đúng."
                },
                {
                  "id": "tf-p16-c",
                  "statement": "c) Vân tối thứ 3 cách vân trung tâm 3,6 mm.",
                  "isTrue": false,
                  "explain": "x_t3 = 2,5 * 1,2 = 3,0 mm != 3,6 mm. Sai."
                },
                {
                  "id": "tf-p16-d",
                  "statement": "d) Khi đưa toàn bộ hệ thống vào nước thì khoảng vân i sẽ giảm đi.",
                  "isTrue": true,
                  "explain": "Trong nước lambda giảm -> i giảm. Đúng."
                }
              ]
            },
            {
              "id": "q-p16-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trên màn quan sát, người ta đo được khoảng cách giữa 6 vân sáng liên tiếp là $6\\text{ mm}$. Khoảng cách giữa vân sáng bậc 2 và vân tối thứ 4 ở cùng một phía so với vân trung tâm là bao nhiêu mm (ghi số thập phân)?",
              "correctAnswer": "1.8",
              "unit": "mm",
              "solution": "6 vân sáng liên tiếp có 5 khoảng vân: 5i = 6 mm -> i = 1,2 mm. Vân sáng bậc 2: x_s2 = 2i = 2,4 mm. Vân tối thứ 4: x_t4 = 3,5i = 4,2 mm. Khoảng cách: Delta_x = 4,2 - 2,4 = 1,8 mm.",
              "trapAlert": "Nhầm 6 vân sáng có 6 khoảng vân (phải là 5 khoảng vân)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        }
      ]
    },
    {
      "chapterId": "ly-c3-dientruong",
      "chapterNum": "05",
      "chapterName": "Điện trường & Dòng điện không đổi",
      "lessons": [
        {
          "id": "ly-dien-tich-dinh-luat-coulomb",
          "title": "Điện tích, Định luật Coulomb, Cường độ điện trường & Điện thế",
          "questionsCount": 26,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Định luật Coulomb",
              "desc": "Lực tương tác tĩnh điện giữa hai điện tích điểm đặt trong chân không tỉ lệ thuận với tích độ lớn của chúng và tỉ lệ nghịch với bình phương khoảng cách: $F = k \\frac{|q_1 q_2|}{r^2}$ với $k = 9 \\times 10^9\\text{ N}\\cdot\\text{m}^2/\\text{C}^2$."
            },
            {
              "title": "Cường độ điện trường E và Điện thế V",
              "desc": "Điện trường do điện tích Q gây ra: $E = k \\frac{|Q|}{r^2}$. Điện thế $V_M = \\frac{A_{M\\infty}}{q}$. Công của lực điện trường không phụ thuộc hình dạng đường đi: $A = qEd = q(V_M - V_N)$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định phương chiều lực tương tác",
              "instruction": "Hai điện tích cùng dấu thì đẩy nhau, trái dấu thì hút nhau."
            },
            {
              "step": 2,
              "title": "Tổng hợp vectơ điện trường",
              "instruction": "$\\vec{E} = \\vec{E}_1 + \\vec{E}_2$ theo quy tắc hình bình hành."
            }
          ],
          "formulas": [
            {
              "label": "Định luật Coulomb trong chân không",
              "formula": "F = k \\frac{|q_1 q_2|}{r^2}",
              "displayLatex": "F = k \\frac{|q_1 q_2|}{r^2}",
              "notes": "k = 9*10^9 N.m²/C², r tính bằng mét (m)."
            },
            {
              "label": "Cường độ điện trường của điện tích điểm",
              "formula": "E = k \\frac{|Q|}{r^2}",
              "displayLatex": "E = k \\frac{|Q|}{r^2}",
              "notes": "Hướng ra xa nếu Q > 0, hướng lại gần nếu Q < 0."
            },
            {
              "label": "Công của lực điện trường",
              "formula": "A_{MN} = q U_{MN} = q E d",
              "displayLatex": "A_{MN} = q U_{MN} = q E d",
              "notes": "d là hình chiếu của đường đi MN lên phương đường sức."
            }
          ],
          "traps": [
            {
              "trap": "Quên đổi khoảng cách r ra mét (m)",
              "avoid": "Đề bài hay cho r = 3 cm, bắt buộc phải đổi $r = 0{,}03\\text{ m}$."
            },
            {
              "trap": "Quên dấu của điện tích khi tính công A = qU",
              "avoid": "Electron có $q = -1{,}6 \\times 10^{-19}\\text{ C}$, mang dấu âm!"
            }
          ],
          "flashcards": [
            {
              "id": "fc-p17-1",
              "front": "Tăng khoảng cách giữa hai điện tích lên 3 lần thì lực Coulomb thay đổi thế nào?",
              "back": "Giảm đi 9 lần (vì F tỉ lệ nghịch với r²)."
            },
            {
              "id": "fc-p17-2",
              "front": "Công của lực điện trường có phụ thuộc hình dạng đường đi không?",
              "back": "Không phụ thuộc hình dạng đường đi, chỉ phụ thuộc vị trí điểm đầu và điểm cuối."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p17-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Hai điện tích điểm $q_1 = 2 \\times 10^{-8}\\text{ C}$ và $q_2 = -2 \\times 10^{-8}\\text{ C}$ đặt cách nhau 3 cm trong chân không. Lực tương tác giữa chúng là:",
              "options": [
                "Hút nhau 4*10^-3 N",
                "Đẩy nhau 4*10^-3 N",
                "Hút nhau 4*10^-5 N",
                "Đẩy nhau 4*10^-5 N"
              ],
              "correct": 0,
              "solution": "Trái dấu nên hút nhau. F = 9*10^9 * (4*10^-16) / 0,03² = 3,6*10^-6 / 9*10^-4 = 4*10^-3 N.",
              "trapAlert": "Không đổi 3 cm ra 0,03 m.",
              "fastTip": "Trái dấu -> HÚT NHAU."
            },
            {
              "id": "q-p17-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Điện tích $q = 10^{-6}\\text{ C}$ dịch chuyển từ điểm M đến điểm N trong điện trường đều có hiệu điện thế $U_{MN} = 200\\text{ V}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p17-a",
                  "statement": "a) Điện thế tại M cao hơn điện thế tại N là 200 V.",
                  "isTrue": true,
                  "explain": "U_MN = V_M - V_N = 200 V. Đúng."
                },
                {
                  "id": "tf-p17-b",
                  "statement": "b) Công của lực điện làm dịch chuyển điện tích là 0,2 mJ.",
                  "isTrue": true,
                  "explain": "A = q*U = 10^-6 * 200 = 2*10^-4 J = 0,2 mJ. Đúng."
                },
                {
                  "id": "tf-p17-c",
                  "statement": "c) Nếu một electron chuyển động từ N đến M thì lực điện sinh công dương.",
                  "isTrue": true,
                  "explain": "A = (-e)*(V_N - V_M) = (-e)*(-200) = 200e > 0. Đúng."
                },
                {
                  "id": "tf-p17-d",
                  "statement": "d) Đường sức điện trường hướng từ nơi điện thế thấp sang nơi điện thế cao.",
                  "isTrue": false,
                  "explain": "Đường sức luôn hướng từ nơi điện thế cao về nơi điện thế thấp. Sai."
                }
              ]
            },
            {
              "id": "q-p17-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cường độ điện trường do điện tích điểm $Q = 4 \\times 10^{-8}\\text{ C}$ gây ra tại điểm cách nó 20 cm trong chân không là bao nhiêu V/m?",
              "correctAnswer": "9000",
              "unit": "V/m",
              "solution": "E = k * |Q| / r² = 9*10^9 * 4*10^-8 / 0,2² = 360 / 0,04 = 9000 V/m.",
              "trapAlert": "Quên bình phương khoảng cách r = 0,2 m."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p17-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Hai điện tích điểm $q_1 = 2 \\times 10^{-8}\\text{ C}$ và $q_2 = -2 \\times 10^{-8}\\text{ C}$ đặt cách nhau 3 cm trong chân không. Lực tương tác giữa chúng là:",
              "options": [
                "Hút nhau 4*10^-3 N",
                "Đẩy nhau 4*10^-3 N",
                "Hút nhau 4*10^-5 N",
                "Đẩy nhau 4*10^-5 N"
              ],
              "correct": 0,
              "solution": "Trái dấu nên hút nhau. F = 9*10^9 * (4*10^-16) / 0,03² = 3,6*10^-6 / 9*10^-4 = 4*10^-3 N.",
              "trapAlert": "Không đổi 3 cm ra 0,03 m.",
              "fastTip": "Trái dấu -> HÚT NHAU."
            },
            {
              "id": "q-p17-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Điện tích $q = 10^{-6}\\text{ C}$ dịch chuyển từ điểm M đến điểm N trong điện trường đều có hiệu điện thế $U_{MN} = 200\\text{ V}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p17-a",
                  "statement": "a) Điện thế tại M cao hơn điện thế tại N là 200 V.",
                  "isTrue": true,
                  "explain": "U_MN = V_M - V_N = 200 V. Đúng."
                },
                {
                  "id": "tf-p17-b",
                  "statement": "b) Công của lực điện làm dịch chuyển điện tích là 0,2 mJ.",
                  "isTrue": true,
                  "explain": "A = q*U = 10^-6 * 200 = 2*10^-4 J = 0,2 mJ. Đúng."
                },
                {
                  "id": "tf-p17-c",
                  "statement": "c) Nếu một electron chuyển động từ N đến M thì lực điện sinh công dương.",
                  "isTrue": true,
                  "explain": "A = (-e)*(V_N - V_M) = (-e)*(-200) = 200e > 0. Đúng."
                },
                {
                  "id": "tf-p17-d",
                  "statement": "d) Đường sức điện trường hướng từ nơi điện thế thấp sang nơi điện thế cao.",
                  "isTrue": false,
                  "explain": "Đường sức luôn hướng từ nơi điện thế cao về nơi điện thế thấp. Sai."
                }
              ]
            },
            {
              "id": "q-p17-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cường độ điện trường do điện tích điểm $Q = 4 \\times 10^{-8}\\text{ C}$ gây ra tại điểm cách nó 20 cm trong chân không là bao nhiêu V/m?",
              "correctAnswer": "9000",
              "unit": "V/m",
              "solution": "E = k * |Q| / r² = 9*10^9 * 4*10^-8 / 0,2² = 360 / 0,04 = 9000 V/m.",
              "trapAlert": "Quên bình phương khoảng cách r = 0,2 m."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p17-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Hai điện tích điểm $q_1 = 2 \\times 10^{-8}\\text{ C}$ và $q_2 = -2 \\times 10^{-8}\\text{ C}$ đặt cách nhau 3 cm trong chân không. Lực tương tác giữa chúng là:",
              "options": [
                "Hút nhau 4*10^-3 N",
                "Đẩy nhau 4*10^-3 N",
                "Hút nhau 4*10^-5 N",
                "Đẩy nhau 4*10^-5 N"
              ],
              "correct": 0,
              "solution": "Trái dấu nên hút nhau. F = 9*10^9 * (4*10^-16) / 0,03² = 3,6*10^-6 / 9*10^-4 = 4*10^-3 N.",
              "trapAlert": "Không đổi 3 cm ra 0,03 m.",
              "fastTip": "Trái dấu -> HÚT NHAU."
            },
            {
              "id": "q-p17-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Điện tích $q = 10^{-6}\\text{ C}$ dịch chuyển từ điểm M đến điểm N trong điện trường đều có hiệu điện thế $U_{MN} = 200\\text{ V}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p17-a",
                  "statement": "a) Điện thế tại M cao hơn điện thế tại N là 200 V.",
                  "isTrue": true,
                  "explain": "U_MN = V_M - V_N = 200 V. Đúng."
                },
                {
                  "id": "tf-p17-b",
                  "statement": "b) Công của lực điện làm dịch chuyển điện tích là 0,2 mJ.",
                  "isTrue": true,
                  "explain": "A = q*U = 10^-6 * 200 = 2*10^-4 J = 0,2 mJ. Đúng."
                },
                {
                  "id": "tf-p17-c",
                  "statement": "c) Nếu một electron chuyển động từ N đến M thì lực điện sinh công dương.",
                  "isTrue": true,
                  "explain": "A = (-e)*(V_N - V_M) = (-e)*(-200) = 200e > 0. Đúng."
                },
                {
                  "id": "tf-p17-d",
                  "statement": "d) Đường sức điện trường hướng từ nơi điện thế thấp sang nơi điện thế cao.",
                  "isTrue": false,
                  "explain": "Đường sức luôn hướng từ nơi điện thế cao về nơi điện thế thấp. Sai."
                }
              ]
            },
            {
              "id": "q-p17-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cường độ điện trường do điện tích điểm $Q = 4 \\times 10^{-8}\\text{ C}$ gây ra tại điểm cách nó 20 cm trong chân không là bao nhiêu V/m?",
              "correctAnswer": "9000",
              "unit": "V/m",
              "solution": "E = k * |Q| / r² = 9*10^9 * 4*10^-8 / 0,2² = 360 / 0,04 = 9000 V/m.",
              "trapAlert": "Quên bình phương khoảng cách r = 0,2 m."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        }
      ]
    },
    {
      "chapterId": "ly-c1-nhiet",
      "chapterNum": "06",
      "chapterName": "Vật lý nhiệt & Khí lý tưởng",
      "lessons": [
        {
          "id": "ly-thuyet-dong-hoc-phan-tu-khi",
          "title": "Thuyết động học phân tử & Khí lí tưởng",
          "questionsCount": 30,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Mô hình khí lí tưởng",
              "desc": "Các phân tử khí được coi là các chất điểm, chỉ tương tác với nhau khi va chạm đàn hồi. Khoảng cách giữa các phân tử rất lớn so với kích thước của chúng."
            },
            {
              "title": "Phương trình trạng thái khí lí tưởng",
              "desc": "Phương trình Clapeyron - Mendeleev: $pV = nRT = \\frac{m}{M}RT$. Các định luật thực nghiệm: Boyle ($T = \\text{const} \\implies pV = \\text{const}$), Charles ($p = \\text{const} \\implies \\frac{V}{T} = \\text{const}$)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Đổi nhiệt độ sang Kelvin",
              "instruction": "$T(K) = t(^\\circ\\text{C}) + 273$. Bắt buộc dùng Kelvin trong mọi công thức khí!"
            },
            {
              "step": 2,
              "title": "Lập phương trình trạng thái",
              "instruction": "$\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}$."
            }
          ],
          "formulas": [
            {
              "label": "Phương trình trạng thái Clapeyron - Mendeleev",
              "formula": "pV = nRT = \\frac{m}{M}RT",
              "displayLatex": "pV = nRT",
              "notes": "R = 8,31 J/(mol.K), T là nhiệt độ Kelvin (K = °C + 273)."
            },
            {
              "label": "Định luật Boyle (Đẳng nhiệt)",
              "formula": "p_1 V_1 = p_2 V_2",
              "displayLatex": "p_1 V_1 = p_2 V_2",
              "notes": "Nhiệt độ T không đổi."
            },
            {
              "label": "Định luật Charles (Đẳng áp)",
              "formula": "\\frac{V_1}{T_1} = \\frac{V_2}{T_2}",
              "displayLatex": "\\frac{V_1}{T_1} = \\frac{V_2}{T_2}",
              "notes": "Áp suất p không đổi."
            }
          ],
          "traps": [
            {
              "trap": "Quên đổi độ C sang độ Kelvin",
              "avoid": "Tính theo độ C là sai hoàn toàn! Bắt buộc $T = t + 273$."
            },
            {
              "trap": "Nhầm đẳng nhiệt là p tỉ lệ thuận với V",
              "avoid": "Đẳng nhiệt thì áp suất TỈ LỆ NGHỊCH với thể tích ($p \\sim 1/V$)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p18-1",
              "front": "Hằng số khí lí tưởng R có giá trị xấp xỉ bao nhiêu?",
              "back": "R ≈ 8,31 J/(mol.K)."
            },
            {
              "id": "fc-p18-2",
              "front": "Khi nén khí đẳng nhiệt, áp suất thay đổi thế nào khi thể tích giảm 2 lần?",
              "back": "Áp suất tăng lên 2 lần (p tỉ lệ nghịch với V)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p18-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nén đẳng nhiệt một khối khí lí tưởng có thể tích từ 10 lít xuống còn 4 lít. Biết áp suất ban đầu là 2 atm. Áp suất sau khi nén là:",
              "options": [
                "5 atm",
                "0,8 atm",
                "8 atm",
                "2,5 atm"
              ],
              "correct": 0,
              "solution": "p₁V₁ = p₂V₂ -> p₂ = (2 * 10) / 4 = 5 atm.",
              "trapAlert": "Nhầm tỉ lệ thuận.",
              "fastTip": "10 / 4 = 2,5 -> áp suất tăng 2,5 lần: 2 * 2,5 = 5 atm."
            },
            {
              "id": "q-p18-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một lượng khí trong bình kín có thể tích không đổi ở $27^\\circ\\text{C}$ có áp suất 1,5 atm. Đun nóng bình đến $127^\\circ\\text{C}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p18-a",
                  "statement": "a) Nhiệt độ ban đầu của khối khí là 300 K.",
                  "isTrue": true,
                  "explain": "T₁ = 27 + 273 = 300 K. Đúng."
                },
                {
                  "id": "tf-p18-b",
                  "statement": "b) Nhiệt độ sau khi nung là 400 K.",
                  "isTrue": true,
                  "explain": "T₂ = 127 + 273 = 400 K. Đúng."
                },
                {
                  "id": "tf-p18-c",
                  "statement": "c) Áp suất sau khi nung nóng là 2,0 atm.",
                  "isTrue": true,
                  "explain": "p₂ = p₁ * (T₂ / T₁) = 1,5 * (400 / 300) = 2,0 atm. Đúng."
                },
                {
                  "id": "tf-p18-d",
                  "statement": "d) Quá trình trên là quá trình đẳng áp.",
                  "isTrue": false,
                  "explain": "Thể tích không đổi nên là quá trình đẳng tích. Sai."
                }
              ]
            },
            {
              "id": "q-p18-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một bình dung tích 20 lít chứa $0{,}5\\text{ mol}$ khí lí tưởng ở nhiệt độ $27^\\circ\\text{C}$. Tính áp suất của khí trong bình (đơn vị: kPa, lấy $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$, làm tròn số nguyên).",
              "correctAnswer": "62",
              "unit": "kPa",
              "solution": "T = 300 K. V = 0,02 m³. p = nRT / V = 0,5 * 8,31 * 300 / 0,02 = 1246,5 / 0,02 = 62325 Pa ≈ 62 kPa.",
              "trapAlert": "Không đổi 20 lít ra 0,02 m³."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p18-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nén đẳng nhiệt một khối khí lí tưởng có thể tích từ 10 lít xuống còn 4 lít. Biết áp suất ban đầu là 2 atm. Áp suất sau khi nén là:",
              "options": [
                "5 atm",
                "0,8 atm",
                "8 atm",
                "2,5 atm"
              ],
              "correct": 0,
              "solution": "p₁V₁ = p₂V₂ -> p₂ = (2 * 10) / 4 = 5 atm.",
              "trapAlert": "Nhầm tỉ lệ thuận.",
              "fastTip": "10 / 4 = 2,5 -> áp suất tăng 2,5 lần: 2 * 2,5 = 5 atm."
            },
            {
              "id": "q-p18-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một lượng khí trong bình kín có thể tích không đổi ở $27^\\circ\\text{C}$ có áp suất 1,5 atm. Đun nóng bình đến $127^\\circ\\text{C}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p18-a",
                  "statement": "a) Nhiệt độ ban đầu của khối khí là 300 K.",
                  "isTrue": true,
                  "explain": "T₁ = 27 + 273 = 300 K. Đúng."
                },
                {
                  "id": "tf-p18-b",
                  "statement": "b) Nhiệt độ sau khi nung là 400 K.",
                  "isTrue": true,
                  "explain": "T₂ = 127 + 273 = 400 K. Đúng."
                },
                {
                  "id": "tf-p18-c",
                  "statement": "c) Áp suất sau khi nung nóng là 2,0 atm.",
                  "isTrue": true,
                  "explain": "p₂ = p₁ * (T₂ / T₁) = 1,5 * (400 / 300) = 2,0 atm. Đúng."
                },
                {
                  "id": "tf-p18-d",
                  "statement": "d) Quá trình trên là quá trình đẳng áp.",
                  "isTrue": false,
                  "explain": "Thể tích không đổi nên là quá trình đẳng tích. Sai."
                }
              ]
            },
            {
              "id": "q-p18-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một bình dung tích 20 lít chứa $0{,}5\\text{ mol}$ khí lí tưởng ở nhiệt độ $27^\\circ\\text{C}$. Tính áp suất của khí trong bình (đơn vị: kPa, lấy $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$, làm tròn số nguyên).",
              "correctAnswer": "62",
              "unit": "kPa",
              "solution": "T = 300 K. V = 0,02 m³. p = nRT / V = 0,5 * 8,31 * 300 / 0,02 = 1246,5 / 0,02 = 62325 Pa ≈ 62 kPa.",
              "trapAlert": "Không đổi 20 lít ra 0,02 m³."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p18-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nén đẳng nhiệt một khối khí lí tưởng có thể tích từ 10 lít xuống còn 4 lít. Biết áp suất ban đầu là 2 atm. Áp suất sau khi nén là:",
              "options": [
                "5 atm",
                "0,8 atm",
                "8 atm",
                "2,5 atm"
              ],
              "correct": 0,
              "solution": "p₁V₁ = p₂V₂ -> p₂ = (2 * 10) / 4 = 5 atm.",
              "trapAlert": "Nhầm tỉ lệ thuận.",
              "fastTip": "10 / 4 = 2,5 -> áp suất tăng 2,5 lần: 2 * 2,5 = 5 atm."
            },
            {
              "id": "q-p18-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một lượng khí trong bình kín có thể tích không đổi ở $27^\\circ\\text{C}$ có áp suất 1,5 atm. Đun nóng bình đến $127^\\circ\\text{C}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p18-a",
                  "statement": "a) Nhiệt độ ban đầu của khối khí là 300 K.",
                  "isTrue": true,
                  "explain": "T₁ = 27 + 273 = 300 K. Đúng."
                },
                {
                  "id": "tf-p18-b",
                  "statement": "b) Nhiệt độ sau khi nung là 400 K.",
                  "isTrue": true,
                  "explain": "T₂ = 127 + 273 = 400 K. Đúng."
                },
                {
                  "id": "tf-p18-c",
                  "statement": "c) Áp suất sau khi nung nóng là 2,0 atm.",
                  "isTrue": true,
                  "explain": "p₂ = p₁ * (T₂ / T₁) = 1,5 * (400 / 300) = 2,0 atm. Đúng."
                },
                {
                  "id": "tf-p18-d",
                  "statement": "d) Quá trình trên là quá trình đẳng áp.",
                  "isTrue": false,
                  "explain": "Thể tích không đổi nên là quá trình đẳng tích. Sai."
                }
              ]
            },
            {
              "id": "q-p18-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "HSA & TSA",
              "prompt": "Một bình dung tích 20 lít chứa $0{,}5\\text{ mol}$ khí lí tưởng ở nhiệt độ $27^\\circ\\text{C}$. Tính áp suất của khí trong bình (đơn vị: kPa, lấy $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$, làm tròn số nguyên).",
              "correctAnswer": "62",
              "unit": "kPa",
              "solution": "T = 300 K. V = 0,02 m³. p = nRT / V = 0,5 * 8,31 * 300 / 0,02 = 1246,5 / 0,02 = 62325 Pa ≈ 62 kPa.",
              "trapAlert": "Không đổi 20 lít ra 0,02 m³."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        },
        {
          "id": "ly-noi-nang-dinh-luat-i-nhiet-dong",
          "title": "Nội năng, Nhiệt lượng & Định luật I Nhiệt động lực học",
          "questionsCount": 26,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Định luật I Nhiệt động lực học",
              "desc": "Độ biến thiên nội năng bằng tổng công và nhiệt lượng mà hệ nhận được: $\\Delta U = A + Q$."
            },
            {
              "title": "Quy ước dấu của A và Q",
              "desc": "$Q > 0$: Hệ nhận nhiệt lượng; $Q < 0$: Hệ truyền nhiệt lượng. $A > 0$: Hệ nhận công (bị nén); $A < 0$: Hệ sinh công (giãn nở)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định dấu của A và Q",
              "instruction": "Nhận thì dương (+), sinh/truyền thì âm (-)."
            },
            {
              "step": 2,
              "title": "Tính độ biến thiên nội năng Delta U",
              "instruction": "$\\Delta U = A + Q$."
            }
          ],
          "formulas": [
            {
              "label": "Định luật I Nhiệt động lực học",
              "formula": "\\Delta U = A + Q",
              "displayLatex": "\\Delta U = A + Q",
              "notes": "Cần chú ý chính xác quy ước dấu của A và Q."
            },
            {
              "label": "Công của khối khí khi giãn nở đẳng áp",
              "formula": "A' = p \\Delta V \\implies A = -p \\Delta V",
              "displayLatex": "A = -p \\Delta V",
              "notes": "Khi dãn nở Delta V > 0 -> khí sinh công nên A < 0."
            },
            {
              "label": "Nhiệt lượng trao đổi",
              "formula": "Q = mc \\Delta t",
              "displayLatex": "Q = mc \\Delta t",
              "notes": "c là nhiệt dung riêng (J/(kg.K))."
            }
          ],
          "traps": [
            {
              "trap": "Sai dấu khi khí sinh công dãn nở",
              "avoid": "Khí giãn nở thì khí sinh công, nhận công âm $A < 0$."
            },
            {
              "trap": "Quên rằng trong chu trình khép kín thì Delta U = 0",
              "avoid": "Trở về trạng thái ban đầu thì nhiệt độ như cũ $\\implies \\Delta U = 0$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p19-1",
              "front": "Quy ước dấu công A trong định luật I nhiệt động lực học?",
              "back": "Hệ nhận công: A > 0. Hệ sinh công (dãn nở): A < 0."
            },
            {
              "id": "fc-p19-2",
              "front": "Trong quá trình đẳng nhiệt của khí lí tưởng, độ biến thiên nội năng bằng mấy?",
              "back": "Delta U = 0 (vì nội năng khí lí tưởng chỉ phụ thuộc nhiệt độ T)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p19-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Người ta truyền cho khối khí trong xilanh một nhiệt lượng 120 J. Khí nở ra sinh công 80 J đẩy pít-tông lên. Độ biến thiên nội năng của khối khí là:",
              "options": [
                "40 J",
                "200 J",
                "-40 J",
                "-200 J"
              ],
              "correct": 0,
              "solution": "Nhận nhiệt: Q = +120 J. Sinh công: A = -80 J. Delta U = Q + A = 120 - 80 = 40 J.",
              "trapAlert": "Cộng 120 + 80 = 200 J do quên dấu âm của công sinh ra.",
              "fastTip": "Nhận 120, tiêu bớt 80 -> còn dư 40 J."
            },
            {
              "id": "q-p19-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nén một khối khí trong xilanh bằng cách thực hiện công 150 J, đồng thời khối khí truyền ra môi trường nhiệt lượng 50 J. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p19-a",
                  "statement": "a) Khối khí nhận công nên A = +150 J.",
                  "isTrue": true,
                  "explain": "Nhận công -> A > 0. Đúng."
                },
                {
                  "id": "tf-p19-b",
                  "statement": "b) Khối khí truyền nhiệt nên Q = -50 J.",
                  "isTrue": true,
                  "explain": "Truyền nhiệt -> Q < 0. Đúng."
                },
                {
                  "id": "tf-p19-c",
                  "statement": "c) Nội năng của khối khí tăng 100 J.",
                  "isTrue": true,
                  "explain": "Delta U = 150 - 50 = +100 J. Đúng."
                },
                {
                  "id": "tf-p19-d",
                  "statement": "d) Trong quá trình đẳng tích thì A luôn khác 0.",
                  "isTrue": false,
                  "explain": "Đẳng tích thì Delta V = 0 nên A = 0. Sai."
                }
              ]
            },
            {
              "id": "q-p19-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng đẳng áp một khối khí ở áp suất $p = 10^5\\text{ Pa}$, thể tích khí tăng từ 4 lít lên 7 lít. Khối khí nhận nhiệt lượng 500 J. Tính độ biến thiên nội năng của khối khí (đơn vị: Joule).",
              "correctAnswer": "200",
              "unit": "J",
              "solution": "Delta V = (7 - 4) lít = 3*10^-3 m³. Công sinh ra: A' = p*Delta V = 10^5 * 3*10^-3 = 300 J -> A = -300 J. Delta U = Q + A = 500 - 300 = 200 J.",
              "trapAlert": "Không đổi lít sang m³ dẫn đến tính sai công A."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p19-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Người ta truyền cho khối khí trong xilanh một nhiệt lượng 120 J. Khí nở ra sinh công 80 J đẩy pít-tông lên. Độ biến thiên nội năng của khối khí là:",
              "options": [
                "40 J",
                "200 J",
                "-40 J",
                "-200 J"
              ],
              "correct": 0,
              "solution": "Nhận nhiệt: Q = +120 J. Sinh công: A = -80 J. Delta U = Q + A = 120 - 80 = 40 J.",
              "trapAlert": "Cộng 120 + 80 = 200 J do quên dấu âm của công sinh ra.",
              "fastTip": "Nhận 120, tiêu bớt 80 -> còn dư 40 J."
            },
            {
              "id": "q-p19-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nén một khối khí trong xilanh bằng cách thực hiện công 150 J, đồng thời khối khí truyền ra môi trường nhiệt lượng 50 J. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p19-a",
                  "statement": "a) Khối khí nhận công nên A = +150 J.",
                  "isTrue": true,
                  "explain": "Nhận công -> A > 0. Đúng."
                },
                {
                  "id": "tf-p19-b",
                  "statement": "b) Khối khí truyền nhiệt nên Q = -50 J.",
                  "isTrue": true,
                  "explain": "Truyền nhiệt -> Q < 0. Đúng."
                },
                {
                  "id": "tf-p19-c",
                  "statement": "c) Nội năng của khối khí tăng 100 J.",
                  "isTrue": true,
                  "explain": "Delta U = 150 - 50 = +100 J. Đúng."
                },
                {
                  "id": "tf-p19-d",
                  "statement": "d) Trong quá trình đẳng tích thì A luôn khác 0.",
                  "isTrue": false,
                  "explain": "Đẳng tích thì Delta V = 0 nên A = 0. Sai."
                }
              ]
            },
            {
              "id": "q-p19-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng đẳng áp một khối khí ở áp suất $p = 10^5\\text{ Pa}$, thể tích khí tăng từ 4 lít lên 7 lít. Khối khí nhận nhiệt lượng 500 J. Tính độ biến thiên nội năng của khối khí (đơn vị: Joule).",
              "correctAnswer": "200",
              "unit": "J",
              "solution": "Delta V = (7 - 4) lít = 3*10^-3 m³. Công sinh ra: A' = p*Delta V = 10^5 * 3*10^-3 = 300 J -> A = -300 J. Delta U = Q + A = 500 - 300 = 200 J.",
              "trapAlert": "Không đổi lít sang m³ dẫn đến tính sai công A."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p19-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Người ta truyền cho khối khí trong xilanh một nhiệt lượng 120 J. Khí nở ra sinh công 80 J đẩy pít-tông lên. Độ biến thiên nội năng của khối khí là:",
              "options": [
                "40 J",
                "200 J",
                "-40 J",
                "-200 J"
              ],
              "correct": 0,
              "solution": "Nhận nhiệt: Q = +120 J. Sinh công: A = -80 J. Delta U = Q + A = 120 - 80 = 40 J.",
              "trapAlert": "Cộng 120 + 80 = 200 J do quên dấu âm của công sinh ra.",
              "fastTip": "Nhận 120, tiêu bớt 80 -> còn dư 40 J."
            },
            {
              "id": "q-p19-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nén một khối khí trong xilanh bằng cách thực hiện công 150 J, đồng thời khối khí truyền ra môi trường nhiệt lượng 50 J. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p19-a",
                  "statement": "a) Khối khí nhận công nên A = +150 J.",
                  "isTrue": true,
                  "explain": "Nhận công -> A > 0. Đúng."
                },
                {
                  "id": "tf-p19-b",
                  "statement": "b) Khối khí truyền nhiệt nên Q = -50 J.",
                  "isTrue": true,
                  "explain": "Truyền nhiệt -> Q < 0. Đúng."
                },
                {
                  "id": "tf-p19-c",
                  "statement": "c) Nội năng của khối khí tăng 100 J.",
                  "isTrue": true,
                  "explain": "Delta U = 150 - 50 = +100 J. Đúng."
                },
                {
                  "id": "tf-p19-d",
                  "statement": "d) Trong quá trình đẳng tích thì A luôn khác 0.",
                  "isTrue": false,
                  "explain": "Đẳng tích thì Delta V = 0 nên A = 0. Sai."
                }
              ]
            },
            {
              "id": "q-p19-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng đẳng áp một khối khí ở áp suất $p = 10^5\\text{ Pa}$, thể tích khí tăng từ 4 lít lên 7 lít. Khối khí nhận nhiệt lượng 500 J. Tính độ biến thiên nội năng của khối khí (đơn vị: Joule).",
              "correctAnswer": "200",
              "unit": "J",
              "solution": "Delta V = (7 - 4) lít = 3*10^-3 m³. Công sinh ra: A' = p*Delta V = 10^5 * 3*10^-3 = 300 J -> A = -300 J. Delta U = Q + A = 500 - 300 = 200 J.",
              "trapAlert": "Không đổi lít sang m³ dẫn đến tính sai công A."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "ly"
        }
      ]
    },
    {
      "chapterId": "ly-c4-tutruong",
      "chapterName": "Từ trường, Cảm ứng điện từ & Dòng điện xoay chiều",
      "grade": 11,
      "lessons": [
        {
          "id": "ly-tu-truong-luc-lorentz",
          "title": "Từ trường, Cảm ứng từ & Lực Lorentz",
          "desc": "Đặc trưng của từ trường, đường sức từ, lực từ tác dụng lên đoạn dây dẫn mang dòng điện và lực Lorentz tác dụng lên hạt mang điện chuyển động.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Lực từ tác dụng lên đoạn dây dẫn mang dòng điện (Ampere)",
              "desc": "Độ lớn $F = B I l \\sin\\alpha$. Phương vuông góc với mặt phẳng chứa dòng điện và đường cảm ứng từ. Chiều xác định theo quy tắc bàn tay trái."
            },
            {
              "title": "Lực Lorentz tác dụng lên hạt mang điện chuyển động",
              "desc": "Độ lớn $f = |q| v B \\sin\\alpha$. Đóng vai trò lực hướng tâm làm hạt chuyển động tròn đều trong từ trường vuông góc: $R = \\frac{mv}{|q|B}$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Áp dụng quy tắc bàn tay trái",
              "instruction": "Từ trường đâm vào lòng bàn tay, chiều từ cổ tay đến ngón tay là chiều v (hoặc dòng điện). Ngón cái choãi 90° chỉ chiều lực (nếu q < 0 thì lực ngược chiều ngón cái)."
            },
            {
              "step": 2,
              "title": "Tính toán độ lớn",
              "instruction": "$F = BIl \\sin\\alpha$ hoặc $f = |q|vB \\sin\\alpha$."
            }
          ],
          "formulas": [
            {
              "label": "Độ lớn lực Ampere",
              "formula": "F = B I l \\sin\\alpha",
              "displayLatex": "F = B I l \\sin\\alpha",
              "notes": "alpha là góc hợp bởi dây dẫn và vectơ B."
            },
            {
              "label": "Độ lớn lực Lorentz",
              "formula": "f = |q| v B \\sin\\alpha",
              "displayLatex": "f = |q| v B \\sin\\alpha",
              "notes": "alpha là góc giữa hướng vận tốc v và B."
            },
            {
              "label": "Bán kính quỹ đạo tròn của hạt trong từ trường",
              "formula": "R = \\frac{mv}{|q|B}",
              "displayLatex": "R = \\frac{mv}{|q|B}",
              "notes": "Áp dụng khi hạt bay vuông góc với từ trường đều."
            }
          ],
          "traps": [
            {
              "trap": "Quên đảo chiều lực Lorentz khi hạt mang điện âm (electron)",
              "avoid": "Khi $q < 0$, lực Lorentz ngược chiều ngón tay cái chỉ."
            },
            {
              "trap": "Lực Lorentz có làm thay đổi động năng hạt không?",
              "avoid": "Lực Lorentz luôn vuông góc với vận tốc nên không sinh công, không làm thay đổi tốc độ hay động năng của hạt."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p20-1",
              "front": "Lực Lorentz có sinh công làm biến đổi tốc độ của hạt không?",
              "back": "Không sinh công vì luôn vuông góc với vectơ vận tốc v."
            },
            {
              "id": "fc-p20-2",
              "front": "Quy tắc bàn tay trái xác định chiều lực từ nào?",
              "back": "Lực từ Ampere tác dụng lên dòng điện và lực Lorentz tác dụng lên điện tích chuyển động."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p20-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đoạn dây dẫn dài 20 cm mang dòng điện 5 A đặt trong từ trường đều $B = 0{,}04\\text{ T}$, vuông góc với các đường sức từ. Lực từ tác dụng lên đoạn dây là:",
              "options": [
                "0,04 N",
                "0,4 N",
                "4 N",
                "0,004 N"
              ],
              "correct": 0,
              "solution": "F = B * I * l * sin(90°) = 0,04 * 5 * 0,2 = 0,04 N.",
              "trapAlert": "Không đổi 20 cm ra 0,2 m.",
              "fastTip": "0,04 * 1 = 0,04 N."
            },
            {
              "id": "q-p20-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một hạt proton ($q = 1{,}6 \\times 10^{-19}\\text{ C}, m = 1{,}67 \\times 10^{-27}\\text{ kg}$) bay với vận tốc $2 \\times 10^6\\text{ m/s}$ vào từ trường đều $B = 0{,}2\\text{ T}$ theo phương vuông góc. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p20-a",
                  "statement": "a) Độ lớn lực Lorentz tác dụng lên proton là 6,4.10^-14 N.",
                  "isTrue": true,
                  "explain": "f = 1,6*10^-19 * 2*10^6 * 0,2 = 6,4*10^-14 N. Đúng."
                },
                {
                  "id": "tf-p20-b",
                  "statement": "b) Quỹ đạo chuyển động của proton trong từ trường là đường tròn.",
                  "isTrue": true,
                  "explain": "Lực Lorentz đóng vai trò lực hướng tâm -> chuyển động tròn đều. Đúng."
                },
                {
                  "id": "tf-p20-c",
                  "statement": "c) Động năng của proton tăng dần khi bay trong từ trường.",
                  "isTrue": false,
                  "explain": "Lực Lorentz vuông góc vận tốc nên không sinh công -> động năng bảo toàn. Sai."
                },
                {
                  "id": "tf-p20-d",
                  "statement": "d) Nếu thay proton bằng electron có cùng vận tốc thì bán kính quỹ đạo sẽ nhỏ hơn rất nhiều.",
                  "isTrue": true,
                  "explain": "Khối lượng electron nhỏ hơn proton ~1836 lần nên R = mv/(qB) nhỏ hơn rất nhiều. Đúng."
                }
              ]
            },
            {
              "id": "q-p20-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một electron ($q = -1{,}6 \\times 10^{-19}\\text{ C}, m = 9{,}1 \\times 10^{-31}\\text{ kg}$) bay vào từ trường đều $B = 10^{-4}\\text{ T}$ theo phương vuông góc với vận tốc $v = 3{,}52 \\times 10^6\\text{ m/s}$. Tính bán kính quỹ đạo tròn của electron (đơn vị: cm, làm tròn số nguyên).",
              "correctAnswer": "20",
              "unit": "cm",
              "solution": "R = m*v / (|q|*B) = (9,1*10^-31 * 3,52*10^6) / (1,6*10^-19 * 10^-4) = 32,032*10^-25 / 1,6*10^-23 = 0,2002 m = 20 cm.",
              "trapAlert": "Nhầm đơn vị mét và cm."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p20-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đoạn dây dẫn dài 20 cm mang dòng điện 5 A đặt trong từ trường đều $B = 0{,}04\\text{ T}$, vuông góc với các đường sức từ. Lực từ tác dụng lên đoạn dây là:",
              "options": [
                "0,04 N",
                "0,4 N",
                "4 N",
                "0,004 N"
              ],
              "correct": 0,
              "solution": "F = B * I * l * sin(90°) = 0,04 * 5 * 0,2 = 0,04 N.",
              "trapAlert": "Không đổi 20 cm ra 0,2 m.",
              "fastTip": "0,04 * 1 = 0,04 N."
            },
            {
              "id": "q-p20-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một hạt proton ($q = 1{,}6 \\times 10^{-19}\\text{ C}, m = 1{,}67 \\times 10^{-27}\\text{ kg}$) bay với vận tốc $2 \\times 10^6\\text{ m/s}$ vào từ trường đều $B = 0{,}2\\text{ T}$ theo phương vuông góc. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p20-a",
                  "statement": "a) Độ lớn lực Lorentz tác dụng lên proton là 6,4.10^-14 N.",
                  "isTrue": true,
                  "explain": "f = 1,6*10^-19 * 2*10^6 * 0,2 = 6,4*10^-14 N. Đúng."
                },
                {
                  "id": "tf-p20-b",
                  "statement": "b) Quỹ đạo chuyển động của proton trong từ trường là đường tròn.",
                  "isTrue": true,
                  "explain": "Lực Lorentz đóng vai trò lực hướng tâm -> chuyển động tròn đều. Đúng."
                },
                {
                  "id": "tf-p20-c",
                  "statement": "c) Động năng của proton tăng dần khi bay trong từ trường.",
                  "isTrue": false,
                  "explain": "Lực Lorentz vuông góc vận tốc nên không sinh công -> động năng bảo toàn. Sai."
                },
                {
                  "id": "tf-p20-d",
                  "statement": "d) Nếu thay proton bằng electron có cùng vận tốc thì bán kính quỹ đạo sẽ nhỏ hơn rất nhiều.",
                  "isTrue": true,
                  "explain": "Khối lượng electron nhỏ hơn proton ~1836 lần nên R = mv/(qB) nhỏ hơn rất nhiều. Đúng."
                }
              ]
            },
            {
              "id": "q-p20-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một electron ($q = -1{,}6 \\times 10^{-19}\\text{ C}, m = 9{,}1 \\times 10^{-31}\\text{ kg}$) bay vào từ trường đều $B = 10^{-4}\\text{ T}$ theo phương vuông góc với vận tốc $v = 3{,}52 \\times 10^6\\text{ m/s}$. Tính bán kính quỹ đạo tròn của electron (đơn vị: cm, làm tròn số nguyên).",
              "correctAnswer": "20",
              "unit": "cm",
              "solution": "R = m*v / (|q|*B) = (9,1*10^-31 * 3,52*10^6) / (1,6*10^-19 * 10^-4) = 32,032*10^-25 / 1,6*10^-23 = 0,2002 m = 20 cm.",
              "trapAlert": "Nhầm đơn vị mét và cm."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p20-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đoạn dây dẫn dài 20 cm mang dòng điện 5 A đặt trong từ trường đều $B = 0{,}04\\text{ T}$, vuông góc với các đường sức từ. Lực từ tác dụng lên đoạn dây là:",
              "options": [
                "0,04 N",
                "0,4 N",
                "4 N",
                "0,004 N"
              ],
              "correct": 0,
              "solution": "F = B * I * l * sin(90°) = 0,04 * 5 * 0,2 = 0,04 N.",
              "trapAlert": "Không đổi 20 cm ra 0,2 m.",
              "fastTip": "0,04 * 1 = 0,04 N."
            },
            {
              "id": "q-p20-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một hạt proton ($q = 1{,}6 \\times 10^{-19}\\text{ C}, m = 1{,}67 \\times 10^{-27}\\text{ kg}$) bay với vận tốc $2 \\times 10^6\\text{ m/s}$ vào từ trường đều $B = 0{,}2\\text{ T}$ theo phương vuông góc. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p20-a",
                  "statement": "a) Độ lớn lực Lorentz tác dụng lên proton là 6,4.10^-14 N.",
                  "isTrue": true,
                  "explain": "f = 1,6*10^-19 * 2*10^6 * 0,2 = 6,4*10^-14 N. Đúng."
                },
                {
                  "id": "tf-p20-b",
                  "statement": "b) Quỹ đạo chuyển động của proton trong từ trường là đường tròn.",
                  "isTrue": true,
                  "explain": "Lực Lorentz đóng vai trò lực hướng tâm -> chuyển động tròn đều. Đúng."
                },
                {
                  "id": "tf-p20-c",
                  "statement": "c) Động năng của proton tăng dần khi bay trong từ trường.",
                  "isTrue": false,
                  "explain": "Lực Lorentz vuông góc vận tốc nên không sinh công -> động năng bảo toàn. Sai."
                },
                {
                  "id": "tf-p20-d",
                  "statement": "d) Nếu thay proton bằng electron có cùng vận tốc thì bán kính quỹ đạo sẽ nhỏ hơn rất nhiều.",
                  "isTrue": true,
                  "explain": "Khối lượng electron nhỏ hơn proton ~1836 lần nên R = mv/(qB) nhỏ hơn rất nhiều. Đúng."
                }
              ]
            },
            {
              "id": "q-p20-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một electron ($q = -1{,}6 \\times 10^{-19}\\text{ C}, m = 9{,}1 \\times 10^{-31}\\text{ kg}$) bay vào từ trường đều $B = 10^{-4}\\text{ T}$ theo phương vuông góc với vận tốc $v = 3{,}52 \\times 10^6\\text{ m/s}$. Tính bán kính quỹ đạo tròn của electron (đơn vị: cm, làm tròn số nguyên).",
              "correctAnswer": "20",
              "unit": "cm",
              "solution": "R = m*v / (|q|*B) = (9,1*10^-31 * 3,52*10^6) / (1,6*10^-19 * 10^-4) = 32,032*10^-25 / 1,6*10^-23 = 0,2002 m = 20 cm.",
              "trapAlert": "Nhầm đơn vị mét và cm."
            }
          ],
          "subjectKey": "ly",
          "grade": 11
        },
        {
          "id": "ly-cam-ung-dien-tu-faraday",
          "title": "Cảm ứng điện từ & Định luật Faraday",
          "desc": "Từ thông $\\Phi$, định luật Lenz về chiều dòng điện cảm ứng, suất điện động cảm ứng Faraday và hiện tượng tự cảm trong ống dây.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Từ thông qua mạch kín",
              "desc": "Đại lượng đo số đường sức từ xuyên qua tiết diện S: $\\Phi = B \\cdot S \\cdot \\cos\\alpha$. Đơn vị: Weber (Wb)."
            },
            {
              "title": "Định luật Faraday & Định luật Lenz",
              "desc": "Suất điện động cảm ứng tỉ lệ với tốc độ biến thiên từ thông: $e_c = -\\frac{\\Delta\\Phi}{\\Delta t}$. Định luật Lenz: Dòng điện cảm ứng có chiều sao cho từ trường do nó sinh ra chống lại nguyên nhân sinh ra nó."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định góc alpha",
              "instruction": "$\\alpha$ là góc hợp bởi vectơ cảm ứng từ B và vectơ PHÁP TUYẾN n của mặt phẳng khung dây."
            },
            {
              "step": 2,
              "title": "Tính suất điện động cảm ứng",
              "instruction": "$|e_c| = N \\cdot \\frac{|\\Delta\\Phi|}{\\Delta t}$. Dòng điện cảm ứng $I_c = |e_c| / R$."
            }
          ],
          "formulas": [
            {
              "label": "Từ thông qua khung dây N vòng",
              "formula": "\\Phi = N B S \\cos\\alpha",
              "displayLatex": "\\Phi = N B S \\cos\\alpha",
              "notes": "alpha là góc giữa vectơ pháp tuyến n và vectơ B."
            },
            {
              "label": "Độ lớn suất điện động cảm ứng",
              "formula": "|e_c| = |\\frac{\\Delta\\Phi}{\\Delta t}|",
              "displayLatex": "|e_c| = \\left|\\frac{\\Delta\\Phi}{\\Delta t}\\right|",
              "notes": "Đơn vị: Volt (V)."
            },
            {
              "label": "Suất điện động tự cảm",
              "formula": "e_{tc} = -L \\frac{\\Delta i}{\\Delta t}",
              "displayLatex": "e_{tc} = -L \\frac{\\Delta i}{\\Delta t}",
              "notes": "L là độ tự cảm của ống dây (Henry - H)."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm góc alpha là góc giữa B và mặt phẳng khung dây",
              "avoid": "Nếu đề cho góc giữa B và MẶT PHẲNG khung là $\\beta$ thì $\\alpha = 90^\\circ - \\beta$."
            },
            {
              "trap": "Quên nhân số vòng dây N khi tính từ thông",
              "avoid": "Khung có N vòng dây thì $\\Phi = NBS \\cos\\alpha$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p21-1",
              "front": "Đơn vị đo của từ thông Phi là gì?",
              "back": "Weber (Wb). 1 Wb = 1 T * 1 m²."
            },
            {
              "id": "fc-p21-2",
              "front": "Dòng điện cảm ứng xuất hiện khi nào?",
              "back": "Khi từ thông xuyên qua mạch kín biến thiên theo thời gian."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p21-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khung dây có diện tích $20\\text{ cm}^2$ đặt trong từ trường đều $B = 0{,}5\\text{ T}$, vectơ B vuông góc với mặt phẳng khung dây. Từ thông qua khung dây là:",
              "options": [
                "10^-3 Wb",
                "10^-1 Wb",
                "10^-4 Wb",
                "1 Wb"
              ],
              "correct": 0,
              "solution": "B vuông góc mặt phẳng -> alpha = 0° -> cos(0°) = 1. S = 20*10^-4 m² = 2*10^-3 m². Phi = 0,5 * 2*10^-3 = 10^-3 Wb.",
              "trapAlert": "Không đổi cm² ra m² (chia 10000).",
              "fastTip": "0,5 * 0,002 = 0,001 Wb = 10^-3 Wb."
            },
            {
              "id": "q-p21-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một cuộn dây có 100 vòng, diện tích mỗi vòng $50\\text{ cm}^2$. Cảm ứng từ giảm đều từ 0,6 T về 0,2 T trong thời gian 0,1 giây theo phương vuông góc mặt phẳng cuộn dây. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p21-a",
                  "statement": "a) Độ biến thiên cảm ứng từ là 0,4 T.",
                  "isTrue": true,
                  "explain": "Delta B = 0,6 - 0,2 = 0,4 T. Đúng."
                },
                {
                  "id": "tf-p21-b",
                  "statement": "b) Suất điện động cảm ứng trong cuộn dây có độ lớn là 2,0 V.",
                  "isTrue": true,
                  "explain": "e_c = 100 * (0,4 * 50*10^-4 / 0,1) = 100 * 0,02 = 2,0 V. Đúng."
                },
                {
                  "id": "tf-p21-c",
                  "statement": "c) Nếu điện trở cuộn dây là 4 ohm thì cường độ dòng cảm ứng là 0,5 A.",
                  "isTrue": true,
                  "explain": "I = 2 / 4 = 0,5 A. Đúng."
                },
                {
                  "id": "tf-p21-d",
                  "statement": "d) Khi cảm ứng từ tăng lên thì dòng điện cảm ứng đổi chiều.",
                  "isTrue": true,
                  "explain": "Theo định luật Lenz, chiều dòng cảm ứng phụ thuộc chiều tăng hay giảm của từ thông. Đúng."
                }
              ]
            },
            {
              "id": "q-p21-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một ống dây có độ tự cảm $L = 0{,}2\\text{ H}$. Dòng điện qua ống dây biến thiên đều giảm từ 5 A về 0 trong thời gian 0,05 giây. Tính độ lớn suất điện động tự cảm xuất hiện trong ống dây (đơn vị: Volt).",
              "correctAnswer": "20",
              "unit": "V",
              "solution": "e_tc = L * |Delta i / Delta t| = 0,2 * (5 / 0,05) = 0,2 * 100 = 20 V.",
              "trapAlert": "Nhầm phép chia 5 / 0,05."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p21-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khung dây có diện tích $20\\text{ cm}^2$ đặt trong từ trường đều $B = 0{,}5\\text{ T}$, vectơ B vuông góc với mặt phẳng khung dây. Từ thông qua khung dây là:",
              "options": [
                "10^-3 Wb",
                "10^-1 Wb",
                "10^-4 Wb",
                "1 Wb"
              ],
              "correct": 0,
              "solution": "B vuông góc mặt phẳng -> alpha = 0° -> cos(0°) = 1. S = 20*10^-4 m² = 2*10^-3 m². Phi = 0,5 * 2*10^-3 = 10^-3 Wb.",
              "trapAlert": "Không đổi cm² ra m² (chia 10000).",
              "fastTip": "0,5 * 0,002 = 0,001 Wb = 10^-3 Wb."
            },
            {
              "id": "q-p21-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một cuộn dây có 100 vòng, diện tích mỗi vòng $50\\text{ cm}^2$. Cảm ứng từ giảm đều từ 0,6 T về 0,2 T trong thời gian 0,1 giây theo phương vuông góc mặt phẳng cuộn dây. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p21-a",
                  "statement": "a) Độ biến thiên cảm ứng từ là 0,4 T.",
                  "isTrue": true,
                  "explain": "Delta B = 0,6 - 0,2 = 0,4 T. Đúng."
                },
                {
                  "id": "tf-p21-b",
                  "statement": "b) Suất điện động cảm ứng trong cuộn dây có độ lớn là 2,0 V.",
                  "isTrue": true,
                  "explain": "e_c = 100 * (0,4 * 50*10^-4 / 0,1) = 100 * 0,02 = 2,0 V. Đúng."
                },
                {
                  "id": "tf-p21-c",
                  "statement": "c) Nếu điện trở cuộn dây là 4 ohm thì cường độ dòng cảm ứng là 0,5 A.",
                  "isTrue": true,
                  "explain": "I = 2 / 4 = 0,5 A. Đúng."
                },
                {
                  "id": "tf-p21-d",
                  "statement": "d) Khi cảm ứng từ tăng lên thì dòng điện cảm ứng đổi chiều.",
                  "isTrue": true,
                  "explain": "Theo định luật Lenz, chiều dòng cảm ứng phụ thuộc chiều tăng hay giảm của từ thông. Đúng."
                }
              ]
            },
            {
              "id": "q-p21-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một ống dây có độ tự cảm $L = 0{,}2\\text{ H}$. Dòng điện qua ống dây biến thiên đều giảm từ 5 A về 0 trong thời gian 0,05 giây. Tính độ lớn suất điện động tự cảm xuất hiện trong ống dây (đơn vị: Volt).",
              "correctAnswer": "20",
              "unit": "V",
              "solution": "e_tc = L * |Delta i / Delta t| = 0,2 * (5 / 0,05) = 0,2 * 100 = 20 V.",
              "trapAlert": "Nhầm phép chia 5 / 0,05."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p21-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khung dây có diện tích $20\\text{ cm}^2$ đặt trong từ trường đều $B = 0{,}5\\text{ T}$, vectơ B vuông góc với mặt phẳng khung dây. Từ thông qua khung dây là:",
              "options": [
                "10^-3 Wb",
                "10^-1 Wb",
                "10^-4 Wb",
                "1 Wb"
              ],
              "correct": 0,
              "solution": "B vuông góc mặt phẳng -> alpha = 0° -> cos(0°) = 1. S = 20*10^-4 m² = 2*10^-3 m². Phi = 0,5 * 2*10^-3 = 10^-3 Wb.",
              "trapAlert": "Không đổi cm² ra m² (chia 10000).",
              "fastTip": "0,5 * 0,002 = 0,001 Wb = 10^-3 Wb."
            },
            {
              "id": "q-p21-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một cuộn dây có 100 vòng, diện tích mỗi vòng $50\\text{ cm}^2$. Cảm ứng từ giảm đều từ 0,6 T về 0,2 T trong thời gian 0,1 giây theo phương vuông góc mặt phẳng cuộn dây. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p21-a",
                  "statement": "a) Độ biến thiên cảm ứng từ là 0,4 T.",
                  "isTrue": true,
                  "explain": "Delta B = 0,6 - 0,2 = 0,4 T. Đúng."
                },
                {
                  "id": "tf-p21-b",
                  "statement": "b) Suất điện động cảm ứng trong cuộn dây có độ lớn là 2,0 V.",
                  "isTrue": true,
                  "explain": "e_c = 100 * (0,4 * 50*10^-4 / 0,1) = 100 * 0,02 = 2,0 V. Đúng."
                },
                {
                  "id": "tf-p21-c",
                  "statement": "c) Nếu điện trở cuộn dây là 4 ohm thì cường độ dòng cảm ứng là 0,5 A.",
                  "isTrue": true,
                  "explain": "I = 2 / 4 = 0,5 A. Đúng."
                },
                {
                  "id": "tf-p21-d",
                  "statement": "d) Khi cảm ứng từ tăng lên thì dòng điện cảm ứng đổi chiều.",
                  "isTrue": true,
                  "explain": "Theo định luật Lenz, chiều dòng cảm ứng phụ thuộc chiều tăng hay giảm của từ thông. Đúng."
                }
              ]
            },
            {
              "id": "q-p21-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một ống dây có độ tự cảm $L = 0{,}2\\text{ H}$. Dòng điện qua ống dây biến thiên đều giảm từ 5 A về 0 trong thời gian 0,05 giây. Tính độ lớn suất điện động tự cảm xuất hiện trong ống dây (đơn vị: Volt).",
              "correctAnswer": "20",
              "unit": "V",
              "solution": "e_tc = L * |Delta i / Delta t| = 0,2 * (5 / 0,05) = 0,2 * 100 = 20 V.",
              "trapAlert": "Nhầm phép chia 5 / 0,05."
            }
          ],
          "subjectKey": "ly",
          "grade": 11
        }
      ]
    },
    {
      "chapterId": "ly-c5-hatnhan",
      "chapterName": "Vật lý hạt nhân & Phóng xạ",
      "grade": 12,
      "lessons": [
        {
          "id": "ly-cau-tao-hat-nhan-do-hut-khoi",
          "title": "Cấu tạo hạt nhân, Độ hụt khối & Năng lượng liên kết",
          "desc": "Thành phần hạt nhân ($Z$ proton, $N$ neutron), hệ thức Einstein $E=mc^2$, độ hụt khối $\\Delta m$ và năng lượng liên kết riêng quyết định độ bền vững.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Cấu tạo hạt nhân nguyên tử",
              "desc": "Kí hiệu hạt nhân: $_Z^A X$. Chứa Z proton và $N = A - Z$ neutron. Tổng số nucleon là A."
            },
            {
              "title": "Độ hụt khối và Năng lượng liên kết",
              "desc": "Độ hụt khối: $\\Delta m = [Z \\cdot m_p + (A - Z) m_n] - m_X > 0$. Năng lượng liên kết: $E_{lk} = \\Delta m \\cdot c^2$. Năng lượng liên kết riêng $E_{lkr} = \\frac{E_{lk}}{A}$ đặc trưng cho mức độ bền vững của hạt nhân (bền vững nhất quanh $A \\approx 50 - 80$)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính độ hụt khối Delta m",
              "instruction": "$\\Delta m = Z m_p + (A - Z)m_n - m_X$ (tính theo u)."
            },
            {
              "step": 2,
              "title": "Tính năng lượng liên kết và liên kết riêng",
              "instruction": "$E_{lk} = \\Delta m \\times 931{,}5\\text{ MeV}$. $E_{lkr} = E_{lk} / A$."
            }
          ],
          "formulas": [
            {
              "label": "Độ hụt khối của hạt nhân",
              "formula": "\\Delta m = Z m_p + (A - Z)m_n - m_X",
              "displayLatex": "\\Delta m = Z m_p + (A - Z)m_n - m_X",
              "notes": "Khối lượng hạt nhân luôn nhỏ hơn tổng khối lượng các nucleon tạo nên nó."
            },
            {
              "label": "Hệ thức Einstein về năng lượng nghỉ",
              "formula": "E = m c^2 \\iff 1\\text{ u} \\approx 931{,}5\\text{ MeV}/c^2",
              "displayLatex": "1\\text{ u} \\approx 931{,}5\\text{ MeV}/c^2",
              "notes": "Quy đổi khối lượng hạt nhân ra năng lượng."
            },
            {
              "label": "Năng lượng liên kết riêng",
              "formula": "E_{lkr} = \\frac{E_{lk}}{A}",
              "displayLatex": "E_{lkr} = \\frac{E_{lk}}{A}",
              "notes": "Càng lớn thì hạt nhân càng bền vững."
            }
          ],
          "traps": [
            {
              "trap": "So sánh độ bền vững hạt nhân bằng năng lượng liên kết E_lk",
              "avoid": "Độ bền vững phải so sánh bằng NĂNG LƯỢNG LIÊN KẾT RIÊNG $E_{lkr} = E_{lk}/A$, không phải $E_{lk}$."
            },
            {
              "trap": "Quên số neutron là N = A - Z",
              "avoid": "Neutron là $A - Z$, không phải A."
            }
          ],
          "flashcards": [
            {
              "id": "fc-p22-1",
              "front": "Đại lượng nào đặc trưng cho mức độ bền vững của một hạt nhân?",
              "back": "Năng lượng liên kết riêng (E_lk / A)."
            },
            {
              "id": "fc-p22-2",
              "front": "Các hạt nhân bền vững nhất nằm trong khoảng số khối A nào?",
              "back": "Nằm trong khoảng số khối trung bình từ 50 đến 80 (như Fe, Ni)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-p22-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Hạt nhân $^{238}_{92}U$ có số proton và số neutron lần lượt là:",
              "options": [
                "92 proton và 146 neutron",
                "92 proton và 238 neutron",
                "146 proton và 92 neutron",
                "238 proton và 92 neutron"
              ],
              "correct": 0,
              "solution": "Z = 92 (proton). N = A - Z = 238 - 92 = 146 (neutron).",
              "trapAlert": "Nhầm số neutron là số khối A = 238.",
              "fastTip": "238 - 92 = 146."
            },
            {
              "id": "q-p22-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho biết $m_p = 1{,}00728\\text{ u}, m_n = 1{,}00866\\text{ u}$, khối lượng hạt nhân $^{4}_{2}He$ là $4{,}00150\\text{ u}$. Lấy $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p22-a",
                  "statement": "a) Độ hụt khối của hạt nhân He là 0,03038 u.",
                  "isTrue": true,
                  "explain": "Delta m = 2*1,00728 + 2*1,00866 - 4,00150 = 0,03038 u. Đúng."
                },
                {
                  "id": "tf-p22-b",
                  "statement": "b) Năng lượng liên kết của hạt nhân He là khoảng 28,3 MeV.",
                  "isTrue": true,
                  "explain": "E_lk = 0,03038 * 931,5 ≈ 28,3 MeV. Đúng."
                },
                {
                  "id": "tf-p22-c",
                  "statement": "c) Năng lượng liên kết riêng của hạt nhân He là 7,07 MeV/nucleon.",
                  "isTrue": true,
                  "explain": "E_lkr = 28,3 / 4 ≈ 7,07 MeV/nucleon. Đúng."
                },
                {
                  "id": "tf-p22-d",
                  "statement": "d) Hạt nhân He có độ bền vững cao hơn hạt nhân Sắt (Fe-56).",
                  "isTrue": false,
                  "explain": "Hạt nhân Fe-56 có năng lượng liên kết riêng ~8,8 MeV/nucleon bền vững hơn He (~7,07 MeV/nucleon). Sai."
                }
              ]
            },
            {
              "id": "q-p22-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Độ hụt khối của hạt nhân $^{12}_{6}C$ là $\\Delta m = 0{,}0956\\text{ u}$. Cho $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Tính năng lượng liên kết riêng của hạt nhân Carbon-12 (đơn vị: MeV/nucleon, làm tròn 1 chữ số thập phân).",
              "correctAnswer": "7.4",
              "unit": "MeV/nucleon",
              "solution": "E_lk = 0,0956 * 931,5 = 89,05 MeV. E_lkr = 89,05 / 12 = 7,42 ≈ 7,4 MeV/nucleon.",
              "trapAlert": "Quên chia cho số khối A = 12."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-p22-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Hạt nhân $^{238}_{92}U$ có số proton và số neutron lần lượt là:",
              "options": [
                "92 proton và 146 neutron",
                "92 proton và 238 neutron",
                "146 proton và 92 neutron",
                "238 proton và 92 neutron"
              ],
              "correct": 0,
              "solution": "Z = 92 (proton). N = A - Z = 238 - 92 = 146 (neutron).",
              "trapAlert": "Nhầm số neutron là số khối A = 238.",
              "fastTip": "238 - 92 = 146."
            },
            {
              "id": "q-p22-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho biết $m_p = 1{,}00728\\text{ u}, m_n = 1{,}00866\\text{ u}$, khối lượng hạt nhân $^{4}_{2}He$ là $4{,}00150\\text{ u}$. Lấy $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p22-a",
                  "statement": "a) Độ hụt khối của hạt nhân He là 0,03038 u.",
                  "isTrue": true,
                  "explain": "Delta m = 2*1,00728 + 2*1,00866 - 4,00150 = 0,03038 u. Đúng."
                },
                {
                  "id": "tf-p22-b",
                  "statement": "b) Năng lượng liên kết của hạt nhân He là khoảng 28,3 MeV.",
                  "isTrue": true,
                  "explain": "E_lk = 0,03038 * 931,5 ≈ 28,3 MeV. Đúng."
                },
                {
                  "id": "tf-p22-c",
                  "statement": "c) Năng lượng liên kết riêng của hạt nhân He là 7,07 MeV/nucleon.",
                  "isTrue": true,
                  "explain": "E_lkr = 28,3 / 4 ≈ 7,07 MeV/nucleon. Đúng."
                },
                {
                  "id": "tf-p22-d",
                  "statement": "d) Hạt nhân He có độ bền vững cao hơn hạt nhân Sắt (Fe-56).",
                  "isTrue": false,
                  "explain": "Hạt nhân Fe-56 có năng lượng liên kết riêng ~8,8 MeV/nucleon bền vững hơn He (~7,07 MeV/nucleon). Sai."
                }
              ]
            },
            {
              "id": "q-p22-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Độ hụt khối của hạt nhân $^{12}_{6}C$ là $\\Delta m = 0{,}0956\\text{ u}$. Cho $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Tính năng lượng liên kết riêng của hạt nhân Carbon-12 (đơn vị: MeV/nucleon, làm tròn 1 chữ số thập phân).",
              "correctAnswer": "7.4",
              "unit": "MeV/nucleon",
              "solution": "E_lk = 0,0956 * 931,5 = 89,05 MeV. E_lkr = 89,05 / 12 = 7,42 ≈ 7,4 MeV/nucleon.",
              "trapAlert": "Quên chia cho số khối A = 12."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-p22-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Hạt nhân $^{238}_{92}U$ có số proton và số neutron lần lượt là:",
              "options": [
                "92 proton và 146 neutron",
                "92 proton và 238 neutron",
                "146 proton và 92 neutron",
                "238 proton và 92 neutron"
              ],
              "correct": 0,
              "solution": "Z = 92 (proton). N = A - Z = 238 - 92 = 146 (neutron).",
              "trapAlert": "Nhầm số neutron là số khối A = 238.",
              "fastTip": "238 - 92 = 146."
            },
            {
              "id": "q-p22-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho biết $m_p = 1{,}00728\\text{ u}, m_n = 1{,}00866\\text{ u}$, khối lượng hạt nhân $^{4}_{2}He$ là $4{,}00150\\text{ u}$. Lấy $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-p22-a",
                  "statement": "a) Độ hụt khối của hạt nhân He là 0,03038 u.",
                  "isTrue": true,
                  "explain": "Delta m = 2*1,00728 + 2*1,00866 - 4,00150 = 0,03038 u. Đúng."
                },
                {
                  "id": "tf-p22-b",
                  "statement": "b) Năng lượng liên kết của hạt nhân He là khoảng 28,3 MeV.",
                  "isTrue": true,
                  "explain": "E_lk = 0,03038 * 931,5 ≈ 28,3 MeV. Đúng."
                },
                {
                  "id": "tf-p22-c",
                  "statement": "c) Năng lượng liên kết riêng của hạt nhân He là 7,07 MeV/nucleon.",
                  "isTrue": true,
                  "explain": "E_lkr = 28,3 / 4 ≈ 7,07 MeV/nucleon. Đúng."
                },
                {
                  "id": "tf-p22-d",
                  "statement": "d) Hạt nhân He có độ bền vững cao hơn hạt nhân Sắt (Fe-56).",
                  "isTrue": false,
                  "explain": "Hạt nhân Fe-56 có năng lượng liên kết riêng ~8,8 MeV/nucleon bền vững hơn He (~7,07 MeV/nucleon). Sai."
                }
              ]
            },
            {
              "id": "q-p22-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Độ hụt khối của hạt nhân $^{12}_{6}C$ là $\\Delta m = 0{,}0956\\text{ u}$. Cho $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Tính năng lượng liên kết riêng của hạt nhân Carbon-12 (đơn vị: MeV/nucleon, làm tròn 1 chữ số thập phân).",
              "correctAnswer": "7.4",
              "unit": "MeV/nucleon",
              "solution": "E_lk = 0,0956 * 931,5 = 89,05 MeV. E_lkr = 89,05 / 12 = 7,42 ≈ 7,4 MeV/nucleon.",
              "trapAlert": "Quên chia cho số khối A = 12."
            }
          ],
          "subjectKey": "ly",
          "grade": 12
        }
      ]
    }
  ],
  "hoa": [
    {
      "chapterId": "c10-atom",
      "chapterNum": "01",
      "chapterName": "Cấu tạo nguyên tử",
      "lessons": [
        {
          "id": "hoa-cau-tao-nguyen-tu",
          "title": "Thành phần nguyên tử, Khối lượng & Số khối",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Thành phần cấu tạo nguyên tử",
              "desc": "Nguyên tử gồm hạt nhân mang điện dương ở tâm (chứa proton và neutron) và lớp vỏ electron mang điện tích âm. $m_p \\approx m_n \\approx 1\\text{ amu}$, $m_e \\approx 0{,}00055\\text{ amu}$ rất nhỏ nên khối lượng nguyên tử tập trung hầu hết ở hạt nhân."
            },
            {
              "title": "Số hiệu nguyên tử Z và Số khối A",
              "desc": "Số hiệu nguyên tử $Z = p = e$. Số khối $A = Z + N$. Kí hiệu nguyên tử: $_Z^A X$. Đồng vị là các nguyên tử có cùng số proton Z nhưng khác số neutron N (khác số khối A)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Lập hệ phương trình số hạt",
              "instruction": "Phương trình 1: $2Z + N = \\text{Tổng hạt}$. Phương trình 2: $2Z - N = \\text{Chênh lệch}$ (hạt mang điện nhiều hơn không mang điện)."
            },
            {
              "step": 2,
              "title": "Giải hệ tìm Z và N",
              "instruction": "Xác định số hiệu Z, tra bảng tìm tên nguyên tố và cấu hình electron."
            }
          ],
          "formulas": [
            {
              "label": "Mối liên hệ giữa các loại hạt",
              "formula": "A = Z + N, \\quad \\sum \\text{hạt} = 2Z + N",
              "displayLatex": "A = Z + N, \\quad \\text{Tổng hạt} = 2Z + N",
              "notes": "Nguyên tử trung hòa về điện nên số p = số e = Z."
            },
            {
              "label": "Nguyên tử khối trung bình của các đồng vị",
              "formula": "\\bar{A} = \\frac{A_1 x_1 + A_2 x_2 + \\dots + A_n x_n}{100}",
              "displayLatex": "\\bar{A} = \\frac{\\sum A_i \\cdot x_i}{100}",
              "notes": "x_i là tỉ lệ phần trăm số nguyên tử của đồng vị A_i."
            },
            {
              "label": "Điều kiện bền của hạt nhân (Z <= 82)",
              "formula": "1 \\le \\frac{N}{Z} \\le 1{,}52",
              "displayLatex": "1 \\le \\frac{N}{Z} \\le 1{,}52",
              "notes": "Giúp chặn khoảng nghiệm để tìm Z khi chỉ biết tổng số hạt."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm hạt mang điện của nguyên tử với hạt mang điện của hạt nhân",
              "avoid": "Hạt mang điện của nguyên tử là (p + e = 2Z). Hạt mang điện của hạt nhân CHỈ LÀ proton (Z)."
            },
            {
              "trap": "Quên chia cho 100 khi tính nguyên tử khối trung bình",
              "avoid": "Tổng phần trăm $x_1 + x_2 = 100\\%$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c1-1",
              "front": "Hạt nhân nguyên tử gồm những loại hạt nào?",
              "back": "Proton (mang điện tích dương) và neutron (không mang điện)."
            },
            {
              "id": "fc-c1-2",
              "front": "Đồng vị là gì?",
              "back": "Những nguyên tử có cùng số proton (Z) nhưng khác số neutron (N), dẫn đến số khối A khác nhau."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tổng số hạt proton, neutron và electron trong nguyên tử của nguyên tố X là 40. Trong đó số hạt mang điện nhiều hơn số hạt không mang điện là 12. Số khối A của X là:",
              "options": [
                "27",
                "13",
                "14",
                "28"
              ],
              "correct": 0,
              "solution": "Ta có hệ: 2Z + N = 40 và 2Z - N = 12. Cộng hai vế: 4Z = 52 -> Z = 13 (Al). N = 40 - 26 = 14. Số khối A = Z + N = 13 + 14 = 27.",
              "trapAlert": "Nhầm số khối A với số hiệu Z = 13.",
              "fastTip": "4Z = 52 -> Z = 13; N = 14 -> A = 27."
            },
            {
              "id": "q-c1-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Trong tự nhiên, nguyên tố Chlorine (Cl) có hai đồng vị bền là $^{35}_{17}Cl$ (chiếm 75,77%) và $^{37}_{17}Cl$ (chiếm 24,23%). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c1-a",
                  "statement": "a) Hai đồng vị trên có cùng số proton là 17 và số electron là 17.",
                  "isTrue": true,
                  "explain": "Cùng là nguyên tố Chlorine nên Z = p = e = 17. Đúng."
                },
                {
                  "id": "tf-c1-b",
                  "statement": "b) Đồng vị Cl-37 có số neutron nhiều hơn đồng vị Cl-35 là 2 hạt.",
                  "isTrue": true,
                  "explain": "37 - 35 = 2 neutron. Đúng."
                },
                {
                  "id": "tf-c1-c",
                  "statement": "c) Nguyên tử khối trung bình của Chlorine là xấp xỉ 35,48 amu.",
                  "isTrue": true,
                  "explain": "A_tb = (35*75,77 + 37*24,23) / 100 ≈ 35,48 amu. Đúng."
                },
                {
                  "id": "tf-c1-d",
                  "statement": "d) Trong phân tử HClO₄, phần trăm khối lượng của đồng vị Cl-35 lớn hơn 30%.",
                  "isTrue": false,
                  "explain": "%Cl trong HClO₄ là 35,5/100,5 ≈ 35,3%, trong đó Cl-35 chiếm 75,77% nên %Cl-35 trong phân tử chỉ khoảng 26,7% < 30%. Sai."
                }
              ]
            },
            {
              "id": "q-c1-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Nguyên tố Đồng (Copper, Cu) có hai đồng vị bền là $^{63}Cu$ và $^{65}Cu$. Nguyên tử khối trung bình của Copper là 63,54 amu. Tính phần trăm số nguyên tử của đồng vị $^{63}Cu$ trong tự nhiên (đơn vị: %, ghi số thập phân)?",
              "correctAnswer": "73",
              "unit": "%",
              "solution": "Gọi x là % của ⁶³Cu: 63x + 65(1 - x) = 63,54 -> -2x = -1,46 -> x = 0,73 = 73%.",
              "trapAlert": "Nhầm hỏi % của ⁶⁵Cu (27%)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tổng số hạt proton, neutron và electron trong nguyên tử của nguyên tố X là 40. Trong đó số hạt mang điện nhiều hơn số hạt không mang điện là 12. Số khối A của X là:",
              "options": [
                "27",
                "13",
                "14",
                "28"
              ],
              "correct": 0,
              "solution": "Ta có hệ: 2Z + N = 40 và 2Z - N = 12. Cộng hai vế: 4Z = 52 -> Z = 13 (Al). N = 40 - 26 = 14. Số khối A = Z + N = 13 + 14 = 27.",
              "trapAlert": "Nhầm số khối A với số hiệu Z = 13.",
              "fastTip": "4Z = 52 -> Z = 13; N = 14 -> A = 27."
            },
            {
              "id": "q-c1-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Trong tự nhiên, nguyên tố Chlorine (Cl) có hai đồng vị bền là $^{35}_{17}Cl$ (chiếm 75,77%) và $^{37}_{17}Cl$ (chiếm 24,23%). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c1-a",
                  "statement": "a) Hai đồng vị trên có cùng số proton là 17 và số electron là 17.",
                  "isTrue": true,
                  "explain": "Cùng là nguyên tố Chlorine nên Z = p = e = 17. Đúng."
                },
                {
                  "id": "tf-c1-b",
                  "statement": "b) Đồng vị Cl-37 có số neutron nhiều hơn đồng vị Cl-35 là 2 hạt.",
                  "isTrue": true,
                  "explain": "37 - 35 = 2 neutron. Đúng."
                },
                {
                  "id": "tf-c1-c",
                  "statement": "c) Nguyên tử khối trung bình của Chlorine là xấp xỉ 35,48 amu.",
                  "isTrue": true,
                  "explain": "A_tb = (35*75,77 + 37*24,23) / 100 ≈ 35,48 amu. Đúng."
                },
                {
                  "id": "tf-c1-d",
                  "statement": "d) Trong phân tử HClO₄, phần trăm khối lượng của đồng vị Cl-35 lớn hơn 30%.",
                  "isTrue": false,
                  "explain": "%Cl trong HClO₄ là 35,5/100,5 ≈ 35,3%, trong đó Cl-35 chiếm 75,77% nên %Cl-35 trong phân tử chỉ khoảng 26,7% < 30%. Sai."
                }
              ]
            },
            {
              "id": "q-c1-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Nguyên tố Đồng (Copper, Cu) có hai đồng vị bền là $^{63}Cu$ và $^{65}Cu$. Nguyên tử khối trung bình của Copper là 63,54 amu. Tính phần trăm số nguyên tử của đồng vị $^{63}Cu$ trong tự nhiên (đơn vị: %, ghi số thập phân)?",
              "correctAnswer": "73",
              "unit": "%",
              "solution": "Gọi x là % của ⁶³Cu: 63x + 65(1 - x) = 63,54 -> -2x = -1,46 -> x = 0,73 = 73%.",
              "trapAlert": "Nhầm hỏi % của ⁶⁵Cu (27%)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tổng số hạt proton, neutron và electron trong nguyên tử của nguyên tố X là 40. Trong đó số hạt mang điện nhiều hơn số hạt không mang điện là 12. Số khối A của X là:",
              "options": [
                "27",
                "13",
                "14",
                "28"
              ],
              "correct": 0,
              "solution": "Ta có hệ: 2Z + N = 40 và 2Z - N = 12. Cộng hai vế: 4Z = 52 -> Z = 13 (Al). N = 40 - 26 = 14. Số khối A = Z + N = 13 + 14 = 27.",
              "trapAlert": "Nhầm số khối A với số hiệu Z = 13.",
              "fastTip": "4Z = 52 -> Z = 13; N = 14 -> A = 27."
            },
            {
              "id": "q-c1-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Trong tự nhiên, nguyên tố Chlorine (Cl) có hai đồng vị bền là $^{35}_{17}Cl$ (chiếm 75,77%) và $^{37}_{17}Cl$ (chiếm 24,23%). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c1-a",
                  "statement": "a) Hai đồng vị trên có cùng số proton là 17 và số electron là 17.",
                  "isTrue": true,
                  "explain": "Cùng là nguyên tố Chlorine nên Z = p = e = 17. Đúng."
                },
                {
                  "id": "tf-c1-b",
                  "statement": "b) Đồng vị Cl-37 có số neutron nhiều hơn đồng vị Cl-35 là 2 hạt.",
                  "isTrue": true,
                  "explain": "37 - 35 = 2 neutron. Đúng."
                },
                {
                  "id": "tf-c1-c",
                  "statement": "c) Nguyên tử khối trung bình của Chlorine là xấp xỉ 35,48 amu.",
                  "isTrue": true,
                  "explain": "A_tb = (35*75,77 + 37*24,23) / 100 ≈ 35,48 amu. Đúng."
                },
                {
                  "id": "tf-c1-d",
                  "statement": "d) Trong phân tử HClO₄, phần trăm khối lượng của đồng vị Cl-35 lớn hơn 30%.",
                  "isTrue": false,
                  "explain": "%Cl trong HClO₄ là 35,5/100,5 ≈ 35,3%, trong đó Cl-35 chiếm 75,77% nên %Cl-35 trong phân tử chỉ khoảng 26,7% < 30%. Sai."
                }
              ]
            },
            {
              "id": "q-c1-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Nguyên tố Đồng (Copper, Cu) có hai đồng vị bền là $^{63}Cu$ và $^{65}Cu$. Nguyên tử khối trung bình của Copper là 63,54 amu. Tính phần trăm số nguyên tử của đồng vị $^{63}Cu$ trong tự nhiên (đơn vị: %, ghi số thập phân)?",
              "correctAnswer": "73",
              "unit": "%",
              "solution": "Gọi x là % của ⁶³Cu: 63x + 65(1 - x) = 63,54 -> -2x = -1,46 -> x = 0,73 = 73%.",
              "trapAlert": "Nhầm hỏi % của ⁶⁵Cu (27%)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-orbital-cau-hinh-electron",
          "title": "Orbital nguyên tử (AO) & Cấu hình electron",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Orbital nguyên tử (AO)",
              "desc": "Khu vực không gian xung quanh hạt nhân mà tại đó xác suất tìm thấy electron là lớn nhất (khoảng 90%). AO s có dạng hình cầu, AO p có dạng hình số 8 nổi gồm 3 orbital ($p_x, p_y, p_z$). Mỗi AO chứa tối đa 2 electron có spin ngược chiều nhau."
            },
            {
              "title": "Các nguyên lí và quy tắc phân bố electron",
              "desc": "Nguyên lí vững bền (điền mức năng lượng tăng dần: 1s 2s 2p 3s 3p 4s 3d 4p...). Nguyên lí Pauli (mỗi AO tối đa 2e). Quy tắc Hund (phân bố sao cho số e độc thân là cực đại, spin cùng chiều)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Viết phân bố mức năng lượng",
              "instruction": "Điền electron theo thứ tự: $1s^2 2s^2 2p^6 3s^2 3p^6 4s^2 3d^n$."
            },
            {
              "step": 2,
              "title": "Sắp xếp lại theo từng lớp electron",
              "instruction": "Đưa phân lớp 3d về cùng lớp 3: $1s^2 2s^2 2p^6 3s^2 3p^6 3d^n 4s^2$. Chú ý cấu hình bán bão hòa $3d^5 4s^1$ (Cr) và bão hòa $3d^{10} 4s^1$ (Cu)."
            }
          ],
          "formulas": [
            {
              "label": "Thứ tự mức năng lượng",
              "formula": "1s < 2s < 2p < 3s < 3p < 4s < 3d < 4p < 5s < 4d \\dots",
              "displayLatex": "1s \\ 2s \\ 2p \\ 3s \\ 3p \\ 4s \\ 3d \\dots",
              "notes": "Chú ý hiện tượng chèn mức năng lượng 4s thấp hơn 3d."
            },
            {
              "label": "Số electron tối đa trong các phân lớp",
              "formula": "s^2, \\quad p^6, \\quad d^{10}, \\quad f^{14}",
              "displayLatex": "s^2, \\ p^6, \\ d^{10}, \\ f^{14}",
              "notes": "Lớp thứ n có tối đa 2n² electron."
            }
          ],
          "traps": [
            {
              "trap": "Quên trường hợp ngoại lệ bán bão hòa và bão hòa của Cr (Z=24) và Cu (Z=29)",
              "avoid": "Cr: $[Ar]3d^5 4s^1$ (không phải $3d^4 4s^2$). Cu: $[Ar]3d^{10} 4s^1$ (không phải $3d^9 4s^2$)."
            },
            {
              "trap": "Nhầm số electron lớp ngoài cùng của nguyên tố d",
              "avoid": "Cấu hình kết thúc ở $4s^2$ nhưng phân lớp đang xây dựng dở dang là 3d nên là kim loại chuyển tiếp nhóm B."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c2-1",
              "front": "Cấu hình electron của nguyên tử Chromium (Cr, Z=24)?",
              "back": "[Ar] 3d⁵ 4s¹ (cấu hình bán bão hòa bền vững)."
            },
            {
              "id": "fc-c2-2",
              "front": "Số electron độc thân của nguyên tử Nitrogen (N, Z=7)?",
              "back": "Có 3 electron độc thân trên 3 orbital phân lớp 2p."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c2-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cấu hình electron nguyên tử của nguyên tố Iron (Fe, Z = 26) ở trạng thái cơ bản là:",
              "options": [
                "[Ar] 3d⁶ 4s²",
                "[Ar] 4s² 3d⁶",
                "[Ar] 3d⁸",
                "[Ar] 3d⁵ 4s² 4p¹"
              ],
              "correct": 0,
              "solution": "Mức năng lượng: 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶. Sắp xếp lại theo lớp: 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s² hay [Ar] 3d⁶ 4s².",
              "trapAlert": "Viết 4s trước 3d trong cấu hình electron.",
              "fastTip": "Sắp xếp theo thứ tự lớp: 3d đứng trước 4s."
            },
            {
              "id": "q-c2-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét ion $Fe^{3+}$ tạo thành từ nguyên tử Iron ($Z = 26$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c2-a",
                  "statement": "a) Nguyên tử Fe nhường 3 electron để tạo thành ion Fe³⁺.",
                  "isTrue": true,
                  "explain": "Fe -> Fe³⁺ + 3e. Đúng."
                },
                {
                  "id": "tf-c2-b",
                  "statement": "b) Khi nhường electron, Fe mất 2e ở phân lớp 4s và 1e ở phân lớp 3d.",
                  "isTrue": true,
                  "explain": "Mất e lớp ngoài cùng 4s trước, sau đó đến 3d. Đúng."
                },
                {
                  "id": "tf-c2-c",
                  "statement": "c) Cấu hình electron của ion Fe³⁺ là [Ar] 3d⁵.",
                  "isTrue": true,
                  "explain": "[Ar]3d⁶4s² mất 3e còn [Ar]3d⁵. Đúng."
                },
                {
                  "id": "tf-c2-d",
                  "statement": "d) Ion Fe³⁺ không có electron độc thân nào.",
                  "isTrue": false,
                  "explain": "Phân lớp 3d⁵ có 5 orbital chứa 5 electron độc thân (bán bão hòa). Sai."
                }
              ]
            },
            {
              "id": "q-c2-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Nguyên tử của nguyên tố X có tổng số electron trên các phân lớp p là 11. Hỏi số hiệu nguyên tử Z của nguyên tố X là bao nhiêu?",
              "correctAnswer": "17",
              "unit": "",
              "solution": "Các phân lớp p: 2p⁶ và 3p⁵ (tổng số e phân lớp p = 6 + 5 = 11). Cấu hình e đầy đủ: 1s² 2s² 2p⁶ 3s² 3p⁵. Tổng số e: Z = 2 + 2 + 6 + 2 + 5 = 17 (Chlorine).",
              "trapAlert": "Quên phân lớp 2p đã chứa tối đa 6 electron."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c2-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cấu hình electron nguyên tử của nguyên tố Iron (Fe, Z = 26) ở trạng thái cơ bản là:",
              "options": [
                "[Ar] 3d⁶ 4s²",
                "[Ar] 4s² 3d⁶",
                "[Ar] 3d⁸",
                "[Ar] 3d⁵ 4s² 4p¹"
              ],
              "correct": 0,
              "solution": "Mức năng lượng: 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶. Sắp xếp lại theo lớp: 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s² hay [Ar] 3d⁶ 4s².",
              "trapAlert": "Viết 4s trước 3d trong cấu hình electron.",
              "fastTip": "Sắp xếp theo thứ tự lớp: 3d đứng trước 4s."
            },
            {
              "id": "q-c2-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét ion $Fe^{3+}$ tạo thành từ nguyên tử Iron ($Z = 26$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c2-a",
                  "statement": "a) Nguyên tử Fe nhường 3 electron để tạo thành ion Fe³⁺.",
                  "isTrue": true,
                  "explain": "Fe -> Fe³⁺ + 3e. Đúng."
                },
                {
                  "id": "tf-c2-b",
                  "statement": "b) Khi nhường electron, Fe mất 2e ở phân lớp 4s và 1e ở phân lớp 3d.",
                  "isTrue": true,
                  "explain": "Mất e lớp ngoài cùng 4s trước, sau đó đến 3d. Đúng."
                },
                {
                  "id": "tf-c2-c",
                  "statement": "c) Cấu hình electron của ion Fe³⁺ là [Ar] 3d⁵.",
                  "isTrue": true,
                  "explain": "[Ar]3d⁶4s² mất 3e còn [Ar]3d⁵. Đúng."
                },
                {
                  "id": "tf-c2-d",
                  "statement": "d) Ion Fe³⁺ không có electron độc thân nào.",
                  "isTrue": false,
                  "explain": "Phân lớp 3d⁵ có 5 orbital chứa 5 electron độc thân (bán bão hòa). Sai."
                }
              ]
            },
            {
              "id": "q-c2-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Nguyên tử của nguyên tố X có tổng số electron trên các phân lớp p là 11. Hỏi số hiệu nguyên tử Z của nguyên tố X là bao nhiêu?",
              "correctAnswer": "17",
              "unit": "",
              "solution": "Các phân lớp p: 2p⁶ và 3p⁵ (tổng số e phân lớp p = 6 + 5 = 11). Cấu hình e đầy đủ: 1s² 2s² 2p⁶ 3s² 3p⁵. Tổng số e: Z = 2 + 2 + 6 + 2 + 5 = 17 (Chlorine).",
              "trapAlert": "Quên phân lớp 2p đã chứa tối đa 6 electron."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c2-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cấu hình electron nguyên tử của nguyên tố Iron (Fe, Z = 26) ở trạng thái cơ bản là:",
              "options": [
                "[Ar] 3d⁶ 4s²",
                "[Ar] 4s² 3d⁶",
                "[Ar] 3d⁸",
                "[Ar] 3d⁵ 4s² 4p¹"
              ],
              "correct": 0,
              "solution": "Mức năng lượng: 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶. Sắp xếp lại theo lớp: 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s² hay [Ar] 3d⁶ 4s².",
              "trapAlert": "Viết 4s trước 3d trong cấu hình electron.",
              "fastTip": "Sắp xếp theo thứ tự lớp: 3d đứng trước 4s."
            },
            {
              "id": "q-c2-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét ion $Fe^{3+}$ tạo thành từ nguyên tử Iron ($Z = 26$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c2-a",
                  "statement": "a) Nguyên tử Fe nhường 3 electron để tạo thành ion Fe³⁺.",
                  "isTrue": true,
                  "explain": "Fe -> Fe³⁺ + 3e. Đúng."
                },
                {
                  "id": "tf-c2-b",
                  "statement": "b) Khi nhường electron, Fe mất 2e ở phân lớp 4s và 1e ở phân lớp 3d.",
                  "isTrue": true,
                  "explain": "Mất e lớp ngoài cùng 4s trước, sau đó đến 3d. Đúng."
                },
                {
                  "id": "tf-c2-c",
                  "statement": "c) Cấu hình electron của ion Fe³⁺ là [Ar] 3d⁵.",
                  "isTrue": true,
                  "explain": "[Ar]3d⁶4s² mất 3e còn [Ar]3d⁵. Đúng."
                },
                {
                  "id": "tf-c2-d",
                  "statement": "d) Ion Fe³⁺ không có electron độc thân nào.",
                  "isTrue": false,
                  "explain": "Phân lớp 3d⁵ có 5 orbital chứa 5 electron độc thân (bán bão hòa). Sai."
                }
              ]
            },
            {
              "id": "q-c2-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Nguyên tử của nguyên tố X có tổng số electron trên các phân lớp p là 11. Hỏi số hiệu nguyên tử Z của nguyên tố X là bao nhiêu?",
              "correctAnswer": "17",
              "unit": "",
              "solution": "Các phân lớp p: 2p⁶ và 3p⁵ (tổng số e phân lớp p = 6 + 5 = 11). Cấu hình e đầy đủ: 1s² 2s² 2p⁶ 3s² 3p⁵. Tổng số e: Z = 2 + 2 + 6 + 2 + 5 = 17 (Chlorine).",
              "trapAlert": "Quên phân lớp 2p đã chứa tối đa 6 electron."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c10-periodic",
      "chapterNum": "02",
      "chapterName": "Bảng tuần hoàn & Định luật tuần hoàn",
      "lessons": [
        {
          "id": "hoa-bang-tuan-hoan-nguyen-tac",
          "title": "Cấu trúc bảng tuần hoàn & Quy luật biến đổi tuần hoàn",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Nguyên tắc sắp xếp bảng tuần hoàn Mendeleev",
              "desc": "Các nguyên tố được sắp xếp theo chiều tăng dần của điện tích hạt nhân nguyên tử. Cùng số lớp electron xếp vào cùng 1 chu kì (hàng ngang). Cùng số electron hóa trị có tính chất tương tự xếp vào cùng 1 nhóm (cột dọc)."
            },
            {
              "title": "Quy luật biến đổi tuần hoàn (Trong 1 chu kì từ trái qua phải)",
              "desc": "Điện tích hạt nhân tăng, bán kính nguyên tử GIẢM dần, độ âm điện TĂNG dần, tính kim loại GIẢM dần, tính phi kim TĂNG dần, tính base của oxide/hydroxide GIẢM dần, tính acid TĂNG dần."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Viết cấu hình electron của nguyên tố",
              "instruction": "Đếm số lớp e $\\implies$ Chu kì. Đếm số e lớp ngoài cùng $\\implies$ Nhóm."
            },
            {
              "step": 2,
              "title": "So sánh tính chất biến thiên",
              "instruction": "Bán kính nguyên tử: Trái -> Phải giảm, Trên -> Dưới tăng. Tính kim loại tỉ lệ thuận bán kính, tỉ lệ nghịch độ âm điện."
            }
          ],
          "formulas": [
            {
              "label": "Vị trí trong bảng tuần hoàn",
              "formula": "\\text{Chu kì} = \\text{Số lớp e}, \\quad \\text{Số thứ tự nhóm A} = \\text{Số e lớp ngoài cùng}",
              "displayLatex": "\\text{Số lớp e} = \\text{Chu kì}",
              "notes": "Nhóm B có số e hóa trị = (d + s)."
            },
            {
              "label": "Công thức oxide cao nhất và hydroxide tương ứng",
              "formula": "R_2O_n \\longrightarrow R(OH)_n \\quad (n \\text{ là số thứ tự nhóm A})",
              "displayLatex": "R_2O_n \\longrightarrow R(OH)_n",
              "notes": "Tổng hóa trị cao nhất trong oxide và hóa trị trong hợp chất khí với H luôn bằng 8 (từ nhóm IVA đến VIIA)."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm chu kì với nhóm khi đếm số e",
              "avoid": "Số lớp e là CHU KÌ (hàng), số e lớp ngoài cùng là NHÓM A (cột)."
            },
            {
              "trap": "Nhầm tính kim loại mạnh nhất là phi kim mạnh nhất",
              "avoid": "Kim loại mạnh nhất (không kể phóng xạ) là Cs, phi kim mạnh nhất là F (Fluorine có độ âm điện lớn nhất = 3,98)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c3-1",
              "front": "Nguyên tố nào có độ âm điện lớn nhất trong bảng tuần hoàn?",
              "back": "Fluorine (F) với độ âm điện 3,98."
            },
            {
              "id": "fc-c3-2",
              "front": "Trong một chu kì từ trái sang phải, bán kính nguyên tử biến đổi thế nào?",
              "back": "Bán kính nguyên tử giảm dần (do điện tích hạt nhân tăng hút màng e chặt hơn)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c3-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nguyên tố X có cấu hình electron: $1s^2 2s^2 2p^6 3s^2 3p^4$. Vị trí của X trong bảng tuần hoàn là:",
              "options": [
                "Ô 16, chu kì 3, nhóm VIA",
                "Ô 16, chu kì 3, nhóm IVA",
                "Ô 16, chu kì 4, nhóm IIIA",
                "Ô 6, chu kì 2, nhóm VIA"
              ],
              "correct": 0,
              "solution": "Z = 16 -> Ô số 16. Có 3 lớp e -> Chu kì 3. Lớp ngoài cùng (lớp 3) có 2 + 4 = 6 electron -> Nhóm VIA.",
              "trapAlert": "Chỉ đếm 4 e ở phân lớp 3p mà quên 2 e ở 3s.",
              "fastTip": "Lớp 3 có 6 e -> Nhóm VIA, chu kì 3."
            },
            {
              "id": "q-c3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các nguyên tố thuộc chu kì 3: $_{11}Na, _{12}Mg, _{13}Al, _{15}P, _{17}Cl$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c3-a",
                  "statement": "a) Thứ tự bán kính nguyên tử giảm dần là: Na > Mg > Al > P > Cl.",
                  "isTrue": true,
                  "explain": "Trong chu kì từ trái sang phải bán kính giảm dần. Đúng."
                },
                {
                  "id": "tf-c3-b",
                  "statement": "b) Độ âm điện của Chlorine là lớn nhất trong dãy trên.",
                  "isTrue": true,
                  "explain": "Độ âm điện tăng dần từ trái sang phải chu kì. Đúng."
                },
                {
                  "id": "tf-c3-c",
                  "statement": "c) Hydroxide có tính base mạnh nhất trong dãy là Al(OH)₃.",
                  "isTrue": false,
                  "explain": "NaOH là base mạnh nhất, Al(OH)₃ là hydroxide lưỡng tính. Sai."
                },
                {
                  "id": "tf-c3-d",
                  "statement": "d) Oxide cao nhất của Chlorine là Cl₂O₇ có tính acid mạnh nhất.",
                  "isTrue": true,
                  "explain": "Từ trái sang phải tính acid của oxide cao nhất tăng dần, Cl₂O₇ ứng với acid cực mạnh HClO₄. Đúng."
                }
              ]
            },
            {
              "id": "q-c3-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hai nguyên tố X và Y đứng kế tiếp nhau trong cùng một chu kì của bảng tuần hoàn có tổng số điện tích hạt nhân là 25 ($Z_X + Z_Y = 25$). Tìm số hiệu nguyên tử Z của nguyên tố có tính kim loại mạnh hơn trong hai nguyên tố đó.",
              "correctAnswer": "12",
              "unit": "",
              "solution": "Hai nguyên tố kế tiếp cùng chu kì: Z_Y - Z_X = 1. Kết hợp Z_X + Z_Y = 25 -> Z_X = 12 (Mg), Z_Y = 13 (Al). Trong chu kì, tính kim loại giảm dần từ trái sang phải nên Mg (Z=12) có tính kim loại mạnh hơn Al (Z=13).",
              "trapAlert": "Chọn Z = 13 thay vì nguyên tố có tính kim loại mạnh hơn (Z = 12)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c3-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nguyên tố X có cấu hình electron: $1s^2 2s^2 2p^6 3s^2 3p^4$. Vị trí của X trong bảng tuần hoàn là:",
              "options": [
                "Ô 16, chu kì 3, nhóm VIA",
                "Ô 16, chu kì 3, nhóm IVA",
                "Ô 16, chu kì 4, nhóm IIIA",
                "Ô 6, chu kì 2, nhóm VIA"
              ],
              "correct": 0,
              "solution": "Z = 16 -> Ô số 16. Có 3 lớp e -> Chu kì 3. Lớp ngoài cùng (lớp 3) có 2 + 4 = 6 electron -> Nhóm VIA.",
              "trapAlert": "Chỉ đếm 4 e ở phân lớp 3p mà quên 2 e ở 3s.",
              "fastTip": "Lớp 3 có 6 e -> Nhóm VIA, chu kì 3."
            },
            {
              "id": "q-c3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các nguyên tố thuộc chu kì 3: $_{11}Na, _{12}Mg, _{13}Al, _{15}P, _{17}Cl$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c3-a",
                  "statement": "a) Thứ tự bán kính nguyên tử giảm dần là: Na > Mg > Al > P > Cl.",
                  "isTrue": true,
                  "explain": "Trong chu kì từ trái sang phải bán kính giảm dần. Đúng."
                },
                {
                  "id": "tf-c3-b",
                  "statement": "b) Độ âm điện của Chlorine là lớn nhất trong dãy trên.",
                  "isTrue": true,
                  "explain": "Độ âm điện tăng dần từ trái sang phải chu kì. Đúng."
                },
                {
                  "id": "tf-c3-c",
                  "statement": "c) Hydroxide có tính base mạnh nhất trong dãy là Al(OH)₃.",
                  "isTrue": false,
                  "explain": "NaOH là base mạnh nhất, Al(OH)₃ là hydroxide lưỡng tính. Sai."
                },
                {
                  "id": "tf-c3-d",
                  "statement": "d) Oxide cao nhất của Chlorine là Cl₂O₇ có tính acid mạnh nhất.",
                  "isTrue": true,
                  "explain": "Từ trái sang phải tính acid của oxide cao nhất tăng dần, Cl₂O₇ ứng với acid cực mạnh HClO₄. Đúng."
                }
              ]
            },
            {
              "id": "q-c3-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hai nguyên tố X và Y đứng kế tiếp nhau trong cùng một chu kì của bảng tuần hoàn có tổng số điện tích hạt nhân là 25 ($Z_X + Z_Y = 25$). Tìm số hiệu nguyên tử Z của nguyên tố có tính kim loại mạnh hơn trong hai nguyên tố đó.",
              "correctAnswer": "12",
              "unit": "",
              "solution": "Hai nguyên tố kế tiếp cùng chu kì: Z_Y - Z_X = 1. Kết hợp Z_X + Z_Y = 25 -> Z_X = 12 (Mg), Z_Y = 13 (Al). Trong chu kì, tính kim loại giảm dần từ trái sang phải nên Mg (Z=12) có tính kim loại mạnh hơn Al (Z=13).",
              "trapAlert": "Chọn Z = 13 thay vì nguyên tố có tính kim loại mạnh hơn (Z = 12)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c3-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nguyên tố X có cấu hình electron: $1s^2 2s^2 2p^6 3s^2 3p^4$. Vị trí của X trong bảng tuần hoàn là:",
              "options": [
                "Ô 16, chu kì 3, nhóm VIA",
                "Ô 16, chu kì 3, nhóm IVA",
                "Ô 16, chu kì 4, nhóm IIIA",
                "Ô 6, chu kì 2, nhóm VIA"
              ],
              "correct": 0,
              "solution": "Z = 16 -> Ô số 16. Có 3 lớp e -> Chu kì 3. Lớp ngoài cùng (lớp 3) có 2 + 4 = 6 electron -> Nhóm VIA.",
              "trapAlert": "Chỉ đếm 4 e ở phân lớp 3p mà quên 2 e ở 3s.",
              "fastTip": "Lớp 3 có 6 e -> Nhóm VIA, chu kì 3."
            },
            {
              "id": "q-c3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các nguyên tố thuộc chu kì 3: $_{11}Na, _{12}Mg, _{13}Al, _{15}P, _{17}Cl$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c3-a",
                  "statement": "a) Thứ tự bán kính nguyên tử giảm dần là: Na > Mg > Al > P > Cl.",
                  "isTrue": true,
                  "explain": "Trong chu kì từ trái sang phải bán kính giảm dần. Đúng."
                },
                {
                  "id": "tf-c3-b",
                  "statement": "b) Độ âm điện của Chlorine là lớn nhất trong dãy trên.",
                  "isTrue": true,
                  "explain": "Độ âm điện tăng dần từ trái sang phải chu kì. Đúng."
                },
                {
                  "id": "tf-c3-c",
                  "statement": "c) Hydroxide có tính base mạnh nhất trong dãy là Al(OH)₃.",
                  "isTrue": false,
                  "explain": "NaOH là base mạnh nhất, Al(OH)₃ là hydroxide lưỡng tính. Sai."
                },
                {
                  "id": "tf-c3-d",
                  "statement": "d) Oxide cao nhất của Chlorine là Cl₂O₇ có tính acid mạnh nhất.",
                  "isTrue": true,
                  "explain": "Từ trái sang phải tính acid của oxide cao nhất tăng dần, Cl₂O₇ ứng với acid cực mạnh HClO₄. Đúng."
                }
              ]
            },
            {
              "id": "q-c3-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hai nguyên tố X và Y đứng kế tiếp nhau trong cùng một chu kì của bảng tuần hoàn có tổng số điện tích hạt nhân là 25 ($Z_X + Z_Y = 25$). Tìm số hiệu nguyên tử Z của nguyên tố có tính kim loại mạnh hơn trong hai nguyên tố đó.",
              "correctAnswer": "12",
              "unit": "",
              "solution": "Hai nguyên tố kế tiếp cùng chu kì: Z_Y - Z_X = 1. Kết hợp Z_X + Z_Y = 25 -> Z_X = 12 (Mg), Z_Y = 13 (Al). Trong chu kì, tính kim loại giảm dần từ trái sang phải nên Mg (Z=12) có tính kim loại mạnh hơn Al (Z=13).",
              "trapAlert": "Chọn Z = 13 thay vì nguyên tố có tính kim loại mạnh hơn (Z = 12)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c10-bonding",
      "chapterNum": "03",
      "chapterName": "Liên kết hóa học",
      "lessons": [
        {
          "id": "hoa-lien-ket-ion-cong-hoa-tri",
          "title": "Quy tắc Octet, Liên kết Ion & Liên kết Cộng hóa trị",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Quy tắc Octet (Bát tử)",
              "desc": "Nguyên tử các nguyên tố có xu hướng đạt cấu hình electron bền vững của khí hiếm với 8 electron ở lớp ngoài cùng (hoặc 2 electron như Helium)."
            },
            {
              "title": "Phân biệt liên kết Ion và Cộng hóa trị",
              "desc": "Liên kết Ion: hình thành do lực hút tĩnh điện giữa cation (kim loại nhường e) và anion (phi kim nhận e), hiệu độ âm điện $\\Delta\\chi \\ge 1{,}7$. Liên kết cộng hóa trị: hình thành bằng các cặp electron dùng chung (không phân cực: $\\Delta\\chi < 0{,}4$; phân cực: $0{,}4 \\le \\Delta\\chi < 1{,}7$). Liên kết hydrogen và tương tác van der Waals là liên kết liên phân tử yếu."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính hiệu độ âm điện Delta chi",
              "instruction": "Lấy độ âm điện nguyên tử lớn hơn trừ nguyên tử nhỏ hơn."
            },
            {
              "step": 2,
              "title": "Xác định loại liên kết",
              "instruction": "So sánh với các mốc 0,4 và 1,7 để kết luận liên kết CHT không cực, phân cực hay liên kết Ion."
            }
          ],
          "formulas": [
            {
              "label": "Hiệu độ âm điện phân loại liên kết",
              "formula": "\\Delta\\chi = |\\chi_A - \\chi_B|",
              "displayLatex": "\\Delta\\chi = |\\chi_A - \\chi_B|",
              "notes": "< 0,4: CHT không phân cực; 0,4 - 1,7: CHT phân cực; >= 1,7: Liên kết Ion."
            },
            {
              "label": "Sự hình thành liên kết ion",
              "formula": "M \\longrightarrow M^{n+} + ne, \\quad X + me \\longrightarrow X^{m-}",
              "displayLatex": "M^{n+} + X^{m-} \\longrightarrow M_m X_n",
              "notes": "Lực hút tĩnh điện giữa các ion mang điện tích trái dấu."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng liên kết giữa kim loại và phi kim LUÔN LUÔN là liên kết ion",
              "avoid": "$AlCl_3$ và $BeCl_2$ có liên kết mang bản chất cộng hóa trị có cực do hiệu độ âm điện nhỏ hơn 1,7."
            },
            {
              "trap": "Quên liên kết hydrogen làm tăng nhiệt độ sôi",
              "avoid": "$H_2O, HF, NH_3$ có nhiệt độ sôi cao bất thường nhờ có liên kết hydrogen liên phân tử bền."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c4-1",
              "front": "Điều kiện để hình thành liên kết hydrogen giữa các phân tử?",
              "back": "Phân tử có nguyên tử H liên kết với nguyên tử có độ âm điện lớn (F, O, N) và còn cặp e tự do."
            },
            {
              "id": "fc-c4-2",
              "front": "Bản chất của liên kết ion là gì?",
              "back": "Lực hút tĩnh điện giữa các ion mang điện tích trái dấu (cation và anion)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c4-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phân tử nào sau đây chứa liên kết cộng hóa trị không phân cực?",
              "options": [
                "N₂",
                "HCl",
                "H₂O",
                "NaCl"
              ],
              "correct": 0,
              "solution": "Trong phân tử N₂ (N ≡ N), hiệu độ âm điện giữa 2 nguyên tử N bằng 0 nên liên kết là cộng hóa trị không phân cực.",
              "trapAlert": "Nhầm HCl hay H₂O là không phân cực (chúng là CHT phân cực).",
              "fastTip": "Hai nguyên tử cùng nguyên tố liên kết với nhau -> CHT không phân cực."
            },
            {
              "id": "q-c4-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho độ âm điện: Na (0,93); Cl (3,16); H (2,20); O (3,44). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c4-a",
                  "statement": "a) Liên kết trong phân tử NaCl là liên kết ion vì hiệu độ âm điện bằng 2,23 >= 1,7.",
                  "isTrue": true,
                  "explain": "3,16 - 0,93 = 2,23 >= 1,7. Đúng."
                },
                {
                  "id": "tf-c4-b",
                  "statement": "b) Liên kết O-H trong phân tử nước là liên kết cộng hóa trị phân cực.",
                  "isTrue": true,
                  "explain": "3,44 - 2,20 = 1,24 (nằm trong khoảng 0,4 đến 1,7). Đúng."
                },
                {
                  "id": "tf-c4-c",
                  "statement": "c) Cặp electron chung trong phân tử HCl bị lệch về phía nguyên tử H.",
                  "isTrue": false,
                  "explain": "Cl có độ âm điện lớn hơn nên cặp e bị lệch về phía Cl. Sai."
                },
                {
                  "id": "tf-c4-d",
                  "statement": "d) Giữa các phân tử nước có liên kết hydrogen liên phân tử giúp nước có nhiệt độ sôi cao.",
                  "isTrue": true,
                  "explain": "H liên kết với O độ âm điện lớn tạo liên kết hydrogen mạnh. Đúng."
                }
              ]
            },
            {
              "id": "q-c4-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trong phân tử khí Nitrogen ($N_2$), hai nguyên tử Nitrogen liên kết với nhau bằng một liên kết ba ($N \\equiv N$). Liên kết ba này được tạo thành từ bao nhiêu liên kết $\\sigma$ (sigma) và bao nhiêu liên kết $\\pi$ (pi)? Hãy tính số liên kết $\\pi$ có trong phân tử $N_2$.",
              "correctAnswer": "2",
              "unit": "liên kết",
              "solution": "Liên kết ba N≡N gồm 1 liên kết sigma bền vững và 2 liên kết pi kém bền hơn.",
              "trapAlert": "Nhầm liên kết ba gồm 3 liên kết pi."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c4-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phân tử nào sau đây chứa liên kết cộng hóa trị không phân cực?",
              "options": [
                "N₂",
                "HCl",
                "H₂O",
                "NaCl"
              ],
              "correct": 0,
              "solution": "Trong phân tử N₂ (N ≡ N), hiệu độ âm điện giữa 2 nguyên tử N bằng 0 nên liên kết là cộng hóa trị không phân cực.",
              "trapAlert": "Nhầm HCl hay H₂O là không phân cực (chúng là CHT phân cực).",
              "fastTip": "Hai nguyên tử cùng nguyên tố liên kết với nhau -> CHT không phân cực."
            },
            {
              "id": "q-c4-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho độ âm điện: Na (0,93); Cl (3,16); H (2,20); O (3,44). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c4-a",
                  "statement": "a) Liên kết trong phân tử NaCl là liên kết ion vì hiệu độ âm điện bằng 2,23 >= 1,7.",
                  "isTrue": true,
                  "explain": "3,16 - 0,93 = 2,23 >= 1,7. Đúng."
                },
                {
                  "id": "tf-c4-b",
                  "statement": "b) Liên kết O-H trong phân tử nước là liên kết cộng hóa trị phân cực.",
                  "isTrue": true,
                  "explain": "3,44 - 2,20 = 1,24 (nằm trong khoảng 0,4 đến 1,7). Đúng."
                },
                {
                  "id": "tf-c4-c",
                  "statement": "c) Cặp electron chung trong phân tử HCl bị lệch về phía nguyên tử H.",
                  "isTrue": false,
                  "explain": "Cl có độ âm điện lớn hơn nên cặp e bị lệch về phía Cl. Sai."
                },
                {
                  "id": "tf-c4-d",
                  "statement": "d) Giữa các phân tử nước có liên kết hydrogen liên phân tử giúp nước có nhiệt độ sôi cao.",
                  "isTrue": true,
                  "explain": "H liên kết với O độ âm điện lớn tạo liên kết hydrogen mạnh. Đúng."
                }
              ]
            },
            {
              "id": "q-c4-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trong phân tử khí Nitrogen ($N_2$), hai nguyên tử Nitrogen liên kết với nhau bằng một liên kết ba ($N \\equiv N$). Liên kết ba này được tạo thành từ bao nhiêu liên kết $\\sigma$ (sigma) và bao nhiêu liên kết $\\pi$ (pi)? Hãy tính số liên kết $\\pi$ có trong phân tử $N_2$.",
              "correctAnswer": "2",
              "unit": "liên kết",
              "solution": "Liên kết ba N≡N gồm 1 liên kết sigma bền vững và 2 liên kết pi kém bền hơn.",
              "trapAlert": "Nhầm liên kết ba gồm 3 liên kết pi."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c4-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phân tử nào sau đây chứa liên kết cộng hóa trị không phân cực?",
              "options": [
                "N₂",
                "HCl",
                "H₂O",
                "NaCl"
              ],
              "correct": 0,
              "solution": "Trong phân tử N₂ (N ≡ N), hiệu độ âm điện giữa 2 nguyên tử N bằng 0 nên liên kết là cộng hóa trị không phân cực.",
              "trapAlert": "Nhầm HCl hay H₂O là không phân cực (chúng là CHT phân cực).",
              "fastTip": "Hai nguyên tử cùng nguyên tố liên kết với nhau -> CHT không phân cực."
            },
            {
              "id": "q-c4-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho độ âm điện: Na (0,93); Cl (3,16); H (2,20); O (3,44). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c4-a",
                  "statement": "a) Liên kết trong phân tử NaCl là liên kết ion vì hiệu độ âm điện bằng 2,23 >= 1,7.",
                  "isTrue": true,
                  "explain": "3,16 - 0,93 = 2,23 >= 1,7. Đúng."
                },
                {
                  "id": "tf-c4-b",
                  "statement": "b) Liên kết O-H trong phân tử nước là liên kết cộng hóa trị phân cực.",
                  "isTrue": true,
                  "explain": "3,44 - 2,20 = 1,24 (nằm trong khoảng 0,4 đến 1,7). Đúng."
                },
                {
                  "id": "tf-c4-c",
                  "statement": "c) Cặp electron chung trong phân tử HCl bị lệch về phía nguyên tử H.",
                  "isTrue": false,
                  "explain": "Cl có độ âm điện lớn hơn nên cặp e bị lệch về phía Cl. Sai."
                },
                {
                  "id": "tf-c4-d",
                  "statement": "d) Giữa các phân tử nước có liên kết hydrogen liên phân tử giúp nước có nhiệt độ sôi cao.",
                  "isTrue": true,
                  "explain": "H liên kết với O độ âm điện lớn tạo liên kết hydrogen mạnh. Đúng."
                }
              ]
            },
            {
              "id": "q-c4-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trong phân tử khí Nitrogen ($N_2$), hai nguyên tử Nitrogen liên kết với nhau bằng một liên kết ba ($N \\equiv N$). Liên kết ba này được tạo thành từ bao nhiêu liên kết $\\sigma$ (sigma) và bao nhiêu liên kết $\\pi$ (pi)? Hãy tính số liên kết $\\pi$ có trong phân tử $N_2$.",
              "correctAnswer": "2",
              "unit": "liên kết",
              "solution": "Liên kết ba N≡N gồm 1 liên kết sigma bền vững và 2 liên kết pi kém bền hơn.",
              "trapAlert": "Nhầm liên kết ba gồm 3 liên kết pi."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c10-redox",
      "chapterNum": "04",
      "chapterName": "Phản ứng oxi hóa – khử",
      "lessons": [
        {
          "id": "hoa-phan-ung-oxh-khu-thang-bang-e",
          "title": "Số oxi hóa & Phương pháp thăng bằng electron",
          "questionsCount": 30,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Định nghĩa chất khử và chất oxi hóa",
              "desc": "Khử cho - O nhận: Chất khử (chất bị oxi hóa) là chất nhường electron (số oxi hóa tăng). Chất oxi hóa (chất bị khử) là chất nhận electron (số oxi hóa giảm)."
            },
            {
              "title": "Định luật bảo toàn electron",
              "desc": "Trong một phản ứng oxi hóa - khử, tổng số electron do chất khử nhường bằng tổng số electron mà chất oxi hóa nhận: $\\sum n_{e\\text{ nhường}} = \\sum n_{e\\text{ nhận}}$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định số oxi hóa biến đổi",
              "instruction": "Tìm nguyên tố có số oxi hóa tăng (chất khử) và giảm (chất oxi hóa)."
            },
            {
              "step": 2,
              "title": "Viết các quá trình nhường nhận e và thăng bằng",
              "instruction": "Nhân hệ số chéo sao cho tổng e nhường = tổng e nhận, sau đó đếm cân bằng môi trường và $H_2O$."
            }
          ],
          "formulas": [
            {
              "label": "Định luật bảo toàn electron",
              "formula": "\\sum n_{\\text{kim loại}} \\times \\text{hóa trị} = \\sum n_{\\text{sản phẩm khử}} \\times \\Delta\\text{SOH}",
              "displayLatex": "\\sum n_e \\text{ nhường} = \\sum n_e \\text{ nhận}",
              "notes": "Cốt lõi giải mọi bài toán oxi hóa khử vô cơ."
            },
            {
              "label": "Quy tắc xác định số oxi hóa",
              "formula": "\\text{Đơn chất} = 0, \\quad H = +1, \\quad O = -2, \\quad \\sum \\text{SOH trong phân tử} = 0",
              "displayLatex": "\\sum \\text{SOH} = 0",
              "notes": "Kim loại kiềm luôn +1, kiềm thổ luôn +2, Al luôn +3."
            }
          ],
          "traps": [
            {
              "trap": "Quên tính phân tử chất oxi hóa đóng vai trò môi trường",
              "avoid": "Trong phản ứng $Cu + HNO_3$, số phân tử $HNO_3$ tạo muối môi trường bằng 2 lần số mol Cu."
            },
            {
              "trap": "Nhầm quá trình oxi hóa với chất oxi hóa",
              "avoid": "Quá trình oxi hóa là quá trình NHƯỜNG electron của CHẤT KHỬ."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c5-1",
              "front": "Khẩu quyết ghi nhớ chất khử và chất oxi hóa?",
              "back": "Khử cho - O nhận (Chất khử cho e, chất oxi hóa nhận e)."
            },
            {
              "id": "fc-c5-2",
              "front": "Quá trình Fe nhường 2e thành Fe²⁺ gọi là quá trình gì?",
              "back": "Quá trình oxi hóa (sự oxi hóa) nguyên tử Fe."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c5-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong phản ứng: $3Cu + 8HNO_3 \\to 3Cu(NO_3)_2 + 2NO + 4H_2O$, tỉ lệ giữa số phân tử $HNO_3$ đóng vai trò chất oxi hóa và số phân tử $HNO_3$ đóng vai trò môi trường là:",
              "options": [
                "1 : 3",
                "3 : 1",
                "1 : 4",
                "2 : 3"
              ],
              "correct": 0,
              "solution": "Trong 8 phân tử HNO₃ phản ứng: 2 phân tử bị khử xuống NO (chất oxi hóa) và 6 phân tử tạo muối Cu(NO₃)₂ (môi trường). Tỉ lệ: 2 / 6 = 1 / 3.",
              "trapAlert": "Nhầm tỉ lệ là 2 : 8 = 1 : 4.",
              "fastTip": "2 NO (oxi hóa) : 6 NO₃⁻ muối (môi trường) = 1 : 3."
            },
            {
              "id": "q-c5-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $2KMnO_4 + 16HCl \\to 2KCl + 2MnCl_2 + 5Cl_2 + 8H_2O$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c5-a",
                  "statement": "a) KMnO₄ là chất oxi hóa, HCl là chất khử.",
                  "isTrue": true,
                  "explain": "Mn(+7) giảm xuống Mn(+2) (chất oxi hóa); Cl(-1) tăng lên Cl2(0) (chất khử). Đúng."
                },
                {
                  "id": "tf-c5-b",
                  "statement": "b) Trong 16 phân tử HCl tham gia phản ứng có 10 phân tử bị oxi hóa.",
                  "isTrue": true,
                  "explain": "10 phân tử Cl(-1) tạo thành 5 Cl2(0), còn 6 phân tử tạo muối KCl và MnCl2 (môi trường). Đúng."
                },
                {
                  "id": "tf-c5-c",
                  "statement": "c) Quá trình $Mn^{+7} + 5e \\to Mn^{+2}$ là quá trình oxi hóa.",
                  "isTrue": false,
                  "explain": "Nhận electron là quá trình KHỬ (sự khử). Sai."
                },
                {
                  "id": "tf-c5-d",
                  "statement": "d) Tổng hệ số nguyên tối giản của tất cả các chất trong phương trình trên là 35.",
                  "isTrue": true,
                  "explain": "2 + 16 + 2 + 2 + 5 + 8 = 35. Đúng."
                }
              ]
            },
            {
              "id": "q-c5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hoàn toàn 5,4 gam Aluminium (Al) vào dung dịch $HNO_3$ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Tính thể tích V của khí NO (đơn vị: lít, ghi số thập phân)?",
              "correctAnswer": "4.958",
              "unit": "lít",
              "solution": "n_Al = 5,4 / 27 = 0,2 mol. Bảo toàn e: 3 * n_Al = 3 * n_NO -> n_NO = 0,2 mol. Thể tích ở đkc (chuẩn GDPT 2018): V = 0,2 * 24,79 = 4,958 lít.",
              "trapAlert": "Nhầm nhân 22,4 thay vì thể tích chuẩn đkc GDPT 2018 là 24,79 l/mol."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c5-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong phản ứng: $3Cu + 8HNO_3 \\to 3Cu(NO_3)_2 + 2NO + 4H_2O$, tỉ lệ giữa số phân tử $HNO_3$ đóng vai trò chất oxi hóa và số phân tử $HNO_3$ đóng vai trò môi trường là:",
              "options": [
                "1 : 3",
                "3 : 1",
                "1 : 4",
                "2 : 3"
              ],
              "correct": 0,
              "solution": "Trong 8 phân tử HNO₃ phản ứng: 2 phân tử bị khử xuống NO (chất oxi hóa) và 6 phân tử tạo muối Cu(NO₃)₂ (môi trường). Tỉ lệ: 2 / 6 = 1 / 3.",
              "trapAlert": "Nhầm tỉ lệ là 2 : 8 = 1 : 4.",
              "fastTip": "2 NO (oxi hóa) : 6 NO₃⁻ muối (môi trường) = 1 : 3."
            },
            {
              "id": "q-c5-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $2KMnO_4 + 16HCl \\to 2KCl + 2MnCl_2 + 5Cl_2 + 8H_2O$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c5-a",
                  "statement": "a) KMnO₄ là chất oxi hóa, HCl là chất khử.",
                  "isTrue": true,
                  "explain": "Mn(+7) giảm xuống Mn(+2) (chất oxi hóa); Cl(-1) tăng lên Cl2(0) (chất khử). Đúng."
                },
                {
                  "id": "tf-c5-b",
                  "statement": "b) Trong 16 phân tử HCl tham gia phản ứng có 10 phân tử bị oxi hóa.",
                  "isTrue": true,
                  "explain": "10 phân tử Cl(-1) tạo thành 5 Cl2(0), còn 6 phân tử tạo muối KCl và MnCl2 (môi trường). Đúng."
                },
                {
                  "id": "tf-c5-c",
                  "statement": "c) Quá trình $Mn^{+7} + 5e \\to Mn^{+2}$ là quá trình oxi hóa.",
                  "isTrue": false,
                  "explain": "Nhận electron là quá trình KHỬ (sự khử). Sai."
                },
                {
                  "id": "tf-c5-d",
                  "statement": "d) Tổng hệ số nguyên tối giản của tất cả các chất trong phương trình trên là 35.",
                  "isTrue": true,
                  "explain": "2 + 16 + 2 + 2 + 5 + 8 = 35. Đúng."
                }
              ]
            },
            {
              "id": "q-c5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hoàn toàn 5,4 gam Aluminium (Al) vào dung dịch $HNO_3$ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Tính thể tích V của khí NO (đơn vị: lít, ghi số thập phân)?",
              "correctAnswer": "4.958",
              "unit": "lít",
              "solution": "n_Al = 5,4 / 27 = 0,2 mol. Bảo toàn e: 3 * n_Al = 3 * n_NO -> n_NO = 0,2 mol. Thể tích ở đkc (chuẩn GDPT 2018): V = 0,2 * 24,79 = 4,958 lít.",
              "trapAlert": "Nhầm nhân 22,4 thay vì thể tích chuẩn đkc GDPT 2018 là 24,79 l/mol."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c5-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong phản ứng: $3Cu + 8HNO_3 \\to 3Cu(NO_3)_2 + 2NO + 4H_2O$, tỉ lệ giữa số phân tử $HNO_3$ đóng vai trò chất oxi hóa và số phân tử $HNO_3$ đóng vai trò môi trường là:",
              "options": [
                "1 : 3",
                "3 : 1",
                "1 : 4",
                "2 : 3"
              ],
              "correct": 0,
              "solution": "Trong 8 phân tử HNO₃ phản ứng: 2 phân tử bị khử xuống NO (chất oxi hóa) và 6 phân tử tạo muối Cu(NO₃)₂ (môi trường). Tỉ lệ: 2 / 6 = 1 / 3.",
              "trapAlert": "Nhầm tỉ lệ là 2 : 8 = 1 : 4.",
              "fastTip": "2 NO (oxi hóa) : 6 NO₃⁻ muối (môi trường) = 1 : 3."
            },
            {
              "id": "q-c5-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $2KMnO_4 + 16HCl \\to 2KCl + 2MnCl_2 + 5Cl_2 + 8H_2O$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c5-a",
                  "statement": "a) KMnO₄ là chất oxi hóa, HCl là chất khử.",
                  "isTrue": true,
                  "explain": "Mn(+7) giảm xuống Mn(+2) (chất oxi hóa); Cl(-1) tăng lên Cl2(0) (chất khử). Đúng."
                },
                {
                  "id": "tf-c5-b",
                  "statement": "b) Trong 16 phân tử HCl tham gia phản ứng có 10 phân tử bị oxi hóa.",
                  "isTrue": true,
                  "explain": "10 phân tử Cl(-1) tạo thành 5 Cl2(0), còn 6 phân tử tạo muối KCl và MnCl2 (môi trường). Đúng."
                },
                {
                  "id": "tf-c5-c",
                  "statement": "c) Quá trình $Mn^{+7} + 5e \\to Mn^{+2}$ là quá trình oxi hóa.",
                  "isTrue": false,
                  "explain": "Nhận electron là quá trình KHỬ (sự khử). Sai."
                },
                {
                  "id": "tf-c5-d",
                  "statement": "d) Tổng hệ số nguyên tối giản của tất cả các chất trong phương trình trên là 35.",
                  "isTrue": true,
                  "explain": "2 + 16 + 2 + 2 + 5 + 8 = 35. Đúng."
                }
              ]
            },
            {
              "id": "q-c5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hoàn toàn 5,4 gam Aluminium (Al) vào dung dịch $HNO_3$ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Tính thể tích V của khí NO (đơn vị: lít, ghi số thập phân)?",
              "correctAnswer": "4.958",
              "unit": "lít",
              "solution": "n_Al = 5,4 / 27 = 0,2 mol. Bảo toàn e: 3 * n_Al = 3 * n_NO -> n_NO = 0,2 mol. Thể tích ở đkc (chuẩn GDPT 2018): V = 0,2 * 24,79 = 4,958 lít.",
              "trapAlert": "Nhầm nhân 22,4 thay vì thể tích chuẩn đkc GDPT 2018 là 24,79 l/mol."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c10-energy",
      "chapterNum": "05",
      "chapterName": "Năng lượng hóa học",
      "lessons": [
        {
          "id": "hoa-nhiet-phan-ung-enthalpy",
          "title": "Nhiệt phản ứng & Biến thiên Enthalpy chuẩn (ΔᵣH°₂₉₈)",
          "questionsCount": 26,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Phản ứng tỏa nhiệt và thu nhiệt",
              "desc": "Phản ứng tỏa nhiệt: giải phóng năng lượng ra môi trường dưới dạng nhiệt, $\\Delta_r H^\\circ_{298} < 0$, hệ trở nên bền hơn. Phản ứng thu nhiệt: hấp thụ năng lượng từ môi trường, $\\Delta_r H^\\circ_{298} > 0$."
            },
            {
              "title": "Nhiệt tạo thành chuẩn (Enthalpy tạo thành chuẩn)",
              "desc": "Biến thiên enthalpy của phản ứng tạo thành 1 mol chất từ các đơn chất ở trạng thái bền nhất: $\\Delta_f H^\\circ_{298}$. Quy ước: $\\Delta_f H^\\circ_{298}$ của đơn chất bền bằng 0 (như $O_2(g), N_2(g), C(graphite)$)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định công thức phù hợp",
              "instruction": "Nếu đề cho nhiệt tạo thành $\\Delta_f H^\\circ_{298}$: Dùng Sản phẩm - Chất đầu. Nếu cho năng lượng liên kết $E_b$: Dùng Chất đầu - Sản phẩm."
            },
            {
              "step": 2,
              "title": "Nhân hệ số tỉ lượng chính xác",
              "instruction": "Bắt buộc nhân hệ số mol của từng chất trước khi tính tổng."
            }
          ],
          "formulas": [
            {
              "label": "Tính biến thiên Enthalpy từ nhiệt tạo thành chuẩn",
              "formula": "\\Delta_r H^\\circ_{298} = \\sum \\Delta_f H^\\circ_{298}(\\text{sản phẩm}) - \\sum \\Delta_f H^\\circ_{298}(\\text{chất đầu})",
              "displayLatex": "\\Delta_r H^\\circ_{298} = \\sum \\nu_{sp} \\Delta_f H^\\circ_{298}(sp) - \\sum \\nu_{cđ} \\Delta_f H^\\circ_{298}(cđ)",
              "notes": "Lấy tổng nhiệt tạo thành của sản phẩm trừ chất đầu (nhớ nhân hệ số tỉ lượng)."
            },
            {
              "label": "Tính biến thiên Enthalpy từ năng lượng liên kết",
              "formula": "\\Delta_r H^\\circ_{298} = \\sum E_b(\\text{chất đầu}) - \\sum E_b(\\text{sản phẩm})",
              "displayLatex": "\\Delta_r H^\\circ_{298} = \\sum E_b(cđ) - \\sum E_b(sp)",
              "notes": "Chỉ áp dụng cho các phản ứng mà tất cả chất đều ở thể khí (g). Ngược thứ tự với nhiệt tạo thành!"
            }
          ],
          "traps": [
            {
              "trap": "Nhầm lẫn thứ tự tính giữa nhiệt tạo thành và năng lượng liên kết",
              "avoid": "Theo $\\Delta_f H$: [Sản phẩm - Chất đầu]. Theo $E_b$: [Chất đầu - Sản phẩm]."
            },
            {
              "trap": "Quên nhân hệ số cân bằng của phương trình",
              "avoid": "Mỗi chất phải nhân với hệ số đứng trước nó trong phương trình hóa học."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c6-1",
              "front": "Dấu của Delta_r H đối với phản ứng tỏa nhiệt?",
              "back": "Delta_r H < 0 (giá trị âm)."
            },
            {
              "id": "fc-c6-2",
              "front": "Nhiệt tạo thành chuẩn của đơn chất bền nhất bằng bao nhiêu?",
              "back": "Bằng 0 kJ/mol theo quy ước quốc tế."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c6-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho phản ứng đốt cháy than: $C(s) + O_2(g) \\to CO_2(g)$ có $\\Delta_r H^\\circ_{298} = -393{,}5\\text{ kJ}$. Khẳng định nào sau đây là ĐÚNG?",
              "options": [
                "Phản ứng trên là phản ứng tỏa nhiệt",
                "Phản ứng trên là phản ứng thu nhiệt",
                "Nhiệt tạo thành chuẩn của CO₂(g) là +393,5 kJ/mol",
                "Nhiệt tạo thành chuẩn của O₂(g) là -393,5 kJ/mol"
              ],
              "correct": 0,
              "solution": "Do Delta_r H < 0 (-393,5 kJ) nên đây là phản ứng tỏa nhiệt mạnh.",
              "trapAlert": "Nhầm dấu nhiệt tạo thành của CO₂ là dương (thực tế là -393,5 kJ/mol).",
              "fastTip": "Delta H < 0 -> TỎA NHIỆT."
            },
            {
              "id": "q-c6-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $CH_4(g) + 2O_2(g) \\to CO_2(g) + 2H_2O(l)$. Biết $\\Delta_f H^\\circ_{298}$ (kJ/mol) của $CH_4(g)$ là -74,8; $CO_2(g)$ là -393,5; $H_2O(l)$ là -285,8. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c6-a",
                  "statement": "a) Nhiệt tạo thành chuẩn của O₂(g) bằng 0 kJ/mol.",
                  "isTrue": true,
                  "explain": "Đơn chất bền O₂(g) có nhiệt tạo thành bằng 0. Đúng."
                },
                {
                  "id": "tf-c6-b",
                  "statement": "b) Biến thiên enthalpy chuẩn của phản ứng là -890,3 kJ.",
                  "isTrue": true,
                  "explain": "Delta_r H = (-393,5 + 2*(-285,8)) - (-74,8) = -965,1 + 74,8 = -890,3 kJ. Đúng."
                },
                {
                  "id": "tf-c6-c",
                  "statement": "c) Đốt cháy hoàn toàn 1 mol methane (CH₄) hấp thụ 890,3 kJ nhiệt từ môi trường.",
                  "isTrue": false,
                  "explain": "Phản ứng tỏa ra 890,3 kJ, không phải hấp thụ. Sai."
                },
                {
                  "id": "tf-c6-d",
                  "statement": "d) Đốt cháy hoàn toàn 16 gam khí methane tỏa ra 890,3 kJ nhiệt lượng.",
                  "isTrue": true,
                  "explain": "16g CH₄ tương ứng đúng 1 mol -> tỏa ra 890,3 kJ nhiệt. Đúng."
                }
              ]
            },
            {
              "id": "q-c6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho các giá trị năng lượng liên kết $E_b$ (kJ/mol): $E_b(H-H) = 436$; $E_b(Cl-Cl) = 243$; $E_b(H-Cl) = 432$. Tính biến thiên enthalpy chuẩn $\\Delta_r H^\\circ_{298}$ của phản ứng: $H_2(g) + Cl_2(g) \\to 2HCl(g)$ (đơn vị: kJ).",
              "correctAnswer": "-185",
              "unit": "kJ",
              "solution": "Delta_r H = [E_b(H-H) + E_b(Cl-Cl)] - 2*E_b(H-Cl) = (436 + 243) - 2 * 432 = 679 - 864 = -185 kJ.",
              "trapAlert": "Quên nhân hệ số 2 của HCl."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c6-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho phản ứng đốt cháy than: $C(s) + O_2(g) \\to CO_2(g)$ có $\\Delta_r H^\\circ_{298} = -393{,}5\\text{ kJ}$. Khẳng định nào sau đây là ĐÚNG?",
              "options": [
                "Phản ứng trên là phản ứng tỏa nhiệt",
                "Phản ứng trên là phản ứng thu nhiệt",
                "Nhiệt tạo thành chuẩn của CO₂(g) là +393,5 kJ/mol",
                "Nhiệt tạo thành chuẩn của O₂(g) là -393,5 kJ/mol"
              ],
              "correct": 0,
              "solution": "Do Delta_r H < 0 (-393,5 kJ) nên đây là phản ứng tỏa nhiệt mạnh.",
              "trapAlert": "Nhầm dấu nhiệt tạo thành của CO₂ là dương (thực tế là -393,5 kJ/mol).",
              "fastTip": "Delta H < 0 -> TỎA NHIỆT."
            },
            {
              "id": "q-c6-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $CH_4(g) + 2O_2(g) \\to CO_2(g) + 2H_2O(l)$. Biết $\\Delta_f H^\\circ_{298}$ (kJ/mol) của $CH_4(g)$ là -74,8; $CO_2(g)$ là -393,5; $H_2O(l)$ là -285,8. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c6-a",
                  "statement": "a) Nhiệt tạo thành chuẩn của O₂(g) bằng 0 kJ/mol.",
                  "isTrue": true,
                  "explain": "Đơn chất bền O₂(g) có nhiệt tạo thành bằng 0. Đúng."
                },
                {
                  "id": "tf-c6-b",
                  "statement": "b) Biến thiên enthalpy chuẩn của phản ứng là -890,3 kJ.",
                  "isTrue": true,
                  "explain": "Delta_r H = (-393,5 + 2*(-285,8)) - (-74,8) = -965,1 + 74,8 = -890,3 kJ. Đúng."
                },
                {
                  "id": "tf-c6-c",
                  "statement": "c) Đốt cháy hoàn toàn 1 mol methane (CH₄) hấp thụ 890,3 kJ nhiệt từ môi trường.",
                  "isTrue": false,
                  "explain": "Phản ứng tỏa ra 890,3 kJ, không phải hấp thụ. Sai."
                },
                {
                  "id": "tf-c6-d",
                  "statement": "d) Đốt cháy hoàn toàn 16 gam khí methane tỏa ra 890,3 kJ nhiệt lượng.",
                  "isTrue": true,
                  "explain": "16g CH₄ tương ứng đúng 1 mol -> tỏa ra 890,3 kJ nhiệt. Đúng."
                }
              ]
            },
            {
              "id": "q-c6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho các giá trị năng lượng liên kết $E_b$ (kJ/mol): $E_b(H-H) = 436$; $E_b(Cl-Cl) = 243$; $E_b(H-Cl) = 432$. Tính biến thiên enthalpy chuẩn $\\Delta_r H^\\circ_{298}$ của phản ứng: $H_2(g) + Cl_2(g) \\to 2HCl(g)$ (đơn vị: kJ).",
              "correctAnswer": "-185",
              "unit": "kJ",
              "solution": "Delta_r H = [E_b(H-H) + E_b(Cl-Cl)] - 2*E_b(H-Cl) = (436 + 243) - 2 * 432 = 679 - 864 = -185 kJ.",
              "trapAlert": "Quên nhân hệ số 2 của HCl."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c6-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho phản ứng đốt cháy than: $C(s) + O_2(g) \\to CO_2(g)$ có $\\Delta_r H^\\circ_{298} = -393{,}5\\text{ kJ}$. Khẳng định nào sau đây là ĐÚNG?",
              "options": [
                "Phản ứng trên là phản ứng tỏa nhiệt",
                "Phản ứng trên là phản ứng thu nhiệt",
                "Nhiệt tạo thành chuẩn của CO₂(g) là +393,5 kJ/mol",
                "Nhiệt tạo thành chuẩn của O₂(g) là -393,5 kJ/mol"
              ],
              "correct": 0,
              "solution": "Do Delta_r H < 0 (-393,5 kJ) nên đây là phản ứng tỏa nhiệt mạnh.",
              "trapAlert": "Nhầm dấu nhiệt tạo thành của CO₂ là dương (thực tế là -393,5 kJ/mol).",
              "fastTip": "Delta H < 0 -> TỎA NHIỆT."
            },
            {
              "id": "q-c6-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $CH_4(g) + 2O_2(g) \\to CO_2(g) + 2H_2O(l)$. Biết $\\Delta_f H^\\circ_{298}$ (kJ/mol) của $CH_4(g)$ là -74,8; $CO_2(g)$ là -393,5; $H_2O(l)$ là -285,8. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c6-a",
                  "statement": "a) Nhiệt tạo thành chuẩn của O₂(g) bằng 0 kJ/mol.",
                  "isTrue": true,
                  "explain": "Đơn chất bền O₂(g) có nhiệt tạo thành bằng 0. Đúng."
                },
                {
                  "id": "tf-c6-b",
                  "statement": "b) Biến thiên enthalpy chuẩn của phản ứng là -890,3 kJ.",
                  "isTrue": true,
                  "explain": "Delta_r H = (-393,5 + 2*(-285,8)) - (-74,8) = -965,1 + 74,8 = -890,3 kJ. Đúng."
                },
                {
                  "id": "tf-c6-c",
                  "statement": "c) Đốt cháy hoàn toàn 1 mol methane (CH₄) hấp thụ 890,3 kJ nhiệt từ môi trường.",
                  "isTrue": false,
                  "explain": "Phản ứng tỏa ra 890,3 kJ, không phải hấp thụ. Sai."
                },
                {
                  "id": "tf-c6-d",
                  "statement": "d) Đốt cháy hoàn toàn 16 gam khí methane tỏa ra 890,3 kJ nhiệt lượng.",
                  "isTrue": true,
                  "explain": "16g CH₄ tương ứng đúng 1 mol -> tỏa ra 890,3 kJ nhiệt. Đúng."
                }
              ]
            },
            {
              "id": "q-c6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho các giá trị năng lượng liên kết $E_b$ (kJ/mol): $E_b(H-H) = 436$; $E_b(Cl-Cl) = 243$; $E_b(H-Cl) = 432$. Tính biến thiên enthalpy chuẩn $\\Delta_r H^\\circ_{298}$ của phản ứng: $H_2(g) + Cl_2(g) \\to 2HCl(g)$ (đơn vị: kJ).",
              "correctAnswer": "-185",
              "unit": "kJ",
              "solution": "Delta_r H = [E_b(H-H) + E_b(Cl-Cl)] - 2*E_b(H-Cl) = (436 + 243) - 2 * 432 = 679 - 864 = -185 kJ.",
              "trapAlert": "Quên nhân hệ số 2 của HCl."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c10-rate",
      "chapterNum": "06",
      "chapterName": "Tốc độ phản ứng",
      "lessons": [
        {
          "id": "hoa-toc-do-phan-ung-yeu-to",
          "title": "Tốc độ phản ứng & Các yếu tố ảnh hưởng",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Khái niệm tốc độ phản ứng",
              "desc": "Đại lượng đặc trưng cho sự biến thiên nồng độ của chất phản ứng hoặc sản phẩm trong một đơn vị thời gian: $\\bar{v} = \\pm \\frac{1}{a} \\frac{\\Delta C}{\\Delta t}$."
            },
            {
              "title": "5 yếu tố ảnh hưởng đến tốc độ phản ứng",
              "desc": "Nồng độ (tăng nồng độ -> tăng số va chạm hiệu quả); Áp suất (chỉ với chất khí); Diện tích tiếp xúc bề mặt (chất rắn nghiền nhỏ -> tăng tốc độ); Nhiệt độ (tăng nhiệt độ -> tăng động năng hạt); Chất xúc tác (làm giảm năng lượng hoạt hóa $E_a$ mà không bị tiêu hao sau phản ứng). Hệ số nhiệt độ Van't Hoff $\\gamma = 2 \\sim 4$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định độ tăng nhiệt độ Delta T",
              "instruction": "Tính số khoảng 10 độ: $n = \\frac{T_2 - T_1}{10}$."
            },
            {
              "step": 2,
              "title": "Tính tốc độ hoặc thời gian phản ứng",
              "instruction": "Tốc độ tăng $k = \\gamma^n$ lần $\\implies$ thời gian phản ứng giảm $k$ lần: $t_2 = t_1 / \\gamma^n$."
            }
          ],
          "formulas": [
            {
              "label": "Quy tắc Van't Hoff về ảnh hưởng của nhiệt độ",
              "formula": "\\frac{v_2}{v_1} = \\gamma^{\\frac{T_2 - T_1}{10}}",
              "displayLatex": "\\frac{v_2}{v_1} = \\gamma^{\\frac{\\Delta T}{10}}",
              "notes": "gamma là hệ số nhiệt độ Van't Hoff (thường từ 2 đến 4)."
            },
            {
              "label": "Tốc độ trung bình của phản ứng",
              "formula": "\\bar{v} = -\\frac{1}{a}\\frac{\\Delta C_A}{\\Delta t} = \\frac{1}{c}\\frac{\\Delta C_C}{\\Delta t}",
              "displayLatex": "\\bar{v} = \\frac{1}{\\nu_i} \\left|\\frac{\\Delta C_i}{\\Delta t}\\right|",
              "notes": "a, c là hệ số tỉ lượng trong phương trình aA -> cC."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm tốc độ tăng với thời gian phản ứng",
              "avoid": "Tốc độ tăng bao nhiêu lần thì thời gian hoàn thành phản ứng GIẢM bấy nhiêu lần."
            },
            {
              "trap": "Quên dấu âm khi tính tốc độ theo chất tham gia",
              "avoid": "Chất tham gia nồng độ giảm dần nên phải có dấu trừ đằng trước để tốc độ luôn dương."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c7-1",
              "front": "Quy tắc Van't Hoff cho biết tốc độ phản ứng thay đổi thế nào khi tăng nhiệt độ lên 10°C?",
              "back": "Tốc độ phản ứng tăng từ 2 đến 4 lần (hệ số gamma)."
            },
            {
              "id": "fc-c7-2",
              "front": "Chất xúc tác làm tăng tốc độ phản ứng bằng cách nào?",
              "back": "Làm giảm năng lượng hoạt hóa (Ea) của phản ứng."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c7-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một phản ứng có hệ số nhiệt độ Van't Hoff $\\gamma = 2$. Khi tăng nhiệt độ từ $20^\\circ\\text{C}$ lên $50^\\circ\\text{C}$, tốc độ phản ứng tăng lên bao nhiêu lần?",
              "options": [
                "8 lần",
                "6 lần",
                "16 lần",
                "3 lần"
              ],
              "correct": 0,
              "solution": "Delta T = 50 - 20 = 30°C. Số khoảng 10°C là 30/10 = 3. Tốc độ tăng: 2^3 = 8 lần.",
              "trapAlert": "Lấy 2 * 3 = 6 lần thay vì lũy thừa 2^3.",
              "fastTip": "gamma^3 = 2^3 = 8."
            },
            {
              "id": "q-c7-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $Zn(s) + 2HCl(aq) \\to ZnCl_2(aq) + H_2(g)$. Xét tính Đúng/Sai của các biện pháp làm tăng tốc độ phản ứng:",
              "subQuestions": [
                {
                  "id": "tf-c7-a",
                  "statement": "a) Thay viên kẽm bằng bột kẽm có cùng khối lượng làm tăng tốc độ thoát khí H₂.",
                  "isTrue": true,
                  "explain": "Bột kẽm tăng diện tích tiếp xúc bề mặt nên phản ứng nhanh hơn. Đúng."
                },
                {
                  "id": "tf-c7-b",
                  "statement": "b) Tăng nồng độ dung dịch HCl từ 1M lên 2M làm tăng tốc độ phản ứng.",
                  "isTrue": true,
                  "explain": "Tăng nồng độ làm tăng tần số va chạm hiệu quả. Đúng."
                },
                {
                  "id": "tf-c7-c",
                  "statement": "c) Đun nóng nhẹ dung dịch phản ứng làm tăng tốc độ phản ứng.",
                  "isTrue": true,
                  "explain": "Tăng nhiệt độ làm tăng tốc độ phản ứng theo quy tắc Van't Hoff. Đúng."
                },
                {
                  "id": "tf-c7-d",
                  "statement": "d) Tăng áp suất chung của hệ làm tăng tốc độ phản ứng trên.",
                  "isTrue": false,
                  "explain": "Chất phản ứng là Zn(rắn) và HCl(dung dịch), không có chất khí tham gia nên áp suất không ảnh hưởng tốc độ phản ứng. Sai."
                }
              ]
            },
            {
              "id": "q-c7-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một phản ứng hóa học ở $30^\\circ\\text{C}$ kết thúc sau 128 phút. Biết hệ số nhiệt độ Van't Hoff của phản ứng là $\\gamma = 2$. Hỏi nếu tiến hành phản ứng đó ở $60^\\circ\\text{C}$ thì thời gian kết thúc phản ứng là bao nhiêu phút?",
              "correctAnswer": "16",
              "unit": "phút",
              "solution": "Delta T = 60 - 30 = 30°C. Tốc độ tăng: 2^(30/10) = 2³ = 8 lần. Thời gian giảm 8 lần: t = 128 / 8 = 16 phút.",
              "trapAlert": "Lấy 128 nhân 8 thay vì chia 8 (tốc độ nhanh hơn thì thời gian phải ngắn đi)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c7-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một phản ứng có hệ số nhiệt độ Van't Hoff $\\gamma = 2$. Khi tăng nhiệt độ từ $20^\\circ\\text{C}$ lên $50^\\circ\\text{C}$, tốc độ phản ứng tăng lên bao nhiêu lần?",
              "options": [
                "8 lần",
                "6 lần",
                "16 lần",
                "3 lần"
              ],
              "correct": 0,
              "solution": "Delta T = 50 - 20 = 30°C. Số khoảng 10°C là 30/10 = 3. Tốc độ tăng: 2^3 = 8 lần.",
              "trapAlert": "Lấy 2 * 3 = 6 lần thay vì lũy thừa 2^3.",
              "fastTip": "gamma^3 = 2^3 = 8."
            },
            {
              "id": "q-c7-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $Zn(s) + 2HCl(aq) \\to ZnCl_2(aq) + H_2(g)$. Xét tính Đúng/Sai của các biện pháp làm tăng tốc độ phản ứng:",
              "subQuestions": [
                {
                  "id": "tf-c7-a",
                  "statement": "a) Thay viên kẽm bằng bột kẽm có cùng khối lượng làm tăng tốc độ thoát khí H₂.",
                  "isTrue": true,
                  "explain": "Bột kẽm tăng diện tích tiếp xúc bề mặt nên phản ứng nhanh hơn. Đúng."
                },
                {
                  "id": "tf-c7-b",
                  "statement": "b) Tăng nồng độ dung dịch HCl từ 1M lên 2M làm tăng tốc độ phản ứng.",
                  "isTrue": true,
                  "explain": "Tăng nồng độ làm tăng tần số va chạm hiệu quả. Đúng."
                },
                {
                  "id": "tf-c7-c",
                  "statement": "c) Đun nóng nhẹ dung dịch phản ứng làm tăng tốc độ phản ứng.",
                  "isTrue": true,
                  "explain": "Tăng nhiệt độ làm tăng tốc độ phản ứng theo quy tắc Van't Hoff. Đúng."
                },
                {
                  "id": "tf-c7-d",
                  "statement": "d) Tăng áp suất chung của hệ làm tăng tốc độ phản ứng trên.",
                  "isTrue": false,
                  "explain": "Chất phản ứng là Zn(rắn) và HCl(dung dịch), không có chất khí tham gia nên áp suất không ảnh hưởng tốc độ phản ứng. Sai."
                }
              ]
            },
            {
              "id": "q-c7-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một phản ứng hóa học ở $30^\\circ\\text{C}$ kết thúc sau 128 phút. Biết hệ số nhiệt độ Van't Hoff của phản ứng là $\\gamma = 2$. Hỏi nếu tiến hành phản ứng đó ở $60^\\circ\\text{C}$ thì thời gian kết thúc phản ứng là bao nhiêu phút?",
              "correctAnswer": "16",
              "unit": "phút",
              "solution": "Delta T = 60 - 30 = 30°C. Tốc độ tăng: 2^(30/10) = 2³ = 8 lần. Thời gian giảm 8 lần: t = 128 / 8 = 16 phút.",
              "trapAlert": "Lấy 128 nhân 8 thay vì chia 8 (tốc độ nhanh hơn thì thời gian phải ngắn đi)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c7-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một phản ứng có hệ số nhiệt độ Van't Hoff $\\gamma = 2$. Khi tăng nhiệt độ từ $20^\\circ\\text{C}$ lên $50^\\circ\\text{C}$, tốc độ phản ứng tăng lên bao nhiêu lần?",
              "options": [
                "8 lần",
                "6 lần",
                "16 lần",
                "3 lần"
              ],
              "correct": 0,
              "solution": "Delta T = 50 - 20 = 30°C. Số khoảng 10°C là 30/10 = 3. Tốc độ tăng: 2^3 = 8 lần.",
              "trapAlert": "Lấy 2 * 3 = 6 lần thay vì lũy thừa 2^3.",
              "fastTip": "gamma^3 = 2^3 = 8."
            },
            {
              "id": "q-c7-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phản ứng: $Zn(s) + 2HCl(aq) \\to ZnCl_2(aq) + H_2(g)$. Xét tính Đúng/Sai của các biện pháp làm tăng tốc độ phản ứng:",
              "subQuestions": [
                {
                  "id": "tf-c7-a",
                  "statement": "a) Thay viên kẽm bằng bột kẽm có cùng khối lượng làm tăng tốc độ thoát khí H₂.",
                  "isTrue": true,
                  "explain": "Bột kẽm tăng diện tích tiếp xúc bề mặt nên phản ứng nhanh hơn. Đúng."
                },
                {
                  "id": "tf-c7-b",
                  "statement": "b) Tăng nồng độ dung dịch HCl từ 1M lên 2M làm tăng tốc độ phản ứng.",
                  "isTrue": true,
                  "explain": "Tăng nồng độ làm tăng tần số va chạm hiệu quả. Đúng."
                },
                {
                  "id": "tf-c7-c",
                  "statement": "c) Đun nóng nhẹ dung dịch phản ứng làm tăng tốc độ phản ứng.",
                  "isTrue": true,
                  "explain": "Tăng nhiệt độ làm tăng tốc độ phản ứng theo quy tắc Van't Hoff. Đúng."
                },
                {
                  "id": "tf-c7-d",
                  "statement": "d) Tăng áp suất chung của hệ làm tăng tốc độ phản ứng trên.",
                  "isTrue": false,
                  "explain": "Chất phản ứng là Zn(rắn) và HCl(dung dịch), không có chất khí tham gia nên áp suất không ảnh hưởng tốc độ phản ứng. Sai."
                }
              ]
            },
            {
              "id": "q-c7-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Một phản ứng hóa học ở $30^\\circ\\text{C}$ kết thúc sau 128 phút. Biết hệ số nhiệt độ Van't Hoff của phản ứng là $\\gamma = 2$. Hỏi nếu tiến hành phản ứng đó ở $60^\\circ\\text{C}$ thì thời gian kết thúc phản ứng là bao nhiêu phút?",
              "correctAnswer": "16",
              "unit": "phút",
              "solution": "Delta T = 60 - 30 = 30°C. Tốc độ tăng: 2^(30/10) = 2³ = 8 lần. Thời gian giảm 8 lần: t = 128 / 8 = 16 phút.",
              "trapAlert": "Lấy 128 nhân 8 thay vì chia 8 (tốc độ nhanh hơn thì thời gian phải ngắn đi)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c10-halogen",
      "chapterNum": "07",
      "chapterName": "Nhóm Halogen",
      "lessons": [
        {
          "id": "hoa-don-chat-halogen-acid",
          "title": "Nhóm Halogen & Hydrogen Halide",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Đặc điểm chung nhóm Halogen (Nhóm VIIA)",
              "desc": "Gồm $F_2, Cl_2, Br_2, I_2$. Có 7 electron lớp ngoài cùng ($ns^2 np^5$), xu hướng nhận thêm 1e để đạt octet bền vững $\\implies$ tính oxi hóa rất mạnh. Tính oxi hóa giảm dần từ F đến I: $F_2 > Cl_2 > Br_2 > I_2$."
            },
            {
              "title": "Hydrogen Halide & Hydrohalic Acid",
              "desc": "Các chất khí tan nhiều trong nước tạo dung dịch hydrohalic acid: $HF, HCl, HBr, HI$. Tính acid tăng dần từ HF đến HI: $HF < HCl < HBr < HI$ (do bán kính tăng làm độ bền liên kết H-X giảm). HF là acid yếu nhưng có tính chất đặc biệt ăn mòn thủy tinh: $SiO_2 + 4HF \\to SiF_4 + 2H_2O$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhớ thứ tự tính khử của halide và tính oxi hóa của halogen",
              "instruction": "Tính oxi hóa: $F_2 > Cl_2 > Br_2 > I_2$. Tính khử của ion halide: $F^- < Cl^- < Br^- < I^-$. Halogen đứng trước đẩy được halogen đứng sau ra khỏi dung dịch muối."
            },
            {
              "step": 2,
              "title": "Thuốc thử nhận biết",
              "instruction": "Dùng dung dịch $AgNO_3$: $F^-$ không hiện tượng, $Cl^-$ kết tủa trắng, $Br^-$ kết tủa vàng nhạt, $I^-$ kết tủa vàng đậm."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng ăn mòn thủy tinh của Hydrofluoric acid",
              "formula": "SiO_2 + 4HF \\longrightarrow SiF_4 \\uparrow + 2H_2O",
              "displayLatex": "SiO_2 + 4HF \\longrightarrow SiF_4 + 2H_2O",
              "notes": "Dùng để khắc chữ lên thủy tinh."
            },
            {
              "label": "Nhận biết ion Halide bằng dung dịch AgNO3",
              "formula": "Ag^+ + X^- \\longrightarrow AgX \\downarrow",
              "displayLatex": "Ag^+ + X^- \\longrightarrow AgX \\downarrow",
              "notes": "AgCl (trắng), AgBr (vàng nhạt), AgI (vàng đậm). AgF tan."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng Flo đẩy được Clo ra khỏi dung dịch muối NaCl",
              "avoid": "Fluorine phản ứng mãnh liệt với NƯỚC trước ($2F_2 + 2H_2O \\to 4HF + O_2$), không thể đẩy Clo ra khỏi dung dịch muối."
            },
            {
              "trap": "Nghĩ rằng AgF kết tủa",
              "avoid": "AgF tan tốt trong nước, chỉ có AgCl, AgBr, AgI mới kết tủa."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c8-1",
              "front": "Acid nào có khả năng hòa tan thủy tinh (SiO₂)?",
              "back": "Hydrofluoric acid (HF)."
            },
            {
              "id": "fc-c8-2",
              "front": "Màu sắc kết tủa của AgCl, AgBr, AgI với AgNO₃?",
              "back": "AgCl kết tủa trắng, AgBr vàng nhạt, AgI vàng đậm."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c8-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dung dịch acid nào sau đây được dùng để khắc chữ, hình vẽ lên bề mặt thủy tinh?",
              "options": [
                "HF",
                "HCl",
                "H₂SO₄",
                "HNO₃"
              ],
              "correct": 0,
              "solution": "HF phản ứng với SiO₂ trong thủy tinh tạo khí SiF₄: SiO₂ + 4HF -> SiF₄ + 2H₂O.",
              "trapAlert": "Nhầm chọn acid mạnh như H₂SO₄ hay HNO₃.",
              "fastTip": "Ăn mòn thủy tinh -> HF."
            },
            {
              "id": "q-c8-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Sục khí Chlorine ($Cl_2$) vào dung dịch chứa hỗn hợp NaBr và NaI. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c8-a",
                  "statement": "a) Chlorine oxi hóa được cả ion Br⁻ và I⁻ ra khỏi dung dịch muối.",
                  "isTrue": true,
                  "explain": "Tính oxi hóa Cl₂ > Br₂ > I₂ nên Cl₂ đẩy được cả 2 ra ngoài. Đúng."
                },
                {
                  "id": "tf-c8-b",
                  "statement": "b) Ion I⁻ bị oxi hóa trước ion Br⁻ vì tính khử của I⁻ mạnh hơn Br⁻.",
                  "isTrue": true,
                  "explain": "Tính khử I⁻ > Br⁻ nên I⁻ phản ứng trước. Đúng."
                },
                {
                  "id": "tf-c8-c",
                  "statement": "c) Khi nhỏ dung dịch hồ tinh bột vào dung dịch sau phản ứng có thể xuất hiện màu xanh tím do tạo I₂.",
                  "isTrue": true,
                  "explain": "I₂ sinh ra gặp hồ tinh bột tạo hợp chất màu xanh tím đặc trưng. Đúng."
                },
                {
                  "id": "tf-c8-d",
                  "statement": "d) Nếu thay Cl₂ bằng Br₂ thì Br₂ đẩy được Cl₂ ra khỏi dung dịch NaCl.",
                  "isTrue": false,
                  "explain": "Tính oxi hóa Br₂ yếu hơn Cl₂ nên không thể đẩy được Cl₂. Sai."
                }
              ]
            },
            {
              "id": "q-c8-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 100 ml dung dịch $AgNO_3$ 1M vào 100 ml dung dịch NaCl 1,5M. Sau khi phản ứng hoàn toàn, khối lượng kết tủa trắng AgCl thu được là bao nhiêu gam (lấy $M_{AgCl} = 143{,}5\\text{ g/mol}$, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "14.4",
              "unit": "gam",
              "solution": "n_AgNO₃ = 0,1 mol; n_NaCl = 0,15 mol. Ag⁺ hết, Cl⁻ dư. n_AgCl = 0,1 mol. Khối lượng m = 0,1 * 143,5 = 14,35 ≈ 14,4 gam.",
              "trapAlert": "Tính theo số mol dư của NaCl."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c8-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dung dịch acid nào sau đây được dùng để khắc chữ, hình vẽ lên bề mặt thủy tinh?",
              "options": [
                "HF",
                "HCl",
                "H₂SO₄",
                "HNO₃"
              ],
              "correct": 0,
              "solution": "HF phản ứng với SiO₂ trong thủy tinh tạo khí SiF₄: SiO₂ + 4HF -> SiF₄ + 2H₂O.",
              "trapAlert": "Nhầm chọn acid mạnh như H₂SO₄ hay HNO₃.",
              "fastTip": "Ăn mòn thủy tinh -> HF."
            },
            {
              "id": "q-c8-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Sục khí Chlorine ($Cl_2$) vào dung dịch chứa hỗn hợp NaBr và NaI. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c8-a",
                  "statement": "a) Chlorine oxi hóa được cả ion Br⁻ và I⁻ ra khỏi dung dịch muối.",
                  "isTrue": true,
                  "explain": "Tính oxi hóa Cl₂ > Br₂ > I₂ nên Cl₂ đẩy được cả 2 ra ngoài. Đúng."
                },
                {
                  "id": "tf-c8-b",
                  "statement": "b) Ion I⁻ bị oxi hóa trước ion Br⁻ vì tính khử của I⁻ mạnh hơn Br⁻.",
                  "isTrue": true,
                  "explain": "Tính khử I⁻ > Br⁻ nên I⁻ phản ứng trước. Đúng."
                },
                {
                  "id": "tf-c8-c",
                  "statement": "c) Khi nhỏ dung dịch hồ tinh bột vào dung dịch sau phản ứng có thể xuất hiện màu xanh tím do tạo I₂.",
                  "isTrue": true,
                  "explain": "I₂ sinh ra gặp hồ tinh bột tạo hợp chất màu xanh tím đặc trưng. Đúng."
                },
                {
                  "id": "tf-c8-d",
                  "statement": "d) Nếu thay Cl₂ bằng Br₂ thì Br₂ đẩy được Cl₂ ra khỏi dung dịch NaCl.",
                  "isTrue": false,
                  "explain": "Tính oxi hóa Br₂ yếu hơn Cl₂ nên không thể đẩy được Cl₂. Sai."
                }
              ]
            },
            {
              "id": "q-c8-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 100 ml dung dịch $AgNO_3$ 1M vào 100 ml dung dịch NaCl 1,5M. Sau khi phản ứng hoàn toàn, khối lượng kết tủa trắng AgCl thu được là bao nhiêu gam (lấy $M_{AgCl} = 143{,}5\\text{ g/mol}$, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "14.4",
              "unit": "gam",
              "solution": "n_AgNO₃ = 0,1 mol; n_NaCl = 0,15 mol. Ag⁺ hết, Cl⁻ dư. n_AgCl = 0,1 mol. Khối lượng m = 0,1 * 143,5 = 14,35 ≈ 14,4 gam.",
              "trapAlert": "Tính theo số mol dư của NaCl."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c8-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dung dịch acid nào sau đây được dùng để khắc chữ, hình vẽ lên bề mặt thủy tinh?",
              "options": [
                "HF",
                "HCl",
                "H₂SO₄",
                "HNO₃"
              ],
              "correct": 0,
              "solution": "HF phản ứng với SiO₂ trong thủy tinh tạo khí SiF₄: SiO₂ + 4HF -> SiF₄ + 2H₂O.",
              "trapAlert": "Nhầm chọn acid mạnh như H₂SO₄ hay HNO₃.",
              "fastTip": "Ăn mòn thủy tinh -> HF."
            },
            {
              "id": "q-c8-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Sục khí Chlorine ($Cl_2$) vào dung dịch chứa hỗn hợp NaBr và NaI. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c8-a",
                  "statement": "a) Chlorine oxi hóa được cả ion Br⁻ và I⁻ ra khỏi dung dịch muối.",
                  "isTrue": true,
                  "explain": "Tính oxi hóa Cl₂ > Br₂ > I₂ nên Cl₂ đẩy được cả 2 ra ngoài. Đúng."
                },
                {
                  "id": "tf-c8-b",
                  "statement": "b) Ion I⁻ bị oxi hóa trước ion Br⁻ vì tính khử của I⁻ mạnh hơn Br⁻.",
                  "isTrue": true,
                  "explain": "Tính khử I⁻ > Br⁻ nên I⁻ phản ứng trước. Đúng."
                },
                {
                  "id": "tf-c8-c",
                  "statement": "c) Khi nhỏ dung dịch hồ tinh bột vào dung dịch sau phản ứng có thể xuất hiện màu xanh tím do tạo I₂.",
                  "isTrue": true,
                  "explain": "I₂ sinh ra gặp hồ tinh bột tạo hợp chất màu xanh tím đặc trưng. Đúng."
                },
                {
                  "id": "tf-c8-d",
                  "statement": "d) Nếu thay Cl₂ bằng Br₂ thì Br₂ đẩy được Cl₂ ra khỏi dung dịch NaCl.",
                  "isTrue": false,
                  "explain": "Tính oxi hóa Br₂ yếu hơn Cl₂ nên không thể đẩy được Cl₂. Sai."
                }
              ]
            },
            {
              "id": "q-c8-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 100 ml dung dịch $AgNO_3$ 1M vào 100 ml dung dịch NaCl 1,5M. Sau khi phản ứng hoàn toàn, khối lượng kết tủa trắng AgCl thu được là bao nhiêu gam (lấy $M_{AgCl} = 143{,}5\\text{ g/mol}$, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "14.4",
              "unit": "gam",
              "solution": "n_AgNO₃ = 0,1 mol; n_NaCl = 0,15 mol. Ag⁺ hết, Cl⁻ dư. n_AgCl = 0,1 mol. Khối lượng m = 0,1 * 143,5 = 14,35 ≈ 14,4 gam.",
              "trapAlert": "Tính theo số mol dư của NaCl."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c11-equilibrium",
      "chapterNum": "01",
      "chapterName": "Cân bằng hóa học",
      "lessons": [
        {
          "id": "hoa-can-bang-dong-le-chatelier",
          "title": "Cân bằng hóa học & Nguyên lí Le Chatelier",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Bản chất cân bằng động",
              "desc": "Trạng thái của phản ứng thuận nghịch khi tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch ($v_t = v_n$). Nồng độ các chất trong hệ không đổi nhưng phản ứng vẫn diễn ra liên tục theo cả 2 chiều."
            },
            {
              "title": "Nguyên lí chuyển dịch cân bằng Le Chatelier",
              "desc": "Một phản ứng thuận nghịch đang ở trạng thái cân bằng khi chịu một tác động từ bên ngoài (nồng độ, nhiệt độ, áp suất) sẽ tự chuyển dịch theo chiều làm giảm tác động đó."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xét tác động của nhiệt độ và nồng độ",
              "instruction": "Tăng chất nào cân bằng dịch sang chiều giảm chất đó (ngược lại). Tăng T dịch theo chiều thu nhiệt ($\\Delta H > 0$)."
            },
            {
              "step": 2,
              "title": "Xét tác động của áp suất",
              "instruction": "Đếm tổng hệ số mol chất KHÍ hai vế. Tăng áp suất $\\implies$ chuyển dịch theo chiều làm GIẢM số mol khí."
            }
          ],
          "formulas": [
            {
              "label": "Hằng số cân bằng KC",
              "formula": "K_C = \\frac{[C]^c [D]^d}{[A]^a [B]^b}",
              "displayLatex": "K_C = \\frac{[C]^c [D]^d}{[A]^a [B]^b}",
              "notes": "Chất rắn không có mặt trong biểu thức KC. KC CHỈ PHỤ THUỘC VÀO NHIỆT ĐỘ."
            },
            {
              "label": "Ảnh hưởng của nhiệt độ theo Le Chatelier",
              "formula": "\\text{Tăng T: Chuyển dịch chiều thu nhiệt } (\\Delta H > 0), \\quad \\text{Giảm T: Chiều tỏa nhiệt } (\\Delta H < 0)",
              "displayLatex": "\\text{Tăng T} \\longrightarrow \\text{Chiều thu nhiệt } (\\Delta H > 0)",
              "notes": "Khẩu quyết: Tăng Thu - Giảm Tỏa."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng chất xúc tác làm chuyển dịch cân bằng",
              "avoid": "Chất xúc tác làm tăng tốc độ phản ứng thuận và nghịch như nhau nên KHÔNG làm chuyển dịch cân bằng, không làm thay đổi KC."
            },
            {
              "trap": "Đưa nồng độ chất rắn vào biểu thức KC",
              "avoid": "Chất rắn có nồng độ coi như không đổi, tuyệt đối không xuất hiện trong biểu thức $K_C$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c9-1",
              "front": "Hằng số cân bằng KC phụ thuộc vào những yếu tố nào?",
              "back": "Chỉ phụ thuộc duy nhất vào bản chất phản ứng và nhiệt độ T (không phụ thuộc nồng độ, áp suất hay xúc tác)."
            },
            {
              "id": "fc-c9-2",
              "front": "Khi tăng nhiệt độ, cân bằng chuyển dịch theo chiều nào?",
              "back": "Chuyển dịch theo chiều phản ứng thu nhiệt (Delta H > 0)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c9-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho cân bằng hóa học: $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$ có $\\Delta_r H^\\circ_{298} = -92\\text{ kJ}$. Cân bằng chuyển dịch theo chiều thuận khi:",
              "options": [
                "Tăng áp suất của hệ phản ứng",
                "Tăng nhiệt độ của hệ phản ứng",
                "Thêm chất xúc tác Fe",
                "Giảm nồng độ khí N₂"
              ],
              "correct": 0,
              "solution": "Chiều thuận làm giảm số mol khí (4 mol khí -> 2 mol khí). Do đó khi tăng áp suất, cân bằng sẽ dịch theo chiều làm giảm số mol khí là chiều thuận.",
              "trapAlert": "Chọn tăng nhiệt độ (chiều thuận tỏa nhiệt nên tăng nhiệt độ sẽ dịch chiều nghịch).",
              "fastTip": "4 mol -> 2 mol: Tăng áp suất chuyển dịch theo chiều thuận."
            },
            {
              "id": "q-c9-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho cân bằng: $2SO_2(g) + O_2(g) \\rightleftharpoons 2SO_3(g)$ có $\\Delta_r H^\\circ_{298} = -198\\text{ kJ}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c9-a",
                  "statement": "a) Phản ứng thuận là phản ứng tỏa nhiệt.",
                  "isTrue": true,
                  "explain": "Delta_r H < 0 (-198 kJ) nên chiều thuận tỏa nhiệt. Đúng."
                },
                {
                  "id": "tf-c9-b",
                  "statement": "b) Hạ nhiệt độ của hệ làm cân bằng chuyển dịch theo chiều thuận.",
                  "isTrue": true,
                  "explain": "Hạ nhiệt độ dịch theo chiều tỏa nhiệt (chiều thuận). Đúng."
                },
                {
                  "id": "tf-c9-c",
                  "statement": "c) Tăng nồng độ khí O₂ làm tăng hiệu suất tổng hợp SO₃.",
                  "isTrue": true,
                  "explain": "Tăng nồng độ chất phản ứng làm cân bằng chuyển dịch theo chiều thuận. Đúng."
                },
                {
                  "id": "tf-c9-d",
                  "statement": "d) Thêm xúc tác V₂O₅ làm tăng giá trị của hằng số cân bằng KC.",
                  "isTrue": false,
                  "explain": "Chất xúc tác không làm thay đổi hằng số cân bằng KC. Sai."
                }
              ]
            },
            {
              "id": "q-c9-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Ở một nhiệt độ T, phản ứng thuận nghịch: $H_2(g) + I_2(g) \\rightleftharpoons 2HI(g)$ có nồng độ cân bằng: $[H_2] = 0{,}1\\text{ M}; [I_2] = 0{,}1\\text{ M}; [HI] = 0{,}8\\text{ M}$. Tính giá trị hằng số cân bằng $K_C$ của phản ứng ở nhiệt độ đó.",
              "correctAnswer": "64",
              "unit": "",
              "solution": "K_C = [HI]² / ([H₂] * [I₂]) = (0,8)² / (0,1 * 0,1) = 0,64 / 0,01 = 64.",
              "trapAlert": "Quên bình phương nồng độ [HI]²."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c9-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho cân bằng hóa học: $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$ có $\\Delta_r H^\\circ_{298} = -92\\text{ kJ}$. Cân bằng chuyển dịch theo chiều thuận khi:",
              "options": [
                "Tăng áp suất của hệ phản ứng",
                "Tăng nhiệt độ của hệ phản ứng",
                "Thêm chất xúc tác Fe",
                "Giảm nồng độ khí N₂"
              ],
              "correct": 0,
              "solution": "Chiều thuận làm giảm số mol khí (4 mol khí -> 2 mol khí). Do đó khi tăng áp suất, cân bằng sẽ dịch theo chiều làm giảm số mol khí là chiều thuận.",
              "trapAlert": "Chọn tăng nhiệt độ (chiều thuận tỏa nhiệt nên tăng nhiệt độ sẽ dịch chiều nghịch).",
              "fastTip": "4 mol -> 2 mol: Tăng áp suất chuyển dịch theo chiều thuận."
            },
            {
              "id": "q-c9-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho cân bằng: $2SO_2(g) + O_2(g) \\rightleftharpoons 2SO_3(g)$ có $\\Delta_r H^\\circ_{298} = -198\\text{ kJ}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c9-a",
                  "statement": "a) Phản ứng thuận là phản ứng tỏa nhiệt.",
                  "isTrue": true,
                  "explain": "Delta_r H < 0 (-198 kJ) nên chiều thuận tỏa nhiệt. Đúng."
                },
                {
                  "id": "tf-c9-b",
                  "statement": "b) Hạ nhiệt độ của hệ làm cân bằng chuyển dịch theo chiều thuận.",
                  "isTrue": true,
                  "explain": "Hạ nhiệt độ dịch theo chiều tỏa nhiệt (chiều thuận). Đúng."
                },
                {
                  "id": "tf-c9-c",
                  "statement": "c) Tăng nồng độ khí O₂ làm tăng hiệu suất tổng hợp SO₃.",
                  "isTrue": true,
                  "explain": "Tăng nồng độ chất phản ứng làm cân bằng chuyển dịch theo chiều thuận. Đúng."
                },
                {
                  "id": "tf-c9-d",
                  "statement": "d) Thêm xúc tác V₂O₅ làm tăng giá trị của hằng số cân bằng KC.",
                  "isTrue": false,
                  "explain": "Chất xúc tác không làm thay đổi hằng số cân bằng KC. Sai."
                }
              ]
            },
            {
              "id": "q-c9-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Ở một nhiệt độ T, phản ứng thuận nghịch: $H_2(g) + I_2(g) \\rightleftharpoons 2HI(g)$ có nồng độ cân bằng: $[H_2] = 0{,}1\\text{ M}; [I_2] = 0{,}1\\text{ M}; [HI] = 0{,}8\\text{ M}$. Tính giá trị hằng số cân bằng $K_C$ của phản ứng ở nhiệt độ đó.",
              "correctAnswer": "64",
              "unit": "",
              "solution": "K_C = [HI]² / ([H₂] * [I₂]) = (0,8)² / (0,1 * 0,1) = 0,64 / 0,01 = 64.",
              "trapAlert": "Quên bình phương nồng độ [HI]²."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c9-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho cân bằng hóa học: $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$ có $\\Delta_r H^\\circ_{298} = -92\\text{ kJ}$. Cân bằng chuyển dịch theo chiều thuận khi:",
              "options": [
                "Tăng áp suất của hệ phản ứng",
                "Tăng nhiệt độ của hệ phản ứng",
                "Thêm chất xúc tác Fe",
                "Giảm nồng độ khí N₂"
              ],
              "correct": 0,
              "solution": "Chiều thuận làm giảm số mol khí (4 mol khí -> 2 mol khí). Do đó khi tăng áp suất, cân bằng sẽ dịch theo chiều làm giảm số mol khí là chiều thuận.",
              "trapAlert": "Chọn tăng nhiệt độ (chiều thuận tỏa nhiệt nên tăng nhiệt độ sẽ dịch chiều nghịch).",
              "fastTip": "4 mol -> 2 mol: Tăng áp suất chuyển dịch theo chiều thuận."
            },
            {
              "id": "q-c9-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho cân bằng: $2SO_2(g) + O_2(g) \\rightleftharpoons 2SO_3(g)$ có $\\Delta_r H^\\circ_{298} = -198\\text{ kJ}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c9-a",
                  "statement": "a) Phản ứng thuận là phản ứng tỏa nhiệt.",
                  "isTrue": true,
                  "explain": "Delta_r H < 0 (-198 kJ) nên chiều thuận tỏa nhiệt. Đúng."
                },
                {
                  "id": "tf-c9-b",
                  "statement": "b) Hạ nhiệt độ của hệ làm cân bằng chuyển dịch theo chiều thuận.",
                  "isTrue": true,
                  "explain": "Hạ nhiệt độ dịch theo chiều tỏa nhiệt (chiều thuận). Đúng."
                },
                {
                  "id": "tf-c9-c",
                  "statement": "c) Tăng nồng độ khí O₂ làm tăng hiệu suất tổng hợp SO₃.",
                  "isTrue": true,
                  "explain": "Tăng nồng độ chất phản ứng làm cân bằng chuyển dịch theo chiều thuận. Đúng."
                },
                {
                  "id": "tf-c9-d",
                  "statement": "d) Thêm xúc tác V₂O₅ làm tăng giá trị của hằng số cân bằng KC.",
                  "isTrue": false,
                  "explain": "Chất xúc tác không làm thay đổi hằng số cân bằng KC. Sai."
                }
              ]
            },
            {
              "id": "q-c9-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Ở một nhiệt độ T, phản ứng thuận nghịch: $H_2(g) + I_2(g) \\rightleftharpoons 2HI(g)$ có nồng độ cân bằng: $[H_2] = 0{,}1\\text{ M}; [I_2] = 0{,}1\\text{ M}; [HI] = 0{,}8\\text{ M}$. Tính giá trị hằng số cân bằng $K_C$ của phản ứng ở nhiệt độ đó.",
              "correctAnswer": "64",
              "unit": "",
              "solution": "K_C = [HI]² / ([H₂] * [I₂]) = (0,8)² / (0,1 * 0,1) = 0,64 / 0,01 = 64.",
              "trapAlert": "Quên bình phương nồng độ [HI]²."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-ph-thuyet-bronsted",
          "title": "Thuyết Acid - Base Brønsted – Lowry & Chỉ số pH",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Thuyết Acid - Base Brønsted - Lowry",
              "desc": "Acid là chất cho proton ($H^+$). Base là chất nhận proton ($H^+$). Chất lưỡng tính (amphoteric) vừa có thể cho vừa có thể nhận proton (như $H_2O, HCO_3^-, HSO_3^-, Al(OH)_3$)."
            },
            {
              "title": "Chỉ số pH và tích số ion của nước",
              "desc": "Ở $25^\\circ\\text{C}$: $K_w = [H^+][OH^-] = 10^{-14}$. $\\text{pH} = -\\log[H^+]$. Môi trường trung tính: $\\text{pH} = 7$; acid: $\\text{pH} < 7$; base: $\\text{pH} > 7$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính số mol H+ hoặc OH-",
              "instruction": "$n_{H^+} = \\sum V_i C_{M,acid} \\times \\text{số } H^+$. $n_{OH^-} = \\sum V_i C_{M,base} \\times \\text{số } OH^-$."
            },
            {
              "step": 2,
              "title": "Tìm ion dư và tính pH",
              "instruction": "Nếu $H^+$ dư: $[H^+]_{dư} = \\frac{n_{H^+} - n_{OH^-}}{V_{tổng}} \\implies \\text{pH} = -\\log[H^+]$. Nếu $OH^-$ dư: $[OH^-]_{dư} \\implies \\text{pOH} \\implies \\text{pH} = 14 - \\text{pOH}$."
            }
          ],
          "formulas": [
            {
              "label": "Định nghĩa pH và mối liên hệ pOH",
              "formula": "\\text{pH} = -\\log[H^+], \\quad \\text{pH} + \\text{pOH} = 14",
              "displayLatex": "\\text{pH} = -\\log[H^+]",
              "notes": "pOH = -log[OH⁻]. Ở 25°C: pH + pOH = 14."
            },
            {
              "label": "Nồng độ ion H+ và OH- theo pH",
              "formula": "[H^+] = 10^{-\\text{pH}}, \\quad [OH^-] = 10^{-(14 - \\text{pH})}",
              "displayLatex": "[H^+] = 10^{-\\text{pH}}",
              "notes": "pH tăng 1 đơn vị thì [H⁺] giảm 10 lần."
            }
          ],
          "traps": [
            {
              "trap": "Quên chia cho tổng thể tích dung dịch sau khi trộn",
              "avoid": "Nồng độ dư phải chia cho $V_{tổng} = V_1 + V_2$."
            },
            {
              "trap": "Nhầm khi tính pH dung dịch kiềm",
              "avoid": "Dung dịch kiềm tính ra $[OH^-] \\implies \\text{pOH}$, sau đó lấy $14 - \\text{pOH}$ mới ra pH."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c10-1",
              "front": "Định nghĩa Acid theo thuyết Brønsted - Lowry?",
              "back": "Acid là chất có khả năng cho proton (H⁺)."
            },
            {
              "id": "fc-c10-2",
              "front": "Dung dịch có pH = 3 có nồng độ ion H+ là bao nhiêu M?",
              "back": "[H⁺] = 10⁻³ M = 0,001 M."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c10-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trộn 100 ml dung dịch HCl 0,1M với 100 ml dung dịch NaOH 0,3M thu được 200 ml dung dịch X. Giá trị pH của dung dịch X ở $25^\\circ\\text{C}$ là:",
              "options": [
                "13",
                "1",
                "12",
                "7"
              ],
              "correct": 0,
              "solution": "n_H⁺ = 0,1 * 0,1 = 0,01 mol; n_OH⁻ = 0,1 * 0,3 = 0,03 mol. OH⁻ dư: 0,03 - 0,01 = 0,02 mol. [OH⁻] = 0,02 / 0,2 = 0,1 M = 10⁻¹ M -> pOH = 1 -> pH = 14 - 1 = 13.",
              "trapAlert": "Nhầm lấy pOH = 1 là kết quả pH.",
              "fastTip": "Dung dịch kiềm dư chắc chắn pH > 7 -> pH = 13."
            },
            {
              "id": "q-c10-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các ion và phân tử: $NH_4^+, CH_3COO^-, HCO_3^-, Al^{3+}, H_2O$. Xét tính Đúng/Sai theo thuyết Brønsted - Lowry:",
              "subQuestions": [
                {
                  "id": "tf-c10-a",
                  "statement": "a) Ion NH₄⁺ đóng vai trò là một acid vì có khả năng cho proton H⁺.",
                  "isTrue": true,
                  "explain": "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (cho H⁺ -> acid). Đúng."
                },
                {
                  "id": "tf-c10-b",
                  "statement": "b) Ion CH₃COO⁻ đóng vai trò là một base vì có khả năng nhận proton H⁺.",
                  "isTrue": true,
                  "explain": "CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (nhận H⁺ -> base). Đúng."
                },
                {
                  "id": "tf-c10-c",
                  "statement": "c) Ion HCO₃⁻ là chất lưỡng tính vì vừa có khả năng cho H⁺ vừa nhận H⁺.",
                  "isTrue": true,
                  "explain": "Vừa tạo CO₃²⁻ vừa tạo H₂CO₃ -> lưỡng tính. Đúng."
                },
                {
                  "id": "tf-c10-d",
                  "statement": "d) Dung dịch muối Na₂CO₃ có môi trường acid làm quỳ tím hóa đỏ.",
                  "isTrue": false,
                  "explain": "CO₃²⁻ tạo môi trường base (pH > 7) làm quỳ tím hóa xanh. Sai."
                }
              ]
            },
            {
              "id": "q-c10-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cần pha loãng dung dịch hydrochloric acid (HCl) có pH = 2 bao nhiêu lần bằng nước cất để thu được dung dịch có pH = 4?",
              "correctAnswer": "100",
              "unit": "lần",
              "solution": "pH = 2 -> [H⁺]₁ = 10⁻² M. pH = 4 -> [H⁺]₂ = 10⁻⁴ M. Số lần pha loãng: [H⁺]₁ / [H⁺]₂ = 10⁻² / 10⁻⁴ = 10² = 100 lần.",
              "trapAlert": "Nhầm 4 - 2 = 2 lần."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c10-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trộn 100 ml dung dịch HCl 0,1M với 100 ml dung dịch NaOH 0,3M thu được 200 ml dung dịch X. Giá trị pH của dung dịch X ở $25^\\circ\\text{C}$ là:",
              "options": [
                "13",
                "1",
                "12",
                "7"
              ],
              "correct": 0,
              "solution": "n_H⁺ = 0,1 * 0,1 = 0,01 mol; n_OH⁻ = 0,1 * 0,3 = 0,03 mol. OH⁻ dư: 0,03 - 0,01 = 0,02 mol. [OH⁻] = 0,02 / 0,2 = 0,1 M = 10⁻¹ M -> pOH = 1 -> pH = 14 - 1 = 13.",
              "trapAlert": "Nhầm lấy pOH = 1 là kết quả pH.",
              "fastTip": "Dung dịch kiềm dư chắc chắn pH > 7 -> pH = 13."
            },
            {
              "id": "q-c10-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các ion và phân tử: $NH_4^+, CH_3COO^-, HCO_3^-, Al^{3+}, H_2O$. Xét tính Đúng/Sai theo thuyết Brønsted - Lowry:",
              "subQuestions": [
                {
                  "id": "tf-c10-a",
                  "statement": "a) Ion NH₄⁺ đóng vai trò là một acid vì có khả năng cho proton H⁺.",
                  "isTrue": true,
                  "explain": "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (cho H⁺ -> acid). Đúng."
                },
                {
                  "id": "tf-c10-b",
                  "statement": "b) Ion CH₃COO⁻ đóng vai trò là một base vì có khả năng nhận proton H⁺.",
                  "isTrue": true,
                  "explain": "CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (nhận H⁺ -> base). Đúng."
                },
                {
                  "id": "tf-c10-c",
                  "statement": "c) Ion HCO₃⁻ là chất lưỡng tính vì vừa có khả năng cho H⁺ vừa nhận H⁺.",
                  "isTrue": true,
                  "explain": "Vừa tạo CO₃²⁻ vừa tạo H₂CO₃ -> lưỡng tính. Đúng."
                },
                {
                  "id": "tf-c10-d",
                  "statement": "d) Dung dịch muối Na₂CO₃ có môi trường acid làm quỳ tím hóa đỏ.",
                  "isTrue": false,
                  "explain": "CO₃²⁻ tạo môi trường base (pH > 7) làm quỳ tím hóa xanh. Sai."
                }
              ]
            },
            {
              "id": "q-c10-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cần pha loãng dung dịch hydrochloric acid (HCl) có pH = 2 bao nhiêu lần bằng nước cất để thu được dung dịch có pH = 4?",
              "correctAnswer": "100",
              "unit": "lần",
              "solution": "pH = 2 -> [H⁺]₁ = 10⁻² M. pH = 4 -> [H⁺]₂ = 10⁻⁴ M. Số lần pha loãng: [H⁺]₁ / [H⁺]₂ = 10⁻² / 10⁻⁴ = 10² = 100 lần.",
              "trapAlert": "Nhầm 4 - 2 = 2 lần."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c10-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trộn 100 ml dung dịch HCl 0,1M với 100 ml dung dịch NaOH 0,3M thu được 200 ml dung dịch X. Giá trị pH của dung dịch X ở $25^\\circ\\text{C}$ là:",
              "options": [
                "13",
                "1",
                "12",
                "7"
              ],
              "correct": 0,
              "solution": "n_H⁺ = 0,1 * 0,1 = 0,01 mol; n_OH⁻ = 0,1 * 0,3 = 0,03 mol. OH⁻ dư: 0,03 - 0,01 = 0,02 mol. [OH⁻] = 0,02 / 0,2 = 0,1 M = 10⁻¹ M -> pOH = 1 -> pH = 14 - 1 = 13.",
              "trapAlert": "Nhầm lấy pOH = 1 là kết quả pH.",
              "fastTip": "Dung dịch kiềm dư chắc chắn pH > 7 -> pH = 13."
            },
            {
              "id": "q-c10-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các ion và phân tử: $NH_4^+, CH_3COO^-, HCO_3^-, Al^{3+}, H_2O$. Xét tính Đúng/Sai theo thuyết Brønsted - Lowry:",
              "subQuestions": [
                {
                  "id": "tf-c10-a",
                  "statement": "a) Ion NH₄⁺ đóng vai trò là một acid vì có khả năng cho proton H⁺.",
                  "isTrue": true,
                  "explain": "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (cho H⁺ -> acid). Đúng."
                },
                {
                  "id": "tf-c10-b",
                  "statement": "b) Ion CH₃COO⁻ đóng vai trò là một base vì có khả năng nhận proton H⁺.",
                  "isTrue": true,
                  "explain": "CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (nhận H⁺ -> base). Đúng."
                },
                {
                  "id": "tf-c10-c",
                  "statement": "c) Ion HCO₃⁻ là chất lưỡng tính vì vừa có khả năng cho H⁺ vừa nhận H⁺.",
                  "isTrue": true,
                  "explain": "Vừa tạo CO₃²⁻ vừa tạo H₂CO₃ -> lưỡng tính. Đúng."
                },
                {
                  "id": "tf-c10-d",
                  "statement": "d) Dung dịch muối Na₂CO₃ có môi trường acid làm quỳ tím hóa đỏ.",
                  "isTrue": false,
                  "explain": "CO₃²⁻ tạo môi trường base (pH > 7) làm quỳ tím hóa xanh. Sai."
                }
              ]
            },
            {
              "id": "q-c10-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cần pha loãng dung dịch hydrochloric acid (HCl) có pH = 2 bao nhiêu lần bằng nước cất để thu được dung dịch có pH = 4?",
              "correctAnswer": "100",
              "unit": "lần",
              "solution": "pH = 2 -> [H⁺]₁ = 10⁻² M. pH = 4 -> [H⁺]₂ = 10⁻⁴ M. Số lần pha loãng: [H⁺]₁ / [H⁺]₂ = 10⁻² / 10⁻⁴ = 10² = 100 lần.",
              "trapAlert": "Nhầm 4 - 2 = 2 lần."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-ester",
      "chapterNum": "02",
      "chapterName": "Ester – Lipid",
      "lessons": [
        {
          "id": "hoa-ester-dong-phan-danh-phap",
          "title": "Ester: Đồng phân, Danh pháp IUPAC & Tính chất",
          "desc": "Quy tắc gọi tên gốc hydrocarbon R' + tên anion acid RCOO- (thay đuôi -ic bằng -ate), đồng phân cấu tạo và nhiệt độ sôi.",
          "duration": "25 phút",
          "tag": "Cơ bản",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Định nghĩa và Danh pháp IUPAC của Ester",
              "desc": "Khi thay thế nhóm -OH ở nhóm carboxyl của carboxylic acid bằng nhóm -OR' thì thu được ester: $R-COO-R'$ ($R' \\ne H$). Tên gọi = Tên gốc hydrocarbon $R'$ (gốc alcohol) + Tên gốc carboxylate (đuôi -ate). Ví dụ: $CH_3COOC_2H_5$ là Ethyl acetate."
            },
            {
              "title": "Tính chất vật lí & Đồng phân của Ester",
              "desc": "Ester không có liên kết hydrogen liên phân tử nên nhiệt độ sôi thấp hơn alcohol và acid có cùng khối lượng, nhẹ hơn nước, ít tan trong nước, thường có mùi thơm hoa quả đặc trưng (Isoamyl acetate: mùi chuối chín; Ethyl butyrate: mùi dứa; Benzyl acetate: mùi hoa nhài). Ester no, đơn chức, mạch hở: $C_n H_{2n} O_2$ ($n \\ge 2$)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Gọi tên ester theo chuẩn IUPAC",
              "instruction": "Đọc gốc R' đính trực tiếp với nguyên tử O trước (đuôi -yl), sau đó đọc gốc acid $R-COO-$ (đuôi -ate)."
            },
            {
              "step": 2,
              "title": "Viết các đồng phân ester",
              "instruction": "Bắt đầu từ acid fomic $HCOO-R'$, tăng dần C ở gốc acid và giảm C ở gốc alcohol."
            }
          ],
          "formulas": [
            {
              "label": "Công thức số đồng phân ester no đơn chức mạch hở",
              "formula": "2^{n - 2} \\quad (2 \\le n < 5)",
              "displayLatex": "2^{n - 2} \\quad (n = 2, 3, 4)",
              "notes": "C₂H₄O₂ có 1; C₃H₆O₂ có 2; C₄H₈O₂ có 4 đồng phân ester."
            },
            {
              "label": "Mối quan hệ khối lượng phân tử",
              "formula": "M = 14n + 32",
              "displayLatex": "M_{C_n H_{2n} O_2} = 14n + 32",
              "notes": "n = 2 (60 amu), n = 3 (74 amu), n = 4 (88 amu)."
            }
          ],
          "traps": [
            {
              "trap": "Đọc ngược tên gốc acid trước gốc alcohol",
              "avoid": "Tên IUPAC bắt buộc đọc gốc ALCOHOL trước (Ethyl acetate, KHÔNG đọc là Acetate ethyl)."
            },
            {
              "trap": "Nhầm đồng phân ester với đồng phân carboxylic acid",
              "avoid": "$C_n H_{2n} O_2$ vừa có đồng phân ester vừa có đồng phân acid. Đề hỏi \"đồng phân ester\" thì không tính acid."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c21-1",
              "front": "Isoamyl acetate có mùi thơm đặc trưng của quả gì?",
              "back": "Mùi thơm của chuối chín."
            },
            {
              "id": "fc-c21-2",
              "front": "Hợp chất C₄H₈O₂ có bao nhiêu đồng phân ester?",
              "back": "Có 4 đồng phân ester (HCOOC₃H₇ có 2, CH₃COOC₂H₅ có 1, C₂H₅COOCH₃ có 1)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c21-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ester có công thức cấu tạo thu gọn $CH_3COOCH_3$ có tên gọi theo danh pháp quốc tế IUPAC là:",
              "options": [
                "Methyl acetate",
                "Ethyl acetate",
                "Methyl formate",
                "Dimethyl ester"
              ],
              "correct": 0,
              "solution": "Gốc -CH₃ đính với O là methyl, gốc CH₃COO- là acetate -> Methyl acetate.",
              "trapAlert": "Nhầm với Methyl formate (HCOOCH₃).",
              "fastTip": "CH₃ (methyl) + CH₃COO (acetate) -> Methyl acetate."
            },
            {
              "id": "q-c21-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các hợp chất có cùng công thức phân tử $C_3H_6O_2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c21-a",
                  "statement": "a) Có 2 đồng phân cấu tạo thuộc loại ester.",
                  "isTrue": true,
                  "explain": "Gồm HCOOC₂H₅ (ethyl formate) và CH₃COOCH₃ (methyl acetate). Đúng."
                },
                {
                  "id": "tf-c21-b",
                  "statement": "b) Có 1 đồng phân cấu tạo thuộc loại carboxylic acid.",
                  "isTrue": true,
                  "explain": "CH₃CH₂COOH (propanoic acid). Đúng."
                },
                {
                  "id": "tf-c21-c",
                  "statement": "c) Nhiệt độ sôi của ethyl formate cao hơn propanoic acid.",
                  "isTrue": false,
                  "explain": "Acid có liên kết hydrogen liên phân tử bền nên nhiệt độ sôi cao hơn ester nhiều. Sai."
                },
                {
                  "id": "tf-c21-d",
                  "statement": "d) Cả 2 đồng phân ester của C₃H₆O₂ đều tham gia được phản ứng tráng bạc.",
                  "isTrue": false,
                  "explain": "Chỉ có ethyl formate (HCOOC₂H₅) mới tráng bạc được vì có nhóm HCOO-, methyl acetate thì không. Sai."
                }
              ]
            },
            {
              "id": "q-c21-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Thực hiện phản ứng ester hóa hoàn toàn giữa ethylene glycol ($C_2H_4(OH)_2$) và acetic acid ($CH_3COOH$) thu được diester mạch hở. Tính phân tử khối của diester đó (đơn vị: amu)?",
              "correctAnswer": "146",
              "unit": "amu",
              "solution": "Công thức diester: (CH₃COO)₂C₂H₄ -> C₆H₁₀O₄ -> M = 12*6 + 10 + 16*4 = 72 + 10 + 64 = 146 amu.",
              "trapAlert": "Nhầm ester đơn chức."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c21-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ester có công thức cấu tạo thu gọn $CH_3COOCH_3$ có tên gọi theo danh pháp quốc tế IUPAC là:",
              "options": [
                "Methyl acetate",
                "Ethyl acetate",
                "Methyl formate",
                "Dimethyl ester"
              ],
              "correct": 0,
              "solution": "Gốc -CH₃ đính với O là methyl, gốc CH₃COO- là acetate -> Methyl acetate.",
              "trapAlert": "Nhầm với Methyl formate (HCOOCH₃).",
              "fastTip": "CH₃ (methyl) + CH₃COO (acetate) -> Methyl acetate."
            },
            {
              "id": "q-c21-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các hợp chất có cùng công thức phân tử $C_3H_6O_2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c21-a",
                  "statement": "a) Có 2 đồng phân cấu tạo thuộc loại ester.",
                  "isTrue": true,
                  "explain": "Gồm HCOOC₂H₅ (ethyl formate) và CH₃COOCH₃ (methyl acetate). Đúng."
                },
                {
                  "id": "tf-c21-b",
                  "statement": "b) Có 1 đồng phân cấu tạo thuộc loại carboxylic acid.",
                  "isTrue": true,
                  "explain": "CH₃CH₂COOH (propanoic acid). Đúng."
                },
                {
                  "id": "tf-c21-c",
                  "statement": "c) Nhiệt độ sôi của ethyl formate cao hơn propanoic acid.",
                  "isTrue": false,
                  "explain": "Acid có liên kết hydrogen liên phân tử bền nên nhiệt độ sôi cao hơn ester nhiều. Sai."
                },
                {
                  "id": "tf-c21-d",
                  "statement": "d) Cả 2 đồng phân ester của C₃H₆O₂ đều tham gia được phản ứng tráng bạc.",
                  "isTrue": false,
                  "explain": "Chỉ có ethyl formate (HCOOC₂H₅) mới tráng bạc được vì có nhóm HCOO-, methyl acetate thì không. Sai."
                }
              ]
            },
            {
              "id": "q-c21-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Thực hiện phản ứng ester hóa hoàn toàn giữa ethylene glycol ($C_2H_4(OH)_2$) và acetic acid ($CH_3COOH$) thu được diester mạch hở. Tính phân tử khối của diester đó (đơn vị: amu)?",
              "correctAnswer": "146",
              "unit": "amu",
              "solution": "Công thức diester: (CH₃COO)₂C₂H₄ -> C₆H₁₀O₄ -> M = 12*6 + 10 + 16*4 = 72 + 10 + 64 = 146 amu.",
              "trapAlert": "Nhầm ester đơn chức."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c21-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Ester có công thức cấu tạo thu gọn $CH_3COOCH_3$ có tên gọi theo danh pháp quốc tế IUPAC là:",
              "options": [
                "Methyl acetate",
                "Ethyl acetate",
                "Methyl formate",
                "Dimethyl ester"
              ],
              "correct": 0,
              "solution": "Gốc -CH₃ đính với O là methyl, gốc CH₃COO- là acetate -> Methyl acetate.",
              "trapAlert": "Nhầm với Methyl formate (HCOOCH₃).",
              "fastTip": "CH₃ (methyl) + CH₃COO (acetate) -> Methyl acetate."
            },
            {
              "id": "q-c21-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các hợp chất có cùng công thức phân tử $C_3H_6O_2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c21-a",
                  "statement": "a) Có 2 đồng phân cấu tạo thuộc loại ester.",
                  "isTrue": true,
                  "explain": "Gồm HCOOC₂H₅ (ethyl formate) và CH₃COOCH₃ (methyl acetate). Đúng."
                },
                {
                  "id": "tf-c21-b",
                  "statement": "b) Có 1 đồng phân cấu tạo thuộc loại carboxylic acid.",
                  "isTrue": true,
                  "explain": "CH₃CH₂COOH (propanoic acid). Đúng."
                },
                {
                  "id": "tf-c21-c",
                  "statement": "c) Nhiệt độ sôi của ethyl formate cao hơn propanoic acid.",
                  "isTrue": false,
                  "explain": "Acid có liên kết hydrogen liên phân tử bền nên nhiệt độ sôi cao hơn ester nhiều. Sai."
                },
                {
                  "id": "tf-c21-d",
                  "statement": "d) Cả 2 đồng phân ester của C₃H₆O₂ đều tham gia được phản ứng tráng bạc.",
                  "isTrue": false,
                  "explain": "Chỉ có ethyl formate (HCOOC₂H₅) mới tráng bạc được vì có nhóm HCOO-, methyl acetate thì không. Sai."
                }
              ]
            },
            {
              "id": "q-c21-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Thực hiện phản ứng ester hóa hoàn toàn giữa ethylene glycol ($C_2H_4(OH)_2$) và acetic acid ($CH_3COOH$) thu được diester mạch hở. Tính phân tử khối của diester đó (đơn vị: amu)?",
              "correctAnswer": "146",
              "unit": "amu",
              "solution": "Công thức diester: (CH₃COO)₂C₂H₄ -> C₆H₁₀O₄ -> M = 12*6 + 10 + 16*4 = 72 + 10 + 64 = 146 amu.",
              "trapAlert": "Nhầm ester đơn chức."
            }
          ],
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-phuong-phap-giai-toan-ester-lipid",
          "title": "Phương pháp giải toán Thủy phân & Xà phòng hóa Ester - Lipid",
          "desc": "Bảo toàn khối lượng, bảo toàn nguyên tố oxy, tỉ lệ $n_{NaOH} / n_X$ xác định ester đa chức hay ester của phenol, và bài toán đốt cháy chất béo.",
          "duration": "35 phút",
          "tag": "Vận dụng",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Định luật bảo toàn khối lượng trong thủy phân",
              "desc": "Thủy phân trong môi trường kiềm (Xà phòng hóa): $m_{\\text{ester}} + m_{NaOH} = m_{\\text{muối}} + m_{\\text{alcohol}}$. Với ester đơn chức: $n_{\\text{ester}} = n_{NaOH} = n_{\\text{alcohol}} = n_{\\text{muối}}$."
            },
            {
              "title": "Ester đặc biệt: Ester của phenol & Ester không no",
              "desc": "Ester của phenol ($R-COO-C_6H_5$): tác dụng với $NaOH$ theo tỉ lệ $1 : 2$, sinh ra 2 muối và $H_2O$ (không sinh ra alcohol). Ester khi thủy phân tạo aldehyde (gốc alcohol có nối đôi ở $C_1$: $R-COO-CH=CH-R'$) hoặc ketone."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Lập tỉ lệ mol NaOH / Ester",
              "instruction": "Nếu tỉ lệ = 1: ester thông thường. Nếu tỉ lệ = 2 và tạo nước: ester của phenol."
            },
            {
              "step": 2,
              "title": "Áp dụng bảo toàn khối lượng",
              "instruction": "$m_{\\text{muối}} = m_{\\text{ester}} + m_{NaOH} - m_{\\text{alcohol}}$. Tìm khối lượng mol phân tử để suy ra gốc R và R'."
            }
          ],
          "formulas": [
            {
              "label": "Bảo toàn khối lượng phản ứng xà phòng hóa",
              "formula": "m_{\\text{ester}} + m_{NaOH} = m_{\\text{chất rắn}} + m_{\\text{alcohol}}",
              "displayLatex": "m_{\\text{ester}} + m_{NaOH} = m_{\\text{chất rắn}} + m_{\\text{ancol}}",
              "notes": "Chất rắn khan khi cô cạn gồm muối và NaOH dư."
            },
            {
              "label": "Dấu hiệu ester của phenol",
              "formula": "n_{NaOH} = 2 n_{\\text{ester}} \\implies R-COO-C_6H_4-R' + 2NaOH \\longrightarrow R-COONa + R'-C_6H_4ONa + H_2O",
              "displayLatex": "n_{NaOH} / n_{\\text{ester}} = 2",
              "notes": "Sinh ra 1 phân tử nước thay vì alcohol."
            }
          ],
          "traps": [
            {
              "trap": "Quên NaOH dư khi cô cạn dung dịch sau phản ứng",
              "avoid": "Đề bài cho \"cô cạn dung dịch thu được m gam chất rắn\" thì chất rắn gồm CẢ muối VÀ NaOH dư."
            },
            {
              "trap": "Cộng thêm alcohol khi xà phòng hóa ester của phenol",
              "avoid": "Ester của phenol sinh ra $H_2O$, không sinh ra alcohol."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c22-1",
              "front": "Dấu hiệu nhận biết ester của phenol trong bài toán xà phòng hóa?",
              "back": "Tỉ lệ mol n_NaOH / n_ester = 2 và sau phản ứng sinh ra nước (không có alcohol)."
            },
            {
              "id": "fc-c22-2",
              "front": "Ester nào khi xà phòng hóa sinh ra aldehyde?",
              "back": "Ester có liên kết đôi C=C đính trực tiếp với nguyên tử oxy (R-COO-CH=CH-R')."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c22-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Xà phòng hóa hoàn toàn 8,8 gam ethyl acetate ($CH_3COOC_2H_5$) bằng 100 ml dung dịch NaOH 1,2M. Cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là:",
              "options": [
                "9,0 gam",
                "8,2 gam",
                "12,2 gam",
                "9,8 gam"
              ],
              "correct": 0,
              "solution": "n_ester = 8,8 / 88 = 0,1 mol. n_NaOH ban đầu = 0,12 mol -> NaOH dư = 0,02 mol. Muối CH₃COONa: 0,1 mol -> m_muối = 0,1 * 82 = 8,2 gam. m_rắn = m_muối + m_NaOH_dư = 8,2 + 0,02 * 40 = 8,2 + 0,8 = 9,0 gam.",
              "trapAlert": "Chỉ tính khối lượng muối (8,2g) mà quên cộng NaOH dư.",
              "fastTip": "8,2 + 0,8 = 9,0 gam."
            },
            {
              "id": "q-c22-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thủy phân hoàn toàn ester đơn chức X có công thức phân tử $C_8H_8O_2$ bằng dung dịch NaOH dư, đun nóng. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c22-a",
                  "statement": "a) Nếu X là phenyl acetate (CH₃COOC₆H₅) thì 1 mol X phản ứng tối đa với 2 mol NaOH.",
                  "isTrue": true,
                  "explain": "Ester của phenol tác dụng NaOH tỉ lệ 1:2. Đúng."
                },
                {
                  "id": "tf-c22-b",
                  "statement": "b) Nếu X phản ứng NaOH sinh ra alcohol thì alcohol đó có thể là benzyl alcohol (C₆H₅CH₂OH).",
                  "isTrue": true,
                  "explain": "HCOOCH₂C₆H₅ thủy phân sinh ra benzyl alcohol. Đúng."
                },
                {
                  "id": "tf-c22-c",
                  "statement": "c) Có đúng 4 đồng phân cấu tạo của C₈H₈O₂ là ester của phenol.",
                  "isTrue": true,
                  "explain": "Gồm CH₃COOC₆H₅ và HCOOC₆H₄CH₃ (o-, m-, p-): tổng 4 đồng phân. Đúng."
                },
                {
                  "id": "tf-c22-d",
                  "statement": "d) Tất cả các đồng phân ester của C₈H₈O₂ đều tham gia được phản ứng tráng bạc.",
                  "isTrue": false,
                  "explain": "Chỉ các ester của formic acid (HCOO-) mới tráng bạc được. Sai."
                }
              ]
            },
            {
              "id": "q-c22-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Xà phòng hóa hoàn toàn 13,6 gam phenyl acetate ($CH_3COOC_6H_5$) bằng lượng dư dung dịch NaOH. Tính tổng khối lượng hai muối hữu cơ khan thu được sau khi cô cạn dung dịch (đơn vị: gam)?",
              "correctAnswer": "19.8",
              "unit": "gam",
              "solution": "n_ester = 13,6 / 136 = 0,1 mol. Phản ứng: CH₃COOC₆H₅ + 2NaOH -> CH₃COONa (0,1 mol) + C₆H₅ONa (0,1 mol) + H₂O. m_muối = 0,1 * 82 + 0,1 * 116 = 8,2 + 11,6 = 19,8 gam.",
              "trapAlert": "Quên muối thứ hai (sodium phenolate C₆H₅ONa M = 116)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c22-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Xà phòng hóa hoàn toàn 8,8 gam ethyl acetate ($CH_3COOC_2H_5$) bằng 100 ml dung dịch NaOH 1,2M. Cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là:",
              "options": [
                "9,0 gam",
                "8,2 gam",
                "12,2 gam",
                "9,8 gam"
              ],
              "correct": 0,
              "solution": "n_ester = 8,8 / 88 = 0,1 mol. n_NaOH ban đầu = 0,12 mol -> NaOH dư = 0,02 mol. Muối CH₃COONa: 0,1 mol -> m_muối = 0,1 * 82 = 8,2 gam. m_rắn = m_muối + m_NaOH_dư = 8,2 + 0,02 * 40 = 8,2 + 0,8 = 9,0 gam.",
              "trapAlert": "Chỉ tính khối lượng muối (8,2g) mà quên cộng NaOH dư.",
              "fastTip": "8,2 + 0,8 = 9,0 gam."
            },
            {
              "id": "q-c22-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thủy phân hoàn toàn ester đơn chức X có công thức phân tử $C_8H_8O_2$ bằng dung dịch NaOH dư, đun nóng. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c22-a",
                  "statement": "a) Nếu X là phenyl acetate (CH₃COOC₆H₅) thì 1 mol X phản ứng tối đa với 2 mol NaOH.",
                  "isTrue": true,
                  "explain": "Ester của phenol tác dụng NaOH tỉ lệ 1:2. Đúng."
                },
                {
                  "id": "tf-c22-b",
                  "statement": "b) Nếu X phản ứng NaOH sinh ra alcohol thì alcohol đó có thể là benzyl alcohol (C₆H₅CH₂OH).",
                  "isTrue": true,
                  "explain": "HCOOCH₂C₆H₅ thủy phân sinh ra benzyl alcohol. Đúng."
                },
                {
                  "id": "tf-c22-c",
                  "statement": "c) Có đúng 4 đồng phân cấu tạo của C₈H₈O₂ là ester của phenol.",
                  "isTrue": true,
                  "explain": "Gồm CH₃COOC₆H₅ và HCOOC₆H₄CH₃ (o-, m-, p-): tổng 4 đồng phân. Đúng."
                },
                {
                  "id": "tf-c22-d",
                  "statement": "d) Tất cả các đồng phân ester của C₈H₈O₂ đều tham gia được phản ứng tráng bạc.",
                  "isTrue": false,
                  "explain": "Chỉ các ester của formic acid (HCOO-) mới tráng bạc được. Sai."
                }
              ]
            },
            {
              "id": "q-c22-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Xà phòng hóa hoàn toàn 13,6 gam phenyl acetate ($CH_3COOC_6H_5$) bằng lượng dư dung dịch NaOH. Tính tổng khối lượng hai muối hữu cơ khan thu được sau khi cô cạn dung dịch (đơn vị: gam)?",
              "correctAnswer": "19.8",
              "unit": "gam",
              "solution": "n_ester = 13,6 / 136 = 0,1 mol. Phản ứng: CH₃COOC₆H₅ + 2NaOH -> CH₃COONa (0,1 mol) + C₆H₅ONa (0,1 mol) + H₂O. m_muối = 0,1 * 82 + 0,1 * 116 = 8,2 + 11,6 = 19,8 gam.",
              "trapAlert": "Quên muối thứ hai (sodium phenolate C₆H₅ONa M = 116)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c22-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Xà phòng hóa hoàn toàn 8,8 gam ethyl acetate ($CH_3COOC_2H_5$) bằng 100 ml dung dịch NaOH 1,2M. Cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là:",
              "options": [
                "9,0 gam",
                "8,2 gam",
                "12,2 gam",
                "9,8 gam"
              ],
              "correct": 0,
              "solution": "n_ester = 8,8 / 88 = 0,1 mol. n_NaOH ban đầu = 0,12 mol -> NaOH dư = 0,02 mol. Muối CH₃COONa: 0,1 mol -> m_muối = 0,1 * 82 = 8,2 gam. m_rắn = m_muối + m_NaOH_dư = 8,2 + 0,02 * 40 = 8,2 + 0,8 = 9,0 gam.",
              "trapAlert": "Chỉ tính khối lượng muối (8,2g) mà quên cộng NaOH dư.",
              "fastTip": "8,2 + 0,8 = 9,0 gam."
            },
            {
              "id": "q-c22-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Thủy phân hoàn toàn ester đơn chức X có công thức phân tử $C_8H_8O_2$ bằng dung dịch NaOH dư, đun nóng. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c22-a",
                  "statement": "a) Nếu X là phenyl acetate (CH₃COOC₆H₅) thì 1 mol X phản ứng tối đa với 2 mol NaOH.",
                  "isTrue": true,
                  "explain": "Ester của phenol tác dụng NaOH tỉ lệ 1:2. Đúng."
                },
                {
                  "id": "tf-c22-b",
                  "statement": "b) Nếu X phản ứng NaOH sinh ra alcohol thì alcohol đó có thể là benzyl alcohol (C₆H₅CH₂OH).",
                  "isTrue": true,
                  "explain": "HCOOCH₂C₆H₅ thủy phân sinh ra benzyl alcohol. Đúng."
                },
                {
                  "id": "tf-c22-c",
                  "statement": "c) Có đúng 4 đồng phân cấu tạo của C₈H₈O₂ là ester của phenol.",
                  "isTrue": true,
                  "explain": "Gồm CH₃COOC₆H₅ và HCOOC₆H₄CH₃ (o-, m-, p-): tổng 4 đồng phân. Đúng."
                },
                {
                  "id": "tf-c22-d",
                  "statement": "d) Tất cả các đồng phân ester của C₈H₈O₂ đều tham gia được phản ứng tráng bạc.",
                  "isTrue": false,
                  "explain": "Chỉ các ester của formic acid (HCOO-) mới tráng bạc được. Sai."
                }
              ]
            },
            {
              "id": "q-c22-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Xà phòng hóa hoàn toàn 13,6 gam phenyl acetate ($CH_3COOC_6H_5$) bằng lượng dư dung dịch NaOH. Tính tổng khối lượng hai muối hữu cơ khan thu được sau khi cô cạn dung dịch (đơn vị: gam)?",
              "correctAnswer": "19.8",
              "unit": "gam",
              "solution": "n_ester = 13,6 / 136 = 0,1 mol. Phản ứng: CH₃COOC₆H₅ + 2NaOH -> CH₃COONa (0,1 mol) + C₆H₅ONa (0,1 mol) + H₂O. m_muối = 0,1 * 82 + 0,1 * 116 = 8,2 + 11,6 = 19,8 gam.",
              "trapAlert": "Quên muối thứ hai (sodium phenolate C₆H₅ONa M = 116)."
            }
          ],
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-ester-xa-phong-hoa",
          "title": "Cấu tạo & Cơ chế Phản ứng Xà phòng hóa",
          "questionsCount": 36,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Thủy phân Ester trong môi trường Acid",
              "desc": "Phản ứng thuận nghịch: $R-COO-R' + H_2O \\xrightleftharpoons{H^+, t^\\circ} R-COOH + R'-OH$. Hiệu suất luôn nhỏ hơn 100%, hỗn hợp sau phản ứng phân lớp."
            },
            {
              "title": "Thủy phân Ester trong môi trường Kiềm (Xà phòng hóa)",
              "desc": "Phản ứng một chiều: $R-COO-R' + NaOH \\xrightarrow{t^\\circ} R-COONa + R'-OH$. Muối carboxylate tạo thành không phản ứng ngược lại với alcohol."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhận diện môi trường phản ứng",
              "instruction": "Có $H_2SO_4$ loãng: phản ứng thuận nghịch. Có $NaOH/KOH$: phản ứng một chiều hoàn toàn."
            },
            {
              "step": 2,
              "title": "Hiện tượng sau phản ứng",
              "instruction": "Sau khi xà phòng hóa hoàn toàn, dung dịch trở nên đồng nhất (không còn phân lớp)."
            }
          ],
          "formulas": [
            {
              "label": "Thủy phân môi trường acid (Thuận nghịch)",
              "formula": "R-COO-R' + H_2O \\xrightleftharpoons{H_2SO_4, t^\\circ} R-COOH + R'-OH",
              "displayLatex": "R-COOR' + H_2O \\xrightleftharpoons{H^+, t^\\circ} R-COOH + R'-OH",
              "notes": "Cần acid vô cơ làm xúc tác và đun nóng."
            },
            {
              "label": "Xà phòng hóa (Một chiều)",
              "formula": "R-COO-R' + NaOH \\xrightarrow{t^\\circ} R-COONa + R'-OH",
              "displayLatex": "R-COOR' + NaOH \\xrightarrow{t^\\circ} R-COONa + R'-OH",
              "notes": "Phản ứng hoàn toàn, không thuận nghịch."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm phản ứng xà phòng hóa là phản ứng thuận nghịch",
              "avoid": "Xà phòng hóa trong môi trường kiềm là phản ứng MỘT CHIỀU HOÀN TOÀN."
            },
            {
              "trap": "Quên thêm NaCl bão hòa để tách xà phòng",
              "avoid": "Thêm dung dịch NaCl bão hòa làm tăng khối lượng riêng dung dịch và giảm độ tan của muối natri, giúp xà phòng nổi lên."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c23-1",
              "front": "Phản ứng thủy phân ester trong môi trường kiềm là phản ứng một chiều hay thuận nghịch?",
              "back": "Là phản ứng một chiều hoàn toàn."
            },
            {
              "id": "fc-c23-2",
              "front": "Vai trò của dung dịch NaCl bão hòa trong thí nghiệm xà phòng hóa?",
              "back": "Làm giảm độ tan của xà phòng (muối natri của acid béo), giúp xà phòng kết tinh nổi lên trên."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c23-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong thí nghiệm xà phòng hóa chất béo bằng dung dịch NaOH, sau khi đun sôi nhẹ và khuấy đều hỗn hợp, người ta thêm dung dịch NaCl bão hòa vào nhằm mục đích:",
              "options": [
                "Làm xà phòng kết tinh và nổi lên trên mặt dung dịch",
                "Làm tăng tốc độ phản ứng xà phòng hóa",
                "Hòa tan hoàn toàn chất béo còn dư",
                "Giữ cho nhiệt độ phản ứng không đổi"
              ],
              "correct": 0,
              "solution": "Muối sodium của acid béo ít tan trong dung dịch NaCl bão hòa nên bị đẩy ra và nổi lên trên thành mảng xà phòng.",
              "trapAlert": "Chọn làm tăng tốc độ phản ứng (NaCl không phải chất xúc tác).",
              "fastTip": "Thêm NaCl bão hòa -> Tách xà phòng nổi lên."
            },
            {
              "id": "q-c23-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành hai thí nghiệm thủy phân ethyl acetate: Ống 1 thủy phân bằng dung dịch $H_2SO_4$ loãng; Ống 2 thủy phân bằng dung dịch NaOH. Cả hai ống đều đun nóng nhẹ. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c23-a",
                  "statement": "a) Sau phản ứng, chất lỏng trong ống 1 vẫn bị phân thành hai lớp.",
                  "isTrue": true,
                  "explain": "Phản ứng thuận nghịch nên ester còn dư nổi lên trên phân lớp. Đúng."
                },
                {
                  "id": "tf-c23-b",
                  "statement": "b) Sau phản ứng, chất lỏng trong ống 2 trở nên đồng nhất.",
                  "isTrue": true,
                  "explain": "Xà phòng hóa hoàn toàn sinh ra muối và alcohol đều tan tốt trong nước. Đúng."
                },
                {
                  "id": "tf-c23-c",
                  "statement": "c) Phản ứng ở cả 2 ống nghiệm đều là phản ứng thuận nghịch.",
                  "isTrue": false,
                  "explain": "Ống 2 (môi trường kiềm) là phản ứng một chiều hoàn toàn. Sai."
                },
                {
                  "id": "tf-c23-d",
                  "statement": "d) Khí bay ra ở cả 2 ống nghiệm đều có mùi thơm của chuối chín.",
                  "isTrue": false,
                  "explain": "Ethyl acetate có mùi thơm đặc trưng của quả lê hoặc sơn móng tay, không phải chuối chín. Sai."
                }
              ]
            },
            {
              "id": "q-c23-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 7,4 gam methyl acetate ($CH_3COOCH_3$) với 100 ml dung dịch NaOH 1M. Sau khi phản ứng hoàn toàn, khối lượng muối thu được là bao nhiêu gam?",
              "correctAnswer": "8.2",
              "unit": "gam",
              "solution": "n_ester = 7,4 / 74 = 0,1 mol; n_NaOH = 0,1 mol (vừa đủ). Muối CH₃COONa = 0,1 mol -> m = 0,1 * 82 = 8,2 gam.",
              "trapAlert": "Nhầm khối lượng phân tử ester."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c23-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong thí nghiệm xà phòng hóa chất béo bằng dung dịch NaOH, sau khi đun sôi nhẹ và khuấy đều hỗn hợp, người ta thêm dung dịch NaCl bão hòa vào nhằm mục đích:",
              "options": [
                "Làm xà phòng kết tinh và nổi lên trên mặt dung dịch",
                "Làm tăng tốc độ phản ứng xà phòng hóa",
                "Hòa tan hoàn toàn chất béo còn dư",
                "Giữ cho nhiệt độ phản ứng không đổi"
              ],
              "correct": 0,
              "solution": "Muối sodium của acid béo ít tan trong dung dịch NaCl bão hòa nên bị đẩy ra và nổi lên trên thành mảng xà phòng.",
              "trapAlert": "Chọn làm tăng tốc độ phản ứng (NaCl không phải chất xúc tác).",
              "fastTip": "Thêm NaCl bão hòa -> Tách xà phòng nổi lên."
            },
            {
              "id": "q-c23-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành hai thí nghiệm thủy phân ethyl acetate: Ống 1 thủy phân bằng dung dịch $H_2SO_4$ loãng; Ống 2 thủy phân bằng dung dịch NaOH. Cả hai ống đều đun nóng nhẹ. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c23-a",
                  "statement": "a) Sau phản ứng, chất lỏng trong ống 1 vẫn bị phân thành hai lớp.",
                  "isTrue": true,
                  "explain": "Phản ứng thuận nghịch nên ester còn dư nổi lên trên phân lớp. Đúng."
                },
                {
                  "id": "tf-c23-b",
                  "statement": "b) Sau phản ứng, chất lỏng trong ống 2 trở nên đồng nhất.",
                  "isTrue": true,
                  "explain": "Xà phòng hóa hoàn toàn sinh ra muối và alcohol đều tan tốt trong nước. Đúng."
                },
                {
                  "id": "tf-c23-c",
                  "statement": "c) Phản ứng ở cả 2 ống nghiệm đều là phản ứng thuận nghịch.",
                  "isTrue": false,
                  "explain": "Ống 2 (môi trường kiềm) là phản ứng một chiều hoàn toàn. Sai."
                },
                {
                  "id": "tf-c23-d",
                  "statement": "d) Khí bay ra ở cả 2 ống nghiệm đều có mùi thơm của chuối chín.",
                  "isTrue": false,
                  "explain": "Ethyl acetate có mùi thơm đặc trưng của quả lê hoặc sơn móng tay, không phải chuối chín. Sai."
                }
              ]
            },
            {
              "id": "q-c23-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 7,4 gam methyl acetate ($CH_3COOCH_3$) với 100 ml dung dịch NaOH 1M. Sau khi phản ứng hoàn toàn, khối lượng muối thu được là bao nhiêu gam?",
              "correctAnswer": "8.2",
              "unit": "gam",
              "solution": "n_ester = 7,4 / 74 = 0,1 mol; n_NaOH = 0,1 mol (vừa đủ). Muối CH₃COONa = 0,1 mol -> m = 0,1 * 82 = 8,2 gam.",
              "trapAlert": "Nhầm khối lượng phân tử ester."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c23-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Trong thí nghiệm xà phòng hóa chất béo bằng dung dịch NaOH, sau khi đun sôi nhẹ và khuấy đều hỗn hợp, người ta thêm dung dịch NaCl bão hòa vào nhằm mục đích:",
              "options": [
                "Làm xà phòng kết tinh và nổi lên trên mặt dung dịch",
                "Làm tăng tốc độ phản ứng xà phòng hóa",
                "Hòa tan hoàn toàn chất béo còn dư",
                "Giữ cho nhiệt độ phản ứng không đổi"
              ],
              "correct": 0,
              "solution": "Muối sodium của acid béo ít tan trong dung dịch NaCl bão hòa nên bị đẩy ra và nổi lên trên thành mảng xà phòng.",
              "trapAlert": "Chọn làm tăng tốc độ phản ứng (NaCl không phải chất xúc tác).",
              "fastTip": "Thêm NaCl bão hòa -> Tách xà phòng nổi lên."
            },
            {
              "id": "q-c23-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành hai thí nghiệm thủy phân ethyl acetate: Ống 1 thủy phân bằng dung dịch $H_2SO_4$ loãng; Ống 2 thủy phân bằng dung dịch NaOH. Cả hai ống đều đun nóng nhẹ. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c23-a",
                  "statement": "a) Sau phản ứng, chất lỏng trong ống 1 vẫn bị phân thành hai lớp.",
                  "isTrue": true,
                  "explain": "Phản ứng thuận nghịch nên ester còn dư nổi lên trên phân lớp. Đúng."
                },
                {
                  "id": "tf-c23-b",
                  "statement": "b) Sau phản ứng, chất lỏng trong ống 2 trở nên đồng nhất.",
                  "isTrue": true,
                  "explain": "Xà phòng hóa hoàn toàn sinh ra muối và alcohol đều tan tốt trong nước. Đúng."
                },
                {
                  "id": "tf-c23-c",
                  "statement": "c) Phản ứng ở cả 2 ống nghiệm đều là phản ứng thuận nghịch.",
                  "isTrue": false,
                  "explain": "Ống 2 (môi trường kiềm) là phản ứng một chiều hoàn toàn. Sai."
                },
                {
                  "id": "tf-c23-d",
                  "statement": "d) Khí bay ra ở cả 2 ống nghiệm đều có mùi thơm của chuối chín.",
                  "isTrue": false,
                  "explain": "Ethyl acetate có mùi thơm đặc trưng của quả lê hoặc sơn móng tay, không phải chuối chín. Sai."
                }
              ]
            },
            {
              "id": "q-c23-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 7,4 gam methyl acetate ($CH_3COOCH_3$) với 100 ml dung dịch NaOH 1M. Sau khi phản ứng hoàn toàn, khối lượng muối thu được là bao nhiêu gam?",
              "correctAnswer": "8.2",
              "unit": "gam",
              "solution": "n_ester = 7,4 / 74 = 0,1 mol; n_NaOH = 0,1 mol (vừa đủ). Muối CH₃COONa = 0,1 mol -> m = 0,1 * 82 = 8,2 gam.",
              "trapAlert": "Nhầm khối lượng phân tử ester."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-lipid-chat-beo-xa-phong",
          "title": "Chất béo (Triglyceride), Xà phòng & Chất giặt rửa",
          "questionsCount": 26,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Định nghĩa & Cấu tạo Triglyceride",
              "desc": "Chất béo là triester của glycerol với các acid béo (acid carboxylic đơn chức, mạch carbon dài không phân nhánh, có số chẵn nguyên tử C từ 12 đến 24). Công thức chung: $(RCOO)_3C_3H_5$."
            },
            {
              "title": "Các acid béo quan trọng & Trạng thái",
              "desc": "Acid béo no: Palmitic acid ($C_{15}H_{31}COOH, M=256$), Stearic acid ($C_{17}H_{35}COOH, M=284$) $\\implies$ chất béo rắn (mỡ động vật). Acid béo không no: Oleic acid ($C_{17}H_{33}COOH$, 1 nối đôi cis), Linoleic acid ($C_{17}H_{31}COOH$, 2 nối đôi) $\\implies$ chất béo lỏng (dầu thực vật). Hydro hóa dầu lỏng xúc tác Ni tạo mỡ rắn (bơ nhân tạo)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính số mol glycerol",
              "instruction": "$n_{\\text{glycerol}} = \\frac{1}{3} n_{NaOH} = n_{\\text{chất béo}}$."
            },
            {
              "step": 2,
              "title": "Áp dụng bảo toàn khối lượng",
              "instruction": "$m_{\\text{muối (xà phòng)}} = m_{\\text{chất béo}} + 40 \\times n_{NaOH} - 92 \\times n_{\\text{glycerol}}$."
            }
          ],
          "formulas": [
            {
              "label": "Phương trình xà phòng hóa chất béo",
              "formula": "(RCOO)_3C_3H_5 + 3NaOH \\xrightarrow{t^\\circ} 3RCOONa + C_3H_5(OH)_3",
              "displayLatex": "(RCOO)_3C_3H_5 + 3NaOH \\longrightarrow 3RCOONa + C_3H_5(OH)_3",
              "notes": "Luôn tạo ra glycerol theo tỉ lệ mol 1 : 1."
            },
            {
              "label": "Bảo toàn khối lượng phản ứng xà phòng hóa chất béo",
              "formula": "m_{\\text{chất béo}} + m_{NaOH} = m_{\\text{xà phòng}} + m_{\\text{glycerol}}",
              "displayLatex": "m_{\\text{chất béo}} + m_{NaOH} = m_{\\text{xà phòng}} + m_{\\text{glycerol}}",
              "notes": "n_NaOH = 3 * n_glycerol = 3 * n_chất béo."
            }
          ],
          "traps": [
            {
              "trap": "Quên hệ số 3 của NaOH trong phương trình",
              "avoid": "Chất béo là triester nên phản ứng với $3 NaOH$ tạo $1 C_3H_5(OH)_3$."
            },
            {
              "trap": "Nhầm oleic acid là acid béo no",
              "avoid": "Oleic acid ($C_{17}H_{33}COOH$) có 1 liên kết đôi $C=C$, làm mất màu nước bromine và có thể hydro hóa."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c24-1",
              "front": "Công thức phân tử của Tripalmitin và Tristearin?",
              "back": "Tripalmitin: (C₁₅H₃₁COO)₃C₃H₅ (M = 806). Tristearin: (C₁₇H₃₅COO)₃C₃H₅ (M = 890)."
            },
            {
              "id": "fc-c24-2",
              "front": "Phản ứng hydro hóa chất béo lỏng dùng để sản xuất sản phẩm gì?",
              "back": "Sản xuất bơ nhân tạo (chuyển dầu thực vật lỏng thành mỡ rắn)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c24-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất béo nào sau đây ở trạng thái lỏng ở nhiệt độ phòng ($25^\\circ\\text{C}$)?",
              "options": [
                "Triolein",
                "Tristearin",
                "Tripalmitin",
                "Trimyristin"
              ],
              "correct": 0,
              "solution": "Triolein ((C₁₇H₃₃COO)₃C₃H₅) cấu tạo từ gốc acid béo không no nên ở thể lỏng ở nhiệt độ thường.",
              "trapAlert": "Nhầm Tristearin hay Tripalmitin (chúng là chất béo no, thể rắn).",
              "fastTip": "Gốc không no (Oleic, Linoleic) -> thể LỎNG."
            },
            {
              "id": "q-c24-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét chất béo Triolein có công thức $(C_{17}H_{33}COO)_3C_3H_5$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c24-a",
                  "statement": "a) 1 mol Triolein tác dụng tối đa với 3 mol Br₂ trong dung dịch.",
                  "isTrue": true,
                  "explain": "Mỗi gốc C₁₇H₃₃- có 1 liên kết đôi C=C -> 3 gốc cộng 3 Br₂. Đúng."
                },
                {
                  "id": "tf-c24-b",
                  "statement": "b) Hydro hóa hoàn toàn Triolein bằng khí H₂ (xúc tác Ni, đun nóng) thu được Tristearin.",
                  "isTrue": true,
                  "explain": "(C₁₇H₃₃COO)₃C₃H₅ + 3H₂ -> (C₁₇H₃₅COO)₃C₃H₅. Đúng."
                },
                {
                  "id": "tf-c24-c",
                  "statement": "c) Xà phòng hóa Triolein bằng dung dịch KOH thu được glycerol và xà phòng mềm.",
                  "isTrue": true,
                  "explain": "Muối potassium của acid béo là xà phòng mềm. Đúng."
                },
                {
                  "id": "tf-c24-d",
                  "statement": "d) Hiện tượng dầu mỡ bị ôi thiu là do liên kết ester bị thủy phân hoàn toàn.",
                  "isTrue": false,
                  "explain": "Do liên kết đôi C=C bị oxi hóa chậm bởi oxygen không khí tạo các hợp chất peroxide, aldehyde có mùi khó chịu. Sai."
                }
              ]
            },
            {
              "id": "q-c24-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Xà phòng hóa hoàn toàn 8,9 gam tristearin ($(C_{17}H_{35}COO)_3C_3H_5$) bằng lượng vừa đủ dung dịch NaOH. Khối lượng glycerol thu được sau phản ứng là bao nhiêu gam (ghi số thập phân)?",
              "correctAnswer": "0.92",
              "unit": "gam",
              "solution": "M_tristearin = 890 g/mol -> n = 8,9 / 890 = 0,01 mol. n_glycerol = 0,01 mol -> m = 0,01 * 92 = 0,92 gam.",
              "trapAlert": "Nhầm khối lượng phân tử glycerol là 93."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c24-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất béo nào sau đây ở trạng thái lỏng ở nhiệt độ phòng ($25^\\circ\\text{C}$)?",
              "options": [
                "Triolein",
                "Tristearin",
                "Tripalmitin",
                "Trimyristin"
              ],
              "correct": 0,
              "solution": "Triolein ((C₁₇H₃₃COO)₃C₃H₅) cấu tạo từ gốc acid béo không no nên ở thể lỏng ở nhiệt độ thường.",
              "trapAlert": "Nhầm Tristearin hay Tripalmitin (chúng là chất béo no, thể rắn).",
              "fastTip": "Gốc không no (Oleic, Linoleic) -> thể LỎNG."
            },
            {
              "id": "q-c24-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét chất béo Triolein có công thức $(C_{17}H_{33}COO)_3C_3H_5$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c24-a",
                  "statement": "a) 1 mol Triolein tác dụng tối đa với 3 mol Br₂ trong dung dịch.",
                  "isTrue": true,
                  "explain": "Mỗi gốc C₁₇H₃₃- có 1 liên kết đôi C=C -> 3 gốc cộng 3 Br₂. Đúng."
                },
                {
                  "id": "tf-c24-b",
                  "statement": "b) Hydro hóa hoàn toàn Triolein bằng khí H₂ (xúc tác Ni, đun nóng) thu được Tristearin.",
                  "isTrue": true,
                  "explain": "(C₁₇H₃₃COO)₃C₃H₅ + 3H₂ -> (C₁₇H₃₅COO)₃C₃H₅. Đúng."
                },
                {
                  "id": "tf-c24-c",
                  "statement": "c) Xà phòng hóa Triolein bằng dung dịch KOH thu được glycerol và xà phòng mềm.",
                  "isTrue": true,
                  "explain": "Muối potassium của acid béo là xà phòng mềm. Đúng."
                },
                {
                  "id": "tf-c24-d",
                  "statement": "d) Hiện tượng dầu mỡ bị ôi thiu là do liên kết ester bị thủy phân hoàn toàn.",
                  "isTrue": false,
                  "explain": "Do liên kết đôi C=C bị oxi hóa chậm bởi oxygen không khí tạo các hợp chất peroxide, aldehyde có mùi khó chịu. Sai."
                }
              ]
            },
            {
              "id": "q-c24-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Xà phòng hóa hoàn toàn 8,9 gam tristearin ($(C_{17}H_{35}COO)_3C_3H_5$) bằng lượng vừa đủ dung dịch NaOH. Khối lượng glycerol thu được sau phản ứng là bao nhiêu gam (ghi số thập phân)?",
              "correctAnswer": "0.92",
              "unit": "gam",
              "solution": "M_tristearin = 890 g/mol -> n = 8,9 / 890 = 0,01 mol. n_glycerol = 0,01 mol -> m = 0,01 * 92 = 0,92 gam.",
              "trapAlert": "Nhầm khối lượng phân tử glycerol là 93."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c24-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất béo nào sau đây ở trạng thái lỏng ở nhiệt độ phòng ($25^\\circ\\text{C}$)?",
              "options": [
                "Triolein",
                "Tristearin",
                "Tripalmitin",
                "Trimyristin"
              ],
              "correct": 0,
              "solution": "Triolein ((C₁₇H₃₃COO)₃C₃H₅) cấu tạo từ gốc acid béo không no nên ở thể lỏng ở nhiệt độ thường.",
              "trapAlert": "Nhầm Tristearin hay Tripalmitin (chúng là chất béo no, thể rắn).",
              "fastTip": "Gốc không no (Oleic, Linoleic) -> thể LỎNG."
            },
            {
              "id": "q-c24-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét chất béo Triolein có công thức $(C_{17}H_{33}COO)_3C_3H_5$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c24-a",
                  "statement": "a) 1 mol Triolein tác dụng tối đa với 3 mol Br₂ trong dung dịch.",
                  "isTrue": true,
                  "explain": "Mỗi gốc C₁₇H₃₃- có 1 liên kết đôi C=C -> 3 gốc cộng 3 Br₂. Đúng."
                },
                {
                  "id": "tf-c24-b",
                  "statement": "b) Hydro hóa hoàn toàn Triolein bằng khí H₂ (xúc tác Ni, đun nóng) thu được Tristearin.",
                  "isTrue": true,
                  "explain": "(C₁₇H₃₃COO)₃C₃H₅ + 3H₂ -> (C₁₇H₃₅COO)₃C₃H₅. Đúng."
                },
                {
                  "id": "tf-c24-c",
                  "statement": "c) Xà phòng hóa Triolein bằng dung dịch KOH thu được glycerol và xà phòng mềm.",
                  "isTrue": true,
                  "explain": "Muối potassium của acid béo là xà phòng mềm. Đúng."
                },
                {
                  "id": "tf-c24-d",
                  "statement": "d) Hiện tượng dầu mỡ bị ôi thiu là do liên kết ester bị thủy phân hoàn toàn.",
                  "isTrue": false,
                  "explain": "Do liên kết đôi C=C bị oxi hóa chậm bởi oxygen không khí tạo các hợp chất peroxide, aldehyde có mùi khó chịu. Sai."
                }
              ]
            },
            {
              "id": "q-c24-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Xà phòng hóa hoàn toàn 8,9 gam tristearin ($(C_{17}H_{35}COO)_3C_3H_5$) bằng lượng vừa đủ dung dịch NaOH. Khối lượng glycerol thu được sau phản ứng là bao nhiêu gam (ghi số thập phân)?",
              "correctAnswer": "0.92",
              "unit": "gam",
              "solution": "M_tristearin = 890 g/mol -> n = 8,9 / 890 = 0,01 mol. n_glycerol = 0,01 mol -> m = 0,01 * 92 = 0,92 gam.",
              "trapAlert": "Nhầm khối lượng phân tử glycerol là 93."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-carbohydrate",
      "chapterNum": "03",
      "chapterName": "Carbohydrate",
      "lessons": [
        {
          "id": "hoa-dai-cuong-carbohydrate-phan-loai",
          "title": "Đại cương Carbohydrate: Monosaccharide, Disaccharide & Polysaccharide",
          "desc": "Khái niệm carbohydrate (hợp chất tạp chức, công thức chung $C_n(H_2O)_m$), phân loại monosaccharide, disaccharide và polysaccharide theo mức độ thủy phân.",
          "duration": "25 phút",
          "tag": "Cơ sở",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Định nghĩa & Phân loại Carbohydrate",
              "desc": "Carbohydrate (saccharide) là hợp chất hữu cơ tạp chức, thường có công thức chung $C_n(H_2O)_m$. Phân loại thành 3 nhóm chính dựa trên mức độ thủy phân: Monosaccharide (đường đơn không bị thủy phân: Glucose, Fructose); Disaccharide (thủy phân ra 2 phân tử đường đơn: Saccharose, Maltose); Polysaccharide (thủy phân ra nhiều phân tử đường đơn: Tinh bột, Cellulose)."
            },
            {
              "title": "Vai trò sinh học của Carbohydrate",
              "desc": "Nguồn cung cấp năng lượng chính cho hoạt động sống của sinh vật (Glucose: 3,75 kcal/g); vật liệu cấu trúc tế bào (Cellulose cấu tạo thành tế bào thực vật); dạng năng lượng dự trữ ở thực vật (Tinh bột) và động vật (Glycogen trong gan)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhận diện chất có phản ứng thủy phân",
              "instruction": "Chỉ có Disaccharide (Saccharose) và Polysaccharide (Tinh bột, Cellulose) mới bị thủy phân trong môi trường acid hoặc xúc tác enzim. Monosaccharide KHÔNG bị thủy phân."
            },
            {
              "step": 2,
              "title": "Nhận diện chất có phản ứng tráng bạc",
              "instruction": "Glucose, Fructose có phản ứng tráng bạc. Saccharose, Tinh bột, Cellulose KHÔNG có phản ứng tráng bạc."
            }
          ],
          "formulas": [
            {
              "label": "Công thức phân tử của các nhóm Carbohydrate",
              "formula": "\\text{Mono: } C_6H_{12}O_6 (180), \\quad \\text{Di: } C_{12}H_{22}O_{11} (342), \\quad \\text{Poly: } (C_6H_{10}O_5)_n (162n)",
              "displayLatex": "C_6H_{12}O_6, \\ C_{12}H_{22}O_{11}, \\ (C_6H_{10}O_5)_n",
              "notes": "Khối lượng mol của từng mắt xích."
            },
            {
              "label": "Phản ứng quang hợp tạo Glucose và Tinh bột",
              "formula": "6CO_2 + 6H_2O \\xrightarrow{\\text{ánh sáng, diệp lục}} C_6H_{12}O_6 + 6O_2",
              "displayLatex": "6n CO_2 + 5n H_2O \\longrightarrow (C_6H_{10}O_5)_n + 6n O_2",
              "notes": "Nguồn gốc tạo nên sinh khối hữu cơ trên Trái Đất."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng Saccharose có phản ứng tráng bạc",
              "avoid": "Saccharose không còn nhóm hemiacetal tự do nên KHÔNG tráng bạc (chỉ sau khi THỦY PHÂN thành glucose và fructose thì dung dịch mới tráng bạc)."
            },
            {
              "trap": "Cho rằng tinh bột và cellulose là đồng phân của nhau",
              "avoid": "Dù có cùng công thức $(C_6H_{10}O_5)_n$ nhưng hệ số polime hóa $n$ rất khác nhau ($n_{tinh bột} \\ll n_{cellulose}$) nên KHÔNG PHẢI là đồng phân."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c25-1",
              "front": "Carbohydrate nào không bị thủy phân?",
              "back": "Monosaccharide (Glucose và Fructose)."
            },
            {
              "id": "fc-c25-2",
              "front": "Tinh bột và cellulose có phải là đồng phân của nhau không?",
              "back": "Không, vì hệ số polime hóa n khác nhau."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c25-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây thuộc loại monosaccharide không bị thủy phân?",
              "options": [
                "Glucose",
                "Saccharose",
                "Tinh bột",
                "Cellulose"
              ],
              "correct": 0,
              "solution": "Glucose và Fructose là các đường đơn (monosaccharide) không bị thủy phân.",
              "trapAlert": "Nhầm Saccharose (Saccharose là disaccharide bị thủy phân).",
              "fastTip": "Monosaccharide -> Glucose & Fructose."
            },
            {
              "id": "q-c25-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các carbohydrate sau: glucose, fructose, saccharose, tinh bột, cellulose. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c25-a",
                  "statement": "a) Glucose và fructose là hai chất đồng phân cấu tạo của nhau (cùng C₆H₁₂O₆).",
                  "isTrue": true,
                  "explain": "Cùng C₆H₁₂O₆, glucose là aldohexose còn fructose là ketohexose. Đúng."
                },
                {
                  "id": "tf-c25-b",
                  "statement": "b) Thủy phân hoàn toàn saccharose thu được hỗn hợp gồm glucose và fructose.",
                  "isTrue": true,
                  "explain": "C₁₂H₂₂O₁₁ + H₂O -> C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose). Đúng."
                },
                {
                  "id": "tf-c25-c",
                  "statement": "c) Cả tinh bột và cellulose đều tan tốt trong nước lạnh tạo dung dịch keo.",
                  "isTrue": false,
                  "explain": "Cellulose hoàn toàn không tan trong nước; tinh bột chỉ tan trong nước nóng tạo hồ tinh bột. Sai."
                },
                {
                  "id": "tf-c25-d",
                  "statement": "d) Trong máu người luôn duy trì một nồng độ glucose ổn định khoảng 0,1% (khoảng 4,4 - 7,2 mmol/L).",
                  "isTrue": true,
                  "explain": "Nồng độ đường huyết chuẩn ở người bình thường là khoảng 0,1%. Đúng."
                }
              ]
            },
            {
              "id": "q-c25-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Thủy phân hoàn toàn 34,2 gam saccharose ($C_{12}H_{22}O_{11}$) trong môi trường acid với hiệu suất $100\\%$. Sau đó trung hòa acid rồi cho toàn bộ sản phẩm thực hiện phản ứng tráng bạc với thuốc thử Tollens dư. Tính khối lượng Ag kim loại thu được (đơn vị: gam)?",
              "correctAnswer": "43.2",
              "unit": "gam",
              "solution": "n_saccharose = 34,2 / 342 = 0,1 mol. Thủy phân tạo 0,1 mol glucose + 0,1 mol fructose. Cả glucose và fructose trong môi trường kiềm đều tráng bạc (mỗi chất tạo 2 Ag). Tổng mol Ag = 2 * (0,1 + 0,1) = 0,4 mol. m_Ag = 0,4 * 108 = 43,2 gam.",
              "trapAlert": "Chỉ tính glucose tráng bạc mà quên fructose trong môi trường kiềm chuyển thành glucose và cũng tráng bạc."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c25-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây thuộc loại monosaccharide không bị thủy phân?",
              "options": [
                "Glucose",
                "Saccharose",
                "Tinh bột",
                "Cellulose"
              ],
              "correct": 0,
              "solution": "Glucose và Fructose là các đường đơn (monosaccharide) không bị thủy phân.",
              "trapAlert": "Nhầm Saccharose (Saccharose là disaccharide bị thủy phân).",
              "fastTip": "Monosaccharide -> Glucose & Fructose."
            },
            {
              "id": "q-c25-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các carbohydrate sau: glucose, fructose, saccharose, tinh bột, cellulose. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c25-a",
                  "statement": "a) Glucose và fructose là hai chất đồng phân cấu tạo của nhau (cùng C₆H₁₂O₆).",
                  "isTrue": true,
                  "explain": "Cùng C₆H₁₂O₆, glucose là aldohexose còn fructose là ketohexose. Đúng."
                },
                {
                  "id": "tf-c25-b",
                  "statement": "b) Thủy phân hoàn toàn saccharose thu được hỗn hợp gồm glucose và fructose.",
                  "isTrue": true,
                  "explain": "C₁₂H₂₂O₁₁ + H₂O -> C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose). Đúng."
                },
                {
                  "id": "tf-c25-c",
                  "statement": "c) Cả tinh bột và cellulose đều tan tốt trong nước lạnh tạo dung dịch keo.",
                  "isTrue": false,
                  "explain": "Cellulose hoàn toàn không tan trong nước; tinh bột chỉ tan trong nước nóng tạo hồ tinh bột. Sai."
                },
                {
                  "id": "tf-c25-d",
                  "statement": "d) Trong máu người luôn duy trì một nồng độ glucose ổn định khoảng 0,1% (khoảng 4,4 - 7,2 mmol/L).",
                  "isTrue": true,
                  "explain": "Nồng độ đường huyết chuẩn ở người bình thường là khoảng 0,1%. Đúng."
                }
              ]
            },
            {
              "id": "q-c25-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Thủy phân hoàn toàn 34,2 gam saccharose ($C_{12}H_{22}O_{11}$) trong môi trường acid với hiệu suất $100\\%$. Sau đó trung hòa acid rồi cho toàn bộ sản phẩm thực hiện phản ứng tráng bạc với thuốc thử Tollens dư. Tính khối lượng Ag kim loại thu được (đơn vị: gam)?",
              "correctAnswer": "43.2",
              "unit": "gam",
              "solution": "n_saccharose = 34,2 / 342 = 0,1 mol. Thủy phân tạo 0,1 mol glucose + 0,1 mol fructose. Cả glucose và fructose trong môi trường kiềm đều tráng bạc (mỗi chất tạo 2 Ag). Tổng mol Ag = 2 * (0,1 + 0,1) = 0,4 mol. m_Ag = 0,4 * 108 = 43,2 gam.",
              "trapAlert": "Chỉ tính glucose tráng bạc mà quên fructose trong môi trường kiềm chuyển thành glucose và cũng tráng bạc."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c25-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây thuộc loại monosaccharide không bị thủy phân?",
              "options": [
                "Glucose",
                "Saccharose",
                "Tinh bột",
                "Cellulose"
              ],
              "correct": 0,
              "solution": "Glucose và Fructose là các đường đơn (monosaccharide) không bị thủy phân.",
              "trapAlert": "Nhầm Saccharose (Saccharose là disaccharide bị thủy phân).",
              "fastTip": "Monosaccharide -> Glucose & Fructose."
            },
            {
              "id": "q-c25-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các carbohydrate sau: glucose, fructose, saccharose, tinh bột, cellulose. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c25-a",
                  "statement": "a) Glucose và fructose là hai chất đồng phân cấu tạo của nhau (cùng C₆H₁₂O₆).",
                  "isTrue": true,
                  "explain": "Cùng C₆H₁₂O₆, glucose là aldohexose còn fructose là ketohexose. Đúng."
                },
                {
                  "id": "tf-c25-b",
                  "statement": "b) Thủy phân hoàn toàn saccharose thu được hỗn hợp gồm glucose và fructose.",
                  "isTrue": true,
                  "explain": "C₁₂H₂₂O₁₁ + H₂O -> C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose). Đúng."
                },
                {
                  "id": "tf-c25-c",
                  "statement": "c) Cả tinh bột và cellulose đều tan tốt trong nước lạnh tạo dung dịch keo.",
                  "isTrue": false,
                  "explain": "Cellulose hoàn toàn không tan trong nước; tinh bột chỉ tan trong nước nóng tạo hồ tinh bột. Sai."
                },
                {
                  "id": "tf-c25-d",
                  "statement": "d) Trong máu người luôn duy trì một nồng độ glucose ổn định khoảng 0,1% (khoảng 4,4 - 7,2 mmol/L).",
                  "isTrue": true,
                  "explain": "Nồng độ đường huyết chuẩn ở người bình thường là khoảng 0,1%. Đúng."
                }
              ]
            },
            {
              "id": "q-c25-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Thủy phân hoàn toàn 34,2 gam saccharose ($C_{12}H_{22}O_{11}$) trong môi trường acid với hiệu suất $100\\%$. Sau đó trung hòa acid rồi cho toàn bộ sản phẩm thực hiện phản ứng tráng bạc với thuốc thử Tollens dư. Tính khối lượng Ag kim loại thu được (đơn vị: gam)?",
              "correctAnswer": "43.2",
              "unit": "gam",
              "solution": "n_saccharose = 34,2 / 342 = 0,1 mol. Thủy phân tạo 0,1 mol glucose + 0,1 mol fructose. Cả glucose và fructose trong môi trường kiềm đều tráng bạc (mỗi chất tạo 2 Ag). Tổng mol Ag = 2 * (0,1 + 0,1) = 0,4 mol. m_Ag = 0,4 * 108 = 43,2 gam.",
              "trapAlert": "Chỉ tính glucose tráng bạc mà quên fructose trong môi trường kiềm chuyển thành glucose và cũng tráng bạc."
            }
          ],
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-glucose-fructose",
          "title": "Glucose & Fructose: Cấu tạo & Tính chất đặc trưng",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Cấu tạo phân tử Glucose & Fructose",
              "desc": "Glucose ($CH_2OH-[CHOH]_4-CHO$): aldohexose, có 5 nhóm -OH kề nhau và 1 nhóm -CHO. Fructose ($CH_2OH-[CHOH]_3-CO-CH_2OH$): ketohexose, có 5 nhóm -OH và 1 nhóm C=O ở C2. Trong dung dịch tồn tại chủ yếu ở dạng mạch vòng $\\alpha$ và $\\beta$. Trong môi trường kiềm, glucose và fructose chuyển hóa qua lại lẫn nhau qua trung gian enediol."
            },
            {
              "title": "Tính chất hóa học phân biệt Glucose và Fructose",
              "desc": "Cả hai đều: hòa tan $Cu(OH)_2$ tạo dung dịch xanh lam thẫm; tác dụng với thuốc thử Tollens tạo kết tủa Ag sáng bóng; khử bằng $H_2/Ni$ tạo sorbitol. PHÂN BIỆT BẰNG NƯỚC BROMINE: Glucose làm mất màu nước bromine (nhóm -CHO bị oxi hóa thành gluconic acid), còn Fructose KHÔNG làm mất màu nước bromine (vì nước bromine có tính acid, fructose không chuyển thành glucose được)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Phân biệt Glucose và Fructose",
              "instruction": "Dùng dung dịch nước $Br_2$: Glucose làm mất màu, Fructose không làm mất màu."
            },
            {
              "step": 2,
              "title": "Tính lượng Ag hoặc CO2",
              "instruction": "Tráng bạc: $n_{Ag} = 2 n_{glucose}$. Lên men: $n_{C_2H_5OH} = n_{CO_2} = 2 n_{glucose} \\times H\\%$."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng tráng bạc của Glucose",
              "formula": "C_6H_{12}O_6 + 2[Ag(NH_3)_2]OH \\xrightarrow{t^\\circ} C_6H_{11}O_7NH_4 + 2Ag \\downarrow + 3NH_3 + H_2O",
              "displayLatex": "C_6H_{12}O_6 \\longrightarrow 2Ag \\downarrow",
              "notes": "1 mol Glucose tạo 2 mol Ag kim loại."
            },
            {
              "label": "Phản ứng phân biệt bằng nước Bromine",
              "formula": "CH_2OH(CHOH)_4CHO + Br_2 + H_2O \\longrightarrow CH_2OH(CHOH)_4COOH + 2HBr",
              "displayLatex": "\\text{Glucose làm mất màu nước } Br_2, \\quad \\text{Fructose KHÔNG}",
              "notes": "Thuốc thử đặc trưng duy nhất để phân biệt Glucose và Fructose."
            },
            {
              "label": "Phản ứng lên men rượu của Glucose",
              "formula": "C_6H_{12}O_6 \\xrightarrow{\\text{men rượu, } 30-35^\\circ\\text{C}} 2C_2H_5OH + 2CO_2 \\uparrow",
              "displayLatex": "C_6H_{12}O_6 \\longrightarrow 2C_2H_5OH + 2CO_2",
              "notes": "Sản xuất rượu vang và ethanol sinh học."
            }
          ],
          "traps": [
            {
              "trap": "Dùng dung dịch AgNO3/NH3 để phân biệt glucose và fructose",
              "avoid": "Trong môi trường kiềm của thuốc thử Tollens, fructose chuyển hóa thành glucose nên CẢ HAI ĐỀU TRÁNG BẠC như nhau."
            },
            {
              "trap": "Quên nhân hệ số hiệu suất phản ứng lên men",
              "avoid": "Phản ứng lên men luôn có hiệu suất $H < 100\\%$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c26-1",
              "front": "Dung dịch thuốc thử nào dùng để phân biệt glucose và fructose?",
              "back": "Dung dịch nước Bromine (Br₂) (Glucose làm mất màu, Fructose không)."
            },
            {
              "id": "fc-c26-2",
              "front": "Khử hoàn toàn glucose hoặc fructose bằng khí H₂ (xúc tác Ni) thu được chất gì?",
              "back": "Thu được Sorbitol (polyalcohol 6 chức C₆H₁₄O₆)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c26-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để phân biệt hai dung dịch mất nhãn chứa glucose và fructose, thuốc thử duy nhất cần dùng là:",
              "options": [
                "Dung dịch nước bromine (Br₂)",
                "Dung dịch AgNO₃ trong NH₃",
                "Cu(OH)₂ ở nhiệt độ thường",
                "Kim loại Sodium (Na)"
              ],
              "correct": 0,
              "solution": "Trong môi trường acid của nước bromine, fructose không chuyển hóa thành glucose được nên không làm mất màu. Glucose có nhóm -CHO làm mất màu nước bromine.",
              "trapAlert": "Chọn AgNO₃/NH₃ (trong kiềm fructose hóa thành glucose nên cả hai đều tráng bạc).",
              "fastTip": "Phân biệt glucose và fructose -> NƯỚC BROMINE."
            },
            {
              "id": "q-c26-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành các thí nghiệm với dung dịch glucose: Ống 1 cho tác dụng với $Cu(OH)_2$ ở nhiệt độ thường; Ống 2 đun nóng với $Cu(OH)_2$ trong môi trường kiềm; Ống 3 đun nóng với dung dịch $AgNO_3/NH_3$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c26-a",
                  "statement": "a) Ở ống 1 xuất hiện dung dịch màu xanh lam thẫm do tính chất của polyalcohol có nhiều nhóm -OH kề nhau.",
                  "isTrue": true,
                  "explain": "Glucose tạo phức đồng xanh lam thẫm. Đúng."
                },
                {
                  "id": "tf-c26-b",
                  "statement": "b) Ở ống 2 xuất hiện kết tủa màu đỏ gạch của Cu₂O.",
                  "isTrue": true,
                  "explain": "Nhóm -CHO bị oxi hóa bởi Cu(OH)₂ đun nóng tạo Cu₂O kết tủa đỏ gạch. Đúng."
                },
                {
                  "id": "tf-c26-c",
                  "statement": "c) Ở ống 3 xuất hiện lớp tráng gương sáng bóng của Ag kim loại.",
                  "isTrue": true,
                  "explain": "Glucose tham gia phản ứng tráng bạc. Đúng."
                },
                {
                  "id": "tf-c26-d",
                  "statement": "d) Các thí nghiệm trên chứng minh glucose chỉ có tính chất của một aldehyde đơn chức.",
                  "isTrue": false,
                  "explain": "Ống 1 chứng minh tính chất polyalcohol, ống 2 và 3 chứng minh tính chất aldehyde (hợp chất tạp chức). Sai."
                }
              ]
            },
            {
              "id": "q-c26-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Lên men 36,0 gam glucose để sản xuất ethanol với hiệu suất phản ứng đạt $80\\%$. Toàn bộ lượng khí $CO_2$ thoát ra được hấp thụ hết vào dung dịch $Ca(OH)_2$ dư thu được m gam kết tủa trắng $CaCO_3$. Tính giá trị của m (đơn vị: gam)?",
              "correctAnswer": "32",
              "unit": "gam",
              "solution": "n_glucose = 36 / 180 = 0,2 mol. n_CO₂ lý thuyết = 0,2 * 2 = 0,4 mol. n_CO₂ thực tế = 0,4 * 0,8 = 0,32 mol. n_CaCO₃ = n_CO₂ = 0,32 mol -> m = 0,32 * 100 = 32 gam.",
              "trapAlert": "Quên nhân hiệu suất 80% (ra 40g)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c26-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để phân biệt hai dung dịch mất nhãn chứa glucose và fructose, thuốc thử duy nhất cần dùng là:",
              "options": [
                "Dung dịch nước bromine (Br₂)",
                "Dung dịch AgNO₃ trong NH₃",
                "Cu(OH)₂ ở nhiệt độ thường",
                "Kim loại Sodium (Na)"
              ],
              "correct": 0,
              "solution": "Trong môi trường acid của nước bromine, fructose không chuyển hóa thành glucose được nên không làm mất màu. Glucose có nhóm -CHO làm mất màu nước bromine.",
              "trapAlert": "Chọn AgNO₃/NH₃ (trong kiềm fructose hóa thành glucose nên cả hai đều tráng bạc).",
              "fastTip": "Phân biệt glucose và fructose -> NƯỚC BROMINE."
            },
            {
              "id": "q-c26-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành các thí nghiệm với dung dịch glucose: Ống 1 cho tác dụng với $Cu(OH)_2$ ở nhiệt độ thường; Ống 2 đun nóng với $Cu(OH)_2$ trong môi trường kiềm; Ống 3 đun nóng với dung dịch $AgNO_3/NH_3$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c26-a",
                  "statement": "a) Ở ống 1 xuất hiện dung dịch màu xanh lam thẫm do tính chất của polyalcohol có nhiều nhóm -OH kề nhau.",
                  "isTrue": true,
                  "explain": "Glucose tạo phức đồng xanh lam thẫm. Đúng."
                },
                {
                  "id": "tf-c26-b",
                  "statement": "b) Ở ống 2 xuất hiện kết tủa màu đỏ gạch của Cu₂O.",
                  "isTrue": true,
                  "explain": "Nhóm -CHO bị oxi hóa bởi Cu(OH)₂ đun nóng tạo Cu₂O kết tủa đỏ gạch. Đúng."
                },
                {
                  "id": "tf-c26-c",
                  "statement": "c) Ở ống 3 xuất hiện lớp tráng gương sáng bóng của Ag kim loại.",
                  "isTrue": true,
                  "explain": "Glucose tham gia phản ứng tráng bạc. Đúng."
                },
                {
                  "id": "tf-c26-d",
                  "statement": "d) Các thí nghiệm trên chứng minh glucose chỉ có tính chất của một aldehyde đơn chức.",
                  "isTrue": false,
                  "explain": "Ống 1 chứng minh tính chất polyalcohol, ống 2 và 3 chứng minh tính chất aldehyde (hợp chất tạp chức). Sai."
                }
              ]
            },
            {
              "id": "q-c26-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Lên men 36,0 gam glucose để sản xuất ethanol với hiệu suất phản ứng đạt $80\\%$. Toàn bộ lượng khí $CO_2$ thoát ra được hấp thụ hết vào dung dịch $Ca(OH)_2$ dư thu được m gam kết tủa trắng $CaCO_3$. Tính giá trị của m (đơn vị: gam)?",
              "correctAnswer": "32",
              "unit": "gam",
              "solution": "n_glucose = 36 / 180 = 0,2 mol. n_CO₂ lý thuyết = 0,2 * 2 = 0,4 mol. n_CO₂ thực tế = 0,4 * 0,8 = 0,32 mol. n_CaCO₃ = n_CO₂ = 0,32 mol -> m = 0,32 * 100 = 32 gam.",
              "trapAlert": "Quên nhân hiệu suất 80% (ra 40g)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c26-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để phân biệt hai dung dịch mất nhãn chứa glucose và fructose, thuốc thử duy nhất cần dùng là:",
              "options": [
                "Dung dịch nước bromine (Br₂)",
                "Dung dịch AgNO₃ trong NH₃",
                "Cu(OH)₂ ở nhiệt độ thường",
                "Kim loại Sodium (Na)"
              ],
              "correct": 0,
              "solution": "Trong môi trường acid của nước bromine, fructose không chuyển hóa thành glucose được nên không làm mất màu. Glucose có nhóm -CHO làm mất màu nước bromine.",
              "trapAlert": "Chọn AgNO₃/NH₃ (trong kiềm fructose hóa thành glucose nên cả hai đều tráng bạc).",
              "fastTip": "Phân biệt glucose và fructose -> NƯỚC BROMINE."
            },
            {
              "id": "q-c26-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành các thí nghiệm với dung dịch glucose: Ống 1 cho tác dụng với $Cu(OH)_2$ ở nhiệt độ thường; Ống 2 đun nóng với $Cu(OH)_2$ trong môi trường kiềm; Ống 3 đun nóng với dung dịch $AgNO_3/NH_3$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c26-a",
                  "statement": "a) Ở ống 1 xuất hiện dung dịch màu xanh lam thẫm do tính chất của polyalcohol có nhiều nhóm -OH kề nhau.",
                  "isTrue": true,
                  "explain": "Glucose tạo phức đồng xanh lam thẫm. Đúng."
                },
                {
                  "id": "tf-c26-b",
                  "statement": "b) Ở ống 2 xuất hiện kết tủa màu đỏ gạch của Cu₂O.",
                  "isTrue": true,
                  "explain": "Nhóm -CHO bị oxi hóa bởi Cu(OH)₂ đun nóng tạo Cu₂O kết tủa đỏ gạch. Đúng."
                },
                {
                  "id": "tf-c26-c",
                  "statement": "c) Ở ống 3 xuất hiện lớp tráng gương sáng bóng của Ag kim loại.",
                  "isTrue": true,
                  "explain": "Glucose tham gia phản ứng tráng bạc. Đúng."
                },
                {
                  "id": "tf-c26-d",
                  "statement": "d) Các thí nghiệm trên chứng minh glucose chỉ có tính chất của một aldehyde đơn chức.",
                  "isTrue": false,
                  "explain": "Ống 1 chứng minh tính chất polyalcohol, ống 2 và 3 chứng minh tính chất aldehyde (hợp chất tạp chức). Sai."
                }
              ]
            },
            {
              "id": "q-c26-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Lên men 36,0 gam glucose để sản xuất ethanol với hiệu suất phản ứng đạt $80\\%$. Toàn bộ lượng khí $CO_2$ thoát ra được hấp thụ hết vào dung dịch $Ca(OH)_2$ dư thu được m gam kết tủa trắng $CaCO_3$. Tính giá trị của m (đơn vị: gam)?",
              "correctAnswer": "32",
              "unit": "gam",
              "solution": "n_glucose = 36 / 180 = 0,2 mol. n_CO₂ lý thuyết = 0,2 * 2 = 0,4 mol. n_CO₂ thực tế = 0,4 * 0,8 = 0,32 mol. n_CaCO₃ = n_CO₂ = 0,32 mol -> m = 0,32 * 100 = 32 gam.",
              "trapAlert": "Quên nhân hiệu suất 80% (ra 40g)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-saccharose-tinh-bot-cellulose",
          "title": "Saccharose, Tinh bột & Cellulose: Thủy phân & Ứng dụng",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Saccharose (Đường mía)",
              "desc": "Disaccharide ($C_{12}H_{22}O_{11}$) gồm 1 gốc $\\alpha$-glucose và 1 gốc $\\beta$-fructose liên kết qua cầu nối $\\alpha-1,2$-glycosidic. Không còn nhóm hemiacetal tự do nên KHÔNG có tính khử, không tráng bạc, không mở vòng."
            },
            {
              "title": "Tinh bột & Cellulose",
              "desc": "Tinh bột: gồm Amylose (chuỗi không phân nhánh xoắn lò xo, liên kết $\\alpha-1,4$-glycosidic) và Amylopectin (chuỗi phân nhánh, liên kết $\\alpha-1,4$ và $\\alpha-1,6$-glycosidic). Tác dụng với $I_2$ cho màu xanh tím đặc trưng (mất khi đun, hiện lại khi nguội). Cellulose: chuỗi thẳng kéo dài không phân nhánh gồm các gốc $\\beta$-glucose liên kết $\\beta-1,4$-glycosidic, cấu tạo thành sợi cellulose bền vững. Tan trong nước Schweizer, phản ứng với $HNO_3$ đặc tạo thuốc súng không khói cellulose trinitrate $[C_6H_7O_2(ONO_2)_3]_n$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Thuốc thử đặc trưng nhận biết tinh bột",
              "instruction": "Dùng dung dịch iodine ($I_2$) xuất hiện màu xanh tím do cấu trúc xoắn của amylose hấp phụ phân tử iot."
            },
            {
              "step": 2,
              "title": "Tính toán phản ứng tạo cellulose trinitrate",
              "instruction": "$n_{\\text{trinitrate}} = n_{\\text{cellulose}} = \\frac{1}{3} n_{HNO_3}$. Khối lượng mắt xích tăng từ 162 lên 297."
            }
          ],
          "formulas": [
            {
              "label": "Thủy phân Tinh bột và Cellulose",
              "formula": "(C_6H_{10}O_5)_n + nH_2O \\xrightarrow{H^+, t^\\circ} n C_6H_{12}O_6 \\quad (\\text{glucose})",
              "displayLatex": "(C_6H_{10}O_5)_n + nH_2O \\longrightarrow n C_6H_{12}O_6",
              "notes": "Cả hai đều bị thủy phân hoàn toàn thành Glucose."
            },
            {
              "label": "Điều chế thuốc súng không khói Cellulose trinitrate",
              "formula": "[C_6H_7O_2(OH)_3]_n + 3n HNO_3 \\xrightarrow{H_2SO_4, t^\\circ} [C_6H_7O_2(ONO_2)_3]_n + 3n H_2O",
              "displayLatex": "M_{\\text{mắt xích}} = 297n",
              "notes": "1 mol mắt xích cellulose phản ứng với 3 mol HNO₃."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm liên kết giữa các gốc glucose trong tinh bột và cellulose",
              "avoid": "Tinh bột là liên kết $\\alpha$-glycosidic; Cellulose là liên kết $\\beta-1,4$-glycosidic."
            },
            {
              "trap": "Quên hệ số 3 của HNO3 trong phản ứng với cellulose",
              "avoid": "Mỗi mắt xích cellulose có 3 nhóm -OH tự do nên phản ứng với $3 HNO_3$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c27-1",
              "front": "Dung dịch iodine (I₂) dùng để nhận biết hợp chất nào?",
              "back": "Nhận biết hồ tinh bột (tạo màu xanh tím đặc trưng)."
            },
            {
              "id": "fc-c27-2",
              "front": "Cellulose phản ứng với chất nào để sản xuất tơ visco?",
              "back": "Phản ứng với NaOH và CS₂ (carbon disulfide)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c27-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhỏ vài giọt dung dịch iodine vào ống nghiệm chứa hồ tinh bột ở nhiệt độ thường, hiện tượng quan sát được là:",
              "options": [
                "Dung dịch chuyển sang màu xanh tím đặc trưng",
                "Xuất hiện kết tủa màu đỏ gạch",
                "Dung dịch chuyển sang màu vàng cam",
                "Không có hiện tượng gì xảy ra"
              ],
              "correct": 0,
              "solution": "Các phân tử iodine chui vào các khoang xoắn của amylose tạo hợp chất bọc màu xanh tím đặc trưng.",
              "trapAlert": "Nhầm với phản ứng màu biuret (màu tím của protein).",
              "fastTip": "Tinh bột + Iodine -> XANH TÍM."
            },
            {
              "id": "q-c27-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét cấu trúc và tính chất của tinh bột và cellulose. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c27-a",
                  "statement": "a) Tinh bột gồm hai thành phần là amylose (không phân nhánh) và amylopectin (phân nhánh).",
                  "isTrue": true,
                  "explain": "Cấu tạo tinh bột gồm amylose và amylopectin. Đúng."
                },
                {
                  "id": "tf-c27-b",
                  "statement": "b) Cellulose là polymer mạch thẳng cấu tạo từ các mắt xích beta-glucose.",
                  "isTrue": true,
                  "explain": "Cellulose chỉ gồm các gốc beta-glucose liên kết beta-1,4. Đúng."
                },
                {
                  "id": "tf-c27-c",
                  "statement": "c) Động vật ăn cỏ như trâu, bò tiêu hóa được cellulose nhờ có enzim cellulase của vi sinh vật cộng sinh.",
                  "isTrue": true,
                  "explain": "Vi sinh vật trong dạ cỏ tiết enzim cellulase thủy phân cellulose. Đúng."
                },
                {
                  "id": "tf-c27-d",
                  "statement": "d) Thuốc súng không khói là sản phẩm của phản ứng giữa tinh bột với nitric acid đặc.",
                  "isTrue": false,
                  "explain": "Thuốc súng không khói được điều chế từ CELLULOSE, không phải tinh bột. Sai."
                }
              ]
            },
            {
              "id": "q-c27-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 32,4 gam cellulose phản ứng hoàn toàn với lượng dư dung dịch $HNO_3$ đặc (xúc tác $H_2SO_4$ đặc, đun nóng) để sản xuất cellulose trinitrate với hiệu suất $90\\%$. Khối lượng cellulose trinitrate thu được là bao nhiêu gam (làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "53.5",
              "unit": "gam",
              "solution": "n_mắt xích = 32,4 / 162 = 0,2 mol. n_trinitrate lý thuyết = 0,2 mol. Khối lượng lý thuyết = 0,2 * 297 = 59,4 gam. Thực tế (H = 90%): m = 59,4 * 0,9 = 53,46 ≈ 53,5 gam.",
              "trapAlert": "Quên nhân hiệu suất 90%."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c27-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhỏ vài giọt dung dịch iodine vào ống nghiệm chứa hồ tinh bột ở nhiệt độ thường, hiện tượng quan sát được là:",
              "options": [
                "Dung dịch chuyển sang màu xanh tím đặc trưng",
                "Xuất hiện kết tủa màu đỏ gạch",
                "Dung dịch chuyển sang màu vàng cam",
                "Không có hiện tượng gì xảy ra"
              ],
              "correct": 0,
              "solution": "Các phân tử iodine chui vào các khoang xoắn của amylose tạo hợp chất bọc màu xanh tím đặc trưng.",
              "trapAlert": "Nhầm với phản ứng màu biuret (màu tím của protein).",
              "fastTip": "Tinh bột + Iodine -> XANH TÍM."
            },
            {
              "id": "q-c27-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét cấu trúc và tính chất của tinh bột và cellulose. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c27-a",
                  "statement": "a) Tinh bột gồm hai thành phần là amylose (không phân nhánh) và amylopectin (phân nhánh).",
                  "isTrue": true,
                  "explain": "Cấu tạo tinh bột gồm amylose và amylopectin. Đúng."
                },
                {
                  "id": "tf-c27-b",
                  "statement": "b) Cellulose là polymer mạch thẳng cấu tạo từ các mắt xích beta-glucose.",
                  "isTrue": true,
                  "explain": "Cellulose chỉ gồm các gốc beta-glucose liên kết beta-1,4. Đúng."
                },
                {
                  "id": "tf-c27-c",
                  "statement": "c) Động vật ăn cỏ như trâu, bò tiêu hóa được cellulose nhờ có enzim cellulase của vi sinh vật cộng sinh.",
                  "isTrue": true,
                  "explain": "Vi sinh vật trong dạ cỏ tiết enzim cellulase thủy phân cellulose. Đúng."
                },
                {
                  "id": "tf-c27-d",
                  "statement": "d) Thuốc súng không khói là sản phẩm của phản ứng giữa tinh bột với nitric acid đặc.",
                  "isTrue": false,
                  "explain": "Thuốc súng không khói được điều chế từ CELLULOSE, không phải tinh bột. Sai."
                }
              ]
            },
            {
              "id": "q-c27-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 32,4 gam cellulose phản ứng hoàn toàn với lượng dư dung dịch $HNO_3$ đặc (xúc tác $H_2SO_4$ đặc, đun nóng) để sản xuất cellulose trinitrate với hiệu suất $90\\%$. Khối lượng cellulose trinitrate thu được là bao nhiêu gam (làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "53.5",
              "unit": "gam",
              "solution": "n_mắt xích = 32,4 / 162 = 0,2 mol. n_trinitrate lý thuyết = 0,2 mol. Khối lượng lý thuyết = 0,2 * 297 = 59,4 gam. Thực tế (H = 90%): m = 59,4 * 0,9 = 53,46 ≈ 53,5 gam.",
              "trapAlert": "Quên nhân hiệu suất 90%."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c27-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhỏ vài giọt dung dịch iodine vào ống nghiệm chứa hồ tinh bột ở nhiệt độ thường, hiện tượng quan sát được là:",
              "options": [
                "Dung dịch chuyển sang màu xanh tím đặc trưng",
                "Xuất hiện kết tủa màu đỏ gạch",
                "Dung dịch chuyển sang màu vàng cam",
                "Không có hiện tượng gì xảy ra"
              ],
              "correct": 0,
              "solution": "Các phân tử iodine chui vào các khoang xoắn của amylose tạo hợp chất bọc màu xanh tím đặc trưng.",
              "trapAlert": "Nhầm với phản ứng màu biuret (màu tím của protein).",
              "fastTip": "Tinh bột + Iodine -> XANH TÍM."
            },
            {
              "id": "q-c27-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét cấu trúc và tính chất của tinh bột và cellulose. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c27-a",
                  "statement": "a) Tinh bột gồm hai thành phần là amylose (không phân nhánh) và amylopectin (phân nhánh).",
                  "isTrue": true,
                  "explain": "Cấu tạo tinh bột gồm amylose và amylopectin. Đúng."
                },
                {
                  "id": "tf-c27-b",
                  "statement": "b) Cellulose là polymer mạch thẳng cấu tạo từ các mắt xích beta-glucose.",
                  "isTrue": true,
                  "explain": "Cellulose chỉ gồm các gốc beta-glucose liên kết beta-1,4. Đúng."
                },
                {
                  "id": "tf-c27-c",
                  "statement": "c) Động vật ăn cỏ như trâu, bò tiêu hóa được cellulose nhờ có enzim cellulase của vi sinh vật cộng sinh.",
                  "isTrue": true,
                  "explain": "Vi sinh vật trong dạ cỏ tiết enzim cellulase thủy phân cellulose. Đúng."
                },
                {
                  "id": "tf-c27-d",
                  "statement": "d) Thuốc súng không khói là sản phẩm của phản ứng giữa tinh bột với nitric acid đặc.",
                  "isTrue": false,
                  "explain": "Thuốc súng không khói được điều chế từ CELLULOSE, không phải tinh bột. Sai."
                }
              ]
            },
            {
              "id": "q-c27-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 32,4 gam cellulose phản ứng hoàn toàn với lượng dư dung dịch $HNO_3$ đặc (xúc tác $H_2SO_4$ đặc, đun nóng) để sản xuất cellulose trinitrate với hiệu suất $90\\%$. Khối lượng cellulose trinitrate thu được là bao nhiêu gam (làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "53.5",
              "unit": "gam",
              "solution": "n_mắt xích = 32,4 / 162 = 0,2 mol. n_trinitrate lý thuyết = 0,2 mol. Khối lượng lý thuyết = 0,2 * 297 = 59,4 gam. Thực tế (H = 90%): m = 59,4 * 0,9 = 53,46 ≈ 53,5 gam.",
              "trapAlert": "Quên nhân hiệu suất 90%."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-amine",
      "chapterNum": "04",
      "chapterName": "Amine, Amino acid, Peptide & Protein",
      "lessons": [
        {
          "id": "hoa-aniline-tinh-chat-hoa-hoc",
          "title": "Aniline (C₆H₅NH₂): Cấu tạo & Tính chất đặc trưng",
          "desc": "Cấu tạo phân tử aniline, ảnh hưởng của vòng benzene hút electron làm giảm tính base, phản ứng với acid và phản ứng thế nhân thơm.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đặc điểm cấu tạo Aniline (Benzenamine)",
              "desc": "Aniline ($C_6H_5NH_2$) có nhóm amino ($-NH_2$) đính trực tiếp với vòng benzene. Cặp electron tự do của nguyên tử N liên hợp với hệ electron $\\pi$ của vòng thơm làm giảm mật độ e trên nguyên tử N $\\implies$ tính base của aniline RẤT YẾU (yếu hơn $NH_3$ và amine béo, KHÔNG làm đổi màu quỳ tím, không làm đổi màu phenolphthalein)."
            },
            {
              "title": "Tính chất hóa học đặc trưng",
              "desc": "Tác dụng với acid mạnh tạo muối tan: $C_6H_5NH_2 + HCl \\to C_6H_5NH_3Cl$ (phenylammonium chloride). Vì vậy, rửa sạch ống nghiệm dính aniline bằng dung dịch HCl, sau đó tráng lại bằng nước cất. Tác dụng với nước bromine tạo kết tủa trắng $2,4,6$-tribromoaniline tương tự phenol."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Làm sạch ống nghiệm dính aniline",
              "instruction": "Bước 1: Rửa bằng dung dịch HCl (chuyển aniline không tan thành muối phenylammonium chloride tan trong nước). Bước 2: Tráng lại bằng nước cất."
            },
            {
              "step": 2,
              "title": "Nhận biết Aniline",
              "instruction": "Nhỏ nước bromine tạo kết tủa trắng $2,4,6$-tribromoaniline."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng tạo muối tan của Aniline",
              "formula": "C_6H_5NH_2 + HCl \\longrightarrow C_6H_5NH_3Cl",
              "displayLatex": "C_6H_5NH_2 + HCl \\longrightarrow C_6H_5NH_3Cl",
              "notes": "Aniline không tan trong nước nhưng tan tốt trong dung dịch HCl."
            },
            {
              "label": "Phản ứng nhận biết bằng nước Bromine",
              "formula": "C_6H_5NH_2 + 3Br_2 \\longrightarrow C_6H_2Br_3NH_2 \\downarrow \\text{ (trắng)} + 3HBr",
              "displayLatex": "C_6H_5NH_2 + 3Br_2 \\longrightarrow 2,4,6\\text{-tribromoaniline } \\downarrow",
              "notes": "Hiện tượng: mất màu vàng nâu của nước bromine và xuất hiện kết tủa trắng."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng dung dịch aniline làm quỳ tím hóa xanh",
              "avoid": "Tuyệt đối KHÔNG: Aniline có tính base rất yếu nên KHÔNG làm đổi màu giấy quỳ tím."
            },
            {
              "trap": "Dùng nước cất để rửa ống nghiệm dính aniline",
              "avoid": "Aniline rất ít tan trong nước lạnh nên rửa bằng nước không sạch. Bắt buộc rửa bằng dung dịch HCl."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c28-1",
              "front": "Dung dịch aniline có làm đổi màu quỳ tím không?",
              "back": "Không làm đổi màu quỳ tím (tính base rất yếu do hiệu ứng hút e của vòng thơm)."
            },
            {
              "id": "fc-c28-2",
              "front": "Để rửa sạch ống nghiệm dính aniline, người ta tráng bằng hóa chất nào trước?",
              "back": "Tráng bằng dung dịch hydrochloric acid (HCl), sau đó rửa lại bằng nước."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c28-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho vài giọt nước bromine vào ống nghiệm chứa dung dịch aniline, hiện tượng quan sát được là:",
              "options": [
                "Nước bromine mất màu và xuất hiện kết tủa trắng",
                "Xuất hiện kết tủa màu vàng nhạt",
                "Có bọt khí không màu thoát ra",
                "Dung dịch chuyển sang màu xanh lam"
              ],
              "correct": 0,
              "solution": "Aniline phản ứng thế nhanh với nước bromine tạo kết tủa trắng 2,4,6-tribromoaniline.",
              "trapAlert": "Nhầm sang kết tủa vàng.",
              "fastTip": "Aniline + nước Br₂ -> KẾT TỦA TRẮNG."
            },
            {
              "id": "q-c28-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành thí nghiệm với aniline: Ống 1 thêm nước cất; Ống 2 thêm dung dịch HCl; Ống 3 nhúng giấy quỳ tím. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c28-a",
                  "statement": "a) Ở ống 1, aniline ít tan lắng xuống đáy hoặc nổi tạo thành 2 lớp chất lỏng.",
                  "isTrue": true,
                  "explain": "Aniline ít tan trong nước lạnh. Đúng."
                },
                {
                  "id": "tf-c28-b",
                  "statement": "b) Ở ống 2, dung dịch trở nên trong suốt đồng nhất do tạo muối phenylammonium chloride.",
                  "isTrue": true,
                  "explain": "Tạo muối tan C₆H₅NH₃Cl. Đúng."
                },
                {
                  "id": "tf-c28-c",
                  "statement": "c) Ở ống 3, giấy quỳ tím chuyển sang màu xanh rõ rệt.",
                  "isTrue": false,
                  "explain": "Aniline có tính base rất yếu nên không đổi màu quỳ tím. Sai."
                },
                {
                  "id": "tf-c28-d",
                  "statement": "d) Thêm tiếp dung dịch NaOH vào ống 2 thì dung dịch lại bị vẩn đục trở lại.",
                  "isTrue": true,
                  "explain": "NaOH đẩy aniline ra khỏi muối làm dung dịch vẩn đục trở lại. Đúng."
                }
              ]
            },
            {
              "id": "q-c28-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 9,3 gam aniline ($C_6H_5NH_2$) phản ứng hoàn toàn với dung dịch nước bromine dư. Khối lượng kết tủa trắng $2,4,6$-tribromoaniline thu được là bao nhiêu gam (lấy $M = 330\\text{ g/mol}$)?",
              "correctAnswer": "33",
              "unit": "gam",
              "solution": "n_aniline = 9,3 / 93 = 0,1 mol. n_kết tủa = 0,1 mol. Khối lượng m = 0,1 * 330 = 33 gam.",
              "trapAlert": "Nhầm phân tử khối kết tủa."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c28-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho vài giọt nước bromine vào ống nghiệm chứa dung dịch aniline, hiện tượng quan sát được là:",
              "options": [
                "Nước bromine mất màu và xuất hiện kết tủa trắng",
                "Xuất hiện kết tủa màu vàng nhạt",
                "Có bọt khí không màu thoát ra",
                "Dung dịch chuyển sang màu xanh lam"
              ],
              "correct": 0,
              "solution": "Aniline phản ứng thế nhanh với nước bromine tạo kết tủa trắng 2,4,6-tribromoaniline.",
              "trapAlert": "Nhầm sang kết tủa vàng.",
              "fastTip": "Aniline + nước Br₂ -> KẾT TỦA TRẮNG."
            },
            {
              "id": "q-c28-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành thí nghiệm với aniline: Ống 1 thêm nước cất; Ống 2 thêm dung dịch HCl; Ống 3 nhúng giấy quỳ tím. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c28-a",
                  "statement": "a) Ở ống 1, aniline ít tan lắng xuống đáy hoặc nổi tạo thành 2 lớp chất lỏng.",
                  "isTrue": true,
                  "explain": "Aniline ít tan trong nước lạnh. Đúng."
                },
                {
                  "id": "tf-c28-b",
                  "statement": "b) Ở ống 2, dung dịch trở nên trong suốt đồng nhất do tạo muối phenylammonium chloride.",
                  "isTrue": true,
                  "explain": "Tạo muối tan C₆H₅NH₃Cl. Đúng."
                },
                {
                  "id": "tf-c28-c",
                  "statement": "c) Ở ống 3, giấy quỳ tím chuyển sang màu xanh rõ rệt.",
                  "isTrue": false,
                  "explain": "Aniline có tính base rất yếu nên không đổi màu quỳ tím. Sai."
                },
                {
                  "id": "tf-c28-d",
                  "statement": "d) Thêm tiếp dung dịch NaOH vào ống 2 thì dung dịch lại bị vẩn đục trở lại.",
                  "isTrue": true,
                  "explain": "NaOH đẩy aniline ra khỏi muối làm dung dịch vẩn đục trở lại. Đúng."
                }
              ]
            },
            {
              "id": "q-c28-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 9,3 gam aniline ($C_6H_5NH_2$) phản ứng hoàn toàn với dung dịch nước bromine dư. Khối lượng kết tủa trắng $2,4,6$-tribromoaniline thu được là bao nhiêu gam (lấy $M = 330\\text{ g/mol}$)?",
              "correctAnswer": "33",
              "unit": "gam",
              "solution": "n_aniline = 9,3 / 93 = 0,1 mol. n_kết tủa = 0,1 mol. Khối lượng m = 0,1 * 330 = 33 gam.",
              "trapAlert": "Nhầm phân tử khối kết tủa."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c28-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho vài giọt nước bromine vào ống nghiệm chứa dung dịch aniline, hiện tượng quan sát được là:",
              "options": [
                "Nước bromine mất màu và xuất hiện kết tủa trắng",
                "Xuất hiện kết tủa màu vàng nhạt",
                "Có bọt khí không màu thoát ra",
                "Dung dịch chuyển sang màu xanh lam"
              ],
              "correct": 0,
              "solution": "Aniline phản ứng thế nhanh với nước bromine tạo kết tủa trắng 2,4,6-tribromoaniline.",
              "trapAlert": "Nhầm sang kết tủa vàng.",
              "fastTip": "Aniline + nước Br₂ -> KẾT TỦA TRẮNG."
            },
            {
              "id": "q-c28-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành thí nghiệm với aniline: Ống 1 thêm nước cất; Ống 2 thêm dung dịch HCl; Ống 3 nhúng giấy quỳ tím. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c28-a",
                  "statement": "a) Ở ống 1, aniline ít tan lắng xuống đáy hoặc nổi tạo thành 2 lớp chất lỏng.",
                  "isTrue": true,
                  "explain": "Aniline ít tan trong nước lạnh. Đúng."
                },
                {
                  "id": "tf-c28-b",
                  "statement": "b) Ở ống 2, dung dịch trở nên trong suốt đồng nhất do tạo muối phenylammonium chloride.",
                  "isTrue": true,
                  "explain": "Tạo muối tan C₆H₅NH₃Cl. Đúng."
                },
                {
                  "id": "tf-c28-c",
                  "statement": "c) Ở ống 3, giấy quỳ tím chuyển sang màu xanh rõ rệt.",
                  "isTrue": false,
                  "explain": "Aniline có tính base rất yếu nên không đổi màu quỳ tím. Sai."
                },
                {
                  "id": "tf-c28-d",
                  "statement": "d) Thêm tiếp dung dịch NaOH vào ống 2 thì dung dịch lại bị vẩn đục trở lại.",
                  "isTrue": true,
                  "explain": "NaOH đẩy aniline ra khỏi muối làm dung dịch vẩn đục trở lại. Đúng."
                }
              ]
            },
            {
              "id": "q-c28-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 9,3 gam aniline ($C_6H_5NH_2$) phản ứng hoàn toàn với dung dịch nước bromine dư. Khối lượng kết tủa trắng $2,4,6$-tribromoaniline thu được là bao nhiêu gam (lấy $M = 330\\text{ g/mol}$)?",
              "correctAnswer": "33",
              "unit": "gam",
              "solution": "n_aniline = 9,3 / 93 = 0,1 mol. n_kết tủa = 0,1 mol. Khối lượng m = 0,1 * 330 = 33 gam.",
              "trapAlert": "Nhầm phân tử khối kết tủa."
            }
          ],
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-amine-amino-acid",
          "title": "Amine & Amino acid: Tính base & Tính lưỡng tính",
          "questionsCount": 30,
          "durationMinutes": 35,
          "concepts": [
            {
              "title": "Amine: Bậc & Lực base",
              "desc": "Bậc của amine là số nguyên tử H trong phân tử $NH_3$ bị thay thế bởi gốc hydrocarbon (Bậc 1: $R-NH_2$, Bậc 2: $R-NH-R'$, Bậc 3: $R_3N$). Lực base phụ thuộc vào hiệu ứng đẩy/hút e của gốc: Amine thơm ($C_6H_5NH_2$) < $NH_3$ < Amine no bậc 1 ($CH_3NH_2$) < Amine no bậc 2 ($(CH_3)_2NH$)."
            },
            {
              "title": "Amino acid: Tính chất lưỡng tính & Điểm đẳng điện",
              "desc": "Amino acid là hợp chất hữu cơ tạp chức chứa đồng thời nhóm amino ($-NH_2$, tính base) và nhóm carboxyl ($-COOH$, tính acid). Tồn tại chủ yếu dưới dạng ion lưỡng cực ($H_3N^+-CHR-COO^-$), là chất rắn kết tinh không màu, nhiệt độ nóng chảy cao, tan tốt trong nước. Có tính lưỡng tính (tác dụng với cả acid mạnh và base mạnh)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "So sánh số nhóm -NH2 và -COOH",
              "instruction": "Nếu số nhóm $-NH_2$ > $-COOH$ (như Lysine): pH > 7, quỳ tím hóa xanh. Nếu số nhóm $-COOH$ > $-NH_2$ (như Glutamic acid): pH < 7, quỳ tím hóa đỏ. Nếu bằng nhau (Glycine, Alanine, Valine): pH xấp xỉ 7, không đổi màu quỳ."
            },
            {
              "step": 2,
              "title": "Tìm số mol HCl và NaOH phản ứng",
              "instruction": "$n_{HCl} = n_{-NH_2}$; $n_{NaOH} = n_{-COOH}$."
            }
          ],
          "formulas": [
            {
              "label": "Thứ tự lực base của các amine thông dụng",
              "formula": "C_6H_5NH_2 < NH_3 < CH_3NH_2 < (CH_3)_2NH",
              "displayLatex": "C_6H_5NH_2 < NH_3 < R-NH_2 < R_2NH",
              "notes": "Nhóm alkyl đẩy e làm tăng lực base; nhóm phenyl hút e làm giảm lực base."
            },
            {
              "label": "Tính lưỡng tính của Amino acid",
              "formula": "H_2N-CH_2-COOH + HCl \\longrightarrow ClH_3N-CH_2-COOH, \\quad H_2N-CH_2-COOH + NaOH \\longrightarrow H_2N-CH_2-COONa + H_2O",
              "displayLatex": "\\text{Tác dụng cả Acid mạnh và Base mạnh}",
              "notes": "Chứng minh tính chất lưỡng tính."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng mọi amino acid đều không đổi màu quỳ tím",
              "avoid": "Glutamic acid làm quỳ tím hóa ĐỎ (2 nhóm -COOH, 1 nhóm -NH₂); Lysine làm quỳ tím hóa XANH (2 nhóm -NH₂, 1 nhóm -COOH)."
            },
            {
              "trap": "Nhầm bậc của amine với bậc của carbon/alcohol",
              "avoid": "Bậc của amine tính theo số liên kết N-C (số H của NH₃ bị thay thế), không phụ thuộc bậc của nguyên tử C mang nó."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c29-1",
              "front": "Amino acid nào làm quỳ tím chuyển sang màu đỏ?",
              "back": "Glutamic acid (có 2 nhóm -COOH và 1 nhóm -NH₂)."
            },
            {
              "id": "fc-c29-2",
              "front": "Chất nào có lực base mạnh nhất: NH₃, methylamine hay dimethylamine?",
              "back": "Dimethylamine (amine no bậc 2 có 2 nhóm alkyl đẩy e)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c29-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dung dịch chất nào sau đây làm giấy quỳ tím chuyển sang màu xanh?",
              "options": [
                "Lysine",
                "Glycine",
                "Alanine",
                "Glutamic acid"
              ],
              "correct": 0,
              "solution": "Lysine có 2 nhóm -NH₂ và 1 nhóm -COOH nên dung dịch có tính base, làm quỳ tím hóa xanh.",
              "trapAlert": "Nhầm Glycine hay Alanine (chúng không đổi màu quỳ).",
              "fastTip": "Lysine -> hóa XANH; Glutamic acid -> hóa ĐỎ."
            },
            {
              "id": "q-c29-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho 0,1 mol glycine ($H_2N-CH_2-COOH$) tác dụng với dung dịch chứa 0,1 mol HCl thu được dung dịch X. Cho tiếp lượng dư dung dịch NaOH vào dung dịch X. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c29-a",
                  "statement": "a) Glycine tác dụng với HCl theo tỉ lệ mol 1 : 1 tạo muối ClH₃NCH₂COOH.",
                  "isTrue": true,
                  "explain": "Glycine có 1 nhóm -NH₂ tác dụng 1 HCl. Đúng."
                },
                {
                  "id": "tf-c29-b",
                  "statement": "b) Số mol NaOH phản ứng tối đa với dung dịch X là 0,2 mol.",
                  "isTrue": true,
                  "explain": "NaOH phản ứng với cả HCl (0,1 mol) và nhóm -COOH của glycine (0,1 mol). Đúng."
                },
                {
                  "id": "tf-c29-c",
                  "statement": "c) Ở trạng thái rắn, các phân tử glycine tồn tại dưới dạng ion lưỡng cực.",
                  "isTrue": true,
                  "explain": "H₃N⁺-CH₂-COO⁻ tạo mạng tinh thể ion có nhiệt độ nóng chảy cao. Đúng."
                },
                {
                  "id": "tf-c29-d",
                  "statement": "d) Glycine thuộc loại beta-amino acid.",
                  "isTrue": false,
                  "explain": "Glycine có nhóm -NH₂ gắn ở C số 2 (carbon alpha) nên là alpha-amino acid. Sai."
                }
              ]
            },
            {
              "id": "q-c29-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 8,9 gam alanine ($CH_3-CH(NH_2)-COOH$) tác dụng vừa đủ với V ml dung dịch NaOH 1M. Tính giá trị của V (đơn vị: ml)?",
              "correctAnswer": "100",
              "unit": "ml",
              "solution": "M_alanine = 89 g/mol -> n = 8,9 / 89 = 0,1 mol. Alanine có 1 nhóm -COOH nên tác dụng 0,1 mol NaOH. V = 0,1 / 1 = 0,1 lít = 100 ml.",
              "trapAlert": "Không đổi lít sang ml."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c29-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dung dịch chất nào sau đây làm giấy quỳ tím chuyển sang màu xanh?",
              "options": [
                "Lysine",
                "Glycine",
                "Alanine",
                "Glutamic acid"
              ],
              "correct": 0,
              "solution": "Lysine có 2 nhóm -NH₂ và 1 nhóm -COOH nên dung dịch có tính base, làm quỳ tím hóa xanh.",
              "trapAlert": "Nhầm Glycine hay Alanine (chúng không đổi màu quỳ).",
              "fastTip": "Lysine -> hóa XANH; Glutamic acid -> hóa ĐỎ."
            },
            {
              "id": "q-c29-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho 0,1 mol glycine ($H_2N-CH_2-COOH$) tác dụng với dung dịch chứa 0,1 mol HCl thu được dung dịch X. Cho tiếp lượng dư dung dịch NaOH vào dung dịch X. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c29-a",
                  "statement": "a) Glycine tác dụng với HCl theo tỉ lệ mol 1 : 1 tạo muối ClH₃NCH₂COOH.",
                  "isTrue": true,
                  "explain": "Glycine có 1 nhóm -NH₂ tác dụng 1 HCl. Đúng."
                },
                {
                  "id": "tf-c29-b",
                  "statement": "b) Số mol NaOH phản ứng tối đa với dung dịch X là 0,2 mol.",
                  "isTrue": true,
                  "explain": "NaOH phản ứng với cả HCl (0,1 mol) và nhóm -COOH của glycine (0,1 mol). Đúng."
                },
                {
                  "id": "tf-c29-c",
                  "statement": "c) Ở trạng thái rắn, các phân tử glycine tồn tại dưới dạng ion lưỡng cực.",
                  "isTrue": true,
                  "explain": "H₃N⁺-CH₂-COO⁻ tạo mạng tinh thể ion có nhiệt độ nóng chảy cao. Đúng."
                },
                {
                  "id": "tf-c29-d",
                  "statement": "d) Glycine thuộc loại beta-amino acid.",
                  "isTrue": false,
                  "explain": "Glycine có nhóm -NH₂ gắn ở C số 2 (carbon alpha) nên là alpha-amino acid. Sai."
                }
              ]
            },
            {
              "id": "q-c29-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 8,9 gam alanine ($CH_3-CH(NH_2)-COOH$) tác dụng vừa đủ với V ml dung dịch NaOH 1M. Tính giá trị của V (đơn vị: ml)?",
              "correctAnswer": "100",
              "unit": "ml",
              "solution": "M_alanine = 89 g/mol -> n = 8,9 / 89 = 0,1 mol. Alanine có 1 nhóm -COOH nên tác dụng 0,1 mol NaOH. V = 0,1 / 1 = 0,1 lít = 100 ml.",
              "trapAlert": "Không đổi lít sang ml."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c29-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dung dịch chất nào sau đây làm giấy quỳ tím chuyển sang màu xanh?",
              "options": [
                "Lysine",
                "Glycine",
                "Alanine",
                "Glutamic acid"
              ],
              "correct": 0,
              "solution": "Lysine có 2 nhóm -NH₂ và 1 nhóm -COOH nên dung dịch có tính base, làm quỳ tím hóa xanh.",
              "trapAlert": "Nhầm Glycine hay Alanine (chúng không đổi màu quỳ).",
              "fastTip": "Lysine -> hóa XANH; Glutamic acid -> hóa ĐỎ."
            },
            {
              "id": "q-c29-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho 0,1 mol glycine ($H_2N-CH_2-COOH$) tác dụng với dung dịch chứa 0,1 mol HCl thu được dung dịch X. Cho tiếp lượng dư dung dịch NaOH vào dung dịch X. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c29-a",
                  "statement": "a) Glycine tác dụng với HCl theo tỉ lệ mol 1 : 1 tạo muối ClH₃NCH₂COOH.",
                  "isTrue": true,
                  "explain": "Glycine có 1 nhóm -NH₂ tác dụng 1 HCl. Đúng."
                },
                {
                  "id": "tf-c29-b",
                  "statement": "b) Số mol NaOH phản ứng tối đa với dung dịch X là 0,2 mol.",
                  "isTrue": true,
                  "explain": "NaOH phản ứng với cả HCl (0,1 mol) và nhóm -COOH của glycine (0,1 mol). Đúng."
                },
                {
                  "id": "tf-c29-c",
                  "statement": "c) Ở trạng thái rắn, các phân tử glycine tồn tại dưới dạng ion lưỡng cực.",
                  "isTrue": true,
                  "explain": "H₃N⁺-CH₂-COO⁻ tạo mạng tinh thể ion có nhiệt độ nóng chảy cao. Đúng."
                },
                {
                  "id": "tf-c29-d",
                  "statement": "d) Glycine thuộc loại beta-amino acid.",
                  "isTrue": false,
                  "explain": "Glycine có nhóm -NH₂ gắn ở C số 2 (carbon alpha) nên là alpha-amino acid. Sai."
                }
              ]
            },
            {
              "id": "q-c29-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 8,9 gam alanine ($CH_3-CH(NH_2)-COOH$) tác dụng vừa đủ với V ml dung dịch NaOH 1M. Tính giá trị của V (đơn vị: ml)?",
              "correctAnswer": "100",
              "unit": "ml",
              "solution": "M_alanine = 89 g/mol -> n = 8,9 / 89 = 0,1 mol. Alanine có 1 nhóm -COOH nên tác dụng 0,1 mol NaOH. V = 0,1 / 1 = 0,1 lít = 100 ml.",
              "trapAlert": "Không đổi lít sang ml."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-peptide-protein",
          "title": "Peptide & Protein: Cấu trúc, Thủy phân & Phản ứng màu Biuret",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Định nghĩa Peptide & Liên kết Peptide",
              "desc": "Peptide là hợp chất chứa từ 2 đến 50 gốc $\\alpha$-amino acid liên kết với nhau bằng các liên kết peptide ($-CO-NH-$). Liên kết giữa nhóm $-COOH$ của gốc này với $-NH_2$ của gốc kia. Phân loại: dipeptide (2 gốc, 1 liên kết peptide), tripeptide (3 gốc, 2 liên kết peptide)..."
            },
            {
              "title": "Protein & Phản ứng màu Biuret",
              "desc": "Protein là những polypeptide cao phân tử có phân tử khối từ vài vạn đến vài triệu amu. Hiện tượng đông tụ protein bởi nhiệt độ, acid, kiềm hoặc muối kim loại nặng. Phản ứng màu Biuret: Peptide có từ 2 LIÊN KẾT PEPTIDE trở lên (tripeptide trở lên) và protein tác dụng với $Cu(OH)_2$ trong môi trường kiềm cho hợp chất phức màu tím đặc trưng. Dipeptide KHÔNG có phản ứng màu Biuret."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Kiểm tra điều kiện phản ứng màu Biuret",
              "instruction": "Chất phải có từ 2 liên kết peptide trở lên (tripeptide, tetrapeptide... hoặc protein). Dipeptide KHÔNG tham gia phản ứng này."
            },
            {
              "step": 2,
              "title": "Bảo toàn khối lượng phản ứng thủy phân",
              "instruction": "$m_{\\text{peptide}} + m_{NaOH} = m_{\\text{muối}} + m_{H_2O}$ (với $n_{H_2O} = n_{\\text{peptide}}$)."
            }
          ],
          "formulas": [
            {
              "label": "Mối quan hệ giữa số gốc amino acid và liên kết peptide",
              "formula": "\\text{Số liên kết peptide} = \\text{Số gốc } \\alpha\\text{-amino acid} - 1",
              "displayLatex": "\\text{Số liên kết peptide} = n - 1",
              "notes": "Dipeptide: 1 lk; Tripeptide: 2 lk; Tetrapeptide: 3 lk."
            },
            {
              "label": "Thủy phân hoàn toàn peptide bởi NaOH",
              "formula": "\\text{Peptide } n\\text{-pep} + n NaOH \\longrightarrow n \\text{ muối } \\alpha\\text{-amino acid} + H_2O",
              "displayLatex": "\\text{Peptide} + n NaOH \\longrightarrow \\text{Muối} + H_2O",
              "notes": "Luôn sinh ra chỉ 1 phân tử nước (trừ trường hợp amino acid nhiều nhóm chức)."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng Dipeptide có phản ứng màu Biuret",
              "avoid": "Cực kì hay lừa! Dipeptide chỉ có 1 liên kết peptide nên KHÔNG CÓ phản ứng màu Biuret."
            },
            {
              "trap": "Quên trừ nước khi tính khối lượng mol peptide",
              "avoid": "Peptide tạo thành từ n gốc amino acid thì $M_{\\text{peptide}} = \\sum M_{\\text{aa}} - 18(n - 1)$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c30-1",
              "front": "Dipeptide có cho phản ứng màu Biuret với Cu(OH)₂ không?",
              "back": "Không. Phản ứng màu Biuret bắt buộc phải có từ 2 liên kết peptide trở lên (từ tripeptide trở lên)."
            },
            {
              "id": "fc-c30-2",
              "front": "Hiện tượng khi đun nóng lòng trắng trứng (albumin)?",
              "back": "Xảy ra hiện tượng đông tụ protein tạo khối đông rắn màu trắng đục."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c30-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây KHÔNG tham gia phản ứng màu Biuret với $Cu(OH)_2$ trong môi trường kiềm?",
              "options": [
                "Gly-Ala (dipeptide)",
                "Gly-Ala-Val (tripeptide)",
                "Lòng trắng trứng (albumin)",
                "Ala-Gly-Ala-Gly (tetrapeptide)"
              ],
              "correct": 0,
              "solution": "Gly-Ala là dipeptide chỉ chứa 1 liên kết peptide nên không có phản ứng màu Biuret.",
              "trapAlert": "Nghĩ rằng dipeptide cũng có phản ứng màu biuret.",
              "fastTip": "Dipeptide -> KHÔNG phản ứng Biuret."
            },
            {
              "id": "q-c30-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho một tripeptide mạch hở X có công thức cấu tạo là Gly-Ala-Val. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c30-a",
                  "statement": "a) Trong phân tử X có chứa 2 liên kết peptide.",
                  "isTrue": true,
                  "explain": "Tripeptide có 3 - 1 = 2 liên kết peptide. Đúng."
                },
                {
                  "id": "tf-c30-b",
                  "statement": "b) Dung dịch chất X hòa tan được Cu(OH)₂ trong môi trường kiềm cho màu tím đặc trưng.",
                  "isTrue": true,
                  "explain": "X là tripeptide nên tham gia phản ứng màu Biuret. Đúng."
                },
                {
                  "id": "tf-c30-c",
                  "statement": "c) Thủy phân hoàn toàn 1 mol X bằng dung dịch NaOH cần dùng tối đa 3 mol NaOH.",
                  "isTrue": true,
                  "explain": "Gly-Ala-Val + 3NaOH -> 3 muối + 1 H₂O. Đúng."
                },
                {
                  "id": "tf-c30-d",
                  "statement": "d) Phân tử khối của X bằng tổng phân tử khối của Gly + Ala + Val.",
                  "isTrue": false,
                  "explain": "Phải trừ đi 2 phân tử nước tạo thành liên kết peptide: M_X = 75 + 89 + 117 - 2*18 = 245 amu. Sai."
                }
              ]
            },
            {
              "id": "q-c30-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Tính phân tử khối của tripeptide mạch hở Ala-Ala-Ala (tạo từ 3 gốc alanine, $M_{Ala} = 89\\text{ amu}$) (đơn vị: amu)?",
              "correctAnswer": "231",
              "unit": "amu",
              "solution": "M = 3 * 89 - 2 * 18 = 267 - 36 = 231 amu.",
              "trapAlert": "Quên trừ 2 phân tử nước (2 * 18 = 36)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c30-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây KHÔNG tham gia phản ứng màu Biuret với $Cu(OH)_2$ trong môi trường kiềm?",
              "options": [
                "Gly-Ala (dipeptide)",
                "Gly-Ala-Val (tripeptide)",
                "Lòng trắng trứng (albumin)",
                "Ala-Gly-Ala-Gly (tetrapeptide)"
              ],
              "correct": 0,
              "solution": "Gly-Ala là dipeptide chỉ chứa 1 liên kết peptide nên không có phản ứng màu Biuret.",
              "trapAlert": "Nghĩ rằng dipeptide cũng có phản ứng màu biuret.",
              "fastTip": "Dipeptide -> KHÔNG phản ứng Biuret."
            },
            {
              "id": "q-c30-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho một tripeptide mạch hở X có công thức cấu tạo là Gly-Ala-Val. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c30-a",
                  "statement": "a) Trong phân tử X có chứa 2 liên kết peptide.",
                  "isTrue": true,
                  "explain": "Tripeptide có 3 - 1 = 2 liên kết peptide. Đúng."
                },
                {
                  "id": "tf-c30-b",
                  "statement": "b) Dung dịch chất X hòa tan được Cu(OH)₂ trong môi trường kiềm cho màu tím đặc trưng.",
                  "isTrue": true,
                  "explain": "X là tripeptide nên tham gia phản ứng màu Biuret. Đúng."
                },
                {
                  "id": "tf-c30-c",
                  "statement": "c) Thủy phân hoàn toàn 1 mol X bằng dung dịch NaOH cần dùng tối đa 3 mol NaOH.",
                  "isTrue": true,
                  "explain": "Gly-Ala-Val + 3NaOH -> 3 muối + 1 H₂O. Đúng."
                },
                {
                  "id": "tf-c30-d",
                  "statement": "d) Phân tử khối của X bằng tổng phân tử khối của Gly + Ala + Val.",
                  "isTrue": false,
                  "explain": "Phải trừ đi 2 phân tử nước tạo thành liên kết peptide: M_X = 75 + 89 + 117 - 2*18 = 245 amu. Sai."
                }
              ]
            },
            {
              "id": "q-c30-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Tính phân tử khối của tripeptide mạch hở Ala-Ala-Ala (tạo từ 3 gốc alanine, $M_{Ala} = 89\\text{ amu}$) (đơn vị: amu)?",
              "correctAnswer": "231",
              "unit": "amu",
              "solution": "M = 3 * 89 - 2 * 18 = 267 - 36 = 231 amu.",
              "trapAlert": "Quên trừ 2 phân tử nước (2 * 18 = 36)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c30-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây KHÔNG tham gia phản ứng màu Biuret với $Cu(OH)_2$ trong môi trường kiềm?",
              "options": [
                "Gly-Ala (dipeptide)",
                "Gly-Ala-Val (tripeptide)",
                "Lòng trắng trứng (albumin)",
                "Ala-Gly-Ala-Gly (tetrapeptide)"
              ],
              "correct": 0,
              "solution": "Gly-Ala là dipeptide chỉ chứa 1 liên kết peptide nên không có phản ứng màu Biuret.",
              "trapAlert": "Nghĩ rằng dipeptide cũng có phản ứng màu biuret.",
              "fastTip": "Dipeptide -> KHÔNG phản ứng Biuret."
            },
            {
              "id": "q-c30-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho một tripeptide mạch hở X có công thức cấu tạo là Gly-Ala-Val. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c30-a",
                  "statement": "a) Trong phân tử X có chứa 2 liên kết peptide.",
                  "isTrue": true,
                  "explain": "Tripeptide có 3 - 1 = 2 liên kết peptide. Đúng."
                },
                {
                  "id": "tf-c30-b",
                  "statement": "b) Dung dịch chất X hòa tan được Cu(OH)₂ trong môi trường kiềm cho màu tím đặc trưng.",
                  "isTrue": true,
                  "explain": "X là tripeptide nên tham gia phản ứng màu Biuret. Đúng."
                },
                {
                  "id": "tf-c30-c",
                  "statement": "c) Thủy phân hoàn toàn 1 mol X bằng dung dịch NaOH cần dùng tối đa 3 mol NaOH.",
                  "isTrue": true,
                  "explain": "Gly-Ala-Val + 3NaOH -> 3 muối + 1 H₂O. Đúng."
                },
                {
                  "id": "tf-c30-d",
                  "statement": "d) Phân tử khối của X bằng tổng phân tử khối của Gly + Ala + Val.",
                  "isTrue": false,
                  "explain": "Phải trừ đi 2 phân tử nước tạo thành liên kết peptide: M_X = 75 + 89 + 117 - 2*18 = 245 amu. Sai."
                }
              ]
            },
            {
              "id": "q-c30-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Tính phân tử khối của tripeptide mạch hở Ala-Ala-Ala (tạo từ 3 gốc alanine, $M_{Ala} = 89\\text{ amu}$) (đơn vị: amu)?",
              "correctAnswer": "231",
              "unit": "amu",
              "solution": "M = 3 * 89 - 2 * 18 = 267 - 36 = 231 amu.",
              "trapAlert": "Quên trừ 2 phân tử nước (2 * 18 = 36)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-polymer",
      "chapterNum": "05",
      "chapterName": "Polymer và Vật liệu polymer",
      "lessons": [
        {
          "id": "hoa-polymer-chat-deo-to",
          "title": "Polymer, Chất dẻo & Tơ sợi",
          "questionsCount": 26,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Phân loại Polymer theo nguồn gốc & phản ứng",
              "desc": "Nguồn gốc: Thiên nhiên (cao su thiên nhiên, tơ tằm, bông, len); Bán tổng hợp / Nhân tạo (tơ visco, tơ cellulose acetate điều chế từ cellulose thiên nhiên); Tổng hợp (PE, PP, PVC, tơ nylon-6,6, tơ olon)."
            },
            {
              "title": "Phản ứng trùng hợp & Trùng ngưng",
              "desc": "Trùng hợp: kết hợp nhiều phân tử nhỏ (monomer) giống nhau thành phân tử lớn mà KHÔNG giải phóng phân tử nhỏ (điều kiện: monomer có liên kết bội $C=C$ hoặc vòng kém bền). Trùng ngưng: kết hợp nhiều monomer có ít nhất 2 nhóm chức có khả năng phản ứng, ĐỒNG THỜI GIẢI PHÓNG các phân tử nhỏ như $H_2O$ (điều chế nilon-6, nilon-6,6, tơ lapsan)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhận diện tơ nhân tạo (bán tổng hợp)",
              "instruction": "Chỉ gồm 2 loại: Tơ Visco và Tơ Cellulose acetate (đều có nguồn gốc từ cellulose thiên nhiên qua chế biến hóa học)."
            },
            {
              "step": 2,
              "title": "Nhận diện phản ứng trùng hợp hay trùng ngưng",
              "instruction": "Nếu monomer có nối đôi $C=C$ (etilen, vinyl clorua, stiren, isopren): Trùng hợp. Nếu có 2 nhóm chức giải phóng $H_2O$: Trùng ngưng."
            }
          ],
          "formulas": [
            {
              "label": "Mối quan hệ hệ số trùng hợp n",
              "formula": "M_{\\text{polymer}} = n \\times M_{\\text{mắt xích}} \\implies n = \\frac{M_{\\text{polymer}}}{M_{\\text{mắt xích}}}",
              "displayLatex": "n = \\frac{M_{\\text{polymer}}}{M_{\\text{mắt xích}}}",
              "notes": "n là hệ số polime hóa (độ trùng hợp)."
            },
            {
              "label": "Phản ứng điều chế Tơ Nylon-6,6 (Trùng ngưng)",
              "formula": "n H_2N-(CH_2)_6-NH_2 + n HOOC-(CH_2)_4-COOH \\longrightarrow \\text{Nylon-6,6} + 2n H_2O",
              "displayLatex": "[-NH-(CH_2)_6-NH-CO-(CH_2)_4-CO-]_n",
              "notes": "Tơ polyamide có liên kết -CO-NH- kém bền với nhiệt, acid và kiềm."
            }
          ],
          "traps": [
            {
              "trap": "Xếp tơ visco vào loại tơ tổng hợp",
              "avoid": "Tơ visco và tơ acetate là tơ BÁN TỔNG HỢP (nhân tạo), KHÔNG PHẢI tơ tổng hợp."
            },
            {
              "trap": "Nhầm liên kết trong tơ lapsan",
              "avoid": "Tơ lapsan (polyethylene terephthalate) là tơ POLYESTER, không phải polyamide."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c31-1",
              "front": "Tơ visco và tơ acetate thuộc loại tơ nào theo nguồn gốc?",
              "back": "Tơ bán tổng hợp (tơ nhân tạo)."
            },
            {
              "id": "fc-c31-2",
              "front": "Tơ nylon-6,6 được điều chế từ phản ứng nào?",
              "back": "Phản ứng trùng ngưng giữa hexamethylenediamine và adipic acid."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c31-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tơ nào sau đây thuộc loại tơ bán tổng hợp (tơ nhân tạo)?",
              "options": [
                "Tơ visco",
                "Tơ tằm",
                "Tơ nylon-6,6",
                "Tơ nitron (olon)"
              ],
              "correct": 0,
              "solution": "Tơ visco và tơ cellulose acetate được chế biến hóa học từ cellulose thiên nhiên nên là tơ bán tổng hợp.",
              "trapAlert": "Nhầm tơ tằm (tơ thiên nhiên) hoặc nylon-6,6 (tơ tổng hợp).",
              "fastTip": "Tơ bán tổng hợp = Tơ Visco & Tơ Acetate."
            },
            {
              "id": "q-c31-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các polymer: polyethylene (PE), poly(vinyl chloride) (PVC), polyacrylonitrile (tơ nitron), tơ nylon-6,6. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c31-a",
                  "statement": "a) Cả PE và PVC đều được điều chế bằng phản ứng trùng hợp.",
                  "isTrue": true,
                  "explain": "Trùng hợp ethylene ra PE, vinyl chloride ra PVC. Đúng."
                },
                {
                  "id": "tf-c31-b",
                  "statement": "b) Tơ nylon-6,6 thuộc loại tơ polyamide chứa các liên kết -CO-NH-.",
                  "isTrue": true,
                  "explain": "Cấu tạo từ hexamethylenediamine và adipic acid chứa liên kết amide. Đúng."
                },
                {
                  "id": "tf-c31-c",
                  "statement": "c) Quần áo may bằng tơ nylon-6,6 rất bền khi giặt bằng xà phòng có tính kiềm cao trong nước nóng.",
                  "isTrue": false,
                  "explain": "Liên kết -CO-NH- rất dễ bị thủy phân trong môi trường kiềm và acid nên kém bền. Sai."
                },
                {
                  "id": "tf-c31-d",
                  "statement": "d) Monomer để điều chế tơ nitron (olon) là vinyl cyanide (acrylonitrile, CH₂=CH-CN).",
                  "isTrue": true,
                  "explain": "Trùng hợp CH₂=CH-CN tạo tơ nitron giữ nhiệt tốt. Đúng."
                }
              ]
            },
            {
              "id": "q-c31-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Phân tử khối trung bình của một mẫu poly(vinyl chloride) (PVC) là 125000 amu. Tính hệ số polime hóa (độ trùng hợp n) trung bình của mẫu PVC đó?",
              "correctAnswer": "2000",
              "unit": "mắt xích",
              "solution": "Mắt xích PVC là -CH₂-CHCl- có phân tử khối = 62,5 amu. Hệ số trùng hợp n = 125000 / 62,5 = 2000.",
              "trapAlert": "Nhầm khối lượng mắt xích PE (28)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c31-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tơ nào sau đây thuộc loại tơ bán tổng hợp (tơ nhân tạo)?",
              "options": [
                "Tơ visco",
                "Tơ tằm",
                "Tơ nylon-6,6",
                "Tơ nitron (olon)"
              ],
              "correct": 0,
              "solution": "Tơ visco và tơ cellulose acetate được chế biến hóa học từ cellulose thiên nhiên nên là tơ bán tổng hợp.",
              "trapAlert": "Nhầm tơ tằm (tơ thiên nhiên) hoặc nylon-6,6 (tơ tổng hợp).",
              "fastTip": "Tơ bán tổng hợp = Tơ Visco & Tơ Acetate."
            },
            {
              "id": "q-c31-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các polymer: polyethylene (PE), poly(vinyl chloride) (PVC), polyacrylonitrile (tơ nitron), tơ nylon-6,6. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c31-a",
                  "statement": "a) Cả PE và PVC đều được điều chế bằng phản ứng trùng hợp.",
                  "isTrue": true,
                  "explain": "Trùng hợp ethylene ra PE, vinyl chloride ra PVC. Đúng."
                },
                {
                  "id": "tf-c31-b",
                  "statement": "b) Tơ nylon-6,6 thuộc loại tơ polyamide chứa các liên kết -CO-NH-.",
                  "isTrue": true,
                  "explain": "Cấu tạo từ hexamethylenediamine và adipic acid chứa liên kết amide. Đúng."
                },
                {
                  "id": "tf-c31-c",
                  "statement": "c) Quần áo may bằng tơ nylon-6,6 rất bền khi giặt bằng xà phòng có tính kiềm cao trong nước nóng.",
                  "isTrue": false,
                  "explain": "Liên kết -CO-NH- rất dễ bị thủy phân trong môi trường kiềm và acid nên kém bền. Sai."
                },
                {
                  "id": "tf-c31-d",
                  "statement": "d) Monomer để điều chế tơ nitron (olon) là vinyl cyanide (acrylonitrile, CH₂=CH-CN).",
                  "isTrue": true,
                  "explain": "Trùng hợp CH₂=CH-CN tạo tơ nitron giữ nhiệt tốt. Đúng."
                }
              ]
            },
            {
              "id": "q-c31-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Phân tử khối trung bình của một mẫu poly(vinyl chloride) (PVC) là 125000 amu. Tính hệ số polime hóa (độ trùng hợp n) trung bình của mẫu PVC đó?",
              "correctAnswer": "2000",
              "unit": "mắt xích",
              "solution": "Mắt xích PVC là -CH₂-CHCl- có phân tử khối = 62,5 amu. Hệ số trùng hợp n = 125000 / 62,5 = 2000.",
              "trapAlert": "Nhầm khối lượng mắt xích PE (28)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c31-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Tơ nào sau đây thuộc loại tơ bán tổng hợp (tơ nhân tạo)?",
              "options": [
                "Tơ visco",
                "Tơ tằm",
                "Tơ nylon-6,6",
                "Tơ nitron (olon)"
              ],
              "correct": 0,
              "solution": "Tơ visco và tơ cellulose acetate được chế biến hóa học từ cellulose thiên nhiên nên là tơ bán tổng hợp.",
              "trapAlert": "Nhầm tơ tằm (tơ thiên nhiên) hoặc nylon-6,6 (tơ tổng hợp).",
              "fastTip": "Tơ bán tổng hợp = Tơ Visco & Tơ Acetate."
            },
            {
              "id": "q-c31-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét các polymer: polyethylene (PE), poly(vinyl chloride) (PVC), polyacrylonitrile (tơ nitron), tơ nylon-6,6. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c31-a",
                  "statement": "a) Cả PE và PVC đều được điều chế bằng phản ứng trùng hợp.",
                  "isTrue": true,
                  "explain": "Trùng hợp ethylene ra PE, vinyl chloride ra PVC. Đúng."
                },
                {
                  "id": "tf-c31-b",
                  "statement": "b) Tơ nylon-6,6 thuộc loại tơ polyamide chứa các liên kết -CO-NH-.",
                  "isTrue": true,
                  "explain": "Cấu tạo từ hexamethylenediamine và adipic acid chứa liên kết amide. Đúng."
                },
                {
                  "id": "tf-c31-c",
                  "statement": "c) Quần áo may bằng tơ nylon-6,6 rất bền khi giặt bằng xà phòng có tính kiềm cao trong nước nóng.",
                  "isTrue": false,
                  "explain": "Liên kết -CO-NH- rất dễ bị thủy phân trong môi trường kiềm và acid nên kém bền. Sai."
                },
                {
                  "id": "tf-c31-d",
                  "statement": "d) Monomer để điều chế tơ nitron (olon) là vinyl cyanide (acrylonitrile, CH₂=CH-CN).",
                  "isTrue": true,
                  "explain": "Trùng hợp CH₂=CH-CN tạo tơ nitron giữ nhiệt tốt. Đúng."
                }
              ]
            },
            {
              "id": "q-c31-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Phân tử khối trung bình của một mẫu poly(vinyl chloride) (PVC) là 125000 amu. Tính hệ số polime hóa (độ trùng hợp n) trung bình của mẫu PVC đó?",
              "correctAnswer": "2000",
              "unit": "mắt xích",
              "solution": "Mắt xích PVC là -CH₂-CHCl- có phân tử khối = 62,5 amu. Hệ số trùng hợp n = 125000 / 62,5 = 2000.",
              "trapAlert": "Nhầm khối lượng mắt xích PE (28)."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-electro",
      "chapterNum": "06",
      "chapterName": "Pin điện & Điện phân",
      "lessons": [
        {
          "id": "hoa-the-dien-cuc-pin-galvani",
          "title": "Thế điện cực chuẩn & Suất điện động Pin Galvani",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Cặp oxi hóa - khử & Thế điện cực chuẩn E°",
              "desc": "Kí hiệu $Ox/Kh$ (dạng oxi hóa / dạng khử): $M^{n+} + ne \\rightleftharpoons M$. Thế điện cực chuẩn $E^\\circ_{Ox/Kh}$ đo lường khả năng nhận electron của dạng oxi hóa ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}, C = 1\\text{ M}$). Giá trị $E^\\circ$ càng dương thì tính oxi hóa của dạng oxi hóa càng mạnh, tính khử của dạng khử càng yếu."
            },
            {
              "title": "Pin Galvani & Suất điện động chuẩn",
              "desc": "Thiết bị biến đổi hóa năng thành điện năng nhờ phản ứng oxi hóa - khử tự diễn biến. Cực âm (Anode): xảy ra quá trình oxi hóa (kim loại có thế điện cực nhỏ hơn). Cực dương (Cathode): xảy ra quá trình khử (kim loại/ion có thế điện cực lớn hơn). Suất điện động chuẩn: $E^\\circ_{\\text{pin}} = E^\\circ_{\\text{catot}} - E^\\circ_{\\text{anot}} > 0$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định Anode và Cathode",
              "instruction": "So sánh $E^\\circ$: Cực nào có $E^\\circ$ nhỏ hơn là CỰC ÂM (Anode, xảy ra sự oxi hóa). Cực có $E^\\circ$ lớn hơn là CỰC DƯƠNG (Cathode, xảy ra sự khử)."
            },
            {
              "step": 2,
              "title": "Tính suất điện động chuẩn",
              "instruction": "$E^\\circ_{\\text{pin}} = E^\\circ_{\\text{Cathode}} - E^\\circ_{\\text{Anode}}$."
            }
          ],
          "formulas": [
            {
              "label": "Suất điện động chuẩn của Pin Galvani",
              "formula": "E^\\circ_{\\text{pin}} = E^\\circ_{(+)} - E^\\circ_{(-)} = E^\\circ_{\\text{Cathode}} - E^\\circ_{\\text{Anode}}",
              "displayLatex": "E^\\circ_{\\text{pin}} = E^\\circ_{\\text{Cathode}} - E^\\circ_{\\text{Anode}} > 0",
              "notes": "Lấy thế điện cực chuẩn lớn trừ thế điện cực chuẩn nhỏ."
            },
            {
              "label": "Quy tắc alpha (Dự đoán chiều phản ứng)",
              "formula": "\\text{Chất oxi hóa mạnh} + \\text{Chất khử mạnh} \\longrightarrow \\text{Chất oxi hóa yếu} + \\text{Chất khử yếu}",
              "displayLatex": "\\text{Phản ứng tự xảy ra khi } E^\\circ_{\\text{pin}} > 0",
              "notes": "Phản ứng theo quy tắc alpha trên trục thế điện cực."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm cực dương và cực âm giữa Pin điện hóa và Bình điện phân",
              "avoid": "Trong Pin Galvani: Anode là CỰC ÂM (kim loại tan ra), Cathode là CỰC DƯƠNG. Trong Bình điện phân thì ngược lại!"
            },
            {
              "trap": "Lấy thế điện cực nhỏ trừ thế điện cực lớn",
              "avoid": "Suất điện động của pin tự phát luôn DƯƠNG ($E^\\circ_{\\text{pin}} > 0$)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c32-1",
              "front": "Công thức tính suất điện động chuẩn của pin điện hóa?",
              "back": "E°pin = E°(Cathode) - E°(Anode) = E°(+) - E°(-)."
            },
            {
              "id": "fc-c32-2",
              "front": "Ở cực Anode của pin Galvani xảy ra quá trình gì?",
              "back": "Quá trình oxi hóa chất khử (Anode nhường electron)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c32-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho biết thế điện cực chuẩn: $E^\\circ_{Zn^{2+}/Zn} = -0{,}76\\text{ V}$ và $E^\\circ_{Cu^{2+}/Cu} = +0{,}34\\text{ V}$. Suất điện động chuẩn của pin điện hóa Zn – Cu (Pin Daniell) là:",
              "options": [
                "1,10 V",
                "0,42 V",
                "-1,10 V",
                "0,38 V"
              ],
              "correct": 0,
              "solution": "E°pin = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = +0,34 - (-0,76) = +1,10 V.",
              "trapAlert": "Nhầm dấu lấy 0,34 - 0,76 = -0,42 V.",
              "fastTip": "0,34 - (-0,76) = 1,10 V."
            },
            {
              "id": "q-c32-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét pin điện hóa Zn – Cu hoạt động ở điều kiện chuẩn gồm thanh Zn nhúng trong dung dịch $ZnSO_4$ 1M và thanh Cu nhúng trong dung dịch $CuSO_4$ 1M, nối nhau qua cầu muối. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c32-a",
                  "statement": "a) Thanh Zn đóng vai trò là cực âm (anode) và bị tan dần do quá trình Zn -> Zn²⁺ + 2e.",
                  "isTrue": true,
                  "explain": "Zn có thế điện cực âm hơn (-0,76 V) nên là cực âm bị oxi hóa. Đúng."
                },
                {
                  "id": "tf-c32-b",
                  "statement": "b) Thanh Cu đóng vai trò là cực dương (cathode), khối lượng thanh Cu tăng dần.",
                  "isTrue": true,
                  "explain": "Ion Cu²⁺ nhận e kết bám lên thanh Cu: Cu²⁺ + 2e -> Cu. Đúng."
                },
                {
                  "id": "tf-c32-c",
                  "statement": "c) Dòng electron dịch chuyển trong dây dẫn từ thanh Cu sang thanh Zn.",
                  "isTrue": false,
                  "explain": "Dòng electron dịch chuyển từ cực âm (Zn) sang cực dương (Cu). Sai."
                },
                {
                  "id": "tf-c32-d",
                  "statement": "d) Cầu muối có vai trò duy trì tính trung hòa điện tích cho hai dung dịch điện phân.",
                  "isTrue": true,
                  "explain": "Các ion trong cầu muối khuếch tán để trung hòa điện thế 2 cốc. Đúng."
                }
              ]
            },
            {
              "id": "q-c32-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Biết suất điện động chuẩn của pin điện hóa Fe – Ag là $1{,}24\\text{ V}$ và thế điện cực chuẩn của cặp $Ag^+/Ag$ là $+0{,}80\\text{ V}$. Tính thế điện cực chuẩn của cặp $Fe^{2+}/Fe$ (đơn vị: Volt, nhớ ghi rõ dấu âm nếu có)?",
              "correctAnswer": "-0.44",
              "unit": "V",
              "solution": "E°pin = E°(Ag⁺/Ag) - E°(Fe²⁺/Fe) -> 1,24 = 0,80 - E°(Fe²⁺/Fe) -> E°(Fe²⁺/Fe) = 0,80 - 1,24 = -0,44 V.",
              "trapAlert": "Quên dấu âm của thế điện cực Fe."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c32-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho biết thế điện cực chuẩn: $E^\\circ_{Zn^{2+}/Zn} = -0{,}76\\text{ V}$ và $E^\\circ_{Cu^{2+}/Cu} = +0{,}34\\text{ V}$. Suất điện động chuẩn của pin điện hóa Zn – Cu (Pin Daniell) là:",
              "options": [
                "1,10 V",
                "0,42 V",
                "-1,10 V",
                "0,38 V"
              ],
              "correct": 0,
              "solution": "E°pin = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = +0,34 - (-0,76) = +1,10 V.",
              "trapAlert": "Nhầm dấu lấy 0,34 - 0,76 = -0,42 V.",
              "fastTip": "0,34 - (-0,76) = 1,10 V."
            },
            {
              "id": "q-c32-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét pin điện hóa Zn – Cu hoạt động ở điều kiện chuẩn gồm thanh Zn nhúng trong dung dịch $ZnSO_4$ 1M và thanh Cu nhúng trong dung dịch $CuSO_4$ 1M, nối nhau qua cầu muối. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c32-a",
                  "statement": "a) Thanh Zn đóng vai trò là cực âm (anode) và bị tan dần do quá trình Zn -> Zn²⁺ + 2e.",
                  "isTrue": true,
                  "explain": "Zn có thế điện cực âm hơn (-0,76 V) nên là cực âm bị oxi hóa. Đúng."
                },
                {
                  "id": "tf-c32-b",
                  "statement": "b) Thanh Cu đóng vai trò là cực dương (cathode), khối lượng thanh Cu tăng dần.",
                  "isTrue": true,
                  "explain": "Ion Cu²⁺ nhận e kết bám lên thanh Cu: Cu²⁺ + 2e -> Cu. Đúng."
                },
                {
                  "id": "tf-c32-c",
                  "statement": "c) Dòng electron dịch chuyển trong dây dẫn từ thanh Cu sang thanh Zn.",
                  "isTrue": false,
                  "explain": "Dòng electron dịch chuyển từ cực âm (Zn) sang cực dương (Cu). Sai."
                },
                {
                  "id": "tf-c32-d",
                  "statement": "d) Cầu muối có vai trò duy trì tính trung hòa điện tích cho hai dung dịch điện phân.",
                  "isTrue": true,
                  "explain": "Các ion trong cầu muối khuếch tán để trung hòa điện thế 2 cốc. Đúng."
                }
              ]
            },
            {
              "id": "q-c32-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Biết suất điện động chuẩn của pin điện hóa Fe – Ag là $1{,}24\\text{ V}$ và thế điện cực chuẩn của cặp $Ag^+/Ag$ là $+0{,}80\\text{ V}$. Tính thế điện cực chuẩn của cặp $Fe^{2+}/Fe$ (đơn vị: Volt, nhớ ghi rõ dấu âm nếu có)?",
              "correctAnswer": "-0.44",
              "unit": "V",
              "solution": "E°pin = E°(Ag⁺/Ag) - E°(Fe²⁺/Fe) -> 1,24 = 0,80 - E°(Fe²⁺/Fe) -> E°(Fe²⁺/Fe) = 0,80 - 1,24 = -0,44 V.",
              "trapAlert": "Quên dấu âm của thế điện cực Fe."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c32-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho biết thế điện cực chuẩn: $E^\\circ_{Zn^{2+}/Zn} = -0{,}76\\text{ V}$ và $E^\\circ_{Cu^{2+}/Cu} = +0{,}34\\text{ V}$. Suất điện động chuẩn của pin điện hóa Zn – Cu (Pin Daniell) là:",
              "options": [
                "1,10 V",
                "0,42 V",
                "-1,10 V",
                "0,38 V"
              ],
              "correct": 0,
              "solution": "E°pin = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = +0,34 - (-0,76) = +1,10 V.",
              "trapAlert": "Nhầm dấu lấy 0,34 - 0,76 = -0,42 V.",
              "fastTip": "0,34 - (-0,76) = 1,10 V."
            },
            {
              "id": "q-c32-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét pin điện hóa Zn – Cu hoạt động ở điều kiện chuẩn gồm thanh Zn nhúng trong dung dịch $ZnSO_4$ 1M và thanh Cu nhúng trong dung dịch $CuSO_4$ 1M, nối nhau qua cầu muối. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c32-a",
                  "statement": "a) Thanh Zn đóng vai trò là cực âm (anode) và bị tan dần do quá trình Zn -> Zn²⁺ + 2e.",
                  "isTrue": true,
                  "explain": "Zn có thế điện cực âm hơn (-0,76 V) nên là cực âm bị oxi hóa. Đúng."
                },
                {
                  "id": "tf-c32-b",
                  "statement": "b) Thanh Cu đóng vai trò là cực dương (cathode), khối lượng thanh Cu tăng dần.",
                  "isTrue": true,
                  "explain": "Ion Cu²⁺ nhận e kết bám lên thanh Cu: Cu²⁺ + 2e -> Cu. Đúng."
                },
                {
                  "id": "tf-c32-c",
                  "statement": "c) Dòng electron dịch chuyển trong dây dẫn từ thanh Cu sang thanh Zn.",
                  "isTrue": false,
                  "explain": "Dòng electron dịch chuyển từ cực âm (Zn) sang cực dương (Cu). Sai."
                },
                {
                  "id": "tf-c32-d",
                  "statement": "d) Cầu muối có vai trò duy trì tính trung hòa điện tích cho hai dung dịch điện phân.",
                  "isTrue": true,
                  "explain": "Các ion trong cầu muối khuếch tán để trung hòa điện thế 2 cốc. Đúng."
                }
              ]
            },
            {
              "id": "q-c32-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Biết suất điện động chuẩn của pin điện hóa Fe – Ag là $1{,}24\\text{ V}$ và thế điện cực chuẩn của cặp $Ag^+/Ag$ là $+0{,}80\\text{ V}$. Tính thế điện cực chuẩn của cặp $Fe^{2+}/Fe$ (đơn vị: Volt, nhớ ghi rõ dấu âm nếu có)?",
              "correctAnswer": "-0.44",
              "unit": "V",
              "solution": "E°pin = E°(Ag⁺/Ag) - E°(Fe²⁺/Fe) -> 1,24 = 0,80 - E°(Fe²⁺/Fe) -> E°(Fe²⁺/Fe) = 0,80 - 1,24 = -0,44 V.",
              "trapAlert": "Quên dấu âm của thế điện cực Fe."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        },
        {
          "id": "hoa-dien-phan-dung-dich-nong-chay",
          "title": "Điện phân nóng chảy, dung dịch & Định luật Faraday",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Bản chất quá trình điện phân",
              "desc": "Quá trình oxi hóa - khử xảy ra trên bề mặt các điện cực dưới tác dụng của dòng điện một chiều đi qua chất điện li nóng chảy hoặc dung dịch. Cực âm (Cathode): hút cation, xảy ra quá trình KHỬ. Cực dương (Anode): hút anion, xảy ra quá trình OXI HÓA."
            },
            {
              "title": "Thứ tự phóng điện trên điện cực",
              "desc": "Tại Cathode: Cation có tính oxi hóa mạnh hơn phóng điện trước ($Ag^+ > Fe^{3+} > Cu^{2+} > H^+ > Fe^{2+} > Zn^{2+}$). Các ion kim loại nhóm IA, IIA, Al3+ KHÔNG bị khử trong dung dịch nước (nước bị khử thay thế: $2H_2O + 2e \\to H_2 + 2OH^-$). Tại Anode trơ: Anion có tính khử mạnh hơn phóng điện trước ($S^{2-} > I^- > Br^- > Cl^- > H_2O > SO_4^{2-}, NO_3^-$). Nước bị oxi hóa: $2H_2O \\to O_2 + 4H^+ + 4e$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính số mol electron trao đổi",
              "instruction": "$n_e = \\frac{I \\cdot t}{96500}$. Bắt buộc đổi thời gian $t$ sang GIÂY."
            },
            {
              "step": 2,
              "title": "Lần lượt cho các ion phóng điện theo thứ tự",
              "instruction": "So sánh số mol electron cần để khử/oxi hóa từng ion với tổng $n_e$ để biết ion nào đã hết và ion nào đang phóng điện."
            }
          ],
          "formulas": [
            {
              "label": "Định luật Faraday về điện phân",
              "formula": "m = \\frac{A \\cdot I \\cdot t}{n \\cdot F}",
              "displayLatex": "m = \\frac{A I t}{n F}, \\quad n_e = \\frac{I \\cdot t}{F}",
              "notes": "F = 96500 C/mol, t tính bằng giây (s), I tính bằng Ampere (A)."
            },
            {
              "label": "Bảo toàn số mol electron trao đổi ở 2 điện cực",
              "formula": "n_{e\\text{ catot}} = n_{e\\text{ anot}} = \\frac{It}{F}",
              "displayLatex": "n_e = \\frac{It}{F}",
              "notes": "Số mol e nhận ở catot luôn bằng số mol e nhường ở anot."
            }
          ],
          "traps": [
            {
              "trap": "Cho kim loại kiềm hoặc Al thoát ra ở catot khi điện phân dung dịch",
              "avoid": "Trong dung dịch nước, các ion $Na^+, K^+, Ca^{2+}, Al^{3+}$ KHÔNG phóng điện. Nước bị khử sinh ra khí $H_2$ và ion $OH^-$."
            },
            {
              "trap": "Quên đổi thời gian t (giờ, phút) ra giây",
              "avoid": "$1\\text{ giờ} = 3600\\text{ s}$; $1\\text{ phút} = 60\\text{ s}$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c33-1",
              "front": "Khi điện phân dung dịch NaCl có màng ngăn, ở catot thu được chất khí gì?",
              "back": "Khí H₂ (do nước bị khử: 2H₂O + 2e -> H₂ + 2OH⁻)."
            },
            {
              "id": "fc-c33-2",
              "front": "Hằng số Faraday F có giá trị xấp xỉ bao nhiêu?",
              "back": "F ≈ 96500 C/mol."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c33-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Điện phân dung dịch $CuSO_4$ với hai điện cực trơ. Ở cực âm (cathode) xảy ra quá trình nào sau đây?",
              "options": [
                "Sự khử ion Cu²⁺: Cu²⁺ + 2e -> Cu",
                "Sự oxi hóa ion Cu²⁺: Cu -> Cu²⁺ + 2e",
                "Sự khử nước: 2H₂O + 2e -> H₂ + 2OH⁻",
                "Sự oxi hóa nước: 2H₂O -> O₂ + 4H⁺ + 4e"
              ],
              "correct": 0,
              "solution": "Ở cực âm (cathode) hút cation Cu²⁺, ion Cu²⁺ nhận electron nên xảy ra quá trình khử (sự khử) ion Cu²⁺.",
              "trapAlert": "Nhầm quá trình khử với quá trình oxi hóa.",
              "fastTip": "Cathode luôn xảy ra sự KHỬ."
            },
            {
              "id": "q-c33-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Điện phân 200 ml dung dịch NaCl 1M (điện cực trơ, màng ngăn xốp) với cường độ dòng điện $I = 5\\text{ A}$ trong thời gian 1930 giây. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c33-a",
                  "statement": "a) Số mol electron trao đổi trên các điện cực là 0,1 mol.",
                  "isTrue": true,
                  "explain": "n_e = (5 * 1930) / 96500 = 0,1 mol. Đúng."
                },
                {
                  "id": "tf-c33-b",
                  "statement": "b) Ở anode thu được 0,05 mol khí Cl₂.",
                  "isTrue": true,
                  "explain": "2Cl⁻ -> Cl₂ + 2e: n_Cl₂ = 0,1 / 2 = 0,05 mol. Đúng."
                },
                {
                  "id": "tf-c33-c",
                  "statement": "c) Ở cathode có kim loại Sodium (Na) bám vào.",
                  "isTrue": false,
                  "explain": "Na⁺ không bị khử trong dung dịch nước, nước bị khử giải phóng H₂. Sai."
                },
                {
                  "id": "tf-c33-d",
                  "statement": "d) Dung dịch sau điện phân làm quỳ tím hóa đỏ.",
                  "isTrue": false,
                  "explain": "Tạo NaOH (OH⁻) nên dung dịch có tính kiềm làm quỳ tím hóa xanh. Sai."
                }
              ]
            },
            {
              "id": "q-c33-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Điện phân dung dịch chứa $Cu(NO_3)_2$ với điện cực trơ, cường độ $I = 2\\text{ A}$ trong thời gian 9650 giây. Toàn bộ kim loại Cu sinh ra bám hết vào cathode. Tính khối lượng kim loại Cu thu được (đơn vị: gam, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "n_e = (2 * 9650) / 96500 = 0,2 mol. Cu²⁺ + 2e -> Cu -> n_Cu = 0,2 / 2 = 0,1 mol. Khối lượng m = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Nhầm Cu nhận 1 electron."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c33-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Điện phân dung dịch $CuSO_4$ với hai điện cực trơ. Ở cực âm (cathode) xảy ra quá trình nào sau đây?",
              "options": [
                "Sự khử ion Cu²⁺: Cu²⁺ + 2e -> Cu",
                "Sự oxi hóa ion Cu²⁺: Cu -> Cu²⁺ + 2e",
                "Sự khử nước: 2H₂O + 2e -> H₂ + 2OH⁻",
                "Sự oxi hóa nước: 2H₂O -> O₂ + 4H⁺ + 4e"
              ],
              "correct": 0,
              "solution": "Ở cực âm (cathode) hút cation Cu²⁺, ion Cu²⁺ nhận electron nên xảy ra quá trình khử (sự khử) ion Cu²⁺.",
              "trapAlert": "Nhầm quá trình khử với quá trình oxi hóa.",
              "fastTip": "Cathode luôn xảy ra sự KHỬ."
            },
            {
              "id": "q-c33-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Điện phân 200 ml dung dịch NaCl 1M (điện cực trơ, màng ngăn xốp) với cường độ dòng điện $I = 5\\text{ A}$ trong thời gian 1930 giây. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c33-a",
                  "statement": "a) Số mol electron trao đổi trên các điện cực là 0,1 mol.",
                  "isTrue": true,
                  "explain": "n_e = (5 * 1930) / 96500 = 0,1 mol. Đúng."
                },
                {
                  "id": "tf-c33-b",
                  "statement": "b) Ở anode thu được 0,05 mol khí Cl₂.",
                  "isTrue": true,
                  "explain": "2Cl⁻ -> Cl₂ + 2e: n_Cl₂ = 0,1 / 2 = 0,05 mol. Đúng."
                },
                {
                  "id": "tf-c33-c",
                  "statement": "c) Ở cathode có kim loại Sodium (Na) bám vào.",
                  "isTrue": false,
                  "explain": "Na⁺ không bị khử trong dung dịch nước, nước bị khử giải phóng H₂. Sai."
                },
                {
                  "id": "tf-c33-d",
                  "statement": "d) Dung dịch sau điện phân làm quỳ tím hóa đỏ.",
                  "isTrue": false,
                  "explain": "Tạo NaOH (OH⁻) nên dung dịch có tính kiềm làm quỳ tím hóa xanh. Sai."
                }
              ]
            },
            {
              "id": "q-c33-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Điện phân dung dịch chứa $Cu(NO_3)_2$ với điện cực trơ, cường độ $I = 2\\text{ A}$ trong thời gian 9650 giây. Toàn bộ kim loại Cu sinh ra bám hết vào cathode. Tính khối lượng kim loại Cu thu được (đơn vị: gam, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "n_e = (2 * 9650) / 96500 = 0,2 mol. Cu²⁺ + 2e -> Cu -> n_Cu = 0,2 / 2 = 0,1 mol. Khối lượng m = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Nhầm Cu nhận 1 electron."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c33-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Điện phân dung dịch $CuSO_4$ với hai điện cực trơ. Ở cực âm (cathode) xảy ra quá trình nào sau đây?",
              "options": [
                "Sự khử ion Cu²⁺: Cu²⁺ + 2e -> Cu",
                "Sự oxi hóa ion Cu²⁺: Cu -> Cu²⁺ + 2e",
                "Sự khử nước: 2H₂O + 2e -> H₂ + 2OH⁻",
                "Sự oxi hóa nước: 2H₂O -> O₂ + 4H⁺ + 4e"
              ],
              "correct": 0,
              "solution": "Ở cực âm (cathode) hút cation Cu²⁺, ion Cu²⁺ nhận electron nên xảy ra quá trình khử (sự khử) ion Cu²⁺.",
              "trapAlert": "Nhầm quá trình khử với quá trình oxi hóa.",
              "fastTip": "Cathode luôn xảy ra sự KHỬ."
            },
            {
              "id": "q-c33-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Điện phân 200 ml dung dịch NaCl 1M (điện cực trơ, màng ngăn xốp) với cường độ dòng điện $I = 5\\text{ A}$ trong thời gian 1930 giây. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c33-a",
                  "statement": "a) Số mol electron trao đổi trên các điện cực là 0,1 mol.",
                  "isTrue": true,
                  "explain": "n_e = (5 * 1930) / 96500 = 0,1 mol. Đúng."
                },
                {
                  "id": "tf-c33-b",
                  "statement": "b) Ở anode thu được 0,05 mol khí Cl₂.",
                  "isTrue": true,
                  "explain": "2Cl⁻ -> Cl₂ + 2e: n_Cl₂ = 0,1 / 2 = 0,05 mol. Đúng."
                },
                {
                  "id": "tf-c33-c",
                  "statement": "c) Ở cathode có kim loại Sodium (Na) bám vào.",
                  "isTrue": false,
                  "explain": "Na⁺ không bị khử trong dung dịch nước, nước bị khử giải phóng H₂. Sai."
                },
                {
                  "id": "tf-c33-d",
                  "statement": "d) Dung dịch sau điện phân làm quỳ tím hóa đỏ.",
                  "isTrue": false,
                  "explain": "Tạo NaOH (OH⁻) nên dung dịch có tính kiềm làm quỳ tím hóa xanh. Sai."
                }
              ]
            },
            {
              "id": "q-c33-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Điện phân dung dịch chứa $Cu(NO_3)_2$ với điện cực trơ, cường độ $I = 2\\text{ A}$ trong thời gian 9650 giây. Toàn bộ kim loại Cu sinh ra bám hết vào cathode. Tính khối lượng kim loại Cu thu được (đơn vị: gam, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "n_e = (2 * 9650) / 96500 = 0,2 mol. Cu²⁺ + 2e -> Cu -> n_Cu = 0,2 / 2 = 0,1 mol. Khối lượng m = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Nhầm Cu nhận 1 electron."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-metal",
      "chapterNum": "07",
      "chapterName": "Đại cương về kim loại",
      "lessons": [
        {
          "id": "hoa-dai-cuong-kim-loai-an-mon",
          "title": "Tính chất chung kim loại & Ăn mòn kim loại",
          "questionsCount": 28,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Tính chất vật lí & Hóa học chung của Kim loại",
              "desc": "Tính chất vật lí chung (tính dẻo, dẫn điện, dẫn nhiệt, ánh kim) đều do các electron tự do trong mạng tinh thể kim loại gây ra. Kim loại dẫn điện tốt nhất: Ag > Cu > Au > Al > Fe. Tính chất hóa học chung: Tính khử ($M \\to M^{n+} + ne$)."
            },
            {
              "title": "Ăn mòn hóa học & Ăn mòn điện hóa học",
              "desc": "Ăn mòn hóa học: kim loại bị oxi hóa trực tiếp bởi các chất trong môi trường (không phát sinh dòng điện). Ăn mòn điện hóa học: kim loại bị phá hủy do phát sinh dòng điện giữa hai điện cực khác nhau nhúng trong dung dịch điện li. 3 điều kiện ăn mòn điện hóa: có 2 điện cực khác nhau về bản chất; tiếp xúc trực tiếp hoặc gián tiếp qua dây dẫn; cùng nhúng trong dung dịch chất điện li. Kim loại có tính khử mạnh hơn sẽ là CỰC ÂM (Anode) và bị ăn mòn trước."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Kiểm tra 3 điều kiện ăn mòn điện hóa",
              "instruction": "Có cặp kim loại (hoặc kim loại - phi kim như Fe - C) tiếp xúc và cùng nhúng trong dung dịch điện li."
            },
            {
              "step": 2,
              "title": "Xác định kim loại bị ăn mòn trước",
              "instruction": "Kim loại nào đứng trước trong dãy hoạt động hóa học (tính khử mạnh hơn) thì kim loại đó bị ăn mòn trước."
            }
          ],
          "formulas": [
            {
              "label": "Thứ tự dẫn điện của các kim loại",
              "formula": "Ag > Cu > Au > Al > Fe",
              "displayLatex": "Ag > Cu > Au > Al > Fe",
              "notes": "Khẩu quyết: Anh Đồng Áo Âm Sắt."
            },
            {
              "label": "Phương pháp bảo vệ kim loại bằng điện hóa (Vật hi sinh)",
              "formula": "\\text{Kim loại mạnh hơn } (Zn) \\text{ làm Anode bị ăn mòn bảo vệ vỏ tàu sắt } (Fe)",
              "displayLatex": "Zn \\longrightarrow Zn^{2+} + 2e \\quad (\\text{Vật hi sinh})",
              "notes": "Gắn lá kẽm vào vỏ tàu biển bằng thép."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng thanh Fe nguyên chất nhúng vào dung dịch H2SO4 loãng bị ăn mòn điện hóa",
              "avoid": "Chỉ có 1 kim loại Fe nên đây là ăn mòn HÓA HỌC. Nếu nhỏ thêm vài giọt dung dịch $CuSO_4$ thì Fe đẩy Cu ra bám lên Fe $\\implies$ xuất hiện cặp Fe-Cu $\\implies$ mới xảy ra ăn mòn ĐIỆN HÓA."
            },
            {
              "trap": "Nhầm cực bị ăn mòn là cực có tính khử yếu hơn",
              "avoid": "Kim loại CÓ TÍNH KHỬ MẠNH HƠN mới bị ăn mòn bảo vệ kim loại yếu hơn."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c34-1",
              "front": "Kim loại dẫn điện tốt nhất là kim loại nào?",
              "back": "Bạc (Silver, Ag), tiếp theo là Đồng (Cu)."
            },
            {
              "id": "fc-c34-2",
              "front": "Để bảo vệ vỏ tàu biển bằng thép không bị gỉ, người ta gắn vào vỏ tàu tấm kim loại nào?",
              "back": "Gắn các khối Kẽm (Zinc, Zn) làm vật hi sinh."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c34-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để bảo vệ vỏ tàu thủy làm bằng thép khi hoạt động trên biển, người ta thường hàn các khối kim loại nào sau đây vào vỏ tàu (phương pháp điện hóa)?",
              "options": [
                "Kẽm (Zinc, Zn)",
                "Đồng (Copper, Cu)",
                "Chì (Lead, Pb)",
                "Thiếc (Tin, Sn)"
              ],
              "correct": 0,
              "solution": "Zn có tính khử mạnh hơn Fe nên Zn đóng vai trò là anode (cực âm) bị ăn mòn trước (vật hi sinh) bảo vệ vỏ tàu bằng thép (Fe).",
              "trapAlert": "Chọn kim loại quý hơn như Cu (nếu gắn Cu thì Fe sẽ bị ăn mòn nhanh hơn!).",
              "fastTip": "Bảo vệ vỏ tàu biển -> Gắn khối Kẽm (Zn)."
            },
            {
              "id": "q-c34-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nhúng một đinh sắt (Fe) sạch vào cốc chứa dung dịch $H_2SO_4$ loãng, bọt khí $H_2$ thoát ra chậm. Nhỏ thêm vài giọt dung dịch $CuSO_4$ vào cốc. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c34-a",
                  "statement": "a) Sau khi nhỏ CuSO₄, bọt khí H₂ thoát ra nhanh và mạnh hơn rất nhiều.",
                  "isTrue": true,
                  "explain": "Fe đẩy Cu ra bám lên Fe tạo cặp pin điện hóa Fe-Cu làm tốc độ thoát khí tăng vọt. Đúng."
                },
                {
                  "id": "tf-c34-b",
                  "statement": "b) Quá trình trên đã chuyển từ ăn mòn hóa học đơn thuần sang ăn mòn điện hóa học.",
                  "isTrue": true,
                  "explain": "Xuất hiện cặp điện cực Fe - Cu cùng nhúng trong dung dịch điện li. Đúng."
                },
                {
                  "id": "tf-c34-c",
                  "statement": "c) Trong cặp điện cực Fe - Cu, đồng (Cu) đóng vai trò là cực âm và bị ăn mòn.",
                  "isTrue": false,
                  "explain": "Fe có tính khử mạnh hơn Cu nên Fe là cực âm (anode) và Fe bị ăn mòn. Sai."
                },
                {
                  "id": "tf-c34-d",
                  "statement": "d) Khí H₂ thoát ra chủ yếu trên bề mặt của các hạt kim loại Cu bám trên đinh sắt.",
                  "isTrue": true,
                  "explain": "Cu là cực dương (cathode), ion H⁺ đến nhận electron tại bề mặt Cu tạo bọt khí H₂. Đúng."
                }
              ]
            },
            {
              "id": "q-c34-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho một lá sắt có khối lượng 50 gam vào dung dịch $CuSO_4$. Sau một thời gian lấy lá sắt ra, rửa sạch, sấy khô cân lại thấy khối lượng tăng thêm 0,8 gam. Toàn bộ kim loại Cu sinh ra bám hết vào lá sắt. Tính khối lượng kim loại Cu đã bám lên lá sắt (đơn vị: gam)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "Fe + Cu²⁺ -> Fe²⁺ + Cu. Cứ 1 mol Fe (56g) tan ra thì có 1 mol Cu (64g) bám vào -> khối lượng tăng Delta m = 64 - 56 = 8 gam. Theo đề: Delta m = 0,8 gam -> n_Cu = 0,8 / 8 = 0,1 mol. m_Cu = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Lấy 50 cộng 0,8 chia 64."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c34-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để bảo vệ vỏ tàu thủy làm bằng thép khi hoạt động trên biển, người ta thường hàn các khối kim loại nào sau đây vào vỏ tàu (phương pháp điện hóa)?",
              "options": [
                "Kẽm (Zinc, Zn)",
                "Đồng (Copper, Cu)",
                "Chì (Lead, Pb)",
                "Thiếc (Tin, Sn)"
              ],
              "correct": 0,
              "solution": "Zn có tính khử mạnh hơn Fe nên Zn đóng vai trò là anode (cực âm) bị ăn mòn trước (vật hi sinh) bảo vệ vỏ tàu bằng thép (Fe).",
              "trapAlert": "Chọn kim loại quý hơn như Cu (nếu gắn Cu thì Fe sẽ bị ăn mòn nhanh hơn!).",
              "fastTip": "Bảo vệ vỏ tàu biển -> Gắn khối Kẽm (Zn)."
            },
            {
              "id": "q-c34-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nhúng một đinh sắt (Fe) sạch vào cốc chứa dung dịch $H_2SO_4$ loãng, bọt khí $H_2$ thoát ra chậm. Nhỏ thêm vài giọt dung dịch $CuSO_4$ vào cốc. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c34-a",
                  "statement": "a) Sau khi nhỏ CuSO₄, bọt khí H₂ thoát ra nhanh và mạnh hơn rất nhiều.",
                  "isTrue": true,
                  "explain": "Fe đẩy Cu ra bám lên Fe tạo cặp pin điện hóa Fe-Cu làm tốc độ thoát khí tăng vọt. Đúng."
                },
                {
                  "id": "tf-c34-b",
                  "statement": "b) Quá trình trên đã chuyển từ ăn mòn hóa học đơn thuần sang ăn mòn điện hóa học.",
                  "isTrue": true,
                  "explain": "Xuất hiện cặp điện cực Fe - Cu cùng nhúng trong dung dịch điện li. Đúng."
                },
                {
                  "id": "tf-c34-c",
                  "statement": "c) Trong cặp điện cực Fe - Cu, đồng (Cu) đóng vai trò là cực âm và bị ăn mòn.",
                  "isTrue": false,
                  "explain": "Fe có tính khử mạnh hơn Cu nên Fe là cực âm (anode) và Fe bị ăn mòn. Sai."
                },
                {
                  "id": "tf-c34-d",
                  "statement": "d) Khí H₂ thoát ra chủ yếu trên bề mặt của các hạt kim loại Cu bám trên đinh sắt.",
                  "isTrue": true,
                  "explain": "Cu là cực dương (cathode), ion H⁺ đến nhận electron tại bề mặt Cu tạo bọt khí H₂. Đúng."
                }
              ]
            },
            {
              "id": "q-c34-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho một lá sắt có khối lượng 50 gam vào dung dịch $CuSO_4$. Sau một thời gian lấy lá sắt ra, rửa sạch, sấy khô cân lại thấy khối lượng tăng thêm 0,8 gam. Toàn bộ kim loại Cu sinh ra bám hết vào lá sắt. Tính khối lượng kim loại Cu đã bám lên lá sắt (đơn vị: gam)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "Fe + Cu²⁺ -> Fe²⁺ + Cu. Cứ 1 mol Fe (56g) tan ra thì có 1 mol Cu (64g) bám vào -> khối lượng tăng Delta m = 64 - 56 = 8 gam. Theo đề: Delta m = 0,8 gam -> n_Cu = 0,8 / 8 = 0,1 mol. m_Cu = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Lấy 50 cộng 0,8 chia 64."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c34-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để bảo vệ vỏ tàu thủy làm bằng thép khi hoạt động trên biển, người ta thường hàn các khối kim loại nào sau đây vào vỏ tàu (phương pháp điện hóa)?",
              "options": [
                "Kẽm (Zinc, Zn)",
                "Đồng (Copper, Cu)",
                "Chì (Lead, Pb)",
                "Thiếc (Tin, Sn)"
              ],
              "correct": 0,
              "solution": "Zn có tính khử mạnh hơn Fe nên Zn đóng vai trò là anode (cực âm) bị ăn mòn trước (vật hi sinh) bảo vệ vỏ tàu bằng thép (Fe).",
              "trapAlert": "Chọn kim loại quý hơn như Cu (nếu gắn Cu thì Fe sẽ bị ăn mòn nhanh hơn!).",
              "fastTip": "Bảo vệ vỏ tàu biển -> Gắn khối Kẽm (Zn)."
            },
            {
              "id": "q-c34-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nhúng một đinh sắt (Fe) sạch vào cốc chứa dung dịch $H_2SO_4$ loãng, bọt khí $H_2$ thoát ra chậm. Nhỏ thêm vài giọt dung dịch $CuSO_4$ vào cốc. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c34-a",
                  "statement": "a) Sau khi nhỏ CuSO₄, bọt khí H₂ thoát ra nhanh và mạnh hơn rất nhiều.",
                  "isTrue": true,
                  "explain": "Fe đẩy Cu ra bám lên Fe tạo cặp pin điện hóa Fe-Cu làm tốc độ thoát khí tăng vọt. Đúng."
                },
                {
                  "id": "tf-c34-b",
                  "statement": "b) Quá trình trên đã chuyển từ ăn mòn hóa học đơn thuần sang ăn mòn điện hóa học.",
                  "isTrue": true,
                  "explain": "Xuất hiện cặp điện cực Fe - Cu cùng nhúng trong dung dịch điện li. Đúng."
                },
                {
                  "id": "tf-c34-c",
                  "statement": "c) Trong cặp điện cực Fe - Cu, đồng (Cu) đóng vai trò là cực âm và bị ăn mòn.",
                  "isTrue": false,
                  "explain": "Fe có tính khử mạnh hơn Cu nên Fe là cực âm (anode) và Fe bị ăn mòn. Sai."
                },
                {
                  "id": "tf-c34-d",
                  "statement": "d) Khí H₂ thoát ra chủ yếu trên bề mặt của các hạt kim loại Cu bám trên đinh sắt.",
                  "isTrue": true,
                  "explain": "Cu là cực dương (cathode), ion H⁺ đến nhận electron tại bề mặt Cu tạo bọt khí H₂. Đúng."
                }
              ]
            },
            {
              "id": "q-c34-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho một lá sắt có khối lượng 50 gam vào dung dịch $CuSO_4$. Sau một thời gian lấy lá sắt ra, rửa sạch, sấy khô cân lại thấy khối lượng tăng thêm 0,8 gam. Toàn bộ kim loại Cu sinh ra bám hết vào lá sắt. Tính khối lượng kim loại Cu đã bám lên lá sắt (đơn vị: gam)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "Fe + Cu²⁺ -> Fe²⁺ + Cu. Cứ 1 mol Fe (56g) tan ra thì có 1 mol Cu (64g) bám vào -> khối lượng tăng Delta m = 64 - 56 = 8 gam. Theo đề: Delta m = 0,8 gam -> n_Cu = 0,8 / 8 = 0,1 mol. m_Cu = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Lấy 50 cộng 0,8 chia 64."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c12-transition",
      "chapterNum": "08",
      "chapterName": "Kim loại chuyển tiếp & Phức chất",
      "lessons": [
        {
          "id": "hoa-kim-loai-chuyen-tiep-phuc-chat",
          "title": "Kim loại chuyển tiếp dãy thứ nhất & Hóa học Phức chất",
          "questionsCount": 26,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Đặc điểm kim loại chuyển tiếp dãy thứ nhất (Sc đến Cu)",
              "desc": "Các nguyên tố d có phân lớp 3d đang được điền electron dở dang. Thường có nhiều trạng thái oxi hóa khác nhau (ví dụ: $Fe^{+2}, Fe^{+3}$; $Mn^{+2}, Mn^{+4}, Mn^{+7}$; $Cr^{+2}, Cr^{+3}, Cr^{+6}$), các hợp chất có màu sắc phong phú đa dạng do sự chuyển dịch electron giữa các orbital d."
            },
            {
              "title": "Hóa học Phức chất (Coordination Compounds)",
              "desc": "Cấu tạo phức chất gồm nguyên tử/ion trung tâm (thường là cation kim loại chuyển tiếp có orbital trống như $Cu^{2+}, Fe^{3+}, Ag^+$) liên kết phối trí với các phối tử (ligand là phân tử hoặc anion có cặp e tự do như $H_2O, NH_3, Cl^-, OH^-, CN^-$). Số phối tử liên kết trực tiếp với nguyên tử trung tâm gọi là số phối trí (thường là 2, 4, 6)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định nguyên tử trung tâm và phối tử",
              "instruction": "Nguyên tử trung tâm: ion kim loại (ví dụ $Cu^{2+}$). Phối tử: phân tử/ion có cặp e tự do ($NH_3, H_2O, OH^-$)."
            },
            {
              "step": 2,
              "title": "Xác định số phối trí và điện tích của phức",
              "instruction": "Điện tích phức = điện tích nguyên tử trung tâm + tổng điện tích của các phối tử."
            }
          ],
          "formulas": [
            {
              "label": "Phức chất aqua và phức chất amine của Cu2+",
              "formula": "[Cu(H_2O)_6]^{2+} \\text{ (xanh lam nhạt)}, \\quad [Cu(NH_3)_4(H_2O)_2]^{2+} \\text{ (xanh lam thẫm)}",
              "displayLatex": "[Cu(H_2O)_6]^{2+} \\xrightarrow{+NH_3} [Cu(NH_3)_4(H_2O)_2]^{2+} \\text{ (xanh thẫm)}",
              "notes": "Phản ứng đặc trưng nhận biết ion Cu²⁺ bằng dung dịch NH₃ dư."
            },
            {
              "label": "Phức chất tan của Ag+ với ammonia",
              "formula": "AgCl \\downarrow + 2NH_3 \\longrightarrow [Ag(NH_3)_2]^+ + Cl^-",
              "displayLatex": "AgCl + 2NH_3 \\longrightarrow [Ag(NH_3)_2]Cl",
              "notes": "Kết tủa AgCl tan trong dung dịch NH₃ do tạo phức."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm liên kết trong phức chất là liên kết ion",
              "avoid": "Liên kết giữa nguyên tử trung tâm và phối tử là LIÊN KẾT PHỐI TRÍ (liên kết cộng hóa trị cho - nhận)."
            },
            {
              "trap": "Cho rằng Al(OH)3 tan được trong dung dịch NH3 dư",
              "avoid": "$Al(OH)_3$ KHÔNG tan trong $NH_3$ dư vì $Al^{3+}$ không có khả năng tạo phức amine bền như $Cu^{2+}, Zn^{2+}, Ag^+$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c35-1",
              "front": "Hiện tượng khi cho dung dịch NH₃ từ từ đến dư vào dung dịch CuSO₄?",
              "back": "Ban đầu xuất hiện kết tủa xanh nhạt Cu(OH)₂, sau đó kết tủa tan tạo dung dịch phức màu xanh lam thẫm [Cu(NH₃)₄(H₂O)₂]²⁺."
            },
            {
              "id": "fc-c35-2",
              "front": "Số phối trí của ion Cu²⁺ trong phức chất [Cu(NH₃)₄]²⁺ là bao nhiêu?",
              "back": "Số phối trí bằng 4 (liên kết với 4 phân tử phối tử NH₃)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c35-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho dung dịch ammonia ($NH_3$) dư vào ống nghiệm chứa dung dịch copper(II) sulfate ($CuSO_4$), hiện tượng quan sát được là:",
              "options": [
                "Xuất hiện kết tủa xanh nhạt, sau đó kết tủa tan tạo dung dịch màu xanh lam thẫm",
                "Xuất hiện kết tủa màu xanh lam không tan",
                "Xuất hiện kết tủa màu nâu đỏ",
                "Dung dịch chuyển sang màu vàng tươi"
              ],
              "correct": 0,
              "solution": "Ban đầu tạo kết tủa Cu(OH)₂ xanh nhạt: Cu²⁺ + 2NH₃ + 2H₂O -> Cu(OH)₂↓ + 2NH₄⁺. Khi NH₃ dư, kết tủa tan tạo phức chất [Cu(NH₃)₄(H₂O)₂]²⁺ màu xanh lam thẫm đặc trưng.",
              "trapAlert": "Nghĩ rằng kết tủa Cu(OH)₂ không tan trong NH₃ dư.",
              "fastTip": "Cu²⁺ + NH₃ dư -> XANH LAM THẪM."
            },
            {
              "id": "q-c35-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét phức chất $[Fe(CN)_6]^{4-}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c35-a",
                  "statement": "a) Nguyên tử trung tâm trong phức chất trên là ion Fe²⁺.",
                  "isTrue": true,
                  "explain": "Fe có số oxi hóa +2: (+2) + 6*(-1) = -4. Đúng."
                },
                {
                  "id": "tf-c35-b",
                  "statement": "b) Phối tử trong phức chất trên là anion cyanide (CN⁻).",
                  "isTrue": true,
                  "explain": "CN⁻ đóng vai trò là phối tử cho cặp electron. Đúng."
                },
                {
                  "id": "tf-c35-c",
                  "statement": "c) Số phối trí của nguyên tử trung tâm Fe²⁺ trong phức chất là 6.",
                  "isTrue": true,
                  "explain": "Có 6 phối tử CN⁻ liên kết trực tiếp. Đúng."
                },
                {
                  "id": "tf-c35-d",
                  "statement": "d) Liên kết giữa ion Fe²⁺ và các phối tử CN⁻ là liên kết ion tĩnh điện.",
                  "isTrue": false,
                  "explain": "Là liên kết cho - nhận (phối trí). Sai."
                }
              ]
            },
            {
              "id": "q-c35-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Số oxi hóa của nguyên tử trung tâm Cobalt (Co) trong phức chất $[Co(NH_3)_5Cl]Cl_2$ là bao nhiêu?",
              "correctAnswer": "+3",
              "unit": "",
              "solution": "Hai ion Cl⁻ bên ngoài mang điện tích -2 -> phức mang điện tích +2: [Co(NH₃)₅Cl]²⁺. Phối tử NH₃ trung hòa (0), Cl bên trong là -1. Ta có: x + 5*(0) + (-1) = +2 -> x = +3.",
              "trapAlert": "Quên tính các anion chloride bên ngoài cầu ngoại."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c35-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho dung dịch ammonia ($NH_3$) dư vào ống nghiệm chứa dung dịch copper(II) sulfate ($CuSO_4$), hiện tượng quan sát được là:",
              "options": [
                "Xuất hiện kết tủa xanh nhạt, sau đó kết tủa tan tạo dung dịch màu xanh lam thẫm",
                "Xuất hiện kết tủa màu xanh lam không tan",
                "Xuất hiện kết tủa màu nâu đỏ",
                "Dung dịch chuyển sang màu vàng tươi"
              ],
              "correct": 0,
              "solution": "Ban đầu tạo kết tủa Cu(OH)₂ xanh nhạt: Cu²⁺ + 2NH₃ + 2H₂O -> Cu(OH)₂↓ + 2NH₄⁺. Khi NH₃ dư, kết tủa tan tạo phức chất [Cu(NH₃)₄(H₂O)₂]²⁺ màu xanh lam thẫm đặc trưng.",
              "trapAlert": "Nghĩ rằng kết tủa Cu(OH)₂ không tan trong NH₃ dư.",
              "fastTip": "Cu²⁺ + NH₃ dư -> XANH LAM THẪM."
            },
            {
              "id": "q-c35-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét phức chất $[Fe(CN)_6]^{4-}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c35-a",
                  "statement": "a) Nguyên tử trung tâm trong phức chất trên là ion Fe²⁺.",
                  "isTrue": true,
                  "explain": "Fe có số oxi hóa +2: (+2) + 6*(-1) = -4. Đúng."
                },
                {
                  "id": "tf-c35-b",
                  "statement": "b) Phối tử trong phức chất trên là anion cyanide (CN⁻).",
                  "isTrue": true,
                  "explain": "CN⁻ đóng vai trò là phối tử cho cặp electron. Đúng."
                },
                {
                  "id": "tf-c35-c",
                  "statement": "c) Số phối trí của nguyên tử trung tâm Fe²⁺ trong phức chất là 6.",
                  "isTrue": true,
                  "explain": "Có 6 phối tử CN⁻ liên kết trực tiếp. Đúng."
                },
                {
                  "id": "tf-c35-d",
                  "statement": "d) Liên kết giữa ion Fe²⁺ và các phối tử CN⁻ là liên kết ion tĩnh điện.",
                  "isTrue": false,
                  "explain": "Là liên kết cho - nhận (phối trí). Sai."
                }
              ]
            },
            {
              "id": "q-c35-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Số oxi hóa của nguyên tử trung tâm Cobalt (Co) trong phức chất $[Co(NH_3)_5Cl]Cl_2$ là bao nhiêu?",
              "correctAnswer": "+3",
              "unit": "",
              "solution": "Hai ion Cl⁻ bên ngoài mang điện tích -2 -> phức mang điện tích +2: [Co(NH₃)₅Cl]²⁺. Phối tử NH₃ trung hòa (0), Cl bên trong là -1. Ta có: x + 5*(0) + (-1) = +2 -> x = +3.",
              "trapAlert": "Quên tính các anion chloride bên ngoài cầu ngoại."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c35-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho dung dịch ammonia ($NH_3$) dư vào ống nghiệm chứa dung dịch copper(II) sulfate ($CuSO_4$), hiện tượng quan sát được là:",
              "options": [
                "Xuất hiện kết tủa xanh nhạt, sau đó kết tủa tan tạo dung dịch màu xanh lam thẫm",
                "Xuất hiện kết tủa màu xanh lam không tan",
                "Xuất hiện kết tủa màu nâu đỏ",
                "Dung dịch chuyển sang màu vàng tươi"
              ],
              "correct": 0,
              "solution": "Ban đầu tạo kết tủa Cu(OH)₂ xanh nhạt: Cu²⁺ + 2NH₃ + 2H₂O -> Cu(OH)₂↓ + 2NH₄⁺. Khi NH₃ dư, kết tủa tan tạo phức chất [Cu(NH₃)₄(H₂O)₂]²⁺ màu xanh lam thẫm đặc trưng.",
              "trapAlert": "Nghĩ rằng kết tủa Cu(OH)₂ không tan trong NH₃ dư.",
              "fastTip": "Cu²⁺ + NH₃ dư -> XANH LAM THẪM."
            },
            {
              "id": "q-c35-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét phức chất $[Fe(CN)_6]^{4-}$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c35-a",
                  "statement": "a) Nguyên tử trung tâm trong phức chất trên là ion Fe²⁺.",
                  "isTrue": true,
                  "explain": "Fe có số oxi hóa +2: (+2) + 6*(-1) = -4. Đúng."
                },
                {
                  "id": "tf-c35-b",
                  "statement": "b) Phối tử trong phức chất trên là anion cyanide (CN⁻).",
                  "isTrue": true,
                  "explain": "CN⁻ đóng vai trò là phối tử cho cặp electron. Đúng."
                },
                {
                  "id": "tf-c35-c",
                  "statement": "c) Số phối trí của nguyên tử trung tâm Fe²⁺ trong phức chất là 6.",
                  "isTrue": true,
                  "explain": "Có 6 phối tử CN⁻ liên kết trực tiếp. Đúng."
                },
                {
                  "id": "tf-c35-d",
                  "statement": "d) Liên kết giữa ion Fe²⁺ và các phối tử CN⁻ là liên kết ion tĩnh điện.",
                  "isTrue": false,
                  "explain": "Là liên kết cho - nhận (phối trí). Sai."
                }
              ]
            },
            {
              "id": "q-c35-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Số oxi hóa của nguyên tử trung tâm Cobalt (Co) trong phức chất $[Co(NH_3)_5Cl]Cl_2$ là bao nhiêu?",
              "correctAnswer": "+3",
              "unit": "",
              "solution": "Hai ion Cl⁻ bên ngoài mang điện tích -2 -> phức mang điện tích +2: [Co(NH₃)₅Cl]²⁺. Phối tử NH₃ trung hòa (0), Cl bên trong là -1. Ta có: x + 5*(0) + (-1) = +2 -> x = +3.",
              "trapAlert": "Quên tính các anion chloride bên ngoài cầu ngoại."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "hoa"
        }
      ]
    },
    {
      "chapterId": "c11-nitrogen",
      "chapterName": "Nitrogen & Sulfur",
      "grade": 11,
      "lessons": [
        {
          "id": "hoa-nitrogen-ammonia-nitric-acid",
          "title": "Nitrogen, Ammonia & Nitric acid (HNO₃)",
          "desc": "Cấu tạo phân tử $N_2$, tính base và tính khử của $NH_3$, tính oxi hóa cực mạnh của $HNO_3$ và bảo toàn electron.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đơn chất Nitrogen & Ammonia",
              "desc": "Phân tử $N_2$ có liên kết ba $N \\equiv N$ rất bền vững ($E_b = 945\\text{ kJ/mol}$), khá trơ ở nhiệt độ thường. Ammonia ($NH_3$) có cấu trúc chóp tam giác, còn 1 cặp e tự do nên thể hiện tính base yếu và tính khử mạnh ($NH_3 + O_2, CuO$)."
            },
            {
              "title": "Nitric acid (HNO3) & Tính oxi hóa cực mạnh",
              "desc": "Nitric acid là acid mạnh và chất oxi hóa rất mạnh. Oxi hóa hầu hết kim loại (trừ Au, Pt) lên số oxi hóa cao nhất, không giải phóng $H_2$. Fe, Al, Cr bị thụ động hóa trong $HNO_3$ đặc nguội."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Kiểm tra muối amoni NH4NO3",
              "instruction": "Khi kim loại là Mg, Al, Zn: nếu $m_{\\text{muối}} > m_{\\text{kim loại}} + 62 \\times \\sum n_e$ hoặc đề nói \"không có khí thoát ra\", chắc chắn có $NH_4NO_3$."
            },
            {
              "step": 2,
              "title": "Áp dụng bảo toàn e",
              "instruction": "Tính số mol e nhường = số mol e nhận để tìm lượng kim loại hoặc thể tích khí."
            }
          ],
          "formulas": [
            {
              "label": "Bảo toàn electron khi phản ứng với HNO3",
              "formula": "\\sum n_{\\text{kim loại}} \\times \\text{hóa trị} = 3n_{NO} + n_{NO_2} + 8n_{N_2O} + 10n_{N_2} + 8n_{NH_4NO_3}",
              "displayLatex": "\\sum n_e = 3n_{NO} + n_{NO_2} + 8n_{N_2O} + 10n_{N_2} + 8n_{NH_4NO_3}",
              "notes": "Khắc sâu số e trao đổi của từng sản phẩm khử."
            },
            {
              "label": "Tính nhanh số mol HNO3 đã phản ứng",
              "formula": "n_{HNO_3} = 4n_{NO} + 2n_{NO_2} + 10n_{N_2O} + 12n_{N_2} + 10n_{NH_4NO_3}",
              "displayLatex": "n_{HNO_3} = 4n_{NO} + 2n_{NO_2} + 10n_{N_2O} + 12n_{N_2} + 10n_{NH_4NO_3}",
              "notes": "Gồm phần bị khử và phần tạo muối nitrate."
            }
          ],
          "traps": [
            {
              "trap": "Quên muối NH4NO3 khi kim loại là Mg, Al, Zn",
              "avoid": "Kim loại có tính khử mạnh (Mg, Al, Zn) khử $N^{+5}$ sâu xuống $N^{-3}$ trong $NH_4NO_3$."
            },
            {
              "trap": "Nhầm thụ động hóa trong HNO3 đặc NÓNG",
              "avoid": "Fe, Al, Cr chỉ thụ động hóa trong $HNO_3$ đặc NGUỘI, đun nóng vẫn phản ứng mãnh liệt tạo $NO_2$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c11-1",
              "front": "Những kim loại nào bị thụ động hóa trong HNO₃ đặc nguội?",
              "back": "Fe (Iron), Al (Aluminium) và Cr (Chromium)."
            },
            {
              "id": "fc-c11-2",
              "front": "Khí nào sinh ra hiện tượng phú dưỡng nguồn nước?",
              "back": "Hàm lượng ion nitrate (NO₃⁻) và phosphate (PO₄³⁻) dư thừa từ phân bón."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c11-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dãy kim loại nào sau đây đều bị thụ động hóa trong dung dịch $HNO_3$ đặc, nguội?",
              "options": [
                "Al, Fe, Cr",
                "Cu, Ag, Au",
                "Mg, Zn, Fe",
                "Na, K, Ca"
              ],
              "correct": 0,
              "solution": "Aluminium (Al), Iron (Fe), Chromium (Cr) bị thụ động hóa trong HNO₃ đặc nguội và H₂SO₄ đặc nguội do tạo màng oxide bảo vệ vững chắc.",
              "trapAlert": "Nhầm đồng (Cu) bị thụ động hóa (Cu tan tốt trong acid đặc tạo khí NO₂ màu nâu đỏ).",
              "fastTip": "Nhớ \"Nhôm - Sắt - Crom (Al - Fe - Cr)\"."
            },
            {
              "id": "q-c11-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho 1,92 gam Cu tác dụng hoàn toàn với dung dịch $HNO_3$ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c11-a",
                  "statement": "a) Số mol đồng tham gia phản ứng là 0,03 mol.",
                  "isTrue": true,
                  "explain": "n_Cu = 1,92 / 64 = 0,03 mol. Đúng."
                },
                {
                  "id": "tf-c11-b",
                  "statement": "b) Số mol khí NO thu được là 0,02 mol.",
                  "isTrue": true,
                  "explain": "Bảo toàn e: 2 * n_Cu = 3 * n_NO -> n_NO = (2 * 0,03) / 3 = 0,02 mol. Đúng."
                },
                {
                  "id": "tf-c11-c",
                  "statement": "c) Thể tích khí NO ở điều kiện chuẩn là 0,4958 lít.",
                  "isTrue": true,
                  "explain": "V = 0,02 * 24,79 = 0,4958 lít. Đúng."
                },
                {
                  "id": "tf-c11-d",
                  "statement": "d) Số mol HNO₃ đã tham gia phản ứng là 0,06 mol.",
                  "isTrue": false,
                  "explain": "n_HNO₃ = 4 * n_NO = 4 * 0,02 = 0,08 mol != 0,06 mol. Sai."
                }
              ]
            },
            {
              "id": "q-c11-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hết 4,8 gam Magnesium (Mg) vào dung dịch $HNO_3$ loãng dư. Sau phản ứng thu được $0{,}04\\text{ mol}$ khí $N_2$ duy nhất và dung dịch X. Cô cạn cẩn thận dung dịch X thu được m gam muối khan. Tính giá trị của m (đơn vị: gam, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "29.6",
              "unit": "gam",
              "solution": "n_Mg = 4,8 / 24 = 0,2 mol. n_e nhường = 0,2 * 2 = 0,4 mol. n_e nhận tạo N₂ = 0,04 * 10 = 0,4 mol. Vậy không có NH₄NO₃. m_muối = m_Mg(NO₃)₂ = 0,2 * 148 = 29,6 gam. Khoan! Nếu đề có NH₄NO₃ thì sao? Ở đây: 0,4 = 0,4 nên vừa đủ -> m = 29,6 gam. Sửa câu hỏi rõ: m = 29,6 gam."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c11-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dãy kim loại nào sau đây đều bị thụ động hóa trong dung dịch $HNO_3$ đặc, nguội?",
              "options": [
                "Al, Fe, Cr",
                "Cu, Ag, Au",
                "Mg, Zn, Fe",
                "Na, K, Ca"
              ],
              "correct": 0,
              "solution": "Aluminium (Al), Iron (Fe), Chromium (Cr) bị thụ động hóa trong HNO₃ đặc nguội và H₂SO₄ đặc nguội do tạo màng oxide bảo vệ vững chắc.",
              "trapAlert": "Nhầm đồng (Cu) bị thụ động hóa (Cu tan tốt trong acid đặc tạo khí NO₂ màu nâu đỏ).",
              "fastTip": "Nhớ \"Nhôm - Sắt - Crom (Al - Fe - Cr)\"."
            },
            {
              "id": "q-c11-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho 1,92 gam Cu tác dụng hoàn toàn với dung dịch $HNO_3$ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c11-a",
                  "statement": "a) Số mol đồng tham gia phản ứng là 0,03 mol.",
                  "isTrue": true,
                  "explain": "n_Cu = 1,92 / 64 = 0,03 mol. Đúng."
                },
                {
                  "id": "tf-c11-b",
                  "statement": "b) Số mol khí NO thu được là 0,02 mol.",
                  "isTrue": true,
                  "explain": "Bảo toàn e: 2 * n_Cu = 3 * n_NO -> n_NO = (2 * 0,03) / 3 = 0,02 mol. Đúng."
                },
                {
                  "id": "tf-c11-c",
                  "statement": "c) Thể tích khí NO ở điều kiện chuẩn là 0,4958 lít.",
                  "isTrue": true,
                  "explain": "V = 0,02 * 24,79 = 0,4958 lít. Đúng."
                },
                {
                  "id": "tf-c11-d",
                  "statement": "d) Số mol HNO₃ đã tham gia phản ứng là 0,06 mol.",
                  "isTrue": false,
                  "explain": "n_HNO₃ = 4 * n_NO = 4 * 0,02 = 0,08 mol != 0,06 mol. Sai."
                }
              ]
            },
            {
              "id": "q-c11-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hết 4,8 gam Magnesium (Mg) vào dung dịch $HNO_3$ loãng dư. Sau phản ứng thu được $0{,}04\\text{ mol}$ khí $N_2$ duy nhất và dung dịch X. Cô cạn cẩn thận dung dịch X thu được m gam muối khan. Tính giá trị của m (đơn vị: gam, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "29.6",
              "unit": "gam",
              "solution": "n_Mg = 4,8 / 24 = 0,2 mol. n_e nhường = 0,2 * 2 = 0,4 mol. n_e nhận tạo N₂ = 0,04 * 10 = 0,4 mol. Vậy không có NH₄NO₃. m_muối = m_Mg(NO₃)₂ = 0,2 * 148 = 29,6 gam. Khoan! Nếu đề có NH₄NO₃ thì sao? Ở đây: 0,4 = 0,4 nên vừa đủ -> m = 29,6 gam. Sửa câu hỏi rõ: m = 29,6 gam."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c11-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Dãy kim loại nào sau đây đều bị thụ động hóa trong dung dịch $HNO_3$ đặc, nguội?",
              "options": [
                "Al, Fe, Cr",
                "Cu, Ag, Au",
                "Mg, Zn, Fe",
                "Na, K, Ca"
              ],
              "correct": 0,
              "solution": "Aluminium (Al), Iron (Fe), Chromium (Cr) bị thụ động hóa trong HNO₃ đặc nguội và H₂SO₄ đặc nguội do tạo màng oxide bảo vệ vững chắc.",
              "trapAlert": "Nhầm đồng (Cu) bị thụ động hóa (Cu tan tốt trong acid đặc tạo khí NO₂ màu nâu đỏ).",
              "fastTip": "Nhớ \"Nhôm - Sắt - Crom (Al - Fe - Cr)\"."
            },
            {
              "id": "q-c11-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho 1,92 gam Cu tác dụng hoàn toàn với dung dịch $HNO_3$ loãng dư, thu được V lít khí NO (sản phẩm khử duy nhất ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c11-a",
                  "statement": "a) Số mol đồng tham gia phản ứng là 0,03 mol.",
                  "isTrue": true,
                  "explain": "n_Cu = 1,92 / 64 = 0,03 mol. Đúng."
                },
                {
                  "id": "tf-c11-b",
                  "statement": "b) Số mol khí NO thu được là 0,02 mol.",
                  "isTrue": true,
                  "explain": "Bảo toàn e: 2 * n_Cu = 3 * n_NO -> n_NO = (2 * 0,03) / 3 = 0,02 mol. Đúng."
                },
                {
                  "id": "tf-c11-c",
                  "statement": "c) Thể tích khí NO ở điều kiện chuẩn là 0,4958 lít.",
                  "isTrue": true,
                  "explain": "V = 0,02 * 24,79 = 0,4958 lít. Đúng."
                },
                {
                  "id": "tf-c11-d",
                  "statement": "d) Số mol HNO₃ đã tham gia phản ứng là 0,06 mol.",
                  "isTrue": false,
                  "explain": "n_HNO₃ = 4 * n_NO = 4 * 0,02 = 0,08 mol != 0,06 mol. Sai."
                }
              ]
            },
            {
              "id": "q-c11-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hết 4,8 gam Magnesium (Mg) vào dung dịch $HNO_3$ loãng dư. Sau phản ứng thu được $0{,}04\\text{ mol}$ khí $N_2$ duy nhất và dung dịch X. Cô cạn cẩn thận dung dịch X thu được m gam muối khan. Tính giá trị của m (đơn vị: gam, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "29.6",
              "unit": "gam",
              "solution": "n_Mg = 4,8 / 24 = 0,2 mol. n_e nhường = 0,2 * 2 = 0,4 mol. n_e nhận tạo N₂ = 0,04 * 10 = 0,4 mol. Vậy không có NH₄NO₃. m_muối = m_Mg(NO₃)₂ = 0,2 * 148 = 29,6 gam. Khoan! Nếu đề có NH₄NO₃ thì sao? Ở đây: 0,4 = 0,4 nên vừa đủ -> m = 29,6 gam. Sửa câu hỏi rõ: m = 29,6 gam."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        },
        {
          "id": "hoa-sulfur-sulfur-dioxide-sulfuric-acid",
          "title": "Sulfur, Sulfur dioxide & Sulfuric acid (H₂SO₄)",
          "desc": "Tính chất của sulfur, sulfur dioxide gây mưa acid, quy trình tiếp xúc sản xuất $H_2SO_4$ và tính háo nước mạnh.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đơn chất Sulfur & Khí SO2",
              "desc": "Sulfur ($S$) có số oxi hóa trung gian (0) nên vừa có tính oxi hóa ($S + Fe, Hg$) vừa có tính khử ($S + O_2, F_2$). Thủy ngân ($Hg$) phản ứng với bột lưu huỳnh ngay nhiệt độ thường dùng xử lí nhiệt kế vỡ. $SO_2$ là khí mùi hắc, gây mưa acid, làm mất màu dung dịch nước bromine và thuốc tím KMnO4."
            },
            {
              "title": "Sulfuric acid (H2SO4) đặc",
              "desc": "Có 3 tính chất đặc trưng: Tính acid mạnh; Tính oxi hóa rất mạnh (oxi hóa C, S và hầu hết kim loại tạo $SO_2$); Tính háo nước cực mạnh (than hóa đường saccharose, làm bỏng da nặng)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Quy tắc an toàn pha loãng H2SO4 đặc",
              "instruction": "Rót từ từ acid đặc vào nước và khuấy nhẹ. TUYỆT ĐỐI KHÔNG làm ngược lại (rót nước vào acid sẽ gây sôi cục bộ bắn acid vào người)."
            },
            {
              "step": 2,
              "title": "Nhận biết ion sulfate SO4(2-)",
              "instruction": "Dùng dung dịch muối Barium ($BaCl_2, Ba(OH)_2$) tạo kết tủa trắng $BaSO_4$ không tan trong acid mạnh."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng gom thủy ngân rơi vãi bằng bột lưu huỳnh",
              "formula": "Hg + S \\longrightarrow HgS",
              "displayLatex": "Hg + S \\longrightarrow HgS",
              "notes": "Xảy ra ngay ở nhiệt độ thường, tạo HgS không độc."
            },
            {
              "label": "Phản ứng làm mất màu nước bromine của SO2",
              "formula": "SO_2 + Br_2 + 2H_2O \\longrightarrow 2HBr + H_2SO_4",
              "displayLatex": "SO_2 + Br_2 + 2H_2O \\longrightarrow 2HBr + H_2SO_4",
              "notes": "Dùng để phân biệt SO₂ với CO₂."
            },
            {
              "label": "Phản ứng than hóa đường của H2SO4 đặc",
              "formula": "C_{12}H_{22}O_{11} \\xrightarrow{H_2SO_4 \\text{ đặc}} 12C + 11H_2O",
              "displayLatex": "C_{12}H_{22}O_{11} \\longrightarrow 12C + 11H_2O",
              "notes": "C tiếp tục bị oxi hóa tạo bọt khí CO₂ và SO₂ dâng trào."
            }
          ],
          "traps": [
            {
              "trap": "Rót nước vào dung dịch H2SO4 đặc khi pha loãng",
              "avoid": "Cực kì nguy hiểm! Phải luôn luôn \"rót acid vào nước, không làm ngược lại\"."
            },
            {
              "trap": "Dùng nước vôi trong để phân biệt SO2 và CO2",
              "avoid": "Cả hai đều làm đục nước vôi trong ($CaCO_3$ và $CaSO_3$). Phải dùng dung dịch nước $Br_2$ hoặc thuốc tím $KMnO_4$."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c12-1",
              "front": "Chất nào dùng để thu hồi thủy ngân (Hg) khi bị vỡ nhiệt kế?",
              "back": "Bột lưu huỳnh (Sulfur, S)."
            },
            {
              "id": "fc-c12-2",
              "front": "Để phân biệt khí SO₂ và CO₂, người ta dùng dung dịch nào?",
              "back": "Dung dịch nước Bromine (Br₂) hoặc dung dịch KMnO₄ (SO₂ làm mất màu, CO₂ thì không)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c12-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khi làm vỡ nhiệt kế thủy ngân, người ta thường dùng hóa chất nào sau đây rắc lên để thu gom thủy ngân an toàn?",
              "options": [
                "Bột lưu huỳnh (Sulfur)",
                "Muối ăn (NaCl)",
                "Vôi sống (CaO)",
                "Cát sạch"
              ],
              "correct": 0,
              "solution": "Hg + S -> HgS (kết tủa không độc, phản ứng ngay ở nhiệt độ thường).",
              "trapAlert": "Chọn cát sạch (cát chỉ để dọn sau khi đã hóa hợp HgS).",
              "fastTip": "Thủy ngân vỡ -> Rắc bột Sulfur (lưu huỳnh)."
            },
            {
              "id": "q-c12-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nhỏ vài giọt dung dịch sulfuric acid đặc ($H_2SO_4$ đặc) vào cốc chứa đường kính trắng ($C_{12}H_{22}O_{11}$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c12-a",
                  "statement": "a) Đường kính chuyển dần từ màu trắng sang màu đen do bị than hóa.",
                  "isTrue": true,
                  "explain": "H₂SO₄ đặc háo nước hút H₂O biến đường thành than carbon (C). Đúng."
                },
                {
                  "id": "tf-c12-b",
                  "statement": "b) Cột than carbon dâng cao và có sủi nhiều bọt khí mùi hắc.",
                  "isTrue": true,
                  "explain": "Carbon tiếp tục tác dụng với H₂SO₄ đặc sinh khí CO₂ và SO₂ đẩy than xốp trào lên. Đúng."
                },
                {
                  "id": "tf-c12-c",
                  "statement": "c) Khí thoát ra làm mất màu cánh hoa hồng hoặc quỳ tím ẩm.",
                  "isTrue": true,
                  "explain": "SO₂ có tính tẩy màu làm mất màu cánh hoa và quỳ tím ẩm. Đúng."
                },
                {
                  "id": "tf-c12-d",
                  "statement": "d) Thí nghiệm trên chứng minh H₂SO₄ loãng cũng có tính háo nước tương tự.",
                  "isTrue": false,
                  "explain": "Chỉ có H₂SO₄ ĐẶC mới có tính háo nước mạnh như vậy. Sai."
                }
              ]
            },
            {
              "id": "q-c12-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho m gam bột Cu tan hoàn toàn trong dung dịch $H_2SO_4$ đặc, nóng dư. Khí $SO_2$ sinh ra ở đkc ($24{,}79\\text{ lít/mol}$) có thể tích là 2,479 lít. Tính giá trị của m (đơn vị: gam)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "n_SO₂ = 2,479 / 24,79 = 0,1 mol. Bảo toàn e: 2 * n_Cu = 2 * n_SO₂ -> n_Cu = 0,1 mol. m = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Nhầm đồng hóa trị 1."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c12-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khi làm vỡ nhiệt kế thủy ngân, người ta thường dùng hóa chất nào sau đây rắc lên để thu gom thủy ngân an toàn?",
              "options": [
                "Bột lưu huỳnh (Sulfur)",
                "Muối ăn (NaCl)",
                "Vôi sống (CaO)",
                "Cát sạch"
              ],
              "correct": 0,
              "solution": "Hg + S -> HgS (kết tủa không độc, phản ứng ngay ở nhiệt độ thường).",
              "trapAlert": "Chọn cát sạch (cát chỉ để dọn sau khi đã hóa hợp HgS).",
              "fastTip": "Thủy ngân vỡ -> Rắc bột Sulfur (lưu huỳnh)."
            },
            {
              "id": "q-c12-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nhỏ vài giọt dung dịch sulfuric acid đặc ($H_2SO_4$ đặc) vào cốc chứa đường kính trắng ($C_{12}H_{22}O_{11}$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c12-a",
                  "statement": "a) Đường kính chuyển dần từ màu trắng sang màu đen do bị than hóa.",
                  "isTrue": true,
                  "explain": "H₂SO₄ đặc háo nước hút H₂O biến đường thành than carbon (C). Đúng."
                },
                {
                  "id": "tf-c12-b",
                  "statement": "b) Cột than carbon dâng cao và có sủi nhiều bọt khí mùi hắc.",
                  "isTrue": true,
                  "explain": "Carbon tiếp tục tác dụng với H₂SO₄ đặc sinh khí CO₂ và SO₂ đẩy than xốp trào lên. Đúng."
                },
                {
                  "id": "tf-c12-c",
                  "statement": "c) Khí thoát ra làm mất màu cánh hoa hồng hoặc quỳ tím ẩm.",
                  "isTrue": true,
                  "explain": "SO₂ có tính tẩy màu làm mất màu cánh hoa và quỳ tím ẩm. Đúng."
                },
                {
                  "id": "tf-c12-d",
                  "statement": "d) Thí nghiệm trên chứng minh H₂SO₄ loãng cũng có tính háo nước tương tự.",
                  "isTrue": false,
                  "explain": "Chỉ có H₂SO₄ ĐẶC mới có tính háo nước mạnh như vậy. Sai."
                }
              ]
            },
            {
              "id": "q-c12-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho m gam bột Cu tan hoàn toàn trong dung dịch $H_2SO_4$ đặc, nóng dư. Khí $SO_2$ sinh ra ở đkc ($24{,}79\\text{ lít/mol}$) có thể tích là 2,479 lít. Tính giá trị của m (đơn vị: gam)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "n_SO₂ = 2,479 / 24,79 = 0,1 mol. Bảo toàn e: 2 * n_Cu = 2 * n_SO₂ -> n_Cu = 0,1 mol. m = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Nhầm đồng hóa trị 1."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c12-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khi làm vỡ nhiệt kế thủy ngân, người ta thường dùng hóa chất nào sau đây rắc lên để thu gom thủy ngân an toàn?",
              "options": [
                "Bột lưu huỳnh (Sulfur)",
                "Muối ăn (NaCl)",
                "Vôi sống (CaO)",
                "Cát sạch"
              ],
              "correct": 0,
              "solution": "Hg + S -> HgS (kết tủa không độc, phản ứng ngay ở nhiệt độ thường).",
              "trapAlert": "Chọn cát sạch (cát chỉ để dọn sau khi đã hóa hợp HgS).",
              "fastTip": "Thủy ngân vỡ -> Rắc bột Sulfur (lưu huỳnh)."
            },
            {
              "id": "q-c12-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Nhỏ vài giọt dung dịch sulfuric acid đặc ($H_2SO_4$ đặc) vào cốc chứa đường kính trắng ($C_{12}H_{22}O_{11}$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c12-a",
                  "statement": "a) Đường kính chuyển dần từ màu trắng sang màu đen do bị than hóa.",
                  "isTrue": true,
                  "explain": "H₂SO₄ đặc háo nước hút H₂O biến đường thành than carbon (C). Đúng."
                },
                {
                  "id": "tf-c12-b",
                  "statement": "b) Cột than carbon dâng cao và có sủi nhiều bọt khí mùi hắc.",
                  "isTrue": true,
                  "explain": "Carbon tiếp tục tác dụng với H₂SO₄ đặc sinh khí CO₂ và SO₂ đẩy than xốp trào lên. Đúng."
                },
                {
                  "id": "tf-c12-c",
                  "statement": "c) Khí thoát ra làm mất màu cánh hoa hồng hoặc quỳ tím ẩm.",
                  "isTrue": true,
                  "explain": "SO₂ có tính tẩy màu làm mất màu cánh hoa và quỳ tím ẩm. Đúng."
                },
                {
                  "id": "tf-c12-d",
                  "statement": "d) Thí nghiệm trên chứng minh H₂SO₄ loãng cũng có tính háo nước tương tự.",
                  "isTrue": false,
                  "explain": "Chỉ có H₂SO₄ ĐẶC mới có tính háo nước mạnh như vậy. Sai."
                }
              ]
            },
            {
              "id": "q-c12-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho m gam bột Cu tan hoàn toàn trong dung dịch $H_2SO_4$ đặc, nóng dư. Khí $SO_2$ sinh ra ở đkc ($24{,}79\\text{ lít/mol}$) có thể tích là 2,479 lít. Tính giá trị của m (đơn vị: gam)?",
              "correctAnswer": "6.4",
              "unit": "gam",
              "solution": "n_SO₂ = 2,479 / 24,79 = 0,1 mol. Bảo toàn e: 2 * n_Cu = 2 * n_SO₂ -> n_Cu = 0,1 mol. m = 0,1 * 64 = 6,4 gam.",
              "trapAlert": "Nhầm đồng hóa trị 1."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        }
      ]
    },
    {
      "chapterId": "c11-organic-gen",
      "chapterName": "Đại cương hóa học hữu cơ",
      "grade": 11,
      "lessons": [
        {
          "id": "hoa-dai-cuong-huu-co-dong-phan",
          "title": "Hợp chất hữu cơ, Công thức & Đồng phân cấu tạo",
          "desc": "Đặc điểm liên kết trong hợp chất hữu cơ, phân tích nguyên tố, xác định CTPT và các loại đồng phân.",
          "duration": "25 phút",
          "tag": "Cơ bản",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Thuyết cấu tạo hóa học Butlerov",
              "desc": "Trong phân tử hợp chất hữu cơ, các nguyên tử liên kết với nhau theo đúng hóa trị và theo một trật tự nhất định gọi là cấu tạo hóa học. Carbon luôn có hóa trị IV, có khả năng liên kết với nhau tạo thành mạch carbon (mạch hở không phân nhánh, mạch nhánh, mạch vòng)."
            },
            {
              "title": "Đồng đẳng và Đồng phân",
              "desc": "Đồng đẳng: những hợp chất có cấu tạo tương tự nhau nhưng hơn kém nhau một hay nhiều nhóm methylene ($-CH_2-$). Đồng phân: những chất có cùng công thức phân tử nhưng cấu tạo khác nhau $\\implies$ tính chất khác nhau (đồng phân mạch C, vị trí liên kết bội/nhóm chức, đồng phân nhóm chức)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính độ bất bão hòa k",
              "instruction": "$k = (2C + 2 - H)/2$. Nếu $k = 0$: no mạch hở; $k = 1$: 1 nối đôi hoặc 1 vòng."
            },
            {
              "step": 2,
              "title": "Viết các đồng phân theo thứ tự",
              "instruction": "Giữ nguyên mạch carbon dài nhất -> bẻ nhánh -> dịch chuyển vị trí liên kết đôi/ba hoặc nhóm chức."
            }
          ],
          "formulas": [
            {
              "label": "Độ bất bão hòa k của hợp chất CxHyOzNt",
              "formula": "k = \\frac{2x + 2 + t - y}{2}",
              "displayLatex": "k = \\frac{2C + 2 + N - H}{2}",
              "notes": "k = số liên kết pi + số vòng. k = 0: no mạch hở."
            },
            {
              "label": "Thiết lập công thức đơn giản nhất",
              "formula": "x : y : z = \\frac{\\%C}{12} : \\frac{\\%H}{1} : \\frac{\\%O}{16}",
              "displayLatex": "x : y : z = \\frac{m_C}{12} : \\frac{m_H}{1} : \\frac{m_O}{16}",
              "notes": "Quy về tỉ lệ số nguyên tối giản."
            }
          ],
          "traps": [
            {
              "trap": "Quên đồng phân mạch vòng khi k >= 1",
              "avoid": "Với $C_n H_{2n}$, ngoài alkene mạch hở còn có cycloalkane mạch vòng."
            },
            {
              "trap": "Viết trùng lặp các đồng phân đối xứng",
              "avoid": "Cần vẽ trục đối xứng của mạch carbon để tránh đếm trùng vị trí."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c13-1",
              "front": "Hợp chất no mạch hở C4H10 có bao nhiêu đồng phân cấu tạo?",
              "back": "Có 2 đồng phân: butane (mạch thẳng) và isobutane (2-methylpropane)."
            },
            {
              "id": "fc-c13-2",
              "front": "Độ bất bão hòa k = 1 cho biết phân tử chứa những cấu trúc nào?",
              "back": "Chứa 1 liên kết đôi (1 liên kết pi) hoặc 1 vòng no."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c13-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Số đồng phân cấu tạo mạch hở ứng với công thức phân tử $C_4H_8$ là:",
              "options": [
                "3",
                "4",
                "2",
                "5"
              ],
              "correct": 0,
              "solution": "Mạch hở C₄H₈ có k = 1 (chứa 1 liên kết đôi C=C): but-1-ene, but-2-ene và 2-methylpropene. Tổng cộng có 3 đồng phân cấu tạo.",
              "trapAlert": "Tính cả đồng phân hình học cis-trans (đề chỉ hỏi đồng phân cấu tạo) hoặc đếm cả vòng xiclobutan.",
              "fastTip": "C₄H₈ mạch hở có đúng 3 đồng phân cấu tạo."
            },
            {
              "id": "q-c13-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Phân tích định lượng một hợp chất hữu cơ X chứa C, H, O thấy $\\%C = 40\\%, \\%H = 6{,}67\\%$, còn lại là Oxygen. Phổ khối lượng cho thấy phân tử khối của X là 60 amu. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c13-a",
                  "statement": "a) Phần trăm khối lượng của Oxygen trong X là 53,33%.",
                  "isTrue": true,
                  "explain": "100% - 40% - 6,67% = 53,33%. Đúng."
                },
                {
                  "id": "tf-c13-b",
                  "statement": "b) Công thức thực nghiệm (đơn giản nhất) của X là CH₂O.",
                  "isTrue": true,
                  "explain": "40/12 : 6,67/1 : 53,33/16 = 3,33 : 6,67 : 3,33 = 1 : 2 : 1. Đúng."
                },
                {
                  "id": "tf-c13-c",
                  "statement": "c) Công thức phân tử của X là C₂H₄O₂.",
                  "isTrue": true,
                  "explain": "(CH₂O)n = 60 -> 30n = 60 -> n = 2 -> C₂H₄O₂. Đúng."
                },
                {
                  "id": "tf-c13-d",
                  "statement": "d) Hợp chất X có độ bất bão hòa k = 0.",
                  "isTrue": false,
                  "explain": "k = (2*2 + 2 - 4) / 2 = 1. Sai."
                }
              ]
            },
            {
              "id": "q-c13-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hợp chất hữu cơ no, đơn chức, mạch hở Y có công thức phân tử $C_3H_8O$. Hỏi Y có tất cả bao nhiêu đồng phân cấu tạo (gồm cả alcohol và ether)?",
              "correctAnswer": "3",
              "unit": "đồng phân",
              "solution": "C₃H₈O có k = 0: Alcohol (2 đồng phân: propan-1-ol, propan-2-ol) + Ether (1 đồng phân: ethyl methyl ether CH₃-O-C₂H₅). Tổng cộng có 3 đồng phân cấu tạo.",
              "trapAlert": "Quên đồng phân ether."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c13-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Số đồng phân cấu tạo mạch hở ứng với công thức phân tử $C_4H_8$ là:",
              "options": [
                "3",
                "4",
                "2",
                "5"
              ],
              "correct": 0,
              "solution": "Mạch hở C₄H₈ có k = 1 (chứa 1 liên kết đôi C=C): but-1-ene, but-2-ene và 2-methylpropene. Tổng cộng có 3 đồng phân cấu tạo.",
              "trapAlert": "Tính cả đồng phân hình học cis-trans (đề chỉ hỏi đồng phân cấu tạo) hoặc đếm cả vòng xiclobutan.",
              "fastTip": "C₄H₈ mạch hở có đúng 3 đồng phân cấu tạo."
            },
            {
              "id": "q-c13-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Phân tích định lượng một hợp chất hữu cơ X chứa C, H, O thấy $\\%C = 40\\%, \\%H = 6{,}67\\%$, còn lại là Oxygen. Phổ khối lượng cho thấy phân tử khối của X là 60 amu. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c13-a",
                  "statement": "a) Phần trăm khối lượng của Oxygen trong X là 53,33%.",
                  "isTrue": true,
                  "explain": "100% - 40% - 6,67% = 53,33%. Đúng."
                },
                {
                  "id": "tf-c13-b",
                  "statement": "b) Công thức thực nghiệm (đơn giản nhất) của X là CH₂O.",
                  "isTrue": true,
                  "explain": "40/12 : 6,67/1 : 53,33/16 = 3,33 : 6,67 : 3,33 = 1 : 2 : 1. Đúng."
                },
                {
                  "id": "tf-c13-c",
                  "statement": "c) Công thức phân tử của X là C₂H₄O₂.",
                  "isTrue": true,
                  "explain": "(CH₂O)n = 60 -> 30n = 60 -> n = 2 -> C₂H₄O₂. Đúng."
                },
                {
                  "id": "tf-c13-d",
                  "statement": "d) Hợp chất X có độ bất bão hòa k = 0.",
                  "isTrue": false,
                  "explain": "k = (2*2 + 2 - 4) / 2 = 1. Sai."
                }
              ]
            },
            {
              "id": "q-c13-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hợp chất hữu cơ no, đơn chức, mạch hở Y có công thức phân tử $C_3H_8O$. Hỏi Y có tất cả bao nhiêu đồng phân cấu tạo (gồm cả alcohol và ether)?",
              "correctAnswer": "3",
              "unit": "đồng phân",
              "solution": "C₃H₈O có k = 0: Alcohol (2 đồng phân: propan-1-ol, propan-2-ol) + Ether (1 đồng phân: ethyl methyl ether CH₃-O-C₂H₅). Tổng cộng có 3 đồng phân cấu tạo.",
              "trapAlert": "Quên đồng phân ether."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c13-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Số đồng phân cấu tạo mạch hở ứng với công thức phân tử $C_4H_8$ là:",
              "options": [
                "3",
                "4",
                "2",
                "5"
              ],
              "correct": 0,
              "solution": "Mạch hở C₄H₈ có k = 1 (chứa 1 liên kết đôi C=C): but-1-ene, but-2-ene và 2-methylpropene. Tổng cộng có 3 đồng phân cấu tạo.",
              "trapAlert": "Tính cả đồng phân hình học cis-trans (đề chỉ hỏi đồng phân cấu tạo) hoặc đếm cả vòng xiclobutan.",
              "fastTip": "C₄H₈ mạch hở có đúng 3 đồng phân cấu tạo."
            },
            {
              "id": "q-c13-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Phân tích định lượng một hợp chất hữu cơ X chứa C, H, O thấy $\\%C = 40\\%, \\%H = 6{,}67\\%$, còn lại là Oxygen. Phổ khối lượng cho thấy phân tử khối của X là 60 amu. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c13-a",
                  "statement": "a) Phần trăm khối lượng của Oxygen trong X là 53,33%.",
                  "isTrue": true,
                  "explain": "100% - 40% - 6,67% = 53,33%. Đúng."
                },
                {
                  "id": "tf-c13-b",
                  "statement": "b) Công thức thực nghiệm (đơn giản nhất) của X là CH₂O.",
                  "isTrue": true,
                  "explain": "40/12 : 6,67/1 : 53,33/16 = 3,33 : 6,67 : 3,33 = 1 : 2 : 1. Đúng."
                },
                {
                  "id": "tf-c13-c",
                  "statement": "c) Công thức phân tử của X là C₂H₄O₂.",
                  "isTrue": true,
                  "explain": "(CH₂O)n = 60 -> 30n = 60 -> n = 2 -> C₂H₄O₂. Đúng."
                },
                {
                  "id": "tf-c13-d",
                  "statement": "d) Hợp chất X có độ bất bão hòa k = 0.",
                  "isTrue": false,
                  "explain": "k = (2*2 + 2 - 4) / 2 = 1. Sai."
                }
              ]
            },
            {
              "id": "q-c13-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hợp chất hữu cơ no, đơn chức, mạch hở Y có công thức phân tử $C_3H_8O$. Hỏi Y có tất cả bao nhiêu đồng phân cấu tạo (gồm cả alcohol và ether)?",
              "correctAnswer": "3",
              "unit": "đồng phân",
              "solution": "C₃H₈O có k = 0: Alcohol (2 đồng phân: propan-1-ol, propan-2-ol) + Ether (1 đồng phân: ethyl methyl ether CH₃-O-C₂H₅). Tổng cộng có 3 đồng phân cấu tạo.",
              "trapAlert": "Quên đồng phân ether."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        },
        {
          "id": "hoa-pho-ir-ms-danh-phap",
          "title": "Phương pháp phổ (IR, MS) & Danh pháp IUPAC",
          "desc": "Ứng dụng phổ hồng ngoại (IR) nhận diện nhóm chức, phổ khối lượng (MS) xác định phân tử khối, và nguyên tắc gọi tên IUPAC.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Phổ khối lượng MS (Mass Spectrometry)",
              "desc": "Dùng để xác định phân tử khối chính xác của hợp chất hữu cơ. Giá trị $m/z$ của peak ion phân tử $[M^+]$ (thường là peak có giá trị $m/z$ lớn nhất) chính là phân tử khối M."
            },
            {
              "title": "Phổ hồng ngoại IR (Infrared Spectroscopy)",
              "desc": "Dùng để dự đoán sự có mặt của các nhóm chức thông qua số sóng hấp thụ đặc trưng: Nhóm $-OH$ (alcohol/phenol: $3200 - 3650\\text{ cm}^{-1}$ tù rộng; carboxylic acid: $2500 - 3300\\text{ cm}^{-1}$ rất rộng); Nhóm $C=O$ (carbonyl: $1650 - 1750\\text{ cm}^{-1}$ mũi nhọn sâu đặc trưng)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tìm peak ion phân tử trên phổ MS",
              "instruction": "Đọc giá trị $m/z$ của tín hiệu tận cùng bên phải để có phân tử khối."
            },
            {
              "step": 2,
              "title": "Phân tích các mũi tín hiệu trên phổ IR",
              "instruction": "Có mũi nhọn ở $\\sim 1715\\text{ cm}^{-1} \\implies$ có nhóm $C=O$. Có mũi tù ở $\\sim 3350\\text{ cm}^{-1} \\implies$ có nhóm $-OH$."
            }
          ],
          "formulas": [
            {
              "label": "Xác định phân tử khối từ phổ MS",
              "formula": "M = (m/z)_{[M^+]}",
              "displayLatex": "M = (m/z)_{[M^+]}",
              "notes": "m/z của peak ion phân tử."
            },
            {
              "label": "Vùng số sóng hấp thụ IR đặc trưng",
              "formula": "O-H: 3200 - 3650\\text{ cm}^{-1}, \\quad C=O: 1650 - 1750\\text{ cm}^{-1}",
              "displayLatex": "C=O \\approx 1700\\text{ cm}^{-1}, \\quad O-H \\approx 3300\\text{ cm}^{-1}",
              "notes": "Mũi C=O nhọn sâu rất dễ nhận diện."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm peak cơ bản (cường độ 100%) với peak ion phân tử",
              "avoid": "Peak ion phân tử là peak có $m/z$ lớn nhất, không nhất thiết là peak cao nhất."
            },
            {
              "trap": "Nhầm mũi O-H của alcohol với O-H của carboxylic acid",
              "avoid": "Mũi O-H của alcohol tù hẹp hơn ở $3200-3600$, còn acid kéo dài rất rộng từ $2500-3300$ trùm lên cả liên kết C-H."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c14-1",
              "front": "Tín hiệu hấp thụ mạnh và nhọn ở khoảng 1715 cm⁻¹ trên phổ IR chứng tỏ sự có mặt của nhóm chức nào?",
              "back": "Nhóm carbonyl (C=O)."
            },
            {
              "id": "fc-c14-2",
              "front": "Trên phổ MS, giá trị m/z của peak ion phân tử [M⁺] cho biết thông tin gì?",
              "back": "Cho biết khối lượng phân tử (phân tử khối M) của chất."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c14-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phổ hồng ngoại (IR) của một hợp chất hữu cơ xuất hiện một dải hấp thụ rộng ở vùng $3350\\text{ cm}^{-1}$ và không có tín hiệu ở vùng $1700\\text{ cm}^{-1}$. Hợp chất này có thể thuộc loại chất nào sau đây?",
              "options": [
                "Alcohol",
                "Aldehyde",
                "Carboxylic acid",
                "Ester"
              ],
              "correct": 0,
              "solution": "Dải hấp thụ rộng ở 3350 cm⁻¹ đặc trưng cho nhóm -OH liên kết hydrogen, không có nhóm C=O (1700 cm⁻¹) nên hợp chất là Alcohol.",
              "trapAlert": "Nhầm với Carboxylic acid (acid bắt buộc phải có cả mũi C=O ở 1700 cm⁻¹).",
              "fastTip": "Có -OH, không có C=O -> Alcohol."
            },
            {
              "id": "q-c14-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một chất hữu cơ thơm X có công thức phân tử $C_7H_8O$. Trên phổ IR xuất hiện dải hấp thụ rộng ở $3300\\text{ cm}^{-1}$. Chất X tác dụng được với dung dịch NaOH. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c14-a",
                  "statement": "a) Chất X có chứa nhóm chức alcohol hoặc phenol.",
                  "isTrue": true,
                  "explain": "Có tín hiệu -OH ở 3300 cm⁻¹. Đúng."
                },
                {
                  "id": "tf-c14-b",
                  "statement": "b) Vì X phản ứng được với dung dịch NaOH nên X là một phenol.",
                  "isTrue": true,
                  "explain": "Alcohol thơm không phản ứng NaOH, chỉ có phenol mới tác dụng NaOH. Đúng."
                },
                {
                  "id": "tf-c14-c",
                  "statement": "c) Tên gọi của X có thể là Benzyl alcohol.",
                  "isTrue": false,
                  "explain": "Benzyl alcohol là alcohol không tác dụng NaOH. Sai."
                },
                {
                  "id": "tf-c14-d",
                  "statement": "d) X có 3 đồng phân cấu tạo thỏa mãn tính chất trên (ortho, meta, para-cresol).",
                  "isTrue": true,
                  "explain": "CH₃-C₆H₄-OH có 3 đồng phân vị trí o-, m-, p-. Đúng."
                }
              ]
            },
            {
              "id": "q-c14-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trên phổ khối lượng (MS) của acetone ($CH_3COCH_3$), peak ion phân tử $[M^+]$ xuất hiện ở giá trị $m/z$ bằng bao nhiêu?",
              "correctAnswer": "58",
              "unit": "",
              "solution": "M của CH₃COCH₃ = 12*3 + 6 + 16 = 58 amu -> m/z = 58.",
              "trapAlert": "Tính nhầm khối lượng phân tử."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c14-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phổ hồng ngoại (IR) của một hợp chất hữu cơ xuất hiện một dải hấp thụ rộng ở vùng $3350\\text{ cm}^{-1}$ và không có tín hiệu ở vùng $1700\\text{ cm}^{-1}$. Hợp chất này có thể thuộc loại chất nào sau đây?",
              "options": [
                "Alcohol",
                "Aldehyde",
                "Carboxylic acid",
                "Ester"
              ],
              "correct": 0,
              "solution": "Dải hấp thụ rộng ở 3350 cm⁻¹ đặc trưng cho nhóm -OH liên kết hydrogen, không có nhóm C=O (1700 cm⁻¹) nên hợp chất là Alcohol.",
              "trapAlert": "Nhầm với Carboxylic acid (acid bắt buộc phải có cả mũi C=O ở 1700 cm⁻¹).",
              "fastTip": "Có -OH, không có C=O -> Alcohol."
            },
            {
              "id": "q-c14-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một chất hữu cơ thơm X có công thức phân tử $C_7H_8O$. Trên phổ IR xuất hiện dải hấp thụ rộng ở $3300\\text{ cm}^{-1}$. Chất X tác dụng được với dung dịch NaOH. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c14-a",
                  "statement": "a) Chất X có chứa nhóm chức alcohol hoặc phenol.",
                  "isTrue": true,
                  "explain": "Có tín hiệu -OH ở 3300 cm⁻¹. Đúng."
                },
                {
                  "id": "tf-c14-b",
                  "statement": "b) Vì X phản ứng được với dung dịch NaOH nên X là một phenol.",
                  "isTrue": true,
                  "explain": "Alcohol thơm không phản ứng NaOH, chỉ có phenol mới tác dụng NaOH. Đúng."
                },
                {
                  "id": "tf-c14-c",
                  "statement": "c) Tên gọi của X có thể là Benzyl alcohol.",
                  "isTrue": false,
                  "explain": "Benzyl alcohol là alcohol không tác dụng NaOH. Sai."
                },
                {
                  "id": "tf-c14-d",
                  "statement": "d) X có 3 đồng phân cấu tạo thỏa mãn tính chất trên (ortho, meta, para-cresol).",
                  "isTrue": true,
                  "explain": "CH₃-C₆H₄-OH có 3 đồng phân vị trí o-, m-, p-. Đúng."
                }
              ]
            },
            {
              "id": "q-c14-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trên phổ khối lượng (MS) của acetone ($CH_3COCH_3$), peak ion phân tử $[M^+]$ xuất hiện ở giá trị $m/z$ bằng bao nhiêu?",
              "correctAnswer": "58",
              "unit": "",
              "solution": "M của CH₃COCH₃ = 12*3 + 6 + 16 = 58 amu -> m/z = 58.",
              "trapAlert": "Tính nhầm khối lượng phân tử."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c14-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phổ hồng ngoại (IR) của một hợp chất hữu cơ xuất hiện một dải hấp thụ rộng ở vùng $3350\\text{ cm}^{-1}$ và không có tín hiệu ở vùng $1700\\text{ cm}^{-1}$. Hợp chất này có thể thuộc loại chất nào sau đây?",
              "options": [
                "Alcohol",
                "Aldehyde",
                "Carboxylic acid",
                "Ester"
              ],
              "correct": 0,
              "solution": "Dải hấp thụ rộng ở 3350 cm⁻¹ đặc trưng cho nhóm -OH liên kết hydrogen, không có nhóm C=O (1700 cm⁻¹) nên hợp chất là Alcohol.",
              "trapAlert": "Nhầm với Carboxylic acid (acid bắt buộc phải có cả mũi C=O ở 1700 cm⁻¹).",
              "fastTip": "Có -OH, không có C=O -> Alcohol."
            },
            {
              "id": "q-c14-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một chất hữu cơ thơm X có công thức phân tử $C_7H_8O$. Trên phổ IR xuất hiện dải hấp thụ rộng ở $3300\\text{ cm}^{-1}$. Chất X tác dụng được với dung dịch NaOH. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c14-a",
                  "statement": "a) Chất X có chứa nhóm chức alcohol hoặc phenol.",
                  "isTrue": true,
                  "explain": "Có tín hiệu -OH ở 3300 cm⁻¹. Đúng."
                },
                {
                  "id": "tf-c14-b",
                  "statement": "b) Vì X phản ứng được với dung dịch NaOH nên X là một phenol.",
                  "isTrue": true,
                  "explain": "Alcohol thơm không phản ứng NaOH, chỉ có phenol mới tác dụng NaOH. Đúng."
                },
                {
                  "id": "tf-c14-c",
                  "statement": "c) Tên gọi của X có thể là Benzyl alcohol.",
                  "isTrue": false,
                  "explain": "Benzyl alcohol là alcohol không tác dụng NaOH. Sai."
                },
                {
                  "id": "tf-c14-d",
                  "statement": "d) X có 3 đồng phân cấu tạo thỏa mãn tính chất trên (ortho, meta, para-cresol).",
                  "isTrue": true,
                  "explain": "CH₃-C₆H₄-OH có 3 đồng phân vị trí o-, m-, p-. Đúng."
                }
              ]
            },
            {
              "id": "q-c14-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Trên phổ khối lượng (MS) của acetone ($CH_3COCH_3$), peak ion phân tử $[M^+]$ xuất hiện ở giá trị $m/z$ bằng bao nhiêu?",
              "correctAnswer": "58",
              "unit": "",
              "solution": "M của CH₃COCH₃ = 12*3 + 6 + 16 = 58 amu -> m/z = 58.",
              "trapAlert": "Tính nhầm khối lượng phân tử."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        }
      ]
    },
    {
      "chapterId": "c11-hydrocarbon",
      "chapterName": "Hydrocarbon",
      "grade": 11,
      "lessons": [
        {
          "id": "hoa-alkane-alkene-alkyne",
          "title": "Hydrocarbon mạch hở: Alkane, Alkene & Alkyne",
          "desc": "Tính chất đặc trưng của hydrocarbon no (phản ứng thế halogen) và không no (phản ứng cộng, trùng hợp, quy tắc Markovnikov).",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Alkane (Paraffin)",
              "desc": "Hydrocarbon no mạch hở ($C_n H_{2n+2}, n \\ge 1$). Phản ứng đặc trưng là phản ứng thế halogen ($Cl_2, Br_2$) theo cơ chế gốc tự do (SR), ưu tiên thế vào nguyên tử carbon bậc cao hơn (quy tắc thế). Phản ứng cracking và reforming."
            },
            {
              "title": "Alkene & Alkyne (Không no)",
              "desc": "Alkene ($C_n H_{2n}, n \\ge 2$) chứa liên kết đôi $C=C$. Alkyne ($C_n H_{2n-2}, n \\ge 2$) chứa liên kết ba $C \\equiv C$. Phản ứng đặc trưng là phản ứng cộng ($H_2, Br_2, HX, H_2O$) theo quy tắc Markovnikov (H cộng vào C bậc thấp chứa nhiều H hơn, phần mang điện âm cộng vào C bậc cao hơn). Alk-1-yne tác dụng với $AgNO_3/NH_3$ tạo kết tủa vàng."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhận diện sản phẩm chính phản ứng thế (Alkane)",
              "instruction": "Halogen ưu tiên thế vào H ở C bậc cao nhất (bậc 3 > bậc 2 > bậc 1)."
            },
            {
              "step": 2,
              "title": "Nhận diện sản phẩm chính phản ứng cộng (Alkene/Alkyne)",
              "instruction": "Áp dụng quy tắc Markovnikov: H vào C mang nhiều H hơn, X vào C ít H hơn."
            }
          ],
          "formulas": [
            {
              "label": "Quy tắc cộng Markovnikov",
              "formula": "R-CH=CH_2 + H-X \\longrightarrow R-CH(X)-CH_3 \\quad (\\text{sản phẩm chính})",
              "displayLatex": "R-CH=CH_2 + HX \\longrightarrow R-CHX-CH_3",
              "notes": "Giàu càng giàu thêm: H gắn vào C có nhiều H hơn."
            },
            {
              "label": "Phản ứng thế ion kim loại của Alk-1-yne",
              "formula": "R-C\\equiv C-H + AgNO_3 + NH_3 \\longrightarrow R-C\\equiv C-Ag \\downarrow + NH_4NO_3",
              "displayLatex": "R-C\\equiv CH + Ag^+ \\longrightarrow R-C\\equiv CAg \\downarrow",
              "notes": "Tạo kết tủa vàng nhạt, dùng phân biệt alk-1-yne."
            }
          ],
          "traps": [
            {
              "trap": "Quên rằng chỉ có Alk-1-yne mới tác dụng AgNO3/NH3",
              "avoid": "But-2-yne ($CH_3-C\\equiv C-CH_3$) không có nguyên tử H linh động ở đầu mạch nên KHÔNG phản ứng."
            },
            {
              "trap": "Áp dụng ngược quy tắc Markovnikov",
              "avoid": "Luôn nhớ khẩu quyết: \"H vào nơi nhiều H, halogen vào nơi ít H\"."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c15-1",
              "front": "Quy tắc Markovnikov áp dụng cho loại phản ứng nào?",
              "back": "Phản ứng cộng bất đối xứng của alkene hoặc alkyne với tác nhân bất đối xứng HX."
            },
            {
              "id": "fc-c15-2",
              "front": "Chất nào sau đây tác dụng với dung dịch AgNO₃/NH₃ tạo kết tủa vàng: but-1-yne hay but-2-yne?",
              "back": "But-1-yne (vì có liên kết ba đầu mạch CH≡C-)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c15-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Sản phẩm chính thu được khi cho propene ($CH_2=CH-CH_3$) tác dụng với hydrogen chloride ($HCl$) là:",
              "options": [
                "2-chloropropane",
                "1-chloropropane",
                "1,2-dichloropropane",
                "propane"
              ],
              "correct": 0,
              "solution": "Theo quy tắc Markovnikov: H cộng vào CH₂ (nhiều H hơn), Cl cộng vào CH (ít H hơn) -> tạo sản phẩm chính là CH₃-CH(Cl)-CH₃ (2-chloropropane).",
              "trapAlert": "Chọn 1-chloropropane (sản phẩm phụ).",
              "fastTip": "Cl vào C ở giữa (bậc cao hơn) -> 2-chloropropane."
            },
            {
              "id": "q-c15-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các hydrocarbon sau: ethane, ethylene, acetylene, but-2-yne. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c15-a",
                  "statement": "a) Cả ethylene và acetylene đều làm mất màu dung dịch nước bromine.",
                  "isTrue": true,
                  "explain": "Cả 2 đều có liên kết bội C=C và C≡C nên tham gia phản ứng cộng làm mất màu nước bromine. Đúng."
                },
                {
                  "id": "tf-c15-b",
                  "statement": "b) Trong các chất trên, chỉ có acetylene tạo kết tủa vàng với AgNO₃/NH₃.",
                  "isTrue": true,
                  "explain": "Ethylene không phải alkyne, but-2-yne không có liên kết ba đầu mạch nên chỉ có acetylene phản ứng. Đúng."
                },
                {
                  "id": "tf-c15-c",
                  "statement": "c) Ethane tham gia phản ứng thế với khí chlorine khi có ánh sáng khuếch tán.",
                  "isTrue": true,
                  "explain": "Alkane tham gia phản ứng thế halogen khi chiếu sáng. Đúng."
                },
                {
                  "id": "tf-c15-d",
                  "statement": "d) Khi đốt cháy hoàn toàn ethylene luôn thu được số mol H₂O lớn hơn số mol CO₂.",
                  "isTrue": false,
                  "explain": "Ethylene là C₂H₄ (alkene) nên khi đốt cháy số mol H₂O BẰNG số mol CO₂. Sai."
                }
              ]
            },
            {
              "id": "q-c15-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho $2{,}479\\text{ lít}$ khí acetylene ($C_2H_2$) ở đkc ($25^\\circ\\text{C}, 1\\text{ bar}$) tác dụng hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$. Khối lượng kết tủa vàng nhạt $Ag_2C_2$ thu được là bao nhiêu gam (lấy $M_{Ag_2C_2} = 240\\text{ g/mol}$)?",
              "correctAnswer": "24",
              "unit": "gam",
              "solution": "n_C₂H₂ = 2,479 / 24,79 = 0,1 mol. C₂H₂ + 2AgNO₃ + 2NH₃ -> Ag-C≡C-Ag↓ + 2NH₄NO₃. n_kết tủa = 0,1 mol. Khối lượng m = 0,1 * 240 = 24 gam.",
              "trapAlert": "Nhầm kết tủa chỉ chứa 1 nguyên tử Ag (Ag-C≡CH). Acetylene có 2 nguyên tử H linh động nên tạo AgC≡CAg."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c15-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Sản phẩm chính thu được khi cho propene ($CH_2=CH-CH_3$) tác dụng với hydrogen chloride ($HCl$) là:",
              "options": [
                "2-chloropropane",
                "1-chloropropane",
                "1,2-dichloropropane",
                "propane"
              ],
              "correct": 0,
              "solution": "Theo quy tắc Markovnikov: H cộng vào CH₂ (nhiều H hơn), Cl cộng vào CH (ít H hơn) -> tạo sản phẩm chính là CH₃-CH(Cl)-CH₃ (2-chloropropane).",
              "trapAlert": "Chọn 1-chloropropane (sản phẩm phụ).",
              "fastTip": "Cl vào C ở giữa (bậc cao hơn) -> 2-chloropropane."
            },
            {
              "id": "q-c15-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các hydrocarbon sau: ethane, ethylene, acetylene, but-2-yne. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c15-a",
                  "statement": "a) Cả ethylene và acetylene đều làm mất màu dung dịch nước bromine.",
                  "isTrue": true,
                  "explain": "Cả 2 đều có liên kết bội C=C và C≡C nên tham gia phản ứng cộng làm mất màu nước bromine. Đúng."
                },
                {
                  "id": "tf-c15-b",
                  "statement": "b) Trong các chất trên, chỉ có acetylene tạo kết tủa vàng với AgNO₃/NH₃.",
                  "isTrue": true,
                  "explain": "Ethylene không phải alkyne, but-2-yne không có liên kết ba đầu mạch nên chỉ có acetylene phản ứng. Đúng."
                },
                {
                  "id": "tf-c15-c",
                  "statement": "c) Ethane tham gia phản ứng thế với khí chlorine khi có ánh sáng khuếch tán.",
                  "isTrue": true,
                  "explain": "Alkane tham gia phản ứng thế halogen khi chiếu sáng. Đúng."
                },
                {
                  "id": "tf-c15-d",
                  "statement": "d) Khi đốt cháy hoàn toàn ethylene luôn thu được số mol H₂O lớn hơn số mol CO₂.",
                  "isTrue": false,
                  "explain": "Ethylene là C₂H₄ (alkene) nên khi đốt cháy số mol H₂O BẰNG số mol CO₂. Sai."
                }
              ]
            },
            {
              "id": "q-c15-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho $2{,}479\\text{ lít}$ khí acetylene ($C_2H_2$) ở đkc ($25^\\circ\\text{C}, 1\\text{ bar}$) tác dụng hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$. Khối lượng kết tủa vàng nhạt $Ag_2C_2$ thu được là bao nhiêu gam (lấy $M_{Ag_2C_2} = 240\\text{ g/mol}$)?",
              "correctAnswer": "24",
              "unit": "gam",
              "solution": "n_C₂H₂ = 2,479 / 24,79 = 0,1 mol. C₂H₂ + 2AgNO₃ + 2NH₃ -> Ag-C≡C-Ag↓ + 2NH₄NO₃. n_kết tủa = 0,1 mol. Khối lượng m = 0,1 * 240 = 24 gam.",
              "trapAlert": "Nhầm kết tủa chỉ chứa 1 nguyên tử Ag (Ag-C≡CH). Acetylene có 2 nguyên tử H linh động nên tạo AgC≡CAg."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c15-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Sản phẩm chính thu được khi cho propene ($CH_2=CH-CH_3$) tác dụng với hydrogen chloride ($HCl$) là:",
              "options": [
                "2-chloropropane",
                "1-chloropropane",
                "1,2-dichloropropane",
                "propane"
              ],
              "correct": 0,
              "solution": "Theo quy tắc Markovnikov: H cộng vào CH₂ (nhiều H hơn), Cl cộng vào CH (ít H hơn) -> tạo sản phẩm chính là CH₃-CH(Cl)-CH₃ (2-chloropropane).",
              "trapAlert": "Chọn 1-chloropropane (sản phẩm phụ).",
              "fastTip": "Cl vào C ở giữa (bậc cao hơn) -> 2-chloropropane."
            },
            {
              "id": "q-c15-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các hydrocarbon sau: ethane, ethylene, acetylene, but-2-yne. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c15-a",
                  "statement": "a) Cả ethylene và acetylene đều làm mất màu dung dịch nước bromine.",
                  "isTrue": true,
                  "explain": "Cả 2 đều có liên kết bội C=C và C≡C nên tham gia phản ứng cộng làm mất màu nước bromine. Đúng."
                },
                {
                  "id": "tf-c15-b",
                  "statement": "b) Trong các chất trên, chỉ có acetylene tạo kết tủa vàng với AgNO₃/NH₃.",
                  "isTrue": true,
                  "explain": "Ethylene không phải alkyne, but-2-yne không có liên kết ba đầu mạch nên chỉ có acetylene phản ứng. Đúng."
                },
                {
                  "id": "tf-c15-c",
                  "statement": "c) Ethane tham gia phản ứng thế với khí chlorine khi có ánh sáng khuếch tán.",
                  "isTrue": true,
                  "explain": "Alkane tham gia phản ứng thế halogen khi chiếu sáng. Đúng."
                },
                {
                  "id": "tf-c15-d",
                  "statement": "d) Khi đốt cháy hoàn toàn ethylene luôn thu được số mol H₂O lớn hơn số mol CO₂.",
                  "isTrue": false,
                  "explain": "Ethylene là C₂H₄ (alkene) nên khi đốt cháy số mol H₂O BẰNG số mol CO₂. Sai."
                }
              ]
            },
            {
              "id": "q-c15-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho $2{,}479\\text{ lít}$ khí acetylene ($C_2H_2$) ở đkc ($25^\\circ\\text{C}, 1\\text{ bar}$) tác dụng hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$. Khối lượng kết tủa vàng nhạt $Ag_2C_2$ thu được là bao nhiêu gam (lấy $M_{Ag_2C_2} = 240\\text{ g/mol}$)?",
              "correctAnswer": "24",
              "unit": "gam",
              "solution": "n_C₂H₂ = 2,479 / 24,79 = 0,1 mol. C₂H₂ + 2AgNO₃ + 2NH₃ -> Ag-C≡C-Ag↓ + 2NH₄NO₃. n_kết tủa = 0,1 mol. Khối lượng m = 0,1 * 240 = 24 gam.",
              "trapAlert": "Nhầm kết tủa chỉ chứa 1 nguyên tử Ag (Ag-C≡CH). Acetylene có 2 nguyên tử H linh động nên tạo AgC≡CAg."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        },
        {
          "id": "hoa-arene-benzene",
          "title": "Arene (Benzene & Toluene)",
          "desc": "Cấu trúc hệ liên kết $\\pi$ liên hợp vòng benzene, phản ứng thế electrophile ($Br_2, HNO_3/H_2SO_4$) và quy tắc thế định hướng ortho/para/meta.",
          "duration": "25 phút",
          "tag": "Vận dụng",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Cấu tạo nhân thơm Benzene",
              "desc": "Phân tử Benzene ($C_6H_6$) có cấu trúc phẳng, hình lục giác đều với hệ 6 electron $\\pi$ liên hợp giải tỏa đều trên cả 6 nguyên tử carbon. Cấu trúc thơm rất bền vững: \"Dễ thế, khó cộng, bền với chất oxi hóa\"."
            },
            {
              "title": "Quy tắc thế trên vòng thơm của Toluene",
              "desc": "Nhóm alkyl ($-CH_3$) là nhóm đẩy electron, làm giàu mật độ e trên vòng thơm $\\implies$ định hướng phản ứng thế electrophile ưu tiên vào các vị trí ortho (o-) và para (p-). Toluene bị oxi hóa bởi dung dịch $KMnO_4$ khi đun nóng tạo benzoic acid ($C_6H_5COOH$)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Phân biệt Benzene và Toluene",
              "instruction": "Dùng dung dịch $KMnO_4$: ở nhiệt độ thường cả hai đều không phản ứng. Khi đun nóng, Toluene làm mất màu tím và tạo kết tủa nâu đen $MnO_2$, còn Benzene vẫn không phản ứng."
            },
            {
              "step": 2,
              "title": "Xác định vị trí thế trên vòng benzene",
              "instruction": "Nhóm thế loại 1 ($-CH_3, -OH, -NH_2$): định hướng o-, p-. Nhóm thế loại 2 ($-NO_2, -COOH, -CHO$): định hướng meta (m-)."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng thế Nitro hóa Benzene",
              "formula": "C_6H_6 + HNO_3 \\xrightarrow{H_2SO_4 \\text{ đặc}, t^\\circ} C_6H_5NO_2 + H_2O",
              "displayLatex": "C_6H_6 + HNO_3 \\xrightarrow{H_2SO_4, t^\\circ} C_6H_5NO_2 + H_2O",
              "notes": "Tạo nitrobenzene có mùi hạnh nhân đặc trưng."
            },
            {
              "label": "Oxi hóa nhánh alkyl của Toluene",
              "formula": "C_6H_5CH_3 + 2KMnO_4 \\xrightarrow{t^\\circ} C_6H_5COOK + 2MnO_2 \\downarrow + KOH + H_2O",
              "displayLatex": "C_6H_5CH_3 \\xrightarrow{KMnO_4, t^\\circ} C_6H_5COOH",
              "notes": "Benzene không làm mất màu thuốc tím kể cả khi đun nóng."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng benzene làm mất màu dung dịch nước bromine",
              "avoid": "Benzene KHÔNG làm mất màu nước bromine. Benzene chỉ phản ứng thế với bromine khan khi có xúc tác bột sắt ($FeBr_3$)."
            },
            {
              "trap": "Quên điều kiện nhiệt độ khi oxi hóa toluene bằng KMnO4",
              "avoid": "Ở nhiệt độ thường, toluene không làm mất màu dung dịch $KMnO_4$. Bắt buộc phải ĐUN NÓNG."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c16-1",
              "front": "Hóa chất dùng để phân biệt benzene và toluene là gì?",
              "back": "Dung dịch thuốc tím KMnO₄ khi đun nóng (toluene làm mất màu, benzene thì không)."
            },
            {
              "id": "fc-c16-2",
              "front": "Nhóm methyl (-CH₃) định hướng phản ứng thế trên vòng thơm vào các vị trí nào?",
              "back": "Định hướng vào các vị trí ortho (o-) và para (p-)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c16-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Thuốc thử nào sau đây dùng để phân biệt ba chất lỏng mất nhãn: benzene, styrene và toluene?",
              "options": [
                "Dung dịch thuốc tím KMnO₄",
                "Dung dịch nước bromine",
                "Dung dịch AgNO₃/NH₃",
                "Kim loại Sodium (Na)"
              ],
              "correct": 0,
              "solution": "Ở nhiệt độ thường: Styrene có liên kết đôi nhánh -CH=CH₂ làm mất màu KMnO₄ ngay. Đun nóng: Toluene làm mất màu thuốc tím. Benzene không làm mất màu cả khi đun nóng.",
              "trapAlert": "Dùng nước bromine chỉ nhận biết được Styrene, không phân biệt được Benzene và Toluene.",
              "fastTip": "Dung dịch KMnO₄ (lạnh và nóng) là thuốc thử vạn năng cho nhóm arene."
            },
            {
              "id": "q-c16-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành thí nghiệm cho toluene phản ứng với hỗn hợp $HNO_3$ đặc và $H_2SO_4$ đặc theo tỉ lệ mol 1 : 3. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c16-a",
                  "statement": "a) H₂SO₄ đặc đóng vai trò chất xúc tác và hút nước để cân bằng chuyển dịch.",
                  "isTrue": true,
                  "explain": "H₂SO₄ đặc tạo tác nhân electrophile NO₂⁺ và hút nước. Đúng."
                },
                {
                  "id": "tf-c16-b",
                  "statement": "b) Sản phẩm chính thu được là 2,4,6-trinitrotoluene (TNT).",
                  "isTrue": true,
                  "explain": "Thế vào cả 2 vị trí ortho và 1 vị trí para tạo thuốc nổ TNT. Đúng."
                },
                {
                  "id": "tf-c16-c",
                  "statement": "c) Phản ứng thế trên vòng benzene của toluene khó hơn phản ứng thế của benzene.",
                  "isTrue": false,
                  "explain": "Nhóm -CH₃ đẩy electron làm tăng mật độ e nên toluene phản ứng DỄ HƠN benzene. Sai."
                },
                {
                  "id": "tf-c16-d",
                  "statement": "d) Hợp chất TNT là chất rắn màu vàng, dùng làm thuốc nổ quân dụng.",
                  "isTrue": true,
                  "explain": "TNT (trinitrotoluene) là thuốc nổ thông dụng. Đúng."
                }
              ]
            },
            {
              "id": "q-c16-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Oxi hóa hoàn toàn 9,2 gam toluene bằng dung dịch $KMnO_4$ đun nóng, sau đó acid hóa thu được m gam benzoic acid ($C_6H_5COOH$). Biết hiệu suất phản ứng đạt $80\\%$. Tính khối lượng benzoic acid thu được (đơn vị: gam, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "9.8",
              "unit": "gam",
              "solution": "n_toluene = 9,2 / 92 = 0,1 mol. Theo lý thuyết thu được 0,1 mol C₆H₅COOH (M = 122 g/mol). Khối lượng thực tế: m = 0,1 * 122 * 0,8 = 9,76 ≈ 9,8 gam.",
              "trapAlert": "Quên nhân hiệu suất 80%."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c16-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Thuốc thử nào sau đây dùng để phân biệt ba chất lỏng mất nhãn: benzene, styrene và toluene?",
              "options": [
                "Dung dịch thuốc tím KMnO₄",
                "Dung dịch nước bromine",
                "Dung dịch AgNO₃/NH₃",
                "Kim loại Sodium (Na)"
              ],
              "correct": 0,
              "solution": "Ở nhiệt độ thường: Styrene có liên kết đôi nhánh -CH=CH₂ làm mất màu KMnO₄ ngay. Đun nóng: Toluene làm mất màu thuốc tím. Benzene không làm mất màu cả khi đun nóng.",
              "trapAlert": "Dùng nước bromine chỉ nhận biết được Styrene, không phân biệt được Benzene và Toluene.",
              "fastTip": "Dung dịch KMnO₄ (lạnh và nóng) là thuốc thử vạn năng cho nhóm arene."
            },
            {
              "id": "q-c16-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành thí nghiệm cho toluene phản ứng với hỗn hợp $HNO_3$ đặc và $H_2SO_4$ đặc theo tỉ lệ mol 1 : 3. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c16-a",
                  "statement": "a) H₂SO₄ đặc đóng vai trò chất xúc tác và hút nước để cân bằng chuyển dịch.",
                  "isTrue": true,
                  "explain": "H₂SO₄ đặc tạo tác nhân electrophile NO₂⁺ và hút nước. Đúng."
                },
                {
                  "id": "tf-c16-b",
                  "statement": "b) Sản phẩm chính thu được là 2,4,6-trinitrotoluene (TNT).",
                  "isTrue": true,
                  "explain": "Thế vào cả 2 vị trí ortho và 1 vị trí para tạo thuốc nổ TNT. Đúng."
                },
                {
                  "id": "tf-c16-c",
                  "statement": "c) Phản ứng thế trên vòng benzene của toluene khó hơn phản ứng thế của benzene.",
                  "isTrue": false,
                  "explain": "Nhóm -CH₃ đẩy electron làm tăng mật độ e nên toluene phản ứng DỄ HƠN benzene. Sai."
                },
                {
                  "id": "tf-c16-d",
                  "statement": "d) Hợp chất TNT là chất rắn màu vàng, dùng làm thuốc nổ quân dụng.",
                  "isTrue": true,
                  "explain": "TNT (trinitrotoluene) là thuốc nổ thông dụng. Đúng."
                }
              ]
            },
            {
              "id": "q-c16-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Oxi hóa hoàn toàn 9,2 gam toluene bằng dung dịch $KMnO_4$ đun nóng, sau đó acid hóa thu được m gam benzoic acid ($C_6H_5COOH$). Biết hiệu suất phản ứng đạt $80\\%$. Tính khối lượng benzoic acid thu được (đơn vị: gam, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "9.8",
              "unit": "gam",
              "solution": "n_toluene = 9,2 / 92 = 0,1 mol. Theo lý thuyết thu được 0,1 mol C₆H₅COOH (M = 122 g/mol). Khối lượng thực tế: m = 0,1 * 122 * 0,8 = 9,76 ≈ 9,8 gam.",
              "trapAlert": "Quên nhân hiệu suất 80%."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c16-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Thuốc thử nào sau đây dùng để phân biệt ba chất lỏng mất nhãn: benzene, styrene và toluene?",
              "options": [
                "Dung dịch thuốc tím KMnO₄",
                "Dung dịch nước bromine",
                "Dung dịch AgNO₃/NH₃",
                "Kim loại Sodium (Na)"
              ],
              "correct": 0,
              "solution": "Ở nhiệt độ thường: Styrene có liên kết đôi nhánh -CH=CH₂ làm mất màu KMnO₄ ngay. Đun nóng: Toluene làm mất màu thuốc tím. Benzene không làm mất màu cả khi đun nóng.",
              "trapAlert": "Dùng nước bromine chỉ nhận biết được Styrene, không phân biệt được Benzene và Toluene.",
              "fastTip": "Dung dịch KMnO₄ (lạnh và nóng) là thuốc thử vạn năng cho nhóm arene."
            },
            {
              "id": "q-c16-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành thí nghiệm cho toluene phản ứng với hỗn hợp $HNO_3$ đặc và $H_2SO_4$ đặc theo tỉ lệ mol 1 : 3. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c16-a",
                  "statement": "a) H₂SO₄ đặc đóng vai trò chất xúc tác và hút nước để cân bằng chuyển dịch.",
                  "isTrue": true,
                  "explain": "H₂SO₄ đặc tạo tác nhân electrophile NO₂⁺ và hút nước. Đúng."
                },
                {
                  "id": "tf-c16-b",
                  "statement": "b) Sản phẩm chính thu được là 2,4,6-trinitrotoluene (TNT).",
                  "isTrue": true,
                  "explain": "Thế vào cả 2 vị trí ortho và 1 vị trí para tạo thuốc nổ TNT. Đúng."
                },
                {
                  "id": "tf-c16-c",
                  "statement": "c) Phản ứng thế trên vòng benzene của toluene khó hơn phản ứng thế của benzene.",
                  "isTrue": false,
                  "explain": "Nhóm -CH₃ đẩy electron làm tăng mật độ e nên toluene phản ứng DỄ HƠN benzene. Sai."
                },
                {
                  "id": "tf-c16-d",
                  "statement": "d) Hợp chất TNT là chất rắn màu vàng, dùng làm thuốc nổ quân dụng.",
                  "isTrue": true,
                  "explain": "TNT (trinitrotoluene) là thuốc nổ thông dụng. Đúng."
                }
              ]
            },
            {
              "id": "q-c16-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Oxi hóa hoàn toàn 9,2 gam toluene bằng dung dịch $KMnO_4$ đun nóng, sau đó acid hóa thu được m gam benzoic acid ($C_6H_5COOH$). Biết hiệu suất phản ứng đạt $80\\%$. Tính khối lượng benzoic acid thu được (đơn vị: gam, làm tròn 1 chữ số thập phân)?",
              "correctAnswer": "9.8",
              "unit": "gam",
              "solution": "n_toluene = 9,2 / 92 = 0,1 mol. Theo lý thuyết thu được 0,1 mol C₆H₅COOH (M = 122 g/mol). Khối lượng thực tế: m = 0,1 * 122 * 0,8 = 9,76 ≈ 9,8 gam.",
              "trapAlert": "Quên nhân hiệu suất 80%."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        }
      ]
    },
    {
      "chapterId": "c11-alcohol",
      "chapterName": "Alcohol & Phenol",
      "grade": 11,
      "lessons": [
        {
          "id": "hoa-dan-xuat-halogen-alcohol",
          "title": "Dẫn xuất Halogen & Alcohol",
          "desc": "Liên kết hydrogen liên phân tử khiến alcohol có nhiệt độ sôi cao, phản ứng với kim loại kiềm, phản ứng tách nước tạo ether hoặc alkene.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Dẫn xuất Halogen & Phản ứng tách Zaitsev",
              "desc": "Tham gia phản ứng thế nhóm halogen bằng nhóm -OH trong dung dịch kiềm ($R-X + NaOH \\to R-OH + NaX$). Phản ứng tách $HX$ tạo alkene trong môi trường kiềm/alcohol ($KOH/C_2H_5OH$) tuân theo quy tắc Zaitsev: ưu tiên tách H ở carbon bậc cao hơn để tạo alkene có nhiều nhóm thế hơn."
            },
            {
              "title": "Alcohol & Liên kết Hydrogen",
              "desc": "Alcohol ($R-OH$) có liên kết hydrogen liên phân tử mạnh nên có nhiệt độ sôi cao hơn nhiều so với hydrocarbon và ether có cùng khối lượng. Phản ứng với kim loại kiềm giải phóng $H_2$. Phản ứng tách nước: ở $140^\\circ\\text{C}$ tạo ether ($2ROH \\to R-O-R + H_2O$); ở $170^\\circ\\text{C}$ ($H_2SO_4$ đặc) tạo alkene."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Phân biệt nhiệt độ tách nước của Alcohol",
              "instruction": "$140^\\circ\\text{C} \\implies$ tạo ether ($n_{ether} = \\frac{1}{2} n_{alcohol}$). $170^\\circ\\text{C} \\implies$ tạo alkene ($n_{alkene} = n_{alcohol}$)."
            },
            {
              "step": 2,
              "title": "Nhận biết polyalcohol có nhóm -OH kề nhau",
              "instruction": "Polyalcohol có từ 2 nhóm -OH kề nhau (như ethylene glycol, glycerol) hòa tan được $Cu(OH)_2$ tạo dung dịch màu xanh lam thẫm."
            }
          ],
          "formulas": [
            {
              "label": "Quy tắc tách Zaitsev",
              "formula": "R-CH(X)-CH_2-R' \\xrightarrow{KOH/C_2H_5OH, t^\\circ} R-CH=CH-R' + KX + H_2O",
              "displayLatex": "\\text{Tách HX} \\longrightarrow \\text{Alkene nhiều nhóm thế nhất}",
              "notes": "Ưu tiên tách H ở C bậc cao hơn."
            },
            {
              "label": "Phản ứng tách nước tạo Ether và Alkene",
              "formula": "2ROH \\xrightarrow{H_2SO_4, 140^\\circ\\text{C}} R-O-R + H_2O, \\quad C_2H_5OH \\xrightarrow{H_2SO_4, 170^\\circ\\text{C}} C_2H_4 + H_2O",
              "displayLatex": "140^\\circ\\text{C} \\to \\text{Ether}, \\quad 170^\\circ\\text{C} \\to \\text{Alkene}",
              "notes": "Nhiệt độ quyết định chiều hướng phản ứng."
            },
            {
              "label": "Phản ứng oxi hóa không hoàn toàn của Alcohol",
              "formula": "Alcohol bậc 1 \\xrightarrow{CuO, t^\\circ} Aldehyde, \\quad Alcohol bậc 2 \\xrightarrow{CuO, t^\\circ} Ketone",
              "displayLatex": "R-CH_2OH \\xrightarrow{CuO} R-CHO, \\quad R-CH(OH)-R' \\xrightarrow{CuO} R-CO-R'",
              "notes": "Alcohol bậc 3 không bị oxi hóa bởi CuO."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm sản phẩm tách nước ở 140°C và 170°C",
              "avoid": "Nhớ: 140°C (nhiệt độ thấp) tạo Ether; 170°C (nhiệt độ cao) tạo Alkene."
            },
            {
              "trap": "Cho rằng mọi polyalcohol đều tạo dung dịch xanh lam với Cu(OH)2",
              "avoid": "Bắt buộc các nhóm -OH phải ở vị trí KỀ NHAU (propan-1,3-diol không phản ứng)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c17-1",
              "front": "Chất nào dùng để nhận biết glycerol và ethanol?",
              "back": "Cu(OH)₂ ở nhiệt độ thường (Glycerol tạo dung dịch phức màu xanh lam thẫm)."
            },
            {
              "id": "fc-c17-2",
              "front": "Quy tắc Zaitsev áp dụng cho phản ứng nào?",
              "back": "Phản ứng tách HX của dẫn xuất halogen hoặc tách H₂O của alcohol."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c17-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đun nóng ethanol ($C_2H_5OH$) với dung dịch $H_2SO_4$ đặc ở $170^\\circ\\text{C}$ thu được sản phẩm hữu cơ chính là:",
              "options": [
                "Ethylene (C₂H₄)",
                "Diethyl ether (C₂H₅-O-C₂H₅)",
                "Ethane (C₂H₆)",
                "Ethyl hydrogen sulfate"
              ],
              "correct": 0,
              "solution": "Ở 170°C (H₂SO₄ đặc), alcohol tách nước nội phân tử tạo alkene: C₂H₅OH -> C₂H₄ + H₂O.",
              "trapAlert": "Chọn Diethyl ether (đó là sản phẩm ở 140°C).",
              "fastTip": "170°C -> Alkene (Ethylene)."
            },
            {
              "id": "q-c17-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các chất lỏng sau: ethanol, glycerol, propan-1,3-diol, ethylene glycol. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c17-a",
                  "statement": "a) Cả 4 chất trên đều phản ứng được với kim loại Na giải phóng khí H₂.",
                  "isTrue": true,
                  "explain": "Đều có nhóm chức alcohol (-OH) chứa H linh động nên đều phản ứng Na. Đúng."
                },
                {
                  "id": "tf-c17-b",
                  "statement": "b) Cả glycerol và ethylene glycol đều hòa tan được Cu(OH)₂ tạo dung dịch xanh lam thẫm.",
                  "isTrue": true,
                  "explain": "Cả 2 đều có các nhóm -OH kề nhau. Đúng."
                },
                {
                  "id": "tf-c17-c",
                  "statement": "c) Propan-1,3-diol cũng hòa tan được Cu(OH)₂ ở điều kiện thường tạo phức xanh.",
                  "isTrue": false,
                  "explain": "Hai nhóm -OH ở vị trí 1,3 cách xa nhau (không kề nhau) nên không hòa tan được Cu(OH)₂. Sai."
                },
                {
                  "id": "tf-c17-d",
                  "statement": "d) Nhiệt độ sôi của ethanol cao hơn dimethyl ether (CH₃-O-CH₃) dù cùng công thức phân tử C₂H₆O.",
                  "isTrue": true,
                  "explain": "Ethanol có liên kết hydrogen liên phân tử bền vững, ether không có. Đúng."
                }
              ]
            },
            {
              "id": "q-c17-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 13,8 gam ethanol ($C_2H_5OH$) với $H_2SO_4$ đặc ở $140^\\circ\\text{C}$ để thực hiện phản ứng ether hóa. Biết hiệu suất phản ứng đạt $60\\%$. Tính khối lượng diethyl ether ($C_2H_5-O-C_2H_5$) thu được (đơn vị: gam, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "6.66",
              "unit": "gam",
              "solution": "n_ethanol = 13,8 / 46 = 0,3 mol. 2 C₂H₅OH -> (C₂H₅)₂O + H₂O. n_ether lý thuyết = 0,3 / 2 = 0,15 mol. Khối lượng lý thuyết = 0,15 * 74 = 11,1 gam. Khối lượng thực tế (H = 60%): m = 11,1 * 0,6 = 6,66 gam.",
              "trapAlert": "Quên hệ số 2 của ethanol hoặc quên nhân hiệu suất 60%."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c17-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đun nóng ethanol ($C_2H_5OH$) với dung dịch $H_2SO_4$ đặc ở $170^\\circ\\text{C}$ thu được sản phẩm hữu cơ chính là:",
              "options": [
                "Ethylene (C₂H₄)",
                "Diethyl ether (C₂H₅-O-C₂H₅)",
                "Ethane (C₂H₆)",
                "Ethyl hydrogen sulfate"
              ],
              "correct": 0,
              "solution": "Ở 170°C (H₂SO₄ đặc), alcohol tách nước nội phân tử tạo alkene: C₂H₅OH -> C₂H₄ + H₂O.",
              "trapAlert": "Chọn Diethyl ether (đó là sản phẩm ở 140°C).",
              "fastTip": "170°C -> Alkene (Ethylene)."
            },
            {
              "id": "q-c17-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các chất lỏng sau: ethanol, glycerol, propan-1,3-diol, ethylene glycol. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c17-a",
                  "statement": "a) Cả 4 chất trên đều phản ứng được với kim loại Na giải phóng khí H₂.",
                  "isTrue": true,
                  "explain": "Đều có nhóm chức alcohol (-OH) chứa H linh động nên đều phản ứng Na. Đúng."
                },
                {
                  "id": "tf-c17-b",
                  "statement": "b) Cả glycerol và ethylene glycol đều hòa tan được Cu(OH)₂ tạo dung dịch xanh lam thẫm.",
                  "isTrue": true,
                  "explain": "Cả 2 đều có các nhóm -OH kề nhau. Đúng."
                },
                {
                  "id": "tf-c17-c",
                  "statement": "c) Propan-1,3-diol cũng hòa tan được Cu(OH)₂ ở điều kiện thường tạo phức xanh.",
                  "isTrue": false,
                  "explain": "Hai nhóm -OH ở vị trí 1,3 cách xa nhau (không kề nhau) nên không hòa tan được Cu(OH)₂. Sai."
                },
                {
                  "id": "tf-c17-d",
                  "statement": "d) Nhiệt độ sôi của ethanol cao hơn dimethyl ether (CH₃-O-CH₃) dù cùng công thức phân tử C₂H₆O.",
                  "isTrue": true,
                  "explain": "Ethanol có liên kết hydrogen liên phân tử bền vững, ether không có. Đúng."
                }
              ]
            },
            {
              "id": "q-c17-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 13,8 gam ethanol ($C_2H_5OH$) với $H_2SO_4$ đặc ở $140^\\circ\\text{C}$ để thực hiện phản ứng ether hóa. Biết hiệu suất phản ứng đạt $60\\%$. Tính khối lượng diethyl ether ($C_2H_5-O-C_2H_5$) thu được (đơn vị: gam, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "6.66",
              "unit": "gam",
              "solution": "n_ethanol = 13,8 / 46 = 0,3 mol. 2 C₂H₅OH -> (C₂H₅)₂O + H₂O. n_ether lý thuyết = 0,3 / 2 = 0,15 mol. Khối lượng lý thuyết = 0,15 * 74 = 11,1 gam. Khối lượng thực tế (H = 60%): m = 11,1 * 0,6 = 6,66 gam.",
              "trapAlert": "Quên hệ số 2 của ethanol hoặc quên nhân hiệu suất 60%."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c17-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đun nóng ethanol ($C_2H_5OH$) với dung dịch $H_2SO_4$ đặc ở $170^\\circ\\text{C}$ thu được sản phẩm hữu cơ chính là:",
              "options": [
                "Ethylene (C₂H₄)",
                "Diethyl ether (C₂H₅-O-C₂H₅)",
                "Ethane (C₂H₆)",
                "Ethyl hydrogen sulfate"
              ],
              "correct": 0,
              "solution": "Ở 170°C (H₂SO₄ đặc), alcohol tách nước nội phân tử tạo alkene: C₂H₅OH -> C₂H₄ + H₂O.",
              "trapAlert": "Chọn Diethyl ether (đó là sản phẩm ở 140°C).",
              "fastTip": "170°C -> Alkene (Ethylene)."
            },
            {
              "id": "q-c17-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho các chất lỏng sau: ethanol, glycerol, propan-1,3-diol, ethylene glycol. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c17-a",
                  "statement": "a) Cả 4 chất trên đều phản ứng được với kim loại Na giải phóng khí H₂.",
                  "isTrue": true,
                  "explain": "Đều có nhóm chức alcohol (-OH) chứa H linh động nên đều phản ứng Na. Đúng."
                },
                {
                  "id": "tf-c17-b",
                  "statement": "b) Cả glycerol và ethylene glycol đều hòa tan được Cu(OH)₂ tạo dung dịch xanh lam thẫm.",
                  "isTrue": true,
                  "explain": "Cả 2 đều có các nhóm -OH kề nhau. Đúng."
                },
                {
                  "id": "tf-c17-c",
                  "statement": "c) Propan-1,3-diol cũng hòa tan được Cu(OH)₂ ở điều kiện thường tạo phức xanh.",
                  "isTrue": false,
                  "explain": "Hai nhóm -OH ở vị trí 1,3 cách xa nhau (không kề nhau) nên không hòa tan được Cu(OH)₂. Sai."
                },
                {
                  "id": "tf-c17-d",
                  "statement": "d) Nhiệt độ sôi của ethanol cao hơn dimethyl ether (CH₃-O-CH₃) dù cùng công thức phân tử C₂H₆O.",
                  "isTrue": true,
                  "explain": "Ethanol có liên kết hydrogen liên phân tử bền vững, ether không có. Đúng."
                }
              ]
            },
            {
              "id": "q-c17-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 13,8 gam ethanol ($C_2H_5OH$) với $H_2SO_4$ đặc ở $140^\\circ\\text{C}$ để thực hiện phản ứng ether hóa. Biết hiệu suất phản ứng đạt $60\\%$. Tính khối lượng diethyl ether ($C_2H_5-O-C_2H_5$) thu được (đơn vị: gam, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "6.66",
              "unit": "gam",
              "solution": "n_ethanol = 13,8 / 46 = 0,3 mol. 2 C₂H₅OH -> (C₂H₅)₂O + H₂O. n_ether lý thuyết = 0,3 / 2 = 0,15 mol. Khối lượng lý thuyết = 0,15 * 74 = 11,1 gam. Khối lượng thực tế (H = 60%): m = 11,1 * 0,6 = 6,66 gam.",
              "trapAlert": "Quên hệ số 2 của ethanol hoặc quên nhân hiệu suất 60%."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        },
        {
          "id": "hoa-phenol-tinh-chat",
          "title": "Phenol: Cấu tạo & Tính chất hóa học",
          "desc": "Nhóm $-OH$ gắn trực tiếp vào vòng thơm làm phenol có tính acid yếu (không đổi màu quỳ), phản ứng với kiềm, kết tủa trắng với nước bromine.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đặc điểm cấu tạo phân tử Phenol",
              "desc": "Phenol ($C_6H_5OH$) có nhóm $-OH$ liên kết trực tiếp với nguyên tử carbon của vòng thơm. Cặp electron tự do của oxy liên hợp với vòng benzene làm liên kết $O-H$ phân cực mạnh hơn alcohol $\\implies$ Phenol có tính acid yếu (không đổi màu quỳ tím, yếu hơn $H_2CO_3$, tác dụng được với dung dịch NaOH)."
            },
            {
              "title": "Ảnh hưởng qua lại giữa nhóm -OH và vòng thơm",
              "desc": "Vòng thơm làm tăng tính acid của nhóm $-OH$. Ngược lại, nhóm $-OH$ làm tăng mật độ electron trên vòng thơm $\\implies$ Phenol tham gia phản ứng thế dễ dàng hơn benzene, tạo kết tủa trắng với nước bromine ($2,4,6$-tribromophenol) và kết tủa vàng với $HNO_3$ đặc (picric acid)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhận diện Phenol",
              "instruction": "Dùng dung dịch nước $Br_2$ tạo kết tủa trắng $2,4,6$-tribromophenol ngay nhiệt độ thường không cần xúc tác."
            },
            {
              "step": 2,
              "title": "So sánh tính acid",
              "instruction": "Thứ tự tính acid: $Alcohol < Nước < Phenol < H_2CO_3 < Carboxylic acid$. Phenol không làm đổi màu quỳ tím."
            }
          ],
          "formulas": [
            {
              "label": "Tính acid yếu của Phenol",
              "formula": "C_6H_5OH + NaOH \\longrightarrow C_6H_5ONa + H_2O, \\quad C_6H_5ONa + CO_2 + H_2O \\longrightarrow C_6H_5OH \\downarrow + NaHCO_3",
              "displayLatex": "C_6H_5ONa + CO_2 + H_2O \\longrightarrow C_6H_5OH + NaHCO_3",
              "notes": "Khí CO₂ đẩy được phenol ra khỏi muối sodium phenolate."
            },
            {
              "label": "Phản ứng nhận biết bằng nước Bromine",
              "formula": "C_6H_5OH + 3Br_2 \\longrightarrow C_6H_2Br_3OH \\downarrow + 3HBr",
              "displayLatex": "C_6H_5OH + 3Br_2 \\longrightarrow 2,4,6\\text{-tribromophenol } \\downarrow \\text{ (trắng)}",
              "notes": "Hiện tượng: mất màu vàng nâu của nước bromine và xuất hiện kết tủa trắng."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng Phenol làm quỳ tím hóa đỏ",
              "avoid": "Tính acid của phenol rất yếu ($K_a \\approx 10^{-10}$), yếu hơn acid carbonic ($H_2CO_3$) nên KHÔNG làm đổi màu quỳ tím."
            },
            {
              "trap": "Nhầm benzyl alcohol với phenol",
              "avoid": "Benzyl alcohol ($C_6H_5CH_2OH$) có nhóm -OH đính vào nhánh no nên là alcohol, KHÔNG tác dụng NaOH và không tạo kết tủa trắng với nước bromine."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c18-1",
              "front": "Dung dịch phenol có làm đổi màu quỳ tím không?",
              "back": "Không làm đổi màu quỳ tím vì tính acid rất yếu."
            },
            {
              "id": "fc-c18-2",
              "front": "Hiện tượng xảy ra khi nhỏ nước bromine vào dung dịch phenol?",
              "back": "Nước bromine mất màu và xuất hiện kết tủa trắng (2,4,6-tribromophenol)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c18-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhỏ nước bromine vào ống nghiệm chứa dung dịch phenol, hiện tượng quan sát được là:",
              "options": [
                "Nước bromine mất màu và xuất hiện kết tủa trắng",
                "Nước bromine mất màu và có khí thoát ra",
                "Xuất hiện kết tủa màu vàng tươi",
                "Không có hiện tượng gì xảy ra"
              ],
              "correct": 0,
              "solution": "Phản ứng thế 3 nguyên tử Br vào các vị trí 2,4,6 tạo kết tủa trắng 2,4,6-tribromophenol và làm mất màu nước bromine.",
              "trapAlert": "Nhầm kết tủa vàng (kết tủa vàng là picric acid khi phản ứng với HNO₃ đặc).",
              "fastTip": "Phenol + nước Br₂ -> KẾT TỦA TRẮNG."
            },
            {
              "id": "q-c18-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Sục khí $CO_2$ vào dung dịch sodium phenolate ($C_6H_5ONa$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c18-a",
                  "statement": "a) Dung dịch đang trong suốt bị vẩn đục do phenol được giải phóng ít tan trong nước lạnh.",
                  "isTrue": true,
                  "explain": "C₆H₅ONa + CO₂ + H₂O -> C₆H₅OH↓ + NaHCO₃. Đúng."
                },
                {
                  "id": "tf-c18-b",
                  "statement": "b) Phản ứng trên chứng minh tính acid của phenol yếu hơn acid carbonic (H₂CO₃).",
                  "isTrue": true,
                  "explain": "Acid mạnh đẩy acid yếu hơn ra khỏi muối. Đúng."
                },
                {
                  "id": "tf-c18-c",
                  "statement": "c) Muối thu được sau phản ứng là muối sodium carbonate (Na₂CO₃).",
                  "isTrue": false,
                  "explain": "Muối tạo thành là sodium hydrogencarbonate (NaHCO₃). Sai."
                },
                {
                  "id": "tf-c18-d",
                  "statement": "d) Khi đun nóng nhẹ ống nghiệm sau phản ứng, dung dịch trở nên trong suốt.",
                  "isTrue": true,
                  "explain": "Phenol tan tốt trong nước nóng nên dung dịch trong trở lại. Đúng."
                }
              ]
            },
            {
              "id": "q-c18-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 9,4 gam phenol tác dụng hoàn toàn với nước bromine dư. Khối lượng kết tủa trắng $2,4,6$-tribromophenol thu được là bao nhiêu gam (lấy $M = 331\\text{ g/mol}$)?",
              "correctAnswer": "33.1",
              "unit": "gam",
              "solution": "n_phenol = 9,4 / 94 = 0,1 mol. n_kết tủa = 0,1 mol. m = 0,1 * 331 = 33,1 gam.",
              "trapAlert": "Nhầm khối lượng phân tử kết tủa."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c18-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhỏ nước bromine vào ống nghiệm chứa dung dịch phenol, hiện tượng quan sát được là:",
              "options": [
                "Nước bromine mất màu và xuất hiện kết tủa trắng",
                "Nước bromine mất màu và có khí thoát ra",
                "Xuất hiện kết tủa màu vàng tươi",
                "Không có hiện tượng gì xảy ra"
              ],
              "correct": 0,
              "solution": "Phản ứng thế 3 nguyên tử Br vào các vị trí 2,4,6 tạo kết tủa trắng 2,4,6-tribromophenol và làm mất màu nước bromine.",
              "trapAlert": "Nhầm kết tủa vàng (kết tủa vàng là picric acid khi phản ứng với HNO₃ đặc).",
              "fastTip": "Phenol + nước Br₂ -> KẾT TỦA TRẮNG."
            },
            {
              "id": "q-c18-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Sục khí $CO_2$ vào dung dịch sodium phenolate ($C_6H_5ONa$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c18-a",
                  "statement": "a) Dung dịch đang trong suốt bị vẩn đục do phenol được giải phóng ít tan trong nước lạnh.",
                  "isTrue": true,
                  "explain": "C₆H₅ONa + CO₂ + H₂O -> C₆H₅OH↓ + NaHCO₃. Đúng."
                },
                {
                  "id": "tf-c18-b",
                  "statement": "b) Phản ứng trên chứng minh tính acid của phenol yếu hơn acid carbonic (H₂CO₃).",
                  "isTrue": true,
                  "explain": "Acid mạnh đẩy acid yếu hơn ra khỏi muối. Đúng."
                },
                {
                  "id": "tf-c18-c",
                  "statement": "c) Muối thu được sau phản ứng là muối sodium carbonate (Na₂CO₃).",
                  "isTrue": false,
                  "explain": "Muối tạo thành là sodium hydrogencarbonate (NaHCO₃). Sai."
                },
                {
                  "id": "tf-c18-d",
                  "statement": "d) Khi đun nóng nhẹ ống nghiệm sau phản ứng, dung dịch trở nên trong suốt.",
                  "isTrue": true,
                  "explain": "Phenol tan tốt trong nước nóng nên dung dịch trong trở lại. Đúng."
                }
              ]
            },
            {
              "id": "q-c18-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 9,4 gam phenol tác dụng hoàn toàn với nước bromine dư. Khối lượng kết tủa trắng $2,4,6$-tribromophenol thu được là bao nhiêu gam (lấy $M = 331\\text{ g/mol}$)?",
              "correctAnswer": "33.1",
              "unit": "gam",
              "solution": "n_phenol = 9,4 / 94 = 0,1 mol. n_kết tủa = 0,1 mol. m = 0,1 * 331 = 33,1 gam.",
              "trapAlert": "Nhầm khối lượng phân tử kết tủa."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c18-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhỏ nước bromine vào ống nghiệm chứa dung dịch phenol, hiện tượng quan sát được là:",
              "options": [
                "Nước bromine mất màu và xuất hiện kết tủa trắng",
                "Nước bromine mất màu và có khí thoát ra",
                "Xuất hiện kết tủa màu vàng tươi",
                "Không có hiện tượng gì xảy ra"
              ],
              "correct": 0,
              "solution": "Phản ứng thế 3 nguyên tử Br vào các vị trí 2,4,6 tạo kết tủa trắng 2,4,6-tribromophenol và làm mất màu nước bromine.",
              "trapAlert": "Nhầm kết tủa vàng (kết tủa vàng là picric acid khi phản ứng với HNO₃ đặc).",
              "fastTip": "Phenol + nước Br₂ -> KẾT TỦA TRẮNG."
            },
            {
              "id": "q-c18-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Sục khí $CO_2$ vào dung dịch sodium phenolate ($C_6H_5ONa$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c18-a",
                  "statement": "a) Dung dịch đang trong suốt bị vẩn đục do phenol được giải phóng ít tan trong nước lạnh.",
                  "isTrue": true,
                  "explain": "C₆H₅ONa + CO₂ + H₂O -> C₆H₅OH↓ + NaHCO₃. Đúng."
                },
                {
                  "id": "tf-c18-b",
                  "statement": "b) Phản ứng trên chứng minh tính acid của phenol yếu hơn acid carbonic (H₂CO₃).",
                  "isTrue": true,
                  "explain": "Acid mạnh đẩy acid yếu hơn ra khỏi muối. Đúng."
                },
                {
                  "id": "tf-c18-c",
                  "statement": "c) Muối thu được sau phản ứng là muối sodium carbonate (Na₂CO₃).",
                  "isTrue": false,
                  "explain": "Muối tạo thành là sodium hydrogencarbonate (NaHCO₃). Sai."
                },
                {
                  "id": "tf-c18-d",
                  "statement": "d) Khi đun nóng nhẹ ống nghiệm sau phản ứng, dung dịch trở nên trong suốt.",
                  "isTrue": true,
                  "explain": "Phenol tan tốt trong nước nóng nên dung dịch trong trở lại. Đúng."
                }
              ]
            },
            {
              "id": "q-c18-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 9,4 gam phenol tác dụng hoàn toàn với nước bromine dư. Khối lượng kết tủa trắng $2,4,6$-tribromophenol thu được là bao nhiêu gam (lấy $M = 331\\text{ g/mol}$)?",
              "correctAnswer": "33.1",
              "unit": "gam",
              "solution": "n_phenol = 9,4 / 94 = 0,1 mol. n_kết tủa = 0,1 mol. m = 0,1 * 331 = 33,1 gam.",
              "trapAlert": "Nhầm khối lượng phân tử kết tủa."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        }
      ]
    },
    {
      "chapterId": "c11-carbonyl",
      "chapterName": "Hợp chất Carbonyl & Carboxylic acid",
      "grade": 11,
      "lessons": [
        {
          "id": "hoa-aldehyde-ketone",
          "title": "Hợp chất Carbonyl (Aldehyde & Ketone)",
          "desc": "Đặc điểm nhóm carbonyl $>C=O$, phản ứng cộng hydrogen, phản ứng tráng bạc của aldehyde và phản ứng tạo iodoform của methyl ketone.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đặc điểm nhóm Carbonyl C=O",
              "desc": "Nhóm carbonyl ($>C=O$) gồm 1 liên kết $\\sigma$ và 1 liên kết $\\pi$ phân cực mạnh về phía oxy. Aldehyde ($R-CH=O$) có nguyên tử H đính vào $C=O$ nên có tính khử mạnh. Ketone ($R-CO-R'$) có nhóm $C=O$ đính với 2 gốc hydrocarbon, bền hơn, khó bị oxi hóa hơn."
            },
            {
              "title": "Phản ứng đặc trưng của Aldehyde & Ketone",
              "desc": "Phản ứng cộng $H_2$ ($Ni, t^\\circ$): Aldehyde $\\to$ Alcohol bậc 1; Ketone $\\to$ Alcohol bậc 2. Phản ứng tráng bạc của Aldehyde với thuốc thử Tollens ($AgNO_3/NH_3$): 1 nhóm $-CHO \\to 2 Ag\\downarrow$ (riêng $HCHO \\to 4 Ag\\downarrow$). Phản ứng tạo iodoform ($CHI_3$ kết tủa vàng) đặc trưng cho nhóm $CH_3-C=O$ và $CH_3-CH(OH)-$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính số mol Ag trong bài toán tráng bạc",
              "instruction": "Nếu $n_{Ag} = 2 n_{aldehyde} \\implies$ aldehyde đơn chức khác HCHO. Nếu $n_{Ag} = 4 n_{aldehyde} \\implies$ là formaldehyde ($HCHO$) hoặc dialdehyde ($OHC-CHO$)."
            },
            {
              "step": 2,
              "title": "Khử aldehyde/ketone bằng NaBH4 hoặc H2/Ni",
              "instruction": "Aldehyde khử thành alcohol bậc 1, ketone khử thành alcohol bậc 2."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng tráng bạc với thuốc thử Tollens",
              "formula": "R-CHO + 2[Ag(NH_3)_2]OH \\xrightarrow{t^\\circ} R-COONH_4 + 2Ag \\downarrow + 3NH_3 + H_2O",
              "displayLatex": "R-CHO \\longrightarrow 2Ag \\downarrow, \\quad HCHO \\longrightarrow 4Ag \\downarrow",
              "notes": "1 mol -CHO tạo 2 mol Ag (riêng formaldehyde tạo 4 mol Ag)."
            },
            {
              "label": "Phản ứng tạo Iodoform (phản ứng iod hóa)",
              "formula": "CH_3-CO-R + 3I_2 + 4NaOH \\longrightarrow CHI_3 \\downarrow + R-COONa + 3NaI + 3H_2O",
              "displayLatex": "CH_3-CO-R \\xrightarrow{I_2/NaOH} CHI_3 \\downarrow \\text{ (vàng)}",
              "notes": "Nhận biết nhóm acetyl CH₃-CO-."
            }
          ],
          "traps": [
            {
              "trap": "Quên trường hợp đặc biệt HCHO tạo 4 Ag",
              "avoid": "1 mol Formaldehyde (HCHO) tác dụng thuốc thử Tollens sinh ra tới 4 mol Ag!"
            },
            {
              "trap": "Nghĩ rằng Ketone tham gia phản ứng tráng bạc",
              "avoid": "Ketone KHÔNG tham gia phản ứng tráng bạc và không làm mất màu nước bromine (trừ fructose trong môi trường kiềm bị chuyển thành glucose)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c19-1",
              "front": "1 mol Formaldehyde (HCHO) khi tráng bạc hoàn toàn tạo ra bao nhiêu mol Ag?",
              "back": "Tạo ra 4 mol Ag kim loại."
            },
            {
              "id": "fc-c19-2",
              "front": "Khử Acetone (propan-2-one) bằng H₂/Ni thu được chất nào?",
              "back": "Thu được propan-2-ol (alcohol bậc 2)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c19-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho 4,4 gam acetaldehyde ($CH_3CHO$) tác dụng hoàn toàn với lượng dư dung dịch $AgNO_3$ trong $NH_3$ đun nóng. Khối lượng Ag kim loại bám vào thành ống nghiệm là:",
              "options": [
                "21,6 gam",
                "10,8 gam",
                "43,2 gam",
                "5,4 gam"
              ],
              "correct": 0,
              "solution": "n_CH₃CHO = 4,4 / 44 = 0,1 mol. n_Ag = 2 * n_CH₃CHO = 0,2 mol. Khối lượng m = 0,2 * 108 = 21,6 gam.",
              "trapAlert": "Nhầm tạo 1 mol Ag (ra 10,8g).",
              "fastTip": "0,1 * 2 * 108 = 21,6 gam."
            },
            {
              "id": "q-c19-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét hai hợp chất hữu cơ: propanal ($CH_3CH_2CHO$) và acetone ($CH_3COCH_3$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c19-a",
                  "statement": "a) Cả hai chất đều có cùng công thức phân tử C₃H₆O và là đồng phân nhóm chức của nhau.",
                  "isTrue": true,
                  "explain": "Cùng C₃H₆O: một chất là aldehyde, một chất là ketone. Đúng."
                },
                {
                  "id": "tf-c19-b",
                  "statement": "b) Cả propanal và acetone đều tham gia phản ứng tráng bạc với thuốc thử Tollens.",
                  "isTrue": false,
                  "explain": "Chỉ có propanal (aldehyde) tráng bạc, acetone (ketone) không tráng bạc. Sai."
                },
                {
                  "id": "tf-c19-c",
                  "statement": "c) Cả hai chất đều tác dụng với khí H₂ (xúc tác Ni, đun nóng) tạo alcohol.",
                  "isTrue": true,
                  "explain": "Propanal -> propan-1-ol; Acetone -> propan-2-ol. Đúng."
                },
                {
                  "id": "tf-c19-d",
                  "statement": "d) Acetone cho kết tủa vàng iodoform (CHI₃) khi tác dụng với I₂ trong dung dịch kiềm.",
                  "isTrue": true,
                  "explain": "Acetone có nhóm CH₃-C=O nên tham gia phản ứng iodoform tạo CHI₃ kết tủa vàng. Đúng."
                }
              ]
            },
            {
              "id": "q-c19-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 3,0 gam formaldehyde ($HCHO$) thực hiện phản ứng tráng bạc hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$. Tính khối lượng Ag kim loại thu được (đơn vị: gam)?",
              "correctAnswer": "43.2",
              "unit": "gam",
              "solution": "n_HCHO = 3,0 / 30 = 0,1 mol. 1 HCHO -> 4 Ag -> n_Ag = 0,4 mol. m_Ag = 0,4 * 108 = 43,2 gam.",
              "trapAlert": "Nhân hệ số 2 thay vì hệ số 4."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c19-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho 4,4 gam acetaldehyde ($CH_3CHO$) tác dụng hoàn toàn với lượng dư dung dịch $AgNO_3$ trong $NH_3$ đun nóng. Khối lượng Ag kim loại bám vào thành ống nghiệm là:",
              "options": [
                "21,6 gam",
                "10,8 gam",
                "43,2 gam",
                "5,4 gam"
              ],
              "correct": 0,
              "solution": "n_CH₃CHO = 4,4 / 44 = 0,1 mol. n_Ag = 2 * n_CH₃CHO = 0,2 mol. Khối lượng m = 0,2 * 108 = 21,6 gam.",
              "trapAlert": "Nhầm tạo 1 mol Ag (ra 10,8g).",
              "fastTip": "0,1 * 2 * 108 = 21,6 gam."
            },
            {
              "id": "q-c19-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét hai hợp chất hữu cơ: propanal ($CH_3CH_2CHO$) và acetone ($CH_3COCH_3$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c19-a",
                  "statement": "a) Cả hai chất đều có cùng công thức phân tử C₃H₆O và là đồng phân nhóm chức của nhau.",
                  "isTrue": true,
                  "explain": "Cùng C₃H₆O: một chất là aldehyde, một chất là ketone. Đúng."
                },
                {
                  "id": "tf-c19-b",
                  "statement": "b) Cả propanal và acetone đều tham gia phản ứng tráng bạc với thuốc thử Tollens.",
                  "isTrue": false,
                  "explain": "Chỉ có propanal (aldehyde) tráng bạc, acetone (ketone) không tráng bạc. Sai."
                },
                {
                  "id": "tf-c19-c",
                  "statement": "c) Cả hai chất đều tác dụng với khí H₂ (xúc tác Ni, đun nóng) tạo alcohol.",
                  "isTrue": true,
                  "explain": "Propanal -> propan-1-ol; Acetone -> propan-2-ol. Đúng."
                },
                {
                  "id": "tf-c19-d",
                  "statement": "d) Acetone cho kết tủa vàng iodoform (CHI₃) khi tác dụng với I₂ trong dung dịch kiềm.",
                  "isTrue": true,
                  "explain": "Acetone có nhóm CH₃-C=O nên tham gia phản ứng iodoform tạo CHI₃ kết tủa vàng. Đúng."
                }
              ]
            },
            {
              "id": "q-c19-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 3,0 gam formaldehyde ($HCHO$) thực hiện phản ứng tráng bạc hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$. Tính khối lượng Ag kim loại thu được (đơn vị: gam)?",
              "correctAnswer": "43.2",
              "unit": "gam",
              "solution": "n_HCHO = 3,0 / 30 = 0,1 mol. 1 HCHO -> 4 Ag -> n_Ag = 0,4 mol. m_Ag = 0,4 * 108 = 43,2 gam.",
              "trapAlert": "Nhân hệ số 2 thay vì hệ số 4."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c19-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Cho 4,4 gam acetaldehyde ($CH_3CHO$) tác dụng hoàn toàn với lượng dư dung dịch $AgNO_3$ trong $NH_3$ đun nóng. Khối lượng Ag kim loại bám vào thành ống nghiệm là:",
              "options": [
                "21,6 gam",
                "10,8 gam",
                "43,2 gam",
                "5,4 gam"
              ],
              "correct": 0,
              "solution": "n_CH₃CHO = 4,4 / 44 = 0,1 mol. n_Ag = 2 * n_CH₃CHO = 0,2 mol. Khối lượng m = 0,2 * 108 = 21,6 gam.",
              "trapAlert": "Nhầm tạo 1 mol Ag (ra 10,8g).",
              "fastTip": "0,1 * 2 * 108 = 21,6 gam."
            },
            {
              "id": "q-c19-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét hai hợp chất hữu cơ: propanal ($CH_3CH_2CHO$) và acetone ($CH_3COCH_3$). Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c19-a",
                  "statement": "a) Cả hai chất đều có cùng công thức phân tử C₃H₆O và là đồng phân nhóm chức của nhau.",
                  "isTrue": true,
                  "explain": "Cùng C₃H₆O: một chất là aldehyde, một chất là ketone. Đúng."
                },
                {
                  "id": "tf-c19-b",
                  "statement": "b) Cả propanal và acetone đều tham gia phản ứng tráng bạc với thuốc thử Tollens.",
                  "isTrue": false,
                  "explain": "Chỉ có propanal (aldehyde) tráng bạc, acetone (ketone) không tráng bạc. Sai."
                },
                {
                  "id": "tf-c19-c",
                  "statement": "c) Cả hai chất đều tác dụng với khí H₂ (xúc tác Ni, đun nóng) tạo alcohol.",
                  "isTrue": true,
                  "explain": "Propanal -> propan-1-ol; Acetone -> propan-2-ol. Đúng."
                },
                {
                  "id": "tf-c19-d",
                  "statement": "d) Acetone cho kết tủa vàng iodoform (CHI₃) khi tác dụng với I₂ trong dung dịch kiềm.",
                  "isTrue": true,
                  "explain": "Acetone có nhóm CH₃-C=O nên tham gia phản ứng iodoform tạo CHI₃ kết tủa vàng. Đúng."
                }
              ]
            },
            {
              "id": "q-c19-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 3,0 gam formaldehyde ($HCHO$) thực hiện phản ứng tráng bạc hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$. Tính khối lượng Ag kim loại thu được (đơn vị: gam)?",
              "correctAnswer": "43.2",
              "unit": "gam",
              "solution": "n_HCHO = 3,0 / 30 = 0,1 mol. 1 HCHO -> 4 Ag -> n_Ag = 0,4 mol. m_Ag = 0,4 * 108 = 43,2 gam.",
              "trapAlert": "Nhân hệ số 2 thay vì hệ số 4."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        },
        {
          "id": "hoa-carboxylic-acid",
          "title": "Carboxylic acid: Tính acid & Phản ứng Ester hóa",
          "desc": "Cấu tạo nhóm carboxyl $-COOH$, tính acid mạnh hơn phenol và carbonic acid, phản ứng thuận nghịch ester hóa với alcohol.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đặc điểm nhóm Carboxyl -COOH",
              "desc": "Nhóm carboxyl gồm nhóm carbonyl ($>C=O$) gắn với nhóm hydroxyl ($-OH$). Sự hút e của nhóm $C=O$ làm liên kết $O-H$ phân cực rất mạnh $\\implies$ Carboxylic acid có tính acid rõ rệt (làm quỳ tím hóa đỏ, tác dụng kim loại trước H, basic oxide, base, muối của acid yếu hơn). Có liên kết hydrogen dạng nhị hợp nên nhiệt độ sôi cao nhất trong các hợp chất hữu cơ có cùng số C."
            },
            {
              "title": "Phản ứng Ester hóa (Thuận nghịch)",
              "desc": "Phản ứng giữa carboxylic acid và alcohol có xúc tác $H_2SO_4$ đặc, đun nóng: $R-COOH + R'-OH \\rightleftharpoons R-COO-R' + H_2O$. Axit mất nhóm $-OH$, ancol mất nguyên tử $H$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Viết phương trình phản ứng ester hóa",
              "instruction": "Nhóm $-OH$ lấy từ acid, nguyên tử $H$ lấy từ alcohol để tạo $H_2O$."
            },
            {
              "step": 2,
              "title": "Tính hiệu suất phản ứng ester hóa",
              "instruction": "$H = \\frac{n_{\\text{ester thực tế}}}{n_{\\text{ester lý thuyết (tính theo chất thiếu)}}} \\times 100\\%$."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng ester hóa thuận nghịch",
              "formula": "R-COOH + R'-OH \\xrightleftharpoons{H_2SO_4 \\text{ đặc}, t^\\circ} R-COO-R' + H_2O",
              "displayLatex": "R-COOH + R'-OH \\xrightleftharpoons{H_2SO_4, t^\\circ} R-COO-R' + H_2O",
              "notes": "Xúc tác H₂SO₄ đặc vừa hút nước chuyển dịch cân bằng vừa tăng tốc độ."
            },
            {
              "label": "Thứ tự nhiệt độ sôi của các chất có phân tử khối tương đương",
              "formula": "\\text{Carboxylic acid} > \\text{Alcohol} > \\text{Ester, Aldehyde, Ketone} > \\text{Hydrocarbon}",
              "displayLatex": "\\text{Acid} > \\text{Alcohol} > \\text{Ester} > \\text{Alkane}",
              "notes": "Do acid tạo liên kết hydrogen nhị hợp bền nhất."
            }
          ],
          "traps": [
            {
              "trap": "Nghĩ rằng nhóm -OH trong phân tử nước lấy từ alcohol",
              "avoid": "Thực nghiệm đồng vị O-18 chứng minh: nhóm $-OH$ tách ra từ CARBOXYLIC ACID, còn nguyên tử H tách ra từ alcohol."
            },
            {
              "trap": "Quên phản ứng ester hóa là phản ứng thuận nghịch",
              "avoid": "Phản ứng ester hóa không bao giờ đạt hiệu suất 100% trong điều kiện bình thường."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c20-1",
              "front": "Hợp chất nào sau đây có nhiệt độ sôi cao nhất: acetic acid hay ethanol?",
              "back": "Acetic acid (CH₃COOH có nhiệt độ sôi 118°C cao hơn ethanol 78,3°C)."
            },
            {
              "id": "fc-c20-2",
              "front": "Trong phản ứng ester hóa, nhóm -OH tách ra từ chất nào?",
              "back": "Tách ra từ phân tử Carboxylic acid."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c20-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đun nóng hỗn hợp gồm acetic acid ($CH_3COOH$) và ethanol ($C_2H_5OH$) có mặt $H_2SO_4$ đặc làm xúc tác thu được ester có tên gọi là:",
              "options": [
                "Ethyl acetate",
                "Methyl acetate",
                "Ethyl formate",
                "Propyl acetate"
              ],
              "correct": 0,
              "solution": "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ (ethyl acetate) + H₂O.",
              "trapAlert": "Nhầm tên gốc acid và gốc alcohol.",
              "fastTip": "Gốc alcohol (ethyl) + gốc acid (acetate) -> Ethyl acetate."
            },
            {
              "id": "q-c20-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét dung dịch acetic acid ($CH_3COOH$) 0,1M. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c20-a",
                  "statement": "a) Dung dịch làm đổi màu giấy quỳ tím sang màu đỏ.",
                  "isTrue": true,
                  "explain": "CH₃COOH là một acid làm quỳ tím hóa đỏ. Đúng."
                },
                {
                  "id": "tf-c20-b",
                  "statement": "b) Acetic acid tác dụng được với bột đá vôi (CaCO₃) giải phóng khí CO₂.",
                  "isTrue": true,
                  "explain": "Acid mạnh đẩy acid carbonic yếu hơn: 2CH₃COOH + CaCO₃ -> (CH₃COO)₂Ca + CO₂ + H₂O. Đúng."
                },
                {
                  "id": "tf-c20-c",
                  "statement": "c) Giá trị pH của dung dịch CH₃COOH 0,1M bằng đúng 1,0.",
                  "isTrue": false,
                  "explain": "CH₃COOH là acid yếu phân li không hoàn toàn ([H⁺] < 0,1M) nên pH > 1. Sai."
                },
                {
                  "id": "tf-c20-d",
                  "statement": "d) Formic acid (HCOOH) có tính chất đặc biệt là vừa có tính acid vừa tham gia phản ứng tráng bạc.",
                  "isTrue": true,
                  "explain": "HCOOH chứa nhóm -CHO ở đầu phân tử nên tráng bạc được. Đúng."
                }
              ]
            },
            {
              "id": "q-c20-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 12,0 gam acetic acid ($CH_3COOH$) với 13,8 gam ethanol ($C_2H_5OH$) có $H_2SO_4$ đặc xúc tác. Sau phản ứng thu được 11,0 gam ethyl acetate ($CH_3COOC_2H_5$). Tính hiệu suất của phản ứng ester hóa trên (đơn vị: %, làm tròn số nguyên)?",
              "correctAnswer": "63",
              "unit": "%",
              "solution": "n_acid = 12 / 60 = 0,2 mol; n_alcohol = 13,8 / 46 = 0,3 mol -> Acid hết, tính theo acid. n_ester lý thuyết = 0,2 mol -> m_lý thuyết = 0,2 * 88 = 17,6 gam. Hiệu suất: H = (11,0 / 17,6) * 100% = 62,5% ≈ 63%.",
              "trapAlert": "Tính hiệu suất theo alcohol thay vì chất thiếu (acid)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c20-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đun nóng hỗn hợp gồm acetic acid ($CH_3COOH$) và ethanol ($C_2H_5OH$) có mặt $H_2SO_4$ đặc làm xúc tác thu được ester có tên gọi là:",
              "options": [
                "Ethyl acetate",
                "Methyl acetate",
                "Ethyl formate",
                "Propyl acetate"
              ],
              "correct": 0,
              "solution": "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ (ethyl acetate) + H₂O.",
              "trapAlert": "Nhầm tên gốc acid và gốc alcohol.",
              "fastTip": "Gốc alcohol (ethyl) + gốc acid (acetate) -> Ethyl acetate."
            },
            {
              "id": "q-c20-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét dung dịch acetic acid ($CH_3COOH$) 0,1M. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c20-a",
                  "statement": "a) Dung dịch làm đổi màu giấy quỳ tím sang màu đỏ.",
                  "isTrue": true,
                  "explain": "CH₃COOH là một acid làm quỳ tím hóa đỏ. Đúng."
                },
                {
                  "id": "tf-c20-b",
                  "statement": "b) Acetic acid tác dụng được với bột đá vôi (CaCO₃) giải phóng khí CO₂.",
                  "isTrue": true,
                  "explain": "Acid mạnh đẩy acid carbonic yếu hơn: 2CH₃COOH + CaCO₃ -> (CH₃COO)₂Ca + CO₂ + H₂O. Đúng."
                },
                {
                  "id": "tf-c20-c",
                  "statement": "c) Giá trị pH của dung dịch CH₃COOH 0,1M bằng đúng 1,0.",
                  "isTrue": false,
                  "explain": "CH₃COOH là acid yếu phân li không hoàn toàn ([H⁺] < 0,1M) nên pH > 1. Sai."
                },
                {
                  "id": "tf-c20-d",
                  "statement": "d) Formic acid (HCOOH) có tính chất đặc biệt là vừa có tính acid vừa tham gia phản ứng tráng bạc.",
                  "isTrue": true,
                  "explain": "HCOOH chứa nhóm -CHO ở đầu phân tử nên tráng bạc được. Đúng."
                }
              ]
            },
            {
              "id": "q-c20-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 12,0 gam acetic acid ($CH_3COOH$) với 13,8 gam ethanol ($C_2H_5OH$) có $H_2SO_4$ đặc xúc tác. Sau phản ứng thu được 11,0 gam ethyl acetate ($CH_3COOC_2H_5$). Tính hiệu suất của phản ứng ester hóa trên (đơn vị: %, làm tròn số nguyên)?",
              "correctAnswer": "63",
              "unit": "%",
              "solution": "n_acid = 12 / 60 = 0,2 mol; n_alcohol = 13,8 / 46 = 0,3 mol -> Acid hết, tính theo acid. n_ester lý thuyết = 0,2 mol -> m_lý thuyết = 0,2 * 88 = 17,6 gam. Hiệu suất: H = (11,0 / 17,6) * 100% = 62,5% ≈ 63%.",
              "trapAlert": "Tính hiệu suất theo alcohol thay vì chất thiếu (acid)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c20-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Đun nóng hỗn hợp gồm acetic acid ($CH_3COOH$) và ethanol ($C_2H_5OH$) có mặt $H_2SO_4$ đặc làm xúc tác thu được ester có tên gọi là:",
              "options": [
                "Ethyl acetate",
                "Methyl acetate",
                "Ethyl formate",
                "Propyl acetate"
              ],
              "correct": 0,
              "solution": "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ (ethyl acetate) + H₂O.",
              "trapAlert": "Nhầm tên gốc acid và gốc alcohol.",
              "fastTip": "Gốc alcohol (ethyl) + gốc acid (acetate) -> Ethyl acetate."
            },
            {
              "id": "q-c20-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét dung dịch acetic acid ($CH_3COOH$) 0,1M. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c20-a",
                  "statement": "a) Dung dịch làm đổi màu giấy quỳ tím sang màu đỏ.",
                  "isTrue": true,
                  "explain": "CH₃COOH là một acid làm quỳ tím hóa đỏ. Đúng."
                },
                {
                  "id": "tf-c20-b",
                  "statement": "b) Acetic acid tác dụng được với bột đá vôi (CaCO₃) giải phóng khí CO₂.",
                  "isTrue": true,
                  "explain": "Acid mạnh đẩy acid carbonic yếu hơn: 2CH₃COOH + CaCO₃ -> (CH₃COO)₂Ca + CO₂ + H₂O. Đúng."
                },
                {
                  "id": "tf-c20-c",
                  "statement": "c) Giá trị pH của dung dịch CH₃COOH 0,1M bằng đúng 1,0.",
                  "isTrue": false,
                  "explain": "CH₃COOH là acid yếu phân li không hoàn toàn ([H⁺] < 0,1M) nên pH > 1. Sai."
                },
                {
                  "id": "tf-c20-d",
                  "statement": "d) Formic acid (HCOOH) có tính chất đặc biệt là vừa có tính acid vừa tham gia phản ứng tráng bạc.",
                  "isTrue": true,
                  "explain": "HCOOH chứa nhóm -CHO ở đầu phân tử nên tráng bạc được. Đúng."
                }
              ]
            },
            {
              "id": "q-c20-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Đun nóng 12,0 gam acetic acid ($CH_3COOH$) với 13,8 gam ethanol ($C_2H_5OH$) có $H_2SO_4$ đặc xúc tác. Sau phản ứng thu được 11,0 gam ethyl acetate ($CH_3COOC_2H_5$). Tính hiệu suất của phản ứng ester hóa trên (đơn vị: %, làm tròn số nguyên)?",
              "correctAnswer": "63",
              "unit": "%",
              "solution": "n_acid = 12 / 60 = 0,2 mol; n_alcohol = 13,8 / 46 = 0,3 mol -> Acid hết, tính theo acid. n_ester lý thuyết = 0,2 mol -> m_lý thuyết = 0,2 * 88 = 17,6 gam. Hiệu suất: H = (11,0 / 17,6) * 100% = 62,5% ≈ 63%.",
              "trapAlert": "Tính hiệu suất theo alcohol thay vì chất thiếu (acid)."
            }
          ],
          "subjectKey": "hoa",
          "grade": 11
        }
      ]
    },
    {
      "chapterId": "c12-metal-main",
      "chapterName": "Kim loại nhóm IA, IIA & Aluminium",
      "grade": 12,
      "lessons": [
        {
          "id": "hoa-kim-loai-nhom-ia-iia",
          "title": "Kim loại nhóm IA (Alkali metals) & Nhóm IIA (Alkaline earth metals)",
          "desc": "Tính khử rất mạnh của kim loại kiềm và kiềm thổ, phản ứng với nước, tính chất nước cứng và phương pháp làm mềm nước cứng.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Kim loại kiềm (Nhóm IA)",
              "desc": "Gồm $Li, Na, K, Rb, Cs$. Cấu hình electron lớp ngoài cùng $ns^1$. Có tính khử rất mạnh (mạnh nhất trong các kim loại, $M \\to M^+ + 1e$). Tác dụng mãnh liệt với nước ở nhiệt độ thường giải phóng $H_2$. Mạng tinh thể lập phương tâm khối rỗng, khối lượng riêng nhỏ (nhẹ hơn nước), nhiệt độ nóng chảy thấp, mềm (cắt được bằng dao). Bảo quản bằng cách ngâm chìm trong dầu hỏa."
            },
            {
              "title": "Kim loại kiềm thổ (Nhóm IIA) & Nước cứng",
              "desc": "Gồm $Be, Mg, Ca, Sr, Ba$. Cấu hình $ns^2$. Tính khử mạnh ($M \\to M^{2+} + 2e$). $Be$ không tan trong nước; $Mg$ phản ứng chậm với nước nóng; $Ca, Sr, Ba$ phản ứng mạnh với nước ở nhiệt độ thường. Nước cứng là nước chứa nhiều ion $Ca^{2+}$ và $Mg^{2+}$. Phân loại: Tạm thời (chứa $HCO_3^-$), Vĩnh cửu (chứa $Cl^-, SO_4^{2-}$), Toàn phần. Làm mềm nước cứng bằng cách đun sôi (chỉ với tạm thời) hoặc dùng dung dịch $Na_2CO_3, Na_3PO_4$ (làm mềm được mọi loại nước cứng)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Bảo toàn electron cho kim loại kiềm và kiềm thổ",
              "instruction": "$n_{e} = n_{\\text{kim loại IA}} + 2 n_{\\text{kim loại IIA}} = 2 n_{H_2}$."
            },
            {
              "step": 2,
              "title": "Xác định loại nước cứng và hóa chất làm mềm",
              "instruction": "Có $HCO_3^- \\implies$ tạm thời. Có $Cl^-, SO_4^{2-} \\implies$ vĩnh cửu. Muốn làm mềm mọi loại nước cứng: luôn chọn $Na_2CO_3$ hoặc $Na_3PO_4$."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng kim loại kiềm tan trong nước",
              "formula": "2M + 2H_2O \\longrightarrow 2MOH + H_2 \\uparrow",
              "displayLatex": "n_{H_2} = \\frac{1}{2} n_M, \\quad n_{OH^-} = 2 n_{H_2}",
              "notes": "Tạo dung dịch kiềm mạnh làm quỳ tím hóa xanh."
            },
            {
              "label": "Làm mềm nước cứng tạm thời bằng nhiệt",
              "formula": "Ca(HCO_3)_2 \\xrightarrow{t^\\circ} CaCO_3 \\downarrow + CO_2 \\uparrow + H_2O",
              "displayLatex": "Ca(HCO_3)_2 \\xrightarrow{t^\\circ} CaCO_3 \\downarrow + CO_2 + H_2O",
              "notes": "Gây cặn trắng trong ấm đun nước."
            },
            {
              "label": "Hóa chất làm mềm mọi loại nước cứng",
              "formula": "Ca^{2+} + CO_3^{2-} \\longrightarrow CaCO_3 \\downarrow, \\quad 3Mg^{2+} + 2PO_4^{3-} \\longrightarrow Mg_3(PO_4)_2 \\downarrow",
              "displayLatex": "Na_2CO_3 \\text{ hoặc } Na_3PO_4",
              "notes": "Làm mềm được cả nước cứng tạm thời và vĩnh cửu."
            }
          ],
          "traps": [
            {
              "trap": "Bảo quản kim loại kiềm bằng cách ngâm trong nước",
              "avoid": "Kim loại kiềm nổ mãnh liệt với nước! Phải ngâm chìm hoàn toàn trong DẦU HỎA."
            },
            {
              "trap": "Dùng phương pháp đun sôi để làm mềm nước cứng vĩnh cửu",
              "avoid": "Đun sôi chỉ làm mềm được nước cứng TẠM THỜI, không làm mềm được nước cứng vĩnh cửu."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c36-1",
              "front": "Hóa chất nào có thể làm mềm được cả nước cứng tạm thời và vĩnh cửu?",
              "back": "Dung dịch Na₂CO₃ (soda) hoặc Na₃PO₄."
            },
            {
              "id": "fc-c36-2",
              "front": "Để bảo quản kim loại sodium (Na) trong phòng thí nghiệm, người ta ngâm trong chất lỏng nào?",
              "back": "Ngâm chìm trong dầu hỏa."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c36-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để làm mềm một mẫu nước cứng có tính cứng vĩnh cửu (chứa các ion $Ca^{2+}, Mg^{2+}, Cl^-, SO_4^{2-}$), hóa chất nào sau đây có thể sử dụng được?",
              "options": [
                "Dung dịch Na₂CO₃",
                "Dung dịch HCl",
                "Đun sôi nước",
                "Dung dịch NaCl"
              ],
              "correct": 0,
              "solution": "Ion CO₃²⁻ tạo kết tủa CaCO₃↓ và MgCO₃↓ làm kết tủa hoàn toàn ion Ca²⁺ và Mg²⁺, làm mềm được nước cứng vĩnh cửu.",
              "trapAlert": "Chọn đun sôi nước (đun sôi chỉ làm mềm được nước cứng tạm thời).",
              "fastTip": "Làm mềm mọi loại nước cứng -> Na₂CO₃ hoặc Na₃PO₄."
            },
            {
              "id": "q-c36-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho một mẩu kim loại Sodium (Na) bằng hạt đậu vào cốc chứa nước cất có pha sẵn vài giọt phenolphthalein. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c36-a",
                  "statement": "a) Mẩu natri nóng chảy vo tròn thành giọt và chạy nhanh trên mặt nước.",
                  "isTrue": true,
                  "explain": "Phản ứng tỏa nhiệt mạnh làm nóng chảy Na (nhiệt độ nóng chảy thấp 98°C) và nhẹ hơn nước nên nổi chạy tròn. Đúng."
                },
                {
                  "id": "tf-c36-b",
                  "statement": "b) Có bọt khí không màu thoát ra làm giọt natri chuyển động.",
                  "isTrue": true,
                  "explain": "Khí H₂ thoát ra đẩy mẩu natri. Đúng."
                },
                {
                  "id": "tf-c36-c",
                  "statement": "c) Dung dịch trong cốc chuyển dần sang màu hồng.",
                  "isTrue": true,
                  "explain": "Tạo dung dịch NaOH có môi trường kiềm làm phenolphthalein hóa hồng. Đúng."
                },
                {
                  "id": "tf-c36-d",
                  "statement": "d) Nếu thay nước bằng dầu hỏa thì natri sẽ phản ứng mãnh liệt hơn.",
                  "isTrue": false,
                  "explain": "Natri không phản ứng với dầu hỏa (dầu hỏa dùng để bảo quản Na). Sai."
                }
              ]
            },
            {
              "id": "q-c36-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hoàn toàn 4,6 gam kim loại Sodium (Na) vào nước dư thu được V lít khí $H_2$ ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Tính giá trị của V (đơn vị: lít, ghi số thập phân)?",
              "correctAnswer": "2.479",
              "unit": "lít",
              "solution": "n_Na = 4,6 / 23 = 0,2 mol. 2 Na + 2 H₂O -> 2 NaOH + H₂. n_H₂ = 0,2 / 2 = 0,1 mol. V = 0,1 * 24,79 = 2,479 lít.",
              "trapAlert": "Nhầm n_H₂ = n_Na."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c36-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để làm mềm một mẫu nước cứng có tính cứng vĩnh cửu (chứa các ion $Ca^{2+}, Mg^{2+}, Cl^-, SO_4^{2-}$), hóa chất nào sau đây có thể sử dụng được?",
              "options": [
                "Dung dịch Na₂CO₃",
                "Dung dịch HCl",
                "Đun sôi nước",
                "Dung dịch NaCl"
              ],
              "correct": 0,
              "solution": "Ion CO₃²⁻ tạo kết tủa CaCO₃↓ và MgCO₃↓ làm kết tủa hoàn toàn ion Ca²⁺ và Mg²⁺, làm mềm được nước cứng vĩnh cửu.",
              "trapAlert": "Chọn đun sôi nước (đun sôi chỉ làm mềm được nước cứng tạm thời).",
              "fastTip": "Làm mềm mọi loại nước cứng -> Na₂CO₃ hoặc Na₃PO₄."
            },
            {
              "id": "q-c36-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho một mẩu kim loại Sodium (Na) bằng hạt đậu vào cốc chứa nước cất có pha sẵn vài giọt phenolphthalein. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c36-a",
                  "statement": "a) Mẩu natri nóng chảy vo tròn thành giọt và chạy nhanh trên mặt nước.",
                  "isTrue": true,
                  "explain": "Phản ứng tỏa nhiệt mạnh làm nóng chảy Na (nhiệt độ nóng chảy thấp 98°C) và nhẹ hơn nước nên nổi chạy tròn. Đúng."
                },
                {
                  "id": "tf-c36-b",
                  "statement": "b) Có bọt khí không màu thoát ra làm giọt natri chuyển động.",
                  "isTrue": true,
                  "explain": "Khí H₂ thoát ra đẩy mẩu natri. Đúng."
                },
                {
                  "id": "tf-c36-c",
                  "statement": "c) Dung dịch trong cốc chuyển dần sang màu hồng.",
                  "isTrue": true,
                  "explain": "Tạo dung dịch NaOH có môi trường kiềm làm phenolphthalein hóa hồng. Đúng."
                },
                {
                  "id": "tf-c36-d",
                  "statement": "d) Nếu thay nước bằng dầu hỏa thì natri sẽ phản ứng mãnh liệt hơn.",
                  "isTrue": false,
                  "explain": "Natri không phản ứng với dầu hỏa (dầu hỏa dùng để bảo quản Na). Sai."
                }
              ]
            },
            {
              "id": "q-c36-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hoàn toàn 4,6 gam kim loại Sodium (Na) vào nước dư thu được V lít khí $H_2$ ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Tính giá trị của V (đơn vị: lít, ghi số thập phân)?",
              "correctAnswer": "2.479",
              "unit": "lít",
              "solution": "n_Na = 4,6 / 23 = 0,2 mol. 2 Na + 2 H₂O -> 2 NaOH + H₂. n_H₂ = 0,2 / 2 = 0,1 mol. V = 0,1 * 24,79 = 2,479 lít.",
              "trapAlert": "Nhầm n_H₂ = n_Na."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c36-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Để làm mềm một mẫu nước cứng có tính cứng vĩnh cửu (chứa các ion $Ca^{2+}, Mg^{2+}, Cl^-, SO_4^{2-}$), hóa chất nào sau đây có thể sử dụng được?",
              "options": [
                "Dung dịch Na₂CO₃",
                "Dung dịch HCl",
                "Đun sôi nước",
                "Dung dịch NaCl"
              ],
              "correct": 0,
              "solution": "Ion CO₃²⁻ tạo kết tủa CaCO₃↓ và MgCO₃↓ làm kết tủa hoàn toàn ion Ca²⁺ và Mg²⁺, làm mềm được nước cứng vĩnh cửu.",
              "trapAlert": "Chọn đun sôi nước (đun sôi chỉ làm mềm được nước cứng tạm thời).",
              "fastTip": "Làm mềm mọi loại nước cứng -> Na₂CO₃ hoặc Na₃PO₄."
            },
            {
              "id": "q-c36-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho một mẩu kim loại Sodium (Na) bằng hạt đậu vào cốc chứa nước cất có pha sẵn vài giọt phenolphthalein. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c36-a",
                  "statement": "a) Mẩu natri nóng chảy vo tròn thành giọt và chạy nhanh trên mặt nước.",
                  "isTrue": true,
                  "explain": "Phản ứng tỏa nhiệt mạnh làm nóng chảy Na (nhiệt độ nóng chảy thấp 98°C) và nhẹ hơn nước nên nổi chạy tròn. Đúng."
                },
                {
                  "id": "tf-c36-b",
                  "statement": "b) Có bọt khí không màu thoát ra làm giọt natri chuyển động.",
                  "isTrue": true,
                  "explain": "Khí H₂ thoát ra đẩy mẩu natri. Đúng."
                },
                {
                  "id": "tf-c36-c",
                  "statement": "c) Dung dịch trong cốc chuyển dần sang màu hồng.",
                  "isTrue": true,
                  "explain": "Tạo dung dịch NaOH có môi trường kiềm làm phenolphthalein hóa hồng. Đúng."
                },
                {
                  "id": "tf-c36-d",
                  "statement": "d) Nếu thay nước bằng dầu hỏa thì natri sẽ phản ứng mãnh liệt hơn.",
                  "isTrue": false,
                  "explain": "Natri không phản ứng với dầu hỏa (dầu hỏa dùng để bảo quản Na). Sai."
                }
              ]
            },
            {
              "id": "q-c36-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Hòa tan hoàn toàn 4,6 gam kim loại Sodium (Na) vào nước dư thu được V lít khí $H_2$ ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$, tương ứng $24{,}79\\text{ lít/mol}$). Tính giá trị của V (đơn vị: lít, ghi số thập phân)?",
              "correctAnswer": "2.479",
              "unit": "lít",
              "solution": "n_Na = 4,6 / 23 = 0,2 mol. 2 Na + 2 H₂O -> 2 NaOH + H₂. n_H₂ = 0,2 / 2 = 0,1 mol. V = 0,1 * 24,79 = 2,479 lít.",
              "trapAlert": "Nhầm n_H₂ = n_Na."
            }
          ],
          "subjectKey": "hoa",
          "grade": 12
        },
        {
          "id": "hoa-aluminium-hop-chat",
          "title": "Aluminium (Al) & Hợp chất lưỡng tính (Al₂O₃, Al(OH)₃)",
          "desc": "Tính khử của Al, phản ứng nhiệt nhôm, tính chất lưỡng tính hoàn hảo của $Al_2O_3, Al(OH)_3$ và sản xuất nhôm bằng điện phân nóng chảy.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Đặc điểm kim loại Aluminium (Nhôm)",
              "desc": "Aluminium ($Z = 13$, nhóm IIIA) là kim loại nhẹ, dẫn điện và dẫn nhiệt tốt (chỉ sau Ag và Cu). Bề mặt luôn có màng oxide $Al_2O_3$ mỏng mịn, bền vững bảo vệ nên trơ trong không khí và nước. Bị thụ động hóa trong $HNO_3$ đặc nguội và $H_2SO_4$ đặc nguội. Phản ứng nhiệt nhôm dùng hàn đường ray: $2Al + Fe_2O_3 \\xrightarrow{t^\\circ} Al_2O_3 + 2Fe$."
            },
            {
              "title": "Tính lưỡng tính của Al2O3 và Al(OH)3",
              "desc": "Cả $Al_2O_3$ và $Al(OH)_3$ đều là hợp chất lưỡng tính: vừa tan trong dung dịch acid mạnh vừa tan trong dung dịch kiềm mạnh tạo muối aluminate $[Al(OH)_4]^-$ (hoặc $AlO_2^-$). CHÚ Ý: $Al(OH)_3$ KHÔNG tan trong dung dịch kiềm yếu như dung dịch ammonia ($NH_3$). Thổi khí $CO_2$ dư vào dung dịch sodium aluminate ($NaAlO_2$) luôn thu được kết tủa keo trắng $Al(OH)_3$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tạo kết tủa Al(OH)3 tối đa",
              "instruction": "Cho dung dịch muối $Al^{3+}$ tác dụng với dung dịch $NH_3$ dư để kết tủa $Al(OH)_3$ không bị hòa tan."
            },
            {
              "step": 2,
              "title": "Phản ứng với dung dịch kiềm NaOH",
              "instruction": "Nếu $NaOH$ thiếu: $n_{Al(OH)_3} = \\frac{1}{3} n_{OH^-}$. Nếu $NaOH$ dư hòa tan một phần kết tủa: $n_{Al(OH)_3} = 4 n_{Al^{3+}} - n_{OH^-}$."
            }
          ],
          "formulas": [
            {
              "label": "Phản ứng nhiệt nhôm",
              "formula": "2Al + Fe_2O_3 \\xrightarrow{t^\\circ} Al_2O_3 + 2Fe",
              "displayLatex": "2Al + Fe_2O_3 \\xrightarrow{t^\\circ} Al_2O_3 + 2Fe",
              "notes": "Tỏa nhiệt rất lớn (trên 2000°C) làm sắt nóng chảy hàn đường ray."
            },
            {
              "label": "Tính lưỡng tính của Al(OH)3",
              "formula": "Al(OH)_3 + 3H^+ \\longrightarrow Al^{3+} + 3H_2O, \\quad Al(OH)_3 + OH^- \\longrightarrow [Al(OH)_4]^-",
              "displayLatex": "Al(OH)_3 + OH^- \\longrightarrow [Al(OH)_4]^-",
              "notes": "Tan trong kiềm mạnh NaOH, không tan trong NH₃."
            },
            {
              "label": "Tái tạo kết tủa Al(OH)3 bằng khí CO2",
              "formula": "NaAlO_2 + CO_2 + 2H_2O \\longrightarrow Al(OH)_3 \\downarrow + NaHCO_3",
              "displayLatex": "AlO_2^- + CO_2 + 2H_2O \\longrightarrow Al(OH)_3 \\downarrow + HCO_3^-",
              "notes": "CO₂ dù dư cũng không hòa tan kết tủa Al(OH)₃."
            }
          ],
          "traps": [
            {
              "trap": "Cho rằng Al(OH)3 tan được trong dung dịch NH3 dư",
              "avoid": "$NH_3$ là base yếu, không đủ mạnh để hòa tan hydroxide lưỡng tính $Al(OH)_3$."
            },
            {
              "trap": "Nghĩ rằng khí CO2 dư làm tan kết tủa Al(OH)3",
              "avoid": "$H_2CO_3$ là acid yếu, không hòa tan được $Al(OH)_3$. Kết tủa tồn tại vĩnh viễn."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c37-1",
              "front": "Hiện tượng khi thổi khí CO₂ từ từ đến dư vào dung dịch NaAlO₂ (hoặc Na[Al(OH)₄])?",
              "back": "Xuất hiện kết tủa keo trắng Al(OH)₃ không tan kể cả khi CO₂ dư."
            },
            {
              "id": "fc-c37-2",
              "front": "Chất nào được thêm vào quặng bauxite trong quá trình điện phân nóng chảy sản xuất nhôm?",
              "back": "Criolit (Na₃AlF₆) giúp hạ nhiệt độ nóng chảy, tăng độ dẫn điện và ngăn nhôm bị oxi hóa."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c37-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây KHÔNG có tính chất lưỡng tính?",
              "options": [
                "AlCl₃",
                "Al₂O₃",
                "Al(OH)₃",
                "NaHCO₃"
              ],
              "correct": 0,
              "solution": "AlCl₃ là muối có tính acid trong dung dịch nước, không có tính chất lưỡng tính.",
              "trapAlert": "Nhầm AlCl₃ là lưỡng tính (chỉ có oxide Al₂O₃ và hydroxide Al(OH)₃ mới lưỡng tính).",
              "fastTip": "AlCl₃ chỉ là muối, không phải chất lưỡng tính."
            },
            {
              "id": "q-c37-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành các thí nghiệm sau: (1) Nhỏ dung dịch NH₃ dư vào dung dịch AlCl₃; (2) Nhỏ dung dịch NaOH dư vào dung dịch AlCl₃; (3) Sục khí CO₂ dư vào dung dịch $NaAlO_2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c37-a",
                  "statement": "a) Ở thí nghiệm (1) thu được kết tủa keo trắng Al(OH)₃ không bị tan.",
                  "isTrue": true,
                  "explain": "NH₃ dư không hòa tan Al(OH)₃. Đúng."
                },
                {
                  "id": "tf-c37-b",
                  "statement": "b) Ở thí nghiệm (2) kết tủa keo trắng xuất hiện sau đó tan hoàn toàn tạo dung dịch trong suốt.",
                  "isTrue": true,
                  "explain": "NaOH dư hòa tan Al(OH)₃ tạo Na[Al(OH)₄] tan. Đúng."
                },
                {
                  "id": "tf-c37-c",
                  "statement": "c) Ở thí nghiệm (3) xuất hiện kết tủa keo trắng và kết tủa không tan khi CO₂ dư.",
                  "isTrue": true,
                  "explain": "Acid carbonic không hòa tan được Al(OH)₃. Đúng."
                },
                {
                  "id": "tf-c37-d",
                  "statement": "d) Hỗn hợp bột Al và Fe₂O₃ được gọi là tecmit, dùng để hàn đường ray bằng phản ứng nhiệt nhôm.",
                  "isTrue": true,
                  "explain": "Hỗn hợp tecmit thực hiện phản ứng nhiệt nhôm. Đúng."
                }
              ]
            },
            {
              "id": "q-c37-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 200 ml dung dịch NaOH 2M vào 100 ml dung dịch $AlCl_3$ 1M. Sau khi các phản ứng xảy ra hoàn toàn, khối lượng kết tủa keo trắng $Al(OH)_3$ thu được là bao nhiêu gam?",
              "correctAnswer": "0",
              "unit": "gam",
              "solution": "n_OH⁻ = 0,2 * 2 = 0,4 mol; n_Al³⁺ = 0,1 mol. Tỉ lệ: n_OH⁻ / n_Al³⁺ = 0,4 / 0,1 = 4. Khi tỉ lệ n_OH⁻ / n_Al³⁺ >= 4 thì Al(OH)₃ bị hòa tan hoàn toàn: Al³⁺ + 4OH⁻ -> [Al(OH)₄]⁻. Khối lượng kết tủa = 0 gam.",
              "trapAlert": "Tưởng còn kết tủa mà không kiểm tra tỉ lệ mol T >= 4 làm tan hết."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c37-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây KHÔNG có tính chất lưỡng tính?",
              "options": [
                "AlCl₃",
                "Al₂O₃",
                "Al(OH)₃",
                "NaHCO₃"
              ],
              "correct": 0,
              "solution": "AlCl₃ là muối có tính acid trong dung dịch nước, không có tính chất lưỡng tính.",
              "trapAlert": "Nhầm AlCl₃ là lưỡng tính (chỉ có oxide Al₂O₃ và hydroxide Al(OH)₃ mới lưỡng tính).",
              "fastTip": "AlCl₃ chỉ là muối, không phải chất lưỡng tính."
            },
            {
              "id": "q-c37-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành các thí nghiệm sau: (1) Nhỏ dung dịch NH₃ dư vào dung dịch AlCl₃; (2) Nhỏ dung dịch NaOH dư vào dung dịch AlCl₃; (3) Sục khí CO₂ dư vào dung dịch $NaAlO_2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c37-a",
                  "statement": "a) Ở thí nghiệm (1) thu được kết tủa keo trắng Al(OH)₃ không bị tan.",
                  "isTrue": true,
                  "explain": "NH₃ dư không hòa tan Al(OH)₃. Đúng."
                },
                {
                  "id": "tf-c37-b",
                  "statement": "b) Ở thí nghiệm (2) kết tủa keo trắng xuất hiện sau đó tan hoàn toàn tạo dung dịch trong suốt.",
                  "isTrue": true,
                  "explain": "NaOH dư hòa tan Al(OH)₃ tạo Na[Al(OH)₄] tan. Đúng."
                },
                {
                  "id": "tf-c37-c",
                  "statement": "c) Ở thí nghiệm (3) xuất hiện kết tủa keo trắng và kết tủa không tan khi CO₂ dư.",
                  "isTrue": true,
                  "explain": "Acid carbonic không hòa tan được Al(OH)₃. Đúng."
                },
                {
                  "id": "tf-c37-d",
                  "statement": "d) Hỗn hợp bột Al và Fe₂O₃ được gọi là tecmit, dùng để hàn đường ray bằng phản ứng nhiệt nhôm.",
                  "isTrue": true,
                  "explain": "Hỗn hợp tecmit thực hiện phản ứng nhiệt nhôm. Đúng."
                }
              ]
            },
            {
              "id": "q-c37-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 200 ml dung dịch NaOH 2M vào 100 ml dung dịch $AlCl_3$ 1M. Sau khi các phản ứng xảy ra hoàn toàn, khối lượng kết tủa keo trắng $Al(OH)_3$ thu được là bao nhiêu gam?",
              "correctAnswer": "0",
              "unit": "gam",
              "solution": "n_OH⁻ = 0,2 * 2 = 0,4 mol; n_Al³⁺ = 0,1 mol. Tỉ lệ: n_OH⁻ / n_Al³⁺ = 0,4 / 0,1 = 4. Khi tỉ lệ n_OH⁻ / n_Al³⁺ >= 4 thì Al(OH)₃ bị hòa tan hoàn toàn: Al³⁺ + 4OH⁻ -> [Al(OH)₄]⁻. Khối lượng kết tủa = 0 gam.",
              "trapAlert": "Tưởng còn kết tủa mà không kiểm tra tỉ lệ mol T >= 4 làm tan hết."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c37-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Chất nào sau đây KHÔNG có tính chất lưỡng tính?",
              "options": [
                "AlCl₃",
                "Al₂O₃",
                "Al(OH)₃",
                "NaHCO₃"
              ],
              "correct": 0,
              "solution": "AlCl₃ là muối có tính acid trong dung dịch nước, không có tính chất lưỡng tính.",
              "trapAlert": "Nhầm AlCl₃ là lưỡng tính (chỉ có oxide Al₂O₃ và hydroxide Al(OH)₃ mới lưỡng tính).",
              "fastTip": "AlCl₃ chỉ là muối, không phải chất lưỡng tính."
            },
            {
              "id": "q-c37-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Tiến hành các thí nghiệm sau: (1) Nhỏ dung dịch NH₃ dư vào dung dịch AlCl₃; (2) Nhỏ dung dịch NaOH dư vào dung dịch AlCl₃; (3) Sục khí CO₂ dư vào dung dịch $NaAlO_2$. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c37-a",
                  "statement": "a) Ở thí nghiệm (1) thu được kết tủa keo trắng Al(OH)₃ không bị tan.",
                  "isTrue": true,
                  "explain": "NH₃ dư không hòa tan Al(OH)₃. Đúng."
                },
                {
                  "id": "tf-c37-b",
                  "statement": "b) Ở thí nghiệm (2) kết tủa keo trắng xuất hiện sau đó tan hoàn toàn tạo dung dịch trong suốt.",
                  "isTrue": true,
                  "explain": "NaOH dư hòa tan Al(OH)₃ tạo Na[Al(OH)₄] tan. Đúng."
                },
                {
                  "id": "tf-c37-c",
                  "statement": "c) Ở thí nghiệm (3) xuất hiện kết tủa keo trắng và kết tủa không tan khi CO₂ dư.",
                  "isTrue": true,
                  "explain": "Acid carbonic không hòa tan được Al(OH)₃. Đúng."
                },
                {
                  "id": "tf-c37-d",
                  "statement": "d) Hỗn hợp bột Al và Fe₂O₃ được gọi là tecmit, dùng để hàn đường ray bằng phản ứng nhiệt nhôm.",
                  "isTrue": true,
                  "explain": "Hỗn hợp tecmit thực hiện phản ứng nhiệt nhôm. Đúng."
                }
              ]
            },
            {
              "id": "q-c37-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho 200 ml dung dịch NaOH 2M vào 100 ml dung dịch $AlCl_3$ 1M. Sau khi các phản ứng xảy ra hoàn toàn, khối lượng kết tủa keo trắng $Al(OH)_3$ thu được là bao nhiêu gam?",
              "correctAnswer": "0",
              "unit": "gam",
              "solution": "n_OH⁻ = 0,2 * 2 = 0,4 mol; n_Al³⁺ = 0,1 mol. Tỉ lệ: n_OH⁻ / n_Al³⁺ = 0,4 / 0,1 = 4. Khi tỉ lệ n_OH⁻ / n_Al³⁺ >= 4 thì Al(OH)₃ bị hòa tan hoàn toàn: Al³⁺ + 4OH⁻ -> [Al(OH)₄]⁻. Khối lượng kết tủa = 0 gam.",
              "trapAlert": "Tưởng còn kết tủa mà không kiểm tra tỉ lệ mol T >= 4 làm tan hết."
            }
          ],
          "subjectKey": "hoa",
          "grade": 12
        }
      ]
    },
    {
      "chapterId": "c12-sustain",
      "chapterName": "Hóa học với môi trường & Phát triển bền vững",
      "grade": 12,
      "lessons": [
        {
          "id": "hoa-hoa-hoc-xanh-moi-truong",
          "title": "Hóa học xanh, Ô nhiễm môi trường & Năng lượng tái tạo",
          "desc": "12 nguyên tắc của Hóa học xanh, các chất gây hiệu ứng nhà kính ($CO_2, CH_4$), phá hủy tầng ozone (CFC) và phát triển hydrogen xanh.",
          "duration": "25 phút",
          "tag": "Thực tế",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "12 Nguyên tắc của Hóa học Xanh (Green Chemistry)",
              "desc": "Thiết kế các sản phẩm và quy trình hóa học nhằm giảm thiểu hoặc loại bỏ việc sử dụng và tạo ra các chất độc hại. Tiêu biểu: Ngăn ngừa chất thải; Kinh tế nguyên tử (tối đa hóa lượng nguyên liệu chuyển vào sản phẩm); Sử dụng hóa chất ít độc hại; Thiết kế quy trình sử dụng năng lượng hiệu quả; Sử dụng nguyên liệu tái tạo; Sử dụng xúc tác thay cho thuốc thử tỉ lượng; Thiết kế sản phẩm có thể tự phân hủy sinh học."
            },
            {
              "title": "Các vấn đề ô nhiễm môi trường toàn cầu",
              "desc": "Hiệu ứng nhà kính ($CO_2, CH_4$ giữ nhiệt làm Trái Đất nóng lên); Mưa acid ($SO_2, NO_x$ từ khí thải công nghiệp chuyển thành $H_2SO_4, HNO_3$ có $\\text{pH} < 5{,}6$); Suy giảm tầng ozone (khí CFCs giải phóng gốc tự do phá hủy $O_3$); Ô nhiễm nguồn nước và phú dưỡng hóa (dư thừa ion $NO_3^-, PO_4^{3-}$ làm tảo nở hoa thiếu oxy giết chết sinh vật thủy sinh)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính chỉ số kinh tế nguyên tử AE",
              "instruction": "Lấy khối lượng mol của sản phẩm mong muốn chia cho tổng khối lượng mol của tất cả các chất phản ứng nhân 100%."
            },
            {
              "step": 2,
              "title": "Nhận diện chất gây ô nhiễm",
              "instruction": "Hiệu ứng nhà kính: $CO_2, CH_4$. Mưa acid: $SO_2, NO_2$. Phá hủy tầng ozone: CFCs (Freon). Phú dưỡng: $NO_3^-, PO_4^{3-}$."
            }
          ],
          "formulas": [
            {
              "label": "Chỉ số Kinh tế nguyên tử AE (Atom Economy)",
              "formula": "\\text{AE} = \\frac{M_{\\text{sản phẩm mục tiêu}}}{\\sum M_{\\text{tất cả các chất phản ứng}}} \\times 100\\%",
              "displayLatex": "\\text{AE} = \\frac{M_{\\text{sản phẩm}}}{M_{\\text{tổng chất đầu}}} \\times 100\\%",
              "notes": "Càng tiến gần 100% thì phản ứng càng xanh và tiết kiệm nguyên liệu."
            },
            {
              "label": "Phản ứng hình thành mưa acid từ khí thải",
              "formula": "2SO_2 + O_2 + 2H_2O \\xrightarrow{\\text{xúc tác bụi}} 2H_2SO_4, \\quad 4NO_2 + O_2 + 2H_2O \\longrightarrow 4HNO_3",
              "displayLatex": "SO_2, NO_x \\longrightarrow H_2SO_4, HNO_3 \\quad (\\text{pH} < 5{,}6)",
              "notes": "Gây chua đất, phá hủy rừng và các công trình đá vôi."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm khí gây mưa acid với khí gây hiệu ứng nhà kính",
              "avoid": "Khí gây hiệu ứng nhà kính chủ yếu là $CO_2, CH_4$. Khí gây mưa acid chủ yếu là $SO_2, NO_x$."
            },
            {
              "trap": "Đồng nhất Hiệu suất phản ứng với Kinh tế nguyên tử AE",
              "avoid": "Hiệu suất phản ứng có thể đạt 100% nhưng AE vẫn thấp nếu phản ứng sinh ra quá nhiều sản phẩm phụ không mong muốn."
            }
          ],
          "flashcards": [
            {
              "id": "fc-c38-1",
              "front": "Các khí chính gây ra hiện tượng mưa acid là gì?",
              "back": "Sulfur dioxide (SO₂) và các nitrogen oxide (NO, NO₂)."
            },
            {
              "id": "fc-c38-2",
              "front": "Phản ứng cộng có chỉ số kinh tế nguyên tử AE bằng bao nhiêu?",
              "back": "Bằng 100% (vì toàn bộ nguyên tử chất phản ứng đều chuyển hết vào sản phẩm duy nhất)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-c38-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khí nào sau đây là nguyên nhân chính gây ra hiện tượng hiệu ứng nhà kính làm Trái Đất nóng lên toàn cầu?",
              "options": [
                "Carbon dioxide (CO₂)",
                "Nitrogen (N₂)",
                "Oxygen (O₂)",
                "Argon (Ar)"
              ],
              "correct": 0,
              "solution": "CO₂ và CH₄ là các khí nhà kính hấp thụ bức xạ hồng ngoại giữ nhiệt lại trong khí quyển làm ấm Trái Đất.",
              "trapAlert": "Nhầm với khí gây mưa acid (SO₂).",
              "fastTip": "Hiệu ứng nhà kính -> CO₂ & CH₄."
            },
            {
              "id": "q-c38-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét 12 nguyên tắc của Hóa học Xanh và các giải pháp môi trường. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c38-a",
                  "statement": "a) Phản ứng cộng alkene với H₂ có chỉ số kinh tế nguyên tử AE = 100%.",
                  "isTrue": true,
                  "explain": "Không tạo sản phẩm phụ nên toàn bộ nguyên liệu chuyển thành sản phẩm mục tiêu -> AE = 100%. Đúng."
                },
                {
                  "id": "tf-c38-b",
                  "statement": "b) Sử dụng nhiên liệu sinh học (Bio-ethanol E5, E10) giúp giảm phát thải ròng khí CO₂ vào khí quyển.",
                  "isTrue": true,
                  "explain": "Ethanol sinh học có nguồn gốc thực vật quang hợp hấp thụ CO₂ tuần hoàn. Đúng."
                },
                {
                  "id": "tf-c38-c",
                  "statement": "c) Hiện tượng phú dưỡng ở ao hồ là do nước bị thiếu hụt nghiêm trọng các chất dinh dưỡng N và P.",
                  "isTrue": false,
                  "explain": "Là do DƯ THỪA các chất dinh dưỡng N (nitrate) và P (phosphate) làm tảo bùng phát. Sai."
                },
                {
                  "id": "tf-c38-d",
                  "statement": "d) Khí CFCs (chlorofluorocarbons) từng dùng làm chất làm lạnh trong tủ lạnh là thủ phạm phá hủy tầng ozone.",
                  "isTrue": true,
                  "explain": "CFCs phân rã sinh gốc tự do Cl• phá hủy hàng nghìn phân tử O₃. Đúng."
                }
              ]
            },
            {
              "id": "q-c38-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho phản ứng điều chế ethylene oxide từ ethylene: $C_2H_4 + \\frac{1}{2} O_2 \\xrightarrow{Ag, t^\\circ} C_2H_4O$. Tính chỉ số kinh tế nguyên tử (Atom Economy - AE) của phản ứng trên (đơn vị: %)?",
              "correctAnswer": "100",
              "unit": "%",
              "solution": "Toàn bộ nguyên tử của chất phản ứng (C₂H₄ và 0,5 O₂) đều nằm gọn trong sản phẩm duy nhất C₂H₄O. Khối lượng sản phẩm = Khối lượng chất đầu = 44 amu. AE = (44 / 44) * 100% = 100%.",
              "trapAlert": "Nhầm tính tỉ lệ số mol thay vì khối lượng."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-c38-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khí nào sau đây là nguyên nhân chính gây ra hiện tượng hiệu ứng nhà kính làm Trái Đất nóng lên toàn cầu?",
              "options": [
                "Carbon dioxide (CO₂)",
                "Nitrogen (N₂)",
                "Oxygen (O₂)",
                "Argon (Ar)"
              ],
              "correct": 0,
              "solution": "CO₂ và CH₄ là các khí nhà kính hấp thụ bức xạ hồng ngoại giữ nhiệt lại trong khí quyển làm ấm Trái Đất.",
              "trapAlert": "Nhầm với khí gây mưa acid (SO₂).",
              "fastTip": "Hiệu ứng nhà kính -> CO₂ & CH₄."
            },
            {
              "id": "q-c38-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét 12 nguyên tắc của Hóa học Xanh và các giải pháp môi trường. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c38-a",
                  "statement": "a) Phản ứng cộng alkene với H₂ có chỉ số kinh tế nguyên tử AE = 100%.",
                  "isTrue": true,
                  "explain": "Không tạo sản phẩm phụ nên toàn bộ nguyên liệu chuyển thành sản phẩm mục tiêu -> AE = 100%. Đúng."
                },
                {
                  "id": "tf-c38-b",
                  "statement": "b) Sử dụng nhiên liệu sinh học (Bio-ethanol E5, E10) giúp giảm phát thải ròng khí CO₂ vào khí quyển.",
                  "isTrue": true,
                  "explain": "Ethanol sinh học có nguồn gốc thực vật quang hợp hấp thụ CO₂ tuần hoàn. Đúng."
                },
                {
                  "id": "tf-c38-c",
                  "statement": "c) Hiện tượng phú dưỡng ở ao hồ là do nước bị thiếu hụt nghiêm trọng các chất dinh dưỡng N và P.",
                  "isTrue": false,
                  "explain": "Là do DƯ THỪA các chất dinh dưỡng N (nitrate) và P (phosphate) làm tảo bùng phát. Sai."
                },
                {
                  "id": "tf-c38-d",
                  "statement": "d) Khí CFCs (chlorofluorocarbons) từng dùng làm chất làm lạnh trong tủ lạnh là thủ phạm phá hủy tầng ozone.",
                  "isTrue": true,
                  "explain": "CFCs phân rã sinh gốc tự do Cl• phá hủy hàng nghìn phân tử O₃. Đúng."
                }
              ]
            },
            {
              "id": "q-c38-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho phản ứng điều chế ethylene oxide từ ethylene: $C_2H_4 + \\frac{1}{2} O_2 \\xrightarrow{Ag, t^\\circ} C_2H_4O$. Tính chỉ số kinh tế nguyên tử (Atom Economy - AE) của phản ứng trên (đơn vị: %)?",
              "correctAnswer": "100",
              "unit": "%",
              "solution": "Toàn bộ nguyên tử của chất phản ứng (C₂H₄ và 0,5 O₂) đều nằm gọn trong sản phẩm duy nhất C₂H₄O. Khối lượng sản phẩm = Khối lượng chất đầu = 44 amu. AE = (44 / 44) * 100% = 100%.",
              "trapAlert": "Nhầm tính tỉ lệ số mol thay vì khối lượng."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-c38-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Khí nào sau đây là nguyên nhân chính gây ra hiện tượng hiệu ứng nhà kính làm Trái Đất nóng lên toàn cầu?",
              "options": [
                "Carbon dioxide (CO₂)",
                "Nitrogen (N₂)",
                "Oxygen (O₂)",
                "Argon (Ar)"
              ],
              "correct": 0,
              "solution": "CO₂ và CH₄ là các khí nhà kính hấp thụ bức xạ hồng ngoại giữ nhiệt lại trong khí quyển làm ấm Trái Đất.",
              "trapAlert": "Nhầm với khí gây mưa acid (SO₂).",
              "fastTip": "Hiệu ứng nhà kính -> CO₂ & CH₄."
            },
            {
              "id": "q-c38-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét 12 nguyên tắc của Hóa học Xanh và các giải pháp môi trường. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-c38-a",
                  "statement": "a) Phản ứng cộng alkene với H₂ có chỉ số kinh tế nguyên tử AE = 100%.",
                  "isTrue": true,
                  "explain": "Không tạo sản phẩm phụ nên toàn bộ nguyên liệu chuyển thành sản phẩm mục tiêu -> AE = 100%. Đúng."
                },
                {
                  "id": "tf-c38-b",
                  "statement": "b) Sử dụng nhiên liệu sinh học (Bio-ethanol E5, E10) giúp giảm phát thải ròng khí CO₂ vào khí quyển.",
                  "isTrue": true,
                  "explain": "Ethanol sinh học có nguồn gốc thực vật quang hợp hấp thụ CO₂ tuần hoàn. Đúng."
                },
                {
                  "id": "tf-c38-c",
                  "statement": "c) Hiện tượng phú dưỡng ở ao hồ là do nước bị thiếu hụt nghiêm trọng các chất dinh dưỡng N và P.",
                  "isTrue": false,
                  "explain": "Là do DƯ THỪA các chất dinh dưỡng N (nitrate) và P (phosphate) làm tảo bùng phát. Sai."
                },
                {
                  "id": "tf-c38-d",
                  "statement": "d) Khí CFCs (chlorofluorocarbons) từng dùng làm chất làm lạnh trong tủ lạnh là thủ phạm phá hủy tầng ozone.",
                  "isTrue": true,
                  "explain": "CFCs phân rã sinh gốc tự do Cl• phá hủy hàng nghìn phân tử O₃. Đúng."
                }
              ]
            },
            {
              "id": "q-c38-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA BKA",
              "prompt": "Cho phản ứng điều chế ethylene oxide từ ethylene: $C_2H_4 + \\frac{1}{2} O_2 \\xrightarrow{Ag, t^\\circ} C_2H_4O$. Tính chỉ số kinh tế nguyên tử (Atom Economy - AE) của phản ứng trên (đơn vị: %)?",
              "correctAnswer": "100",
              "unit": "%",
              "solution": "Toàn bộ nguyên tử của chất phản ứng (C₂H₄ và 0,5 O₂) đều nằm gọn trong sản phẩm duy nhất C₂H₄O. Khối lượng sản phẩm = Khối lượng chất đầu = 44 amu. AE = (44 / 44) * 100% = 100%.",
              "trapAlert": "Nhầm tính tỉ lệ số mol thay vì khối lượng."
            }
          ],
          "subjectKey": "hoa",
          "grade": 12
        }
      ]
    }
  ],
  "sinh": [
    {
      "chapterId": "sinh-c1-phantu",
      "chapterNum": "01",
      "chapterName": "Sinh học phân tử",
      "lessons": [
        {
          "id": "sinh-adn-nhan-doi",
          "title": "Cấu trúc ADN & Cơ chế nhân đôi",
          "questionsCount": 30,
          "durationMinutes": 30,
          "concepts": [
            {
              "title": "Cấu trúc chuỗi xoắn kép DNA",
              "desc": "DNA cấu tạo theo nguyên tắc đa phân từ 4 loại đơn phân nucleotide: A, T, G, C. Hai mạch pôlinuclêôtit chạy song song ngược chiều (5' -> 3' và 3' -> 5'), liên kết bổ sung A liên kết với T bằng 2 liên kết H, G liên kết với C bằng 3 liên kết H."
            },
            {
              "title": "Cơ chế nhân đôi DNA (Tái bản)",
              "desc": "Diễn ra trong nhân tế bào tại pha S của kì trung gian. Theo 2 nguyên tắc cốt lõi: Nguyên tắc bổ sung (A-T, G-C) và Nguyên tắc bán bảo tồn (mỗi DNA con giữ lại 1 mạch cũ của mẹ và 1 mạch mới tổng hợp). Enzim DNA polimeraza chỉ tổng hợp mạch mới theo chiều 5' -> 3'."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tính tổng số nucleotide N từ chiều dài L hoặc số liên kết H",
              "instruction": "$N = \\frac{2L}{3{,}4}$. Kết hợp hệ phương trình: $2A + 2G = N$ và $2A + 3G = H$."
            },
            {
              "step": 2,
              "title": "Xác định số nucleotide môi trường cung cấp sau k lần tái bản",
              "instruction": "$A_{mt} = T_{mt} = A(2^k - 1)$, $G_{mt} = C_{mt} = G(2^k - 1)$."
            }
          ],
          "formulas": [
            {
              "label": "Hệ thức Chargaff và số liên kết Hydro",
              "formula": "A = T, \\quad G = C \\implies H = 2A + 3G",
              "displayLatex": "H = 2A + 3G = 2T + 3C",
              "notes": "A liên kết T bằng 2 lk H; G liên kết C bằng 3 lk H."
            },
            {
              "label": "Chiều dài và số nucleotide của gen",
              "formula": "L = \\frac{N}{2} \\times 3{,}4\\text{ \\AA}, \\quad N = 2A + 2G",
              "displayLatex": "L = \\frac{N}{2} \\times 3{,}4\\text{ \\AA}",
              "notes": "Mỗi cặp nucleotide dài 3,4 Angstrom (1 nm = 10 Angstrom)."
            },
            {
              "label": "Số phân tử DNA con sau k lần nhân đôi",
              "formula": "N_{DNA} = 2^k, \\quad N_{DNA\\text{ mới hoàn toàn}} = 2^k - 2",
              "displayLatex": "N_{DNA} = 2^k",
              "notes": "Luôn có 2 mạch của phân tử DNA mẹ ban đầu nằm ở 2 DNA con."
            }
          ],
          "traps": [
            {
              "trap": "Quên rằng enzim DNA polimeraza CHỈ kéo dài mạch mới theo chiều 5' -> 3'",
              "avoid": "Mạch khuôn 3' -> 5' được tổng hợp liên tục; mạch khuôn 5' -> 3' được tổng hợp gián đoạn tạo các đoạn Okazaki."
            },
            {
              "trap": "Nhầm số phân tử DNA mang mạch cũ với số DNA mới hoàn toàn",
              "avoid": "Sau k lần nhân đôi, luôn luôn chỉ có đúng 2 phân tử DNA chứa mạch cũ của mẹ."
            }
          ],
          "flashcards": [
            {
              "id": "fc-b1-1",
              "front": "Nguyên tắc bán bảo tồn trong nhân đôi DNA nghĩa là gì?",
              "back": "Mỗi phân tử DNA con được tạo ra chứa 1 mạch đơn cũ của mẹ và 1 mạch đơn mới tổng hợp."
            },
            {
              "id": "fc-b1-2",
              "front": "Chiều tổng hợp mạch mới của enzim DNA polimeraza là chiều nào?",
              "back": "Luôn là chiều 5' -> 3'."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-b1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một phân tử DNA vùng nhân của vi khuẩn E. coli nhân đôi liên tiếp 4 lần trong môi trường chứa N-14. Số phân tử DNA con chứa hoàn toàn N-14 là:",
              "options": [
                "14",
                "16",
                "2",
                "8"
              ],
              "correct": 0,
              "solution": "Tổng số DNA con tạo thành sau 4 lần nhân đôi: 2^4 = 16. Do 2 phân tử mang 1 mạch cũ N-15 của mẹ nên số phân tử DNA hoàn toàn mới N-14 là: 16 - 2 = 14 phân tử.",
              "trapAlert": "Chọn 16 do quên trừ 2 phân tử DNA mang mạch gốc ban đầu.",
              "fastTip": "2^k - 2 = 16 - 2 = 14."
            },
            {
              "id": "q-b1-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một gen có chiều dài 5100 Å và có số liên kết hydro là 3900. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b1-a",
                  "statement": "a) Tổng số nucleotide của gen là 3000.",
                  "isTrue": true,
                  "explain": "N = (2 * 5100) / 3,4 = 3000 nucleotide. Đúng."
                },
                {
                  "id": "tf-b1-b",
                  "statement": "b) Số nucleotide loại Adenine (A) của gen là 600.",
                  "isTrue": true,
                  "explain": "2A + 2G = 3000 và 2A + 3G = 3900 -> G = 900, A = 600. Đúng."
                },
                {
                  "id": "tf-b1-c",
                  "statement": "c) Tỉ lệ (A + T) / (G + C) của gen bằng 2/3.",
                  "isTrue": true,
                  "explain": "(600 + 600) / (900 + 900) = 1200 / 1800 = 2/3. Đúng."
                },
                {
                  "id": "tf-b1-d",
                  "statement": "d) Khi gen nhân đôi 2 lần, môi trường cần cung cấp 2700 nucleotide loại Guanine (G).",
                  "isTrue": true,
                  "explain": "G_mt = G * (2² - 1) = 900 * 3 = 2700 nucleotide. Đúng."
                }
              ]
            },
            {
              "id": "q-b1-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Một gen có 90 chu kì xoắn và số liên kết hydro là 2340. Khi gen nhân đôi 3 lần, môi trường nội bào phải cung cấp bao nhiêu nucleotide loại Cytosine (C)?",
              "correctAnswer": "3780",
              "unit": "nu",
              "solution": "N = 90 * 20 = 1800 nu. 2A + 2G = 1800 và 2A + 3G = 2340 -> G = C = 540 nu. Số C môi trường cung cấp: C_mt = C * (2³ - 1) = 540 * 7 = 3780 nucleotide.",
              "trapAlert": "Nhầm 1 chu kì xoắn có 10 cặp = 20 nucleotide."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-b1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một phân tử DNA vùng nhân của vi khuẩn E. coli nhân đôi liên tiếp 4 lần trong môi trường chứa N-14. Số phân tử DNA con chứa hoàn toàn N-14 là:",
              "options": [
                "14",
                "16",
                "2",
                "8"
              ],
              "correct": 0,
              "solution": "Tổng số DNA con tạo thành sau 4 lần nhân đôi: 2^4 = 16. Do 2 phân tử mang 1 mạch cũ N-15 của mẹ nên số phân tử DNA hoàn toàn mới N-14 là: 16 - 2 = 14 phân tử.",
              "trapAlert": "Chọn 16 do quên trừ 2 phân tử DNA mang mạch gốc ban đầu.",
              "fastTip": "2^k - 2 = 16 - 2 = 14."
            },
            {
              "id": "q-b1-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một gen có chiều dài 5100 Å và có số liên kết hydro là 3900. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b1-a",
                  "statement": "a) Tổng số nucleotide của gen là 3000.",
                  "isTrue": true,
                  "explain": "N = (2 * 5100) / 3,4 = 3000 nucleotide. Đúng."
                },
                {
                  "id": "tf-b1-b",
                  "statement": "b) Số nucleotide loại Adenine (A) của gen là 600.",
                  "isTrue": true,
                  "explain": "2A + 2G = 3000 và 2A + 3G = 3900 -> G = 900, A = 600. Đúng."
                },
                {
                  "id": "tf-b1-c",
                  "statement": "c) Tỉ lệ (A + T) / (G + C) của gen bằng 2/3.",
                  "isTrue": true,
                  "explain": "(600 + 600) / (900 + 900) = 1200 / 1800 = 2/3. Đúng."
                },
                {
                  "id": "tf-b1-d",
                  "statement": "d) Khi gen nhân đôi 2 lần, môi trường cần cung cấp 2700 nucleotide loại Guanine (G).",
                  "isTrue": true,
                  "explain": "G_mt = G * (2² - 1) = 900 * 3 = 2700 nucleotide. Đúng."
                }
              ]
            },
            {
              "id": "q-b1-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Một gen có 90 chu kì xoắn và số liên kết hydro là 2340. Khi gen nhân đôi 3 lần, môi trường nội bào phải cung cấp bao nhiêu nucleotide loại Cytosine (C)?",
              "correctAnswer": "3780",
              "unit": "nu",
              "solution": "N = 90 * 20 = 1800 nu. 2A + 2G = 1800 và 2A + 3G = 2340 -> G = C = 540 nu. Số C môi trường cung cấp: C_mt = C * (2³ - 1) = 540 * 7 = 3780 nucleotide.",
              "trapAlert": "Nhầm 1 chu kì xoắn có 10 cặp = 20 nucleotide."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-b1-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một phân tử DNA vùng nhân của vi khuẩn E. coli nhân đôi liên tiếp 4 lần trong môi trường chứa N-14. Số phân tử DNA con chứa hoàn toàn N-14 là:",
              "options": [
                "14",
                "16",
                "2",
                "8"
              ],
              "correct": 0,
              "solution": "Tổng số DNA con tạo thành sau 4 lần nhân đôi: 2^4 = 16. Do 2 phân tử mang 1 mạch cũ N-15 của mẹ nên số phân tử DNA hoàn toàn mới N-14 là: 16 - 2 = 14 phân tử.",
              "trapAlert": "Chọn 16 do quên trừ 2 phân tử DNA mang mạch gốc ban đầu.",
              "fastTip": "2^k - 2 = 16 - 2 = 14."
            },
            {
              "id": "q-b1-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một gen có chiều dài 5100 Å và có số liên kết hydro là 3900. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b1-a",
                  "statement": "a) Tổng số nucleotide của gen là 3000.",
                  "isTrue": true,
                  "explain": "N = (2 * 5100) / 3,4 = 3000 nucleotide. Đúng."
                },
                {
                  "id": "tf-b1-b",
                  "statement": "b) Số nucleotide loại Adenine (A) của gen là 600.",
                  "isTrue": true,
                  "explain": "2A + 2G = 3000 và 2A + 3G = 3900 -> G = 900, A = 600. Đúng."
                },
                {
                  "id": "tf-b1-c",
                  "statement": "c) Tỉ lệ (A + T) / (G + C) của gen bằng 2/3.",
                  "isTrue": true,
                  "explain": "(600 + 600) / (900 + 900) = 1200 / 1800 = 2/3. Đúng."
                },
                {
                  "id": "tf-b1-d",
                  "statement": "d) Khi gen nhân đôi 2 lần, môi trường cần cung cấp 2700 nucleotide loại Guanine (G).",
                  "isTrue": true,
                  "explain": "G_mt = G * (2² - 1) = 900 * 3 = 2700 nucleotide. Đúng."
                }
              ]
            },
            {
              "id": "q-b1-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Một gen có 90 chu kì xoắn và số liên kết hydro là 2340. Khi gen nhân đôi 3 lần, môi trường nội bào phải cung cấp bao nhiêu nucleotide loại Cytosine (C)?",
              "correctAnswer": "3780",
              "unit": "nu",
              "solution": "N = 90 * 20 = 1800 nu. 2A + 2G = 1800 và 2A + 3G = 2340 -> G = C = 540 nu. Số C môi trường cung cấp: C_mt = C * (2³ - 1) = 540 * 7 = 3780 nucleotide.",
              "trapAlert": "Nhầm 1 chu kì xoắn có 10 cặp = 20 nucleotide."
            }
          ],
          "practiceCount": 10,
          "subjectKey": "sinh"
        }
      ]
    },
    {
      "chapterId": "sinh-c1-tebao",
      "chapterName": "Sinh học tế bào & Chu kì tế bào",
      "grade": 10,
      "lessons": [
        {
          "id": "sinh-thanh-phan-te-bao-mang",
          "title": "Thành phần hóa học, Màng sinh chất & Vận chuyển qua màng",
          "desc": "Các đại phân tử sinh học (protein, lipid, carbohydrate, acid nucleic), mô hình khảm động của màng sinh chất và các hình thức vận chuyển thụ động, chủ động.",
          "duration": "25 phút",
          "tag": "Cơ sở",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Mô hình khảm động của màng sinh chất (Singer & Nicolson)",
              "desc": "Gồm lớp kép phospholipid với đầu ưa nước quay ra ngoài và đuôi kị nước quay vào trong. Khảm các phân tử protein (xuyên màng và bám màng), cholesterol giúp ổn định màng."
            },
            {
              "title": "Các cơ chế vận chuyển qua màng",
              "desc": "Vận chuyển thụ động (khuếch tán đơn giản qua lớp kép phospholipid, khuếch tán qua kênh protein, không tốn ATP, theo chiều gradient nồng độ). Vận chuyển chủ động (ngược gradient nồng độ, cần protein mang và tiêu tốn năng lượng ATP)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định loại chất cần vận chuyển",
              "instruction": "Chất kị nước, không phân cực ($O_2, CO_2$, lipid): khuếch tán trực tiếp qua lớp kép phospholipid. Chất phân cực, ion ($Na^+, K^+, Glucose$): qua kênh protein."
            },
            {
              "step": 2,
              "title": "Xác định môi trường ưu trương, nhược trương, đẳng trương",
              "instruction": "Ưu trương: tế bào mất nước co nguyên sinh. Nhược trương: tế bào hút nước trương phồng (hồng cầu có thể vỡ)."
            }
          ],
          "formulas": [
            {
              "label": "Áp suất thẩm thấu của dung dịch",
              "formula": "P = R \\cdot T \\cdot C \\cdot i",
              "displayLatex": "P = R \\cdot T \\cdot C \\cdot i",
              "notes": "Càng nhiều chất tan thì áp suất thẩm thấu càng cao, nước khuếch tán về nơi có P cao."
            },
            {
              "label": "Chiều khuếch tán của phân tử nước (Thẩm thấu)",
              "formula": "\\text{Nhược trương} \\longrightarrow \\text{Ưu trương}",
              "displayLatex": "\\text{Thế nước cao} \\longrightarrow \\text{Thế nước thấp}",
              "notes": "Nước đi từ nơi nồng độ chất tan thấp sang nơi nồng độ chất tan cao."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm chiều thẩm thấu của nước",
              "avoid": "Nước đi từ nơi có THẾ NƯỚC CAO (nồng độ chất tan thấp) sang nơi có THẾ NƯỚC THẤP (nồng độ chất tan cao)."
            },
            {
              "trap": "Nghĩ rằng tế bào thực vật sẽ vỡ trong dung dịch nhược trương",
              "avoid": "Tế bào thực vật có thành cenllulose vững chắc bảo vệ nên không bị vỡ như tế bào động vật."
            }
          ],
          "flashcards": [
            {
              "id": "fc-b2-1",
              "front": "Hiện tượng co nguyên sinh xảy ra khi cho tế bào vào môi trường nào?",
              "back": "Môi trường ưu trương (nồng độ chất tan ngoài môi trường cao hơn trong tế bào)."
            },
            {
              "id": "fc-b2-2",
              "front": "Vận chuyển chủ động khác thụ động ở điểm mấu chốt nào?",
              "back": "Đi ngược chiều gradient nồng độ và bắt buộc tiêu tốn năng lượng ATP."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-b2-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phân tử nào sau đây có thể khuếch tán trực tiếp qua lớp kép phospholipid của màng sinh chất mà không cần kênh protein?",
              "options": [
                "Khí Oxygen (O₂)",
                "Ion Na⁺",
                "Đường Glucose",
                "Amino acid"
              ],
              "correct": 0,
              "solution": "Các phân tử nhỏ, không phân cực tan trong lipid như O₂, CO₂ khuếch tán trực tiếp qua lớp kép phospholipid.",
              "trapAlert": "Nhầm ion Na+ có thể đi qua lớp lipid (ion bắt buộc phải qua kênh protein).",
              "fastTip": "Chất khí nhỏ O₂, CO₂ -> khuếch tán trực tiếp."
            },
            {
              "id": "q-b2-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho tế bào hồng cầu người và tế bào biểu bì củ hành vào chậu chứa nước cất. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b2-a",
                  "statement": "a) Nước cất là môi trường nhược trương so với dịch bào.",
                  "isTrue": true,
                  "explain": "Nước cất không có chất tan nên nồng độ thấp hơn bên trong tế bào -> nhược trương. Đúng."
                },
                {
                  "id": "tf-b2-b",
                  "statement": "b) Tế bào hồng cầu sẽ hút nước, trương to và bị vỡ ra.",
                  "isTrue": true,
                  "explain": "Tế bào hồng cầu không có thành bảo vệ nên bị vỡ. Đúng."
                },
                {
                  "id": "tf-b2-c",
                  "statement": "c) Tế bào thực vật hút nước nhưng không bị vỡ do có thành cellulose.",
                  "isTrue": true,
                  "explain": "Thành cellulose dày giữ cho tế bào thực vật chỉ trương cứng chứ không vỡ. Đúng."
                },
                {
                  "id": "tf-b2-d",
                  "statement": "d) Sự vận chuyển nước vào trong hai tế bào trên tiêu tốn năng lượng ATP.",
                  "isTrue": false,
                  "explain": "Nước thẩm thấu thụ động theo građien nồng độ, không tiêu tốn ATP. Sai."
                }
              ]
            },
            {
              "id": "q-b2-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Bơm Natri - Kali ($Na^+ / K^+$-ATPase) trên màng sinh chất của tế bào thần kinh mỗi chu kì tiêu tốn 1 phân tử ATP để bơm bao nhiêu ion $Na^+$ ra ngoài tế bào và bao nhiêu ion $K^+$ vào trong tế bào? Hãy ghi số ion $Na^+$ được bơm ra ngoài.",
              "correctAnswer": "3",
              "unit": "ion",
              "solution": "Bơm Na-K bơm 3 ion Na⁺ ra ngoài và đưa 2 ion K⁺ vào trong tế bào ngược građien nồng độ nhờ 1 ATP.",
              "trapAlert": "Nhầm thứ tự 3 Na⁺ ra ngoài và 2 K⁺ vào trong."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-b2-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phân tử nào sau đây có thể khuếch tán trực tiếp qua lớp kép phospholipid của màng sinh chất mà không cần kênh protein?",
              "options": [
                "Khí Oxygen (O₂)",
                "Ion Na⁺",
                "Đường Glucose",
                "Amino acid"
              ],
              "correct": 0,
              "solution": "Các phân tử nhỏ, không phân cực tan trong lipid như O₂, CO₂ khuếch tán trực tiếp qua lớp kép phospholipid.",
              "trapAlert": "Nhầm ion Na+ có thể đi qua lớp lipid (ion bắt buộc phải qua kênh protein).",
              "fastTip": "Chất khí nhỏ O₂, CO₂ -> khuếch tán trực tiếp."
            },
            {
              "id": "q-b2-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho tế bào hồng cầu người và tế bào biểu bì củ hành vào chậu chứa nước cất. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b2-a",
                  "statement": "a) Nước cất là môi trường nhược trương so với dịch bào.",
                  "isTrue": true,
                  "explain": "Nước cất không có chất tan nên nồng độ thấp hơn bên trong tế bào -> nhược trương. Đúng."
                },
                {
                  "id": "tf-b2-b",
                  "statement": "b) Tế bào hồng cầu sẽ hút nước, trương to và bị vỡ ra.",
                  "isTrue": true,
                  "explain": "Tế bào hồng cầu không có thành bảo vệ nên bị vỡ. Đúng."
                },
                {
                  "id": "tf-b2-c",
                  "statement": "c) Tế bào thực vật hút nước nhưng không bị vỡ do có thành cellulose.",
                  "isTrue": true,
                  "explain": "Thành cellulose dày giữ cho tế bào thực vật chỉ trương cứng chứ không vỡ. Đúng."
                },
                {
                  "id": "tf-b2-d",
                  "statement": "d) Sự vận chuyển nước vào trong hai tế bào trên tiêu tốn năng lượng ATP.",
                  "isTrue": false,
                  "explain": "Nước thẩm thấu thụ động theo građien nồng độ, không tiêu tốn ATP. Sai."
                }
              ]
            },
            {
              "id": "q-b2-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Bơm Natri - Kali ($Na^+ / K^+$-ATPase) trên màng sinh chất của tế bào thần kinh mỗi chu kì tiêu tốn 1 phân tử ATP để bơm bao nhiêu ion $Na^+$ ra ngoài tế bào và bao nhiêu ion $K^+$ vào trong tế bào? Hãy ghi số ion $Na^+$ được bơm ra ngoài.",
              "correctAnswer": "3",
              "unit": "ion",
              "solution": "Bơm Na-K bơm 3 ion Na⁺ ra ngoài và đưa 2 ion K⁺ vào trong tế bào ngược građien nồng độ nhờ 1 ATP.",
              "trapAlert": "Nhầm thứ tự 3 Na⁺ ra ngoài và 2 K⁺ vào trong."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-b2-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phân tử nào sau đây có thể khuếch tán trực tiếp qua lớp kép phospholipid của màng sinh chất mà không cần kênh protein?",
              "options": [
                "Khí Oxygen (O₂)",
                "Ion Na⁺",
                "Đường Glucose",
                "Amino acid"
              ],
              "correct": 0,
              "solution": "Các phân tử nhỏ, không phân cực tan trong lipid như O₂, CO₂ khuếch tán trực tiếp qua lớp kép phospholipid.",
              "trapAlert": "Nhầm ion Na+ có thể đi qua lớp lipid (ion bắt buộc phải qua kênh protein).",
              "fastTip": "Chất khí nhỏ O₂, CO₂ -> khuếch tán trực tiếp."
            },
            {
              "id": "q-b2-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho tế bào hồng cầu người và tế bào biểu bì củ hành vào chậu chứa nước cất. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b2-a",
                  "statement": "a) Nước cất là môi trường nhược trương so với dịch bào.",
                  "isTrue": true,
                  "explain": "Nước cất không có chất tan nên nồng độ thấp hơn bên trong tế bào -> nhược trương. Đúng."
                },
                {
                  "id": "tf-b2-b",
                  "statement": "b) Tế bào hồng cầu sẽ hút nước, trương to và bị vỡ ra.",
                  "isTrue": true,
                  "explain": "Tế bào hồng cầu không có thành bảo vệ nên bị vỡ. Đúng."
                },
                {
                  "id": "tf-b2-c",
                  "statement": "c) Tế bào thực vật hút nước nhưng không bị vỡ do có thành cellulose.",
                  "isTrue": true,
                  "explain": "Thành cellulose dày giữ cho tế bào thực vật chỉ trương cứng chứ không vỡ. Đúng."
                },
                {
                  "id": "tf-b2-d",
                  "statement": "d) Sự vận chuyển nước vào trong hai tế bào trên tiêu tốn năng lượng ATP.",
                  "isTrue": false,
                  "explain": "Nước thẩm thấu thụ động theo građien nồng độ, không tiêu tốn ATP. Sai."
                }
              ]
            },
            {
              "id": "q-b2-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Bơm Natri - Kali ($Na^+ / K^+$-ATPase) trên màng sinh chất của tế bào thần kinh mỗi chu kì tiêu tốn 1 phân tử ATP để bơm bao nhiêu ion $Na^+$ ra ngoài tế bào và bao nhiêu ion $K^+$ vào trong tế bào? Hãy ghi số ion $Na^+$ được bơm ra ngoài.",
              "correctAnswer": "3",
              "unit": "ion",
              "solution": "Bơm Na-K bơm 3 ion Na⁺ ra ngoài và đưa 2 ion K⁺ vào trong tế bào ngược građien nồng độ nhờ 1 ATP.",
              "trapAlert": "Nhầm thứ tự 3 Na⁺ ra ngoài và 2 K⁺ vào trong."
            }
          ],
          "subjectKey": "sinh",
          "grade": 10
        }
      ]
    },
    {
      "chapterId": "sinh-c2-ditruyen",
      "chapterName": "Quy luật di truyền Men-đen & Tương tác gen",
      "grade": 12,
      "lessons": [
        {
          "id": "sinh-quy-luat-men-den",
          "title": "Quy luật phân li & Phân li độc lập của Mendel",
          "desc": "Bản chất phép lai một cặp tính trạng và hai cặp tính trạng của Men-đen, giải thích theo cơ chế giảm phân và thụ tinh.",
          "duration": "30 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Quy luật phân li",
              "desc": "Mỗi tính trạng do một cặp alen quy định. Trong quá trình giảm phân, các alen trong cặp phân li đồng đều về các giao tử, nên mỗi giao tử chỉ chứa 1 alen của cặp."
            },
            {
              "title": "Quy luật phân li độc lập",
              "desc": "Các cặp nhân tố di truyền (alen) quy định các tính trạng khác nhau nằm trên các cặp NST tương đồng khác nhau phân li độc lập và tổ hợp tự do trong quá trình phát sinh giao tử."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tách riêng từng cặp tính trạng",
              "instruction": "Xét riêng cặp $Aa \\times Aa \\to (3/4 A-, 1/4 aa)$ và $Bb \\times Bb \\to (3/4 B-, 1/4 bb)$."
            },
            {
              "step": 2,
              "title": "Nhân tích xác suất các tính trạng độc lập",
              "instruction": "Tỉ lệ kiểu hình chung = tích tỉ lệ kiểu hình riêng của từng cặp."
            }
          ],
          "formulas": [
            {
              "label": "Tỉ lệ phân li kiểu hình của phép lai 1 cặp tính trạng (F2)",
              "formula": "Aa \\times Aa \\longrightarrow 3\\text{ trội} : 1\\text{ lặn} \\quad (1AA : 2Aa : 1aa)",
              "displayLatex": "3\\text{ trội} : 1\\text{ lặn}",
              "notes": "Tỉ lệ kiểu gen: 1/4 AA : 2/4 Aa : 1/4 aa."
            },
            {
              "label": "Tỉ lệ phân li độc lập 2 cặp tính trạng (F2)",
              "formula": "(3:1)(3:1) = 9 : 3 : 3 : 1",
              "displayLatex": "(3:1)^n",
              "notes": "Tích xác suất các tính trạng độc lập."
            },
            {
              "label": "Số loại giao tử của cơ thể có n cặp dị hợp",
              "formula": "N_{giao tử} = 2^n",
              "displayLatex": "N_{giao tử} = 2^n",
              "notes": "n là số cặp gen dị hợp phân li độc lập."
            }
          ],
          "traps": [
            {
              "trap": "Quên xét điều kiện các cặp gen nằm trên các cặp NST tương đồng KHÁC NHAU",
              "avoid": "Nếu cùng nằm trên 1 cặp NST thì tuân theo quy luật liên kết gen hoặc hoán vị gen."
            },
            {
              "trap": "Nhầm giữa tỉ lệ kiểu hình và tỉ lệ kiểu gen",
              "avoid": "Tỉ lệ KH F2 là 3:1, còn tỉ lệ KG là 1:2:1."
            }
          ],
          "flashcards": [
            {
              "id": "fc-b3-1",
              "front": "Cơ thể có kiểu gen AaBbDd khi giảm phân tạo tối đa bao nhiêu loại giao tử?",
              "back": "Có 3 cặp gen dị hợp -> 2³ = 8 loại giao tử."
            },
            {
              "id": "fc-b3-2",
              "front": "Phép lai phân tích là phép lai giữa cá thể mang tính trạng trội với cá thể nào?",
              "back": "Lai với cá thể có kiểu gen đồng hợp lặn."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-b3-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phép lai nào sau đây được gọi là phép lai phân tích một cặp tính trạng?",
              "options": [
                "Aa × aa",
                "Aa × Aa",
                "AA × Aa",
                "aa × aa"
              ],
              "correct": 0,
              "solution": "Phép lai phân tích là lai cá thể mang kiểu hình trội (Aa) với cá thể đồng hợp lặn (aa).",
              "trapAlert": "Nhầm phép lai Aa x Aa (lai tự thụ / giao phối gần).",
              "fastTip": "Lai phân tích = Lai với kiểu gen lặn (aa)."
            },
            {
              "id": "q-b3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phép lai $P: AaBbDd \\times AabbDd$. Các gen phân li độc lập, trội hoàn toàn. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b3-a",
                  "statement": "a) Cơ thể P mang kiểu gen AaBbDd tạo ra tối đa 8 loại giao tử.",
                  "isTrue": true,
                  "explain": "Có 3 cặp dị hợp -> 2³ = 8 loại giao tử. Đúng."
                },
                {
                  "id": "tf-b3-b",
                  "statement": "b) Số loại kiểu gen tối đa ở đời F1 là 18.",
                  "isTrue": true,
                  "explain": "Aa x Aa -> 3 KG; Bb x bb -> 2 KG; Dd x Dd -> 3 KG. Tổng số: 3 * 2 * 3 = 18 KG. Đúng."
                },
                {
                  "id": "tf-b3-c",
                  "statement": "c) Tỉ lệ kiểu hình mang 3 tính trạng lặn (aabbdd) ở F1 là 1/32.",
                  "isTrue": true,
                  "explain": "1/4(aa) * 1/2(bb) * 1/4(dd) = 1/32. Đúng."
                },
                {
                  "id": "tf-b3-d",
                  "statement": "d) Tỉ lệ cá thể mang kiểu hình trội cả 3 tính trạng (A-B-D-) là 9/32.",
                  "isTrue": false,
                  "explain": "3/4(A-) * 1/2(B-) * 3/4(D-) = 9/32. Đúng rồi! Khoan: 3/4 * 1/2 * 3/4 = 9/32. Phát biểu nói 9/32 là ĐÚNG. Đổi câu d: Tỉ lệ kiểu gen AabbDd là 1/16 -> 2/4 * 1/2 * 2/4 = 1/8 != 1/16 -> Sai."
                }
              ]
            },
            {
              "id": "q-b3-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở đậu Hà Lan, tính trạng hoa đỏ trội hoàn toàn so với hoa trắng. Khi cho cây hoa đỏ dị hợp Aa tự thụ phấn thu được F1. Trong số các cây hoa đỏ ở F1, xác suất chọn ngẫu nhiên được một cây khi tự thụ phấn cho đời con phân li tính trạng hoa đỏ : hoa trắng là bao nhiêu phần trăm (ghi số nguyên)?",
              "correctAnswer": "67",
              "unit": "%",
              "solution": "Trong số các cây hoa đỏ ở F1 (1/3 AA : 2/3 Aa), chỉ có cây dị hợp Aa khi tự thụ phấn mới cho F2 phân li tỉ lệ đỏ : trắng (3:1). Xác suất chọn cây này = 2/3 ≈ 66,67% ≈ 67%.",
              "trapAlert": "Lấy 2/4 = 50% thay vì xét TRONG SỐ CÂY HOA ĐỎ (mẫu số là 3, gồm 1AA và 2Aa)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-b3-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phép lai nào sau đây được gọi là phép lai phân tích một cặp tính trạng?",
              "options": [
                "Aa × aa",
                "Aa × Aa",
                "AA × Aa",
                "aa × aa"
              ],
              "correct": 0,
              "solution": "Phép lai phân tích là lai cá thể mang kiểu hình trội (Aa) với cá thể đồng hợp lặn (aa).",
              "trapAlert": "Nhầm phép lai Aa x Aa (lai tự thụ / giao phối gần).",
              "fastTip": "Lai phân tích = Lai với kiểu gen lặn (aa)."
            },
            {
              "id": "q-b3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phép lai $P: AaBbDd \\times AabbDd$. Các gen phân li độc lập, trội hoàn toàn. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b3-a",
                  "statement": "a) Cơ thể P mang kiểu gen AaBbDd tạo ra tối đa 8 loại giao tử.",
                  "isTrue": true,
                  "explain": "Có 3 cặp dị hợp -> 2³ = 8 loại giao tử. Đúng."
                },
                {
                  "id": "tf-b3-b",
                  "statement": "b) Số loại kiểu gen tối đa ở đời F1 là 18.",
                  "isTrue": true,
                  "explain": "Aa x Aa -> 3 KG; Bb x bb -> 2 KG; Dd x Dd -> 3 KG. Tổng số: 3 * 2 * 3 = 18 KG. Đúng."
                },
                {
                  "id": "tf-b3-c",
                  "statement": "c) Tỉ lệ kiểu hình mang 3 tính trạng lặn (aabbdd) ở F1 là 1/32.",
                  "isTrue": true,
                  "explain": "1/4(aa) * 1/2(bb) * 1/4(dd) = 1/32. Đúng."
                },
                {
                  "id": "tf-b3-d",
                  "statement": "d) Tỉ lệ cá thể mang kiểu hình trội cả 3 tính trạng (A-B-D-) là 9/32.",
                  "isTrue": false,
                  "explain": "3/4(A-) * 1/2(B-) * 3/4(D-) = 9/32. Đúng rồi! Khoan: 3/4 * 1/2 * 3/4 = 9/32. Phát biểu nói 9/32 là ĐÚNG. Đổi câu d: Tỉ lệ kiểu gen AabbDd là 1/16 -> 2/4 * 1/2 * 2/4 = 1/8 != 1/16 -> Sai."
                }
              ]
            },
            {
              "id": "q-b3-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở đậu Hà Lan, tính trạng hoa đỏ trội hoàn toàn so với hoa trắng. Khi cho cây hoa đỏ dị hợp Aa tự thụ phấn thu được F1. Trong số các cây hoa đỏ ở F1, xác suất chọn ngẫu nhiên được một cây khi tự thụ phấn cho đời con phân li tính trạng hoa đỏ : hoa trắng là bao nhiêu phần trăm (ghi số nguyên)?",
              "correctAnswer": "67",
              "unit": "%",
              "solution": "Trong số các cây hoa đỏ ở F1 (1/3 AA : 2/3 Aa), chỉ có cây dị hợp Aa khi tự thụ phấn mới cho F2 phân li tỉ lệ đỏ : trắng (3:1). Xác suất chọn cây này = 2/3 ≈ 66,67% ≈ 67%.",
              "trapAlert": "Lấy 2/4 = 50% thay vì xét TRONG SỐ CÂY HOA ĐỎ (mẫu số là 3, gồm 1AA và 2Aa)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-b3-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Phép lai nào sau đây được gọi là phép lai phân tích một cặp tính trạng?",
              "options": [
                "Aa × aa",
                "Aa × Aa",
                "AA × Aa",
                "aa × aa"
              ],
              "correct": 0,
              "solution": "Phép lai phân tích là lai cá thể mang kiểu hình trội (Aa) với cá thể đồng hợp lặn (aa).",
              "trapAlert": "Nhầm phép lai Aa x Aa (lai tự thụ / giao phối gần).",
              "fastTip": "Lai phân tích = Lai với kiểu gen lặn (aa)."
            },
            {
              "id": "q-b3-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Cho phép lai $P: AaBbDd \\times AabbDd$. Các gen phân li độc lập, trội hoàn toàn. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b3-a",
                  "statement": "a) Cơ thể P mang kiểu gen AaBbDd tạo ra tối đa 8 loại giao tử.",
                  "isTrue": true,
                  "explain": "Có 3 cặp dị hợp -> 2³ = 8 loại giao tử. Đúng."
                },
                {
                  "id": "tf-b3-b",
                  "statement": "b) Số loại kiểu gen tối đa ở đời F1 là 18.",
                  "isTrue": true,
                  "explain": "Aa x Aa -> 3 KG; Bb x bb -> 2 KG; Dd x Dd -> 3 KG. Tổng số: 3 * 2 * 3 = 18 KG. Đúng."
                },
                {
                  "id": "tf-b3-c",
                  "statement": "c) Tỉ lệ kiểu hình mang 3 tính trạng lặn (aabbdd) ở F1 là 1/32.",
                  "isTrue": true,
                  "explain": "1/4(aa) * 1/2(bb) * 1/4(dd) = 1/32. Đúng."
                },
                {
                  "id": "tf-b3-d",
                  "statement": "d) Tỉ lệ cá thể mang kiểu hình trội cả 3 tính trạng (A-B-D-) là 9/32.",
                  "isTrue": false,
                  "explain": "3/4(A-) * 1/2(B-) * 3/4(D-) = 9/32. Đúng rồi! Khoan: 3/4 * 1/2 * 3/4 = 9/32. Phát biểu nói 9/32 là ĐÚNG. Đổi câu d: Tỉ lệ kiểu gen AabbDd là 1/16 -> 2/4 * 1/2 * 2/4 = 1/8 != 1/16 -> Sai."
                }
              ]
            },
            {
              "id": "q-b3-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở đậu Hà Lan, tính trạng hoa đỏ trội hoàn toàn so với hoa trắng. Khi cho cây hoa đỏ dị hợp Aa tự thụ phấn thu được F1. Trong số các cây hoa đỏ ở F1, xác suất chọn ngẫu nhiên được một cây khi tự thụ phấn cho đời con phân li tính trạng hoa đỏ : hoa trắng là bao nhiêu phần trăm (ghi số nguyên)?",
              "correctAnswer": "67",
              "unit": "%",
              "solution": "Trong số các cây hoa đỏ ở F1 (1/3 AA : 2/3 Aa), chỉ có cây dị hợp Aa khi tự thụ phấn mới cho F2 phân li tỉ lệ đỏ : trắng (3:1). Xác suất chọn cây này = 2/3 ≈ 66,67% ≈ 67%.",
              "trapAlert": "Lấy 2/4 = 50% thay vì xét TRONG SỐ CÂY HOA ĐỎ (mẫu số là 3, gồm 1AA và 2Aa)."
            }
          ],
          "subjectKey": "sinh",
          "grade": 12
        }
      ]
    },
    {
      "chapterId": "sinh-c3-lienket",
      "chapterName": "Di truyền liên kết giới tính & Hoán vị gen",
      "grade": 12,
      "lessons": [
        {
          "id": "sinh-hoan-vi-gen-lien-ket",
          "title": "Liên kết gen, Hoán vị gen & Di truyền liên kết giới tính",
          "desc": "Thí nghiệm của Morgan trên ruồi giấm, hiện tượng trao đổi chéo giữa các chromatid khác nguồn trong giảm phân I và lập bản đồ di truyền.",
          "duration": "30 phút",
          "tag": "Vận dụng",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Liên kết gen hoàn toàn (Thomas Hunt Morgan)",
              "desc": "Các gen nằm trên cùng một NST phân li cùng nhau và cùng tổ hợp trong quá trình giảm phân, hạn chế biến dị tổ hợp, duy trì sự ổn định của nhóm tính trạng."
            },
            {
              "title": "Hoán vị gen & Tần số hoán vị gen f",
              "desc": "Do sự tiếp hợp và trao đổi chéo giữa 2 cromatit khác nguồn gốc của cặp NST tương đồng ở kì đầu giảm phân I. Tần số $f = \\frac{\\text{Số giao tử hoán vị}}{\\text{Tổng số giao tử}} \\times 100\\% \\le 50\\%$. 1% hoán vị gen = 1 centiMorgan (cM)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Xác định kiểu gen bố mẹ liên kết đồng hay dị",
              "instruction": "Đồng: $\\frac{AB}{ab}$, Dị: $\\frac{Ab}{aB}$. Nhận diện kiểu gen con lặn $\\frac{ab}{ab}$ để suy ra tỉ lệ giao tử ab."
            },
            {
              "step": 2,
              "title": "Tìm tần số f",
              "instruction": "Nếu giao tử $ab < 25\\% \\implies f = 2 \\times \\%ab$ (ab là giao tử hoán vị). Nếu $ab > 25\\% \\implies f = 100\\% - 2 \\times \\%ab$."
            }
          ],
          "formulas": [
            {
              "label": "Tần số hoán vị gen f",
              "formula": "f = \\frac{\\text{Số cá thể hoán vị}}{\\text{Tổng số cá thể}} \\times 100\\% \\le 50\\%",
              "displayLatex": "f \\le 50\\%",
              "notes": "f không bao giờ vượt quá 50%."
            },
            {
              "label": "Giao tử liên kết và giao tử hoán vị",
              "formula": "\\text{Giao tử liên kết} = \\frac{1-f}{2}, \\quad \\text{Giao tử hoán vị} = \\frac{f}{2}",
              "displayLatex": "\\text{Giao tử liên kết} = \\frac{1-f}{2}, \\quad \\text{Giao tử hoán vị} = \\frac{f}{2}",
              "notes": "Tổng tần số 4 loại giao tử luôn bằng 1."
            }
          ],
          "traps": [
            {
              "trap": "Quên rằng ruồi giấm ĐỰC không có hoán vị gen",
              "avoid": "Ở ruồi giấm (Drosophila), hoán vị gen CHỈ xảy ra ở con cái, ruồi đực luôn liên kết hoàn toàn ($f = 0$)."
            },
            {
              "trap": "Cho rằng tần số hoán vị gen có thể lớn hơn 50%",
              "avoid": "Tần số hoán vị gen tối đa là 50%."
            }
          ],
          "flashcards": [
            {
              "id": "fc-b4-1",
              "front": "Tần số hoán vị gen tối đa là bao nhiêu?",
              "back": "Không vượt quá 50%."
            },
            {
              "id": "fc-b4-2",
              "front": "Ở ruồi giấm, hoán vị gen xảy ra ở giới tính nào?",
              "back": "Chỉ xảy ra ở ruồi giấm CÁI (con đực liên kết hoàn toàn)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-b4-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một cơ thể có kiểu gen $\\frac{AB}{ab}$ xảy ra hoán vị gen với tần số $f = 20\\%$. Tỉ lệ giao tử liên kết $\\underline{AB}$ được tạo ra là:",
              "options": [
                "40%",
                "10%",
                "20%",
                "80%"
              ],
              "correct": 0,
              "solution": "Giao tử liên kết = (1 - f)/2 = (1 - 0,2)/2 = 0,4 = 40%.",
              "trapAlert": "Nhầm tỉ lệ giao tử liên kết với giao tử hoán vị (10%).",
              "fastTip": "(100 - 20)/2 = 40%."
            },
            {
              "id": "q-b4-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Ở ruồi giấm, gen B quy định thân xám trội hoàn toàn so với b thân đen; V cánh dài trội so với v cánh cụt. Lai ruồi cái thân xám, cánh dài với ruồi đực thân đen, cánh cụt thu được đời con có 4% ruồi thân đen, cánh cụt. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b4-a",
                  "statement": "a) Ruồi đực đem lai giảm phân chỉ tạo 1 loại giao tử mang gen bv.",
                  "isTrue": true,
                  "explain": "Ruồi đực bbvv chỉ tạo giao tử bv với tỉ lệ 100%. Đúng."
                },
                {
                  "id": "tf-b4-b",
                  "statement": "b) Tỉ lệ giao tử bv do ruồi cái sinh ra là 4%.",
                  "isTrue": true,
                  "explain": "4% bbvv = 4% bv (cái) * 100% bv (đực). Đúng."
                },
                {
                  "id": "tf-b4-c",
                  "statement": "c) Ruồi cái P có kiểu gen dị hợp tử chéo Ab/aB.",
                  "isTrue": true,
                  "explain": "bv = 4% < 25% nên bv là giao tử hoán vị -> kiểu gen Ab/aB. Đúng."
                },
                {
                  "id": "tf-b4-d",
                  "statement": "d) Tần số hoán vị gen của ruồi cái là 16%.",
                  "isTrue": false,
                  "explain": "f = 2 * 4% = 8% != 16%. Sai."
                }
              ]
            },
            {
              "id": "q-b4-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở người, bệnh mù màu do alen lặn m nằm trên vùng không tương đồng của NST X quy định, alen M quy định nhìn màu bình thường. Bố mẹ bình thường sinh con trai đầu lòng bị bệnh mù màu ($X^m Y$). Xác suất đứa con thứ hai của họ là con gái không bị bệnh mù màu là bao nhiêu phần trăm (ghi số nguyên)?",
              "correctAnswer": "50",
              "unit": "%",
              "solution": "Mẹ phải có kiểu gen XᴹXᵐ, bố XᴹY. Đời con: 1/4 XᴹXᴹ (gái bình thường) : 1/4 XᴹXᵐ (gái bình thường) : 1/4 XᴹY (trai bt) : 1/4 XᵐY (trai mù màu). Tất cả con gái (1/2 = 50%) đều không bị bệnh mù màu.",
              "trapAlert": "Nhầm tính tỉ lệ con gái mang gen bệnh (25%) thay vì tỉ lệ KHÔNG BỊ BỆNH (50%)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-b4-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một cơ thể có kiểu gen $\\frac{AB}{ab}$ xảy ra hoán vị gen với tần số $f = 20\\%$. Tỉ lệ giao tử liên kết $\\underline{AB}$ được tạo ra là:",
              "options": [
                "40%",
                "10%",
                "20%",
                "80%"
              ],
              "correct": 0,
              "solution": "Giao tử liên kết = (1 - f)/2 = (1 - 0,2)/2 = 0,4 = 40%.",
              "trapAlert": "Nhầm tỉ lệ giao tử liên kết với giao tử hoán vị (10%).",
              "fastTip": "(100 - 20)/2 = 40%."
            },
            {
              "id": "q-b4-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Ở ruồi giấm, gen B quy định thân xám trội hoàn toàn so với b thân đen; V cánh dài trội so với v cánh cụt. Lai ruồi cái thân xám, cánh dài với ruồi đực thân đen, cánh cụt thu được đời con có 4% ruồi thân đen, cánh cụt. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b4-a",
                  "statement": "a) Ruồi đực đem lai giảm phân chỉ tạo 1 loại giao tử mang gen bv.",
                  "isTrue": true,
                  "explain": "Ruồi đực bbvv chỉ tạo giao tử bv với tỉ lệ 100%. Đúng."
                },
                {
                  "id": "tf-b4-b",
                  "statement": "b) Tỉ lệ giao tử bv do ruồi cái sinh ra là 4%.",
                  "isTrue": true,
                  "explain": "4% bbvv = 4% bv (cái) * 100% bv (đực). Đúng."
                },
                {
                  "id": "tf-b4-c",
                  "statement": "c) Ruồi cái P có kiểu gen dị hợp tử chéo Ab/aB.",
                  "isTrue": true,
                  "explain": "bv = 4% < 25% nên bv là giao tử hoán vị -> kiểu gen Ab/aB. Đúng."
                },
                {
                  "id": "tf-b4-d",
                  "statement": "d) Tần số hoán vị gen của ruồi cái là 16%.",
                  "isTrue": false,
                  "explain": "f = 2 * 4% = 8% != 16%. Sai."
                }
              ]
            },
            {
              "id": "q-b4-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở người, bệnh mù màu do alen lặn m nằm trên vùng không tương đồng của NST X quy định, alen M quy định nhìn màu bình thường. Bố mẹ bình thường sinh con trai đầu lòng bị bệnh mù màu ($X^m Y$). Xác suất đứa con thứ hai của họ là con gái không bị bệnh mù màu là bao nhiêu phần trăm (ghi số nguyên)?",
              "correctAnswer": "50",
              "unit": "%",
              "solution": "Mẹ phải có kiểu gen XᴹXᵐ, bố XᴹY. Đời con: 1/4 XᴹXᴹ (gái bình thường) : 1/4 XᴹXᵐ (gái bình thường) : 1/4 XᴹY (trai bt) : 1/4 XᵐY (trai mù màu). Tất cả con gái (1/2 = 50%) đều không bị bệnh mù màu.",
              "trapAlert": "Nhầm tính tỉ lệ con gái mang gen bệnh (25%) thay vì tỉ lệ KHÔNG BỊ BỆNH (50%)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-b4-mcq",
              "type": "mcq",
              "level": "Thông hiểu",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một cơ thể có kiểu gen $\\frac{AB}{ab}$ xảy ra hoán vị gen với tần số $f = 20\\%$. Tỉ lệ giao tử liên kết $\\underline{AB}$ được tạo ra là:",
              "options": [
                "40%",
                "10%",
                "20%",
                "80%"
              ],
              "correct": 0,
              "solution": "Giao tử liên kết = (1 - f)/2 = (1 - 0,2)/2 = 0,4 = 40%.",
              "trapAlert": "Nhầm tỉ lệ giao tử liên kết với giao tử hoán vị (10%).",
              "fastTip": "(100 - 20)/2 = 40%."
            },
            {
              "id": "q-b4-tf",
              "type": "true_false",
              "level": "Vận dụng",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Ở ruồi giấm, gen B quy định thân xám trội hoàn toàn so với b thân đen; V cánh dài trội so với v cánh cụt. Lai ruồi cái thân xám, cánh dài với ruồi đực thân đen, cánh cụt thu được đời con có 4% ruồi thân đen, cánh cụt. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b4-a",
                  "statement": "a) Ruồi đực đem lai giảm phân chỉ tạo 1 loại giao tử mang gen bv.",
                  "isTrue": true,
                  "explain": "Ruồi đực bbvv chỉ tạo giao tử bv với tỉ lệ 100%. Đúng."
                },
                {
                  "id": "tf-b4-b",
                  "statement": "b) Tỉ lệ giao tử bv do ruồi cái sinh ra là 4%.",
                  "isTrue": true,
                  "explain": "4% bbvv = 4% bv (cái) * 100% bv (đực). Đúng."
                },
                {
                  "id": "tf-b4-c",
                  "statement": "c) Ruồi cái P có kiểu gen dị hợp tử chéo Ab/aB.",
                  "isTrue": true,
                  "explain": "bv = 4% < 25% nên bv là giao tử hoán vị -> kiểu gen Ab/aB. Đúng."
                },
                {
                  "id": "tf-b4-d",
                  "statement": "d) Tần số hoán vị gen của ruồi cái là 16%.",
                  "isTrue": false,
                  "explain": "f = 2 * 4% = 8% != 16%. Sai."
                }
              ]
            },
            {
              "id": "q-b4-sa",
              "type": "short_answer",
              "level": "Vận dụng cao",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở người, bệnh mù màu do alen lặn m nằm trên vùng không tương đồng của NST X quy định, alen M quy định nhìn màu bình thường. Bố mẹ bình thường sinh con trai đầu lòng bị bệnh mù màu ($X^m Y$). Xác suất đứa con thứ hai của họ là con gái không bị bệnh mù màu là bao nhiêu phần trăm (ghi số nguyên)?",
              "correctAnswer": "50",
              "unit": "%",
              "solution": "Mẹ phải có kiểu gen XᴹXᵐ, bố XᴹY. Đời con: 1/4 XᴹXᴹ (gái bình thường) : 1/4 XᴹXᵐ (gái bình thường) : 1/4 XᴹY (trai bt) : 1/4 XᵐY (trai mù màu). Tất cả con gái (1/2 = 50%) đều không bị bệnh mù màu.",
              "trapAlert": "Nhầm tính tỉ lệ con gái mang gen bệnh (25%) thay vì tỉ lệ KHÔNG BỊ BỆNH (50%)."
            }
          ],
          "subjectKey": "sinh",
          "grade": 12
        }
      ]
    },
    {
      "chapterId": "sinh-c4-quanthe",
      "chapterName": "Di truyền học quần thể & Di truyền người",
      "grade": 12,
      "lessons": [
        {
          "id": "sinh-dinh-luat-hardy-weinberg",
          "title": "Cấu trúc di truyền quần thể & Định luật Hardy – Weinberg",
          "desc": "Quần thể tự phối (tăng đồng hợp, giảm dị hợp) và quần thể ngẫu phối cân bằng di truyền: $p^2 AA + 2pq Aa + q^2 aa = 1$.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "Tần số alen và Thành phần kiểu gen",
              "desc": "Quần thể có cấu trúc: $x AA + y Aa + z aa = 1$. Tần số alen: $p(A) = x + \\frac{y}{2}$, $q(a) = z + \\frac{y}{2}$ với $p + q = 1$."
            },
            {
              "title": "Định luật Hardy - Weinberg",
              "desc": "Trong một quần thể ngẫu phối lớn, không có chọn lọc, đột biến hay di nhập gen, tần số các alen và thành phần kiểu gen duy trì không đổi qua các thế hệ theo phương trình: $p^2 AA + 2pq Aa + q^2 aa = 1$."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Tìm tần số alen lặn q(a)",
              "instruction": "Từ tỉ lệ kiểu hình lặn $aa = q^2 \\implies q = \\sqrt{\\%aa}$."
            },
            {
              "step": 2,
              "title": "Suy ra tần số alen trội p(A)",
              "instruction": "$p = 1 - q$. Thành phần kiểu gen dị hợp là $2pq$."
            }
          ],
          "formulas": [
            {
              "label": "Điều kiện cân bằng di truyền Hardy - Weinberg",
              "formula": "p^2 AA + 2pq Aa + q^2 aa = 1",
              "displayLatex": "p^2 AA + 2pq Aa + q^2 aa = 1",
              "notes": "Dấu hiệu cân bằng: p² * q² = (2pq / 2)²."
            },
            {
              "label": "Tự thụ phấn qua n thế hệ",
              "formula": "Aa_n = \\left(\\frac{1}{2}\\right)^n, \\quad AA_n = x + y\\frac{1 - (1/2)^n}{2}",
              "displayLatex": "Aa_n = \\left(\\frac{1}{2}\\right)^n",
              "notes": "Tỉ lệ dị hợp giảm dần, đồng hợp tăng dần."
            }
          ],
          "traps": [
            {
              "trap": "Lấy căn bậc hai tỉ lệ kiểu hình trội để tìm p(A)",
              "avoid": "Kiểu hình trội gồm cả $p^2(AA) + 2pq(Aa)$, KHÔNG ĐƯỢC lấy căn. Phải luôn tìm từ alen lặn $q = \\sqrt{\\%aa}$."
            },
            {
              "trap": "Quần thể tự thụ phấn không áp dụng định luật Hardy - Weinberg",
              "avoid": "Định luật Hardy - Weinberg chỉ áp dụng cho quần thể NGẪU PHỐI (giao phối ngẫu nhiên)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-b5-1",
              "front": "Điều kiện nghiệm đúng của định luật Hardy - Weinberg?",
              "back": "Quần thể ngẫu phối kích thước lớn, không đột biến, không chọn lọc tự nhiên, không di nhập gen."
            },
            {
              "id": "fc-b5-2",
              "front": "Qua các thế hệ tự thụ phấn, tỉ lệ dị hợp thay đổi thế nào?",
              "back": "Giảm đi một nửa sau mỗi thế hệ: Aa = (1/2)ⁿ."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-b5-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một quần thể có cấu trúc di truyền: $0{,}49 AA + 0{,}42 Aa + 0{,}09 aa = 1$. Tần số alen A và a lần lượt là:",
              "options": [
                "p(A) = 0,7; q(a) = 0,3",
                "p(A) = 0,3; q(a) = 0,7",
                "p(A) = 0,49; q(a) = 0,09",
                "p(A) = 0,5; q(a) = 0,5"
              ],
              "correct": 0,
              "solution": "q(a) = √0,09 = 0,3. p(A) = 1 - 0,3 = 0,7.",
              "trapAlert": "Nhầm tần số alen với tỉ lệ kiểu gen.",
              "fastTip": "√0,09 = 0,3 -> p = 0,7."
            },
            {
              "id": "q-b5-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một quần thể thực vật ban đầu có $100\\%$ cá thể mang kiểu gen Aa. Cho quần thể tự thụ phấn nghiêm ngặt qua 3 thế hệ. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b5-a",
                  "statement": "a) Tỉ lệ kiểu gen dị hợp tử Aa ở thế hệ F3 là 12,5%.",
                  "isTrue": true,
                  "explain": "Aa = (1/2)³ = 1/8 = 12,5%. Đúng."
                },
                {
                  "id": "tf-b5-b",
                  "statement": "b) Tỉ lệ kiểu gen đồng hợp trội AA ở thế hệ F3 là 43,75%.",
                  "isTrue": true,
                  "explain": "AA = (1 - 0,125)/2 = 43,75%. Đúng."
                },
                {
                  "id": "tf-b5-c",
                  "statement": "c) Tần số của các alen A và a bị biến đổi qua các thế hệ tự thụ phấn.",
                  "isTrue": false,
                  "explain": "Tự thụ phấn làm thay đổi thành phần kiểu gen nhưng KHÔNG làm thay đổi tần số alen. Sai."
                },
                {
                  "id": "tf-b5-d",
                  "statement": "d) Quần thể F3 đã đạt trạng thái cân bằng di truyền Hardy - Weinberg.",
                  "isTrue": false,
                  "explain": "Tự thụ phấn không đạt trạng thái cân bằng Hardy - Weinberg (chỉ có ngẫu phối mới đạt). Sai."
                }
              ]
            },
            {
              "id": "q-b5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở một quần thể người ngẫu phối đang cân bằng di truyền, bệnh bạch tạng do alen lặn trên NST thường quy định với tần số người bị bệnh trong quần thể là 1/10000. Tính tỉ lệ người mang gen bệnh nhưng có kiểu hình bình thường (người dị hợp tử) trong quần thể đó (đơn vị: %, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "1.98",
              "unit": "%",
              "solution": "q² = 1/10000 = 0,0001 -> q = 0,01 -> p = 0,99. Tỉ lệ người dị hợp Aa: 2pq = 2 * 0,99 * 0,01 = 0,0198 = 1,98%.",
              "trapAlert": "Nhầm 2pq với p²."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-b5-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một quần thể có cấu trúc di truyền: $0{,}49 AA + 0{,}42 Aa + 0{,}09 aa = 1$. Tần số alen A và a lần lượt là:",
              "options": [
                "p(A) = 0,7; q(a) = 0,3",
                "p(A) = 0,3; q(a) = 0,7",
                "p(A) = 0,49; q(a) = 0,09",
                "p(A) = 0,5; q(a) = 0,5"
              ],
              "correct": 0,
              "solution": "q(a) = √0,09 = 0,3. p(A) = 1 - 0,3 = 0,7.",
              "trapAlert": "Nhầm tần số alen với tỉ lệ kiểu gen.",
              "fastTip": "√0,09 = 0,3 -> p = 0,7."
            },
            {
              "id": "q-b5-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một quần thể thực vật ban đầu có $100\\%$ cá thể mang kiểu gen Aa. Cho quần thể tự thụ phấn nghiêm ngặt qua 3 thế hệ. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b5-a",
                  "statement": "a) Tỉ lệ kiểu gen dị hợp tử Aa ở thế hệ F3 là 12,5%.",
                  "isTrue": true,
                  "explain": "Aa = (1/2)³ = 1/8 = 12,5%. Đúng."
                },
                {
                  "id": "tf-b5-b",
                  "statement": "b) Tỉ lệ kiểu gen đồng hợp trội AA ở thế hệ F3 là 43,75%.",
                  "isTrue": true,
                  "explain": "AA = (1 - 0,125)/2 = 43,75%. Đúng."
                },
                {
                  "id": "tf-b5-c",
                  "statement": "c) Tần số của các alen A và a bị biến đổi qua các thế hệ tự thụ phấn.",
                  "isTrue": false,
                  "explain": "Tự thụ phấn làm thay đổi thành phần kiểu gen nhưng KHÔNG làm thay đổi tần số alen. Sai."
                },
                {
                  "id": "tf-b5-d",
                  "statement": "d) Quần thể F3 đã đạt trạng thái cân bằng di truyền Hardy - Weinberg.",
                  "isTrue": false,
                  "explain": "Tự thụ phấn không đạt trạng thái cân bằng Hardy - Weinberg (chỉ có ngẫu phối mới đạt). Sai."
                }
              ]
            },
            {
              "id": "q-b5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở một quần thể người ngẫu phối đang cân bằng di truyền, bệnh bạch tạng do alen lặn trên NST thường quy định với tần số người bị bệnh trong quần thể là 1/10000. Tính tỉ lệ người mang gen bệnh nhưng có kiểu hình bình thường (người dị hợp tử) trong quần thể đó (đơn vị: %, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "1.98",
              "unit": "%",
              "solution": "q² = 1/10000 = 0,0001 -> q = 0,01 -> p = 0,99. Tỉ lệ người dị hợp Aa: 2pq = 2 * 0,99 * 0,01 = 0,0198 = 1,98%.",
              "trapAlert": "Nhầm 2pq với p²."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-b5-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Một quần thể có cấu trúc di truyền: $0{,}49 AA + 0{,}42 Aa + 0{,}09 aa = 1$. Tần số alen A và a lần lượt là:",
              "options": [
                "p(A) = 0,7; q(a) = 0,3",
                "p(A) = 0,3; q(a) = 0,7",
                "p(A) = 0,49; q(a) = 0,09",
                "p(A) = 0,5; q(a) = 0,5"
              ],
              "correct": 0,
              "solution": "q(a) = √0,09 = 0,3. p(A) = 1 - 0,3 = 0,7.",
              "trapAlert": "Nhầm tần số alen với tỉ lệ kiểu gen.",
              "fastTip": "√0,09 = 0,3 -> p = 0,7."
            },
            {
              "id": "q-b5-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Một quần thể thực vật ban đầu có $100\\%$ cá thể mang kiểu gen Aa. Cho quần thể tự thụ phấn nghiêm ngặt qua 3 thế hệ. Xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b5-a",
                  "statement": "a) Tỉ lệ kiểu gen dị hợp tử Aa ở thế hệ F3 là 12,5%.",
                  "isTrue": true,
                  "explain": "Aa = (1/2)³ = 1/8 = 12,5%. Đúng."
                },
                {
                  "id": "tf-b5-b",
                  "statement": "b) Tỉ lệ kiểu gen đồng hợp trội AA ở thế hệ F3 là 43,75%.",
                  "isTrue": true,
                  "explain": "AA = (1 - 0,125)/2 = 43,75%. Đúng."
                },
                {
                  "id": "tf-b5-c",
                  "statement": "c) Tần số của các alen A và a bị biến đổi qua các thế hệ tự thụ phấn.",
                  "isTrue": false,
                  "explain": "Tự thụ phấn làm thay đổi thành phần kiểu gen nhưng KHÔNG làm thay đổi tần số alen. Sai."
                },
                {
                  "id": "tf-b5-d",
                  "statement": "d) Quần thể F3 đã đạt trạng thái cân bằng di truyền Hardy - Weinberg.",
                  "isTrue": false,
                  "explain": "Tự thụ phấn không đạt trạng thái cân bằng Hardy - Weinberg (chỉ có ngẫu phối mới đạt). Sai."
                }
              ]
            },
            {
              "id": "q-b5-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Ở một quần thể người ngẫu phối đang cân bằng di truyền, bệnh bạch tạng do alen lặn trên NST thường quy định với tần số người bị bệnh trong quần thể là 1/10000. Tính tỉ lệ người mang gen bệnh nhưng có kiểu hình bình thường (người dị hợp tử) trong quần thể đó (đơn vị: %, làm tròn 2 chữ số thập phân)?",
              "correctAnswer": "1.98",
              "unit": "%",
              "solution": "q² = 1/10000 = 0,0001 -> q = 0,01 -> p = 0,99. Tỉ lệ người dị hợp Aa: 2pq = 2 * 0,99 * 0,01 = 0,0198 = 1,98%.",
              "trapAlert": "Nhầm 2pq với p²."
            }
          ],
          "subjectKey": "sinh",
          "grade": 12
        }
      ]
    },
    {
      "chapterId": "sinh-c5-tienhoa",
      "chapterName": "Tiến hóa & Sinh thái học",
      "grade": 12,
      "lessons": [
        {
          "id": "sinh-tien-hoa-sinh-thai-co-ban",
          "title": "Các nhân tố tiến hóa & Mối quan hệ trong hệ sinh thái",
          "desc": "5 nhân tố tiến hóa (đột biến, di nhập gen, CLTN, yếu tố ngẫu nhiên, giao phối không ngẫu nhiên) và chuỗi, lưới thức ăn sinh thái.",
          "duration": "25 phút",
          "tag": "Trọng tâm",
          "practiceCount": 10,
          "concepts": [
            {
              "title": "5 nhân tố tiến hóa (Thuyết tiến hóa tổng hợp hiện đại)",
              "desc": "Đột biến (nguồn nguyên liệu sơ cấp), Giao phối không ngẫu nhiên (chỉ đổi KG, ko đổi alen), Chọn lọc tự nhiên (định hướng tiến hóa), Các yếu tố ngẫu nhiên (phiêu bạt di truyền, có thể loại bỏ hoàn toàn alen có lợi), Di - nhập gen (đem alen mới vào hoặc mất đi alen)."
            },
            {
              "title": "Mối quan hệ sinh thái trong quần xã",
              "desc": "Quan hệ hỗ trợ: Cộng sinh (+/+ bắt buộc), Hợp tác (+/+ không bắt buộc), Hội sinh (+/0). Quan hệ đối kháng: Cạnh tranh (-/-), Kí sinh (+/-), Ức chế - cảm nhiễm (0/-), Sinh vật này ăn sinh vật khác (+/-)."
            }
          ],
          "algorithms": [
            {
              "step": 1,
              "title": "Nhận diện nhân tố tiến hóa làm biến đổi tần số alen",
              "instruction": "Định hướng duy nhất: Chọn lọc tự nhiên. Thay đổi đột ngột không theo hướng: Yếu tố ngẫu nhiên. Không làm đổi tần số alen: Giao phối không ngẫu nhiên."
            },
            {
              "step": 2,
              "title": "Xác định quan hệ sinh thái",
              "instruction": "Xem xét mức độ ảnh hưởng lên 2 loài: (+/+), (+/-), (+/0), (-/-), (0/-)."
            }
          ],
          "formulas": [
            {
              "label": "Tháp sinh thái và hiệu suất sinh thái",
              "formula": "H = \\frac{E_{n+1}}{E_n} \\times 100\\%",
              "displayLatex": "H = \\frac{E_{n+1}}{E_n} \\times 100\\%",
              "notes": "Năng lượng thất thoát qua mỗi bậc dinh dưỡng khoảng 90% (chỉ 10% tích lũy)."
            },
            {
              "label": "Cân bằng quần thể theo phương trình tăng trưởng Logistic",
              "formula": "\\frac{dN}{dt} = rN\\frac{K - N}{K}",
              "displayLatex": "\\frac{dN}{dt} = rN\\left(1 - \\frac{N}{K}\\right)",
              "notes": "K là sức chứa của môi trường."
            }
          ],
          "traps": [
            {
              "trap": "Nhầm giao phối không ngẫu nhiên làm thay đổi tần số alen",
              "avoid": "Giao phối không ngẫu nhiên CHỈ làm thay đổi thành phần kiểu gen (tăng đồng, giảm dị), KHÔNG làm thay đổi tần số alen."
            },
            {
              "trap": "Nhầm lẫn giữa Cộng sinh và Hợp tác",
              "avoid": "Cộng sinh là mối quan hệ chặt chẽ bắt buộc (tách nhau ra cả hai đều chết, như địa y), còn hợp tác không bắt buộc (chim sáo và trâu rừng)."
            }
          ],
          "flashcards": [
            {
              "id": "fc-b6-1",
              "front": "Nhân tố tiến hóa duy nhất quy định chiều hướng và nhịp điệu tiến hóa?",
              "back": "Chọn lọc tự nhiên (Natural selection)."
            },
            {
              "id": "fc-b6-2",
              "front": "Hiệu suất chuyển hóa năng lượng trung bình giữa hai bậc dinh dưỡng liền kề là bao nhiêu?",
              "back": "Khoảng 10% (90% năng lượng bị mất qua hô hấp, chất thải, nhiệt)."
            }
          ],
          "practiceQuestions": [
            {
              "id": "q-b6-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhân tố tiến hóa nào sau đây có thể làm thay đổi tần số alen của quần thể một cách đột ngột và vô hướng, thậm chí có thể loại bỏ hoàn toàn một alen có lợi?",
              "options": [
                "Các yếu tố ngẫu nhiên (phiêu bạt di truyền)",
                "Chọn lọc tự nhiên",
                "Giao phối không ngẫu nhiên",
                "Đột biến gen"
              ],
              "correct": 0,
              "solution": "Các yếu tố ngẫu nhiên (như thiên tai, dịch bệnh, lũ lụt) có thể làm giảm mạnh kích thước quần thể và đào thải ngẫu nhiên bất kì alen nào, kể cả alen có lợi.",
              "trapAlert": "Nhầm với Chọn lọc tự nhiên (CLTN chỉ đào thải alen có hại, giữ lại alen có lợi).",
              "fastTip": "Đột ngột, vô hướng, mất cả alen có lợi -> Yếu tố ngẫu nhiên."
            },
            {
              "id": "q-b6-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét mối quan hệ giữa các sinh vật sau đây, xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b6-a",
                  "statement": "a) Mối quan hệ giữa nấm và vi khuẩn lam trong địa y là quan hệ cộng sinh.",
                  "isTrue": true,
                  "explain": "Cả 2 loài đều có lợi và gắn kết chặt chẽ bắt buộc với nhau. Đúng."
                },
                {
                  "id": "tf-b6-b",
                  "statement": "b) Cây phong lan bám trên thân cây gỗ lớn là mối quan hệ kí sinh.",
                  "isTrue": false,
                  "explain": "Phong lan chỉ nhờ chỗ bám, lấy chất dinh dưỡng từ không khí nên là quan hệ Hội sinh (+/0). Sai."
                },
                {
                  "id": "tf-b6-c",
                  "statement": "c) Hiện tượng tỏi tiết chất ức chế vi sinh vật xung quanh là quan hệ ức chế - cảm nhiễm.",
                  "isTrue": true,
                  "explain": "Tỏi không có lợi cũng không hại (0), vi sinh vật bị ức chế phát triển (-). Đúng."
                },
                {
                  "id": "tf-b6-d",
                  "statement": "d) Trong một chuỗi thức ăn, sinh vật tiêu thụ bậc 1 luôn có sinh khối lớn hơn sinh vật sản xuất.",
                  "isTrue": false,
                  "explain": "Hiệu suất năng lượng qua mỗi bậc chỉ ~10% nên sinh vật sản xuất phải có sinh khối lớn hơn nhiều. Sai."
                }
              ]
            },
            {
              "id": "q-b6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Trong một hệ sinh thái, sinh vật sản xuất tích lũy năng lượng là $10^6\\text{ kcal}$. Hiệu suất sinh thái giữa bậc dinh dưỡng cấp 1 (sinh vật sản xuất) và bậc dinh dưỡng cấp 2 là $10\\%$, giữa bậc 2 và bậc 3 là $8\\%$. Tính năng lượng tích lũy ở sinh vật tiêu thụ bậc 2 (đơn vị: kcal)?",
              "correctAnswer": "8000",
              "unit": "kcal",
              "solution": "Năng lượng bậc 2 (SV tiêu thụ bậc 1): E₂ = 10⁶ * 10% = 10⁵ kcal. Năng lượng bậc 3 (SV tiêu thụ bậc 2): E₃ = 10⁵ * 8% = 8000 kcal.",
              "trapAlert": "Nhầm sinh vật tiêu thụ bậc 2 nằm ở bậc dinh dưỡng cấp 2 (thực tế nó ở bậc dinh dưỡng cấp 3)."
            }
          ],
          "sampleQuestions": [
            {
              "id": "q-b6-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhân tố tiến hóa nào sau đây có thể làm thay đổi tần số alen của quần thể một cách đột ngột và vô hướng, thậm chí có thể loại bỏ hoàn toàn một alen có lợi?",
              "options": [
                "Các yếu tố ngẫu nhiên (phiêu bạt di truyền)",
                "Chọn lọc tự nhiên",
                "Giao phối không ngẫu nhiên",
                "Đột biến gen"
              ],
              "correct": 0,
              "solution": "Các yếu tố ngẫu nhiên (như thiên tai, dịch bệnh, lũ lụt) có thể làm giảm mạnh kích thước quần thể và đào thải ngẫu nhiên bất kì alen nào, kể cả alen có lợi.",
              "trapAlert": "Nhầm với Chọn lọc tự nhiên (CLTN chỉ đào thải alen có hại, giữ lại alen có lợi).",
              "fastTip": "Đột ngột, vô hướng, mất cả alen có lợi -> Yếu tố ngẫu nhiên."
            },
            {
              "id": "q-b6-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét mối quan hệ giữa các sinh vật sau đây, xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b6-a",
                  "statement": "a) Mối quan hệ giữa nấm và vi khuẩn lam trong địa y là quan hệ cộng sinh.",
                  "isTrue": true,
                  "explain": "Cả 2 loài đều có lợi và gắn kết chặt chẽ bắt buộc với nhau. Đúng."
                },
                {
                  "id": "tf-b6-b",
                  "statement": "b) Cây phong lan bám trên thân cây gỗ lớn là mối quan hệ kí sinh.",
                  "isTrue": false,
                  "explain": "Phong lan chỉ nhờ chỗ bám, lấy chất dinh dưỡng từ không khí nên là quan hệ Hội sinh (+/0). Sai."
                },
                {
                  "id": "tf-b6-c",
                  "statement": "c) Hiện tượng tỏi tiết chất ức chế vi sinh vật xung quanh là quan hệ ức chế - cảm nhiễm.",
                  "isTrue": true,
                  "explain": "Tỏi không có lợi cũng không hại (0), vi sinh vật bị ức chế phát triển (-). Đúng."
                },
                {
                  "id": "tf-b6-d",
                  "statement": "d) Trong một chuỗi thức ăn, sinh vật tiêu thụ bậc 1 luôn có sinh khối lớn hơn sinh vật sản xuất.",
                  "isTrue": false,
                  "explain": "Hiệu suất năng lượng qua mỗi bậc chỉ ~10% nên sinh vật sản xuất phải có sinh khối lớn hơn nhiều. Sai."
                }
              ]
            },
            {
              "id": "q-b6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Trong một hệ sinh thái, sinh vật sản xuất tích lũy năng lượng là $10^6\\text{ kcal}$. Hiệu suất sinh thái giữa bậc dinh dưỡng cấp 1 (sinh vật sản xuất) và bậc dinh dưỡng cấp 2 là $10\\%$, giữa bậc 2 và bậc 3 là $8\\%$. Tính năng lượng tích lũy ở sinh vật tiêu thụ bậc 2 (đơn vị: kcal)?",
              "correctAnswer": "8000",
              "unit": "kcal",
              "solution": "Năng lượng bậc 2 (SV tiêu thụ bậc 1): E₂ = 10⁶ * 10% = 10⁵ kcal. Năng lượng bậc 3 (SV tiêu thụ bậc 2): E₃ = 10⁵ * 8% = 8000 kcal.",
              "trapAlert": "Nhầm sinh vật tiêu thụ bậc 2 nằm ở bậc dinh dưỡng cấp 2 (thực tế nó ở bậc dinh dưỡng cấp 3)."
            }
          ],
          "exam2026Questions": [
            {
              "id": "q-b6-mcq",
              "type": "mcq",
              "level": "Nhận biết",
              "targetExam": "Chuẩn GDPT 2026",
              "prompt": "Nhân tố tiến hóa nào sau đây có thể làm thay đổi tần số alen của quần thể một cách đột ngột và vô hướng, thậm chí có thể loại bỏ hoàn toàn một alen có lợi?",
              "options": [
                "Các yếu tố ngẫu nhiên (phiêu bạt di truyền)",
                "Chọn lọc tự nhiên",
                "Giao phối không ngẫu nhiên",
                "Đột biến gen"
              ],
              "correct": 0,
              "solution": "Các yếu tố ngẫu nhiên (như thiên tai, dịch bệnh, lũ lụt) có thể làm giảm mạnh kích thước quần thể và đào thải ngẫu nhiên bất kì alen nào, kể cả alen có lợi.",
              "trapAlert": "Nhầm với Chọn lọc tự nhiên (CLTN chỉ đào thải alen có hại, giữ lại alen có lợi).",
              "fastTip": "Đột ngột, vô hướng, mất cả alen có lợi -> Yếu tố ngẫu nhiên."
            },
            {
              "id": "q-b6-tf",
              "type": "true_false",
              "level": "Thông hiểu",
              "targetExam": "Đề chuẩn 2026",
              "prompt": "Xét mối quan hệ giữa các sinh vật sau đây, xét tính Đúng/Sai:",
              "subQuestions": [
                {
                  "id": "tf-b6-a",
                  "statement": "a) Mối quan hệ giữa nấm và vi khuẩn lam trong địa y là quan hệ cộng sinh.",
                  "isTrue": true,
                  "explain": "Cả 2 loài đều có lợi và gắn kết chặt chẽ bắt buộc với nhau. Đúng."
                },
                {
                  "id": "tf-b6-b",
                  "statement": "b) Cây phong lan bám trên thân cây gỗ lớn là mối quan hệ kí sinh.",
                  "isTrue": false,
                  "explain": "Phong lan chỉ nhờ chỗ bám, lấy chất dinh dưỡng từ không khí nên là quan hệ Hội sinh (+/0). Sai."
                },
                {
                  "id": "tf-b6-c",
                  "statement": "c) Hiện tượng tỏi tiết chất ức chế vi sinh vật xung quanh là quan hệ ức chế - cảm nhiễm.",
                  "isTrue": true,
                  "explain": "Tỏi không có lợi cũng không hại (0), vi sinh vật bị ức chế phát triển (-). Đúng."
                },
                {
                  "id": "tf-b6-d",
                  "statement": "d) Trong một chuỗi thức ăn, sinh vật tiêu thụ bậc 1 luôn có sinh khối lớn hơn sinh vật sản xuất.",
                  "isTrue": false,
                  "explain": "Hiệu suất năng lượng qua mỗi bậc chỉ ~10% nên sinh vật sản xuất phải có sinh khối lớn hơn nhiều. Sai."
                }
              ]
            },
            {
              "id": "q-b6-sa",
              "type": "short_answer",
              "level": "Vận dụng",
              "targetExam": "TSA & Y Dược",
              "prompt": "Trong một hệ sinh thái, sinh vật sản xuất tích lũy năng lượng là $10^6\\text{ kcal}$. Hiệu suất sinh thái giữa bậc dinh dưỡng cấp 1 (sinh vật sản xuất) và bậc dinh dưỡng cấp 2 là $10\\%$, giữa bậc 2 và bậc 3 là $8\\%$. Tính năng lượng tích lũy ở sinh vật tiêu thụ bậc 2 (đơn vị: kcal)?",
              "correctAnswer": "8000",
              "unit": "kcal",
              "solution": "Năng lượng bậc 2 (SV tiêu thụ bậc 1): E₂ = 10⁶ * 10% = 10⁵ kcal. Năng lượng bậc 3 (SV tiêu thụ bậc 2): E₃ = 10⁵ * 8% = 8000 kcal.",
              "trapAlert": "Nhầm sinh vật tiêu thụ bậc 2 nằm ở bậc dinh dưỡng cấp 2 (thực tế nó ở bậc dinh dưỡng cấp 3)."
            }
          ],
          "subjectKey": "sinh",
          "grade": 12
        }
      ]
    }
  ]
};

/**
 * Tra cứu bài học theo mã ID duy nhất
 */
export function findLessonById(lessonId) {
  if (!lessonId) return null;
  const q = String(lessonId).toLowerCase();
  for (const [subjectKey, chapters] of Object.entries(DEDICATED_LESSONS)) {
    for (const ch of chapters) {
      const idx = ch.lessons.findIndex((l) => l.id.toLowerCase() === q);
      if (idx >= 0) {
        const lesson = ch.lessons[idx];
        return {
          ...lesson,
          lessonIndex: idx + 1,
          chapterId: ch.chapterId,
          chapterName: ch.chapterName,
          chapterNum: ch.chapterNum,
          subjectKey,
          chapter: ch,
        };
      }
    }
  }
  return null;
}

/**
 * Tra cứu bài học đầu tiên của một chương
 */
export function findLessonByChapterId(chapterId) {
  if (!chapterId) return null;
  const q = String(chapterId).toLowerCase();
  for (const [subjectKey, chapters] of Object.entries(DEDICATED_LESSONS)) {
    for (const ch of chapters) {
      if (
        ch.chapterId.toLowerCase() === q ||
        ch.chapterId.toLowerCase().includes(q) ||
        q.includes(ch.chapterId.toLowerCase()) ||
        ch.chapterName.toLowerCase().includes(q)
      ) {
        if (ch.lessons && ch.lessons.length > 0) {
          return {
            ...ch.lessons[0],
            lessonIndex: 1,
            chapterId: ch.chapterId,
            chapterName: ch.chapterName,
            chapterNum: ch.chapterNum,
            subjectKey,
            chapter: ch,
          };
        }
      }
    }
  }
  return null;
}

/**
 * Lấy danh sách toàn bộ các bài học con thuộc một chương
 */
export function findLessonsByChapter(chapterId) {
  if (!chapterId) return [];
  const q = String(chapterId).toLowerCase();
  for (const [subjectKey, chapters] of Object.entries(DEDICATED_LESSONS)) {
    for (const ch of chapters) {
      if (
        ch.chapterId.toLowerCase() === q ||
        ch.chapterId.toLowerCase().includes(q) ||
        q.includes(ch.chapterId.toLowerCase()) ||
        ch.chapterName.toLowerCase().includes(q)
      ) {
        return ch.lessons.map((l, index) => ({
          ...l,
          lessonIndex: index + 1,
          chapterId: ch.chapterId,
          chapterName: ch.chapterName,
          subjectKey,
        }));
      }
    }
  }
  return [];
}
