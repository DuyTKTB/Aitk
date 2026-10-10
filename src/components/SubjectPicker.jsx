/* ============================================================
   SubjectPicker.jsx — Chọn môn cho AI tạo đề
   ------------------------------------------------------------
   <SubjectPicker value={subject} onChange={setSubject} disabled={busy} />
   • value: tên môn (chuỗi), VD 'Toán'
   • Bấm chip để chọn nhanh; gõ vào ô "Môn khác" cho môn bất kỳ
   ============================================================ */
import { useState } from 'react';
import { SUBJECTS, getSubject } from '../lib/subjects.js';
import '../styles/subject-picker.css';

export default function SubjectPicker({ value, onChange, disabled = false }) {
  const known = SUBJECTS.some((s) => s.label === value);
  const [custom, setCustom] = useState(known ? '' : value || '');

  const pickChip = (label) => {
    setCustom('');
    onChange(label);
  };

  const typeCustom = (e) => {
    const v = e.target.value;
    setCustom(v);
    if (v.trim()) onChange(v.trim());
  };

  return (
    <div className="sp" role="group" aria-label="Chọn môn học">
      <div className="sp-chips">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            aria-pressed={value === s.label && !custom}
            className={'sp-chip' + (value === s.label && !custom ? ' on' : '')}
            onClick={() => pickChip(s.label)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label className={'sp-custom' + (custom ? ' on' : '')}>
        <span>Môn khác</span>
        <input
          value={custom}
          onChange={typeCustom}
          disabled={disabled}
          placeholder="Gõ tên môn bất kỳ, VD: Âm nhạc, Tiếng Nhật…"
          maxLength={60}
        />
      </label>
      {custom.trim() && getSubject(custom).id !== 'generic' && (
        <p className="sp-hint">Nhận diện là môn {getSubject(custom).label}.</p>
      )}
    </div>
  );
}
