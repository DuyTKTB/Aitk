import { useState } from 'react';
import {
  IconSparkle, IconUpload, IconEdit, IconExam, IconQuestion, IconUsers, IconActivity, IconSettings,
  IconCopy, IconCheck, IconChevronDown, IconKeyboard, IconWarning, IconBulb, IconShield,
} from './AdminIcons.jsx';
import { copyText } from './adminUtils.js';
import { useToast } from './AdminUI.jsx';

const JSON_EXAMPLE = `{
  "title": "Đề kiểm tra giữa kỳ 1 — Hóa học 11",
  "description": "Chương 1–2",
  "exam_type": "giua_ky",
  "duration": 45,
  "difficulty": "medium",
  "questions": [
    {
      "content": "Chất nào sau đây là chất điện li mạnh?",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "CH₃COOH" },
        { "label": "B", "content": "NaCl" },
        { "label": "C", "content": "H₂O" },
        { "label": "D", "content": "C₂H₅OH" }
      ],
      "correctAnswer": "B",
      "explanation": "NaCl là muối tan, phân li hoàn toàn trong nước.",
      "difficulty": "easy",
      "topic": "Sự điện li"
    }
  ]
}`;

const SECTIONS = [
  {
    id: 'quick',
    title: 'Bắt đầu nhanh: tạo một đề trong 5 bước',
    Icon: IconSparkle,
    open: true,
    body: (
      <ol className="adl-guide-steps">
        <li><b>Tạo đề → Tạo với AI.</b> Chọn kiểu prompt (từ nội dung, từ chủ đề, từ ảnh, đề hoàn chỉnh), chọn lớp, môn, số câu và mức độ.</li>
        <li><b>Copy prompt.</b> Bấm <i>Copy prompt</i> hoặc <i>Ctrl + Enter</i>. Có thể bấm tên một AI (ChatGPT, Gemini, Claude…) để copy và mở luôn.</li>
        <li><b>Dán vào AI và gửi.</b> Nếu dùng kiểu "Từ ảnh đề", nhớ đính kèm ảnh vào khung chat của AI.</li>
        <li><b>Dán kết quả về bước 4.</b> Dán nguyên câu trả lời của AI, kể cả dấu <code>```json</code>. Hệ thống tự làm sạch và báo số câu đọc được.</li>
        <li><b>Duyệt và lưu.</b> Đọc lại đáp án đúng từng câu, sửa nếu cần, rồi bấm <i>Lưu thành đề</i>. Đề lưu ở trạng thái ẩn mặc định; vào <i>Đề thi</i> để bật hiển thị khi đã kiểm tra xong.</li>
      </ol>
    ),
  },
  {
    id: 'prompt',
    title: 'Dùng prompt AI sao cho ra câu hỏi tốt',
    Icon: IconBulb,
    body: (
      <>
        <ul>
          <li><b>Mỗi lượt tối đa 20 câu.</b> Muốn 60 câu, chạy 3 lượt rồi import từng lượt; AI sinh nhiều câu một lúc thường sai đáp án nhiều hơn.</li>
          <li><b>Chọn "Phân hóa"</b> nếu muốn đề giống cấu trúc THPT (nhận biết – thông hiểu – vận dụng – vận dụng cao). Số câu từng mức được tính sẵn và ghi vào prompt.</li>
          <li><b>Kiểu "Từ nội dung"</b> cho đáp án bám sát tài liệu của thầy cô; nên dán theo từng bài (dưới 15.000 ký tự).</li>
          <li><b>Kiểu "Rà soát đáp án"</b>: dán JSON đã có để AI giải lại, sửa đáp án sai và ghi chú vào trường <code>fixNote</code>. Nên dùng cho đề quan trọng.</li>
          <li><b>Yêu cầu bổ sung</b> là chỗ ghi ý riêng, ví dụ "ưu tiên bài tập tính pH".</li>
          <li><b>Luôn đọc lại đáp án.</b> AI có thể sai, nhất là câu tính toán. Cách nhanh nhất: dán đề đã sinh vào một AI khác với kiểu "Rà soát đáp án".</li>
          <li><b>Công thức</b> được yêu cầu viết bằng ký tự Unicode (H₂SO₄, Fe³⁺, →) để không lỗi hiển thị. Nếu AI vẫn trả LaTeX, thêm vào yêu cầu bổ sung: "tuyệt đối không dùng LaTeX".</li>
        </ul>
      </>
    ),
  },
  {
    id: 'json',
    title: 'Định dạng JSON để import',
    Icon: IconUpload,
    body: (
      <>
        <p>Import chấp nhận một object có mảng <code>questions</code>, hoặc chính mảng câu hỏi. Các trường tiêu đề, lớp, môn, thời gian là tùy chọn (thiếu sẽ chọn ở màn hình duyệt).</p>
        <JsonExample />
        <ul>
          <li><code>correctAnswer</code> là một chữ cái trùng <code>label</code> của đáp án đúng. Hệ thống cũng hiểu "B", "Đáp án B", số thứ tự, hoặc nội dung đáp án.</li>
          <li><code>difficulty</code>: <code>easy</code>, <code>medium</code>, <code>hard</code>, <code>extreme</code> (nhận cả "Dễ", "Khó", "Vận dụng cao"…).</li>
          <li>Mỗi câu 2–6 đáp án, đúng 1 đáp án đúng.</li>
          <li>Có thể ghi <code>grade_id</code> và <code>subject_id</code> theo ID trong cơ sở dữ liệu, hoặc chọn bằng tay khi duyệt.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'exams',
    title: 'Quản lý đề thi',
    Icon: IconExam,
    body: (
      <ul>
        <li><b>Tìm, lọc, sắp xếp</b> theo môn, lớp, trạng thái (đang hiện, đã ẩn, chưa có câu hỏi), số lượt làm.</li>
        <li><b>Đổi tên nhanh:</b> nhấn đôi vào tiêu đề đề ở dạng lưới, Enter để lưu, Esc để hủy.</li>
        <li><b>Thao tác hàng loạt:</b> tích chọn nhiều đề rồi hiện, ẩn hoặc xóa cùng lúc.</li>
        <li><b>Nhân bản</b> tạo bản sao ở trạng thái ẩn, kèm toàn bộ câu hỏi và đáp án.</li>
        <li><b>Sửa đề:</b> chỉnh thông tin, thêm, sửa, xóa câu hỏi và đáp án. Câu thay đổi có nhãn "Chưa lưu"; bấm <i>Lưu tất cả</i> để lưu một lượt. Rời trang khi chưa lưu sẽ có cảnh báo.</li>
        <li>Đề đã có lượt làm bài không xóa được nếu cơ sở dữ liệu ràng buộc khóa ngoại; hãy <b>ẩn</b> đề thay vì xóa.</li>
      </ul>
    ),
  },
  {
    id: 'questions',
    title: 'Ngân hàng câu hỏi',
    Icon: IconQuestion,
    body: (
      <ul>
        <li>Xem câu hỏi của <b>mọi đề</b> ở một nơi, tìm theo nội dung, lọc theo môn và độ khó, phân trang 20 câu.</li>
        <li>Bấm biểu tượng mắt để xem đáp án, lời giải; biểu tượng bút để mở đề chứa câu đó và sửa.</li>
      </ul>
    ),
  },
  {
    id: 'users',
    title: 'Người dùng, hoạt động, cài đặt',
    Icon: IconUsers,
    body: (
      <ul>
        <li><b>Người dùng:</b> tìm theo tên hoặc ID, lọc theo vai trò, đổi vai trò (học sinh, giáo viên, quản trị). Bạn không thể tự đổi vai trò của chính mình để tránh tự khóa quyền.</li>
        <li><b>Hoạt động:</b> xem các lượt làm bài gần nhất theo ngày và môn, mở chi tiết từng câu học sinh chọn, kèm đáp án đúng và lời giải.</li>
        <li><b>Cài đặt:</b> tên website, bật tắt tính năng, chế độ bảo trì (học sinh không vào được, admin vẫn vào).</li>
      </ul>
    ),
  },
  {
    id: 'backup',
    title: 'Sao lưu và khôi phục dữ liệu',
    Icon: IconShield,
    body: (
      <>
        <ul>
          <li><b>Tải bản sao lưu</b> trước mỗi lần làm việc lớn. File JSON gồm lớp, môn, chủ đề, đề, câu hỏi, đáp án, hồ sơ người dùng.</li>
          <li><b>Khôi phục kiểu "Gộp"</b> (khuyên dùng): thêm mới và cập nhật theo ID, không xóa gì.</li>
          <li><b>Khôi phục kiểu "Thay thế":</b> xóa đề, câu hỏi, đáp án hiện có rồi nạp lại. Hệ thống tự tải một bản an toàn trước khi xóa và yêu cầu gõ <code>KHOI PHUC</code> để xác nhận.</li>
          <li>Tài khoản người dùng <b>không bao giờ bị xóa hay ghi đè</b> khi khôi phục.</li>
        </ul>
        <div className="adl-alert warn"><span className="adl-alert-ico"><IconWarning size={16} /></span><div>Mục "Vùng nguy hiểm" xóa vĩnh viễn và đòi gõ chữ xác nhận. Hãy sao lưu trước.</div></div>
      </>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Phím tắt',
    Icon: IconKeyboard,
    body: (
      <table className="adl-table adl-guide-table">
        <tbody>
          <tr><td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td><td>Copy prompt (trong màn Tạo với AI)</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Đóng hộp thoại, hủy đổi tên nhanh</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Lưu tên đề khi đổi tên nhanh</td></tr>
          <tr><td><kbd>Tab</kbd></td><td>Di chuyển giữa các ô; mọi nút đều dùng được bằng bàn phím</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'fix',
    title: 'Gặp lỗi? Cách xử lý',
    Icon: IconWarning,
    body: (
      <table className="adl-table adl-guide-table">
        <thead><tr><th>Thông báo / hiện tượng</th><th>Nguyên nhân và cách xử lý</th></tr></thead>
        <tbody>
          <tr><td>"JSON sai cú pháp ở dòng X"</td><td>AI quên dấu phẩy hoặc bị cắt giữa chừng. Nhắn AI "tiếp tục" rồi dán lại đầy đủ, hoặc giảm số câu mỗi lượt.</td></tr>
          <tr><td>"Chưa chọn đáp án đúng"</td><td>AI không trả <code>correctAnswer</code>. Chọn nút tròn ở đáp án đúng trong màn duyệt.</td></tr>
          <tr><td>"Không đủ quyền… RLS"</td><td>Tài khoản chưa có <code>role = 'admin'</code> trong bảng <code>profiles</code>, hoặc policy Supabase chưa cho admin ghi bảng đó.</td></tr>
          <tr><td>"Dữ liệu đang được bảng khác sử dụng"</td><td>Đề đã có lượt làm bài. Ẩn đề thay vì xóa, hoặc xóa lượt làm bài liên quan trước.</td></tr>
          <tr><td>Danh sách lớp/môn trống</td><td>Thêm dữ liệu vào bảng <code>grades</code> và <code>subjects</code> trong Supabase.</td></tr>
          <tr><td>Số liệu quota API không thấy</td><td>Bộ đếm lưu trên trình duyệt này; chưa gọi API lần nào thì để trống.</td></tr>
          <tr><td>Công thức hiện ký tự lạ (\ce, \frac)</td><td>AI dùng LaTeX. Sửa tay trong màn duyệt, lần sau thêm "không dùng LaTeX" vào yêu cầu bổ sung.</td></tr>
        </tbody>
      </table>
    ),
  },
];

function JsonExample() {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const copy = async () => {
    if (await copyText(JSON_EXAMPLE)) {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } else {
      toast.error('Không copy được, hãy bôi đen và copy thủ công.');
    }
  };
  return (
    <div className="adl-code">
      <button type="button" className="adl-btn-sm" onClick={copy}>{done ? <IconCheck size={13} /> : <IconCopy size={13} />} {done ? 'Đã copy' : 'Copy mẫu'}</button>
      <pre tabIndex={0}>{JSON_EXAMPLE}</pre>
    </div>
  );
}

export default function GuidePage({ onNavigate }) {
  const [open, setOpen] = useState(() => new Set(SECTIONS.filter((s) => s.open).map((s) => s.id)));
  const toggle = (id) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="adl-guide">
      <section className="adl-panel adl-guide-hero">
        <div>
          <h2>Hướng dẫn sử dụng khu quản trị</h2>
          <p>Từ tạo đề bằng AI đến sao lưu dữ liệu. Mở từng mục bên dưới, mục đầu tiên là quy trình nhanh nhất.</p>
        </div>
        <div className="adl-list-actions">
          <button type="button" className="adl-btn-primary" onClick={() => onNavigate('create')}><IconSparkle size={14} /> Tạo đề ngay</button>
          <button type="button" className="adl-btn-outline" onClick={() => setOpen(new Set(SECTIONS.map((s) => s.id)))}>Mở tất cả</button>
          <button type="button" className="adl-btn-outline" onClick={() => setOpen(new Set())}>Thu gọn</button>
        </div>
      </section>

      {SECTIONS.map((s) => {
        const isOpen = open.has(s.id);
        return (
          <section key={s.id} className={'adl-panel adl-guide-sec' + (isOpen ? ' open' : '')}>
            <button type="button" className="adl-guide-head" onClick={() => toggle(s.id)} aria-expanded={isOpen} aria-controls={`guide-${s.id}`}>
              <span className="adl-guide-ico"><s.Icon size={17} /></span>
              <b>{s.title}</b>
              <IconChevronDown size={16} className="adl-guide-chev" />
            </button>
            {isOpen && <div id={`guide-${s.id}`} className="adl-guide-body">{s.body}</div>}
          </section>
        );
      })}
    </div>
  );
}
