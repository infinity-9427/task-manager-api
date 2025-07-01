import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Manager API',
    version: '1.0.0',
    description: 'A comprehensive task management API with real-time features',
    contact: {
      name: 'API Support',
      email: 'support@taskmanager.com',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  servers: [
    {
      url: 'http://localhost:3200/api',
      description: 'Development server',
    },
    {
      url: 'https://task-manager-api.vercel.app/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
          },
          username: {
            type: 'string',
            description: 'Username',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
          },
          firstName: {
            type: 'string',
            description: 'First name',
          },
          lastName: {
            type: 'string',
            description: 'Last name',
          },
          avatar: {
            type: 'string',
            nullable: true,
            description: 'Avatar URL',
          },
          role: {
            type: 'string',
            enum: ['MEMBER', 'ADMIN', 'MODERATOR'],
            description: 'User role',
          },
          isActive: {
            type: 'boolean',
            description: 'User active status',
          },
          isOnline: {
            type: 'boolean',
            description: 'User online status',
          },
          lastSeen: {
            type: 'string',
            format: 'date-time',
            description: 'Last seen timestamp',
          },
          emailVerified: {
            type: 'boolean',
            description: 'Email verification status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Task ID',
          },
          title: {
            type: 'string',
            description: 'Task title',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Task description',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            description: 'Task status',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            description: 'Task priority',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Due date',
          },
          estimatedHours: {
            type: 'number',
            nullable: true,
            description: 'Estimated hours',
          },
          actualHours: {
            type: 'number',
            description: 'Actual hours spent',
          },
          completionPercentage: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Completion percentage',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Task tags',
          },
          projectId: {
            type: 'integer',
            nullable: true,
            description: 'Project ID',
          },
          assignedToId: {
            type: 'integer',
            nullable: true,
            description: 'Assigned user ID',
          },
          createdById: {
            type: 'integer',
            description: 'Creator user ID',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Message ID',
          },
          conversationId: {
            type: 'integer',
            description: 'Conversation ID',
          },
          senderId: {
            type: 'integer',
            description: 'Sender user ID',
          },
          content: {
            type: 'string',
            description: 'Message content',
          },
          messageType: {
            type: 'string',
            enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'],
            description: 'Message type',
          },
          mentions: {
            type: 'array',
            items: {
              type: 'integer',
            },
            description: 'Mentioned user IDs',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Conversation ID',
          },
          type: {
            type: 'string',
            enum: ['DIRECT', 'GROUP', 'GENERAL'],
            description: 'Conversation type',
          },
          name: {
            type: 'string',
            nullable: true,
            description: 'Conversation name',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Conversation description',
          },
          isActive: {
            type: 'boolean',
            description: 'Conversation active status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Notification ID',
          },
          type: {
            type: 'string',
            enum: ['TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_OVERDUE', 'TASK_MENTIONED', 'MESSAGE_RECEIVED', 'GENERAL_NOTIFICATION'],
            description: 'Notification type',
          },
          title: {
            type: 'string',
            description: 'Notification title',
          },
          message: {
            type: 'string',
            description: 'Notification message',
          },
          isRead: {
            type: 'boolean',
            description: 'Read status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Response message',
          },
          user: {
            $ref: '#/components/schemas/User',
          },
          accessToken: {
            type: 'string',
            description: 'JWT access token',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJSDoc(options);
