import { useState } from 'react';
import { Button, Card, Field, Segmented, useToast } from '../ui/index.jsx';
import { sendFeedback } from '../lib/feedback.js';
import './pages.css';

const KINDS = [
  { value: 'bug', label: 'Báo lỗi' },
  { value: 'content', label: 'Đáp án sai' },
  { value: 'idea', label: 'Góp ý' },
];
const PLACEHOLDER = {
  bug: 'Bạn đang làm gì, điều gì xảy ra, và bạn mong đợi điều gì?',
  content: 'Câu hỏi nào, đáp án hiện tại là gì, theo bạn đáp án đúng là gì?',
  idea: 'Bạn muốn app có thêm hoặc đổi điều gì?',
};

export default function Feedback() {
  const toast = useToast();
  const [kind, setKind] = useState('bug');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [withContext, setWithContext] = useState(true);
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // 'sent' | 'queued'

  const submit = async (e) => {
    e.preventDefault();
    if (trap) return;                                  // bot điền ô ẩn
    if (message.trim().length < 10) { setError('Hãy mô tả ít nhất 10 ký tự để chúng mình hiểu vấn đề.'); return; }
    setError(''); setBusy(true);
    try {
      const r = await sendFeedback({ kind, message, contact, withContext });
      setDone(r); setMessage('');
      toast(r === 'sent' ? 'Đã gửi phản hồi' : 'Đã lưu, sẽ tự gửi khi có mạng');
    } catch (err) {
      setError(err.code === 'rate' ? 'Bạn vừa gửi xong. Đợi 30 giây rồi gửi tiếp nhé.' : 'Máy chủ không nhận được phản hồi này. Kiểm tra lại nội dung rồi gửi lại.');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <main className="pg">
        <h1>{done === 'sent' ? 'Đã nhận phản hồi' : 'Đã lưu phản hồi'}</h1>
        <p className="lead">{done === 'sent' ? 'Cảm ơn bạn. Chúng mình sẽ đọc và sửa sớm nhất có thể.' : 'Hiện chưa có kết nối. Phản hồi được giữ trên máy và sẽ tự gửi khi bạn online lại.'}</p>
        <div className="fb-actions"><Button variant="primary" href="#home">Về trang chủ</Button><Button onClick={() => setDone(null)}>Gửi thêm</Button></div>
      </main>
    );
  }

  return (
    <main className="pg">
      <h1>Gửi phản hồi</h1>
      <p className="lead">Báo lỗi, báo đáp án sai hoặc góp ý. Phản hồi được gửi thẳng tới đội phát triển.</p>
      <Card>
        <form className="fb-form" onSubmit={submit} noValidate>
          <Segmented label="Loại phản hồi" value={kind} onChange={setKind} options={KINDS} />
          <Field label="Nội dung" error={error}>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={PLACEHOLDER[kind]} maxLength={2000} required />
          </Field>
          <Field label="Email hoặc Zalo để liên hệ lại (không bắt buộc)">
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" maxLength={120} />
          </Field>
          <label className="fb-check">
            <input type="checkbox" checked={withContext} onChange={(e) => setWithContext(e.target.checked)} />
            <span>Đính kèm thông tin thiết bị và trang đang mở (loại trình duyệt, kích thước màn hình, chế độ màu) để dễ tìm lỗi. Không gồm nội dung chat.</span>
          </label>
          <input className="fb-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
          <div className="fb-actions">
            <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi phản hồi'}</Button>
            <span className="num" style={{ color: 'var(--mut)', fontSize: 'var(--fs-xs)' }}>{message.length}/2000</span>
          </div>
        </form>
      </Card>
    </main>
  );
}
