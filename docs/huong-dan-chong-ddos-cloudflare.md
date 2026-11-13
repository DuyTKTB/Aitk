# HƯỚNG DẪN BẬT CLOUDFLARE WAF & CHỐNG TẤN CÔNG DDOS 100% CHO ELECAI.ID.VN

Tài liệu này hướng dẫn từng bước kích hoạt **Cloudflare Free Tier** làm lá chắn phía trước **Vercel** để chống tấn công DDoS (Layer 3, 4, 7), ẩn hoàn toàn IP máy chủ gốc và bảo vệ website an toàn tuyệt đối.

---

## 1. BẢNG BẢN GHI DNS HIỆN TẠI CỦA ELECAI.ID.VN (ĐỂ NHẬP VÀO CLOUDFLARE)

Khi thêm tên miền vào Cloudflare, hệ thống sẽ tự quét. Bạn chỉ cần đối chiếu bảng này để đảm bảo không thiếu bản ghi nào:

| Loại (Type) | Tên (Name) | Giá trị (Target / Content) | Proxy Status | Mục đích |
|---|---|---|:---:|---|
| **A** | `@` (hoặc `elecai.id.vn`) | `216.198.79.1` | **Proxied 🟠** | Trỏ web gốc về Vercel (Ẩn IP) |
| **CNAME** | `www` | `418f7baa648d13f9.vercel-dns-017.com` | **Proxied 🟠** | Trỏ www về Vercel (Ẩn IP) |
| **MX** | `@` | `mx1.larksuite.com` (Độ ưu tiên: 1) | DNS only ⚪ | Nhận email Lark Suite |
| **MX** | `@` | `mx2.larksuite.com` (Độ ưu tiên: 5) | DNS only ⚪ | Nhận email Lark Suite |
| **MX** | `@` | `mx3.larksuite.com` (Độ ưu tiên: 10) | DNS only ⚪ | Nhận email Lark Suite |
| **TXT** | `@` | `v=spf1 +include:spf.onlarksuite.com -all` | DNS only ⚪ | SPF chống giả mạo email Lark |
| **TXT** | `@` | `verification-code-site-App_lark=7CeURbtRjCRY7LJq9uOp` | DNS only ⚪ | Xác thực Lark Suite |
| **TXT** | `@` | `google-site-verification=o44vNxyxCKtwH2vcZj-JZYYslCqHTxyBCqZdhcQ5c4w` | DNS only ⚪ | Xác thực Google Search Console |

> [!IMPORTANT]
> Chỉ bật **Proxied 🟠** cho bản ghi Web (`@` và `www`). Các bản ghi Mail (`MX`, `TXT`) bắt buộc để **DNS only ⚪** để không bị gián đoạn gửi/nhận email.

---

## 2. QUY TRÌNH THỰC HIỆN 3 BƯỚC

### BƯỚC 1: THÊM TÊN MIỀN VÀO CLOUDFLARE
1. Truy cập [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) và tạo 1 tài khoản miễn phí.
2. Bấm nút **Add a domain** (hoặc **Add site**).
3. Nhập tên miền: `elecai.id.vn` -> Chọn gói **Free** ($0/tháng).
4. Cloudflare sẽ quét bản ghi DNS. Kiểm tra lại theo bảng ở Mục 1, bấm **Continue**.
5. Cloudflare sẽ cung cấp cho bạn 2 địa chỉ NameServer mới (ví dụ: `ns1.cloudflare.com` và `ns2.cloudflare.com`). **Hãy sao chép 2 dòng này**.

---

### BƯỚC 2: ĐỔI NAMESERVER TẠI NHÀ ĐĂNG KÝ TENTEN.VN
1. Đăng nhập vào trang quản lý tài khoản [Tenten.vn](https://tenten.vn/).
2. Vào mục **Quản lý dịch vụ** > **Tên miền** > Chọn tên miền `elecai.id.vn`.
3. Tìm mục **Cấu hình NameServer (DNS Nameserver)**.
4. Chuyển từ NameServer mặc định của Tenten sang **Sử dụng NameServer khác**:
   * Dòng 1: Dán Nameserver thứ 1 của Cloudflare (VD: `aragorn.ns.cloudflare.com`)
   * Dòng 2: Dán Nameserver thứ 2 của Cloudflare (VD: `lorna.ns.cloudflare.com`)
5. Bấm **Lưu cấu hình / Cập nhật**.
   *(Thời gian chuyển đổi DNS thường mất từ 15 phút đến 2 tiếng).*

---

### BƯỚC 3: BẬT 3 TÍNH NĂNG CHỐNG DDOS VÀ BOT TỰ ĐỘNG

Khi tên miền đã active trên Cloudflare (có dấu tích xanh ✅):

1. **Bật Bot Fight Mode (Chống Botnet & Scraper):**
   * Vào menu bên trái: **Security** > **Bots**.
   * Gạt công tắc **Bot Fight Mode** sang **ON**.
2. **Cấu hình SSL/TLS thành Full (Strict):**
   * Vào menu **SSL/TLS** > Chọn chế độ **Full** hoặc **Full (strict)**.
   * Cách này đảm bảo kết nối mã hóa HTTPS thông suốt từ Trình duyệt -> Cloudflare -> Vercel.
3. **Kích hoạt Rate Limiting cho API (Chống Spam OTP):**
   * Vào **Security** > **WAF** > tab **Rate limiting rules** > Bấm **Create rule**:
     * Rule name: `Chặn spam API OTP`
     * When incoming requests match: `URI Path` contains `/api/`
     * Requests: `15` requests trong `10 seconds`
     * Choose action: `Block` (hoặc `Managed Challenge`) trong `1 hour`.
4. **Vũ khí tối thượng khi bị tấn công dồn dập (Under Attack Mode):**
   * Ngay trên trang Overview của Cloudflare, có nút **Quick Actions** > **Under Attack Mode**.
   * Khi thấy web có dấu hiệu bị treo hay bị flood: Bật chế độ này lên. Mọi request độc hại sẽ bị giữ lại tại cổng kiểm tra, người dùng thật chỉ cần đợi 3 giây là vào được web bình thường.
