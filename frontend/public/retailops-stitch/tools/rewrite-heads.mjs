import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.join(__dirname, "..", "pages");

/** htmlClass: thuộc tính đầy đủ trên thẻ &lt;html&gt; */
const configs = [
  { file: "login.html", pageCss: "login.css", htmlClass: 'class="light"' },
  { file: "dashboard.html", pageCss: "dashboard.css", htmlClass: 'class="light"' },
  { file: "products-list.html", pageCss: "products-list.css", htmlClass: 'class="light"' },
  { file: "product-detail.html", pageCss: "product-detail.css", htmlClass: 'class="light page-product-detail"' },
  { file: "pos-order.html", pageCss: "pos-order.css", htmlClass: 'class="light page-pos-order"' },
  { file: "goods-receipt-step2.html", pageCss: "goods-receipt-step2.css", htmlClass: 'class="light"' },
  { file: "inventory-overview.html", pageCss: "inventory-overview.css", htmlClass: 'class="light"' },
  { file: "revenue-report.html", pageCss: "revenue-report.css", htmlClass: 'class="light page-revenue-report"' },
  { file: "stores-list.html", pageCss: "stores-list.css", htmlClass: 'class="light"' },
  { file: "stock-transfer-detail.html", pageCss: "stock-transfer-detail.css", htmlClass: 'class="light"' },
  { file: "rbac-matrix.html", pageCss: "rbac-matrix.css", htmlClass: 'class="light"' },
  { file: "audit-log-detail.html", pageCss: null, htmlClass: 'class="dark"', audit: true },
  { file: "ui-states.html", pageCss: "ui-states.css", htmlClass: 'class="light"' },
  { file: "auth-flow.html", pageCss: "auth-flow.css", htmlClass: 'class="light"', bodyClass: "page-auth-flow" },
];

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "RetailOps";
}

for (const cfg of configs) {
  const fp = path.join(pagesDir, cfg.file);
  const html = fs.readFileSync(fp, "utf8");
  const title = extractTitle(html);
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (!bodyMatch) throw new Error("No body in " + cfg.file);

  let newBodyOpen = bodyMatch[0];
  if (cfg.bodyClass) {
    if (/class="/i.test(newBodyOpen)) {
      newBodyOpen = newBodyOpen.replace(/class="/i, `class="${cfg.bodyClass} `);
    } else {
      newBodyOpen = newBodyOpen.replace(/<body/i, `<body class="${cfg.bodyClass}"`);
    }
  }

  const rest = html.slice(bodyMatch.index + bodyMatch[0].length);

  let head;
  if (cfg.audit) {
    head = `<!DOCTYPE html>
<html lang="vi" ${cfg.htmlClass}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<link rel="stylesheet" href="../css/pages/audit-log-detail.css"/>
<script src="../js/tailwind-config-audit.js"></script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
</head>
`;
  } else {
    head = `<!DOCTYPE html>
<html lang="vi" ${cfg.htmlClass}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<link rel="stylesheet" href="../css/shared.css"/>
<link rel="stylesheet" href="../css/pages/${cfg.pageCss}"/>
<script src="../js/tailwind-config-default.js"></script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
</head>
`;
  }

  fs.writeFileSync(fp, head + newBodyOpen + rest, "utf8");
  console.log("OK", cfg.file);
}
