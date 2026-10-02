// ============================================================
// DỮ LIỆU AI HOT — CUAI đầu tiên với badge Siêu VIP
// id CUAI dùng chuỗi 'cuai', các AI khác dùng số khớp RAW_AI_DATA
// ============================================================

export const RATING_META = {
  5: { label: 'Xuất sắc', color: '#16a34a' },
  4: { label: 'Rất tốt', color: '#22c55e' },
  3: { label: 'Tốt', color: '#eab308' },
  2: { label: 'Tạm được', color: '#f97316' },
  1: { label: 'Yếu', color: '#ef4444' },
};

export const PRICE_META = {
  free: { label: 'Miễn phí', color: '#16a34a', icon: '🆓' },
  freemium: { label: 'Freemium', color: '#eab308', icon: '⚡' },
  paid: { label: 'Trả phí', color: '#ef4444', icon: '💰' },
  vip: { label: 'Siêu VIP', color: '#a855f7', icon: '👑' },
};

// ============================================================
// DANH SÁCH AI HOT — CUAI ở vị trí #1
// ============================================================
const HOT = [
  // ============================================================
  // 🏆 CUAI — SẢN PHẨM CỦA CHÍNH WEB, ƯU TIÊN SỐ 1
  // ============================================================
  {
    id: 'cuai',
    rank: 1,
    cat: 'chat',
    name: 'CUAI',
    domain: 'A7 K60 DTA',
    url: '#ai',
    internal: true,
    rating: 5,
    price: 'vip',
    freeTier: true,
    vnSupport: true,
    isSuperVip: true,
    desc: 'Trợ lý Hóa học AI của A7 K60 DTA — miễn phí, không giới hạn cho học sinh',
    why: 'Đây là AI của chính chúng ta — được tối ưu riêng cho môn Hóa học THPT Việt Nam. Hiểu chương trình Lớp 10-11-12 và Đại học, giải bài tập từng bước, phân tích ảnh đề bài, không dùng LaTeX khó đọc. Miễn phí hoàn toàn, không cần đăng ký, không giới hạn lượt chat cho học sinh trong lớp. Đặc biệt: trả lời ngắn gọn, đi thẳng vào bản chất, không lan man như các AI nước ngoài.',
    bestFor: [
      'Giải bài tập Hóa học từ Lớp 10 đến Đại học',
      'Chụp ảnh đề bài — AI đọc và giải ngay',
      'Ôn thi THPT Quốc gia môn Hóa',
      'Hỏi đáp lý thuyết, công thức, phương trình',
    ],
    pros: [
      'Tiếng Việt 100%, hiểu chương trình VN',
      'Miễn phí hoàn toàn, không giới hạn',
      'Giải bài tập ngắn gọn, đúng bản chất',
      'Đọc được ảnh đề bài, không cần gõ lại',
      'Có sẵn trong web — không cần mở tab khác',
    ],
    cons: [
      'Chỉ chuyên về Hóa học (không đa năng)',
      'Cần đăng nhập để dùng đầy đủ',
    ],
    badges: [
      { type: 'supervip', label: '👑 SIÊU VIP' },
      { type: 'official', label: 'CHÍNH CHỦ' },
    ],
  },

  // ============================================================
  // CÁC AI HOT KHÁC
  // ============================================================
  {
    id: 0, rank: 2, cat: 'chat', name: 'Grok', domain: 'grok.com',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: true,
    desc: 'AI của xAI, có dữ liệu X (Twitter) thời gian thực',
    why: 'Mạnh nhất về thông tin thời gian thực — hỏi tin tức, xu hướng, sự kiện mới nhất đều trả lời chính xác. Giao diện thân thiện, giọng văn tự nhiên, không quá "robot". Miễn phí có giới hạn, VIP không giới hạn.',
    bestFor: ['Tra tin tức thời gian thực', 'Hỏi đáp nhanh hằng ngày', 'Theo dõi xu hướng X/Twitter'],
    pros: ['Dữ liệu thời gian thực', 'Giọng tự nhiên', 'Miễn phí có giới hạn'],
    cons: ['Cần tài khoản X', 'Đôi khi trả lời hơi "meme"'],
    badges: [{ type: 'top', label: 'TOP 2' }, { type: 'trend', label: 'Đang hot' }],
  },
  {
    id: 1, rank: 3, cat: 'chat', name: 'Microsoft Copilot', domain: 'copilot.microsoft.com',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: true,
    desc: 'Trợ lý AI của Microsoft, tích hợp Bing và Office',
    why: 'Tích hợp sẵn trong Windows, Edge, Word, Excel. Miễn phí mạnh — dùng được GPT-4 Turbo. Trả lời có trích dẫn nguồn, ít bịa. Tốt cho học sinh, sinh viên, dân văn phòng.',
    bestFor: ['Học tập, viết luận', 'Dùng trong Word/Excel', 'Tìm kiếm có nguồn'],
    pros: ['Miễn phí mạnh', 'Tích hợp Office', 'Có trích dẫn'],
    cons: ['Đôi khi bị giới hạn ở VN'],
    badges: [{ type: 'top', label: 'TOP 3' }, { type: 'free', label: 'Free mạnh' }],
  },
  {
    id: 16, rank: 4, cat: 'chat', name: 'Google AI Studio', domain: 'aistudio.google.com',
    rating: 5, price: 'free', freeTier: true, vnSupport: true,
    desc: 'Thử Gemini mới nhất, tinh chỉnh prompt',
    why: 'Miễn phí hoàn toàn với Gemini 2.5 Pro — model mạnh nhất của Google. Có thể tinh chỉnh temperature, system prompt, upload file, PDF, ảnh. Dành cho người muốn "vọc" AI.',
    bestFor: ['Dùng Gemini miễn phí', 'Phân tích file/PDF', 'Tinh chỉnh prompt'],
    pros: ['Miễn phí 100%', 'Gemini mới nhất', 'Nhiều tham số'],
    cons: ['Giao diện hơi "dev"', 'Không có mobile app'],
    badges: [{ type: 'top', label: 'TOP 4' }, { type: 'free', label: 'Free 100%' }],
  },
  {
    id: 4, rank: 5, cat: 'chat', name: 'Doubao', domain: 'doubao.com',
    rating: 5, price: 'free', freeTier: true, vnSupport: true,
    desc: 'Chatbot AI của ByteDance, đa phương thức',
    why: 'Miễn phí không giới hạn, model mạnh ngang GPT-4. Hỗ trợ tiếng Việt tốt, có thể upload ảnh, PDF, audio. Đặc biệt mạnh về code và toán. Ít người biết nên ít bị giới hạn.',
    bestFor: ['Chat không giới hạn', 'Code & toán', 'Upload file đa dạng'],
    pros: ['Miễn phí không giới hạn', 'Model mạnh', 'Ít người biết'],
    cons: ['Giao diện tiếng Trung', 'Cần VPN đôi khi'],
    badges: [{ type: 'free', label: 'Free unlimited' }, { type: 'hidden', label: 'Ít người biết' }],
  },
  {
    id: 15, rank: 6, cat: 'chat', name: 'LMArena', domain: 'lmarena.ai',
    rating: 5, price: 'free', freeTier: true, vnSupport: true,
    desc: 'So sánh model AI ẩn danh, bình chọn đối đầu',
    why: 'Nơi test model mới nhất miễn phí. Bạn chat với 2 model ẩn danh cùng lúc, chọn cái nào tốt hơn. Có thể dùng để "mượn" model xịn miễn phí. Cực kỳ hữu ích cho người tò mò.',
    bestFor: ['Test model mới', 'So sánh AI', 'Dùng model xịn free'],
    pros: ['Miễn phí 100%', 'Model mới nhất', 'Không cần đăng ký'],
    cons: ['Không lưu lịch sử', 'Giao diện đơn giản'],
    badges: [{ type: 'free', label: 'Free 100%' }, { type: 'trend', label: 'Dân AI dùng' }],
  },
  {
    id: 50, rank: 7, cat: 'image', name: 'Krea', domain: 'krea.ai',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: false,
    desc: 'Tạo ảnh thời gian thực, nâng độ phân giải',
    why: 'Vẽ ảnh AI theo thời gian thực — bạn vẽ nét, AI hoàn thiện ngay. Nâng cấp ảnh mờ thành 4K sắc nét. Miễn phí có giới hạn, VIP cho dân thiết kế chuyên nghiệp.',
    bestFor: ['Thiết kế concept', 'Nâng cấp ảnh cũ', 'Tạo ảnh nghệ thuật'],
    pros: ['Real-time sáng tạo', 'Nâng cấp ảnh tốt', 'UI đẹp'],
    cons: ['Free giới hạn', 'Cần máy khỏe'],
    badges: [{ type: 'top', label: 'TOP ảnh' }],
  },
  {
    id: 64, rank: 8, cat: 'video', name: 'Sora', domain: 'sora.com',
    rating: 5, price: 'paid', freeTier: false, vnSupport: false,
    desc: 'Tạo video AI từ văn bản của OpenAI',
    why: 'Model tạo video mạnh nhất hiện tại của OpenAI. Video dài tới 60 giây, chuyển động mượt, vật lý chân thực. Cần trả phí ChatGPT Plus/Pro để dùng.',
    bestFor: ['Làm phim ngắn', 'Quảng cáo cao cấp', 'Nội dung sáng tạo'],
    pros: ['Chất lượng đỉnh cao', 'Video dài', 'Vật lý chân thực'],
    cons: ['Trả phí cao', 'Chờ lâu', 'Chưa mở rộng'],
    badges: [{ type: 'top', label: 'TOP video' }],
  },
  {
    id: 134, rank: 9, cat: 'code', name: 'Bolt.new', domain: 'bolt.new',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: true,
    desc: 'Dựng và deploy app web từ một câu lệnh',
    why: 'Mô tả app bằng 1 câu, AI tự viết code, cài đặt, deploy trong 1-2 phút. Không cần biết code cũng làm được web/app. Free có token giới hạn, đủ để thử.',
    bestFor: ['Làm web nhanh', 'Prototype ý tưởng', 'Học lập trình'],
    pros: ['Cực nhanh', 'Không cần setup', 'Deploy 1 click'],
    cons: ['Free giới hạn token', 'Code đôi khi lỗi'],
    badges: [{ type: 'trend', label: 'Trend 2026' }],
  },
  {
    id: 135, rank: 10, cat: 'code', name: 'Lovable', domain: 'lovable.dev',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: true,
    desc: 'Tạo app full-stack bằng trò chuyện',
    why: 'Chat để tạo app có database, auth, payment. Không cần code. Deploy thẳng lên Vercel. Free có 5 project/tháng, đủ để thử.',
    bestFor: ['Làm SaaS', 'MVB startup', 'Không biết code'],
    pros: ['Full-stack', 'Có database', 'Deploy tự động'],
    cons: ['Free giới hạn', 'Cần biết chút khái niệm'],
    badges: [{ type: 'trend', label: 'Trend 2026' }],
  },
  {
    id: 103, rank: 11, cat: 'study', name: 'NotebookLM', domain: 'notebooklm.google.com',
    rating: 5, price: 'free', freeTier: true, vnSupport: true,
    desc: 'Hỏi đáp trên tài liệu của bạn, tạo podcast tóm tắt',
    why: 'Upload PDF, slide, video — hỏi đáp dựa trên chính tài liệu đó. Có thể tạo podcast tóm tắt tự động (2 người dẫn). Miễn phí hoàn toàn, cực tốt cho học sinh/sinh viên.',
    bestFor: ['Học từ tài liệu', 'Tóm tắt bài giảng', 'Ôn thi'],
    pros: ['Miễn phí 100%', 'Podcast tự động', 'Không bịa'],
    cons: ['Chỉ dùng tiếng Anh/Việt', 'Cần tài liệu'],
    badges: [{ type: 'free', label: 'Free 100%' }, { type: 'top', label: 'TOP học tập' }],
  },
  {
    id: 155, rank: 12, cat: 'agent', name: 'Manus', domain: 'manus.im',
    rating: 5, price: 'paid', freeTier: false, vnSupport: true,
    desc: 'Agent AI đa năng làm việc nhiều bước',
    why: 'Agent mạnh nhất 2026 — tự lên kế hoạch, tự làm nhiều bước, tự sửa lỗi. Có thể research, viết báo cáo, làm slide, code. Cần trả phí, đáng đồng tiền.',
    bestFor: ['Research chuyên sâu', 'Tự động hóa task', 'Làm báo cáo'],
    pros: ['Mạnh nhất', 'Đa năng', 'Tự sửa lỗi'],
    cons: ['Trả phí cao', 'Chờ lâu'],
    badges: [{ type: 'top', label: 'TOP agent' }],
  },
  {
    id: 126, rank: 13, cat: 'work', name: 'Napkin AI', domain: 'napkin.ai',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: true,
    desc: 'Biến đoạn văn thành sơ đồ, infographic',
    why: 'Dán đoạn văn, AI tự vẽ sơ đồ, flowchart, infographic. Cực nhanh cho thuyết trình, báo cáo. Free có giới hạn ảnh/tháng, đủ dùng cá nhân.',
    bestFor: ['Làm slide', 'Vẽ sơ đồ', 'Báo cáo'],
    pros: ['Đẹp tự động', 'Nhanh', 'Nhiều style'],
    cons: ['Free giới hạn', 'Cần chỉnh tay'],
    badges: [{ type: 'trend', label: 'Trend 2026' }],
  },
  {
    id: 3, rank: 14, cat: 'chat', name: 'Z.ai (GLM)', domain: 'chat.z.ai',
    rating: 5, price: 'free', freeTier: true, vnSupport: true,
    desc: 'Chatbot GLM của Zhipu, mạnh về code và lập luận',
    why: 'Miễn phí không giới hạn, GLM-4.6 mạnh ngang GPT-4o. Đặc biệt giỏi code, toán, lập luận. Hỗ trợ tiếng Việt tốt, giao diện tiếng Anh.',
    bestFor: ['Code miễn phí', 'Toán nâng cao', 'Chat không giới hạn'],
    pros: ['Free unlimited', 'Model mạnh', 'Code tốt'],
    cons: ['Ít phổ biến', 'Cần đăng ký'],
    badges: [{ type: 'free', label: 'Free unlimited' }, { type: 'hidden', label: 'Ít người biết' }],
  },
  {
    id: 86, rank: 15, cat: 'trans', name: 'Immersive Translate', domain: 'immersivetranslate.com',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: true,
    desc: 'Dịch song ngữ ngay trên trang web, PDF',
    why: 'Dịch song ngữ (Anh + Việt) ngay trên mọi trang web, PDF, YouTube, EPUB. Cài extension Chrome/Edge. Free có 500k ký tự/tháng, VIP không giới hạn.',
    bestFor: ['Đọc tài liệu nước ngoài', 'Xem video nước ngoài', 'Dịch PDF'],
    pros: ['Dịch song ngữ', 'Nhiều định dạng', 'Free rộng rãi'],
    cons: ['Cần cài extension', 'Free giới hạn ký tự'],
    badges: [{ type: 'top', label: 'TOP dịch' }],
  },
  {
    id: 49, rank: 16, cat: 'image', name: 'Recraft', domain: 'recraft.ai',
    rating: 5, price: 'freemium', freeTier: true, vnSupport: false,
    desc: 'Tạo ảnh, vector, logo nhất quán phong cách',
    why: 'Mạnh nhất về vector, logo, icon. Có thể tạo bộ ảnh đồng nhất phong cách — cực tốt cho thương hiệu. Free có 50 ảnh/ngày, đủ để thử.',
    bestFor: ['Logo, icon', 'Bộ nhận diện', 'Illustration'],
    pros: ['Vector tốt nhất', 'Đồng nhất style', 'Free rộng'],
    cons: ['Cần biết design cơ bản', 'Giao diện tiếng Anh'],
    badges: [{ type: 'top', label: 'TOP vector' }],
  },
];

const map = {};
HOT.forEach((t) => { map[t.id] = t; });
map.__list = HOT;

export const HOT_AI = map;