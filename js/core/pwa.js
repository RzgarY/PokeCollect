/* PWA: service worker kaydı, güncelleme denetimi ve sprite'ları arka planda önbelleğe alma.
   Güncelleme yalnızca "caches" katmanını etkiler; localStorage / IndexedDB'deki kullanıcı verisine dokunmaz. */
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  (function () {
    var sw = navigator.serviceWorker,
      hadController = !!sw.controller,
      shown = false,
      lastCheck = Date.now();

    /* Yeni sürüm hazır: kullanıcıyı yarıda kesmeden küçük bir bildirim göster */
    function showUpdate() {
      if (shown) return;
      shown = true;
      var bar = document.createElement("div");
      bar.className = "upd";
      bar.setAttribute("role", "status");
      var msg = document.createElement("span");
      msg.textContent = t("upd_new");
      var go = document.createElement("button");
      go.type = "button";
      go.textContent = t("upd_go");
      go.addEventListener("click", function () {
        location.reload();
      });
      var x = document.createElement("button");
      x.type = "button";
      x.textContent = "✕";
      x.setAttribute("aria-label", t("close"));
      x.addEventListener("click", function () {
        bar.remove();
      });
      bar.append(msg, go, x);
      document.body.appendChild(bar);
    }

    /* İlk kurulumda (denetleyici yokken) bildirim çıkmaz; sonraki sürümlerde çıkar */
    sw.addEventListener("controllerchange", function () {
      if (!hadController) {
        hadController = true;
        return;
      }
      showUpdate();
    });

    addEventListener("load", function () {
      sw.register("sw.js", { updateViaCache: "none" })
        .then(function () {
          return sw.ready;
        })
        .then(function (reg) {
          /* Açık kalan sekme / ana ekran uygulaması için: öne gelince ve saatte bir sürüm denetle */
          function check() {
            lastCheck = Date.now();
            reg.update().catch(function () {});
          }
          document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible" && Date.now() - lastCheck > 5 * 60 * 1000)
              check();
          });
          setInterval(check, 60 * 60 * 1000);

          var c = navigator.connection;
          if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return;
          (window.requestIdleCallback || setTimeout)(function () {
            if (reg.active) reg.active.postMessage({ type: "warm-sprites" });
          }, 5000);
        })
        .catch(function () {});
    });
  })();
}
