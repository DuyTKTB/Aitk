# Măng Non (mangnon.io.vn) — Phân tích kiến trúc, cách AI vận hành và cách vẽ hình

> Thời điểm khảo sát: 10/11/2026. Nguồn: HTML/JS/WASM tải trực tiếp từ site (`/`, `/hoc`, `/bai/{id}`, `/assets/index-DgHWWIIW.js` 1,27 MB, `/ve.wasm` 993 KB, `/ban-dung.json`), header HTTP, và các prompt/schema nhúng trong bundle.
> Phần nào là **suy luận** sẽ được ghi rõ; phần còn lại là bằng chứng đọc được từ code.

---

## 1. Kết luận trong một câu

Đây **không phải** một web "chatbot toán" thông thường. Nó là một **máy dạy học 2 tầng**:

- **Tầng "não"**: LLM (DeepSeek) không vẽ hình, chỉ **lập kế hoạch** và **viết lời** dưới dạng JSON bị ràng buộc bởi schema.
- **Tầng "bảng"**: một **engine hình học viết bằng Rust, biên dịch ra WebAssembly** (`ve.wasm`) tự dựng hình, tự đo, tự giải số, chạy ngay trên máy học sinh.

Hình vẽ **không phải ảnh AI sinh ra**. Nó là **hình học thật**, dựng từ ~60 lệnh dạng GeoGebra (`Point`, `Foot`, `Prism`, `Revolve`…), nên mọi số đo trong hình là số đo đúng, không "vẽ cho giống".

---

## 2. Stack kỹ thuật

| Lớp | Công nghệ | Bằng chứng |
|---|---|---|
| Frontend | **React + Vite**, SPA mount vào `<div id="root">` | `home.html` chỉ 1.498 byte, `<script type="module" src="/assets/index-DgHWWIIW.js">` |
| Bundle | 1 file JS 1,27 MB + CSS 116 KB, code minify | `index.js`, `index.css` |
| Web server / proxy | **Caddy** | Header `Via: 1.1 Caddy`, `Alt-Svc: h3=":443"` (HTTP/3) |
| Engine hình học | **Rust → WASM**, 993.683 byte | `ve.wasm`, chuỗi `/rustc/58cf8f9c…/library/…`, `panicked at` |
| Render | **Canvas 2D** tự viết (không three.js, không SVG cho hình) | 13× `getContext('2d')`, `CanvasRenderer`, `Path2D`, `requestAnimationFrame` |
| Công thức | **KaTeX** | 42 lần `katex`, 8 lần `KaTeX` |
| Font | Baloo 2 (tiêu đề), Be Vietnam Pro (thân), Patrick Hand (nét viết tay) | `<link href="fonts.googleapis.com/css2?family=Baloo+2…">` |
| Auth | **Google OAuth**, session cookie `same-origin` | `/api/auth/google/start`, `/api/auth/logout` |
| Desktop app | **Tauri** (cùng codebase) | `__TAURI_INTERNALS__`, lệnh `goi_ai`, event `ai-tien-do`, `tauri://window-created` |
| AI | **DeepSeek `deepseek-flash`** cho cả 4 tác vụ | `VITE_AI_MODEL_GIAI/BUOC/HOI/ANH = 'deepseek-flash'` |

Chi tiết build: `{"DEV":false,"MODE":"production","PROD":true,"SSR":false}` — **SSR tắt**, body do client render; chỉ `<head>` (title/OG) được server bơm sẵn cho từng bài để chia sẻ Facebook/Zalo.

`/ban-dung.json` → `{"ban":"mwasiy3b"}` là **mốc phiên bản build**, dùng để client biết có bản mới mà reload.

---

## 3. Bản đồ route & API

**Route (client):**

| Route | Nội dung |
|---|---|
| `/` | Trang chủ: hero + thư viện bài giải (lọc theo chủ đề, sắp theo mới/xem/tim) |
| `/hoc` | Bảng học + **luồng "soạn bài nhờ AI khác"** (xem §7) |
| `/bai/:id` | Bài giải: đề, hình vẽ, các bước, bảng phụ, chia sẻ, QR |
| `/bai-cua-toi` | Bài của tôi (cần đăng nhập) |
| `/nguoi/:id` | Trang người dùng |

**API phát hiện được:**

| Endpoint | Vai trò |
|---|---|
| `POST /api/ai` | **Proxy LLM** — trả về **SSE** (`text/event-stream`) |
| `GET /api/bai/{id}/hinh.jpg?v={anh}` | Ảnh hình vẽ dạng JPEG (server render, có version `anh` để cache-bust) |
| `POST /api/bai/{id}/thich` · `/meo` · `/anh` | Tim · mẹo · ảnh |
| `GET /api/tts/config` · `POST /api/tts` | Text-to-speech (hiện **tạm ngưng**: `{"loi":"Giọng đọc đang tạm ngưng."}`) |
| `GET /api/auth/google/start` · `POST /api/auth/logout` | Đăng nhập/ra |
| `GET /api/...` (wrapper) | REST chung, header `X-Mang-Request`, `X-Mang-User` |

**Bảo mật:** mọi thứ đều **auth-gated**. Gọi `/api/ai` khi chưa đăng nhập:

```json
HTTP/1.1 401 Unauthorized
{"canDangNhap":true,"loi":"Đăng nhập Google để hỏi Măng nhé."}
```

→ API key LLM **không bao giờ lộ ra client**, toàn bộ đi qua proxy. Đây là điểm làm đúng.

**Lưu ý SEO:** `/` có `<meta name="robots" content="noindex">`; `/robots.txt` và `/sitemap.xml` **đều 404**. Nghĩa là site **cố tình không index** (giai đoạn beta nội bộ), chỉ sống bằng link chia sẻ + QR.

---

## 4. Mô hình dữ liệu: một "bài giải" là gì?

AI trả về **một object JSON duy nhất**, được kiểm bằng **Zod** rồi mô tả lại thành JSON-Schema để nhét vào prompt (`Return ONE json object with exactly this structure…`).

**Enum `dang` (dạng hình) — quyết định engine vẽ gì:**

```js
wy = ['do_thi','toa_do_phang','hinh_phang','toa_do_khong_gian',
      'hinh_khong_gian','thong_ke','so_do','khong']

Ty = {
  do_thi:            {hinh:'2d', heTruc:true},   // đồ thị hàm số
  toa_do_phang:      {hinh:'2d', heTruc:true},   // Oxy
  hinh_phang:        {hinh:'2d', heTruc:false},  // hình phẳng
  toa_do_khong_gian: {hinh:'3d', heTruc:true},   // Oxyz
  hinh_khong_gian:   {hinh:'3d', heTruc:false},  // hình không gian
  thong_ke:          {hinh:'2d', heTruc:true},   // biểu đồ cột / histogram
  so_do:             {hinh:'2d', heTruc:false},  // sơ đồ (Venn, cây, xúc xắc, mindmap)
  khong:             {hinh:'khong',heTruc:true}  // không có hình
}
```

**Các trường chính của bài giải:**

| Trường | Ý nghĩa |
|---|---|
| `deBai` | Đề bài đã chép lại (LaTeX trong `$...$`) |
| `loai` | `bai_tap` · `thuc_hanh` · `giai_thich` · `tro_chuyen` · `ngoai_pham_vi` |
| `dinhHuong[]` | 2–4 gạch đầu dòng **nói bằng lời** cách giải, **không số** (để giáo viên nói trước) |
| `buoc[]` | 3–7 bước, mỗi bước có `ketQua` (nội dung chính xác), `ve[]` (lệnh vẽ), `huong` (ứng với gạch đầu dòng nào), `hinhMoi` (có cần bảng mới không) |
| `dapSo` | Đáp số cuối |
| `kiemTra[]` | Biểu thức **engine đo được** + giá trị AI khẳng định → dùng để tự kiểm |
| `tinhSo[]` | Nghiệm số: `{ten, dinhNghia[], phuongTrinh, tu, den, lamTron}` → engine giải, điền `{{m}}` |
| `khoiDong` | 1 câu trắc nghiệm khởi động (khi bài không có hình) |
| `soDo` | Dữ liệu riêng cho sơ đồ: `{loai: giu|cay|venn|xuc_xac|tu_duy, nut[], tap[], vung[]}` |

Hai chi tiết rất "sư phạm":

- **Tên phải trùng đề**: `A'`, `B'`, `O'` giữ nguyên, cấm đổi thành `A1`, `A_1` trừ khi đề viết `A₁`.
- **Không bịa lý do**: mọi "vì / nên / do đó" phải là định nghĩa–định lý–tính toán thật; số liệu trùng nhau chỉ vì đề cho thì phải nói "trùng hợp với số liệu của đề".

---

## 5. Cách AI "vẽ được hình" — trái tim của hệ thống

### 5.1 LLM không vẽ. LLM viết **lệnh**.

Prompt planner (`viec = giai`) nói thẳng:

> "DRAWING IS PLANNED HERE, STEP BY STEP (the app draws exactly this; the model that later words each step does not draw). Every `buoc` has `ve`: the MV statements that put on the board ONLY what this step introduces."

Và một luật cực quan trọng:

> "Derived objects are CONSTRUCTED so the app computes them exactly: `H = Foot(A, P)`, `M = Midpoint(S, C)`, `I = Intersect(d, P)`, `d = Perpendicular(A, P)`, `O = Circumcenter(A, B, C)`. **NEVER type coordinates you computed** — only the givens of the problem get coordinates."

Đây chính là lý do hình **luôn đúng**: AI chỉ được đặt toạ độ cho **giả thiết**, còn mọi điểm dẫn xuất đều để engine **tự dựng bằng phép dựng hình**. AI không có cơ hội "bịa toạ độ".

### 5.2 Bộ lệnh MV (~60 lệnh, tương thích tư duy GeoGebra, có alias tiếng Việt)

Engine nhúng sẵn **bảng đặc tả lệnh** trong `ve.wasm` (định dạng `alias|min|max|signature`). Trích nhóm chính:

| Nhóm | Lệnh tiêu biểu |
|---|---|
| Điểm & dựng hình | `Point`, `Midpoint/trungdiem`, `Foot/chan/hinhchieu`, `Intersect/giao`, `Centroid/trongtam`, `Circumcenter/tamngoaitiep`, `Incenter/tamnoitiep`, `Orthocenter/tructam` |
| Biến đổi | `Reflect/doixung`, `Rotate/quay`, `Translate/tinhtien`, `Dilate/vitu` |
| Đối tượng 1D/2D | `Segment`, `Line`, `Ray`, `Vector`, `Polyline`, `Polygon`, `Circle`, `Arc`, `CircumcircularArc`, `Curve`, `Implicit` |
| Quan hệ | `Perpendicular/vuonggoc`, `Parallel/songsong`, `Bisector/phangiac`, `PerpBisector/trungtruc`, `Tangent/tieptuyen`, `Mark`, `Angle/goc` |
| Khối 3D | `Pyramid/chop`, `Prism/langtru`, `Sphere/matcau`, `Cylinder/tru`, `Cone/non`, `Hemisphere/bancau`, `Plane/matphang`, `Section/thietdien`, `Revolve/khoitronxoay`, `RevolveY` |
| Boolean khối | `Union/hopkhoi`, `Difference/hieukhoi` (khoét lỗ **thật**), `Intersection`, `Cut/catbo` (mặt cắt có gạch hatch) |
| Đo & giải tích | `Distance`, `Length`, `Perimeter`, `Area`, `Volume`, `Slope`, `Derivative`, `Root`, `Extremum`, `Integral`, `Region/mien`, `BarChart`, `Histogram` |
| Kiểm chứng | `IsOn`, `ArePerpendicular`, `AreParallel`, `AreEqual`, `AreCollinear`, `AreCoplanar`, `AreConcyclic` |
| Hoạt ảnh | `Animate(start, end, seconds[, "loop"])` → mọi vật dựng từ `t` sẽ **chuyển động** |

Ví dụ một dòng lệnh thật trong prompt minh hoạ: `H = Foot(A, Plane(S,B,C))`, `d = Intersect(Plane(...), Prism(...))`, `V = Revolve(f, g, a, b, Line((0,1),(1,1)))` (xoay quanh đường **xiên**).

Có cả "tips theo dạng hình" cho đồ thị: điểm đặc biệt bằng `Extremum(f,1)`, nghiệm bằng `Root(f,1)`, điểm khuyết `P = (2,4) | hollow`, tiệm cận `tc: x = 2 | dash`, miền nghiệm `Region(...)`.

### 5.3 Vì sao engine phải là WASM?

Ba lý do đọc được từ code:

1. **Tính toán chính xác trên máy học sinh** — dựng `Intersect`, `Foot`, `Circumcenter`, nghiệm `Root`, tích phân `Integral`… đều là phép số học hình học, không thể "đoán".
2. **Solver số cho `tinhSo`** — khi đáp số không có dạng đóng, AI chỉ đưa phương trình (`pi*Integral(h,0,m) = pi/3`) + khoảng `[tu, den]`, engine tự tìm nghiệm và điền vào chỗ `{{m}}`.
3. **Chạy offline + desktop** — cùng file `.wasm` dùng cho bản Tauri, và **không tốn token** cho việc vẽ.

### 5.4 Hình hiện ra "từng bước" như giáo viên viết bảng

Planner chia lệnh vẽ theo bước (bước 1 = chỉ giả thiết, bước sau thêm vật mới). Khi phát lại:

- Đối tượng mới của bước được **highlight**, sau đó **mờ đi** (app tự quyết màu, AI bị cấm đoán màu).
- Đường khuất **tự vẽ nét đứt**; khối bị khoét có **lỗ thật**; hình cắt tự **gạch mặt cắt**.
- `Animate` cho điểm chạy → AI được nhắc: "vật có `chuyenDong: true` đang chuyển động, toạ độ bị bỏ, đừng coi vị trí lệch là lỗi".

### 5.5 Ba vòng tự kiểm — chỗ này mới là "chất"

Đây là phần khiến hình không "vẽ sai mà vẫn tự tin":

**(a) Vòng lệnh lỗi → sửa cú pháp** (`suahinh:cu_phap`)

> "You repair drawing statements that failed to run. The app ran the planned `ve` statements of each step; some failed (errors below). Rewrite ONLY the steps listed: fix how the statements are written… keeping every object name… the same coordinates and the same meaning."

**(b) Vòng giả thiết không thoả → sửa hình** (`suahinh` dạng hình học)

> "The statements run, but the measured givens listed below do not hold. The givens of the exercise are invariant… If the givens cannot be satisfied with the supported commands, return `{"sua":[]}` so the app can handle the unresolved failure."

Tức là: engine **đo lại** các giả thiết (vuông góc, song song, bằng nhau, độ dài) rồi so với đề; lệch thì bắt AI dựng lại.

**(c) Vòng đáp số lệch → giải lại từ đầu**

> "The app built your `hinhVe` with its drawing engine and evaluated `kiemTra`: — `{biểu thức}`: the drawing engine measures `{doDuoc}`, but you stated `{giaTri}` (≈ `{aiNeu}`). Either the computation or the figure is wrong. **Re-solve the exercise from scratch**…"

Đây chính là con số **"41% đã đo lại đáp số"** trên trang chủ: tỷ lệ bài có ít nhất một phép đo đối chiếu giữa engine và lời giải AI.

Ngoài ra còn một bộ kiểm **đẳng thức bằng lấy mẫu** ("the app found an equality that fails at sampled values") — thay giá trị vào hai vế để phát hiện biến đổi sai.

### 5.6 Kiến trúc 2 model cho một bài

Đây là điểm thiết kế đáng học nhất:

| Vai (`viec`) | Model | Làm gì |
|---|---|---|
| `giai` (planner) | `deepseek-flash`, `VITE_AI_EFFORT_GIAI='high'` | Đọc đề → phân loại → giải → **lên kế hoạch vẽ** → sinh `kiemTra`, `tinhSo` |
| `buoc` (writer) | `deepseek-flash` | **Chỉ viết lời** cho từng bước, không vẽ, không tính lại |
| `hoi` | `deepseek-flash` | Trả lời câu hỏi giữa bài (giảng chậm, hỏi lại, chuyển bài mới) |
| `anh` / `suahinh` | `deepseek-flash` | Sửa hình / thêm sơ đồ (Venn, cây, mindmap) |
| `meo` | `deepseek-flash` | "Mẹo nhỏ" thi trắc nghiệm (Casio fx-580VN X) — bị **loại âm thầm** nếu kết luận khác đáp số |

Writer nhận **số thứ tự lệnh vẽ** của bước, chứ không nhận quyền vẽ:

> "`ve` of a beat = the NUMBERS of this step's planned drawing statements… an object appears exactly when it is first mentioned; use every number once, in order."

Mỗi "nhịp" (beat) gồm: `noi` (lời nói ≤ 30 từ) + `bang[]` (dòng bảng kiểu bài thi) + `ve[]` (số lệnh) + `ghiChu` (ghi chú lề ≤ 6 từ như "định lí Pytago trong △AHC"). Đây là mô phỏng **giáo viên vừa nói vừa viết bảng**.

### 5.7 Thông số gọi model (đọc từ code)

```js
{
  model: 'deepseek-flash',
  max_tokens: max(maxTokens ?? 0, 32000),
  stream: false,                     // server tự bọc SSE
  thinking: { type: 'enabled' },
  reasoning_effort: 'low',
  response_format: { type: 'json_object' },
  _viec: 'giai' | 'buoc' | 'hoi' | ...
}
```

- Proxy có **van chống nghẽn**: gặp `429` kèm `dongThoi` → tự thử lại sau 1s / 2s / 3s / 5s / 8s.
- Server có trần suy nghĩ: header `x-muc-suy-nghi` (biến `AI_MUC_SUY_NGHI_TOI_DA`) — client xin `low` nhưng server có thể hạ thấp hơn nữa để tiết kiệm.
- Log có đo `prompt_cache_hit_tokens` → đang tận dụng **prompt caching** (system prompt rất dài nên cache là bắt buộc để có lãi).

---

## 6. "Huấn luyện" — sự thật là gì?

### Điều chắc chắn (bằng chứng từ client)

- **Không có fine-tune nào lộ ra ở phía client.** Mọi tác vụ gọi cùng một model `deepseek-flash` với `reasoning_effort: low`.
- Không có dấu vết embedding/RAG, không có vector store, không có tool-calling vòng lặp tự do — chỉ **một schema JSON cố định** + **vòng sửa**.

### Vậy cái gì thay cho "train"?

Có **4 cơ chế** đóng vai trò "dạy" model, và chúng đáng giá hơn fine-tune ở giai đoạn đầu:

1. **Prompt khổng lồ, chia khối có cấu trúc.** System prompt `nu` (persona "Măng", SGK GDPT 2018, quy ước LaTeX tiếng Việt: `\overrightarrow`, dấu phẩy thập phân `2,5`, "so le trong"…), cộng các khối `ru` (luật), `ku[dang]` (tips riêng cho từng dạng hình), `iu` (đặc tả lệnh MV), `Au` (schema), `Ou` (luật vẽ).
2. **Schema + JSON mode.** Zod → JSON-Schema → "Return ONE json object with exactly this structure". Model bị ép vào khuôn, giảm 90% lỗi format.
3. **Grounding bằng engine.** Đây là điểm mạnh nhất: model **bị chấm điểm bởi phép đo**, không bởi lời khen. Sai → prompt sửa → sinh lại. Về bản chất đây là **RL-free self-correction loop**, "train at inference time".
4. **Dữ liệu tự sinh để train sau này.** Site đang tích luỹ đúng loại dữ liệu quý nhất:
   - cặp `(đề, JSON kế hoạch, lệnh vẽ)`;
   - cặp `(lệnh hỏng → lệnh đã sửa)` — **gold data để fine-tune**;
   - `(biểu thức, giá trị AI, giá trị engine đo)` — nhãn đúng/sai tự động;
   - **tim, lượt xem, %đo lại** — tín hiệu chất lượng.

### Suy luận (không kiểm chứng được từ client)

Nếu chủ site muốn, đường đi rẻ nhất là **distill**: lấy vài nghìn bài đã qua vòng kiểm → SFT/LoRA một model nhỏ (7B–14B) để (a) giảm chi phí, (b) bỏ được `deepseek-flash`, (c) chạy offline trong bản Tauri. Với 22 bài hiện tại thì **chưa đủ dữ liệu** — đây là lý do thật sự khiến site còn beta (noindex).

---

## 7. Chi tiết hay: luồng "soạn bài nhờ AI khác" (`/hoc`)

Trang `/hoc` cho phép:

1. Chép **câu lệnh** có sẵn → dán vào ChatGPT / Gemini / Claude của người dùng.
2. AI đó trả về **một khối JSON**.
3. Dán JSON ngược lại vào Măng → Măng **phát lại trên bảng vẽ**.

Nghĩa là **spec JSON + engine được tách rời khỏi LLM**. Giáo viên có thể dùng model mình thích/đã trả tiền, Măng chỉ lo phần bảng vẽ. Đây là nước đi thông minh: vừa giảm tải server, vừa biến "đối thủ" thành "nhà cung cấp não".

---

## 8. Đánh giá: mạnh / yếu

**Mạnh (hiếm gặp ở thị trường Việt Nam)**

- Hình học **đúng bằng dựng hình**, không phải ảnh AI → không bao giờ có hình "tam giác 4 cạnh".
- Vòng kiểm 3 lớp (cú pháp → giả thiết → đáp số) là thứ 99% app giải toán không có.
- Engine WASM 1 MB: offline được, không tốn token, chạy được trên máy yếu.
- API key kín, auth bắt buộc, có van chống nghẽn + prompt cache.
- Tách planner/writer khiến lời giảng ngắn, có nhịp, không "tràng giang đại hải".

**Yếu / rủi ro**

| Vấn đề | Chi tiết |
|---|---|
| Nội dung quá mỏng | **22 bài**, **1 tác giả** (Huy Hoàng Admin), 2 người chia sẻ, 284 lượt xem |
| SEO gần như bằng 0 | `noindex`, không có `robots.txt`/`sitemap.xml`, body CSR → Google gần như không thấy gì |
| Chi phí mỗi bài | planner (≥32k token, effort `high`) + N lần `buoc` + nhiều vòng sửa + kiểm → có thể 6–10 lượt gọi/bài |
| Phụ thuộc 1 model | Toàn bộ pipeline khoá vào `deepseek-flash`; đổi model có thể vỡ `json_object` + hành vi dựng hình |
| Kiểm chứng chỉ đo được cái đo được | Chứng minh, dựng hình, số phức tạp… `kiemTra` không cứu được; AI vẫn có thể sai lý luận mà số vẫn khớp |
| TTS đang tắt | `{"loi":"Giọng đọc đang tạm ngưng."}` |
| Ảnh hình cần session | `/api/bai/{id}/hinh.jpg` trả 401 khi chưa đăng nhập → preview/OG phụ thuộc server, dễ vỡ khi share |

---

## 9. Nếu bạn muốn dựng lại hệ tương tự (blueprint tối thiểu)

1. **Engine trước, AI sau.** Viết (hoặc fork) một kernel hình học: parser lệnh + đối tượng + đo đạc + solver. Rust → wasm-pack, hoặc dùng JS thuần (CindyJS/JSXGraph) nếu chấp nhận chậm hơn.
2. **Định nghĩa DSL ~40 lệnh đủ dùng**: `Point/Midpoint/Foot/Intersect/Segment/Line/Polygon/Circle/Pyramid/Prism/Plane/Section/Revolve/Distance/Volume/Area/Derivative/Root/Extremum/Integral/Animate`.
3. **Schema JSON** cho bài giải (Zod) + `ve[]` theo từng bước + `kiemTra[]`.
4. **Planner prompt**: cấm toạ độ tự tính, bắt dùng phép dựng; bắt chia `ve` theo bước; bắt khai `dang` để chọn 2D/3D.
5. **Vòng kiểm**: chạy lệnh → bắt lỗi → prompt sửa cú pháp; đo giả thiết → prompt sửa hình; so `kiemTra` → prompt giải lại.
6. **Writer prompt** chỉ nhận **số thứ tự lệnh**, không nhận quyền vẽ.
7. **Render**: canvas 2D, highlight vật mới của bước rồi fade, nét khuất đứt, `Animate` cho điểm chạy.
8. **Hạ tầng**: 1 proxy LLM (SSE + rate limit + prompt cache), 1 endpoint render ảnh cho OG/QR, Google OAuth, Caddy.

---

## 10. Phụ lục: tệp đã tải về để kiểm chứng

| Tệp | Kích thước | Nội dung |
|---|---|---|
| `mangnon/home.html` | 1.498 B | Shell SPA + meta OG + font |
| `mangnon/index.js` | 1,27 MB | Toàn bộ prompt, schema Zod, DSL tips, pipeline |
| `mangnon/index.css` | 116 KB | Style |
| `mangnon/ve.wasm` | 993.683 B | Engine hình học Rust (kèm bảng đặc tả lệnh) |
| `mangnon/ban-dung.json` | 18 B | Mốc version build |
| `mangnon/bai.html` | 2.240 B | Chứng minh SSR chỉ bơm `<head>` |

Lệnh tái lập:

```powershell
curl.exe -s --noproxy "*" -o index.js "https://mangnon.io.vn/assets/index-DgHWWIIW.js"
curl.exe -s --noproxy "*" -o ve.wasm  "https://mangnon.io.vn/ve.wasm"
```
