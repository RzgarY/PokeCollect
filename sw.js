/* Çevrimdışı çalışma + güncel kalma.
   Kabuk (html/css/js): önce ağ, HER SEFERİNDE sunucuya sorulur (cache:"no-cache"),
   hosting'in max-age ayarı eski dosyayı sızdıramaz. Ağ yoksa ya da yavaşsa (NET_TIMEOUT)
   önbellekteki kopya kullanılır. Sprite'lar: önce önbellek (değişmezler).
   PokéAPI ve diğer siteler: dokunulmaz.
   Bu dosya yalnızca "caches" ile çalışır; localStorage / IndexedDB'ye (kullanıcı verisi) hiç dokunmaz.
   BUILD ve SHELL_FILES'ı tools/stamp.py yazar (python3 tools/stamp.py). Elle sürüm artırmaya gerek yok. */
/* STAMP:BEGIN (tools/stamp.py bu bloğu yeniden yazar, elle düzenleme) */
var BUILD = "4a3463da";
var SHELL_FILES = [
  "./",
  "index.html",
  "css/fonts.css?v=d283fdd5",
  "css/base.css?v=f3cf6497",
  "css/intro.css?v=4f230405",
  "css/my-cards.css?v=83915691",
  "css/binder-stats.css?v=fea2e04b",
  "js/data/generations.js?v=b97faee9",
  "js/core/utils.js?v=a9563bb4",
  "js/core/storage.js?v=5ab3e324",
  "js/i18n/i18n.js?v=4738e590",
  "js/i18n/strings.js?v=4ad07ccd",
  "js/core/ui.js?v=2add3776",
  "js/data/pokemon-db.js?v=e12bd67e",
  "js/features/checklist.js?v=11631c1b",
  "js/features/add-dialog.js?v=662f04a5",
  "js/features/edit-dialog.js?v=5ef8cbaf",
  "js/features/backup-ui.js?v=c00923b7",
  "js/features/pokedex.js?v=932dbfd3",
  "js/core/router.js?v=2ffa5f34",
  "js/features/my-cards.js?v=4ec70d9e",
  "js/features/binder-stats.js?v=66812e1f",
  "js/core/a11y.js?v=ee048524",
  "js/core/settings.js?v=02c6dbac",
  "js/core/pwa.js?v=535d0d54",
  "assets/fonts/nunito-latin-ext.woff2",
  "assets/fonts/nunito-latin.woff2",
  "assets/fonts/pokemon-solid.woff2",
  "assets/icons/icon-192.png",
  "assets/img/pdx-ib.webp",
  "assets/img/pdx-it.webp",
  "assets/img/pdx-mask.png",
  "manifest.json",
];
/* STAMP:END */
var SHELL = "pk-shell-" + BUILD;
var SPRITES = "pk-sprites-v1";
var NET_TIMEOUT = 4000;

self.addEventListener("install", function (e) {
  /* cache:"reload" = HTTP önbelleğini atla; yeni sürüm eski kopyayla dolmasın.
     Tek dosya hata verse bile kurulum bozulmaz (kabuk zaten ağdan geliyor). */
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      return Promise.all(
        SHELL_FILES.map(function (u) {
          return fetch(new Request(u, { cache: "reload" }))
            .then(function (r) {
              if (r.status === 200) return c.put(u, r);
            })
            .catch(function () {});
        }),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k.indexOf("pk-shell-") === 0 && k !== SHELL;
            })
            .map(function (k) {
              return caches.delete(k);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

function shellFromCache(req) {
  return caches.open(SHELL).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (req.mode === "navigate") return c.match("index.html");
    });
  });
}

function shellRequest(req) {
  var net = fetch(req, { cache: "no-cache" }).then(function (res) {
    if (res.status >= 500) throw new Error("server " + res.status);
    if (res.status === 200 && res.type === "basic") {
      var copy = res.clone();
      caches
        .open(SHELL)
        .then(function (c) {
          return c.put(req, copy);
        })
        .catch(function () {});
    }
    return res;
  });
  return new Promise(function (resolve) {
    var done = false;
    function finish(r) {
      if (!done) {
        done = true;
        resolve(r);
      }
    }
    var timer = setTimeout(function () {
      shellFromCache(req).then(function (hit) {
        if (hit) finish(hit);
      });
    }, NET_TIMEOUT);
    net.then(
      function (res) {
        clearTimeout(timer);
        finish(res);
      },
      function () {
        clearTimeout(timer);
        shellFromCache(req).then(function (hit) {
          finish(hit || Response.error());
        });
      },
    );
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf("/assets/sprites/") !== -1) {
    e.respondWith(
      caches.open(SPRITES).then(function (c) {
        return c.match(req).then(function (hit) {
          return (
            hit ||
            fetch(req).then(function (res) {
              if (res.status === 200) c.put(req, res.clone());
              return res;
            })
          );
        });
      }),
    );
    return;
  }
  e.respondWith(shellRequest(req));
});

/* Sayfa boşta kalınca tüm sprite'ları arka planda indirir (çevrimdışı için) */
self.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "warm-sprites") return;
  e.waitUntil(
    caches.open(SPRITES).then(function (c) {
      var ids = [];
      for (var i = 1; i <= 1025; i++) ids.push(i);
      function next() {
        var batch = ids.splice(0, 20);
        if (!batch.length) return Promise.resolve();
        return Promise.all(
          batch.map(function (id) {
            var u = "assets/sprites/" + id + ".webp";
            return c.match(u).then(function (hit) {
              return hit || c.add(u).catch(function () {});
            });
          }),
        ).then(next);
      }
      return next();
    }),
  );
});
