# -*- coding: utf-8 -*-
"""
expand_khtn_roadmap_lessons.py
Mở rộng ngân hàng bài học chuyên sâu ELEC AI:
1. Bổ sung đầy đủ các chương Vật lí (Từ trường, Cảm ứng điện từ, Dòng điện xoay chiều, Vật lý hạt nhân)
2. Bổ sung đầy đủ các chương Sinh học (Tế bào học, Di truyền Men-đen, Hoán vị gen, Quần thể, Tiến hóa, Sinh thái)
3. Bổ sung thêm bài học con cho các chương Hóa học trọng điểm (Ester - Lipid, Carbohydrate, Amine - Protein, Đại cương kim loại, Pin điện)
Tuân thủ 100% chuẩn danh pháp IUPAC CT GDPT 2018.
"""

new_ly_chapters = '''
    {
      chapterId: 'ly-c4-tutruong',
      chapterName: 'Từ trường, Cảm ứng điện từ & Dòng điện xoay chiều',
      grade: 11,
      lessons: [
        {
          id: 'ly-tu-truong-luc-lorentz',
          title: 'Từ trường, Cảm ứng từ B & Lực Lorentz',
          desc: 'Đặc trưng của từ trường, đường sức từ, lực từ tác dụng lên đoạn dây dẫn mang dòng điện và lực Lorentz tác dụng lên hạt mang điện chuyển động.',
          duration: '30 phút',
          tag: 'Trọng tâm',
          practiceCount: 10,
          concepts: [
            {
              term: 'Từ trường & Cảm ứng từ ($B$)',
              definition: 'Môi trường vật chất đặc biệt tồn tại xung quanh điện tích chuyển động hoặc nam châm, tác dụng lực từ lên dòng điện hoặc hạt mang điện đặt trong nó. Đơn vị cảm ứng từ là Tesla ($T$).',
            },
            {
              term: 'Lực từ tác dụng lên đoạn dây dẫn ($F$)',
              definition: '$F = B \\\\cdot I \\\\cdot l \\\\cdot \\\\sin\\\\alpha$, xác định theo quy tắc bàn tay trái (đặt bàn tay trái sao cho cảm ứng từ đâm vào lòng bàn tay, chiều từ cổ tay đến ngón giữa là chiều dòng điện, ngón cái choãi 90 độ chỉ chiều lực từ).',
            },
            {
              term: 'Lực Lorentz',
              definition: 'Lực từ tác dụng lên hạt mang điện chuyển động trong từ trường: $f = |q| v B \\\\sin\\\\alpha$. Đóng vai trò là lực hướng tâm làm hạt chuyển động tròn đều trong từ trường đều khi $\\\\alpha = 90^\\\\circ$.',
            },
          ],
          algorithms: [
            {
              step: 'Xác định bán kính quỹ đạo hạt mang điện',
              detail: '$R = \\\\frac{m v}{|q| B}$; Chu kì quay $T = \\\\frac{2 \\\\pi m}{|q| B}$ (không phụ thuộc vào vận tốc $v$).',
            },
          ],
          formulas: [
            {
              name: 'Độ lớn lực Lorentz',
              formula: 'f = |q| v B \\\\sin \\\\alpha',
              displayLatex: 'f_{\\\\text{Lorentz}} = |q| v B \\\\sin \\\\alpha',
              usage: 'Tính lực từ tác dụng lên một hạt mang điện chuyển động trong từ trường đều.',
            },
            {
              name: 'Bán kính quỹ đạo tròn của hạt trong từ trường',
              formula: 'R = \\\\frac{mv}{|q|B}',
              displayLatex: 'R = \\\\frac{m v}{|q| B}',
              usage: 'Ứng dụng trong máy gia tốc cyclotron và khối phổ kế đo khối lượng nguyên tử.',
            },
          ],
          traps: [
            {
              trap: 'Quên xét dấu của điện tích q khi áp dụng quy tắc bàn tay trái cho lực Lorentz',
              avoid: 'Với hạt mang điện âm (như electron $q < 0$), chiều lực Lorentz ngược chiều ngón tay cái chỉ.',
            },
          ],
          flashcards: [
            { id: 'fc-tu-1', front: 'Đơn vị đo cảm ứng từ trong hệ SI là gì?', back: 'Tesla (T).' },
            { id: 'fc-tu-2', front: 'Nếu hạt mang điện chuyển động song song với đường sức từ thì lực Lorentz bằng bao nhiêu?', back: 'Bằng 0 vì $\\\\sin(0^\\\\circ) = 0$.' },
          ],
          practiceQuestions: [
            {
              id: 'q-tu-1',
              level: 'nb',
              question: 'Một hạt mang điện tích $q = 3,2 \\\\cdot 10^{-19}\\\\text{ C}$ bay với vận tốc $v = 10^6\\\\text{ m/s}$ vào từ trường đều $B = 0,5\\\\text{ T}$ theo phương vuông góc với đường sức từ. Lực Lorentz tác dụng lên hạt có độ lớn là:',
              options: ['$1,6 \\\\cdot 10^{-13}\\\\text{ N}$', '$3,2 \\\\cdot 10^{-13}\\\\text{ N}$', '$0,8 \\\\cdot 10^{-13}\\\\text{ N}$', '$0\\\\text{ N}$'],
              correct: 0,
              solution: '$f = |q| v B \\\\sin 90^\\\\circ = 3,2 \\\\cdot 10^{-19} \\\\times 10^6 \\\\times 0,5 \\\\times 1 = 1,6 \\\\cdot 10^{-13}\\\\text{ N}$.',
              trapAlert: 'Góc $\\\\alpha = 90^\\\\circ$ nên $\\\\sin\\\\alpha = 1$.',
            },
          ],
        },
        {
          id: 'ly-cam-ung-dien-tu-faraday',
          title: 'Hiện tượng cảm ứng điện từ & Định luật Faraday',
          desc: 'Từ thông $\\\\Phi$, định luật Lenz về chiều dòng điện cảm ứng, suất điện động cảm ứng Faraday và hiện tượng tự cảm trong ống dây.',
          duration: '30 phút',
          tag: 'Trọng tâm',
          practiceCount: 10,
          concepts: [
            {
              term: 'Từ thông ($\\\\Phi$)',
              definition: 'Đại lượng đo số lượng đường sức từ xuyên qua một diện tích $S$: $\\\\Phi = N B S \\\\cos\\\\alpha$ (với $\\\\alpha = (\\\\vec{n}, \\\\vec{B})$). Đơn vị là Weber ($Wb$).',
            },
            {
              term: 'Định luật Lenz',
              definition: 'Dòng điện cảm ứng xuất hiện có chiều sao cho từ trường do nó sinh ra có tác dụng chống lại sự biến thiên của từ thông ban đầu sinh ra nó.',
            },
            {
              term: 'Định luật cảm ứng Faraday',
              definition: 'Độ lớn suất điện động cảm ứng tỉ lệ với tốc độ biến thiên của từ thông qua mạch: $e_c = - \\\\frac{\\\\Delta \\\\Phi}{\\\\Delta t}$.',
            },
          ],
          algorithms: [
            {
              step: 'Xác định chiều dòng điện cảm ứng theo Lenz',
              detail: 'Nếu $\\\\Phi$ tăng: $\\\\vec{B}_c$ ngược chiều $\\\\vec{B}_{\\\\text{ngoài}}$ (chống tăng). Nếu $\\\\Phi$ giảm: $\\\\vec{B}_c$ cùng chiều $\\\\vec{B}_{\\\\text{ngoài}}$ (chống giảm). Sau đó dùng quy tắc nắm bàn tay phải xác định chiều dòng điện $I_c$.',
            },
          ],
          formulas: [
            {
              name: 'Định luật Faraday',
              formula: 'e_c = - \\\\frac{\\\\Delta \\\\Phi}{\\\\Delta t}',
              displayLatex: 'e_c = - \\\\frac{\\\\Delta \\\\Phi}{\\\\Delta t} \\\\implies |e_c| = \\\\left|\\\\frac{\\\\Delta \\\\Phi}{\\\\Delta t}\\\\right|',
              usage: 'Tính độ lớn suất điện động cảm ứng sinh ra trong khung dây.',
            },
          ],
          traps: [
            {
              trap: 'Nhầm lẫn góc $\\\\alpha$ giữa pháp tuyến $\\\\vec{n}$ và mặt phẳng khung dây',
              avoid: 'Góc $\\\\alpha$ là góc hợp bởi vectơ cảm ứng từ $\\\\vec{B}$ và VECTƠ PHÁP TUYẾN $\\\\vec{n}$, KHÔNG PHẢI mặt phẳng khung. Nếu đề cho $\\\\vec{B}$ hợp với mặt phẳng góc $30^\\\\circ$ thì $\\\\alpha = 60^\\\\circ$.',
            },
          ],
          flashcards: [
            { id: 'fc-cu-1', front: 'Đơn vị của từ thông trong hệ SI là gì?', back: 'Weber (Wb).' },
            { id: 'fc-cu-2', front: 'Hiện tượng cảm ứng điện từ xảy ra khi nào?', back: 'Khi từ thông qua mạch kín biến thiên theo thời gian.' },
          ],
          practiceQuestions: [
            {
              id: 'q-cu-1',
              level: 'nb',
              question: 'Một khung dây kín có diện tích $0,02\\\\text{ m}^2$ đặt trong từ trường đều $B = 0,1\\\\text{ T}$ sao cho vectơ cảm ứng từ vuông góc với mặt phẳng khung. Từ thông qua khung dây là:',
              options: ['$0,002\\\\text{ Wb}$', '$0,02\\\\text{ Wb}$', '$0,2\\\\text{ Wb}$', '$0\\\\text{ Wb}$'],
              correct: 0,
              solution: '$\\\\vec{B}$ vuông góc mặt phẳng khung $\\\\implies \\\\alpha = 0^\\\\circ \\\\implies \\\\Phi = B \\\\cdot S \\\\cdot \\\\cos 0^\\\\circ = 0,1 \\\\times 0,02 \\\\times 1 = 0,002\\\\text{ Wb}$.',
              trapAlert: 'Vuông góc với mặt phẳng khung nghĩa là song song với pháp tuyến $\\\\vec{n}$ ($\\\\alpha = 0^\\\\circ$).',
            },
          ],
        },
      ],
    },
    {
      chapterId: 'ly-c5-hatnhan',
      chapterName: 'Vật lý hạt nhân & Phóng xạ',
      grade: 12,
      lessons: [
        {
          id: 'ly-cau-tao-hat-nhan-do-hut-khoi',
          title: 'Cấu tạo hạt nhân, Độ hụt khối & Năng lượng liên kết',
          desc: 'Thành phần hạt nhân ($Z$ proton, $N$ neutron), hệ thức Einstein $E=mc^2$, độ hụt khối $\\\\Delta m$ và năng lượng liên kết riêng quyết định độ bền vững.',
          duration: '30 phút',
          tag: 'Trọng tâm',
          practiceCount: 10,
          concepts: [
            {
              term: 'Kí hiệu hạt nhân ($^A_Z X$)',
              definition: '$Z$ là số proton (nguyên tử số), $A$ là số khối (tổng số nucleon), $N = A - Z$ là số neutron.',
            },
            {
              term: 'Độ hụt khối ($\\\\Delta m$)',
              definition: 'Khối lượng của một hạt nhân luôn nhỏ hơn tổng khối lượng của các nucleon riêng rẽ tạo nên nó: $\\\\Delta m = [Z m_p + (A - Z) m_n] - m_X > 0$.',
            },
            {
              term: 'Năng lượng liên kết riêng ($\\\\varepsilon$)',
              definition: '$\\\\varepsilon = \\\\frac{E_{\\\\text{lk}}}{A}$. Đại lượng đặc trưng cho mức độ bền vững của hạt nhân. Các hạt nhân có số khối trung bình $50 < A < 95$ (như sắt $^{56}_{26}Fe$) bền vững nhất.',
            },
          ],
          algorithms: [
            {
              step: 'So sánh độ bền vững giữa 2 hạt nhân',
              detail: 'Hạt nhân nào có năng lượng liên kết riêng $\\\\varepsilon = E_{\\\\text{lk}}/A$ LỚN HƠN thì hạt nhân đó BỀN VỮNG HƠN (không so sánh năng lượng liên kết $E_{\\\\text{lk}}$).',
            },
          ],
          formulas: [
            {
              name: 'Năng lượng liên kết hạt nhân',
              formula: 'E_{\\\\text{lk}} = \\\\Delta m \\\\cdot c^2 = [Z m_p + (A - Z) m_n - m_X] \\\\cdot c^2',
              displayLatex: 'E_{\\\\text{lk}} = \\\\Delta m \\\\cdot c^2',
              usage: 'Tính năng lượng tỏa ra khi liên kết các nucleon thành hạt nhân (thường dùng $1\\\\text{ u} \\\\cdot c^2 = 931,5\\\\text{ MeV}$).',
            },
            {
              name: 'Năng lượng liên kết riêng',
              formula: '\\\\varepsilon = \\\\frac{E_{\\\\text{lk}}}{A}',
              displayLatex: '\\\\varepsilon = \\\\frac{E_{\\\\text{lk}}}{A} \\\\quad (\\\\text{MeV/nucleon})',
              usage: 'Tiêu chuẩn duy nhất để đánh giá độ bền vững của hạt nhân nguyên tử.',
            },
          ],
          traps: [
            {
              trap: 'Chọn hạt nhân có năng lượng liên kết $E_{lk}$ lớn nhất là bền vững nhất',
              avoid: 'Bền vững nhất phụ thuộc vào năng lượng liên kết RIÊNG $\\\\varepsilon = E_{lk}/A$, không phải $E_{lk}$.',
            },
          ],
          flashcards: [
            { id: 'fc-hn-1', front: 'Đại lượng nào đặc trưng cho độ bền vững của một hạt nhân nguyên tử?', back: 'Năng lượng liên kết riêng ($\\\\varepsilon = E_{\\\\text{lk}}/A$).' },
            { id: 'fc-hn-2', front: 'Các hạt nhân bền vững nhất nằm trong khoảng số khối nào?', back: 'Khoảng giữa của bảng tuần hoàn ($50 < A < 95$), bền nhất là Sắt ($^{56}_{26}Fe$).' },
          ],
          practiceQuestions: [
            {
              id: 'q-hn-1',
              level: 'nb',
              question: 'Đại lượng đặc trưng cho mức độ bền vững của một hạt nhân nguyên tử là:',
              options: ['Năng lượng liên kết', 'Năng lượng liên kết riêng', 'Khối lượng hạt nhân', 'Độ hụt khối'],
              correct: 1,
              solution: 'Năng lượng liên kết riêng $\\\\varepsilon = E_{\\\\text{lk}} / A$ đo năng lượng liên kết tính trên một nucleon, là thước đo độ bền vững.',
              trapAlert: 'Tránh nhầm với năng lượng liên kết toàn phần $E_{\\\\text{lk}}$.',
            },
          ],
        },
      ],
    },
'''

new_sinh_chapters = '''
    {
      chapterId: 'sinh-c1-tebao',
      chapterName: 'Sinh học tế bào & Chu kì tế bào',
      grade: 10,
      lessons: [
        {
          id: 'sinh-thanh-phan-te-bao-mang',
          title: 'Thành phần hóa học, Màng sinh chất & Vận chuyển qua màng',
          desc: 'Các đại phân tử sinh học (protein, lipid, carbohydrate, acid nucleic), mô hình khảm động của màng sinh chất và các hình thức vận chuyển thụ động, chủ động.',
          duration: '25 phút',
          tag: 'Cơ sở',
          practiceCount: 8,
          concepts: [
            {
              term: 'Mô hình khảm động của màng sinh chất',
              definition: 'Gồm lớp kép phospholipid với đầu ưa nước quay ra ngoài, đuôi kỵ nước quay vào nhau, xen kẽ các phân tử protein khảm xuyên màng hoặc bề mặt.',
            },
            {
              term: 'Vận chuyển thụ động & Chủ động',
              definition: 'Thụ động: theo chiều gradient nồng độ (từ nơi cao sang thấp), không tiêu tốn ATP. Chủ động: ngược gradient nồng độ, cần protein màng và tiêu tốn năng lượng ATP.',
            },
          ],
          algorithms: [
            {
              step: 'Phân biệt môi trường ưu trương, đẳng trương, nhược trương',
              detail: 'Nhược trương: nước thẩm thấu vào tế bào (tế bào động vật vỡ, thực vật căng). Ưu trương: nước rút ra ngoài (tế bào co nguyên sinh).',
            },
          ],
          formulas: [
            {
              name: 'Áp suất thẩm thấu',
              formula: 'P = R T C',
              displayLatex: 'P = R \\\\cdot T \\\\cdot C',
              usage: 'Xác định xu hướng di chuyển của phân tử nước qua màng bán thấm.',
            },
          ],
          traps: [
            {
              trap: 'Tế bào thực vật bị vỡ khi ngâm trong nước cất (môi trường nhược trương)',
              avoid: 'Tế bào thực vật có THÀNH CELLULOSE cứng cáp bảo vệ nên không bao giờ bị vỡ tan như hồng cầu.',
            },
          ],
          flashcards: [
            { id: 'fc-tb-1', front: 'Hình thức vận chuyển chất ngược chiều gradient nồng độ cần điều kiện gì?', back: 'Cần kênh protein vận chuyển và năng lượng ATP (vận chuyển chủ động).' },
          ],
          practiceQuestions: [
            {
              id: 'q-tb-1',
              level: 'nb',
              question: 'Vận chuyển thụ động các chất qua màng sinh chất diễn ra theo nguyên lí nào?',
              options: [
                'Khuếch tán từ nơi có nồng độ thấp đến nơi có nồng độ cao',
                'Khuếch tán từ nơi có nồng độ cao đến nơi có nồng độ thấp',
                'Luôn cần tiêu hao năng lượng ATP của tế bào',
                'Chỉ diễn ra khi có sự trợ lực của bóng xuất bào',
              ],
              correct: 1,
              solution: 'Vận chuyển thụ động đi theo chiều gradient nồng độ: từ nơi nồng độ cao đến nơi nồng độ thấp, không tốn ATP.',
              trapAlert: 'Vận chuyển chủ động mới đi ngược gradient nồng độ và tốn ATP.',
            },
          ],
        },
      ],
    },
    {
      chapterId: 'sinh-c2-ditruyen',
      chapterName: 'Quy luật di truyền Men-đen & Tương tác gen',
      grade: 12,
      lessons: [
        {
          id: 'sinh-quy-luat-men-den',
          title: 'Quy luật phân li & Phân li độc lập của Gregor Mendel',
          desc: 'Bản chất phép lai một cặp tính trạng và hai cặp tính trạng của Men-đen, giải thích theo cơ chế giảm phân và thụ tinh.',
          duration: '30 phút',
          tag: 'Trọng tâm',
          practiceCount: 10,
          concepts: [
            {
              term: 'Quy luật phân li',
              definition: 'Mỗi tính trạng do một cặp allele quy định. Khi giảm phân hình thành giao tử, các allele trong cặp phân li đồng đều về các giao tử: $50\\\\% A : 50\\\\% a$.',
            },
            {
              term: 'Quy luật phân li độc lập',
              definition: 'Các cặp allele nằm trên các cặp nhiễm sắc thể tương đồng khác nhau phân li độc lập và tổ hợp tự do trong quá trình giảm phân thụ tinh, tạo tỉ lệ kiểu hình đời con $F_2$ là $9:3:3:1$.',
            },
          ],
          algorithms: [
            {
              step: 'Tính nhanh tỉ lệ kiểu gen, kiểu hình phép lai nhiều cặp gen',
              detail: 'Tách từng cặp gen lai độc lập, sau đó nhân tích xác suất lại với nhau: $P: AaBb \\\\times AaBb \\\\implies (3/4 A- : 1/4 aa) \\\\times (3/4 B- : 1/4 bb)$.',
            },
          ],
          formulas: [
            {
              name: 'Công thức Men-đen cho n cặp gen phân li độc lập',
              formula: '\\\\text{Số loại giao tử} = 2^n; \\\\quad \\\\text{Số kiểu gen } F_2 = 3^n; \\\\quad \\\\text{Số kiểu hình } F_2 = 2^n',
              displayLatex: '\\\\text{Giao tử} = 2^n; \\\\quad \\\\text{Kiểu gen} = 3^n; \\\\quad \\\\text{Kiểu hình} = 2^n \\\\quad (\\\\text{với } n \\\\text{ cặp dị hợp})',
              usage: 'Tính nhanh số loại giao tử, kiểu gen, kiểu hình trong bài toán di truyền nhiều cặp gen.',
            },
          ],
          traps: [
            {
              trap: 'Quên kiểm tra xem các gen có cùng nằm trên 1 NST hay không (liên kết gen)',
              avoid: 'Nếu đề bài cho tỉ lệ đời con KHÁC $9:3:3:1$ (ví dụ $3:1$ hay $1:2:1$), các gen có thể di truyền liên kết chứ không phân li độc lập.',
            },
          ],
          flashcards: [
            { id: 'fc-md-1', front: 'Phép lai $AaBb \\\\times AaBb$ cho tỉ lệ kiểu hình là bao nhiêu nếu trội lặn hoàn toàn?', back: '$9 : 3 : 3 : 1$.' },
            { id: 'fc-md-2', front: 'Cơ thể có kiểu gen $AaBbDd$ giảm phân bình thường tạo ra tối đa bao nhiêu loại giao tử?', back: '$2^3 = 8$ loại giao tử.' },
          ],
          practiceQuestions: [
            {
              id: 'q-md-1',
              level: 'nb',
              question: 'Cơ thể có kiểu gen $AaBbDdEe$ khi giảm phân bình thường cho tối đa bao nhiêu loại giao tử?',
              options: ['4', '8', '16', '32'],
              correct: 2,
              solution: 'Số cặp dị hợp $n = 4 \\\\implies$ số loại giao tử tối đa là $2^4 = 16$.',
              trapAlert: 'Mỗi cặp dị hợp cho 2 loại giao tử, nhân lại: $2 \\\\times 2 \\\\times 2 \\\\times 2 = 16$.',
            },
          ],
        },
      ],
    },
    {
      chapterId: 'sinh-c3-lienket',
      chapterName: 'Di truyền liên kết giới tính & Hoán vị gen',
      grade: 12,
      lessons: [
        {
          id: 'sinh-hoan-vi-gen-lien-ket',
          title: 'Liên kết gen, Hoán vị gen (Tần số f) & Di truyền liên kết giới tính',
          desc: 'Thí nghiệm của Morgan trên ruồi giấm, hiện tượng trao đổi chéo giữa các chromatid khác nguồn trong giảm phân I và lập bản đồ di truyền.',
          duration: '30 phút',
          tag: 'Vận dụng',
          practiceCount: 10,
          concepts: [
            {
              term: 'Liên kết gen hoàn toàn',
              definition: 'Các gen nằm gần nhau trên cùng một nhiễm sắc thể di truyền cùng nhau, làm hạn chế xuất hiện biến dị tổ hợp.',
            },
            {
              term: 'Hoán vị gen & Tần số hoán vị ($f$)',
              definition: 'Xảy ra do sự trao đổi chéo giữa 2 trong 4 chromatid khác nguồn gốc ở kì đầu giảm phân I. Tần số $f = \\\\frac{\\\\text{Tổng số cá thể hoán vị}}{\\\\text{Tổng số cá thể đời con}} \\\\times 100\\\\% \\\\le 50\\\\%$.',
            },
          ],
          algorithms: [
            {
              step: 'Xác định giao tử hoán vị và liên kết',
              detail: 'Giao tử liên kết $= \\\\frac{1 - f}{2}$; Giao tử hoán vị $= \\\\frac{f}{2}$. Giao tử liên kết luôn chiếm tỉ lệ $\\\\ge 25\\\\%$, giao tử hoán vị luôn $\\\\le 25\\\\%$.',
            },
          ],
          formulas: [
            {
              name: 'Tần số hoán vị gen',
              formula: 'f = \\\\frac{N_{\\\\text{hoán vị}}}{N_{\\\\text{tổng}}} \\\\times 100\\\\%',
              displayLatex: 'f = \\\\frac{\\\\text{Số cá thể hoán vị}}{\\\\text{Tổng số cá thể}} \\\\times 100\\\\% \\\\le 50\\\\%',
              usage: 'Xác định khoảng cách giữa 2 gen trên nhiễm sắc thể ($1\\\\% = 1\\\\text{ cM}$).',
            },
          ],
          traps: [
            {
              trap: 'Nghĩ rằng tần số hoán vị gen có thể lớn hơn 50%',
              avoid: 'Tần số hoán vị gen không bao giờ vượt quá 50% vì sự trao đổi chéo chỉ xảy ra giữa 2 trong 4 chromatid.',
            },
          ],
          flashcards: [
            { id: 'fc-hv-1', front: 'Tần số hoán vị gen tối đa là bao nhiêu?', back: 'Tối đa là 50%.' },
          ],
          practiceQuestions: [
            {
              id: 'q-hv-1',
              level: 'th',
              question: 'Một cơ thể có kiểu gen $\\\\frac{AB}{ab}$ xảy ra hoán vị gen với tần số $f = 20\\\\%$. Tỉ lệ loại giao tử hoán vị $\\\\underline{Ab}$ tạo ra là:',
              options: ['10%', '20%', '40%', '5%'],
              correct: 0,
              solution: 'Giao tử hoán vị $\\\\underline{Ab} = \\\\underline{aB} = \\\\frac{f}{2} = \\\\frac{20\\\\%}{2} = 10\\\\%$.',
              trapAlert: 'Giao tử liên kết $\\\\underline{AB} = \\\\underline{ab} = \\\\frac{1-f}{2} = 40\\\\%$.',
            },
          ],
        },
      ],
    },
    {
      chapterId: 'sinh-c4-quanthe',
      chapterName: 'Di truyền học quần thể & Di truyền người',
      grade: 12,
      lessons: [
        {
          id: 'sinh-dinh-luat-hardy-weinberg',
          title: 'Cấu trúc di truyền quần thể & Định luật Hardy – Weinberg',
          desc: 'Quần thể tự phối (tăng đồng hợp, giảm dị hợp) và quần thể ngẫu phối cân bằng di truyền: $p^2 AA + 2pq Aa + q^2 aa = 1$.',
          duration: '25 phút',
          tag: 'Trọng tâm',
          practiceCount: 8,
          concepts: [
            {
              term: 'Quần thể tự phối',
              definition: 'Qua các thế hệ tự thụ phấn hoặc giao phối gần, tỉ lệ dị hợp tử $Aa$ giảm đi một nửa sau mỗi thế hệ: $(\\\\frac{1}{2})^n$, tỉ lệ đồng hợp tử tăng dần.',
            },
            {
              term: 'Định luật Hardy – Weinberg',
              definition: 'Trong một quần thể ngẫu phối lớn, không có đột biến, chọn lọc tự nhiên hay di nhập gen, tần số các allele và thành phần kiểu gen duy trì ổn định: $p^2 AA + 2pq Aa + q^2 aa = 1$.',
            },
          ],
          algorithms: [
            {
              step: 'Tính tần số allele từ thành phần kiểu gen',
              detail: '$p(A) = d + \\\\frac{h}{2}$; $q(a) = r + \\\\frac{h}{2}$ với cấu trúc quần thể $d AA + h Aa + r aa = 1$.',
            },
          ],
          formulas: [
            {
              name: 'Định luật Hardy - Weinberg',
              formula: 'p^2 AA + 2pq Aa + q^2 aa = 1',
              displayLatex: 'p^2 AA + 2pq Aa + q^2 aa = 1 \\\\quad (p + q = 1)',
              usage: 'Xác định tần số allele và trạng thái cân bằng di truyền của quần thể.',
            },
          ],
          traps: [
            {
              trap: 'Quên kiểm tra điều kiện cân bằng $p^2 \\\\times q^2 = (\\\\frac{2pq}{2})^2$',
              avoid: 'Chỉ khi cấu trúc kiểu gen thỏa mãn đẳng thức thì quần thể mới đạt trạng thái cân bằng di truyền.',
            },
          ],
          flashcards: [
            { id: 'fc-qt-1', front: 'Cấu trúc di truyền của một quần thể ngẫu phối cân bằng có dạng như thế nào?', back: '$p^2 AA + 2pq Aa + q^2 aa = 1$.' },
          ],
          practiceQuestions: [
            {
              id: 'q-qt-1',
              level: 'nb',
              question: 'Một quần thể cân bằng di truyền có tần số allele $A = 0,6$ và $a = 0,4$. Tỉ lệ cá thể có kiểu gen dị hợp tử $Aa$ là:',
              options: ['48%', '36%', '16%', '24%'],
              correct: 0,
              solution: '$Aa = 2pq = 2 \\\\times 0,6 \\\\times 0,4 = 0,48 = 48\\\\%$.',
              trapAlert: 'Đồng hợp $AA = 0,6^2 = 0,36$; $aa = 0,4^2 = 0,16$.',
            },
          ],
        },
      ],
    },
    {
      chapterId: 'sinh-c5-tienhoa',
      chapterName: 'Tiến hóa & Sinh thái học',
      grade: 12,
      lessons: [
        {
          id: 'sinh-tien-hoa-sinh-thai-co-ban',
          title: 'Các nhân tố tiến hóa & Mối quan hệ trong hệ sinh thái',
          desc: '5 nhân tố tiến hóa (đột biến, di nhập gen, CLTN, yếu tố ngẫu nhiên, giao phối không ngẫu nhiên) và chuỗi, lưới thức ăn sinh thái.',
          duration: '25 phút',
          tag: 'Trọng tâm',
          practiceCount: 8,
          concepts: [
            {
              term: 'Chọn lọc tự nhiên (CLTN)',
              definition: 'Nhân tố tiến hóa CÓ HƯỚNG duy nhất, trực tiếp tác động lên kiểu hình qua đó gián tiếp làm biến đổi tần số allele theo hướng thích nghi.',
            },
            {
              term: 'Chuỗi & Lưới thức ăn',
              definition: 'Mỗi bậc dinh dưỡng chỉ chuyển được khoảng $10\\\\%$ năng lượng lên bậc dinh dưỡng kế tiếp (hiệu suất sinh thái), $90\\\\%$ bị thất thoát qua hô hấp, bài tiết, nhiệt.',
            },
          ],
          algorithms: [
            {
              step: 'Xác định nhân tố làm nghèo vốn gen quần thể nhanh nhất',
              detail: 'Các yếu tố ngẫu nhiên (thiên tai, dịch bệnh) có thể loại bỏ hoàn toàn một allele có lợi hoặc có hại bất kì khỏi quần thể trong thời gian ngắn.',
            },
          ],
          formulas: [
            {
              name: 'Hiệu suất sinh thái',
              formula: 'H = \\\\frac{E_{n+1}}{E_n} \\\\times 100\\\\%',
              displayLatex: 'H = \\\\frac{E_{n+1}}{E_n} \\\\times 100\\\\% \\\\approx 10\\\\%',
              usage: 'Tính toán tháp năng lượng và hiệu suất chuyển đổi dinh dưỡng trong hệ sinh thái.',
            },
          ],
          traps: [
            {
              trap: 'Cho rằng đột biến gen là nhân tố định hướng tiến hóa',
              avoid: 'Đột biến là nhân tố VÔ HƯỚNG, chỉ cung cấp nguồn nguyên liệu sơ cấp; duy nhất CHỌN LỌC TỰ NHIÊN mới là nhân tố quy định chiều hướng tiến hóa.',
            },
          ],
          flashcards: [
            { id: 'fc-th-1', front: 'Nhân tố tiến hóa nào là nhân tố duy nhất có hướng?', back: 'Chọn lọc tự nhiên (CLTN).' },
          ],
          practiceQuestions: [
            {
              id: 'q-th-1',
              level: 'nb',
              question: 'Nhân tố tiến hóa nào sau đây định hướng quá trình tiến hóa thích nghi?',
              options: ['Đột biến gen', 'Chọn lọc tự nhiên', 'Di nhập gen', 'Các yếu tố ngẫu nhiên'],
              correct: 1,
              solution: 'Chọn lọc tự nhiên là nhân tố tiến hóa duy nhất có hướng.',
              trapAlert: 'Các nhân tố khác đều là vô hướng.',
            },
          ],
        },
      ],
    },
'''

with open('src/data/dedicatedLessonsData.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Insert new_ly_chapters before the end of ly array:
pos_ly = text.find("'ly': [")
pos_hoa = text.find("'hoa': [")
close_ly = text.rfind('],', pos_ly, pos_hoa)

text = text[:close_ly] + ",\n" + new_ly_chapters.strip() + "\n  " + text[close_ly:]

# 2. Re-find sinh array and append new_sinh_chapters
pos_sinh = text.find("'sinh': [")
close_sinh = text.rfind(']', pos_sinh)

text = text[:close_sinh] + ",\n" + new_sinh_chapters.strip() + "\n  " + text[close_sinh:]

with open('src/data/dedicatedLessonsData.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('Successfully expanded Physics & Biology chapters in dedicatedLessonsData.js!')
