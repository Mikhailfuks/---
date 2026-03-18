-- Просмотр всех пользователей и их заказов
SELECT 
    u.id,
    u.surname || ' ' || u.name as full_name,
    u.phone,
    u.balance,
    COUNT(o.id) as orders_count,
    SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY total_spent DESC;

-- Просмотр деталей заказов по конкретному пользователю
SELECT 
    o.order_number,
    o.total_amount,
    o.status,
    o.created_at,
    oi.product_name,
    oi.quantity,
    oi.price_per_item
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 1
ORDER BY o.created_at DESC;

-- Поиск заказов по номеру телефона
SELECT 
    o.order_number,
    u.name,
    u.phone,
    o.total_amount,
    o.status,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.phone LIKE '%123%'
ORDER BY o.created_at DESC;

-- Статистика по дням
SELECT 
    DATE(created_at) as date,
    COUNT(*) as orders,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;