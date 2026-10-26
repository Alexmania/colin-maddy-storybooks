/* Shared password gate for the Colin & Maddy Storybook Library.
   The gate compares the SHA-256 hash of what you type against the stored
   hash of the library password — the password itself is never stored here.
   Unlocking sets a per-tab sessionStorage flag that every page checks.
   Note: this is a light lock for a static site, not real access control. */
(function () {
  var HASH = "b603de426ed0b347d8ca096fb13ba40057d1cb21c9767f231cbb490f09fee088";
  var KEY = "cmStoryUnlocked";
  window.CM_GATE_KEY = KEY;

  window.cmIsUnlocked = function () {
    try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  };
  window.cmLock = function () {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  function sha256hex(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
      .then(function (buf) {
        return Array.from(new Uint8Array(buf))
          .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      });
  }

  window.cmTryUnlock = function (pw) {
    return sha256hex(pw).then(function (h) {
      if (h === HASH) {
        try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
        return true;
      }
      return false;
    });
  };

  /* If the page has a #gate-root element and the library is locked, show the
     full-screen gate. onUnlock runs once the visitor is in (immediately when
     already unlocked). Returns true when already unlocked. */
  window.cmGateInit = function (onUnlock) {
    if (window.cmIsUnlocked()) { if (onUnlock) onUnlock(); return true; }
    var root = document.getElementById("gate-root");
    if (!root) return false;
    root.innerHTML =
      '<div class="cm-gate-overlay">' +
        '<div class="cm-gate-card">' +
          '<div class="cm-gate-emoji">📚🔒</div>' +
          '<h1>Colin &amp; Maddy&rsquo;s Storybook Library</h1>' +
          '<p>This library is just for our family. Type the password to come in!</p>' +
          '<form id="cm-gate-form">' +
            '<input id="cm-gate-pw" type="password" autocomplete="current-password" ' +
              'placeholder="Password" aria-label="Password">' +
            '<button type="submit">Open the library 📖</button>' +
          '</form>' +
          '<p id="cm-gate-err" class="cm-gate-err" hidden>Hmm, that password didn&rsquo;t work. Try again!</p>' +
        '</div>' +
      '</div>';
    document.getElementById("cm-gate-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var pw = document.getElementById("cm-gate-pw").value;
      window.cmTryUnlock(pw).then(function (ok) {
        if (ok) {
          root.innerHTML = "";
          if (onUnlock) onUnlock();
        } else {
          document.getElementById("cm-gate-err").hidden = false;
          document.getElementById("cm-gate-pw").value = "";
          document.getElementById("cm-gate-pw").focus();
        }
      });
    });
    document.getElementById("cm-gate-pw").focus();
    return false;
  };
})();
