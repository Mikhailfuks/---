// API Configuration and Requests
export const API_BASE_URL = 'https://api.example.com'; // Replace with actual API URL

// Mock data for demo purposes
const mockProducts = [
    { id: 1, name: 'Cheeseburger', description: 'Juicy beef patty with cheese', price: 8.99, category: 'burgers', image: '🍔', available: true },
    { id: 2, name: 'Margherita Pizza', description: 'Fresh mozzarella and basil', price: 12.99, category: 'pizza', image: '🍕', available: true },
    { id: 3, name: 'Caesar Salad', description: 'Crispy romaine with dressing', price: 7.99, category: 'salads', image: '🥗', available: true },
    { id: 4, name: 'Chicken Wings', description: 'Spicy buffalo wings', price: 9.99, category: 'appetizers', image: '🍗', available: true },
    { id: 5, name: 'French Fries', description: 'Crispy golden fries', price: 3.99, category: 'sides', image: '🍟', available: true },
    { id: 6, name: 'Coca Cola', description: 'Refreshing soda', price: 2.49, category: 'drinks', image: '🥤', available: true },
    { id: 7, name: 'Pepperoni Pizza', description: 'Classic pepperoni', price: 14.99, category: 'pizza', image: '🍕', available: true },
    { id: 8, name: 'Veggie Burger', description: 'Plant-based patty', price: 9.99, category: 'burgers', image: '🍔', available: true },
    { id: 9, name: 'Spring Rolls', description: 'Crispy vegetable rolls', price: 5.99, category: 'appetizers', image: '🥟', available: true },
    { id: 10, name: 'Iced Tea', description: 'Fresh brewed tea', price: 2.99, category: 'drinks', image: '🧋', available: true }
];

const mockCategories = ['all', 'burgers', 'pizza', 'salads', 'appetizers', 'sides', 'drinks'];

let mockOrders = [];
let nextOrderId = 1000;

export const api = {
    // Products
    async getProducts() {
        await delay(500);
        return [...mockProducts];
    },
    
    async getCategories() {
        await delay(300);
        return [...mockCategories];
    },
    
    // Cart (stored in localStorage)
    saveCart(cartItems) {
        localStorage.setItem('megafood_cart', JSON.stringify(cartItems));
    },
    
    getCart() {
        const cart = localStorage.getItem('megafood_cart');
        return cart ? JSON.parse(cart) : [];
    },
    
    // Orders
    async createOrder(orderData) {
        await delay(800);
        const newOrder = {
            id: nextOrderId++,
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            tracking: {
                status: 'confirmed',
                estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(),
                courier: null
            }
        };
        mockOrders.unshift(newOrder);
        this.saveOrders(mockOrders);
        return newOrder;
    },
    
    async getUserOrders(userId) {
        await delay(500);
        return mockOrders.filter(order => order.userId === userId);
    },
    
    async getOrder(orderId) {
        await delay(300);
        return mockOrders.find(order => order.id === orderId);
    },
    
    async updateOrderStatus(orderId, status) {
        await delay(500);
        const order = mockOrders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            if (order.tracking) order.tracking.status = status;
            this.saveOrders(mockOrders);
            return order;
        }
        return null;
    },
    
    saveOrders(orders) {
        localStorage.setItem('megafood_orders', JSON.stringify(orders));
    },
    
    loadOrders() {
        const saved = localStorage.getItem('megafood_orders');
        if (saved) {
            mockOrders = JSON.parse(saved);
            const maxId = Math.max(...mockOrders.map(o => o.id), 999);
            nextOrderId = maxId + 1;
        }
    },
    
    // Chat messages
    async getMessages(orderId) {
        await delay(200);
        const key = `chat_${orderId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    async sendMessage(orderId, message, sender) {
        await delay(100);
        const key = `chat_${orderId}`;
        const messages = JSON.parse(localStorage.getItem(key) || '[]');
        const newMessage = {
            id: Date.now(),
            text: message,
            sender: sender,
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem(key, JSON.stringify(messages));
        return newMessage;
    },
    
    // Auth (mock)
    async register(userData) {
        await delay(800);
        const users = this.getUsers();
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'User already exists' };
        }
        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('megafood_users', JSON.stringify(users));
        const token = btoa(JSON.stringify({ id: newUser.id, email: newUser.email }));
        localStorage.setItem('megafood_token', token);
        return { success: true, user: newUser, token };
    },
    
    async login(email, password) {
        await delay(800);
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const token = btoa(JSON.stringify({ id: user.id, email: user.email }));
            localStorage.setItem('megafood_token', token);
            return { success: true, user, token };
        }
        return { success: false, error: 'Invalid credentials' };
    },
    
    getUsers() {
        return JSON.parse(localStorage.getItem('megafood_users') || '[]');
    },
    
    getCurrentUser() {
        const token = localStorage.getItem('megafood_token');
        if (token) {
            try {
                const decoded = JSON.parse(atob(token));
                const users = this.getUsers();
                return users.find(u => u.id === decoded.id);
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    
    logout() {
        localStorage.removeItem('megafood_token');
    }
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize mock orders from localStorage
api.loadOrders();