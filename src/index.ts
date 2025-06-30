import { createApp, createSocketServer } from "./app.js";
import { initializeSocketHandlers } from "./utils/socketHandlers.js";
import { PrismaClient } from "@prisma/client";

const PORT = process.env.PORT || 3200;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Create app and socket server
const { app } = createApp({ port: PORT });
const { server, io } = createSocketServer(app);

// Initialize socket handlers for real-time features
initializeSocketHandlers(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log(`📊 API documentation: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO server ready for real-time connections`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});