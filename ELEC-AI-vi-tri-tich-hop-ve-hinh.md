# ELEC AI — Nên đặt "chức năng vẽ hình" ở đâu?

> Giả định: "chức năng đó" = **bộ dựng hình theo từng bước** (engine lệnh hình học + bảng vẽ + vòng tự kiểm) như Măng Non, không phải một tính năng khác.
> Mọi con số/đường dẫn dưới đây đọc trực tiếp từ repo `D:\Tải Xuống\app` ngày 10/11/2026. Chỗ nào là suy luận sẽ ghi rõ.

---

## 1. Hiện trạng web của bạn (đã kiểm)

| Hạng mục | Thực tế trong repo |
|---|---|
| Tên / origin | `package.json` → `"name": "elec-science-ai"`, `version 1.0.0`; `src/hooks/useSeoHead.js` → `SITE_ORIGIN = 'https://aitk-ten.vercel.app'` |
| Stack | React `18.3.1`, Vite `^5.4.11`, Firebase `^12.19.0`, Supabase `^2.117.2` |
| Thư viện liên quan | `katex ^0.19.0`, `three ^0.169.0`, `tesseract.js ^7.0.0` (OCR), `html2canvas ^1.4.1`, `jspdf ^4.2.1`, `pdfjs-dist ^6.4.299` |
| Quy mô | 244 file `.jsx` trong `src/components` |
| Route chính | `/tro-ly-ai-giai-hoa` (trợ lý AI), `/tai-lieu-hoa-hoc` (kho công cụ), `/phong-thi-ao`, `/lo-trinh-on-thi-thpt-quoc-gia`, `/quiz`, `/cong-thuc-hoa-hoc`, `/bang-tuan-hoan`, `/can-bang-phuong-trinh-hoa-hoc`, `/tinh-diem-xet-tuyen-dai-hoc` |
| Động cơ AI | `src/lib/ai.js` (52.284 byte) — header tự mô tả **v4**: định tuyến tác vụ, grounding, công cụ tính chính xác, tự kiểm tra, xoay nhiều API key khi 429, OCR dự phòng, cache bền |
| Prompt | `src/lib/aiPrompts.js` (13.441 byte) — ghép lớp 7 khối, `GRADES = ['Lớp 10','Lớp 11','Lớp 12','Đại học']` |
| Màn hình chat | `src/components/AIChat.jsx` — **103.267 byte / 2.576 dòng**, đã có upload ảnh, quota, credit, TTS, quiz canvas, `MarkdownLike` |
| Kho công cụ | `src/components/ToolsPage.jsx` (55.922 byte) — mảng `TOOLS = [{ id, name, desc, Icon, tag }]` |
| Bài học | `src/components/roadmap/DedicatedLessonView.jsx` (57.233 byte) |
| Công thức | `src/components/MathText.jsx` (3.991 byte) + `ChatMarkdown.jsx` (12.282 byte), dùng KaTeX |

**Kết luận quan trọng:** web của bạn **chưa có engine hình học nào**. Quét toàn `src/`:
- `GeoGebra` xuất hiện **1 lần** — chỉ là link thư mục công cụ ngoài trong `ToolsPage.jsx`;
- `vẽ hình` xuất hiện **1 lần** — trong `src/prompts/hocToan.js` (prompt văn bản);
- `geometry` chỉ có **1 lần** — trong `src/features/lab3d/Scene.jsx` (three.js cho phòng lab 3D).

Nghĩa là: bạn đã có **não rất tốt** (routing, grounding, tools, verify) nhưng **thiếu tay vẽ**. Đây là mảnh ghép còn trống, và nó nên được thêm như một **năng lực dùng chung**, không phải một trang riêng lẻ.

---

## 2. Nguyên tắc quyết định vị trí

Ba câu hỏi phải trả lời trước khi chọn chỗ:

1. **Hình có sống lâu hơn tin nhắn không?** Có → không được nằm trong bubble chat.
2. **Hình có bị sửa qua nhiều bước không?** Có → nó là **state machine**, không phải output stream.
3. **Hình có dùng lại ở nhiều màn hình không?** Có → phải là **một component duy nhất**, nhiều bề mặt gọi tới.

Cả 3 câu đều "Có" ⇒ **đừng nhét vào markdown**. Đây là lỗi phổ biến nhất khi tích hợp vẽ hình: render SVG vào câu trả lời → cuộn mất, không zoom được, bước sau vẽ lại từ đầu, không chụp ảnh được.

---

## 3. Đề xuất: 3 lớp + 5 điểm chèn

### Lớp 1 — Engine (không có UI, không biết React)

```
src/lib/geometry/
  mvParser.js      // tách chuỗi "H = Foot(A, P)" → {ten, lenh, args}
  mvEngine.js      // dựng đối tượng, phụ thuộc, đo đạc, giải nghiệm số
  mvCommands.js    // bảng đặc tả lệnh: alias | min | max | signature
  mvValidate.js    // chạy thử, bắt lỗi, đo lại giả thiết, so kiemTra
  mvProject3d.js   // chiếu 3D → 2D (ma trận nhìn, sắp xếp theo chiều sâu)
  index.js
```

**Chọn engine thế nào (3 phương án, theo chi phí tăng dần):**

| Phương án | Ưu | Nhược |
|---|---|---|
| **CindyJS / JSXGraph** (nhúng iframe hoặc import) | Có sẵn lệnh hình học, 3D cơ bản; đi nhanh nhất | Nặng, khó kiểm soát UI, khó "highlight theo bước" |
| **Rust → WASM tự viết** (như Măng) | Nhẹ (~1 MB), chính xác, offline, chạy được desktop | 2–4 tháng công; phải tự làm solver |
| **JS thuần tự viết** | Kiểm soát 100%, nhẹ | Chậm hơn, phải tự viết tất cả |

> Khuyến nghị thực dụng: **P0 dùng JSXGraph** để ra bản chạy được trong 1–2 tuần; **P2** mới tính port sang WASM nếu cần offline/desktop.

### Lớp 2 — Component bảng vẽ (dùng chung)

```
src/components/geometry/
  GeometryBoard.jsx      // canvas + zoom/pan + replay theo bước + chụp ảnh
  GeometryBoard.css
  BoardToolbar.jsx       // phát lại, tua bước, đổi góc nhìn, tải PNG
  BoardSteps.jsx         // danh sách bước, bấm để nhảy
```

Hợp đồng props tối thiểu:

```js
<GeometryBoard
  steps={[{ ve: ['A = (0,0)', 'B = (3,0)', 'C = …'], moTa: 'Dựng tam giác ABC' }]}
  dang="hinh_phong"      // chọn hệ trục / chế độ 2D-3D
  activeStep={2}
  onStepChange={fn}
  onSnapshot={(pngBlob) => …}   // lưu vào Sổ tay câu sai
/>
```

### Lớp 3 — Prompt + schema (nối vào hệ có sẵn)

```
src/prompts/hinhHoc.js          // prompt planner: phân loại dạng + sinh "ve" theo bước
src/lib/geometry/schema.js      // JSON schema để ép model trả đúng khuôn
src/lib/aiTools.js              // thêm tool "ve_hinh" vào danh sách tool hiện có
```

Điểm nối đã có sẵn trong code: `ai.js` đã có `runTools`, `verifyToolResults`, `buildSystemPrompt`. Bạn **không cần viết lại động cơ AI** — chỉ cần thêm một tool mới và một prompt mới.

---

## 4. Năm điểm chèn, theo thứ tự ưu tiên

| # | Bề mặt | Vị trí chèn | Ưu tiên | Lý do |
|---|---|---|---|---|
| 1 | **Trợ lý AI** `/tro-ly-ai-giai-hoa` | `AIChat.jsx`: thêm cột phải `ds-board` (desktop ≥1024px), mobile dùng bottom-sheet | **P0** | Đây là nơi 100% người dùng đang giải bài; hình phải xuất hiện **cạnh** lời giải, không chen vào |
| 2 | **Kho công cụ** `/tai-lieu-hoa-hoc` | Thêm 1 phần tử vào mảng `TOOLS`: `{ id:'board', name:'Bảng vẽ hình', desc:'Dựng hình & xem từng bước', Icon:IconShape, tag:'new' }` → route `/bang-ve-hinh` | **P1** | Cho người dùng muốn vẽ tay/không muốn chat; cũng là trang SEO riêng |
| 3 | **Bài học lộ trình** `DedicatedLessonView.jsx` | Khối hình bên trái/phải nội dung bài, đồng bộ theo `activeStep` của bài | **P1** | Bài hình học không có hình là bài giảng chết; đây là chỗ tăng giá trị nhất |
| 4 | **Phòng thi ảo + xem lại** `/phong-thi-ao`, `VirtualExamRoom.jsx` | Trong phần "giải chi tiết từng câu": nếu câu có hình → mở board trong modal | **P2** | Tăng chất lượng lời giải nhưng không chặn luồng thi |
| 5 | **Giáo viên** `teacher/TeacherAiCopilot.jsx` | Nút "chèn hình" khi soạn phiếu bài tập | **P2** | Giáo viên cần hình để in — nhưng phụ thuộc P0 xong đã |

**Nơi KHÔNG nên đặt:**

- `ChatMarkdown.jsx` (bong bóng chat): hình sẽ cuộn mất, mỗi bước lại render mới, không zoom, không chụp.
- `InteractiveQuizCanvas.jsx`: đó là canvas cho câu trắc nghiệm tương tác, mục đích khác.
- `games/*`: game là sản phẩm khác, đừng trộn.
- `Lab3D` (three.js): đừng tái dụng — three.js dựng cảnh, không dựng **hình học có ràng buộc** (vuông góc, trung điểm, thiết diện). Trộn vào sẽ vỡ cả hai.

---

## 5. Luồng UI cụ thể ở P0 (màn hình chat)

```
┌──────────────────────────────┬─────────────────────┐
│  Hội thoại (giữ nguyên)      │  Bảng vẽ            │
│  - câu hỏi                   │  ┌───────────────┐  │
│  - ảnh đề (upload)           │  │  hình 2D/3D   │  │
│  - lời giải từng bước        │  └───────────────┘  │
│    (bấm bước nào → bảng      │  [◀ ▶] Bước 2/5     │
│     nhảy tới bước đó)        │  [Chụp] [Tải PNG]   │
└──────────────────────────────┴─────────────────────┘
```

Hành vi bắt buộc (lấy từ cách Măng làm, đã kiểm chứng ở báo cáo trước):

1. **Bước 1 chỉ vẽ giả thiết**, chưa giải.
2. Mỗi bước **chỉ thêm** vật mới; vật cũ giữ nguyên, không vẽ lại.
3. Vật mới **highlight rồi fade** — người học thấy cái gì vừa xuất hiện.
4. Đường khuất **nét đứt**; khối bị khoét phải có **lỗ thật**; thiết diện **gạch mặt cắt**.
5. Điểm dẫn xuất (`trung điểm`, `chân đường cao`, `giao điểm`) do **engine dựng**, AI **cấm gõ toạ độ tự tính**.
6. Chụp ảnh → lưu vào `WrongNotebook` (bạn đã có `recordWrongAnswers` trong `AIChat`).

---

## 6. Hợp đồng dữ liệu (rút gọn, đủ để bắt đầu)

```json
{
  "dang": "hinh_khong_gian",
  "deBai": "Cho hình chóp S.ABCD …",
  "buoc": [
    { "moTa": "Dựng đáy và đỉnh",
      "ve": ["A = (0,0,0)", "B = (4,0,0)", "D = (0,3,0)",
             "C = A + (B-A) + (D-A)", "S = (0,0,5)",
             "day = Polygon(A,B,C,D)", "chop = Pyramid(A,B,C,D,S)"] },
    { "moTa": "Dựng chân đường cao",
      "ve": ["H = Foot(S, Plane(A,B,C,D))", "SH = Segment(S,H)"] }
  ],
  "kiemTra": [
    { "bieuThuc": "Distance(S,H)", "giaTri": "5" }
  ]
}
```

`dang` nên dùng đúng bộ giá trị đã khảo sát (đã kiểm chứng trong bundle Măng): `do_thi`, `toa_do_phang`, `hinh_phang`, `toa_do_khong_gian`, `hinh_khong_gian`, `thong_ke`, `so_do`, `khong`.

Bộ lệnh tối thiểu để dùng được ngay (khoảng 25 lệnh, đã đối chiếu bảng đặc tả của Măng): `Point`, `Midpoint`, `Foot`, `Intersect`, `Segment`, `Line`, `Polygon`, `Polyline`, `Circle`, `Arc`, `Perpendicular`, `Parallel`, `Bisector`, `PerpBisector`, `Tangent`, `Angle`, `Mark`, `Text`, `Plane`, `Pyramid`, `Prism`, `Sphere`, `Cone`, `Cylinder`, `Section`, `Distance`, `Area`, `Volume`, `Slope`, `Derivative`, `Root`, `Extremum`, `Integral`, `Animate`.

---

## 7. Ba rủi ro phải xử lý trước khi code

### (a) `AIChat.jsx` đã quá lớn — đừng nhồi thêm

**103.267 byte / 2.576 dòng** cho một file là mức báo động. Nếu thêm board vào đây, file sẽ vượt 130 KB và gần như không review được.

Cách làm đúng: tách trước, thêm sau.

```
AIChat.jsx (vỏ + điều phối)
  ├── chat/ChatSidebar.jsx      (cg-* hiện có)
  ├── chat/ChatThread.jsx
  ├── chat/ChatComposer.jsx
  └── chat/ChatBoardPane.jsx    ← mới, chỉ ~120 dòng
```

### (b) Mâu thuẫn LaTeX đang có trong prompt

`src/prompts/hocToan.js` ghi rõ: *"ĐỊNH DẠNG: Không dùng LaTeX. Công thức viết Unicode: x², √a, ∫, Σ."*

Nhưng repo **đã có** `MathText.jsx` + `ChatMarkdown.jsx` render **KaTeX**, và `katex` nằm trong dependencies.

⇒ Nếu vẽ hình mà nhãn điểm/công thức lại là Unicode thì hình sẽ xấu và sai chuẩn. **Phải chốt một quy ước duy nhất** trước khi làm board; khuyến nghị: LaTeX trong `$...$`, KaTeX render.

### (c) Tương thích máy cũ (bạn ưu tiên iPhone cũ / Safari)

- WASM chạy được từ iOS 11.3+, nên engine WASM **không** phải vấn đề.
- Vấn đề là cú pháp JS: tránh optional chaining `?.`, nullish `??`, `Array.at()`, top-level await trong code mới nếu còn phải phục vụ Safari cũ **chưa qua Babel**. Kiểm tra `vite.config` target trước khi viết.
- Canvas + `requestAnimationFrame` cho replay là an toàn nhất; tránh WebGL cho hình 2D.

---

## 8. Lộ trình 3 sprint (đề xuất)

| Sprint | Việc | Kết quả nhìn thấy được |
|---|---|---|
| **S1** | `mvCommands` + `mvEngine` (JSXGraph) cho **2D phẳng** + `GeometryBoard` + prompt `hinhHoc.js` + nối vào `AIChat` cột phải | Giải 1 bài hình phẳng lớp 10 → hình hiện cạnh lời giải, bấm bước để xem |
| **S2** | 3D (`Pyramid`, `Prism`, `Plane`, `Section`) + `mvValidate` (đo giả thiết, so `kiemTra`) + chụp PNG lưu `WrongNotebook` | Bài hình không gian lớp 11–12 có hình đúng; có vòng tự kiểm |
| **S3** | Thẻ `TOOLS` + route `/bang-ve-hinh`; nhúng vào `DedicatedLessonView`; đồ thị hàm số (`do_thi`) cho Toán/Lý | 4 bề mặt dùng chung một engine |

---

## 9. Tóm lại

- **Đặt ở đâu:** engine ở `src/lib/geometry/`, UI ở `src/components/geometry/`, prompt ở `src/prompts/hinhHoc.js`; **lần đầu xuất hiện** trong `/tro-ly-ai-giai-hoa` dưới dạng **cột phải của AIChat**, sau đó mở rộng ra Kho công cụ → Bài học → Phòng thi → Giáo viên.
- **Đừng:** nhét vào markdown, đừng dùng three.js, đừng để AI gõ toạ độ.
- **Điều đáng copy nhất từ Măng:** không phải engine, mà là **vòng tự kiểm** — engine đo lại giả thiết và đáp số rồi bắt model sửa. Bạn đã có `verifyToolResults` trong `ai.js`, nên chỉ cần mở rộng nó cho hình học là có ngay lợi thế.
- **Việc phải làm trước:** tách `AIChat.jsx`, chốt quy ước LaTeX, xác nhận `vite.config` target có hỗ trợ Safari cũ hay không.
