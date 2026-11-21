/* ============================================================================
   roadmapExercisesExpansion.js — BỔ SUNG ĐỦ 100% 49 CHUYÊN ĐỀ KHTN (VẬT LÍ & SINH HỌC)
   Bao phủ 13 chuyên đề còn thiếu trong BANK để mọi chuyên đề Lớp 10–11–12
   đều có tối thiểu 8 câu phân tầng NB / TH / VD + Trọng tâm + Bẫy phòng thi.
   ============================================================================ */

export const EXPANSION_BANK = {
  'ly-c3-nangluong': {
    points: [
      'Công cơ học: $A = F \\cdot s \\cdot \\cos\\alpha$ (J); khi $90^\\circ < \\alpha \\le 180^\\circ$ lực sinh công cản ($A < 0$).',
      'Công suất đo tốc độ sinh công: $P = \\frac{A}{t} = F \\cdot v$ (W).',
      'Động năng $W_đ = \\frac{1}{2}mv^2$; Thế năng trọng trường $W_t = mgh$; Cơ năng $W = W_đ + W_t$ bảo toàn khi chỉ có trọng lực/lực đàn hồi.',
      'Định lí động năng: Độ biến thiên động năng bằng tổng công của ngoại lực: $\\Delta W_đ = W_{đ2} - W_{đ1} = A_{ngoại}$.',
    ],
    mistakes: [
      'Quên đổi đơn vị vận tốc từ km/h sang m/s (chia 3,6) trước khi tính động năng.',
      'Áp dụng định luật bảo toàn cơ năng khi có lực ma sát (khi có ma sát: $\\Delta W = A_{ms} = -F_{ms} \\cdot s$).',
    ],
    qs: [
      ['nb', 'Công thức tính công cơ học của lực $\\vec{F}$ không đổi khi vật dịch chuyển quãng đường $s$ theo hướng hợp với lực góc $\\alpha$ là', ['$A = F \\cdot s \\cdot \\cos\\alpha$', '$A = F \\cdot s \\cdot \\sin\\alpha$', '$A = \\frac{F \\cdot s}{\\cos\\alpha}$', '$A = F^2 \\cdot s \\cdot \\cos\\alpha$'], 'Theo định nghĩa công cơ học: $A = F \\cdot s \\cdot \\cos\\alpha$.'],
      ['nb', 'Đơn vị của công suất trong hệ SI là', ['Oát (W)', 'Jun (J)', 'Niutơn (N)', 'Pascal (Pa)'], 'Công suất $P = A/t$ có đơn vị là J/s hay Oát (W).'],
      ['nb', 'Động năng của một vật khối lượng $m$ đang chuyển động với tốc độ $v$ được xác định bởi', ['$W_đ = \\frac{1}{2}mv^2$', '$W_đ = mv^2$', '$W_đ = \\frac{1}{2}mv$', '$W_đ = mgh$'], 'Động năng $W_đ = \\frac{1}{2}mv^2$.'],
      ['th', 'Một lực $F = 40\\text{ N}$ kéo vật dịch chuyển quãng đường $s = 5\\text{ m}$ theo phương hợp với phương ngang góc $60^\\circ$. Công của lực kéo là', ['$100\\text{ J}$', '$200\\text{ J}$', '$173{,}2\\text{ J}$', '$50\\text{ J}$'], '$A = F \\cdot s \\cdot \\cos 60^\\circ = 40 \\times 5 \\times 0{,}5 = 100\\text{ J}$.'],
      ['th', 'Khi tốc độ của một vật tăng lên gấp 3 lần (khối lượng không đổi) thì động năng của vật sẽ', ['tăng lên 9 lần', 'tăng lên 3 lần', 'tăng lên 6 lần', 'giảm đi 3 lần'], 'Vì $W_đ = \\frac{1}{2}mv^2$ tỉ lệ thuận với $v^2$ nên khi $v$ tăng 3 lần thì $W_đ$ tăng $3^2 = 9$ lần.'],
      ['th', 'Một động cơ tiêu thụ công suất điện $1000\\text{ W}$ và thực hiện công cơ học có ích $800\\text{ J}$ trong mỗi giây. Hiệu suất của động cơ là', ['80%', '85%', '75%', '125%'], 'Công suất có ích $P_{ích} = 800\\text{ W} \\implies H = \\frac{800}{1000} \\times 100\\% = 80\\%$.'],
      ['vd', 'Thả một vật khối lượng $m = 0{,}5\\text{ kg}$ rơi tự do không vận tốc đầu từ độ cao $h = 20\\text{ m}$ xuống đất (lấy $g = 10\\text{ m/s}^2$, bỏ qua sức cản). Tốc độ của vật ngay trước khi chạm đất là', ['$20\\text{ m/s}$', '$10\\text{ m/s}$', '$14{,}1\\text{ m/s}$', '$40\\text{ m/s}$'], 'Bảo toàn cơ năng: $mgh = \\frac{1}{2}mv^2 \\implies v = \\sqrt{2gh} = \\sqrt{2 \\times 10 \\times 20} = 20\\text{ m/s}$.'],
      ['vd', 'Một viên đạn khối lượng $20\\text{ g}$ bay ngang với tốc độ $300\\text{ m/s}$ xuyên qua tấm gỗ dày $5\\text{ cm}$. Sau khi xuyên qua gỗ, đạn có tốc độ $100\\text{ m/s}$. Độ lớn lực cản trung bình của gỗ tác dụng lên đạn là', ['$16000\\text{ N}$', '$8000\\text{ N}$', '$1600\\text{ N}$', '$32000\\text{ N}$'], 'Định lí động năng: $-F_c \\cdot s = \\frac{1}{2}m(v_2^2 - v_1^2) \\implies F_c = \\frac{0{,}5 \\times 0{,}02 \\times (300^2 - 100^2)}{0{,}05} = 16000\\text{ N}$.'],
    ],
  },

  'ly-c4-dongluong': {
    points: [
      'Động lượng $\\vec{p} = m\\vec{v}$ (kg·m/s) luôn cùng hướng với vận tốc.',
      'Xung lượng của lực bằng độ biến thiên động lượng: $\\vec{F} \\cdot \\Delta t = \\Delta\\vec{p} = \\vec{p}_2 - \\vec{p}_1$.',
      'Định luật bảo toàn động lượng cho hệ kín: $\\vec{p}_{trước} = \\vec{p}_{sau}$.',
      'Va chạm mềm (hai vật dính vào nhau): $m_1\\vec{v}_1 + m_2\\vec{v}_2 = (m_1 + m_2)\\vec{v}$; Va chạm đàn hồi bảo toàn cả động lượng và động năng.',
    ],
    mistakes: [
      'Cộng đại số độ lớn động lượng mà quên chiếu lên trục tọa độ có dấu (hai vật chuyển động ngược chiều phải trái dấu).',
      'Cho rằng va chạm mềm bảo toàn cơ năng (va chạm mềm luôn tỏa nhiệt làm giảm động năng).',
    ],
    qs: [
      ['nb', 'Biểu thức xác định vectơ động lượng của một vật khối lượng $m$ đang chuyển động với vận tốc $\\vec{v}$ là', ['$\\vec{p} = m\\vec{v}$', '$\\vec{p} = \\frac{1}{2}m\\vec{v}$', '$p = mv^2$', '$\\vec{p} = m\\vec{a}$'], 'Theo định nghĩa động lượng: $\\vec{p} = m\\vec{v}$.'],
      ['nb', 'Đơn vị của động lượng trong hệ SI là', ['kg·m/s', 'kg·m/s²', 'N/s', 'J·s'], 'Động lượng $p = mv$ có đơn vị là kg·m/s (hoặc N·s).'],
      ['nb', 'Định luật bảo toàn động lượng chỉ nghiệm đúng đối với', ['hệ cô lập (hệ kín) hoặc hệ có tổng ngoại lực theo phương khảo sát bằng 0', 'mọi hệ vật bất kì trong tự nhiên', 'hệ có ma sát rất lớn với mặt sàn', 'vật rơi tự do trong trọng trường'], 'Động lượng của hệ được bảo toàn khi hệ kín hoặc tổng hình chiếu ngoại lực lên phương khảo sát bằng 0.'],
      ['th', 'Một quả bóng khối lượng $0{,}4\\text{ kg}$ đang bay với tốc độ $15\\text{ m/s}$ thì có độ lớn động lượng bằng', ['$6\\text{ kg·m/s}$', '$3\\text{ kg·m/s}$', '$45\\text{ kg·m/s}$', '$12\\text{ kg·m/s}$'], '$p = m \\cdot v = 0{,}4 \\times 15 = 6\\text{ kg·m/s}$.'],
      ['th', 'Trong va chạm mềm hoàn toàn giữa hai vật trên mặt phẳng ngang nhẵn, đại lượng nào sau đây được bảo toàn?', ['Động lượng của hệ hai vật', 'Động năng của hệ hai vật', 'Vận tốc của từng vật', 'Động năng của vật thứ nhất'], 'Mọi va chạm trong hệ kín đều bảo toàn động lượng; va chạm mềm có một phần động năng chuyển hóa thành nội năng (nhiệt).'],
      ['th', 'Một lực không đổi $F = 25\\text{ N}$ tác dụng vào vật trong khoảng thời gian $\\Delta t = 0{,}2\\text{ s}$. Độ lớn độ biến thiên động lượng của vật là', ['$5\\text{ kg·m/s}$', '$125\\text{ kg·m/s}$', '$2{,}5\\text{ kg·m/s}$', '$50\\text{ kg·m/s}$'], '$\\Delta p = F \\cdot \\Delta t = 25 \\times 0{,}2 = 5\\text{ kg·m/s}$.'],
      ['vd', 'Vật $m_1 = 2\\text{ kg}$ chuyển động với tốc độ $6\\text{ m/s}$ đến va chạm mềm xuyên tâm với vật $m_2 = 1\\text{ kg}$ đang đứng yên trên mặt ngang nhẵn. Tốc độ của hai vật ngay sau va chạm là', ['$4\\text{ m/s}$', '$3\\text{ m/s}$', '$2\\text{ m/s}$', '$6\\text{ m/s}$'], 'Bảo toàn động lượng: $m_1 v_1 = (m_1 + m_2)V \\implies V = \\frac{2 \\times 6}{2 + 1} = 4\\text{ m/s}$.'],
      ['vd', 'Một khẩu súng khối lượng $M = 4\\text{ kg}$ bắn một viên đạn khối lượng $m = 20\\text{ g}$ bay ra khỏi nòng với tốc độ $v = 600\\text{ m/s}$. Tốc độ giật lùi của súng ngay sau khi bắn là', ['$3\\text{ m/s}$', '$1{,}5\\text{ m/s}$', '$6\\text{ m/s}$', '$0{,}3\\text{ m/s}$'], 'Bảo toàn động lượng: $0 = m v - M V \\implies V = \\frac{m v}{M} = \\frac{0{,}02 \\times 600}{4} = 3\\text{ m/s}$.'],
    ],
  },

  'ly-c5-chuyendongtron': {
    points: [
      'Đổi đơn vị góc: $180^\\circ = \\pi\\text{ rad}$; tốc độ góc $\\omega = \\frac{\\Delta\\varphi}{\\Delta t} = \\frac{2\\pi}{T} = 2\\pi f$ (rad/s).',
      'Liên hệ tốc độ dài và tốc độ góc: $v = \\omega r$.',
      'Gia tốc hướng tâm luôn hướng vào tâm quỹ đạo: $a_{ht} = \\frac{v^2}{r} = \\omega^2 r$ (m/s²).',
      'Lực hướng tâm là hợp lực gây ra gia tốc hướng tâm: $F_{ht} = m a_{ht} = \\frac{mv^2}{r} = m\\omega^2 r$.',
    ],
    mistakes: [
      'Coi lực hướng tâm là một lực mới xuất hiện thêm ngoài trọng lực, phản lực, lực căng dây.',
      'Nhầm lẫn giữa chu kì $T$ (s) và tần số $f = 1/T$ (Hz).',
    ],
    qs: [
      ['nb', 'Trong chuyển động tròn đều, vectơ gia tốc của chất điểm luôn có hướng', ['hướng vào tâm quỹ đạo tròn', 'tiếp tuyến với quỹ đạo tròn', 'hướng ra xa tâm quỹ đạo', 'ngược chiều chuyển động'], 'Chuyển động tròn đều có độ lớn vận tốc không đổi nhưng hướng thay đổi liên tục nên gia tốc luôn hướng vào tâm.'],
      ['nb', 'Hệ thức liên hệ đúng giữa tốc độ dài $v$, tốc độ góc $\\omega$ và bán kính quỹ đạo $r$ là', ['$v = \\omega r$', '$\\omega = v r$', '$v = \\omega^2 r$', '$v = \\frac{\\omega}{r}$'], 'Tốc độ dài bằng tích tốc độ góc và bán kính: $v = \\omega r$.'],
      ['nb', 'Công thức tính độ lớn lực hướng tâm tác dụng lên vật khối lượng $m$ chuyển động tròn đều bán kính $r$ là', ['$F_{ht} = \\frac{mv^2}{r}$', '$F_{ht} = mv^2 r$', '$F_{ht} = \\frac{mv}{r}$', '$F_{ht} = m\\omega r^2$'], '$F_{ht} = m a_{ht} = \\frac{mv^2}{r} = m\\omega^2 r$.'],
      ['th', 'Một cánh quạt quay đều với tần số $f = 5\\text{ vòng/s}$. Chu kì quay $T$ và tốc độ góc $\\omega$ của cánh quạt lần lượt là', ['$T = 0{,}2\\text{ s}$ và $\\omega = 10\\pi\\text{ rad/s}$', '$T = 5\\text{ s}$ và $\\omega = 10\\pi\\text{ rad/s}$', '$T = 0{,}2\\text{ s}$ và $\\omega = 5\\pi\\text{ rad/s}$', '$T = 0{,}5\\text{ s}$ và $\\omega = 2\\pi\\text{ rad/s}$'], '$T = 1/f = 0{,}2\\text{ s}$; $\\omega = 2\\pi f = 10\\pi\\text{ rad/s}$.'],
      ['th', 'Một chất điểm chuyển động tròn đều trên đường tròn bán kính $r = 2\\text{ m}$ với tốc độ dài $v = 6\\text{ m/s}$. Độ lớn gia tốc hướng tâm của chất điểm là', ['$18\\text{ m/s}^2$', '$3\\text{ m/s}^2$', '$12\\text{ m/s}^2$', '$36\\text{ m/s}^2$'], '$a_{ht} = \\frac{v^2}{r} = \\frac{6^2}{2} = 18\\text{ m/s}^2$.'],
      ['th', 'Lực nào đóng vai trò là lực hướng tâm giữ cho vệ tinh nhân tạo chuyển động tròn đều quanh Trái Đất?', ['Lực hấp dẫn giữa Trái Đất và vệ tinh', 'Lực đẩy của động cơ tên lửa', 'Lực từ trường của Trái Đất', 'Lực cản của khí quyển'], 'Lực hấp dẫn giữa Trái Đất và vệ tinh đóng vai trò là lực hướng tâm.'],
      ['vd', 'Một ô tô khối lượng $1000\\text{ kg}$ chạy đều với tốc độ $10\\text{ m/s}$ qua đỉnh một chiếc cầu vồng lên có bán kính cong $r = 50\\text{ m}$ (lấy $g = 10\\text{ m/s}^2$). Áp lực của ô tô nén lên đỉnh cầu là', ['$8000\\text{ N}$', '$10000\\text{ N}$', '$12000\\text{ N}$', '$6000\\text{ N}$'], 'Tại đỉnh cầu: $P - N = \\frac{mv^2}{r} \\implies N = m(g - \\frac{v^2}{r}) = 1000 \\times (10 - \\frac{100}{50}) = 8000\\text{ N}$.'],
      ['vd', 'Một vật nhỏ khối lượng $200\\text{ g}$ buộc vào đầu dây dài $0{,}5\\text{ m}$ quay tròn đều trên mặt bàn ngang nhẵn. Biết dây chịu được lực căng tối đa $16\\text{ N}$. Tốc độ góc lớn nhất để dây không đứt là', ['$12{,}65\\text{ rad/s}$', '$8{,}0\\text{ rad/s}$', '$16{,}0\\text{ rad/s}$', '$10{,}0\\text{ rad/s}$'], '$T_{max} = m\\omega_{max}^2 l \\implies \\omega_{max} = \\sqrt{\\frac{T_{max}}{m l}} = \\sqrt{\\frac{16}{0{,}2 \\times 0{,}5}} = \\sqrt{160} \\approx 12{,}65\\text{ rad/s}$.'],
    ],
  },

  'ly-c6-biendang': {
    points: [
      'Định luật Hooke (trong giới hạn đàn hồi): $F_{đh} = k \\cdot |\\Delta l|$ (N), với $k$ là độ cứng (N/m), $\\Delta l = l - l_0$.',
      'Khối lượng riêng $\\rho = \\frac{m}{V}$ (kg/m³); Áp suất $p = \\frac{F_N}{S}$ (Pa).',
      'Áp suất chất lỏng ở độ sâu $h$: $p = p_0 + \\rho g h$.',
      'Lực đẩy Archimedes tác dụng lên vật nhúng trong chất lỏng: $F_A = \\rho_{lỏng} \\cdot g \\cdot V_{chìm}$.',
    ],
    mistakes: [
      'Quên đổi độ biến dạng lò xo $\\Delta l$ từ cm sang m trước khi nhân với $k$ (N/m).',
      'Thay khối lượng riêng của vật thay vì khối lượng riêng của CHẤT LỎNG vào công thức lực đẩy Archimedes.',
    ],
    qs: [
      ['nb', 'Trong giới hạn đàn hồi, độ lớn lực đàn hồi của lò xo tỉ lệ thuận với', ['độ biến dạng của lò xo', 'chiều dài tự nhiên của lò xo', 'khối lượng của lò xo', 'bình phương độ biến dạng'], 'Theo định luật Hooke: $F_{đh} = k|\\Delta l|$.'],
      ['nb', 'Đơn vị của độ cứng $k$ của lò xo trong hệ SI là', ['N/m', 'N·m', 'J/m', 'kg/m'], '$k = F_{đh} / |\\Delta l|$ có đơn vị là N/m.'],
      ['nb', 'Lực đẩy Archimedes tác dụng lên một vật nhúng trong chất lỏng có chiều', ['thẳng đứng từ dưới lên trên', 'thẳng đứng từ trên xuống dưới', 'ngang từ trái sang phải', 'vuông góc với bề mặt nghiêng của vật'], 'Lực đẩy Archimedes luôn hướng thẳng đứng từ dưới lên trên, ngược chiều trọng lực.'],
      ['th', 'Một lò xo có chiều dài tự nhiên $l_0 = 20\\text{ cm}$, độ cứng $k = 100\\text{ N/m}$. Khi chịu lực kéo làm lò xo dài $24\\text{ cm}$ (trong giới hạn đàn hồi), độ lớn lực đàn hồi của lò xo là', ['$4\\text{ N}$', '$24\\text{ N}$', '$400\\text{ N}$', '$2{,}4\\text{ N}$'], '$\\Delta l = 24 - 20 = 4\\text{ cm} = 0{,}04\\text{ m} \\implies F_{đh} = 100 \\times 0{,}04 = 4\\text{ N}$.'],
      ['th', 'Treo một vật khối lượng $m = 0{,}5\\text{ kg}$ vào lò xo nhẹ có độ cứng $k = 50\\text{ N/m}$ tại nơi có $g = 10\\text{ m/s}^2$. Khi vật cân bằng, lò xo dãn một đoạn là', ['$10\\text{ cm}$', '$5\\text{ cm}$', '$1\\text{ cm}$', '$20\\text{ cm}$'], 'Cân bằng: $k\\Delta l = mg \\implies \\Delta l = \\frac{0{,}5 \\times 10}{50} = 0{,}1\\text{ m} = 10\\text{ cm}$.'],
      ['th', 'Một vật có thể tích $200\\text{ cm}^3$ nhúng chìm hoàn toàn trong nước có khối lượng riêng $\\rho = 1000\\text{ kg/m}^3$ (lấy $g = 10\\text{ m/s}^2$). Lực đẩy Archimedes tác dụng lên vật là', ['$2\\text{ N}$', '$20\\text{ N}$', '$0{,}2\\text{ N}$', '$200\\text{ N}$'], '$V = 200 \\times 10^{-6} = 2 \\times 10^{-4}\\text{ m}^3 \\implies F_A = 1000 \\times 10 \\times 2 \\times 10^{-4} = 2\\text{ N}$.'],
      ['vd', 'Hai lò xo có độ cứng $k_1 = 60\\text{ N/m}$ và $k_2 = 40\\text{ N/m}$ ghép song song với nhau. Độ cứng tương đương của hệ lò xo là', ['$100\\text{ N/m}$', '$24\\text{ N/m}$', '$50\\text{ N/m}$', '$20\\text{ N/m}$'], 'Ghép song song: $k_{ss} = k_1 + k_2 = 60 + 40 = 100\\text{ N/m}$ (ghép nối tiếp thì $1/k_{nt} = 1/k_1 + 1/k_2$).'],
      ['vd', 'Một khối gỗ hình hộp tiết diện đều nổi thẳng đứng trong nước ($\\rho_{nước} = 1000\\text{ kg/m}^3$) thì phần chìm chiếm $60\\%$ thể tích khối gỗ. Khối lượng riêng của gỗ là', ['$600\\text{ kg/m}^3$', '$400\\text{ kg/m}^3$', '$1600\\text{ kg/m}^3$', '$800\\text{ kg/m}^3$'], 'Khi vật nổi cân bằng: $P = F_A \\implies \\rho_{gỗ} V g = \\rho_{nước} (0{,}6V) g \\implies \\rho_{gỗ} = 600\\text{ kg/m}^3$.'],
    ],
  },

  'ly-c4-dongdien': {
    points: [
      'Cường độ dòng điện không đổi: $I = \\frac{\\Delta q}{\\Delta t}$ (A); Điện trở dây dẫn $R = \\rho \\frac{l}{S}$ ($\\Omega$).',
      'Định luật Ôm cho đoạn mạch: $I = \\frac{U}{R}$; Định luật Ôm cho toàn mạch: $I = \\frac{\\mathcal{E}}{R_N + r}$.',
      'Hiệu điện thế mạch ngoài: $U_N = \\mathcal{E} - I \\cdot r = I \\cdot R_N$.',
      'Công suất tỏa nhiệt trên điện trở $P = I^2 R = \\frac{U^2}{R}$; Hiệu suất nguồn điện $H = \\frac{U_N}{\\mathcal{E}} = \\frac{R_N}{R_N + r}$.',
    ],
    mistakes: [
      'Quên cộng điện trở trong $r$ của nguồn khi áp dụng định luật Ôm toàn mạch.',
      'Nhầm lẫn giữa suất điện động $\\mathcal{E}$ và hiệu điện thế hai cực nguồn $U_N$ khi mạch có dòng điện ($r > 0$).',
    ],
    qs: [
      ['nb', 'Cường độ dòng điện không đổi qua một tiết diện thẳng của vật dẫn được xác định bởi công thức', ['$I = \\frac{\\Delta q}{\\Delta t}$', '$I = \\Delta q \\cdot \\Delta t$', '$I = \\frac{\\Delta t}{\\Delta q}$', '$I = \\Delta q^2 \\cdot \\Delta t$'], 'Theo định nghĩa cường độ dòng điện: $I = \\frac{\\Delta q}{\\Delta t}$.'],
      ['nb', 'Biểu thức định luật Ôm cho toàn mạch gồm nguồn điện $(\\mathcal{E}, r)$ và mạch ngoài có điện trở tương đương $R_N$ là', ['$I = \\frac{\\mathcal{E}}{R_N + r}$', '$I = \\frac{\\mathcal{E}}{R_N - r}$', '$I = \\frac{\\mathcal{E}}{R_N}$', '$I = \\mathcal{E}(R_N + r)$'], 'Định luật Ôm toàn mạch: $I = \\frac{\\mathcal{E}}{R_N + r}$.'],
      ['nb', 'Nhiệt lượng tỏa ra trên vật dẫn có điện trở $R$ khi có dòng điện cường độ $I$ chạy qua trong thời gian $t$ (Định luật Jun – Len-xơ) là', ['$Q = I^2 R t$', '$Q = I R^2 t$', '$Q = I R t$', '$Q = \\frac{I^2 t}{R}$'], 'Định luật Jun – Len-xơ: $Q = I^2 R t$.'],
      ['th', 'Trong khoảng thời gian $4\\text{ s}$, điện lượng dịch chuyển qua tiết diện thẳng của dây dẫn là $8\\text{ C}$. Cường độ dòng điện trong dây dẫn là', ['$2\\text{ A}$', '$32\\text{ A}$', '$0{,}5\\text{ A}$', '$4\\text{ A}$'], '$I = \\frac{\\Delta q}{\\Delta t} = \\frac{8}{4} = 2\\text{ A}$.'],
      ['th', 'Hai điện trở $R_1 = 6\\ \\Omega$ và $R_2 = 12\\ \\Omega$ mắc song song với nhau. Điện trở tương đương của đoạn mạch là', ['$4\\ \\Omega$', '$18\\ \\Omega$', '$9\\ \\Omega$', '$2\\ \\Omega$'], '$R_{td} = \\frac{R_1 R_2}{R_1 + R_2} = \\frac{6 \\times 12}{6 + 12} = 4\\ \\Omega$.'],
      ['th', 'Một nguồn điện có suất điện động $\\mathcal{E} = 12\\text{ V}$, điện trở trong $r = 1\\ \\Omega$ nối với điện trở mạch ngoài $R = 5\\ \\Omega$ thành mạch kín. Cường độ dòng điện và hiệu điện thế mạch ngoài lần lượt là', ['$I = 2\\text{ A}$ và $U_N = 10\\text{ V}$', '$I = 2{,}4\\text{ A}$ và $U_N = 12\\text{ V}$', '$I = 2\\text{ A}$ và $U_N = 12\\text{ V}$', '$I = 1{,}5\\text{ A}$ và $U_N = 9\\text{ V}$'], '$I = \\frac{12}{5 + 1} = 2\\text{ A}$; $U_N = I \\cdot R = 2 \\times 5 = 10\\text{ V}$.'],
      ['vd', 'Nguồn điện có $\\mathcal{E} = 9\\text{ V}$, $r = 1{,}5\\ \\Omega$ cung cấp điện cho mạch ngoài có biến trở $R$. Để công suất tiêu thụ ở mạch ngoài đạt giá trị cực đại thì giá trị của $R$ và công suất cực đại đó lần lượt là', ['$R = 1{,}5\\ \\Omega$ và $P_{max} = 13{,}5\\text{ W}$', '$R = 3\\ \\Omega$ và $P_{max} = 27\\text{ W}$', '$R = 1{,}5\\ \\Omega$ và $P_{max} = 27\\text{ W}$', '$R = 0\\ \\Omega$ và $P_{max} = 54\\text{ W}$'], 'Công suất mạch ngoài cực đại khi $R = r = 1{,}5\\ \\Omega$, khi đó $P_{max} = \\frac{\\mathcal{E}^2}{4r} = \\frac{9^2}{4 \\times 1{,}5} = 13{,}5\\text{ W}$.'],
      ['vd', 'Một ấm điện công suất $1000\\text{ W}$ được sử dụng để đun sôi $2\\text{ kg}$ nước từ $20^\\circ\\text{C}$ ($c = 4200\\text{ J/(kg·K)}$). Biết hiệu suất ấm là $84\\%$. Thời gian đun sôi nước là', ['$800\\text{ s}$', '$672\\text{ s}$', '$1000\\text{ s}$', '$560\\text{ s}$'], '$Q_{thu} = m c \\Delta t = 2 \\times 4200 \\times 80 = 672000\\text{ J}$. $Q_{tỏa} = \\frac{Q_{thu}}{H} = \\frac{672000}{0{,}84} = 800000\\text{ J} \\implies t = \\frac{800000}{1000} = 800\\text{ s}$.'],
    ],
  },

  'ly-c2-khi': {
    points: [
      'Nhiệt độ tuyệt đối Kelvin: $T(\\text{K}) = t(^\\circ\\text{C}) + 273$.',
      'Định luật Boyle (đẳng nhiệt $T = \\text{const}$): $p_1 V_1 = p_2 V_2$; Định luật Charles (đẳng áp $p = \\text{const}$): $\\frac{V_1}{T_1} = \\frac{V_2}{T_2}$.',
      'Phương trình trạng thái khí lí tưởng: $\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}$ và phương trình Clapeyron: $pV = nRT$ ($R = 8{,}314\\text{ J/(mol·K)}$).',
      'Áp suất khí theo mô hình động học phân tử: $p = \\frac{1}{3}\\mu m \\overline{v^2} = \\frac{2}{3}\\mu \\overline{E_đ}$; Động năng tịnh tiến trung bình $\\overline{E_đ} = \\frac{3}{2}k_B T$.',
    ],
    mistakes: [
      'Quên đổi nhiệt độ từ $^\\circ\\text{C}$ sang Kelvin ($T = t + 273$) khi áp dụng phương trình trạng thái khí lí tưởng.',
      'Nhầm đơn vị trong phương trình $pV = nRT$: dùng $R = 8{,}314$ thì $p$ phải tính theo Pa và $V$ theo $\\text{m}^3$.',
    ],
    qs: [
      ['nb', 'Quá trình biến đổi trạng thái của một lượng khí xác định khi nhiệt độ được giữ không đổi gọi là', ['quá trình đẳng nhiệt (Định luật Boyle)', 'quá trình đẳng áp (Định luật Charles)', 'quá trình đẳng tích', 'quá trình đoạn nhiệt'], 'Nhiệt độ không đổi là quá trình đẳng nhiệt, tuân theo định luật Boyle $pV = \\text{const}$.'],
      ['nb', 'Biểu thức phương trình trạng thái của một khối lượng khí lí tưởng xác định là', ['$\\frac{pV}{T} = \\text{hằng số}$', '$\\frac{pT}{V} = \\text{hằng số}$', '$pVT = \\text{hằng số}$', '$\\frac{VT}{p} = \\text{hằng số}$'], 'Phương trình trạng thái khí lí tưởng: $\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}$.'],
      ['nb', 'Động năng trung bình của chuyển động nhiệt của các phân tử khí lí tưởng tỉ lệ thuận với', ['nhiệt độ tuyệt đối $T$ (K)', 'nhiệt độ Celsius $t$ ($^\\circ$C)', 'thể tích bình chứa $V$', 'khối lượng phân tử khí'], 'Theo thuyết động học phân tử khí: $\\overline{E_đ} = \\frac{3}{2}k_B T$ chỉ phụ thuộc nhiệt độ tuyệt đối $T$.'],
      ['th', 'Một lượng khí ở nhiệt độ không đổi có thể tích $6\\text{ lít}$ ở áp suất $2\\text{ atm}$. Khi nén đẳng nhiệt để thể tích giảm còn $4\\text{ lít}$ thì áp suất của khí là', ['$3\\text{ atm}$', '$1{,}33\\text{ atm}$', '$4\\text{ atm}$', '$2{,}5\\text{ atm}$'], 'Định luật Boyle: $p_1 V_1 = p_2 V_2 \\implies p_2 = \\frac{2 \\times 6}{4} = 3\\text{ atm}$.'],
      ['th', 'Đun nóng đẳng áp một khối khí từ nhiệt độ $27^\\circ\\text{C}$ lên đến $127^\\circ\\text{C}$. Nếu thể tích ban đầu là $3\\text{ lít}$ thì thể tích sau khi đun là', ['$4\\text{ lít}$', '$14{,}1\\text{ lít}$', '$3{,}5\\text{ lít}$', '$6\\text{ lít}$'], '$T_1 = 300\\text{ K}, T_2 = 400\\text{ K}$. Định luật Charles: $V_2 = V_1 \\frac{T_2}{T_1} = 3 \\times \\frac{400}{300} = 4\\text{ lít}$.'],
      ['th', 'Khi nhiệt độ tuyệt đối của khối khí lí tưởng tăng gấp 4 lần thì căn bậc hai của trung bình bình phương tốc độ phân tử ($\\sqrt{\\overline{v^2}}$) sẽ', ['tăng gấp 2 lần', 'tăng gấp 4 lần', 'tăng gấp 16 lần', 'không đổi'], 'Vì $\\frac{1}{2}m\\overline{v^2} = \\frac{3}{2}k_B T \\implies v_{rms} = \\sqrt{\\frac{3RT}{M}} \\propto \\sqrt{T}$ nên $T$ tăng 4 lần thì $v_{rms}$ tăng 2 lần.'],
      ['vd', 'Một bình kín dung tích không đổi chứa khí ở $27^\\circ\\text{C}$ và áp suất $1{,}5\\text{ atm}$. Khi nung nóng bình tới $87^\\circ\\text{C}$ thì áp suất khí trong bình là', ['$1{,}8\\text{ atm}$', '$4{,}8\\text{ atm}$', '$1{,}65\\text{ atm}$', '$2{,}1\\text{ atm}$'], 'Đẳng tích: $p_2 = p_1 \\frac{T_2}{T_1} = 1{,}5 \\times \\frac{87 + 273}{27 + 273} = 1{,}5 \\times \\frac{360}{300} = 1{,}8\\text{ atm}$.'],
      ['vd', 'Trong xi-lanh của một động cơ có chứa $2\\text{ lít}$ khí ở áp suất $1\\text{ atm}$ và nhiệt độ $27^\\circ\\text{C}$. Pít-tông nén xuống làm thể tích khí giảm còn $0{,}4\\text{ lít}$ và áp suất tăng lên $6\\text{ atm}$. Nhiệt độ của khí khi đó là', ['$87^\\circ\\text{C}$', '$360^\\circ\\text{C}$', '$32{,}4^\\circ\\text{C}$', '$127^\\circ\\text{C}$'], '$\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2} \\implies T_2 = 300 \\times \\frac{6 \\times 0{,}4}{1 \\times 2} = 360\\text{ K} \\implies t_2 = 360 - 273 = 87^\\circ\\text{C}$.'],
    ],
  },

  'sinh-c2-phanbao': {
    points: [
      'Chu kì tế bào gồm kì trung gian ($G_1 \\to S \\to G_2$, chiếm phần lớn thời gian) và nguyên phân (kì đầu, kì giữa, kì sau, kì cuối).',
      'Từ $a$ tế bào ban đầu có bộ NST $2n$ nguyên phân $k$ lần tạo $a \\cdot 2^k$ tế bào con, môi trường cung cấp $a \\cdot 2n \\cdot (2^k - 1)$ NST đơn.',
      'Giảm phân gồm 2 lần phân bào liên tiếp nhưng NST chỉ nhân đôi 1 lần ở kì trung gian, từ 1 tế bào $2n$ tạo ra 4 tế bào con có bộ NST đơn bội $n$.',
      'Tiếp hợp và trao đổi chéo giữa các chromatid không chị em ở kì đầu giảm phân I tạo ra vô số biến dị tổ hợp.',
    ],
    mistakes: [
      'Nhầm hàm lượng NST ở kì giữa nguyên phân ($2n$ NST kép) với kì sau nguyên phân ($4n$ NST đơn).',
      'Quên rằng trong giảm phân, kết thúc giảm phân I các tế bào con đã có bộ NST đơn bội kép ($n$ NST kép).',
    ],
    qs: [
      ['nb', 'Trong chu kì tế bào, sự nhân đôi của ADN và nhiễm sắc thể diễn ra ở pha nào của kì trung gian?', ['Pha S', 'Pha G₁', 'Pha G₂', 'Pha M (Nguyên phân)'], 'Pha S (Synthesis) là pha tổng hợp, nơi ADN và NST nhân đôi tạo thành NST kép.'],
      ['nb', 'Trong quá trình nguyên phân, các nhiễm sắc thể kép co xoắn cực đại và xếp thành một hàng trên mặt phẳng xích đạo của thoi phân bào ở', ['kì giữa', 'kì đầu', 'kì sau', 'kì cuối'], 'Ở kì giữa nguyên phân, NST kép đóng xoắn cực đại và tập trung thành 1 hàng ở mặt phẳng xích đạo.'],
      ['nb', 'Kết quả của quá trình giảm phân từ 1 tế bào sinh dục chín ($2n$) là tạo ra', ['4 tế bào con có bộ nhiễm sắc thể đơn bội ($n$)', '2 tế bào con có bộ nhiễm sắc thể lưỡng bội ($2n$)', '4 tế bào con có bộ nhiễm sắc thể lưỡng bội ($2n$)', '2 tế bào con có bộ nhiễm sắc thể đơn bội ($n$)'], 'Giảm phân gồm 2 lần phân bào nhưng chỉ 1 lần nhân đôi NST nên tạo 4 tế bào đơn bội ($n$).'],
      ['th', 'Hiện tượng tiếp hợp và trao đổi chéo giữa các chromatid khác nguồn trong cặp nhiễm sắc thể tương đồng xảy ra ở', ['kì đầu của giảm phân I', 'kì giữa của giảm phân I', 'kì đầu của giảm phân II', 'kì sau của nguyên phân'], 'Tiếp hợp và trao đổi chéo xảy ra ở kì đầu giảm phân I, tạo ra biến dị tổ hợp.'],
      ['th', 'Một tế bào ruồi giấm ($2n = 8$) đang ở kì sau của quá trình nguyên phân. Số nhiễm sắc thể đơn trong tế bào đó là', ['16 NST đơn', '8 NST kép', '8 NST đơn', '4 NST đơn'], 'Ở kì sau nguyên phân, mỗi NST kép tách thành 2 NST đơn phân li về 2 cực nên tế bào có $4n = 16$ NST đơn.'],
      ['th', 'Ở động vật có vú, từ 1 tế bào sinh tinh và 1 tế bào sinh trứng sau khi giảm phân bình thường sẽ tạo ra tối đa bao nhiêu tinh trùng và bao nhiêu trứng?', ['4 tinh trùng và 1 tế bào trứng (kèm 3 thể cực)', '4 tinh trùng và 4 tế bào trứng', '2 tinh trùng và 1 tế bào trứng', '1 tinh trùng và 4 tế bào trứng'], '1 tế bào sinh tinh giảm phân tạo 4 tinh trùng; 1 tế bào sinh trứng giảm phân tạo 1 trứng và 3 thể cực.'],
      ['vd', 'Có 5 tế bào sinh dưỡng của một loài ($2n = 24$) đều nguyên phân liên tiếp 4 lần. Số tế bào con được tạo ra và số NST môi trường cung cấp lần lượt là', ['80 tế bào con và 1800 NST', '80 tế bào con và 1920 NST', '64 tế bào con và 1800 NST', '20 tế bào con và 360 NST'], 'Số TB con $= 5 \\times 2^4 = 80$. Số NST môi trường cung cấp $= 5 \\times 24 \\times (2^4 - 1) = 1800$ NST.'],
      ['vd', 'Một loài có bộ nhiễm sắc thể $2n = 14$. Nếu không xảy ra đột biến và không có trao đổi chéo, số loại giao tử tối đa khác nhau về nguồn gốc NST của loài là', ['128 loại', '14 loại', '28 loại', '64 loại'], 'Với $n = 7$ cặp NST tương đồng, số loại giao tử tối đa do phân li độc lập của các NST là $2^n = 2^7 = 128$ loại.'],
    ],
  },

  'sinh-c8-sinh10-tebao-virus': {
    points: [
      'Vi sinh vật có kích thước hiển vi, hấp thụ và chuyển hóa chất dinh dưỡng nhanh, sinh trưởng và sinh sản rất nhanh.',
      '4 kiểu dinh dưỡng dựa vào nguồn năng lượng và nguồn carbon: Quang tự dưỡng, Quang dị dưỡng, Hóa tự dưỡng, Hóa dị dưỡng.',
      'Sinh trưởng của quần thể vi khuẩn trong nuôi cấy không liên tục gồm 4 pha: Pha tiềm phát (lag) $\\to$ Pha lũy thừa (log) $\\to$ Pha cân bằng $\\to$ Pha suy vong.',
      'Virus là thực thể chưa có cấu tạo tế bào, gồm lõi nucleic acid (ADN hoặc ARN) và vỏ capsid, kí sinh nội bào bắt buộc.',
    ],
    mistakes: [
      'Dùng thuốc kháng sinh để tiêu diệt virus (kháng sinh chỉ diệt vi khuẩn, KHÔNG diệt được virus).',
      'Nhầm công thức tính số tế bào vi khuẩn sau thời gian $t$: $N = N_0 \\cdot 2^n$ với số lần phân chia $n = t / g$.',
    ],
    qs: [
      ['nb', 'Cấu tạo cơ bản của tất cả các loại virus (nucleocapsid) đều bao gồm hai thành phần chính là', ['lõi nucleic acid (ADN hoặc ARN) và lớp vỏ protein (capsid)', 'màng sinh chất và tế bào chất', 'vùng nhân và ribosome 70S', 'thành tế bào peptidoglycan và vỏ nhầy'], 'Virus chưa có cấu tạo tế bào, cấu tạo trần gồm lõi nucleic acid và vỏ protein (capsid).'],
      ['nb', 'Trong nuôi cấy không liên tục, số lượng tế bào vi khuẩn trong quần thể tăng lên với tốc độ lớn nhất và không đổi ở pha nào?', ['Pha lũy thừa (pha log)', 'Pha tiềm phát (pha lag)', 'Pha cân bằng', 'Pha suy vong'], 'Ở pha lũy thừa (log), vi khuẩn phân chia liên tục với tốc độ cực đại và hằng số.'],
      ['nb', 'Các vi sinh vật sử dụng nguồn năng lượng từ ánh sáng và nguồn carbon là $\\text{CO}_2$ (như tảo, vi khuẩn lam) có kiểu dinh dưỡng là', ['quang tự dưỡng', 'quang dị dưỡng', 'hóa tự dưỡng', 'hóa dị dưỡng'], 'Nguồn năng lượng ánh sáng (quang) + nguồn carbon vô cơ $\\text{CO}_2$ (tự dưỡng) $\\to$ quang tự dưỡng.'],
      ['th', 'Vì sao thuốc kháng sinh penicillin có thể tiêu diệt nhiều loại vi khuẩn nhưng không tiêu diệt được virus?', ['Vì virus chưa có cấu tạo tế bào và không có thành peptidoglycan hay ribosome riêng', 'Vì virus có thành tế bào dày hơn vi khuẩn', 'Vì virus tự tổng hợp được enzyme phân hủy mọi kháng sinh', 'Vì virus chỉ sống ở ngoài cơ thể vật chủ'], 'Kháng sinh ức chế tổng hợp thành tế bào hoặc ribosome 70S của vi khuẩn, trong khi virus chưa có cấu tạo tế bào và dùng bộ máy của tế bào chủ.'],
      ['th', 'Trong pha tiềm phát (pha lag) của nuôi cấy vi khuẩn không liên tục, đặc điểm nào sau đây là đúng?', ['Vi khuẩn thích nghi với môi trường, tổng hợp mạnh ADN và enzyme nhưng số lượng tế bào chưa tăng', 'Số lượng tế bào sinh ra bằng số lượng tế bào chết đi', 'Chất dinh dưỡng cạn kiệt và chất độc tích lũy tối đa', 'Tốc độ phân chia tế bào đạt cực đại'], 'Ở pha tiềm phát, vi khuẩn tiết enzyme cảm ứng để thích nghi nên số lượng tế bào chưa tăng ($N = N_0$).'],
      ['th', 'Để thu được sinh khối vi sinh vật nhiều nhất trong sản xuất công nghiệp, người ta dùng phương pháp nuôi cấy liên tục nhằm duy trì quần thể ở', ['pha lũy thừa kéo dài', 'pha tiềm phát kéo dài', 'pha suy vong', 'cuối pha suy vong'], 'Nuôi cấy liên tục bổ sung dinh dưỡng và lấy dịch nuôi ra liên tục giúp giữ vi sinh vật ở trạng thái sinh trưởng lũy thừa.'],
      ['vd', 'Một quần thể vi khuẩn *E. coli* có thời gian thế hệ $g = 20\\text{ phút}$. Từ 100 tế bào ban đầu, sau $2\\text{ giờ}$ nuôi cấy trong điều kiện tối ưu thì số lượng tế bào trong quần thể là', ['6400 tế bào', '3200 tế bào', '1200 tế bào', '12800 tế bào'], 'Số lần phân chia $n = \\frac{120}{20} = 6$. Số tế bào $N = N_0 \\cdot 2^n = 100 \\times 2^6 = 6400$ tế bào.'],
      ['vd', 'Nuôi cấy một chủng vi khuẩn sau $3\\text{ giờ}$ thu được $16000$ tế bào từ $500$ tế bào ban đầu (bỏ qua pha tiềm phát). Thời gian thế hệ $g$ của chủng vi khuẩn này là', ['$36\\text{ phút}$', '$30\\text{ phút}$', '$20\\text{ phút}$', '$45\\text{ phút}$'], '$2^n = \\frac{16000}{500} = 32 \\implies n = 5$. Thời gian thế hệ $g = \\frac{180\\text{ phút}}{5} = 36\\text{ phút}$.'],
    ],
  },

  'sinh-c7-sinh11-cothe': {
    points: [
      'Rễ cây hấp thụ nước theo cơ chế thẩm thấu (từ thế nước cao đến thế nước thấp) và hấp thụ ion khoáng theo cơ chế thụ động hoặc chủ động (cần ATP).',
      'Mạch gỗ (xylem) gồm các tế bào chết vận chuyển nước và ion khoáng từ rễ lên lá nhờ 3 động lực: áp suất rễ, thoát hơi nước ở lá (động lực đầu trên quan trọng nhất) và lực liên kết giữa các phân tử nước.',
      'Quang hợp ở thực vật gồm pha sáng (ở màng thylakoid: quang phân li nước tạo $\\text{O}_2$, ATP, NADPH) và pha tối (ở chất nền stroma: cố định $\\text{CO}_2$ theo chu trình Calvin $C_3$, $C_4$ hoặc CAM).',
      'Hô hấp thực vật phân giải chất hữu cơ tạo năng lượng ATP: Đường phân (tế bào chất) $\\to$ Chu trình Krebs (chất nền ti thể) $\\to$ Chuỗi chuyền electron (màng trong ti thể, tạo nhiều ATP nhất).',
    ],
    mistakes: [
      'Nhầm rằng khí $\\text{O}_2$ giải phóng trong quang hợp có nguồn gốc từ $\\text{CO}_2$ (thực tế $\\text{O}_2$ hoàn toàn sinh ra từ quá trình quang phân li nước $\\text{H}_2\\text{O}$ ở pha sáng).',
      'Nhầm mạch gỗ (vận chuyển dòng đi lên từ rễ lên lá) với mạch rây (phloem — tế bào sống vận chuyển chất hữu cơ từ lá xuống rễ).',
    ],
    qs: [
      ['nb', 'Cơ quan chủ yếu thực hiện chức năng hấp thụ nước và ion khoáng ở thực vật trên cạn là', ['rễ (đặc biệt là miền lông hút)', 'lá cây', 'thân cây', 'hoa và quả'], 'Tế bào lông hút ở rễ có thành mỏng, không thấm cutin, không bào lớn tạo áp suất thẩm thấu cao để hút nước và khoáng.'],
      ['nb', 'Trong quá trình quang hợp ở cây xanh, khí $\\text{O}_2$ thoát ra có nguồn gốc từ phân tử nào?', ['$\\text{H}_2\\text{O}$ (do quang phân li nước ở pha sáng)', '$\\text{CO}_2$ (do khử carbon ở pha tối)', 'Glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$)', 'Diệp lục a'], 'Quang phân li nước ở pha sáng: $2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + 4e^- + \\text{O}_2\\uparrow$.'],
      ['nb', 'Động lực đầu trên quan trọng nhất giúp dòng mạch gỗ vận chuyển nước từ rễ lên tới ngọn cây cao hàng chục mét là', ['lực hút do quá trình thoát hơi nước ở lá', 'lực đẩy của áp suất rễ', 'chuyển động của dòng mạch rây', 'quá trình hô hấp sáng ở lá'], 'Thoát hơi nước ở lá tạo lực hút đầu trên cực lớn kéo cột nước liên tục từ rễ lên lá.'],
      ['th', 'Pha sáng của quá trình quang hợp diễn ra tại vị trí nào trong lục lạp và tạo ra sản phẩm gì cung cấp cho pha tối?', ['Tại màng thylakoid, cung cấp ATP và NADPH cho pha tối', 'Tại chất nền stroma, cung cấp $\\text{CO}_2$ và glucose cho pha tối', 'Tại màng ngoài lục lạp, cung cấp $\\text{O}_2$ cho pha tối', 'Tại nhân tế bào, cung cấp ADP và $\\text{NADP}^+$'], 'Pha sáng ở màng thylakoid chuyển quang năng thành hóa năng trong ATP và NADPH đưa vào pha tối ở stroma.'],
      ['th', 'Thực vật CAM (như xương rồng, dứa, thanh long) thích nghi với điều kiện khô hạn bằng cách', ['đóng khí khổng vào ban ngày để giảm mất nước và mở khí khổng vào ban đêm để nhận $\\text{CO}_2$', 'mở khí khổng suốt ban ngày và đóng vào ban đêm', 'không thực hiện quá trình thoát hơi nước và quang hợp', 'chỉ hấp thụ $\\text{CO}_2$ qua hệ rễ trong đất'], 'Thực vật CAM mở khí khổng ban đêm để cố định $\\text{CO}_2$ và đóng khí khổng ban ngày để chống mất nước.'],
      ['th', 'Trong hô hấp hiếu khí ở tế bào thực vật, giai đoạn nào tạo ra nhiều phân tử ATP nhất?', ['Chuỗi truyền electron hô hấp ở màng trong ti thể', 'Giai đoạn đường phân ở bào tương', 'Chu trình Krebs ở chất nền ti thể', 'Quá trình lên men rượu'], 'Chuỗi truyền electron ở màng trong ti thể tạo ra khoảng 26–28 ATP (trong tổng số ~30–32 ATP từ 1 phân tử glucose).'],
      ['vd', 'Vì sao khi bón quá nhiều phân hóa học đậm đặc cho cây trồng trên cạn thì cây lại bị héo và chết?', ['Nồng độ chất tan trong đất quá cao làm thế nước đất thấp hơn dịch bào lông hút, khiến rễ không hút được nước mà còn mất nước', 'Cây hút quá nhiều nước làm vỡ thành tế bào thực vật', 'Phân hóa học làm khí khổng ở lá mở cực đại suốt ngày đêm', 'Mạch rây bị tắc nghẽn không vận chuyển được nước lên lá'], 'Ưu trương ngoài đất làm nước thẩm thấu ngược từ tế bào lông hút ra đất (hiện tượng hạn sinh lí).'],
      ['vd', 'Khi bảo quản nông sản (hạt khô, rau quả tươi), các biện pháp như phơi khô hạt hoặc giữ rau quả ở nhiệt độ thấp có mục đích chung là', ['giảm cường độ hô hấp tế bào đến mức tối thiểu (nhưng không bằng 0) để hạn chế tiêu hao chất hữu cơ', 'làm ngừng hoàn toàn mọi hoạt động sống và giết chết phôi hạt', 'tăng cường độ quang hợp của hạt trong kho tối', 'tăng lượng nhiệt tỏa ra để tiêu diệt nấm mốc'], 'Giảm độ ẩm hoặc hạ nhiệt độ làm giảm cường độ hô hấp, giúp giữ khối lượng và chất lượng nông sản lâu hơn.'],
    ],
  },

  'sinh-c7b-dongvat': {
    points: [
      'Hô hấp ở động vật: Bề mặt trao đổi khí hiệu quả cần rộng, mỏng và ẩm ướt, nhiều mao mạch và có sự lưu thông khí. Chim trao đổi khí hiệu quả nhất trên cạn nhờ hệ thống túi khí; cá xương trao đổi khí hiệu quả dưới nước nhờ dòng nước chảy ngược chiều dòng máu trong mao mạch mang.',
      'Hệ tuần hoàn: Hệ tuần hoàn hở (chân khớp, thân mềm) có máu chảy áp lực thấp; Hệ tuần hoàn kín gồm tuần hoàn đơn (cá: tim 2 ngăn) và tuần hoàn kép (lưỡng cư, bò sát, chim, thú: tim 4 ngăn ở chim và thú giúp máu giàu $\\text{O}_2$ không pha trộn).',
      'Hoạt động tim và mạch: Hệ dẫn truyền tim (nút xoang nhĩ phát xung $\\to$ nút nhĩ thất $\\to$ bó His $\\to$ mạng Purkinje). Chu kì tim người trưởng thành $\\approx 0{,}8\\text{ s}$ (nhĩ co $0{,}1\\text{ s}$, thất co $0{,}3\\text{ s}$, dãn chung $0{,}4\\text{ s}$).',
      'Cân bằng nội môi: Insulin làm giảm đường huyết (chuyển glucose $\\to$ glycogen), Glucagon làm tăng đường huyết.',
    ],
    mistakes: [
      'Nhầm vận tốc máu và huyết áp: Huyết áp giảm dần từ động mạch $\\to$ mao mạch $\\to$ tĩnh mạch; còn vận tốc máu NHỎ NHẤT ở mao mạch (do tổng tiết diện mao mạch lớn nhất) để kịp trao đổi chất.',
      'Nhầm vai trò của Insulin (hạ glucose máu) và Glucagon (tăng glucose máu).',
    ],
    qs: [
      ['nb', 'Nhóm động vật nào sau đây có hệ tuần hoàn kép và tim 4 ngăn hoàn chỉnh (máu nuôi cơ thể hoàn toàn là máu đỏ tươi giàu $\\text{O}_2$)?', ['Chim và Thú', 'Cá xương và Cá sụn', 'Lưỡng cư (ếch nhái)', 'Chân khớp và Thân mềm'], 'Chim và Thú có tim 4 ngăn hoàn chỉnh với 2 vòng tuần hoàn kép, máu giàu $\\text{O}_2$ không bị pha trộn.'],
      ['nb', 'Trong hệ mạch máu của người, vận tốc máu chảy chậm nhất ở đoạn mạch nào để đảm bảo sự trao đổi chất giữa máu và tế bào?', ['Mao mạch', 'Động mạch chủ', 'Tĩnh mạch chủ', 'Tiểu động mạch'], 'Mao mạch có tổng tiết diện lớn nhất nên vận tốc máu nhỏ nhất, giúp máu kịp trao đổi $\\text{O}_2$, dinh dưỡng với tế bào.'],
      ['nb', 'Sau bữa ăn nhiều tinh bột, nồng độ glucose trong máu tăng cao, tuyến tụy sẽ tiết ra hormone nào để chuyển hóa glucose thành glycogen dự trữ ở gan và cơ?', ['Insulin', 'Glucagon', 'Adrenaline', 'Thyroxine'], 'Tế bào $\\beta$ đảo tụy tiết Insulin chuyển glucose thành glycogen để hạ đường huyết về mức cân bằng.'],
      ['th', 'Vì sao cá xương có thể lấy được hơn $80\\%$ lượng $\\text{O}_2$ hòa tan trong nước khi dòng nước đi qua mang?', ['Dòng nước chảy một chiều qua mang và song song, ngược chiều với dòng máu chảy trong mao mạch mang', 'Cá xương có thêm hệ thống túi khí thông với phổi', 'Máu trong hệ tuần hoàn hở của cá tiếp xúc trực tiếp với nước', 'Cá xương ngừng thở khi bơi nhanh'], 'Hiện tượng dòng chảy song song và ngược chiều giữa máu trong mao mạch mang và dòng nước giúp khuếch tán $\\text{O}_2$ tối đa.'],
      ['th', 'Ở người trưởng thành khỏe mạnh lúc nghỉ ngơi, mỗi chu kì co dãn của tim kéo dài $0{,}8\\text{ s}$ (pha co tâm nhĩ $0{,}1\\text{ s}$, pha co tâm thất $0{,}3\\text{ s}$, pha dãn chung $0{,}4\\text{ s}$). Nhịp tim trung bình là', ['75 nhịp/phút', '60 nhịp/phút', '80 nhịp/phút', '90 nhịp/phút'], 'Số nhịp tim trong 1 phút ($60\\text{ s}$) $= \\frac{60}{0{,}8} = 75$ nhịp/phút.'],
      ['th', 'Ở động vật nhai lại (trâu, bò, dê, cừu), bộ phận nào của dạ dày 4 ngăn tiết ra pepsin và HCl để tiêu hóa chính thức protein (bao gồm cả nguồn vi sinh vật cộng sinh)?', ['Dạ múi khế', 'Dạ cỏ', 'Dạ tổ ong', 'Dạ lá sách'], 'Dạ múi khế là dạ dày chính thức của động vật nhai lại, tiết enzyme pepsin và HCl tiêu hóa protein.'],
      ['vd', 'Khi một người chuyển từ vùng đồng bằng lên sống ở vùng núi cao (không khí loãng, phân áp $\\text{O}_2$ thấp), cơ thể sẽ có phản ứng thích nghi sinh lí nào sau đây?', ['Thận tăng tiết erythropoietin kích thích tủy xương tăng sản sinh hồng cầu và tăng nhịp thở', 'Giảm số lượng hồng cầu để máu loãng dễ chảy hơn', 'Huyết áp và nhịp tim giảm xuống mức tối thiểu ngay lập tức', 'Phổi ngừng trao đổi khí để tiết kiệm năng lượng'], 'Thiếu $\\text{O}_2$ kích thích thận tiết hormone erythropoietin làm tủy xương tăng sinh hồng cầu nhằm tăng khả năng vận chuyển $\\text{O}_2$.'],
      ['vd', 'Một bệnh nhân có huyết áp đo được là $145/95\\text{ mmHg}$. Hai chỉ số $145$ và $95$ lần lượt biểu thị cho', ['huyết áp tâm thu (ứng với lúc tâm thất co) và huyết áp tâm trương (ứng với lúc tâm thất dãn)', 'huyết áp tâm trương (lúc tim dãn) và huyết áp tâm thu (lúc tim co)', 'huyết áp ở tĩnh mạch chủ và huyết áp ở mao mạch phổi', 'nhịp tim lúc vận động và nhịp tim lúc nghỉ ngơi'], 'Chỉ số lớn là huyết áp tâm thu (khi tâm thất co tống máu vào động mạch), chỉ số nhỏ là huyết áp tâm trương (khi tâm thất dãn).'],
    ],
  },

  'sinh-c1b-nst': {
    points: [
      'Đơn vị cấu trúc cơ bản của nhiễm sắc thể ở sinh vật nhân thực là nucleosome (gồm 8 phân tử protein histone được quấn quanh bởi $1\\frac{3}{4}$ vòng ADN $\\approx 146$ cặp nu).',
      '4 dạng đột biến cấu trúc NST: Mất đoạn (giảm số lượng gen), Lặp đoạn (tăng hoặc giảm biểu hiện gen), Đảo đoạn (đổi vị trí gen trên cùng 1 NST), Chuyển đoạn (giữa các NST không tương đồng).',
      'Đột biến lệch bội làm thay đổi số lượng NST ở một hoặc một số cặp: Thể một ($2n - 1$), Thể ba ($2n + 1$, ví dụ Hội chứng Down có 3 NST số 21).',
      'Đột biến đa bội làm tăng một số nguyên lần bộ NST đơn bội ($> 2n$): Tự đa bội ($3n, 4n\\dots$) hoặc Dị đa bội (lai xa kèm đa bội hóa tạo thể song nhị bội hữu thụ $2n_A + 2n_B$).',
    ],
    mistakes: [
      'Nhầm đột biến điểm (biến đổi 1 cặp nu của gen) với đột biến cấu trúc NST (mất/lặp/đảo/chuyển cả đoạn NST chứa nhiều gen).',
      'Quên rằng thể tam bội ($3n$, như dưa hấu không hạt) thường bất thụ nên không tạo hạt.',
    ],
    qs: [
      ['nb', 'Đơn vị cấu trúc cơ bản theo chiều dọc của nhiễm sắc thể ở sinh vật nhân thực là', ['nucleosome (8 phân tử histone quấn bởi ~146 cặp nucleotide ADN)', 'ribosome 80S', 'polynucleotide mạch đơn', 'plasmid dạng vòng'], 'Mỗi nucleosome gồm lõi 8 phân tử protein histone được đoạn ADN dài khoảng 146 cặp nu quấn $1\\frac{3}{4}$ vòng.'],
      ['nb', 'Dạng đột biến cấu trúc nhiễm sắc thể nào sau đây làm giảm số lượng gen trên nhiễm sắc thể và thường gây hậu quả nghiêm trọng nhất?', ['Mất đoạn nhiễm sắc thể', 'Đảo đoạn nhiễm sắc thể', 'Lặp đoạn nhiễm sắc thể', 'Chuyển đoạn trên cùng một NST'], 'Mất đoạn làm mất vật chất di truyền nên thường gây chết hoặc giảm sức sống.'],
      ['nb', 'Ở người, hội chứng Down là dạng đột biến lệch bội thuộc thể', ['thể ba ($2n + 1$) ở cặp nhiễm sắc thể số 21 (có 3 NST số 21)', 'thể một ($2n - 1$) ở cặp nhiễm sắc thể giới tính (XO)', 'thể ba ở cặp nhiễm sắc thể giới tính (XXY)', 'thể tam bội ($3n$) ở toàn bộ các cặp NST'], 'Người mắc hội chứng Down có 3 NST số 21 (tổng $2n + 1 = 47$ NST).'],
      ['th', 'Để tạo ra các giống cây trồng lấy quả không hạt (như dưa hấu không hạt, nho không hạt), người ta thường ứng dụng dạng đột biến nào?', ['Đột biến tự đa bội lẻ (tạo thể tam bội $3n$)', 'Đột biến tự đa bội chẵn (tạo thể tứ bội $4n$)', 'Đột biến đảo đoạn nhiễm sắc thể', 'Đột biến thể một ($2n - 1$)'], 'Thể tam bội ($3n$) có bộ NST lẻ nên giảm phân bị rối loạn không tạo được giao tử bình thường $\\to$ quả không hạt.'],
      ['th', 'Trong công tác chọn giống, người ta có thể dùng đột biến chuyển đoạn hoặc mất đoạn nhỏ nhằm mục đích gì?', ['Chuyển các gen quý giữa các loài hoặc loại bỏ các gen không mong muốn khỏi NST', 'Làm tăng gấp đôi toàn bộ bộ nhiễm sắc thể trong tế bào', 'Biến vi khuẩn nhân sơ thành sinh vật nhân thực', 'Ngăn cản hoàn toàn quá trình nguyên phân của mô phân sinh'], 'Mất đoạn nhỏ có thể dùng để loại bỏ gen xấu; chuyển đoạn dùng để chuyển nhóm gen có lợi sang NST khác.'],
      ['th', 'Hóa chất colchicine thường được sử dụng trong tạo giống đa bội vì nó có tác dụng', ['ngăn cản sự hình thành thoi phân bào làm NST đã nhân đôi không phân li', 'cắt đứt phân tử ADN tại các trình tự đặc hiệu', 'tăng tốc độ trượt của ribosome trên phân tử mARN', 'kích thích sự trao đổi chéo giữa các NST không tương đồng'], 'Colchicine ức chế trùng hợp vi ống tạo thoi phân bào, khiến bộ NST sau khi nhân đôi không phân li tạo tế bào đa bội.'],
      ['vd', 'Một loài thực vật có bộ nhiễm sắc thể lưỡng bội $2n = 18$. Số lượng nhiễm sắc thể trong tế bào sinh dưỡng của thể một ($2n - 1$) và thể tam bội ($3n$) của loài này lần lượt là', ['17 NST và 27 NST', '17 NST và 54 NST', '19 NST và 27 NST', '9 NST và 27 NST'], 'Với $2n = 18 \\implies n = 9$. Thể một: $2n - 1 = 17$ NST. Thể tam bội: $3n = 3 \\times 9 = 27$ NST.'],
      ['vd', 'Ở một loài thực vật có $2n = 24$, trong quần thể có thể xuất hiện tối đa bao nhiêu dạng thể ba đơn ($2n + 1$) khác nhau?', ['12 dạng', '24 dạng', '25 dạng', '6 dạng'], 'Loài có $n = 12$ cặp NST tương đồng. Thể ba đơn ($2n + 1$) có thể xảy ra ở bất kì cặp nào trong 12 cặp $\\to$ có tối đa 12 dạng.'],
    ],
  },

  'sinh-c6-ditruyen-nguoi': {
    points: [
      'Di truyền học người sử dụng phương pháp nghiên cứu phả hệ, nghiên cứu trẻ đồng sinh, nghiên cứu tế bào học và di truyền phân tử.',
      'Quy trình giải bài tập Phả hệ 2 bước: Bước 1 xác định tính trạng bệnh do gen trội hay lặn (Bố mẹ bình thường sinh con bị bệnh $\\implies$ bệnh do gen LẶN); Bước 2 xác định gen nằm trên NST thường hay NST giới tính X (Bố bình thường sinh con gái bị bệnh lặn $\\implies$ gen nằm trên NST THƯỜNG).',
      'Một số bệnh di truyền phổ biến: Bệnh do gen lặn trên NST thường (Bạch tạng, Phenylketonuria - PKU, Hồng cầu hình liềm); Bệnh do gen lặn trên NST X (Máu khó đông, Mù màu); Hội chứng bất thường NST (Down: 3 NST 21, Turner: XO, Klinefelter: XXY).',
      'Liệu pháp gen là kĩ thuật thay thế gen bệnh bằng gen lành hoặc chỉnh sửa gen bị hỏng để điều trị bệnh di truyền.',
    ],
    mistakes: [
      'Quên quy tắc vàng trong phả hệ: "Bố mẹ bình thường sinh con gái bị bệnh $\\implies$ chắc chắn bệnh do gen LẶN nằm trên NST THƯỜNG".',
      'Khi tính xác suất kiểu gen của người có kiểu hình bình thường có anh/chị/em ruột bị bệnh ($aa$), quên rằng xác suất họ mang kiểu gen dị hợp $Aa$ là $\\frac{2}{3}$ chứ không phải $\\frac{1}{2}$!',
    ],
    qs: [
      ['nb', 'Phương pháp theo dõi sự di truyền của một tính trạng nhất định trên những người thuộc cùng một dòng họ qua nhiều thế hệ được gọi là', ['phương pháp nghiên cứu phả hệ', 'phương pháp nghiên cứu trẻ đồng sinh', 'phương pháp nghiên cứu tế bào học', 'phương pháp di truyền quần thể'], 'Nghiên cứu phả hệ dùng các kí hiệu quy ước để theo dõi tính trạng/bệnh di truyền qua các thế hệ trong gia đình.'],
      ['nb', 'Khi phân tích một sơ đồ phả hệ, nếu thấy cặp bố mẹ đều có kiểu hình bình thường nhưng sinh ra được một người con gái bị bệnh thì có thể kết luận ngay', ['bệnh do gen lặn nằm trên nhiễm sắc thể thường quy định', 'bệnh do gen trội nằm trên nhiễm sắc thể thường quy định', 'bệnh do gen lặn nằm trên nhiễm sắc thể giới tính X quy định', 'bệnh do gen nằm trên nhiễm sắc thể giới tính Y quy định'], 'Bố mẹ bình thường sinh con bệnh $\\implies$ bệnh do gen lặn. Con gái bệnh ($aa$) phải nhận 1 allele lặn từ bố bình thường $\\implies$ gen nằm trên NST thường.'],
      ['nb', 'Bệnh phenylketonuria (PKU) ở người là bệnh rối loạn chuyển hóa do đột biến gen lặn làm thiếu hụt enzyme chuyển hóa amino acid nào?', ['Phenylalanine thành tyrosine', 'Glutamic acid thành valine', 'Methionine thành glycine', 'Tryptophan thành alanine'], 'Thiếu enzyme chuyển hóa phenylalanine thành tyrosine làm phenylalanine ứ đọng trong máu gây độc tế bào thần kinh não.'],
      ['th', 'Phương pháp nghiên cứu trẻ đồng sinh cùng trứng và khác trứng được nuôi dưỡng trong các môi trường giống hoặc khác nhau giúp xác định', ['vai trò của kiểu gen và ảnh hưởng của môi trường đối với sự hình thành tính trạng', 'số lượng nhiễm sắc thể trong tế bào sinh dưỡng của loài người', 'vị trí chính xác của các locus gen trên nhiễm sắc thể', 'tần số đột biến gen trong quần thể người'], 'Trẻ đồng sinh cùng trứng có cùng kiểu gen nên sự khác biệt giữa chúng phản ánh mức phản ứng và vai trò của môi trường.'],
      ['th', 'Ở người, một người phụ nữ có bộ nhiễm sắc thể giới tính XO (tổng 45 NST) sẽ mắc hội chứng nào sau đây?', ['Hội chứng Turner', 'Hội chứng Klinefelter (XXY)', 'Hội chứng Down (3 NST 21)', 'Hội chứng siêu nữ (XXX)'], 'Thể một ở cặp NST giới tính ($44A + XO = 45$ NST) ở nữ gây hội chứng Turner.'],
      ['th', 'Một cặp bố mẹ đều bình thường nhưng đã sinh một đứa con bị bệnh bạch tạng (do gen lặn $a$ trên NST thường quy định). Người con thứ hai của họ có kiểu hình bình thường. Xác suất để người con thứ hai này mang kiểu gen dị hợp ($Aa$) là', ['2/3', '1/2', '1/4', '3/4'], 'Bố mẹ là $Aa \\times Aa \\to \\frac{1}{4}AA : \\frac{2}{4}Aa : \\frac{1}{4}aa$. Vì người con thứ hai đã biết là bình thường ($A-$ chiếm $\\frac{3}{4}$) nên xác suất là $Aa$ bằng $\\frac{2/4}{3/4} = \\frac{2}{3}$.'],
      ['vd', 'Ở người, bệnh bạch tạng do gen lặn $a$ trên NST thường quy định. Người chồng bình thường có em gái ruột bị bạch tạng (bố mẹ chồng đều bình thường). Người vợ bình thường có mẹ bị bạch tạng. Xác suất để cặp vợ chồng này sinh đứa con đầu lòng bị bệnh bạch tạng là', ['1/6', '1/4', '1/8', '1/12'], 'Chồng bình thường có bố mẹ $Aa \\times Aa$ nên xác suất chồng là $Aa$ bằng $\\frac{2}{3}$. Vợ bình thường có mẹ $aa$ nên vợ chắc chắn là $Aa$ ($1$). Xác suất sinh con $aa = \\frac{2}{3} \\times 1 \\times \\frac{1}{4} = \\frac{1}{6}$.'],
      ['vd', 'Một cặp vợ chồng đều bình thường về cả hai bệnh: Bạch tạng (gen lặn $a$ trên NST thường) và Mù màu (gen lặn $b$ trên NST X). Họ đã sinh được một con trai đầu lòng vừa bị bạch tạng vừa bị mù màu. Xác suất để họ sinh đứa con thứ hai là con gái không bị cả hai bệnh trên là', ['3/8 (37,5%)', '9/16 (56,25%)', '3/4 (75%)', '1/4 (25%)'], 'Con trai đầu lòng $aa X^b Y \\implies$ Bố là $Aa X^B Y$, Mẹ là $Aa X^B X^b$. Xác suất sinh con gái không mù màu ($X^B X^-$) $= \\frac{1}{2}$ (mọi con gái đều nhận $X^B$ từ bố). Xác suất không bạch tạng ($A-$) $= \\frac{3}{4}$. Tích xác suất $= \\frac{3}{4} \\times \\frac{1}{2} = \\frac{3}{8}$.'],
    ],
  },

  'sinh-c9-sinhthai': {
    points: [
      'Sinh thái học cá thể: Giới hạn sinh thái gồm khoảng thuận lợi và 2 khoảng chống chịu; vượt ngoài giới hạn sinh thái sinh vật sẽ chết.',
      'Sinh thái học quần thể: Các đặc trưng gồm tỉ lệ giới tính, nhóm tuổi, phân bố (theo nhóm, đồng đều, ngẫu nhiên), mật độ cá thể (đặc trưng cơ bản nhất), kích thước quần thể ($N_{min}$ đến $N_{max}$).',
      'Sinh thái học quần xã: Độ đa dạng, loài ưu thế (số lượng nhiều, sinh khối lớn), loài chủ chốt (kiểm soát cấu trúc quần xã). Quan hệ hỗ trợ (cộng sinh, hợp tác, hội sinh) và đối kháng (cạnh tranh, kí sinh, ức chế – cảm nhiễm, sinh vật này ăn sinh vật khác).',
      'Hệ sinh thái & Sinh quyển: Chu trình sinh địa hóa (Carbon, Nitrogen, Nước) tuần hoàn vật chất, trong khi dòng năng lượng đi 1 chiều. Hiệu suất sinh thái $H = \\frac{E_{n+1}}{E_n} \\times 100\\% \\approx 10\\%$.',
    ],
    mistakes: [
      'Nhầm quan hệ cộng sinh (bắt buộc cả hai cùng có lợi, tách ra không sống được) với hợp tác (cả hai cùng có lợi nhưng không bắt buộc) và hội sinh (1 bên lợi, 1 bên không lợi cũng không hại).',
      'Nhầm loài ưu thế (đông đảo nhất) với loài chủ chốt (có vai trò kiểm soát khống chế các loài khác dù số lượng có thể không nhiều).',
    ],
    qs: [
      ['nb', 'Trong các đặc trưng cơ bản của quần thể sinh vật, đặc trưng nào được coi là quan trọng nhất vì chi phối mức sử dụng nguồn sống, mức sinh sản và mức tử vong?', ['Mật độ cá thể của quần thể', 'Tỉ lệ giới tính', 'Kiểu phân bố không gian', 'Cấu trúc nhóm tuổi'], 'Mật độ cá thể (số cá thể trên một đơn vị diện tích hay thể tích) là đặc trưng cơ bản nhất của quần thể.'],
      ['nb', 'Trong quần xã sinh vật, mối quan hệ mà trong đó một loài có lợi còn loài kia không có lợi cũng không bị hại (ví dụ: phong lan bám trên thân cây gỗ lớn) là mối quan hệ', ['hội sinh', 'cộng sinh', 'hợp tác', 'kí sinh'], 'Hội sinh (+ / 0): một loài có lợi, loài kia không có lợi cũng không bị hại.'],
      ['nb', 'Khi kích thước của một quần thể sinh vật giảm xuống dưới mức tối thiểu ($N < N_{min}$), quần thể dễ rơi vào trạng thái suy giảm dẫn tới diệt vong vì', ['khả năng hỗ trợ giảm, cơ hội gặp nhau sinh sản giảm và giao phối gần tăng', 'sự cạnh tranh cùng loài trở nên gay gắt cực đại', 'nguồn thức ăn trong môi trường bị cạn kiệt hoàn toàn', 'tốc độ đột biến có lợi tăng quá nhanh'], 'Dưới kích thước tối thiểu, hiệu quả nhóm giảm, khó tìm bạn tình và tăng giao phối cận huyết làm quần thể suy thoái.'],
      ['th', 'Cá rô phi ở Việt Nam có giới hạn sinh thái về nhiệt độ từ $5{,}6^\\circ\\text{C}$ đến $42^\\circ\\text{C}$, trong đó phát triển tốt nhất ở $20^\\circ\\text{C} - 35^\\circ\\text{C}$. Khoảng nhiệt độ từ $20^\\circ\\text{C}$ đến $35^\\circ\\text{C}$ được gọi là', ['khoảng thuận lợi', 'giới hạn sinh thái', 'khoảng chống chịu trên', 'điểm gây chết dưới'], 'Khoảng giá trị của nhân tố sinh thái mà sinh vật thực hiện chức năng sống tốt nhất gọi là khoảng thuận lợi.'],
      ['th', 'Trong chu trình tuần hoàn Nitrogen tự nhiên, nhóm vi khuẩn nào có khả năng chuyển hóa nitrate ($\\text{NO}_3^-$) trong đất thành khí nitrogen phân tử ($\\text{N}_2$) làm nghèo đạm trong đất kị khí?', ['Vi khuẩn phản nitrate hóa', 'Vi khuẩn cố định đạm (*Rhizobium*)', 'Vi khuẩn nitrate hóa', 'Vi khuẩn amôn hóa'], 'Trong điều kiện đất thiếu $\\text{O}_2$ (ngập úng), vi khuẩn phản nitrate hóa chuyển $\\text{NO}_3^- \\to \\text{N}_2\\uparrow$ gây thất thoát đạm.'],
      ['th', 'Hiện tượng tảo giáp nở hoa trong nước tiết chất độc làm cá và các thủy sinh vật chết hàng loạt (mà tảo không sử dụng cá làm thức ăn) là ví dụ về mối quan hệ', ['ức chế – cảm nhiễm', 'cạnh tranh khác loài', 'kí sinh – vật chủ', 'sinh vật này ăn sinh vật khác'], 'Ức chế – cảm nhiễm: một loài trong quá trình sống vô tình tiết chất gây hại cho các loài khác xung quanh.'],
      ['vd', 'Trong một hệ sinh thái đồng cỏ, năng lượng tích lũy ở sinh vật sản xuất là $10^7\\text{ kcal}$, ở sinh vật tiêu thụ bậc 1 là $1{,}2 \\cdot 10^6\\text{ kcal}$, ở sinh vật tiêu thụ bậc 2 là $1{,}08 \\cdot 10^5\\text{ kcal}$. Hiệu suất sinh thái giữa sinh vật tiêu thụ bậc 2 so với sinh vật tiêu thụ bậc 1 là', ['9%', '12%', '10,8%', '1,08%'], '$H = \\frac{E_{\\text{SVTT bậc 2}}}{E_{\\text{SVTT bậc 1}}} \\times 100\\% = \\frac{1{,}08 \\cdot 10^5}{1{,}2 \\cdot 10^6} \\times 100\\% = 9\\%$.'],
      ['vd', 'Một quần thể chim sẻ trên đảo có kích thước ban đầu $1000$ cá thể. Trong năm có $180$ cá thể mới sinh ra, $60$ cá thể bị chết, $40$ cá thể nhập cư và $10$ cá thể xuất cư. Kích thước của quần thể vào cuối năm là', ['1150 cá thể', '1120 cá thể', '1090 cá thể', '1210 cá thể'], '$N_t = N_0 + B - D + I - E = 1000 + 180 - 60 + 40 - 10 = 1150$ cá thể.'],
    ],
  },
};

export const EXPANSION_SKILL_TAGS = {
  'ly-c3-nangluong': 'Công, Công suất, Động năng & Bảo toàn cơ năng',
  'ly-c4-dongluong': 'Động lượng, Xung lượng & Va chạm',
  'ly-c5-chuyendongtron': 'Chuyển động tròn đều & Lực hướng tâm',
  'ly-c6-biendang': 'Định luật Hooke, Áp suất & Lực đẩy Archimedes',
  'ly-c4-dongdien': 'Dòng điện không đổi & Định luật Ôm toàn mạch',
  'ly-c2-khi': 'Khí lí tưởng & Phương trình trạng thái',
  'sinh-c2-phanbao': 'Chu kì tế bào, Nguyên phân & Giảm phân',
  'sinh-c8-sinh10-tebao-virus': 'Vi sinh vật học & Virus',
  'sinh-c7-sinh11-cothe': 'Trao đổi chất, Quang hợp & Hô hấp ở Thực vật',
  'sinh-c7b-dongvat': 'Hô hấp, Tuần hoàn & Cân bằng nội môi Động vật',
  'sinh-c1b-nst': 'Nhiễm sắc thể, Đột biến cấu trúc & Số lượng NST',
  'sinh-c6-ditruyen-nguoi': 'Di truyền học Người & Phân tích Phả hệ',
  'sinh-c9-sinhthai': 'Sinh thái học Cá thể, Quần thể, Quần xã & Hệ sinh thái',
};
