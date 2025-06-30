import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signAccessToken, signRefreshToken } from '../utils/auth.js';
import Joi from 'joi';
import crypto from 'crypto';

const prisma = new PrismaClient();

const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.empty': 'Username or email is required',
    'any.required': 'Username or email is required'
  }),
  password: Joi.string().required(),
});

const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().trim().max(100).optional(),
  lastName: Joi.string().trim().max(100).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

/**
 * Handles user registration
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { username, email, password, firstName, lastName } = value;
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Check for existing username
    const existingUsername = await prisma.user.findUnique({
      where: { username: trimmedUsername }
    });
    if (existingUsername) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });
    if (existingEmail) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: trimmedEmail,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = value;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { email } = value;
    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If the email exists, a reset link has been sent' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { token, newPassword } = value;

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles user login.
 * Expects 'username' (can be username or email) and 'password' in the request body.
 * Returns access token and refresh token upon successful authentication.
 */
export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { username, password } = value;
    const loginIdentifier = username.trim().toLowerCase();

    // Try to find user by email first, then by username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier }
        ]
      }
    });

    if (!user || !user.isActive) {
      // Generic error for security to prevent username enumeration
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() }
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Return user info along with tokens
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken, 
      refreshToken 
    });
  } catch (err) {
    next(err);
  }
};

// You can add refreshTokenHandler and logoutHandler here as well if you move them from utils/auth.ts
// For example:
// export { refreshTokenHandler, logoutHandler } from '../utils/auth.js';
// Or, if you prefer to keep them separate, ensure they are correctly imported where needed.