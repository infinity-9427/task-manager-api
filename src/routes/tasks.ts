import express, { RequestHandler } from 'express';
import { createTask, getAllTasks, getTaskById, updateTask, deleteTask } from '../controllers/tasks.js';

const taskRouter = express.Router();

// Task routes
taskRouter.post('/', createTask as RequestHandler);
taskRouter.get('/', getAllTasks as RequestHandler);
taskRouter.get('/:id', getTaskById as RequestHandler);
taskRouter.put('/:id', updateTask as RequestHandler);
taskRouter.delete('/:id', deleteTask as RequestHandler);

export default taskRouter;