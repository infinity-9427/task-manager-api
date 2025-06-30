import express from 'express';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getNotificationPreferences, updateNotificationPreferences, createSystemNotification } from '../controllers/notifications.js';
import { requireAuth } from '../utils/auth.js';
const notificationsRouter = express.Router();
// All notification routes require authentication
notificationsRouter.use(requireAuth);
// User notifications
notificationsRouter.get('/', getUserNotifications);
notificationsRouter.patch('/:notificationId/read', markNotificationAsRead);
notificationsRouter.patch('/mark-all-read', markAllNotificationsAsRead);
notificationsRouter.delete('/:notificationId', deleteNotification);
// Notification preferences
notificationsRouter.get('/preferences', getNotificationPreferences);
notificationsRouter.put('/preferences', updateNotificationPreferences);
// System notifications (admin only)
notificationsRouter.post('/system', createSystemNotification);
export default notificationsRouter;
//# sourceMappingURL=notifications.js.map