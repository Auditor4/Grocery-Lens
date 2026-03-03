// ============================================================
// Category Routes — List, create, update, delete categories
// ============================================================

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ─── GET /api/categories ────────────────────────────────
// List categories: system defaults + user custom + group custom
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { groupId } = req.query as Record<string, string>;

        const categories = await prisma.category.findMany({
            where: {
                OR: [
                    { ownerType: 'SYSTEM' },                        // System defaults
                    { ownerType: 'USER', ownerId: req.user!.id },   // User's custom
                    ...(groupId ? [{ ownerType: 'GROUP' as const, ownerId: groupId }] : []),
                ],
            },
            orderBy: { sortOrder: 'asc' },
        });

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('List categories error:', error);
        res.status(500).json({ success: false, error: 'Failed to load categories.' });
    }
});

// ─── POST /api/categories ───────────────────────────────
// Create a custom category
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, icon, ownerType = 'USER', groupId } = req.body;

        if (!name || typeof name !== 'string') {
            res.status(400).json({ success: false, error: 'Category name is required.' });
            return;
        }

        // Get highest sort order
        const maxOrder = await prisma.category.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                icon: icon || '📦',
                sortOrder: (maxOrder?.sortOrder || 0) + 1,
                isDefault: false,
                ownerType: ownerType === 'GROUP' ? 'GROUP' : 'USER',
                ownerId: ownerType === 'GROUP' ? groupId : req.user!.id,
            },
        });

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, error: 'Failed to create category.' });
    }
});

// ─── PUT /api/categories/:id ────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, icon, sortOrder } = req.body;

        const existing = await prisma.category.findFirst({
            where: {
                id: req.params.id,
                OR: [
                    { ownerType: 'USER', ownerId: req.user!.id },
                    { ownerType: 'SYSTEM' },
                ],
            },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Category not found.' });
            return;
        }

        if (existing.isDefault && existing.ownerType === 'SYSTEM') {
            res.status(403).json({ success: false, error: 'Cannot edit system default categories.' });
            return;
        }

        const updated = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name: name.trim() }),
                ...(icon && { icon }),
                ...(sortOrder !== undefined && { sortOrder }),
            },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, error: 'Failed to update category.' });
    }
});

// ─── DELETE /api/categories/:id ─────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const existing = await prisma.category.findFirst({
            where: {
                id: req.params.id,
                ownerType: 'USER',
                ownerId: req.user!.id,
            },
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Category not found or cannot be deleted.' });
            return;
        }

        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ success: true, data: { message: 'Category deleted.' } });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete category.' });
    }
});

export default router;
