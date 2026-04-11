-- =============================================================================
-- MySQL — inventories: unique theo (warehouse_id, variant_id).
--
-- Schema cũ (vd. Docx/sql/12.sql): uk_inventories_store_variant (store_id, variant_id)
-- → chỉ một dòng tồn cho mỗi biến thể trong cả cửa hàng, chuyển kho sang kho khác
--   bị lỗi Duplicate entry ... khi "Nhập kho nhận".
--
-- Chuẩn ứng dụng: tồn theo từng kho (GoodsReceiptService, StockTransferService.receive, …).
-- Nên chạy trên DB thật sau backup. Idempotent.
--
-- Lưu ý MySQL 1553: FK `fk_inventories_store` (store_id) thường “bám” vào
-- uk_inventories_store_variant. Phải tạo index thay trên store_id TRƯỚC khi DROP unique.
-- =============================================================================

SET @db := DATABASE();

-- 0) Index store_id — để DROP uk_inventories_store_variant không bị Error 1553
SET @ix0 := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'inventories'
    AND INDEX_NAME = 'idx_inventories_store_id'
);
SET @sql0 := IF(
  @ix0 = 0,
  'CREATE INDEX idx_inventories_store_id ON inventories (store_id)',
  'SELECT ''skip: idx_inventories_store_id already exists'' AS migration_note'
);
PREPARE stmt FROM @sql0;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1) Gỡ unique sai (store + variant)
SET @ix := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'inventories'
    AND INDEX_NAME = 'uk_inventories_store_variant'
);
SET @sql := IF(
  @ix > 0,
  'ALTER TABLE inventories DROP INDEX uk_inventories_store_variant',
  'SELECT ''skip: uk_inventories_store_variant not found'' AS migration_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Thêm unique đúng (kho + variant)
SET @ix2 := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'inventories'
    AND INDEX_NAME = 'uk_inventories_warehouse_variant'
);
SET @sql2 := IF(
  @ix2 = 0,
  'ALTER TABLE inventories ADD UNIQUE KEY uk_inventories_warehouse_variant (warehouse_id, variant_id)',
  'SELECT ''skip: uk_inventories_warehouse_variant already exists'' AS migration_note'
);
PREPARE stmt FROM @sql2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
