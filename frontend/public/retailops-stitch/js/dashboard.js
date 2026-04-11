(function () {
  "use strict";

  function orderStatusVi(s) {
    if (s === "draft") return "Nháp";
    if (s === "completed") return "Hoàn tất";
    if (s === "cancelled") return "Đã hủy";
    return s || "—";
  }

  function orderStatusBadgeClass(s) {
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "draft") return "bg-slate-100 text-slate-700";
    return "bg-red-100 text-red-700";
  }

  function grStatusVi(s) {
    if (s === "completed") return "Hoàn tất";
    if (s === "draft") return "Nháp";
    if (s === "cancelled") return "Đã hủy";
    return s || "—";
  }

  function grBadgeClass(s) {
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "draft") return "bg-orange-100 text-orange-700";
    return "bg-slate-100 text-slate-700";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var R = window.RetailOpsApi;
    if (!R) return;

    function el(id) {
      return document.getElementById(id);
    }

    try {
      var kpis = await R.apiJson("/api/dashboard/kpis", { method: "GET" });
      if (el("dash-kpi-revenue"))
        el("dash-kpi-revenue").textContent = R.formatVndDigits(kpis.completedRevenueTotal);
      if (el("dash-kpi-orders-total"))
        el("dash-kpi-orders-total").textContent = String(kpis.orderTotalCount);
      if (el("dash-kpi-profit")) el("dash-kpi-profit").textContent = "Chưa có API";
      if (el("dash-kpi-customers"))
        el("dash-kpi-customers").textContent = String(kpis.customerCount);
      if (el("dash-kpi-variants"))
        el("dash-kpi-variants").textContent = String(kpis.variantCount);
      if (el("dash-kpi-lowstock"))
        el("dash-kpi-lowstock").textContent = String(kpis.lowStockCount);
      var badge = el("dash-low-stock-badge");
      if (badge) badge.textContent = String(kpis.lowStockCount) + " dòng";
    } catch (e) {
      if (el("dash-kpi-revenue"))
        el("dash-kpi-revenue").textContent = "—";
    }

    try {
      var rep = await R.apiJson("/api/reports/summary", { method: "GET" });
      var box = el("dash-store-revenue");
      if (box && rep.revenueByStore && rep.revenueByStore.length) {
        var list = rep.revenueByStore;
        var max = 0;
        list.forEach(function (r) {
          var v = parseFloat(String(r.revenueTotal).replace(/\D/g, ""), 10) || 0;
          if (v > max) max = v;
        });
        var shades = ["bg-teal-600", "bg-teal-500", "bg-teal-400", "bg-teal-300"];
        box.innerHTML = list
          .map(function (r, i) {
            var v = parseFloat(String(r.revenueTotal).replace(/\D/g, ""), 10) || 0;
            var pct = max > 0 ? Math.max(8, Math.round((100 * v) / max)) : 0;
            var sh = shades[Math.min(i, shades.length - 1)];
            return (
              '<div class="space-y-2"><div class="flex justify-between text-sm"><span class="font-medium text-slate-700">' +
              R.escapeHtml(r.storeName || "CH #" + r.storeId) +
              '</span><span class="font-bold text-slate-900">' +
              R.escapeHtml(R.formatVndDigits(r.revenueTotal)) +
              '</span></div><div class="w-full bg-slate-100 rounded-full h-2"><div class="' +
              sh +
              " h-2 rounded-full\" style=\"width:" +
              pct +
              '%"></div></div></div>'
            );
          })
          .join("");
      } else if (box) {
        box.innerHTML =
          '<p class="text-slate-500">Chưa có doanh thu hoàn tất theo cửa hàng.</p>';
      }
    } catch (e2) {
      var box2 = el("dash-store-revenue");
      if (box2)
        box2.innerHTML =
          '<p class="text-slate-500">Không tải được báo cáo (cần quyền REPORT_VIEW).</p>';
    }

    var hot = el("dash-hot-tbody");
    if (hot) {
      hot.innerHTML =
        '<tr><td colspan="4" class="px-6 py-4 text-slate-500">Chưa có API thống kê bán chạy theo SKU.</td></tr>';
    }

    try {
      var ordData = await R.apiJson(
        "/api/sales-orders?page=0&size=5&sort=orderDate,desc",
        { method: "GET" }
      );
      var ot = el("dash-recent-orders-tbody");
      if (ot) {
        var orows = ordData.content || [];
        if (!orows.length) {
          ot.innerHTML =
            '<tr><td colspan="4" class="px-6 py-3 text-slate-500">Không có đơn.</td></tr>';
        } else {
          ot.innerHTML = orows
            .map(function (o) {
              var cust =
                o.customerId == null ? "Khách lẻ" : "KH #" + o.customerId;
              var st = orderStatusVi(o.status);
              var bc = orderStatusBadgeClass(o.status);
              return (
                '<tr class="hover:bg-slate-50 transition-colors"><td class="px-6 py-3 font-mono font-medium">' +
                R.escapeHtml(o.orderCode || "") +
                '</td><td class="px-6 py-3 font-medium">' +
                R.escapeHtml(cust) +
                '</td><td class="px-6 py-3 font-bold">' +
                R.escapeHtml(R.formatVndMoney(o.totalAmount)) +
                '</td><td class="px-6 py-3"><span class="px-2 py-1 ' +
                bc +
                ' text-[10px] font-bold rounded uppercase">' +
                R.escapeHtml(st) +
                "</span></td></tr>"
              );
            })
            .join("");
        }
      }
    } catch (e3) {
      var ot2 = el("dash-recent-orders-tbody");
      if (ot2)
        ot2.innerHTML =
          '<tr><td colspan="4" class="px-6 py-3 text-red-600">Không tải được đơn.</td></tr>';
    }

    try {
      var grData = await R.apiJson(
        "/api/goods-receipts?page=0&size=5&sort=receiptDate,desc",
        { method: "GET" }
      );
      var gt = el("dash-recent-gr-tbody");
      if (gt) {
        var grows = grData.content || [];
        if (!grows.length) {
          gt.innerHTML =
            '<tr><td colspan="4" class="px-6 py-3 text-slate-500">Không có phiếu nhập.</td></tr>';
        } else {
          gt.innerHTML = grows
            .map(function (r) {
              var sup = r.supplierId != null ? "NCC #" + r.supplierId : "—";
              var st = grStatusVi(r.status);
              var bc = grBadgeClass(r.status);
              return (
                '<tr class="hover:bg-slate-50 transition-colors"><td class="px-6 py-3 font-mono font-medium">' +
                R.escapeHtml(r.receiptCode || "") +
                '</td><td class="px-6 py-3 font-medium">' +
                R.escapeHtml(sup) +
                '</td><td class="px-6 py-3 font-bold">' +
                R.escapeHtml(R.formatVndMoney(r.totalAmount)) +
                '</td><td class="px-6 py-3"><span class="px-2 py-1 ' +
                bc +
                ' text-[10px] font-bold rounded uppercase">' +
                R.escapeHtml(st) +
                "</span></td></tr>"
              );
            })
            .join("");
        }
      }
    } catch (e4) {
      var gt2 = el("dash-recent-gr-tbody");
      if (gt2)
        gt2.innerHTML =
          '<tr><td colspan="4" class="px-6 py-3 text-red-600">Không tải được phiếu nhập.</td></tr>';
    }
  });
})();
