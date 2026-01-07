// ========================================
// Checkout Page JavaScript
// ========================================

// ========================================
// Display Order Summary
// ========================================
function displayOrderSummary() {
    const cart = getCart();
    const orderItems = document.getElementById('orderItems');

    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        setTimeout(() => window.location.href = 'cart.html', 1500);
        return;
    }

    // Display items
    orderItems.innerHTML = cart.map(item => `
        <div class="flex justify-between items-start text-sm">
            <div class="flex-1">
                <p class="font-medium text-gray-900">${item.name}</p>
                <p class="text-gray-500">Qty: ${item.quantity}</p>
            </div>
            <p class="font-semibold">${formatCurrency(item.price * item.quantity)}</p>
        </div>
    `).join('');

    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 10;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // Display totals
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shipping').textContent = formatCurrency(shipping);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);
}

// ========================================
// Validate Checkout Form
// ========================================
function validateCheckoutForm() {
    let isValid = true;
    const fields = [
        { id: 'customerName', validator: val => val.trim().length > 0, message: 'Name is required' },
        { id: 'email', validator: isValidEmail, message: 'Invalid email address' },
        { id: 'phone', validator: isValidPhone, message: 'Invalid phone number' },
        { id: 'address', validator: val => val.trim().length > 0, message: 'Address is required' },
        { id: 'city', validator: val => val.trim().length > 0, message: 'City is required' },
        { id: 'state', validator: val => val.trim().length > 0, message: 'State is required' },
        { id: 'postalCode', validator: val => val.trim().length > 0, message: 'Postal code is required' },
        { id: 'country', validator: val => val.trim().length > 0, message: 'Country is required' }
    ];

    let firstInvalidField = null;

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const errorMsg = input.parentElement.querySelector('.error-message');
        const value = input.value;

        if (!field.validator(value)) {
            isValid = false;
            input.classList.add('border-red-500');
            input.classList.remove('border-gray-300');
            if (errorMsg) {
                errorMsg.textContent = field.message;
                errorMsg.classList.remove('hidden');
            }
            if (!firstInvalidField) {
                firstInvalidField = input;
            }
        } else {
            input.classList.remove('border-red-500');
            input.classList.add('border-gray-300');
            if (errorMsg) {
                errorMsg.classList.add('hidden');
            }
        }
    });

    // Scroll to first invalid field
    if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidField.focus();
    }

    return isValid;
}

// ========================================
// Submit Order
// ========================================
async function submitOrder(event) {
    event.preventDefault();

    // Validate form
    if (!validateCheckoutForm()) {
        showToast('Please fill in all required fields correctly', 'error');
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById('submitOrderBtn');
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    try {
        // Collect form data
        const customerName = document.getElementById('customerName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address1 = document.getElementById('address').value.trim();
        const address2 = document.getElementById('address2')?.value.trim() || '';
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const postalCode = document.getElementById('postalCode').value.trim();
        const country = document.getElementById('country').value.trim();

        // Build full address
        const fullAddress = address2 
            ? `${address1}, ${address2}, ${city}, ${state} ${postalCode}, ${country}`
            : `${address1}, ${city}, ${state} ${postalCode}, ${country}`;

        // Format cart items for API
        const items = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));

        // Submit order
        const orderData = {
            customer_name: customerName,
            email: email,
            phone: phone,
            address: fullAddress,
            items: items
        };

        const response = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        // Success!
        const orderId = response.data.id;

        // Calculate totals for confirmation page
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 100 ? 0 : 10;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        // Store order data in sessionStorage
        sessionStorage.setItem('orderId', orderId);
        sessionStorage.setItem('orderData', JSON.stringify({
            customer_name: customerName,
            email: email,
            phone: phone,
            address: address1,
            city: city,
            state: state,
            postalCode: postalCode,
            country: country,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
        }));

        // Clear cart
        localStorage.removeItem('cart');

        // Redirect to confirmation page
        window.location.href = 'order-confirmation.html';

    } catch (error) {
        console.error('Error submitting order:', error);
        showToast(error.message || 'Failed to place order. Please try again.', 'error');

        // Re-enable submit button
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

// ========================================
// Real-time Validation
// ========================================
function setupRealTimeValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');

    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const errorMsg = this.parentElement.querySelector('.error-message');
            if (!isValidEmail(this.value) && this.value.trim() !== '') {
                this.classList.add('border-red-500');
                if (errorMsg) {
                    errorMsg.textContent = 'Invalid email address';
                    errorMsg.classList.remove('hidden');
                }
            } else {
                this.classList.remove('border-red-500');
                if (errorMsg) {
                    errorMsg.classList.add('hidden');
                }
            }
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const errorMsg = this.parentElement.querySelector('.error-message');
            if (!isValidPhone(this.value) && this.value.trim() !== '') {
                this.classList.add('border-red-500');
                if (errorMsg) {
                    errorMsg.textContent = 'Invalid phone number';
                    errorMsg.classList.remove('hidden');
                }
            } else {
                this.classList.remove('border-red-500');
                if (errorMsg) {
                    errorMsg.classList.add('hidden');
                }
            }
        });
    }
}

// ========================================
// Initialize Page
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Display order summary
    displayOrderSummary();

    // Setup form validation
    setupRealTimeValidation();

    // Handle form submission
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', submitOrder);
    }
});
