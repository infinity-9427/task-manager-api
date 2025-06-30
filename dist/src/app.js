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
export const createApp = ({ port }) => {
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
    app.use(cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                "https://task-manager-puce-one.vercel.app",
                process.env.CORS_ORIGIN || "http://localhost:3000"
            ];
            if (!origin || allowedOrigins.includes(origin) || /http:\/\/localhost:\d+$/.test(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));
    // Body parsing middleware
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    // File upload middleware
    app.use(fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
        limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760") },
    }));
    // Session configuration
    app.use(session({
        secret: process.env.JWT_SECRET || "your-session-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    }));
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
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(err.status || 500).json({
            success: false,
            message: err.message || "Internal server error",
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
    });
    return { app, port };
};
export const createSocketServer = (app) => {
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
//# sourceMappingURL=app.js.map