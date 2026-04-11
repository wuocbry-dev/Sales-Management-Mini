(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("stock-transfers-tbody");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var stores = await R.fetchAllPages(function (p) {
        return "/api/stores?page=" + p + "&size=100&sort=storeName,asc";
      });
      var smap = {};
      stores.forEach(function (s) {
        smap[s.id] = s.storeName || s.storeCode;
      });
      var rows = await R.fetchAllPages(function (p) {
        return "/api/stock-transfers?page=" + p + "&size=50&sort=transferDate,desc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Không có phiếu chuyển.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">' +
            R.escapeHtml(r.transferCode || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(smap[r.fromStoreId] || "#" + r.fromStoreId) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(smap[r.toStoreId] || "#" + r.toStoreId) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(R.formatIsoDate(r.transferDate)) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(r.status || "—") +
            "</td></tr>"
          );
        })
        .join("");
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
