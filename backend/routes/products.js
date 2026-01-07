// ========================================
// Products Route Handler
// ========================================
// Handles all product-related API endpoints

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ========================================
// GET /api/products
// ========================================
/**
 * Fetches all products from the database with optional filtering
 * 
 * Query Parameters:
 * - category (optional): Filter products by category
 * - search (optional): Search in product name and description
 * 
 * Returns: Array of products sorted by created_at (newest first)
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters
    const { category, search } = req.query;

    // Build dynamic SQL query
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Add category filter if provided
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Add search filter if provided (search in name and description)
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Sort by created_at (newest first)
    query += ' ORDER BY created_at DESC';

    // Execute query
    const [products] = await pool.query(query, params);

    // Return successful response
    res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error fetching products:', error.message);

    // Return error response
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// GET /api/products/:id
// ========================================
/**
 * Fetches a single product by ID
 * 
 * URL Parameters:
 * - id: Product ID
 * 
 * Returns: Single product object
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    // Fetch product by ID
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    // Check if product exists
    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Return successful response
    res.status(200).json({
      status: 'success',
      data: products[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// POST /api/products
// ========================================
/**
 * Creates a new product
 * 
 * Request Body:
 * - name (required): Product name
 * - description: Product description
 * - price (required): Product price
 * - image_url: Product image URL
 * - stock (required): Stock quantity
 * - category: Product category
 * 
 * Returns: Created product with ID
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image_url, stock, category } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, price, and stock are required'
      });
    }

    // Insert product into database
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image_url, stock, category) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, price, image_url || null, stock, category || null]
    );

    // Fetch the created product
    const [newProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    // Return successful response
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: newProduct[0]
    });

  } catch (error) {
    console.error('Error creating product:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// PUT /api/products/:id
// ========================================
/**
 * Updates an existing product
 * 
 * URL Parameters:
 * - id: Product ID
 * 
 * Request Body: Fields to update
 * 
 * Returns: Updated product
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, stock, category } = req.body;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    // Check if product exists
    const [existingProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Update product
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, stock = ?, category = ? WHERE id = ?',
      [name, description, price, image_url, stock, category, id]
    );

    // Fetch updated product
    const [updatedProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: updatedProduct[0]
    });

  } catch (error) {
    console.error('Error updating product:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================
// DELETE /api/products/:id
// ========================================
/**
 * Deletes a product by ID
 * 
 * URL Parameters:
 * - id: Product ID
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
        message: 'Invalid product ID'
      });
    }

    // Check if product exists
    const [existingProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Delete product
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error.message);

    // Check if it's a foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        status: 'error',
        message: 'Cannot delete product. It is referenced in existing orders.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
