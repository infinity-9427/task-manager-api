import express, { RequestHandler } from 'express';
import { loginHandler } from '../controllers/auth.js';
// If you move refreshTokenHandler and logoutHandler to auth.controller.ts, import them here too.
// import { refreshTokenHandler, logoutHandler } from '../controllers/auth.js';
// For now, assuming they might still be in utils/auth.ts or will be moved later:
import { refreshTokenHandler, logoutHandler } from '../utils/auth.js';


const authRouter = express.Router();

// Auth routes
authRouter.post('/login', loginHandler as RequestHandler);
authRouter.post('/refresh-token', refreshTokenHandler as RequestHandler);
authRouter.post('/logout', logoutHandler as RequestHandler); // Assuming you want a logout route

export default authRouter;