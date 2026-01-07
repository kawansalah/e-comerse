// ========================================
// Database Initialization Script
// ========================================
// This script initializes the SQLite database with schema and sample data

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// ========================================
// Configuration
// ========================================
const dbPath = path.join(__dirname, '..', 'ecommerce.db');
const schemaPath = path.join(__dirname, '..', '..', 'schema_sqlite.sql');
const sampleDataPath = path.join(__dirname, '..', '..', 'sample_products.sql');

console.log('========================================');
console.log('Database Initialization');
console.log('========================================');
console.log(`Database path: ${dbPath}`);
console.log(`Schema file: ${schemaPath}`);
console.log('');

// ========================================
// Delete existing database
// ========================================
if (fs.existsSync(dbPath)) {
  console.log('⚠ Existing database found. Deleting...');
  fs.unlinkSync(dbPath);
  console.log('✓ Old database deleted');
}

// ========================================
// Create new database
// ========================================
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('✗ Error creating database:', err.message);
    process.exit(1);
  }
  console.log('✓ New database created');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('✗ Error enabling foreign keys:', err.message);
  } else {
    console.log('✓ Foreign keys enabled');
  }
});

// ========================================
// Read and execute schema
// ========================================
console.log('\nInitializing schema...');

if (!fs.existsSync(schemaPath)) {
  console.error('✗ Schema file not found:', schemaPath);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema using serialize to ensure sequential execution
db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) {
      console.error('✗ Error executing schema:', err.message);
      process.exit(1);
    } else {
      console.log('✓ Schema initialized successfully');
      
      // ========================================
      // Insert sample data (optional)
      // ========================================
      insertSampleData();
    }
  });
});

// ========================================
// Insert sample data function
// ========================================
function insertSampleData() {
  console.log('\nInserting sample data...');
  
  const sampleProducts = [
    {
      name: 'Laptop Pro 15"',
      description: 'High-performance laptop with 16GB RAM and 512GB SSD',
      price: 1299.99,
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      stock: 50,
      category: 'Electronics'
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with USB receiver',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
      stock: 200,
      category: 'Accessories'
    },
    {
      name: 'USB-C Cable',
      description: 'Durable USB-C charging cable 2m',
      price: 12.99,
      image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400',
      stock: 500,
      category: 'Accessories'
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB backlit mechanical keyboard with blue switches',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
      stock: 75,
      category: 'Accessories'
    },
    {
      name: '27" 4K Monitor',
      description: 'Ultra HD 4K monitor with HDR support',
      price: 449.99,
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
      stock: 30,
      category: 'Electronics'
    },
    {
      name: 'Wireless Headphones',
      description: 'Noise-cancelling Bluetooth headphones',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      stock: 100,
      category: 'Electronics'
    }
  ];

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, image_url, stock, category) VALUES (?, ?, ?, ?, ?, ?)'
  );

  let insertedCount = 0;
  sampleProducts.forEach((product) => {
    insertProduct.run(
      product.name,
      product.description,
      product.price,
      product.image_url,
      product.stock,
      product.category,
      (err) => {
        if (err) {
          console.error('✗ Error inserting product:', err.message);
        } else {
          insertedCount++;
          if (insertedCount === sampleProducts.length) {
            insertProduct.finalize();
            console.log(`✓ Sample data inserted (${insertedCount} products)`);
            
            // Close database
            db.close((err) => {
              if (err) {
                console.error('✗ Error closing database:', err.message);
              } else {
                console.log('\n========================================');
                console.log('✓ Database initialization complete!');
                console.log('========================================');
                console.log('\nYou can now start the server with:');
                console.log('  npm start');
                console.log('');
              }
            });
          }
        }
      }
    );
  });
}
