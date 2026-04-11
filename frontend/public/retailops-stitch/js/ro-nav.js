/**
 * Thống nhất sidebar ERP (cùng thứ tự / nhãn / href với gen-erp-list-pages.mjs).
 * - Nếu <aside><nav> còn placeholder (#) hoặc chỉ có hàng div — thay toàn bộ nội dung nav.
 * - Bỏ qua: aside hoặc nav có data-ro-nav-skip="1" (vd. trang demo menu riêng).
 * - Rail POS w-20 (div) vẫn gắn click theo mapping cũ nếu còn.
 */
(function () {
  function norm(s) {
    return String(s || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  /** Khớp tools/gen-erp-list-pages.mjs — đổi cả hai chỗ nếu sửa menu. */
  var NAV_ROWS = [
    ["dashboard.html", "dashboard", "Điều hành", "dashboard"],
    ["products-list.html", "products", "Sản phẩm", "inventory_2"],
    ["inventory-overview.html", "inventory", "Tồn kho", "warehouse"],
    ["goods-receipts-list.html", "receipts", "Phiếu nhập", "input"],
    ["sales-orders-list.html", "orders", "Đơn bán", "receipt_long"],
    ["pos-order.html", "pos", "POS", "point_of_sale"],
    ["customers-list.html", "customers", "Khách hàng", "group"],
    ["stock-transfers-list.html", "transfers", "Chuyển kho", "swap_horiz"],
    ["stocktakes-list.html", "stocktakes", "Kiểm kho", "fact_check"],
    ["sales-returns-list.html", "returns", "Trả hàng", "assignment_return"],
    ["revenue-report.html", "reports", "Báo cáo", "analytics"],
    ["stores-list.html", "stores", "Cửa hàng", "storefront"],
    ["users-admin.html", "users", "Người dùng", "manage_accounts"],
    ["rbac-matrix.html", "rbac", "Phân quyền", "admin_panel_settings"],
  ];

  var FILE_TO_KEY = {};
  NAV_ROWS.forEach(function (r) {
    FILE_TO_KEY[r[0]] = r[1];
  });

  /** Trang mẫu Stitch / chi tiết → highlight đúng mục cha */
  var FILE_ALIAS_KEY = {
    "product-create.html": "products",
    "product-detail.html": "products",
    "goods-receipt-step2.html": "receipts",
    "stock-transfer-detail.html": "transfers",
  };

  function currentActiveKey() {
    var f = "";
    try {
      f = (location.pathname || "").split("/").pop() || "";
    } catch (e) {
      f = "";
    }
    return FILE_TO_KEY[f] || FILE_ALIAS_KEY[f] || "";
  }

  function buildErpNavHtml(activeKey) {
    return NAV_ROWS.map(function (row) {
      var href = row[0];
      var key = row[1];
      var label = row[2];
      var icon = row[3];
      var isActive = key === activeKey;
      var cls = isActive
        ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-teal-50 text-teal-700 border-r-4 border-teal-600 font-semibold"
        : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100";
      return (
        '<a class="' +
        cls +
        '" href="' +
        href +
        '"><span class="material-symbols-outlined">' +
        icon +
        "</span>" +
        label +
        "</a>"
      );
    }).join("\n");
  }

  function navHasPlaceholderLinks(nav) {
    var n = 0;
    nav.querySelectorAll("a").forEach(function (a) {
      var h = a.getAttribute("href");
      if (h != null && String(h).trim() === "#") n++;
    });
    return n >= 2;
  }

  function navIsDivOnlyStitch(nav) {
    var real = nav.querySelectorAll('a[href$=".html"]');
    if (real.length > 0) return false;
    return nav.querySelectorAll("div.cursor-pointer, div[class*='cursor-pointer']").length >= 3;
  }

  function replaceStitchNav(aside) {
    if (aside.getAttribute("data-ro-nav-skip") === "1") return false;
    var nav = aside.querySelector(":scope > nav");
    if (!nav) return false;
    if (nav.getAttribute("data-ro-nav-skip") === "1") return false;
    if (nav.getAttribute("data-ro-erp-nav") === "1") return false;
    if (!navHasPlaceholderLinks(nav) && !navIsDivOnlyStitch(nav)) return false;
    nav.innerHTML = buildErpNavHtml(currentActiveKey());
    nav.setAttribute("data-ro-erp-nav", "1");
    return true;
  }

  function iconKey(el) {
    var icon = el.querySelector(".material-symbols-outlined");
    if (!icon) return "";
    var d = icon.getAttribute("data-icon");
    if (d) return d.trim();
    return (icon.textContent || "").trim();
  }

  function labelKey(el) {
    var sm = el.querySelector("span.text-sm, span.font-medium");
    if (sm) return norm(sm.textContent);
    var t = el.textContent || "";
    var icon = el.querySelector(".material-symbols-outlined");
    if (icon) t = t.replace(icon.textContent || "", "");
    return norm(t);
  }

  var RAIL_ICON = {
    dashboard: "dashboard.html",
    point_of_sale: "pos-order.html",
    inventory_2: "products-list.html",
    warehouse: "inventory-overview.html",
    group: "customers-list.html",
    analytics: "revenue-report.html",
    logout: "login.html",
  };

  function wirePosRail() {
    document.querySelectorAll("nav[class*='w-20'] div.group[class*='cursor-pointer']").forEach(function (el) {
      if (el.dataset.roNavBound === "1") return;
      var ik = iconKey(el);
      var href = RAIL_ICON[ik];
      if (!href) return;
      el.dataset.roNavBound = "1";
      el.addEventListener("click", function () {
        location.href = href;
      });
      el.setAttribute("role", "link");
      el.setAttribute("tabindex", "0");
    });
  }

  function run() {
    document.querySelectorAll("aside").forEach(function (aside) {
      replaceStitchNav(aside);
    });
    wirePosRail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
