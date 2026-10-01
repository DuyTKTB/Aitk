import { useState, useMemo } from 'react';
import {
  IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconNote, IconTarget, IconQuiz,
  IconGamepad, IconUser, IconCalc,
} from './Icons.jsx';
import {
  CAT_ICONS, CAT_NAMES, IconArrowUpRight, IconSearch, IconFilter,
} from './AIIcons.jsx';

// ============================================================
// CÔNG CỤ HỌC TẬP
// ============================================================
const STUDY_TOOLS = [
{ id: 'formulas', name: 'Công thức nhanh', desc: 'Tra cứu công thức Hóa học', Icon: IconCalc, tag: 'hot' },
    { id: 'analyze', name: 'Phân tích', desc: 'Phân tích hợp chất, phản ứng', Icon: IconMicroscope },
  { id: 'balance', name: 'Cân bằng PTHH', desc: 'Nhập phương trình, ra hệ số', Icon: IconScale, tag: 'hot' },
  { id: 'pomodoro', name: 'Pomodoro', desc: 'Tập trung sâu, nghỉ đúng lúc', Icon: IconTimer },
  { id: 'exam', name: 'Kỳ thi', desc: 'Đếm ngược tới ngày quyết định', Icon: IconCalendar },
  { id: 'notes', name: 'Ghi chú', desc: 'Ghi chú nhanh, lưu trữ', Icon: IconNote },
  { id: 'grade', name: 'Tính điểm', desc: 'Cần bao nhiêu để đạt mục tiêu', Icon: IconTarget },
  { id: 'quiz', name: 'Ôn tập', desc: 'Quiz thông minh, nhớ lâu hơn', Icon: IconQuiz },
  { id: 'games', name: 'Trò chơi', desc: 'Giáo viên tự nhập câu hỏi', Icon: IconGamepad, tag: 'new' },
  { id: 'profile', name: 'Trang cá nhân', desc: 'Quản lý tài khoản, thống kê', Icon: IconUser },
];

// ============================================================
// DỮ LIỆU AI TOOLS (parse từ new.txt)
// Format: cat|name|domain|descnpm run dev
const RAW_AI_DATA = `
chat|Grok|grok.com|AI của xAI, có dữ liệu X (Twitter) thời gian thực
chat|Microsoft Copilot|copilot.microsoft.com|Trợ lý AI của Microsoft, tích hợp Bing và Office
chat|Pi|pi.ai|Trò chuyện nhẹ nhàng, thân thiện như người bạn
chat|Z.ai (GLM)|chat.z.ai|Chatbot GLM của Zhipu, mạnh về code và lập luận
chat|Doubao|doubao.com|Chatbot AI của ByteDance, đa phương thức
chat|ERNIE Bot|yiyan.baidu.com|AI của Baidu, mạnh tiếng Trung
chat|Cohere Coral|coral.cohere.com|Chat AI doanh nghiệp, có trích dẫn nguồn
chat|Venice AI|venice.ai|Chat AI riêng tư, không lưu hội thoại
chat|DuckDuckGo AI Chat|duck.ai|Chat ẩn danh với nhiều model, không cần tài khoản
chat|Brave Leo|brave.com/leo|Trợ lý AI tích hợp ngay trong trình duyệt Brave
chat|Monica|monica.im|Trợ lý AI trong trình duyệt, gom nhiều model
chat|Merlin|getmerlin.in|Tiện ích Chrome gọi GPT, Claude, Gemini
chat|Genspark|genspark.ai|Tìm kiếm AI, tự tổng hợp trang trả lời
chat|Felo|felo.ai|Tìm kiếm AI đa ngôn ngữ, hỗ trợ tiếng Việt
chat|LMArena|lmarena.ai|So sánh model AI ẩn danh, bình chọn đối đầu
chat|OpenRouter Chat|openrouter.ai/chat|Chat với hàng trăm model qua một giao diện
chat|Google AI Studio|aistudio.google.com|Thử Gemini mới nhất, tinh chỉnh prompt
chat|MiniMax Agent|agent.minimax.io|Agent AI của MiniMax, làm việc nhiều bước
write|Sudowrite|sudowrite.com|Trợ lý viết truyện, tiểu thuyết sáng tạo
write|Hemingway Editor|hemingwayapp.com|Làm câu văn tiếng Anh gọn, dễ đọc
write|LanguageTool|languagetool.org|Kiểm tra chính tả, ngữ pháp nhiều ngôn ngữ
write|ProWritingAid|prowritingaid.com|Soát lỗi và nâng cấp văn phong chi tiết
write|Paperpal|paperpal.com|Chỉnh sửa bài báo khoa học bằng AI
write|Jenni AI|jenni.ai|Viết luận, bài nghiên cứu có trích dẫn
write|GPTZero|gptzero.me|Phát hiện văn bản do AI viết
write|Copyleaks|copyleaks.com|Kiểm tra đạo văn và nội dung AI
write|Anyword|anyword.com|Viết quảng cáo, dự đoán hiệu quả nội dung
write|Hypotenuse AI|hypotenuse.ai|Viết mô tả sản phẩm, blog hàng loạt
write|Frase|frase.io|Nghiên cứu và viết bài chuẩn SEO
write|TextCortex|textcortex.com|Trợ lý viết trên mọi website
write|Simplified|simplified.com|Viết, thiết kế, lên lịch social một nơi
write|Lex|lex.page|Trình soạn thảo tối giản có AI hỗ trợ
write|Writer|writer.com|AI viết cho doanh nghiệp, giữ giọng thương hiệu
write|Smodin|smodin.io|Viết lại, tóm tắt, kiểm tra đạo văn
write|Ludwig|ludwig.guru|Tìm câu ví dụ thực tế cho tiếng Anh
write|Novelcrafter|novelcrafter.com|Lập cốt truyện, viết tiểu thuyết có AI
write|Squibler|squibler.io|Viết sách, kịch bản từ ý tưởng
write|DeepL Write|deepl.com/write|Trau chuốt câu văn tiếng Anh, Đức
image|Krea|krea.ai|Tạo ảnh thời gian thực, nâng độ phân giải
image|Recraft|recraft.ai|Tạo ảnh, vector, logo nhất quán phong cách
image|FLUX|bfl.ai|Model tạo ảnh chất lượng cao của Black Forest Labs
image|Freepik AI|freepik.com/ai|Tạo ảnh, video AI kèm kho tài nguyên
image|Lexica|lexica.art|Kho prompt và tạo ảnh AI
image|NightCafe|nightcafe.studio|Tạo ảnh AI nhiều model, có cộng đồng
image|Craiyon|craiyon.com|Tạo ảnh AI đơn giản, không cần đăng ký
image|Bing Image Creator|bing.com/images/create|Tạo ảnh bằng DALL·E miễn phí
image|Whisk|labs.google/fx/tools/whisk|Trộn ảnh làm prompt để tạo ảnh mới
image|ImageFX|labs.google/fx/tools/image-fx|Tạo ảnh bằng Imagen của Google
image|Magnific|magnific.ai|Nâng cấp ảnh, thêm chi tiết bằng AI
image|Topaz Labs|topazlabs.com|Tăng nét ảnh, video chuyên nghiệp
image|Let's Enhance|letsenhance.io|Phóng to và làm nét ảnh
image|Photoroom|photoroom.com|Xóa nền, chụp ảnh sản phẩm bằng AI
image|Pixlr|pixlr.com|Chỉnh sửa ảnh online có công cụ AI
image|Photopea|photopea.com|Photoshop trên trình duyệt, miễn phí
image|Cleanup.pictures|cleanup.pictures|Xóa vật thể, chữ thừa khỏi ảnh
image|Vectorizer.ai|vectorizer.ai|Chuyển ảnh bitmap sang vector
image|Looka|looka.com|Tạo logo và bộ nhận diện thương hiệu
image|Brandmark|brandmark.io|Thiết kế logo bằng AI
image|Khroma|khroma.co|Tạo bảng màu theo gu của bạn
image|Uizard|uizard.io|Biến phác thảo thành giao diện app, web
image|Stitch|stitch.withgoogle.com|Google tạo UI từ mô tả hoặc ảnh
image|Framer|framer.com|Dựng website bằng AI, xuất bản ngay
image|Visily|visily.ai|Thiết kế wireframe, mockup nhanh
image|Dzine|dzine.ai|Thiết kế, chỉnh ảnh AI chi tiết
image|Hotpot AI|hotpot.ai|Tạo ảnh, chỉnh ảnh, thiết kế đa năng
image|Artbreeder|artbreeder.com|Pha trộn, phát triển ảnh nghệ thuật
image|Tensor.Art|tensor.art|Tạo ảnh AI với nhiều model cộng đồng
image|Civitai|civitai.com|Kho model và LoRA cho Stable Diffusion
image|SeaArt|seaart.ai|Tạo ảnh AI phong cách anime, nghệ thuật
image|Picsart|picsart.com|Chỉnh ảnh, video với nhiều công cụ AI
image|Adobe Express|adobe.com/express|Thiết kế nhanh, tích hợp Firefly
image|Microsoft Designer|designer.microsoft.com|Thiết kế poster, bài đăng mạng xã hội
image|Remini|remini.ai|Làm nét và phục hồi ảnh cũ
video|Sora|sora.com|Tạo video AI từ văn bản của OpenAI
video|Google Flow|labs.google/fx/tools/flow|Làm phim AI với Veo của Google
video|Luma Dream Machine|lumalabs.ai/dream-machine|Tạo video điện ảnh từ chữ hoặc ảnh
video|Kling AI|klingai.com|Video AI chân thực, chuyển động mượt
video|Hailuo AI|hailuoai.video|Tạo video AI của MiniMax
video|PixVerse|pixverse.ai|Tạo video AI nhanh, nhiều hiệu ứng
video|Vidu|vidu.com|Tạo video AI từ ảnh tham chiếu
video|Genmo|genmo.ai|Tạo video AI từ mô tả
video|Higgsfield|higgsfield.ai|Điều khiển chuyển động camera video AI
video|Hedra|hedra.com|Làm nhân vật nói, hát từ ảnh và giọng
video|D-ID|d-id.com|Cho ảnh chân dung biết nói
video|Colossyan|colossyan.com|Video đào tạo với người dẫn AI
video|Elai.io|elai.io|Tạo video thuyết trình từ bài viết
video|Fliki|fliki.ai|Biến văn bản thành video có giọng đọc
video|Opus Clip|opus.pro|Cắt video dài thành clip ngắn viral
video|Submagic|submagic.co|Tự thêm phụ đề sinh động cho video ngắn
video|Vizard|vizard.ai|Cắt clip ngắn, phụ đề tự động
video|Klap|klap.app|Biến video dài thành Shorts, Reels
video|Captions|captions.ai|Phụ đề, chỉnh video ngắn trên điện thoại
video|Wisecut|wisecut.video|Tự cắt khoảng lặng, thêm nhạc nền
video|Kapwing|kapwing.com|Biên tập video online cộng tác
video|Clipchamp|clipchamp.com|Biên tập video của Microsoft
video|Steve AI|steve.ai|Tạo video hoạt hình, minh họa từ chữ
video|Animoto|animoto.com|Làm video quảng cáo từ ảnh nhanh gọn
video|Moonvalley|moonvalley.com|Tạo video AI dùng dữ liệu được cấp phép
video|Wan|wan.video|Model video mã nguồn mở của Alibaba
video|LTX Studio|ltx.studio|Dựng storyboard và phim bằng AI
video|Viggle|viggle.ai|Cho nhân vật chuyển động theo video mẫu
video|DomoAI|domoai.app|Biến video, ảnh thành anime
video|Filmora|filmora.wondershare.com|Biên tập video có nhiều tính năng AI
audio|Murf|murf.ai|Giọng đọc AI cho video, quảng cáo
audio|Play.ht|play.ht|Text-to-speech và nhân bản giọng nói
audio|WellSaid|wellsaid.io|Giọng đọc AI tự nhiên cho doanh nghiệp
audio|Speechify|speechify.com|Đọc văn bản thành giọng nói
audio|NaturalReader|naturalreaders.com|Đọc tài liệu thành giọng nói
audio|Resemble AI|resemble.ai|Nhân bản và tạo giọng nói AI
audio|Fish Audio|fish.audio|Giọng AI đa ngôn ngữ, clone giọng
audio|Vbee|vbee.vn|Giọng đọc AI tiếng Việt cho video, podcast
audio|FPT.AI|fpt.ai|Bộ AI tiếng Việt: giọng nói, chatbot
audio|Viettel AI|viettelai.vn|Giọng đọc và nhận dạng tiếng Việt
audio|Zalo AI|zalo.ai|Dịch vụ AI giọng nói của Zalo
audio|Fireflies|fireflies.ai|Ghi và tóm tắt cuộc họp tự động
audio|Fathom|fathom.video|Ghi chú họp Zoom, Meet tự động
audio|Notta|notta.ai|Phiên âm và dịch họp theo thời gian thực
audio|Rev|rev.com|Phiên âm, phụ đề chính xác
audio|Trint|trint.com|Chuyển lời thoại thành văn bản có thể sửa
audio|Riverside|riverside.fm|Thu podcast, video chất lượng studio
audio|Adobe Podcast|podcast.adobe.com|Khử ồn, làm giọng thu như phòng thu
audio|Auphonic|auphonic.com|Cân âm lượng, làm sạch audio tự động
audio|Cleanvoice|cleanvoice.ai|Xóa tạp âm, từ đệm trong podcast
audio|Krisp|krisp.ai|Khử tiếng ồn khi họp, gọi
audio|LALAL.AI|lalal.ai|Tách giọng hát và nhạc cụ khỏi bài hát
audio|Moises|moises.ai|Tách stem, đổi tông, tập chơi nhạc
audio|Soundraw|soundraw.io|Tạo nhạc nền theo thể loại, tâm trạng
audio|AIVA|aiva.ai|Sáng tác nhạc cổ điển, nhạc phim bằng AI
audio|Mubert|mubert.com|Nhạc nền AI cho video, livestream
audio|Beatoven|beatoven.ai|Nhạc nền theo cảm xúc cho video
audio|Boomy|boomy.com|Tạo bài hát nhanh, phát hành lên nền tảng
audio|Stable Audio|stableaudio.com|Tạo nhạc, hiệu ứng âm thanh từ mô tả
audio|Voicemod|voicemod.net|Đổi giọng thời gian thực, soundboard
study|NotebookLM|notebooklm.google.com|Hỏi đáp trên tài liệu của bạn, tạo podcast tóm tắt
study|Brainly|brainly.com|Cộng đồng hỏi đáp bài tập có AI
study|StudyFetch|studyfetch.com|Tạo flashcard, quiz từ bài giảng
study|Quizgecko|quizgecko.com|Tạo câu hỏi trắc nghiệm từ văn bản
study|Knowt|knowt.com|Flashcard, ghi chú AI thay thế Quizlet
study|Coconote|coconote.app|Ghi âm giờ học, tự tạo ghi chú
study|GeoGebra|geogebra.org|Toán trực quan: hình học, đồ thị
study|Desmos|desmos.com|Vẽ đồ thị hàm số trực tuyến
study|PhET|phet.colorado.edu|Mô phỏng Hóa, Lý, Toán tương tác
study|MolView|molview.org|Xem cấu trúc phân tử 3D, vẽ công thức
study|PubChem|pubchem.ncbi.nlm.nih.gov|Tra cứu hợp chất, tính chất, cấu trúc
study|ChemSpider|chemspider.com|Cơ sở dữ liệu cấu trúc hóa học
study|Chemix|chemix.org|Vẽ thí nghiệm hóa học, sơ đồ phòng lab
study|Labster|labster.com|Phòng thí nghiệm ảo cho Hóa, Sinh
study|Microsoft Math Solver|mathsolver.microsoft.com|Giải toán từng bước, hỗ trợ chụp ảnh
study|QANDA|qanda.ai|Chụp bài toán, nhận lời giải chi tiết
study|Gauthmath|gauthmath.com|Giải bài tập qua ảnh chụp
study|Praktika|praktika.ai|Gia sư tiếng Anh AI nói chuyện trực tiếp
study|ELSA Speak|elsaspeak.com|Luyện phát âm tiếng Anh bằng AI
study|Speak|speak.com|Luyện nói ngoại ngữ cùng gia sư AI
study|Busuu|busuu.com|Học ngoại ngữ có AI chấm bài
study|RemNote|remnote.com|Ghi chú kết hợp flashcard lặp lại ngắt quãng
study|Mindgrasp|mindgrasp.ai|Tóm tắt bài giảng, video, tài liệu
study|MagicSchool|magicschool.ai|Trợ lý AI giúp giáo viên soạn bài
study|Curipod|curipod.com|Tạo bài giảng tương tác trong vài giây
study|Kahoot|kahoot.com|Trò chơi hỏi đáp, AI tạo câu hỏi
study|Quizizz|quizizz.com|Quiz tương tác, AI tạo câu hỏi
code|Windsurf|windsurf.com|IDE AI có agent tự code theo ngữ cảnh
code|Claude Code|claude.com/product/claude-code|Agent lập trình chạy ngay trong terminal
code|OpenAI Codex|openai.com/codex|Agent code của OpenAI, làm việc song song
code|Gemini CLI|github.com/google-gemini/gemini-cli|Gemini ngay trong dòng lệnh, mã nguồn mở
code|Cline|cline.bot|Agent code trong VS Code, mã nguồn mở
code|Continue|continue.dev|Trợ lý code mã nguồn mở, tự chọn model
code|Aider|aider.chat|Lập trình cặp với AI qua terminal
code|Zed|zed.dev|Editor siêu nhanh có AI tích hợp
code|Bolt.new|bolt.new|Dựng và deploy app web từ một câu lệnh
code|Lovable|lovable.dev|Tạo app full-stack bằng trò chuyện
code|v0|v0.dev|Sinh giao diện React, Tailwind từ mô tả
code|Firebase Studio|firebase.studio|Dựng app có AI ngay trên đám mây
code|Jules|jules.google|Agent code bất đồng bộ của Google
code|Devin|devin.ai|Kỹ sư phần mềm AI tự làm task
code|Amazon Q Developer|aws.amazon.com/q/developer|Trợ lý code, debug cho dev AWS
code|JetBrains AI|jetbrains.com/ai|AI trong IntelliJ, PyCharm, WebStorm
code|Qodo|qodo.ai|Tự viết test, review code
code|Bito|bito.ai|Review code, giải thích code nhanh
code|CodeRabbit|coderabbit.ai|Review pull request tự động bằng AI
code|Sourcery|sourcery.ai|Refactor và review code Python
code|Warp|warp.dev|Terminal hiện đại có AI
code|Pieces|pieces.app|Lưu snippet, ngữ cảnh code có AI
code|Greptile|greptile.com|AI hiểu toàn bộ codebase của bạn
code|Base44|base44.com|Tạo app hoàn chỉnh chỉ bằng mô tả
code|Anything|createanything.com|Dựng web, mobile app bằng prompt
code|Rork|rork.com|Tạo app mobile React Native bằng AI
code|Trae|trae.ai|IDE AI của ByteDance
code|Kiro|kiro.dev|IDE AI lập trình theo đặc tả
code|Mintlify|mintlify.com|Tự tạo tài liệu kỹ thuật đẹp
trans|Reverso|reverso.net|Dịch kèm ví dụ ngữ cảnh, chia động từ
trans|Papago|papago.naver.com|Dịch mạnh tiếng Hàn, Nhật
trans|Microsoft Translator|translator.microsoft.com|Dịch văn bản, hội thoại đa ngôn ngữ
trans|Linguee|linguee.com|Từ điển song ngữ dẫn từ văn bản thật
trans|Immersive Translate|immersivetranslate.com|Dịch song ngữ ngay trên trang web, PDF
trans|Kagi Translate|translate.kagi.com|Dịch bằng LLM, hiểu sắc thái
trans|Smartcat|smartcat.com|Nền tảng dịch thuật AI cộng tác
trans|Talkpal|talkpal.ai|Luyện nói ngoại ngữ với AI
trans|Jisho|jisho.org|Từ điển Nhật–Anh, tra Kanji chi tiết
trans|Mazii|mazii.net|Từ điển Nhật–Việt, luyện tiếng Nhật
trans|Rask AI|rask.ai|Dịch và lồng tiếng video 130+ ngôn ngữ
search|Exa|exa.ai|Tìm kiếm bằng AI hiểu ngữ nghĩa
search|Tavily|tavily.com|API tìm kiếm cho AI agent
search|Scite|scite.ai|Xem bài báo được trích dẫn ủng hộ hay phản bác
search|SciSpace|scispace.com|Đọc, giải thích bài báo khoa học
search|Semantic Scholar|semanticscholar.org|Tìm bài báo với tóm tắt AI
search|Connected Papers|connectedpapers.com|Vẽ bản đồ các bài báo liên quan
search|ResearchRabbit|researchrabbit.ai|Khám phá tài liệu như tạo playlist
search|Litmaps|litmaps.com|Theo dõi và khám phá tài liệu nghiên cứu
search|Undermind|undermind.ai|Tìm tài liệu học thuật chuyên sâu
search|iAsk|iask.ai|Hỏi đáp AI miễn phí, có nguồn
search|Brave Search|search.brave.com|Tìm kiếm riêng tư kèm tóm tắt AI
search|ChatPDF|chatpdf.com|Trò chuyện với file PDF
search|AskYourPDF|askyourpdf.com|Hỏi đáp trên tài liệu PDF
search|Humata|humata.ai|Hỏi đáp, tóm tắt tài liệu dài
search|PDF.ai|pdf.ai|Chat với PDF, trích dẫn nguồn
search|Explainpaper|explainpaper.com|Bôi đen đoạn khó, AI giải thích
search|Google Scholar|scholar.google.com|Tìm bài báo, trích dẫn học thuật
work|Mem|mem.ai|Ghi chú AI tự sắp xếp và nhắc lại
work|Taskade|taskade.com|Quản lý việc, agent AI trong một nơi
work|Motion|usemotion.com|Tự xếp lịch công việc theo ưu tiên
work|Reclaim|reclaim.ai|Tự giữ thời gian cho việc quan trọng
work|Superhuman|superhuman.com|Email nhanh có AI soạn và tóm tắt
work|Shortwave|shortwave.ai|Hộp thư Gmail tích hợp AI
work|Microsoft 365 Copilot|microsoft.com/microsoft-365/copilot|AI trong Word, Excel, PowerPoint
work|Slidesgo|slidesgo.com|Mẫu slide đẹp, có trình tạo AI
work|SlidesAI|slidesai.io|Tạo slide Google từ văn bản
work|Pitch|pitch.com|Làm deck thuyết trình cộng tác với AI
work|Prezi|prezi.com|Thuyết trình phi tuyến có AI
work|Decktopus|decktopus.com|Tạo deck nhanh kèm ghi chú diễn thuyết
work|Presentations.ai|presentations.ai|Slide thiết kế tự động từ nội dung
work|Formula Bot|formulabot.com|Viết công thức Excel, Sheets bằng mô tả
work|Rows|rows.com|Bảng tính có AI phân tích và import
work|Julius AI|julius.ai|Phân tích dữ liệu, vẽ biểu đồ bằng chat
work|Airtable AI|airtable.com/ai|Cơ sở dữ liệu dạng bảng có AI
work|Coda|coda.io|Tài liệu, bảng tính, app có AI
work|ClickUp Brain|clickup.com/brain|AI quản lý dự án, viết mô tả task
work|Miro AI|miro.com/ai|Bảng trắng cộng tác, AI gom ý tưởng
work|Whimsical|whimsical.com|Vẽ sơ đồ, mindmap có AI
work|Mapify|mapify.so|Biến video, PDF thành mindmap
work|Xmind AI|xmind.ai|Mindmap tự sinh từ chủ đề
work|Napkin AI|napkin.ai|Biến đoạn văn thành sơ đồ, infographic
work|Eraser|eraser.io|Vẽ sơ đồ kỹ thuật từ mô tả
work|tl;dv|tldv.io|Ghi và tóm tắt họp Meet, Zoom, Teams
biz|HubSpot AI|hubspot.com/artificial-intelligence|AI cho marketing, bán hàng, CRM
biz|Predis.ai|predis.ai|Tạo bài đăng mạng xã hội kèm ảnh, caption
biz|Ocoya|ocoya.com|Viết, thiết kế và lên lịch bài social
biz|Buffer|buffer.com|Lên lịch đăng, AI gợi ý caption
biz|Later|later.com|Lên lịch Instagram, TikTok trực quan
biz|FeedHive|feedhive.com|Lên lịch bài, AI dự đoán hiệu quả
biz|Metricool|metricool.com|Quản lý và phân tích mạng xã hội
biz|Publer|publer.io|Lên lịch đa nền tảng, tạo caption AI
biz|Typefully|typefully.com|Viết, lên lịch thread X, LinkedIn
biz|SocialBee|socialbee.com|Quản lý nội dung, lịch đăng tự động
biz|AdCreative.ai|adcreative.ai|Tạo banner, ads tối ưu chuyển đổi
biz|Pencil|trypencil.com|Tạo và dự đoán hiệu quả quảng cáo
biz|Madgicx|madgicx.com|Tối ưu quảng cáo Meta bằng AI
biz|Semrush|semrush.com|SEO, nghiên cứu từ khóa có trợ lý AI
biz|Surfer SEO|surferseo.com|Tối ưu bài viết theo top Google
biz|MarketMuse|marketmuse.com|Lập kế hoạch nội dung chuẩn chủ đề
biz|Brand24|brand24.com|Theo dõi nhắc đến thương hiệu trên mạng
biz|Intercom Fin|intercom.com/fin|Agent AI chăm sóc khách hàng
biz|Tidio|tidio.com|Chatbot AI cho website bán hàng
biz|ManyChat|manychat.com|Chatbot Messenger, Instagram tự trả lời
biz|Chatfuel|chatfuel.com|Tạo chatbot Messenger, WhatsApp
biz|Botpress|botpress.com|Xây chatbot, agent AI cho doanh nghiệp
biz|Voiceflow|voiceflow.com|Thiết kế chatbot, voice agent
biz|Respond.io|respond.io|Hộp thư đa kênh, chatbot AI
biz|Lemlist|lemlist.com|Cold email cá nhân hóa bằng AI
biz|Instantly|instantly.ai|Gửi email lạnh quy mô lớn
biz|Apollo|apollo.io|Tìm khách hàng tiềm năng, tự động outreach
biz|Clay|clay.com|Làm giàu dữ liệu khách hàng bằng AI
biz|Birdeye|birdeye.com|Quản lý đánh giá Google Maps, trả lời bằng AI
biz|Localo|localo.com|Tối ưu Google Business Profile bằng AI
biz|Local Falcon|localfalcon.com|Đo thứ hạng Google Maps theo từng vị trí
biz|BrightLocal|brightlocal.com|SEO địa phương, theo dõi đánh giá, thứ hạng
biz|Whitespark|whitespark.ca|Công cụ SEO địa phương và citation
biz|Pomelli|labs.google/pomelli|Google tạo chiến dịch marketing theo thương hiệu
agent|Zapier|zapier.com|Kết nối hàng nghìn app, tự động hóa bằng AI
agent|Make|make.com|Xây quy trình tự động dạng sơ đồ trực quan
agent|n8n|n8n.io|Tự động hóa mã nguồn mở, tự host được
agent|Lindy|lindy.ai|Tạo trợ lý AI làm việc thay bạn
agent|Relay.app|relay.app|Quy trình tự động có bước duyệt của con người
agent|Gumloop|gumloop.com|Kéo thả xây workflow AI
agent|Flowise|flowiseai.com|Dựng chatbot LLM bằng giao diện kéo thả
agent|Dify|dify.ai|Nền tảng xây app, agent LLM mã nguồn mở
agent|Langflow|langflow.org|Dựng luồng agent AI trực quan
agent|CrewAI|crewai.com|Điều phối nhiều agent AI cùng làm việc
agent|AutoGPT|agpt.co|Agent tự chia nhỏ và hoàn thành mục tiêu
agent|Manus|manus.im|Agent AI đa năng làm việc nhiều bước
agent|Browserbase|browserbase.com|Trình duyệt đám mây cho AI agent
agent|Browser Use|browser-use.com|Cho AI điều khiển trình duyệt
agent|Bardeen|bardeen.ai|Tự động hóa việc lặp lại ngay trên trình duyệt
agent|Axiom.ai|axiom.ai|Bot trình duyệt không cần code
agent|Dust|dust.tt|Agent AI nội bộ kết nối dữ liệu công ty
agent|Glean|glean.com|Tìm kiếm và trợ lý AI trong công ty
agent|MindStudio|mindstudio.ai|Tạo agent AI không cần code
agent|Coze|coze.com|Tạo chatbot, plugin của ByteDance
agent|Pipedream|pipedream.com|Tự động hóa cho dev, tích hợp API
agent|IFTTT|ifttt.com|Nối app theo kiểu nếu–thì, có AI
agent|Activepieces|activepieces.com|Tự động hóa mã nguồn mở thay Zapier
agent|Stack AI|stack-ai.com|Xây agent, workflow AI doanh nghiệp
agent|Vapi|vapi.ai|Xây agent giọng nói gọi điện
agent|Retell AI|retellai.com|Nhân viên gọi điện bằng giọng AI
agent|Sintra|sintra.ai|Bộ trợ lý AI cho chủ doanh nghiệp nhỏ
model|Kaggle|kaggle.com|Dataset, notebook, cuộc thi khoa học dữ liệu
model|Google Colab|colab.research.google.com|Chạy Python, GPU miễn phí trên trình duyệt
model|Together AI|together.ai|Chạy model mã nguồn mở qua API
model|Fireworks AI|fireworks.ai|Suy luận model nhanh, tinh chỉnh dễ
model|Cerebras|cerebras.ai|Suy luận siêu nhanh cho model lớn
model|SambaNova|sambanova.ai|Chạy model mở tốc độ cao
model|NVIDIA Build|build.nvidia.com|Thử model AI của NVIDIA ngay trên web
model|GitHub Models|github.com/marketplace/models|Thử và so sánh model ngay trong GitHub
model|Ollama|ollama.com|Chạy LLM ngay trên máy tính của bạn
model|LM Studio|lmstudio.ai|Tải, chạy model cục bộ có giao diện đẹp
model|Jan|jan.ai|Chat AI offline, riêng tư hoàn toàn
model|GPT4All|gpt4all.io|Chạy LLM cục bộ, không cần GPU
model|Open WebUI|openwebui.com|Giao diện chat tự host cho model cục bộ
model|ComfyUI|comfy.org|Dựng pipeline tạo ảnh bằng node
model|InvokeAI|invoke.com|Studio tạo ảnh AI chuyên nghiệp
model|Roboflow|roboflow.com|Gán nhãn, huấn luyện model thị giác
model|Teachable Machine|teachablemachine.withgoogle.com|Huấn luyện model ảnh, âm thanh không cần code
model|Weights & Biases|wandb.ai|Theo dõi thí nghiệm huấn luyện model
model|Gradio|gradio.app|Tạo demo web cho model trong vài dòng code
model|Streamlit|streamlit.io|Dựng app dữ liệu bằng Python
model|Observable|observablehq.com|Notebook trực quan hóa dữ liệu
model|Hex|hex.tech|Phân tích dữ liệu cộng tác kèm AI
model|Akkio|akkio.com|Dự đoán dữ liệu không cần code
model|Dataset Search|datasetsearch.research.google.com|Tìm bộ dữ liệu trên toàn web
model|OpenRouter|openrouter.ai|Một API cho hàng trăm model AI
model|Artificial Analysis|artificialanalysis.ai|So sánh tốc độ, giá, chất lượng model
fun|Chai|chai-research.com|Chat với nhân vật AI do cộng đồng tạo
fun|Talkie|talkie-ai.com|Bạn đồng hành AI, nhân vật tùy chỉnh
fun|Inworld|inworld.ai|Tạo nhân vật AI có tính cách cho game
fun|Quick, Draw!|quickdraw.withgoogle.com|Vẽ nhanh để AI đoán hình
fun|AutoDraw|autodraw.com|AI nhận nét vẽ tay và gợi ý hình đẹp
fun|WOMBO Dream|dream.ai|Tạo tranh nghệ thuật AI trên điện thoại
fun|Hidden Door|hiddendoor.co|Chơi truyện nhập vai theo thế giới sách
fun|Magenta|magenta.tensorflow.org|Thử nghiệm AI sáng tạo nhạc, nghệ thuật
fun|AI Experiments|experiments.withgoogle.com|Các thí nghiệm AI vui của Google
game|Meshy|meshy.ai|Tạo mô hình 3D từ chữ hoặc ảnh
game|Tripo|tripo3d.ai|Tạo model 3D chất lượng cao trong vài giây
game|Rodin|hyper3d.ai|Tạo model 3D chi tiết từ ảnh
game|Scenario|scenario.com|Tạo tài sản game đồng nhất phong cách
game|Layer|layer.ai|Sinh asset game, ảnh nhất quán cho studio
game|Mixamo|mixamo.com|Rig và animation nhân vật 3D
game|Cascadeur|cascadeur.com|Tạo animation nhân vật vật lý hợp lý
game|Skybox AI|skybox.blockadelabs.com|Tạo bầu trời, môi trường 360°
game|Luma AI|lumalabs.ai|Quét cảnh thực thành 3D
game|Polycam|poly.cam|Quét 3D bằng điện thoại
game|Sloyd|sloyd.ai|Sinh model 3D nhẹ cho game
game|CSM|csm.ai|Biến ảnh, video thành 3D sẵn dùng
`;

// Parse raw data thành mảng object
const parseAIData = (raw) => {
  return raw.trim().split('\n').map((line, i) => {
    const [cat, name, domain, desc] = line.split('|');
    if (!cat || !name || !domain) return null;
    const url = domain.startsWith('http') ? domain : 'https://' + domain;
    return { id: i, cat: cat.trim(), name: name.trim(), url, domain: domain.trim(), desc: (desc || '').trim() };
  }).filter(Boolean);
};

const AI_TOOLS = parseAIData(RAW_AI_DATA);

const ALL_CATS = Array.from(new Set(AI_TOOLS.map(t => t.cat)));

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ToolsPage() {
  const [tab, setTab] = useState('study');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const filteredAI = useMemo(() => {
    const q = search.toLowerCase().trim();
    return AI_TOOLS.filter(t => {
      const matchCat = activeCat === 'all' || t.cat === activeCat;
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCat]);

  const filteredStudy = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return STUDY_TOOLS;
    return STUDY_TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
    );
  }, [search]);

  const statsByCat = useMemo(() => {
    const map = {};
    AI_TOOLS.forEach(t => { map[t.cat] = (map[t.cat] || 0) + 1; });
    return map;
  }, []);

  return (
    <section className="wrap tools-page" style={{ paddingTop: '2rem', paddingBottom: '6rem', maxWidth: '1240px' }}>
      {/* HEADER */}
      <div className="tools-header">
        <h1>Công cụ</h1>
        <p className="tools-sub">
          Tổng hợp <b>{STUDY_TOOLS.length}</b> công cụ học tập +{' '}
          <b>{AI_TOOLS.length}</b> công cụ AI miễn phí
        </p>
      </div>

      {/* TABS */}
      <div className="tools-tabs">
        <button
          className={'tools-tab' + (tab === 'study' ? ' on' : '')}
          onClick={() => { setTab('study'); setSearch(''); setActiveCat('all'); }}
        >
          Học tập ({STUDY_TOOLS.length})
        </button>
        <button
          className={'tools-tab' + (tab === 'ai' ? ' on' : '')}
          onClick={() => { setTab('ai'); setSearch(''); setActiveCat('all'); }}
        >
          AI Free ({AI_TOOLS.length})
        </button>
      </div>

      {/* SEARCH */}
      <div className="tools-search">
        <IconSearch size={20} />
        <input
          type="text"
          placeholder={tab === 'ai' ? 'Tìm công cụ AI...' : 'Tìm công cụ học tập...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="tools-search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {/* CATEGORY FILTER (chỉ cho tab AI) */}
      {tab === 'ai' && (
        <div className="tools-cats">
          <button
            className={'tools-cat' + (activeCat === 'all' ? ' on' : '')}
            onClick={() => setActiveCat('all')}
          >
            <IconFilter size={14} />
            Tất cả ({AI_TOOLS.length})
          </button>
          {ALL_CATS.map(cat => {
            const Icon = CAT_ICONS[cat];
            return (
              <button
                key={cat}
                className={'tools-cat' + (activeCat === cat ? ' on' : '')}
                onClick={() => setActiveCat(cat)}
              >
                {Icon && <Icon size={14} />}
                {CAT_NAMES[cat]?.replace(/^[^\s]+\s/, '') || cat} ({statsByCat[cat]})
              </button>
            );
          })}
        </div>
      )}

      {/* RESULT COUNT */}
      <p className="tools-count">
        Hiển thị <b>{tab === 'study' ? filteredStudy.length : filteredAI.length}</b> công cụ
      </p>

      {/* GRID */}
      <div className="tools-grid">
        {tab === 'study' && filteredStudy.map(({ id, name, desc, Icon, tag }) => (
          <a key={id} href={'#' + id} className="tool-card study-card">
            {tag && <span className={'tool-badge tool-badge-' + tag}>{tag}</span>}
            <div className="tool-card-ico"><Icon /></div>
            <h3>{name}</h3>
            <p>{desc}</p>
            <span className="tool-card-arrow"><IconArrowUpRight size={16} /></span>
          </a>
        ))}

        {tab === 'ai' && filteredAI.map((tool) => {
          const Icon = CAT_ICONS[tool.cat];
          return (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-card ai-card"
            >
              <div className="tool-card-head">
                <div className={'tool-card-ico cat-' + tool.cat}>
                  {Icon ? <Icon size={22} /> : <span>🤖</span>}
                </div>
                <span className="tool-card-cat">{CAT_NAMES[tool.cat]?.replace(/^[^\s]+\s/, '') || tool.cat}</span>
              </div>
              <h3>{tool.name}</h3>
              <p>{tool.desc}</p>
              <div className="tool-card-foot">
                <span className="tool-card-domain">{tool.domain}</span>
                <span className="tool-card-arrow"><IconArrowUpRight size={14} /></span>
              </div>
            </a>
          );
        })}
      </div>

      {/* EMPTY */}
      {(tab === 'study' ? filteredStudy : filteredAI).length === 0 && (
        <div className="tools-empty">
          <p>Không tìm thấy công cụ nào phù hợp với "{search}"</p>
          <button onClick={() => setSearch('')}>Xóa tìm kiếm</button>
        </div>
      )}
    </section>
  );
}