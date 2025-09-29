# Food Ordering Backend API

A NestJS backend API for a restaurant food ordering system with QR code-based table sessions, real-time order management, and comprehensive menu management.

## Features

- 🍽️ **Menu Management** - CRUD operations with soft delete support
- 📱 **QR Code Sessions** - Table-based ordering system
- 📋 **Order Management** - Real-time order tracking and status updates
- 💰 **Billing System** - Automated bill generation and payment tracking
- 🔒 **Authentication** - JWT-based staff authentication
- 🏪 **Table Management** - Dynamic table configuration
- 🗑️ **Soft Delete** - Reversible deletion for menu items and sessions

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Real-time**: WebSocket Gateway
- **API Documentation**: RESTful endpoints

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or pnpm

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd food_ordering_backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials.

4. **Database Setup**
   ```bash
   # Push schema to database
   npx prisma db push

   # Generate Prisma client
   npx prisma generate

   # (Optional) Seed database with sample data
   npx prisma db seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   pnpm run start:dev

   # Production mode
   pnpm run start:prod
   ```

The server will start on `http://localhost:3000`

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (⚠️ This will delete all data)
npx prisma db push --reset

# Apply schema changes
npx prisma db push
```

## API Endpoints

### 🏪 Tables Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/tables` | Create a new table |
| GET    | `/tables` | Get all tables |
| GET    | `/tables/:id` | Get specific table |
| PATCH  | `/tables/:id/status` | Update table status |
| GET    | `/tables/:id/qr` | Get QR code for table |

**Example Usage:**
```bash
# Get all tables
curl -X GET http://localhost:3000/tables

# Create a table
curl -X POST http://localhost:3000/tables \
  -H "Content-Type: application/json" \
  -d '{"tableNumber": 1, "capacity": 4}'
```

### 📱 Sessions Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/sessions` | Create session from QR code |
| GET    | `/sessions/:id/orders` | Get orders for session |
| DELETE | `/sessions/:id` | Soft delete session |

**Example Usage:**
```bash
# Create session from QR code
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"qrCodeToken": "table-1-token-abc123"}'

# Get orders for session
curl -X GET http://localhost:3000/sessions/session-uuid/orders

# Soft delete session
curl -X DELETE http://localhost:3000/sessions/session-uuid
```

### 🍽️ Menu Management

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET    | `/menu` | Get all menu items | `?onlyAvailable=true&includeDeleted=false` |
| GET    | `/menu/:id` | Get specific menu item | - |
| POST   | `/menu` | Create new menu item | - |
| PATCH  | `/menu/:id` | Update menu item | - |
| DELETE | `/menu/:id` | Soft delete menu item | - |

**Example Usage:**
```bash
# Get available menu items only
curl -X GET "http://localhost:3000/menu?onlyAvailable=true"

# Create menu item
curl -X POST http://localhost:3000/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pad Thai",
    "price": 12.99,
    "description": "Traditional Thai stir-fried noodles",
    "foodtype": "Main Course"
  }'

# Update menu item
curl -X PATCH http://localhost:3000/menu/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 13.99, "isAvailable": true}'

# Soft delete menu item
curl -X DELETE http://localhost:3000/menu/1
```

### 📋 Orders Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/orders` | Create new order |
| GET    | `/orders/queue` | Get order queue |
| GET    | `/orders/:id` | Get specific order |
| PATCH  | `/orders/:id/status` | Update order status |

**Order Status Values:** `PENDING` | `IN_PROGRESS` | `DONE` | `CANCELLED`

**Example Usage:**
```bash
# Create order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-uuid",
    "tableId": 1,
    "items": [
      {
        "menuItemId": 1,
        "quantity": 2,
        "note": "Extra spicy"
      }
    ]
  }'

# Update order status
curl -X PATCH http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'

# Get order queue
curl -X GET http://localhost:3000/orders/queue
```

### 💰 Bills Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/bills` | Create bill for table |
| GET    | `/bills/:id` | Get specific bill |
| PATCH  | `/bills/:id/pay` | Mark bill as paid |

**Example Usage:**
```bash
# Create bill
curl -X POST http://localhost:3000/bills \
  -H "Content-Type: application/json" \
  -d '{"tableId": 1}'

# Mark bill as paid
curl -X PATCH http://localhost:3000/bills/1/pay
```

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/login` | Staff login |
| POST   | `/users/staff` | Create staff account |
| GET    | `/users` | Get all users |
| GET    | `/users/:id` | Get specific user |

**Example Usage:**
```bash
# Staff login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staff@restaurant.com", "password": "password123"}'

# Create staff account
curl -X POST http://localhost:3000/users/staff \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@restaurant.com",
    "password": "password123"
  }'
```

## Data Models

### Menu Item
```typescript
{
  id: number
  name: string
  price: number
  description?: string
  foodtype?: string // "Main Course" | "Noodle" | "Beverage" | "Dessert"
  isAvailable: boolean
  deletedAt?: Date // Soft delete timestamp
}
```

### Session
```typescript
{
  id: string // UUID
  tableId: number
  createdAt: Date
  expiresAt?: Date
  deletedAt?: Date // Soft delete timestamp
  metaJson?: object // Device info, etc.
}
```

### Order
```typescript
{
  id: number
  tableId: number
  sessionId?: string
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  orderItems: OrderItem[]
  createdAt: Date
  updatedAt: Date
}
```

### Order Item
```typescript
{
  id: number
  orderId: number
  menuItemId: number
  quantity: number
  note?: string
}
```

## QR Code Session Flow

1. **Customer scans QR code** at table
2. **Frontend calls** `POST /sessions` with `qrCodeToken`
3. **Backend creates session** linked to table
4. **Customer browses menu** and places orders
5. **Orders are linked** to the session
6. **Multiple customers** can join same table session
7. **Session can be deleted** to close table

## Soft Delete Feature

Both menu items and sessions support soft delete:

- **Soft Delete**: Sets `deletedAt` timestamp, hides from normal queries
- **Data Preserved**: Original data remains in database
- **Filtered Queries**: Deleted items excluded from API responses
- **Restore Option**: Can be restored by setting `deletedAt` to `null`

## WebSocket Events

The API includes WebSocket support for real-time updates:

- **join_table**: Join table room for order updates
- **join_staff**: Join staff room for kitchen notifications

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | 3000 |

## Development

```bash
# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Format code
pnpm run format

# Lint code
pnpm run lint
```

## Project Structure

```
src/
├── auth/           # Authentication module
├── bills/          # Bills management
├── menu/           # Menu items CRUD
├── orders/         # Order management
├── prisma/         # Database service
├── sessions/       # QR code sessions
├── sockets/        # WebSocket gateway
├── tables/         # Table management
├── users/          # User management
└── main.ts         # Application entry point
```

## License

This project is licensed under the MIT License.
