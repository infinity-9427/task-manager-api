# Task Manager API - Complete Specification

## Overview
A comprehensive task management application with real-time capabilities, user authentication, task management, messaging system, notifications, and analytics dashboard. Built with Node.js/Express, PostgreSQL, Prisma, and Socket.IO.

## Technology Stack
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT with refresh tokens
- **Package Manager**: pnpm
- **File Upload**: Cloudinary
- **Validation**: Joi
- **Password Hashing**: bcrypt

## Core Features

### 1. Authentication & Authorization
- ✅ User registration with email verification
- ✅ User login with JWT tokens
- ✅ Password reset functionality
- ✅ Role-based access control (Admin, Manager, Member)
- ✅ Session management with refresh tokens
- ✅ Online status tracking

### 2. Task Management (CRUD)
- ✅ Create, read, update, delete tasks
- ✅ Task assignment to users
- ✅ Task status management (Pending, In Progress, In Review, Completed, Cancelled, Blocked)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Due dates and reminders
- ✅ Task comments and discussions
- ✅ File attachments
- ✅ Task watchers/followers
- ✅ Subtasks support
- ✅ Time tracking

### 3. Filtering & Search
- ✅ Filter tasks by status, priority, assignee, due date
- ✅ Search tasks by title, description, tags
- ✅ Custom filters and saved searches
- ✅ Project-based task organization

### 4. Real-time Features (Socket.IO)
- ✅ Real-time task updates
- ✅ Live messaging system
- ✅ Online user presence
- ✅ Real-time notifications
- ✅ Live activity feeds

### 5. Messaging System
- ✅ Private direct messages between users
- ✅ General group conversations
- ✅ Project-specific chat rooms
- ✅ Task-related discussions
- ✅ Message read status
- ✅ File sharing in messages
- ✅ Message reactions and replies

### 6. Notifications
- ✅ Task assignment notifications
- ✅ Due date reminders
- ✅ Task completion notifications
- ✅ Message notifications
- ✅ Real-time in-app notifications
- ✅ Email notifications (configurable)

### 7. Dashboard & Analytics
- ✅ User dashboard with personal task summary
- ✅ Admin dashboard with system-wide analytics
- ✅ Task completion charts (daily, weekly, monthly, yearly)
- ✅ User productivity metrics
- ✅ Project progress tracking
- ✅ Time tracking reports

### 8. User Management
- ✅ User profiles with avatars
- ✅ Online status display
- ✅ User activity logs
- ✅ Role management (Admin only)

## Database Schema (Prisma Models)

### Core Models
1. **User** - User accounts and authentication
2. **Project** - Task organization containers
3. **Task** - Main task entities with full CRUD
4. **TaskComment** - Comments and discussions on tasks
5. **TaskWatcher** - Users following specific tasks
6. **TaskActivity** - Activity logs for tasks

### Messaging Models
7. **Conversation** - Chat containers (direct, group, general)
8. **ConversationParticipant** - Users in conversations
9. **Message** - Chat messages
10. **MessageReadStatus** - Message read tracking

### System Models
11. **Notification** - User notifications
12. **UserSession** - Authentication sessions
13. **SocketConnection** - Real-time connection tracking
14. **TimeEntry** - Time tracking for tasks
15. **ActivityLog** - System activity logging
16. **Attachment** - File attachments

## API Endpoints

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-email
```

### Users
```
GET /api/v1/users/profile
PUT /api/v1/users/profile
GET /api/v1/users/online
GET /api/v1/users
GET /api/v1/users/:id
PUT /api/v1/users/:id/status
```

### Tasks (Full CRUD)
```
GET /api/v1/tasks                    # Get all tasks with filters
POST /api/v1/tasks                   # Create new task
GET /api/v1/tasks/:id                # Get specific task
PUT /api/v1/tasks/:id                # Update task
DELETE /api/v1/tasks/:id             # Delete task
PUT /api/v1/tasks/:id/assign         # Assign task to user
PUT /api/v1/tasks/:id/status         # Update task status
POST /api/v1/tasks/:id/comments      # Add comment
GET /api/v1/tasks/:id/comments       # Get comments
POST /api/v1/tasks/:id/watchers      # Add watcher
DELETE /api/v1/tasks/:id/watchers/:userId # Remove watcher
POST /api/v1/tasks/:id/attachments   # Upload attachment
GET /api/v1/tasks/assigned-to-me     # Get user's assigned tasks
GET /api/v1/tasks/created-by-me      # Get user's created tasks
```

### Projects
```
GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/projects/:id
PUT /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET /api/v1/projects/:id/tasks
```

### Messages
```
GET /api/v1/conversations
POST /api/v1/conversations
GET /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages
PUT /api/v1/messages/:id
DELETE /api/v1/messages/:id
POST /api/v1/messages/:id/reactions
```

### Notifications
```
GET /api/v1/notifications
PUT /api/v1/notifications/:id/read
PUT /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
GET /api/v1/notifications/unread-count
```

### Analytics & Dashboard
```
GET /api/v1/dashboard/user           # User personal dashboard
GET /api/v1/dashboard/admin          # Admin system dashboard
GET /api/v1/analytics/tasks          # Task analytics
GET /api/v1/analytics/time-tracking  # Time tracking reports
GET /api/v1/analytics/productivity   # User productivity metrics
```

### Time Tracking
```
GET /api/v1/time-entries
POST /api/v1/time-entries/start
POST /api/v1/time-entries/stop
PUT /api/v1/time-entries/:id
DELETE /api/v1/time-entries/:id
```

## Socket.IO Events

### Connection Events
```javascript
// User connects and joins rooms
socket.on('connect', () => {
  socket.emit('join-user-room', { userId });
  socket.emit('join-general-room');
});

// User status updates
socket.emit('user-online', { userId });
socket.emit('user-offline', { userId });
```

### Task Events
```javascript
// Real-time task updates
socket.on('task:created', (task) => {});
socket.on('task:updated', (task) => {});
socket.on('task:deleted', ({ taskId }) => {});
socket.on('task:status-changed', ({ taskId, status, userId }) => {});
socket.on('task:assigned', ({ taskId, assignedTo, assignedBy }) => {});
socket.on('task:comment-added', ({ taskId, comment }) => {});
socket.on('task:due-soon', (task) => {});
```

### Message Events
```javascript
// Real-time messaging
socket.on('message:new', (message) => {});
socket.on('message:updated', (message) => {});
socket.on('message:deleted', ({ messageId }) => {});
socket.on('conversation:typing', ({ conversationId, userId }) => {});
socket.on('conversation:stop-typing', ({ conversationId, userId }) => {});
```

### Notification Events
```javascript
// Real-time notifications
socket.on('notification:new', (notification) => {});
socket.on('notification:read', ({ notificationId }) => {});
socket.on('notification:count-updated', ({ unreadCount }) => {});
```

## File Structure
```
src/
├── app.ts                    # Express app configuration
├── index.ts                  # Server entry point
├── controllers/
│   ├── auth.ts              # Authentication controller
│   ├── users.ts             # User management controller
│   ├── tasks.ts             # Task CRUD controller
│   ├── projects.ts          # Project management controller
│   ├── messages.ts          # Messaging controller
│   ├── notifications.ts     # Notifications controller
│   ├── dashboard.ts         # Dashboard and analytics controller
│   └── timeTracking.ts      # Time tracking controller
├── routes/
│   ├── auth.ts              # Auth routes
│   ├── users.ts             # User routes
│   ├── tasks.ts             # Task routes
│   ├── projects.ts          # Project routes
│   ├── messages.ts          # Message routes
│   ├── notifications.ts     # Notification routes
│   ├── dashboard.ts         # Dashboard routes
│   └── timeTracking.ts      # Time tracking routes
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   ├── validation.ts        # Request validation middleware
│   ├── upload.ts            # File upload middleware
│   └── rateLimiting.ts      # Rate limiting middleware
├── services/
│   ├── authService.ts       # Authentication business logic
│   ├── taskService.ts       # Task business logic
│   ├── messageService.ts    # Messaging business logic
│   ├── notificationService.ts # Notification business logic
│   ├── socketService.ts     # Socket.IO service
│   └── emailService.ts      # Email service
├── utils/
│   ├── prisma.ts            # Prisma client
│   ├── jwt.ts               # JWT utilities
│   ├── validation.ts        # Validation schemas
│   ├── helpers.ts           # General helpers
│   └── constants.ts         # Application constants
├── types/
│   ├── auth.ts              # Authentication types
│   ├── task.ts              # Task types
│   ├── message.ts           # Message types
│   └── common.ts            # Common types
└── socket/
    ├── index.ts             # Socket.IO setup
    ├── handlers/
    │   ├── taskHandlers.ts  # Task-related socket handlers
    │   ├── messageHandlers.ts # Message socket handlers
    │   └── userHandlers.ts  # User status handlers
    └── middleware/
        └── auth.ts          # Socket authentication middleware
```

## Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanager"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (NodeMailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Redis (for caching and sessions)
REDIS_URL="redis://localhost:6379"

# App
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

## Dashboard Analytics

### User Dashboard Cards
1. **My Tasks Summary**
   - Total tasks assigned
   - Pending tasks
   - In progress tasks
   - Completed tasks (today/week/month)
   - Overdue tasks

2. **Recent Activity**
   - Recent task updates
   - Recent comments
   - Recent assignments

3. **Time Tracking**
   - Time logged today
   - Time logged this week
   - Most worked on projects

### Admin Dashboard Cards
1. **System Overview**
   - Total users (active/inactive)
   - Total tasks by status
   - Total projects
   - System health metrics

2. **Task Analytics**
   - Tasks created/completed (daily/weekly/monthly/yearly)
   - Average completion time
   - Most productive users
   - Overdue tasks across system

3. **User Analytics**
   - User activity levels
   - Login frequency
   - Most active users
   - User growth charts

4. **Project Analytics**
   - Project progress overview
   - Most active projects
   - Resource allocation

## Next Steps

1. **Setup Database**
   - Generate Prisma client
   - Run database migrations
   - Seed initial data

2. **Implement Core Features**
   - Authentication system
   - Task CRUD operations
   - Real-time messaging
   - Notification system

3. **Setup Socket.IO**
   - Real-time task updates
   - Live messaging
   - Online presence
   - Live notifications

4. **Create Dashboard**
   - User analytics
   - Admin analytics
   - Charts and visualizations

5. **Testing & Deployment**
   - Unit tests
   - Integration tests
   - Production deployment
