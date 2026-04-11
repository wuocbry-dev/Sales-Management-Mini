(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("goods-receipts-tbody");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    function stVi(s) {
      if (s === "completed")
        return '<span class="text-emerald-600 text-xs font-semibold">Hoàn tất</span>';
      if (s === "draft")
        return '<span class="text-slate-600 text-xs font-semibold">Nháp</span>';
      if (s === "cancelled")
        return '<span class="text-red-600 text-xs font-semibold">Đã hủy</span>';
      return R.escapeHtml(s || "—");
    }
    tbody.innerHTML =
      '<tr><td colspan="6" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var stores = await R.fetchAllPages(function (p) {
        return "/api/stores?page=" + p + "&size=100&sort=storeName,asc";
      });
      var smap = {};
      stores.forEach(function (s) {
        smap[s.id] = s.storeName || s.storeCode;
      });
      var rows = await R.fetchAllPages(function (p) {
        return "/api/goods-receipts?page=" + p + "&size=50&sort=receiptDate,desc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="py-4 px-4 text-slate-500">Không có phiếu nhập.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          var sup =
            r.supplierId != null ? "NCC #" + r.supplierId : "—";
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">' +
            R.escapeHtml(r.receiptCode || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(smap[r.storeId] || "CH #" + r.storeId) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(sup) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(R.formatIsoDate(r.receiptDate)) +
            '</td><td class="py-3 px-4">' +
            stVi(r.status) +
            '</td><td class="py-3 px-4 text-right">' +
            R.escapeHtml(R.formatVndMoney(r.totalAmount)) +
            "</td></tr>"
          );
        })
        .join("");
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
