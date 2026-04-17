-- =============================================================================
-- MySQL migration — tenant isolation for customers and product variants.
-- - customers: add store ownership + per-store unique code
-- - sales_orders/sales_returns: customer FK -> (customer_id, store_id)
-- - products/product_variants: per-store unique constraints and variant ownership
--
-- This script is idempotent and safe to rerun.
-- Prerequisite: products.store_id exists (run 20260411_schema_mysql.sql first if needed).
-- =============================================================================

SET @db := DATABASE();

-- ---------------------------------------------------------------------------
-- 1) customers: add store_id + backfill + constraints
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE customers ADD COLUMN store_id BIGINT UNSIGNED NULL AFTER customer_id',
  'SELECT ''skip: customers.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE customers c
SET c.store_id = COALESCE(
  (
    SELECT MIN(src.store_id)
    FROM (
      SELECT so.store_id AS store_id
      FROM sales_orders so
      WHERE so.customer_id = c.customer_id
      UNION ALL
      SELECT sr.store_id AS store_id
      FROM sales_returns sr
      WHERE sr.customer_id = c.customer_id
    ) src
  ),
  (SELECT MIN(s.store_id) FROM stores s)
)
WHERE c.store_id IS NULL;

-- Keep data consistent before adding composite FK by removing cross-store links.
UPDATE sales_orders so
JOIN customers c ON c.customer_id = so.customer_id
SET so.customer_id = NULL
WHERE so.customer_id IS NOT NULL
  AND c.store_id <> so.store_id;

UPDATE sales_returns sr
JOIN customers c ON c.customer_id = sr.customer_id
SET sr.customer_id = NULL
WHERE sr.customer_id IS NOT NULL
  AND c.store_id <> sr.store_id;

ALTER TABLE customers
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @drop_idx := (
  SELECT x.index_name
  FROM (
    SELECT
      s.INDEX_NAME AS index_name,
      MAX(s.NON_UNIQUE) AS non_unique,
      COUNT(*) AS col_count,
      SUM(CASE WHEN s.COLUMN_NAME = 'customer_code' THEN 1 ELSE 0 END) AS has_customer_code
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = @db
      AND s.TABLE_NAME = 'customers'
      AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
  ) x
  WHERE x.non_unique = 0
    AND x.col_count = 1
    AND x.has_customer_code = 1
  LIMIT 1
);
SET @sql := IF(
  @drop_idx IS NOT NULL AND @drop_idx <> 'uk_customers_store_code',
  CONCAT('ALTER TABLE customers DROP INDEX `', @drop_idx, '`'),
  'SELECT ''skip: no legacy unique index on customers.customer_code'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers' AND INDEX_NAME = 'uk_customers_store_code'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE customers ADD UNIQUE KEY uk_customers_store_code (store_id, customer_code)',
  'SELECT ''skip: uk_customers_store_code already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customers' AND INDEX_NAME = 'idx_customers_id_store'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX idx_customers_id_store ON customers (customer_id, store_id)',
  'SELECT ''skip: idx_customers_id_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'customers'
    AND CONSTRAINT_NAME = 'fk_customers_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE customers ADD CONSTRAINT fk_customers_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_customers_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2) sales_orders: customer FK -> (customer_id, store_id)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'sales_orders'
    AND CONSTRAINT_NAME = 'fk_sales_orders_customer'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE sales_orders DROP FOREIGN KEY fk_sales_orders_customer',
  'SELECT ''skip: fk_sales_orders_customer not found'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'sales_orders'
    AND INDEX_NAME = 'idx_sales_orders_customer'
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE sales_orders DROP INDEX idx_sales_orders_customer',
  'SELECT ''skip: idx_sales_orders_customer not found'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'sales_orders'
    AND INDEX_NAME = 'idx_sales_orders_customer_store'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX idx_sales_orders_customer_store ON sales_orders (customer_id, store_id)',
  'SELECT ''skip: idx_sales_orders_customer_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'sales_orders'
    AND CONSTRAINT_NAME = 'fk_sales_orders_customer'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE sales_orders ADD CONSTRAINT fk_sales_orders_customer FOREIGN KEY (customer_id, store_id) REFERENCES customers (customer_id, store_id)',
  'SELECT ''skip: fk_sales_orders_customer already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 3) sales_returns: customer FK -> (customer_id, store_id)
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'sales_returns'
    AND CONSTRAINT_NAME = 'fk_sales_returns_customer'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE sales_returns DROP FOREIGN KEY fk_sales_returns_customer',
  'SELECT ''skip: fk_sales_returns_customer not found'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'sales_returns'
    AND INDEX_NAME = 'fk_sales_returns_customer'
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE sales_returns DROP INDEX fk_sales_returns_customer',
  'SELECT ''skip: fk_sales_returns_customer index not found'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'sales_returns'
    AND INDEX_NAME = 'idx_sales_returns_customer_store'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX idx_sales_returns_customer_store ON sales_returns (customer_id, store_id)',
  'SELECT ''skip: idx_sales_returns_customer_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'sales_returns'
    AND CONSTRAINT_NAME = 'fk_sales_returns_customer'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE sales_returns ADD CONSTRAINT fk_sales_returns_customer FOREIGN KEY (customer_id, store_id) REFERENCES customers (customer_id, store_id)',
  'SELECT ''skip: fk_sales_returns_customer already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 4) products: unique(product_code) -> unique(store_id, product_code)
-- ---------------------------------------------------------------------------
SET @drop_idx := (
  SELECT x.index_name
  FROM (
    SELECT
      s.INDEX_NAME AS index_name,
      MAX(s.NON_UNIQUE) AS non_unique,
      COUNT(*) AS col_count,
      SUM(CASE WHEN s.COLUMN_NAME = 'product_code' THEN 1 ELSE 0 END) AS has_product_code
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = @db
      AND s.TABLE_NAME = 'products'
      AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
  ) x
  WHERE x.non_unique = 0
    AND x.col_count = 1
    AND x.has_product_code = 1
  LIMIT 1
);
SET @sql := IF(
  @drop_idx IS NOT NULL AND @drop_idx <> 'uk_products_store_code',
  CONCAT('ALTER TABLE products DROP INDEX `', @drop_idx, '`'),
  'SELECT ''skip: no legacy unique index on products.product_code'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND INDEX_NAME = 'uk_products_store_code'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE products ADD UNIQUE KEY uk_products_store_code (store_id, product_code)',
  'SELECT ''skip: uk_products_store_code already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_id_store'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX idx_products_id_store ON products (product_id, store_id)',
  'SELECT ''skip: idx_products_id_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 5) product_variants: store ownership + per-store unique + composite FK
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'store_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE product_variants ADD COLUMN store_id BIGINT UNSIGNED NULL AFTER product_id',
  'SELECT ''skip: product_variants.store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE product_variants v
JOIN products p ON p.product_id = v.product_id
SET v.store_id = p.store_id
WHERE v.store_id IS NULL;

UPDATE product_variants v
SET v.store_id = (SELECT MIN(s.store_id) FROM stores s)
WHERE v.store_id IS NULL;

ALTER TABLE product_variants
  MODIFY COLUMN store_id BIGINT UNSIGNED NOT NULL;

SET @drop_idx := (
  SELECT x.index_name
  FROM (
    SELECT
      s.INDEX_NAME AS index_name,
      MAX(s.NON_UNIQUE) AS non_unique,
      COUNT(*) AS col_count,
      SUM(CASE WHEN s.COLUMN_NAME = 'sku' THEN 1 ELSE 0 END) AS has_sku
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = @db
      AND s.TABLE_NAME = 'product_variants'
      AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
  ) x
  WHERE x.non_unique = 0
    AND x.col_count = 1
    AND x.has_sku = 1
  LIMIT 1
);
SET @sql := IF(
  @drop_idx IS NOT NULL AND @drop_idx <> 'uk_product_variants_store_sku',
  CONCAT('ALTER TABLE product_variants DROP INDEX `', @drop_idx, '`'),
  'SELECT ''skip: no legacy unique index on product_variants.sku'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_idx := (
  SELECT x.index_name
  FROM (
    SELECT
      s.INDEX_NAME AS index_name,
      MAX(s.NON_UNIQUE) AS non_unique,
      COUNT(*) AS col_count,
      SUM(CASE WHEN s.COLUMN_NAME = 'barcode' THEN 1 ELSE 0 END) AS has_barcode
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = @db
      AND s.TABLE_NAME = 'product_variants'
      AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
  ) x
  WHERE x.non_unique = 0
    AND x.col_count = 1
    AND x.has_barcode = 1
  LIMIT 1
);
SET @sql := IF(
  @drop_idx IS NOT NULL AND @drop_idx <> 'uk_product_variants_store_barcode',
  CONCAT('ALTER TABLE product_variants DROP INDEX `', @drop_idx, '`'),
  'SELECT ''skip: no legacy unique index on product_variants.barcode'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'product_variants'
    AND INDEX_NAME = 'uk_product_variants_store_sku'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE product_variants ADD UNIQUE KEY uk_product_variants_store_sku (store_id, sku)',
  'SELECT ''skip: uk_product_variants_store_sku already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'product_variants'
    AND INDEX_NAME = 'uk_product_variants_store_barcode'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE product_variants ADD UNIQUE KEY uk_product_variants_store_barcode (store_id, barcode)',
  'SELECT ''skip: uk_product_variants_store_barcode already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'product_variants'
    AND INDEX_NAME = 'idx_product_variants_product_store'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX idx_product_variants_product_store ON product_variants (product_id, store_id)',
  'SELECT ''skip: idx_product_variants_product_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'product_variants'
    AND INDEX_NAME = 'fk_product_variants_store'
);
SET @sql := IF(
  @exists = 0,
  'CREATE INDEX fk_product_variants_store ON product_variants (store_id)',
  'SELECT ''skip: fk_product_variants_store index already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_fk := (
  SELECT x.constraint_name
  FROM (
    SELECT
      k.CONSTRAINT_NAME AS constraint_name,
      COUNT(*) AS col_count,
      SUM(CASE WHEN k.COLUMN_NAME = 'product_id' THEN 1 ELSE 0 END) AS has_product_id
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.TABLE_CONSTRAINTS tc
      ON tc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      AND tc.TABLE_NAME = k.TABLE_NAME
      AND tc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
      AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
    WHERE k.TABLE_SCHEMA = @db
      AND k.TABLE_NAME = 'product_variants'
      AND k.REFERENCED_TABLE_NAME = 'products'
    GROUP BY k.CONSTRAINT_NAME
  ) x
  WHERE x.col_count = 1
    AND x.has_product_id = 1
  LIMIT 1
);
SET @sql := IF(
  @drop_fk IS NOT NULL AND @drop_fk <> 'fk_product_variants_product_store',
  CONCAT('ALTER TABLE product_variants DROP FOREIGN KEY `', @drop_fk, '`'),
  'SELECT ''skip: no legacy FK product_variants(product_id)->products(product_id)'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'product_variants'
    AND CONSTRAINT_NAME = 'fk_product_variants_product_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE product_variants ADD CONSTRAINT fk_product_variants_product_store FOREIGN KEY (product_id, store_id) REFERENCES products (product_id, store_id)',
  'SELECT ''skip: fk_product_variants_product_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db
    AND TABLE_NAME = 'product_variants'
    AND CONSTRAINT_NAME = 'fk_product_variants_store'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE product_variants ADD CONSTRAINT fk_product_variants_store FOREIGN KEY (store_id) REFERENCES stores (store_id)',
  'SELECT ''skip: fk_product_variants_store already exists'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 6) sanity check output
-- ---------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM customers WHERE store_id IS NULL) AS customers_missing_store,
  (SELECT COUNT(*) FROM product_variants WHERE store_id IS NULL) AS variants_missing_store,
  (SELECT COUNT(*)
   FROM sales_orders so
   JOIN customers c ON c.customer_id = so.customer_id
   WHERE so.customer_id IS NOT NULL AND c.store_id <> so.store_id) AS sales_orders_cross_store_customer,
  (SELECT COUNT(*)
   FROM sales_returns sr
   JOIN customers c ON c.customer_id = sr.customer_id
   WHERE sr.customer_id IS NOT NULL AND c.store_id <> sr.store_id) AS sales_returns_cross_store_customer;
