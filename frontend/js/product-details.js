// ========================================
// Product Details Page JavaScript
// ========================================

let currentProduct = null;

// ========================================
// Load Product Details
// ========================================
async function loadProductDetails() {
  try {
    // Get product ID from URL
    const productId = getQueryParam("id");

    if (!productId) {
      showToast("Product ID not found", "error");
      setTimeout(() => (window.location.href = "index.html"), 2000);
      return;
    }

    // Fetch product details
    const response = await apiRequest(`/products/${productId}`);
    currentProduct = response.data;

    if (!currentProduct) {
      showToast("Product not found", "error");
      setTimeout(() => (window.location.href = "index.html"), 3000);
      return;
    }

    // Populate page
    populateProductDetails();

    // Load related products
    loadRelatedProducts();
  } catch (error) {
    console.error("Error loading product:", error);
    showToast("Failed to load product details", "error");
    setTimeout(() => (window.location.href = "index.html"), 3000);
  }
}

// ========================================
// Populate Product Details
// ========================================
function populateProductDetails() {
  const product = currentProduct;

  // Update page title
  document.title = `${product.name} - BAZZAR`;

  // Product image
  const imageUrl = product.image_url || "https://via.placeholder.com/600";
  document.getElementById("productImage").src = imageUrl;
  document.getElementById("productImage").alt = product.name;

  // Product info
  document.getElementById("productName").textContent = product.name;
  document.getElementById("productCategory").textContent =
    product.category || "General";
  document.getElementById("productPrice").textContent = formatCurrency(
    product.price
  );
  document.getElementById("productDescription").textContent =
    product.description || "No description available.";
  document.getElementById("fullDescription").textContent =
    product.description || "No description available.";

  // Stock status
  const stockDiv = document.getElementById("stockStatus");
  if (product.stock > 10) {
    stockDiv.innerHTML = `
            <span class="inline-flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <span class="text-green-600 font-medium">In Stock (${product.stock} available)</span>
            </span>
        `;
  } else if (product.stock > 0) {
    stockDiv.innerHTML = `
            <span class="inline-flex items-center">
                <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                <span class="text-yellow-600 font-medium">Low Stock (Only ${product.stock} left)</span>
            </span>
        `;
  } else {
    stockDiv.innerHTML = `
            <span class="inline-flex items-center">
                <i class="fas fa-times-circle text-red-500 mr-2"></i>
                <span class="text-red-600 font-medium">Out of Stock</span>
            </span>
        `;
    document.getElementById("addToCartBtn").disabled = true;
    document.getElementById("buyNowBtn").disabled = true;
    document
      .getElementById("addToCartBtn")
      .classList.add("opacity-50", "cursor-not-allowed");
    document
      .getElementById("buyNowBtn")
      .classList.add("opacity-50", "cursor-not-allowed");
  }

  // Set max quantity
  const quantityInput = document.getElementById("quantityInput");
  quantityInput.max = product.stock;
  document.getElementById("maxStock").textContent = product.stock;

  // Breadcrumb
  document.getElementById("breadcrumbCategory").textContent =
    product.category || "General";
  document.getElementById("breadcrumbProduct").textContent = product.name;
}

// ========================================
// Quantity Controls
// ========================================
function increaseQuantity() {
  const input = document.getElementById("quantityInput");
  const currentValue = parseInt(input.value);
  const maxValue = parseInt(input.max);

  if (currentValue < maxValue) {
    input.value = currentValue + 1;
  } else {
    showToast(`Maximum ${maxValue} items available`, "error");
  }
}

function decreaseQuantity() {
  const input = document.getElementById("quantityInput");
  const currentValue = parseInt(input.value);

  if (currentValue > 1) {
    input.value = currentValue - 1;
  }
}

function validateQuantityInput() {
  const input = document.getElementById("quantityInput");
  let value = parseInt(input.value);
  const max = parseInt(input.max);

  if (isNaN(value) || value < 1) {
    value = 1;
  } else if (value > max) {
    value = max;
    showToast(`Maximum ${max} items available`, "error");
  }

  input.value = value;
}

// ========================================
// Add to Cart from Details Page
// ========================================
function addToCartFromDetails() {
  const quantity = parseInt(document.getElementById("quantityInput").value);
  addToCart(currentProduct.id, quantity);
}

// ========================================
// Buy Now
// ========================================
function buyNow() {
  const quantity = parseInt(document.getElementById("quantityInput").value);
  addToCart(currentProduct.id, quantity);
  setTimeout(() => (window.location.href = "checkout.html"), 500);
}

// ========================================
// Load Related Products
// ========================================
async function loadRelatedProducts() {
  try {
    // Fetch products from same category
    const response = await apiRequest(
      `/products?category=${currentProduct.category}`
    );
    const products = response.data || [];

    // Filter out current product and limit to 4
    const relatedProducts = products
      .filter((p) => p.id !== currentProduct.id)
      .slice(0, 4);

    displayRelatedProducts(relatedProducts);
  } catch (error) {
    console.error("Error loading related products:", error);
  }
}

// ========================================
// Display Related Products
// ========================================
function displayRelatedProducts(products) {
  const container = document.getElementById("relatedProducts");

  if (products.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500">No related products found.</p>';
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const imageUrl = product.image_url || "https://via.placeholder.com/200";
      return `
            <a href="product-details.html?id=${
              product.id
            }" class="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <img src="${imageUrl}" alt="${
        product.name
      }" class="w-full h-40 object-cover">
                <div class="p-3">
                    <h4 class="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">${
                      product.name
                    }</h4>
                    <p class="text-blue-600 font-bold">${formatCurrency(
                      product.price
                    )}</p>
                </div>
            </a>
        `;
    })
    .join("");
}

// ========================================
// Tab Functionality
// ========================================
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      // Update button states
      tabButtons.forEach((b) => {
        b.classList.remove("active", "border-blue-600", "text-blue-600");
        b.classList.add("border-transparent", "text-gray-600");
      });
      btn.classList.add("active", "border-blue-600", "text-blue-600");
      btn.classList.remove("border-transparent", "text-gray-600");

      // Show/hide tab content
      tabContents.forEach((content) => {
        content.classList.add("hidden");
      });
      document.getElementById(`${tabName}Tab`).classList.remove("hidden");
    });
  });
}

// ========================================
// Initialize Page
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // Load product details
  loadProductDetails();

  // Initialize tabs
  initializeTabs();

  // Quantity controls
  document
    .getElementById("increaseQty")
    ?.addEventListener("click", increaseQuantity);
  document
    .getElementById("decreaseQty")
    ?.addEventListener("click", decreaseQuantity);
  document
    .getElementById("quantityInput")
    ?.addEventListener("blur", validateQuantityInput);

  // Add to cart button
  document
    .getElementById("addToCartBtn")
    ?.addEventListener("click", addToCartFromDetails);

  // Buy now button
  document.getElementById("buyNowBtn")?.addEventListener("click", buyNow);

  // Update cart counter
  updateCartCounter();
});
