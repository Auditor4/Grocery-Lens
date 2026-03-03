// ============================================================
// Auth Middleware — Protects API routes
// ============================================================
// Middleware is code that runs BEFORE your route handler.
// This middleware checks if the user is logged in by reading
// their JWT token from the cookie. If valid, it attaches the
// user's info to the request so route handlers can use it.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include our user info
export interface AuthRequest extends Request {
    user?: {
        id: string;
        userId: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

/**
 * Middleware that requires authentication.
 * Reads JWT from cookie, verifies it, and attaches user to request.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
        // 1. Get the token from the cookie
        const token = req.cookies?.token;

        if (!token) {
            res.status(401).json({ success: false, error: 'Not logged in. Please log in first.' });
            return;
        }

        // 2. Verify the token is valid and not expired
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; userId: string };

        // 3. Attach user info to the request
        req.user = {
            id: decoded.id,
            userId: decoded.userId,
        };

        // 4. Continue to the actual route handler
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(user: { id: string; userId: string }): string {
    return jwt.sign(
        { id: user.id, userId: user.userId },
        JWT_SECRET,
        { expiresIn: '30d' }   // Token lasts 30 days
    );
}
