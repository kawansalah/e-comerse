// ========================================
// Admin Panel JavaScript
// ========================================

// ========================================
// Load Products Table
// ========================================
async function loadProductsTable() {
  try {
    showLoading("tableLoading");
    document.getElementById("productsTableBody").innerHTML = "";

    const response = await apiRequest("/products");
    const products = response.data || [];

    hideLoading("tableLoading");

    const tbody = document.getElementById("productsTableBody");
    tbody.innerHTML = products
      .map((product) => createProductRow(product))
      .join("");

    // Update product count
    document.getElementById(
      "productCount"
    ).textContent = `(${products.length} products)`;
  } catch (error) {
    hideLoading("tableLoading");
    console.error("Error loading products:", error);
    showToast("Failed to load products", "error");
  }
}

// ========================================
// Create Product Row
// ========================================
function createProductRow(product) {
  const imageUrl = product.image_url || "https://via.placeholder.com/50";
  const stockClass =
    product.stock > 10
      ? "text-green-600"
      : product.stock > 0
      ? "text-yellow-600"
      : "text-red-600";

  return `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
                <img src="${imageUrl}" alt="${
    product.name
  }" class="w-12 h-12 object-cover rounded" onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td class="px-4 py-3 font-medium">${product.name}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${
                  product.category || "N/A"
                }</span>
            </td>
            <td class="px-4 py-3 font-semibold">${formatCurrency(
              product.price
            )}</td>
            <td class="px-4 py-3 ${stockClass} font-semibold">${
    product.stock
  }</td>
            <td class="px-4 py-3 text-center">
                <button onclick="editProduct(${
                  product.id
                })" class="text-blue-600 hover:text-blue-800 px-2 py-1">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(event, ${
                  product.id
                }, '${product.name.replace(
    /'/g,
    "\\'"
  )}')" class="text-red-600 hover:text-red-800 px-2 py-1 ml-2">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// ========================================
// Handle Add Product
// ========================================
async function handleAddProduct(event) {
  event.preventDefault();

  // Collect form data
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);
  const imageUrl = document.getElementById("productImage").value.trim();
  const description = document
    .getElementById("productDescription")
    .value.trim();

  // Validate
  if (!name) {
    showToast("Product name is required", "error");
    return;
  }
  if (!category) {
    showToast("Please select a category", "error");
    return;
  }
  if (isNaN(price) || price <= 0) {
    showToast("Price must be a positive number", "error");
    return;
  }
  if (isNaN(stock) || stock < 0) {
    showToast("Stock must be a non-negative integer", "error");
    return;
  }

  try {
    const productData = {
      name,
      category,
      price,
      stock,
      image_url: imageUrl || null,
      description: description || null,
    };

    await apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });

    showToast("Product added successfully!", "success");

    // Clear form
    document.getElementById("addProductForm").reset();

    // Reload table
    loadProductsTable();
  } catch (error) {
    console.error("Error adding product:", error);
    showToast(error.message || "Failed to add product", "error");
  }
}

// ========================================
// Edit Product
// ========================================
async function editProduct(productId) {
  try {
    // Fetch product details
    const response = await apiRequest(`/products/${productId}`);
    const product = response.data;

    // Populate edit form
    document.getElementById("editProductId").value = product.id;
    document.getElementById("editProductName").value = product.name;
    document.getElementById("editProductCategory").value =
      product.category || "";
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductStock").value = product.stock;
    document.getElementById("editProductImage").value = product.image_url || "";
    document.getElementById("editProductDescription").value =
      product.description || "";

    // Show modal
    document.getElementById("editModal").classList.remove("hidden");
  } catch (error) {
    console.error("Error loading product:", error);
    showToast("Failed to load product details", "error");
  }
}

// ========================================
// Save Product Changes
// ========================================
async function saveProductChanges(event) {
  event.preventDefault();

  const productId = document.getElementById("editProductId").value;
  const name = document.getElementById("editProductName").value.trim();
  const category = document.getElementById("editProductCategory").value;
  const price = parseFloat(document.getElementById("editProductPrice").value);
  const stock = parseInt(document.getElementById("editProductStock").value);
  const imageUrl = document.getElementById("editProductImage").value.trim();
  const description = document
    .getElementById("editProductDescription")
    .value.trim();

  // Validate
  if (
    !name ||
    !category ||
    isNaN(price) ||
    price <= 0 ||
    isNaN(stock) ||
    stock < 0
  ) {
    showToast("Please fill in all fields correctly", "error");
    return;
  }

  try {
    const productData = {
      name,
      category,
      price,
      stock,
      image_url: imageUrl || null,
      description: description || null,
    };

    await apiRequest(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });

    showToast("Product updated successfully!", "success");

    // Close modal
    closeEditModal();

    // Reload table
    loadProductsTable();
  } catch (error) {
    console.error("Error updating product:", error);
    showToast(error.message || "Failed to update product", "error");
  }
}

// ========================================
// Delete Product
// ========================================
async function deleteProduct(event, productId, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
    return;
  }

  try {
    await apiRequest(`/products/${productId}`, {
      method: "DELETE",
    });

    showToast("Product deleted successfully!", "success");

    // Fade out and remove row
    const row = event.target.closest("tr");
    if (row) {
      row.classList.add("fade-out");
      setTimeout(() => loadProductsTable(), 300);
    } else {
      loadProductsTable();
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error.message.includes("referenced in existing orders")) {
      showToast(
        "Cannot delete product. It is referenced in existing orders.",
        "error"
      );
    } else {
      showToast(error.message || "Failed to delete product", "error");
    }
  }
}

// ========================================
// Modal Functions
// ========================================
function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  document.getElementById("editProductForm").reset();
}

// ========================================
// Initialize Page
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // Load products table
  loadProductsTable();

  // Navigation
  document.getElementById("navProducts")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("products");
  });

  document.getElementById("navOrders")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("orders");
    loadOrdersTable();
  });

  // Add product form
  document
    .getElementById("addProductForm")
    ?.addEventListener("submit", handleAddProduct);

  // Edit product form
  document
    .getElementById("editProductForm")
    ?.addEventListener("submit", saveProductChanges);

  // Modal controls
  document
    .getElementById("closeModal")
    ?.addEventListener("click", closeEditModal);
  document
    .getElementById("cancelEdit")
    ?.addEventListener("click", closeEditModal);

  // Click outside modal to close
  document.getElementById("editModal")?.addEventListener("click", (e) => {
    if (e.target.id === "editModal") {
      closeEditModal();
    }
  });

  // Refresh button
  document
    .getElementById("refreshBtn")
    ?.addEventListener("click", loadProductsTable);

  // Orders functionality
  document
    .getElementById("refreshOrders")
    ?.addEventListener("click", loadOrdersTable);

  document
    .getElementById("statusFilter")
    ?.addEventListener("change", loadOrdersTable);

  document
    .getElementById("closeOrderModal")
    ?.addEventListener("click", closeOrderModal);

  document
    .getElementById("orderDetailsModal")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "orderDetailsModal") {
        closeOrderModal();
      }
    });

  document
    .getElementById("saveOrderStatus")
    ?.addEventListener("click", updateOrderStatus);
});

// ========================================
// Section Navigation
// ========================================
function showSection(section) {
  // Update nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("bg-blue-600", "text-white");
    link.classList.add("text-gray-700", "hover:bg-gray-100");
  });

  if (section === "products") {
    document
      .getElementById("navProducts")
      ?.classList.remove("text-gray-700", "hover:bg-gray-100");
    document
      .getElementById("navProducts")
      ?.classList.add("bg-blue-600", "text-white");
    document.getElementById("productsSection")?.classList.remove("hidden");
    document.getElementById("ordersSection")?.classList.add("hidden");
  } else if (section === "orders") {
    document
      .getElementById("navOrders")
      ?.classList.remove("text-gray-700", "hover:bg-gray-100");
    document
      .getElementById("navOrders")
      ?.classList.add("bg-blue-600", "text-white");
    document.getElementById("productsSection")?.classList.add("hidden");
    document.getElementById("ordersSection")?.classList.remove("hidden");
  }
}

// ========================================
// Load Orders Table
// ========================================
async function loadOrdersTable() {
  try {
    showLoading("ordersLoading");
    document.getElementById("ordersTableBody").innerHTML = "";
    document.getElementById("ordersEmptyState").classList.add("hidden");

    const statusFilter = document.getElementById("statusFilter")?.value || "";
    const params = statusFilter ? `?status=${statusFilter}` : "";

    const response = await apiRequest(`/orders${params}`);
    const orders = response.data || [];

    hideLoading("ordersLoading");

    if (orders.length === 0) {
      document.getElementById("ordersEmptyState")?.classList.remove("hidden");
    } else {
      const tbody = document.getElementById("ordersTableBody");
      tbody.innerHTML = orders.map((order) => createOrderRow(order)).join("");
    }

    // Update order count
    document.getElementById(
      "orderCount"
    ).textContent = `(${orders.length} orders)`;
  } catch (error) {
    hideLoading("ordersLoading");
    console.error("Error loading orders:", error);
    showToast("Failed to load orders", "error");
  }
}

// ========================================
// Create Order Row
// ========================================
function createOrderRow(order) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusColor = statusColors[order.status] || "bg-gray-100 text-gray-800";

  return `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 font-semibold text-blue-600">#${order.id}</td>
      <td class="px-4 py-3">${order.customer_name}</td>
      <td class="px-4 py-3">${order.email}</td>
      <td class="px-4 py-3 font-semibold">${formatCurrency(
        order.total_amount
      )}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 ${statusColor} text-xs rounded font-medium uppercase">
          ${order.status}
        </span>
      </td>
      <td class="px-4 py-3">${formatDate(order.order_date)}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="viewOrderDetails(${
          order.id
        })" class="text-blue-600 hover:text-blue-800 px-2 py-1">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `;
}

// ========================================
// View Order Details
// ========================================
let currentOrderId = null;

async function viewOrderDetails(orderId) {
  try {
    currentOrderId = orderId;
    const response = await apiRequest(`/orders/${orderId}`);
    const order = response.data;

    const content = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Customer Information</h4>
          <div class="bg-gray-50 p-4 rounded-lg space-y-2">
            <p><span class="font-medium">Name:</span> ${order.customer_name}</p>
            <p><span class="font-medium">Email:</span> ${order.email}</p>
            <p><span class="font-medium">Phone:</span> ${
              order.phone || "N/A"
            }</p>
            <p><span class="font-medium">Address:</span> ${order.address}</p>
          </div>
        </div>
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Order Information</h4>
          <div class="bg-gray-50 p-4 rounded-lg space-y-2">
            <p><span class="font-medium">Order ID:</span> #${order.id}</p>
            <p><span class="font-medium">Date:</span> ${formatDate(
              order.order_date
            )}</p>
            <p><span class="font-medium">Status:</span> <span class="uppercase font-semibold">${
              order.status
            }</span></p>
            <p><span class="font-medium">Total:</span> <span class="text-xl font-bold text-blue-600">${formatCurrency(
              order.total_amount
            )}</span></p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h4 class="font-semibold text-gray-700 mb-3">Order Items</h4>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-600">Product</th>
                <th class="px-4 py-2 text-center text-sm font-semibold text-gray-600">Quantity</th>
                <th class="px-4 py-2 text-right text-sm font-semibold text-gray-600">Price</th>
                <th class="px-4 py-2 text-right text-sm font-semibold text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td class="px-4 py-3 flex items-center gap-3">
                    <img src="${
                      item.product_image || "https://via.placeholder.com/50"
                    }" 
                         alt="${item.product_name}" 
                         class="w-12 h-12 object-cover rounded"
                         onerror="this.src='https://via.placeholder.com/50'">
                    <span>${item.product_name}</span>
                  </td>
                  <td class="px-4 py-3 text-center">${item.quantity}</td>
                  <td class="px-4 py-3 text-right">${formatCurrency(
                    item.price
                  )}</td>
                  <td class="px-4 py-3 text-right font-semibold">${formatCurrency(
                    item.price * item.quantity
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("orderDetailsContent").innerHTML = content;
    document.getElementById("updateOrderStatus").value = order.status;
    document.getElementById("orderDetailsModal").classList.remove("hidden");
  } catch (error) {
    console.error("Error loading order details:", error);
    showToast("Failed to load order details", "error");
  }
}

// ========================================
// Update Order Status
// ========================================
async function updateOrderStatus() {
  if (!currentOrderId) return;

  const newStatus = document.getElementById("updateOrderStatus").value;

  try {
    await apiRequest(`/orders/${currentOrderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    showToast("Order status updated successfully!", "success");
    closeOrderModal();
    loadOrdersTable();
  } catch (error) {
    console.error("Error updating order status:", error);
    showToast(error.message || "Failed to update order status", "error");
  }
}

// ========================================
// Close Order Modal
// ========================================
function closeOrderModal() {
  document.getElementById("orderDetailsModal").classList.add("hidden");
  currentOrderId = null;
}
