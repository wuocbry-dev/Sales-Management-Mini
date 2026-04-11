(function () {
  "use strict";

  function variantStatusVi(s) {
    var u = (s || "").toLowerCase();
    if (u === "active") return '<span class="text-emerald-600 text-xs font-medium">Đang bán</span>';
    if (u === "inactive") return '<span class="text-slate-500 text-xs">Ngừng</span>';
    return s || "—";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var tbody = document.getElementById("product-tbody");
    var input = document.getElementById("product-search");
    if (!tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;
    tbody.innerHTML =
      '<tr><td colspan="6" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
    try {
      var cats = await R.fetchAllPages(function (p) {
        return "/api/categories?page=" + p + "&size=200&sort=categoryName,asc";
      });
      var cmap = {};
      cats.forEach(function (c) {
        cmap[c.id] = c.categoryName || c.categoryCode || "#" + c.id;
      });
      var products = await R.fetchAllPages(function (p) {
        return "/api/products?page=" + p + "&size=100&sort=productName,asc";
      });
      var rowsHtml = [];
      products.forEach(function (p) {
        var catLabel =
          p.categoryId != null ? cmap[p.categoryId] || "#" + p.categoryId : "—";
        (p.variants || []).forEach(function (v) {
          rowsHtml.push(
            '<tr data-product-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">' +
              R.escapeHtml(v.sku || "") +
              '</td><td class="py-3 px-4 font-medium">' +
              R.escapeHtml(p.productName || "") +
              '</td><td class="py-3 px-4">' +
              R.escapeHtml(catLabel) +
              '</td><td class="py-3 px-4 text-right">' +
              R.escapeHtml(R.formatVndMoney(v.sellingPrice)) +
              '</td><td class="py-3 px-4 text-right">' +
              R.escapeHtml(String(v.reorderLevel != null ? v.reorderLevel : "—")) +
              '</td><td class="py-3 px-4">' +
              variantStatusVi(v.status) +
              "</td></tr>"
          );
        });
      });
      if (!rowsHtml.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="py-4 px-4 text-slate-500">Không có biến thể / sản phẩm.</td></tr>';
      } else {
        tbody.innerHTML = rowsHtml.join("");
      }
      if (input) {
        input.addEventListener("input", function () {
          var q = (input.value || "").trim().toLowerCase();
          tbody.querySelectorAll("[data-product-row]").forEach(function (tr) {
            tr.hidden = q !== "" && !tr.textContent.toLowerCase().includes(q);
          });
        });
      }
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
