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
