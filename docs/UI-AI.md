# Giao diện AI — đã làm & còn lại

Tài liệu này ghi lại đợt nâng cấp giao diện trang AI (`#ai`) và các việc tiếp theo.
Đọc kèm [AI-NANG-CAP.md](AI-NANG-CAP.md) (phần động cơ AI) và [AUDIT-NANG-CAP-AITK.md](AUDIT-NANG-CAP-AITK.md).

---

## 1. Đã sửa trong đợt này

### 1.1. Lỗi hiển thị (thấy rõ trên màn hình)

| Vấn đề | Sửa thế nào |
|---|---|
| `Chào Nguyễn,hôm nay…` thiếu dấu cách sau dấu phẩy | thêm `{' '}` giữa 2 `<span>` |
| Dropdown "Tự động" là `<select>` mặc định của trình duyệt (viền + mũi tên xám) | `appearance: none` + **mũi tên SVG** cùng tông, có biến thể dark/light |
| Nút tròn cuối header trông như nút **X (đóng chat)** nhưng thật ra là "đọc tự động" | icon loa tắt đổi từ *loa + dấu X* → **loa + gạch chéo** |
| Nút **X trong sidebar ở desktop là nút chết** (sidebar desktop luôn hiện, `.open` không có tác dụng) | ẩn hẳn trên desktop (`min-width: 901px`), chỉ giữ trên mobile |
| Nút gửi khi ô trống hiện icon AI (sparkle) → không ai biết là "Gửi" | luôn dùng icon mũi tên, trạng thái rỗng chỉ mờ đi |
| Màn hình trống dồn lên trên, dưới trống ~400px | `ds-main-empty`: căn giữa theo chiều dọc; AIMark 180 → 132px |
| `SUGGESTION_POOL` + `pickSuggestions()` + `setSugSeed()` **có trong code nhưng chưa từng hiển thị** | render thành hàng **chip gợi ý** + nút "gợi ý khác" (dùng lại dữ liệu có sẵn) |
| Nút gửi chỉ 40×40px | 44×44px trên thiết bị cảm ứng (cùng với chip gợi ý) |

### 1.2. Sidebar

- Thư mục lịch sử ("Hôm qua", "7 ngày qua") đổi từ **card to** (bo 18px, gradient, hover nhấc 3px, glow)
  sang **hàng gọn 2 dòng**: `icon · tên · số lượng` + preview 1 dòng cắt ellipsis.
- Đường kính/khối lượng thị giác giảm mạnh → sidebar bớt "rỗng", đọc nhanh hơn.

### 1.3. Gộp CSS: 8 lớp → 1 file (giữ nguyên cascade)

Trước đây `AIChat.jsx` import 8 file chồng nhau:

```
aichat-apple-intelligence.css → AIChat.css → AIChat-glass.css → AIChat-pro.css
→ AIChat-fix.css → AIChat-glass-v2.css → AIChat-mobile.css → AIChat-futuristic.css
```

Nay còn **2 file**:

| File | Vai trò |
|---|---|
| `src/styles/aichat.css` | **5.720 dòng** — 8 lớp cũ gộp lại, *giữ nguyên thứ tự* (có banner đánh dấu từng lớp cũ ở đầu mỗi khối) |
| `src/styles/ai-intelligence.css` | lớp cuối — nơi chỉnh giao diện AI về sau (badge, chip, bố cục, sidebar) |

Đã xoá (git vẫn giữ lịch sử): 8 file trên + 2 file trùng không dùng
(`src/components/AIChat-glass.css` — bản khác nội dung với bản đang dùng, `chat-widget.css` ở gốc repo — trùng y hệt bản trong `components/`).

> Vì sao an toàn: cascade giữ nguyên thứ tự khai báo ⇒ thứ tự thắng/thua của mọi `!important`
> không đổi. Đã kiểm tra trước khi xoá: không file nào dùng `url()` đường dẫn tương đối
> (nên đổi vị trí file không làm hỏng ảnh/font) và không file nào có `@import`.

### 1.4. Icon: giảm số nguồn cho trang chat

- AIChat.jsx trước đây dùng **3 nguồn icon**: `Icons.jsx` (19 icon) + `AIChatIcons.jsx` (10 icon)
  + **8 icon tự khai báo trong file**. Nay 7 icon còn lại (`IcoWand`, `IcoPin`, `IcoSpeaker`,
  `IcoSpeakerOff`, `IcoNote`, `IcoPractice`, `IcoMore`) đã chuyển về `AIChatIcons.jsx`
  (đồng bộ nét 1.8px), icon chết `IcoAIStar` đã xoá ⇒ AIChat.jsx **không còn khai báo icon nào**.
- Emoji dùng làm icon đã thay bằng SVG ở: nhóm lịch sử (☀️🌙📅📦), badge AI (🧮⚖️),
  và toàn bộ thông điệp hệ thống trong `lib/ai.js` (⚠️⏳👉🌸) → chữ thuần.

---

## 2. Còn lại (đề xuất làm tiếp)

1. **Gộp 13 module icon về 1 nguồn** — hiện mỗi icon lặp ở nhiều file:
   `IcoEdit` có ở **7 file**, `IcoTrash`/`IcoCheck`/`IcoClose`/`IcoClock` ở 6 file,
   `IcoSparkle`/`IcoSearch`/`IcoPlay`/`IcoFilter`/`IcoDownload` ở 5 file.
   → Tạo `src/ui/icons.jsx` (24×24, stroke 1.8, `currentColor`, prop `size`), các module cũ re-export.
2. **Emoji còn sót ở UI AI khác**: `AIQuizGenerator.jsx` (**17 emoji**: 📁📄🏆🎯⚠️✕✓),
   `CompareModal.jsx` (⚡), `teacher/AutoExamStudio.jsx` (⭐ ×2).
3. **`!important`**: `aichat.css` còn ~180 chỗ `!important` (dồn từ các lớp cũ, riêng
   `aichat-apple-intelligence` cũ 301 chỗ). Cần gỡ dần theo từng khối khi đã có token thống nhất.
4. **Trạng thái & a11y**:
   - "sẵn sàng" nên thành chip có dot màu (rảnh / đang trả lời / lỗi).
   - `aria-live` cho **nội dung** đang stream (hiện chỉ trạng thái có).
   - Focus trap + `aria-modal` cho sidebar (mobile) và lightbox.
   - Kiểm tra `prefers-reduced-motion` cho `AIMark` (animation khá nặng).
5. **Nhất quán giữa các màn AI**: `AiPanel`, `AiQuiz`, `AIQuizGenerator`, `CompareModal` tự hiển thị
   riêng → khung suy luận / trích dẫn nguồn / badge "đã tính bằng công cụ" chỉ có ở `AIChat`.
   → Tách `useAskAI` + `<AiAnswer>` dùng chung.
6. **File chết**: `src/services/main.jsx` là entry point cũ, không ai import (index.html nạp
   `/src/main.jsx`), bên trong còn import 4 file CSS đã xoá → nên xoá hẳn.

---

## 3. Cần bạn kiểm tra bằng mắt

Vì tôi không render được trình duyệt, bạn mở `npm run dev` → `#ai` và xem:

- [ ] Sidebar: thư mục giờ là hàng gọn; không còn nút X ở desktop
- [ ] Màn hình trống: khối chào + thẻ "hôm nay" + **hàng chip gợi ý** nằm giữa theo chiều dọc
- [ ] Dropdown "Tự động": mũi tên SVG, không còn viền xám của trình duyệt (xem cả light + dark)
- [ ] Header: nút cuối cùng (đọc tự động) không còn giống nút đóng
- [ ] Ô nhập rộng bằng header/nội dung (900px)
- [ ] Bấm một chip gợi ý → gửi câu hỏi luôn
