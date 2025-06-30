import express, { RequestHandler } from 'express';
import passport from 'passport';
import { loginHandler, refreshTokenHandler, logoutHandler } from '../utils/auth.js';
import { register, getCurrentUser, changePassword, forgotPassword, resetPassword } from '../controllers/auth.js';
import { requireAuth } from '../utils/auth.js';

const authRouter = express.Router();

// Public routes
authRouter.post('/register', register as RequestHandler);
authRouter.post('/login', loginHandler as RequestHandler);
authRouter.post('/refresh-token', refreshTokenHandler as RequestHandler);
authRouter.post('/forgot-password', forgotPassword as RequestHandler);
authRouter.post('/reset-password', resetPassword as RequestHandler);

// Protected routes
authRouter.get('/me', requireAuth, getCurrentUser as RequestHandler);
authRouter.post('/change-password', requireAuth, changePassword as RequestHandler);
authRouter.post('/logout', requireAuth, logoutHandler as RequestHandler);

export default authRouter;