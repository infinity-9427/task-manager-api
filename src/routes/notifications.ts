import express, { RequestHandler } from 'express';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  getNotificationPreferences, 
  updateNotificationPreferences, 
  createSystemNotification 
} from '../controllers/notifications.js';
import { requireAuth } from '../utils/auth.js';

const notificationsRouter = express.Router();

// All notification routes require authentication
notificationsRouter.use(requireAuth);

// User notifications
notificationsRouter.get('/', getUserNotifications as RequestHandler);
notificationsRouter.patch('/:notificationId/read', markNotificationAsRead as RequestHandler);
notificationsRouter.patch('/mark-all-read', markAllNotificationsAsRead as RequestHandler);
notificationsRouter.delete('/:notificationId', deleteNotification as RequestHandler);

// Notification preferences
notificationsRouter.get('/preferences', getNotificationPreferences as RequestHandler);
notificationsRouter.put('/preferences', updateNotificationPreferences as RequestHandler);

// System notifications (admin only)
notificationsRouter.post('/system', createSystemNotification as RequestHandler);

export default notificationsRouter;
