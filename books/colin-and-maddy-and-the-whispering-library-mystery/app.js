/* Picture-book app wiring: cover + 12 illustrated pages, page-turn buttons,
 * numbered dot navigation, keyboard arrows, swipe, and the Listen button that
 * drives NarrationEngine over the 12 static per-page <audio> elements.
 */
(function () {
  'use strict';

  var BOOK = window.BOOK; // { title, pages: [12 strings] } from book.js
  var PAGE_COUNT = 12;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function init() {
    var root = document.getElementById('book');
    var slidesWrap = el('div', 'slides');
    var slides = [];

    // ---- Cover (slide 0) ----
    var cover = el('section', 'slide cover');
    var coverArt = el('img', 'cover-art');
    coverArt.src = 'images/p01.webp';
    coverArt.alt = 'Cover illustration for ' + BOOK.title;
    var coverTitle = el('h1', 'cover-title', BOOK.title);
    var coverSub = el('p', 'cover-sub', 'A bedtime storybook for Colin and Maddy');
    var coverBtns = el('div', 'cover-btns');
    var coverListen = el('button', 'btn btn-listen', '\uD83D\uDD0A Listen to the story');
    coverListen.setAttribute('aria-label', 'Listen to the story, narrated page by page');
    var coverRead = el('button', 'btn btn-read', '\uD83D\uDCD6 Read it myself');
    coverBtns.appendChild(coverListen);
    coverBtns.appendChild(coverRead);
    var coverNote = el('p', 'cover-note', '12 pages \u00B7 with read-aloud narration');
    cover.appendChild(coverArt);
    cover.appendChild(coverTitle);
    cover.appendChild(coverSub);
    cover.appendChild(coverBtns);
    cover.appendChild(coverNote);
    slidesWrap.appendChild(cover);
    slides.push(cover);

    // ---- 12 story pages (slides 1..12), each with its own <audio> ----
    var audios = [];
    for (var i = 0; i < PAGE_COUNT; i++) {
      (function (i) {
        var s = el('section', 'slide');
        s.setAttribute('aria-label', 'Page ' + (i + 1) + ' of ' + PAGE_COUNT);
        var img = el('img', 'page-art');
        img.src = 'images/p' + pad(i + 1) + '.webp';
        img.alt = 'Illustration for page ' + (i + 1);
        img.loading = i < 2 ? 'eager' : 'lazy';
        var p = el('p', 'page-text', BOOK.pages[i]);
        var audio = document.createElement('audio');
        audio.id = 'audio-p' + pad(i + 1);
        audio.setAttribute('preload', 'auto');
        audio.setAttribute('playsinline', '');
        var src = document.createElement('source');
        src.src = 'audio/p' + pad(i + 1) + '.mp3';
        src.type = 'audio/mpeg';
        audio.appendChild(src);
        s.appendChild(img);
        s.appendChild(p);
        s.appendChild(audio);
        slidesWrap.appendChild(s);
        slides.push(s);
        audios.push(audio);
      })(i);
    }

    // ---- Controls ----
    var controls = el('nav', 'controls');
    var prevBtn = el('button', 'btn btn-nav', '\u2039 Prev');
    prevBtn.setAttribute('aria-label', 'Previous page');
    var nextBtn = el('button', 'btn btn-nav', 'Next \u203A');
    nextBtn.setAttribute('aria-label', 'Next page');
    var dots = el('div', 'dots');
    var dotBtns = [];
    var dotLabels = ['Cover'];
    for (var d = 1; d <= PAGE_COUNT; d++) dotLabels.push(String(d));
    dotLabels.forEach(function (label, i) {
      var b = el('button', 'dot', label);
      b.setAttribute('aria-label', i === 0 ? 'Go to cover' : 'Go to page ' + i);
      b.addEventListener('click', function () { userGoto(i); });
      dots.appendChild(b);
      dotBtns.push(b);
    });

    var header = el('header', 'topbar');
    var brand = el('div', 'brand', BOOK.title);
    var counter = el('div', 'counter', '');
    var listenBtn = el('button', 'btn btn-listen btn-top', '\uD83D\uDD0A Listen');
    listenBtn.setAttribute('aria-label', 'Listen: play narration, pause, or resume');
    header.appendChild(brand);
    header.appendChild(counter);
    header.appendChild(listenBtn);

    controls.appendChild(prevBtn);
    controls.appendChild(dots);
    controls.appendChild(nextBtn);

    root.appendChild(header);
    root.appendChild(slidesWrap);
    root.appendChild(controls);

    // ---- Navigation ----
    var pageIndex = 0; // 0 = cover, 1..12 = story pages

    var engine = new NarrationEngine({
      count: PAGE_COUNT,
      audioFor: function (i) { return audios[i]; },
      onPage: function (i) { setPage(i + 1, true); }, // engine pages are 0-based
      onState: function (s) { renderListen(s); }
    });

    function setPage(i, fromEngine) {
      if (i < 0) i = 0;
      if (i > PAGE_COUNT) i = PAGE_COUNT;
      pageIndex = i;
      for (var k = 0; k < slides.length; k++) {
        slides[k].classList.toggle('active', k === i);
      }
      for (var m = 0; m < dotBtns.length; m++) {
        dotBtns[m].classList.toggle('active', m === i);
        dotBtns[m].setAttribute('aria-current', m === i ? 'page' : 'false');
      }
      counter.textContent = i === 0 ? 'Cover' : 'Page ' + i + ' of ' + PAGE_COUNT;
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === PAGE_COUNT;
      listenBtn.style.display = ''; // always available
      window.scrollTo(0, 0);
      if (!fromEngine) engine.stop();
    }

    function userGoto(i) { setPage(i, false); }

    function renderListen(state) {
      if (state === 'playing') {
        listenBtn.textContent = '\u23F8 Pause';
        listenBtn.classList.add('is-playing');
      } else if (state === 'paused') {
        listenBtn.textContent = '\u25B6 Resume';
        listenBtn.classList.remove('is-playing');
      } else {
        listenBtn.textContent = '\uD83D\uDD0A Listen';
        listenBtn.classList.remove('is-playing');
      }
    }

    function toggleListen() {
      // Start narration at the current story page (cover -> page 1).
      var from = pageIndex <= 0 ? 0 : pageIndex - 1;
      engine.toggle(from);
    }

    prevBtn.addEventListener('click', function () { userGoto(pageIndex - 1); });
    nextBtn.addEventListener('click', function () { userGoto(pageIndex + 1); });
    listenBtn.addEventListener('click', toggleListen);
    coverListen.addEventListener('click', toggleListen);
    coverRead.addEventListener('click', function () { userGoto(1); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') userGoto(pageIndex + 1);
      else if (e.key === 'ArrowLeft') userGoto(pageIndex - 1);
    });

    // Swipe support
    var touchX = null;
    slidesWrap.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) touchX = e.touches[0].clientX;
    }, { passive: true });
    slidesWrap.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) userGoto(pageIndex + 1); else userGoto(pageIndex - 1);
    }, { passive: true });

    setPage(0, false);
    renderListen('idle');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
