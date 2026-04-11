-- =============================================================================
-- Sales Management Mini — schema MySQL đầy đủ + seed role/permission
-- =============================================================================
-- Cách dùng:
--
-- 1) Cài mới / reset hoàn toàn (dev): chạy từ đầu file đến hết "PHẦN A".
--    Phần DROP + CREATE sẽ XÓA DỮ LIỆU — chỉ môi trường dev hoặc DB rỗng có chủ đích reset.
--
-- 2) Nâng cấp DB đã tồn tại (giữ dữ liệu): KHÔNG chạy DROP; chỉ chạy "PHẦN B"
--    (script idempotent: bảng IF NOT EXISTS, INSERT ... ON DUPLICATE KEY UPDATE,
--    DELETE quyền thừa rồi gán lại role_permissions). Có thể tách PHẦN B ra file
--    riêng nếu team muốn — hiện gộp một file để đồng bộ một nguồn.
--
-- Tên DB mặc định khớp backend: .../sales_management_mini — đổi ở CREATE DATABASE + USE.
-- =============================================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS sales_management_mini
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sales_management_mini;

-- -----------------------------------------------------------------------------
-- Xóa bảng (thứ tự an toàn; tắt kiểm tra FK tạm thời)
-- -----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS stocktake_items;
DROP TABLE IF EXISTS stocktakes;
DROP TABLE IF EXISTS stock_transfer_items;
DROP TABLE IF EXISTS stock_transfers;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS sales_return_items;
DROP TABLE IF EXISTS sales_returns;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS goods_receipt_items;
DROP TABLE IF EXISTS goods_receipts;
DROP TABLE IF EXISTS inventories;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS role_permission_overrides;
DROP TABLE IF EXISTS user_branches;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS user_stores;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS stores;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- DDL
-- =============================================================================

-- -----------------------------
-- 1. STORES
-- -----------------------------
CREATE TABLE stores (
    store_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_code VARCHAR(50) NOT NULL UNIQUE,
    store_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------
-- 1b. BRANCHES (chi nhánh thuộc cửa hàng)
-- -----------------------------
CREATE TABLE branches (
    branch_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT UNSIGNED NOT NULL,
    branch_code VARCHAR(50) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_branches_store_code (store_id, branch_code),
    CONSTRAINT fk_branches_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id)
);

-- -----------------------------
-- 1c. WAREHOUSES (kho tổng CENTRAL / kho chi nhánh BRANCH)
-- -----------------------------
CREATE TABLE warehouses (
    warehouse_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NULL,
    warehouse_code VARCHAR(50) NOT NULL,
    warehouse_name VARCHAR(255) NOT NULL,
    warehouse_type ENUM('CENTRAL', 'BRANCH') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_warehouses_store_code (store_id, warehouse_code),
    CONSTRAINT fk_warehouses_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_warehouses_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    INDEX idx_warehouses_store (store_id),
    INDEX idx_warehouses_branch (branch_id)
);

-- -----------------------------
-- 2. ROLES & PERMISSIONS
-- -----------------------------
CREATE TABLE roles (
    role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(150) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    action_name VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

-- Ghi đè ALLOW/DENY theo store/chi nhánh (nền RBAC scoped; JWT vẫn gộp phần global NULL,NULL tại login)
CREATE TABLE role_permission_overrides (
    override_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NULL,
    branch_id BIGINT UNSIGNED NULL,
    override_type ENUM('ALLOW', 'DENY') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rpo_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
    CONSTRAINT fk_rpo_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id),
    CONSTRAINT fk_rpo_store FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_rpo_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    INDEX idx_rpo_role (role_id),
    INDEX idx_rpo_scope (store_id, branch_id)
);

-- -----------------------------
-- 3. USERS
-- -----------------------------
CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    default_store_id BIGINT UNSIGNED NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_default_store
        FOREIGN KEY (default_store_id) REFERENCES stores(store_id)
);

CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE user_stores (
    user_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, store_id),
    CONSTRAINT fk_user_stores_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_stores_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id)
);

CREATE TABLE user_branches (
    user_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, branch_id),
    CONSTRAINT fk_user_branches_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_branches_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

-- -----------------------------
-- 4. MASTER DATA
-- -----------------------------
CREATE TABLE categories (
    category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT UNSIGNED NULL,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories(category_id)
);

CREATE TABLE brands (
    brand_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brand_code VARCHAR(50) NOT NULL UNIQUE,
    brand_name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE units (
    unit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unit_code VARCHAR(50) NOT NULL UNIQUE,
    unit_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    supplier_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    customer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    gender ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    date_of_birth DATE NULL,
    address VARCHAR(255),
    loyalty_points INT UNSIGNED NOT NULL DEFAULT 0,
    total_spent DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customers_phone (phone)
);

CREATE TABLE products (
    product_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NULL,
    brand_id BIGINT UNSIGNED NULL,
    unit_id BIGINT UNSIGNED NULL,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    product_type ENUM('NORMAL', 'SERVICE') NOT NULL DEFAULT 'NORMAL',
    has_variant TINYINT(1) NOT NULL DEFAULT 0,
    track_inventory TINYINT(1) NOT NULL DEFAULT 1,
    description TEXT,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id),
    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    CONSTRAINT fk_products_unit
        FOREIGN KEY (unit_id) REFERENCES units(unit_id)
);

CREATE TABLE product_variants (
    variant_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    variant_name VARCHAR(255),
    attributes_json JSON NULL,
    cost_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    reorder_level DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- -----------------------------
-- 5. INVENTORY
-- -----------------------------
CREATE TABLE inventories (
    inventory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity_on_hand DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    reserved_qty DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_inventories_warehouse_variant (warehouse_id, variant_id),
    CONSTRAINT fk_inventories_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_inventories_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE goods_receipts (
    receipt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_code VARCHAR(50) NOT NULL UNIQUE,
    store_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NULL,
    receipt_date DATETIME NOT NULL,
    status ENUM('DRAFT', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    note VARCHAR(500),
    created_by BIGINT UNSIGNED NOT NULL,
    approved_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_goods_receipts_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_goods_receipts_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_goods_receipts_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    CONSTRAINT fk_goods_receipts_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_goods_receipts_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id),
    INDEX idx_goods_receipts_store_date (store_id, receipt_date)
);

CREATE TABLE goods_receipt_items (
    receipt_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_cost DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_goods_receipt_items_receipt
        FOREIGN KEY (receipt_id) REFERENCES goods_receipts(receipt_id),
    CONSTRAINT fk_goods_receipt_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- -----------------------------
-- 6. SALES
-- -----------------------------
CREATE TABLE sales_orders (
    order_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    store_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NULL,
    customer_id BIGINT UNSIGNED NULL,
    cashier_id BIGINT UNSIGNED NOT NULL,
    order_date DATETIME NOT NULL,
    status ENUM('DRAFT', 'COMPLETED', 'CANCELLED', 'RETURNED_PARTIAL', 'RETURNED_FULL') NOT NULL DEFAULT 'COMPLETED',
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'PAID',
    note VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_orders_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_sales_orders_branch
        FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    CONSTRAINT fk_sales_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_sales_orders_cashier
        FOREIGN KEY (cashier_id) REFERENCES users(user_id),
    INDEX idx_sales_orders_store_date (store_id, order_date),
    INDEX idx_sales_orders_customer (customer_id)
);

CREATE TABLE sales_order_items (
    order_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_sales_order_items_order
        FOREIGN KEY (order_id) REFERENCES sales_orders(order_id),
    CONSTRAINT fk_sales_order_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE sales_returns (
    return_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    return_code VARCHAR(50) NOT NULL UNIQUE,
    order_id BIGINT UNSIGNED NOT NULL,
    store_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NULL,
    processed_by BIGINT UNSIGNED NOT NULL,
    return_date DATETIME NOT NULL,
    status ENUM('DRAFT', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
    refund_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    note VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_returns_order
        FOREIGN KEY (order_id) REFERENCES sales_orders(order_id),
    CONSTRAINT fk_sales_returns_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_sales_returns_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_sales_returns_processed_by
        FOREIGN KEY (processed_by) REFERENCES users(user_id),
    INDEX idx_sales_returns_store_date (store_id, return_date)
);

CREATE TABLE sales_return_items (
    return_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    return_id BIGINT UNSIGNED NOT NULL,
    order_item_id BIGINT UNSIGNED NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    line_total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    reason VARCHAR(255),
    CONSTRAINT fk_sales_return_items_return
        FOREIGN KEY (return_id) REFERENCES sales_returns(return_id),
    CONSTRAINT fk_sales_return_items_order_item
        FOREIGN KEY (order_item_id) REFERENCES sales_order_items(order_item_id),
    CONSTRAINT fk_sales_return_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE payments (
    payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    return_id BIGINT UNSIGNED NULL,
    payment_type ENUM('SALE', 'REFUND') NOT NULL,
    payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'EWALLET', 'OTHER') NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    reference_no VARCHAR(100),
    note VARCHAR(255),
    paid_at DATETIME NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES sales_orders(order_id),
    CONSTRAINT fk_payments_return
        FOREIGN KEY (return_id) REFERENCES sales_returns(return_id),
    CONSTRAINT fk_payments_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_return (return_id),
    INDEX idx_payments_store_date (store_id, paid_at)
);

-- -----------------------------
-- 7. STOCK TRANSFER
-- -----------------------------
CREATE TABLE stock_transfers (
    transfer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transfer_code VARCHAR(50) NOT NULL UNIQUE,
    from_warehouse_id BIGINT UNSIGNED NOT NULL,
    to_warehouse_id BIGINT UNSIGNED NOT NULL,
    transfer_date DATETIME NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    note VARCHAR(500),
    created_by BIGINT UNSIGNED NOT NULL,
    received_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_transfers_from_wh
        FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_stock_transfers_to_wh
        FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_stock_transfers_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_stock_transfers_received_by
        FOREIGN KEY (received_by) REFERENCES users(user_id),
    INDEX idx_stock_transfers_from_to (from_warehouse_id, to_warehouse_id),
    INDEX idx_stock_transfers_date (transfer_date)
);

CREATE TABLE stock_transfer_items (
    transfer_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transfer_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    CONSTRAINT fk_stock_transfer_items_transfer
        FOREIGN KEY (transfer_id) REFERENCES stock_transfers(transfer_id),
    CONSTRAINT fk_stock_transfer_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- -----------------------------
-- 8. STOCKTAKE
-- -----------------------------
CREATE TABLE stocktakes (
    stocktake_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stocktake_code VARCHAR(50) NOT NULL UNIQUE,
    store_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    stocktake_date DATETIME NOT NULL,
    status ENUM('DRAFT', 'COUNTING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    note VARCHAR(500),
    created_by BIGINT UNSIGNED NOT NULL,
    approved_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stocktakes_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    CONSTRAINT fk_stocktakes_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_stocktakes_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_stocktakes_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(user_id),
    INDEX idx_stocktakes_store_date (store_id, stocktake_date)
);

CREATE TABLE stocktake_items (
    stocktake_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stocktake_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    system_qty DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    actual_qty DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    difference_qty DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    note VARCHAR(255),
    CONSTRAINT fk_stocktake_items_stocktake
        FOREIGN KEY (stocktake_id) REFERENCES stocktakes(stocktake_id),
    CONSTRAINT fk_stocktake_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- -----------------------------
-- 9. INVENTORY TRANSACTIONS
-- -----------------------------
CREATE TABLE inventory_transactions (
    transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    transaction_type ENUM(
        'OPENING',
        'PURCHASE',
        'SALE',
        'SALE_RETURN',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'STOCKTAKE_ADJUST',
        'MANUAL_ADJUST'
    ) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    qty_change DECIMAL(18,3) NOT NULL,
    qty_before DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    qty_after DECIMAL(18,3) NOT NULL DEFAULT 0.000,
    unit_cost DECIMAL(18,2) NULL,
    note VARCHAR(255),
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_transactions_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT fk_inventory_transactions_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    CONSTRAINT fk_inventory_transactions_created_by
        FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_inventory_transactions_wh_variant_date (warehouse_id, variant_id, created_at),
    INDEX idx_inventory_transactions_reference (reference_type, reference_id)
);

-- -----------------------------
-- 10. AUDIT LOGS
-- -----------------------------
CREATE TABLE audit_logs (
    audit_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    store_id BIGINT UNSIGNED NULL,
    action_name VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_data JSON NULL,
    new_data JSON NULL,
    ip_address VARCHAR(45),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_audit_logs_store
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
    INDEX idx_audit_logs_entity (entity_name, entity_id),
    INDEX idx_audit_logs_user_date (user_id, created_at)
);

-- =============================================================================
-- SEED: roles, permissions, role_permissions (đồng bộ backend/sql/auth-roles-permissions-seed.sql)
-- =============================================================================

INSERT INTO roles (role_code, role_name, description, created_at, updated_at) VALUES
  ('SYSTEM_ADMIN', 'System Admin', 'Quản trị toàn hệ thống (JWT/RBAC đầy đủ)', NOW(), NOW()),
  ('ADMIN', 'Admin (legacy)', 'Tương đương quyền cao — giữ tương thích DB cũ', NOW(), NOW()),
  ('STORE_MANAGER', 'Store Manager', 'Quản lý cửa hàng', NOW(), NOW()),
  ('BRANCH_MANAGER', 'Branch Manager', 'Quản lý chi nhánh / vận hành không tạo cửa hàng', NOW(), NOW()),
  ('CASHIER', 'Cashier', 'Thu ngân / nhân viên bán hàng', NOW(), NOW()),
  ('WAREHOUSE_STAFF', 'Warehouse Staff', 'Nhân viên kho', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  description = VALUES(description),
  updated_at = VALUES(updated_at);

INSERT INTO permissions (permission_code, permission_name, module_name, action_name, created_at) VALUES
  ('DASHBOARD_VIEW', 'Vào màn Điều hành', 'DASHBOARD', 'VIEW', NOW()),
  ('RBAC_MANAGE', 'Quản lý ma trận phân quyền (UI)', 'RBAC', 'MANAGE', NOW()),
  ('USER_VIEW', 'Xem người dùng', 'USER', 'VIEW', NOW()),
  ('USER_CREATE', 'Tạo người dùng', 'USER', 'CREATE', NOW()),
  ('USER_UPDATE', 'Sửa người dùng', 'USER', 'UPDATE', NOW()),
  ('USER_LOCK', 'Khóa/mở tài khoản', 'USER', 'LOCK', NOW()),
  ('USER_ASSIGN_BRANCH', 'Gán user vào chi nhánh (trong phạm vi store)', 'USER', 'ASSIGN_BRANCH', NOW()),
  ('ROLE_VIEW', 'Xem vai trò', 'ROLE', 'VIEW', NOW()),
  ('ROLE_CREATE', 'Tạo vai trò', 'ROLE', 'CREATE', NOW()),
  ('ROLE_UPDATE', 'Sửa vai trò', 'ROLE', 'UPDATE', NOW()),
  ('PERMISSION_VIEW', 'Xem quyền', 'PERMISSION', 'VIEW', NOW()),
  ('PERMISSION_ASSIGN', 'Gán quyền cho vai trò (global)', 'PERMISSION', 'ASSIGN', NOW()),
  ('PERMISSION_OVERRIDE_MANAGE', 'Ghi đè quyền theo Store/Branch', 'RBAC', 'OVERRIDE', NOW()),
  ('STORE_VIEW', 'Xem cửa hàng', 'STORE', 'VIEW', NOW()),
  ('STORE_CREATE', 'Tạo cửa hàng', 'STORE', 'CREATE', NOW()),
  ('STORE_UPDATE', 'Sửa cửa hàng', 'STORE', 'UPDATE', NOW()),
  ('BRANCH_VIEW', 'Xem chi nhánh', 'BRANCH', 'VIEW', NOW()),
  ('BRANCH_CREATE', 'Tạo chi nhánh', 'BRANCH', 'CREATE', NOW()),
  ('BRANCH_UPDATE', 'Sửa chi nhánh', 'BRANCH', 'UPDATE', NOW()),
  ('PRODUCT_VIEW', 'Xem sản phẩm', 'PRODUCT', 'VIEW', NOW()),
  ('PRODUCT_CREATE', 'Tạo sản phẩm', 'PRODUCT', 'CREATE', NOW()),
  ('PRODUCT_UPDATE', 'Sửa sản phẩm', 'PRODUCT', 'UPDATE', NOW()),
  ('INVENTORY_VIEW', 'Xem tồn kho', 'INVENTORY', 'VIEW', NOW()),
  ('INVENTORY_TRANSACTION_VIEW', 'Xem lịch sử biến động tồn kho', 'INVENTORY', 'TRANSACTION_VIEW', NOW()),
  ('GOODS_RECEIPT_VIEW', 'Xem phiếu nhập', 'GOODS_RECEIPT', 'VIEW', NOW()),
  ('GOODS_RECEIPT_CREATE', 'Tạo phiếu nhập', 'GOODS_RECEIPT', 'CREATE', NOW()),
  ('GOODS_RECEIPT_CONFIRM', 'Xác nhận phiếu nhập', 'GOODS_RECEIPT', 'CONFIRM', NOW()),
  ('TRANSFER_VIEW', 'Xem chuyển kho', 'TRANSFER', 'VIEW', NOW()),
  ('TRANSFER_CREATE', 'Tạo chuyển kho', 'TRANSFER', 'CREATE', NOW()),
  ('TRANSFER_SEND', 'Gửi chuyển kho', 'TRANSFER', 'SEND', NOW()),
  ('TRANSFER_RECEIVE', 'Nhận chuyển kho', 'TRANSFER', 'RECEIVE', NOW()),
  ('STOCKTAKE_VIEW', 'Xem kiểm kho', 'STOCKTAKE', 'VIEW', NOW()),
  ('STOCKTAKE_CREATE', 'Tạo kiểm kho', 'STOCKTAKE', 'CREATE', NOW()),
  ('STOCKTAKE_CONFIRM', 'Xác nhận kiểm kho', 'STOCKTAKE', 'CONFIRM', NOW()),
  ('ORDER_VIEW', 'Xem đơn hàng', 'ORDER', 'VIEW', NOW()),
  ('ORDER_CREATE', 'Tạo đơn hàng', 'ORDER', 'CREATE', NOW()),
  ('ORDER_CONFIRM', 'Xác nhận đơn hàng', 'ORDER', 'CONFIRM', NOW()),
  ('ORDER_CANCEL', 'Hủy đơn hàng', 'ORDER', 'CANCEL', NOW()),
  ('RETURN_VIEW', 'Xem trả hàng', 'RETURN', 'VIEW', NOW()),
  ('RETURN_CREATE', 'Tạo trả hàng', 'RETURN', 'CREATE', NOW()),
  ('RETURN_CONFIRM', 'Xác nhận trả hàng', 'RETURN', 'CONFIRM', NOW()),
  ('CUSTOMER_VIEW', 'Xem khách hàng', 'CUSTOMER', 'VIEW', NOW()),
  ('CUSTOMER_CREATE', 'Tạo khách hàng', 'CUSTOMER', 'CREATE', NOW()),
  ('CUSTOMER_UPDATE', 'Sửa khách hàng', 'CUSTOMER', 'UPDATE', NOW()),
  ('REPORT_VIEW', 'Xem báo cáo', 'REPORT', 'VIEW', NOW()),
  ('REPORT_VIEW_BRANCH', 'Xem báo cáo theo chi nhánh', 'REPORT', 'VIEW_BRANCH', NOW()),
  ('AUDIT_LOG_VIEW', 'Xem nhật ký kiểm toán', 'AUDIT', 'VIEW', NOW())
ON DUPLICATE KEY UPDATE
  permission_name = VALUES(permission_name),
  module_name = VALUES(module_name),
  action_name = VALUES(action_name);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON 1 = 1
WHERE r.role_code IN ('SYSTEM_ADMIN', 'ADMIN')
ON DUPLICATE KEY UPDATE
  role_id = role_permissions.role_id,
  permission_id = role_permissions.permission_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'DASHBOARD_VIEW', 'STORE_VIEW',
  'USER_VIEW', 'USER_ASSIGN_BRANCH',
  'BRANCH_VIEW', 'BRANCH_CREATE', 'BRANCH_UPDATE',
  'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'INVENTORY_VIEW', 'INVENTORY_TRANSACTION_VIEW',
  'GOODS_RECEIPT_VIEW', 'GOODS_RECEIPT_CREATE', 'GOODS_RECEIPT_CONFIRM',
  'TRANSFER_VIEW', 'TRANSFER_CREATE', 'TRANSFER_SEND', 'TRANSFER_RECEIVE',
  'STOCKTAKE_VIEW', 'STOCKTAKE_CREATE', 'STOCKTAKE_CONFIRM',
  'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_CONFIRM', 'ORDER_CANCEL',
  'RETURN_VIEW', 'RETURN_CREATE', 'RETURN_CONFIRM',
  'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
  'REPORT_VIEW'
)
WHERE r.role_code = 'STORE_MANAGER'
ON DUPLICATE KEY UPDATE
  role_id = role_permissions.role_id,
  permission_id = role_permissions.permission_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'DASHBOARD_VIEW', 'STORE_VIEW', 'BRANCH_VIEW',
  'PRODUCT_VIEW', 'INVENTORY_VIEW', 'INVENTORY_TRANSACTION_VIEW',
  'GOODS_RECEIPT_VIEW', 'GOODS_RECEIPT_CREATE', 'GOODS_RECEIPT_CONFIRM',
  'TRANSFER_VIEW', 'TRANSFER_CREATE', 'TRANSFER_SEND', 'TRANSFER_RECEIVE',
  'STOCKTAKE_VIEW', 'STOCKTAKE_CREATE', 'STOCKTAKE_CONFIRM',
  'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_CONFIRM', 'ORDER_CANCEL',
  'RETURN_VIEW', 'RETURN_CREATE', 'RETURN_CONFIRM',
  'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
  'REPORT_VIEW_BRANCH'
)
WHERE r.role_code = 'BRANCH_MANAGER'
ON DUPLICATE KEY UPDATE
  role_id = role_permissions.role_id,
  permission_id = role_permissions.permission_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'PRODUCT_VIEW', 'INVENTORY_VIEW',
  'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_CONFIRM',
  'CUSTOMER_VIEW', 'CUSTOMER_CREATE'
)
WHERE r.role_code = 'CASHIER'
ON DUPLICATE KEY UPDATE
  role_id = role_permissions.role_id,
  permission_id = role_permissions.permission_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'PRODUCT_VIEW', 'INVENTORY_VIEW', 'INVENTORY_TRANSACTION_VIEW',
  'GOODS_RECEIPT_VIEW', 'GOODS_RECEIPT_CREATE', 'GOODS_RECEIPT_CONFIRM',
  'TRANSFER_VIEW', 'TRANSFER_CREATE', 'TRANSFER_SEND', 'TRANSFER_RECEIVE',
  'STOCKTAKE_VIEW', 'STOCKTAKE_CREATE', 'STOCKTAKE_CONFIRM'
)
WHERE r.role_code = 'WAREHOUSE_STAFF'
ON DUPLICATE KEY UPDATE
  role_id = role_permissions.role_id,
  permission_id = role_permissions.permission_id;

-- =============================================================================
-- Hoàn tất. (Đăng ký user đầu tiên qua API /api/auth/register hoặc insert thủ công.)
-- =============================================================================
