// ============================================================
// Export Route — CSV export of grocery data
// ============================================================

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ─── GET /api/export/csv ────────────────────────────────
router.get('/csv', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, scopeType = 'PERSONAL', groupId } = req.query as Record<string, string>;

        const where: any = {};

        if (scopeType === 'GROUP' && groupId) {
            where.groupId = groupId;
            where.scopeType = 'GROUP';
        } else {
            where.addedBy = req.user!.id;
            where.scopeType = 'PERSONAL';
        }

        if (startDate) where.purchaseDate = { ...(where.purchaseDate || {}), gte: new Date(startDate) };
        if (endDate) where.purchaseDate = { ...(where.purchaseDate || {}), lte: new Date(endDate) };

        const entries = await prisma.groceryEntry.findMany({
            where,
            include: {
                category: true,
                user: { select: { displayName: true } },
            },
            orderBy: { purchaseDate: 'desc' },
        });

        // Build CSV
        const headers = ['Date', 'Item', 'Amount (Rs.)', 'Quantity', 'Unit', 'Category', 'Channel', 'Added By', 'Notes'];
        const rows = entries.map((e) => [
            e.purchaseDate.toISOString().split('T')[0],
            `"${e.name}"`,
            e.amount.toString(),
            e.quantity.toString(),
            e.unit,
            `"${e.category.name}"`,
            e.channel,
            `"${e.user.displayName}"`,
            `"${e.notes || ''}"`,
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=grocerylens-export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: 'Export failed.' });
    }
});

export default router;
