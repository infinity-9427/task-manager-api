import express from 'express';
import { createConversation, getUserConversations, getConversationMessages, sendMessage, leaveConversation, addParticipants } from '../controllers/messaging.js';
import { requireAuth } from '../utils/auth.js';
const messagingRouter = express.Router();
// All messaging routes require authentication
messagingRouter.use(requireAuth);
// Conversation management
messagingRouter.post('/conversations', createConversation);
messagingRouter.get('/conversations', getUserConversations);
messagingRouter.get('/conversations/:conversationId/messages', getConversationMessages);
messagingRouter.post('/conversations/:conversationId/messages', sendMessage);
messagingRouter.post('/conversations/:conversationId/participants', addParticipants);
messagingRouter.delete('/conversations/:conversationId/leave', leaveConversation);
export default messagingRouter;
//# sourceMappingURL=messaging.js.map