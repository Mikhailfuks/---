// Main Application Controller
import { API_BASE_URL, api } from './api.js';
import { cartManager } from './cart.js';
import { authManager } from './auth.js';
import { productsManager } from './products.js';
import { ordersManager } from './orders.js';
import { trackingManager } from './tracking.js';
import { showToast, showModal, closeModal } from './utils.js';

class App {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'products';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavigation();
        
        // Check authentication
        await authManager.init();
        
        if (!authManager.isAuthenticated()) {
            this.showAuthScreen();
        } else {
            this.currentUser = authManager.getCurrentUser();
            await this.loadInitialData();
            this.showProductsScreen();
        }
        
        // Listen for auth changes
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail.user;
            this.loadInitialData();
            this.showProductsScreen();
        });
        
        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.showAuthScreen();
        });
    }

    setupEventListeners() {
        // Cart icon click
        document.getElementById('cartIcon')?.addEventListener('click', () => {
            this.showCartScreen();
        });
        
        // User icon click
        document.getElementById('userIcon')?.addEventListener('click', () => {
            if (authManager.isAuthenticated()) {
                this.showProfileScreen();
            } else {
                this.showAuthScreen();
            }
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = item.dataset.screen;
                if (screen) {
                    this.navigateTo(screen);
                }
            });
        });
    }

    navigateTo(screen) {
        this.currentScreen = screen;
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.screen === screen) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Show appropriate screen
        switch(screen) {
            case 'products':
                this.showProductsScreen();
                break;
            case 'cart':
                this.showCartScreen();
                break;
            case 'orders':
                this.showOrdersScreen();
                break;
            case 'profile':
                this.showProfileScreen();
                break;
        }
    }

    async loadInitialData() {
        await productsManager.loadProducts();
        await cartManager.loadCart();
        await ordersManager.loadOrders();
    }

    showAuthScreen() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <h2 class="auth-title">🍔 MegaFood</h2>
                        <div id="authFormContainer"></div>
                    </div>
                </div>
            `;
            this.renderAuthForms();
        }
    }

    renderAuthForms() {
        const container = document.getElementById('authFormContainer');
        if (!container) return;
        
        // Show login form by default
        container.innerHTML = `
            <form id="loginForm">
                <div class="input-group">
                    <input type="email" id="loginEmail" placeholder="Email" required>
                </div>
                <div class="input-group">
                    <input type="password" id="loginPassword" placeholder="Password" required>
                </div>
                <button type="submit" class="auth-btn">Login</button>
            </form>
            <div class="auth-link">
                Don't have an account? <a href="#" id="showRegisterLink">Register</a>
            </div>
        `;
        
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const success = await authManager.login(email, password);
            if (!success) {
                showToast('Invalid credentials');
            }
        });
        
        document.getElementById('showRegisterLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
    }

    showRegisterForm() {
        const container = document.getElementById('authFormContainer');
        if (!container) return;
        
        container.innerHTML = `
            <form id="registerForm">
                <div class="input-group">
                    <input type="text" id="regName" placeholder="Full Name" required>
                </div>
                <div class="input-group">
                    <input type="email" id="regEmail" placeholder="Email" required>
                </div>
                <div class="input-group">
                    <input type="tel" id="regPhone" placeholder="Phone Number" required>
                </div>
                <div class="input-group">
                    <input type="password" id="regPassword" placeholder="Password" required>
                </div>
                <div class="input-group">
                    <input type="text" id="regAddress" placeholder="Delivery Address" required>
                </div>
                <button type="submit" class="auth-btn">Register</button>
            </form>
            <div class="auth-link">
                Already have an account? <a href="#" id="showLoginLink">Login</a>
            </div>
        `;
        
        document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                phone: document.getElementById('regPhone').value,
                password: document.getElementById('regPassword').value,
                address: document.getElementById('regAddress').value
            };
            const success = await authManager.register(userData);
            if (!success) {
                showToast('Registration failed');
            }
        });
        
        document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.renderAuthForms();
        });
    }

    showProductsScreen() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="categories" id="categoriesContainer"></div>
                <div id="productsContainer"></div>
            `;
            productsManager.renderCategories();
            productsManager.renderProducts();
        }
        this.updateCartBadge();
    }

    showCartScreen() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div id="cartContainer"></div>
            `;
            cartManager.renderCart();
        }
        this.updateCartBadge();
    }

    showOrdersScreen() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div id="ordersContainer"></div>
            `;
            ordersManager.renderOrders();
        }
    }

    showProfileScreen() {
        const user = authManager.getCurrentUser();
        const mainContent = document.getElementById('mainContent');
        if (mainContent && user) {
            mainContent.innerHTML = `
                <div style="background: white; border-radius: 16px; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 60px;">👤</div>
                        <h3>${user.name || user.email}</h3>
                        <p style="color: var(--gray);">${user.email}</p>
                        <p style="color: var(--gray);">${user.phone || 'No phone'}</p>
                        <p style="color: var(--gray);">📍 ${user.address || 'No address'}</p>
                    </div>
                    <button id="logoutBtn" class="checkout-btn" style="background: var(--danger);">Logout</button>
                </div>
            `;
            
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                authManager.logout();
            });
        }
    }

    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = cartManager.getItemCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

export { App };