// ========================================
// Shopping Cart Page JavaScript
// ========================================

let appliedPromoCode = null;

// ========================================
// Display Cart
// ========================================
function displayCart() {
    const cart = getCart();
    console.log('DEBUG: Cart contents loaded:', cart);
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const cartItemsList = document.getElementById('cartItemsList');

    if (cart.length === 0) {
        emptyCart.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
    }

    emptyCart.classList.add('hidden');
    cartContent.classList.remove('hidden');

    // Display cart items
    cartItemsList.innerHTML = cart.map(item => createCartItemHTML(item)).join('');

    // Calculate and display totals
    calculateTotals();

    // Update header cart counter
    updateCartCounter();
}

// ========================================
// Create Cart Item HTML
// ========================================
function createCartItemHTML(item) {
    const imageUrl = item.image_url || 'https://via.placeholder.com/100';
    const subtotal = item.price * item.quantity;

    return `
        <div class="cart-item bg-white rounded-lg shadow-md p-4 flex gap-4 items-center">
            <img src="${imageUrl}" alt="${item.name}" class="w-20 h-20 object-cover rounded" onerror="this.src='https://via.placeholder.com/100'">
            <div class="flex-1">
                <h3 class="font-semibold text-gray-900">${item.name}</h3>
                <p class="text-sm text-gray-500">${item.category || 'General'}</p>
                <p class="text-blue-600 font-semibold mt-1">${formatCurrency(item.price)}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" value="${item.quantity}" min="1" max="${item.stock}" 
                    onchange="updateQuantity(${item.id}, parseInt(this.value))"
                    class="w-16 text-center border border-gray-300 rounded py-1">
                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="text-right">
                <p class="font-bold text-lg">${formatCurrency(subtotal)}</p>
            </div>
            <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700 p-2">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

// ========================================
// Update Quantity
// ========================================
async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        showToast('Quantity must be at least 1', 'error');
        return;
    }

    try {
        // Fetch product to check stock
        const response = await apiRequest(`/products/${productId}`);
        const product = response.data;

        if (newQuantity > product.stock) {
            showToast(`Only ${product.stock} items available in stock`, 'error');
            displayCart(); // Refresh to show correct quantity
            return;
        }

        // Update cart
        const cart = getCart();
        const item = cart.find(i => i.id === productId);
        
        if (item) {
            item.quantity = newQuantity;
            item.stock = product.stock; // Update stock info
            saveCart(cart);
            displayCart();
            showToast('Cart updated', 'success');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('Failed to update quantity', 'error');
    }
}

// ========================================
// Remove from Cart
// ========================================
function removeFromCart(productId) {
    if (!confirm('Remove this item from cart?')) {
        return;
    }

    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    saveCart(updatedCart);
    
    showToast('Item removed from cart', 'success');
    displayCart();
    updateCartCounter();
}

// ========================================
// Calculate Totals
// ========================================
function calculateTotals() {
    const cart = getCart();
    
    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate shipping (free if over $100)
    const shipping = subtotal > 100 ? 0 : 10;
    
    // Calculate tax (8%)
    const tax = subtotal * 0.08;
    
    // Calculate discount
    let discount = 0;
    if (appliedPromoCode) {
        if (appliedPromoCode.type === 'percentage') {
            discount = subtotal * (appliedPromoCode.value / 100);
        } else if (appliedPromoCode.type === 'shipping') {
            discount = shipping;
        }
    }
    
    // Calculate total
    const total = subtotal + shipping + tax - discount;
    
    // Update display
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shipping').textContent = formatCurrency(shipping);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);
    
    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    if (discount > 0) {
        document.getElementById('discount').textContent = `-${formatCurrency(discount)}`;
        discountRow.classList.remove('hidden');
    } else {
        discountRow.classList.add('hidden');
    }
}

// ========================================
// Apply Promo Code
// ========================================
function applyPromoCode() {
    const input = document.getElementById('promoInput');
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        showToast('Please enter a promo code', 'error');
        return;
    }
    
    // Hardcoded promo codes
    const promoCodes = {
        'SAVE10': { type: 'percentage', value: 10 },
        'SAVE20': { type: 'percentage', value: 20 },
        'FREESHIP': { type: 'shipping', value: 0 }
    };
    
    if (promoCodes[code]) {
        appliedPromoCode = promoCodes[code];
        appliedPromoCode.code = code;
        
        // Update UI
        document.getElementById('promoCodeInput').classList.add('hidden');
        document.getElementById('promoCodeApplied').classList.remove('hidden');
        
        calculateTotals();
        
        const message = promoCodes[code].type === 'percentage' 
            ? `${promoCodes[code].value}% discount applied!`
            : 'Free shipping applied!';
        showToast(message, 'success');
    } else {
        showToast('Invalid promo code', 'error');
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}

// ========================================
// Remove Promo Code
// ========================================
function removePromoCode() {
    appliedPromoCode = null;
    document.getElementById('promoInput').value = '';
    document.getElementById('promoCodeInput').classList.remove('hidden');
    document.getElementById('promoCodeApplied').classList.add('hidden');
    calculateTotals();
    showToast('Promo code removed', 'info');
}

// ========================================
// Proceed to Checkout
// ========================================
function proceedToCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    window.location.href = 'checkout.html';
}

// ========================================
// Initialize Page
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    
    // Event listeners
    document.getElementById('applyPromoBtn')?.addEventListener('click', applyPromoCode);
    document.getElementById('removePromoBtn')?.addEventListener('click', removePromoCode);
    document.getElementById('checkoutBtn')?.addEventListener('click', proceedToCheckout);
    
    // Allow Enter key on promo input
    document.getElementById('promoInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyPromoCode();
        }
    });
});
