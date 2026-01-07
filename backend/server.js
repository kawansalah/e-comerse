// ========================================
// Express Server Configuration
// ========================================
// Main server file for the E-Commerce API
// Handles routing, middleware, and server initialization

// ========================================
// Required Dependencies
// ========================================
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load environment variables from .env file

// Import database connection and test function
const { testConnection } = require("./config/db");

// Import route handlers
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

// ========================================
// Initialize Express App
// ========================================
const app = express();
const PORT = process.env.PORT || 4000;

// ========================================
// Middleware Configuration
// ========================================

// Enable CORS for all origins
// In production, consider restricting to specific origins
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies
app.use(bodyParser.json());

// Parse URL-encoded request bodies (form data)
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the frontend directory
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// Routes
// ========================================

// Root route - Server status check
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "E-Commerce API Server is running",
    version: "1.0.0",
    endpoints: {
      products: "/api/products",
      orders: "/api/orders",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// 404 Handler - Route not found
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: ["/api/products", "/api/orders"],
  });
});

// ========================================
// Global Error Handling Middleware
// ========================================
// This middleware catches all errors thrown in the application
app.use((err, req, res, next) => {
  // Log error details for debugging
  console.error("Error occurred:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  // Determine status code (default to 500 if not specified)
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Include stack trace in development
  });
});

// ========================================
// Server Initialization
// ========================================
/**
 * Starts the Express server and tests database connection
 */
const startServer = async () => {
  try {
    // Test database connection before starting server
    console.log("\n🔍 Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("\n❌ Failed to connect to database. Server not started.");
      console.error("   Please check your database configuration in .env file");
      process.exit(1);
    }

    // Start the Express server
    app.listen(PORT, () => {
      console.log("\n✓ Server started successfully");
      console.log(`✓ Server is running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("\n📍 Available endpoints:");
      console.log(`   GET    http://localhost:${PORT}/`);
      console.log(`   GET    http://localhost:${PORT}/api/products`);
      console.log(`   POST   http://localhost:${PORT}/api/products`);
      console.log(`   GET    http://localhost:${PORT}/api/orders`);
      console.log(`   POST   http://localhost:${PORT}/api/orders`);
      console.log("\nPress Ctrl+C to stop the server\n");
    });
  } catch (error) {
    console.error("\n❌ Error starting server:", error.message);
    process.exit(1);
  }
};

// ========================================
// Graceful Shutdown
// ========================================
// Handle graceful shutdown on SIGTERM and SIGINT
const gracefulShutdown = () => {
  console.log("\n\n🛑 Received shutdown signal, closing server gracefully...");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// ========================================
// Start the server
// ========================================
startServer();

// Export app for testing purposes
module.exports = app;
