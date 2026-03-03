// ============================================================
// Rate Limiter — Prevents brute-force attacks
// ============================================================
// If someone tries to guess a UID by trying thousands of
// combinations, this middleware stops them after 5 attempts
// per minute. It uses an in-memory store (simple Map).
// ============================================================

import { Request, Response, NextFunction } from 'express';

// Store: maps an identifier (like a User ID) to attempt data
const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Create a rate limiter middleware.
 * @param maxAttempts - Max attempts allowed in the window
 * @param windowMs   - Time window in milliseconds
 * @param keyFn      - Function to extract the rate limit key from the request
 */
export function rateLimit(
    maxAttempts: number,
    windowMs: number,
    keyFn: (req: Request) => string
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyFn(req);
        const now = Date.now();

        // Get or create the record for this key
        let record = attempts.get(key);

        if (!record || now > record.resetAt) {
            // First attempt or window expired — start fresh
            record = { count: 1, resetAt: now + windowMs };
            attempts.set(key, record);
            next();
            return;
        }

        // Increment the counter
        record.count++;

        if (record.count > maxAttempts) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            res.status(429).json({
                success: false,
                error: `Too many attempts. Please try again in ${retryAfter} seconds.`,
            });
            return;
        }

        next();
    };
}

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts) {
        if (now > record.resetAt) {
            attempts.delete(key);
        }
    }
}, 5 * 60 * 1000);
