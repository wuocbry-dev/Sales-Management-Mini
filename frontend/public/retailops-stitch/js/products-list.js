(function () {
  "use strict";
  var input = document.getElementById("product-search");
  var rows = document.querySelectorAll("[data-product-row]");
  if (!input || !rows.length) return;
  function apply() {
    var q = (input.value || "").trim().toLowerCase();
    rows.forEach(function (tr) {
      tr.hidden = q !== "" && !tr.textContent.toLowerCase().includes(q);
    });
  }
  input.addEventListener("input", apply);
})();
