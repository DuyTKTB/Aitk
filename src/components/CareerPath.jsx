/* ============================================================
   CareerPath.jsx — ĐỊNH HƯỚNG NGHỀ NGHIỆP BẰNG AI
   Test RIASEC (Holland) 24 câu + môn mạnh + mục tiêu
   → AI phân tích → báo cáo 3 nhóm ngành phù hợp.
   AI hết quota → fallback theo ma trận RIASEC cứng.
   ============================================================ */
import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { askAI } from '../lib/ai.js';
import { useLocalStorage } from '../hooks.js';

const A = {
  page: { minHeight: '100dvh', background: 'var(--t-bg, #f4f6fb)', color: 'var(--t-ink, #0f172a)', fontFamily: 'var(--t-font-sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 720, margin: '0 auto', padding: '1.2rem 1rem 3rem' },
  card: { background: 'var(--t-surface-2, #fff)', border: '1px solid var(--t-border, rgba(100,120,180,.16))', borderRadius: 20, boxShadow: 'var(--t-shadow-sm)' },
  btn: { padding: '.65rem 1.6rem', borderRadius: 999, border: 'none', background: 'var(--t-accent, #5b6cff)', color: 'var(--t-accent-ink, #fff)', font: '700 .88rem var(--t-font-sans)', cursor: 'pointer' },
};

/* RIASEC — 24 câu (4 câu / nhóm) */
const RIASEC = [
  { k: 'R', name: 'Thực hành (Realistic)', qs: ['Tôi thích lắp ráp, sửa chữa đồ vật', 'Tôi thích làm việc bằng tay, vận động nhiều', 'Tôi thích vận hành máy móc, thiết bị', 'Tôi thích làm ngoài trời hơn ngồi bàn giấy'] },
  { k: 'I', name: 'Nghiên cứu (Investigative)', qs: ['Tôi thích giải toán, phá bài khó', 'Tôi thích tò mò tìm hiểu nguyên lý "vì sao"', 'Tôi thích làm thí nghiệm, phân tích số liệu', 'Tôi thích đọc tài liệu khoa học'] },
  { k: 'A', name: 'Nghệ thuật (Artistic)', qs: ['Tôi thích vẽ, thiết kế, sáng tạo hình ảnh', 'Tôi thích viết lách, kể chuyện', 'Tôi thích âm nhạc, diễn xuất', 'Tôi thích tự do sáng tạo hơn khuôn khổ'] },
  { k: 'S', name: 'Xã hội (Social)', qs: ['Tôi thích giúp đỡ, giải thích cho bạn học', 'Tôi thích hoạt động đội nhóm, kết nối mọi người', 'Tôi quan tâm sức khỏe, chăm sóc người khác', 'Tôi thích dạy bảo, hướng dẫn người khác'] },
  { k: 'E', name: 'Quản trị (Enterprising)', qs: ['Tôi thích lãnh đạo nhóm, ra quyết định', 'Tôi thích bán hàng, thuyết phục người khác', 'Tôi mơ mở công ty, kinh doanh riêng', 'Tôi thích thi thố, tranh biện để thắng'] },
  { k: 'C', name: 'Hành chính (Conventional)', qs: ['Tôi thích làm việc có thứ tự, kế hoạch rõ ràng', 'Tôi thích làm việc với bảng tính, số liệu gọn gàng', 'Tôi thích công việc ổn định, quy trình chuẩn', 'Tôi thích kiểm tra, đối chiếu chính xác từng chi tiết'] },
];

const SUBJECTS = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý', 'Tin học'];
const SCALE = ['Rất không thích', 'Không thích', 'Bình thường', 'Thích', 'Rất thích'];

/* Fallback khi AI không khả dụng */
const FALLBACK = {
  R: { name: 'Kỹ thuật - Công nghệ', majors: ['Kỹ thuật cơ khí', 'Tự động hóa', 'Kỹ thuật xây dựng'], unis: ['ĐH Bách Khoa Hà Nội', 'ĐH Bách Khoa TP.HCM'] },
  I: { name: 'Khoa học - Nghiên cứu', majors: ['Khoa học máy tính', 'Khoa học dữ liệu', 'Y khoa'], unis: ['ĐHQGHN', 'ĐHQG TP.HCM', 'ĐH Y Hà Nội'] },
  A: { name: 'Thiết kế - Truyền thông sáng tạo', majors: ['Thiết kế đồ họa', 'Truyền thông đa phương tiện', 'Nghệ thuật'], unis: ['ĐH Kiến trúc', 'ĐH Mỹ thuật', 'FPT'] },
  S: { name: 'Sức khỏe - Giáo dục - Xã hội', majors: ['Sư phạm', 'Điều dưỡng', 'Tâm lý học'], unis: ['ĐH Sư phạm Hà Nội', 'ĐH Y Hà Nội'] },
  E: { name: 'Kinh doanh - Quản trị', majors: ['Kinh tế', 'Marketing', 'Quản trị kinh doanh'], unis: ['ĐH Kinh tế Quốc dân', 'ĐH Ngoại thương', 'UEH'] },
  C: { name: 'Tài chính - Hành chính - Pháp lý', majors: ['Kế toán', 'Tài chính - Ngân hàng', 'Luật'], unis: ['ĐH Kinh tế Quốc dân', 'Học viện Ngân hàng', 'ĐH Luật Hà Nội'] },
};

export default function CareerPath() {
  const { user } = useAuth();
  const [step, setStep] = useState('intro'); // intro | test | loading | report
  const [answers, setAnswers] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [goal, setGoal] = useState('Công việc lương cao & ổn định');
  const [report, setReport] = useLocalStorage('cs-career-report', null);
  const [aiText, setAiText] = useState('');

  const allQs = useMemo(() => RIASEC.flatMap((g) => g.qs.map((q) => ({ g: g.k, q }))), []);
  const answeredCount = Object.keys(answers).length;

  const scores = useMemo(() => {
    const s = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const [i, v] of Object.entries(answers)) {
      const g = allQs[Number(i)]?.g;
      if (g) s[g] += Number(v) || 0;
    }
    return s;
  }, [answers, allQs]);

  const top3 = useMemo(() => Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]), [scores]);

  const analyze = async () => {
    setStep('loading');
    const profile =
      `Điểm RIASEC: ${RIASEC.map((g) => `${g.k}(${g.name})=${scores[g.k]}`).join(', ')}. ` +
      `Top 3 nhóm cao nhất: ${top3.join(', ')}. ` +
      `Môn học mạnh: ${subjects.join(', ') || 'chưa rõ'}. ` +
      `Mục tiêu: ${goal}. Học sinh lớp 12 Việt Nam, sắp thi tốt nghiệp THPT.`;

    const prompt =
      'Dựa trên dữ liệu sau, viết BÁO CÁO ĐỊNH HƯỚNG NGHỀ NGHIỆP cho học sinh. ' +
      'Trả về DUY NHẤT JSON (không thêm chữ nào ngoài JSON) theo cấu trúc: ' +
      '{"summary":"tóm tắt 2 câu về điểm mạnh","groups":[{"name":"tên nhóm ngành","match":82,"why":"vì sao phù hợp (1-2 câu)","majors":["ngành 1","ngành 2","ngành 3"],"unis":["trường 1","trường 2","trường 3"],"outlook":"triển vọng + mức lương khởi điểm tham khảo"}],"advice":"1 lời khuyên hành động cụ thể"} ' +
      'Yêu cầu: đúng 3 nhóm ngành, match là số 0-100 giảm dần, nội dung tiếng Việt, sát thực tế Việt Nam.\n\n' + profile;

    let text = '';
    try {
      await askAI(
        [{ role: 'user', text: prompt }],
        (chunk) => { text += chunk || ''; setAiText(text); },
        null,
        'Bạn là chuyên gia tư vấn hướng nghiệp cho học sinh Việt Nam. Trả lời đúng format JSON được yêu cầu, không thêm gì khác.'
      );
    } catch { /* fallback bên dưới */ }

    let data = null;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) data = JSON.parse(m[0]);
    } catch { /* fallback */ }

    if (!data?.groups?.length) {
      /* FALLBACK: ma trận RIASEC */
      data = {
        summary: `Hồ sơ nổi bật của bạn ở nhóm ${RIASEC.find((g) => g.k === top3[0])?.name} kết hợp ${RIASEC.find((g) => g.k === top3[1])?.name}.`,
        groups: top3.slice(0, 3).map((k, i) => ({
          name: FALLBACK[k].name,
          match: [88, 76, 65][i],
          why: `Bạn có xu hướng mạnh ở nhóm ${k} — phù hợp môi trường dạng này.`,
          majors: FALLBACK[k].majors,
          unis: FALLBACK[k].unis,
          outlook: 'Nhu cầu tuyển dụng ổn định trong 5-10 năm tới.',
        })),
        advice: 'Chọn 1 ngành trong nhóm phù hợp nhất, tìm hiểu đề thi tuyển sinh của 2-3 trường gợi ý ngay tuần này.',
      };
      setAiText('');
    }
    setReport({ ...data, at: Date.now(), profile: { scores, subjects, goal } });
    setStep('report');
  };

  /* ================= RENDER ================= */
  return (
    <div style={A.page}>
      <div style={A.wrap}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, font: '800 1.4rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Định hướng nghề nghiệp</h1>
          <p style={{ margin: '.15rem 0 0', color: 'var(--t-ink-muted, #64748b)', font: '500 .84rem var(--t-font-sans)' }}>
            Hiểu bản thân trước khi chọn ngành — AI phân tích theo mô hình RIASEC (Holland)
          </p>
        </div>

        {step === 'intro' && (
          <div style={{ ...A.card, padding: '1.6rem 1.4rem' }}>
            {report && (
              <button type="button" onClick={() => setStep('report')} style={{ ...A.btn, marginBottom: '1rem', background: 'var(--t-surface-3, #eef1f8)', color: 'var(--t-ink)', width: '100%' }}>
                Xem lại báo cáo lần trước
              </button>
            )}
            <b style={{ font: '800 1rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Bài test gồm 3 bước (~7 phút):</b>
            <ol style={{ margin: '.6rem 0 1rem', paddingLeft: '1.2rem', color: 'var(--t-ink-2, #334155)', font: '500 .86rem/1.7 var(--t-font-sans)' }}>
              <li>24 câu về sở thích — đánh giá 6 nhóm tính cách nghề nghiệp</li>
              <li>Chọn các môn học bạn thấy mạnh nhất</li>
              <li>Nêu mục tiêu — AI tổng hợp thành báo cáo 3 nhóm ngành phù hợp</li>
            </ol>
            <button type="button" style={A.btn} onClick={() => setStep('test')}>Bắt đầu test</button>
          </div>
        )}

        {step === 'test' && (
          <div style={{ ...A.card, padding: '1.3rem 1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <b style={{ font: '700 .78rem var(--t-font-sans)', color: 'var(--t-ink-faint, #94a3b8)' }}>
                {answeredCount < 24 ? `Câu hỏi ${answeredCount + 1}/24` : 'Bước 2: Môn mạnh + Mục tiêu'}
              </b>
              <small style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '600 .72rem var(--t-font-sans)' }}>{Math.round((answeredCount / 24) * 50)}%</small>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--t-surface-3, #eef1f8)', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ width: `${Math.min(100, (answeredCount / 24) * 50 + (answeredCount >= 24 ? 25 : 0))}%`, height: '100%', background: 'var(--t-accent, #5b6cff)', transition: 'width .3s' }} />
            </div>

            {answeredCount < 24 ? (
              <div>
                <div style={{ font: '700 1.02rem var(--t-font-sans)', color: 'var(--t-ink)', marginBottom: '.9rem', lineHeight: 1.5 }}>
                  {allQs[answeredCount].q}
                </div>
                <div style={{ display: 'grid', gap: '.4rem' }}>
                  {SCALE.map((s, i) => (
                    <button key={s} type="button" onClick={() => setAnswers((a) => ({ ...a, [answeredCount]: i + 1 }))}
                      style={{
                        padding: '.6rem .9rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: '1.5px solid var(--t-border, rgba(100,120,180,.16))', background: 'var(--t-surface-2, #fff)',
                        color: 'var(--t-ink)', font: '500 .88rem var(--t-font-sans)', transition: 'border-color .15s',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
                {answeredCount > 0 && (
                  <button type="button" onClick={() => { const a = { ...answers }; delete a[answeredCount - 1]; setAnswers(a); }}
                    style={{ marginTop: '.8rem', background: 'none', border: 'none', color: 'var(--t-ink-faint, #94a3b8)', font: '600 .76rem var(--t-font-sans)', cursor: 'pointer' }}>
                    Quay lại câu trước
                  </button>
                )}
              </div>
            ) : (
              <div>
                <b style={{ font: '700 .8rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Môn học bạn thấy mạnh nhất:</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', margin: '.5rem 0 1rem' }}>
                  {SUBJECTS.map((s) => (
                    <button key={s} type="button"
                      onClick={() => setSubjects((x) => x.includes(s) ? x.filter((y) => y !== s) : [...x, s])}
                      style={{
                        padding: '.4rem .85rem', borderRadius: 999, cursor: 'pointer', font: '600 .76rem var(--t-font-sans)',
                        border: `1.5px solid ${subjects.includes(s) ? 'var(--t-accent, #5b6cff)' : 'var(--t-border, rgba(100,120,180,.16))'}`,
                        background: subjects.includes(s) ? 'color-mix(in srgb, var(--t-accent, #5b6cff) 10%, var(--t-surface-2, #fff))' : 'var(--t-surface-2, #fff)',
                        color: subjects.includes(s) ? 'var(--t-accent, #5b6cff)' : 'var(--t-ink)',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
                <b style={{ font: '700 .8rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Mục tiêu hàng đầu:</b>
                <div style={{ display: 'grid', gap: '.4rem', margin: '.5rem 0 1.2rem' }}>
                  {['Công việc lương cao & ổn định', 'Được sáng tạo, tự do', 'Giúp đỡ cộng đồng, con người', 'Dẫn dắt, kinh doanh riêng', 'Nghiên cứu, khám phá'].map((g) => (
                    <button key={g} type="button" onClick={() => setGoal(g)}
                      style={{
                        padding: '.55rem .9rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${goal === g ? 'var(--t-accent, #5b6cff)' : 'var(--t-border, rgba(100,120,180,.16))'}`,
                        background: goal === g ? 'color-mix(in srgb, var(--t-accent, #5b6cff) 8%, var(--t-surface-2, #fff))' : 'var(--t-surface-2, #fff)',
                        color: 'var(--t-ink)', font: '500 .85rem var(--t-font-sans)',
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
                <button type="button" style={{ ...A.btn, width: '100%' }} onClick={analyze}>
                  Phân tích bằng AI
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'loading' && (
          <div style={{ ...A.card, padding: '2.5rem 1.4rem', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--t-border, #e2e8f0)', borderTopColor: 'var(--t-accent, #5b6cff)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--t-ink-muted, #64748b)', font: '600 .88rem var(--t-font-sans)', margin: 0 }}>AI đang phân tích hồ sơ của bạn…</p>
            {aiText && <p style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '400 .7rem var(--t-font-sans)', marginTop: '.5rem' }}>Đã nhận {aiText.length} ký tự…</p>}
          </div>
        )}

        {step === 'report' && report && (
          <div>
            <div style={{ ...A.card, padding: '1.2rem 1.3rem', marginBottom: '.8rem' }}>
              <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Tổng quan</b>
              <p style={{ color: 'var(--t-ink-2, #334155)', font: '500 .88rem/1.6 var(--t-font-sans)', margin: '.4rem 0 0' }}>{report.summary}</p>
            </div>

            {report.groups?.map((g, i) => (
              <div key={i} style={{ ...A.card, padding: '1.1rem 1.2rem', marginBottom: '.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem' }}>
                  <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-ink)' }}>{i + 1}. {g.name}</b>
                  <span style={{
                    font: '800 .85rem var(--t-font-sans)', padding: '.25rem .7rem', borderRadius: 999, flexShrink: 0,
                    background: g.match >= 80 ? 'var(--t-status-ok-subtle, #dcfce7)' : g.match >= 65 ? 'rgba(245,158,11,.12)' : 'var(--t-surface-3, #eef1f8)',
                    color: g.match >= 80 ? 'var(--t-status-ok, #16a34a)' : g.match >= 65 ? '#f59e0b' : 'var(--t-ink-muted, #64748b)',
                  }}>{g.match}% phù hợp</span>
                </div>
                <p style={{ color: 'var(--t-ink-2, #334155)', font: '500 .84rem/1.55 var(--t-font-sans)', margin: '.45rem 0' }}>{g.why}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                  {(g.majors || []).map((m) => (
                    <small key={m} style={{ padding: '.28rem .7rem', borderRadius: 999, background: 'var(--t-surface-3, #eef1f8)', color: 'var(--t-ink-2, #334155)', font: '600 .74rem var(--t-font-sans)' }}>{m}</small>
                  ))}
                </div>
                <p style={{ margin: '.55rem 0 0', color: 'var(--t-ink-faint, #94a3b8)', font: '500 .74rem var(--t-font-sans)' }}>
                  Trường gợi ý: {(g.unis || []).join(' · ')}
                </p>
                {g.outlook && <p style={{ margin: '.3rem 0 0', color: 'var(--t-ink-faint, #94a3b8)', font: '500 .74rem var(--t-font-sans)' }}>Triển vọng: {g.outlook}</p>}
              </div>
            ))}

            <div style={{ ...A.card, padding: '1rem 1.2rem', marginBottom: '.8rem', borderLeft: '3px solid var(--t-accent, #5b6cff)' }}>
              <b style={{ font: '700 .82rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)' }}>Lời khuyên</b>
              <p style={{ color: 'var(--t-ink-2, #334155)', font: '500 .84rem/1.55 var(--t-font-sans)', margin: '.3rem 0 0' }}>{report.advice}</p>
            </div>

            <button type="button" style={{ ...A.btn, width: '100%' }} onClick={() => setStep('test')}>Làm lại bài test</button>
          </div>
        )}
      </div>
    </div>
  );
}
