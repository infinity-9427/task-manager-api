import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
const prisma = new PrismaClient();
const userSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    image: Joi.object({
        url: Joi.string().uri().optional(),
        public_id: Joi.string().optional()
    }).optional()
});
// Create user
export async function createUser(req, res, next) {
    try {
        const { error, value } = userSchema.validate(req.body);
        if (error)
            return next(error);
        const user = await prisma.user.create({
            data: {
                username: value.username,
                password: value.password,
                image: value.image || {}
            }
        });
        res.status(201).json({ user });
    }
    catch (err) {
        next(err);
    }
}
// Get user by ID
export async function getUser(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(req.params.id) }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    }
    catch (err) {
        next(err);
    }
}
// Update user
export async function updateUser(req, res, next) {
    try {
        const { error, value } = userSchema.validate(req.body, { allowUnknown: true });
        if (error)
            return next(error);
        const user = await prisma.user.update({
            where: { id: Number(req.params.id) },
            data: {
                username: value.username,
                password: value.password,
                image: value.image || {}
            }
        });
        res.json({ user });
    }
    catch (err) {
        next(err);
    }
}
// Delete user
export async function deleteUser(req, res, next) {
    try {
        await prisma.user.delete({
            where: { id: Number(req.params.id) }
        });
        res.json({ message: 'User deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=users.js.map