-- =====================================================
-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ MEGAFOOD
-- Включает DROP TABLE, CREATE, тестовые данные,
-- функции проверки статуса заказа.
-- Объём ~1000 строк.
-- =====================================================

-- =====================================================
-- 1. Удаление всех таблиц (если существуют)
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS promocodes CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS item_addons CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS saved_cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 2. Удаление типов ENUM
-- =====================================================
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS delivery_speed CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- =====================================================
-- 3. Создание ENUM-типов
-- =====================================================
CREATE TYPE order_status AS ENUM ('new', 'confirmed', 'cooking', 'delivering', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'bonus');
CREATE TYPE delivery_speed AS ENUM ('standard', 'medium', 'express');
CREATE TYPE transaction_type AS ENUM ('replenish', 'payment', 'cashback', 'bonus_spend', 'refund');

-- =====================================================
-- 4. Создание таблиц
-- =====================================================

-- Пользователи
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    surname         VARCHAR(50) NOT NULL,
    name            VARCHAR(50) NOT NULL,
    patronymic      VARCHAR(50),
    phone           VARCHAR(20) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_emoji    VARCHAR(10) DEFAULT '👤',
    balance         INT DEFAULT 0 CHECK (balance >= 0),
    bonus_points    INT DEFAULT 0 CHECK (bonus_points >= 0),
    cashback_rate   INT DEFAULT 5,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL
);

-- Сохранённые карты
CREATE TABLE saved_cards (
    card_id         SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    card_number     VARCHAR(19) NOT NULL,
    expiry          VARCHAR(5) NOT NULL,
    holder_name     VARCHAR(100),
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Адреса
CREATE TABLE addresses (
    address_id      SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    street_house    VARCHAR(100) NOT NULL,
    apartment       VARCHAR(10),
    entrance        VARCHAR(10),
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Категории
CREATE TABLE categories (
    category_id     SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    icon_emoji      VARCHAR(10),
    sort_order      INT DEFAULT 0
);

-- Товары
CREATE TABLE menu_items (
    item_id         SERIAL PRIMARY KEY,
    category_id     INT NOT NULL REFERENCES categories(category_id),
    name            VARCHAR(100) NOT NULL,
    base_price      INT NOT NULL CHECK (base_price >= 0),
    description     TEXT,
    composition     TEXT,
    weight_grams    INT,
    calories        INT,
    cooking_time_min INT DEFAULT 10,
    rating          DECIMAL(3,2) DEFAULT 5.0,
    icon_emoji      VARCHAR(10),
    is_popular      BOOLEAN DEFAULT FALSE,
    is_available    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавки
CREATE TABLE addons (
    addon_id        SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    price           INT NOT NULL CHECK (price >= 0),
    icon_emoji      VARCHAR(10)
);

-- Связь товаров и добавок
CREATE TABLE item_addons (
    item_id         INT REFERENCES menu_items(item_id) ON DELETE CASCADE,
    addon_id        INT REFERENCES addons(addon_id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, addon_id)
);

-- Корзина
CREATE TABLE cart_items (
    cart_item_id    SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    item_id         INT NOT NULL REFERENCES menu_items(item_id),
    quantity        INT NOT NULL CHECK (quantity > 0),
    selected_addons JSONB DEFAULT '[]',
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заказы
CREATE TABLE orders (
    order_id            SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(user_id),
    address_id          INT NOT NULL REFERENCES addresses(address_id),
    order_number        VARCHAR(20) UNIQUE NOT NULL,
    status              order_status DEFAULT 'new',
    delivery_speed      delivery_speed DEFAULT 'standard',
    delivery_fee        INT DEFAULT 0,
    urgency_surcharge   INT DEFAULT 0,
    tip_amount          INT DEFAULT 0,
    promo_discount      INT DEFAULT 0,
    bonus_used          INT DEFAULT 0,
    subtotal            INT NOT NULL,
    total_amount        INT NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at        TIMESTAMP,
    cooking_started_at  TIMESTAMP,
    ready_at            TIMESTAMP,
    delivered_at        TIMESTAMP,
    cancelled_at        TIMESTAMP,
    expected_delivery_minutes INT DEFAULT 60,
    courier_phone       VARCHAR(20)
);

-- Состав заказа
CREATE TABLE order_items (
    order_item_id   SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    item_name       VARCHAR(100) NOT NULL,
    quantity        INT NOT NULL,
    price_at_time   INT NOT NULL,
    selected_addons JSONB DEFAULT '[]',
    total_item_price INT NOT NULL
);

-- Транзакции
CREATE TABLE transactions (
    transaction_id  SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id),
    order_id        INT NULL REFERENCES orders(order_id) ON DELETE SET NULL,
    type            transaction_type NOT NULL,
    amount          INT NOT NULL,
    balance_before  INT NOT NULL,
    balance_after   INT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Промокоды
CREATE TABLE promocodes (
    promo_id        SERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    discount_type   VARCHAR(20) NOT NULL,
    discount_value  INT NOT NULL,
    min_order_amount INT DEFAULT 0,
    max_discount    INT,
    valid_from      TIMESTAMP NOT NULL,
    valid_until     TIMESTAMP NOT NULL,
    usage_limit     INT,
    used_count      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

-- Избранное
CREATE TABLE wishlist (
    user_id         INT REFERENCES users(user_id) ON DELETE CASCADE,
    item_id         INT REFERENCES menu_items(item_id) ON DELETE CASCADE,
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id)
);

-- Чат с курьером
CREATE TABLE chat_messages (
    message_id      SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    sender_type     VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'courier', 'system')),
    message_text    TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Отслеживание
CREATE TABLE tracking_events (
    event_id        SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    status          order_status NOT NULL,
    location_lat    DECIMAL(10,8),
    location_lng    DECIMAL(11,8),
    message         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Отзывы
CREATE TABLE reviews (
    review_id       SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id),
    order_id        INT NOT NULL UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    courier_rating  INT CHECK (courier_rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Уведомления
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    order_id        INT NULL REFERENCES orders(order_id) ON DELETE SET NULL,
    title           VARCHAR(100),
    body            TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. Индексы для производительности
-- =====================================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_user_id ON cart_items(user_id);
CREATE INDEX idx_chat_order_id ON chat_messages(order_id);
CREATE INDEX idx_tracking_order_id ON tracking_events(order_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- 6. Триггер для updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Представления
-- =====================================================

-- Детали заказа с товарами
CREATE OR REPLACE VIEW order_details_view AS
SELECT 
    o.order_id,
    o.order_number,
    o.status,
    o.created_at,
    o.total_amount,
    o.subtotal,
    o.tip_amount,
    o.delivery_speed,
    o.expected_delivery_minutes,
    u.user_id,
    u.surname || ' ' || u.name AS customer_name,
    u.phone AS customer_phone,
    a.street_house,
    a.apartment,
    COALESCE(
        (SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'name', oi.item_name,
                'quantity', oi.quantity,
                'price', oi.price_at_time,
                'modifiers', oi.selected_addons,
                'total', oi.total_item_price
            )
        )
        FROM order_items oi
        WHERE oi.order_id = o.order_id
        ), '[]'::JSONB
    ) AS items
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN addresses a ON o.address_id = a.address_id;

-- Корзина пользователя
CREATE OR REPLACE VIEW user_cart_view AS
SELECT 
    c.user_id,
    c.cart_item_id,
    c.item_id,
    m.name AS item_name,
    m.base_price,
    c.quantity,
    c.selected_addons,
    (m.base_price + COALESCE((SELECT SUM(price) FROM jsonb_to_recordset(c.selected_addons) AS x(price INT)), 0)) * c.quantity AS total_price
FROM cart_items c
JOIN menu_items m ON c.item_id = m.item_id;

-- =====================================================
-- 8. Функция для начисления кэшбэка
-- =====================================================
CREATE OR REPLACE FUNCTION earn_cashback(p_order_id INT)
RETURNS VOID AS $$
DECLARE
    v_user_id INT;
    v_subtotal INT;
    v_cashback_rate INT;
    v_cashback_amount INT;
    v_balance_before INT;
    v_balance_after INT;
BEGIN
    SELECT o.user_id, o.subtotal INTO v_user_id, v_subtotal
    FROM orders o WHERE o.order_id = p_order_id;
    
    SELECT cashback_rate INTO v_cashback_rate FROM users WHERE user_id = v_user_id;
    
    v_cashback_amount := FLOOR(v_subtotal * v_cashback_rate / 100);
    
    IF v_cashback_amount > 0 THEN
        SELECT balance INTO v_balance_before FROM users WHERE user_id = v_user_id;
        UPDATE users SET balance = balance + v_cashback_amount, bonus_points = bonus_points + v_cashback_amount
        WHERE user_id = v_user_id;
        SELECT balance INTO v_balance_after FROM users WHERE user_id = v_user_id;
        
        INSERT INTO transactions (user_id, order_id, type, amount, balance_before, balance_after, description)
        VALUES (v_user_id, p_order_id, 'cashback', v_cashback_amount, v_balance_before, v_balance_after,
                format('Кэшбэк %s%% за заказ', v_cashback_rate));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Функция для проверки статуса заказа
-- =====================================================
CREATE OR REPLACE FUNCTION get_order_status(p_order_id INT)
RETURNS TABLE (
    order_number VARCHAR(20),
    status_text VARCHAR(30),
    status_description TEXT,
    estimated_delivery_minutes INT,
    current_location VARCHAR(100),
    last_update TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_number,
        o.status::VARCHAR,
        CASE o.status
            WHEN 'new' THEN 'Заказ принят, ожидает подтверждения'
            WHEN 'confirmed' THEN 'Заказ подтверждён, готовится'
            WHEN 'cooking' THEN 'Повара готовят ваш заказ'
            WHEN 'delivering' THEN 'Курьер уже в пути'
            WHEN 'delivered' THEN 'Заказ доставлен'
            WHEN 'cancelled' THEN 'Заказ отменён'
            ELSE 'Статус неизвестен'
        END,
        CASE 
            WHEN o.status IN ('new', 'confirmed', 'cooking') THEN o.expected_delivery_minutes
            WHEN o.status = 'delivering' THEN GREATEST(0, o.expected_delivery_minutes - EXTRACT(EPOCH FROM (NOW() - o.created_at))/60)::INT
            ELSE 0
        END,
        COALESCE((SELECT message FROM tracking_events WHERE order_id = o.order_id ORDER BY created_at DESC LIMIT 1), 'Информация отсутствует'),
        COALESCE((SELECT created_at FROM tracking_events WHERE order_id = o.order_id ORDER BY created_at DESC LIMIT 1), o.created_at)
    FROM orders o
    WHERE o.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 10. Тестовые данные
-- =====================================================

-- Категории
INSERT INTO categories (name, icon_emoji, sort_order) VALUES
('burger', '🍔', 1),
('pizza', '🍕', 2),
('sushi', '🍣', 3),
('salad', '🥗', 4),
('drink', '🥤', 5),
('snack', '🍟', 6);

-- Добавки
INSERT INTO addons (name, price, icon_emoji) VALUES
('Сыр', 50, '🧀'),
('Бекон', 80, '🥓'),
('Халапенье', 100, '🌶️'),
('Икра масаго', 90, '🥚'),
('Сырный соус', 40, '🧀'),
('Териаки', 50, '🍯');

-- Товары
INSERT INTO menu_items (category_id, name, base_price, composition, weight_grams, calories, cooking_time_min, rating, icon_emoji, is_popular) VALUES
((SELECT category_id FROM categories WHERE name='burger'), 'Двойной бургер', 450, 'Говяжьи котлеты, булочка, салат, помидор, сыр', 350, 850, 15, 4.9, '🍔', true),
((SELECT category_id FROM categories WHERE name='pizza'), 'Маргарита', 550, 'Тесто, томатный соус, моцарелла, базилик', 450, 920, 20, 4.8, '🍕', true),
((SELECT category_id FROM categories WHERE name='sushi'), 'Филадельфия', 650, 'Рис, нори, лосось, сливочный сыр, огурец', 280, 580, 12, 4.9, '🍣', true),
((SELECT category_id FROM categories WHERE name='salad'), 'Цезарь с курицей', 350, 'Курица, салат айсберг, пармезан, сухарики, соус цезарь', 320, 420, 10, 4.7, '🥗', true),
((SELECT category_id FROM categories WHERE name='drink'), 'Coca-Cola', 100, 'Газированный напиток', 500, 210, 2, 4.9, '🥤', true),
((SELECT category_id FROM categories WHERE name='snack'), 'Картошка фри', 180, 'Картофель, масло, соль', 200, 320, 8, 4.8, '🍟', false),
((SELECT category_id FROM categories WHERE name='snack'), 'Куриные ножки', 250, 'Куриное филе в панировке', 250, 450, 10, 4.7, '🍗', false);

-- Связь товаров с добавками
INSERT INTO item_addons (item_id, addon_id)
SELECT m.item_id, a.addon_id
FROM menu_items m, addons a
WHERE m.name = 'Двойной бургер' AND a.name IN ('Сыр', 'Бекон')
UNION ALL
SELECT m.item_id, a.addon_id
FROM menu_items m, addons a
WHERE m.name = 'Маргарита' AND a.name = 'Халапенье'
UNION ALL
SELECT m.item_id, a.addon_id
FROM menu_items m, addons a
WHERE m.name = 'Филадельфия' AND a.name = 'Икра масаго'
UNION ALL
SELECT m.item_id, a.addon_id
FROM menu_items m, addons a
WHERE m.name = 'Цезарь с курицей' AND a.name = 'Сырный соус'
UNION ALL
SELECT m.item_id, a.addon_id
FROM menu_items m, addons a
WHERE m.name = 'Куриные ножки' AND a.name = 'Териаки';

-- Пользователи
INSERT INTO users (surname, name, patronymic, phone, password_hash, balance, bonus_points) VALUES
('Иванов', 'Иван', 'Иванович', '+79041234567', 'dummy_hash', 1250, 340),
('Петрова', 'Анна', 'Сергеевна', '+79041112233', 'dummy_hash', 5000, 1000),
('Сидоров', 'Пётр', 'Алексеевич', '+79042223344', 'dummy_hash', 320, 50);

-- Адреса
INSERT INTO addresses (user_id, street_house, apartment, entrance, is_default) VALUES
(1, 'Фрунзе 8', '42', '2', true),
(1, 'Ленина 15', '5', '1', false),
(2, 'Невский пр. 10', '5', '3', true),
(3, 'Гагарина 7', '12', '1', true);

-- Корзина (для пользователя 1)
INSERT INTO cart_items (user_id, item_id, quantity, selected_addons) VALUES
(1, (SELECT item_id FROM menu_items WHERE name='Двойной бургер'), 1, '[{"id":1,"name":"Сыр","price":50}]'),
(1, (SELECT item_id FROM menu_items WHERE name='Картошка фри'), 2, '[]');

-- Заказы
-- Заказ #3801 (доставлен)
INSERT INTO orders (user_id, address_id, order_number, status, delivery_speed, tip_amount, subtotal, total_amount, created_at, delivered_at) VALUES
(1, 1, '#3801', 'delivered', 'standard', 0, 1300, 1300, '2026-04-01 12:00:00', '2026-04-01 12:45:00');
INSERT INTO order_items (order_id, item_name, quantity, price_at_time, selected_addons, total_item_price) VALUES
(1, 'Двойной бургер', 1, 450, '[{"id":1,"name":"Сыр","price":50}]', 500),
(1, 'Картошка фри', 2, 180, '[]', 360);
INSERT INTO transactions (user_id, order_id, type, amount, balance_before, balance_after, description) VALUES
(1, 1, 'payment', -1300, 1250, -50, 'Оплата заказа #3801');
INSERT INTO reviews (user_id, order_id, rating, courier_rating, comment) VALUES
(1, 1, 5, 5, 'Спасибо за заказ!');

-- Заказ #3599 (с чаевыми)
INSERT INTO orders (user_id, address_id, order_number, status, delivery_speed, tip_amount, subtotal, total_amount, created_at, delivered_at) VALUES
(1, 1, '#3599', 'delivered', 'standard', 123, 877, 1000, '2026-04-01 14:30:00', '2026-04-01 15:20:00');
INSERT INTO order_items (order_id, item_name, quantity, price_at_time, selected_addons, total_item_price) VALUES
(2, 'Coca-Cola', 2, 100, '[]', 200),
(2, 'Куриные ножки', 1, 250, '[{"id":6,"name":"Териаки","price":50}]', 300);
INSERT INTO transactions (user_id, order_id, type, amount, balance_before, balance_after, description) VALUES
(1, 2, 'payment', -1000, -50, -1050, 'Оплата заказа #3599');

-- Заказ #9448 (в пути)
INSERT INTO orders (user_id, address_id, order_number, status, delivery_speed, urgency_surcharge, tip_amount, subtotal, total_amount, created_at, expected_delivery_minutes) VALUES
(1, 1, '#9448', 'delivering', 'express', 204, 0, 680, 884, CURRENT_TIMESTAMP, 30);
INSERT INTO order_items (order_id, item_name, quantity, price_at_time, selected_addons, total_item_price) VALUES
(3, 'Картошка фри', 1, 180, '[]', 180),
(3, 'Куриные ножки', 1, 250, '[]', 250);
INSERT INTO tracking_events (order_id, status, message) VALUES
(3, 'delivering', 'Курьер выехал, будет через 25 минут');

-- Заказ #4001 (готовится)
INSERT INTO orders (user_id, address_id, order_number, status, delivery_speed, subtotal, total_amount, created_at, expected_delivery_minutes) VALUES
(2, 3, '#4001', 'cooking', 'standard', 570, 570, '2026-04-02 10:15:00', 60);
INSERT INTO order_items (order_id, item_name, quantity, price_at_time, selected_addons, total_item_price) VALUES
(4, 'Чизкейк', 1, 250, '[]', 250),
(4, 'Coca-Cola', 1, 120, '[]', 120);
INSERT INTO tracking_events (order_id, status, message) VALUES
(4, 'cooking', 'Заказ готовится, повара уже работают');

-- Заказ #9555 (новый)
INSERT INTO orders (user_id, address_id, order_number, status, delivery_speed, subtotal, total_amount, created_at, expected_delivery_minutes) VALUES
(3, 4, '#9555', 'new', 'standard', 460, 460, CURRENT_TIMESTAMP - INTERVAL '5 minutes', 60);
INSERT INTO order_items (order_id, item_name, quantity, price_at_time, selected_addons, total_item_price) VALUES
(5, 'Картошка фри', 1, 180, '[]', 180),
(5, 'Чизкейк', 1, 250, '[]', 250);

-- Чат сообщения для заказа #9448
INSERT INTO chat_messages (order_id, sender_type, message_text, is_read) VALUES
(3, 'courier', 'Здравствуйте! Ваш заказ будет через 30 минут.', true),
(3, 'user', 'Спасибо, жду', true),
(3, 'courier', 'Подъезжаю, через 5 минут буду', false);

-- Уведомление для пользователя о новом сообщении
INSERT INTO notifications (user_id, order_id, title, body, is_read) VALUES
(1, 3, 'Новое сообщение от курьера', 'Курьер: Подъезжаю, через 5 минут буду', false);

-- =====================================================
-- 11. Примеры проверки статуса заказа
-- =====================================================

-- Проверить статус заказа #9448
SELECT * FROM get_order_status(3);

-- Проверить все заказы с подробностями
 SELECT * FROM order_details_view ORDER BY created_at DESC;

-- Посмотреть активные заказы (не доставленные и не отменённые)
SELECT * FROM orders WHERE status NOT IN ('delivered', 'cancelled');

-- =====================================================
-- Конец скрипта
-- =====================================================


-- =====================================================
-- 12. РАЗЛИЧНЫЕ JOIN, SELECT, GROUP BY, ORDER BY
-- =====================================================

-- 12.1. INNER JOIN: заказы + пользователи + адреса
SELECT o.order_number, u.surname, u.name, a.street_house, o.total_amount, o.status
FROM orders o
INNER JOIN users u ON o.user_id = u.user_id
INNER JOIN addresses a ON o.address_id = a.address_id
ORDER BY o.created_at DESC;

-- 12.2. LEFT JOIN: все пользователи и их заказы (даже если нет заказов)
SELECT u.user_id, u.surname, u.name, COUNT(o.order_id) AS orders_count, COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.surname, u.name
ORDER BY total_spent DESC;

-- 12.3. RIGHT JOIN (демонстрация): все заказы и возможные отзывы (редко нужно, но для полноты)
SELECT o.order_number, r.rating, r.comment
FROM reviews r
RIGHT JOIN orders o ON r.order_id = o.order_id
ORDER BY o.created_at DESC;

-- 12.4. GROUP BY + агрегатные функции: выручка по дням
SELECT DATE(created_at) AS day, 
       COUNT(*) AS orders_count, 
       SUM(total_amount) AS daily_revenue,
       AVG(total_amount) AS avg_order_value,
       SUM(tip_amount) AS total_tips
FROM orders
WHERE status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- 12.5. GROUP BY с HAVING: пользователи, потратившие более 1000 ₽
SELECT u.user_id, u.surname, u.name, SUM(o.total_amount) AS total_spent
FROM users u
JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.surname, u.name
HAVING SUM(o.total_amount) > 1000
ORDER BY total_spent DESC;

-- 12.6. Подзапросы: топ-3 самых дорогих заказа
SELECT order_number, total_amount
FROM orders
WHERE total_amount IN (SELECT DISTINCT total_amount FROM orders ORDER BY total_amount DESC LIMIT 3)
ORDER BY total_amount DESC;

-- 12.7. Оконные функции: ранг заказов по сумме внутри каждого пользователя
SELECT order_number, user_id, total_amount,
       RANK() OVER (PARTITION BY user_id ORDER BY total_amount DESC) AS rank_within_user
FROM orders
ORDER BY user_id, rank_within_user;

-- =====================================================
-- 13. ПРОВЕРКА ОПЛАТЫ ЗАКАЗА (ФУНКЦИЯ)
-- =====================================================
CREATE OR REPLACE FUNCTION check_order_payment(p_order_id INT)
RETURNS TABLE (
    order_id INT,
    order_number VARCHAR(20),
    total_amount INT,
    payment_status VARCHAR(20),
    balance_after_payment INT,
    payment_exists BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_id,
        o.order_number,
        o.total_amount,
        CASE 
            WHEN EXISTS (SELECT 1 FROM transactions t WHERE t.order_id = o.order_id AND t.type = 'payment' AND t.amount < 0) 
            THEN 'Оплачен'
            ELSE 'Не оплачен'
        END,
        COALESCE((SELECT balance_after FROM transactions WHERE order_id = o.order_id AND type = 'payment' ORDER BY created_at DESC LIMIT 1), 0),
        EXISTS (SELECT 1 FROM transactions WHERE order_id = o.order_id AND type = 'payment') AS payment_exists
    FROM orders o
    WHERE o.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Пример использования: SELECT * FROM check_order_payment(1);

-- =====================================================
-- 14. СОХРАНЕНИЕ ЗАКАЗА (ПРОЦЕДУРА)
--    Принимает: пользователь, адрес, список товаров (JSON), способ доставки, чаевые
--    Создаёт заказ, списывает баланс, начисляет кэшбэк, очищает корзину
-- =====================================================
CREATE OR REPLACE PROCEDURE save_order(
    p_user_id INT,
    p_address_id INT,
    p_cart_items JSONB,          -- формат: [{"item_id":1, "quantity":2, "addons":[{"id":1,"name":"Сыр","price":50}]}]
    p_delivery_speed delivery_speed DEFAULT 'standard',
    p_tip_amount INT DEFAULT 0,
    p_promo_code VARCHAR(50) DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_order_id INT;
    v_order_number VARCHAR(20);
    v_subtotal INT := 0;
    v_total_amount INT := 0;
    v_urgency_surcharge INT := 0;
    v_delivery_fee INT := 0;
    v_promo_discount INT := 0;
    v_bonus_used INT := 0;
    v_user_balance_before INT;
    v_user_balance_after INT;
    v_item RECORD;
    v_item_total INT;
    v_cashback_rate INT;
BEGIN
    -- 1. Генерируем номер заказа
    v_order_number := '#' || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
    
    -- 2. Рассчитываем subtotal (сумма товаров без доставки и чаевых)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(item_id INT, quantity INT, addons JSONB)
    LOOP
        SELECT base_price INTO v_item_total FROM menu_items WHERE item_id = v_item.item_id;
        -- Сумма добавок
        v_item_total := v_item_total + COALESCE(
            (SELECT SUM(price) FROM jsonb_to_recordset(v_item.addons) AS a(price INT)), 0
        );
        v_item_total := v_item_total * v_item.quantity;
        v_subtotal := v_subtotal + v_item_total;
    END LOOP;
    
    -- 3. Надбавка за срочность (express: +30%, medium: +15%, standard: 0%)
    IF p_delivery_speed = 'medium' THEN
        v_urgency_surcharge := ROUND(v_subtotal * 0.15);
    ELSIF p_delivery_speed = 'express' THEN
        v_urgency_surcharge := ROUND(v_subtotal * 0.30);
    END IF;
    
    -- 4. Проверка промокода (упрощённо)
    IF p_promo_code IS NOT NULL THEN
        SELECT discount_value INTO v_promo_discount
        FROM promocodes
        WHERE code = p_promo_code AND is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW()
        LIMIT 1;
        IF v_promo_discount IS NULL THEN v_promo_discount := 0; END IF;
    END IF;
    
    -- 5. Итоговая сумма
    v_total_amount := v_subtotal + v_urgency_surcharge + p_tip_amount - v_promo_discount;
    
    -- 6. Проверяем баланс пользователя
    SELECT balance INTO v_user_balance_before FROM users WHERE user_id = p_user_id;
    IF v_user_balance_before < v_total_amount THEN
        RAISE EXCEPTION 'Недостаточно средств. Баланс: %, требуется: %', v_user_balance_before, v_total_amount;
    END IF;
    
    -- 7. Создаём запись заказа
    INSERT INTO orders (
        user_id, address_id, order_number, status, delivery_speed,
        urgency_surcharge, tip_amount, promo_discount, bonus_used,
        subtotal, total_amount, created_at, expected_delivery_minutes
    ) VALUES (
        p_user_id, p_address_id, v_order_number, 'new', p_delivery_speed,
        v_urgency_surcharge, p_tip_amount, v_promo_discount, 0,
        v_subtotal, v_total_amount, NOW(),
        CASE p_delivery_speed
            WHEN 'standard' THEN 60
            WHEN 'medium' THEN 45
            WHEN 'express' THEN 30
        END
    ) RETURNING order_id INTO v_order_id;
    
    -- 8. Добавляем позиции в order_items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(item_id INT, quantity INT, addons JSONB)
    LOOP
        DECLARE
            v_item_name VARCHAR(100);
            v_price_at_time INT;
            v_addons_total INT;
            v_item_total_price INT;
        BEGIN
            SELECT name, base_price INTO v_item_name, v_price_at_time
            FROM menu_items WHERE item_id = v_item.item_id;
            
            v_addons_total := COALESCE((SELECT SUM(price) FROM jsonb_to_recordset(v_item.addons) AS a(price INT)), 0);
            v_item_total_price := (v_price_at_time + v_addons_total) * v_item.quantity;
            
            INSERT INTO order_items (order_id, item_name, quantity, price_at_time, selected_addons, total_item_price)
            VALUES (v_order_id, v_item_name, v_item.quantity, v_price_at_time, v_item.addons, v_item_total_price);
        END;
    END LOOP;
    
    -- 9. Списание средств с баланса и запись транзакции
    UPDATE users SET balance = balance - v_total_amount WHERE user_id = p_user_id;
    SELECT balance INTO v_user_balance_after FROM users WHERE user_id = p_user_id;
    
    INSERT INTO transactions (user_id, order_id, type, amount, balance_before, balance_after, description)
    VALUES (p_user_id, v_order_id, 'payment', -v_total_amount, v_user_balance_before, v_user_balance_after,
            format('Оплата заказа %s', v_order_number));
    
    -- 10. Начисляем кэшбэк (вызываем функцию)
    PERFORM earn_cashback(v_order_id);
    
    -- 11. Очищаем корзину пользователя (удаляем cart_items)
    DELETE FROM cart_items WHERE user_id = p_user_id;
    
    -- 12. Добавляем стартовое событие трекинга
    INSERT INTO tracking_events (order_id, status, message)
    VALUES (v_order_id, 'new', 'Заказ создан, ожидает подтверждения');
    
    -- 13. Возвращаем ID заказа (через выходной параметр, если нужно)
    RAISE NOTICE 'Заказ % успешно создан. ID: %', v_order_number, v_order_id;
END;
$$;

-- =====================================================
-- 15. ПРИМЕР ВЫЗОВА ПРОЦЕДУРЫ СОХРАНЕНИЯ ЗАКАЗА
-- =====================================================
-- Сохраняем заказ для пользователя 1, адрес 1, товары: двойной бургер с сыром (1 шт) и картошка фри (2 шт)

CALL save_order(
    p_user_id := 1,
    p_address_id := 1,
    p_cart_items := '[
        {"item_id":1, "quantity":1, "addons":[{"id":1,"name":"Сыр","price":50}]},
        {"item_id":6, "quantity":2, "addons":[]}
    ]'::JSONB,
    p_delivery_speed := 'express',
    p_tip_amount := 100,
    p_promo_code := NULL
);


-- =====================================================
-- 16. ДОПОЛНИТЕЛЬНЫЕ SELECT ДЛЯ ПРОВЕРКИ ОПЛАТЫ
-- =====================================================

-- Проверить оплату для всех заказов
SELECT o.order_id, o.order_number, o.total_amount,
       CASE WHEN t.transaction_id IS NOT NULL THEN 'Оплачен' ELSE 'Не оплачен' END AS payment_status,
       t.balance_after AS balance_after_payment
FROM orders o
LEFT JOIN transactions t ON o.order_id = t.order_id AND t.type = 'payment'
ORDER BY o.created_at DESC;

-- Детальный отчёт по заказу с товарами и статусом оплаты
SELECT o.order_number, 
       o.total_amount,
       t.balance_before,
       t.balance_after,
       t.created_at AS payment_time,
       (SELECT jsonb_agg(item_name || ' x' || quantity) FROM order_items WHERE order_id = o.order_id) AS items
FROM orders o
LEFT JOIN transactions t ON o.order_id = t.order_id AND t.type = 'payment'
WHERE o.order_id = 1;

-- =====================================================
-- Конец добавленного блока
-- =====================================================

-- Проверить оплату заказа #1
SELECT * FROM check_order_payment(1);

-- Вызвать сохранение нового заказа (раскомментировать и выполнить)
CALL save_order(1, 1, '[{"item_id":1,"quantity":2,"addons":[]}]'::JSONB, 'express', 50, NULL);

-- Посмотреть результат
SELECT * FROM order_details_view WHERE order_number LIKE '#%' ORDER BY created_at DESC LIMIT 5;