-- =====================================================
-- MEGAFOOD - Полезные SQL запросы для анализа
-- =====================================================

-- =====================================================
-- 1. ПОИСК ЗАКАЗОВ ПО КЛИЕНТАМ
-- =====================================================

-- 1.1. Найти все заказы по номеру телефона
SELECT 
    o.order_number,
    o.total_amount,
    o.status,
    o.created_at,
    u.surname || ' ' || u.name || ' ' || u.patronymic as full_name,
    u.phone
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.phone LIKE '%79001234567%'
ORDER BY o.created_at DESC;

-- 1.2. Найти все заказы по фамилии
SELECT 
    o.order_number,
    o.total_amount,
    o.status,
    o.created_at,
    u.surname || ' ' || u.name as full_name,
    u.phone
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.surname LIKE '%Иванов%'
ORDER BY o.created_at DESC;

-- 1.3. Детальная информация о заказе с товарами
SELECT 
    o.order_number,
    o.created_at as date,
    o.status,
    o.total_amount,
    o.delivery_address,
    o.delivery_type,
    o.tip_amount as чаевые,
    o.payment_method as способ_оплаты,
    u.surname || ' ' || u.name as клиент,
    u.phone as телефон,
    oi.product_name as товар,
    oi.quantity as количество,
    oi.price_per_item as цена,
    (oi.quantity * oi.price_per_item) as сумма,
    oi.addons as добавки
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = '#6034'
ORDER BY oi.id;

-- =====================================================
-- 2. СТАТИСТИКА ПО КЛИЕНТАМ
-- =====================================================

-- 2.1. Топ клиентов по сумме заказов
SELECT 
    u.surname || ' ' || u.name as клиент,
    u.phone,
    COUNT(o.id) as количество_заказов,
    SUM(o.total_amount) as общая_сумма,
    AVG(o.total_amount) as средний_чек,
    MAX(o.created_at) as последний_заказ
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY общая_сумма DESC;

-- 2.2. Клиенты с премиум статусом
SELECT 
    surname || ' ' || name as клиент,
    phone,
    balance,
    bonus,
    COUNT(o.id) as заказов,
    SUM(o.total_amount) as потрачено
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.is_premium = 1
GROUP BY u.id;

-- 2.3. Неактивные клиенты (не делали заказы >30 дней)
SELECT 
    surname || ' ' || name as клиент,
    phone,
    MAX(o.created_at) as последний_заказ,
    julianday('now') - julianday(MAX(o.created_at)) as дней_назад
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
HAVING последний_заказ IS NULL 
   OR дней_назад > 30
ORDER BY дней_назад DESC;

-- =====================================================
-- 3. АНАЛИЗ ЗАКАЗОВ
-- =====================================================

-- 3.1. Заказы по статусам
SELECT 
    status,
    COUNT(*) as количество,
    SUM(total_amount) as сумма,
    AVG(total_amount) as средний_чек
FROM orders
GROUP BY status
ORDER BY количество DESC;

-- 3.2. Заказы по типам доставки
SELECT 
    delivery_type,
    COUNT(*) as количество,
    SUM(total_amount) as сумма,
    AVG(tip_amount) as средние_чаевые
FROM orders
GROUP BY delivery_type;

-- 3.3. Заказы за сегодня
SELECT 
    strftime('%H', created_at) as час,
    COUNT(*) as количество,
    SUM(total_amount) as сумма
FROM orders
WHERE DATE(created_at) = DATE('now')
GROUP BY час
ORDER BY час;

-- 3.4. Заказы с чаевыми
SELECT 
    o.order_number,
    u.surname || ' ' || u.name as клиент,
    o.total_amount as сумма_заказа,
    o.tip_amount as чаевые,
    ROUND(CAST(o.tip_amount AS FLOAT) / o.total_amount * 100, 2) as процент
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.tip_amount > 0
ORDER BY o.tip_amount DESC;

-- =====================================================
-- 4. ПОПУЛЯРНОСТЬ ТОВАРОВ
-- =====================================================

-- 4.1. Самые популярные товары
SELECT 
    product_name,
    product_icon,
    SUM(quantity) as продано_штук,
    COUNT(DISTINCT order_id) as количество_заказов,
    SUM(quantity * price_per_item) as выручка
FROM order_items
GROUP BY product_name, product_icon
ORDER BY продано_штук DESC
LIMIT 10;

-- 4.2. Товары, которые часто заказывают вместе
SELECT 
    a.product_name as товар1,
    b.product_name as товар2,
    COUNT(*) as раз_вместе
FROM order_items a
JOIN order_items b ON a.order_id = b.order_id 
    AND a.product_name < b.product_name
GROUP BY a.product_name, b.product_name
ORDER BY раз_вместе DESC
LIMIT 10;

-- 4.3. Бонусные товары статистика
SELECT 
    product_name,
    SUM(quantity) as продано,
    SUM(quantity * price_per_item) as потрачено_бонусов
FROM order_items
WHERE is_bonus = 1
GROUP BY product_name
ORDER BY продано DESC;

-- =====================================================
-- 5. ФИНАНСОВАЯ АНАЛИТИКА
-- =====================================================

-- 5.1. Ежедневная выручка за последние 30 дней
SELECT 
    DATE(created_at) as дата,
    COUNT(*) as заказов,
    SUM(total_amount) as выручка,
    SUM(tip_amount) as чаевые,
    SUM(cashback_earned) as начислено_кешбэка
FROM orders
WHERE created_at >= DATE('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY дата DESC;

-- 5.2. Почасовая статистика (пиковые часы)
SELECT 
    strftime('%H', created_at) as час,
    AVG(total_amount) as средний_чек,
    COUNT(*) as количество,
    SUM(total_amount) as сумма
FROM orders
GROUP BY час
ORDER BY количество DESC;

-- 5.3. Использование промокодов
SELECT 
    p.code,
    p.discount_type,
    p.discount_value,
    COUNT(pu.id) as использовано_раз,
    COUNT(DISTINCT pu.user_id) as уникальных_клиентов
FROM promocodes p
LEFT JOIN promo_usage pu ON p.id = pu.promo_id
GROUP BY p.id
ORDER BY использовано_раз DESC;

-- 5.4. Баланс пользователей
SELECT 
    CASE 
        WHEN balance >= 50000 THEN 'VIP (>50k)'
        WHEN balance >= 10000 THEN 'Активные (10k-50k)'
        WHEN balance >= 1000 THEN 'Средние (1k-10k)'
        ELSE 'Мало средств'
    END as категория,
    COUNT(*) as количество,
    AVG(balance) as средний_баланс,
    SUM(balance) as общий_баланс
FROM users
GROUP BY категория
ORDER BY общий_баланс DESC;

-- =====================================================
-- 6. ОЦЕНКИ И ОТЗЫВЫ
-- =====================================================

-- 6.1. Распределение оценок
SELECT 
    rating,
    COUNT(*) as количество,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE rating IS NOT NULL), 2) as процент
FROM orders
WHERE rating IS NOT NULL
GROUP BY rating
ORDER BY rating DESC;

-- 6.2. Лучшие отзывы (с текстом)
SELECT 
    o.order_number,
    u.name as клиент,
    o.rating,
    o.review_text as отзыв,
    o.created_at as дата
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.review_text IS NOT NULL AND o.review_text != ''
ORDER BY o.rating DESC, o.created_at DESC
LIMIT 20;

-- 6.3. Средний рейтинг по типам доставки
SELECT 
    o.delivery_type,
    AVG(o.rating) as средний_рейтинг,
    COUNT(o.rating) as количество_оценок
FROM orders o
WHERE o.rating IS NOT NULL
GROUP BY o.delivery_type;

-- =====================================================
-- 7. АДМИНИСТРАТИВНЫЕ ЗАПРОСЫ
-- =====================================================

-- 7.1. Полная информация о пользователе (для поддержки)
SELECT 
    u.id,
    u.surname || ' ' || u.name || ' ' || u.patronymic as ФИО,
    u.phone,
    u.balance,
    u.bonus,
    CASE WHEN u.is_premium THEN 'Да' ELSE 'Нет' END as премиум,
    u.created_at as дата_регистрации,
    u.last_login as последний_вход,
    COUNT(DISTINCT o.id) as всего_заказов,
    SUM(o.total_amount) as всего_потрачено,
    GROUP_CONCAT(DISTINCT c.last_four) as карты
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN cards c ON u.id = c.user_id
WHERE u.phone = '+79001234567'
GROUP BY u.id;

-- 7.2. Поиск заказов по адресу
SELECT 
    o.order_number,
    o.delivery_address,
    u.name as клиент,
    u.phone,
    o.status,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.delivery_address LIKE '%Тверская%'
ORDER BY o.created_at DESC;

-- 7.3. Заказы за период с суммой
SELECT 
    o.order_number,
    u.surname || ' ' || u.name as клиент,
    o.total_amount,
    o.status,
    o.created_at,
    GROUP_CONCAT(oi.product_name || ' (' || oi.quantity || ' шт)') as состав
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
WHERE DATE(o.created_at) BETWEEN DATE('now', '-7 days') AND DATE('now')
GROUP BY o.id
ORDER BY o.created_at DESC;

-- =====================================================
-- 8. ОПТИМИЗАЦИЯ И ОБСЛУЖИВАНИЕ
-- =====================================================

-- 8.1. Размер таблиц
SELECT 
    name as таблица,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=name) as записей
FROM sqlite_master 
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;

-- 8.2. Статистика индексов
SELECT 
    name as индекс,
    tbl_name as таблица
FROM sqlite_master 
WHERE type='index' AND name NOT LIKE 'sqlite_%';

-- 8.3. Проверка целостности БД
PRAGMA integrity_check;

-- 8.4. Оптимизация БД
VACUUM;
ANALYZE;

-- =====================================================
-- 9. ЭКСПОРТ ДАННЫХ ДЛЯ ОТЧЕТОВ
-- =====================================================

-- 9.1. Отчет для бухгалтерии (все заказы за месяц)
SELECT 
    o.order_number as 'Номер заказа',
    datetime(o.created_at, 'localtime') as 'Дата и время',
    u.surname || ' ' || u.name as 'Клиент',
    u.phone as 'Телефон',
    o.total_amount as 'Сумма',
    o.tip_amount as 'Чаевые',
    o.payment_method as 'Способ оплаты',
    o.status as 'Статус'
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')
ORDER BY o.created_at DESC;

-- 9.2. Отчет по бонусной программе
SELECT 
    u.surname || ' ' || u.name as 'Клиент',
    u.phone,
    u.bonus as 'Текущие бонусы',
    SUM(CASE WHEN oi.is_bonus THEN oi.quantity * oi.price_per_item ELSE 0 END) as 'Использовано бонусов',
    SUM(o.cashback_earned) as 'Начислено кешбэка'
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.is_bonus = 1
GROUP BY u.id
ORDER BY u.bonus DESC;

-- =====================================================
-- 10. ПРОГНОЗЫ И АНАЛИТИКА
-- =====================================================

-- 10.1. Прогноз выручки на следующий месяц (на основе средних за 3 месяца)
WITH monthly_stats AS (
    SELECT 
        strftime('%Y-%m', created_at) as месяц,
        SUM(total_amount) as выручка
    FROM orders
    WHERE created_at >= DATE('now', '-3 months')
    GROUP BY месяц
)
SELECT 
    AVG(выручка) as прогноз_выручки,
    MAX(выручка) as оптимистичный,
    MIN(выручка) as пессимистичный
FROM monthly_stats;

-- 10.2. Самые прибыльные часы для рекламы
SELECT 
    strftime('%H', created_at) as час,
    AVG(total_amount) as средний_чек,
    COUNT(*) as заказов,
    SUM(total_amount) as выручка
FROM orders
GROUP BY час
HAVING выручка > (
    SELECT AVG(выручка) FROM (
        SELECT SUM(total_amount) as выручка
        FROM orders
        GROUP BY strftime('%H', created_at)
    )
)
ORDER BY выручка DESC;