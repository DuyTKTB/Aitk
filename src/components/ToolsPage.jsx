import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconNote, IconTarget, IconQuiz,
  IconGamepad, IconUser, IconCalc,
  IconBook, IconChart, IconAtom,
} from './Icons.jsx';
import {
  CAT_ICONS, CAT_NAMES, IconArrowUpRight, IconSearch,
} from './AIIcons.jsx';
import {
  IcoClose, IcoShuffle, IcoStar, Logo, norm, stripLead, useStored,
  CompareBar, QuickView, IcoCopy, copyText, useToast,
  IcoCompare, IcoShare,
} from './ToolsKit.jsx';
import PromptLibrary from './PromptLibrary.jsx';
import { PROMPTS } from '../prompts/index.js';
import { HOT_AI, PRICE_META } from './hotData.js';
import AIMark from './AIMark.jsx';
import DocsLibrary from './DocsLibrary.jsx';
import { DOCS, GRADES } from './docsData.js';
import '../tools-all.css';
import ExamBank from './ExamBank.jsx';
import FormulaLibrary from './FormulaLibrary.jsx';
import { EXAMS } from './examData.js';
import { FORMULAS } from './formulaData.js';
import StudySheet from './StudySheet.jsx';
import CompareModal from './CompareModal.jsx';
import UpgradePrompt from './UpgradePrompt.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const STUDY_TOOLS = [
  { id: 'table', name: 'Bảng tuần hoàn', desc: 'Bảng tuần hoàn tương tác', Icon: IconAtom, tag: 'hot' },
  { id: 'formulas', name: 'Công thức nhanh', desc: 'Tra cứu công thức Hóa học', Icon: IconCalc, tag: 'hot' },
  { id: 'analyze', name: 'Phân tích', desc: 'Phân tích hợp chất, phản ứng', Icon: IconMicroscope },
  { id: 'balance', name: 'Cân bằng PTHH', desc: 'Nhập phương trình, ra hệ số', Icon: IconScale, tag: 'hot' },
  { id: 'pomodoro', name: 'Pomodoro', desc: 'Tập trung sâu, nghỉ đúng lúc', Icon: IconTimer },
  { id: 'exam', name: 'Kỳ thi', desc: 'Đếm ngược tới ngày quyết định', Icon: IconCalendar },
  { id: 'notes', name: 'Ghi chú', desc: 'Ghi chú nhanh, lưu trữ', Icon: IconNote },
  { id: 'notebook', name: 'Sổ tay', desc: 'Lưu câu sai để ôn lại', Icon: IconBook, tag: 'new' },
  { id: 'grade', name: 'Tính điểm', desc: 'Cần bao nhiêu để đạt mục tiêu', Icon: IconTarget },
  { id: 'quiz', name: 'Ôn tập', desc: 'Quiz thông minh, nhớ lâu hơn', Icon: IconQuiz },
  { id: 'stats', name: 'Thống kê', desc: 'Xem tiến độ học tập', Icon: IconChart, tag: 'new' },
  { id: 'games', name: 'Trò chơi', desc: 'Giáo viên tự nhập câu hỏi', Icon: IconGamepad, tag: 'new' },
  { id: 'profile', name: 'Trang cá nhân', desc: 'Quản lý tài khoản, thống kê', Icon: IconUser },
];

const TAG_LABEL = { hot: 'Hot', new: 'Mới' };

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

const parseAIData = (raw) =>
  raw.trim().split('\n').map((line, i) => {
    const [cat, name, domain, desc] = line.split('|');
    if (!cat || !name || !domain) return null;
    const url = domain.startsWith('http') ? domain : 'https://' + domain.trim();
    return { id: i, cat: cat.trim(), name: name.trim(), url, domain: domain.trim(), desc: (desc || '').trim() };
  }).filter(Boolean);

const AI_TOOLS = parseAIData(RAW_AI_DATA);
const ALL_CATS = Array.from(new Set(AI_TOOLS.map((t) => t.cat)));
const PAGE = 48;
const catLabel = (cat) => stripLead(CAT_NAMES[cat] || cat);
const CAT_SYM = {
  chat: 'Ch', write: 'Wr', image: 'Im', video: 'Vd', audio: 'Au', study: 'St', code: 'Co', trans: 'Tr',
  search: 'Se', work: 'Wk', biz: 'Bz', agent: 'Ag', model: 'Mo', fun: 'Fu', game: 'Ga',
};
const atomNo = (id) => (typeof id === 'number' ? String(id + 1).padStart(3, '0') : '029');

const PriceText = ({ price }) => {
  const m = PRICE_META[price];
  if (!m) return null;
  return <span className="tc-price"><i style={{ background: m.color }} />{m.label}</span>;
};

const Chevron = ({ open }) => (
  <svg className={'tc-chev' + (open ? ' open' : '')} width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function ToolsPage() {
  const [tab, setTab] = useState('docs');
  const [search, setSearch] = useState('');
  const [docGrade, setDocGrade] = useState('all');
  const [activeCat, setActiveCat] = useState('all');
  const [activePrice, setActivePrice] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [limit, setLimit] = useState(PAGE);
  const [spot, setSpot] = useState(null);
  const [favs, setFavs] = useStored('tools-ai-fav', []);
  const [compare, setCompare] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const [openHot, setOpenHot] = useState(null);
  const [toast, toastNode] = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const searchRef = useRef(null);

  const { tier } = useAuth();
  const isVip = tier?.key === 'vip';

  const switchTab = (t) => {
    setTab(t); setSearch(''); setActiveCat('all'); setActivePrice('all');
    setSortBy('default'); setSpot(null); setCompare([]); setOpenHot(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setLimit(PAGE); }, [search, activeCat, activePrice, sortBy, tab]);

  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const toggleCompare = (tool) => {
    setCompare((c) => {
      if (c.find((x) => x.id === tool.id)) return c.filter((x) => x.id !== tool.id);
      if (c.length >= 3) { toast('Chỉ so sánh tối đa 3 công cụ'); return c; }
      return [...c, tool];
    });
  };

  const copyLink = async (tool) => {
    const url = tool.internal
      ? window.location.origin + window.location.pathname + '#ai'
      : tool.url;
    const ok = await copyText(url);
    toast(ok ? `Đã sao chép link ${tool.name}` : 'Không sao chép được');
  };

  const shareTool = async (tool) => {
    const url = tool.internal
      ? window.location.origin + window.location.pathname + '#ai'
      : tool.url;
    const data = { title: tool.name, text: tool.desc, url };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch { /* user cancel */ }
    }
    copyLink(tool);
  };

  const filteredAI = useMemo(() => {
    const q = norm(search.trim());
    let arr = AI_TOOLS.filter((t) => {
      if (activeCat === 'fav' ? !favs.includes(t.id) : activeCat !== 'all' && t.cat !== activeCat) return false;
      if (activePrice !== 'all' && !HOT_AI[t.id]?.price?.includes(activePrice)) return false;
      return !q || norm(`${t.name} ${t.desc} ${t.domain}`).includes(q);
    });
    if (sortBy === 'rating') arr = [...arr].sort((a, b) => (HOT_AI[b.id]?.rating || 0) - (HOT_AI[a.id]?.rating || 0));
    if (sortBy === 'name') arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [search, activeCat, activePrice, sortBy, favs]);

  const filteredHot = useMemo(() => {
    const q = norm(search.trim());
    const cuai = HOT_AI.__list.find((t) => t.id === 'cuai');
    let others = HOT_AI.__list.filter((t) => {
      if (t.id === 'cuai') return false;
      if (activePrice !== 'all' && !t.price?.includes(activePrice)) return false;
      return !q || norm(`${t.name} ${t.desc} ${t.why} ${t.bestFor?.join(' ')}`).includes(q);
    });
    if (sortBy === 'rating') others = [...others].sort((a, b) => b.rating - a.rating);
    if (sortBy === 'name') others = [...others].sort((a, b) => a.name.localeCompare(b.name));
    return cuai ? [cuai, ...others] : others;
  }, [search, activePrice, sortBy]);

  const filteredStudy = useMemo(() => {
    const q = norm(search.trim());
    return q ? STUDY_TOOLS.filter((t) => norm(`${t.name} ${t.desc}`).includes(q)) : STUDY_TOOLS;
  }, [search]);

  const statsByCat = useMemo(() => {
    const map = {};
    AI_TOOLS.forEach((t) => { map[t.cat] = (map[t.cat] || 0) + 1; });
    return map;
  }, []);

  const pickRandom = () => {
    const pool = filteredAI.length ? filteredAI : AI_TOOLS;
    setSpot(pool[Math.floor(Math.random() * pool.length)]);
  };
  const openProps = (tool) => (tool.internal
    ? { href: '#ai', onClick: (e) => { e.preventDefault(); window.location.hash = 'ai'; } }
    : { href: tool.url, target: '_blank', rel: 'noopener noreferrer' });

  const renderStar = (tool) => {
    const isFav = favs.includes(tool.id);
    return (
      <button type="button" className={'tc-ib tc-star' + (isFav ? ' on' : '')}
        onClick={() => toggleFav(tool.id)} aria-pressed={isFav}
        aria-label={isFav ? `Bỏ lưu ${tool.name}` : `Lưu ${tool.name}`}>
        <IcoStar size={16} on={isFav} />
      </button>
    );
  };

  const renderControls = (withVip) => {
    const prices = [['all', 'Tất cả'], ['free', 'Miễn phí'], ['freemium', 'Freemium'], ['paid', 'Trả phí']];
    if (withVip) prices.push(['vip', 'Siêu VIP']);
    return (
      <div className="tc-controls">
        <div className="tc-seg" role="group" aria-label="Lọc theo giá">
          {prices.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={activePrice === v} onClick={() => setActivePrice(v)}>{l}</button>
          ))}
        </div>
        <label className="tc-sort">
          <span>Sắp xếp</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Mặc định</option>
            <option value="rating">Đánh giá cao</option>
            <option value="name">Tên A đến Z</option>
          </select>
        </label>
      </div>
    );
  };

  const renderAI = (tool, big = false) => {
    const Icon = CAT_ICONS[tool.cat];
    const isCompared = compare.some((x) => x.id === tool.id);

    return (
      <article key={tool.id} data-cat={tool.cat} className={'tc-cell' + (big ? ' big' : '') + (isCompared ? ' comparing' : '')}>
        <div className="tc-tile" aria-hidden="true">
          <span className="tc-no">{atomNo(tool.id)}</span>
          <span className="tc-sym">{CAT_SYM[tool.cat] || ''}</span>
        </div>
        {renderStar(tool)}
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="tc-link" aria-label={`Mở ${tool.name}`}>
          <Logo domain={tool.domain} Fallback={Icon} CuaiLogo={AIMark} size={big ? 52 : 40} />
          <span className="tc-name">{tool.name}</span>
          <span className="tc-desc">{tool.desc}</span>
        </a>
        <div className="tc-foot">
          <span className="tc-domain">{tool.domain}</span>
          <div className="tc-tools">
            <button type="button" className="tc-ib" onClick={() => setQuickView(tool)} aria-label={`Xem nhanh ${tool.name}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              </svg>
            </button>
            <button type="button" className={'tc-ib' + (isCompared ? ' on' : '')} onClick={() => toggleCompare(tool)}
              aria-pressed={isCompared} aria-label={`So sánh ${tool.name}`}>
              <IcoCompare size={15} />
            </button>
            <button type="button" className="tc-ib" onClick={() => copyLink(tool)} aria-label={`Sao chép link ${tool.name}`}>
              <IcoCopy size={15} />
            </button>
            <button type="button" className="tc-ib" onClick={() => shareTool(tool)} aria-label={`Chia sẻ ${tool.name}`}>
              <IcoShare size={15} />
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderCuai = (tool) => {
    const Icon = CAT_ICONS[tool.cat];
    return (
      <section className="tc-cuai" aria-label="CUAI">
        <div className="tc-cuai-main">
          <div className="tc-cuai-id">
            <Logo domain={tool.domain} Fallback={Icon} size={64} CuaiLogo={AIMark} />
            <div>
              <h2>{tool.name}</h2>
              <span className="tc-cuai-by">{tool.domain}</span>
            </div>
          </div>
          <p className="tc-cuai-desc">{tool.desc}</p>
          <p className="tc-cuai-why">{tool.why}</p>
          <div className="tc-cuai-foot">
            <a {...openProps(tool)} className="tc-btn accent">
              Dùng ngay <IconArrowUpRight size={14} />
            </a>
            {renderStar(tool)}
          </div>
        </div>
        <div className="tc-cuai-side">
          <div className="tc-el" aria-hidden="true"><span>29</span><b>Cu</b><i>CUAI</i></div>
          <h3>Dùng CUAI để</h3>
          <ul>{tool.bestFor?.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      </section>
    );
  };

  const renderHotRow = (tool) => {
    const Icon = CAT_ICONS[tool.cat];
    const open = openHot === tool.id;
    return (
      <li key={tool.id} data-cat={tool.cat} className={'tc-row' + (open ? ' open' : '') + (tool.rank <= 3 ? ' top' : '')}>
        <div className="tc-row-main">
          <button type="button" className="tc-row-toggle" aria-expanded={open}
            onClick={() => setOpenHot(open ? null : tool.id)}>
            <span className="tc-rank">{tool.rank}</span>
            <Logo domain={tool.domain} Fallback={Icon} size={40} CuaiLogo={AIMark} />
            <span className="tc-row-text">
              <span className="tc-name">{tool.name}</span>
              <span className="tc-desc">{tool.desc}</span>
            </span>
            <span className="tc-row-meta">
              <PriceText price={tool.price} />
              <span className="tc-sub">{catLabel(tool.cat)}</span>
            </span>
            <Chevron open={open} />
          </button>
          {renderStar(tool)}
        </div>

        {open && (
          <div className="tc-detail">
            <p className="tc-why">{tool.why}</p>
            <div className="tc-cols">
              {tool.bestFor?.length > 0 && (
                <div><h4>Phù hợp</h4><ul>{tool.bestFor.map((x) => <li key={x}>{x}</li>)}</ul></div>
              )}
              {tool.pros?.length > 0 && (
                <div className="pro"><h4>Ưu điểm</h4><ul>{tool.pros.map((x) => <li key={x}>{x}</li>)}</ul></div>
              )}
              {tool.cons?.length > 0 && (
                <div className="con"><h4>Nhược điểm</h4><ul>{tool.cons.map((x) => <li key={x}>{x}</li>)}</ul></div>
              )}
            </div>
            <div className="tc-detail-foot">
              <a {...openProps(tool)} className="tc-btn primary">
                Mở {tool.name} <IconArrowUpRight size={14} />
              </a>
              <button type="button" className="tc-btn" onClick={() => copyLink(tool)}>Sao chép link</button>
              <span className="tc-sub">
                {tool.domain}
                {tool.vnSupport ? ', hỗ trợ tiếng Việt' : ''}
                {tool.freeTier ? ', có bản free' : ''}
              </span>
            </div>
          </div>
        )}
      </li>
    );
  };

  const hotOthers = filteredHot.filter((t) => t.id !== 'cuai');
  const tabList = [
    ['docs', 'Tài liệu', DOCS.length],
    ['exam', 'Đề thi', EXAMS.length],
    ['formula', 'Công thức', FORMULAS.length],
    ['hot', 'AI Hot', HOT_AI.__list.length],
    ['study', 'Học tập', STUDY_TOOLS.length],
    ['ai', 'AI Free', AI_TOOLS.length],
    ['prompt', 'Prompt Free', PROMPTS.length],
  ];
  const tabName = (tabList.find((t) => t[0] === tab) || [])[1];

  return (
    <section className="wrap tools-page tk-page tc">
      <div className="tn-shell">
        <aside className="tn-side" aria-label="Danh mục công cụ">
          <div className="tn-side-brand"><b>Công cụ</b><small>A7 K60 DTA</small></div>
          <p className="tn-side-label">Danh mục</p>
          {tabList.map(([id, label, n]) => (
            <button key={id} type="button" className={'tn-side-item' + (tab === id ? ' on' : '')} onClick={() => switchTab(id)}>
              <span>{label}</span><i>{n}</i>
            </button>
          ))}
          <p className="tn-side-label">Kho tài liệu</p>
          {GRADES.map((g) => (
            <button key={g} type="button" className={'tn-side-item' + (tab === 'docs' && docGrade === g ? ' on' : '')}
              onClick={() => { switchTab('docs'); setDocGrade(g); }}>
              <span>Lớp {g}</span>
            </button>
          ))}
          <p className="tn-side-label">Công cụ học tập</p>
          {STUDY_TOOLS.map(({ id, name, Icon }) => (
            <a key={id} href={'#' + id} className="tn-side-item"><Icon /><span>{name}</span></a>
          ))}
        </aside>

        <div className="tn-main">
          {/* HEADER */}
          <div className="tools-header">
            <div className="tools-header-row">
              <h1>Công cụ</h1>
              <button
                type="button"
                className="tools-menu-btn"
                onClick={() => setSheetOpen(true)}
                aria-label="Mở danh mục công cụ học tập"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Menu</span>
              </button>
            </div>
            <div className="tn-top">
              <span><b>{STUDY_TOOLS.length}</b> công cụ học tập</span>
              <span><b>{AI_TOOLS.length}</b> công cụ AI</span>
              <span><b>{PROMPTS.length}</b> prompt mẫu</span>
              <span><b>{DOCS.length}</b> tài liệu</span>
            </div>
            <nav className="tn-crumb" aria-label="Đường dẫn">
              <a href="#home">Trang chủ</a><i>›</i><span>Công cụ</span><i>›</i><b>{tabName}</b>
            </nav>
          </div>

          {/* TABS */}
          <div className="tools-tabs" role="tablist" aria-label="Loại công cụ">
            {[
              ['docs', 'Tài liệu', DOCS.length],
              ['hot', 'AI Hot', HOT_AI.__list.length],
              ['study', 'Học tập', STUDY_TOOLS.length],
              ['ai', 'AI Free', AI_TOOLS.length],
              ['prompt', 'Prompt Free', PROMPTS.length],
            ].map(([id, label, n]) => (
              <button key={id} role="tab" aria-selected={tab === id}
                className={'tools-tab' + (tab === id ? ' on' : '')} onClick={() => switchTab(id)}>
                {label}<span className="tc-n">{n}</span>
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="tools-search">
            <IconSearch size={18} />
            <input
              ref={searchRef}
              type="text"
              placeholder={
                tab === 'docs' ? 'Tìm tài liệu: hóa 11, toán 12, đề thi…'
                : tab === 'hot' ? 'Tìm AI hot: chat, ảnh, code, video…'
                : tab === 'ai' ? 'Tìm công cụ AI…'
                : tab === 'prompt' ? 'Tìm prompt: review, caption, hóa học…'
                : 'Tìm công cụ học tập…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm kiếm"
            />
            {search
              ? <button className="tools-search-clear" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">×</button>
              : <kbd className="tc-kbd" aria-hidden="true">/</kbd>}
          </div>

          {tab === 'docs' && <DocsLibrary query={search} grade={docGrade} onGrade={setDocGrade} />}
          {tab === 'exam' && <ExamBank query={search} />}
          {tab === 'formula' && <FormulaLibrary query={search} />}
          {tab === 'prompt' && <PromptLibrary query={search} />}

          {/* ================= TAB AI HOT ================= */}
          {tab === 'hot' && (
            <>
              <p className="tc-lede">
                {HOT_AI.__list.length} AI được chọn lọc, mỗi cái có ưu nhược điểm, mức giá và việc nó làm tốt nhất.
                CUAI, trợ lý Hóa học của chính A7 K60 DTA, đứng đầu danh sách. Cập nhật theo xu hướng 2026.
              </p>

              {renderControls(true)}

              <p className="tools-count">Hiển thị <b>{filteredHot.length}</b> AI hot</p>

              {filteredHot[0]?.id === 'cuai' && renderCuai(filteredHot[0])}

              <ul className="tc-list">{hotOthers.map(renderHotRow)}</ul>

              {hotOthers.length === 0 && search && (
                <div className="tools-empty">
                  <p>Không tìm thấy AI hot nào phù hợp.</p>
                  <button onClick={() => { setSearch(''); setActivePrice('all'); }}>Xóa bộ lọc</button>
                </div>
              )}
            </>
          )}

          {/* ================= TAB AI ================= */}
          {tab === 'ai' && (
            <>
              <div className="tools-cats" role="group" aria-label="Nhóm công cụ AI">
                <button className={'tools-cat' + (activeCat === 'all' ? ' on' : '')} onClick={() => setActiveCat('all')}>
                  Tất cả<em>{AI_TOOLS.length}</em>
                </button>
                <button className={'tools-cat' + (activeCat === 'fav' ? ' on' : '')} onClick={() => setActiveCat('fav')}>
                  Đã lưu<em>{favs.length}</em>
                </button>
                {ALL_CATS.map((cat) => (
                  <button key={cat} data-cat={cat} className={'tools-cat' + (activeCat === cat ? ' on' : '')} onClick={() => setActiveCat(cat)}>
                    {catLabel(cat)}<em>{statsByCat[cat]}</em>
                  </button>
                ))}
              </div>

              {renderControls(false)}

              <div className="tc-bar">
                <p className="tools-count">Hiển thị <b>{Math.min(limit, filteredAI.length)}</b> / <b>{filteredAI.length}</b> công cụ</p>
                <button type="button" className="tc-btn" onClick={pickRandom}><IcoShuffle size={15} />Gợi ý ngẫu nhiên</button>
              </div>
              <p className="tc-note">Mức miễn phí và giới hạn dùng khác nhau ở từng nền tảng. Hãy xem trang chính thức trước khi đăng ký.</p>

              {spot && (
                <div className="tc-spot" aria-live="polite">
                  <div className="tc-spot-head">
                    <span>Gợi ý cho bạn</span>
                    <button type="button" className="tc-ib" onClick={() => setSpot(null)} aria-label="Đóng gợi ý"><IcoClose size={16} /></button>
                  </div>
                  {renderAI(spot, true)}
                </div>
              )}

              <div className="tc-grid">{filteredAI.slice(0, limit).map((t) => renderAI(t))}</div>

              {limit < filteredAI.length && (
                <div className="tc-more">
                  <button type="button" className="tc-btn" onClick={() => setLimit((l) => l + PAGE)}>
                    Xem thêm {Math.min(PAGE, filteredAI.length - limit)} công cụ
                  </button>
                </div>
              )}

              {filteredAI.length === 0 && (
                <div className="tools-empty">
                  <p>{activeCat === 'fav' && !search.trim() ? 'Bạn chưa lưu công cụ nào. Bấm ngôi sao trên ô để lưu.' : `Không tìm thấy công cụ nào phù hợp với "${search}"`}</p>
                  <button onClick={() => { setSearch(''); setActiveCat('all'); setActivePrice('all'); }}>Xóa bộ lọc</button>
                </div>
              )}
            </>
          )}

          {/* ================= TAB HỌC TẬP ================= */}
          {tab === 'study' && (
            <>
              <p className="tools-count">Hiển thị <b>{filteredStudy.length}</b> công cụ</p>
              <div className="tc-grid">
                {filteredStudy.map(({ id, name, desc, Icon, tag }, i) => (
                  <article key={id} data-cat="study" className="tc-cell">
                    <div className="tc-tile" aria-hidden="true">
                      <span className="tc-no">{String(i + 1).padStart(3, '0')}</span>
                      <span className="tc-sym">{Array.from(name).slice(0, 2).join('')}</span>
                    </div>
                    {tag && <span className={'tc-tag ' + tag}>{TAG_LABEL[tag]}</span>}
                    <a href={'#' + id} className="tc-link" aria-label={name}>
                      <span className="tc-ico"><Icon /></span>
                      <span className="tc-name">{name}</span>
                      <span className="tc-desc">{desc}</span>
                    </a>
                    <div className="tc-foot">
                      <span className="tc-domain">Mở công cụ</span>
                      <span className="tc-arrow"><IconArrowUpRight size={14} /></span>
                    </div>
                  </article>
                ))}
              </div>
              {filteredStudy.length === 0 && (
                <div className="tools-empty">
                  <p>Không tìm thấy công cụ nào phù hợp với "{search}"</p>
                  <button onClick={() => setSearch('')}>Xóa tìm kiếm</button>
                </div>
              )}
            </>
          )}

          {/* ================= GỢI Ý VIP KHI ĐANG CHỌN ================= */}
          {compare.length >= 2 && !isVip && (
            <p className="tc-note tc-note-vip" style={{ textAlign: 'center', marginBottom: '.4rem' }}>
              💎 So sánh công cụ AI là tính năng <b>VIP</b>. Nâng cấp để mở khóa.
            </p>
          )}

          {/* ================= COMPARE BAR ================= */}
          <CompareBar
            items={compare}
            onRemove={(id) => setCompare((c) => c.filter((x) => x.id !== id))}
            onClear={() => setCompare([])}
            onOpen={(items) => {
              if (items.length < 2) {
                toast('Cần chọn ít nhất 2 công cụ để so sánh');
                return;
              }
              if (!isVip) {
                setShowUpgrade(true);
                return;
              }
              setShowCompare(true);
            }}
          />

          {/* ================= QUICK VIEW ================= */}
          {quickView && (
            <QuickView
              tool={quickView}
              meta={HOT_AI[quickView.id]}
              compare={quickView.__compare}
              onClose={() => setQuickView(null)}
              onFav={() => toggleFav(quickView.id)}
              isFav={favs.includes(quickView.id)}
              onCopy={() => copyLink(quickView)}
              onShare={() => shareTool(quickView)}
              CuaiLogo={AIMark}
            />
          )}

          {/* ================= COMPARE MODAL (AI) ================= */}
          {showCompare && compare.length >= 2 && isVip && (
            <CompareModal
              tools={compare}
              onClose={() => setShowCompare(false)}
            />
          )}

          {/* ================= UPGRADE PROMPT ================= */}
          <UpgradePrompt
            open={showUpgrade}
            feature="So sánh công cụ AI"
            onClose={() => setShowUpgrade(false)}
            onUpgrade={() => {
              setShowUpgrade(false);
              try { localStorage.setItem('cs-profile-tab', 'upgrade'); } catch { /* */ }
              window.location.hash = 'profile';
            }}
          />

          {toastNode}

          {/* BOTTOM SHEET 13 mục — chỉ hiện mobile */}
          <StudySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
        </div>
      </div>
    </section>
  );
}