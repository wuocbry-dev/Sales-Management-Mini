-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 100.78.133.11    Database: sales_management_mini
-- ------------------------------------------------------
-- Server version	8.4.8

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
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,6,'123456','lê văn việt a','0337048570','11/7','ACTIVE','2026-04-12 01:09:08','2026-04-12 01:09:08','nguyenvanquoc11112004@gmail.com'),(2,13,'11/7','lê văn việt b','0337048500','11/7, đường số 385, phường Tăng Nhơn Phú A','ACTIVE','2026-04-12 01:11:03','2026-04-12 01:11:03','nguyenvanwuoc11112004@gmail.com');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'BR01','Tên mới','Ghi chú','active','2026-04-11 18:21:42','2026-04-11 18:50:04');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'DM01','Tên danh mục mới',NULL,'ACTIVE','2026-04-11 18:21:42','2026-04-11 18:50:04');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'KH001','Khách đổi tên','0922222222','khach@example.com','OTHER','1990-05-15','TP.HCM',0,0.0000,'ACTIVE','2026-04-11 18:21:44','2026-04-11 18:50:06');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `goods_receipt_items`
--

LOCK TABLES `goods_receipt_items` WRITE;
/*!40000 ALTER TABLE `goods_receipt_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipt_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `goods_receipts`
--

LOCK TABLES `goods_receipts` WRITE;
/*!40000 ALTER TABLE `goods_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `inventories`
--

LOCK TABLES `inventories` WRITE;
/*!40000 ALTER TABLE `inventories` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'DASHBOARD_VIEW','Vào màn Điều hành','DASHBOARD','VIEW','2026-04-11 09:44:29'),(2,'RBAC_MANAGE','Quản lý ma trận phân quyền (UI)','RBAC','MANAGE','2026-04-11 09:44:29'),(3,'USER_VIEW','Xem người dùng','USER','VIEW','2026-04-11 09:44:29'),(4,'USER_CREATE','Tạo người dùng','USER','CREATE','2026-04-11 09:44:29'),(5,'USER_UPDATE','Sửa người dùng','USER','UPDATE','2026-04-11 09:44:29'),(6,'USER_LOCK','Khóa/mở tài khoản','USER','LOCK','2026-04-11 09:44:29'),(7,'USER_ASSIGN_BRANCH','Gán user vào chi nhánh (trong phạm vi store)','USER','ASSIGN_BRANCH','2026-04-11 09:44:29'),(8,'ROLE_VIEW','Xem vai trò','ROLE','VIEW','2026-04-11 09:44:29'),(9,'ROLE_CREATE','Tạo vai trò','ROLE','CREATE','2026-04-11 09:44:29'),(10,'ROLE_UPDATE','Sửa vai trò','ROLE','UPDATE','2026-04-11 09:44:29'),(11,'PERMISSION_VIEW','Xem quyền','PERMISSION','VIEW','2026-04-11 09:44:29'),(12,'PERMISSION_ASSIGN','Gán quyền cho vai trò (global)','PERMISSION','ASSIGN','2026-04-11 09:44:29'),(13,'PERMISSION_OVERRIDE_MANAGE','Ghi đè quyền theo Store/Branch','RBAC','OVERRIDE','2026-04-11 09:44:29'),(14,'STORE_VIEW','Xem cửa hàng','STORE','VIEW','2026-04-11 09:44:29'),(15,'STORE_CREATE','Tạo cửa hàng','STORE','CREATE','2026-04-11 09:44:29'),(16,'STORE_UPDATE','Sửa cửa hàng','STORE','UPDATE','2026-04-11 09:44:29'),(17,'BRANCH_VIEW','Xem chi nhánh','BRANCH','VIEW','2026-04-11 09:44:29'),(18,'BRANCH_CREATE','Tạo chi nhánh','BRANCH','CREATE','2026-04-11 09:44:29'),(19,'BRANCH_UPDATE','Sửa chi nhánh','BRANCH','UPDATE','2026-04-11 09:44:29'),(20,'PRODUCT_VIEW','Xem sản phẩm','PRODUCT','VIEW','2026-04-11 09:44:29'),(21,'PRODUCT_CREATE','Tạo sản phẩm','PRODUCT','CREATE','2026-04-11 09:44:29'),(22,'PRODUCT_UPDATE','Sửa sản phẩm','PRODUCT','UPDATE','2026-04-11 09:44:29'),(23,'INVENTORY_VIEW','Xem tồn kho','INVENTORY','VIEW','2026-04-11 09:44:29'),(24,'INVENTORY_TRANSACTION_VIEW','Xem lịch sử biến động tồn kho','INVENTORY','TRANSACTION_VIEW','2026-04-11 09:44:29'),(25,'GOODS_RECEIPT_VIEW','Xem phiếu nhập','GOODS_RECEIPT','VIEW','2026-04-11 09:44:29'),(26,'GOODS_RECEIPT_CREATE','Tạo phiếu nhập','GOODS_RECEIPT','CREATE','2026-04-11 09:44:29'),(27,'GOODS_RECEIPT_CONFIRM','Xác nhận phiếu nhập','GOODS_RECEIPT','CONFIRM','2026-04-11 09:44:29'),(28,'TRANSFER_VIEW','Xem chuyển kho','TRANSFER','VIEW','2026-04-11 09:44:29'),(29,'TRANSFER_CREATE','Tạo chuyển kho','TRANSFER','CREATE','2026-04-11 09:44:29'),(30,'TRANSFER_SEND','Gửi chuyển kho','TRANSFER','SEND','2026-04-11 09:44:29'),(31,'TRANSFER_RECEIVE','Nhận chuyển kho','TRANSFER','RECEIVE','2026-04-11 09:44:29'),(32,'STOCKTAKE_VIEW','Xem kiểm kho','STOCKTAKE','VIEW','2026-04-11 09:44:29'),(33,'STOCKTAKE_CREATE','Tạo kiểm kho','STOCKTAKE','CREATE','2026-04-11 09:44:29'),(34,'STOCKTAKE_CONFIRM','Xác nhận kiểm kho','STOCKTAKE','CONFIRM','2026-04-11 09:44:29'),(35,'ORDER_VIEW','Xem đơn hàng','ORDER','VIEW','2026-04-11 09:44:29'),(36,'ORDER_CREATE','Tạo đơn hàng','ORDER','CREATE','2026-04-11 09:44:29'),(37,'ORDER_CONFIRM','Xác nhận đơn hàng','ORDER','CONFIRM','2026-04-11 09:44:29'),(38,'ORDER_CANCEL','Hủy đơn hàng','ORDER','CANCEL','2026-04-11 09:44:29'),(39,'RETURN_VIEW','Xem trả hàng','RETURN','VIEW','2026-04-11 09:44:29'),(40,'RETURN_CREATE','Tạo trả hàng','RETURN','CREATE','2026-04-11 09:44:29'),(41,'RETURN_CONFIRM','Xác nhận trả hàng','RETURN','CONFIRM','2026-04-11 09:44:29'),(42,'CUSTOMER_VIEW','Xem khách hàng','CUSTOMER','VIEW','2026-04-11 09:44:29'),(43,'CUSTOMER_CREATE','Tạo khách hàng','CUSTOMER','CREATE','2026-04-11 09:44:29'),(44,'CUSTOMER_UPDATE','Sửa khách hàng','CUSTOMER','UPDATE','2026-04-11 09:44:29'),(45,'REPORT_VIEW','Xem báo cáo','REPORT','VIEW','2026-04-11 09:44:29'),(46,'REPORT_VIEW_BRANCH','Xem báo cáo theo chi nhánh','REPORT','VIEW_BRANCH','2026-04-11 09:44:29'),(47,'AUDIT_LOG_VIEW','Xem nhật ký kiểm toán','AUDIT','VIEW','2026-04-11 09:44:29');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'SP001-DO-M','8930000000001','Đỏ / M','{\"size\": \"M\", \"color\": \"red\"}',100000.0000,150000.0000,5.0000,'ACTIVE','2026-04-11 18:21:44','2026-04-11 18:21:44'),(3,3,'SP002-DO-M','8930000000002','Đỏ / M','{\"size\": \"M\", \"color\": \"red\"}',100000.0000,150000.0000,5.0000,'ACTIVE','2026-04-11 20:16:30','2026-04-11 20:16:30'),(4,4,'SP003-DO-M','8930000000003','Đỏ / M','{\"size\": \"M\", \"color\": \"red\"}',100000.0000,150000.0000,5.0000,'ACTIVE','2026-04-11 21:23:30','2026-04-11 21:23:30'),(5,5,'2312','3123','12312','12321',50.0000,100.0000,100.0000,'ACTIVE','2026-04-11 21:40:16','2026-04-11 21:40:16'),(6,6,'SP007-DO-M','8930000000007','Đỏ / M','{\"size\": \"M\", \"color\": \"red\"}',100000.0000,150000.0000,5.0000,'ACTIVE','2026-04-11 21:42:08','2026-04-11 21:42:08'),(7,8,'SP008-DO-M','8930000000008','Đỏ / M','{\"size\": \"M\", \"color\": \"red\"}',100000.0000,150000.0000,5.0000,'ACTIVE','2026-04-11 21:43:16','2026-04-11 21:43:16'),(8,40,'SKu123333','123123','312321','213',50.0000,100.0000,1000.0000,'ACTIVE','2026-04-11 21:57:24','2026-04-11 21:57:24'),(9,41,'123123','1231','12312','12312',59.0000,100.0000,1222.0000,'ACTIVE','2026-04-11 21:57:57','2026-04-11 21:57:57'),(10,42,'12312','3213123','3123213','123213',5.0000,10.0000,100.0000,'ACTIVE','2026-04-11 21:59:04','2026-04-11 21:59:04'),(11,43,'sku01','123456','quần đùi màu cam','27',50000.0000,100000.0000,5.0000,'ACTIVE','2026-04-12 01:13:31','2026-04-12 01:13:31');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,1,NULL,'SP001','Sản phẩm mẫu','NORMAL',1,1,'Mô tả','ACTIVE','2026-04-11 18:21:44','2026-04-11 18:21:44'),(3,1,1,1,NULL,'SP002','Sản phẩm mẫu','NORMAL',1,1,'Mô tả','ACTIVE','2026-04-11 20:16:30','2026-04-11 20:16:30'),(4,1,1,1,NULL,'SP003','Sản phẩm mẫu','NORMAL',1,1,'Mô tả','ACTIVE','2026-04-11 21:23:30','2026-04-11 21:23:30'),(5,1,1,1,10,'1211','quần lót lọt khe','simple',1,1,NULL,'ACTIVE','2026-04-11 21:40:16','2026-04-11 21:40:16'),(6,1,1,1,NULL,'SP007','Sản phẩm mẫu','NORMAL',1,1,'Mô tả','ACTIVE','2026-04-11 21:42:08','2026-04-11 21:42:08'),(8,1,1,1,9,'SP008','Sản phẩm mẫu','NORMAL',1,1,'Mô tả','ACTIVE','2026-04-11 21:43:16','2026-04-11 21:43:16'),(40,1,NULL,1,12,'121199','quần lót lọt khe','NORMAL',1,1,NULL,'ACTIVE','2026-04-11 21:57:24','2026-04-11 21:57:24'),(41,1,1,1,12,'12119933','Quần Siêu Thú','NORMAL',0,1,'3123','ACTIVE','2026-04-11 21:57:57','2026-04-11 21:57:57'),(42,1,1,1,12,'Đồ chơi người lớn','Máy rung trim','NORMAL',1,1,NULL,'ACTIVE','2026-04-11 21:59:04','2026-04-11 21:59:04'),(43,NULL,NULL,NULL,9,'123456','quần đùi','NORMAL',1,1,NULL,'ACTIVE','2026-04-12 01:13:31','2026-04-12 01:13:31');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `role_permission_overrides`
--

LOCK TABLES `role_permission_overrides` WRITE;
/*!40000 ALTER TABLE `role_permission_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permission_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(1,2),(2,2),(1,3),(2,3),(3,3),(1,4),(2,4),(1,5),(2,5),(1,6),(2,6),(1,7),(2,7),(3,7),(1,8),(2,8),(1,9),(2,9),(1,10),(2,10),(1,11),(2,11),(1,12),(2,12),(1,13),(2,13),(1,14),(2,14),(3,14),(4,14),(1,15),(2,15),(3,15),(1,16),(2,16),(3,16),(1,17),(2,17),(3,17),(4,17),(1,18),(2,18),(3,18),(1,19),(2,19),(3,19),(1,20),(2,20),(3,20),(4,20),(5,20),(6,20),(1,21),(2,21),(3,21),(1,22),(2,22),(3,22),(1,23),(2,23),(3,23),(4,23),(5,23),(6,23),(1,24),(2,24),(3,24),(4,24),(6,24),(1,25),(2,25),(3,25),(4,25),(6,25),(1,26),(2,26),(3,26),(4,26),(6,26),(1,27),(2,27),(3,27),(4,27),(6,27),(1,28),(2,28),(3,28),(4,28),(6,28),(1,29),(2,29),(3,29),(4,29),(6,29),(1,30),(2,30),(3,30),(4,30),(6,30),(1,31),(2,31),(3,31),(4,31),(6,31),(1,32),(2,32),(3,32),(4,32),(6,32),(1,33),(2,33),(3,33),(4,33),(6,33),(1,34),(2,34),(3,34),(4,34),(6,34),(1,35),(2,35),(3,35),(4,35),(5,35),(1,36),(2,36),(3,36),(4,36),(5,36),(1,37),(2,37),(3,37),(4,37),(5,37),(1,38),(2,38),(3,38),(4,38),(1,39),(2,39),(3,39),(4,39),(1,40),(2,40),(3,40),(4,40),(1,41),(2,41),(3,41),(4,41),(1,42),(2,42),(3,42),(4,42),(5,42),(1,43),(2,43),(3,43),(4,43),(5,43),(1,44),(2,44),(3,44),(4,44),(1,45),(2,45),(3,45),(1,46),(2,46),(4,46),(1,47),(2,47);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SYSTEM_ADMIN','System Admin','Quản trị toàn hệ thống (JWT/RBAC đầy đủ)','2026-04-11 09:44:29','2026-04-11 09:44:29'),(2,'ADMIN','Admin (legacy)','Tương đương quyền cao — giữ tương thích DB cũ','2026-04-11 09:44:29','2026-04-11 09:44:29'),(3,'STORE_MANAGER','Store Manager','Quản lý cửa hàng','2026-04-11 09:44:29','2026-04-11 09:44:29'),(4,'BRANCH_MANAGER','Branch Manager','Quản lý chi nhánh / vận hành không tạo cửa hàng','2026-04-11 09:44:29','2026-04-11 09:44:29'),(5,'CASHIER','Cashier','Thu ngân / nhân viên bán hàng','2026-04-11 09:44:29','2026-04-11 09:44:29'),(6,'WAREHOUSE_STAFF','Warehouse Staff','Nhân viên kho','2026-04-11 09:44:29','2026-04-11 09:44:29');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sales_order_items`
--

LOCK TABLES `sales_order_items` WRITE;
/*!40000 ALTER TABLE `sales_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sales_orders`
--

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sales_return_items`
--

LOCK TABLES `sales_return_items` WRITE;
/*!40000 ALTER TABLE `sales_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `sales_returns`
--

LOCK TABLES `sales_returns` WRITE;
/*!40000 ALTER TABLE `sales_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stocktake_items`
--

LOCK TABLES `stocktake_items` WRITE;
/*!40000 ALTER TABLE `stocktake_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktake_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stocktakes`
--

LOCK TABLES `stocktakes` WRITE;
/*!40000 ALTER TABLE `stocktakes` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (6,'CH001','Cửa hàng mẫu','0900000001','store@example.com','123 Đường ABC','ACTIVE','2026-04-11 18:50:03','2026-04-11 18:50:03'),(7,'CH002','Cửa hàng mẫu','0900000001','store@example.com','123 Đường ABC','ACTIVE','2026-04-11 20:02:26','2026-04-11 20:02:26'),(8,'q2k','Cửa hàng mẫu','0900000001','store@example.com','123 Đường ABC','ACTIVE','2026-04-11 20:02:46','2026-04-11 20:02:46'),(9,'quocbip','Quoc Bip Shop','0900000001','quocbrystore@gmail.com','123 Đường ABC','ACTIVE','2026-04-11 20:14:27','2026-04-11 20:14:27'),(10,'CH-7','Nguyễn Đoàn Duy Khánh — Cửa hàng','+84915232119','khanhkhoi0823@gmail.com',NULL,'ACTIVE','2026-04-11 21:39:49','2026-04-11 21:39:49'),(11,'CH-9','Nguyễn Đoàn Duy Khánh — Cửa hàng','+84915232119','khanhkhoi0811@gmail.com',NULL,'ACTIVE','2026-04-11 21:48:27','2026-04-11 21:48:27'),(12,'CH-10','112233 — Cửa hàng','+84915232119','11@gmail.com',NULL,'ACTIVE','2026-04-11 21:56:52','2026-04-11 21:56:52'),(13,'CH204','Quoc Bip Shop','0900000001','store@example.com','123 Đường ABC','ACTIVE','2026-04-11 22:06:30','2026-04-11 22:06:30');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'NCC01','Tên NCC mới','Nguyễn A','0911111111','ncc@example.com','Hà Nội','ACTIVE','2026-04-11 18:21:43','2026-04-11 18:50:05');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'CAI','Cái (đổi tên)',NULL,'2026-04-11 18:21:43');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_branches`
--

LOCK TABLES `user_branches` WRITE;
/*!40000 ALTER TABLE `user_branches` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(3,1),(2,2),(2,3),(4,3),(5,3),(6,3),(7,3),(8,3),(9,3),(10,3);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_stores`
--

LOCK TABLES `user_stores` WRITE;
/*!40000 ALTER TABLE `user_stores` DISABLE KEYS */;
INSERT INTO `user_stores` VALUES (7,10,1),(9,11,1),(10,12,1);
/*!40000 ALTER TABLE `user_stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'quocbry','$2a$10$BVp8o1PYvJDYa.OMRy7iIOMqWCUd/6VIZlHYHG4oNQ/DowWrAkcqe','Admin shop',NULL,'quocbry@gmail.com','ACTIVE','2026-04-11 18:03:05','2026-04-11 18:03:05'),(2,NULL,'demo_user','$2a$10$xUE6XvsKUXzRsoxSMqXM1ON28ZO864p3QkLgsWQa6Xk18ZwNfDU1C','Người dùng demo',NULL,'demo@example.com','LOCKED','2026-04-11 18:21:40','2026-04-11 18:50:10'),(3,NULL,'khanhndd','$2a$10$2VlXzO/l9yzyVlumOQ0kkuJl5rJOVwnBdWaGoRjQejOz3ncv8jK66','NKhanhhhh',NULL,'khanhkhoi0408@gmail.com','ACTIVE','2026-04-11 18:25:51','2026-04-11 18:25:51'),(4,NULL,'khanh1201','$2a$10$mhQbK3HyeM5CzbqNyqCe9Onk.0YDre6r1rRyXPzQnVZ00h9PZHdFS','NKhanhBum',NULL,'khanh11543@gmail.com','ACTIVE','2026-04-11 18:28:45','2026-04-11 18:28:45'),(5,8,'khanh12','$2a$10$VK4Q2HX5XwRvlk20ySxDcO3JG.GbQd2qHYqtPtVt0JV7Lkfkietsi','Nguyễn Đoàn Duy Khánh','+84915232119','khanhkhoi081@gmail.com','ACTIVE','2026-04-11 19:57:52','2026-04-11 13:12:37'),(6,9,'quocbip','$2a$10$OxGl/39ouX0UdKZ95DBHx.RZVQqZ5sfa5c8/TgnNeFlioPyqvS2Da','Bry Shop',NULL,'quocbip@gmail.com','ACTIVE','2026-04-11 20:13:38','2026-04-11 13:14:58'),(7,10,'khanh23','$2a$10$sbX/.FILXCl4LVvZriiB3O/uli3N.VkO8opD9h9Arx73je4ZO4PZO','Nguyễn Đoàn Duy Khánh','+84915232119','khanhkhoi0823@gmail.com','ACTIVE','2026-04-11 21:39:49','2026-04-11 21:39:49'),(8,NULL,'nguyenvanquoc11112004@gmail.com','$2a$10$honNMgkXMJwvfGn1HPymze1NJHjvdgPYNTNxeyQci2Go.fsBmSmxy','1856_ Nguyễn Văn Quốc','+84337048500','nguyenvanquoc11112004@gmail.com','ACTIVE','2026-04-11 21:45:09','2026-04-11 21:45:09'),(9,11,'khanh234','$2a$10$7yUp28d525Awzr.C4DYI2.cK/DDrZsCxMiRuVFvorYNuT9fFHrrnq','Nguyễn Đoàn Duy Khánh','+84915232119','khanhkhoi0811@gmail.com','ACTIVE','2026-04-11 21:48:27','2026-04-11 21:48:27'),(10,12,'112233','$2a$10$SjRGvvPMNxi7um57/Bz7oOV1r215ddun8sKBS1zupwT/wY/OK6Oc.','112233','+84915232119','11@gmail.com','ACTIVE','2026-04-11 21:56:52','2026-04-11 21:56:52');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,NULL,'2026-04-11 18:50:03.128392','ACTIVE',6,'2026-04-11 18:50:03.128392','CENTRAL','Kho tổng','CENTRAL'),(2,NULL,'2026-04-11 20:02:25.699485','ACTIVE',7,'2026-04-11 20:02:25.699485','CENTRAL','Kho tổng','CENTRAL'),(3,NULL,'2026-04-11 20:02:46.287631','ACTIVE',8,'2026-04-11 20:02:46.287631','CENTRAL','Kho tổng','CENTRAL'),(4,NULL,'2026-04-11 20:14:26.572225','ACTIVE',9,'2026-04-11 20:14:26.572225','CENTRAL','Kho tổng','CENTRAL'),(5,NULL,'2026-04-11 21:39:49.062671','ACTIVE',10,'2026-04-11 21:39:49.062671','CENTRAL','Kho tổng','CENTRAL'),(6,NULL,'2026-04-11 21:48:26.673649','ACTIVE',11,'2026-04-11 21:48:26.673649','CENTRAL','Kho tổng','CENTRAL'),(7,NULL,'2026-04-11 21:56:52.291640','ACTIVE',12,'2026-04-11 21:56:52.291640','CENTRAL','Kho tổng','CENTRAL'),(8,NULL,'2026-04-11 22:06:30.492849','ACTIVE',13,'2026-04-11 22:06:30.492849','CENTRAL','Kho tổng','CENTRAL'),(9,1,'2026-04-12 01:09:07.962826','ACTIVE',6,'2026-04-12 01:09:07.962826','WH-B-1','Kho lê văn việt a','BRANCH'),(10,2,'2026-04-12 01:11:02.717165','ACTIVE',13,'2026-04-12 01:11:02.717165','WH-B-2','Kho lê văn việt b','BRANCH');
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

-- Dump completed on 2026-04-12  1:20:04
