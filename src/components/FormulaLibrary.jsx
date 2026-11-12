import { useState, useMemo, useCallback } from 'react';
import { FORMULAS, FORMULA_CATEGORIES } from './formulaData.js';
import { useCurrentSubject } from './SubjectSwitcher.jsx';
import {
  IconStar, IconCopy, IconBook, IconFlask, IconMolecule, IconBond,
  IconAtom, IconReaction, IconBalance, IconGraph, IconFormula,
  IconChevronDown, IconSpark,
} from './ChemIcons.jsx';
import { norm, useStored, useToast, copyText } from './ToolsKit.jsx';

const CAT_ICON = {
  IconBook, IconFlask, IconMolecule, IconBond, IconAtom,
  IconReaction, IconBalance, IconGraph, IconSpark,
};

export default function FormulaLibrary({ query = '' }) {
  const { subject: globalSubject, setSubject: setGlobalSubject } = useCurrentSubject();
  const [subFilter, setSubFilter] = useState(globalSubject || 'all');
  const [cat, setCat]             = useState('all');
  const [grade, setGrade]         = useState('all');
  const [openId, setOpenId]       = useState(null);
  const [favs, setFavs]           = useStored('formula-favs', []);
  const [toast, toastNode]        = useToast();

  const handleSubChange = (newSub) => {
    setSubFilter(newSub);
    setGlobalSubject(newSub);
    setCat('all');
  };

  const visibleCategories = useMemo(() => {
    if (subFilter === 'all') return FORMULA_CATEGORIES;
    return FORMULA_CATEGORIES.filter((c) => c.id === 'all' || c.subject === subFilter);
  }, [subFilter]);

  const toggleFav = useCallback((id) => {
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, [setFavs]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return FORMULAS.filter((f) => {
      if (subFilter !== 'all' && f.subjectCode && f.subjectCode !== subFilter) return false;
      if (cat !== 'all' && f.category !== cat) return false;
      if (grade !== 'all' && !f.grade.includes(Number(grade))) return false;
      if (!q) return true;
      const hay = [
        f.name, f.formula, f.subject || '',
        f.symbols.map((s) => `${s.s} ${s.name}`).join(' '),
        f.notes || '',
      ].join(' ');
      return norm(hay).includes(q);
    });
  }, [query, subFilter, cat, grade]);

  return (
    <div className="fl">
      <aside className="fl-side">
        <p className="fl-side-label">Phân môn KHTN</p>
        <ul className="fl-cats">
          {[
            { id: 'all', name: 'Tất cả 3 môn' },
            { id: 'ly', name: 'Vật lí' },
            { id: 'hoa', name: 'Hóa học' },
            { id: 'sinh', name: 'Sinh học' },
          ].map((s) => (
            <li key={s.id}>
              <button
                className={'fl-cat' + (subFilter === s.id ? ' on' : '')}
                onClick={() => handleSubChange(s.id)}
              >
                <span>{s.name}</span>
                <em>{s.id === 'all' ? FORMULAS.length : FORMULAS.filter((f) => f.subjectCode === s.id).length}</em>
              </button>
            </li>
          ))}
        </ul>

        <p className="fl-side-label">Nhóm công thức</p>
        <ul className="fl-cats">
          {visibleCategories.map((c) => {
            const Icon = CAT_ICON[c.Icon] || IconFormula;
            const count = c.id === 'all'
              ? (subFilter === 'all' ? FORMULAS.length : FORMULAS.filter((f) => f.subjectCode === subFilter).length)
              : FORMULAS.filter((f) => f.category === c.id).length;
            return (
              <li key={c.id}>
                <button
                  className={'fl-cat' + (cat === c.id ? ' on' : '')}
                  onClick={() => setCat(c.id)}
                >
                  <Icon size={16} />
                  <span>{c.name}</span>
                  <em>{count}</em>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="fl-side-label">Lớp</p>
        <ul className="fl-cats">
          {[
            { id: 'all', name: 'Tất cả' },
            { id: 10, name: 'Lớp 10' },
            { id: 11, name: 'Lớp 11' },
            { id: 12, name: 'Lớp 12' },
          ].map((g) => (
            <li key={String(g.id)}>
              <button
                className={'fl-cat' + (grade === g.id ? ' on' : '')}
                onClick={() => setGrade(g.id)}
              >
                <span>{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="fl-main">
        <p className="fl-count"><b>{filtered.length}</b> công thức khoa học tự nhiên</p>

        <div className="fl-list">
          {filtered.map((f) => {
            const isOpen = openId === f.id;
            const isFav  = favs.includes(f.id);
            return (
              <article key={f.id} className={'fl-item' + (isOpen ? ' open' : '')}>
                <button
                  className="fl-item-head"
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  aria-expanded={isOpen}
                >
                  <span className="fl-item-name">
                    {f.name}
                    {f.subject && <small style={{ marginLeft: 8, fontSize: '11px', padding: '2px 7px', borderRadius: 12, background: f.subjectCode === 'ly' ? 'rgba(37,99,235,0.12)' : f.subjectCode === 'sinh' ? 'rgba(168,85,247,0.12)' : 'rgba(13,148,136,0.12)', color: f.subjectCode === 'ly' ? '#2563eb' : f.subjectCode === 'sinh' ? '#9333ea' : '#0d9488', fontWeight: 600 }}>{f.subject}</small>}
                  </span>
                  <code className="fl-item-formula">{f.formula}</code>
                  <span className="fl-item-toggle"><IconChevronDown size={14} /></span>
                </button>

                {isOpen && (
                  <div className="fl-item-body">
                    <div className="fl-block">
                      <p className="fl-block-label">Ký hiệu</p>
                      <table className="fl-symbols">
                        <tbody>
                          {f.symbols.map((s) => (
                            <tr key={s.s}>
                              <td><code>{s.s}</code></td>
                              <td>{s.name}</td>
                              <td className="fl-unit">{s.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {f.example && (
                      <div className="fl-block">
                        <p className="fl-block-label">Ví dụ</p>
                        <p className="fl-example-problem">{f.example.problem}</p>
                        <ol className="fl-example-steps">
                          {f.example.steps.map((st, i) => <li key={i}>{st}</li>)}
                        </ol>
                      </div>
                    )}

                    {f.notes && (
                      <div className="fl-block">
                        <p className="fl-block-label">Ghi chú</p>
                        <p className="fl-note">{f.notes}</p>
                      </div>
                    )}

                    <div className="fl-actions">
                      <button
                        className="fl-btn"
                        onClick={async () => {
                          const ok = await copyText(`${f.name}: ${f.formula}`);
                          toast(ok ? 'Đã sao chép công thức' : 'Không sao chép được');
                        }}
                      >
                        <IconCopy size={14} /> Sao chép
                      </button>
                      <button
                        className={'fl-btn ghost' + (isFav ? ' on' : '')}
                        onClick={() => toggleFav(f.id)}
                        aria-pressed={isFav}
                      >
                        <IconStar size={14} on={isFav} />
                        {isFav ? 'Đã lưu' : 'Lưu'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="fl-empty">
            <p>Không tìm thấy công thức nào phù hợp.</p>
            <button onClick={() => { setCat('all'); setGrade('all'); }}>Xóa bộ lọc</button>
          </div>
        )}
      </div>

      {toastNode}
    </div>
  );
}