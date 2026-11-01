/* Sayfa geçişi (hash), sekmeler ve ilk açılış */
function setHash(h) {
  try {
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  } catch (e) {}
}
function dpage(p) {
  var nv = document.querySelector(".navrow"),
    y0 = nv ? nv.getBoundingClientRect().top : 0;
  document.body.classList.toggle("pg-dex", p === "dex");
  document.body.classList.toggle("pg-tcg", p === "tcg");
  var ov = document.getElementById("tcgOverlay");
  if (ov) ov.classList.toggle("open", p === "tcg");
  [].forEach.call(document.querySelectorAll(".dxtabs .b"), function (b) {
    b.classList.toggle("on", b.dataset.pg === p);
  });
  if (p === "dex") drawDex();
  document.body.classList.toggle("pg-bnd", p === "bnd");
  document.body.classList.toggle("pg-sts", p === "sts");
  var nb = document.getElementById("bndBtn"),
    sb = document.getElementById("stsBtn");
  if (nb) nb.classList.toggle("on", p === "bnd");
  if (sb) sb.classList.toggle("pri", p === "sts");
  if (p === "bnd" && window.bndOpen) window.bndOpen();
  if (p === "sts" && window.stsOpen) window.stsOpen();
  if (p === "tcg" && window.tcgOpen) window.tcgOpen();
  if (nv) {
    var dy = nv.getBoundingClientRect().top - y0;
    if (dy) scrollBy(0, dy);
  }
}
function curPage() {
  var c = document.body.classList;
  return c.contains("pg-dex")
    ? "dex"
    : c.contains("pg-tcg")
      ? "tcg"
      : c.contains("pg-bnd")
        ? "bnd"
        : c.contains("pg-sts")
          ? "sts"
          : "col";
}
var HP = { "#dex": "dex", "#tcg": "tcg", "#binder": "bnd", "#stats": "sts" };
function fromHash() {
  var p = HP[location.hash] || "col";
  if (p !== curPage()) dpage(p);
}
[].forEach.call(document.querySelectorAll(".dxtabs .b"), function (b) {
  b.addEventListener("click", function () {
    dpage(b.dataset.pg);
    setHash(b.dataset.pg === "dex" ? "dex" : b.dataset.pg === "tcg" ? "tcg" : "");
  });
});
addEventListener("hashchange", fromHash);
document.querySelectorAll(".lsw button").forEach(function (b) {
  b.addEventListener("click", function () {
    lang = b.dataset.l;
    try {
      localStorage.setItem("pokemon-lang", lang);
    } catch (e) {}
    applyLang();
  });
});
applyLang();
fromHash();
