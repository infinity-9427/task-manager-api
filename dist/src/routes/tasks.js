import express from 'express';
import { createTask, getAllTasks, getTaskById, updateTask, deleteTask } from '../controllers/tasks.js';
const taskRouter = express.Router();
// Task routes
taskRouter.post('/', createTask);
taskRouter.get('/', getAllTasks);
taskRouter.get('/:id', getTaskById);
taskRouter.put('/:id', updateTask);
taskRouter.delete('/:id', deleteTask);
export default taskRouter;
//# sourceMappingURL=tasks.js.map