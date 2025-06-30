import express from 'express';
import { loginHandler, refreshTokenHandler, logoutHandler } from '../utils/auth.js';
import { register, getCurrentUser, changePassword, forgotPassword, resetPassword } from '../controllers/auth.js';
import { requireAuth } from '../utils/auth.js';
const authRouter = express.Router();
// Public routes
authRouter.post('/register', register);
authRouter.post('/login', loginHandler);
authRouter.post('/refresh-token', refreshTokenHandler);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
// Protected routes
authRouter.get('/me', requireAuth, getCurrentUser);
authRouter.post('/change-password', requireAuth, changePassword);
authRouter.post('/logout', requireAuth, logoutHandler);
export default authRouter;
//# sourceMappingURL=auth.js.map