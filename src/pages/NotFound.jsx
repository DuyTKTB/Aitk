import { Button } from '../ui/index.jsx';
import './pages.css';

/* Hiện khi useRoute().known === false.  Ô "Nf" nhại ô nguyên tố: số hiệu 404. */
export default function NotFound() {
  const bad = (location.hash || '').slice(0, 40);
  return (
    <main className="nf">
      <div className="nf-in">
        <div className="nf-cell" aria-hidden="true"><small>404</small><b>Nf</b><span>Not found</span></div>
        <div>
          <h1>Không tìm thấy trang này</h1>
          <p>{bad ? <>Địa chỉ <code>{bad}</code> không tồn tại hoặc đã được chuyển.</> : 'Trang bạn mở không tồn tại hoặc đã được chuyển.'}</p>
          <div className="nf-actions">
            <Button variant="primary" href="#home">Về trang chủ</Button>
            <Button href="#ai">Hỏi CUAI</Button>
            <Button href="#feedback">Báo link hỏng</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
