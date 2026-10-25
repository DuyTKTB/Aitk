(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { selector: sel, present: false };
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      selector: sel,
      present: true,
      display: s.display,
      position: s.position,
      inset: [s.top, s.right, s.bottom, s.left].join(' '),
      height: s.height,
      opacity: s.opacity,
      visibility: s.visibility,
      background: s.backgroundColor,
      overflow: s.overflow,
      zIndex: s.zIndex,
      rect: `${Math.round(r.width)}x${Math.round(r.height)} @ ${Math.round(r.x)},${Math.round(r.y)}`,
      childCount: el.childElementCount,
    };
  };
  const root = document.getElementById('root');
  const text = document.body.innerText || '';
  const sels = ['.ds-page', '.ds-main', '.ds-content', '.ds-input-wrap'];
  const styles = {};
  sels.forEach(s => styles[s] = cs(s));
  return {
    __result: {
      url: location.href,
      viewport: `${window.innerWidth}x${window.innerHeight} dpr=${window.devicePixelRatio}`,
      userAgent: navigator.userAgent,
      title: document.title,
      rootExists: !!root,
      rootChildElementCount: root ? root.childElementCount : null,
      bodyInnerTextLength: text.length,
      bodyInnerTextHead: text.slice(0, 300),
      bodyClassName: document.body.className,
      htmlClassName: document.documentElement.className,
      counts: {
        dsPage: document.querySelectorAll('.ds-page').length,
        dsMsg: document.querySelectorAll('.ds-msg').length,
        dsEmpty: document.querySelectorAll('.ds-empty').length,
      },
      styles,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      modals: Array.from(document.querySelectorAll('[class*="modal"],[class*="login"],[class*="auth"],[role="dialog"]'))
        .slice(0, 8)
        .map(e => ({ tag: e.tagName, cls: e.className, vis: getComputedStyle(e).visibility, disp: getComputedStyle(e).display })),
      scroll: { bodyScrollHeight: document.body.scrollHeight, htmlScrollHeight: document.documentElement.scrollHeight },
      resourcesFailed: performance.getEntriesByType('resource')
        .filter(r => r.transferSize === 0 && r.duration === 0)
        .map(r => ({ name: r.name, initiatorType: r.initiatorType })),
      resourceCount: performance.getEntriesByType('resource').length,
    }
  };
})()
