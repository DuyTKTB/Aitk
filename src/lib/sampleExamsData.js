/* ============================================================
   sampleExamsData.js — Thư viện Đề thi Mẫu Chuẩn Ma Trận Bộ GD&ĐT 2025
   Tích hợp sẵn 4 mức độ nhận thức (NB, TH, VD, VDC), lời giải chi tiết,
   chuẩn năng lực GDPT 2018 cho tính năng Mô phỏng, In A4 & Đảo 4 mã đề.
   ============================================================ */

export const PRESET_SAMPLE_EXAMS = [
  {
    id: 'sample-10',
    title: 'Đề kiểm tra Hóa học 10 — Cấu tạo nguyên tử & Bảng tuần hoàn (Chuẩn 2025)',
    duration: 45,
    grade: '10',
    subject: 'Hóa học',
    createdAt: Date.now() - 86400000,
    questions: [
      {
        q: 'Hạt mang điện tích dương trong hạt nhân nguyên tử là hạt nào?',
        options: ['Proton', 'Electron', 'Neutron', 'Positron'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Thành phần nguyên tử',
        points: 0.25,
        explain: 'Trong nguyên tử, hạt proton mang điện tích dương (+1), hạt electron mang điện tích âm (-1), còn neutron không mang điện.'
      },
      {
        q: 'Trong bảng tuần hoàn các nguyên tố hóa học, số thứ tự của ô nguyên tố bằng',
        options: ['Số hiệu nguyên tử (Z)', 'Số hạt neutron', 'Khối lượng nguyên tử', 'Số lớp electron'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Bảng tuần hoàn',
        points: 0.25,
        explain: 'Số thứ tự của ô nguyên tố trong bảng tuần hoàn bằng số hiệu nguyên tử (Z) và bằng số proton/electron trong nguyên tử.'
      },
      {
        q: 'Nguyên tử của nguyên tố X có cấu hình electron là $1s^2 2s^2 2p^6 3s^2 3p^4$. Vị trí của X trong bảng tuần hoàn là:',
        options: [
          'Ô số 16, chu kì 3, nhóm VIA',
          'Ô số 16, chu kì 4, nhóm VIA',
          'Ô số 14, chu kì 3, nhóm IVA',
          'Ô số 16, chu kì 3, nhóm VIB'
        ],
        correct: 0,
        level: 'thong hieu',
        topic: 'Cấu hình electron',
        points: 0.5,
        explain: 'Tổng số electron = 16 => Ô 16. Có 3 lớp electron => Chu kì 3. Lớp ngoài cùng có 6 electron (3s²3p⁴) => Nhóm VIA.'
      },
      {
        q: 'Cho các nguyên tố: Na (Z=11), Mg (Z=12), Al (Z=13). Bán kính nguyên tử giảm dần theo thứ tự:',
        options: ['Na > Mg > Al', 'Al > Mg > Na', 'Mg > Na > Al', 'Na > Al > Mg'],
        correct: 0,
        level: 'thong hieu',
        topic: 'Quy luật tuần hoàn',
        points: 0.5,
        explain: 'Trong cùng một chu kì, khi điện tích hạt nhân tăng dần, lực hút giữa hạt nhân và các electron lớp ngoài cùng tăng làm bán kính nguyên tử giảm dần: Na > Mg > Al.'
      },
      {
        q: 'Hòa tan hoàn toàn 4,6 gam natri vào nước dư, thu được V lít khí $H_2$ (đo ở điều kiện chuẩn 25°C, 1 bar). Giá trị của V là:',
        options: ['2,479 lít', '1,2395 lít', '4,958 lít', '3,7185 lít'],
        correct: 0,
        level: 'van dung',
        topic: 'Kim loại kiềm tác dụng với nước',
        points: 0.75,
        explain: '$n_{Na} = 4,6 / 23 = 0,2$ mol. PTHH: $2Na + 2H_2O \\rightarrow 2NaOH + H_2$. $n_{H_2} = 0,1$ mol. Ở đkc (25°C, 1 bar): $V = 0,1 \\times 24,79 = 2,479$ lít.'
      },
      {
        q: 'Hợp chất X được tạo bởi hai nguyên tố A và B có công thức $AB_2$. Tổng số hạt mang điện trong phân tử X là 64. Số hạt mang điện trong nguyên tử A nhiều hơn trong nguyên tử B là 8. Công thức phân tử của X là:',
        options: ['$SO_2$', '$CO_2$', '$NO_2$', '$SiO_2$'],
        correct: 0,
        level: 'van dung cao',
        topic: 'Xác định cấu tạo phân tử',
        points: 1.0,
        explain: 'Hệ phương trình số hạt: $2Z_A + 4Z_B = 64$ và $2Z_A - 2Z_B = 8 \\Rightarrow Z_A = 16$ (Lưu huỳnh S), $Z_B = 8$ (Oxi O). Vậy X là $SO_2$.'
      }
    ]
  },
  {
    id: 'sample-11',
    title: 'Đề kiểm tra Hóa học 11 — Cân bằng hóa học & Phản ứng Nitơ - Lưu huỳnh (Chuẩn 2025)',
    duration: 50,
    grade: '11',
    subject: 'Hóa học',
    createdAt: Date.now() - 172800000,
    questions: [
      {
        q: 'Phản ứng thuận nghịch là phản ứng',
        options: [
          'Trong cùng điều kiện, xảy ra đồng thời theo hai chiều trái ngược nhau',
          'Chỉ xảy ra theo một chiều nhất định từ chất tham gia tạo thành sản phẩm',
          'Có hiệu suất luôn luôn đạt 100%',
          'Chỉ xảy ra khi đun nóng ở nhiệt độ rất cao'
        ],
        correct: 0,
        level: 'nhan biet',
        topic: 'Khái niệm phản ứng thuận nghịch',
        points: 0.25,
        explain: 'Phản ứng thuận nghịch là phản ứng trong cùng điều kiện, xảy ra đồng thời theo hai chiều trái ngược nhau.'
      },
      {
        q: 'Yếu tố nào sau đây không làm chuyển dịch cân bằng hóa học?',
        options: ['Chất xúc tác', 'Nhiệt độ', 'Nồng độ các chất', 'Áp suất chung của hệ'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Nguyên lý Le Chatelier',
        points: 0.25,
        explain: 'Chất xúc tác làm tăng tốc độ phản ứng thuận và nghịch như nhau, giúp hệ nhanh đạt trạng thái cân bằng chứ không làm chuyển dịch cân bằng.'
      },
      {
        q: 'Cho cân bằng hóa học: $N_2 (k) + 3H_2 (k) \\rightleftharpoons 2NH_3 (k); \\Delta_r H^0_{298} = -92 kJ$. Cân bằng sẽ chuyển dịch theo chiều thuận khi:',
        options: ['Giảm nhiệt độ của hệ', 'Tăng nhiệt độ của hệ', 'Giảm áp suất chung của hệ', 'Thêm chất xúc tác sắt'],
        correct: 0,
        level: 'thong hieu',
        topic: 'Chuyển dịch cân bằng Le Chatelier',
        points: 0.5,
        explain: 'Phản ứng thuận tỏa nhiệt ($\\Delta H < 0$). Khi giảm nhiệt độ, cân bằng sẽ chuyển dịch theo chiều tỏa nhiệt (chiều thuận) để bù trừ lượng nhiệt bị giảm.'
      },
      {
        q: 'Dung dịch nào sau đây có môi trường bazơ (pH > 7) ở 25°C?',
        options: ['Dung dịch $NaOH 0,01M$', 'Dung dịch $HCl 0,1M$', 'Dung dịch $NaCl 1M$', 'Dung dịch $CH_3COOH 0,1M$'],
        correct: 0,
        level: 'thong hieu',
        topic: 'Sự điện li & thang đo pH',
        points: 0.5,
        explain: 'NaOH là bazơ mạnh phân li hoàn toàn tạo ion $OH^-$, làm nồng độ $[OH^-] > 10^{-7} M$, do đó dung dịch có pH > 7.'
      },
      {
        q: 'Trộn 100 mL dung dịch $HCl 0,1M$ với 100 mL dung dịch $NaOH 0,12M$. Giá trị pH của dung dịch sau phản ứng là:',
        options: ['12,0', '2,0', '7,0', '11,0'],
        correct: 0,
        level: 'van dung',
        topic: 'Tính pH dung dịch sau phản ứng',
        points: 0.75,
        explain: '$n_{H^+} = 0,01$ mol; $n_{OH^-} = 0,012$ mol. $OH^-$ dư = $0,002$ mol. Thể tích sau trộn = 200 mL = 0,2 L. $[OH^-] = 0,002 / 0,2 = 0,01M \\Rightarrow pOH = 2 \\Rightarrow pH = 12$.'
      },
      {
        q: 'Cho m gam hỗn hợp gồm Al và Cu tác dụng hoàn toàn với dung dịch $HNO_3$ đặc, nóng (dư). Sau phản ứng thu được 6,1975 lít khí $NO_2$ (sản phẩm khử duy nhất ở đkc). Mặt khác, cho m gam hỗn hợp trên tác dụng với dung dịch HCl dư thì thu được 3,7185 lít khí $H_2$ (đkc). Khối lượng của Cu trong hỗn hợp là:',
        options: ['3,2 gam', '6,4 gam', '1,6 gam', '2,7 gam'],
        correct: 0,
        level: 'van dung cao',
        topic: 'Kim loại tác dụng với axit oxi hóa',
        points: 1.0,
        explain: 'Tác dụng với HCl: chỉ Al phản ứng: $n_{H_2} = 3,7185 / 24,79 = 0,15$ mol $\\Rightarrow n_{Al} = 0,1$ mol. Tác dụng với $HNO_3$: $n_{NO_2} = 6,1975 / 24,79 = 0,25$ mol. Áp dụng định luật bảo toàn e: $3n_{Al} + 2n_{Cu} = n_{NO_2}$...'
      }
    ]
  },
  {
    id: 'sample-12',
    title: 'Đề kiểm tra Hóa học 12 — Este, Lipit & Carbohydrate (Chuẩn GDPT 2018)',
    duration: 50,
    grade: '12',
    subject: 'Hóa học',
    createdAt: Date.now() - 259200000,
    questions: [
      {
        q: 'Công thức phân tử tổng quát của este no, đơn chức, mạch hở là',
        options: ['$C_n H_{2n} O_2$ ($n \\ge 2$)', '$C_n H_{2n-2} O_2$ ($n \\ge 3$)', '$C_n H_{2n+2} O_2$ ($n \\ge 1$)', '$C_n H_{2n} O$ ($n \\ge 1$)'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Đồng đẳng este',
        points: 0.25,
        explain: 'Este no, đơn chức, mạch hở có công thức tổng quát là $C_n H_{2n} O_2$ với $n \\ge 2$.'
      },
      {
        q: 'Tên gọi của este $CH_3COOC_2H_5$ là',
        options: ['Etyl axetat', 'Metyl axetat', 'Etyl fomat', 'Metyl propionat'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Danh pháp gốc - chức este',
        points: 0.25,
        explain: 'Gốc hiđrocacbon của ancol $C_2H_5-$ là etyl, gốc axit $CH_3COO-$ là axetat. Do đó este có tên là etyl axetat.'
      },
      {
        q: 'Chất nào sau đây phản ứng với dung dịch $AgNO_3 / NH_3$ đun nóng tạo kết tủa bạc trắng sáng (phản ứng tráng bạc)?',
        options: ['Glucozơ', 'Saccarozơ', 'Tinh bột', 'Xenlulozơ'],
        correct: 0,
        level: 'thong hieu',
        topic: 'Phản ứng tráng bạc của monosaccarit',
        points: 0.5,
        explain: 'Phân tử glucozơ ở dạng mạch hở có nhóm anđehit (-CHO) nên có khả năng tham gia phản ứng tráng bạc.'
      },
      {
        q: 'Thủy phân hoàn toàn 8,8 gam etyl axetat trong 100 mL dung dịch $NaOH 1,2M$. Cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là:',
        options: ['9,0 gam', '8,2 gam', '10,4 gam', '7,4 gam'],
        correct: 0,
        level: 'van dung',
        topic: 'Phản ứng xà phòng hóa este',
        points: 0.75,
        explain: '$n_{este} = 8,8 / 88 = 0,1$ mol; $n_{NaOH} = 0,12$ mol $\\Rightarrow NaOH$ dư $0,02$ mol. Muối tạo thành $CH_3COONa = 0,1$ mol ($8,2g$). Khối lượng chất rắn khan sau cô cạn = $8,2 + 0,02 \\times 40 = 9,0$ gam.'
      },
      {
        q: 'Xà phòng hóa hoàn toàn 17,8 gam chất béo tristearin bằng dung dịch KOH vừa đủ. Khối lượng muối kali thu được sau phản ứng là:',
        options: ['19,32 gam', '18,4 gam', '20,12 gam', '16,8 gam'],
        correct: 0,
        level: 'van dung cao',
        topic: 'Thủy phân chất béo kiềm',
        points: 1.0,
        explain: 'Tristearin có công thức $(C_{17}H_{35}COO)_3C_3H_5$ ($M = 890$). $n = 17,8 / 890 = 0,02$ mol. Muối kali stearat là $C_{17}H_{35}COOK$ ($M = 322$). $n_{muối} = 0,06$ mol. Khối lượng = $0,06 \\times 322 = 19,32$ gam.'
      }
    ]
  },
  {
    id: 'sample-thptqg',
    title: 'Đề minh họa Phát triển Năng lực Hóa học — Kì thi Tốt nghiệp THPT 2025',
    duration: 50,
    grade: '12',
    subject: 'Hóa học',
    createdAt: Date.now() - 432000000,
    questions: [
      {
        q: 'Phần 1: Trong các kim loại sau, kim loại có tính dẫn điện tốt nhất là:',
        options: ['Bạc (Ag)', 'Đồng (Cu)', 'Vàng (Au)', 'Nhôm (Al)'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Tính chất vật lí kim loại',
        points: 0.25,
        explain: 'Thứ tự dẫn điện giảm dần của các kim loại: Ag > Cu > Au > Al > Fe.'
      },
      {
        q: 'Ăn mòn điện hóa học xảy ra khi có đủ bao nhiêu điều kiện?',
        options: ['3 điều kiện', '2 điều kiện', '1 điều kiện', '4 điều kiện'],
        correct: 0,
        level: 'nhan biet',
        topic: 'Ăn mòn kim loại',
        points: 0.25,
        explain: '3 điều kiện: Các điện cực khác chất; các điện cực tiếp xúc trực tiếp hoặc gián tiếp; cùng tiếp xúc với dung dịch chất điện li.'
      },
      {
        q: 'Pin Galvani tạo bởi hai cặp oxi hóa - khử $Zn^{2+}/Zn$ ($E^0 = -0,76V$) và $Cu^{2+}/Cu$ ($E^0 = +0,34V$). Sức điện động chuẩn của pin là:',
        options: ['1,10 V', '0,42 V', '-1,10 V', '0,76 V'],
        correct: 0,
        level: 'thong hieu',
        topic: 'Thế điện cực & Pin điện hóa',
        points: 0.5,
        explain: '$E^0_{pin} = E^0_{catot} - E^0_{anot} = 0,34 - (-0,76) = 1,10$ V.'
      },
      {
        q: 'Điện phân dung dịch $CuSO_4$ với điện cực trơ đến khi catot bắt đầu có khí thoát ra thì dừng lại. Quá trình xảy ra ở anot là:',
        options: ['Oxi hóa nước tạo khí $O_2$', 'Khử nước tạo khí $H_2$', 'Oxi hóa ion $Cu^{2+}$', 'Khử ion sunfat'],
        correct: 0,
        level: 'van dung',
        topic: 'Điện phân dung dịch',
        points: 0.75,
        explain: 'Ở anot (+), $H_2O$ bị oxi hóa ưu tiên hơn $SO_4^{2-}$: $2H_2O \\rightarrow 4H^+ + O_2 + 4e$.'
      },
      {
        q: 'Cho một thanh Fe nặng 20 gam vào 200 mL dung dịch $CuSO_4 0,5M$. Sau khi phản ứng kết thúc hoàn toàn, lấy thanh Fe ra rửa sạch làm khô và đem cân lại. Khối lượng thanh Fe sau phản ứng là:',
        options: ['20,8 gam', '21,6 gam', '19,2 gam', '20,4 gam'],
        correct: 0,
        level: 'van dung cao',
        topic: 'Kim loại tác dụng muối',
        points: 1.0,
        explain: '$n_{CuSO_4} = 0,1$ mol. PTHH: $Fe + Cu^{2+} \\rightarrow Fe^{2+} + Cu$. Mỗi mol Cu bám vào thay thế 1 mol Fe tan ra thì khối lượng thanh tăng: $64 - 56 = 8$ gam. Độ tăng khối lượng: $\\Delta m = 0,1 \\times 8 = 0,8$ gam $\\Rightarrow$ Khối lượng thanh Fe = $20 + 0,8 = 20,8$ gam.'
      }
    ]
  }
];
