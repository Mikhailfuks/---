// payment.js
// Логика платежей, баланса, промокодов

export function replenishBalance(amount, currentBalance, addTransactionCallback, updateUICallback) {
    const newBalance = currentBalance + amount;
    if (addTransactionCallback) {
        addTransactionCallback('Пополнение баланса', amount, '💰');
    }
    if (updateUICallback) updateUICallback(newBalance);
    return newBalance;
}

export function applyPromoCode(code, promoCodes, currentCashbackRate, callbacks) {
    const upperCode = code.trim().toUpperCase();
    const promo = promoCodes[upperCode];
    if (!promo) {
        return { success: false, message: '❌ Неверный промокод' };
    }

    let promoText = '';
    let newCashbackRate = currentCashbackRate;

    if (upperCode === 'WELCOME10') {
        promoText = '🎉 Промокод активирован: скидка 10% на первый заказ';
    } else if (upperCode === 'BONUS50') {
        promoText = '🎉 Промокод активирован: скидка 50 ₽';
    } else if (upperCode === 'CASHBACK20') {
        promoText = '🎉 Промокод активирован: повышенный кэшбэк 20%';
        newCashbackRate = 20;
    }

    if (callbacks.updatePromoDisplay) {
        callbacks.updatePromoDisplay(promoText);
    }
    if (callbacks.updateCashbackDisplay) {
        callbacks.updateCashbackDisplay(newCashbackRate);
    }

    return { success: true, message: '✅ Промокод активирован!', activePromo: promo, cashbackRate: newCashbackRate };
}

export function toggleCashback(active, currentRate, callbacks) {
    const newActive = !active;
    const newRate = newActive ? 15 : 10;
    if (callbacks.updateCashbackDisplay) {
        callbacks.updateCashbackDisplay(newRate);
    }
    return { active: newActive, rate: newRate };
}

export function calculateOrderTotal(cart, activePromo, deliveryType) {
    let regularTotal = 0;
    let bonusTotal = 0;
    cart.forEach(item => {
        if (item.isBonus) {
            bonusTotal += item.totalPrice * item.quantity;
        } else {
            regularTotal += item.totalPrice * item.quantity;
        }
    });

    // Применяем промокод к regularTotal
    if (activePromo) {
        if (activePromo.type === 'percent') {
            regularTotal = regularTotal * (1 - activePromo.discount / 100);
        } else if (activePromo.type === 'fixed') {
            regularTotal = Math.max(0, regularTotal - activePromo.discount);
        }
    }

    let deliveryCost = 0;
    if (deliveryType === 'premium') deliveryCost = 50;
    else if (deliveryType === 'express') deliveryCost = 150;

    regularTotal += deliveryCost;

    return { regularTotal, bonusTotal, deliveryCost };
}

export function processPayment(cart, userBalance, userBonus, cashbackRate, cashbackActive, activePromo, deliveryType, callbacks) {
    const { regularTotal, bonusTotal } = calculateOrderTotal(cart, activePromo, deliveryType);

    if (userBalance < regularTotal) {
        return { success: false, message: '❌ Недостаточно средств на балансе' };
    }
    if (userBonus < bonusTotal) {
        return { success: false, message: '❌ Недостаточно бонусов' };
    }

    const newBalance = userBalance - regularTotal;
    const newBonus = userBonus - bonusTotal;

    // Начисляем кэшбэк только за обычные товары
    const cashbackEarned = Math.floor((regularTotal - (deliveryType !== 'standard' ? (deliveryType==='premium'?50:150) : 0)) * (cashbackActive ? cashbackRate : 10) / 100);
    const finalBonus = newBonus + cashbackEarned;

    // Создаём запись о заказе
    const order = {
        id: '#' + Math.floor(Math.random() * 10000),
        date: new Date().toLocaleDateString('ru-RU'),
        items: cart.map(i => ({...i})),
        total: regularTotal + bonusTotal,
        regularTotal,
        bonusTotal,
        deliveryType,
        rating: 0
    };

    // Вызываем колбэки для обновления состояния и UI
    if (callbacks.addOrder) callbacks.addOrder(order);
    if (callbacks.addTransaction) {
        callbacks.addTransaction('Оплата заказа', -regularTotal, '🛒');
        if (bonusTotal > 0) callbacks.addTransaction('Оплата бонусами', -bonusTotal, '🎁');
        if (cashbackEarned > 0) callbacks.addTransaction('Кэшбэк', cashbackEarned, '✨');
    }
    if (callbacks.clearCart) callbacks.clearCart();
    if (callbacks.updateUI) callbacks.updateUI(newBalance, finalBonus);
    if (callbacks.showTracking) callbacks.showTracking(order, deliveryType);

    return { success: true, message: '✅ Заказ оплачен!', newBalance, newBonus: finalBonus, order };
}

// Колесо удачи
export function spinWheel(currentSpinsLeft, currentBonus, callbacks) {
    if (currentSpinsLeft <= 0) {
        return { success: false, message: '❌ Недоступно' };
    }

    const prizes = [500, 300, 200, 100, 50];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    const newBonus = currentBonus + prize;
    const newSpinsLeft = currentSpinsLeft - 1;

    if (callbacks.addTransaction) {
        callbacks.addTransaction('Колесо удачи', prize, '🎡');
    }
    if (callbacks.updateUI) callbacks.updateUI(newBonus);

    return { success: true, message: `🎉 Вы выиграли ${prize} бонусов!`, newBonus, newSpinsLeft, prize };
}