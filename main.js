// main.js
// Точка входа в приложение. Инициализирует состояние, импортирует модули и привязывает функции к window.

import * as cartModule from './cart.js';
// Здесь будут импорты других модулей (payment, profile, ui, validators и т.д.)
// import * as paymentModule from './payment.js';
// import * as profileModule from './profile.js';
// import * as uiModule from './ui.js';
// import * as validatorsModule from './validators.js';

// -------------------- Глобальное состояние --------------------
window.cart = [];
window.wishlist = [];
window.notifications = [];
window.notificationBadge = 2;
window.orders = [];

window.userData = {
    name: 'Михаил',
    email: 'mikhail@example.com',
    phone: '+7 (904) 606-25-47',
    avatar: '👤'
};

window.cardData = {
    number: '',
    expiry: '',
    holder: '',
    lastFour: ''
};

window.userBalance = 21630;
window.userBonus = 3210;
window.isPremium = false;

window.activePromo = null;
window.promoCodes = {
    'WELCOME10': { discount: 10, type: 'percent' },
    'BONUS50': { discount: 50, type: 'fixed' },
    'CASHBACK20': { discount: 20, type: 'cashback' }
};

window.cashbackRate = 10;
window.cashbackActive = false;

window.products = [
    { 
        id: 1, name: 'Двойной бургер', basePrice: 450, rating: 4.9, reviews: 128, category: 'burger',
        description: 'Сочный бургер с двумя котлетами', icon: '🍔', popular: true,
        weight: '350г', calories: '850 ккал', cookingTime: '15 мин',
        addons: [
            { name: 'Сыр', price: 50, icon: '🧀' },
            { name: 'Бекон', price: 80, icon: '🥓' }
        ]
    },
    { 
        id: 2, name: 'Маргарита', basePrice: 550, rating: 4.8, reviews: 95, category: 'pizza',
        description: 'Классическая пицца', icon: '🍕', popular: true,
        weight: '450г', calories: '920 ккал', cookingTime: '20 мин',
        addons: [
            { name: 'Пепперони', price: 100, icon: '🌶️' },
            { name: 'Грибы', price: 70, icon: '🍄' }
        ]
    },
    { 
        id: 3, name: 'Филадельфия', basePrice: 650, rating: 4.9, reviews: 156, category: 'sushi',
        description: 'Нежные роллы с лососем', icon: '🍣', popular: true,
        weight: '280г', calories: '580 ккал', cookingTime: '12 мин',
        addons: [
            { name: 'Икра масаго', price: 90, icon: '🥚' },
            { name: 'Угорь', price: 150, icon: '🐍' }
        ]
    },
    { 
        id: 4, name: 'Цезарь', basePrice: 350, rating: 4.7, reviews: 67, category: 'salad',
        description: 'Салат с курицей', icon: '🥗', popular: true,
        weight: '320г', calories: '420 ккал', cookingTime: '10 мин',
        addons: [
            { name: 'Курица', price: 80, icon: '🍗' },
            { name: 'Креветки', price: 150, icon: '🦐' }
        ]
    },
    { 
        id: 5, name: 'Coca-Cola', basePrice: 100, rating: 4.9, reviews: 456, category: 'drink',
        description: '0.5 л', icon: '🥤', popular: true,
        weight: '500мл', calories: '210 ккал', cookingTime: '2 мин',
        addons: [
            { name: 'Лимон', price: 15, icon: '🍋' },
            { name: 'Лайм', price: 15, icon: '🍈' }
        ]
    },
    { 
        id: 6, name: 'Пепперони', basePrice: 600, rating: 4.9, reviews: 203, category: 'pizza',
        description: 'Острая пепперони', icon: '🍕', popular: false,
        weight: '480г', calories: '980 ккал', cookingTime: '20 мин',
        addons: [
            { name: 'Двойная пепперони', price: 120, icon: '🌶️' },
            { name: 'Халапеньо', price: 40, icon: '🌶️' }
        ]
    }
];

window.bonusProducts = [
    { id: 101, name: 'Кофе американо', bonusPrice: 50, icon: '☕', inCart: false },
    { id: 102, name: 'Картошка фри', bonusPrice: 80, icon: '🍟', inCart: false },
    { id: 103, name: 'Шоколадный десерт', bonusPrice: 120, icon: '🍰', inCart: false },
    { id: 104, name: 'Чай с бергамотом', bonusPrice: 40, icon: '🫖', inCart: false }
];

window.transactionHistory = [
    { type: 'Пополнение', amount: 5000, date: '10.03.2024', icon: '💰' },
    { type: 'Заказ #6034', amount: -850, date: '09.03.2024', icon: '🍔' },
    { type: 'Кэшбэк', amount: 85, date: '09.03.2024', icon: '✨' },
    { type: 'Колесо удачи', amount: 500, date: '08.03.2024', icon: '🎡' }
];

window.customerReviews = [
    { name: 'Анна', avatar: '👩', rating: 5, text: 'Очень быстрая доставка! Бургер горячий и вкусный.', order: 'Двойной бургер' },
    { name: 'Дмитрий', avatar: '👨', rating: 5, text: 'Лучшая доставка в городе. Рекомендую!', order: 'Маргарита' },
    { name: 'Елена', avatar: '👩', rating: 4, text: 'Все свежее, курьер вежливый. Буду заказывать еще.', order: 'Филадельфия' },
    { name: 'Сергей', avatar: '👨', rating: 5, text: 'Цены приятные, бонусы копятся быстро.', order: 'Цезарь' }
];

// -------------------- Вспомогательные функции (ui) --------------------
window.showToast = function(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${type==='success'?'✅':type==='error'?'❌':type==='warning'?'⚠️':'ℹ️'}</span><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
};

window.addTransaction = function(type, amount, icon) {
    window.transactionHistory.unshift({ type, amount, date: new Date().toLocaleDateString('ru-RU'), icon });
    // Обновление отображения истории (если есть)
    if (typeof window.initHistory === 'function') window.initHistory();
};

// -------------------- Инициализация модулей --------------------
// Передаём зависимости в модуль корзины
cartModule.initCartModule({
    cart: window.cart,
    products: window.products,
    userBalance: window.userBalance,
    userBonus: window.userBonus,
    activePromo: window.activePromo,
    cashbackRate: window.cashbackRate,
    cashbackActive: window.cashbackActive,
    updateCartBadge: () => cartModule.updateCartBadge(), // можно просто передать функцию, но для единообразия
    showToast: window.showToast,
    addTransaction: window.addTransaction
});

// Аналогично инициализируем другие модули
// paymentModule.initPaymentModule({ ... });
// profileModule.initProfileModule({ ... });
// validatorsModule.initValidatorsModule({ ... });

// -------------------- Экспорт функций в глобальную область (для inline-обработчиков) --------------------
window.changeQuantity = cartModule.changeQuantity;
window.addToCartWithQuantity = cartModule.addToCartWithQuantity;
window.changeCartQuantity = cartModule.changeCartQuantity;
window.removeFromCart = cartModule.removeFromCart;
window.updateCartBadge = cartModule.updateCartBadge;
window.showCart = cartModule.showCart;
window.proceedToCheckout = cartModule.proceedToCheckout;
window.addBonusToCart = cartModule.addBonusToCart;

// Здесь будут привязки функций из других модулей
// window.formatCardNumber = validatorsModule.formatCardNumber;
// window.replenishBalance = paymentModule.replenishBalance;
// ...

// -------------------- Инициализация приложения --------------------
document.addEventListener('DOMContentLoaded', () => {
    // Вызов функций, которые заполняют контент
    if (typeof window.initProducts === 'function') window.initProducts();
    if (typeof window.initHistory === 'function') window.initHistory();
    if (typeof window.initCategories === 'function') window.initCategories();
    if (typeof window.initBonusProducts === 'function') window.initBonusProducts();
    if (typeof window.initReviews === 'function') window.initReviews();
    if (typeof window.updateProfileInfo === 'function') window.updateProfileInfo();
    if (typeof window.updateProfileDisplay === 'function') window.updateProfileDisplay();
    if (typeof window.checkPremium === 'function') window.checkPremium();

    // Привязка обработчиков событий (если не используются inline)
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn) locationBtn.addEventListener('click', window.showAddressModal);

    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) notificationsBtn.addEventListener('click', window.showNotifications);

    const qrScanner = document.getElementById('qrScanner');
    if (qrScanner) qrScanner.addEventListener('click', () => {
        window.showModal('QR-сканер', '<div style="text-align:center;"><div style="width:200px;height:200px;border:2px dashed #ff6b6b;margin:20px auto;display:flex;align-items:center;justify-content:center;font-size:50px;">📷</div><p>Наведите камеру на QR-код</p><button onclick="showToast(\'✅ Промокод BONUS50 активирован\',\'success\');closeModal();" class="pay-button" style="margin-top:15px;padding:12px;">Симулировать</button></div>');
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.product-card').forEach(p => {
                const name = p.querySelector('.product-name')?.textContent.toLowerCase() || '';
                p.style.opacity = (name.includes(q) || q.length < 2) ? '1' : '0.5';
            });
        });
    }

    // Периодическая проверка премиум-статуса
    setInterval(() => {
        if (typeof window.checkPremium === 'function') window.checkPremium();
    }, 60000);
});