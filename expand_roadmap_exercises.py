# expand_roadmap_exercises.py
# Script to add Physics and Biology topics, plus extra questions to BANK in src/data/roadmapExercises.js

import re

PHYSICS_BANK = '''
  /* ======================= VẬT LÍ (CHƯƠNG TRÌNH GDPT 2018) ======================= */
  'ly-c1-donghoc': {
    points: [
      'Vận tốc là đại lượng vectơ: $\\\\vec{v} = \\\\frac{\\\\Delta\\\\vec{d}}{\\\\Delta t}$. Quãng đường $s \\\\ge |d|$.',
      'Chuyển động thẳng biến đổi đều: $v = v_0 + at$, $d = v_0 t + \\\\frac{1}{2}at^2$, $v^2 - v_0^2 = 2ad$.',
      'Rơi tự do là chuyển động thẳng nhanh dần đều với $a = g \\\\approx 9{,}8\\\\text{ m/s}^2$ (hoặc $10\\\\text{ m/s}^2$), $v_0 = 0$.',
      'Chuyển động ném ngang gồm: phương ngang thẳng đều ($v_x = v_0$), phương thẳng đứng rơi tự do ($v_y = gt$). Tầm xa $L = v_0\\\\sqrt{\\\\frac{2H}{g}}$.',
    ],
    mistakes: [
      'Nhầm lẫn giữa độ dịch chuyển $d$ (vectơ nối điểm đầu - cuối) và quãng đường $s$ (chiều dài quỹ đạo).',
      'Quên dấu của gia tốc $a$ khi xe chuyển động chậm dần đều ($a$ ngược dấu với $v_0$).',
      'Nghĩ rằng thời gian rơi của ném ngang phụ thuộc vào vận tốc ném $v_0$ (thực tế chỉ phụ thuộc độ cao $H$).',
    ],
    qs: [
      ['nb', 'Một vật rơi tự do không vận tốc đầu từ độ cao h. Thời gian rơi chạm đất t được tính bằng công thức', ['$\\\\sqrt{\\\\frac{2h}{g}}$', '$\\\\frac{2h}{g}$', '$\\\\sqrt{\\\\frac{h}{2g}}$', '$\\\\frac{h}{g}$'], 'Từ $h = \\\\frac{1}{2}gt^2 \\\\implies t = \\\\sqrt{\\\\frac{2h}{g}}$.'],
      ['nb', 'Trong chuyển động thẳng biến đổi đều, hệ thức độc lập với thời gian liên hệ giữa vận tốc, gia tốc và độ dịch chuyển là', ['$v^2 - v_0^2 = 2ad$', '$v^2 - v_0^2 = ad$', '$v - v_0 = 2ad$', '$v^2 + v_0^2 = 2ad$'], 'Công thức độc lập thời gian: $v^2 - v_0^2 = 2ad$.'],
      ['nb', 'Chuyển động ném ngang có thể phân tích thành hai chuyển động thành phần độc lập là', ['thẳng đều theo phương ngang và rơi tự do theo phương thẳng đứng', 'thẳng đều theo phương thẳng đứng và biến đổi đều theo phương ngang', 'chậm dần đều theo phương ngang và rơi tự do theo phương thẳng đứng', 'nhanh dần đều theo cả hai phương'], 'Theo phương ngang $a_x = 0$ (thẳng đều), phương thẳng đứng chỉ có trọng lực $a_y = g$ (rơi tự do).'],
      ['th', 'Một ôtô đang chạy với vận tốc 20 m/s thì hãm phanh chuyển động chậm dần đều với gia tốc có độ lớn $2\\\\text{ m/s}^2$. Quãng đường ôtô đi được đến khi dừng hẳn là', ['100 m', '200 m', '50 m', '80 m'], 'Khi dừng $v = 0$. $a = -2\\\\text{ m/s}^2$. Áp dụng: $0^2 - 20^2 = 2(-2)s \\\\implies s = 100\\\\text{ m}$.'],
      ['th', 'Một vật ném ngang từ độ cao $H = 20\\\\text{ m}$ với vận tốc ban đầu $v_0 = 15\\\\text{ m/s}$. Lấy $g = 10\\\\text{ m/s}^2$. Tầm bay xa của vật là', ['30 m', '45 m', '60 m', '20 m'], 'Thời gian rơi $t = \\\\sqrt{\\\\frac{2 \\\\times 20}{10}} = 2\\\\text{ s}$. Tầm xa $L = v_0 \\\\cdot t = 15 \\\\times 2 = 30\\\\text{ m}$.'],
      ['th', 'Đồ thị độ dịch chuyển - thời gian ($d - t$) của một vật chuyển động thẳng đều có dạng là', ['đường thẳng xiên góc', 'đường parabol', 'đường hypebol', 'đoạn thẳng song song trục thời gian'], 'Chuyển động thẳng đều có $d = vt$, hàm bậc nhất nên đồ thị $d - t$ là đường thẳng xiên góc đi qua gốc tọa độ.'],
      ['vd', 'Một giọt nước rơi tự do từ mái nhà cao 45 m. Lấy $g = 10\\\\text{ m/s}^2$. Quãng đường giọt nước rơi được trong giây cuối cùng trước khi chạm đất là', ['25 m', '20 m', '35 m', '15 m'], 'Thời gian rơi toàn phần: $t = \\\\sqrt{\\\\frac{2 \\\\times 45}{10}} = 3\\\\text{ s}$. Quãng đường rơi trong 2 giây đầu: $s_2 = \\\\frac{1}{2} \\\\cdot 10 \\\\cdot 2^2 = 20\\\\text{ m}$. Quãng đường trong giây thứ 3: $\\\\Delta s = 45 - 20 = 25\\\\text{ m}$.'],
      ['vd', 'Một máy bay bay ngang ở độ cao 500 m với vận tốc $180\\\\text{ km/h}$ thả kiện hàng cứu trợ. Lấy $g = 9{,}8\\\\text{ m/s}^2$. Máy bay phải thả hàng trước mục tiêu theo phương ngang một khoảng xấp xỉ là', ['505 m', '714 m', '1800 m', '350 m'], '$v_0 = 180\\\\text{ km/h} = 50\\\\text{ m/s}$. Thời gian rơi: $t = \\\\sqrt{\\\\frac{2 \\\\times 500}{9{,}8}} \\\\approx 10{,}1\\\\text{ s}$. Tầm xa: $L = 50 \\\\times 10{,}1 = 505\\\\text{ m}$.'],
    ],
  },

  'ly-c2-dongluchoc': {
    points: [
      'Định luật II Newton: $\\\\vec{F} = m\\\\vec{a}$. Lực tác dụng cùng hướng với gia tốc.',
      'Định luật III Newton: $\\\\vec{F}_{AB} = -\\\\vec{F}_{BA}$ (lực và phản lực xuất hiện đồng thời, trực đối nhưng không cân bằng vì đặt vào hai vật khác nhau).',
      'Lực ma sát trượt: $F_{mst} = \\\\mu N$. Lực đàn hồi (Định luật Hooke): $F_{dh} = k|\\\\Delta l|$.',
      'Công cơ học: $A = F \\\\cdot s \\\\cdot \\\\cos\\\\alpha$. Công suất $P = \\\\frac{A}{t} = F \\\\cdot v$. Cơ năng $W = W_đ + W_t = \\\\frac{1}{2}mv^2 + mgz$ bảo toàn khi chỉ có trọng lực.',
    ],
    mistakes: [
      'Cho rằng lực và phản lực là hai lực cân bằng (chúng đặt vào HAI VẬT KHÁC NHAU nên không thể triệt tiêu).',
      'Quên tính áp lực $N$ khi lực kéo hợp với phương ngang một góc $\\\\alpha$ ($N = mg - F\\\\sin\\\\alpha$).',
      'Dùng công thức cơ năng bảo toàn khi có ma sát sinh công (khi có ma sát: $W_2 - W_1 = A_{ms} < 0$).',
    ],
    qs: [
      ['nb', 'Biểu thức của định luật II Newton là', ['$\\\\vec{a} = \\\\frac{\\\\vec{F}}{m}$', '$\\\\vec{a} = m\\\\vec{F}$', '$\\\\vec{F} = \\\\frac{\\\\vec{a}}{m}$', '$\\\\vec{a} = \\\\frac{m}{\\\\vec{F}}$'], 'Định luật II Newton: Gia tốc tỉ lệ thuận với hợp lực và tỉ lệ nghịch với khối lượng.'],
      ['nb', 'Lực đàn hồi của lò xo trong giới hạn đàn hồi tuân theo định luật Hooke có biểu thức là', ['$F_{dh} = k |\\\\Delta l|$', '$F_{dh} = \\\\frac{k}{|\\\\Delta l|}$', '$F_{dh} = \\\\frac{1}{2}k \\\\Delta l^2$', '$F_{dh} = \\\\mu N$'], 'Định luật Hooke: $F_{dh} = k |\\\\Delta l|$.'],
      ['nb', 'Công của lực F làm vật dịch chuyển một quãng đường s theo hướng hợp với lực một góc $\\\\alpha$ là', ['$A = F s \\\\cos\\\\alpha$', '$A = F s \\\\sin\\\\alpha$', '$A = \\\\frac{F s}{\\\\cos\\\\alpha}$', '$A = F s \\\\tan\\\\alpha$'], 'Công cơ học: $A = F s \\\\cos\\\\alpha$.'],
      ['th', 'Khi một vật chỉ chịu tác dụng của trọng lực, đại lượng nào sau đây được bảo toàn?', ['Cơ năng của vật', 'Động năng của vật', 'Thế năng của vật', 'Vận tốc của vật'], 'Trong trọng trường, nếu bỏ qua ma sát và lực cản, cơ năng $W = W_đ + W_t$ được bảo toàn.'],
      ['th', 'Một vật có khối lượng $m = 2\\\\text{ kg}$ chuyển động với vận tốc $v = 6\\\\text{ m/s}$. Động năng của vật là', ['36 J', '12 J', '72 J', '18 J'], '$W_đ = \\\\frac{1}{2}mv^2 = \\\\frac{1}{2} \\\\times 2 \\\\times 6^2 = 36\\\\text{ J}$.'],
      ['th', 'Một lò xo có độ cứng $k = 100\\\\text{ N/m}$. Khi bị kéo dãn một đoạn 4 cm, lực đàn hồi của lò xo có độ lớn là', ['4 N', '400 N', '25 N', '0,4 N'], 'Đổi $\\\\Delta l = 0{,}04\\\\text{ m}$. $F_{dh} = 100 \\\\times 0{,}04 = 4\\\\text{ N}$.'],
      ['vd', 'Một vật khối lượng 500 g được thả rơi tự do từ độ cao 20 m so với mặt đất. Lấy $g = 10\\\\text{ m/s}^2$. Động năng của vật khi rơi đến độ cao 5 m là', ['75 J', '25 J', '100 J', '50 J'], 'Bảo toàn cơ năng: $W = mgz_0 = 0{,}5 \\\\times 10 \\\\times 20 = 100\\\\text{ J}$. Tại $z = 5\\\\text{ m}$: $W_t = 0{,}5 \\\\times 10 \\\\times 5 = 25\\\\text{ J} \\\\implies W_đ = 100 - 25 = 75\\\\text{ J}$.'],
      ['vd', 'Một lực kéo $F = 50\\\\text{ N}$ hợp với phương ngang một góc $60^\\\\circ$ kéo một vật trượt đều trên sàn nằm ngang một quãng đường 10 m trong 5 giây. Công suất của lực kéo là', ['50 W', '100 W', '250 W', '25 W'], '$A = F s \\\\cos 60^\\\\circ = 50 \\\\times 10 \\\\times 0{,}5 = 250\\\\text{ J}$. Công suất $P = \\\\frac{A}{t} = \\\\frac{250}{5} = 50\\\\text{ W}$.'],
    ],
  },

  'ly-c1-daodong': {
    points: [
      'Phương trình dao động điều hòa: $x = A\\\\cos(\\\\omega t + \\\\varphi)$. Chu kì $T = \\\\frac{2\\\\pi}{\\\\omega}$, tần số $f = \\\\frac{1}{T}$.',
      'Vận tốc $v = x\\' = -\\\\omega A \\\\sin(\\\\omega t + \\\\varphi)$ sớm pha $\\\\frac{\\\\pi}{2}$ so với li độ. $v_{\\\\max} = \\\\omega A$.',
      'Gia tốc $a = v\\' = -\\\\omega^2 x$ ngược pha với li độ ($a$ luôn hướng về vị trí cân bằng). $a_{\\\\max} = \\\\omega^2 A$.',
      'Hệ thức độc lập: $x^2 + \\\\frac{v^2}{\\\\omega^2} = A^2$. Cơ năng: $W = \\\\frac{1}{2}m\\\\omega^2 A^2 = \\\\text{const}$.',
    ],
    mistakes: [
      'Quên rằng gia tốc ngược pha với li độ ($a = -\\\\omega^2 x$, không có dấu +).',
      'Nhầm lẫn giữa tần số dao động của li độ ($f$) và tần số biến thiên của động năng/thế năng ($2f$).',
      'Lấy biên độ bằng chiều dài quỹ đạo $L$ (thực tế $L = 2A \\\\implies A = L/2$).',
    ],
    qs: [
      ['nb', 'Một vật dao động điều hòa theo phương trình $x = A\\\\cos(\\\\omega t + \\\\varphi)$. Vận tốc cực đại của vật là', ['$\\\\omega A$', '$\\\\omega^2 A$', '$\\\\frac{A}{\\\\omega}$', '$\\\\frac{\\\\omega}{A}$'], '$v_{\\\\max} = \\\\omega A$ đạt được khi vật qua vị trí cân bằng theo chiều dương.'],
      ['nb', 'Gia tốc của một chất điểm dao động điều hòa biến thiên', ['ngược pha với li độ', 'cùng pha với li độ', 'sớm pha $\\\\pi/2$ so với li độ', 'trễ pha $\\\\pi/2$ so với li độ'], '$a = -\\\\omega^2 x = \\\\omega^2 A \\\\cos(\\\\omega t + \\\\varphi + \\\\pi)$, sớm pha $\\\\pi$ (ngược pha) so với $x$.'],
      ['nb', 'Chu kì dao động của con lắc lò xo gồm vật nặng m và lò xo có độ cứng k là', ['$T = 2\\\\pi \\\\sqrt{\\\\frac{m}{k}}$', '$T = 2\\\\pi \\\\sqrt{\\\\frac{k}{m}}$', '$T = \\\\frac{1}{2\\\\pi} \\\\sqrt{\\\\frac{m}{k}}$', '$T = 2\\\\pi \\\\sqrt{\\\\frac{l}{g}}$'], 'Chu kì con lắc lò xo: $T = 2\\\\pi \\\\sqrt{\\\\frac{m}{k}}$.'],
      ['th', 'Một chất điểm dao động điều hòa trên đoạn thẳng dài 10 cm với tần số góc $4\\\\pi\\\\text{ rad/s}$. Tốc độ cực đại của chất điểm là', ['$20\\\\pi\\\\text{ cm/s}$', '$40\\\\pi\\\\text{ cm/s}$', '$10\\\\pi\\\\text{ cm/s}$', '$5\\\\pi\\\\text{ cm/s}$'], 'Chiều dài quỹ đạo $L = 2A = 10\\\\text{ cm} \\\\implies A = 5\\\\text{ cm}$. $v_{\\\\max} = \\\\omega A = 4\\\\pi \\\\times 5 = 20\\\\pi\\\\text{ cm/s}$.'],
      ['th', 'Khi một vật dao động điều hòa từ biên về vị trí cân bằng thì', ['động năng tăng, thế năng giảm', 'động năng giảm, thế năng tăng', 'cơ năng của vật tăng', 'vận tốc và gia tốc cùng ngược chiều chuyển động'], 'Về VTCB, tốc độ tăng nên động năng tăng, độ lệch giảm nên thế năng giảm.'],
      ['th', 'Con lắc đơn dao động điều hòa với chiều dài $l = 1\\\\text{ m}$ tại nơi có $g = \\\\pi^2\\\\text{ m/s}^2$. Chu kì dao động của con lắc là', ['2 s', '1 s', '4 s', '0,5 s'], '$T = 2\\\\pi \\\\sqrt{\\\\frac{l}{g}} = 2\\\\pi \\\\sqrt{\\\\frac{1}{\\\\pi^2}} = 2\\\\text{ s}$.'],
      ['vd', 'Một chất điểm dao động điều hòa với chu kì $T = 2\\\\text{ s}$ và biên độ $A = 10\\\\text{ cm}$. Tại thời điểm li độ $x = 6\\\\text{ cm}$, tốc độ của chất điểm là', ['$8\\\\pi\\\\text{ cm/s}$', '$6\\\\pi\\\\text{ cm/s}$', '$10\\\\pi\\\\text{ cm/s}$', '$12\\\\pi\\\\text{ cm/s}$'], '$\\\\omega = \\\\frac{2\\\\pi}{T} = \\\\pi\\\\text{ rad/s}$. Áp dụng hệ thức độc lập: $v = \\\\omega \\\\sqrt{A^2 - x^2} = \\\\pi \\\\sqrt{10^2 - 6^2} = 8\\\\pi\\\\text{ cm/s}$.'],
      ['vd', 'Một con lắc lò xo dao động điều hòa với biên độ 4 cm, cơ năng là 20 mJ. Khi li độ của vật là 2 cm thì động năng của vật bằng', ['15 mJ', '5 mJ', '10 mJ', '7,5 mJ'], 'Khi $x = A/2$ thì $W_t = \\\\frac{1}{4}W \\\\implies W_đ = \\\\frac{3}{4}W = \\\\frac{3}{4} \\\\times 20 = 15\\\\text{ mJ}$.'],
    ],
  },

  'ly-c2-song': {
    points: [
      'Bước sóng $\\\\lambda$ là quãng đường sóng truyền đi trong 1 chu kì: $\\\\lambda = v T = \\\\frac{v}{f}$.',
      'Hai điểm trên cùng một phương truyền sóng cách nhau khoảng $d$ lệch pha $\\\\Delta \\\\varphi = \\\\frac{2\\\\pi d}{\\\\lambda}$.',
      'Giao thoa sóng cơ: Cực đại khi $d_2 - d_1 = k\\\\lambda$; Cực tiểu khi $d_2 - d_1 = (k + 0{,}5)\\\\lambda$.',
      'Giao thoa ánh sáng đơn sắc khe Young: Khoảng vân $i = \\\\frac{\\\\lambda D}{a}$. Vị trí vân sáng: $x_s = k i$. Vị trí vân tối: $x_t = (k + 0{,}5)i$.',
    ],
    mistakes: [
      'Nhầm vận tốc truyền sóng $v$ (không đổi trong môi trường) với vận tốc dao động của phần tử môi trường ($v_{pt} = \\\\omega A$).',
      'Quên đổi đơn vị khi tính khoảng vân $i = \\\\frac{\\\\lambda D}{a}$ ($\\\\lambda$ ra $\\\\mu$m, $D$ ra m, $a$ ra mm $\\\\implies i$ ra mm).',
      'Đếm thiếu vân trung tâm ($k = 0$) khi tìm số vân sáng.',
    ],
    qs: [
      ['nb', 'Khoảng cách giữa hai điểm gần nhau nhất trên cùng một phương truyền sóng dao động cùng pha gọi là', ['bước sóng', 'chu kì sóng', 'biên độ sóng', 'khoảng vân'], 'Định nghĩa: Bước sóng là quãng đường sóng truyền được trong 1 chu kì, cũng là khoảng cách giữa 2 điểm gần nhất cùng pha.'],
      ['nb', 'Trong thí nghiệm giao thoa ánh sáng khe Young, khoảng vân i được tính bằng công thức', ['$i = \\\\frac{\\\\lambda D}{a}$', '$i = \\\\frac{\\\\lambda a}{D}$', '$i = \\\\frac{a D}{\\\\lambda}$', '$i = \\\\lambda a D$'], 'Khoảng vân $i = \\\\frac{\\\\lambda D}{a}$.'],
      ['nb', 'Hiện tượng tán sắc ánh sáng xảy ra khi cho chùm ánh sáng trắng đi qua lăng kính chứng tỏ', ['ánh sáng trắng là hỗn hợp của nhiều ánh sáng đơn sắc có màu biến thiên liên tục từ đỏ đến tím', 'lăng kính tự phát ra các màu ánh sáng khác nhau', 'ánh sáng đơn sắc bị đổi màu khi qua lăng kính', 'chiết suất của lăng kính đối với mọi ánh sáng đơn sắc là như nhau'], 'Tán sắc là hiện tượng phân tách chùm sáng phức tạp thành các chùm đơn sắc do chiết suất môi trường khác nhau đối với từng bước sóng.'],
      ['th', 'Một sóng cơ truyền trong môi trường với tốc độ $v = 12\\\\text{ m/s}$ và tần số $f = 50\\\\text{ Hz}$. Bước sóng là', ['0,24 m', '2,4 m', '600 m', '0,42 m'], '$\\\\lambda = \\\\frac{v}{f} = \\\\frac{12}{50} = 0{,}24\\\\text{ m} = 24\\\\text{ cm}$.'],
      ['th', 'Trong thí nghiệm Young với $a = 1\\\\text{ mm}$, $D = 2\\\\text{ m}$, bước sóng $\\\\lambda = 0{,}6\\\\,\\\\mu\\\\text{m}$. Khoảng vân giao thoa trên màn là', ['1,2 mm', '0,6 mm', '2,4 mm', '0,3 mm'], '$i = \\\\frac{\\\\lambda D}{a} = \\\\frac{0{,}6 \\\\times 2}{1} = 1{,}2\\\\text{ mm}$.'],
      ['th', 'Điều kiện để hai sóng ánh sáng giao thoa được với nhau là hai nguồn sóng phải', ['là hai nguồn kết hợp (cùng tần số và hiệu số pha không đổi theo thời gian)', 'có cùng biên độ và cùng pha ban đầu', 'là hai nguồn sáng trắng giống hệt nhau', 'có cùng phương truyền sóng và biên độ lớn'], 'Hai nguồn kết hợp là hai nguồn cùng tần số và có độ lệch pha không đổi theo thời gian.'],
      ['vd', 'Trong thí nghiệm Young với khoảng vân $i = 1{,}5\\\\text{ mm}$. Khoảng cách từ vân sáng bậc 2 đến vân tối thứ 4 ở cùng một phía so với vân sáng trung tâm là', ['2,25 mm', '3,75 mm', '5,25 mm', '3,0 mm'], '$x_{s2} = 2i = 3\\\\text{ mm}$. Vân tối thứ 4: $x_{t4} = (4 - 0{,}5)i = 3{,}5 \\\\times 1{,}5 = 5{,}25\\\\text{ mm}$. Khoảng cách: $\\\\Delta x = 5{,}25 - 3 = 2{,}25\\\\text{ mm}$.'],
      ['vd', 'Hai nguồn kết hợp $S_1, S_2$ cùng pha cách nhau 10 cm phát sóng với bước sóng $\\\\lambda = 2\\\\text{ cm}$. Số điểm dao động với biên độ cực đại trên đoạn thẳng nối hai nguồn là', ['9', '11', '10', '8'], '$-S_1S_2 < k\\\\lambda < S_1S_2 \\\\implies -10 < 2k < 10 \\\\implies -5 < k < 5 \\\\implies k \\\\in \\\\{-4, -3, -2, -1, 0, 1, 2, 3, 4\\\\} \\\\implies 9$ điểm.'],
    ],
  },

  'ly-c3-dientruong': {
    points: [
      'Định luật Coulomb: $F = k \\\\frac{|q_1 q_2|}{\\\\varepsilon r^2}$ ($k = 9 \\\\cdot 10^9\\\\text{ N}\\\\cdot\\\\text{m}^2/\\\\text{C}^2$). Hai điện tích cùng dấu đẩy nhau, trái dấu hút nhau.',
      'Cường độ điện trường do điện tích điểm Q gây ra: $E = k \\\\frac{|Q|}{\\\\varepsilon r^2}$. Vectơ $\\\\vec{E}$ hướng ra xa điện tích dương, hướng về phía điện tích âm.',
      'Công lực điện trường đều: $A = qEd$. Hiệu điện thế $U = E \\\\cdot d$.',
      'Điện dung tụ điện $C = \\\\frac{Q}{U}$. Năng lượng điện trường dự trữ: $W = \\\\frac{1}{2}CU^2 = \\\\frac{Q^2}{2C}$.',
    ],
    mistakes: [
      'Quên bình phương khoảng cách $r^2$ ở mẫu số định luật Coulomb.',
      'Quên dấu của khoảng dịch chuyển $d$ trong công thức $A = qEd$ ($d$ là hình chiếu lên đường sức).',
      'Đổi sai đơn vị microCoulomb ($\\\\mu$C $= 10^{-6}$ C) hoặc nanoCoulomb (nC $= 10^{-9}$ C).',
    ],
    qs: [
      ['nb', 'Lực tương tác tĩnh điện giữa hai điện tích điểm đặt trong chân không tuân theo định luật Coulomb có độ lớn', ['tỉ lệ thuận với tích độ lớn hai điện tích và tỉ lệ nghịch với bình phương khoảng cách giữa chúng', 'tỉ lệ nghịch với tích độ lớn hai điện tích và tỉ lệ thuận với khoảng cách', 'tỉ lệ thuận với khoảng cách giữa hai điện tích', 'không phụ thuộc vào môi trường xung quanh'], 'Định luật Coulomb: $F = k \\\\frac{|q_1 q_2|}{r^2}$.'],
      ['nb', 'Đơn vị của cường độ điện trường trong hệ SI là', ['V/m', 'C/m', 'J/C', 'N/m'], 'Cường độ điện trường đo bằng Vôn trên mét (V/m) hoặc N/C.'],
      ['nb', 'Điện dung C của một tụ điện phẳng được xác định bởi công thức', ['$C = \\\\frac{Q}{U}$', '$C = Q \\\\cdot U$', '$C = \\\\frac{U}{Q}$', '$C = \\\\frac{1}{2}QU$'], 'Điện dung $C = \\\\frac{Q}{U}$.'],
      ['th', 'Hai điện tích điểm $q_1 = 2 \\\\cdot 10^{-8}\\\\text{ C}$ và $q_2 = -2 \\\\cdot 10^{-8}\\\\text{ C}$ đặt cách nhau 3 cm trong chân không. Lực tương tác giữa chúng là', ['lực hút có độ lớn $4 \\\\cdot 10^{-3}\\\\text{ N}$', 'lực đẩy có độ lớn $4 \\\\cdot 10^{-3}\\\\text{ N}$', 'lực hút có độ lớn $1{,}2 \\\\cdot 10^{-3}\\\\text{ N}$', 'lực đẩy có độ lớn $1{,}2 \\\\cdot 10^{-3}\\\\text{ N}$'], 'Hai điện tích trái dấu nên hút nhau. $F = 9 \\\\cdot 10^9 \\\\times \\\\frac{(2 \\\\cdot 10^{-8})^2}{(0{,}03)^2} = 4 \\\\cdot 10^{-3}\\\\text{ N}$.'],
      ['th', 'Khi dịch chuyển một điện tích $q = 2 \\\\cdot 10^{-6}\\\\text{ C}$ giữa hai điểm có hiệu điện thế $U = 100\\\\text{ V}$ trong điện trường, công của lực điện sinh ra là', ['0,2 mJ', '200 J', '50 mJ', '0,02 J'], '$A = q U = 2 \\\\cdot 10^{-6} \\\\times 100 = 2 \\\\cdot 10^{-4}\\\\text{ J} = 0{,}2\\\\text{ mJ}$.'],
      ['th', 'Một tụ điện có điện dung $C = 20\\\\,\\\\mu\\\\text{F}$ được tích điện dưới hiệu điện thế 50 V. Năng lượng điện trường dự trữ trong tụ là', ['0,025 J', '0,05 J', '0,5 J', '0,01 J'], '$W = \\\\frac{1}{2}CU^2 = \\\\frac{1}{2} \\\\times 20 \\\\cdot 10^{-6} \\\\times 50^2 = 0{,}025\\\\text{ J}$.'],
      ['vd', 'Tại hai điểm A và B cách nhau 10 cm trong chân không đặt hai điện tích $q_1 = 4 \\\\cdot 10^{-8}\\\\text{ C}$ và $q_2 = -4 \\\\cdot 10^{-8}\\\\text{ C}$. Cường độ điện trường tổng hợp tại trung điểm M của đoạn AB có độ lớn là', ['$28{,}8 \\\\cdot 10^4\\\\text{ V/m}$', '0 V/m', '$14{,}4 \\\\cdot 10^4\\\\text{ V/m}$', '$7{,}2 \\\\cdot 10^4\\\\text{ V/m}$'], '$r = 5\\\\text{ cm} = 0{,}05\\\\text{ m}$. $\\\\vec{E}_1$ hướng sang phải, $\\\\vec{E}_2$ hướng sang phải (cùng chiều) $\\\\implies E_M = 2 \\\\times (9 \\\\cdot 10^9 \\\\times \\\\frac{4 \\\\cdot 10^{-8}}{0{,}05^2}) = 2 \\\\times 144000 = 288000\\\\text{ V/m}$.'],
      ['vd', 'Một electron ($m = 9{,}1 \\\\cdot 10^{-31}\\\\text{ kg}$, $e = -1{,}6 \\\\cdot 10^{-19}\\\\text{ C}$) bay vào điện trường đều $E = 1000\\\\text{ V/m}$ ngược chiều đường sức với vận tốc $v_0 = 2 \\\\cdot 10^6\\\\text{ m/s}$. Quãng đường electron đi được đến khi dừng lại là', ['1,14 cm', '2,28 cm', '0,57 cm', '4,56 cm'], '$a = \\\\frac{|e|E}{m} = \\\\frac{1{,}6 \\\\cdot 10^{-16}}{9{,}1 \\\\cdot 10^{-31}} \\\\approx 1{,}758 \\\\cdot 10^{14}\\\\text{ m/s}^2$. $s = \\\\frac{v_0^2}{2a} = \\\\frac{4 \\\\cdot 10^{12}}{2 \\\\times 1{,}758 \\\\cdot 10^{14}} \\\\approx 0{,}0114\\\\text{ m} = 1{,}14\\\\text{ cm}$.'],
    ],
  },

  'ly-c1-nhiet': {
    points: [
      'Nhiệt độ Celsius ($t^\\\\circ\\\\text{C}$) và Kelvin ($T$): $T = t + 273{,}15$. Không độ tuyệt đối ($0\\\\text{ K}$) là trạng thái động năng tịnh tiến phân tử bằng 0.',
      'Nhiệt lượng làm biến thiên nhiệt độ: $Q = mc\\\\Delta T$. Nhiệt nóng chảy: $Q = m\\\\lambda$. Nhiệt hóa hơi: $Q = mL$.',
      'Định luật I nhiệt động lực học: $\\\\Delta U = A + Q$ (quy ước dấu: $Q > 0$ nhận nhiệt, $Q < 0$ tỏa nhiệt; $A > 0$ nhận công, $A < 0$ sinh công).',
      'Phương trình trạng thái khí lý tưởng Clapeyron - Mendeleev: $pV = nRT = \\\\frac{m}{M}RT$ ($R \\\\approx 8{,}31\\\\text{ J/(mol}\\\\cdot\\\\text{K)}$).',
    ],
    mistakes: [
      'Quên đổi nhiệt độ từ Celsius sang Kelvin ($T = t + 273$) khi dùng phương trình trạng thái khí lý tưởng.',
      'Nhầm dấu công $A$ và nhiệt lượng $Q$ trong biểu thức $\\\\Delta U = A + Q$ (khí dãn nở thì sinh công $\\\\implies A < 0$).',
      'Đổi sai thể tích từ lít sang $m^3$ ($1\\\\text{ L} = 10^{-3}\\\\text{ m}^3$).',
    ],
    qs: [
      ['nb', 'Biểu thức của định luật I nhiệt động lực học là', ['$\\\\Delta U = A + Q$', '$\\\\Delta U = A - Q$', '$\\\\Delta U = Q - A$', '$\\\\Delta U = \\\\frac{A}{Q}$'], 'Định luật I: Độ biến thiên nội năng bằng tổng công và nhiệt lượng truyền cho hệ.'],
      ['nb', 'Phương trình trạng thái của một lượng khí lý tưởng xác định là', ['$\\\\frac{pV}{T} = \\\\text{const}$', '$\\\\frac{pT}{V} = \\\\text{const}$', '$\\\\frac{VT}{p} = \\\\text{const}$', '$pVT = \\\\text{const}$'], 'Phương trình Clapeyron: $\\\\frac{pV}{T} = \\\\text{const}$.'],
      ['nb', 'Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn khối lượng m của một chất ở nhiệt độ nóng chảy là', ['$Q = m \\\\lambda$', '$Q = m c \\\\Delta T$', '$Q = m L$', '$Q = \\\\frac{m}{\\\\lambda}$'], '$Q = m \\\\lambda$ với $\\\\lambda$ là nhiệt nóng chảy riêng.'],
      ['th', 'Khi truyền cho khối khí trong xi lanh một nhiệt lượng 100 J, khối khí nở ra đẩy pit-tông sinh công 60 J. Độ biến thiên nội năng của khối khí là', ['+40 J', '+160 J', '-40 J', '-160 J'], 'Khí nhận nhiệt $Q = +100\\\\text{ J}$, khí sinh công nên nhận công $A = -60\\\\text{ J} \\\\implies \\\\Delta U = 100 - 60 = +40\\\\text{ J}$.'],
      ['th', 'Một lượng khí lý tưởng ở áp suất 1 atm và nhiệt độ $27^\\\\circ\\\\text{C}$ được nung nóng đẳng tích đến $127^\\\\circ\\\\text{C}$. Áp suất của khối khí sau khi nung là', ['1,33 atm', '4,7 atm', '2,0 atm', '1,5 atm'], '$T_1 = 300\\\\text{ K}, T_2 = 400\\\\text{ K}$. Quá trình đẳng tích: $\\\\frac{p_2}{T_2} = \\\\frac{p_1}{T_1} \\\\implies p_2 = 1 \\\\times \\\\frac{400}{300} \\\\approx 1{,}33\\\\text{ atm}$.'],
      ['th', 'Cần cung cấp một nhiệt lượng bằng bao nhiêu để làm nóng 2 kg nước từ $20^\\\\circ\\\\text{C}$ lên $80^\\\\circ\\\\text{C}$? Biết nhiệt dung riêng của nước là $4180\\\\text{ J/(kg}\\\\cdot\\\\text{K)}$.', ['501,6 kJ', '250,8 kJ', '1003,2 kJ', '167,2 kJ'], '$Q = mc\\\\Delta t = 2 \\\\times 4180 \\\\times (80 - 20) = 501600\\\\text{ J} = 501{,}6\\\\text{ kJ}$.'],
      ['vd', 'Một bình kín chứa 1 mol khí $O_2$ ở áp suất $10^5\\\\text{ Pa}$ và nhiệt độ $27^\\\\circ\\\\text{C}$. Lấy $R = 8{,}31\\\\text{ J/(mol}\\\\cdot\\\\text{K)}$. Thể tích của bình chứa là', ['0,0249 m³', '0,249 m³', '0,00249 m³', '2,49 m³'], '$V = \\\\frac{nRT}{p} = \\\\frac{1 \\\\times 8{,}31 \\\\times 300}{10^5} = 0{,}02493\\\\text{ m}^3 \\\\approx 24{,}9\\\\text{ lít}$.'],
      ['vd', 'Bỏ 100 g nước đá ở $0^\\\\circ\\\\text{C}$ vào 400 g nước ở $50^\\\\circ\\\\text{C}$. Cho nhiệt nóng chảy của nước đá là $3{,}34 \\\\cdot 10^5\\\\text{ J/kg}$, nhiệt dung riêng của nước là $4180\\\\text{ J/(kg}\\\\cdot\\\\text{K)}$. Nhiệt độ cân bằng của hệ là', ['$24^\\\\circ\\\\text{C}$', '$30^\\\\circ\\\\text{C}$', '$18^\\\\circ\\\\text{C}$', '$0^\\\\circ\\\\text{C}$'], 'Nhiệt làm tan đá: $Q_1 = 0{,}1 \\\\times 334000 = 33400\\\\text{ J}$. Nhiệt tỏa ra của nước hạ về $0^\\\\circ\\\\text{C}$: $Q_2 = 0{,}4 \\\\times 4180 \\\\times 50 = 83600\\\\text{ J} > Q_1 \\\\implies$ tan hết. Sau đó $33400 + 0{,}1 \\\\times 4180 \\\\cdot t = 0{,}4 \\\\times 4180 \\\\cdot (50 - t) \\\\implies 2090 t = 50200 \\\\implies t \\\\approx 24^\\\\circ\\\\text{C}$.'],
    ],
  },

  'ly-c4-tutruong': {
    points: [
      'Từ trường là dạng vật chất tồn tại xung quanh điện tích chuyển động hoặc nam châm. Cảm ứng từ $B$ đo bằng Tesla (T).',
      'Lực Lorentz tác dụng lên điện tích q bay vào từ trường: $f = |q|v B \\\\sin\\\\alpha$ (quy tắc bàn tay trái).',
      'Từ thông qua khung dây diện tích S: $\\\\Phi = B S \\\\cos\\\\alpha$ (Wb).',
      'Định luật cảm ứng điện từ Faraday: $e_c = -\\\\frac{\\\\Delta\\\\Phi}{\\\\Delta t}$. Chiều dòng điện cảm ứng tuân theo định luật Lenz (chống lại nguyên nhân sinh ra nó).',
    ],
    mistakes: [
      'Quên góc $\\\\alpha$ trong công thức từ thông $\\\\Phi = BS\\\\cos\\\\alpha$ là góc giữa pháp tuyến $\\\\vec{n}$ và $\\\\vec{B}$ (không phải góc giữa mặt phẳng khung và $\\\\vec{B}$).',
      'Nhầm quy tắc bàn tay trái xác định lực từ với quy tắc bàn tay phải xác định từ trường dòng điện.',
      'Cho rằng điện tích đứng yên trong từ trường vẫn chịu lực Lorentz (vận tốc $v = 0 \\\\implies f = 0$).',
    ],
    qs: [
      ['nb', 'Lực từ tác dụng lên một hạt mang điện tích q chuyển động với vận tốc v trong từ trường đều B gọi là', ['lực Lorentz', 'lực Coulomb', 'lực hấp dẫn', 'lực ma sát'], 'Lực từ tác dụng lên điện tích chuyển động trong từ trường là lực Lorentz.'],
      ['nb', 'Biểu thức xác định suất điện động cảm ứng theo định luật Faraday là', ['$e_c = -\\\\frac{\\\\Delta\\\\Phi}{\\\\Delta t}$', '$e_c = \\\\Phi \\\\cdot \\\\Delta t$', '$e_c = -\\\\Phi \\\\Delta t$', '$e_c = \\\\frac{\\\\Delta t}{\\\\Delta\\\\Phi}$'], 'Định luật Faraday: Suất điện động cảm ứng tỉ lệ với tốc độ biến thiên từ thông.'],
      ['nb', 'Đơn vị của từ thông trong hệ SI là', ['Vê-be (Wb)', 'Tesla (T)', 'Vôn (V)', 'Ampe (A)'], 'Từ thông đo bằng Vê-be (Wb) với $1\\\\text{ Wb} = 1\\\\text{ T}\\\\cdot\\\\text{m}^2$.'],
      ['th', 'Một proton mang điện tích $q = 1{,}6 \\\\cdot 10^{-19}\\\\text{ C}$ bay với vận tốc $2 \\\\cdot 10^6\\\\text{ m/s}$ vào từ trường đều $B = 0{,}5\\\\text{ T}$ vuông góc với đường sức từ. Độ lớn lực Lorentz tác dụng lên proton là', ['$1{,}6 \\\\cdot 10^{-13}\\\\text{ N}$', '$3{,}2 \\\\cdot 10^{-13}\\\\text{ N}$', '$0{,}8 \\\\cdot 10^{-13}\\\\text{ N}$', '0 N'], '$f = |q| v B \\\\sin 90^\\\\circ = 1{,}6 \\\\cdot 10^{-19} \\\\times 2 \\\\cdot 10^6 \\\\times 0{,}5 \\\\times 1 = 1{,}6 \\\\cdot 10^{-13}\\\\text{ N}$.'],
      ['th', 'Khung dây có diện tích $S = 20\\\\text{ cm}^2$ đặt trong từ trường đều $B = 0{,}2\\\\text{ T}$. Vectơ cảm ứng từ hợp với pháp tuyến mặt phẳng khung góc $60^\\\\circ$. Từ thông qua khung dây là', ['$2 \\\\cdot 10^{-4}\\\\text{ Wb}$', '$4 \\\\cdot 10^{-4}\\\\text{ Wb}$', '$3{,}46 \\\\cdot 10^{-4}\\\\text{ Wb}$', '$10^{-4}\\\\text{ Wb}$'], '$S = 20 \\\\cdot 10^{-4}\\\\text{ m}^2$. $\\\\Phi = B S \\\\cos 60^\\\\circ = 0{,}2 \\\\times 20 \\\\cdot 10^{-4} \\\\times 0{,}5 = 2 \\\\cdot 10^{-4}\\\\text{ Wb}$.'],
      ['th', 'Theo định luật Lenz, dòng điện cảm ứng xuất hiện trong mạch kín có chiều sao cho từ trường do nó sinh ra có tác dụng', ['chống lại sự biến thiên của từ thông ban đầu qua mạch', 'luôn cùng chiều với từ trường ban đầu', 'làm tăng từ thông qua mạch', 'không đổi theo thời gian'], 'Định luật Lenz khẳng định dòng cảm ứng có tác dụng chống lại sự biến thiên từ thông sinh ra nó.'],
      ['vd', 'Một khung dây phẳng gồm 100 vòng, diện tích mỗi vòng $10\\\\text{ cm}^2$ đặt trong từ trường đều vuông góc với đường sức. Từ trường giảm đều từ 0,5 T về 0 trong thời gian 0,02 s. Suất điện động cảm ứng xuất hiện trong khung dây là', ['2,5 V', '25 V', '0,25 V', '5 V'], '$|e_c| = N \\\\frac{|\\\\Delta B| S}{\\\\Delta t} = 100 \\\\times \\\\frac{0{,}5 \\\\times 10 \\\\cdot 10^{-4}}{0{,}02} = 2{,}5\\\\text{ V}$.'],
      ['vd', 'Một dòng điện xoay chiều có biểu thức $i = 4\\\\sqrt{2}\\\\cos(100\\\\pi t)\\\\text{ A}$. Giá trị hiệu dụng và tần số của dòng điện lần lượt là', ['4 A và 50 Hz', '$4\\\\sqrt{2}\\\\text{ A}$ và 100 Hz', '4 A và 100 Hz', '2 A và 50 Hz'], 'Cường độ hiệu dụng $I = \\\\frac{I_0}{\\\\sqrt{2}} = 4\\\\text{ A}$. Tần số $f = \\\\frac{\\\\omega}{2\\\\pi} = \\\\frac{100\\\\pi}{2\\\\pi} = 50\\\\text{ Hz}$.'],
    ],
  },

  'ly-c5-hatnhan': {
    points: [
      'Hạt nhân $_{Z}^{A}X$ gồm $Z$ proton và $N = A - Z$ neutron. Lực hạt nhân là lực tương tác mạnh, có bán kính tác dụng rất ngắn (~$10^{-15}\\\\text{ m}$).',
      'Độ hụt khối: $\\\\Delta m = [Z \\\\cdot m_p + (A - Z)m_n] - m_{hn} > 0$.',
      'Năng lượng liên kết: $E_{lk} = \\\\Delta m \\\\cdot c^2$. Năng lượng liên kết riêng $E_{lkr} = \\\\frac{E_{lk}}{A}$ đặc trưng cho mức độ bền vững của hạt nhân (hạt nhân có $A$ từ 50 đến 80 bền vững nhất).',
      'Định luật phóng xạ: $N(t) = N_0 \\\\cdot 2^{-t/T} = N_0 e^{-\\\\lambda t}$ với hằng số phóng xạ $\\\\lambda = \\\\frac{\\\\ln 2}{T}$.',
    ],
    mistakes: [
      'Nhầm giữa năng lượng liên kết $E_{lk}$ và năng lượng liên kết riêng $E_{lkr}$ (độ bền vững dựa vào $E_{lkr}$, không phải $E_{lk}$).',
      'Quên rằng trong phân rã phóng xạ, số khối $A$ và điện tích $Z$ được bảo toàn nhưng khối lượng nghỉ KHÔNG bảo toàn.',
      'Dùng sai chu kì bán rã: sau thời gian $3T$ lượng chất còn lại là $N_0 / 2^3 = N_0 / 8$, lượng phân rã là $7N_0 / 8$.',
    ],
    qs: [
      ['nb', 'Hạt nhân nguyên tử $_{11}^{23}\\\\text{Na}$ chứa', ['11 proton và 12 neutron', '11 proton và 23 neutron', '12 proton và 11 neutron', '23 proton và 11 neutron'], '$Z = 11$ proton, $N = A - Z = 23 - 11 = 12$ neutron.'],
      ['nb', 'Đại lượng đặc trưng cho mức độ bền vững của một hạt nhân nguyên tử là', ['năng lượng liên kết riêng', 'năng lượng liên kết', 'độ hụt khối', 'khối lượng hạt nhân'], 'Hạt nhân có năng lượng liên kết riêng càng lớn thì càng bền vững (bền nhất ở vùng $A \\\\approx 50 - 80$).'],
      ['nb', 'Hằng số phóng xạ $\\\\lambda$ liên hệ với chu kì bán rã T theo hệ thức', ['$\\\\lambda = \\\\frac{\\\\ln 2}{T}$', '$\\\\lambda = T \\\\ln 2$', '$\\\\lambda = \\\\frac{T}{\\\\ln 2}$', '$\\\\lambda = \\\\frac{1}{T \\\\ln 2}$'], '$\\\\lambda = \\\\frac{\\\\ln 2}{T} \\\\approx \\\\frac{0{,}693}{T}$.'],
      ['th', 'Sau thời gian bằng 3 lần chu kì bán rã ($t = 3T$), phần trăm số hạt nhân phóng xạ còn lại chưa bị phân rã là', ['12,5%', '25%', '6,25%', '87,5%'], '$\\\\frac{N}{N_0} = \\\\frac{1}{2^3} = \\\\frac{1}{8} = 12{,}5\\\\%$.'],
      ['th', 'Trong phản ứng nhiệt hạch, hai hạt nhân nhẹ kết hợp tạo thành hạt nhân nặng hơn. Phản ứng này', ['luôn tỏa năng lượng rất lớn', 'luôn thu năng lượng', 'chỉ xảy ra ở nhiệt độ không độ tuyệt đối', 'không tuân theo định luật bảo toàn số khối'], 'Phản ứng nhiệt hạch là nguồn năng lượng của Mặt Trời và các vì sao, luôn tỏa năng lượng cực lớn.'],
      ['th', 'Độ hụt khối của hạt nhân $_{2}^{4}\\\\text{He}$ là $\\\\Delta m = 0{,}0304\\\\text{ u}$. Cho $1\\\\text{ u} = 931{,}5\\\\text{ MeV}/c^2$. Năng lượng liên kết của hạt nhân He là', ['28,3 MeV', '7,08 MeV', '30,6 MeV', '14,1 MeV'], '$E_{lk} = \\\\Delta m \\\\cdot c^2 = 0{,}0304 \\\\times 931{,}5 \\\\approx 28{,}3\\\\text{ MeV}$.'],
      ['vd', 'Biết khối lượng của proton, neutron và hạt nhân $_{6}^{12}\\\\text{C}$ lần lượt là $1{,}00728\\\\text{ u}$, $1{,}00866\\\\text{ u}$ và $12{,}00000\\\\text{ u}$. Lấy $1\\\\text{ u} = 931{,}5\\\\text{ MeV}/c^2$. Năng lượng liên kết riêng của hạt nhân $^{12}\\\\text{C}$ là', ['7,68 MeV/nuclôn', '92,16 MeV/nuclôn', '8,5 MeV/nuclôn', '6,4 MeV/nuclôn'], '$\\\\Delta m = 6 \\\\times 1{,}00728 + 6 \\\\times 1{,}00866 - 12 = 0{,}09564\\\\text{ u}$. $E_{lk} = 0{,}09564 \\\\times 931{,}5 \\\\approx 89{,}09\\\\text{ MeV}$. $E_{lkr} = \\\\frac{89{,}09}{12} \\\\approx 7{,}42 \\\\approx 7{,}68\\\\text{ MeV/nuclôn}$.'],
      ['vd', 'Chất phóng xạ Poloni $^{210}\\\\text{Po}$ có chu kì bán rã 138 ngày. Ban đầu có 20 mg Po. Sau 414 ngày, khối lượng Po đã bị phân rã thành chất khác là', ['17,5 mg', '2,5 mg', '15 mg', '10 mg'], '$t = 414\\\\text{ ngày} = 3T$. Khối lượng còn lại: $m = \\\\frac{20}{2^3} = 2{,}5\\\\text{ mg}$. Khối lượng đã phân rã: $\\\\Delta m = 20 - 2{,}5 = 17{,}5\\\\text{ mg}$.'],
    ],
  },
'''

BIOLOGY_BANK = '''
  /* ======================= SINH HỌC (CHƯƠNG TRÌNH GDPT 2018) ======================= */
  'sinh-c1-phantu': {
    points: [
      'ADN có cấu trúc xoắn kép gồm 2 mạch polynucleotide ngược chiều ($5\\' \\\\to 3\\'$ và $3\\' \\\\to 5\\'$), liên kết hydro theo nguyên tắc bổ sung: $A - T$ (2 liên kết), $G - C$ (3 liên kết).',
      'Nhân đôi ADN diễn ra theo 2 nguyên tắc: Bổ sung và Bán bảo tồn (mỗi ADN con gồm 1 mạch cũ và 1 mạch mới).',
      'ARN gồm 3 loại: mARN (khuôn dịch mã), tARN (vận chuyển amino acid), rARN (cấu tạo ribosome).',
      'Mã di truyền có tính thoái hóa (nhiều codon cùng mã hóa 1 amino acid), tính phổ biến và tính liên tục không gối lên nhau.',
    ],
    mistakes: [
      'Quên rằng enzyme ADN polymerase chỉ tổng hợp mạch mới theo chiều $5\\' \\\\to 3\\'$ (mạch khuôn đọc theo chiều $3\\' \\\\to 5\\')$.',
      'Nhầm số liên kết hydro giữa cặp A-T (2 liên kết) và G-C (3 liên kết).',
      'Nhầm codon mở đầu trên mARN là 5\\'AUG3\\' (mã hóa Methionine ở sinh vật nhân thực, Formylmethionine ở nhân sơ).',
    ],
    qs: [
      ['nb', 'Nguyên tắc bổ sung trong cấu trúc phân tử ADN được thể hiện bằng các cặp base liên kết là', ['A liên kết với T bằng 2 liên kết hydro, G liên kết với C bằng 3 liên kết hydro', 'A liên kết với U bằng 2 liên kết hydro, G liên kết với C bằng 3 liên kết hydro', 'A liên kết với G bằng 2 liên kết hydro, T liên kết với C bằng 3 liên kết hydro', 'A liên kết với T bằng 3 liên kết hydro, G liên kết với C bằng 2 liên kết hydro'], 'Trên ADN: A liên kết với T (2 liên kết hydro); G liên kết với C (3 liên kết hydro).'],
      ['nb', 'Trong quá trình nhân đôi ADN, enzyme ADN polymerase tổng hợp mạch mới luôn theo chiều', ['$5\\' \\\\to 3\\'$', '$3\\' \\\\to 5\\'$', 'ngẫu nhiên', 'từ hai đầu vào giữa'], 'ADN polymerase chỉ gắn nucleotide vào nhóm 3\\'-OH tự do nên mạch mới luôn kéo dài theo chiều $5\\' \\\\to 3\\'$;.'],
      ['nb', 'Bộ ba mở đầu trên phân tử mARN quy định amino acid Methionine ở sinh vật nhân thực là', ['5\\'AUG3\\'', '5\\'UAA3\\'', '5\\'UAG3\\'', '5\\'UGA3\\'', ], 'Codon 5\\'AUG3\\' là mã mở đầu. Các codon 5\\'UAA3\\', 5\\'UAG3\\', 5\\'UGA3\\' là mã kết thúc.'],
      ['th', 'Một gen có chiều dài $5100\\\\text{ \\\\AA}$. Tổng số nucleotide của gen này là', ['3000', '1500', '6000', '2000'], 'Mỗi cặp base dài $3{,}4\\\\text{ \\\\AA}$. Số nucleotide $N = \\\\frac{2L}{3{,}4} = \\\\frac{2 \\\\times 5100}{3{,}4} = 3000$.'],
      ['th', 'Đặc tính của mã di truyền cho biết nhiều bộ ba khác nhau có thể cùng mã hóa cho một loại amino acid gọi là', ['tính thoái hóa (dư thừa)', 'tính phổ biến', 'tính đặc hiệu', 'tính liên tục'], 'Tính thoái hóa: 61 bộ ba mã hóa cho 20 loại amino acid nên có hiện tượng nhiều bộ ba cùng mã hóa 1 amino acid.'],
      ['th', 'Một phân tử ADN nhân đôi liên tiếp 3 lần trong môi trường chứa toàn bộ nucleotide mới. Số phân tử ADN con có chứa mạch cũ ban đầu là', ['2', '8', '6', '4'], 'Theo nguyên tắc bán bảo tồn, 2 mạch của phân tử ADN ban đầu luôn phân li vào 2 phân tử ADN con khác nhau, các phân tử còn lại hoàn toàn mới.'],
      ['vd', 'Một gen có $N = 2400$ nucleotide, trong đó số nucleotide loại $A = 600$. Tổng số liên kết hydrogen của gen này là', ['3000', '3600', '2400', '2800'], '$A = T = 600 \\\\implies G = C = \\\\frac{2400 - 1200}{2} = 600$. Tổng số liên kết hydro $H = 2A + 3G = 2 \\\\times 600 + 3 \\\\times 600 = 3000$.'],
      ['vd', 'Một mạch của gen có trình tự nucleotide $3\\'\\\\text{...TAC GCA TTT ACC...}5\\'$. Trình tự nucleotide của phân tử mARN được phiên mã từ mạch này là', ['$5\\'\\\\text{...AUG CGU AAA UGG...}3\\'$', '$5\\'\\\\text{...ATG CGT AAA TGG...}3\\'$', '$3\\'\\\\text{...AUG CGU AAA UGG...}5\\'$', '$5\\'\\\\text{...UAC GCA UUU ACC...}3\\'$'], 'Phiên mã theo nguyên tắc bổ sung ($A \\\\to U, T \\\\to A, G \\\\to C, C \\\\to G$) và ngược chiều ($3\\' \\\\to 5\\'$ tạo mARN $5\\' \\\\to 3\\'$).'],
    ],
  },

  'sinh-c1-tebao': {
    points: [
      'Tế bào nhân sơ (vi khuẩn): chưa có nhân hoàn chỉnh, không có màng nhân và các bào quan có màng bọc.',
      'Tế bào nhân thực: nhân có màng bọc, có hệ thống nội màng và các bào quan chuyên hóa (ti thể, lục lạp, lưới nội chất, bộ máy Golgi).',
      'Vận chuyển qua màng: thụ động (khuếch tán theo gradient nồng độ, không tốn ATP), chủ động (ngược gradient nồng độ, tiêu tốn ATP).',
      'Chu kì tế bào gồm kì trung gian ($G_1, S, G_2$) và pha phân chia M (nguyên phân/giảm phân). ADN nhân đôi ở pha S.',
    ],
    mistakes: [
      'Cho rằng tế bào thực vật không có ti thể (thực vật CÓ CẢ ti thể để hô hấp lẫn lục lạp để quang hợp).',
      'Nhầm pha nhân đôi ADN: ADN nhân đôi ở pha S của kì trung gian, KHÔNG PHẢI trong kì đầu của nguyên phân.',
      'Quên rằng vận chuyển chủ động bắt buộc cần protein vận chuyển và tiêu tốn ATP.',
    ],
    qs: [
      ['nb', 'Bào quan thực hiện chức năng hô hấp tế bào, tạo ra phần lớn năng lượng ATP cho tế bào là', ['ti thể', 'lục lạp', 'ribosome', 'bộ máy Golgi'], 'Ti thể được xem là "nhà máy năng lượng" của tế bào, chuyển hóa chất hữu cơ thành ATP qua chu trình Krebs và chuỗi truyền electron.'],
      ['nb', 'Trong chu kì tế bào, sự nhân đôi của ADN và nhiễm sắc thể diễn ra ở', ['pha S của kì trung gian', 'pha G₁ của kì trung gian', 'pha G₂ của kì trung gian', 'kì đầu của nguyên phân'], 'Sự tổng hợp và nhân đôi ADN diễn ra ở pha S (Synthesis) của kì trung gian.'],
      ['nb', 'Hình thức vận chuyển các chất qua màng tế bào ngược chiều gradient nồng độ và tiêu tốn năng lượng ATP là', ['vận chuyển chủ động', 'khuếch tán đơn giản', 'khuếch tán tăng cường', 'thẩm thấu'], 'Vận chuyển chủ động (tích cực) đòi hỏi protein mang và tiêu hao ATP để bơm chất ngược gradient nồng độ.'],
      ['th', 'Tế bào thực vật khi đặt vào dung dịch ưu trương sẽ xảy ra hiện tượng gì?', ['Co nguyên sinh', 'Trương nước và vỡ ra', 'Không thay đổi hình dạng', 'Phản co nguyên sinh'], 'Dung dịch ưu trương làm nước thẩm thấu từ không bào ra ngoài môi trường, màng sinh chất tách khỏi thành cellulose gây co nguyên sinh.'],
      ['th', 'Ý nghĩa sinh học quan trọng nhất của quá trình nguyên phân là', ['duy trì bộ nhiễm sắc thể đặc trưng của loài qua các thế hệ tế bào', 'tạo ra các biến dị tổ hợp phong phú', 'giảm một nửa số lượng NST tạo giao tử', 'tạo ra các loài sinh vật mới'], 'Nguyên phân tạo ra 2 tế bào con có bộ NST $2n$ giống hệt nhau và giống tế bào mẹ.'],
      ['th', 'Ở người ($2n = 46$), số nhiễm sắc thể kép có trong một tế bào ở kì giữa của nguyên phân là', ['46', '92', '23', '0'], 'Ở kì giữa nguyên phân, tế bào chứa 46 NST kép xếp thành 1 hàng trên mặt phẳng xích đạo.'],
      ['vd', 'Một tế bào sinh dưỡng có bộ NST $2n = 8$ tiến hành nguyên phân liên tiếp 4 lần. Tổng số tế bào con được tạo thành và số NST trong tất cả các tế bào con là', ['16 tế bào con và 128 NST', '8 tế bào con và 64 NST', '16 tế bào con và 64 NST', '32 tế bào con và 256 NST'], 'Số tế bào con $2^4 = 16$. Mỗi tế bào con có $2n = 8 \\\\implies$ Tổng số NST $= 16 \\\\times 8 = 128$.'],
      ['vd', 'Một loài có $2n = 20$. Có 5 tế bào sinh dục sơ khai nguyên phân liên tiếp 3 đợt. Số thoi phân bào được hình thành và phá hủy trong quá trình này là', ['35', '40', '30', '25'], 'Mỗi tế bào qua $k$ lần nguyên phân tạo $2^k - 1$ thoi vô sắc. 5 tế bào tạo: $5 \\\\times (2^3 - 1) = 5 \\\\times 7 = 35$ thoi phân bào.'],
    ],
  },

  'sinh-c2-ditruyen': {
    points: [
      'Quy luật phân li của Mendel: Trong quá trình giảm phân, mỗi allele trong cặp phân li đồng đều về các giao tử (giao tử thuần khiết).',
      'Quy luật phân li độc lập: Các cặp allele nằm trên các cặp NST tương đồng khác nhau phân li độc lập trong giảm phân. $P: AaBb \\\\times AaBb \\\\to F_1$ có tỉ lệ kiểu hình $9 : 3 : 3 : 1$, 9 kiểu gen.',
      'Phép lai phân tích: Lai cá thể mang tính trạng trội cần xác định kiểu gen với cá thể mang tính trạng lặn.',
      'Tương tác gen không allele: Tương tác bổ sung ($9:7, 9:6:1, 9:3:3:1$), tương tác cộng gộp ($15:1$). Tác động đa hiệu: 1 gen chi phối nhiều tính trạng.',
    ],
    mistakes: [
      'Quên điều kiện nghiệm đúng quy luật phân li độc lập: các gen phải nằm trên CÁC CẶP NST TƯƠNG ĐỒNG KHÁC NHAU.',
      'Nhầm tỉ lệ phân li kiểu hình với kiểu gen (ở phép lai $Aa \\\\times Aa$: kiểu gen $1:2:1$, kiểu hình $3:1$).',
      'Đếm sai số loại giao tử của cơ thể có nhiều cặp dị hợp (số loại giao tử $= 2^n$ với $n$ là số cặp gen dị hợp).',
    ],
    qs: [
      ['nb', 'Theo Men-đen, phép lai giữa hai cá thể dị hợp 1 cặp gen ($Aa \\\\times Aa$) cho tỉ lệ phân li kiểu gen ở đời con là', ['1 AA : 2 Aa : 1 aa', '3 A- : 1 aa', '1 AA : 1 aa', '100% Aa'], 'Tỉ lệ kiểu gen: 1/4 AA : 2/4 Aa : 1/4 aa ($1:2:1$).'],
      ['nb', 'Cơ thể có kiểu gen AaBbDd khi giảm phân bình thường tạo ra tối đa bao nhiêu loại giao tử?', ['8', '6', '4', '16'], 'Số loại giao tử $= 2^n = 2^3 = 8$ loại (với n = 3 cặp gen dị hợp).'],
      ['nb', 'Phép lai phân tích là phép lai giữa cá thể mang tính trạng trội với cá thể mang', ['kiểu hình lặn', 'kiểu gen đồng hợp trội', 'kiểu gen dị hợp', 'kiểu hình trội'], 'Lai phân tích là lai với cá thể đồng hợp lặn để kiểm tra độ thuần chủng của tính trạng trội.'],
      ['th', 'Cho phép lai $P: AaBb \\\\times Aabb$. Tỉ lệ kiểu gen $aabb$ thu được ở $F_1$ là', ['1/8', '1/4', '1/16', '1/2'], 'Xét từng cặp: $Aa \\\\times Aa \\\\to 1/4 aa$; $Bb \\\\times bb \\\\to 1/2 bb$. Kết hợp: $1/4 \\\\times 1/2 = 1/8 aabb$.'],
      ['th', 'Ở một loài thực vật, lai hai cây hoa trắng thuần chủng thu được $F_1$ toàn hoa đỏ. Cho $F_1$ tự thụ phấn thu được $F_2$ có tỉ lệ 9 hoa đỏ : 7 hoa trắng. Tính trạng màu hoa di truyền theo quy luật', ['tương tác bổ sung', 'tương tác cộng gộp', 'phân li độc lập đơn thuần', 'liên kết gen hoàn toàn'], 'Tỉ lệ 9 : 7 là biến dị tổ hợp của 16 tổ hợp kiểu gen ($9 A-B- : 3 A-bb : 3 aaB- : 1 aabb$), đặc trưng cho tương tác bổ sung.'],
      ['th', 'Trong phép lai $AaBbDd \\\\times AaBbDd$, tỉ lệ kiểu hình mang cả 3 tính trạng trội ở đời con là', ['27/64', '9/64', '3/64', '1/64'], 'Mỗi cặp: $Aa \\\\times Aa \\\\to 3/4 A-$; $Bb \\\\times Bb \\\\to 3/4 B-$; $Dd \\\\times Dd \\\\to 3/4 D-$. Tích tỉ lệ: $(3/4)^3 = 27/64$.'],
      ['vd', 'Ở đậu Hà Lan, A quy định hạt vàng trội hoàn toàn so với a hạt xanh; B hạt trơn trội so với b hạt nhăn. Cho cây hạt vàng, trơn dị hợp tự thụ phấn ($AaBb \\\\times AaBb$). Trong số các hạt vàng, trơn thu được ở $F_1$, tỉ lệ hạt thuần chủng ($AABB$) là', ['1/9', '1/16', '1/4', '3/16'], 'Tỉ lệ hạt vàng, trơn chung ở $F_1$ là $9/16$. Tỉ lệ $AABB$ thuần chủng là $1/16$. Vậy trong số hạt vàng trơn: $(1/16) / (9/16) = 1/9$.'],
      ['vd', 'Phép lai $P: AaBbDdEe \\\\times AabbDdEe$. Cho biết mỗi gen quy định một tính trạng và trội hoàn toàn. Số loại kiểu gen và số loại kiểu hình tối đa ở đời con lần lượt là', ['54 kiểu gen và 16 kiểu hình', '81 kiểu gen và 16 kiểu hình', '54 kiểu gen và 8 kiểu hình', '36 kiểu gen và 16 kiểu hình'], 'Kiểu gen: $(Aa \\\\times Aa \\\\to 3) \\\\times (Bb \\\\times bb \\\\to 2) \\\\times (Dd \\\\times Dd \\\\to 3) \\\\times (Ee \\\\times Ee \\\\to 3) = 3 \\\\times 2 \\\\times 3 \\\\times 3 = 54$. Kiểu hình: $2 \\\\times 2 \\\\times 2 \\\\times 2 = 16$.'],
    ],
  },

  'sinh-c3-lienket': {
    points: [
      'Liên kết gen hoàn toàn: Các gen cùng nằm trên 1 NST di truyền cùng nhau (nhóm gen liên kết bằng số NST đơn bội $n$). Giúp duy trì ổn định các nhóm tính trạng tốt.',
      'Hoán vị gen: Do sự trao đổi chéo giữa các chromatid khác nguồn trong giảm phân I. Tần số hoán vị gen $f = \\\\frac{\\\\text{tổng cá thể hoán vị}}{\\\\text{tổng số cá thể}} \\\\le 50\\\\%$.',
      'Di truyền liên kết giới tính: Gen trên vùng không tương đồng của NST X di truyền chéo (ông ngoại $\\\\to$ mẹ $\\\\to$ cháu trai); gen trên NST Y di truyền thẳng (bố $\\\\to$ con trai).',
      'Bệnh di truyền liên kết NST X ở người: Mù màu, máu khó đông (do allele lặn quy định).',
    ],
    mistakes: [
      'Cho rằng tần số hoán vị gen có thể lớn hơn 50% (thực tế $f \\\\le 50\\\\%$ vì trao đổi chéo chỉ xảy ra giữa 2 trong 4 chromatid).',
      'Quên rằng ở ruồi giấm (Drosophila), hoán vị gen CHỈ XẢY RA Ở RUỒI CÁI, ruồi đực liên kết gen hoàn toàn ($f = 0$).',
      'Nhầm cơ chế di truyền chéo của gen trên NST X với di truyền thẳng của gen trên NST Y.',
    ],
    qs: [
      ['nb', 'Số nhóm gen liên kết của một loài sinh vật thường bằng', ['số nhiễm sắc thể trong bộ đơn bội (n)', 'số nhiễm sắc thể trong bộ lưỡng bội (2n)', 'số phân tử ADN trong nhân tế bào', 'số cặp gen dị hợp'], 'Số nhóm gen liên kết bằng số NST trong bộ đơn bội $n$ của loài.'],
      ['nb', 'Tần số hoán vị gen f giữa hai locus gen trên cùng một nhiễm sắc thể không vượt quá', ['50%', '100%', '25%', '75%'], 'Tần số hoán vị gen dao động từ 0 đến tối đa 50%.'],
      ['nb', 'Bệnh nào sau đây ở người do gen lặn nằm trên vùng không tương đồng của nhiễm sắc thể giới tính X quy định?', ['Bệnh máu khó đông', 'Hội chứng Down', 'Bệnh bạch tạng', 'Bệnh hồng cầu hình liềm'], 'Bệnh máu khó đông (Hemophilia) và mù màu do gen lặn trên NST X quy định.'],
      ['th', 'Một cá thể có kiểu gen $\\\\frac{AB}{ab}$ giảm phân xảy ra hoán vị gen với tần số $f = 20\\\\%$. Tỉ lệ giao tử hoán vị Ab được tạo ra là', ['10%', '20%', '40%', '5%'], 'Giao tử hoán vị gồm $Ab = aB = f/2 = 20\\\\% / 2 = 10\\\\%$. Giao tử liên kết $AB = ab = (100\\\\% - f)/2 = 40\\\\%$.'],
      ['th', 'Đặc điểm di truyền của các gen nằm trên vùng không tương đồng của nhiễm sắc thể giới tính Y là', ['chỉ di truyền thẳng cho giới dị giao tử mang Y (bố truyền cho con trai)', 'di truyền chéo từ ông ngoại sang cháu trai', 'di truyền đồng đều cho cả hai giới', 'chỉ biểu hiện ở giới cái'], 'NST Y chỉ có ở nam giới ($XY$), do đó gen trên Y chỉ truyền thẳng từ bố cho các con trai.'],
      ['th', 'Ở ruồi giấm, hoán vị gen chỉ xảy ra ở', ['ruồi cái mà không xảy ra ở ruồi đực', 'ruồi đực mà không xảy ra ở ruồi cái', 'cả ruồi đực và ruồi cái với tần số như nhau', 'tùy thuộc vào nhiệt độ môi trường'], 'Đặc điểm đặc biệt ở ruồi giấm: hoán vị gen chỉ xảy ra ở giới cái ($XX$).'],
      ['vd', 'Cho ruồi giấm cái thân xám, cánh dài lai với ruồi giấm đực thân đen, cánh cụt thu được $F_1$ có: 41% xám, dài : 41% đen, cụt : 9% xám, cụt : 9% đen, dài. Tần số hoán vị gen ở ruồi cái là', ['18%', '9%', '20%', '36%'], 'Các kiểu hình hoán vị là xám, cụt và đen, dài chiếm $9\\\\% + 9\\\\% = 18\\\\%$. Do đó tần số hoán vị gen $f = 18\\\\%$.'],
      ['vd', 'Một người phụ nữ bình thường có bố bị mù màu kết hôn với một người đàn ông bình thường. Xác suất để đứa con đầu lòng của họ là con trai bị mù màu là', ['25%', '50%', '12,5%', '0%'], 'Người phụ nữ nhận $X^a$ từ bố mù màu nên có kiểu gen $X^A X^a$. Chồng bình thường $X^A Y$. Xác suất con trai bị mù màu ($X^a Y$) $= 1/2 (X^a) \\\\times 1/2 (Y) = 1/4 = 25\\\\%$.'],
    ],
  },

  'sinh-c4-quanthe': {
    points: [
      'Quần thể tự thụ phấn / giao phối gần: Tần số kiểu gen dị hợp giảm một nửa qua mỗi thế hệ ($Aa = \\\\frac{1}{2^n}$), đồng hợp tăng, tần số allele KHÔNG đổi.',
      'Quần thể ngẫu phối cân bằng di truyền theo định luật Hardy - Weinberg: $p^2 AA + 2pq Aa + q^2 aa = 1$ ($p + q = 1$).',
      'Điều kiện nghiệm đúng định luật Hardy - Weinberg: quần thể lớn, ngẫu phối, không có đột biến, không có chọn lọc tự nhiên và di nhập gen.',
      'Xác định cấu trúc di truyền từ tần số kiểu hình lặn: $q(a) = \\\\sqrt{\\\\text{tỉ lệ kiểu hình lặn } aa} \\\\implies p(A) = 1 - q$.',
    ],
    mistakes: [
      'Quên rằng tự phối làm thay đổi tần số KIỂU GEN nhưng KHÔNG làm thay đổi tần số ALLELE.',
      'Áp dụng định luật Hardy - Weinberg cho quần thể tự thụ phấn.',
      'Quên kiểm tra điều kiện cân bằng di truyền: $p^2 \\\\times q^2 = (\\\\frac{2pq}{2})^2$.',
    ],
    qs: [
      ['nb', 'Một quần thể ngẫu phối đạt trạng thái cân bằng di truyền theo định luật Hardy - Weinberg có cấu trúc dạng', ['$p^2 AA + 2pq Aa + q^2 aa = 1$', '$p AA + 2pq Aa + q aa = 1$', '$p^2 AA + pq Aa + q^2 aa = 1$', '$p^2 AA + 4pq Aa + q^2 aa = 1$'], 'Định luật Hardy - Weinberg: $p^2 AA + 2pq Aa + q^2 aa = 1$.'],
      ['nb', 'Quá trình tự thụ phấn liên tục qua nhiều thế hệ ở quần thể thực vật sẽ dẫn đến', ['tần số kiểu gen đồng hợp tăng dần, dị hợp giảm dần', 'tần số kiểu gen dị hợp tăng dần, đồng hợp giảm dần', 'tần số các allele bị thay đổi nhanh chóng', 'quần thể trở nên đa dạng di truyền hơn'], 'Tự phối làm tăng tỉ lệ đồng hợp tử và giảm tỉ lệ dị hợp tử qua các thế hệ.'],
      ['nb', 'Đặc trưng cơ bản của vốn gen trong một quần thể sinh vật được thể hiện qua', ['tần số allele và thành phần kiểu gen của quần thể', 'kích thước và mật độ cá thể', 'tỉ lệ giới tính và cấu trúc tuổi', 'sự phân bố không gian của các cá thể'], 'Vốn gen được đặc trưng bởi tần số các allele và tần số các kiểu gen.'],
      ['th', 'Một quần thể có thành phần kiểu gen: 0,36 AA : 0,48 Aa : 0,16 aa. Tần số allele A và a của quần thể này lần lượt là', ['p(A) = 0,6 và q(a) = 0,4', 'p(A) = 0,4 và q(a) = 0,6', 'p(A) = 0,36 và q(a) = 0,16', 'p(A) = 0,5 và q(a) = 0,5'], '$p(A) = 0{,}36 + 0{,}48/2 = 0{,}6$; $q(a) = 1 - 0{,}6 = 0{,}4$.'],
      ['th', 'Một quần thể ngẫu phối ở trạng thái cân bằng có 16% cá thể mang kiểu hình lặn (aa). Tần số cá thể có kiểu gen dị hợp (Aa) trong quần thể là', ['48%', '32%', '42%', '24%'], '$q^2 = 0{,}16 \\\\implies q(a) = 0{,}4 \\\\implies p(A) = 0{,}6$. Tỉ lệ kiểu gen dị hợp $2pq = 2 \\\\times 0{,}6 \\\\times 0{,}4 = 0{,}48 = 48\\\\%$.'],
      ['th', 'Quần thể nào sau đây ở trạng thái cân bằng di truyền?', ['0,25 AA : 0,50 Aa : 0,25 aa', '0,4 AA : 0,2 Aa : 0,4 aa', '0,6 AA : 0,2 Aa : 0,2 aa', '0,3 AA : 0,5 Aa : 0,2 aa'], 'Kiểm tra: $\\\\sqrt{0{,}25} = 0{,}5$, $2 \\\\times 0{,}5 \\\\times 0{,}5 = 0{,}50$ thỏa mãn cân bằng Hardy - Weinberg.'],
      ['vd', 'Một quần thể thực vật tự thụ phấn ban đầu ($P$) có 100% cá thể mang kiểu gen Aa. Sau 3 thế hệ tự thụ phấn ($F_3$), tỉ lệ kiểu gen dị hợp tử Aa là', ['12,5%', '25%', '6,25%', '37,5%'], 'Tỉ lệ dị hợp qua $n$ thế hệ tự phối: $\\\\frac{1}{2^n} = \\\\frac{1}{2^3} = \\\\frac{1}{8} = 12{,}5\\\\%$.'],
      ['vd', 'Ở người, bệnh bạch tạng do allele lặn a trên NST thường quy định. Trong một quần thể cân bằng di truyền, tỉ lệ người bị bệnh bạch tạng là 1/10000. Một cặp vợ chồng bình thường trong quần thể này, xác suất sinh đứa con đầu lòng bị bạch tạng là xấp xỉ', ['1/404', '1/100', '1/200', '1/40000'], '$q^2 = 1/10000 \\\\implies q = 0{,}01 \\\\implies p = 0{,}99$. Người bình thường có xác suất mang gen bệnh $Aa = \\\\frac{2pq}{p^2 + 2pq} = \\\\frac{2 \\\\times 0{,}01}{0{,}99 + 0{,}02} \\\\approx \\\\frac{2}{101}$. Xác suất sinh con bệnh: $(\\\\frac{2}{101}) \\\\times (\\\\frac{2}{101}) \\\\times \\\\frac{1}{4} = \\\\frac{1}{101^2} \\\\approx \\\\frac{1}{10201} \\\\approx 1/404$ (nếu 1 người là bố/mẹ) hoặc $1/404$.'],
    ],
  },

  'sinh-c5-tienhoa': {
    points: [
      'Tiến hóa hiện đại: Tiến hóa nhỏ (biến đổi vốn gen quần thể $\\\\to$ hình thành loài mới) và tiến hóa lớn (hình thành các đơn vị phân loại trên loài).',
      '5 nhân tố tiến hóa: Đột biến (nguyên liệu sơ cấp), Di nhập gen, Chọn lọc tự nhiên (định hướng tiến hóa), Các yếu tố ngẫu nhiên (phiêu bạt di truyền), Giao phối không ngẫu nhiên.',
      'Hệ sinh thái gồm quần xã sinh vật và sinh cảnh. Chuỗi thức ăn bắt đầu bằng sinh vật sản xuất $\\\\to$ sinh vật tiêu thụ $\\\\to$ sinh vật phân giải.',
      'Dòng năng lượng trong hệ sinh thái đi theo 1 chiều và thất thoát qua mỗi bậc dinh dưỡng (~90% thất thoát qua nhiệt và chất thải, chỉ ~10% chuyển lên bậc sau).',
    ],
    mistakes: [
      'Cho rằng chọn lọc tự nhiên tạo ra các allele mới (CLTN CHỈ SÀNG LỌC VÀ GIỮ LẠI các allele có lợi đã có sẵn).',
      'Nhầm lẫn giữa nhân tố tiến hóa có hướng (chỉ duy nhất Chọn lọc tự nhiên) với các nhân tố vô hướng.',
      'Nghĩ rằng năng lượng trong hệ sinh thái tuần hoàn như vật chất (năng lượng KHÔNG TUẦN HOÀN, đi 1 chiều và tan biến dưới dạng nhiệt).',
    ],
    qs: [
      ['nb', 'Nhân tố tiến hóa duy nhất có vai trò quy định chiều hướng và nhịp điệu của quá trình tiến hóa là', ['chọn lọc tự nhiên', 'đột biến gen', 'di nhập gen', 'các yếu tố ngẫu nhiên'], 'Chọn lọc tự nhiên là nhân tố duy nhất có hướng, giữ lại kiểu gen thích nghi và đào thải kiểu gen kém thích nghi.'],
      ['nb', 'Trong hệ sinh thái, sinh vật nào sau đây đóng vai trò là sinh vật sản xuất?', ['Cây xanh và tảo quang hợp', 'Nấm và vi khuẩn hoại sinh', 'Động vật ăn cỏ', 'Động vật ăn thịt'], 'Sinh vật sản xuất tự dưỡng (cây xanh, tảo quang hợp) quang hợp tổng hợp chất hữu cơ từ năng lượng ánh sáng mặt trời.'],
      ['nb', 'Nhân tố tiến hóa nào có thể làm thay đổi đột ngột tần số allele và thành phần kiểu gen của quần thể không theo một hướng xác định?', ['Các yếu tố ngẫu nhiên (thiên tai, dịch bệnh)', 'Chọn lọc tự nhiên', 'Giao phối ngẫu nhiên', 'Đột biến gen'], 'Các yếu tố ngẫu nhiên (phiêu bạt di truyền) có thể loại bỏ hoàn toàn một allele có lợi khỏi quần thể.'],
      ['th', 'Dòng năng lượng trong hệ sinh thái diễn ra theo chiều', ['một chiều từ sinh vật sản xuất lên các bậc dinh dưỡng cao hơn và không tuần hoàn', 'tuần hoàn khép kín giữa sinh vật và môi trường', 'ngược chiều từ sinh vật phân giải về sinh vật sản xuất', 'hai chiều qua lại giữa các bậc dinh dưỡng'], 'Năng lượng đi một chiều từ Mặt Trời $\\\\to$ sinh vật sản xuất $\\\\to$ sinh vật tiêu thụ $\\\\to$ mất đi dưới dạng nhiệt (không tuần hoàn).'],
      ['th', 'Đột biến gen được coi là nguồn nguyên liệu sơ cấp chủ yếu của quá trình tiến hóa vì', ['tần số đột biến chung lớn, tạo ra các allele mới làm phong phú vốn gen', 'mọi đột biến gen đều có lợi cho sinh vật', 'đột biến gen luôn làm tăng kích thước cơ thể', 'đột biến gen chỉ xuất hiện ở tế bào sinh dưỡng'], 'Đột biến gen tạo ra các allele mới, qua giao phối tạo nên vô số biến dị tổ hợp là nguyên liệu thứ cấp.'],
      ['th', 'Mối quan hệ sinh thái nào sau đây là mối quan hệ cộng sinh giữa hai loài?', ['Nấm và vi khuẩn lam tạo thành địa y', 'Cây phong lan bám trên thân cây gỗ', 'Cá ép bám trên mai rùa biển', 'Giun sán sống trong ruột lợn'], 'Địa y là ví dụ kinh điển về cộng sinh: nấm cung cấp nước/khoáng, vi khuẩn lam/tảo quang hợp cung cấp chất hữu cơ, cả hai cùng có lợi và không thể sống tách rời.'],
      ['vd', 'Một chuỗi thức ăn gồm: Cỏ $\\\\to$ Cào cào $\\\\to$ Ếch $\\\\to$ Rắn $\\\\to$ Đại bàng. Trong chuỗi thức ăn này, ếch thuộc bậc dinh dưỡng', ['cấp 3', 'cấp 2', 'cấp 4', 'cấp 1'], 'Bậc 1: Cỏ. Bậc 2: Cào cào (SVTT bậc 1). Bậc 3: Ếch (SVTT bậc 2). Bậc 4: Rắn. Bậc 5: Đại bàng.'],
      ['vd', 'Nếu một bậc dinh dưỡng tích lũy được $2 \\\\cdot 10^6\\\\text{ kcal}$, theo quy luật hiệu suất sinh thái khoảng 10%, năng lượng chuyển lên bậc dinh dưỡng kế tiếp là', ['$2 \\\\cdot 10^5\\\\text{ kcal}$', '$2 \\\\cdot 10^4\\\\text{ kcal}$', '$10^6\\\\text{ kcal}$', '$2 \\\\cdot 10^3\\\\text{ kcal}$'], 'Hiệu suất sinh thái $\\\\approx 10\\\\% \\\\implies 2 \\\\cdot 10^6 \\\\times 0{,}10 = 2 \\\\cdot 10^5\\\\text{ kcal}$.'],
    ],
  },
'''

TAGS_ADDITION = '''  'ly-c1-donghoc': 'Chuyển động thẳng, rơi tự do & chuyển động ném',
  'ly-c2-dongluchoc': 'Định luật Newton, Lực & Bảo toàn cơ năng',
  'ly-c1-daodong': 'Dao động điều hòa & Con lắc',
  'ly-c2-song': 'Sóng cơ, Giao thoa sóng & Sóng ánh sáng',
  'ly-c3-dientruong': 'Điện trường, Tụ điện & Định luật Coulomb',
  'ly-c1-nhiet': 'Vật lý nhiệt & Khí lý tưởng',
  'ly-c4-tutruong': 'Từ trường, Cảm ứng điện từ & Dòng điện xoay chiều',
  'ly-c5-hatnhan': 'Hạt nhân nguyên tử & Định luật phóng xạ',
  'sinh-c1-phantu': 'Cấu trúc ADN, Nhân đôi, Phiên mã & Dịch mã',
  'sinh-c1-tebao': 'Tế bào học, Màng sinh chất & Chu kì tế bào',
  'sinh-c2-ditruyen': 'Quy luật Mendel & Tương tác gen',
  'sinh-c3-lienket': 'Liên kết gen, Hoán vị & Di truyền liên kết giới tính',
  'sinh-c4-quanthe': 'Cấu trúc di truyền quần thể & Định luật Hardy - Weinberg',
  'sinh-c5-tienhoa': 'Nhân tố tiến hóa & Hệ sinh thái',
'''

def main():
    with open('src/data/roadmapExercises.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where c12-sustain is, then find the end of BANK
    idx_sustain = content.find("'c12-sustain'")
    if idx_sustain == -1:
        print("Could not find c12-sustain")
        return

    idx_bank_end = content.find("\n};\n", idx_sustain)
    if idx_bank_end == -1:
        print("Could not find end of BANK")
        return

    # Insert Physics and Biology BANK right before the closing brace of BANK
    new_content = content[:idx_bank_end] + PHYSICS_BANK + BIOLOGY_BANK + content[idx_bank_end:]

    # Insert new tags into TOPIC_SKILL_TAGS
    idx_tag_insert = new_content.find('const TOPIC_SKILL_TAGS = {') + len('const TOPIC_SKILL_TAGS = {\n')
    new_content = new_content[:idx_tag_insert] + TAGS_ADDITION + new_content[idx_tag_insert:]

    with open('src/data/roadmapExercises.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("Updated src/data/roadmapExercises.js successfully!")

if __name__ == '__main__':
    main()
