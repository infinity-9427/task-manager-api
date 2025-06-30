# Task Manager Application - Database Schema & Architecture Specification

## Overview
This document provides a comprehensive specification for a full-featured task management application with real-time capabilities, user authentication, team collaboration, notifications, messaging, and analytics. The system supports both individual and team task management with administrative oversight.

## Technology Stack
- **Backend**: Node.js/Express.js or NestJS
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 or similar
- **Cache**: Redis
- **Queue**: Bull/Agenda for background jobs

## Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  role user_role DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### 2. Teams/Organizations Table
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  owner_id INTEGER REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role organization_member_role DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, user_id)
);

CREATE TYPE organization_member_role AS ENUM ('owner', 'admin', 'manager', 'member');
```

### 3. Projects Table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id INTEGER REFERENCES organizations(id),
  owner_id INTEGER REFERENCES users(id),
  status project_status DEFAULT 'active',
  priority priority_level DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role project_member_role DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE TYPE project_member_role AS ENUM ('owner', 'manager', 'member', 'viewer');
```

### 4. Tasks Table (Enhanced)
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  organization_id INTEGER REFERENCES organizations(id),
  parent_task_id INTEGER REFERENCES tasks(id), -- For subtasks
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id) NOT NULL,
  status task_status DEFAULT 'pending',
  priority priority_level DEFAULT 'medium',
  due_date TIMESTAMP,
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2) DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  tags VARCHAR(255)[],
  labels JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  position INTEGER, -- For ordering in kanban boards
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern JSONB, -- {type: 'daily/weekly/monthly', interval: 1, days: [1,2,3]}
  archived_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked');

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
```

### 5. Task Dependencies
```sql
CREATE TABLE task_dependencies (
  id SERIAL PRIMARY KEY,
  dependent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dependent_task_id, dependency_task_id)
);

CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish');
```

### 6. Task Watchers
```sql
CREATE TABLE task_watchers (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, user_id)
);
```

### 7. Task Comments/Activity
```sql
CREATE TABLE task_activities (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  activity_type activity_type NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE activity_type AS ENUM (
  'created', 'updated', 'status_changed', 'assigned', 'unassigned', 
  'comment_added', 'attachment_added', 'attachment_removed', 'due_date_changed',
  'priority_changed', 'moved', 'completed', 'reopened', 'deleted'
);

CREATE TABLE task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  parent_comment_id INTEGER REFERENCES task_comments(id), -- For threaded comments
  content TEXT NOT NULL,
  mentions INTEGER[] DEFAULT '{}', -- Array of user IDs mentioned
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. File Attachments
```sql
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by INTEGER REFERENCES users(id),
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  file_url VARCHAR(1000) NOT NULL,
  thumbnail_url VARCHAR(1000),
  is_image BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. Messages & Chat System
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  type conversation_type NOT NULL,
  name VARCHAR(255), -- For group chats
  organization_id INTEGER REFERENCES organizations(id),
  project_id INTEGER REFERENCES projects(id),
  task_id INTEGER REFERENCES tasks(id),
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'general', 'project', 'task');

CREATE TABLE conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role participant_role DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  muted BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

CREATE TYPE participant_role AS ENUM ('admin', 'member');

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id),
  parent_message_id INTEGER REFERENCES messages(id), -- For replies
  content TEXT,
  message_type message_type DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  mentions INTEGER[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system', 'task_update', 'meeting_invite');

CREATE TABLE message_read_status (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);
```

### 10. Notifications System
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}', -- Additional context data
  entity_type VARCHAR(50), -- 'task', 'project', 'message', etc.
  entity_id INTEGER,
  sender_id INTEGER REFERENCES users(id),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  priority notification_priority DEFAULT 'normal',
  delivery_method notification_delivery[] DEFAULT '{in_app}',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE notification_type AS ENUM (
  'task_assigned', 'task_due_soon', 'task_overdue', 'task_completed',
  'task_commented', 'task_mentioned', 'project_invitation', 'message_received',
  'meeting_reminder', 'deadline_reminder', 'status_changed', 'team_mention'
);

CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE notification_delivery AS ENUM ('in_app', 'email', 'push', 'sms');

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### 11. User Sessions & Tokens
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  access_token_hash VARCHAR(255),
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE socket_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  socket_id VARCHAR(255) UNIQUE NOT NULL,
  room_ids VARCHAR(255)[] DEFAULT '{}',
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 12. Time Tracking
```sql
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id),
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER, -- Calculated field
  is_billable BOOLEAN DEFAULT false,
  hourly_rate DECIMAL(10,2),
  tags VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
```

### 13. Analytics & Reports
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type report_type NOT NULL,
  created_by INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '{}',
  schedule_config JSONB, -- For automated reports
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE report_type AS ENUM ('task_summary', 'time_tracking', 'team_performance', 'project_progress', 'custom');

CREATE TABLE user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at);
```

### 14. Task Templates & Workflows
```sql
CREATE TABLE task_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id INTEGER REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
  template_data JSONB NOT NULL, -- Contains task structure
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  project_id INTEGER REFERENCES projects(id),
  created_by INTEGER REFERENCES users(id),
  steps JSONB NOT NULL, -- Array of workflow steps
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15. Calendar & Events
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  organization_id INTEGER REFERENCES organizations(id),
  project_id INTEGER REFERENCES projects(id),
  task_id INTEGER REFERENCES tasks(id),
  created_by INTEGER REFERENCES users(id),
  event_type event_type DEFAULT 'meeting',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  location VARCHAR(500),
  is_all_day BOOLEAN DEFAULT false,
  recurring_rule JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE event_type AS ENUM ('meeting', 'deadline', 'reminder', 'milestone', 'other');

CREATE TABLE event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status attendee_status DEFAULT 'pending',
  is_organizer BOOLEAN DEFAULT false,
  response_at TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE TYPE attendee_status AS ENUM ('pending', 'accepted', 'declined', 'tentative');
```

## API Endpoints Structure

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
GET /api/v1/users/:id
PUT /api/v1/users/:id/settings
```

### Organizations
```
GET /api/v1/organizations
POST /api/v1/organizations
GET /api/v1/organizations/:id
PUT /api/v1/organizations/:id
DELETE /api/v1/organizations/:id
GET /api/v1/organizations/:id/members
POST /api/v1/organizations/:id/members
DELETE /api/v1/organizations/:id/members/:userId
```

### Projects
```
GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/projects/:id
PUT /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET /api/v1/projects/:id/tasks
GET /api/v1/projects/:id/members
POST /api/v1/projects/:id/members
```

### Tasks
```
GET /api/v1/tasks
POST /api/v1/tasks
GET /api/v1/tasks/:id
PUT /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
POST /api/v1/tasks/:id/comments
GET /api/v1/tasks/:id/comments
PUT /api/v1/tasks/:id/assign
POST /api/v1/tasks/:id/watchers
DELETE /api/v1/tasks/:id/watchers/:userId
POST /api/v1/tasks/:id/attachments
GET /api/v1/tasks/assigned-to-me
GET /api/v1/tasks/created-by-me
```

### Messages & Chat
```
GET /api/v1/conversations
POST /api/v1/conversations
GET /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages
PUT /api/v1/messages/:id
DELETE /api/v1/messages/:id
POST /api/v1/messages/:id/reactions
GET /api/v1/conversations/general
```

### Notifications
```
GET /api/v1/notifications
PUT /api/v1/notifications/:id/read
PUT /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
GET /api/v1/notifications/unread-count
```

### Analytics & Reports
```
GET /api/v1/analytics/dashboard
GET /api/v1/analytics/tasks
GET /api/v1/analytics/time-tracking
GET /api/v1/analytics/team-performance
POST /api/v1/reports
GET /api/v1/reports
GET /api/v1/reports/:id/data
```

### Time Tracking
```
GET /api/v1/time-entries
POST /api/v1/time-entries
PUT /api/v1/time-entries/:id
DELETE /api/v1/time-entries/:id
POST /api/v1/time-entries/start
POST /api/v1/time-entries/stop
```

## Socket.IO Events

### Connection Events
```javascript
// Client connects
socket.on('connect', () => {
  socket.emit('join-user-room', { userId, organizationId });
});

// User joins organization rooms
socket.emit('join-organization', { organizationId });
socket.emit('join-project', { projectId });
socket.emit('join-conversation', { conversationId });
```

### Real-time Task Updates
```javascript
// Task events
socket.on('task:created', (task) => {});
socket.on('task:updated', (task) => {});
socket.on('task:status-changed', ({ taskId, status, updatedBy }) => {});
socket.on('task:assigned', ({ taskId, assignedTo, assignedBy }) => {});
socket.on('task:comment-added', ({ taskId, comment }) => {});
socket.on('task:due-soon', (task) => {});
```

### Chat & Messaging
```javascript
// Message events
socket.on('message:new', (message) => {});
socket.on('message:edited', (message) => {});
socket.on('message:deleted', ({ messageId }) => {});
socket.on('message:reaction', ({ messageId, reaction, userId }) => {});

// Typing indicators
socket.emit('typing:start', { conversationId });
socket.emit('typing:stop', { conversationId });
socket.on('user:typing', ({ userId, conversationId }) => {});
```

### User Presence
```javascript
// Online status
socket.on('user:online', ({ userId }) => {});
socket.on('user:offline', ({ userId, lastSeen }) => {});
socket.on('users:online-count', (count) => {});
```

### Notifications
```javascript
// Real-time notifications
socket.on('notification:new', (notification) => {});
socket.on('notification:read', ({ notificationId }) => {});
```

## Data Models (TypeScript Interfaces)

### User Models
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: 'admin' | 'manager' | 'member';
  isActive: boolean;
  isOnline: boolean;
  lastSeen?: Date;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile extends User {
  organizations: OrganizationMember[];
  projects: ProjectMember[];
  preferences: UserPreferences;
  timeZone: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  taskDueSoon: boolean;
  taskOverdue: boolean;
  taskCompleted: boolean;
  taskCommented: boolean;
  taskMentioned: boolean;
  messageReceived: boolean;
  projectInvitation: boolean;
}
```

### Organization Models
```typescript
interface Organization {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  ownerId: number;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationMember {
  id: number;
  organizationId: number;
  userId: number;
  role: 'owner' | 'admin' | 'manager' | 'member';
  permissions: Permission[];
  joinedAt: Date;
  isActive: boolean;
  user?: User;
}

interface OrganizationSettings {
  allowPublicProjects: boolean;
  requireTaskApproval: boolean;
  defaultTaskPriority: Priority;
  workingHours: WorkingHours;
  holidays: Date[];
}
```

### Task Models
```typescript
interface Task {
  id: number;
  title: string;
  description?: string;
  projectId?: number;
  organizationId: number;
  parentTaskId?: number;
  assignedTo?: number;
  createdBy: number;
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours: number;
  completionPercentage: number;
  tags: string[];
  labels: Label[];
  customFields: Record<string, any>;
  position: number;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  archivedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  assignee?: User;
  creator?: User;
  project?: Project;
  comments?: TaskComment[];
  attachments?: Attachment[];
  watchers?: User[];
  dependencies?: TaskDependency[];
  timeEntries?: TimeEntry[];
  subtasks?: Task[];
}

interface TaskDependency {
  id: number;
  dependentTaskId: number;
  dependencyTaskId: number;
  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  createdAt: Date;
}

interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
}
```

### Project Models
```typescript
interface Project {
  id: number;
  name: string;
  description?: string;
  organizationId: number;
  ownerId: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  color: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
  conversations?: Conversation[];
}

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  permissions: Permission[];
  joinedAt: Date;
  user?: User;
}
```

### Message & Chat Models
```typescript
interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'general' | 'project' | 'task';
  name?: string;
  organizationId?: number;
  projectId?: number;
  taskId?: number;
  createdBy: number;
  isActive: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  participants?: ConversationParticipant[];
  messages?: Message[];
  lastMessage?: Message;
  unreadCount?: number;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  parentMessageId?: number;
  content?: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'task_update' | 'meeting_invite';
  attachments: MessageAttachment[];
  mentions: number[];
  reactions: Record<string, number[]>; // emoji -> user IDs
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  sender?: User;
  parentMessage?: Message;
  replies?: Message[];
  readStatus?: MessageReadStatus[];
}

interface MessageReadStatus {
  id: number;
  messageId: number;
  userId: number;
  readAt: Date;
}
```

### Notification Models
```typescript
interface Notification {
  id: number;
  userId: number;
  type: 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'task_completed' | 
        'task_commented' | 'task_mentioned' | 'project_invitation' | 'message_received' |
        'meeting_reminder' | 'deadline_reminder' | 'status_changed' | 'team_mention';
  title: string;
  content?: string;
  data: Record<string, any>;
  entityType?: string;
  entityId?: number;
  senderId?: number;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deliveryMethod: ('in_app' | 'email' | 'push' | 'sms')[];
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  
  // Relations
  sender?: User;
}
```

### Analytics Models
```typescript
interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByAssignee: Record<string, number>;
  productivity: ProductivityMetrics;
}

interface ProductivityMetrics {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  averageTasksPerDay: number;
  streakDays: number;
  efficiency: number; // estimated vs actual hours
}

interface TeamAnalytics {
  memberCount: number;
  activeMembers: number;
  onlineMembers: number;
  taskDistribution: Record<string, number>;
  workload: WorkloadMetrics[];
  collaboration: CollaborationMetrics;
}
```

## Security Features

### Authentication & Authorization
- JWT tokens with refresh token rotation
- Role-based access control (RBAC)
- Permission-based access to resources
- Session management with device tracking
- Account lockout after failed attempts
- Password strength requirements

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- API key management for external integrations

### Privacy & Compliance
- GDPR compliance features
- Data export/deletion capabilities
- Audit logging
- Encrypted sensitive data storage
- Secure file upload handling

## Performance Optimizations

### Database
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for analytics
- Caching layer (Redis)

### Real-time Features
- Socket.IO clustering
- Redis adapter for horizontal scaling
- Room-based event targeting
- Connection health monitoring

### API Performance
- Response pagination
- Field selection (GraphQL or custom)
- Compression
- CDN for static assets
- Background job processing

## Deployment Architecture

### Infrastructure
- Load balancer (nginx/HAProxy)
- Application servers (Node.js cluster)
- Database cluster (PostgreSQL primary/replica)
- Redis cluster for caching and sessions
- File storage (AWS S3/MinIO)
- Message queue (Redis/RabbitMQ)

### Monitoring & Logging
- Application monitoring (DataDog/New Relic)
- Error tracking (Sentry)
- Log aggregation (ELK stack)
- Performance metrics
- Uptime monitoring

### Backup & Recovery
- Automated database backups
- Point-in-time recovery
- File storage backup
- Disaster recovery procedures

This specification provides a comprehensive foundation for building a full-featured task management application with real-time collaboration, messaging, notifications, and analytics capabilities. The schema is designed to be scalable, maintainable, and supports all the requested features including admin dashboards, team collaboration, time tracking, and detailed reporting.
