(function () {
  "use strict";

  function statusVi(s) {
    var u = (s || "").toLowerCase();
    if (u === "active") return '<span class="text-emerald-600 text-xs font-medium">Hoạt động</span>';
    if (u === "inactive") return '<span class="text-slate-500 text-xs">Ngưng</span>';
    return s || "—";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("store-tbody");
    var search = document.getElementById("store-search");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="4" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var rows = await R.fetchAllPages(function (p) {
        return "/api/stores?page=" + p + "&size=100&sort=storeName,asc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="py-4 px-4 text-slate-500">Không có cửa hàng.</td></tr>';
        return;
      }
      function render() {
        tbody.innerHTML = rows
          .map(function (s) {
            var region = s.address || "—";
            return (
              '<tr data-store-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">' +
              R.escapeHtml(s.storeCode || "") +
              '</td><td class="py-3 px-4 font-medium">' +
              R.escapeHtml(s.storeName || "") +
              '</td><td class="py-3 px-4">' +
              R.escapeHtml(region) +
              '</td><td class="py-3 px-4">' +
              statusVi(s.status) +
              "</td></tr>"
            );
          })
          .join("");
        applyFilter();
      }
      function applyFilter() {
        if (!search) return;
        var q = (search.value || "").trim().toLowerCase();
        tbody.querySelectorAll("[data-store-row]").forEach(function (tr) {
          tr.hidden = q !== "" && !tr.textContent.toLowerCase().includes(q);
        });
      }
      render();
      if (search) search.addEventListener("input", applyFilter);
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
