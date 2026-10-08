/* Awraq Capital — shared site menu and footer links, copy for pulse.awraqcapital.com.
   Same menu as the main site; every link points back to awraqcapital.com.
   When the main site's assets/site.js changes, copy its site map (GROUPS) into this file.

   Original header follows.
   Awraq Capital — shared site menu and footer links.
   One file for every page: add or rename a page here and every page follows.
   Each page loads it with:  <script src="assets/site.js" defer></script>            */
(function () {
  'use strict';
  if (window.__awraqSite) return;
  window.__awraqSite = true;

  /* ───────────── THE SITE MAP — edit here ───────────── */
  var BASE = 'https://awraqcapital.com/';
  var PDF = { en: 'AwraqCapital_Corporate_Profile_2026.pdf', ar: 'AwraqCapital_Corporate_Profile_2026_AR.pdf' };
  var GROUPS = [
    { t: { en: 'Awraq Capital', ar: 'أوراق العالم' }, items: [
      { h: 'index.html', t: { en: 'Home', ar: 'الرئيسية' },
        d: { en: 'Who we serve, what we do and how we work', ar: 'من نخدم – وماذا نقدّم – وكيف نعمل' } },
      { h: 'index.html#services', t: { en: 'Our services', ar: 'خدماتنا' },
        d: { en: 'Six ways we put capital to work', ar: 'ست طرق نوظّف بها رأس المال' } },
      { h: 'index.html#leadership', t: { en: 'Leadership', ar: 'القيادة' },
        d: { en: 'The founder and the track record', ar: 'المؤسس وسجل الأعمال' } },
      { pdf: true, t: { en: 'Corporate profile 2026', ar: 'الملف التعريفي 2026' },
        d: { en: 'Download the PDF', ar: 'تحميل الملف بصيغة PDF' } }
    ] },
    { t: { en: 'For landowners', ar: 'لملّاك الأراضي' }, items: [
      { h: 'raw.html', t: { en: 'What could your land earn?', ar: 'كم يمكن أن تحقق أرضك؟' },
        d: { en: 'A guided walk-through with your own figures', ar: 'عرض تفاعلي خطوة بخطوة بأرقامك أنت' } },
      { h: 'Awraq-Land-JV-Landlord-View.html', enOnly: true, t: { en: 'Raw land feasibility dashboard', ar: 'لوحة جدوى الأراضي الخام' },
        d: { en: 'Every assumption, scenarios and a printable report', ar: 'جميع الافتراضات والسيناريوهات وتقرير قابل للطباعة' } },
      { h: 'dashboards.html', enOnly: true, t: { en: 'Feasibility dashboards', ar: 'لوحات الجدوى' },
        d: { en: 'Ten simulations across land, capital and funds', ar: 'عشر لوحات محاكاة للأراضي ورأس المال والصناديق' } }
    ] },
    { t: { en: 'Financing & capital', ar: 'التمويل ورأس المال' }, items: [
      { h: 'financing.html', t: { en: 'Financing solutions', ar: 'حلول التمويل' },
        d: { en: 'Sharia-compliant financing, led to closing by a co-investor', ar: 'تمويل متوافق مع الشريعة يقوده شريك مستثمر حتى الإغلاق' } },
      { h: 'sukuk.html', t: { en: 'Sukuk advisory', ar: 'استشارات الصكوك' },
        d: { en: 'Growth capital on standby, ready before you need it', ar: 'رأس مال للنمو – جاهز قبل أن تحتاجه' } }
    ] },
    { t: { en: 'Insights', ar: 'رؤى' }, items: [
      { h: 'manufacture-value.html', t: { en: 'Why the best developers manufacture value', ar: 'لماذا يصنع أفضل المطورين القيمة' },
        d: { en: 'Article · 12 min read', ar: 'مقال – قراءة في 12 دقيقة' } },
      { h: 'net-worth-formula.html', t: { en: 'The Net Worth Building Formula', ar: 'معادلة بناء صافي الثروة' },
        d: { en: 'Article · 10 min read', ar: 'مقال – قراءة في 10 دقائق' } },
      { self: true, h: 'https://pulse.awraqcapital.com/', enOnly: true, t: { en: 'Macro Pulse dashboards', ar: 'لوحات نبض الاقتصاد' },
        d: { en: 'Global, US, China, Japan and Europe: leading indicators, risks and five years of history', ar: 'العالم وأمريكا والصين واليابان وأوروبا – مؤشرات قيادية ومخاطر وخمس سنوات من البيانات' } }
    ] }
  ];
  var TXT = {
    en: { menu: 'Menu', close: 'Close', open: 'Open the site menu', title: 'Site menu', here: 'You are here', eng: 'English',
          explore: 'Explore Awraq Capital', review: 'Start with a free project review', line: 'Structured with discipline. Aligned by ownership.',
          talk: 'Talk to us' },
    ar: { menu: 'القائمة', close: 'إغلاق', open: 'افتح قائمة الموقع', title: 'قائمة الموقع', here: 'أنت هنا', eng: 'بالإنجليزية',
          explore: 'استكشف أوراق العالم', review: 'ابدأ بمراجعة مجانية لمشروعك', line: 'هيكلة منضبطة – وشراكة في الملكية',
          talk: 'تواصل معنا' }
  };
  var EMAIL = 'contact@awraqcapital.com', PHONE = '+966 530 530 510', TEL = '+966530530510';
  /* ───────────── end of site map ───────────── */

  var doc = document, root = doc.documentElement;
  function lang() { return /^ar/i.test(root.lang || '') ? 'ar' : 'en'; }
  function key(h) { h = (h || '').split('#')[0].split('?')[0].split('/').pop().toLowerCase().replace(/\.html?$/, ''); return h || 'index'; }
  var HERE = 'pulse';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function isHere(it) { return !!it.self; }

  /* ───────────── styles ───────────── */
  var css = ''
  + '.aws-btn{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:10px;height:40px;margin:0;padding:0 6px 0 0;border:0;background:none;color:#ECE9E3;cursor:pointer;font:700 11px/1 Lato,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;-webkit-tap-highlight-color:transparent;transition:color .3s}'
  + 'html[dir=rtl] .aws-btn{padding:0 0 0 6px;letter-spacing:0;font:500 13.5px/1 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-btn[data-tone=dark]{color:#3D3A38}'
  + '.aws-btn i{position:relative;display:block;width:26px;height:12px;flex:none}'
  + '.aws-btn i::before,.aws-btn i::after{content:"";position:absolute;inset-inline-start:0;height:1.5px;background:currentColor;transition:width .35s cubic-bezier(.2,.7,.2,1),transform .35s}'
  + '.aws-btn i::before{top:0;width:26px}.aws-btn i::after{bottom:0;width:16px}'
  + '.aws-btn:hover i::after,.aws-btn:focus-visible i::after{width:26px}'
  + '.aws-btn:hover,.aws-btn:focus-visible{color:#D29A7C}.aws-btn[data-tone=dark]:hover,.aws-btn[data-tone=dark]:focus-visible{color:#A8704A}'
  + '.aws-btn:focus-visible,.aws-menu a:focus-visible,.aws-x:focus-visible,.aws-foot a:focus-visible{outline:2px solid #D29A7C;outline-offset:4px}'
  + '.aws-logo-shift{margin-inline-start:calc(var(--aws-w,40px) + 16px)!important}'
  + '@media(max-width:900px){.aws-btn b{display:none}.aws-btn{padding:0!important;width:30px}.aws-logo-shift{margin-inline-start:calc(var(--aws-w,30px) + 10px)!important}}'

  + '.aws-menu{position:fixed;inset:0;z-index:2147483000;background:#2F2A28;color:#ECE9E3;font:400 15px/1.5 Lato,Arial,sans-serif;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;visibility:hidden;clip-path:inset(0 0 100% 0);transition:clip-path .7s cubic-bezier(.7,0,.2,1),visibility 0s .7s;text-align:start}'
  + '.aws-menu.on{visibility:visible;clip-path:inset(0);transition:clip-path .7s cubic-bezier(.7,0,.2,1),visibility 0s}'
  + 'html[dir=rtl] .aws-menu{font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;line-height:1.75}'
  + '.aws-menu *{box-sizing:border-box}'
  + '.aws-menu::before{content:"";position:absolute;top:0;left:0;right:0;height:140px;background:repeating-linear-gradient(180deg,rgba(255,255,255,.22) 0 .75px,transparent .75px 9px);-webkit-mask-image:linear-gradient(180deg,#000 30%,transparent);mask-image:linear-gradient(180deg,#000 30%,transparent);pointer-events:none}'
  + '.aws-in{position:relative;max-width:1240px;min-height:100%;margin:0 auto;padding:0 clamp(20px,4vw,56px) 34px;display:flex;flex-direction:column}'
  + '.aws-top{display:flex;align-items:center;justify-content:space-between;gap:16px;height:84px;flex:none}'
  + '.aws-top img{height:46px;width:auto;display:block}'
  + '.aws-x{display:inline-flex;align-items:center;gap:12px;border:0;background:none;color:#ECE9E3;cursor:pointer;font:700 11px/1 Lato,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;padding:10px 0}'
  + 'html[dir=rtl] .aws-x{letter-spacing:0;font:500 13.5px/1 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-x i{position:relative;width:22px;height:22px;display:block}.aws-x i::before,.aws-x i::after{content:"";position:absolute;top:10px;left:0;width:22px;height:1.5px;background:currentColor;transition:transform .4s}'
  + '.aws-x i::before{transform:rotate(45deg)}.aws-x i::after{transform:rotate(-45deg)}.aws-x:hover{color:#D29A7C}.aws-x:hover i::before{transform:rotate(135deg)}.aws-x:hover i::after{transform:rotate(45deg)}'
  + '.aws-grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:0 clamp(22px,3vw,48px);padding:clamp(20px,5vh,60px) 0 clamp(24px,5vh,56px);align-content:center}'
  + '.aws-col{opacity:0;transform:translateY(26px);transition:opacity .7s,transform .8s cubic-bezier(.2,.7,.2,1)}'
  + '.aws-menu.on .aws-col{opacity:1;transform:none;transition-delay:calc(.28s + var(--n)*.08s)}'
  + '.aws-col h3{margin:0 0 6px;padding:0 0 12px;border-bottom:.5px solid rgba(200,193,178,.45);font:700 11px/1.4 Lato,Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#D29A7C}'
  + 'html[dir=rtl] .aws-col h3{letter-spacing:0;font:500 14px/1.4 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-menu a.aws-l{position:relative;display:block;padding:15px 0 14px;border:0;border-bottom:.5px solid rgba(200,193,178,.16);color:#ECE9E3;text-decoration:none;transition:padding .35s cubic-bezier(.2,.7,.2,1),color .25s}'
  + '.aws-l .aws-t{display:block;font:400 clamp(19px,1.65vw,23px)/1.25 "Playfair Display",Georgia,serif;color:#fff;transition:color .25s}'
  + 'html[dir=rtl] .aws-l .aws-t{font:400 clamp(18px,1.5vw,21px)/1.5 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-l .aws-d{display:block;margin-top:5px;font-size:13px;font-weight:300;color:#C8C1B2}html[dir=rtl] .aws-l .aws-d{font-size:14px;font-weight:400}'
  + '.aws-l .aws-g{display:inline-block;margin-inline-start:8px;padding:2px 7px;border:.5px solid rgba(200,193,178,.5);border-radius:2px;font:700 9.5px/1.4 Lato,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#C8C1B2;vertical-align:middle}'
  + 'html[dir=rtl] .aws-l .aws-g{letter-spacing:0;font:400 11.5px/1.4 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-menu a.aws-l:hover,.aws-menu a.aws-l:focus-visible{padding-inline-start:14px}.aws-l:hover .aws-t,.aws-l:focus-visible .aws-t{color:#D29A7C}'
  + '.aws-l::before{content:"";position:absolute;inset-inline-start:0;top:27px;width:0;height:1.5px;background:#D29A7C;transition:width .35s cubic-bezier(.2,.7,.2,1)}.aws-l:hover::before,.aws-l:focus-visible::before{width:8px}'
  + '.aws-l[aria-current]{padding-inline-start:14px}.aws-l[aria-current]::before{width:5px;height:5px;top:25px;border-radius:50%;background:#A8704A}.aws-l[aria-current] .aws-t{color:#D29A7C}'
  + '.aws-base{flex:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 28px;padding-top:22px;border-top:.5px solid rgba(200,193,178,.45);opacity:0;transition:opacity .7s .7s}'
  + '.aws-menu.on .aws-base{opacity:1}'
  + '.aws-base .aws-c{display:flex;flex-wrap:wrap;gap:6px 26px;font-size:13.5px;color:#C8C1B2}.aws-menu .aws-base .aws-c a{color:#ECE9E3;text-decoration:none;border:0;border-bottom:.5px solid rgba(200,193,178,.4)}.aws-menu .aws-base .aws-c a:hover{color:#D29A7C;border-bottom-color:#D29A7C}'
  + '.aws-base .aws-ln{font:italic 400 15px/1.3 "Playfair Display",Georgia,serif;color:#C8C1B2}html[dir=rtl] .aws-base .aws-ln{font:300 15px/1.6 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-menu a.aws-cta{display:inline-block;padding:13px 24px;border:1px solid #A8704A;border-radius:2px;background:#A8704A;color:#fff;text-decoration:none;font:700 13px/1.2 Lato,Arial,sans-serif;letter-spacing:.05em;transition:background .25s,border-color .25s}'
  + 'html[dir=rtl] .aws-menu a.aws-cta{letter-spacing:0;font:500 14.5px/1.4 "IBM Plex Sans Arabic",Tahoma,sans-serif}.aws-menu a.aws-cta:hover{background:#6E4528;border-color:#6E4528}'
  + '@media(max-width:1000px){.aws-grid{grid-template-columns:repeat(2,1fr);gap:34px clamp(22px,4vw,48px);align-content:start}}'
  + '@media(max-width:600px){.aws-top{height:68px}.aws-top img{height:38px}.aws-grid{grid-template-columns:1fr;gap:28px;padding-top:14px}.aws-menu a.aws-l{padding:12px 0 11px}.aws-l::before{top:24px}.aws-l[aria-current]::before{top:22px}.aws-base{flex-direction:column;align-items:flex-start}.aws-menu a.aws-cta{width:100%;text-align:center}}'

  + '.aws-foot{margin:0 0 40px;padding:0 0 34px;border-bottom:.5px solid rgba(200,193,178,.35);font:400 13.5px/1.5 Lato,Arial,sans-serif;color:#9A948D;text-align:start}'
  + 'html[dir=rtl] .aws-foot{font:400 14.5px/1.75 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-foot *{box-sizing:border-box}'
  + '.aws-foot .aws-hd{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 24px;margin-bottom:26px}'
  + '.aws-foot .aws-hd b{font:700 11px/1.4 Lato,Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#D29A7C}html[dir=rtl] .aws-foot .aws-hd b{letter-spacing:0;font:500 14px/1.4 "IBM Plex Sans Arabic",Tahoma,sans-serif}'
  + '.aws-foot .aws-hd a{color:#ECE9E3;text-decoration:none;border:0;border-bottom:.5px solid #A8704A;padding-bottom:2px;font-size:13.5px}.aws-foot .aws-hd a:hover{color:#D29A7C}'
  + '.aws-foot .aws-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:26px clamp(18px,3vw,44px)}'
  + '.aws-foot h4{margin:0 0 10px;font:700 12.5px/1.4 Lato,Arial,sans-serif;color:#ECE9E3;letter-spacing:.02em}html[dir=rtl] .aws-foot h4{font:500 14.5px/1.5 "IBM Plex Sans Arabic",Tahoma,sans-serif;letter-spacing:0}'
  + '.aws-foot ul{list-style:none;margin:0;padding:0}.aws-foot li{margin:0 0 7px;padding:0}'
  + '.aws-foot .aws-cols a{color:#C8C1B2;text-decoration:none;border:0;border-bottom:.5px solid transparent;transition:color .2s,border-color .2s}'
  + '.aws-foot .aws-cols a:hover,.aws-foot .aws-cols a:focus-visible{color:#fff;border-bottom-color:#D29A7C}.aws-foot .aws-cols a[aria-current]{color:#D29A7C}'
  + '@media(max-width:820px){.aws-foot .aws-cols{grid-template-columns:repeat(2,1fr)}}@media(max-width:420px){.aws-foot .aws-cols{gap:22px 14px}}'
  + '@media(prefers-reduced-motion:reduce){.aws-menu,.aws-menu.on,.aws-col,.aws-menu.on .aws-col,.aws-base{transition:none!important}}'
  + '@media(max-width:350px){.aws-btn{width:24px}.aws-btn i,.aws-btn i::before{width:22px}.aws-logo-shift{margin-inline-start:calc(var(--aws-w,24px) + 7px)!important}.aws-logo-shift img{height:32px!important;width:auto!important}}'
  + '@media(max-width:400px){.nav .links .cta{white-space:nowrap;padding-inline:10px;letter-spacing:.04em}}'
  + '@media print{.aws-btn,.aws-menu,.aws-foot{display:none!important}.aws-logo-shift{margin-inline-start:0!important}}';
  var st = doc.createElement('style'); st.id = 'aws-style'; st.textContent = css; doc.head.appendChild(st);

  /* ───────────── build ───────────── */
  var btn, menu, foot, host, logoEl = null, lastFocus = null;

  /* on the homepage itself, links to its own sections stay in-page */
  function own(h) { return /^https?:/.test(h) ? h : BASE + h; }
  function href(it, L) { return it.pdf ? BASE + PDF[L] : (it.self ? '#top' : own(it.h)); }
  function linkAttrs(it, L) {
    var a = ' href="' + esc(href(it, L)) + '"';
    if (it.pdf) a += ' target="_blank" rel="noopener"';
    if (isHere(it)) a += ' aria-current="page"';
    return a;
  }
  function menuHTML(L) {
    var X = TXT[L], h = '<div class="aws-in"><div class="aws-top"><a href="' + own('index.html') + '" style="border:0;line-height:0"><img src="assets/logo-light.png" alt="Awraq Capital — أوراق العالم" width="520" height="201"></a>'
      + '<button type="button" class="aws-x"><span>' + X.close + '</span><i aria-hidden="true"></i></button></div><div class="aws-grid">';
    GROUPS.forEach(function (g, n) {
      h += '<div class="aws-col" style="--n:' + n + '"><h3>' + esc(g.t[L]) + '</h3>';
      g.items.forEach(function (it) {
        h += '<a class="aws-l"' + linkAttrs(it, L) + '><span class="aws-t">' + esc(it.t[L])
          + (it.enOnly && L === 'ar' ? '<span class="aws-g">' + X.eng + '</span>' : '') + '</span><span class="aws-d">'
          + esc(isHere(it) ? X.here : it.d[L]) + '</span></a>';
      });
      h += '</div>';
    });
    h += '</div><div class="aws-base"><span class="aws-ln">' + X.line + '</span><div class="aws-c"><a href="mailto:' + EMAIL + '" dir="ltr">' + EMAIL
      + '</a><a href="tel:' + TEL + '" dir="ltr">' + PHONE + '</a></div><a class="aws-cta" href="' + own('index.html#next') + '">' + X.review + '</a></div></div>';
    return h;
  }
  function footHTML(L) {
    var X = TXT[L], h = '<div class="aws-hd"><b>' + X.explore + '</b><a href="' + own('index.html#next') + '">' + X.review + '</a></div><div class="aws-cols">';
    GROUPS.forEach(function (g) {
      h += '<div><h4>' + esc(g.t[L]) + '</h4><ul>';
      g.items.forEach(function (it) { h += '<li><a' + linkAttrs(it, L) + '>' + esc(it.t[L]) + '</a></li>'; });
      h += '</ul></div>';
    });
    return h + '</div>';
  }
  function render() {
    var L = lang(), X = TXT[L];
    if (btn) { btn.innerHTML = '<i aria-hidden="true"></i><b>' + X.menu + '</b>'; btn.setAttribute('aria-label', X.open); }
    if (menu) {
      var was = menu.classList.contains('on');
      menu.innerHTML = menuHTML(L); menu.setAttribute('aria-label', X.title);
      menu.querySelector('.aws-x').addEventListener('click', close);
      if (was) menu.querySelector('.aws-x').focus();
    }
    if (foot) { foot.innerHTML = footHTML(L); foot.setAttribute('aria-label', X.explore); }
    size();
  }
  function size() { if (btn && logoEl) logoEl.style.setProperty('--aws-w', btn.offsetWidth + 'px'); }

  function open() {
    lastFocus = doc.activeElement;
    menu.classList.add('on'); menu.removeAttribute('inert'); btn.setAttribute('aria-expanded', 'true');
    root.style.overflow = 'hidden';
    setTimeout(function () { var x = menu.querySelector('.aws-x'); if (x) x.focus(); }, 60);
  }
  function close() {
    if (!menu.classList.contains('on')) return;
    menu.classList.remove('on'); menu.setAttribute('inert', ''); btn.setAttribute('aria-expanded', 'false');
    root.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* light or dark lines, to suit whatever the page's top bar looks like right now */
  function lum(c) { var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; var p = m[1].split(',').map(parseFloat); if (p.length > 3 && p[3] < .5) return null; return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255; }
  function tone() {
    if (!btn || !host) return;
    var t = null, imgs = host.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var cs = getComputedStyle(imgs[i]), c = imgs[i].className || '';
      if (/(^|[\s-])(light|dark)(\s|$)/.test(c) && cs.display !== 'none' && +cs.opacity > .5) { t = /dark/.test(c) ? 'dark' : 'light'; break; }
    }
    if (!t) {
      var el = host, l = null;
      while (el && el !== doc.documentElement && l === null) { l = lum(getComputedStyle(el).backgroundColor); el = el.parentElement; }
      if (l === null) l = lum(getComputedStyle(doc.body).backgroundColor);
      t = (l === null || l > .5) ? 'dark' : 'light';
    }
    btn.setAttribute('data-tone', t);
  }
  var tq = 0;
  function toneSoon() { if (tq) return; tq = setTimeout(function () { tq = 0; tone(); setTimeout(tone, 160); setTimeout(tone, 460); }, 60); }

  function init() {
    /* menu button: sits just before the logo, in whatever top bar the page has */
    var logo = doc.querySelector('[data-aws-logo]');
    if (!logo) {
      var cands = doc.querySelectorAll('a[href^="index.html"] img');
      for (var i = 0; i < cands.length; i++) { if (!cands[i].closest('footer')) { logo = cands[i].closest('a'); break; } }
    }
    menu = doc.createElement('div'); menu.className = 'aws-menu'; menu.id = 'aws-menu';
    menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true'); menu.setAttribute('inert', '');
    doc.body.appendChild(menu);

    btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'aws-btn';
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'aws-menu');
    if (logo && logo.parentElement) {
      host = logo.parentElement;
      host.insertBefore(btn, logo); logo.classList.add('aws-logo-shift'); logoEl = logo;
    } else {                                  /* no top bar found: a small fixed button */
      btn.style.cssText = 'position:fixed;top:14px;inset-inline-start:16px;z-index:2147482000';
      doc.body.appendChild(btn); host = doc.body;
    }
    btn.addEventListener('click', open);

    /* footer links: first thing inside the page's own footer */
    var f = doc.querySelector('footer');
    if (f) {
      foot = doc.createElement('div'); foot.className = 'aws-foot'; foot.setAttribute('role', 'navigation');
      var inner = f.firstElementChild && f.firstElementChild.tagName === 'DIV' ? f.firstElementChild : f;
      inner.insertBefore(foot, inner.firstChild);
    }
    render(); tone();

    doc.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('on')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = menu.querySelectorAll('a[href],button'); if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var h = a.getAttribute('href') || '';
      if (a.target === '_blank' || /^(mailto|tel):/.test(h)) return;
      /* same page (an in-page section, or the page we are on): close and let the browser scroll */
      if (h.charAt(0) === '#' || key(h) === HERE) { menu.classList.remove('on'); menu.setAttribute('inert', ''); btn.setAttribute('aria-expanded', 'false'); root.style.overflow = ''; }
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) close(); });

    new MutationObserver(function (m) {
      for (var i = 0; i < m.length; i++) { if (m[i].attributeName === 'lang') { render(); break; } }
      toneSoon();
    }).observe(root, { attributes: true, attributeFilter: ['lang', 'dir', 'class'] });
    var hd = host.closest ? (host.closest('header') || host) : host;
    if (hd && hd !== doc.body) new MutationObserver(toneSoon).observe(hd, { attributes: true, attributeFilter: ['class', 'style'] });
    window.addEventListener('scroll', toneSoon, { passive: true });
    window.addEventListener('resize', function () { size(); toneSoon(); });
    window.addEventListener('load', toneSoon);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
