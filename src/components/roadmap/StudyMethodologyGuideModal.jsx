/* ============================================================
   StudyMethodologyGuideModal.jsx — CẨM NANG HƯỚNG DẪN ÔN THI ĐÚNG CÁCH
   ------------------------------------------------------------
   Hệ thống phương pháp học tập khoa học cá nhân hóa theo nguyện vọng:
     1. Lộ trình 4 giai đoạn bứt phá điểm số (Xây nền -> Khóa bẫy -> Luyện tốc độ -> Về đích)
     2. Quy trình 4 bước độc quyền ELEC AI xử lý câu hỏi khó
     3. Chiến thuật phân bổ thời gian: Pomodoro 25/5 + SRS lặp lại ngắt quãng
     4. Chiến lược chạm mốc 8.5+ cho các trường top (ANND, BKHN, YHN, NEU)
   ============================================================ */

import { useState } from 'react';
import MathText from '../MathText.jsx';
import '../../styles/study-guide-modal.css';

const IcoClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IcoCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoSpark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
  </svg>
);

export default function StudyMethodologyGuideModal({ open, onClose, targetSchool = 'ANND', targetScore = '26.0' }) {
  const [activeTab, setActiveTab] = useState('stages'); // 'stages' | 'steps' | 'pomodoro' | 'strategy'

  if (!open) return null;

  return (
    <div className="elec-guide-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="elec-guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="elec-guide-header">
          <div className="elec-guide-header-title">
            <span className="elec-guide-badge">ELEC AI METRICS 2026</span>
            <h2 id="guide-title">Cẩm Nang Hướng Dẫn Ôn Thi Khoa Học &amp; Đúng Cách</h2>
            <p>Phương pháp ôn tập thực chứng giúp học sinh bứt phá điểm số theo nguyện vọng {targetSchool} (Mục tiêu: {targetScore}đ)</p>
          </div>
          <button type="button" className="elec-guide-close-btn" onClick={onClose} aria-label="Đóng hướng dẫn">
            <IcoClose />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="elec-guide-tabs" role="tablist">
          <button
            type="button"
            className={`elec-guide-tab ${activeTab === 'stages' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('stages')}
          >
            <IcoCompass />
            <span>4 Giai đoạn ôn chuẩn</span>
          </button>
          <button
            type="button"
            className={`elec-guide-tab ${activeTab === 'steps' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('steps')}
          >
            <IcoSpark />
            <span>Quy trình giải bài 4 bước</span>
          </button>
          <button
            type="button"
            className={`elec-guide-tab ${activeTab === 'pomodoro' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('pomodoro')}
          >
            <IcoClock />
            <span>Pomodoro 25/5 &amp; SRS</span>
          </button>
          <button
            type="button"
            className={`elec-guide-tab ${activeTab === 'strategy' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('strategy')}
          >
            <IcoTarget />
            <span>Chiến lược đỗ {targetSchool} (8.5+)</span>
          </button>
        </nav>

        {/* Content Body */}
        <div className="elec-guide-body">
          {/* TAB 1: 4 GIAI ĐOẠN ÔN THI KHOA HỌC */}
          {activeTab === 'stages' && (
            <div className="elec-guide-section">
              <div className="elec-stage-card stage-1">
                <div className="elec-stage-head">
                  <span className="elec-stage-number">Giai đoạn 1</span>
                  <h3>Khóa gốc lý thuyết &amp; Hiểu bản chất công thức</h3>
                  <small>Chiếm 50% thời gian ôn nền tảng</small>
                </div>
                <div className="elec-stage-content">
                  <ul>
                    <li><b>Không học vẹt công thức:</b> Luôn hiểu công thức sinh ra từ đâu. Ví dụ: Chuyển động ném là kết hợp của chuyển động thẳng đều phương ngang (<MathText text="$v_x = v_0$" />) và rơi tự do phương đứng (<MathText text="$v_y = gt$" />).</li>
                    <li><b>Vẽ sơ đồ tư duy liên kết:</b> Nhóm các đại lượng có quan hệ tỉ lệ thuận, tỉ lệ nghịch để suy luận khi gặp câu hỏi định tính.</li>
                    <li><b>Tự tay lập Bảng tra cứu công thức:</b> Sử dụng tính năng <i>Lưu công thức ⭐</i> của ELEC AI để ôn lại mỗi ngày.</li>
                  </ul>
                </div>
              </div>

              <div className="elec-stage-card stage-2">
                <div className="elec-stage-head">
                  <span className="elec-stage-number">Giai đoạn 2</span>
                  <h3>Nhận diện 50+ Bẫy sai đề thi (Trap Avoidance)</h3>
                  <small>Tăng 1.5 - 2.0 điểm ngay trong 2 tuần</small>
                </div>
                <div className="elec-stage-content">
                  <ul>
                    <li><b>Bẫy đổi đơn vị SI:</b> Quên đổi <MathText text={'$\\text{km/h} \\to \\text{m/s}$'} /> (chia <MathText text={'$3{,}6$'} />), <MathText text={'$\\text{cm} \\to \\text{m}$'} />, <MathText text={'$\\text{kJ} \\to \\text{J}$'} />, <MathText text={'$\\text{mL} \\to \\text{L}$'} />.</li>
                    <li><b>Bẫy dấu đại lượng vectơ:</b> Chuyển động chậm dần đều gia tốc <MathText text="$a &lt; 0$" />, ném xiên chiều dương hướng lên thì <MathText text="$a_y = -g$" />.</li>
                    <li><b>Bẫy câu hỏi phủ định:</b> Đề bài hỏi câu <i>"KHÔNG ĐÚNG"</i> hoặc <i>"SAI"</i> nhưng học sinh hấp tấp chọn ngay ý đúng đầu tiên.</li>
                  </ul>
                </div>
              </div>

              <div className="elec-stage-card stage-3">
                <div className="elec-stage-head">
                  <span className="elec-stage-number">Giai đoạn 3</span>
                  <h3>Luyện đề áp lực thời gian thực (1.25 phút/câu)</h3>
                  <small>Chiến thuật phân bổ sức bền phòng thi</small>
                </div>
                <div className="elec-stage-content">
                  <ul>
                    <li><b>Chiến thuật 3 lượt làm bài:</b>
                      <ol>
                        <li><b>Lượt 1 (15 phút đầu):</b> Quét qua và ăn trọn 100% các câu nhận biết, thông hiểu dễ (chắc chắn ăn 6.0 điểm).</li>
                        <li><b>Lượt 2 (20 phút tiếp):</b> Giải các câu vận dụng quen dạng đã có phương pháp.</li>
                        <li><b>Lượt 3 (10 phút cuối):</b> Xử lý các câu phân loại 9+ và rà soát lại phiếu trả lời trắc nghiệm.</li>
                      </ol>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="elec-stage-card stage-4">
                <div className="elec-stage-head">
                  <span className="elec-stage-number">Giai đoạn 4</span>
                  <h3>Về đích cá nhân hóa theo Nguyện vọng {targetSchool}</h3>
                  <small>Tối ưu hóa điểm số chốt hạ</small>
                </div>
                <div className="elec-stage-content">
                  <ul>
                    <li><b>Cày nát Sổ lỗi sai:</b> 80% học sinh thi trượt vì lặp lại đúng lỗi sai từng mắc. Mỗi cuối tuần, làm lại toàn bộ câu sai trong sổ tay.</li>
                    <li><b>Khoanh vùng điểm rơi:</b> Tập trung 100% năng lượng vào các dạng bài có tỉ trọng xuất hiện cao trong ma trận đề tuyển sinh trường bạn chọn.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUY TRÌNH 4 BƯỚC ĐỘC QUYỀN ELEC AI */}
          {activeTab === 'steps' && (
            <div className="elec-guide-section">
              <div className="elec-steps-timeline">
                <div className="elec-step-box">
                  <div className="elec-step-badge">BƯỚC 1</div>
                  <div className="elec-step-body">
                    <h4>Quét từ khóa &amp; Gán đại lượng chuẩn hệ SI</h4>
                    <p>Đọc lướt đề bài, khoanh tròn các thông số cho trước (<MathText text={'$v_0, h, \\alpha, m, t$'} />). Đổi ngay tất cả đơn vị về chuẩn: mét (m), giây (s), kg, Kelvin (K), mol.</p>
                    <div className="elec-step-tip">💡 Mẹo: Viết tắt đại lượng ngay bên lề đề thi: <MathText text={'$v_0 = 10\\text{ m/s}, h = 20\\text{ m}, g = 10\\text{ m/s}^2$'} />.</div>
                  </div>
                </div>

                <div className="elec-step-box">
                  <div className="elec-step-badge">BƯỚC 2</div>
                  <div className="elec-step-body">
                    <h4>Nhận diện mô hình &amp; Viết phương trình gốc</h4>
                    <p>Xác định bài toán thuộc mô hình nào: ném ngang (độc lập 2 phương), rơi tự do, bảo toàn cơ năng, hay cân bằng hóa học Le Chatelier. Viết phương trình tổng quát trước khi thay số.</p>
                    <div className="elec-step-tip">💡 Mẹo: Không bấm máy tính quá sớm khi chưa rút gọn ẩn số!</div>
                  </div>
                </div>

                <div className="elec-step-box">
                  <div className="elec-step-badge">BƯỚC 3</div>
                  <div className="elec-step-body">
                    <h4>Triệt tiêu ẩn &amp; Thế số tính toán</h4>
                    <p>Ghép nối các phương trình để triệt tiêu các đại lượng đề bài không hỏi (ví dụ khối lượng <MathText text="$m$" />, thời gian <MathText text="$t$" />). Tính ra đáp số và gán đơn vị.</p>
                    <div className="elec-step-tip">💡 Mẹo: Kiểm tra tính khả thi của kết quả: thời gian rơi vật lý không thể âm, tầm xa <MathText text="$L > 0$" />.</div>
                  </div>
                </div>

                <div className="elec-step-box">
                  <div className="elec-step-badge">BƯỚC 4</div>
                  <div className="elec-step-body">
                    <h4>Rà soát bẫy câu hỏi &amp; Khóa đáp án</h4>
                    <p>Đọc lại câu hỏi chốt: Đề bài hỏi vận tốc chạm đất <MathText text="$v$" /> hay chỉ hỏi thành phần vận tốc phương ngang <MathText text="$v_x$" />? Đề bài hỏi khoảng cách hay độ cao? Khóa đáp án chính xác.</p>
                    <div className="elec-step-tip">💡 Mẹo: 15 giây đọc lại câu hỏi giúp bạn cứu được ít nhất 0.25 - 0.5 điểm mỗi đề.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POMODORO 25/5 & LẶP LẠI NGẮT QUÃNG SRS */}
          {activeTab === 'pomodoro' && (
            <div className="elec-guide-section">
              <div className="elec-pomodoro-layout">
                <div className="elec-pomodoro-card">
                  <h3>Nhịp sinh học Pomodoro 25/5 trong ôn luyện KHTN</h3>
                  <div className="elec-pomo-cycles">
                    <div className="pomo-step work">
                      <span className="pomo-min">25 Phút</span>
                      <b>Tập trung tuyệt đối</b>
                      <p>Làm 1 mạch 15 câu trắc nghiệm hoặc đọc trọn vẹn 1 bài lý thuyết. Tắt toàn bộ thông báo mạng xã hội.</p>
                    </div>
                    <div className="pomo-arrow">➔</div>
                    <div className="pomo-step rest">
                      <span className="pomo-min">5 Phút</span>
                      <b>Nghỉ ngắn thư giãn</b>
                      <p>Uống nước, nhìn xa 6 mét để mắt nghỉ ngơi. Không lướt video ngắn để tránh xao nhãng não bộ.</p>
                    </div>
                    <div className="pomo-arrow">➔</div>
                    <div className="pomo-step cycle">
                      <span className="pomo-min">4 Chu kỳ</span>
                      <b>Nghỉ dài 20 phút</b>
                      <p>Sau 4 phiên (100 phút học sâu), nghỉ 20 phút để não bộ chuyển kiến thức từ bộ nhớ tạm sang dài hạn.</p>
                    </div>
                  </div>
                </div>

                <div className="elec-srs-card">
                  <h3>Định luật lặp lại ngắt quãng SRS (Spaced Repetition)</h3>
                  <p>Khoa học chứng minh sau 24 giờ não người quên đến 70% kiến thức nếu không ôn lại. Lộ trình SRS của ELEC AI tự động nhắc nhở:</p>
                  <div className="srs-schedule-grid">
                    <div className="srs-item">
                      <b>Ngày 1:</b> Học bài mới &amp; làm 10 câu nhận biết - thông hiểu
                    </div>
                    <div className="srs-item">
                      <b>Ngày 2:</b> Ôn lại thẻ Flashcard 3 phút &amp; giải 5 câu sai
                    </div>
                    <div className="srs-item">
                      <b>Ngày 4:</b> Làm bài kiểm tra nhanh 15 phút trộn các dạng
                    </div>
                    <div className="srs-item">
                      <b>Ngày 7:</b> Tổng ôn đề phân loại theo nguyện vọng trường
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHIẾN LƯỢC ĐỖ ANND (MỤC TIÊU 8.5+) */}
          {activeTab === 'strategy' && (
            <div className="elec-guide-section">
              <div className="elec-target-banner">
                <div className="elec-target-badge">NGUYỆN VỌNG: {targetSchool}</div>
                <h3>Lộ trình chinh phục ngưỡng điểm {targetScore} / 30 điểm</h3>
                <p>Khối thi đòi hỏi sự đồng đều và kỷ luật cao. Với mục tiêu {targetScore}đ, mỗi môn trong tổ hợp cần tối thiểu <b>8.67 - 9.0 điểm</b>.</p>
              </div>

              <div className="elec-score-breakdown">
                <div className="score-tier tier-easy">
                  <div className="score-tier-head">
                    <span className="tier-tag">0 - 7.0 ĐIỂM (28 CÂU ĐẦU)</span>
                    <h4>Vùng Điểm An Toàn Tuyệt Đối</h4>
                  </div>
                  <p><b>Nguyên tắc sắt đá:</b> 100% không được phép sai bất kỳ câu nhận biết hay công thức cơ bản nào. Mỗi câu sai ở vùng này tương đương với mất cơ hội vào {targetSchool}.</p>
                </div>

                <div className="score-tier tier-mid">
                  <div className="score-tier-head">
                    <span className="tier-tag">7.0 - 8.5 ĐIỂM (CÂU 29 - 36)</span>
                    <h4>Vùng Bứt Phá &amp; Quyết Định</h4>
                  </div>
                  <p><b>Trọng tâm:</b> Đòi hỏi kỹ năng nhận diện mô hình nhanh và làm chủ các chuyên đề trọng điểm (Chuyển động ném, Định luật Newton, Ester – Lipid, Điện phân, Di truyền học phân tử).</p>
                </div>

                <div className="score-tier tier-high">
                  <div className="score-tier-head">
                    <span className="tier-tag">8.5 - 10.0 ĐIỂM (4 CÂU CUỐI)</span>
                    <h4>Vùng Phân Loại Thủ Khoa</h4>
                  </div>
                  <p><b>Phương pháp:</b> Bài toán liên môn, đồ thị phức hợp và thí nghiệm thực hành. Chỉ tập trung giải sau khi đã chắc chắn 36 câu trước đã hoàn thành chính xác.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="elec-guide-footer">
          <span>Gia sư AI ELEC luôn đồng hành cùng bạn 24/7 để cá nhân hóa lộ trình tới {targetSchool}.</span>
          <button type="button" className="elec-guide-btn-primary" onClick={onClose}>
            Đã hiểu, quay lại phòng học
          </button>
        </div>
      </div>
    </div>
  );
}
