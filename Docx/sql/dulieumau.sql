START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- XÓA DỮ LIỆU CŨ 9 BẢNG
-- =========================================================
DELETE FROM sales_management_mini.inventories;
DELETE FROM sales_management_mini.goods_receipt_items;
DELETE FROM sales_management_mini.goods_receipts;
DELETE FROM sales_management_mini.suppliers;
DELETE FROM sales_management_mini.product_variants;
DELETE FROM sales_management_mini.products;
DELETE FROM sales_management_mini.categories;
DELETE FROM sales_management_mini.brands;
DELETE FROM sales_management_mini.units;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1) UNITS
-- =========================================================
INSERT INTO sales_management_mini.units
(unit_id, store_id, unit_code, unit_name, description, created_at)
VALUES
(1, 1, 'MS-CHAI', 'Chai', 'Đơn vị chai cho Mini Stop', '2026-04-19 09:00:00'),
(2, 1, 'MS-LON',  'Lon',  'Đơn vị lon cho Mini Stop',  '2026-04-19 09:00:00'),
(3, 1, 'MS-GOI',  'Gói',  'Đơn vị gói cho Mini Stop',  '2026-04-19 09:00:00'),
(4, 1, 'MS-HOP',  'Hộp',  'Đơn vị hộp cho Mini Stop',  '2026-04-19 09:00:00'),
(5, 1, 'MS-LY',   'Ly',   'Đơn vị ly cho Mini Stop',   '2026-04-19 09:00:00'),

(6, 2, 'CK-CHAI', 'Chai', 'Đơn vị chai cho Circlek',   '2026-04-19 09:05:00'),
(7, 2, 'CK-LON',  'Lon',  'Đơn vị lon cho Circlek',    '2026-04-19 09:05:00'),
(8, 2, 'CK-GOI',  'Gói',  'Đơn vị gói cho Circlek',    '2026-04-19 09:05:00'),
(9, 2, 'CK-HOP',  'Hộp',  'Đơn vị hộp cho Circlek',    '2026-04-19 09:05:00'),
(10,2, 'CK-LY',   'Ly',   'Đơn vị ly cho Circlek',     '2026-04-19 09:05:00');

-- =========================================================
-- 2) BRANDS
-- =========================================================
INSERT INTO sales_management_mini.brands
(brand_id, store_id, brand_code, brand_name, description, status, created_at, updated_at)
VALUES
(1, 1, 'MS-COCA',    'Coca-Cola',    'Thương hiệu Coca-Cola tại Mini Stop', 'ACTIVE', '2026-04-19 09:10:00', '2026-04-19 09:10:00'),
(2, 1, 'MS-PEPSI',   'Pepsi',        'Thương hiệu Pepsi tại Mini Stop',     'ACTIVE', '2026-04-19 09:10:00', '2026-04-19 09:10:00'),
(3, 1, 'MS-ACECOOK', 'Acecook',      'Thương hiệu Acecook tại Mini Stop',   'ACTIVE', '2026-04-19 09:10:00', '2026-04-19 09:10:00'),
(4, 1, 'MS-VNM',     'Vinamilk',     'Thương hiệu Vinamilk tại Mini Stop',  'ACTIVE', '2026-04-19 09:10:00', '2026-04-19 09:10:00'),
(5, 1, 'MS-OREO',    'Oreo',         'Thương hiệu Oreo tại Mini Stop',      'ACTIVE', '2026-04-19 09:10:00', '2026-04-19 09:10:00'),

(6, 2, 'CK-STING',   'Sting',        'Thương hiệu Sting tại Circlek',        'ACTIVE', '2026-04-19 09:15:00', '2026-04-19 09:15:00'),
(7, 2, 'CK-TH',      'TH True Milk', 'Thương hiệu TH True Milk tại Circlek', 'ACTIVE', '2026-04-19 09:15:00', '2026-04-19 09:15:00'),
(8, 2, 'CK-OISHI',   'Oishi',        'Thương hiệu Oishi tại Circlek',        'ACTIVE', '2026-04-19 09:15:00', '2026-04-19 09:15:00'),
(9, 2, 'CK-NES',     'Nescafe',      'Thương hiệu Nescafe tại Circlek',      'ACTIVE', '2026-04-19 09:15:00', '2026-04-19 09:15:00'),
(10,2, 'CK-AQUA',    'Aquafina',     'Thương hiệu Aquafina tại Circlek',     'ACTIVE', '2026-04-19 09:15:00', '2026-04-19 09:15:00');

-- =========================================================
-- 3) CATEGORIES
-- =========================================================
INSERT INTO sales_management_mini.categories
(category_id, store_id, parent_id, category_code, category_name, description, status, created_at, updated_at)
VALUES
(1, 1, NULL, 'MS-NUOC',  'Nước giải khát',  'Danh mục nước giải khát của Mini Stop', 'ACTIVE', '2026-04-19 09:20:00', '2026-04-19 09:20:00'),
(2, 1, NULL, 'MS-MI',    'Mì ăn liền',      'Danh mục mì ăn liền của Mini Stop',     'ACTIVE', '2026-04-19 09:20:00', '2026-04-19 09:20:00'),
(3, 1, NULL, 'MS-SUA',   'Sữa',             'Danh mục sữa của Mini Stop',            'ACTIVE', '2026-04-19 09:20:00', '2026-04-19 09:20:00'),
(4, 1, NULL, 'MS-BANH',  'Bánh kẹo',        'Danh mục bánh kẹo của Mini Stop',       'ACTIVE', '2026-04-19 09:20:00', '2026-04-19 09:20:00'),

(5, 2, NULL, 'CK-NL',    'Nước tăng lực',   'Danh mục nước tăng lực của Circlek',    'ACTIVE', '2026-04-19 09:25:00', '2026-04-19 09:25:00'),
(6, 2, NULL, 'CK-SUA',   'Sữa',             'Danh mục sữa của Circlek',              'ACTIVE', '2026-04-19 09:25:00', '2026-04-19 09:25:00'),
(7, 2, NULL, 'CK-SNACK', 'Snack',           'Danh mục snack của Circlek',            'ACTIVE', '2026-04-19 09:25:00', '2026-04-19 09:25:00'),
(8, 2, NULL, 'CK-CF',    'Cà phê lon/chai', 'Danh mục cà phê của Circlek',           'ACTIVE', '2026-04-19 09:25:00', '2026-04-19 09:25:00'),
(9, 2, NULL, 'CK-NUOC',  'Nước suối',       'Danh mục nước suối của Circlek',        'ACTIVE', '2026-04-19 09:25:00', '2026-04-19 09:25:00');

-- =========================================================
-- 4) PRODUCTS
-- =========================================================
INSERT INTO sales_management_mini.products
(product_id, category_id, brand_id, unit_id, store_id, product_code, product_name, product_type, has_variant, track_inventory, description, status, created_at, updated_at)
VALUES
(1, 1, 1, 2, 1, 'MS-COCA',      'Coca-Cola',               'DRINK',  1, 1, 'Nước ngọt Coca-Cola tại Mini Stop',       'ACTIVE', '2026-04-19 09:30:00', '2026-04-19 09:30:00'),
(2, 1, 2, 2, 1, 'MS-PEPSI',     'Pepsi Không Calo',        'DRINK',  1, 1, 'Nước ngọt Pepsi Không Calo tại Mini Stop', 'ACTIVE', '2026-04-19 09:30:00', '2026-04-19 09:30:00'),
(3, 2, 3, 3, 1, 'MS-HAOHAO',    'Mì Hảo Hảo Tôm Chua Cay', 'NOODLE', 1, 1, 'Mì Hảo Hảo tại Mini Stop',                 'ACTIVE', '2026-04-19 09:30:00', '2026-04-19 09:30:00'),
(4, 3, 4, 4, 1, 'MS-VNM',       'Sữa tươi Vinamilk',       'MILK',   1, 1, 'Sữa tươi Vinamilk tại Mini Stop',          'ACTIVE', '2026-04-19 09:30:00', '2026-04-19 09:30:00'),
(5, 4, 5, 3, 1, 'MS-OREO',      'Bánh Oreo Vani',          'SNACK',  1, 1, 'Bánh Oreo vị vani tại Mini Stop',          'ACTIVE', '2026-04-19 09:30:00', '2026-04-19 09:30:00'),

(6, 5, 6, 6, 2, 'CK-STING',     'Sting Dâu',               'ENERGY', 1, 1, 'Nước tăng lực Sting dâu tại Circlek',      'ACTIVE', '2026-04-19 09:35:00', '2026-04-19 09:35:00'),
(7, 6, 7, 9, 2, 'CK-THMILK',    'TH True Milk Ít Đường',   'MILK',   1, 1, 'Sữa TH True Milk ít đường tại Circlek',    'ACTIVE', '2026-04-19 09:35:00', '2026-04-19 09:35:00'),
(8, 7, 8, 8, 2, 'CK-OISHI',     'Oishi Tôm Cay',           'SNACK',  1, 1, 'Snack Oishi vị tôm cay tại Circlek',       'ACTIVE', '2026-04-19 09:35:00', '2026-04-19 09:35:00'),
(9, 8, 9, 7, 2, 'CK-NESCAFE',   'Nescafe Cà Phê Sữa',      'COFFEE', 1, 1, 'Cà phê sữa Nescafe tại Circlek',           'ACTIVE', '2026-04-19 09:35:00', '2026-04-19 09:35:00'),
(10,9,10, 6, 2, 'CK-AQUAFINA',  'Aquafina',                'WATER',  1, 1, 'Nước suối Aquafina tại Circlek',           'ACTIVE', '2026-04-19 09:35:00', '2026-04-19 09:35:00');

-- =========================================================
-- 5) PRODUCT_VARIANTS
-- =========================================================
INSERT INTO sales_management_mini.product_variants
(variant_id, product_id, store_id, sku, barcode, variant_name, attributes_json, cost_price, selling_price, reorder_level, status, created_at, updated_at)
VALUES
(1, 1, 1, 'MS-COCA-330ML-LON',     '8935000000011', 'Lon 330ml',      '{"size":"330ml","pack":"Lon"}',   7500, 10000, 20, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),
(2, 1, 1, 'MS-COCA-390ML-CHAI',    '8935000000012', 'Chai 390ml',     '{"size":"390ml","pack":"Chai"}',  8500, 12000, 20, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),

(3, 2, 1, 'MS-PEPSI-330ML-LON',    '8935000000021', 'Lon 330ml',      '{"size":"330ml","pack":"Lon"}',   7300,  9500, 20, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),
(4, 2, 1, 'MS-PEPSI-390ML-CHAI',   '8935000000022', 'Chai 390ml',     '{"size":"390ml","pack":"Chai"}',  8300, 11500, 20, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),

(5, 3, 1, 'MS-HAOHAO-75G-GOI',     '8935000000031', 'Gói 75g',        '{"size":"75g","pack":"Goi"}',     3200,  5000, 30, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),
(6, 3, 1, 'MS-HAOHAO-67G-LY',      '8935000000032', 'Ly 67g',         '{"size":"67g","pack":"Ly"}',      5500,  8000, 20, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),

(7, 4, 1, 'MS-VNM-180ML-HOP',      '8935000000041', 'Hộp 180ml',      '{"size":"180ml","pack":"Hop"}',   6200,  9000, 25, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),
(8, 4, 1, 'MS-VNM-1L-HOP',         '8935000000042', 'Hộp 1L',         '{"size":"1L","pack":"Hop"}',     28000, 36000, 15, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),

(9, 5, 1, 'MS-OREO-133G-GOI',      '8935000000051', 'Gói 133g',       '{"size":"133g","pack":"Goi"}',    9200, 13000, 15, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),
(10,5, 1, 'MS-OREO-27G-GOI',       '8935000000052', 'Gói mini 27g',   '{"size":"27g","pack":"Goi"}',     3000,  5000, 20, 'ACTIVE', '2026-04-19 09:40:00', '2026-04-19 09:40:00'),

(11,6, 2, 'CK-STING-330ML-CHAI',   '8935000000061', 'Chai 330ml',     '{"size":"330ml","pack":"Chai"}',  8800, 12000, 20, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),
(12,6, 2, 'CK-STING-330ML-LON',    '8935000000062', 'Lon 330ml',      '{"size":"330ml","pack":"Lon"}',   9000, 12500, 20, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),

(13,7, 2, 'CK-THMILK-180ML-HOP',   '8935000000071', 'Hộp 180ml',      '{"size":"180ml","pack":"Hop"}',   7000, 10000, 25, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),
(14,7, 2, 'CK-THMILK-1L-HOP',      '8935000000072', 'Hộp 1L',         '{"size":"1L","pack":"Hop"}',     31000, 39000, 15, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),

(15,8, 2, 'CK-OISHI-36G-GOI',      '8935000000081', 'Gói 36g',        '{"size":"36g","pack":"Goi"}',     6500,  9000, 20, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),
(16,8, 2, 'CK-OISHI-90G-GOI',      '8935000000082', 'Gói 90g',        '{"size":"90g","pack":"Goi"}',    12000, 16000, 15, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),

(17,9, 2, 'CK-NESCAFE-185ML-LON',  '8935000000091', 'Lon 185ml',      '{"size":"185ml","pack":"Lon"}',   9500, 13000, 20, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),
(18,9, 2, 'CK-NESCAFE-220ML-CHAI', '8935000000092', 'Chai 220ml',     '{"size":"220ml","pack":"Chai"}', 10500, 14500, 20, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),

(19,10,2, 'CK-AQUAFINA-500ML-CHAI','8935000000101', 'Chai 500ml',     '{"size":"500ml","pack":"Chai"}',  5000,  7000, 30, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00'),
(20,10,2, 'CK-AQUAFINA-1.5L-CHAI', '8935000000102', 'Chai 1.5L',      '{"size":"1.5L","pack":"Chai"}',  11000, 15000, 20, 'ACTIVE', '2026-04-19 09:45:00', '2026-04-19 09:45:00');

-- =========================================================
-- 6) SUPPLIERS
-- =========================================================
INSERT INTO sales_management_mini.suppliers
(supplier_id, store_id, supplier_code, supplier_name, contact_person, phone, email, address, status, created_at, updated_at)
VALUES
(1, 1, 'SUP-MS-001', 'NCC Nước Giải Khát Miền Nam', 'Nguyễn Văn Hòa', '0901000001', 'ncc.nuocmiennam@example.com', 'Cần Thơ',    'ACTIVE', '2026-04-19 10:00:00', '2026-04-19 10:00:00'),
(2, 1, 'SUP-MS-002', 'NCC Hàng Tiêu Dùng Mini Stop','Trần Minh Khang','0901000002', 'ncc.tieudungms@example.com',  'Vĩnh Long',  'ACTIVE', '2026-04-19 10:00:00', '2026-04-19 10:00:00'),
(3, 1, 'SUP-MS-003', 'NCC Sữa Miền Tây',            'Lê Thị Hạnh',    '0901000003', 'ncc.suamientay@example.com',  'Sóc Trăng',  'ACTIVE', '2026-04-19 10:00:00', '2026-04-19 10:00:00'),

(4, 2, 'SUP-CK-001', 'NCC Beverage Circlek',        'Phạm Quốc Việt', '0902000001', 'ncc.beverageck@example.com',  'TP.HCM',     'ACTIVE', '2026-04-19 10:05:00', '2026-04-19 10:05:00'),
(5, 2, 'SUP-CK-002', 'NCC Snack & Food CK',         'Đỗ Ngọc Mai',    '0902000002', 'ncc.snackck@example.com',     'Bình Dương', 'ACTIVE', '2026-04-19 10:05:00', '2026-04-19 10:05:00'),
(6, 2, 'SUP-CK-003', 'NCC Dairy CK',                'Hoàng Minh Tâm', '0902000003', 'ncc.dairyck@example.com',     'Đồng Nai',   'ACTIVE', '2026-04-19 10:05:00', '2026-04-19 10:05:00');

-- =========================================================
-- 7) GOODS_RECEIPTS
-- Store 1 dùng kho tổng = 1
-- Store 2 dùng kho tổng = 4
-- =========================================================
INSERT INTO sales_management_mini.goods_receipts
(receipt_id, receipt_code, store_id, supplier_id, receipt_date, status, subtotal, discount_amount, total_amount, note, created_by, approved_by, created_at, updated_at, warehouse_id)
VALUES
(1, 'GR-MS-0001', 1, 1, '2026-04-18', 'CONFIRMED', 1215600, 0, 1215600, 'Nhập Coca-Cola và Pepsi cho Mini Stop',      2, 1, '2026-04-18 08:30:00', '2026-04-18 08:30:00', 1),
(2, 'GR-MS-0002', 1, 2, '2026-04-18', 'CONFIRMED', 838000,  0, 838000,  'Nhập mì Hảo Hảo và Oreo cho Mini Stop',      2, 1, '2026-04-18 10:00:00', '2026-04-18 10:00:00', 1),
(3, 'GR-MS-0003', 1, 3, '2026-04-19', 'CONFIRMED', 1118400, 0, 1118400, 'Nhập sữa Vinamilk cho Mini Stop',            2, 1, '2026-04-19 08:45:00', '2026-04-19 08:45:00', 1),

(4, 'GR-CK-0001', 2, 4, '2026-04-19', 'CONFIRMED', 1796400, 0, 1796400, 'Nhập Sting, Nescafe, Aquafina cho Circlek',  3, 1, '2026-04-19 09:00:00', '2026-04-19 09:00:00', 4),
(5, 'GR-CK-0002', 2, 5, '2026-04-19', 'CONFIRMED', 620000,  0, 620000,  'Nhập Oishi cho Circlek',                     3, 1, '2026-04-19 10:15:00', '2026-04-19 10:15:00', 4),
(6, 'GR-CK-0003', 2, 6, '2026-04-19', 'CONFIRMED', 1164000, 0, 1164000, 'Nhập TH True Milk cho Circlek',              3, 1, '2026-04-19 11:00:00', '2026-04-19 11:00:00', 4);

-- =========================================================
-- 8) GOODS_RECEIPT_ITEMS
-- =========================================================
INSERT INTO sales_management_mini.goods_receipt_items
(receipt_item_id, receipt_id, variant_id, quantity, unit_cost, discount_amount, line_total)
VALUES
(1, 1, 1, 48,  7500, 0, 360000),
(2, 1, 2, 36,  8500, 0, 306000),
(3, 1, 3, 48,  7300, 0, 350400),
(4, 1, 4, 24,  8300, 0, 199200),

(5, 2, 5, 60,  3200, 0, 192000),
(6, 2, 6, 40,  5500, 0, 220000),
(7, 2, 9, 30,  9200, 0, 276000),
(8, 2, 10,50,  3000, 0, 150000),

(9,  3, 7, 72,  6200, 0, 446400),
(10, 3, 8, 24, 28000, 0, 672000),

(11, 4, 11,48,  8800, 0, 422400),
(12, 4, 12,24,  9000, 0, 216000),
(13, 4, 17,36,  9500, 0, 342000),
(14, 4, 18,24, 10500, 0, 252000),
(15, 4, 19,60,  5000, 0, 300000),
(16, 4, 20,24, 11000, 0, 264000),

(17, 5, 15,40,  6500, 0, 260000),
(18, 5, 16,30, 12000, 0, 360000),

(19, 6, 13,60,  7000, 0, 420000),
(20, 6, 14,24, 31000, 0, 744000);

-- =========================================================
-- 9) INVENTORIES
-- Store 1 dùng kho tổng = 1
-- Store 2 dùng kho tổng = 4
-- =========================================================
INSERT INTO sales_management_mini.inventories
(inventory_id, store_id, variant_id, quantity_on_hand, reserved_qty, updated_at, warehouse_id)
VALUES
(1,  1, 1,  41, 3, '2026-04-19 12:00:00', 1),
(2,  1, 2,  30, 2, '2026-04-19 12:00:00', 1),
(3,  1, 3,  42, 2, '2026-04-19 12:00:00', 1),
(4,  1, 4,  20, 1, '2026-04-19 12:00:00', 1),
(5,  1, 5,  52, 3, '2026-04-19 12:00:00', 1),
(6,  1, 6,  33, 1, '2026-04-19 12:00:00', 1),
(7,  1, 7,  65, 4, '2026-04-19 12:00:00', 1),
(8,  1, 8,  20, 1, '2026-04-19 12:00:00', 1),
(9,  1, 9,  24, 2, '2026-04-19 12:00:00', 1),
(10, 1, 10, 44, 2, '2026-04-19 12:00:00', 1),

(11, 2, 11, 40, 2, '2026-04-19 12:10:00', 4),
(12, 2, 12, 18, 1, '2026-04-19 12:10:00', 4),
(13, 2, 13, 52, 3, '2026-04-19 12:10:00', 4),
(14, 2, 14, 20, 1, '2026-04-19 12:10:00', 4),
(15, 2, 15, 34, 2, '2026-04-19 12:10:00', 4),
(16, 2, 16, 25, 1, '2026-04-19 12:10:00', 4),
(17, 2, 17, 30, 2, '2026-04-19 12:10:00', 4),
(18, 2, 18, 20, 1, '2026-04-19 12:10:00', 4),
(19, 2, 19, 52, 3, '2026-04-19 12:10:00', 4),
(20, 2, 20, 18, 1, '2026-04-19 12:10:00', 4);

COMMIT;