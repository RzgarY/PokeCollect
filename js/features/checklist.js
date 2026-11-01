/* Koleksiyon listesi: çizim, tıklama, filtre, düzenleme modu */
function render() {
  var names = allNames(),
    n = names.filter(function (p) {
      return have[p];
    }).length,
    total = names.length || 1,
    pc = Math.round((n / total) * 100);
  $("cnt").textContent = n;
  $("tot").textContent = "/ " + names.length;
  $("rtx").textContent = pc + "%";
  $("left").textContent = t("left", { n: names.length - n });
  $("ring").style.strokeDashoffset = 213.6 * (1 - n / total);
  if (!names.length && editing) {
    editing = false;
    $("edb").classList.remove("on");
    $("edb").setAttribute("aria-pressed", "false");
    $("edt").textContent = t("edit");
  }
  document.body.classList.toggle("ed", editing);
  document.body.classList.toggle("emp", !names.length);
  var html = "";
  R.forEach(function (sec, si) {
    var rh = "",
      own = 0,
      tot = 0,
      parts = T[si].split(" · ");
    sec.forEach(function (r, ri) {
      r.forEach(function (p) {
        tot++;
        if (have[p]) own++;
      });
      var done = r.every(function (p) {
          return have[p];
        }),
        cs = "";
      r.forEach(function (p, ci) {
        if (query && norm(p).indexOf(query) < 0) return;
        if (filter === "have" && !have[p]) return;
        if (filter === "miss" && have[p]) return;
        cs +=
          '<button class="card' +
          (have[p] ? " on" : "") +
          '" aria-pressed="' +
          (have[p] ? "true" : "false") +
          '" data-s="' +
          si +
          '" data-r="' +
          ri +
          '" data-c="' +
          ci +
          '">' +
          ico(p) +
          '<span class="nm">' +
          esc(p) +
          "</span></button>";
      });
      if (!cs) return;
      rh +=
        '<div class="row' +
        (done ? " done" : "") +
        '">' +
        '<div class="rh"><span>' +
        (done ? t("tdone") : r.length > 1 ? t("line", { x: esc(r[0]) }) : t("single")) +
        "</span>" +
        (r.length > 1
          ? '<button class="rm" data-s="' +
            si +
            '" data-r="' +
            ri +
            '">' +
            (done ? t("clear") : t("selall")) +
            "</button>"
          : "") +
        '<button class="rd" data-s="' +
        si +
        '" data-r="' +
        ri +
        '">' +
        t("delrow") +
        "</button></div>" +
        '<div class="cards">' +
        cs +
        "</div></div>";
    });
    if (rh)
      html +=
        '<section class="sec" style="--c:' +
        COL[si] +
        '"><div class="sh"><span class="gb">' +
        (si < NS ? parts[0].replace("Gen ", "") : "★") +
        '</span><div class="st"><h2>' +
        (parts[1] || parts[0]) +
        '</h2><div class="sm"><i style="width:' +
        (tot ? (own / tot) * 100 : 0) +
        '%"></i></div></div><span class="sc">' +
        own +
        " / " +
        tot +
        '</span></div><div class="rows">' +
        rh +
        "</div></section>";
  });
  $("list").innerHTML =
    html ||
    (names.length
      ? '<div class="empty">' + t("nores") + "</div>"
      : '<div class="onb"><button class="start" data-go="add" aria-label="' +
        t("addcard") +
        '"><i>+</i></button><h2 class="pk lets">Let’s start!</h2><p>' +
        t("onb") +
        '</p><button class="b pri" data-go="st">' +
        t("onbst") +
        '</button><button class="lnk" data-go="imp">' +
        t("onbimp") +
        "</button></div>");
  [].forEach.call($("list").querySelectorAll("img[data-sid]"), function (im) {
    im.loading = "lazy";
    im.decoding = "async";
    im.src = SPR[im.dataset.sid];
  });
}
$("list").addEventListener("click", function (e) {
  var c = e.target.closest(".card"),
    b = e.target.closest(".rm");
  if (c) {
    var s = +c.dataset.s,
      r = +c.dataset.r,
      i = +c.dataset.c;
    if (editing) {
      openEd(s, r, i);
    } else {
      var p = R[s][r][i];
      if (have[p]) delete have[p];
      else have[p] = true;
      save();
      render();
    }
  } else if (b) {
    var row = R[+b.dataset.s][+b.dataset.r],
      all = row.every(function (p) {
        return have[p];
      });
    row.forEach(function (p) {
      if (all) delete have[p];
      else have[p] = true;
    });
    save();
    render();
  }
});
$("q").addEventListener(
  "input",
  debounce(function (e) {
    query = norm(e.target.value);
    render();
  }, 150),
);
document.querySelectorAll(".seg .b").forEach(function (b) {
  b.addEventListener("click", function () {
    filter = b.dataset.f;
    document.querySelectorAll(".seg .b").forEach(function (x) {
      x.classList.toggle("on", x === b);
    });
    render();
  });
});
$("edb").addEventListener("click", function () {
  editing = !editing;
  this.classList.toggle("on", editing);
  this.setAttribute("aria-pressed", editing);
  $("edt").textContent = t(editing ? "done" : "edit");
  render();
});
$("addx").addEventListener("click", function () {
  $("add").classList.remove("open");
});
$("add").addEventListener("click", function (e) {
  if (e.target === this) this.classList.remove("open");
});
arm($("reset"), "reset", "sure", function () {
  var j = snap();
  have = {};
  save();
  render();
  toast(t("tmarks"), function () {
    undoTo(j);
  });
});
arm($("delall"), "delall", "sureall", function () {
  var n = allNames().length,
    j = snap();
  R = T.map(function () {
    return [];
  });
  have = {};
  save();
  render();
  toast(t("tdel", { n: n }), function () {
    undoTo(j);
  });
});
/* Boş ekran düğmeleri + satır silme */
$("list").addEventListener("click", function (e) {
  var g = e.target.closest("[data-go]");
  if (g) {
    if (g.dataset.go === "add") $("addb").click();
    else if (g.dataset.go === "st") {
      $("stb").click();
      toast(t("tst"));
    } else $("imp").click();
    return;
  }
  var d = e.target.closest(".rd");
  if (!d) return;
  var s = +d.dataset.s,
    r = +d.dataset.r,
    row = R[s][r],
    j = snap();
  row.forEach(function (p) {
    delete have[p];
  });
  R[s].splice(r, 1);
  save();
  render();
  toast(t("tdel", { n: row.length }), function () {
    undoTo(j);
  });
});
