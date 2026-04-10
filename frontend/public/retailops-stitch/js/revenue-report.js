(function () {
  "use strict";
  var btn = document.getElementById("report-refresh");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var n = function (min, max) {
      return Math.floor(min + Math.random() * (max - min));
    };
    var el = function (sel) {
      return document.querySelector('[data-kpi="' + sel + '"]');
    };
    var r = el("revenue");
    var o = el("orders");
    var a = el("aov");
    if (r) r.textContent = n(800, 1500) * 1000000 + " ₫";
    if (o) o.textContent = String(n(2000, 5000));
    if (a) a.textContent = n(300, 500) * 1000 + " ₫";
  });
})();
