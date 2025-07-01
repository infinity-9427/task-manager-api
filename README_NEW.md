# Task Manager API

A comprehensive task management API with real-time features, built with Node.js, TypeScript, PostgreSQL, and Socket.IO.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- Cloudinary account (for image uploads)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd task-manager-api
pnpm install
```

2. **Environment Setup:**
```bash
cp .env.example .env
# Edit .env with your database and API keys
```

3. **Database Setup:**
```bash
npx prisma generate
npx prisma db push
```

4. **Start Development Server:**
```bash
pnpm run dev
```

The API will be available at `http://localhost:3200`

## 📖 Documentation

- **API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Interactive Docs:** `http://localhost:3200/api-docs` (Swagger UI)
- **API Info:** `http://localhost:3200/api`

## 🔗 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (with pagination & filtering)
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Messaging
- `GET /api/messaging/conversations` - Get conversations
- `POST /api/messaging/conversations` - Create conversation
- `GET /api/messaging/conversations/{id}/messages` - Get messages
- `POST /api/messaging/conversations/{id}/messages` - Send message
- `POST /api/messaging/conversations/{id}/participants` - Add participants
- `DELETE /api/messaging/conversations/{id}/leave` - Leave conversation

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/{id}/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

### Analytics
- `GET /api/analytics/dashboard` - User dashboard
- `GET /api/analytics/admin-dashboard` - Admin dashboard
- `GET /api/analytics/project/{id}` - Project analytics

## ✨ Features

- **🔐 JWT Authentication** - Secure token-based auth with refresh tokens
- **👥 User Management** - Complete user CRUD with roles and permissions
- **📋 Task Management** - Full task lifecycle with priorities and status tracking
- **💬 Real-time Messaging** - Socket.IO powered chat system
- **📊 Analytics Dashboard** - Comprehensive user and admin analytics
- **🔔 Notifications** - Real-time notification system
- **📁 File Uploads** - Cloudinary integration for images
- **🛡️ Security** - Rate limiting, CORS, password hashing (bcrypt)
- **📖 Documentation** - Complete API docs with Swagger UI

## 🔧 Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with Passport.js
- **Real-time:** Socket.IO
- **File Storage:** Cloudinary
- **Validation:** Joi
- **Security:** bcrypt, helmet, rate limiting
- **Documentation:** Swagger/OpenAPI

## 🛡️ Security Features

- **Password Security:** bcrypt hashing with 12 salt rounds
- **Strong Password Requirements:** Uppercase, lowercase, numbers required
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **CORS Protection:** Configured for specific origins
- **Input Validation:** Comprehensive Joi validation
- **JWT Security:** Secure token handling with refresh tokens
- **No Password Exposure:** Passwords never returned in API responses

## 📱 Real-time Features

Socket.IO events for real-time updates:
- **Client Events:** join_conversation, send_message, typing_start/stop
- **Server Events:** message_received, notification_received, user_status_changed

## 🏗️ Project Structure

```
src/
├── controllers/     # Route handlers
├── routes/         # API route definitions
├── utils/          # Utility functions & middleware
├── config/         # Configuration files
├── helpers/        # Helper functions
├── app.ts          # Express app setup
└── index.ts        # Server entry point
```

## 🧪 Testing

The API has been thoroughly tested for:
- ✅ Authentication flows (register, login, password changes)
- ✅ User CRUD operations with security
- ✅ Password security and validation
- ✅ All endpoints return expected formats
- ✅ Rate limiting and security headers

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NODE_ENV="development"
PORT=3200
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.
