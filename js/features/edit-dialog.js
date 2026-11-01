/* Kart düzenle penceresi */
/* Düzenleme penceresi */
var dc, dt;
function fillRows() {
  var ts = +$("es").value,
    h = ts === ed.s ? '<option value="cur">' + t("keep") + "</option>" : "";
  h += '<option value="new">' + t("newrow") + "</option>";
  R[ts].forEach(function (r, i) {
    if (ts === ed.s && i === ed.r) return;
    h += '<option value="' + i + '">' + esc(r.join(" · ")) + "</option>";
  });
  $("er").innerHTML = h;
  $("er").value = ts === ed.s ? "cur" : "new";
}
$("es").addEventListener("change", fillRows);
function em(t) {
  $("emsg").textContent = t;
}
function resetDel() {
  clearTimeout(dt);
  dc = 0;
  $("edel").textContent = t("del");
}
function openEd(s, r, c) {
  ed = { s: s, r: r, c: c };
  var row = R[s][r];
  resetDel();
  em("");
  $("dt").textContent = row[c];
  $("en").value = row[c];
  $("es").value = s;
  fillRows();
  $("ev").value = "";
  $("erow").checked = false;
  $("erl").style.display = row.length > 1 ? "flex" : "none";
  $("dlg").classList.add("open");
}
function closeEd() {
  $("dlg").classList.remove("open");
  ed = null;
  resetDel();
}
$("eclose").addEventListener("click", closeEd);
$("dlg").addEventListener("click", function (e) {
  if (e.target === this) closeEd();
});
$("esave").addEventListener("click", function () {
  var s = ed.s,
    r = ed.r,
    c = ed.c,
    row = R[s][r],
    old = row[c],
    nn = canon(cap($("en").value)),
    ev = canon(cap($("ev").value));
  if (!nn) {
    em(t("noname"));
    return;
  }
  if (nn.length > 200 || ev.length > 200) {
    em(t("timpf"));
    return;
  }
  if (norm(nn) !== norm(old) && has(nn)) {
    em(t("inl", { x: nn }));
    return;
  }
  if (ev && (has(ev) || norm(ev) === norm(nn))) {
    em(t("inl", { x: ev }));
    return;
  }
  if (nn !== old) {
    row[c] = nn;
    if (have[old]) {
      delete have[old];
      have[nn] = true;
    }
  }
  if (ev) row.splice(c + 1, 0, ev);
  var ts = +$("es").value,
    tr = $("er").value,
    target = tr === "new" || tr === "cur" ? null : R[ts][+tr];
  if (ts !== s && $("erow").checked && row.length > 1) {
    R[s].splice(r, 1);
    R[ts].push(row);
  } else if (ts !== s || tr !== "cur") {
    var mv = ev ? [nn, ev] : [nn];
    row.splice(c, mv.length);
    if (target)
      mv.forEach(function (n) {
        putInRow(target, n);
      });
    else R[ts].push(mv);
    if (!row.length) {
      var ix = R[s].indexOf(row);
      if (ix > -1) R[s].splice(ix, 1);
    }
  }
  save();
  closeEd();
  render();
});
$("edel").addEventListener("click", function () {
  if (!dc) {
    dc = 1;
    this.textContent = t("sure");
    dt = setTimeout(resetDel, 3000);
    return;
  }
  var row = R[ed.s][ed.r],
    p = row[ed.c];
  row.splice(ed.c, 1);
  delete have[p];
  if (!row.length) R[ed.s].splice(ed.r, 1);
  save();
  closeEd();
  render();
});
