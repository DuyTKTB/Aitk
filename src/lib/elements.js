/* ============================================================
   elements.js — NGUỒN DỮ LIỆU DUY NHẤT cho nguyên tố (24 nguyên tố hay gặp ở THPT)
   Mỗi phần tử có cả khóa ngắn (z, s, n, m) lẫn khóa đầy đủ (symbol, name, mass)
   nên code cũ dùng kiểu nào cũng chạy.
   ============================================================ */
const RAW = [
  { z: 1, s: 'H', n: 'Hydrogen', m: '1,008', fact: 'Nguyên tố nhẹ nhất và nhiều nhất trong vũ trụ.' },
  { z: 2, s: 'He', n: 'Helium', m: '4,003', fact: 'Được phát hiện trên Mặt Trời trước khi tìm thấy trên Trái Đất.' },
  { z: 3, s: 'Li', n: 'Lithium', m: '6,94', fact: 'Kim loại nhẹ nhất, có trong pin sạc điện thoại.' },
  { z: 6, s: 'C', n: 'Carbon', m: '12,011', fact: 'Kim cương và than chì đều chỉ là cacbon, khác nhau ở cách sắp xếp nguyên tử.' },
  { z: 7, s: 'N', n: 'Nitrogen', m: '14,007', fact: 'Chiếm khoảng 78% thể tích không khí.' },
  { z: 8, s: 'O', n: 'Oxygen', m: '15,999', fact: 'Chiếm khoảng 21% không khí, cần cho sự cháy và hô hấp.' },
  { z: 9, s: 'F', n: 'Fluorine', m: '18,998', fact: 'Độ âm điện lớn nhất bảng tuần hoàn: 3,98 theo thang Pauling.' },
  { z: 10, s: 'Ne', n: 'Neon', m: '20,180', fact: 'Phát sáng màu đỏ cam trong đèn neon.' },
  { z: 11, s: 'Na', n: 'Sodium', m: '22,990', fact: 'Tác dụng mạnh với nước nên phải ngâm trong dầu hỏa.' },
  { z: 12, s: 'Mg', n: 'Magnesium', m: '24,305', fact: 'Cháy với ánh sáng trắng chói, có trong pháo hoa.' },
  { z: 13, s: 'Al', n: 'Aluminium', m: '26,982', fact: 'Kim loại phổ biến nhất trong vỏ Trái Đất.' },
  { z: 14, s: 'Si', n: 'Silicon', m: '28,085', fact: 'Nguyên liệu chính để làm chip bán dẫn.' },
  { z: 15, s: 'P', n: 'Phosphorus', m: '30,974', fact: 'Photpho trắng tự bốc cháy trong không khí.' },
  { z: 16, s: 'S', n: 'Sulfur', m: '32,06', fact: 'Dùng để sản xuất axit sunfuric, hóa chất được dùng nhiều nhất thế giới.' },
  { z: 17, s: 'Cl', n: 'Chlorine', m: '35,45', fact: 'Khí màu vàng lục, dùng để khử trùng nước.' },
  { z: 19, s: 'K', n: 'Potassium', m: '39,098', fact: 'Cây trồng cần nhiều kali nên có phân kali.' },
  { z: 20, s: 'Ca', n: 'Calcium', m: '40,078', fact: 'Thành phần chính của xương, răng và vỏ trứng.' },
  { z: 26, s: 'Fe', n: 'Iron', m: '55,845', fact: 'Có trong hemoglobin, chất vận chuyển oxi trong máu.' },
  { z: 29, s: 'Cu', n: 'Copper', m: '63,546', fact: 'Dẫn điện rất tốt; để lâu ngoài trời nó phủ lớp gỉ xanh lục.' },
  { z: 30, s: 'Zn', n: 'Zinc', m: '65,38', fact: 'Được mạ lên sắt để chống gỉ.' },
  { z: 47, s: 'Ag', n: 'Silver', m: '107,87', fact: 'Dẫn điện và dẫn nhiệt tốt nhất trong các kim loại.' },
  { z: 79, s: 'Au', n: 'Gold', m: '196,97', fact: 'Rất trơ, không bị oxi hóa trong không khí.' },
  { z: 80, s: 'Hg', n: 'Mercury', m: '200,59', fact: 'Kim loại duy nhất ở thể lỏng trong điều kiện thường.' },
  { z: 82, s: 'Pb', n: 'Lead', m: '207,2', fact: 'Rất độc, nên đã bị loại khỏi xăng và ống nước.' },
];

/** Thêm khóa đầy đủ để khớp code dùng e.symbol / e.name / e.mass. */
export const ELEMENTS = RAW.map((e) => ({ ...e, symbol: e.s, name: e.n, mass: e.m, number: e.z }));

/** Danh sách nguyên tố có sẵn "fact" (trước đây là mảng riêng gây trùng dữ liệu). */
export const ELEMENTS_THPT = ELEMENTS;

/** Ngày thứ mấy trong năm (1..366), tính theo UTC nên không lệch khi đổi giờ. */
export function dayOfYear(d = new Date()) {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const cur = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((cur - start) / 864e5);
}

/** Nguyên tố của ngày — xoay vòng theo ngày trong năm. */
export function elementOfDay(d = new Date()) {
  return ELEMENTS[dayOfYear(d) % ELEMENTS.length];
}

const fold = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

/** Tìm nguyên tố theo ký hiệu, số hiệu hoặc tên (không phân biệt dấu). */
export function findElement(query) {
  const q = fold(query);
  if (!q) return null;
  return (
    ELEMENTS.find((e) => fold(e.s) === q || String(e.z) === q || fold(e.n) === q) ||
    ELEMENTS.find((e) => fold(e.n).includes(q)) ||
    null
  );
}
