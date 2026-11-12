/* language site: Listen (device voice), Copy, page filter, home search, letter and word practice */
(function () {
  'use strict';
  var d = document, SYG = window.SYG, VOICE = d.body.getAttribute('data-voice') || (d.querySelector('[data-voice]') || d.body).getAttribute('data-voice') || '', cur = null;
  function stop() { if (window.speechSynthesis) speechSynthesis.cancel(); if (cur) { cur.classList.remove('on'); cur = null; } }
  function say(text, btn) {
    if (!window.speechSynthesis) { SYG.toast('This browser cannot read aloud'); return; }
    if (cur === btn) { stop(); return; }
    stop();
    var v = speechSynthesis.getVoices().filter(function (x) { return x.lang.replace('_', '-').toLowerCase().indexOf(VOICE.slice(0, 2).toLowerCase()) === 0; });
    if (!v.length) { SYG.toast('Your device has no voice for this language. Use the roman reading.'); return; }
    var u = new SpeechSynthesisUtterance(text); u.voice = v[0]; u.lang = v[0].lang; u.rate = 0.8;
    u.onend = u.onerror = function () { if (cur === btn) { btn.classList.remove('on'); cur = null; } };
    cur = btn; if (btn) btn.classList.add('on'); speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  window.addEventListener('pagehide', stop);
  var root = d.querySelector('[data-voice]'); if (root) VOICE = root.getAttribute('data-voice');
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-say],[data-cp]'); if (!b) return;
    var li = b.closest('li');
    if (b.hasAttribute('data-say')) say(li.querySelector('.sc').textContent, b);
    else SYG.copy([].map.call(li.querySelectorAll('.sc,.ro,.hi,.en'), function (p) { return p.textContent; }).join('\n'), 'Copied');
  });
  var f = d.querySelector('[data-filter]');
  if (f) {
    var items = d.querySelectorAll('.pl > li'), none = d.querySelector('[data-none]');
    f.addEventListener('input', function () {
      var w = f.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (li) { var t = li.textContent.toLowerCase(), ok = w.every(function (x) { return t.indexOf(x) > -1; }); li.hidden = !ok; if (ok) n++; });
      if (none) none.hidden = n > 0;
    });
  }
  var all = null;
  function load() { return all ? Promise.resolve(all) : SYG.json('/data/all.json').then(function (j) { all = j; return j; }); }
  var q = d.querySelector('[data-search]');
  if (q) {
    var box = d.querySelector('[data-results]'), tm;
    q.addEventListener('input', function () {
      clearTimeout(tm);
      tm = setTimeout(function () {
        var w = q.value.toLowerCase().split(/\s+/).filter(Boolean);
        if (!w.length) { box.innerHTML = ''; return; }
        load().then(function (j) {
          var hit = j.p.filter(function (r) { var s = r.slice(0, 4).join(' ').toLowerCase(); return w.every(function (x) { return s.indexOf(x) > -1; }); }).slice(0, 20);
          box.innerHTML = hit.length ? hit.map(function (r) {
            return '<li><a href="' + r[4] + '"><b class="sc"' + (j.rtl ? ' dir="rtl"' : '') + ' lang="' + j.lang + '">' + SYG.esc(r[0]) + '</b><small>' + SYG.esc(r[1]) + ' · <span lang="hi">' + SYG.esc(r[2]) + '</span> · ' + SYG.esc(r[3]) + '</small></a></li>';
          }).join('') : '<li class="hint">Nothing matches. Try an English or Hindi word, or the roman reading.</li>';
        });
      }, 120);
    });
  }
  var z = d.querySelector('[data-quiz]');
  if (z) {
    var mode = 'l', score = 0, asked = 0, item, big = z.querySelector('.big'), opts = z.querySelector('.opts'), sc = z.querySelector('.sc-line'), nx = z.querySelector('[data-next]'), ans = z.querySelector('.ans');
    function pick() {
      load().then(function (j) {
        var pool = mode === 'l' ? j.l : j.p.filter(function (r) { return r[5] === 'w'; });
        item = pool[Math.floor(Math.random() * pool.length)];
        var key = mode === 'l' ? 1 : 3, o = [item];
        while (o.length < 4) { var c = pool[Math.floor(Math.random() * pool.length)]; if (o.every(function (x) { return x[key] !== c[key] && x[0] !== c[0]; })) o.push(c); }
        o.sort(function () { return Math.random() - 0.5; });
        big.textContent = item[0]; ans.hidden = true; nx.hidden = true; opts.removeAttribute('data-done');
        opts.innerHTML = o.map(function (x) { return '<button type="button" data-a="' + (x === item ? 1 : 0) + '">' + SYG.esc(x[key]) + '</button>'; }).join('');
      });
    }
    opts.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || opts.getAttribute('data-done')) return;
      opts.setAttribute('data-done', '1'); asked++;
      if (b.getAttribute('data-a') === '1') { score++; b.className = 'ok'; } else { b.className = 'no'; opts.querySelector('[data-a="1"]').className = 'ok'; }
      sc.textContent = 'Score: ' + score + ' of ' + asked;
      ans.textContent = mode === 'l' ? item[0] + ' = ' + item[1] + (item[2] ? ' (' + item[2] + ')' : '') : item[0] + ' = ' + item[1] + ' = ' + item[3];
      ans.hidden = false; nx.hidden = false;
    });
    nx.addEventListener('click', pick);
    z.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode'); score = asked = 0; sc.textContent = 'Score: 0 of 0';
        z.querySelectorAll('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        pick();
      });
    });
    z.querySelector('[data-hear]').addEventListener('click', function () { if (item) say(item[0], null); });
    pick();
  }
})();
