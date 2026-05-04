"""Tools for calling the Sales-Management-Mini backend API."""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import settings

SENSITIVE_KEY_PARTS = (
    "password",
    "token",
    "secret",
    "authorization",
    "credential",
    "api_key",
)

READONLY_ENDPOINTS = [
    "GET /api/auth/me",
    "GET /api/health",
    "GET /api/dashboard/kpis",
    "GET /api/reports/summary",
    "GET /api/stores",
    "GET /api/stores/{id}",
    "GET /api/stores/{storeId}/branches",
    "GET /api/stores/{storeId}/branches/{branchId}",
    "GET /api/branches",
    "GET /api/branches/{branchId}",
    "GET /api/stores/{storeId}/warehouses",
    "GET /api/stores/{storeId}/warehouses/{warehouseId}",
    "GET /api/warehouses",
    "GET /api/brands",
    "GET /api/brands/{id}",
    "GET /api/categories",
    "GET /api/categories/{id}",
    "GET /api/units",
    "GET /api/units/{id}",
    "GET /api/suppliers",
    "GET /api/suppliers/{id}",
    "GET /api/customers",
    "GET /api/customers/{id}",
    "GET /api/products",
    "GET /api/products/{id}",
    "GET /api/products/variant-search",
    "GET /api/products/variant-by-barcode",
    "GET /api/pos/variants/search",
    "GET /api/pos/variants/by-barcode",
    "GET /api/inventories",
    "GET /api/inventories/availability",
    "GET /api/inventory-transactions",
    "GET /api/goods-receipts",
    "GET /api/goods-receipts/{id}",
    "GET /api/sales-orders",
    "GET /api/sales-orders/by-code",
    "GET /api/sales-orders/{id}",
    "GET /api/sales-returns",
    "GET /api/sales-returns/{id}",
    "GET /api/stocktakes",
    "GET /api/stocktakes/{id}",
    "GET /api/stock-transfers",
    "GET /api/stock-transfers/{id}",
    "GET /api/users",
    "GET /api/users/{id}",
    "GET /api/users/store-staff",
    "GET /api/users/store-staff/{id}",
    "GET /api/stores/{storeId}/users",
    "GET /api/rbac/roles",
    "GET /api/rbac/permissions",
    "GET /api/rbac/permission-overrides",
]

MUTATING_ENDPOINTS = [
    "POST /api/auth/change-password",
    "POST /api/stores",
    "PUT /api/stores/{id}",
    "POST /api/stores/{storeId}/branches",
    "PUT /api/stores/{storeId}/branches/{branchId}",
    "POST /api/branches",
    "PUT /api/branches/{branchId}",
    "POST /api/brands",
    "PUT /api/brands/{id}",
    "DELETE /api/brands/{id}",
    "POST /api/categories",
    "PUT /api/categories/{id}",
    "DELETE /api/categories/{id}",
    "POST /api/units",
    "PUT /api/units/{id}",
    "DELETE /api/units/{id}",
    "POST /api/suppliers",
    "PUT /api/suppliers/{id}",
    "DELETE /api/suppliers/{id}",
    "POST /api/customers",
    "PUT /api/customers/{id}",
    "POST /api/products",
    "PUT /api/products/{id}",
    "DELETE /api/products/{id}",
    "POST /api/sales-orders",
    "POST /api/sales-orders/{id}/confirm",
    "POST /api/sales-orders/{id}/cancel",
    "POST /api/sales-returns",
    "POST /api/sales-returns/{id}/confirm",
    "POST /api/goods-receipts",
    "POST /api/goods-receipts/{id}/confirm",
    "POST /api/stocktakes",
    "POST /api/stocktakes/{id}/confirm",
    "POST /api/stock-transfers",
    "POST /api/stock-transfers/{id}/send",
    "POST /api/stock-transfers/{id}/receive",
    "POST /api/users",
    "PUT /api/users/{id}",
    "PUT /api/users/{id}/status",
    "PUT /api/users/{id}/roles",
    "PUT /api/users/{id}/stores",
    "PUT /api/users/{id}/branches",
    "POST /api/users/store-staff",
    "PUT /api/users/store-staff/{id}",
    "POST /api/users/store-staff/{id}/deactivate",
    "POST /api/users/store-staff/{id}/activate",
    "PUT /api/users/store-staff/{id}/change-branch",
    "PUT /api/stores/{storeId}/users/{userId}/branches",
    "POST /api/rbac/permission-overrides",
    "DELETE /api/rbac/permission-overrides/{id}",
]

API_MODULES: list[dict[str, Any]] = [
    {
        "module": "auth",
        "purpose": "Current account information and password change.",
        "readonly": [
            {
                "endpoint": "GET /api/auth/me",
                "params": {},
                "description": "Return the current logged-in user's profile, roles, permissions, store scope and branch scope.",
            },
        ],
        "mutating": [
            {
                "endpoint": "POST /api/auth/change-password",
                "body": {"currentPassword": "old password", "newPassword": "new password"},
                "description": "Change the current user's password only when the user explicitly asks.",
            },
        ],
    },
    {
        "module": "stores",
        "purpose": "Store master data.",
        "readonly": [
            {"endpoint": "GET /api/stores", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/stores/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/stores",
                "body": {
                    "storeCode": "STORE01",
                    "storeName": "Store name",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "PUT /api/stores/{id}",
                "body": {
                    "storeCode": "STORE01",
                    "storeName": "Updated store name",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
            },
        ],
    },
    {
        "module": "branches",
        "purpose": "Branch master data under a store.",
        "readonly": [
            {"endpoint": "GET /api/stores/{storeId}/branches", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/stores/{storeId}/branches/{branchId}", "params": {}},
            {"endpoint": "GET /api/branches", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/branches/{branchId}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/stores/{storeId}/branches",
                "body": {
                    "branchCode": "BR01",
                    "branchName": "Branch name",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "PUT /api/stores/{storeId}/branches/{branchId}",
                "body": {
                    "branchCode": "BR01",
                    "branchName": "Updated branch name",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "POST /api/branches",
                "body": {
                    "branchCode": "BR01",
                    "branchName": "Branch name",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
                "notes": "Use only when backend can resolve store scope from current user.",
            },
            {
                "endpoint": "PUT /api/branches/{branchId}",
                "body": {
                    "branchCode": "BR01",
                    "branchName": "Updated branch name",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
            },
        ],
    },
    {
        "module": "warehouses",
        "purpose": "Warehouse lookup. This backend currently exposes read-only warehouse endpoints.",
        "readonly": [
            {"endpoint": "GET /api/stores/{storeId}/warehouses", "params": {}},
            {"endpoint": "GET /api/warehouses", "params": {"storeId": 1}},
            {"endpoint": "GET /api/stores/{storeId}/warehouses/{warehouseId}", "params": {}},
        ],
        "mutating": [],
    },
    {
        "module": "brands_categories_units_suppliers",
        "purpose": "Product catalog master data.",
        "readonly": [
            {"endpoint": "GET /api/brands", "params": {"storeId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/brands/{id}", "params": {}},
            {"endpoint": "GET /api/categories", "params": {"storeId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/categories/{id}", "params": {}},
            {"endpoint": "GET /api/units", "params": {"storeId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/units/{id}", "params": {}},
            {"endpoint": "GET /api/suppliers", "params": {"storeId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/suppliers/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST|PUT /api/brands[/]{id}",
                "body": {
                    "storeId": 1,
                    "brandCode": "BRAND01",
                    "brandName": "Brand name",
                    "description": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "DELETE /api/brands/{id}",
                "body": None,
            },
            {
                "endpoint": "POST|PUT /api/categories[/]{id}",
                "body": {
                    "storeId": 1,
                    "parentId": None,
                    "categoryCode": "CAT01",
                    "categoryName": "Category name",
                    "description": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "DELETE /api/categories/{id}",
                "body": None,
            },
            {
                "endpoint": "POST|PUT /api/units[/]{id}",
                "body": {
                    "storeId": 1,
                    "unitCode": "PCS",
                    "unitName": "Piece",
                    "description": "",
                },
            },
            {
                "endpoint": "DELETE /api/units/{id}",
                "body": None,
            },
            {
                "endpoint": "POST|PUT /api/suppliers[/]{id}",
                "body": {
                    "storeId": 1,
                    "supplierCode": "SUP01",
                    "supplierName": "Supplier name",
                    "contactPerson": "",
                    "phone": "",
                    "email": "",
                    "address": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "DELETE /api/suppliers/{id}",
                "body": None,
            },
        ],
    },
    {
        "module": "customers",
        "purpose": "Customer lookup/create/update. No delete endpoint exists in this backend.",
        "readonly": [
            {"endpoint": "GET /api/customers", "params": {"storeId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/customers/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/customers",
                "body": {
                    "storeId": 1,
                    "customerCode": "CUS01",
                    "fullName": "Customer name",
                    "phone": "",
                    "email": "",
                    "gender": "",
                    "dateOfBirth": None,
                    "address": "",
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "PUT /api/customers/{id}",
                "body": {
                    "storeId": 1,
                    "customerCode": "CUS01",
                    "fullName": "Updated customer name",
                    "phone": "",
                    "email": "",
                    "gender": "",
                    "dateOfBirth": None,
                    "address": "",
                    "status": "ACTIVE",
                },
            },
        ],
    },
    {
        "module": "products",
        "purpose": "Product and product variant CRUD, plus variant lookup for POS/receipts.",
        "readonly": [
            {"endpoint": "GET /api/products", "params": {"q": "", "status": "ACTIVE", "categoryId": 1, "brandId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/products/{id}", "params": {}},
            {"endpoint": "GET /api/products/variant-search", "params": {"storeId": 1, "q": ""}},
            {"endpoint": "GET /api/products/variant-by-barcode", "params": {"storeId": 1, "barcode": ""}},
            {"endpoint": "GET /api/pos/variants/search", "params": {"storeId": 1, "q": ""}},
            {"endpoint": "GET /api/pos/variants/by-barcode", "params": {"storeId": 1, "barcode": ""}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/products",
                "body": {
                    "storeId": 1,
                    "categoryId": 1,
                    "brandId": 1,
                    "unitId": 1,
                    "productCode": "P001",
                    "productName": "Product name",
                    "productType": "GOODS",
                    "hasVariant": False,
                    "trackInventory": True,
                    "description": "",
                    "status": "ACTIVE",
                    "variants": [
                        {
                            "sku": "P001-DEFAULT",
                            "barcode": "",
                            "variantName": "Default",
                            "attributesJson": None,
                            "costPrice": 10000,
                            "sellingPrice": 15000,
                            "reorderLevel": 5,
                            "status": "ACTIVE",
                        }
                    ],
                },
            },
            {
                "endpoint": "PUT /api/products/{id}",
                "body": {
                    "categoryId": 1,
                    "brandId": 1,
                    "unitId": 1,
                    "productCode": "P001",
                    "productName": "Updated product name",
                    "productType": "GOODS",
                    "hasVariant": False,
                    "trackInventory": True,
                    "description": "",
                    "status": "ACTIVE",
                    "variants": [
                        {
                            "id": 1,
                            "sku": "P001-DEFAULT",
                            "barcode": "",
                            "variantName": "Default",
                            "attributesJson": None,
                            "costPrice": 10000,
                            "sellingPrice": 15000,
                            "reorderLevel": 5,
                            "status": "ACTIVE",
                        }
                    ],
                },
            },
            {"endpoint": "DELETE /api/products/{id}", "body": None},
            {
                "endpoint": "DELETE /api/products/{id}/images/{imageId}",
                "body": None,
                "notes": "The generic JSON API tool does not upload multipart image files.",
            },
        ],
    },
    {
        "module": "inventory",
        "purpose": "Inventory visibility and stock movement history.",
        "readonly": [
            {"endpoint": "GET /api/inventories", "params": {"storeId": 1, "warehouseId": 1, "variantId": 1, "page": 0, "size": 20}},
            {"endpoint": "GET /api/inventories/availability", "params": {"storeId": 1, "variantId": 1}},
            {"endpoint": "GET /api/inventory-transactions", "params": {"storeId": 1, "variantId": 1, "page": 0, "size": 20}},
        ],
        "mutating": [],
    },
    {
        "module": "sales_orders",
        "purpose": "Sales order create, confirm, cancel and lookup.",
        "readonly": [
            {"endpoint": "GET /api/sales-orders", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/sales-orders/by-code", "params": {"orderCode": "SO...", "storeId": 1}},
            {"endpoint": "GET /api/sales-orders/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/sales-orders",
                "body": {
                    "storeId": 1,
                    "branchId": None,
                    "customerId": None,
                    "orderDate": "2026-04-29T10:00:00",
                    "headerDiscountAmount": 0,
                    "vatRatePercent": 0,
                    "vatAmount": 0,
                    "note": "",
                    "lines": [
                        {
                            "variantId": 1,
                            "quantity": 1,
                            "unitPrice": 100000,
                            "discountAmount": 0,
                        }
                    ],
                },
            },
            {
                "endpoint": "POST /api/sales-orders/{id}/confirm",
                "body": {
                    "payments": [
                        {
                            "paymentType": "SALE",
                            "paymentMethod": "CASH",
                            "amount": 100000,
                            "referenceNo": "",
                            "note": "",
                        }
                    ]
                },
            },
            {"endpoint": "POST /api/sales-orders/{id}/cancel", "body": None},
        ],
    },
    {
        "module": "goods_receipts",
        "purpose": "Purchase/goods receipt create, confirm and lookup.",
        "readonly": [
            {"endpoint": "GET /api/goods-receipts", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/goods-receipts/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/goods-receipts",
                "body": {
                    "storeId": 1,
                    "warehouseId": None,
                    "supplierId": None,
                    "receiptDate": "2026-04-29T10:00:00",
                    "headerDiscountAmount": 0,
                    "note": "",
                    "lines": [
                        {
                            "variantId": 1,
                            "quantity": 1,
                            "unitCost": 10000,
                            "discountAmount": 0,
                        }
                    ],
                },
            },
            {"endpoint": "POST /api/goods-receipts/{id}/confirm", "body": None},
        ],
    },
    {
        "module": "sales_returns",
        "purpose": "Sales return create, confirm and lookup.",
        "readonly": [
            {"endpoint": "GET /api/sales-returns", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/sales-returns/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/sales-returns",
                "body": {
                    "orderId": 1,
                    "storeId": 1,
                    "customerId": None,
                    "returnDate": "2026-04-29T10:00:00",
                    "note": "",
                    "lines": [
                        {
                            "orderItemId": 1,
                            "variantId": 1,
                            "quantity": 1,
                            "unitPrice": 100000,
                            "reason": "",
                        }
                    ],
                },
            },
            {"endpoint": "POST /api/sales-returns/{id}/confirm", "body": None},
        ],
    },
    {
        "module": "stocktakes",
        "purpose": "Stocktake create, confirm and lookup.",
        "readonly": [
            {"endpoint": "GET /api/stocktakes", "params": {"storeId": 1, "status": "DRAFT", "page": 0, "size": 20}},
            {"endpoint": "GET /api/stocktakes/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/stocktakes",
                "body": {
                    "storeId": 1,
                    "warehouseId": 1,
                    "stocktakeDate": "2026-04-29T10:00:00",
                    "note": "",
                    "lines": [{"variantId": 1, "actualQty": 10, "note": ""}],
                },
            },
            {"endpoint": "POST /api/stocktakes/{id}/confirm", "body": None},
        ],
    },
    {
        "module": "stock_transfers",
        "purpose": "Stock transfer create, send, receive and lookup.",
        "readonly": [
            {"endpoint": "GET /api/stock-transfers", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/stock-transfers/{id}", "params": {}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/stock-transfers",
                "body": {
                    "fromWarehouseId": 1,
                    "toWarehouseId": 2,
                    "transferDate": "2026-04-29T10:00:00",
                    "note": "",
                    "lines": [{"variantId": 1, "quantity": 1}],
                },
            },
            {"endpoint": "POST /api/stock-transfers/{id}/send", "body": None},
            {"endpoint": "POST /api/stock-transfers/{id}/receive", "body": None},
        ],
    },
    {
        "module": "users_and_store_staff",
        "purpose": "System users, store staff, role/store/branch assignment and account status.",
        "readonly": [
            {"endpoint": "GET /api/users", "params": {"page": 0, "size": 20}},
            {"endpoint": "GET /api/users/{id}", "params": {}},
            {"endpoint": "GET /api/users/store-staff", "params": {"storeId": 1, "branchId": 1, "roleCode": "CASHIER", "status": "ACTIVE", "page": 0, "size": 20}},
            {"endpoint": "GET /api/users/store-staff/{id}", "params": {}},
            {"endpoint": "GET /api/stores/{storeId}/users", "params": {"page": 0, "size": 20}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/users",
                "body": {
                    "username": "user01",
                    "email": "user01@example.com",
                    "password": "secret123",
                    "fullName": "Full name",
                    "phone": "",
                    "defaultStoreId": 1,
                    "roleIds": [1],
                    "storeIds": [1],
                    "primaryStoreId": 1,
                },
            },
            {
                "endpoint": "PUT /api/users/{id}",
                "body": {
                    "email": "user01@example.com",
                    "fullName": "Updated full name",
                    "phone": "",
                    "defaultStoreId": 1,
                },
            },
            {"endpoint": "PUT /api/users/{id}/status", "body": {"status": "ACTIVE"}},
            {"endpoint": "PUT /api/users/{id}/roles", "body": {"roleIds": [1]}},
            {"endpoint": "PUT /api/users/{id}/stores", "body": {"storeIds": [1], "primaryStoreId": 1}},
            {"endpoint": "PUT /api/users/{id}/branches", "body": {"branchIds": [1], "primaryBranchId": 1}},
            {
                "endpoint": "POST /api/users/store-staff",
                "body": {
                    "username": "staff01",
                    "password": "secret123",
                    "fullName": "Staff name",
                    "phone": "",
                    "email": "",
                    "roleCode": "CASHIER",
                    "branchId": 1,
                    "status": "ACTIVE",
                },
            },
            {
                "endpoint": "PUT /api/users/store-staff/{id}",
                "body": {
                    "fullName": "Updated staff name",
                    "phone": "",
                    "email": "",
                    "password": "",
                },
            },
            {"endpoint": "POST /api/users/store-staff/{id}/deactivate", "body": None},
            {"endpoint": "POST /api/users/store-staff/{id}/activate", "body": None},
            {"endpoint": "PUT /api/users/store-staff/{id}/change-branch", "body": {"newBranchId": 2}},
            {
                "endpoint": "PUT /api/stores/{storeId}/users/{userId}/branches",
                "body": {"branchIds": [1], "primaryBranchId": 1},
            },
        ],
    },
    {
        "module": "rbac",
        "purpose": "Role/permission catalog and scoped permission overrides.",
        "readonly": [
            {"endpoint": "GET /api/rbac/roles", "params": {"page": 0, "size": 50}},
            {"endpoint": "GET /api/rbac/permissions", "params": {"page": 0, "size": 100}},
            {"endpoint": "GET /api/rbac/permission-overrides", "params": {"roleId": 1}},
        ],
        "mutating": [
            {
                "endpoint": "POST /api/rbac/permission-overrides",
                "body": {
                    "roleId": 1,
                    "permissionId": 1,
                    "storeId": None,
                    "branchId": None,
                    "overrideType": "ALLOW",
                },
            },
            {"endpoint": "DELETE /api/rbac/permission-overrides/{id}", "body": None},
        ],
    },
    {
        "module": "reports_dashboard",
        "purpose": "Dashboard and summary reports.",
        "readonly": [
            {"endpoint": "GET /api/dashboard/kpis", "params": {}},
            {"endpoint": "GET /api/reports/summary", "params": {}},
        ],
        "mutating": [],
    },
]

ALLOWED_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}


def _to_json(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)


def _mask_sensitive(value: Any) -> Any:
    if isinstance(value, dict):
        masked = {}
        for key, item in value.items():
            normalized = str(key).lower()
            if any(part in normalized for part in SENSITIVE_KEY_PARTS):
                masked[key] = "***masked***" if item is not None else None
            else:
                masked[key] = _mask_sensitive(item)
        return masked
    if isinstance(value, list):
        return [_mask_sensitive(item) for item in value]
    return value


def _normalize_path(path: str) -> str:
    cleaned = path.strip()
    if not cleaned.startswith("/"):
        cleaned = f"/{cleaned}"
    if not cleaned.startswith("/api/") and cleaned != "/api":
        raise ValueError("Only Sales backend paths starting with /api are allowed.")
    if "/images/" in cleaned or cleaned.endswith("/file"):
        raise ValueError("Binary file endpoints are not available through this tool.")
    return cleaned


def list_sales_backend_api_routes() -> str:
    """Return the Sales backend API catalog available to the agent."""
    return _to_json(
        {
            "ok": True,
            "base_url": settings.SALES_BACKEND_BASE_URL,
            "policy": (
                "Use the current user's JWT. GET endpoints are read-only. "
                "POST/PUT/PATCH/DELETE endpoints mutate data and must only be called when the user "
                "explicitly asks for that exact action. Ask for missing required IDs/body fields before "
                "calling a mutating endpoint. After a successful mutation, call a related GET endpoint "
                "to verify the final state. The Sales backend still enforces permissions and data scope. "
                "Before saying a user lacks access, call GET /api/auth/me and inspect roles/permissions. "
                "If roles include SYSTEM_ADMIN or ADMIN, do not add storeId/branchId filters unless the "
                "user asks for a specific store/branch."
            ),
            "readonly_endpoints": READONLY_ENDPOINTS,
            "mutating_endpoints": MUTATING_ENDPOINTS,
            "modules": API_MODULES,
        }
    )


def call_sales_backend_api(
    method: str,
    path: str,
    access_token: str | None,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | list[Any] | None = None,
    explicit_user_request: bool = False,
    max_chars: int = 12000,
) -> str:
    """Call a Sales backend API endpoint using the current user's token."""
    if not access_token:
        return _to_json({"ok": False, "error": "Missing current user access token."})

    http_method = method.strip().upper()
    if http_method not in ALLOWED_METHODS:
        return _to_json({"ok": False, "error": f"Unsupported HTTP method: {method}"})
    if http_method != "GET" and not explicit_user_request:
        return _to_json(
            {
                "ok": False,
                "error": (
                    "Mutating API calls require explicit_user_request=true after the user clearly "
                    "asked for the action in chat."
                ),
            }
        )

    try:
        api_path = _normalize_path(path)
    except ValueError as exc:
        return _to_json({"ok": False, "error": str(exc)})

    url = f"{settings.SALES_BACKEND_BASE_URL.rstrip('/')}{api_path}"
    max_chars = max(1000, min(int(max_chars), 50000))
    safe_params = params or {}

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.request(
                http_method,
                url,
                params=safe_params,
                json=json_body,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            )
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            body: Any = response.json()
        else:
            body = response.text

        payload = {
            "ok": 200 <= response.status_code < 300,
            "status_code": response.status_code,
            "method": http_method,
            "path": api_path,
            "params": safe_params,
            "request_body": _mask_sensitive(json_body),
            "body": _mask_sensitive(body),
        }
        text = _to_json(payload)
        if len(text) > max_chars:
            return text[:max_chars] + '...,"truncated":true}'
        return text
    except Exception as exc:
        return _to_json({"ok": False, "method": http_method, "path": api_path, "error": str(exc)})


def call_sales_backend_get(
    path: str,
    access_token: str | None,
    params: dict[str, Any] | None = None,
    max_chars: int = 12000,
) -> str:
    """Call a read-only Sales backend API endpoint using the current user's token."""
    return call_sales_backend_api(
        method="GET",
        path=path,
        access_token=access_token,
        params=params,
        max_chars=max_chars,
    )


def get_store_staff_summary(
    access_token: str | None,
    status: str | None = None,
    role_code: str | None = None,
    max_pages: int = 20,
) -> str:
    """Return store staff grouped by store using the current Sales backend token."""
    if not access_token:
        return _to_json({"ok": False, "error": "Missing current user access token."})

    me_result = json.loads(
        call_sales_backend_api(
            method="GET",
            path="/api/auth/me",
            access_token=access_token,
            max_chars=50000,
        )
    )
    if not me_result.get("ok"):
        return _to_json(
            {
                "ok": False,
                "step": "auth_me",
                "error": "Could not read current user's permissions.",
                "backend_response": me_result,
            }
        )

    stores_result = json.loads(
        call_sales_backend_api(
            method="GET",
            path="/api/stores",
            access_token=access_token,
            params={"page": 0, "size": 500},
            max_chars=50000,
        )
    )
    stores_by_id: dict[str, dict[str, Any]] = {}
    if stores_result.get("ok"):
        body = stores_result.get("body")
        rows = body.get("content") if isinstance(body, dict) else body if isinstance(body, list) else []
        for row in rows or []:
            store_id = row.get("id") or row.get("storeId")
            if store_id is not None:
                stores_by_id[str(store_id)] = row

    staff_rows: list[dict[str, Any]] = []
    total_pages = 1
    for page in range(max(1, max_pages)):
        params: dict[str, Any] = {"page": page, "size": 500}
        if status:
            params["status"] = status
        if role_code:
            params["roleCode"] = role_code
        staff_result = json.loads(
            call_sales_backend_api(
                method="GET",
                path="/api/users/store-staff",
                access_token=access_token,
                params=params,
                max_chars=50000,
            )
        )
        if not staff_result.get("ok"):
            return _to_json(
                {
                    "ok": False,
                    "step": "list_store_staff",
                    "error": "Could not list store staff.",
                    "current_user": me_result.get("body"),
                    "backend_response": staff_result,
                }
            )

        body = staff_result.get("body")
        if isinstance(body, dict):
            rows = body.get("content") or body.get("data") or []
            total_pages = int(body.get("totalPages") or 1)
        elif isinstance(body, list):
            rows = body
            total_pages = 1
        else:
            rows = []
            total_pages = 1
        staff_rows.extend(rows)
        if page + 1 >= total_pages:
            break

    grouped: dict[str, dict[str, Any]] = {}
    for staff in staff_rows:
        store_id = staff.get("storeId")
        key = str(store_id) if store_id is not None else "unknown"
        store = stores_by_id.get(key, {})
        group = grouped.setdefault(
            key,
            {
                "storeId": store_id,
                "storeCode": store.get("storeCode"),
                "storeName": store.get("storeName") or f"Store {store_id}",
                "staffCount": 0,
                "byRole": {},
                "byStatus": {},
                "staff": [],
            },
        )
        group["staffCount"] += 1
        role = staff.get("roleCode") or "UNKNOWN"
        staff_status = staff.get("status") or "UNKNOWN"
        group["byRole"][role] = group["byRole"].get(role, 0) + 1
        group["byStatus"][staff_status] = group["byStatus"].get(staff_status, 0) + 1
        group["staff"].append(
            _mask_sensitive(
                {
                    "userId": staff.get("userId") or staff.get("id"),
                    "username": staff.get("username"),
                    "fullName": staff.get("fullName"),
                    "roleCode": staff.get("roleCode"),
                    "branchId": staff.get("branchId"),
                    "status": staff.get("status"),
                }
            )
        )

    stores_with_staff = sorted(
        grouped.values(),
        key=lambda item: (str(item.get("storeName") or ""), str(item.get("storeId") or "")),
    )
    return _to_json(
        {
            "ok": True,
            "current_user": _mask_sensitive(me_result.get("body")),
            "filters": {"status": status, "roleCode": role_code},
            "totalStaff": len(staff_rows),
            "storeCount": len(stores_with_staff),
            "storesWithStaff": stores_with_staff,
        }
    )


def set_store_staff_status_by_username(
    username: str,
    action: str,
    access_token: str | None,
    max_pages: int = 10,
) -> str:
    """Activate or deactivate a store staff user by username.

    This is intentionally higher-level than the generic API caller so the agent
    can complete common chat commands without first asking the user for an ID.
    """
    normalized_username = username.strip()
    normalized_action = action.strip().lower()

    if not normalized_username:
        return _to_json({"ok": False, "error": "Missing username."})
    if normalized_action not in {"activate", "deactivate"}:
        return _to_json(
            {"ok": False, "error": "Action must be either activate or deactivate."}
        )
    if not access_token:
        return _to_json({"ok": False, "error": "Missing current user access token."})

    matches: list[dict[str, Any]] = []

    for page in range(max(1, max_pages)):
        list_result = json.loads(
            call_sales_backend_api(
                method="GET",
                path="/api/users/store-staff",
                access_token=access_token,
                params={"page": page, "size": 100},
                max_chars=50000,
            )
        )
        if not list_result.get("ok"):
            return _to_json(
                {
                    "ok": False,
                    "step": "list_store_staff",
                    "error": "Could not list store staff.",
                    "backend_response": list_result,
                }
            )

        body = list_result.get("body")
        if isinstance(body, dict):
            rows = body.get("content") or body.get("data") or []
            total_pages = int(body.get("totalPages") or 1)
        elif isinstance(body, list):
            rows = body
            total_pages = 1
        else:
            rows = []
            total_pages = 1

        for row in rows:
            if str(row.get("username", "")).lower() == normalized_username.lower():
                matches.append(row)

        if page + 1 >= total_pages:
            break

    if not matches:
        return _to_json(
            {
                "ok": False,
                "error": "Store staff username not found.",
                "username": normalized_username,
            }
        )
    if len(matches) > 1:
        return _to_json(
            {
                "ok": False,
                "error": "Multiple store staff users matched this username.",
                "matches": _mask_sensitive(matches),
            }
        )

    staff = matches[0]
    user_id = staff.get("userId") or staff.get("id")
    if not user_id:
        return _to_json(
            {
                "ok": False,
                "error": "Matched staff row does not include userId.",
                "match": _mask_sensitive(staff),
            }
        )

    mutation_result = json.loads(
        call_sales_backend_api(
            method="POST",
            path=f"/api/users/store-staff/{user_id}/{normalized_action}",
            access_token=access_token,
            explicit_user_request=True,
            max_chars=50000,
        )
    )

    return _to_json(
        {
            "ok": bool(mutation_result.get("ok")),
            "action": normalized_action,
            "username": normalized_username,
            "user_id": user_id,
            "before": _mask_sensitive(staff),
            "backend_response": mutation_result,
        }
    )
