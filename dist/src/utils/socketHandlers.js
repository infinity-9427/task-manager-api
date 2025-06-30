import jwt from "jsonwebtoken";
import { prisma } from "../index.js";
export const initializeSocketHandlers = (io) => {
    // Middleware for socket authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Get user from database
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, role: true, isActive: true }
            });
            if (!user || !user.isActive) {
                return next(new Error('Authentication error: Invalid user'));
            }
            socket.userId = user.id;
            socket.userRole = user.role;
            // Update user online status
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isOnline: true,
                    lastSeen: new Date()
                }
            });
            next();
        }
        catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`🔌 User ${socket.userId} connected`);
        // Join user to their personal room
        socket.join(`user:${socket.userId}`);
        // Handle joining project rooms
        socket.on('join_project', async (projectId) => {
            try {
                // Verify user has access to the project
                const projectAccess = await prisma.project.findFirst({
                    where: {
                        id: projectId,
                        OR: [
                            { ownerId: socket.userId },
                            { isPublic: true }
                        ]
                    }
                });
                if (projectAccess) {
                    socket.join(`project:${projectId}`);
                    socket.emit('joined_project', { projectId });
                }
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to join project' });
            }
        });
        // Handle joining task rooms
        socket.on('join_task', async (taskId) => {
            try {
                // Verify user has access to the task
                const task = await prisma.task.findFirst({
                    where: {
                        id: taskId,
                        OR: [
                            { assignedToId: socket.userId },
                            { createdById: socket.userId },
                            { watchers: { some: { userId: socket.userId } } }
                        ]
                    }
                });
                if (task) {
                    socket.join(`task:${taskId}`);
                    socket.emit('joined_task', { taskId });
                }
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to join task' });
            }
        });
        // Handle real-time messaging
        socket.on('send_message', async (data) => {
            try {
                // Verify user is part of the conversation
                const participant = await prisma.conversationParticipant.findFirst({
                    where: {
                        conversationId: data.conversationId,
                        userId: socket.userId
                    }
                });
                if (!participant) {
                    socket.emit('error', { message: 'Not authorized to send message' });
                    return;
                }
                // Create the message
                const message = await prisma.message.create({
                    data: {
                        conversationId: data.conversationId,
                        senderId: socket.userId,
                        content: data.content,
                        messageType: data.type
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                avatar: true
                            }
                        }
                    }
                });
                // Emit to all participants in the conversation
                io.to(`conversation:${data.conversationId}`).emit('new_message', message);
                // Create notifications for other participants
                const otherParticipants = await prisma.conversationParticipant.findMany({
                    where: {
                        conversationId: data.conversationId,
                        userId: { not: socket.userId }
                    }
                });
                for (const participant of otherParticipants) {
                    await prisma.notification.create({
                        data: {
                            userId: participant.userId,
                            type: 'MESSAGE_RECEIVED',
                            title: 'New Message',
                            content: `${message.sender.firstName || message.sender.username} sent you a message`,
                            data: {
                                conversationId: data.conversationId,
                                messageId: message.id
                            }
                        }
                    });
                    // Emit notification to user
                    io.to(`user:${participant.userId}`).emit('notification', {
                        type: 'MESSAGE_RECEIVED',
                        title: 'New Message',
                        message: `${message.sender.firstName || message.sender.username} sent you a message`
                    });
                }
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle joining conversation rooms
        socket.on('join_conversation', async (conversationId) => {
            try {
                const participant = await prisma.conversationParticipant.findFirst({
                    where: {
                        conversationId,
                        userId: socket.userId
                    }
                });
                if (participant) {
                    socket.join(`conversation:${conversationId}`);
                    socket.emit('joined_conversation', { conversationId });
                }
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });
        // Handle task updates
        socket.on('task_update', async (data) => {
            try {
                // Verify user can update the task
                const task = await prisma.task.findFirst({
                    where: {
                        id: data.taskId,
                        OR: [
                            { assignedToId: socket.userId },
                            { createdById: socket.userId }
                        ]
                    }
                });
                if (task) {
                    // Emit update to all users watching the task
                    io.to(`task:${data.taskId}`).emit('task_updated', {
                        taskId: data.taskId,
                        updates: data.updates,
                        updatedBy: socket.userId
                    });
                }
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to update task' });
            }
        });
        // Handle typing indicators
        socket.on('typing_start', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        });
        socket.on('typing_stop', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        });
        // Handle user presence
        socket.on('update_presence', async (status) => {
            try {
                await prisma.user.update({
                    where: { id: socket.userId },
                    data: {
                        isOnline: status === 'online',
                        lastSeen: new Date()
                    }
                });
                // Broadcast presence update to relevant users
                socket.broadcast.emit('user_presence_updated', {
                    userId: socket.userId,
                    status,
                    lastSeen: new Date()
                });
            }
            catch (error) {
                console.error('Failed to update presence:', error);
            }
        });
        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`🔌 User ${socket.userId} disconnected`);
            try {
                // Update user offline status
                await prisma.user.update({
                    where: { id: socket.userId },
                    data: {
                        isOnline: false,
                        lastSeen: new Date()
                    }
                });
                // Remove socket connection record if exists
                await prisma.socketConnection.deleteMany({
                    where: { userId: socket.userId }
                });
                // Broadcast offline status
                socket.broadcast.emit('user_presence_updated', {
                    userId: socket.userId,
                    status: 'offline',
                    lastSeen: new Date()
                });
            }
            catch (error) {
                console.error('Failed to handle disconnect:', error);
            }
        });
    });
    return io;
};
// Helper function to emit notifications to specific users
export const emitNotificationToUser = (io, userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
};
// Helper function to emit task updates to all watchers
export const emitTaskUpdate = (io, taskId, update) => {
    io.to(`task:${taskId}`).emit('task_updated', update);
};
//# sourceMappingURL=socketHandlers.js.map