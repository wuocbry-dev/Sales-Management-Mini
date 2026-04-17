-- =========================================
-- 1) UNITS
-- =========================================
INSERT INTO units (unit_id, store_id, unit_code, unit_name, description, created_at) VALUES
(1, 1, 'MS-U001', 'Bottle', 'Chai', NOW()),
(2, 1, 'MS-U002', 'Can', 'Lon', NOW()),
(3, 1, 'MS-U003', 'Pack', 'Gói', NOW()),
(4, 1, 'MS-U004', 'Box', 'Hộp', NOW()),
(5, 1, 'MS-U005', 'Bag', 'Túi', NOW()),
(6, 1, 'MS-U006', 'Cup', 'Ly', NOW()),

(7, 2, 'CK-U001', 'Bottle', 'Chai', NOW()),
(8, 2, 'CK-U002', 'Can', 'Lon', NOW()),
(9, 2, 'CK-U003', 'Pack', 'Gói', NOW()),
(10, 2, 'CK-U004', 'Box', 'Hộp', NOW()),
(11, 2, 'CK-U005', 'Bag', 'Túi', NOW()),
(12, 2, 'CK-U006', 'Cup', 'Ly', NOW());

-- =========================================
-- 2) BRANDS
-- =========================================
INSERT INTO brands (brand_id, store_id, brand_code, brand_name, description, status, created_at, updated_at) VALUES
(1, 1, 'MS-BR001', 'Vinamilk', 'Thương hiệu sữa phổ biến tại Mini Stop', 'ACTIVE', NOW(), NOW()),
(2, 1, 'MS-BR002', 'TH True Milk', 'Sữa và sản phẩm từ sữa', 'ACTIVE', NOW(), NOW()),
(3, 1, 'MS-BR003', 'Coca-Cola', 'Nước giải khát có gas', 'ACTIVE', NOW(), NOW()),
(4, 1, 'MS-BR004', 'Pepsi', 'Nước giải khát đóng lon', 'ACTIVE', NOW(), NOW()),
(5, 1, 'MS-BR005', 'Acecook', 'Mì ăn liền và thực phẩm tiện lợi', 'ACTIVE', NOW(), NOW()),
(6, 1, 'MS-BR006', 'Oishi', 'Snack và đồ ăn vặt', 'ACTIVE', NOW(), NOW()),
(7, 1, 'MS-BR007', 'Kinh Do', 'Bánh ngọt và bánh mềm', 'ACTIVE', NOW(), NOW()),
(8, 1, 'MS-BR008', 'Masan', 'Gia vị và hàng tiêu dùng nhanh', 'ACTIVE', NOW(), NOW()),

(9, 2, 'CK-BR001', 'Nestle', 'Thực phẩm và đồ uống tiện lợi', 'ACTIVE', NOW(), NOW()),
(10, 2, 'CK-BR002', 'URC', 'Đồ uống đóng chai và trà', 'ACTIVE', NOW(), NOW()),
(11, 2, 'CK-BR003', 'Red Bull', 'Nước tăng lực', 'ACTIVE', NOW(), NOW()),
(12, 2, 'CK-BR004', 'Wonderfarm', 'Đồ uống đóng lon', 'ACTIVE', NOW(), NOW()),
(13, 2, 'CK-BR005', 'Omachi', 'Mì ly và mì ăn liền', 'ACTIVE', NOW(), NOW()),
(14, 2, 'CK-BR006', 'Poca', 'Snack khoai tây', 'ACTIVE', NOW(), NOW()),
(15, 2, 'CK-BR007', 'Lotte', 'Bánh kẹo', 'ACTIVE', NOW(), NOW()),
(16, 2, 'CK-BR008', 'Aquafina', 'Nước tinh khiết', 'ACTIVE', NOW(), NOW());

-- =========================================
-- 3) CATEGORIES
-- =========================================
INSERT INTO categories (category_id, store_id, parent_id, category_code, category_name, description, status, created_at, updated_at) VALUES
(1, 1, NULL, 'MS-CAT001', 'Beverages', 'Đồ uống tại Mini Stop', 'ACTIVE', NOW(), NOW()),
(2, 1, NULL, 'MS-CAT002', 'Milk', 'Sữa và sản phẩm từ sữa', 'ACTIVE', NOW(), NOW()),
(3, 1, NULL, 'MS-CAT003', 'Instant Noodles', 'Mì ăn liền', 'ACTIVE', NOW(), NOW()),
(4, 1, NULL, 'MS-CAT004', 'Snacks', 'Snack và đồ ăn vặt', 'ACTIVE', NOW(), NOW()),
(5, 1, NULL, 'MS-CAT005', 'Bakery', 'Bánh ngọt đóng gói', 'ACTIVE', NOW(), NOW()),
(6, 1, NULL, 'MS-CAT006', 'Seasoning', 'Gia vị nấu ăn', 'ACTIVE', NOW(), NOW()),
(7, 1, NULL, 'MS-CAT007', 'Water', 'Nước tinh khiết và nước khoáng', 'ACTIVE', NOW(), NOW()),

(8, 2, NULL, 'CK-CAT001', 'Soft Drinks', 'Nước giải khát tại Circlek', 'ACTIVE', NOW(), NOW()),
(9, 2, NULL, 'CK-CAT002', 'Coffee & Tea', 'Cà phê và trà tiện lợi', 'ACTIVE', NOW(), NOW()),
(10, 2, NULL, 'CK-CAT003', 'Energy Drinks', 'Nước tăng lực', 'ACTIVE', NOW(), NOW()),
(11, 2, NULL, 'CK-CAT004', 'Instant Food', 'Mì ly và thực phẩm ăn liền', 'ACTIVE', NOW(), NOW()),
(12, 2, NULL, 'CK-CAT005', 'Chips', 'Snack khoai tây và snack mặn', 'ACTIVE', NOW(), NOW()),
(13, 2, NULL, 'CK-CAT006', 'Candy & Cake', 'Bánh kẹo đóng gói', 'ACTIVE', NOW(), NOW()),
(14, 2, NULL, 'CK-CAT007', 'Water', 'Nước tinh khiết', 'ACTIVE', NOW(), NOW());

-- =========================================
-- 4) SUPPLIERS
-- =========================================
INSERT INTO suppliers (supplier_id, store_id, supplier_code, supplier_name, contact_person, phone, email, address, status, created_at, updated_at) VALUES
(1, 1, 'MS-SUP001', 'Vinamilk HCM Distributor', 'Nguyen Van An', '0901111111', 'vinamilk.ms@gmail.com', 'Ho Chi Minh City', 'ACTIVE', NOW(), NOW()),
(2, 1, 'MS-SUP002', 'TH Food Supply', 'Tran Thi Binh', '0901111112', 'thmilk.ms@gmail.com', 'Ho Chi Minh City', 'ACTIVE', NOW(), NOW()),
(3, 1, 'MS-SUP003', 'Coca Beverage South', 'Le Van Cuong', '0901111113', 'cocacola.ms@gmail.com', 'Binh Duong', 'ACTIVE', NOW(), NOW()),
(4, 1, 'MS-SUP004', 'Acecook Retail Partner', 'Pham Thi Dao', '0901111114', 'acecook.ms@gmail.com', 'Dong Nai', 'ACTIVE', NOW(), NOW()),
(5, 1, 'MS-SUP005', 'Oishi Snack Supplier', 'Hoang Minh Duc', '0901111115', 'oishi.ms@gmail.com', 'Ho Chi Minh City', 'ACTIVE', NOW(), NOW()),
(6, 1, 'MS-SUP006', 'Masan FMCG Supply', 'Vo Thi Giang', '0901111116', 'masan.ms@gmail.com', 'Long An', 'ACTIVE', NOW(), NOW()),

(7, 2, 'CK-SUP001', 'Nestle VN Distribution', 'Nguyen Quoc Huy', '0902222221', 'nestle.ck@gmail.com', 'Dong Nai', 'ACTIVE', NOW(), NOW()),
(8, 2, 'CK-SUP002', 'URC Beverage Supply', 'Tran Thi Hoa', '0902222222', 'urc.ck@gmail.com', 'Binh Duong', 'ACTIVE', NOW(), NOW()),
(9, 2, 'CK-SUP003', 'Red Bull Retail Supply', 'Le Van Khang', '0902222223', 'redbull.ck@gmail.com', 'Ho Chi Minh City', 'ACTIVE', NOW(), NOW()),
(10, 2, 'CK-SUP004', 'Wonderfarm Drinks Partner', 'Pham Thi Linh', '0902222224', 'wonderfarm.ck@gmail.com', 'Ho Chi Minh City', 'ACTIVE', NOW(), NOW()),
(11, 2, 'CK-SUP005', 'Lotte Snack & Cake', 'Do Minh Long', '0902222225', 'lotte.ck@gmail.com', 'Binh Duong', 'ACTIVE', NOW(), NOW()),
(12, 2, 'CK-SUP006', 'Aquafina Water Supply', 'Nguyen Thi Mai', '0902222226', 'aquafina.ck@gmail.com', 'Ho Chi Minh City', 'ACTIVE', NOW(), NOW());

-- =========================================
-- 5) PRODUCTS
-- =========================================
INSERT INTO products (
    product_id, category_id, brand_id, unit_id, store_id,
    product_code, product_name, product_type, has_variant, track_inventory,
    description, status, created_at, updated_at
) VALUES
-- Mini Stop
(1, 2, 1, 4, 1, 'MS-P001', 'Vinamilk Fresh Milk 1L', 'NORMAL', 0, 1, 'Sữa tươi Vinamilk hộp 1 lít', 'ACTIVE', NOW(), NOW()),
(2, 2, 2, 4, 1, 'MS-P002', 'TH True Milk 180ml', 'NORMAL', 0, 1, 'Sữa TH True Milk hộp nhỏ 180ml', 'ACTIVE', NOW(), NOW()),
(3, 1, 3, 2, 1, 'MS-P003', 'Coca-Cola Original 330ml', 'NORMAL', 0, 1, 'Nước ngọt Coca-Cola lon 330ml', 'ACTIVE', NOW(), NOW()),
(4, 1, 4, 2, 1, 'MS-P004', 'Pepsi Black 330ml', 'NORMAL', 0, 1, 'Pepsi Black lon 330ml', 'ACTIVE', NOW(), NOW()),
(5, 3, 5, 3, 1, 'MS-P005', 'Hao Hao Shrimp Noodles', 'NORMAL', 0, 1, 'Mì Hảo Hảo vị tôm chua cay', 'ACTIVE', NOW(), NOW()),
(6, 4, 6, 5, 1, 'MS-P006', 'Oishi Pillows Chocolate', 'NORMAL', 0, 1, 'Snack Oishi Pillows vị socola', 'ACTIVE', NOW(), NOW()),
(7, 5, 7, 4, 1, 'MS-P007', 'Solite Cup Cake', 'NORMAL', 0, 1, 'Bánh bông lan Solite', 'ACTIVE', NOW(), NOW()),
(8, 6, 8, 1, 1, 'MS-P008', 'Nam Ngu Fish Sauce 500ml', 'NORMAL', 0, 1, 'Nước mắm Nam Ngư chai 500ml', 'ACTIVE', NOW(), NOW()),

-- Circlek
(9, 9, 9, 10, 2, 'CK-P001', 'Nescafe 3in1 Coffee', 'NORMAL', 0, 1, 'Cà phê hòa tan Nescafe 3in1', 'ACTIVE', NOW(), NOW()),
(10, 9, 10, 7, 2, 'CK-P002', 'C2 Green Tea 455ml', 'NORMAL', 0, 1, 'Trà xanh C2 chai 455ml', 'ACTIVE', NOW(), NOW()),
(11, 10, 11, 8, 2, 'CK-P003', 'Red Bull Energy Drink 250ml', 'NORMAL', 0, 1, 'Nước tăng lực Red Bull lon 250ml', 'ACTIVE', NOW(), NOW()),
(12, 8, 12, 8, 2, 'CK-P004', 'Wonderfarm Grass Jelly Drink', 'NORMAL', 0, 1, 'Nước sương sáo Wonderfarm lon', 'ACTIVE', NOW(), NOW()),
(13, 11, 13, 12, 2, 'CK-P005', 'Omachi Beef Cup Noodle', 'NORMAL', 0, 1, 'Mì ly Omachi bò hầm', 'ACTIVE', NOW(), NOW()),
(14, 12, 14, 11, 2, 'CK-P006', 'Poca Seaweed Chips', 'NORMAL', 0, 1, 'Snack khoai tây Poca vị rong biển', 'ACTIVE', NOW(), NOW()),
(15, 13, 15, 10, 2, 'CK-P007', 'Lotte Choco Pie', 'NORMAL', 0, 1, 'Bánh Choco Pie Lotte', 'ACTIVE', NOW(), NOW()),
(16, 14, 16, 7, 2, 'CK-P008', 'Aquafina Pure Water 500ml', 'NORMAL', 0, 1, 'Nước tinh khiết Aquafina 500ml', 'ACTIVE', NOW(), NOW());