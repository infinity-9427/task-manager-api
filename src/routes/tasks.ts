import express, { RequestHandler } from 'express';
import { createTask, getAllTasks, getTaskById, updateTask, deleteTask } from '../controllers/tasks.js';
import { requireAuth } from '../utils/auth.js';

const taskRouter = express.Router();

// Task routes (all require authentication)
taskRouter.post('/', requireAuth, createTask as RequestHandler);
taskRouter.get('/', requireAuth, getAllTasks as RequestHandler);
taskRouter.get('/:id', requireAuth, getTaskById as RequestHandler);
taskRouter.put('/:id', requireAuth, updateTask as RequestHandler);
taskRouter.delete('/:id', requireAuth, deleteTask as RequestHandler);

export default taskRouter;