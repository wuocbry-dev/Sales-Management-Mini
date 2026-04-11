/**
 * Ẩn mục sidebar theo roles/permissions từ phiên đăng nhập (JWT payload trong session).
 * Khớp mã quyền backend (PermissionBootstrapService / bảng permissions).
 */
(function () {
  "use strict";

  var STORAGE_PREFIX = "retailops.";
  var SESSION_KEY = STORAGE_PREFIX + "session";

  /** file → cần một trong các quyền, hoặc một trong các role (ROLE_ không lưu prefix trong JWT roles). */
  var RULES = [
    { file: "dashboard.html", anyPerm: ["DASHBOARD_VIEW"], anyRole: ["ADMIN"] },
    { file: "products-list.html", anyPerm: ["PRODUCT_VIEW"], anyRole: ["ADMIN"] },
    { file: "product-detail.html", anyPerm: ["PRODUCT_VIEW"], anyRole: ["ADMIN"] },
    { file: "inventory-overview.html", anyPerm: ["INVENTORY_VIEW"], anyRole: ["ADMIN"] },
    { file: "goods-receipts-list.html", anyPerm: ["GOODS_RECEIPT_VIEW"], anyRole: ["ADMIN"] },
    { file: "goods-receipt-step2.html", anyPerm: ["GOODS_RECEIPT_CREATE"], anyRole: ["ADMIN"] },
    { file: "sales-orders-list.html", anyPerm: ["ORDER_VIEW"], anyRole: ["ADMIN"] },
    { file: "pos-order.html", anyPerm: ["ORDER_CREATE"], anyRole: ["ADMIN"] },
    { file: "customers-list.html", anyPerm: ["CUSTOMER_VIEW"], anyRole: ["ADMIN"] },
    { file: "stock-transfers-list.html", anyPerm: ["TRANSFER_VIEW"], anyRole: ["ADMIN"] },
    { file: "stock-transfer-detail.html", anyPerm: ["TRANSFER_VIEW"], anyRole: ["ADMIN"] },
    { file: "stocktakes-list.html", anyPerm: ["STOCKTAKE_VIEW"], anyRole: ["ADMIN"] },
    { file: "sales-returns-list.html", anyPerm: ["RETURN_VIEW"], anyRole: ["ADMIN"] },
    { file: "revenue-report.html", anyPerm: ["REPORT_VIEW"], anyRole: ["ADMIN"] },
    { file: "stores-list.html", anyPerm: ["STORE_VIEW"], anyRole: ["ADMIN"] },
    { file: "users-admin.html", anyRole: ["ADMIN"] },
    { file: "rbac-matrix.html", anyPerm: ["RBAC_MANAGE"], anyRole: ["ADMIN"] },
  ];

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function hasRole(sess, code) {
    var roles = (sess && sess.roles) || [];
    return roles.some(function (r) {
      return String(r || "").toUpperCase() === String(code || "").toUpperCase();
    });
  }

  function hasAnyRole(sess, codes) {
    if (!codes || !codes.length) return false;
    for (var i = 0; i < codes.length; i++) {
      if (hasRole(sess, codes[i])) return true;
    }
    return false;
  }

  function hasPerm(sess, code) {
    var perms = (sess && sess.permissions) || [];
    return perms.some(function (p) {
      return String(p || "") === String(code || "");
    });
  }

  function hasAnyPerm(sess, codes) {
    if (!codes || !codes.length) return false;
    for (var i = 0; i < codes.length; i++) {
      if (hasPerm(sess, codes[i])) return true;
    }
    return false;
  }

  function allowedForHref(sess, href) {
    if (!href || href.indexOf("#") === 0) return true;
    var base = href.split("/").pop() || "";
    base = base.split("?")[0].toLowerCase();
    var rule = null;
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].file.toLowerCase() === base) {
        rule = RULES[i];
        break;
      }
    }
    if (!rule) return true;
    if (hasRole(sess, "ADMIN")) return true;
    if (rule.anyRole && hasAnyRole(sess, rule.anyRole)) return true;
    if (rule.anyPerm && hasAnyPerm(sess, rule.anyPerm)) return true;
    return false;
  }

  function apply() {
    var sess = loadSession();
    if (!sess || !sess.accessToken) {
      return;
    }
    var navs = document.querySelectorAll("aside nav a[href]");
    navs.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (!allowedForHref(sess, href)) {
        a.classList.add("hidden", "pointer-events-none", "opacity-40");
        a.setAttribute("aria-hidden", "true");
        a.setAttribute("tabindex", "-1");
        a.setAttribute("title", "Bạn không có quyền truy cập mục này.");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
