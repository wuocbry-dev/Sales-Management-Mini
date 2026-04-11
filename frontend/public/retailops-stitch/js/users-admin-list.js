(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("users-tbody");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="4" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var rows = await R.fetchAllPages(function (p) {
        return "/api/users?page=" + p + "&size=100&sort=username,asc";
      });
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="py-4 px-4 text-slate-500">Không có người dùng.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (u) {
          var st = (u.status || "").toUpperCase();
          var cls =
            st === "ACTIVE"
              ? "text-emerald-600 text-xs font-medium"
              : "text-slate-600 text-xs font-medium";
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">' +
            R.escapeHtml(u.username || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(u.fullName || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(u.email || "") +
            '</td><td class="py-3 px-4"><span class="' +
            cls +
            '">' +
            R.escapeHtml(st || "—") +
            "</span></td></tr>"
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
