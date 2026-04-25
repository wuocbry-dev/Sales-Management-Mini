-- Du lieu mau bo sung cho AI Agent phan tich Sales-Management-Mini.
-- Chay sau DataBase_Sale.sql va Dulieumau.sql neu database chua co don ban.

START TRANSACTION;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM sales_management_mini.sales_return_items;
DELETE FROM sales_management_mini.sales_returns;
DELETE FROM sales_management_mini.payments;
DELETE FROM sales_management_mini.inventory_transactions
WHERE reference_type IN ('sales_order', 'sales_return');
DELETE FROM sales_management_mini.sales_order_items;
DELETE FROM sales_management_mini.sales_orders;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO sales_management_mini.sales_orders
(order_id, order_code, store_id, branch_id, customer_id, cashier_id, order_date, status, subtotal, discount_amount, total_amount, paid_amount, payment_status, note, created_at, updated_at)
VALUES
(1,  'SO-MS-0001', 1, 1, NULL, 2, '2026-04-20 08:35:00', 'completed',  76000,  0,  76000,  76000, 'paid', 'Ban le buoi sang',          '2026-04-20 08:35:00', '2026-04-20 08:35:00'),
(2,  'SO-MS-0002', 1, 1, NULL, 2, '2026-04-20 12:10:00', 'completed', 143000,  0, 143000, 143000, 'paid', 'Com bo do uong va snack',   '2026-04-20 12:10:00', '2026-04-20 12:10:00'),
(3,  'SO-MS-0003', 1, 2, NULL, 2, '2026-04-21 18:20:00', 'completed', 101000,  0, 101000, 101000, 'paid', 'Don chieu',                 '2026-04-21 18:20:00', '2026-04-21 18:20:00'),
(4,  'SO-MS-0004', 1, 2, NULL, 2, '2026-04-22 09:15:00', 'completed', 162500, 5000, 157500, 157500, 'paid', 'Giam gia combo',           '2026-04-22 09:15:00', '2026-04-22 09:15:00'),
(5,  'SO-MS-0005', 1, 1, NULL, 2, '2026-04-23 20:05:00', 'completed',  91000,  0,  91000,  91000, 'paid', 'Don toi',                   '2026-04-23 20:05:00', '2026-04-23 20:05:00'),
(6,  'SO-MS-0006', 1, 1, NULL, 2, '2026-04-24 13:25:00', 'completed', 126000,  0, 126000, 126000, 'paid', 'Don trua',                  '2026-04-24 13:25:00', '2026-04-24 13:25:00'),

(7,  'SO-CK-0001', 2, 3, NULL, 3, '2026-04-20 10:05:00', 'completed',  87500,  0,  87500,  87500, 'paid', 'Ban le Circlek',             '2026-04-20 10:05:00', '2026-04-20 10:05:00'),
(8,  'SO-CK-0002', 2, 4, NULL, 3, '2026-04-21 11:40:00', 'completed', 137000,  0, 137000, 137000, 'paid', 'Combo nuoc va snack',       '2026-04-21 11:40:00', '2026-04-21 11:40:00'),
(9,  'SO-CK-0003', 2, 3, NULL, 3, '2026-04-22 16:30:00', 'completed', 112500, 2500, 110000, 110000, 'paid', 'Giam gia nhe',             '2026-04-22 16:30:00', '2026-04-22 16:30:00'),
(10, 'SO-CK-0004', 2, 4, NULL, 3, '2026-04-23 19:45:00', 'completed',  97000,  0,  97000,  97000, 'paid', 'Don toi Circlek',            '2026-04-23 19:45:00', '2026-04-23 19:45:00'),
(11, 'SO-CK-0005', 2, 3, NULL, 3, '2026-04-24 08:20:00', 'completed', 159000,  0, 159000, 159000, 'paid', 'Don sang Circlek',           '2026-04-24 08:20:00', '2026-04-24 08:20:00'),
(12, 'SO-CK-0006', 2, 4, NULL, 3, '2026-04-24 21:10:00', 'completed', 121500, 1500, 120000, 120000, 'paid', 'Don dem Circlek',          '2026-04-24 21:10:00', '2026-04-24 21:10:00');

INSERT INTO sales_management_mini.sales_order_items
(order_item_id, order_id, variant_id, quantity, unit_price, discount_amount, line_total)
VALUES
(1,  1, 1,  3, 10000, 0, 30000), (2,  1, 5,  4,  5000, 0, 20000), (3,  1, 7,  2,  9000, 0, 18000), (4,  1, 10, 2, 5000, 0, 10000),
(5,  2, 2,  5, 12000, 0, 60000), (6,  2, 8,  1, 36000, 0, 36000), (7,  2, 9,  2, 13000, 0, 26000), (8,  2, 3,  2, 9500, 0, 19000), (9, 2, 6, 1, 8000, 0, 8000),
(10, 3, 4,  3, 11500, 0, 34500), (11, 3, 5,  5,  5000, 0, 25000), (12, 3, 7,  3,  9000, 0, 27000), (13, 3, 10, 3, 5000, 0, 15000),
(14, 4, 1,  4, 10000, 0, 40000), (15, 4, 2,  3, 12000, 0, 36000), (16, 4, 8,  2, 36000, 0, 72000), (17, 4, 9,  1, 13000, 0, 13000), (18, 4, 10, 3, 5000, 5000, 10500),
(19, 5, 3,  4,  9500, 0, 38000), (20, 5, 6,  2,  8000, 0, 16000), (21, 5, 9,  2, 13000, 0, 26000), (22, 5, 10, 2, 5000, 0, 10000), (23, 5, 5, 1, 5000, 0, 5000),
(24, 6, 1,  6, 10000, 0, 60000), (25, 6, 7,  4,  9000, 0, 36000), (26, 6, 10, 6, 5000, 0, 30000),

(27, 7, 11, 3, 12000, 0, 36000), (28, 7, 15, 4, 9000, 0, 36000), (29, 7, 19, 2, 7000, 0, 14000), (30, 7, 12, 1, 12500, 0, 12500),
(31, 8, 12, 4, 12500, 0, 50000), (32, 8, 14, 1, 39000, 0, 39000), (33, 8, 16, 3, 16000, 0, 48000),
(34, 9, 11, 5, 12000, 0, 60000), (35, 9, 13, 3, 10000, 0, 30000), (36, 9, 19, 5, 7000, 2500, 32500),
(37, 10, 17, 3, 13000, 0, 39000), (38, 10, 18, 2, 14500, 0, 29000), (39, 10, 15, 2, 9000, 0, 18000), (40, 10, 19, 1, 7000, 0, 7000), (41, 10, 20, 1, 15000, 0, 15000),
(42, 11, 14, 2, 39000, 0, 78000), (43, 11, 16, 3, 16000, 0, 48000), (44, 11, 12, 2, 12500, 0, 25000), (45, 11, 19, 1, 7000, 0, 7000), (46, 11, 20, 1, 15000, 0, 15000),
(47, 12, 11, 4, 12000, 0, 48000), (48, 12, 13, 4, 10000, 0, 40000), (49, 12, 15, 2, 9000, 0, 18000), (50, 12, 19, 2, 7000, 1500, 12500), (51, 12, 20, 1, 15000, 0, 15000);

INSERT INTO sales_management_mini.payments
(payment_id, store_id, order_id, return_id, payment_type, payment_method, amount, reference_no, note, paid_at, created_by, created_at)
VALUES
(1, 1, 1, NULL, 'in', 'cash', 76000, NULL, 'Thu tien don SO-MS-0001', '2026-04-20 08:35:00', 2, '2026-04-20 08:35:00'),
(2, 1, 2, NULL, 'in', 'cash', 143000, NULL, 'Thu tien don SO-MS-0002', '2026-04-20 12:10:00', 2, '2026-04-20 12:10:00'),
(3, 1, 3, NULL, 'in', 'cash', 101000, NULL, 'Thu tien don SO-MS-0003', '2026-04-21 18:20:00', 2, '2026-04-21 18:20:00'),
(4, 1, 4, NULL, 'in', 'cash', 157500, NULL, 'Thu tien don SO-MS-0004', '2026-04-22 09:15:00', 2, '2026-04-22 09:15:00'),
(5, 1, 5, NULL, 'in', 'cash', 91000, NULL, 'Thu tien don SO-MS-0005', '2026-04-23 20:05:00', 2, '2026-04-23 20:05:00'),
(6, 1, 6, NULL, 'in', 'cash', 126000, NULL, 'Thu tien don SO-MS-0006', '2026-04-24 13:25:00', 2, '2026-04-24 13:25:00'),
(7, 2, 7, NULL, 'in', 'cash', 87500, NULL, 'Thu tien don SO-CK-0001', '2026-04-20 10:05:00', 3, '2026-04-20 10:05:00'),
(8, 2, 8, NULL, 'in', 'cash', 137000, NULL, 'Thu tien don SO-CK-0002', '2026-04-21 11:40:00', 3, '2026-04-21 11:40:00'),
(9, 2, 9, NULL, 'in', 'cash', 110000, NULL, 'Thu tien don SO-CK-0003', '2026-04-22 16:30:00', 3, '2026-04-22 16:30:00'),
(10, 2, 10, NULL, 'in', 'cash', 97000, NULL, 'Thu tien don SO-CK-0004', '2026-04-23 19:45:00', 3, '2026-04-23 19:45:00'),
(11, 2, 11, NULL, 'in', 'cash', 159000, NULL, 'Thu tien don SO-CK-0005', '2026-04-24 08:20:00', 3, '2026-04-24 08:20:00'),
(12, 2, 12, NULL, 'in', 'cash', 120000, NULL, 'Thu tien don SO-CK-0006', '2026-04-24 21:10:00', 3, '2026-04-24 21:10:00');

INSERT INTO sales_management_mini.sales_returns
(return_id, return_code, order_id, store_id, customer_id, processed_by, return_date, status, refund_amount, note, created_at)
VALUES
(1, 'SR-MS-0001', 4, 1, NULL, 2, '2026-04-24 15:00:00', 'completed', 13000, 'Khach tra 1 goi Oreo', '2026-04-24 15:00:00');

INSERT INTO sales_management_mini.sales_return_items
(return_item_id, return_id, order_item_id, variant_id, quantity, unit_price, line_total, reason)
VALUES
(1, 1, 17, 9, 1, 13000, 13000, 'Doi tra hang con nguyen');

INSERT INTO sales_management_mini.payments
(payment_id, store_id, order_id, return_id, payment_type, payment_method, amount, reference_no, note, paid_at, created_by, created_at)
VALUES
(13, 1, NULL, 1, 'out', 'cash', 13000, NULL, 'Hoan tien SR-MS-0001', '2026-04-24 15:00:00', 2, '2026-04-24 15:00:00');

COMMIT;
