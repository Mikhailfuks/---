import { api } from './api.js';
import { showToast } from './utils.js';

class CartManager {
    constructor() {
        this.items = [];
        this.listeners = [];
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.items));
    }

    async loadCart() {
        this.items = api.getCart();
        this.notifyListeners();
        return this.items;
    }

    addItem(product, quantity = 1, extras = []) {
        const existingIndex = this.items.findIndex(
            item => item.product.id === product.id && 
            JSON.stringify(item.extras) === JSON.stringify(extras)
        );
        
        if (existingIndex >= 0) {
            this.items[existingIndex].quantity += quantity;
        } else {
            this.items.push({
                product,
                quantity,
                extras,
                totalPrice: (product.price + this.calculateExtrasPrice(extras)) * quantity
            });
        }
        
        this.saveCart();
        showToast(`Added ${product.name} to cart`);
        return this.items;
    }

    calculateExtrasPrice(extras) {
        return extras.reduce((sum, extra) => sum + extra.price, 0);
    }

    updateQuantity(productId, delta, extras = []) {
        const index = this.items.findIndex(
            item => item.product.id === productId && 
            JSON.stringify(item.extras) === JSON.stringify(extras)
        );
        
        if (index >= 0) {
            const newQuantity = this.items[index].quantity + delta;
            if (newQuantity <= 0) {
                this.items.splice(index, 1);
            } else {
                this.items[index].quantity = newQuantity;
                this.items[index].totalPrice = 
                    (this.items[index].product.price + this.calculateExtrasPrice(this.items[index].extras)) * newQuantity;
            }
            this.saveCart();
        }
    }

    removeItem(productId, extras = []) {
        const index = this.items.findIndex(
            item => item.product.id === productId && 
            JSON.stringify(item.extras) === JSON.stringify(extras)
        );
        if (index >= 0) {
            this.items.splice(index, 1);
            this.saveCart();
        }
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    saveCart() {
        api.saveCart(this.items);
        this.notifyListeners();
        
        // Update cart badge
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = this.getItemCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    renderCart() {
        const container = document.getElementById('cartContainer');
        if (!container) return;
        
        if (this.items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p style="color: var(--gray); margin-top: 10px;">Add some delicious items!</p>
                </div>
            `;
            return;
        }
        
        let cartHtml = '';
        this.items.forEach(item => {
            cartHtml += `
                <div class="cart-item" data-product-id="${item.product.id}">
                    <div class="cart-item-info">
                        <h4>${item.product.name}</h4>
                        <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
                        ${item.extras.length ? `<small style="color: var(--gray);">+ ${item.extras.map(e => e.name).join(', ')}</small>` : ''}
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase">+</button>
                        <span style="font-weight: bold; min-width: 60px;">$${item.totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            `;
        });
        
        const deliveryFee = 2.99;
        const subtotal = this.getTotal();
        const tax = subtotal * 0.1;
        const total = subtotal + tax + deliveryFee;
        
        cartHtml += `
            <div class="cart-total">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Delivery Fee</span>
                    <span>$${deliveryFee.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Tax (10%)</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="total-row bold">
                    <span>Total</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
                <button id="checkoutBtn" class="checkout-btn">Proceed to Checkout</button>
            </div>
        `;
        
        container.innerHTML = cartHtml;
        
        // Attach event listeners
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartItem = btn.closest('.cart-item');
                const productId = parseInt(cartItem.dataset.productId);
                const action = btn.dataset.action;
                const item = this.items.find(i => i.product.id === productId);
                if (item) {
                    this.updateQuantity(productId, action === 'increase' ? 1 : -1, item.extras);
                    this.renderCart();
                }
            });
        });
        
        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            this.checkout();
        });
    }

    async checkout() {
        const user = JSON.parse(localStorage.getItem('megafood_user'));
        if (!user) {
            showToast('Please login to checkout');
            return;
        }
        
        const orderData = {
            userId: user.id,
            items: this.items.map(item => ({
                productId: item.product.id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
                extras: item.extras,
                totalPrice: item.totalPrice
            })),
            subtotal: this.getTotal(),
            deliveryFee: 2.99,
            tax: this.getTotal() * 0.1,
            total: this.getTotal() + 2.99 + (this.getTotal() * 0.1),
            deliveryAddress: user.address || 'Default Address',
            createdAt: new Date().toISOString()
        };
        
        const result = await api.createOrder(orderData);
        if (result) {
            this.clearCart();
            showToast('Order placed successfully!');
            // Navigate to orders
            document.querySelector('[data-screen="orders"]')?.click();
        }
    }
}

export const cartManager = new CartManager();