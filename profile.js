// profile.js
// Управление профилем и картами

export function saveCard(cardData, updateDisplayCallback) {
    const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry')?.value;
    const cardCvv = document.getElementById('cardCvv')?.value;
    const cardHolder = document.getElementById('cardHolder')?.value.toUpperCase();

    if (!cardNumber || cardNumber.length < 16) {
        return { success: false, message: 'Введите корректный номер карты' };
    }
    if (!cardExpiry || cardExpiry.length < 5) {
        return { success: false, message: 'Введите срок действия' };
    }
    if (!cardCvv || cardCvv.length < 3) {
        return { success: false, message: 'Введите CVV код' };
    }
    if (!cardHolder || cardHolder.length < 3) {
        return { success: false, message: 'Введите имя владельца' };
    }

    const updatedCard = {
        number: cardNumber,
        expiry: cardExpiry,
        holder: cardHolder,
        lastFour: cardNumber.slice(-4)
    };

    if (updateDisplayCallback) updateDisplayCallback(updatedCard);

    // Очищаем CVV
    document.getElementById('cardCvv').value = '';

    return { success: true, message: 'Карта успешно привязана', data: updatedCard };
}

export function updateProfileDisplay(userData) {
    document.getElementById('profileName').textContent = userData.name;
    document.getElementById('profileEmail').textContent = userData.email;
    document.getElementById('profilePhone').textContent = userData.phone;
    document.getElementById('profileAvatar').textContent = userData.avatar;
}

export function updateProfileInfo(balance, bonus, isPremiumCallback) {
    document.getElementById('profileBalance').textContent = balance.toLocaleString() + ' ₽';
    document.getElementById('profileBonus').textContent = bonus.toLocaleString();
    if (isPremiumCallback) isPremiumCallback();
}

export function checkPremium(balance, isPremiumActive, elements) {
    const isPremium = balance >= 5000;
    const badge = document.getElementById(elements.badgeId);
    const profileCard = document.getElementById(elements.profileCardId);
    if (!badge || !profileCard) return isPremium;

    if (isPremium) {
        badge.innerHTML = '✅ Premium активен';
        badge.classList.add('active');
        profileCard.classList.add('premium');
    } else {
        badge.innerHTML = '⚠️ Premium не активен (нужно 5000+ ₽)';
        badge.classList.remove('active');
        profileCard.classList.remove('premium');
    }
    return isPremium;
}

export function saveProfileChanges(userData, formData) {
    userData.name = formData.name || userData.name;
    userData.email = formData.email || userData.email;
    userData.phone = formData.phone || userData.phone;
    userData.avatar = formData.avatar || userData.avatar;
    return userData;
}