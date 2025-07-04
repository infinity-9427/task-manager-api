import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

const prisma = new PrismaClient();

// --- Passport Configuration ---
// Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'username', // Can be username or email
    passwordField: 'password'
  },
  async (username: string, password: string, done) => {
    try {
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

      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Return user without password for security
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
));

// JWT Strategy for token-based authentication
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatar: true
        }
      });

      if (!user || !user.isActive) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Passport serialization (for session-based auth if needed)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatar: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// --- Environment Variables ---
// Ensure these are set in your .env file for security and configurability.
//
// ACCESS_TOKEN_SECRET: A strong, random string for signing access tokens.
// REFRESH_TOKEN_SECRET: A strong, random string for signing refresh tokens (must be different from access token secret).
// ACCESS_TOKEN_EXPIRATION: How long access tokens are valid (e.g., '15m', '1h').
// REFRESH_TOKEN_EXPIRATION: How long refresh tokens are valid (e.g., '7d', '30d').
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-in-production';
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

// --- Refresh Token Store (In-Memory) ---
// WARNING: This in-memory store is for demonstration purposes only and is NOT suitable for production.
// In a production environment, use a persistent, secure store like Redis or a database table for refresh tokens.
interface RefreshTokenRecord {
  userId: number;
  expiresAt: number;
}
const refreshTokensStore: { [token: string]: RefreshTokenRecord } = {};

// --- Helper Functions ---
const parseExpiryToMilliseconds = (expiryString: string): number => {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1), 10);
    if (isNaN(value)) return 0; // Should not happen with valid config

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0; // Fallback, should be configured correctly
    }
};

// --- Token Generation ---
export const signAccessToken = (userId: number): string => {
  let expiresInSeconds: number;
  const rawExpiryString = ACCESS_TOKEN_EXPIRATION;
  // parseExpiryToMilliseconds returns 0 for invalid formats or legitimate "0" values
  const milliseconds = parseExpiryToMilliseconds(rawExpiryString);

  // Check if parsing resulted in 0ms due to an invalid format (and not a deliberate "0s", "0m", etc.)
  if (milliseconds === 0 && !['0s', '0m', '0h', '0d'].includes(rawExpiryString.toLowerCase())) {
    console.warn(`[Auth] Invalid format or unhandled zero value for ACCESS_TOKEN_EXPIRATION: "${rawExpiryString}". Defaulting to 15 minutes.`);
    expiresInSeconds = 15 * 60; // 15 minutes in seconds
  } else {
    expiresInSeconds = milliseconds / 1000;
  }
  
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: expiresInSeconds });
};

export const signRefreshToken = (userId: number): string => {
  let expiresInSecondsForJwt: number;
  let durationMillisecondsForStore: number;
  const rawExpiryString = REFRESH_TOKEN_EXPIRATION;
  
  const parsedMilliseconds = parseExpiryToMilliseconds(rawExpiryString);

  if (parsedMilliseconds === 0 && !['0s', '0m', '0h', '0d'].includes(rawExpiryString.toLowerCase())) {
    console.warn(`[Auth] Invalid format or unhandled zero value for REFRESH_TOKEN_EXPIRATION: "${rawExpiryString}". Defaulting to 7 days.`);
    expiresInSecondsForJwt = 7 * 24 * 60 * 60; // 7 days in seconds
    durationMillisecondsForStore = expiresInSecondsForJwt * 1000; // Use default duration in ms for store
  } else {
    expiresInSecondsForJwt = parsedMilliseconds / 1000;
    durationMillisecondsForStore = parsedMilliseconds;
  }

  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: expiresInSecondsForJwt });
  
  refreshTokensStore[refreshToken] = {
    userId,
    expiresAt: Date.now() + durationMillisecondsForStore,
  };
  return refreshToken;
};

// --- Token Verification ---
export const verifyToken = async (token: string, secret: string): Promise<jwt.JwtPayload | null> => {
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    return decoded;
  } catch (error) {
    // Catches errors like TokenExpiredError, JsonWebTokenError
    return null;
  }
};

// --- Express Request User Augmentation ---
// Note: User type already defined by Passport, extending it
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
      isActive: boolean;
      avatar?: any;
    }
  }
}

// --- Authentication Middleware ---
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token is required' });
    return;
  }

  const decoded = await verifyToken(token, ACCESS_TOKEN_SECRET);

  if (!decoded || typeof decoded.userId !== 'number') {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  // Optional: Check if user still exists in DB, though this adds DB lookup per request.
  const user = await prisma.user.findUnique({ 
    where: { id: decoded.userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      avatar: true
    }
  });
  if (!user || !user.isActive) {
    res.status(403).json({ error: 'User not found or inactive' });
    return;
  }

  req.user = user;
  next();
};

// --- Authorization Middleware ---
export const requireAuth = passport.authenticate('jwt', { session: false });

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdminOrOwner = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = req.user.id === parseInt(req.params[userIdField]) || 
                    req.user.id === parseInt(req.body[userIdField]);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// --- Route Handlers ---

/**
 * Handles user login.
 * Expects 'username' (can be username or email) and 'password' in the request body.
 * Returns access token and refresh token upon successful authentication.
 */
export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username/email and password are required' });
      return;
    }

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
      res.status(401).json({ error: 'Invalid credentials' }); // Generic error for security
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

    // Return user info along with tokens (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({ 
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken, 
      refreshToken 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles refreshing an access token using a refresh token.
 * Expects 'token' (the refresh token) in the request body.
 * Returns a new access token if the refresh token is valid.
 */
export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token: refreshTokenFromBody } = req.body;

    if (!refreshTokenFromBody) {
      res.status(401).json({ error: 'Refresh token is required' });
      return;
    }

    const storedTokenInfo = refreshTokensStore[refreshTokenFromBody];
    if (!storedTokenInfo || storedTokenInfo.expiresAt < Date.now()) {
      if (storedTokenInfo) delete refreshTokensStore[refreshTokenFromBody]; // Clean up
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    
    const decoded = await verifyToken(refreshTokenFromBody, REFRESH_TOKEN_SECRET);
    if (!decoded || typeof decoded.userId !== 'number' || decoded.userId !== storedTokenInfo.userId) {
      delete refreshTokensStore[refreshTokenFromBody]; // Security: remove potentially compromised/mismatched token
      res.status(403).json({ error: 'Invalid refresh token' });
      return;
    }

    // Ensure the user associated with the token still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
        delete refreshTokensStore[refreshTokenFromBody]; // Clean up
        res.status(403).json({ error: 'User for refresh token not found' });
        return;
    }

    const newAccessToken = signAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
    // Note: For enhanced security, consider refresh token rotation:
    // 1. Invalidate the current refresh token (delete from store).
    // 2. Issue a new refresh token along with the new access token.
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user logout.
 * Expects 'token' (the refresh token) in the request body to invalidate it.
 */
export const logoutHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token: refreshTokenFromBody } = req.body;

        if (refreshTokenFromBody && refreshTokensStore[refreshTokenFromBody]) {
            delete refreshTokensStore[refreshTokenFromBody];
        }
        // Access tokens are typically short-lived and stateless.
        // For immediate revocation of access tokens, a blacklist mechanism (e.g., Redis) would be needed.
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// --- In-Memory Store Cleanup (Demonstration) ---
// Periodically clean up expired refresh tokens from the in-memory store.
// This is a simplistic approach; a robust solution would depend on the chosen persistent store.
const cleanupInterval = 60 * 60 * 1000; // 1 hour
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const token in refreshTokensStore) {
        if (refreshTokensStore[token].expiresAt < now) {
            delete refreshTokensStore[token];
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(`Auth: Cleaned up ${cleanedCount} expired refresh tokens from in-memory store.`);
    }
}, cleanupInterval);

/*
Security Best Practices for JWT Authentication:
1.  HTTPS: Always use HTTPS to protect tokens in transit.
2.  Strong Secrets: Use strong, randomly generated secrets for JWTs. Store them securely as environment variables.
    Do NOT hardcode secrets in the codebase.
3.  Algorithm Choice: Use strong algorithms (e.g., HS256, RS256). Avoid 'none' algorithm.
4.  Token Expiry:
    -   Access Tokens: Keep them short-lived (e.g., 5-60 minutes).
    -   Refresh Tokens: Can be longer-lived (e.g., days or weeks) but must also expire.
5.  Secure Refresh Token Handling:
    -   Storage: Store refresh tokens securely.
        -   Client-side (web): HTTP-only cookies are preferred to mitigate XSS.
        -   Server-side: If storing (e.g., for revocation list), hash them or use a secure, dedicated token store.
    -   Transmission: Only transmit refresh tokens over HTTPS, typically to a dedicated token refresh endpoint.
6.  Refresh Token Rotation (Recommended): When a refresh token is used, issue a new refresh token and invalidate the old one.
    This helps detect token theft and limits the window of opportunity for a compromised token.
7.  Token Revocation/Invalidation: Implement a mechanism to revoke tokens (especially refresh tokens) on events like:
    -   Logout
    -   Password change
    -   Suspected security incident
    This often involves maintaining a blacklist or a versioning system for tokens.
8.  Input Validation: Validate all inputs (e.g., username, password, tokens from request body/headers).
9.  Rate Limiting: Apply rate limiting to login and token refresh endpoints to protect against brute-force attacks.
10. Logging: Log authentication attempts (both successful and failed), token issuance, and refresh events for security monitoring and auditing.
11. User Context: The `authenticateToken` middleware correctly adds user identification to `req.user` for use in protected routes.
12. Principle of Least Privilege: Tokens should contain only necessary claims. Avoid putting sensitive data in JWT payloads.
*/