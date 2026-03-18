// validators.js
// Функции для валидации и форматирования

export function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
    }
    input.value = formatted;

    // Обновляем DOM-элементы, если они существуют
    const display = document.getElementById('cardNumberDisplay');
    if (display) display.textContent = formatted || '**** **** **** ****';

    // Возвращаем объект с данными для сохранения в состоянии
    return {
        number: value,
        lastFour: value.length >= 16 ? value.slice(-4) : ''
    };
}

export function formatCardExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        input.value = value.slice(0, 2) + '/' + value.slice(2, 4);
    } else {
        input.value = value;
    }
    const expiryDisplay = document.getElementById('cardExpiryDisplay');
    if (expiryDisplay) expiryDisplay.textContent = input.value || '**/**';
    return input.value;
}

export function validatePromoCode(code, promoCodes) {
    const upperCode = code.trim().toUpperCase();
    return promoCodes[upperCode] || null;
}