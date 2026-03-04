// ============================================================
// Autocomplete Route — Suggests item names from history
// ============================================================

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ─── GET /api/autocomplete ──────────────────────────────
// Search past item names for autocomplete
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q, scopeType = 'PERSONAL', groupId } = req.query as Record<string, string>;

        if (!q || q.length < 1) {
            res.json({ success: true, data: [] });
            return;
        }

        const scopeFilter = scopeType === 'GROUP' && groupId
            ? { groupId, scopeType: 'GROUP' as const }
            : { addedBy: req.user!.id, scopeType: 'PERSONAL' as const };

        // Find recent entries matching the query
        const entries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                name: { contains: q, mode: 'insensitive' },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { category: true },
        });

        // De-duplicate by item name (case-insensitive) and return the most recent version
        const seen = new Map<string, typeof entries[0]>();
        for (const entry of entries) {
            const key = entry.name.toLowerCase();
            if (!seen.has(key)) {
                seen.set(key, entry);
            }
        }

        const suggestions = Array.from(seen.values())
            .slice(0, 10)
            .map((entry) => ({
                name: entry.name,
                quantity: entry.quantity,
                unit: entry.unit,
                channel: entry.channel,
                categoryId: entry.categoryId,
                categoryName: entry.category.name,
                lastAmount: entry.amount,
            }));

        res.json({ success: true, data: suggestions });
    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({ success: false, error: 'Autocomplete failed.' });
    }
});

export default router;
