import express, { RequestHandler } from 'express';
import { 
  createConversation, 
  getUserConversations, 
  getConversationMessages, 
  sendMessage, 
  leaveConversation, 
  addParticipants 
} from '../controllers/messaging.js';
import { requireAuth } from '../utils/auth.js';

const messagingRouter = express.Router();

// All messaging routes require authentication
messagingRouter.use(requireAuth);

// Conversation management
messagingRouter.post('/conversations', createConversation as RequestHandler);
messagingRouter.get('/conversations', getUserConversations as RequestHandler);
messagingRouter.get('/conversations/:conversationId/messages', getConversationMessages as RequestHandler);
messagingRouter.post('/conversations/:conversationId/messages', sendMessage as RequestHandler);
messagingRouter.post('/conversations/:conversationId/participants', addParticipants as RequestHandler);
messagingRouter.delete('/conversations/:conversationId/leave', leaveConversation as RequestHandler);

export default messagingRouter;
