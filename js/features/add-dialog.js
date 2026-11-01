/* Kart ekle penceresi */
/* Ekle: veritabanından seç */
var sel = {},
  pgen = 0,
  pq = "";
function buildAg() {
  var v = $("ag").value;
  $("ag").innerHTML =
    '<option value="">' +
    t("secdef") +
    '</option><option value="auto">' +
    t("secauto") +
    "</option>" +
    T.slice(0, 9)
      .map(function (g, i) {
        return '<option value="' + i + '">' + t("secpre") + g + "</option>";
      })
      .join("");
  $("ag").value = v;
}
var gch = $("gch");
function buildGch() {
  gch.innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map(function (g, i) {
      return (
        '<button data-g="' +
        i +
        '"' +
        (i === pgen ? ' class="on"' : "") +
        ">" +
        (i ? "Gen " + g : t("all")) +
        "</button>"
      );
    })
    .join("");
}
gch.addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  pgen = +b.dataset.g;
  [].forEach.call(gch.children, function (x) {
    x.classList.toggle("on", x === b);
  });
  drawPg();
});
$("pq").addEventListener(
  "input",
  debounce(function (e) {
    pq = norm(e.target.value);
    drawPg();
  }, 150),
);
var obs = new IntersectionObserver(
  function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.src = SPR[e.target.dataset.id];
        obs.unobserve(e.target);
      }
    });
  },
  { root: $("pg"), rootMargin: "300px" },
);
function inList() {
  var m = {};
  allNames().forEach(function (n) {
    m[norm(n)] = 1;
  });
  return m;
}
function amsg(t, err) {
  var m = $("amsg");
  m.textContent = t;
  m.className = "m" + (err ? " e" : "");
}
function upd() {
  var c = Object.keys(sel).length;
  $("aok").textContent = c ? t("add") + " (" + c + ")" : t("add");
}
function drawPg(keep) {
  var inl = inList(),
    h = "",
    st = $("pg").scrollTop;
  DB.forEach(function (x) {
    if (pgen && x[2] !== pgen) return;
    if (pq && norm(x[1]).indexOf(pq) < 0 && String(x[0]) !== pq) return;
    h +=
      '<button class="pt' +
      (inl[norm(x[1])] ? " in" : "") +
      (sel[x[0]] ? " sel" : "") +
      '" data-id="' +
      x[0] +
      '"><img data-id="' +
      x[0] +
      '" alt="" draggable="false"><span class="pn">' +
      esc(x[1]) +
      '</span><span class="pd">#' +
      x[0] +
      " · G" +
      x[2] +
      "</span></button>";
  });
  var pg = $("pg");
  pg.innerHTML = h || '<div class="empty" style="grid-column:1/-1">' + t("nores2") + "</div>";
  pg.scrollTop = keep ? st : 0;
  [].forEach.call(pg.querySelectorAll("img"), function (im) {
    obs.observe(im);
  });
  upd();
}
$("pg").addEventListener("click", function (e) {
  var b = e.target.closest(".pt");
  if (!b || b.classList.contains("in")) return;
  var id = b.dataset.id;
  if (sel[id]) delete sel[id];
  else sel[id] = 1;
  b.classList.toggle("sel");
  upd();
});
$("addb").addEventListener("click", function () {
  $("add").classList.add("open");
  amsg("");
  drawPg();
});
function root(id) {
  var g = 0;
  while (DBM[id] && DBM[id][3] && g++ < 9) id = DBM[id][3];
  return id;
}
function fam(id) {
  var o = [];
  (function d(x) {
    o.push(x);
    (KIDS[x] || []).forEach(d);
  })(root(id));
  return o;
}
function putInRow(row, name) {
  var id = NID[norm(name)],
    j = row.length;
  if (id) {
    var f = fam(id),
      k = f.indexOf(id);
    for (var i = 0; i < row.length; i++) {
      var o = NID[norm(row[i])];
      if (o && root(o) === root(id) && f.indexOf(o) > k) {
        j = i;
        break;
      }
    }
  }
  row.splice(j, 0, name);
}
function findRow(id) {
  var rt = root(id);
  for (var si = 0; si < R.length; si++)
    for (var ri = 0; ri < R[si].length; ri++) {
      var row = R[si][ri];
      if (
        row.length < 9 &&
        row.some(function (n) {
          var o = NID[norm(n)];
          return o && root(o) === rt;
        })
      )
        return { row: row, si: si };
    }
  return null;
}
$("aok").addEventListener("click", function () {
  var ids = Object.keys(sel).map(Number);
  if (!ids.length) {
    amsg(t("pick"), 1);
    return;
  }
  var g = $("ag").value,
    own = $("aown").checked,
    fm = $("afam").checked,
    inl = inList(),
    roots = {},
    added = 0,
    where = {};
  ids.forEach(function (id) {
    roots[root(id)] = 1;
  });
  Object.keys(roots).forEach(function (r) {
    var mem = fam(+r).filter(function (x) {
      return fm || sel[x];
    });
    var left = [];
    mem.forEach(function (x) {
      var n = DBM[x][1];
      if (inl[norm(n)]) return;
      var f = findRow(x);
      if (f) {
        putInRow(f.row, n);
        if (own) have[n] = true;
        added++;
        where[T[f.si]] = 1;
      } else left.push(n);
    });
    var si = g === "" ? NS : g === "auto" ? Math.min(DBM[mem[0]][2], 9) - 1 : +g;
    var step = left.length <= 9 ? Math.max(3, left.length) : 3;
    for (var i = 0; i < left.length; i += step) {
      var row = left.slice(i, i + step);
      R[si].push(row);
      row.forEach(function (n) {
        if (own) have[n] = true;
      });
      added += row.length;
      where[T[si]] = 1;
    }
  });
  if (!added) {
    amsg(t("alr"), 1);
    return;
  }
  sel = {};
  save();
  render();
  drawPg(1);
  amsg(t("cadded", { n: added, w: Object.keys(where).join(", ") }));
});
$("a1b").addEventListener("click", function () {
  var n = canon(cap($("a1").value));
  if (!n) return;
  if (n.length > 200) {
    amsg(t("timpf"), 1);
    return;
  }
  if (has(n)) {
    amsg(t("inl", { x: n }), 1);
    return;
  }
  var g = $("ag").value,
    si = g === "" || g === "auto" ? NS : +g;
  R[si].push([n]);
  if ($("aown").checked) have[n] = true;
  save();
  render();
  $("a1").value = "";
  amsg(t("added1", { x: n, s: T[si] }));
});
$("stb").addEventListener("click", function () {
  var inl = inList(),
    added = 0;
  STARTERS.forEach(function (g, si) {
    g.forEach(function (l) {
      var miss = l.split(" - ").filter(function (n) {
        return !inl[norm(n)];
      });
      if (miss.length) {
        R[si].push(miss);
        miss.forEach(function (n) {
          inl[norm(n)] = 1;
        });
        added += miss.length;
      }
    });
  });
  if (!added) {
    amsg(t("stalr"), 1);
    return;
  }
  save();
  render();
  drawPg(1);
  amsg(t("stadd", { n: added }));
});
