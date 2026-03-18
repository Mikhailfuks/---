-- =====================================================
-- MEGAFOOD - Начальное наполнение базы данных
-- =====================================================

-- =====================================================
-- 1. Промокоды
-- =====================================================
INSERT INTO promocodes (code, discount_type, discount_value, max_uses, expires_at) VALUES
    ('WELCOME10', 'percent', 10, 100, DATETIME('now', '+1 year')),
    ('BONUS50', 'fixed', 50, 50, DATETIME('now', '+6 months')),
    ('CASHBACK20', 'cashback', 20, 30, DATETIME('now', '+3 months')),
    ('FIRSTORDER', 'percent', 15, 200, DATETIME('now', '+2 months')),
    ('HAPPYHOUR', 'percent', 20, 50, DATETIME('now', '+1 month')),
    ('FREESHIP', 'fixed', 100, 25, DATETIME('now', '+2 weeks')),
    ('BONUSDOUBLE', 'cashback', 25, 40, DATETIME('now', '+45 days'));

-- =====================================================
-- 2. Тестовые пользователи
-- =====================================================
-- Пароль для всех тестовых пользователей: 'password123'
-- Хеш SHA256: 'password123' -> 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'

INSERT INTO users (surname, name, patronymic, phone, password, avatar, balance, bonus, is_premium, created_at) VALUES
    ('Иванов', 'Иван', 'Иванович', '+79001234567', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '👨‍💼', 25000, 5000, 1, DATETIME('now', '-30 days')),
    ('Петров', 'Петр', 'Петрович', '+79007654321', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '👨‍🔧', 15000, 2000, 0, DATETIME('now', '-20 days')),
    ('Сидорова', 'Анна', 'Сергеевна', '+79001112233', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '👩‍💼', 50000, 10000, 1, DATETIME('now', '-15 days')),
    ('Козлов', 'Дмитрий', 'Алексеевич', '+79004445566', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '👨‍🍳', 8000, 500, 0, DATETIME('now', '-10 days')),
    ('Морозова', 'Елена', 'Владимировна', '+79007778899', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '👩‍🎨', 35000, 7500, 1, DATETIME('now', '-5 days'));

-- =====================================================
-- 3. Заказы для тестовых пользователей
-- =====================================================

-- Заказ 1: Иван Иванов
INSERT INTO orders (user_id, order_number, total_amount, bonus_used, tip_amount, delivery_type, delivery_address, status, payment_method, cashback_earned, rating, review_text, created_at) VALUES
    (1, '#6034', 1250, 0, 100, 'express', 'Москва, Тверская 15, кв 42', 'Доставлен', 'card', 62, 5, 'Отличная доставка! Очень быстро и вкусно', DATETIME('now', '-2 days'));

INSERT INTO order_items (order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons) VALUES
    (1, 'Двойной бургер', '🍔', 2, 450, 0, 'Сыр,Бекон'),
    (1, 'Картошка фри', '🍟', 1, 150, 0, NULL),
    (1, 'Coca-Cola', '🥤', 2, 100, 0, 'Лимон');

-- Заказ 2: Петр Петров
INSERT INTO orders (user_id, order_number, total_amount, bonus_used, tip_amount, delivery_type, delivery_address, status, payment_method, cashback_earned, rating, review_text, created_at) VALUES
    (2, '#6042', 2100, 200, 50, 'standard', 'Москва, Ленина 10, кв 15', 'Доставлен', 'balance', 105, 4, 'Вкусно, но немного опоздали', DATETIME('now', '-5 days'));

INSERT INTO order_items (order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons) VALUES
    (2, 'Маргарита', '🍕', 1, 550, 0, 'Пепперони'),
    (2, 'Филадельфия', '🍣', 1, 650, 0, NULL),
    (2, 'Цезарь', '🥗', 1, 350, 0, 'Курица'),
    (2, 'Сок апельсиновый', '🧃', 2, 150, 1, NULL);

-- Заказ 3: Анна Сидорова
INSERT INTO orders (user_id, order_number, total_amount, bonus_used, tip_amount, delivery_type, delivery_address, status, payment_method, cashback_earned, rating, review_text, created_at) VALUES
    (3, '#6051', 3200, 500, 200, 'medium', 'Москва, Профсоюзная 60', 'Доставлен', 'card', 160, 5, 'Очень вкусно! Особенно суши', DATETIME('now', '-1 day'));

INSERT INTO order_items (order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons) VALUES
    (3, 'Суши-сет', '🍱', 1, 1200, 0, 'Имбирь,Васаби'),
    (3, 'Пепперони', '🍕', 1, 600, 0, 'Двойная пепперони'),
    (3, 'Ролл Калифорния', '🍣', 1, 550, 0, NULL),
    (3, 'Чай с бергамотом', '🫖', 2, 100, 1, NULL);

-- Заказ 4: Дмитрий Козлов (в пути)
INSERT INTO orders (user_id, order_number, total_amount, bonus_used, tip_amount, delivery_type, delivery_address, status, payment_method, cashback_earned, created_at) VALUES
    (4, '#6067', 950, 0, 0, 'standard', 'Москва, Новый Арбат 24', 'В пути', 'card', 47, DATETIME('now', '-3 hours'));

INSERT INTO order_items (order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons) VALUES
    (4, 'Двойной бургер', '🍔', 1, 450, 0, 'Сыр'),
    (4, 'Картошка фри', '🍟', 1, 150, 0, NULL),
    (4, 'Кофе американо', '☕', 1, 50, 1, NULL),
    (4, 'Вода', '💧', 1, 80, 0, NULL);

-- Заказ 5: Елена Морозова (готовится)
INSERT INTO orders (user_id, order_number, total_amount, bonus_used, tip_amount, delivery_type, delivery_address, status, payment_method, cashback_earned, created_at) VALUES
    (5, '#6078', 1850, 0, 150, 'express', 'Москва, Кутузовский 32', 'Готовится', 'card', 92, DATETIME('now', '-1 hour'));

INSERT INTO order_items (order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons) VALUES
    (5, 'Пепперони', '🍕', 1, 600, 0, 'Халапеньо'),
    (5, 'Цезарь', '🥗', 1, 350, 0, 'Креветки'),
    (5, 'Суп Том Ям', '🍲', 1, 450, 0, NULL),
    (5, 'Спринг-роллы', '🌯', 2, 200, 0, NULL),
    (5, 'Лимонад', '🍋', 2, 120, 1, NULL);

-- =====================================================
-- 4. Транзакции
-- =====================================================
INSERT INTO transactions (user_id, type, amount, icon, order_id, created_at) VALUES
    (1, 'Пополнение баланса', 5000, '💰', NULL, DATETIME('now', '-10 days')),
    (1, 'Оплата заказа', -1250, '🛒', 1, DATETIME('now', '-2 days')),
    (1, 'Кэшбэк', 62, '✨', 1, DATETIME('now', '-2 days')),
    (1, 'Колесо удачи', 300, '🎡', NULL, DATETIME('now', '-1 day')),
    
    (2, 'Пополнение баланса', 2000, '💰', NULL, DATETIME('now', '-7 days')),
    (2, 'Оплата заказа', -2100, '🛒', 2, DATETIME('now', '-5 days')),
    (2, 'Кэшбэк', 105, '✨', 2, DATETIME('now', '-5 days')),
    
    (3, 'Пополнение баланса', 10000, '💰', NULL, DATETIME('now', '-3 days')),
    (3, 'Оплата заказа', -3200, '🛒', 3, DATETIME('now', '-1 day')),
    (3, 'Кэшбэк', 160, '✨', 3, DATETIME('now', '-1 day')),
    
    (4, 'Пополнение баланса', 1000, '💰', NULL, DATETIME('now', '-5 hours')),
    (4, 'Оплата заказа', -950, '🛒', 4, DATETIME('now', '-3 hours'));

-- =====================================================
-- 5. Платежные карты
-- =====================================================
INSERT INTO cards (user_id, card_number, card_holder, expiry_date, last_four, is_default, created_at) VALUES
    (1, '4111111111111111', 'IVAN IVANOV', '12/25', '1111', 1, DATETIME('now', '-30 days')),
    (1, '5555555555554444', 'IVAN IVANOV', '10/24', '4444', 0, DATETIME('now', '-20 days')),
    
    (2, '4012888888881881', 'PETR PETROV', '08/26', '1881', 1, DATETIME('now', '-20 days')),
    
    (3, '5105105105105100', 'ANNA SIDOROVA', '03/25', '5100', 1, DATETIME('now', '-15 days')),
    (3, '4111111111111111', 'ANNA SIDOROVA', '05/24', '1111', 0, DATETIME('now', '-10 days')),
    
    (4, '4222222222222', 'DMITRY KOZLOV', '11/24', '2222', 1, DATETIME('now', '-10 days')),
    
    (5, '4000056655665556', 'ELENA MOROZOVA', '09/25', '5556', 1, DATETIME('now', '-5 days'));

-- =====================================================
-- 6. Использование промокодов
-- =====================================================
INSERT INTO promo_usage (user_id, promo_id, order_id, used_at) VALUES
    (1, 1, 1, DATETIME('now', '-2 days')),
    (2, 2, 2, DATETIME('now', '-5 days')),
    (3, 3, 3, DATETIME('now', '-1 day'));

-- =====================================================
-- 7. Обновление статистики промокодов
-- =====================================================
UPDATE promocodes SET used_count = 1 WHERE id = 1;
UPDATE promocodes SET used_count = 1 WHERE id = 2;
UPDATE promocodes SET used_count = 1 WHERE id = 3;

-- =====================================================
-- 8. Добавляем еще несколько заказов для статистики
-- =====================================================

-- Заказы за последние 30 дней для статистики
INSERT INTO orders (user_id, order_number, total_amount, delivery_address, status, created_at) VALUES
    (1, '#6091', 850, 'Москва, Тверская 15', 'Доставлен', DATETIME('now', '-15 days')),
    (1, '#6092', 1200, 'Москва, Тверская 15', 'Доставлен', DATETIME('now', '-10 days')),
    (1, '#6093', 2100, 'Москва, Тверская 15', 'Доставлен', DATETIME('now', '-5 days')),
    
    (2, '#6094', 650, 'Москва, Ленина 10', 'Доставлен', DATETIME('now', '-12 days')),
    (2, '#6095', 1800, 'Москва, Ленина 10', 'Доставлен', DATETIME('now', '-8 days')),
    
    (3, '#6096', 2700, 'Москва, Профсоюзная 60', 'Доставлен', DATETIME('now', '-20 days')),
    (3, '#6097', 3200, 'Москва, Профсоюзная 60', 'Доставлен', DATETIME('now', '-12 days'));

-- Добавляем товары к этим заказам
INSERT INTO order_items (order_id, product_name, product_icon, quantity, price_per_item) VALUES
    (6, 'Бургер', '🍔', 1, 350), (6, 'Кола', '🥤', 2, 100),
    (7, 'Пицца', '🍕', 1, 550), (7, 'Суши', '🍣', 1, 650),
    (8, 'Сет', '🍱', 1, 1200), (8, 'Роллы', '🍣', 2, 450),
    (9, 'Салат', '🥗', 1, 350), (9, 'Суп', '🍲', 1, 300),
    (10, 'Бургер', '🍔', 2, 450), (10, 'Фри', '🍟', 2, 150),
    (11, 'Суши-сет', '🍱', 1, 1200), (11, 'Пицца', '🍕', 1, 600), (11, 'Десерт', '🍰', 2, 250),
    (12, 'Роллы', '🍣', 3, 550), (12, 'Суп', '🍲', 1, 350), (12, 'Напитки', '🥤', 3, 100);

-- =====================================================
-- 9. Проверка целостности данных
-- =====================================================

-- Проверка внешних ключей
PRAGMA foreign_key_check;

-- Обновление статистики
ANALYZE;

-- =====================================================
-- 10. Создание дополнительных индексов после наполнения
-- =====================================================

CREATE INDEX idx_orders_composite ON orders(user_id, status, created_at);
CREATE INDEX idx_order_items_composite ON order_items(product_name, is_bonus);

-- =====================================================
-- Готово!
-- =====================================================
SELECT 'База данных MEGAFOOD успешно создана и наполнена!' as message;