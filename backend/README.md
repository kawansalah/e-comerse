# E-Commerce Backend API

A RESTful API for an e-commerce platform built with Node.js, Express, and MySQL.

## Features

- ✅ Complete product management (CRUD operations)
- ✅ Order processing with transaction support
- ✅ Automatic stock management
- ✅ Category filtering and product search
- ✅ Order status tracking
- ✅ Comprehensive error handling
- ✅ Database connection pooling

## Tech Stack

- **Backend Framework**: Express.js
- **Database**: MySQL
- **ORM**: mysql2 (with promise support)
- **Middleware**: CORS, body-parser
- **Environment**: dotenv

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
cd e-comerse/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Database Setup

Create the database and tables:
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE ecommerce_db;
USE ecommerce_db;

# Import schema
source ../schema.sql

# Import sample data (optional)
source ../sample_products.sql
```

### 4. Environment Configuration

Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
```

## Running the Server

### Development mode (with auto-restart)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (supports filters) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

**Query Parameters for GET /api/products:**
- `category` - Filter by category (e.g., Electronics, Clothing)
- `search` - Search in product name and description

**Example Requests:**
```bash
# Get all products
curl http://localhost:3000/api/products

# Filter by category
curl http://localhost:3000/api/products?category=Electronics

# Search products
curl http://localhost:3000/api/products?search=wireless
```

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (supports filters) |
| GET | `/api/orders/:id` | Get single order with items |
| POST | `/api/orders` | Create new order |
| PUT | `/api/orders/:id` | Update order status |
| DELETE | `/api/orders/:id` | Delete order (pending/cancelled only) |

**Query Parameters for GET /api/orders:**
- `status` - Filter by status (pending, processing, completed, cancelled)
- `email` - Filter by customer email

**Example: Create Order**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      },
      {
        "product_id": 3,
        "quantity": 1
      }
    ]
  }'
```

## Database Schema

### Products Table
- `id` - Primary key (auto increment)
- `name` - Product name (varchar 255)
- `description` - Product description (text)
- `price` - Price (decimal 10,2)
- `image_url` - Image URL (varchar 500)
- `stock` - Stock quantity (int)
- `category` - Product category (varchar 100)
- `created_at` - Creation timestamp

### Orders Table
- `id` - Primary key (auto increment)
- `customer_name` - Customer name (varchar 255)
- `email` - Customer email (varchar 255)
- `phone` - Phone number (varchar 20)
- `address` - Delivery address (text)
- `total_amount` - Order total (decimal 10,2)
- `order_date` - Order timestamp
- `status` - Order status (enum)

### Order Items Table
- `id` - Primary key (auto increment)
- `order_id` - Foreign key to orders
- `product_id` - Foreign key to products
- `quantity` - Quantity ordered (int)
- `price` - Price at time of order (decimal 10,2)

## Features in Detail

### Automatic Stock Management
When an order is created, the system:
- Validates product availability
- Checks if sufficient stock exists
- Automatically deducts stock quantities
- Rolls back transaction if any item is unavailable

### Order Status Flow
- `pending` - Order created, awaiting processing
- `processing` - Order being prepared
- `completed` - Order delivered
- `cancelled` - Order cancelled

### Error Handling
All endpoints include comprehensive error handling:
- 400 - Bad Request (validation errors)
- 404 - Not Found
- 409 - Conflict (e.g., foreign key violations)
- 500 - Internal Server Error

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection pool
├── routes/
│   ├── products.js        # Product routes
│   └── orders.js          # Order routes
├── .env.example           # Environment template
├── package.json           # Dependencies
└── server.js              # Main server file
```

## Development

### Adding New Routes
1. Create a new route file in `routes/`
2. Import the route in `server.js`
3. Use `app.use('/api/your-route', yourRoute)`

### Database Transactions
For operations involving multiple tables, use transactions:
```javascript
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  // Your queries here
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## Testing

Test the API using:
- **Postman** - Import endpoints and test manually
- **cURL** - Use the example commands above
- **Thunder Client** (VS Code extension)

## Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
Change the PORT in `.env` file to a different port (e.g., 3001)

### Foreign Key Constraints
Cannot delete products that are in orders. Cancel or delete the orders first.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.
