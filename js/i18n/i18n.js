/* Dil seçimi, t() ve applyLang() */
var lang = "en";
try {
  var sl = localStorage.getItem("pokemon-lang");
  lang =
    sl === "tr" || sl === "en"
      ? sl
      : (navigator.language || "").toLowerCase().indexOf("tr") === 0
        ? "tr"
        : "en";
} catch (e) {}
function t(k, a) {
  var v = (I[lang] || I.tr)[k];
  if (v === undefined) v = I.tr[k];
  if (Array.isArray(v)) v = a && a.n === 1 ? v[0] : v[1];
  return String(v).replace(/\{(\w+)\}/g, function (m, x) {
    return a && a[x] != null ? a[x] : m;
  });
}
/* Dil değişince çalışacak ek çizim fonksiyonları (sayfa modülleri kaydeder) */
var langHooks = [];
function onLangChange(fn) {
  langHooks.push(fn);
}
function applyLang() {
  document.documentElement.lang = lang;
  document.title = t("title");
  $("mdesc").content = t("metadesc");
  $("ogt").content = t("title");
  $("ogd").content = t("ogdesc");
  $("ogl").content = lang === "tr" ? "tr_TR" : "en_US";
  [].forEach.call(document.querySelectorAll("[data-i]"), function (e) {
    e.textContent = t(e.dataset.i);
    delete e.dataset.a;
  });
  [].forEach.call(document.querySelectorAll("[data-ph]"), function (e) {
    e.placeholder = t(e.dataset.ph);
  });
  [].forEach.call(document.querySelectorAll("[data-al]"), function (e) {
    e.setAttribute("aria-label", t(e.dataset.al));
  });
  [].forEach.call(document.querySelectorAll(".lsw button"), function (b) {
    b.classList.toggle("on", b.dataset.l === lang);
  });
  $("edt").textContent = t(editing ? "done" : "edit");
  amsg("");
  em("");
  buildAg();
  buildGch();
  buildDgch();
  render();
  upd();
  if (document.body.classList.contains("pg-dex")) drawDex();
  if ($("add").classList.contains("open")) drawPg(1);
  langHooks.forEach(function (fn) {
    fn();
  });
}
