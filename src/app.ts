import express from "express";
import cors from "cors";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import session from "express-session";
import passport from "passport";
import { Server } from "socket.io";
import { createServer } from "http";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

// Routes
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/users.js";
import analyticsRoutes from "./routes/analytics.js";
import messagingRoutes from "./routes/messaging.js";
import notificationsRoutes from "./routes/notifications.js";

// Auth configuration
import "./utils/auth.js";

const app = express();

export const createApp = ({ port }: { port: number | string }) => {
  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
  // Compression middleware
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Logging
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          "https://task-manager-puce-one.vercel.app",
          process.env.CORS_ORIGIN || "http://localhost:3000"
        ];
        if (!origin || allowedOrigins.includes(origin) || /http:\/\/localhost:\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  
  // File upload middleware
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
      limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760") },
    })
  );

  // Session configuration
  app.use(
    session({
      secret: process.env.JWT_SECRET || "your-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API documentation endpoint
  app.get("/api", (req, res) => {
    res.status(200).json({
      name: "Task Manager API",
      version: "1.0.0",
      description: "A comprehensive task management API with real-time features",
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      documentation: {
        swagger: `${req.protocol}://${req.get('host')}/api-docs`,
        openapi: `${req.protocol}://${req.get('host')}/api/swagger.json`,
        markdown: "Full API documentation available in API_DOCUMENTATION.md"
      },
      endpoints: {
        authentication: {
          register: "POST /api/auth/register",
          login: "POST /api/auth/login",
          me: "GET /api/auth/me",
          refreshToken: "POST /api/auth/refresh-token",
          changePassword: "POST /api/auth/change-password",
          forgotPassword: "POST /api/auth/forgot-password",
          resetPassword: "POST /api/auth/reset-password",
          logout: "POST /api/auth/logout"
        },
        tasks: {
          create: "POST /api/tasks",
          getAll: "GET /api/tasks",
          getById: "GET /api/tasks/{id}",
          update: "PUT /api/tasks/{id}",
          delete: "DELETE /api/tasks/{id}"
        },
        messaging: {
          createConversation: "POST /api/messaging/conversations",
          getConversations: "GET /api/messaging/conversations",
          sendMessage: "POST /api/messaging/conversations/{id}/messages",
          getMessages: "GET /api/messaging/conversations/{id}/messages",
          addParticipants: "POST /api/messaging/conversations/{id}/participants",
          leaveConversation: "DELETE /api/messaging/conversations/{id}/leave"
        },
        notifications: {
          getNotifications: "GET /api/notifications",
          markAsRead: "PATCH /api/notifications/{id}/read",
          markAllAsRead: "PATCH /api/notifications/mark-all-read",
          deleteNotification: "DELETE /api/notifications/{id}",
          getPreferences: "GET /api/notifications/preferences",
          updatePreferences: "PUT /api/notifications/preferences",
          createSystemNotification: "POST /api/notifications/system"
        },
        analytics: {
          dashboard: "GET /api/analytics/dashboard",
          adminDashboard: "GET /api/analytics/admin-dashboard",
          projectAnalytics: "GET /api/analytics/project/{id}"
        },
        users: {
          getAll: "GET /api/users",
          getById: "GET /api/users/{id}",
          create: "POST /api/users",
          update: "PUT /api/users/{id}",
          delete: "DELETE /api/users/{id}"
        }
      },
      features: [
        "JWT Authentication",
        "Real-time messaging with Socket.IO",
        "Task management with priorities and status tracking",
        "User notifications and preferences",
        "Analytics and dashboard",
        "File uploads with Cloudinary",
        "Rate limiting and security headers",
        "PostgreSQL with Prisma ORM"
      ],
      socketIO: {
        endpoint: `${req.protocol}://${req.get('host')}`,
        events: {
          client: ["join_conversation", "leave_conversation", "send_message", "typing_start", "typing_stop"],
          server: ["message_received", "notification_received", "user_status_changed", "typing_indicator", "task_updated", "conversation_updated"]
        }
      },
      rateLimit: "100 requests per 15 minutes per IP",
      cors: "Configured for cross-origin requests"
    });
  });

  // Swagger JSON endpoint
  app.get("/api/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Task Manager API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/messaging", messagingRoutes);
  app.use("/api/notifications", notificationsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  return { app, port };
};

export const createSocketServer = (app: express.Application) => {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return { server, io };
};