// ========================================
// Orders Route Handler
// ========================================
// Handles all order-related API endpoints

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ========================================
// GET /api/orders
// ========================================
/**
 * Fetches all orders from the database with optional filtering
 * 
 * Query Parameters:
 * - status (optional): Filter orders by status (pending, processing, completed, cancelled)
 * - email (optional): Filter orders by customer email
 * 
 * Returns: Array of orders sorted by order_date (newest first)
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters
    const { status, email } = req.query;

    // Build dynamic SQL query
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    // Add status filter if provided
    if (status) {
      // Validate status value
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status value. Must be one of: pending, processing, completed, cancelled'
        });
      }
      query += ' AND status = ?';
      params.push(status);
    }

    // Add email filter if provided
    if (email) {
      query += ' AND email = ?';
      params.push(email);
    }

    // Sort by order_date (newest first)
    query += ' ORDER BY order_date DESC';

    // Execute query
    const [orders] = await pool.query(query, params);

    // Return successful response
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// GET /api/orders/:id
// ========================================
/**
 * Fetches a single order by ID with all order items and product details
 * 
 * URL Parameters:
 * - id: Order ID
 * 
 * Returns: Order object with nested order items array
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    // Fetch order by ID
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    // Check if order exists
    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Fetch order items with product details
    const [orderItems] = await pool.query(
      `SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        p.id as product_id,
        p.name as product_name,
        p.image_url as product_image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [id]
    );

    // Combine order with items
    const orderWithItems = {
      ...orders[0],
      items: orderItems
    };

    // Return successful response
    res.status(200).json({
      status: 'success',
      data: orderWithItems
    });

  } catch (error) {
    console.error('Error fetching order:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// POST /api/orders
// ========================================
/**
 * Creates a new order with order items
 * 
 * Request Body:
 * - customer_name (required): Customer name
 * - email (required): Customer email
 * - phone: Customer phone number
 * - address (required): Customer address
 * - items (required): Array of order items
 *   - product_id: Product ID
 *   - quantity: Quantity
 * 
 * Returns: Created order with all details
 */
router.post('/', async (req, res) => {
  // Start a transaction connection
  const connection = await pool.getConnection();
  
  try {
    const { customer_name, email, phone, address, items } = req.body;

    // Validate required fields
    if (!customer_name || !email || !address) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: customer_name, email, and address are required'
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order must contain at least one item'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Calculate total amount and validate products
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Each item must have a valid product_id and quantity'
        });
      }

      // Fetch product details and check stock
      const [products] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ?',
        [item.product_id]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          status: 'error',
          message: `Product with ID ${item.product_id} not found`
        });
      }

      const product = products[0];

      // Check if enough stock is available
      if (product.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });

      // Update product stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, email, phone, address, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, email, phone || null, address, totalAmount, 'pending']
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of validatedItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Commit transaction
    await connection.commit();

    // Fetch the complete order with items
    const [newOrder] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    const [orderItems] = await pool.query(
      `SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        p.id as product_id,
        p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    // Return successful response
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        ...newOrder[0],
        items: orderItems
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Error creating order:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Release connection back to pool
    connection.release();
  }
});

// ========================================
// PUT /api/orders/:id
// ========================================
/**
 * Updates an order status
 * 
 * URL Parameters:
 * - id: Order ID
 * 
 * Request Body:
 * - status (required): New order status (pending, processing, completed, cancelled)
 * 
 * Returns: Updated order
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: pending, processing, completed, cancelled'
      });
    }

    // Check if order exists
    const [existingOrder] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (existingOrder.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Update order status
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    // Fetch updated order
    const [updatedOrder] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: updatedOrder[0]
    });

  } catch (error) {
    console.error('Error updating order:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to update order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// DELETE /api/orders/:id
// ========================================
/**
 * Deletes an order and its items (only if status is 'pending' or 'cancelled')
 * 
 * URL Parameters:
 * - id: Order ID
 * 
 * Returns: Success message
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    // Check if order exists
    const [existingOrder] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (existingOrder.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if order can be deleted (only pending or cancelled orders)
    if (!['pending', 'cancelled'].includes(existingOrder[0].status)) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete order. Only pending or cancelled orders can be deleted.'
      });
    }

    // Delete order (order_items will be deleted automatically due to CASCADE)
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);

    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
