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

function shell({ file, title, activeKey, heading, sub, extraToolbar, tableBody, cssName }) {
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
<div class="flex flex-wrap justify-between items-start gap-4 mb-6">
<div>
<h1 class="text-2xl font-bold text-slate-900">${heading}</h1>
<p class="text-slate-500 text-sm mt-1">${sub}</p>
</div>
${extraToolbar || ""}
</div>
<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
<table class="w-full text-left text-sm">
${tableBody}
</table>
</div>
<p class="text-xs text-slate-400 mt-4">Màn bổ sung (không có trong bộ 14 màn Stitch gốc) — cùng theme RetailOps.</p>
</main>
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
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST /api/sales-orders</code>",
    extra: `<a href="pos-order.html" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><span class="material-symbols-outlined text-[20px]">add</span>Tạo đơn (POS)</a>`,
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã đơn</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Khách</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">TT thanh toán</th><th class="py-3 px-4 text-right">Tổng</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">SO-20260410-001</td><td class="py-3 px-4">CH Trung tâm</td><td class="py-3 px-4">Khách lẻ</td><td class="py-3 px-4">10/04/2026</td><td class="py-3 px-4"><span class="text-emerald-600 font-medium">Đã thanh toán</span></td><td class="py-3 px-4 text-right">1.250.000 ₫</td><td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs">Hoàn tất</span></td></tr>
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">SO-20260410-002</td><td class="py-3 px-4">CH Q3</td><td class="py-3 px-4">Nguyễn Văn A</td><td class="py-3 px-4">10/04/2026</td><td class="py-3 px-4"><span class="text-amber-600">Một phần</span></td><td class="py-3 px-4 text-right">890.000 ₫</td><td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">Nháp</span></td></tr>
</tbody>`,
  },
  {
    file: "customers-list.html",
    css: "customers-list",
    title: "Khách hàng | RetailOps ERP",
    active: "customers",
    heading: "Khách hàng",
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST/PUT /api/customers</code>",
    extra: "",
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã</th><th class="py-3 px-4">Tên</th><th class="py-3 px-4">SĐT</th><th class="py-3 px-4">Email</th><th class="py-3 px-4">Địa chỉ</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">KH001</td><td class="py-3 px-4">Nguyễn Văn A</td><td class="py-3 px-4">0901234567</td><td class="py-3 px-4 text-slate-500">—</td><td class="py-3 px-4 text-slate-600 max-w-xs truncate">TP.HCM</td></tr>
</tbody>`,
  },
  {
    file: "goods-receipts-list.html",
    css: "goods-receipts-list",
    title: "Phiếu nhập | RetailOps ERP",
    active: "receipts",
    heading: "Phiếu nhập kho",
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST /api/goods-receipts</code> — mẫu chi tiết dòng hàng: <a class=\"text-teal-700 font-medium\" href=\"goods-receipt-step2.html\">Bước 2 (Stitch)</a>",
    extra: `<div class="flex gap-2"><a href="goods-receipt-step2.html" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">Tạo phiếu (mẫu UI)</a></div>`,
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã phiếu</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">Trạng thái</th><th class="py-3 px-4 text-right">Tổng</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">PN-20260409-01</td><td class="py-3 px-4">Kho trung tâm</td><td class="py-3 px-4">09/04/2026</td><td class="py-3 px-4"><span class="text-emerald-600 text-xs font-semibold">Hoàn tất</span></td><td class="py-3 px-4 text-right">45.200.000 ₫</td></tr>
</tbody>`,
  },
  {
    file: "stock-transfers-list.html",
    css: "stock-transfers-list",
    title: "Chuyển kho | RetailOps ERP",
    active: "transfers",
    heading: "Chuyển kho",
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST /api/stock-transfers</code> — <a class=\"text-teal-700 font-medium\" href=\"stock-transfer-detail.html\">Chi tiết (Stitch)</a>",
    extra: "",
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã</th><th class="py-3 px-4">Từ</th><th class="py-3 px-4">Đến</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">CK-001</td><td class="py-3 px-4">CH A</td><td class="py-3 px-4">CH B</td><td class="py-3 px-4">10/04/2026</td><td class="py-3 px-4">Đang xử lý</td></tr>
</tbody>`,
  },
  {
    file: "stocktakes-list.html",
    css: "stocktakes-list",
    title: "Kiểm kho | RetailOps ERP",
    active: "stocktakes",
    heading: "Kiểm kho",
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST /api/stocktakes</code>",
    extra: "",
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã phiếu</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">KK-20260401</td><td class="py-3 px-4">CH Trung tâm</td><td class="py-3 px-4">01/04/2026</td><td class="py-3 px-4">Nháp</td></tr>
</tbody>`,
  },
  {
    file: "sales-returns-list.html",
    css: "sales-returns-list",
    title: "Trả hàng | RetailOps ERP",
    active: "returns",
    heading: "Trả hàng bán",
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST /api/sales-returns</code>",
    extra: "",
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Mã trả</th><th class="py-3 px-4">Đơn gốc</th><th class="py-3 px-4">Cửa hàng</th><th class="py-3 px-4">Ngày</th><th class="py-3 px-4 text-right">Hoàn tiền</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">TH-001</td><td class="py-3 px-4 font-mono">SO-…</td><td class="py-3 px-4">CH Q1</td><td class="py-3 px-4">08/04/2026</td><td class="py-3 px-4 text-right">150.000 ₫</td></tr>
</tbody>`,
  },
  {
    file: "users-admin.html",
    css: "users-admin",
    title: "Người dùng | RetailOps ERP",
    active: "users",
    heading: "Quản trị người dùng",
    sub: "API: <code class=\"text-xs bg-slate-100 px-1 rounded\">GET/POST/PUT /api/users</code> — yêu cầu quyền ADMIN",
    extra: "",
    table: `<thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200"><tr>
<th class="py-3 px-4">Tên đăng nhập</th><th class="py-3 px-4">Họ tên</th><th class="py-3 px-4">Email</th><th class="py-3 px-4">Trạng thái</th>
</tr></thead><tbody class="divide-y divide-slate-100">
<tr class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">admin</td><td class="py-3 px-4">Quản trị</td><td class="py-3 px-4">admin@…</td><td class="py-3 px-4"><span class="text-emerald-600 text-xs font-medium">ACTIVE</span></td></tr>
</tbody>`,
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
${mainHtml}
</main>
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
    tableBody: s.table,
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
<p class="text-slate-500 text-sm mt-1">Danh mục hàng hóa — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/products</code>. <a href="product-detail.html" class="text-teal-700 font-medium">Chi tiết (mẫu)</a></p>
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
<th class="py-3 px-4">SKU</th><th class="py-3 px-4">Tên</th><th class="py-3 px-4">Danh mục</th><th class="py-3 px-4 text-right">Giá</th><th class="py-3 px-4 text-right">Tồn</th><th class="py-3 px-4">TT</th>
</tr></thead>
<tbody id="product-tbody" class="divide-y divide-slate-100">
<tr data-product-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">NK-AM270</td><td class="py-3 px-4 font-medium">Giày chạy Nike Air</td><td class="py-3 px-4">Giày nam</td><td class="py-3 px-4 text-right">3.450.000 ₫</td><td class="py-3 px-4 text-right font-semibold">142</td><td class="py-3 px-4"><span class="text-emerald-600 text-xs font-medium">Đang bán</span></td></tr>
<tr data-product-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">SW-S7</td><td class="py-3 px-4 font-medium">Đồng hồ thông minh S7</td><td class="py-3 px-4">Phụ kiện</td><td class="py-3 px-4 text-right">9.200.000 ₫</td><td class="py-3 px-4 text-right font-semibold text-amber-600">8</td><td class="py-3 px-4"><span class="text-emerald-600 text-xs font-medium">Đang bán</span></td></tr>
<tr data-product-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">SNY-XM4</td><td class="py-3 px-4 font-medium">Tai nghe Sony XM4</td><td class="py-3 px-4">Âm thanh</td><td class="py-3 px-4 text-right">6.500.000 ₫</td><td class="py-3 px-4 text-right font-semibold">0</td><td class="py-3 px-4"><span class="text-slate-500 text-xs">Ngừng KD</span></td></tr>
</tbody>
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
<p class="text-slate-500 text-sm mt-1">Theo SKU / cửa hàng — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/inventory</code> (gợi ý tích hợp)</p>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Tổng SKU</p><p class="text-2xl font-bold mt-1">1.240</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Tổng tồn</p><p class="text-2xl font-bold mt-1 text-teal-700">45.680</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Giữ chỗ</p><p class="text-2xl font-bold mt-1 text-amber-600">1.120</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-4"><p class="text-xs text-slate-500 uppercase font-semibold">Cảnh báo thấp</p><p class="text-2xl font-bold mt-1 text-red-600">37</p></div>
</div>
<div class="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
<div>
<label class="block text-xs font-semibold text-slate-500 mb-1">Cửa hàng</label>
<select id="inv-store" class="border border-slate-200 rounded-lg text-sm py-2 px-3 min-w-[160px]">
<option value="">Tất cả</option>
<option value="q1">Chi nhánh Q1</option>
<option value="q7">Chi nhánh Q7</option>
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
<tbody id="inv-tbody" class="divide-y divide-slate-100">
<tr data-inv-row data-store="q1" class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">WTC-001</td><td class="py-3 px-4">Đồng hồ Classic</td><td class="py-3 px-4">Q1</td><td class="py-3 px-4 text-right font-semibold">24</td><td class="py-3 px-4 text-right text-slate-500">2</td></tr>
<tr data-inv-row data-store="q1" class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">HDP-992</td><td class="py-3 px-4">Tai nghe Pro</td><td class="py-3 px-4">Q1</td><td class="py-3 px-4 text-right font-semibold">12</td><td class="py-3 px-4 text-right text-slate-500">0</td></tr>
<tr data-inv-row data-store="q7" class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono">SUN-102</td><td class="py-3 px-4">Kính Aviator</td><td class="py-3 px-4">Q7</td><td class="py-3 px-4 text-right font-semibold text-amber-600">3</td><td class="py-3 px-4 text-right text-slate-500">1</td></tr>
</tbody>
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
<tbody id="store-tbody" class="divide-y divide-slate-100">
<tr data-store-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">CH-Q1</td><td class="py-3 px-4 font-medium">Chi nhánh Quận 1</td><td class="py-3 px-4">TP.HCM</td><td class="py-3 px-4"><span class="text-emerald-600 text-xs font-medium">Hoạt động</span></td></tr>
<tr data-store-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">CH-Q7</td><td class="py-3 px-4 font-medium">Chi nhánh Quận 7</td><td class="py-3 px-4">TP.HCM</td><td class="py-3 px-4"><span class="text-emerald-600 text-xs font-medium">Hoạt động</span></td></tr>
<tr data-store-row class="hover:bg-slate-50/80"><td class="py-3 px-4 font-mono text-teal-700">KHO-BT</td><td class="py-3 px-4 font-medium">Kho Bình Tân</td><td class="py-3 px-4">TP.HCM</td><td class="py-3 px-4"><span class="text-slate-500 text-xs">Bảo trì</span></td></tr>
</tbody>
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
<p class="text-slate-500 text-sm mt-1">Tổng hợp — <code class="text-xs bg-slate-100 px-1 rounded">GET /api/reports/revenue</code> (gợi ý)</p>
</div>
<div class="flex flex-wrap gap-2 items-center">
<button type="button" id="report-refresh" class="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">Làm mới (demo)</button>
</div>
</div>
<div id="report-kpi" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">Doanh thu</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="revenue">1.285.450.000 ₫</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">Đơn hàng</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="orders">3.428</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">AOV</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="aov">375.000 ₫</p></div>
<div class="bg-white border border-slate-200 rounded-xl p-5"><p class="text-sm text-slate-500">Tỉ lệ trả</p><p class="text-2xl font-bold text-slate-900 mt-1" data-kpi="return">1,8%</p></div>
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
<tbody class="divide-y divide-slate-100">
<tr><td class="py-3 px-4">Q1</td><td class="py-3 px-4 text-right">420.000.000 ₫</td><td class="py-3 px-4 text-right">1.120</td></tr>
<tr><td class="py-3 px-4">Q7</td><td class="py-3 px-4 text-right">380.000.000 ₫</td><td class="py-3 px-4 text-right">980</td></tr>
</tbody>
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
<span class="text-xs font-medium text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">Chi nhánh Q1</span>
</div>
<div class="flex-1 min-h-0 grid grid-cols-12 gap-0">
<section class="col-span-12 lg:col-span-3 bg-white border-r border-slate-200 flex flex-col min-h-0">
<div class="p-3 border-b border-slate-100 space-y-2">
<input type="search" id="pos-product-search" placeholder="Tên, SKU, barcode…" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"/>
</div>
<div id="pos-product-list" class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
<div data-pos-product class="border border-slate-100 rounded-lg p-2 flex gap-2 hover:border-teal-200 cursor-pointer">
<div class="w-10 h-10 rounded bg-slate-100 shrink-0"></div>
<div class="flex-1 min-w-0">
<p class="text-xs font-bold text-slate-800 truncate">Đồng hồ Classic</p>
<p class="text-[10px] text-slate-400">WTC-001 · 450.000₫</p>
<button type="button" data-add-product class="mt-1 text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded">Thêm</button>
</div>
</div>
<div data-pos-product class="border border-slate-100 rounded-lg p-2 flex gap-2 hover:border-teal-200 cursor-pointer">
<div class="w-10 h-10 rounded bg-slate-100 shrink-0"></div>
<div class="flex-1 min-w-0">
<p class="text-xs font-bold text-slate-800 truncate">Tai nghe Pro</p>
<p class="text-[10px] text-slate-400">HDP-992 · 1.250.000₫</p>
<button type="button" data-add-product class="mt-1 text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded">Thêm</button>
</div>
</div>
</div>
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
<textarea class="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
</div>
<button type="button" id="pos-checkout" class="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg text-sm font-bold">Thanh toán (demo)</button>
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
