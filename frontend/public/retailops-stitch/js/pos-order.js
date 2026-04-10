(function () {
  "use strict";

  function parsePrice(text) {
    var tail = (text || "").split("·")[1] || text || "";
    var digits = tail.replace(/[^\d]/g, "");
    return parseInt(digits, 10) || 0;
  }

  var cartBody = document.getElementById("pos-cart-body");
  var emptyMsg = document.getElementById("pos-empty");
  var totalEl = document.getElementById("pos-total");
  var productList = document.getElementById("pos-product-list");
  var search = document.getElementById("pos-product-search");

  if (!cartBody || !totalEl) return;

  function formatVnd(n) {
    return (
      n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
    );
  }

  function recalc() {
    var sum = 0;
    cartBody.querySelectorAll("tr[data-cart-line]").forEach(function (tr) {
      var inp = tr.querySelector("[data-qty]");
      var qty = parseInt((inp && inp.value) || "1", 10) || 1;
      var unit = parseInt(tr.getAttribute("data-unit-price") || "0", 10);
      sum += unit * qty;
      var subEl = tr.querySelector("[data-line-total]");
      if (subEl) subEl.textContent = formatVnd(unit * qty);
    });
    totalEl.textContent = formatVnd(sum);
    if (emptyMsg) emptyMsg.hidden = cartBody.children.length > 0;
  }

  function addRow(name, sku, unitPrice) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-cart-line", "1");
    tr.setAttribute("data-unit-price", String(unitPrice));
    tr.className = "hover:bg-teal-50/40";
    tr.innerHTML =
      '<td class="py-2 px-3"><p class="font-semibold text-slate-800">' +
      name +
      '</p><p class="text-[10px] text-slate-400">' +
      sku +
      '</p></td>' +
      '<td class="py-2 px-2 text-center">' +
      '<div class="flex items-center justify-center border border-slate-200 rounded overflow-hidden w-20 mx-auto bg-white">' +
      '<button type="button" data-delta="-1" class="px-1.5 py-0.5 hover:bg-slate-100 text-slate-600">−</button>' +
      '<input data-qty type="text" value="1" class="w-full text-center border-0 text-xs font-bold p-0 focus:ring-0"/>' +
      '<button type="button" data-delta="1" class="px-1.5 py-0.5 hover:bg-slate-100 text-slate-600">+</button>' +
      "</div></td>" +
      '<td class="py-2 px-3 text-right font-semibold" data-line-total>' +
      formatVnd(unitPrice) +
      "</td>" +
      '<td class="py-2 px-2"><button type="button" data-remove class="text-slate-300 hover:text-red-500 material-symbols-outlined text-lg leading-none">close</button></td>';
    cartBody.appendChild(tr);
    recalc();
  }

  var clearBtn = document.getElementById("pos-clear");
  if (clearBtn) clearBtn.addEventListener("click", function () {
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
    var v = (parseInt(inp.value, 10) || 0) + parseInt(d.getAttribute("data-delta"), 10);
    if (v < 1) v = 1;
    inp.value = String(v);
    recalc();
  });

  cartBody.addEventListener("input", function (e) {
    if (e.target.matches("[data-qty]")) recalc();
  });

  if (productList) {
    productList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add-product]");
      if (!btn) return;
      var card = btn.closest("[data-pos-product]");
      if (!card) return;
      var ps = card.querySelectorAll("p");
      var title = (ps[0] && ps[0].textContent) ? ps[0].textContent.trim() : "SP";
      var skuLine = (ps[1] && ps[1].textContent) ? ps[1].textContent : "";
      var skuPart = skuLine.split("·")[0];
      var sku = (skuPart && skuPart.trim()) ? skuPart.trim() : "SKU";
      var price = parsePrice(skuLine);
      addRow(title, sku, price || 100000);
    });
  }

  if (search && productList) {
    search.addEventListener("input", function () {
      var q = (search.value || "").trim().toLowerCase();
      productList.querySelectorAll("[data-pos-product]").forEach(function (card) {
        card.hidden = q !== "" && !card.textContent.toLowerCase().includes(q);
      });
    });
  }

  var checkout = document.getElementById("pos-checkout");
  if (checkout) checkout.addEventListener("click", function () {
    if (!cartBody.children.length) {
      alert("Giỏ hàng trống.");
      return;
    }
    alert("Demo: sau này gọi POST /api/sales-orders hoặc flow POS backend.");
  });
})();
