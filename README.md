# Ecommerce REST API

A production-ready Node.js & Express REST API backend for an E-commerce platform, built with MongoDB, Mongoose, JWT Authentication, Materialized-Path Categories, Subtree Product Filtering, and Transactional Order Placement with Atomic Stock Handling.

---

## Technical Design & Key Architectural Decisions

### 1. Unlimited-Depth Category Hierarchy (Materialized-Path)
Categories store a direct `parent` reference along with an ordered `ancestors` array containing all parent IDs from root down to the direct parent. This enables single-query retrieval of full subtrees (`{ ancestors: categoryId }`), fast path re-parenting across descendants, and instant $O(1)$ cycle prevention (`assertNoCycle`).

### 2. Atomic Order Placement & Stock Safety (Mongoose Transactions)
Order placement runs inside a multi-document Mongoose transaction using single-document atomic conditional updates (`Product.updateOne({ _id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`). If any product stock is insufficient (`modifiedCount === 0`), the transaction throws a `409 Conflict` and aborts—automatically reverting all stock decrements across the entire cart.

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **MongoDB**: `v6.0.0` or higher configured as a **Replica Set** (required for Mongoose Transactions).

### Initializing a Single-Node Local Replica Set for MongoDB
If running MongoDB locally without a replica set cluster, start `mongod` with the `--replSet` flag and initialize:

```bash
# 1. Start MongoDB with replica set flag
mongod --replSet rs0 --dbpath /data/db

# 2. In a mongo shell (mongosh), run once:
rs.initiate()
```

---

## Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   - `PORT`: HTTP server port (e.g. `5000`).
   - `NODE_ENV`: Application mode (`development`, `production`, `test`).
   - `MONGO_URI`: MongoDB connection string with replica set (e.g. `mongodb://localhost:27017/ecommerce_db`).
   - `JWT_SECRET`: Secret key used to sign and verify JSON Web Tokens.
   - `JWT_EXPIRES_IN`: JWT expiration timeframe (e.g. `7d`).

---

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Seed Initial Admin User**:
   Run the seed utility script to create the initial super-admin user account:
   ```bash
   npm run seed
   ```
   *Default Admin Credentials:*
   - **Email**: `admin@example.com`
   - **Password**: `Admin@123456`

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Start Production Server**:
   ```bash
   npm start
   ```

5. **Run Integration Tests**:
   ```bash
   npm test
   ```

---

## Interactive API Documentation (Swagger / OpenAPI)

Once the server is running, access the interactive Swagger OpenAPI UI documentation at:

- **Swagger Documentation UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

Includes schemas, endpoint parameters, and request/response examples for:
- `POST /api/auth/register` & `POST /api/auth/login`
- `GET /api/users/me`, `PUT /api/users/me`, `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`
- `GET /api/categories`, `GET /api/categories/tree`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
- `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- `POST /api/orders`, `GET /api/orders/my`, `GET /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`

---

## Security & Operational Hardening

- **Rate Limiting**: Global rate limiter (100 requests / 15 min) and strict auth rate limiter (10 requests / 15 min) via `express-rate-limit`.
- **Security Headers**: HTTP security headers injected via `helmet`.
- **Request Logging**: Morgan HTTP logger piped to structured `winston` loggers (Console in dev, Console + `logs/` file transports in production).
- **Centralized Error Handling**: Unified `ApiError` format stripping stack traces in production.