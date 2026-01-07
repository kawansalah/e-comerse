// ========================================
// Main JavaScript for Product Listing Page
// ========================================

let currentCategory = "";
let currentSearch = "";

// ========================================
// Fetch Products
// ========================================
async function fetchProducts(category = null, searchTerm = null) {
  try {
    showLoading("loadingSpinner");
    document.getElementById("emptyState").classList.add("hidden");

    // Build query string
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (searchTerm) params.append("search", searchTerm);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const data = await apiRequest(`/products${queryString}`);

    hideLoading("loadingSpinner");
    displayProducts(data.data || []);
  } catch (error) {
    hideLoading("loadingSpinner");
    console.error("Error fetching products:", error);
    showToast("Failed to load products. Please try again.", "error");
    displayProducts([]);
  }
}

// ========================================
// Display Products
// ========================================
function displayProducts(products) {
  const grid = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");

  grid.innerHTML = "";

  if (products.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  products.forEach((product) => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });

  // Add fade-in animation
  grid.querySelectorAll(".product-card").forEach((card, index) => {
    card.style.animationDelay = `${index * 0.05}s`;
    card.classList.add("fade-in");
  });
}

// ========================================
// Create Product Card
// ========================================
function createProductCard(product) {
  const div = document.createElement("div");
  div.className =
    "product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1";

  const stockStatus =
    product.stock > 10
      ? '<span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded"><i class="fas fa-check-circle mr-1"></i>In Stock</span>'
      : product.stock > 0
      ? '<span class="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded"><i class="fas fa-exclamation-triangle mr-1"></i>Low Stock</span>'
      : '<span class="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded"><i class="fas fa-times-circle mr-1"></i>Out of Stock</span>';

  const imageUrl = product.image_url || "https://via.placeholder.com/300";

  div.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}" alt="${
    product.name
  }" class="w-full h-64 object-cover" onerror="this.src='https://via.placeholder.com/300'">
            <span class="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">${
              product.category || "General"
            }</span>
        </div>
        <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">${
              product.name
            }</h3>
            <div class="flex items-center justify-between mb-3">
                ${stockStatus}
            </div>
            <p class="text-2xl font-bold text-blue-600 mb-4">${formatCurrency(
              product.price
            )}</p>
            <div class="flex gap-2">
                <button onclick="addToCart(${
                  product.id
                })" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition ${
    product.stock === 0 ? "opacity-50 cursor-not-allowed" : ""
  }" ${product.stock === 0 ? "disabled" : ""}>
                    <i class="fas fa-cart-plus mr-2"></i>Add to Cart
                </button>
                <a href="product-details.html?id=${
                  product.id
                }" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center">
                    <i class="fas fa-eye"></i>
                </a>
            </div>
        </div>
    `;

  return div;
}

// ========================================
// Add to Cart
// ========================================
async function addToCart(productId, quantity = 1) {
  console.log(
    `DEBUG: Adding to cart. ProductID: ${productId}, Quantity: ${quantity}`
  );
  try {
    // Fetch product details
    const response = await apiRequest(`/products/${productId}`);
    const product = response.data;

    if (!product) {
      showToast("Product not found", "error");
      return;
    }

    if (product.stock < quantity) {
      showToast("Insufficient stock available", "error");
      return;
    }

    // Get current cart
    const cart = getCart();

    // Check if product already in cart
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        showToast(`Only ${product.stock} items available`, "error");
        return;
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        quantity: quantity,
        stock: product.stock,
      });
    }

    // Save cart
    saveCart(cart);

    // Update cart counter
    updateCartCounter();

    // Animate cart icon
    const cartIcon = document.querySelector(".fa-shopping-cart");
    if (cartIcon) {
      cartIcon.classList.add("animate-bounce");
      setTimeout(() => cartIcon.classList.remove("animate-bounce"), 500);
    }

    showToast("Product added to cart!", "success");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showToast("Failed to add product to cart", "error");
  }
}

// ========================================
// Update Cart Counter
// ========================================
function updateCartCounter() {
  const counter = document.getElementById("cartCounter");
  if (!counter) return;

  const quantity = getCartQuantity();

  if (quantity > 0) {
    counter.textContent = quantity;
    counter.classList.remove("hidden");
  } else {
    counter.classList.add("hidden");
  }
}

// ========================================
// Category Filter
// ========================================
function filterByCategory(event, category) {
  currentCategory = category;

  // Update active button
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active", "bg-blue-600", "text-white");
    btn.classList.add("bg-gray-100", "text-gray-700");
  });

  event.target.classList.remove("bg-gray-100", "text-gray-700");
  event.target.classList.add("active", "bg-blue-600", "text-white");

  // Update URL
  setQueryParam("category", category);

  // Fetch filtered products
  fetchProducts(category, currentSearch);
}

// ========================================
// Initialize Category Buttons
// ========================================
function initializeCategoryButtons() {
  const categoryButtons = document.querySelectorAll(".category-btn");

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const category = btn.dataset.category;
      filterByCategory(e, category);
    });
  });

  // Check URL for category
  const urlCategory = getQueryParam("category");
  if (urlCategory) {
    const btn = document.querySelector(`[data-category="${urlCategory}"]`);
    if (btn) btn.click();
  }
}

// ========================================
// Initialize Search
// ========================================
function initializeSearch() {
  const searchInputs = [
    document.getElementById("searchInput"),
    document.getElementById("searchInputMobile"),
  ];

  const debouncedSearch = debounce((searchTerm) => {
    currentSearch = searchTerm;
    fetchProducts(currentCategory, searchTerm);
  }, 500);

  searchInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", (e) => {
        debouncedSearch(e.target.value.trim());
      });
    }
  });
}

// ========================================
// Initialize Page
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // Update cart counter
  updateCartCounter();

  // Initialize category buttons
  initializeCategoryButtons();

  // Initialize search
  initializeSearch();

  // Load products
  const urlCategory = getQueryParam("category");
  fetchProducts(urlCategory, "");
});
