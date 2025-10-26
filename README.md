# 🍽️ Food Ordering Backend API

A comprehensive NestJS backend API for a restaurant food ordering system with QR code-based table sessions, real-time order management, Google OAuth authentication, and Cloudinary image upload integration.

## ✨ Features

- 🍽️ **Menu Management** - CRUD operations with image upload and soft delete
- 📱 **QR Code Sessions** - Table-based ordering system with session management
- 📋 **Order Management** - Real-time order tracking and status updates
- 💰 **Billing System** - Automated bill generation and payment tracking
- 🔒 **Authentication** - JWT-based staff authentication with Google OAuth
- 🏪 **Table Management** - Dynamic table configuration and QR generation
- 🖼️ **Image Upload** - Cloudinary integration for menu item images
- 🔌 **Real-time** - WebSocket gateway for live updates
- 🗑️ **Soft Delete** - Reversible deletion for data integrity

## 🛠️ Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with HTTP-only cookies
- **OAuth**: Google OAuth 2.0 integration
- **Real-time**: Socket.io WebSocket gateway
- **File Upload**: Cloudinary integration
- **Validation**: class-validator and class-transformer
- **API Documentation**: RESTful endpoints with proper error handling

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm/pnpm
- Cloudinary account (for image uploads)
- Google OAuth credentials (optional)

### Installation

1. **Navigate to the project**
   ```bash
   cd customer-ordering-backend/food_ordering_backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   **Required Environment Variables:**
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/food_ordering"

   # JWT
   JWT_SECRET="your-super-secret-jwt-key"

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

   # Frontend URLs
   FRONTEND_URL="http://localhost:5174"
   ADMIN_URL="http://localhost:5176"
   BACKEND_URL="http://localhost:3000"

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **Database Setup**
   ```bash
   # Push schema to database
   npx prisma db push

   # Generate Prisma client
   npx prisma generate

   # Seed database with initial data
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run start:prod
   ```

The server will start on `http://localhost:3000`

## 📊 Database Seeding

The seed script creates:
- **10 tables** with QR code tokens
- **Admin user** (admin@restaurant.com / admin123)
- **Sample menu items** (optional)

```bash
npm run seed
```

## 🌐 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/login` | Staff login with email/password |
| GET    | `/auth/google` | Google OAuth login |
| GET    | `/auth/google/callback` | Google OAuth callback |
| POST   | `/auth/logout` | Clear authentication cookies |

**Login Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "admin123"
  }'
```

### 👥 Users Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/users/staff` | Create staff account |
| GET    | `/users` | Get all users |
| GET    | `/users/:id` | Get specific user |

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
# Create a table
curl -X POST http://localhost:3000/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 1,
    "capacity": 4,
    "status": "AVAILABLE"
  }'

# Get QR code for table
curl -X GET http://localhost:3000/tables/1/qr
```

### 📱 Sessions Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/sessions` | Create session from QR code |
| GET    | `/sessions/:id` | Get session details |
| GET    | `/sessions/:id/orders` | Get orders for session |
| DELETE | `/sessions/:id` | Soft delete session |

**Example Usage:**
```bash
# Create session from QR code
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "qrCodeToken": "table-1-token-abc123"
  }'
```

### 🍽️ Menu Management

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET    | `/menu` | Get all menu items | `?onlyAvailable=true&includeDeleted=false` |
| GET    | `/menu/:id` | Get specific menu item | - |
| POST   | `/menu` | Create new menu item with image | - |
| PATCH  | `/menu/:id` | Update menu item | - |
| DELETE | `/menu/:id` | Soft delete menu item | - |

**Create Menu Item with Image:**
```bash
curl -X POST http://localhost:3000/menu \
  -F "name=Pad Thai" \
  -F "price=12.99" \
  -F "description=Traditional Thai stir-fried noodles" \
  -F "foodtype=Main Course" \
  -F "image=@path/to/image.jpg"
```

### 📋 Orders Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/orders` | Create new order |
| GET    | `/orders/queue` | Get order queue for staff |
| GET    | `/orders/:id` | Get specific order |
| PATCH  | `/orders/:id/status` | Update order status |

**Order Status Values:** `PENDING` | `IN_PROGRESS` | `DONE` | `CANCELLED`

**Create Order:**
```bash
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
```

### 💰 Bills Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/bills` | Create bill for table |
| GET    | `/bills/:id` | Get specific bill |
| PATCH  | `/bills/:id/pay` | Mark bill as paid |

### 🖼️ Image Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/upload/image` | Upload image to Cloudinary |

**Upload Image:**
```bash
curl -X POST http://localhost:3000/upload/image \
  -F "file=@path/to/image.jpg"
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "uploads/abc123",
  "width": 800,
  "height": 600,
  "bytes": 102400,
  "format": "jpg"
}
```

## 📊 Data Models

### Menu Item
```typescript
{
  id: number
  name: string
  price: number
  description?: string
  foodtype?: string // "Main Course" | "Noodle" | "Beverage" | "Dessert"
  imageUrl?: string
  isAvailable: boolean
  deletedAt?: Date // Soft delete timestamp
  createdAt: Date
  updatedAt: Date
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

### User (Staff)
```typescript
{
  id: number
  email: string
  name: string
  role: "STAFF" | "ADMIN"
  provider?: "LOCAL" | "GOOGLE"
  createdAt: Date
  updatedAt: Date
}
```

## 🔌 WebSocket Events

The API includes real-time WebSocket support:

### **Client → Server Events**
- **join_table** - Join table room for customer updates
- **join_staff** - Join staff room for kitchen notifications

### **Server → Client Events**
- **order_created** - New order notification to staff
- **order_updated** - Order status change to customers
- **table_updated** - Table status change

**Example WebSocket Usage:**
```javascript
// Customer joining table room
socket.emit('join_table', { tableId: 1 });

// Staff joining staff room
socket.emit('join_staff');

// Listen for order updates
socket.on('order_updated', (order) => {
  console.log('Order status changed:', order);
});
```

## 🗑️ Soft Delete Feature

Menu items and sessions support soft delete for data integrity:

- **Soft Delete**: Sets `deletedAt` timestamp
- **Data Preserved**: Original data remains in database
- **Filtered Queries**: Deleted items excluded by default
- **Restore Option**: Can be restored by setting `deletedAt` to `null`

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **CORS Configuration** for frontend domains
- **Rate Limiting** (configurable)
- **Input Validation** with class-validator
- **SQL Injection Protection** via Prisma ORM
- **XSS Protection** with proper sanitization

## 🧪 Development

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint

# Database management
npx prisma studio          # View database in browser
npx prisma db push --reset  # Reset database (⚠️ Deletes all data)
```

## 📁 Project Structure

```
src/
├── auth/              # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── guards/        # OAuth guards
├── bills/             # Bills management
├── cloudinary/        # Cloudinary service
├── menu/              # Menu items CRUD
├── orders/            # Order management
├── prisma/            # Database service
├── sessions/          # QR code sessions
├── sockets/           # WebSocket gateway
├── tables/            # Table management
├── upload/            # File upload handling
├── users/             # User management
└── main.ts            # Application entry point
```

## 🌍 Environment Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ | - |
| `FRONTEND_URL` | Customer frontend URL | ✅ | http://localhost:5174 |
| `ADMIN_URL` | Staff frontend URL | ✅ | http://localhost:5176 |
| `PORT` | Server port | ❌ | 3000 |

## 🐳 Docker Support

The project includes Docker support with multi-stage builds:

```bash
# Build image
docker build -t food-ordering-backend .

# Run with docker-compose
docker-compose up -d
```

## 📄 License

This project is part of a university full-stack development course (Group 12).

---

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Prisma Client Issues**
   - Run `npx prisma generate`
   - Clear node_modules and reinstall

3. **Image Upload Failures**
   - Verify Cloudinary credentials
   - Check file size limits (default: 10MB)
   - Ensure allowed file types

4. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check cookie settings for HTTPS
   - Confirm Google OAuth URLs

For more help, check the logs or create an issue in the project repository.