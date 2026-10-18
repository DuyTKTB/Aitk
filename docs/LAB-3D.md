# ELEC AI — IMMERSIVE CHEMISTRY LAB 3D

Phòng thí nghiệm hóa học 3D nhập vai, chạy trên trình duyệt bằng **Three.js + React Three Fiber** (đã có sẵn trong dự án — không thêm dependency mới).

## Truy cập

- URL trực tiếp: `#games/lab-3d`
- Hoặc: Trò chơi → thẻ **"Phòng Lab 3D"** (hàng 23)
- Phòng Lab 2D cũ (`#games/lab`) **không bị thay đổi**.

## Đã triển khai + kiểm thử

### Không gian 3D
- Phòng 10×8×3.2m: sàn, tường, cửa sổ có ánh sáng, đèn trần, bàn thí nghiệm trung tâm mặt đá, kệ hóa chất có nhãn (HCl, H2SO4, NaOH, CuSO4, AgNO3, Quỳ), tủ hút, bồn rửa, thùng chất thải, biển an toàn.
- Camera: 3 góc xem (Phòng / Bàn / Cận cảnh) + **Walk mode WASD** (Shift chạy, kẹp trong phòng không xuyên tường), orbit chuột có giới hạn góc.
- Chất lượng Đẹp/Mượt (pixel ratio + shadow), fullscreen API, phím tắt: F (bàn), Tab (kho), Esc (đóng panel), WASD.

### Dụng cụ tương tác
Cốc thủy tinh, bình tam giác, ống đong (mỗi cái có trạng thái riêng), giá ống nghiệm, đèn cồn bật/tắt lửa, cân điện tử, máy đo pH hiển thị số thật. Click dụng cụ → camera cận cảnh + viền sáng.

### Kho hóa chất (engine/catalog)
28 chất/khảo thí: kim loại (Mg Al Zn Fe Cu; **Na/K/Ca bị CHẶN vì an toàn**), axit (HCl 1M, H2SO4 0.5M, CH3COOH 1M), bazơ (NaOH, KOH, Ba(OH)2), muối (NaCl, CuSO4, FeCl3, AgNO3, BaCl2, Na2CO3, FeSO4), rắn (CaCO3, Zn hạt, đinh Fe), chỉ thị (quỳ, PPT). Mỗi chất: formula, M, nồng độ, màu, nhãn nguy hiểm, hướng dẫn an toàn.

### Engine phản ứng (engine.js — tách biệt UI)
12 phản ứng đã cân bằng + 2 phản ứng "KHÔNG xảy ra" có giải thích khoa học (Cu + HCl...). Engine tính mol thực (mL×conc/1000), chất giới hạn, bảo toàn thể tích khi phản ứng, hiện tượng: kết tủa (màu), khí sủi (bubble animation 3D), tỏa nhiệt (+°C), chỉ thị đổi màu theo pH. pH: axit/bazơ mạnh cân bằng mol; **axit yếu [H⁺]=√(Ka·C)** (Ka CH3COOH = 1.74×10⁻⁵).

**Đã test engine bằng script:** trung hòa 20+20mL → pH 7.00, 45mL tổng, PPT hồng khi bazơ dư ✓; BaCl2+H2SO4 → kết tủa trắng ✓; Fe+CuSO4 → bám đồng ✓; Cu+HCl → thông báo KHÔNG phản ứng ✓; Na bị chặn ✓; Na2CO3+HCl → khí CO2 ✓.

### Nhiệm vụ (4 bài có auto-check từng bước)
A. Axit+bazơ với PPT · B. Kết tủa BaSO4 · C. Fe+CuSO4 · D. Đo pH. Tự đánh giá từ trạng thái engine (không phải nút giả).

### Sổ thí nghiệm + lưu
Nhật ký từng thao tác (chất, mL, dụng cụ, hiện tượng, phương trình). Lưu cloud Firestore `users/{uid}/lab3dSessions` (rule: chỉ chủ sở hữu — đã deploy), xem phiên gần nhất, reset phiên.

## Chưa triển khai (kế hoạch)
- Trợ lý AI trong lab (đã có hạ tầng askAI — chưa nối)
- Đổ/kéo drag-and-drop 3D (hiện chọn bằng click + HUD)
- Chế độ kiểm tra thực hành chấm điểm backend, tủ hóa chất mở rộng, âm thanh rót chuyên dụng

## Giới hạn mô phỏng (công bố)
Mô hình mức THPT: dung dịch loãng, không mô phỏng động học/nhiệt độ nâng cao/phổ điểm thực. Không thay thế thí nghiệm thật. Không khuyến khích tự làm thí nghiệm nguy hiểm ngoài đời.

## Chạy
`npm run dev` → mở `http://localhost:5173/#games/lab-3d`. Build: `npx vite build` (đã pass). Cần WebGL2/WebGL.

