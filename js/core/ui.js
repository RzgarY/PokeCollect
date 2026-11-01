/* Toast, yedekleme, geri alma ve çift tıklama onayı */
var tt;
function toast(m, act) {
  var e = $("toast");
  e.textContent = m;
  if (act) {
    var b = document.createElement("button");
    b.textContent = t("undo");
    b.onclick = function () {
      e.classList.remove("show");
      act();
    };
    e.appendChild(b);
  }
  e.classList.add("show");
  clearTimeout(tt);
  tt = setTimeout(
    function () {
      e.classList.remove("show");
    },
    act ? 7000 : 2200,
  );
}
var XK = [
  "pokecollect-tcg-inventory-v1",
  "pokecollect-tcg-inventory-v1-wanted",
  "pokecollect-tcg-inventory-v1-meta",
  "pokecollect-tcg-inventory-v1-pokemon-map",
  "pokecollect-tcg-inventory-v1-auto",
  "pokecollect-binders-v1",
  "pokecollect-log",
];
function fullBackup() {
  var o = { v: 7, r: R, h: have, x: {} };
  XK.forEach(function (k) {
    var v = rd(k);
    if (v) o.x[k] = v;
  });
  return o;
}
function restoreX(x) {
  if (!x || typeof x !== "object") return false;
  var n = 0;
  XK.forEach(function (k) {
    var v = x[k];
    if (typeof v !== "string" || v.length > 1500000) return;
    try {
      var j = JSON.parse(v);
      if (!j || typeof j !== "object") return;
      localStorage.setItem(k, v);
      n++;
    } catch (e) {}
  });
  return n > 0;
}
function snap() {
  return JSON.stringify({ r: R, h: have });
}
function undoTo(j) {
  var o = JSON.parse(j);
  R = o.r;
  have = o.h || {};
  save();
  render();
}
function arm(btn, key, akey, fn) {
  var tm;
  btn.addEventListener("click", function () {
    if (btn.dataset.a) {
      clearTimeout(tm);
      delete btn.dataset.a;
      btn.textContent = t(key);
      fn();
    } else {
      btn.dataset.a = 1;
      btn.textContent = t(akey);
      tm = setTimeout(function () {
        delete btn.dataset.a;
        btn.textContent = t(key);
      }, 3000);
    }
  });
}
function allNames() {
  var a = [];
  R.forEach(function (s) {
    s.forEach(function (r) {
      r.forEach(function (p) {
        a.push(p);
      });
    });
  });
  return a;
}
function has(n) {
  n = norm(n);
  return allNames().some(function (p) {
    return norm(p) === n;
  });
}
function opts() {
  return T.map(function (t, i) {
    return '<option value="' + i + '">' + t + "</option>";
  }).join("");
}
$("es").innerHTML = opts(false);
