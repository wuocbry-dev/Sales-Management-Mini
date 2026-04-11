(function () {
  "use strict";

  async function load(R) {
    var data = await R.apiJson("/api/reports/summary", { method: "GET" });
    var rev = document.querySelector('[data-kpi="revenue"]');
    var ord = document.querySelector('[data-kpi="orders"]');
    var aov = document.querySelector('[data-kpi="aov"]');
    var ret = document.querySelector('[data-kpi="return"]');
    if (rev) rev.textContent = R.formatVndDigits(data.completedRevenueTotal);
    if (ord) ord.textContent = String(data.completedOrderCount != null ? data.completedOrderCount : "—");
    if (aov) aov.textContent = R.formatVndDigits(data.averageOrderValue);
    if (ret) ret.textContent = (data.returnRatePercent != null ? data.returnRatePercent : "—") + "%";

    var bt = document.getElementById("report-by-store-tbody");
    if (!bt) return;
    var list = data.revenueByStore || [];
    if (!list.length) {
      bt.innerHTML =
        '<tr><td colspan="3" class="py-3 px-4 text-slate-500">Chưa có doanh thu theo cửa hàng.</td></tr>';
      return;
    }
    bt.innerHTML = list
      .map(function (r) {
        return (
          '<tr><td class="py-3 px-4">' +
          R.escapeHtml(r.storeName || "CH #" + r.storeId) +
          '</td><td class="py-3 px-4 text-right">' +
          R.escapeHtml(R.formatVndDigits(r.revenueTotal)) +
          '</td><td class="py-3 px-4 text-right">' +
          R.escapeHtml(String(r.orderCount != null ? r.orderCount : "—")) +
          "</td></tr>"
        );
      })
      .join("");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    try {
      await load(R);
    } catch (e) {
      var bt = document.getElementById("report-by-store-tbody");
      if (bt)
        bt.innerHTML =
          '<tr><td colspan="3" class="py-3 px-4 text-red-600">' +
          R.escapeHtml(e.message || String(e)) +
          "</td></tr>";
    }
    var btn = document.getElementById("report-refresh");
    if (btn)
      btn.addEventListener("click", async function () {
        try {
          await load(R);
        } catch (e2) {
          alert(e2.message || String(e2));
        }
      });
  });
})();
