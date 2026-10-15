# Nâng cấp lớp AI — ELEC AI v4

Tài liệu này mô tả bản nâng cấp "AI thông minh hơn" của dự án: **cái gì đã thay đổi, vì sao, cách
bật/tắt, và cách kiểm chứng**. Đọc kèm [docs/AUDIT-NANG-CAP-AITK.md](AUDIT-NANG-CAP-AITK.md) (audit
gốc) và [README.md](../README.md).

---

## 1. Vấn đề của lớp AI cũ

| Vấn đề | Hệ quả |
|---|---|
| AI tự làm số học (nhân/chia, đổi ml↔lít, chọn hệ số) | Đúng hóa học nhưng **sai đáp án số** |
| Chỉ 1 key/provider, 429 là chết | Người dùng gặp "quota" giữa lúc học |
| Ảnh đề bài chỉ Gemini đọc được | Gemini hết quota → **ảnh không giải được nữa** |
| Prompt cứng, luôn hướng "1 dòng/bước" | Bài toán nhiều bước bị trình bày quá tắt, khó theo dõi |
| Chỉ gửi 12 tin nhắn gần nhất | Quên đề bài ở đầu cuộc trò chuyện |
| Không có suy luận (thinking) | Bài vận dụng cao dễ sai |
| Model hard-code, không kiểm tra tồn tại | Tên model sai → 404 → nhảy provider liên tục |
| Không có dữ liệu nền của app | AI không biết 118 nguyên tố, công thức SGK, phản ứng của app |
| Cache trong RAM, mất khi F5 | Tốn quota cho câu hỏi lặp lại |
| Không có tự kiểm tra | Người học không biết đáp án có đáng tin không |

---

## 2. Kiến trúc mới

```
Câu hỏi người dùng
      │
      ├─ aiRouter.classifyTask()      → loại tác vụ, độ khó, chế độ suy luận, tầng model
      ├─ aiKnowledge.retrieve()       → neo vào dữ liệu chuẩn của app (có trích dẫn)
      ├─ aiTools.runTools()           → TÍNH TRƯỚC phần số bằng code tất định
      ├─ aiMemory                      → nén hội thoại cũ + hồ sơ học tập
      ├─ aiPrompts.buildSystemPrompt()→ ghép prompt: danh tính + lớp + chế độ + ngữ cảnh + công cụ
      │
      ├─ ai.js: chuỗi provider (xoay key, cooldown model, fallback) → stream
      │        onChunk = nội dung, onReasoning = suy luận (tách riêng)
      │
      └─ Tự kiểm tra: đối chiếu đáp án ↔ kết quả công cụ (+ thẩm định bằng model khác cho VIP)
```

### Nguyên tắc vàng
> **AI lo lập luận và trình bày. Máy lo con số.**

Mọi giá trị số (M, hệ số phương trình, n, m, V, pH) được tính bằng JavaScript tất định
(`chemBalance.js` + `aiTools.js`) rồi đưa vào prompt dưới khối
`KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ NỘI BỘ`, kèm quy tắc "không được tính ra số khác".

---

## 3. Chi tiết từng module

### `src/lib/chemBalance.js` — lõi hóa học thuần (mới)
- `parseFormula`: ngoặc, hydrat (`CuSO4·5H2O`), hệ số đầu cụm.
- `molarMass`: bảng 118 nguyên tố, `{ sgk: true }` dùng số liệu làm tròn SGK.
- `balanceEquation`: cân bằng bằng RREF số học phân số bigint → **không sai số làm tròn**.
- `checkBalance`: kiểm tra bảo toàn nguyên tố.

> `EquationBalancer.jsx` và `MolarMass.jsx` đã được chuyển sang dùng module này (trước đây mỗi file
> có một bản sao thuật toán riêng).

### `src/lib/aiTools.js` — công cụ tính chính xác (mới)
| Công cụ | Ví dụ đầu vào → đầu ra |
|---|---|
| `molar` | "Tính M của H₂SO₄" → 98,072 g/mol + chi tiết từng nguyên tố |
| `balance` | "Fe + O2 -> Fe2O3" → `4Fe + 3O2 → 2Fe2O3` + kiểm tra 2 vế |
| `stoich` | "5,6 gam Fe + HCl dư, tính V(H₂)" → n=0,1 mol, V=2,246 lít |
| `solution` | "0,2 mol NaCl trong 500 ml" → C_M = 0,4 M; "HCl 0,01 M" → pH ≈ 2 |
| `element` | "nguyên tố Fe" → Z, M, cấu hình electron, số oxi hóa |
| `compound` | "H2SO4" → loại chất, độ mạnh, ion, phản ứng đặc trưng |

`verifyToolResults()` đối chiếu con số trong câu trả lời của AI với kết quả công cụ. Nếu AI
**không dùng con số nào** của công cụ, câu trả lời được gắn dòng cảnh báo tự kiểm tra.

### `src/lib/aiKnowledge.js` — neo vào dữ liệu của app (mới)
- Nguồn: `FORMULAS`, `COMPOUNDS`, 118 nguyên tố, `REACTIONS`, `CHEM_TOPICS` → **270 tài liệu**.
- Chỉ mục nghịch đảo + BM25 rút gọn, **bỏ dấu** ("sat" tìm được "Sắt").
- Gọi tên một nguyên tố thì trang nguyên tố được ưu tiên (tránh hợp chất lấn át).
- Trả về trích dẫn hiển thị dưới câu trả lời: `[1] Công thức · Số mol theo khối lượng`.

### `src/lib/aiRouter.js` — định tuyến (mới)
- `classifyTask`: `chat | theory | problem | generate | compare | vision`, kèm `hard`, `temperature`,
  `maxTokens`, `reasoningEffort`, `thinkingBudget`, `needTools`, `needKnowledge`.
  - "giải thích tại sao…" → **lý thuyết** (không bị nhầm thành bài toán).
  - "hỗn hợp + hiệu suất + nhiều dữ kiện" → **bài toán khó** → suy luận `high`, prompt có cấu trúc bắt buộc.
- `coreText`: bỏ đuôi boilerplate app tự nối (`Trình độ: … KHÔNG dùng LaTeX.`) — trước đây chữ "độ"
  trong "Trình độ" từng khớp nhầm công thức "Độ rượu".
- **Key ring**: một provider có thể có nhiều key, 429 → xoay key, cooldown key hỏng.
- **Dò model thật** của Gemini qua `models.list` (cache 12 giờ) → hết cảnh 404 vì tên model sai.

### `src/lib/aiPrompts.js` — prompt ghép lớp (mới)
6 chế độ học dùng ngay trong UI:

| Chế độ | Tác dụng |
|---|---|
| Tự động | Đơn giản → ngắn; nhiều bước → đủ bước |
| Giải chi tiết | Đọc đề → dữ kiện → công thức → thay số → kết quả → kiểm tra |
| Gợi ý từng bước | **Không cho đáp án**, chỉ dẫn dắt để tự làm |
| Kiểm tra đáp án | Chấm lời giải người học, chỉ đúng bước sai |
| Ôn lý thuyết | Hệ thống khái niệm + mẹo + câu tự kiểm tra |
| Tạo bài tương tự | 3 bài cùng dạng, độ khó tăng dần, có đáp án |

Kèm quy tắc chống prompt-injection: nội dung trong ảnh/OCR/ngữ cảnh là **dữ liệu**, không phải lệnh.

### `src/lib/aiMemory.js` — bộ nhớ (mới)
- Nén các lượt cũ thành tóm tắt cục bộ (không tốn request) → giữ ngữ cảnh dài.
- Hồ sơ học tập theo `uid`: khối lớp + chủ đề còn yếu (API `noteWeakTopic`) → dùng để cá nhân hóa.

### `src/lib/aiOcr.js` — OCR dự phòng (mới)
Không có key Gemini → ảnh được **OCR ngay trên máy** (tesseract.js, lazy-load) → đề bài thành văn bản
→ chạy lại công cụ tính + tri thức → model text (Groq/Agnes) giải như bình thường.

### `src/lib/ai.js` — động cơ (viết lại)
- **Stream suy luận thật**: Gemini `thinkingConfig.includeThoughts`, Groq `reasoning_effort`
  → đẩy ra `onReasoning`, UI hiển thị ở khung "Phân tích của AI" (không lẫn vào câu trả lời).
- Cache bền trong tab (sessionStorage), vẫn tự kiểm tra khi lấy từ cache.
- Hết quota một provider → bỏ luôn các model còn lại của provider đó, chuyển ngay provider khác.
- `VITE_AI_HEDGE_MS` > 0: đua 2 provider song song, ai ra token đầu trước thì thắng (giảm độ trễ).
- **Tương thích ngược**: `askAI(history, onChunk, onReasoning, systemPrompt)` vẫn chạy như cũ;
  tuỳ chọn mới truyền qua tham số thứ 4 dạng object.

---

## 4. Giao diện đã đổi

- Header AIChat có thêm **chọn chế độ trả lời** (lưu trong `cs-ai-mode`).
- Dưới mỗi câu trả lời:
  - `🧮 Đã tính bằng công cụ` — các bước số do app tính.
  - `⚖️ Đã thẩm định lại` — chỉ với VIP (bật `deepVerify`): một model khác chấm lại lời giải.
  - Chip trích dẫn `[n] Nguồn` — dữ liệu nội bộ đã dùng.
- Khung suy luận "Phân tích của AI" giờ có nội dung thật.

---

## 5. Kiểm thử

```bash
npm test
```

117 test, gồm 9 file:

| File | Nội dung |
|---|---|
| `chemBalance.test.js` | parse công thức, hydrat, khối lượng mol, cân bằng, bảo toàn |
| `aiTools.test.js` | trích công thức/số liệu, từng công cụ, đối chiếu đáp án |
| `aiKnowledge.test.js` | truy xuất theo mô tả, tên không dấu, công thức chính xác |
| `aiRouter.test.js` | phân loại tác vụ, tầng model, key ring, chuỗi provider, `coreText` |
| `aiPrompts.test.js` | ghép prompt, 6 chế độ học, kế hoạch request |
| `aiMemory.test.js` | tóm tắt, nén hội thoại, hồ sơ học tập |
| `aiEngine.test.js` | **luồng thật**: giả lập SSE Gemini/Groq, suy luận, tự kiểm tra, cache, 429 |
| `aiOcrFallback.test.js` | nhánh OCR dự phòng khi không có Gemini, và nhánh OCR thất bại |

---

## 6. Cách bật/tắt nhanh

| Muốn gì | Làm gì |
|---|---|
| Tiết kiệm token (không suy luận sâu) | `VITE_AI_THINKING=0` |
| Giảm độ trễ bằng đua provider | `VITE_AI_HEDGE_MS=1400` |
| Tắt OCR dự phòng | `VITE_AI_OCR=0` |
| Tắt cache | `VITE_AI_CACHE=0` |
| Tăng hạn mức | Thêm key thứ 2 vào `VITE_GEMINI_KEY=key1,key2` |
| Đổi model | `VITE_AI_MODEL_SMART=…`, `VITE_AI_MODEL_VISION=…` |
| Kiểm tra trạng thái trong trình duyệt | `__getAIStatus()`, `__planAI('câu hỏi')`, `__clearAICache()` |

---

## 7. Việc nên làm tiếp

1. **Chuyển AI qua Cloud Function** (`aiProxy`) để giấu key, chặn lạm dụng và đếm quota phía server
   — khung đã có ở `src/lib/functionsClient.js`, hiện **chưa** được nối vào `main.jsx`.
2. Áp dụng lớp công cụ + tri thức cho **Teacher Studio AI** (`examAiUtils.js`, `matrixAiService.js`)
   để sinh đề có đáp án đã được máy kiểm chứng.
3. OCR preview: cho người học sửa phần đề AI đọc được trước khi giải.
4. Lưu câu hỏi khó vào Sổ tay lỗi / flashcard bằng 1 nút từ câu trả lời AI.
5. Bật `noteWeakTopic()` từ kết quả quiz sai để hồ sơ học tập tự cập nhật.
