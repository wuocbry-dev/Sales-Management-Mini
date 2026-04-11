(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("sales-returns-tbody");
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
        return "/api/sales-returns?page=" + p + "&size=50&sort=returnDate,desc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Không có phiếu trả.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">' +
            R.escapeHtml(r.returnCode || "") +
            '</td><td class="py-3 px-4 font-mono">Đơn #' +
            R.escapeHtml(String(r.orderId != null ? r.orderId : "—")) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(smap[r.storeId] || "CH #" + r.storeId) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(R.formatIsoDate(r.returnDate)) +
            '</td><td class="py-3 px-4 text-right">' +
            R.escapeHtml(R.formatVndMoney(r.refundAmount)) +
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
