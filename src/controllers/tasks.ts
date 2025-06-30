import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const taskCreationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  projectId: Joi.number().integer().optional(),
  assignedToId: Joi.number().integer().optional(),
  dueDate: Joi.date().iso().optional(),
  estimatedHours: Joi.number().positive().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  projectId: Joi.number().integer().optional(),
  assignedToId: Joi.number().integer().optional(),
  dueDate: Joi.date().iso().optional(),
  estimatedHours: Joi.number().positive().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  completionPercentage: Joi.number().min(0).max(100).optional(),
});

// CREATE
export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Validate incoming data
    const { error, value } = taskCreationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    // Create task with the authenticated user as creator
    const taskData = {
      ...value,
      createdById: req.user.id,
    };

    const task = await prisma.task.create({ 
      data: taskData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        project: true,
      }
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// READ ALL
export const getAllTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// READ BY ID
export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    next(err);
  }
};

// UPDATE
export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    // Validate incoming data against the updated schema
    const { error, value } = taskUpdateSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    // Check if the task exists before attempting to update
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // If assignedToId is provided in the update payload, check if the new user exists
    // This assumes you have a User model and prisma.user accessor
    if (value.assignedToId !== undefined && value.assignedToId !== null) {
      // Check if the user is actually being changed to a new one or set
      if (existingTask.assignedToId !== value.assignedToId) {
        const userExists = await prisma.user.findUnique({ where: { id: value.assignedToId } });
        if (!userExists) {
          res.status(400).json({ error: `User with ID ${value.assignedToId} not found. Cannot reassign task.` });
          return;
        }
      }
    } else if (value.hasOwnProperty('assignedToId') && value.assignedToId === null) {
        // If assignedToId is explicitly set to null (if your schema allows it, e.g. for unassigning)
        // Ensure your database schema for Task.assignedToId allows NULL.
        // If assignedToId is non-nullable in DB, Prisma will error.
        // This example assumes assignedToId can be set to null if desired.
        // If userId is mandatory, this else if block might not be needed or handled differently.
    }


    const updatedTask = await prisma.task.update({
      where: { id },
      data: value, // 'value' will now include 'userId' if it was in the request body and validated
    });
    res.json(updatedTask);
  } catch (err) {
    // Handle specific Prisma errors
    if (err.code === 'P2025') { // Prisma error code for "Record to update not found"
      res.status(404).json({ error: 'Task not found during update operation.' });
      return;
    }
    if (err.code === 'P2003') { // Prisma error for "Foreign key constraint failed"
                                // This can happen if value.userId is invalid and not caught by the check above
      res.status(400).json({ error: 'Invalid userId: The specified user does not exist or constraint failed.' });
      return;
    }
    next(err);
  }
};

// DELETE
export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};