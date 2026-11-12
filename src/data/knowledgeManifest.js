/* ============================================================
   knowledgeManifest.js — CƠ SỞ TRI THỨC HỌC LIỆU SỐ HÓA ELEC AI
   ------------------------------------------------------------
   Quản lý danh mục các tài nguyên Infographic, Sơ đồ tư duy,
   Cheatsheet và tài liệu chuyên sâu chuẩn CT GDPT 2018 (Lý, Hóa).
   Tất cả tài nguyên nằm trong thư mục: public/img/knowledge/
   ============================================================ */

export const KNOWLEDGE_INFOGRAPHICS = {
  /* ============================================================
     1. HÓA HỌC LỚP 10 (7 CHƯƠNG TOÀN DIỆN - 19 TỆP GIF SƠ ĐỒ)
     ============================================================ */
  'c10-atom': [
    {
      id: 'hoa10-c1-1',
      title: 'Thành phần cấu tạo nguyên tử & Các loại hạt p, n, e',
      url: '/img/knowledge/hoa/10/hoa10-ch1-1.gif',
      desc: 'Bản chất hạt proton, electron, neutron; khối lượng, điện tích và bán kính nguyên tử.',
      grade: 10,
      subject: 'hoa',
      tags: ['Nguyên tử', 'Hạt cơ bản', 'Điện tích hạt nhân'],
    },
    {
      id: 'hoa10-c1-2',
      title: 'Hạt nhân nguyên tử, Điện tích hạt nhân & Số khối',
      url: '/img/knowledge/hoa/10/hoa10-ch1-2.gif',
      desc: 'Công thức tính số khối A = Z + N, mối quan hệ giữa Z và số đơn vị điện tích hạt nhân.',
      grade: 10,
      subject: 'hoa',
      tags: ['Số khối', 'Đồng vị', 'Nguyên tử khối'],
    },
    {
      id: 'hoa10-c1-3',
      title: 'Orbital nguyên tử (AO) & Cấu hình electron nguyên tử',
      url: '/img/knowledge/hoa/10/hoa10-ch1-3.gif',
      desc: 'Nguyên lí Pauli, quy tắc Hund, trật tự mức năng lượng Klechkowski và phân bố e theo lớp/phân lớp.',
      grade: 10,
      subject: 'hoa',
      tags: ['Cấu hình e', 'Orbital', 'Lớp ngoài cùng'],
    },
  ],

  'c10-periodic': [
    {
      id: 'hoa10-c2-1',
      title: 'Cấu trúc Bảng tuần hoàn các nguyên tố hóa học',
      url: '/img/knowledge/hoa/10/hoa10-ch2-1.gif',
      desc: 'Nguyên tắc sắp xếp, cấu tạo ô nguyên tố, 7 chu kì và 8 nhóm A, 8 nhóm B.',
      grade: 10,
      subject: 'hoa',
      tags: ['Bảng tuần hoàn', 'Chu kì', 'Nhóm A - B'],
    },
    {
      id: 'hoa10-c2-2',
      title: 'Quy luật biến đổi tuần hoàn tính chất các nguyên tố',
      url: '/img/knowledge/hoa/10/hoa10-ch2-2.gif',
      desc: 'Sự biến đổi bán kính nguyên tử, độ âm điện, năng lượng ion hóa thứ nhất trong chu kì và phân nhóm.',
      grade: 10,
      subject: 'hoa',
      tags: ['Bán kính', 'Độ âm điện', 'Năng lượng ion hóa'],
    },
    {
      id: 'hoa10-c2-3',
      title: 'Quy luật biến đổi tính kim loại - phi kim, acid - base',
      url: '/img/knowledge/hoa/10/hoa10-ch2-3.gif',
      desc: 'Biến đổi tính acid - base của oxide và hydroxide cao nhất; quy luật đường chéo trong bảng tuần hoàn.',
      grade: 10,
      subject: 'hoa',
      tags: ['Kim loại - Phi kim', 'Oxide', 'Hydroxide'],
    },
  ],

  'c10-bonding': [
    {
      id: 'hoa10-c3-1',
      title: 'Quy tắc Octet & Bản chất Liên kết Ion',
      url: '/img/knowledge/hoa/10/hoa10-ch3-1.gif',
      desc: 'Sự hình thành ion dương (cation), ion âm (anion), tương tác tĩnh điện và tinh thể ion.',
      grade: 10,
      subject: 'hoa',
      tags: ['Octet', 'Liên kết ion', 'Tinh thể'],
    },
    {
      id: 'hoa10-c3-2',
      title: 'Liên kết cộng hóa trị, Liên kết Hydrogen & Van der Waals',
      url: '/img/knowledge/hoa/10/hoa10-ch3-2.gif',
      desc: 'Cặp electron dùng chung, độ âm điện chênh lệch, liên kết liên phân tử hydrogen và ảnh hưởng nhiệt độ sôi.',
      grade: 10,
      subject: 'hoa',
      tags: ['Cộng hóa trị', 'Liên kết hydrogen', 'Nhiệt độ sôi'],
    },
  ],

  'c10-redox': [
    {
      id: 'hoa10-c4-1',
      title: 'Phản ứng Oxi hóa - Khử & Phương pháp Thăng bằng Electron',
      url: '/img/knowledge/hoa/10/hoa10-ch4-1.gif',
      desc: 'Quy tắc gán số oxi hóa, chất khử (cho e), chất oxi hóa (nhận e), 4 bước cân bằng thăng bằng electron.',
      grade: 10,
      subject: 'hoa',
      tags: ['Oxi hóa khử', 'Số oxi hóa', 'Thăng bằng e'],
    },
  ],

  'c10-energy': [
    {
      id: 'hoa10-c5-1',
      title: 'Khái niệm Enthalpy & Phản ứng Tỏa nhiệt - Thu nhiệt',
      url: '/img/knowledge/hoa/10/hoa10-ch5-1.gif',
      desc: 'Biến thiên enthalpy chuẩn ΔrHo298, dấu âm (tỏa nhiệt) và dấu dương (thu nhiệt), sơ đồ năng lượng.',
      grade: 10,
      subject: 'hoa',
      tags: ['Enthalpy', 'Tỏa nhiệt', 'Thu nhiệt'],
    },
    {
      id: 'hoa10-c5-2',
      title: 'Tính biến thiên Enthalpy từ Nhiệt tạo thành chuẩn',
      url: '/img/knowledge/hoa/10/hoa10-ch5-2.gif',
      desc: 'Công thức: ΔrHo298 = Σ ΔfHo298 (sản phẩm) - Σ ΔfHo298 (chất đầu).',
      grade: 10,
      subject: 'hoa',
      tags: ['Nhiệt tạo thành', 'Công thức tính', 'ΔfH'],
    },
    {
      id: 'hoa10-c5-3',
      title: 'Tính biến thiên Enthalpy từ Năng lượng liên kết (Eb)',
      url: '/img/knowledge/hoa/10/hoa10-ch5-3.gif',
      desc: 'Công thức: ΔrHo298 = Σ Eb (chất đầu) - Σ Eb (sản phẩm) cho các chất ở trạng thái khí.',
      grade: 10,
      subject: 'hoa',
      tags: ['Năng lượng liên kết', 'Phản ứng khí', 'Eb'],
    },
  ],

  'c10-rate': [
    {
      id: 'hoa10-c6-1',
      title: 'Khái niệm Tốc độ phản ứng hóa học & Tốc độ trung bình',
      url: '/img/knowledge/hoa/10/hoa10-ch6-1.gif',
      desc: 'Định nghĩa biến thiên nồng độ theo thời gian, định luật tác dụng khối lượng cho phản ứng đơn giản.',
      grade: 10,
      subject: 'hoa',
      tags: ['Tốc độ phản ứng', 'Nồng độ', 'Thời gian'],
    },
    {
      id: 'hoa10-c6-2',
      title: 'Ảnh hưởng của Nồng độ, Áp suất và Diện tích tiếp xúc',
      url: '/img/knowledge/hoa/10/hoa10-ch6-2.gif',
      desc: 'Mô hình va chạm hiệu quả; tăng nồng độ/áp suất làm tăng tần số va chạm giữa các hạt phản ứng.',
      grade: 10,
      subject: 'hoa',
      tags: ['Va chạm hiệu quả', 'Nồng độ', 'Áp suất'],
    },
    {
      id: 'hoa10-c6-3',
      title: 'Ảnh hưởng của Nhiệt độ (Hệ số nhiệt độ Van’t Hoff γ)',
      url: '/img/knowledge/hoa/10/hoa10-ch6-3.gif',
      desc: 'Quy tắc Van’t Hoff: Khi nhiệt độ tăng 10 độ C, tốc độ phản ứng tăng từ 2 đến 4 lần (v2 = v1 * γ^((T2-T1)/10)).',
      grade: 10,
      subject: 'hoa',
      tags: ['Van’t Hoff', 'Nhiệt độ', 'Hệ số γ'],
    },
    {
      id: 'hoa10-c6-4',
      title: 'Vai trò của Chất xúc tác trong Phản ứng hóa học',
      url: '/img/knowledge/hoa/10/hoa10-ch6-4.gif',
      desc: 'Chất xúc tác làm giảm năng lượng hoạt hóa (Ea) của phản ứng, không bị tiêu hao sau phản ứng.',
      grade: 10,
      subject: 'hoa',
      tags: ['Chất xúc tác', 'Năng lượng hoạt hóa', 'Enzyme'],
    },
  ],

  'c10-halogen': [
    {
      id: 'hoa10-c7-1',
      title: 'Đặc điểm chung & Tính chất vật lí nhóm Halogen (Nhóm VIIA)',
      url: '/img/knowledge/hoa/10/hoa10-ch7-1.gif',
      desc: 'Cấu hình ns2 np5, bán kính, trạng thái tập hợp (khí F2, Cl2; lỏng Br2; rắn I2) và màu sắc.',
      grade: 10,
      subject: 'hoa',
      tags: ['Halogen', 'VIIA', 'Tính chất vật lí'],
    },
    {
      id: 'hoa10-c7-2',
      title: 'Tính chất hóa học đặc trưng: Tính Oxi hóa mạnh',
      url: '/img/knowledge/hoa/10/hoa10-ch7-2.gif',
      desc: 'Quy luật tính oxi hóa giảm dần F2 > Cl2 > Br2 > I2; phản ứng với kim loại, H2, nước và muối halogenua.',
      grade: 10,
      subject: 'hoa',
      tags: ['Tính oxi hóa', 'Halogen đẩy nhau', 'Phản ứng'],
    },
    {
      id: 'hoa10-c7-3',
      title: 'Hydrogen Halide & Hydrohalic Acid (Tính acid và tính khử)',
      url: '/img/knowledge/hoa/10/hoa10-ch7-3.gif',
      desc: 'Quy luật độ mạnh acid: HF < HCl < HBr < HI. Tính khử tăng dần: HF < HCl < HBr < HI; nhận biết ion halide bằng AgNO3.',
      grade: 10,
      subject: 'hoa',
      tags: ['Hydrohalic acid', 'AgNO3', 'Kết tủa'],
    },
  ],

  /* ============================================================
     2. HÓA HỌC LỚP 12 (TRỌN BỘ 22 INFOGRAPHIC MAPSTUDY GDPT 2018)
     ============================================================ */
  'c12-ester': [
    {
      id: 'hoa12-b01',
      title: 'Bài 01: Khái niệm, Danh pháp & Tính chất vật lí của Ester',
      url: '/img/knowledge/hoa/12/hoa12-bai01-ester.jpg',
      desc: 'Công thức RCOOR\', danh pháp IUPAC (Tên R\' + tên gốc acid), nhiệt độ sôi, mùi hương đặc trưng.',
      grade: 12,
      subject: 'hoa',
      tags: ['Ester', 'Danh pháp', 'Mùi thơm'],
    },
    {
      id: 'hoa12-b02',
      title: 'Bài 02: Lipid, Chất béo & Acid béo (Fatty Acid) no / không no',
      url: '/img/knowledge/hoa/12/hoa12-bai02-lipid.jpg',
      desc: 'Cấu trúc triglyceride, acid béo (palmitic, stearic, oleic, linoleic), phản ứng xà phòng hóa, chỉ số xà phòng.',
      grade: 12,
      subject: 'hoa',
      tags: ['Lipid', 'Chất béo', 'Triglyceride', 'Xà phòng hóa'],
    },
  ],

  'c12-carbohydrate': [
    {
      id: 'hoa12-b03',
      title: 'Bài 03: Khái quát & Phân loại Carbohydrate',
      url: '/img/knowledge/hoa/12/hoa12-bai03-carbohydrate.jpg',
      desc: 'Phân loại Monosaccharide, Disaccharide, Polysaccharide; công thức chung Cn(H2O)m.',
      grade: 12,
      subject: 'hoa',
      tags: ['Carbohydrate', 'Đường', 'Phân loại'],
    },
    {
      id: 'hoa12-b04',
      title: 'Bài 04: Glucose & Fructose (Cấu tạo & Tính chất)',
      url: '/img/knowledge/hoa/12/hoa12-bai04-glucose-fructose.jpg',
      desc: 'Dạng mạch hở, mạch vòng alpha/beta, phản ứng tráng bạc với thuốc thử Tollens, phản ứng với Cu(OH)2.',
      grade: 12,
      subject: 'hoa',
      tags: ['Glucose', 'Fructose', 'Tráng bạc', 'Cu(OH)2'],
    },
    {
      id: 'hoa12-b05',
      title: 'Bài 05: Saccharose & Maltose (Cấu tạo & Thủy phân)',
      url: '/img/knowledge/hoa/12/hoa12-bai05-saccharose-maltose.jpg',
      desc: 'Liên kết glycoside, phản ứng thủy phân tạo glucose + fructose, vai trò trong công nghiệp mía đường.',
      grade: 12,
      subject: 'hoa',
      tags: ['Saccharose', 'Maltose', 'Glycoside'],
    },
    {
      id: 'hoa12-b06',
      title: 'Bài 06: Tinh bột & Cellulose (Polysaccharide)',
      url: '/img/knowledge/hoa/12/hoa12-bai06-tinhbot-cellulose.jpg',
      desc: 'Amylose, amylopectin, phản ứng màu với I2; cấu trúc sợi cellulose, phản ứng điều chế thuốc súng không khói.',
      grade: 12,
      subject: 'hoa',
      tags: ['Tinh bột', 'Cellulose', 'Iodine'],
    },
  ],

  'c12-amine': [
    {
      id: 'hoa12-b07',
      title: 'Bài 07: Amine (Đồng phân, Danh pháp & Tính base)',
      url: '/img/knowledge/hoa/12/hoa12-bai07-amine.jpg',
      desc: 'Bậc của amine (bậc I, II, III), so sánh tính base với NH3, aniline tác dụng với nước bromine.',
      grade: 12,
      subject: 'hoa',
      tags: ['Amine', 'Bậc amine', 'Aniline'],
    },
    {
      id: 'hoa12-b08',
      title: 'Bài 08: Amino Acid (Cấu tạo ion lưỡng cực & Tính chất)',
      url: '/img/knowledge/hoa/12/hoa12-bai08-amino-acid.jpg',
      desc: 'Hợp chất hữu cơ tạp chức, tính lưỡng tính, điểm đẳng điện, các amino acid thiết yếu (Gly, Ala, Val, Glu, Lys).',
      grade: 12,
      subject: 'hoa',
      tags: ['Amino acid', 'Lưỡng tính', 'Ion lưỡng cực'],
    },
    {
      id: 'hoa12-b09',
      title: 'Bài 09: Peptide & Liên kết Peptide',
      url: '/img/knowledge/hoa/12/hoa12-bai09-peptide.jpg',
      desc: 'Định nghĩa liên kết -CO-NH-, đầu N, đầu C, phản ứng màu biuret nhận biết từ tripeptide trở lên.',
      grade: 12,
      subject: 'hoa',
      tags: ['Peptide', 'Liên kết peptide', 'Biuret'],
    },
    {
      id: 'hoa12-b10',
      title: 'Bài 10 & 11: Protein & Cấu trúc không gian của Protein',
      url: '/img/knowledge/hoa/12/hoa12-bai10-protein.jpg',
      desc: 'Protein hình sợi, hình cầu, 4 bậc cấu trúc không gian, hiện tượng đông tụ bởi nhiệt và acid/kiềm.',
      grade: 12,
      subject: 'hoa',
      tags: ['Protein', 'Đông tụ', 'Cấu trúc 4 bậc'],
    },
  ],

  'c12-polymer': [
    {
      id: 'hoa12-b13',
      title: 'Bài 13: Đại cương về Polymer (Trùng hợp & Trùng ngưng)',
      url: '/img/knowledge/hoa/12/hoa12-bai13-dai-cuong-polymer.jpg',
      desc: 'Khái niệm monomer, mắt xích, độ polymer hóa n, phân biệt phản ứng trùng hợp và trùng ngưng.',
      grade: 12,
      subject: 'hoa',
      tags: ['Polymer', 'Trùng hợp', 'Trùng ngưng'],
    },
    {
      id: 'hoa12-b14',
      title: 'Bài 14, 15, 16: Vật liệu Polymer, Tơ tổng hợp & Cao su',
      url: '/img/knowledge/hoa/12/hoa12-bai14-vat-lieu-polymer.jpg',
      desc: 'Chất dẻo (PE, PP, PVC, PS), Tơ (nilon-6,6, tơ olon, tơ visco), Cao su buna, buna-S, buna-N và keo dán.',
      grade: 12,
      subject: 'hoa',
      tags: ['Chất dẻo', 'Tơ nilon', 'Cao su'],
    },
  ],

  'c12-metal': [
    {
      id: 'hoa12-b17',
      title: 'Bài 17: Tính chất chung của Kim loại & Liên kết kim loại',
      url: '/img/knowledge/hoa/12/hoa12-bai17-kim-loai.jpg',
      desc: 'Tính dẻo, dẫn điện, dẫn nhiệt, ánh kim giải thích bằng electron tự do; tính khử của nguyên tử kim loại.',
      grade: 12,
      subject: 'hoa',
      tags: ['Kim loại', 'Tính dẻo', 'Dẫn điện'],
    },
    {
      id: 'hoa12-b18',
      title: 'Bài 18: Dãy điện hóa kim loại & Quy tắc Alpha',
      url: '/img/knowledge/hoa/12/hoa12-bai18-day-dien-hoa.jpg',
      desc: 'So sánh tính khử của kim loại và tính oxi hóa của cation kim loại; quy tắc alpha dự đoán chiều phản ứng.',
      grade: 12,
      subject: 'hoa',
      tags: ['Dãy điện hóa', 'Quy tắc alpha', 'Thế điện cực'],
    },
    {
      id: 'hoa12-b20',
      title: 'Bài 20 & 20.2: Ăn mòn kim loại & Phương pháp điều chế',
      url: '/img/knowledge/hoa/12/hoa12-bai20-an-mon-kim-loai.jpg',
      desc: 'Ăn mòn hóa học và ăn mòn điện hóa; các phương pháp nhiệt luyện, thủy luyện, điện phân.',
      grade: 12,
      subject: 'hoa',
      tags: ['Ăn mòn điện hóa', 'Nhiệt luyện', 'Thủy luyện'],
    },
  ],

  'c12-electro': [
    {
      id: 'hoa12-b21',
      title: 'Bài 21: Pin điện hóa & Thế điện cực chuẩn',
      url: '/img/knowledge/hoa/12/hoa12-bai21-pin-dien-hoa.jpg',
      desc: 'Cực âm (Anode - oxi hóa), cực dương (Cathode - khử), cầu muối; sức điện động chuẩn E°pin = E°(+) - E°(-).',
      grade: 12,
      subject: 'hoa',
      tags: ['Pin điện hóa', 'Sức điện động', 'Anode', 'Cathode'],
    },
    {
      id: 'hoa12-b22',
      title: 'Bài 22: Điện phân nóng chảy & Điện phân dung dịch',
      url: '/img/knowledge/hoa/12/hoa12-bai22-dien-phan.jpg',
      desc: 'Thứ tự khử tại Cathode và thứ tự oxi hóa tại Anode; công thức Faraday: m = AIt / nF.',
      grade: 12,
      subject: 'hoa',
      tags: ['Điện phân', 'Định luật Faraday', 'Cathode', 'Anode'],
    },
  ],

  'c12-transition': [
    {
      id: 'hoa12-b23',
      title: 'Bài 23: Một số tính chất và ứng dụng của Phức chất (Mới GDPT 2018)',
      url: '/img/knowledge/hoa/12/hoa12-bai23-phuc-chat.jpg',
      desc: 'Nguyên tử trung tâm, ligand, số phối trí, dấu hiệu tạo phức (kết tủa tan, đổi màu), phản ứng của Cu2+, Al3+, Ag+.',
      grade: 12,
      subject: 'hoa',
      tags: ['Phức chất', 'Ligand', 'Số phối trí', 'GDPT 2018'],
    },
  ],

  /* ============================================================
     3. VẬT LÍ LỚP 10 (8 TRANG A4 TỔNG HỢP TOÀN BỘ CÔNG THỨC LÝ THUYẾT)
     ============================================================ */
  'ly-c1-donghoc': [
    {
      id: 'ly10-hk1-1',
      title: 'Sai số phép đo, Tốc độ, Vận tốc & Chuyển động biến đổi đều',
      url: '/img/knowledge/ly/10/ly10-hk1-1.jpg',
      desc: 'Sai số tuyệt đối/tỉ đối; công thức cộng vận tốc v13 = v12 + v23; hệ thức độc lập thời gian v^2 - v0^2 = 2as.',
      grade: 10,
      subject: 'ly',
      tags: ['Sai số', 'Vận tốc', 'Biến đổi đều', 'Gia tốc'],
    },
    {
      id: 'ly10-hk1-2',
      title: 'Rơi tự do, Chuyển động ném ngang & Ném xiên',
      url: '/img/knowledge/ly/10/ly10-hk1-2.jpg',
      desc: 'Phương trình quỹ đạo ném ngang y = (g/(2v0^2)) * x^2; tầm xa L = v0 * sqrt(2H/g); tầm cao ném xiên Hmax.',
      grade: 10,
      subject: 'ly',
      tags: ['Rơi tự do', 'Ném ngang', 'Ném xiên', 'Tầm xa'],
    },
  ],

  'ly-c2-dongluchoc': [
    {
      id: 'ly10-hk1-3',
      title: 'Ba định luật Newton & Các lực cơ học trong tự nhiên',
      url: '/img/knowledge/ly/10/ly10-hk1-3.jpg',
      desc: 'Định luật I (quán tính), Định luật II (F = ma), Định luật III (tương hỗ); trọng lực P = mg, lực ma sát Fms = μN.',
      grade: 10,
      subject: 'ly',
      tags: ['Định luật Newton', 'Lực ma sát', 'Quán tính'],
    },
    {
      id: 'ly10-hk2-1',
      title: 'Cân bằng vật rắn, Moment ngẫu lực, Công cơ học & Công suất',
      url: '/img/knowledge/ly/10/ly10-hk2-1.jpg',
      desc: 'Quy tắc moment M = F * d; công cơ học A = F * s * cos(α); công suất P = A / t = F * v.',
      grade: 10,
      subject: 'ly',
      tags: ['Moment ngẫu lực', 'Công cơ học', 'Công suất'],
    },
    {
      id: 'ly10-hk2-2',
      title: 'Động năng, Thế năng & Định luật bảo toàn cơ năng',
      url: '/img/knowledge/ly/10/ly10-hk2-2.jpg',
      desc: 'Động năng Wd = 1/2 mv^2; thế năng trọng trường Wt = mgz; bảo toàn cơ năng W = Wd + Wt = const trong trọng trường.',
      grade: 10,
      subject: 'ly',
      tags: ['Động năng', 'Thế năng', 'Bảo toàn cơ năng'],
    },
    {
      id: 'ly10-hk2-3',
      title: 'Động lượng & Định luật bảo toàn động lượng, Va chạm',
      url: '/img/knowledge/ly/10/ly10-hk2-3.jpg',
      desc: 'Vector động lượng p = mv; định luật bảo toàn động lượng cho hệ kín; va chạm đàn hồi và va chạm mềm.',
      grade: 10,
      subject: 'ly',
      tags: ['Động lượng', 'Hệ kín', 'Va chạm'],
    },
    {
      id: 'ly10-hk2-4',
      title: 'Chuyển động tròn đều, Gia tốc & Lực hướng tâm',
      url: '/img/knowledge/ly/10/ly10-hk2-4.jpg',
      desc: 'Tốc độ góc ω = 2π / T; gia tốc hướng tâm aht = v^2 / r = ω^2 * r; lực hướng tâm Fht = m * aht.',
      grade: 10,
      subject: 'ly',
      tags: ['Chuyển động tròn', 'Lực hướng tâm', 'Tốc độ góc'],
    },
  ],

  /* ============================================================
     4. VẬT LÍ LỚP 11 (11 TRANG CHUYÊN SÂU MAPSTUDY - DAO ĐỘNG, SÓNG, ĐIỆN)
     ============================================================ */
  'ly-c1-daodong': [
    {
      id: 'ly11-p01',
      title: 'Chuyên đề 1: Mô tả Dao động điều hòa & Phương trình li độ - vận tốc - gia tốc',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-01.jpg',
      desc: 'Phương trình x = A cos(ωt + φ), chu kì T, tần số f, vận tốc cực đại vmax = ωA, gia tốc cực đại amax = ω^2 * A.',
      grade: 11,
      subject: 'ly',
      tags: ['Dao động điều hòa', 'Li độ', 'Vận tốc', 'Gia tốc'],
    },
    {
      id: 'ly11-p02',
      title: 'Chuyên đề 1 (tiếp): Mối quan hệ vuông pha & Đồ thị dao động điều hòa',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-02.jpg',
      desc: 'v sớm pha π/2 so với x; a ngược pha với x; hệ thức độc lập A^2 = x^2 + (v/ω)^2; đọc đồ thị x(t), v(t).',
      grade: 11,
      subject: 'ly',
      tags: ['Vuông pha', 'Hệ thức độc lập', 'Đồ thị dao động'],
    },
    {
      id: 'ly11-p03',
      title: 'Chuyên đề 1 (tiếp): Con lắc lò xo, Con lắc đơn & Năng lượng dao động',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-03.jpg',
      desc: 'Tần số góc con lắc lò xo ω = sqrt(k/m); con lắc đơn ω = sqrt(g/l); cơ năng W = 1/2 kA^2 bảo toàn.',
      grade: 11,
      subject: 'ly',
      tags: ['Con lắc lò xo', 'Con lắc đơn', 'Cơ năng dao động'],
    },
  ],

  'ly-c2-song': [
    {
      id: 'ly11-p04',
      title: 'Chuyên đề 2: Tổng quan về Sóng cơ, Bước sóng & Phương trình sóng',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-04.jpg',
      desc: 'Sóng ngang, sóng dọc; bước sóng λ = v * T = v / f; phương trình truyền sóng u(x,t) = A cos(ωt - 2πx/λ).',
      grade: 11,
      subject: 'ly',
      tags: ['Sóng cơ', 'Bước sóng', 'Phương trình sóng'],
    },
    {
      id: 'ly11-p05',
      title: 'Chuyên đề 2 (tiếp): Sóng âm, Cường độ âm & Mức cường độ âm (dB)',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-05.jpg',
      desc: 'Sóng âm trong các môi trường; mức cường độ âm L(dB) = 10 * log(I / I0); đặc trưng sinh lí của âm (độ cao, độ to, âm sắc).',
      grade: 11,
      subject: 'ly',
      tags: ['Sóng âm', 'Mức cường độ âm', 'Decibel'],
    },
    {
      id: 'ly11-p06',
      title: 'Chuyên đề 2 (tiếp): Giao thoa sóng cơ & Sóng dừng trên dây',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-06.jpg',
      desc: 'Hai nguồn kết hợp; điều kiện cực đại d2 - d1 = kλ; sóng dừng hai đầu cố định l = k * λ/2, một cố định một tự do.',
      grade: 11,
      subject: 'ly',
      tags: ['Giao thoa', 'Cực đại - Cực tiểu', 'Sóng dừng'],
    },
  ],

  'ly-c3-dientruong': [
    {
      id: 'ly11-p07',
      title: 'Chuyên đề 3: Điện tích, Định luật Coulomb & Điện trường đều',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-07.jpg',
      desc: 'Lực tương tác F = k |q1 q2| / (ε r^2); cường độ điện trường E = F / q = k |Q| / (ε r^2); đường sức điện.',
      grade: 11,
      subject: 'ly',
      tags: ['Coulomb', 'Điện trường', 'Đường sức điện'],
    },
    {
      id: 'ly11-p08',
      title: 'Chuyên đề 3 (tiếp): Công lực điện, Điện thế & Hiệu điện thế',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-08.jpg',
      desc: 'Công không phụ thuộc dạng đường đi: A = qEd; hiệu điện thế U = A / q = Ed; điện thế V.',
      grade: 11,
      subject: 'ly',
      tags: ['Công lực điện', 'Hiệu điện thế', 'U = Ed'],
    },
    {
      id: 'ly11-p09',
      title: 'Chuyên đề 3 (tiếp): Tụ điện, Điện dung & Năng lượng điện trường',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-09.jpg',
      desc: 'Điện dung C = Q / U; ghép tụ nối tiếp và song song; năng lượng điện trường trong tụ W = 1/2 CU^2 = 1/2 Q^2 / C.',
      grade: 11,
      subject: 'ly',
      tags: ['Tụ điện', 'Điện dung', 'Năng lượng tụ'],
    },
    {
      id: 'ly11-p10',
      title: 'Chuyên đề 4: Dòng điện không đổi & Định luật Ohm toàn mạch',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-10.jpg',
      desc: 'Cường độ dòng điện I = q / t; suất điện động E của nguồn; định luật Ohm toàn mạch I = E / (R_ngoài + r).',
      grade: 11,
      subject: 'ly',
      tags: ['Dòng điện', 'Định luật Ohm', 'Suất điện động'],
    },
    {
      id: 'ly11-p11',
      title: 'Chuyên đề 4 (tiếp): Công & Công suất nguồn điện, Định luật Joule - Lenz',
      url: '/img/knowledge/ly/11/ly11-chuyensau-trang-11.jpg',
      desc: 'Công nguồn Anguon = E * I * t; nhiệt lượng tỏa ra Q = R * I^2 * t; hiệu suất nguồn điện H = U / E.',
      grade: 11,
      subject: 'ly',
      tags: ['Công suất', 'Joule - Lenz', 'Hiệu suất nguồn'],
    },
  ],

  /* ============================================================
     5. VẬT LÍ LỚP 12 (VẬT LÝ NHIỆT GDPT 2018 - 4 TỆP INFOGRAPHIC MÀU)
     ============================================================ */
  'ly-c1-nhiet': [
    {
      id: 'ly12-nhiet-1',
      title: 'Dạng 1: Định luật 1 Nhiệt động lực học & Truyền nhiệt',
      url: '/img/knowledge/ly/12/ly12-vat-ly-nhiet-1.jpg',
      desc: 'Định luật 1: ΔU = A + Q (quy ước dấu); thang Kelvin T(K) = t(°C) + 273; nhiệt lượng Q = mcΔT, nóng chảy Q = λm, hóa hơi Q = Lm.',
      grade: 12,
      subject: 'ly',
      tags: ['Nhiệt động lực học', 'ΔU = A + Q', 'Thang Kelvin', 'Nhiệt dung riêng'],
    },
    {
      id: 'ly12-nhiet-2',
      title: 'Dạng 2: Mô hình Động học phân tử & Cấu trúc chuyển thể của chất',
      url: '/img/knowledge/ly/12/ly12-vat-ly-nhiet-2.jpg',
      desc: 'Chuyển động nhiệt Brown, tương tác phân tử ở thể rắn, lỏng, khí; quá trình nóng chảy, đông đặc, bay hơi, sôi.',
      grade: 12,
      subject: 'ly',
      tags: ['Động học phân tử', 'Thể rắn - lỏng - khí', 'Chuyển thể'],
    },
    {
      id: 'ly12-nhiet-3',
      title: 'Dạng 3: Các Định luật Chất khí lý tưởng & Phương trình Clapeyron - Mendeleev',
      url: '/img/knowledge/ly/12/ly12-vat-ly-nhiet-3.jpg',
      desc: 'Định luật Boyle (đẳng nhiệt pV = const), Charles (đẳng áp V/T = const); phương trình trạng thái khí lý tưởng pV = nRT.',
      grade: 12,
      subject: 'ly',
      tags: ['Khí lý tưởng', 'Boyle', 'Charles', 'pV = nRT'],
    },
    {
      id: 'ly12-nhiet-4',
      title: 'Dạng 4: Nội năng, Nhiệt độ & Cân bằng nhiệt',
      url: '/img/knowledge/ly/12/ly12-vat-ly-nhiet-4.jpg',
      desc: 'Bản chất nội năng U; các cách làm biến đổi nội năng (thực hiện công và truyền nhiệt); nguyên lí truyền nhiệt Q_tỏa = Q_thu.',
      grade: 12,
      subject: 'ly',
      tags: ['Nội năng', 'Cân bằng nhiệt', 'Q_tỏa = Q_thu'],
    },
  ],
};

/* Helper lấy danh sách infographic cho một topic_id */
export function getInfographicsForTopic(topicId) {
  if (!topicId) return [];
  // Tìm chính xác topicId
  if (KNOWLEDGE_INFOGRAPHICS[topicId]) {
    return KNOWLEDGE_INFOGRAPHICS[topicId];
  }
  // Fallback khớp tiền tố hoặc từ khóa
  for (const [key, list] of Object.entries(KNOWLEDGE_INFOGRAPHICS)) {
    if (topicId.includes(key) || key.includes(topicId)) {
      return list;
    }
  }
  return [];
}

/* Helper lấy toàn bộ infographic theo môn và khối lớp */
export function getInfographicsBySubjectGrade(subject, grade) {
  const result = [];
  for (const list of Object.values(KNOWLEDGE_INFOGRAPHICS)) {
    for (const item of list) {
      const matchSubject = !subject || item.subject === subject;
      const matchGrade = !grade || item.grade === Number(grade);
      if (matchSubject && matchGrade) {
        result.push(item);
      }
    }
  }
  return result;
}
