# Task Manager API Documentation

## Base URL
```
http://localhost:3200/api
```

## Authentication
Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "string", // required, 3-30 chars
  "email": "string", // required, valid email format
  "password": "string", // required, min 6 chars
  "firstName": "string", // optional, max 100 chars
  "lastName": "string" // optional, max 100 chars
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "MEMBER",
    "isActive": true,
    "createdAt": "2025-06-30T15:11:56.828Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "string", // required, can be username or email
  "password": "string" // required
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "avatar": null,
    "role": "MEMBER",
    "isActive": true,
    "isOnline": false,
    "lastSeen": "2025-06-30T15:21:14.082Z",
    "emailVerified": false,
    "createdAt": "2025-06-30T15:11:56.828Z",
    "updatedAt": "2025-06-30T15:21:14.083Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "avatar": null,
    "role": "MEMBER",
    "isActive": true,
    "isOnline": false,
    "lastSeen": "2025-06-30T15:27:46.028Z",
    "createdAt": "2025-06-30T15:11:56.828Z",
    "updatedAt": "2025-06-30T15:27:46.029Z"
  }
}
```

### Refresh Token
**POST** `/auth/refresh-token`

**Request Body:**
```json
{
  "token": "string" // refresh token
}
```

### Change Password
**POST** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string" // min 6 chars
}
```

### Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "string" // valid email
}
```

### Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "string", // reset token
  "newPassword": "string" // min 6 chars
}
```

### Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <token>`

---

## 📋 Task Management Endpoints

### Create Task
**POST** `/tasks`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string", // required
  "description": "string", // optional
  "status": "PENDING|IN_PROGRESS|COMPLETED", // optional, default: PENDING
  "priority": "LOW|MEDIUM|HIGH|URGENT", // optional, default: MEDIUM
  "projectId": "number", // optional
  "assignedToId": "number", // optional, user ID to assign task to
  "dueDate": "2025-07-05T10:00:00Z", // optional, ISO date string
  "estimatedHours": "number", // optional, positive number
  "tags": ["string"] // optional, array of strings
}
```

**Response (201):**
```json
{
  "id": 1,
  "title": "Complete API Testing",
  "description": "Test all endpoints of the task manager API",
  "projectId": null,
  "parentTaskId": null,
  "assignedToId": null,
  "createdById": 1,
  "status": "PENDING",
  "priority": "HIGH",
  "dueDate": null,
  "estimatedHours": null,
  "actualHours": 0,
  "completionPercentage": 0,
  "tags": [],
  "labels": [],
  "customFields": {},
  "position": null,
  "isRecurring": false,
  "recurringPattern": null,
  "archivedAt": null,
  "completedAt": null,
  "createdAt": "2025-06-30T15:29:56.005Z",
  "updatedAt": "2025-06-30T15:29:56.005Z",
  "createdBy": {
    "id": 1,
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  },
  "assignedTo": null,
  "project": null
}
```

### Get All Tasks
**GET** `/tasks`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Complete API Testing",
    "description": "Test all endpoints of the task manager API",
    "projectId": null,
    "parentTaskId": null,
    "assignedToId": null,
    "createdById": 1,
    "status": "PENDING",
    "priority": "HIGH",
    "dueDate": null,
    "estimatedHours": null,
    "actualHours": 0,
    "completionPercentage": 0,
    "tags": [],
    "labels": [],
    "customFields": {},
    "position": null,
    "isRecurring": false,
    "recurringPattern": null,
    "archivedAt": null,
    "completedAt": null,
    "createdAt": "2025-06-30T15:29:56.005Z",
    "updatedAt": "2025-06-30T15:29:56.005Z"
  }
]
```

### Get Task by ID
**GET** `/tasks/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "title": "Complete API Testing",
  "description": "Test all endpoints of the task manager API",
  "projectId": null,
  "parentTaskId": null,
  "assignedToId": 4,
  "createdById": 1,
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": null,
  "estimatedHours": null,
  "actualHours": 0,
  "completionPercentage": 25,
  "tags": [],
  "labels": [],
  "customFields": {},
  "position": null,
  "isRecurring": false,
  "recurringPattern": null,
  "archivedAt": null,
  "completedAt": null,
  "createdAt": "2025-06-30T15:29:56.005Z",
  "updatedAt": "2025-06-30T15:31:13.528Z"
}
```

### Update Task
**PUT** `/tasks/{id}`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (All fields optional)
```json
{
  "title": "string",
  "description": "string",
  "status": "PENDING|IN_PROGRESS|COMPLETED",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "projectId": "number",
  "assignedToId": "number",
  "dueDate": "2025-07-05T10:00:00Z",
  "estimatedHours": "number",
  "tags": ["string"],
  "completionPercentage": "number" // 0-100
}
```

### Delete Task
**DELETE** `/tasks/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Task deleted"
}
```

---

## 💬 Messaging Endpoints

### Create Conversation
**POST** `/messaging/conversations`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "DIRECT|GROUP|GENERAL", // required
  "name": "string", // required for GROUP/GENERAL, optional for DIRECT
  "description": "string", // optional, max 500 chars
  "participantIds": [3, 4] // required, array of user IDs
}
```

**Response (201):**
```json
{
  "conversation": {
    "id": 1,
    "type": "GROUP",
    "name": "Project Discussion",
    "projectId": null,
    "taskId": null,
    "createdById": 1,
    "isActive": true,
    "lastMessageAt": null,
    "createdAt": "2025-06-30T15:31:30.096Z",
    "updatedAt": "2025-06-30T15:31:30.096Z",
    "participants": [
      {
        "id": 1,
        "conversationId": 1,
        "userId": 1,
        "joinedAt": "2025-06-30T15:31:30.096Z",
        "leftAt": null,
        "muted": false,
        "user": {
          "id": 1,
          "username": "testuser",
          "firstName": "Test",
          "lastName": "User",
          "avatar": null
        }
      }
    ]
  }
}
```

### Get User Conversations
**GET** `/messaging/conversations`

**Headers:** `Authorization: Bearer <token>`

### Send Message
**POST** `/messaging/conversations/{conversationId}/messages`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "string", // required, 1-2000 chars
  "messageType": "TEXT|IMAGE|FILE|SYSTEM", // optional, default: TEXT
  "mentions": [1, 2], // optional, array of user IDs
  "parentMessageId": "number" // optional, for replies
}
```

**Response (201):**
```json
{
  "message": {
    "id": 1,
    "conversationId": 1,
    "senderId": 1,
    "parentMessageId": null,
    "content": "Hello team! Lets discuss our project progress and coordinate tasks.",
    "messageType": "TEXT",
    "attachments": [],
    "mentions": [],
    "reactions": {},
    "isEdited": false,
    "editedAt": null,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2025-06-30T15:31:56.717Z",
    "updatedAt": "2025-06-30T15:31:56.717Z",
    "sender": {
      "id": 1,
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "avatar": null
    },
    "parentMessage": null
  }
}
```

### Get Conversation Messages
**GET** `/messaging/conversations/{conversationId}/messages`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "conversationId": 1,
      "senderId": 1,
      "parentMessageId": null,
      "content": "Hello team! Lets discuss our project progress and coordinate tasks.",
      "messageType": "TEXT",
      "attachments": [],
      "mentions": [],
      "reactions": {},
      "isEdited": false,
      "editedAt": null,
      "isDeleted": false,
      "deletedAt": null,
      "createdAt": "2025-06-30T15:31:56.717Z",
      "updatedAt": "2025-06-30T15:31:56.717Z",
      "sender": {
        "id": 1,
        "username": "testuser",
        "firstName": "Test",
        "lastName": "User",
        "avatar": null
      },
      "parentMessage": null,
      "readStatus": []
    }
  ]
}
```

### Add Participants
**POST** `/messaging/conversations/{conversationId}/participants`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userIds": [5, 6] // array of user IDs to add
}
```

### Leave Conversation
**DELETE** `/messaging/conversations/{conversationId}/leave`

**Headers:** `Authorization: Bearer <token>`

---

## 🔔 Notifications Endpoints

### Get User Notifications
**GET** `/notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20)
- `unreadOnly`: boolean (optional, default: false)

**Response (200):**
```json
{
  "notifications": [],
  "unreadCount": 0,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### Mark Notification as Read
**PATCH** `/notifications/{notificationId}/read`

**Headers:** `Authorization: Bearer <token>`

### Mark All Notifications as Read
**PATCH** `/notifications/mark-all-read`

**Headers:** `Authorization: Bearer <token>`

### Delete Notification
**DELETE** `/notifications/{notificationId}`

**Headers:** `Authorization: Bearer <token>`

### Get Notification Preferences
**GET** `/notifications/preferences`

**Headers:** `Authorization: Bearer <token>`

### Update Notification Preferences
**PUT** `/notifications/preferences`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "taskAssigned": true,
  "taskCompleted": true,
  "messageReceived": true,
  "mentionReceived": true
}
```

### Create System Notification (Admin Only)
**POST** `/notifications/system`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "TASK_ASSIGNED|TASK_COMPLETED|TASK_OVERDUE|TASK_MENTIONED|MESSAGE_RECEIVED|GENERAL_NOTIFICATION",
  "title": "string",
  "message": "string",
  "recipientIds": [1, 2, 3] // array of user IDs
}
```

---

## 📊 Analytics Endpoints

### Get User Dashboard
**GET** `/analytics/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: string (optional, "week"|"month"|"year", default: "week")

**Response (200):**
```json
{
  "dashboard": {
    "overview": {
      "totalTasks": 0,
      "completedTasks": 0,
      "pendingTasks": 0,
      "inProgressTasks": 0,
      "overdueTasks": 0,
      "completionRate": 0
    },
    "tasksByPriority": {},
    "timeTracking": {
      "totalMinutes": 0,
      "totalEntries": {
        "id": 0
      }
    },
    "recentTasks": [],
    "projects": [],
    "trends": {
      "taskCompletion": [],
      "period": "week"
    }
  }
}
```

### Get Admin Dashboard (Admin Only)
**GET** `/analytics/admin-dashboard`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: string (optional, "week"|"month"|"year", default: "month")

### Get Project Analytics
**GET** `/analytics/project/{projectId}`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: string (optional, "week"|"month"|"year", default: "month")

---

## 👥 User Management Endpoints

### Get User by ID
**GET** `/users/{id}`

**Response (200):**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "avatar": null,
  "role": "MEMBER",
  "isActive": true,
  "isOnline": false,
  "lastSeen": "2025-06-30T15:21:14.082Z",
  "emailVerified": false,
  "emailVerificationToken": null,
  "passwordResetToken": null,
  "passwordResetExpires": null,
  "createdAt": "2025-06-30T15:11:56.828Z",
  "updatedAt": "2025-06-30T15:21:14.083Z"
}
```

### Create User
**POST** `/users`

### Update User
**PUT** `/users/{id}`

### Delete User
**DELETE** `/users/{id}`

---

## 🏥 Health Check

### Health Check
**GET** `/health`

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-06-30T15:34:04.789Z",
  "uptime": 278.945664709
}
```

---

## 🚀 Real-time Features (Socket.IO)

### Connection
Connect to `http://localhost:3200` with Socket.IO client.

**Authentication:**
```javascript
const socket = io('http://localhost:3200', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Client to Server Events:
- `join_conversation`: Join a conversation room
  ```javascript
  socket.emit('join_conversation', { conversationId: 1 });
  ```

- `leave_conversation`: Leave a conversation room
  ```javascript
  socket.emit('leave_conversation', { conversationId: 1 });
  ```

- `send_message`: Send a real-time message
  ```javascript
  socket.emit('send_message', {
    conversationId: 1,
    content: 'Hello!',
    messageType: 'TEXT'
  });
  ```

- `typing_start`: Indicate user is typing
  ```javascript
  socket.emit('typing_start', { conversationId: 1 });
  ```

- `typing_stop`: Indicate user stopped typing
  ```javascript
  socket.emit('typing_stop', { conversationId: 1 });
  ```

#### Server to Client Events:
- `message_received`: New message received
- `notification_received`: New notification received
- `user_status_changed`: User online/offline status changed
- `typing_indicator`: Someone is typing indicator
- `task_updated`: Task was updated
- `conversation_updated`: Conversation was updated

---

## 📝 Data Models

### User Roles
- `MEMBER`: Regular user
- `ADMIN`: Administrator with full access
- `MODERATOR`: Moderator with limited admin access

### Task Status
- `PENDING`: Task is created but not started
- `IN_PROGRESS`: Task is being worked on
- `COMPLETED`: Task is finished

### Task Priority
- `LOW`: Low priority
- `MEDIUM`: Medium priority (default)
- `HIGH`: High priority
- `URGENT`: Urgent priority

### Message Types
- `TEXT`: Text message
- `IMAGE`: Image attachment
- `FILE`: File attachment
- `SYSTEM`: System-generated message

### Conversation Types
- `DIRECT`: One-on-one conversation
- `GROUP`: Group conversation
- `GENERAL`: General/public conversation

### Notification Types
- `TASK_ASSIGNED`: Task was assigned to user
- `TASK_COMPLETED`: Task was completed
- `TASK_OVERDUE`: Task is overdue
- `TASK_MENTIONED`: User was mentioned in task
- `MESSAGE_RECEIVED`: New message received
- `GENERAL_NOTIFICATION`: General system notification

---

## 🔧 Error Responses

### Common Error Format
```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

### Validation Errors
When validation fails, the API returns detailed error messages:
```json
{
  "error": "\"title\" is required"
}
```

---

## 📋 Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
  - `RateLimit-Limit`: Request limit
  - `RateLimit-Remaining`: Remaining requests
  - `RateLimit-Reset`: Reset time in seconds

---

## 🔒 Security Features

- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers applied
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Joi schema validation
- **Rate Limiting**: API rate limiting per IP
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

---

## 📚 Development Notes

- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for real-time features
- **File Uploads**: Cloudinary integration
- **Email**: SMTP configuration for notifications
- **Caching**: Redis support for sessions and caching
- **Environment**: Comprehensive environment configuration

This API provides a complete task management solution with authentication, real-time collaboration, messaging, notifications, and analytics capabilities.
