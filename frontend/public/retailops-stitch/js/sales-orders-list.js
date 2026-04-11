(function () {
  "use strict";

  function orderStatusVi(s) {
    if (s === "draft") return "Nháp";
    if (s === "completed") return "Hoàn tất";
    if (s === "cancelled") return "Đã hủy";
    return s || "—";
  }

  function orderStatusClass(s) {
    if (s === "completed") return "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs";
    if (s === "draft") return "px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs";
    return "px-2 py-0.5 rounded-full bg-red-50 text-red-800 text-xs";
  }

  function payVi(s) {
    if (s === "paid") return '<span class="text-emerald-600 font-medium">Đã thanh toán</span>';
    if (s === "unpaid") return '<span class="text-slate-600">Chưa thanh toán</span>';
    return '<span class="text-amber-600">' + s + "</span>";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("sales-orders-tbody");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="7" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var stores = await R.fetchAllPages(function (p) {
        return "/api/stores?page=" + p + "&size=100&sort=storeName,asc";
      });
      var smap = {};
      stores.forEach(function (s) {
        smap[s.id] = s.storeName || s.storeCode || "#" + s.id;
      });
      var orders = await R.fetchAllPages(function (p) {
        return "/api/sales-orders?page=" + p + "&size=50&sort=orderDate,desc";
      });
      if (!orders.length) {
        tbody.innerHTML =
          '<tr><td colspan="7" class="py-4 px-4 text-slate-500">Không có đơn.</td></tr>';
        return;
      }
      tbody.innerHTML = orders
        .map(function (o) {
          var storeName = smap[o.storeId] || "CH #" + o.storeId;
          var cust =
            o.customerId == null ? "Khách lẻ" : "KH #" + o.customerId;
          return (
            '<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">' +
            R.escapeHtml(o.orderCode || "") +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(storeName) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(cust) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(R.formatIsoDate(o.orderDate)) +
            '</td><td class="py-3 px-4">' +
            payVi(o.paymentStatus) +
            '</td><td class="py-3 px-4 text-right">' +
            R.escapeHtml(R.formatVndMoney(o.totalAmount)) +
            '</td><td class="py-3 px-4"><span class="' +
            orderStatusClass(o.status) +
            '">' +
            R.escapeHtml(orderStatusVi(o.status)) +
            "</span></td></tr>"
          );
        })
        .join("");
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
