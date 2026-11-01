/* Pencere odak yönetimi (focus trap) */
(function () {
  var prev = new Map();
  [].forEach.call(document.querySelectorAll(".dlg"), function (d) {
    var was = false;
    new MutationObserver(function () {
      var o = d.classList.contains("open");
      if (o === was) return;
      was = o;
      if (o) {
        prev.set(d, document.activeElement);
        var b = d.querySelector(".box");
        if (b) {
          b.tabIndex = -1;
          b.focus({ preventScroll: true });
        }
      } else {
        var p = prev.get(d);
        if (p && p.isConnected && p.focus) p.focus({ preventScroll: true });
      }
    }).observe(d, { attributes: true, attributeFilter: ["class"] });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    ["bpick", "bnewd", "setd"].forEach(function (i) {
      var d = document.getElementById(i);
      if (d && d.classList.contains("open")) d.classList.remove("open");
    });
  });
})();
