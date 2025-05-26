import express, { RequestHandler } from 'express';
import { createUser, getUser, updateUser, deleteUser } from '../controllers/users.js';

const userRouter = express.Router();

// User routes
userRouter.post('/', createUser as RequestHandler);
userRouter.get('/:id', getUser as RequestHandler);
userRouter.put('/:id', updateUser as RequestHandler);
userRouter.delete('/:id', deleteUser as RequestHandler);

export default userRouter;