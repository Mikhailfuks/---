// constants.js
// Статические данные приложения

export const products = [
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

export const bonusProducts = [
    { id: 101, name: 'Кофе американо', bonusPrice: 50, icon: '☕', inCart: false },
    { id: 102, name: 'Картошка фри', bonusPrice: 80, icon: '🍟', inCart: false },
    { id: 103, name: 'Шоколадный десерт', bonusPrice: 120, icon: '🍰', inCart: false },
    { id: 104, name: 'Чай с бергамотом', bonusPrice: 40, icon: '🫖', inCart: false }
];

export const promoCodes = {
    'WELCOME10': { discount: 10, type: 'percent' },
    'BONUS50': { discount: 50, type: 'fixed' },
    'CASHBACK20': { discount: 20, type: 'cashback' }
};

export const customerReviews = [
    { name: 'Анна', avatar: '👩', rating: 5, text: 'Очень быстрая доставка! Бургер горячий и вкусный.', order: 'Двойной бургер' },
    { name: 'Дмитрий', avatar: '👨', rating: 5, text: 'Лучшая доставка в городе. Рекомендую!', order: 'Маргарита' },
    { name: 'Елена', avatar: '👩', rating: 4, text: 'Все свежее, курьер вежливый. Буду заказывать еще.', order: 'Филадельфия' },
    { name: 'Сергей', avatar: '👨', rating: 5, text: 'Цены приятные, бонусы копятся быстро.', order: 'Цезарь' }
];