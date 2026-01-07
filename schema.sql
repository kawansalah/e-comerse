-- ========================================
-- E-Commerce Database Schema
-- ========================================

Create database (optional - uncomment if needed)
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- ========================================
-- Table: products
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: orders
-- ========================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,w
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    
    -- Indexes for better query performance
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: order_items
-- ========================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) 
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) 
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Indexes for foreign keys and queries
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Sample Data (Optional)
-- ========================================

-- Insert sample products
-- INSERT INTO products (name, description, price, image_url, stock, category) VALUES
-- ('Laptop Pro 15"', 'High-performance laptop with 16GB RAM', 1299.99, 'https://example.com/laptop.jpg', 50, 'Electronics'),
-- ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 'https://example.com/mouse.jpg', 200, 'Accessories'),
-- ('USB-C Cable', 'Durable USB-C charging cable 2m', 12.99, 'https://example.com/cable.jpg', 500, 'Accessories');

-- Insert sample orders
-- INSERT INTO orders (customer_name, email, phone, address, total_amount, status) VALUES
-- ('John Doe', 'john.doe@example.com', '+1234567890', '123 Main St, City, State 12345', 1342.97, 'completed'),
-- ('Jane Smith', 'jane.smith@example.com', '+0987654321', '456 Oak Ave, Town, State 67890', 29.99, 'processing');

-- Insert sample order items
-- INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
-- (1, 1, 1, 1299.99),
-- (1, 3, 2, 12.99),
-- (1, 2, 1, 29.99),
-- (2, 2, 1, 29.99);
