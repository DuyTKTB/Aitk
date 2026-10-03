
export const PROMPT_CATS = [
  { id: 'huong-dan', name: 'Hướng dẫn dùng', hue: 200, kind: 'guide', guide: true },
  { id: 'hoc',      name: 'Học Hóa',           hue: 165, kind: 'molecule', chat: true },
  { id: 'toan',     name: 'Toán học',          hue: 210, kind: 'chart',    chat: true },
  { id: 'ly',       name: 'Vật lý',            hue: 190, kind: 'molecule', chat: true },
  { id: 'sinh',     name: 'Sinh học',          hue: 130, kind: 'molecule', chat: true },
  { id: 'van',      name: 'Ngữ văn',           hue: 30,  kind: 'lines',    chat: true },
  { id: 'anh',      name: 'Tiếng Anh',         hue: 260, kind: 'bubbles',  chat: true },
  { id: 'viet',     name: 'Viết & học thuật',  hue: 265, kind: 'lines',    chat: true },
  { id: 'dich',     name: 'Dịch & ngoại ngữ',  hue: 48,  kind: 'bubbles',  chat: true },
  { id: 'anh-ao',   name: 'Tạo ảnh',           hue: 330, kind: 'scene', open: [['Bing Image Creator', 'https://www.bing.com/images/create'], ['ImageFX', 'https://labs.google/fx/tools/image-fx']] },
  { id: 'video',    name: 'Tạo video',         hue: 215, kind: 'scene', open: [['Google Flow', 'https://labs.google/fx/tools/flow'], ['Kling AI', 'https://klingai.com']] },
  { id: 'sangtao',  name: 'Sáng tạo',          hue: 320, kind: 'blobs',    chat: true },
  { id: 'code',     name: 'Lập trình',         hue: 195, kind: 'code',     chat: true },
  { id: 'mkt',      name: 'Marketing & Maps',  hue: 22,  kind: 'chart',    chat: true },
  { id: 'doisong',  name: 'Đời sống',          hue: 90,  kind: 'blobs',    chat: true },
];
export const GUIDE_STEPS = [
  {
    num: '01',
    title: 'Chọn đúng nhóm prompt',
    body: 'Mỗi nhóm (Học Hóa, Toán, Viết, Tạo ảnh, Lập trình…) có phong cách viết khác nhau. Chọn nhóm khớp với việc bạn đang làm để AI trả lời đúng ngữ cảnh.',
    tips: [
      'Học Hóa / Toán / Lý → dùng cho bài tập, lý thuyết, ôn thi',
      'Tạo ảnh / video → prompt viết bằng tiếng Anh, dán vào công cụ AI',
      'Marketing → dùng cho Google Maps, Facebook, TikTok',
    ],
  },
  {
    num: '02',
    title: 'Điền các ô có dấu {{…}}',
    body: 'Prompt có các biến dạng {{lớp}}, {{chủ đề}}, {{đề bài}}… Bạn điền càng chi tiết, AI trả lời càng sát. Ô nào bỏ trống sẽ giữ nguyên dạng [tên biến] trong prompt — không sao, AI vẫn hiểu.',
    tips: [
      'Ví dụ: {{lớp}} → "Lớp 11", {{chủ đề}} → "Ancol – Phenol"',
      'Ô dài (đề bài, code, văn bản) có thể dán nhiều dòng',
      'Bấm "Đặt lại" nếu muốn quay về bản gốc sau khi sửa',
    ],
  },
  {
    num: '03',
    title: 'Xem trước — chỉnh trực tiếp',
    body: 'Khung "Prompt hoàn chỉnh" hiển thị bản đã điền. Bạn có thể sửa trực tiếp trong khung này để thêm yêu cầu riêng (ví dụ: "viết ngắn hơn", "cho 3 ví dụ").',
    tips: [
      'Số ô chưa điền hiển thị ngay phía trên — nhắc bạn đừng bỏ sót',
      'Sửa trực tiếp sẽ ghi đè lên bản điền tự động',
    ],
  },
  {
    num: '04',
    title: 'Chọn nơi gửi',
    body: 'Bạn có 4 lựa chọn: Hỏi AI của web (miễn phí, có quota), ChatGPT, Claude, hoặc sao chép để dán vào công cụ khác.',
    tips: [
      'Hỏi AI của web → tự chuyển sang trang chat, giữ nguyên prompt',
      'Sao chép → dán vào bất kỳ AI nào bạn muốn',
      'Prompt quá dài (> 7000 ký tự) sẽ không gửi qua URL được — phải sao chép',
    ],
  },
  {
    num: '05',
    title: 'Lưu prompt hay dùng lại',
    body: 'Bấm ngôi sao trên thẻ để lưu vào mục "Đã lưu". Lần sau vào tab "Đã lưu" là thấy ngay, không cần tìm lại.',
    tips: [
      'Lưu được lưu trong localStorage — chỉ trên máy bạn',
      'Bấm sao lần 2 để bỏ lưu',
      'Sao chép nhanh: bấm icon copy trên thẻ, không cần mở chi tiết',
    ],
  },
  {
    num: '06',
    title: 'Mẹo viết prompt hiệu quả',
    body: 'AI trả lời tốt khi prompt có: vai trò (bạn là…), nhiệm vụ (hãy…), ràng buộc (không quá… từ), định dạng (trình bày dạng bảng).',
    tips: [
      'Càng cụ thể càng tốt: "viết 200 từ" > "viết ngắn"',
      'Cho ví dụ mẫu nếu muốn AI bắt chước giọng văn',
      'Yêu cầu AI tự kiểm tra lại kết quả trước khi trả lời',
      'Nếu AI trả lời lan man, thêm: "chỉ trả lời đúng câu hỏi, không giải thích thêm"',
    ],
  },
];