import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.join(__dirname, "..", "pages");
const cssDir = path.join(__dirname, "..", "css", "pages");

/** Thứ tự / nhãn / file — giữ khớp ../js/ro-nav.js (NAV_ROWS) khi đổi menu. */
const nav = [
  ["dashboard.html", "dashboard", "Điều hành"],
  ["products-list.html", "products", "Sản phẩm"],
  ["inventory-overview.html", "inventory", "Tồn kho"],
  ["goods-receipts-list.html", "receipts", "Phiếu nhập"],
  ["sales-orders-list.html", "orders", "Đơn bán"],
  ["pos-order.html", "pos", "POS"],
  ["customers-list.html", "customers", "Khách hàng"],
  ["stock-transfers-list.html", "transfers", "Chuyển kho"],
  ["stocktakes-list.html", "stocktakes", "Kiểm kho"],
  ["sales-returns-list.html", "returns", "Trả hàng"],
  ["revenue-report.html", "reports", "Báo cáo"],
  ["stores-list.html", "stores", "Cửa hàng"],
  ["users-admin.html", "users", "Người dùng"],
  ["rbac-matrix.html", "rbac", "Phân quyền"],
];

const icons = {
  dashboard: "dashboard",
  products: "inventory_2",
  inventory: "warehouse",
  receipts: "input",
  orders: "receipt_long",
  pos: "point_of_sale",
  customers: "group",
  transfers: "swap_horiz",
  stocktakes: "fact_check",
  returns: "assignment_return",
  reports: "analytics",
  stores: "storefront",
  users: "manage_accounts",
  rbac: "admin_panel_settings",
};

function navHtml(activeKey) {
  return nav
    .map(([href, key, label]) => {
      const active =
        key === activeKey
          ? "bg-teal-50 text-teal-700 border-r-4 border-teal-600"
          : "text-slate-600 hover:bg-slate-100";
      const ic = icons[key] || "circle";
      return `<a class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${active}" href="${href}"><span class="material-symbols-outlined">${ic}</span>${label}</a>`;
    })
    .join("\n");
}

function shell({
  file,
  title,
  activeKey,
  heading,
  sub,
  extraToolbar,
  theadHtml,
  tbodyId,
  listScript,
  cssName,
}) {
  const cssFile = `${cssName}.css`;
  return `<!DOCTYPE html>
<html lang="vi" class="light">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<link rel="stylesheet" href="../css/shared.css"/>
<link rel="stylesheet" href="../css/pages/${cssFile}"/>
<script src="../js/tailwind-config-default.js"></script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased overflow-hidden">
<header class="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 h-16 bg-white border-b border-slate-200 shadow-sm text-sm">
<div class="flex items-center gap-8">
<a href="dashboard.html" class="text-xl font-bold text-teal-700">RetailOps ERP</a>
</div>
<div class="flex items-center gap-2">
<a href="login.html" class="text-xs text-slate-600 hover:text-teal-700 px-2">Đăng xuất</a>
</div>
</header>
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-30 flex flex-col py-4 bg-slate-50 border-r border-slate-200 text-sm font-medium overflow-y-auto custom-scrollbar">
<nav class="flex-1 px-3 space-y-1">
${navHtml(activeKey)}
</nav>
</aside>
<main class="ml-64 mt-16 p-6 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
<script src="../js/api-client.js" defer></script>
<div class="flex flex-wrap justify-between items-start gap-4 mb-6">
<div>
<h1 class="text-2xl font-bold text-slate-900">${heading}</h1>
<p class="text-slate-500 text-sm mt-1">${sub}</p>
</div>
${extraToolbar || ""}
</div>
<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
<table class="w-full text-left text-sm">
${theadHtml}
<tbody id="${tbodyId}" class="divide-y divide-slate-100"></tbody>
</table>
</div>
<p class="text-xs text-slate-400 mt-4">Màn bổ sung (không có trong bộ 14 màn Stitch gốc) — cùng theme RetailOps.</p>
<script src="../js/${listScript}" defer></script>
</main>
<script src="../js/ro-nav-acl.js" defer></script>
</body>
</html>
`;
}

const specs = [
  {
    file: "sales-orders-list.html",
    css: "sales-orders-list",
    title: "Đơn bán hàng | RetailOps ERP",
    active: "orders",
    heading: "Đơn bán hàng",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/sales-orders</code>",
    extra: `<a href="pos-order.html" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-[20px]">add</span>Tạo đơn (POS)</a>`,
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã đơn</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Khách</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">TT thanh toán</th><th class="py-3 px-4 text-right">Tổng</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead>`,
    tbodyId: "sales-orders-tbody",
    listScript: "sales-orders-list.js",
  },
  {
    file: "customers-list.html",
    css: "customers-list",
    title: "Khách hàng | RetailOps ERP",
    active: "customers",
    heading: "Khách hàng",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/customers</code>",
    extra: "",
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã</th><th class="py-3 px-4">Tên</th><th class="py-3 px-4">SĐT</th><th class="py-3 px-4">Email</th><th class="py-3 px-4">Địa chỉ</th>
</tr></thead>`,
    tbodyId: "customers-tbody",
    listScript: "customers-list.js",
  },
  {
    file: "goods-receipts-list.html",
    css: "goods-receipts-list",
    title: "Phiếu nhập | RetailOps ERP",
    active: "receipts",
    heading: "Phiếu nhập kho",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/goods-receipts</code> — <a class=\"text-teal-700 font-medium\" href=\"goods-receipt-step2.html\">Bước 2 (Stitch)</a>",
    extra: `<div class="flex gap-2"><a href="goods-receipt-step2.html" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">Tạo phiếu (mẫu UI)</a></div>`,
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã phiếu</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">NCC</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">Trạng thái</th><th class="py-3 px-4 text-right">Tổng</th>
</tr></thead>`,
    tbodyId: "goods-receipts-tbody",
    listScript: "goods-receipts-list.js",
  },
  {
    file: "stock-transfers-list.html",
    css: "stock-transfers-list",
    title: "Chuyển kho | RetailOps ERP",
    active: "transfers",
    heading: "Chuyển kho",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/stock-transfers</code> — <a class=\"text-teal-700 font-medium\" href=\"stock-transfer-detail.html\">Chi tiết (Stitch)</a>",
    extra: "",
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã</th><th class="py-3 px-4">Từ</th><th class="py-3 px-4">Đến</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead>`,
    tbodyId: "stock-transfers-tbody",
    listScript: "stock-transfers-list.js",
  },
  {
    file: "stocktakes-list.html",
    css: "stocktakes-list",
    title: "Kiểm kho | RetailOps ERP",
    active: "stocktakes",
    heading: "Kiểm kho",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/stocktakes</code>",
    extra: "",
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã phiếu</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead>`,
    tbodyId: "stocktakes-tbody",
    listScript: "stocktakes-list.js",
  },
  {
    file: "sales-returns-list.html",
    css: "sales-returns-list",
    title: "Trả hàng | RetailOps ERP",
    active: "returns",
    heading: "Trả hàng bán",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/sales-returns</code>",
    extra: "",
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã trả</th><th class="py-3 px-4">Đơn gốc</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4 text-right">Hoàn tiền</th>
</tr></thead>`,
    tbodyId: "sales-returns-tbody",
    listScript: "sales-returns-list.js",
  },
  {
    file: "users-admin.html",
    css: "users-admin",
    title: "Người dùng | RetailOps ERP",
    active: "users",
    heading: "Quản trị người dùng",
    sub: "Dữ liệu từ <code class=\"text-xs bg-slate-100 px-1 rounded\">GET /api/users</code> — quyền ADMIN",
    extra: "",
    thead: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Tên đăng nhập</th><th class="py-3 px-4">Họ tên</th><th class="py-3 px-4">Email</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead>`,
    tbodyId: "users-tbody",
    listScript: "users-admin-list.js",
  },
];

function erpDocument({ title, activeKey, mainHtml, cssName, mainClass }) {
  const mc =
    mainClass ||
    "ml-64 mt-16 p-6 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar";
  return `<!DOCTYPE html>
<html lang="vi" class="light">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<link rel="stylesheet" href="../css/shared.css"/>
<link rel="stylesheet" href="../css/pages/${cssName}.css"/>
<script src="../js/tailwind-config-default.js"></script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased overflow-hidden">
<header class="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 h-16 bg-white border-b border-slate-200 shadow-sm text-sm">
<div class="flex items-center gap-8">
<a href="dashboard.html" class="text-xl font-bold text-teal-700">RetailOps ERP</a>
</div>
<div class="flex items-center gap-2">
<a href="login.html" class="text-xs text-slate-600 hover:text-teal-700 px-2">Đăng xuất</a>
</div>
</header>
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-30 flex flex-col py-4 bg-slate-50 border-r border-slate-200 text-sm font-medium overflow-y-auto custom-scrollbar">
<nav class="flex-1 px-3 space-y-1">
${navHtml(activeKey)}
</nav>
</aside>
<main class="${mc}">
<script src="../js/api-client.js" defer></script>
${mainHtml}
</main>
<script src="../js/ro-nav-acl.js" defer></script>
</body>
</html>`;
}

for (const s of specs) {
  const html = shell({
    file: s.file,
    title: s.title,
    activeKey: s.active,
    heading: s.heading,
    sub: s.sub,
    extraToolbar: s.extra,
    theadHtml: s.thead,
    tbodyId: s.tbodyId,
    listScript: s.listScript,
    cssName: s.css,
  });
  fs.writeFileSync(path.join(pagesDir, s.file), html, "utf8");
  fs.writeFileSync(
    path.join(cssDir, `${s.css}.css`),
    "/* Tailwind + shared; không trùng rule với file khác */\n",
    "utf8"
  );
  console.log("wrote", s.file);
}

/** Cùng navbar với các màn ERP list; thay thế bản Stitch lệch layout. */
const featurePages = [
  {
    file: "products-list.html",
    css: "products-list",
    title: "Sản phẩm | RetailOps ERP",
    active: "products",
    mainClass:
      "ml-64 mt-16 p-6 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar",
    main: `<div class="flex flex-wrap justify-between items-start gap-4 mb-6">
<div>
<h1 class="text-2xl font-bold text-slate-900">Sản phẩm</h1>
<p class="text-slate-500 text-sm mt-1">Danh mục hàng hóa — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/products</code> (mỗi dòng = một biến thể SKU). <a href="product-detail.html" class="text-teal-700 font-medium">Chi tiết (mẫu)</a></p>
</div>
<button type="button" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Thêm sản phẩm</button>
</div>
<div class="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
<label class="text-xs font-semibold text-slate-500 uppercase">Tìm nhanh</label>
<input id="product-search" type="search" placeholder="Tên, SKU, mã…" class="flex-1 min-w-[200px] max-w-md border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"/>
</div>
<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
<table class="w-full text-left text-sm">
<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">SKU</th><th class="py-3 px-4">Tên</th><th class="py-3 px-4">Danh mục</th><th class="py-3 px-4 text-right">Giá bán</th><th class="py-3 px-4 text-right">Tồn tối thiểu</th><th class="py-3 px-4">TT</th>
</tr></thead>
<tbody id="product-tbody" class="divide-y divide-slate-100"></tbody>
</table>
</div>
<p class="text-xs text-slate-400 mt-4">Giao diện thống nhất navbar ERP — lọc cục bộ (demo).</p>
<script src="../js/products-list.js" defer></script>`,
  },
  {
    file: "inventory-overview.html",
    css: "inventory-overview",
    title: "Tồn kho | RetailOps ERP",
    active: "inventory",
    main: `<div class="mb-6">
<h1 class="text-2xl font-bold text-slate-900">Tồn kho</h1>
<p class="text-slate-500 text-sm mt-1">Theo cửa hàng — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/inventories?storeId=…</code> + sản phẩm để hiển thị SKU/tên.</p>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Dòng tồn</p><p id="inv-kpi-rows" class="text-2xl font-bold mt-1">—</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Tổng tồn</p><p id="inv-kpi-qty" class="text-2xl font-bold mt-1 text-teal-700">—</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Giữ chỗ</p><p id="inv-kpi-reserved" class="text-2xl font-bold mt-1 text-amber-600">—</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Dưới mức tồn tối thiểu</p><p id="inv-kpi-low" class="text-2xl font-bold mt-1 text-red-600">—</p></div>
</div>
<div class="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
<div>
<label class="block text-xs font-semibold text-slate-500 mb-1">Cửa hàng</label>
<select id="inv-store" class="border border-slate-200 rounded-lg text-sm py-2 px-3 min-w-[200px]">
<option value="">Đang tải…</option>
</select>
</div>
<div class="flex-1 min-w-[200px]">
<label class="block text-xs font-semibold text-slate-500 mb-1">Tìm SKU / tên</label>
<input id="inv-search" type="search" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="SKU…"/>
</div>
</div>
<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
<table class="w-full text-sm text-left">
<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">SKU</th><th class="py-3 px-4">Tên</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4 text-right">Tồn</th><th class="py-3 px-4 text-right">Giữ chỗ</th>
</tr></thead>
<tbody id="inv-tbody" class="divide-y divide-slate-100"></tbody>
</table>
</div>
<script src="../js/inventory-overview.js" defer></script>`,
  },
  {
    file: "stores-list.html",
    css: "stores-list",
    title: "Cửa hàng | RetailOps ERP",
    active: "stores",
    main: `<div class="flex flex-wrap justify-between items-start gap-4 mb-6">
<div>
<h1 class="text-2xl font-bold text-slate-900">Cửa hàng</h1>
<p class="text-slate-500 text-sm mt-1">Chi nhánh — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/stores</code></p>
</div>
<button type="button" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Thêm cửa hàng</button>
</div>
<div class="bg-white border border-slate-200 rounded-xl p-4 mb-4">
<input id="store-search" type="search" placeholder="Mã, tên, địa chỉ…" class="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2 text-sm"/>
</div>
<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
<table class="w-full text-sm text-left">
<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b"><tr>
<th class="py-3 px-4">Mã</th><th class="py-3 px-4">Tên</th><th class="py-3 px-4">Khu vực</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead>
<tbody id="store-tbody" class="divide-y divide-slate-100"></tbody>
</table>
</div>
<script src="../js/stores-list.js" defer></script>`,
  },
  {
    file: "revenue-report.html",
    css: "revenue-report",
    title: "Báo cáo | RetailOps ERP",
    active: "reports",
    main: `<div class="flex flex-wrap justify-between items-end gap-4 mb-6">
<div>
<h1 class="text-2xl font-bold text-slate-900">Báo cáo doanh thu</h1>
<p class="text-slate-500 text-sm mt-1">Tổng hợp — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/reports/summary</code></p>
</div>
<div class="flex flex-wrap gap-2 items-center">
<button type="button" id="report-refresh" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">Làm mới</button>
</div>
</div>
<div id="report-kpi" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">Doanh thu (đơn hoàn tất)</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="revenue">—</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">Đơn hoàn tất</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="orders">—</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">AOV</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="aov">—</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">Tỉ lệ trả / tổng đơn</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="return">—</p></div>
</div>
<div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
<h2 class="text-lg font-bold text-slate-900 mb-2">Xu hướng (placeholder)</h2>
<p class="text-sm text-slate-500 mb-4">Biểu đồ sẽ nối API sau; đây là thanh minh họa.</p>
<div class="flex items-end gap-2 h-40 border-b border-slate-200 pb-0">
<div class="flex-1 bg-teal-200 rounded-t" style="height:40%"></div>
<div class="flex-1 bg-teal-400 rounded-t" style="height:65%"></div>
<div class="flex-1 bg-teal-600 rounded-t" style="height:55%"></div>
<div class="flex-1 bg-teal-500 rounded-t" style="height:80%"></div>
<div class="flex-1 bg-teal-300 rounded-t" style="height:45%"></div>
</div>
</div>
<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
<table class="w-full text-sm text-left">
<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b"><tr>
<th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4 text-right">Doanh thu</th><th class="py-3 px-4 text-right">Đơn</th>
</tr></thead>
<tbody id="report-by-store-tbody" class="divide-y divide-slate-100"></tbody>
</table>
</div>
<script src="../js/revenue-report.js" defer></script>`,
  },
  {
    file: "pos-order.html",
    css: "pos-order",
    title: "POS | RetailOps ERP",
    active: "pos",
    mainClass:
      "ml-64 mt-16 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-100",
    main: `<div class="shrink-0 px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center">
<div>
<h1 class="text-lg font-bold text-slate-900">Tạo đơn bán</h1>
<p class="text-xs text-slate-500">POS — <a href="sales-orders-list.html" class="text-teal-700 font-medium">Danh sách đơn</a></p>
</div>
<span id="pos-store-label" class="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">—</span>
</div>
<div class="flex-1 min-h-0 grid grid-cols-12 gap-0">
<section class="col-span-12 lg:col-span-3 bg-white border-r border-slate-200 flex flex-col min-h-0">
<div class="p-3 border-b border-slate-100 space-y-2">
<input type="search" id="pos-product-search" placeholder="Tên, SKU, barcode…" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"/>
</div>
<div id="pos-product-list" class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar"></div>
</section>
<section class="col-span-12 lg:col-span-6 bg-slate-50 border-r border-slate-200 flex flex-col min-h-0">
<div class="px-4 py-2 bg-white border-b border-slate-200 flex justify-between items-center">
<h2 class="text-sm font-bold text-slate-700">Giỏ hàng</h2>
<button type="button" id="pos-clear" class="text-xs text-red-600 font-semibold">Xóa giỏ</button>
</div>
<div class="flex-1 overflow-y-auto min-h-0">
<table class="w-full text-sm bg-white" data-pos-cart>
<thead class="sticky top-0 bg-slate-50 text-xs text-slate-500 uppercase border-b"><tr>
<th class="py-2 px-3 text-left">Sản phẩm</th><th class="py-2 px-2 text-center w-24">SL</th><th class="py-2 px-3 text-right">Thành tiền</th><th class="py-2 px-2 w-8"></th>
</tr></thead>
<tbody id="pos-cart-body" class="divide-y divide-slate-100"></tbody>
</table>
<p id="pos-empty" class="p-6 text-center text-sm text-slate-400">Chưa có dòng hàng — bấm Thêm ở cột trái.</p>
</div>
<div class="bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center">
<span class="text-sm font-semibold text-slate-600">Tổng cộng</span>
<span id="pos-total" class="text-lg font-bold text-teal-700">0 ₫</span>
</div>
</section>
<section class="col-span-12 lg:col-span-3 bg-white flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto custom-scrollbar">
<div>
<label class="text-xs font-bold text-slate-500 uppercase">Khách hàng</label>
<input type="text" class="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Tên / SĐT"/>
</div>
<div>
<label class="text-xs font-bold text-slate-500 uppercase">Ghi chú</label>
<textarea id="pos-note" class="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows="2" placeholder="Ghi chú đơn…"></textarea>
</div>
<button type="button" id="pos-checkout" class="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg text-sm font-bold">Thanh toán</button>
</section>
</div>
<script src="../js/pos-order.js" defer></script>`,
  },
];

for (const f of featurePages) {
  const html = erpDocument({
    title: f.title,
    activeKey: f.active,
    mainHtml: f.main,
    cssName: f.css,
    mainClass: f.mainClass,
  });
  fs.writeFileSync(path.join(pagesDir, f.file), html, "utf8");
  const cssPath = path.join(cssDir, `${f.css}.css`);
  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(
      cssPath,
      "/* Tailwind + shared; trang tạo bởi gen-erp-list-pages */\n",
      "utf8"
    );
  }
  console.log("wrote feature", f.file);
}
