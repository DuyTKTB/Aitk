/* 25 nguyên tố hay gặp ở THPT + một câu chuyện nhỏ cho mỗi nguyên tố. Xoay theo ngày trong năm. */
export const ELEMENTS = [
  { z: 1, s: 'H', n: 'Hiđro', m: '1,008', fact: 'Nguyên tố nhẹ nhất và nhiều nhất trong vũ trụ.' },
  { z: 2, s: 'He', n: 'Heli', m: '4,003', fact: 'Được phát hiện trên Mặt Trời trước khi tìm thấy trên Trái Đất.' },
  { z: 3, s: 'Li', n: 'Liti', m: '6,94', fact: 'Kim loại nhẹ nhất, có trong pin sạc điện thoại.' },
  { z: 6, s: 'C', n: 'Cacbon', m: '12,011', fact: 'Kim cương và than chì đều chỉ là cacbon, khác nhau ở cách sắp xếp nguyên tử.' },
  { z: 7, s: 'N', n: 'Nitơ', m: '14,007', fact: 'Chiếm khoảng 78% thể tích không khí.' },
  { z: 8, s: 'O', n: 'Oxi', m: '15,999', fact: 'Chiếm khoảng 21% không khí, cần cho sự cháy và hô hấp.' },
  { z: 9, s: 'F', n: 'Flo', m: '18,998', fact: 'Độ âm điện lớn nhất bảng tuần hoàn: 3,98 theo thang Pauling.' },
  { z: 10, s: 'Ne', n: 'Neon', m: '20,180', fact: 'Phát sáng màu đỏ cam trong đèn neon.' },
  { z: 11, s: 'Na', n: 'Natri', m: '22,990', fact: 'Tác dụng mạnh với nước nên phải ngâm trong dầu hỏa.' },
  { z: 12, s: 'Mg', n: 'Magie', m: '24,305', fact: 'Cháy với ánh sáng trắng chói, có trong pháo hoa.' },
  { z: 13, s: 'Al', n: 'Nhôm', m: '26,982', fact: 'Kim loại phổ biến nhất trong vỏ Trái Đất.' },
  { z: 14, s: 'Si', n: 'Silic', m: '28,085', fact: 'Nguyên liệu chính để làm chip bán dẫn.' },
  { z: 15, s: 'P', n: 'Photpho', m: '30,974', fact: 'Photpho trắng tự bốc cháy trong không khí.' },
  { z: 16, s: 'S', n: 'Lưu huỳnh', m: '32,06', fact: 'Dùng để sản xuất axit sunfuric, hóa chất được dùng nhiều nhất thế giới.' },
  { z: 17, s: 'Cl', n: 'Clo', m: '35,45', fact: 'Khí màu vàng lục, dùng để khử trùng nước.' },
  { z: 19, s: 'K', n: 'Kali', m: '39,098', fact: 'Cây trồng cần nhiều kali nên có phân kali.' },
  { z: 20, s: 'Ca', n: 'Canxi', m: '40,078', fact: 'Thành phần chính của xương, răng và vỏ trứng.' },
  { z: 26, s: 'Fe', n: 'Sắt', m: '55,845', fact: 'Có trong hemoglobin, chất vận chuyển oxi trong máu.' },
  { z: 29, s: 'Cu', n: 'Đồng', m: '63,546', fact: 'Dẫn điện rất tốt; để lâu ngoài trời nó phủ lớp gỉ xanh lục.' },
  { z: 30, s: 'Zn', n: 'Kẽm', m: '65,38', fact: 'Được mạ lên sắt để chống gỉ.' },
  { z: 47, s: 'Ag', n: 'Bạc', m: '107,87', fact: 'Dẫn điện và dẫn nhiệt tốt nhất trong các kim loại.' },
  { z: 79, s: 'Au', n: 'Vàng', m: '196,97', fact: 'Rất trơ, không bị oxi hóa trong không khí.' },
  { z: 80, s: 'Hg', n: 'Thủy ngân', m: '200,59', fact: 'Kim loại duy nhất ở thể lỏng trong điều kiện thường.' },
  { z: 82, s: 'Pb', n: 'Chì', m: '207,2', fact: 'Rất độc, nên đã bị loại khỏi xăng và ống nước.' },
];

export function elementOfDay(d = new Date()) {
  const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return ELEMENTS[day % ELEMENTS.length];
}
