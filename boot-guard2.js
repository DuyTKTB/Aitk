
      (function () {
        var errs = [];
        var shown = false;

        function note(where, msg) {
          var line = where + ': ' + msg;
          if (errs.length < 6) errs.push(line);
          try { sessionStorage.setItem('cs-boot-err', errs.join('\n')); } catch (e) {}
          if (window.console && console.error) console.error('[boot]', line);
        }

        function hardReload() {
          try {
            if (window.caches && caches.keys) {
              caches.keys().then(function (ks) {
                for (var i = 0; i < ks.length; i++) caches['delete'](ks[i]);
              });
            }
            if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
              navigator.serviceWorker.getRegistrations().then(function (rs) {
                for (var i = 0; i < rs.length; i++) rs[i].unregister();
              });
            }
          } catch (e) {}
          setTimeout(function () { location.reload(); }, 250);
        }

        function box(title, lines) {
          if (shown) return;
          shown = true;
          try {
            var d = document.createElement('div');
            d.setAttribute('data-cs-boot', '1');
            d.style.cssText = 'position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483647;'
              + 'background:#fff;color:#111;border:2px solid #e5484d;border-radius:14px;'
              + 'padding:14px 16px;font:13px/1.5 -apple-system,system-ui,Arial,sans-serif;'
              + 'box-shadow:0 12px 40px rgba(0,0,0,.35);max-height:70vh;overflow:auto;text-align:left;';

            var h = document.createElement('b');
            h.textContent = title;
            h.style.cssText = 'display:block;font-size:15px;margin-bottom:6px;color:#c1121f;';
            d.appendChild(h);

            var pre = document.createElement('pre');
            pre.style.cssText = 'margin:0 0 10px;white-space:pre-wrap;word-break:break-word;'
              + 'font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;';
            pre.textContent = lines.join('\n');
            d.appendChild(pre);

            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = 'Tải lại trang';
            b.style.cssText = 'border:0;border-radius:999px;background:#1f4fe6;color:#fff;'
              + 'font-weight:700;padding:10px 16px;font-size:14px;margin-right:6px;';
            b.onclick = hardReload;
            d.appendChild(b);

            var s = document.createElement('button');
            s.type = 'button';
            s.textContent = 'Ẩn';
            s.style.cssText = 'border:0;background:transparent;color:#555;padding:10px 12px;font-size:14px;';
            s.onclick = function () { if (d.parentNode) d.parentNode.removeChild(d); };
            d.appendChild(s);

            (document.body || document.documentElement).appendChild(d);
          } catch (e) {}
        }

        /* Bắt lỗi tải file (script/css) và lỗi JS toàn cục */
        window.addEventListener('error', function (e) {
          var t = e && e.target;
          if (t && t.tagName) {
            var url = t.src || t.href || '';
            if (url) note('Không tải được file', url);
            return;
          }
          note('Lỗi JS', (e && e.message) || 'không rõ');
        }, true);

        window.addEventListener('unhandledrejection', function (e) {
          var r = e && e.reason;
          note('Promise lỗi', (r && (r.message || r)) || 'không rõ');
        });

        var env = 'URL: ' + location.href + '\nThiết bị: ' + navigator.userAgent;

        function hasSize(el) {
          var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
          return !!r && r.width > 1 && r.height > 1;
        }

        /* Trang AI (và vài trang full-screen) dùng position:fixed nên #root
           đo ra 0px dù nội dung đã vẽ. Vì vậy phải quét cả con cháu. */
        function appPainted() {
          var root = document.getElementById('root');
          if (!root || !root.firstChild) return false;
          if (hasSize(root)) return true;
          var nodes = root.getElementsByTagName('*');
          var n = nodes.length < 80 ? nodes.length : 80;
          for (var i = 0; i < n; i++) {
            if (hasSize(nodes[i])) return true;
          }
          return false;
        }

        function aiMounted() {
          var el = document.querySelector('.ds-page');
          if (!el) return false;
          var r = el.getBoundingClientRect();
          return r.width > 80 && r.height > 80;
        }

        var t0 = new Date().getTime();
        var aiSince = 0;

        (function tick() {
          var now = new Date().getTime();
          var waited = now - t0;
          var onAi = location.hash === '#ai';

          if (waited > 8000 && !appPainted()) {
            box('Trang không tải được', [env, ''].concat(errs.length ? errs : ['Không có lỗi JS — có thể mất mạng hoặc file bị chặn.']));
            return;
          }

          if (onAi && appPainted()) {
            if (aiMounted()) {
              aiSince = 0;
            } else if (!aiSince) {
              aiSince = now;
            } else if (now - aiSince > 12000) {
              box('Trang ELEC AI không mở được', [env, 'Khung chat không hiện sau 12 giây.'].concat(errs));
              return;
            }
          } else {
            aiSince = 0;
          }

          if (waited < 60000) setTimeout(tick, 700);
        })();
      })();
    