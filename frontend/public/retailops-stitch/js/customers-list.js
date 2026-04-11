(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("customers-tbody");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var rows = await R.fetchAllPages(function (p) {
        return "/api/customers?page=" + p + "&size=100&sort=customerCode,asc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Không có khách hàng.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (c) {
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">' +
            R.escapeHtml(c.customerCode || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(c.fullName || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(c.phone || "—") +
            '</td><td class="py-3 px-4 text-slate-500">' +
            R.escapeHtml(c.email || "—") +
            '</td><td class="py-3 px-4 text-slate-600 max-w-xs truncate">' +
            R.escapeHtml(c.address || "—") +
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
