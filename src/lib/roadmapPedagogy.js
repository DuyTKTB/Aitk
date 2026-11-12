/* ============================================================
   roadmapPedagogy.js — HỆ THỐNG SƯ PHẠM 4 TRỤ CỘT ELEC AI
   ------------------------------------------------------------
   Mỗi chuyên đề được cấu trúc thành 4 Trụ cột rõ ràng:
     1. Khái niệm cốt lõi (Core Concepts): Từ khóa in đậm, công thức KaTeX
     2. Quy trình & Thuật toán giải bài (Algorithm): Bước 1 -> Bước 2 -> Bước 3
     3. Thẻ công thức trọng tâm (Dedicated Formula Cards): KaTeX display, chú giải đại lượng, đơn vị, nút copy
     4. Bẫy sai & Lỗi học sinh hay mắc (Exam Traps): Cảnh báo bẫy thi trắc nghiệm
   ============================================================ */

import { chapterGuide } from '../data/roadmapExercises.js';
import { FORMULAS } from '../components/formulaData.js';
import { getInfographicsForTopic } from '../data/knowledgeManifest.js';

export const PEDAGOGY_TOPICS = {
  /* ============================================================
     LỚP 10
     ============================================================ */
  'c10-atom': {
    concepts: [
      {
        title: 'Thành phần cấu tạo nguyên tử',
        desc: 'Nguyên tử gồm hạt nhân mang điện dương (proton $+e$ và neutron không mang điện) và vỏ nguyên tử chứa các electron ($-e$) chuyển động rất nhanh trong các orbital nguyên tử ($AO$).',
        keywords: ['hạt nhân', 'proton', 'neutron', 'electron', 'orbital'],
      },
      {
        title: 'Số khối và hiện tượng đồng vị',
        desc: 'Số khối $A = Z + N$. Các đồng vị của cùng một nguyên tố hóa học có cùng số proton ($Z$) nhưng khác số neutron ($N$), do đó số khối $A$ khác nhau.',
        keywords: ['số khối', 'đồng vị', 'nguyên tử khối trung bình'],
      },
      {
        title: 'Cấu hình electron nguyên tử',
        desc: 'Electron điền vào các phân lớp theo chiều tăng mức năng lượng: $1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p\\dots$ Số electron tối đa: $s^2, p^6, d^{10}, f^{14}$. Khi viết cấu hình, phải sắp xếp lại theo thứ tự từng lớp từ trong ra ngoài.',
        keywords: ['Klechkowski', 'mức năng lượng', 'cấu hình electron', 'lớp ngoài cùng'],
      },
    ],
    algorithms: [
      {
        step: 1,
        title: 'Thiết lập hệ phương trình hạt cơ bản',
        instruction: 'Lập hệ phương trình từ đề bài: Tổng số hạt $2Z + N = S$; Chênh lệch hạt mang điện và không mang điện $2Z - N = \\Delta$.',
        tip: 'Lưu ý hạt mang điện trong nguyên tử gồm cả $p$ và $e$, do đó luôn là $2Z$.',
      },
      {
        step: 2,
        title: 'Giải hệ tìm số hạt $Z$ và $N$',
        instruction: 'Cộng hai phương trình: $4Z = S + \\Delta \\implies Z = \\frac{S + \\Delta}{4}$. Sau đó suy ra $N = S - 2Z$.',
      },
      {
        step: 3,
        title: 'Viết cấu hình electron và xác định vị trí',
        instruction: 'Xếp electron theo thứ tự phân lớp năng lượng rồi gom theo lớp. Số electron lớp ngoài cùng cho biết tính kim loại ($1, 2, 3$), phi kim ($5, 6, 7$) hay khí hiếm ($8$).',
      },
    ],
    formulas: [
      {
        id: 'f-atom-mass-avg',
        name: 'Nguyên tử khối trung bình của hỗn hợp đồng vị',
        displayLatex: '\\bar{A} = \\frac{A_1 \\cdot x_1 + A_2 \\cdot x_2 + \\dots + A_n \\cdot x_n}{100}',
        symbols: [
          { s: '\\bar{A}', name: 'Nguyên tử khối trung bình', unit: 'amu (g/mol)' },
          { s: 'A_i', name: 'Số khối của đồng vị thứ i', unit: 'số nguyên' },
          { s: 'x_i', name: 'Tỉ lệ phần trăm số nguyên tử của đồng vị thứ i', unit: '%' },
        ],
        notes: 'Tổng phần trăm tất cả các đồng vị luôn bằng 100%: $\\sum x_i = 100\\%$.',
        example: 'Chlorine có 2 đồng vị $^{35}\\text{Cl}$ (75%) và $^{37}\\text{Cl}$ (25%) $\\implies \\bar{A} = 35 \\times 0{,}75 + 37 \\times 0{,}25 = 35{,}5$.',
      },
      {
        id: 'f-atom-stable-range',
        name: 'Điều kiện bền của hạt nhân nguyên tử ($Z \\le 82$)',
        displayLatex: '1 \\le \\frac{N}{Z} \\le 1{,}5 \\quad \\Longleftrightarrow \\quad \\frac{S}{3{,}5} \\le Z \\le \\frac{S}{3}',
        symbols: [
          { s: 'S', name: 'Tổng số hạt cơ bản (p + n + e)', unit: 'hạt' },
          { s: 'Z', name: 'Số proton (số hiệu nguyên tử)', unit: 'hạt' },
          { s: 'N', name: 'Số neutron trong hạt nhân', unit: 'hạt' },
        ],
        notes: 'Dùng để chặn giá trị của Z khi đề bài chỉ cho duy nhất tổng số hạt S của nguyên tử.',
      },
    ],
    traps: [
      {
        title: 'Viết cấu hình Fe, Cu, Cr theo thứ tự năng lượng',
        trap: 'Học sinh hay viết cấu hình Fe ($Z = 26$) là $[\\text{Ar}]4s^2 3d^6$.',
        why: 'Mức năng lượng $4s < 3d$ nên điền $4s$ trước, nhưng khi viết cấu hình phải theo trật tự lớp.',
        advice: 'Luôn viết lại theo số thứ tự lớp tăng dần: Fe là $[\\text{Ar}]3d^6 4s^2$. Chú ý hiện tượng bán bão hòa bền của Cr ($[\\text{Ar}]3d^5 4s^1$) và bão hòa bền của Cu ($[\\text{Ar}]3d^{10} 4s^1$).',
      },
      {
        title: 'Nhầm lẫn giữa "hạt mang điện" và "số hạt proton"',
        trap: 'Đề bài cho "số hạt mang điện là 26", học sinh gán $Z = 26$.',
        why: 'Trong nguyên tử, cả proton và electron đều mang điện và có số lượng bằng nhau ($p = e = Z$).',
        advice: 'Số hạt mang điện trong nguyên tử là $2Z \\implies 2Z = 26 \\implies Z = 13$ (Aluminium).',
      },
    ],
  },

  'c10-energy': {
    concepts: [
      {
        title: 'Biến thiên Enthalpy chuẩn ($\\Delta_r H_{298}^0$)',
        desc: 'Nhiệt lượng tỏa ra hoặc thu vào của phản ứng hóa học ở điều kiện chuẩn ($25^\\circ\\text{C}$ và $1\\text{ bar}$).',
        keywords: ['enthalpy', 'điều kiện chuẩn', 'nhiệt phản ứng'],
      },
      {
        title: 'Phản ứng tỏa nhiệt vs Thu nhiệt',
        desc: '$\\Delta_r H_{298}^0 < 0$: phản ứng tỏa nhiệt (hệ giải phóng nhiệt ra môi trường, nhiệt độ xung quanh tăng). $\\Delta_r H_{298}^0 > 0$: phản ứng thu nhiệt (hệ hấp thu nhiệt từ môi trường).',
        keywords: ['tỏa nhiệt', 'thu nhiệt', 'dấu delta H'],
      },
    ],
    algorithms: [
      {
        step: 1,
        title: 'Xác định loại dữ liệu đề bài cung cấp',
        instruction: 'Kiểm tra xem đề bài cho Enthalpy tạo thành chuẩn $\\Delta_f H_{298}^0$ hay Năng lượng liên kết $E_b$.',
      },
      {
        step: 2,
        title: 'Áp dụng đúng công thức tính $\\Delta_r H_{298}^0$',
        instruction: 'Nếu cho $\\Delta_f H_{298}^0$: Lấy Sản phẩm trừ Chất đầu. Nếu cho $E_b$: Lấy Chất đầu trừ Sản phẩm.',
        tip: 'Khắc ghi câu thần chú: "Enthalpy tạo thành: Sau trừ Trước. Năng lượng liên kết: Trước trừ Sau".',
      },
      {
        step: 3,
        title: 'Nhân hệ số tỉ lượng và kết luận',
        instruction: 'Nhân giá trị Enthalpy/Năng lượng liên kết với hệ số cân bằng của từng chất trong phương trình.',
      },
    ],
    formulas: [
      {
        id: 'f-energy-formation',
        name: 'Tính $\\Delta_r H_{298}^0$ theo Enthalpy tạo thành chuẩn',
        displayLatex: '\\Delta_r H_{298}^0 = \\sum \\Delta_f H_{298}^0(\\text{sản phẩm}) - \\sum \\Delta_f H_{298}^0(\\text{chất đầu})',
        symbols: [
          { s: '\\Delta_r H_{298}^0', name: 'Biến thiên Enthalpy chuẩn của phản ứng', unit: 'kJ' },
          { s: '\\Delta_f H_{298}^0', name: 'Nhiệt tạo thành chuẩn của từng chất', unit: 'kJ/mol' },
        ],
        notes: 'Enthalpy tạo thành chuẩn của đơn chất ở trạng thái bền nhất bằng 0 (ví dụ: $\\text{O}_2(g), \\text{N}_2(g), \\text{H}_2(g) = 0$).',
      },
      {
        id: 'f-energy-bond',
        name: 'Tính $\\Delta_r H_{298}^0$ theo Năng lượng liên kết $E_b$',
        displayLatex: '\\Delta_r H_{298}^0 = \\sum E_b(\\text{chất đầu}) - \\sum E_b(\\text{sản phẩm})',
        symbols: [
          { s: 'E_b', name: 'Năng lượng liên kết hóa học', unit: 'kJ/mol' },
        ],
        notes: 'Chỉ áp dụng chính xác cho các phản ứng mà tất cả chất tham gia và sản phẩm đều ở thể khí ($g$).',
      },
    ],
    traps: [
      {
        title: 'Quên nhân hệ số cân bằng phương trình',
        trap: 'Học sinh chỉ lấy $\\Delta_f H^0(\\text{CO}_2) + \\Delta_f H^0(\\text{H}_2\\text{O})$ mà quên nhân 2 cho $2\\text{H}_2\\text{O}$.',
        why: 'Giá trị trong bảng là tính cho 1 mol chất (kJ/mol), cần nhân với số mol trong phương trình đã cân bằng.',
        advice: 'Luôn kiểm tra hệ số trước phân tử: $\\Delta_r H = 1 \\times \\Delta_f H(\\text{CO}_2) + 2 \\times \\Delta_f H(\\text{H}_2\\text{O}) - \\dots$',
      },
    ],
  },

  /* ============================================================
     LỚP 11
     ============================================================ */
  'c11-equilibrium': {
    concepts: [
      {
        title: 'Bản chất trạng thái cân bằng động',
        desc: 'Tại trạng thái cân bằng, phản ứng không dừng lại mà tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch ($v_{\\text{thuận}} = v_{\\text{nghịch}} > 0$). Nồng độ các chất trong hệ phản ứng giữ nguyên không đổi theo thời gian.',
        keywords: ['cân bằng động', 'tốc độ thuận', 'tốc độ nghịch', 'nồng độ không đổi'],
      },
      {
        title: 'Nguyên lí chuyển dịch Le Chatelier',
        desc: 'Khi một hệ đang ở trạng thái cân bằng chịu tác động từ bên ngoài (thay đổi nồng độ, áp suất, nhiệt độ), cân bằng sẽ tự chuyển dịch theo chiều làm **giảm** tác động bên ngoài đó.',
        keywords: ['Le Chatelier', 'chuyển dịch cân bằng', 'nhiệt độ', 'áp suất'],
      },
      {
        title: 'Thuyết Acid - Base Brønsted - Lowry & Chỉ số pH',
        desc: 'Acid là chất có khả năng nhường proton ($H^+$), Base là chất có khả năng nhận proton ($H^+$). Chỉ số pH đặc trưng cho nồng độ ion $H^+$ trong dung dịch.',
        keywords: ['nhường proton', 'nhận proton', 'pH', 'pOH'],
      },
    ],
    algorithms: [
      {
        step: 1,
        title: 'Xác định trạng thái chất và viết phương trình',
        instruction: 'Xác định các chất ở thể khí ($g$), dung dịch ($aq$), rắn ($s$), lỏng ($l$).',
        tip: 'Chất rắn nguyên chất và dung môi lỏng KHÔNG đưa vào biểu thức hằng số cân bằng $K_C$.',
      },
      {
        step: 2,
        title: 'Lập bảng nồng độ 3 dòng (ICE table)',
        instruction: 'Lập 3 dòng: Ban đầu ($C_0$) $\\rightarrow$ Phản ứng ($\\Delta C = a \\cdot x$) $\\rightarrow$ Cân bằng ($C_{\\text{cb}} = C_0 \\pm a \\cdot x$).',
      },
      {
        step: 3,
        title: 'Thiết lập biểu thức và giải hằng số cân bằng $K_C$',
        instruction: 'Thay các nồng độ ở dòng cân bằng vào biểu thức: $K_C = \\frac{[C]^c [D]^d}{[A]^a [B]^b}$ để tìm $x$ hoặc hằng số $K_C$.',
      },
      {
        step: 4,
        title: 'Biện luận chuyển dịch theo Le Chatelier',
        instruction: 'Tăng nhiệt độ $\\rightarrow$ chuyển dịch theo chiều thu nhiệt ($\\Delta H > 0$). Tăng áp suất $\\rightarrow$ chuyển dịch theo chiều giảm số mol khí.',
      },
    ],
    formulas: [
      {
        id: 'f-equil-kc',
        name: 'Biểu thức hằng số cân bằng nồng độ $K_C$',
        displayLatex: 'K_C = \\frac{[C]^c \\cdot [D]^d}{[A]^a \\cdot [B]^b}',
        symbols: [
          { s: 'K_C', name: 'Hằng số cân bằng nồng độ (chỉ phụ thuộc T)', unit: 'không thứ nguyên' },
          { s: '[A], [B]', name: 'Nồng độ chất phản ứng tại cân bằng', unit: 'mol/L (M)' },
          { s: '[C], [D]', name: 'Nồng độ sản phẩm tại cân bằng', unit: 'mol/L (M)' },
          { s: 'a, b, c, d', name: 'Hệ số tỉ lượng trong phương trình phản ứng', unit: 'số nguyên' },
        ],
        notes: 'Chỉ các chất ở thể khí (g) và dung dịch (aq) mới xuất hiện trong $K_C$. Chất rắn nguyên chất (s) không xuất hiện.',
        example: 'Cho phản ứng $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g) \\implies K_C = \\frac{[\\text{NH}_3]^2}{[\\text{N}_2] \\cdot [\\text{H}_2]^3}$.',
      },
      {
        id: 'f-equil-ph',
        name: 'Công thức tính pH và pOH của dung dịch nước',
        displayLatex: '\\text{pH} = -\\lg[\\text{H}^+] \\quad \\Longleftrightarrow \\quad [\\text{H}^+] = 10^{-\\text{pH}}',
        symbols: [
          { s: '\\text{pH}', name: 'Độ chua / chỉ số acid của dung dịch', unit: 'thang 0-14' },
          { s: '[\\text{H}^+]', name: 'Nồng độ mol của ion hydrogen', unit: 'mol/L (M)' },
          { s: '[\\text{OH}^-]', name: 'Nồng độ mol của ion hydroxide', unit: 'mol/L (M)' },
        ],
        notes: 'Ở 25 °C: $\\text{pH} + \\text{pOH} = 14$. Dung dịch trung tính có $\\text{pH} = 7$; acid có $\\text{pH} < 7$; base có $\\text{pH} > 7$.',
      },
    ],
    traps: [
      {
        title: 'Ngộ nhận xúc tác làm chuyển dịch cân bằng',
        trap: 'Nghĩ rằng thêm xúc tác Fe sẽ làm tăng hiệu suất tổng hợp $\\text{NH}_3$.',
        why: 'Chất xúc tác làm tăng đồng thời tốc độ phản ứng thuận và nghịch với số lần bằng nhau.',
        advice: 'Chất xúc tác chỉ giúp hệ nhanh đạt đến trạng thái cân bằng, KHÔNG làm chuyển dịch cân bằng và không làm thay đổi giá trị $K_C$.',
      },
      {
        title: 'Đưa nồng độ chất rắn vào biểu thức $K_C$',
        trap: 'Đưa nồng độ $\\text{CaCO}_3(s)$ hoặc $\\text{C}(s)$ vào mẫu số của $K_C$.',
        why: 'Nồng độ chất rắn nguyên chất được coi là hằng số và đã tích hợp vào hằng số $K_C$.',
        advice: 'Ví dụ phản ứng $\\text{CaCO}_3(s) \\rightleftharpoons \\text{CaO}(s) + \\text{CO}_2(g) \\implies K_C = [\\text{CO}_2]$. Tuyệt đối không viết $\\text{CaCO}_3$ hay $\\text{CaO}$ vào biểu thức.',
      },
      {
        title: 'Nhầm lẫn chiều thay đổi pH khi pha loãng dung dịch acid',
        trap: 'Học sinh nghĩ pha loãng acid HCl thì pH giảm.',
        why: 'Pha loãng nước làm giảm nồng độ $[\\text{H}^+] \\implies -\\lg[\\text{H}^+]$ phải TĂNG lên.',
        advice: 'Pha loãng dung dịch acid thì pH tăng dần và tiệm cận 7 (không bao giờ vượt quá 7). Pha loãng dung dịch base thì pH giảm dần và tiệm cận 7.',
      },
    ],
  },

  /* ============================================================
     LỚP 12
     ============================================================ */
  'c12-ester': {
    concepts: [
      {
        title: 'Định nghĩa và danh pháp Ester',
        desc: 'Khi thay nhóm $-OH$ ở nhóm carboxyl của carboxylic acid bằng nhóm $-OR\'$ thì được ester. Tên gọi = Tên gốc hydrocarbon $R\'$ + tên gốc acid đuôi "ate" (ví dụ: Ethyl acetate $\\ce{CH3COOC2H5}$).',
        keywords: ['ester', 'xà phòng hóa', 'thủy phân', 'mùi thơm hoa quả'],
      },
      {
        title: 'Phản ứng xà phòng hóa (Thủy phân trong kiềm)',
        desc: 'Phản ứng của ester với dung dịch kiềm ($NaOH, KOH$) đun nóng là phản ứng **một chiều**, tạo ra muối carboxylate và alcohol (hoặc aldehyde/xà phòng).',
        keywords: ['phản ứng một chiều', 'muối carboxylate', 'xà phòng hóa'],
      },
    ],
    algorithms: [
      {
        step: 1,
        title: 'Tính độ bất bão hòa và xác định công thức',
        instruction: 'Tính $k = \\frac{2C + 2 - H}{2}$. Nếu ester no đơn chức hở $\\implies k = 1$, công thức chung $\\ce{C_n H_{2n} O2}$ ($n \\ge 2$).',
      },
      {
        step: 2,
        title: 'Nhận diện loại ester qua tỉ lệ mol phản ứng với NaOH',
        instruction: 'Nếu $n_{\\text{NaOH}} : n_{\\text{ester}} = 1 : 1 \\implies$ ester đơn chức thông thường. Nếu tỉ lệ $2 : 1 \\implies$ ester 2 chức HOẶC ester của phenol.',
        tip: 'Ester của phenol ($\ce{RCOOC6H4R\'}$) khi tác dụng với NaOH sinh ra 2 muối và H₂O, KHÔNG sinh ra alcohol.',
      },
      {
        step: 3,
        title: 'Bảo toàn khối lượng xác định gốc R và R\'',
        instruction: 'Áp dụng $m_{\\text{ester}} + m_{\\text{NaOH}} = m_{\\text{rắn}} + m_{\\text{alcohol}} (+ m_{\\text{H2O}})$. Tính $M_{\\text{muối}}$ và $M_{\\text{alcohol}}$ để suy ra cấu tạo chính xác.',
      },
    ],
    formulas: [
      {
        id: 'f-ester-mass-balance',
        name: 'Định luật bảo toàn khối lượng trong phản ứng xà phòng hóa',
        displayLatex: 'm_{\\text{ester}} + m_{\\text{kiềm}} = m_{\\text{chất rắn khan}} + m_{\\text{alcohol}} + m_{\\text{H}_2\\text{O}}',
        symbols: [
          { s: 'm_{\\text{ester}}', name: 'Khối lượng ester phản ứng', unit: 'gam (g)' },
          { s: 'm_{\\text{kiềm}}', name: 'Khối lượng kiềm tan (NaOH / KOH)', unit: 'gam (g)' },
          { s: 'm_{\\text{chất rắn khan}}', name: 'Gồm muối sinh ra và kiềm dư (nếu có)', unit: 'gam (g)' },
          { s: 'm_{\\text{alcohol}}', name: 'Khối lượng alcohol bay hơi', unit: 'gam (g)' },
        ],
        notes: 'Chỉ có $m_{\\text{H}_2\\text{O}}$ khi trong hỗn hợp có ester của phenol hoặc acid dư.',
      },
      {
        id: 'f-ester-degree-k',
        name: 'Độ bất bão hòa của phân tử hữu cơ $C_x H_y O_z N_t$',
        displayLatex: 'k = \\pi + v = \\frac{2x + 2 + t - y}{2}',
        symbols: [
          { s: 'k', name: 'Tổng số liên kết pi (\\pi) và vòng no (v)', unit: 'số nguyên' },
          { s: 'x, y, t', name: 'Số nguyên tử C, H, N trong công thức', unit: 'số nguyên' },
        ],
        notes: 'Oxygen không tham gia vào công thức tính $k$. Ester no đơn chức mạch hở có $k = 1$ (1 liên kết $\\pi$ trong nhóm $-COO-$).',
      },
    ],
    traps: [
      {
        title: 'Bỏ quên nước sinh ra từ ester của phenol',
        trap: 'Học sinh áp dụng $m_{\\text{ester}} + m_{\\text{NaOH}} = m_{\\text{rắn}} + m_{\\text{alcohol}}$ cho phenyl acetate.',
        why: 'Phenyl acetate $\\ce{CH3COOC6H5}$ phản ứng với $2NaOH$ tạo $\\ce{CH3COONa} + \\ce{C6H5ONa} + \\ce{H2O}$.',
        advice: 'Khi đề bài cho sản phẩm không có alcohol hoặc số mol NaOH phản ứng gấp đôi số mol ester đơn chức, lập tức nghĩ đến ester của phenol!',
      },
    ],
  },

  'c12-electro': {
    concepts: [
      {
        title: 'Thế điện cực chuẩn ($E^0$) & Dãy điện hóa',
        desc: 'Đại lượng đặc trưng cho khả năng oxi hóa - khử của cặp oxi hóa - khử ở điều kiện chuẩn. Thế điện cực càng dương $\\implies$ tính oxi hóa của dạng oxi hóa càng mạnh; thế điện cực càng âm $\\implies$ tính khử của dạng khử càng mạnh.',
        keywords: ['thế điện cực chuẩn', 'suất điện động', 'anot', 'catot'],
      },
      {
        title: 'Suất điện động của Pin Galvani',
        desc: 'Suất điện động chuẩn: $E_{\\text{pin}}^0 = E_{\\text{catot}}^0 - E_{\\text{anot}}^0 > 0$. Catot (cực dương) xảy ra sự khử; Anot (cực âm) xảy ra sự oxi hóa.',
        keywords: ['Pin Galvani', 'catot cực dương', 'anot cực âm'],
      },
      {
        title: 'Quá trình điện phân và Định luật Faraday',
        desc: 'Điện phân là quá trình oxi hóa - khử xảy ra trên bề mặt các điện cực dưới tác dụng của dòng điện một chiều đi qua chất điện li nóng chảy hoặc dung dịch.',
        keywords: ['điện phân nóng chảy', 'điện phân dung dịch', 'Faraday'],
      },
    ],
    algorithms: [
      {
        step: 1,
        title: 'Xác định các ion di chuyển về các điện cực',
        instruction: 'Catot (cực âm): hút các cation ($\ce{Cu^{2+}, Fe^{2+}, Ag^{+}, H^+}$). Anot (cực dương): hút các anion ($\ce{Cl^-, SO4^{2-}, OH^-}$).',
      },
      {
        step: 2,
        title: 'Thứ tự bị khử ở Catot và bị oxi hóa ở Anot',
        instruction: 'Ở Catot: Cation có thế điện cực lớn hơn bị khử trước ($Ag^+ > Cu^{2+} > H^+ > Fe^{2+}$). Ở Anot: Anion không chứa oxy bị oxi hóa trước ($I^- > Br^- > Cl^- > H_2O$).',
        tip: 'Các cation kim loại nhóm IA, IIA, Al³⁺ KHÔNG bao giờ bị khử trong dung dịch nước; thay vào đó là H₂O bị khử sinh ra H₂ và OH⁻.',
      },
      {
        step: 3,
        title: 'Tính số mol electron trao đổi theo Faraday',
        instruction: 'Áp dụng công thức: $n_e = \\frac{I \\cdot t}{F}$. Lập bán phản ứng để tính lượng chất sinh ra.',
      },
    ],
    formulas: [
      {
        id: 'f-electro-faraday',
        name: 'Số mol electron trao đổi trong quá trình điện phân (Faraday)',
        displayLatex: 'n_e = \\frac{I \\cdot t}{F} \\quad \\implies \\quad m = \\frac{A \\cdot I \\cdot t}{n \\cdot F}',
        symbols: [
          { s: 'n_e', name: 'Số mol electron trao đổi qua dây dẫn', unit: 'mol' },
          { s: 'I', name: 'Cường độ dòng điện', unit: 'Ampe (A)' },
          { s: 't', name: 'Thời gian điện phân', unit: 'giây (s)' },
          { s: 'F', name: 'Hằng số Faraday (96485 ~ 96500)', unit: 'C/mol' },
          { s: 'm', name: 'Khối lượng chất thoát ra ở điện cực', unit: 'gam (g)' },
          { s: 'A', name: 'Khối lượng mol của chất thoát ra', unit: 'g/mol' },
          { s: 'n', name: 'Số electron trao đổi của 1 phân tử/ion', unit: 'số e' },
        ],
        notes: 'Thời gian t bắt buộc phải đổi sang giây (s): 1 giờ = 3600s, 1 phút = 60s.',
      },
      {
        id: 'f-electro-emf',
        name: 'Suất điện động chuẩn của pin điện hóa',
        displayLatex: 'E_{\\text{pin}}^0 = E_{\\text{catot}}^0 - E_{\\text{anot}}^0 = E^0(\\text{dương}) - E^0(\\text{âm})',
        symbols: [
          { s: 'E_{\\text{pin}}^0', name: 'Suất điện động chuẩn của pin (luôn > 0)', unit: 'Volt (V)' },
          { s: 'E_{\\text{catot}}^0', name: 'Thế điện cực chuẩn của cực dương (lớn hơn)', unit: 'Volt (V)' },
          { s: 'E_{\\text{anot}}^0', name: 'Thế điện cực chuẩn của cực âm (nhỏ hơn)', unit: 'Volt (V)' },
        ],
        notes: 'Phản ứng pin tự xảy ra theo chiều: Dạng oxh mạnh + Dạng khử mạnh -> Dạng oxh yếu + Dạng khử yếu.',
      },
    ],
    traps: [
      {
        title: 'Nghĩ rằng $Al^{3+}, Na^+, K^+$ bị điện phân trong dung dịch',
        trap: 'Học sinh viết bán phản ứng ở catot: $Al^{3+} + 3e \\rightarrow Al$ khi điện phân dung dịch $AlCl_3$.',
        why: 'Trong dung dịch, $H_2O$ có tính oxi hóa mạnh hơn các ion kim loại trước Al trong dãy điện hóa.',
        advice: 'Kim loại từ Al trở về trước chỉ điều chế được bằng phương pháp ĐIỆN PHÂN NÓNG CHẢY. Trong dung dịch, $2H_2O + 2e \\rightarrow H_2 + 2OH^-$.',
      },
    ],
  },
};

/**
 * Lấy dữ liệu sư phạm chuẩn 4 trụ cột cho một chương
 */
export function getChapterPedagogy(chapterId, fallbackName = '') {
  const infographics = getInfographicsForTopic(chapterId);

  if (chapterId && PEDAGOGY_TOPICS[chapterId]) {
    const item = PEDAGOGY_TOPICS[chapterId];
    return {
      hasRichData: true,
      concepts: item.concepts || [],
      algorithms: item.algorithms || [],
      formulas: item.formulas || [],
      traps: item.traps || [],
      infographics,
      hasInfographics: infographics.length > 0,
    };
  }

  // Fallback thông minh: Đọc từ chapterGuide trong roadmapExercises
  const guide = chapterId ? chapterGuide(chapterId) : null;
  const points = guide?.points || [];
  const mistakes = guide?.mistakes || [];

  // Tìm các công thức liên quan trong FORMULAS
  const relatedFormulas = FORMULAS.filter((f) => {
    if (!fallbackName) return false;
    const nameNorm = fallbackName.toLowerCase();
    return f.name.toLowerCase().includes(nameNorm) || (f.notes && f.notes.toLowerCase().includes(nameNorm));
  }).slice(0, 3).map((f) => ({
    id: f.id,
    name: f.name,
    displayLatex: f.formula,
    symbols: f.symbols || [],
    notes: f.notes || '',
    example: f.example ? `${f.example.problem} -> ${f.example.steps?.join(' -> ')}` : '',
  }));

  const concepts = points.map((p, idx) => ({
    title: `Trọng tâm ${idx + 1}`,
    desc: p,
    keywords: [],
  }));

  const traps = mistakes.map((m, idx) => ({
    title: `Bẫy thường gặp ${idx + 1}`,
    trap: m,
    why: 'Sai sót phổ biến khi làm bài trắc nghiệm nhanh.',
    advice: 'Hãy đọc kĩ dữ kiện đề bài và chú ý các ngoại lệ trọng tâm.',
  }));

  return {
    hasRichData: false,
    concepts,
    algorithms: [
      {
        step: 1,
        title: 'Nắm vững lý thuyết trọng tâm',
        instruction: 'Đọc kỹ các định nghĩa, quy tắc và bản chất hóa học của chuyên đề.',
      },
      {
        step: 2,
        title: 'Thiết lập mối quan hệ định lượng',
        instruction: 'Áp dụng các định luật bảo toàn (khối lượng, nguyên tố, điện tích, electron) để lập phương trình.',
      },
      {
        step: 3,
        title: 'Rèn phản xạ trắc nghiệm',
        instruction: 'Luyện tập các câu hỏi nhận biết - thông hiểu trước khi nâng lên các câu vận dụng phân loại.',
      },
    ],
    formulas: relatedFormulas,
    traps,
    infographics,
    hasInfographics: infographics.length > 0,
  };
}
