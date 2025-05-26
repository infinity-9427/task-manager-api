import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signAccessToken, signRefreshToken } from '../utils/auth.js';
import Joi from 'joi';
const prisma = new PrismaClient();
const loginSchema = Joi.object({
    username: Joi.string().trim().required(),
    password: Joi.string().required(),
});
/**
 * Handles user login.
 * Expects 'username' and 'password' in the request body.
 * Returns access token and refresh token upon successful authentication.
 */
export const loginHandler = async (req, res, next) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { username, password } = value;
        const user = await prisma.user.findUnique({
            where: { username: username.trim().toLowerCase() },
        });
        if (!user) {
            // Generic error for security to prevent username enumeration
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        // For web clients, consider setting the refresh token in an HTTP-only cookie
        // e.g., res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/api/auth/refresh-token' });
        res.json({ accessToken, refreshToken });
    }
    catch (err) {
        next(err);
    }
};
// You can add refreshTokenHandler and logoutHandler here as well if you move them from utils/auth.ts
// For example:
// export { refreshTokenHandler, logoutHandler } from '../utils/auth.js';
// Or, if you prefer to keep them separate, ensure they are correctly imported where needed.
//# sourceMappingURL=auth.js.map