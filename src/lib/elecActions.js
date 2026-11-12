/* ============================================================
   elecActions.js — 40 BIỂU CẢM / HÀNH ĐỘNG của linh vật ELEC AI
   ------------------------------------------------------------
   Mỗi hành động = 1 ảnh PNG cảm xúc tách nền
                 + 1 kiểu chuyển động (anim)
                 + 1 hiệu ứng bay quanh (fx, có thể null)
                 + các câu nói động viên trong bong bóng thoại.
   0 EMOJI trong code ✓ — 100% SVG và ảnh chuẩn
   ============================================================ */

export const ELEC_ACTIONS = [
  { id: 'wave',      img: 'hello',           anim: 'bob',    fx: null,       say: ['Chào bạn!', 'Hi hi, chào nè!'] },
  { id: 'greet',     img: 'hello',           anim: 'bob',    fx: 'stars',    say: ['Chào nha, ai đó!', 'Nháy mắt chào bạn!'] },
  { id: 'excited',   img: 'happy',           anim: 'bounce', fx: 'hearts',   say: ['Vui quá đi!', 'Hôm nay sướng thật sự!'] },
  { id: 'love',      img: 'love',            anim: 'pulse',  fx: 'hearts',   say: ['Mình thương bạn nhiều!', 'Thích bạn quá đi!'] },
  { id: 'superjump', img: 'fighting',        anim: 'jump',   fx: 'hearts',   say: ['Nhảy tưng tưng nào!', 'Bay lên nào!'] },
  { id: 'dance',     img: 'happy',           anim: 'dance',  fx: 'notes',    say: ['Nhảy một điệu nào!', 'Vũ điệu hóa học!'] },
  { id: 'sing',      img: 'happy',           anim: 'sway',   fx: 'notes',    say: ['La la la~', 'Hát cho bạn nghe nè!'] },
  { id: 'vibe',      img: 'cool',            anim: 'sway',   fx: 'notes',    say: ['Chill thôi!', 'Nghe nhạc học bài nhé!'] },
  { id: 'idea',      img: 'think',           anim: 'pulse',  fx: 'bulb',     say: ['À, mình có ý này!', 'Sáng ra một ý tưởng!'] },
  { id: 'hmm',       img: 'think',           anim: 'nod',    fx: 'question', say: ['Hmm... để mình nghĩ', 'Câu này khó ghê...'] },
  { id: 'confused',  img: 'suspicious',      anim: 'tilt',   fx: 'question', say: ['Hả? Nghĩa là sao?', 'Mình chưa hiểu lắm...'] },
  { id: 'wonder',    img: 'think',           anim: 'bob',    fx: 'question', say: ['Hay là... vậy nhỉ?', 'Điều gì đang xảy ra nhỉ?'] },
  { id: 'eureka',    img: 'happy',           anim: 'zoom',   fx: 'bulb',     say: ['EUREKA! Hiểu rồi!', 'Aha! Đáp án rồi!'] },
  { id: 'study',     img: 'fighting',        anim: 'nod',    fx: null,       say: ['Học chăm chỉ nào!', 'Vô bài thôi bạn ơi!'] },
  { id: 'tired',     img: 'exhausted',       anim: 'sway',   fx: 'zzz',      say: ['Mệt quá... nghỉ chút nhé', 'Pin mình sắp yếu rồi...'] },
  { id: 'sleepy',    img: 'sleepy',          anim: 'bob',    fx: 'zzz',      say: ['Zzz... buồn ngủ quá', 'Ngủ một giấc thôi...'] },
  { id: 'nap',       img: 'sleeping-pillow', anim: 'pulse',  fx: 'zzz',      say: ['Chợp mắt chút thôi...', 'Nằm nghỉ 5 phút nha...'] },
  { id: 'wake',      img: 'happy',           anim: 'bounce', fx: 'exclaim',  say: ['Dậy rồi! Nạp năng lượng!', 'Cho mình xin một ly năng lượng!'] },
  { id: 'shocked',   img: 'shocked',         anim: 'zoom',   fx: 'exclaim',  say: ['Ổn không vậy?!', 'Trời ơi, bất ngờ quá!'] },
  { id: 'panic',     img: 'shocked',         anim: 'shake',  fx: 'sweat',    say: ['Thi gần rồi, lo quá!', 'Chưa học gì hết trơn á!'] },
  { id: 'phew',      img: 'exhausted',       anim: 'bob',    fx: 'sweat',    say: ['Phù, kịp rồi!', 'Suýt nữa thì trượt!'] },
  { id: 'oops',      img: 'plead',           anim: 'tilt',   fx: 'sweat',    say: ['Ui, sai rồi...', 'Lỡ tay rồi hehe...'] },
  { id: 'cool',      img: 'cool',            anim: 'tilt',   fx: 'stars',    say: ['Cool ngầu quá nhỉ!', 'Nhìn này, ngầu chưa!'] },
  { id: 'star',      img: 'heart-eyes',      anim: 'spin',   fx: 'stars',    say: ['Bạn là ngôi sao mà!', 'Sáng như sao vậy!'] },
  { id: 'rock',      img: 'super-saiyan',    anim: 'shake',  fx: 'bolts',    say: ['Rock vào bài nào!', 'Cháy hết mình nhé!'] },
  { id: 'charge',    img: 'super-saiyan',    anim: 'pulse',  fx: 'bolts',    say: ['Đang sạc điện...', 'Nạp đầy pin đây!'] },
  { id: 'thunder',   img: 'super-saiyan',    anim: 'jump',   fx: 'bolts',    say: ['Sét đánh rồi kìa!', 'Năng lượng đầy ắp!'] },
  { id: 'powerup',   img: 'super-saiyan',    anim: 'zoom',   fx: 'bolts',    say: ['POWER UP!', 'Cường độ tối đa!'] },
  { id: 'spin',      img: 'happy',           anim: 'spin',   fx: 'sparkles', say: ['Xoay vòng vòng~', 'Choáng chưa kìa!'] },
  { id: 'magic',     img: 'wink',            anim: 'spin',   fx: 'sparkles', say: ['Phù thủy một câu nhé!', 'Ma thuật xuất hiện!'] },
  { id: 'sparkle',   img: 'heart-eyes',      anim: 'pulse',  fx: 'sparkles', say: ['Lấp lánh ghê!', 'Tỏa sáng nào!'] },
  { id: 'shine',     img: 'cool',            anim: 'bounce', fx: 'sparkles', say: ['Tỏa sáng như sao!', 'Hôm nay rực rỡ quá!'] },
  { id: 'cheer',     img: 'celebrate',       anim: 'jump',   fx: 'exclaim',  say: ['Cố lên bạn ơi!', 'Cổ vũ hết mình!'] },
  { id: 'wow',       img: 'shocked',         anim: 'zoom',   fx: 'exclaim',  say: ['WOW, giỏi ghê!', 'Đỉnh thật đấy!'] },
  { id: 'focus',     img: 'fighting',        anim: 'nod',    fx: 'bulb',     say: ['Tập trung 100%!', 'Não đang chạy full tải!'] },
  { id: 'genius',    img: 'wink',            anim: 'tilt',   fx: 'bulb',     say: ['Genius được đấy!', 'Đầu óc siêu phàm!'] },
  { id: 'hi5',       img: 'celebrate',       anim: 'shake',  fx: 'stars',    say: ['Cho mình xin chúc mừng!', 'Hoan hô chiến thắng!'] },
  { id: 'shy',       img: 'shy',             anim: 'sway',   fx: 'hearts',   say: ['Hihi, ngại quá...', 'Khen mình á? Ngại thiệt!'] },
  { id: 'tease',     img: 'wink',            anim: 'wiggle', fx: 'question', say: ['Trả lời được không ta?', 'Chắc chưa nhé~'] },
  { id: 'ready',     img: 'fighting',        anim: 'wiggle', fx: 'exclaim',  say: ['Sẵn sàng chiến đấu!', 'Bắt đầu luôn nào!'] },
];

/* Chọn 1 hành động ngẫu nhiên, tránh lặp lại hành động vừa chơi */
export function randomAction(prevId) {
  if (!ELEC_ACTIONS.length) return null;
  let a = ELEC_ACTIONS[Math.floor(Math.random() * ELEC_ACTIONS.length)];
  if (ELEC_ACTIONS.length > 1) {
    let guard = 0;
    while (a.id === prevId && guard++ < 10) {
      a = ELEC_ACTIONS[Math.floor(Math.random() * ELEC_ACTIONS.length)];
    }
  }
  return a;
}
