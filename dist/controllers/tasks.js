import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
const prisma = new PrismaClient();
// Validation schemas
const taskCreationSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').required(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    userId: Joi.number().integer().required(),
});
const taskUpdateSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
});
// CREATE
export const createTask = async (req, res, next) => {
    try {
        // Validate incoming data
        const { error, value } = taskCreationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        // Create task
        const task = await prisma.task.create({ data: value });
        return res.json(task);
    }
    catch (err) {
        return next(err);
    }
};
// READ ALL
export const getAllTasks = async (req, res, next) => {
    try {
        const tasks = await prisma.task.findMany();
        return res.json(tasks);
    }
    catch (err) {
        return next(err);
    }
};
// READ BY ID
export const getTaskById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }
        const task = await prisma.task.findUnique({ where: { id } });
        return task ? res.json(task) : res.status(404).json({ error: 'Task not found' });
    }
    catch (err) {
        return next(err);
    }
};
// UPDATE
export const updateTask = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }
        // Validate incoming data
        const { error, value } = taskUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const task = await prisma.task.update({ where: { id }, data: value });
        return res.json(task);
    }
    catch (err) {
        return next(err);
    }
};
// DELETE
export const deleteTask = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }
        await prisma.task.delete({ where: { id } });
        return res.json({ message: 'Task deleted' });
    }
    catch (err) {
        return next(err);
    }
};
//# sourceMappingURL=tasks.js.map