import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { uploadImage, deleteImage } from '../helpers/imageUploader.js';
const prisma = new PrismaClient();
const saltRounds = 10;
const userSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    image: Joi.object({
        url: Joi.string().uri().optional(),
        public_id: Joi.string().optional()
    }).optional()
});
/**
 * Check if username already exists (case-insensitive, trimmed)
 */
const isUsernameExisting = async (username, excludeUserId) => {
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
export const createUser = async (req, res, next) => {
    try {
        const { error, value } = userSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { username, password: plainPassword } = value;
        const trimmedUsername = username.trim();
        // Check for username duplication before proceeding with expensive operations
        if (await isUsernameExisting(trimmedUsername)) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }
        // Process image if provided
        let finalImagePayload = value.image || {};
        if (req.files?.image) {
            const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
            const uploadedImage = await uploadImage(imageFile);
            if (uploadedImage) {
                finalImagePayload = uploadedImage;
            }
        }
        // Hash password and create user
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        const user = await prisma.user.create({
            data: {
                username: trimmedUsername.toLowerCase(), // Store username in lowercase for consistency
                password: hashedPassword,
                image: finalImagePayload
            }
        });
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
    }
    catch (err) {
        next(err);
    }
};
export const getUser = async (req, res, next) => {
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
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        }
        else {
            res.status(404).json({ error: 'User not found' });
        }
    }
    catch (err) {
        next(err);
    }
};
export const updateUser = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid user ID' });
            return;
        }
        const { error, value } = userSchema.validate(req.body, {
            abortEarly: false,
            context: { isUpdate: true }
        });
        if (error) {
            res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
            return;
        }
        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (!currentUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const dataToUpdate = {};
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
        const currentImage = currentUser.image;
        const oldPublicId = currentImage?.public_id || null;
        if (req.files?.image) {
            if (oldPublicId) {
                await deleteImage(oldPublicId);
            }
            const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
            const newImage = await uploadImage(imageFile);
            dataToUpdate.image = newImage || {};
        }
        else if (value.hasOwnProperty('image')) {
            if (typeof value.image === 'object' && Object.keys(value.image).length === 0) {
                if (oldPublicId) {
                    await deleteImage(oldPublicId);
                }
                dataToUpdate.image = {};
            }
            else if (typeof value.image === 'object' && value.image !== null) {
                const newPublicIdFromBody = value.image.public_id;
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
            const { password, ...userWithoutPassword } = currentUser;
            res.json({ user: userWithoutPassword, message: "No changes provided." });
            return;
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });
        const { password, ...userWithoutPassword } = updatedUser;
        res.json({ user: userWithoutPassword });
    }
    catch (err) {
        next(err);
    }
};
export const deleteUser = async (req, res, next) => {
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
        const imageToDelete = userToDelete.image;
        if (imageToDelete?.public_id) {
            await deleteImage(imageToDelete.public_id);
        }
        await prisma.task.deleteMany({
            where: { userId: id },
        });
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: 'User and associated tasks deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=users.js.map