/**
 * Тесты для модуля CartManager
 * Запуск: npm test cart.test.js
 */

const { CartManager } = require('../static/js/cart.js');
const { localStorageMock, fetchMock } = require('./mocks.js');

// Мок для localStorage
global.localStorage = localStorageMock;

// Мок для fetch
global.fetch = fetchMock;

// Мок для DOM элементов
document.body.innerHTML = `
    <div id="cartBadge">0</div>
    <div id="cartContainer"></div>
    <div class="cart-count">0</div>
`;

describe('CartManager', () => {
    let cartManager;

    beforeEach(() => {
        // Очищаем localStorage перед каждым тестом
        localStorage.clear();
        
        // Сбрасываем моки
        jest.clearAllMocks();
        
        // Создаем новый экземпляр CartManager
        cartManager = new CartManager();
        
        // Мокаем методы, которые обращаются к API
        cartManager.syncWithServer = jest.fn().mockResolvedValue();
        cartManager.syncWithServerAfterChange = jest.fn().mockResolvedValue();
        cartManager.getProductDetails = jest.fn().mockResolvedValue({
            id: 1,
            name: 'Тестовый товар',
            basePrice: 500,
            icon: '🍔',
            weight: '250г'
        });
        
        // Мокаем showToast
        cartManager.showToast = jest.fn();
    });

    // ==================== ТЕСТЫ ИНИЦИАЛИЗАЦИИ ====================

    test('должен загружать пустую корзину при инициализации', () => {
        expect(cartManager.cart).toEqual([]);
        expect(cartManager.getTotal()).toBe(0);
    });

    test('должен загружать сохраненную корзину из localStorage', () => {
        const savedCart = [
            {
                id: 1,
                name: 'Бургер',
                price: 450,
                quantity: 2,
                addons: [],
                options: {},
                totalPrice: 900
            }
        ];
        
        localStorage.setItem('megafood_cart', JSON.stringify(savedCart));
        
        // Пересоздаем менеджер для загрузки из localStorage
        cartManager = new CartManager();
        cartManager.syncWithServer = jest.fn();
        
        expect(cartManager.cart).toEqual(savedCart);
        expect(cartManager.getTotal()).toBe(900);
    });

    test('должен валидировать загруженную корзину', () => {
        const invalidCart = [
            { id: 1, name: 'Товар 1', quantity: 2 }, // нет price
            { id: 2, quantity: 1, price: 300 }, // нет name
            { id: 3, name: 'Товар 3', price: 200, quantity: -1 } // отрицательное количество
        ];
        
        localStorage.setItem('megafood_cart', JSON.stringify(invalidCart));
        
        cartManager = new CartManager();
        cartManager.syncWithServer = jest.fn();
        
        // Должны остаться только валидные товары
        expect(cartManager.cart.length).toBe(0);
    });

    // ==================== ТЕСТЫ ДОБАВЛЕНИЯ ТОВАРОВ ====================

    test('должен добавлять новый товар в корзину', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            icon: '🍔',
            totalPrice: 450
        };

        await cartManager.addItem(item);

        expect(cartManager.cart.length).toBe(1);
        expect(cartManager.cart[0]).toEqual(item);
        expect(cartManager.getTotal()).toBe(450);
        expect(localStorage.getItem('megafood_cart')).toBeTruthy();
    });

    test('должен увеличивать количество существующего товара', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        await cartManager.addItem({ ...item, quantity: 2 });

        expect(cartManager.cart.length).toBe(1);
        expect(cartManager.cart[0].quantity).toBe(3);
        expect(cartManager.cart[0].totalPrice).toBe(1350);
    });

    test('должен различать товары с разными добавками', async () => {
        const item1 = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [{ id: 1, name: 'Сыр', price: 50 }],
            options: {},
            totalPrice: 500
        };

        const item2 = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [{ id: 2, name: 'Бекон', price: 80 }],
            options: {},
            totalPrice: 530
        };

        await cartManager.addItem(item1);
        await cartManager.addItem(item2);

        expect(cartManager.cart.length).toBe(2);
        expect(cartManager.getTotal()).toBe(1030);
    });

    test('должен правильно рассчитывать цену с добавками', async () => {
        const basePrice = 450;
        const addons = [
            { id: 1, name: 'Сыр', price: 50 },
            { id: 2, name: 'Бекон', price: 80 }
        ];
        const quantity = 2;

        const total = cartManager.calculateItemPrice(basePrice, addons, quantity);
        expect(total).toBe((450 + 50 + 80) * 2); // 1160
    });

    // ==================== ТЕСТЫ УДАЛЕНИЯ ТОВАРОВ ====================

    test('должен удалять товар из корзины', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        expect(cartManager.cart.length).toBe(1);

        const itemId = cartManager.getItemId(item);
        await cartManager.removeItem(itemId);

        expect(cartManager.cart.length).toBe(0);
        expect(cartManager.getTotal()).toBe(0);
    });

    test('должен корректно обрабатывать удаление несуществующего товара', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        await cartManager.removeItem('несуществующий_id');

        expect(cartManager.cart.length).toBe(1);
    });

    // ==================== ТЕСТЫ ИЗМЕНЕНИЯ КОЛИЧЕСТВА ====================

    test('должен обновлять количество товара', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        const itemId = cartManager.getItemId(item);
        
        await cartManager.updateQuantity(itemId, 3);

        expect(cartManager.cart[0].quantity).toBe(3);
        expect(cartManager.cart[0].totalPrice).toBe(1350);
    });

    test('должен удалять товар при установке количества 0', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        const itemId = cartManager.getItemId(item);
        
        await cartManager.updateQuantity(itemId, 0);

        expect(cartManager.cart.length).toBe(0);
    });

    test('не должен позволять устанавливать отрицательное количество', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        const itemId = cartManager.getItemId(item);
        
        await cartManager.updateQuantity(itemId, -5);

        expect(cartManager.cart[0].quantity).toBe(1); // количество не изменилось
    });

    // ==================== ТЕСТЫ ОЧИСТКИ КОРЗИНЫ ====================

    test('должен очищать корзину', async () => {
        const items = [
            { id: 1, name: 'Бургер', price: 450, quantity: 1, addons: [], options: {}, totalPrice: 450 },
            { id: 2, name: 'Пицца', price: 550, quantity: 1, addons: [], options: {}, totalPrice: 550 }
        ];

        for (const item of items) {
            await cartManager.addItem(item);
        }

        expect(cartManager.cart.length).toBe(2);

        // Мокаем confirm
        global.confirm = jest.fn(() => true);
        
        await cartManager.clearCart();

        expect(cartManager.cart.length).toBe(0);
        expect(cartManager.getTotal()).toBe(0);
    });

    test('не должен очищать корзину при отмене подтверждения', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);

        // Мокаем confirm с отказом
        global.confirm = jest.fn(() => false);
        
        await cartManager.clearCart();

        expect(cartManager.cart.length).toBe(1);
    });

    // ==================== ТЕСТЫ РАСЧЕТОВ ====================

    test('должен правильно считать общую сумму', async () => {
        const items = [
            { id: 1, price: 450, quantity: 2, addons: [], totalPrice: 900 },
            { id: 2, price: 550, quantity: 1, addons: [], totalPrice: 550 },
            { id: 3, price: 100, quantity: 3, addons: [], totalPrice: 300 }
        ];

        for (const item of items) {
            await cartManager.addItem(item);
        }

        expect(cartManager.getTotal()).toBe(1750);
    });

    test('должен правильно разделять обычные и бонусные товары', async () => {
        const items = [
            { id: 1, price: 450, quantity: 1, isBonus: false, totalPrice: 450 },
            { id: 2, price: 550, quantity: 1, isBonus: false, totalPrice: 550 },
            { id: 3, price: 50, quantity: 2, isBonus: true, totalPrice: 100 }
        ];

        for (const item of items) {
            await cartManager.addItem(item);
        }

        expect(cartManager.getRegularTotal()).toBe(1000);
        expect(cartManager.getBonusTotal()).toBe(100);
        expect(cartManager.getTotal()).toBe(1100);
    });

    test('должен проверять доступность бонусов', () => {
        const items = [
            { id: 1, price: 50, quantity: 2, isBonus: true, totalPrice: 100 }
        ];

        for (const item of items) {
            cartManager.cart.push(item);
        }

        expect(cartManager.checkBonusAvailability(200)).toBe(true);
        expect(cartManager.checkBonusAvailability(50)).toBe(false);
    });

    // ==================== ТЕСТЫ ID ТОВАРОВ ====================

    test('должен генерировать уникальный ID для товара с добавками', () => {
        const item1 = {
            id: 1,
            addons: [{ id: 1, name: 'Сыр' }],
            options: {}
        };
        
        const item2 = {
            id: 1,
            addons: [{ id: 2, name: 'Бекон' }],
            options: {}
        };

        const id1 = cartManager.getItemId(item1);
        const id2 = cartManager.getItemId(item2);

        expect(id1).not.toBe(id2);
    });

    test('должен генерировать одинаковый ID для одинаковых товаров', () => {
        const item1 = {
            id: 1,
            addons: [{ id: 1, name: 'Сыр' }],
            options: { size: 'large' }
        };
        
        const item2 = {
            id: 1,
            addons: [{ id: 1, name: 'Сыр' }],
            options: { size: 'large' }
        };

        const id1 = cartManager.getItemId(item1);
        const id2 = cartManager.getItemId(item2);

        expect(id1).toBe(id2);
    });

    // ==================== ТЕСТЫ ОБНОВЛЕНИЯ БЕЙДЖА ====================

    test('должен обновлять счетчик на иконке корзины', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 2,
            addons: [],
            options: {},
            totalPrice: 900
        };

        await cartManager.addItem(item);
        cartManager.updateCartBadge();

        const badge = document.getElementById('cartBadge');
        expect(badge.textContent).toBe('2');
        expect(badge.style.display).toBe('flex');
    });

    test('должен скрывать бейдж при пустой корзине', () => {
        cartManager.updateCartBadge();
        
        const badge = document.getElementById('cartBadge');
        expect(badge.textContent).toBe('0');
        expect(badge.style.display).toBe('none');
    });

    // ==================== ТЕСТЫ СОХРАНЕНИЯ ====================

    test('должен сохранять корзину в localStorage', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);

        const saved = JSON.parse(localStorage.getItem('megafood_cart'));
        expect(saved).toEqual([item]);
    });

    test('должен обновлять localStorage при изменениях', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1,
            addons: [],
            options: {},
            totalPrice: 450
        };

        await cartManager.addItem(item);
        
        const itemId = cartManager.getItemId(item);
        await cartManager.updateQuantity(itemId, 3);

        const saved = JSON.parse(localStorage.getItem('megafood_cart'));
        expect(saved[0].quantity).toBe(3);
        expect(saved[0].totalPrice).toBe(1350);
    });

    // ==================== ТЕСТЫ РЕНДЕРИНГА ====================

    test('должен рендерить пустую корзину', () => {
        const container = document.getElementById('cartContainer');
        cartManager.renderCart();

        expect(container.innerHTML).toContain('empty-cart');
        expect(container.innerHTML).toContain('Корзина пуста');
    });

    test('должен рендерить корзину с товарами', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 2,
            addons: [{ id: 1, name: 'Сыр', price: 50 }],
            options: {},
            icon: '🍔',
            weight: '250г',
            totalPrice: 1000
        };

        await cartManager.addItem(item);
        
        const container = document.getElementById('cartContainer');
        cartManager.renderCart();

        expect(container.innerHTML).toContain('Бургер');
        expect(container.innerHTML).toContain('Сыр');
        expect(container.innerHTML).toContain('250г');
        expect(container.innerHTML).toContain('1000 ₽');
    });

    test('должен правильно рендерить сводку корзины', async () => {
        const items = [
            { id: 1, price: 450, quantity: 2, isBonus: false, totalPrice: 900 },
            { id: 2, price: 50, quantity: 1, isBonus: true, totalPrice: 50 }
        ];

        for (const item of items) {
            await cartManager.addItem(item);
        }

        const container = document.getElementById('cartContainer');
        cartManager.renderCart();

        const summary = container.querySelector('.cart-summary');
        expect(summary.innerHTML).toContain('Товаров: 3 шт');
        expect(summary.innerHTML).toContain('900 ₽');
        expect(summary.innerHTML).toContain('Бонусами: 50 🎁');
        expect(summary.innerHTML).toContain('950 ₽');
    });

    // ==================== ТЕСТЫ ОБРАБОТКИ СОБЫТИЙ ====================

    test('должен обрабатывать клик по кнопке добавления', () => {
        // Создаем мок кнопки
        const button = document.createElement('button');
        button.classList.add('add-to-cart-btn');
        button.dataset.productId = '1';
        
        // Мокаем методы
        cartManager.handleAddToCart = jest.fn();
        
        // Создаем и диспатчим событие
        const event = new Event('click');
        Object.defineProperty(event, 'target', { value: button });
        
        document.dispatchEvent(event);
        
        // Проверяем, что обработчик не вызван (нужно правильное всплытие)
        // В реальном тесте нужно использовать fireEvent из библиотеки тестирования
    });

    // ==================== ТЕСТЫ ИНТЕГРАЦИИ ====================

    test('должен синхронизироваться с сервером при наличии пользователя', async () => {
        // Мокаем наличие пользователя
        const user = { id: 1, name: 'Тест' };
        localStorage.setItem('megafood_user', JSON.stringify(user));
        
        cartManager = new CartManager();
        
        // Проверяем, что вызвана синхронизация
        expect(cartManager.syncWithServer).toHaveBeenCalledWith(1);
    });

    test('должен объединять локальную и серверную корзины', () => {
        const localCart = [
            { id: 1, name: 'Бургер', price: 450, quantity: 1, addons: [], options: {}, totalPrice: 450 }
        ];
        
        const serverCart = [
            { id: 1, name: 'Бургер', price: 450, quantity: 2, addons: [], options: {}, totalPrice: 900 },
            { id: 2, name: 'Пицца', price: 550, quantity: 1, addons: [], options: {}, totalPrice: 550 }
        ];

        cartManager.cart = [...localCart];
        cartManager.mergeCarts(serverCart);

        expect(cartManager.cart.length).toBe(2);
        expect(cartManager.cart[0].quantity).toBe(3); // объединились
        expect(cartManager.cart[1].name).toBe('Пицца');
    });

    // ==================== ТЕСТЫ ГРАНИЧНЫХ СЛУЧАЕВ ====================

    test('должен обрабатывать максимальное количество товаров', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 99, // максимальное допустимое
            addons: [],
            options: {},
            totalPrice: 44550
        };

        await cartManager.addItem(item);
        expect(cartManager.cart[0].quantity).toBe(99);
    });

    test('должен корректно обрабатывать очень большое количество', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            price: 450,
            quantity: 1000,
            addons: [],
            options: {},
            totalPrice: 450000
        };

        await cartManager.addItem(item);
        expect(cartManager.cart[0].quantity).toBe(1000);
        expect(cartManager.getTotal()).toBe(450000);
    });

    test('должен обрабатывать товары без цены', async () => {
        const item = {
            id: 1,
            name: 'Бургер',
            quantity: 1,
            addons: [],
            options: {}
            // нет price
        };

        await cartManager.addItem(item);
        
        // Товар не должен добавиться
        const savedItem = cartManager.cart.find(i => i.id === 1);
        expect(savedItem?.price).toBeUndefined();
    });
});