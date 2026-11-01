/* Yardımcılar: $, norm, esc, cap, canon, rd */
function rd(k) {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}
function $(i) {
  return document.getElementById(i);
}
function norm(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019`\u00b4]/g, "'")
    .trim()
    .toLowerCase();
}
function canon(n) {
  var id = NID[norm(n)];
  return id ? DBM[id][1] : n;
}
function cap(s) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|\s)(\S)/g, function (m, a, b) {
      return a + b.toUpperCase();
    });
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "\'": "&#39;" }[c];
  });
}
/* Art arda gelen çağrıları birleştirir (arama kutuları için) */
function debounce(fn, ms) {
  var id = 0;
  return function () {
    var self = this,
      args = arguments;
    clearTimeout(id);
    id = setTimeout(function () {
      fn.apply(self, args);
    }, ms);
  };
}
