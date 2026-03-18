-- =====================================================
-- MEGAFOOD - Резервное копирование данных
-- =====================================================

-- Создание резервной копии всех таблиц
.output backup_megafood_$(date +%Y%m%d_%H%M%S).sql

-- Сохраняем схему
.dump schema

-- Сохраняем данные с INSERT statements
SELECT '-- =====================================================';
SELECT '-- Резервная копия от ' || datetime('now', 'localtime');
SELECT '-- =====================================================';
SELECT '';

-- Пользователи
SELECT '-- Таблица: users';
SELECT 'DELETE FROM users;';
SELECT 'INSERT INTO users (id, surname, name, patronymic, phone, password, avatar, balance, bonus, is_premium, created_at, last_login) VALUES ';
SELECT group_concat(
    '(' || id || ',"' || surname || '","' || name || '","' || 
    IFNULL(patronymic, '') || '","' || phone || '","' || password || '","' || 
    avatar || '",' || balance || ',' || bonus || ',' || is_premium || ',"' || 
    created_at || '","' || IFNULL(last_login, '') || '")'
) || ';'
FROM users;

-- Заказы
SELECT '-- Таблица: orders';
SELECT 'DELETE FROM orders;';
SELECT 'INSERT INTO orders (id, user_id, order_number, total_amount, bonus_used, tip_amount, delivery_type, delivery_address, status, payment_method, cashback_earned, rating, review_text, created_at) VALUES ';
SELECT group_concat(
    '(' || id || ',' || user_id || ',"' || order_number || '",' || 
    total_amount || ',' || IFNULL(bonus_used, 0) || ',' || IFNULL(tip_amount, 0) || 
    ',"' || delivery_type || '","' || delivery_address || '","' || status || 
    '","' || IFNULL(payment_method, '') || '",' || IFNULL(cashback_earned, 0) || 
    ',' || IFNULL(rating, 'NULL') || ',"' || IFNULL(review_text, '') || '","' || 
    created_at || '")'
) || ';'
FROM orders;

-- Товары в заказах
SELECT '-- Таблица: order_items';
SELECT 'DELETE FROM order_items;';
SELECT 'INSERT INTO order_items (id, order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons) VALUES ';
SELECT group_concat(
    '(' || id || ',' || order_id || ',"' || product_name || '","' || 
    IFNULL(product_icon, '') || '",' || quantity || ',' || price_per_item || 
    ',' || is_bonus || ',"' || IFNULL(addons, '') || '")'
) || ';'
FROM order_items;

-- Карты
SELECT '-- Таблица: cards';
SELECT 'DELETE FROM cards;';
SELECT 'INSERT INTO cards (id, user_id, card_number, card_holder, expiry_date, last_four, is_default, created_at) VALUES ';
SELECT group_concat(
    '(' || id || ',' || user_id || ',"' || card_number || '","' || 
    card_holder || '","' || expiry_date || '","' || last_four || '",' || 
    is_default || ',"' || created_at || '")'
) || ';'
FROM cards;

-- Промокоды
SELECT '-- Таблица: promocodes';
SELECT 'DELETE FROM promocodes;';
SELECT 'INSERT INTO promocodes (id, code, discount_type, discount_value, max_uses, used_count, expires_at, is_active, created_at) VALUES ';
SELECT group_concat(
    '(' || id || ',"' || code || '","' || discount_type || '",' || 
    discount_value || ',' || IFNULL(max_uses, 'NULL') || ',' || used_count || 
    ',"' || IFNULL(expires_at, '') || '",' || is_active || ',"' || created_at || '")'
) || ';'
FROM promocodes;

-- Использование промокодов
SELECT '-- Таблица: promo_usage';
SELECT 'DELETE FROM promo_usage;';
SELECT 'INSERT INTO promo_usage (id, user_id, promo_id, order_id, used_at) VALUES ';
SELECT group_concat(
    '(' || id || ',' || user_id || ',' || promo_id || ',' || order_id || 
    ',"' || used_at || '")'
) || ';'
FROM promo_usage;

-- Транзакции
SELECT '-- Таблица: transactions';
SELECT 'DELETE FROM transactions;';
SELECT 'INSERT INTO transactions (id, user_id, type, amount, icon, order_id, created_at) VALUES ';
SELECT group_concat(
    '(' || id || ',' || user_id || ',"' || type || '",' || amount || 
    ',"' || IFNULL(icon, '') || '",' || IFNULL(order_id, 'NULL') || 
    ',"' || created_at || '")'
) || ';'
FROM transactions;

.output stdout
SELECT '';
SELECT '-- Резервное копирование завершено';