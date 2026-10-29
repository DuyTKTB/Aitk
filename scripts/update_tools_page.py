import re

path = 'src/components/ToolsPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target1 = """  const { tier } = useAuth();
  const isVip = tier?.key === 'vip';"""

repl1 = """  const { tier } = useAuth();
  const isVip = tier?.key === 'vip';

  useEffect(() => {
    document.body.classList.add('page-tools');
    return () => {
      document.body.classList.remove('page-tools');
    };
  }, []);"""

if target1 in text:
    text = text.replace(target1, repl1, 1)
    print("Replaced target1")
else:
    print("target1 not found")

target2 = """          {/* HEADER */}
          <div className="tools-header">
            <div className="tools-header-row">
              <h1>Công cụ</h1>
              <button
                type="button"
                className="tools-menu-btn"
                onClick={() => setSheetOpen(true)}
                aria-label="Mở danh mục công cụ học tập"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Menu</span>
              </button>
            </div>
            <div className="tn-top">
              <span><b>{STUDY_TOOLS.length}</b> công cụ học tập</span>
              <span><b>{AI_TOOLS.length}</b> công cụ AI</span>
              <span><b>{PROMPTS.length}</b> prompt mẫu</span>
              <span><b>{DOCS.length}</b> tài liệu</span>
            </div>
            <nav className="tn-crumb" aria-label="Đường dẫn">
              <a href="#home">Trang chủ</a><i>›</i><span>Công cụ</span><i>›</i><b>{tabName}</b>
            </nav>
          </div>

          {/* TABS */}
          <div className="tools-tabs" role="tablist" aria-label="Loại công cụ">"""

repl2 = """          {/* HEADER (BENTO COMPACT) */}
          <div className="tools-header">
            <div className="tools-header-row">
              <div className="tools-header-left">
                <h1>Công cụ</h1>
                <nav className="tn-crumb tn-crumb-inline" aria-label="Đường dẫn">
                  <a href="#home">Trang chủ</a><i>›</i><span>Công cụ</span><i>›</i><b>{tabName}</b>
                </nav>
              </div>
              <div className="tn-top tn-top-compact">
                <span><b>{STUDY_TOOLS.length}</b> học tập</span>
                <span><b>{AI_TOOLS.length}</b> AI</span>
                <span><b>{PROMPTS.length}</b> prompts</span>
                <span><b>{DOCS.length}</b> tài liệu</span>
              </div>
              <button
                type="button"
                className="tools-menu-btn"
                onClick={() => setSheetOpen(true)}
                aria-label="Mở danh mục công cụ học tập"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Menu</span>
              </button>
            </div>
          </div>

          {/* TABS (Mobile only - hidden on desktop where sidebar exists) */}
          <div className="tools-tabs tools-tabs-mobile" role="tablist" aria-label="Loại công cụ">"""

if target2 in text:
    text = text.replace(target2, repl2, 1)
    print("Replaced target2")
else:
    print("target2 not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
