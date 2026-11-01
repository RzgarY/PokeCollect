/* Pokédex sayfası ve Pokémon detay penceresi */
/* ===== Pokédex sayfası ===== */
DB.sort(function (a, b) {
  return a[0] - b[0];
});
var TYPES = {
    en: "Normal,Fire,Water,Electric,Grass,Ice,Fighting,Poison,Ground,Flying,Psychic,Bug,Rock,Ghost,Dragon,Dark,Steel,Fairy".split(
      ",",
    ),
    tr: "Normal,Ateş,Su,Elektrik,Çim,Buz,Dövüş,Zehir,Yer,Uçan,Psişik,Böcek,Kaya,Hayalet,Ejderha,Karanlık,Çelik,Peri".split(
      ",",
    ),
  },
  TC =
    "#a8a77a,#ee8130,#6390f0,#f7d02c,#7ac74c,#96d9d6,#c22e28,#a33ea1,#e2bf65,#a98ff3,#f95587,#a6b91a,#b6a136,#735797,#6f35fc,#705746,#b7b7ce,#d685ad".split(
      ",",
    ),
  dg = 0,
  dqv = "",
  dxid = 0;
/* PXDATA: id -> {t:[tip indeksleri],s:[hp,atk,def,spa,spd,spe],h:dm,w:hg,a:"Ab1|Ab2",d:"açıklama"} */
var PX = {};
var dobs = new IntersectionObserver(
  function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.src = SPR[e.target.dataset.id];
        dobs.unobserve(e.target);
      }
    });
  },
  { rootMargin: "400px" },
);
function pad(n) {
  return String(n).padStart(4, "0");
}
function buildDgch() {
  $("dgch").innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map(function (g, i) {
      return (
        '<button data-g="' +
        i +
        '"' +
        (i === dg ? ' class="on"' : "") +
        ">" +
        (i ? "Gen " + g : t("all")) +
        "</button>"
      );
    })
    .join("");
}
function drawDex() {
  var inl = inList(),
    h = "",
    num = dqv.replace(/^#?0*/, "");
  DB.forEach(function (x) {
    if (dg && x[2] !== dg) return;
    if (dqv && norm(x[1]).indexOf(dqv) < 0 && String(x[0]) !== num) return;
    h +=
      '<button class="dc' +
      (inl[norm(x[1])] ? " lst" : "") +
      (have[x[1]] ? " own" : "") +
      '" data-id="' +
      x[0] +
      '"><img data-id="' +
      x[0] +
      '" alt="" draggable="false"><small>#' +
      pad(x[0]) +
      "</small><b>" +
      esc(x[1]) +
      "</b></button>";
  });
  var g = $("dgrid");
  g.innerHTML = h || '<div class="empty" style="grid-column:1/-1">' + t("nores2") + "</div>";
  [].forEach.call(g.querySelectorAll("img"), function (im) {
    dobs.observe(im);
  });
}
var PXREQ = {};
function loadPX(id) {
  if (PX[id]) return Promise.resolve(PX[id]);
  if (PXREQ[id]) return PXREQ[id];
  PXREQ[id] = Promise.all([
    fetch("https://pokeapi.co/api/v2/pokemon/" + id + "/").then(function (r) {
      if (!r.ok) throw Error("Pokémon verisi alınamadı");
      return r.json();
    }),
    fetch("https://pokeapi.co/api/v2/pokemon-species/" + id + "/").then(function (r) {
      if (!r.ok) throw Error("Açıklama alınamadı");
      return r.json();
    }),
  ])
    .then(function (z) {
      var p = z[0],
        sp = z[1],
        desc = "";
      if (
        !p ||
        !Array.isArray(p.types) ||
        !Array.isArray(p.stats) ||
        !Array.isArray(p.abilities) ||
        !sp
      )
        throw Error("Invalid Pokémon response");
      if (sp.flavor_text_entries) {
        var en = sp.flavor_text_entries.find(function (e) {
          return e.language && e.language.name === "en";
        });
        if (en)
          desc = en.flavor_text
            .replace(/[\n\f\r]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
      }
      PX[id] = {
        t: p.types
          .slice()
          .sort(function (a, b) {
            return a.slot - b.slot;
          })
          .map(function (x) {
            return [
              "normal",
              "fire",
              "water",
              "electric",
              "grass",
              "ice",
              "fighting",
              "poison",
              "ground",
              "flying",
              "psychic",
              "bug",
              "rock",
              "ghost",
              "dragon",
              "dark",
              "steel",
              "fairy",
            ].indexOf(x.type.name);
          })
          .filter(function (x) {
            return x >= 0;
          }),
        s: ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map(
          function (n) {
            var x = p.stats.find(function (v) {
              return v.stat.name === n;
            });
            return x ? x.base_stat : 0;
          },
        ),
        h: p.height,
        w: p.weight,
        a: p.abilities
          .map(function (x) {
            return (
              x.ability.name
                .split("-")
                .map(function (w) {
                  return w.charAt(0).toUpperCase() + w.slice(1);
                })
                .join(" ") + (x.is_hidden ? " (Hidden)" : "")
            );
          })
          .join("|"),
        d: desc,
      };
      try {
        localStorage.setItem("pokemon-px-" + id, JSON.stringify(PX[id]));
      } catch (e) {}
      return PX[id];
    })
    .catch(function (e) {
      PXREQ[id] = null;
      throw e;
    });
  return PXREQ[id];
}
try {
  DB.forEach(function (x) {
    var v = localStorage.getItem("pokemon-px-" + x[0]);
    if (v) {
      var c = JSON.parse(v);
      if (
        c &&
        Array.isArray(c.t) &&
        Array.isArray(c.s) &&
        c.s.length === 6 &&
        typeof c.h === "number" &&
        typeof c.w === "number" &&
        typeof c.a === "string" &&
        typeof c.d === "string"
      )
        PX[x[0]] = c;
      else localStorage.removeItem("pokemon-px-" + x[0]);
    }
  });
} catch (e) {}
function openDx(id) {
  var x = DBM[id],
    p = PX[id],
    inn = inList()[norm(x[1])],
    fm = fam(id),
    h =
      '<img class="dxs" alt="" src="' +
      SPR[id] +
      '"><p class="hint" style="text-align:center">' +
      T[x[2] - 1] +
      "</p>";
  if (p) {
    h +=
      '<div class="chips">' +
      (p.t || [])
        .map(function (i) {
          return '<span class="chip" style="--c:' + TC[i] + '">' + TYPES[lang][i] + "</span>";
        })
        .join("") +
      "</div>";
    if (p.d) h += "<p>" + esc(p.d) + "</p>";
    if (p.h)
      h +=
        '<p class="hint">' +
        t("ht") +
        ": " +
        p.h / 10 +
        " m · " +
        t("wt") +
        ": " +
        p.w / 10 +
        " kg</p>";
    if (p.a) h += '<p class="hint">' + t("ab") + ": " + esc(p.a.split("|").join(", ")) + "</p>";
    if (p.s)
      h += p.s
        .map(function (v, i) {
          return (
            '<div class="sbar"><span>' +
            t("st" + i) +
            "</span><span>" +
            v +
            '</span><span><i style="width:' +
            Math.min(100, v / 2.55) +
            '%"></i></span></div>'
          );
        })
        .join("");
  } else {
    h += '<p class="hint" style="text-align:center">' + t("dxload") + "</p>";
    loadPX(id)
      .then(function () {
        if (dxid === id && $("dxd").classList.contains("open")) openDx(id);
      })
      .catch(function () {
        if (dxid === id && $("dxd").classList.contains("open")) {
          $("dxb").insertAdjacentHTML(
            "afterbegin",
            '<p class="hint" style="text-align:center">' + t("dxfail") + "</p>",
          );
        }
      });
  }
  h +=
    '<button class="b pri" style="width:100%;margin:10px 0" data-openpokemon="' +
    esc(DBM[id][1]) +
    '" type="button">' +
    t("dxcards", { n: esc(DBM[id][1]) }) +
    "</button>";
  if (fm.length > 1)
    h +=
      "<label>" +
      t("evo") +
      '</label><div class="evo">' +
      fm
        .map(function (f) {
          return (
            '<button data-id="' +
            f +
            '"' +
            (f === id ? ' class="cur"' : "") +
            '><img alt="" src="' +
            SPR[f] +
            '">' +
            esc(DBM[f][1]) +
            "</button>"
          );
        })
        .join("") +
      "</div>";
  h +=
    '<div class="bt"><button class="b pri" id="dxa">' +
    t(inn ? (have[x[1]] ? "unown" : "own") : "addcol") +
    "</button></div>";
  dxid = id;
  $("dxn").textContent = x[1] + " · #" + pad(id);
  $("dxb").innerHTML = h;
  $("dxd").classList.add("open");
}
$("dgrid").addEventListener("click", function (e) {
  var b = e.target.closest(".dc");
  if (b) openDx(+b.dataset.id);
});
$("dxb").addEventListener("click", function (e) {
  var pb = e.target.closest("[data-openpokemon]");
  if (pb) {
    window.openPokemonTCG(pb.dataset.openpokemon);
    return;
  }
  var b = e.target.closest("button");
  if (!b) return;
  if (b.id === "dxa") {
    var n = DBM[dxid][1];
    if (!has(n)) {
      var f = findRow(dxid);
      if (f) putInRow(f.row, n);
      else R[NS].push([n]);
      toast(t("tadded"));
    } else if (have[n]) delete have[n];
    else have[n] = true;
    save();
    render();
    drawDex();
    openDx(dxid);
  } else if (b.dataset.id) openDx(+b.dataset.id);
});
$("dxx").addEventListener("click", function () {
  $("dxd").classList.remove("open");
});
$("dxd").addEventListener("click", function (e) {
  if (e.target === this) this.classList.remove("open");
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") $("dxd").classList.remove("open");
});
$("dq").addEventListener(
  "input",
  debounce(function (e) {
    dqv = norm(e.target.value);
    drawDex();
  }, 150),
);
$("dgch").addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  dg = +b.dataset.g;
  buildDgch();
  drawDex();
});
