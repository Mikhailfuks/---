import sqlite3
from datetime import datetime
from contextlib import contextmanager

class Database:
    def __init__(self, db_name='megafood.db'):
        self.db_name = db_name
        self.init_db()
    
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Таблица пользователей
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    surname TEXT NOT NULL,
                    name TEXT NOT NULL,
                    patronymic TEXT,
                    phone TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    avatar TEXT DEFAULT '👤',
                    balance INTEGER DEFAULT 21630,
                    bonus INTEGER DEFAULT 3210,
                    is_premium BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            ''')
            
            # Таблица заказов
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    order_number TEXT UNIQUE NOT NULL,
                    total_amount INTEGER NOT NULL,
                    bonus_used INTEGER DEFAULT 0,
                    tip_amount INTEGER DEFAULT 0,
                    delivery_type TEXT DEFAULT 'standard',
                    delivery_address TEXT NOT NULL,
                    status TEXT DEFAULT 'В пути',
                    payment_method TEXT,
                    cashback_earned INTEGER DEFAULT 0,
                    rating INTEGER,
                    review_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Таблица товаров в заказе
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id INTEGER,
                    product_name TEXT NOT NULL,
                    product_icon TEXT,
                    quantity INTEGER NOT NULL,
                    price_per_item INTEGER NOT NULL,
                    is_bonus BOOLEAN DEFAULT 0,
                    addons TEXT,
                    FOREIGN KEY (order_id) REFERENCES orders (id)
                )
            ''')
            
            # Таблица платежных карт
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    card_number TEXT NOT NULL,
                    card_holder TEXT NOT NULL,
                    expiry_date TEXT NOT NULL,
                    last_four TEXT NOT NULL,
                    is_default BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Таблица промокодов
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS promocodes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    discount_type TEXT NOT NULL,
                    discount_value INTEGER NOT NULL,
                    max_uses INTEGER,
                    used_count INTEGER DEFAULT 0,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
            ''')
            
            # Таблица использования промокодов
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS promo_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    promo_id INTEGER,
                    order_id INTEGER,
                    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (promo_id) REFERENCES promocodes (id),
                    FOREIGN KEY (order_id) REFERENCES orders (id)
                )
            ''')
            
            # Таблица транзакций
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    type TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    icon TEXT,
                    order_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (order_id) REFERENCES orders (id)
                )
            ''')
            
            # Добавляем тестовые промокоды
            cursor.execute('''
                INSERT OR IGNORE INTO promocodes (code, discount_type, discount_value, max_uses)
                VALUES 
                    ('WELCOME10', 'percent', 10, 100),
                    ('BONUS50', 'fixed', 50, 50),
                    ('CASHBACK20', 'cashback', 20, 30)
            ''')
            
            conn.commit()
    
    # ==================== USER METHODS ====================
    
    def create_user(self, surname, name, phone, password, patronymic='', avatar='👤'):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('''
                    INSERT INTO users (surname, name, patronymic, phone, password, avatar)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (surname, name, patronymic, phone, password, avatar))
                conn.commit()
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                return None
    
    def get_user_by_phone(self, phone):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            return cursor.fetchone()
    
    def get_user_by_id(self, user_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            return cursor.fetchone()
    
    def update_user(self, user_id, **kwargs):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            fields = []
            values = []
            for key, value in kwargs.items():
                if key in ['surname', 'name', 'patronymic', 'phone', 'avatar']:
                    fields.append(f"{key} = ?")
                    values.append(value)
            
            if fields:
                values.append(user_id)
                cursor.execute(f'''
                    UPDATE users 
                    SET {', '.join(fields)}
                    WHERE id = ?
                ''', values)
                conn.commit()
                return True
            return False
    
    def update_user_balance(self, user_id, amount_change):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET balance = balance + ?
                WHERE id = ?
            ''', (amount_change, user_id))
            conn.commit()
    
    def update_user_bonus(self, user_id, bonus_change):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET bonus = bonus + ?
                WHERE id = ?
            ''', (bonus_change, user_id))
            conn.commit()
    
    def set_premium(self, user_id, is_premium=True):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET is_premium = ?
                WHERE id = ?
            ''', (1 if is_premium else 0, user_id))
            conn.commit()
    
    # ==================== ORDER METHODS ====================
    
    def create_order(self, user_id, order_number, total_amount, delivery_address, 
                    delivery_type='standard', tip_amount=0, bonus_used=0, 
                    payment_method='card', cashback_earned=0):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO orders 
                (user_id, order_number, total_amount, delivery_address, 
                 delivery_type, tip_amount, bonus_used, payment_method, cashback_earned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, order_number, total_amount, delivery_address,
                  delivery_type, tip_amount, bonus_used, payment_method, cashback_earned))
            conn.commit()
            return cursor.lastrowid
    
    def add_order_item(self, order_id, product_name, quantity, price_per_item, 
                      product_icon='', is_bonus=False, addons=''):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO order_items 
                (order_id, product_name, product_icon, quantity, price_per_item, is_bonus, addons)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (order_id, product_name, product_icon, quantity, 
                  price_per_item, 1 if is_bonus else 0, addons))
            conn.commit()
    
    def get_user_orders(self, user_id, limit=50):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (user_id, limit))
            return cursor.fetchall()
    
    def get_order_details(self, order_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, u.name, u.surname, u.phone
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            ''', (order_id,))
            order = cursor.fetchone()
            
            if order:
                cursor.execute('''
                    SELECT * FROM order_items 
                    WHERE order_id = ?
                ''', (order_id,))
                items = cursor.fetchall()
                return dict(order), [dict(item) for item in items]
            return None, []
    
    def update_order_status(self, order_id, status):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE orders 
                SET status = ?
                WHERE id = ?
            ''', (status, order_id))
            conn.commit()
    
    def add_order_rating(self, order_id, rating, review_text=''):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE orders 
                SET rating = ?, review_text = ?
                WHERE id = ?
            ''', (rating, review_text, order_id))
            conn.commit()
    
    # ==================== CARD METHODS ====================
    
    def save_card(self, user_id, card_number, card_holder, expiry_date, last_four):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Проверяем, есть ли уже карты у пользователя
            cursor.execute('SELECT COUNT(*) as cnt FROM cards WHERE user_id = ?', (user_id,))
            count = cursor.fetchone()['cnt']
            
            cursor.execute('''
                INSERT INTO cards 
                (user_id, card_number, card_holder, expiry_date, last_four, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, card_number, card_holder, expiry_date, last_four, 1 if count == 0 else 0))
            conn.commit()
            return cursor.lastrowid
    
    def get_user_cards(self, user_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM cards WHERE user_id = ?', (user_id,))
            return cursor.fetchall()
    
    def set_default_card(self, user_id, card_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Сначала сбрасываем все карты
            cursor.execute('UPDATE cards SET is_default = 0 WHERE user_id = ?', (user_id,))
            # Устанавливаем выбранную как основную
            cursor.execute('UPDATE cards SET is_default = 1 WHERE id = ? AND user_id = ?', 
                         (card_id, user_id))
            conn.commit()
    
    # ==================== PROMOCODE METHODS ====================
    
    def get_promocode(self, code):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM promocodes 
                WHERE code = ? AND is_active = 1 
                AND (max_uses IS NULL OR used_count < max_uses)
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            ''', (code.upper(),))
            return cursor.fetchone()
    
    def use_promocode(self, user_id, promo_id, order_id):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO promo_usage (user_id, promo_id, order_id)
                VALUES (?, ?, ?)
            ''', (user_id, promo_id, order_id))
            
            cursor.execute('''
                UPDATE promocodes 
                SET used_count = used_count + 1 
                WHERE id = ?
            ''', (promo_id,))
            conn.commit()
    
    # ==================== TRANSACTION METHODS ====================
    
    def add_transaction(self, user_id, type, amount, icon='', order_id=None):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO transactions (user_id, type, amount, icon, order_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, type, amount, icon, order_id))
            conn.commit()
    
    def get_user_transactions(self, user_id, limit=50):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM transactions 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (user_id, limit))
            return cursor.fetchall()
    
    # ==================== ADMIN QUERIES ====================
    
    def get_all_orders_with_users(self, limit=100):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, u.name, u.surname, u.phone 
                FROM orders o
                JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT ?
            ''', (limit,))
            return cursor.fetchall()
    
    def get_orders_by_date(self, start_date, end_date):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, u.name, u.surname, u.phone 
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE DATE(o.created_at) BETWEEN DATE(?) AND DATE(?)
                ORDER BY o.created_at DESC
            ''', (start_date, end_date))
            return cursor.fetchall()
    
    def get_orders_by_phone(self, phone):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, u.name, u.surname, u.phone 
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE u.phone LIKE ?
                ORDER BY o.created_at DESC
            ''', (f'%{phone}%',))
            return cursor.fetchall()
    
    def get_orders_by_status(self, status):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT o.*, u.name, u.surname, u.phone 
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.status = ?
                ORDER BY o.created_at DESC
            ''', (status,))
            return cursor.fetchall()
    
    def get_statistics(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Общая статистика
            cursor.execute('''
                SELECT 
                    COUNT(DISTINCT user_id) as total_users,
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue,
                    SUM(tip_amount) as total_tips,
                    AVG(rating) as avg_rating,
                    SUM(CASE WHEN is_premium = 1 THEN 1 ELSE 0 END) as premium_users
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
            ''')
            stats = dict(cursor.fetchone())
            
            # Статистика по дням
            cursor.execute('''
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as orders_count,
                    SUM(total_amount) as daily_revenue
                FROM orders
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 7
            ''')
            stats['daily'] = [dict(row) for row in cursor.fetchall()]
            
            return stats