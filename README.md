# ELEC AI — Hệ điều hành ôn tập Hóa học cho THPT

Repo: `DuyTKTB/Aitk` · package: `chem-study`

Ứng dụng web (SPA) học Hóa học lớp 10–12: **ELEC AI** (trợ lý AI đa provider), bảng tuần hoàn 118
nguyên tố, công cụ Hóa, quiz + SRS, sổ tay lỗi, lớp học/đề thi, chấm phiếu A4 (OMR), trò chơi và PWA.

## Chạy dự án

```bash
npm install
cp .env.example .env      # điền key Firebase / Supabase / AI
npm run dev               # http://localhost:5173
npm run build             # build production vào dist/
npm test                  # chạy 117 unit + integration test của lớp AI
```

## Cấu hình môi trường

Xem [.env.example](.env.example). Các biến quan trọng:

| Biến | Ý nghĩa |
|---|---|
| `VITE_FIREBASE_*` | Cấu hình Firebase (Auth, Firestore, Storage) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Lịch sử chat AI |
| `VITE_GEMINI_KEY` | Provider **đọc ảnh** (vision) + model mạnh. Hỗ trợ **nhiều key** cách nhau `,` |
| `VITE_GROQ_API_KEY` | Provider nhanh, hỗ trợ `reasoning_effort` |
| `VITE_AGNES_API_KEY` | Provider dự phòng |
| `VITE_AI_MODEL_FAST` / `_SMART` / `_VISION` | Ghi đè danh sách model theo tầng |
| `VITE_AI_THINKING=0` | Tắt suy luận sâu (tiết kiệm token) |
| `VITE_AI_HEDGE_MS=1400` | Bật chạy song song 2 provider để giảm độ trễ |
| `VITE_AI_OCR=0` | Tắt OCR dự phòng trên thiết bị |

> ⚠️ Biến `VITE_*` nằm trong bundle phía client. Muốn giấu key thật, hãy chuyển sang Cloud Function
> (khung `src/lib/functionsClient.js` đã có sẵn) — xem mục *Bảo mật* trong
> [docs/AUDIT-NANG-CAP-AITK.md](docs/AUDIT-NANG-CAP-AITK.md).

## Lớp AI (v4)

Chi tiết đầy đủ: **[docs/AI-NANG-CAP.md](docs/AI-NANG-CAP.md)**

| Module | Vai trò |
|---|---|
| `src/lib/ai.js` | Động cơ: chọn provider, fallback, streaming, cache, tự kiểm tra |
| `src/lib/aiRouter.js` | Phân loại tác vụ, chọn tầng model, xoay nhiều API key, dò model Gemini |
| `src/lib/aiPrompts.js` | Ghép system prompt: lớp học, chế độ học, ngữ cảnh, chống prompt-injection |
| `src/lib/aiTools.js` | Công cụ tính chính xác: khối lượng mol, cân bằng PTHH, mol/nồng độ/pH, theo phương trình |
| `src/lib/aiKnowledge.js` | Truy xuất dữ liệu chuẩn của app (công thức, hợp chất, nguyên tố, phản ứng, chuyên đề) |
| `src/lib/aiMemory.js` | Nén hội thoại dài + hồ sơ học tập theo người dùng |
| `src/lib/aiOcr.js` | OCR dự phòng khi không có provider đọc ảnh |
| `src/lib/chemBalance.js` | Lõi hóa học thuần (dùng chung cho UI và AI) |

Giao diện trang AI: [docs/UI-AI.md](docs/UI-AI.md) — CSS đã gộp còn 2 file
(`src/styles/aichat.css` + `src/styles/ai-intelligence.css`), icon SVG không dùng emoji.

Nguyên tắc cốt lõi: **AI không tự bịa phần số học**. Mọi phép tính (khối lượng mol, hệ số phương
trình, số mol, thể tích, pH) do công cụ nội bộ tính trước rồi mới đưa vào prompt; sau khi AI trả lời,
kết quả được đối chiếu lại với công cụ và gắn cảnh báo nếu không khớp.

## Cấu trúc chính

```
src/
  components/     # UI: Home, AIChat, Tools, Quiz, lớp học, admin, games…
  lib/            # Động cơ AI, Firebase, exam, quota, tiện ích
  data/           # Dữ liệu Hóa: nguyên tố, hợp chất, phản ứng, chuyên đề
  styles/         # CSS theo trang (aichat.css = gộp 8 lớp CSS của trang AI)
tests/            # 117 test cho lõi AI (vitest)
functions/        # Cloud Functions: webhook thanh toán, hạ VIP
```

## Kiểm thử

```bash
npm test              # chạy toàn bộ
npm run test:watch    # chế độ theo dõi
```

Bộ test bao phủ: parse công thức & cân bằng phương trình, công cụ tính, truy xuất tri thức,
phân loại tác vụ & prompt, bộ nhớ, và **luồng gọi AI đầy đủ** (giả lập SSE của Gemini/Groq,
cả nhánh OCR dự phòng và nhánh hết quota).
