import { useState } from 'react';
import { Badge, Button, Card, CardHead, Dialog, Segmented, Switch, useToast } from '../ui/index.jsx';
import { resetProgress, setGoal, useProgress } from '../lib/progress.js';
import { exportData, setSetting, useSettings } from '../lib/settings.js';
import { useInstall, useOnline } from '../lib/pwa.js';
import './pages.css';

/* Props lấy từ App giống GuestBar: theme ('dark'|'light'), onToggleTheme() */
export default function Settings({ theme, onToggleTheme }) {
  const toast = useToast();
  const s = useSettings();
  const { goal } = useProgress();
  const inst = useInstall();
  const online = useOnline();
  const [confirm, setConfirm] = useState(false);

  return (
    <main className="pg">
      <h1>Cài đặt</h1>
      <p className="lead">Mọi thay đổi được lưu ngay trên thiết bị này.</p>

      <Card>
        <CardHead title="Giao diện" />
        <div className="set-row">
          <div><b>Chế độ màu</b><small>Sáng hoặc tối</small></div>
          <Segmented label="Chế độ màu" value={theme} onChange={(v) => { if (v !== theme) onToggleTheme(); }}
            options={[{ value: 'light', label: 'Sáng' }, { value: 'dark', label: 'Tối' }]} />
        </div>
        <div className="set-row">
          <div><b>Giảm chuyển động</b><small>Tắt hiệu ứng trượt và mờ dần</small></div>
          <Switch label="Giảm chuyển động" checked={s.reduceMotion} onChange={(v) => setSetting({ reduceMotion: v })} />
        </div>
      </Card>

      <Card>
        <CardHead title="Học tập" />
        <div className="set-row">
          <div><b>Mục tiêu mỗi ngày</b><small>Số câu hỏi hoặc bài tập bạn muốn làm</small></div>
          <Segmented label="Mục tiêu mỗi ngày" value={goal} onChange={(v) => { setGoal(v); toast('Đã lưu mục tiêu ' + v + ' câu/ngày'); }}
            options={[5, 10, 20, 30].map((n) => ({ value: n, label: String(n) }))} />
        </div>
      </Card>

      <Card>
        <CardHead title="Ứng dụng" />
        <div className="set-row">
          <div><b>Cài lên màn hình chính</b>
            <small>{inst.installed ? 'Bạn đang dùng bản đã cài.' : inst.iosHint ? 'Trên iPhone: bấm Chia sẻ, rồi chọn Thêm vào MH chính.' : inst.canPrompt ? 'Mở nhanh như một app, dùng được khi mất mạng.' : 'Trình duyệt này chưa hỗ trợ cài đặt.'}</small></div>
          {inst.installed ? <Badge tone="ok">Đã cài</Badge> : <Button variant="primary" disabled={!inst.canPrompt} onClick={inst.install}>Cài app</Button>}
        </div>
        <div className="set-row">
          <div><b>Kết nối</b><small>{online ? 'Đang có mạng.' : 'Đang ngoại tuyến: CUAI chưa trả lời được, phần đã tải vẫn xem được.'}</small></div>
          <Badge tone={online ? 'ok' : 'warn'}>{online ? 'Trực tuyến' : 'Ngoại tuyến'}</Badge>
        </div>
      </Card>

      <Card>
        <CardHead title="Dữ liệu và hỗ trợ" />
        <div className="set-row">
          <div><b>Tải dữ liệu của bạn</b><small>Tiến độ và cài đặt, định dạng JSON</small></div>
          <Button onClick={() => { exportData(); toast('Đã tải file dữ liệu'); }}>Tải về</Button>
        </div>
        <div className="set-row">
          <div><b>Gửi phản hồi</b><small>Báo lỗi, góp ý, hoặc báo đáp án sai</small></div>
          <Button href="#feedback">Mở form</Button>
        </div>
        <div className="set-row">
          <div><b>Xóa tiến độ học</b><small>Xóa chuỗi ngày, mức nắm vững và lịch sử. Không hoàn tác được.</small></div>
          <Button variant="danger" onClick={() => setConfirm(true)}>Xóa tiến độ</Button>
        </div>
      </Card>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Xóa toàn bộ tiến độ học?"
        text="Chuỗi ngày, mức nắm vững theo chương và lịch sử gần đây sẽ mất trên thiết bị này.">
        <Button onClick={() => setConfirm(false)}>Giữ lại</Button>
        <Button variant="danger" onClick={() => { resetProgress(); setConfirm(false); toast('Đã xóa tiến độ'); }}>Xóa tiến độ</Button>
      </Dialog>
    </main>
  );
}
