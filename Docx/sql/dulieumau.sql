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
(1, 1, 'MS-BR001', 'Vinamilk', 'Thương hiệu sữa tại Mini Stop', 'ACTIVE', NOW(), NOW()),
(2, 1, 'MS-BR002', 'TH True Milk', 'Sữa và sản phẩm từ sữa', 'ACTIVE', NOW(), NOW()),
(3, 1, 'MS-BR003', 'Coca-Cola', 'Nước giải khát có gas', 'ACTIVE', NOW(), NOW()),
(4, 1, 'MS-BR004', 'Pepsi', 'Đồ uống đóng lon', 'ACTIVE', NOW(), NOW()),
(5, 1, 'MS-BR005', 'Acecook', 'Mì ăn liền', 'ACTIVE', NOW(), NOW()),
(6, 1, 'MS-BR006', 'Oishi', 'Snack và đồ ăn vặt', 'ACTIVE', NOW(), NOW()),
(7, 1, 'MS-BR007', 'Kinh Do', 'Bánh ngọt đóng gói', 'ACTIVE', NOW(), NOW()),
(8, 1, 'MS-BR008', 'Masan', 'Gia vị và FMCG', 'ACTIVE', NOW(), NOW()),

(9, 2, 'CK-BR001', 'Nestle', 'Thực phẩm và đồ uống tiện lợi', 'ACTIVE', NOW(), NOW()),
(10, 2, 'CK-BR002', 'URC', 'Trà và nước giải khát', 'ACTIVE', NOW(), NOW()),
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
(7, 1, NULL, 'MS-CAT007', 'Water', 'Nước suối và nước tinh khiết', 'ACTIVE', NOW(), NOW()),

(8, 2, NULL, 'CK-CAT001', 'Soft Drinks', 'Nước giải khát tại Circlek', 'ACTIVE', NOW(), NOW()),
(9, 2, NULL, 'CK-CAT002', 'Coffee & Tea', 'Cà phê và trà', 'ACTIVE', NOW(), NOW()),
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
(1, 2, 1, 4, 1, 'MS-P001', 'Vinamilk Fresh Milk', 'NORMAL', 1, 1, 'Sữa tươi Vinamilk', 'ACTIVE', NOW(), NOW()),
(2, 2, 2, 4, 1, 'MS-P002', 'TH True Milk', 'NORMAL', 1, 1, 'Sữa TH True Milk', 'ACTIVE', NOW(), NOW()),
(3, 1, 3, 2, 1, 'MS-P003', 'Coca-Cola', 'NORMAL', 1, 1, 'Nước ngọt Coca-Cola', 'ACTIVE', NOW(), NOW()),
(4, 1, 4, 2, 1, 'MS-P004', 'Pepsi Black', 'NORMAL', 1, 1, 'Pepsi Black', 'ACTIVE', NOW(), NOW()),
(5, 3, 5, 3, 1, 'MS-P005', 'Hao Hao Noodles', 'NORMAL', 1, 1, 'Mì Hảo Hảo', 'ACTIVE', NOW(), NOW()),
(6, 4, 6, 5, 1, 'MS-P006', 'Oishi Pillows', 'NORMAL', 1, 1, 'Snack Oishi Pillows', 'ACTIVE', NOW(), NOW()),
(7, 5, 7, 4, 1, 'MS-P007', 'Solite Cake', 'NORMAL', 1, 1, 'Bánh Solite', 'ACTIVE', NOW(), NOW()),
(8, 6, 8, 1, 1, 'MS-P008', 'Nam Ngu Fish Sauce', 'NORMAL', 1, 1, 'Nước mắm Nam Ngư', 'ACTIVE', NOW(), NOW()),

(9, 9, 9, 10, 2, 'CK-P001', 'Nescafe 3in1', 'NORMAL', 1, 1, 'Cà phê hòa tan Nescafe', 'ACTIVE', NOW(), NOW()),
(10, 9, 10, 7, 2, 'CK-P002', 'C2 Green Tea', 'NORMAL', 1, 1, 'Trà xanh C2', 'ACTIVE', NOW(), NOW()),
(11, 10, 11, 8, 2, 'CK-P003', 'Red Bull', 'NORMAL', 1, 1, 'Nước tăng lực Red Bull', 'ACTIVE', NOW(), NOW()),
(12, 8, 12, 8, 2, 'CK-P004', 'Wonderfarm Grass Jelly', 'NORMAL', 1, 1, 'Nước sương sáo Wonderfarm', 'ACTIVE', NOW(), NOW()),
(13, 11, 13, 12, 2, 'CK-P005', 'Omachi Cup Noodle', 'NORMAL', 1, 1, 'Mì ly Omachi', 'ACTIVE', NOW(), NOW()),
(14, 12, 14, 11, 2, 'CK-P006', 'Poca Chips', 'NORMAL', 1, 1, 'Snack khoai tây Poca', 'ACTIVE', NOW(), NOW()),
(15, 13, 15, 10, 2, 'CK-P007', 'Lotte Choco Pie', 'NORMAL', 1, 1, 'Bánh Choco Pie Lotte', 'ACTIVE', NOW(), NOW()),
(16, 14, 16, 7, 2, 'CK-P008', 'Aquafina Water', 'NORMAL', 1, 1, 'Nước Aquafina', 'ACTIVE', NOW(), NOW());

-- =========================================
-- 6) PRODUCT_VARIANTS
-- Schema mới có store_id, nên phải insert cùng store với product
-- =========================================
INSERT INTO product_variants (
    variant_id, product_id, store_id, sku, barcode, variant_name, attributes_json,
    cost_price, selling_price, reorder_level, status, created_at, updated_at
) VALUES
(1, 1, 1, 'MS-P001-1L', '8931000001001', '1L', '{"size":"1L","flavor":"Original"}', 28000, 32000, 10, 'ACTIVE', NOW(), NOW()),
(2, 2, 1, 'MS-P002-180', '8931000001002', '180ml', '{"size":"180ml","sugar":"Regular"}', 6500, 8500, 20, 'ACTIVE', NOW(), NOW()),
(3, 3, 1, 'MS-P003-330', '8931000001003', '330ml Can', '{"size":"330ml","packaging":"Can"}', 7000, 10000, 24, 'ACTIVE', NOW(), NOW()),
(4, 4, 1, 'MS-P004-330', '8931000001004', '330ml Can', '{"size":"330ml","type":"Black"}', 7200, 10000, 24, 'ACTIVE', NOW(), NOW()),
(5, 5, 1, 'MS-P005-75G', '8931000001005', '75g Pack', '{"weight":"75g","flavor":"Shrimp Sour Spicy"}', 3200, 5000, 30, 'ACTIVE', NOW(), NOW()),
(6, 6, 1, 'MS-P006-90G', '8931000001006', '90g Bag', '{"weight":"90g","flavor":"Chocolate"}', 8500, 12000, 15, 'ACTIVE', NOW(), NOW()),
(7, 7, 1, 'MS-P007-6PCS', '8931000001007', 'Box 6 Cakes', '{"pack":"6 cakes","flavor":"Original"}', 18000, 25000, 12, 'ACTIVE', NOW(), NOW()),
(8, 8, 1, 'MS-P008-500', '8931000001008', '500ml Bottle', '{"size":"500ml","type":"Fish Sauce"}', 22000, 28000, 10, 'ACTIVE', NOW(), NOW()),

(9, 9, 2, 'CK-P001-20ST', '8931000002001', 'Box 20 Sticks', '{"pack":"20 sticks","type":"3in1"}', 32000, 42000, 10, 'ACTIVE', NOW(), NOW()),
(10, 10, 2, 'CK-P002-455', '8931000002002', '455ml Bottle', '{"size":"455ml","flavor":"Green Tea"}', 6500, 10000, 20, 'ACTIVE', NOW(), NOW()),
(11, 11, 2, 'CK-P003-250', '8931000002003', '250ml Can', '{"size":"250ml","type":"Energy Drink"}', 9000, 12000, 24, 'ACTIVE', NOW(), NOW()),
(12, 12, 2, 'CK-P004-310', '8931000002004', '310ml Can', '{"size":"310ml","flavor":"Grass Jelly"}', 7500, 11000, 18, 'ACTIVE', NOW(), NOW()),
(13, 13, 2, 'CK-P005-CUP', '8931000002005', 'Cup Noodle', '{"type":"Cup Noodle","flavor":"Beef"}', 10500, 15000, 20, 'ACTIVE', NOW(), NOW()),
(14, 14, 2, 'CK-P006-52G', '8931000002006', '52g Bag', '{"weight":"52g","flavor":"Seaweed"}', 9000, 13000, 15, 'ACTIVE', NOW(), NOW()),
(15, 15, 2, 'CK-P007-6PCS', '8931000002007', 'Box 6 Cakes', '{"pack":"6 cakes","type":"Choco Pie"}', 28000, 36000, 10, 'ACTIVE', NOW(), NOW()),
(16, 16, 2, 'CK-P008-500', '8931000002008', '500ml Bottle', '{"size":"500ml","type":"Pure Water"}', 3000, 6000, 30, 'ACTIVE', NOW(), NOW());

-- =========================================
-- 7) GOODS_RECEIPTS
-- =========================================
INSERT INTO goods_receipts (
    receipt_id, receipt_code, store_id, supplier_id, receipt_date, status,
    subtotal, discount_amount, total_amount, note,
    created_by, approved_by, created_at, updated_at, warehouse_id
) VALUES
(1, 'GR-MS-001', 1, 1, '2026-04-18 09:00:00', 'CONFIRMED',
 1501000, 0, 1501000, 'Nhập sữa và nước ngọt cho kho tổng Mini Stop',
 2, 2, NOW(), NOW(), 1),

(2, 'GR-MS-002', 1, 4, '2026-04-18 10:30:00', 'CONFIRMED',
 1210000, 0, 1210000, 'Nhập mì, snack và gia vị cho kho tổng Mini Stop',
 2, 2, NOW(), NOW(), 1),

(3, 'GR-CK-001', 2, 7, '2026-04-18 11:00:00', 'CONFIRMED',
 1782000, 0, 1782000, 'Nhập cà phê, trà và nước tăng lực cho kho tổng Circlek',
 3, 3, NOW(), NOW(), 4),

(4, 'GR-CK-002', 2, 11, '2026-04-18 14:00:00', 'CONFIRMED',
 1185000, 0, 1185000, 'Nhập mì ly, snack và nước suối cho kho tổng Circlek',
 3, 3, NOW(), NOW(), 4);

-- =========================================
-- 8) GOODS_RECEIPT_ITEMS
-- =========================================
INSERT INTO goods_receipt_items (
    receipt_item_id, receipt_id, variant_id, quantity, unit_cost, discount_amount, line_total
) VALUES
-- GR-MS-001
(1, 1, 1, 30, 28000, 0, 840000),
(2, 1, 2, 50, 6500, 0, 325000),
(3, 1, 3, 48, 7000, 0, 336000),

-- GR-MS-002
(4, 2, 5, 100, 3200, 0, 320000),
(5, 2, 6, 40, 8500, 0, 340000),
(6, 2, 8, 25, 22000, 0, 550000),

-- GR-CK-001
(7, 3, 9, 30, 32000, 0, 960000),
(8, 3, 10, 60, 6500, 0, 390000),
(9, 3, 11, 48, 9000, 0, 432000),

-- GR-CK-002
(10, 4, 13, 50, 10500, 0, 525000),
(11, 4, 14, 40, 9000, 0, 360000),
(12, 4, 16, 100, 3000, 0, 300000);

-- =========================================
-- 9) INVENTORIES
-- chia hàng cho kho tổng + 2 kho chi nhánh mỗi store
-- store 1: warehouse 1,2,3
-- store 2: warehouse 4,5,6
-- =========================================
INSERT INTO inventories (
    inventory_id, store_id, variant_id, quantity_on_hand, reserved_qty, warehouse_id
) VALUES
-- =========================
-- Store 1 - Mini Stop
-- =========================
-- Variant 1: MS-P001-1L (30)
(1, 1, 1, 20, 0, 1),
(2, 1, 1, 6, 0, 2),
(3, 1, 1, 4, 0, 3),

-- Variant 2: MS-P002-180 (50)
(4, 1, 2, 30, 0, 1),
(5, 1, 2, 10, 0, 2),
(6, 1, 2, 10, 0, 3),

-- Variant 3: MS-P003-330 (48)
(7, 1, 3, 24, 0, 1),
(8, 1, 3, 12, 0, 2),
(9, 1, 3, 12, 0, 3),

-- Variant 5: MS-P005-75G (100)
(10, 1, 5, 50, 0, 1),
(11, 1, 5, 30, 0, 2),
(12, 1, 5, 20, 0, 3),

-- Variant 6: MS-P006-90G (40)
(13, 1, 6, 20, 0, 1),
(14, 1, 6, 10, 0, 2),
(15, 1, 6, 10, 0, 3),

-- Variant 8: MS-P008-500 (25)
(16, 1, 8, 15, 0, 1),
(17, 1, 8, 5, 0, 2),
(18, 1, 8, 5, 0, 3),

-- =========================
-- Store 2 - Circlek
-- =========================
-- Variant 9: CK-P001-20ST (30)
(19, 2, 9, 20, 0, 4),
(20, 2, 9, 5, 0, 5),
(21, 2, 9, 5, 0, 6),

-- Variant 10: CK-P002-455 (60)
(22, 2, 10, 30, 0, 4),
(23, 2, 10, 15, 0, 5),
(24, 2, 10, 15, 0, 6),

-- Variant 11: CK-P003-250 (48)
(25, 2, 11, 24, 0, 4),
(26, 2, 11, 12, 0, 5),
(27, 2, 11, 12, 0, 6),

-- Variant 13: CK-P005-CUP (50)
(28, 2, 13, 20, 0, 4),
(29, 2, 13, 15, 0, 5),
(30, 2, 13, 15, 0, 6),

-- Variant 14: CK-P006-52G (40)
(31, 2, 14, 20, 0, 4),
(32, 2, 14, 10, 0, 5),
(33, 2, 14, 10, 0, 6),

-- Variant 16: CK-P008-500 (100)
(34, 2, 16, 40, 0, 4),
(35, 2, 16, 30, 0, 5),
(36, 2, 16, 30, 0, 6);