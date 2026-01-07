# E-Commerce Application

A full-stack e-commerce application with SQLite database backend.

## Features

- Product management (CRUD operations)
- Order management system
- Shopping cart functionality
- Responsive frontend interface
- RESTful API with Express.js
- SQLite database for data persistence

## Tech Stack

**Backend:**
- Node.js
- Express.js
- SQLite3

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/kawansalah/e-comerse.git
   cd e-comerse
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open the frontend**
   - Open `frontend/index.html` in your browser
   - Or serve it with a local server

The API will be available at `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## Deployment

This application can be deployed to platforms like Render, Railway, or Heroku.

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3000
NODE_ENV=production
DB_PATH=ecommerce.db
```

## Project Structure

```
e-comerse/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── routes/
│   │   ├── products.js
│   │   └── orders.js
│   ├── scripts/
│   │   └── initDatabase.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   └── *.html
├── schema_sqlite.sql
└── README.md
```

## License

ISC
