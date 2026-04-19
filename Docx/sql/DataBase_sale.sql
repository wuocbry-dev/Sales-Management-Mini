-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: sales_management_mini
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Drop all tables first (consolidated at top)
--
DROP TABLE IF EXISTS `sales_return_items`;
DROP TABLE IF EXISTS `goods_receipt_items`;
DROP TABLE IF EXISTS `stock_transfer_items`;
DROP TABLE IF EXISTS `stocktake_items`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `role_permission_overrides`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `user_branches`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `user_stores`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `inventory_transactions`;
DROP TABLE IF EXISTS `inventories`;
DROP TABLE IF EXISTS `goods_receipts`;
DROP TABLE IF EXISTS `sales_returns`;
DROP TABLE IF EXISTS `sales_order_items`;
DROP TABLE IF EXISTS `sales_orders`;
DROP TABLE IF EXISTS `stock_transfers`;
DROP TABLE IF EXISTS `stocktakes`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `brands`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `units`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `warehouses`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `stores`;

--
-- Table structure for table `audit_logs`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `store_id` bigint unsigned DEFAULT NULL,
  `action_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_log_id`),
  KEY `fk_audit_logs_store` (`store_id`),
  KEY `idx_audit_logs_entity` (`entity_name`,`entity_id`),
  KEY `idx_audit_logs_user_date` (`user_id`,`created_at`),
  CONSTRAINT `fk_audit_logs_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `branch_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `branch_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `uk_branches_store_code` (`store_id`,`branch_code`),
  CONSTRAINT `fk_branches_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,1,'CN01','Ministop Lê Văn Việt','0333456789','11/7','ACTIVE','2026-04-17 19:23:22','2026-04-17 19:23:22','ministoplevanviet@gmail.com'),(2,1,'CN02','Ministop Phạm Văn Đồng','0334567899','12/17','ACTIVE','2026-04-17 19:24:23','2026-04-17 19:24:23','ministopphamvandong@gmail.com'),(3,2,'CN01','Circlek Võ Văn Ngân','0987654321','15/13','ACTIVE','2026-04-17 19:32:40','2026-04-17 19:32:40','circlekcn1@gmail.com'),(4,2,'CN02','Circlek Võ Nguyên Giáp','0897654321','13/12','ACTIVE','2026-04-17 19:33:28','2026-04-17 19:33:28','circlekcn2@gmail.com');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `brand_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `brand_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`brand_id`),
  UNIQUE KEY `uk_brands_store_code` (`store_id`,`brand_code`),
  KEY `fk_brands_store` (`store_id`),
  CONSTRAINT `fk_brands_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `category_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_categories_store_code` (`store_id`,`category_code`),
  KEY `fk_categories_store` (`store_id`),
  KEY `fk_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `customer_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loyalty_points` int unsigned NOT NULL DEFAULT '0',
  `total_spent` decimal(18,4) NOT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uk_customers_store_code` (`store_id`,`customer_code`),
  KEY `idx_customers_phone` (`phone`),
  KEY `idx_customers_id_store` (`customer_id`,`store_id`),
  KEY `fk_customers_store` (`store_id`),
  CONSTRAINT `fk_customers_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_receipt_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipt_items` (
  `receipt_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `receipt_id` bigint unsigned NOT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `quantity` decimal(18,4) NOT NULL,
  `unit_cost` decimal(18,4) NOT NULL,
  `discount_amount` decimal(18,4) NOT NULL,
  `line_total` decimal(18,4) NOT NULL,
  PRIMARY KEY (`receipt_item_id`),
  KEY `fk_goods_receipt_items_receipt` (`receipt_id`),
  KEY `fk_goods_receipt_items_variant` (`variant_id`),
  CONSTRAINT `fk_goods_receipt_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts` (`receipt_id`),
  CONSTRAINT `fk_goods_receipt_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_receipt_items`
--

LOCK TABLES `goods_receipt_items` WRITE;
/*!40000 ALTER TABLE `goods_receipt_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipt_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_receipts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipts` (
  `receipt_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `receipt_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_id` bigint unsigned NOT NULL,
  `supplier_id` bigint unsigned DEFAULT NULL,
  `receipt_date` datetime NOT NULL,
  `status` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(18,4) NOT NULL,
  `discount_amount` decimal(18,4) NOT NULL,
  `total_amount` decimal(18,4) NOT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `warehouse_id` bigint NOT NULL,
  PRIMARY KEY (`receipt_id`),
  UNIQUE KEY `receipt_code` (`receipt_code`),
  KEY `fk_goods_receipts_supplier` (`supplier_id`),
  KEY `fk_goods_receipts_created_by` (`created_by`),
  KEY `fk_goods_receipts_approved_by` (`approved_by`),
  KEY `idx_goods_receipts_store_date` (`store_id`,`receipt_date`),
  CONSTRAINT `fk_goods_receipts_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_goods_receipts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_goods_receipts_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_goods_receipts_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_receipts`
--

LOCK TABLES `goods_receipts` WRITE;
/*!40000 ALTER TABLE `goods_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventories`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventories` (
  `inventory_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `quantity_on_hand` decimal(18,4) NOT NULL,
  `reserved_qty` decimal(18,4) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `warehouse_id` bigint NOT NULL,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `uk_inventories_warehouse_variant` (`warehouse_id`,`variant_id`),
  KEY `fk_inventories_variant` (`variant_id`),
  KEY `idx_inventories_store_id` (`store_id`),
  CONSTRAINT `fk_inventories_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_inventories_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventories`
--

LOCK TABLES `inventories` WRITE;
/*!40000 ALTER TABLE `inventories` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `transaction_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `transaction_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `qty_change` decimal(18,4) NOT NULL,
  `qty_before` decimal(18,4) NOT NULL,
  `qty_after` decimal(18,4) NOT NULL,
  `unit_cost` decimal(18,4) DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `warehouse_id` bigint NOT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `fk_inventory_transactions_variant` (`variant_id`),
  KEY `fk_inventory_transactions_created_by` (`created_by`),
  KEY `idx_inventory_transactions_store_variant_date` (`store_id`,`variant_id`,`created_at`),
  KEY `idx_inventory_transactions_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_inventory_transactions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_inventory_transactions_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_inventory_transactions_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `return_id` bigint unsigned DEFAULT NULL,
  `payment_type` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `reference_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payments_created_by` (`created_by`),
  KEY `idx_payments_order` (`order_id`),
  KEY `idx_payments_return` (`return_id`),
  KEY `idx_payments_store_date` (`store_id`,`paid_at`),
  CONSTRAINT `fk_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `sales_orders` (`order_id`),
  CONSTRAINT `fk_payments_return` FOREIGN KEY (`return_id`) REFERENCES `sales_returns` (`return_id`),
  CONSTRAINT `fk_payments_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `permission_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `permission_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'DASHBOARD_VIEW','Vào màn Điều hành','DASHBOARD','VIEW','2026-04-17 18:52:03'),(2,'RBAC_MANAGE','Quản lý ma trận phân quyền (UI)','RBAC','MANAGE','2026-04-17 18:52:03'),(3,'USER_VIEW','Xem người dùng','USER','VIEW','2026-04-17 18:52:03'),(4,'USER_CREATE','Tạo người dùng','USER','CREATE','2026-04-17 18:52:03'),(5,'USER_UPDATE','Sửa người dùng','USER','UPDATE','2026-04-17 18:52:03'),(6,'USER_LOCK','Khóa/mở tài khoản','USER','LOCK','2026-04-17 18:52:03'),(7,'USER_ASSIGN_BRANCH','Gán user vào chi nhánh (trong phạm vi store)','USER','ASSIGN_BRANCH','2026-04-17 18:52:03'),(8,'ROLE_VIEW','Xem vai trò','ROLE','VIEW','2026-04-17 18:52:03'),(9,'ROLE_CREATE','Tạo vai trò','ROLE','CREATE','2026-04-17 18:52:03'),(10,'ROLE_UPDATE','Sửa vai trò','ROLE','UPDATE','2026-04-17 18:52:03'),(11,'PERMISSION_VIEW','Xem quyền','PERMISSION','VIEW','2026-04-17 18:52:03'),(12,'PERMISSION_ASSIGN','Gán quyền cho vai trò (global)','PERMISSION','ASSIGN','2026-04-17 18:52:03'),(13,'PERMISSION_OVERRIDE_MANAGE','Ghi đè quyền theo Store/Branch','RBAC','OVERRIDE','2026-04-17 18:52:03'),(14,'STORE_VIEW','Xem cửa hàng','STORE','VIEW','2026-04-17 18:52:03'),(15,'STORE_CREATE','Tạo cửa hàng','STORE','CREATE','2026-04-17 18:52:03'),(16,'STORE_UPDATE','Sửa cửa hàng','STORE','UPDATE','2026-04-17 18:52:03'),(17,'BRANCH_VIEW','Xem chi nhánh','BRANCH','VIEW','2026-04-17 18:52:03'),(18,'BRANCH_CREATE','Tạo chi nhánh','BRANCH','CREATE','2026-04-17 18:52:03'),(19,'BRANCH_UPDATE','Sửa chi nhánh','BRANCH','UPDATE','2026-04-17 18:52:03'),(20,'PRODUCT_VIEW','Xem sản phẩm','PRODUCT','VIEW','2026-04-17 18:52:03'),(21,'PRODUCT_CREATE','Tạo sản phẩm','PRODUCT','CREATE','2026-04-17 18:52:03'),(22,'PRODUCT_UPDATE','Sửa sản phẩm','PRODUCT','UPDATE','2026-04-17 18:52:03'),(23,'INVENTORY_VIEW','Xem tồn kho','INVENTORY','VIEW','2026-04-17 18:52:03'),(24,'INVENTORY_TRANSACTION_VIEW','Xem lịch sử biến động tồn kho','INVENTORY','TRANSACTION_VIEW','2026-04-17 18:52:03'),(25,'GOODS_RECEIPT_VIEW','Xem phiếu nhập','GOODS_RECEIPT','VIEW','2026-04-17 18:52:03'),(26,'GOODS_RECEIPT_CREATE','Tạo phiếu nhập','GOODS_RECEIPT','CREATE','2026-04-17 18:52:03'),(27,'GOODS_RECEIPT_CONFIRM','Xác nhận phiếu nhập','GOODS_RECEIPT','CONFIRM','2026-04-17 18:52:03'),(28,'TRANSFER_VIEW','Xem chuyển kho','TRANSFER','VIEW','2026-04-17 18:52:03'),(29,'TRANSFER_CREATE','Tạo chuyển kho','TRANSFER','CREATE','2026-04-17 18:52:03'),(30,'TRANSFER_SEND','Gửi chuyển kho','TRANSFER','SEND','2026-04-17 18:52:03'),(31,'TRANSFER_RECEIVE','Nhận chuyển kho','TRANSFER','RECEIVE','2026-04-17 18:52:03'),(32,'STOCKTAKE_VIEW','Xem kiểm kho','STOCKTAKE','VIEW','2026-04-17 18:52:03'),(33,'STOCKTAKE_CREATE','Tạo kiểm kho','STOCKTAKE','CREATE','2026-04-17 18:52:03'),(34,'STOCKTAKE_CONFIRM','Xác nhận kiểm kho','STOCKTAKE','CONFIRM','2026-04-17 18:52:03'),(35,'ORDER_VIEW','Xem đơn hàng','ORDER','VIEW','2026-04-17 18:52:03'),(36,'ORDER_CREATE','Tạo đơn hàng','ORDER','CREATE','2026-04-17 18:52:03'),(37,'ORDER_CONFIRM','Xác nhận đơn hàng','ORDER','CONFIRM','2026-04-17 18:52:03'),(38,'ORDER_CANCEL','Hủy đơn hàng','ORDER','CANCEL','2026-04-17 18:52:03'),(39,'RETURN_VIEW','Xem trả hàng','RETURN','VIEW','2026-04-17 18:52:03'),(40,'RETURN_CREATE','Tạo trả hàng','RETURN','CREATE','2026-04-17 18:52:03'),(41,'RETURN_CONFIRM','Xác nhận trả hàng','RETURN','CONFIRM','2026-04-17 18:52:03'),(42,'CUSTOMER_VIEW','Xem khách hàng','CUSTOMER','VIEW','2026-04-17 18:52:03'),(43,'CUSTOMER_CREATE','Tạo khách hàng','CUSTOMER','CREATE','2026-04-17 18:52:03'),(44,'CUSTOMER_UPDATE','Sửa khách hàng','CUSTOMER','UPDATE','2026-04-17 18:52:03'),(45,'REPORT_VIEW','Xem báo cáo','REPORT','VIEW','2026-04-17 18:52:03'),(46,'REPORT_VIEW_BRANCH','Xem báo cáo theo chi nhánh','REPORT','VIEW_BRANCH','2026-04-17 18:52:03'),(47,'AUDIT_LOG_VIEW','Xem nhật ký kiểm toán','AUDIT','VIEW','2026-04-17 18:52:03');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `image_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `sort_order` int NOT NULL,
  `content_type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  UNIQUE KEY `uk_product_images_product_sort` (`product_id`,`sort_order`),
  UNIQUE KEY `UKm7r031lu8daaqed7x7pieljur` (`product_id`,`sort_order`),
  KEY `idx_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `variant_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `store_id` bigint unsigned NOT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variant_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attributes_json` json DEFAULT NULL,
  `cost_price` decimal(18,4) NOT NULL,
  `selling_price` decimal(18,4) NOT NULL,
  `reorder_level` decimal(18,4) NOT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`variant_id`),
  UNIQUE KEY `uk_product_variants_store_sku` (`store_id`,`sku`),
  UNIQUE KEY `uk_product_variants_store_barcode` (`store_id`,`barcode`),
  KEY `idx_product_variants_product_store` (`product_id`,`store_id`),
  KEY `fk_product_variants_store` (`store_id`),
  CONSTRAINT `fk_product_variants_product_store` FOREIGN KEY (`product_id`, `store_id`) REFERENCES `products` (`product_id`, `store_id`),
  CONSTRAINT `fk_product_variants_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned DEFAULT NULL,
  `brand_id` bigint unsigned DEFAULT NULL,
  `unit_id` bigint unsigned DEFAULT NULL,
  `store_id` bigint unsigned NOT NULL COMMENT 'Store owning product catalog',
  `product_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_type` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_variant` tinyint(1) NOT NULL DEFAULT '0',
  `track_inventory` tinyint(1) NOT NULL DEFAULT '1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uk_products_store_code` (`store_id`,`product_code`),
  KEY `fk_products_category` (`category_id`),
  KEY `fk_products_brand` (`brand_id`),
  KEY `fk_products_unit` (`unit_id`),
  KEY `idx_products_store_id` (`store_id`),
  KEY `idx_products_id_store` (`product_id`,`store_id`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`brand_id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `fk_products_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_products_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permission_overrides`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission_overrides` (
  `override_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `store_id` bigint unsigned DEFAULT NULL,
  `branch_id` bigint unsigned DEFAULT NULL,
  `override_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`override_id`),
  KEY `fk_rpo_permission` (`permission_id`),
  KEY `fk_rpo_branch` (`branch_id`),
  KEY `idx_rpo_role` (`role_id`),
  KEY `idx_rpo_scope` (`store_id`,`branch_id`),
  CONSTRAINT `fk_rpo_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  CONSTRAINT `fk_rpo_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`),
  CONSTRAINT `fk_rpo_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_rpo_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permission_overrides`
--

LOCK TABLES `role_permission_overrides` WRITE;
/*!40000 ALTER TABLE `role_permission_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permission_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(1,2),(2,2),(1,3),(2,3),(3,3),(1,4),(2,4),(1,5),(2,5),(1,6),(2,6),(1,7),(2,7),(3,7),(1,8),(2,8),(1,9),(2,9),(1,10),(2,10),(1,11),(2,11),(1,12),(2,12),(1,13),(2,13),(1,14),(2,14),(3,14),(4,14),(1,15),(2,15),(3,15),(1,16),(2,16),(3,16),(1,17),(2,17),(3,17),(4,17),(1,18),(2,18),(3,18),(1,19),(2,19),(3,19),(1,20),(2,20),(3,20),(4,20),(5,20),(6,20),(1,21),(2,21),(3,21),(1,22),(2,22),(3,22),(1,23),(2,23),(3,23),(4,23),(5,23),(6,23),(1,24),(2,24),(3,24),(4,24),(6,24),(1,25),(2,25),(3,25),(4,25),(6,25),(1,26),(2,26),(3,26),(4,26),(6,26),(1,27),(2,27),(3,27),(4,27),(6,27),(1,28),(2,28),(3,28),(4,28),(6,28),(1,29),(2,29),(3,29),(4,29),(6,29),(1,30),(2,30),(3,30),(4,30),(6,30),(1,31),(2,31),(3,31),(4,31),(6,31),(1,32),(2,32),(3,32),(4,32),(6,32),(1,33),(2,33),(3,33),(4,33),(6,33),(1,34),(2,34),(3,34),(4,34),(6,34),(1,35),(2,35),(3,35),(4,35),(5,35),(1,36),(2,36),(3,36),(4,36),(5,36),(1,37),(2,37),(3,37),(4,37),(5,37),(1,38),(2,38),(3,38),(4,38),(1,39),(2,39),(3,39),(4,39),(1,40),(2,40),(3,40),(4,40),(1,41),(2,41),(3,41),(4,41),(1,42),(2,42),(3,42),(4,42),(5,42),(1,43),(2,43),(3,43),(4,43),(5,43),(1,44),(2,44),(3,44),(4,44),(1,45),(2,45),(3,45),(1,46),(2,46),(4,46),(1,47),(2,47);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SYSTEM_ADMIN','System Admin','Quản trị toàn hệ thống (JWT/RBAC đầy đủ)','2026-04-17 18:52:03','2026-04-17 18:52:03'),(2,'ADMIN','Admin (legacy)','Tương đương quyền cao — giữ tương thích DB cũ','2026-04-17 18:52:03','2026-04-17 18:52:03'),(3,'STORE_MANAGER','Store Manager','Quản lý cửa hàng','2026-04-17 18:52:03','2026-04-17 18:52:03'),(4,'BRANCH_MANAGER','Branch Manager','Quản lý chi nhánh / vận hành không tạo cửa hàng','2026-04-17 18:52:03','2026-04-17 18:52:03'),(5,'CASHIER','Cashier','Thu ngân / nhân viên bán hàng','2026-04-17 18:52:03','2026-04-17 18:52:03'),(6,'WAREHOUSE_STAFF','Warehouse Staff','Nhân viên kho','2026-04-17 18:52:03','2026-04-17 18:52:03');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_order_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_order_items` (
  `order_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `quantity` decimal(18,4) NOT NULL,
  `unit_price` decimal(18,4) NOT NULL,
  `discount_amount` decimal(18,4) NOT NULL,
  `line_total` decimal(18,4) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_sales_order_items_order` (`order_id`),
  KEY `fk_sales_order_items_variant` (`variant_id`),
  CONSTRAINT `fk_sales_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `sales_orders` (`order_id`),
  CONSTRAINT `fk_sales_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_order_items`
--

LOCK TABLES `sales_order_items` WRITE;
/*!40000 ALTER TABLE `sales_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_orders`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_orders` (
  `order_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `cashier_id` bigint unsigned NOT NULL,
  `order_date` datetime NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(18,4) NOT NULL,
  `discount_amount` decimal(18,4) NOT NULL,
  `total_amount` decimal(18,4) NOT NULL,
  `paid_amount` decimal(18,4) NOT NULL,
  `payment_status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `branch_id` bigint DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `fk_sales_orders_cashier` (`cashier_id`),
  KEY `idx_sales_orders_store_date` (`store_id`,`order_date`),
  KEY `idx_sales_orders_customer_store` (`customer_id`,`store_id`),
  CONSTRAINT `fk_sales_orders_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_sales_orders_customer` FOREIGN KEY (`customer_id`, `store_id`) REFERENCES `customers` (`customer_id`, `store_id`),
  CONSTRAINT `fk_sales_orders_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_orders`
--

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_return_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_return_items` (
  `return_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `return_id` bigint unsigned NOT NULL,
  `order_item_id` bigint unsigned DEFAULT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `quantity` decimal(18,4) NOT NULL,
  `unit_price` decimal(18,4) NOT NULL,
  `line_total` decimal(18,4) NOT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`return_item_id`),
  KEY `fk_sales_return_items_return` (`return_id`),
  KEY `fk_sales_return_items_order_item` (`order_item_id`),
  KEY `fk_sales_return_items_variant` (`variant_id`),
  CONSTRAINT `fk_sales_return_items_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `sales_order_items` (`order_item_id`),
  CONSTRAINT `fk_sales_return_items_return` FOREIGN KEY (`return_id`) REFERENCES `sales_returns` (`return_id`),
  CONSTRAINT `fk_sales_return_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_return_items`
--

LOCK TABLES `sales_return_items` WRITE;
/*!40000 ALTER TABLE `sales_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_returns`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_returns` (
  `return_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `return_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `store_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `processed_by` bigint unsigned NOT NULL,
  `return_date` datetime NOT NULL,
  `status` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `refund_amount` decimal(18,4) NOT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`return_id`),
  UNIQUE KEY `return_code` (`return_code`),
  KEY `fk_sales_returns_order` (`order_id`),
  KEY `idx_sales_returns_customer_store` (`customer_id`,`store_id`),
  KEY `fk_sales_returns_processed_by` (`processed_by`),
  KEY `idx_sales_returns_store_date` (`store_id`,`return_date`),
  CONSTRAINT `fk_sales_returns_customer` FOREIGN KEY (`customer_id`, `store_id`) REFERENCES `customers` (`customer_id`, `store_id`),
  CONSTRAINT `fk_sales_returns_order` FOREIGN KEY (`order_id`) REFERENCES `sales_orders` (`order_id`),
  CONSTRAINT `fk_sales_returns_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_sales_returns_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_returns`
--

LOCK TABLES `sales_returns` WRITE;
/*!40000 ALTER TABLE `sales_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfer_items` (
  `transfer_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transfer_id` bigint unsigned NOT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `quantity` decimal(18,4) NOT NULL,
  PRIMARY KEY (`transfer_item_id`),
  KEY `fk_stock_transfer_items_transfer` (`transfer_id`),
  KEY `fk_stock_transfer_items_variant` (`variant_id`),
  CONSTRAINT `fk_stock_transfer_items_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`transfer_id`),
  CONSTRAINT `fk_stock_transfer_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfers` (
  `transfer_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transfer_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_store_id` bigint unsigned NOT NULL,
  `to_store_id` bigint unsigned NOT NULL,
  `transfer_date` datetime NOT NULL,
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `received_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `from_warehouse_id` bigint NOT NULL,
  `to_warehouse_id` bigint NOT NULL,
  PRIMARY KEY (`transfer_id`),
  UNIQUE KEY `transfer_code` (`transfer_code`),
  KEY `fk_stock_transfers_to_store` (`to_store_id`),
  KEY `fk_stock_transfers_created_by` (`created_by`),
  KEY `fk_stock_transfers_received_by` (`received_by`),
  KEY `idx_stock_transfers_from_to` (`from_store_id`,`to_store_id`),
  KEY `idx_stock_transfers_date` (`transfer_date`),
  CONSTRAINT `fk_stock_transfers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_stock_transfers_from_store` FOREIGN KEY (`from_store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_stock_transfers_received_by` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_stock_transfers_to_store` FOREIGN KEY (`to_store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocktake_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktake_items` (
  `stocktake_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stocktake_id` bigint unsigned NOT NULL,
  `variant_id` bigint unsigned NOT NULL,
  `system_qty` decimal(18,4) NOT NULL,
  `actual_qty` decimal(18,4) NOT NULL,
  `difference_qty` decimal(18,4) NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`stocktake_item_id`),
  KEY `fk_stocktake_items_stocktake` (`stocktake_id`),
  KEY `fk_stocktake_items_variant` (`variant_id`),
  CONSTRAINT `fk_stocktake_items_stocktake` FOREIGN KEY (`stocktake_id`) REFERENCES `stocktakes` (`stocktake_id`),
  CONSTRAINT `fk_stocktake_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktake_items`
--

LOCK TABLES `stocktake_items` WRITE;
/*!40000 ALTER TABLE `stocktake_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktake_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocktakes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktakes` (
  `stocktake_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stocktake_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_id` bigint unsigned NOT NULL,
  `stocktake_date` datetime NOT NULL,
  `status` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `warehouse_id` bigint NOT NULL,
  PRIMARY KEY (`stocktake_id`),
  UNIQUE KEY `stocktake_code` (`stocktake_code`),
  KEY `fk_stocktakes_created_by` (`created_by`),
  KEY `fk_stocktakes_approved_by` (`approved_by`),
  KEY `idx_stocktakes_store_date` (`store_id`,`stocktake_date`),
  CONSTRAINT `fk_stocktakes_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_stocktakes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_stocktakes_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktakes`
--

LOCK TABLES `stocktakes` WRITE;
/*!40000 ALTER TABLE `stocktakes` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `store_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `store_code` (`store_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'CH-2','Mini Stop','0123456789','ministop@gmail.com',NULL,'ACTIVE','2026-04-17 19:20:07','2026-04-17 19:20:07'),(2,'CH-3','Circlek','0123456666','circlek@gmail.com',NULL,'ACTIVE','2026-04-17 19:31:32','2026-04-17 19:31:32');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `supplier_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `uk_suppliers_store_code` (`store_id`,`supplier_code`),
  KEY `fk_suppliers_store` (`store_id`),
  CONSTRAINT `fk_suppliers_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `unit_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint unsigned NOT NULL,
  `unit_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`unit_id`),
  UNIQUE KEY `uk_units_store_code` (`store_id`,`unit_code`),
  KEY `fk_units_store` (`store_id`),
  CONSTRAINT `fk_units_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_branches`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_branches` (
  `user_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`branch_id`),
  KEY `fk_user_branches_branch` (`branch_id`),
  CONSTRAINT `fk_user_branches_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  CONSTRAINT `fk_user_branches_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_branches`
--

LOCK TABLES `user_branches` WRITE;
/*!40000 ALTER TABLE `user_branches` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(2,3),(3,3);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stores`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stores` (
  `user_id` bigint unsigned NOT NULL,
  `store_id` bigint unsigned NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`store_id`),
  KEY `fk_user_stores_store` (`store_id`),
  CONSTRAINT `fk_user_stores_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_user_stores_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stores`
--

LOCK TABLES `user_stores` WRITE;
/*!40000 ALTER TABLE `user_stores` DISABLE KEYS */;
INSERT INTO `user_stores` VALUES (2,1,1),(3,2,1);
/*!40000 ALTER TABLE `user_stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `default_store_id` bigint unsigned DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_default_store` (`default_store_id`),
  CONSTRAINT `fk_users_default_store` FOREIGN KEY (`default_store_id`) REFERENCES `stores` (`store_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'admin','$2a$10$rNknov3a4ULr4dtSBPOco.9ywwjeDYpqNffMBQ1mtFO6NMk3iYrla','admin sale','0999999999','admin@gmail.com','ACTIVE','2026-04-17 18:53:01','2026-04-17 19:01:38'),(2,1,'ministop','$2a$10$Gah7AU8RbgjW3pptf5ZheuyLv46996AqcVm1G5K4E9OguxvuC.z7C','Mini Stop','0123456789','ministop@gmail.com','ACTIVE','2026-04-17 19:20:07','2026-04-17 19:20:07'),(3,2,'circlek','$2a$10$I.Xz1dUxSKQ3b20FDJ.bdOAmOmItCbYItX/qKzIZf5urriWJfBaUy','Circlek','0123456666','circlek@gmail.com','ACTIVE','2026-04-17 19:31:32','2026-04-17 19:31:32');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `warehouse_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `status` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_id` bigint NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `warehouse_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`warehouse_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,NULL,'2026-04-17 18:53:01.465728','ACTIVE',1,'2026-04-17 18:53:01.465728','CENTRAL','Kho tổng','CENTRAL'),(2,1,'2026-04-17 19:23:21.529569','ACTIVE',1,'2026-04-17 19:23:21.529569','WH-B-1','Kho Ministop Lê Văn Việt','BRANCH'),(3,2,'2026-04-17 19:24:22.845685','ACTIVE',1,'2026-04-17 19:24:22.845685','WH-B-2','Kho Ministop Phạm Văn Đồng','BRANCH'),(4,NULL,'2026-04-17 19:31:32.009800','ACTIVE',2,'2026-04-17 19:31:32.009800','CENTRAL','Kho tổng','CENTRAL'),(5,3,'2026-04-17 19:32:39.837522','ACTIVE',2,'2026-04-17 19:32:39.837522','WH-B-3','Kho Circlek Võ Văn Ngân','BRANCH'),(6,4,'2026-04-17 19:33:27.813938','ACTIVE',2,'2026-04-17 19:33:27.813938','WH-B-4','Kho Circlek Võ Nguyên Giáp','BRANCH');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-17 19:40:59
