/* Ayarlar penceresi: dil, tema, istatistik. Tema tercihi "pokemon-theme" anahtarında (auto/light/dark). */
(function () {
  "use strict";
  var KEY = "pokemon-theme",
    H = document.documentElement,
    dlg = $("setd"),
    metas = [].slice.call(document.querySelectorAll('meta[name="theme-color"]')),
    COLORS = { light: "#f2f3fa", dark: "#0d0f18" };
  metas.forEach(function (m) {
    m.dataset.auto = m.content;
  });

  function getTheme() {
    var v = rd(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  }
  function applyTheme(mode) {
    if (mode === "auto") delete H.dataset.theme;
    else H.dataset.theme = mode;
    metas.forEach(function (m) {
      m.content = mode === "auto" ? m.dataset.auto : COLORS[mode];
    });
    [].forEach.call(document.querySelectorAll(".tsw button"), function (b) {
      var on = b.dataset.t === mode;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function openSettings() {
    dlg.classList.add("open");
  }
  function closeSettings() {
    dlg.classList.remove("open");
  }

  [].forEach.call(document.querySelectorAll(".tsw button"), function (b) {
    b.addEventListener("click", function () {
      try {
        if (b.dataset.t === "auto") localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, b.dataset.t);
      } catch (e) {}
      applyTheme(b.dataset.t);
    });
  });
  $("setBtn").addEventListener("click", openSettings);
  $("setx").addEventListener("click", closeSettings);
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg) closeSettings();
  });
  /* İstatistik düğmesi (sayfaya geçişi binder-stats.js yapar) pencereyi de kapatır */
  $("stsBtn").addEventListener("click", closeSettings);
  applyTheme(getTheme());
})();
