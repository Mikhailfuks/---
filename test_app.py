import pytest
import json
import hashlib
from app import app, db, hash_password
from database import Database
import tempfile
import os

@pytest.fixture
def client():
    """Создает тестовый клиент Flask с временной БД"""
    # Создаем временный файл для тестовой БД
    db_fd, db_path = tempfile.mkstemp()
    
    # Переопределяем БД на временную
    test_db = Database(db_path)
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        with app.app_context():
            # Подменяем глобальную БД на тестовую
            import app as app_module
            app_module.db = test_db
            yield client
    
    # Удаляем временный файл
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def test_user(client):
    """Создает тестового пользователя и возвращает его данные"""
    user_data = {
        'surname': 'Иванов',
        'name': 'Иван',
        'patronymic': 'Иванович',
        'phone': '+79001234567',
        'password': 'testpass123',
        'avatar': '👤'
    }
    
    response = client.post('/api/register', 
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    user_data['id'] = data['user_id']
    return user_data

# ==================== ТЕСТЫ РЕГИСТРАЦИИ ====================

def test_register_success(client):
    """Тест успешной регистрации"""
    user_data = {
        'surname': 'Петров',
        'name': 'Петр',
        'phone': '+79007654321',
        'password': 'securepass'
    }
    
    response = client.post('/api/register',
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'user_id' in data

def test_register_missing_fields(client):
    """Тест регистрации с пропущенными полями"""
    user_data = {
        'name': 'Петр',
        'phone': '+79007654321'
    }
    
    response = client.post('/api/register',
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_register_duplicate_phone(client, test_user):
    """Тест регистрации с существующим номером"""
    duplicate_data = {
        'surname': 'Другой',
        'name': 'Другой',
        'phone': test_user['phone'],
        'password': 'otherpass'
    }
    
    response = client.post('/api/register',
                          data=json.dumps(duplicate_data),
                          content_type='application/json')
    
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'error' in data

# ==================== ТЕСТЫ АВТОРИЗАЦИИ ====================

def test_login_success(client, test_user):
    """Тест успешного входа"""
    login_data = {
        'phone': test_user['phone'],
        'password': test_user['password']
    }
    
    response = client.post('/api/login',
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['phone'] == test_user['phone']
    assert data['name'] == test_user['name']

def test_login_wrong_password(client, test_user):
    """Тест входа с неправильным паролем"""
    login_data = {
        'phone': test_user['phone'],
        'password': 'wrongpass'
    }
    
    response = client.post('/api/login',
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_login_nonexistent_user(client):
    """Тест входа несуществующего пользователя"""
    login_data = {
        'phone': '+79999999999',
        'password': 'testpass'
    }
    
    response = client.post('/api/login',
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    assert response.status_code == 401

# ==================== ТЕСТЫ ПОЛЬЗОВАТЕЛЯ ====================

def test_get_user(client, test_user):
    """Тест получения данных пользователя"""
    response = client.get(f'/api/user/{test_user["id"]}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['phone'] == test_user['phone']
    assert data['name'] == test_user['name']
    assert data['balance'] == 21630

def test_get_nonexistent_user(client):
    """Тест получения несуществующего пользователя"""
    response = client.get('/api/user/99999')
    assert response.status_code == 404

def test_update_user(client, test_user):
    """Тест обновления данных пользователя"""
    update_data = {
        'name': 'Петр',
        'avatar': '😎'
    }
    
    response = client.put(f'/api/user/{test_user["id"]}',
                         data=json.dumps(update_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Проверяем, что данные обновились
    response = client.get(f'/api/user/{test_user["id"]}')
    user_data = json.loads(response.data)
    assert user_data['name'] == 'Петр'
    assert user_data['avatar'] == '😎'

# ==================== ТЕСТЫ ЗАКАЗОВ ====================

def test_create_order(client, test_user):
    """Тест создания заказа"""
    order_data = {
        'user_id': test_user['id'],
        'items': [
            {
                'name': 'Двойной бургер',
                'quantity': 2,
                'price': 450,
                'icon': '🍔',
                'addons': ['Сыр', 'Бекон']
            },
            {
                'name': 'Coca-Cola',
                'quantity': 1,
                'price': 100,
                'icon': '🥤'
            }
        ],
        'total_amount': 1100,
        'delivery_address': 'Москва, Тверская 15, кв 42',
        'delivery_type': 'express',
        'tip_amount': 100,
        'payment_method': 'card',
        'cashback_earned': 50
    }
    
    response = client.post('/api/orders',
                          data=json.dumps(order_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'order_id' in data
    assert 'order_number' in data
    
    # Проверяем, что баланс уменьшился
    response = client.get(f'/api/user/{test_user["id"]}')
    user_data = json.loads(response.data)
    assert user_data['balance'] == 21630 - 1100

def test_create_order_with_bonus(client, test_user):
    """Тест создания заказа с оплатой бонусами"""
    order_data = {
        'user_id': test_user['id'],
        'items': [
            {
                'name': 'Кофе американо',
                'quantity': 1,
                'price': 50,
                'is_bonus': True,
                'icon': '☕'
            }
        ],
        'total_amount': 50,
        'bonus_used': 50,
        'delivery_address': 'Москва, Тверская 15',
        'delivery_type': 'standard'
    }
    
    response = client.post('/api/orders',
                          data=json.dumps(order_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    
    # Проверяем, что бонусы списались
    response = client.get(f'/api/user/{test_user["id"]}')
    user_data = json.loads(response.data)
    assert user_data['bonus'] == 3210 - 50

def test_get_user_orders(client, test_user):
    """Тест получения заказов пользователя"""
    # Сначала создаем заказ
    order_data = {
        'user_id': test_user['id'],
        'items': [{'name': 'Пицца', 'quantity': 1, 'price': 550}],
        'total_amount': 550,
        'delivery_address': 'Тестовый адрес'
    }
    
    client.post('/api/orders',
               data=json.dumps(order_data),
               content_type='application/json')
    
    # Получаем заказы
    response = client.get(f'/api/user/{test_user["id"]}/orders')
    assert response.status_code == 200
    
    orders = json.loads(response.data)
    assert len(orders) > 0
    assert orders[0]['total_amount'] == 550

def test_get_order_details(client, test_user):
    """Тест получения деталей заказа"""
    # Создаем заказ
    order_data = {
        'user_id': test_user['id'],
        'items': [
            {'name': 'Бургер', 'quantity': 2, 'price': 450, 'icon': '🍔'}
        ],
        'total_amount': 900,
        'delivery_address': 'Тестовый адрес'
    }
    
    create_resp = client.post('/api/orders',
                             data=json.dumps(order_data),
                             content_type='application/json')
    order_id = json.loads(create_resp.data)['order_id']
    
    # Получаем детали
    response = client.get(f'/api/order/{order_id}')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'order' in data
    assert 'items' in data
    assert data['order']['total_amount'] == 900
    assert len(data['items']) == 1
    assert data['items'][0]['product_name'] == 'Бургер'

def test_update_order_status(client, test_user):
    """Тест обновления статуса заказа"""
    # Создаем заказ
    order_data = {
        'user_id': test_user['id'],
        'items': [{'name': 'Тест', 'quantity': 1, 'price': 100}],
        'total_amount': 100,
        'delivery_address': 'Тестовый адрес'
    }
    
    create_resp = client.post('/api/orders',
                             data=json.dumps(order_data),
                             content_type='application/json')
    order_id = json.loads(create_resp.data)['order_id']
    
    # Обновляем статус
    status_data = {'status': 'Доставлен'}
    response = client.put(f'/api/order/{order_id}/status',
                         data=json.dumps(status_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    
    # Проверяем, что статус обновился
    response = client.get(f'/api/order/{order_id}')
    data = json.loads(response.data)
    assert data['order']['status'] == 'Доставлен'

def test_add_order_rating(client, test_user):
    """Тест добавления рейтинга к заказу"""
    # Создаем заказ
    order_data = {
        'user_id': test_user['id'],
        'items': [{'name': 'Тест', 'quantity': 1, 'price': 100}],
        'total_amount': 100,
        'delivery_address': 'Тестовый адрес'
    }
    
    create_resp = client.post('/api/orders',
                             data=json.dumps(order_data),
                             content_type='application/json')
    order_id = json.loads(create_resp.data)['order_id']
    
    # Добавляем рейтинг
    rating_data = {
        'rating': 5,
        'review': 'Отлично!'
    }
    response = client.post(f'/api/order/{order_id}/rating',
                          data=json.dumps(rating_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    
    # Проверяем, что рейтинг сохранился
    response = client.get(f'/api/order/{order_id}')
    data = json.loads(response.data)
    assert data['order']['rating'] == 5
    assert data['order']['review_text'] == 'Отлично!'

# ==================== ТЕСТЫ КАРТ ====================

def test_save_card(client, test_user):
    """Тест сохранения карты"""
    card_data = {
        'card_number': '4111111111111111',
        'card_holder': 'IVAN IVANOV',
        'expiry_date': '12/25',
        'last_four': '1111'
    }
    
    response = client.post(f'/api/user/{test_user["id"]}/cards',
                          data=json.dumps(card_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'card_id' in data

def test_get_user_cards(client, test_user):
    """Тест получения списка карт пользователя"""
    # Сохраняем карту
    card_data = {
        'card_number': '4111111111111111',
        'card_holder': 'IVAN IVANOV',
        'expiry_date': '12/25',
        'last_four': '1111'
    }
    client.post(f'/api/user/{test_user["id"]}/cards',
               data=json.dumps(card_data),
               content_type='application/json')
    
    # Получаем список карт
    response = client.get(f'/api/user/{test_user["id"]}/cards')
    assert response.status_code == 200
    
    cards = json.loads(response.data)
    assert len(cards) > 0
    assert cards[0]['last_four'] == '1111'

# ==================== ТЕСТЫ ПРОМОКОДОВ ====================

def test_check_valid_promocode(client):
    """Тест проверки существующего промокода"""
    response = client.get('/api/promocode/WELCOME10')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['code'] == 'WELCOME10'
    assert data['discount_type'] == 'percent'
    assert data['discount_value'] == 10

def test_check_invalid_promocode(client):
    """Тест проверки несуществующего промокода"""
    response = client.get('/api/promocode/INVALID123')
    assert response.status_code == 404

# ==================== ТЕСТЫ ТРАНЗАКЦИЙ ====================

def test_replenish_balance(client, test_user):
    """Тест пополнения баланса"""
    replenish_data = {'amount': 1000}
    
    response = client.post(f'/api/user/{test_user["id"]}/balance',
                          data=json.dumps(replenish_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['new_balance'] == 21630 + 1000
    
    # Проверяем, что транзакция создалась
    response = client.get(f'/api/user/{test_user["id"]}/transactions')
    transactions = json.loads(response.data)
    assert len(transactions) > 0
    assert transactions[0]['type'] == 'Пополнение баланса'
    assert transactions[0]['amount'] == 1000

# ==================== ТЕСТЫ АДМИНКИ ====================

def test_admin_get_all_orders(client, test_user):
    """Тест получения всех заказов админом"""
    # Создаем несколько заказов
    for i in range(3):
        order_data = {
            'user_id': test_user['id'],
            'items': [{'name': f'Тест {i}', 'quantity': 1, 'price': 100}],
            'total_amount': 100,
            'delivery_address': 'Тестовый адрес'
        }
        client.post('/api/orders',
                   data=json.dumps(order_data),
                   content_type='application/json')
    
    # Получаем все заказы
    response = client.get('/api/admin/orders')
    assert response.status_code == 200
    
    orders = json.loads(response.data)
    assert len(orders) >= 3

def test_admin_search_by_phone(client, test_user):
    """Тест поиска заказов по телефону"""
    # Создаем заказ
    order_data = {
        'user_id': test_user['id'],
        'items': [{'name': 'Тест', 'quantity': 1, 'price': 100}],
        'total_amount': 100,
        'delivery_address': 'Тестовый адрес'
    }
    client.post('/api/orders',
               data=json.dumps(order_data),
               content_type='application/json')
    
    # Ищем по телефону
    response = client.get(f'/api/admin/orders/search?phone={test_user["phone"]}')
    assert response.status_code == 200
    
    orders = json.loads(response.data)
    assert len(orders) > 0

def test_admin_user_orders_by_phone(client, test_user):
    """Тест получения заказов пользователя по телефону"""
    # Создаем заказ
    order_data = {
        'user_id': test_user['id'],
        'items': [{'name': 'Тест', 'quantity': 1, 'price': 100}],
        'total_amount': 100,
        'delivery_address': 'Тестовый адрес'
    }
    client.post('/api/orders',
               data=json.dumps(order_data),
               content_type='application/json')
    
    # Получаем информацию о пользователе и его заказах
    response = client.get(f'/api/admin/user/{test_user["phone"]}/orders')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'user' in data
    assert 'orders' in data
    assert data['user']['phone'] == test_user['phone']
    assert len(data['orders']) > 0

def test_admin_statistics(client, test_user):
    """Тест получения статистики"""
    # Создаем несколько заказов
    for i in range(3):
        order_data = {
            'user_id': test_user['id'],
            'items': [{'name': f'Тест {i}', 'quantity': 1, 'price': 100}],
            'total_amount': 100,
            'delivery_address': 'Тестовый адрес'
        }
        client.post('/api/orders',
                   data=json.dumps(order_data),
                   content_type='application/json')
    
    # Получаем статистику
    response = client.get('/api/admin/statistics')
    assert response.status_code == 200
    
    stats = json.loads(response.data)
    assert 'total_users' in stats
    assert 'total_orders' in stats
    assert 'total_revenue' in stats
    assert stats['total_orders'] >= 3

# ==================== ТЕСТЫ БАЗЫ ДАННЫХ ====================

def test_db_connection():
    """Тест подключения к БД"""
    test_db = Database(':memory:')  # in-memory database for testing
    assert test_db is not None

def test_db_create_user():
    """Тест создания пользователя в БД"""
    test_db = Database(':memory:')
    user_id = test_db.create_user(
        surname='Тестов',
        name='Тест',
        phone='+79991112233',
        password=hash_password('testpass')
    )
    
    assert user_id is not None
    
    user = test_db.get_user_by_phone('+79991112233')
    assert user is not None
    assert user['surname'] == 'Тестов'
    assert user['name'] == 'Тест'

def test_db_update_balance():
    """Тест обновления баланса"""
    test_db = Database(':memory:')
    user_id = test_db.create_user(
        surname='Тестов',
        name='Тест',
        phone='+79991112233',
        password='pass'
    )
    
    test_db.update_user_balance(user_id, 500)
    user = test_db.get_user_by_id(user_id)
    assert user['balance'] == 21630 + 500
    
    test_db.update_user_balance(user_id, -200)
    user = test_db.get_user_by_id(user_id)
    assert user['balance'] == 21630 + 300

def test_db_create_order():
    """Тест создания заказа в БД"""
    test_db = Database(':memory:')
    
    # Создаем пользователя
    user_id = test_db.create_user(
        surname='Тестов',
        name='Тест',
        phone='+79991112233',
        password='pass'
    )
    
    # Создаем заказ
    order_id = test_db.create_order(
        user_id=user_id,
        order_number='#1234',
        total_amount=1000,
        delivery_address='Тестовый адрес',
        delivery_type='express'
    )
    
    assert order_id is not None
    
    # Добавляем товары
    test_db.add_order_item(
        order_id=order_id,
        product_name='Бургер',
        quantity=2,
        price_per_item=450,
        product_icon='🍔',
        addons='Сыр,Бекон'
    )
    
    # Получаем детали заказа
    order, items = test_db.get_order_details(order_id)
    assert order is not None
    assert order['total_amount'] == 1000
    assert len(items) == 1
    assert items[0]['product_name'] == 'Бургер'
    assert items[0]['quantity'] == 2

# ==================== ЗАПУСК ТЕСТОВ ====================

if __name__ == '__main__':
    pytest.main(['-v', '--tb=short', __file__])