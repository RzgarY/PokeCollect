/* Koleksiyon durumu (R, have), kaydetme ve doğrulama */
var R = T.map(function () {
    return [];
  }),
  have = {},
  filter = "all",
  query = "",
  editing = false,
  ed = null,
  KEY = "pokemon-check-v5";
/* Kayıttan sonra çalışacak ek işler (ör. binder günlüğü) onSave ile eklenir */
var saveHooks = [];
function onSave(fn) {
  saveHooks.push(fn);
}
function save() {
  var ok = persist();
  saveHooks.forEach(function (fn) {
    fn();
  });
  return ok;
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 6, r: R, h: have }));
    return true;
  } catch (e) {
    if (!persist.w) {
      persist.w = 1;
      setTimeout(function () {
        toast(t("savefail"));
      }, 400);
    }
    return false;
  }
}
function validData(o) {
  if (!o || typeof o !== "object" || !Array.isArray(o.r) || o.r.length !== T.length) return false;
  if (o.h !== undefined && (!o.h || typeof o.h !== "object" || Array.isArray(o.h))) return false;
  var count = 0,
    seen = Object.create(null);
  for (var si = 0; si < o.r.length; si++) {
    if (!Array.isArray(o.r[si])) return false;
    for (var ri = 0; ri < o.r[si].length; ri++) {
      var row = o.r[si][ri];
      if (!Array.isArray(row) || row.length > 100) return false;
      for (var ci = 0; ci < row.length; ci++) {
        var name = row[ci];
        if (
          typeof name !== "string" ||
          !name.trim() ||
          name.length > 200 ||
          /^(?:__proto__|prototype|constructor)$/i.test(name.trim()) ||
          ++count > 10000
        )
          return false;
        var key = norm(name);
        if (!key || seen[key]) return false;
        seen[key] = 1;
      }
    }
  }
  if (o.h !== undefined) {
    var keys = Object.keys(o.h);
    if (keys.length > 10000) return false;
    for (var hi = 0; hi < keys.length; hi++)
      if (
        keys[hi].length > 200 ||
        /^(?:__proto__|prototype|constructor)$/i.test(keys[hi]) ||
        o.h[keys[hi]] !== true
      )
        return false;
  }
  return true;
}
var s4 = rd(KEY);
if (s4) {
  var okl = false;
  try {
    var o = JSON.parse(s4);
    if (validData(o)) {
      R = o.r;
      have = o.h || {};
      okl = true;
    }
  } catch (e) {}
  if (!okl) {
    try {
      localStorage.setItem(KEY + "-bak", s4);
    } catch (e) {}
  }
} else {
  var o4 = rd("pokemon-check-v4");
  if (o4) {
    try {
      var oo = JSON.parse(o4);
      if (validData(oo)) {
        R = oo.r;
        have = oo.h || {};
      }
    } catch (e) {}
  }
  save();
}
