import { useEffect, useRef, useState } from 'react';
import { FaqIcon } from './Art3D.jsx';

/* ============================================================
   LandingSections.jsx — nội dung bổ sung cho trang chủ ELEC AI
   Nhận `kit` từ Landing.jsx: { Split, MagBtn, openAuth, IcoArrow }
   ============================================================ */

function useIn(th = 0.25) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: th });
    io.observe(el);
    return () => io.disconnect();
  }, [th]);
  return [ref, on];
}

/* ---------------------------------------------------------------
   Ảnh minh họa (đặt trong public/img/landing/)
   --------------------------------------------------------------- */
const SHOTS = {
  analytics: { src: '/img/landing/analytics.avif', w: 1080, h: 608, alt: 'Trang thống kê Elo THPT hiển thị điểm theo môn và theo chuyên đề', cap: 'Thống kê Elo theo môn và chuyên đề' },
  roadmap: { src: '/img/landing/roadmap.avif', w: 1080, h: 608, alt: 'Thống kê học tập với đếm ngược kỳ thi, điểm dự đoán và kế hoạch ôn', cap: 'Đếm ngược kỳ thi, điểm dự đoán và kế hoạch ôn' },
  practice: { src: '/img/landing/practice.avif', w: 1080, h: 608, alt: 'Màn hình làm bài thi có bộ đếm giờ và danh sách câu hỏi', cap: 'Màn hình làm bài của học sinh, có đếm giờ' },
  career: { src: '/img/landing/career.avif', w: 1080, h: 663, alt: 'Gợi ý ngành và trường đại học kèm mức độ phù hợp', cap: 'Gợi ý ngành và trường kèm mức độ phù hợp' },
};

function Shot({ k }) {
  const s = SHOTS[k];
  return (
    <figure className="lm-shot">
      <img src={s.src} width={s.w} height={s.h} alt={s.alt} loading="lazy" decoding="async" />
      <figcaption>{s.cap}</figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------
   1. DÀNH CHO AI
   --------------------------------------------------------------- */
const WHO = [
  {
    id: 'hs', tab: 'Học sinh',
    h: 'Hiểu bài ngay tối nay, nhớ đến ngày thi',
    lead: 'Không cần chờ đến buổi học thêm. Gặp bài khó thì chụp ảnh gửi AI, xem lời giải từng bước, hỏi lại đến khi hiểu, rồi làm quiz để chắc chắn mình nắm được.',
    items: [
      ['image', 'Chụp đề, nhận lời giải', 'Gửi tối đa 10 ảnh một lần. AI giải từng bước, mỗi bước kèm lý do.'],
      ['wrong', 'Câu sai tự vào sổ', 'Làm quiz xong, câu sai được lưu cùng đáp án đúng để ôn riêng.'],
      ['repeat', 'Nhắc ôn đúng lúc', 'Lịch ôn lặp lại đưa câu hay nhầm quay lại trước khi bạn quên.'],
      ['trophy', 'Giữ nhịp mỗi ngày', 'Điểm kinh nghiệm, thành tích và chuỗi ngày học giúp bạn học đều tay.'],
    ],
    day: [
      ['Buổi tối', 'Chụp bài tập khó, AI giải từng bước, chỗ nào chưa rõ thì hỏi tiếp.'],
      ['Mười phút sau', 'Làm vài câu quiz cùng chuyên đề để kiểm tra mình đã hiểu chưa.'],
      ['Cuối tuần', 'Mở Sổ câu sai, ôn lại đúng những câu hay nhầm.'],
    ],
    shot: 'analytics',
    cta: ['Tạo tài khoản học sinh', 'register'],
  },
  {
    id: 'gv', tab: 'Giáo viên',
    h: 'Giao đề trong vài phút, theo dõi cả lớp',
    lead: 'Biến tài liệu có sẵn thành đề kiểm tra, giao cho cả lớp bằng một mã và xem kết quả ngay khi học sinh nộp bài.',
    items: [
      ['upload', 'Tạo đề từ tài liệu có sẵn', 'Tải ảnh, PDF hoặc Word. AI tách thành câu hỏi, hoặc bạn tự soạn thủ công.'],
      ['note', 'Duyệt từng câu rồi mới giao', 'Sửa đề, đáp án và lời giải ngay trên trang trước khi gửi cho lớp.'],
      ['shield', 'Chọn mức giám sát cho từng đề', 'Bộ đếm giờ, phát hiện rời khỏi bài và theo dõi trực tiếp. Mức giám sát do bạn quyết định.'],
      ['chart', 'Biết cần dạy lại phần nào', 'Xem điểm, câu sai nhiều nhất và tiến độ của từng học sinh.'],
    ],
    day: [
      ['Soạn', 'Tải đề hoặc tài liệu lên, duyệt từng câu.'],
      ['Giao', 'Gửi mã lớp hoặc đường dẫn đề cho học sinh.'],
      ['Theo dõi', 'Xem tiến độ lúc lớp làm bài và kết quả sau khi nộp.'],
    ],
    note: 'Tài khoản giáo viên được cấp quyền tạo đề và quản lý lớp.',
    cta: ['Tôi là giáo viên', 'login'],
  },
  {
    id: 'on', tab: 'Ôn thi',
    h: 'Ôn có kế hoạch, không bỏ sót chuyên đề',
    lead: 'Gom đề thi, lịch ôn và thống kê vào một nơi để mỗi sáng bạn biết hôm nay nên ôn gì.',
    items: [
      ['library', 'Kho đề thi theo lớp', 'Sách giáo khoa, chuyên đề, lý thuyết và đề thi nằm cùng một chỗ.'],
      ['clock', 'Đếm ngược ngày thi', 'Đặt kỳ thi, xem còn bao nhiêu ngày và giữ nhịp học bằng Pomodoro.'],
      ['chart', 'Thấy ngay chuyên đề yếu', 'Thống kê cho biết chuyên đề nào sai nhiều để ôn đúng chỗ.'],
      ['repeat', 'Ôn lại câu hay sai', 'Sổ câu sai nhắc lại đúng những câu cần ôn, không phải làm lại cả đề.'],
    ],
    day: [
      ['Sáng', 'Xem còn bao nhiêu ngày đến kỳ thi và chuyên đề nào cần ưu tiên.'],
      ['Chiều', 'Làm một đề trong kho đề, chạy Pomodoro để giữ tập trung.'],
      ['Tối', 'Xem lại câu sai, ghi chú lý do sai vào sổ tay.'],
    ],
    shot: 'roadmap',
    cta: ['Bắt đầu ôn thi', 'register'],
  },
];

export function Audience({ kit }) {
  const { Split, MagBtn, IcoArrow } = kit;
  const [k, setK] = useState(0);
  const w = WHO[k];
  return (
    <section className="lp-wrap lm-sec" id="lp-who">
      <div className="lm-head">
        <Split text="Dù bạn là ai, hôm nay cũng bắt đầu được" />
        <p>Chọn vai trò để xem ELEC AI giúp bạn cụ thể thế nào.</p>
      </div>
      <div className="lm-tabs" role="tablist" aria-label="Chọn vai trò">
        {WHO.map((x, i) => (
          <button key={x.id} type="button" role="tab" aria-selected={i === k} className={i === k ? 'on' : ''} onClick={() => setK(i)}>{x.tab}</button>
        ))}
      </div>
      <div className="lm-who" key={w.id} role="tabpanel">
        <div className="lm-who-copy">
          <h3>{w.h}</h3>
          <p>{w.lead}</p>
          <div className="lm-who-cta">
            <MagBtn as="a" className="lp-btn pri" href={'#' + w.cta[1]}>{w.cta[0]} <IcoArrow size={16} /></MagBtn>
          </div>
          {w.note && <small>{w.note}</small>}
          {w.shot && <Shot k={w.shot} />}
        </div>
        <ul className="lm-items">
          {w.items.map(([ic, t, d]) => (
            <li key={t} className="lm-item">
              <span className="lm-ico"><FaqIcon name={ic} size={24} /></span>
              <b>{t}</b>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <ol className="lm-day">
          {w.day.map(([t, d]) => (<li key={t}><b>{t}</b><span>{d}</span></li>))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   2. TẤT CẢ CÔNG CỤ (bento)
   --------------------------------------------------------------- */
const PT = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag'];

const BENTO = [
  {
    cls: 'bt-ai', icon: 'spark', t: 'Hỏi AI',
    d: 'Một trợ lý Hóa học đi cùng bạn từ bài tập đầu tiên đến đề thi.',
    pts: ['Gõ câu hỏi, dán ảnh đề hoặc nói bằng giọng', 'Chọn Lớp 10, 11, 12 hoặc Đại học để câu trả lời đúng mức', 'Chế độ Suy luận để giải bài, chế độ Tra cứu để tìm kiến thức', 'Lịch sử trò chuyện để quay lại bài cũ'],
    vis: 'chat',
  },
  {
    cls: 'bt-pt', icon: 'grid', t: 'Bảng tuần hoàn 118 nguyên tố',
    d: 'Tra cứu nhanh và học theo nhóm thay vì học thuộc lòng.',
    pts: ['Tìm theo ký hiệu, tên hoặc số hiệu, lọc theo nhóm', 'Mỗi nguyên tố có cấu hình electron, số oxi hóa, ứng dụng và mẹo nhớ', 'So sánh nguyên tố cạnh nhau, có nguyên tố của ngày'],
    vis: 'table',
  },
  {
    cls: 'bt-calc', icon: 'calc', t: 'Tính toán Hóa học',
    d: 'Những phép tính lặp đi lặp lại, có sẵn khi cần.',
    pts: ['Cân bằng phương trình hóa học', 'Khối lượng mol và phân tích hợp chất', 'Thư viện công thức, tính điểm trung bình'],
  },
  {
    cls: 'bt-rev', icon: 'repeat', t: 'Ôn tập thông minh',
    d: 'Học xong là ôn luôn, đúng chỗ còn yếu.',
    pts: ['Quiz nhiều chế độ, AI sinh câu hỏi từ bài vừa học', 'Sổ câu sai và lịch ôn lặp lại', 'Điểm kinh nghiệm, thành tích, thống kê tiến độ'],
  },
  {
    cls: 'bt-lab', icon: 'flask', t: 'Phòng lab ảo và sáu trò chơi',
    d: 'Ôn Hóa mà không thấy chán. Điểm được lưu, câu sai được ghi lại.',
    pts: ['Phòng lab ảo để thử phản ứng an toàn', 'Bắt gà, Ná cao su, Jeopardy', 'Đấu nguyên tố, Sudoku hóa học'],
    vis: 'games',
  },
  {
    cls: 'bt-lib', icon: 'library', t: 'Thư viện học tập',
    d: 'Tài liệu nằm cùng chỗ với bài học.',
    pts: ['39 mục sách, chuyên đề, lý thuyết', 'Kho đề thi theo lớp', '351 công cụ AI miễn phí, 346 prompt mẫu'],
  },
  {
    cls: 'bt-mng', icon: 'clock', t: 'Quản lý việc học',
    d: 'Giữ nhịp bằng những công cụ nhỏ nhưng dùng mỗi ngày.',
    pts: ['Pomodoro, đồng hồ, kỳ thi đếm ngược', 'Ghi chú và thống kê tiến độ', 'Thú cưng học tập đi cùng bạn'],
  },
  {
    cls: 'bt-all', icon: 'phone', t: 'Dùng ở mọi nơi',
    d: 'Mở trên trình duyệt điện thoại hoặc máy tính, thêm vào màn hình chính như một ứng dụng. Giao diện sáng hoặc tối tùy bạn, tiến độ đồng bộ theo tài khoản.',
    pts: [],
  },
];

const BentoVis = ({ k }) => {
  if (k === 'chat') {
    return (
      <div className="bt-vis bv-chat" aria-hidden="true">
        <u className="me">Cân bằng giúp mình: Al + HCl → AlCl₃ + H₂</u>
        <u className="ai">Bước 1: Đếm nguyên tử hai vế. Cl lệch 1 và 3, nên thêm hệ số 3 trước HCl.</u>
        <u className="ai">2Al + 6HCl → 2AlCl₃ + 3H₂</u>
        <span><i>Lớp 11</i><i>Suy luận</i></span>
      </div>
    );
  }
  if (k === 'table') {
    return (
      <div className="bt-vis bv-pt" aria-hidden="true">
        {PT.map((e, i) => <u key={e} style={{ '--k': i }}>{e}</u>)}
      </div>
    );
  }
  if (k === 'games') {
    return (
      <div className="bt-vis bv-gm" aria-hidden="true">
        {['Bắt gà', 'Ná cao su', 'Jeopardy', 'Phòng lab ảo', 'Đấu nguyên tố', 'Sudoku'].map((g) => <u key={g}>{g}</u>)}
      </div>
    );
  }
  return null;
};

export function Bento({ kit }) {
  const { Split } = kit;
  return (
    <section className="lp-wrap lm-sec" id="lp-all">
      <div className="lm-head">
        <Split text="Mọi thứ để học Hóa, gom về một chỗ" />
        <p>Không phải mở năm tab và ba ứng dụng. Từ hỏi bài, tra bảng tuần hoàn, làm quiz đến chơi trò chơi ôn tập đều dùng chung một tài khoản.</p>
      </div>
      <div className="lm-bento">
        {BENTO.map((b) => (
          <article key={b.t} className={'bt ' + b.cls}>
            <span className="lm-ico"><FaqIcon name={b.icon} size={24} /></span>
            <h3>{b.t}</h3>
            <p>{b.d}</p>
            {b.pts.length > 0 && <ul>{b.pts.map((x) => <li key={x}>{x}</li>)}</ul>}
            <BentoVis k={b.vis} />
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   3. PHÒNG THI TRỰC TUYẾN
   --------------------------------------------------------------- */
const EXAM_STEPS = [
  ['Tạo đề', 'Soạn thủ công hoặc để AI tạo từ ảnh, PDF, Word.'],
  ['Duyệt', 'Xem từng câu, sửa đề, đáp án và lời giải.'],
  ['Giao', 'Gửi mã lớp hoặc đường dẫn cho học sinh.'],
  ['Theo dõi', 'Xem tiến độ và các lần rời khỏi bài khi lớp đang làm.'],
  ['Xem kết quả', 'Điểm cả lớp, câu sai nhiều nhất, tiến độ từng bạn.'],
];
const LIVE = [
  ['Minh Anh', 100, 'Đã nộp', 'ok'],
  ['Quốc Bảo', 72, 'Đang làm', 'go'],
  ['Thu Hà', 48, 'Đang làm', 'go'],
  ['Gia Huy', 60, 'Rời bài 1 lần', 'warn'],
  ['Ngọc Lan', 100, 'Đã nộp', 'ok'],
];

export function ExamFlow({ kit }) {
  const { Split, MagBtn, IcoArrow } = kit;
  const [ref, on] = useIn(0.35);
  return (
    <section className="lp-wrap lm-sec lm-exam" id="lp-exam">
      <div className="lm-exam-copy">
        <Split text="Phòng thi trực tuyến, từ đề đến điểm" />
        <p className="lm-lead">Giáo viên giao bài và nhìn thấy lớp đang làm đến đâu. Học sinh làm bài có đếm giờ và xem kết quả ngay sau khi nộp.</p>
        <ol className="lm-steps-v">
          {EXAM_STEPS.map(([t, d]) => (<li key={t}><b>{t}</b><span>{d}</span></li>))}
        </ol>
        <p className="lm-side">Với học sinh: bộ đếm giờ, nộp bài một chạm, đáp án và lời giải hiện ngay, câu sai tự vào Sổ câu sai.</p>
        <div className="lm-who-cta">
          <MagBtn as="a" className="lp-btn pri" href="#login">Tôi là giáo viên <IcoArrow size={16} /></MagBtn>
          <MagBtn as="a" className="lp-btn" href="#register">Tôi có mã lớp</MagBtn>
        </div>
      </div>

      <div className="lm-live-wrap" data-scrub="enter">
        <div ref={ref} className={'lm-live' + (on ? ' in' : '')} aria-hidden="true">
          <div className="lm-live-bar"><i /><i /><i /><span>Kiểm tra 15 phút, Lớp 11</span><em>Đang diễn ra</em></div>
          <div className="lm-live-sum"><b>5</b> học sinh <span>·</span> <b>2</b> đã nộp <span>·</span> <b>1</b> cần chú ý</div>
          <ul>
            {LIVE.map(([n, v, s, c], i) => (
              <li key={n} style={{ '--w': v / 100, '--d': i * 90 + 'ms' }}>
                <span className="lm-av">{n.split(' ').pop().charAt(0)}</span>
                <b>{n}</b>
                <span className="lm-bar"><i /></span>
                <em className={'lm-chip ' + c}>{s}</em>
              </li>
            ))}
          </ul>
        </div>
        <p className="lm-cap">Minh họa giao diện theo dõi của giáo viên</p>
        <Shot k="practice" />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   4. HƠN CẢ HÓA HỌC — vòng chip 3D xoay theo cuộn
   --------------------------------------------------------------- */
const CATS = ['Hóa học', 'Toán', 'Vật lý', 'Ngữ văn', 'Tiếng Anh', 'Lập trình', 'Dịch thuật', 'Viết lách', 'Sáng tạo', 'Video', 'Tiếp thị', 'Đời sống'];

export function Beyond({ kit }) {
  const { Split } = kit;
  return (
    <section className="lp-wrap lm-sec lm-beyond" id="lp-more">
      <div className="lm-head">
        <Split text="Hóa học là khởi đầu, không phải giới hạn" />
        <p>AI Tạo Đề dùng được cho nhiều môn, và thư viện prompt có sẵn mẫu cho Toán, Lý, Văn, Tiếng Anh cùng nhiều việc học khác. Công cụ riêng cho Hóa như bảng tuần hoàn hay cân bằng PTHH vẫn nằm ngay cạnh.</p>
      </div>
      <div className="lm-ring-wrap" data-scrub="thru" aria-hidden="true">
        <div className="lm-ring">
          {CATS.map((c, i) => (<span key={c} style={{ '--a': i * (360 / CATS.length) + 'deg' }}>{c}</span>))}
        </div>
      </div>
      <div className="lm-career">
        <div className="lm-career-copy">
          <h3>Còn phân vân chọn ngành?</h3>
          <p>Xem gợi ý ngành và trường phù hợp, kèm mức độ phù hợp để bạn so sánh trước khi quyết định.</p>
        </div>
        <Shot k="career" />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   5. CAM KẾT
   --------------------------------------------------------------- */
const TRUST = [
  ['bolt', 'Miễn phí để bắt đầu', 'Phần lớn công cụ dùng miễn phí, không cần thẻ và không phải cài đặt.'],
  ['phone', 'Chạy trên mọi thiết bị', 'Mở trên trình duyệt hoặc thêm vào màn hình chính như một ứng dụng.'],
  ['lock', 'Dữ liệu gắn với tài khoản', 'Tiến độ, sổ câu sai và ghi chú theo bạn sang máy khác. Không chia sẻ cho bên thứ ba.'],
  ['shield', 'AI hỗ trợ, không thay bạn', 'Mỗi bước đều có lý do để bạn kiểm tra lại. Khi cần, hãy đối chiếu sách giáo khoa.'],
];

export function Trust() {
  return (
    <section className="lp-wrap lm-trust" aria-label="Cam kết">
      {TRUST.map(([ic, t, d]) => (
        <div key={t}>
          <span className="lm-ico"><FaqIcon name={ic} size={22} /></span>
          <b>{t}</b>
          <span>{d}</span>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------
   6. BẮT ĐẦU TRONG 3 BƯỚC (đặt trong khối CTA)
   --------------------------------------------------------------- */
export function StartSteps() {
  return (
    <ol className="lm-steps">
      <li><b>Tạo tài khoản</b><span>Vài giây, miễn phí.</span></li>
      <li><b>Chọn lớp của bạn</b><span>Lớp 10, 11, 12 hoặc Đại học.</span></li>
      <li><b>Hỏi câu đầu tiên</b><span>Gõ hoặc chụp ảnh đề.</span></li>
    </ol>
  );
}