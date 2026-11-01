/* Binder ve İstatistik */
(function () {
  "use strict";
  var W = [
    ["tab", "Binder", "Binder"],
    ["tabs", "Stats", "İstatistik"],
    ["new", "New binder", "Yeni binder"],
    ["name", "Binder name", "Binder adı"],
    ["size", "Pocket grid", "Cep düzeni"],
    ["pages", "Pages", "Sayfa sayısı"],
    ["create", "Create", "Oluştur"],
    ["auto", "Auto-fill", "Otomatik doldur"],
    ["del", "Delete", "Sil"],
    ["sure", "Sure? Tap again", "Emin misin? Tekrar dokun"],
    ["page", "Page", "Sayfa"],
    ["sum", "{f}/{t} slots · {o} owned · {h} hunting", "{f}/{t} cep · {o} elimde · {h} aranıyor"],
    ["hunt", "Hunting", "Aranıyor"],
    ["done", "Page complete!", "Sayfa tamam!"],
    ["pick", "Pick a card", "Kart seç"],
    ["rem", "Remove from slot", "Cepten çıkar"],
    ["have", "In my collection", "Koleksiyonumdakiler"],
    ["want", "Wanted · shown in black & white", "Aranan · siyah-beyaz görünür"],
    [
      "none",
      "No cards yet. Add cards in the My Cards tab, or add one by hand below.",
      "Henüz kart yok. Kartlarım sekmesinden kart ekle veya aşağıdan elle ekle.",
    ],
    ["search", "Search cards…", "Kart ara…"],
    ["manual", "Add a card by hand", "Elle kart ekle"],
    ["mon", "Pokémon name", "Pokémon adı"],
    ["setno", "Set and number (optional)", "Set ve numara (isteğe bağlı)"],
    ["iown", "I own it", "Elimde"],
    ["ihunt", "I’m hunting it", "Arıyorum"],
    ["addb", "Add", "Ekle"],
    ["nomon", "Pick a Pokémon from the list.", "Listeden bir Pokémon seç."],
    [
      "empty",
      "Create your first binder and arrange your cards page by page. Cards you are still hunting show up in black & white until you get them.",
      "İlk binder’ını oluştur ve kartlarını sayfa sayfa diz. Hâlâ aradığın kartlar, sen onları bulana kadar siyah-beyaz görünür.",
    ],
    ["filled", "Auto-filled {n} slots.", "{n} cep dolduruldu."],
    ["full", "No empty slots left.", "Boş cep kalmadı."],
    ["s_mon", "Pokémon", "Pokémon"],
    ["s_uni", "Unique cards", "Farklı kart"],
    ["s_tot", "Cards owned", "Toplam kart"],
    ["s_want", "Wanted", "Aranan"],
    ["s_gen", "Progress by generation", "Nesillere göre ilerleme"],
    ["s_close", "Closest to finished", "Bitirmeye en yakın"],
    ["s_bad", "Badges", "Rozetler"],
    ["s_rec", "Recently collected", "Son toplananlar"],
    ["s_none", "Nothing yet.", "Henüz yok."],
    ["b1", "First catch", "İlk yakalama"],
    ["b2", "10 Pokémon", "10 Pokémon"],
    ["b3", "25% complete", "%25 tamam"],
    ["b4", "50% complete", "%50 tamam"],
    ["b5", "75% complete", "%75 tamam"],
    ["b6", "Master collector", "Usta koleksiyoncu"],
    ["b7", "First line done", "İlk hat tamam"],
    ["b8", "5 lines done", "5 hat tamam"],
    ["b9", "Generation done", "Nesil tamam"],
    ["b10", "10 unique cards", "10 farklı kart"],
    ["b11", "50 unique cards", "50 farklı kart"],
    ["b12", "Binder builder", "Binder kurucusu"],
    ["b13", "Perfect page", "Kusursuz sayfa"],
    ["b14", "On the hunt", "Av başında"],
  ];
  W.forEach(function (w) {
    I.en["bn_" + w[0]] = w[1];
    I.tr["bn_" + w[0]] = w[2];
  });
  function bt(k, a) {
    return t("bn_" + k, a);
  }
  var BK = "pokecollect-binders-v1",
    LOGK = "pokecollect-log",
    S = { list: [], cur: "", pg: 0 },
    slot = -1,
    LOG = [];
  try {
    var j = JSON.parse(localStorage.getItem(BK) || "{}");
    if (j && Array.isArray(j.list)) {
      S.list = j.list;
      S.cur = j.cur || "";
    }
  } catch (e) {}
  try {
    LOG = JSON.parse(localStorage.getItem(LOGK) || "[]") || [];
  } catch (e) {
    LOG = [];
  }
  function sv() {
    try {
      localStorage.setItem(BK, JSON.stringify({ list: S.list, cur: S.cur }));
    } catch (e) {}
  }
  var prev = Object.assign({}, have);
  onSave(function () {
    try {
      Object.keys(have).forEach(function (k) {
        if (have[k] && !prev[k]) LOG.push({ n: k, t: Date.now() });
      });
      prev = Object.assign({}, have);
      LOG = LOG.slice(-200);
      localStorage.setItem(LOGK, JSON.stringify(LOG));
    } catch (e) {}
  });
  function X() {
    return (
      window.TCGX || {
        inv: function () {
          return {};
        },
        wanted: function () {
          return {};
        },
        meta: function () {
          return {};
        },
        addManual: function () {},
      }
    );
  }
  function qtyOf(id) {
    var iv = X().inv()[id] || {};
    return Object.keys(iv).reduce(function (a, v) {
      return a + (Number(iv[v]) || 0);
    }, 0);
  }
  function owned(id) {
    return qtyOf(id) > 0;
  }
  function info(id) {
    var m = X().meta()[id] || {},
      pt = id.split("-");
    return {
      n: m.n || id,
      no: m.no || (pt.length > 1 ? pt[pt.length - 1] : ""),
      r: m.r || "",
      s: m.s || (pt.length > 1 ? pt.slice(0, -1).join("-") : ""),
      i: m.i || "",
      p: (m.p && m.p[0]) || 0,
    };
  }
  function cb() {
    return (
      S.list.find(function (b) {
        return b.id === S.cur;
      }) ||
      S.list[0] ||
      null
    );
  }
  function face(id, own) {
    var c = info(id),
      sp = c.p && SPR[c.p];
    return (
      '<div class="bncard' +
      (own ? "" : " ghost") +
      '">' +
      (own ? "" : '<span class="bnhunt">★ ' + bt("hunt") + "</span>") +
      (c.i ? '<img class="bnimg" src="' + esc(c.i) + '" alt="">' : "") +
      '<div class="bnface">' +
      (sp ? '<img class="bnsp" src="' + sp + '" alt="">' : '<i class="ball"></i>') +
      "<b>" +
      esc(c.n) +
      "</b><small>" +
      esc(c.s) +
      (c.no ? " #" + esc(c.no) : "") +
      "</small></div></div>"
    );
  }
  document.addEventListener(
    "error",
    function (e) {
      var x = e.target;
      if (x && x.classList && x.classList.contains("bnimg")) x.remove();
    },
    true,
  );
  function bRender() {
    var b = cb(),
      el = $("bnd");
    if (!b) {
      el.innerHTML =
        '<div class="bnem"><div>🗂</div><p>' +
        bt("empty") +
        '</p><button class="b pri" data-act="new">' +
        bt("new") +
        "</button></div>";
      return;
    }
    var per = b.cols * b.rows,
      f = 0,
      o = 0,
      h = 0;
    S.pg = Math.max(0, Math.min(S.pg, b.pages - 1));
    b.slots.forEach(function (id) {
      if (id) {
        f++;
        if (owned(id)) o++;
        else h++;
      }
    });
    var st = S.pg * per,
      cells = "",
      po = 0;
    for (var i = 0; i < per; i++) {
      var id = b.slots[st + i];
      if (id) {
        var ow = owned(id);
        if (ow) po++;
        cells += '<button class="bnslot" data-i="' + (st + i) + '">' + face(id, ow) + "</button>";
      } else cells += '<button class="bnslot em" data-i="' + (st + i) + '">＋</button>';
    }
    el.innerHTML =
      '<div class="bnbar"><select id="bsel">' +
      S.list
        .map(function (x) {
          return (
            '<option value="' +
            esc(x.id) +
            '"' +
            (x.id === b.id ? " selected" : "") +
            ">" +
            esc(x.name) +
            "</option>"
          );
        })
        .join("") +
      '</select><button class="b" data-act="new">＋</button><button class="b" data-act="auto">' +
      bt("auto") +
      '</button><button class="b dan" data-act="del">' +
      bt("del") +
      "</button></div>" +
      '<div class="bnsum" id="bnmsg">' +
      bt("sum", { f: f, t: b.slots.length, o: o, h: h }) +
      "</div>" +
      '<div class="bnnav"><button class="ib" data-act="prev"' +
      (S.pg ? "" : " disabled") +
      '>‹</button><div class="bnpg">' +
      bt("page") +
      " " +
      (S.pg + 1) +
      " / " +
      b.pages +
      (po === per ? ' <span class="bnok">✨ ' + bt("done") + "</span>" : "") +
      '</div><button class="ib" data-act="next"' +
      (S.pg < b.pages - 1 ? "" : " disabled") +
      ">›</button></div>" +
      '<div class="bngrid" style="--c:' +
      b.cols +
      '">' +
      cells +
      "</div>";
  }
  function dexOf(id) {
    return info(id).p || 99999;
  }
  function autoFill() {
    var b = cb();
    if (!b) return;
    var empty = [],
      used = {};
    b.slots.forEach(function (v, i) {
      if (v) used[v] = 1;
      else empty.push(i);
    });
    if (!empty.length) {
      $("bnmsg").textContent = bt("full");
      return;
    }
    var inv = X().inv(),
      wn = X().wanted();
    function srt(a) {
      return a.sort(function (x, y) {
        return dexOf(x) - dexOf(y) || (x < y ? -1 : 1);
      });
    }
    var o = srt(
        Object.keys(inv).filter(function (id) {
          return owned(id) && !used[id];
        }),
      ),
      w = srt(
        Object.keys(wn).filter(function (id) {
          return wn[id] && !owned(id) && !used[id];
        }),
      ),
      q = o.concat(w),
      n = 0;
    empty.forEach(function (i) {
      if (q.length) {
        b.slots[i] = q.shift();
        n++;
      }
    });
    sv();
    bRender();
    $("bnmsg").textContent = n ? bt("filled", { n: n }) : bt("none");
  }
  function two(btn, fn) {
    if (btn.dataset.a) {
      fn();
      return;
    }
    btn.dataset.a = 1;
    var old = btn.textContent;
    btn.textContent = bt("sure");
    setTimeout(function () {
      if (btn.isConnected) {
        delete btn.dataset.a;
        btn.textContent = old;
      }
    }, 3000);
  }
  $("bnd").addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"),
      sl = e.target.closest(".bnslot"),
      b = cb();
    if (sl) {
      openPick(+sl.dataset.i);
      return;
    }
    if (!a) return;
    var k = a.dataset.act;
    if (k === "new") {
      $("bnname").value = "";
      $("bnewd").classList.add("open");
    } else if (k === "auto") autoFill();
    else if (k === "del")
      two(a, function () {
        S.list = S.list.filter(function (x) {
          return x !== b;
        });
        S.cur = S.list[0] ? S.list[0].id : "";
        S.pg = 0;
        sv();
        bRender();
      });
    else if (k === "prev") {
      S.pg--;
      bRender();
    } else if (k === "next") {
      S.pg++;
      bRender();
    }
  });
  $("bnd").addEventListener("change", function (e) {
    if (e.target.id === "bsel") {
      S.cur = e.target.value;
      S.pg = 0;
      sv();
      bRender();
    }
  });
  $("bnx").addEventListener("click", function () {
    $("bnewd").classList.remove("open");
  });
  $("bnewd").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("open");
  });
  $("bncre").addEventListener("click", function () {
    var sz = $("bnsize").value.split(","),
      c = +sz[0],
      r = +sz[1],
      pg = Math.max(1, Math.min(60, parseInt($("bnpages").value, 10) || 4));
    var b = {
      id: "b" + Date.now().toString(36),
      name: $("bnname").value.trim() || "Binder " + (S.list.length + 1),
      cols: c,
      rows: r,
      pages: pg,
      slots: new Array(c * r * pg).fill(null),
    };
    S.list.push(b);
    S.cur = b.id;
    S.pg = 0;
    sv();
    $("bnewd").classList.remove("open");
    bRender();
  });
  /* kart seçici */
  var dl = false;
  function openPick(i) {
    slot = i;
    var b = cb();
    $("bprm").style.display = b.slots[i] ? "" : "none";
    $("bq").value = "";
    if (!dl) {
      dl = true;
      $("bdl").innerHTML = DB.map(function (x) {
        return '<option value="' + esc(x[1]) + '">';
      }).join("");
    }
    fillPick();
    $("bpick").classList.add("open");
  }
  function fillPick() {
    var b = cb(),
      qs = norm($("bq").value),
      inv = X().inv(),
      wn = X().wanted(),
      used = {};
    b.slots.forEach(function (v, i) {
      if (v && i !== slot) used[v] = (used[v] || 0) + 1;
    });
    function row(id, own) {
      var c = info(id),
        sp = c.p && SPR[c.p],
        q = qtyOf(id),
        av = (used[id] || 0) < Math.max(1, q);
      return (
        '<button class="bnp' +
        (own ? "" : " gh") +
        '" data-id="' +
        esc(id) +
        '"' +
        (av ? "" : " disabled") +
        ">" +
        (sp ? '<img src="' + sp + '" alt="">' : '<i class="ball"></i>') +
        "<span><b>" +
        esc(c.n) +
        "</b><small>" +
        esc(c.s) +
        (c.no ? " #" + esc(c.no) : "") +
        (c.r ? " · " + esc(c.r) : "") +
        "</small></span><em>" +
        (own ? "×" + q : "★") +
        "</em></button>"
      );
    }
    function flt(a) {
      return a
        .filter(function (id) {
          var c = info(id);
          return !qs || norm(c.n + " " + c.s + " " + c.no).indexOf(qs) >= 0;
        })
        .sort(function (x, y) {
          return dexOf(x) - dexOf(y) || (x < y ? -1 : 1);
        });
    }
    var o = flt(Object.keys(inv).filter(owned)),
      w = flt(
        Object.keys(wn).filter(function (id) {
          return wn[id] && !owned(id);
        }),
      ),
      h = "";
    if (o.length)
      h +=
        "<h4>" +
        bt("have") +
        "</h4>" +
        o
          .map(function (id) {
            return row(id, true);
          })
          .join("");
    if (w.length)
      h +=
        "<h4>" +
        bt("want") +
        "</h4>" +
        w
          .map(function (id) {
            return row(id, false);
          })
          .join("");
    $("bplist").innerHTML = h || '<p class="hint">' + bt("none") + "</p>";
  }
  $("bq").addEventListener("input", debounce(fillPick, 150));
  $("bpx").addEventListener("click", function () {
    $("bpick").classList.remove("open");
  });
  $("bpick").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("open");
  });
  $("bprm").addEventListener("click", function () {
    cb().slots[slot] = null;
    sv();
    $("bpick").classList.remove("open");
    bRender();
  });
  $("bplist").addEventListener("click", function (e) {
    var x = e.target.closest(".bnp");
    if (!x || x.disabled) return;
    cb().slots[slot] = x.dataset.id;
    sv();
    $("bpick").classList.remove("open");
    bRender();
  });
  $("bmadd").addEventListener("click", function () {
    var id = NID[norm($("bmon").value)],
      m = $("bmmsg");
    if (!id) {
      m.textContent = bt("nomon");
      return;
    }
    m.textContent = "";
    var cid = "manual-" + Date.now().toString(36);
    X().addManual(
      cid,
      { n: DBM[id][1], no: "", r: "", s: $("bset").value.trim(), i: "", p: [id] },
      $("bown").value === "own",
    );
    $("bmon").value = "";
    $("bset").value = "";
    fillPick();
  });
  /* istatistik */
  function rel(ts) {
    var d = (ts - Date.now()) / 1000,
      u = [
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
      ];
    try {
      var f = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
      for (var i = 0; i < u.length; i++)
        if (Math.abs(d) >= u[i][1]) return f.format(Math.round(d / u[i][1]), u[i][0]);
      return f.format(0, "second");
    } catch (e) {
      return new Date(ts).toLocaleDateString();
    }
  }
  function stsRender() {
    var nm = allNames(),
      n = nm.filter(function (p) {
        return have[p];
      }).length,
      pc = nm.length ? n / nm.length : 0,
      inv = X().inv(),
      wn = X().wanted();
    var ids = Object.keys(inv).filter(owned),
      tot = ids.reduce(function (a, id) {
        return a + qtyOf(id);
      }, 0),
      wc = Object.keys(wn).filter(function (k) {
        return wn[k];
      }).length;
    var rows = [],
      gens = "",
      rd = 0,
      gd = false;
    R.forEach(function (sec, si) {
      var a = 0,
        tt = 0,
        all = sec.length > 0;
      sec.forEach(function (r) {
        var g = r.filter(function (p) {
          return have[p];
        }).length;
        a += g;
        tt += r.length;
        if (g === r.length && r.length) rd++;
        else all = false;
        if (g > 0 && g < r.length) rows.push({ r: r, g: g });
      });
      if (all && si < 9) gd = true;
      if (tt)
        gens +=
          '<div class="sgb" style="--c:' +
          ((window.COL || [])[si] || "var(--ac)") +
          '"><span>' +
          esc(T[si]) +
          '</span><div><i style="width:' +
          (a / tt) * 100 +
          '%"></i></div><span>' +
          a +
          " / " +
          tt +
          "</span></div>";
    });
    rows.sort(function (x, y) {
      return y.g / y.r.length - x.g / x.r.length || x.r.length - x.g - (y.r.length - y.g);
    });
    var fp = S.list.some(function (b) {
      var per = b.cols * b.rows;
      for (var p = 0; p < b.pages; p++) {
        var s = b.slots.slice(p * per, p * per + per);
        if (
          s.length === per &&
          s.every(function (id) {
            return id && owned(id);
          })
        )
          return true;
      }
      return false;
    });
    var BD = [
      ["🥚", "b1", n >= 1],
      ["🔟", "b2", n >= 10],
      ["🌱", "b3", pc >= 0.25],
      ["🌿", "b4", pc >= 0.5],
      ["🌳", "b5", pc >= 0.75],
      ["👑", "b6", nm.length > 0 && pc >= 1],
      ["🔗", "b7", rd >= 1],
      ["🏅", "b8", rd >= 5],
      ["🌍", "b9", gd],
      ["🃏", "b10", ids.length >= 10],
      ["📚", "b11", ids.length >= 50],
      ["🗂", "b12", S.list.length > 0],
      ["✨", "b13", fp],
      ["🎯", "b14", wc >= 5],
    ];
    var rec = LOG.filter(function (x) {
      return have[x.n];
    })
      .slice(-8)
      .reverse();
    $("sts").innerHTML =
      '<div class="stg"><div class="stc"><b>' +
      n +
      " / " +
      nm.length +
      "</b><small>" +
      bt("s_mon") +
      '</small></div><div class="stc"><b>' +
      ids.length +
      "</b><small>" +
      bt("s_uni") +
      '</small></div><div class="stc"><b>' +
      tot +
      "</b><small>" +
      bt("s_tot") +
      '</small></div><div class="stc"><b>' +
      wc +
      "</b><small>" +
      bt("s_want") +
      "</small></div></div>" +
      '<h3 class="sth">' +
      bt("s_gen") +
      "</h3>" +
      (gens || '<p class="hint">' + bt("s_none") + "</p>") +
      '<h3 class="sth">' +
      bt("s_close") +
      "</h3>" +
      (rows
        .slice(0, 5)
        .map(function (x) {
          return (
            '<div class="scl"><b>' +
            esc(x.r.join(" · ")) +
            "</b><span>" +
            x.g +
            " / " +
            x.r.length +
            "</span></div>"
          );
        })
        .join("") || '<p class="hint">' + bt("s_none") + "</p>") +
      '<h3 class="sth">' +
      bt("s_bad") +
      " · " +
      BD.filter(function (x) {
        return x[2];
      }).length +
      " / " +
      BD.length +
      '</h3><div class="sbd">' +
      BD.map(function (x) {
        return (
          '<div class="sbi' +
          (x[2] ? "" : " lk") +
          '"><span>' +
          x[0] +
          "</span>" +
          bt(x[1]) +
          "</div>"
        );
      }).join("") +
      "</div>" +
      '<h3 class="sth">' +
      bt("s_rec") +
      "</h3>" +
      (rec
        .map(function (x) {
          return '<div class="scl"><b>' + esc(x.n) + "</b><span>" + rel(x.t) + "</span></div>";
        })
        .join("") || '<p class="hint">' + bt("s_none") + "</p>");
  }
  window.bnPurge = function (id) {
    S.list.forEach(function (b) {
      b.slots.forEach(function (v, i) {
        if (v === id) b.slots[i] = null;
      });
    });
    sv();
    bRender();
  };
  window.bndOpen = bRender;
  window.stsOpen = stsRender;
  $("bndBtn").addEventListener("click", function () {
    dpage("bnd");
    setHash("binder");
  });
  $("stsBtn").addEventListener("click", function () {
    dpage("sts");
    setHash("stats");
  });
  onLangChange(function () {
    bRender();
    if (document.body.classList.contains("pg-sts")) stsRender();
  });
  applyLang();
})();
