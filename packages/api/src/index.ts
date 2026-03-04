// ============================================================
// GroceryLens API — Express Server Entry Point
// ============================================================
// This is the STARTING POINT of the backend. When you run
// "npm run dev" in the api package, Node.js executes this file.
// It sets up the Express server and connects all the routes.
// ============================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import our route modules
import authRoutes from './routes/auth.js';
import entryRoutes from './routes/entries.js';
import analyticsRoutes from './routes/analytics.js';
import groupRoutes from './routes/groups.js';
import categoryRoutes from './routes/categories.js';
import autocompleteRoutes from './routes/autocomplete.js';
import exportRoutes from './routes/export.js';

// ─── Create the Express app ─────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware Setup ────────────────────────────────────
// Middleware = code that runs on EVERY request before your routes

// 1. CORS: Allow the frontend (different port) to talk to the backend
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        const configuredOrigin = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        if (configuredOrigin && origin === configuredOrigin) {
            return callback(null, true);
        }
        return callback(new Error('Blocked by CORS'));
    },
    credentials: true,
}));

// 2. Parse JSON request bodies (so we can read req.body)
app.use(express.json());

// 3. Parse cookies (so we can read req.cookies)
app.use(cookieParser());

// ─── Mount Routes ────────────────────────────────────────
// Each route module handles a different "section" of the API
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/autocomplete', autocompleteRoutes);
app.use('/api/export', exportRoutes);

// ─── Health Check ────────────────────────────────────────
// A simple endpoint to check if the server is running
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error. Please try again.',
    });
});

// ─── Start the Server ────────────────────────────────────
// Only call app.listen if we are NOT running on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('');
        console.log('🛒 ═══════════════════════════════════════════');
        console.log(`🛒  GroceryLens API running on port ${PORT}`);
        console.log(`🛒  http://localhost:${PORT}/api/health`);
        console.log('🛒 ═══════════════════════════════════════════');
        console.log('');
    });
}

// Vercel needs this export to consume your Express app as a serverless function
export default app;