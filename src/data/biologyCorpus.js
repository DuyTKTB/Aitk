/* ============================================================
   biologyCorpus.js — CƠ SỞ TRI THỨC SINH HỌC CHUYÊN SÂU ELEC AI
   ------------------------------------------------------------
   Trích xuất trực tiếp từ bộ học liệu gốc:
   "D:\Tải Xuống\app\Tài liệu Sinh học Elec AI"
     • Elec AI Sinh học 12 (8 Chuyên đề lý thuyết + Đúng/Sai + Trả lời ngắn + Nhiều lựa chọn)
     • SINH HỌC 10 - Câu hỏi theo bài (31 bài GDPT 2018)
     • Sinh học 11 (48 chuyên đề Trao đổi chất, Cảm ứng, Sinh trưởng, Sinh sản)
     • Đề thi Tốt nghiệp THPT 2026 (Đề chính thức Bộ GD&ĐT MĐ 0435, Chuyên KHTN, Chuyên AMS, Phan Bội Châu...)

   Hỗ trợ song ngữ danh pháp chuẩn Bộ GD&ĐT (GDPT 2018/2025):
   DNA/ADN, RNA/ARN, gene/gen, allele/alen, nucleotide/nuclêôtit,
   amino acid/axit amin, chromatid/crômatit, synapse/xináp, hormone/hoocmôn...
   ============================================================ */

export const BIOLOGY_CORPUS = [
  /* ============================================================
     PHẦN I — SINH HỌC 12: DI TRUYỀN PHÂN TỬ & CÔNG NGHỆ GENE
     ============================================================ */
  {
    id: 'bio12-dna-structure-replication',
    grade: [10, 12],
    chapter: 'Di truyền phân tử',
    title: 'Cấu trúc, Chức năng và Cơ chế Tái bản DNA (Nhân đôi ADN)',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 1: Di truyền phân tử',
    keywords: [
      'dna', 'adn', 'nucleotide', 'nucleotit', 'deoxyribose', 'phosphodiester',
      'lien ket hydrogen', 'lien ket hidro', 'tai ban dna', 'nhan doi adn',
      'dna polymerase', 'ligase', 'helicase', 'okazaki', 'ban bao toan', 'ntbs',
    ],
    text: [
      'CẤU TRÚC DNA: Đại phân tử hữu cơ đa phân, đơn phân là 4 loại nucleotide: Adenine (A), Thymine (T), Guanine (G), Cytosine (C/X); mỗi nu gồm đường deoxyribose C5H10O4, nhóm phosphoric acid H3PO4 và base nitrogen.',
      'Trên 1 mạch: các nu liên kết cộng hóa trị phosphodiester bền vững theo chiều 5\' → 3\' (tổng số liên kết phosphodiester giữa các nu của gene là N - 2; tổng liên kết hóa trị của cả gene là 2N - 2).',
      'Giữa 2 mạch ngược chiều (3\'→5\' và 5\'→3\'): liên kết theo Nguyên tắc bổ sung (NTBS): A liên kết T bằng 2 liên kết hydrogen (A=T), G liên kết C bằng 3 liên kết hydrogen (G≡C) → Tổng liên kết H = 2A + 3G; N = 2A + 2G; %A = %T, %G = %C. Mỗi chu kì xoắn gồm 10 cặp nu = 20 nu, dài 34 Å (3,4 nm), đường kính 20 Å → Chiều dài L = (N/2) × 3,4 Å, khối lượng M = N × 300 đvC.',
      'TÁI BẢN DNA (NHÂN ĐÔI ADN): Diễn ra ở pha S kì trung gian theo 2 nguyên tắc: NTBS và Bán bảo toàn (mỗi DNA con giữ 1 mạch cũ của mẹ và 1 mạch mới). Enzyme tháo xoắn tách 2 mạch; RNA polymerase tổng hợp đoạn mồi 3\'-OH; DNA polymerase chỉ tổng hợp mạch mới theo chiều 5\' → 3\' nên trên mạch khuôn 3\' → 5\' mạch mới tổng hợp liên tục, còn trên mạch khuôn 5\' → 3\' tổng hợp gián đoạn từng đoạn Okazaki rồi được enzyme ligase nối lại.',
      'CÔNG THỨC TÁI BẢN k LẦN (từ a phân tử DNA ban đầu): Số DNA con = a × 2^k; Số DNA con có 2 mạch hoàn toàn mới = a × (2^k - 2); Số nucleotide môi trường cung cấp N_mt = a × N × (2^k - 1); Số nu môi trường cho mạch mới hoàn toàn = a × N × (2^k - 2).',
    ].join(' '),
  },
  {
    id: 'bio12-transcription-translation-genetic-code',
    grade: [12],
    chapter: 'Di truyền phân tử',
    title: 'Cấu trúc Gene, Hệ Gene, Phiên mã, Mã di truyền & Dịch mã',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 1: Phiên mã & Dịch mã',
    keywords: [
      'gene', 'gen', 'phien ma', 'dich ma', 'ma di truyen', 'codon', 'anticodon',
      'mrna', 'trna', 'rrna', 'marn', 'tarn', 'rarn', 'ribosome', 'riboxom',
      'polypeptide', 'polyribosome', 'polysome', 'exon', 'intron', 'aug', 'uaa', 'uag', 'uga',
      'phien ma nguoc', 'reverse transcriptase',
    ],
    text: [
      'CẤU TRÚC GENE: Gồm 3 vùng: (1) Vùng điều hòa ở đầu 3\' mạch khuôn (có trình tự promoter khởi động và trình tự liên kết protein điều hòa); (2) Vùng mã hóa mang thông tin mã hóa chuỗi polypeptide hoặc RNA (ở sinh vật nhân sơ là gene không phân mảnh chỉ có vùng mã hóa liên tục; ở sinh vật nhân thực phần lớn là gene phân mảnh xen kẽ các đoạn mã hóa exon và đoạn không mã hóa intron); (3) Vùng kết thúc ở đầu 5\' mạch khuôn.',
      'PHIÊN MÃ (DNA → RNA): Enzyme RNA polymerase bám vào vùng khởi động (promoter), trượt trên mạch khuôn 3\' → 5\' tổng hợp mạch RNA theo chiều 5\' → 3\' (NTBS: A_khuôn - U_RNA, T_khuôn - A_RNA, G_khuôn - C_RNA, C_khuôn - G_RNA). Ở nhân thực: tiền mRNA được gắn mũ 7-methylguanosine ở đầu 5\', đuôi poly-A ở đầu 3\', cắt bỏ intron và nối các exon tạo mRNA trưởng thành.',
      'PHIÊN MÃ NGƯỢC (RNA → cDNA): Nhờ enzyme reverse transcriptase (có ở retrovirus như HIV), từ khuôn RNA tổng hợp mạch cDNA → DNA mạch kép tích hợp vào hệ gene tế bào chủ.',
      'MÃ DI TRUYỀN: Là mã bộ ba (3 nu liên tiếp trên mRNA = 1 codon). Có 64 bộ ba: 1 codon mở đầu 5\'AUG3\' (mã hóa Methionine ở nhân thực, formyl-Methionine ở nhân sơ); 3 codon kết thúc (5\'UAA3\', 5\'UAG3\', 5\'UGA3\' — KHÔNG mã hóa amino acid và không có tRNA tương ứng); 61 bộ ba mã hóa 20 loại amino acid. Đặc điểm: đọc liên tục không gối nhau, tính đặc hiệu (1 bộ ba chỉ mã hóa 1 aa), tính thoái hóa (nhiều bộ ba cùng mã hóa 1 aa, trừ AUG và UGG), tính phổ biến.',
      'DỊCH MÃ (mRNA → Polypeptide): Gồm hoạt hóa amino acid (aa + ATP → aa-AMP + tRNA → aa-tRNA) và tổng hợp chuỗi polypeptide tại ribosome. Nhiều ribosome (polyribosome/polysome) cùng trượt trên 1 mRNA từ 5\' → 3\' giúp tăng hiệu suất tổng hợp nhiều chuỗi polypeptide cùng loại. Công thức: Số codon mã hóa = rN/3 - 1; Số amino acid chuỗi hoàn chỉnh = rN/3 - 2.',
    ].join(' '),
  },
  {
    id: 'bio12-operon-lac-regulation',
    grade: [12],
    chapter: 'Di truyền phân tử',
    title: 'Điều hòa biểu hiện Gene — Mô hình Operon Lac ở E. coli (Jacob & Monod)',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 1: Điều hòa biểu hiện gene',
    keywords: [
      'dieu hoa bieu hien gene', 'dieu hoa hoat dong gen', 'operon lac', 'jacob', 'monod',
      'promoter', 'operator', 'vung p', 'vung o', 'lacz', 'lacy', 'laca', 'laci',
      'protein uc che', 'lactose', 'allolactose', 'e. coli', 'ecoli',
    ],
    text: [
      'CẤU TRÚC OPERON LAC Ở E. COLI: Gồm 3 thành phần nằm liền nhau trên DNA: (1) Vùng khởi động P (Promoter): nơi enzyme RNA polymerase bám vào để khởi đầu phiên mã; (2) Vùng vận hành O (Operator): nơi protein ức chế bám vào ngăn cản phiên mã; (3) Nhóm gene cấu trúc lacZ (mã hóa β-galactosidase phân giải lactose), lacY (mã hóa permease vận chuyển lactose qua màng), lacA (mã hóa transacetylase).',
      'LƯU Ý BẪY ĐỀ THI: Gene điều hòa lacI (R) nằm trước operon nhưng KHÔNG thuộc cấu trúc của Operon Lac! Gene lacI luôn phiên mã và dịch mã tổng hợp protein ức chế cả khi môi trường có hoặc không có lactose.',
      'KHI MÔI TRƯỜNG KHÔNG CÓ LACTOSE: Protein ức chế (do gene lacI tổng hợp) có cấu hình không gian hoạt động, bám vào vùng vận hành O → ngăn RNA polymerase trượt qua → các gene cấu trúc lacZ, lacY, lacA KHÔNG phiên mã.',
      'KHI MÔI TRƯỜNG CÓ LACTOSE: Một lượng nhỏ lactose chuyển thành đồng phân allolactose (chất cảm ứng) liên kết với protein ức chế → làm biến đổi cấu hình không gian khiến protein ức chế KHÔNG bám được vào vùng O → RNA polymerase phiên mã nhóm gene lacZ, lacY, lacA tạo 1 phân tử mRNA polycistronic duy nhất, dịch mã ra 3 loại enzyme phân giải lactose. Khi lactose cạn, protein ức chế lại bám vào O tắt phiên mã.',
      'BẪY ĐỘT BIẾN OPERON LAC: Đột biến hỏng vùng O hoặc đột biến hỏng gene lacI (protein ức chế mất chức năng bám O) → operon phiên mã liên tục ngay cả khi không có lactose. Đột biến hỏng vùng P → operon không phiên mã được cả khi có lactose.',
    ].join(' '),
  },
  {
    id: 'bio12-gene-mutation-biotech',
    grade: [12],
    chapter: 'Di truyền phân tử',
    title: 'Đột biến Gene (Đột biến điểm, 5-BU, A*) và Công nghệ DNA tái tổ hợp',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 2: Đột biến gene & Công nghệ gene',
    keywords: [
      'dot bien gene', 'dot bien gen', 'dot bien diem', 'the dot bien', '5-bu', '5bu',
      'acridine', 'bazơ hiếm', 'base hiem', 'thay the', 'mat 1 cap', 'them 1 cap',
      'cong nghe gene', 'dna tai to hop', 'plasmid', 'restrictase', 'ligase', 't-dna', 'insulin',
    ],
    text: [
      'ĐỘT BIẾN GENE & ĐỘT BIẾN ĐIỂM: Biến đổi trong cấu trúc của gene liên quan đến 1 hoặc một số cặp nucleotide. Đột biến liên quan đến 1 cặp nu gọi là đột biến điểm (3 dạng: thay thế 1 cặp nu, mất 1 cặp nu, thêm 1 cặp nu). Thể đột biến là cá thể mang gene đột biến ĐÃ biểu hiện thành kiểu hình (đột biến lặn chỉ biểu hiện ở trạng thái đồng hợp aa hoặc trên vùng không tương đồng X ở giới XY).',
      'SO SÁNH 3 DẠNG ĐỘT BIẾN ĐIỂM: (1) Thay thế 1 cặp nu: tổng số nu N và chiều dài L không đổi; thay A-T → G-C làm tăng 1 liên kết H; thay G-C → A-T làm giảm 1 liên kết H; chỉ ảnh hưởng tối đa 1 bộ ba (có thể đồng nghĩa do tính thoái hóa, sai nghĩa đổi 1 aa, hoặc vô nghĩa tạo codon kết thúc sớm UAA/UAG/UGA). (2) Mất / Thêm 1 cặp nu: làm dịch khung đọc mã di truyền từ vị trí đột biến về sau (đột biến dịch khung); mất A-T giảm 2 lk H, mất G-C giảm 3 lk H.',
      'CƠ CHẾ PHÁT SINH ĐỘT BIẾN: (1) Base dạng hiếm (hỗ biến *): A* → G-C sau 2 lần nhân đôi; G* → A-T sau 2 lần nhân đôi (số gene đột biến tạo ra qua k lần nhân đôi từ 1 gene mang 1 base hiếm là 2^(k-1) - 1). (2) Hóa chất 5-bromouracil (5-BU): gây thay thế A-T → G-C qua 3 lần nhân đôi (A-T → A-5BU → G-5BU → G-C). (3) Acridine: chèn vào mạch khuôn gây thêm 1 cặp nu; chèn vào mạch mới gây mất 1 cặp nu. (4) Tia UV: tạo dimer Thymine trên cùng 1 mạch gây mất 1 cặp nu.',
      'CÔNG NGHỆ DNA TÁI TỔ HỢP (CÔNG NGHỆ GENE): Quy trình 3 bước tạo sinh vật biến đổi gene: Bước 1: Tạo DNA tái tổ hợp (tách gene cần chuyển và thể truyền plasmid/virus; cắt cả hai bằng cùng một loại enzyme cắt giới hạn restrictase để tạo đầu dính bổ sung; nối bằng enzyme DNA ligase tạo DNA tái tổ hợp). Bước 2: Đưa DNA tái tổ hợp vào tế bào nhận (biến nạp bằng muối CaCl2 hoặc xung điện vào vi khuẩn E. coli, hoặc dùng vi khuẩn Agrobacterium tumefaciens mang plasmid Ti có T-DNA chuyển vào thực vật). Bước 3: Phân lập dòng tế bào chứa DNA tái tổ hợp nhờ gene đánh dấu (kháng kháng sinh hoặc phát huỳnh quang). Lưu ý: chuyển gene insulin người vào E. coli phải dùng cDNA (đã cắt bỏ intron) vì vi khuẩn nhân sơ không có bộ máy cắt intron!',
    ].join(' '),
  },

  /* ============================================================
     PHẦN II — SINH HỌC 12: NHIỄM SẮC THỂ, PHÂN BÀO & ĐỘT BIẾN NST
     ============================================================ */
  {
    id: 'bio12-chromosome-mitosis-meiosis',
    grade: [10, 12],
    chapter: 'Di truyền nhiễm sắc thể',
    title: 'Cấu trúc siêu hiển vi Nhiễm sắc thể, Nguyên phân và Giảm phân',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 3: NST & Phân bào',
    keywords: [
      'nhiem sac the', 'nst', 'nucleosome', 'histone', 'chromatid', 'cromatit',
      'tam dong', 'dau mut', 'telomere', 'nguyen phan', 'giam phan', 'tiep hop',
      'trao doi cheo', 'ki giua', 'ki sau', 'ki dau', 'ki trung gian',
    ],
    text: [
      'CẤU TRÚC SIÊU HIỂN VI CỦA NST NHÂN THỰC: Đơn vị cơ bản là Nucleosome gồm lõi 8 phân tử protein histone được quấn quanh bởi 1 và 3/4 vòng DNA (khoảng 146 cặp nucleotide). Các bậc cuộn xoắn: Phân tử DNA mạch kép (2 nm) → Chuỗi nucleosome / Sợi cơ bản (10 nm) → Sợi nhiễm sắc (30 nm) → Sợi siêu xoắn / Vùng xếp cuộn (300 nm) → Chromatid (700 nm) → NST kép tại kì giữa (1400 nm, quan sát rõ nhất dưới kính hiển vi).',
      'BẢNG BIẾN ĐỔI NST QUA NGUYÊN PHÂN (tế bào 2n): Kì trung gian (pha S nhân đôi): 2n NST kép, 4n chromatid, 2n tâm động; Kì đầu & Kì giữa: 2n NST kép (xếp 1 hàng trên mặt phẳng xích đạo ở kì giữa); Kì sau (NST kép tách tâm động thành 2 NST đơn phân li về 2 cực): 4n NST đơn, 0 chromatid, 4n tâm động; Kì cuối (tách thành 2 tế bào con): mỗi tế bào con có 2n NST đơn.',
      'GIẢM PHÂN (tế bào sinh dục chín 2n qua 2 lần phân bào nhưng DNA chỉ nhân đôi 1 lần): Giảm phân I: Kì đầu I có tiếp hợp và trao đổi chéo giữa các chromatid khác nguồn trong cặp NST tương đồng; Kì giữa I các cặp NST tương đồng kép xếp thành 2 HÀNG trên mặt phẳng xích đạo; Kì sau I các NST kép phân li độc lập về 2 cực (2n NST kép); kết thúc GP I tạo 2 tế bào con có n NST kép. Giảm phân II: Kì giữa II n NST kép xếp 1 hàng; Kì sau II tách tâm động thành 2n NST đơn; kết thúc GP II tạo 4 tế bào đơn bội (n NST đơn). Ở động vật: 1 tế bào sinh tinh (2n) giảm phân cho 4 tinh trùng (n); 1 tế bào sinh trứng (2n) giảm phân chỉ cho 1 trứng (n) và 3 thể cực tiêu biến.',
    ].join(' '),
  },
  {
    id: 'bio12-chromosome-mutations',
    grade: [12],
    chapter: 'Di truyền nhiễm sắc thể',
    title: 'Đột biến Cấu trúc NST và Đột biến Số lượng NST (Lệch bội & Đa bội)',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 3: Đột biến NST',
    keywords: [
      'dot bien cau truc nst', 'mat doan', 'lap doan', 'dao doan', 'chuyen doan',
      'dot bien so luong nst', 'lech boi', 'da boi', 'the ba', 'the mot', 'the khong',
      'tu da boi', 'di da boi', 'song nhi boi', 'colchicine', 'khong phan li',
    ],
    text: [
      '4 DẠNG ĐỘT BIẾN CẤU TRÚC NST: (1) Mất đoạn: làm giảm số lượng gene trên NST, thường gây chết hoặc giảm sức sống (VD: mất đoạn NST số 5 gây hội chứng tiếng mèo kêu Cri-du-chat; mất đoạn NST 21 hoặc chuyển đoạn 9-22 gây ung thư máu ác tính; ứng dụng loại bỏ gene có hại hoặc xác định vị trí gene). (2) Lặp đoạn: làm tăng số bản sao của gene, tăng hoặc giảm cường độ biểu hiện tính trạng (VD: lặp đoạn 16A trên NST X ở ruồi giấm làm mắt lồi thành mắt dẹt; lặp đoạn ở đại mạch làm tăng hoạt tính enzyme amylase sản xuất bia). (3) Đảo đoạn: thay đổi trật tự sắp xếp gene, không làm thay đổi số lượng gene, tạo nguồn nguyên liệu hình thành loài mới. (4) Chuyển đoạn: giữa 2 NST không tương đồng (chuyển đoạn tương hỗ hoặc không tương hỗ), làm thay đổi nhóm gene liên kết; chuyển đoạn nhỏ ít ảnh hưởng sức sống được ứng dụng chuyển gene giữa các loài hoặc tạo côn trùng giảm khả năng sinh sản.',
      'ĐỘT BIẾN LỆCH BỘI (DỊ BỘI): Biến đổi số lượng NST ở một hoặc một số cặp NST tương đồng. Các dạng: Thể không (2n - 2), Thể một (2n - 1), Thể ba (2n + 1), Thể bốn (2n + 2), Thể một kép (2n - 1 - 1), Thể ba kép (2n + 1 + 1). Với bộ NST 2n có n cặp NST: số loại thể một tối đa = n; số loại thể ba tối đa = n; số loại thể ba kép tối đa = C(n, 2) = n(n-1)/2.',
      'PHÂN BIỆT KHÔNG PHÂN LI Ở GIẢM PHÂN I VÀ GIẢM PHÂN II (cực hay thi!): Xét tế bào có kiểu gene Aa: Nếu không phân li ở Giảm phân I (GP II bình thường) → tạo giao tử đột biến (n+1) là Aa và giao tử (n-1) là O. Nếu GP I bình thường (tách thành AA và aa), nhưng không phân li ở Giảm phân II → tạo các giao tử đột biến (n+1) là AA hoặc aa và giao tử (n-1) là O.',
      'ĐỘT BIẾN ĐA BỘI: Tăng một số nguyên lần bộ NST đơn bội (lớn hơn 2n). (1) Tự đa bội (cùng nguồn): đa bội lẻ (3n, 5n — không có khả năng sinh giao tử bình thường nên bất thụ, ứng dụng tạo quả không hạt như dưa hấu 3n, nho 3n, chuối nhà 3n) và đa bội chẵn (4n, 6n — hữu thụ). Hóa chất Colchicine ức chế hình thành thoi phân bào làm NST đã nhân đôi không phân li tạo thể tứ bội 4n. (2) Dị đa bội (khác nguồn): Lai xa giữa 2 loài AA × BB → con lai F1 là AB (bất thụ vì các NST không tồn tại thành cặp tương đồng) → đa bội hóa bằng colchicine tạo thể song nhị bội AABB (hữu thụ, hình thành loài mới nhanh chóng ở thực vật — thí nghiệm Karpechenko cải củ × cải bắp).',
    ].join(' '),
  },

  /* ============================================================
     PHẦN III — SINH HỌC 12: CÁC QUY LUẬT DI TRUYỀN & DI TRUYỀN NGƯỜI
     ============================================================ */
  {
    id: 'bio12-mendel-gene-interaction',
    grade: [12],
    chapter: 'Các quy luật di truyền',
    title: 'Quy luật Mendel (Phân li, Phân li độc lập) & Mở rộng Mendel (Tương tác gene, Đa hiệu)',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 4: Các quy luật di truyền',
    keywords: [
      'mendel', 'men-den', 'menden', 'phan li', 'phan li doc lap', 'dau ha lan', 'pisum sativum',
      'lai phan tich', 'troi khong hoan toan', 'dong troi', 'nhom mau abo',
      'tuong tac gene', 'tuong tac bo sung', 'tuong tac cong gop', 'gene da hieu',
      '9:7', '9:6:1', '9:3:3:1', '15:1', '13:3', '12:3:1',
    ],
    text: [
      'QUY LUẬT PHÂN LI (MENDEL): Mỗi tính trạng do một cặp nhân tố di truyền (cặp allele) quy định; trong quá trình phát sinh giao tử, mỗi allele của cặp phân li đồng đều về các giao tử nên mỗi giao tử chỉ chứa 1 allele. Điều kiện nghiệm đúng: bố mẹ thuần chủng, trội hoàn toàn, số lượng cá thể đủ lớn, các giao tử và hợp tử có sức sống như nhau.',
      'QUY LUẬT PHÂN LI ĐỘC LẬP: Các cặp allele quy định các tính trạng khác nhau nằm trên các cặp NST tương đồng khác nhau thì phân li độc lập và tổ hợp tự do trong giảm phân. Công thức tổng quát cho phép lai có n cặp gene dị hợp phân li độc lập (trội hoàn toàn): Số loại giao tử = 2^n; Số tổ hợp giao tử = 4^n; Số loại kiểu gene ở đời con = 3^n; Số loại kiểu hình = 2^n; Tỉ lệ kiểu gene = (1:2:1)^n; Tỉ lệ kiểu hình = (3:1)^n. Với phép lai bất kì A × B: tách từng cặp gene rồi NHÂN các xác suất riêng rẽ!',
      'MỞ RỘNG HỌC THUYẾT MENDEL: (1) Trội không hoàn toàn: kiểu hình dị hợp Aa là trung gian giữa AA và aa (tỉ lệ KH F2 = 1:2:1 trùng tỉ lệ KG, VD hoa phấn đỏ × trắng → F1 hồng). (2) Đồng trội: cả 2 allele đều biểu hiện sản phẩm (VD nhóm máu ABO ở người do 3 allele I^A, I^B, I^O quy định: I^A và I^B đồng trội so với nhau và trội hoàn toàn so với I^O → 6 kiểu gene, 4 nhóm máu A, B, AB, O). (3) Tương tác giữa sản phẩm của các gene không allele (2 cặp gene Aa, Bb phân li độc lập cùng quy định 1 tính trạng): Tương tác bổ sung cho tỉ lệ F2 là 9:7 (có cả A-B- ra KH1, còn lại KH2), 9:6:1, hoặc 9:3:3:1 (1 tính trạng); Tương tác át chế cho tỉ lệ 12:3:1, 13:3, 9:3:4; Tương tác cộng gộp cho tỉ lệ 15:1 hoặc phân bố nhị thức Newton C(2n, k). (4) Gene đa hiệu: 1 gene tác động đến sự biểu hiện của nhiều tính trạng khác nhau (VD gene HbS gây hồng cầu hình liềm đồng thời gây suy tim, tổn thương não, tắc mạch, lách to).',
    ].join(' '),
  },
  {
    id: 'bio12-linkage-crossing-over-sex-extranuclear',
    grade: [12],
    chapter: 'Các quy luật di truyền',
    title: 'Liên kết Gene, Hoán vị Gene (Morgan), Di truyền Liên kết Giới tính & Ngoài nhân',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 4: Liên kết - Hoán vị - Giới tính - Ngoài nhân',
    keywords: [
      'lien ket gene', 'lien ket gen', 'hoan vi gene', 'hoan vi gen', 'morgan', 'ruoi giam',
      'tan so hoan vi', 'ban do di truyen', 'centimorgan', 'cm', 'giao tu hoan vi', 'giao tu lien ket',
      'di truyen lien ket gioi tinh', 'nst x', 'nst y', 'di truyen cheo', 'di truyen thang',
      'mau kho dong', 'mu mau', 'di truyen ngoai nhan', 'dong me', 'correns', 'hoa phan',
    ],
    text: [
      'LIÊN KẾT GENE & HOÁN VỊ GENE (TH. MORGAN — Ruồi giấm Drosophila melanogaster): Các gene trên cùng 1 NST tạo thành 1 nhóm gene liên kết (số nhóm gene liên kết = bộ NST đơn bội n; ở ruồi giấm 2n = 8 → 4 nhóm liên kết). Liên kết hoàn toàn hạn chế biến dị tổ hợp, đảm bảo sự di truyền bền vững của từng nhóm tính trạng tốt.',
      'HOÁN VỊ GENE: Do sự tiếp hợp và trao đổi chéo giữa 2 trong 4 chromatid khác nguồn của cặp NST tương đồng ở kì đầu giảm phân I. Tần số hoán vị gene f = (Tổng giao tử hoán vị / Tổng giao tử) × 100% ≤ 50% (vì trao đổi chéo chỉ xảy ra ở một số tế bào và giữa 2/4 chromatid). Nếu có a% tế bào xảy ra trao đổi chéo tại 1 điểm thì tần số hoán vị f = a% / 2. Khoảng cách tương đối trên bản đồ di truyền: 1% hoán vị = 1 cM (centiMorgan). Lưu ý: ở ruồi giấm hoán vị gene CHỈ xảy ra ở con cái (XX), con đực (XY) liên kết hoàn toàn!',
      'CÔNG THỨC GIẢI NHANH HOÁN VỊ GENE: Xét cơ thể dị hợp 2 cặp gene có tần số hoán vị f: (1) Dị hợp đều AB/ab → Giao tử liên kết: AB = ab = (1 - f)/2; Giao tử hoán vị: Ab = aB = f/2. (2) Dị hợp chéo Ab/aB → Giao tử liên kết: Ab = aB = (1 - f)/2; Giao tử hoán vị: AB = ab = f/2. (3) Định lý Bàng – Morgan cho phép lai P dị hợp 2 cặp gene (A-, B- × A-, B-): Tỉ lệ kiểu hình lặn 2 tính trạng ab/ab = (% giao tử ab của bố) × (% giao tử ab của mẹ); Tỉ lệ kiểu hình trội 2 tính trạng A-B- = 0,5 + tỉ lệ ab/ab; Tỉ lệ kiểu hình A-bb = aaB- = 0,25 - tỉ lệ ab/ab!',
      'DI TRUYỀN LIÊN KẾT GIỚI TÍNH: Cơ chế NST giới tính: Người, thú, ruồi giấm (♀XX, ♂XY); Chim, bướm, bò sát, tằm (♀ZW, ♂ZZ); Châu chấu, cào cào (♀XX, ♂XO). Gene trên vùng không tương đồng của NST X (không có allele trên Y): có kết quả lai thuận ≠ lai nghịch và di truyền chéo (ông ngoại X^aY → mẹ X^AX^a → cháu trai X^aY; bệnh mù màu đỏ-lục, bệnh máu khó đông hemophilia, tật dính ngón tay 2-3 nằm trên Y di truyền thẳng 100% cho con trai).',
      'DI TRUYỀN NGOÀI NHÂN (DI TRUYỀN TẾ BÀO CHẤT — CORRENS 1909): Gene nằm trong ti thể (mtDNA) hoặc lục lạp (cpDNA). Đặc điểm nhận biết: Kết quả lai thuận và lai nghịch KHÁC NHAU và đời con luôn có kiểu hình giống MẸ (vì hợp tử nhận hầu hết tế bào chất từ giao tử cái/trứng, giao tử đực hầu như chỉ đóng góp nhân). Các gene ngoài nhân không phân chia đồng đều trong phân bào nên từ 1 mẹ cây lá đốm có thể sinh ra con lá xanh, lá trắng và lá đốm.',
    ].join(' '),
  },
  {
    id: 'bio12-human-genetics-pedigree',
    grade: [12],
    chapter: 'Di truyền học người',
    title: 'Di truyền học Người, Phương pháp Giải bài toán Phả hệ & Y học tư vấn',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 5: Di truyền học người & Phả hệ',
    keywords: [
      'di truyen hoc nguoi', 'pha he', 'so do pha he', 'hoi chung down', 'turner', 'klinefelter',
      'edwards', 'patau', 'tieng meo keu', 'phenylketonuria', 'pku', 'bach tang', 'hong cau hinh liem',
      'chan doan truoc sinh', 'choc do dich oi', 'sinh thiet tua nhau thai', 'lieu phap gene',
    ],
    text: [
      'QUY TRÌNH 3 BƯỚC GIẢI BÀI TOÁN PHẢ HỆ (CHUẨN ĐỀ THI TỐT NGHIỆP THPT): Bước 1 — Xác định tính trạng bệnh do gene trội hay lặn: Nếu bố mẹ bình thường sinh con bị bệnh → Bệnh do allele LẶN quy định. Nếu bố mẹ bị bệnh sinh con bình thường → Bệnh do allele TRỘI quy định. Bước 2 — Xác định gene nằm trên NST thường hay NST giới tính X: Nếu bố mẹ bình thường sinh CON GÁI bị bệnh (hoặc mẹ bị bệnh lặn nhưng sinh con trai bình thường) → Gene bệnh lặn chắc chắn nằm trên NST THƯỜNG (không thể nằm trên X). Nếu bố bị bệnh trội mà sinh con gái bình thường → Gene bệnh trội nằm trên NST thường. Bước 3 — Xác định kiểu gene từng cá thể (chú ý cá thể bình thường có bố mẹ dị hợp Aa × Aa sẽ có xác suất kiểu gene là 1/3 AA : 2/3 Aa, KHÔNG PHẢI 1/4 : 2/4!) rồi tính xác suất sinh con theo yêu cầu. Khi xét 2 bệnh phân li độc lập: tách riêng từng bệnh để tính xác suất rồi nhân lại!',
      'CÁC BỆNH & HỘI CHỨNG DI TRUYỀN Ở NGƯỜI: (1) Bệnh do đột biến gene trên NST thường: Bạch tạng (lặn), Phenylketon niệu PKU (lặn, thiếu enzyme chuyển hóa phenylalanine → tyrosine, cần ăn kiêng phenylalanine từ nhỏ), Thiếu máu hồng cầu hình liềm HbS (đột biến thay thế cặp T-A bằng A-T ở bộ ba thứ 6 làm Glutamic acid → Valine), Tật sáu ngón tay (trội). (2) Bệnh do gene lặn trên NST X: Máu khó đông (Hemophilia), Mù màu đỏ-lục (Dalton), Loạn dưỡng cơ Duchenne. (3) Hội chứng đột biến NST: Hội chứng Down (3 NST số 21, 2n=47), Edwards (3 NST 18), Patau (3 NST 13), Turner (XO, 2n=45, nữ lùn cổ ngắn vô sinh), Klinefelter (XXY, 2n=47, nam cao chân tay dài vô sinh), Siêu nữ (XXX, 2n=47), Tiếng mèo kêu (mất đoạn NST số 5), Ung thư máu ác tính (mất đoạn NST 21 hoặc chuyển đoạn 9-22).',
      'CHẨN ĐOÁN TRƯỚC SINH & LIỆU PHÁP GENE: Chọc dò dịch ối hoặc sinh thiết tua nhau thai giúp tách tế bào phôi thai để lập karyotype (bộ NST) và phân tích DNA nhằm phát hiện sớm hội chứng Down và các bệnh di truyền. Liệu pháp gene là kỹ thuật thay thế gene bệnh bằng gene lành hoặc chỉnh sửa gene.',
    ].join(' '),
  },

  /* ============================================================
     PHẦN IV — SINH HỌC 12: DI TRUYỀN QUẦN THỂ, TIẾN HÓA & SINH THÁI HỌC
     ============================================================ */
  {
    id: 'bio12-population-genetics-hardy-weinberg',
    grade: [12],
    chapter: 'Di truyền quần thể',
    title: 'Di truyền Quần thể Tự thụ phấn & Ngẫu phối (Định luật Hardy - Weinberg)',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 6: Di truyền quần thể',
    keywords: [
      'di truyen quan the', 'von gene', 'tan so allele', 'tan so alen', 'tan so kieu gene',
      'tu thu phan', 'giao phoi gan', 'ngau phoi', 'hardy-weinberg', 'hardy weinberg',
      'can bang di truyen', 'da allele',
    ],
    text: [
      'TẦN SỐ ALLELE & TẦN SỐ KIỂU GENE: Xét quần thể có cấu trúc P: d AA + h Aa + r aa = 1 (với d + h + r = 1). Tần số allele A: p(A) = d + h/2; Tần số allele a: q(a) = r + h/2 (luôn có p + q = 1).',
      'QUẦN THỂ TỰ THỤ PHẤN / GIAO PHỐI GẦN QUA n THẾ HỆ: Qua mỗi thế hệ tự thụ phấn, tỉ lệ dị hợp Aa giảm đi một nửa: Aa_n = h / (2^n); Tỉ lệ đồng hợp trội: AA_n = d + h × (1 - 1/2^n) / 2; Tỉ lệ đồng hợp lặn: aa_n = r + h × (1 - 1/2^n) / 2. Đặc điểm cốt lõi: Tự thụ phấn / giao phối gần KHÔNG làm thay đổi tần số allele (p và q giữ nguyên!), chỉ làm thay đổi thành phần kiểu gene theo hướng tăng dần tỉ lệ đồng hợp (AA, aa) và giảm dần tỉ lệ dị hợp (Aa), dẫn tới thoái hóa giống.',
      'QUẦN THỂ NGẪU PHỐI & ĐỊNH LUẬT HARDY - WEINBERG: Quần thể đạt trạng thái cân bằng di truyền khi có cấu trúc: p² AA + 2pq Aa + q² aa = 1. Dấu hiệu kiểm tra nhanh quần thể đã cân bằng chưa: kiểm tra √(d) + √(r) = 1 (hoặc d × r = (h/2)²). Nếu quần thể chưa cân bằng (và tần số allele ở giới đực = giới cái), chỉ cần QUA 1 THẾ HỆ NGẪU PHỐI quần thể sẽ đạt trạng thái cân bằng di truyền!',
      'MỞ RỘNG ĐA ALLELE & GENE TRÊN NST GIỚI TÍNH: (1) Gene có 3 allele (VD nhóm máu ABO với tần số p(I^A) + q(I^B) + r(I^O) = 1): ở trạng thái cân bằng, nhóm máu O = r²; nhóm máu A = p² + 2pr; nhóm máu B = q² + 2qr; nhóm máu AB = 2pq. (2) Gene trên vùng không tương đồng NST X: Ở giới đực (XY): tỉ lệ kiểu hình X^AY = p, X^aY = q; Ở giới cái (XX): p² X^AX^A + 2pq X^AX^a + q² X^aX^a = 1; Tần số allele chung trong toàn quần thể (tỉ lệ 1♀:1♂): p(A) = (2/3)p_♀ + (1/3)p_♂. (3) Tổng số loại kiểu gene tối đa trong quần thể: Gene có r allele trên NST thường có r(r+1)/2 kiểu gene; trên vùng không tương đồng X có r(r+1)/2 + r kiểu gene; trên vùng tương đồng X-Y có r(r+1)/2 + r² kiểu gene. Nếu nhiều gene cùng trên 1 NST thì tích số allele R = r1 × r2... rồi áp dụng công thức!',
    ].join(' '),
  },
  {
    id: 'bio12-evolution-evidence-mechanisms',
    grade: [12],
    chapter: 'Tiến hóa',
    title: 'Bằng chứng Tiến hóa, Thuyết Tiến hóa Tổng hợp Hiện đại & Hình thành Loài',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 7: Tiến hóa',
    keywords: [
      'tien hoa', 'bang chung tien hoa', 'hoa thach', 'co quan tuong dong', 'co quan tuong tu',
      'co quan thoai hoa', 'darwin', 'tien hoa nho', 'tien hoa lon', 'nhan to tien hoa',
      'chon loc tu nhien', 'cltn', 'phieu bat di truyen', 'yeu to ngau nhien', 'dong gene',
      'di nhap gene', 'hinh thanh loai', 'cach li dia li', 'cach li sinh san',
    ],
    text: [
      'CÁC BẰNG CHỨNG TIẾN HÓA: (1) Bằng chứng hóa thạch: là bằng chứng TRỰC TIẾP duy nhất cho thấy lịch sử phát sinh, phát triển và diệt vong của sinh vật (xác định tuổi bằng đồng vị phóng xạ 14C chu kì bán rã 5730 năm hoặc 238U chu kì 4,5 tỉ năm). (2) Bằng chứng giải phẫu so sánh (gián tiếp): Cơ quan tương đồng (cùng nguồn gốc nhưng thực hiện chức năng khác nhau do tiến hóa phân li, VD tay người - chi trước mèo - vây ngực cá voi - cánh dơi; gai xương rồng - tua cuốn đậu Hà Lan); Cơ quan thoái hóa (cũng là cơ quan tương đồng nhưng tiêu giảm chức năng, VD ruột thừa, răng khôn, xương cùng ở người); Cơ quan tương tự (khác nguồn gốc nhưng cùng chức năng do tiến hóa đồng quy, VD cánh chim và cánh côn trùng; gai xương rồng và gai hoa hồng). (3) Bằng chứng tế bào học & sinh học phân tử: mọi sinh vật đều cấu tạo từ tế bào, dùng chung mã di truyền, 20 loại amino acid, DNA/RNA.',
      'THUYẾT TIẾN HÓA TỔNG HỢP HIỆN ĐẠI — TIẾN HÓA NHỎ & 5 NHÂN TỐ TIẾN HÓA: Đơn vị tiến hóa cơ sở là QUẦN THỂ. Tiến hóa nhỏ là quá trình biến đổi tần số allele và thành phần kiểu gene của quần thể dẫn tới hình thành loài mới. So sánh 5 nhân tố tiến hóa: (1) Đột biến: làm thay đổi tần số allele rất chậm, vô hướng, cung cấp nguồn biến dị SƠ CẤP. (2) Giao phối không ngẫu nhiên (tự thụ, giao phối gần): KHÔNG làm thay đổi tần số allele, chỉ tăng đồng hợp giảm dị hợp → làm nghèo vốn gene. (3) Dòng gene (Di - nhập gene): có thể mang thêm allele mới vào quần thể, làm tăng hoặc giảm đa dạng di truyền. (4) Chọn lọc tự nhiên (CLTN): là nhân tố CÓ HƯỚNG duy nhất, tác động trực tiếp lên KIỂU HÌNH qua đó gián tiếp làm biến đổi tần số kiểu gene và allele; CLTN chống lại allele trội đào thải nhanh hoàn toàn allele trội, còn CLTN chống lại allele lặn không bao giờ loại bỏ hết được allele lặn vì nó ẩn trong thể dị hợp Aa. (5) Phiêu bạt di truyền (Các yếu tố ngẫu nhiên): thay đổi tần số allele ĐỘT NGỘT, vô hướng (hiệu ứng thắt cổ chai, hiệu ứng kẻ sáng lập), có thể đào thải cả allele có lợi và làm nghèo vốn gene.',
      'HÌNH THÀNH LOÀI MỚI: Tiêu chuẩn phân biệt 2 loài thân thuộc chính xác nhất là CÁCH LI SINH SẢN (trước hợp tử: nơi ở, tập tính, mùa vụ, cơ học; sau hợp tử: hợp tử chết, con lai bất thụ như con la). 3 con đường hình thành loài: (1) Khác khu vực địa lí (cách li địa lí — phổ biến ở động vật phát tán mạnh, diễn ra chậm chạp qua nhiều dạng trung gian); (2) Cùng khu vực địa lí bằng tập tính hoặc sinh thái; (3) Cùng khu vực bằng lai xa kèm đa bội hóa (nhanh nhất, phổ biến ở thực vật dương xỉ và cây có hoa).',
    ].join(' '),
  },
  {
    id: 'bio12-ecology-population-community-ecosystem',
    grade: [12],
    chapter: 'Sinh thái học',
    title: 'Sinh thái học Cá thể, Quần thể, Quần xã, Hệ sinh thái & Hiệu suất sinh thái',
    ref: 'Tài liệu Sinh học ELEC AI 12 · Chuyên đề 8: Sinh thái học',
    keywords: [
      'sinh thai hoc', 'nhan to sinh thai', 'gioi han sinh thai', 'o sinh thai',
      'quan the sinh vat', 'mat do', 'kich thuoc quan the', 'tang truong',
      'quan xa sinh vat', 'loai uu the', 'loai chu chot', 'cong sinh', 'hop tac', 'hoi sinh',
      'canh tranh', 'ki sinh', 'uc che cam nhiem', 'dien the sinh thai',
      'he sinh thai', 'chuoi thuc an', 'luoi thuc an', 'bac dinh duong', 'hieu suat sinh thai',
    ],
    text: [
      'CÁ THỂ & MÔI TRƯỜNG: Nhân tố sinh thái vô sinh (không phụ thuộc mật độ: nhiệt độ, ánh sáng, độ ẩm) và hữu sinh (phụ thuộc mật độ: sinh vật). Giới hạn sinh thái gồm khoảng thuận lợi và 2 khoảng chống chịu (ngoài giới hạn là điểm gây chết). Ổ sinh thái là không gian sinh thái mà ở đó tất cả các nhân tố sinh thái nằm trong giới hạn cho phép loài tồn tại và phát triển lâu dài (nơi ở chỉ là địa điểm cư trú, ổ sinh thái biểu hiện cách sinh sống; các loài cùng nơi ở có sự phân li ổ sinh thái để giảm cạnh tranh).',
      'SINH THÁI HỌC QUẦN THỂ: Các đặc trưng: tỉ lệ giới tính, nhóm tuổi (tháp phát triển, ổn định, suy thoái), kiểu phân bố (Theo nhóm: phổ biến nhất, hỗ trợ nhau chống điều kiện bất lợi; Đồng đều: giảm cạnh tranh gay gắt; Ngẫu nhiên: môi trường đồng nhất và không cạnh tranh), mật độ cá thể (đặc trưng cơ bản nhất), kích thước quần thể N_t = N_0 + B - D + I - E (tối thiểu và tối đa). Tăng trưởng theo tiềm năng sinh học (đường cong chữ J trong môi trường không giới hạn) và tăng trưởng thực tế (đường cong chữ S trong môi trường bị giới hạn bởi sức chứa K).',
      'SINH THÁI HỌC QUẦN XÃ: Loài ưu thế (số lượng nhiều, sinh khối lớn, quyết định chiều hướng phát triển quần xã) và Loài chủ chốt (số lượng ít nhưng kiểm soát cấu trúc quần xã qua chuỗi thức ăn). Quan hệ sinh thái: Hỗ trợ (Cộng sinh +/+ bắt buộc: địa y, vi khuẩn Rhizobium nốt sần cây họ đậu, trùng roi trong ruột mối; Hợp tác +/+ không bắt buộc: chim sáo và trâu, chim mỏ đỏ và linh dương, cua và hải quỳ; Hội sinh +/0: phong lan bám cây gỗ, cá ép sống bám cá lớn) và Đối kháng (Cạnh tranh -/-; Kí sinh +/-: tầm gửi, dây tơ hồng, giun sán; Ức chế - cảm nhiễm 0/-: tảo giáp nở hoa gây thủy triều đỏ, tỏi tiết kháng sinh phytoncide; Sinh vật này ăn sinh vật khác +/-: động vật ăn thực vật, thú ăn thịt, cây nắp ấm bắt côn trùng). Diễn thế nguyên sinh (bắt đầu từ môi trường chưa có sinh vật → hình thành quần xã đỉnh cực) và Diễn thế thứ sinh (xảy ra trên môi trường đã từng có quần xã).',
      'HỆ SINH THÁI, CHUỖI THỨC ĂN & HIỆU SUẤT SINH THÁI: Chuỗi thức ăn khởi đầu bằng sinh vật sản xuất (cây xanh → ĐV ăn cỏ → ĐV ăn thịt) hoặc khởi đầu bằng sinh vật ăn mùn bã hữu cơ. LƯU Ý BẪY BẬC DINH DƯỠNG: Sinh vật sản xuất là Bậc dinh dưỡng cấp 1; Sinh vật tiêu thụ bậc 1 là Bậc dinh dưỡng cấp 2; Sinh vật tiêu thụ bậc k là Bậc dinh dưỡng cấp (k + 1)! Dòng năng lượng trong hệ sinh thái truyền theo MỘT CHIỀU (từ Mặt Trời → SV sản xuất → các bậc dinh dưỡng → thoát ra dạng nhiệt, khoảng 90% thất thoát qua mỗi bậc), còn vật chất được tuần hoàn theo CHU TRÌNH sinh-địa-hóa (C, N, nước). Công thức hiệu suất sinh thái: H = (E_(n+1) / E_n) × 100%.',
    ].join(' '),
  },

  /* ============================================================
     PHẦN V — SINH HỌC 11: SINH HỌC CƠ THỂ (THỰC VẬT & ĐỘNG VẬT)
     ============================================================ */
  {
    id: 'bio11-plant-metabolism-photosynthesis',
    grade: [11, 12],
    chapter: 'Sinh học cơ thể thực vật',
    title: 'Trao đổi Nước - Khoáng, Quang hợp (C3, C4, CAM) & Hô hấp ở Thực vật',
    ref: 'Tài liệu Sinh học ELEC AI 11 · Chuyên đề Trao đổi chất & Chuyển hóa năng lượng ở Thực vật',
    keywords: [
      'trao doi nuoc', 'hut nuoc', 'long hut', 'mach go', 'xylem', 'mach ray', 'phloem',
      'thoat hoi nuoc', 'khi khong', 'quang hop', 'thuc vat c3', 'thuc vat c4', 'thuc vat cam',
      'pha sang', 'pha toi', 'chu trinh calvin', 'thylakoid', 'ho hap sang', 'co dinh dam',
    ],
    text: [
      'TRAO ĐỔI NƯỚC & KHOÁNG Ở THỰC VẬT: Rễ hấp thụ nước theo cơ chế thẩm thấu (từ đất nhược trương vào tế bào lông hút ưu trương) và ion khoáng theo 2 cơ chế thụ động & chủ động (cần ATP). Nước và ion khoáng đi từ lông hút vào mạch gỗ của rễ theo 2 con đường: gian bào (nhanh, đến đai Caspary phải chuyển sang tế bào chất để kiểm soát chất hòa tan) và tế bào chất. Dòng mạch gỗ (xylem — gồm quản bào và mạch ống là các tế bào CHẾT) vận chuyển nước và ion khoáng từ rễ lên lá nhờ 3 động lực: lực đẩy của rễ (áp suất rễ gây hiện tượng ứ giọt), lực hút do thoát hơi nước ở lá (động lực chính!), và lực liên kết giữa các phân tử nước. Dòng mạch rây (phloem — ống rây và tế bào kèm là các tế bào SỐNG) vận chuyển chất hữu cơ (chủ yếu là saccharose) từ lá xuống cơ quan dự trữ. Thoát hơi nước chủ yếu qua khí khổng (tế bào khí khổng no nước thì mở, mất nước thì đóng) và một phần nhỏ qua lớp cutin.',
      'QUANG HỢP Ở THỰC VẬT (C3, C4, CAM): Phương trình tổng quát: 6CO2 + 12H2O → (ánh sáng, lục lạp) → C6H12O6 + 6O2 + 6H2O (O2 giải phóng có nguồn gốc 100% từ phân tử H2O do quang phân li nước ở pha sáng!). Pha sáng (tại màng thylakoid, giống nhau ở C3, C4, CAM): Diệp lục hấp thụ quang năng, quang phân li nước 2H2O → 4H+ + 4e- + O2, tổng hợp ATP và NADPH. Pha tối / Chu trình cố định CO2 (tại chất nền stroma): Thực vật C3 (lúa, khoai, đậu): chất nhận CO2 đầu tiên là RuBP (5C), sản phẩm đầu tiên là PGA (3C), diễn ra tại 1 loại lục lạp tế bào mô giậu, có hô hấp sáng làm thất thoát 20-50% sản phẩm quang hợp. Thực vật C4 (ngô, mía, cỏ lồng vực, rau dền): chất nhận đầu là PEP (3C), sản phẩm đầu là OAA (4C), diễn ra ở 2 loại tế bào (mô giậu cố định CO2 lần 1 và bao bó mạch thực hiện chu trình Calvin), KHÔNG có hô hấp sáng, năng suất cao nhất. Thực vật CAM (xương rồng, dứa, thanh long, thuốc bỏng): khí khổng đóng ban ngày để tiết kiệm nước, mở ban đêm để nhận CO2 (cố định lần 1 vào ban đêm tạo malate, ban ngày thực hiện chu trình Calvin).',
    ].join(' '),
  },
  {
    id: 'bio11-animal-physiology-homeostasis',
    grade: [11, 12],
    chapter: 'Sinh học cơ thể động vật',
    title: 'Tiêu hóa, Hô hấp, Tuần hoàn, Miễn dịch & Cân bằng Nội môi ở Động vật',
    ref: 'Tài liệu Sinh học ELEC AI 11 · Chuyên đề Sinh lý Động vật & Cân bằng nội môi',
    keywords: [
      'tieu hoa', 'ho hap dong vat', 'tuan hoan', 'he dan truyen tim', 'nut xoang nhi',
      'huyet ap', 'van toc mau', 'chu ki tim', 'mien dich', 'khang nguyen', 'khang the', 'vaccine',
      'can bang noi moi', 'ap suat tham thau', 'insulin', 'glucagon', 'than', 'nephron',
    ],
    text: [
      'TIÊU HÓA Ở ĐỘNG VẬT: Tiến hóa từ chưa có cơ quan tiêu hóa (tiêu hóa nội bào ở trùng biến hình, bọt biển) → túi tiêu hóa (ruột khoang, giun dẹp: tiêu hóa ngoại bào kết hợp nội bào) → ống tiêu hóa (tiêu hóa ngoại bào hoàn toàn). Ở thú ăn cỏ: Dạ dày 4 ngăn ở thú nhai lại (bò, cừu, dê: Dạ cỏ chứa VSV cộng sinh tiêu hóa cellulose → Dạ tổ ong → ợ lên nhai lại → Dạ lá sách hấp thụ bớt nước → Dạ múi khế là dạ dày chính thức tiết pepsin và HCl tiêu hóa cả VSV!) và dạ dày đơn có manh tràng rất phát triển ở ngựa, thỏ.',
      'HÔ HẤP Ở ĐỘNG VẬT (4 hình thức): (1) Qua bề mặt cơ thể (giun đất, ruột khoang); (2) Bằng hệ thống ống khí (côn trùng — đưa O2 trực tiếp tới từng tế bào không qua hệ tuần hoàn); (3) Bằng mang (cá xương trao đổi khí hiệu quả cao nhờ dòng nước chảy một chiều qua mang và dòng máu chảy trong mao mạch song song và NGƯỢC CHIỀU với dòng nước); (4) Bằng phổi (chim có hệ thống 9 túi khí giúp phổi luôn có không khí giàu O2 cả khi hít vào lẫn thở ra, không có khí cặn → hiệu quả trao đổi khí trên cạn cao nhất!).',
      'HỆ TUẦN HOÀN & HOẠT ĐỘNG CỦA TIM: Hệ tuần hoàn hở (chân khớp, thân mềm trừ mực/bạch tuộc: máu chảy áp lực thấp) vs kín (giun đốt, mực, ĐV có xương sống). Tuần hoàn đơn (cá: tim 2 ngăn, máu đi nuôi cơ thể là máu đỏ tươi) vs kép (lưỡng cư, bò sát tim 3 ngăn máu pha trừ cá sấu 4 ngăn; chim và thú tim 4 ngăn máu hoàn toàn không pha). Hệ dẫn truyền tự động của tim: Nút xoang nhĩ (tự phát xung điện) → cơ tâm nhĩ co & truyền tới Nút nhĩ thất → Bó His → Mạng Purkinje → cơ tâm thất co. Chu kì tim người (75 nhịp/phút): T = 0,8s gồm Pha co tâm nhĩ (0,1s) → Pha co tâm thất (0,3s) → Pha giãn chung (0,4s). Huyết áp giảm dần từ Động mạch chủ → Tiểu động mạch → Mao mạch → Tĩnh mạch. Vận tốc máu chậm nhất ở MAO MẠCH vì tổng tiết diện của hệ mao mạch là lớn nhất (giúp đủ thời gian trao đổi chất với tế bào)!',
      'CÂN BẰNG NỘI MÔI: Bộ phận tiếp nhận kích thích (thụ thể) → Bộ phận điều khiển (trung ương thần kinh hoặc tuyến nội tiết) → Bộ phận thực hiện (thận, gan, phổi, tim, mạch máu) → Liên hệ ngược. Điều hòa glucose máu (bình thường 3,9 – 6,4 mmol/L): Sau bữa ăn glucose tăng → tế bào β đảo tụy tiết INSULIN chuyển glucose thành glycogen dự trữ ở gan và cơ. Khi đói glucose giảm → tế bào α đảo tụy tiết GLUCAGON phân giải glycogen thành glucose. Điều hòa áp suất thẩm thấu nhờ thận (hormone ADH tăng tái hấp thu nước, aldosterone tăng tái hấp thu Na+) và gan. Hệ đệm duy trì pH máu (7,35 – 7,45): hệ đệm proteinate (mạnh nhất), hệ đệm bicarbonate (H2CO3/NaHCO3), hệ đệm phosphate.',
    ].join(' '),
  },
  {
    id: 'bio11-neurobiology-growth-reproduction',
    grade: [11, 12],
    chapter: 'Cảm ứng, Sinh trưởng & Sinh sản',
    title: 'Cảm ứng (Synapse, Tập tính), Sinh trưởng (Hormone) & Sinh sản (Thụ tinh kép, Điều hòa nội tiết)',
    ref: 'Tài liệu Sinh học ELEC AI 11 · Chuyên đề Cảm ứng, Sinh trưởng & Sinh sản',
    keywords: [
      'cam ung', 'huong dong', 'ung dong', 'synapse', 'xinap', 'acetylcholine', 'cung phan xa',
      'tap tinh', 'hormone thuc vat', 'auxin', 'gibberellin', 'cytokinin', 'ethylene', 'abscisic',
      'bien thai', 'ecdysone', 'juvenile', 'thyroxine', 'thu tinh kep', 'noi nhu 3n',
      'gnrh', 'fsh', 'lh', 'testosterone', 'estrogen', 'progesterone',
    ],
    text: [
      'CẢM ỨNG Ở THỰC VẬT & ĐỘNG VẬT: Ở thực vật: Hướng động (vận động định hướng theo tác nhân kích thích từ 1 phía do tốc độ sinh trưởng không đều của tế bào 2 phía dưới tác động của Auxin: hướng sáng, hướng trọng lực, hướng nước, hướng hóa, hướng tiếp xúc) và Ứng động (tác nhân không định hướng: ứng động sinh trưởng như hoa nở theo nhiệt độ/ánh sáng; ứng động không sinh trưởng do biến đổi sức trương nước như cây trinh nữ cụp lá, đóng mở khí khổng). Ở động vật: Truyền tin qua Synapse hóa học gồm 3 phần (chùy synapse có bóng chứa chất trung gian hóa học Acetylcholine/Noradrenaline, khe synapse, màng sau synapse có thụ thể): Xung thần kinh đến chùy synapse → Ca2+ đi vào chùy làm bóng synapse vỡ giải phóng Acetylcholine vào khe synapse → gắn vào thụ thể màng sau làm mở kênh Na+ phát sinh điện thế hoạt động ở màng sau → enzyme acetylcholinesterase phân giải acetylcholine. Thông tin qua synapse chỉ truyền theo 1 CHIỀU từ màng trước sang màng sau!',
      'SINH TRƯỞNG & PHÁT TRIỂN (HORMONE): Ở thực vật: Nhóm kích thích gồm Auxin (AIA — kích thích kéo dài tế bào, ưu thế ngọn, ra rễ phụ), Gibberellin (GA — kích thích nảy mầm hạt/củ, kéo dài thân lóng, tạo quả không hạt), Cytokinin (kích thích phân chia tế bào, đánh thức chồi bên, làm chậm hóa già); Nhóm ức chế gồm Ethylene (khí thúc quả chín nhanh, rụng lá) và Abscisic acid (ABA — gây ngủ nghỉ hạt, đóng khí khổng khi hạn). Tương quan GA/ABA điều tiết nảy mầm; Auxin/Cytokinin điều tiết nuôi cấy mô callus (nhiều Auxin → ra rễ, nhiều Cytokinin → ra chồi). Ở động vật: Biến thái hoàn toàn (bướm, ruồi, ong, ếch: ấu trùng khác hẳn con trưởng thành) và không hoàn toàn (châu chấu, gián: ấu trùng lột xác nhiều lần). Hormone Ecdysone gây lột xác và biến sâu thành nhộng/bướm; Juvenile ức chế biến sâu thành nhộng. Ở người và ĐV có xương sống: GH (tuyến yên) kích thích phát triển xương; Thyroxine (tuyến giáp, cần Iodine) kích thích chuyển hóa và gây biến thái nòng nọc thành ếch.',
      'SINH SẢN Ở THỰC VẬT & ĐỘNG VẬT: Thụ tinh kép ở thực vật hạt kín (Angiospermae): Hạt phấn nảy mầm trên đầu nhụy tạo ống phấn mang 2 tinh tử (n) vào túi phôi: Tinh tử 1 (n) + Trứng (n) → Hợp tử (2n, phát triển thành phôi); Tinh tử 2 (n) + Nhân cực (2n) → Nhân nội nhũ tam bội (3n, dự trữ chất dinh dưỡng nuôi phôi). Bầu nhụy phát triển thành quả, noãn đã thụ tinh phát triển thành hạt. Điều hòa sinh sản ở người: Vùng dưới đồi tiết GnRH kích thích Tuyến yên tiết FSH (kích thích ống sinh tinh / nang trứng phát triển) và LH (kích thích tế bào Leydig tiết Testosterone ở nam; gây rụng trứng tạo thể vàng tiết Estrogen và Progesterone ở nữ). Khi nồng độ Testosterone hoặc Estrogen + Progesterone trong máu tăng cao sẽ thực hiện LIÊN HỆ NGƯỢC ÂM TÍNH ức chế vùng dưới đồi và tuyến yên giảm tiết GnRH, FSH, LH (nguyên lí của thuốc tránh thai hằng ngày!).',
    ].join(' '),
  },

  /* ============================================================
     PHẦN VI — SINH HỌC 10: TẾ BÀO HỌC, ENZYME, VI SINH VẬT & VIRUS
     ============================================================ */
  {
    id: 'bio10-cell-structure-transport-enzyme',
    grade: [10, 12],
    chapter: 'Sinh học tế bào',
    title: 'Cấu trúc Tế bào (Nhân sơ vs Nhân thực), Vận chuyển qua màng, ATP & Enzyme',
    ref: 'Tài liệu Sinh học ELEC AI 10 · Bài 4–17: Tế bào học, Màng sinh chất & Enzyme',
    keywords: [
      'te bao nhan so', 'te bao nhan thuc', 'ti the', 'luc lap', 'ribosome', 'golgi',
      'luoi noi chat', 'lysosome', 'mang sinh chat', 'kham dong', 'tham thau',
      'uu truong', 'nhuoc truong', 'dang truong', 'co nguyen sinh', 'atp', 'enzyme',
    ],
    text: [
      'TẾ BÀO NHÂN SƠ VS TẾ BÀO NHÂN THỰC: Tế bào nhân sơ (vi khuẩn): kích thước nhỏ (1–5 µm), tỉ lệ S/V lớn nên trao đổi chất và sinh sản rất nhanh; chưa có màng nhân (vùng nhân chứa 1 phân tử DNA mạch kép dạng vòng không liên kết histone, ngoài ra có plasmid), chỉ có 1 loại bào quan duy nhất là ribosome 70S (không có màng bao bọc), thành tế bào bằng peptidoglycan (vi khuẩn Gram+ thành dày bắt màu tím, Gram- thành mỏng có lớp lipopolysaccharide bắt màu đỏ). Tế bào nhân thực: có nhân chính thức (màng nhân kép có lỗ nhân), hệ thống nội màng và các bào quan có màng: Bào quan KHÔNG màng (Ribosome 80S, Trung thể); Bào quan MÀNG ĐƠN (Lưới nội chất hạt tổng hợp protein, Lưới nội chất trơn tổng hợp lipid và khử độc ở gan, Bộ máy Golgi đóng gói & phân phối sản phẩm, Lysosome chứa enzyme thủy phân nội bào, Peroxisome, Không bào); Bào quan MÀNG KÉP (Nhân, Ti thể, Lục lạp — cả ti thể và lục lạp đều chứa DNA vòng và ribosome 70S riêng, có khả năng tự nhân đôi độc lập tương đối).',
      'VẬN CHUYỂN CÁC CHẤT QUA MÀNG SINH CHẤT (Mô hình khảm động: lớp kép phospholipid + protein + cholesterol ở ĐV): (1) Thụ động (không tốn ATP, đi từ nơi nồng độ cao → thấp): khuếch tán trực tiếp qua lớp kép phospholipid (các chất không phân cực, kích thước nhỏ như O2, CO2, steroid) hoặc qua kênh protein xuyên màng (chất phân cực, ion, glucose; nước đi qua kênh aquaporin). (2) Chủ động (tốn ATP, đi ngược chiều gradient nồng độ từ thấp → cao qua bơm protein như bơm Na+-K+). (3) Nhập bào (thực bào, ẩm bào) và Xuất bào (nhờ sự biến dạng màng sinh chất, tốn ATP). Môi trường ưu trương (nồng độ chất tan bên ngoài cao hơn bên trong): tế bào mất nước (tế bào thực vật bị co nguyên sinh; hồng cầu bị teo lại). Môi trường nhược trương: nước đi vào tế bào (hồng cầu vỡ; tế bào thực vật trương nước nhưng không vỡ nhờ thành cellulose).',
      'ATP & ENZYME: ATP (Adenosine triphosphate = Adenine + đường Ribose + 3 nhóm phosphate, có 2 liên kết phosphate cao năng ngoài cùng dễ bị phá vỡ giải phóng năng lượng cung cấp cho tổng hợp chất, vận chuyển chủ động, sinh công cơ học). Enzyme có bản chất là protein (có thể kèm cofactor/coenzyme), có trung tâm hoạt động khớp đặc hiệu với cơ chất theo cơ chế "chìa khóa - ổ khóa", làm giảm năng lượng hoạt hóa của phản ứng sinh hóa. Khi nhiệt độ quá cao hoặc pH quá khắc nghiệt, enzyme bị biến tính mất hoạt tính vĩnh viễn.',
    ].join(' '),
  },
  {
    id: 'bio10-respiration-microbiology-virus',
    grade: [10, 12],
    chapter: 'Vi sinh vật & Virus',
    title: 'Hô hấp Tế bào (Đường phân, Krebs, Chuỗi truyền e), Sinh trưởng Vi sinh vật & Virus',
    ref: 'Tài liệu Sinh học ELEC AI 10 · Bài 16–31: Hô hấp tế bào, Vi sinh vật & Virus',
    keywords: [
      'ho hap te bao', 'duong phan', 'chu trinh krebs', 'chuoi truyen electron',
      'vi sinh vat', 'nuoi cay khong lien tuc', 'nuoi cay lien tuc', 'thoi gian the he',
      'virus', 'capsid', 'nucleocapsid', 'envelope', 'thuc khuan the', 'phage',
      'chu trinh tan', 'chu trinh tiem tan', 'hiv',
    ],
    text: [
      'HÔ HẤP TẾ BÀO HIẾU KHÍ (C6H12O6 + 6O2 + 6H2O → 6CO2 + 12H2O + Năng lượng ~30–32 ATP + Nhiệt): Gồm 3 giai đoạn: (1) Đường phân (xảy ra ở BÀO TƯƠNG): 1 Glucose (6C) → 2 Pyruvic acid (3C) + 2 ATP + 2 NADH. (2) Oxy hóa pyruvate & Chu trình Krebs (xảy ra ở CHẤT NỀN TI THỂ): 2 Pyruvate → 2 Acetyl-CoA (2C) đi vào chu trình Krebs → giải phóng 6 CO2 + 2 ATP + 8 NADH + 2 FADH2. (3) Chuỗi truyền electron hô hấp (xảy ra ở MÀNG TRONG TI THỂ): NADH và FADH2 truyền electron tới chất nhận cuối cùng là O2 tạo H2O, tạo khoảng 26–28 ATP (giai đoạn tạo NHIỀU ATP NHẤT!). Nếu thiếu O2 tế bào chuyển sang Lên men ở bào tương (lên men rượu tạo ethanol + CO2 hoặc lên men lactic tạo lactic acid, chỉ thu được 2 ATP).',
      'SINH TRƯỞN CỦA QUẦN THỂ VI SINH VẬT: Thời gian thế hệ g là thời gian từ khi sinh ra một tế bào cho đến khi tế bào đó phân chia (hoặc số tế bào trong quần thể tăng gấp đôi). Sau thời gian t, số lần phân chia n = t / g, số tế bào của quần thể N_t = N_0 × 2^n. Trong nuôi cấy KHÔNG LIÊN TỤC (không bổ sung dinh dưỡng, không lấy sản phẩm ra), quần thể vi khuẩn sinh trưởng qua 4 pha: (1) Pha tiềm phát (Lag): vi khuẩn thích nghi môi trường, tổng hợp enzyme, số lượng tế bào chưa tăng (N = N_0); (2) Pha lũy thừa (Log): vi khuẩn phân chia mạnh nhất với tốc độ sinh trưởng cực đại không đổi; (3) Pha cân bằng: số tế bào sinh ra = số tế bào chết đi, số lượng đạt cực đại và không đổi; (4) Pha suy vong: chất dinh dưỡng cạn kiệt, chất độc tích lũy, số tế bào sống giảm mạnh. Nuôi cấy LIÊN TỤC (liên tục bổ sung dinh dưỡng và lấy dịch nuôi ra) không có pha tiềm phát và pha suy vong, duy trì ở pha lũy thừa/cân bằng để thu sinh khối tối đa.',
      'VIRUS & CHU TRÌNH NHÂN LÊN: Virus là thực thể CHƯA CÓ CẤU TẠO TẾ BÀO, sống kí sinh nội bào bắt buộc; cấu tạo gồm lõi nucleic acid (DNA hoặc RNA, mạch đơn hoặc kép — không bao giờ có cả DNA và RNA cùng lúc!) và vỏ protein (capsid gồm các đơn vị capsomer) hợp thành nucleocapsid; một số virus có thêm vỏ ngoài (envelope là lớp kép phospholipid có gai glycoprotein giúp bám đặc hiệu vào thụ thể tế bào chủ). 5 giai đoạn nhân lên của virus: (1) Hấp phụ (gai glycoprotein hoặc sợi đuôi phage bám đặc hiệu vào thụ thể bề mặt tế bào chủ); (2) Xâm nhập (phage chỉ bơm lõi nucleic acid vào và để vỏ capsid bên ngoài; virus động vật đưa cả nucleocapsid vào rồi cởi vỏ); (3) Sinh tổng hợp (dùng nguyên liệu và ribosome của tế bào chủ để tổng hợp nucleic acid và protein vỏ của virus); (4) Lắp ráp; (5) Phóng thích (phá vỡ tế bào trong chu trình tan, hoặc nảy chồi). Chu trình tiềm tan: hệ gene virus gắn vào NST tế bào chủ và nhân lên cùng tế bào chủ mà chưa phá vỡ tế bào.',
    ].join(' '),
  },

  /* ============================================================
     PHẦN VII — CẤU TRÚC & CHIẾN THUẬT GIẢI ĐỀ THI TỐT NGHIỆP THPT 2026
     ============================================================ */
  {
    id: 'bio12-exam-2026-matrix-traps',
    grade: [12],
    chapter: 'Cấu trúc Đề thi Tốt nghiệp THPT 2026',
    title: 'Ma trận Đề thi Tốt nghiệp THPT môn Sinh học 2026 (28 câu / 3 phần) & Bộ Bẫy Kinh Điển',
    ref: 'Tài liệu Sinh học ELEC AI · Đề thi Tốt nghiệp THPT Chính thức 2026 (MĐ 0435) & Các trường Chuyên',
    keywords: [
      'de thi tot nghiep', 'thpt 2026', 'thpt 2025', 'cau truc de thi sinh', 'dung sai', 'tra loi ngan',
      'bay de thi sinh', 'meo giai nhanh sinh', 'ma de 0435', 'chuyen khtn',
    ],
    text: [
      'CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT MÔN SINH HỌC (CHUẨN BỘ GD&ĐT TỪ 2025–2026): Thời gian 50 phút, gồm 28 câu chia làm 3 phần: (1) Phần I — Trắc nghiệm nhiều lựa chọn (18 câu, từ câu 1 đến câu 18): mỗi câu 0,25 điểm, tổng 4,5 điểm. (2) Phần II — Trắc nghiệm Đúng/Sai (4 câu, từ câu 1 đến câu 4, mỗi câu có 4 lệnh hỏi a, b, c, d dựa trên thí nghiệm, biểu đồ, phả hệ hoặc bảng số liệu thực nghiệm): đúng 1 ý được 0,1đ; đúng 2 ý được 0,25đ; đúng 3 ý được 0,5đ; đúng cả 4 ý được 1,0đ (tổng 4,0 điểm). (3) Phần III — Trắc nghiệm Trả lời ngắn (6 câu, từ câu 1 đến câu 6): mỗi câu 0,25 điểm (tổng 1,5 điểm), thí sinh tính ra con số hoặc ghép thứ tự các bước/nhận định đúng theo chiều từ nhỏ đến lớn (VD: 124, 24, 0,25, 619).',
      '10 BẪY KINH ĐIỂN TRONG ĐỀ THI SINH HỌC (TRÍCH TỪ ĐỀ CHÍNH THỨC 2026 & CHUYÊN KHTN): (1) Bẫy chiều dài đoạn mã hóa của gene (trong Đề chính thức 2026 MĐ 0435 Câu 1): khi đề cho vị trí nucleotide bắt đầu codon mở đầu (VD từ nu 171) và vị trí kết thúc (nu 2026), số nucleotide vùng mã hóa trên 1 mạch = (2026 - 171 + 1) = 1856? Chú ý tính đúng từ nucleotide đầu tiên của codon mở đầu đến hết codon kết thúc rồi chia 3, trừ 1 codon kết thúc và trừ 1 amino acid mở đầu để ra chuỗi polypeptide hoàn chỉnh! (2) Bẫy Gene điều hòa lacI không thuộc Operon Lac. (3) Bẫy cá thể bình thường sinh ra từ bố mẹ dị hợp Aa × Aa có tỉ lệ 1/3 AA : 2/3 Aa (chứ không phải 1/4 : 2/4). (4) Bẫy Không phân li ở Giảm phân I vs Giảm phân II. (5) Bẫy Sinh vật tiêu thụ bậc k thuộc Bậc dinh dưỡng cấp (k + 1). (6) Bẫy Giao phối không ngẫu nhiên không làm thay đổi tần số allele. (7) Bẫy CLTN tác động trực tiếp lên kiểu hình chứ không tác động trực tiếp lên kiểu gene. (8) Bẫy Ruồi giấm đực không có hoán vị gene. (9) Bẫy Vận tốc máu chậm nhất ở mao mạch (do tổng tiết diện lớn nhất), còn huyết áp thấp nhất ở tĩnh mạch chủ. (10) Bẫy O2 giải phóng trong quang hợp có nguồn gốc 100% từ H2O.',
    ].join(' '),
  },
];
