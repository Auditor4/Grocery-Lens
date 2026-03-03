// ============================================================
// Grocery Entry Routes — Add, List, Update, Delete items
// ============================================================

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All entry routes require authentication
router.use(requireAuth);

// ─── GET /api/entries ────────────────────────────────────
// List entries with optional filters
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            scopeType = 'PERSONAL',
            groupId,
            startDate,
            endDate,
            categoryId,
            channel,
            search,
            page = '1',
            limit = '20',
        } = req.query as Record<string, string>;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build filter conditions
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
        if (categoryId) where.categoryId = categoryId;
        if (channel) where.channel = channel;
        if (search) where.name = { contains: search };

        const [entries, total] = await Promise.all([
            prisma.groceryEntry.findMany({
                where,
                include: {
                    category: true,
                    user: { select: { userId: true, displayName: true } },
                },
                orderBy: { purchaseDate: 'desc' },
                skip,
                take,
            }),
            prisma.groceryEntry.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                entries,
                pagination: {
                    page: parseInt(page),
                    limit: take,
                    total,
                    totalPages: Math.ceil(total / take),
                },
            },
        });
    } catch (error) {
        console.error('List entries error:', error);
        res.status(500).json({ success: false, error: 'Failed to load entries.' });
    }
});

// ─── POST /api/entries ───────────────────────────────────
// Create one or more entries (batch support)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        const created = [];

        for (const item of items) {
            const {
                name, amount, quantity, unit, categoryId,
                channel, purchaseDate, notes, scopeType, groupId,
            } = item;

            // Basic validation
            if (!name || !amount || !quantity || !unit || !categoryId || !channel || !purchaseDate) {
                res.status(400).json({ success: false, error: 'Missing required fields.' });
                return;
            }

            // If group scope, verify user is a member
            if (scopeType === 'GROUP' && groupId) {
                const membership = await prisma.groupMember.findFirst({
                    where: { groupId, userId: req.user!.id },
                });
                if (!membership) {
                    res.status(403).json({ success: false, error: 'You are not a member of this group.' });
                    return;
                }
            }

            const entry = await prisma.groceryEntry.create({
                data: {
                    name: name.trim(),
                    amount: parseFloat(amount),
                    quantity: parseFloat(quantity),
                    unit,
                    categoryId,
                    channel,
                    purchaseDate: new Date(purchaseDate),
                    notes: notes?.trim() || null,
                    scopeType: scopeType || 'PERSONAL',
                    groupId: scopeType === 'GROUP' ? groupId : null,
                    addedBy: req.user!.id,
                },
                include: {
                    category: true,
                    user: { select: { userId: true, displayName: true } },
                },
            });

            created.push(entry);
        }

        res.status(201).json({ success: true, data: created.length === 1 ? created[0] : created });
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ success: false, error: 'Failed to save entry.' });
    }
});

// ─── PUT /api/entries/:id ────────────────────────────────
// Update an existing entry
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Verify ownership
        const existing = await prisma.groceryEntry.findFirst({
            where: { id: req.params.id, addedBy: req.user!.id },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Entry not found.' });
            return;
        }

        const { name, amount, quantity, unit, categoryId, channel, purchaseDate, notes } = req.body;

        const updated = await prisma.groceryEntry.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name: name.trim() }),
                ...(amount && { amount: parseFloat(amount) }),
                ...(quantity && { quantity: parseFloat(quantity) }),
                ...(unit && { unit }),
                ...(categoryId && { categoryId }),
                ...(channel && { channel }),
                ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
                ...(notes !== undefined && { notes: notes?.trim() || null }),
            },
            include: {
                category: true,
                user: { select: { userId: true, displayName: true } },
            },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({ success: false, error: 'Failed to update entry.' });
    }
});

// ─── DELETE /api/entries/:id ─────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const existing = await prisma.groceryEntry.findFirst({
            where: { id: req.params.id, addedBy: req.user!.id },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Entry not found.' });
            return;
        }

        await prisma.groceryEntry.delete({ where: { id: req.params.id } });
        res.json({ success: true, data: { message: 'Entry deleted.' } });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete entry.' });
    }
});

export default router;
