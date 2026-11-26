/* NarrationEngine: drives per-page audio narration with auto-advance.
 * Pure logic — no direct DOM access except through the audio objects
 * returned by opts.audioFor(i), so it can be unit-tested in Node.
 *
 * States: 'idle' | 'playing' | 'paused'
 * Events:
 *   onPage(i)  — called whenever the visible page should change to i (0-based)
 *   onState(s) — called whenever the engine state changes
 */
(function (root) {
  'use strict';

  function NarrationEngine(opts) {
    this.count = opts.count;                 // number of narrated pages
    this.audioFor = opts.audioFor;           // fn(i) -> audio element for page i
    this.onPage = opts.onPage || function () {};
    this.onState = opts.onState || function () {};
    this.index = -1;                         // current narrated page, -1 = none
    this.state = 'idle';

    var self = this;
    this._audios = [];
    for (var i = 0; i < this.count; i++) {
      (function (i) {
        var a = self.audioFor(i);
        self._audios.push(a);
        if (a && typeof a.addEventListener === 'function') {
          a.addEventListener('ended', function () { self._handleEnded(i); });
        }
      })(i);
    }
  }

  NarrationEngine.prototype._setState = function (s) {
    this.state = s;
    this.onState(s);
  };

  NarrationEngine.prototype._audio = function (i) {
    return this._audios[i] || null;
  };

  NarrationEngine.prototype._playAudio = function (i) {
    var a = this._audio(i);
    if (!a || typeof a.play !== 'function') return;
    try {
      var p = a.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } catch (e) { /* play() may throw synchronously on some platforms */ }
  };

  NarrationEngine.prototype._stopAudio = function (i) {
    var a = this._audio(i);
    if (!a) return;
    try { if (typeof a.pause === 'function') a.pause(); } catch (e) {}
    try { a.currentTime = 0; } catch (e) {}
  };

  // Begin narration at 0-based page i.
  NarrationEngine.prototype.start = function (i) {
    this._stopAudio(this.index);
    this.index = Math.max(0, Math.min(this.count - 1, i));
    this.onPage(this.index);
    this._playAudio(this.index);
    this._setState('playing');
  };

  NarrationEngine.prototype._handleEnded = function (i) {
    if (this.state !== 'playing' || i !== this.index) return; // stale event
    if (this.index + 1 < this.count) {
      this._stopAudio(this.index);
      this.index += 1;
      this.onPage(this.index);
      this._playAudio(this.index);
    } else {
      this.stop();
    }
  };

  NarrationEngine.prototype.pause = function () {
    if (this.state !== 'playing') return;
    var a = this._audio(this.index);
    if (a && typeof a.pause === 'function') {
      try { a.pause(); } catch (e) {}
    }
    this._setState('paused');
  };

  NarrationEngine.prototype.resume = function () {
    if (this.state !== 'paused') return;
    this._playAudio(this.index);
    this._setState('playing');
  };

  NarrationEngine.prototype.stop = function () {
    this._stopAudio(this.index);
    this.index = -1;
    this._setState('idle');
  };

  // Toggle from a Listen button: pause when playing, resume when paused,
  // start at fromIndex when idle.
  NarrationEngine.prototype.toggle = function (fromIndex) {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
    else this.start(fromIndex);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NarrationEngine;
  } else {
    root.NarrationEngine = NarrationEngine;
  }
})(typeof window !== 'undefined' ? window : this);
