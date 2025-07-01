import express, { RequestHandler } from 'express';
import { createTask, getAllTasks, getTaskById, updateTask, deleteTask } from '../controllers/tasks.js';
import { requireAuth } from '../utils/auth.js';

const taskRouter = express.Router();

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Create a new task
 *     description: Create a new task with title, description, and other properties
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               status:
 *                 type: string
 *                 enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
 *                 default: 'PENDING'
 *               priority:
 *                 type: string
 *                 enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
 *                 default: 'MEDIUM'
 *               projectId:
 *                 type: integer
 *                 description: Project ID
 *               assignedToId:
 *                 type: integer
 *                 description: Assigned user ID
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date (ISO format)
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0
 *                 description: Estimated hours
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task tags
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
taskRouter.post('/', requireAuth, createTask as RequestHandler);

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get all tasks
 *     description: Retrieve all tasks for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
 *         description: Filter by task priority
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
taskRouter.get('/', requireAuth, getAllTasks as RequestHandler);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
taskRouter.get('/:id', requireAuth, getTaskById as RequestHandler);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     tags:
 *       - Tasks
 *     summary: Update task
 *     description: Update an existing task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               status:
 *                 type: string
 *                 enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
 *               priority:
 *                 type: string
 *                 enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
 *               projectId:
 *                 type: integer
 *                 description: Project ID
 *               assignedToId:
 *                 type: integer
 *                 description: Assigned user ID
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date (ISO format)
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0
 *                 description: Estimated hours
 *               completionPercentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Completion percentage
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task tags
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
taskRouter.put('/:id', requireAuth, updateTask as RequestHandler);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     tags:
 *       - Tasks
 *     summary: Delete task
 *     description: Delete a task by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task deleted"
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
taskRouter.delete('/:id', requireAuth, deleteTask as RequestHandler);

export default taskRouter;