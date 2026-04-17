-- =============================================================================
-- MySQL — nâng cấp schema trên DB đã tồn tại (idempotent, chạy lại an toàn).
-- Gộp từ: branches phone/email + products.store_id (đa tenant catalog).
--
-- Cài mới hoặc reset sạch: dùng Docx/sql/DataBase.sql (đã gồm đủ định nghĩa).
-- =============================================================================

SET @db := DATABASE();

-- ---------------------------------------------------------------------------
-- 1) branches: email, phone (khớp DataBase.sql + entity Branch)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'email'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE branches ADD COLUMN email VARCHAR(100) NULL',
  'SELECT ''skip: branches.email already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'phone'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE branches ADD COLUMN phone VARCHAR(20) NULL',
  'SELECT ''skip: branches.phone already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2) products: store_id + FK + index
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE products ADD COLUMN store_id BIGINT UNSIGNED NULL COMMENT ''Cửa hàng sở hữu catalog'' AFTER unit_id',
  'SELECT ''skip: products.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE products p
SET p.store_id = (SELECT MIN(s.store_id) FROM stores s)
WHERE p.store_id IS NULL;

ALTER TABLE products
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'products'
    AND CONSTRAINT_NAME = 'fk_products_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_products_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_store_id'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX idx_products_store_id ON products (store_id)',
  'SELECT ''skip: idx_products_store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 3) brands: store_id + FK + unique(store_id, brand_code)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'brands' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE brands ADD COLUMN store_id BIGINT UNSIGNED NULL AFTER brand_id',
  'SELECT ''skip: brands.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE brands b
SET b.store_id = COALESCE(
  (SELECT MIN(p.store_id) FROM products p WHERE p.brand_id = b.brand_id AND p.store_id IS NOT NULL),
  (SELECT MIN(s.store_id) FROM stores s)
)
WHERE b.store_id IS NULL;

ALTER TABLE brands
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'brands' AND INDEX_NAME = 'brand_code' AND NON_UNIQUE = 0
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE brands DROP INDEX brand_code',
  'SELECT ''skip: brands.brand_code unique already dropped'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'brands' AND INDEX_NAME = 'uk_brands_store_code'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE brands ADD UNIQUE KEY uk_brands_store_code (store_id, brand_code)',
  'SELECT ''skip: uk_brands_store_code already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'brands'
    AND CONSTRAINT_NAME = 'fk_brands_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE brands ADD CONSTRAINT fk_brands_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_brands_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 4) categories: store_id + FK + unique(store_id, category_code)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE categories ADD COLUMN store_id BIGINT UNSIGNED NULL AFTER category_id',
  'SELECT ''skip: categories.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE categories c
SET c.store_id = COALESCE(
  (SELECT MIN(p.store_id) FROM products p WHERE p.category_id = c.category_id AND p.store_id IS NOT NULL),
  (SELECT MIN(s.store_id) FROM stores s)
)
WHERE c.store_id IS NULL;

ALTER TABLE categories
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'categories' AND INDEX_NAME = 'category_code' AND NON_UNIQUE = 0
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE categories DROP INDEX category_code',
  'SELECT ''skip: categories.category_code unique already dropped'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'categories' AND INDEX_NAME = 'uk_categories_store_code'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE categories ADD UNIQUE KEY uk_categories_store_code (store_id, category_code)',
  'SELECT ''skip: uk_categories_store_code already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'categories'
    AND CONSTRAINT_NAME = 'fk_categories_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE categories ADD CONSTRAINT fk_categories_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_categories_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 5) units: store_id + FK + unique(store_id, unit_code)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'units' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE units ADD COLUMN store_id BIGINT UNSIGNED NULL AFTER unit_id',
  'SELECT ''skip: units.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE units u
SET u.store_id = COALESCE(
  (SELECT MIN(p.store_id) FROM products p WHERE p.unit_id = u.unit_id AND p.store_id IS NOT NULL),
  (SELECT MIN(s.store_id) FROM stores s)
)
WHERE u.store_id IS NULL;

ALTER TABLE units
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'units' AND INDEX_NAME = 'unit_code' AND NON_UNIQUE = 0
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE units DROP INDEX unit_code',
  'SELECT ''skip: units.unit_code unique already dropped'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'units' AND INDEX_NAME = 'uk_units_store_code'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE units ADD UNIQUE KEY uk_units_store_code (store_id, unit_code)',
  'SELECT ''skip: uk_units_store_code already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'units'
    AND CONSTRAINT_NAME = 'fk_units_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE units ADD CONSTRAINT fk_units_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_units_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 6) suppliers: store_id + FK + unique(store_id, supplier_code)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE suppliers ADD COLUMN store_id BIGINT UNSIGNED NULL AFTER supplier_id',
  'SELECT ''skip: suppliers.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE suppliers s
SET s.store_id = COALESCE(
  (SELECT MIN(gr.store_id) FROM goods_receipts gr WHERE gr.supplier_id = s.supplier_id AND gr.store_id IS NOT NULL),
  (SELECT MIN(st.store_id) FROM stores st)
)
WHERE s.store_id IS NULL;

ALTER TABLE suppliers
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'suppliers' AND INDEX_NAME = 'supplier_code' AND NON_UNIQUE = 0
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE suppliers DROP INDEX supplier_code',
  'SELECT ''skip: suppliers.supplier_code unique already dropped'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'suppliers' AND INDEX_NAME = 'uk_suppliers_store_code'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE suppliers ADD UNIQUE KEY uk_suppliers_store_code (store_id, supplier_code)',
  'SELECT ''skip: uk_suppliers_store_code already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'suppliers'
    AND CONSTRAINT_NAME = 'fk_suppliers_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_suppliers_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
