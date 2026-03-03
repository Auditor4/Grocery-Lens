// ============================================================
// Auth Routes — Sign Up, Log In, Log Out
// ============================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateUID } from '../services/uid.js';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

// Validation rules for User ID
const VALIDATION = {
    USER_ID_MIN: 4,
    USER_ID_MAX: 20,
    USER_ID_PATTERN: /^[a-zA-Z0-9_]+$/,
};

const router = Router();
const prisma = new PrismaClient();

// Rate limit: 5 login attempts per minute per User ID
const loginLimiter = rateLimit(5, 60 * 1000, (req) => `login:${req.body?.userId?.toLowerCase() || 'unknown'}`);

// ─── POST /api/auth/register ─────────────────────────────
// Creates a new account. Returns the UID ONCE — user must save it!
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        // Validate User ID format
        if (!userId || typeof userId !== 'string') {
            res.status(400).json({ success: false, error: 'User ID is required.' });
            return;
        }

        const cleanUserId = userId.trim().toLowerCase();

        if (cleanUserId.length < VALIDATION.USER_ID_MIN || cleanUserId.length > VALIDATION.USER_ID_MAX) {
            res.status(400).json({
                success: false,
                error: `User ID must be ${VALIDATION.USER_ID_MIN}-${VALIDATION.USER_ID_MAX} characters.`,
            });
            return;
        }

        if (!VALIDATION.USER_ID_PATTERN.test(cleanUserId)) {
            res.status(400).json({
                success: false,
                error: 'User ID can only contain letters, numbers, and underscores.',
            });
            return;
        }

        // Check if User ID is already taken
        const existing = await prisma.user.findUnique({ where: { userId: cleanUserId } });
        if (existing) {
            res.status(409).json({ success: false, error: 'This User ID is already taken.' });
            return;
        }

        // Generate UID and hash it
        const uid = generateUID();
        const uidHash = await bcrypt.hash(uid, 10);

        // Create the user
        const user = await prisma.user.create({
            data: {
                userId: cleanUserId,
                uidHash: uidHash,
                displayName: cleanUserId,
            },
        });

        // Generate JWT and set cookie
        const token = generateToken({ id: user.id, userId: user.userId });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Return the UID — this is the ONLY time it's shown!
        res.status(201).json({
            success: true,
            data: {
                userId: user.userId,
                uid: uid,           // ⚠️ Shown only once!
                displayName: user.displayName,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
    }
});

// ─── POST /api/auth/login ────────────────────────────────
// Log in with User ID + UID pair
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, uid } = req.body;

        if (!userId || !uid) {
            res.status(400).json({ success: false, error: 'User ID and UID are both required.' });
            return;
        }

        const cleanUserId = userId.trim().toLowerCase();

        // Find the user
        const user = await prisma.user.findUnique({ where: { userId: cleanUserId } });

        if (!user) {
            // Don't reveal whether the User ID exists
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
            return;
        }

        // Compare the provided UID with the stored hash
        const isValid = await bcrypt.compare(uid.trim(), user.uidHash);

        if (!isValid) {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
            return;
        }

        // Update last login time
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate JWT and set cookie
        const token = generateToken({ id: user.id, userId: user.userId });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            data: {
                userId: user.userId,
                displayName: user.displayName,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong.' });
    }
});

// ─── POST /api/auth/logout ───────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
    res.clearCookie('token');
    res.json({ success: true, data: { message: 'Logged out successfully.' } });
});

// ─── GET /api/auth/me ────────────────────────────────────
// Check if user is logged in and get their info
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { id: true, userId: true, displayName: true, createdAt: true },
        });

        if (!user) {
            res.status(404).json({ success: false, error: 'User not found.' });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong.' });
    }
});

// ─── GET /api/auth/check-userid ──────────────────────────
// Check if a User ID is available (for real-time validation during signup)
router.get('/check-userid', async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
        res.json({ success: true, data: { available: false } });
        return;
    }
    const existing = await prisma.user.findUnique({ where: { userId: userId.toLowerCase() } });
    res.json({ success: true, data: { available: !existing } });
});

// ─── DELETE /api/auth/account ────────────────────────────
// Delete the logged-in user's account
router.delete('/account', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await prisma.user.delete({ where: { id: req.user!.id } });
        res.clearCookie('token');
        res.json({ success: true, data: { message: 'Account deleted.' } });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong.' });
    }
});

export default router;
