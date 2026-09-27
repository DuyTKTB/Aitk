export default function GameOverModal({ title, score, onRestart, extra }) {
  return (
    <div className="backdrop">
      <div className="gameover-modal" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <div className="grade-big">
          <span>ĐIỂM CUỐI CÙNG</span>
          <b>{score}</b>
        </div>
        {extra}
        <div className="row center" style={{ marginTop: '1.5rem' }}>
          <button className="btn primary" onClick={onRestart} type="button">Chơi lại</button>
          <a className="btn" href="#games">← Danh sách</a>
        </div>
      </div>
    </div>
  );
}