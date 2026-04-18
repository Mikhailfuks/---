// Utility functions

let toastTimeout = null;
let currentModal = null;

export function showToast(message, duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto remove
    toastTimeout = setTimeout(() => {
        toast.remove();
    }, duration);
}

export function showModal(content) {
    closeModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    currentModal = modal;
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close button handler
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
}

export function closeModal() {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }
}

export function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
    return re.test(phone);
}

export function getStatusColor(status) {
    const colors = {
        pending: '#FFB347',
        confirmed: '#FF6B35',
        preparing: '#9B59B6',
        delivering: '#2EC4B6',
        delivered: '#2ECC71',
        cancelled: '#E71D36'
    };
    return colors[status] || '#6C757D';
}

// Loading spinner utilities
export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loader"></div>';
    }
}

export function hideLoading(containerId) {
    // Implementation depends on your needs
}