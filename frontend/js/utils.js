// ========================================
// Utility Functions for E-Commerce Frontend
// ========================================

/**
 * Formats a number as currency with $ symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', or 'info'
 */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type} fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-slide-in`;

  // Set background color based on type
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };
  toast.classList.add(colors[type] || colors.info);

  // Add icon based on type
  const icons = {
    success: '<i class="fas fa-check-circle mr-2"></i>',
    error: '<i class="fas fa-exclamation-circle mr-2"></i>',
    info: '<i class="fas fa-info-circle mr-2"></i>',
  };
  toast.innerHTML = (icons[type] || icons.info) + message;

  document.body.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.add("animate-slide-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Formats a date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Gets a query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value or null
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Sets a query parameter in URL without reload
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }
  window.history.pushState({}, "", url);
}

/**
 * Gets cart from localStorage
 * @returns {Array} Cart items array
 */
function getCart() {
  const cart = localStorage.getItem("cart");
  return cart ? JSON.parse(cart) : [];
}

/**
 * Saves cart to localStorage
 * @param {Array} cart - Cart items array
 */
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/**
 * Calculates cart total quantity
 * @returns {number} Total quantity of all items
 */
function getCartQuantity() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.quantity || 0), 0);
}

/**
 * Updates the cart counter badge in the header
 */
function updateCartCounter() {
  const counter = document.getElementById("cartCounter");
  if (counter) {
    const quantity = getCartQuantity();
    if (quantity > 0) {
      counter.textContent = quantity;
      counter.classList.remove("hidden");
    } else {
      counter.classList.add("hidden");
    }
  }
}

/**
 * Shows loading spinner
 * @param {string} elementId - ID of the loading element
 */
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove("hidden");
  }
}

/**
 * Hides loading spinner
 * @param {string} elementId - ID of the loading element
 */
function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add("hidden");
  }
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates phone number (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
  const regex = /^\+?[\d\s\-()]{10,}$/;
  return regex.test(phone);
}

/**
 * API base URL
 */
const API_BASE_URL = "http://localhost:3000/api";

/**
 * Makes an API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}
