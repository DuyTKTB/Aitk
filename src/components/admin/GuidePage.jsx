/* ============================================================
   GuidePage.jsx — Hướng dẫn sử dụng (Vitality)
   ============================================================ */
import { useState } from 'react';
import AdminShell, { Topbar } from './AdminShell.jsx';
import {
  IconSparkle, IconUpload, IconEdit, IconExam, IconQuestion, IconUsers, IconActivity,
  IconSettings, IconCopy, IconCheck, IconChevronDown, IconKeyboard,
  IconWarning, IconBulb, IconShield, IconKey, IconCrown,
} from './AdminIcons.jsx';
import { copyText } from './adminUtils.js';

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
    title: 'Bắt đầu nhanh: tạo đề trong 5 bước',
    Icon: IconSparkle,
    open: true,
    body: (
      <ol style={{ paddingLeft: '1.4rem', lineHeight: 1.8, margin: 0 }}>
        <li><b>Tạo đề → Tạo với AI.</b> Chọn kiểu prompt (từ nội dung, từ chủ đề, từ ảnh, đề hoàn chỉnh), chọn lớp, môn, số câu và mức độ.</li>
        <li><b>Copy prompt.</b> Bấm <i>Copy prompt</i> hoặc <i>Ctrl + Enter</i>. Có thể bấm tên AI (ChatGPT, Gemini, Claude…) để copy và mở luôn.</li>
        <li><b>Dán vào AI và gửi.</b> Nếu dùng "Từ ảnh đề", nhớ đính kèm ảnh vào khung chat của AI.</li>
        <li><b>Dán kết quả về bước 4.</b> Dán nguyên câu trả lời, kể cả dấu <code>```json</code>. Hệ thống tự làm sạch và báo số câu đọc được.</li>
        <li><b>Duyệt và lưu.</b> Đọc lại đáp án đúng từng câu, sửa nếu cần, rồi bấm <i>Lưu thành đề</i>. Đề lưu ở trạng thái ẩn mặc định; vào <i>Đề thi</i> để bật hiển thị khi đã kiểm tra xong.</li>
      </ol>
    ),
  },
  {
    id: 'keys',
    title: 'Quản lý key PRO giáo viên',
    Icon: IconKey,
    open: true,
    body: (
      <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.8, margin: 0 }}>
        <li><b>Tạo 1 key:</b> vào <i>Key giáo viên</i> → <i>Tạo 1 key</i> → chọn 7/30/90/180/365 ngày hoặc nhập số tùy chỉnh → ghi chú → tạo.</li>
        <li><b>Tạo hàng loạt:</b> vào <i>Tạo hàng loạt</i> → chọn số lượng (tối đa 100) → chọn thời hạn → tạo. Sau đó xuất CSV để phát.</li>
        <li><b>Kích hoạt key:</b> giáo viên vào <i>Trang cá nhân → tab Giáo viên PRO</i> → nhập key <code>PRO-XXXX-XXXX</code> → kích hoạt. Hạn = hôm nay + số ngày (cộng dồn nếu đã có PRO).</li>
        <li><b>Thu hồi key:</b> bấm nút <i>Thu hồi</i> trong danh sách. Key không kích hoạt thêm được, người đang dùng vẫn giữ quyền PRO đến khi hết hạn.</li>
        <li><b>Xóa key:</b> xóa vĩnh viễn khỏi danh sách. Người đã dùng <b>không</b> bị ảnh hưởng.</li>
        <li><b>Giám sát hết hạn:</b> mục <i>Giáo viên PRO</i> hiển thị danh sách còn bao nhiêu ngày. Filter "Sắp hết" để xem các key hết trong 7 ngày tới. Dashboard có widget "Key sắp hết hạn".</li>
      </ul>
    ),
  },
  {
    id: 'prompt',
    title: 'Dùng prompt AI sao cho ra câu hỏi tốt',
    Icon: IconBulb,
    body: (
      <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.8, margin: 0 }}>
        <li><b>Mỗi lượt tối đa 20 câu.</b> Muốn 60 câu, chạy 3 lượt rồi import từng lượt; AI sinh nhiều câu một lúc thường sai đáp án nhiều hơn.</li>
        <li><b>Chọn "Phân hóa"</b> nếu muốn đề giống cấu trúc THPT (nhận biết – thông hiểu – vận dụng – vận dụng cao). Số câu từng mức được tính sẵn.</li>
        <li><b>Kiểu "Từ nội dung"</b> cho đáp án bám sát tài liệu; nên dán theo từng bài (dưới 15.000 ký tự).</li>
        <li><b>Kiểu "Rà soát đáp án":</b> dán JSON đã có để AI giải lại, sửa đáp án sai và ghi chú vào <code>fixNote</code>. Dùng cho đề quan trọng.</li>
        <li><b>Yêu cầu bổ sung</b> để ghi ý riêng, ví dụ "ưu tiên bài tập tính pH".</li>
        <li><b>Luôn đọc lại đáp án.</b> Cách nhanh nhất: dán đề đã sinh vào AI khác với kiểu "Rà soát đáp án".</li>
        <li><b>Công thức</b> được yêu cầu viết bằng Unicode (H₂SO₄, Fe³⁺, →). Nếu AI vẫn trả LaTeX, thêm: "tuyệt đối không dùng LaTeX".</li>
      </ul>
    ),
  },
  {
    id: 'json',
    title: 'Định dạng JSON để import',
    Icon: IconUpload,
    body: (
      <>
        <p>Import chấp nhận object có mảng <code>questions</code>, hoặc chính mảng câu hỏi. Các trường tiêu đề, lớp, môn, thời gian là tùy chọn.</p>
        <JsonExample />
        <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.8, margin: '1rem 0 0' }}>
          <li><code>correctAnswer</code> là chữ cái trùng <code>label</code> của đáp án đúng. Cũng hiểu "B", "Đáp án B", số thứ tự, hoặc nội dung đáp án.</li>
          <li><code>difficulty</code>: <code>easy</code>, <code>medium</code>, <code>hard</code>, <code>extreme</code> (nhận cả "Dễ", "Khó", "Vận dụng cao"…).</li>
          <li>Mỗi câu 2–6 đáp án, đúng 1 đáp án đúng.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'exams',
    title: 'Quản lý đề thi',
    Icon: IconExam,
    body: (
      <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.8, margin: 0 }}>
        <li><b>Tìm, lọc, sắp xếp</b> theo môn, lớp, trạng thái, số lượt làm.</li>
        <li><b>Đổi tên nhanh:</b> nhấn đôi tiêu đề đề ở dạng lưới, Enter để lưu, Esc để hủy.</li>
        <li><b>Thao tác hàng loạt:</b> tích chọn nhiều đề rồi hiện, ẩn hoặc xóa cùng lúc.</li>
        <li><b>Nhân bản</b> tạo bản sao ở trạng thái ẩn, kèm toàn bộ câu hỏi và đáp án.</li>
        <li><b>Sửa đề:</b> chỉnh thông tin, thêm, sửa, xóa câu hỏi và đáp án. Câu thay đổi có nhãn "Chưa lưu"; bấm <i>Lưu tất cả</i>.</li>
        <li>Đề đã có lượt làm bài không xóa được nếu có ràng buộc khóa ngoại; hãy <b>ẩn</b> thề thay vì xóa.</li>
      </ul>
    ),
  },
  {
    id: 'users',
    title: 'Người dùng, hoạt động, cài đặt',
    Icon: IconUsers,
    body: (
      <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.8, margin: 0 }}>
        <li><b>Người dùng:</b> tìm theo tên hoặc ID, lọc theo vai trò, đổi vai trò (học sinh, giáo viên, quản trị). Không tự đổi vai trò của chính mình.</li>
        <li><b>Hoạt động:</b> xem các lượt làm bài gần nhất theo ngày và môn, mở chi tiết từng câu học sinh chọn.</li>
        <li><b>Cài đặt:</b> tên website, bật tắt tính năng, chế độ bảo trì, sao lưu/khôi phục dữ liệu.</li>
      </ul>
    ),
  },
  {
    id: 'shortcuts',
    title: 'Phím tắt',
    Icon: IconKeyboard,
    body: (
      <table className="vt-table">
        <tbody>
          <tr><td style={{ width: 180 }}><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td><td>Copy prompt (trong màn Tạo với AI)</td></tr>
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
      <table className="vt-table">
        <thead>
          <tr><th>Thông báo / hiện tượng</th><th>Nguyên nhân và cách xử lý</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>"JSON sai cú pháp ở dòng X"</td>
            <td>AI quên dấu phẩy hoặc bị cắt giữa chừng. Nhắn AI "tiếp tục" rồi dán lại đầy đủ, hoặc giảm số câu mỗi lượt.</td>
          </tr>
          <tr>
            <td>"Chưa chọn đáp án đúng"</td>
            <td>AI không trả <code>correctAnswer</code>. Chọn nút tròn ở đáp án đúng trong màn duyệt.</td>
          </tr>
          <tr>
            <td>"Không đủ quyền… RLS"</td>
            <td>Tài khoản chưa có <code>role = 'admin'</code> trong bảng <code>profiles</code>, hoặc policy Supabase chưa cho admin ghi bảng đó.</td>
          </tr>
          <tr>
            <td>"invalid input syntax for type uuid"</td>
            <td>Bạn dùng Firebase Auth (UID dạng string) nhưng cột trong DB là uuid. Chạy SQL migration đổi sang text.</td>
          </tr>
          <tr>
            <td>"Dữ liệu đang được bảng khác sử dụng"</td>
            <td>Đề đã có lượt làm bài. Ẩn đề thay vì xóa, hoặc xóa lượt làm bài liên quan trước.</td>
          </tr>
          <tr>
            <td>Danh sách lớp/môn trống</td>
            <td>Thêm dữ liệu vào bảng <code>grades</code> và <code>subjects</code> trong Supabase.</td>
          </tr>
        </tbody>
      </table>
    ),
  },
];

function JsonExample() {
  const [done, setDone] = useState(false);
  const copy = async () => {
    if (await copyText(JSON_EXAMPLE)) {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }
  };
  return (
    <div style={{ position: 'relative', marginTop: '.8rem' }}>
      <button
        type="button"
        className="vt-btn sm"
        onClick={copy}
        style={{ position: 'absolute', top: '.6rem', right: '.6rem', zIndex: 2 }}
      >
        {done ? <IconCheck size={13} /> : <IconCopy size={13} />} {done ? 'Đã copy' : 'Copy mẫu'}
      </button>
      <pre style={{
        margin: 0,
        padding: '1rem 1.2rem',
        background: 'var(--vt-tint)',
        borderRadius: 12,
        fontSize: '.78rem',
        lineHeight: 1.55,
        overflowX: 'auto',
        fontFamily: 'var(--mono)',
        color: 'var(--ink)',
      }} tabIndex={0}>{JSON_EXAMPLE}</pre>
    </div>
  );
}

export default function GuidePage({ onNavigate }) {
  const [open, setOpen] = useState(() => new Set(SECTIONS.filter((s) => s.open).map((s) => s.id)));
  const toggle = (id) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <AdminShell active="guide" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Hướng dẫn sử dụng"
        subtitle="Từ tạo đề bằng AI đến quản lý key PRO và sao lưu dữ liệu"
      />

      <div className="vt-card soft" style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="vt-btn primary" onClick={() => onNavigate?.('create')}>
          <IconSparkle size={14} /> Tạo đề ngay
        </button>
        <button type="button" className="vt-btn" onClick={() => onNavigate?.('keys')}>
          <IconKey size={14} /> Quản lý key
        </button>
        <button type="button" className="vt-btn" onClick={() => setOpen(new Set(SECTIONS.map((s) => s.id)))}>
          Mở tất cả
        </button>
        <button type="button" className="vt-btn" onClick={() => setOpen(new Set())}>
          Thu gọn
        </button>
      </div>

      {SECTIONS.map((s) => {
        const isOpen = open.has(s.id);
        return (
          <div key={s.id} className="vt-card">
            <button
              type="button"
              onClick={() => toggle(s.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '.75rem',
                padding: 0,
                background: 'none',
                border: 0,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
              }}
              aria-expanded={isOpen}
            >
              <span
                className="vt-list-ico"
                style={{ flexShrink: 0, background: 'var(--vt-hero)' }}
              >
                <s.Icon size={18} />
              </span>
              <b style={{ flex: 1, font: '800 1rem var(--sans)', color: 'var(--ink)' }}>{s.title}</b>
              <IconChevronDown
                size={18}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform .25s',
                  color: 'var(--mut)',
                }}
              />
            </button>
            {isOpen && (
              <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--soft)', fontSize: '.9rem', color: 'var(--ink)' }}>
                {s.body}
              </div>
            )}
          </div>
        );
      })}
    </AdminShell>
  );
}