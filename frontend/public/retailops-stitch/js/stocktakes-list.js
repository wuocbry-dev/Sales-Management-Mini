(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("stocktakes-tbody");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="4" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var stores = await R.fetchAllPages(function (p) {
        return "/api/stores?page=" + p + "&size=100&sort=storeName,asc";
      });
      var smap = {};
      stores.forEach(function (s) {
        smap[s.id] = s.storeName || s.storeCode;
      });
      var rows = await R.fetchAllPages(function (p) {
        return "/api/stocktakes?page=" + p + "&size=50&sort=stocktakeDate,desc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="py-4 px-4 text-slate-500">Không có phiếu kiểm.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">' +
            R.escapeHtml(r.stocktakeCode || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(smap[r.storeId] || "CH #" + r.storeId) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(R.formatIsoDate(r.stocktakeDate)) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(r.status || "—") +
            "</td></tr>"
          );
        })
        .join("");
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
