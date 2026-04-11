(function () {
  "use strict";

  function localIsoDateTime() {
    var d = new Date();
    function pad(n) {
      return String(n).padStart(2, "0");
    }
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  }

  function priceNum(v) {
    var n = typeof v === "number" ? v : parseFloat(String(v), 10);
    return isNaN(n) ? 0 : n;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var R = window.RetailOpsApi;
    var cartBody = document.getElementById("pos-cart-body");
    var emptyMsg = document.getElementById("pos-empty");
    var totalEl = document.getElementById("pos-total");
    var productList = document.getElementById("pos-product-list");
    var search = document.getElementById("pos-product-search");
    var storeLabel = document.getElementById("pos-store-label");
    var noteEl = document.getElementById("pos-note");
    if (!R || !cartBody || !totalEl) return;

    var storeId = null;

    function formatVnd(n) {
      return (
        Math.round(n)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
      );
    }

    function recalc() {
      var sum = 0;
      cartBody.querySelectorAll("tr[data-cart-line]").forEach(function (tr) {
        var inp = tr.querySelector("[data-qty]");
        var qty = parseInt((inp && inp.value) || "1", 10) || 1;
        var unit = priceNum(tr.getAttribute("data-unit-price"));
        sum += unit * qty;
        var subEl = tr.querySelector("[data-line-total]");
        if (subEl) subEl.textContent = formatVnd(unit * qty);
      });
      totalEl.textContent = formatVnd(sum);
      if (emptyMsg) emptyMsg.hidden = cartBody.children.length > 0;
    }

    function addRow(variantId, name, sku, unitPrice) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-cart-line", "1");
      tr.setAttribute("data-variant-id", String(variantId));
      tr.setAttribute("data-unit-price", String(unitPrice));
      tr.className = "hover:bg-teal-50/40";
      tr.innerHTML =
        '<td class="py-2 px-3"><p class="font-semibold text-slate-800">' +
        R.escapeHtml(name) +
        '</p><p class="text-[10px] text-slate-400">' +
        R.escapeHtml(sku) +
        '</p></td>' +
        '<td class="py-2 px-2 text-center">' +
        '<div class="flex items-center justify-center border border-slate-200 rounded overflow-hidden w-20 mx-auto bg-white">' +
        '<button type="button" data-delta="-1" class="px-1.5 py-0.5 hover:bg-slate-100 text-slate-600">−</button>' +
        '<input data-qty type="text" value="1" class="w-full text-center border-0 text-xs font-bold p-0 focus:ring-0"/>' +
        '<button type="button" data-delta="1" class="px-1.5 py-0.5 hover:bg-slate-100 text-slate-600">+</button>' +
        "</div></td>" +
        '<td class="py-2 px-3 text-right font-semibold" data-line-total>' +
        formatVnd(unitPrice) +
        '</td><td class="py-2 px-2"><button type="button" data-remove class="text-slate-300 hover:text-red-500 material-symbols-outlined text-lg leading-none">close</button></td>';
      cartBody.appendChild(tr);
      recalc();
    }

    try {
      var me = await R.fetchMe();
      storeId = me.defaultStoreId;
      if (storeId == null && me.storeIds && me.storeIds.length) {
        storeId = me.storeIds[0];
      }
      if (storeId == null) {
        if (storeLabel) storeLabel.textContent = "Chưa gán cửa hàng";
        if (productList)
          productList.innerHTML =
            '<p class="text-xs text-red-600 p-2">Tài khoản chưa có defaultStoreId / storeIds — không thể bán.</p>';
        return;
      }
      var st = await R.apiJson("/api/stores/" + encodeURIComponent(storeId), { method: "GET" });
      if (storeLabel) storeLabel.textContent = st.storeName || st.storeCode || "CH #" + storeId;

      var products = await R.fetchAllPages(function (p) {
        return "/api/products?page=" + p + "&size=100&sort=productName,asc";
      });
      if (productList) {
        productList.innerHTML = "";
        products.forEach(function (p) {
          (p.variants || []).forEach(function (v) {
            if ((v.status || "").toLowerCase() !== "active") return;
            var price = priceNum(v.sellingPrice);
            var card = document.createElement("div");
            card.setAttribute("data-pos-product", "1");
            card.className =
              "border border-slate-100 rounded-lg p-2 flex gap-2 hover:border-teal-200 cursor-pointer";
            card.innerHTML =
              '<div class="w-10 h-10 rounded bg-slate-100 shrink-0"></div><div class="flex-1 min-w-0">' +
              '<p class="text-xs font-bold text-slate-800 truncate">' +
              R.escapeHtml(p.productName || "") +
              '</p><p class="text-[10px] text-slate-400">' +
              R.escapeHtml(v.sku || "") +
              " · " +
              R.escapeHtml(formatVnd(price)) +
              '</p><button type="button" data-add-product class="mt-1 text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded">Thêm</button></div>';
            card.querySelector("[data-add-product]").addEventListener("click", function (e) {
              e.stopPropagation();
              addRow(v.id, p.productName || "", v.sku || "", price);
            });
            productList.appendChild(card);
          });
        });
        if (!productList.children.length) {
          productList.innerHTML =
            '<p class="text-xs text-slate-500 p-2">Không có biến thể đang bán.</p>';
        }
      }

      if (search && productList) {
        search.addEventListener("input", function () {
          var q = (search.value || "").trim().toLowerCase();
          productList.querySelectorAll("[data-pos-product]").forEach(function (card) {
            card.hidden = q !== "" && !card.textContent.toLowerCase().includes(q);
          });
        });
      }
    } catch (e) {
      if (productList)
        productList.innerHTML =
          '<p class="text-xs text-red-600 p-2">' + R.escapeHtml(e.message || String(e)) + "</p>";
    }

    var clearBtn = document.getElementById("pos-clear");
    if (clearBtn)
      clearBtn.addEventListener("click", function () {
        cartBody.innerHTML = "";
        recalc();
      });

    cartBody.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-remove]");
      if (rm) {
        var row = rm.closest("tr");
        if (row) row.remove();
        recalc();
        return;
      }
      var d = e.target.closest("[data-delta]");
      if (!d) return;
      var tr = d.closest("tr");
      var inp = tr ? tr.querySelector("[data-qty]") : null;
      if (!inp) return;
      var v =
        (parseInt(inp.value, 10) || 0) + parseInt(d.getAttribute("data-delta"), 10);
      if (v < 1) v = 1;
      inp.value = String(v);
      recalc();
    });

    cartBody.addEventListener("input", function (e) {
      if (e.target.matches("[data-qty]")) recalc();
    });

    var checkout = document.getElementById("pos-checkout");
    if (checkout)
      checkout.addEventListener("click", async function () {
        if (!storeId) {
          alert("Chưa xác định cửa hàng.");
          return;
        }
        if (!cartBody.children.length) {
          alert("Giỏ hàng trống.");
          return;
        }
        var lines = [];
        cartBody.querySelectorAll("tr[data-cart-line]").forEach(function (tr) {
          var vid = tr.getAttribute("data-variant-id");
          var inp = tr.querySelector("[data-qty]");
          var qty = parseInt((inp && inp.value) || "1", 10) || 1;
          var unit = priceNum(tr.getAttribute("data-unit-price"));
          lines.push({
            variantId: Number(vid),
            quantity: qty,
            unitPrice: unit,
            discountAmount: 0,
          });
        });
        var note = noteEl ? noteEl.value.trim() : "";
        try {
          checkout.disabled = true;
          var created = await R.apiJson("/api/sales-orders", {
            method: "POST",
            body: {
              storeId: storeId,
              customerId: null,
              orderDate: localIsoDateTime(),
              headerDiscountAmount: 0,
              note: note || null,
              lines: lines,
            },
          });
          var total = created.totalAmount;
          await R.apiJson("/api/sales-orders/" + created.id + "/confirm", {
            method: "POST",
            body: {
              payments: [
                {
                  paymentType: "in",
                  paymentMethod: "cash",
                  amount: total,
                  referenceNo: null,
                  note: null,
                },
              ],
            },
          });
          alert("Đã tạo đơn " + (created.orderCode || created.id) + " và xác nhận thanh toán.");
          cartBody.innerHTML = "";
          recalc();
        } catch (err) {
          alert(err.message || String(err));
        } finally {
          checkout.disabled = false;
        }
      });
  });
})();
