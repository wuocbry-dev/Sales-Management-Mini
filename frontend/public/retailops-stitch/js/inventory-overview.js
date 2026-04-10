(function () {
  "use strict";
  var store = document.getElementById("inv-store");
  var search = document.getElementById("inv-search");
  var rows = document.querySelectorAll("[data-inv-row]");
  if (!rows.length) return;
  function apply() {
    var sid = store && store.value ? store.value : "";
    var q = (search && search.value ? search.value : "").trim().toLowerCase();
    rows.forEach(function (tr) {
      var matchStore = !sid || tr.getAttribute("data-store") === sid;
      var matchText = !q || tr.textContent.toLowerCase().includes(q);
      tr.hidden = !(matchStore && matchText);
    });
  }
  if (store) store.addEventListener("change", apply);
  if (search) search.addEventListener("input", apply);
})();
