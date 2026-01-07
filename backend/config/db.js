// ========================================
// SQLite Database Connection Configuration
// ========================================
// This module creates and manages a SQLite database connection
// for efficient database operations with async/await support

// Import sqlite3 with verbose mode for debugging
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// ========================================
// Database Configuration
// ========================================
// SQLite database file path (stored in backend directory)
const dbPath = path.join(
  __dirname,
  "..",
  process.env.DB_PATH || "ecommerce.db"
);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// ========================================
// Create Database Connection
// ========================================
let db;

try {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("✗ Failed to connect to SQLite database:", err.message);
      process.exit(1);
    } else {
      console.log("✓ SQLite database connection established successfully");
      console.log(`  Database location: ${dbPath}`);

      // Enable foreign keys
      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          console.error("Warning: Failed to enable foreign keys:", err.message);
        }
      });
    }
  });
} catch (error) {
  console.error("✗ Failed to create SQLite database:", error.message);
  process.exit(1); // Exit if database creation fails
}

// ========================================
// Promise Wrapper for SQLite
// ========================================
// Wrapper object to provide promise-based query method similar to MySQL pool
const pool = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // Return in MySQL format: [rows, fields]
            resolve([rows, null]);
          }
        });
      }
      // For INSERT queries
      else if (sql.trim().toUpperCase().startsWith("INSERT")) {
        db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            // Return result with insertId and affectedRows
            resolve([
              { insertId: this.lastID, affectedRows: this.changes },
              null,
            ]);
          }
        });
      }
      // For UPDATE, DELETE queries
      else {
        db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            // Return result with affectedRows
            resolve([{ affectedRows: this.changes }, null]);
          }
        });
      }
    });
  },

  // Execute method for running SQL without returning results
  execute: function (sql, params = []) {
    return this.query(sql, params);
  },
};

// ========================================
// Test Database Connection
// ========================================
/**
 * Tests the database connection by executing a simple query
 * @returns {Promise<boolean>} Returns true if connection is successful
 */
const testConnection = async () => {
  try {
    console.log("Testing database connection...");

    // Execute a simple query to verify connection
    const [rows] = await pool.query("SELECT 1 + 1 AS result");

    console.log("✓ Database connection test successful");
    console.log(`✓ Using SQLite database at: ${dbPath}`);

    return true;
  } catch (error) {
    console.error("✗ Database connection test failed:", error.message);
    console.error("  Please check your database configuration");
    return false;
  }
};

// ========================================
// Graceful Shutdown Handler
// ========================================
/**
 * Closes the database connection gracefully
 * Should be called when shutting down the application
 */
const closePool = async () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("✗ Error closing SQLite database:", err.message);
        reject(err);
      } else {
        console.log("✓ SQLite database connection closed successfully");
        resolve();
      }
    });
  });
};

// Handle application termination
process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});

// ========================================
// Exports
// ========================================
module.exports = {
  pool, // Export the database connection wrapper for queries
  db, // Export raw database connection
  testConnection, // Export function to test database connectivity
  closePool, // Export function to close database gracefully
};
