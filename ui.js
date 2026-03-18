// ui.js
// Общие UI-функции

export function showToast(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

export function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><div class="modal-header"><h3>${title}</h3><span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span></div>${content}</div>`;
    document.body.appendChild(modal);
}

export function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
}

export function initReviews(reviews) {
    const list = document.getElementById('reviewsList');
    if (!list) return;
    list.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-avatar">${review.avatar}</div>
                <div class="review-info">
                    <div class="review-name">${review.name}</div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                </div>
            </div>
            <div class="review-text">"${review.text}"</div>
            <div class="review-order">Заказ: ${review.order}</div>
        </div>
    `).join('');
}

export function initBonusProducts(products, addToCartCallback) {
    const grid = document.getElementById('bonusProducts');
    if (!grid) return;
    let html = '';
    products.forEach(p => {
        html += `<div class="bonus-item" onclick="addBonusToCart(${p.id})"><div class="bonus-icon">${p.icon}</div><div class="bonus-info"><div class="bonus-name">${p.name}</div><div class="bonus-price">🎁 ${p.bonusPrice} бонусов</div></div></div>`;
    });
    grid.innerHTML = html;
}

export function initHistory(transactions) {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = transactions.slice(0,3).map(item => `
        <div class="history-item">
            <div class="history-icon">${item.icon}</div>
            <div class="history-details"><div class="history-title">${item.type}</div><div class="history-date">${item.date}</div></div>
            <div class="history-amount ${item.amount>0?'positive':'negative'}">${item.amount>0?'+':''}${Math.abs(item.amount)} ₽</div>
        </div>
    `).join('');
}

export function showFullHistory(transactions) {
    let html = '<div style="max-height:400px; overflow-y:auto;">';
    transactions.forEach(item => {
        html += `<div style="display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid #f0f0f0;">
            <div style="width:40px; height:40px; background:#f0f2f5; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:20px;">${item.icon}</div>
            <div style="flex:1;"><div style="font-weight:600;">${item.type}</div><div style="font-size:12px; color:var(--gray);">${item.date}</div></div>
            <div style="font-weight:700; color:${item.amount>0?'var(--success)':'var(--primary)'}">${item.amount>0?'+':''}${Math.abs(item.amount)} ₽</div>
        </div>`;
    });
    html += '</div>';
    showModal('История операций', html);
}