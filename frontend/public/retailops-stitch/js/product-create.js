(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function hasRole(sess, code) {
    var roles = (sess && sess.roles) || [];
    return roles.some(function (r) {
      return String(r || "").toUpperCase() === String(code || "").toUpperCase();
    });
  }

  function hasPerm(sess, code) {
    var perms = (sess && sess.permissions) || [];
    return perms.some(function (p) {
      return String(p || "") === String(code || "");
    });
  }

  function canCreateProduct(sess) {
    if (!sess) return false;
    if (hasRole(sess, "ADMIN")) return true;
    return hasPerm(sess, "PRODUCT_CREATE");
  }

  function optId(val) {
    var s = String(val || "").trim();
    if (!s) return null;
    var n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  }

  function parseMoney(el) {
    var v = parseFloat(String(el.value || "").replace(/,/g, ""), 10);
    if (isNaN(v) || v < 0) return null;
    return v;
  }

  function showEl(id, show) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text || "";
  }

  function addVariantRow(tbody, tpl, focusSku) {
    var node = tpl.content.cloneNode(true);
    var tr = node.querySelector("tr");
    tbody.appendChild(tr);
    if (focusSku) {
      var sku = tr.querySelector('[data-v="sku"]');
      if (sku) sku.focus();
    }
    return tr;
  }

  function variantRowsPayload(tbody) {
    var rows = tbody.querySelectorAll("tr.variant-row");
    var list = [];
    rows.forEach(function (tr) {
      function val(key) {
        var inp = tr.querySelector('[data-v="' + key + '"]');
        return inp ? inp.value : "";
      }
      var sku = (val("sku") || "").trim();
      if (!sku) return;
      var cost = parseMoney(tr.querySelector('[data-v="costPrice"]'));
      var sell = parseMoney(tr.querySelector('[data-v="sellingPrice"]'));
      var reorder = parseMoney(tr.querySelector('[data-v="reorderLevel"]'));
      if (cost === null || sell === null || reorder === null) {
        throw new Error("Giá vốn, giá bán và tồn tối thiểu phải là số ≥ 0.");
      }
      var attrRaw = (val("attributesJson") || "").trim();
      var attributesJson = attrRaw ? attrRaw : null;
      list.push({
        sku: sku,
        barcode: (val("barcode") || "").trim() || null,
        variantName: (val("variantName") || "").trim() || null,
        attributesJson: attributesJson,
        costPrice: cost,
        sellingPrice: sell,
        reorderLevel: reorder,
        status: (val("status") || "active").trim(),
      });
    });
    return list;
  }

  function fillSelect(sel, items, labelFn) {
    if (!sel) return;
    var keep = sel.querySelector("option[value='']");
    sel.innerHTML = "";
    if (keep) sel.appendChild(keep);
    else {
      var o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = "— Không chọn —";
      sel.appendChild(o0);
    }
    items.forEach(function (it) {
      var o = document.createElement("option");
      o.value = String(it.id);
      o.textContent = labelFn(it);
      sel.appendChild(o);
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var R = window.RetailOpsApi;
    var form = $("product-create-form");
    var tbody = $("variant-tbody");
    var tpl = $("tpl-variant-row");
    var btnAdd = $("btn-add-variant");
    var btnSubmit = $("btn-submit");
    if (!R || !form || !tbody || !tpl) return;

    var sess = R.getSession();
    if (!canCreateProduct(sess)) {
      showEl("perm-warning", true);
      if (btnSubmit) btnSubmit.disabled = true;
    }

    tbody.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest && e.target.closest("[data-remove-variant]");
      if (!btn) return;
      var tr = btn.closest("tr.variant-row");
      if (!tr) return;
      var rows = tbody.querySelectorAll("tr.variant-row");
      if (rows.length <= 1) {
        alert("Phải có ít nhất một dòng biến thể (SKU).");
        return;
      }
      tr.remove();
    });

    if (btnAdd) {
      btnAdd.addEventListener("click", function () {
        addVariantRow(tbody, tpl, true);
      });
    }

    addVariantRow(tbody, tpl, false);

    try {
      var cats = await R.fetchAllPages(function (p) {
        return "/api/categories?page=" + p + "&size=200&sort=categoryName,asc";
      });
      var brands = await R.fetchAllPages(function (p) {
        return "/api/brands?page=" + p + "&size=200&sort=brandName,asc";
      });
      var units = await R.fetchAllPages(function (p) {
        return "/api/units?page=" + p + "&size=200&sort=unitName,asc";
      });
      fillSelect($("sel-category"), cats, function (c) {
        return (c.categoryName || c.categoryCode || "#" + c.id) + " (" + (c.categoryCode || c.id) + ")";
      });
      fillSelect($("sel-brand"), brands, function (b) {
        return (b.brandName || b.brandCode || "#" + b.id) + " (" + (b.brandCode || b.id) + ")";
      });
      fillSelect($("sel-unit"), units, function (u) {
        return (u.unitName || u.unitCode || "#" + u.id) + " (" + (u.unitCode || u.id) + ")";
      });
    } catch (e1) {
      showEl("form-error", true);
      setText("form-error", "Không tải được danh mục / thương hiệu / đơn vị: " + (e1.message || String(e1)));
    }

    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      showEl("form-error", false);
      showEl("form-success", false);
      if (!canCreateProduct(sess)) {
        showEl("form-error", true);
        setText("form-error", "Bạn không có quyền tạo sản phẩm.");
        return;
      }

      var fd = new FormData(form);
      var productCode = (fd.get("productCode") || "").toString().trim();
      var productName = (fd.get("productName") || "").toString().trim();
      var productType = (fd.get("productType") || "simple").toString().trim();
      var status = (fd.get("status") || "active").toString().trim();
      var descriptionRaw = (fd.get("description") || "").toString().trim();

      var variants;
      try {
        variants = variantRowsPayload(tbody);
      } catch (ve) {
        showEl("form-error", true);
        setText("form-error", ve.message || String(ve));
        return;
      }

      if (!variants.length) {
        showEl("form-error", true);
        setText("form-error", "Vui lòng nhập ít nhất một SKU hợp lệ.");
        return;
      }

      var body = {
        categoryId: optId(fd.get("categoryId")),
        brandId: optId(fd.get("brandId")),
        unitId: optId(fd.get("unitId")),
        productCode: productCode,
        productName: productName,
        productType: productType,
        hasVariant: form.querySelector('[name="hasVariant"]') && form.querySelector('[name="hasVariant"]').checked,
        trackInventory: form.querySelector('[name="trackInventory"]') && form.querySelector('[name="trackInventory"]').checked,
        description: descriptionRaw ? descriptionRaw : null,
        status: status,
        variants: variants,
      };

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Đang lưu…";
      }

      try {
        var created = await R.apiJson("/api/products", { method: "POST", body: body });
        showEl("form-success", true);
        setText(
          "form-success",
          "Đã tạo sản phẩm #" +
            (created && created.id != null ? created.id : "?") +
            ". Chuyển về danh sách…"
        );
        setTimeout(function () {
          window.location.href = "products-list.html";
        }, 900);
      } catch (err) {
        showEl("form-error", true);
        var msg = (err && err.message) || String(err);
        if (err && err.body && err.body.fieldErrors) {
          var fe = err.body.fieldErrors;
          var parts = Object.keys(fe).map(function (k) {
            return k + ": " + fe[k];
          });
          if (parts.length) msg = parts.join("; ");
        }
        setText("form-error", msg);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Lưu sản phẩm";
        }
      }
    });
  });
})();
