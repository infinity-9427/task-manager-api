import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get user's notifications
 */
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: req.user.id
    };

    if (unreadOnly) {
      whereClause.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        readAt: null
      }
    });

    res.json({ 
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: notifications.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notificationId = parseInt(req.params.notificationId);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.user.id
      }
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });

    res.json({ notification: updatedNotification });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        readAt: null
      },
      data: { readAt: new Date() }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const notificationId = parseInt(req.params.notificationId);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.user.id
      }
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // For now, return default preferences. In the future, this could be stored in a separate table
    const defaultPreferences = {
      taskAssigned: true,
      taskDueSoon: true,
      taskOverdue: true,
      taskCompleted: true,
      taskCommented: true,
      taskMentioned: true,
      messageReceived: true,
      generalNotification: true,
      emailNotifications: true,
      pushNotifications: true
    };

    res.json({ preferences: defaultPreferences });
  } catch (err) {
    next(err);
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const preferences = req.body;

    // In a real implementation, you would save these preferences to a user_preferences table
    // For now, just return the updated preferences
    res.json({ 
      message: 'Notification preferences updated successfully',
      preferences 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a system notification (admin only)
 */
export const createSystemNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { title, content, targetUsers, type = 'GENERAL_NOTIFICATION' } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    let userIds: number[] = [];

    if (targetUsers === 'all') {
      // Send to all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });
      userIds = users.map(user => user.id);
    } else if (Array.isArray(targetUsers)) {
      userIds = targetUsers;
    } else {
      res.status(400).json({ error: 'Invalid target users' });
      return;
    }

    // Create notifications for all target users
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      content,
      data: {
        isSystemNotification: true,
        createdBy: req.user!.id
      }
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    res.json({ 
      message: `System notification sent to ${userIds.length} users`,
      recipientCount: userIds.length
    });
  } catch (err) {
    next(err);
  }
};
