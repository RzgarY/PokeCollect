/* Kartlarım (TCG kart envanteri, fotoğraf, içe/dışa aktarma) */
(function () {
  "use strict";
  var selMode = false,
    sel = {},
    CK = "pokecollect-cards-v2",
    OK = "pokecollect-tcg-inventory-v1",
    AK = OK + "-auto",
    cards = [],
    IMG = {},
    idb = null,
    view = "all",
    cur = null,
    queue = [],
    qi = 0,
    tgt = "new",
    warned = 0,
    auto = {};
      I.tr.cc_select = "☑ Seç";
  I.en.cc_select = "☑ Select";
  I.tr.cc_cancel = "İptal";
  I.en.cc_cancel = "Cancel";
  I.tr.cc_selall = "Hepsini seç";
  I.en.cc_selall = "Select all";
  I.tr.cc_bsel = "{n} seçili";
  I.en.cc_bsel = "{n} selected";
  I.tr.cc_bdel = "Seçilenleri sil";
  I.en.cc_bdel = "Delete selected";
  I.tr.cc_wipe = "☠ Tümünü sil";
  I.en.cc_wipe = "☠ Delete all";
  I.tr.cc_wipeq = "Tüm {n} kart ve fotoğrafları silinecek. Geri alınamaz. Emin misin?";
  I.en.cc_wipeq = "All {n} cards and photos will be deleted. This can’t be undone. Sure?";
  I.tr.cc_deld = "{n} kart silindi.";
  I.en.cc_deld = "Deleted {n} cards.";
  I.tr.cc_other = "Diğer (yaz)…";
  I.en.cc_other = "Other (type)…";
  XK.push(CK);
  try {
    auto = JSON.parse(localStorage.getItem(AK) || "{}") || {};
  } catch (e) {}
  function sAuto() {
    try {
      localStorage.setItem(AK, JSON.stringify(auto));
    } catch (e) {}
  }
  function sCards() {
    try {
      localStorage.setItem(CK, JSON.stringify(cards));
      return true;
    } catch (e) {
      toast(t("cc_full"));
      return false;
    }
  }
  try {
    cards = JSON.parse(localStorage.getItem(CK) || "[]");
    if (!Array.isArray(cards)) cards = [];
  } catch (e) {
    cards = [];
  }
  if (!localStorage.getItem(CK)) {
    try {
      var oi = JSON.parse(localStorage.getItem(OK) || "{}"),
        ow = JSON.parse(localStorage.getItem(OK + "-wanted") || "{}"),
        om = JSON.parse(localStorage.getItem(OK + "-meta") || "{}");
      Object.keys(Object.assign({}, oi, ow)).forEach(function (id) {
        var m = om[id] || {},
          vs = oi[id] || {},
          k = Object.keys(vs),
          q = k.reduce(function (a, x) {
            return a + (+vs[x] || 0);
          }, 0);
        cards.push({
          id: id,
          n: m.n || id,
          m: (m.p || [])
            .filter(function (d) {
              return DBM[d];
            })
            .slice(0, 2),
          s: m.s || "",
          no: m.no || "",
          r: m.r || "",
          v: k[0] || "Normal",
          q: q,
          o: q > 0,
          u: m.i || "",
        });
      });
      if (cards.length) sCards();
    } catch (e) {}
  }
  try {
    var rq = indexedDB.open("pokecollect-photos", 1);
    rq.onupgradeneeded = function () {
      rq.result.createObjectStore("p", { keyPath: "id" });
    };
    rq.onerror = function () {};
    rq.onsuccess = function () {
      idb = rq.result;
      var g = idb.transaction("p").objectStore("p").getAll();
      g.onsuccess = function () {
        g.result.forEach(function (r) {
          IMG[r.id] = r.d;
        });
        drawC();
        if (window.bndOpen && document.body.classList.contains("pg-bnd")) window.bndOpen();
      };
    };
  } catch (e) {}
  function idbW(id, d) {
    if (!idb) {
      if (!warned++) toast(t("cc_nostore"));
      return;
    }
    try {
      var s = idb.transaction("p", "readwrite").objectStore("p");
      d ? s.put({ id: id, d: d }) : s.delete(id);
    } catch (e) {}
  }
  function readPhoto(f) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(f),
        im = new Image();
      im.onload = function () {
        try {
          var w = im.naturalWidth,
            h = im.naturalHeight,
            s = Math.min(1, 900 / Math.max(w, h)),
            c = document.createElement("canvas");
          c.width = Math.round(w * s);
          c.height = Math.round(h * s);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(u);
          ok(c.toDataURL("image/jpeg", 0.85));
        } catch (e) {
          no(e);
        }
      };
      im.onerror = function () {
        URL.revokeObjectURL(u);
        no(new Error("img"));
      };
      im.src = u;
    });
  }
  function mn(c) {
    return (c.m || [])
      .map(function (d) {
        return DBM[d] && DBM[d][1];
      })
      .filter(Boolean);
  }
  function sync(list) {
    var add = [],
      rm = [],
      ch = 0;
    list
      .filter(function (n, i) {
        return list.indexOf(n) === i;
      })
      .forEach(function (n) {
        var own = cards.some(function (c) {
            return c.o && mn(c).indexOf(n) >= 0;
          }),
          d = NID[norm(n)];
        if (own) {
          if (!has(n) && d) {
            var f = findRow(d);
            if (f) putInRow(f.row, n);
            else R[NS].push([n]);
            ch = 1;
          }
          if (!have[n]) {
            have[n] = true;
            auto[n] = true;
            add.push(n);
            ch = 1;
          }
        } else if (auto[n]) {
          if (have[n]) {
            delete have[n];
            rm.push(n);
            ch = 1;
          }
          delete auto[n];
        }
      });
    sAuto();
    if (ch) {
      save();
      render();
      drawDex();
    }
    if (add.length) toast(t("cc_added", { n: add.join(", ") }));
    else if (rm.length) toast(t("cc_removed", { n: rm.join(", ") }));
  }
  function cardH(c) {
    var im = IMG[c.id] || c.u || "",
      sp = mn(c)
        .map(function (n) {
          var d = NID[norm(n)];
          return SPR[d] ? '<img alt="" src="' + SPR[d] + '">' : "";
        })
        .join("");
    return (
      '<button class="cc-card' +
      (c.o ? "" : " want") +
      (sel[c.id] ? " sel" : "") +
      '" type="button" data-id="' +
      esc(c.id) +
      '"><div class="cc-ph">' +
      (im ? '<img alt="" loading="lazy" src="' + esc(im) + '">' : '<i class="ball"></i>') +
      (c.o && c.q > 1 ? '<span class="cc-q">×' + c.q + "</span>" : "") +
      (c.o ? "" : '<span class="cc-w">★</span>') +
      (sel[c.id] ? '<span class="cc-ck">✓</span>' : "") +
      '</div><div class="cc-nm">' +
      esc(c.n) +
      '</div><div class="cc-mt">' +
      sp +
      "<span>" +
      esc(
        [c.s, c.no ? "#" + c.no : "", c.v && c.v !== "Normal" ? c.v : ""]
          .filter(Boolean)
          .join(" · "),
      ) +
      "</span></div></button>"
    );
  }
  function drawC() {
    var q = norm($("ccsq").value),
      n = 0,
      w = 0;
    cards.forEach(function (c) {
      if (c.o) n += c.q;
      else w++;
    });
    $("ccsum").textContent = t("cc_sum", { c: cards.length, q: n, w: w });
    var l = cards
      .filter(function (c) {
        return (
          (view === "all" || (view === "own") === !!c.o) &&
          (!q || norm([c.n, mn(c).join(" "), c.s, c.no, c.r, c.v].join(" ")).indexOf(q) >= 0)
        );
      })
      .reverse();
    $("ccgrid").innerHTML = l.length
      ? l.map(cardH).join("")
      : '<p class="cc-em">' + t(cards.length ? "cc_nores" : "cc_empty") + "</p>";
    barUp();
  }
  function barUp() {
    var n = Object.keys(sel).length,
      d = $("ccbdel");
    $("ccbar").hidden = !selMode;
    $("ccsel").textContent = t(selMode ? "cc_cancel" : "cc_select");
    $("ccbn").textContent = t("cc_bsel", { n: n });
    d.disabled = !n;
    if (!n || !d.dataset.a) {
      d.textContent = t("cc_bdel");
      delete d.dataset.a;
    }
    $("ccwipe").disabled = !cards.length;
  }
  function newC() {
    return {
      id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      n: "",
      m: [],
      s: "",
      no: "",
      r: "",
      v: "Normal",
      q: 1,
      o: true,
    };
  }
  var RAR = [
      ["Common", "Yaygın", "Common"],
      ["Uncommon", "Yaygın değil", "Uncommon"],
      ["Rare", "Nadir", "Rare"],
      ["Holo Rare", "Holo nadir", "Holo Rare"],
      ["Double Rare", "Çift nadir (ex)", "Double Rare (ex)"],
      ["Ultra Rare", "Ultra nadir", "Ultra Rare"],
      ["Illustration Rare", "Özel çizim", "Illustration Rare"],
      ["Special Illustration Rare", "Özel çizim nadir", "Special Illustration Rare"],
      ["Hyper Rare", "Hiper / altın", "Hyper Rare"],
      ["Promo", "Promo", "Promo"],
    ],
    SETS = [
      [
        "Scarlet & Violet",
        [
          "Scarlet & Violet",
          "Paldea Evolved",
          "Obsidian Flames",
          "151",
          "Paradox Rift",
          "Paldean Fates",
          "Temporal Forces",
          "Twilight Masquerade",
          "Shrouded Fable",
          "Stellar Crown",
          "Surging Sparks",
          "Prismatic Evolutions",
          "Journey Together",
          "Destined Rivals",
          "Black Bolt",
          "White Flare",
        ],
      ],
      [
        "Sword & Shield",
        [
          "Sword & Shield",
          "Rebel Clash",
          "Darkness Ablaze",
          "Vivid Voltage",
          "Shining Fates",
          "Battle Styles",
          "Chilling Reign",
          "Evolving Skies",
          "Celebrations",
          "Fusion Strike",
          "Brilliant Stars",
          "Astral Radiance",
          "Pokémon GO",
          "Lost Origin",
          "Silver Tempest",
          "Crown Zenith",
        ],
      ],
      [
        "Sun & Moon",
        [
          "Sun & Moon",
          "Guardians Rising",
          "Burning Shadows",
          "Shining Legends",
          "Crimson Invasion",
          "Ultra Prism",
          "Forbidden Light",
          "Celestial Storm",
          "Dragon Majesty",
          "Lost Thunder",
          "Team Up",
          "Detective Pikachu",
          "Unbroken Bonds",
          "Unified Minds",
          "Hidden Fates",
          "Cosmic Eclipse",
        ],
      ],
      [
        "Classic",
        [
          "Base Set",
          "Jungle",
          "Fossil",
          "Base Set 2",
          "Team Rocket",
          "Gym Heroes",
          "Gym Challenge",
          "Neo Genesis",
          "Neo Discovery",
          "Neo Revelation",
          "Neo Destiny",
          "Legendary Collection",
          "Expedition",
          "Aquapolis",
          "Skyridge",
        ],
      ],
      ["—", ["Promo"]],
    ];
  var VAR = [
    ["Normal", "Normal (düz)", "Normal"],
    ["Holofoil", "Holo (çizim parlak)", "Holofoil (shiny art)"],
    ["Reverse Holofoil", "Reverse holo (çizim dışı parlak)", "Reverse Holofoil (shiny frame)"],
    ["1st Edition", "1. baskı (1st Edition)", "1st Edition"],
    ["Unlimited", "Unlimited (sınırsız baskı)", "Unlimited"],
    ["Poké Ball", "Poké Ball deseni", "Poké Ball pattern"],
    ["Master Ball", "Master Ball deseni", "Master Ball pattern"],
  ];
  function fillLists() {
    var h = '<option value="">—</option>';
    $("ccv").innerHTML = VAR.map(function (x) {
      return '<option value="' + esc(x[0]) + '">' + esc(lang === "en" ? x[2] : x[1]) + "</option>";
    }).join("");
    $("ccmi").placeholder = t("cc_monph");
    $("ccr").innerHTML =
      h +
      RAR.map(function (x) {
        return (
          '<option value="' + esc(x[0]) + '">' + esc(lang === "en" ? x[2] : x[1]) + "</option>"
        );
      }).join("");
  }
  function hasOpt(sel, v) {
    return [].some.call($(sel).options, function (o) {
      return o.value === v;
    });
  }
  function setSet(v) {
    $("ccs").value = v || "";
  }
  function getSet() {
    return $("ccs").value.trim();
  }
  function setVar(v) {
    v = v || "Normal";
    if (!hasOpt("ccv", v))
      $("ccv").insertAdjacentHTML(
        "beforeend",
        '<option value="' + esc(v) + '">' + esc(v) + "</option>",
      );
    $("ccv").value = v;
  }
  function setRar(v) {
    if (v && !hasOpt("ccr", v))
      $("ccr").insertAdjacentHTML(
        "beforeend",
        '<option value="' + esc(v) + '">' + esc(v) + "</option>",
      );
    $("ccr").value = v;
  }
  function openEd(c, photo, isNew, i, total) {
    fillLists();
    cur = {
      c: c,
      photo: photo || null,
      isNew: isNew,
      prev: isNew ? [] : mn(c),
      i: i || 0,
      total: total || 0,
    };
    var qm = cur.total > 1;
    $("ccdt").textContent =
      t(isNew ? "cc_new" : "cc_edit") + (qm ? " · " + (cur.i + 1) + " / " + cur.total : "");
    $("ccn").value = c.n;
    setSet(c.s);
    $("ccno").value = c.no;
    setRar(c.r);
    setVar(c.v);
    $("ccmi").value = "";
    $("ccmsg").textContent = "";
    chips();
    pv();
    stat();
    $("ccsv").textContent = t(qm && cur.i < cur.total - 1 ? "cc_savenext" : "save");
    $("ccsk").style.display = qm ? "" : "none";
    var d = $("ccdel");
    d.style.display = isNew ? "none" : "";
    d.textContent = t("del");
    delete d.dataset.a;
    $("ccd").classList.add("open");
  }
  function pv() {
    var s = cur.photo || IMG[cur.c.id] || cur.c.u;
    $("ccpv").innerHTML = s
      ? '<img alt="" src="' + esc(s) + '">'
      : '<div class="cc-np"><i class="ball"></i></div>';
  }
  function chips() {
    $("ccm").innerHTML = cur.c.m
      .map(function (d) {
        var s = SPR[d];
        return (
          '<span class="cc-chip">' +
          (s ? '<img alt="" src="' + s + '">' : "") +
          esc(DBM[d][1]) +
          '<button type="button" data-rm="' +
          d +
          '" aria-label="✕">✕</button></span>'
        );
      })
      .join("");
  }
  function stat() {
    var o = cur.c.o;
    [].forEach.call($("ccst").children, function (b) {
      b.classList.toggle("on", (b.dataset.s === "own") === o);
    });
    $("ccqw").style.display = o ? "" : "none";
    $("ccqn").textContent = cur.c.q;
  }
  function addMon(d) {
    var i = $("ccmi");
    d = Number(d);
    if (!d || !DBM[d]) {
      i.value = "";
      return;
    }
    $("ccmsg").textContent = "";
    if (cur.c.m.indexOf(d) < 0 && cur.c.m.length < 3) {
      cur.c.m.push(d);
      if (!$("ccn").value.trim()) $("ccn").value = DBM[d][1];
    }
    i.value = "";
    chips();
  }
  function closeEd() {
    queue = [];
    cur = null;
    $("ccd").classList.remove("open");
  }
  function nextEd() {
    if (queue.length && qi < queue.length - 1) {
      qi++;
      openEd(newC(), queue[qi], true, qi, queue.length);
    } else closeEd();
  }
  function saveEd() {
    var c = cur.c;
    c.n = $("ccn").value.trim();
    if (!c.n && c.m.length) c.n = DBM[c.m[0]][1];
    if (!c.n) {
      $("ccmsg").textContent = t("cc_needname");
      return false;
    }
    c.s = getSet();
    c.no = $("ccno").value.trim();
    c.r = $("ccr").value;
    c.v = $("ccv").value.trim() || "Normal";
    c.q = c.o ? Math.max(1, c.q) : 0;
    if (cur.photo) {
      IMG[c.id] = cur.photo;
      idbW(c.id, cur.photo);
      c.u = "";
    }
    var i = cards.findIndex(function (x) {
      return x.id === c.id;
    });
    if (i < 0) cards.push(c);
    else cards[i] = c;
    sCards();
    sync(cur.prev.concat(mn(c)));
    drawC();
    return true;
  }
  function onFiles(fl) {
    var a = [].slice.call(fl || []).filter(function (f) {
      return !f.type || /^image\//.test(f.type);
    });
    if (!a.length) return;
    if (tgt === "edit" && cur) {
      readPhoto(a[0]).then(
        function (d) {
          cur.photo = d;
          pv();
        },
        function () {
          toast(t("cc_photofail"));
        },
      );
      return;
    }
    Promise.all(
      a.map(function (f) {
        return readPhoto(f).catch(function () {
          return null;
        });
      }),
    ).then(function (ds) {
      ds = ds.filter(Boolean);
      if (!ds.length) {
        toast(t("cc_photofail"));
        return;
      }
      queue = ds;
      qi = 0;
      openEd(newC(), ds[0], true, 0, ds.length);
    });
  }
  function pick(i, w) {
    tgt = w;
    i.value = "";
    i.click();
  }
  $("cccam").onclick = function () {
    pick($("ccf1"), "new");
  };
  $("ccgal").onclick = function () {
    pick($("ccf2"), "new");
  };
  $("ccecam").onclick = function () {
    pick($("ccf1"), "edit");
  };
  $("ccegal").onclick = function () {
    pick($("ccf2"), "edit");
  };
  $("ccman").onclick = function () {
    queue = [];
    openEd(newC(), null, true);
  };
  [$("ccf1"), $("ccf2")].forEach(function (i) {
    i.onchange = function () {
      onFiles(i.files);
    };
  });
  $("ccgrid").onclick = function (e) {
    var b = e.target.closest(".cc-card");
    if (!b) return;
    if (selMode) {
      var k = b.dataset.id;
      if (sel[k]) delete sel[k];
      else sel[k] = 1;
      drawC();
      return;
    }
    var c = cards.find(function (x) {
      return x.id === b.dataset.id;
    });
    if (c) {
      queue = [];
      openEd(Object.assign({}, c, { m: c.m.slice() }), null, false);
    }
  };
  $("ccsq").oninput = debounce(drawC, 150);
  $("ccfl").onclick = function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    view = b.dataset.v;
    [].forEach.call(this.children, function (x) {
      x.classList.toggle("on", x === b);
    });
    drawC();
  };
  function nrm(x) {
    return String(x)
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
  function combo(inp, dd, items, pick) {
    var act = -1,
      cur2 = [];
    function render() {
      var q = nrm(inp.value.trim().replace(/^#/, ""));
      cur2 = items()
        .filter(function (x) {
          return !q || nrm(x.l).indexOf(q) >= 0 || (x.g && nrm(x.g).indexOf(q) >= 0);
        })
        .slice(0, 60);
      act = -1;
      dd.innerHTML = cur2.length
        ? cur2
            .map(function (x, k) {
              return (
                '<div class="cc-op" data-k="' +
                k +
                '">' +
                esc(x.l) +
                (x.g ? "<small>" + esc(x.g) + "</small>" : "") +
                "</div>"
              );
            })
            .join("")
        : "";
      dd.hidden = !cur2.length;
    }
    function choose(k) {
      var x = cur2[k];
      if (!x) return;
      dd.hidden = true;
      pick(x);
    }
    inp.addEventListener("input", render);
    inp.addEventListener("focus", render);
    inp.addEventListener("blur", function () {
      setTimeout(function () {
        dd.hidden = true;
      }, 150);
    });
    dd.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    dd.addEventListener("click", function (e) {
      var o = e.target.closest(".cc-op");
      if (o) choose(+o.dataset.k);
    });
    inp.addEventListener("keydown", function (e) {
      var n = dd.children;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (dd.hidden) render();
        act = (act + (e.key === "ArrowDown" ? 1 : -1) + n.length) % n.length;
        [].forEach.call(n, function (c, k) {
          c.classList.toggle("on", k === act);
        });
        if (n[act]) n[act].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && !dd.hidden && act >= 0) {
        e.preventDefault();
        choose(act);
      } else if (e.key === "Escape") dd.hidden = true;
    });
  }
  combo(
    $("ccmi"),
    $("ccmid"),
    function () {
      return DB.filter(function (x) {
        return x[2] <= 9;
      }).map(function (x) {
        return { l: "#" + pad(x[0]) + " " + x[1], d: x[0], g: null };
      });
    },
    function (x) {
      addMon(x.d);
    },
  );
  combo(
    $("ccs"),
    $("ccsd"),
    function () {
      var a = [];
      SETS.forEach(function (g) {
        g[1].forEach(function (n) {
          a.push({ l: n, g: g[0] });
        });
      });
      return a;
    },
    function (x) {
      $("ccs").value = x.l;
    },
  );
  $("ccm").onclick = function (e) {
    var b = e.target.closest("[data-rm]");
    if (!b) return;
    cur.c.m = cur.c.m.filter(function (d) {
      return d !== +b.dataset.rm;
    });
    chips();
  };
  $("ccst").onclick = function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    cur.c.o = b.dataset.s === "own";
    if (cur.c.o && !cur.c.q) cur.c.q = 1;
    stat();
  };
  $("ccqm").onclick = function () {
    cur.c.q = Math.max(1, cur.c.q - 1);
    stat();
  };
  $("ccqp").onclick = function () {
    cur.c.q = Math.min(9999, cur.c.q + 1);
    stat();
  };
  $("ccsv").onclick = function () {
    if (saveEd()) {
      if (!queue.length) toast(t("cc_saved"));
      nextEd();
    }
  };
  $("ccsk").onclick = nextEd;
  $("ccx").onclick = closeEd;
  $("ccd").addEventListener("click", function (e) {
    if (e.target === this) closeEd();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("ccd").classList.contains("open")) closeEd();
  });
  $("ccdel").onclick = function () {
    var b = this;
    if (!b.dataset.a) {
      b.dataset.a = 1;
      b.textContent = t("cc_sure");
      setTimeout(function () {
        if (b.isConnected && b.dataset.a) {
          delete b.dataset.a;
          b.textContent = t("del");
        }
      }, 3000);
      return;
    }
    var id = cur.c.id,
      pr = cur.prev;
    cards = cards.filter(function (x) {
      return x.id !== id;
    });
    delete IMG[id];
    idbW(id, null);
    sCards();
    if (window.bnPurge) window.bnPurge(id);
    sync(pr);
    drawC();
    closeEd();
  };
  $("ccexp").onclick = function () {
    try {
      var o = {
          app: "pokecollect-cards",
          v: 2,
          cards: cards.map(function (c) {
            return Object.assign({}, c, { img: IMG[c.id] || "" });
          }),
        },
        a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: "application/json" }));
      a.download = "kartlarim-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1500);
      toast(t("cc_expd", { n: cards.length }));
    } catch (e) {}
  };
  $("ccimp").onclick = function () {
    $("ccimpf").value = "";
    $("ccimpf").click();
  };
  $("ccimpf").onchange = function () {
    var f = this.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var o = JSON.parse(r.result),
          a = o && o.cards,
          n = 0,
          nm = [];
        if (!Array.isArray(a)) throw 0;
        a.forEach(function (x) {
          if (!x || typeof x.id !== "string" || typeof x.n !== "string") return;
          var c = {
            id: x.id,
            n: x.n,
            m: (Array.isArray(x.m) ? x.m : [])
              .map(Number)
              .filter(function (d) {
                return DBM[d];
              })
              .slice(0, 3),
            s: String(x.s || ""),
            no: String(x.no || ""),
            r: String(x.r || ""),
            v: String(x.v || "Normal"),
            o: x.o !== false,
            q: 0,
            u: typeof x.u === "string" ? x.u : "",
          };
          c.q = c.o ? Math.max(1, Math.min(9999, +x.q || 1)) : 0;
          var i = cards.findIndex(function (y) {
            return y.id === c.id;
          });
          if (i >= 0) nm = nm.concat(mn(cards[i]));
          if (i < 0) cards.push(c);
          else cards[i] = c;
          nm = nm.concat(mn(c));
          if (typeof x.img === "string" && x.img.indexOf("data:image/") === 0) {
            IMG[c.id] = x.img;
            idbW(c.id, x.img);
          }
          n++;
        });
        sCards();
        sync(nm);
        drawC();
        toast(t("cc_impd", { n: n }));
      } catch (e) {
        toast(t("cc_impf"));
      }
    };
    r.readAsText(f);
  };
  function delCards(ids) {
    var pr = [];
    ids.forEach(function (id) {
      var c = cards.find(function (x) {
        return x.id === id;
      });
      if (c) pr = pr.concat(mn(c));
      delete IMG[id];
      idbW(id, null);
      if (window.bnPurge) window.bnPurge(id);
    });
    cards = cards.filter(function (x) {
      return ids.indexOf(x.id) < 0;
    });
    sCards();
    sync(pr);
    sel = {};
    selMode = false;
    drawC();
    toast(t("cc_deld", { n: ids.length }));
  }
  $("ccsel").onclick = function () {
    selMode = !selMode;
    sel = {};
    drawC();
  };
  $("ccball").onclick = function () {
    [].forEach.call($("ccgrid").querySelectorAll(".cc-card"), function (b) {
      sel[b.dataset.id] = 1;
    });
    drawC();
  };
  $("ccbdel").onclick = function () {
    var b = this,
      ids = Object.keys(sel);
    if (!ids.length) return;
    if (!b.dataset.a) {
      b.dataset.a = 1;
      b.textContent = t("cc_sure");
      setTimeout(function () {
        if (b.isConnected && b.dataset.a) {
          delete b.dataset.a;
          b.textContent = t("cc_bdel");
        }
      }, 3000);
      return;
    }
    delete b.dataset.a;
    delCards(ids);
  };
  $("ccwipe").onclick = function () {
    if (cards.length && confirm(t("cc_wipeq", { n: cards.length })))
      delCards(
        cards.map(function (c) {
          return c.id;
        }),
      );
  };
  window.tcgOpen = drawC;
  window.openPokemonTCG = function (name) {
    dpage("tcg");
    view = "all";
    [].forEach.call($("ccfl").children, function (x) {
      x.classList.toggle("on", x.dataset.v === "all");
    });
    $("ccsq").value = name;
    drawC();
  };
  window.TCGX = {
    inv: function () {
      var o = {};
      cards.forEach(function (c) {
        if (c.o && c.q > 0) {
          o[c.id] = {};
          o[c.id][c.v || "Normal"] = c.q;
        }
      });
      return o;
    },
    wanted: function () {
      var o = {};
      cards.forEach(function (c) {
        if (!c.o) o[c.id] = true;
      });
      return o;
    },
    meta: function () {
      var o = {};
      cards.forEach(function (c) {
        o[c.id] = {
          n: c.n,
          no: c.no,
          r: c.r,
          s: c.s,
          i: IMG[c.id] || c.u || "",
          p: c.m.slice(0, 2),
        };
      });
      return o;
    },
    addManual: function (id, m, own) {
      var c = {
        id: id,
        n: m.n,
        m: (m.p || []).map(Number).filter(function (d) {
          return DBM[d];
        }),
        s: m.s || "",
        no: m.no || "",
        r: "",
        v: "Normal",
        q: own ? 1 : 0,
        o: !!own,
      };
      cards.push(c);
      sCards();
      sync(own ? mn(c) : []);
      drawC();
    },
  };
  onLangChange(drawC);
  applyLang();
})();
