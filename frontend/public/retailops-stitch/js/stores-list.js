(function () {
  "use strict";
  var input = document.getElementById("store-search");
  var rows = document.querySelectorAll("[data-store-row]");
  if (!input || !rows.length) return;
  input.addEventListener("input", function () {
    var q = (input.value || "").trim().toLowerCase();
    rows.forEach(function (tr) {
      tr.hidden = q !== "" && !tr.textContent.toLowerCase().includes(q);
    });
  });
})();
