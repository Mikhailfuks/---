import { api } from './api.js';
import { showToast, showModal, closeModal } from './utils.js';

class TrackingManager {
    constructor() {
        this.currentOrder = null;
        this.chatInterval = null;
    }

    startTracking(orderId) {
        this.currentOrderId = orderId;
        this.loadOrderDetails();
    }

    async loadOrderDetails() {
        this.currentOrder = await api.getOrder(this.currentOrderId);
        if (this.currentOrder) {
            this.renderTracking();
        }
    }

    renderTracking() {
        const container = document.getElementById('trackingContainer');
        if (!container || !this.currentOrder) return;
        
        const status = this.currentOrder.status;
        const estimatedTime = this.currentOrder.tracking?.estimatedDelivery 
            ? new Date(this.currentOrder.tracking.estimatedDelivery)
            : new Date(Date.now() + 30 * 60000);
        
        const now = new Date();
        const timeRemaining = Math.max(0, Math.ceil((estimatedTime - now) / 60000));
        
        let statusSteps = [
            { key: 'confirmed', label: 'Confirmed', icon: '✅' },
            { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
            { key: 'delivering', label: 'Delivering', icon: '🛵' },
            { key: 'delivered', label: 'Delivered', icon: '🏠' }
        ];
        
        let currentStepIndex = statusSteps.findIndex(s => s.key === status);
        if (currentStepIndex === -1 && status === 'pending') currentStepIndex = -1;
        
        let stepsHtml = '';
        statusSteps.forEach((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            
            stepsHtml += `
                <div style="flex: 1; text-align: center; position: relative;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: ${isCompleted ? 'var(--success)' : (isActive ? 'var(--primary)' : 'var(--gray)')};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto;
                        color: white;
                    ">${step.icon}</div>
                    <div style="font-size: 12px; margin-top: 8px; font-weight: ${isActive ? 'bold' : 'normal'};">
                        ${step.label}
                    </div>
                    ${index < statusSteps.length - 1 ? `
                        <div style="
                            position: absolute;
                            top: 20px;
                            left: 50%;
                            width: calc(100% - 40px);
                            height: 2px;
                            background: ${isCompleted ? 'var(--success)' : 'var(--gray)'};
                        "></div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = `
            <div class="tracking-header">
                <h2>Order #${this.currentOrder.id}</h2>
                <p style="color: var(--gray);">Estimated delivery: ${estimatedTime.toLocaleTimeString()}</p>
                ${timeRemaining > 0 ? `<p style="color: var(--primary); font-weight: bold;">~${timeRemaining} minutes remaining</p>` : ''}
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 30px 0; padding: 0 10px;">
                ${stepsHtml}
            </div>
            
            ${this.currentOrder.status === 'delivering' ? `
                <div class="courier-info">
                    <div class="courier-avatar">🛵</div>
                    <div style="flex: 1;">
                        <h4>Your Courier: Alex</h4>
                        <p style="font-size: 12px; color: var(--gray);">Rating: 4.9 ★</p>
                        <p style="font-size: 12px;">Order #${this.currentOrder.id}</p>
                    </div>
                    <button id="chatWithCourier" class="chat-btn">💬 Chat</button>
                </div>
            ` : ''}
            
            <div style="background: white; border-radius: 12px; padding: 15px; margin-top: 20px;">
                <h4>Delivery Address</h4>
                <p style="color: var(--gray); margin-top: 8px;">${this.currentOrder.deliveryAddress}</p>
            </div>
        `;
        
        document.getElementById('chatWithCourier')?.addEventListener('click', () => {
            this.openChat();
        });
    }

    openChat() {
        const modalContent = `
            <div class="modal-header">
                <h3>Chat with Courier - Order #${this.currentOrder.id}</h3>
                <button class="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <div id="chatMessages" class="chat-messages" style="height: 300px; overflow-y: auto; margin-bottom: 10px;"></div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type a message..." class="chat-input">
                    <button id="sendMessageBtn" class="send-btn">Send</button>
                </div>
            </div>
        `;
        
        showModal(modalContent);
        this.loadChatMessages();
        
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Auto-refresh chat every 3 seconds
        if (this.chatInterval) clearInterval(this.chatInterval);
        this.chatInterval = setInterval(() => this.loadChatMessages(), 3000);
        
        // Clear interval when modal closes
        const closeBtn = document.querySelector('.close-modal');
        const originalClose = closeBtn?.onclick;
        closeBtn.onclick = () => {
            if (this.chatInterval) clearInterval(this.chatInterval);
            if (originalClose) originalClose();
            closeModal();
        };
    }

    async loadChatMessages() {
        const messages = await api.getMessages(this.currentOrder.id);
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const currentUser = JSON.parse(localStorage.getItem('megafood_user'));
        
        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender === 'user' ? 'user' : 'courier'}">
                <strong>${msg.sender === 'user' ? 'You' : 'Courier'}:</strong> ${msg.text}
                <div style="font-size: 10px; margin-top: 4px;">${new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        await api.sendMessage(this.currentOrder.id, message, 'user');
        input.value = '';
        this.loadChatMessages();
    }
}

export const trackingManager = new TrackingManager();