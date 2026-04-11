(function () {
  "use strict";

  function num(v) {
    var n = typeof v === "number" ? v : parseFloat(String(v), 10);
    return isNaN(n) ? 0 : n;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var sel = document.getElementById("inv-store");
    var tbody = document.getElementById("inv-tbody");
    var search = document.getElementById("inv-search");
    var kRows = document.getElementById("inv-kpi-rows");
    var kQty = document.getElementById("inv-kpi-qty");
    var kRes = document.getElementById("inv-kpi-reserved");
    var kLow = document.getElementById("inv-kpi-low");
    if (!sel || !tbody || !window.RetailOpsApi) return;
    var R = window.RetailOpsApi;

    var variantMeta = {};

    async function loadVariantMap() {
      var products = await R.fetchAllPages(function (p) {
        return "/api/products?page=" + p + "&size=100&sort=id,asc";
      });
      variantMeta = {};
      products.forEach(function (p) {
        (p.variants || []).forEach(function (v) {
          variantMeta[v.id] = {
            sku: v.sku || "",
            name: p.productName || "",
            reorder: num(v.reorderLevel),
          };
        });
      });
    }

    function renderRows(invRows, storeName) {
      var totalQty = 0;
      var totalRes = 0;
      var low = 0;
      invRows.forEach(function (row) {
        totalQty += num(row.quantityOnHand);
        totalRes += num(row.reservedQty);
        var m = variantMeta[row.variantId] || { sku: "#" + row.variantId, name: "", reorder: 0 };
        if (num(row.quantityOnHand) < m.reorder) low += 1;
      });
      if (kRows) kRows.textContent = String(invRows.length);
      if (kQty) kQty.textContent = String(Math.round(totalQty));
      if (kRes) kRes.textContent = String(Math.round(totalRes));
      if (kLow) kLow.textContent = String(low);

      if (!invRows.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Không có dòng tồn cho cửa hàng này.</td></tr>';
        return;
      }
      tbody.innerHTML = invRows
        .map(function (row) {
          var m = variantMeta[row.variantId] || { sku: "#" + row.variantId, name: "", reorder: 0 };
          var lowCls =
            num(row.quantityOnHand) < m.reorder ? " font-semibold text-amber-600" : " font-semibold";
          return (
            '<tr data-inv-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">' +
            R.escapeHtml(m.sku) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(m.name) +
            '</td><td class="py-3 px-4">' +
            R.escapeHtml(storeName) +
            '</td><td class="py-3 px-4 text-right' +
            lowCls +
            '">' +
            R.escapeHtml(String(Math.round(num(row.quantityOnHand)))) +
            '</td><td class="py-3 px-4 text-right text-slate-500">' +
            R.escapeHtml(String(Math.round(num(row.reservedQty)))) +
            "</td></tr>"
          );
        })
        .join("");

      function applySearch() {
        if (!search) return;
        var q = (search.value || "").trim().toLowerCase();
        tbody.querySelectorAll("[data-inv-row]").forEach(function (tr) {
          tr.hidden = q !== "" && !tr.textContent.toLowerCase().includes(q);
        });
      }
      if (search) {
        search.oninput = applySearch;
        applySearch();
      }
    }

    try {
      await loadVariantMap();
      var stores = await R.fetchAllPages(function (p) {
        return "/api/stores?page=" + p + "&size=100&sort=storeName,asc";
      });
      sel.innerHTML = "";
      if (!stores.length) {
        sel.innerHTML = '<option value="">Không có cửa hàng</option>';
        tbody.innerHTML =
          '<tr><td colspan="5" class="py-4 px-4 text-red-600">Không có cửa hàng để xem tồn.</td></tr>';
        return;
      }
      stores.forEach(function (s) {
        var o = document.createElement("option");
        o.value = String(s.id);
        o.textContent = s.storeName || s.storeCode || "#" + s.id;
        sel.appendChild(o);
      });

      async function loadStore(storeId) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="py-4 px-4 text-slate-500">Đang tải…</td></tr>';
        var st = stores.find(function (s) {
          return String(s.id) === String(storeId);
        });
        var storeName = (st && (st.storeName || st.storeCode)) || "";
        var inv = await R.fetchAllPages(function (p) {
          return (
            "/api/inventories?storeId=" +
            encodeURIComponent(storeId) +
            "&page=" +
            p +
            "&size=100&sort=variantId,asc"
          );
        });
        renderRows(inv, storeName);
      }

      sel.addEventListener("change", function () {
        if (!sel.value) return;
        loadStore(sel.value);
      });

      await loadStore(sel.value || String(stores[0].id));
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="py-4 px-4 text-red-600">' +
        R.escapeHtml(e.message || String(e)) +
        "</td></tr>";
    }
  });
})();
