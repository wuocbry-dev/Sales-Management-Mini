-- Khớp entity Branch + Docx/sql/DataBase.sql (MySQL).
-- Idempotent: chạy lại nhiều lần không lỗi 1060 Duplicate column.

SET @db := DATABASE();

-- branches.email
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

-- branches.phone
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
