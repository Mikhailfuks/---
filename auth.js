import { api } from './api.js';
import { showToast } from './utils.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    async init() {
        this.currentUser = api.getCurrentUser();
        this.isAuthenticated = !!this.currentUser;
        
        if (this.currentUser) {
            this.dispatchAuthEvent('login', this.currentUser);
        }
        
        return this.isAuthenticated;
    }

    isAuthenticated() {
        return !!api.getCurrentUser();
    }

    getCurrentUser() {
        return api.getCurrentUser();
    }

    async register(userData) {
        const result = await api.register(userData);
        if (result.success) {
            this.currentUser = result.user;
            this.isAuthenticated = true;
            this.dispatchAuthEvent('login', this.currentUser);
            showToast('Registration successful!');
            return true;
        } else {
            showToast(result.error || 'Registration failed');
            return false;
        }
    }

    async login(email, password) {
        const result = await api.login(email, password);
        if (result.success) {
            this.currentUser = result.user;
            this.isAuthenticated = true;
            this.dispatchAuthEvent('login', this.currentUser);
            showToast(`Welcome back, ${this.currentUser.name || this.currentUser.email}!`);
            return true;
        } else {
            showToast('Invalid email or password');
            return false;
        }
    }

    logout() {
        api.logout();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.dispatchAuthEvent('logout');
        showToast('Logged out successfully');
        return true;
    }

    dispatchAuthEvent(type, user = null) {
        const event = new CustomEvent(`auth:${type}`, { detail: { user } });
        window.dispatchEvent(event);
    }
}

export const authManager = new AuthManager();