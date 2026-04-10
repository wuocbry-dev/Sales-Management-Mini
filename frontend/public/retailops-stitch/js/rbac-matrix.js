/**
 * Ma trận phân quyền (demo) — đổi vai trò, lọc module, đếm thay đổi chưa lưu.
 * Dữ liệu: 0 = không, 1 = có, -1 = không áp dụng (ô trống).
 */
(function () {
  var ACTIONS = [
    { key: "view", label: "Xem" },
    { key: "create", label: "Tạo" },
    { key: "update", label: "Sửa" },
    { key: "delete", label: "Xóa" },
    { key: "approve", label: "Duyệt" },
    { key: "export", label: "Xuất" },
  ];

  var MODULES = [
    { id: "stores", label: "Cửa hàng", icon: "storefront", kw: "cửa hàng store" },
    { id: "products", label: "Sản phẩm", icon: "inventory_2", kw: "sản phẩm hàng" },
    { id: "inventory", label: "Tồn kho", icon: "warehouse", kw: "tồn kho warehouse" },
    { id: "receipts", label: "Phiếu nhập", icon: "input", kw: "phiếu nhập nhập kho" },
    { id: "orders", label: "Đơn bán", icon: "receipt_long", kw: "đơn bán hàng" },
    { id: "pos", label: "POS", icon: "point_of_sale", kw: "pos bán" },
    { id: "customers", label: "Khách hàng", icon: "group", kw: "khách hàng crm" },
    { id: "transfers", label: "Chuyển kho", icon: "swap_horiz", kw: "chuyển kho" },
    { id: "stocktakes", label: "Kiểm kho", icon: "fact_check", kw: "kiểm kho" },
    { id: "returns", label: "Trả hàng", icon: "assignment_return", kw: "trả hàng" },
    { id: "reports", label: "Báo cáo", icon: "analytics", kw: "báo cáo thống kê" },
    { id: "security", label: "Người dùng & phân quyền", icon: "admin_panel_settings", kw: "user rbac quản trị" },
  ];

  /** Mỗi vai trò: mảng 12 hàng × 6 cột */
  var ROLE_ROWS = {
    admin: [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    store_manager: [
      [1, 1, 1, 0, 1, 1],
      [1, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 1],
      [1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 0, 1],
      [1, 1, 1, 0, 0, 1],
      [1, 1, 1, 0, -1, 1],
      [1, 1, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 1],
      [1, 1, 1, 0, -1, 1],
      [1, -1, -1, -1, -1, 1],
      [0, 0, 0, 0, 0, 0],
    ],
    sales_staff: [
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 0, 1],
      [1, 1, 1, 0, -1, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0],
      [1, -1, -1, -1, -1, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    warehouse_staff: [
      [1, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0],
      [1, 0, 1, 0, 1, 1],
      [1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 1],
      [1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0],
    ],
    accountant: [
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0],
    ],
    viewer: [
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  };

  var roleSelect = document.getElementById("rbac-role");
  var searchInput = document.getElementById("rbac-search");
  var tbody = document.getElementById("rbac-tbody");
  var dirtyBar = document.getElementById("rbac-dirty-bar");
  var dirtyCountEl = document.getElementById("rbac-dirty-count");
  var btnSave = document.getElementById("rbac-save");
  var btnCancel = document.getElementById("rbac-cancel");
  var btnReset = document.getElementById("rbac-reset-role");

  if (!tbody || !roleSelect) return;

  var baseline = "";

  function serializeMatrix() {
    var parts = [];
    tbody.querySelectorAll('input[type="checkbox"][data-mod]').forEach(function (inp) {
      parts.push(inp.getAttribute("data-mod") + ":" + inp.getAttribute("data-act") + "=" + (inp.checked ? "1" : "0"));
    });
    return parts.sort().join("|");
  }

  function updateDirtyUi() {
    var cur = serializeMatrix();
    var dirty = cur !== baseline;
    if (dirtyBar) {
      dirtyBar.classList.toggle("hidden", !dirty);
      dirtyBar.setAttribute("aria-hidden", dirty ? "false" : "true");
    }
    if (dirtyCountEl) {
      var n = 0;
      if (dirty) {
        var baseMap = {};
        baseline.split("|").forEach(function (p) {
          var kv = p.split("=");
          if (kv.length === 2) baseMap[kv[0]] = kv[1];
        });
        tbody.querySelectorAll('input[type="checkbox"][data-mod]').forEach(function (inp) {
          var k = inp.getAttribute("data-mod") + ":" + inp.getAttribute("data-act");
          var v = inp.checked ? "1" : "0";
          if (baseMap[k] !== v) n++;
        });
      }
      dirtyCountEl.textContent = String(n);
    }
  }

  function renderTable(roleId) {
    var rows = ROLE_ROWS[roleId] || ROLE_ROWS.viewer;
    var html = "";
    for (var i = 0; i < MODULES.length; i++) {
      var mod = MODULES[i];
      var row = rows[i] || [0, 0, 0, 0, 0, 0];
      var zebra = i % 2 === 1 ? " rbac-zebra" : "";
      html += '<tr class="rbac-row transition-colors' + zebra + '" data-filter="' + mod.kw + '">';
      html +=
        '<th scope="row" class="rbac-sticky text-left p-3 pr-4 border-r border-slate-100 font-medium text-slate-800 align-middle">';
      html += '<div class="flex items-center gap-2 min-w-[200px]">';
      html += '<span class="material-symbols-outlined text-teal-600 text-[20px]">' + mod.icon + "</span>";
      html += "<span>" + mod.label + "</span>";
      html += "</div></th>";
      for (var j = 0; j < ACTIONS.length; j++) {
        var st = row[j];
        var act = ACTIONS[j].key;
        if (st < 0) {
          html +=
            '<td class="p-2 text-center align-middle border-b border-slate-100 text-slate-300" title="Không áp dụng">';
          html += '<span class="material-symbols-outlined text-[18px]">block</span></td>';
        } else {
          var chk = st === 1 ? " checked" : "";
          html += '<td class="p-2 text-center align-middle border-b border-slate-100">';
          html +=
            '<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"' +
            chk +
            ' data-mod="' +
            mod.id +
            '" data-act="' +
            act +
            '"/>';
          html += "</td>";
        }
      }
      html += "</tr>";
    }
    tbody.innerHTML = html;
    tbody.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.addEventListener("change", updateDirtyUi);
    });
    baseline = serializeMatrix();
    updateDirtyUi();
    applyFilter();
  }

  function applyFilter() {
    var q = norm(searchInput && searchInput.value);
    tbody.querySelectorAll(".rbac-row").forEach(function (tr) {
      var hay = norm(tr.getAttribute("data-filter") || "");
      tr.classList.toggle("hidden", q.length > 0 && hay.indexOf(q) === -1);
    });
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  roleSelect.addEventListener("change", function () {
    renderTable(roleSelect.value);
  });

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", function () {
      renderTable(roleSelect.value);
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", function () {
      renderTable(roleSelect.value);
    });
  }

  if (btnSave) {
    btnSave.addEventListener("click", function () {
      baseline = serializeMatrix();
      updateDirtyUi();
    });
  }

  renderTable(roleSelect.value);
})();
