import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcrypt'; 
import { uploadImage, deleteImage } from '../helpers/imageUploader.js';
import { excludePassword, validatePasswordStrength } from '../utils/passwordSecurity.js';

const prisma = new PrismaClient();
const saltRounds = 12; // Increased for better security, consistent with auth controller 

// Get all users with pagination and filtering
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          isOnline: true,
          lastSeen: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (err) {
    next(err);
  }
};

// Custom password validation function
const passwordValidation = (value: string, helpers: any) => {
  const { isValid, errors } = validatePasswordStrength(value);
  if (!isValid) {
    return helpers.error('any.custom', { errors });
  }
  return value;
};

// Schema for creating a new user (password required)
const createUserSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
    .required()
    .custom(passwordValidation)
    .messages({
      'any.custom': 'Password validation failed: {{#errors}}'
    }),
  firstName: Joi.string().trim().max(100).optional(),
  lastName: Joi.string().trim().max(100).optional(),
  image: Joi.object({
    url: Joi.string().uri().optional(),
    public_id: Joi.string().optional()
  }).optional()
});

// Schema for updating a user (all fields optional except constraints)
const updateUserSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string()
    .min(6)
    .optional()
    .custom(passwordValidation)
    .messages({
      'any.custom': 'Password validation failed: {{#errors}}'
    }),
  firstName: Joi.string().trim().max(100).optional(),
  lastName: Joi.string().trim().max(100).optional(),
  image: Joi.object({
    url: Joi.string().uri().optional(),
    public_id: Joi.string().optional()
  }).optional()
});

/**
 * Check if username already exists (case-insensitive, trimmed)
 */
const isUsernameExisting = async (username: string, excludeUserId?: number): Promise<boolean> => {
  const trimmedUsername = username.trim().toLowerCase();
  
  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        mode: 'insensitive', // PostgreSQL case-insensitive search
        equals: trimmedUsername,
      },
      ...(excludeUserId && { id: { not: excludeUserId } })
    },
  });
  
  return !!existingUser;
};

// Create user
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { username, email, password: plainPassword, firstName, lastName } = value;
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Check for username duplication before proceeding with expensive operations
    if (await isUsernameExisting(trimmedUsername)) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Check for email duplication
    const existingEmail = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });
    if (existingEmail) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Process image if provided
    let finalImagePayload = value.image || {};
    if (req.files?.image) {
      const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      const uploadedImage = await uploadImage(imageFile as { tempFilePath: string });
      if (uploadedImage) {
        finalImagePayload = uploadedImage; 
      }
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername.toLowerCase(), // Store username in lowercase for consistency
        email: trimmedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        avatar: finalImagePayload
      }
    });
    const userWithoutPassword = excludePassword(user);
    res.status(201).json({ user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (user) {
      const userWithoutPassword = excludePassword(user);
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      res.status(400).json({ error: error.details.map((d: any) => d.message).join(', ') });
      return;
    }

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const dataToUpdate: any = {};

    // Handle username update if provided
    if (value.username !== undefined) {
      const trimmedUsername = value.username.trim();
      const currentTrimmedUsername = currentUser.username.trim().toLowerCase();
      
      if (trimmedUsername.toLowerCase() !== currentTrimmedUsername) {
        // Check for username duplication before proceeding
        if (await isUsernameExisting(trimmedUsername, id)) {
          res.status(409).json({ error: 'Username already taken' });
          return;
        }
        dataToUpdate.username = trimmedUsername.toLowerCase();
      }
    }

    // Handle image update if provided
    const currentImage = currentUser.avatar as ({ public_id?: string } | null);
    const oldPublicId = currentImage?.public_id || null;

    if (req.files?.image) { 
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
      const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      const newImage = await uploadImage(imageFile as { tempFilePath: string });
      dataToUpdate.image = newImage || {};
    } else if (value.hasOwnProperty('image')) {
      if (typeof value.image === 'object' && Object.keys(value.image).length === 0) {
        if (oldPublicId) {
          await deleteImage(oldPublicId);
        }
        dataToUpdate.image = {};
      } else if (typeof value.image === 'object' && value.image !== null) {
        const newPublicIdFromBody = (value.image as any).public_id;
        if (oldPublicId && oldPublicId !== newPublicIdFromBody) {
          await deleteImage(oldPublicId);
        }
        dataToUpdate.image = value.image;
      }
    }

    // Handle password update if provided
    if (value.password !== undefined) {
      const hashedPassword = await bcrypt.hash(value.password, saltRounds);
      dataToUpdate.password = hashedPassword;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      const userWithoutPassword = excludePassword(currentUser);
      res.json({ user: userWithoutPassword, message: "No changes provided." });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
    const userWithoutPassword = excludePassword(updatedUser);
    res.json({ user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const imageToDelete = userToDelete.avatar as ({ public_id?: string } | null);
    if (imageToDelete?.public_id) {
      await deleteImage(imageToDelete.public_id);
    }

    await prisma.task.deleteMany({
      where: { 
        OR: [
          { assignedToId: id },
          { createdById: id }
        ]
      },
    });

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: 'User and associated tasks deleted successfully' });
  } catch (err) {
    next(err);
  }
};