/* Yedekle / yükle ve klavye kısayolları */
/* Yedekle / Yükle */
$("exp").addEventListener("click", function () {
  try {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(fullBackup())], { type: "application/json" }),
    );
    a.download = "pokemon-cards-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 3000);
    toast(t("texp"));
  } catch (e) {
    toast(t("texpf"));
  }
});
$("imp").addEventListener("click", function () {
  $("impf").click();
});
$("impf").addEventListener("change", function () {
  var f = this.files[0],
    inp = this;
  if (!f) return;
  if (f.size > 2 * 1024 * 1024) {
    toast(t("timpf"));
    inp.value = "";
    return;
  }
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var o = JSON.parse(fr.result);
      if (!validData(o)) throw 0;
      R = o.r;
      have = o.h || {};
      save();
      var rx = restoreX(o.x);
      render();
      toast(t("timp"));
      if (rx)
        setTimeout(function () {
          location.reload();
        }, 900);
    } catch (e) {
      toast(t("timpf"));
    }
    inp.value = "";
  };
  fr.readAsText(f);
});
/* Klavye: Esc ile kapat, Enter ile onayla */
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if ($("dlg").classList.contains("open")) closeEd();
  else if ($("add").classList.contains("open")) $("add").classList.remove("open");
});
$("a1").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    $("a1b").click();
  }
});
[$("en"), $("ev")].forEach(function (i) {
  i.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      $("esave").click();
    }
  });
});
try {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
} catch (e) {}
